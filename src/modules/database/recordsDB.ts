// Implementación de ISaveLocal para registros de inspección

import type { ISaveLocal, BatteryRecord } from '../types';
import { initDB, RECORDS_STORE } from './initDB';

export const recordsDB: ISaveLocal = {
  async save(record: BatteryRecord): Promise<void> {
    const db = await initDB();

    const recordToSave = {
      ...record,
      synced: record.synced ?? false,
      createdAt: record.createdAt ?? new Date().toISOString()
    };

    console.log('[DB] Saving record:', { id: recordToSave.id, synced: recordToSave.synced, createdAt: recordToSave.createdAt });

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECORDS_STORE, 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.put(recordToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(): Promise<BatteryRecord[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECORDS_STORE, 'readonly');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getById(id: string): Promise<BatteryRecord | null> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECORDS_STORE, 'readonly');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(id: string): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECORDS_STORE, 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getPendingSync(): Promise<BatteryRecord[]> {
    const db = await initDB();
    console.log('[DB] Querying pending records (synced=false)');
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECORDS_STORE, 'readonly');
      const store = transaction.objectStore(RECORDS_STORE);
      // IDBKeyRange.only(false) throws DataError: booleans are not valid IDB keys.
      // Fetch all and filter in JS — also handles legacy records with synced=undefined.
      const request = store.getAll();
      request.onsuccess = () => {
        const pending = request.result.filter(r => r.synced !== true);
        console.log('[DB] Query results:', { count: pending.length, records: pending.map(r => ({ id: r.id, synced: r.synced })) });
        resolve(pending);
      };
      request.onerror = () => {
        console.error('[DB] Error querying pending records:', request.error);
        reject(request.error);
      };
    });
  },

  async markAsSynced(id: string): Promise<void> {
    console.log('[DB] Marking record as synced:', id);
    const record = await this.getById(id);
    if (record) {
      console.log('[DB] Found record, updating synced flag to true');
      record.synced = true;
      await this.save(record);
      console.log('[DB] Record marked as synced successfully:', id);
    } else {
      console.warn('[DB] Record not found for marking as synced:', id);
    }
  },

  async clearAll(): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECORDS_STORE, 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
