// Funciones de sincronización con Google Sheets

import type { StoredRecord } from '../types';
import { API_CONFIG, isApiConfigured } from './api';

export interface SyncResult {
  success: boolean;
  recordId: string;
  error?: string;
}

/** Envía un registro individual a Google Sheets con manejo de timeout, parsing numérico y deteccion de errores del servidor. */
export const sendRecord = async (record: StoredRecord): Promise<SyncResult> => {
  if (!isApiConfigured()) {
    console.error('[Sync] API not configured - GOOGLE_SHEETS_URL is missing');
    return { success: false, recordId: record.id, error: 'API no configurada' };
  }

  console.log('[Sync] Sending record to Google Sheets:', { recordId: record.id, url: API_CONFIG.GOOGLE_SHEETS_URL });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

  // Strip internal DB fields — id and synced are not columns in Google Sheets
  const { id: _id, synced: _synced, ...formFields } = record;

  // Send numeric fields as actual numbers, not strings.
  // Google Sheets (Spanish locale) auto-converts decimal strings like "12.7"
  // into dates (DD.MM → July 12) producing wrong serial numbers.
  const payload = {
    ...formFields,
    voltage: parseFloat(formFields.voltage) || formFields.voltage,
    weight:  parseFloat(formFields.weight)  || formFields.weight,
    formula: parseFloat(formFields.formula) || formFields.formula,
    dias:    parseInt(formFields.dias, 10)  || formFields.dias,
  };

  try {
    const response = await fetch(API_CONFIG.GOOGLE_SHEETS_URL, {
      method: 'POST',
      // IMPORTANTE: Se usa text/plain para evitar bloqueos por CORS Preflight (OPTIONS) en Google Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Sync] HTTP Error sending record ${record.id}: ${response.status} ${response.statusText}`);
      return { success: false, recordId: record.id, error: `HTTP ${response.status}` };
    }

    const responseText = await response.text();
    console.log(`[Sync] Response body for record ${record.id}:`, responseText);

    // Google Apps Script returns 200 even on errors — check body content
    let responseData: { status?: string; error?: string } = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Response is not JSON — treat as success if HTTP 200
    }

    if (responseData.status === 'error' || responseData.error) {
      console.error(`[Sync] Apps Script error for record ${record.id}:`, responseData.error || responseText);
      return { success: false, recordId: record.id, error: responseData.error || 'Apps Script error' };
    }

    console.log(`[Sync] Record ${record.id} sent successfully to Google Sheets`);
    return { success: true, recordId: record.id };
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`[Sync] Exception sending record ${record.id}:`, error);
    console.error(`[Sync] Error details: ${errorMessage}`);
    return { success: false, recordId: record.id, error: errorMessage };
  }
};

/** Envía múltiples registros a Google Sheets con reintentos exponenciales y reporte de progreso. */
export const sendRecordsWithRetry = async (
  records: StoredRecord[],
  onProgress?: (completed: number, total: number) => void
): Promise<SyncResult[]> => {
  console.log(`[Sync] Starting batch send for ${records.length} records`);
  const results: SyncResult[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    let result: SyncResult = { success: false, recordId: record.id };

    for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
      console.log(`[Sync] Attempt ${attempt}/${API_CONFIG.MAX_RETRIES} for record ${record.id}`);
      result = await sendRecord(record);
      if (result.success) {
        console.log(`[Sync] Record ${record.id} succeeded on attempt ${attempt}`);
        break;
      }

      // Esperar antes de reintentar (backoff exponencial)
      if (attempt < API_CONFIG.MAX_RETRIES) {
        const waitTime = 1000 * attempt;
        console.log(`[Sync] Waiting ${waitTime}ms before retry for record ${record.id}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`[Sync] Record ${record.id} failed after ${API_CONFIG.MAX_RETRIES} attempts`);
      }
    }

    results.push(result);
    onProgress?.(i + 1, records.length);
  }

  console.log(`[Sync] Batch send complete: ${results.filter(r => r.success).length}/${records.length} succeeded`);
  return results;
};
