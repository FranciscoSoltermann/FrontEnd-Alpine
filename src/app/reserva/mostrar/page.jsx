'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// --- CORRECCIÓN AQUÍ: Usar ../../ en lugar de ../../../ ---
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import ErrorModal from '../../components/ui/modals/ErrorModal';
// -----------------------------------------------------------

import styles from '../reserva.module.css';

// Ajusta la URL si es necesario
const API_URL = "http://localhost:8080/api";

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

export default function MostrarEstadoPage() {
    const router = useRouter();
    const todayString = getTodayString();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [habitaciones, setHabitaciones] = useState([]);
    const [matrixData, setMatrixData] = useState([]);
    const [daysRange, setDaysRange] = useState([]);

    const [fechaDesde, setFechaDesde] = useState(todayString);
    const [fechaHasta, setFechaHasta] = useState('');

    const [errorModal, setErrorModal] = useState({ isOpen: false, titulo: '', descripcion: '' });

    const handleBuscar = async () => {
        if (!fechaDesde || !fechaHasta) return showError('Faltan datos', 'Seleccione el rango de fechas.');
        if (fechaDesde > fechaHasta) return showError('Error', 'La fecha de inicio es mayor a la de salida.');

        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ desde: fechaDesde, hasta: fechaHasta });
            const res = await fetch(`${API_URL}/habitaciones/estado?${queryParams}`);

            if (!res.ok) throw new Error("Error al conectar con el servidor.");

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
        } catch (e) {
            showError('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const showError = (t, d) => setErrorModal({ isOpen: true, titulo: t, descripcion: d });
    const closeError = () => setErrorModal({ ...errorModal, isOpen: false });
    const getHabId = (h) => h.idHabitacion || h.id;

    return (
        <ProtectedRoute>
            {errorModal.isOpen && <ErrorModal titulo={errorModal.titulo} descripcion={errorModal.descripcion} onClose={closeError} />}

            <div className={styles.dashboardBackground}>
                <div className={styles.container}>
                    <h1 className={styles.title}>ESTADO DE HABITACIONES (VISTA)</h1>
                    <div className={styles.formContainer}>

                        {step === 1 && (
                            <div className={styles.gridTop}>
                                <div className={styles.fieldWrapper}>
                                    <label>Desde Fecha</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={fechaDesde}
                                        onChange={e => setFechaDesde(e.target.value)}
                                    />
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label>Hasta Fecha</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={fechaHasta}
                                        onChange={e => setFechaHasta(e.target.value)}
                                        min={fechaDesde}
                                    />
                                </div>
                                <button className={styles.btnBuscar} onClick={handleBuscar} disabled={loading}>
                                    {loading ? "CARGANDO..." : "VER ESTADO"}
                                </button>
                                <button
                                    className={styles.btnVolverOrange}
                                    style={{marginTop: '10px', width: '100%'}}
                                    onClick={() => router.push('/dashboard')}
                                >
                                    CANCELAR
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <>
                                <div className={styles.topActions} style={{justifyContent: 'flex-start'}}>
                                    <button className={styles.btnVolverOrange} onClick={() => setStep(1)}>
                                        ATRÁS
                                    </button>
                                    <button className={styles.btnVolverOrange} style={{marginLeft: '10px'}} onClick={() => router.push('/dashboard')}>
                                        SALIR AL MENÚ
                                    </button>
                                </div>

                                <div className={styles.tableWrapper}>
                                    <table className={styles.matrixTable}>
                                        <thead>
                                        <tr>
                                            <th className={styles.stickyCol}>Fecha</th>
                                            {habitaciones.map(h => (
                                                <th key={getHabId(h)}>
                                                    {h.tipo}<br/>
                                                    Hab. {h.numero}<br/>
                                                    <small style={{color:'#666'}}>Cap: {h.capacidad}</small>
                                                </th>
                                            ))}
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

                                                    let simbolo = "+";
                                                    if (estado === 'OCUPADA') simbolo = "O";
                                                    if (estado === 'RESERVADA') simbolo = "R";
                                                    if (estado === 'MANTENIMIENTO') simbolo = "M";
                                                    if (estado === 'LIMPIEZA') simbolo = "L";

                                                    return (
                                                        <td key={`${id}-${d}`} className={styles.cellCenter}>
                                                            <div
                                                                className={`${styles.checkboxSquare} ${styles[estado] || styles.DISPONIBLE}`}
                                                                style={{cursor: 'default'}}
                                                                title={`Habitación ${h.numero}: ${estado}`}
                                                            >
                                                                {simbolo}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{marginTop: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center'}}>
                                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div className={`${styles.checkboxSquare} ${styles.DISPONIBLE}`}>+</div> Disponible</div>
                                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div className={`${styles.checkboxSquare} ${styles.RESERVADA}`}>R</div> Reservada</div>
                                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div className={`${styles.checkboxSquare} ${styles.OCUPADA}`}>O</div> Ocupada</div>
                                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div className={`${styles.checkboxSquare} ${styles.MANTENIMIENTO}`}>M</div> Mantenimiento</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}