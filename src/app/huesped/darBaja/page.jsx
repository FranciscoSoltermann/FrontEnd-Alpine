'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/layout/ProtectedRoute';
import styles from '@/app/huesped/buscar/buscar.module.css';
import { FaSearch, FaTrashAlt, FaArrowLeft } from 'react-icons/fa';

import { buscarHuespedes, eliminarHuesped } from '@/services/api';

import ActionModal from '@/app/components/ui/modals/ActionModal';
import SuccessModal from '@/app/components/ui/modals/SuccessModal';
import ErrorModal from '@/app/components/ui/modals/ErrorModal';

export default function BajaHuespedPage() {
    const router = useRouter();

    // --- ESTADOS DE BÚSQUEDA ---
    const [apellidos, setApellidos] = useState('');
    const [nombre, setNombre] = useState('');
    const [tipoDoc, setTipoDoc] = useState('DNI');
    const [numDoc, setNumDoc] = useState('');

    const [resultados, setResultados] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errores, setErrores] = useState({});

    // --- ESTADOS DE ELIMINACIÓN ---
    const [huespedAEliminar, setHuespedAEliminar] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorEliminacion, setErrorEliminacion] = useState(''); // Aquí se guardará tu mensaje del Backend

    // --- VALIDACIÓN DE INPUTS ---
    const validarCampo = (campo, valor) => {
        if (!valor) return "";
        const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
        const soloNumeros = /^[0-9]*$/;

        if ((campo === 'apellidos' || campo === 'nombre') && !soloLetras.test(valor)) {
            return `El ${campo === 'apellidos' ? 'apellido' : 'nombre'} solo puede contener letras.`;
        }
        if (campo === 'numDoc' && !soloNumeros.test(valor)) {
            return "El documento solo puede contener números.";
        }
        return "";
    };

    const handleChange = (e, setFunction, campo) => {
        const val = e.target.value;
        setFunction(val);
        const errorMsg = validarCampo(campo, val);
        setErrores(prev => ({ ...prev, [campo]: errorMsg }));
    };

    // --- BUSCAR HUÉSPED ---
    const handleBuscar = async (e) => {
        e.preventDefault();
        if (Object.values(errores).some(msg => msg !== "")) return;

        setIsLoading(true);
        setHasSearched(false);
        setResultados([]);

        try {
            const params = {
                apellido: apellidos,
                nombre: nombre,
                tipoDocumento: tipoDoc,
                documento: numDoc
            };
            const data = await buscarHuespedes(params);
            setResultados(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setHasSearched(true);
        }
    };

    // --- INICIAR ELIMINACIÓN ---
    const iniciarEliminacion = (huesped) => {
        setHuespedAEliminar(huesped);
        setShowConfirmModal(true); // Abre modal de confirmación
    };

    // --- CONFIRMAR ELIMINACIÓN ---
    const confirmarEliminacion = async () => {
        setShowConfirmModal(false);
        if (!huespedAEliminar) return;

        try {
            // Llama al backend
            await eliminarHuesped(huespedAEliminar.id);

            // SI ÉXITO: Actualiza tabla y muestra modal verde
            setResultados(prev => prev.filter(h => h.id !== huespedAEliminar.id));
            setShowSuccessModal(true);

        } catch (err) {
            // SI FALLA (tu excepción): Muestra modal rojo con tu mensaje
            // err.message vendrá con "No se puede eliminar el huésped porque tiene Reservas..."
            setErrorEliminacion(err.message);
        } finally {
            setHuespedAEliminar(null);
        }
    };

    // --- RENDERIZADO DE TABLA ---
    const renderTableBody = () => {
        if (resultados.length === 0) {
            return (
                <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                        No se encontraron resultados.
                    </td>
                </tr>
            );
        }

        return resultados.map((huesped) => (
            <tr key={huesped.id}>
                <td>{huesped.nombre}</td>
                <td>{huesped.apellido}</td>
                <td>{huesped.tipoDocumento}</td>
                <td>{huesped.documento}</td>
                <td style={{ textAlign: 'center' }}>
                    <button
                        onClick={() => iniciarEliminacion(huesped)}
                        title="Eliminar Huésped"
                        style={{
                            background: '#fee2e2',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#dc2626',
                            padding: '6px 12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '600'
                        }}
                    >
                        <FaTrashAlt /> ELIMINAR
                    </button>
                </td>
            </tr>
        ));
    };

    return (
        <ProtectedRoute>
            <main className={styles.container}>

                <header className={styles.header}>
                    <h1>DAR DE BAJA HUÉSPED</h1>
                </header>

                {/* FORMULARIO DE BÚSQUEDA */}
                <form className={styles.formBusqueda} onSubmit={handleBuscar}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="apellidos">Apellido</label>
                        <input id="apellidos" type="text" value={apellidos} onChange={(e) => handleChange(e, setApellidos, 'apellidos')} className={errores.apellidos ? styles.inputError : ''} />
                        {errores.apellidos && <div className={styles.errorPopup}>{errores.apellidos}</div>}
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="nombre">Nombre</label>
                        <input id="nombre" type="text" value={nombre} onChange={(e) => handleChange(e, setNombre, 'nombre')} className={errores.nombre ? styles.inputError : ''} />
                        {errores.nombre && <div className={styles.errorPopup}>{errores.nombre}</div>}
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="tipoDoc">Tipo Doc.</label>
                        <select id="tipoDoc" value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                            <option value="DNI">DNI</option>
                            <option value="PASAPORTE">PASAPORTE</option>
                            <option value="LE">LE</option>
                            <option value="LC">LC</option>
                            <option value="OTRO">OTRO</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="numDoc">N° Documento</label>
                        <input id="numDoc" type="text" value={numDoc} onChange={(e) => handleChange(e, setNumDoc, 'numDoc')} className={errores.numDoc ? styles.inputError : ''} />
                        {errores.numDoc && <div className={styles.errorPopup}>{errores.numDoc}</div>}
                    </div>
                    <button type="submit" className={styles.btnBuscar} disabled={isLoading}>
                        {isLoading ? 'BUSCANDO...' : 'BUSCAR'}
                    </button>
                </form>

                {/* TABLA DE RESULTADOS */}
                {hasSearched && (
                    <div className={styles.tableContainer}>
                        <table>
                            <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Tipo</th>
                                <th>Documento</th>
                                <th>Acción</th>
                            </tr>
                            </thead>
                            <tbody>
                            {renderTableBody()}
                            </tbody>
                        </table>
                    </div>
                )}

                <footer className={styles.footerActions} style={{ justifyContent: 'flex-start' }}>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className={`${styles.btn} ${styles.btnCancelar}`}
                        style={{ minWidth: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <FaArrowLeft style={{ marginRight: '8px' }}/> VOLVER AL MENÚ
                    </button>
                </footer>

                {/* --- MODALES --- */}

                {/* 1. Modal de Confirmación */}
                {showConfirmModal && huespedAEliminar && (
                    <ActionModal
                        titulo="Eliminar Huésped"
                        descripcion={`¿Confirma que desea eliminar a ${huespedAEliminar.apellido}, ${huespedAEliminar.nombre}? Esta acción eliminará sus datos del sistema de forma permanente.`}
                        confirmText="Eliminar"
                        cancelText="Cancelar"
                        onConfirm={confirmarEliminacion}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                )}

                {/* 2. Modal de Éxito */}
                {showSuccessModal && (
                    <SuccessModal
                        titulo="Huésped Eliminado"
                        descripcion="El registro ha sido eliminado correctamente del sistema."
                        onClose={() => setShowSuccessModal(false)}
                    />
                )}

                {/* 3. Modal de Error (Muestra tu mensaje del Backend) */}
                {errorEliminacion && (
                    <ErrorModal
                        titulo="No se pudo eliminar"
                        descripcion={errorEliminacion}
                        onClose={() => setErrorEliminacion('')}
                    />
                )}

            </main>
        </ProtectedRoute>
    );
}