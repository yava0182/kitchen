// Размерные линии в стиле maatkasten: серые линии/стрелки, синие подписи, SVG-оверлей.
import * as THREE from 'three';
import { state } from '../utils/state.js';
import {
  computeDrawerStack,
  resolveDrawerCorpusSpanMm,
} from '../furniture/furniture-drawer-stack.js?v=20260907-shelf-props';

const MAAT_BLUE = '#1a6fc4';
const MAAT_DIM_GRAY = '#9aa3ad';
const SVG_NS = 'http://www.w3.org/2000/svg';
const OFFSET_MM = 58;
const FLOOR_OFFSET_MM = 72;
/** Сегменты ближе к тумбе; общая высота — левее (как в рефе maatkasten). */
const VERT_SEGMENT_TRACK = 1.85;
const VERT_TOTAL_TRACK = 3.5;
const VERT_TOTAL_LABEL_PAD_PX = 26;
const VERT_SEGMENT_LABEL_PAD_PX = 11;
const HORIZ_LABEL_PAD_PX = 14;
const SIDE_PLANK_W_MM = 50;
const SIDE_OVERLAY_W_MM = 16;

window.cldDimensionLineGroups = window.cldDimensionLineGroups || [];
window.cldDimensionLineLabels = window.cldDimensionLineLabels || [];
window.cldDimensionSpecs = window.cldDimensionSpecs || [];

function mm(v) {
  return Number(v) || 0;
}

function formatMaat(mmVal) {
  const v = mmVal / 10;
  return Number.isInteger(v) ? `${v}.0` : v.toFixed(1);
}

function ensureDimSvgLayers(svg) {
  if (!svg) return;
  if (!dimLinesLayer()) {
    const linesG = document.createElementNS(SVG_NS, 'g');
    linesG.id = 'cld-maat-dim-lines';
    svg.appendChild(linesG);
  }
  if (!dimLabelsLayer()) {
    const labelsG = document.createElementNS(SVG_NS, 'g');
    labelsG.id = 'cld-maat-dim-labels';
    svg.appendChild(labelsG);
  }
  [...svg.childNodes].forEach((node) => {
    if (node.nodeName === 'g' && node.id !== 'cld-maat-dim-lines' && node.id !== 'cld-maat-dim-labels') {
      svg.removeChild(node);
    }
  });
}

function ensureDimSvgRoot() {
  if (!window.sceneIconsContainer) return null;
  let svg = document.getElementById('cld-maat-dimension-svg');
  if (!svg) {
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.id = 'cld-maat-dimension-svg';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1002;overflow:hidden';
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
      <marker id="cld-maat-arrow-gray-start" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
        <path d="M6,1 L1,3.5 L6,6 Z" fill="${MAAT_DIM_GRAY}"/>
      </marker>
      <marker id="cld-maat-arrow-gray-end" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M1,1 L6,3.5 L1,6 Z" fill="${MAAT_DIM_GRAY}"/>
      </marker>
    `;
    svg.appendChild(defs);
    window.sceneIconsContainer.appendChild(svg);
  }
  ensureDimSvgLayers(svg);
  return svg;
}

function dimLinesLayer() {
  return document.getElementById('cld-maat-dim-lines');
}

function dimLabelsLayer() {
  return document.getElementById('cld-maat-dim-labels');
}

function styleDimLabelText(text) {
  text.setAttribute('fill', MAAT_BLUE);
  text.setAttribute('font-size', '13');
  text.setAttribute('font-weight', '600');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('font-family', 'system-ui, Segoe UI, Roboto, sans-serif');
  text.setAttribute('stroke', '#fff');
  text.setAttribute('stroke-width', '3');
  text.setAttribute('paint-order', 'stroke fill');
}

function projectToScreen(worldPos) {
  const container = window.sceneIconsContainer;
  if (!container || !state.camera) return null;
  const v = worldPos.clone().project(state.camera);
  const w = container.clientWidth / 2;
  const h = container.clientHeight / 2;
  return {
    x: v.x * w + w,
    y: -v.y * h + h,
    z: v.z,
    visible: v.z <= 1,
  };
}

function addDimensionSpec(spec) {
  window.cldDimensionSpecs.push(spec);
}

/** Нормаль к размерной линии в экранных координатах — наружу от корпуса (2D, не зависит от оси комнаты). */
function screenOutwardNormal2D(spec, o1, o2) {
  const anchor = projectToScreen(spec.p1);
  const midX = (o1.x + o2.x) / 2;
  const midY = (o1.y + o2.y) / 2;
  const dx = o2.x - o1.x;
  const dy = o2.y - o1.y;
  const len = Math.hypot(dx, dy);
  if (!anchor || len < 0.5) return { nx: -1, ny: 0 };
  let nx = -dy / len;
  let ny = dx / len;
  const fx = anchor.x - midX;
  const fy = anchor.y - midY;
  if (nx * fx + ny * fy > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { nx, ny };
}

/** Подпись вертикального размера: сбоку от своей линии в 2D, цифры снизу вверх. */
function verticalLabelPos(spec, o1, o2) {
  const midX = (o1.x + o2.x) / 2;
  const midY = (o1.y + o2.y) / 2;
  const { nx, ny } = screenOutwardNormal2D(spec, o1, o2);
  const pad = spec.bold ? VERT_TOTAL_LABEL_PAD_PX : VERT_SEGMENT_LABEL_PAD_PX;
  return {
    tx: midX + nx * pad,
    ty: midY + ny * pad,
    anchor: 'middle',
  };
}

function drawSvgDimension(spec) {
  const svg = ensureDimSvgRoot();
  if (!svg) return null;

  const p1s = projectToScreen(spec.p1);
  const p2s = projectToScreen(spec.p2);
  if (!p1s || !p2s) return null;
  if (!p1s.visible && !p2s.visible) return null;

  const o1 = projectToScreen(spec.p1.clone().add(spec.offset));
  const o2 = projectToScreen(spec.p2.clone().add(spec.offset));
  if (!o1 || !o2) return null;

  const linesLayer = dimLinesLayer();
  const labelsLayer = dimLabelsLayer();
  if (!linesLayer || !labelsLayer) return null;

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'cld-maat-dim');
  g.dataset.scope = spec.scope || 'all';
  const sw = spec.bold ? '2' : '1.25';
  const useArrows = !spec.dashed && spec.arrows !== false;

  const ln = document.createElementNS(SVG_NS, 'line');
  ln.setAttribute('x1', String(o1.x));
  ln.setAttribute('y1', String(o1.y));
  ln.setAttribute('x2', String(o2.x));
  ln.setAttribute('y2', String(o2.y));
  ln.setAttribute('stroke', spec.dashed ? MAAT_BLUE : MAAT_DIM_GRAY);
  ln.setAttribute('stroke-width', sw);
  if (spec.dashed) ln.setAttribute('stroke-dasharray', '4 5');
  if (useArrows) {
    ln.setAttribute('marker-start', 'url(#cld-maat-arrow-gray-start)');
    ln.setAttribute('marker-end', 'url(#cld-maat-arrow-gray-end)');
  }
  g.appendChild(ln);
  linesLayer.appendChild(g);

  let labelEl = null;
  if (spec.label && !spec.dashed) {
    let tx;
    let ty;
    let anchor = 'middle';
    if (spec.vertical) {
      ({ tx, ty, anchor } = verticalLabelPos(spec, o1, o2));
    } else {
      tx = (o1.x + o2.x) / 2;
      ty = (o1.y + o2.y) / 2 - HORIZ_LABEL_PAD_PX;
    }
    labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', String(tx));
    labelEl.setAttribute('y', String(ty));
    styleDimLabelText(labelEl);
    labelEl.setAttribute('font-size', spec.small ? '11' : '13');
    labelEl.setAttribute('text-anchor', anchor);
    if (spec.vertical) labelEl.setAttribute('transform', `rotate(-90 ${tx} ${ty})`);
    labelEl.textContent = spec.label;
    labelsLayer.appendChild(labelEl);
  }

  const entry = { lineG: g, labelEl, spec };
  g.__cldSpec = spec;
  g.__cldEntry = entry;
  if (labelEl) labelEl.__cldEntry = entry;
  window.cldDimensionLineGroups.push(entry);
  return entry;
}

function updateSvgDimensionEntry(entry, spec) {
  if (!entry || !spec) return;
  const { lineG, labelEl } = entry;

  if (spec.skipLine) {
    const s = projectToScreen(spec.p1);
    const visible = s?.visible;
    if (lineG) lineG.style.display = 'none';
    if (labelEl) {
      labelEl.style.display = visible ? '' : 'none';
      if (visible) {
        labelEl.setAttribute('x', String(s.x));
        labelEl.setAttribute('y', String(s.y));
      }
    }
    return;
  }

  const p1s = projectToScreen(spec.p1);
  const p2s = projectToScreen(spec.p2);
  if (!p1s || !p2s || (!p1s.visible && !p2s.visible)) {
    if (lineG) lineG.style.display = 'none';
    if (labelEl) labelEl.style.display = 'none';
    return;
  }

  const o1 = projectToScreen(spec.p1.clone().add(spec.offset));
  const o2 = projectToScreen(spec.p2.clone().add(spec.offset));
  if (!o1 || !o2) {
    if (lineG) lineG.style.display = 'none';
    if (labelEl) labelEl.style.display = 'none';
    return;
  }

  const depth = (p1s.z + p2s.z) / 2;
  entry.__depth = depth;

  if (lineG) {
    lineG.style.display = '';
    const ln = lineG.querySelector('line');
    if (ln) {
      ln.setAttribute('x1', String(o1.x));
      ln.setAttribute('y1', String(o1.y));
      ln.setAttribute('x2', String(o2.x));
      ln.setAttribute('y2', String(o2.y));
    }
  }

  if (labelEl && spec.label && !spec.dashed) {
    labelEl.style.display = '';
    let tx;
    let ty;
    let anchor = 'middle';
    if (spec.vertical) {
      ({ tx, ty, anchor } = verticalLabelPos(spec, o1, o2));
    } else {
      tx = (o1.x + o2.x) / 2;
      ty = (o1.y + o2.y) / 2 - HORIZ_LABEL_PAD_PX;
    }
    labelEl.setAttribute('x', String(tx));
    labelEl.setAttribute('y', String(ty));
    labelEl.setAttribute('text-anchor', anchor);
    if (spec.vertical) labelEl.setAttribute('transform', `rotate(-90 ${tx} ${ty})`);
    else labelEl.removeAttribute('transform');
  }
}

function sortLabelLayerByDepth() {
  const labelsLayer = dimLabelsLayer();
  if (!labelsLayer) return;
  const labels = [...labelsLayer.childNodes].filter((n) => n.__cldEntry);
  labels.sort((a, b) => (b.__cldEntry.__depth || 0) - (a.__cldEntry.__depth || 0));
  for (const node of labels) labelsLayer.appendChild(node);
}

function drawLabelOnlySpec(spec) {
  const labelsLayer = dimLabelsLayer();
  if (!labelsLayer) return;
  const s = projectToScreen(spec.p1);
  if (!s?.visible) return;
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', String(s.x));
  text.setAttribute('y', String(s.y));
  styleDimLabelText(text);
  text.setAttribute('font-size', spec.small ? '11' : '13');
  text.textContent = spec.label;
  const entry = { lineG: null, labelEl: text, spec, __depth: s.z };
  text.__cldEntry = entry;
  labelsLayer.appendChild(text);
  window.cldDimensionLineGroups.push(entry);
}

function hideLegacyDimensionLabels() {
  const hide = (el) => {
    if (el) el.style.display = 'none';
  };
  (window.roomDimensionLabels || []).forEach(hide);
  (window.furnitureWidthLabels || []).forEach(hide);
  (window.sectionSingleZoneLabels || []).forEach(hide);
  if (state.sectionDimensionLabels) {
    Object.values(state.sectionDimensionLabels).forEach((arr) => arr?.forEach(hide));
  }
  if (state.sectionOffsetLabels) state.sectionOffsetLabels.forEach(hide);
}

function getRoomFloorY() {
  if (!state.room?.group) return 0;
  const p = new THREE.Vector3();
  state.room.group.getWorldPosition(p);
  return p.y;
}

function getSectionWall(sectionId) {
  const sec = (state.customSections || []).find((s) => s.id === sectionId);
  return sec?.wallName || 'back';
}

function detectSideInsets(sectionGroup) {
  let insetMin = 0;
  let insetMax = 0;
  if (!sectionGroup) return { insetMin, insetMax };
  sectionGroup.traverse((obj) => {
    const n = String(obj?.name || '');
    if (n === 'SideOverlayLeft' || n === 'SideOverlayFront') insetMin = SIDE_OVERLAY_W_MM;
    else if (n === 'SidePlankLeft' || n === 'SidePlankFront') insetMin = Math.max(insetMin, SIDE_PLANK_W_MM);
    if (n === 'SideOverlayRight' || n === 'SideOverlayBack') insetMax = SIDE_OVERLAY_W_MM;
    else if (n === 'SidePlankRight' || n === 'SidePlankBack') insetMax = Math.max(insetMax, SIDE_PLANK_W_MM);
  });
  return { insetMin, insetMax };
}

function getSectionLayoutBounds(sectionData) {
  const wallName = sectionData.wallName || 'back';
  const g = sectionData.group;
  const pos = g.position;
  const size = sectionData.size || {};
  const outerW = wallName === 'left' || wallName === 'right' ? mm(size.z) : mm(size.x);
  const depth = wallName === 'left' || wallName === 'right' ? mm(size.x) : mm(size.z);
  const { insetMin, insetMax } = detectSideInsets(g);

  let outerMinU = 0;
  let outerMaxU = 0;
  let facadeCoord = new THREE.Vector3();
  let vertAxis = new THREE.Vector3(-1, 0, 0);

  if (wallName === 'back') {
    outerMinU = pos.x;
    outerMaxU = pos.x + outerW;
    facadeCoord.set(0, 0, pos.z + depth);
    vertAxis.set(-1, 0, 0);
  } else if (wallName === 'front') {
    outerMaxU = pos.x;
    outerMinU = pos.x - outerW;
    facadeCoord.set(0, 0, pos.z);
    vertAxis.set(1, 0, 0);
  } else if (wallName === 'left') {
    outerMaxU = pos.z;
    outerMinU = pos.z - outerW;
    facadeCoord.set(pos.x + depth, 0, 0);
    vertAxis.set(0, 0, 1);
  } else {
    outerMinU = pos.z;
    outerMaxU = pos.z + outerW;
    facadeCoord.set(pos.x, 0, 0);
    vertAxis.set(0, 0, -1);
  }

  return {
    wallName,
    outerMinU,
    outerMaxU,
    innerStartU: outerMinU + insetMin,
    innerEndU: outerMaxU - insetMax,
    insetMin,
    insetMax,
    facadeCoord,
    vertAxis,
    depth,
  };
}

function uAtFacade(u, bounds, floorY) {
  const { wallName, facadeCoord } = bounds;
  if (wallName === 'back') return new THREE.Vector3(u, floorY, facadeCoord.z);
  if (wallName === 'front') return new THREE.Vector3(u, floorY, facadeCoord.z);
  if (wallName === 'left') return new THREE.Vector3(facadeCoord.x, floorY, u);
  return new THREE.Vector3(facadeCoord.x, floorY, u);
}

function floorDimOffset(bounds, tier = 1) {
  const d = FLOOR_OFFSET_MM * tier;
  const { wallName } = bounds;
  if (wallName === 'back') return new THREE.Vector3(0, -d * 0.25, d);
  if (wallName === 'front') return new THREE.Vector3(0, -d * 0.25, -d);
  if (wallName === 'left') return new THREE.Vector3(d, -d * 0.25, 0);
  return new THREE.Vector3(-d, -d * 0.25, 0);
}

function vertDimOffset(bounds, track = 1) {
  const d = OFFSET_MM * track;
  return bounds.vertAxis.clone().multiplyScalar(d);
}

function getVerticalBands(grp, floorY) {
  const bbox = new THREE.Box3().setFromObject(grp);
  const bboxTotalMm = Math.max(0, bbox.max.y - floorY);
  const customH = mm(grp.userData?.customHeightMm);
  const z = grp.userData?.__layoutZones?.zones;
  if (z) {
    const plinthMm = mm(z.plinthMm);
    const carcassMm = mm(z.carcassMm);
    const hTopMm = mm(z.hTopMm);
    const serviceMm = mm(z.serviceMm);
    const totalMm = plinthMm + carcassMm + hTopMm + serviceMm;
    // Tall у окна: зоны могут быть от полного size.y, а мебель — комод.
    // Тогда не рисуем «250» по recipe — берём bbox / customHeight.
    const shortFurniture =
      (customH > 0 && totalMm > customH * 1.25) ||
      (bboxTotalMm > 0 && totalMm > bboxTotalMm * 1.25);
    if (!shortFurniture) {
      return {
        plinthMm,
        carcassMm,
        hTopMm,
        totalMm,
        yBase: floorY,
      };
    }
  }
  const plinthMm = mm(grp.userData?.hBottomMm) || 100;
  const hTopMm = mm(grp.userData?.hTopCatalogMm) || 16;
  const totalMm = customH > 0 ? customH : bboxTotalMm;
  const carcassMm = Math.max(0, totalMm - plinthMm - hTopMm);
  return { plinthMm, carcassMm, hTopMm, totalMm, yBase: floorY };
}

function collectFurnitureInSection(sectionId) {
  const items = [];
  if (!state.scene) return items;
  const wallName = getSectionWall(sectionId);
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (sectionId && obj.userData.sectionId !== sectionId) return;
    const bbox = new THREE.Box3().setFromObject(obj);
    if (bbox.isEmpty()) return;
    items.push({ group: obj, bbox, wallName, sectionId: obj.userData.sectionId });
  });
  if (wallName === 'left' || wallName === 'right') {
    items.sort((a, b) => a.bbox.min.z - b.bbox.min.z);
  } else {
    items.sort((a, b) => a.bbox.min.x - b.bbox.min.x);
  }
  return items;
}

function leftVertAnchor(bbox, bounds) {
  const y = bbox.min.y;
  const z = bbox.max.z;
  if (bounds.wallName === 'back') return new THREE.Vector3(bbox.min.x, y, z);
  if (bounds.wallName === 'front') return new THREE.Vector3(bbox.max.x, y, z);
  if (bounds.wallName === 'left') return new THREE.Vector3(bbox.max.x, y, bbox.max.z);
  return new THREE.Vector3(bbox.min.x, y, bbox.max.z);
}

function addVertSegment(anchor, y1, y2, offset, label, scope) {
  addDimensionSpec({
    p1: anchor.clone().setY(y1),
    p2: anchor.clone().setY(y2),
    offset,
    label,
    scope,
    vertical: true,
    alignLabelsColumn: true,
  });
}

function isUnderHingeAnimatorNode(obj, furnitureRoot) {
  let p = obj;
  while (p && p !== furnitureRoot) {
    if (p.userData?.isAnimator && String(p.userData.animatorId || '').toLowerCase() === 'hinge_animator') {
      return true;
    }
    p = p.parent;
  }
  return false;
}

/** Лицевой фасад ящика (catalog_34 «Элемент 1» или isFacade без петель). */
function findDrawerFacadeNode(drawerGroup, furnitureRoot) {
  let found = null;
  drawerGroup.traverse((child) => {
    if (found || child === drawerGroup) return;
    const nm = String(child.name || '');
    if (/Module_Элемент\s*1/i.test(nm) || /^Module_Элемент/i.test(nm)) {
      found = child;
      return;
    }
    if (child.isGroup && child.userData?.isFacade && !isUnderHingeAnimatorNode(child, furnitureRoot)) {
      found = child;
    }
  });
  return found;
}

function collectDrawerFacadeBandsFromMesh(furnitureGroup) {
  const drawerModules = [];
  furnitureGroup.traverse((obj) => {
    if (obj.isGroup && obj.userData?.layoutRole === 'drawer') {
      drawerModules.push(obj);
    }
  });
  if (!drawerModules.length) return [];

  const bands = [];
  for (const drawerMod of drawerModules) {
    const facadeNode = findDrawerFacadeNode(drawerMod, furnitureGroup) || drawerMod;
    const bbox = computeGroupBBoxNoAo(facadeNode);
    if (bbox.isEmpty()) continue;
    const h = bbox.max.y - bbox.min.y;
    if (h < 5) continue;
    bands.push({ minY: bbox.min.y, maxY: bbox.max.y });
  }
  bands.sort((a, b) => a.minY - b.minY);
  return bands;
}

function collectDrawerFacadeBandsFromPolicy(furnitureGroup, worldBaseY) {
  const policy = furnitureGroup.userData?.drawerStackPolicy;
  if (!policy || policy.enabled === false) return [];

  const sectionY = mm(furnitureGroup.userData?.__initialSectionSizeMm?.y);
  if (sectionY < 1) return [];

  const variables = {
    h_bottom: mm(furnitureGroup.userData?.hBottomMm) || 100,
    h_top: mm(furnitureGroup.userData?.hTopCatalogMm) || 0,
    tech_zone_mm: mm(furnitureGroup.userData?.techZoneMm) || 0,
    _wt: 16,
  };
  const layout = resolveDrawerCorpusSpanMm(sectionY, variables, policy);
  const stack = layout ? computeDrawerStack(layout.span, policy) : null;
  if (!stack || stack.count < 1) return [];

  const oh = Math.max(0, mm(policy.facadeOverhangMm) || 14.5);
  const gap = Math.max(0, mm(policy.gapMm) || 3);
  const drawerH = Math.max(40, Math.round(stack.drawerHeightMm));
  const step = drawerH + 2 * oh + gap;
  const y0Local = mm(layout.pivotBottomMm);
  const n = stack.count;
  const usedSpan = (n - 1) * step + drawerH;
  const slack = Math.max(0, Math.round(layout.span - usedSpan));
  const lastH = drawerH + slack;

  const bands = [];
  for (let i = 0; i < n; i += 1) {
    const h = i === n - 1 ? lastH : drawerH;
    const pivotY = worldBaseY + y0Local + i * step;
    bands.push({
      minY: pivotY - oh,
      maxY: pivotY + h + oh,
    });
  }
  return bands;
}

function collectDrawerFacadeBandsWorldY(furnitureGroup) {
  const fromMesh = collectDrawerFacadeBandsFromMesh(furnitureGroup);
  if (fromMesh.length) return fromMesh;
  const rootBbox = computeGroupBBoxNoAo(furnitureGroup);
  const worldBaseY = rootBbox.isEmpty() ? getRoomFloorY() : rootBbox.min.y;
  return collectDrawerFacadeBandsFromPolicy(furnitureGroup, worldBaseY);
}

function rebuildTumbaVerticalDims(firstItem, bounds, floorY) {
  const anchor = leftVertAnchor(firstItem.bbox, bounds);
  const bands = getVerticalBands(firstItem.group, floorY);
  const y0 = bands.yBase;
  const segmentOffset = vertDimOffset(bounds, VERT_SEGMENT_TRACK);
  let y = y0;

  if (bands.plinthMm > 0) {
    addVertSegment(anchor, y, y + bands.plinthMm, segmentOffset, formatMaat(bands.plinthMm), 'furniture');
    y += bands.plinthMm;
  }

  const carcassTopY = y + bands.carcassMm;
  const drawerBands = collectDrawerFacadeBandsWorldY(firstItem.group);

  if (drawerBands.length > 0 && bands.carcassMm > 0) {
    for (const db of drawerBands) {
      const lo = Math.max(db.minY, y);
      const hi = Math.min(db.maxY, carcassTopY);
      if (hi - lo >= 5) {
        addVertSegment(anchor, lo, hi, segmentOffset, formatMaat(hi - lo), 'furniture');
      }
    }
    y = carcassTopY;
  } else if (bands.carcassMm > 0) {
    addVertSegment(anchor, y, y + bands.carcassMm, segmentOffset, formatMaat(bands.carcassMm), 'furniture');
    y += bands.carcassMm;
  }

  if (bands.hTopMm > 0) {
    addVertSegment(anchor, y, y + bands.hTopMm, segmentOffset, formatMaat(bands.hTopMm), 'furniture');
    y += bands.hTopMm;
  }

  const customH = mm(firstItem.group?.userData?.customHeightMm);
  const topY =
    customH > 0 ? y0 + customH : firstItem.bbox.max.y;
  addDimensionSpec({
    p1: anchor.clone().setY(y0),
    p2: anchor.clone().setY(topY),
    offset: vertDimOffset(bounds, VERT_TOTAL_TRACK),
    label: formatMaat(topY - y0),
    scope: 'furniture',
    vertical: true,
    bold: true,
    alignLabelsColumn: true,
  });
}

function rebuildHorizontalChain(sectionData, bounds, floorY) {
  const cache = sectionData._layoutCache;
  const off1 = floorDimOffset(bounds, 1);
  const off2 = floorDimOffset(bounds, 2.2);

  const addHoriz = (u1, u2, offset, label, opts = {}) => {
    if (Math.abs(u2 - u1) < 1) return;
    addDimensionSpec({
      p1: uAtFacade(u1, bounds, floorY),
      p2: uAtFacade(u2, bounds, floorY),
      offset,
      label,
      scope: 'furniture',
      ...opts,
    });
  };

  if (bounds.insetMin > 0) {
    addHoriz(bounds.outerMinU, bounds.innerStartU, off1, formatMaat(bounds.insetMin));
  }

  const segments = cache?.segments || [];
  for (const seg of segments) {
    const w = seg.endU - seg.startU;
    if (w < 1) continue;
    addHoriz(seg.startU, seg.endU, off1, formatMaat(w));
  }

  if (bounds.insetMax > 0) {
    addHoriz(bounds.innerEndU, bounds.outerMaxU, off1, formatMaat(bounds.insetMax));
  }

  addHoriz(bounds.outerMinU, bounds.outerMaxU, off2, formatMaat(bounds.outerMaxU - bounds.outerMinU), {
    bold: true,
  });
}

function computeGroupBBoxNoAo(root) {
  const out = new THREE.Box3();
  let has = false;
  if (!root) return out;
  root.traverse((obj) => {
    if (!obj?.isMesh) return;
    const ud = obj.userData || {};
    if (ud.isWallAo || ud.isContactShadow) return;
    if (obj.name && (obj.name.includes('PivotMarker') || obj.name.includes('BBox'))) return;
    try {
      const b = new THREE.Box3().setFromObject(obj);
      if (!has) {
        out.copy(b);
        has = true;
      } else {
        out.union(b);
      }
    } catch (_) {}
  });
  if (!has) out.setFromObject(root);
  return out;
}

/**
 * Номинальная глубина для подписи (как «60 см» в карандаше), не bbox с выносом топа.
 * customDepthMm → глубина секции из настроек → bbox.
 */
function resolveModuleDepthDisplayMm(group, sectionDepthMm, isSideWall) {
  const custom = mm(group?.userData?.customDepthMm);
  if (custom > 0) return custom;
  if (sectionDepthMm > 0) return sectionDepthMm;
  const bbox = computeGroupBBoxNoAo(group);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const bboxDepth = isSideWall ? size.x : size.z;
  return bboxDepth > 0 ? bboxDepth : 0;
}

/** Глубина модуля (см) — подпись над тумбой, как в рефе, без префикса «D:». */
function rebuildModuleDepthLabels(furniture, bounds, sectionData) {
  const wall = bounds.wallName || 'back';
  const secSize = sectionData?.size || {};
  const sectionDepthMm =
    wall === 'left' || wall === 'right' ? mm(secSize.x) : mm(secSize.z);
  const isSideWall = wall === 'left' || wall === 'right';

  for (const item of furniture) {
    const { bbox, group } = item;
    const depthMm = resolveModuleDepthDisplayMm(group, sectionDepthMm, isSideWall);
    if (depthMm < 1) continue;

    const labelPos = new THREE.Vector3(
      wall === 'left' || wall === 'right'
        ? wall === 'left'
          ? bbox.max.x
          : bbox.min.x
        : (bbox.min.x + bbox.max.x) / 2,
      bbox.max.y + 28,
      wall === 'back' || wall === 'left'
        ? bbox.max.z
        : bbox.min.z
    );

    addDimensionSpec({
      p1: labelPos,
      p2: labelPos.clone(),
      offset: new THREE.Vector3(),
      label: formatMaat(depthMm),
      scope: 'furniture',
      small: true,
      skipLine: true,
    });
  }
}

function rebuildMaatDimensionSpecs() {
  window.cldDimensionSpecs = [];
  if (!state.scene) return;

  const floorY = getRoomFloorY();
  const sections = (state.customSections || []).filter((s) => s?.group);

  if (!isFurnitureDimensionLinesVisible()) {
    if (isRoomDimensionLinesVisible() && state.room) {
      const rw = mm(state.room.width);
      const rd = mm(state.room.depth);
      const off = 450;
      [
        {
          p1: new THREE.Vector3(-rw / 2, floorY, -rd / 2 - off),
          p2: new THREE.Vector3(rw / 2, floorY, -rd / 2 - off),
          offset: floorDimOffset({ wallName: 'back' }, 1),
          label: formatMaat(rw),
          scope: 'room',
        },
        {
          p1: new THREE.Vector3(-rw / 2 - off, floorY, -rd / 2),
          p2: new THREE.Vector3(-rw / 2 - off, floorY, rd / 2),
          offset: floorDimOffset({ wallName: 'back' }, 1),
          label: formatMaat(rd),
          scope: 'room',
        },
      ].forEach(addDimensionSpec);
    }
    return;
  }

  for (const sectionData of sections) {
    if (typeof window.__clodisComputeSectionLayout === 'function') {
      try {
        window.__clodisComputeSectionLayout(sectionData);
      } catch (_) {}
    }
    const furniture = collectFurnitureInSection(sectionData.id);
    if (!furniture.length) continue;

    const bounds = getSectionLayoutBounds(sectionData);
    rebuildTumbaVerticalDims(furniture[0], bounds, floorY);
    rebuildHorizontalChain(sectionData, bounds, floorY);
    rebuildModuleDepthLabels(furniture, bounds, sectionData);
  }
}

function isSpecVisible(spec) {
  const showSection = isSectionDimensionLinesVisible();
  const showFurniture = isFurnitureDimensionLinesVisible();
  const showRoom = isRoomDimensionLinesVisible();
  const scope = spec.scope;
  if (scope === 'section') return showSection;
  if (scope === 'furniture') return showFurniture;
  if (scope === 'room') return showRoom;
  return showSection || showFurniture || showRoom;
}

function clearDimSvgLayers() {
  const linesLayer = dimLinesLayer();
  const labelsLayer = dimLabelsLayer();
  if (linesLayer) linesLayer.replaceChildren();
  if (labelsLayer) labelsLayer.replaceChildren();
}

function redrawDimensionSvg() {
  if (!ensureDimSvgRoot()) return;

  clearDimSvgLayers();
  window.cldDimensionLineGroups = [];

  for (const spec of window.cldDimensionSpecs) {
    if (!isSpecVisible(spec)) continue;
    if (spec.skipLine) drawLabelOnlySpec(spec);
    else drawSvgDimension(spec);
  }
  sortLabelLayerByDepth();
}

function hingePartKind(obj) {
  const ud = obj.userData || {};
  const name = String(obj.name || '').toLowerCase();
  const hp = String(ud.hingePart || ud.hingeDrillPart || '').toLowerCase();
  if (hp === 'facade') return 'facade';
  if (hp === 'corpus' || hp === 'door') return 'corpus';
  if (name === 'furni_hinge_facade') return 'facade';
  if (name === 'furni_hinge_door') return 'corpus';
  if (/петл.*фасад|накладная.*фасад|фасад.*петл/.test(name) && !/корпус/.test(name)) return 'facade';
  if (/петл.*корпус|накладная.*корпус|корпус.*петл/.test(name)) return 'corpus';
  return '';
}

function isUnderHingeAnimator(obj, furnitureRoot) {
  let p = obj;
  while (p && p !== furnitureRoot) {
    const ud = p.userData || {};
    if (ud.isAnimator && String(ud.animatorId || '').toLowerCase() === 'hinge_animator') return true;
    p = p.parent;
  }
  return false;
}

/** Фасад и фасадная половина петли; корпусная часть петли остаётся видимой. */
function isModuleFacadeOrHingePart(obj, furnitureRoot) {
  if (!obj || obj === furnitureRoot) return false;

  const kind = hingePartKind(obj);
  if (kind === 'corpus') return false;
  if (kind === 'facade') return true;

  let p = obj;
  while (p && p !== furnitureRoot) {
    const ud = p.userData || {};
    if (ud.isFacade === true) return true;
    if (ud.cldDoorSwing || ud.isFacadeMaster === true) return true;
    if (ud.isAnimator && String(ud.animatorId || '').toLowerCase() === 'hinge_animator') return true;
    if (String(p.name || '').toLowerCase() === '__door_swing') return true;
    p = p.parent;
  }

  if (/присадк/i.test(obj.name || '') && isUnderHingeAnimator(obj, furnitureRoot)) return true;

  return false;
}

function applyModuleFacadesHiddenForDims(hidden) {
  if (!state.scene) return;
  state.scene.traverse((root) => {
    if (!root?.isGroup || !root.userData?.isFurniture) return;
    root.traverse((child) => {
      if (child === root) return;
      if (!isModuleFacadeOrHingePart(child, root)) return;
      if (hidden) {
        if (child.userData.__cldDimHiddenPrevVisible === undefined) {
          child.userData.__cldDimHiddenPrevVisible = child.visible;
        }
        child.visible = false;
      } else if (child.userData.__cldDimHiddenPrevVisible !== undefined) {
        child.visible = child.userData.__cldDimHiddenPrevVisible;
        delete child.userData.__cldDimHiddenPrevVisible;
      }
    });
  });
}

/** Скрыть фасады и петли модулей в режиме размеров (кнопка cm). */
export function syncDimensionModeModuleVisibility() {
  applyModuleFacadesHiddenForDims(isFurnitureDimensionLinesVisible());
}

export function clearAllDimensionLines() {
  window.cldDimensionSpecs = [];
  window.cldDimensionLineGroups = [];
  window.cldDimensionLineLabels = [];
  clearDimSvgLayers();
}

export function isSectionDimensionLinesVisible() {
  return window.showAllDimensionLabels === true || window.showSectionDimensionLabels === true;
}

export function isFurnitureDimensionLinesVisible() {
  return window.showAllDimensionLabels === true || window.showFurnitureDimensionLabels === true;
}

export function isRoomDimensionLinesVisible() {
  return window.showAllDimensionLabels === true;
}

export function applyDimensionLinesVisibility() {
  redrawDimensionSvg();
  if (
    isSectionDimensionLinesVisible() ||
    isFurnitureDimensionLinesVisible() ||
    isRoomDimensionLinesVisible()
  ) {
    hideLegacyDimensionLabels();
  }
  syncDimensionModeModuleVisibility();
}

let _rebuildDimLinesTimer = null;

export function scheduleRebuildAllDimensionLines() {
  clearTimeout(_rebuildDimLinesTimer);
  _rebuildDimLinesTimer = setTimeout(() => {
    _rebuildDimLinesTimer = null;
    rebuildAllDimensionLines();
  }, 80);
}

export function rebuildAllDimensionLines() {
  clearAllDimensionLines();
  const anyVisible =
    isSectionDimensionLinesVisible() ||
    isFurnitureDimensionLinesVisible() ||
    isRoomDimensionLinesVisible();
  if (anyVisible) {
    rebuildMaatDimensionSpecs();
    redrawDimensionSvg();
    hideLegacyDimensionLabels();
  }
  syncDimensionModeModuleVisibility();
}

export function updateDimensionLineLabelPositions() {
  if (!window.cldDimensionSpecs?.length) return;
  if (!window.cldDimensionLineGroups?.length) {
    redrawDimensionSvg();
    hideLegacyDimensionLabels();
    return;
  }
  for (const entry of window.cldDimensionLineGroups) {
    const spec = entry.spec || entry.__cldSpec;
    if (!spec || !isSpecVisible(spec)) {
      if (entry.lineG) entry.lineG.style.display = 'none';
      if (entry.labelEl) entry.labelEl.style.display = 'none';
      continue;
    }
    updateSvgDimensionEntry(entry, spec);
  }
  sortLabelLayerByDepth();
}

if (typeof window !== 'undefined') {
  window.rebuildAllDimensionLines = rebuildAllDimensionLines;
  window.scheduleRebuildAllDimensionLines = scheduleRebuildAllDimensionLines;
  window.clearAllDimensionLines = clearAllDimensionLines;
  window.applyDimensionLinesVisibility = applyDimensionLinesVisibility;
  window.updateDimensionLineLabelPositions = updateDimensionLineLabelPositions;
  window.syncDimensionModeModuleVisibility = syncDimensionModeModuleVisibility;
}
