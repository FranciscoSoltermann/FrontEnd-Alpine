'use client';
import { useState } from 'react';
import styles from './Formulario.module.css';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const huesped = {
      nombre: formData.nombre,
      apellido: formData.apellidos,
      tipoDocumento: formData.tipoDocumento,
      documento: formData.numeroDocumento,
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

      if (!respuesta.ok) {
        const errorTexto = await respuesta.text();
        throw new Error(`Error del servidor: ${errorTexto}`);
      }

      const data = await respuesta.json();
      console.log('Huésped guardado correctamente:', data);
      alert(`Huésped "${data.nombre} ${data.apellido}" dado de alta correctamente.`);

      setFormData(initialState);
    } catch (error) {
      console.error('Error al guardar huésped:', error);
      alert(`Hubo un error al guardar el huésped. Revisa la consola: ${error.message}`);
    }
  };
  const handleCancel = () => {
    // 1. MENSAJE DE PRUEBA
    console.log("¡HICISTE CLIC EN CANCELAR!"); 
    
    // 2. Resetea el formulario
    setFormData(initialState); 
    
    // 3. Te lleva al dashboard
    router.push('/dashboard'); 
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
          </div>
        </div>
        </div>

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
    </div>
  );
}
