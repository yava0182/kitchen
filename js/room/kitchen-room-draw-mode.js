/**
 * Режимы «Нарисовать план» (IKEA overlay поверх текущей Room):
 *   wall  — внутренняя перегородка (2D, клик–клик)
 *   zone  — разграничить зоны (2D, клик–клик, подписи площади)
 *   slope — скошенный потолок (A/B, клик по стене, превью, Создать)
 */

import { state, WALL_THICKNESS } from '../utils/state.js';
/** @typedef {'wall'|'zone'|'slope'} KitchenDrawToolId */

const TOOLS = [
  {
    id: 'wall',
    label: 'Добавить стену',
    hint: 'Нажмите один раз, чтобы начать строить стену, и нажмите снова, чтобы закончить',
    view: '2d',
  },
  {
    id: 'zone',
    label: 'Разграничить зоны',
    hint: 'Нажмите один раз, чтобы начать строить разделитель, и нажмите снова, чтобы закончить. Разделитель — невидимая линия для зон (например, обеденная).',
    view: '2d',
  },
  {
    id: 'slope',
    label: 'Добавить скошенный потолок',
    hint: 'Нажмите на стену, чтобы добавить скошенный потолок и введите необходимые размеры',
    // IKEA: старт в 2D, после клика по стене — 3D + панель A/B/C
    view: '2d',
  },
];

const SNAP_MM = 100;
const ORTHO_DEG = 6; // мягкий ortho для стен
const MIN_LEN_MM = 80;
const BOUNDARY_EPS = 8;
const HANDLE_COLOR = '#FF9F1C'; // Clodis orange (у IKEA жёлтый)
const WALL_HOVER_SNAP = 220;
const GUIDE_EXT_PX = 8000;
/** Зоны: липкая прямая (мм) — шире IKEA-окно, рука не сбивает на 1 мм */
const ZONE_ORTHO_ENTER_MM = 140;
const ZONE_ORTHO_RELEASE_MM = 240;

/** @type {KitchenDrawToolId|null} */
let _activeTool = null;
let _snapshot = null;
let _draft = null;
let _sessionUndo = [];
let _sessionRedo = [];
let _uiBound = false;
let _ptrBound = false;
/** @type {{x:number,z:number}|null} */
let _pendingStart = null;
/** Цепочка стен: после сегмента продолжаем с конца (как IKEA). */
let _wallChain = false;
/** Зоны: 'h' | 'v' | null — залипание на ось от старта. */
let _zoneOrthoLock = null;
/** Последняя экранная позиция карандаша. */
let _pencilScreen = null;
/** @type {THREE.Group|null} */
let _previewGroup = null;
let _iwSeq = 0;
let _zdSeq = 0;
/** @type {string|null} id выбранного разделителя после OK (голубой + размеры) */
let _selectedZoneDividerId = null;
let _zoneSelectBound = false;
/** Скошенный потолок: выбранное ребро стены. */
let _slopeEdge = null;
let _slopeSeq = 0;
/** id скоса в режиме «Изменить» (заменим при Создать). */
let _editingSlopeId = null;
/** снимок скоса на время редактирования (для Отмена). */
let _editingSlopeBackup = null;
let _slopeMarkerRaf = 0;

function emptyDraft(toolId) {
  return { tool: toolId || 'wall', strokes: [], closedChains: [], slope: null };
}

/** Все сегменты черновика (замкнутые цепочки + активная). */
function allDraftWallStrokes() {
  const out = [];
  if (!_draft) return out;
  for (const ch of _draft.closedChains || []) {
    if (Array.isArray(ch)) for (const s of ch) out.push(s);
  }
  for (const s of _draft.strokes || []) out.push(s);
  return out;
}

/**
 * Закончить текущую цепочку: уходит в closedChains (серые),
 * следующий клик — НОВАЯ стена с любого места (как IKEA).
 */
function finishWallChain() {
  if (!_draft) _draft = emptyDraft(_activeTool || 'wall');
  if (!Array.isArray(_draft.closedChains)) _draft.closedChains = [];
  const strokes = Array.isArray(_draft.strokes) ? _draft.strokes : [];
  if (strokes.length) {
    _draft.closedChains.push(strokes.map((s) => ({ ...s })));
  }
  _draft.strokes = [];
  _pendingStart = null;
  _wallChain = false;
  _zoneOrthoLock = null;
  hidePencil();
}

function draftStrokeCount() {
  let n = ((_draft && _draft.strokes) || []).length;
  for (const ch of (_draft && _draft.closedChains) || []) {
    if (Array.isArray(ch)) n += ch.length;
  }
  return n;
}

function toolMeta(id) {
  return TOOLS.find((t) => t.id === id) || null;
}

function isDrawTool(id) {
  return id === 'wall' || id === 'zone' || id === 'slope';
}

function canvasEl() {
  return (
    document.getElementById('canvas-container') ||
    (state.renderer && state.renderer.domElement && state.renderer.domElement.parentElement) ||
    null
  );
}

function footprint() {
  const r = state.room;
  return r && r.footprintSpec ? r.footprintSpec : null;
}

/** Вершины контура: footprint или AABB комнаты. */
function footprintVerts() {
  const fp = footprint();
  if (fp && Array.isArray(fp.vertices) && fp.vertices.length >= 3) return fp.vertices;
  const r = state.room;
  if (!r) return null;
  const w = r.width || 0;
  const d = r.depth || 0;
  return [
    { x: 0, z: 0 },
    { x: w, z: 0 },
    { x: w, z: d },
    { x: 0, z: d },
  ];
}

function footprintSegs() {
  const fp = footprint();
  if (fp && Array.isArray(fp.segments) && fp.segments.length) return fp.segments;
  return null;
}

export function getKitchenDrawTools() {
  return TOOLS.slice();
}

export function getActiveKitchenDrawTool() {
  return _activeTool;
}

export function isKitchenDrawModeOpen() {
  return _activeTool != null;
}

function captureSnapshot() {
  const room = state.room;
  return {
    shapeKey: state.kitchenRoomShapeKey || room?.shapeKey || null,
    params: state.kitchenFootprintParams ? { ...state.kitchenFootprintParams } : null,
    openings: Array.isArray(state.roomEditOpenings)
      ? state.roomEditOpenings.map((o) => ({ ...o }))
      : [],
    objects: Array.isArray(state.roomEditObjects)
      ? state.roomEditObjects.map((o) => ({ ...o }))
      : [],
    interiorWalls: Array.isArray(state.kitchenInteriorWalls)
      ? state.kitchenInteriorWalls.map((w) => ({ ...w }))
      : [],
    zoneDividers: Array.isArray(state.kitchenZoneDividers)
      ? state.kitchenZoneDividers.map((w) => ({ ...w }))
      : [],
    width: room?.width,
    depth: room?.depth,
    height: room?.height,
  };
}

function ensureOverlay() {
  let el = document.getElementById('cld-kitchen-draw-overlay');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'cld-kitchen-draw-overlay';
  el.className = 'cld-kitchen-draw-overlay';
  el.hidden = true;
  el.innerHTML =
    '<div class="cld-kitchen-draw-overlay__bar">' +
    '<div class="cld-kitchen-draw-overlay__lead">' +
    '<div class="cld-kitchen-draw-overlay__title" id="cld-kitchen-draw-title"></div>' +
    '<p class="cld-kitchen-draw-overlay__hint" id="cld-kitchen-draw-hint"></p>' +
    '</div>' +
    '<div class="cld-kitchen-draw-overlay__actions">' +
    '<button type="button" class="cld-kitchen-draw-overlay__icon-btn" data-draw-act="undo" title="Отменить" aria-label="Отменить">↶</button>' +
    '<button type="button" class="cld-kitchen-draw-overlay__icon-btn" data-draw-act="redo" title="Повторить" aria-label="Повторить">↷</button>' +
    '<button type="button" class="cld-kitchen-draw-overlay__btn cld-kitchen-draw-overlay__btn--ghost" data-draw-act="cancel">Отмена</button>' +
    '<button type="button" class="cld-kitchen-draw-overlay__btn cld-kitchen-draw-overlay__btn--primary" data-draw-act="ok">OK</button>' +
    '</div>' +
    '</div>' +
    '<aside class="cld-kitchen-draw-overlay__side" id="cld-kitchen-draw-side" hidden></aside>';
  document.body.appendChild(el);
  return el;
}

function ensurePlanToolbar() {
  let bar = document.getElementById('cld-kitchen-plan-toolbar');
  if (bar) return bar;
  bar = document.createElement('div');
  bar.id = 'cld-kitchen-plan-toolbar';
  bar.className = 'cld-kitchen-plan-toolbar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Построение плана');
  bar.innerHTML =
    '<div class="cld-kitchen-plan-toolbar__group">' +
    '<button type="button" class="cld-kitchen-plan-toolbar__btn" data-plan-menu="shape" aria-haspopup="true" aria-expanded="false" title="Нарисовать форму">Форма</button>' +
    '<button type="button" class="cld-kitchen-plan-toolbar__btn" data-plan-menu="draw" aria-haspopup="true" aria-expanded="false" title="Нарисовать план">План ▾</button>' +
    '</div>' +
    '<div class="cld-kitchen-plan-toolbar__menu" id="cld-kitchen-plan-draw-menu" hidden role="menu">' +
    TOOLS.map(
      (t) =>
        '<button type="button" role="menuitem" class="cld-kitchen-plan-toolbar__menu-item" data-draw-tool="' +
        t.id +
        '">' +
        t.label +
        '</button>'
    ).join('') +
    '</div>';
  document.body.appendChild(bar);
  return bar;
}

function closeDrawMenu() {
  const menu = document.getElementById('cld-kitchen-plan-draw-menu');
  if (menu) menu.hidden = true;
  const btn = document.querySelector('[data-plan-menu="draw"]');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function syncUndoRedoButtons() {
  const overlay = document.getElementById('cld-kitchen-draw-overlay');
  if (!overlay) return;
  const undoBtn = overlay.querySelector('[data-draw-act="undo"]');
  const redoBtn = overlay.querySelector('[data-draw-act="redo"]');
  if (undoBtn) {
    undoBtn.disabled = !_sessionUndo.length;
    undoBtn.setAttribute('aria-disabled', !_sessionUndo.length ? 'true' : 'false');
  }
  if (redoBtn) {
    redoBtn.disabled = !_sessionRedo.length;
    redoBtn.setAttribute('aria-disabled', !_sessionRedo.length ? 'true' : 'false');
  }
}

function syncOverlayChrome() {
  const meta = toolMeta(_activeTool);
  const overlay = ensureOverlay();
  const title = document.getElementById('cld-kitchen-draw-title');
  const hint = document.getElementById('cld-kitchen-draw-hint');
  const side = document.getElementById('cld-kitchen-draw-side');
  if (title) title.textContent = meta ? meta.label : '';
  if (hint) {
    let text = meta ? meta.hint : '';
    const n = _activeTool === 'wall' ? draftStrokeCount() : ((_draft && _draft.strokes && _draft.strokes.length) || 0);
    if (_activeTool === 'wall' && _pendingStart) {
      text = _wallChain
        ? 'Нажмите, чтобы продолжить; у стены ЛКМ — замкнуть. Esc — закончить цепочку'
        : 'Нажмите снова, чтобы поставить сегмент (у стены — замыкание)';
    } else if (_activeTool === 'wall' && n) {
      text =
        'Цепочка замкнута. Кликните в любом месте — новая стена. OK — сохранить (' + n + ')';
    } else if (_activeTool === 'zone' && _pendingStart) {
      text = 'Нажмите снова, чтобы завершить. Esc — отменить';
    } else if (_activeTool === 'zone' && n) {
      text =
        'Разделитель готов. Клик по стене — следующий. OK — сохранить (' + n + ')';
    } else if (_activeTool === 'zone') {
      text =
        'Нажмите один раз, чтобы начать строить разделитель, и нажмите снова, чтобы закончить';
    } else if (_activeTool === 'slope') {
      const hasCommitted =
        Array.isArray(state.kitchenCeilingSlopes) && state.kitchenCeilingSlopes.length > 0;
      if (_editingSlopeId || _editingSlopeBackup) {
        text = _slopeEdge
          ? 'Можно нажать на другую стену, чтобы переставить, или изменить A / B / C и нажать «Создать»'
          : 'Нажмите на стену, чтобы переставить скошенный потолок';
      } else if (_slopeEdge) {
        text = 'Задайте размеры A / B (или C), затем «Создать»';
      } else if (hasCommitted) {
        text = 'Скос создан. Можно выбрать другую стену или нажать OK';
      } else {
        text = 'Нажмите на стену, чтобы добавить скошенный потолок и введите необходимые размеры';
      }
    }
    hint.textContent = text;
  }
  const okBtn = overlay.querySelector('[data-draw-act="ok"]');
  if (okBtn) {
    // IKEA: сверху OK; «Создать» — внизу левой панели
    okBtn.textContent = 'OK';
    if (_activeTool === 'slope') {
      // OK активен после «Создать» (edge уже сброшен) или пока есть черновик стены
      const hasCommitted =
        Array.isArray(state.kitchenCeilingSlopes) && state.kitchenCeilingSlopes.length > 0;
      const okOn = !!_slopeEdge || hasCommitted;
      okBtn.disabled = !okOn;
      okBtn.setAttribute('aria-disabled', okOn ? 'false' : 'true');
    } else {
      okBtn.disabled = false;
      okBtn.setAttribute('aria-disabled', 'false');
    }
  }
  if (side) {
    if (_activeTool === 'slope') {
      side.hidden = false;
      if (!side.querySelector('.cld-kitchen-draw-slope__actions')) {
        mountSlopeSidePanel(side);
      }
      const createBtn = side.querySelector('[data-draw-act="create-slope"]');
      if (createBtn) {
        createBtn.disabled = !_slopeEdge;
        createBtn.setAttribute('aria-disabled', !_slopeEdge ? 'true' : 'false');
      }
    } else {
      side.hidden = true;
      side.replaceChildren();
    }
  }
  overlay.hidden = !_activeTool;
  document.body.classList.toggle('cld-kitchen-draw-mode', !!_activeTool);
  if (_activeTool) document.body.dataset.kitchenDrawTool = _activeTool;
  else delete document.body.dataset.kitchenDrawTool;
  syncUndoRedoButtons();
}

function pushSessionUndo(label) {
  _sessionUndo.push({
    label: label || 'edit',
    draft: _draft ? JSON.parse(JSON.stringify(_draft)) : emptyDraft(_activeTool),
    pendingStart: _pendingStart ? { ..._pendingStart } : null,
  });
  _sessionRedo = [];
  syncUndoRedoButtons();
}

function distPointToSeg(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((px - x1) * dx + (pz - z1) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return {
    d: Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz)),
    x: x1 + t * dx,
    z: z1 + t * dz,
    t,
  };
}

function pointInPoly(px, pz, verts) {
  if (!verts || verts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const xi = verts[i].x;
    const zi = verts[i].z;
    const xj = verts[j].x;
    const zj = verts[j].z;
    const intersect =
      zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToBoundary(px, pz, verts, segments) {
  let best = Infinity;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const seg = segments && segments[i];
    if (seg && seg.open) continue;
    const a = verts[i];
    const b = verts[(i + 1) % n];
    const hit = distPointToSeg(px, pz, a.x, a.z, b.x, b.z);
    if (hit.d < best) best = hit.d;
  }
  return best;
}

function pointAllowed(px, pz) {
  const verts = footprintVerts();
  if (!verts) return false;
  if (pointInPoly(px, pz, verts)) return true;
  return distToBoundary(px, pz, verts, footprintSegs()) <= BOUNDARY_EPS + SNAP_MM;
}

function collectSnapTargets() {
  const pts = [];
  const segs = [];
  const verts = footprintVerts();
  if (verts) {
    for (const v of verts) pts.push({ x: v.x, z: v.z });
    const n = verts.length;
    const segments = footprintSegs();
    for (let i = 0; i < n; i++) {
      const s = segments && segments[i];
      if (s && s.open) continue;
      const a = verts[i];
      const b = verts[(i + 1) % n];
      segs.push({ x1: a.x, z1: a.z, x2: b.x, z2: b.z });
    }
  }
  const iws = Array.isArray(state.kitchenInteriorWalls) ? state.kitchenInteriorWalls : [];
  for (const w of iws) {
    pts.push({ x: w.x1, z: w.z1 }, { x: w.x2, z: w.z2 });
    segs.push({ x1: w.x1, z1: w.z1, x2: w.x2, z2: w.z2 });
  }
  const zds = Array.isArray(state.kitchenZoneDividers) ? state.kitchenZoneDividers : [];
  for (const w of zds) {
    pts.push({ x: w.x1, z: w.z1 }, { x: w.x2, z: w.z2 });
    segs.push({ x1: w.x1, z1: w.z1, x2: w.x2, z2: w.z2 });
  }
  if (_draft && Array.isArray(_draft.strokes)) {
    for (const s of _draft.strokes) {
      pts.push({ x: s.x1, z: s.z1 }, { x: s.x2, z: s.z2 });
      segs.push({ x1: s.x1, z1: s.z1, x2: s.x2, z2: s.z2 });
    }
  }
  for (const ch of (_draft && _draft.closedChains) || []) {
    if (!Array.isArray(ch)) continue;
    for (const s of ch) {
      pts.push({ x: s.x1, z: s.z1 }, { x: s.x2, z: s.z2 });
      segs.push({ x1: s.x1, z1: s.z1, x2: s.x2, z2: s.z2 });
    }
  }
  return { pts, segs };
}

function snapPoint(raw, opts) {
  let x = raw.x;
  let z = raw.z;
  const from = opts && opts.from;
  if (from) {
    const dx = x - from.x;
    const dz = z - from.z;
    const ang = (Math.abs(Math.atan2(dz, dx)) * 180) / Math.PI;
    const toH = Math.min(ang, 180 - ang);
    const toV = Math.abs(90 - ang);
    if (toH <= ORTHO_DEG) z = from.z;
    else if (toV <= ORTHO_DEG) x = from.x;
    if (opts && opts.shift) {
      if (Math.abs(dx) >= Math.abs(dz)) z = from.z;
      else x = from.x;
    }
  }
  const { pts, segs } = collectSnapTargets();
  let best = { d: SNAP_MM, x, z };
  for (const p of pts) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < best.d) best = { d, x: p.x, z: p.z };
  }
  for (const s of segs) {
    const hit = distPointToSeg(x, z, s.x1, s.z1, s.x2, s.z2);
    if (hit.d < best.d) best = { d: hit.d, x: hit.x, z: hit.z };
  }
  return { x: best.x, z: best.z };
}

/** Луч → плоскость пола y=0 в локали комнаты (мм). Работает и за пределами пола. */
function pickFloorXZ(clientX, clientY) {
  const r = state.room;
  const box = canvasEl();
  if (!r || !box || !state.camera || !state.raycaster || typeof THREE === 'undefined') {
    return null;
  }
  const rect = box.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  state.raycaster.setFromCamera(mouse, state.camera);
  const origin = state.raycaster.ray.origin.clone();
  const dir = state.raycaster.ray.direction.clone();
  // Плоскость пола комнаты в мире
  const localOrigin = new THREE.Vector3(0, 0, 0);
  const localNormal = new THREE.Vector3(0, 1, 0);
  r.group.localToWorld(localOrigin);
  const nWorld = localNormal.transformDirection(r.group.matrixWorld).normalize();
  const denom = nWorld.dot(dir);
  if (Math.abs(denom) < 1e-8) return null;
  const t = nWorld.dot(localOrigin.clone().sub(origin)) / denom;
  if (t < 0) return null;
  const pt = origin.add(dir.multiplyScalar(t));
  r.group.worldToLocal(pt);
  return { x: pt.x, z: pt.z };
}

function ensurePreviewGroup() {
  if (_previewGroup) {
    // комната могла пересоздаться — старый group мёртв
    if (!_previewGroup.parent || !state.room || _previewGroup.parent !== state.room.group) {
      _previewGroup = null;
    } else {
      return _previewGroup;
    }
  }
  if (typeof THREE === 'undefined' || !state.room || !state.room.group) return null;
  _previewGroup = new THREE.Group();
  _previewGroup.name = 'cld-kitchen-draw-preview';
  state.room.group.add(_previewGroup);
  return _previewGroup;
}

function clearPreviewGroup() {
  clearSlopePreviewMesh();
  if (_previewGroup) {
    _previewGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
    if (_previewGroup.parent) _previewGroup.parent.remove(_previewGroup);
    _previewGroup = null;
  }
  const html = document.getElementById('cld-kitchen-draw-html-preview');
  if (html) html.replaceChildren();
}

/** --- Скошенный потолок (IKEA SPEC) --- */

const SLOPE_DEFAULT_A = 1300;
const SLOPE_DEFAULT_B = 1400;
const SLOPE_MIN_A = 400;
const SLOPE_MAX_A = 4000;
const SLOPE_MIN_B = 10;
const SLOPE_MAX_B = 10000;
const SLOPE_MIN_C = 90;
const SLOPE_MAX_C = 180;

function roomCeilingHeightMm() {
  return Math.max(2000, (state.room && state.room.height) || 2500);
}

/** IKEA DepthToAngleForSlopedWall(H, B, A) ≈ 90 + atan((H−A)/B)·180/π */
function depthToAngleDeg(wallH, depthB, heightA) {
  const rise = Math.max(0, wallH - heightA);
  const b = Math.max(1, depthB);
  return 90 + (Math.atan(rise / b) * 180) / Math.PI;
}

/** IKEA AnglesToDepthForSlopedWall — обратная к depthToAngle */
function angleToDepthMm(wallH, angleDeg, heightA) {
  const a = Math.max(0.05, angleDeg - 90);
  const rise = Math.max(0, wallH - heightA);
  return rise / Math.tan((a * Math.PI) / 180);
}

function clampSlopeA(aMm, wallH) {
  return Math.max(SLOPE_MIN_A, Math.min(Math.min(SLOPE_MAX_A, wallH - 50), aMm));
}

function clampSlopeB(bMm) {
  return Math.max(SLOPE_MIN_B, Math.min(SLOPE_MAX_B, bMm));
}

function clampSlopeC(cDeg) {
  return Math.max(SLOPE_MIN_C + 0.1, Math.min(SLOPE_MAX_C - 0.1, cDeg));
}

function ensureSlopeDraft() {
  if (!_draft) _draft = emptyDraft('slope');
  if (!_draft.slope) {
    const H = roomCeilingHeightMm();
    _draft.slope = {
      aMm: SLOPE_DEFAULT_A,
      bMm: SLOPE_DEFAULT_B,
      cDeg: depthToAngleDeg(H, SLOPE_DEFAULT_B, SLOPE_DEFAULT_A),
      link: 'B',
    };
  }
  return _draft.slope;
}

function readSlopeABC() {
  const s = ensureSlopeDraft();
  const inpA = document.getElementById('cld-draw-slope-a');
  const inpB = document.getElementById('cld-draw-slope-b');
  const inpC = document.getElementById('cld-draw-slope-c');
  const H = roomCeilingHeightMm();
  let aMm = clampSlopeA(Number(inpA && inpA.value) || s.aMm || SLOPE_DEFAULT_A, H);
  let bMm = clampSlopeB(Number(inpB && inpB.value) || s.bMm || SLOPE_DEFAULT_B);
  let cDeg = Number.parseFloat(String((inpC && inpC.value) || s.cDeg || 131).replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(cDeg)) cDeg = depthToAngleDeg(H, bMm, aMm);
  cDeg = clampSlopeC(cDeg);
  return { aMm, bMm, cDeg, H };
}

function writeSlopeDraft(partial) {
  const s = ensureSlopeDraft();
  Object.assign(s, partial);
}

function mountSlopeSidePanel(side) {
  const H = roomCeilingHeightMm();
  const s = ensureSlopeDraft();
  const a0 = clampSlopeA(s.aMm || SLOPE_DEFAULT_A, H);
  const b0 = clampSlopeB(s.bMm || SLOPE_DEFAULT_B);
  const c0 = clampSlopeC(s.cDeg || depthToAngleDeg(H, b0, a0));
  const link = s.link === 'C' ? 'C' : 'B';
  writeSlopeDraft({ aMm: a0, bMm: b0, cDeg: c0, link });

  side.innerHTML =
    '<div class="cld-kitchen-draw-slope">' +
    '<div class="cld-kitchen-draw-slope__head">' +
    '<h3 class="cld-kitchen-draw-slope__title" id="cld-draw-slope-title">' +
    (_editingSlopeId || _editingSlopeBackup ? 'Изменить скошенный потолок' : 'Скошенный потолок') +
    '</h3>' +
    '<button type="button" class="cld-kitchen-draw-slope__schema-toggle" id="cld-draw-slope-schema-toggle" aria-expanded="true">' +
    'Скрыть схему</button></div>' +
    '<p class="cld-kitchen-draw-slope__retarget" id="cld-draw-slope-retarget"' +
    (_editingSlopeId || _editingSlopeBackup ? '' : ' hidden') +
    '>Нажмите на другую стену на плане, чтобы переставить скос</p>' +
    '<figure class="cld-kitchen-draw-slope__diagram" id="cld-draw-slope-schema">' +
    '<img src="/images/slope-ceiling-schema.png" alt="Схема скошенного потолка: A, B, C" width="260" height="168" />' +
    '</figure>' +
    '<label class="cld-kitchen-draw-slope__field"><span class="cld-kitchen-draw-slope__lab">A</span>' +
    '<input type="number" id="cld-draw-slope-a" value="' +
    Math.round(a0) +
    '" min="' +
    SLOPE_MIN_A +
    '" max="' +
    SLOPE_MAX_A +
    '" step="10" /> <span class="cld-kitchen-draw-slope__unit">mm</span></label>' +
    '<div class="cld-kitchen-draw-slope__linked">' +
    '<span class="cld-kitchen-draw-slope__chain" aria-hidden="true"></span>' +
    '<label class="cld-kitchen-draw-slope__field cld-kitchen-draw-slope__field--radio">' +
    '<input type="radio" name="cld-slope-link" id="cld-draw-slope-radio-b" value="B"' +
    (link === 'B' ? ' checked' : '') +
    ' />' +
    '<span class="cld-kitchen-draw-slope__lab">B</span>' +
    '<input type="number" id="cld-draw-slope-b" value="' +
    Math.round(b0) +
    '" min="' +
    SLOPE_MIN_B +
    '" max="' +
    SLOPE_MAX_B +
    '" step="10"' +
    (link === 'C' ? ' readonly aria-disabled="true"' : '') +
    ' /> <span class="cld-kitchen-draw-slope__unit">mm</span></label>' +
    '<label class="cld-kitchen-draw-slope__field cld-kitchen-draw-slope__field--radio">' +
    '<input type="radio" name="cld-slope-link" id="cld-draw-slope-radio-c" value="C"' +
    (link === 'C' ? ' checked' : '') +
    ' />' +
    '<span class="cld-kitchen-draw-slope__lab">C</span>' +
    '<input type="number" id="cld-draw-slope-c" value="' +
    Math.round(c0) +
    '" min="' +
    SLOPE_MIN_C +
    '" max="' +
    SLOPE_MAX_C +
    '" step="1"' +
    (link === 'B' ? ' readonly aria-disabled="true"' : '') +
    ' /> <span class="cld-kitchen-draw-slope__unit">°</span></label>' +
    '</div>' +
    '<div class="cld-kitchen-draw-slope__actions">' +
    '<button type="button" class="cld-kitchen-draw-slope__btn cld-kitchen-draw-slope__btn--ghost" data-draw-act="cancel">Отмена</button>' +
    '<button type="button" class="cld-kitchen-draw-slope__btn cld-kitchen-draw-slope__btn--primary" data-draw-act="create-slope"' +
    (_slopeEdge ? '' : ' disabled aria-disabled="true"') +
    '>' +
    (_editingSlopeId || _editingSlopeBackup ? 'Сохранить' : 'Создать') +
    '</button>' +
    '</div>' +
    (_editingSlopeId || _editingSlopeBackup
      ? '<button type="button" class="cld-kitchen-draw-slope__btn cld-kitchen-draw-slope__btn--danger" data-draw-act="remove-slope">Удалить</button>'
      : '') +
    '</div>';

  bindSlopeSidePanel(side);
}

function bindSlopeSidePanel(side) {
  const inpA = side.querySelector('#cld-draw-slope-a');
  const inpB = side.querySelector('#cld-draw-slope-b');
  const inpC = side.querySelector('#cld-draw-slope-c');
  const radioB = side.querySelector('#cld-draw-slope-radio-b');
  const radioC = side.querySelector('#cld-draw-slope-radio-c');
  const schema = side.querySelector('#cld-draw-slope-schema');
  const schemaBtn = side.querySelector('#cld-draw-slope-schema-toggle');

  if (schemaBtn && schema) {
    schemaBtn.addEventListener('click', () => {
      const open = schemaBtn.getAttribute('aria-expanded') !== 'false';
      schemaBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      schema.hidden = open;
      schemaBtn.textContent = open ? 'Показать схему' : 'Скрыть схему';
    });
  }

  const setLinkedEditable = (link) => {
    writeSlopeDraft({ link });
    if (inpB) {
      inpB.readOnly = link === 'C';
      inpB.setAttribute('aria-disabled', link === 'C' ? 'true' : 'false');
    }
    if (inpC) {
      inpC.readOnly = link === 'B';
      inpC.setAttribute('aria-disabled', link === 'B' ? 'true' : 'false');
    }
  };

  const syncFromAorB = () => {
    const H = roomCeilingHeightMm();
    const aMm = clampSlopeA(Number(inpA && inpA.value) || SLOPE_DEFAULT_A, H);
    const bMm = clampSlopeB(Number(inpB && inpB.value) || SLOPE_DEFAULT_B);
    const cDeg = clampSlopeC(depthToAngleDeg(H, bMm, aMm));
    if (inpA) inpA.value = String(Math.round(aMm));
    if (inpB) inpB.value = String(Math.round(bMm));
    if (inpC) inpC.value = String(Math.round(cDeg));
    writeSlopeDraft({ aMm, bMm, cDeg });
    refreshSlopePreview();
  };

  const syncFromC = () => {
    const H = roomCeilingHeightMm();
    const aMm = clampSlopeA(Number(inpA && inpA.value) || SLOPE_DEFAULT_A, H);
    let cDeg = Number.parseFloat(String((inpC && inpC.value) || 131));
    if (!Number.isFinite(cDeg)) cDeg = 131;
    cDeg = clampSlopeC(cDeg);
    const bMm = clampSlopeB(angleToDepthMm(H, cDeg, aMm));
    if (inpA) inpA.value = String(Math.round(aMm));
    if (inpB) inpB.value = String(Math.round(bMm));
    if (inpC) inpC.value = String(Math.round(cDeg));
    writeSlopeDraft({ aMm, bMm, cDeg });
    refreshSlopePreview();
  };

  if (radioB) {
    radioB.addEventListener('change', () => {
      if (radioB.checked) {
        setLinkedEditable('B');
        syncFromAorB();
      }
    });
  }
  if (radioC) {
    radioC.addEventListener('change', () => {
      if (radioC.checked) {
        setLinkedEditable('C');
        syncFromC();
      }
    });
  }
  if (inpA) inpA.addEventListener('input', syncFromAorB);
  if (inpB) {
    inpB.addEventListener('input', () => {
      if (inpB.readOnly) return;
      syncFromAorB();
    });
  }
  if (inpC) {
    inpC.addEventListener('input', () => {
      if (inpC.readOnly) return;
      syncFromC();
    });
  }
}

function wallInwardNormal(x1, z1, x2, z2) {
  const verts = footprintVerts();
  const c = polyCentroid(verts || []);
  const len = Math.hypot(x2 - x1, z2 - z1) || 1;
  let nx = -((z2 - z1) / len);
  let nz = (x2 - x1) / len;
  const midX = (x1 + x2) * 0.5;
  const midZ = (z1 + z2) * 0.5;
  if (nx * (c.x - midX) + nz * (c.z - midZ) < 0) {
    nx = -nx;
    nz = -nz;
  }
  return { nx, nz };
}

function pickSlopeWallEdge(clientX, clientY) {
  const r = state.room;
  const box = canvasEl();
  if (!r || !box || !state.camera || !state.raycaster || typeof THREE === 'undefined') {
    return null;
  }
  const rect = box.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  state.raycaster.setFromCamera(mouse, state.camera);

  let edgeIndex = null;
  let segFromHit = null;
  const strips = [];
  r.group.traverse((o) => {
    if (o.isMesh && o.userData && (o.userData.isPolygonWallStrip || Number.isFinite(o.userData.edgeIndex))) {
      strips.push(o);
    }
  });
  if (strips.length) {
    const hits = state.raycaster.intersectObjects(strips, false);
    if (hits.length && Number.isFinite(hits[0].object.userData.edgeIndex)) {
      edgeIndex = hits[0].object.userData.edgeIndex;
      const seg = hits[0].object.userData.segment;
      if (seg && Number.isFinite(seg.x1) && Number.isFinite(seg.z1)) segFromHit = seg;
    }
  }
  if (edgeIndex == null && r.wallPlanes && r.wallPlanes.length) {
    const hits = state.raycaster.intersectObjects(r.wallPlanes, false);
    if (hits.length && Number.isFinite(hits[0].object.userData.edgeIndex)) {
      edgeIndex = hits[0].object.userData.edgeIndex;
      const seg = hits[0].object.userData.segment;
      if (seg && Number.isFinite(seg.x1) && Number.isFinite(seg.z1)) segFromHit = seg;
    }
  }
  if (edgeIndex == null) {
    const raw = pickFloorXZ(clientX, clientY);
    if (!raw) return null;
    const hover = nearestWallHover(raw.x, raw.z);
    if (!hover || hover.edgeIndex == null) return null;
    edgeIndex = hover.edgeIndex;
  }

  const verts = footprintVerts();
  const segs = footprintSegs();
  if (!verts || edgeIndex < 0 || edgeIndex >= verts.length) return null;
  if (segs && segs[edgeIndex] && segs[edgeIndex].open) return null;

  let x1;
  let z1;
  let x2;
  let z2;
  if (segFromHit) {
    x1 = segFromHit.x1;
    z1 = segFromHit.z1;
    x2 = segFromHit.x2;
    z2 = segFromHit.z2;
  } else if (segs && segs[edgeIndex]) {
    x1 = segs[edgeIndex].x1;
    z1 = segs[edgeIndex].z1;
    x2 = segs[edgeIndex].x2;
    z2 = segs[edgeIndex].z2;
  } else {
    const a = verts[edgeIndex];
    const b = verts[(edgeIndex + 1) % verts.length];
    x1 = a.x;
    z1 = a.z;
    x2 = b.x;
    z2 = b.z;
  }
  const { nx, nz } = wallInwardNormal(x1, z1, x2, z2);
  return { edgeIndex, x1, z1, x2, z2, nx, nz };
}

function clearSlopePreviewMesh() {
  if (!_previewGroup) return;
  const roots = _previewGroup.children.slice().filter(
    (o) => o.userData && (o.userData.isSlopePreview || o.name === 'cld-slope-preview')
  );
  for (const o of roots) {
    _previewGroup.remove(o);
    o.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    });
  }
}

function slopeWallColorHex() {
  try {
    const room = state.room;
    const walls = room && room.walls;
    if (walls) {
      for (const k of Object.keys(walls)) {
        if (k === 'ceiling' || k === '__ring') continue;
        const mat = walls[k] && walls[k].material;
        // текстурный материал без UV на скосе даёт чёрный — берём только плоский цвет
        if (mat && mat.map) continue;
        const col = mat && mat.color;
        if (col && typeof col.getHex === 'function') {
          const hex = col.getHex();
          if (hex > 0x202020) return hex;
        }
      }
    }
    const inners = room && room.wallInners;
    if (inners) {
      for (const k of Object.keys(inners)) {
        const mat = inners[k] && inners[k].material;
        if (mat && mat.map) continue;
        const col = mat && mat.color;
        if (col && typeof col.getHex === 'function') {
          const hex = col.getHex();
          if (hex > 0x202020) return hex;
        }
      }
    }
  } catch (_) {}
  return 0xe8e8e0;
}

/** Тот же wall-шейдер IKEA v0 (штукатурка + spot), что у wallInners. */
function applySlopeWallMaterial(mesh) {
  if (!mesh || !mesh.isMesh) return;
  mesh.userData.isKitchenCeilingSlope = true;
  mesh.userData.isKitchenCeilingSlopePart = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  if (mesh.material) mesh.material.dispose?.();
  mesh.material = new THREE.MeshLambertMaterial({
    color: slopeWallColorHex(),
    side: THREE.DoubleSide,
  });
}

/**
 * live=true  — синий «призрак» IKEA (превью до Создать)
 * live=false — непрозрачный белый объём как стена/потолок после Создать
 */
function buildSlopeMesh(edge, aMm, bMm, live) {
  if (!edge || typeof THREE === 'undefined') return null;
  const H = roomCeilingHeightMm();
  const A = clampSlopeA(aMm, H);
  const B = clampSlopeB(bMm);

  const { nx, nz } = wallInwardNormal(edge.x1, edge.z1, edge.x2, edge.z2);
  // live: inset от стены, чтобы не z-fight; solid: чуть внутрь + совпадает по цвету со стеной
  const inset = live ? 12 : 2;
  const x1 = edge.x1 + nx * inset;
  const z1 = edge.z1 + nz * inset;
  const x2 = edge.x2 + nx * inset;
  const z2 = edge.z2 + nz * inset;
  const depth = Math.max(1, B);

  const wA1 = new THREE.Vector3(x1, A, z1);
  const wA2 = new THREE.Vector3(x2, A, z2);
  const wH1 = new THREE.Vector3(x1, H, z1);
  const wH2 = new THREE.Vector3(x2, H, z2);
  const iH1 = new THREE.Vector3(x1 + nx * depth, H, z1 + nz * depth);
  const iH2 = new THREE.Vector3(x2 + nx * depth, H, z2 + nz * depth);

  const root = new THREE.Group();
  root.userData.isSlopePreview = !!live;
  root.userData.isKitchenCeilingSlope = !live;
  root.name = live ? 'cld-slope-preview' : 'cld-slope-solid';
  root.renderOrder = live ? 3 : 1;
  // в 2D-плане IKEA не рисует объём скоса сверху — только голубая полоса + значок
  if (!live) root.userData.hideInTopView = true;

  const mkQuad = (a, b, c, d, mat) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z]),
        3
      )
    );
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.userData.isSlopePreview = !!live;
    m.userData.isKitchenCeilingSlope = !live;
    return m;
  };

  const mkTri = (a, b, c, mat) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]),
        3
      )
    );
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.userData.isSlopePreview = !!live;
    m.userData.isKitchenCeilingSlope = !live;
    return m;
  };

  if (live) {
    const mkGhost = (opacity) =>
      new THREE.MeshBasicMaterial({
        color: 0x7ec8f0,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
    root.add(mkQuad(wA1, wA2, wH2, wH1, mkGhost(0.5)));
    root.add(mkQuad(wA1, wA2, iH2, iH1, mkGhost(0.45)));
    root.add(mkQuad(wH1, wH2, iH2, iH1, mkGhost(0.28)));

    const outline = [
      wA1, wH1, wH1, iH1, iH1, wA1,
      wA2, wH2, wH2, iH2, iH2, wA2,
      wA1, wA2,
      wH1, wH2,
      iH1, iH2,
    ];
    const line = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(outline),
      new THREE.LineBasicMaterial({
        color: 0x0058a3,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      })
    );
    line.userData.isSlopePreview = true;
    line.renderOrder = 4;
    root.add(line);

    const mx = (x1 + x2) * 0.5;
    const mz = (z1 + z2) * 0.5;
    const dash = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(mx, 0, mz),
        new THREE.Vector3(mx, A, mz),
      ]),
      new THREE.LineDashedMaterial({
        color: 0x0058a3,
        dashSize: 40,
        gapSize: 30,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      })
    );
    dash.computeLineDistances();
    dash.userData.isSlopePreview = true;
    root.add(dash);
  } else {
    // IKEA после Create: одна толстая стена (сеч. толщина T) + скос в комнату на B.
    const solid = buildThickSlopedWallMesh(edge, A, depth, H);
    if (solid) root.add(solid);
  }

  return root;
}

/**
 * IKEA Create (SPEC): остаток стены высоты A, толщина T; скос той же толщины
 * уходит в комнату на глубину B до потолка H. Без пластин/треугольников.
 *
 * Сечение в плоскости (внутрь × вверх), выдавка вдоль стены.
 * Transform через applyMatrix4 — НЕ quaternion (левый базис ломал ориентацию).
 */
function buildThickSlopedWallMesh(edge, A, B, H) {
  if (!edge || typeof THREE === 'undefined') return null;
  const T = WALL_THICKNESS || 100;
  const dx = edge.x2 - edge.x1;
  const dz = edge.z2 - edge.z1;
  const len = Math.hypot(dx, dz);
  if (len < 10) return null;
  let ux = dx / len;
  let uz = dz / len;
  const { nx, nz } = wallInwardNormal(edge.x1, edge.z1, edge.x2, edge.z2);

  const run = Math.max(10, B);
  const rise = Math.max(1, H - A);
  const slopeLen = Math.hypot(run, rise);
  // вдоль скоса (s=внутрь, y=вверх) и перпендикуляр «в чердак» (толщина плиты = T)
  const as = run / slopeLen;
  const ay = rise / slopeLen;
  const ps = -ay;
  const py = as;

  // s=0 — наружная грань, s=T — внутренняя, дальше скос до s=T+run
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(T, 0);
  shape.lineTo(T, A);
  shape.lineTo(T + run, H);
  shape.lineTo(T + run + ps * T, H + py * T);
  shape.lineTo(T + ps * T, A + py * T);
  shape.lineTo(0, A);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: len,
    bevelEnabled: false,
  });

  // Правый базис: X=inward, Y=up, Z=along (при det<0 — разворот along)
  let px = edge.x1 - nx * T;
  let pz = edge.z1 - nz * T;
  const det = -nz * ux + nx * uz;
  if (det < 0) {
    ux = -ux;
    uz = -uz;
    px = edge.x2 - nx * T;
    pz = edge.z2 - nz * T;
  }
  const mat = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(nx, 0, nz),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(ux, 0, uz)
  );
  mat.setPosition(px, 0, pz);
  geo.applyMatrix4(mat);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      color: slopeWallColorHex(),
      side: THREE.DoubleSide,
      depthWrite: true,
    })
  );
  mesh.name = 'cld-slope-thick-wall';
  mesh.userData.hideInTopView = true;
  applySlopeWallMaterial(mesh);
  return mesh;
}

function isRoomEditTopView2d() {
  return typeof window !== 'undefined' && window.__cldRoomEditView === '2d';
}

/** Скрыть 3D-объём скоса в виде сверху (иначе серое пятно на полу). */
export function syncKitchenCeilingSlopeViewVisibility() {
  const room = state.room;
  if (!room || !room.group) return;
  const hideTop = isRoomEditTopView2d();
  const root = room.group.getObjectByName('cld-kitchen-ceiling-slopes');
  if (root) {
    root.visible = !hideTop;
    root.traverse((o) => {
      if (o.isMesh) o.visible = !hideTop;
    });
  }
  refreshKitchenCeilingSlopeMarkers2d();
}

function ensureSlopeMarkersLayer() {
  let el = document.getElementById('cld-kitchen-slope-markers');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'cld-kitchen-slope-markers';
  el.className = 'cld-kitchen-slope-markers';
  el.setAttribute('aria-hidden', 'false');
  document.body.appendChild(el);
  el.addEventListener('click', onSlopeMarkerClick);
  return el;
}

function clearSlopeMarkersLayer() {
  const el = document.getElementById('cld-kitchen-slope-markers');
  if (el) el.replaceChildren();
  const pop = document.getElementById('cld-kitchen-slope-pop');
  if (pop) pop.remove();
}

function onSlopeMarkerClick(e) {
  const btn = e.target.closest('[data-slope-id]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const id = btn.getAttribute('data-slope-id');
  const list = Array.isArray(state.kitchenCeilingSlopes) ? state.kitchenCeilingSlopes : [];
  const s = list.find((x) => x && x.id === id);
  if (!s) return;
  showSlopeActionPop(btn, s);
}

function showSlopeActionPop(anchorEl, slope) {
  let pop = document.getElementById('cld-kitchen-slope-pop');
  if (pop) pop.remove();
  pop = document.createElement('div');
  pop.id = 'cld-kitchen-slope-pop';
  pop.className = 'cld-kitchen-slope-pop';
  // IKEA actionList: заголовок «Скошенный потолок» + Изменить / Удалить
  pop.innerHTML =
    '<div class="cld-kitchen-slope-pop__title">Скошенный потолок</div>' +
    '<button type="button" data-slope-act="change">Изменить скошенный потолок</button>' +
    '<button type="button" data-slope-act="remove">Удалить скошенный потолок</button>';
  const r = anchorEl.getBoundingClientRect();
  pop.style.left = Math.round(r.left + r.width / 2) + 'px';
  pop.style.top = Math.round(r.top) + 'px';
  document.body.appendChild(pop);
  const close = () => {
    pop.remove();
    document.removeEventListener('pointerdown', onDoc, true);
  };
  const onDoc = (ev) => {
    if (pop.contains(ev.target) || anchorEl.contains(ev.target)) return;
    close();
  };
  document.addEventListener('pointerdown', onDoc, true);
  pop.addEventListener('click', (ev) => {
    const act = ev.target.closest('[data-slope-act]');
    if (!act) return;
    const kind = act.getAttribute('data-slope-act');
    close();
    if (kind === 'remove') {
      removeKitchenCeilingSlope(slope.id);
      return;
    }
    if (kind === 'change') {
      beginEditKitchenCeilingSlope(slope);
    }
  });
}

function removeKitchenCeilingSlope(slopeId) {
  if (!slopeId) return;
  state.kitchenCeilingSlopes = (state.kitchenCeilingSlopes || []).filter((x) => x && x.id !== slopeId);
  if (_editingSlopeId === slopeId) {
    _editingSlopeId = null;
    _editingSlopeBackup = null;
  }
  try {
    refreshKitchenCeilingSlopes();
  } catch (_) {}
}

function beginEditKitchenCeilingSlope(slope) {
  if (!slope) return;
  _editingSlopeId = slope.id;
  _editingSlopeBackup = { ...slope };
  state.kitchenCeilingSlopes = (state.kitchenCeilingSlopes || []).filter((x) => x && x.id !== slope.id);
  refreshKitchenCeilingSlopes();
  enterKitchenDrawMode('slope');
  _slopeEdge = {
    edgeIndex: slope.edgeIndex,
    x1: slope.x1,
    z1: slope.z1,
    x2: slope.x2,
    z2: slope.z2,
    nx: slope.nx,
    nz: slope.nz,
  };
  const s = ensureSlopeDraft();
  s.aMm = slope.aMm;
  s.bMm = slope.bMm;
  s.cDeg = slope.cDeg;
  s.link = 'B';
  _draft.slope = Object.assign({}, s, { edge: _slopeEdge });
  // как IKEA: правка в 2D — клик по другой стене переставляет скос
  try {
    if (typeof window.__cldSetRoomEditViewMode === 'function') {
      window.__cldSetRoomEditViewMode('2d');
    }
  } catch (_) {}
  // пересобрать боковую панель A/B/C + Удалить (не зона)
  const side = document.getElementById('cld-kitchen-draw-side');
  if (side) {
    side.hidden = false;
    side.replaceChildren();
    mountSlopeSidePanel(side);
  }
  refreshSlopePreview();
  syncOverlayChrome();
}

/**
 * IKEA 2D после Create: голубая полоса вдоль стены + зона глубины B + значок.
 */
export function refreshKitchenCeilingSlopeMarkers2d() {
  if (_slopeMarkerRaf) cancelAnimationFrame(_slopeMarkerRaf);
  _slopeMarkerRaf = requestAnimationFrame(() => {
    _slopeMarkerRaf = 0;
    paintKitchenCeilingSlopeMarkers2d();
  });
}

function paintKitchenCeilingSlopeMarkers2d() {
  const layer = ensureSlopeMarkersLayer();
  layer.replaceChildren();
  const pop = document.getElementById('cld-kitchen-slope-pop');
  if (pop) pop.remove();

  if (!isRoomEditTopView2d()) {
    layer.hidden = true;
    return;
  }
  const list = Array.isArray(state.kitchenCeilingSlopes) ? state.kitchenCeilingSlopes : [];
  if (!list.length || !state.room || !state.camera) {
    layer.hidden = true;
    return;
  }
  layer.hidden = false;

  const T = WALL_THICKNESS || 100;
  for (const s of list) {
    if (!s) continue;
    const { nx, nz } = wallInwardNormal(s.x1, s.z1, s.x2, s.z2);
    const B = clampSlopeB(s.bMm);
    // голубая зона пола под скосом (глубина B внутрь)
    const z0 = { x: s.x1, z: s.z1 };
    const z1 = { x: s.x2, z: s.z2 };
    const z2 = { x: s.x2 + nx * B, z: s.z2 + nz * B };
    const z3 = { x: s.x1 + nx * B, z: s.z1 + nz * B };
    const polyScr = [z0, z1, z2, z3].map((p) => projectLocalToScreen(p.x, 20, p.z));
    if (polyScr.every(Boolean)) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'cld-kitchen-slope-zone');
      Object.assign(svg.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      });
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute(
        'points',
        polyScr.map((p) => Math.round(p.left) + ',' + Math.round(p.top)).join(' ')
      );
      poly.setAttribute('fill', 'rgba(0, 120, 200, 0.18)');
      poly.setAttribute('stroke', 'rgba(0, 88, 163, 0.55)');
      poly.setAttribute('stroke-width', '1.5');
      svg.appendChild(poly);
      layer.appendChild(svg);
    }

    // голубая полоса стены (толщина T, чуть наружу+внутрь)
    const a = projectLocalToScreen(s.x1 - nx * (T * 0.15), 40, s.z1 - nz * (T * 0.15));
    const b = projectLocalToScreen(s.x2 - nx * (T * 0.15), 40, s.z2 - nz * (T * 0.15));
    if (a && b) {
      const dx = b.left - a.left;
      const dy = b.top - a.top;
      const len = Math.hypot(dx, dy) || 1;
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      const strip = document.createElement('div');
      strip.className = 'cld-kitchen-slope-wall-strip';
      strip.style.left = Math.round(a.left) + 'px';
      strip.style.top = Math.round(a.top) + 'px';
      strip.style.width = Math.round(len) + 'px';
      strip.style.height = Math.max(10, Math.round(wallThicknessPx() * 0.95)) + 'px';
      strip.style.transform = 'rotate(' + ang + 'deg)';
      layer.appendChild(strip);
    }

    // значок IKEA slopedCeiling_feedback — середина стены, внутрь на T/2
    const mx = (s.x1 + s.x2) * 0.5 + nx * (T * 0.55);
    const mz = (s.z1 + s.z2) * 0.5 + nz * (T * 0.55);
    const ic = projectLocalToScreen(mx, 40, mz);
    if (ic) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cld-kitchen-slope-icon';
      btn.setAttribute('data-slope-id', s.id);
      btn.setAttribute('aria-label', 'Скошенный потолок');
      btn.title = 'Скошенный потолок';
      btn.style.left = Math.round(ic.left) + 'px';
      btn.style.top = Math.round(ic.top) + 'px';
      btn.innerHTML =
        '<img src="/images/sloped-ceiling-feedback.svg" alt="" width="28" height="28" draggable="false" />';
      layer.appendChild(btn);
    }
  }
}

function rectWallNameForEdge(edge) {
  const room = state.room;
  if (!room || !edge) return null;
  const mx = (Number(edge.x1) + Number(edge.x2)) * 0.5;
  const mz = (Number(edge.z1) + Number(edge.z2)) * 0.5;
  const w = Number(room.width) || 0;
  const d = Number(room.depth) || 0;
  const scores = [
    ['back', Math.abs(mz - 0)],
    ['front', Math.abs(mz - d)],
    ['left', Math.abs(mx - 0)],
    ['right', Math.abs(mx - w)],
  ];
  scores.sort((a, b) => a[1] - b[1]);
  return scores[0] && scores[0][1] < 120 ? scores[0][0] : null;
}

function findWallNamesForSlopeEdge(edge) {
  const room = state.room;
  if (!room || !edge) return [];
  const names = new Set();
  const rectName = rectWallNameForEdge(edge);
  if (rectName) names.add(rectName);

  const ei = Number(edge.edgeIndex);
  try {
    room.group.traverse((o) => {
      if (!o.isMesh || !o.userData) return;
      if (Number.isFinite(ei) && Number(o.userData.edgeIndex) === ei && o.userData.wallName) {
        names.add(o.userData.wallName);
      }
    });
  } catch (_) {}

  if (!names.size) {
    const { nx, nz } = wallInwardNormal(edge.x1, edge.z1, edge.x2, edge.z2);
    for (const p of room.wallPlanes || []) {
      const n = p.userData && p.userData.normal;
      if (!n || !p.userData.wallName) continue;
      if (Math.abs(n.x - nx) < 0.25 && Math.abs(n.z - nz) < 0.25) {
        names.add(p.userData.wallName);
      }
    }
  }
  return Array.from(names);
}

/** IKEA: укоротить стену до A + вырезать угол соседних стен. */
function restoreSlopeWallCuts() {
  const room = state.room;
  if (!room || !room.group) return;
  room.group.traverse((o) => {
    if (!o.isMesh || !o.userData || !o.userData._slopeCutBackup) return;
    const b = o.userData._slopeCutBackup;
    if (b.kind === 'inner' || b.kind === 'notch') {
      if (o.geometry && o.geometry !== b.geo) o.geometry.dispose();
      o.geometry = b.geo;
      if (b.pos) o.position.copy(b.pos);
      else o.position.y = b.y;
      if (b.quat) o.quaternion.copy(b.quat);
      if (b.scale) o.scale.copy(b.scale);
      if (b.visible != null) o.visible = b.visible;
    } else if (b.kind === 'frame') {
      o.scale.y = b.sy;
      o.position.y = b.y;
      if (b.visible != null) o.visible = b.visible;
    } else if (b.kind === 'hide') {
      o.visible = b.visible;
    }
    delete o.userData._slopeCutBackup;
  });
}

function getMeshesForEdgeIndex(edgeIndex) {
  const room = state.room;
  const out = { inner: null, frame: null };
  if (!room || !room.group || !Number.isFinite(Number(edgeIndex))) return out;
  const ei = Number(edgeIndex);
  try {
    room.group.traverse((o) => {
      if (!o.isMesh || !o.userData) return;
      if (Number(o.userData.edgeIndex) !== ei) return;
      if (o.userData.isPolygonWallInner) out.inner = o;
      else if (o.userData.isPolygonWallStrip) out.frame = o;
    });
  } catch (_) {}
  return out;
}

/** Вырез верха соседней стены: диагональ A→H на глубине B (как у IKEA). */
function notchWallInner(inner, len, H, A, B, notchAtStart) {
  if (!inner || !len || len < 10) return;
  const notch = Math.max(10, Math.min(B, len - 10));
  const shape = new THREE.Shape();
  const x0 = -len / 2;
  const x1 = len / 2;
  const y0 = -H / 2;
  const y1 = H / 2;
  const yA = A - H / 2;
  if (notchAtStart) {
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0 + notch, y1);
    shape.lineTo(x0, yA);
    shape.closePath();
  } else {
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, yA);
    shape.lineTo(x1 - notch, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
  }
  if (!inner.userData._slopeCutBackup) {
    inner.userData._slopeCutBackup = {
      kind: 'notch',
      geo: inner.geometry,
      y: inner.position.y,
    };
  }
  const geo = new THREE.ShapeGeometry(shape);
  if (inner.geometry && inner.geometry !== inner.userData._slopeCutBackup.geo) {
    inner.geometry.dispose();
  }
  inner.geometry = geo;
  // центр по полной высоте H — как у PlaneGeometry до выреза
  inner.position.y = H / 2;
}

/**
 * Толстый каркас соседней стены (createMiteredWall): та же выемка A→H на B.
 * Геометрия в координатах комнаты — transform меша сбрасываем.
 */
function notchWallFrame(frame, adjSeg, H, A, B, notchAtStart) {
  if (!frame || !adjSeg || typeof THREE === 'undefined') return;
  const T = (frame.userData && frame.userData.wallThickness) || WALL_THICKNESS || 100;
  const dx = adjSeg.x2 - adjSeg.x1;
  const dz = adjSeg.z2 - adjSeg.z1;
  const len = Math.hypot(dx, dz);
  if (len < 20) return;
  let ux = dx / len;
  let uz = dz / len;
  const { nx, nz } = wallInwardNormal(adjSeg.x1, adjSeg.z1, adjSeg.x2, adjSeg.z2);
  const notch = Math.max(10, Math.min(B, len - 10));
  // какой физический конец режем (в координатах сегмента x1→x2)
  let cutStart = !!notchAtStart;

  const ox = -nx;
  const oz = -nz;
  let px = adjSeg.x1;
  let pz = adjSeg.z1;
  // правый базис; при развороте along конец u=0 переезжает на x2 → инвертируем cutStart
  const det3 = -uz * ox + ux * oz;
  if (det3 < 0) {
    ux = -ux;
    uz = -uz;
    px = adjSeg.x2;
    pz = adjSeg.z2;
    cutStart = !cutStart;
  }

  // сечение (u вдоль, y вверх), выдавка наружу на T
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(len, 0);
  if (cutStart) {
    shape.lineTo(len, H);
    shape.lineTo(notch, H);
    shape.lineTo(0, A);
  } else {
    shape.lineTo(len, A);
    shape.lineTo(len - notch, H);
    shape.lineTo(0, H);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
  const mat = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(ux, 0, uz),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(ox, 0, oz)
  );
  mat.setPosition(px, 0, pz);
  geo.applyMatrix4(mat);

  if (!frame.userData._slopeCutBackup) {
    frame.userData._slopeCutBackup = {
      kind: 'notch',
      geo: frame.geometry,
      y: frame.position.y,
      pos: frame.position.clone(),
      quat: frame.quaternion.clone(),
      scale: frame.scale.clone(),
    };
  } else if (frame.geometry && frame.geometry !== frame.userData._slopeCutBackup.geo) {
    frame.geometry.dispose();
  }
  frame.geometry = geo;
  frame.position.set(0, 0, 0);
  frame.quaternion.identity();
  frame.scale.set(1, 1, 1);
  frame.updateMatrix();
}

function wallNameForAdjSeg(adjSeg, adjEi) {
  const segs = footprintSegs();
  if (segs && segs[adjEi] && segs[adjEi].wallName) return segs[adjEi].wallName;
  return rectWallNameForEdge(adjSeg);
}

function applySlopeAdjacentNotches(edge, aMm, bMm) {
  const room = state.room;
  if (!room || !edge) return;
  const H = roomCeilingHeightMm();
  const A = clampSlopeA(aMm, H);
  const B = clampSlopeB(bMm);
  if (A >= H - 1) return;

  const segs = footprintSegs();
  const verts = footprintVerts();
  const n = verts ? verts.length : segs ? segs.length : 0;
  const ei = Number(edge.edgeIndex);
  if (!n || !Number.isFinite(ei)) return;

  const adjIndexes = [((ei - 1) % n + n) % n, (ei + 1) % n];
  const corners = [
    { x: edge.x1, z: edge.z1, adj: adjIndexes[0] },
    { x: edge.x2, z: edge.z2, adj: adjIndexes[1] },
  ];

  for (const c of corners) {
    const adjEi = c.adj;
    let adjSeg = segs && segs[adjEi] ? segs[adjEi] : null;
    if (!adjSeg && verts) {
      const a = verts[adjEi];
      const b = verts[(adjEi + 1) % n];
      adjSeg = { x1: a.x, z1: a.z, x2: b.x, z2: b.z };
    }
    if (!adjSeg || adjSeg.open) continue;

    const len = Math.hypot(adjSeg.x2 - adjSeg.x1, adjSeg.z2 - adjSeg.z1);
    if (len < 20) continue;
    const dStart = Math.hypot(adjSeg.x1 - c.x, adjSeg.z1 - c.z);
    const dEnd = Math.hypot(adjSeg.x2 - c.x, adjSeg.z2 - c.z);
    const notchAtStart = dStart <= dEnd;

    const meshes = getMeshesForEdgeIndex(adjEi);
    if (meshes.inner) {
      const innerLen =
        (meshes.inner.geometry &&
          meshes.inner.geometry.parameters &&
          meshes.inner.geometry.parameters.width) ||
        meshes.inner.userData.wallLength ||
        len;
      notchWallInner(meshes.inner, innerLen, H, A, B, notchAtStart);
    }
    if (meshes.frame) {
      notchWallFrame(meshes.frame, adjSeg, H, A, B, notchAtStart);
    }

    const wName = wallNameForAdjSeg(adjSeg, adjEi);
    if (wName && room.wallInners && room.wallInners[wName] && room.wallInners[wName] !== meshes.inner) {
      const inn = room.wallInners[wName];
      const innerLen =
        (inn.geometry && inn.geometry.parameters && inn.geometry.parameters.width) ||
        (inn.userData && inn.userData.wallLength) ||
        len;
      notchWallInner(inn, innerLen, H, A, B, notchAtStart);
    }
    if (wName && room.walls && room.walls[wName] && room.walls[wName] !== meshes.frame && wName !== 'ceiling') {
      notchWallFrame(room.walls[wName], adjSeg, H, A, B, notchAtStart);
    }
  }
}

/** Прячем исходную стену — её заменяет толстый скошенный меш. */
function hidePrimaryWallForSlope(edge) {
  const room = state.room;
  if (!room || !edge) return;
  const hide = (mesh) => {
    if (!mesh) return;
    if (mesh.userData && mesh.userData._slopeCutBackup && mesh.userData._slopeCutBackup.kind === 'hide') {
      mesh.visible = false;
      return;
    }
    if (mesh.userData && mesh.userData._slopeCutBackup) return;
    mesh.userData = mesh.userData || {};
    mesh.userData._slopeCutBackup = { kind: 'hide', visible: mesh.visible !== false };
    mesh.visible = false;
  };
  const ei = Number(edge.edgeIndex);
  const primary = getMeshesForEdgeIndex(ei);
  hide(primary.inner);
  hide(primary.frame);
  const names = findWallNamesForSlopeEdge(edge);
  for (const name of names) {
    if (room.wallInners && room.wallInners[name]) hide(room.wallInners[name]);
    if (room.walls && room.walls[name] && name !== 'ceiling') hide(room.walls[name]);
    for (const p of room.wallPlanes || []) {
      if (p.userData && p.userData.wallName === name) hide(p);
    }
    for (const m of room.openingExtras || []) {
      if (m && m.userData && m.userData.wallName === name) hide(m);
    }
  }
  try {
    room.group.traverse((o) => {
      if (!o.isMesh || !o.userData) return;
      if (o.userData.isKitchenCeilingSlope || o.userData.isSlopePreview) return;
      if (Number.isFinite(ei) && Number(o.userData.edgeIndex) === ei) {
        if (o.userData.isPolygonWallInner || o.userData.isPolygonWallStrip || o.userData.wallName) hide(o);
        return;
      }
      if (names.length && o.userData.wallName && names.includes(o.userData.wallName)) {
        if (o.userData.isPolygonWallInner || o.userData.isPolygonWallStrip || o.userData.buildSide) hide(o);
      }
    });
  } catch (_) {}
}

function applySlopeWallCut(edge, aMm) {
  // толстый меш = вся стена; исходную полосу скрываем
  hidePrimaryWallForSlope(edge);
}

function refreshSlopePreview() {
  clearSlopePreviewMesh();
  if (_activeTool !== 'slope' || !_slopeEdge) return;
  const g = ensurePreviewGroup();
  if (!g) return;
  const { aMm, bMm } = readSlopeABC();
  const mesh = buildSlopeMesh(_slopeEdge, aMm, bMm, true);
  if (mesh) g.add(mesh);
}

function ensureCommittedSlopesLayer() {
  const room = state.room;
  if (!room || !room.group) return null;
  let g = room.group.getObjectByName('cld-kitchen-ceiling-slopes');
  if (g) return g;
  g = new THREE.Group();
  g.name = 'cld-kitchen-ceiling-slopes';
  room.group.add(g);
  return g;
}

export function refreshKitchenCeilingSlopes() {
  restoreSlopeWallCuts();
  const root = ensureCommittedSlopesLayer();
  if (!root) return;
  while (root.children.length) {
    const o = root.children[0];
    root.remove(o);
    o.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    });
  }
  const list = Array.isArray(state.kitchenCeilingSlopes) ? state.kitchenCeilingSlopes : [];
  for (const s of list) {
    const edge = {
      edgeIndex: s.edgeIndex,
      x1: s.x1,
      z1: s.z1,
      x2: s.x2,
      z2: s.z2,
      nx: s.nx,
      nz: s.nz,
    };
    applySlopeWallCut(edge, s.aMm);
    applySlopeAdjacentNotches(edge, s.aMm, s.bMm);
    const mesh = buildSlopeMesh(edge, s.aMm, s.bMm, false);
    if (mesh) {
      mesh.userData.slopeId = s.id;
      mesh.userData.hideInTopView = true;
      mesh.traverse((c) => {
        if (c.userData) c.userData.hideInTopView = true;
      });
      root.add(mesh);
    }
  }
  syncKitchenCeilingSlopeViewVisibility();
}

function onSlopePointerDown(e) {
  if (_activeTool !== 'slope') return;
  if (e.button !== 0) return;
  if (isUiChromeTarget(e.target)) return;
  // не перехватывать клик по значку/меню скоса
  if (e.target.closest && e.target.closest('#cld-kitchen-slope-markers, #cld-kitchen-slope-pop')) {
    return;
  }
  const edge = pickSlopeWallEdge(e.clientX, e.clientY);
  if (!edge) return;
  e.preventDefault();
  e.stopPropagation();
  pushSessionUndo('slope-wall');
  _slopeEdge = edge;
  ensureSlopeDraft();
  _draft.slope = Object.assign({}, _draft.slope || {}, { edge });
  try {
    if (typeof window.__cldSetRoomEditViewMode === 'function') {
      window.__cldSetRoomEditViewMode('3d');
    }
  } catch (_) {}
  refreshSlopePreview();
  syncOverlayChrome();
}

function ensureHtmlPreviewLayer() {
  let el = document.getElementById('cld-kitchen-draw-html-preview');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'cld-kitchen-draw-html-preview';
  el.className = 'cld-kitchen-draw-html-preview';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  return el;
}

function ensureDimLayer() {
  let el = document.getElementById('cld-kitchen-draw-dim');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'cld-kitchen-draw-dim';
  el.className = 'cld-kitchen-draw-dim';
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}

function hideDimLabel() {
  const el = document.getElementById('cld-kitchen-draw-dim');
  if (el) {
    el.hidden = true;
    el.textContent = '';
  }
}

function projectLocalToScreen(x, y, z) {
  const r = state.room;
  if (!r || !state.camera || typeof THREE === 'undefined') return null;
  const box = canvasEl();
  if (!box) return null;
  const rect = box.getBoundingClientRect();
  const v = new THREE.Vector3(x, y, z);
  r.group.localToWorld(v);
  v.project(state.camera);
  if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
  return {
    left: rect.left + ((v.x + 1) / 2) * rect.width,
    top: rect.top + ((1 - v.y) / 2) * rect.height,
  };
}

function showDimLabel(x1, z1, x2, z2) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  if (len < 1) {
    hideDimLabel();
    return;
  }
  const el = ensureDimLayer();
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const scr = projectLocalToScreen(midX, 40, midZ);
  if (!scr) {
    hideDimLabel();
    return;
  }
  el.hidden = false;
  el.textContent = Math.round(len) + ' mm';
  el.style.left = Math.round(scr.left) + 'px';
  el.style.top = Math.round(scr.top) + 'px';
}

/** Толщина стены в экранных px (по WALL_THICKNESS мм). */
function wallThicknessPx() {
  const t = WALL_THICKNESS || 100;
  const a = projectLocalToScreen(0, 40, 0);
  const b = projectLocalToScreen(t, 40, 0);
  if (!a || !b) return 16;
  return Math.max(10, Math.round(Math.hypot(b.left - a.left, b.top - a.top)));
}

/**
 * Непрерывная толстая стена (SVG) — стыки под углом как у IKEA, не «сломанные» прямоугольники.
 * points: [{x,z}, ...] вдоль осевой линии стены.
 */
function appendContinuousWallChain(layer, points, live) {
  if (!points || points.length < 2) return;
  const scr = [];
  for (const p of points) {
    const s = projectLocalToScreen(p.x, 40, p.z);
    if (s) scr.push(s);
  }
  if (scr.length < 2) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'cld-kitchen-draw-svg-walls');
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    overflow: 'visible',
    zIndex: '1',
  });
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  poly.setAttribute(
    'points',
    scr.map((p) => Math.round(p.left) + ',' + Math.round(p.top)).join(' ')
  );
  poly.setAttribute('fill', 'none');
  // live = тянем; иначе «замкнутая» / сохранённая — серая как наружные стены (IKEA)
  poly.setAttribute('stroke', live ? '#9ec9ef' : '#b3b3b3');
  poly.setAttribute('stroke-opacity', '1');
  poly.setAttribute('stroke-width', String(wallThicknessPx()));
  poly.setAttribute('stroke-linejoin', 'miter');
  poly.setAttribute('stroke-miterlimit', '8');
  poly.setAttribute('stroke-linecap', 'butt');
  poly.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.appendChild(poly);
  layer.appendChild(svg);

  // mm на каждом сегменте снаружи
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const a = scr[i];
    const b = scr[i + 1];
    if (!a || !b) continue;
    const worldLen = Math.hypot(p1.x - p0.x, p1.z - p0.z);
    if (worldLen >= 40) appendSegmentOuterDim(layer, a, b, worldLen);
  }
}

/** HTML-полоса (только одиночные сохранённые сегменты без цепочки). */
function appendHtmlWallStrip(layer, x1, z1, x2, z2, live, opts) {
  appendContinuousWallChain(
    layer,
    [
      { x: x1, z: z1 },
      { x: x2, z: z2 },
    ],
    !!live
  );
  if (opts && opts.noHandles) return;
  const a = projectLocalToScreen(x1, 40, z1);
  const b = projectLocalToScreen(x2, 40, z2);
  if (!a || !b) return;
  const endOnly = !!(opts && opts.endHandleOnly);
  if (!endOnly) appendHtmlHandle(layer, a.left, a.top);
  appendHtmlHandle(layer, b.left, b.top);
}

/** Подпись длины рядом с сегментом (снаружи, не на самой полосе). */
function appendSegmentOuterDim(layer, a, b, lenMm) {
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const lenPx = Math.hypot(dx, dy) || 1;
  let nx = -dy / lenPx;
  let ny = dx / lenPx;
  const mid = { left: (a.left + b.left) / 2, top: (a.top + b.top) / 2 };
  const c = polyCentroid(footprintVerts() || []);
  const cent = projectLocalToScreen(c.x, 40, c.z);
  if (cent) {
    const toC = { x: cent.left - mid.left, y: cent.top - mid.top };
    if (nx * toC.x + ny * toC.y > 0) {
      nx = -nx;
      ny = -ny;
    }
  }
  const off = Math.max(14, wallThicknessPx() * 0.55 + 8);
  appendWallEdgeDim(layer, mid.left + nx * off, mid.top + ny * off, lenMm);
}

function appendHtmlHandle(layer, left, top, className) {
  const h = document.createElement('div');
  h.className = className || 'cld-kitchen-draw-html-handle';
  h.style.left = Math.round(left) + 'px';
  h.style.top = Math.round(top) + 'px';
  layer.appendChild(h);
}

/** Направляющие выравнивания H/V через точку (как жёлтая линия IKEA). */
function appendAlignGuides(layer, cursor, anchors) {
  if (!cursor || !anchors || !anchors.length) return;
  const c = projectLocalToScreen(cursor.x, 40, cursor.z);
  if (!c) return;
  const ALIGN_MM = 40;
  let hitH = false;
  let hitV = false;
  for (const a of anchors) {
    if (!a) continue;
    if (!hitV && Math.abs(a.x - cursor.x) <= ALIGN_MM) hitV = true;
    if (!hitH && Math.abs(a.z - cursor.z) <= ALIGN_MM) hitH = true;
  }
  if (hitV) appendFullCanvasGuide(layer, c, 90); // вертикаль
  if (hitH) appendFullCanvasGuide(layer, c, 0); // горизонталь
}

function collectAlignAnchors() {
  const pts = [];
  const verts = footprintVerts();
  if (verts) for (const v of verts) pts.push({ x: v.x, z: v.z });
  const iws = Array.isArray(state.kitchenInteriorWalls) ? state.kitchenInteriorWalls : [];
  for (const w of iws) pts.push({ x: w.x1, z: w.z1 }, { x: w.x2, z: w.z2 });
  for (const s of allDraftWallStrokes()) {
    pts.push({ x: s.x1, z: s.z1 }, { x: s.x2, z: s.z2 });
  }
  if (_pendingStart) pts.push({ x: _pendingStart.x, z: _pendingStart.z });
  return pts;
}

/** Мягкий snap к осям якорей (сходимость с другой стеной). */
function softAlignPoint(pt, anchors) {
  let x = pt.x;
  let z = pt.z;
  const ALIGN_MM = 40;
  let bestX = null;
  let bestZ = null;
  for (const a of anchors) {
    if (!a) continue;
    const dx = Math.abs(a.x - x);
    const dz = Math.abs(a.z - z);
    if (dx <= ALIGN_MM && (bestX == null || dx < bestX.d)) bestX = { d: dx, v: a.x };
    if (dz <= ALIGN_MM && (bestZ == null || dz < bestZ.d)) bestZ = { d: dz, v: a.z };
  }
  if (bestX) x = bestX.v;
  if (bestZ) z = bestZ.v;
  return { x, z };
}

/** Липкая H/V от старта (зоны): пока отклонение мало — держим прямо, потом «перескакивает». */
function stickyOrthoFromStart(pt, from) {
  if (!from) return pt;
  const dx = pt.x - from.x;
  const dz = pt.z - from.z;
  const adx = Math.abs(dx);
  const adz = Math.abs(dz);

  if (_zoneOrthoLock === 'h') {
    if (adz > ZONE_ORTHO_RELEASE_MM) _zoneOrthoLock = null;
    else return { x: pt.x, z: from.z };
  } else if (_zoneOrthoLock === 'v') {
    if (adx > ZONE_ORTHO_RELEASE_MM) _zoneOrthoLock = null;
    else return { x: from.x, z: pt.z };
  }

  if (adx >= adz && adz <= ZONE_ORTHO_ENTER_MM) {
    _zoneOrthoLock = 'h';
    return { x: pt.x, z: from.z };
  }
  if (adz > adx && adx <= ZONE_ORTHO_ENTER_MM) {
    _zoneOrthoLock = 'v';
    return { x: from.x, z: pt.z };
  }
  return pt;
}

function isAxisAlignedSeg(x1, z1, x2, z2, eps) {
  const e = eps == null ? 2 : eps;
  return Math.abs(x2 - x1) <= e || Math.abs(z2 - z1) <= e;
}

/** Размеры вдоль стены у точки — линия + засечки + окошко mm (как IKEA). */
function appendZoneWallSplitDims(layer, px, pz) {
  const hit = wallSplitAtExact(px, pz);
  if (!hit) return;
  const a = projectLocalToScreen(hit.x1, 40, hit.z1);
  const b = projectLocalToScreen(hit.x2, 40, hit.z2);
  const p = projectLocalToScreen(hit.x, 40, hit.z);
  if (!a || !b || !p) return;
  const { inx, iny } = wallScreenNormals(a, b, hit);
  const inset = 18;
  if (hit.lenA >= 40) {
    appendIkeaDimChain(layer, a, p, hit.lenA, inx, iny, inset);
  }
  if (hit.lenB >= 40) {
    appendIkeaDimChain(layer, p, b, hit.lenB, inx, iny, inset);
  }
}

function appendDimExtension(layer, from, to) {
  if (!from || !to) return;
  const dx = to.left - from.left;
  const dy = to.top - from.top;
  const lenPx = Math.hypot(dx, dy);
  if (lenPx < 2) return;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const ext = document.createElement('div');
  ext.className = 'cld-kitchen-draw-html-dim-ext';
  ext.style.width = Math.round(lenPx) + 'px';
  ext.style.left = Math.round(from.left) + 'px';
  ext.style.top = Math.round(from.top) + 'px';
  ext.style.transform = 'translate(0, -50%) rotate(' + ang + 'deg)';
  layer.appendChild(ext);
}

/**
 * IKEA-размер: выноски, параллельная линия, диагональные засечки, окошко mm.
 * (nx,ny) — смещение цепочки от измеряемого ребра (внутрь комнаты).
 */
function appendIkeaDimChain(layer, a, b, lenMm, nx, ny, offsetPx) {
  if (!a || !b || !(lenMm >= 40)) return;
  const off = offsetPx == null ? 18 : offsetPx;
  const a2 = { left: a.left + nx * off, top: a.top + ny * off };
  const b2 = { left: b.left + nx * off, top: b.top + ny * off };
  const dx = b2.left - a2.left;
  const dy = b2.top - a2.top;
  const lenPx = Math.hypot(dx, dy);
  if (lenPx < 2) return;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;

  appendDimExtension(layer, a, a2);
  appendDimExtension(layer, b, b2);

  const line = document.createElement('div');
  line.className = 'cld-kitchen-draw-html-dim-line';
  line.style.width = Math.round(lenPx) + 'px';
  line.style.left = Math.round(a2.left) + 'px';
  line.style.top = Math.round(a2.top) + 'px';
  line.style.transform = 'translate(0, -50%) rotate(' + ang + 'deg)';
  layer.appendChild(line);

  const tickAng = ang + 45;
  for (const pt of [a2, b2]) {
    const tick = document.createElement('div');
    tick.className = 'cld-kitchen-draw-html-dim-tick';
    tick.style.left = Math.round(pt.left) + 'px';
    tick.style.top = Math.round(pt.top) + 'px';
    tick.style.transform = 'translate(-50%, -50%) rotate(' + tickAng + 'deg)';
    layer.appendChild(tick);
  }

  const el = document.createElement('div');
  el.className = 'cld-kitchen-draw-html-zone-dim';
  el.textContent = Math.round(lenMm) + ' mm';
  el.style.left = Math.round((a2.left + b2.left) / 2) + 'px';
  el.style.top = Math.round((a2.top + b2.top) / 2) + 'px';
  // вдоль линии; не вверх ногами
  let labelAng = ang;
  if (labelAng > 90 || labelAng < -90) labelAng += labelAng > 0 ? -180 : 180;
  el.style.transform = 'translate(-50%, -50%) rotate(' + labelAng + 'deg)';
  layer.appendChild(el);
}

/** Засечки на концах выбранного разделителя + на стыках (чёрные, поверх голубой). */
function appendSelectedDividerEndTicks(layer, div, allDividers) {
  if (!div) return;
  const pts = [
    { x: div.x1, z: div.z1 },
    { x: div.x2, z: div.z2 },
  ];
  const { ux, uz, breaks } = dividerAlongBreaks(div, allDividers || []);
  for (let i = 1; i < breaks.length - 1; i++) {
    pts.push({ x: div.x1 + ux * breaks[i], z: div.z1 + uz * breaks[i] });
  }
  const a0 = projectLocalToScreen(div.x1, 40, div.z1);
  const b0 = projectLocalToScreen(div.x2, 40, div.z2);
  if (!a0 || !b0) return;
  const ang =
    (Math.atan2(b0.top - a0.top, b0.left - a0.left) * 180) / Math.PI;
  const tickAng = ang + 45;
  for (const w of pts) {
    const s = projectLocalToScreen(w.x, 40, w.z);
    if (!s) continue;
    const tick = document.createElement('div');
    tick.className = 'cld-kitchen-draw-html-dim-tick cld-kitchen-draw-html-dim-tick--on-sel';
    tick.style.left = Math.round(s.left) + 'px';
    tick.style.top = Math.round(s.top) + 'px';
    tick.style.transform = 'translate(-50%, -50%) rotate(' + tickAng + 'deg)';
    layer.appendChild(tick);
  }
}

function collectZoneDividerSegs() {
  const segs = [];
  const zds = Array.isArray(state.kitchenZoneDividers) ? state.kitchenZoneDividers : [];
  for (const w of zds) segs.push(w);
  if (_draft && Array.isArray(_draft.strokes)) {
    for (const s of _draft.strokes) segs.push(s);
  }
  return segs;
}

/** Точка на существующем разделителе зоны (пересечение при тяге). */
function dividerSplitAtExact(px, pz) {
  const segs = collectZoneDividerSegs();
  let best = null;
  for (const s of segs) {
    if (!s) continue;
    const hit = distPointToSeg(px, pz, s.x1, s.z1, s.x2, s.z2);
    if (hit.d > 28) continue;
    if (best && hit.d >= best.d) continue;
    const len = Math.hypot(s.x2 - s.x1, s.z2 - s.z1) || 1;
    best = {
      d: hit.d,
      x: hit.x,
      z: hit.z,
      x1: s.x1,
      z1: s.z1,
      x2: s.x2,
      z2: s.z2,
      lenA: hit.t * len,
      lenB: len - hit.t * len,
    };
  }
  return best;
}

function innerOffsetForDividerSeg(x1, z1, x2, z2, aScr, bScr, px, pz) {
  const dx = bScr.left - aScr.left;
  const dy = bScr.top - aScr.top;
  const lenPx = Math.hypot(dx, dy) || 1;
  let nx = -dy / lenPx;
  let ny = dx / lenPx;
  const c = polyCentroid(footprintVerts() || []);
  const mid = projectLocalToScreen((x1 + x2) / 2, 40, (z1 + z2) / 2);
  const cent = projectLocalToScreen(c.x, 40, c.z);
  if (mid && cent) {
    const toC = { x: cent.left - mid.left, y: cent.top - mid.top };
    if (nx * toC.x + ny * toC.y > 0) {
      nx = -nx;
      ny = -ny;
    }
  }
  return { nx, ny };
}

/** Размеры вдоль разделителя в точке пересечения (засечки как у IKEA). */
function appendZoneDividerSplitDims(layer, px, pz) {
  const hit = dividerSplitAtExact(px, pz);
  if (!hit) return;
  const a = projectLocalToScreen(hit.x1, 40, hit.z1);
  const b = projectLocalToScreen(hit.x2, 40, hit.z2);
  const p = projectLocalToScreen(hit.x, 40, hit.z);
  if (!a || !b || !p) return;
  const { nx, ny } = innerOffsetForDividerSeg(hit.x1, hit.z1, hit.x2, hit.z2, a, b, px, pz);
  const inset = 14;
  if (hit.lenA >= 40) appendIkeaDimChain(layer, a, p, hit.lenA, nx, ny, inset);
  if (hit.lenB >= 40) appendIkeaDimChain(layer, p, b, hit.lenB, nx, ny, inset);
}

/** Размеры: стена или разделитель в точке. */
function appendZoneSplitDimsAtPoint(layer, px, pz) {
  if (wallSplitAtExact(px, pz)) {
    appendZoneWallSplitDims(layer, px, pz);
    return;
  }
  appendZoneDividerSplitDims(layer, px, pz);
}

function pointOnDividerSeg(seg, px, pz, eps) {
  if (!seg) return null;
  const hit = distPointToSeg(px, pz, seg.x1, seg.z1, seg.x2, seg.z2);
  if (hit.d > (eps == null ? 32 : eps)) return null;
  const len = Math.hypot(seg.x2 - seg.x1, seg.z2 - seg.z1) || 1;
  if (hit.t <= 0.02 || hit.t >= 0.98) return null;
  return { x: hit.x, z: hit.z, lenA: hit.t * len, lenB: len - hit.t * len };
}

function draftChainPoints(cursor) {
  const strokes = (_draft && _draft.strokes) || [];
  const pts = [];
  if (strokes.length) {
    pts.push({ x: strokes[0].x1, z: strokes[0].z1 });
    for (const s of strokes) pts.push({ x: s.x2, z: s.z2 });
  } else if (_pendingStart) {
    pts.push({ x: _pendingStart.x, z: _pendingStart.z });
  }
  if (_pendingStart && cursor) {
    if (!pts.length) pts.push({ x: _pendingStart.x, z: _pendingStart.z });
    pts.push({ x: cursor.x, z: cursor.z });
  }
  return pts;
}

function ensurePencilEl() {
  let el = document.getElementById('cld-kitchen-draw-pencil');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cld-kitchen-draw-pencil';
    el.setAttribute('aria-hidden', 'true');
    el.hidden = true;
    document.body.appendChild(el);
  }
  el.className = 'cld-kitchen-draw-pencil';
  if (!el.querySelector('.cld-kitchen-draw-pencil__tip')) {
    el.innerHTML =
      '<div class="cld-kitchen-draw-pencil__body"></div>' +
      '<div class="cld-kitchen-draw-pencil__tip"></div>';
  }
  return el;
}

function showPencilAt(left, top) {
  if (_activeTool !== 'wall' && _activeTool !== 'zone') {
    hidePencil();
    return;
  }
  const el = ensurePencilEl();
  // IKEA зоны: карандаш + жёлтый квадрат на острие
  el.classList.toggle('cld-kitchen-draw-pencil--zone', _activeTool === 'zone');
  el.classList.remove('cld-kitchen-draw-pencil--tip-only');
  el.hidden = false;
  el.style.left = Math.round(left) + 'px';
  el.style.top = Math.round(top) + 'px';
  _pencilScreen = { left, top };
}

function hidePencil() {
  const el = document.getElementById('cld-kitchen-draw-pencil');
  if (el) el.hidden = true;
  _pencilScreen = null;
}

/** Размеры на стене у точки старта (как IKEA во время тяги). */
function appendStartWallSplitDims(layer, px, pz) {
  const hit = wallSplitAtExact(px, pz);
  if (!hit) return;
  appendWallSplitLabelsOnly(layer, hit);
}

function wallSplitAtExact(px, pz) {
  const verts = footprintVerts();
  const segs = footprintSegs();
  if (!verts || verts.length < 2) return null;
  const n = verts.length;
  let best = null;
  for (let i = 0; i < n; i++) {
    const seg = segs && segs[i];
    if (seg && seg.open) continue;
    const a = verts[i];
    const b = verts[(i + 1) % n];
    const hit = distPointToSeg(px, pz, a.x, a.z, b.x, b.z);
    if (hit.d > 24) continue;
    if (best && hit.d >= best.d) continue;
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    best = {
      d: hit.d,
      x: px,
      z: pz,
      x1: a.x,
      z1: a.z,
      x2: b.x,
      z2: b.z,
      lenA: hit.t * len,
      lenB: len - hit.t * len,
      edgeIndex: i,
    };
  }
  return best;
}

function appendWallSplitLabelsOnly(layer, hover) {
  if (!hover) return;
  const a = projectLocalToScreen(hover.x1, 40, hover.z1);
  const b = projectLocalToScreen(hover.x2, 40, hover.z2);
  const p = projectLocalToScreen(hover.x, 40, hover.z);
  if (!a || !b || !p) return;
  const { ang, nx, ny, inx, iny } = wallScreenNormals(a, b, hover);
  const inset = 22;
  if (hover.lenA >= 40) {
    appendWallEdgeDim(
      layer,
      (a.left + p.left) / 2 + inx * inset,
      (a.top + p.top) / 2 + iny * inset,
      hover.lenA
    );
  }
  if (hover.lenB >= 40) {
    appendWallEdgeDim(
      layer,
      (p.left + b.left) / 2 + inx * inset,
      (p.top + b.top) / 2 + iny * inset,
      hover.lenB
    );
  }
  const t = WALL_THICKNESS || 100;
  appendOuterSplitDim(layer, a, b, p, hover.lenA + t, hover.lenB + t, ang, nx, ny);
}

/** Ближайшее ребро footprint → точка на ОСИ стены (центр толщины) + длины. */
function nearestWallHover(px, pz) {
  const verts = footprintVerts();
  const segs = footprintSegs();
  if (!verts || verts.length < 2) return null;
  const n = verts.length;
  const T = WALL_THICKNESS || 100;
  const half = T * 0.5;
  const c = polyCentroid(verts);
  let best = null;
  for (let i = 0; i < n; i++) {
    const seg = segs && segs[i];
    if (seg && seg.open) continue;
    const a = verts[i];
    const b = verts[(i + 1) % n];
    const hit = distPointToSeg(px, pz, a.x, a.z, b.x, b.z);
    // snap-зона: от внутренней грани до наружной (+ запас)
    if (hit.d > WALL_HOVER_SNAP + half) continue;
    if (best && hit.d >= best.d) continue;
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    const tx = (b.x - a.x) / len;
    const tz = (b.z - a.z) / len;
    // наружная нормаль (от комнаты наружу)
    let nx = -tz;
    let nz = tx;
    const midX = (a.x + b.x) * 0.5;
    const midZ = (a.z + b.z) * 0.5;
    if (nx * (c.x - midX) + nz * (c.z - midZ) > 0) {
      nx = -nx;
      nz = -nz;
    }
    // центр толщины стены: внутр. грань + half наружу
    const cx = hit.x + nx * half;
    const cz = hit.z + nz * half;
    const along = hit.t * len;
    best = {
      d: hit.d,
      x: cx,
      z: cz,
      // точка старта перегородки — внутренняя грань
      innerX: hit.x,
      innerZ: hit.z,
      x1: a.x + nx * half,
      z1: a.z + nz * half,
      x2: b.x + nx * half,
      z2: b.z + nz * half,
      innerX1: a.x,
      innerZ1: a.z,
      innerX2: b.x,
      innerZ2: b.z,
      lenA: along,
      lenB: len - along,
      edgeIndex: i,
      nx,
      nz,
    };
  }
  return best;
}

/**
 * Точка замыкания цепочки на существующую стену (периметр / перегородка).
 * Как IKEA: довёл до стены → snap на внутреннюю грань → ЛКМ заканчивает цепочку.
 */
function wallCloseTarget(px, pz, fromStart) {
  if (!fromStart) return null;
  const T = WALL_THICKNESS || 100;
  const closeSnap = T + 140;
  let best = null;

  const startHit = nearestWallHover(fromStart.x, fromStart.z);
  const foot = nearestWallHover(px, pz);
  if (foot && foot.d <= closeSnap) {
    const ix = foot.innerX != null ? foot.innerX : foot.x;
    const iz = foot.innerZ != null ? foot.innerZ : foot.z;
    const d0 = Math.hypot(ix - fromStart.x, iz - fromStart.z);
    const sameEdge = startHit && startHit.edgeIndex === foot.edgeIndex;
    if (d0 >= MIN_LEN_MM && !(sameEdge && d0 < 450)) {
      best = {
        x: ix,
        z: iz,
        d: foot.d,
        hover: foot,
        closing: true,
      };
    }
  }

  // только замкнутые / сохранённые — не активная цепочка
  const segs = [];
  const iws = Array.isArray(state.kitchenInteriorWalls) ? state.kitchenInteriorWalls : [];
  for (const w of iws) segs.push(w);
  for (const ch of (_draft && _draft.closedChains) || []) {
    if (Array.isArray(ch)) for (const s of ch) segs.push(s);
  }
  // зоны: прилипание к уже нарисованным разделителям
  if (_activeTool === 'zone') {
    const zds = Array.isArray(state.kitchenZoneDividers) ? state.kitchenZoneDividers : [];
    for (const w of zds) segs.push(w);
    for (const s of (_draft && _draft.strokes) || []) segs.push(s);
  }
  for (const s of segs) {
    if (!s) continue;
    const hit = distPointToSeg(px, pz, s.x1, s.z1, s.x2, s.z2);
    if (hit.d > closeSnap) continue;
    const d0 = Math.hypot(hit.x - fromStart.x, hit.z - fromStart.z);
    if (d0 < MIN_LEN_MM) continue;
    if (best && hit.d >= best.d) continue;
    best = {
      x: hit.x,
      z: hit.z,
      d: hit.d,
      hover: null,
      closing: true,
      seg: s,
    };
  }
  return best;
}

/** Экранная нормаль стены: наружу / внутрь комнаты. */
function wallScreenNormals(a, b, hover) {
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const lenPx = Math.hypot(dx, dy) || 1;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  let nx = -dy / lenPx;
  let ny = dx / lenPx;
  const c = polyCentroid(footprintVerts() || []);
  const mid = projectLocalToScreen((hover.x1 + hover.x2) / 2, 40, (hover.z1 + hover.z2) / 2);
  const cent = projectLocalToScreen(c.x, 40, c.z);
  if (mid && cent) {
    const toC = { x: cent.left - mid.left, y: cent.top - mid.top };
    // если нормаль смотрит внутрь — разворачиваем (nx,ny = наружу)
    if (nx * toC.x + ny * toC.y > 0) {
      nx = -nx;
      ny = -ny;
    }
  }
  return { ang, nx, ny, inx: -nx, iny: -ny, lenPx };
}

/** Направляющая на весь холст через точку на стене (как IKEA). */
function appendFullCanvasGuide(layer, p, angDeg) {
  const rad = (angDeg * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const x0 = p.left - ux * GUIDE_EXT_PX;
  const y0 = p.top - uy * GUIDE_EXT_PX;
  const guide = document.createElement('div');
  guide.className = 'cld-kitchen-draw-html-guide';
  guide.style.width = Math.round(GUIDE_EXT_PX * 2) + 'px';
  guide.style.left = Math.round(x0) + 'px';
  guide.style.top = Math.round(y0) + 'px';
  guide.style.transform = 'translate(0, -50%) rotate(' + angDeg + 'deg)';
  layer.appendChild(guide);
}

/** Отрезок направляющей a→b (экран). */
function appendGuideSegment(layer, a, b) {
  if (!a || !b) return;
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const guide = document.createElement('div');
  guide.className = 'cld-kitchen-draw-html-guide cld-kitchen-draw-html-guide--seg';
  guide.style.width = Math.round(len) + 'px';
  guide.style.left = Math.round(a.left) + 'px';
  guide.style.top = Math.round(a.top) + 'px';
  guide.style.transform = 'translate(0, -50%) rotate(' + ang + 'deg)';
  layer.appendChild(guide);
}

/** Луч от tip в направлении (ux,uz) до контура комнаты. */
function rayHitFootprint(ox, oz, ux, uz) {
  const verts = footprintVerts();
  if (!verts || verts.length < 3) return null;
  const far = 1e6;
  const a = { x: ox, z: oz };
  const b = { x: ox + ux * far, z: oz + uz * far };
  let best = null;
  for (let i = 0; i < verts.length; i++) {
    const c = verts[i];
    const d = verts[(i + 1) % verts.length];
    const hit = segmentIntersect(a, b, c, d);
    if (!hit || hit.t < 1e-4) continue;
    if (!best || hit.t < best.t) best = hit;
  }
  return best ? { x: best.x, z: best.z } : null;
}

/**
 * IKEA зоны: гайды от кончика —
 * перпендикуляр через tip; вдоль линии только ВПЕРЁД (не поверх сплошной, не «вторая» линия без засечек).
 */
function appendZoneTipGuides(layer, start, tip) {
  const tipScr = projectLocalToScreen(tip.x, 40, tip.z);
  if (!tipScr) return;

  const dx = tip.x - start.x;
  const dz = tip.z - start.z;
  const len = Math.hypot(dx, dz);
  if (len < 1) return;

  let alongX = dx / len;
  let alongZ = dz / len;
  if (Math.abs(alongX) >= Math.abs(alongZ)) {
    alongX = alongX >= 0 ? 1 : -1;
    alongZ = 0;
  } else {
    alongX = 0;
    alongZ = alongZ >= 0 ? 1 : -1;
  }
  const perpX = -alongZ;
  const perpZ = alongX;

  // перпендикуляр в обе стороны (крест)
  for (const sign of [-1, 1]) {
    const hit = rayHitFootprint(tip.x, tip.z, perpX * sign, perpZ * sign);
    if (!hit) continue;
    const s = projectLocalToScreen(hit.x, 40, hit.z);
    if (s) appendGuideSegment(layer, tipScr, s);
  }

  // вдоль — только вперёд от tip (не назад по уже нарисованной линии)
  const fwd = rayHitFootprint(tip.x, tip.z, alongX, alongZ);
  if (fwd) {
    const s = projectLocalToScreen(fwd.x, 40, fwd.z);
    if (s) appendGuideSegment(layer, tipScr, s);
  }
}

/** Стык с разделителем: конец на линии, старт дотянуть до стены (T, не сквозь всю комнату). */
function clipZoneStrokeToDivider(stroke, divHit) {
  const x2 = divHit.x;
  const z2 = divHit.z;
  const dx = stroke.x1 - x2;
  const dz = stroke.z1 - z2;
  const len = Math.hypot(dx, dz) || 1;
  const hit = rayHitFootprint(x2, z2, dx / len, dz / len);
  if (hit) return { x1: hit.x, z1: hit.z, x2, z2 };
  return { x1: stroke.x1, z1: stroke.z1, x2, z2 };
}

/**
 * IKEA hover на стене:
 * — оранжевая направляющая на весь холст вдоль стены
 * — квадрат-карандаш на точке
 * — белые mm внутри комнаты (до углов по внутренней грани)
 * — внешняя размерная цепочка снаружи (внутр. + толщина стены с каждого конца)
 */
function appendWallHoverGuide(layer, hover) {
  if (!hover) return;
  const T = WALL_THICKNESS || 100;
  // экранный центр толщины (середина между внутренней и наружной гранью)
  const innerPt = {
    x: hover.innerX != null ? hover.innerX : hover.x,
    z: hover.innerZ != null ? hover.innerZ : hover.z,
  };
  const outerPt = {
    x: innerPt.x + (hover.nx || 0) * T,
    z: innerPt.z + (hover.nz || 0) * T,
  };
  const ia0 = projectLocalToScreen(
    hover.innerX1 != null ? hover.innerX1 : hover.x1,
    40,
    hover.innerZ1 != null ? hover.innerZ1 : hover.z1
  );
  const ib0 = projectLocalToScreen(
    hover.innerX2 != null ? hover.innerX2 : hover.x2,
    40,
    hover.innerZ2 != null ? hover.innerZ2 : hover.z2
  );
  const oa0 = projectLocalToScreen(
    (hover.innerX1 != null ? hover.innerX1 : hover.x1) + (hover.nx || 0) * T,
    40,
    (hover.innerZ1 != null ? hover.innerZ1 : hover.z1) + (hover.nz || 0) * T
  );
  const ob0 = projectLocalToScreen(
    (hover.innerX2 != null ? hover.innerX2 : hover.x2) + (hover.nx || 0) * T,
    40,
    (hover.innerZ2 != null ? hover.innerZ2 : hover.z2) + (hover.nz || 0) * T
  );
  const ip = projectLocalToScreen(innerPt.x, 40, innerPt.z);
  const op = projectLocalToScreen(outerPt.x, 40, outerPt.z);
  if (!ip || !op) return;

  // направляющая и карандаш — визуальный центр серой полосы
  // (чуть ближе к наружной грани: в топ-вью короб визуально толще кнаружи)
  const tVis = 0.58;
  const p = {
    left: ip.left * (1 - tVis) + op.left * tVis,
    top: ip.top * (1 - tVis) + op.top * tVis,
  };
  const a =
    ia0 && oa0
      ? {
          left: ia0.left * (1 - tVis) + oa0.left * tVis,
          top: ia0.top * (1 - tVis) + oa0.top * tVis,
        }
      : projectLocalToScreen(hover.x1, 40, hover.z1);
  const b =
    ib0 && ob0
      ? {
          left: ib0.left * (1 - tVis) + ob0.left * tVis,
          top: ib0.top * (1 - tVis) + ob0.top * tVis,
        }
      : projectLocalToScreen(hover.x2, 40, hover.z2);
  if (!a || !b) return;

  const { ang, nx, ny, inx, iny } = wallScreenNormals(a, b, hover);
  appendFullCanvasGuide(layer, p, ang);
  // без handle — карандаш один

  const inset = 22;
  if (ia0 && ip && hover.lenA >= 40) {
    appendWallEdgeDim(
      layer,
      (ia0.left + ip.left) / 2 + inx * inset,
      (ia0.top + ip.top) / 2 + iny * inset,
      hover.lenA
    );
  }
  if (ip && ib0 && hover.lenB >= 40) {
    appendWallEdgeDim(
      layer,
      (ip.left + ib0.left) / 2 + inx * inset,
      (ip.top + ib0.top) / 2 + iny * inset,
      hover.lenB
    );
  }

  appendOuterSplitDim(layer, a, b, p, hover.lenA + T, hover.lenB + T, ang, nx, ny);

  // вернуть экранную точку карандаша
  hover._screen = p;
}

function appendWallEdgeDim(layer, left, top, lenMm) {
  const el = document.createElement('div');
  el.className = 'cld-kitchen-draw-html-edge-dim';
  el.textContent = Math.round(lenMm) + ' mm';
  el.style.left = Math.round(left) + 'px';
  el.style.top = Math.round(top) + 'px';
  layer.appendChild(el);
}

function appendOuterSplitDim(layer, a, b, p, lenA, lenB, angDeg, nx, ny) {
  const off = 36;
  const a2 = { left: a.left + nx * off, top: a.top + ny * off };
  const b2 = { left: b.left + nx * off, top: b.top + ny * off };
  const p2 = { left: p.left + nx * off, top: p.top + ny * off };

  const line = document.createElement('div');
  line.className = 'cld-kitchen-draw-html-outer-dim';
  const w = Math.hypot(b2.left - a2.left, b2.top - a2.top);
  line.style.width = Math.round(w) + 'px';
  line.style.left = Math.round(a2.left) + 'px';
  line.style.top = Math.round(a2.top) + 'px';
  line.style.transform = 'translate(0, -50%) rotate(' + angDeg + 'deg)';
  layer.appendChild(line);

  for (const pt of [a2, p2, b2]) {
    const tick = document.createElement('div');
    tick.className = 'cld-kitchen-draw-html-outer-tick';
    tick.style.left = Math.round(pt.left) + 'px';
    tick.style.top = Math.round(pt.top) + 'px';
    tick.style.transform = 'translate(-50%, -50%) rotate(' + angDeg + 'deg)';
    layer.appendChild(tick);
  }

  if (lenA >= 40) {
    appendOuterDimLabel(layer, (a2.left + p2.left) / 2, (a2.top + p2.top) / 2, lenA, nx, ny);
  }
  if (lenB >= 40) {
    appendOuterDimLabel(layer, (p2.left + b2.left) / 2, (p2.top + b2.top) / 2, lenB, nx, ny);
  }
}

function appendOuterDimLabel(layer, left, top, lenMm, nx, ny) {
  const el = document.createElement('div');
  el.className = 'cld-kitchen-draw-html-outer-label';
  el.textContent = Math.round(lenMm) + ' mm';
  el.style.left = Math.round(left + nx * 16) + 'px';
  el.style.top = Math.round(top + ny * 16) + 'px';
  layer.appendChild(el);
}

function collectZoneSplitters(extra) {
  const list = [];
  const iws = Array.isArray(state.kitchenInteriorWalls) ? state.kitchenInteriorWalls : [];
  for (const w of iws) list.push({ x1: w.x1, z1: w.z1, x2: w.x2, z2: w.z2 });
  const zds = Array.isArray(state.kitchenZoneDividers) ? state.kitchenZoneDividers : [];
  for (const w of zds) list.push({ x1: w.x1, z1: w.z1, x2: w.x2, z2: w.z2 });
  if (Array.isArray(extra)) {
    for (const w of extra) list.push({ x1: w.x1, z1: w.z1, x2: w.x2, z2: w.z2 });
  }
  return list;
}

function appendWallModeZones(layer, draftStrokes) {
  const zones = computeZones(collectZoneSplitters(draftStrokes));
  for (const z of zones) appendHtmlZoneLabel(layer, z);
}

/** Тонкий разделитель зоны (IKEA: тёмная линия, не толстая стена). */
function appendHtmlZoneDivider(layer, x1, z1, x2, z2, live, splitPt, selected, opts) {
  const a = projectLocalToScreen(x1, 40, z1);
  const b = projectLocalToScreen(x2, 40, z2);
  if (!a || !b) return;
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const line = document.createElement('div');
  let cls = 'cld-kitchen-draw-html-zone';
  if (live) cls += ' cld-kitchen-draw-html-zone--live';
  if (selected) cls += ' cld-kitchen-draw-html-zone--selected';
  line.className = cls;
  line.style.width = Math.round(len) + 'px';
  line.style.left = Math.round(a.left) + 'px';
  line.style.top = Math.round(a.top) + 'px';
  line.style.transform = 'translate(0, -50%) rotate(' + ang + 'deg)';
  layer.appendChild(line);

  // после OK / selected: размеры отдельно (IKEA — не цельный mm на чёрной)
  if (selected || (opts && opts.noDims)) return;

  const worldLen = Math.hypot(x2 - x1, z2 - z1);
  if (worldLen < 80) return;

  if (splitPt) {
    const sp = projectLocalToScreen(splitPt.x, 40, splitPt.z);
    if (sp) {
      const lenA = Math.hypot(splitPt.x - x1, splitPt.z - z1);
      const lenB = Math.hypot(x2 - splitPt.x, z2 - splitPt.z);
      if (lenA >= 80) appendZoneSegDimChain(layer, a, sp, lenA);
      if (lenB >= 80) appendZoneSegDimChain(layer, sp, b, lenB);
      return;
    }
  }
  appendZoneSegDimChain(layer, a, b, worldLen);
}

/** Размеры вдоль чужого разделителя, разрезанного выбранным (засечки на стыке). */
function appendCrossedDividerDims(layer, other, selected) {
  if (!other || !selected) return;
  const hit = segmentIntersect(
    { x: other.x1, z: other.z1 },
    { x: other.x2, z: other.z2 },
    { x: selected.x1, z: selected.z1 },
    { x: selected.x2, z: selected.z2 }
  );
  if (!hit) {
    // T: конец selected лежит на other
    const d1 = distPointToSeg(selected.x1, selected.z1, other.x1, other.z1, other.x2, other.z2);
    const d2 = distPointToSeg(selected.x2, selected.z2, other.x1, other.z1, other.x2, other.z2);
    const end =
      d1.d <= 28 ? { x: d1.x, z: d1.z } : d2.d <= 28 ? { x: d2.x, z: d2.z } : null;
    if (!end) return;
    const a = projectLocalToScreen(other.x1, 40, other.z1);
    const b = projectLocalToScreen(other.x2, 40, other.z2);
    const p = projectLocalToScreen(end.x, 40, end.z);
    if (!a || !b || !p) return;
    const { nx, ny } = innerOffsetForDividerSeg(
      other.x1,
      other.z1,
      other.x2,
      other.z2,
      a,
      b,
      end.x,
      end.z
    );
    const lenA = Math.hypot(end.x - other.x1, end.z - other.z1);
    const lenB = Math.hypot(other.x2 - end.x, other.z2 - end.z);
    if (lenA >= 80) appendIkeaDimChain(layer, a, p, lenA, nx, ny, 14);
    if (lenB >= 80) appendIkeaDimChain(layer, p, b, lenB, nx, ny, 14);
    return;
  }
  const a = projectLocalToScreen(other.x1, 40, other.z1);
  const b = projectLocalToScreen(other.x2, 40, other.z2);
  const p = projectLocalToScreen(hit.x, 40, hit.z);
  if (!a || !b || !p) return;
  const { nx, ny } = innerOffsetForDividerSeg(
    other.x1,
    other.z1,
    other.x2,
    other.z2,
    a,
    b,
    hit.x,
    hit.z
  );
  const lenA = Math.hypot(hit.x - other.x1, hit.z - other.z1);
  const lenB = Math.hypot(other.x2 - hit.x, other.z2 - hit.z);
  if (lenA >= 80) appendIkeaDimChain(layer, a, p, lenA, nx, ny, 14);
  if (lenB >= 80) appendIkeaDimChain(layer, p, b, lenB, nx, ny, 14);
}

/** Точки разбиения вдоль разделителя: концы + пересечения с другими. */
function dividerAlongBreaks(div, others) {
  const dx = div.x2 - div.x1;
  const dz = div.z2 - div.z1;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  const breaks = [0, len];
  for (const o of others) {
    if (!o || o === div) continue;
    if (o.id && div.id && o.id === div.id) continue;
    const hit = segmentIntersect(
      { x: div.x1, z: div.z1 },
      { x: div.x2, z: div.z2 },
      { x: o.x1, z: o.z1 },
      { x: o.x2, z: o.z2 }
    );
    if (!hit) continue;
    const t = (hit.x - div.x1) * ux + (hit.z - div.z1) * uz;
    if (t > 40 && t < len - 40) breaks.push(t);
  }
  breaks.sort((a, b) => a - b);
  const uniq = [];
  for (const t of breaks) {
    if (!uniq.length || Math.abs(t - uniq[uniq.length - 1]) > 20) uniq.push(t);
  }
  return { ux, uz, len, breaks: uniq };
}

/**
 * Размеры плана зон: по каждому уникальному ребру (стена/разделитель),
 * один раз, выноски до линии с засечками. Без голубого и без дублей по зонам.
 */
function appendPlanZoneBoundaryDims(layer, dividers) {
  const list = Array.isArray(dividers) ? dividers : [];
  const roomC = polyCentroid(footprintVerts() || []);
  const roomScr = projectLocalToScreen(roomC.x, 40, roomC.z);
  if (!roomScr) return;
  const seen = {};

  function segKey(x1, z1, x2, z2) {
    const ax = Math.round(Math.min(x1, x2));
    const az = Math.round(Math.min(z1, z2));
    const bx = Math.round(Math.max(x1, x2));
    const bz = Math.round(Math.max(z1, z2));
    return ax + ',' + az + '|' + bx + ',' + bz;
  }

  function addSeg(x1, z1, x2, z2) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len < 80) return;
    const k = segKey(x1, z1, x2, z2);
    if (seen[k]) return;
    seen[k] = true;
    const a = projectLocalToScreen(x1, 40, z1);
    const b = projectLocalToScreen(x2, 40, z2);
    if (!a || !b) return;
    const dx = b.left - a.left;
    const dy = b.top - a.top;
    const lenPx = Math.hypot(dx, dy) || 1;
    let nx = -dy / lenPx;
    let ny = dx / lenPx;
    const mid = { left: (a.left + b.left) / 2, top: (a.top + b.top) / 2 };
    // внутрь комнаты
    if (nx * (roomScr.left - mid.left) + ny * (roomScr.top - mid.top) < 0) {
      nx = -nx;
      ny = -ny;
    }
    appendIkeaDimChain(layer, a, b, len, nx, ny, 14);
  }

  for (const d of list) {
    if (!d) continue;
    const { ux, uz, breaks } = dividerAlongBreaks(d, list);
    for (let i = 0; i < breaks.length - 1; i++) {
      addSeg(
        d.x1 + ux * breaks[i],
        d.z1 + uz * breaks[i],
        d.x1 + ux * breaks[i + 1],
        d.z1 + uz * breaks[i + 1]
      );
    }
  }

  const verts = footprintVerts();
  if (!verts || verts.length < 2) return;
  const n = verts.length;
  const fSegs = footprintSegs();
  for (let i = 0; i < n; i++) {
    if (fSegs && fSegs[i] && fSegs[i].open) continue;
    const A = verts[i];
    const B = verts[(i + 1) % n];
    const len = Math.hypot(B.x - A.x, B.z - A.z) || 1;
    const ux = (B.x - A.x) / len;
    const uz = (B.z - A.z) / len;
    const ts = [0, len];
    for (const d of list) {
      if (!d) continue;
      for (const pt of [
        { x: d.x1, z: d.z1 },
        { x: d.x2, z: d.z2 },
      ]) {
        const hit = distPointToSeg(pt.x, pt.z, A.x, A.z, B.x, B.z);
        if (hit.d > 28) continue;
        const t = hit.t * len;
        if (t > 30 && t < len - 30) ts.push(t);
      }
      const cross = segmentIntersect(
        { x: A.x, z: A.z },
        { x: B.x, z: B.z },
        { x: d.x1, z: d.z1 },
        { x: d.x2, z: d.z2 }
      );
      if (cross) {
        const t = (cross.x - A.x) * ux + (cross.z - A.z) * uz;
        if (t > 30 && t < len - 30) ts.push(t);
      }
    }
    ts.sort((u, v) => u - v);
    const uniq = [];
    for (const t of ts) {
      if (!uniq.length || Math.abs(t - uniq[uniq.length - 1]) > 20) uniq.push(t);
    }
    for (let j = 0; j < uniq.length - 1; j++) {
      addSeg(
        A.x + ux * uniq[j],
        A.z + uz * uniq[j],
        A.x + ux * uniq[j + 1],
        A.z + uz * uniq[j + 1]
      );
    }
  }
}

/** Размер вдоль тянущейся линии: параллель + засечки + окошко. */
function appendZoneSegDimChain(layer, a, b, lenMm) {
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const lenPx = Math.hypot(dx, dy) || 1;
  let nx = -dy / lenPx;
  let ny = dx / lenPx;
  // смещение «вниз» относительно комнаты (внутрь от линии к центроиду)
  const c = polyCentroid(footprintVerts() || []);
  const mid = { left: (a.left + b.left) / 2, top: (a.top + b.top) / 2 };
  const cent = projectLocalToScreen(c.x, 40, c.z);
  if (cent) {
    const toC = { x: cent.left - mid.left, y: cent.top - mid.top };
    // размерная линия чуть в сторону от центроида, как у IKEA под линией
    if (nx * toC.x + ny * toC.y > 0) {
      nx = -nx;
      ny = -ny;
    }
  }
  appendIkeaDimChain(layer, a, b, lenMm, nx, ny, 14);
}

function appendZoneSegDim(layer, a, b, lenMm) {
  appendZoneSegDimChain(layer, a, b, lenMm);
}

function appendHtmlZoneLabel(layer, zone) {
  const scr = projectLocalToScreen(zone.cx, 40, zone.cz);
  if (!scr) return;
  const el = document.createElement('div');
  el.className = 'cld-kitchen-draw-html-zone-label';
  el.style.left = Math.round(scr.left) + 'px';
  el.style.top = Math.round(scr.top) + 'px';
  el.innerHTML =
    '<div class="cld-kitchen-draw-html-zone-label__name">' +
    zone.name +
    '</div>' +
    '<div class="cld-kitchen-draw-html-zone-label__area">' +
    zone.areaM2.toFixed(1).replace('.', ',') +
    ' m²</div>';
  layer.appendChild(el);
}

function polyAreaMm2(verts) {
  if (!verts || verts.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < verts.length; i++) {
    const j = (i + 1) % verts.length;
    a += verts[i].x * verts[j].z - verts[j].x * verts[i].z;
  }
  return Math.abs(a) * 0.5;
}

function polyCentroid(verts) {
  let x = 0;
  let z = 0;
  const n = verts.length || 1;
  for (const v of verts) {
    x += v.x;
    z += v.z;
  }
  return { x: x / n, z: z / n };
}

function segmentIntersect(a, b, c, d) {
  const rxf = (b.x - a.x) * (d.z - c.z) - (b.z - a.z) * (d.x - c.x);
  if (Math.abs(rxf) < 1e-9) return null;
  const t = ((c.x - a.x) * (d.z - c.z) - (c.z - a.z) * (d.x - c.x)) / rxf;
  const u = ((c.x - a.x) * (b.z - a.z) - (c.z - a.z) * (b.x - a.x)) / rxf;
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
  return { x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z), t };
}

/** Продлить отрезок до пересечений с контуром (стена–стена, как IKEA). */
function extendDividerToBoundary(x1, z1, x2, z2) {
  const verts = footprintVerts();
  if (!verts || verts.length < 3) return { x1, z1, x2, z2 };
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  // Луч далеко в обе стороны
  const far = 1e6;
  const a = { x: x1 - ux * far, z: z1 - uz * far };
  const b = { x: x1 + ux * far, z: z1 + uz * far };
  const hits = [];
  for (let i = 0; i < verts.length; i++) {
    const c = verts[i];
    const d = verts[(i + 1) % verts.length];
    const hit = segmentIntersect(a, b, c, d);
    if (!hit) continue;
    // параметр вдоль направления от середины
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const along = (hit.x - midX) * ux + (hit.z - midZ) * uz;
    hits.push({ x: hit.x, z: hit.z, along });
  }
  if (hits.length < 2) {
    // fallback: snap концов к ближайшему ребру
    const s1 = snapPoint({ x: x1, z: z1 }, {});
    const s2 = snapPoint({ x: x2, z: z2 }, {});
    return { x1: s1.x, z1: s1.z, x2: s2.x, z2: s2.z };
  }
  hits.sort((p, q) => p.along - q.along);
  // Берём пару пересечений, между которыми лежит исходный отрезок
  let best = null;
  for (let i = 0; i < hits.length - 1; i++) {
    const p = hits[i];
    const q = hits[i + 1];
    if (p.along <= 0 && q.along >= 0) {
      best = { x1: p.x, z1: p.z, x2: q.x, z2: q.z };
      break;
    }
  }
  if (!best) {
    // ближайшая пара по длине, содержащая проекцию центра
    best = {
      x1: hits[0].x,
      z1: hits[0].z,
      x2: hits[hits.length - 1].x,
      z2: hits[hits.length - 1].z,
    };
  }
  return best;
}

function pointOnPolyEdge(poly, px, pz, eps) {
  const n = poly.length;
  let best = null;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const hit = distPointToSeg(px, pz, a.x, a.z, b.x, b.z);
    if (hit.d <= eps && (!best || hit.d < best.d)) {
      best = { edge: i, t: hit.t, x: hit.x, z: hit.z, d: hit.d };
    }
  }
  return best;
}

/** Вставить точку на ребро; вернуть индекс в новом кольце. */
function insertOnEdge(poly, hit) {
  const out = poly.map((v) => ({ x: v.x, z: v.z }));
  const nearA = Math.hypot(hit.x - out[hit.edge].x, hit.z - out[hit.edge].z) < 1;
  const next = (hit.edge + 1) % out.length;
  const nearB = Math.hypot(hit.x - out[next].x, hit.z - out[next].z) < 1;
  if (nearA) return { poly: out, index: hit.edge };
  if (nearB) return { poly: out, index: next };
  out.splice(hit.edge + 1, 0, { x: hit.x, z: hit.z });
  return { poly: out, index: hit.edge + 1 };
}

function trySplitPoly(poly, seg, eps) {
  const ha = pointOnPolyEdge(poly, seg.x1, seg.z1, eps);
  const hb = pointOnPolyEdge(poly, seg.x2, seg.z2, eps);
  if (!ha || !hb) return null;

  // Собрать кольцо с вставленными точками A и B
  const n0 = poly.length;
  const inserts = [
    { edge: ha.edge, t: ha.t, x: ha.x, z: ha.z, tag: 'a' },
    { edge: hb.edge, t: hb.t, x: hb.x, z: hb.z, tag: 'b' },
  ].sort((u, v) => (u.edge === v.edge ? v.t - u.t : v.edge - u.edge));

  const cur = poly.map((v) => ({ x: v.x, z: v.z }));
  for (const ins of inserts) {
    const a = cur[ins.edge];
    const b = cur[(ins.edge + 1) % cur.length];
    if (Math.hypot(ins.x - a.x, ins.z - a.z) < 1) continue;
    if (Math.hypot(ins.x - b.x, ins.z - b.z) < 1) continue;
    cur.splice(ins.edge + 1, 0, { x: ins.x, z: ins.z });
  }

  const ia = cur.findIndex((v) => Math.hypot(v.x - seg.x1, v.z - seg.z1) < eps + 1);
  const ib = cur.findIndex((v) => Math.hypot(v.x - seg.x2, v.z - seg.z2) < eps + 1);
  if (ia < 0 || ib < 0 || ia === ib) return null;

  const n = cur.length;
  const walk = (from, to) => {
    const path = [{ x: cur[from].x, z: cur[from].z }];
    let i = from;
    for (let step = 0; step < n + 2; step++) {
      i = (i + 1) % n;
      path.push({ x: cur[i].x, z: cur[i].z });
      if (i === to) break;
    }
    return path;
  };
  const p1 = walk(ia, ib);
  const p2 = walk(ib, ia);
  if (p1.length < 3 || p2.length < 3) return null;
  if (polyAreaMm2(p1) < 1e4 || polyAreaMm2(p2) < 1e4) return null;
  return [p1, p2];
}

function computeZones(dividers) {
  const base = footprintVerts();
  if (!base || base.length < 3) return [];
  let regions = [base.map((v) => ({ x: v.x, z: v.z }))];
  const list = Array.isArray(dividers) ? dividers : [];
  const eps = SNAP_MM + 20;
  for (const d of list) {
    const next = [];
    let used = false;
    for (const poly of regions) {
      const parts = trySplitPoly(poly, d, eps);
      if (parts) {
        next.push(parts[0], parts[1]);
        used = true;
      } else {
        next.push(poly);
      }
    }
    if (used) regions = next;
  }
  return regions
    .map((verts, i) => {
      const areaMm2 = polyAreaMm2(verts);
      const c = polyCentroid(verts);
      return {
        id: 'zone_' + (i + 1),
        name: 'Зона ' + (i + 1),
        areaM2: areaMm2 / 1e6,
        cx: c.x,
        cz: c.z,
        verts,
      };
    })
    .filter((z) => z.areaM2 > 0.05)
    .sort((a, b) => b.areaM2 - a.areaM2)
    .map((z, i) => ({ ...z, name: 'Зона ' + (i + 1), id: 'zone_' + (i + 1) }));
}

function ensureCommittedZonesLayer() {
  let el = document.getElementById('cld-kitchen-zones-layer');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'cld-kitchen-zones-layer';
  el.className = 'cld-kitchen-zones-layer';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  return el;
}

/** Показать сохранённые зоны на плане (вне режима рисования). */
export function refreshKitchenZonesLayer() {
  const layer = ensureCommittedZonesLayer();
  layer.replaceChildren();
  if (_activeTool === 'zone') {
    layer.hidden = true;
    return;
  }
  const dividers = Array.isArray(state.kitchenZoneDividers) ? state.kitchenZoneDividers : [];
  if (!dividers.length || !window.__cldKitchenShapePlan) {
    layer.hidden = true;
    document.body.classList.remove('cld-kitchen-zones-active');
    unbindZoneSelect();
    return;
  }
  layer.hidden = false;
  document.body.classList.add('cld-kitchen-zones-active');
  // без голубого автовыделения — все разделители тёмные
  _selectedZoneDividerId = null;
  for (const d of dividers) {
    appendHtmlZoneDivider(layer, d.x1, d.z1, d.x2, d.z2, false, null, false, {
      noDims: true,
    });
  }

  const zones = Array.isArray(state.kitchenZones) ? state.kitchenZones : computeZones(dividers);
  state.kitchenZones = zones;
  appendPlanZoneBoundaryDims(layer, dividers);
  for (const z of zones) appendHtmlZoneLabel(layer, z);
  unbindZoneSelect();
}

function bindZoneSelect() {
  if (_zoneSelectBound) return;
  _zoneSelectBound = true;
  document.addEventListener('pointerdown', onZoneSelectPointerDown, true);
}

function unbindZoneSelect() {
  if (!_zoneSelectBound) return;
  _zoneSelectBound = false;
  document.removeEventListener('pointerdown', onZoneSelectPointerDown, true);
}

function onZoneSelectPointerDown(e) {
  if (_activeTool) return;
  if (!window.__cldKitchenShapePlan) return;
  if (e.button !== 0) return;
  if (isUiChromeTarget(e.target)) return;
  const dividers = Array.isArray(state.kitchenZoneDividers) ? state.kitchenZoneDividers : [];
  if (!dividers.length) return;
  const raw = pickFloorXZ(e.clientX, e.clientY);
  if (!raw) return;
  let best = null;
  for (const d of dividers) {
    const hit = distPointToSeg(raw.x, raw.z, d.x1, d.z1, d.x2, d.z2);
    if (hit.d > 80) continue;
    if (best && hit.d >= best.d) continue;
    best = { d: hit.d, id: d.id };
  }
  if (!best || !best.id) return;
  e.preventDefault();
  e.stopPropagation();
  _selectedZoneDividerId = best.id;
  refreshKitchenZonesLayer();
}

function redrawPreview(cursor) {
  clearPreviewGroup();
  if (!isDrawTool(_activeTool)) {
    hideDimLabel();
    return;
  }
  const layer = ensureHtmlPreviewLayer();
  layer.replaceChildren();
  const strokes = (_draft && _draft.strokes) || [];

  if (_activeTool === 'wall') {
    const allStrokes = allDraftWallStrokes();
    appendWallModeZones(layer, allStrokes);
    // сохранённые стены
    const committed = Array.isArray(state.kitchenInteriorWalls) ? state.kitchenInteriorWalls : [];
    for (const w of committed) {
      appendContinuousWallChain(
        layer,
        [
          { x: w.x1, z: w.z1 },
          { x: w.x2, z: w.z2 },
        ],
        false
      );
    }
    // замкнутые цепочки — серые (как IKEA после стыка)
    for (const ch of (_draft && _draft.closedChains) || []) {
      if (!Array.isArray(ch) || ch.length < 1) continue;
      const pts = [{ x: ch[0].x1, z: ch[0].z1 }];
      for (const s of ch) pts.push({ x: s.x2, z: s.z2 });
      if (pts.length >= 2) appendContinuousWallChain(layer, pts, false);
    }
    // активная цепочка — голубая, пока тянем
    const chain = draftChainPoints(cursor);
    if (chain.length >= 2) {
      appendContinuousWallChain(layer, chain, !!(_pendingStart && cursor));
    }
    if (_pendingStart && cursor) {
      appendStartWallSplitDims(layer, _pendingStart.x, _pendingStart.z);
      if (cursor.closing) {
        // как IKEA: направляющая по стене + один квадрат в точке стыка
        if (cursor.hover) {
          appendWallHoverGuide(layer, cursor.hover);
          const p = projectLocalToScreen(cursor.x, 40, cursor.z);
          if (p) showPencilAt(p.left, p.top);
        } else {
          appendAlignGuides(layer, cursor, collectAlignAnchors());
          const end = projectLocalToScreen(cursor.x, 40, cursor.z);
          if (end) showPencilAt(end.left, end.top);
        }
        hideDimLabel();
      } else {
        appendAlignGuides(layer, cursor, collectAlignAnchors());
        hideDimLabel();
        const end = projectLocalToScreen(cursor.x, 40, cursor.z);
        // только карандаш (квадрат на конце) — без второго handle
        if (end) showPencilAt(end.left, end.top);
      }
    } else if (_pendingStart) {
      const a = projectLocalToScreen(_pendingStart.x, 40, _pendingStart.z);
      if (a) showPencilAt(a.left, a.top);
      hideDimLabel();
    } else if (cursor) {
      hideDimLabel();
      const hover = nearestWallHover(cursor.x, cursor.z);
      if (hover) {
        appendWallHoverGuide(layer, hover);
        if (hover._screen) {
          showPencilAt(hover._screen.left, hover._screen.top);
        } else {
          const p = projectLocalToScreen(hover.x, 40, hover.z);
          if (p) showPencilAt(p.left, p.top);
        }
      } else {
        const scr = projectLocalToScreen(cursor.x, 40, cursor.z);
        if (scr) showPencilAt(scr.left, scr.top);
      }
    } else {
      hideDimLabel();
      hidePencil();
    }
    return;
  }

  hidePencil();
  hideDimLabel();
  const existing = Array.isArray(state.kitchenZoneDividers) ? state.kitchenZoneDividers : [];
  const liveSplit =
    _pendingStart && cursor ? { x: cursor.x, z: cursor.z } : null;
  for (const d of existing) {
    const split = liveSplit ? pointOnDividerSeg(d, liveSplit.x, liveSplit.z) : null;
    appendHtmlZoneDivider(layer, d.x1, d.z1, d.x2, d.z2, false, split);
  }
  for (const s of strokes) {
    const split = liveSplit ? pointOnDividerSeg(s, liveSplit.x, liveSplit.z) : null;
    appendHtmlZoneDivider(layer, s.x1, s.z1, s.x2, s.z2, false, split);
  }
  const all = existing.concat(strokes);
  if (_pendingStart && cursor) {
    // IKEA: линия тянется за мышкой (не автостена–стена), квадрат на конце
    const x1 = _pendingStart.x;
    const z1 = _pendingStart.z;
    const x2 = cursor.x;
    const z2 = cursor.z;
    appendHtmlZoneDivider(layer, x1, z1, x2, z2, true);
    // в зоны для площади кладём только если оба конца на стенах (иначе одна зона)
    const endOnWall = wallSplitAtExact(x2, z2);
    if (endOnWall) {
      const committed = extendDividerToBoundary(x1, z1, x2, z2);
      all.push(committed);
    }

    const ortho = isAxisAlignedSeg(x1, z1, x2, z2);
    appendZoneSplitDimsAtPoint(layer, x1, z1);
    if (!ortho && endOnWall) appendZoneSplitDimsAtPoint(layer, x2, z2);
    else if (dividerSplitAtExact(x2, z2)) appendZoneDividerSplitDims(layer, x2, z2);

    const endScr = projectLocalToScreen(x2, 40, z2);
    if (endScr) {
      appendZoneTipGuides(layer, { x: x1, z: z1 }, { x: x2, z: z2 });
      showPencilAt(endScr.left, endScr.top);
    }
  } else if (_pendingStart) {
    const a = projectLocalToScreen(_pendingStart.x, 40, _pendingStart.z);
    if (a) showPencilAt(a.left, a.top);
  } else if (cursor) {
    // как стены: hover-гайд + карандаш по центру толщины
    const hover = nearestWallHover(cursor.x, cursor.z);
    if (hover) {
      appendWallHoverGuide(layer, hover);
      if (hover._screen) {
        showPencilAt(hover._screen.left, hover._screen.top);
      } else {
        const p = projectLocalToScreen(hover.x, 40, hover.z);
        if (p) showPencilAt(p.left, p.top);
      }
    } else {
      const scr = projectLocalToScreen(cursor.x, 40, cursor.z);
      if (scr) showPencilAt(scr.left, scr.top);
    }
  } else {
    hidePencil();
  }
  const zones = computeZones(all);
  for (const z of zones) appendHtmlZoneLabel(layer, z);
}

function bindWallPointers() {
  if (_ptrBound) return;
  _ptrBound = true;
  document.addEventListener('pointerdown', onDrawPointerDown, true);
  document.addEventListener('pointermove', onDrawPointerMove, true);
  document.addEventListener('keydown', onDrawKeyDown, true);
  document.addEventListener('pointerdown', onSlopePointerDown, true);
}

function unbindWallPointers() {
  if (!_ptrBound) return;
  _ptrBound = false;
  document.removeEventListener('pointerdown', onDrawPointerDown, true);
  document.removeEventListener('pointermove', onDrawPointerMove, true);
  document.removeEventListener('keydown', onDrawKeyDown, true);
  document.removeEventListener('pointerdown', onSlopePointerDown, true);
}

function isUiChromeTarget(t) {
  return !!(
    t &&
    t.closest &&
    t.closest(
      '#cld-kitchen-draw-overlay, #cld-kitchen-plan-toolbar, .kitchen-room-step, .cld-room-edit-viewbar, .dimension-label, input, button, .cld-kitchen-wall-arrow'
    )
  );
}

function onDrawKeyDown(e) {
  if (!isDrawTool(_activeTool)) return;
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (_activeTool === 'wall' && _pendingStart) {
      e.preventDefault();
      e.stopPropagation();
      finishWallChain();
      redrawPreview(null);
      syncOverlayChrome();
    } else if (_activeTool === 'zone' && _pendingStart) {
      e.preventDefault();
      e.stopPropagation();
      _pendingStart = null;
      _zoneOrthoLock = null;
      hidePencil();
      redrawPreview(null);
      syncOverlayChrome();
    } else if (_activeTool === 'slope' && _slopeEdge) {
      e.preventDefault();
      e.stopPropagation();
      _slopeEdge = null;
      if (_draft && _draft.slope) delete _draft.slope.edge;
      clearSlopePreviewMesh();
      syncOverlayChrome();
    }
  }
}

function onDrawPointerMove(e) {
  if (_activeTool === 'slope') return;
  if (!isDrawTool(_activeTool)) return;
  if (isUiChromeTarget(e.target)) {
    if (_activeTool === 'wall' || _activeTool === 'zone') hidePencil();
    return;
  }
  const raw = pickFloorXZ(e.clientX, e.clientY);
  if (!raw) {
    if (_activeTool === 'wall' || _activeTool === 'zone') showPencilAt(e.clientX, e.clientY);
    return;
  }
  const snapped0 = snapPoint(raw, {
    from: _pendingStart,
    shift: !!(e.shiftKey),
  });
  let snapped =
    _activeTool === 'wall' || _activeTool === 'zone'
      ? softAlignPoint(snapped0, collectAlignAnchors())
      : snapped0;
  if (_activeTool === 'zone' && _pendingStart) {
    snapped = stickyOrthoFromStart(snapped, _pendingStart);
  }

  if ((_activeTool === 'wall' || _activeTool === 'zone') && !_pendingStart) {
    const hover = nearestWallHover(raw.x, raw.z);
    // карандаш/квадрат — по центру толщины стены (как у «Добавить стену»)
    redrawPreview(hover ? { x: hover.x, z: hover.z } : snapped);
    return;
  }

  if ((_activeTool === 'wall' || _activeTool === 'zone') && _pendingStart) {
    const close = wallCloseTarget(raw.x, raw.z, _pendingStart);
    if (close) {
      let cx = close.x;
      let cz = close.z;
      if (_activeTool === 'zone') {
        const st = stickyOrthoFromStart({ x: cx, z: cz }, _pendingStart);
        cx = st.x;
        cz = st.z;
      }
      redrawPreview({
        x: cx,
        z: cz,
        closing: true,
        hover: close.hover,
      });
      return;
    }
  }
  redrawPreview(snapped);
}

function onDrawPointerDown(e) {
  if (_activeTool === 'slope') return; // обрабатывает onSlopePointerDown
  if (!isDrawTool(_activeTool)) return;
  if (e.button !== 0) return;
  if (isUiChromeTarget(e.target)) return;
  const raw = pickFloorXZ(e.clientX, e.clientY);
  if (!raw) return;
  e.preventDefault();
  e.stopPropagation();

  let snapped = snapPoint(raw, {
    from: _pendingStart,
    shift: !!(e.shiftKey),
  });
  if (_activeTool === 'wall' || _activeTool === 'zone') {
    snapped = softAlignPoint(snapped, collectAlignAnchors());
  }
  if (_activeTool === 'zone' && _pendingStart) {
    snapped = stickyOrthoFromStart(snapped, _pendingStart);
  }

  // Старт: с внутренней грани стены
  if ((_activeTool === 'wall' || _activeTool === 'zone') && !_pendingStart) {
    const hover = nearestWallHover(raw.x, raw.z);
    if (hover) {
      snapped = {
        x: hover.innerX != null ? hover.innerX : hover.x,
        z: hover.innerZ != null ? hover.innerZ : hover.z,
      };
    } else if (_activeTool === 'zone') {
      return;
    }
  }

  // Конец у стены = snap / замыкание
  let closing = false;
  if ((_activeTool === 'wall' || _activeTool === 'zone') && _pendingStart) {
    const close = wallCloseTarget(raw.x, raw.z, _pendingStart);
    if (close) {
      snapped = { x: close.x, z: close.z };
      if (_activeTool === 'zone') {
        snapped = stickyOrthoFromStart(snapped, _pendingStart);
      }
      closing = true;
    }
  }
  if (!closing && !pointAllowed(snapped.x, snapped.z)) return;

  if (!_pendingStart) {
    pushSessionUndo('start');
    _pendingStart = { x: snapped.x, z: snapped.z };
    _wallChain = false;
    _zoneOrthoLock = null;
    redrawPreview(null);
    syncOverlayChrome();
    return;
  }

  const len = Math.hypot(snapped.x - _pendingStart.x, snapped.z - _pendingStart.z);
  if (len < MIN_LEN_MM) return;

  pushSessionUndo('stroke');
  if (!_draft) _draft = emptyDraft(_activeTool);
  if (!Array.isArray(_draft.closedChains)) _draft.closedChains = [];
  let stroke = {
    x1: _pendingStart.x,
    z1: _pendingStart.z,
    x2: snapped.x,
    z2: snapped.z,
  };
  if (_activeTool === 'zone') {
    const onWall = !!(closing || wallSplitAtExact(stroke.x2, stroke.z2));
    const onDiv = dividerSplitAtExact(stroke.x2, stroke.z2);
    if (onDiv && !wallSplitAtExact(stroke.x2, stroke.z2)) {
      // стык с линией → T (засечки на пересечении), НЕ сквозь всю комнату
      stroke = clipZoneStrokeToDivider(stroke, onDiv);
    } else if (onWall) {
      stroke = extendDividerToBoundary(stroke.x1, stroke.z1, stroke.x2, stroke.z2);
    }
    // клик в середине поля — оставляем как нарисовали (без авто-дотягивания)
    _draft.strokes = (_draft.strokes || []).concat([stroke]);
    _pendingStart = null;
    _wallChain = false;
    _zoneOrthoLock = null;
    hidePencil();
    redrawPreview(null);
    syncOverlayChrome();
    return;
  }

  _draft.strokes = (_draft.strokes || []).concat([stroke]);

  if (closing) {
    finishWallChain();
    redrawPreview(null);
    syncOverlayChrome();
    return;
  }

  _pendingStart = { x: snapped.x, z: snapped.z };
  _wallChain = true;
  redrawPreview({ x: snapped.x, z: snapped.z });
  syncOverlayChrome();
}

function applyInteriorWallsNow() {
  const room = state.room;
  if (!room || typeof room.applyInteriorWalls !== 'function') return;
  room.applyInteriorWalls(Array.isArray(state.kitchenInteriorWalls) ? state.kitchenInteriorWalls : []);
  state.wallPlanes = room.wallPlanes;
  try {
    if (isIkeaLightBound()) {
      /* light rebind optional */
    }
  } catch (_) {}
}

function isIkeaLightBound() {
  return false;
}

/**
 * Войти в overlay-режим инструмента.
 * @param {KitchenDrawToolId} toolId
 */
export function enterKitchenDrawMode(toolId) {
  const meta = toolMeta(toolId);
  if (!meta) return false;
  if (_activeTool === toolId) return true;

  if (_activeTool) {
    cancelKitchenDrawMode();
  }

  _snapshot = captureSnapshot();
  _draft = emptyDraft(toolId);
  _sessionUndo = [];
  _sessionRedo = [];
  _pendingStart = null;
  _wallChain = false;
  _zoneOrthoLock = null;
  _slopeEdge = null;
  _activeTool = toolId;
  window.__cldKitchenDrawTool = toolId;

  closeDrawMenu();
  syncOverlayChrome();

  try {
    if (typeof window.__cldSetRoomEditViewMode === 'function') {
      window.__cldSetRoomEditViewMode(meta.view);
    } else if (meta.view === '2d' && typeof window.__cldEnterKitchenShapePlanView === 'function') {
      window.__cldEnterKitchenShapePlanView();
    }
  } catch (_) {}

  if (isDrawTool(toolId)) {
    const oldPen = document.getElementById('cld-kitchen-draw-pencil');
    if (oldPen) oldPen.remove();
    bindWallPointers();
    refreshKitchenZonesLayer();
    if (toolId === 'slope') {
      ensureSlopeDraft();
      refreshSlopePreview();
    } else {
      redrawPreview(null);
    }
  }

  console.info('[kitchen-draw] enter', toolId);
  return true;
}

export function cancelKitchenDrawMode() {
  if (!_activeTool) return;
  console.info('[kitchen-draw] cancel', _activeTool);
  const restoreSlope = _activeTool === 'slope' ? _editingSlopeBackup : null;
  unbindWallPointers();
  clearPreviewGroup();
  hideDimLabel();
  hidePencil();
  _pendingStart = null;
  _wallChain = false;
  _slopeEdge = null;
  _activeTool = null;
  _snapshot = null;
  _draft = null;
  _sessionUndo = [];
  _sessionRedo = [];
  _editingSlopeId = null;
  _editingSlopeBackup = null;
  window.__cldKitchenDrawTool = null;
  syncOverlayChrome();
  if (restoreSlope) {
    if (!Array.isArray(state.kitchenCeilingSlopes)) state.kitchenCeilingSlopes = [];
    state.kitchenCeilingSlopes = state.kitchenCeilingSlopes.concat([restoreSlope]);
    try {
      refreshKitchenCeilingSlopes();
    } catch (_) {}
  }
  closeDrawMenu();
  try {
    refreshKitchenZonesLayer();
  } catch (_) {}
}

/**
 * IKEA «Создать»: только зафиксировать скос (3D). Панель сбросить.
 * Голубая зона + значок — после верхнего OK (вид сверху).
 */
function commitSlopeCreateOnly() {
  if (!_slopeEdge) return false;
  const { aMm, bMm, cDeg } = readSlopeABC();
  if (!Array.isArray(state.kitchenCeilingSlopes)) state.kitchenCeilingSlopes = [];
  _slopeSeq += 1;
  const id = _editingSlopeId || 'sl' + Date.now().toString(36) + '_' + _slopeSeq;
  _editingSlopeId = null;
  _editingSlopeBackup = null;
  state.kitchenCeilingSlopes = state.kitchenCeilingSlopes.concat([
    {
      id,
      edgeIndex: _slopeEdge.edgeIndex,
      x1: _slopeEdge.x1,
      z1: _slopeEdge.z1,
      x2: _slopeEdge.x2,
      z2: _slopeEdge.z2,
      nx: _slopeEdge.nx,
      nz: _slopeEdge.nz,
      aMm,
      bMm,
      cDeg,
    },
  ]);
  try {
    refreshKitchenCeilingSlopes();
  } catch (e) {
    console.warn('[kitchen-draw] slope create failed', e);
  }
  clearSlopePreviewMesh();
  _slopeEdge = null;
  if (_draft) _draft.slope = Object.assign({}, ensureSlopeDraft(), { edge: null });
  const tip = document.getElementById('cld-draw-slope-retarget');
  if (tip) tip.hidden = true;
  const title = document.getElementById('cld-draw-slope-title');
  if (title) title.textContent = 'Скошенный потолок';
  // остаёмся в 3D: скос уже виден; план с иконкой — по OK
  try {
    if (typeof window.__cldSetRoomEditViewMode === 'function') {
      window.__cldSetRoomEditViewMode('3d');
    }
  } catch (_) {}
  syncOverlayChrome();
  return true;
}

export function commitKitchenDrawMode() {
  if (!_activeTool || !_draft) return false;
  console.info('[kitchen-draw] commit', _activeTool, _draft);
  const leavingSlope = _activeTool === 'slope';

  if (_activeTool === 'wall') {
    const strokes = allDraftWallStrokes();
    if (strokes.length) {
      if (!Array.isArray(state.kitchenInteriorWalls)) state.kitchenInteriorWalls = [];
      const added = strokes.map((s) => {
        _iwSeq += 1;
        return {
          id: 'iw' + Date.now().toString(36) + '_' + _iwSeq,
          x1: s.x1,
          z1: s.z1,
          x2: s.x2,
          z2: s.z2,
        };
      });
      state.kitchenInteriorWalls = state.kitchenInteriorWalls.concat(added);
      state.kitchenZones = computeZones(collectZoneSplitters());
      try {
        applyInteriorWallsNow();
      } catch (e) {
        console.warn('[kitchen-draw] apply interior walls failed', e);
      }
      try {
        if (window.__cldKitchenShapePlan && typeof window.__cldApplyKitchenPlanColorsQuiet === 'function') {
          window.__cldApplyKitchenPlanColorsQuiet();
        }
      } catch (_) {}
    }
  } else if (_activeTool === 'zone') {
    const strokes = Array.isArray(_draft.strokes) ? _draft.strokes : [];
    if (strokes.length) {
      if (!Array.isArray(state.kitchenZoneDividers)) state.kitchenZoneDividers = [];
      const added = strokes.map((s) => {
        _zdSeq += 1;
        return {
          id: 'zd' + Date.now().toString(36) + '_' + _zdSeq,
          x1: s.x1,
          z1: s.z1,
          x2: s.x2,
          z2: s.z2,
        };
      });
      state.kitchenZoneDividers = state.kitchenZoneDividers.concat(added);
      state.kitchenZones = computeZones(state.kitchenZoneDividers);
      _selectedZoneDividerId = null;
    }
  } else if (_activeTool === 'slope') {
    // если нажали OK без «Создать» — всё равно зафиксировать черновик
    if (_slopeEdge) commitSlopeCreateOnly();
  }

  unbindWallPointers();
  clearPreviewGroup();
  hideDimLabel();
  hidePencil();
  _pendingStart = null;
  _wallChain = false;
  _slopeEdge = null;
  _activeTool = null;
  _snapshot = null;
  _draft = null;
  _sessionUndo = [];
  _sessionRedo = [];
  window.__cldKitchenDrawTool = null;
  syncOverlayChrome();
  closeDrawMenu();
  try {
    refreshKitchenZonesLayer();
  } catch (_) {}
  try {
    refreshKitchenCeilingSlopes();
  } catch (_) {}
  // IKEA: после OK инструмента — вид сверху с голубой зоной и значком
  if (leavingSlope || (state.kitchenCeilingSlopes && state.kitchenCeilingSlopes.length)) {
    try {
      if (typeof window.__cldSetRoomEditViewMode === 'function') {
        window.__cldSetRoomEditViewMode('2d');
      }
    } catch (_) {}
  }
  return true;
}

function sessionUndo() {
  if (!_sessionUndo.length) return;
  const prev = _sessionUndo.pop();
  _sessionRedo.push({
    draft: _draft ? JSON.parse(JSON.stringify(_draft)) : emptyDraft(_activeTool),
    pendingStart: _pendingStart ? { ..._pendingStart } : null,
  });
  _draft = prev.draft ? prev.draft : emptyDraft(_activeTool);
  _pendingStart = prev.pendingStart || null;
  if (_activeTool === 'slope') {
    _slopeEdge = (_draft && _draft.slope && _draft.slope.edge) || null;
    refreshSlopePreview();
  } else {
    redrawPreview(null);
  }
  syncOverlayChrome();
}

function sessionRedo() {
  if (!_sessionRedo.length) return;
  const next = _sessionRedo.pop();
  _sessionUndo.push({
    draft: _draft ? JSON.parse(JSON.stringify(_draft)) : emptyDraft(_activeTool),
    pendingStart: _pendingStart ? { ..._pendingStart } : null,
  });
  _draft = next.draft ? next.draft : emptyDraft(_activeTool);
  _pendingStart = next.pendingStart || null;
  if (_activeTool === 'slope') {
    _slopeEdge = (_draft && _draft.slope && _draft.slope.edge) || null;
    refreshSlopePreview();
  } else {
    redrawPreview(null);
  }
  syncOverlayChrome();
}

function onOverlayClick(e) {
  const btn = e.target.closest('[data-draw-act]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  if (btn.disabled) return;
  const act = btn.getAttribute('data-draw-act');
  if (act === 'cancel') cancelKitchenDrawMode();
  else if (act === 'create-slope') commitSlopeCreateOnly();
  else if (act === 'remove-slope') {
    const id = _editingSlopeId || (_editingSlopeBackup && _editingSlopeBackup.id);
    _editingSlopeId = null;
    _editingSlopeBackup = null;
    if (id) removeKitchenCeilingSlope(id);
    // выйти из инструмента правки → сразу план со значками
    _slopeEdge = null;
    if (_draft) _draft = emptyDraft('slope');
    commitKitchenDrawMode();
  } else if (act === 'ok') commitKitchenDrawMode();
  else if (act === 'undo') sessionUndo();
  else if (act === 'redo') sessionRedo();
}

function onPlanToolbarClick(e) {
  const menuBtn = e.target.closest('[data-plan-menu]');
  if (menuBtn) {
    const which = menuBtn.getAttribute('data-plan-menu');
    if (which === 'shape') {
      closeDrawMenu();
      try {
        if (typeof window.__cldSetKitchenRoomMode === 'function') {
          window.__cldSetKitchenRoomMode('shape');
        }
      } catch (_) {}
      return;
    }
    if (which === 'draw') {
      // вкладка «План» в правой панели
      try {
        if (typeof window.__cldSetKitchenRoomMode === 'function') {
          window.__cldSetKitchenRoomMode('plan');
          closeDrawMenu();
          return;
        }
      } catch (_) {}
      const menu = document.getElementById('cld-kitchen-plan-draw-menu');
      if (!menu) return;
      const open = menu.hidden;
      menu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }
  }
  const toolBtn = e.target.closest('[data-draw-tool]');
  if (toolBtn) {
    enterKitchenDrawMode(toolBtn.getAttribute('data-draw-tool'));
  }
}

function onDocPointerDown(e) {
  const menu = document.getElementById('cld-kitchen-plan-draw-menu');
  const bar = document.getElementById('cld-kitchen-plan-toolbar');
  if (!menu || menu.hidden) return;
  if (bar && bar.contains(e.target)) return;
  closeDrawMenu();
}

export function setKitchenPlanToolbarVisible(on) {
  const bar = ensurePlanToolbar();
  bar.classList.toggle('is-open', !!on);
  if (!on) {
    closeDrawMenu();
    if (_activeTool) cancelKitchenDrawMode();
  }
}

export function mountKitchenDrawModeUi() {
  ensureOverlay();
  ensurePlanToolbar();
  if (_uiBound) return;
  _uiBound = true;
  document.getElementById('cld-kitchen-draw-overlay')?.addEventListener('click', onOverlayClick);
  document.getElementById('cld-kitchen-plan-toolbar')?.addEventListener('click', onPlanToolbarClick);
  document.addEventListener('pointerdown', onDocPointerDown, true);
}

export function unmountKitchenDrawModeUi() {
  cancelKitchenDrawMode();
  setKitchenPlanToolbarVisible(false);
  if (!_uiBound) return;
  _uiBound = false;
  document.getElementById('cld-kitchen-draw-overlay')?.removeEventListener('click', onOverlayClick);
  document.getElementById('cld-kitchen-plan-toolbar')?.removeEventListener('click', onPlanToolbarClick);
  document.removeEventListener('pointerdown', onDocPointerDown, true);
}

export function kitchenDrawPushStrokeStub(payload) {
  if (!_draft) return;
  pushSessionUndo('stroke');
  _draft.strokes = (_draft.strokes || []).concat([payload || { at: Date.now() }]);
  redrawPreview(null);
}

if (typeof window !== 'undefined') {
  window.__cldEnterKitchenDrawMode = enterKitchenDrawMode;
  window.__cldCancelKitchenDrawMode = cancelKitchenDrawMode;
  window.__cldCommitKitchenDrawMode = commitKitchenDrawMode;
  window.__cldRefreshKitchenZonesLayer = refreshKitchenZonesLayer;
  window.__cldRefreshKitchenCeilingSlopes = refreshKitchenCeilingSlopes;
  window.__cldSyncKitchenCeilingSlopeViewVisibility = syncKitchenCeilingSlopeViewVisibility;
  window.__cldRefreshKitchenCeilingSlopeMarkers2d = refreshKitchenCeilingSlopeMarkers2d;
}
