// src/app/dashboard/page.jsx

'use client';

import Link from 'next/link';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import styles from './Dashboard.module.css';

// Importamos los íconos
import {
    FaSearch,
    FaPrint,
    FaUserMinus,
    FaCalendarCheck, // Reservar
    FaBed,           // Estado
    FaKey            // Ocupar
} from 'react-icons/fa';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <main className={styles.dashboardBackground}>
                <div className={styles.dashboardContainer}>
                    <h1 className={styles.title}>Menú Principal</h1>

                    <div className={styles.grid}>

                        {/* --- Botón Buscar Huésped (CU 02) --- */}
                        <Link href="/buscar" className={styles.card}>
                            <FaSearch size={40}/>
                            <h2>Buscar Huésped</h2>
                            <p>Consultar o modificar datos de un huésped.</p>
                        </Link>

                        {/* --- NUEVO: Reservar Habitación (CU 04) --- */}
                        <Link href="/reserva" className={styles.card}>
                            <FaCalendarCheck size={40}/>
                            <h2>Reservar</h2>
                            <p>Crear una nueva reserva de habitación.</p>
                        </Link>

                        {/* --- NUEVO: Ocupar Habitación (CU 15) --- */}
                        <Link href="/ocupar" className={styles.card}>
                            <FaKey size={40}/>
                            <h2>Ocupar Habitación</h2>
                            <p>Registrar el ingreso (Check-in).</p>
                        </Link>

                        {/* --- NUEVO: Estado de Habitaciones (CU 05) --- */}
                        <Link href="/estado-habitaciones" className={styles.card}>
                            <FaBed size={40}/>
                            <h2>Estado Habitaciones</h2>
                            <p>Ver disponibilidad y estado de limpieza.</p>
                        </Link>

                        {/* --- Botón Facturar --- */}
                        <Link href="/facturar" className={styles.card}>
                            <FaPrint size={40}/>
                            <h2>Facturar</h2>
                            <p>Generar una nueva factura o ver historial.</p>
                        </Link>

                        {/* --- Botón Dar de Baja Huésped --- */}
                        <Link href="/baja" className={styles.card}>
                            <FaUserMinus size={40}/>
                            <h2>Baja Huésped</h2>
                            <p>Eliminar un registro de huésped.</p>
                        </Link>

                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}