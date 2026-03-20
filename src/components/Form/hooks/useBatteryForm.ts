import { useState, useEffect, useCallback } from 'react';
import { getReferencesForSelect, getReferenceById } from '../../../modules/references';
import { DEFAULT_FORM_VALUES } from '../../../modules/constants';
import type { BatteryReference, StoredRecord } from '../../../modules/types';
import { recordsDB, generateId } from '../../../modules/database';
import { syncPendingRecords } from '../../../modules/sync';
import type { BatteryFormData, SelectOption, SaveStatus } from '../types';
import { calcularDias } from '../utils';

/** Devuelve la fecha actual en formato ISO YYYY-MM-DD compatible con inputs tipo date. */
const getTodayISO = (): string => new Date().toISOString().split('T')[0];

/**
 * Valores fijos del formulario que se reinician en cada nuevo registro.
 * Las fechas de sesión se gestionan por separado mediante sessionDates.
 */
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

/** Fechas que persisten entre registros consecutivos dentro de la misma sesión. */
interface SessionDates {
  /** Fecha de inspección: se inicializa con la fecha de hoy y se actualiza al cambiarla. */
  fechaInspeccion: string;
  /** Fecha de fabricación: vacía hasta que el operador la ingresa por primera vez. */
  fechaFabricacion: string;
}

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


/**
 * Hook que gestiona el estado completo del formulario de batería incluyendo:
 * - Fechas de sesión persistentes entre registros (fechaInspeccion y fechaFabricacion)
 * - Cálculo automático de días entre fechaRecarga y fechaInspeccion
 * - Validación, guardado en IndexedDB y sincronización post-guardado
 */
export const useBatteryForm = (): UseBatteryFormReturn => {
  // Fechas que sobreviven entre resets de formulario dentro de la misma sesión
  const [sessionDates, setSessionDates] = useState<SessionDates>({
    fechaInspeccion: getTodayISO(),
    fechaFabricacion: '',
  });

  const [formData, setFormData] = useState<BatteryFormData>({
    ...initialFormData,
    fechaInspeccion: getTodayISO(),
  });
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
    // Persist sticky dates so the next record pre-fills with the last used value
    if (field === 'fechaInspeccion' || field === 'fechaFabricacion') {
      setSessionDates(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleReset = useCallback(() => {
    // Reinicio completo: vuelve a hoy en fechaInspeccion y vacía fechaFabricacion
    const freshDates: SessionDates = { fechaInspeccion: getTodayISO(), fechaFabricacion: '' };
    setSessionDates(freshDates);
    setFormData({ ...initialFormData, ...freshDates });
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const record: StoredRecord = {
        ...formData,
        id: generateId(),
        synced: false,
      };
      
      await recordsDB.save(record);
      window.dispatchEvent(new CustomEvent('batteryRecordSaved'));
      setSaveStatus('success');
      // Preserva las fechas de sesión para que el siguiente registro las herede
      setFormData({ ...initialFormData, ...sessionDates });
      
      // Trigger sync immediately after saving
      syncPendingRecords()
        .then(({ synced, failed }) => {
          console.log(`[Form] Sync triggered: ${synced} successful, ${failed} failed`);
        })
        .catch((error) => {
          console.error('[Form] Error triggering sync:', error);
        });
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error guardando registro:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [formData, sessionDates]);

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
