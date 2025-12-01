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

/**
 * Helpers para trabajar con fechas
 */
const parseDateLocal = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
};

const formatDateLocal = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Obtener fecha de hoy string YYYY-MM-DD para los inputs date
const getTodayString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function ReservasPage() {
    const todayString = getTodayString();

    // --- ESTADOS ---
    const [step, setStep] = useState(1);
    const [accionTipo, setAccionTipo] = useState('RESERVAR');

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

    // Estado para errores de formato (Caja Roja)
    const [errores, setErrores] = useState({});

    // ============================
    // VALIDACIÓN EN TIEMPO REAL (FORMATO)
    // ============================
    const validarInput = (campo, valor) => {
        let msg = "";

        if (campo === 'numDoc') {
            if (valor && !/^[0-9]{7,8}$/.test(valor)) {
                msg = "El DNI debe contener solo 7 u 8 números, sin letras ni puntos.";
            }
        }
        if (campo === 'nombre' || campo === 'apellido') {
            if (valor && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
                msg = "Solo se permiten letras.";
            }
        }
        if (campo === 'telefono') {
            if (valor && !/^[0-9]+$/.test(valor)) {
                msg = "El teléfono debe contener solo números.";
            }
        }

        setErrores(prev => ({ ...prev, [campo]: msg }));
    };

    const handleChange = (e, setFunction, campo) => {
        const val = e.target.value;
        setFunction(val);
        validarInput(campo, val);
    };

    // ======================
    //   1. BUSCAR DISPONIBILIDAD
    // ======================
    const handleBuscar = async () => {
        if (!fechaDesde) return showError('Faltan datos', 'Por favor seleccione la fecha "Desde".');
        if (!fechaHasta) return showError('Faltan datos', 'Por favor seleccione la fecha "Hasta".');

        // Validaciones de fecha extra (Backend safety)
        if (fechaDesde < todayString) return showError('Fecha inválida', 'No se puede reservar en el pasado.');
        if (fechaDesde > fechaHasta) return showError('Fecha inválida', 'La fecha de ingreso no puede ser mayor a la salida.');

        const fDesde = parseDateLocal(fechaDesde);
        const fHasta = parseDateLocal(fechaHasta);

        setLoading(true);

        try {
            const queryParams = new URLSearchParams({ desde: fechaDesde, hasta: fechaHasta });
            const res = await fetch(`${API_URL}/habitaciones/estado?${queryParams}`);

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                throw new Error(errorBody?.mensaje || "Error al obtener disponibilidad.");
            }

            const dataBackend = await res.json();

            // Generar rango de días
            const dias = [];
            const current = new Date(fDesde.getTime());
            const end = new Date(fHasta.getTime());
            current.setHours(0,0,0,0);
            end.setHours(0,0,0,0);

            while (current <= end) {
                dias.push(formatDateLocal(current));
                current.setDate(current.getDate() + 1);
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
            if (exists) return prev.filter(item => item !== exists);
            return [...prev, { habId, fecha, tipoHabitacion, numero }];
        });
    };

    // ======================
    //   NAVEGACIÓN Y SUBMIT
    // ======================
    const handleIniciarProceso = (tipoAccion) => {
        if (selectedCells.length === 0) {
            return showError('Selección requerida', "Seleccione al menos una celda disponible.");
        }
        setAccionTipo(tipoAccion);
        setStep(3);
    };

    const onFormSubmit = (e) => {
        e.preventDefault();
        const hayErroresFormato = Object.values(errores).some(msg => msg !== "");
        if (hayErroresFormato) {
            return showError("Datos inválidos", "Por favor corrija los campos marcados en rojo.");
        }
        handlePreConfirmar();
    };

    const handlePreConfirmar = () => {
        const accionTexto = accionTipo === 'OCUPAR' ? 'ocupar' : 'reservar';
        const tituloTexto = accionTipo === 'OCUPAR' ? 'Confirmar Ocupación' : 'Confirmar Reserva';

        const msg = selectedCells.length === 1
            ? `¿Desea ${accionTexto} la habitación ${selectedCells[0].numero} para ${selectedCells[0].fecha}?`
            : `¿Desea confirmar la acción para ${selectedCells.length} días seleccionados?`;

        showConfirmAction(tituloTexto, msg);
    };

    const handleConfirmarReal = async () => {
        closeAction();

        try {
            // 1. Agrupar por habitación
            const gruposPorHabitacion = {};

            selectedCells.forEach(sel => {
                if (!gruposPorHabitacion[sel.habId]) {
                    gruposPorHabitacion[sel.habId] = [];
                }
                gruposPorHabitacion[sel.habId].push(sel.fecha);
            });

            // 2. Procesar cada habitación
            for (const habId in gruposPorHabitacion) {

                // Ordenar fechas
                const fechasOrdenadas = gruposPorHabitacion[habId].sort();
                const gruposConsecutivos = [];

                let inicio = fechasOrdenadas[0];
                let previo = fechasOrdenadas[0];

                for (let i = 1; i < fechasOrdenadas.length; i++) {
                    const actual = fechasOrdenadas[i];

                    const dPrev = new Date(previo);
                    const dActual = new Date(actual);

                    const diff = (dActual - dPrev) / (1000 * 60 * 60 * 24);

                    if (diff === 1) {
                        // seguimos el tramo
                        previo = actual;
                    } else {
                        // cerrar tramo anterior
                        gruposConsecutivos.push([inicio, previo]);

                        // iniciar nuevo
                        inicio = actual;
                        previo = actual;
                    }
                }

                // cerrar último tramo
                gruposConsecutivos.push([inicio, previo]);

                // 3. Hacer POST por cada tramo
                for (const tramo of gruposConsecutivos) {
                    const ingreso = tramo[0];
                    const ultimoDia = tramo[1];

                    // --- CORRECCIÓN DE FECHA: SUMAMOS 1 DÍA AL ÚLTIMO SELECCIONADO ---
                    const fechaBase = new Date(ultimoDia + "T12:00:00"); // Truco mediodía
                    fechaBase.setDate(fechaBase.getDate() + 1);

                    const yyyy = fechaBase.getFullYear();
                    const mm = String(fechaBase.getMonth() + 1).padStart(2, '0');
                    const dd = String(fechaBase.getDate()).padStart(2, '0');
                    const egreso = `${yyyy}-${mm}-${dd}`;
                    // ----------------------------------------------------------------

                    const reservaRequest = {
                        ingreso,
                        egreso, // Enviamos el día siguiente real
                        huesped: { tipoDocumento: tipoDoc, documento: numDoc, nombre, apellido, telefono },
                        habitaciones: [habId]
                    };

                    const endpoint = accionTipo === 'OCUPAR' ? '/reservas/ocupar' : '/reservas';

                    const res = await fetch(`${API_URL}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(reservaRequest)
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.mensaje || "Error al procesar una de las reservas.");
                    }
                }
            }

            showSuccess('¡Éxito!', 'Operación realizada correctamente.');

        } catch (error) {
            console.error(error);
            showError('Error', error.message);
        }
    };

    // --- UTILIDADES ---
    const showError = (titulo, desc) => setErrorModal({ isOpen: true, titulo, descripcion: desc });
    const closeError = () => setErrorModal({ ...errorModal, isOpen: false });
    const showSuccess = (titulo, desc) => setSuccessModal({ isOpen: true, titulo, descripcion: desc });
    const showConfirmAction = (titulo, desc) => setActionModal({ isOpen: true, titulo, descripcion: desc });
    const closeAction = () => setActionModal({ ...actionModal, isOpen: false });

    // ⭐ CIERRE DE ÉXITO CON AUTO-RECARGA
    const closeSuccess = () => {
        setSuccessModal({ ...successModal, isOpen: false });

        // No reseteamos a step 1, nos quedamos en la grilla (Step 2)
        setStep(2);
        setSelectedCells([]);
        setNombre(''); setApellido(''); setTelefono(''); setNumDoc('');
        setErrores({});
        setAccionTipo('RESERVAR');

        // Refrescamos los datos para ver los nuevos colores
        handleBuscar();
    };

    // (Opcional) Si quieres volver a cero
    const resetFormularioCompleto = () => {
        setStep(1);
        setSelectedCells([]);
        setNombre(''); setApellido(''); setTelefono(''); setNumDoc('');
        setErrores({});
        setAccionTipo('RESERVAR');
    };

    const getHabId = (hab) => hab.idHabitacion || hab.id;

    return (
        <ProtectedRoute>
            {errorModal.isOpen && <ErrorModal titulo={errorModal.titulo} descripcion={errorModal.descripcion} onClose={closeError} />}
            {successModal.isOpen && <SuccessModal titulo={successModal.titulo} descripcion={successModal.descripcion} onClose={closeSuccess} />}
            {actionModal.isOpen && <ActionModal titulo={actionModal.titulo} descripcion={actionModal.descripcion} onCancel={closeAction} onConfirm={handleConfirmarReal} confirmText="Aceptar" />}

            <div className={styles.container}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className={styles.title} style={{ marginTop: '10px' }}>DISPONIBILIDAD DE HABITACIONES</h1>
                </div>

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
                                disabled={step > 1 || loading}
                                min={todayString}
                            />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <label>Hasta Fecha</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                disabled={step > 1 || loading}
                                min={fechaDesde || todayString}
                            />
                        </div>

                        {step === 1 && (
                            <button className={styles.btnBuscar} onClick={handleBuscar} disabled={loading}>
                                {loading ? "CARGANDO..." : "BUSCAR"}
                            </button>
                        )}
                    </div>

                    {/* --- PASO 2: MATRIZ --- */}
                    {step === 2 && (
                        <>
                            <div className={styles.topActions}>
                                <div style={{ flex: 1 }}>
                                    {selectedCells.length > 0 && (
                                        <span style={{ fontWeight: 'bold', color: '#2196f3' }}>
                                            {selectedCells.length} día(s) seleccionado(s)
                                        </span>
                                    )}
                                </div>
                                <button className={styles.btnVolverOrange} onClick={() => setStep(1)}>VOLVER</button>
                                <button className={styles.btnOcuparBlue} onClick={() => handleIniciarProceso('OCUPAR')}>
                                    OCUPAR ({selectedCells.length})
                                </button>
                                <button className={styles.btnReservarGreen} onClick={() => handleIniciarProceso('RESERVAR')}>
                                    RESERVAR ({selectedCells.length})
                                </button>
                            </div>
                            <div className={styles.tableWrapper}>
                                <table className={styles.matrixTable}>
                                    <thead>
                                    <tr>
                                        <th className={styles.stickyCol}>Fecha / Habitación</th>
                                        {habitaciones.map(hab => (
                                            <th key={getHabId(hab)}>{hab.tipo}<br/><small>Hab. {hab.numero}</small></th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {daysRange.map((fecha) => (
                                        <tr key={fecha}>
                                            <td className={styles.stickyCol}><strong>{fecha}</strong></td>
                                            {matrixData.map(hab => {
                                                const infoDia = hab.estadosPorDia?.find(d => d.fecha === fecha);
                                                const estado = infoDia?.estado || 'DISPONIBLE';
                                                const currentId = getHabId(hab);
                                                const isSelected = selectedCells.some(c => c.habId === currentId && c.fecha === fecha);
                                                return (
                                                    <td key={`${currentId}-${fecha}`} className={styles.cellCenter}>
                                                        <div
                                                            className={`${styles.checkboxSquare} ${styles[estado] || styles.DISPONIBLE} ${isSelected ? styles.selected : ''}`}
                                                            onClick={() => handleCellClick(currentId, fecha, estado, hab.tipo, hab.numero)}
                                                        >
                                                            {isSelected ? "✓" : estado === 'DISPONIBLE' ? "+" : "x"}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* --- PASO 3: FORMULARIO --- */}
                    {step === 3 && (
                        <div style={{ animation: "fadeIn 0.3s" }}>
                            <h3 style={{ textAlign: 'center', color: '#555' }}>
                                Datos del Cliente ({accionTipo})
                            </h3>

                            <div className={styles.selectionInfo}>
                                <p><b>Resumen:</b></p>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {selectedCells.map((s, i) => (
                                        <li key={i} style={{ padding: '5px 0', borderBottom: '1px solid #ddd' }}>
                                            {s.fecha} — Hab. {s.numero} ({s.tipoHabitacion})
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <form onSubmit={onFormSubmit}>

                                <div className={styles.gridMiddle}>
                                    <div className={styles.fieldWrapper}>
                                        <label>Tipo Doc</label>
                                        <select className={styles.select} value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}>
                                            <option value="DNI">DNI</option>
                                            <option value="PASAPORTE">PASAPORTE</option>
                                            <option value="LE">LE</option>
                                            <option value="LC">LC</option>
                                            <option value="OTRO">OTRO</option>
                                        </select>
                                    </div>

                                    {/* NRO DOC */}
                                    <div className={styles.fieldWrapper}>
                                        <label>Nro Doc (*)</label>
                                        <input
                                            className={`${styles.input} ${errores.numDoc ? styles.inputError : ''}`}
                                            value={numDoc}
                                            onChange={(e) => handleChange(e, setNumDoc, 'numDoc')}
                                            required
                                            placeholder="Ej: 12345678"
                                        />
                                        {errores.numDoc && <div className={styles.errorTooltip}>{errores.numDoc}</div>}
                                    </div>
                                </div>

                                <div className={styles.gridBottom}>
                                    {/* NOMBRE */}
                                    <div className={styles.fieldWrapper}>
                                        <label>Nombre (*)</label>
                                        <input
                                            className={`${styles.input} ${errores.nombre ? styles.inputError : ''}`}
                                            value={nombre}
                                            onChange={(e) => handleChange(e, setNombre, 'nombre')}
                                            required
                                        />
                                        {errores.nombre && <div className={styles.errorTooltip}>{errores.nombre}</div>}
                                    </div>

                                    {/* APELLIDO */}
                                    <div className={styles.fieldWrapper}>
                                        <label>Apellido (*)</label>
                                        <input
                                            className={`${styles.input} ${errores.apellido ? styles.inputError : ''}`}
                                            value={apellido}
                                            onChange={(e) => handleChange(e, setApellido, 'apellido')}
                                            required
                                        />
                                        {errores.apellido && <div className={styles.errorTooltip}>{errores.apellido}</div>}
                                    </div>

                                    {/* TELÉFONO */}
                                    <div className={styles.fieldWrapper}>
                                        <label>Teléfono (*)</label>
                                        <input
                                            className={`${styles.input} ${errores.telefono ? styles.inputError : ''}`}
                                            value={telefono}
                                            onChange={(e) => handleChange(e, setTelefono, 'telefono')}
                                            required
                                        />
                                        {errores.telefono && <div className={styles.errorTooltip}>{errores.telefono}</div>}
                                    </div>
                                </div>

                                <div className={styles.footerActions}>
                                    <button type="button" className={styles.btnVolverOrange} onClick={() => setStep(2)}>VOLVER</button>

                                    <button
                                        type="submit"
                                        className={accionTipo === 'OCUPAR' ? styles.btnOcuparBlue : styles.btnReservarGreen}
                                    >
                                        CONFIRMAR {accionTipo}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}