'use client';

import { useState } from 'react';
import Link from 'next/link';

// --- IMPORTS REALES (Ajustados a tu estructura de carpetas) ---
import ProtectedRoute from '../components/layout/ProtectedRoute';
import ErrorModal from '../components/ui/modals/ErrorModal';
import SuccessModal from '../components/ui/modals/SuccessModal';
import ActionModal from '../components/ui/modals/ActionModal';
import styles from './reserva.module.css';

// Datos Mock (Aquí conectarías tu backend en el futuro)
const MOCK_HABITACIONES = [
    { id: 101, numero: '101', tipo: 'Simple', estado: 'Disponible' },
    { id: 102, numero: '102', tipo: 'Doble', estado: 'Ocupada' },
    { id: 103, numero: '103', tipo: 'Matrimonial', estado: 'Disponible' },
    { id: 104, numero: '104', tipo: 'Suite', estado: 'Disponible' },
    { id: 105, numero: '105', tipo: 'Simple', estado: 'Mantenimiento' },
    { id: 201, numero: '201', tipo: 'Doble', estado: 'Disponible' },
];

export default function ReservasPage() {
    // --- ESTADOS DE CONTROL DE FLUJO ---
    const [step, setStep] = useState(1);
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);

    // --- ESTADOS DE MODALES ---
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
    const [actionModal, setActionModal] = useState({ isOpen: false, title: '', message: '' });

    // --- ESTADOS DEL FORMULARIO ---
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
        horaIngreso: '12:00', // Default Check-in
        fechaEgreso: '',
        horaEgreso: '10:00',  // Default Check-out
        telefonoReserva: ''
    });

    const getNombreDia = (fechaString) => {
        if (!fechaString) return '-';
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const date = new Date(fechaString + 'T00:00:00');
        return dias[date.getDay() === 0 ? 6 : date.getDay() - 1];
    };

    // --- HANDLERS DE MODALES ---
    const showError = (msg) => setErrorModal({ isOpen: true, message: msg });
    const closeError = () => setErrorModal({ ...errorModal, isOpen: false });

    const showSuccess = (msg) => setSuccessModal({ isOpen: true, message: msg });
    const closeSuccess = () => {
        setSuccessModal({ ...successModal, isOpen: false });
        resetFormularioCompleto();
    };

    const showConfirmAction = (title, msg) => setActionModal({ isOpen: true, title, message: msg });
    const closeAction = () => setActionModal({ ...actionModal, isOpen: false });


    // --- LÓGICA DE NEGOCIO ---

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
            horaEgreso: '10:00',
            telefonoReserva: ''
        });
    };

    const handleBuscar = () => {
        if (!fechaDesde) return showError('Por favor, seleccione una fecha de inicio ("Desde").');
        if (!fechaHasta) return showError('Por favor, seleccione una fecha de fin ("Hasta").');

        const fDesde = new Date(fechaDesde);
        const fHasta = new Date(fechaHasta);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);

        if (fDesde < hoy) return showError('La fecha de ingreso no puede ser anterior al día de hoy.');
        if (fDesde > fHasta) return showError('La fecha de ingreso no puede ser posterior a la de salida.');

        setHabitacionesDisponibles(MOCK_HABITACIONES);
        setDetalle(prev => ({ ...prev, fechaIngreso: fechaDesde, fechaEgreso: fechaHasta }));
        setStep(2);
    };

    const handleSeleccionarHabitacion = (habitacion) => {
        if (habitacion.estado !== 'Disponible') return;
        setDetalle(prev => ({ ...prev, habitacionId: habitacion.id, tipoHabitacion: habitacion.tipo }));
        setStep(3);
    };

    const handlePreConfirmar = () => {
        if (!nombre || !apellido || !numDoc) {
            return showError('Por favor complete todos los datos del pasajero (Nombre, Apellido y Documento).');
        }

        showConfirmAction(
            'Confirmar Reserva',
            `¿Está seguro que desea reservar la habitación ${detalle.tipoHabitacion} para ${nombre} ${apellido}?`
        );
    };

    const handleConfirmarReal = () => {
        closeAction();
        // Simulación de éxito
        setTimeout(() => {
            showSuccess('La reserva se ha registrado correctamente en el sistema.');
        }, 500);
    };

    return (
        <ProtectedRoute>

            {/* --- MODALES REALES CON TUS PROPS --- */}

            {errorModal.isOpen && (
                <ErrorModal
                    titulo="Error en la solicitud"
                    descripcion={errorModal.message}
                    onClose={closeError}
                />
            )}

            {successModal.isOpen && (
                <SuccessModal
                    titulo="¡Operación Exitosa!"
                    descripcion={successModal.message}
                    onClose={closeSuccess}
                />
            )}

            {actionModal.isOpen && (
                <ActionModal
                    titulo={actionModal.title}
                    descripcion={actionModal.message}
                    onCancel={closeAction}
                    onConfirm={handleConfirmarReal}
                    confirmText="Confirmar"
                />
            )}

            <div className={styles.container}>
                <h1 className={styles.title}>
                    {step === 1 && "Buscar Disponibilidad"}
                    {step === 2 && "Seleccionar Habitación"}
                    {step === 3 && "Confirmar Reserva"}
                </h1>

                <div className={styles.formContainer}>

                    {/* --- PASO 1: FECHAS --- */}
                    <div className={styles.gridTop}>
                        <div className={styles.fieldWrapper}>
                            <label>Desde Fecha</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                disabled={step > 1}
                            />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <label>Hasta Fecha</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                disabled={step > 1}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            {step === 1 ? (
                                <button className={styles.btnBuscar} onClick={handleBuscar}>BUSCAR</button>
                            ) : (
                                <button
                                    className={styles.btnBuscar}
                                    onClick={() => setStep(1)}
                                    style={{ background: '#fff', border: '1px solid #4dd0e1', color: '#4dd0e1' }}
                                >
                                    CAMBIAR
                                </button>
                            )}
                        </div>
                    </div>

                    {/* --- PASO 2: GRILLA HABITACIONES --- */}
                    {step === 2 && (
                        <div className={styles.roomsGrid}>
                            {habitacionesDisponibles.map((hab) => (
                                <div
                                    key={hab.id}
                                    className={`${styles.roomCard} ${hab.estado !== 'Disponible' ? styles.occupied : ''}`}
                                    onClick={() => handleSeleccionarHabitacion(hab)}
                                >
                                    <strong className={styles.roomNumber}>Hab. {hab.numero}</strong>
                                    <span className={styles.roomType}>{hab.tipo}</span>
                                    <br/>
                                    <span className={`${styles.statusBadge} ${hab.estado === 'Disponible' ? styles.available : styles.occupied}`}>
                                        {hab.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- PASO 3: DETALLES PASAJERO --- */}
                    {step === 3 && (
                        <div style={{animation: 'fadeIn 0.5s'}}>
                            <button onClick={() => setStep(2)} className={styles.btnBack} style={{marginBottom:'15px'}}>
                                ← Volver a selección
                            </button>

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
                                    <input type="text" className={styles.input} value={numDoc} onChange={(e) => setNumDoc(e.target.value)} />
                                </div>
                            </div>

                            <div className={styles.gridBottom}>
                                <div className={styles.fieldWrapper}>
                                    <label>Nombre</label>
                                    <input type="text" className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} />
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label>Apellido</label>
                                    <input type="text" className={styles.input} value={apellido} onChange={(e) => setApellido(e.target.value)} />
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label>Teléfono</label>
                                    <input type="text" className={styles.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                                </div>
                            </div>

                            <table className={styles.detailsTable}>
                                <tbody>
                                <tr>
                                    <td className={styles.labelCell}>Habitación</td>
                                    <td colSpan="3" style={{textAlign:'left', paddingLeft:'15px'}}>
                                        <strong>{detalle.tipoHabitacion}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td className={styles.labelCell}>Ingreso</td>
                                    <td className={styles.readOnlyText}>{getNombreDia(detalle.fechaIngreso)}</td>
                                    <td>
                                        <input type="date" className={styles.tableInput} value={detalle.fechaIngreso} disabled />
                                    </td>
                                    <td>
                                        <input
                                            type="time"
                                            className={styles.tableInput}
                                            value={detalle.horaIngreso}
                                            onChange={e => setDetalle({...detalle, horaIngreso: e.target.value})}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className={styles.labelCell}>Egreso</td>
                                    <td className={styles.readOnlyText}>{getNombreDia(detalle.fechaEgreso)}</td>
                                    <td>
                                        <input type="date" className={styles.tableInput} value={detalle.fechaEgreso} disabled />
                                    </td>
                                    <td>
                                        <input
                                            type="time"
                                            className={styles.tableInput}
                                            value={detalle.horaEgreso}
                                            onChange={e => setDetalle({...detalle, horaEgreso: e.target.value})}
                                        />
                                    </td>
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