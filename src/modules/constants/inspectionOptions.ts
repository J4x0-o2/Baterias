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

/** Opción de inspector con nombre como valor y etiqueta. */
export interface InspectorOption {
  value: string;
  label: string;
}

export const INSPECTOR_OPTIONS: InspectorOption[] = [
  { value: 'Luis Leal',     label: 'Luis Leal'     },
  { value: 'Ferley Perez',   label: 'Ferley Perez'   },
  { value: 'Jhonatan Idarraga', label: 'Jonathan Idarraga' },
  { value: 'Kevin Johan Morales', label: 'Kevin Johan Morales'},
  { value: 'Vidalvis Quintana', label: 'Vidalvis Quintana'},
];
