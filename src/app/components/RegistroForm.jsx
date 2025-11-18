'use client';
import { useState } from 'react';
import styles from './LoginForm.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { useAuth } from './AuthContext.jsx'; // 🔹 Añadido
import SuccessModal from './SuccessModal';

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

  const sonTodosIguales = numInts.length >= 3 && numInts.every(n => n === numInts[0]);
  if (sonTodosIguales) {
    return "Los números no pueden ser todos iguales (ej. '333').";
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

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { login } = useAuth(); // 🔹 Añadido
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errorPassword = validarContrasenia(contrasenia);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }

    const API_URL = 'http://localhost:8080/api/usuarios/registrar';

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contrasenia }),
      });

      if (!respuesta.ok) {
        // 🔹 Manejo simplificado de errores
        const errorData = await respuesta.json();
        setError(errorData.message || 'Error al registrar. Intente de nuevo.');
        return;
      }

      await respuesta.json();

      // 🔹 AUTO LOGIN DIRECTO después del registro
      login({ nombre });

      // 🔹 Mostrar el cartel verde (SuccessModal)
      setSuccessMessage("¡Usuario registrado con éxito!");
      setShowSuccessModal(true);

      // 🔹 QUITAMOS la redirección automática aquí
      // para que el usuario pueda ver el cartel verde

    } catch (err) {
      console.error('Error de conexión:', err);
      setError('No se pudo conectar con el servidor.');
    }
  };

  // 🔹 Al cerrar el modal → ir al dashboard
  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push('/dashboard'); // 🔹 Ahora sí redirige después de cerrar el modal
  };

  return (
    <div className={styles.loginContainer}>

      {showSuccessModal && (
        <SuccessModal
          titulo="Registro exitoso"
          descripcion={successMessage}
          onClose={handleModalClose}
          buttonText="Continuar" // 🔹 Texto modificado
        />
      )}

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