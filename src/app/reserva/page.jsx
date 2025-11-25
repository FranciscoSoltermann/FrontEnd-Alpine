'use client';

import { useState } from 'react';
import Link from 'next/link';

// --- IMPORTS REALES ---
import ProtectedRoute from '../components/layout/ProtectedRoute';
import ErrorModal from '../components/ui/modals/ErrorModal';
import SuccessModal from '../components/ui/modals/SuccessModal';
import ActionModal from '../components/ui/modals/ActionModal';
import styles from './reserva.module.css';

// 1. CORRECCIÓN: Agregamos '/api' a la URL base
const API_URL = "http://localhost:8080/api";

export default function ReservasPage() {

    // --- ESTADOS ---
    const [step, setStep] = useState(1);
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
    const [loading, setLoading] = useState(false); // Agregamos estado de carga

    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
    const [actionModal, setActionModal] = useState({ isOpen: false, title: '', message: '' });

    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const [tipoDoc, setTipoDoc] = useState('DNI');
    const [numDoc, setNumDoc] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');

    const [detalle, setDetalle] = useState({
        habitacionId: null,
        tipoHabitacion: '',
        fechaIngreso: '',
        horaIngreso: '12:00',
        fechaEgreso: '',
        horaEgreso: '10:00'
    });

    // ======================
    //   BUSCAR DISPONIBLES (CORREGIDO)
    // ======================
    const handleBuscar = async () => {

        if (!fechaDesde) return showError('Por favor seleccione la fecha "Desde".');
        if (!fechaHasta) return showError('Por favor seleccione la fecha "Hasta".');

        const fDesde = new Date(fechaDesde);
        const fHasta = new Date(fechaHasta);
        const today = new Date(); today.setHours(0,0,0,0);
        // Ajuste simple de zona horaria para evitar errores de "ayer"
        const fDesdeAjustada = new Date(fDesde.getTime() + fDesde.getTimezoneOffset() * 60000);

        if (fDesdeAjustada < today) return showError('La fecha de ingreso no puede ser anterior a hoy.');
        if (fDesde > fHasta) return showError('La fecha de ingreso no puede ser posterior a la fecha de salida.');

        setLoading(true);

        try {
            // 2. CORRECCIÓN: URL correcta '/habitaciones/estado'
            const res = await fetch(
                `${API_URL}/habitaciones/estado?desde=${fechaDesde}&hasta=${fechaHasta}`
            );

            if (!res.ok) throw new Error("Error buscando disponibilidad");

            const dataBackend = await res.json();

            // 3. CORRECCIÓN: Transformación de datos (Grilla -> Estado Simple)
            // El backend devuelve { estadosPorDia: [...] }, el frontend necesita { estado: 'Disponible' }
            const habitacionesMapeadas = dataBackend.map(hab => {
                // Si CUALQUIER día del rango está ocupado, la habitación entera se marca ocupada
                const tieneDiasOcupados = hab.estadosPorDia.some(dia =>
                    dia.estado !== 'DISPONIBLE'
                );

                return {
                    id: hab.idHabitacion,      // Mapeamos idHabitacion -> id
                    numero: hab.numero,
                    tipo: hab.tipo,
                    estado: tieneDiasOcupados ? 'Ocupada' : 'Disponible'
                };
            });

            setHabitacionesDisponibles(habitacionesMapeadas);
            setDetalle(prev => ({
                ...prev,
                fechaIngreso: fechaDesde,
                fechaEgreso: fechaHasta
            }));

            setStep(2);

        } catch (e) {
            console.error(e);
            showError("No se pudo conectar con el servidor. Verifique que el Backend esté corriendo.");
        } finally {
            setLoading(false);
        }
    };

    // ======================
    //   SELECCIONAR HABITACIÓN
    // ======================
    const handleSeleccionarHabitacion = (hab) => {
        if (hab.estado !== 'Disponible') return;

        setDetalle(prev => ({
            ...prev,
            habitacionId: hab.id,
            // Limpiamos el nombre (Ej: "DobleEstandar" -> "Doble Estandar")
            tipoHabitacion: hab.tipo.replace(/([A-Z])/g, ' $1').trim()
        }));

        setStep(3);
    };

    // ======================
    //   CONFIRMAR RESERVA (modal)
    // ======================
    const handlePreConfirmar = () => {
        if (!nombre || !apellido || !numDoc) {
            return showError("Complete los datos del pasajero.");
        }

        showConfirmAction(
            "Confirmar Reserva",
            `¿Desea confirmar la reserva de la habitación ${detalle.tipoHabitacion}?`
        );
    };

    // ======================
    //   ENVIAR RESERVA AL BACKEND
    // ======================
    const handleConfirmarReal = async () => {

        closeAction();

        // Armamos el objeto tal cual lo espera tu backend (ReservaDTO posiblemente)
        const reservaDTO = {
            huesped: { // Asumiendo estructura compleja o simple según tu DTO
                tipoDocumento: tipoDoc,
                documento: numDoc,
                nombre,
                apellido,
                telefono
            },
            habitacionId: detalle.habitacionId,
            fechaInicio: detalle.fechaIngreso,
            fechaFin: detalle.fechaEgreso
        };

        try {
            // Nota: Asegúrate de tener este endpoint '/reservas' creado en tu backend
            const res = await fetch(`${API_URL}/reservas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reservaDTO)
            });

            if (!res.ok) {
                // Intentamos leer el mensaje de error del backend si existe
                const errorBody = await res.json().catch(() => null);
                return showError(errorBody?.mensaje || "No se pudo registrar la reserva.");
            }

            showSuccess("La reserva fue registrada con éxito.");

        } catch (e) {
            showError("Error de conexión con el servidor.");
        }
    };

    // ======================
    //   MODALES Y UTILS
    // ======================
    const showError = (msg) => setErrorModal({ isOpen: true, message: msg });
    const closeError = () => setErrorModal({ ...errorModal, isOpen: false });

    const showSuccess = (msg) => setSuccessModal({ isOpen: true, message: msg });
    const closeSuccess = () => {
        setSuccessModal({ ...successModal, isOpen: false });
        resetFormularioCompleto();
    };

    const showConfirmAction = (title, msg) => setActionModal({ isOpen: true, title, message: msg });
    const closeAction = () => setActionModal({ ...actionModal, isOpen: false });

    const resetFormularioCompleto = () => {
        setStep(1);
        setFechaDesde('');
        setFechaHasta('');
        setHabitacionesDisponibles([]);
        setNombre('');
        setApellido('');
        setTelefono('');
        setNumDoc('');
        setTipoDoc('DNI');
        setDetalle({
            habitacionId: null,
            tipoHabitacion: '',
            fechaIngreso: '',
            horaIngreso: '12:00',
            fechaEgreso: '',
            horaEgreso: '10:00'
        });
    };

    const getNombreDia = (fechaString) => {
        if (!fechaString) return "-";
        const [year, month, day] = fechaString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        return dias[date.getDay()];
    };

    // ======================
    //   RENDER
    // ======================

    return (
        <ProtectedRoute>
            {errorModal.isOpen && <ErrorModal titulo="Error" descripcion={errorModal.message} onClose={closeError} />}
            {successModal.isOpen && <SuccessModal titulo="Éxito" descripcion={successModal.message} onClose={closeSuccess} />}
            {actionModal.isOpen && <ActionModal titulo={actionModal.title} descripcion={actionModal.message} onCancel={closeAction} onConfirm={handleConfirmarReal} />}

            <div className={styles.container}>
                <h1 className={styles.title}>
                    {step === 1 && "Buscar Disponibilidad"}
                    {step === 2 && "Seleccionar Habitación"}
                    {step === 3 && "Confirmar Reserva"}
                </h1>

                <div className={styles.formContainer}>

                    {/* --- PASO 1 --- */}
                    <div className={styles.gridTop}>
                        <div className={styles.fieldWrapper}>
                            <label>Desde Fecha</label>
                            <input type="date" className={styles.input} value={fechaDesde}
                                   onChange={(e) => setFechaDesde(e.target.value)} disabled={step > 1 || loading} />
                        </div>

                        <div className={styles.fieldWrapper}>
                            <label>Hasta Fecha</label>
                            <input type="date" className={styles.input} value={fechaHasta}
                                   onChange={(e) => setFechaHasta(e.target.value)} disabled={step > 1 || loading} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            {step === 1 ? (
                                <button
                                    className={styles.btnBuscar}
                                    onClick={handleBuscar}
                                    disabled={loading}
                                >
                                    {loading ? "BUSCANDO..." : "BUSCAR"}
                                </button>
                            ) : (
                                <button
                                    className={styles.btnBuscar}
                                    onClick={() => setStep(1)}
                                    style={{ background: "#fff", color: "#4dd0e1", border: "1px solid #4dd0e1" }}
                                >
                                    CAMBIAR
                                </button>
                            )}
                        </div>
                    </div>

                    {/* --- PASO 2 --- */}
                    {step === 2 && (
                        <div className={styles.roomsGrid}>
                            {habitacionesDisponibles.length === 0 ? (
                                <p style={{gridColumn: '1/-1', textAlign:'center', padding: '20px'}}>
                                    No hay habitaciones disponibles o no se encontraron datos.
                                </p>
                            ) : (
                                habitacionesDisponibles.map(hab => (
                                    <div key={hab.id}
                                         className={`${styles.roomCard} ${hab.estado !== 'Disponible' ? styles.occupied : ''}`}
                                         onClick={() => handleSeleccionarHabitacion(hab)}>
                                        <strong className={styles.roomNumber}>Hab. {hab.numero}</strong>
                                        <span className={styles.roomType}>{hab.tipo}</span><br/>
                                        <span className={`${styles.statusBadge} ${
                                            hab.estado === "Disponible" ? styles.available : styles.occupied}`}>
                                            {hab.estado}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* --- PASO 3 --- */}
                    {step === 3 && (
                        <div>
                            <button className={styles.btnBack} onClick={() => setStep(2)}>← Volver</button>

                            <div className={styles.gridMiddle}>
                                <div className={styles.fieldWrapper}>
                                    <label>Tipo Doc</label>
                                    <select className={styles.select} value={tipoDoc}
                                            onChange={(e) => setTipoDoc(e.target.value)}>
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
                                <div className={styles.fieldWrapper}>
                                    <label>Nombre</label>
                                    <input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} />
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label>Apellido</label>
                                    <input className={styles.input} value={apellido} onChange={(e) => setApellido(e.target.value)} />
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label>Teléfono</label>
                                    <input className={styles.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                                </div>
                            </div>

                            <table className={styles.detailsTable}>
                                <tbody>
                                <tr>
                                    <td className={styles.labelCell}>Habitación</td>
                                    <td colSpan="3"><strong>{detalle.tipoHabitacion}</strong></td>
                                </tr>
                                <tr>
                                    <td className={styles.labelCell}>Ingreso</td>
                                    <td>{getNombreDia(detalle.fechaIngreso)}</td>
                                    <td><input type="date" disabled value={detalle.fechaIngreso} /></td>
                                </tr>
                                <tr>
                                    <td className={styles.labelCell}>Egreso</td>
                                    <td>{getNombreDia(detalle.fechaEgreso)}</td>
                                    <td><input type="date" disabled value={detalle.fechaEgreso} /></td>
                                </tr>
                                </tbody>
                            </table>

                            <div className={styles.footerActions}>
                                <Link href="/dashboard">
                                    <button className={styles.btnRechazar}>CANCELAR</button>
                                </Link>
                                <button className={styles.btnAceptar} onClick={handlePreConfirmar}>
                                    CONFIRMAR RESERVA
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}