'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { buscarFacturasPendientes, registrarPago } from '../../services/api';
import styles from './pagos.module.css';
import { FaSearch, FaMoneyBillWave, FaCheck, FaArrowLeft } from 'react-icons/fa';
import SuccessModal from '../components/ui/modals/SuccessModal';
import ErrorModal from '../components/ui/modals/ErrorModal';

export default function IngresarPagoPage() {
    const router = useRouter();

    const [habitacion, setHabitacion] = useState('');
    const [facturas, setFacturas] = useState([]);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

    const [medioPago, setMedioPago] = useState('EFECTIVO');
    const [monto, setMonto] = useState('');

    // CAMBIO 1: Agregamos 'cuotas' al estado inicial (por defecto 1)
    const [datosExtra, setDatosExtra] = useState({
        numeroTarjeta: '',
        nombreTarjeta: 'VISA',
        cuotas: 1,
        nroCheque: '',
        banco: '',
        plaza: '',
        fechaCobro: ''
    });

    const montoRef = useRef(null);
    const tarjetaRef = useRef(null);
    const nroChequeRef = useRef(null);
    const bancoRef = useRef(null);
    const plazaRef = useRef(null);
    const fechaChequeRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ type: null, msg: '' });

    const getNombreResponsable = (responsable) => {
        if (!responsable) return 'Desconocido';
        if (responsable.razonSocial) return responsable.razonSocial;
        if (responsable.nombre || responsable.apellido) {
            return `${responsable.apellido || ''} ${responsable.nombre || ''}`.trim();
        }
        return 'Sin Nombre Registrado';
    };

    const handleKeyDown = (e) => {
        if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
        }
    };

    const validarCampos = () => {
        let errores = [];
        let primerInputFaltante = null;

        if (!monto || parseFloat(monto) <= 0) {
            errores.push("El monto a abonar es obligatorio.");
            if (!primerInputFaltante) primerInputFaltante = montoRef;
        }

        if (medioPago.includes('TARJETA')) {
            if (!datosExtra.numeroTarjeta || datosExtra.numeroTarjeta.length < 4) {
                errores.push("Debe ingresar los últimos 4 números de la tarjeta.");
                if (!primerInputFaltante) primerInputFaltante = tarjetaRef;
            }
        }

        if (medioPago === 'CHEQUE') {
            if (!datosExtra.nroCheque) {
                errores.push("Falta el Número de Cheque.");
                if (!primerInputFaltante) primerInputFaltante = nroChequeRef;
            }
            if (!datosExtra.banco) {
                errores.push("Falta el nombre del Banco.");
                if (!primerInputFaltante) primerInputFaltante = bancoRef;
            }
            if (!datosExtra.plaza) {
                errores.push("Falta la Plaza del cheque.");
                if (!primerInputFaltante) primerInputFaltante = plazaRef;
            }
            if (!datosExtra.fechaCobro) {
                errores.push("Falta la Fecha de Cobro del cheque.");
                if (!primerInputFaltante) primerInputFaltante = fechaChequeRef;
            }
        }

        if (errores.length > 0) {
            setModal({ type: 'error', msg: errores.join('\n') });
            if (primerInputFaltante && primerInputFaltante.current) {
                primerInputFaltante.current.focus();
                primerInputFaltante.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        return true;
    };

    const handleBuscar = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFacturas([]);
        setFacturaSeleccionada(null);
        try {
            const data = await buscarFacturasPendientes(habitacion);
            if (data.length === 0) {
                setModal({ type: 'error', msg: 'No hay facturas pendientes para esa habitación.' });
            } else {
                setFacturas(data);
            }
        } catch (err) {
            setModal({ type: 'error', msg: err.message });
        } finally {
            setLoading(false);
        }
    };

    const seleccionarFactura = (factura) => {
        setFacturaSeleccionada(factura);
        const saldoReal = factura.saldoPendiente !== undefined ? factura.saldoPendiente : factura.montoTotal;
        setMonto(saldoReal);

        // CAMBIO 2: Reseteamos también las cuotas al seleccionar nueva factura
        setDatosExtra({
            numeroTarjeta: '', nombreTarjeta: 'VISA', cuotas: 1,
            nroCheque: '', banco: '', plaza: '', fechaCobro: ''
        });
    };

    const handlePagar = async (e) => {
        e.preventDefault();
        if (!validarCampos()) return;
        setLoading(true);
        try {
            const dto = {
                idFactura: facturaSeleccionada.id,
                tipoMedioPago: medioPago,
                monto: parseFloat(monto),
                moneda: 'PESOS',
                ...datosExtra // Esto enviará 'cuotas' automáticamente si está en el estado
            };

            const facturaActualizada = await registrarPago(dto);

            if (facturaActualizada.estado === 'PAGADA') {
                setModal({ type: 'success', msg: `¡Factura Saldada Completamente!` });
                setFacturaSeleccionada(null);
                setFacturas(prev => prev.filter(f => f.id !== facturaActualizada.id));
            } else {
                setModal({ type: 'success', msg: 'Pago parcial registrado. La factura sigue pendiente por el saldo restante.' });
                setFacturaSeleccionada(null);
                setFacturas(prev => prev.filter(f => f.id !== facturaActualizada.id));
            }
        } catch (err) {
            setModal({ type: 'error', msg: err.message });
        } finally {
            setLoading(false);
        }
    };

    const getMontoVisible = (f) => {
        return f.saldoPendiente !== undefined ? f.saldoPendiente : f.montoTotal;
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>INGRESAR PAGO</h1>

                {!facturaSeleccionada && (
                    <div>
                        <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <div className={styles.fieldWrapper} style={{ flex: 1 }}>
                                <label className={styles.label}>Nro. Habitación</label>
                                <input
                                    type="number"
                                    className={styles.inputField}
                                    value={habitacion}
                                    onChange={e => setHabitacion(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ej: 104"
                                    autoFocus
                                    min="1"
                                />
                            </div>
                            <button type="submit" className={`${styles.button} ${styles.submitButton}`} disabled={loading} style={{ width: 'auto', marginTop: '24px' }}>
                                <FaSearch /> BUSCAR
                            </button>
                        </form>

                        {facturas.length > 0 && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                    <thead>
                                    <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                                        <th style={{ padding: '12px' }}>N° Factura</th>
                                        <th>Responsable</th>
                                        <th>Saldo a Pagar</th>
                                        <th style={{ textAlign: 'center' }}>Acción</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {facturas.map(f => (
                                        <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>{String(f.id).padStart(8, '0')}</td>
                                            <td style={{ fontWeight: '500' }}>{getNombreResponsable(f.responsableDePago)}</td>
                                            <td style={{ fontWeight: 'bold', color: '#dc2626' }}>
                                                ${getMontoVisible(f).toLocaleString()}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => seleccionarFactura(f)}
                                                    className={`${styles.button} ${styles.submitButton}`}
                                                    style={{ margin: 0, padding: '8px 16px', width: 'auto', fontSize: '0.9rem' }}
                                                >
                                                    <FaMoneyBillWave /> PAGAR
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {facturaSeleccionada && (
                    <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1f2937' }}>Factura N° {String(facturaSeleccionada.id).padStart(8, '0')}</h3>
                                <p style={{ margin: '5px 0', color: '#6b7280', fontSize: '0.9rem' }}>
                                    Titular: <strong>{getNombreResponsable(facturaSeleccionada.responsableDePago)}</strong>
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total a Pagar</span>
                                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#dc2626' }}>
                                    ${getMontoVisible(facturaSeleccionada).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handlePagar}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className={styles.fieldWrapper}>
                                    <label className={styles.label}>Medio de Pago</label>
                                    <select
                                        className={styles.inputField}
                                        value={medioPago}
                                        onChange={e => setMedioPago(e.target.value)}
                                    >
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                                        <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>

                                <div className={styles.fieldWrapper}>
                                    <label className={styles.label}>Monto a Abonar</label>
                                    <input
                                        ref={montoRef}
                                        type="number"
                                        className={styles.inputField}
                                        value={monto}
                                        onChange={e => setMonto(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* SECCIÓN TARJETAS */}
                            {medioPago.includes('TARJETA') && (
                                <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Red / Emisor</label>
                                        <select
                                            className={styles.inputField}
                                            value={datosExtra.nombreTarjeta}
                                            onChange={e => setDatosExtra({...datosExtra, nombreTarjeta: e.target.value})}
                                        >
                                            <option value="VISA">VISA</option>
                                            <option value="MASTERCARD">MASTERCARD</option>
                                            <option value="CABAL">CABAL</option>
                                        </select>
                                    </div>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Últimos 4 dígitos</label>
                                        <input
                                            ref={tarjetaRef}
                                            type="text"
                                            maxLength="4"
                                            className={styles.inputField}
                                            placeholder="xxxx"
                                            value={datosExtra.numeroTarjeta}
                                            onChange={e => setDatosExtra({...datosExtra, numeroTarjeta: e.target.value})}
                                            onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') e.preventDefault(); }}
                                        />
                                    </div>

                                    {/* CAMBIO 3: Desplegable de CUOTAS (Solo visible si es Tarjeta de Crédito) */}
                                    {medioPago === 'TARJETA_CREDITO' && (
                                        <div className={styles.fieldWrapper}>
                                            <label className={styles.label}>Cuotas</label>
                                            <select
                                                className={styles.inputField}
                                                value={datosExtra.cuotas}
                                                onChange={e => setDatosExtra({...datosExtra, cuotas: parseInt(e.target.value)})}
                                            >
                                                <option value={1}>1 Cuota</option>
                                                <option value={3}>3 Cuotas</option>
                                                <option value={6}>6 Cuotas</option>
                                                <option value={12}>12 Cuotas</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {medioPago === 'CHEQUE' && (
                                <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Banco</label>
                                        <input
                                            ref={bancoRef}
                                            type="text"
                                            className={styles.inputField}
                                            placeholder="Ej: Banco Nación"
                                            value={datosExtra.banco}
                                            onChange={e => setDatosExtra({...datosExtra, banco: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Nro. Cheque</label>
                                        <input
                                            ref={nroChequeRef}
                                            type="number"
                                            className={styles.inputField}
                                            placeholder="Número"
                                            value={datosExtra.nroCheque}
                                            onChange={e => setDatosExtra({...datosExtra, nroCheque: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Plaza</label>
                                        <input
                                            ref={plazaRef}
                                            type="text"
                                            className={styles.inputField}
                                            placeholder="Ej: Buenos Aires"
                                            value={datosExtra.plaza}
                                            onChange={e => setDatosExtra({...datosExtra, plaza: e.target.value})}
                                        />
                                    </div>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Fecha de Cobro</label>
                                        <input
                                            ref={fechaChequeRef}
                                            type="date"
                                            className={styles.inputField}
                                            value={datosExtra.fechaCobro}
                                            onChange={e => setDatosExtra({...datosExtra, fechaCobro: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={styles.buttonContainer} style={{ marginTop: '30px' }}>
                                <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={() => setFacturaSeleccionada(null)}>
                                    <FaArrowLeft /> VOLVER
                                </button>
                                <button type="submit" className={`${styles.button} ${styles.submitButton}`} disabled={loading}>
                                    {loading ? 'PROCESANDO...' : <><FaCheck /> CONFIRMAR PAGO</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {modal.type === 'success' && <SuccessModal titulo="Operación Exitosa" descripcion={modal.msg} onClose={() => setModal({ type: null })} />}
            {modal.type === 'error' && <ErrorModal titulo="Atención" descripcion={modal.msg} onClose={() => setModal({ type: null })} />}
        </div>
    );
}