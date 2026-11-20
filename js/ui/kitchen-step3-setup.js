/**
 * Общекухонные настройки (система / опоры) — контент вкладки «Система»
 * в панели «Управление кухней». Модуль — только через карандаш.
 */
import { isKitchenProductLineConfig } from '../room/kitchen-room-shapes.js?v=20261005-kitchen-plan2d';
/* cache: 20261030-kitchen-gs7 — dirty после apply глобальных настроек */

function km() {
  return typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
}

/** После успешного commit project state (+ scene apply). Не во время промежуточного rebuild. */
function markKitchenManageDraftDirty(reason) {
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty(reason || 'kitchen_manage');
    }
  } catch (_) {}
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function countKitchenBaseInScene() {
  const scene =
    window?.__CLD_STATE_SINGLETON__?.scene ||
    window?.state?.scene ||
    window?.appState?.scene;
  if (!scene) return 0;
  let n = 0;
  scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    // Только НМ (не пенал/НШ) — как isKitchenNmCarcassGroup.
    try {
      if (typeof window.__cldIsKitchenNmCarcassGroup === 'function') {
        if (window.__cldIsKitchenNmCarcassGroup(obj)) n += 1;
        return;
      }
    } catch (_) {}
    const ud = obj.userData || {};
    const pk = String(
      ud.__placementKindProfileId || ud.__kitchenProfileId || ud.placementKind || ''
    )
      .trim()
      .toLowerCase();
    if (/tall|wall_mid|wall_top|wall_hung/.test(pk)) return;
    if (
      pk === 'kitchen_base' ||
      pk === 'kitchen_base_gola' ||
      pk === 'kitchen_base_corner' ||
      Number(ud.__kitchenCarcassHeightMm) > 0 ||
      String(ud.productKind || '') === 'kitchen_base'
    ) {
      n += 1;
    }
  });
  return n;
}

function toast(msg, kind) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg, kind || 'info');
  } else if (window.toastr) {
    const fn = kind === 'warning' ? 'warning' : kind === 'error' ? 'error' : 'info';
    (window.toastr[fn] || window.toastr.info)(msg);
  } else {
    console.log('[KITCHEN-MANAGE]', msg);
  }
}

function refreshInfo(root) {
  const api = km();
  if (!api || !root) return;
  const infoEl = root.querySelector('[data-kitchen-stack-info]');
  if (!infoEl) return;
  const info =
    typeof api.getStep3KitchenStackInfo === 'function' ? api.getStep3KitchenStackInfo() : null;
  if (!info) {
    infoEl.textContent = '';
    return;
  }
  const sys = info.frontMode === 'gola' ? 'Gola' : 'Обычная кухня';
  const mid =
    typeof api.resolveNmBandMidMm === 'function' ? api.resolveNmBandMidMm({}) : 600;
  infoEl.innerHTML =
    `<span class="kitchen-step3-info__label">Нижний модуль без столешницы</span>` +
    `<span class="kitchen-step3-info__value">${escapeHtml(sys)} · корпус ${info.carcassHeightMm} + опоры ${info.plinthHeightMm} = <strong>${info.totalHeightMm} мм</strong> · до НШ1 = ${mid} мм</span>`;
}

function reloadKitchenBaseCatalogGrid() {
  try {
    if (typeof window.loadSavedModels === 'function') {
      const grid =
        document.getElementById('step3-cabinets-grid') ||
        document.getElementById('cabinets-grid') ||
        document.querySelector('[data-cabinets-grid]');
      const folder =
        window.__cldCurrentCatalogFolderId ||
        window.__cldStep3CatalogFolderId ||
        null;
      if (grid) {
        const p = window.loadSavedModels(folder, grid, window.__cldStep3PillFilter || []);
        if (p && typeof p.then === 'function') p.catch(() => {});
        return;
      }
    }
    if (typeof window.__cldReloadStep3Catalog === 'function') {
      window.__cldReloadStep3Catalog();
    }
  } catch (e) {
    console.warn('[KITCHEN-MANAGE] reload catalog failed', e);
  }
}

export function syncKitchenProjectControlsUi(root) {
  const api = km();
  if (!api || !root) return;
  const st = api.getKitchenProjectState();

  root.querySelectorAll('[data-kitchen-system]').forEach((card) => {
    const mode = card.getAttribute('data-kitchen-system');
    card.classList.remove('is-disabled');
    card.classList.toggle('selected', st.frontMode === mode);
    card.setAttribute('aria-disabled', 'false');
    const badge = card.querySelector('[data-gola-badge]');
    if (badge) {
      badge.hidden = true;
      badge.remove();
    }
  });

  root.querySelectorAll('[data-kitchen-plinth]').forEach((btn) => {
    const mm = Number(btn.getAttribute('data-kitchen-plinth'));
    btn.classList.toggle('selected', mm === Number(st.plinthHeightMm));
  });

  const projectD = Math.round(Number(st.baseCarcassDepthMm) || 550);
  root.querySelectorAll('[data-kitchen-base-depth]').forEach((btn) => {
    const mm = Number(btn.getAttribute('data-kitchen-base-depth'));
    btn.classList.toggle('selected', mm === projectD);
  });

  const midSpec =
    typeof api.getKitchenRhythmBandMidSpec === 'function'
      ? api.getKitchenRhythmBandMidSpec()
      : { default: 600, min: 560, max: 650 };
  const midInput = root.querySelector('[data-kitchen-band-mid]');
  const midHint = root.querySelector('[data-kitchen-band-mid-hint]');
  if (midInput) {
    midInput.min = String(midSpec.min);
    midInput.max = String(midSpec.max);
    midInput.placeholder = String(midSpec.default);
    const curMid =
      st.bandMidMm != null && Number(st.bandMidMm) > 0
        ? Number(st.bandMidMm)
        : midSpec.default;
    if (document.activeElement !== midInput) {
      midInput.value = String(curMid);
    }
  }
  if (midHint) {
    midHint.textContent = `default ${midSpec.default} · допуск ${midSpec.min}–${midSpec.max} мм`;
  }

  refreshInfo(root);
}

function applyFrontMode(root, mode) {
  const api = km();
  if (!api) return;
  if (mode !== 'gola' && mode !== 'non_gola') return;
  const cur = api.getKitchenProjectState();
  if (cur.frontMode === mode) {
    syncKitchenProjectControlsUi(root);
    return;
  }

  api.setKitchenProjectState({ frontMode: mode });
  syncKitchenProjectControlsUi(root);
  reloadKitchenBaseCatalogGrid();

  const applyFn =
    typeof window.__clodisApplyProjectFrontModeToKitchenBases === 'function'
      ? window.__clodisApplyProjectFrontModeToKitchenBases
      : null;
  if (applyFn) {
    try {
      applyFn(mode);
    } catch (e) {
      console.warn('[KITCHEN-MANAGE] frontMode apply failed', e);
    }
  }

  markKitchenManageDraftDirty('kitchen_front');
  toast(
    mode === 'gola'
      ? 'Gola: модули kitchen_base_gola (780). Пенал/навесы — от высоты стоящих НМ.'
      : 'Обычная кухня: НМ 720, зазор до 1 яруса 600, пенал 2040.',
    'info',
  );
}

function applyBandMid(root, rawVal) {
  const api = km();
  if (!api) return;
  const spec =
    typeof api.getKitchenRhythmBandMidSpec === 'function'
      ? api.getKitchenRhythmBandMidSpec()
      : { default: 600, min: 560, max: 650 };
  let next = null;
  if (rawVal === '' || rawVal == null) {
    next = null;
  } else {
    const n = Math.round(Number(String(rawVal).replace(',', '.')) || 0);
    if (!(n > 0)) {
      toast(`Зазор: введите число ${spec.min}–${spec.max} мм (пусто = ${spec.default}).`, 'warning');
      syncKitchenProjectControlsUi(root);
      return;
    }
    next =
      typeof api.clampBandMidMm === 'function' ? api.clampBandMidMm(n) : n;
    if (next !== n) {
      toast(`Зазор ограничен вилкой ${spec.min}–${spec.max} мм → ${next}.`, 'warning');
    }
  }
  api.setKitchenProjectState({ bandMidMm: next });
  syncKitchenProjectControlsUi(root);
  const rhythmFn =
    typeof window.__clodisApplyKitchenBandLowRhythmToModules === 'function'
      ? window.__clodisApplyKitchenBandLowRhythmToModules
      : null;
  let updated = 0;
  if (rhythmFn) {
    try {
      const r = rhythmFn();
      updated = Number(r?.updated) || 0;
    } catch (e) {
      console.warn('[KITCHEN-MANAGE] bandMid rhythm failed', e);
    }
  }
  markKitchenManageDraftDirty('kitchen_band_mid');
  const mid =
    typeof api.resolveNmBandMidMm === 'function' ? api.resolveNmBandMidMm({}) : spec.default;
  toast(
    `Зазор НМ→НШ1: ${mid} мм` + (updated > 0 ? `. Пересчитано модулей: ${updated}.` : '.'),
    'info',
  );
}

/** Пресет глубины низов: project + rebuild стоящих НМ + enforce переда ряда. */
function applyBaseCarcassDepth(root, mm) {
  const api = km();
  if (!api || typeof api.setProjectBaseCarcassDepthMm !== 'function') return;
  const want = Math.round(Number(mm) || 0);
  if (![460, 510, 550].includes(want)) {
    toast('Глубина низов: 460 / 510 / 550 мм.', 'warning');
    return;
  }
  const worktop =
    typeof api.getProjectWorktopDepthMm === 'function' ? api.getProjectWorktopDepthMm() : 600;
  if (typeof api.resolveBaseCarcassDepthMm === 'function') {
    const d = api.resolveBaseCarcassDepthMm({
      worktopDepthMm: worktop,
      preferredCarcassDepthMm: want,
    });
    if (!d?.ok) {
      toast(d?.message || `Глубина ${want} мм не подходит под столешницу ${worktop} мм.`, 'warning');
      syncKitchenProjectControlsUi(root);
      return;
    }
    if (Math.round(Number(d.carcassDepthMm)) !== want) {
      toast(
        `Для столешницы ${worktop} мм корпус будет ${Math.round(d.carcassDepthMm)} мм (запрошено ${want}).`,
        'warning',
      );
    }
  }
  const got = Math.round(Number(api.setProjectBaseCarcassDepthMm(want)) || 0);
  syncKitchenProjectControlsUi(root);

  // Как опоры: сначала __clodisApply* из furniture-manager (там deps bound).
  // window.__cldKitchenBaseEngine может быть другая копия модуля без bind.
  const applyFn =
    typeof window.__clodisApplyProjectDepthToKitchenBases === 'function'
      ? window.__clodisApplyProjectDepthToKitchenBases
      : typeof window.__cldKitchenBaseEngine?.applyProjectDepthToScene === 'function'
        ? window.__cldKitchenBaseEngine.applyProjectDepthToScene.bind(
            window.__cldKitchenBaseEngine
          )
        : null;

  if (!applyFn) {
    markKitchenManageDraftDirty('kitchen_base_depth');
    toast(
      `Глубина низов: ${got || want} мм. Стоящие не обновлены — нет applyProjectDepthToScene.`,
      'warning',
    );
    return;
  }

  let result;
  try {
    // Всегда гоняем engine: сам найдёт НМ в сцене (не зависим от count).
    result = applyFn(undefined, got || want);
  } catch (e) {
    console.warn('[KITCHEN-MANAGE] depth apply failed', e);
    markKitchenManageDraftDirty('kitchen_base_depth');
    toast('Не удалось обновить глубину у установленных модулей.', 'warning');
    return;
  }
  try {
    if (typeof window.__cldKitchenEnforceDepthAll === 'function') {
      window.__cldKitchenEnforceDepthAll();
    }
  } catch (_) {}
  try {
    if (typeof window.__cldEnsureCellVolumesAfterNmPlace === 'function') {
      window.__cldEnsureCellVolumesAfterNmPlace();
    } else if (typeof window.__cldSyncCellVolumeMeshes === 'function') {
      window.__cldSyncCellVolumeMeshes();
    }
  } catch (_) {}

  markKitchenManageDraftDirty('kitchen_base_depth');
  const placed = countKitchenBaseInScene();
  if (result && result.ok) {
    toast(
      `Глубина низов: ${result.carcassDepthMm || got || want} мм. Обновлено модулей: ${result.updated || 0}.` +
        (placed <= 0 && !(result.updated > 0) ? ' (в сцене НМ не найдено)' : ''),
      'info',
    );
  } else {
    toast(
      (result && result.message) ||
        `Глубина ${got || want} мм в проекте, но часть модулей не перестроена.`,
      'warning',
    );
  }
  // Подписи фас./прист./отст. — сразу после смены глубины кухни.
  try {
    if (typeof window.scheduleRebuildAllDimensionLines === 'function') {
      window.scheduleRebuildAllDimensionLines();
    } else if (typeof window.rebuildAllDimensionLines === 'function') {
      window.rebuildAllDimensionLines();
    }
  } catch (_) {}
}

async function applyPlinth(root, mm) {
  const api = km();
  if (!api) return;
  const plinth = api.snapSupportHeightMm(mm);
  const cur = api.getKitchenProjectState();
  const sameAsProject = Number(cur.plinthHeightMm) === plinth;

  api.setProjectPlinthHeightMm(plinth);
  const verified = Number(api.getProjectPlinthHeightMm());
  if (verified !== plinth) {
    console.warn('[KITCHEN-MANAGE] plinth not persisted', { want: plinth, got: verified });
    return;
  }
  syncKitchenProjectControlsUi(root);

  const placed = countKitchenBaseInScene();
  if (placed <= 0) {
    markKitchenManageDraftDirty('kitchen_plinth');
    toast(`Высота опор: ${plinth} мм (для всей кухни).`, 'info');
    return;
  }

  const applyFn =
    typeof window.__clodisApplyProjectPlinthToKitchenBases === 'function'
      ? window.__clodisApplyProjectPlinthToKitchenBases
      : null;
  if (!applyFn) {
    markKitchenManageDraftDirty('kitchen_plinth');
    toast(
      `Опоры ${plinth} мм сохранены. Уже стоящие модули не обновлены — поставьте модуль заново.`,
      'warning',
    );
    return;
  }

  let result;
  try {
    result = applyFn(plinth);
  } catch (e) {
    console.warn('[KITCHEN-MANAGE] plinth apply failed', e);
    markKitchenManageDraftDirty('kitchen_plinth');
    toast('Не удалось обновить опоры у установленных модулей.', 'warning');
    return;
  }

  try {
    if (typeof window.__cldKitchenEnforceDepthAll === 'function') {
      window.__cldKitchenEnforceDepthAll();
    }
  } catch (_) {}

  markKitchenManageDraftDirty('kitchen_plinth');
  if (result && result.ok) {
    if (!sameAsProject || result.updated > 0) {
      toast(`Опоры ${plinth} мм. Обновлено модулей: ${result.updated || 0}.`, 'info');
    }
  } else {
    toast(
      (result && result.message) ||
        `Опоры ${plinth} мм в проекте, но модули на сцене не перестроены. Поставьте стол заново.`,
      'warning',
    );
  }
}

/**
 * Смонтировать блок «система + опоры» в host (вкладка панели).
 * @returns {HTMLElement|null}
 */
export function mountKitchenProjectControls(container, roomStepsConfig) {
  if (!container) return null;
  if (!isKitchenProductLineConfig(roomStepsConfig || null)) return null;
  const api = km();
  if (!api) return null;

  try {
    const st = api.getKitchenProjectState();
    if (!(Number(st.plinthHeightMm) > 0)) {
      api.setProjectPlinthHeightMm(100);
    } else {
      api.setKitchenProjectState(st);
    }
  } catch (_) {}

  const existing = container.querySelector('.kitchen-step3-setup');
  if (existing) {
    // Старый DOM мог содержать бейдж «Скоро» — пересобрать.
    existing.remove();
  }

  const stdImg = '/images/catalog/category-cabinet.svg';
  const golaImg = '/images/catalog/category-dresser.svg';

  const root = document.createElement('div');
  root.className = 'kitchen-step3-setup';
  root.innerHTML =
    `<div class="kitchen-step3-systems" role="group" aria-label="Система кухни">` +
    `<button type="button" class="kitchen-step3-system-card" data-kitchen-system="non_gola">` +
    `<span class="kitchen-step3-system-card__preview"><img src="${stdImg}" alt="" onerror="this.style.display='none'"></span>` +
    `<span class="kitchen-step3-system-card__body">` +
    `<span class="kitchen-step3-system-card__name">Обычная кухня</span>` +
    `<span class="kitchen-step3-system-card__meta">720 + опоры · до НШ1 = 600</span>` +
    `</span>` +
    `<span class="catalog-category-selected-indicator" aria-hidden="true"></span>` +
    `</button>` +
    `<button type="button" class="kitchen-step3-system-card" data-kitchen-system="gola">` +
    `<span class="kitchen-step3-system-card__preview"><img src="${golaImg}" alt="" onerror="this.style.display='none'"></span>` +
    `<span class="kitchen-step3-system-card__body">` +
    `<span class="kitchen-step3-system-card__name">Профиль Gola</span>` +
    `<span class="kitchen-step3-system-card__meta">780 + опоры · до НШ1 = 600</span>` +
    `</span>` +
    `<span class="catalog-category-selected-indicator" aria-hidden="true"></span>` +
    `</button>` +
    `</div>` +
    `<div class="kitchen-step3-plinth">` +
    `<div class="kitchen-step3-plinth__label">Высота опор</div>` +
    `<div class="kitchen-step3-plinth__btns" role="group" aria-label="Высота опор">` +
    `<button type="button" class="kitchen-step3-plinth-btn" data-kitchen-plinth="100">100 мм</button>` +
    `<button type="button" class="kitchen-step3-plinth-btn" data-kitchen-plinth="120">120 мм</button>` +
    `<button type="button" class="kitchen-step3-plinth-btn" data-kitchen-plinth="150">150 мм</button>` +
    `</div>` +
    `</div>` +
    `<div class="kitchen-step3-plinth">` +
    `<div class="kitchen-step3-plinth__label">Глубина низов (корпус)</div>` +
    `<div class="kitchen-step3-plinth__btns" role="group" aria-label="Глубина низов">` +
    `<button type="button" class="kitchen-step3-plinth-btn" data-kitchen-base-depth="460">460 мм</button>` +
    `<button type="button" class="kitchen-step3-plinth-btn" data-kitchen-base-depth="510">510 мм</button>` +
    `<button type="button" class="kitchen-step3-plinth-btn" data-kitchen-base-depth="550">550 мм</button>` +
    `</div>` +
    `<div class="text-muted" style="font-size:12px;margin-top:6px;">На всю кухню: новые и уже стоящие НМ (как высота опор).</div>` +
    `</div>` +
    `<div class="kitchen-step3-plinth">` +
    `<div class="kitchen-step3-plinth__label">Зазор НМ → НШ1</div>` +
    `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">` +
    `<input type="number" class="kitchen-step3-band-mid" data-kitchen-band-mid min="560" max="650" step="1" style="width:88px;" />` +
    `<span class="text-muted" style="font-size:12px;" data-kitchen-band-mid-hint></span>` +
    `</div>` +
    `</div>` +
    `<div class="kitchen-step3-info" data-kitchen-stack-info></div>`;

  root.querySelectorAll('[data-kitchen-system]').forEach((card) => {
    card.addEventListener('click', () => {
      applyFrontMode(root, card.getAttribute('data-kitchen-system'));
    });
  });
  root.querySelectorAll('[data-kitchen-plinth]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyPlinth(root, Number(btn.getAttribute('data-kitchen-plinth')));
    });
  });
  root.querySelectorAll('[data-kitchen-base-depth]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyBaseCarcassDepth(root, Number(btn.getAttribute('data-kitchen-base-depth')));
    });
  });
  const midInput = root.querySelector('[data-kitchen-band-mid]');
  if (midInput && !midInput._bandMidBound) {
    midInput._bandMidBound = true;
    const commit = () => applyBandMid(root, midInput.value);
    midInput.addEventListener('change', commit);
    midInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      }
    });
  }

  syncKitchenProjectControlsUi(root);
  container.appendChild(root);

  // Разовый фикс: пенал 2100 при НМ 720 → пересчитать 720+600+720.
  try {
    if (!window.__cldKitchenBandLowRhythmAutofixed) {
      const fix = window.__clodisApplyKitchenBandLowRhythmToModules;
      if (typeof fix === 'function') {
        const r = fix();
        if (r && Number(r.updated) > 0) {
          window.__cldKitchenBandLowRhythmAutofixed = true;
          console.log('[KITCHEN-MANAGE] bandLow rhythm autofix', r);
        }
      }
    }
  } catch (_) {}

  return root;
}

/**
 * @deprecated блок ушёл из сайдбара шага 3 → панель «Управление кухней».
 */
export function mountKitchenStep3Setup(_container, _roomStepsConfig) {
  return null;
}

/** Каталог НМ: ordinary = kitchen_base (720); Gola = kitchen_base_gola (780). */
export function kitchenStep3MatchesItemPlacement(item) {
  if (!item) return true;
  const pk = String(
    item.placementKind ||
      item.placement_kind ||
      item.data?.placementKind ||
      item.data?.placement_kind ||
      ''
  ).trim();
  if (pk !== 'kitchen_base' && pk !== 'kitchen_base_gola') return true;
  let mode = 'non_gola';
  try {
    const api = km();
    mode =
      api && typeof api.getKitchenProjectState === 'function'
        ? api.getKitchenProjectState()?.frontMode || 'non_gola'
        : 'non_gola';
  } catch (_) {}
  if (mode === 'gola') return pk === 'kitchen_base_gola';
  return pk === 'kitchen_base';
}
