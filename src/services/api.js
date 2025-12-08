// Mantenemos tu constante original
const API_URL = 'http://localhost:8080/api';

// --- USUARIOS ---
export async function iniciarSesion(nombre, contrasenia) {
    const respuesta = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contrasenia })
    });

    if (!respuesta.ok) {
        throw new Error('Error al iniciar sesión');
    }

    return await respuesta.json();
}

// --- HUESPEDES ---
export const buscarHuespedes = async (params) => {
    try {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_URL}/huespedes/buscar?${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        await manejarErrores(response);
        return await response.json();

    } catch (error) {
        console.error('Error en buscarHuespedes:', error.message);
        throw new Error(error.message || 'No se pudo conectar con el servidor.');
    }
};

export const eliminarHuesped = async (id) => {
    const response = await fetch(`${API_URL}/huespedes/eliminar/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar el huésped.');
    }

    return await response.json();
};

// --- HABITACIONES ---
export const obtenerDisponibilidad = async (fechaDesde, fechaHasta) => {
    try {
        const query = new URLSearchParams({
            desde: fechaDesde,
            hasta: fechaHasta
        }).toString();

        const response = await fetch(`${API_URL}/habitaciones/estado?${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        await manejarErrores(response);
        return await response.json();

    } catch (error) {
        console.error('Error en obtenerDisponibilidad:', error.message);
        throw new Error(error.message || 'No se pudo obtener la disponibilidad.');
    }
};

export const cargarConsumo = async (datos) => {
    const response = await fetch(`${API_URL}/consumos/cargar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar el consumo');
    }

    return await response.json();
};

// --- RESPONSABLES DE PAGO ---
export const crearResponsablePago = async (datos) => {
    const response = await fetch(`${API_URL}/responsables/crear-juridica`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el responsable de pago');
    }

    return await response.json();
};

export const buscarResponsablePorCuit = async (cuit) => {
    const response = await fetch(`${API_URL}/responsables/buscar-cuit?cuit=${cuit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error('Error al buscar el CUIT');
    }

    return await response.json();
};

// --- FACTURACIÓN ---
export const previsualizarFactura = async (habitacion, horaSalida) => {
    try {
        const query = new URLSearchParams({ habitacion, horaSalida }).toString();

        const response = await fetch(`${API_URL}/facturas/previsualizar?${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        await manejarErrores(response);
        return await response.json();

    } catch (error) {
        console.error('Error en previsualizarFactura:', error.message);
        throw new Error(error.message || 'No se pudo generar la previsualización de la factura.');
    }
};

export const crearFactura = async (solicitudDTO) => {
    try {
        const response = await fetch(`${API_URL}/facturas/crear`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(solicitudDTO)
        });

        await manejarErrores(response);
        return await response.json();

    } catch (error) {
        console.error('Error en crearFactura:', error.message);
        throw new Error(error.message || 'No se pudo crear la factura.');
    }
};

// --- PAGOS ---
export const buscarFacturasPendientes = async (numeroHabitacion) => {
    const res = await fetch(`${API_URL}/pagos/pendientes?habitacion=${numeroHabitacion}`);
    if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('Error al buscar facturas');
    }
    return await res.json();
};

export const registrarPago = async (pagoData) => {
    const res = await fetch(`${API_URL}/pagos/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al registrar pago');
    }
    return await res.json();
};

// --- NOTA DE CRÉDITO (CORREGIDO) ---
export const buscarFacturasPorCliente = async (documento) => {
    // CAMBIO: Usamos API_URL en lugar de API_BASE_URL
    const response = await fetch(`${API_URL}/facturas/buscar-por-cliente?documento=${documento}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || errorData.error || 'Error al buscar facturas');
    }
    return await response.json();
};

export const generarNotaCredito = async (listaIdsFacturas) => {
    // CAMBIO: Usamos API_URL en lugar de API_BASE_URL
    const response = await fetch(`${API_URL}/facturas/nota-credito`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idsFacturas: listaIdsFacturas }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar la nota de crédito');
    }
    return await response.json();
};

// --- UTILS: MANEJO DE ERRORES CENTRALIZADO ---
async function manejarErrores(response) {
    if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
            console.warn("La respuesta de error del backend no era JSON.");
        }
        throw new Error(errorMsg);
    }
}