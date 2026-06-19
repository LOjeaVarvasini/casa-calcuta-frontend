# 👥 Casa Calcuta - Frontend Application

**Asignatura:** Gestión de Proyectos (UNNOBA, 2026)

**Framework Base:** React JS (v18+) mediante Vite

---

## 📝 Propósito del Repositorio

Este repositorio aloja el código fuente del frontend para el Sistema de Gestión Interna de Casa Calcuta. La aplicación está diseñada bajo el enfoque **Mobile-First**, priorizando la adaptabilidad estructural, la velocidad de carga y la ergonomía táctil para garantizar una operación fluida por parte de los coordinadores y encargados directamente en el territorio (merendero, depósito, cocina).

La arquitectura visual implementada mitiga las restricciones de conectividad inestable mediante el uso de fuentes del sistema y una estructura CSS modular basada en Custom Properties, facilitando la escalabilidad del sistema y su posterior integración con los servicios de backend.

---

## 🎨 Arquitectura de Diseño e Identidad

La interfaz de usuario se rige estrictamente por la Guía de Estilos Visuales oficial del proyecto, destacando:

- **Enfoque Líquido Anti-Scroll:** Las planillas operativas y tablas extensas se reestructuran automáticamente en formato de tarjetas verticales en dispositivos móviles, eliminando por completo el desplazamiento horizontal.

- **Consistencia de Acciones:** Control simétrico de flujos mediante contenedores de acciones fijos (`.table-actions-cell`), asegurando que la botonería mantenga su eje visual independientemente del volumen de datos.

- **Paleta Semántica de Alta Visibilidad:** Gestión de estados y alertas críticas mediante tokens de color de alto contraste (`--color-primary`, `--color-danger`, `--color-success`).

---

## 📂 Estructura del Proyecto

El código se organiza de forma modular para segmentar los componentes comunes de las vistas de negocio:

- **`src/components/common/`**: Componentes globales del sistema (Sidebar, BottomNav, Nav-Dropdown).

- **`src/components/ui/`**: Micro-componentes con comportamiento e identidad unificada (Buttons, Badges, Switch Pastilla).

- **`src/pages/`**: Vistas operativas funcionales (Padrón, Integrantes, Asistencia, Donaciones, Reportes, Usuarios).

- **`src/styles/`**: Centralización de tokens de diseño (`variables.css`) y estilos globales (`index.css`).

---

## 🛠️ Instalación y Ejecución en Local

Para clonar, instalar las dependencias y levantar el entorno de desarrollo local, siga estos pasos:

1.  **Clonar el repositorio:** Use el comando correspondiente de clonación de Git con la URL de este repositorio público y acceda al directorio generado.

2.  **Instalar dependencias nativas:** Ejecute la instalación estándar de paquetes de Node para descargar React, Vite y las herramientas asociadas.

3.  **Configurar variables de entorno:** Copie el archivo de ejemplo de variables de entorno, renómbrelo exactamente como un archivo de entorno local y asegúrese de configurar la ruta correspondiente a la API del backend en la variable de entorno de la API de Vite.

4.  **Iniciar el servidor de desarrollo (Vite):** Levante el compilador en tiempo real. La aplicación estará disponible para su visualización en el puerto local indicado por la consola de su entorno de desarrollo local (generalmente el puerto local 5173).

---

## 🔐 Autenticación

- El login del frontend consume `POST /api/auth/login`.
- Luego valida la sesión con `GET /api/auth/me`.
- La URL base debe salir de `VITE_API_URL` y apuntar al backend que corresponda al entorno.
- El token se guarda en `localStorage` como `access_token`.
- El cierre de sesión consume `POST /api/auth/logout`.

## ⚙️ Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto con una URL de backend local, por ejemplo:

```env
VITE_API_URL=http://localhost:8000
```

En producción, el workflow usa el secret `VITE_API_URL` con la URL real del backend, por ejemplo `https://casacalcuta.backend.paidos.net.ar`.

## 🖥️ Estado actual del frontend

- Pantalla de login funcional.
- Sesión persistente al recargar usando `access_token`.
- Feedback visual de carga, error y login exitoso.
- Base visual mobile-first tomada de los archivos `login.html`, `login.css` y `base.css`.

## 🚀 Deploy a producción

La rama `production` dispara un deploy automático con GitHub Actions.

### Sitio en CloudPanel

- Tipo de sitio: `Static HTML`
- Dominio: `casacalcuta.paidos.net.ar`
- El directorio remoto debe ser el root público del sitio en CloudPanel.

### Secrets requeridos en GitHub

- `SSH_HOST`: IP o dominio del server Ubuntu.
- `SSH_PORT`: puerto SSH, normalmente `22`.
- `SSH_USER`: usuario SSH habilitado en el server.
- `SSH_PRIVATE_KEY`: clave privada SSH autorizada en el server.
- `DEPLOY_PATH`: ruta pública del sitio en CloudPanel.
- `VITE_API_URL`: URL del backend de producción.

### Opcionales para Cloudflare

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`

### Flujo

1. Hacer push a la rama `production`.
2. GitHub Actions compila el frontend con `npm run build`.
3. Se sube `dist/` al server por SSH.
4. Si hay secretos de Cloudflare, se purga el cache.

### Paso que falta del lado tuyo

- Generar o elegir una clave SSH para deploy.
- Autorizar su clave pública en el server.
- Cargar los secrets en GitHub.
- Confirmar la ruta exacta de `DEPLOY_PATH` en CloudPanel.
- Verificar que `VITE_API_URL` apunte al backend real de producción.

### Nota para SPA

- Si después agregamos rutas de React Router, CloudPanel/Nginx debe reescribir las rutas a `index.html`.

---

## 🚀 Prácticas de Desarrollo Obligatorias

- **No Hardcodear URLs:** Cualquier llamada al backend debe consumir de forma dinámica la variable de entorno expuesta por Vite a través de `import.meta.env`.

- **Respetar los Tokens:** Está prohibido el uso de valores hexadecimales sueltos en los componentes; se debe invocar siempre a las variables del sistema (`var(--color-primary)`, `var(--space-md)`).

- **Mobile-First Integrado:** Cualquier componente nuevo debe probarse obligatoriamente en modo responsive, garantizando que conserve los estándares ergonómicos táctiles mínimos, incluyendo una altura de interacción segura para el dedo pulgar.
