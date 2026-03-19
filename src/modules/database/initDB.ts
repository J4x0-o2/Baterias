/** Nombre de la base de datos IndexedDB para almacenamiento local de baterías. */
export const DB_NAME = 'BattRefDB';
/** Versión actual del esquema IndexedDB. */
export const DB_VERSION = 3;
/** Nombre del object store para registros de inspección. */
export const RECORDS_STORE = 'records';
/** Nombre del object store para referencias personalizadas de baterías. */
export const REFERENCES_STORE = 'customReferences';

let dbInstance: IDBDatabase | null = null;

/** Inicializa conexión con IndexedDB, creando stores y migrando esquema si es necesario, devuelve instancia cached en posteriores llamadas. */
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
