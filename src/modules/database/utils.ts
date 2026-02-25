// Utilidades de la base de datos

import { initDB, RECORDS_STORE } from './initDB';
import { recordsDB } from './recordsDB';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getRecordsCount = async (): Promise<number> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(RECORDS_STORE, 'readonly');
    const store = transaction.objectStore(RECORDS_STORE);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getPendingSyncCount = async (): Promise<number> => {
  const records = await recordsDB.getPendingSync();
  return records.length;
};
