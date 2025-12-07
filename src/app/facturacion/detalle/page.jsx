'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './facturaDetalle.module.css';
import { FaPrint, FaArrowLeft } from 'react-icons/fa';

export default function FacturaDetallePage() {
    const router = useRouter();
    const [factura, setFactura] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('ultimaFactura');
        if (data) {
            setFactura(JSON.parse(data));
        } else {
            router.push('/dashboard');
        }
    }, [router]);

    if (!factura) return <div className="text-white text-center mt-10">Generando vista previa...</div>;

    return (
        <div className={styles.container}>

            {/* HOJA DE FACTURA */}
            <div className={styles.invoicePaper}>

                {/* HEADER (Datos del Hotel) */}
                <div className={styles.header}>
                    <div className={styles.hotelInfo}>
                        <h1>Hotel Premier</h1>
                        <p>Av. Siempre Viva 123, Santa Fe</p>
                        <p>IVA Responsable Inscripto</p>
                        <p>CUIT: 30-11223344-9</p>
                    </div>
                    <div className={styles.invoiceData}>
                        <div className={styles.invoiceType}>{factura.tipoFactura}</div>
                        <h3>FACTURA</h3>
                        <p><strong>Nro:</strong> 0001-{String(factura.id || 0).padStart(8, '0')}</p>
                        <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* DATOS CLIENTE */}
                <div className={styles.clientSection}>
                    <div className={styles.clientRow}>
                        <span><span className={styles.label}>Cliente:</span> {factura.responsableNombre}</span>
                        <span><span className={styles.label}>Documento:</span> {factura.responsableDoc}</span>
                    </div>
                    <div className={styles.clientRow}>
                        <span><span className={styles.label}>Condición IVA:</span> {factura.tipoFactura === 'A' ? 'Responsable Inscripto' : 'Consumidor Final'}</span>
                    </div>
                </div>

                {/* --- TABLA DE DETALLES (Lo que pediste) --- */}
                <table className={styles.table}>
                    <thead>
                    <tr>
                        {/* Columna: CANTIDAD */}
                        <th style={{width: '60px', textAlign: 'center'}}>Cant.</th>

                        {/* Columna: DESCRIPCIÓN */}
                        <th>Descripción</th>

                        {/* Columna: PRECIO UNITARIO */}
                        <th className={styles.colRight}>Precio Unit.</th>

                        {/* Columna: SUBTOTAL (Cantidad * Precio) */}
                        <th className={styles.colRight}>Subtotal</th>
                    </tr>
                    </thead>
                    <tbody>
                    {factura.items.map((item, index) => (
                        <tr key={index}>
                            {/* 1. CANTIDAD */}
                            <td style={{textAlign: 'center'}}>{item.cantidad}</td>

                            {/* 2. DESCRIPCIÓN */}
                            <td>
                                {item.descripcion}
                                {/* Si es estadía, le ponemos una etiqueta visual opcional */}
                                {item.esEstadia && <span style={{fontSize:'0.7em', color:'#666', marginLeft:'5px'}}>(Habitación)</span>}
                            </td>

                            {/* 3. PRECIO UNITARIO */}
                            <td className={styles.colRight}>
                                ${(item.precioUnitario).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                            </td>

                            {/* 4. SUBTOTAL */}
                            <td className={styles.colRight} style={{fontWeight: 'bold'}}>
                                ${(item.subtotal).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* TOTALES */}
                <div className={styles.footer}>
                    <div className={styles.totals}>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                            <span>TOTAL:</span>
                            <span>${factura.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>

                <div style={{marginTop: '50px', textAlign: 'center', fontSize: '0.8rem', color: '#888'}}>
                    <p>Original - Documento no válido como factura fiscal (Demo)</p>
                </div>
            </div>

            {/* BOTONES ACCIONES */}
            <div className={styles.actions}>
                <button className={`${styles.btn} ${styles.btnBack}`} onClick={() => router.push('/dashboard')}>
                    <FaArrowLeft /> Volver
                </button>
                <button className={`${styles.btn} ${styles.btnPrint}`} onClick={() => window.print()}>
                    <FaPrint /> Imprimir
                </button>
            </div>
        </div>
    );
}