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
                // 'Authorization': `Bearer ${token}`
            }
        });

        await manejarErrores(response); // Reutilizamos lógica de error
        return await response.json();

    } catch (error) {
        console.error('Error en buscarHuespedes:', error.message);
        throw new Error(error.message || 'No se pudo conectar con el servidor.');
    }
};

export const eliminarHuesped = async (id) => {
    // const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_URL}/huespedes/eliminar/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        // Manejamos el error del backend (ej: tiene reservas asociadas)
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar el huésped.');
    }

    return await response.json();
};

// --- HABITACIONES ---
export const obtenerDisponibilidad = async (fechaDesde, fechaHasta) => {
    try {
        // Usamos URLSearchParams para asegurar que los caracteres especiales se codifiquen bien
        const query = new URLSearchParams({
            desde: fechaDesde,
            hasta: fechaHasta
        }).toString();

        // La URL final será algo como: http://localhost:8080/api/habitaciones/estado?desde=2023-11-01&hasta=2023-11-05
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
    // const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_URL}/consumos/cargar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
    });

    if (!response.ok) {
        const errorData = await response.json();
        // El backend devuelve { "error": "mensaje" } en caso de fallo
        throw new Error(errorData.error || 'Error al cargar el consumo');
    }

    return await response.json();
};

// --- RESPONSABLES DE PAGO (Nuevo) ---
export const crearResponsablePago = async (datos) => {
    // const token = localStorage.getItem('authToken'); // Descomentar si usas seguridad

    const response = await fetch(`${API_URL}/responsables/crear-juridica`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`
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
    // const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/responsables/buscar-cuit?cuit=${cuit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 404) {
        return null; // No existe
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

// --- UTILS: MANEJO DE ERRORES CENTRALIZADO ---
// Extraje tu lógica de error a una función auxiliar para no repetirla
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