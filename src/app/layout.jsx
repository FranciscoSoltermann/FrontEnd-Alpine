

import { Inter } from 'next/font/google';
import './globals.css';
import Header from './components/Header.jsx';
import { AuthProvider } from './components/AuthContext.jsx'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hotel Premier',
  description: 'Sistema de Gestión Hotelera',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}