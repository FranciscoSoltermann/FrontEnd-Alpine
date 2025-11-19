// src/app/page.js

import Formulario from './components/forms/Formulario.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'; // 1. IMPORTA EL GUARDIA

export default function AltaHuespedPage() {
  return (
    // 2. ENVUELVE TU PÁGINA CON EL GUARDIA
    <ProtectedRoute>
      <main style={{ backgroundColor: '#e6f5e6', minHeight: 'calc(100vh - 60px)' }}>
        <Formulario />
      </main>
    </ProtectedRoute>
  );
}