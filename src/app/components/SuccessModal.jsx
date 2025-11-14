'use client';
import styles from './SuccessModal.module.css';

import { IoMdCheckmarkCircle } from 'react-icons/io';

export default function SuccessModal({ 
  titulo, 
  descripcion, 
  onClose, 
  buttonText = 'Aceptar' 
}) {
  return (
    
    <div className={styles.modalOverlay} onClick={onClose}>
      
     
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
      
        <div className={styles.header}>
          <IoMdCheckmarkCircle className={styles.icon} />
          <h3>{titulo}</h3>
        </div>
        
        
        <div className={styles.body}>
          <p>{descripcion}</p>
        </div>
        
        
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.confirmButton}>
            {buttonText}
          </button>
        </div>

      </div>
    </div>
  );
}