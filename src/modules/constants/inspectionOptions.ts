/** Opción de inspección con valor tipado y etiqueta de visualización. */
export interface InspectionOption {
  value: 'OK' | 'NOK' | 'SI' | 'NO';
  label: string;
}

/** Opciones de inspección visual con listas predefinidas OK/NOK y SI/NO. */
export const INSPECTION_OPTIONS: { okNok: InspectionOption[]; siNo: InspectionOption[] } = {
  okNok: [
    { value: 'OK', label: 'OK' },
    { value: 'NOK', label: 'NOK' },
  ],
  siNo: [
    { value: 'NO', label: 'NO' },
    { value: 'SI', label: 'SI' },
  ],
};
