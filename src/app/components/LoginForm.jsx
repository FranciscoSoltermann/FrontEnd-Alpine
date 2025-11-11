'use client';
import { useState } from 'react';
import styles from './LoginForm.module.css';
import { useAuth } from './AuthContext.jsx'; // 1. Importa el hook de autenticación
import { useRouter } from 'next/navigation'; // 2. Importa el Router para redirigir

export default function LoginForm() {
  const [nombre, setNombre] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth(); // 3. Obtiene la función de login del "cerebro"
  const router = useRouter(); // 4. Obtiene el router

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
      
      // --- ESTA ES LA LÓGICA NUEVA ---
      login(usuario); // 5. Guarda el usuario en el "cerebro" y localStorage
      alert('¡Bienvenido, ' + usuario.nombre + '!');
      router.push('/'); // 6. Redirige al usuario a la página principal
      // --- FIN DE LA LÓGICA NUEVA ---

    } catch (err) {
      console.error('Error de conexión:', err);
      setError('No se pudo conectar con el servidor.');
    }
  };

  // ... (El resto de tu JSX de <form>, <input>, etc. no cambia)
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
            onChange={(e) => setNombre(e.target.value)}
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
            onChange={(e) => setContrasenia(e.target.value)}
            required
          />
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <button type="submit" className={styles.submitButton}>
          INGRESAR
        </button>
      </form>
    </div>
  );
}