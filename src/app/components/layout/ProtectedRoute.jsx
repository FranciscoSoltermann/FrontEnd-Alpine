// src/app/components/ProtectedRoute.jsx
'use client';

import { useAuth } from '@/app/context/AuthContext.jsx';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Espera a que el AuthContext se hidrate desde localStorage
    if (user === null) {
      // Comprueba si el usuario está en localStorage (por si recargó la pág)
      const storedUser = localStorage.getItem('usuario');
      if (!storedUser) {
        // Si no hay usuario en ningún lado, redirige
        router.replace('/login');
      } else {
        // Si estaba en localStorage, se está cargando...
        setIsLoading(false);
      }
    } else {
      // Si el usuario ya está en el estado, no está cargando
      setIsLoading(false);
    }
  }, [user, router]);

  // Muestra un 'Cargando...' mientras verifica la sesión
  if (isLoading || !user) {
    return <p style={{ textAlign: 'center', marginTop: '5rem' }}>Verificando sesión...</p>;
  }

  // Si el usuario existe y no está cargando, muestra la página protegida
  return children;
}