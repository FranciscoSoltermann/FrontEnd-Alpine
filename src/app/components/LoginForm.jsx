'use client';
import { useState } from 'react';
import styles from './LoginForm.module.css'; // Asumimos que tienes estilos

export default function LoginForm() {
  const [nombre, setNombre] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError] = useState(''); // Estado para manejar el mensaje de error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos

    // Esta es la URL de tu endpoint de Spring Boot
    const API_URL = 'http://localhost:8080/api/usuarios/login'; 

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El body debe coincidir con tu DTO (nombre, contrasenia)
        body: JSON.stringify({ nombre, contrasenia }), 
      });

      // Si la respuesta NO es OK (ej. el 401 que configuramos)
      if (!respuesta.ok) {
        const errorMsg = await respuesta.text(); // Lee el texto: "Usuario o contraseña incorrectos"
        setError(errorMsg); // Muestra el error en la UI
        return; // No sigas
      }

      // Si la respuesta SÍ es OK (200)
      const usuario = await respuesta.json(); // Obtiene el objeto Usuario
      
      console.log('Inicio de sesión exitoso:', usuario);
      alert('¡Bienvenido, ' + usuario.nombre + '!');

      // Aquí es donde normalmente guardarías la sesión o token
      // y redirigirías al usuario:
      // window.location.href = '/'; 

    } catch (err) {
      // Este error salta si el servidor está apagado o hay un problema de CORS
      console.error('Error de conexión:', err);
      setError('No se pudo conectar con el servidor. Revisa la consola.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit}>
        <h1 className={styles.title}>Iniciar Sesión</h1>
        
        <div className={styles.fieldWrapper}>
          <label htmlFor="username">Usuario</label>
          <input
            type="text"
            id="username"
            name="username"
            className={styles.inputField}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)} // Actualiza el estado 'nombre'
            required
          />
        </div>

        <div className={styles.fieldWrapper}>
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            className={styles.inputField}
            value={contrasenia}
            onChange={(e) => setContrasenia(e.target.value)} // Actualiza el estado 'contrasenia'
            required
          />
        </div>

        {/* Aquí se mostrará el mensaje de error */}
        {error && <p className={styles.errorMessage}>{error}</p>}

        <button type="submit" className={styles.submitButton}>
          INGRESAR
        </button>
      </form>
    </div>
  );
}