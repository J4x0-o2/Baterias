// Orquestador de sincronización

import { recordsDB } from '../database';
import { sendRecordsWithRetry } from './sync';
import { API_CONFIG, isApiConfigured } from './api';

export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  pendingCount: number;
  lastError?: string;
}

let syncStatus: SyncStatus = {
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
  if (syncStatus.isRunning) {
    return { synced: 0, failed: 0 };
  }

  if (!isApiConfigured()) {
    syncStatus.lastError = 'API no configurada';
    return { synced: 0, failed: 0 };
  }

  syncStatus.isRunning = true;
  syncStatus.lastError = undefined;

  try {
    const pendingRecords = await recordsDB.getPendingSync();
    syncStatus.pendingCount = pendingRecords.length;

    if (pendingRecords.length === 0) {
      syncStatus.lastSync = new Date();
      return { synced: 0, failed: 0 };
    }

    const results = await sendRecordsWithRetry(pendingRecords, onProgress);

    // Marcar como sincronizados los exitosos
    let synced = 0;
    let failed = 0;

    for (const result of results) {
      if (result.success) {
        await recordsDB.markAsSynced(result.recordId);
        synced++;
      } else {
        failed++;
      }
    }

    syncStatus.lastSync = new Date();
    syncStatus.pendingCount = await recordsDB.getPendingSync().then(r => r.length);

    return { synced, failed };
  } catch (error) {
    syncStatus.lastError = error instanceof Error ? error.message : 'Error desconocido';
    return { synced: 0, failed: 0 };
  } finally {
    syncStatus.isRunning = false;
  }
};

// Inicia sincronización automática por intervalos
export const startAutoSync = (): void => {
  if (syncIntervalId !== null) return;

  // Sincronizar inmediatamente al iniciar
  syncPendingRecords();

  syncIntervalId = window.setInterval(() => {
    if (navigator.onLine) {
      syncPendingRecords();
    }
  }, API_CONFIG.SYNC_INTERVAL);
};

// Detiene la sincronización automática
export const stopAutoSync = (): void => {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};

// Actualiza el conteo de pendientes
export const updatePendingCount = async (): Promise<number> => {
  const records = await recordsDB.getPendingSync();
  syncStatus.pendingCount = records.length;
  return records.length;
};
