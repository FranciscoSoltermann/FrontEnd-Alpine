// src/app/dashboard/page.jsx

import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute.jsx'; // 1. Importa el guardia
import styles from '../components/Dashboard.module.css'; // 2. Importa sus propios estilos

// 3. Importa los íconos que usaremos
import { FaUserPlus, FaSearch, FaPrint, FaUserMinus } from 'react-icons/fa';

export default function DashboardPage() {
  return (
    // 4. Protegemos la página completa
    <ProtectedRoute>
      <main className={styles.dashboardBackground}>
        <div className={styles.dashboardContainer}>
          <h1 className={styles.title}>Menú Principal</h1>
          <div className={styles.grid}>
            {/* Botón 2: Buscar Huésped */}
            <Link href="/buscar" className={styles.card}>
              <FaSearch size={40} />
              <h2>Buscar Huésped</h2>
              <p>Consultar o modificar datos de un huésped.</p>
            </Link>

            {/* Botón 3: Facturar */}
            <Link href="/facturar" className={styles.card}>
              <FaPrint size={40} />
              <h2>Facturar</h2>
              <p>Generar una nueva factura o ver historial.</p>
            </Link>

            {/* Botón 4: Dar de Baja Huésped */}
            <Link href="/baja" className={styles.card}>
              <FaUserMinus size={40} />
              <h2>Dar de Baja Huésped</h2>
              <p>Eliminar un registro de huésped.</p>
            </Link>

          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}