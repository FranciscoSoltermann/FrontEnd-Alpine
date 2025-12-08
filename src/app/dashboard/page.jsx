'use client';

import Link from 'next/link';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import styles from './Dashboard.module.css';

// Importamos los íconos
import {
    FaSearch,
    FaUserMinus,
    FaUserTie,
    FaCalendarCheck,
    FaBed,
    FaKey,
    FaPrint,
    FaMoneyBillWave,
    FaCoffee,
    FaFileInvoiceDollar // <-- NUEVO IMPORT
} from 'react-icons/fa';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <main className={styles.dashboardBackground}>
                <div className={styles.dashboardContainer}>
                    <h1 className={styles.title}>Panel de Control</h1>

                    {/* --- SECCIÓN 1: GESTIÓN DE HUÉSPEDES (Sin cambios) --- */}
                    <section className={styles.section}>
                        {/* ... contenido existente ... */}
                        <h2 className={styles.sectionTitle}>Gestión de Huéspedes</h2>
                        <div className={styles.grid}>
                            <Link href="/huesped/buscar" className={styles.card}>
                                <div className={styles.iconWrapper}><FaSearch size={32}/></div>
                                <h3>Buscar Huésped</h3>
                                <p>Consultar, modificar o dar de alta nuevos huéspedes.</p>
                            </Link>
                            <Link href="/nuevo-responsable?origen=dashboard" className={styles.card}>
                                <div className={styles.iconWrapper}><FaUserTie size={32}/></div>
                                <h3>Alta Responsable</h3>
                                <p>Registrar empresas o terceros para facturación.</p>
                            </Link>
                            <Link href="/huesped/darBaja" className={styles.card}>
                                <div className={styles.iconWrapper}><FaUserMinus size={32}/></div>
                                <h3>Baja Huésped</h3>
                                <p>Eliminar registros del sistema.</p>
                            </Link>
                        </div>
                    </section>

                    {/* --- SECCIÓN 2: RECEPCIÓN Y HABITACIONES (Sin cambios) --- */}
                    <section className={styles.section}>
                        {/* ... contenido existente ... */}
                        <h2 className={styles.sectionTitle}>Recepción y Habitaciones</h2>
                        <div className={styles.grid}>
                            <Link href="/reserva/nueva" className={styles.card}>
                                <div className={styles.iconWrapper}><FaCalendarCheck size={32}/></div>
                                <h3>Nueva Reserva</h3>
                                <p>Consultar disponibilidad y crear reservas.</p>
                            </Link>
                            <Link href="/reserva/ocupar" className={styles.card}>
                                <div className={styles.iconWrapper}><FaKey size={32}/></div>
                                <h3>Ocupar Habitación</h3>
                                <p>Registrar ingreso inmediato (Check-in).</p>
                            </Link>
                            <Link href="/estado-habitaciones" className={styles.card}>
                                <div className={styles.iconWrapper}><FaBed size={32}/></div>
                                <h3>Estado Habitaciones</h3>
                                <p>Ver mapa de ocupación y limpieza.</p>
                            </Link>
                        </div>
                    </section>

                    {/* --- SECCIÓN 3: ADMINISTRACIÓN (AGREGADO AQUÍ) --- */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Administración</h2>
                        <div className={styles.grid}>

                            {/* Facturación */}
                            <Link href="/facturacion" className={styles.card}>
                                <div className={styles.iconWrapper}><FaPrint size={32}/></div>
                                <h3>Facturación</h3>
                                <p>Realizar Check-out y generar comprobantes.</p>
                            </Link>

                            {/* --- NUEVO LINK: NOTA DE CRÉDITO --- */}
                            <Link href="/facturacion/nota-credito" className={styles.card}>
                                <div className={styles.iconWrapper}><FaFileInvoiceDollar size={32}/></div>
                                <h3>Nota de Crédito</h3>
                                <p>Anular facturas emitidas por error.</p>
                            </Link>
                            {/* ------------------------------------ */}

                            {/* Consumos */}
                            <Link href="/consumos/cargar" className={styles.card}>
                                <div className={styles.iconWrapper}><FaCoffee size={32}/></div>
                                <h3>Cargar Consumo</h3>
                                <p>Registrar productos o servicios a una habitación.</p>
                            </Link>

                            {/* Pagos */}
                            <Link href="/pagos" className={styles.card}>
                                <div className={styles.iconWrapper}><FaMoneyBillWave size={32}/></div>
                                <h3>Ingresar Pago</h3>
                                <p>Cobrar facturas pendientes y gestionar caja.</p>
                            </Link>

                        </div>
                    </section>

                </div>
            </main>
        </ProtectedRoute>
    );
}