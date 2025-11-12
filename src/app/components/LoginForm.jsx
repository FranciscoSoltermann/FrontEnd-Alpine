'use client';
import { useState } from 'react';
import styles from './LoginForm.module.css';
import { useAuth } from './AuthContext.jsx';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import SuccessModal from './SuccessModal';

export default function LoginForm() {
  const [nombre, setNombre] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const API_URL = 'http://localhost:8080/api/usuarios/login'; 

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contrasenia }), 
      });

      if (!respuesta.ok) {
        const errorMsg = await respuesta.text();
        setError(errorMsg || 'Usuario o contraseña incorrectos');
        return;
      }

      const usuario = await respuesta.json();
      login(usuario);
      setSuccessModal({
        titulo: "¡Bienvenido!",
        descripcion: `Inicio de sesión exitoso, ${usuario.nombre}.`,
        onClose: () => {
          setSuccessModal(null);
          // La redirección AHORA va aquí:
          router.push('/dashboard'); 
        }
      });
      
    } catch (err) {
      console.error('Error de conexión:', err);
      setError('No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit}>
        <h1 className={styles.title}>ENTRAR CON USUARIO Y CONTRASEÑA</h1>
        
        <div className={styles.fieldWrapper}>
          <label htmlFor="username">Usuario</label>
          <input
            type="text"
            id="username"
            name="username"
            className={styles.inputField}
            placeholder="Ingrese su usuario"
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
              name="password"
              className={styles.inputField}
              placeholder="Ingrese su contraseña"
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

        {/* --- LÍNEA ELIMINADA --- */}
        {/* <a href="#" className={styles.forgotLink}>Olvidé mi contraseña</a> */}

        {/* El margen se ajusta en el CSS (ver abajo) */}
        {error && <p className={styles.errorMessage}>{error}</p>}

        <button type="submit" className={styles.submitButton}>
          INICIAR SESIÓN
        </button>

        <Link href="/registro" className={styles.registerButton}>
          REGISTRARME
        </Link>
        
      </form>
      {successModal && (
        <SuccessModal
          titulo={successModal.titulo}
          descripcion={successModal.descripcion}
          onClose={successModal.onClose}
          buttonText="Aceptar"
        />
      )}
    </div>
  );
}