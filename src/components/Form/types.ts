// Tipos e interfaces del formulario de batería

export interface SelectOption {
  value: string;
  label: string;
}

export interface BatteryFormData {
  batteryReference: string;
  fechaInspeccion: string;
  fechaFabricacion: string;
  fechaRecarga: string;
  aspectoBornes: string;
  aspectoCalcomanias: string;
  tapones: string;
  aspectoGeneral: string;
  presentaFugas: string;
  voltage: string;
  weight: string;
  formula: string;
  dias: string;
  observaciones: string;
  inspector: string;
}

export type SaveStatus = 'idle' | 'success' | 'error';
