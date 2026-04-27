/** Configuración centralizada de parámetros de API, timeouts, reintentos e intervalos de sincronización automática. */
export const API_CONFIG = {
  // URL del Google Apps Script Web App (configurar en .env o directamente)
  GOOGLE_SHEETS_URL: import.meta.env.VITE_GOOGLE_SHEETS_URL,

  // URL del sheet de monitoreo privado (opcional — solo supervisión)
  GOOGLE_SHEETS_MONITOR_URL: import.meta.env.VITE_GOOGLE_SHEETS_MONITOR_URL,

  // Timeout para requests (ms) — Apps Script puede tardar 15-35s en un batch de 20 filas
  // (openById + getValues + setValues + copyTo). 90s da margen suficiente sin bloquear indefinidamente.
  REQUEST_TIMEOUT: 90_000,

  // Intentos máximos de reintento
  MAX_RETRIES: 3,

  // Intervalo de sincronización automática (ms) — 5 minutos
  // IMPORTANTE: debe ser mayor que REQUEST_TIMEOUT para evitar que el auto-sync
  // reenvíe un batch que todavía está en vuelo o acaba de fallar por timeout.
  SYNC_INTERVAL: 5 * 60 * 1000,
};

/** Valida si la API está correctamente configurada con URL de Google Sheets. */
export const isApiConfigured = (): boolean => {
  return Boolean(API_CONFIG.GOOGLE_SHEETS_URL);
};
