'use client';
import Link from 'next/link';
import styles from './Header.module.css';
import { useAuth } from './AuthContext.jsx'; 
import { useRouter } from 'next/navigation';
import { FaUser } from 'react-icons/fa'; 

export default function Header() {
  const { user, logout } = useAuth(); 
  const router = useRouter();

  const handleLogout = () => {
    logout(); 
    router.push('/login'); 
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
            <>
              <li>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Cerrar Sesión
                </button>
              </li>
            </>
          ) : (
            
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