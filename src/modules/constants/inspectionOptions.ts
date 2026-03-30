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

/**
 * Lista de inspectores habilitados para registrar inspecciones de baterías.
 * Agregar o modificar nombres aquí actualiza automáticamente el selector en el formulario.
 */
export const INSPECTOR_OPTIONS: InspectorOption[] = [
  { value: 'Luis Leal',     label: 'Luis Leal'     },
  { value: 'Ferley Perez',   label: 'Ferley Perez'   },
  { value: 'Jhonatan Idarraga', label: 'Jonathan Idarraga' },
  { value: 'Kewin Banquet',    label: 'Kewin Banquet'    },
  { value: 'Kevin Johan Morales', label: 'Kevin Johan Morales'},
];
