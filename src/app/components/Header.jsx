'use client';
import Link from 'next/link';
import styles from './Header.module.css';
import { useAuth } from './AuthContext.jsx'; // 1. Importa el hook
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth(); // 2. Obtiene el usuario y la función de logout
  const router = useRouter();

  const handleLogout = () => {
    logout(); // 3. Llama a la función de logout
    router.push('/login'); // 4. Envía al usuario al login
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Link href="/">Hotel Premier</Link>
        </div>
        <ul className={styles.menu}>
          {/* 5. Lógica condicional */}
          {user ? (
            // Si el usuario SÍ existe...
            <>
              <li>
                <Link href="/">Alta Huésped</Link>
              </li>
              <li>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Cerrar Sesión
                </button>
              </li>
            </>
          ) : (
            // Si el usuario NO existe...
            <li>
              <Link href="/login">Iniciar Sesión</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}