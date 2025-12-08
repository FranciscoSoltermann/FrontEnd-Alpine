'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './facturaDetalle.module.css';
import { FaPrint, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

export default function DetalleFacturaPage() {
    const router = useRouter();
    const [factura, setFactura] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('ultimaFactura');
        if (data) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFactura(JSON.parse(data));
        } else {
            router.push('/facturacion');
        }
    }, [router]);

    if (!factura) return null;

    const esFacturaA = factura.tipoFactura === 'A';
    const TASA_IVA = 0.21;

    const formatCurrency = (valor) => {
        // Validación para prevenir NaN en caso de que el valor sea null, undefined o no numérico
        if (typeof valor !== 'number' || isNaN(valor)) return '$ 0.00';
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
    };

    const calcularPrecioMostrar = (precioFinal) => {
        return esFacturaA ? (precioFinal / (1 + TASA_IVA)) : precioFinal;
    };

    // Usando factura.montoTotal (corregido)
    const subtotalNeto = esFacturaA ? (factura.montoTotal / (1 + TASA_IVA)) : factura.montoTotal;
    const montoIva = esFacturaA ? (factura.montoTotal - subtotalNeto) : 0;

    return (
        <div className={styles.container}>
            <div className={styles.facturaPaper}>

                {/* ENCABEZADO */}
                <header className={styles.header}>
                    <div className={styles.empresaInfo}>
                        <h1>HOTEL PREMIER</h1>
                        <p>Av. Siempre Viva 123, Santa Fe</p>
                        <p>IVA Responsable Inscripto</p>
                    </div>
                    <div className={styles.facturaInfo}>
                        <div className={styles.letraGrande}>{factura.tipoFactura}</div>
                        <h2>FACTURA</h2>
                        <p><strong>N°:</strong> {String(factura.id).padStart(8, '0')}</p>
                        <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                </header>

                <div className={styles.clienteInfo}>
                    <p><strong>Señor(es):</strong> {factura.responsableNombre}</p>
                    <p><strong>{factura.tipoFactura === 'A' ? 'CUIT' : 'DNI'}:</strong> {factura.responsableDoc}</p>
                    <p><strong>Condición IVA:</strong> {factura.tipoFactura === 'A' ? 'Responsable Inscripto' : 'Consumidor Final'}</p>
                </div>

                {/* TABLA DE DETALLES */}
                <table className={styles.tablaDetalle}>
                    <thead>
                    <tr>
                        <th style={{width: '40%'}}>Descripción</th>
                        <th style={{textAlign: 'center'}}>Medida</th>
                        <th style={{textAlign: 'center'}}>Cant.</th>
                        <th style={{textAlign: 'right'}}>Precio Unit.</th>
                        <th style={{textAlign: 'right'}}>Subtotal</th>
                    </tr>
                    </thead>
                    <tbody>
                    {/* CONFIRMADO: Usar factura.detalles, que viene de la entidad Factura.java */}
                    {factura.detalles?.map((item, index) => {
                        // Las propiedades de item (descripcion, precioUnitario, subtotal)
                        // coinciden con los nombres de la entidad FacturaDetalle.java

                        const precioUnitarioMostrar = calcularPrecioMostrar(item.precioUnitario);
                        const subtotalMostrar = calcularPrecioMostrar(item.subtotal);

                        return (
                            <tr key={index}>
                                <td>{item.descripcion}</td>
                                {/* NOTA: Usamos item.medida si existe, sino 'UNIDAD'. Se asume que item.medida está disponible. */}
                                <td style={{textAlign: 'center'}}>{item.medida || 'UNIDAD'}</td>
                                <td style={{textAlign: 'center'}}>{item.cantidad}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(precioUnitarioMostrar)}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(subtotalMostrar)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>

                {/* TOTALES */}
                <div className={styles.footerTotales}>

                    {esFacturaA && (
                        <>
                            <div className={styles.filaTotal}>
                                <span>Subtotal Neto:</span>
                                <span>{formatCurrency(subtotalNeto)}</span>
                            </div>
                            <div className={styles.filaTotal}>
                                <span>IVA (21%):</span>
                                <span>{formatCurrency(montoIva)}</span>
                            </div>
                        </>
                    )}

                    <div className={`${styles.filaTotal} ${styles.totalFinal}`}>
                        <span>TOTAL:</span>
                        {/* CONFIRMADO: Usar factura.montoTotal */}
                        <span>{formatCurrency(factura.montoTotal)}</span>
                    </div>
                </div>

                {/* ACCIONES */}
                <div className={styles.actions}>
                    <button className={styles.btnVolver} onClick={() => router.push('/dashboard')}>
                        <FaArrowLeft /> Volver al Menú
                    </button>
                    <button className={styles.btnImprimir} onClick={() => window.print()}>
                        <FaPrint /> Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
}