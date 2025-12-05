'use client';
import styles from './ErrorModal.module.css';
// Importamos un ícono de la librería que ya tienes instalada
import { IoMdCloseCircle } from 'react-icons/io';

export default function ErrorModal({ titulo, descripcion, onClose }) {
  return (
    // Capa oscura que cubre toda la pantalla
    <div className={styles.modalOverlay} onClick={onClose}>
      
      {/* Contenedor del modal (evita que se cierre al hacer clic dentro) */}
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Encabezado rojo (inspirado en tu imagen) */}
        <div className={styles.header}>
          <IoMdCloseCircle className={styles.icon} />
          <h3>{titulo}</h3>
        </div>
        
        {/* Cuerpo del mensaje */}
        <div className={styles.body}>
          <p>{descripcion}</p>
        </div>
        
        {/* Pie con el botón de cierre */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeButton}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}