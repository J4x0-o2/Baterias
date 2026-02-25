// Interfaces de storage para persistencia

import type { BatteryReference, BatteryRecord } from './battery';

export interface ISaveLocal {
  save(record: BatteryRecord): Promise<void>;
  getAll(): Promise<BatteryRecord[]>;
  getById(id: string): Promise<BatteryRecord | null>;
  delete(id: string): Promise<void>;
  getPendingSync(): Promise<BatteryRecord[]>;
  markAsSynced(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export interface IReferencesStorage {
  saveReference(reference: BatteryReference): Promise<void>;
  getAllReferences(): Promise<BatteryReference[]>;
  deleteReference(id: string): Promise<void>;
}
