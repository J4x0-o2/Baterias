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

  const payload = buildPayload(record);

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

/** Construye el payload numérico de un registro eliminando el flag interno de sincronización. */
function buildPayload(record: StoredRecord) {
  const { synced: _synced, ...fields } = record;
  return {
    ...fields,
    voltage: parseFloat(fields.voltage) || fields.voltage,
    weight:  parseFloat(fields.weight)  || fields.weight,
    formula: parseFloat(fields.formula) || fields.formula,
    dias:    parseInt(fields.dias, 10)  || fields.dias,
  };
}

/** Intenta enviar todos los registros en una sola petición POST (batch). Retorna true si el servidor los aceptó todos. */
const sendBatch = async (records: StoredRecord[]): Promise<boolean> => {
  console.log(`[Sync] Trying batch POST for ${records.length} records`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_CONFIG.GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(records.map(buildPayload)),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Sync] Batch POST HTTP error: ${response.status}`);
      return false;
    }

    let data: { success?: boolean; error?: string } = {};
    try { data = JSON.parse(await response.text()); } catch { /* respuesta no-JSON → tratar como éxito en 200 */ }

    if (data.success === false || data.error) {
      console.warn('[Sync] Batch POST rejected by server:', data.error);
      return false;
    }

    console.log('[Sync] Batch POST accepted by server');
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[Sync] Batch POST failed:', error instanceof Error ? error.message : error);
    return false;
  }
};

/** Envía múltiples registros a Google Sheets. Intenta primero como lote; si falla, reintenta cada registro individualmente con backoff exponencial. */
export const sendRecordsWithRetry = async (
  records: StoredRecord[],
  onProgress?: (completed: number, total: number) => void
): Promise<SyncResult[]> => {
  console.log(`[Sync] Starting send for ${records.length} records`);

  // — Intento en lote (solo cuando hay más de un registro) —
  if (records.length > 1) {
    const batchOk = await sendBatch(records);
    if (batchOk) {
      onProgress?.(records.length, records.length);
      return records.map(r => ({ success: true, recordId: r.id }));
    }
    console.warn('[Sync] Batch failed — falling back to individual sends');
  }

  // — Fallback: envío uno a uno con reintentos —
  const results: SyncResult[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    let result: SyncResult = { success: false, recordId: record.id };

    for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
      console.log(`[Sync] Attempt ${attempt}/${API_CONFIG.MAX_RETRIES} for record ${record.id}`);
      result = await sendRecord(record);
      if (result.success) break;

      if (attempt < API_CONFIG.MAX_RETRIES) {
        const waitTime = 1000 * attempt;
        console.log(`[Sync] Waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`[Sync] Record ${record.id} failed after ${API_CONFIG.MAX_RETRIES} attempts`);
      }
    }

    results.push(result);
    onProgress?.(i + 1, records.length);
  }

  console.log(`[Sync] Send complete: ${results.filter(r => r.success).length}/${records.length} succeeded`);
  return results;
};
