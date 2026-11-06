import type { HistoryRecord } from './types';

export const STORAGE_KEYS = {
  NAMES: 'roda_takdir_kelas_names_v1',
  HISTORY: 'roda_takdir_kelas_history_v1',
  SOUND: 'roda_takdir_kelas_sound_v1',
} as const;

export const DEFAULT_SAMPLE_NAMES = [
  'Dimas Arif Prasetya',
  'Krisnanto',
  'Muhammad Rofiq Faisal',
  'Wahyuni Edsa Safira',
  'Ahmad Faqih Hidayat',
  'Novita Kurniashella Wulandari',
  'Nurfikriyah Auliani',
  'Wenang Herdama Sugiyanto',
  'Mochamad Thariq Zahir Abdillah',
  'Syauqillah Hadie Ahsana',
  'Dony Rahmad Agung Saputro',
];

export function loadSavedNames(): string {
  const saved = localStorage.getItem(STORAGE_KEYS.NAMES);
  if (saved !== null && saved.trim().length > 0) {
    return saved;
  }
  const fallback = DEFAULT_SAMPLE_NAMES.join('\n');
  localStorage.setItem(STORAGE_KEYS.NAMES, fallback);
  return fallback;
}

export function saveNames(rawText: string): void {
  localStorage.setItem(STORAGE_KEYS.NAMES, rawText);
}

export function loadSoundPreference(): boolean {
  const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
  return saved === null ? true : saved === 'true';
}

export function saveSoundPreference(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.SOUND, String(enabled));
}

export function getHistoryRecords(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryRecord(record: HistoryRecord): void {
  const existing = getHistoryRecords();
  const updated = [record, ...existing].slice(0, 60);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
}

export function deleteHistoryRecord(id: string): void {
  const existing = getHistoryRecords();
  const updated = existing.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
}

export function clearAllHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}
