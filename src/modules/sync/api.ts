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

import { Logger } from '../shared/logger';

// Verificar si la API está configurada
export const isApiConfigured = (): boolean => {
  const isConfigured = Boolean(API_CONFIG.GOOGLE_SHEETS_URL);
  if (!isConfigured) {
    Logger.warn('La API no está configurada. Revisa la variable VITE_GOOGLE_SHEETS_URL en .env');
  } else {
    Logger.info('API configurada, detectada URL:', API_CONFIG.GOOGLE_SHEETS_URL);
  }
  return isConfigured;
};
