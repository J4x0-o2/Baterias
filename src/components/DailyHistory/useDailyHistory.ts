import { useState, useEffect, useCallback, useRef } from 'react';
import { recordsDB } from '../../modules/database';
import type { StoredRecord } from '../../modules/types';
import { onSyncComplete } from '../../modules/sync';

const CLEAR_HOUR = 23;
const STORAGE_KEY = 'dailyHistoryClear';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLastClearTimestamp(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const { date, ts } = JSON.parse(raw) as { date: string; ts: number };
    return date === getTodayString() ? ts : 0;
  } catch {
    return 0;
  }
}

function getRecordTimestamp(id: string): number {
  return parseInt(id.split('-')[0], 10);
}

function isTodayRecord(id: string, lastClear: number): boolean {
  const ts = getRecordTimestamp(id);
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() &&
    ts > lastClear
  );
}

function isOfflineError(error?: string): boolean {
  if (!error) return false;
  const msg = error.toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('err_name_not_resolved') ||
    msg.includes('network request failed')
  );
}

export interface DailyHistoryEntry {
  record: StoredRecord;
  failedOnline: boolean;
}

export const useDailyHistory = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [pendingEntries, setPendingEntries] = useState<DailyHistoryEntry[]>([]);
  const failedOnlineIds = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    const lastClear = getLastClearTimestamp();
    const all = await recordsDB.getAll();
    const today = all.filter(r => isTodayRecord(r.id, lastClear));
    const pending = today.filter(r => !r.synced);
    setTodayCount(today.length);
    setPendingEntries(
      pending.map(r => ({ record: r, failedOnline: failedOnlineIds.current.has(r.id) }))
    );
  }, []);

  // Initial load
  useEffect(() => { refresh(); }, [refresh]);

  // Refresh when a new record is saved
  useEffect(() => {
    window.addEventListener('batteryRecordSaved', refresh);
    return () => window.removeEventListener('batteryRecordSaved', refresh);
  }, [refresh]);

  // Subscribe to sync results to track online vs offline failures
  useEffect(() => {
    return onSyncComplete((results, wasOnline) => {
      for (const r of results) {
        if (r.success) {
          failedOnlineIds.current.delete(r.recordId);
        } else if (wasOnline && !isOfflineError(r.error)) {
          failedOnlineIds.current.add(r.recordId);
        }
      }
      refresh();
    });
  }, [refresh]);

  // Auto-clear at 11 PM
  useEffect(() => {
    let timeoutId: number;

    const scheduleClear = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(CLEAR_HOUR, 0, 0, 0);
      if (now >= target) target.setDate(target.getDate() + 1);

      timeoutId = window.setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayString(), ts: Date.now() }));
        failedOnlineIds.current.clear();
        setTodayCount(0);
        setPendingEntries([]);
        scheduleClear();
      }, target.getTime() - now.getTime());
    };

    scheduleClear();
    return () => clearTimeout(timeoutId);
  }, []);

  return { todayCount, pendingEntries };
};
