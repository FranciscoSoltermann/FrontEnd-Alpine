// src/app/login/page.jsx

// Importamos el componente de login que acabamos de crear
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    // Reutilizamos el fondo verde pálido de tu formulario anterior
    <main style={{ backgroundColor: '#e6f5e6', minHeight: '100vh' }}>
      <LoginForm />
    </main>
  );
}