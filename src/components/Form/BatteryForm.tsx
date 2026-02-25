import { useState } from 'react';
import { SelectField } from './SelectField';
import { InputField } from './InputField';
import { DateField } from './DateField';
import { TextAreaField } from './TextAreaField';
import { FormButtons } from './FormButtons';
import { ReferenceForm } from '../ReferenceForm';
import { INSPECTION_OPTIONS } from '../../modules/constants';
import { useBatteryForm, useBatteryValidation } from './hooks';
import {
  BatteryIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  FormulaIcon,
  NoteIcon,
  UserIcon,
  VoltageIcon,
  WeightIcon,
} from '../Icons';
import './BatteryForm.css';

// Opciones desde el módulo de referencias
const okNokOptions = INSPECTION_OPTIONS.okNok;
const siNoOptions = INSPECTION_OPTIONS.siNo;

export const BatteryForm = () => {
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  
  const {
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
  } = useBatteryForm();

  const { isCargaOutOfRange, isPesoOutOfRange, isDiasOutOfRange } = useBatteryValidation(
    selectedReference,
    formData.voltage,
    formData.weight,
    formData.dias
  );

  return (
    <>
      <form className="battery-form" onSubmit={(e) => e.preventDefault()}>
        <h2 className="battery-form__title">Nueva Inspeccion</h2>
        
        <div className="battery-form__fields">
          {/* Referencia de batería */}
          <div className="battery-form__reference-row">
            <SelectField
              label="Referencia de bateria"
              name="batteryReference"
              placeholder="Seleccionar referencia"
              value={formData.batteryReference}
              onChange={handleFieldChange('batteryReference')}
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

        {/* Fechas */}
        <div className="battery-form__row battery-form__row--3">
          <DateField
            label="Fecha inspeccion"
            name="fechaInspeccion"
            value={formData.fechaInspeccion}
            onChange={handleFieldChange('fechaInspeccion')}
            icon={<CalendarIcon />}
          />
          <DateField
            label="Fecha fabricacion"
            name="fechaFabricacion"
            value={formData.fechaFabricacion}
            onChange={handleFieldChange('fechaFabricacion')}
            icon={<CalendarIcon />}
          />
          <DateField
            label="Fecha recarga"
            name="fechaRecarga"
            value={formData.fechaRecarga}
            onChange={handleFieldChange('fechaRecarga')}
            icon={<CalendarIcon />}
          />
        </div>

        {/* Aspectos e inspección visual */}
        <div className="battery-form__row battery-form__row--2">
          <SelectField
            label="Aspecto bornes"
            name="aspectoBornes"
            value={formData.aspectoBornes}
            onChange={handleFieldChange('aspectoBornes')}
            options={okNokOptions}
            icon={<CheckIcon />}
          />
          <SelectField
            label="Aspecto calcomanias"
            name="aspectoCalcomanias"
            value={formData.aspectoCalcomanias}
            onChange={handleFieldChange('aspectoCalcomanias')}
            options={okNokOptions}
            icon={<CheckIcon />}
          />
        </div>

        <div className="battery-form__row battery-form__row--2">
          <SelectField
            label="Tapones"
            name="tapones"
            value={formData.tapones}
            onChange={handleFieldChange('tapones')}
            options={okNokOptions}
            icon={<CheckIcon />}
          />
          <SelectField
            label="Aspecto general"
            name="aspectoGeneral"
            value={formData.aspectoGeneral}
            onChange={handleFieldChange('aspectoGeneral')}
            options={okNokOptions}
            icon={<CheckIcon />}
          />
        </div>

        <SelectField
          label="Presenta fugas"
          name="presentaFugas"
          value={formData.presentaFugas}
          onChange={handleFieldChange('presentaFugas')}
          options={siNoOptions}
          icon={<CheckIcon />}
        />

        {/* Carga y Peso */}
        <div className="battery-form__row battery-form__row--2">
          <InputField
            label="Carga"
            name="voltage"
            type="number"
            placeholder="e.j. 12.6"
            value={formData.voltage}
            onChange={handleFieldChange('voltage')}
            icon={<VoltageIcon />}
            unit="V"
            hasError={isCargaOutOfRange}
          />
          <InputField
            label="Peso"
            name="weight"
            type="number"
            placeholder="e.j. 25.4"
            value={formData.weight}
            onChange={handleFieldChange('weight')}
            icon={<WeightIcon />}
            unit="kg"
            hasError={isPesoOutOfRange}
          />
        </div>

        {/* Formula y Días */}
        <div className="battery-form__row battery-form__row--2">
          <InputField
            label="Formula"
            name="formula"
            type="number"
            placeholder="0"
            value={formData.formula}
            onChange={handleFieldChange('formula')}
            icon={<FormulaIcon />}
          />
          <InputField
            label="Dias"
            name="dias"
            type="number"
            placeholder="0"
            value={formData.dias}
            onChange={() => {}}
            icon={<ClockIcon />}
            readOnly
            hasError={isDiasOutOfRange}
          />
        </div>

        {/* Observaciones e Inspector */}
        <TextAreaField
          label="Observaciones"
          name="observaciones"
          placeholder="Escriba observaciones sobre la bateria..."
          value={formData.observaciones}
          onChange={handleFieldChange('observaciones')}
          icon={<NoteIcon />}
        />

        <InputField
          label="Inspector"
          name="inspector"
          type="text"
          placeholder="Nombre del inspector"
          value={formData.inspector}
          onChange={handleFieldChange('inspector')}
          icon={<UserIcon />}
        />
      </div>

      {saveStatus === 'success' && (
        <div className="battery-form__message battery-form__message--success">
          ✓ Registro guardado correctamente
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="battery-form__message battery-form__message--error">
          ✗ Error al guardar el registro
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

