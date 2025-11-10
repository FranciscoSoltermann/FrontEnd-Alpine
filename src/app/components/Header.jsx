'use client';
import Link from 'next/link'; // Importante: Usamos Link para navegar en Next.js
import styles from './Header.module.css'; // Su propio archivo de estilos

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          {/* El logo te lleva al inicio (Alta Huésped) */}
          <Link href="/">Hotel Premier</Link>
        </div>
        <ul className={styles.menu}>
          <li>
            {/* Link a la página de Alta de Huésped (la raíz) */}
            <Link href="/">Alta Huésped</Link>
          </li>
          <li>
            {/* Link a la página de Login */}
            <Link href="/login">Iniciar Sesión</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}