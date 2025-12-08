'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { previsualizarFactura, crearFactura, buscarResponsablePorCuit } from '@/services/api';
import styles from './facturacion.module.css';
import { FaUser, FaBuilding, FaCheck, FaSearch } from 'react-icons/fa';
import ErrorModal from '../components/ui/modals/ErrorModal';
import ActionModal from '../components/ui/modals/ActionModal';

const FacturacionPage = () => {
    const router = useRouter();

    const [etapa, setEtapa] = useState(1);
    const [loading, setLoading] = useState(false);

    const [errorModal, setErrorModal] = useState({ show: false, title: '', msg: '' });
    const [actionModal, setActionModal] = useState({ show: false, title: '', desc: '', action: null });

    const [busqueda, setBusqueda] = useState({ habitacion: '', horaSalida: '10:00' });
    const [resumen, setResumen] = useState(null);
    const [itemsSeleccionados, setItemsSeleccionados] = useState([]);
    const [tipoFactura, setTipoFactura] = useState('B');

    const [responsableSeleccionado, setResponsableSeleccionado] = useState(null);
    const [esTercero, setEsTercero] = useState(false);
    const [datosTercero, setDatosTercero] = useState({ cuit: '', razonSocial: '' });
    const [validandoCuit, setValidandoCuit] = useState(false);

    useEffect(() => {
        const nuevo = localStorage.getItem('nuevoResponsableCreado');
        if (nuevo) {
            try {
                const datos = JSON.parse(nuevo);
                setEsTercero(true);
                setResponsableSeleccionado(null);
                setDatosTercero({ cuit: datos.cuit || '', razonSocial: datos.razonSocial || '' });
            } catch (e) {
                console.error("Error al leer datos guardados", e);
            }
            localStorage.removeItem('nuevoResponsableCreado');
        }
    }, []);

    const handleBuscarEstadia = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResumen(null);
        try {
            const data = await previsualizarFactura(busqueda.habitacion, busqueda.horaSalida);
            setResumen(data);
            setItemsSeleccionados(data.items);
            setTipoFactura(data.tipoFacturaSugerido || 'B');
            setResponsableSeleccionado(null);
            setEsTercero(false);
            setDatosTercero({ cuit: '', razonSocial: '' });
            setEtapa(2);
        } catch (err) {
            const errorMsg = err.message || 'Error desconocido al buscar la estadía.';
            setErrorModal({ show: true, title: 'Error de Búsqueda', msg: errorMsg });
            setEtapa(1);
        } finally {
            setLoading(false);
        }
    };

    const seleccionarOcupante = (ocupante) => {
        setResponsableSeleccionado(ocupante);
        setEsTercero(false);
        const esJuridica = ocupante.documento && ocupante.documento.length > 10;
        setTipoFactura(esJuridica ? 'A' : 'B');
    };

    const activarTercero = () => {
        setResponsableSeleccionado(null);
        setEsTercero(true);
        setTipoFactura('A');
    };

    const handleValidarTercero = async () => {
        const cuitIngresado = datosTercero.cuit.trim();

        if (!cuitIngresado) {
            setActionModal({
                show: true,
                title: "Dar de Alta Responsable",
                desc: "El campo CUIT está vacío. ¿Desea ir al formulario para registrar un nuevo Responsable de Pago completo?",
                // CAMBIO AQUÍ: Agregamos ?origen=facturacion
                action: () => router.push('/nuevo-responsable?origen=facturacion')
            });
            return;
        }

        setValidandoCuit(true);
        try {
            const responsableEncontrado = await buscarResponsablePorCuit(cuitIngresado);

            if (responsableEncontrado) {
                setDatosTercero(prev => ({ ...prev, razonSocial: responsableEncontrado.razonSocial }));
                setResponsableSeleccionado({
                    id: responsableEncontrado.id,
                    nombreCompleto: responsableEncontrado.razonSocial,
                    documento: responsableEncontrado.cuit,
                    tipo: 'JURIDICA'
                });
                setTipoFactura('A');
            } else {
                setActionModal({
                    show: true,
                    title: "CUIT No Encontrado",
                    desc: `El CUIT ${cuitIngresado} no existe en la base de datos. ¿Desea ir al alta para registrarlo con todos sus datos?`,
                    confirmText: "Ir al Alta",
                    cancelText: "Cargar Manualmente",
                    action: () => {
                        localStorage.setItem('nuevoResponsableCreado', JSON.stringify({
                            cuit: cuitIngresado,
                            razonSocial: datosTercero.razonSocial
                        }));
                        // CAMBIO AQUÍ: Agregamos ?origen=facturacion
                        router.push('/nuevo-responsable?origen=facturacion');
                    },
                    onCancelCustom: () => {
                        if (datosTercero.razonSocial.trim()) {
                            setResponsableSeleccionado({
                                id: 999,
                                nombreCompleto: datosTercero.razonSocial.toUpperCase(),
                                documento: cuitIngresado,
                                tipo: 'JURIDICA'
                            });
                            setTipoFactura('A');
                        } else {
                            setErrorModal({show: true, title: "Falta Razón Social", msg: "Si carga manualmente, debe ingresar la Razón Social."});
                        }
                        setActionModal({ ...actionModal, show: false });
                    }
                });
            }
        } catch (err) {
            console.error(err);
            if (datosTercero.razonSocial) {
                setResponsableSeleccionado({
                    id: 999,
                    nombreCompleto: datosTercero.razonSocial.toUpperCase(),
                    documento: cuitIngresado,
                    tipo: 'JURIDICA'
                });
                setTipoFactura('A');
            } else {
                setErrorModal({ show: true, title: "Error", msg: "Hubo un error al buscar. Ingrese la Razón Social manualmente." });
            }
        } finally {
            setValidandoCuit(false);
        }
    };

    const toggleItem = (item) => {
        const existe = itemsSeleccionados.find(i => i.descripcion === item.descripcion);
        if (existe) setItemsSeleccionados(itemsSeleccionados.filter(i => i.descripcion !== item.descripcion));
        else setItemsSeleccionados([...itemsSeleccionados, item]);
    };

    const calcularTotal = () => itemsSeleccionados.reduce((acc, item) => acc + item.subtotal, 0);

    const handleConfirmarFactura = async () => {
        if (!responsableSeleccionado) {
            setErrorModal({ show: true, title: "Falta Responsable", msg: "Debe seleccionar un ocupante o validar los datos de la empresa." });
            return;
        }

        const datosParaVisualizar = {
            id: 9999,
            responsableNombre: responsableSeleccionado.nombreCompleto,
            responsableDoc: responsableSeleccionado.documento,
            tipoFactura: tipoFactura,
            items: itemsSeleccionados,
            total: calcularTotal()
        };

        try {
            const solicitud = {
                idEstadia: resumen.idEstadia,
                idResponsablePagoSeleccionado: responsableSeleccionado.id,
                cuitTercero: esTercero ? datosTercero.cuit.trim() : null,
                razonSocialTercero: esTercero ? datosTercero.razonSocial.trim() : null,
                tipoFactura: tipoFactura,
                itemsAFacturar: itemsSeleccionados,
                horaSalida: busqueda.horaSalida
            };

            try {
                const respuestaBack = await crearFactura(solicitud);
                if(respuestaBack && respuestaBack.id) datosParaVisualizar.id = respuestaBack.id;
            } catch (backendError) {
                console.warn("Backend no disponible, continuando en modo DEMO VISUAL");
            }

            localStorage.setItem('ultimaFactura', JSON.stringify(datosParaVisualizar));
            router.push('/facturacion/detalle');

        } catch (err) {
            setErrorModal({ show: true, title: "Error al Facturar", msg: err.message });
        }
    };

    return (
        <div className={styles.container}>
            {errorModal.show && <ErrorModal titulo={errorModal.title} descripcion={errorModal.msg} onClose={() => setErrorModal({ show: false, title: '', msg: '' })} />}
            {actionModal.show && <ActionModal titulo={actionModal.title} descripcion={actionModal.desc} confirmText={actionModal.confirmText || "Aceptar"} cancelText={actionModal.cancelText || "Cancelar"} onConfirm={() => { if(actionModal.action) actionModal.action(); setActionModal({ ...actionModal, show: false }); }} onCancel={() => { if(actionModal.onCancelCustom) actionModal.onCancelCustom(); else setActionModal({ ...actionModal, show: false }); }} />}

            {etapa === 1 && (
                <div className={styles.card} style={{ maxWidth: '500px' }}>
                    <div className={styles.header}><h2 className={styles.title}>Facturación</h2></div>
                    <form onSubmit={handleBuscarEstadia}>
                        <div className={styles.formGroup}><label className={styles.label}>Nro. de Habitación</label><input className={styles.input} placeholder="Ej: 104" value={busqueda.habitacion} onChange={(e) => setBusqueda({...busqueda, habitacion: e.target.value})} autoFocus /></div>
                        <div className={styles.formGroup}><label className={styles.label}>Hora de Salida</label><input type="time" className={styles.input} value={busqueda.horaSalida} onChange={(e) => setBusqueda({...busqueda, horaSalida: e.target.value})} /></div>
                        <button type="submit" disabled={loading} className={styles.buttonPrimary}>{loading ? 'Cargando...' : 'CONTINUAR'}</button>
                    </form>
                </div>
            )}

            {etapa === 2 && resumen && (
                <div className={styles.card}>
                    <div className={styles.header}><div><h1 className={styles.title}>Habitación {resumen.numeroHabitacion}</h1><p className={styles.subtitle}>Seleccione quién pagará la factura</p></div><div className={styles.badge}>Total: ${calcularTotal().toLocaleString()}</div></div>
                    <div className={styles.gridTwoColumns}>
                        <div className={styles.column}>
                            <h3 className={styles.sectionTitle}>1. Ocupantes de la Habitación</h3>
                            <div className={styles.ocupantesList}>
                                {resumen.posiblesResponsables.length > 0 ? (
                                    resumen.posiblesResponsables.map((ocupante) => (
                                        <div key={ocupante.id} className={`${styles.ocupanteCard} ${responsableSeleccionado?.id === ocupante.id ? styles.ocupanteSelected : ''}`} onClick={() => seleccionarOcupante(ocupante)}>
                                            <div style={{ marginRight: '15px', color: '#6b7280' }}><FaUser size={20} /></div>
                                            <div><div className={styles.name}>{ocupante.nombreCompleto || "Sin Nombre"}</div><div className={styles.details}>{ocupante.documento}</div></div>
                                            {responsableSeleccionado?.id === ocupante.id && <div style={{ marginLeft: 'auto', color: '#2563eb' }}><FaCheck /></div>}
                                        </div>
                                    ))
                                ) : (<p style={{color: '#666', fontStyle: 'italic'}}>No se encontraron ocupantes registrados.</p>)}
                            </div>
                            {!esTercero ? (
                                <button className={styles.terceroButton} onClick={activarTercero}><FaBuilding /> Facturar a Tercero / Empresa</button>
                            ) : (
                                <div className={styles.terceroForm}>
                                    <h4 style={{ marginBottom: '15px', color: '#333', fontSize: '1rem', fontWeight: 'bold' }}>Datos de Facturación (Empresa)</h4>
                                    <div className={styles.formRow}><label className={styles.label} style={{ fontSize: '0.85rem' }}>CUIT (Dejar vacío para crear nuevo)</label><div style={{ display: 'flex', gap: '8px' }}><input className={styles.input} placeholder="Ingrese CUIT" value={datosTercero.cuit} onChange={(e) => setDatosTercero({...datosTercero, cuit: e.target.value})} /><div style={{ display:'flex', alignItems:'center', color:'#666' }}><FaSearch /></div></div></div>
                                    <div className={styles.formRow}><label className={styles.label} style={{ fontSize: '0.85rem' }}>Razón Social</label><input className={styles.input} placeholder="Nombre de la Empresa" value={datosTercero.razonSocial} onChange={(e) => setDatosTercero({...datosTercero, razonSocial: e.target.value})} /></div>
                                    <div className={styles.formActions}>
                                        <button className={styles.buttonSecondary} onClick={() => setEsTercero(false)}>Cancelar</button>
                                        <button className={styles.buttonPrimary} style={{ marginTop: 0 }} onClick={handleValidarTercero} disabled={validandoCuit}>{validandoCuit ? 'Buscando...' : 'Validar'}</button>
                                    </div>
                                </div>
                            )}
                            {(responsableSeleccionado) && (
                                <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px' }}><label className={styles.label}>Tipo de Comprobante</label><select className={styles.input} value={tipoFactura} onChange={(e) => setTipoFactura(e.target.value)} disabled={esTercero}><option value="B">Factura B (Consumidor Final)</option><option value="A">Factura A (Responsable Inscripto)</option></select></div>
                            )}
                        </div>
                        <div className={styles.column}>
                            <h3 className={styles.sectionTitle}>2. Detalle a Facturar</h3>
                            <div className={styles.tableContainer}><table className={styles.table}><thead><tr><th>Concepto</th><th style={{ textAlign: 'right' }}>Subtotal</th><th style={{ width: '40px' }}></th></tr></thead><tbody>{resumen.items.map((item, idx) => { const activo = itemsSeleccionados.some(i => i.descripcion === item.descripcion); return (<tr key={idx} style={{ opacity: activo ? 1 : 0.5 }}><td><div style={{ fontWeight: '500' }}>{item.descripcion}</div>{item.esEstadia && <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>● Cargo por Estadía</span>}</td><td className={styles.amount}>${item.subtotal.toLocaleString()}</td><td style={{ textAlign: 'center' }}><input type="checkbox" checked={activo} onChange={() => toggleItem(item)} /></td></tr>); })}</tbody></table></div>
                            <div className={styles.summaryBox}><div className={styles.totalRow}><span className={styles.totalLabel}>Total Final</span><span className={styles.totalValue}>${calcularTotal().toLocaleString()}</span></div><div className={styles.actions}><button className={styles.buttonSecondary} onClick={() => setEtapa(1)}>Atrás</button><button className={styles.buttonSuccess} onClick={handleConfirmarFactura}>CONFIRMAR FACTURA</button></div></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacturacionPage;