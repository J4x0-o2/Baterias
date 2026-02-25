// Hook para gestión del estado del formulario de batería

import { useState, useEffect, useCallback } from 'react';
import { getReferencesForSelect, getReferenceById } from '../../../modules/references';
import { DEFAULT_FORM_VALUES } from '../../../modules/constants';
import type { BatteryReference, BatteryRecord } from '../../../modules/types';
import { recordsDB, generateId } from '../../../modules/database';
import type { BatteryFormData, SelectOption, SaveStatus } from '../types';
import { calcularDias } from '../utils';

const initialFormData: BatteryFormData = {
  batteryReference: '',
  fechaInspeccion: '',
  fechaFabricacion: '',
  fechaRecarga: '',
  aspectoBornes: DEFAULT_FORM_VALUES.aspectoBornes,
  aspectoCalcomanias: DEFAULT_FORM_VALUES.aspectoCalcomanias,
  tapones: DEFAULT_FORM_VALUES.tapones,
  aspectoGeneral: DEFAULT_FORM_VALUES.aspectoGeneral,
  presentaFugas: DEFAULT_FORM_VALUES.presentaFugas,
  voltage: '',
  weight: '',
  formula: DEFAULT_FORM_VALUES.formula,
  dias: '0',
  observaciones: '',
  inspector: '',
};

interface UseBatteryFormReturn {
  formData: BatteryFormData;
  saving: boolean;
  saveStatus: SaveStatus;
  batteryOptions: SelectOption[];
  selectedReference: BatteryReference | null;
  isFormValid: boolean;
  handleFieldChange: (field: keyof BatteryFormData) => (value: string) => void;
  handleReset: () => void;
  handleSave: () => Promise<void>;
  loadBatteryOptions: () => Promise<void>;
}


//Hook para gestionar el estado completo del formulario de batería
export const useBatteryForm = (): UseBatteryFormReturn => {
  const [formData, setFormData] = useState<BatteryFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [batteryOptions, setBatteryOptions] = useState<SelectOption[]>([]);
  const [selectedReference, setSelectedReference] = useState<BatteryReference | null>(null);

  // Cargar opciones de baterías
  const loadBatteryOptions = useCallback(async () => {
    const options = await getReferencesForSelect();
    setBatteryOptions(options);
  }, []);

  useEffect(() => {
    loadBatteryOptions();
  }, [loadBatteryOptions]);

  // Calcular días automáticamente cuando cambian las fechas
  useEffect(() => {
    const dias = calcularDias(formData.fechaInspeccion, formData.fechaRecarga);
    setFormData(prev => ({ ...prev, dias: dias.toString() }));
  }, [formData.fechaInspeccion, formData.fechaRecarga]);

  // Cargar referencia seleccionada cuando cambia
  useEffect(() => {
    const loadReference = async () => {
      if (formData.batteryReference) {
        const ref = await getReferenceById(formData.batteryReference);
        setSelectedReference(ref || null);
      } else {
        setSelectedReference(null);
      }
    };
    loadReference();
  }, [formData.batteryReference]);

  const handleFieldChange = useCallback((field: keyof BatteryFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setFormData(initialFormData);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const record: BatteryRecord = {
        ...formData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        synced: false,
      };
      
      await recordsDB.save(record);
      setSaveStatus('success');
      setFormData(initialFormData);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error guardando registro:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [formData]);

  const isFormValid = Boolean(
    formData.batteryReference && 
    formData.fechaInspeccion &&
    formData.fechaRecarga &&
    formData.voltage && 
    formData.weight
  );

  return {
    formData,
    saving,
    saveStatus,
    batteryOptions,
    selectedReference,
    isFormValid,
    handleFieldChange,
    handleReset,
    handleSave,
    loadBatteryOptions,
  };
};
