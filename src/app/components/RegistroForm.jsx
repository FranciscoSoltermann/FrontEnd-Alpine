'use client';
import { useState } from 'react';
import styles from './LoginForm.module.css'; // Reusamos los estilos del Login
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// --- 1. IMPORTA LOS ÍCONOS ---
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function RegistroForm() {
  const [nombre, setNombre] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  // --- 2. AÑADE EL ESTADO PARA MOSTRAR/OCULTAR ---
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const API_URL = 'http://localhost:8080/api/usuarios/registrar'; 

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contrasenia }), 
      });

      if (!respuesta.ok) {
        const errorMsg = await respuesta.text();
        setError(errorMsg);
        return;
      }

      const usuario = await respuesta.json();
      console.log('Usuario registrado:', usuario);
      alert('¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
      
      router.push('/login'); 

    } catch (err) {
      console.error('Error de conexión:', err);
      setError('No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit}>
        <h1 className={styles.title}>REGISTRARSE</h1>
        
        <div className={styles.fieldWrapper}>
          <label htmlFor="username">Usuario (o E-mail)</label>
          <input
            type="text"
            id="username"
            className={styles.inputField}
            placeholder="Ej.: tu-usuario"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        {/* --- 3. REEMPLAZA EL INPUT DE CONTRASEÑA POR ESTE BLOQUE --- */}
        <div className={styles.fieldWrapper}>
          <label htmlFor="password">Contraseña</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={styles.inputField}
              placeholder="Ingresá tu contraseña"
              value={contrasenia}
              onChange={(e) => setContrasenia(e.target.value)}
              required
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} 
              className={styles.eyeIcon}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        {/* --- FIN DEL BLOQUE DE CONTRASEÑA --- */}

        {error && <p className={styles.errorMessage}>{error}</p>}

        <button type="submit" className={styles.submitButton}>
          REGISTRARME
        </button>

        <Link href="/login" className={styles.registerButton}>
          ¿Ya tenés cuenta? Iniciar sesión
        </Link>
        
      </form>
    </div>
  );
}