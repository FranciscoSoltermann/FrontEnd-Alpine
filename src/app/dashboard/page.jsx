'use client';

import Link from 'next/link';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import styles from './Dashboard.module.css';

// Importamos los íconos
import {
    FaSearch,
    FaUserPlus,     // Icono para Alta Huésped (lo agregué por si lo quieres usar)
    FaUserMinus,
    FaUserTie,      // Responsable
    FaCalendarCheck,
    FaBed,
    FaKey,
    FaPrint,
    FaChartLine, FaCoffee     // Un icono genérico para admin si se necesita
} from 'react-icons/fa';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <main className={styles.dashboardBackground}>
                <div className={styles.dashboardContainer}>
                    <h1 className={styles.title}>Panel de Control</h1>

                    {/* --- SECCIÓN 1: GESTIÓN DE HUÉSPEDES --- */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Gestión de Huéspedes</h2>
                        <div className={styles.grid}>

                            {/* Buscar / Gestionar Huésped */}
                            <Link href="huesped/buscar" className={styles.card}>
                                <div className={styles.iconWrapper}><FaSearch size={32}/></div>
                                <h3>Buscar Huésped</h3>
                                <p>Consultar, modificar o dar de alta nuevos huéspedes.</p>
                            </Link>

                            {/* Alta Responsable de Pago */}
                            <Link href="/nuevo-responsable?origen=dashboard" className={styles.card}>
                                <div className={styles.iconWrapper}><FaUserTie size={32}/></div>
                                <h3>Alta Responsable</h3>
                                <p>Registrar empresas o terceros para facturación.</p>
                            </Link>

                            {/* Baja Huésped */}
                            <Link href="huesped/darBaja" className={styles.card}>
                                <div className={styles.iconWrapper}><FaUserMinus size={32}/></div>
                                <h3>Baja Huésped</h3>
                                <p>Eliminar registros del sistema.</p>
                            </Link>
                        </div>
                    </section>

                    {/* --- SECCIÓN 2: RESERVAS Y HABITACIONES --- */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Recepción y Habitaciones</h2>
                        <div className={styles.grid}>

                            {/* Reservar */}
                            <Link href="/reserva" className={styles.card}>
                                <div className={styles.iconWrapper}><FaCalendarCheck size={32}/></div>
                                <h3>Nueva Reserva</h3>
                                <p>Consultar disponibilidad y crear reservas.</p>
                            </Link>

                            {/* Ocupar (Check-in) */}
                            <Link href="/ocupar" className={styles.card}>
                                <div className={styles.iconWrapper}><FaKey size={32}/></div>
                                <h3>Ocupar Habitación</h3>
                                <p>Registrar ingreso inmediato (Check-in).</p>
                            </Link>

                            {/* Estado Habitaciones */}
                            <Link href="/estado-habitaciones" className={styles.card}>
                                <div className={styles.iconWrapper}><FaBed size={32}/></div>
                                <h3>Estado Habitaciones</h3>
                                <p>Ver mapa de ocupación y limpieza.</p>
                            </Link>
                        </div>
                    </section>

                    {/* --- SECCIÓN 3: ADMINISTRACIÓN --- */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Administración</h2>
                        <div className={styles.grid}>

                            {/* Facturación */}
                            <Link href="/facturacion" className={styles.card}>
                                <div className={styles.iconWrapper}><FaPrint size={32}/></div>
                                <h3>Facturación</h3>
                                <p>Realizar Check-out y generar comprobantes.</p>
                            </Link>

                            {/* Consumos */}
                            <Link href="/consumos/cargar" className={styles.card}>
                                <div className={styles.iconWrapper}><FaCoffee size={32}/></div>
                                <h3>Cargar Consumo</h3>
                                <p>Registrar productos o servicios a una habitación.</p>
                            </Link>

                        </div>
                    </section>

                </div>
            </main>
        </ProtectedRoute>
    );
}