import { useEffect } from 'react';
import type { DailyHistoryEntry } from './useDailyHistory';
import './DailyHistory.css';

interface Props {
  entries: DailyHistoryEntry[];
  todayCount: number;
  onClose: () => void;
}

/** Convierte fecha ISO (YYYY-MM-DD) al formato local (DD/MM) para visualización. */
function formatDate(iso: string): string {
  if (!iso) return '—';
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

/** Extrae la hora HH:MM del timestamp embebido en el ID del registro (formato timestamp-uuid). */
function formatTime(id: string): string {
  const ts = parseInt(id.split('-')[0], 10);
  if (isNaN(ts)) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Icono de verificación verde para registros sincronizados exitosamente. */
function SyncedIcon() {
  return (
    <svg className="dh-card__icon dh-card__icon--synced" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1.41 14.59L6.17 12.17l1.41-1.41 2.83 2.83 6.01-6.01 1.41 1.41-7.24 7.6z"/>
    </svg>
  );
}

/** Icono de advertencia amarillo para registros pendientes de sincronización. */
function PendingIcon() {
  return (
    <svg className="dh-card__icon dh-card__icon--pending" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
    </svg>
  );
}

/** Icono de error rojo para registros con fallo de sincronización confirmado (sin problema de red). */
function FailedIcon() {
  return (
    <svg className="dh-card__icon dh-card__icon--failed" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v8z"/>
    </svg>
  );
}

/** Etiqueta compacta para valores de inspección visual (OK/NOK/SI/NO). */
function InspTag({ label, value }: { label: string; value: string }) {
  const isAlert = value === 'NOK' || value === 'SI';
  return (
    <span className={`dh-tag ${isAlert ? 'dh-tag--alert' : 'dh-tag--ok'}`}>
      <span className="dh-tag__label">{label}</span>
      <span className="dh-tag__value">{value || '—'}</span>
    </span>
  );
}

/** Modal que muestra el historial completo del día con todos los campos de cada registro y estado de sincronización. */
export const DailyHistoryModal = ({ entries, todayCount, onClose }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const syncedCount = entries.filter(e => e.synced).length;

  return (
    <div className="dh-backdrop" onClick={onClose}>
      <div className="dh-modal" onClick={e => e.stopPropagation()}>

        <div className="dh-modal__header">
          <h2 className="dh-modal__title">Historial de hoy</h2>
          <button className="dh-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="dh-modal__summary">
          <span>{todayCount} registro{todayCount !== 1 ? 's' : ''} hoy</span>
          {syncedCount > 0 && (
            <span className="dh-modal__synced-badge">
              ✓ {syncedCount} sincronizado{syncedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="dh-modal__empty">No hay registros hoy.</p>
        ) : (
          <ul className="dh-modal__list">
            {entries.map(({ record, synced, failedOnline }) => (
              <li key={record.id} className={`dh-card dh-card--${synced ? 'synced' : failedOnline ? 'failed' : 'pending'}`}>

                {/* Header: estado + referencia + hora */}
                <div className="dh-card__header">
                  <span className="dh-card__status">
                    {synced ? <SyncedIcon /> : failedOnline ? <FailedIcon /> : <PendingIcon />}
                  </span>
                  <span className="dh-card__ref">{record.batteryReference}</span>
                  <span className="dh-card__time">{formatTime(record.id)}</span>
                </div>

                {/* Fechas */}
                <div className="dh-card__row">
                  <span className="dh-card__field">
                    <span className="dh-card__field-label">Inspección</span>
                    <span className="dh-card__field-value">{formatDate(record.fechaInspeccion)}</span>
                  </span>
                  <span className="dh-card__field">
                    <span className="dh-card__field-label">Fabricación</span>
                    <span className="dh-card__field-value">{formatDate(record.fechaFabricacion) || '—'}</span>
                  </span>
                  <span className="dh-card__field">
                    <span className="dh-card__field-label">Recarga</span>
                    <span className="dh-card__field-value">{formatDate(record.fechaRecarga)}</span>
                  </span>
                  <span className="dh-card__field">
                    <span className="dh-card__field-label">Días</span>
                    <span className="dh-card__field-value">{record.dias || '—'}</span>
                  </span>
                </div>

                {/* Inspección visual */}
                <div className="dh-card__tags">
                  <InspTag label="Bornes"  value={record.aspectoBornes} />
                  <InspTag label="Calc."   value={record.aspectoCalcomanias} />
                  <InspTag label="Tapones" value={record.tapones} />
                  <InspTag label="General" value={record.aspectoGeneral} />
                  <InspTag label="Fugas"   value={record.presentaFugas} />
                </div>

                {/* Mediciones */}
                <div className="dh-card__row">
                  <span className="dh-card__field">
                    <span className="dh-card__field-label">Carga</span>
                    <span className="dh-card__field-value">{record.voltage} V</span>
                  </span>
                  <span className="dh-card__field">
                    <span className="dh-card__field-label">Peso</span>
                    <span className="dh-card__field-value">{record.weight} kg</span>
                  </span>
                  <span className="dh-card__field">
                    <span className="dh-card__field-label">Fórmula</span>
                    <span className="dh-card__field-value">{record.formula}</span>
                  </span>
                </div>

                {/* Inspector y observaciones */}
                <div className="dh-card__footer">
                  <span className="dh-card__inspector">{record.inspector}</span>
                  {record.observaciones && (
                    <span className="dh-card__obs">{record.observaciones}</span>
                  )}
                </div>

              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
};
