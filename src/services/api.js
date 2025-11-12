const API_URL = 'http://localhost:8080/api';
export async function iniciarSesion(nombre, contrasenia) {
  const respuesta = await fetch('http://localhost:8080/api/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, contrasenia })
  });

  if (!respuesta.ok) {
    throw new Error('Error al iniciar sesion');
  }
  
  return await respuesta.json();
}
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

    // --- MANEJO DE ERRORES MEJORADO ---
    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      
      try {
        // 1. Intentamos leer la respuesta como JSON
        const errorData = await response.json();
        // Si tu backend envía {"error": "mensaje"}, lo usamos
        errorMsg = errorData.error || JSON.stringify(errorData);
      } catch (jsonError) {
        // 2. Si falla (porque era HTML), no hacemos nada.
        // 'errorMsg' ya tiene el "Error 500: Internal Server Error"
        console.warn("La respuesta de error del backend no era JSON. Probablemente fue una página de error HTML.");
      }
      
      // 3. Lanzamos el error con el mensaje que conseguimos
      throw new Error(errorMsg);
    }
    // --- FIN DEL MANEJO DE ERRORES ---

    // Si todo salió OK, devolvemos el JSON
    return await response.json();

  } catch (error) {
    // Este catch ahora recibe el error de red O el error que lanzamos arriba
    console.error('Error en buscarHuespedes:', error.message);
    throw new Error(error.message || 'No se pudo conectar con el servidor.');
  }
};