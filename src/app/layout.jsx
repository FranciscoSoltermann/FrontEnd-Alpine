// src/app/layout.jsx

import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/app/components/Header.jsx';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hotel Premier', // Título general de la aplicación
  description: 'Sistema de Gestión Hotelera',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Header /> {/* 2. COLOCA EL HEADER AQUÍ (arriba de children) */}
        {children} {/* 3. El resto de tu página (ej. login, alta) se renderizará aquí */}
      </body>
    </html>
  );
}