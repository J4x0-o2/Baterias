# BatteryForm — Inspección de Baterías

Aplicación web progresiva (PWA) para el registro e inspección técnica de baterías industriales. Funciona completamente **sin conexión** y sincroniza los datos automáticamente con una hoja de cálculo de Google Sheets cuando hay red disponible.

---

## ¿Qué es?

Es una herramienta de campo diseñada para técnicos e inspectores que necesitan registrar el estado de baterías en entornos donde la conectividad no está garantizada. Los registros se almacenan localmente en el dispositivo y se envían a Google Sheets en cuanto se recupera la conexión.

---

## ¿Qué hace?

- **Formulario de inspección en lote**: permite registrar entre 1 y N baterías en un solo envío. Todos comparten campos fijos (referencia, fechas, inspector) y cada batería tiene sus propios campos de inspección visual y mediciones.
  - Referencia de batería (seleccionable o personalizada)
  - Fecha de inspección, fabricación y recarga
  - Inspección visual: aspecto de bornes, calcomanías, tapones, aspecto general y fugas
  - Mediciones: carga (V) y peso (kg) con validación por rangos según la referencia
  - Fórmula y días de uso (calculado automáticamente)
  - Observaciones e identificación del inspector

- **Gestión de referencias**: permite crear referencias personalizadas con rangos de carga y peso esperados. Si una medición está fuera de rango, el campo se resalta visualmente.

- **Historial diario**: visualización de los registros del día.

- **Sincronización automática con idempotencia**: cada 5 minutos intenta enviar los registros pendientes al Google Apps Script. Cada envío incluye un `batchId` único que el servidor verifica antes de insertar — si el mismo lote llega dos veces (por ejemplo, tras un timeout de red), el servidor lo ignora sin crear duplicados.

- **Sincronización al reconectar**: el Service Worker y el módulo de sync disparan sincronización inmediata al recuperar la conexión (`online` event + Background Sync API).

- **Estrategias de caché diferenciadas**:
  - Assets estáticos (HTML, JS, CSS, imágenes): `Cache First`
  - Peticiones a la API de Google Apps Script: `Network First` (los POST nunca se cachean)

---

## Arquitectura

```
[Operador]
    │ llena formulario
    ▼
[React App] ──────────────────────────────────────────────────────┐
    │ save(record { id, batchId, synced=false })                    │
    ▼                                                               │
[IndexedDB]  ◄─── markAsSynced() ───  [SyncManager]               │
    │                                  │ auto-sync 5 min            │
    └──── getPendingSync() ────────────┘ + evento online            │
                                        │                           │
                               HTTPS POST (JSON + batchId)         │
                                  timeout: 90s                      │
                         ┌─────────────┴──────────────┐            │
                         │                             │ (monitor)  │
                         ▼                             ▼            │
              [Apps Script Principal]     [Apps Script Hoja Copia] ─┘
                         │                             │
              [PropertiesService]         [PropertiesService]
              (batchId idempotencia)      (batchId idempotencia)
                         │                             │
              [Google Sheets DATOS]       [Google Sheets DATOS Copia]
                                                       │
                                               [Telegram Bot]
```

El almacenamiento local usa **IndexedDB** con dos stores: `records` (inspecciones pendientes/sincronizadas) y `customReferences` (referencias personalizadas).

---

## Tecnologías

| Capa                 | Tecnología                                          |
|----------------------|-----------------------------------------------------|
| UI                   | React 19 + TypeScript                               |
| Build                | Vite 7 + SWC                                        |
| PWA / Service Worker | Service Worker manual (`public/sw.js`, sin Workbox) |
| Almacenamiento local | IndexedDB (raw, sin wrapper)                        |
| Backend de datos     | Google Apps Script (doPost) + Google Sheets         |
| Notificaciones       | Telegram Bot (vía Apps Script)                      |
| Deploy               | GitHub Pages (`gh-pages`)                           |

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd pwa-baterias
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL principal — Google Apps Script que inserta en la hoja de datos
VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/XXXXXXXX/exec

# URL del monitor (opcional) — hoja copia que recibe los mismos datos y notifica por Telegram
VITE_GOOGLE_SHEETS_MONITOR_URL=https://script.google.com/macros/s/YYYYYYYY/exec
```

> Ambas Web Apps deben publicarse con acceso **"Cualquier persona"** y modo de ejecución como el usuario del despliegue.

### 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

### 5. Compilar para producción

```bash
npm run build
```

### 6. Publicar en GitHub Pages

```bash
npm run deploy
```

---

## Instalación como PWA

Desde el navegador (Chrome, Edge, Safari en iOS):

1. Abre la URL de la aplicación.
2. Aparecerá un banner o botón **"Instalar"** / **"Añadir a pantalla de inicio"**.
3. Una vez instalada, la app se abre en modo standalone (sin barra del navegador) y funciona sin conexión.

---

## Variables de entorno

| Variable                          | Requerida | Descripción                                                   |
|-----------------------------------|-----------|---------------------------------------------------------------|
| `VITE_GOOGLE_SHEETS_URL`          | Sí        | URL del Web App principal de Google Apps Script               |
| `VITE_GOOGLE_SHEETS_MONITOR_URL`  | No        | URL del Web App de la hoja copia (monitor + Telegram). Si no se configura, el envío al monitor se omite silenciosamente. |

---

## Scripts disponibles

| Comando           | Descripción                            |
|-------------------|----------------------------------------|
| `npm run dev`     | Servidor de desarrollo con hot-reload  |
| `npm run build`   | Compilación optimizada para producción |
| `npm run preview` | Vista previa del build local           |
| `npm run lint`    | Análisis estático con ESLint           |
| `npm run deploy`  | Build + publicación en GitHub Pages    |

---

## Notas para producción

- Los `console.*` y sentencias `debugger` se eliminan automáticamente en el build de producción (`vite.config.ts` → `esbuild.drop`).
- El Service Worker usa `skipWaiting()` al instalar, por lo que las actualizaciones se activan sin necesidad de cerrar todas las pestañas.
- La sincronización tiene un guard `isRunning` que previene ejecuciones concurrentes dentro del mismo contexto de página.
- El `batchId` de idempotencia se almacena en `PropertiesService` de Apps Script (los últimos 200 IDs, ~5 KB por hoja).
