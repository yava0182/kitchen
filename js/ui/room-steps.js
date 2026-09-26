// Room steps (wizard) UI module - extracted from legacy main.js

import { buildRoomTypeStep as legacyBuildRoomTypeStep } from '../room/room-manager.js?v=20260923-cohabit42';
import { buildRoomLayoutStep as legacyBuildRoomLayoutStep } from '../room/room-manager.js?v=20260923-cohabit42';
import {
  loadSavedModels,
  refreshFurnitureDecors,
  initStep5DefaultDecorsFromRoomConfig,
  ensureConstructorCatalogFresh,
  rebuildAllRoomFurnitureForStep4Toggles,
} from '../furniture/furniture-manager.js?v=20260925-corner44y';
import { getEndCabinetRule } from '../sections/section-end-cabinet.js?v=20260917-endcab-nobridge';
import { refreshFurnitureCatalogNameLabels, clearFurnitureCatalogNameLabels } from './scene-icons.js?v=20260921-whh1';
import { initColorWheel } from './color-wheel.js?v=20260913-step5-oom';
import { mergeRoomStepsConfigPreservingLocal, writeRoomStepsConfig } from '../sections/trim-part-registry.js?v=20260902-room-edit-p1';
import { initStep6DefaultHandlesFromRoomConfig } from '../handle-series-catalog.js?v=20260621-step6-default';
import { buildHandlesStep } from './room-step6-handles.js?v=20260622-handles-ref-fix';
import {
  buildLifestyleStep,
  syncRoomLifestyleVisibility,
  syncRoomLifestyleForStep,
  installRoomLifestyleStepApi,
} from './room-step7-lifestyle.js?v=20260913-hang-lite';
import {
  buildStep5FurnitureIcons,
  clearStep5FurnitureIcons,
  deselectAllStep5Furniture,
  setStep5SectionZonesVisible,
  setStep5CabinetMarkersVisible,
  buildStep4SectionEditIcons,
  clearStep4SectionEditIcons,
  syncAllDimsButtonVisibility,
} from './scene-icons.js';

// In the refactored version we re-use the implementations we'll place into room-manager,
// and keep this file focused on wiring steps, buttons and navigation.

export function getRoomStepsConfig() {
  try {
    const raw = localStorage.getItem('room_steps_config');
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.steps && c.steps.length) {
        ensureLifestyleStep7InConfig(c);
        return c;
      }
    }
  } catch (e) {}
  return null;
}

/**  7   lifestyle;   . */
function ensureLifestyleStep7InConfig(config) {
  if (!config || !Array.isArray(config.steps)) return config;
  const has7 = config.steps.some((s) => Number(s?.stepId) === 7);
  if (has7) return config;
  config.steps.push({
    stepId: 7,
    title: '',
    items: [],
    columnsPerRow: 2,
    price_subline: {
      show_price_subline: false,
      price_subline_text: '',
      show_price_subline_help_icon: false,
      price_subline_help_text: '',
    },
    hintText: '',
  });
  return config;
}

/** Подтянуть room_steps_config с сервера (админка «Управление комнатой 2»). */
export async function hydrateRoomStepsConfigFromServer() {
  //    :8010     API-.
  //       ,    404  .
  try {
    if (
      typeof window !== 'undefined' &&
      window.location &&
      String(window.location.hostname || '').toLowerCase() === 'localhost' &&
      String(window.location.port || '') === '8010'
    ) {
      return false;
    }
  } catch (_) {}
  const pillApi =
    typeof window !== 'undefined' ? window.ClodisRoomStep4PillSets : null;
  let local = null;
  try {
    const raw = localStorage.getItem('room_steps_config');
    if (raw) local = JSON.parse(raw);
  } catch (_) {}
  try {
    const res = await fetch('/api/room_steps_config?ts=' + Date.now(), {
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || !Array.isArray(data.steps) || data.steps.length === 0) {
      return false;
    }
    const localPills =
      pillApi && local ? pillApi.countStep4PillsInConfig(local) : 0;
    const serverPills = pillApi ? pillApi.countStep4PillsInConfig(data) : 0;
    if (localPills > serverPills) {
      console.warn(
        '[room-steps] localStorage pillSets (' +
          localPills +
          ') >  (' +
          serverPills +
          ')   '
      );
      return false;
    }
    const merged = mergeRoomStepsConfigPreservingLocal(data, local);
    ensureLifestyleStep7InConfig(merged);
    writeRoomStepsConfig(merged);
    return true;
  } catch (e) {
    console.warn('[room-steps] hydrateRoomStepsConfigFromServer:', e);
  }
  return false;
}

export { getBazisExportSettings } from '../export/bazis-export-settings.js';

export function getCurrentStepNumber() {
  if (typeof window.currentRoomStep === 'number' && window.currentRoomStep >= 1) {
    return window.currentRoomStep;
  }
  const stepIndicator = document.querySelector('.step-indicator');
  if (!stepIndicator) return 1;
  const m = stepIndicator.textContent.match(/\d+/);
  const n = m ? parseInt(m[0], 10) : 1;
  window.currentRoomStep = n;
  return n;
}

function setRoomDoorControlsVisible(stepNumber) {
  try {
    if (typeof window.__clodisSetDoorPillsVisible === 'function') {
      window.__clodisSetDoorPillsVisible(Number(stepNumber) >= 4);
    }
    if (typeof window.__cldSyncPlacementTargetPillsVisibility === 'function') {
      window.__cldSyncPlacementTargetPillsVisibility();
    }
  } catch (_) {}
}

function setDesiredRoomOpenState(open) {
  window.__cldRoomDoorsDesiredOpen = !!open;
  try {
    if (typeof window.__clodisSyncDoorToggleBtn === 'function') {
      window.__clodisSyncDoorToggleBtn(!!open);
    }
  } catch (_) {}
}

function getDesiredRoomOpenState() {
  return window.__cldRoomDoorsDesiredOpen === true;
}

function applyDesiredRoomOpenState() {
  try {
    const open = getDesiredRoomOpenState();
    //   / sync:     (  ~1 ).
    if (window.ClodisBuilder && typeof window.ClodisBuilder.toggleAllDoors === 'function') {
      window.ClodisBuilder.toggleAllDoors(open, { instant: true });
      try {
        if (typeof window.__clodisSyncDoorToggleBtn === 'function') {
          window.__clodisSyncDoorToggleBtn(open);
        }
      } catch (_) {}
      return;
    }
    if (typeof window.__clodisApplyDoorOpenState === 'function') {
      window.__clodisApplyDoorOpenState(open);
    }
  } catch (e) {
    console.warn('[room-steps] applyDesiredRoomOpenState:', e);
  }
}

function scheduleRoomHandleAndDoorSync(opts = {}) {
  const currentStep = Number(window.currentRoomStep) || 0;
  setRoomDoorControlsVisible(currentStep);
  if (currentStep < 4) return;
  const retryHandles = opts.retryHandles === true;
  const delay = Math.max(0, Number(opts.delayMs) || 0);
  const applyDoors = opts.applyDoors !== false;
  window.clearTimeout(window.__cldRoomStepDoorSyncTimer);
  window.clearTimeout(window.__cldRoomStepDoorSyncLateTimer);
  window.__cldRoomStepDoorSyncTimer = window.setTimeout(() => {
    const runRetry = async () => {
      if (retryHandles) {
        try {
          if (typeof window.__cldEnsureDrawerCatalog33FreshFromApi === 'function') {
            await window.__cldEnsureDrawerCatalog33FreshFromApi();
          }
          if (typeof window.__cldRetryFacadeHandles === 'function') {
            window.__cldRetryFacadeHandles();
          }
        } catch (e) {
          console.warn('[room-steps] retry handles sync:', e);
        }
      }
      if (applyDoors) {
        window.setTimeout(() => {
          applyDesiredRoomOpenState();
        }, retryHandles ? 220 : 0);
        window.__cldRoomStepDoorSyncLateTimer = window.setTimeout(() => {
          applyDesiredRoomOpenState();
        }, retryHandles ? 900 : 420);
      }
    };
    runRetry();
  }, delay);
}

const ROOM_STEP_TOTAL = 7;

function formatRoomStepCounter(stepNumber) {
  const n = Number(stepNumber) || 1;
  return n + ' из ' + ROOM_STEP_TOTAL;
}

function syncRoomStepProgress(stepNumber) {
  const n = Number(stepNumber) || 1;
  const pct = Math.max(0, Math.min(100, (n / ROOM_STEP_TOTAL) * 100));
  const fill = document.getElementById('cld-step-progress-fill');
  if (fill) fill.style.width = pct + '%';
  const bar = document.querySelector('.cld-step-progress');
  if (bar) bar.setAttribute('aria-valuenow', String(n));
}

export function getStepTitle(stepId, fallback) {
  const config = getRoomStepsConfig();
  if (config && config.steps) {
    const step = config.steps.find(function (s) {
      return s.stepId === stepId;
    });
    let t = step && step.title ? String(step.title).trim() : '';
    // Presentation migration: Step 3 is "start composition", not "single furniture type".
    if (stepId === 3 && t === 'Выберите тип мебели') {
      t = '  ?';
    }
    if (t) return t;
  }
  return fallback || 'ШАГ ' + stepId;
}

// Default catalog folders for step 3 (if not provided in room_steps_config)
const CATALOG_FOLDERS = [
  { id: '1', name: 'Кухни', icon: 'fa-utensils' },
  { id: 'korpusnaya_mebel', name: 'Корпусная мебель', icon: 'fa-couch' },
  { id: '2', name: 'Шкафы', icon: 'fa-archive' },
];

/**    3 (     ,    3). */
function resolveCatalogFoldersForSteps() {
  let folders = [];
  const config = getRoomStepsConfig();
  if (config && config.steps) {
    const step3 = config.steps.find((s) => s.stepId === 3);
    if (step3 && step3.items && step3.items.length > 0) {
      folders = step3.items
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((it) => ({
          id: (it.key && String(it.key).trim()) || it.id || `item-${it.id}`,
          name: it.name || '',
          icon: (it.icon || '').trim() || 'fa-folder',
          image: (it.image || '').trim(),
        }));
    }
  }

  if (folders.length === 0) {
    const found = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('catalog_') === 0 && k !== 'catalogs_keys') {
        const catId = k.replace('catalog_', '');
        const info =
          (window.__catalogCategoryInfo || {})[catId] || {
            name: catId,
            icon: 'fa-folder',
          };
        found.push({
          id: catId,
          name: info.name || catId,
          icon: info.icon || 'fa-folder',
        });
      }
    }
    folders =
      found.length > 0
        ? found.sort((a, b) => String(a.id).localeCompare(String(b.id)))
        : CATALOG_FOLDERS;
  }

  const tagsApi = typeof window !== 'undefined' ? window.__cldRoomFurnitureTags : null;
  const roomCtx = tagsApi && typeof tagsApi.getRoomContext === 'function' ? tagsApi.getRoomContext() : null;
  const showAll = !!window.step3ShowAllCategories;
  if (tagsApi && typeof tagsApi.filterStep3Folders === 'function' && folders.length > 0) {
    folders = tagsApi.filterStep3Folders(folders, roomCtx, showAll);
  }
  return folders;
}

function buildFolderIconHtml(iconVal) {
  const icon = iconVal || 'fa-folder';
  const isImg =
    /^https?:\/\//i.test(icon) || (icon.length > 0 && icon.charAt(0) === '/');
  if (isImg) {
    return `<img src="${icon.replace(
      /"/g,
      '&quot;'
    )}" alt="" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none';var s=this.nextElementSibling;s&&(s.style.display='flex');"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:18px;color:#999;"><i class="fas fa-image"></i></div>`;
  }
  return `<i class="fas ${icon}" style="font-size: 20px; color: #666;"></i>`;
}

/** Presentation-only category preview for step 3 (does not change IDs/keys). */
function resolveCategoryPreviewSrc(folder) {
  const image = folder && folder.image ? String(folder.image).trim() : '';
  if (image && (image.charAt(0) === '/' || /^https?:\/\//i.test(image))) {
    return image;
  }
  const icon = folder && folder.icon ? String(folder.icon).trim() : '';
  if (icon && (icon.charAt(0) === '/' || /^https?:\/\//i.test(icon)) && icon.indexOf('shape:') !== 0) {
    return icon;
  }
  const id = String((folder && folder.id) || '')
    .trim()
    .replace(/^catalog_/i, '');
  const name = String((folder && folder.name) || '')
    .trim()
    .toLowerCase();
  const FALLBACK_BY_KEY = {
    '26': '/images/catalog/category-wardrobe.svg',
    '25': '/images/catalog/category-cabinet.svg',
    '37': '/images/catalog/category-dresser.svg',
    '41': '/images/catalog/category-end-cabinet.svg',
    '42': '/images/catalog/category-wall-hung.svg',
  };
  if (FALLBACK_BY_KEY[id]) return FALLBACK_BY_KEY[id];
  if (/торцев/.test(name)) return FALLBACK_BY_KEY['41'];
  if (/навес|подвес|wall.?hung/.test(name)) return FALLBACK_BY_KEY['42'];
  if (/комод/.test(name)) return FALLBACK_BY_KEY['37'];
  if (/тумб/.test(name)) return FALLBACK_BY_KEY['25'];
  if (/шкаф/.test(name)) return FALLBACK_BY_KEY['26'];
  return '/images/catalog/category-wardrobe.svg';
}

/**       4 ( ). */
function renderStep4CategoryCrumbs(container, activeFolderId, onSelectFolder) {
  const folders = resolveCatalogFoldersForSteps();
  const normalizeFolderKey = (value) =>
    String(value == null ? '' : value)
      .trim()
      .replace(/^catalog_/i, '');
  if (!folders.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'step4-category-crumbs';
  wrap.setAttribute('role', 'navigation');
  wrap.setAttribute('aria-label', 'Категории мебели');

  const activeKey = normalizeFolderKey(activeFolderId);

  folders.forEach((folder) => {
    const id = String(folder.id);
    const normalizedId = normalizeFolderKey(id);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'step4-category-crumb';
    if (activeKey && normalizedId === activeKey) {
      item.classList.add('step4-category-crumb--active');
      item.setAttribute('aria-current', 'page');
    }
    item.dataset.catalogFolderId = id;
    const previewSrc = resolveCategoryPreviewSrc(folder);
    const safeSrc = previewSrc.replace(/"/g, '&quot;');
    item.innerHTML =
      `<span class="step4-category-crumb-icon">` +
      `<img src="${safeSrc}" alt="" ` +
      `onerror="this.style.display='none';var f=this.nextElementSibling;f&&(f.hidden=false);">` +
      `<span class="step4-category-crumb-fallback" hidden>${buildFolderIconHtml(folder.icon)}</span>` +
      `</span>` +
      `<span class="step4-category-crumb-name">${(folder.name || id)
        .replace(/</g, '&lt;')}</span>`;
    item.addEventListener('click', () => {
      if (activeKey && normalizedId === activeKey) return;
      if (typeof onSelectFolder === 'function') {
        onSelectFolder(folder);
      }
    });
    wrap.appendChild(item);
  });

  container.appendChild(wrap);
}

// Step 3: catalog folder selection (uses room_steps_config step 3 or CATALOG_FOLDERS)
function buildCatalogFoldersStep(container) {
  container.innerHTML = '';
  window.step3CatalogOpen = false;

  const folders = resolveCatalogFoldersForSteps();

  const grid = document.createElement('div');
  grid.className = 'room-types-grid catalog-category-grid';
  grid.dataset.cols = '2';
  grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';

  folders.forEach((folder) => {
    const item = document.createElement('div');
    item.className = 'room-type-item catalog-category-card';
    item.dataset.catalogFolderId = folder.id;
    item.setAttribute('role', 'button');
    item.tabIndex = 0;
    item.style.cursor = 'pointer';

    const label = (folder.name || folder.id || '').replace(/</g, '&lt;');
    const previewSrc = resolveCategoryPreviewSrc(folder);
    const isPhoto = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(previewSrc);
    const fitClass = isPhoto
      ? 'catalog-category-preview__img catalog-category-preview__img--cover'
      : 'catalog-category-preview__img catalog-category-preview__img--contain';

    item.innerHTML =
      `<div class="room-type-icon catalog-category-preview">` +
      `<img class="${fitClass}" src="${previewSrc.replace(/"/g, '&quot;')}" alt="" ` +
      `onerror="this.style.display='none';var f=this.nextElementSibling;f&&(f.hidden=false);">` +
      `<div class="catalog-category-preview__fallback" hidden><i class="fas fa-couch" aria-hidden="true"></i></div>` +
      `<span class="catalog-category-selected-indicator" aria-hidden="true"></span>` +
      `</div>` +
      `<div class="catalog-category-meta">` +
      `<div class="room-type-name catalog-category-name">${label}</div>` +
      `</div>`;

    item.addEventListener('click', () => {
      grid
        .querySelectorAll('.room-type-item')
        .forEach((i) => i.classList.remove('selected'));
      item.classList.add('selected');
      window.selectedCatalogFolder = {
        id: folder.id,
        name: folder.name || folder.id,
      };
      const nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) nextBtn.disabled = false;
    });

    grid.appendChild(item);
  });

  container.appendChild(grid);

  const showAll = !!window.step3ShowAllCategories;
  const showAllBtn = document.createElement('button');
  showAllBtn.type = 'button';
  showAllBtn.className = 'catalog-category-show-all';
  showAllBtn.textContent = showAll
    ? '  '
    : '  ';
  showAllBtn.addEventListener('click', () => {
    window.step3ShowAllCategories = !window.step3ShowAllCategories;
    buildCatalogFoldersStep(container);
  });
  container.appendChild(showAllBtn);

  const hint = document.createElement('div');
  hint.className = 'catalog-category-hint';
  hint.textContent = showAll
    ? '   .   .'
    : ' ,     .';
  container.appendChild(hint);
}

// Step 4: catalog for selected folder (wardrobes, kitchens, etc.)
function buildCatalogStep4(container, folderId, folderName) {
  container.innerHTML = '';
  window.step3CatalogOpen = true;

  const resolvedFolderId =
    folderId != null && String(folderId).trim() !== ''
      ? folderId
      : window.selectedCatalogFolder && window.selectedCatalogFolder.id != null
        ? window.selectedCatalogFolder.id
        : null;

  renderStep4CategoryCrumbs(container, resolvedFolderId, (folder) => {
    window.selectedCatalogFolder = {
      id: folder.id,
      name: folder.name || folder.id,
    };
    const stepTitleEl = document.querySelector('.step-title');
    if (stepTitleEl) {
      stepTitleEl.textContent = String(folder.name || folder.id);
    }
    const stepDescEl = document.getElementById('cld-step-description');
    if (stepDescEl) {
      stepDescEl.textContent =
        '     .';
      stepDescEl.hidden = false;
    }
    buildCatalogStep4(container, folder.id, folder.name || folder.id);
  });

  // Grid with cabinets (prepared before buttons so handlers can use it)
  const grid = document.createElement('div');
  grid.className = 'cabinets-grid';
  grid.id = 'step4-cabinets-grid';

  const filtersHost = document.createElement('div');
  filtersHost.className = 'step4-filters';

  // Block 1: − / + buttons for section division variants
  const optionsBlock = document.createElement('div');
  optionsBlock.id = 'step4-options-block';
  optionsBlock.innerHTML =
    '<div id="step4-l-arm-pills" class="step4-l-arm-pills" hidden></div>' +
    '<div id="step4-door-flank-pills" class="step4-l-arm-pills step4-door-flank-pills" hidden>' +
    '<button type="button" class="step4-l-arm-pill" data-door-flank="left" id="step4-door-flank-left">Слева</button>' +
    '<button type="button" class="step4-l-arm-pill" data-door-flank="right" id="step4-door-flank-right">Справа</button>' +
    '</div>' +
    '<p id="step4-options-section-label" class="step4-options-section-label" title="Кликните секцию в комнате — переключить">—</p>' +
    '<div class="step4-options-row">' +
    '<button type="button" id="step4-options-minus" class="step4-ctrl-btn" aria-label="Меньше зон">−</button>' +
    '<span id="step4-options-value"></span>' +
    '<button type="button" id="step4-options-plus" class="step4-ctrl-btn" aria-label="Больше зон">+</button>' +
    '<div class="step4-toggles-group">' +
    '<label class="step4-unified-toggle" for="step4-facade-bottom-deep-input" title="Низ фасада: 2,5 см от пола">' +
    '<input type="checkbox" id="step4-facade-bottom-deep-input" />' +
    '<span class="step4-unified-toggle-track"><span class="step4-unified-toggle-thumb"></span></span>' +
    '</label>' +
    '<label class="step4-unified-toggle" for="step4-unified-facade-toggle-input" title="Цельная дверь">' +
    '<input type="checkbox" id="step4-unified-facade-toggle-input" />' +
    '<span class="step4-unified-toggle-track"><span class="step4-unified-toggle-thumb"></span></span>' +
    '</label>' +
    '</div>' +
    '</div>';
  filtersHost.appendChild(optionsBlock);
  container.appendChild(filtersHost);

  if (typeof window.step4UnifiedFacade !== 'boolean') {
    window.step4UnifiedFacade = false;
  }
  if (typeof window.step4FacadeBottomDeep !== 'boolean') {
    window.step4FacadeBottomDeep = false;
  }

  function rebuildStep4RoomFurniture() {
    try {
      if (typeof rebuildAllRoomFurnitureForStep4Toggles === 'function') {
        rebuildAllRoomFurnitureForStep4Toggles();
      } else if (typeof window.__cldRebuildFurnitureForStep4Toggles === 'function') {
        window.__cldRebuildFurnitureForStep4Toggles();
      } else if (typeof window.__cldRebuildFurnitureForUnifiedFacade === 'function') {
        window.__cldRebuildFurnitureForUnifiedFacade();
      }
    } catch (e) {
      console.warn('[step4] furniture rebuild failed', e);
    }
    try {
      if (typeof window.__clodisRebuildAllTransitions === 'function') {
        window.__clodisRebuildAllTransitions();
      }
    } catch (e) {
      console.warn('[step4] rebuildAllTransitions failed', e);
    }
    scheduleRoomHandleAndDoorSync({ retryHandles: true, delayMs: 120 });
  }

  const facadeBottomDeepInput = document.getElementById('step4-facade-bottom-deep-input');
  if (facadeBottomDeepInput) {
    facadeBottomDeepInput.checked = window.step4FacadeBottomDeep;
    facadeBottomDeepInput.addEventListener('change', function () {
      window.step4FacadeBottomDeep = !!facadeBottomDeepInput.checked;
      rebuildStep4RoomFurniture();
    });
  }

  const unifiedFacadeToggleInput = document.getElementById('step4-unified-facade-toggle-input');
  if (unifiedFacadeToggleInput) {
    unifiedFacadeToggleInput.checked = window.step4UnifiedFacade;
    unifiedFacadeToggleInput.addEventListener('change', function () {
      window.step4UnifiedFacade = !!unifiedFacadeToggleInput.checked;
      rebuildStep4RoomFurniture();
    });
  }

  (function () {
    /** Вилка двустворчатых / одностворчатых и шаг сетки из админки (section_division). */
    function getSectionDivisionCfg() {
      const cfg = getRoomStepsConfig();
      if (!cfg || !cfg.steps) {
        return {
          doubleMinMm: 800,
          doubleMaxMm: 1200,
          singleMinMm: 300,
          singleMaxMm: 600,
          stepMm: 100,
        };
      }
      const step4 = cfg.steps.find((s) => s.stepId === 4);
      const sd = step4 && step4.section_division;
      return {
        doubleMinMm: sd && Number(sd.min_mm) > 0 ? Number(sd.min_mm) : 800,
        doubleMaxMm: sd && Number(sd.max_mm) > 0 ? Number(sd.max_mm) : 1200,
        singleMinMm: sd && Number(sd.single_min_mm) > 0 ? Number(sd.single_min_mm) : 300,
        singleMaxMm: sd && Number(sd.single_max_mm) > 0 ? Number(sd.single_max_mm) : 600,
        stepMm: sd && Number(sd.step_mm) > 0 ? Number(sd.step_mm) : 100,
      };
    }

    function getActiveSectionId() {
      const focus = window.__cldLArmFocus;
      if (
        focus &&
        (focus.mode === 'wall' || focus.mode === 'flank' || focus.mode === 'primary' || focus.mode === 'attached') &&
        focus.focusedSectionId
      ) {
        return focus.focusedSectionId;
      }
      if (
        focus &&
        focus.mode === 'wall' &&
        !focus.focusedSectionId &&
        focus.wallName &&
        typeof window.__clodisGetDoorFlankSectionsForWall === 'function'
      ) {
        //          , id  
        return window.activeSectionId || null;
      }
      if (window.activeSectionId) return window.activeSectionId;
      if (typeof window.__clodisGetFirstSectionId === 'function') {
        return window.__clodisGetFirstSectionId();
      }
      return null;
    }

    const valueEl = document.getElementById('step4-options-value');
    const minusBtn = document.getElementById('step4-options-minus');
    const plusBtn = document.getElementById('step4-options-plus');
    const labelEl = document.getElementById('step4-options-section-label');
    const lArmPills = document.getElementById('step4-l-arm-pills');
    const doorFlankPills = document.getElementById('step4-door-flank-pills');
    const doorFlankLeftBtn = document.getElementById('step4-door-flank-left');
    const doorFlankRightBtn = document.getElementById('step4-door-flank-right');
    let wallPillsBound = false;

    function refreshDoorFlankPills(sectionId) {
      if (!doorFlankPills) return;
      const id = sectionId || getActiveSectionId();
      const desc =
        typeof window.__clodisDescribeDoorFlankForUi === 'function'
          ? window.__clodisDescribeDoorFlankForUi(id)
          : null;
      if (!desc) {
        doorFlankPills.hidden = true;
        return;
      }
      doorFlankPills.hidden = false;
      if (doorFlankLeftBtn) doorFlankLeftBtn.textContent = desc.leftLabel || 'Слева';
      if (doorFlankRightBtn) doorFlankRightBtn.textContent = desc.rightLabel || 'Справа';
      const side = desc.activeSide;
      doorFlankPills.querySelectorAll('.step4-l-arm-pill').forEach((btn) => {
        const s = btn.getAttribute('data-door-flank');
        btn.setAttribute('aria-pressed', s && s === side ? 'true' : 'false');
      });
    }

    function bindWallPillsOnce() {
      if (!lArmPills || wallPillsBound) return;
      wallPillsBound = true;
      lArmPills.addEventListener('click', (ev) => {
        const btn = ev.target?.closest?.('.step4-l-arm-pill');
        if (!btn || !lArmPills.contains(btn)) return;
        const id = window.activeSectionId || getActiveSectionId();
        const wall = btn.getAttribute('data-wall');
        const arm = btn.getAttribute('data-l-arm');
        if (arm === 'overview' || wall === 'overview') {
          if (typeof window.__clodisSetOverviewFocus === 'function') {
            window.__clodisSetOverviewFocus(id);
          } else if (typeof window.__clodisSetLArmFocusMode === 'function') {
            window.__clodisSetLArmFocusMode('overview', id);
          }
        } else if (wall && typeof window.__clodisSetWallFocus === 'function') {
          window.__clodisSetWallFocus(wall, id);
        }
        refresh();
      });
    }

    function refreshLArmPills(sectionId) {
      if (!lArmPills) return;
      const id = sectionId || getActiveSectionId();
      const desc =
        typeof window.__clodisDescribeWallFocusForUi === 'function'
          ? window.__clodisDescribeWallFocusForUi(id)
          : typeof window.__clodisDescribeLArmFocusForUi === 'function'
            ? window.__clodisDescribeLArmFocusForUi(id)
            : null;
      if (!desc || (!desc.walls?.length && !desc.primaryLabel)) {
        lArmPills.hidden = true;
        refreshDoorFlankPills(id);
        return;
      }
      lArmPills.hidden = false;
      bindWallPillsOnce();

      const walls = desc.walls || [];
      const focus = window.__cldLArmFocus || {};
      const mode = focus.mode || 'overview';
      const activeWall =
        mode === 'wall' || mode === 'flank'
          ? focus.wallName || focus.flankWall || desc.activeWall
          : null;

      let html = '';
      if (desc.showOverview !== false && (walls.length >= 2 || desc.showOverview)) {
        html +=
          '<button type="button" class="step4-l-arm-pill" data-l-arm="overview" data-wall="overview"' +
          (mode === 'overview' ? ' aria-pressed="true"' : ' aria-pressed="false"') +
          '></button>';
      }
      walls.forEach((w) => {
        const pressed = activeWall && String(activeWall) === String(w.wall);
        html +=
          '<button type="button" class="step4-l-arm-pill" data-wall="' +
          w.wall +
          '"' +
          (pressed ? ' aria-pressed="true"' : ' aria-pressed="false"') +
          '>' +
          (w.label || w.wall) +
          '</button>';
      });
      // fallback old primary/attached if no walls array
      if (!walls.length && desc.primaryLabel) {
        html =
          '<button type="button" class="step4-l-arm-pill" data-l-arm="overview">Обзор</button>' +
          '<button type="button" class="step4-l-arm-pill" data-wall="' +
          (desc.primaryWall || 'back') +
          '">' +
          desc.primaryLabel +
          '</button>';
        if (desc.attachedLabel) {
          html +=
            '<button type="button" class="step4-l-arm-pill" data-wall="' +
            (desc.attachedWall || 'right') +
            '">' +
            desc.attachedLabel +
            '</button>';
        }
      }
      lArmPills.innerHTML = html;

      if (labelEl) {
        const wallLabel =
          walls.find((w) => w.wall === activeWall)?.label ||
          (activeWall ? activeWall : null);
        if (mode === 'flank' && focus.flankSide) {
          labelEl.textContent =
            (wallLabel || '') +
            (focus.flankSide === 'right' ? ' · справа' : ' · слева');
        } else if (mode === 'wall' && wallLabel) {
          labelEl.textContent = wallLabel;
        } else if (mode === 'overview') {
          labelEl.textContent = 'Обзор';
        } else {
          labelEl.textContent = wallLabel || '';
        }
      }
      refreshDoorFlankPills(id);
    }

    function refresh(sectionId) {
      const id = sectionId || getActiveSectionId();
      refreshLArmPills(id);
      if (!id || typeof window.__clodisGetSectionLayoutInfo !== 'function') {
        if (valueEl) valueEl.textContent = '';
        return;
      }
      const focusMode = window.__cldLArmFocus?.mode || 'overview';
      const needsFlank =
        focusMode === 'wall' &&
        !!window.__clodisDescribeDoorFlankForUi?.(id) &&
        !window.__cldLArmFocus?.flankSide;
      const armLocked =
        (focusMode === 'overview' &&
          !!(
            window.__clodisDescribeWallFocusForUi?.(id) ||
            window.__clodisDescribeLArmFocusForUi?.(id)
          )) ||
        needsFlank;
      if (minusBtn) minusBtn.disabled = armLocked;
      if (plusBtn) plusBtn.disabled = armLocked;
      if (armLocked) {
        if (valueEl) valueEl.textContent = '';
        if (minusBtn) minusBtn.style.opacity = '0.3';
        if (plusBtn) plusBtn.style.opacity = '0.3';
        return;
      }
      const info = window.__clodisGetSectionLayoutInfo(id);
      if (!info) {
        if (valueEl) valueEl.textContent = '';
        return;
      }
      const divisionCfg = getSectionDivisionCfg();
      const variants =
        typeof window.__clodisBuildSectionDivisionVariants === 'function'
          ? window.__clodisBuildSectionDivisionVariants(info.innerWidthMm, divisionCfg)
          : [];
      const curInternal =
        typeof window.__clodisResolveDivisionVariantIndex === 'function'
          ? window.__clodisResolveDivisionVariantIndex(id, divisionCfg)
          : 0;
      const hasZeroSlot =
        variants.length > 0 && variants[0] && variants[0].kind === 'allSingles';
      // Слот 0 = allSingles («−» до конца). Старт секции = 1 (первый double-ряд).
      // Не показываем «0» как старт: на allSingles — «—» (как пустой счётчик Maatkasten на минимуме).
      const displayNum = hasZeroSlot ? curInternal : curInternal + 1;
      if (valueEl) {
        valueEl.textContent =
          hasZeroSlot && curInternal === 0 ? '' : String(displayNum);
      }
      window.step4VariantCount = displayNum;
      window.step4VariantInternalIndex = curInternal;
      window.step4VariantTotal = variants.length;

      if (minusBtn) minusBtn.style.opacity = curInternal > 0 ? '1' : '0.3';
      if (plusBtn)
        plusBtn.style.opacity =
          variants.length > 0 && curInternal < variants.length - 1 ? '1' : '0.3';
    }

    /** +    (  /  ); −   (). */
    function changeVariant(delta) {
      const focusMode = window.__cldLArmFocus?.mode || 'overview';
      const id = getActiveSectionId();
      //   : overview OK (  activeSectionId).
      //   / L /       /.
      const needsWallPick = !!(
        typeof window.__clodisDescribeWallFocusForUi === 'function' &&
        window.__clodisDescribeWallFocusForUi(id)
      );
      const needsLArm = !!(
        typeof window.__clodisDescribeLArmFocusForUi === 'function' &&
        window.__clodisDescribeLArmFocusForUi(id)
      );
      if (focusMode === 'overview' && (needsWallPick || needsLArm)) {
        console.log('[L-ARM] ± в обзоре: выберите стену');
        return;
      }
      if (
        focusMode === 'wall' &&
        window.__clodisDescribeDoorFlankForUi?.(id) &&
        !window.__cldLArmFocus?.flankSide
      ) {
        console.log('[L-ARM] ±: выберите Слева/Справа у двери');
        return;
      }
      if (!id || typeof window.__clodisApplySectionDivisionVariant !== 'function') return;
      const divisionCfg = getSectionDivisionCfg();
      const info = window.__clodisGetSectionLayoutInfo(id);
      if (!info) return;
      const variants = window.__clodisBuildSectionDivisionVariants(
        info.innerWidthMm,
        divisionCfg
      );
      if (!variants.length) return;
      const cur = window.__clodisResolveDivisionVariantIndex(id, divisionCfg);
      let next = cur + delta;
      next = Math.max(0, Math.min(variants.length - 1, next));
      window.__clodisApplySectionDivisionVariant(id, next, divisionCfg);
      setTimeout(() => refresh(id), 50);
    }

    if (minusBtn) minusBtn.onclick = () => changeVariant(-1);
    if (plusBtn) plusBtn.onclick = () => changeVariant(+1);

    if (doorFlankPills) {
      doorFlankPills.querySelectorAll('.step4-l-arm-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          const side = btn.getAttribute('data-door-flank') || 'left';
          const id = window.activeSectionId || getActiveSectionId();
          if (typeof window.__clodisSetDoorFlankFocus === 'function') {
            window.__clodisSetDoorFlankFocus(side, id);
          }
          refresh();
        });
      });
    }

    // Expose refresh so scene-icons.js can call it when pencil is clicked
    window.__clodisRefreshStep4VariantDisplay = refresh;
    window.__clodisRefreshStep4LArmPills = () => refreshLArmPills(getActiveSectionId());

    // Initial render after a tick (sections might not be loaded yet)
    setTimeout(() => refresh(), 200);
  })();

  // Block 2: hint "Нажимайте и размещайте..." from config (price_subline_hint_text, etc.)
  const step4PriceSubline = (() => {
    const cfg = getRoomStepsConfig();
    if (!cfg || !cfg.steps) return null;
    const s4 = cfg.steps.find((s) => s.stepId === 4);
    const ps = s4 && s4.price_subline;
    return ps && typeof ps === 'object' ? ps : null;
  })();

  const hintTextRaw =
    step4PriceSubline &&
    typeof step4PriceSubline.price_subline_hint_text === 'string'
      ? step4PriceSubline.price_subline_hint_text.trim()
      : '';
  const hintTextFallback =
    step4PriceSubline &&
    typeof step4PriceSubline.price_subline_text === 'string'
      ? step4PriceSubline.price_subline_text.trim()
      : '';
  const modalTitleEarly =
    (step4PriceSubline && step4PriceSubline.price_subline_help_title) || '';
  const modalContentEarly =
    (step4PriceSubline && step4PriceSubline.price_subline_modal_text) ||
    (step4PriceSubline && step4PriceSubline.price_subline_help_text) ||
    '';
  const hintText =
    hintTextRaw ||
    hintTextFallback ||
    (modalContentEarly || modalTitleEarly ? hintTextFallback : '');

  if (hintText || modalContentEarly || modalTitleEarly) {
    const linkText =
      (step4PriceSubline &&
        step4PriceSubline.price_subline_help_link_text) ||
      '  ?';
    const modalTitle = modalTitleEarly;
    const modalContent = modalContentEarly;
    const showHelpLink = !!(modalContent || modalTitle);
    const displayText =
      hintTextRaw ||
      hintTextFallback ||
      '     .';
    const hint = document.createElement('div');
    hint.className = 'sidebar-info-line';
    hint.innerHTML =
      displayText +
      (showHelpLink
        ? ' <span id="step4-modules-help-link" class="price-subline-help-link">' +
          linkText +
          '</span>'
        : '');
    filtersHost.appendChild(hint);

    const modulesHelpLink = document.getElementById(
      'step4-modules-help-link'
    );
    if (modulesHelpLink && showHelpLink && typeof window.showCenteredHelpModal === 'function') {
      modulesHelpLink.onclick = () => {
        window.showCenteredHelpModal(modalTitle, modalContent);
      };
    }
  }

  // Block 3: pill buttons (configured via step 4 in admin)
  const pillsWrapper = document.createElement('div');
  pillsWrapper.className = 'step4-pill-buttons';
  filtersHost.appendChild(pillsWrapper);

  const config = getRoomStepsConfig();
  const folderKeyForPills = (() => {
    let fk =
      resolvedFolderId != null && String(resolvedFolderId).trim() !== ''
        ? String(resolvedFolderId).trim()
        : '';
    if (fk.startsWith('catalog_')) fk = fk.replace(/^catalog_/, '');
    return fk;
  })();
  let pillItems = [];
  if (config && config.steps) {
    const step4Cfg = config.steps.find((s) => s.stepId === 4);
    const pillApi = window.ClodisRoomStep4PillSets;
    if (step4Cfg && pillApi) {
      pillApi.ensureStep4PillSets(step4Cfg, config);
      if (pillApi.seedDefaultStep4PillSetsIfEmpty(step4Cfg, config)) {
        try {
          localStorage.setItem('room_steps_config', JSON.stringify(config));
        } catch (e) {
          /* ignore */
        }
      }
      pillItems = pillApi.getStep4PillsForFolder(
        step4Cfg,
        folderKeyForPills,
        config
      );
      if (pillItems.length === 0 && step4Cfg.pillSets) {
        const pillKeys = Object.keys(step4Cfg.pillSets).filter(
          (k) =>
            Array.isArray(step4Cfg.pillSets[k]) &&
            step4Cfg.pillSets[k].length > 0
        );
        console.warn(
          '[step4]       "' +
            folderKeyForPills +
            '". pillSets  : ' +
            pillKeys.join(', ') +
            '.      3    4  .'
        );
      }
    } else if (
      step4Cfg &&
      Array.isArray(step4Cfg.items) &&
      step4Cfg.items.length > 0
    ) {
      pillItems = step4Cfg.items
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  }

  let columnsPerRow = 2;
  if (config && config.steps) {
    const step4CfgForCols = config.steps.find((s) => s.stepId === 4);
    if (
      step4CfgForCols &&
      (step4CfgForCols.columnsPerRow === 1 ||
        step4CfgForCols.columnsPerRow === 2)
    ) {
      columnsPerRow = step4CfgForCols.columnsPerRow;
    }
  }

  /**       ( ). */
  function updateStep4PillSliders() {
    pillsWrapper.querySelectorAll('.step4-pill-track').forEach((track) => {
      const slider = track.querySelector('.step4-pill-slider');
      if (!slider) return;
      const selected = track.querySelector('.step4-pill-button.selected');
      if (!selected) {
        slider.classList.remove('is-visible');
        return;
      }
      const trackRect = track.getBoundingClientRect();
      const btnRect = selected.getBoundingClientRect();
      const left = btnRect.left - trackRect.left;
      slider.style.width = `${btnRect.width}px`;
      slider.style.transform = `translateX(${left}px)`;
      slider.classList.add('is-visible');
    });
  }

  if (!pillsWrapper._step4PillResizeBound) {
    pillsWrapper._step4PillResizeBound = true;
    window.addEventListener('resize', () => {
      try {
        updateStep4PillSliders();
      } catch (e) {
        /* ignore */
      }
    });
  }

  function readCatalogCategoriesForFolder(folderKey) {
    const fk = String(folderKey || '').trim();
    if (!fk) return [];
    const keys = [
      'catalogCategories_catalog_' + fk,
      'catalogCategories_' + fk,
    ];
    for (const storageKey of keys) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) continue;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      } catch (_) {}
    }
    return [];
  }

  /**     (    id 4  7). */
  function resolveCategoryIdFromLabel(nameLower, cats) {
    const byName = (re) => {
      const hit = (cats || []).find((c) =>
        re.test(String(c.name || c.label || '').toLowerCase())
      );
      return hit && hit.id != null ? Number(hit.id) : null;
    };
    if (/с\s*двер|дверями/.test(nameLower)) {
      return (
        byName(/с\s*двер|дверями|модули\s*с\s*двер/) ??
        7
      );
    }
    if (/без\s*двер/.test(nameLower)) {
      return byName(/без\s*двер/) ?? 4;
    }
    if (/однодвер|одноствор/.test(nameLower)) {
      return byName(/однодвер|одноствор/) ?? 5;
    }
    if (/однодвер|одноствор/.test(nameLower)) {
      return byName(/двухдвер|двуствор/) ?? 6;
    }
    return null;
  }

  function resolvePillCategoryId(btn, folderKey) {
    const stored =
      btn.categoryId != null && btn.categoryId !== '' ? Number(btn.categoryId) : null;
    const name = String(btn.name || '').toLowerCase();
    const fromLabel = resolveCategoryIdFromLabel(
      name,
      readCatalogCategoriesForFolder(folderKey)
    );
    return fromLabel != null ? fromLabel : stored;
  }

  function resolveCategoryIdFromPillElement(el, folderKey) {
    const stored = el.dataset.categoryId
      ? parseInt(el.dataset.categoryId, 10)
      : null;
    const name = String(el.textContent || '').toLowerCase();
    const fromLabel = resolveCategoryIdFromLabel(
      name,
      readCatalogCategoriesForFolder(folderKey)
    );
    return fromLabel != null ? fromLabel : Number.isFinite(stored) ? stored : null;
  }

  /**        (  / ). */
  function inferCabinetDoorFilter(btn) {
    const raw = btn.cabinetDoorFilter;
    if (raw === 'single' || raw === 'double') return raw;
    const n = (btn.name || '').toLowerCase();
    if (/\bодинар|\bодноствор|single|\b1[\-\s]?створ|mono/i.test(n)) {
      return 'single';
    }
    if (/\bдвойн|\bдвухствор|double|\b2[\-\s]?створ|\bпарн/i.test(n)) {
      return 'double';
    }
    return null;
  }

  function buildSelectedPillFilters() {
    const list = [];
    pillsWrapper.querySelectorAll('.step4-pill-button.selected').forEach((el) => {
      const cid = resolveCategoryIdFromPillElement(el, folderKeyForPills);
      const orCid = el.dataset.orCategoryId
        ? parseInt(el.dataset.orCategoryId, 10)
        : null;
      const d = el.dataset.cabinetDoorFilter;
      const door = d === 'single' || d === 'double' ? d : null;
      list.push({
        filterCategoryId: Number.isFinite(cid) ? cid : null,
        orFilterCategoryId: Number.isFinite(orCid) ? orCid : null,
        cabinetDoorFilter: door,
      });
    });
    return list;
  }

  /**    ()        . */
  function ensureExactlyOnePillPerTrack() {
    const tracks = pillsWrapper.querySelectorAll('.step4-pill-track');
    if (!tracks.length) return null;
    let last = null;
    tracks.forEach((track) => {
      const pills = Array.from(track.querySelectorAll('.step4-pill-button'));
      if (!pills.length) return;
      const selected = pills.filter((el) => el.classList.contains('selected'));
      if (selected.length === 1) {
        last = selected[0];
        return;
      }
      pills.forEach((el) => {
        el.classList.remove('selected');
        el.setAttribute('aria-pressed', 'false');
      });
      const pick = selected.length > 0 ? selected[0] : pills[0];
      pick.classList.add('selected');
      pick.setAttribute('aria-pressed', 'true');
      last = pick;
    });
    return last;
  }

  function selectStep4Pill(activeEl) {
    if (!activeEl) return;
    if (activeEl.classList.contains('selected')) return;
    const track = activeEl.closest('.step4-pill-track');
    const scope = track || pillsWrapper;
    scope.querySelectorAll('.step4-pill-button').forEach((btn) => {
      btn.classList.remove('selected');
      btn.setAttribute('aria-pressed', 'false');
    });
    activeEl.classList.add('selected');
    activeEl.setAttribute('aria-pressed', 'true');
    applyStep4PillSelection();
  }

  async function applyStep4PillSelection() {
    ensureExactlyOnePillPerTrack();
    if (folderKeyForPills) {
      await ensureConstructorCatalogFresh(folderKeyForPills);
      pillsWrapper.querySelectorAll('.step4-pill-button').forEach((el) => {
        const cid = resolveCategoryIdFromPillElement(el, folderKeyForPills);
        if (cid != null) el.dataset.categoryId = String(cid);
      });
    }
    const list = buildSelectedPillFilters();
    pillsWrapper.querySelectorAll('.step4-pill-button').forEach((btn) => {
      btn.setAttribute(
        'aria-pressed',
        btn.classList.contains('selected') ? 'true' : 'false'
      );
    });
    await loadSavedModels(resolvedFolderId, grid, list);
    requestAnimationFrame(() => updateStep4PillSliders());
  }

  function createStep4PillButton(btn, idx, selectOnFirst) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'step4-pill-button';
    el.setAttribute('aria-pressed', 'false');
    const catId = resolvePillCategoryId(btn, folderKeyForPills);
    const orCatId = btn.orCategoryId != null ? btn.orCategoryId : null;
    const doorFilter = inferCabinetDoorFilter(btn);
    const doorBadge =
      doorFilter === 'single'
        ? ' <small>(.)</small>'
        : doorFilter === 'double'
          ? ' <small>(.)</small>'
          : '';
    el.innerHTML =
      '<span>' +
      (btn.name || `Кнопка ${idx + 1}`).replace(/</g, '&lt;') +
      doorBadge +
      '</span>';
    if (selectOnFirst) {
      el.classList.add('selected');
      el.setAttribute('aria-pressed', 'true');
    }
    el.dataset.categoryId = catId != null ? String(catId) : '';
    el.dataset.orCategoryId = orCatId != null ? String(orCatId) : '';
    el.dataset.cabinetDoorFilter = doorFilter || '';
    el.addEventListener('click', () => {
      selectStep4Pill(el);
    });
    return el;
  }

  function groupPillItemsByRow(pills) {
    const map = new Map();
    pills.forEach((p) => {
      let g = p.pillGroup != null ? Number(p.pillGroup) : 0;
      if (!Number.isFinite(g) || g < 0) g = 0;
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(p);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map((entry) =>
        entry[1].slice().sort((a, b) => (a.order || 0) - (b.order || 0))
      );
  }

  if (pillItems.length > 0) {
    const pillRows = groupPillItemsByRow(pillItems);
    let globalIdx = 0;
    pillRows.forEach((rowItems) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'step4-pill-row';
      const track = document.createElement('div');
      track.className = 'step4-pill-track';
      track.setAttribute('role', 'radiogroup');
      track.dataset.pillCount = String(rowItems.length || 2);
      const slider = document.createElement('div');
      slider.className = 'step4-pill-slider';
      slider.setAttribute('aria-hidden', 'true');
      track.appendChild(slider);
      rowItems.forEach((btn, j) => {
        track.appendChild(createStep4PillButton(btn, globalIdx, j === 0));
        globalIdx += 1;
      });
      rowEl.appendChild(track);
      pillsWrapper.appendChild(rowEl);
    });
  }

  container.appendChild(filtersHost);
  container.appendChild(grid);

  // :       ,  =  ().
  if (pillItems.length > 0) {
    applyStep4PillSelection();
    requestAnimationFrame(() => updateStep4PillSliders());
  } else {
    loadSavedModels(resolvedFolderId, grid, []);
  }

  /**
   * -       .
   * doorKind: 'single' | 'double'
   * Ищет первую пилюлю с cabinetDoorFilter = doorKind.
   *        (/).
   *     (  ).
   */
  window.__clodisAutoSwitchCatalogForZone = function (doorKind) {
    if (!doorKind) return;
    const tracks = Array.from(
      pillsWrapper.querySelectorAll('.step4-pill-track')
    );
    if (tracks.length === 0) return;

    let target = null;
    for (const track of tracks) {
      const pills = Array.from(track.querySelectorAll('.step4-pill-button'));
      const doorPills = pills.filter((el) => {
        const d = el.dataset.cabinetDoorFilter;
        return d === 'single' || d === 'double';
      });
      if (doorPills.length === 0) continue;
      const byAttr = doorPills.find(
        (el) => el.dataset.cabinetDoorFilter === doorKind
      );
      if (byAttr) {
        target = byAttr;
        break;
      }
      const isSingle = doorKind === 'single';
      const byName = doorPills.find((el) => {
        const t = (el.textContent || '').toLowerCase();
        return isSingle
          ? /||single|/.test(t)
          : /||double|/.test(t);
      });
      if (byName) {
        target = byName;
        break;
      }
    }

    if (!target) return;
    selectStep4Pill(target);
  };

  setTimeout(() => {
    try {
      buildStep4SectionEditIcons();
    } catch (e) {
      console.warn('[STEP4] buildStep4SectionEditIcons:', e);
    }
  }, 250);
}

// Step 3: furniture selection now delegates to catalog folders
function buildFurnitureStep(container) {
  buildCatalogFoldersStep(container);
}

// ──       5 ──
function showStep5ParamPopup(title, text) {
  let overlay = document.getElementById('step5-param-popup-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'step5-param-popup-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);';

  const card = document.createElement('div');
  card.style.cssText = 'background:#fff;border-radius:16px;padding:28px 24px 20px;max-width:420px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,0.18);position:relative;font-family:"Cera Pro",Arial,sans-serif;';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.style.cssText = 'position:absolute;top:12px;right:14px;border:none;background:transparent;font-size:22px;color:#999;cursor:pointer;line-height:1;';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => overlay.remove());
  card.appendChild(closeBtn);

  if (title) {
    const h = document.createElement('h3');
    h.style.cssText = 'margin:0 0 12px;font-size:18px;font-weight:700;color:#111;';
    h.textContent = title;
    card.appendChild(h);
  }

  const body = document.createElement('div');
  body.style.cssText = 'font-size:14px;line-height:1.6;color:#444;white-space:pre-wrap;';
  body.textContent = text || '';
  card.appendChild(body);

  overlay.appendChild(card);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

const STEP5_PARAMS_SELECTIONS_KEY = 'room_step5_params_selection';
function getStep5ParamsSelections() {
  try {
    const raw = localStorage.getItem(STEP5_PARAMS_SELECTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}
function setStep5ParamSelection(paramKey, value) {
  if (!paramKey) return;
  const map = getStep5ParamsSelections();
  map[paramKey] = value;
  try { localStorage.setItem(STEP5_PARAMS_SELECTIONS_KEY, JSON.stringify(map)); } catch (_) {}
  try {
    //   ,     5 .
    window.dispatchEvent(new CustomEvent('step5-params-changed', { detail: { key: paramKey, value } }));
  } catch (_) {}
}

// Step 5: color & finish selection (панель с овальными кнопками + цветовой круг)
function buildColorStep(container) {
  container.innerHTML = '';

  // ──   ( + 3  + ) ──
  const wrapper = document.createElement('div');
  wrapper.className = 'step5-panel';

  const title = document.createElement('h2');
  title.className = 'step5-title';
  title.textContent = 'Выберите цвет и варианты своей одежды.';
  wrapper.appendChild(title);

  const tabs = document.createElement('div');
  tabs.className = 'step5-tabs';

  const config = getRoomStepsConfig();
  let tabDefs = [
    { key: 'outside', label: 'Снаружи', desc: '' },
    { key: 'inside',  label: 'Внутри',  desc: '' },
    { key: 'params',  label: 'Параметры', desc: '' },
  ];
  if (config && config.steps) {
    const step5 = config.steps.find((s) => s.stepId === 5);
    if (step5 && step5.step5Tabs) {
      tabDefs = [
        {
          key: 'outside',
          label: (step5.step5Tabs.outside && step5.step5Tabs.outside.label) || 'Снаружи',
          desc:  (step5.step5Tabs.outside && step5.step5Tabs.outside.desc)  || '',
        },
        {
          key: 'inside',
          label: (step5.step5Tabs.inside && step5.step5Tabs.inside.label) || 'Внутри',
          desc:  (step5.step5Tabs.inside && step5.step5Tabs.inside.desc)  || '',
        },
        {
          key: 'params',
          label: (step5.step5Tabs.params && step5.step5Tabs.params.label) || 'Параметры',
          desc:  (step5.step5Tabs.params && step5.step5Tabs.params.desc)  || '',
        },
      ];
    }
  }

  let activeKey = 'outside';
  window.step5DecorTarget = activeKey;

  const hint = document.createElement('div');
  hint.className = 'step5-tabs-hint';

  const updateHint = () => {
    const def = tabDefs.find((t) => t.key === activeKey);
    hint.textContent = def && def.desc ? def.desc : '';
  };

  // ──    ──
  const wheelHost = document.createElement('div');
  wheelHost.className = 'step5-wheel-placeholder';

  // ──    ──
  const paramsHost = document.createElement('div');
  paramsHost.className = 'step5-params-host';
  paramsHost.style.display = 'none';

  const syncPanels = () => {
    if (activeKey === 'params') {
      wheelHost.style.display = 'none';
      paramsHost.style.display = '';
    } else {
      wheelHost.style.display = '';
      paramsHost.style.display = 'none';
    }
  };

  //      
  const buildParamsContent = () => {
    paramsHost.innerHTML = '';
    let items = [];
    if (config && config.steps) {
      const s5 = config.steps.find((s) => s.stepId === 5);
      if (s5 && Array.isArray(s5.step5ParamsItems)) items = s5.step5ParamsItems;
    }
    if (items.length === 0) {
      paramsHost.innerHTML = '<p style="color:#888;font-size:14px;padding:12px 0;">Параметры не настроены.</p>';
      return;
    }
    items.forEach((it) => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:12px 0;border-bottom:1px solid #eee;';

      const top = document.createElement('div');
      top.style.cssText = 'display:flex;align-items:center;gap:10px;';

      const labelEl = document.createElement('span');
      labelEl.style.cssText = 'flex:1;font-size:15px;font-weight:500;color:#222;';
      labelEl.textContent = it.label || '';
      top.appendChild(labelEl);

      if (it.popupText) {
        const helpBtn = document.createElement('button');
        helpBtn.type = 'button';
        helpBtn.style.cssText = 'width:26px;height:26px;border-radius:50%;border:1.5px solid #999;background:transparent;color:#666;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
        helpBtn.textContent = '?';
        helpBtn.title = it.popupTitle || it.label || '';
        helpBtn.addEventListener('click', () => {
          showStep5ParamPopup(it.popupTitle || it.label || 'Информация', it.popupText);
        });
        top.appendChild(helpBtn);
      }
      row.appendChild(top);

      let opts = Array.isArray(it.options) ? it.options.filter(Boolean) : [];
      const selectedRaw = (it.selectedOption || '').toString().trim();
      //    default,          .
      if (selectedRaw && !opts.includes(selectedRaw)) opts = [selectedRaw].concat(opts);
      //  :      "/"     .
      if (opts.length === 1) {
        const one = (opts[0] || '').toString().trim().toLowerCase();
        if (one === 'да') opts.push('Нет');
        else if (one === 'нет') opts.push('Да');
      }
      if (opts.length > 0) {
        const optionsWrap = document.createElement('div');
        optionsWrap.style.cssText = 'display:inline-flex;gap:0;background:#eaf0fa;border-radius:999px;padding:4px;margin-top:10px;';
        const pKey = (it.label || it.key || it.id || '').toString();
        const savedSelections = getStep5ParamsSelections();
        const savedRaw = (savedSelections[pKey] || '').toString().trim();
        let selected =
          savedRaw && opts.includes(savedRaw)
            ? savedRaw
            : (selectedRaw && opts.includes(selectedRaw) ? selectedRaw : opts[0]);
        opts.forEach((opt) => {
          const b = document.createElement('button');
          b.type = 'button';
          const active = opt === selected;
          b.style.cssText = [
            'border:1.5px solid #2b7cff',
            'border-radius:999px',
            'padding:6px 18px',
            'background:' + (active ? '#fff' : 'transparent'),
            'color:' + (active ? '#111' : '#2b7cff'),
            'font-size:18px',
            'font-weight:600',
            'cursor:pointer',
            'min-width:96px',
            'line-height:1.2'
          ].join(';');
          b.textContent = opt;
          b.addEventListener('click', () => {
            selected = opt;
            setStep5ParamSelection(pKey, selected);
            optionsWrap.querySelectorAll('button').forEach((x) => {
              const isActive = x.textContent === selected;
              x.style.background = isActive ? '#fff' : 'transparent';
              x.style.color = isActive ? '#111' : '#2b7cff';
            });
          });
          optionsWrap.appendChild(b);
        });
        //    storage,      .
        setStep5ParamSelection(pKey, selected);
        row.appendChild(optionsWrap);
      }

      if (it.hintText) {
        const hint = document.createElement('div');
        hint.style.cssText = 'margin-top:10px;color:#555;font-size:14px;line-height:1.4;';
        hint.textContent = it.hintText;
        row.appendChild(hint);
      }
      paramsHost.appendChild(row);
    });
  };

  buildParamsContent();

  tabDefs.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'step5-tab' + (key === activeKey ? ' step5-tab--active' : '');
    btn.textContent = label;
    btn.dataset.tabKey = key;
    btn.addEventListener('click', () => {
      activeKey = key;
      if (key === 'outside' || key === 'inside') window.step5DecorTarget = key;
      tabs.querySelectorAll('.step5-tab').forEach((b) => b.classList.remove('step5-tab--active'));
      btn.classList.add('step5-tab--active');
      updateHint();
      syncPanels();
    });
    tabs.appendChild(btn);
  });

  wrapper.appendChild(tabs);
  updateHint();
  wrapper.appendChild(hint);
  wrapper.appendChild(wheelHost);
  wrapper.appendChild(paramsHost);

  try {
    initColorWheel(wheelHost);
    wheelHost.addEventListener('step5-decor-selected', (e) => {
      //         traverse   .
      if (e?.detail?.moduleOnly) return;
      refreshFurnitureDecors();
    });
  } catch (e) {
    console.warn('⚠️       5:', e);
  }

  container.appendChild(wrapper);

  //   title +  ( /  / ).
  try {
    const sidebarContent = document.getElementById('sidebar-content');
    if (sidebarContent) sidebarContent.scrollTop = 0;
    requestAnimationFrame(() => {
      try {
        if (sidebarContent) sidebarContent.scrollTop = 0;
        if (typeof wrapper.scrollIntoView === 'function') {
          wrapper.scrollIntoView({ block: 'start', inline: 'nearest' });
        }
      } catch (_) {}
    });
  } catch (_) {}

  // ──      (,   ) ──
  const modulePanel = document.createElement('div');
  modulePanel.className = 'step5-module-panel';
  modulePanel.style.display = 'none';

  //  +   X
  const mpHeader = document.createElement('div');
  mpHeader.className = 'step5-module-panel__header';

  const mpTitle = document.createElement('span');
  mpTitle.className = 'step5-module-panel__title';
  mpTitle.textContent = 'Выберите цвет модуля';

  const mpSaveBtn = document.createElement('button');
  mpSaveBtn.type = 'button';
  mpSaveBtn.className = 'step5-module-panel__save-btn';
  mpSaveBtn.innerHTML = 'Сохранить <span class="step5-module-panel__close-x">✕</span>';
  mpSaveBtn.addEventListener('click', () => {
    try {
      if (
        typeof window.persistStep5ModuleDecorForGroup === 'function' &&
        window.step5EditingFurnitureGroup
      ) {
        window.persistStep5ModuleDecorForGroup(window.step5EditingFurnitureGroup);
      }
    } catch (e) {
      console.warn('[STEP5] сохранение декора модуля:', e);
    }
    deselectAllStep5Furniture();
  });

  mpHeader.appendChild(mpTitle);
  mpHeader.appendChild(mpSaveBtn);

  //   .      .
  const mpTabs = document.createElement('div');
  mpTabs.className = 'step5-tabs step5-module-tabs';

  let mpActiveKey = 'outside';
  const mpTabDefs = [
    { key: 'outside', label: 'Цвет фасада' },
    { key: 'inside',  label: 'Цвет корпуса' },
    { key: 'endOverlay', label: 'Цвет накладки' },
  ];
  mpTabDefs.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'step5-tab' + (key === mpActiveKey ? ' step5-tab--active' : '');
    btn.textContent = label;
    btn.dataset.moduleDecorTarget = key;
    btn.addEventListener('click', () => {
      mpActiveKey = key;
      window.step5DecorTarget = key;
      mpTabs.querySelectorAll('.step5-tab').forEach((b) => b.classList.remove('step5-tab--active'));
      btn.classList.add('step5-tab--active');
    });
    mpTabs.appendChild(btn);
  });

  //      (  wheelHost )
  modulePanel.appendChild(mpHeader);
  modulePanel.appendChild(mpTabs);
  // wheelHost   wrapper           

  container.appendChild(modulePanel);

  // ──     ──
  window.showStep5ModuleColorPanel = (group) => {
    window.step5EditingFurnitureGroup = group || null;
    modulePanel.appendChild(wheelHost);
    wrapper.style.display = 'none';
    modulePanel.style.display = 'flex';
    mpActiveKey = 'outside';
    window.step5DecorTarget = 'outside';
    const isEndCabinet = group?.userData?.isEndCabinet === true;
    mpTabs.querySelectorAll('.step5-tab').forEach((b) => {
      b.classList.remove('step5-tab--active');
      if (b.dataset.moduleDecorTarget === 'endOverlay') {
        b.style.display = isEndCabinet ? '' : 'none';
      }
    });
    const firstBtn = mpTabs.querySelector('.step5-tab');
    if (firstBtn) firstBtn.classList.add('step5-tab--active');
  };

  window.hideStep5ModuleColorPanel = () => {
    window.step5EditingFurnitureGroup = null;
    modulePanel.style.display = 'none';
    wrapper.style.display = '';
    wrapper.appendChild(wheelHost);
    window.step5DecorTarget = activeKey;
  };

  // ──        ──
  setTimeout(() => {
    try {
      buildStep5FurnitureIcons();
      setStep5SectionZonesVisible(false);
      setStep5CabinetMarkersVisible(false);
    } catch (e) {
      console.warn('[STEP5] buildStep5FurnitureIcons error:', e);
    }
  }, 200);
}

export function goToStep(stepNumber, stepTitle, stepBuilder) {
  const prevStep = typeof window.currentRoomStep === 'number' ? window.currentRoomStep : null;
  // Сразу, чтобы lifestyle/rod adapt видели целевой шаг при leave/enter.
  window.currentRoomStep = stepNumber;
  if (prevStep === 4 && stepNumber !== 4) {
    try {
      clearStep4SectionEditIcons();
      clearFurnitureCatalogNameLabels();
    } catch (e) {}
  }
  if (prevStep === 5 && stepNumber !== 5) {
    try {
      clearFurnitureCatalogNameLabels();
      deselectAllStep5Furniture();
      clearStep5FurnitureIcons();
      setStep5CabinetMarkersVisible(true);
    } catch (e) {}
  }
  if (prevStep === 6 && stepNumber !== 6) {
    try {
      setStep5CabinetMarkersVisible(true);
    } catch (e) {}
  }
  if (prevStep === 7 && stepNumber !== 7) {
    try {
      syncRoomLifestyleForStep(stepNumber, window.__cldRoomScene);
    } catch (e) {}
  }

  const stepBadge = document.querySelector('.step-badge');
  const stepTitleEl = document.querySelector('.step-title');
  const stepDescEl = document.getElementById('cld-step-description');
  if (stepBadge) stepBadge.textContent = formatRoomStepCounter(stepNumber);
  if (stepTitleEl) stepTitleEl.textContent = stepTitle;
  if (stepDescEl) {
    if (stepNumber === 2) {
      stepDescEl.textContent =
        ',     .     .';
      stepDescEl.hidden = false;
    } else if (stepNumber === 3) {
      stepDescEl.textContent =
        '     .     .';
      stepDescEl.hidden = false;
    } else if (stepNumber === 4) {
      stepDescEl.textContent =
        '     .';
      stepDescEl.hidden = false;
    } else {
      stepDescEl.textContent = '';
      stepDescEl.hidden = true;
    }
  }
  syncRoomStepProgress(stepNumber);

  const stepIndicator = document.querySelector('.sidebar-footer .step-indicator');
  if (stepIndicator) stepIndicator.textContent = formatRoomStepCounter(stepNumber);

  // Запоминаем текущий шаг в runtime (без localStorage, чтобы не залипать на шаге при перезагрузке)
  window.currentRoomStep = stepNumber;
  syncCldStepFloatLabel();
  syncCldStepBackButtons(stepNumber);
  setRoomDoorControlsVisible(stepNumber);
  try {
    syncAllDimsButtonVisibility();
  } catch (_) {}

  const backBtn = document.getElementById('sidebar-back-btn');
  if (backBtn) {
    if (stepNumber === 1) backBtn.classList.add('hidden');
    else backBtn.classList.remove('hidden');
  }
  syncCldStepBackButtons(stepNumber);

  const mainMenuView = document.getElementById('main-menu-view');
  if (mainMenuView && stepBuilder) {
    mainMenuView.innerHTML = '';
    stepBuilder(mainMenuView);
  }

  //        (  
  // каталога шага 4 title/вкладки шага 5 остаются «поднятыми» за viewport).
  try {
    const sidebarContent = document.getElementById('sidebar-content');
    if (sidebarContent) sidebarContent.scrollTop = 0;
  } catch (_) {}

  //        "" .
  const nextBtn = document.getElementById('sidebar-next-btn');
  if (nextBtn) nextBtn.disabled = false;

  if (typeof window.updatePriceSublineForStep === 'function') {
    window.updatePriceSublineForStep(stepNumber);
  }

  setTimeout(() => {
    try {
      if (typeof window.refreshTrimPartNumberLabels === 'function' && window.__cldRoomScene) {
        window.refreshTrimPartNumberLabels(window.__cldRoomScene);
      }
    } catch (e) {
      console.warn('[TRIM-LABEL] goToStep refresh', e);
    }
  }, 320);

  //  13:    ; /    , .
  if (stepNumber >= 1 && stepNumber <= 3) {
    try {
      setStep5SectionZonesVisible(false);
      setStep5CabinetMarkersVisible(true);
    } catch (e) {}
  }

  // Шаг 4: зоны/Cap скрыты; синяя разметка секций (cabinet-markers) — видна для посадки.
  if (stepNumber === 4) {
    setDesiredRoomOpenState(true);
    try {
      setStep5SectionZonesVisible(false);
      setStep5CabinetMarkersVisible(true);
    } catch (e) {}
    //   :  ,     .
    try {
      if (typeof window.__cldClearRoomOpeningSelection === 'function') {
        window.__cldClearRoomOpeningSelection();
      }
    } catch (_) {}
    setTimeout(() => {
      try {
        // Полный rebuild только при первом заходе на 4 (с 3) или смене тогглов (change-handler).
        // Возврат с 5/6/7 → rebuild снова раздувал угловой до стены (§6.8.3).
        const fromLaterStep =
          prevStep === 5 || prevStep === 6 || prevStep === 7;
        if (!fromLaterStep) {
          if (typeof rebuildAllRoomFurnitureForStep4Toggles === 'function') {
            rebuildAllRoomFurnitureForStep4Toggles();
          } else if (typeof window.__cldRebuildFurnitureForStep4Toggles === 'function') {
            window.__cldRebuildFurnitureForStep4Toggles();
          }
        }
      } catch (e) {
        console.warn('[step4] interior fill rebuild failed', e);
      }
      try {
        refreshFurnitureCatalogNameLabels();
      } catch (e) {}
    }, 280);
    scheduleRoomHandleAndDoorSync({ retryHandles: true, delayMs: 120 });
  }
  if (stepNumber === 5) {
    setDesiredRoomOpenState(false);
    //   +Soft+         4  OOM.
    setTimeout(() => {
      try {
        refreshFurnitureCatalogNameLabels();
      } catch (e) {}
    }, 480);
    scheduleRoomHandleAndDoorSync({ retryHandles: true, delayMs: 520 });
    setTimeout(() => {
      try {
        if (typeof window.__cldFrameCameraToFurnitureClose === 'function') {
          window.__cldFrameCameraToFurnitureClose({
            padding: 1.2,
            pull: 0.95,
            instant: true,
          });
        }
      } catch (e) {
        console.warn('[step5] composition camera frame failed', e);
      }
    }, 700);
  }
  if (stepNumber === 6) {
    try {
      setStep5SectionZonesVisible(false);
      setStep5CabinetMarkersVisible(false);
    } catch (e) {}
    setTimeout(() => {
      try {
        if (typeof window.__cldRetryFacadeHandles === 'function') {
          window.__cldRetryFacadeHandles();
        }
      } catch (e) {
        console.warn('[STEP6] handle retry on enter:', e);
      }
    }, 400);
    scheduleRoomHandleAndDoorSync({ retryHandles: false, delayMs: 420 });
  }
  if (stepNumber === 7) {
    setDesiredRoomOpenState(true);
    try {
      setStep5SectionZonesVisible(false);
      setStep5CabinetMarkersVisible(false);
    } catch (e) {}
    // Сначала двери, потом lifestyle (одежда 10–16 МБ/штанга) — иначе Crashpad.
    scheduleRoomHandleAndDoorSync({ retryHandles: false, delayMs: 280 });
    setTimeout(() => {
      try {
        applyDesiredRoomOpenState();
      } catch (e) {}
    }, 400);
    setTimeout(() => {
      try {
        syncRoomLifestyleForStep(7, window.__cldRoomScene)
          .then(() => {
            try {
              if (typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
                window.__cldScheduleIkeaRoomLightSync();
              }
            } catch (_) {}
          })
          .catch((e) => console.warn('[STEP7] lifestyle sync:', e));
      } catch (e) {
        console.warn('[STEP7] lifestyle sync:', e);
      }
    }, 1400);
  } else {
    try {
      syncRoomLifestyleVisibility(window.__cldRoomScene);
    } catch (e) {}
  }

  syncLastStepNextButtons(stepNumber);
}

function syncLastStepNextButtons(stepNumber) {
  const n = Number(stepNumber) || 1;
  const hide = n >= ROOM_STEP_TOTAL;
  ['sidebar-next-btn', 'sidebar-next-btn-top', 'cld-step-float-next'].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (hide) btn.classList.add('hidden');
    else btn.classList.remove('hidden');
  });
}

export function goToRoomStepByNumber(stepNumber) {
  const step = Number(stepNumber);
  if (!Number.isFinite(step) || step < 1 || step > ROOM_STEP_TOTAL) return false;
  if (step === 1) {
    goToStep(1, getStepTitle(1, 'ТИП КОМНАТЫ'), legacyBuildRoomTypeStep);
  } else if (step === 2) {
    goToStep(2, getStepTitle(2, 'РАСПОЛОЖЕНИЕ'), legacyBuildRoomLayoutStep);
  } else if (step === 3) {
    goToStep(3, getStepTitle(3, 'С чего начнём?'), buildCatalogFoldersStep);
  } else if (step === 4) {
    const folder = window.selectedCatalogFolder;
    if (folder) {
      const title = folder.name || folder.id;
      goToStep(4, title, (container) =>
        buildCatalogStep4(container, folder.id, folder.name || folder.id)
      );
    } else {
      goToStep(4, getStepTitle(4, 'Модули'), (container) =>
        buildCatalogStep4(container, null, 'Модули')
      );
    }
  } else if (step === 5) {
    goToStep(5, getStepTitle(5, 'Цвет и отделка'), buildColorStep);
  } else if (step === 6) {
    goToStep(6, getStepTitle(6, 'РУЧКИ'), buildHandlesStep);
  } else if (step === 7) {
    goToStep(7, getStepTitle(7, 'НАПОЛНЕНИЕ'), buildLifestyleStep);
  }
  syncCldStepFloatLabel();
  if (step >= 4) {
    try {
      window.__cldSyncAllRoomCabinetStudio?.(window.__cldRoomScene);
    } catch (e) {
      console.warn('[IKEA v0] cabinet sync on step', step, e);
    }
  }
  return true;
}

function syncCldStepFloatLabel() {
  const step = Number(window.currentRoomStep) || 1;
  const label = formatRoomStepCounter(step);
  const el = document.getElementById('cld-step-float-label');
  const top = document.getElementById('step-indicator-top');
  const foot = document.querySelector('.sidebar-footer .step-indicator');
  if (el) el.textContent = label;
  if (top) top.textContent = label;
  if (foot) foot.textContent = label;
}

function syncCldStepBackButtons(stepNumber) {
  const ids = ['sidebar-back-btn', 'sidebar-back-btn-top', 'cld-step-float-back'];
  ids.forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (stepNumber === 1) btn.classList.add('hidden');
    else btn.classList.remove('hidden');
  });
}

function triggerRoomStepNext() {
  const currentStep = getCurrentStepNumber();
  if (currentStep === 1) {
    goToStep(2, getStepTitle(2, 'РАСПОЛОЖЕНИЕ'), legacyBuildRoomLayoutStep);
  } else if (currentStep === 2) {
    goToStep(3, getStepTitle(3, 'С чего начнём?'), buildCatalogFoldersStep);
  } else if (currentStep === 3) {
    const folder = window.selectedCatalogFolder;
    if (folder) {
      const title = folder.name || folder.id;
      goToStep(4, title, (container) =>
        buildCatalogStep4(container, folder.id, folder.name || folder.id)
      );
    } else {
      goToStep(4, getStepTitle(4, 'Модули'), (container) =>
        buildCatalogStep4(container, null, 'Модули')
      );
    }
  } else if (currentStep === 4) {
    goToStep(5, getStepTitle(5, 'Цвет и отделка'), buildColorStep);
  } else if (currentStep === 5) {
    goToStep(6, getStepTitle(6, 'РУЧКИ'), buildHandlesStep);
  } else if (currentStep === 6) {
    goToStep(7, getStepTitle(7, 'НАПОЛНЕНИЕ'), buildLifestyleStep);
  }
}

function bindCldStepFloatNav() {
  const pairs = [
    ['sidebar-back-btn-top', () => goToPreviousStep()],
    ['cld-step-float-back', () => goToPreviousStep()],
    ['sidebar-next-btn-top', () => triggerRoomStepNext()],
    ['cld-step-float-next', () => triggerRoomStepNext()],
  ];
  pairs.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.cldBound) return;
    el.dataset.cldBound = '1';
    el.addEventListener('click', fn);
  });
  syncCldStepFloatLabel();
  syncCldStepBackButtons(Number(window.currentRoomStep) || 1);
}

export function goToPreviousStep() {
  const stepIndicator = document.querySelector('.step-indicator');
  const currentStep = stepIndicator
    ? parseInt(stepIndicator.textContent.match(/\d+/)[0])
    : 1;

  if (currentStep === 1) return;

  if (currentStep === 2) {
    goToStep(1, getStepTitle(1, 'ТИП КОМНАТЫ'), legacyBuildRoomTypeStep);
    if (window.selectedRoomType) {
      setTimeout(() => {
        const roomItem = document.querySelector(
          `[data-room-type=\"${window.selectedRoomType.key}\"]`
        );
        if (roomItem) {
          roomItem.classList.add('selected');
          const nextBtn = document.getElementById('sidebar-next-btn');
          if (nextBtn) nextBtn.disabled = false;
        }
      }, 100);
    }
  } else if (currentStep === 3) {
    if (window.step3CatalogOpen) {
      window.step3CatalogOpen = false;
      const cabinetsView = document.getElementById('cabinets-view');
      const mainMenuView = document.getElementById('main-menu-view');
      if (cabinetsView) cabinetsView.classList.remove('active');
      if (mainMenuView) mainMenuView.classList.add('active');
    } else {
    goToStep(2, getStepTitle(2, 'РАСПОЛОЖЕНИЕ'), legacyBuildRoomLayoutStep);
      if (window.selectedRoomLayout) {
        setTimeout(() => {
          const layoutItem = document.querySelector(
            `[data-layout-type=\"${window.selectedRoomLayout.key}\"]`
          );
          if (layoutItem) {
            layoutItem.classList.add('selected');
            const nextBtn = document.getElementById('sidebar-next-btn');
            if (nextBtn) nextBtn.disabled = false;
          }
        }, 100);
      }
    }
  } else if (currentStep === 4) {
    goToStep(3, getStepTitle(3, 'С чего начнём?'), buildCatalogFoldersStep);
    if (window.selectedCatalogFolder) {
      setTimeout(() => {
        const id = String(window.selectedCatalogFolder.id);
        const selector = `[data-catalog-folder-id="${CSS.escape(id)}"]`;
        const item = document.querySelector(selector);
        if (item && item.parentNode) {
          item.parentNode
            .querySelectorAll('.room-type-item')
            .forEach((i) => i.classList.remove('selected'));
          item.classList.add('selected');
          const nextBtn = document.getElementById('sidebar-next-btn');
          if (nextBtn) nextBtn.disabled = false;
        }
      }, 50);
    }
  } else if (currentStep === 7) {
    goToStep(6, getStepTitle(6, 'РУЧКИ'), buildHandlesStep);
  } else if (currentStep === 6) {
    goToStep(5, getStepTitle(5, 'Цвет и отделка'), buildColorStep);
  } else if (currentStep === 5) {
    try {
      deselectAllStep5Furniture();
      clearStep5FurnitureIcons();
    } catch (e) {}

    //    5   4 ()
    const folder = window.selectedCatalogFolder;
    if (folder) {
      const title = folder.name || folder.id;
      goToStep(4, title, (container) =>
        buildCatalogStep4(container, folder.id, folder.name || folder.id)
      );
    } else {
      goToStep(4, getStepTitle(4, 'Модули'), (container) =>
        buildCatalogStep4(container, null, 'Модули')
      );
    }
  }
}

export function initRoomSteps() {
  //     () → localStorage,  UI.
  hydrateRoomStepsConfigFromServer()
    .catch(() => false)
    .finally(() => initRoomStepsAfterConfig());
}

function initRoomStepsAfterConfig() {
  installRoomLifestyleStepApi(window);
  //  :     5      .
  try {
    localStorage.removeItem('room_step5_decor_selection');
  } catch (e) {}
  try {
    initStep5DefaultDecorsFromRoomConfig({ force: true });
  } catch (e) {
    console.warn('[STEP5] initStep5DefaultDecorsFromRoomConfig:', e);
  }
  try {
    localStorage.removeItem('room_step6_handle_selection');
  } catch (e) {}
  try {
    initStep6DefaultHandlesFromRoomConfig();
    const curStep = Number(window.currentRoomStep) || 0;
    if (curStep >= 4) {
      setTimeout(() => {
        try {
          if (typeof window.__cldRetryFacadeHandles === 'function') {
            window.__cldRetryFacadeHandles();
          }
        } catch (_) {}
      }, 600);
      scheduleRoomHandleAndDoorSync({ retryHandles: false, delayMs: 720 });
    }
  } catch (e) {
    console.warn('[STEP6] initStep6DefaultHandlesFromRoomConfig:', e);
  }

  const nextBtn = document.getElementById('sidebar-next-btn');
  const backBtn = document.getElementById('sidebar-back-btn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      goToPreviousStep();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => triggerRoomStepNext());
  }

  //    : ,   ""
  //   ,   ‑     .
  if (!window.__forceNextBtnEnabledInterval) {
    window.__forceNextBtnEnabledInterval = setInterval(() => {
      const btn = document.getElementById('sidebar-next-btn');
      if (btn && btn.disabled) {
        btn.disabled = false;
      }
    }, 300);
  }

  //  :    localStorage,  .
  const mainMenuView = document.getElementById('main-menu-view');
  if (mainMenuView) {
    //     1.
    const stepBadge = document.querySelector('.step-badge');
    const stepTitleEl = document.querySelector('.step-title');
    if (stepBadge) stepBadge.textContent = formatRoomStepCounter(1);
    if (stepTitleEl) stepTitleEl.textContent = getStepTitle(1, 'ТИП КОМНАТЫ');
    syncRoomStepProgress(1);
    legacyBuildRoomTypeStep(mainMenuView);
    window.currentRoomStep = 1;
    setRoomDoorControlsVisible(1);
    try {
      syncAllDimsButtonVisibility();
    } catch (_) {}
    const nextBtnInit = document.getElementById('sidebar-next-btn');
    if (nextBtnInit) nextBtnInit.disabled = false;
  }

  if (!window.__step6HandleRebuildBound) {
    window.__step6HandleRebuildBound = true;
    window.addEventListener('step6-handle-changed', () => {
      try {
        if (typeof window.__cldRebuildFurnitureForHandles === 'function') {
          window.__cldRebuildFurnitureForHandles();
        }
      } catch (e) {
        console.warn('[STEP6] handle rebuild:', e);
      }
    });
  }

  bindCldStepFloatNav();
  window.__cldGoToRoomStepImpl = goToRoomStepByNumber;
  window.__cldGoToRoomStep = goToRoomStepByNumber;
  window.__cldRoomStepNext = triggerRoomStepNext;
  window.__cldRoomStepBack = () => goToPreviousStep();
  if (window.__cldPendingRoomStep != null) {
    const pending = window.__cldPendingRoomStep;
    window.__cldPendingRoomStep = null;
    goToRoomStepByNumber(pending);
  }
}

/**  4    (   Apply ). */
export function openStep4ForEndCabinet() {
  const rule = getEndCabinetRule();
  let mode = null;
  try {
    mode =
      typeof window !== 'undefined' && window.__cldEndCabinetCatalogMode?.active
        ? window.__cldEndCabinetCatalogMode
        : null;
  } catch (_) {
    mode = null;
  }
  const title = String((mode && mode.label) || rule.label || 'Торцевой шкаф');
  try {
    const modal = document.getElementById('edit-section-modal');
    if (modal) modal.style.display = 'none';
  } catch (_) {}
  //      .
  if (window.selectedCatalogFolder?.id != null) {
    window.__cldFolderBeforeEndCabinet = { ...window.selectedCatalogFolder };
  }
  const folderId = String((mode && mode.catalogType) || rule.catalogType || '').trim() || null;
  goToStep(4, title, (container) => buildCatalogStep4(container, folderId, title));
}

/**    4 (       ). */
export function openStep4ForRegularCatalog() {
  const prev = window.__cldFolderBeforeEndCabinet || null;
  const folders = resolveCatalogFoldersForSteps();
  const fallback = folders.length ? folders[0] : null;
  const folder = prev || fallback;
  if (!folder) return;
  window.__cldFolderBeforeEndCabinet = null;
  window.selectedCatalogFolder = { id: folder.id, name: folder.name || folder.id };
  const title = String(folder.name || folder.id);
  goToStep(4, title, (container) => buildCatalogStep4(container, folder.id, title));
}

if (typeof window !== 'undefined') {
  window.__cldOpenStep4ForEndCabinet = openStep4ForEndCabinet;
  window.__cldOpenStep4ForRegularCatalog = openStep4ForRegularCatalog;
}

