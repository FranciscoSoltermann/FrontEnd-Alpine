// src/app/reservas/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import styles from './reserva.module.css';

export default function ReservasPage() {
    // Estados del formulario principal
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [tipoDoc, setTipoDoc] = useState('DNI');
    const [numDoc, setNumDoc] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');

    // --- ESTADOS PARA LA TABLA EDITABLE ---
    const [detalle, setDetalle] = useState({
        tipoHabitacion: 'Simple', // Valor por defecto
        fechaIngreso: '',
        horaIngreso: '12:00',     // Valor por defecto (Check-in)
        fechaEgreso: '',
        horaEgreso: '10:00',      // Valor por defecto (Check-out)
        telefonoReserva: ''
    });

    // Helper para obtener el nombre del día (Lunes, Martes...)
    const getNombreDia = (fechaString) => {
        if (!fechaString) return '-';
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        // Ajuste por zona horaria para que no de el día anterior
        const date = new Date(fechaString + 'T00:00:00');
        return dias[date.getDay() === 0 ? 6 : date.getDay() - 1];
    };

    // Handler para cambios en la tabla
    const handleDetalleChange = (e) => {
        const { name, value } = e.target;
        setDetalle(prev => ({ ...prev, [name]: value }));
    };

    return (
        <ProtectedRoute>
            <div className={styles.container}>

                <h1 className={styles.title}>RESERVA DE HABITACIONES</h1>

                <div className={styles.formContainer}>

                    {/* --- FORMULARIO SUPERIOR (BUSQUEDA) --- */}
                    <div className={styles.gridTop}>
                        <div className={styles.fieldWrapper}>
                            <label>Desde Fecha</label>
                            <input type="date" className={styles.input} value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <label>Hasta Fecha</label>
                            <input type="date" className={styles.input} value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                        </div>
                        <button className={styles.btnBuscar}>BUSCAR</button>
                    </div>

                    <div className={styles.gridMiddle}>
                        <div className={styles.fieldWrapper}>
                            <label>Elija el tipo de documento</label>
                            <select className={styles.select} value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                                <option value="DNI">DNI</option>
                                <option value="PASAPORTE">PASAPORTE</option>
                            </select>
                        </div>
                        <div className={styles.fieldWrapper}>
                            <label>Nro de documento</label>
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

                    {/* --- TABLA DE DETALLE EDITABLE --- */}
                    <table className={styles.detailsTable}>
                        <tbody>
                        {/* FILA 1: Tipo Habitación */}
                        <tr>
                            <td className={styles.labelCell}>Tipo habitación</td>
                            <td colSpan="3">
                                <select
                                    name="tipoHabitacion"
                                    className={styles.tableInput}
                                    value={detalle.tipoHabitacion}
                                    onChange={handleDetalleChange}
                                >
                                    <option value="Simple">Simple</option>
                                    <option value="Doble">Doble</option>
                                    <option value="Matrimonial">Matrimonial</option>
                                    <option value="Suite">Suite</option>
                                </select>
                            </td>
                        </tr>

                        {/* FILA 2: Ingreso */}
                        <tr>
                            <td className={styles.labelCell}>Ingreso</td>
                            {/* Nombre del día calculado automático */}
                            <td className={styles.readOnlyText}>{getNombreDia(detalle.fechaIngreso)}</td>
                            <td>
                                <input
                                    type="date"
                                    name="fechaIngreso"
                                    className={styles.tableInput}
                                    value={detalle.fechaIngreso}
                                    onChange={handleDetalleChange}
                                />
                            </td>
                            <td>
                                <input
                                    type="time"
                                    name="horaIngreso"
                                    className={styles.tableInput}
                                    value={detalle.horaIngreso}
                                    onChange={handleDetalleChange}
                                />
                            </td>
                        </tr>

                        {/* FILA 3: Egreso */}
                        <tr>
                            <td className={styles.labelCell}>Egreso</td>
                            {/* Nombre del día calculado automático */}
                            <td className={styles.readOnlyText}>{getNombreDia(detalle.fechaEgreso)}</td>
                            <td>
                                <input
                                    type="date"
                                    name="fechaEgreso"
                                    className={styles.tableInput}
                                    value={detalle.fechaEgreso}
                                    onChange={handleDetalleChange}
                                />
                            </td>
                            <td>
                                <input
                                    type="time"
                                    name="horaEgreso"
                                    className={styles.tableInput}
                                    value={detalle.horaEgreso}
                                    onChange={handleDetalleChange}
                                />
                            </td>
                        </tr>

                        {/* FILA 4: Teléfono (Editable también) */}
                        <tr>
                            <td className={styles.labelCell}>Teléfono</td>
                            <td colSpan="3">
                                <input
                                    type="text"
                                    name="telefonoReserva"
                                    className={styles.tableInput}
                                    value={detalle.telefonoReserva}
                                    onChange={handleDetalleChange}
                                    placeholder="Teléfono de contacto"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    <div className={styles.footerActions}>
                        <Link href="/dashboard">
                            <button className={styles.btnRechazar}>RECHAZAR</button>
                        </Link>
                        <button className={styles.btnAceptar}>ACEPTAR</button>
                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}