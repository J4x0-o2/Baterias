// Interfaces de storage para persistencia

import type { BatteryReference, BatteryRecord } from './battery';

// Internal DB record — adds tracking fields on top of the form data
export interface StoredRecord extends BatteryRecord {
  id: string;
  synced: boolean;
}

export interface ISaveLocal {
  save(record: StoredRecord): Promise<void>;
  getAll(): Promise<StoredRecord[]>;
  getById(id: string): Promise<StoredRecord | null>;
  delete(id: string): Promise<void>;
  getPendingSync(): Promise<StoredRecord[]>;
  markAsSynced(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export interface IReferencesStorage {
  saveReference(reference: BatteryReference): Promise<void>;
  getAllReferences(): Promise<BatteryReference[]>;
  deleteReference(id: string): Promise<void>;
}
