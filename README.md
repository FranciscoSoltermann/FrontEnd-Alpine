Hotel Premier - Frontend
Este repositorio contiene la interfaz de usuario (Cliente Web) del sistema de gestión Hotel Premier. Desarrollado con Next.js (React), se comunica con una API REST en Java Spring Boot para realizar operaciones de gestión hotelera.

Tecnologías
Framework: Next.js 14+ (App Router)

Librería UI: React

Estilos: CSS Modules (Diseño responsivo y modular)

Estado Global: React Context API (para Autenticación)

Conexión API: Fetch API con patrón de Servicios

Prerrequisitos
Para ejecutar este proyecto necesitas:

Node.js (versión 18 o superior).

NPM (normalmente viene con Node.js).

Backend Corriendo: El servidor Spring Boot debe estar iniciado en http://localhost:8080 para que la aplicación funcione correctamente.

Instalación y Ejecución
Sigue estos pasos para levantar el frontend en tu máquina local:

Clonar el repositorio:

git clone https://github.com/tu-usuario/hotel-premier-front.git
cd hotel-premier-front

Instalar dependencias:

npm install

Configurar conexión (Opcional): Por defecto, la aplicación apunta a localhost:8080. Si necesitas cambiarlo, edita el archivo:
src/services/api.js

Iniciar servidor de desarrollo:
npm run dev

npm run dev
Abrir en el navegador: Visita http://localhost:3000.
