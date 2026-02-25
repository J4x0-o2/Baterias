// Servicio de referencias de baterías

import type { BatteryReference, IReferencesStorage } from '../types';
import { BATTERY_REFERENCES } from './config';

let customStorage: IReferencesStorage | null = null;

export const setCustomReferencesStorage = (storage: IReferencesStorage): void => {
  customStorage = storage;
};

export const getAllReferences = async (): Promise<BatteryReference[]> => {
  const predefined = [...BATTERY_REFERENCES];
  if (customStorage) {
    const custom = await customStorage.getAllReferences();
    return [...predefined, ...custom];
  }
  return predefined;
};

export const getReferencesForSelect = async (): Promise<{ value: string; label: string }[]> => {
  const allRefs = await getAllReferences();
  return allRefs.map(ref => ({
    value: ref.id,
    label: ref.description ? `${ref.code} - ${ref.description}` : ref.code,
  }));
};

export const getReferenceById = async (id: string): Promise<BatteryReference | undefined> => {
  const allRefs = await getAllReferences();
  return allRefs.find(ref => ref.id === id);
};

export const saveCustomReference = async (reference: BatteryReference): Promise<void> => {
  if (!customStorage) throw new Error('Storage no configurado');
  await customStorage.saveReference(reference);
};

export const deleteCustomReference = async (id: string): Promise<void> => {
  if (!customStorage) throw new Error('Storage no configurado');
  await customStorage.deleteReference(id);
};

export const getCustomReferences = async (): Promise<BatteryReference[]> => {
  if (!customStorage) return [];
  return customStorage.getAllReferences();
};

export const getReferencesByVoltage = async (voltage: number): Promise<BatteryReference[]> => {
  const allRefs = await getAllReferences();
  return allRefs.filter(ref => ref.voltage === voltage);
};

