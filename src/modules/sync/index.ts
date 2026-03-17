// Exports del módulo sync

export { API_CONFIG, isApiConfigured } from './api';
export { sendRecord, sendRecordsWithRetry, type SyncResult } from './sync';
export {
  getSyncStatus,
  syncPendingRecords,
  startAutoSync,
  stopAutoSync,
  updatePendingCount,
  onSyncComplete,
  type SyncStatus,
} from './syncManager';
