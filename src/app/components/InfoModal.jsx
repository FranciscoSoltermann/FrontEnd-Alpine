'use client';
import styles from './InfoModal.module.css';

import { IoInformationCircleOutline } from 'react-icons/io5';

export default function InfoModal({ 
  titulo, 
  descripcion, 
  onConfirm, 
  onCancel, 
  confirmText = 'Acción 2', 
  cancelText = 'Acción 1'  
}) {
  return (
    
    <div className={styles.modalOverlay} onClick={onCancel}>
      
      {/* Contenedor del modal */}
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Encabezado Gris (como en tu imagen) */}
        <div className={styles.header}>
          <IoInformationCircleOutline className={styles.icon} />
          <h3>{titulo}</h3>
        </div>
        
        {/* Cuerpo del mensaje */}
        <div className={styles.body}>
          <p>{descripcion}</p>
        </div>
        
        {/* Pie con los dos botones */}
        <div className={styles.footer}>
          <button onClick={onCancel} className={`${styles.button} ${styles.cancelButton}`}>
            {cancelText} {/* Acción 1 (Rojo) */}
          </button>
          <button onClick={onConfirm} className={`${styles.button} ${styles.confirmButton}`}>
            {confirmText} {/* Acción 2 (Verde) */}
          </button>
        </div>

      </div>
    </div>
  );
}