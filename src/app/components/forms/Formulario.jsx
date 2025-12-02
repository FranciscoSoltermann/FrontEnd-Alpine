'use client';
import { useState } from 'react';
import styles from './Formulario.module.css';
import { useRouter } from 'next/navigation';
import ActionModal from '@/app/components/ui/modals/ActionModal';
import ErrorModal from '@/app/components/ui/modals/ErrorModal';
import InfoModal from '@/app/components/ui/modals/InfoModal';
import SuccessModal from '@/app/components/ui/modals/SuccessModal';

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

// Función helper para determinar si un campo tiene error
const hasError = (errores, fieldName) => {
  return errores[fieldName] !== undefined;
};

// Función helper para obtener mensaje de error
const getErrorMessage = (errores, fieldName) => {
  return errores[fieldName];
};

export default function Formulario() {
  // 2. Hook principal
  const [formData, setFormData] = useState(initialState);
  const [errores, setErrores] = useState({});
  const [successModal, setSuccessModal] = useState(null);
  const router = useRouter();
  const [modalData, setModalData] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [infoModalData, setInfoModalData] = useState(null);

    const validarFormularioCompleto = (data) => {
        const newErrores = {};

        // 1. Validaciones Específicas de Longitud
        // TELÉFONO: Máximo 15 dígitos
        if (data.telefono) {
            if (!/^[0-9]+$/.test(data.telefono)) {
                newErrores.telefono = "Solo se permiten números.";
            } else if (data.telefono.length > 15) {
                newErrores.telefono = "Máximo 15 dígitos.";
            }
        }

        // DOCUMENTO: Entre 7 y 8 dígitos
        if (data.numeroDocumento) {
            if (!/^[0-9]+$/.test(data.numeroDocumento)) {
                newErrores.numeroDocumento = "Solo se permiten números.";
            } else if (data.numeroDocumento.length < 7 || data.numeroDocumento.length > 8) {
                newErrores.numeroDocumento = "Debe tener 7 u 8 dígitos.";
            }
        }

        // 2. OTROS NÚMEROS (Numero calle, CP, Piso)
        const otrosNumericos = ['numero', 'codigoPostal', 'piso'];
        otrosNumericos.forEach(field => {
            if (data[field] && !/^[0-9]+$/.test(data[field])) {
                newErrores[field] = "Solo se permiten números.";
            }
        });

        // 3. GRUPO TEXTO
        const camposTexto = ['nombre', 'apellidos', 'nacionalidad', 'ocupacion', 'pais', 'provincia', 'localidad'];
        camposTexto.forEach(field => {
            if (data[field] && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data[field])) {
                newErrores[field] = "Solo se permiten letras.";
            }
        });

        // 4. CUIT
        if (data.cuit) {
            if (!/^[0-9]+$/.test(data.cuit)) {
                newErrores.cuit = "El CUIT solo debe contener números.";
            } else if (data.cuit.length > 11) {
                newErrores.cuit = "El CUIT no puede tener más de 11 dígitos.";
            }
        }

        // 5. CALLE Y DEPARTAMENTO
        if (data.calle && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.]+$/.test(data.calle)) {
            newErrores.calle = "Caracteres no válidos para una calle.";
        }
        if (data.departamento && !/^[a-zA-Z0-9]+$/.test(data.departamento)) {
            newErrores.departamento = "Solo letras o números (sin símbolos).";
        }

        // 6. FECHA DE NACIMIENTO
        if (data.fechaNacimiento) {
            const minYear = 1900;
            // Dividimos la fecha para obtener año, mes y día como números
            const [year, month, day] = data.fechaNacimiento.split('-').map(Number);
            const fechaActual = new Date();

            // Validación año mínimo y futuro
            if (year < minYear) {
                newErrores.fechaNacimiento = "El año no puede ser anterior a 1900.";
            } else if (year > fechaActual.getFullYear()) {
                newErrores.fechaNacimiento = "El año no puede ser mayor al actual.";
            } else {
                // Validación MAYOR DE 18 AÑOS
                let edad = fechaActual.getFullYear() - year;

                // Ajuste: Si aún no cumplió años este año (comparando mes y día), restamos 1 a la edad
                if (fechaActual.getMonth() + 1 < month || (fechaActual.getMonth() + 1 === month && fechaActual.getDate() < day)) {
                    edad--;
                }

                if (edad < 18) {
                    newErrores.fechaNacimiento = "Debe ser mayor de 18 años.";
                }
            }
        }

        return newErrores;
    };

    // --- MANEJO DE CAMBIOS EN TIEMPO REAL ---
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        let errorMsg = "";

        // VALIDACIÓN TELÉFONO (Tiempo real)
        if (name === 'telefono' && value) {
            if (!/^[0-9]+$/.test(value)) {
                errorMsg = "Solo se permiten números.";
            } else if (value.length > 15) {
                errorMsg = "Máximo 15 dígitos.";
            }
        }

        // VALIDACIÓN DOCUMENTO (Tiempo real)
        else if (name === 'numeroDocumento' && value) {
            if (!/^[0-9]+$/.test(value)) {
                errorMsg = "Solo se permiten números.";
            } else if (value.length > 8) {
                // Avisamos si se pasa, pero no validamos que sea <7 aquí para no molestar mientras escribe
                errorMsg = "Máximo 8 dígitos.";
            }
        }
        else if (['numero'].includes(name) && value && !/^[0-9]+$/.test(value)) {
            errorMsg = "Solo se permiten números.";
        }
        // OTROS CAMPOS NUMÉRICOS
        else if (['codigoPostal', 'piso'].includes(name) && value && !/^[a-zA-Z0-9\s]+/.test(value)) {
            errorMsg = "Solo se permiten números.";
        }
        // CAMPOS DE TEXTO
        else if (['nombre', 'apellidos', 'nacionalidad', 'ocupacion', 'pais', 'provincia', 'localidad'].includes(name) && value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
            errorMsg = "Solo se permiten letras.";
        }
        // CUIT
        else if (name === 'cuit' && value) {
            if (!/^[0-9]+$/.test(value)) errorMsg = "Solo números.";
            else if (value.length > 11) errorMsg = "Máximo 11 dígitos.";
        }
        // CALLE
        else if (name === 'calle' && value && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.]+$/.test(value)) {
            errorMsg = "Caracteres no válidos.";
        }
        // DEPARTAMENTO
        else if (name === 'departamento' && value && !/^[a-zA-Z0-9]+$/.test(value)) {
            errorMsg = "Solo letras y números.";
        }
        // FECHA
        else if (name === 'fechaNacimiento' && value) {
            const [year, month, day] = value.split('-').map(Number);
            const fechaActual = new Date();

            if (year > fechaActual.getFullYear()) {
                errorMsg = "Año mayor al actual.";
            } else if (year < 1900 && value.length >= 4) {
                errorMsg = "Año inválido.";
            } else if (value.length === 10) { // Solo validamos edad completa si la fecha está completa (YYYY-MM-DD son 10 chars)
                let edad = fechaActual.getFullYear() - year;

                // Ajuste preciso de edad (mes y día)
                if (fechaActual.getMonth() + 1 < month || (fechaActual.getMonth() + 1 === month && fechaActual.getDate() < day)) {
                    edad--;
                }

                if (edad < 18) {
                    errorMsg = "Debe ser mayor de 18 años.";
                }
            }
        }

        setErrores(prev => {
            const newErrores = { ...prev };
            if (errorMsg) newErrores[name] = errorMsg;
            else delete newErrores[name];
            return newErrores;
        });
    };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setErrores({}); // Limpia errores anteriores

  const huesped = {
    nombre: formData.nombre,
    apellido: formData.apellidos,
    tipoDocumento: formData.tipoDocumento,
    documento: formData.numeroDocumento,
    fechaNacimiento: formData.fechaNacimiento,
    nacionalidad: formData.nacionalidad,
    cuit: formData.cuit.trim() === '' ? null : formData.cuit,
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
      codigoPostal: formData.codigoPostal
    }
  };

  try {
    const respuesta = await fetch('http://localhost:8080/api/huespedes/alta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(huesped),
    });

    // 🔹 Si la respuesta NO es OK (ej. 400, 409, etc.)
    if (!respuesta.ok) {
      const errorData = await respuesta.json();

      const erroresMapeados = {};
      const fieldMapping = {
        'apellido': 'apellidos',
        'documento': 'numeroDocumento',
        'direccion.pais': 'pais',
        'direccion.provincia': 'provincia',
        'direccion.localidad': 'localidad',
        'direccion.codigoPostal': 'codigoPostal',
        'direccion.calle': 'calle',
        'direccion.numero': 'numero',
        'direccion.departamento': 'departamento',
        'direccion.piso': 'piso'
      };

      Object.keys(errorData).forEach(key => {
        if (key === 'error' || key === 'cuitConsistente') {
          erroresMapeados[key] = errorData[key];
        } else {
          const fieldName = fieldMapping[key] || key;
          erroresMapeados[fieldName] = errorData[key];
        }
      });

      setErrores(erroresMapeados);

      setModalData({
        titulo: "Advertencia",
        descripcion: errorData.error || "Se encontraron errores en la carga de datos. Por favor, revise los campos marcados.",
        cancelText: "Cerrar",
        confirmText: "Aceptar",
        onCancel: () => setModalData(null),
        onConfirm: () => setModalData(null)
      });

      return;
    }

    // 🔹 Si la respuesta es OK (200–299)
    const data = await respuesta.json();
      console.log('Huésped guardado correctamente:', data);

      setSuccessModal({
        titulo: "Alta Exitosa",
        descripcion: `Huésped "${data.nombre} ${data.apellido}" dado de alta correctamente.`,
        onClose: () => {
          // Acción a tomar DESPUÉS de cerrar el modal de éxito
          setSuccessModal(null);
          setFormData(initialState);
          router.push('/dashboard');
        }
      });

  } catch (error) {
    // 🔹 Este catch solo maneja errores de red (CORS, servidor caído, etc.)
    console.error('Error de conexión:', error);
    setErrores({ global: 'No se pudo conectar con el servidor. Revisa tu CORS.' });

    setModalData({
      titulo: "Error",
      descripcion: `Error de conexión: ${error.message}. Verifique que el servidor esté funcionando.`,
      cancelText: "Cerrar",
      confirmText: "Reintentar",
      onCancel: () => setModalData(null),
      onConfirm: () => {
        setModalData(null);
        handleSubmit(e);
      }
    });
  }
};


  const handleCancel = () => {
    setInfoModalData({
      titulo: "Confirmar Cancelación",
      descripcion: "¿Estás seguro de que deseas cancelar? Se perderán todos los datos no guardados.",
      cancelText: "No, seguir editando",
      confirmText: "Sí, cancelar",
      onCancel: () => setInfoModalData(null),
      onConfirm: () => {
        setInfoModalData(null);
        setFormData(initialState);
        router.push('/buscar');
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
          {/* Campo Apellidos */}
          <div className={styles.fieldWrapper}>
            <Label htmlFor="apellidos" required>Apellidos</Label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'apellidos') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'apellidos') && (
              <div className={styles.error}>{getErrorMessage(errores, 'apellidos')}</div>
            )}
          </div>

          {/* Campo Nombre */}
          <div className={styles.fieldWrapper}>
            <Label htmlFor="nombre" required>Nombre</Label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'nombre') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'nombre') && (
              <div className={styles.error}>{getErrorMessage(errores, 'nombre')}</div>
            )}
          </div>

          {/* Campo Tipo Documento */}
          <div className={styles.fieldWrapper}>
            <Label htmlFor="tipoDocumento" required>Tipo de Documento</Label>
            <select
              name="tipoDocumento"
              value={formData.tipoDocumento}
              onChange={handleChange}
              className={`${styles.selectField} ${hasError(errores, 'tipoDocumento') ? styles.errorField : ''}`}
              required
            >
              <option value="DNI">DNI</option>
              <option value="PASAPORTE">PASAPORTE</option>
              <option value="LE">LE</option>
              <option value="LC">LC</option>
              <option value="OTRO">OTRO</option>
            </select>
            {hasError(errores, 'tipoDocumento') && (
              <div className={styles.error}>{getErrorMessage(errores, 'tipoDocumento')}</div>
            )}
          </div>

          {/* Campo Número Documento */}
          <div className={styles.fieldWrapper}>
            <Label htmlFor="numeroDocumento" required>Número de Documento</Label>
            <input
              type="text"
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'numeroDocumento') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'numeroDocumento') && (
              <div className={styles.error}>{getErrorMessage(errores, 'numeroDocumento')}</div>
            )}
          </div>

          {/* Resto de campos... (aplicar el mismo patrón a todos los campos) */}

          <div className={styles.fieldWrapper}>
            <Label htmlFor="fechaNacimiento" required>Fecha Nacimiento</Label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'fechaNacimiento') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'fechaNacimiento') && (
              <div className={styles.error}>{getErrorMessage(errores, 'fechaNacimiento')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="nacionalidad" required>Nacionalidad</Label>
            <input
              type="text"
              name="nacionalidad"
              value={formData.nacionalidad}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'nacionalidad') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'nacionalidad') && (
              <div className={styles.error}>{getErrorMessage(errores, 'nacionalidad')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="cuit">CUIT</Label>
            <input
              type="text"
              name="cuit"
              value={formData.cuit}
              onChange={handleChange}
            className={`${styles.inputField} ${
                hasError(errores, 'cuit') || hasError(errores, 'cuitConsistente') ? styles.errorField : ''
              }`}
            />
            {hasError(errores, 'cuit') && (
              <div className={styles.error}>{getErrorMessage(errores, 'cuit')}</div>
            )}
            {hasError(errores, 'cuitConsistente') && !hasError(errores, 'cuit') && (
              <div className={styles.error}>{getErrorMessage(errores, 'cuitConsistente')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="telefono" required>Teléfono</Label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'telefono') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'telefono') && (
              <div className={styles.error}>{getErrorMessage(errores, 'telefono')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="ocupacion" required>Ocupación</Label>
            <input
              type="text"
              name="ocupacion"
              value={formData.ocupacion}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'ocupacion') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'ocupacion') && (
              <div className={styles.error}>{getErrorMessage(errores, 'ocupacion')}</div>
            )}
          </div>

          <div className={`${styles.fieldWrapper} ${styles.colSpan2}`}>
            <Label htmlFor="email">Email</Label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'email') ? styles.errorField : ''}`}
            />
            {hasError(errores, 'email') && (
              <div className={styles.error}>{getErrorMessage(errores, 'email')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="posicionIVA" required>Posición Frente al IVA</Label>
            <select
              name="posicionIVA"
              value={formData.posicionIVA}
              onChange={handleChange}
              className={`${styles.selectField} ${hasError(errores, 'posicionIVA') ? styles.errorField : ''}`}
              required
            >
              <option value="Consumidor_Final">Consumidor Final</option>
              <option value="Responsable_Inscripto">Responsable Inscripto</option>
              <option value="Monotributista">Monotributista</option>
            </select>
            {hasError(errores, 'posicionIVA') && (
              <div className={styles.error}>{getErrorMessage(errores, 'posicionIVA')}</div>
            )}
          </div>
        </div>

        <h2 className={styles.subtitle}>Dirección</h2>

        <div className={styles.gridContainer}>
          {/* Aplicar el mismo patrón a todos los campos de dirección */}
          <div className={styles.fieldWrapper}>
            <Label htmlFor="pais" required>País</Label>
            <input
              type="text"
              name="pais"
              value={formData.pais}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'pais') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'pais') && (
              <div className={styles.error}>{getErrorMessage(errores, 'pais')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="provincia" required>Provincia</Label>
            <input
              type="text"
              name="provincia"
              value={formData.provincia}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'provincia') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'provincia') && (
              <div className={styles.error}>{getErrorMessage(errores, 'provincia')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="localidad" required>Localidad</Label>
            <input
              type="text"
              name="localidad"
              value={formData.localidad}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'localidad') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'localidad') && (
              <div className={styles.error}>{getErrorMessage(errores, 'localidad')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="codigoPostal" required>Código Postal</Label>
            <input
              type="text"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'codigoPostal') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'codigoPostal') && (
              <div className={styles.error}>{getErrorMessage(errores, 'codigoPostal')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="calle" required>Calle</Label>
            <input
              type="text"
              name="calle"
              value={formData.calle}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'calle') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'calle') && (
              <div className={styles.error}>{getErrorMessage(errores, 'calle')}</div>
            )}
          </div>

          <div className={styles.fieldWrapper}>
            <Label htmlFor="numero" required>Número</Label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              className={`${styles.inputField} ${hasError(errores, 'numero') ? styles.errorField : ''}`}
              required
            />
            {hasError(errores, 'numero') && (
              <div className={styles.error}>{getErrorMessage(errores, 'numero')}</div>
            )}
          </div>

          <div className={styles.departamentoPisoContainer}>
            <div className={styles.fieldWrapper}>
              <Label htmlFor="departamento">Departamento</Label>
              <input
                type="text"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className={`${styles.inputField} ${hasError(errores, 'departamento') ? styles.errorField : ''}`}
              />
              {hasError(errores, 'departamento') && (
                <div className={styles.error}>{getErrorMessage(errores, 'departamento')}</div>
              )}
            </div>

            <div className={styles.fieldWrapper}>
              <Label htmlFor="piso">Piso</Label>
              <input
                type="text"
                name="piso"
                value={formData.piso}
                onChange={handleChange}
                className={`${styles.inputField} ${hasError(errores, 'piso') ? styles.errorField : ''}`}
              />
              {hasError(errores, 'piso') && (
                <div className={styles.error}>{getErrorMessage(errores, 'piso')}</div>
              )}
            </div>
          </div>
        </div>

        {/* --- Contenedor para Errores Globales --- */}
        { (errores.error || errores.global) && (
          <div className={styles.globalErrorContainer}>

           {/* Error de lógica (ej. CuitExistente) */}
            {errores.error && (
              <p className={styles.errorGlobal}>{errores.error}</p>
            )}

           {/* Error de red (del catch) */}
          {errores.global && (
            <p className={styles.errorGlobal}>{errores.global}</p>
          )}

          </div>
        )}
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

      {/* Modales */}
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
          titulo="Error"
          descripcion={modalError}
          onClose={() => setModalError(null)}
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
      {successModal && (
        <SuccessModal
          titulo={successModal.titulo}
          descripcion={successModal.descripcion}
          onClose={successModal.onClose}
          buttonText="Aceptar"
        />
      )}
    </div>
  );
}