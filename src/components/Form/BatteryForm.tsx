import { useState } from 'react';
import { SelectField } from './SelectField';
import { InputField } from './InputField';
import { DateField } from './DateField';
import { TextAreaField } from './TextAreaField';
import { FormButtons } from './FormButtons';
import { BatteryRow } from './BatteryRow';
import { ReferenceForm } from '../ReferenceForm';
import { INSPECTOR_OPTIONS } from '../../modules/constants';
import { useBatchBatteryForm } from './hooks';
import {
  BatteryIcon,
  CalendarIcon,
  ClockIcon,
  FormulaIcon,
  NoteIcon,
  UserIcon,
} from '../Icons';
import './BatteryForm.css';

/** Opciones del selector de cantidad: 1 a 20 baterías por lote. */
const quantityOptions = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

/**
 * Formulario de inspección en lote.
 *
 * Sección superior — campos fijos compartidos por todas las baterías:
 *   referencia, cantidad, fechas, días, fórmula, inspector y observaciones.
 *
 * Sección inferior — una tarjeta por batería con botones de alternancia
 *   para inspección visual y entradas numéricas de carga y peso.
 */
export const BatteryForm = () => {
  const [showReferenceForm, setShowReferenceForm] = useState(false);

  const {
    fixedData,
    batteries,
    quantity,
    pendingQuantity,
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
    lastSavedCount,
  } = useBatchBatteryForm();

  const isDiasOutOfRange = parseInt(fixedData.dias, 10) >= 21;

  // El selector de cantidad muestra el valor pendiente mientras espera confirmación
  const displayedQuantity = (pendingQuantity ?? quantity).toString();

  return (
    <>
      <form className="battery-form" onSubmit={(e) => e.preventDefault()}>
        <h2 className="battery-form__title">Nueva Inspeccion</h2>

        <div className="battery-form__fields">

          {/* Referencia + botón agregar */}
          <div className="battery-form__reference-row">
            <SelectField
              label="Referencia de bateria"
              name="batteryReference"
              placeholder="Seleccionar referencia"
              value={fixedData.batteryReference}
              onChange={handleFixedFieldChange('batteryReference')}
              options={batteryOptions}
              icon={<BatteryIcon />}
            />
            <button
              type="button"
              className="battery-form__add-btn"
              onClick={() => setShowReferenceForm(true)}
              title="Agregar nueva referencia"
            >
              +
            </button>
          </div>

          {/* Cantidad de baterías */}
          <SelectField
            label="Cantidad de baterias"
            name="quantity"
            value={displayedQuantity}
            onChange={(v) => handleQuantityChange(parseInt(v, 10))}
            options={quantityOptions}
            icon={<BatteryIcon />}
          />

          {/* Advertencia de reducción de cantidad */}
          {pendingQuantity !== null && (
            <div className="battery-form__quantity-warning">
              <p className="battery-form__quantity-warning-text">
                Reducir a {pendingQuantity} eliminará las últimas{' '}
                {batteries.length - pendingQuantity} batería(s). ¿Desea continuar?
              </p>
              <div className="battery-form__quantity-warning-actions">
                <button
                  type="button"
                  className="battery-form__warning-btn battery-form__warning-btn--cancel"
                  onClick={cancelQuantityReduction}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="battery-form__warning-btn battery-form__warning-btn--delete"
                  onClick={confirmQuantityReduction}
                >
                  Eliminar
                </button>
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="battery-form__row battery-form__row--3">
            <DateField
              label="Fecha inspeccion"
              name="fechaInspeccion"
              value={fixedData.fechaInspeccion}
              onChange={handleFixedFieldChange('fechaInspeccion')}
              icon={<CalendarIcon />}
            />
            <DateField
              label="Fecha fabricacion"
              name="fechaFabricacion"
              value={fixedData.fechaFabricacion}
              onChange={handleFixedFieldChange('fechaFabricacion')}
              icon={<CalendarIcon />}
            />
            <DateField
              label="Fecha recarga"
              name="fechaRecarga"
              value={fixedData.fechaRecarga}
              onChange={handleFixedFieldChange('fechaRecarga')}
              icon={<CalendarIcon />}
            />
          </div>

          {/* Fórmula y Días */}
          <div className="battery-form__row battery-form__row--2">
            <InputField
              label="Formula"
              name="formula"
              type="number"
              placeholder="0"
              value={fixedData.formula}
              onChange={handleFixedFieldChange('formula')}
              icon={<FormulaIcon />}
            />
            <InputField
              label="Dias"
              name="dias"
              type="number"
              placeholder="0"
              value={fixedData.dias}
              onChange={() => {}}
              icon={<ClockIcon />}
              readOnly
              hasError={isDiasOutOfRange}
            />
          </div>

          {/* Inspector y Observaciones */}
          <SelectField
            label="Inspector"
            name="inspector"
            placeholder="Seleccionar inspector"
            value={fixedData.inspector}
            onChange={handleFixedFieldChange('inspector')}
            options={INSPECTOR_OPTIONS}
            icon={<UserIcon />}
          />
          <TextAreaField
            label="Observaciones"
            name="observaciones"
            placeholder="Escriba observaciones sobre la bateria..."
            value={fixedData.observaciones}
            onChange={handleFixedFieldChange('observaciones')}
            icon={<NoteIcon />}
          />
        </div>

        <div className="battery-form__battery-list">
          <h3 className="battery-form__battery-list-title">
            Baterias ({batteries.length})
          </h3>
          {batteries.map((battery, index) => (
            <BatteryRow
              key={index}
              index={index}
              data={battery}
              onChange={(field, value) => handleBatteryChange(index, field)(value)}
              selectedReference={selectedReference}
            />
          ))}
        </div>

        {/* Mensajes de estado */}
        {saveStatus === 'success' && (
          <div className="battery-form__message battery-form__message--success">
            ✓ {lastSavedCount > 1 ? `${lastSavedCount} registros guardados` : 'Registro guardado'} correctamente
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="battery-form__message battery-form__message--error">
            ✗ Error al guardar los registros
          </div>
        )}

        <FormButtons
          onReset={handleReset}
          onSave={handleSave}
          isSaveDisabled={!isFormValid}
          isLoading={saving}
        />
      </form>

      <ReferenceForm
        isOpen={showReferenceForm}
        onClose={() => setShowReferenceForm(false)}
        onSaved={loadBatteryOptions}
      />
    </>
  );
};
