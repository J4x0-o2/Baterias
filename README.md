# Inspección de Baterías — IDS

Aplicación web progresiva (PWA) para el registro e inspección técnica de baterías industriales. Funciona completamente **sin conexión** y sincroniza los datos automáticamente con Google Sheets cuando hay red disponible.

---

## ¿Qué es?

Herramienta de campo diseñada para técnicos e inspectores que registran el estado de baterías en entornos con conectividad intermitente. Los registros se almacenan localmente en el dispositivo y se envían a Google Sheets en cuanto se recupera la conexión.

---

## ¿Qué hace?

### Tipos de inspección

El formulario distingue dos modos de operación seleccionables al inicio:

- **Baterías - Producción** (por defecto): inspección del ciclo normal de producción. Los datos se insertan en la hoja `DATOS`.
- **Baterías - No Producción**: inspección de baterías de ensamblaje para verificar su estado óptimo. Permite hasta 50 baterías por lote. Los datos se insertan en la hoja `DATOS 250`.

Ambos modos usan el mismo formato de columnas y el mismo endpoint de Apps Script; el servidor enruta a la hoja correcta según el campo `tipoInspeccion` del payload.

### Formulario de inspección en lote

Registra entre 1 y N baterías en un solo envío. Todos comparten campos fijos y cada batería tiene sus propios campos individuales:

- Tipo de inspección (Producción / No Producción)
- Referencia de batería (lista predefinida o personalizada)
- Fecha de inspección, fabricación y recarga
- Inspección visual: aspecto de bornes, calcomanías, tapones, aspecto general y fugas
- Mediciones: carga (V) y peso (kg) con validación visual por rangos según la referencia
- Fórmula y días de uso (calculados automáticamente a partir de las fechas)
- Observaciones e identificación del inspector
- Confirmación antes de reducir cantidad si hay datos sin guardar

**Capacidad por tipo:**
| Tipo | Máximo de baterías por lote |
|---|---|
| Producción | 20 |
| No Producción | 50 |

### Gestión de referencias

Crea referencias personalizadas con rangos de carga (V) y peso (kg). Si una medición queda fuera del rango, el campo se resalta en rojo. Las referencias se persisten en IndexedDB.

### Historial

- **Historial diario**: modal con los registros del día y su estado de sincronización.
- **Historial completo**: muestra los últimos 300 registros ordenados por recencia.

### Sincronización

- **Automática cada 5 minutos** mientras hay conexión.
- **Inmediata al reconectar**: el módulo `swOffline.ts` dispara sync al evento `online` + Background Sync API del SW.
- **Idempotencia con `batchId`**: cada lote lleva un ID único que Apps Script verifica antes de insertar — si el mismo batch llega dos veces (por timeout de red), el servidor lo omite sin duplicar.
- **Retención de 30 días**: los registros sincronizados con más de 30 días se eliminan automáticamente de IndexedDB al iniciar la app.

---

## Arquitectura

```
[Operador]
    │ selecciona tipo + llena formulario
    ▼
[React App]
    │ save(record { id, batchId, tipoInspeccion, synced=false })
    ▼
[IndexedDB]  ◄─── markAsSynced() ───  [SyncManager]
    │                                  │ auto-sync 5 min
    └──── getPendingSync() ────────────┘ + evento online
                                        │
                               HTTPS POST (JSON + batchId + tipoInspeccion)
                                  timeout: 90s
                         ┌─────────────┴──────────────┐
                         │                             │ (monitor, fire-and-forget)
                         ▼                             ▼
              [Apps Script Principal]     [Apps Script Hoja Copia]
                         │                             │
                  getSheet(tipoInspeccion)      hoja fija: DATOS
                         │                             │
              ┌──────────┴──────────┐         [PropertiesService]
              ▼                     ▼         (batchId idempotencia)
         [Hoja DATOS]        [Hoja DATOS 250]         │
         (Producción)        (No Producción)   [Telegram Bot]
              │
    [PropertiesService]
    (batchId idempotencia)
```

IndexedDB tiene dos stores: `records` (con campos `id`, `batchId`, `tipoInspeccion`, `synced`) y `customReferences`.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 7 + SWC |
| PWA / Service Worker | Service Worker manual (`public/sw.js`, sin Workbox) |
| Almacenamiento local | IndexedDB (raw, sin wrapper) |
| Backend de datos | Google Apps Script (doPost) + Google Sheets |
| Notificaciones | Telegram Bot (vía Apps Script hoja copia) |
| Deploy | GitHub Pages (`gh-pages`) |

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
# URL principal — Apps Script que enruta a DATOS o DATOS 250 según tipoInspeccion
VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/XXXXXXXX/exec

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

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `VITE_GOOGLE_SHEETS_URL` | Sí | URL del Apps Script principal. Maneja Producción y No Producción en un solo endpoint. |
---

## Apps Script

El código completo de ambos scripts está documentado en `CODEGS.md` (gitignored).

### Script principal (`DATOS` / `DATOS 250`)

Lee el campo `tipoInspeccion` del payload y enruta a la hoja correspondiente del mismo libro:

```javascript
const CONFIG = {
  SPREADSHEET_ID: "...",
  SHEETS: {
    'produccion':    'DATOS',
    'no-produccion': 'DATOS 250',
  }
};
```

### Script hoja copia (monitor + Telegram)

Recibe todos los registros (sin distinción de tipo), los inserta en su hoja `DATOS` y notifica por Telegram. Idempotencia gestionada de forma independiente con su propio `PropertiesService`.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Compilación optimizada para producción |
| `npm run preview` | Vista previa del build local |
| `npm run lint` | Análisis estático con ESLint |
| `npm run deploy` | Build + publicación en GitHub Pages |

---

## Inspectores registrados

La lista está en `src/modules/constants/inspectionOptions.ts` → `INSPECTOR_OPTIONS`.
Para agregar o quitar inspectores, editar ese array y redesplegar.

Activos: Luis Leal, Ferley Perez, Jhonatan Idarraga, Kevin Johan Morales, Vidalvis Quintana.

---

## Notas para producción

- `console.*` y `debugger` se eliminan automáticamente en build (`vite.config.ts` → `esbuild.drop`).
- El `CACHE_VERSION` del SW se genera con `v${Date.now()}` en cada build — no requiere bump manual.
- El SW usa `skipWaiting()` al instalar; las actualizaciones se activan sin cerrar pestañas.
- Guard `isRunning` en `syncManager.ts` previene ejecuciones concurrentes en la misma pestaña.
- El `batchId` de idempotencia se almacena en `PropertiesService` de cada Apps Script (últimos 200 IDs, ~5 KB).
- Cuando un batch falla no hay fallback individual: todos quedan pendientes y reintentan en el próximo ciclo, evitando duplicados si el servidor procesó el batch pero la respuesta de red se perdió.
- Registros de baterías antiguas en IDB sin `tipoInspeccion` se tratan como `'produccion'` por compatibilidad.
