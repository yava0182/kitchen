/**
 * Room-edit doors (IKEA): catalog → click wall → place;
 * selected door: W×H, open INWARDS/OUTWARDS, handle LEFT/RIGHT, drag along wall.
 */
import { state } from '../utils/state.js';
import { updateMousePosition } from '../events/mouse-handler.js';
const CORNER_MARGIN_MM = 80;
const DEFAULT_DOOR_W_MM = 900;
const DEFAULT_DOOR_H_MM = 2100;
const DEFAULT_WINDOW_W_MM = 1200;
const DEFAULT_WINDOW_H_MM = 1200;
const DEFAULT_WINDOW_SILL_MM = 900;
/**
 * Смещение размерной линии проёма от стены (мм).
 * Ближе, чем размер ребра комнаты в scene-icons (100+280), чтобы не накладывались.
 */
const DIM_OUT_MM = 100 + 140;
/** Длина засечки на концах сегмента (px экрана). */
const DIM_TICK_PX = 9;
const SVG_NS = 'http://www.w3.org/2000/svg';
/** Порядок стен для авто-постановки как у IKEA (вид сверху). */
const WALL_PLACE_ORDER = ['back', 'right', 'front', 'left'];

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
  const span = wallSolidSpan(room, wallName);
  return Math.max(0, span.end - span.start);
}

function roomSegments(room) {
  return (
    (room && Array.isArray(room.wallSegments) && room.wallSegments) ||
    (room &&
      room.footprintSpec &&
      Array.isArray(room.footprintSpec.segments) &&
      room.footprintSpec.segments) ||
    []
  );
}

function findSegment(room, wallName) {
  if (room && typeof room.findWallSegment === 'function') {
    return room.findWallSegment(wallName);
  }
  const segs = roomSegments(room);
  return segs.find((s) => s && !s.open && (s.wallName === wallName || s.id === wallName)) || null;
}

function wallAlongAxis(room, wallName) {
  if (room && typeof room.wallAlongAxis === 'function') return room.wallAlongAxis(wallName);
  if (wallName === 'front' || wallName === 'back') return 'x';
  if (wallName === 'left' || wallName === 'right') return 'z';
  const s = findSegment(room, wallName);
  if (!s) return 'x';
  return Math.abs(s.x2 - s.x1) >= Math.abs(s.z2 - s.z1) ? 'x' : 'z';
}

function wallCardinalSide(room, wallName) {
  if (room && typeof room.wallCardinalSide === 'function') return room.wallCardinalSide(wallName);
  if (
    wallName === 'front' ||
    wallName === 'back' ||
    wallName === 'left' ||
    wallName === 'right'
  ) {
    return wallName;
  }
  const s = findSegment(room, wallName);
  if (!s) return 'back';
  const dx = s.x2 - s.x1;
  const dz = s.z2 - s.z1;
  const len = Math.hypot(dx, dz) || 1;
  const inx = -dz / len;
  const inz = dx / len;
  if (Math.abs(inx) >= Math.abs(inz)) return inx > 0 ? 'left' : 'right';
  return inz > 0 ? 'back' : 'front';
}

function distPointToSeg(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len2 = dx * dx + dz * dz;
  if (len2 < 1e-6) return Math.hypot(px - x1, pz - z1);
  let t = ((px - x1) * dx + (pz - z1) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
}

/**
 * Участок реальной (сплошной) стены в абсолютных along.
 * Открытое ребро (open_corner / open_one_wall) → пустой span — проёмы туда нельзя.
 */
function wallSolidSpan(room, wallName) {
  const axis = wallAlongAxis(room, wallName);
  const full =
    axis === 'z' ? Number(room && room.depth) || 0 : Number(room && room.width) || 0;
  const segs = roomSegments(room);
  if (!segs.length) {
    // Нет footprint — классический прямоугольник
    return { start: 0, end: full };
  }
  let start = Infinity;
  let end = -Infinity;
  let matchedSolid = false;
  let matchedOpen = false;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (!s) continue;
    if (s.wallName !== wallName && s.id !== wallName) continue;
    if (s.open) {
      matchedOpen = true;
      continue;
    }
    matchedSolid = true;
    if (axis === 'x') {
      start = Math.min(start, s.x1, s.x2);
      end = Math.max(end, s.x1, s.x2);
    } else {
      start = Math.min(start, s.z1, s.z2);
      end = Math.max(end, s.z1, s.z2);
    }
  }
  if (matchedSolid && end > start) return { start, end };
  // Сторона есть, но она открытая (нет стены) — проёмы не ставим
  if (matchedOpen) return { start: 0, end: 0 };
  return { start: 0, end: 0 };
}

function alongInSolidSpan(room, wallName, along, padMm) {
  const span = wallSolidSpan(room, wallName);
  const pad = Number.isFinite(padMm) ? padMm : 40;
  return along >= span.start - pad && along <= span.end + pad;
}

function alongFromLocal(wallName, local, room) {
  const r = room || state.room;
  return wallAlongAxis(r, wallName) === 'x' ? local.x : local.z;
}

/** Проём ширины widthMm влезает на стену с учётом отступов от углов. */
function openingFitsWall(room, wallName, widthMm) {
  if (!room || !wallName) return false;
  const w = Number(widthMm);
  if (!Number.isFinite(w) || w < 40) return false;
  const span = wallSolidSpan(room, wallName);
  const need = w + 2 * CORNER_MARGIN_MM;
  return span.end - span.start >= need - 0.5;
}

/** Можно поставить в точку along без пересечения с другими проёмами. */
function canPlaceOpening(room, wallName, along, widthMm, ignoreId) {
  if (!openingFitsWall(room, wallName, widthMm)) return false;
  if (!Number.isFinite(along)) return false;
  const span = wallSolidSpan(room, wallName);
  const half = widthMm / 2;
  if (along - half < span.start + CORNER_MARGIN_MM - 0.5) return false;
  if (along + half > span.end - CORNER_MARGIN_MM + 0.5) return false;
  if (overlaps(wallName, along, widthMm, ignoreId)) return false;
  return true;
}

function listSolidWallKeys(room) {
  const segs = roomSegments(room);
  const seen = new Set();
  const keys = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (!s || s.open) continue;
    const k = s.wallName || s.id;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    keys.push(k);
  }
  const ordered = [];
  WALL_PLACE_ORDER.forEach((w) => {
    if (seen.has(w)) ordered.push(w);
  });
  keys.forEach((k) => {
    if (WALL_PLACE_ORDER.indexOf(k) < 0) ordered.push(k);
  });
  return ordered.length ? ordered : WALL_PLACE_ORDER.slice();
}

function openingSpan(op) {
  return {
    a: op.alongMm - op.widthMm / 2,
    b: op.alongMm + op.widthMm / 2,
  };
}

function overlaps(wallName, along, width, ignoreId) {
  return overlapsList(openings(), wallName, along, width, ignoreId);
}

function overlapsList(list, wallName, along, width, ignoreId) {
  const a0 = along - width / 2;
  const b0 = along + width / 2;
  return (list || []).some((op) => {
    if (!op || op.wallName !== wallName) return false;
    if (ignoreId && op.id === ignoreId) return false;
    const s = openingSpan(op);
    return a0 < s.b - 1 && b0 > s.a + 1;
  });
}

function findFreeAlongInList(room, wallName, widthMm, excludeId, occupied) {
  if (!openingFitsWall(room, wallName, widthMm)) return null;
  const span = wallSolidSpan(room, wallName);
  const preferred = (span.start + span.end) / 2;
  const along0 = clampAlong(room, wallName, preferred, widthMm);
  if (
    along0 != null &&
    !overlapsList(occupied, wallName, along0, widthMm, excludeId)
  ) {
    const half = widthMm / 2;
    if (
      along0 - half >= span.start + CORNER_MARGIN_MM - 0.5 &&
      along0 + half <= span.end - CORNER_MARGIN_MM + 0.5
    ) {
      return along0;
    }
  }
  const half = widthMm / 2;
  const minA = span.start + half + CORNER_MARGIN_MM;
  const maxA = span.end - half - CORNER_MARGIN_MM;
  if (maxA < minA) return null;
  let best = null;
  let bestDist = Infinity;
  const step = 10;
  for (let a = minA; a <= maxA + 0.01; a += step) {
    const c = Math.min(maxA, a);
    if (overlapsList(occupied, wallName, c, widthMm, excludeId)) continue;
    const d = Math.abs(c - preferred);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * Снимок проёмов до пересборки комнаты (сторона/ось для rematch).
 */
export function snapshotOpeningsForReconcile() {
  const room = state.room;
  return openings().map((op) => {
    if (!op) return null;
    return {
      ...op,
      _side: room && typeof room.wallCardinalSide === 'function' ? room.wallCardinalSide(op.wallName) : null,
      _axis: room && typeof room.wallAlongAxis === 'function' ? room.wallAlongAxis(op.wallName) : null,
    };
  }).filter(Boolean);
}

/**
 * После смены формы/ориента/размера:
 * — если проём влазит на ту же / ту же сторону стены → переносим;
 * — иначе удаляем.
 * Убирает «сиротские» размеры без двери/окна.
 */
export function reconcileOpeningsAfterRoomChange(snapshot) {
  const room = state.room;
  const prev = Array.isArray(snapshot) ? snapshot : snapshotOpeningsForReconcile();
  if (!room) {
    state.roomEditOpenings = [];
    selectedOpeningId = null;
    try {
      refreshOpeningDims();
    } catch (_) {}
    return;
  }

  const kept = [];
  for (let i = 0; i < prev.length; i++) {
    const op = prev[i];
    if (!op || !op.widthMm) continue;

    const tryWall = (wallName) => {
      if (!wallName || !openingFitsWall(room, wallName, op.widthMm)) return null;
      let along = clampAlong(room, wallName, op.alongMm, op.widthMm);
      if (along == null || overlapsList(kept, wallName, along, op.widthMm, op.id)) {
        along = findFreeAlongInList(room, wallName, op.widthMm, op.id, kept);
      }
      if (along == null) return null;
      if (overlapsList(kept, wallName, along, op.widthMm, op.id)) return null;
      return along;
    };

    let wallName = op.wallName;
    let along = tryWall(wallName);

    // Та же кардинальная сторона (внутренняя → внутренняя после поворота варианта)
    if (along == null && op._side) {
      const keys = listSolidWallKeys(room).filter(
        (k) => wallCardinalSide(room, k) === op._side
      );
      for (let k = 0; k < keys.length; k++) {
        along = tryWall(keys[k]);
        if (along != null) {
          wallName = keys[k];
          break;
        }
      }
    }

    // Та же ось (горизонталь/вертикаль) — запасной вариант
    if (along == null && op._axis) {
      const keys = listSolidWallKeys(room).filter(
        (k) => wallAlongAxis(room, k) === op._axis
      );
      for (let k = 0; k < keys.length; k++) {
        along = tryWall(keys[k]);
        if (along != null) {
          wallName = keys[k];
          break;
        }
      }
    }

    if (along == null) continue; // не влезает — удаляем

    const next = { ...op };
    delete next._side;
    delete next._axis;
    next.wallName = wallName;
    next.alongMm = along;
    kept.push(next);
  }

  state.roomEditOpenings = kept;
  if (selectedOpeningId && !kept.some((o) => o.id === selectedOpeningId)) {
    selectedOpeningId = null;
  }
  applyToRoom();
}

/** along — абсолютная координата на оси стены; clamp только в реальный сегмент. */
function clampAlong(room, wallName, along, width) {
  const span = wallSolidSpan(room, wallName);
  const half = width / 2;
  const min = span.start + CORNER_MARGIN_MM + half;
  const max = span.end - CORNER_MARGIN_MM - half;
  if (max < min) return null;
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

  // Все сегменты footprint (включая внутренние eN), не только 4 legacy
  const frames = [];
  if (room.walls) {
    Object.keys(room.walls).forEach((k) => {
      if (k === 'ceiling') return;
      const m = room.walls[k];
      if (m && m.visible !== false) frames.push(m);
    });
  }
  if (room.group) {
    room.group.traverse((o) => {
      if (
        o.isMesh &&
        o.userData &&
        o.userData.isPolygonWallStrip &&
        o.visible !== false &&
        frames.indexOf(o) < 0
      ) {
        frames.push(o);
      }
    });
  }
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
      const segs = roomSegments(room);
      let best = null;
      let bestD = 420;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (!s || s.open) continue;
        const key = s.wallName || s.id;
        if (!key) continue;
        const d = distPointToSeg(local.x, local.z, s.x1, s.z1, s.x2, s.z2);
        if (d >= bestD) continue;
        const along =
          wallAlongAxis(room, key) === 'x' ? local.x : local.z;
        if (!alongInSolidSpan(room, key, along, 80)) continue;
        bestD = d;
        best = { wallName: key, local, point: floorHits[0].point };
      }
      if (best) return best;
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
  // Подтянуть along в реальный сегмент; проёмы шире стены не трогаем (не «втискиваем»)
  openings().forEach((op) => {
    if (!op) return;
    if (!openingFitsWall(room, op.wallName, op.widthMm)) return;
    const along = clampAlong(room, op.wallName, op.alongMm, op.widthMm);
    if (along != null) op.alongMm = along;
  });
  room.applyOpenings(openings(), { selectedId: selectedOpeningId });
  // Свет OFF: openings не поднимают v0.
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
function placeCenteredOnFarWall(item, type) {
  if (!item || !state.room || !isTopView2d()) return false;
  const room = state.room;
  const def = catalogDefaults(item, type);
  const keys = listSolidWallKeys(room);
  // Сначала стены без проёмов, куда влезает ширина; потом любая свободная щель
  const emptyFirst = keys.filter(
    (w) =>
      openingFitsWall(room, w, def.widthMm) && !openings().some((o) => o && o.wallName === w)
  );
  const rest = keys.filter((w) => emptyFirst.indexOf(w) < 0);
  const tryOrder = emptyFirst.concat(rest);
  for (let i = 0; i < tryOrder.length; i++) {
    const wallName = tryOrder[i];
    if (!openingFitsWall(room, wallName, def.widthMm)) continue;
    const along = findFreeAlong(room, wallName, def.widthMm, null);
    if (along == null) continue;
    selectedCatalog = item;
    if (pushOpening(wallName, along, def)) return true;
  }
  return false;
}

/**
 * IKEA: новый проём на первой стене без дверей/окон (старт — дальняя).
 */
function pickWallForNewOpening() {
  const room = state.room;
  const keys = listSolidWallKeys(room);
  for (let i = 0; i < keys.length; i++) {
    const wallName = keys[i];
    if (!openingFitsWall(room, wallName, DEFAULT_DOOR_W_MM)) continue;
    const busy = openings().some((o) => o && o.wallName === wallName);
    if (!busy) return wallName;
  }
  return keys[0] || 'back';
}

/**
 * Центр реального сегмента стены; если участок занят — ближайшая свободная точка.
 * null — на стене нет места под такую ширину (или всё занято).
 */
function findFreeAlong(room, wallName, widthMm, excludeId) {
  if (!openingFitsWall(room, wallName, widthMm)) return null;
  const span = wallSolidSpan(room, wallName);
  const preferred = (span.start + span.end) / 2;
  const along0 = clampAlong(room, wallName, preferred, widthMm);
  if (along0 != null && canPlaceOpening(room, wallName, along0, widthMm, excludeId)) {
    return along0;
  }

  const half = widthMm / 2;
  const minA = span.start + half + CORNER_MARGIN_MM;
  const maxA = span.end - half - CORNER_MARGIN_MM;
  if (maxA < minA) return null;

  let best = null;
  let bestDist = Infinity;
  const step = 10;
  for (let a = minA; a <= maxA + 0.01; a += step) {
    const c = Math.min(maxA, a);
    if (!canPlaceOpening(room, wallName, c, widthMm, excludeId)) continue;
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
  if (!canPlaceOpening(room, wallName, along, def.widthMm, null)) return false;
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
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty(isWindow ? 'opening_window' : 'opening_door');
    }
  } catch (_) {}
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
  // Не переносим на стену, куда проём не влезает (шире стены / нет щели)
  if (!openingFitsWall(state.room, wallName, op.widthMm)) return;
  const along = clampAlong(state.room, wallName, pendingDragAlong, op.widthMm);
  if (along == null) return;
  if (!canPlaceOpening(state.room, wallName, along, op.widthMm, op.id)) return;
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
  pendingDragAlong = alongFromLocal(hit.wallName, hit.local, state.room);
  if (!dragRaf) dragRaf = requestAnimationFrame(flushDragAlong);
}

function onCanvasMouseUp(e) {
  if (!dragOpeningId) return;
  if (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
  flushDragAlong();
  const moved = dragMoved === true;
  dragOpeningId = null;
  pendingDragAlong = null;
  pendingDragWall = null;
  document.body.classList.remove('cld-room-edit-dragging-door');
  setControlsEnabled(controlsWasEnabled);
  // Stage5: dirty только после отпускания (не в flushDragAlong / mousemove).
  if (moved) {
    try {
      if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
        window.__cldMarkRoomDraftDirty('opening_move');
      }
    } catch (_) {}
  }
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
  const span = wallSolidSpan(room, op.wallName);
  const onWall = openings()
    .filter((o) => o && o.wallName === op.wallName)
    .sort((a, b) => a.alongMm - b.alongMm);
  const idx = onWall.findIndex((o) => o.id === op.id);
  if (idx < 0) return [];
  const prev = onWall[idx - 1];
  const next = onWall[idx + 1];
  const a = op.alongMm - op.widthMm / 2;
  const b = op.alongMm + op.widthMm / 2;
  const leftStart = prev ? prev.alongMm + prev.widthMm / 2 : span.start;
  const rightEnd = next ? next.alongMm - next.widthMm / 2 : span.end;
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
    if (along == null) return false;
    const half = width / 2;
    along = Math.max(leftStart + half, Math.min(rightEnd - half, along));
  } else if (meta.kind === 'left') {
    const leftMm = Math.max(0, Math.min(span - minDoor, valMm));
    const a = leftStart + leftMm;
    along = a + width / 2;
    along = clampAlong(room, op.wallName, along, width);
    if (along == null) return false;
    const half = width / 2;
    along = Math.max(leftStart + half, Math.min(rightEnd - half, along));
  } else if (meta.kind === 'right') {
    const rightMm = Math.max(0, Math.min(span - minDoor, valMm));
    const b = rightEnd - rightMm;
    along = b - width / 2;
    along = clampAlong(room, op.wallName, along, width);
    if (along == null) return false;
    const half = width / 2;
    along = Math.max(leftStart + half, Math.min(rightEnd - half, along));
  } else {
    return false;
  }

  if (!canPlaceOpening(room, op.wallName, along, width, op.id)) return false;
  op.widthMm = width;
  op.alongMm = along;
  selectedOpeningId = op.id;
  selectedCatalog = null;
  applyToRoom();
  syncDoorEditor();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('opening_dim');
    }
  } catch (_) {}
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

function addDimLabel(text, pos, extraClass, meta, wallName) {
  const box = window.sceneIconsContainer;
  if (!box || !pos) return;
  const key = meta ? dimKey(meta.openingId, meta.kind) : '';
  const editing = !!(meta && dimEditing && dimEditing.key === key);
  const vertical = wallAlongAxis(state.room, wallName) === 'z';
  const rotDeg = vertical ? -90 : 0;

  const el = document.createElement('div');
  el.className =
    'cld-opening-dim' +
    (extraClass ? ' ' + extraClass : '') +
    (meta ? ' is-editable' : '') +
    (editing ? ' is-editing' : '') +
    (vertical ? ' is-wall-vertical' : '');
  el.userData = {
    position3D: pos.clone(),
    meta: meta || null,
    key,
    wallName: wallName || null,
    rotDeg,
  };

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

/** Сегмент стены: линия + засечки снаружи + подпись в середине (параллельно стене). */
function addDimSegment(room, wallName, alongA, alongB, text, extraClass, meta) {
  const y = 40;
  const mid = (alongA + alongB) / 2;
  // Чуть дальше наружу на вертикальных — подпись не садится на обводку стены
  const out =
    wallAlongAxis(room, wallName) === 'z' ? DIM_OUT_MM + 60 : DIM_OUT_MM;
  addDimLabel(text, worldAlongPoint(room, wallName, mid, y, out), extraClass, meta, wallName);
  if (!window.__cldOpeningDimSegs) window.__cldOpeningDimSegs = [];
  window.__cldOpeningDimSegs.push({
    wallName,
    p1: worldAlongPoint(room, wallName, alongA, y, out),
    p2: worldAlongPoint(room, wallName, alongB, y, out),
    active: !!(extraClass && String(extraClass).includes('is-active')),
  });
}

function worldAlongPoint(room, wallName, along, y, outMm) {
  const cx = -room.width / 2;
  const cz = -room.depth / 2;
  const out = outMm != null ? outMm : DIM_OUT_MM;
  const side = wallCardinalSide(room, wallName);
  const axis = wallAlongAxis(room, wallName);
  const seg = findSegment(room, wallName);
  if (seg) {
    if (axis === 'x') {
      const mz = (seg.z1 + seg.z2) / 2;
      const sign = side === 'back' ? -1 : 1;
      return new THREE.Vector3(cx + along, y, cz + mz + sign * out);
    }
    const mx = (seg.x1 + seg.x2) / 2;
    const sign = side === 'left' ? -1 : 1;
    return new THREE.Vector3(cx + mx + sign * out, y, cz + along);
  }
  if (wallName === 'back') return new THREE.Vector3(cx + along, y, cz - out);
  if (wallName === 'front') return new THREE.Vector3(cx + along, y, cz + room.depth + out);
  if (wallName === 'left') return new THREE.Vector3(cx - out, y, cz + along);
  return new THREE.Vector3(cx + room.width + out, y, cz + along);
}

function worldInsidePoint(room, wallName, along, y, insetMm) {
  const cx = -room.width / 2;
  const cz = -room.depth / 2;
  const inset = Number.isFinite(insetMm) ? insetMm : 180;
  const side = wallCardinalSide(room, wallName);
  const axis = wallAlongAxis(room, wallName);
  const seg = findSegment(room, wallName);
  if (seg) {
    if (axis === 'x') {
      const mz = (seg.z1 + seg.z2) / 2;
      const sign = side === 'back' ? 1 : -1;
      return new THREE.Vector3(cx + along, y, cz + mz + sign * inset);
    }
    const mx = (seg.x1 + seg.x2) / 2;
    const sign = side === 'left' ? 1 : -1;
    return new THREE.Vector3(cx + mx + sign * inset, y, cz + along);
  }
  if (wallName === 'back') return new THREE.Vector3(cx + along, y, cz + inset);
  if (wallName === 'front') return new THREE.Vector3(cx + along, y, cz + room.depth - inset);
  if (wallName === 'left') return new THREE.Vector3(cx + inset, y, cz + along);
  return new THREE.Vector3(cx + room.width - inset, y, cz + along);
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
  if (along == null || !canPlaceOpening(state.room, copy.wallName, along, copy.widthMm, null)) {
    along = clampAlong(state.room, copy.wallName, copy.alongMm - step, copy.widthMm);
  }
  if (along == null || !canPlaceOpening(state.room, copy.wallName, along, copy.widthMm, null)) {
    return;
  }
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
  const vertical = wallAlongAxis(room, op.wallName) === 'z';
  // На вертикальной стене панель вдоль стены; глубже внутрь — не пересекает размеры снаружи
  const inset = vertical ? 320 : 220;
  const barPos = worldInsidePoint(room, op.wallName, op.alongMm, 40, inset);
  const bp = projectToScreen(barPos);
  const bar = g.querySelector('.cld-door-gizmo-bar');
  if (bar && bp) {
    bar.classList.toggle('is-vertical', vertical);
    bar.style.left = bp.x + 'px';
    bar.style.top = bp.y + 'px';
    bar.style.display = 'flex';
  } else if (bar) {
    bar.classList.remove('is-vertical');
    bar.style.display = 'none';
  }
  g.style.display = 'block';
}

/** Стены, на которых сейчас рисуются сегменты проёма — полный размер комнаты там скрываем. */
function syncHideRoomDimSides(wallNames) {
  const hide = { top: false, bottom: false, left: false, right: false };
  const keys = new Set();
  (wallNames || []).forEach((w) => {
    if (!w) return;
    keys.add(w);
    // AABB-подписи — только для legacy внешних имён
    if (w === 'back') hide.top = true;
    else if (w === 'front') hide.bottom = true;
    else if (w === 'left') hide.left = true;
    else if (w === 'right') hide.right = true;
  });
  window.__cldHideRoomDimSides = hide;
  window.__cldHideRoomDimWallKeys = keys;
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
      const span = wallSolidSpan(room, op.wallName);
      const onWall = openings()
        .filter((o) => o.wallName === op.wallName)
        .sort((a, b) => a.alongMm - b.alongMm);
      let cursor = span.start;
      onWall.forEach((o) => {
        const a = o.alongMm - o.widthMm / 2;
        const b = o.alongMm + o.widthMm / 2;
        if (a - cursor > 8) {
          addDimSegment(room, o.wallName, cursor, a, formatDimCm(a - cursor));
        }
        addDimSegment(room, o.wallName, a, b, formatDimCm(o.widthMm));
        cursor = b;
      });
      if (span.end - cursor > 8) {
        const last = onWall[onWall.length - 1];
        addDimSegment(room, last.wallName, cursor, span.end, formatDimCm(span.end - cursor));
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
    const rot = Number(label.userData && label.userData.rotDeg) || 0;
    label.style.transform =
      rot !== 0
        ? 'translate(-50%, -50%) rotate(' + rot + 'deg)'
        : 'translate(-50%, -50%)';
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
  // Проход (opening) — без полотна: скрыть открывание/ручку
  const isPassage = op.kind === 'opening';
  document.querySelectorAll('.cld-room-edit-door-swing').forEach((el) => {
    el.hidden = isPassage;
  });
  const delLabel = document.querySelector('#cld-room-edit-door-del span');
  if (delLabel) delLabel.textContent = isPassage ? 'Удалить проём' : 'Удалить дверь';
  if (hint && showSettings && isPassage) {
    hint.textContent =
      'Перетащите проход вдоль стены или на другую стену. Ширину и высоту меняйте ниже.';
  }
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
  if (!openingFitsWall(state.room, op.wallName, w)) {
    syncDoorEditor();
    return;
  }
  const along = clampAlong(state.room, op.wallName, op.alongMm, w);
  if (along == null || !canPlaceOpening(state.room, op.wallName, along, w, op.id)) {
    syncDoorEditor();
    return;
  }
  op.widthMm = w;
  op.heightMm = h;
  op.alongMm = along;
  applyToRoom();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('opening_door_edit');
    }
  } catch (_) {}
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
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('opening_window_finish');
    }
  } catch (_) {}
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
  if (!openingFitsWall(state.room, op.wallName, w)) {
    syncWindowEditor();
    return;
  }
  const along = clampAlong(state.room, op.wallName, op.alongMm, w);
  if (along == null || !canPlaceOpening(state.room, op.wallName, along, w, op.id)) {
    syncWindowEditor();
    return;
  }
  op.widthMm = w;
  op.heightMm = h;
  op.sillMm = sill;
  op.hasWindowsill = !!(board && board.checked);
  op.alongMm = along;
  applyToRoom();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('opening_window_edit');
    }
  } catch (_) {}
}

function onEditorDelete() {
  const id = selectedOpeningId;
  if (!id) return;
  state.roomEditOpenings = openings().filter((o) => o.id !== id);
  selectedOpeningId = null;
  doorCatalogBrowse = false;
  windowCatalogBrowse = false;
  applyToRoom();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('opening_delete');
    }
  } catch (_) {}
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
  if (!openingFitsWall(state.room, op.wallName, def.widthMm)) return false;
  const along = clampAlong(state.room, op.wallName, op.alongMm, def.widthMm);
  if (along == null || !canPlaceOpening(state.room, op.wallName, along, def.widthMm, op.id)) {
    return false;
  }
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
