// Orquestador de sincronización

import { recordsDB } from '../database';
import { sendRecordsWithRetry, type SyncResult } from './sync';
import { API_CONFIG, isApiConfigured } from './api';

type SyncCompleteListener = (results: SyncResult[], wasOnline: boolean) => void;
const syncListeners: SyncCompleteListener[] = [];

export const onSyncComplete = (fn: SyncCompleteListener): (() => void) => {
  syncListeners.push(fn);
  return () => {
    const idx = syncListeners.indexOf(fn);
    if (idx > -1) syncListeners.splice(idx, 1);
  };
};

export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  pendingCount: number;
  lastError?: string;
}

const syncStatus: SyncStatus = {
  isRunning: false,
  lastSync: null,
  pendingCount: 0,
};

let syncIntervalId: number | null = null;

// Obtiene el estado actual de sincronización
export const getSyncStatus = (): SyncStatus => ({ ...syncStatus });

// Ejecuta sincronización de registros pendientes
export const syncPendingRecords = async (
  onProgress?: (completed: number, total: number) => void
): Promise<{ synced: number; failed: number }> => {
  console.log('[SyncManager] Starting sync cycle');
  
  if (syncStatus.isRunning) {
    console.warn('[SyncManager] Sync already running, skipping');
    return { synced: 0, failed: 0 };
  }

  if (!isApiConfigured()) {
    console.error('[SyncManager] API not configured - missing VITE_GOOGLE_SHEETS_URL');
    syncStatus.lastError = 'API no configurada';
    return { synced: 0, failed: 0 };
  }

  console.log('[SyncManager] API configured:', { url: API_CONFIG.GOOGLE_SHEETS_URL.substring(0, 50) + '...' });

  syncStatus.isRunning = true;
  syncStatus.lastError = undefined;

  try {
    console.log('[SyncManager] Querying pending records from database');
    const pendingRecords = await recordsDB.getPendingSync();
    console.log('[SyncManager] Found pending records:', { count: pendingRecords.length, records: pendingRecords.map(r => r.id) });
    syncStatus.pendingCount = pendingRecords.length;

    if (pendingRecords.length === 0) {
      console.log('[SyncManager] No pending records to sync');
      syncStatus.lastSync = new Date();
      return { synced: 0, failed: 0 };
    }

    console.log('[SyncManager] Sending records to Google Sheets');
    const wasOnline = navigator.onLine;
    const results = await sendRecordsWithRetry(pendingRecords, onProgress);

    // Marcar como sincronizados los exitosos
    let synced = 0;
    let failed = 0;

    console.log('[SyncManager] Processing sync results');
    for (const result of results) {
      if (result.success) {
        console.log(`[SyncManager] Marking record ${result.recordId} as synced`);
        await recordsDB.markAsSynced(result.recordId);
        synced++;
      } else {
        console.warn(`[SyncManager] Record ${result.recordId} sync failed: ${result.error}`);
        failed++;
      }
    }

    syncListeners.forEach(fn => fn(results, wasOnline));

    syncStatus.lastSync = new Date();
    const remainingPending = await recordsDB.getPendingSync();
    syncStatus.pendingCount = remainingPending.length;

    console.log('[SyncManager] Sync cycle complete:', { synced, failed, remainingPending: syncStatus.pendingCount });
    return { synced, failed };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[SyncManager] Exception during sync cycle:', error);
    console.error('[SyncManager] Error details:', { message: errorMsg });
    syncStatus.lastError = errorMsg;
    return { synced: 0, failed: 0 };
  } finally {
    syncStatus.isRunning = false;
    console.log('[SyncManager] Sync cycle ended');
  }
};

// Inicia sincronización automática por intervalos
export const startAutoSync = (): void => {
  if (syncIntervalId !== null) {
    console.warn('[SyncManager] Auto sync already running');
    return;
  }

  console.log('[SyncManager] Starting auto sync with interval:', API_CONFIG.SYNC_INTERVAL, 'ms');
  
  // Sincronizar inmediatamente al iniciar
  syncPendingRecords();

  syncIntervalId = window.setInterval(() => {
    if (navigator.onLine) {
      console.log('[SyncManager] Auto sync interval triggered (online)');
      syncPendingRecords();
    } else {
      console.log('[SyncManager] Auto sync interval triggered but offline - skipping');
    }
  }, API_CONFIG.SYNC_INTERVAL);
};

// Detiene la sincronización automática
export const stopAutoSync = (): void => {
  if (syncIntervalId !== null) {
    console.log('[SyncManager] Stopping auto sync');
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};

// Actualiza el conteo de pendientes
export const updatePendingCount = async (): Promise<number> => {
  console.log('[SyncManager] Updating pending count');
  const records = await recordsDB.getPendingSync();
  syncStatus.pendingCount = records.length;
  console.log('[SyncManager] Pending count updated:', records.length);
  return records.length;
};
