/**
 * Room-edit doors (IKEA): catalog → click wall → place;
 * selected door: W×H, open INWARDS/OUTWARDS, handle LEFT/RIGHT, drag along wall.
 */
import { state } from '../utils/state.js';
import { updateMousePosition } from '../events/mouse-handler.js';
import { isIkeaRoomLightV0 } from '../furniture/ikea-light-gate.js?v=20260907-nospeed1';
import { installIkeaRoomLightV0 } from '../furniture/ikea-room-light-v0.js?v=20260913-hang-lite';

const CORNER_MARGIN_MM = 80;
const DEFAULT_DOOR_W_MM = 900;
const DEFAULT_DOOR_H_MM = 2100;
const DEFAULT_WINDOW_W_MM = 1200;
const DEFAULT_WINDOW_H_MM = 1200;
const DEFAULT_WINDOW_SILL_MM = 900;
/**
 * Смещение размерной линии от внутренней грани комнаты (мм).
 * Совпадает с наружным размером комнаты в scene-icons (IKEA: сегменты
 * заменяют «500 см» на той же линии). Ближе к стене ×2 vs 100+560.
 */
const DIM_OUT_MM = 100 + 280;
/** Длина засечки на концах сегмента (px экрана). */
const DIM_TICK_PX = 9;
const SVG_NS = 'http://www.w3.org/2000/svg';

let canvasBound = false;
let dimRaf = 0;
let selectedCatalog = null;
let selectedOpeningId = null;
/** UI-only: show catalog while object stays selected («Сменить модель»). */
let doorCatalogBrowse = false;
let windowCatalogBrowse = false;
let dragOpeningId = null;
let dragMoved = false;
let dragRaf = 0;
let pendingDragAlong = null;
let pendingDragWall = null;
let controlsWasEnabled = true;
/** Редактирование размера на плане: { key, openingId, kind: 'left'|'door'|'right' } */
let dimEditing = null;
let dimEditFocusKey = null;

function isTopView2d() {
  return window.__cldRoomEditView !== '3d';
}

function openings() {
  if (!Array.isArray(state.roomEditOpenings)) state.roomEditOpenings = [];
  return state.roomEditOpenings;
}

/** мм → см с одной десятой, запятая (2025 → «202,5 см»). Без округления до целых см. */
function formatDimCm(mm) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return '0 см';
  const cmVal = Math.round(n) / 10; // точность 1 мм = 0,1 см
  const text = cmVal.toFixed(1).replace('.', ',');
  return text + ' см';
}

/** Число см для полей ввода (десятые при необходимости). */
function mmToCmNumber(mm) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n) / 10;
}

function wallLength(room, wallName) {
  if (!room) return 0;
  if (typeof room.wallLengthOf === 'function') return room.wallLengthOf(wallName);
  return wallName === 'left' || wallName === 'right' ? room.depth : room.width;
}

function alongFromLocal(wallName, local) {
  if (wallName === 'front' || wallName === 'back') return local.x;
  return local.z;
}

function openingSpan(op) {
  return {
    a: op.alongMm - op.widthMm / 2,
    b: op.alongMm + op.widthMm / 2,
  };
}

function overlaps(wallName, along, width, ignoreId) {
  const a0 = along - width / 2;
  const b0 = along + width / 2;
  return openings().some((op) => {
    if (!op || op.wallName !== wallName) return false;
    if (ignoreId && op.id === ignoreId) return false;
    const s = openingSpan(op);
    return a0 < s.b - 1 && b0 > s.a + 1;
  });
}

function clampAlong(room, wallName, along, width) {
  const len = wallLength(room, wallName);
  const half = width / 2;
  const min = CORNER_MARGIN_MM + half;
  const max = len - CORNER_MARGIN_MM - half;
  if (max <= min) return len / 2;
  return Math.max(min, Math.min(max, along));
}

function hitWall(event) {
  if (!state.room || !state.raycaster || !state.camera) return null;
  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const room = state.room;
  const roomWorld = new THREE.Vector3();
  room.group.getWorldPosition(roomWorld);

  const localOf = (point) => point.clone().sub(roomWorld);

  const frames = ['front', 'back', 'left', 'right']
    .map((n) => room.walls && room.walls[n])
    .filter((m) => m && m.visible !== false);
  if (frames.length) {
    const frameHits = state.raycaster.intersectObjects(frames, false);
    if (frameHits.length) {
      const hit = frameHits[0];
      const wallName = hit.object.userData && hit.object.userData.wallName;
      if (wallName) {
        const local = localOf(hit.point);
        return { wallName, local, point: hit.point };
      }
    }
  }

  const extras = (room.openingExtras || []).filter(
    (m) => m && (m.userData.isRoomOpeningProxy || m.userData.isRoomOpeningFrame)
  );
  if (extras.length) {
    const exHits = state.raycaster.intersectObjects(extras, false);
    if (exHits.length) {
      const hit = exHits[0];
      const wallName = hit.object.userData && hit.object.userData.wallName;
      if (wallName) {
        const local = localOf(hit.point);
        return { wallName, local, point: hit.point };
      }
    }
  }

  if (room.wallPlanes && room.wallPlanes.length) {
    const planes = room.wallPlanes.filter((p) => p && p.visible !== false);
    const planeHits = state.raycaster.intersectObjects(planes, false);
    if (planeHits.length) {
      const hit = planeHits[0];
      const wallName = hit.object.userData && hit.object.userData.wallName;
      if (wallName) {
        const local = localOf(hit.point);
        return { wallName, local, point: hit.point };
      }
    }
  }

  const floor = room.floorCoating;
  if (floor) {
    const floorHits = state.raycaster.intersectObject(floor, false);
    if (floorHits.length) {
      const local = localOf(floorHits[0].point);
      const cand = [
        { wallName: 'back', d: local.z, along: local.x },
        { wallName: 'front', d: room.depth - local.z, along: local.x },
        { wallName: 'left', d: local.x, along: local.z },
        { wallName: 'right', d: room.width - local.x, along: local.z },
      ].sort((a, b) => a.d - b.d);
      const best = cand[0];
      if (best && best.d < 400) {
        return { wallName: best.wallName, local, point: floorHits[0].point };
      }
    }
  }
  return null;
}

function hitOpening(event) {
  const extras = state.room && state.room.openingExtras;
  if (!extras || !extras.length) return null;
  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const pick = extras.filter(
    (m) =>
      m &&
      (m.userData.isRoomOpening ||
        m.userData.isRoomOpeningLeaf ||
        m.userData.isRoomOpeningProxy)
  );
  const hits = state.raycaster.intersectObjects(pick, false);
  if (!hits.length) return null;
  return hits[0].object.userData.openingId || null;
}

function applyToRoom() {
  const room = state.room;
  if (!room || typeof room.applyOpenings !== 'function') return;
  room.applyOpenings(openings(), { selectedId: selectedOpeningId });
  if (isIkeaRoomLightV0() && openings().length) {
    installIkeaRoomLightV0();
  }
  if (typeof room.syncOpeningExtraMaterials === 'function') {
    room.syncOpeningExtraMaterials();
  }
  if (typeof room.updateWallVisibility === 'function' && state.camera) {
    room.updateWallVisibility(state.camera);
  }
  refreshOpeningDims();
  syncDoorEditor();
}

export function reapplyRoomEditOpenings() {
  applyToRoom();
}

function makeId() {
  return 'op-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e4).toString(36);
}

function catalogDefaults(item, type) {
  const isWindow = type === 'window' || (item && item.type === 'window');
  const w = Number(item && item.defaultWidthCm) * 10;
  const h = Number(item && item.defaultHeightCm) * 10;
  const sill = Number(item && item.defaultSillCm) * 10;
  if (isWindow) {
    return {
      type: 'window',
      widthMm: Number.isFinite(w) && w >= 400 ? w : DEFAULT_WINDOW_W_MM,
      heightMm: Number.isFinite(h) && h >= 400 ? h : DEFAULT_WINDOW_H_MM,
      sillMm: Number.isFinite(sill) && sill >= 0 ? sill : DEFAULT_WINDOW_SILL_MM,
      hasWindowsill: item && item.hasWindowsill === false ? false : true,
      kind: 'window',
      catalogId: (item && item.id) || '',
      name: (item && item.name) || 'Окно',
      thumb: (item && item.thumb) || '',
      modelUrl: (item && item.modelUrl) || '',
      finishId: (item && item.finishId) || 'white',
    };
  }
  return {
    type: 'door',
    widthMm: Number.isFinite(w) && w >= 400 ? w : DEFAULT_DOOR_W_MM,
    heightMm: Number.isFinite(h) && h >= 800 ? h : DEFAULT_DOOR_H_MM,
    sillMm: 0,
    hasWindowsill: false,
    kind: (item && item.kind) || 'interior',
    catalogId: (item && item.id) || '',
    name: (item && item.name) || 'Дверь',
    thumb: (item && item.thumb) || '',
    modelUrl: (item && item.modelUrl) || '',
    openingDirection: 'INWARDS',
    handleSide: 'LEFT',
  };
}

/** Порядок стен как у IKEA (вид сверху): дальняя → правая → ближняя → левая. */
const WALL_PLACE_ORDER = ['back', 'right', 'front', 'left'];

function placeCenteredOnFarWall(item, type) {
  if (!item || !state.room || !isTopView2d()) return false;
  const room = state.room;
  const def = catalogDefaults(item, type);
  // IKEA: центр стены без проёмов; если на дальней уже есть дверь/окно — соседняя стена
  const wallName = pickWallForNewOpening();
  const along = findFreeAlong(room, wallName, def.widthMm, null);
  if (along == null) return false;
  selectedCatalog = item;
  return pushOpening(wallName, along, def);
}

/**
 * IKEA: новый проём на первой стене без дверей/окон (старт — дальняя).
 * Если на всех стенах уже есть проёмы — дальняя, ищем свободное ближе к центру.
 */
function pickWallForNewOpening() {
  for (let i = 0; i < WALL_PLACE_ORDER.length; i++) {
    const wallName = WALL_PLACE_ORDER[i];
    const busy = openings().some((o) => o && o.wallName === wallName);
    if (!busy) return wallName;
  }
  return 'back';
}

/**
 * Центр выбранной стены; если участок занят — ближайшая свободная точка к центру.
 */
function findFreeAlong(room, wallName, widthMm, excludeId) {
  const len = wallLength(room, wallName);
  const preferred = len / 2;
  const along0 = clampAlong(room, wallName, preferred, widthMm);
  if (!overlaps(wallName, along0, widthMm, excludeId)) return along0;

  const half = widthMm / 2;
  const minA = half + CORNER_MARGIN_MM;
  const maxA = len - half - CORNER_MARGIN_MM;
  if (maxA < minA) return null;

  let best = null;
  let bestDist = Infinity;
  const step = 10;
  for (let a = minA; a <= maxA + 0.01; a += step) {
    const c = Math.min(maxA, a);
    if (overlaps(wallName, c, widthMm, excludeId)) continue;
    const d = Math.abs(c - preferred);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function pushOpening(wallName, along, def) {
  const room = state.room;
  if (!room || !def) return false;
  const isWindow = def.type === 'window';
  let sillMm = isWindow ? def.sillMm || 0 : 0;
  let heightMm = def.heightMm;
  const maxTop = room.height - 40;
  if (sillMm + heightMm > maxTop) {
    heightMm = Math.max(400, maxTop - sillMm);
  }
  if (sillMm + heightMm > maxTop) {
    sillMm = Math.max(0, maxTop - heightMm);
  }
  const op = {
    id: makeId(),
    type: isWindow ? 'window' : 'door',
    wallName,
    alongMm: along,
    widthMm: def.widthMm,
    heightMm,
    sillMm,
    hasWindowsill: isWindow ? !!def.hasWindowsill : false,
    kind: def.kind,
    catalogId: def.catalogId,
    name: def.name,
    thumb: def.thumb,
    modelUrl: def.modelUrl || '',
    finishId: isWindow ? (def.finishId || 'white') : undefined,
    openingDirection: def.openingDirection || 'INWARDS',
    handleSide: def.handleSide || 'LEFT',
  };
  openings().push(op);
  selectedOpeningId = op.id;
  selectedCatalog = null;
  doorCatalogBrowse = false;
  windowCatalogBrowse = false;
  if (isWindow && typeof window.__cldRoomEditSetPanel === 'function') {
    window.__cldRoomEditSetPanel('windows');
  } else if (!isWindow && typeof window.__cldRoomEditSetPanel === 'function') {
    window.__cldRoomEditSetPanel('doors');
  }
  applyToRoom();
  return true;
}

function isDoorsPanel() {
  return window.__cldRoomEditOpen && window.__cldRoomEditPanel === 'doors';
}

function isWindowsPanel() {
  return window.__cldRoomEditOpen && window.__cldRoomEditPanel === 'windows';
}

function isOpeningsPanel() {
  return isDoorsPanel() || isWindowsPanel();
}

function ensurePanelForOpening(op) {
  if (!op || typeof window.__cldRoomEditSetPanel !== 'function') return;
  if (op.type === 'window' && !isWindowsPanel()) window.__cldRoomEditSetPanel('windows');
  if (op.type !== 'window' && !isDoorsPanel()) window.__cldRoomEditSetPanel('doors');
}

function setControlsEnabled(on) {
  if (!state.controls) return;
  state.controls.enabled = !!on;
}

function flushDragAlong() {
  dragRaf = 0;
  if (!dragOpeningId || pendingDragAlong == null) return;
  const op = openings().find((o) => o.id === dragOpeningId);
  if (!op || !state.room) return;
  const wallName = pendingDragWall || op.wallName;
  const along = clampAlong(state.room, wallName, pendingDragAlong, op.widthMm);
  if (overlaps(wallName, along, op.widthMm, op.id)) return;
  if (wallName === op.wallName && Math.abs(along - op.alongMm) < 0.5) return;
  op.wallName = wallName;
  op.alongMm = along;
  dragMoved = true;
  applyToRoom();
}

function onCanvasMouseDown(e) {
  if (!isOpeningsPanel()) return;
  if (e.button !== 0) return;
  const existing = hitOpening(e);
  if (existing) {
    e.stopImmediatePropagation();
    e.preventDefault();
    selectedOpeningId = existing;
    selectedCatalog = null;
    doorCatalogBrowse = false;
    windowCatalogBrowse = false;
    ensurePanelForOpening(selectedOpening());
    // IKEA: drag / gizmo только в 2D; в 3D — только выделение
    if (isTopView2d()) {
      dragOpeningId = existing;
      dragMoved = false;
      pendingDragAlong = null;
      pendingDragWall = null;
      controlsWasEnabled = state.controls ? state.controls.enabled !== false : true;
      setControlsEnabled(false);
      document.body.classList.add('cld-room-edit-dragging-door');
    }
    syncDoorEditor();
    refreshOpeningDims();
    applyToRoom();
    return;
  }
}

function onCanvasMouseMove(e) {
  if (!dragOpeningId || !isOpeningsPanel() || !isTopView2d()) return;
  e.stopImmediatePropagation();
  const op = openings().find((o) => o.id === dragOpeningId);
  if (!op) return;
  const hit = hitWall(e);
  if (!hit) return;
  // IKEA: тянуть на любую стену
  pendingDragWall = hit.wallName;
  pendingDragAlong = alongFromLocal(hit.wallName, hit.local);
  if (!dragRaf) dragRaf = requestAnimationFrame(flushDragAlong);
}

function onCanvasMouseUp(e) {
  if (!dragOpeningId) return;
  if (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
  flushDragAlong();
  dragOpeningId = null;
  pendingDragAlong = null;
  pendingDragWall = null;
  document.body.classList.remove('cld-room-edit-dragging-door');
  setControlsEnabled(controlsWasEnabled);
}

function onCanvasClick(e) {
  if (!isOpeningsPanel()) return;
  if (e.button !== 0) return;
  if (dragMoved) {
    dragMoved = false;
    e.stopImmediatePropagation();
    e.preventDefault();
    return;
  }
  if (dragOpeningId) return;
  const existing = hitOpening(e);
  if (existing) {
    e.stopImmediatePropagation();
    e.preventDefault();
    selectedOpeningId = existing;
    selectedCatalog = null;
    doorCatalogBrowse = false;
    windowCatalogBrowse = false;
    ensurePanelForOpening(selectedOpening());
    syncDoorEditor();
    refreshOpeningDims();
    applyToRoom();
    return;
  }
  // Клик мимо двери — снять выделение (чтобы снова поставить из каталога)
  if (selectedOpeningId) {
    e.stopImmediatePropagation();
    e.preventDefault();
    selectedOpeningId = null;
    selectedCatalog = null;
    doorCatalogBrowse = false;
    windowCatalogBrowse = false;
    dimEditing = null;
    dimEditFocusKey = null;
    syncDoorEditor();
    refreshOpeningDims();
    applyToRoom();
  }
}

function bindCanvas() {
  const el = state.renderer && state.renderer.domElement;
  if (!el || canvasBound) return;
  el.addEventListener('mousedown', onCanvasMouseDown, true);
  el.addEventListener('mousemove', onCanvasMouseMove, true);
  el.addEventListener('mouseup', onCanvasMouseUp, true);
  el.addEventListener('click', onCanvasClick, true);
  window.addEventListener('mouseup', onCanvasMouseUp, true);
  canvasBound = true;
}

function unbindCanvas() {
  const el = state.renderer && state.renderer.domElement;
  if (!el || !canvasBound) return;
  el.removeEventListener('mousedown', onCanvasMouseDown, true);
  el.removeEventListener('mousemove', onCanvasMouseMove, true);
  el.removeEventListener('mouseup', onCanvasMouseUp, true);
  el.removeEventListener('click', onCanvasClick, true);
  window.removeEventListener('mouseup', onCanvasMouseUp, true);
  canvasBound = false;
  onCanvasMouseUp();
}

function clearDimLabels() {
  (window.__cldOpeningDimLabels || []).forEach((el) => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
  window.__cldOpeningDimLabels = [];
  window.__cldOpeningDimSegs = [];
  const layer = document.getElementById('cld-opening-dim-lines');
  if (layer) layer.replaceChildren();
}

function ensureOpeningDimSvg() {
  const box = window.sceneIconsContainer;
  if (!box) return null;
  let svg = document.getElementById('cld-opening-dim-svg');
  if (!svg) {
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.id = 'cld-opening-dim-svg';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:19;overflow:hidden';
    const lines = document.createElementNS(SVG_NS, 'g');
    lines.id = 'cld-opening-dim-lines';
    svg.appendChild(lines);
    box.appendChild(svg);
  }
  return svg;
}

function dimKey(openingId, kind) {
  return String(openingId) + ':' + kind;
}

/** Три сегмента выбранной двери: до неё / ширина / после неё (соседи учитываются). */
function selectedDoorDimSegments(room, op) {
  if (!room || !op) return [];
  const len = wallLength(room, op.wallName);
  const onWall = openings()
    .filter((o) => o && o.wallName === op.wallName)
    .sort((a, b) => a.alongMm - b.alongMm);
  const idx = onWall.findIndex((o) => o.id === op.id);
  if (idx < 0) return [];
  const prev = onWall[idx - 1];
  const next = onWall[idx + 1];
  const a = op.alongMm - op.widthMm / 2;
  const b = op.alongMm + op.widthMm / 2;
  const leftStart = prev ? prev.alongMm + prev.widthMm / 2 : 0;
  const rightEnd = next ? next.alongMm - next.widthMm / 2 : len;
  const segs = [];
  if (a - leftStart > 8) {
    segs.push({
      kind: 'left',
      openingId: op.id,
      wallName: op.wallName,
      from: leftStart,
      to: a,
      leftStart,
      rightEnd,
    });
  }
  segs.push({
    kind: 'door',
    openingId: op.id,
    wallName: op.wallName,
    from: a,
    to: b,
    leftStart,
    rightEnd,
  });
  if (rightEnd - b > 8) {
    segs.push({
      kind: 'right',
      openingId: op.id,
      wallName: op.wallName,
      from: b,
      to: rightEnd,
      leftStart,
      rightEnd,
    });
  }
  return segs;
}

function applyDimSegmentEdit(meta, cmVal) {
  const room = state.room;
  const op = openings().find((o) => o && o.id === meta.openingId);
  if (!room || !op || !meta) return false;
  const fresh = selectedDoorDimSegments(room, op).find((s) => s.kind === meta.kind) || meta;
  const parsed = parseFloat(String(cmVal == null ? '' : cmVal).replace(',', '.').replace(/[^\d.-]/g, ''));
  const valMm = Math.round(Math.max(0, Number.isFinite(parsed) ? parsed : 0) * 10);
  const leftStart = fresh.leftStart;
  const rightEnd = fresh.rightEnd;
  const span = rightEnd - leftStart;
  const minDoor = 400;
  const maxDoor = Math.max(minDoor, span - 2 * CORNER_MARGIN_MM);

  let width = op.widthMm;
  let along = op.alongMm;

  if (meta.kind === 'door') {
    width = Math.max(minDoor, Math.min(maxDoor, valMm));
    along = clampAlong(room, op.wallName, op.alongMm, width);
    const half = width / 2;
    along = Math.max(leftStart + half, Math.min(rightEnd - half, along));
  } else if (meta.kind === 'left') {
    const leftMm = Math.max(0, Math.min(span - minDoor, valMm));
    const a = leftStart + leftMm;
    along = a + width / 2;
    along = clampAlong(room, op.wallName, along, width);
    const half = width / 2;
    along = Math.max(leftStart + half, Math.min(rightEnd - half, along));
  } else if (meta.kind === 'right') {
    const rightMm = Math.max(0, Math.min(span - minDoor, valMm));
    const b = rightEnd - rightMm;
    along = b - width / 2;
    along = clampAlong(room, op.wallName, along, width);
    const half = width / 2;
    along = Math.max(leftStart + half, Math.min(rightEnd - half, along));
  } else {
    return false;
  }

  if (overlaps(op.wallName, along, width, op.id)) return false;
  op.widthMm = width;
  op.alongMm = along;
  selectedOpeningId = op.id;
  selectedCatalog = null;
  applyToRoom();
  syncDoorEditor();
  return true;
}

function stopDimEditing(commitEl) {
  if (!dimEditing) return;
  const meta = dimEditing;
  dimEditing = null;
  dimEditFocusKey = null;
  if (commitEl && commitEl.tagName === 'INPUT') {
    applyDimSegmentEdit(meta, commitEl.value);
  } else {
    refreshOpeningDims();
  }
}

function addDimLabel(text, pos, extraClass, meta) {
  const box = window.sceneIconsContainer;
  if (!box || !pos) return;
  const key = meta ? dimKey(meta.openingId, meta.kind) : '';
  const editing = !!(meta && dimEditing && dimEditing.key === key);

  const el = document.createElement('div');
  el.className =
    'cld-opening-dim' +
    (extraClass ? ' ' + extraClass : '') +
    (meta ? ' is-editable' : '') +
    (editing ? ' is-editing' : '');
  el.userData = { position3D: pos.clone(), meta: meta || null, key };

  if (editing) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.className = 'cld-opening-dim-input';
    // В поле — только число; на плане подпись с «см»
    input.value = String(mmToCmNumber((meta.to - meta.from) || 0) || String(text).replace(/[^\d.,-]/g, ''));
    input.setAttribute('aria-label', 'Размер, см');
    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        stopDimEditing(input);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        dimEditing = null;
        dimEditFocusKey = null;
        refreshOpeningDims();
      }
    });
    input.addEventListener('blur', () => {
      // blur после Enter уже сбросит dimEditing
      if (dimEditing && dimEditing.key === key) stopDimEditing(input);
    });
    el.appendChild(input);
    box.appendChild(el);
    window.__cldOpeningDimLabels.push(el);
    if (dimEditFocusKey === key) {
      dimEditFocusKey = null;
      requestAnimationFrame(() => {
        input.focus();
        input.select();
      });
    }
    return;
  }

  el.textContent = text;
  if (meta) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.title = 'Изменить размер';
    el.addEventListener('mousedown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectedOpeningId = meta.openingId;
      selectedCatalog = null;
      dimEditing = { key, openingId: meta.openingId, kind: meta.kind, leftStart: meta.leftStart, rightEnd: meta.rightEnd };
      dimEditFocusKey = key;
      syncDoorEditor();
      applyToRoom();
      refreshOpeningDims();
    });
  }
  box.appendChild(el);
  window.__cldOpeningDimLabels.push(el);
}

/** Сегмент стены: линия + засечки снаружи + подпись в середине. */
function addDimSegment(room, wallName, alongA, alongB, text, extraClass, meta) {
  const y = 40;
  const mid = (alongA + alongB) / 2;
  addDimLabel(text, worldAlongPoint(room, wallName, mid, y), extraClass, meta);
  if (!window.__cldOpeningDimSegs) window.__cldOpeningDimSegs = [];
  window.__cldOpeningDimSegs.push({
    wallName,
    p1: worldAlongPoint(room, wallName, alongA, y),
    p2: worldAlongPoint(room, wallName, alongB, y),
    active: !!(extraClass && String(extraClass).includes('is-active')),
  });
}

function worldAlongPoint(room, wallName, along, y, outMm) {
  const cx = -room.width / 2;
  const cz = -room.depth / 2;
  // IKEA: размеры снаружи контура комнаты
  const out = outMm != null ? outMm : DIM_OUT_MM;
  if (wallName === 'back') return new THREE.Vector3(cx + along, y, cz - out);
  if (wallName === 'front') return new THREE.Vector3(cx + along, y, cz + room.depth + out);
  if (wallName === 'left') return new THREE.Vector3(cx - out, y, cz + along);
  return new THREE.Vector3(cx + room.width + out, y, cz + along);
}

function worldInsidePoint(room, wallName, along, y) {
  const cx = -room.width / 2;
  const cz = -room.depth / 2;
  if (wallName === 'back') return new THREE.Vector3(cx + along, y, cz + 180);
  if (wallName === 'front') return new THREE.Vector3(cx + along, y, cz + room.depth - 180);
  if (wallName === 'left') return new THREE.Vector3(cx + 180, y, cz + along);
  return new THREE.Vector3(cx + room.width - 180, y, cz + along);
}

function clearDoorGizmo() {
  const g = document.getElementById('cld-door-gizmo');
  if (g && g.parentNode) g.parentNode.removeChild(g);
}

function ensureDoorGizmo() {
  const box = window.sceneIconsContainer;
  if (!box) return null;
  let g = document.getElementById('cld-door-gizmo');
  if (g) return g;
  g = document.createElement('div');
  g.id = 'cld-door-gizmo';
  g.className = 'cld-door-gizmo';
  // IKEA: выделение = синяя обводка двери. Без голубой плашки на проёме (она перекрывала размер).
  g.innerHTML =
    '<div class="cld-door-gizmo-bar">' +
    '<button type="button" data-door-gizmo="drag" title="Переместить" aria-label="Переместить">⠿</button>' +
    '<button type="button" data-door-gizmo="dup" title="Дублировать" aria-label="Дублировать">⧉</button>' +
    '<button type="button" data-door-gizmo="del" title="Удалить" aria-label="Удалить">🗑</button>' +
    '</div>';
  g.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('[data-door-gizmo]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const act = btn.getAttribute('data-door-gizmo');
    if (act === 'drag' && selectedOpeningId) {
      dragOpeningId = selectedOpeningId;
      dragMoved = false;
      pendingDragAlong = null;
      pendingDragWall = null;
      controlsWasEnabled = state.controls ? state.controls.enabled !== false : true;
      setControlsEnabled(false);
      document.body.classList.add('cld-room-edit-dragging-door');
    }
  });
  g.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-door-gizmo]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const act = btn.getAttribute('data-door-gizmo');
    if (act === 'del') onEditorDelete();
    if (act === 'dup') duplicateSelectedDoor();
  });
  box.appendChild(g);
  return g;
}

function duplicateSelectedDoor() {
  const op = selectedOpening();
  if (!op || !state.room) return;
  const copy = Object.assign({}, op, { id: makeId() });
  const step = copy.widthMm + 40;
  let along = clampAlong(state.room, copy.wallName, copy.alongMm + step, copy.widthMm);
  if (overlaps(copy.wallName, along, copy.widthMm)) {
    along = clampAlong(state.room, copy.wallName, copy.alongMm - step, copy.widthMm);
  }
  if (overlaps(copy.wallName, along, copy.widthMm)) return;
  copy.alongMm = along;
  openings().push(copy);
  selectedOpeningId = copy.id;
  applyToRoom();
}

function projectToScreen(pos) {
  if (!pos || !state.camera || !window.sceneIconsContainer) return null;
  const container = window.sceneIconsContainer;
  const v = pos.clone().project(state.camera);
  if (v.z > 1) return null;
  return {
    x: v.x * (container.clientWidth / 2) + container.clientWidth / 2,
    y: -v.y * (container.clientHeight / 2) + container.clientHeight / 2,
  };
}

function refreshDoorGizmo() {
  const op = selectedOpening();
  const room = state.room;
  // IKEA: ручка/иконки только в 2D
  if (!op || !room || !window.__cldRoomEditOpen || !isOpeningsPanel() || !isTopView2d()) {
    clearDoorGizmo();
    return;
  }
  const g = ensureDoorGizmo();
  if (!g) return;
  const barPos = worldInsidePoint(room, op.wallName, op.alongMm, 40);
  const bp = projectToScreen(barPos);
  const bar = g.querySelector('.cld-door-gizmo-bar');
  if (bar && bp) {
    bar.style.left = bp.x + 'px';
    bar.style.top = bp.y + 'px';
    bar.style.display = 'flex';
  } else if (bar) bar.style.display = 'none';
  g.style.display = 'block';
}

/** Стены, на которых сейчас рисуются сегменты проёма — полный размер комнаты там скрываем. */
function syncHideRoomDimSides(wallNames) {
  const hide = { top: false, bottom: false, left: false, right: false };
  (wallNames || []).forEach((w) => {
    if (w === 'back') hide.top = true;
    else if (w === 'front') hide.bottom = true;
    else if (w === 'left') hide.left = true;
    else if (w === 'right') hide.right = true;
  });
  window.__cldHideRoomDimSides = hide;
  if (typeof window.__cldUpdateRoomDimensionLabels === 'function') {
    window.__cldUpdateRoomDimensionLabels();
  }
}

function refreshOpeningDims() {
  clearDimLabels();
  const room = state.room;
  if (!room || !window.__cldRoomEditOpen) {
    clearDoorGizmo();
    syncHideRoomDimSides([]);
    return;
  }
  // IKEA: сегменты стены у двери — только сверху в 2D; в 3D размеров проёма нет
  if (!isTopView2d()) {
    clearDoorGizmo();
    dimEditing = null;
    syncHideRoomDimSides([]);
    return;
  }
  ensureOpeningDimSvg();
  const selected = selectedOpening();
  const wallsWithSegs = [];
  if (selected) {
    // IKEA: три размера вместо полного «500 см» на этой стене
    wallsWithSegs.push(selected.wallName);
    selectedDoorDimSegments(room, selected).forEach((seg) => {
      const text = formatDimCm(seg.to - seg.from);
      const active = seg.kind === 'door' || seg.kind === 'opening' ? 'is-active' : '';
      // kind «door» = ширина проёма (дверь или окно) — одна логика размеров
      addDimSegment(room, seg.wallName, seg.from, seg.to, text, active, seg);
    });
  } else {
    const wallsDone = {};
    openings().forEach((op) => {
      if (!op || wallsDone[op.wallName]) return;
      wallsDone[op.wallName] = true;
      wallsWithSegs.push(op.wallName);
      const len = wallLength(room, op.wallName);
      const onWall = openings()
        .filter((o) => o.wallName === op.wallName)
        .sort((a, b) => a.alongMm - b.alongMm);
      let cursor = 0;
      onWall.forEach((o) => {
        const a = o.alongMm - o.widthMm / 2;
        const b = o.alongMm + o.widthMm / 2;
        if (a - cursor > 8) {
          addDimSegment(room, o.wallName, cursor, a, formatDimCm(a - cursor));
        }
        addDimSegment(room, o.wallName, a, b, formatDimCm(o.widthMm));
        cursor = b;
      });
      if (len - cursor > 8) {
        const last = onWall[onWall.length - 1];
        addDimSegment(room, last.wallName, cursor, len, formatDimCm(len - cursor));
      }
    });
  }
  syncHideRoomDimSides(wallsWithSegs);
  projectDimLabels();
  refreshDoorGizmo();
}

function redrawOpeningDimLines() {
  const layer = document.getElementById('cld-opening-dim-lines');
  if (!layer) return;
  layer.replaceChildren();
  const segs = window.__cldOpeningDimSegs || [];
  segs.forEach((seg) => {
    const s1 = projectToScreen(seg.p1);
    const s2 = projectToScreen(seg.p2);
    if (!s1 || !s2) return;
    const dx = s2.x - s1.x;
    const dy = s2.y - s1.y;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const nx = -dy / len;
    const ny = dx / len;
    const half = DIM_TICK_PX / 2;
    const stroke = seg.active ? '#111' : '#333';
    const sw = seg.active ? '2' : '1.25';

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'cld-opening-dim-seg' + (seg.active ? ' is-active' : ''));

    const main = document.createElementNS(SVG_NS, 'line');
    main.setAttribute('x1', String(s1.x));
    main.setAttribute('y1', String(s1.y));
    main.setAttribute('x2', String(s2.x));
    main.setAttribute('y2', String(s2.y));
    main.setAttribute('stroke', stroke);
    main.setAttribute('stroke-width', sw);
    g.appendChild(main);

    // Торцевые засечки ⊥ к линии (как у IKEA / чертёжный стиль)
    [[s1.x, s1.y], [s2.x, s2.y]].forEach(([x, y]) => {
      const tick = document.createElementNS(SVG_NS, 'line');
      tick.setAttribute('x1', String(x - nx * half));
      tick.setAttribute('y1', String(y - ny * half));
      tick.setAttribute('x2', String(x + nx * half));
      tick.setAttribute('y2', String(y + ny * half));
      tick.setAttribute('stroke', stroke);
      tick.setAttribute('stroke-width', sw);
      g.appendChild(tick);
    });

    layer.appendChild(g);
  });
}

function projectDimLabels() {
  const container = window.sceneIconsContainer;
  if (!container || !state.camera) return;
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;
  (window.__cldOpeningDimLabels || []).forEach((label) => {
    const p = label.userData && label.userData.position3D;
    if (!p) return;
    const v = p.clone().project(state.camera);
    label.style.left = v.x * widthHalf + widthHalf + 'px';
    label.style.top = -v.y * heightHalf + heightHalf + 'px';
    label.style.display = v.z > 1 ? 'none' : 'block';
  });
  redrawOpeningDimLines();
}

function tickDims() {
  dimRaf = 0;
  if (!window.__cldRoomEditOpen) return;
  projectDimLabels();
  refreshDoorGizmo();
  dimRaf = requestAnimationFrame(tickDims);
}

function startDimLoop() {
  if (!dimRaf) dimRaf = requestAnimationFrame(tickDims);
}

function stopDimLoop() {
  if (dimRaf) cancelAnimationFrame(dimRaf);
  dimRaf = 0;
  if (!openings().length) clearDimLabels();
  else if (!isTopView2d()) clearDimLabels();
  clearDoorGizmo();
}

function selectedOpening() {
  return openings().find((o) => o.id === selectedOpeningId) || null;
}

function setSegPressed(attr, value) {
  document.querySelectorAll('[' + attr + ']').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.getAttribute(attr) === value ? 'true' : 'false');
  });
}

function syncDoorEditor() {
  const editor = document.getElementById('cld-room-edit-door-editor');
  const catalog = document.getElementById('cld-room-edit-catalog-doors');
  const changeBtn = document.getElementById('cld-room-edit-door-change-model');
  const hint = document.getElementById('cld-room-edit-doors-hint')
    || document.querySelector('#cld-room-edit-panel-doors .cld-room-edit-hint');
  const titleEl = document.getElementById('cld-room-edit-doors-title');
  const panel = document.getElementById('cld-room-edit-panel-doors');
  const op = selectedOpening();
  const isDoor = !!(op && op.type !== 'window');
  if (!isDoor) doorCatalogBrowse = false;
  const showCatalog = !isDoor || doorCatalogBrowse;
  const showSettings = isDoor && !doorCatalogBrowse;
  if (editor) editor.hidden = !showSettings;
  if (catalog) catalog.hidden = !showCatalog;
  if (changeBtn) changeBtn.hidden = !showSettings;
  if (panel) {
    panel.classList.toggle('cld-opening-panel--settings', showSettings);
    panel.classList.toggle('cld-opening-panel--catalog', showCatalog);
  }
  if (titleEl) {
    titleEl.textContent = showSettings ? (op.name || 'Дверь') : 'Типы дверей';
  }
  if (hint) {
    if (showSettings) {
      hint.textContent =
        'Перетащите дверь вдоль стены или на другую стену. Размеры и открывание — ниже.';
    } else {
      hint.textContent =
        'Выберите дверь в каталоге — она появится по центру дальней стены. Потом можно тянуть.';
    }
  }
  document.querySelectorAll('#cld-room-edit-catalog-doors .cld-room-edit-card').forEach((card) => {
    const id = card.getAttribute('data-id');
    const on = isDoor
      ? id === op.catalogId
      : !!(selectedCatalog && selectedCatalog.type !== 'window' && id === selectedCatalog.id);
    card.classList.toggle('is-selected', on);
  });
  document.body.classList.toggle('cld-room-edit-placing-door', false);
  if (!showSettings || !editor) {
    syncWindowEditor();
    return;
  }
  const w = document.getElementById('cld-room-edit-door-w');
  const h = document.getElementById('cld-room-edit-door-h');
  const title = document.getElementById('cld-room-edit-door-editor-title');
  const thumb = document.getElementById('cld-room-edit-door-thumb');
  if (w) w.value = mmToCmNumber(op.widthMm);
  if (h) h.value = mmToCmNumber(op.heightMm);
  if (title) title.textContent = op.name || 'Дверь';
  if (thumb) {
    if (op.thumb) {
      thumb.style.backgroundImage = 'url("' + String(op.thumb).replace(/"/g, '') + '")';
      thumb.style.backgroundColor = '#F3F3F3';
    } else {
      thumb.style.backgroundImage = '';
      thumb.style.backgroundColor = '#F3F3F3';
    }
  }
  if (!op.openingDirection) op.openingDirection = 'INWARDS';
  if (!op.handleSide) op.handleSide = 'LEFT';
  setSegPressed('data-door-open', op.openingDirection);
  setSegPressed('data-door-handle', op.handleSide);
  syncWindowEditor();
}

function syncWindowEditor() {
  const editor = document.getElementById('cld-room-edit-window-editor');
  const catalog = document.getElementById('cld-room-edit-catalog-windows');
  const changeBtn = document.getElementById('cld-room-edit-window-change-model');
  const hint = document.getElementById('cld-room-edit-windows-hint')
    || document.querySelector('#cld-room-edit-panel-windows .cld-room-edit-hint');
  const titleEl = document.getElementById('cld-room-edit-windows-title');
  const panel = document.getElementById('cld-room-edit-panel-windows');
  const op = selectedOpening();
  const isWin = !!(op && op.type === 'window');
  if (!isWin) windowCatalogBrowse = false;
  const showCatalog = !isWin || windowCatalogBrowse;
  const showSettings = isWin && !windowCatalogBrowse;
  if (editor) editor.hidden = !showSettings;
  if (catalog) catalog.hidden = !showCatalog;
  if (changeBtn) changeBtn.hidden = !showSettings;
  if (panel) {
    panel.classList.toggle('cld-opening-panel--settings', showSettings);
    panel.classList.toggle('cld-opening-panel--catalog', showCatalog);
  }
  if (titleEl) {
    titleEl.textContent = showSettings ? (op.name || 'Окно') : 'Окна';
  }
  if (hint) {
    if (showSettings) {
      hint.textContent =
        'Перетащите окно вдоль стены или на другую стену. Размер и подоконник — ниже.';
    } else {
      hint.textContent =
        'Выберите окно в каталоге — оно появится по центру дальней стены. Потом можно тянуть.';
    }
  }
  document.querySelectorAll('#cld-room-edit-catalog-windows .cld-room-edit-card').forEach((card) => {
    const id = card.getAttribute('data-id');
    const on = isWin
      ? id === op.catalogId
      : !!(selectedCatalog && selectedCatalog.type === 'window' && id === selectedCatalog.id);
    card.classList.toggle('is-selected', on);
  });
  if (!showSettings || !editor) return;
  const w = document.getElementById('cld-room-edit-window-w');
  const h = document.getElementById('cld-room-edit-window-h');
  const sill = document.getElementById('cld-room-edit-window-sill');
  const board = document.getElementById('cld-room-edit-window-sillboard');
  const title = document.getElementById('cld-room-edit-window-editor-title');
  const thumb = document.getElementById('cld-room-edit-window-thumb');
  if (w) w.value = mmToCmNumber(op.widthMm);
  if (h) h.value = mmToCmNumber(op.heightMm);
  if (sill) sill.value = mmToCmNumber(op.sillMm || 0);
  if (board) board.checked = op.hasWindowsill !== false;
  if (title) title.textContent = op.name || 'Окно';
  if (thumb) {
    if (op.thumb) {
      thumb.style.backgroundImage = 'url("' + String(op.thumb).replace(/"/g, '') + '")';
      thumb.style.backgroundColor = '#F3F3F3';
    } else {
      thumb.style.backgroundImage = '';
      thumb.style.backgroundColor = '#F3F3F3';
    }
  }
  const finishId = op.finishId || 'white';
  const finishNorm =
    finishId === 'Wood_5' || finishId === 'Wood_3'
      ? finishId === 'Wood_5'
        ? 'beige'
        : 'Wood_1'
      : finishId;
  if (finishNorm !== finishId) op.finishId = finishNorm;
  document.querySelectorAll('#cld-room-edit-window-finishes .cld-window-finish').forEach((btn) => {
    const on = btn.getAttribute('data-finish') === (op.finishId || 'white');
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function onEditorInput() {
  const op = selectedOpening();
  if (!op || !state.room || op.type === 'window') return;
  const wEl = document.getElementById('cld-room-edit-door-w');
  const hEl = document.getElementById('cld-room-edit-door-h');
  let w = Math.max(40, Math.min(300, parseFloat(wEl && wEl.value) || 90)) * 10;
  let h = Math.max(80, Math.min(state.room.height / 10 - 4, parseFloat(hEl && hEl.value) || 210)) * 10;
  const along = clampAlong(state.room, op.wallName, op.alongMm, w);
  if (overlaps(op.wallName, along, w, op.id)) return;
  op.widthMm = w;
  op.heightMm = h;
  op.alongMm = along;
  applyToRoom();
}

function onWindowFinishClick(e) {
  const btn = e.currentTarget;
  const op = selectedOpening();
  if (!op || op.type !== 'window') return;
  const finish = btn.getAttribute('data-finish') || 'white';
  if (op.finishId === finish) return;
  op.finishId = finish;
  applyToRoom();
  syncWindowEditor();
}

function onWindowEditorInput() {
  const op = selectedOpening();
  if (!op || !state.room || op.type !== 'window') return;
  const wEl = document.getElementById('cld-room-edit-window-w');
  const hEl = document.getElementById('cld-room-edit-window-h');
  const sEl = document.getElementById('cld-room-edit-window-sill');
  const board = document.getElementById('cld-room-edit-window-sillboard');
  let w = Math.max(40, Math.min(400, parseFloat(wEl && wEl.value) || 120)) * 10;
  let h = Math.max(40, Math.min(280, parseFloat(hEl && hEl.value) || 120)) * 10;
  let sill = Math.max(0, Math.min(250, parseFloat(sEl && sEl.value) || 90)) * 10;
  const maxTop = state.room.height - 40;
  if (sill + h > maxTop) h = Math.max(400, maxTop - sill);
  if (sill + h > maxTop) sill = Math.max(0, maxTop - h);
  const along = clampAlong(state.room, op.wallName, op.alongMm, w);
  if (overlaps(op.wallName, along, w, op.id)) return;
  op.widthMm = w;
  op.heightMm = h;
  op.sillMm = sill;
  op.hasWindowsill = !!(board && board.checked);
  op.alongMm = along;
  applyToRoom();
}

function onEditorDelete() {
  const id = selectedOpeningId;
  if (!id) return;
  state.roomEditOpenings = openings().filter((o) => o.id !== id);
  selectedOpeningId = null;
  doorCatalogBrowse = false;
  windowCatalogBrowse = false;
  applyToRoom();
}

function onChangeDoorModel() {
  const op = selectedOpening();
  if (!op || op.type === 'window') return;
  doorCatalogBrowse = true;
  syncDoorEditor();
}

function onChangeWindowModel() {
  const op = selectedOpening();
  if (!op || op.type !== 'window') return;
  windowCatalogBrowse = true;
  syncDoorEditor();
}

function onOpenDirClick(e) {
  const btn = e.currentTarget;
  const op = selectedOpening();
  if (!op) return;
  const v = btn.getAttribute('data-door-open');
  if (!v) return;
  op.openingDirection = v;
  applyToRoom();
}

function onHandleClick(e) {
  const btn = e.currentTarget;
  const op = selectedOpening();
  if (!op) return;
  const v = btn.getAttribute('data-door-handle');
  if (!v) return;
  op.handleSide = v;
  applyToRoom();
}

function bindEditorOnce() {
  const w = document.getElementById('cld-room-edit-door-w');
  const h = document.getElementById('cld-room-edit-door-h');
  const del = document.getElementById('cld-room-edit-door-del');
  if (w && !w._reBound) {
    w._reBound = true;
    w.addEventListener('change', onEditorInput);
  }
  if (h && !h._reBound) {
    h._reBound = true;
    h.addEventListener('change', onEditorInput);
  }
  if (del && !del._reBound) {
    del._reBound = true;
    del.addEventListener('click', onEditorDelete);
  }
  document.querySelectorAll('[data-door-open]').forEach((btn) => {
    if (btn._reBound) return;
    btn._reBound = true;
    btn.addEventListener('click', onOpenDirClick);
  });
  document.querySelectorAll('[data-door-handle]').forEach((btn) => {
    if (btn._reBound) return;
    btn._reBound = true;
    btn.addEventListener('click', onHandleClick);
  });

  const ww = document.getElementById('cld-room-edit-window-w');
  const wh = document.getElementById('cld-room-edit-window-h');
  const ws = document.getElementById('cld-room-edit-window-sill');
  const wb = document.getElementById('cld-room-edit-window-sillboard');
  const wdel = document.getElementById('cld-room-edit-window-del');
  [ww, wh, ws].forEach((el) => {
    if (el && !el._reBound) {
      el._reBound = true;
      el.addEventListener('change', onWindowEditorInput);
    }
  });
  if (wb && !wb._reBound) {
    wb._reBound = true;
    wb.addEventListener('change', onWindowEditorInput);
  }
  if (wdel && !wdel._reBound) {
    wdel._reBound = true;
    wdel.addEventListener('click', onEditorDelete);
  }
  const doorChange = document.getElementById('cld-room-edit-door-change-model');
  const winChange = document.getElementById('cld-room-edit-window-change-model');
  if (doorChange && !doorChange._reBound) {
    doorChange._reBound = true;
    doorChange.addEventListener('click', onChangeDoorModel);
  }
  if (winChange && !winChange._reBound) {
    winChange._reBound = true;
    winChange.addEventListener('click', onChangeWindowModel);
  }
  document.querySelectorAll('#cld-room-edit-window-finishes .cld-window-finish').forEach((btn) => {
    if (btn._reBound) return;
    btn._reBound = true;
    btn.addEventListener('click', onWindowFinishClick);
  });
}

function applyCatalogVariantToOpening(op, item, type) {
  const def = catalogDefaults(item, type);
  const along = clampAlong(state.room, op.wallName, op.alongMm, def.widthMm);
  if (overlaps(op.wallName, along, def.widthMm, op.id)) return false;
  op.catalogId = def.catalogId;
  op.name = def.name;
  op.thumb = def.thumb;
  op.modelUrl = def.modelUrl || '';
  op.kind = def.kind;
  op.widthMm = def.widthMm;
  op.alongMm = along;
  if (type === 'window') {
    op.type = 'window';
    op.heightMm = def.heightMm;
    op.sillMm = def.sillMm;
    op.hasWindowsill = def.hasWindowsill;
    if (!op.finishId) op.finishId = 'white';
    const maxTop = (state.room && state.room.height - 40) || op.sillMm + op.heightMm;
    if (op.sillMm + op.heightMm > maxTop) {
      op.heightMm = Math.max(400, maxTop - op.sillMm);
    }
  } else {
    op.type = 'door';
    op.heightMm = Math.min(def.heightMm, (state.room && state.room.height - 40) || def.heightMm);
    op.sillMm = 0;
    op.hasWindowsill = false;
    if (def.openingDirection) op.openingDirection = def.openingDirection;
    if (def.handleSide) op.handleSide = def.handleSide;
  }
  selectedCatalog = null;
  doorCatalogBrowse = false;
  windowCatalogBrowse = false;
  applyToRoom();
  return true;
}

export function setSelectedDoorCatalog(item) {
  selectedCatalog = item ? Object.assign({}, item, { type: 'door' }) : null;
  if (!item) {
    syncDoorEditor();
    return;
  }
  const op = selectedOpening();
  if (op && op.type !== 'window') {
    if (applyCatalogVariantToOpening(op, item, 'door')) return;
  }
  selectedOpeningId = null;
  doorCatalogBrowse = false;
  if (placeCenteredOnFarWall(item, 'door')) return;
  selectedCatalog = null;
  syncDoorEditor();
}

export function setSelectedWindowCatalog(item) {
  selectedCatalog = item ? Object.assign({}, item, { type: 'window' }) : null;
  if (!item) {
    syncDoorEditor();
    return;
  }
  const op = selectedOpening();
  if (op && op.type === 'window') {
    if (applyCatalogVariantToOpening(op, item, 'window')) return;
  }
  selectedOpeningId = null;
  windowCatalogBrowse = false;
  if (placeCenteredOnFarWall(item, 'window')) return;
  selectedCatalog = null;
  syncDoorEditor();
}

export function getSelectedDoorCatalog() {
  return selectedCatalog;
}

export function mountRoomEditOpenings() {
  bindCanvas();
  bindEditorOnce();
  startDimLoop();
  selectedCatalog = null;
  selectedOpeningId = null;
  doorCatalogBrowse = false;
  windowCatalogBrowse = false;
  document.body.classList.remove('cld-room-edit-placing-door');
  document.body.classList.remove('cld-room-edit-dragging-door');
  applyToRoom();
  syncDoorEditor();
}

export function unmountRoomEditOpenings() {
  unbindCanvas();
  stopDimLoop();
  dimEditing = null;
  dimEditFocusKey = null;
  clearDimLabels();
  clearDoorGizmo();
  selectedCatalog = null;
  selectedOpeningId = null;
  doorCatalogBrowse = false;
  windowCatalogBrowse = false;
  window.__cldHideRoomDimSides = null;
  if (state.room && typeof state.room.clearFeatureWallHighlight === 'function') {
    state.room.clearFeatureWallHighlight();
  }
  document.body.classList.remove('cld-room-edit-placing-door');
  document.body.classList.remove('cld-room-edit-dragging-door');
  try {
    clearRoomOpeningSelection();
  } catch (_) {}
  // Один apply без selectedId — убрать выделение в материалах proxy.
  try {
    applyToRoom();
  } catch (_) {}
  refreshOpeningDims();
}

export function onRoomEditPanelChanged() {
  if (!isOpeningsPanel()) {
    document.body.classList.remove('cld-room-edit-placing-door');
    document.body.classList.remove('cld-room-edit-dragging-door');
    onCanvasMouseUp();
  }
  syncDoorEditor();
}

/** Снять выделение проёма (синяя рамка окна). Без applyOpenings — иначе окно «пересобирается». */
export function clearRoomOpeningSelection() {
  selectedOpeningId = null;
  selectedCatalog = null;
  doorCatalogBrowse = false;
  windowCatalogBrowse = false;
  try {
    if (state.room && typeof state.room.clearFeatureWallHighlight === 'function') {
      state.room.clearFeatureWallHighlight();
    }
  } catch (_) {}
  try {
    const root = state.room?.group;
    if (root && typeof root.traverse === 'function') {
      const kill = [];
      root.traverse((obj) => {
        if (
          obj?.userData?.isRoomOpeningOutline ||
          (obj?.type === 'LineSegments' &&
            obj?.userData?.openingId != null &&
            obj?.userData?.hideInTopView === true &&
            !obj?.userData?.hideIn3dView)
        ) {
          kill.push(obj);
        }
      });
      for (const obj of kill) {
        try {
          obj.parent?.remove(obj);
          obj.geometry?.dispose?.();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.());
            else obj.material.dispose?.();
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.__cldClearRoomOpeningSelection = clearRoomOpeningSelection;
}
