// Servicio de referencias de baterías

import type { BatteryReference, IReferencesStorage } from '../types';
import { BATTERY_REFERENCES } from './config';

let customStorage: IReferencesStorage | null = null;

/** Establece el proveedor de almacenamiento para referencias personalizadas. */
export const setCustomReferencesStorage = (storage: IReferencesStorage): void => {
  customStorage = storage;
};

/** Retorna todas las referencias disponibles combinando predefinidas con personalizadas. */
export const getAllReferences = async (): Promise<BatteryReference[]> => {
  const predefined = [...BATTERY_REFERENCES];
  if (customStorage) {
    const custom = await customStorage.getAllReferences();
    return [...predefined, ...custom];
  }
  return predefined;
};

/** Retorna opciones formateadas de todas las referencias para componentes de selección. */
export const getReferencesForSelect = async (): Promise<{ value: string; label: string }[]> => {
  const allRefs = await getAllReferences();
  return allRefs.map(ref => ({
    value: ref.code,
    label: ref.description ? `${ref.code} - ${ref.description}` : ref.code,
  }));
};

/** Busca y retorna una referencia por código desde todas las referencias disponibles. */
export const getReferenceById = async (code: string): Promise<BatteryReference | undefined> => {
  const allRefs = await getAllReferences();
  return allRefs.find(ref => ref.code === code);
};

/** Guarda una nueva referencia personalizada en almacenamiento si está configurado. */
export const saveCustomReference = async (reference: BatteryReference): Promise<void> => {
  if (!customStorage) throw new Error('Storage no configurado');
  await customStorage.saveReference(reference);
};

/** Elimina una referencia personalizada por identificador. */
export const deleteCustomReference = async (id: string): Promise<void> => {
  if (!customStorage) throw new Error('Storage no configurado');
  await customStorage.deleteReference(id);
};

/** Retorna única y exclusivamente referencias personalizadas del usuario. */
export const getCustomReferences = async (): Promise<BatteryReference[]> => {
  if (!customStorage) return [];
  return customStorage.getAllReferences();
};

/** Filtra y retorna referencias que coinciden con un voltaje específico. */
export const getReferencesByVoltage = async (voltage: number): Promise<BatteryReference[]> => {
  const allRefs = await getAllReferences();
  return allRefs.filter(ref => ref.voltage === voltage);
};

