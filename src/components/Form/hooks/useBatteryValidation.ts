// Hook para validación de rangos de batería

import { useMemo } from 'react';
import type { BatteryReference } from '../../../modules/types';

interface ValidationResult {
  isCargaOutOfRange: boolean;
  isPesoOutOfRange: boolean;
  isDiasOutOfRange: boolean;
}

const DIAS_MAX = 21;

/**
 * Hook para validar carga, peso y días contra los rangos permitidos
 */
export const useBatteryValidation = (
  selectedReference: BatteryReference | null,
  voltage: string,
  weight: string,
  dias: string
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

  const isDiasOutOfRange = useMemo(() => {
    if (!dias) return false;
    
    const diasNum = parseInt(dias, 10);
    if (isNaN(diasNum)) return false;
    
    return diasNum >= DIAS_MAX;
  }, [dias]);

  return { isCargaOutOfRange, isPesoOutOfRange, isDiasOutOfRange };
};
