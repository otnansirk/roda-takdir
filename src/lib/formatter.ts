import type { BuiltResultContent, HistoryRecord } from './types';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function shuffleArray<T>(items: T[]): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function formatDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return iso;
  }
}

export function buildResultContent(record: HistoryRecord): BuiltResultContent {
  if (record.mode === 'undian' && record.winner) {
    return {
      categoryTag: 'Hasil Undian · 1 Nama',
      title: 'Nama Terpilih',
      bodyHtml: `
        <div class="winner-spotlight">
          <p class="winner-label">Terpilih dari ${record.totalParticipants} nama peserta</p>
          <p class="winner-name">${escapeHtml(record.winner)}</p>
        </div>
      `,
      plainText: `Hasil Undian: ${record.winner}`,
    };
  }

  if (record.mode === 'kelompok' && record.groups) {
    const groupsHtml = record.groups
      .map(
        (members, idx) => `
        <div class="group-box">
          <div class="group-box-header">
            <span class="group-box-title">Kelompok ${idx + 1}</span>
            <span class="group-box-count">${members.length} anggota</span>
          </div>
          <ol class="group-member-list">
            ${members
              .map(
                (m, mIdx) => `
              <li class="group-member-item">
                <span class="member-idx">${mIdx + 1}.</span>
                <span>${escapeHtml(m)}</span>
              </li>
            `
              )
              .join('')}
          </ol>
        </div>
      `
      )
      .join('');

    return {
      categoryTag: `Pembagian Kelompok · ${record.groups.length} Kelompok`,
      title: `Daftar ${record.groups.length} Kelompok (${record.totalParticipants} Nama)`,
      bodyHtml: `<div class="groups-grid">${groupsHtml}</div>`,
      plainText: record.groups
        .map((members, idx) => `Kelompok ${idx + 1}:\n` + members.map((m, i) => `${i + 1}. ${m}`).join('\n'))
        .join('\n\n'),
    };
  }

  const seq = record.sequence || [];
  const seqHtml = seq
    .map(
      (name, idx) => `
      <li class="sequence-item">
        <span class="sequence-num">${idx + 1}</span>
        <span>${escapeHtml(name)}</span>
      </li>
    `
    )
    .join('');

  return {
    categoryTag: 'Urutan Nama Acak',
    title: `Urutan ${seq.length} Nama`,
    bodyHtml: `<ol class="sequence-list">${seqHtml}</ol>`,
    plainText: seq.map((name, idx) => `${idx + 1}. ${name}`).join('\n'),
  };
}
