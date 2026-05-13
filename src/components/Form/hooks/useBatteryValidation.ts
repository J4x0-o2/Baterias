import { useMemo } from 'react';
import type { BatteryReference } from '../../../modules/types';

interface ValidationResult {
  isCargaOutOfRange: boolean;
  isPesoOutOfRange: boolean;
}

/** Hook que valida si carga y peso de una batería individual están fuera del rango de la referencia seleccionada. */
export const useBatteryValidation = (
  selectedReference: BatteryReference | null,
  voltage: string,
  weight: string,
): ValidationResult => {
  const isCargaOutOfRange = useMemo(() => {
    if (!selectedReference || !voltage) return false;
    const carga = parseFloat(voltage);
    if (isNaN(carga)) return false;
    const { cargaMin, cargaMax } = selectedReference;
    if (cargaMin !== undefined && carga < cargaMin) return true;
    if (cargaMax !== undefined && carga > cargaMax) return true;
    return false;
  }, [selectedReference, voltage]);

  const isPesoOutOfRange = useMemo(() => {
    if (!selectedReference || !weight) return false;
    const peso = parseFloat(weight);
    if (isNaN(peso)) return false;
    const { pesoMin, pesoMax } = selectedReference;
    if (pesoMin !== undefined && peso < pesoMin) return true;
    if (pesoMax !== undefined && peso > pesoMax) return true;
    return false;
  }, [selectedReference, weight]);

  return { isCargaOutOfRange, isPesoOutOfRange };
};
