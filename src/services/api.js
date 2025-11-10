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
