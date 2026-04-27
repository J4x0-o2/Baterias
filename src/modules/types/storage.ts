// Interfaces de storage para persistencia

import type { BatteryReference, BatteryRecord } from './battery';

// Internal DB record — adds tracking fields on top of the form data
export interface StoredRecord extends BatteryRecord {
  id: string;
  synced: boolean;
  // Shared by all records of the same form submission; used as idempotency key
  // so Apps Script can skip re-insertion if the same batch arrives twice (e.g. after a timeout retry).
  batchId?: string;
}

/** Contrato de servicios para persistencia local de registros de inspección. */
export interface ISaveLocal {
  save(record: StoredRecord): Promise<void>;
  getAll(): Promise<StoredRecord[]>;
  getById(id: string): Promise<StoredRecord | null>;
  delete(id: string): Promise<void>;
  getPendingSync(): Promise<StoredRecord[]>;
  markAsSynced(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

/** Contrato de servicios para persistencia de referencias de baterías personalizadas. */
export interface IReferencesStorage {
  saveReference(reference: BatteryReference): Promise<void>;
  getAllReferences(): Promise<BatteryReference[]>;
  deleteReference(id: string): Promise<void>;
}
