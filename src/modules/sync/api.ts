/** Configuración centralizada de parámetros de API, timeouts, reintentos e intervalos de sincronización automática. */
export const API_CONFIG = {
  // URL del Google Apps Script Web App (configurar en .env o directamente)
  GOOGLE_SHEETS_URL: import.meta.env.VITE_GOOGLE_SHEETS_URL,

  // URL del sheet de monitoreo privado (opcional — solo supervisión)
  GOOGLE_SHEETS_MONITOR_URL: import.meta.env.VITE_GOOGLE_SHEETS_MONITOR_URL,

  // Timeout para requests (ms)
  REQUEST_TIMEOUT: 30000,

  // Intentos máximos de reintento
  MAX_RETRIES: 3,

  // Intervalo de sincronización automática (ms) - 5 minutos
  SYNC_INTERVAL: 1 * 60 * 1000,
};

/** Valida si la API está correctamente configurada con URL de Google Sheets. */
export const isApiConfigured = (): boolean => {
  return Boolean(API_CONFIG.GOOGLE_SHEETS_URL);
};
