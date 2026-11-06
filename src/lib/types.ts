export type SpinMode = 'undian' | 'kelompok' | 'urutan';

export interface HistoryRecord {
  id: string;
  mode: SpinMode;
  timestamp: string;
  totalParticipants: number;
  groupCount?: number;
  groupNames?: string[];
  winner?: string;
  groups?: string[][];
  sequence?: string[];
}

export interface BuiltResultContent {
  categoryTag: string;
  title: string;
  bodyHtml: string;
  plainText: string;
}
