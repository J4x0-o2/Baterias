// Inicialización de IndexedDB

export const DB_NAME = 'BattRefDB';
export const DB_VERSION = 3;
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
      const oldVersion = event.oldVersion;

      if (!db.objectStoreNames.contains(RECORDS_STORE)) {
        db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(REFERENCES_STORE)) {
        db.createObjectStore(REFERENCES_STORE, { keyPath: 'id' });
      }

      // v1 → v2: drop the broken 'synced' boolean index
      // v2 → v3: drop the 'createdAt' index (field removed from stored records)
      if (oldVersion < 3 && db.objectStoreNames.contains(RECORDS_STORE)) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const store = transaction.objectStore(RECORDS_STORE);
        if (store.indexNames.contains('synced')) store.deleteIndex('synced');
        if (store.indexNames.contains('createdAt')) store.deleteIndex('createdAt');
      }
    };
  });
};
