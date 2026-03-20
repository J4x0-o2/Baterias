import { useState, useEffect, useCallback } from 'react';
import { getReferencesForSelect, getReferenceById } from '../../../modules/references';
import { DEFAULT_FORM_VALUES } from '../../../modules/constants';
import type { BatteryReference, StoredRecord } from '../../../modules/types';
import { recordsDB, generateId } from '../../../modules/database';
import { syncPendingRecords } from '../../../modules/sync';
import { calcularDias } from '../utils';
import type { BatchFixedData, PerBatteryData, SelectOption, SaveStatus } from '../types';

// ---------------------------------------------------------------------------
// Utilidades y constantes de módulo
// ---------------------------------------------------------------------------

/** Devuelve la fecha actual en formato ISO YYYY-MM-DD compatible con inputs tipo date. */
const getTodayISO = (): string => new Date().toISOString().split('T')[0];

/** Campos fijos en su estado vacío inicial. Las fechas de sesión se aplican por encima. */
const initialFixedData: BatchFixedData = {
  batteryReference: '',
  fechaInspeccion: '',
  fechaFabricacion: '',
  fechaRecarga: '',
  formula: DEFAULT_FORM_VALUES.formula,
  dias: '0',
  observaciones: '',
  inspector: '',
};

/** Estado por defecto de una batería individual: inspección visual en orden, sin mediciones. */
export const defaultBattery: PerBatteryData = {
  aspectoBornes: DEFAULT_FORM_VALUES.aspectoBornes,
  aspectoCalcomanias: DEFAULT_FORM_VALUES.aspectoCalcomanias,
  tapones: DEFAULT_FORM_VALUES.tapones,
  aspectoGeneral: DEFAULT_FORM_VALUES.aspectoGeneral,
  presentaFugas: DEFAULT_FORM_VALUES.presentaFugas,
  voltage: '',
  weight: '',
};

/** Fechas que persisten entre lotes consecutivos dentro de la misma sesión. */
interface SessionDates {
  /** Se inicializa con la fecha de hoy y se actualiza cada vez que el operador la cambia. */
  fechaInspeccion: string;
  /** Vacía hasta que el operador la ingresa por primera vez; luego persiste entre lotes. */
  fechaFabricacion: string;
}

// ---------------------------------------------------------------------------
// Interfaz pública del hook
// ---------------------------------------------------------------------------

export interface UseBatchBatteryFormReturn {
  fixedData: BatchFixedData;
  batteries: PerBatteryData[];
  quantity: number;
  /** Valor distinto de null mientras el operador esperan confirmación de reducción de cantidad. */
  pendingQuantity: number | null;
  /** Cantidad de registros del último lote guardado; útil para el mensaje de éxito. */
  lastSavedCount: number;
  saving: boolean;
  saveStatus: SaveStatus;
  batteryOptions: SelectOption[];
  selectedReference: BatteryReference | null;
  isFormValid: boolean;
  handleFixedFieldChange: (field: keyof BatchFixedData) => (value: string) => void;
  handleBatteryChange: (index: number, field: keyof PerBatteryData) => (value: string) => void;
  /** Incrementa directamente o abre el diálogo de confirmación si la cantidad baja. */
  handleQuantityChange: (newQty: number) => void;
  confirmQuantityReduction: () => void;
  cancelQuantityReduction: () => void;
  handleReset: () => void;
  handleSave: () => Promise<void>;
  loadBatteryOptions: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Gestiona el formulario de inspección en lote:
 * - Campos fijos compartidos (referencia, fechas, inspector, etc.)
 * - Array de datos por batería (aspecto visual, carga, peso)
 * - Selector de cantidad con confirmación al reducir
 * - Fechas de sesión persistentes entre lotes guardados
 * - Guardado múltiple en IndexedDB y sincronización post-guardado
 */
export const useBatchBatteryForm = (): UseBatchBatteryFormReturn => {
  const [sessionDates, setSessionDates] = useState<SessionDates>({
    fechaInspeccion: getTodayISO(),
    fechaFabricacion: '',
  });

  const [fixedData, setFixedData] = useState<BatchFixedData>({
    ...initialFixedData,
    fechaInspeccion: getTodayISO(),
  });

  const [batteries, setBatteries] = useState<PerBatteryData[]>([{ ...defaultBattery }]);
  const [quantity, setQuantity] = useState(1);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedCount, setLastSavedCount] = useState(0);
  const [batteryOptions, setBatteryOptions] = useState<SelectOption[]>([]);
  const [selectedReference, setSelectedReference] = useState<BatteryReference | null>(null);

  // Carga las opciones de referencia al montar
  const loadBatteryOptions = useCallback(async () => {
    const options = await getReferencesForSelect();
    setBatteryOptions(options);
  }, []);

  useEffect(() => {
    loadBatteryOptions();
  }, [loadBatteryOptions]);

  // Recalcula días automáticamente cuando cambian las fechas relevantes
  useEffect(() => {
    const dias = calcularDias(fixedData.fechaInspeccion, fixedData.fechaRecarga);
    setFixedData(prev => ({ ...prev, dias: dias.toString() }));
  }, [fixedData.fechaInspeccion, fixedData.fechaRecarga]);

  // Carga el objeto de referencia completo cuando el operador la selecciona
  useEffect(() => {
    const load = async () => {
      if (fixedData.batteryReference) {
        const ref = await getReferenceById(fixedData.batteryReference);
        setSelectedReference(ref || null);
      } else {
        setSelectedReference(null);
      }
    };
    load();
  }, [fixedData.batteryReference]);

  // ---------------------------------------------------------------------------
  // Manejadores de campos fijos
  // ---------------------------------------------------------------------------

  const handleFixedFieldChange = useCallback(
    (field: keyof BatchFixedData) => (value: string) => {
      setFixedData(prev => ({ ...prev, [field]: value }));
      // Actualiza la sesión para que el siguiente lote herede la fecha modificada
      if (field === 'fechaInspeccion' || field === 'fechaFabricacion') {
        setSessionDates(prev => ({ ...prev, [field]: value }));
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Manejadores de baterías individuales
  // ---------------------------------------------------------------------------

  const handleBatteryChange = useCallback(
    (index: number, field: keyof PerBatteryData) => (value: string) => {
      setBatteries(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Gestión de cantidad
  // ---------------------------------------------------------------------------

  const handleQuantityChange = useCallback(
    (newQty: number) => {
      if (newQty === batteries.length) return;

      if (newQty < batteries.length) {
        // Solicita confirmación antes de eliminar filas con datos
        setPendingQuantity(newQty);
      } else {
        // Agrega filas vacías al final sin confirmación
        setBatteries(prev => [
          ...prev,
          ...Array.from({ length: newQty - prev.length }, () => ({ ...defaultBattery })),
        ]);
        setQuantity(newQty);
      }
    },
    [batteries.length]
  );

  const confirmQuantityReduction = useCallback(() => {
    if (pendingQuantity === null) return;
    setBatteries(prev => prev.slice(0, pendingQuantity));
    setQuantity(pendingQuantity);
    setPendingQuantity(null);
  }, [pendingQuantity]);

  const cancelQuantityReduction = useCallback(() => {
    setPendingQuantity(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Reset y guardado
  // ---------------------------------------------------------------------------

  const handleReset = useCallback(() => {
    const freshDates: SessionDates = { fechaInspeccion: getTodayISO(), fechaFabricacion: '' };
    setSessionDates(freshDates);
    setFixedData({ ...initialFixedData, ...freshDates });
    setBatteries([{ ...defaultBattery }]);
    setQuantity(1);
    setPendingQuantity(null);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      for (const battery of batteries) {
        const record: StoredRecord = {
          ...fixedData,
          ...battery,
          id: generateId(),
          synced: false,
        };
        await recordsDB.save(record);
      }

      window.dispatchEvent(new CustomEvent('batteryRecordSaved'));
      setLastSavedCount(batteries.length);
      setSaveStatus('success');

      // Preserva fechas de sesión; reinicia el resto para el siguiente lote
      setFixedData({ ...initialFixedData, ...sessionDates });
      setBatteries([{ ...defaultBattery }]);
      setQuantity(1);

      // Dispara sincronización sin bloquear la UI
      syncPendingRecords()
        .then(({ synced, failed }) => {
          console.log(`[Form] Sync triggered: ${synced} successful, ${failed} failed`);
        })
        .catch((error) => {
          console.error('[Form] Error triggering sync:', error);
        });

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error guardando registros:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [batteries, fixedData, sessionDates]);

  // ---------------------------------------------------------------------------
  // Validación del formulario completo
  // ---------------------------------------------------------------------------

  const isFormValid = Boolean(
    fixedData.batteryReference &&
    fixedData.fechaInspeccion &&
    fixedData.fechaRecarga &&
    fixedData.inspector &&
    batteries.every(b => b.voltage && b.weight)
  );

  return {
    fixedData,
    batteries,
    quantity,
    pendingQuantity,
    lastSavedCount,
    saving,
    saveStatus,
    batteryOptions,
    selectedReference,
    isFormValid,
    handleFixedFieldChange,
    handleBatteryChange,
    handleQuantityChange,
    confirmQuantityReduction,
    cancelQuantityReduction,
    handleReset,
    handleSave,
    loadBatteryOptions,
  };
};
