/**
 * Просмотр сеток BASE / MID / TOP (sectionData.kitchenBandGrids).
 * Только отображение — не меняет place, division, мебель и структуру сеток.
 *
 * Важно: enabled/band хранятся в state (общий), не в замыкании модуля —
 * иначе Vite/двойной import даёт два экземпляра и Save «не обновляет» подсветку.
 */
import { state } from '../utils/state.js';
import * as THREE from 'three';
import { getWallAxes } from '../utils/wall-coords.js';
import { computeSectionInnerBoundsU } from '../sections/section-edge-trim-insets.js';
import {
  KITCHEN_BAND_IDS,
  ensureKitchenBandZoneGrids,
  getKitchenBandZoneGrid,
  resolveKitchenModuleWidthsMm,
  resolveKitchenBaseCustomZoneWidthsMmForLayout,
  resolveKitchenCornerSpecialWidthMm,
  applyKitchenLFreeArm600SacrificeWidths,
} from './kitchen-section-layout.js?v=20261107-ucorner24';

const LABEL_CLASS = 'kitchen-band-grid-width-label';

/** Обычная ячейка — нейтральный контур. */
const PREVIEW_WIRE = 0x64748b;
const PREVIEW_FILL = 0x94a3b8;
/** MID спец = приставной ВМУ — оранжевый. */
const MID_SPECIAL_WIRE = 0xea580c;
const MID_SPECIAL_FILL = 0xf97316;
/** Посадочная зона НШ1 внутри угла 600×600 (210×350) — зелёная, не шкаф 210. */
const MID_SEAT_WIRE = 0x16a34a;
const MID_SEAT_FILL = 0x22c55e;

function _viewState() {
  if (!state.kitchenBandGridsView || typeof state.kitchenBandGridsView !== 'object') {
    state.kitchenBandGridsView = { enabled: false, band: 'base', labels: true };
  }
  // Подписи мм / «пенал» — по умолчанию вкл.; кнопка «Размеры» гасит.
  if (typeof state.kitchenBandGridsView.labels !== 'boolean') {
    state.kitchenBandGridsView.labels = true;
  }
  return state.kitchenBandGridsView;
}

function _clearLabels() {
  const container =
    typeof window !== 'undefined' ? window.sceneIconsContainer : null;
  if (container) {
    const stale = container.querySelectorAll(`.${LABEL_CLASS}`);
    for (const el of stale) {
      try {
        el.parentNode?.removeChild(el);
      } catch (_) {}
    }
  }
  if (typeof window !== 'undefined') {
    window.__cldKitchenBandGridLabels = [];
  }
}

function _labelsList() {
  if (typeof window === 'undefined') return [];
  if (!Array.isArray(window.__cldKitchenBandGridLabels)) {
    window.__cldKitchenBandGridLabels = [];
  }
  return window.__cldKitchenBandGridLabels;
}

function _makeWidthLabel(text, position3D, colorHex) {
  const vs = _viewState();
  if (!vs.labels) return null;
  const container =
    typeof window !== 'undefined' ? window.sceneIconsContainer : null;
  if (!container || !state?.camera || !position3D) return null;

  const label = document.createElement('div');
  label.className = LABEL_CLASS;
  label.textContent = text;
  label.dataset.kitchenBandGridLabel = '1';
  label.style.cssText = [
    'position:absolute',
    'pointer-events:none',
    'user-select:none',
    'font-size:12px',
    'font-weight:600',
    'color:#0f172a',
    'background:rgba(255,255,255,0.92)',
    'padding:2px 6px',
    'border-radius:4px',
    'white-space:nowrap',
    `border:1px solid #${colorHex}`,
    'z-index:40',
  ].join(';');

  label.userData = { position3D: position3D.clone() };
  container.appendChild(label);

  const vector = position3D.clone().project(state.camera);
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;
  label.style.left = `${vector.x * widthHalf + widthHalf}px`;
  label.style.top = `${-vector.y * heightHalf + heightHalf}px`;
  label.style.transform = 'translate(-50%, -50%)';

  _labelsList().push(label);
  return label;
}

/** Обновить экранные позиции подписей. */
export function updateKitchenBandGridsViewLabels() {
  const vs = _viewState();
  if (!vs.enabled || !vs.labels || !state?.camera) {
    if (!vs.labels) {
      for (const label of _labelsList()) {
        if (label) label.style.display = 'none';
      }
    }
    return;
  }
  const container =
    typeof window !== 'undefined' ? window.sceneIconsContainer : null;
  if (!container) return;
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;
  for (const label of _labelsList()) {
    const p = label?.userData?.position3D;
    if (!p) continue;
    const vector = p.clone().project(state.camera);
    if (vector.z < -1 || vector.z > 1) {
      label.style.display = 'none';
      continue;
    }
    label.style.display = '';
    label.style.left = `${vector.x * widthHalf + widthHalf}px`;
    label.style.top = `${-vector.y * heightHalf + heightHalf}px`;
  }
}

function _bandYSpanMm(bandId) {
  const api =
    typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
  let plinth = 100;
  let bandLow = 720;
  let bandMid = 600;
  let bandHigh = 720;
  let bandTop = 360;
  try {
    if (api && typeof api.getProjectPlinthHeightMm === 'function') {
      const p = Math.round(Number(api.getProjectPlinthHeightMm()) || 0);
      if (p > 0) plinth = p;
    }
    if (api && typeof api.resolveTallKitchenDatumsMm === 'function') {
      const d = api.resolveTallKitchenDatumsMm({});
      if (d && d.ok) {
        if (d.bandLowMm > 0) bandLow = Math.round(d.bandLowMm);
        if (d.bandMidMm > 0) bandMid = Math.round(d.bandMidMm);
        if (d.bandHighMm > 0) bandHigh = Math.round(d.bandHighMm);
        if (d.bandTopMm > 0) bandTop = Math.round(d.bandTopMm);
      }
    }
  } catch (_) {}

  const baseY1 = plinth + bandLow;
  const midY0 = plinth + bandLow + bandMid;
  const midY1 = midY0 + bandHigh;
  const topY0 = midY1;
  const topY1 = topY0 + Math.max(200, bandTop);

  if (bandId === 'base') return { y0: 0, y1: baseY1 };
  if (bandId === 'mid') return { y0: midY0, y1: midY1 };
  return { y0: topY0, y1: topY1 };
}

function _sectionDepthMm(sec, wallName) {
  const size = sec?.size || {};
  if (wallName === 'left' || wallName === 'right') {
    return Math.max(50, Number(size.x) || Number(sec.facadeDepthMm) || 600);
  }
  return Math.max(50, Number(size.z) || Number(sec.facadeDepthMm) || 600);
}

/**
 * Глубины предпросмотра ячеек (шаг 2).
 * BASE: ячейка = столешка (Dwt, обычно 600), не корпус 550 —
 * иначе голубая полоса короче переда корпуса (550+10 rear = 560).
 * MID / TOP ≈ 350.
 */
function _previewCabinetDepthsMm(sec, wallName) {
  const api =
    typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
  let baseD = 0;
  let wallD = 350;
  try {
    if (api && typeof api.getProjectWorktopDepthMm === 'function') {
      const wt = Math.round(Number(api.getProjectWorktopDepthMm()) || 0);
      if (wt > 0) baseD = wt;
    }
    if (!(baseD > 0) && api && typeof api.getProjectBaseCarcassDepthMm === 'function') {
      const d = Math.round(Number(api.getProjectBaseCarcassDepthMm()) || 0);
      // корпус + задний min 10 → перед корпуса от стены
      if (d > 0) baseD = d + 10;
    }
    if (api && typeof api.getProfile === 'function') {
      const p = api.getProfile();
      const wd = Math.round(Number(p?.wall?.carcassDepthMm?.value) || 0);
      if (wd > 0) wallD = wd;
    }
  } catch (_) {}
  if (!(baseD > 0)) {
    baseD = Math.min(600, _sectionDepthMm(sec, wallName) || 600);
  }
  if (!(wallD > 0)) wallD = 350;
  return { baseD, wallD, tallD: baseD };
}

function _removeBandCellsFromSection(sec) {
  const g = sec?.group;
  if (!g) return;
  const toRemove = [];
  g.traverse((o) => {
    if (o?.userData?.isKitchenBandGridCell) toRemove.push(o);
  });
  for (const o of toRemove) {
    o.parent?.remove(o);
    o.traverse?.((ch) => {
      if (ch.geometry) ch.geometry.dispose?.();
      if (ch.material) {
        if (Array.isArray(ch.material)) ch.material.forEach((m) => m.dispose?.());
        else ch.material.dispose?.();
      }
    });
  }
}

function _composePreviewFlags(sec) {
  const p = sec && sec._straightComposePreview;
  if (!p || typeof p !== 'object') return { tallLeft: false, tallRight: false };
  return {
    tallLeft: !!p.tallLeft,
    tallRight: !!p.tallRight,
  };
}

function _addPreviewBox(parent, boxW, boxH, boxD, ox, oy, oz, colors) {
  const wireCol =
    colors && Number.isFinite(Number(colors.wire))
      ? Number(colors.wire)
      : PREVIEW_WIRE;
  const fillCol =
    colors && Number.isFinite(Number(colors.fill))
      ? Number(colors.fill)
      : PREVIEW_FILL;
  const fillOp =
    colors && Number.isFinite(Number(colors.fillOpacity))
      ? Number(colors.fillOpacity)
      : 0.08;
  const boxGeom = new THREE.BoxGeometry(boxW, boxH, boxD);
  const edges = new THREE.EdgesGeometry(boxGeom);
  const lineMat = new THREE.LineBasicMaterial({
    color: wireCol,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
  });
  const wire = new THREE.LineSegments(edges, lineMat);
  wire.position.set(ox + boxW / 2, oy + boxH / 2, oz + boxD / 2);
  wire.renderOrder = 999;
  const fillMat = new THREE.MeshBasicMaterial({
    color: fillCol,
    transparent: true,
    opacity: fillOp,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });
  const fillMesh = new THREE.Mesh(boxGeom, fillMat);
  fillMesh.position.copy(wire.position);
  fillMesh.renderOrder = 998;
  parent.add(wire);
  parent.add(fillMesh);
  return wire;
}

function _specialCornerAtStart(sec, specialZi, bandId) {
  // MID: atStart верхней приставки (upper reserves), не низа.
  if (bandId === 'mid') {
    const bag = sec?._kitchenJointUpperReserves;
    if (bag && typeof bag === 'object') {
      for (const r of Object.values(bag)) {
        if (r && r.isHost === true && typeof r.atStart === 'boolean') {
          return r.atStart === true;
        }
      }
    }
  }
  const hostAt = sec?.division?.kitchenCornerHostAtStart;
  if (typeof hostAt === 'boolean') return hostAt === true;
  const hand = sec?.lShape?.kitchenCornerHostHand;
  if (hand === 'left') return true;
  if (hand === 'right') return false;
  return Math.floor(Number(specialZi) || 0) === 0;
}

/** Глубина ячейки (=столешка). Не корпус: иначе дырка ~40 на передней фаске. */
function _worktopDepthMm(fallback) {
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (api && typeof api.getProjectWorktopDepthMm === 'function') {
      const wt = Math.round(Number(api.getProjectWorktopDepthMm()) || 0);
      if (wt >= 300) return wt;
    }
  } catch (_) {}
  const fb = Math.round(Number(fallback) || 0);
  return fb >= 300 ? fb : 600;
}

/**
 * Угловая спец-ячейка:
 * BASE — W≈1050 × Dwt≈600 (угловой низ);
 * MID/TOP (навес) — под 600×600, глубина = навес из настроек кухни.
 */
function _buildCornerGCellOnSection(
  sec,
  bandId,
  zoneIndex,
  startU,
  widthMm,
  y0,
  y1,
  opts = {}
) {
  const wallName = sec.wallName || sec.division?.wallName || 'back';
  const axes = getWallAxes(wallName);
  const host = sec.group;
  if (!host) return null;
  const sectionPos = host.position;
  const isBase = bandId === 'base';
  const h = Math.max(10, y1 - y0);
  const fromGrid = Math.round(Number(widthMm) || 0);

  let drawW;
  let depth;
  if (isBase) {
    // Низ: спец 1050 × столешка 600.
    let specialCanon = 1050;
    try {
      specialCanon = Math.round(
        Number(resolveKitchenCornerSpecialWidthMm()) || 1050
      );
    } catch (_) {}
    drawW = fromGrid >= 900 ? fromGrid : Math.max(fromGrid, specialCanon);
    depth = Math.max(
      50,
      Math.round(
        Number(opts.depthMm) ||
          _worktopDepthMm(_sectionDepthMm(sec, wallName))
      )
    );
  } else {
    // Навес: 600 вдоль × глубина из профиля (opts.depthMm = wallD).
    drawW = 600;
    depth = Math.max(50, Math.round(Number(opts.depthMm) || 350));

  }

  const isAlongX = axes.u.axis === 'x';
  const wSign = axes.w.sign >= 0 ? 1 : -1;

  let localX;
  let localZ;
  if (isAlongX) {
    localX = startU - sectionPos.x;
    localZ = wSign > 0 ? 0 : -depth;
  } else {
    localZ = startU - sectionPos.z;
    localX = wSign > 0 ? 0 : -depth;
  }

  const cellGroup = new THREE.Group();
  cellGroup.name = `BandCellCornerG_${bandId}_${sec.id}_${zoneIndex}`;
  cellGroup.userData.isKitchenBandGridCell = true;
  cellGroup.userData.isKitchenCornerGCell = true;
  cellGroup.userData.bandId = bandId;
  cellGroup.userData.zoneIndex = zoneIndex;
  cellGroup.userData.sectionId = sec.id;
  cellGroup.userData.widthMm = Math.round(drawW);
  cellGroup.userData.depthMm = depth;

  const seatRole = String(opts.seatRole || 'A').toUpperCase() === 'B' ? 'B' : 'A';
  const isMidSpecial = !isBase && bandId === 'mid';
  const colors = isMidSpecial
    ? {
        wire: MID_SPECIAL_WIRE,
        fill: MID_SPECIAL_FILL,
        fillOpacity: 0.28,
      }
    : bandId === 'base'
      ? { wire: 0x16a34a, fill: 0x22c55e, fillOpacity: 0.12 }
      : null;

  const atStart = opts.atStart === true;
  // MID G: A — только оранжевый ВМУ (без зелёного return — иначе дубль с seat B).
  // B — нога 600 + одна зелёная посадка от seatStart вдоль стены.
  const postMm = Math.max(0, Math.round(Number(opts.postMm) || 40));
  const seatMm = isMidSpecial
    ? Math.max(
        50,
        Math.round(Number(opts.seatMm) || Math.max(0, drawW - depth - postMm))
      )
    : 0;
  const seatStartMm = Math.max(
    0,
    Math.round(Number(opts.seatStartMm) || depth + postMm)
  );
  const seatColors = {
    wire: MID_SEAT_WIRE,
    fill: MID_SEAT_FILL,
    fillOpacity: 0.28,
  };

  if (isMidSpecial && seatRole === 'B') {
    // Seat B: контур ноги 600 + одна зелёная посадка вдоль U с seatStart.
    if (isAlongX) {
      _addPreviewBox(cellGroup, drawW, h, depth, 0, 0, 0, colors);
      if (seatMm > 0) {
        const ox = atStart ? seatStartMm : drawW - seatStartMm - seatMm;
        _addPreviewBox(cellGroup, seatMm, h, depth, ox, 0, 0, seatColors);
      }
    } else {
      _addPreviewBox(cellGroup, depth, h, drawW, 0, 0, 0, colors);
      if (seatMm > 0) {
        const oz = atStart ? seatStartMm : drawW - seatStartMm - seatMm;
        _addPreviewBox(cellGroup, depth, h, seatMm, 0, 0, oz, seatColors);
      }
    }
  } else if (isAlongX) {
    // BASE: основной объём.
    _addPreviewBox(cellGroup, drawW, h, depth, 0, 0, 0, colors);
  } else {
    _addPreviewBox(cellGroup, depth, h, drawW, 0, 0, 0, colors);
  }

  cellGroup.position.set(localX, y0, localZ);
  host.add(cellGroup);

  cellGroup.updateMatrixWorld(true);
  const labelWorld = new THREE.Vector3();
  const wire =
    cellGroup.children.find((c) => c.isLineSegments) || cellGroup.children[0];
  if (wire) wire.getWorldPosition(labelWorld);
  else cellGroup.getWorldPosition(labelWorld);
  labelWorld.addScaledVector(axes.wDir, 50);
  labelWorld.y = y0 + h * 0.55;
  const labelHex = isMidSpecial
    ? seatRole === 'B'
      ? '16a34a'
      : 'ea580c'
    : isBase
      ? '16a34a'
      : '64748b';
  const labelTxt = isMidSpecial
    ? seatRole === 'B'
      ? `НШ1 seat ${Math.round(seatStartMm)}`
      : `ВМУ ${Math.round(drawW)}×${Math.round(depth)}+${Math.round(postMm)}`
    : `${Math.round(drawW)} мм`;
  _makeWidthLabel(labelTxt, labelWorld, labelHex);

  // Подпись посадки — только у seat B (единственная зелёная зона).
  if (isMidSpecial && seatRole === 'B' && seatMm > 0) {
    const seatLabel = new THREE.Vector3();
    cellGroup.getWorldPosition(seatLabel);
    if (isAlongX) {
      const ox = atStart
        ? seatStartMm + seatMm / 2
        : drawW - seatStartMm - seatMm / 2;
      seatLabel.x += ox;
      seatLabel.z += (wSign > 0 ? 1 : -1) * (depth / 2);
    } else {
      const oz = atStart
        ? seatStartMm + seatMm / 2
        : drawW - seatStartMm - seatMm / 2;
      seatLabel.z += oz;
      seatLabel.x += (wSign > 0 ? 1 : -1) * (depth / 2);
    }
    seatLabel.y = y0 + h * 0.55;
    _makeWidthLabel(`посадка ${Math.round(seatMm)}`, seatLabel, '16a34a');
  }

  return cellGroup;
}

function _buildCellOnSection(sec, bandId, zoneIndex, startU, widthMm, y0, y1, opts = {}) {
  const wallName = sec.wallName || sec.division?.wallName || 'back';
  const axes = getWallAxes(wallName);
  const host = sec.group;
  if (!host) return null;
  const sectionPos = host.position;
  const depth = Math.max(
    50,
    Math.round(Number(opts.depthMm) || _sectionDepthMm(sec, wallName))
  );
  const h = Math.max(10, y1 - y0);
  const w = Math.max(10, widthMm);
  const isAlongX = axes.u.axis === 'x';
  const isTallPreview = !!opts.isTallPreview;

  let boxW;
  let boxD;
  let localX;
  let localZ;
  if (isAlongX) {
    boxW = w;
    boxD = depth;
    localX = startU - sectionPos.x;
    localZ = axes.w.sign > 0 ? 0 : -depth;
  } else {
    boxW = depth;
    boxD = w;
    localZ = startU - sectionPos.z;
    localX = axes.w.sign > 0 ? 0 : -depth;
  }

  const cellGroup = new THREE.Group();
  cellGroup.name = `BandCell_${bandId}_${sec.id}_${zoneIndex}`;
  cellGroup.userData.isKitchenBandGridCell = true;
  cellGroup.userData.bandId = bandId;
  cellGroup.userData.zoneIndex = zoneIndex;
  cellGroup.userData.sectionId = sec.id;
  cellGroup.userData.widthMm = Math.round(widthMm);
  cellGroup.userData.depthMm = depth;
  cellGroup.userData.isTallComposePreview = isTallPreview;

  const colors = opts.colors || null;
  _addPreviewBox(cellGroup, boxW, h, boxD, 0, 0, 0, colors);
  cellGroup.position.set(localX, y0, localZ);
  host.add(cellGroup);

  cellGroup.updateMatrixWorld(true);
  const labelWorld = new THREE.Vector3();
  const wire = cellGroup.children.find((c) => c.isLineSegments) || cellGroup.children[0];
  if (wire) wire.getWorldPosition(labelWorld);
  else cellGroup.getWorldPosition(labelWorld);
  labelWorld.addScaledVector(axes.wDir, 50);
  labelWorld.y = y0 + h * 0.55;

  const labelPrefix = isTallPreview
    ? 'пенал · '
    : opts.nsh1Neighbor
      ? 'НШ1 · '
      : '';
  const labelHex = opts.nsh1Neighbor ? '2563eb' : '64748b';
  _makeWidthLabel(
    `${labelPrefix}${Math.round(widthMm)} мм`,
    labelWorld,
    labelHex
  );

  return cellGroup;
}

function _drawSectionBand(sec, bandId) {
  if (!sec?.group || !sec.division) return;
  ensureKitchenBandZoneGrids(sec);
  const grid = getKitchenBandZoneGrid(sec, bandId);
  if (!grid) return;

  let inner;
  try {
    inner = computeSectionInnerBoundsU(sec);
  } catch (_) {
    return;
  }
  const avail = Math.max(0, Number(inner?.innerWidthU) || 0);
  if (!(avail > 10)) return;

  const parts = Math.max(0, Math.floor(Number(grid.parts) || 0));
  if (parts <= 0) return;

  // BASE: те же ширины, что place (layout helper).
  let custom = grid.customZoneWidthsMm;
  if (bandId === 'base') {
    try {
      const fromLayout = resolveKitchenBaseCustomZoneWidthsMmForLayout(sec);
      if (fromLayout && typeof fromLayout === 'object') custom = fromLayout;
    } catch (_) {}
  }

  const widths = resolveKitchenModuleWidthsMm({
    parts,
    sectionWidth: avail,
    customZoneWidthsMm: custom,
    minModuleW: 300,
  });
  if (!widths.length) return;

  const compose = _composePreviewFlags(sec);
  const baseY = _bandYSpanMm(bandId);
  const tallY = _bandYSpanMm('mid'); // верх пенала = верх НШ1 (навеса)
  const wallName = sec.wallName || sec.division?.wallName || 'back';
  const depths = _previewCabinetDepthsMm(sec, wallName);

  console.log('[BAND-GRIDS-VIEW] draw', {
    sectionId: sec.id,
    bandId,
    parts,
    custom: custom && typeof custom === 'object' ? { ...custom } : null,
    widths: widths.map((w) => Math.round(w)),
    avail: Math.round(avail),
    compose,
    depths,
  });

  // L BASE: не рисовать «чужой» конец joint внутри 1050 низа.
  const skipZi = new Set();
  if (sec.lShape && bandId === 'base') {
    const reserves = sec._kitchenJointReserves;
    if (reserves && typeof reserves === 'object') {
      const leftZi = 0;
      const rightZi = Math.max(0, parts - 1);
      for (const r of Object.values(reserves)) {
        if (!r || r.isHost === true) continue;
        if (r.atStart === true) skipZi.add(leftZi);
        if (r.atStart === false) skipZi.add(rightZi);
      }
    }
  }

  let specialZi = null;
  // BASE: НМУ. MID: seat A приставной (special 600). Seat B пока нет.
  const gridSpecial = Math.floor(Number(grid.specialZoneIndex));
  if (
    (bandId === 'base' || bandId === 'mid') &&
    Number.isFinite(gridSpecial) &&
    gridSpecial >= 0
  ) {
    specialZi = gridSpecial;
  } else if (sec.lShape && bandId === 'base') {
    try {
      if (typeof window.__cldGetLShapeSpecialZoneIndex === 'function') {
        const sz = window.__cldGetLShapeSpecialZoneIndex(sec);
        if (sz != null && Number.isFinite(Number(sz))) {
          specialZi = Math.floor(Number(sz));
        }
      }
    } catch (_) {}
  }

  // L: только угловая + по одной соседней с боку; остальные скрыть.
  const keepZi = new Set();
  let filterKeep = false;
  if (sec.lShape && parts > 0) {
    filterKeep = true;
    if (specialZi != null && specialZi >= 0) {
      keepZi.add(specialZi);
      if (parts > 1) {
        if (specialZi <= 0) keepZi.add(1);
        else if (specialZi >= parts - 1) keepZi.add(parts - 2);
      }
    }
    // Чужое плечо без special: одна ячейка у стыка.
    if (keepZi.size === 0) {
      for (const s of skipZi) {
        if (s <= 0 && parts > 1) keepZi.add(1);
        if (s >= parts - 1 && parts > 1) keepZi.add(parts - 2);
      }
    }
    if (keepZi.size === 0) {
      // Joint atStart на этом плече — крайняя ячейка у угла.
      const bag =
        bandId === 'base'
          ? sec._kitchenJointReserves
          : sec._kitchenJointUpperReserves || sec._kitchenJointReserves;
      if (bag && typeof bag === 'object') {
        for (const r of Object.values(bag)) {
          if (!r || typeof r.atStart !== 'boolean') continue;
          if (r.atStart === true) keepZi.add(0);
          else if (parts > 0) keepZi.add(parts - 1);
          break;
        }
      }
    }
  }

  let u = Number(inner.innerStartU) || 0;
  for (let zi = 0; zi < parts; zi++) {
    const ww = Math.max(0, Number(widths[zi]) || 0);
    if (skipZi.has(zi)) {
      u += ww;
      continue;
    }
    if (filterKeep && keepZi.size > 0 && !keepZi.has(zi)) {
      u += ww;
      continue;
    }
    const isTallCol =
      (compose.tallLeft && zi === 0) ||
      (compose.tallRight && zi === parts - 1);
    // Пенал: одна колонка на BASE (пол→верх навеса). MID пропускаем.
    // TOP = антресоль над пеналом (отдельная ячейка, без метки «пенал»).
    if (isTallCol && bandId === 'mid') {
      u += ww;
      continue;
    }
    if (ww > 0) {
      const depthMm = isTallCol
        ? depths.tallD
        : bandId === 'base'
          ? depths.baseD
          : depths.wallD;
      const y0 = isTallCol && bandId === 'base' ? 0 : baseY.y0;
      const y1 = isTallCol && bandId === 'base' ? tallY.y1 : baseY.y1;
      const labelAsTall = isTallCol && bandId === 'base';
      if (specialZi != null && zi === specialZi && bandId === 'base') {
        let specialW = ww;
        try {
          const canon = Math.round(
            Number(resolveKitchenCornerSpecialWidthMm()) || 1050
          );
          if (canon >= 900 && specialW < 900) specialW = canon;
        } catch (_) {}
        const seatMm = Math.round(Number(grid.cornerSeatMm) || 0);
        _buildCornerGCellOnSection(sec, bandId, zi, u, specialW, y0, y1, {
          depthMm,
          atStart: _specialCornerAtStart(sec, specialZi, bandId),
          postMm: 40,
          seatMm: seatMm > 0 ? seatMm : Math.max(50, specialW - depthMm - 40),
          seatRole: 'A',
        });
      } else {
        _buildCellOnSection(sec, bandId, zi, u, ww, y0, y1, {
          isTallPreview: labelAsTall,
          depthMm,
        });
      }
    }
    u += ww;
  }
}

/**
 * Полная перерисовка оверлея по state.kitchenBandGridsView.
 */
export function syncKitchenBandGridsView() {
  _clearLabels();
  const list = Array.isArray(state.customSections) ? state.customSections : [];
  for (const sec of list) {
    _removeBandCellsFromSection(sec);
  }

  const vs = _viewState();
  if (!vs.enabled) {
    console.log('[BAND-GRIDS-VIEW] sync skip (disabled)');
    return;
  }

  const band = vs.band || 'base';
  // L: перед отрисовкой пересобрать mid (карман на боковой стене).
  for (const sec of list) {
    if (!sec?.lShape) continue;
    try {
      applyKitchenLFreeArm600SacrificeWidths(sec);
    } catch (_) {}
  }
  for (const sec of list) {
    try {
      // Предпросмотр компоновки: все три пояса (высоты из resolveTallKitchenDatumsMm).
      // L: при «Ячейки»/base также MID — иначе угол навеса (оранж) не виден.
      let bands;
      if (sec && sec._straightComposePreview) {
        bands = KITCHEN_BAND_IDS;
      } else if (sec?.lShape && (band === 'base' || !band)) {
        bands = ['base', 'mid'];
      } else {
        bands = [band];
      }
      for (const b of bands) {
        _drawSectionBand(sec, b);
      }
    } catch (e) {
      console.warn('[BAND-GRIDS-VIEW] draw', e);
    }
  }
}

export function isKitchenBandGridsViewEnabled() {
  return !!_viewState().enabled;
}

export function getKitchenBandGridsViewBand() {
  return _viewState().band || 'base';
}

export function setKitchenBandGridsViewEnabled(on) {
  const vs = _viewState();
  vs.enabled = !!on;
  if (!vs.enabled) {
    syncKitchenBandGridsView();
    return false;
  }
  if (!KITCHEN_BAND_IDS.includes(vs.band)) vs.band = 'base';
  syncKitchenBandGridsView();
  return true;
}

export function setKitchenBandGridsViewBand(bandId) {
  const b = String(bandId || '')
    .trim()
    .toLowerCase();
  const vs = _viewState();
  if (b !== 'base' && b !== 'mid' && b !== 'top') return vs.band;
  vs.band = b;
  if (vs.enabled) syncKitchenBandGridsView();
  return vs.band;
}

export function getKitchenBandGridsViewState() {
  const vs = _viewState();
  return {
    enabled: !!vs.enabled,
    band: vs.band || 'base',
    labels: vs.labels !== false,
  };
}

/** Вкл/выкл подписи мм / «пенал» (контуры ячеек не трогает). Default: вкл. */
export function setKitchenBandGridsViewLabelsVisible(on) {
  const vs = _viewState();
  vs.labels = !!on;
  if (vs.enabled) syncKitchenBandGridsView();
  else _clearLabels();
  return !!vs.labels;
}

export function isKitchenBandGridsViewLabelsVisible() {
  return _viewState().labels !== false;
}

try {
  if (typeof window !== 'undefined') {
    window.__cldSyncKitchenBandGridsView = syncKitchenBandGridsView;
    window.__cldSetKitchenBandGridsViewEnabled = setKitchenBandGridsViewEnabled;
    window.__cldSetKitchenBandGridsViewBand = setKitchenBandGridsViewBand;
    window.__cldGetKitchenBandGridsViewState = getKitchenBandGridsViewState;
    window.__cldUpdateKitchenBandGridsViewLabels = updateKitchenBandGridsViewLabels;
    window.__cldSetKitchenBandGridsViewLabelsVisible =
      setKitchenBandGridsViewLabelsVisible;
    window.__cldIsKitchenBandGridsViewLabelsVisible =
      isKitchenBandGridsViewLabelsVisible;
  }
} catch (_) {}
