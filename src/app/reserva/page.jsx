'use client';

import { useState } from 'react';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import ErrorModal from '../components/ui/modals/ErrorModal';
import SuccessModal from '../components/ui/modals/SuccessModal';
import ActionModal from '../components/ui/modals/ActionModal';
import styles from './reserva.module.css';

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

export default function ReservasPage() {
    const todayString = getTodayString();

    const [step, setStep] = useState(1);
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

    // Filtros
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // Datos Formulario (Titular)
    const [titular, setTitular] = useState({
        tipoDoc: 'DNI', numDoc: '', nombre: '', apellido: '', telefono: ''
    });

    // Estado para búsqueda
    const [buscandoTitular, setBuscandoTitular] = useState(false);

    // Ocupantes por Habitación
    const [ocupantesPorHab, setOcupantesPorHab] = useState({});

    // Estado para errores de validación
    const [errores, setErrores] = useState({});

    // --- VALIDACIONES ---
    const validarInput = (campo, valor) => {
        let msg = "";
        if (campo === 'numDoc' && valor && !/^[0-9]{7,8}$/.test(valor)) {
            msg = "El DNI debe tener 7 u 8 números.";
        }
        if ((campo === 'nombre' || campo === 'apellido') && valor && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
            msg = "Solo se permiten letras.";
        }
        if (campo === 'telefono' && valor && !/^[0-9]+$/.test(valor)) {
            msg = "Solo se permiten números.";
        }
        setErrores(prev => ({ ...prev, [campo]: msg }));
    };

    const handleTitularChange = (campo, valor) => {
        setTitular(prev => ({ ...prev, [campo]: valor }));
        validarInput(campo, valor);
    };

    // --- NUEVO: BUSCAR TITULAR ---
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
                // Limpiar errores visuales
                setErrores(prev => ({ ...prev, nombre: '', apellido: '', telefono: '', numDoc: '' }));
            } else if (res.status === 404) {
                // No encontrado: limpiamos para que escriba uno nuevo
                setTitular(prev => ({ ...prev, nombre: '', apellido: '', telefono: '' }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setBuscandoTitular(false);
        }
    };

    // --- HANDLERS OCUPANTES ---
    const agregarOcupante = (habId, capacidadMax) => {
        setOcupantesPorHab(prev => {
            const lista = prev[habId] || [];
            if (lista.length >= capacidadMax) return prev;
            return { ...prev, [habId]: [...lista, { nombre: '', apellido: '', dni: '' }] };
        });
    };

    const quitarOcupante = (habId, index) => {
        setOcupantesPorHab(prev => {
            const lista = [...(prev[habId] || [])];
            lista.splice(index, 1);
            return { ...prev, [habId]: lista };
        });
    };

    const handleOcupanteChange = (habId, index, campo, valor) => {
        setOcupantesPorHab(prev => {
            const lista = [...(prev[habId] || [])];
            lista[index] = { ...lista[index], [campo]: valor };
            return { ...prev, [habId]: lista };
        });
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
            setOcupantesPorHab({});
        } catch (e) {
            showError('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (habId, fecha, estado, tipo, numero, capacidad) => {
        if (estado !== 'DISPONIBLE') return;
        setSelectedCells(prev => {
            const exists = prev.find(i => i.habId === habId && i.fecha === fecha);
            if (exists) return prev.filter(i => i !== exists);
            return [...prev, { habId, fecha, tipoHabitacion: tipo, numero, capacidad }];
        });
    };

    const handleIniciarProceso = (tipo) => {
        if (selectedCells.length === 0) return showError('Error', "Seleccione una celda.");
        setAccionTipo(tipo);
        const habsUnicas = [...new Set(selectedCells.map(s => s.habId))];
        const mapInit = { ...ocupantesPorHab };
        habsUnicas.forEach(id => { if (!mapInit[id]) mapInit[id] = []; });
        setOcupantesPorHab(mapInit);
        setStep(3);
    };

    const onFormSubmit = (e) => {
        e.preventDefault();
        if (Object.values(errores).some(m => m)) return showError("Error", "Corrija los campos en rojo.");
        handlePreConfirmar();
    };

    const handlePreConfirmar = () => {
        showConfirmAction(`Confirmar ${accionTipo}`, `¿Desea registrar esta operación?`);
    };

    const handleConfirmarReal = async () => {
        closeAction();
        try {
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
                    // Corrección fecha egreso (+1 día)
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
                        ocupantesPorHabitacion: { [habId]: ocupantesPorHab[habId] || [] }
                    };

                    const endpoint = accionTipo === 'OCUPAR' ? '/reservas/ocupar' : '/reservas';
                    const res = await fetch(`${API_URL}${endpoint}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.mensaje || "Error al procesar.");
                    }
                }
            }
            showSuccess('Éxito', 'Operación completada.');
        } catch (e) {
            showError('Error', e.message);
        }
    };

    const showError = (t, d) => setErrorModal({ isOpen: true, titulo: t, descripcion: d });
    const closeError = () => setErrorModal({ ...errorModal, isOpen: false });
    const showSuccess = (t, d) => setSuccessModal({ isOpen: true, titulo: t, descripcion: d });
    const closeSuccess = () => {
        setSuccessModal({ ...successModal, isOpen: false });
        setStep(2); setSelectedCells([]);
        setTitular({ tipoDoc: 'DNI', numDoc: '', nombre: '', apellido: '', telefono: '' });
        setOcupantesPorHab({}); setErrores({}); setAccionTipo('RESERVAR');
        handleBuscar();
    };
    const showConfirmAction = (t, d) => setActionModal({ isOpen: true, titulo: t, descripcion: d });
    const closeAction = () => setActionModal({ ...actionModal, isOpen: false });
    const getHabId = (h) => h.idHabitacion || h.id;
    const habsSeleccionadasUnicas = habitaciones.filter(h => selectedCells.some(s => s.habId === getHabId(h)));

    return (
        <ProtectedRoute>
            {errorModal.isOpen && <ErrorModal titulo={errorModal.titulo} descripcion={errorModal.descripcion} onClose={closeError} />}
            {successModal.isOpen && <SuccessModal titulo={successModal.titulo} descripcion={successModal.descripcion} onClose={closeSuccess} />}
            {actionModal.isOpen && <ActionModal titulo={actionModal.titulo} descripcion={actionModal.descripcion} onCancel={closeAction} onConfirm={handleConfirmarReal} confirmText="Aceptar" />}

            <div className={styles.container}>
                <h1 className={styles.title}>DISPONIBILIDAD DE HABITACIONES</h1>
                <div className={styles.formContainer}>

                    {/* PASO 1 y 2 */}
                    {step === 1 && (
                        <div className={styles.gridTop}>
                            <div className={styles.fieldWrapper}>
                                <label>Desde</label>
                                <input type="date" className={styles.input} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} min={todayString} />
                            </div>
                            <div className={styles.fieldWrapper}>
                                <label>Hasta</label>
                                <input type="date" className={styles.input} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} min={fechaDesde || todayString} />
                            </div>
                            <button className={styles.btnBuscar} onClick={handleBuscar} disabled={loading}>{loading ? "..." : "BUSCAR"}</button>
                        </div>
                    )}

                    {step === 2 && (
                        <>
                            <div className={styles.topActions}>
                                <button className={styles.btnVolverOrange} onClick={() => setStep(1)}>VOLVER</button>
                                <button className={styles.btnOcuparBlue} onClick={() => handleIniciarProceso('OCUPAR')}>OCUPAR ({selectedCells.length})</button>
                                <button className={styles.btnReservarGreen} onClick={() => handleIniciarProceso('RESERVAR')}>RESERVAR ({selectedCells.length})</button>
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
                                                        <div className={`${styles.checkboxSquare} ${styles[estado] || styles.DISPONIBLE} ${sel ? styles.selected : ''}`} onClick={() => handleCellClick(id, d, estado, h.tipo, h.numero, h.capacidad)}>
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

                    {/* --- PASO 3: FORMULARIO --- */}
                    {step === 3 && (
                        <div className="animate-fadeIn">
                            <h3 style={{ textAlign: 'center', marginBottom:'20px', color: '#444' }}>Datos del Cliente ({accionTipo})</h3>

                            <div className={styles.selectionInfo}>
                                <p style={{margin:0, fontWeight:'bold'}}>Resumen de selección:</p>
                                <ul style={{ listStyle: 'none', padding: 0, margin:'10px 0 0 0' }}>
                                    {selectedCells.map((s, i) => (
                                        <li key={i} style={{ fontSize:'0.9rem' }}>{s.fecha} — Hab. {s.numero} ({s.tipoHabitacion})</li>
                                    ))}
                                </ul>
                            </div>

                            <form onSubmit={onFormSubmit}>
                                {/* SECCIÓN TITULAR (Diseño Limpio) */}
                                <div style={{marginTop:'20px'}}>
                                    <h4 style={{color:'#666', borderBottom:'1px solid #ddd', paddingBottom:'5px', marginBottom:'15px'}}>Titular de la Reserva</h4>

                                    <div className={styles.gridMiddle}>
                                        <div className={styles.fieldWrapper}>
                                            <label>Tipo Doc</label>
                                            <select className={styles.select} value={titular.tipoDoc} onChange={e => handleTitularChange('tipoDoc', e.target.value)}>
                                                <option>DNI</option><option>PASAPORTE</option>
                                            </select>
                                        </div>

                                        {/* BUSCADOR DNI */}
                                        <div className={styles.fieldWrapper}>
                                            <label>Nro Doc (*)</label>
                                            <div style={{display:'flex', gap:'8px'}}>
                                                <input
                                                    className={`${styles.input} ${errores.numDoc ? styles.inputError : ''}`}
                                                    value={titular.numDoc}
                                                    onChange={e => handleTitularChange('numDoc', e.target.value)}
                                                    required
                                                    placeholder="Ej: 12345678"
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.btnSearchSmall}
                                                    onClick={buscarTitular}
                                                    title="Buscar titular existente"
                                                    disabled={buscandoTitular}
                                                >
                                                    {buscandoTitular ? "..." : "🔍"}
                                                </button>
                                            </div>
                                            {errores.numDoc && <div className={styles.errorTooltip}>{errores.numDoc}</div>}
                                        </div>
                                    </div>

                                    <div className={styles.gridBottom}>
                                        <div className={styles.fieldWrapper}>
                                            <label>Nombre (*)</label>
                                            <input
                                                className={`${styles.input} ${errores.nombre ? styles.inputError : ''}`}
                                                value={titular.nombre}
                                                onChange={e => handleTitularChange('nombre', e.target.value)}
                                                required
                                            />
                                            {errores.nombre && <div className={styles.errorTooltip}>{errores.nombre}</div>}
                                        </div>
                                        <div className={styles.fieldWrapper}>
                                            <label>Apellido (*)</label>
                                            <input
                                                className={`${styles.input} ${errores.apellido ? styles.inputError : ''}`}
                                                value={titular.apellido}
                                                onChange={e => handleTitularChange('apellido', e.target.value)}
                                                required
                                            />
                                            {errores.apellido && <div className={styles.errorTooltip}>{errores.apellido}</div>}
                                        </div>
                                        <div className={styles.fieldWrapper}>
                                            <label>Teléfono (*)</label>
                                            <input
                                                className={`${styles.input} ${errores.telefono ? styles.inputError : ''}`}
                                                value={titular.telefono}
                                                onChange={e => handleTitularChange('telefono', e.target.value)}
                                                required
                                            />
                                            {errores.telefono && <div className={styles.errorTooltip}>{errores.telefono}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN OCUPANTES */}
                                <div className={styles.ocupantesContainer}>
                                    <h4 style={{color:'#666', borderBottom:'1px solid #ddd', paddingBottom:'5px', marginBottom:'15px'}}>Ocupantes por Habitación</h4>

                                    {habsSeleccionadasUnicas.map(hab => {
                                        const hId = getHabId(hab);
                                        const ocupantes = ocupantesPorHab[hId] || [];
                                        const lleno = ocupantes.length >= hab.capacidad;

                                        return (
                                            <div key={hId} className={styles.habitacionBlock}>
                                                <div className={styles.habitacionTitle}>
                                                    <span>Habitación {hab.numero} ({hab.tipo})</span>
                                                    <span style={{fontSize:'0.85rem', color: lleno ? '#d32f2f' : '#388e3c'}}>
                                                        ({ocupantes.length}/{hab.capacidad})
                                                    </span>
                                                </div>

                                                {ocupantes.map((ocup, idx) => (
                                                    <div key={idx} className={styles.ocupanteRow}>
                                                        <span style={{color:'#999', fontSize:'0.8rem', width:'20px'}}>#{idx+1}</span>
                                                        <input className={styles.inputSmall} placeholder="Nombre" value={ocup.nombre} onChange={e => handleOcupanteChange(hId, idx, 'nombre', e.target.value)} required />
                                                        <input className={styles.inputSmall} placeholder="Apellido" value={ocup.apellido} onChange={e => handleOcupanteChange(hId, idx, 'apellido', e.target.value)} required />
                                                        <input className={styles.inputSmall} placeholder="DNI" value={ocup.dni} onChange={e => handleOcupanteChange(hId, idx, 'dni', e.target.value)} required />
                                                        <button type="button" className={styles.btnRemove} onClick={() => quitarOcupante(hId, idx)}>✕</button>
                                                    </div>
                                                ))}

                                                {!lleno && (
                                                    <button type="button" className={styles.btnAdd} onClick={() => agregarOcupante(hId, hab.capacidad)}>
                                                        + Agregar Ocupante
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={styles.footerActions}>
                                    <button type="button" className={styles.btnVolverOrange} onClick={() => setStep(2)}>VOLVER</button>
                                    <button type="submit" className={accionTipo === 'OCUPAR' ? styles.btnOcuparBlue : styles.btnReservarGreen}>
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