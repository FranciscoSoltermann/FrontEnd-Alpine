'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cargarConsumo } from '../../../services/api';
import styles from '../../components/forms/Formulario.module.css'; // Reutilizamos estilos
import { FaArrowLeft, FaSave, FaBroom, FaCoffee } from 'react-icons/fa';

// Modales
import SuccessModal from '../../components/ui/modals/SuccessModal';
import ErrorModal from '../../components/ui/modals/ErrorModal';

export default function CargarConsumoPage() {
    const router = useRouter();

    // Estado del formulario
    const [form, setForm] = useState({
        numeroHabitacion: '',
        descripcion: '',
        precioUnitario: '',
        cantidad: 1
    });

    const [loading, setLoading] = useState(false);

    // Estados para modales
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        // Validación básica
        if (!form.numeroHabitacion || !form.descripcion || !form.precioUnitario) {
            setErrorMsg("Por favor complete todos los campos obligatorios.");
            setLoading(false);
            return;
        }

        try {
            await cargarConsumo(form);

            // Éxito: Mostrar modal
            setShowSuccess(true);

        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Al cerrar el modal de éxito, limpiamos solo los datos del producto
    // para permitir cargar otra cosa a la misma habitación rápidamente.
    const handleSuccessClose = () => {
        setShowSuccess(false);
        setForm(prev => ({
            ...prev,
            descripcion: '',
            precioUnitario: '',
            cantidad: 1
        }));
        // Mantenemos el numeroHabitacion por comodidad del usuario
    };

    // Componente auxiliar para Labels
    const Label = ({ children }) => (
        <label className={styles.label}>{children} <span className={styles.asterisk}>*</span></label>
    );

    return (
        <div style={{ padding: '40px', background: '#f3f4f6', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>

            <div className={styles.formContainer} style={{ maxWidth: '600px', width: '100%', height: 'fit-content' }}>

                <h1 className={styles.title} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                    <FaCoffee /> CARGAR CONSUMO
                </h1>

                <form onSubmit={handleSubmit}>

                    {/* 1. Habitación */}
                    <div className={styles.fieldWrapper}>
                        <Label>Nro. de Habitación</Label>
                        <input
                            className={styles.inputField}
                            name="numeroHabitacion"
                            value={form.numeroHabitacion}
                            onChange={handleChange}
                            placeholder="Ej: 104"
                            autoFocus
                            required
                        />
                    </div>

                    {/* 2. Descripción */}
                    <div className={styles.fieldWrapper}>
                        <Label>Producto / Servicio</Label>
                        <input
                            className={styles.inputField}
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            placeholder="Ej: Coca Cola, Lavandería, Rotura Vaso..."
                            required
                        />
                    </div>

                    {/* 3. Precio y Cantidad (En una misma fila) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className={styles.fieldWrapper}>
                            <Label>Precio Unitario ($)</Label>
                            <input
                                type="number"
                                className={styles.inputField}
                                name="precioUnitario"
                                value={form.precioUnitario}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <Label>Cantidad</Label>
                            <input
                                type="number"
                                className={styles.inputField}
                                name="cantidad"
                                value={form.cantidad}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className={styles.buttonContainer} style={{ marginTop: '30px' }}>
                        <button
                            type="button"
                            className={`${styles.button} ${styles.cancelButton}`}
                            onClick={() => router.push('/dashboard')}
                        >
                            <FaArrowLeft style={{ marginRight: '5px' }}/> VOLVER
                        </button>

                        <button
                            type="submit"
                            className={`${styles.button} ${styles.submitButton}`}
                            disabled={loading}
                        >
                            {loading ? 'GUARDANDO...' : <><FaSave style={{ marginRight: '5px' }}/> REGISTRAR</>}
                        </button>
                    </div>

                </form>
            </div>

            {/* --- MODALES --- */}

            {showSuccess && (
                <SuccessModal
                    titulo="Consumo Guardado"
                    descripcion={`Se agregó "${form.descripcion}" a la habitación ${form.numeroHabitacion} correctamente.`}
                    onClose={handleSuccessClose}
                />
            )}

            {errorMsg && (
                <ErrorModal
                    titulo="Error al Cargar"
                    descripcion={errorMsg}
                    onClose={() => setErrorMsg('')}
                />
            )}

        </div>
    );
}