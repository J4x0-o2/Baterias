// Implementación de ISaveLocal para registros de inspección

import type { ISaveLocal, BatteryRecord } from '../types';
import { initDB, RECORDS_STORE } from './initDB';

export const recordsDB: ISaveLocal = {
  async save(record: BatteryRecord): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECORDS_STORE, 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.put(record);
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
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECORDS_STORE, 'readonly');
      const store = transaction.objectStore(RECORDS_STORE);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async markAsSynced(id: string): Promise<void> {
    const record = await this.getById(id);
    if (record) {
      record.synced = true;
      await this.save(record);
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
