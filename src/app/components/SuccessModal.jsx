'use client';
import styles from './SuccessModal.module.css';
// Importamos un ícono de Check (tilde/verificación)
import { IoMdCheckmarkCircle } from 'react-icons/io';

export default function SuccessModal({ 
  titulo, 
  descripcion, 
  onClose, 
  buttonText = 'Aceptar' // Texto del único botón
}) {
  return (
    // Capa oscura de fondo
    <div className={styles.modalOverlay} onClick={onClose}>
      
      {/* Contenedor del modal */}
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Encabezado Verde (para éxito) */}
        <div className={styles.header}>
          <IoMdCheckmarkCircle className={styles.icon} />
          <h3>{titulo}</h3>
        </div>
        
        {/* Cuerpo del mensaje */}
        <div className={styles.body}>
          <p>{descripcion}</p>
        </div>
        
        {/* Pie con el único botón de Aceptar */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.confirmButton}>
            {buttonText}
          </button>
        </div>

      </div>
    </div>
  );
}