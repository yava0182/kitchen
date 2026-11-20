/**
 * IKEA «Вывод воды»: выбор стены для раковины.
 * Hover → краник; ЛКМ → стена синяя + круг с краником; ОК → краник на стене.
 */
import { state } from '../utils/state.js';
import { updateMousePosition } from '../events/mouse-handler.js';

const WALL_ORDER = ['back', 'right', 'front', 'left'];
const HIT_PX = 36;
const FAUCET_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none">' +
  '<path d="M7 10V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  '<path d="M6 10h12v3a3 3 0 0 1-3 3h-1.2L13 20H11l-.8-4H9a3 3 0 0 1-3-3v-3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
  '<path d="M12 4v2M9.5 14.5c0 1 .8 1.5 1.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
  '</svg>';

let active = false;
let pendingWall = null;
let hoverWall = null;
let raf = 0;
let bound = false;
let prevView = null;

function isTopView2d() {
  return window.__cldRoomEditView !== '3d';
}

function getOutlet() {
  return state.roomEditWaterOutlet || null;
}

function setOutlet(val) {
  state.roomEditWaterOutlet = val || null;
}

function wallCardinal(room, wallName) {
  if (room && typeof room.wallCardinalSide === 'function') {
    return room.wallCardinalSide(wallName) || wallName;
  }
  return wallName;
}

function wallLengthMm(room, wallName) {
  if (!room) return 4000;
  let len = room.wallLengthOf ? Number(room.wallLengthOf(wallName)) : NaN;
  if (!Number.isFinite(len) || len < 200) {
    const side = wallCardinal(room, wallName);
    if (side === 'left' || side === 'right') len = Number(room.depth) || 4000;
    else len = Number(room.width) || 5000;
  }
  return len;
}

function listSolidWalls(room) {
  if (!room) return [];
  const segs = Array.isArray(room.wallSegments) ? room.wallSegments : [];
  const seen = new Set();
  const keys = [];
  segs.forEach((s) => {
    if (!s || s.open) return;
    const k = s.wallName || s.id;
    if (!k || seen.has(k)) return;
    seen.add(k);
    keys.push(k);
  });
  if (!keys.length) {
    return WALL_ORDER.filter((w) => room.walls && room.walls[w]);
  }
  const ordered = [];
  WALL_ORDER.forEach((w) => {
    if (seen.has(w)) ordered.push(w);
  });
  keys.forEach((k) => {
    if (WALL_ORDER.indexOf(k) < 0) ordered.push(k);
  });
  return ordered;
}

/** Точка на внутренней грани стены (локальные мм комнаты). */
function wallPose(room, wallName, alongMm, insetMm) {
  const side = wallCardinal(room, wallName);
  const origin = room.wallAlongOrigin ? room.wallAlongOrigin(wallName) : 0;
  const along = origin + (Number(alongMm) || 0);
  const inset = Number.isFinite(insetMm) ? insetMm : 30;
  let x = 0;
  let z = 0;
  if (side === 'back') {
    x = along;
    z = inset;
  } else if (side === 'front') {
    x = along;
    z = room.depth - inset;
  } else if (side === 'left') {
    x = inset;
    z = along;
  } else {
    x = room.width - inset;
    z = along;
  }
  return { x, z, side, alongMm: Number(alongMm) || 0 };
}

function wallEnds(room, wallName, insetMm) {
  const len = wallLengthMm(room, wallName);
  const a = wallPose(room, wallName, 40, insetMm);
  const b = wallPose(room, wallName, Math.max(80, len - 40), insetMm);
  return { a, b, len };
}

function worldPoint(xMm, zMm, yMm) {
  const room = state.room;
  if (!room || !room.group) return new THREE.Vector3(xMm, yMm || 8, zMm);
  const v = new THREE.Vector3(xMm, yMm || 8, zMm);
  room.group.localToWorld(v);
  return v;
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

function faucetIconHtml(mod) {
  return (
    '<span class="cld-water-outlet-faucet' +
    (mod ? ' ' + mod : '') +
    '" aria-hidden="true">' +
    FAUCET_SVG +
    '</span>'
  );
}

function ensureBanner() {
  let el = document.getElementById('cld-water-outlet-banner');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'cld-water-outlet-banner';
  el.className = 'cld-water-outlet-banner';
  el.hidden = true;
  el.innerHTML =
    '<div class="cld-water-outlet-banner__text">' +
    '<strong>Разместите вывод воды</strong>' +
    '<p>Выберите стену, на которой у вас расположен вывод воды, чтобы определить расположение раковины</p>' +
    '</div>' +
    '<div class="cld-water-outlet-banner__actions">' +
    '<button type="button" class="cld-water-outlet-banner__cancel" data-water-act="cancel">Отмена</button>' +
    '<button type="button" class="cld-water-outlet-banner__ok" data-water-act="ok">OK</button>' +
    '</div>';
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-water-act]');
    if (!btn) return;
    const act = btn.getAttribute('data-water-act');
    if (act === 'cancel') {
      exitKitchenWaterOutletMode(false);
      try {
        if (typeof window.__cldSetKitchenRoomMode === 'function') {
          window.__cldSetKitchenRoomMode('shape');
        }
      } catch (_) {}
    } else if (act === 'ok') {
      exitKitchenWaterOutletMode(true);
      try {
        if (typeof window.__cldSetKitchenRoomMode === 'function') {
          window.__cldSetKitchenRoomMode('shape');
        }
      } catch (_) {}
    }
  });
  document.body.appendChild(el);
  return el;
}

function ensureLayer() {
  const box = window.sceneIconsContainer;
  if (!box) return null;
  let layer = document.getElementById('cld-water-outlet-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'cld-water-outlet-layer';
    layer.className = 'cld-water-outlet-layer';
    layer.innerHTML =
      '<svg class="cld-water-outlet-svg" id="cld-water-outlet-svg" aria-hidden="true"></svg>' +
      '<div class="cld-water-outlet-marks" id="cld-water-outlet-marks"></div>' +
      '<div class="cld-water-outlet-perm" id="cld-water-outlet-perm" hidden></div>';
    box.appendChild(layer);
  }
  return layer;
}

function ensureToolbarBtn() {
  // Кнопка «Вывод воды» только во вкладках правой панели
  const bar = document.getElementById('cld-kitchen-plan-toolbar');
  if (bar) {
    const btn = bar.querySelector('[data-plan-menu="water"]');
    if (btn) btn.remove();
  }
  return null;
}

function placeEl(el, scr) {
  if (!el || !scr) {
    if (el) el.style.display = 'none';
    return;
  }
  el.style.display = '';
  el.style.left = Math.round(scr.x) + 'px';
  el.style.top = Math.round(scr.y) + 'px';
}

function refreshUi() {
  const layer = ensureLayer();
  const room = state.room;
  if (!layer || !room) return;

  const svg = document.getElementById('cld-water-outlet-svg');
  const marks = document.getElementById('cld-water-outlet-marks');
  const perm = document.getElementById('cld-water-outlet-perm');
  if (svg) svg.replaceChildren();

  const walls = listSolidWalls(room);
  const showPicker = active && isTopView2d();

  // постоянный краник после ОК
  const confirmed = getOutlet();
  if (perm) {
    if (confirmed && confirmed.wallName && !active) {
      const len = wallLengthMm(room, confirmed.wallName);
      const along = Number.isFinite(confirmed.alongMm) ? confirmed.alongMm : len / 2;
      const pose = wallPose(room, confirmed.wallName, along, 28);
      const scr = projectToScreen(worldPoint(pose.x, pose.z, 12));
      perm.hidden = false;
      perm.innerHTML = faucetIconHtml('is-permanent');
      placeEl(perm, scr);
    } else {
      perm.hidden = true;
      perm.style.display = 'none';
    }
  }

  if (!showPicker) {
    if (marks) marks.replaceChildren();
    if (svg) svg.style.display = 'none';
    return;
  }
  if (svg) svg.style.display = 'block';

  // подсветка выбранной стены
  const paintWall = pendingWall || null;
  if (paintWall && svg) {
    const ends = wallEnds(room, paintWall, 8);
    const s1 = projectToScreen(worldPoint(ends.a.x, ends.a.z, 10));
    const s2 = projectToScreen(worldPoint(ends.b.x, ends.b.z, 10));
    if (s1 && s2) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(s1.x));
      line.setAttribute('y1', String(s1.y));
      line.setAttribute('x2', String(s2.x));
      line.setAttribute('y2', String(s2.y));
      line.setAttribute('stroke', '#4a90d9');
      line.setAttribute('stroke-width', '18');
      line.setAttribute('stroke-linecap', 'butt');
      line.setAttribute('opacity', '0.95');
      svg.appendChild(line);
    }
  }

  if (!marks) return;
  // круги на серединах стен
  const keep = new Set();
  walls.forEach((wallName) => {
    const len = wallLengthMm(room, wallName);
    const along = len / 2;
    const pose = wallPose(room, wallName, along, 28);
    const scr = projectToScreen(worldPoint(pose.x, pose.z, 12));
    if (!scr) return;
    keep.add(wallName);
    let el = marks.querySelector('[data-water-wall="' + wallName + '"]');
    if (!el) {
      el = document.createElement('button');
      el.type = 'button';
      el.className = 'cld-water-outlet-mark';
      el.setAttribute('data-water-wall', wallName);
      el.setAttribute('aria-label', 'Вывод воды на стене');
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!active) return;
        pendingWall = wallName;
        hoverWall = wallName;
        refreshUi();
      });
      marks.appendChild(el);
    }
    const selected = pendingWall === wallName;
    const hovered = hoverWall === wallName && !selected;
    el.classList.toggle('is-selected', selected);
    el.classList.toggle('is-hover', hovered);
    if (selected || hovered) {
      el.innerHTML = faucetIconHtml(selected ? 'is-on-wall' : 'is-hover');
    } else {
      el.innerHTML = '';
    }
    placeEl(el, scr);
  });
  marks.querySelectorAll('[data-water-wall]').forEach((el) => {
    if (!keep.has(el.getAttribute('data-water-wall'))) el.remove();
  });
}

function hitWallAt(clientX, clientY) {
  const room = state.room;
  const marks = document.getElementById('cld-water-outlet-marks');
  if (!room || !marks) return null;
  const box = window.sceneIconsContainer;
  if (!box) return null;
  const rect = box.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  let best = null;
  let bestD = HIT_PX;
  marks.querySelectorAll('[data-water-wall]').forEach((el) => {
    const left = parseFloat(el.style.left) || 0;
    const top = parseFloat(el.style.top) || 0;
    const d = Math.hypot(mx - left, my - top);
    if (d <= bestD) {
      bestD = d;
      best = el.getAttribute('data-water-wall');
    }
  });
  if (best) return best;

  // запас: ближайшая стена по лучу на пол
  if (!state.raycaster || !state.camera || !state.mouse) return null;
  updateMousePosition({ clientX, clientY });
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  if (room.group) {
    const n = new THREE.Vector3(0, 1, 0).transformDirection(room.group.matrixWorld);
    const o = new THREE.Vector3(0, 0, 0);
    room.group.localToWorld(o);
    plane.setFromNormalAndCoplanarPoint(n, o);
  }
  const hit = new THREE.Vector3();
  if (!state.raycaster.ray.intersectPlane(plane, hit)) return null;
  if (room.group) room.group.worldToLocal(hit);
  const x = hit.x;
  const z = hit.z;
  let wallBest = null;
  let distBest = 120;
  listSolidWalls(room).forEach((wallName) => {
    const side = wallCardinal(room, wallName);
    let d = Infinity;
    if (side === 'back') d = Math.abs(z - 0);
    else if (side === 'front') d = Math.abs(z - room.depth);
    else if (side === 'left') d = Math.abs(x - 0);
    else if (side === 'right') d = Math.abs(x - room.width);
    if (d < distBest) {
      distBest = d;
      wallBest = wallName;
    }
  });
  return wallBest;
}

function onPointerMove(e) {
  if (!active) return;
  const w = hitWallAt(e.clientX, e.clientY);
  if (w !== hoverWall) {
    hoverWall = w;
    refreshUi();
  }
}

function onPointerDown(e) {
  if (!active || e.button !== 0) return;
  if (e.target.closest('#cld-water-outlet-banner')) return;
  if (e.target.closest('.cld-kitchen-plan-toolbar')) return;
  if (e.target.closest('.cld-room-edit-viewbar')) return;
  const w = hitWallAt(e.clientX, e.clientY);
  if (!w) return;
  e.preventDefault();
  e.stopPropagation();
  pendingWall = w;
  hoverWall = w;
  refreshUi();
}

function startLoop() {
  if (raf) return;
  const tick = () => {
    raf = 0;
    refreshUi();
    if (active || getOutlet()) {
      raf = requestAnimationFrame(tick);
    }
  };
  raf = requestAnimationFrame(tick);
}

function stopLoopIfIdle() {
  if (active || getOutlet()) {
    startLoop();
    return;
  }
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

export function enterKitchenWaterOutletMode() {
  if (!state.room) return;
  active = true;
  pendingWall = (getOutlet() && getOutlet().wallName) || null;
  hoverWall = null;
  document.body.classList.add('cld-water-outlet-mode');
  const banner = ensureBanner();
  banner.hidden = false;
  ensureLayer();
  prevView = window.__cldRoomEditView;
  if (typeof window.__cldSetRoomEditViewMode === 'function' && !isTopView2d()) {
    window.__cldSetRoomEditViewMode('2d');
  }
  startLoop();
  refreshUi();
}

export function exitKitchenWaterOutletMode(commit) {
  if (!active && commit == null) return;
  if (commit && pendingWall && state.room) {
    const len = wallLengthMm(state.room, pendingWall);
    setOutlet({ wallName: pendingWall, alongMm: len / 2 });
  }
  // commit === false → отмена, confirmed не трогаем
  active = false;
  pendingWall = null;
  hoverWall = null;
  document.body.classList.remove('cld-water-outlet-mode');
  const banner = document.getElementById('cld-water-outlet-banner');
  if (banner) banner.hidden = true;
  prevView = null;
  refreshUi();
  stopLoopIfIdle();
}

export function mountKitchenWaterOutlet() {
  ensureToolbarBtn();
  ensureLayer();
  if (!bound) {
    bound = true;
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerdown', onPointerDown, true);
  }
  startLoop();
  refreshUi();
}

export function unmountKitchenWaterOutlet() {
  exitKitchenWaterOutletMode(false);
  if (bound) {
    bound = false;
    document.removeEventListener('pointermove', onPointerMove, true);
    document.removeEventListener('pointerdown', onPointerDown, true);
  }
  const banner = document.getElementById('cld-water-outlet-banner');
  if (banner) banner.hidden = true;
  const layer = document.getElementById('cld-water-outlet-layer');
  if (layer) layer.remove();
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

if (typeof window !== 'undefined') {
  window.__cldEnterKitchenWaterOutletMode = enterKitchenWaterOutletMode;
  window.__cldExitKitchenWaterOutletMode = exitKitchenWaterOutletMode;
  window.__cldMountKitchenWaterOutlet = mountKitchenWaterOutlet;
}
