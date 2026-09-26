/**
 * Шаг 6 комнаты: только иконки коллекций ручек (как в референсе).
 * Правила размещения — в админке коллекции («Правила по ролям»).
 */

import {
  getStep6HandleSeriesList,
  getRoomStep6HandleSelection,
  setRoomStep6HandleSelection,
  seriesSlug,
} from '../handle-series-catalog.js?v=20260621-step6-default';

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function handleKindVisual(kind) {
  const k = String(kind || '').toLowerCase();
  if (k === 'push') {
    return (
      '<div class="step6-handle-visual step6-handle-visual--push" aria-hidden="true">' +
      '<i class="fas fa-hand-pointer"></i>' +
      '</div>'
    );
  }
  if (k === 'bar') {
    return (
      '<div class="step6-handle-visual step6-handle-visual--bar" aria-hidden="true">' +
      '<span class="step6-handle-bar"></span>' +
      '</div>'
    );
  }
  if (k === 'loop') {
    return (
      '<div class="step6-handle-visual step6-handle-visual--loop" aria-hidden="true">' +
      '<svg viewBox="0 0 48 64" width="48" height="64"><path d="M8 8 C8 8 40 8 40 32 C40 48 24 56 24 56 C24 56 8 48 8 32 Z" fill="none" stroke="#333" stroke-width="3"/></svg>' +
      '</div>'
    );
  }
  return (
    '<div class="step6-handle-visual step6-handle-visual--knob" aria-hidden="true">' +
    '<span class="step6-handle-knob"></span>' +
    '</div>'
  );
}

function resolveCardImage(series) {
  const icon = String(series?.icon || '').trim();
  if (icon && (/^https?:\/\//i.test(icon) || icon.charAt(0) === '/')) {
    return `<img src="${escapeHtml(icon)}" alt="" loading="lazy" onerror="this.style.display='none'">`;
  }
  return handleKindVisual(series?.kind);
}

function showHandlePreviewModal(series) {
  let overlay = document.getElementById('step6-handle-preview-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'step6-handle-preview-overlay';
  overlay.className = 'step6-handle-preview-overlay';

  const card = document.createElement('div');
  card.className = 'step6-handle-preview-card';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'step6-handle-preview-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => overlay.remove());

  const title = document.createElement('h3');
  title.textContent = series?.name || 'Ручка';

  const visual = document.createElement('div');
  visual.className = 'step6-handle-preview-visual';
  visual.innerHTML = resolveCardImage(series);

  card.appendChild(closeBtn);
  card.appendChild(title);
  card.appendChild(visual);
  overlay.appendChild(card);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

function buildFinishSwatches(host, series, selectedFinishId, onPick) {
  const finishes = Array.isArray(series.finishes) ? series.finishes : [];
  if (!finishes.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'step6-handle-finishes';
  finishes.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'step6-handle-finish';
    btn.dataset.finishId = String(f.id || '');
    btn.title = f.label || f.id || '';
    btn.style.background = f.color || '#ccc';
    if (String(f.id) === String(selectedFinishId)) {
      btn.classList.add('step6-handle-finish--active');
    }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onPick(f.id);
    });
    wrap.appendChild(btn);
  });
  host.appendChild(wrap);
}

export async function buildHandlesStep(container) {
  container.innerHTML = '';

  const cfgRaw = (() => {
    try {
      return JSON.parse(localStorage.getItem('room_steps_config') || 'null');
    } catch (_) {
      return null;
    }
  })();
  const step6Cfg = cfgRaw?.steps?.find((s) => s.stepId === 6);
  const hintText =
    (step6Cfg?.hintText && String(step6Cfg.hintText).trim()) ||
    'Выберите коллекцию ручек. Размер и положение на фасадах задаются в админке коллекции.';

  const wrapper = document.createElement('div');
  wrapper.className = 'step6-handles-panel';

  const hint = document.createElement('p');
  hint.className = 'step6-handles-hint';
  hint.textContent = hintText;
  wrapper.appendChild(hint);

  const grid = document.createElement('div');
  grid.className = 'step6-handles-grid';
  const cols = step6Cfg?.columnsPerRow === 1 ? 1 : 2;
  grid.dataset.cols = String(cols);
  wrapper.appendChild(grid);

  container.appendChild(wrapper);

  let seriesList = [];
  try {
    seriesList = await getStep6HandleSeriesList();
  } catch (e) {
    console.warn('[STEP6] load handles:', e);
  }

  if (!seriesList.length) {
    grid.innerHTML =
      '<div class="step6-handles-empty">Нет коллекций ручек. Добавьте коллекцию в админке → Ручки.</div>';
    return;
  }

  let selection = getRoomStep6HandleSelection();
  let selectedId = selection.seriesId || '';
  let selectedFinish = selection.finishId || null;

  const refreshFacadeHandles = () => {
    window.roomHandleSelection = getRoomStep6HandleSelection();
    try {
      if (typeof window.__cldRetryFacadeHandles === 'function') {
        window.__cldRetryFacadeHandles();
      }
    } catch (e) {
      console.warn('[STEP6] handle attach retry:', e);
    }
  };

  const applySelection = (seriesId, finishId) => {
    selectedId = String(seriesId);
    selectedFinish = finishId != null ? String(finishId) : null;
    selection = setRoomStep6HandleSelection(selectedId, selectedFinish, {
      modelId: null,
      handleItemId: null,
      roleSlots: {},
    });
    grid.querySelectorAll('.step6-handle-card').forEach((el) => {
      el.classList.toggle('selected', el.dataset.seriesId === selectedId);
    });
    grid.querySelectorAll('.step6-handle-card').forEach((card) => {
      const sid = card.dataset.seriesId;
      card.querySelectorAll('.step6-handle-finish').forEach((el) => {
        el.classList.toggle(
          'step6-handle-finish--active',
          sid === selectedId && el.dataset.finishId === String(selectedFinish || '')
        );
      });
    });
    refreshFacadeHandles();
  };

  seriesList.forEach((series) => {
    const sid = seriesSlug(series);
    const card = document.createElement('div');
    card.className = 'step6-handle-card';
    card.dataset.seriesId = sid;
    if (sid === selectedId) card.classList.add('selected');

    const zoomBtn = document.createElement('button');
    zoomBtn.type = 'button';
    zoomBtn.className = 'step6-handle-zoom';
    zoomBtn.title = 'Увеличить';
    zoomBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showHandlePreviewModal(series);
    });

    const visual = document.createElement('div');
    visual.className = 'step6-handle-card__visual';
    visual.innerHTML = resolveCardImage(series);

    const name = document.createElement('div');
    name.className = 'step6-handle-card__name';
    name.textContent = series.name || series.id;

    card.appendChild(zoomBtn);
    card.appendChild(visual);
    card.appendChild(name);

    buildFinishSwatches(card, series, selectedFinish, (finishId) => {
      applySelection(sid, finishId);
    });

    card.addEventListener('click', () => {
      const finishes = Array.isArray(series.finishes) ? series.finishes : [];
      const finish =
        finishes.length && sid === selectedId && selectedFinish
          ? selectedFinish
          : finishes.length
            ? finishes[0].id
            : null;
      applySelection(sid, finish);
    });

    grid.appendChild(card);
  });

  refreshFacadeHandles();
}
