import { useEffect, useState } from 'react';
import type { DailyHistoryEntry } from './useDailyHistory';
import { recordsDB } from '../../modules/database';
import type { StoredRecord } from '../../modules/types';
import './DailyHistory.css';

interface Props {
  entries: DailyHistoryEntry[];
  todayCount: number;
  onClose: () => void;
}

type Tab = 'today' | 'all';

interface DateGroup {
  dateKey: string;
  dateLabel: string;
  records: StoredRecord[];
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

/** Extrae la clave de ordenación YYYYMMDD del ID para agrupar por día. */
function getDayKey(id: string): string {
  const ts = parseInt(id.split('-')[0], 10);
  if (isNaN(ts)) return '00000000';
  const d = new Date(ts);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** Formatea una clave YYYYMMDD en una etiqueta legible DD/MM/YYYY. */
function dayKeyToLabel(key: string): string {
  if (key === '00000000') return 'Fecha desconocida';
  const y = key.slice(0, 4);
  const m = key.slice(4, 6);
  const d = key.slice(6, 8);
  return `${d}/${m}/${y}`;
}

/** Agrupa registros por día (del más reciente al más antiguo). */
function groupByDate(records: StoredRecord[]): DateGroup[] {
  const map = new Map<string, StoredRecord[]>();
  for (const r of records) {
    const key = getDayKey(r.id);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, recs]) => ({
      dateKey: key,
      dateLabel: dayKeyToLabel(key),
      records: recs.sort((a, b) => {
        const ta = parseInt(a.id.split('-')[0], 10);
        const tb = parseInt(b.id.split('-')[0], 10);
        return ta - tb;
      }),
    }));
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

/** Tarjeta de registro individual reutilizable entre pestañas. */
function RecordCard({
  record,
  synced,
  failedOnline,
  num,
}: {
  record: StoredRecord;
  synced: boolean;
  failedOnline: boolean;
  num: number;
}) {
  return (
    <li className={`dh-card dh-card--${synced ? 'synced' : failedOnline ? 'failed' : 'pending'}`}>

      {/* Header: número + estado + referencia + hora */}
      <div className="dh-card__header">
        <span className="dh-card__num">#{num}</span>
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
  );
}

/** Modal que muestra el historial del día y el historial completo almacenado en IndexedDB. */
export const DailyHistoryModal = ({ entries, todayCount, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [allGroups, setAllGroups] = useState<DateGroup[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Carga todos los registros al activar la pestaña de historial completo
  useEffect(() => {
    if (activeTab !== 'all') return;
    setLoadingAll(true);
    recordsDB.getAll().then(records => {
      setAllGroups(groupByDate(records));
      setLoadingAll(false);
    });
  }, [activeTab]);

  const syncedCount = entries.filter(e => e.synced).length;
  const totalAllRecords = allGroups.reduce((sum, g) => sum + g.records.length, 0);

  return (
    <div className="dh-backdrop" onClick={onClose}>
      <div className="dh-modal" onClick={e => e.stopPropagation()}>

        <div className="dh-modal__header">
          <h2 className="dh-modal__title">Historial</h2>
          <button className="dh-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Pestañas */}
        <div className="dh-tabs">
          <button
            className={`dh-tab ${activeTab === 'today' ? 'dh-tab--active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            Hoy
            {todayCount > 0 && <span className="dh-tab__badge">{todayCount}</span>}
          </button>
          <button
            className={`dh-tab ${activeTab === 'all' ? 'dh-tab--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Historial completo
          </button>
        </div>

        {/* ── Pestaña: Hoy ── */}
        {activeTab === 'today' && (
          <>
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
                {entries.map(({ record, synced, failedOnline }, idx) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    synced={synced}
                    failedOnline={failedOnline}
                    num={idx + 1}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {/* ── Pestaña: Historial completo ── */}
        {activeTab === 'all' && (
          <>
            <div className="dh-modal__summary">
              {loadingAll ? (
                <span>Cargando…</span>
              ) : (
                <span>{totalAllRecords} registro{totalAllRecords !== 1 ? 's' : ''} en total</span>
              )}
            </div>

            {loadingAll ? (
              <p className="dh-modal__empty">Cargando registros…</p>
            ) : allGroups.length === 0 ? (
              <p className="dh-modal__empty">No hay registros guardados.</p>
            ) : (
              <div className="dh-modal__list">
                {allGroups.map(group => (
                  <div key={group.dateKey} className="dh-date-group">
                    <div className="dh-date-group__header">
                      <span className="dh-date-group__label">{group.dateLabel}</span>
                      <span className="dh-date-group__count">{group.records.length} registro{group.records.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ul className="dh-date-group__list">
                      {group.records.map((record, idx) => (
                        <RecordCard
                          key={record.id}
                          record={record}
                          synced={record.synced === true}
                          failedOnline={false}
                          num={idx + 1}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
