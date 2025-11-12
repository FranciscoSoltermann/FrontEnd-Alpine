'use client';
import { useState } from 'react';
import styles from './LoginForm.module.css'; // Reusamos los estilos del Login
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// --- 1. IMPORTA LOS ÍCONOS ---
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * Valida una contraseña según las reglas de negocio.
 * @param {string} password - La contraseña a validar.
 * @returns {string|null} - Devuelve un mensaje de error si es inválida, o null si es válida.
 */
function validarContrasenia(password) {
  const letras = (password.match(/[a-zA-Z]/g) || []).length;
  const numeros = (password.match(/\d/g) || []);
  const numInts = numeros.map(n => parseInt(n));

  if (letras < 5) {
    return "La contraseña debe tener al menos 5 letras.";
  }
  if (numeros.length < 3) {
    return "La contraseña debe tener al menos 3 números.";
  }

  if (numeros.length >= 3) {
    const sonTodosIguales = numInts.every(n => n === numInts[0]);
    if (sonTodosIguales) {
      return "Los números no pueden ser todos iguales (ej. '333').";
    }
  }

  for (let i = 0; i < numInts.length - 2; i++) {
    const n1 = numInts[i];
    const n2 = numInts[i + 1];
    const n3 = numInts[i + 2];

    if (n1 + 1 === n2 && n2 + 1 === n3) {
      return "Los números no pueden ser consecutivos (ej. '123').";
    }
    if (n1 - 1 === n2 && n2 - 1 === n3) {
      return "Los números no pueden ser consecutivos (ej. '321').";
    }
  }

  return null;
}

export default function RegistroForm() {
  const [nombre, setNombre] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- 🔹 VALIDACIÓN FRONT-END ---
    const errorPassword = validarContrasenia(contrasenia);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }
    // --- 🔹 FIN VALIDACIÓN ---

    const API_URL = 'http://localhost:8080/api/usuarios/registrar'; 

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contrasenia }), 
      });

      if (!respuesta.ok) {
        // Si el backend devuelve JSON con detalles
        try {
          const errorData = await respuesta.json();
          if (errorData.nombre) setError(errorData.nombre);
          else if (errorData.contrasenia) setError(errorData.contrasenia);
          else setError(errorData.message || 'Error al registrar. Intente de nuevo.');
        } catch {
          // Si no es JSON (texto plano)
          const errorMsg = await respuesta.text();
          setError(errorMsg);
        }
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

        {/* --- BLOQUE DE CONTRASEÑA --- */}
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
