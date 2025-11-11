'use client';
import Link from 'next/link';
import styles from './Header.module.css';
import { useAuth } from './AuthContext.jsx'; // Importa el hook
import { useRouter } from 'next/navigation';
import { FaUser } from 'react-icons/fa'; // Importa el ícono de usuario

export default function Header() {
  const { user, logout } = useAuth(); // Obtiene el usuario y la función de logout
  const router = useRouter();

  const handleLogout = () => {
    logout(); // Llama a la función de logout
    router.push('/login'); // Envía al usuario al login
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          {/* El logo te lleva al Dashboard (si estás logueado) o al Login (si no) */}
          <Link href={user ? "/dashboard" : "/login"}>Hotel Premier</Link>
        </div>
        <ul className={styles.menu}>
          
          {user ? (
            // --- SI EL USUARIO SÍ EXISTE ---
            <>
              {/* <li>
                  <Link href="/">Alta Huésped</Link>  <-- LÍNEA ELIMINADA
                </li> 
              */}
              <li>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Cerrar Sesión
                </button>
              </li>
            </>
          ) : (
            // --- SI EL USUARIO NO EXISTE ---
            <li>
              <Link href="/login" className={styles.iconLink} title="Iniciar Sesión">
                <FaUser size={24} className={styles.loginIcon} /> 
              </Link>
            </li>
          )}

        </ul>
      </nav>
    </header>
  );
}