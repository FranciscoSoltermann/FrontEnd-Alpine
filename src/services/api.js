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

// --- HABITACIONES (NUEVO) ---
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