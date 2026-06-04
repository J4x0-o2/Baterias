import { useBatteryValidation } from './hooks';
import type { BatteryReference } from '../../modules/types';
import type { PerBatteryData } from './types';
import './BatteryRow.css';

// TogglePill — botón de alternancia compacto para campos OK/NOK y NO/SI
interface TogglePillProps {
  label: string;
  /** Tupla [valorNormal, valorAnomalia]. El primero se colorea verde, el segundo rojo. */
  options: readonly [string, string];
  value: string;
  onChange: (value: string) => void;
}

const TogglePill = ({ label, options, value, onChange }: TogglePillProps) => {
  const [normalVal, anomalyVal] = options;
  return (
    <div className="toggle-pill">
      <div className="toggle-pill__group">
        <button
          type="button"
          className={`toggle-pill__btn ${value === normalVal ? 'toggle-pill__btn--normal' : 'toggle-pill__btn--inactive'}`}
          onClick={() => onChange(normalVal)}
        >
          {normalVal}
        </button>
        <button
          type="button"
          className={`toggle-pill__btn ${value === anomalyVal ? 'toggle-pill__btn--anomaly' : 'toggle-pill__btn--inactive'}`}
          onClick={() => onChange(anomalyVal)}
        >
          {anomalyVal}
        </button>
      </div>
      <span className="toggle-pill__label">{label}</span>
    </div>
  );
};


// Helpers
/** Sanitiza entrada decimal: reemplaza coma por punto, descarta caracteres no numéricos,
 *  mantiene solo el primer punto, auto-inserta el punto después del 2.º dígito entero si
 *  el usuario ya escribió más de 2 dígitos sin punto, y trunca los decimales al máximo. */
function sanitizeDecimalInput(value: string, maxDecimals: number): string {
  let v = value.replace(',', '.').replace(/[^\d.]/g, '');
  // Conservar solo el primer punto
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  // Auto-insertar punto después del 2.º dígito si no hay punto y hay más de 2 dígitos
  if (!v.includes('.') && v.length > 2) {
    v = v.slice(0, 2) + '.' + v.slice(2);
  }
  // Truncar decimales al máximo permitido
  const dotIdx = v.indexOf('.');
  if (dotIdx !== -1 && v.slice(dotIdx + 1).length > maxDecimals) {
    v = v.slice(0, dotIdx + maxDecimals + 1);
  }
  return v;
}

/** Si al perder el foco el valor es un entero válido sin punto, agrega ".0". */
function ensureDecimal(value: string): string {
  if (value && !value.includes('.') && /^\d+$/.test(value)) return value + '.0';
  return value;
}


// BatteryRow
interface BatteryRowProps {
  index: number;
  data: PerBatteryData;
  /** Callback unificado: recibe el campo y el nuevo valor. */
  onChange: (field: keyof PerBatteryData, value: string) => void;
  selectedReference: BatteryReference | null;
  weightRequired: boolean;
}

//Fila de inspección para una batería individual dentro de un lote
//Estructura visual:
//Línea 1: número de batería + cinco botones de alternancia (aspecto visual).
//Línea 2: entradas numéricas de Carga (V) y Peso (kg) con validación de rango.
export const BatteryRow = ({ index, data, onChange, selectedReference, weightRequired }: BatteryRowProps) => {
  // La validación de días es responsabilidad de los campos fijos; aquí solo carga y peso.
  const { isCargaOutOfRange, isPesoOutOfRange } = useBatteryValidation(
    selectedReference,
    data.voltage,
    data.weight,
  );

  return (
    <div className="battery-row">
      {/* Encabezado con número de batería */}
      <div className="battery-row__header">
        <span className="battery-row__number">#{index + 1}</span>
      </div>

      {/* Inspección visual — botones de alternancia */}
      <div className="battery-row__toggles">
        <TogglePill
          label="Bornes"
          options={['OK', 'NOK']}
          value={data.aspectoBornes}
          onChange={(v) => onChange('aspectoBornes', v)}
        />
        <TogglePill
          label="Calcomanías"
          options={['OK', 'NOK']}
          value={data.aspectoCalcomanias}
          onChange={(v) => onChange('aspectoCalcomanias', v)}
        />
        <TogglePill
          label="Tapones"
          options={['OK', 'NOK']}
          value={data.tapones}
          onChange={(v) => onChange('tapones', v)}
        />
        <TogglePill
          label="General"
          options={['OK', 'NOK']}
          value={data.aspectoGeneral}
          onChange={(v) => onChange('aspectoGeneral', v)}
        />
        <TogglePill
          label="Fugas"
          options={['NO', 'SI']}
          value={data.presentaFugas}
          onChange={(v) => onChange('presentaFugas', v)}
        />
      </div>

      {/* Mediciones numéricas */}
      <div className="battery-row__measurements">
        <div className={`battery-row__input-group ${isCargaOutOfRange ? 'battery-row__input-group--error' : ''}`}>
          <input
            type="text"
            inputMode="decimal"
            className="battery-row__input"
            placeholder="Carga"
            value={data.voltage}
            onChange={(e) => onChange('voltage', sanitizeDecimalInput(e.target.value, 2))}
            onBlur={(e) => {
              const fixed = ensureDecimal(e.target.value);
              if (fixed !== e.target.value) onChange('voltage', fixed);
            }}
            aria-label={`Carga batería ${index + 1}`}
          />
          <span className="battery-row__unit">V</span>
        </div>
        <div className={`battery-row__input-group ${isPesoOutOfRange ? 'battery-row__input-group--error' : ''}`}>
          <input
            type="text"
            inputMode="decimal"
            className="battery-row__input"
            placeholder={weightRequired ? 'Peso' : 'Peso (opcional)'}
            value={data.weight}
            onChange={(e) => onChange('weight', sanitizeDecimalInput(e.target.value, 3))}
            onBlur={(e) => {
              const fixed = ensureDecimal(e.target.value);
              if (fixed !== e.target.value) onChange('weight', fixed);
            }}
            aria-label={`Peso batería ${index + 1}`}
          />
          <span className="battery-row__unit">kg</span>
        </div>
      </div>
    </div>
  );
};
