'use client';
import Link from 'next/link';
import styles from './Header.module.css';
import { useAuth } from '@/app/context/AuthContext.jsx';
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
                    <Link href={user ? "/dashboard" : "/login"}>Hotel Premier</Link>
                </div>
                <ul className={styles.menu}>

                    {user ? (
                        // --- SI EL USUARIO SÍ EXISTE ---
                        <>
                            {/* <li>
                                <Link href="/">Alta Huésped</Link>
                                </li>
                            */}

                            {/* AQUI ESTÁ LA CORRECCIÓN: El link va fuera del comentario */}
                            <li>
                                <Link href="/facturacion">Facturación</Link>
                            </li>

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