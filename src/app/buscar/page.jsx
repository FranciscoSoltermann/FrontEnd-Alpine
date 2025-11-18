// app/buscar/page.jsx

'use client'; 

import React, { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute.jsx'; 
import styles from './buscar.module.css'; 

import { buscarHuespedes } from '../../services/api.js';

export default function BuscarPage() {
  const [apellidos, setApellidos] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipoDoc, setTipoDoc] = useState('DNI');
  const [numDoc, setNumDoc] = useState('');
  const [resultados, setResultados] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorApi, setErrorApi] = useState(null);

  // NUEVO ESTADO DE ERRORES
  const [errores, setErrores] = useState({});

  const handleBuscar = async (e) => {
    e.preventDefault();

    const nuevosErrores = {};
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    const soloNumeros = /^[0-9]*$/;
    
    // --- VALIDACIONES ---
    if (apellidos && !soloLetras.test(apellidos)) {
      nuevosErrores.apellidos = "El apellido solo puede contener letras y espacios";
    }

    if (nombre && !soloLetras.test(nombre)) {
      nuevosErrores.nombre = "El nombre solo puede contener letras y espacios";
    }

    if (numDoc && (!soloNumeros.test(numDoc) || numDoc.length < 7 || numDoc.length > 8)) {
      nuevosErrores.numDoc = "El documento debe tener entre 7 y 8 números válidos.";
    }

    // SI HAY ERRORES, LOS MOSTRAMOS Y FRENAME
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    // Si todo OK
    setErrores({});
    setIsLoading(true);
    setErrorApi(null);
    setHasSearched(false);
    setResultados([]);

    try {
      const params = {
        apellido: apellidos,
        nombre: nombre,
        tipoDocumento: tipoDoc,
        documento: numDoc
      };

      const data = await buscarHuespedes(params);
      setResultados(data);

    } catch (error) {
      setErrorApi(error.message);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  const renderTableBody = () => {
    if (errorApi) return null;

    if (resultados.length === 0) {
      return (
        <tr>
          <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
            No se encontraron resultados.
          </td>
        </tr>
      );
    }
    
    return resultados.map((huesped) => (
      <tr key={huesped.id}>
        <td>{huesped.nombre}</td>
        <td>{huesped.apellido}</td>
        <td>{huesped.tipoDocumento}</td>
        <td>{huesped.documento}</td>
        <td><input type="checkbox" /></td>
      </tr>
    ));
  };

  return (
    <ProtectedRoute>
      <main className={styles.container}>
        
        <header className={styles.header}>
          <h1>GESTIONAR HUÉSPED</h1>
        </header>

        <form className={styles.formBusqueda} onSubmit={handleBuscar}>

          {/* APELLIDO */}
          <div className={styles.inputGroup}>
            <label htmlFor="apellidos">Apellido</label>
            <input 
              id="apellidos" 
              type="text" 
              value={apellidos} 
              onChange={(e) => setApellidos(e.target.value)} 
              className={errores.apellidos ? styles.inputError : ''}
            />
            {errores.apellidos && (
              <div className={styles.errorPopup}>{errores.apellidos}</div>
            )}
          </div>

          {/* NOMBRE */}
          <div className={styles.inputGroup}>
            <label htmlFor="nombre">Nombre</label>
            <input 
              id="nombre" 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className={errores.nombre ? styles.inputError : ''}
            />
            {errores.nombre && (
              <div className={styles.errorPopup}>{errores.nombre}</div>
            )}
          </div>

          {/* TIPO DE DOC */}
          <div className={styles.inputGroup}>
            <label htmlFor="tipoDoc">Elija el tipo</label>
            <select 
              id="tipoDoc" 
              value={tipoDoc} 
              onChange={(e) => setTipoDoc(e.target.value)}
            >
              <option value="DNI">DNI</option>
              <option value="PASAPORTE">PASAPORTE</option>
              <option value="LE">LE</option>
              <option value="LC">LC</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>

          {/* NUMERO DOC */}
          <div className={styles.inputGroup}>
            <label htmlFor="numDoc">Número de Documento</label>
            <input 
              id="numDoc" 
              type="text" 
              value={numDoc} 
              onChange={(e) => setNumDoc(e.target.value)} 
              className={errores.numDoc ? styles.inputError : ''}
            />
            {errores.numDoc && (
              <div className={styles.errorPopup}>{errores.numDoc}</div>
            )}
          </div>

          <button 
            type="submit" 
            className={styles.btnBuscar} 
            disabled={isLoading}
          >
            {isLoading ? 'BUSCANDO...' : 'BUSCAR'}
          </button>
        </form>

        {/* TABLA DE RESULTADOS */}
        {hasSearched && (
          <div className={styles.tableContainer}>

            {errorApi && (
              <div className={styles.errorApi}>
                Error: {errorApi}
              </div>
            )}

            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Tipo Documento</th>
                  <th>Numero Documento</th>
                  <th>Seleccion</th>
                </tr>
              </thead>
              <tbody>
                {renderTableBody()}
              </tbody>
            </table>
          </div>
        )}

        <footer className={styles.footerActions}>
          <Link href="/dashboard" className={`${styles.btn} ${styles.btnCancelar}`}>
            CANCELAR
          </Link>
          <Link href="/" className={`${styles.btn} ${styles.btnCrear}`}>
            CREAR HUÉSPED
          </Link>
          <button className={`${styles.btn} ${styles.btnAceptar}`}>
            ACEPTAR
          </button>
        </footer>

      </main>
    </ProtectedRoute>
  );
}
