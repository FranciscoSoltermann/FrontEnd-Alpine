'use client';

import { useState } from 'react';

// --- IMPORTS ---
import ProtectedRoute from '../components/layout/ProtectedRoute';
import ErrorModal from '../components/ui/modals/ErrorModal';
import SuccessModal from '../components/ui/modals/SuccessModal';
import ActionModal from '../components/ui/modals/ActionModal';
import styles from './reserva.module.css';

// URL de tu API
const API_URL = "http://localhost:8080/api";

export default function ReservasPage() {

    // --- ESTADOS ---
    const [step, setStep] = useState(1);

    // NUEVO: Estado para saber qué botón apretó el usuario
    const [accionTipo, setAccionTipo] = useState('RESERVAR'); // 'RESERVAR' o 'OCUPAR'

    // Datos dinámicos
    const [habitaciones, setHabitaciones] = useState([]);
    const [matrixData, setMatrixData] = useState([]);
    const [daysRange, setDaysRange] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selección Múltiple
    const [selectedCells, setSelectedCells] = useState([]);

    // Modales
    const [errorModal, setErrorModal] = useState({ isOpen: false, titulo: '', descripcion: '' });
    const [successModal, setSuccessModal] = useState({ isOpen: false, titulo: '', descripcion: '' });
    const [actionModal, setActionModal] = useState({ isOpen: false, titulo: '', descripcion: '' });

    // Filtros
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // Datos Formulario
    const [tipoDoc, setTipoDoc] = useState('DNI');
    const [numDoc, setNumDoc] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');

    // ======================
    //   1. BUSCAR DISPONIBILIDAD
    // ======================
    const handleBuscar = async () => {
        if (!fechaDesde) return showError('Faltan datos', 'Por favor seleccione la fecha "Desde".');
        if (!fechaHasta) return showError('Faltan datos', 'Por favor seleccione la fecha "Hasta".');

        const fDesde = new Date(fechaDesde);
        const fHasta = new Date(fechaHasta);
        const fDesdeAjustada = new Date(fDesde.getTime() + fDesde.getTimezoneOffset() * 60000);

        if (fDesde > fHasta) return showError('Fecha inválida', 'La fecha de ingreso no puede ser posterior a la fecha de salida.');

        setLoading(true);

        try {
            const queryParams = new URLSearchParams({ desde: fechaDesde, hasta: fechaHasta });
            const res = await fetch(`${API_URL}/habitaciones/estado?${queryParams}`);

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                throw new Error(errorBody?.mensaje || "Error al obtener disponibilidad.");
            }

            const dataBackend = await res.json();

            const dias = [];
            let currentDia = new Date(fDesdeAjustada);
            while (currentDia <= fHasta) {
                dias.push(new Date(currentDia).toISOString().split('T')[0]);
                currentDia.setDate(currentDia.getDate() + 1);
            }
            setDaysRange(dias);

            const dataOrdenada = dataBackend.sort((a, b) =>
                String(a.numero).localeCompare(String(b.numero), undefined, { numeric: true })
            );

            setHabitaciones(dataOrdenada);
            setMatrixData(dataOrdenada);

            setStep(2);
            setSelectedCells([]);

        } catch (e) {
            console.error(e);
            showError('Error de Servidor', e.message);
        } finally {
            setLoading(false);
        }
    };

    // ======================
    //   SELECCIÓN DE CELDAS
    // ======================
    const handleCellClick = (habId, fecha, estado, tipoHabitacion, numero) => {
        if (estado !== 'DISPONIBLE') return;

        setSelectedCells(prev => {
            const exists = prev.find(item => item.habId === habId && item.fecha === fecha);
            if (exists) {
                return prev.filter(item => item !== exists);
            } else {
                return [...prev, { habId, fecha, tipoHabitacion, numero }];
            }
        });
    };

    // ======================
    //   NAVEGACIÓN Y CONFIRMACIÓN
    // ======================

    // NUEVO: Función genérica para ir al paso 3 dependiendo de la acción
    const handleIniciarProceso = (tipoAccion) => {
        if (selectedCells.length === 0) {
            return showError('Selección requerida', "Por favor, seleccione al menos una celda 'Disponible'.");
        }
        setAccionTipo(tipoAccion); // Guardamos si es 'RESERVAR' u 'OCUPAR'
        setStep(3);
    };

    const handlePreConfirmar = () => {
        if (!nombre || !apellido || !numDoc) return showError('Datos incompletos', "Complete los datos obligatorios.");

        // Texto dinámico según la acción
        const accionTexto = accionTipo === 'OCUPAR' ? 'ocupar' : 'reservar';
        const tituloTexto = accionTipo === 'OCUPAR' ? 'Confirmar Ocupación' : 'Confirmar Reserva';

        const msg = selectedCells.length === 1
            ? `¿Desea ${accionTexto} la habitación ${selectedCells[0].numero} para el día ${selectedCells[0].fecha}?`
            : `¿Desea confirmar la acción para ${selectedCells.length} días seleccionados?`;

        showConfirmAction(tituloTexto, msg);
    };

    const handleConfirmarReal = async () => {
        closeAction();

        const fechas = selectedCells.map(s => s.fecha).sort();
        const ingreso = fechas[0];
        const egreso = fechas[fechas.length - 1];
        const habitacionesIds = Array.from(new Set(selectedCells.map(s => s.habId)));

        const reservaRequest = {
            ingreso: ingreso,
            egreso: egreso,
            huesped: { tipoDocumento: tipoDoc, documento: numDoc, nombre, apellido, telefono },
            habitaciones: habitacionesIds
        };

        try {
            // NUEVO: Decidimos el endpoint según el botón que se apretó
            const endpoint = accionTipo === 'OCUPAR' ? '/reservas/ocupar' : '/reservas';

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservaRequest)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.mensaje || errorData.message || "Error al procesar.");
            }

            const exitoMsg = accionTipo === 'OCUPAR'
                ? '¡Habitación Ocupada! El Check-in se realizó con éxito.'
                : '¡Reserva creada con éxito!';

            showSuccess('¡Éxito!', exitoMsg);
        } catch (error) {
            console.error(error);
            showError('Error', error.message);
        }
    };

    // --- UTILIDADES ---
    const showError = (titulo, desc) => setErrorModal({ isOpen: true, titulo, descripcion: desc });
    const closeError = () => setErrorModal({ ...errorModal, isOpen: false });
    const showSuccess = (titulo, desc) => setSuccessModal({ isOpen: true, titulo, descripcion: desc });
    const closeSuccess = () => { setSuccessModal({ ...successModal, isOpen: false }); resetFormularioCompleto(); };
    const showConfirmAction = (titulo, desc) => setActionModal({ isOpen: true, titulo, descripcion: desc });
    const closeAction = () => setActionModal({ ...actionModal, isOpen: false });

    const resetFormularioCompleto = () => {
        setStep(1);
        setSelectedCells([]);
        setNombre(''); setApellido(''); setTelefono(''); setNumDoc('');
        setAccionTipo('RESERVAR'); // Resetear acción por defecto
    };

    const getHabId = (hab) => hab.idHabitacion || hab.id;

    return (
        <ProtectedRoute>
            {errorModal.isOpen && <ErrorModal titulo={errorModal.titulo} descripcion={errorModal.descripcion} onClose={closeError} />}
            {successModal.isOpen && <SuccessModal titulo={successModal.titulo} descripcion={successModal.descripcion} onClose={closeSuccess} />}
            {actionModal.isOpen && <ActionModal titulo={actionModal.titulo} descripcion={actionModal.descripcion} onCancel={closeAction} onConfirm={handleConfirmarReal} confirmText="Aceptar" />}

            <div className={styles.container}>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className={styles.title} style={{marginTop:'10px'}}>DISPONIBILIDAD DE HABITACIONES</h1>
                </div>

                <div className={styles.formContainer}>
                    {/* --- PASO 1: FILTROS (Sin cambios) --- */}
                    <div className={styles.gridTop}>
                        <div className={styles.fieldWrapper}>
                            <label>Desde Fecha</label>
                            <input type="date" className={styles.input} value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} disabled={step > 1 || loading} />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <label>Hasta Fecha</label>
                            <input type="date" className={styles.input} value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} disabled={step > 1 || loading} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                            {step === 1 && (
                                <button className={styles.btnBuscar} onClick={handleBuscar} disabled={loading}>
                                    {loading ? "CARGANDO..." : "BUSCAR"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* --- PASO 2: MATRIZ DE ESTADO --- */}
                    {step === 2 && (
                        <div className="animate-fadeIn">
                            <div className={styles.topActions}>
                                <div style={{flex: 1, display: 'flex', alignItems: 'center'}}>
                                    {selectedCells.length > 0 && (
                                        <span style={{fontWeight:'bold', color:'#2196f3'}}>
                                            {selectedCells.length} día(s) seleccionado(s)
                                        </span>
                                    )}
                                </div>
                                <button className={styles.btnVolverOrange} onClick={() => setStep(1)}>VOLVER</button>

                                {/* NUEVO: BOTÓN OCUPAR (Azul) */}
                                <button className={styles.btnOcuparBlue} onClick={() => handleIniciarProceso('OCUPAR')}>
                                    OCUPAR ({selectedCells.length})
                                </button>

                                {/* BOTÓN RESERVAR EXISTENTE (Verde) */}
                                <button className={styles.btnReservarGreen} onClick={() => handleIniciarProceso('RESERVAR')}>
                                    RESERVAR ({selectedCells.length})
                                </button>
                            </div>

                            {/* TABLA (Sin cambios en lógica de renderizado) */}
                            <div className={styles.tableWrapper}>
                                <table className={styles.matrixTable}>
                                    <thead>
                                    <tr>
                                        <th className={styles.stickyCol}>Fecha / Habitación</th>
                                        {habitaciones.map(hab => (
                                            <th key={getHabId(hab)}>
                                                {hab.tipo} <br/>
                                                <small style={{fontSize:'0.85em', color:'#555'}}>Hab. {hab.numero}</small>
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {daysRange.map((fecha) => (
                                        <tr key={fecha}>
                                            <td className={styles.stickyCol}><strong>{fecha}</strong></td>
                                            {matrixData.map(hab => {
                                                const infoDia = hab.estadosPorDia ? hab.estadosPorDia.find(d => d.fecha === fecha) : null;
                                                const estado = infoDia ? infoDia.estado : 'DISPONIBLE';
                                                const currentId = getHabId(hab);
                                                const isSelected = selectedCells.some(
                                                    cell => cell.habId === currentId && cell.fecha === fecha
                                                );
                                                const isMantenimiento = estado === 'MANTENIMIENTO';

                                                return (
                                                    <td key={`${currentId}-${fecha}`} className={styles.cellCenter}>
                                                        <div
                                                            className={`
                                                                    ${styles.checkboxSquare} 
                                                                    ${styles[estado] || styles.DISPONIBLE} 
                                                                    ${isSelected ? styles.selected : ''}
                                                                `}
                                                            onClick={() => handleCellClick(currentId, fecha, estado, hab.tipo, hab.numero)}
                                                            title={`Hab ${hab.numero}: ${estado}`}
                                                            style={isMantenimiento ? {
                                                                backgroundColor: '#E0E0E0', borderColor: '#BDBDBD', cursor: 'not-allowed', color: '#9E9E9E'
                                                            } : {}}
                                                        >
                                                            {isSelected ? (
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                </svg>
                                                            ) : estado === 'DISPONIBLE' ? (
                                                                <span style={{opacity:0.2}}>+</span>
                                                            ) : (
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.legendContainer}>
                                {/* Leyendas (Sin cambios) */}
                                <div className={styles.legendItem}><div className={`${styles.checkboxSquare} ${styles.DISPONIBLE}`} style={{width:20, height:20, cursor:'default'}}></div><span>Disponible</span></div>
                                <div className={styles.legendItem}><div className={`${styles.checkboxSquare} ${styles.OCUPADA}`} style={{width:20, height:20, cursor:'default'}}></div><span>Ocupada</span></div>
                                <div className={styles.legendItem}><div className={`${styles.checkboxSquare} ${styles.RESERVADA}`} style={{width:20, height:20, cursor:'default'}}></div><span>Reservada</span></div>
                                <div className={styles.legendItem}><div className={`${styles.checkboxSquare} ${styles.MANTENIMIENTO}`} style={{width:20, height:20, cursor:'default', backgroundColor: '#E0E0E0', borderColor: '#BDBDBD'}}></div><span>Mantenimiento</span></div>
                            </div>
                        </div>
                    )}

                    {/* --- PASO 3: FORMULARIO --- */}
                    {step === 3 && (
                        <div className="animate-fadeIn">
                            {/* Titulo dinámico según acción */}
                            <h3 style={{textAlign:'center', color:'#555'}}>
                                Datos del Cliente ({accionTipo === 'OCUPAR' ? 'Check-In' : 'Reserva'})
                            </h3>

                            <div className={styles.selectionInfo}>
                                <p style={{margin: '0 0 10px 0', fontWeight:'bold'}}>Resumen de selección:</p>
                                <ul style={{listStyle:'none', padding:0, margin:0, maxHeight:'150px', overflowY:'auto', border:'1px solid #e0e0e0', background:'#f9f9f9', borderRadius:'4px'}}>
                                    {selectedCells.map((item, idx) => (
                                        <li key={idx} style={{padding:'8px 12px', borderBottom:'1px solid #eee', fontSize:'0.9rem', display:'flex', justifyContent:'space-between'}}>
                                            <span>{item.fecha}</span>
                                            <strong>Hab. {item.numero} ({item.tipoHabitacion})</strong>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className={styles.gridMiddle} style={{marginTop:'20px'}}>
                                <div className={styles.fieldWrapper}>
                                    <label>Tipo Doc</label>
                                    <select className={styles.select} value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                                        <option value="DNI">DNI</option>
                                        <option value="PASAPORTE">PASAPORTE</option>
                                    </select>
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label>Nro Doc</label>
                                    <input className={styles.input} value={numDoc} onChange={(e) => setNumDoc(e.target.value)} placeholder="Ej: 12345678" />
                                </div>
                            </div>

                            <div className={styles.gridBottom}>
                                <div className={styles.fieldWrapper}><label>Nombre</label><input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
                                <div className={styles.fieldWrapper}><label>Apellido</label><input className={styles.input} value={apellido} onChange={(e) => setApellido(e.target.value)} /></div>
                                <div className={styles.fieldWrapper}><label>Teléfono</label><input className={styles.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div>
                            </div>

                            <div className={styles.footerActions}>
                                <button className={styles.btnVolverOrange} onClick={() => setStep(2)}>VOLVER</button>
                                {/* Botón de confirmación con texto dinámico y color según acción */}
                                <button
                                    className={accionTipo === 'OCUPAR' ? styles.btnOcuparBlue : styles.btnReservarGreen}
                                    onClick={handlePreConfirmar}
                                >
                                    CONFIRMAR {accionTipo}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}