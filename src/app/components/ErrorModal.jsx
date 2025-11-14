'use client';
import styles from './ErrorModal.module.css';

import { IoMdCloseCircle } from 'react-icons/io';

export default function ErrorModal({ titulo, descripcion, onClose }) {
  return (
    
    <div className={styles.modalOverlay} onClick={onClose}>
      
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        
        <div className={styles.header}>
          <IoMdCloseCircle className={styles.icon} />
          <h3>{titulo}</h3>
        </div>
        
        
        <div className={styles.body}>
          <p>{descripcion}</p>
        </div>
        
        
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeButton}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}