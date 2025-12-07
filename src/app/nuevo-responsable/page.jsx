'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { crearResponsablePago } from '../../services/api';
import styles from '../components/forms/Formulario.module.css';

// Modales
import SuccessModal from '../components/ui/modals/SuccessModal';
import ErrorModal from '../components/ui/modals/ErrorModal';
import ActionModal from '../components/ui/modals/ActionModal';

// Componente interno con la lógica
function NuevoResponsableContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // LOGICA DE RETORNO:
    const origen = searchParams.get('origen'); // 'dashboard' o 'facturacion'
    const rutaVolver = origen === 'dashboard' ? '/dashboard' : '/facturacion';

    // --- ESTADOS ---
    const [formData, setFormData] = useState({
        razonSocial: '', cuit: '', telefono: '',
        calle: '', numero: '', departamento: '', piso: '',
        codigoPostal: '', localidad: '', provincia: '', pais: 'Argentina'
    });

    const [errores, setErrores] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorModalMsg, setErrorModalMsg] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        let valorFinal = value;

        // Validaciones de entrada
        if (['cuit', 'telefono', 'numero'].includes(name)) valorFinal = value.replace(/[^0-9]/g, '');
        if (['provincia', 'pais'].includes(name)) valorFinal = value.replace(/[^a-zA-Z\s]/g, '');

        setFormData(prev => ({ ...prev, [name]: valorFinal }));
        if (errores[name]) {
            setErrores(prev => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const hasError = (fieldName) => errores[fieldName] !== undefined;

    const handleCancelClick = () => setShowCancelModal(true);

    const confirmCancel = () => {
        setShowCancelModal(false);
        router.push(rutaVolver); // USA LA RUTA DINÁMICA
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        router.push(rutaVolver); // USA LA RUTA DINÁMICA
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrores({});

        const newErrors = {};
        const camposOpcionales = ['piso', 'departamento', 'telefono'];

        Object.keys(formData).forEach((key) => {
            if (!camposOpcionales.includes(key) && !formData[key].toString().trim()) {
                newErrors[key] = 'Este campo es obligatorio';
            }
        });

        if (formData.cuit && formData.cuit.length !== 11) {
            newErrors.cuit = 'El CUIT debe tener 11 números';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrores(newErrors);
            setLoading(false);
            setErrorModalMsg('Por favor, revise los errores marcados en el formulario.');
            return;
        }

        try {
            await crearResponsablePago(formData);
            localStorage.setItem('nuevoResponsableCreado', JSON.stringify({
                razonSocial: formData.razonSocial,
                cuit: formData.cuit
            }));
            setShowSuccessModal(true);
        } catch (err) {
            console.error(err);
            setErrorModalMsg(err.message || 'Ocurrió un error al crear el responsable.');
        } finally {
            setLoading(false);
        }
    };

    const Label = ({ htmlFor, children, required = false }) => (
        <label htmlFor={htmlFor}>
            {children} {required && <span className={styles.asterisk}>(*)</span>}
        </label>
    );

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.title}>NUEVO RESPONSABLE DE PAGO</h1>
            <form onSubmit={handleSubmit}>
                <h2 className={styles.subtitle}>Datos Fiscales</h2>
                <div className={styles.gridContainer}>
                    <div className={`${styles.fieldWrapper} ${styles.colSpan2}`}>
                        <Label htmlFor="razonSocial" required>Razón Social</Label>
                        <input type="text" name="razonSocial" value={formData.razonSocial} onChange={handleChange} className={`${styles.inputField} ${hasError('razonSocial') ? styles.errorField : ''}`} placeholder="Ej: Empresa S.A." />
                    </div>
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="cuit" required>CUIT</Label>
                        <input type="text" name="cuit" value={formData.cuit} onChange={handleChange} className={`${styles.inputField} ${hasError('cuit') ? styles.errorField : ''}`} placeholder="11 dígitos" maxLength={11} />
                        {hasError('cuit') && <div className={styles.error}>{errores.cuit}</div>}
                    </div>
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="telefono">Teléfono</Label>
                        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className={styles.inputField} placeholder="Solo números" />
                    </div>
                </div>

                <h2 className={styles.subtitle}>Dirección</h2>
                <div className={styles.gridContainer}>
                    <div className={`${styles.fieldWrapper} ${styles.colSpan2}`}>
                        <Label htmlFor="calle" required>Calle</Label>
                        <input type="text" name="calle" value={formData.calle} onChange={handleChange} className={`${styles.inputField} ${hasError('calle') ? styles.errorField : ''}`} />
                    </div>
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="numero" required>Número</Label>
                        <input type="text" name="numero" value={formData.numero} onChange={handleChange} className={`${styles.inputField} ${hasError('numero') ? styles.errorField : ''}`} />
                    </div>
                    <div className={styles.departamentoPisoContainer}>
                        <div className={styles.fieldWrapper}>
                            <Label htmlFor="piso">Piso</Label>
                            <input type="text" name="piso" value={formData.piso} onChange={handleChange} className={styles.inputField} />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <Label htmlFor="departamento">Depto</Label>
                            <input type="text" name="departamento" value={formData.departamento} onChange={handleChange} className={styles.inputField} />
                        </div>
                    </div>
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="localidad" required>Localidad</Label>
                        <input type="text" name="localidad" value={formData.localidad} onChange={handleChange} className={`${styles.inputField} ${hasError('localidad') ? styles.errorField : ''}`} />
                    </div>
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="codigoPostal" required>C.P.</Label>
                        <input type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} className={`${styles.inputField} ${hasError('codigoPostal') ? styles.errorField : ''}`} />
                    </div>
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="provincia" required>Provincia</Label>
                        <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} className={`${styles.inputField} ${hasError('provincia') ? styles.errorField : ''}`} />
                    </div>
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="pais" required>País</Label>
                        <input type="text" name="pais" value={formData.pais} onChange={handleChange} className={`${styles.inputField} ${hasError('pais') ? styles.errorField : ''}`} />
                    </div>
                </div>

                <div className={styles.buttonContainer}>
                    <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={handleCancelClick}>CANCELAR</button>
                    <button type="submit" className={`${styles.button} ${styles.submitButton}`} disabled={loading}>{loading ? 'GUARDANDO...' : 'GUARDAR Y VOLVER'}</button>
                </div>
            </form>

            {showSuccessModal && <SuccessModal titulo="Alta Exitosa" descripcion="El responsable de pago se ha creado correctamente." onClose={handleSuccessClose} />}
            {errorModalMsg && <ErrorModal titulo="Error de Validación" descripcion={errorModalMsg} onClose={() => setErrorModalMsg('')} />}
            {showCancelModal && <ActionModal titulo="Cancelar Alta" descripcion="¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados." cancelText="Seguir editando" confirmText="Sí, cancelar" onConfirm={confirmCancel} onCancel={() => setShowCancelModal(false)} />}
        </div>
    );
}

export default function NuevoResponsablePage() {
    return (
        <Suspense fallback={<div style={{textAlign:'center', padding:'50px'}}>Cargando formulario...</div>}>
            <NuevoResponsableContent />
        </Suspense>
    );
}