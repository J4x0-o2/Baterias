import { useState } from 'react';
import { useDailyHistory } from './useDailyHistory';
import { DailyHistoryModal } from './DailyHistoryModal';
import './DailyHistory.css';

export const DailyHistoryButton = () => {
  const [open, setOpen] = useState(false);
  const { todayCount, pendingEntries } = useDailyHistory();

  const hasPending = pendingEntries.length > 0;
  const allSynced = todayCount > 0 && !hasPending;

  return (
    <>
      <button
        className={`dh-btn ${hasPending ? 'dh-btn--pending' : allSynced ? 'dh-btn--synced' : ''}`}
        onClick={() => setOpen(true)}
        title="Ver historial de hoy"
        aria-label="Historial del día"
      >
        {hasPending ? (
          // Yellow warning icon
          <svg className="dh-btn__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
          </svg>
        ) : allSynced ? (
          // Green checkmark icon
          <svg className="dh-btn__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1.41 14.59L6.17 12.17l1.41-1.41 2.83 2.83 6.01-6.01 1.41 1.41-7.24 7.6z"/>
          </svg>
        ) : (
          // Neutral list icon
          <svg className="dh-btn__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
        )}

        {todayCount > 0 && (
          <span className={`dh-btn__badge ${hasPending ? 'dh-btn__badge--pending' : 'dh-btn__badge--synced'}`}>
            {todayCount}
          </span>
        )}
      </button>

      {open && (
        <DailyHistoryModal
          entries={pendingEntries}
          todayCount={todayCount}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};
