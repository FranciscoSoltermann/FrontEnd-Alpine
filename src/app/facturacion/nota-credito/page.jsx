'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaSearch, FaArrowLeft, FaCheckCircle, FaFileInvoiceDollar } from 'react-icons/fa';
import styles from './notaCredito.module.css';
import { buscarFacturasPorCliente, generarNotaCredito } from '@/services/api';

export default function NotaCreditoPage() {
    const router = useRouter();

    // Estados de control
    const [etapa, setEtapa] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Datos
    const [documentoBusqueda, setDocumentoBusqueda] = useState('');
    const [facturasEncontradas, setFacturasEncontradas] = useState([]);
    const [facturasSeleccionadas, setFacturasSeleccionadas] = useState([]);
    const [notaCreditoGenerada, setNotaCreditoGenerada] = useState(null);

    // --- Lógica de Formateo ---
    const formatCurrency = (valor) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
    };

    const formatDate = (dateString) => {
        if(!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-AR');
    };

    // --- Handlers ---

    // Validación en tiempo real para solo permitir números
    const handleChangeDocumento = (e) => {
        const valor = e.target.value;
        if (/^\d*$/.test(valor)) {
            setDocumentoBusqueda(valor);
            setError('');
        } else {
            setError('Solo se permiten números (DNI o CUIT sin guiones).');
        }
    };

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (!documentoBusqueda.trim()) {
            setError('Ingrese un DNI o CUIT para buscar.');
            return;
        }

        if (documentoBusqueda.length < 7) {
            setError('El documento ingresado parece demasiado corto.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const data = await buscarFacturasPorCliente(documentoBusqueda.trim());
            setFacturasEncontradas(data);
            setFacturasSeleccionadas([]);
            setEtapa(2);
        } catch (err) {
            setError(err.message);
            setFacturasEncontradas([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSeleccionFactura = (idFactura) => {
        if (facturasSeleccionadas.includes(idFactura)) {
            setFacturasSeleccionadas(facturasSeleccionadas.filter(id => id !== idFactura));
        } else {
            setFacturasSeleccionadas([...facturasSeleccionadas, idFactura]);
        }
    };

    const calcularTotalSeleccionado = () => {
        return facturasEncontradas
            .filter(f => facturasSeleccionadas.includes(f.id))
            .reduce((acc, curr) => acc + curr.montoTotal, 0);
    };

    const handleGenerarNotaCredito = async () => {
        if (facturasSeleccionadas.length === 0) {
            setError('Debe seleccionar al menos una factura para anular.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const nc = await generarNotaCredito(facturasSeleccionadas);
            setNotaCreditoGenerada(nc);
            setEtapa(3);
        } catch (err) {
            setError(err.message || 'Error al generar la nota de crédito.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEtapa(1);
        setDocumentoBusqueda('');
        setFacturasEncontradas([]);
        setFacturasSeleccionadas([]);
        setNotaCreditoGenerada(null);
        setError('');
    };

    return (
        <div className={styles.container}>

            <div className={styles.card}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h1 className={styles.title}>
                        <FaFileInvoiceDollar /> Generar Nota de Crédito
                    </h1>
                    {/* CAMBIO AQUÍ: Se usa styles.buttonOrange */}
                    <Link href="/dashboard" className={styles.buttonOrange}>
                        <FaArrowLeft /> Volver al Menu
                    </Link>
                </div>
                <p style={{color: '#64748b'}}>Anulación de facturas emitidas mediante Nota de Crédito.</p>

                {error && <div className={styles.errorMsg}>{error}</div>}

                {/* ================= ETAPA 1: BUSCADOR ================= */}
                {etapa === 1 && (
                    <div style={{marginTop: '2rem'}}>
                        <p>Ingrese el DNI o CUIT del cliente para buscar facturas activas (no anuladas).</p>
                        <form onSubmit={handleBuscar} className={styles.searchBox} style={{marginTop: '1rem'}}>
                            <input
                                type="text"
                                placeholder="Ej: 20123456789 o 35999888"
                                className={styles.searchInput}
                                value={documentoBusqueda}
                                onChange={handleChangeDocumento}
                                maxLength={11}
                                autoFocus
                            />
                            <button type="submit" className={styles.buttonPrimary} disabled={loading}>
                                {loading ? 'Buscando...' : <><FaSearch /> BUSCAR FACTURAS</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* ================= ETAPA 2: GRILLA DE SELECCIÓN ================= */}
                {etapa === 2 && facturasEncontradas.length > 0 && (
                    <div style={{marginTop: '2rem'}}>
                        <h3>Facturas encontradas para: {documentoBusqueda}</h3>
                        <p style={{fontSize: '0.9rem', color: '#64748b'}}>Seleccione las facturas que desea anular.</p>

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    <th style={{textAlign: 'center'}}>Sel.</th>
                                    <th>N° Factura</th>
                                    <th>Fecha Emisión</th>
                                    <th style={{textAlign: 'center'}}>Tipo</th>
                                    <th>Responsable</th>
                                    <th style={{textAlign: 'right'}}>Monto Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {facturasEncontradas.map((factura) => (
                                    <tr key={factura.id}>
                                        <td style={{textAlign: 'center'}}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={facturasSeleccionadas.includes(factura.id)}
                                                onChange={() => toggleSeleccionFactura(factura.id)}
                                            />
                                        </td>
                                        <td>{String(factura.id).padStart(8, '0')}</td>
                                        <td>{formatDate(factura.fechaEmision)}</td>
                                        <td style={{textAlign: 'center', fontWeight: 'bold'}}>{factura.tipoFactura}</td>
                                        <td>
                                            {factura.responsableNombre || "Cliente"} <br/>
                                            <small style={{color: '#64748b'}}>{factura.responsableDoc}</small>
                                        </td>
                                        <td style={{textAlign: 'right', fontWeight: 'bold', color: '#0f172a'}}>
                                            {formatCurrency(factura.montoTotal)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.summaryBox}>
                            <div>
                                Facturas seleccionadas: <strong>{facturasSeleccionadas.length}</strong>
                            </div>
                            <div>
                                <span className={styles.totalLabel}>Total a Anular: </span>
                                <span className={styles.totalValue}>{formatCurrency(calcularTotalSeleccionado())}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            {/* Este botón se mantiene gris (Secondary) */}
                            <button className={styles.buttonSecondary} onClick={() => setEtapa(1)} disabled={loading}>
                                Atrás
                            </button>
                            <button
                                className={styles.buttonDanger}
                                onClick={handleGenerarNotaCredito}
                                disabled={loading || facturasSeleccionadas.length === 0}
                            >
                                {loading ? 'Procesando...' : 'GENERAR NOTA DE CRÉDITO'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ================= ETAPA 3: ÉXITO ================= */}
            {etapa === 3 && notaCreditoGenerada && (
                <div className={styles.card + ' ' + styles.successContainer}>
                    <FaCheckCircle className={styles.successIcon} />
                    <h2 style={{color: '#1e293b'}}>¡Nota de Crédito Generada con Éxito!</h2>
                    <p>Las facturas seleccionadas han sido anuladas correctamente.</p>

                    <div className={styles.ncDetails}>
                        <h3 style={{borderBottom: '2px solid #cbd5e1', paddingBottom: '10px', marginBottom: '15px'}}>
                            Detalle del Comprobante
                        </h3>
                        <p><strong>N° Nota de Crédito:</strong> {String(notaCreditoGenerada.id).padStart(8, '0')}</p>
                        <p><strong>Fecha Emisión:</strong> {formatDate(notaCreditoGenerada.fechaEmision)}</p>
                        <p><strong>Facturas Anuladas:</strong> {notaCreditoGenerada.facturasCanceladas?.length}</p>
                        <div style={{marginTop: '1.5rem', borderTop: '1px solid #cbd5e1', paddingTop: '1rem', textAlign: 'right'}}>
                            <span style={{fontSize: '1.2rem'}}>Total Nota de Crédito:</span><br/>
                            <span className={styles.totalValue} style={{fontSize: '2rem'}}>
                                 {formatCurrency(notaCreditoGenerada.montoTotal)}
                             </span>
                        </div>
                    </div>

                    <div className={styles.actions} style={{justifyContent: 'center'}}>
                        {/* Este botón se mantiene gris (Secondary) */}
                        <button className={styles.buttonSecondary} onClick={() => window.print()}>
                            <FaFileInvoiceDollar /> Imprimir Comprobante
                        </button>
                        <button className={styles.buttonPrimary} onClick={resetForm}>
                            Realizar Nueva Operación
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}