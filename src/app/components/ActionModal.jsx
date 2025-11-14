'use client';
import styles from './ActionModal.module.css';

import { IoWarningOutline } from 'react-icons/io5';

export default function ActionModal({ 
  titulo, 
  descripcion, 
  onConfirm, 
  onCancel, 
  confirmText = 'Aceptar', 
  cancelText = 'Cancelar'  
}) {
  return (

    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        
        <div className={styles.header}>
          <IoWarningOutline className={styles.icon} /> 
          <h3>{titulo}</h3>
        </div>
        
        
        <div className={styles.body}>
          <p>{descripcion}</p>
        </div>
        
        
        <div className={styles.footer}>
          <button onClick={onCancel} className={`${styles.button} ${styles.cancelButton}`}>
            {cancelText} 
          </button>
          <button onClick={onConfirm} className={`${styles.button} ${styles.confirmButton}`}>
            {confirmText} 
          </button>
        </div>

      </div>
    </div>
  );
} 