# BatteryForm — Inspección de Baterías

Aplicación web progresiva (PWA) para el registro e inspección técnica de baterías industriales. Funciona completamente **sin conexión** y sincroniza los datos automáticamente con una hoja de cálculo de Google Sheets cuando hay red disponible.

---

## ¿Qué es?

Es una herramienta de campo diseñada para técnicos e inspectores que necesitan registrar el estado de baterías en entornos donde la conectividad no está garantizada. Los registros se almacenan localmente en el dispositivo y se envían a Google Sheets en cuanto se recupera la conexión.

---

## ¿Qué hace?

- **Formulario de inspección** con los siguientes campos:
  - Referencia de batería (seleccionable o personalizada)
  - Fecha de inspección, fabricación y recarga
  - Inspección visual: aspecto de bornes, calcomanías, tapones, aspecto general y fugas
  - Mediciones: carga (V) y peso (kg) con validación por rangos según la referencia
  - Fórmula y días de uso (calculado automáticamente)
  - Observaciones e identificación del inspector

- **Gestión de referencias**: permite crear referencias personalizadas con rangos de carga y peso esperados. Si una medición está fuera de rango, el campo se resalta visualmente.

- **Historial diario**: visualización de los registros del día.

- **Sincronización automática**: cada minuto intenta enviar los registros pendientes al Google Apps Script. Si falla, los reintenta hasta 3 veces. El Service Worker también dispara la sincronización al recuperar la conexión (`Background Sync API`).

- **Estrategias de caché diferenciadas**:
  - Assets estáticos (HTML, JS, CSS, imágenes): `Cache First`
  - Peticiones a la API de Google Apps Script: `Network First`

---

## Arquitectura

```
Formulario → IndexedDB (local)
                  ↓ (cuando hay red)
          Google Apps Script (URL-API)
                  ↓
           Google Sheets (hoja de datos)
```

El almacenamiento local usa **IndexedDB** para guardar tanto los registros pendientes de sincronización como las referencias de baterías personalizadas. La sincronización se gestiona desde el cliente React y está reforzada por el Service Worker.

---

## Tecnologías

| Capa                 | Tecnología                               |
|----------------------|------------------------------------------|
| UI                   | React 19 + TypeScript                    |
| Build                | Vite + SWC                               |
| PWA                  | `vite-plugin-pwa`, Service Worker manual |
| Almacenamiento local | IndexedDB                                |
| Backend de datos     | Google Apps Script + Google Sheets       |
| Deploy               | GitHub Pages (`gh-pages`)                |

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd PWA_BATERIAS
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la URL del Google Apps Script

Crea un archivo `.env` en la raíz del proyecto con la URL de tu Web App de AppScript:

```env
VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/XXXXXXXX/exec
```

> La Web App de AppScript debe estar publicada con acceso **"Cualquier persona"** y aceptar peticiones `POST` con los datos del formulario en formato JSON.

### 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

### 5. Compilar para producción

```bash
npm run build
```

### 6. Publicar

```bash
npm run deploy
```

## Instalación como PWA

Desde el navegador (Chrome, Edge, Safari en iOS):

1. Abre la URL de la aplicación.
2. Aparecerá un banner o botón **"Instalar"** / **"Añadir a pantalla de inicio"**.
3. Una vez instalada, la app se abre en modo standalone (sin barra del navegador) y funciona sin conexión.

---

## Variables de entorno

| Variable                 | Descripción                           |
|--------------------------|---------------------------------------|
| `VITE_GOOGLE_SHEETS_URL` | URL del Web App de Google Apps Script |

---

## Scripts disponibles

| Comando           | Descripción                            |
|-------------------|----------------------------------------|
| `npm run dev`     | Servidor de desarrollo con hot-reload  |
| `npm run build`   | Compilación optimizada para producción |
| `npm run preview` | Vista previa del build local           |
| `npm run lint`    | Análisis estático con ESLint           |
| `npm run deploy`  | Build + publicación en GitHub Pages    |
