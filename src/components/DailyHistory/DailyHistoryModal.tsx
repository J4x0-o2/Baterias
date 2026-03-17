import { useEffect } from 'react';
import type { DailyHistoryEntry } from './useDailyHistory';
import './DailyHistory.css';

interface Props {
  entries: DailyHistoryEntry[];
  todayCount: number;
  onClose: () => void;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

function PendingIcon() {
  return (
    <svg className="dh-entry__icon dh-entry__icon--pending" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg className="dh-entry__icon dh-entry__icon--failed" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v8z"/>
    </svg>
  );
}

export const DailyHistoryModal = ({ entries, todayCount, onClose }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const syncedCount = todayCount - entries.length;

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
          <p className="dh-modal__empty">
            {todayCount > 0
              ? 'Todos los registros han sido sincronizados.'
              : 'No hay registros hoy.'}
          </p>
        ) : (
          <ul className="dh-modal__list">
            <li className="dh-modal__list-header">
              <span></span>
              <span>Referencia</span>
              <span>Inspección</span>
              <span>Recarga</span>
              <span>Carga</span>
              <span>Peso</span>
            </li>
            {entries.map(({ record, failedOnline }) => (
              <li key={record.id} className="dh-entry">
                <span className="dh-entry__status">
                  {failedOnline ? <FailedIcon /> : <PendingIcon />}
                </span>
                <span className="dh-entry__ref">{record.batteryReference}</span>
                <span className="dh-entry__date">{formatDate(record.fechaInspeccion)}</span>
                <span className="dh-entry__date">{formatDate(record.fechaRecarga)}</span>
                <span className="dh-entry__value">{record.voltage} V</span>
                <span className="dh-entry__value">{record.weight} kg</span>
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
};
