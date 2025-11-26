'use client';

import { useState } from 'react';

// --- IMPORTS (Asegúrate que estas rutas existan en tu proyecto) ---
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

    // Datos dinámicos
    const [habitaciones, setHabitaciones] = useState([]); // Columnas
    const [matrixData, setMatrixData] = useState([]);     // Datos completos (filas y columnas)
    const [daysRange, setDaysRange] = useState([]);       // Rango de fechas (filas)

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
        // Ajuste zona horaria simple para evitar desfases de día
        const fDesdeAjustada = new Date(fDesde.getTime() + fDesde.getTimezoneOffset() * 60000);

        if (fDesde > fHasta) return showError('Fecha inválida', 'La fecha de ingreso no puede ser posterior a la fecha de salida.');

        setLoading(true);

        try {
            // Parametros query
            const queryParams = new URLSearchParams({
                desde: fechaDesde,
                hasta: fechaHasta
            });

            // Llamada al endpoint que SÍ funciona y trae todo (según tu captura)
            const res = await fetch(`${API_URL}/habitaciones/estado?${queryParams}`);

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                throw new Error(errorBody?.mensaje || "Error al obtener disponibilidad del servidor.");
            }

            const dataBackend = await res.json();

            // --- PROCESAMIENTO ---

            // 1. Generar array de días (Filas)
            const dias = [];
            // Nota: clono la fecha para no mutar fDesdeAjustada en el loop
            let currentDia = new Date(fDesdeAjustada);
            // Aseguramos que el loop cubra el rango inclusivo
            while (currentDia <= fHasta) {
                dias.push(new Date(currentDia).toISOString().split('T')[0]);
                currentDia.setDate(currentDia.getDate() + 1);
            }
            setDaysRange(dias);

            // 2. Ordenar las habitaciones por número (opcional, para visualización limpia)
            // Usamos 'numero' y 'idHabitacion' basado en tu JSON
            const dataOrdenada = dataBackend.sort((a, b) =>
                String(a.numero).localeCompare(String(b.numero), undefined, { numeric: true })
            );

            // 3. Setear estados
            // Como el backend ya devuelve la estructura con 'estadosPorDia', usamos la misma respuesta
            // tanto para definir las columnas (habitaciones) como los datos de la tabla.
            setHabitaciones(dataOrdenada);
            setMatrixData(dataOrdenada);

            setStep(2);
            setSelectedCells([]);

        } catch (e) {
            console.error(e);
            showError('Error de Servidor', e.message || "No se pudo obtener la información. Verifica que el backend esté corriendo.");
        } finally {
            setLoading(false);
        }
    };

    // ======================
    //   SELECCIÓN DE CELDAS
    // ======================
    const handleCellClick = (habId, fecha, estado, tipoHabitacion, numero) => {
        // Solo permitimos seleccionar si está disponible
        if (estado !== 'DISPONIBLE') return;

        setSelectedCells(prev => {
            // Verificamos si ya estaba seleccionada para quitarla o agregarla
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
    const handleIrAReservar = () => {
        if (selectedCells.length === 0) {
            return showError('Selección requerida', "Por favor, seleccione al menos una celda 'Disponible' para continuar.");
        }
        setStep(3);
    };

    const handlePreConfirmar = () => {
        if (!nombre || !apellido || !numDoc) return showError('Datos incompletos', "Complete los datos obligatorios del pasajero.");

        const msg = selectedCells.length === 1
            ? `¿Desea reservar la habitación ${selectedCells[0].numero} para el día ${selectedCells[0].fecha}?`
            : `¿Desea confirmar la reserva de ${selectedCells.length} días seleccionados?`;

        showConfirmAction("Confirmar Reserva", msg);
    };

    const handleConfirmarReal = async () => {
        closeAction();

        // Estructura del Request para el Backend
        const reservaRequest = {
            huesped: {
                tipoDocumento: tipoDoc,
                documento: numDoc,
                nombre,
                apellido,
                telefono
            },
            // Mapeamos la selección al formato que espera tu API
            detalles: selectedCells.map(cell => ({
                habitacionId: cell.habId, // Asegúrate que tu DTO espera 'habitacionId'
                fecha: cell.fecha
            }))
        };

        try {
            const res = await fetch(`${API_URL}/reservas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservaRequest)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.mensaje || "No se pudo crear la reserva.");
            }

            showSuccess('¡Éxito!', `Se ha registrado correctamente la reserva.`);

        } catch (error) {
            console.error(error);
            showError('Error al Reservar', error.message);
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
        // No limpiamos fechas para permitir búsquedas consecutivas si se desea
        setSelectedCells([]);
        setNombre(''); setApellido(''); setTelefono(''); setNumDoc('');
    };

    // Helper para obtener ID seguro (tu JSON usa 'idHabitacion')
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

                    {/* --- PASO 1: FILTROS --- */}
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
                                <button className={styles.btnReservarGreen} onClick={handleIrAReservar}>
                                    RESERVAR ({selectedCells.length})
                                </button>
                            </div>

                            <div className={styles.tableWrapper}>
                                <table className={styles.matrixTable}>
                                    <thead>
                                    <tr>
                                        <th className={styles.stickyCol}>Fecha / Habitación</th>
                                        {habitaciones.map(hab => (
                                            <th key={getHabId(hab)}>
                                                {/* Usamos hab.tipo y hab.numero reales de la BD */}
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
                                                // Tu JSON tiene 'estadosPorDia' dentro de cada habitación
                                                const infoDia = hab.estadosPorDia ? hab.estadosPorDia.find(d => d.fecha === fecha) : null;
                                                const estado = infoDia ? infoDia.estado : 'DISPONIBLE';

                                                // Usamos el ID correcto para verificar selección
                                                const currentId = getHabId(hab);
                                                const isSelected = selectedCells.some(
                                                    cell => cell.habId === currentId && cell.fecha === fecha
                                                );

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
                                                        >
                                                            {/* Icono Check o Cruz dependiendo del estado */}
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
                                <div className={styles.legendItem}>
                                    <div className={`${styles.checkboxSquare} ${styles.DISPONIBLE}`} style={{width:20, height:20, cursor:'default'}}></div>
                                    <span>Disponible</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={`${styles.checkboxSquare} ${styles.OCUPADA}`} style={{width:20, height:20, cursor:'default'}}></div>
                                    <span>Ocupada</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={`${styles.checkboxSquare} ${styles.RESERVADA}`} style={{width:20, height:20, cursor:'default'}}></div>
                                    <span>Reservada</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={`${styles.checkboxSquare} ${styles.MANTENIMIENTO}`} style={{width:20, height:20, cursor:'default'}}></div>
                                    <span>Mantenimiento</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PASO 3: FORMULARIO --- */}
                    {step === 3 && (
                        <div className="animate-fadeIn">
                            <h3 style={{textAlign:'center', color:'#555'}}>Datos del Cliente</h3>

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
                                <button className={styles.btnReservarGreen} onClick={handlePreConfirmar}>CONFIRMAR RESERVA</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}