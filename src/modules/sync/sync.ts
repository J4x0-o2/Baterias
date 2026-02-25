// Funciones de sincronización con Google Sheets

import type { BatteryRecord } from '../types';
import { API_CONFIG, isApiConfigured } from './api';

export interface SyncResult {
  success: boolean;
  recordId: string;
  error?: string;
}

// Envía un registro individual a Google Sheets
export const sendRecord = async (record: BatteryRecord): Promise<SyncResult> => {
  if (!isApiConfigured()) {
    return { success: false, recordId: record.id, error: 'API no configurada' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_CONFIG.GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, recordId: record.id, error: `HTTP ${response.status}` };
    }

    return { success: true, recordId: record.id };
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, recordId: record.id, error: errorMessage };
  }
};

// Envía múltiples registros con reintentos
export const sendRecordsWithRetry = async (
  records: BatteryRecord[],
  onProgress?: (completed: number, total: number) => void
): Promise<SyncResult[]> => {
  const results: SyncResult[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    let result: SyncResult = { success: false, recordId: record.id };

    for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
      result = await sendRecord(record);
      if (result.success) break;
      
      // Esperar antes de reintentar (backoff exponencial)
      if (attempt < API_CONFIG.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    results.push(result);
    onProgress?.(i + 1, records.length);
  }

  return results;
};
