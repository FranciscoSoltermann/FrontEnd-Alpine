'use client';
import styles from './FieldErrorTooltip.module.css';
// Puedes usar 'FaExclamationTriangle' de react-icons si la tienes
// o 'IoWarningOutline' como en tus otros modales.
import { IoWarningOutline } from 'react-icons/io5';

export default function FieldErrorTooltip({ message }) {
  // No muestra nada si no hay mensaje de error
  if (!message) return null; 

  return (
    // Este es el contenedor rojo claro que me mostraste
    <div className={styles.error}>
      {/* Este es el "pico" o "flecha" */}
      <div className={styles.errorBeak}></div>
      
      {/* Contenido (icono + texto) */}
      <IoWarningOutline className={styles.icon} />
      <span>{message}</span>
    </div>
  );
}