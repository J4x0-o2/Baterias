# Baterias — Contexto para Claude

## ¿Qué es esta app?

PWA de uso empresarial para registrar inspecciones de baterías industriales. Los operadores llenan un formulario (campos fijos + N baterías individuales) y los datos se envían a Google Sheets vía Apps Script. Opera en campo con conectividad intermitente, por eso tiene soporte offline + sync automático.

## Stack

- **Frontend**: React + TypeScript + Vite
- **Persistencia local**: IndexedDB (via `idb` raw, sin librería wrapper)
- **Sincronización remota**: Google Apps Script (doPost) → Google Sheets
- **PWA**: Service Worker propio (`public/sw.js`), sin Workbox
- **Deploy**: GitHub Pages (`.github/workflows/deploy.yml`)

## Arquitectura de datos

```
FormularioBatch → [StoredRecord x N] → IndexedDB (synced=false)
                                          ↓ syncPendingRecords()
                                       Google Sheets (doPost batch)
                                          ↓ si éxito
                                       IndexedDB (synced=true)
```

### Tipos clave

- `BatteryRecord` — campos del formulario (15 columnas: batteryReference, fechas, aspectos visuales, voltage, weight, formula, dias, observaciones, inspector)
- `StoredRecord extends BatteryRecord` — agrega `id: string` y `synced: boolean`
- `BatchFixedData` — campos compartidos por todas las baterías del lote
- `PerBatteryData` — campos individuales por batería (aspectos + voltage + weight)

## Módulos críticos

| Archivo | Responsabilidad |
|---|---|
| `src/modules/sync/syncManager.ts` | Orquestador: ciclo de sync, auto-sync cada 1 min, guard `isRunning` |
| `src/modules/sync/sync.ts` | `sendBatch()` (POST array) y `sendRecord()` (POST objeto único) |
| `src/modules/sync/api.ts` | Config: `REQUEST_TIMEOUT=30s`, `MAX_RETRIES=3`, `SYNC_INTERVAL=1min` |
| `src/modules/database/recordsDB.ts` | CRUD IndexedDB + `getPendingSync()` + `markAsSynced()` |
| `src/components/Form/hooks/useBatchBatteryForm.ts` | `handleSave()`: guarda en IDB → dispara sync fire-and-forget |
| `public/sw.js` | Service Worker: cache-first para assets, network-first para API |
| `src/pwa/swOffline.ts` | Registro SW, manejo online/offline, trigger Background Sync |

## Apps Script (Google)

Dos hojas:
1. **Hoja principal** (`CODEGS.md` — primer bloque): solo inserta
2. **Hoja copia** (`CODEGS.md` — segundo bloque): inserta + notifica Telegram

Ambas tienen `doPost` que detecta si el payload es array (batch) u objeto (individual), busca la última fila con dato en columna A, inserta con `setValues`, y copia formato de la fila anterior con `copyTo({ formatOnly: true })`.

## Variables de entorno

- `VITE_GOOGLE_SHEETS_URL` — URL principal (Apps Script exec)
- `VITE_GOOGLE_SHEETS_MONITOR_URL` — URL hoja copia (opcional, fire-and-forget)

## Bugs conocidos y su causa

### 1. Duplicación de registros (bug activo)
**Causa**: `REQUEST_TIMEOUT=30s` es menor que el tiempo de ejecución de Apps Script para 20 registros (~15-35s incluyendo `copyTo`). El cliente cancela la request por timeout, considera el batch fallido, los 20 registros quedan `synced=false` en IDB. El siguiente ciclo de auto-sync (1 min después) reenvía todos → Apps Script inserta de nuevo. **El servidor procesó ambos batches.**

**Solución**: Aumentar `REQUEST_TIMEOUT` a 90s + `SYNC_INTERVAL` a 5 min (el comentario ya dice 5 min pero el valor es 1 min). Solución robusta: idempotency key en Apps Script.

### 2. Celdas agrandadas (bug intermitente)
**Causa**: `copyTo({ formatOnly: true })` en Apps Script copia también la altura de fila del `lastDataRow`. Si esa fila fue redimensionada manualmente, todas las filas insertadas heredan ese alto.

**Solución**: Después del `copyTo` en Apps Script, llamar `sheet.setRowHeightsForced(targetRow, rows.length, 21)` para resetear al alto estándar.

## Flujo de sync completo

1. Usuario presiona "Guardar" → `handleSave()` en `useBatchBatteryForm.ts`
2. Cada batería se guarda en IDB con `synced=false` y un `id` único (`Date.now() + random`)
3. Se dispara `syncPendingRecords()` de forma async (no bloquea la UI)
4. `syncManager.ts` verifica `isRunning` (guard anti-concurrencia, funciona por ser single-thread JS)
5. Lee todos los `synced=false` de IDB
6. Si hay > 1 registro: llama `sendBatch()` (POST con array JSON)
7. Si batch exitoso: marca todos como `synced=true`
8. Si batch falla: deja todos como `synced=false` → el próximo auto-sync reintenta
9. Auto-sync se dispara cada 1 min si hay conexión
10. También se dispara al evento `online` (desde `swOffline.ts` Y desde `syncManager.ts`)
