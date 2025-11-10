// src/app/page.js

// 1. Importa tu componente de Formulario
import Formulario from '@/app/components/Formulario.jsx';

export default function AltaHuespedPage() {
  return (
    // 2. Aplicamos el fondo verde pálido aquí
    <main style={{ backgroundColor: '#e6f5e6', minHeight: 'calc(100vh - 60px)' }}>
      {/* 3. Mostramos el formulario */}
      <Formulario />
    </main>
  );
}