// Inicialización de IndexedDB

export const DB_NAME = 'BattRefDB';
export const DB_VERSION = 1;
export const RECORDS_STORE = 'records';
export const REFERENCES_STORE = 'customReferences';

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(RECORDS_STORE)) {
        const recordsStore = db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
        recordsStore.createIndex('synced', 'synced', { unique: false });
        recordsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(REFERENCES_STORE)) {
        db.createObjectStore(REFERENCES_STORE, { keyPath: 'id' });
      }
    };
  });
};
