/** Opción de selección con identificador y etiqueta de visualización. */
export interface SelectOption {
  value: string;
  label: string;
}

/** Estructura agregada de datos del formulario de inspección de baterías con todos los campos recolectados. */
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

/** Estado de resultado de operación de guardado del formulario. */
export type SaveStatus = 'idle' | 'success' | 'error';
