// Implementación de IReferencesStorage para referencias personalizadas

import type { IReferencesStorage, BatteryReference } from '../types';
import { initDB, REFERENCES_STORE } from './initDB';

export const referencesDB: IReferencesStorage = {
  async saveReference(reference: BatteryReference): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(REFERENCES_STORE, 'readwrite');
      const store = transaction.objectStore(REFERENCES_STORE);
      const request = store.put(reference);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAllReferences(): Promise<BatteryReference[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(REFERENCES_STORE, 'readonly');
      const store = transaction.objectStore(REFERENCES_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteReference(id: string): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(REFERENCES_STORE, 'readwrite');
      const store = transaction.objectStore(REFERENCES_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
