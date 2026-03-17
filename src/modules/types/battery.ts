// Tipos para referencias y registros de baterías

export interface BatteryReference {
  id: string;
  code: string;
  description?: string;
  voltage?: number;
  cargaMin?: number;
  cargaMax?: number;
  pesoMin?: number;
  pesoMax?: number;
  isCustom?: boolean;
}

export interface BatteryRecord {
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
