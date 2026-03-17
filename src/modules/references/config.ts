// Referencias de baterías predefinidas

import type { BatteryReference } from '../types';

export const BATTERY_REFERENCES: BatteryReference[] = [
  { id: '1', code: '244103506R', cargaMin: 12.7, cargaMax: 13.00, pesoMin: 14.800, pesoMax: 16.000 },
  { id: '2', code: '244103318R', cargaMin: 12.7, cargaMax: 13.00, pesoMin: 16.550, pesoMax: 17.970 },
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

