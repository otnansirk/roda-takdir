import type { HistoryRecord, SpinMode } from '../lib/types';
import {
  DEFAULT_SAMPLE_NAMES,
  clearAllHistory,
  deleteHistoryRecord,
  getHistoryRecords,
  loadSavedNames,
  loadSoundPreference,
  saveHistoryRecord,
  saveNames,
  saveSoundPreference,
} from '../lib/storage';
import {
  buildResultContent,
  escapeHtml,
  formatDateTime,
  shuffleArray,
} from '../lib/formatter';
import { playTickSound, playWinFanfare } from '../lib/sound';
import { launchConfetti } from '../lib/confetti';
import { drawWheelCanvas } from '../lib/wheel';

export function initApp(): void {
  // Elemen DOM: Topbar & Input
  const namesInput = document.getElementById('namesInput') as HTMLTextAreaElement;
  const nameCountBadge = document.getElementById('nameCountBadge') as HTMLElement;
  const sampleNamesBtn = document.getElementById('sampleNamesBtn') as HTMLButtonElement;
  const clearNamesBtn = document.getElementById('clearNamesBtn') as HTMLButtonElement;

  // Elemen DOM: Mode & Kontrol Putaran
  const modeTabs = document.querySelectorAll<HTMLButtonElement>('.mode-tab');
  const modeDescription = document.getElementById('modeDescription') as HTMLElement;
  const groupConfigBox = document.getElementById('groupConfigBox') as HTMLElement;
  const undianConfigBox = document.getElementById('undianConfigBox') as HTMLElement;
  const urutanConfigBox = document.getElementById('urutanConfigBox') as HTMLElement;
  const groupCountInput = document.getElementById('groupCountInput') as HTMLInputElement;
  const decGroupBtn = document.getElementById('decGroupBtn') as HTMLButtonElement;
  const incGroupBtn = document.getElementById('incGroupBtn') as HTMLButtonElement;
  const removePickedCheckbox = document.getElementById('removePickedCheckbox') as HTMLInputElement;

  const centerSpinBtn = document.getElementById('centerSpinBtn') as HTMLButtonElement;
  const wheelCanvas = document.getElementById('wheelCanvas') as HTMLCanvasElement;

  // Elemen DOM: Hasil
  const resultCategoryTag = document.getElementById('resultCategoryTag') as HTMLElement;
  const resultTitle = document.getElementById('resultTitle') as HTMLElement;
  const resultBody = document.getElementById('resultBody') as HTMLElement;
  const copyResultBtn = document.getElementById('copyResultBtn') as HTMLButtonElement;

  // Elemen DOM: Riwayat & Modal Detail
  const historyList = document.getElementById('historyList') as HTMLElement;
  const historyCountText = document.getElementById('historyCountText') as HTMLElement;
  const clearHistoryBtn = document.getElementById('clearHistoryBtn') as HTMLButtonElement;
  const filterChips = document.querySelectorAll<HTMLButtonElement>('.filter-chip');

  const historyModal = document.getElementById('historyModal') as HTMLDialogElement;
  const confettiCanvas = document.getElementById('confettiCanvas') as HTMLCanvasElement;
  const modalCelebrationPill = document.getElementById('modalCelebrationPill') as HTMLElement;
  const celebrationSubtext = document.getElementById('celebrationSubtext') as HTMLElement;
  const modalCategoryTag = document.getElementById('modalCategoryTag') as HTMLElement;
  const modalTimestamp = document.getElementById('modalTimestamp') as HTMLElement;
  const modalTitle = document.getElementById('modalTitle') as HTMLElement;
  const modalBody = document.getElementById('modalBody') as HTMLElement;
  const modalCopyBtn = document.getElementById('modalCopyBtn') as HTMLButtonElement;

  // Elemen DOM: Suara
  const soundToggleBtn = document.getElementById('soundToggleBtn') as HTMLButtonElement;
  const soundIconText = document.getElementById('soundIconText') as HTMLElement;
  const soundLabel = document.getElementById('soundLabel') as HTMLElement;

  // State Aplikasi
  let currentMode: SpinMode = 'undian';
  let currentAngle = 0;
  let hasSpunOnce = false;
  let isSpinning = false;
  let stopRequested = false;
  let soundEnabled = true;
  let activeHistoryFilter: 'all' | SpinMode = 'all';
  let lastPlainTextResult = '';
  let modalPlainTextResult = '';

  function getCleanNames(): string[] {
    return namesInput.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  function alignInitialSliceToPointer(namesCount: number): void {
    if (namesCount > 0 && !hasSpunOnce && !isSpinning) {
      const arcSize = (Math.PI * 2) / namesCount;
      // Posisikan tengah segmen pertama (oranye-emas) tepat di bawah jarum penunjuk atas (3*PI/2)
      currentAngle = (Math.PI * 3) / 2 - arcSize / 2;
    }
  }

  function updateSoundUI(): void {
    soundToggleBtn.setAttribute('aria-pressed', String(soundEnabled));
    soundIconText.textContent = soundEnabled ? '♪' : '✕';
    soundLabel.textContent = soundEnabled ? 'Suara Aktif' : 'Suara Mati';
  }

  function updateNamesUI(): void {
    const names = getCleanNames();
    alignInitialSliceToPointer(names.length);
    nameCountBadge.textContent = `${names.length} Siswa`;
    centerSpinBtn.disabled = names.length === 0 || isSpinning;
    drawWheelCanvas(wheelCanvas, names, currentAngle);
  }

  function renderResultToStage(record: HistoryRecord): void {
    copyResultBtn.hidden = false;
    const built = buildResultContent(record);
    resultCategoryTag.textContent = built.categoryTag;
    resultTitle.textContent = built.title;
    resultBody.innerHTML = built.bodyHtml;
    lastPlainTextResult = built.plainText;
  }

  function openDetailModal(record: HistoryRecord, isCelebration = false): void {
    const built = buildResultContent(record);
    modalCategoryTag.textContent = built.categoryTag;
    modalTimestamp.textContent = formatDateTime(record.timestamp);
    modalTitle.textContent = built.title;
    modalBody.innerHTML = built.bodyHtml;
    modalPlainTextResult = built.plainText;

    modalCelebrationPill.hidden = !isCelebration;
    if (isCelebration) {
      if (record.mode === 'undian') {
        celebrationSubtext.textContent = 'Selamat kepada peserta yang terpilih pada undian ini!';
      } else if (record.mode === 'kelompok') {
        celebrationSubtext.textContent = `Berhasil membentuk ${record.groupCount} kelompok secara acak dan merata!`;
      } else {
        celebrationSubtext.textContent = `Urutan ${record.totalParticipants} peserta telah selesai diacak!`;
      }
    } else {
      celebrationSubtext.textContent = 'Rincian hasil putaran yang tersimpan di riwayat perangkat.';
    }

    if (!historyModal.open) {
      historyModal.showModal();
    }

    if (isCelebration && confettiCanvas) {
      requestAnimationFrame(() => {
        launchConfetti(confettiCanvas);
      });
    }
  }

  function renderHistory(): void {
    const allRecords = getHistoryRecords();
    clearHistoryBtn.hidden = allRecords.length === 0;
    historyCountText.textContent = `${allRecords.length} riwayat tersimpan di LocalStorage`;

    const filtered =
      activeHistoryFilter === 'all'
        ? allRecords
        : allRecords.filter((item) => item.mode === activeHistoryFilter);

    if (filtered.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          Belum ada riwayat putaran${activeHistoryFilter !== 'all' ? ' untuk kategori ini' : ''}. Hasil putaran akan otomatis tersimpan di sini.
        </div>
      `;
      return;
    }

    historyList.innerHTML = filtered
      .map((item) => {
        let badgeLabel = 'Undian';
        let badgeClass = 'undian';
        let summaryHtml = '';
        let previewText = '';

        if (item.mode === 'undian') {
          badgeLabel = 'Undian';
          badgeClass = 'undian';
          summaryHtml = `Terpilih: <strong>${escapeHtml(item.winner || '-')}</strong>`;
          previewText = `Dari total ${item.totalParticipants} nama dalam daftar.`;
        } else if (item.mode === 'kelompok') {
          badgeLabel = `${item.groupCount || item.groups?.length || 0} Kelompok`;
          badgeClass = 'kelompok';
          summaryHtml = `Pembagian <strong>${item.totalParticipants} nama</strong> ke ${item.groupCount || item.groups?.length || 0} kelompok`;
          previewText = (item.groups || [])
            .map((g, i) => `K${i + 1}: ${g.join(', ')}`)
            .join(' · ');
        } else {
          badgeLabel = 'Urutan Nama';
          badgeClass = 'urutan';
          summaryHtml = `Urutan acak <strong>${item.totalParticipants} nama</strong>`;
          previewText = (item.sequence || [])
            .map((n, i) => `${i + 1}. ${n}`)
            .join(', ');
        }

        return `
          <article class="history-card" data-id="${escapeHtml(item.id)}">
            <div>
              <div class="history-card-top">
                <span class="history-badge ${badgeClass}">★ ${badgeLabel}</span>
                <time class="history-time">${formatDateTime(item.timestamp)}</time>
              </div>
              <p class="history-summary">${summaryHtml}</p>
              <p class="history-preview-list">${escapeHtml(previewText)}</p>
            </div>
            <div class="history-card-actions">
              <button type="button" class="history-btn-view" data-action="view" data-id="${escapeHtml(item.id)}">
                Lihat Detail Hasil
              </button>
              <button type="button" class="history-btn-delete" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Hapus item riwayat">
                Hapus
              </button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function finalizeSpinResult(names: string[], pickedIndex: number): void {
    const timestamp = new Date().toISOString();
    const id = 'rtk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    if (currentMode === 'undian') {
      const winner = names[pickedIndex];
      const record: HistoryRecord = {
        id,
        mode: 'undian',
        timestamp,
        totalParticipants: names.length,
        winner,
      };

      renderResultToStage(record);
      saveHistoryRecord(record);
      renderHistory();
      playWinFanfare(soundEnabled);
      openDetailModal(record, true);

      if (removePickedCheckbox.checked) {
        const remaining = names.filter((_, idx) => idx !== pickedIndex);
        namesInput.value = remaining.join('\n');
        saveNames(namesInput.value);
      }
      updateNamesUI();
    } else if (currentMode === 'kelompok') {
      const numGroups = Math.min(names.length, Math.max(2, parseInt(groupCountInput.value, 10) || 2));
      const shuffled = shuffleArray(names);
      const groups: string[][] = Array.from({ length: numGroups }, () => []);

      shuffled.forEach((person, idx) => {
        groups[idx % numGroups].push(person);
      });

      const record: HistoryRecord = {
        id,
        mode: 'kelompok',
        timestamp,
        totalParticipants: names.length,
        groupCount: numGroups,
        groups,
      };

      renderResultToStage(record);
      saveHistoryRecord(record);
      renderHistory();
      playWinFanfare(soundEnabled);
      openDetailModal(record, true);
    } else if (currentMode === 'urutan') {
      const sequence = shuffleArray(names);
      const record: HistoryRecord = {
        id,
        mode: 'urutan',
        timestamp,
        totalParticipants: names.length,
        sequence,
      };

      renderResultToStage(record);
      saveHistoryRecord(record);
      renderHistory();
      playWinFanfare(soundEnabled);
      openDetailModal(record, true);
    }
  }

  function spinWheel(): void {
    const names = getCleanNames();
    if (names.length === 0 || isSpinning) return;

    if (currentMode === 'kelompok') {
      const requestedGroups = Math.max(2, parseInt(groupCountInput.value, 10) || 2);
      if (names.length < requestedGroups) {
        alert(
          `Jumlah nama (${names.length}) kurang dari jumlah kelompok (${requestedGroups}). Tambahkan nama atau kurangi jumlah kelompok.`
        );
        return;
      }
    }

    isSpinning = true;
    hasSpunOnce = true;
    stopRequested = false;
    updateNamesUI();

    const total = names.length;
    const arcSize = (Math.PI * 2) / total;
    const targetIndex = Math.floor(Math.random() * total);

    // Jarum penunjuk berada tepat di TENGAH ATAS (12 o'clock = sudut 3*PI/2 radian)
    const pointerAngle = (Math.PI * 3) / 2;
    const desiredFinalMod =
      ((pointerAngle - (targetIndex * arcSize + arcSize / 2)) % (Math.PI * 2) + Math.PI * 2) %
      (Math.PI * 2);
    const currentMod = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let deltaAngle = desiredFinalMod - currentMod;
    if (deltaAngle < 0) deltaAngle += Math.PI * 2;

    const extraSpins = (5 + Math.floor(Math.random() * 3)) * Math.PI * 2;
    // Berhenti tepat di tengah-tengah juring (center of slice) di bawah pointer SVG
    const totalRotation = extraSpins + deltaAngle;

    const startAngle = currentAngle;
    let duration = 3500;
    let startTime = performance.now();
    let lastTickSlice = -1;

    function animate(now: number) {
      if (stopRequested) {
        stopRequested = false;
        const elapsedSoFar = now - startTime;
        const currentProg = Math.min(elapsedSoFar / duration, 0.92);
        duration = 550;
        startTime = now - currentProg * duration;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);

      currentAngle = startAngle + totalRotation * eased;
      drawWheelCanvas(wheelCanvas, names, currentAngle);

      const normalized =
        (((pointerAngle - currentAngle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const currentSlice = Math.floor(normalized / arcSize) % total;
      if (currentSlice !== lastTickSlice && progress < 0.98) {
        lastTickSlice = currentSlice;
        playTickSound(soundEnabled);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        finalizeSpinResult(names, targetIndex);
        updateNamesUI();
      }
    }

    requestAnimationFrame(animate);
  }

  // Event Listeners
  namesInput.addEventListener('input', () => {
    saveNames(namesInput.value);
    updateNamesUI();
  });

  sampleNamesBtn.addEventListener('click', () => {
    namesInput.value = DEFAULT_SAMPLE_NAMES.join('\n');
    saveNames(namesInput.value);
    updateNamesUI();
  });

  clearNamesBtn.addEventListener('click', () => {
    namesInput.value = '';
    saveNames('');
    updateNamesUI();
  });

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selected = tab.getAttribute('data-mode') as SpinMode;
      if (!selected) return;
      currentMode = selected;

      modeTabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });

      if (currentMode === 'undian') {
        modeDescription.textContent = 'Memilih 1 nama secara acak dari daftar peserta';
        groupConfigBox.hidden = true;
        undianConfigBox.hidden = false;
        urutanConfigBox.hidden = true;
      } else if (currentMode === 'kelompok') {
        modeDescription.textContent = 'Membagi peserta secara acak & merata ke dalam kelompok';
        groupConfigBox.hidden = false;
        undianConfigBox.hidden = true;
        urutanConfigBox.hidden = true;
      } else {
        modeDescription.textContent = 'Mengacak urutan seluruh nama dari nomor 1 hingga akhir';
        groupConfigBox.hidden = true;
        undianConfigBox.hidden = true;
        urutanConfigBox.hidden = false;
      }
    });
  });

  decGroupBtn.addEventListener('click', () => {
    const val = Math.max(2, (parseInt(groupCountInput.value, 10) || 2) - 1);
    groupCountInput.value = String(val);
  });

  incGroupBtn.addEventListener('click', () => {
    const val = Math.min(50, (parseInt(groupCountInput.value, 10) || 2) + 1);
    groupCountInput.value = String(val);
  });

  centerSpinBtn.addEventListener('click', spinWheel);

  copyResultBtn.addEventListener('click', async () => {
    if (!lastPlainTextResult) return;
    try {
      await navigator.clipboard.writeText(lastPlainTextResult);
      const original = copyResultBtn.textContent;
      copyResultBtn.textContent = 'Tersalin';
      setTimeout(() => {
        copyResultBtn.textContent = original;
      }, 1600);
    } catch {
      // Abaikan jika gagal menyalin
    }
  });

  modalCopyBtn.addEventListener('click', async () => {
    if (!modalPlainTextResult) return;
    try {
      await navigator.clipboard.writeText(modalPlainTextResult);
      const original = modalCopyBtn.textContent;
      modalCopyBtn.textContent = 'Tersalin';
      setTimeout(() => {
        modalCopyBtn.textContent = original;
      }, 1600);
    } catch {
      // Abaikan jika gagal menyalin
    }
  });

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    saveSoundPreference(soundEnabled);
    updateSoundUI();
  });

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.getAttribute('data-filter') as 'all' | SpinMode;
      if (!filter) return;
      activeHistoryFilter = filter;
      filterChips.forEach((c) => c.classList.toggle('active', c === chip));
      renderHistory();
    });
  });

  historyList.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const id = target.getAttribute('data-id');
    if (!id) return;

    if (action === 'delete') {
      deleteHistoryRecord(id);
      renderHistory();
    } else if (action === 'view') {
      const record = getHistoryRecords().find((r) => r.id === id);
      if (record) {
        openDetailModal(record);
      }
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Hapus seluruh riwayat putaran yang tersimpan di perangkat ini?')) {
      clearAllHistory();
      renderHistory();
    }
  });

  // Fallback light-dismiss bagi browser tanpa dukungan atribut closedby="any"
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    historyModal.addEventListener('click', (event) => {
      if (event.target !== historyModal) return;
      const rect = historyModal.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (isDialogContent) return;
      historyModal.close();
    });
  }

  // Muat data awal dari localStorage
  namesInput.value = loadSavedNames();
  soundEnabled = loadSoundPreference();
  updateSoundUI();
  updateNamesUI();
  renderHistory();
}
