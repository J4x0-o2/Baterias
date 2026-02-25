// Opciones para campos de inspección visual

export interface InspectionOption {
  value: 'OK' | 'NOK' | 'SI' | 'NO';
  label: string;
}

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
