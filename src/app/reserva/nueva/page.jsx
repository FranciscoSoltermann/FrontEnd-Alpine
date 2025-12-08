'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import ErrorModal from '../../components/ui/modals/ErrorModal';
import SuccessModal from '../../components/ui/modals/SuccessModal';
import ActionModal from '../../components/ui/modals/ActionModal';
import styles from '../reserva.module.css'; // Tu CSS compartido

const API_URL = "http://localhost:8080/api";

// --- HELPERS ---
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

const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export default function NuevaReservaPage() {
    const router = useRouter();
    const todayString = getTodayString();

    const [step, setStep] = useState(1);

    // RESTAURADO: Necesitamos cambiar entre 'RESERVAR' y 'ELIMINAR' dinámicamente
    const [accionTipo, setAccionTipo] = useState('RESERVAR');

    const [habitaciones, setHabitaciones] = useState([]);
    const [matrixData, setMatrixData] = useState([]);
    const [daysRange, setDaysRange] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCells, setSelectedCells] = useState([]);

    // Modales
    const [errorModal, setErrorModal] = useState({ isOpen: false, titulo: '', descripcion: '' });
    const [successModal, setSuccessModal] = useState({ isOpen: false, titulo: '', descripcion: '' });
    const [actionModal, setActionModal] = useState({ isOpen: false, titulo: '', descripcion: '' });
    const [tipoAccionModal, setTipoAccionModal] = useState('CONFIRMAR_OPERACION');

    // Filtros
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // Datos Formulario
    const [titular, setTitular] = useState({
        tipoDoc: 'DNI', numDoc: '', nombre: '', apellido: '', telefono: ''
    });
    const [buscandoTitular, setBuscandoTitular] = useState(false);
    const [errores, setErrores] = useState({});

    // --- DETECCIÓN DE CELDAS RESERVADAS (AMARILLAS) ---
    const hayReservasSeleccionadas = selectedCells.some(c => c.estadoOriginal === 'RESERVADA');

    // --- VALIDACIONES INPUTS ---
    const validarInput = (campo, valor) => {
        let msg = "";
        if (campo === 'numDoc' && valor && !/^[0-9]{7,8}$/.test(valor)) msg = "El DNI debe tener 7 u 8 números.";
        if ((campo === 'nombre' || campo === 'apellido') && valor && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) msg = "Solo se permiten letras.";
        if (campo === 'telefono' && valor && !/^[0-9]+$/.test(valor)) msg = "Solo se permiten números.";
        setErrores(prev => ({ ...prev, [campo]: msg }));
    };

    const handleTitularChange = (campo, valor) => {
        setTitular(prev => ({ ...prev, [campo]: valor }));
        validarInput(campo, valor);
    };

    const buscarTitular = async () => {
        if (!titular.numDoc || titular.numDoc.length < 6) {
            setErrores(prev => ({...prev, numDoc: "Ingrese un DNI válido para buscar."}));
            return;
        }
        setBuscandoTitular(true);
        try {
            const res = await fetch(`${API_URL}/huespedes/buscar-por-dni?dni=${titular.numDoc}`);
            if (res.ok) {
                const data = await res.json();
                setTitular(prev => ({
                    ...prev,
                    nombre: data.nombre || '',
                    apellido: data.apellido || '',
                    telefono: data.telefono || '',
                    tipoDoc: data.tipoDocumento || 'DNI'
                }));
                setErrores(prev => ({ ...prev, nombre: '', apellido: '', telefono: '', numDoc: '' }));
            } else if (res.status === 404) {
                setTitular(prev => ({ ...prev, nombre: '', apellido: '', telefono: '' }));
                setTipoAccionModal('IR_A_NUEVO_HUESPED');
                showConfirmAction("Huésped no encontrado", `El DNI ${titular.numDoc} no existe. ¿Ir a Nuevo Huésped?`);
            }
        } catch (e) { console.error(e); } finally { setBuscandoTitular(false); }
    };

    // --- LOGICA PRINCIPAL ---
    const handleBuscar = async () => {
        if (!fechaDesde || !fechaHasta) return showError('Faltan datos', 'Seleccione fechas.');
        if (fechaDesde < todayString) return showError('Error', 'No se puede reservar en el pasado.');
        if (fechaDesde > fechaHasta) return showError('Error', 'Ingreso mayor a salida.');

        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ desde: fechaDesde, hasta: fechaHasta });
            const res = await fetch(`${API_URL}/habitaciones/estado?${queryParams}`);
            if (!res.ok) throw new Error("Error al obtener datos.");
            const data = await res.json();

            const dias = [];
            let current = parseDateLocal(fechaDesde);
            const fin = parseDateLocal(fechaHasta);
            while (current <= fin) {
                dias.push(formatDateLocal(current));
                current.setDate(current.getDate() + 1);
            }
            setDaysRange(dias);

            const sorted = data.sort((a, b) => String(a.numero).localeCompare(String(b.numero), undefined, { numeric: true }));
            setHabitaciones(sorted);
            setMatrixData(sorted);
            setStep(2);
            setSelectedCells([]);
            setAccionTipo('RESERVAR'); // Resetear a reservar por defecto al buscar
        } catch (e) { showError('Error', e.message); } finally { setLoading(false); }
    };

    const handleCellClick = (habId, fecha, estado, tipo, numero, capacidad) => {
        if (estado === 'OCUPADA' || estado === 'MANTENIMIENTO') return;
        setSelectedCells(prev => {
            const exists = prev.find(i => i.habId === habId && i.fecha === fecha);
            if (exists) return prev.filter(i => i !== exists);
            return [...prev, { habId, fecha, tipoHabitacion: tipo, numero, capacidad, estadoOriginal: estado }];
        });
    };

    // RESTAURADO: Manejador de botones (Reservar o Eliminar)
    const handleIniciarProceso = (tipo) => {
        if (selectedCells.length === 0) return showError('Error', "Seleccione una celda.");

        // --- LÓGICA ELIMINAR ---
        if (tipo === 'ELIMINAR') {
            const celdasValidas = selectedCells.filter(c => c.estadoOriginal === 'RESERVADA');
            if (celdasValidas.length === 0) return showError("Error", "Seleccione al menos una celda RESERVADA (Amarillo).");

            // Validar misma habitación
            const primeraHab = celdasValidas[0].habId;
            if (!celdasValidas.every(c => c.habId === primeraHab)) return showError("Atención", "Elimine reservas de una habitación a la vez.");

            setAccionTipo('ELIMINAR');
            setTipoAccionModal('CONFIRMAR_OPERACION');
            const celda = celdasValidas[0];
            showConfirmAction("Eliminar Reserva", `¿Está seguro de eliminar la reserva de la Habitación ${celda.numero} para la fecha ${celda.fecha}?`);
            return;
        }

        // --- LÓGICA RESERVAR ---
        if (tipo === 'RESERVAR') {
            if (hayReservasSeleccionadas) return showError("Acción no válida", "Seleccionó habitaciones que YA están RESERVADAS. Use 'ELIMINAR' si desea cancelar.");
            setAccionTipo('RESERVAR');
            setStep(3); // Ir al formulario solo si es reservar
        }
    };

    const onFormSubmit = (e) => {
        e.preventDefault();
        if (Object.values(errores).some(m => m)) return showError("Error", "Corrija los campos en rojo.");
        setTipoAccionModal('CONFIRMAR_OPERACION');
        showConfirmAction(`Confirmar RESERVA`, `¿Desea crear la reserva?`);
    };

    const handleModalConfirm = () => {
        if (tipoAccionModal === 'IR_A_NUEVO_HUESPED') {
            closeAction();
            router.push('/huesped/darAlta');
        } else {
            handleConfirmarReal();
        }
    };

    const handleConfirmarReal = async () => {
        closeAction();
        try {
            // --- CORRECCIÓN: ELIMINAR MÚLTIPLES RESERVAS ---
            if (accionTipo === 'ELIMINAR') {
                // 1. Filtramos TODAS las celdas amarillas seleccionadas
                const celdasAEliminar = selectedCells.filter(c => c.estadoOriginal === 'RESERVADA');

                if (celdasAEliminar.length === 0) throw new Error("No hay reservas seleccionadas para eliminar.");

                // 2. Creamos una promesa de borrado por cada celda seleccionada
                const deletePromises = celdasAEliminar.map(celda => {
                    const query = new URLSearchParams({
                        idHabitacion: celda.habId,
                        fecha: celda.fecha
                    });
                    // Retornamos la petición fetch
                    return fetch(`${API_URL}/reservas/cancelar?${query}`, { method: 'DELETE' });
                });

                // 3. Esperamos a que TODAS las peticiones terminen
                const responses = await Promise.all(deletePromises);

                // 4. Verificamos si hubo algún error grave
                // (Opcional: Si alguna falla porque ya se borró, no pasa nada, pero si todas fallan lanzamos error)
                const allFailed = responses.every(r => !r.ok);
                if (allFailed) {
                    throw new Error("Error al eliminar las reservas seleccionadas.");
                }

                showSuccess('Reservas Eliminadas', `Se han liberado ${celdasAEliminar.length} fechas correctamente.`);
                return;
            }

            // --- LÓGICA CREAR RESERVA (POST) ---
            const grupos = {};
            selectedCells.forEach(s => {
                if (!grupos[s.habId]) grupos[s.habId] = [];
                grupos[s.habId].push(s.fecha);
            });

            for (const habId in grupos) {
                const fechasOrd = grupos[habId].sort();
                const tramos = [];
                let inicio = fechasOrd[0], previo = fechasOrd[0];

                for (let i = 1; i < fechasOrd.length; i++) {
                    const actual = fechasOrd[i];
                    const diff = (new Date(actual) - new Date(previo)) / 86400000;
                    if (diff === 1) previo = actual;
                    else { tramos.push([inicio, previo]); inicio = actual; previo = actual; }
                }
                tramos.push([inicio, previo]);

                for (const tramo of tramos) {
                    const [ingreso, ultimo] = tramo;
                    const d = new Date(ultimo + "T12:00:00");
                    d.setDate(d.getDate() + 1);
                    const egreso = d.toISOString().split('T')[0];

                    const payload = {
                        ingreso, egreso,
                        huesped: {
                            tipoDocumento: titular.tipoDoc,
                            documento: titular.numDoc,
                            nombre: titular.nombre,
                            apellido: titular.apellido,
                            telefono: titular.telefono
                        },
                        habitaciones: [parseInt(habId)],
                        ocupantesPorHabitacion: {}
                    };

                    const res = await fetch(`${API_URL}/reservas`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error("Error al procesar reserva.");
                }
            }
            showSuccess('Éxito', 'Reserva creada correctamente.');
        } catch (e) { showError('Error', e.message); }
    };

    // Helpers UI
    const showError = (t, d) => setErrorModal({ isOpen: true, titulo: t, descripcion: d });
    const closeError = () => setErrorModal({ ...errorModal, isOpen: false });
    const showSuccess = (t, d) => setSuccessModal({ isOpen: true, titulo: t, descripcion: d });
    const closeSuccess = () => {
        setSuccessModal({ ...successModal, isOpen: false });
        setStep(2); setSelectedCells([]); setTitular({ tipoDoc: 'DNI', numDoc: '', nombre: '', apellido: '', telefono: '' });
        setErrores({}); handleBuscar(); // Recarga la matriz
    };
    const showConfirmAction = (t, d) => setActionModal({ isOpen: true, titulo: t, descripcion: d });
    const closeAction = () => setActionModal({ ...actionModal, isOpen: false });
    const getHabId = (h) => h.idHabitacion || h.id;

    return (
        <ProtectedRoute>
            {errorModal.isOpen && <ErrorModal titulo={errorModal.titulo} descripcion={errorModal.descripcion} onClose={closeError} />}
            {successModal.isOpen && <SuccessModal titulo={successModal.titulo} descripcion={successModal.descripcion} onClose={closeSuccess} />}
            {actionModal.isOpen && <ActionModal titulo={actionModal.titulo} descripcion={actionModal.descripcion} onCancel={closeAction} onConfirm={handleModalConfirm} confirmText="Aceptar" />}

            <div className={styles.dashboardBackground}>
                <div className={styles.container}>
                    <h1 className={styles.title}>DISPONIBILIDAD DE HABITACIONES</h1>
                    <div className={styles.formContainer}>

                        {step === 1 && (
                            <div className={styles.gridTop}>
                                <div className={styles.fieldWrapper}>
                                    <label>Desde Fecha</label>
                                    <input type="date" className={styles.input} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} min={todayString} />
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label>Hasta Fecha</label>
                                    <input type="date" className={styles.input} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} min={fechaDesde || todayString} />
                                </div>
                                <button className={styles.btnBuscar} onClick={handleBuscar} disabled={loading}>{loading ? "..." : "BUSCAR"}</button>
                            </div>
                        )}

                        {step === 2 && (
                            <>
                                <div className={styles.topActions}>
                                    <button className={styles.btnVolverOrange} onClick={() => setStep(1)}>VOLVER</button>

                                    {/* BOTÓN RESERVAR (Se deshabilita si hay celdas amarillas seleccionadas) */}
                                    <button
                                        className={styles.btnReservarGreen}
                                        onClick={() => handleIniciarProceso('RESERVAR')}
                                        disabled={hayReservasSeleccionadas || selectedCells.length === 0}
                                        style={(hayReservasSeleccionadas || selectedCells.length === 0) ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#ccc' } : {}}
                                    >
                                        RESERVAR ({selectedCells.length})
                                    </button>

                                    {/* BOTÓN ELIMINAR RESERVA (Restaurado: Se habilita si hay celdas amarillas) */}
                                    <button
                                        className={styles.btnEliminar || styles.btnRemove} // Asegúrate que 'btnEliminar' exista en tu CSS o usa un estilo inline de fallback
                                        style={{
                                            backgroundColor: hayReservasSeleccionadas ? '#d32f2f' : '#ccc',
                                            color: 'white', padding: '10px 25px', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: hayReservasSeleccionadas ? 'pointer' : 'not-allowed', marginLeft: '10px'
                                        }}
                                        onClick={() => handleIniciarProceso('ELIMINAR')}
                                        disabled={!hayReservasSeleccionadas}
                                        title="Eliminar la reserva seleccionada (Solo para Celdas Amarillas)"
                                    >
                                        ELIMINAR RESERVA
                                    </button>
                                </div>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.matrixTable}>
                                        <thead>
                                        <tr>
                                            <th className={styles.stickyCol}>Fecha</th>
                                            {habitaciones.map(h => <th key={getHabId(h)}>{h.tipo}<br/>Hab. {h.numero}<br/><small style={{color:'#666'}}>Cap: {h.capacidad}</small></th>)}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {daysRange.map(d => (
                                            <tr key={d}>
                                                <td className={styles.stickyCol}><b>{d}</b></td>
                                                {matrixData.map(h => {
                                                    const info = h.estadosPorDia?.find(x => x.fecha === d);
                                                    const estado = info?.estado || 'DISPONIBLE';
                                                    const id = getHabId(h);
                                                    const sel = selectedCells.some(c => c.habId === id && c.fecha === d);
                                                    return (
                                                        <td key={`${id}-${d}`} className={styles.cellCenter}>
                                                            <div
                                                                className={`${styles.checkboxSquare} ${styles[estado] || styles.DISPONIBLE} ${sel ? styles.selected : ''}`}
                                                                onClick={() => handleCellClick(id, d, estado, h.tipo, h.numero, h.capacidad)}
                                                            >
                                                                {sel ? "✓" : estado === 'DISPONIBLE' ? "+" : "x"}
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

                        {step === 3 && (
                            <div className="animate-fadeIn">
                                <h3 style={{ textAlign: 'center', marginBottom:'20px', color: '#444' }}>
                                    Datos del Cliente (RESERVAR)
                                </h3>

                                <div className={styles.selectionInfo}>
                                    <p style={{margin:0, fontWeight:'bold', color: '#2196f3'}}>Resumen de selección:</p>
                                    <ul style={{ listStyle: 'none', padding: 0, margin:'10px 0 0 0' }}>
                                        {selectedCells.map((s, i) => (
                                            <li key={i} style={{ fontSize:'0.9rem', color: '#2196f3' }}>
                                                {s.fecha} — Hab. {s.numero} ({s.tipoHabitacion})
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <form onSubmit={onFormSubmit}>
                                    <div style={{marginTop:'20px'}}>
                                        <h4 style={{color:'#666', borderBottom:'1px solid #ddd', paddingBottom:'5px', marginBottom:'15px'}}>Titular de la Reserva</h4>
                                        <div className={styles.gridMiddle}>
                                            <div className={styles.fieldWrapper}>
                                                <label>Tipo Doc</label>
                                                <select className={styles.select} value={titular.tipoDoc} onChange={e => handleTitularChange('tipoDoc', e.target.value)}>
                                                    <option>DNI</option>
                                                    <option>PASAPORTE</option>
                                                    <option>LC</option>
                                                    <option>LE</option>
                                                    <option>OTRO</option>
                                                </select>
                                            </div>
                                            <div className={styles.fieldWrapper}>
                                                <label>Nro Doc (*)</label>
                                                <div style={{display:'flex', gap:'8px'}}>
                                                    <input className={`${styles.input} ${errores.numDoc ? styles.inputError : ''}`} value={titular.numDoc} onChange={e => handleTitularChange('numDoc', e.target.value)} required placeholder="Ej: 12345678" />
                                                    <button type="button" className={styles.btnSearchSmall} onClick={buscarTitular} disabled={buscandoTitular} title="Buscar titular">{buscandoTitular ? "..." : "🔍"}</button>
                                                </div>
                                                {errores.numDoc && <div className={styles.errorTooltip}>{errores.numDoc}</div>}
                                            </div>
                                        </div>
                                        <div className={styles.gridBottom}>
                                            <div className={styles.fieldWrapper}>
                                                <label>Nombre (*)</label>
                                                <input className={`${styles.input} ${styles.inputReadOnly}`} value={titular.nombre} readOnly />
                                            </div>
                                            <div className={styles.fieldWrapper}>
                                                <label>Apellido (*)</label>
                                                <input className={`${styles.input}`} value={titular.apellido} readOnly />
                                            </div>
                                            <div className={styles.fieldWrapper}>
                                                <label>Teléfono (*)</label>
                                                <input className={`${styles.input}`} value={titular.telefono} readOnly />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.footerActions}>
                                        <button type="button" className={styles.btnVolverOrange} onClick={() => setStep(2)}>VOLVER</button>
                                        <button type="submit" className={styles.btnReservarGreen}>CONFIRMAR RESERVA</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}