// Referencias de baterías predefinidas

import type { BatteryReference } from '../types';

export const BATTERY_REFERENCES: BatteryReference[] = [
  { id: '1', code: '244105506R', cargaMin: 12.7, cargaMax: 12.95, pesoMin: 14.8, pesoMax: 16.1 },
  { id: '2', code: '244103318R', cargaMin: 12.7, cargaMax: 13.01, pesoMin: 16.55, pesoMax: 17.97 },
];

export const getBatteryOptions = (): { value: string; label: string }[] => {
  return BATTERY_REFERENCES.map(ref => ({
    value: ref.code,
    label: ref.description ? `${ref.code} - ${ref.description}` : ref.code,
  }));
};

export const getBatteryById = (code: string): BatteryReference | undefined => {
  return BATTERY_REFERENCES.find(ref => ref.code === code);
};

