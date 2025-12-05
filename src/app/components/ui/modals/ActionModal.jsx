'use client';
import styles from './ActionModal.module.css';
// Importamos un ícono de advertencia (Triángulo con !)
import { IoWarningOutline } from 'react-icons/io5';

export default function ActionModal({ 
  titulo, 
  descripcion, 
  onConfirm, 
  onCancel, 
  confirmText = 'Aceptar', // Texto por defecto para el botón de confirmación
}) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Encabezado Naranja para advertencia */}
        <div className={styles.header}>
          <IoWarningOutline className={styles.icon} /> {/* Ícono de advertencia */}
          <h3>{titulo}</h3>
        </div>
        
        {/* Cuerpo del mensaje */}
        <div className={styles.body}>
          <p>{descripcion}</p>
        </div>
        
        {/* Pie con los dos botones */}
        <div className={styles.footer}>
          <button onClick={onConfirm} className={`${styles.button} ${styles.confirmButton}`}>
            {confirmText} {/* Texto configurable */}
          </button>
        </div>

      </div>
    </div>
  );
} 