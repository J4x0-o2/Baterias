// Modal para crear nueva referencia de batería

import { useState } from 'react';
import { InputField } from '../Form/InputField';
import { generateId } from '../../modules/database';
import { saveCustomReference } from '../../modules/references';
import type { BatteryReference } from '../../modules/types';
import './ReferenceForm.css';

interface ReferenceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  code: string;
  cargaMin: string;
  cargaMax: string;
  pesoMin: string;
  pesoMax: string;
}

const initialFormData: FormData = {
  code: '',
  cargaMin: '',
  cargaMax: '',
  pesoMin: '',
  pesoMax: '',
};

export const ReferenceForm = ({ isOpen, onClose, onSaved }: ReferenceFormProps) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const newReference: BatteryReference = {
        id: `custom-${generateId()}`,
        code: formData.code.trim(),
        cargaMin: formData.cargaMin ? parseFloat(formData.cargaMin) : undefined,
        cargaMax: formData.cargaMax ? parseFloat(formData.cargaMax) : undefined,
        pesoMin: formData.pesoMin ? parseFloat(formData.pesoMin) : undefined,
        pesoMax: formData.pesoMax ? parseFloat(formData.pesoMax) : undefined,
        isCustom: true,
      };

      await saveCustomReference(newReference);
      setFormData(initialFormData);
      onSaved();
      onClose();
    } catch (err) {
      setError('Error al guardar la referencia');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isValid = formData.code.trim().length > 0;

  return (
    <div className="reference-form-overlay" onClick={handleBackdropClick}>
      <div className="reference-form">
        <div className="reference-form__header">
          <h3 className="reference-form__title">Nueva Referencia</h3>
          <button 
            type="button" 
            className="reference-form__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="reference-form__body">
          <div className="reference-form__fields">
            <InputField
              label="Nombre de referencia"
              name="code"
              type="text"
              placeholder="Ej: 23234355R"
              value={formData.code}
              onChange={handleChange('code')}
            />

            <div className="reference-form__row">
              <InputField
                label="Carga mínima"
                name="cargaMin"
                type="number"
                placeholder="0"
                value={formData.cargaMin}
                onChange={handleChange('cargaMin')}
                unit="V"
              />
              <InputField
                label="Carga máxima"
                name="cargaMax"
                type="number"
                placeholder="0"
                value={formData.cargaMax}
                onChange={handleChange('cargaMax')}
                unit="V"
              />
            </div>

            <div className="reference-form__row">
              <InputField
                label="Peso mínimo"
                name="pesoMin"
                type="number"
                placeholder="0"
                value={formData.pesoMin}
                onChange={handleChange('pesoMin')}
                unit="kg"
              />
              <InputField
                label="Peso máximo"
                name="pesoMax"
                type="number"
                placeholder="0"
                value={formData.pesoMax}
                onChange={handleChange('pesoMax')}
                unit="kg"
              />
            </div>
          </div>

          {error && (
            <div className="reference-form__error">{error}</div>
          )}

          <div className="reference-form__actions">
            <button 
              type="button" 
              className="reference-form__btn reference-form__btn--cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="reference-form__btn reference-form__btn--save"
              disabled={!isValid || saving}
              onClick={handleSubmit}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
