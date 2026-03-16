// Configuración de API para sincronización con Google Sheets

export const API_CONFIG = {
  // URL del Google Apps Script Web App (configurar en .env o directamente)
  GOOGLE_SHEETS_URL: import.meta.env.VITE_GOOGLE_SHEETS_URL || '',
  
  // Timeout para requests (ms)
  REQUEST_TIMEOUT: 30000,
  
  // Intentos máximos de reintento
  MAX_RETRIES: 3,
  
  // Intervalo de sincronización automática (ms) - 5 minutos
  SYNC_INTERVAL: 5 * 60 * 1000,
};

// Verificar si la API está configurada
export const isApiConfigured = (): boolean => {
  return Boolean(API_CONFIG.GOOGLE_SHEETS_URL);
};
