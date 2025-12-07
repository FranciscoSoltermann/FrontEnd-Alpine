'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearResponsablePago } from '../../services/api';
import styles from '../components/forms/Formulario.module.css';

// Importamos tus Modales
import SuccessModal from '../components/ui/modals/SuccessModal';
import ErrorModal from '../components/ui/modals/ErrorModal';
import ActionModal from '../components/ui/modals/ActionModal';

export default function NuevoResponsablePage() {
    const router = useRouter();

    // --- ESTADOS ---
    const [formData, setFormData] = useState({
        razonSocial: '',
        cuit: '',
        telefono: '',
        calle: '',
        numero: '',
        departamento: '',
        piso: '',
        codigoPostal: '',
        localidad: '',
        provincia: '',
        pais: 'Argentina'
    });

    const [errores, setErrores] = useState({});
    const [loading, setLoading] = useState(false);

    // Estados para los Modales
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorModalMsg, setErrorModalMsg] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        let valorFinal = value;

        // --- VALIDACIONES DE ENTRADA (Input Masking) ---

        // 1. Solo Números: CUIT, Teléfono, Número (Dirección)
        if (['cuit', 'telefono', 'numero'].includes(name)) {
            // Elimina cualquier caracter que NO sea un número
            valorFinal = value.replace(/[^0-9]/g, '');
        }

        // 2. Solo Letras y Espacios: Provincia, País
        if (['provincia', 'pais'].includes(name)) {
            // Elimina cualquier caracter que NO sea letra o espacio
            valorFinal = value.replace(/[^a-zA-Z\s]/g, '');
        }

        // 3. Actualizamos el estado
        setFormData(prev => ({ ...prev, [name]: valorFinal }));

        // Limpiar error del campo específico al escribir
        if (errores[name]) {
            setErrores(prev => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    // Función auxiliar para verificar errores visualmente
    const hasError = (fieldName) => errores[fieldName] !== undefined;

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const confirmCancel = () => {
        setShowCancelModal(false);
        router.push('/facturacion');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrores({}); // Limpiar errores previos

        // --- VALIDACIÓN COMPLETA ANTES DE ENVIAR ---
        const newErrors = {};
        const camposOpcionales = ['piso', 'departamento', 'telefono']; // Teléfono suele ser opcional, pero si lo quieres obligatorio quítalo de aquí

        // 1. Validar campos obligatorios vacíos
        Object.keys(formData).forEach((key) => {
            if (!camposOpcionales.includes(key) && !formData[key].toString().trim()) {
                newErrors[key] = 'Este campo es obligatorio';
            }
        });

        // 2. Validar longitud mínima de CUIT (ej: 11 dígitos)
        if (formData.cuit && formData.cuit.length !== 11) {
            newErrors.cuit = 'El CUIT debe tener 11 números';
        }

        // Si hay errores, detenemos el envío
        if (Object.keys(newErrors).length > 0) {
            setErrores(newErrors);
            setLoading(false);
            setErrorModalMsg('Por favor, revise los errores marcados en el formulario.');
            return;
        }

        try {
            // 1. Llamada al Backend
            await crearResponsablePago(formData);

            // 2. Guardar en localStorage para recuperar en Facturación
            localStorage.setItem('nuevoResponsableCreado', JSON.stringify({
                razonSocial: formData.razonSocial,
                cuit: formData.cuit
            }));

            // 3. Mostrar Modal de Éxito
            setShowSuccessModal(true);

        } catch (err) {
            console.error(err);
            setErrorModalMsg(err.message || 'Ocurrió un error al crear el responsable.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        router.push('/facturacion');
    };

    // Componente Label interno
    const Label = ({ htmlFor, children, required = false }) => (
        <label htmlFor={htmlFor}>
            {children} {required && <span className={styles.asterisk}>(*)</span>}
        </label>
    );

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.title}>NUEVO RESPONSABLE DE PAGO</h1>

            <form onSubmit={handleSubmit}>

                {/* --- SECCIÓN 1: DATOS FISCALES --- */}
                <h2 className={styles.subtitle}>Datos Fiscales</h2>

                <div className={styles.gridContainer}>

                    {/* Razón Social */}
                    <div className={`${styles.fieldWrapper} ${styles.colSpan2}`}>
                        <Label htmlFor="razonSocial" required>Razón Social</Label>
                        <input
                            type="text"
                            name="razonSocial"
                            value={formData.razonSocial}
                            onChange={handleChange}
                            className={`${styles.inputField} ${hasError('razonSocial') ? styles.errorField : ''}`}
                            placeholder="Ej: Empresa S.A."
                        />
                    </div>

                    {/* CUIT (Solo Números) */}
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="cuit" required>CUIT</Label>
                        <input
                            type="text"
                            name="cuit"
                            value={formData.cuit}
                            onChange={handleChange}
                            className={`${styles.inputField} ${hasError('cuit') ? styles.errorField : ''}`}
                            placeholder="Ej: 30123456789 (Solo números)"
                            maxLength={11} // Límite típico de CUIT
                        />
                        {hasError('cuit') && (
                            <div className={styles.error}>{errores.cuit}</div>
                        )}
                    </div>

                    {/* Teléfono (Solo Números) */}
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="telefono">Teléfono</Label>
                        <input
                            type="text" // Usamos text para controlar el input con regex
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            className={styles.inputField}
                            placeholder="Ej: 3482123456 (Solo números)"
                        />
                    </div>
                </div>

                {/* --- SECCIÓN 2: DIRECCIÓN --- */}
                <h2 className={styles.subtitle}>Dirección</h2>

                <div className={styles.gridContainer}>

                    {/* Calle */}
                    <div className={`${styles.fieldWrapper} ${styles.colSpan2}`}>
                        <Label htmlFor="calle" required>Calle</Label>
                        <input
                            type="text"
                            name="calle"
                            value={formData.calle}
                            onChange={handleChange}
                            className={`${styles.inputField} ${hasError('calle') ? styles.errorField : ''}`}
                        />
                    </div>

                    {/* Número (Solo Números) */}
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="numero" required>Número</Label>
                        <input
                            type="text"
                            name="numero"
                            value={formData.numero}
                            onChange={handleChange}
                            className={`${styles.inputField} ${hasError('numero') ? styles.errorField : ''}`}
                            placeholder="Solo números"
                        />
                    </div>

                    {/* Piso y Depto */}
                    <div className={styles.departamentoPisoContainer}>
                        <div className={styles.fieldWrapper}>
                            <Label htmlFor="piso">Piso</Label>
                            <input
                                type="text"
                                name="piso"
                                value={formData.piso}
                                onChange={handleChange}
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <Label htmlFor="departamento">Depto</Label>
                            <input
                                type="text"
                                name="departamento"
                                value={formData.departamento}
                                onChange={handleChange}
                                className={styles.inputField}
                            />
                        </div>
                    </div>

                    {/* Localidad */}
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="localidad" required>Localidad</Label>
                        <input
                            type="text"
                            name="localidad"
                            value={formData.localidad}
                            onChange={handleChange}
                            className={`${styles.inputField} ${hasError('localidad') ? styles.errorField : ''}`}
                        />
                    </div>

                    {/* Código Postal */}
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="codigoPostal" required>C.P.</Label>
                        <input
                            type="text"
                            name="codigoPostal"
                            value={formData.codigoPostal}
                            onChange={handleChange}
                            className={`${styles.inputField} ${hasError('codigoPostal') ? styles.errorField : ''}`}
                        />
                    </div>

                    {/* Provincia (Solo Letras) */}
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="provincia" required>Provincia</Label>
                        <input
                            type="text"
                            name="provincia"
                            value={formData.provincia}
                            onChange={handleChange}
                            className={`${styles.inputField} ${hasError('provincia') ? styles.errorField : ''}`}
                            placeholder="Solo letras"
                        />
                    </div>

                    {/* País (Solo Letras) */}
                    <div className={styles.fieldWrapper}>
                        <Label htmlFor="pais" required>País</Label>
                        <input
                            type="text"
                            name="pais"
                            value={formData.pais}
                            onChange={handleChange}
                            className={`${styles.inputField} ${hasError('pais') ? styles.errorField : ''}`}
                            placeholder="Solo letras"
                        />
                    </div>
                </div>

                {/* --- BOTONES --- */}
                <div className={styles.buttonContainer}>
                    <button
                        type="button"
                        className={`${styles.button} ${styles.cancelButton}`}
                        onClick={handleCancelClick}
                    >
                        CANCELAR
                    </button>

                    <button
                        type="submit"
                        className={`${styles.button} ${styles.submitButton}`}
                        disabled={loading}
                    >
                        {loading ? 'GUARDANDO...' : 'GUARDAR Y VOLVER'}
                    </button>
                </div>

            </form>

            {/* --- MODALES --- */}

            {/* Modal de Éxito */}
            {showSuccessModal && (
                <SuccessModal
                    titulo="Alta Exitosa"
                    descripcion="El responsable de pago se ha creado correctamente."
                    onClose={handleSuccessClose}
                />
            )}

            {/* Modal de Error */}
            {errorModalMsg && (
                <ErrorModal
                    titulo="Error de Validación"
                    descripcion={errorModalMsg}
                    onClose={() => setErrorModalMsg('')}
                />
            )}

            {/* Modal de Confirmación de Cancelación */}
            {showCancelModal && (
                <ActionModal
                    titulo="Cancelar Alta"
                    descripcion="¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados."
                    cancelText="Seguir editando"
                    confirmText="Sí, cancelar"
                    onCancel={() => setShowCancelModal(false)}
                    onConfirm={confirmCancel}
                />
            )}
        </div>
    );
}