// src/app/registro/page.jsx
import RegistroForm from '../components/RegistroForm'; // Importamos el nuevo formulario

export default function RegistroPage() {
  return (
    // Reutilizamos el fondo verde pálido
    <main style={{ backgroundColor: '#e6f5e6', minHeight: 'calc(100vh - 60px)' }}>
      <RegistroForm />
    </main>
  );
}