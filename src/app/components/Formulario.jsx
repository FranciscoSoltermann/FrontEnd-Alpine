'use client';
import { useState } from 'react';
import styles from './Formulario.module.css';
import { useRouter } from 'next/navigation';
import ActionModal from './ActionModal';
import ErrorModal from './ErrorModal';
import InfoModal from './InfoModal';


// 1. Estado inicial VÁLIDO (fuera del componente)
const initialState = {
  apellidos: '',
  nombre: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  fechaNacimiento: '',
  nacionalidad: '',
  cuit: '',
  telefono: '',
  ocupacion: '',
  email: '',
  posicionIVA: 'Consumidor_Final',
  pais: '',
  provincia: '',
  localidad: '', 
  codigoPostal: '',
  calle: '',
  numero: '',
  departamento: '',
  piso: '',
};

export default function Formulario() {
  // 2. Hook principal
  const [formData, setFormData] = useState(initialState);
  const [errores, setErrores] = useState({});
  const router = useRouter();
  const [modalData, setModalData] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [infoModalData, setInfoModalData] = useState(null);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores({}); // Limpiamos errores anteriores en cada intento

    // (Tu mapeo de objeto estaba perfecto)
    const huesped = {
      nombre: formData.nombre,
      apellido: formData.apellidos, // El DTO espera 'apellido'
      tipoDocumento: formData.tipoDocumento,
      documento: formData.numeroDocumento, // El DTO espera 'documento'
      fechaNacimiento: formData.fechaNacimiento,
      nacionalidad: formData.nacionalidad,
      cuit: formData.cuit,
      telefono: formData.telefono,
      ocupacion: formData.ocupacion,
      email: formData.email,
      posicionIVA: formData.posicionIVA,
      direccion: {
        pais: formData.pais,
        provincia: formData.provincia,
        localidad: formData.localidad,
        calle: formData.calle,
        numero: formData.numero,
        departamento: formData.departamento,
        piso: formData.piso,
        codigoPostal: formData.codigoPostal,
      },
    };

    try {
      const respuesta = await fetch('http://localhost:8080/api/huespedes/alta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(huesped),
      });

      // --- ¡ESTA ES LA LÓGICA CLAVE! ---
      if (!respuesta.ok) {
        // Si hay un error (400, 409, 500...), leemos el JSON de error
        const erroresDelBackend = await respuesta.json();
        setErrores(erroresDelBackend); // Guardamos los errores en el estado
        console.error('Errores de validación:', erroresDelBackend);
        setModalData({
          titulo: "Cartel de Advertencia", // Título como en tu imagen
          // Texto descriptivo: si el back-end mandó un error global (como "CUIT ya existe") lo usamos.
          // Si no, ponemos un mensaje genérico.
          descripcion: erroresDelBackend.error || "Se encontraron errores en la carga de datos. Por favor, revise los campos marcados.",
          cancelText: "Cerrar", // "Acción 1" (Botón Rojo)
          confirmText: "Aceptar", // "Acción 2" (Botón Verde)
          // Ambas acciones solo cerrarán el modal para que el usuario pueda corregir los campos.
          onCancel: () => setModalData(null),
          onConfirm: () => setModalData(null)
        });
        return; // Detenemos la ejecución
      }
      // --- Fin de la lógica de error ---

      // Si todo salió bien:
      const data = await respuesta.json();
      console.log('Huésped guardado correctamente:', data);
      alert(`Huésped "${data.nombre} ${data.apellido}" dado de alta correctamente.`);

      setFormData(initialState);
      router.push('/dashboard'); // Opcional: te lleva al dashboard

    } catch (error) {
      // Esto solo captura errores de RED (ej. servidor caído)
      console.error('Error de red:', error);
      setModalError(`Error de conexión: ${error.message}. Revisa si el servidor está funcionando.`);
      // Mostramos un error "global"
      setModalData({
        titulo: "Cartel de Error",
        descripcion: `Error de conexión: ${error.message}. Verifique que el servidor esté funcionando.`,
        cancelText: "Cerrar",
        confirmText: "Reintentar",
        onCancel: () => setModalData(null),
        onConfirm: () => {
          setModalData(null);
          handleSubmit(e); // Opcional: el botón verde reintenta el envío
        }
      });
    }
  };

  const handleCancel = () => {
    setInfoModalData({
      titulo: "Confirmar Cancelación",
      descripcion: "¿Estás seguro de que deseas cancelar? Se perderán todos los datos no guardados.",
      cancelText: "No, seguir editando", // Acción 1 (Rojo)
      confirmText: "Sí, cancelar", // Acción 2 (Verde)
      onCancel: () => setInfoModalData(null), // Cierra el modal
      onConfirm: () => {
        // Ejecuta la acción de cancelación real
        setInfoModalData(null);
        setFormData(initialState); 
        router.push('/dashboard'); 
      }
    });
  };
  const Label = ({ htmlFor, children, required = false }) => (
    <label htmlFor={htmlFor}>
      {children} {required && <span className={styles.asterisk}>(*)</span>}
    </label>
  );

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>DAR DE ALTA HUÉSPED</h1>

      <form onSubmit={handleSubmit}>
        <h2 className={styles.subtitle}>Datos Personales</h2>

        <div className={styles.gridContainer}>
          <div className={styles.fieldWrapper}>
            <Label htmlFor="apellidos" required>Apellidos</Label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {/* Si hay un error para 'apellido', se muestra aquí */}
            {errores.apellido && <p className={styles.error}>{errores.apellido}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="nombre" required>Nombre</Label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores.nombre && <p className={styles.error}>{errores.nombre}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="tipoDocumento" required>Tipo de Documento</Label>
            <select
              name="tipoDocumento"
              value={formData.tipoDocumento}
              onChange={handleChange}
              className={styles.selectField}
              required
            >
              <option value="DNI">DNI</option>
              <option value="PASAPORTE">PASAPORTE</option>
              <option value="LE">LE</option>
              <option value="LC">LC</option>
              <option value="OTRO">OTRO</option>
            </select>
            {errores.tipoDocumento && <p className={styles.error}>{errores.tipoDocumento}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="numeroDocumento" required>Número de Documento</Label>
            <input
              type="text"
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {/* El DTO lo recibe como 'documento', así que el error vendrá con esa clave */}
            {errores.documento && <p className={styles.error}>{errores.documento}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="fechaNacimiento" required>Fecha Nacimiento</Label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores.fechaNacimiento && <p className={styles.error}>{errores.fechaNacimiento}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="nacionalidad" required>Nacionalidad</Label>
            <input
              type="text"
              name="nacionalidad"
              value={formData.nacionalidad}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores.nacionalidad && <p className={styles.error}>{errores.nacionalidad}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="cuit">CUIT</Label>
            <input
              type="text"
              name="cuit"
              value={formData.cuit}
              onChange={handleChange}
              className={styles.inputField}
            />
            {errores.cuit && <p className={styles.error}>{errores.cuit}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="telefono" required>Teléfono</Label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores.telefono && <p className={styles.error}>{errores.telefono}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="ocupacion" required>Ocupación</Label>
            <input
              type="text"
              name="ocupacion"
              value={formData.ocupacion}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores.ocupacion && <p className={styles.error}>{errores.ocupacion}</p>}
          </div>

          <div className={`${styles.fieldWrapper} ${styles.colSpan2}`}>
            <Label htmlFor="email">Email</Label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.inputField}
            />
            {errores.email && <p className={styles.error}>{errores.email}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="posicionIVA" required>Posición Frente al IVA</Label>
            <select
              name="posicionIVA"
              value={formData.posicionIVA}
              onChange={handleChange}
              className={styles.selectField}
              required
            >
              <option value="Consumidor_Final">Consumidor Final</option>
              <option value="Responsable_Inscripto">Responsable Inscripto</option>
              <option value="Monotributista">Monotributista</option>
            </select>
            {errores.posicionIVA && <p className={styles.error}>{errores.posicionIVA}</p>}
          </div>
        </div>

        <h2 className={styles.subtitle}>Dirección</h2>

        <div className={styles.gridContainer}>
          <div className={styles.fieldWrapper}>
            <Label htmlFor="pais" required>País</Label>
            <input
              type="text"
              name="pais"
              value={formData.pais}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {/* Los errores de campos anidados (DireccionDTO) vienen con "objeto.campo" */}
            {errores['direccion.pais'] && <p className={styles.error}>{errores['direccion.pais']}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="provincia" required>Provincia</Label>
            <input
              type="text"
              name="provincia"
              value={formData.provincia}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores['direccion.provincia'] && <p className={styles.error}>{errores['direccion.provincia']}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="localidad" required>Localidad</Label>
            <input
              type="text"
              name="localidad"
              value={formData.localidad}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores['direccion.localidad'] && <p className={styles.error}>{errores['direccion.localidad']}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="codigoPostal" required>Código Postal</Label>
            <input
              type="text"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores['direccion.codigoPostal'] && <p className={styles.error}>{errores['direccion.codigoPostal']}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="calle" required>Calle</Label>
            <input
              type="text"
              name="calle"
              value={formData.calle}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores['direccion.calle'] && <p className={styles.error}>{errores['direccion.calle']}</p>}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="numero" required>Número</Label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              className={styles.inputField}
              required
            />
            {errores['direccion.numero'] && <p className={styles.error}>{errores['direccion.numero']}</p>}
          </div>

          <div className={styles.departamentoPisoContainer}>
            <div className={styles.fieldWrapper}>
              <Label htmlFor="departamento">Departamento</Label>
              <input
                type="text"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className={styles.inputField}
              />
              {errores['direccion.departamento'] && <p className={styles.error}>{errores['direccion.departamento']}</p>}
            </div>

            <div className={styles.fieldWrapper}>
              <Label htmlFor="piso">Piso</Label>
              <input
                type="text"
                name="piso"
                value={formData.piso}
                onChange={handleChange}
                className={styles.inputField}
              />
              {errores['direccion.piso'] && <p className={styles.error}>{errores['direccion.piso']}</p>}
            </div>
          </div>
        </div>

        {/* --- Contenedor para Errores Globales --- */}
        <div className={styles.globalErrorContainer}>
          {/* Error de la validación @AssertTrue (isCuitConsistente) */}
          {errores.huespedDTO && (
            <p className={styles.errorGlobal}>{errores.huespedDTO}</p>
          )}
          
          {/* Error de lógica (ej. CuitExistente) */}
          {errores.error && (
            <p className={styles.errorGlobal}>{errores.error}</p>
          )}

          {/* Error de red (del catch) */}
          {errores.global && (
            <p className={styles.errorGlobal}>{errores.global}</p>
          )}
        </div>
        {/* --- Fin de Errores Globales --- */}


        <div className={styles.buttonContainer}>
          <button type="button" className={`${styles.button} ${styles.cancelButton}`}
            onClick={handleCancel}
            >
            CANCELAR
          </button>
          <button type="submit" className={`${styles.button} ${styles.submitButton}`}>
            SIGUIENTE
          </button>
        </div>
      </form>
        {modalData && (
        <ActionModal
          titulo={modalData.titulo}
          descripcion={modalData.descripcion}
          onConfirm={modalData.onConfirm}
          onCancel={modalData.onCancel}
          confirmText={modalData.confirmText}
          cancelText={modalData.cancelText}
        />
      )}
      {modalError && (
        <ErrorModal
          titulo="Cartel de Error"
          descripcion={modalError}
          onClose={() => setModalError(null)} // La función para cerrarlo
        />
      )}
      {infoModalData && (
        <InfoModal
          titulo={infoModalData.titulo}
          descripcion={infoModalData.descripcion}
          onConfirm={infoModalData.onConfirm}
          onCancel={infoModalData.onCancel}
          confirmText={infoModalData.confirmText}
          cancelText={infoModalData.cancelText}
        />
      )}
    </div>
  );
}
