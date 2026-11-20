/**
 * Кухня 2D: выбор стены + сдвиг как в IKEA.
 * ЛКМ — подсветка и стрелки; тянуть стену/стрелку — двигает вдоль нормали;
 * короткий клик по стрелке — шаг 100 мм.
 */

import { state } from '../utils/state.js';
import { updateRoomDimensionLabels } from '../ui/scene-icons.js?v=20261027-nmu142q';

const NUDGE_MM = 100;
const CLICK_PX = 6;

let _bound = false;
let _selectedEdge = null;
let _drag = null;
let _highlight = null;

function room() {
  return state.room;
}

function footprint() {
  const r = room();
  return r && r.footprintSpec ? r.footprintSpec : null;
}

function canvasEl() {
  return (
    document.getElementById('canvas-container') ||
    (state.renderer && state.renderer.domElement && state.renderer.domElement.parentElement) ||
    null
  );
}

export function getKitchenSelectedEdge() {
  return _selectedEdge;
}

function setSelectedEdge(edgeIndex, opts) {
  const skipArrows = !!(opts && opts.skipArrows);
  _selectedEdge = Number.isFinite(edgeIndex) ? edgeIndex : null;
  window.__cldKitchenSelectedEdge = _selectedEdge;
  updateHighlight();
  if (!skipArrows) updateArrows();
  updateRelatedDimFilter();
  try {
    updateRoomDimensionLabels();
  } catch (_) {}
}

function updateRelatedDimFilter() {
  if (_selectedEdge == null) {
    window.__cldKitchenDimEdgeFilter = null;
    return;
  }
  const fp = footprint();
  const key = fp && fp.shapeKey;
  const i = _selectedEdge;
  const show = new Set([i]);

  if (key === 'enclosed_notch') {
    const n = (fp.vertices && fp.vertices.length) || 6;
    show.add((i + 1) % n);
    show.add((i + n - 1) % n);
  } else if (key === 'enclosed_chamfer') {
    const n = (fp.vertices && fp.vertices.length) || 5;
    show.add((i + n - 1) % n);
    show.add((i + 1) % n);
  } else if (key === 'open_protrusion') {
    if (i === 1) {
      show.add(0);
      show.add(2);
    } else if (i === 2 || i === 3) {
      show.add(2);
      show.add(3);
    } else {
      show.add((i + 1) % 6);
    }
  } else {
    const n = (fp && fp.vertices && fp.vertices.length) || 4;
    show.add((i + 1) % n);
    show.add((i + n - 1) % n);
  }
  window.__cldKitchenDimEdgeFilter = show;
}

function clearHighlight() {
  if (_highlight && _highlight.parent) {
    _highlight.parent.remove(_highlight);
    if (_highlight.geometry) _highlight.geometry.dispose();
    if (_highlight.material) _highlight.material.dispose();
  }
  _highlight = null;
  const r = room();
  if (!r || !r.group) return;
  r.group.traverse((o) => {
    if (!o.isMesh || !o.userData || !o.userData.isPolygonWallStrip) return;
    if (o.userData._cldWallSelMat) {
      if (o.material) o.material.dispose();
      o.material = o.userData._cldWallSelMat;
      o.userData._cldWallSelMat = null;
    }
  });
}

function updateHighlight() {
  clearHighlight();
  const r = room();
  const fp = footprint();
  if (!r || !fp || _selectedEdge == null || typeof THREE === 'undefined') return;
  const verts = fp.vertices;
  const i = _selectedEdge;
  if (!verts || i < 0 || i >= verts.length) return;
  const a = verts[i];
  const b = verts[(i + 1) % verts.length];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 1) return;

  const T = 100;
  const nx = dz / len;
  const nz = -dx / len;
  const pad = 6;
  const shape = new THREE.Shape();
  shape.moveTo(a.x - nx * pad, a.z - nz * pad);
  shape.lineTo(b.x - nx * pad, b.z - nz * pad);
  shape.lineTo(b.x + nx * (T + pad), b.z + nz * (T + pad));
  shape.lineTo(a.x + nx * (T + pad), a.z + nz * (T + pad));
  shape.closePath();
  const geom = new THREE.ShapeGeometry(shape);
  geom.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x8ec5ff,
    transparent: true,
    opacity: 0.62,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  _highlight = new THREE.Mesh(geom, mat);
  _highlight.position.y = (r.height || 2500) + 2;
  _highlight.renderOrder = 20;
  _highlight.userData.isKitchenWallHighlight = true;
  r.group.add(_highlight);

  r.group.traverse((o) => {
    if (!o.isMesh || !o.userData || !o.userData.isPolygonWallStrip) return;
    if (o.userData.edgeIndex !== i) return;
    if (!o.userData._cldWallSelMat) {
      o.userData._cldWallSelMat = o.material;
      o.material = o.material.clone();
    }
    if (o.material && o.material.color) o.material.color.setHex(0x7eb6ff);
  });
}

function ensureArrowsEl() {
  let el = document.getElementById('cld-kitchen-wall-arrows');
  if (el) return el;
  const host = canvasEl() || document.body;
  el = document.createElement('div');
  el.id = 'cld-kitchen-wall-arrows';
  el.className = 'cld-kitchen-wall-arrows';
  host.appendChild(el);
  return el;
}

function edgeOutward(i) {
  const fp = footprint();
  const verts = fp && fp.vertices;
  if (!verts || i == null || i < 0 || i >= verts.length) return { nx: 1, nz: 0, a: null, b: null };
  const a = verts[i];
  const b = verts[(i + 1) % verts.length];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  return { nx: dz / len, nz: -dx / len, len, a, b };
}

function updateArrows() {
  if (_drag) return; // не трогать DOM стрелок во время drag
  const el = ensureArrowsEl();
  el.replaceChildren();
  if (_selectedEdge == null || !state.camera || !room()) {
    el.style.display = 'none';
    return;
  }
  const { nx, nz, a, b } = edgeOutward(_selectedEdge);
  if (!a || !b) return;
  const rw = room().width;
  const rd = room().depth;
  const ox = -rw / 2;
  const oz = -rd / 2;
  const mid = new THREE.Vector3(
    ox + (a.x + b.x) / 2,
    (room().height || 2500) + 4,
    oz + (a.z + b.z) / 2
  );

  const box = canvasEl();
  if (!box) return;
  const w = box.clientWidth / 2;
  const h = box.clientHeight / 2;
  const v = mid.clone().project(state.camera);
  const sx = v.x * w + w;
  const sy = -v.y * h + h;

  const pOut = mid.clone().add(new THREE.Vector3(nx * 200, 0, nz * 200)).project(state.camera);
  const ang = (Math.atan2(-pOut.y * h + h - sy, pOut.x * w + w - sx) * 180) / Math.PI;

  el.style.display = 'block';
  const mk = (dir) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cld-kitchen-wall-arrow';
    btn.dataset.dir = String(dir);
    btn.setAttribute('aria-label', dir > 0 ? 'Сдвинуть наружу' : 'Сдвинуть внутрь');
    btn.innerHTML = '<span class="cld-kitchen-wall-arrow__tri" aria-hidden="true"></span>';
    const dist = 32;
    const rad = ((ang + (dir > 0 ? 0 : 180)) * Math.PI) / 180;
    btn.style.left = sx + Math.cos(rad) * dist + 'px';
    btn.style.top = sy + Math.sin(rad) * dist + 'px';
    btn.style.transform = 'translate(-50%, -50%) rotate(' + (ang + (dir > 0 ? 0 : 180)) + 'deg)';
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {}
      beginDrag(_selectedEdge, e.clientX, e.clientY, { fromArrow: true, arrowDir: dir, pointerId: e.pointerId });
    });
    el.appendChild(btn);
  };
  mk(1);
  mk(-1);
}

function beginDrag(edgeIndex, clientX, clientY, meta) {
  const { nx, nz } = edgeOutward(edgeIndex);
  _drag = {
    edgeIndex,
    startX: clientX,
    startY: clientY,
    lastX: clientX,
    lastY: clientY,
    nx,
    nz,
    moved: false,
    switchedToSize: false,
    fromArrow: !!(meta && meta.fromArrow),
    arrowDir: meta && meta.arrowDir,
    pointerId: meta && meta.pointerId,
    appliedMm: 0,
  };
  document.body.classList.add('cld-kitchen-wall-dragging');
  window.addEventListener('pointermove', onDragMove, true);
  window.addEventListener('pointerup', onDragEnd, true);
  window.addEventListener('pointercancel', onDragEnd, true);
}

function switchToSizeTab() {
  if (typeof window.__cldSetKitchenRoomMode === 'function') {
    try {
      window.__cldSetKitchenRoomMode('size');
    } catch (_) {}
  }
}

function screenDeltaAlongOutward(dxPx, dyPx, nx, nz) {
  const cam = state.camera;
  const box = canvasEl();
  const r = room();
  if (!cam || !box || !r) return 0;

  // Проекция нормали с середины комнаты (орто сверху — направление стабильно)
  const mid = new THREE.Vector3(0, (r.height || 2500) + 4, 0);
  const a = mid.clone().project(cam);
  const b = mid.clone().add(new THREE.Vector3(nx * 1000, 0, nz * 1000)).project(cam);
  const w = box.clientWidth / 2;
  const h = box.clientHeight / 2;
  const sx = (b.x - a.x) * w;
  const sy = -(b.y - a.y) * h;
  const sl = Math.hypot(sx, sy) || 1;
  const projPx = dxPx * (sx / sl) + dyPx * (sy / sl);

  if (cam.isOrthographicCamera) {
    const worldW = (cam.right - cam.left) / (cam.zoom || 1);
    return projPx * (worldW / box.clientWidth);
  }
  return projPx * 4;
}

/**
 * Применить сдвиг стены. quiet — без сброса камеры (live drag).
 * @returns {boolean}
 */
function applyWallNudge(edgeIndex, deltaMm, quiet) {
  if (!Number.isFinite(deltaMm) || Math.abs(deltaMm) < 1) return false;
  const fp = footprint();
  const r = room();
  if (!fp || !r) return false;
  const key = fp.shapeKey;
  const params = { ...(state.kitchenFootprintParams || fp.params || {}) };
  let w = r.width;
  let d = r.depth;
  const i = edgeIndex;
  let changed = false;

  if (key === 'enclosed_notch') {
    const verts = fp.vertices || [];
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    if (!a || !b) return false;
    const { nx: onx, nz: onz } = edgeOutward(i);
    const mx = (a.x + b.x) / 2;
    const mz = (a.z + b.z) / 2;
    const eps = Math.max(8, Math.min(w, d) * 0.02);
    const onOuter =
      Math.abs(mx) <= eps ||
      Math.abs(mx - w) <= eps ||
      Math.abs(mz) <= eps ||
      Math.abs(mz - d) <= eps;

    let cutX = Number.isFinite(params.nx) ? params.nx : Math.round(w * 0.55);
    let cutZ = Number.isFinite(params.nz) ? d - params.nz : Math.round(d * 0.55);

    if (onOuter) {
      if (Math.abs(onx) > 0.5) {
        if (onx > 0) {
          const nw = Math.max(1200, w + deltaMm);
          if (nw !== w) {
            w = nw;
            changed = true;
            cutX = Math.min(w - 600, Math.max(600, cutX));
          }
        } else if (deltaMm < 0) {
          const shrink = -deltaMm;
          const nw = Math.max(1200, w - shrink);
          if (nw !== w) {
            w = nw;
            changed = true;
            cutX = Math.max(600, Math.min(w - 600, cutX - shrink));
          }
        }
      } else {
        if (onz > 0) {
          const nd = Math.max(1200, d + deltaMm);
          if (nd !== d) {
            d = nd;
            changed = true;
            cutZ = Math.min(d - 600, Math.max(600, cutZ));
          }
        } else if (deltaMm < 0) {
          const shrink = -deltaMm;
          const nd = Math.max(1200, d - shrink);
          if (nd !== d) {
            d = nd;
            changed = true;
            cutZ = Math.max(600, Math.min(d - 600, cutZ - shrink));
          }
        }
      }
    } else {
      // Внутренние грани ниши: наружу (в void) → уменьшаем cut
      if (Math.abs(onx) > 0.5) {
        const nCut = Math.max(600, Math.min(w - 600, cutX - deltaMm));
        if (nCut !== cutX) {
          cutX = nCut;
          changed = true;
        }
      } else {
        const nCut = Math.max(600, Math.min(d - 600, cutZ - deltaMm));
        if (nCut !== cutZ) {
          cutZ = nCut;
          changed = true;
        }
      }
    }
    if (changed) {
      params.nx = cutX;
      params.nz = d - cutZ;
    }
  } else if (key === 'enclosed_chamfer') {
    const verts = fp.vertices || [];
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    if (!a || !b) return false;
    const { nx: onx, nz: onz } = edgeOutward(i);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const isDiag = Math.abs(dx) > 1 && Math.abs(dz) > 1;
    if (isDiag) {
      const c0 = Number.isFinite(params.c) ? params.c : Math.round(Math.min(w, d) * 0.3);
      const nc = Math.max(400, Math.min(Math.min(w, d) - 800, c0 - deltaMm));
      if (nc !== c0) {
        params.c = nc;
        changed = true;
      }
    } else if (Math.abs(onx) > 0.5) {
      if (onx > 0) {
        w = Math.max(1200, w + deltaMm);
        changed = true;
      } else if (deltaMm < 0) {
        w = Math.max(1200, w + deltaMm);
        changed = true;
      }
    } else {
      d = Math.max(1200, d + deltaMm);
      changed = true;
    }
  } else if (key === 'open_protrusion') {
    if (i === 0 || i === 2) {
      d = Math.max(1200, d + deltaMm);
      changed = true;
    } else if (i === 1) {
      w = Math.max(1200, w + deltaMm);
      changed = true;
    } else if (i === 3) {
      const step = Number.isFinite(params.step) ? params.step : Math.round(Math.min(w, d) * 0.18);
      params.step = Math.max(400, Math.min(d - 600, step + deltaMm));
      changed = true;
    } else if (i === 5 && deltaMm < 0) {
      w = Math.max(1200, w + deltaMm);
      changed = true;
    }
  } else {
    const { nx: onx, nz: onz } = edgeOutward(i);
    if (Math.abs(onx) > 0.5) {
      if (onx > 0) {
        w = Math.max(1200, w + deltaMm);
        changed = true;
      } else if (deltaMm < 0) {
        w = Math.max(1200, w + deltaMm);
        changed = true;
      }
    } else {
      d = Math.max(1200, d + deltaMm);
      changed = true;
    }
  }

  if (!changed) return false;

  state.kitchenFootprintParams = { ...params, width: w, depth: d };
  const wEl = document.getElementById('room-width-input');
  const dEl = document.getElementById('room-depth-input');
  if (wEl) wEl.value = String(Math.round(w / 10));
  if (dEl) dEl.value = String(Math.round(d / 10));

  window.__cldKitchenSelectedEdge = edgeIndex;
  if (typeof window.__cldRecreateRoomWithShape === 'function') {
    window.__cldRecreateRoomWithShape(key || 'enclosed_rect', { quiet: !!quiet });
  }
  return true;
}

function onDragMove(e) {
  if (!_drag) return;
  const dx = e.clientX - _drag.startX;
  const dy = e.clientY - _drag.startY;
  if (Math.hypot(dx, dy) > CLICK_PX) {
    _drag.moved = true;
    if (!_drag.switchedToSize) {
      _drag.switchedToSize = true;
      switchToSizeTab();
    }
  }

  const stepDx = e.clientX - _drag.lastX;
  const stepDy = e.clientY - _drag.lastY;
  let mm = screenDeltaAlongOutward(stepDx, stepDy, _drag.nx, _drag.nz);
  _drag.pending = (_drag.pending || 0) + mm;
  _drag.lastX = e.clientX;
  _drag.lastY = e.clientY;

  const snap = Math.trunc(_drag.pending / 10) * 10;
  if (Math.abs(snap) < 10) return;
  _drag.pending -= snap;

  const edge = _drag.edgeIndex;
  if (applyWallNudge(edge, snap, true)) {
    _drag.appliedMm = (_drag.appliedMm || 0) + snap;
    const o = edgeOutward(edge);
    _drag.nx = o.nx;
    _drag.nz = o.nz;
    _selectedEdge = edge;
    updateHighlight();
    updateRelatedDimFilter();
    try {
      updateRoomDimensionLabels();
    } catch (_) {}
  }
}

function clearWallSelection() {
  _selectedEdge = null;
  window.__cldKitchenSelectedEdge = null;
  window.__cldKitchenDimEdgeFilter = null;
  clearHighlight();
  const el = document.getElementById('cld-kitchen-wall-arrows');
  if (el) {
    el.replaceChildren();
    el.style.display = 'none';
  }
  try {
    updateRoomDimensionLabels();
  } catch (_) {}
}

function onDragEnd(e) {
  if (!_drag) return;
  const drag = _drag;
  const edge = drag.edgeIndex;
  const didMove = !!drag.moved;

  // клик по стрелке без движения → шаг, потом сброс выделения
  if (drag.fromArrow && !didMove && Number.isFinite(drag.arrowDir)) {
    switchToSizeTab();
    applyWallNudge(edge, drag.arrowDir * NUDGE_MM, false);
  } else if (didMove) {
    const key = (footprint() && footprint().shapeKey) || 'enclosed_rect';
    if (typeof window.__cldRecreateRoomWithShape === 'function') {
      // без восстановления выбора — отпускание ЛКМ снимает подсветку
      window.__cldKitchenSelectedEdge = null;
      window.__cldRecreateRoomWithShape(key, { quiet: false });
    }
  }

  try {
    if (drag.pointerId != null && e && e.target && e.target.releasePointerCapture) {
      e.target.releasePointerCapture(drag.pointerId);
    }
  } catch (_) {}

  _drag = null;
  document.body.classList.remove('cld-kitchen-wall-dragging');
  window.removeEventListener('pointermove', onDragMove, true);
  window.removeEventListener('pointerup', onDragEnd, true);
  window.removeEventListener('pointercancel', onDragEnd, true);

  // Только при зажатом ЛКМ: отпустили — не тянется и не подсвечивается
  clearWallSelection();
}

function pickEdgeIndex(clientX, clientY) {
  const r = room();
  const fp = footprint();
  const box = canvasEl();
  if (!r || !fp || !box || !state.camera || !state.raycaster) return null;
  const rect = box.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  state.raycaster.setFromCamera(mouse, state.camera);

  const strips = [];
  r.group.traverse((o) => {
    if (o.isMesh && o.userData && (o.userData.isPolygonWallStrip || Number.isFinite(o.userData.edgeIndex))) {
      strips.push(o);
    }
  });
  if (strips.length) {
    const hits = state.raycaster.intersectObjects(strips, false);
    if (hits.length && Number.isFinite(hits[0].object.userData.edgeIndex)) {
      return hits[0].object.userData.edgeIndex;
    }
  }
  if (r.wallPlanes && r.wallPlanes.length) {
    const hits = state.raycaster.intersectObjects(r.wallPlanes, false);
    if (hits.length && Number.isFinite(hits[0].object.userData.edgeIndex)) {
      return hits[0].object.userData.edgeIndex;
    }
  }

  const floor = r.floorCoating || r.floorBase;
  if (!floor) return null;
  const fh = state.raycaster.intersectObject(floor, false);
  if (!fh.length) return null;
  const pt = fh[0].point.clone();
  r.group.worldToLocal(pt);
  const verts = fp.vertices;
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < verts.length; i++) {
    const seg = fp.segments && fp.segments[i];
    if (seg && seg.open) continue;
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const d = distPointToSeg(pt.x, pt.z, a.x, a.z, b.x, b.z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  if (best != null && bestD < 200) return best;
  return null;
}

function distPointToSeg(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((px - x1) * dx + (pz - z1) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
}

function onCanvasPointerDown(e) {
  if (e.button !== 0) return;
  if (!window.__cldKitchenShapePlan) return;
  if (window.__cldKitchenDrawTool) return;
  if (window.__cldKitchenRoomMode === 'doors' || window.__cldKitchenRoomMode === 'windows') return;
  if (
    e.target &&
    e.target.closest &&
    e.target.closest(
      '.dimension-label, .cld-kitchen-wall-arrow, input, button, .kitchen-room-step, .cld-room-edit'
    )
  ) {
    return;
  }
  const edge = pickEdgeIndex(e.clientX, e.clientY);
  if (edge == null) {
    clearWallSelection();
    return;
  }
  e.preventDefault();
  e.stopPropagation();

  // Выделение только пока зажат ЛКМ — сразу подсветка + drag
  setSelectedEdge(edge);
  beginDrag(edge, e.clientX, e.clientY, { fromArrow: false });
}

function onResize() {
  if (!_drag) updateArrows();
}

function onAnimFrame() {
  if (_selectedEdge != null && window.__cldKitchenShapePlan && _drag) updateArrows();
}

export function mountKitchenWallEdit() {
  const el = canvasEl();
  if (!el) return;
  if (!_bound) {
    el.addEventListener('pointerdown', onCanvasPointerDown, true);
    window.addEventListener('resize', onResize);
    _bound = true;
  }
  if (_drag) return; // mid-drag: не сбрасывать
  // выбор не восстанавливаем — только при зажатом ЛКМ
  clearWallSelection();
}

export function unmountKitchenWallEdit() {
  const el = canvasEl();
  if (el) el.removeEventListener('pointerdown', onCanvasPointerDown, true);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('pointermove', onDragMove, true);
  window.removeEventListener('pointerup', onDragEnd, true);
  window.removeEventListener('pointercancel', onDragEnd, true);
  _bound = false;
  _drag = null;
  document.body.classList.remove('cld-kitchen-wall-dragging');
  clearWallSelection();
  const arrows = document.getElementById('cld-kitchen-wall-arrows');
  if (arrows) arrows.remove();
}

export function remountKitchenWallEditSelection() {
  if (_drag) {
    const i = Number.isFinite(_drag.edgeIndex) ? _drag.edgeIndex : _selectedEdge;
    if (Number.isFinite(i)) {
      _selectedEdge = i;
      window.__cldKitchenSelectedEdge = i;
      updateHighlight();
      updateArrows();
    }
    return;
  }
  clearWallSelection();
}

if (typeof window !== 'undefined') {
  window.__cldMountKitchenWallEdit = mountKitchenWallEdit;
  window.__cldUnmountKitchenWallEdit = unmountKitchenWallEdit;
  window.__cldRemountKitchenWallEditSelection = remountKitchenWallEditSelection;
  window.addEventListener(
    'wheel',
    () => {
      if (window.__cldKitchenShapePlan) requestAnimationFrame(onAnimFrame);
    },
    { passive: true }
  );
}
