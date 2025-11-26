'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- IMPORTS REALES ---
import ProtectedRoute from '../components/layout/ProtectedRoute';
import ErrorModal from '../components/ui/modals/ErrorModal';
import SuccessModal from '../components/ui/modals/SuccessModal';
import ActionModal from '../components/ui/modals/ActionModal';
import styles from './reserva.module.css';

// URL de tu API (Ajusta el puerto si es diferente, ej: 8080, 3000, etc.)
const API_URL = "http://localhost:8080/api";

export default function ReservasPage() {

    // --- ESTADOS ---
    const [step, setStep] = useState(1);

    // Datos dinámicos desde el Backend
    const [habitaciones, setHabitaciones] = useState([]); // Lista de habitaciones (columnas)
    const [matrixData, setMatrixData] = useState([]);     // Datos procesados para la tabla
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
    //   1. CARGAR HABITACIONES AL INICIO
    // ======================
    // Necesitamos saber qué habitaciones existen para armar las columnas de la tabla
    useEffect(() => {
        const fetchHabitaciones = async () => {
            try {
                // Asumo que tienes un endpoint que devuelve todas las habitaciones
                // Si no, tendrás que obtenerlas junto con el estado en handleBuscar
                const res = await fetch(`${API_URL}/habitaciones`);
                if (!res.ok) throw new Error('Error al cargar habitaciones');

                const data = await res.json();
                // Ordenamos por número para que salgan en orden (101, 102...)
                const sortedData = data.sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
                setHabitaciones(sortedData);
            } catch (error) {
                console.error("Error cargando habitaciones:", error);
                showError('Error de Conexión', 'No se pudo cargar la lista de habitaciones. Verifique que el servidor esté corriendo.');
            }
        };

        fetchHabitaciones();
    }, []);

    // ======================
    //   2. BUSCAR DISPONIBILIDAD (CONECTADO A BD)
    // ======================
    const handleBuscar = async () => {
        if (!fechaDesde) return showError('Faltan datos', 'Por favor seleccione la fecha "Desde".');
        if (!fechaHasta) return showError('Faltan datos', 'Por favor seleccione la fecha "Hasta".');

        const fDesde = new Date(fechaDesde);
        const fHasta = new Date(fechaHasta);
        // Ajuste zona horaria para comparaciones
        const fDesdeAjustada = new Date(fDesde.getTime() + fDesde.getTimezoneOffset() * 60000);

        if (fDesde > fHasta) return showError('Fecha inválida', 'La fecha de ingreso no puede ser posterior a la fecha de salida.');

        setLoading(true);

        try {
            // --- PETICIÓN REAL AL BACKEND ---
            // Enviamos rango de fechas para que el backend nos diga qué está ocupado
            const queryParams = new URLSearchParams({
                desde: fechaDesde,
                hasta: fechaHasta
            });

            // Endpoint sugerido: /habitaciones/estado?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
            // Este endpoint debería devolverte el estado de CADA habitación para CADA día en el rango,
            // o al menos los rangos ocupados para que el front los mapee.
            const res = await fetch(`${API_URL}/habitaciones/estado?${queryParams}`);

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                throw new Error(errorBody?.mensaje || "Error al obtener disponibilidad del servidor.");
            }

            const estadosBackend = await res.json();

            // --- PROCESAMIENTO DE DATOS ---
            // 1. Generamos el array de días para las filas
            const dias = [];
            for (let d = new Date(fDesdeAjustada); d <= fHasta; d.setDate(d.getDate() + 1)) {
                dias.push(new Date(d).toISOString().split('T')[0]);
            }
            setDaysRange(dias);

            // 2. Cruzamos las habitaciones base con la respuesta del backend
            // Asumimos que 'estadosBackend' trae la info de ocupación.
            // Si tu backend devuelve un array simple de habitaciones con una lista de estados, úsalo directo.
            // Aquí hago un mapeo genérico asumiendo que el backend devuelve algo como:
            // [ { idHabitacion: 1, estadosPorDia: [ { fecha: '2023-11-01', estado: 'OCUPADA' }, ... ] }, ... ]

            // NOTA: Si tu backend devuelve solo las ocupadas, la lógica sería similar a la del mock anterior (buscar coincidencias).
            // Adaptaré la lógica para que sea robusta:

            const dataProcesada = habitaciones.map(hab => {
                // Buscamos si hay datos específicos para esta habitación en la respuesta
                const datosHab = estadosBackend.find(d => d.id === hab.id || d.idHabitacion === hab.id);

                // Generamos el estado día por día
                const estadosPorDia = dias.map(fecha => {
                    // Si el backend ya nos da el día masticado:
                    let estadoDia = 'DISPONIBLE';

                    if (datosHab && datosHab.estadosPorDia) {
                        const diaEncontrado = datosHab.estadosPorDia.find(d => d.fecha === fecha);
                        if (diaEncontrado) estadoDia = diaEncontrado.estado;
                    }
                    // Si el backend devuelve rangos (como en tu mock anterior), usamos esa lógica:
                    else if (Array.isArray(estadosBackend)) {
                        // Buscamos en la lista plana de estados/reservas del backend
                        const rangoOcupado = estadosBackend.find(r =>
                            (r.idHabitacion === hab.id || r.habitacion?.id === hab.id) &&
                            fecha >= r.fechaInicio &&
                            fecha <= r.fechaFin
                        );
                        if (rangoOcupado) estadoDia = rangoOcupado.estado;
                    }

                    return { fecha, estado: estadoDia };
                });

                return { ...hab, estadosPorDia };
            });

            setMatrixData(dataProcesada);
            setStep(2);
            setSelectedCells([]);

        } catch (e) {
            console.error(e);
            showError('Error de Servidor', e.message || "No se pudo obtener la información de disponibilidad.");
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
    //   PASO 2 -> 3: IR A RESERVAR
    // ======================
    const handleIrAReservar = () => {
        if (selectedCells.length === 0) {
            return showError('Selección requerida', "Por favor, seleccione al menos una celda 'Disponible' para continuar.");
        }
        setStep(3);
    };

    // ======================
    //   PASO 3: CONFIRMAR
    // ======================
    const handlePreConfirmar = () => {
        if (!nombre || !apellido || !numDoc) return showError('Datos incompletos', "Complete los datos del pasajero.");

        const msg = selectedCells.length === 1
            ? `¿Desea reservar la habitación ${selectedCells[0].numero} para el día ${selectedCells[0].fecha}?`
            : `¿Desea confirmar la reserva de ${selectedCells.length} días seleccionados?`;

        showConfirmAction("Confirmar Reserva", msg);
    };

    const handleConfirmarReal = async () => {
        closeAction();

        // Preparamos el objeto para el Backend
        // NOTA: Ajusta esta estructura según lo que espera tu Controller Java (ej: ReservaDTO)
        const reservaRequest = {
            huesped: {
                tipoDocumento: tipoDoc,
                documento: numDoc,
                nombre,
                apellido,
                telefono
            },
            // Si tu backend acepta una lista de días/habitaciones:
            detalles: selectedCells.map(cell => ({
                habitacionId: cell.habId,
                fecha: cell.fecha
            }))
            // O si espera una reserva por rango/habitación, tendrías que agruparlas aquí.
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

    // --- UTILS ---
    const showError = (titulo, desc) => setErrorModal({ isOpen: true, titulo, descripcion: desc });
    const closeError = () => setErrorModal({ ...errorModal, isOpen: false });
    const showSuccess = (titulo, desc) => setSuccessModal({ isOpen: true, titulo, descripcion: desc });
    const closeSuccess = () => { setSuccessModal({ ...successModal, isOpen: false }); resetFormularioCompleto(); };
    const showConfirmAction = (titulo, desc) => setActionModal({ isOpen: true, titulo, descripcion: desc });
    const closeAction = () => setActionModal({ ...actionModal, isOpen: false });

    const resetFormularioCompleto = () => {
        setStep(1); setFechaDesde(''); setFechaHasta(''); setSelectedCells([]);
        setNombre(''); setApellido(''); setTelefono(''); setNumDoc('');
    };

    return (
        <ProtectedRoute>
            {errorModal.isOpen && <ErrorModal titulo={errorModal.titulo} descripcion={errorModal.descripcion} onClose={closeError} />}
            {successModal.isOpen && <SuccessModal titulo={successModal.titulo} descripcion={successModal.descripcion} onClose={closeSuccess} />}
            {actionModal.isOpen && <ActionModal titulo={actionModal.titulo} descripcion={actionModal.descripcion} onCancel={closeAction} onConfirm={handleConfirmarReal} confirmText="Aceptar" />}

            <div className={styles.container}>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className={styles.title} style={{marginTop:'10px'}}>MOSTRAR ESTADO DE HABITACIONES</h1>
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
                                        {/* Renderizamos columnas dinámicas basadas en lo que trajo la BD */}
                                        {habitaciones.length > 0 ? habitaciones.map(hab => (
                                            <th key={hab.id}>
                                                {/* Usamos hab.tipo y hab.numero reales de la BD */}
                                                {hab.tipo || "Habitación"} <br/>
                                                <small style={{fontSize:'0.85em', color:'#555'}}>Hab. {hab.numero}</small>
                                            </th>
                                        )) : matrixData.map(hab => ( // Fallback si usamos matrixData directo
                                            <th key={hab.id}>{hab.tipo} <br/> <small>{hab.numero}</small></th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {daysRange.map((fecha) => (
                                        <tr key={fecha}>
                                            <td className={styles.stickyCol}><strong>{fecha}</strong></td>
                                            {matrixData.map(hab => {
                                                const infoDia = hab.estadosPorDia.find(d => d.fecha === fecha);
                                                const estado = infoDia ? infoDia.estado : 'DISPONIBLE';

                                                const isSelected = selectedCells.some(
                                                    cell => cell.habId === hab.id && cell.fecha === fecha
                                                );

                                                return (
                                                    <td key={`${hab.id}-${fecha}`} className={styles.cellCenter}>
                                                        <div
                                                            className={`
                                                                    ${styles.checkboxSquare} 
                                                                    ${styles[estado] || styles.DISPONIBLE} 
                                                                    ${isSelected ? styles.selected : ''}
                                                                `}
                                                            onClick={() => handleCellClick(hab.id, fecha, estado, hab.tipo, hab.numero)}
                                                            title={`${hab.numero}: ${estado}`}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
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
                                    <div className={`${styles.checkboxSquare} ${styles.DISPONIBLE}`} style={{width:24, height:24, cursor:'default'}}><svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
                                    <span>Disponible</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={`${styles.checkboxSquare} ${styles.OCUPADA}`} style={{width:24, height:24, cursor:'default'}}><svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
                                    <span>Ocupada</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={`${styles.checkboxSquare} ${styles.RESERVADA}`} style={{width:24, height:24, cursor:'default'}}><svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
                                    <span>Reservada</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={`${styles.checkboxSquare} ${styles.MANTENIMIENTO}`} style={{width:24, height:24, cursor:'default'}}><svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
                                    <span>Mantenimiento</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PASO 3: FORMULARIO --- */}
                    {step === 3 && (
                        <div className="animate-fadeIn">
                            <h3 style={{textAlign:'center', color:'#555'}}>Datos del Pasajero Principal</h3>

                            <div className={styles.selectionInfo}>
                                <p style={{margin: '0 0 10px 0', fontWeight:'bold'}}>Resumen de selección ({selectedCells.length}):</p>
                                <ul style={{listStyle:'none', padding:0, margin:0, maxHeight:'100px', overflowY:'auto', border:'1px solid #bbdefb', background:'white', borderRadius:'4px'}}>
                                    {selectedCells.map((item, idx) => (
                                        <li key={idx} style={{padding:'5px 10px', borderBottom:'1px solid #eee', fontSize:'0.9rem'}}>
                                            {item.fecha} — <strong>Hab. {item.numero}</strong> ({item.tipoHabitacion})
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className={styles.gridMiddle}>
                                <div className={styles.fieldWrapper}>
                                    <label>Tipo Doc</label>
                                    <select className={styles.select} value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                                        <option value="DNI">DNI</option>
                                        <option value="PASAPORTE">PASAPORTE</option>
                                    </select>
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label>Nro Doc</label>
                                    <input className={styles.input} value={numDoc} onChange={(e) => setNumDoc(e.target.value)} />
                                </div>
                            </div>

                            <div className={styles.gridBottom}>
                                <div className={styles.fieldWrapper}><label>Nombre</label><input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
                                <div className={styles.fieldWrapper}><label>Apellido</label><input className={styles.input} value={apellido} onChange={(e) => setApellido(e.target.value)} /></div>
                                <div className={styles.fieldWrapper}><label>Teléfono</label><input className={styles.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div>
                            </div>

                            <div className={styles.footerActions}>
                                <button className={styles.btnVolverOrange} onClick={() => setStep(2)}>VOLVER A TABLA</button>
                                <button className={styles.btnReservarGreen} onClick={handlePreConfirmar}>CONFIRMAR TODO</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}