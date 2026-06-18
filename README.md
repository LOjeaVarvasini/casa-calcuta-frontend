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

## 🚀 Prácticas de Desarrollo Obligatorias

- **No Hardcodear URLs:** Cualquier llamada al backend debe consumir de forma dinámica la variable de entorno expuesta por Vite a través del objeto `meta`.

- **Respetar los Tokens:** Está prohibido el uso de valores hexadecimales sueltos en los componentes; se debe invocar siempre a las variables del sistema (`var(--color-primary)`, `var(--space-md)`).

- **Mobile-First Integrado:** Cualquier componente nuevo debe probarse obligatoriamente en modo responsive, garantizando que conserve los estándares ergonómicos táctiles mínimos, incluyendo una altura de interacción segura para el dedo pulgar.