/**
 * Кромки обклада секции (планки/накладки) в комнате — визуал как у фасадов ClodisBuilder:
 * полоски с RoundedBoxGeometry (радиус ≤2 мм на кромке), острый ужатый core, __cldButts для экспорта.
 * Источник: material_id декора канала «снаружи» → edge_ids в карточке material_2.
 */

import * as THREE from 'three';
import {
  buildRoomEdgeStripMaterial,
} from '../room-edge-visual.js?v=20260712-edge-same-decor';
import {
  collectTrimEdgeInsetsFromConfig,
  getTrimPartConfig,
  getTrimPartEdgeOrientation,
  inferTrimEdgeOrientationFromBox,
  getTrimPartEdgeStripPhysics,
  getTrimPartNumber,
  getTrimPartRowByKey,
  mergeTrimPartEdgesWithBinding,
  resolveTrimPartKeyFromMesh,
  shrinkTrimCoreFromAxisInsets,
  trimPartUsesAxisEdgeInsets,
} from './trim-part-registry.js?v=20260822-edge-insets';
import { createDimensionLabel } from '../ui/scene-icons.js';
import { state } from '../utils/state.js';

const __edgeCatalogCache = new Map();
let __trimEdgeApplyPass = 0;

export function getEdgeVariantsFromItem(item) {
  if (!item) return [];
  if (Array.isArray(item.edge_variants) && item.edge_variants.length) return item.edge_variants;
  if (Array.isArray(item.variants) && item.variants.length) return item.variants;
  if (Array.isArray(item.params?.variants) && item.params.variants.length) return item.params.variants;
  return [];
}

/** Индекс варианта: явный edgeVariantId или ближайшая толщина (мм). */
export function resolveEdgeVariantIndex(item, options = {}) {
  const variants = getEdgeVariantsFromItem(item);
  if (!variants.length) return 0;
  const variantId = options.variantId ?? options.edgeVariantId;
  if (variantId != null && variantId !== '') {
    const i = Number(variantId);
    if (Number.isFinite(i) && i >= 0 && i < variants.length) return i;
  }
  const pref = options.preferredThicknessMm ?? options.thicknessMm;
  if (pref != null && Number.isFinite(Number(pref))) {
    const target = Number(pref);
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < variants.length; i++) {
      const t = Number(variants[i]?.thickness);
      if (!Number.isFinite(t)) continue;
      const d = Math.abs(t - target);
      if (d < bestDiff) {
        bestDiff = d;
        best = i;
      }
    }
    if (bestDiff < Infinity) return best;
  }
  for (let i = 0; i < variants.length; i++) {
    if (variants[i]?.default === true || variants[i]?.default === 1) return i;
  }
  return 0;
}

function parseThicknessMmFromVariant(variant, itemFallback) {
  if (variant && typeof variant.thickness === 'number' && Number.isFinite(variant.thickness)) {
    return variant.thickness;
  }
  if (!itemFallback) return 0.8;
  const n = parseFloat(itemFallback.thickness || '0.8');
  return Number.isFinite(n) ? n : 0.8;
}

export async function fetchEdgeCatalogMeta(edgeId, edgeTypeKey = 'butt_butts', options = {}) {
  const id = Number(edgeId) || 0;
  if (!id) return null;
  const type = String(edgeTypeKey || 'butt_butts').trim() || 'butt_butts';
  const variantId = options.variantId ?? options.edgeVariantId;
  const cacheKey = `${type}:${id}:${variantId != null ? variantId : 'auto'}`;
  if (__edgeCatalogCache.has(cacheKey)) return __edgeCatalogCache.get(cacheKey);

  try {
    const resp = await fetch(
      `/api/catalog/item/${encodeURIComponent(type)}/${encodeURIComponent(String(id))}?t=${Date.now()}`,
      { cache: 'no-store' },
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const item = await resp.json();
    const variants = getEdgeVariantsFromItem(item);
    const vi = resolveEdgeVariantIndex(item, { variantId, preferredThicknessMm: options.preferredThicknessMm });
    const v = variants[vi] || null;
    const meta = {
      id,
      edgeType: type,
      variantId: vi,
      variant: v,
      variants,
      name: (v?.name || item?.name || `Кромка ${id}`).toString(),
      color: (item?.color || '#ffffff').toString().trim() || '#ffffff',
      thicknessMm: parseThicknessMmFromVariant(v, item),
      roughness: typeof item?.roughness === 'number' ? item.roughness : 0.8,
      metalness: typeof item?.metalness === 'number' ? item.metalness : 0,
      texture: (item?.texture || item?.icon || '').toString().trim() || '',
      normalMap: (item?.normalMap || '').toString().trim() || '',
      roughnessMap: (item?.roughnessMap || '').toString().trim() || '',
      stretchWidth: !!(item?.stretchWidth || item?.stretch_width),
      stretchHeight: !!(item?.stretchHeight || item?.stretch_height),
      realTextureWidth: Number(item?.realTextureWidth || item?.real_texture_width) || 256,
      realTextureHeight: Number(item?.realTextureHeight || item?.real_texture_height) || 256,
      oneSided: !!(item?.oneSided || item?.one_side),
      price: v?.price != null ? Number(v.price) : null,
      calc_type: (v?.calc_type || 'per_mp').toString(),
    };
    __edgeCatalogCache.set(cacheKey, meta);
    return meta;
  } catch (e) {
    console.warn('[TRIM-EDGE] catalog fetch failed:', { id, type, error: e?.message || e });
    __edgeCatalogCache.set(cacheKey, null);
    return null;
  }
}

/** Полоски кромки из каталога на планках (как зелёные в превью при enabled + edge_id). */
const ROOM_TRIM_EDGE_VISUAL_ENABLED = false;

/** № обклада: только при __CLD_SHOW_TRIM_PART_LABELS === true и шагах 2–6. */
export function isTrimPartNumberLabelsVisible() {
  if (typeof window === 'undefined') return false;
  if (window.__CLD_SHOW_TRIM_PART_LABELS !== true) return false;
  const step = Number(window.currentRoomStep);
  return Number.isFinite(step) && step >= 2 && step <= 6;
}
/** Красные торцы на сторонах без кромки — только в превью обклада (админка).
 * В комнате выкл.: выглядят как «лишние красные планки» вдоль фасада/петель
 * (история: те же артефакты, что раньше путали с Hole_*). */
const ROOM_TRIM_UNCUT_INDICATORS_ENABLED = false;

function partConfigHasEnabledEdgeSide(partConfig) {
  const partEdges = partConfig?.edges;
  if (!partEdges) return false;
  for (let i = 1; i <= 4; i++) {
    const s = partEdges[i] || partEdges[String(i)];
    if (s && s.enabled === true) return true;
  }
  return false;
}

function resetTrimMeshPlain(mesh) {
  removeTrimEdgeChildren(mesh);
  delete mesh.userData.__cldButts;
  delete mesh.userData.sectionTrimEdgeId;
  // §6.3: вертикаль уже подрезана под тумбу — не восстанавливать fullH из устаревшего base.
  if (mesh.userData?._trimmedVerticalForFurniture) return;
  const b = mesh.userData.cldTrimBaseSize || captureTrimBaseSize(mesh);
  if (!b) return;
  if (mesh.geometry) mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(b.w, b.h, b.d);
  if (mesh.userData.cldTrimBasePosition) mesh.position.copy(mesh.userData.cldTrimBasePosition);
}

/**
 * CFRN/Базис: номинал плиты = текущая геометрия (после §6.3 кромки могли оставить 600/750).
 */
export function syncTrimNominalSizeFromGeometry(mesh) {
  if (!mesh?.isMesh) return;
  const params = mesh.geometry?.parameters;
  if (!params || !Number.isFinite(params.height)) return;
  const w = Number(params.width);
  const h = Number(params.height);
  const d = Number(params.depth);
  if (!(h > 0)) return;
  mesh.userData.cldTrimBaseSize = { w, h, d };
  mesh.userData.cldTrimNominalSizeMm = { w, h, d };
  mesh.userData.__cldCfrnSizeMm = { x: w, y: h, z: d };
}

/** Убрать полоски кромки/некромлёных торцов и вернуть полный box (декор шага 5 не трогаем). */
export function prepareTrimMeshObkladVisual(mesh) {
  // После §6.3 высота уже подрезана под тумбу — не откатывать на cldTrimBaseSize «в потолок».
  if (mesh.userData?._trimmedVerticalForFurniture) {
    removeTrimEdgeChildren(mesh);
    delete mesh.userData.__cldButts;
    delete mesh.userData.sectionTrimEdgeId;
    if (typeof window !== 'undefined') {
      try {
        if (
          mesh.userData?.isSideOverlay &&
          typeof window.__clodisFixSideOverlaySectionDepth === 'function'
        ) {
          window.__clodisFixSideOverlaySectionDepth(mesh);
        }
        if (typeof window.__clodisClipVerticalTrimAtTumbaTops === 'function') {
          window.__clodisClipVerticalTrimAtTumbaTops(mesh);
        }
        if (mesh.userData?.isSideOverlay || mesh.userData?.isTransitionHeightMismatch) {
          syncTrimNominalSizeFromGeometry(mesh);
        }
      } catch (_) {}
    }
    return;
  }
  resetTrimMeshPlain(mesh);
  if (typeof window !== 'undefined') {
    try {
      if (
        mesh.userData?.isSideOverlay &&
        typeof window.__clodisFixSideOverlaySectionDepth === 'function'
      ) {
        window.__clodisFixSideOverlaySectionDepth(mesh);
      }
      if (typeof window.__clodisClipVerticalTrimAtTumbaTops === 'function') {
        window.__clodisClipVerticalTrimAtTumbaTops(mesh);
      }
      if (mesh.userData?.isSideOverlay || mesh.userData?.isTransitionHeightMismatch) {
        syncTrimNominalSizeFromGeometry(mesh);
      }
    } catch (_) {}
  }
}

/** Снять полоски кромки и вернуть габарит планки (без декора шага 5). */
export function stripSectionTrimMeshVisual(mesh) {
  prepareTrimMeshObkladVisual(mesh);
  const mats = mesh?.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
  for (const m of mats) {
    if (!m) continue;
    m.map = null;
    m.normalMap = null;
    m.roughnessMap = null;
    if (m.color) m.color.set(0xffffff);
    m.needsUpdate = true;
  }
}

function mergedEdgesHaveAppliedStrip(edges) {
  if (!edges) return false;
  for (let i = 1; i <= 4; i++) {
    const e = edges[i] || edges[String(i)];
    if (!e || e.enabled !== true) continue;
    if (e.edge_id || e.decor_id || e.edge_name || e.decor_name) return true;
  }
  return false;
}

export function edgeVariantOptionLabel(variant, index) {
  const th = variant?.thickness;
  const thStr = th != null && th !== '' ? `${th} мм` : `вариант ${index + 1}`;
  const price = variant?.price != null && variant.price !== '' ? ` — ${variant.price} ₽` : '';
  return thStr + price;
}

export function getStep5ConfigStep() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('room_steps_config') : null;
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    const steps = cfg?.steps;
    return Array.isArray(steps) ? steps.find((s) => s?.stepId === 5) || null : null;
  } catch {
    return null;
  }
}

function getStep5TrimEdgeMap() {
  const step5 = getStep5ConfigStep();
  const map = step5?.step5SectionTrimEdgeByDecorId;
  return map && typeof map === 'object' ? map : null;
}

/** Декор из круга шага 5 по id (outer + inner). */
export function findStep5WheelDecorById(decorId) {
  const key = decorId != null ? String(decorId) : '';
  if (!key) return null;
  const step5 = getStep5ConfigStep();
  if (!step5) return null;
  const outer = Array.isArray(step5.step5WheelOuter) ? step5.step5WheelOuter : [];
  const inner = Array.isArray(step5.step5WheelInner) ? step5.step5WheelInner : [];
  const direct =
    outer.find((c) => c && String(c.id) === key) || inner.find((c) => c && String(c.id) === key);
  if (direct) return direct;
  const m = key.match(/^m-(\d+)$/);
  if (m) {
    const mid = Number(m[1]);
    if (Number.isFinite(mid)) {
      return (
        outer.find((c) => c && Number(c.material_id ?? c.materialId) === mid) ||
        inner.find((c) => c && Number(c.material_id ?? c.materialId) === mid) ||
        null
      );
    }
  }
  const slot = key.match(/^(outer|inner)-(\d+)$/);
  if (slot) {
    const idx = Number(slot[2]) - 1;
    const wheel = slot[1] === 'inner' ? inner : outer;
    if (idx >= 0 && idx < wheel.length) return wheel[idx];
  }
  return null;
}

/**
 * Пара «материал ЛДСП + кромка» для обклада по декору.
 * material: сохранённый в админке → круг → текущий выбор «снаружи».
 * edge: сохранённый по декору → step5TrimEdgeByMaterial → null (дефолт каталога — в pricing).
 */
export function resolveSectionTrimBinding(decorId, options = {}) {
  const key = decorId != null ? String(decorId) : '';
  const step5 = getStep5ConfigStep();
  const saved = key && getStep5TrimEdgeMap() ? getStep5TrimEdgeMap()[key] : null;
  const wheel = key ? findStep5WheelDecorById(key) : null;

  let materialType =
    saved?.material_type ||
    saved?.materialType ||
    wheel?.material_type ||
    wheel?.materialType ||
    null;
  let materialId =
    saved?.material_id != null
      ? saved.material_id
      : saved?.materialId != null
        ? saved.materialId
        : wheel?.material_id != null
          ? wheel.material_id
          : wheel?.materialId;

  if ((materialId == null || materialId === '') && options.fallbackOutside) {
    const o = options.fallbackOutside;
    materialType = materialType || o.material_type || o.materialType || 'material_2';
    materialId = o.material_id ?? o.materialId;
  }

  materialType = materialType || 'material_2';
  const matNum = materialId != null && materialId !== '' ? Number(materialId) : null;

  let edgeType = 'butt_butts';
  let edgeId = null;
  let edgeVariantId = null;

  if (saved) {
    const savedEdgeId = saved.edge_id ?? saved.edgeId;
    const savedNum = savedEdgeId != null && savedEdgeId !== '' ? Number(savedEdgeId) : null;
    if (savedNum != null && Number.isFinite(savedNum) && savedNum > 0) {
      edgeId = savedNum;
      edgeType = String(saved.edge_type || saved.edgeType || edgeType);
      const sv = saved.edge_variant_id ?? saved.edgeVariantId;
      if (sv != null && sv !== '') edgeVariantId = Number(sv);
    }
  }

  if (matNum && Number.isFinite(matNum) && typeof globalThis !== 'undefined') {
    const ext = globalThis.__cldStep5Edge;
    if (ext && typeof ext.resolveBindingForMaterial === 'function') {
      const b = ext.resolveBindingForMaterial(matNum, wheel, options);
      if (b?.edgeId) {
        edgeType = b.edgeType || edgeType;
        edgeId = b.edgeId;
        edgeVariantId = b.edgeVariantId != null ? b.edgeVariantId : edgeVariantId;
      }
    }
  }

  if ((!edgeId || !Number.isFinite(edgeId)) && typeof globalThis !== 'undefined') {
    const ext = globalThis.__cldStep5Edge;
    if (ext && typeof ext.resolveBindingForDecorId === 'function') {
      const b = ext.resolveBindingForDecorId(key, options);
      if (b?.edgeId) {
        edgeId = b.edgeId;
        edgeVariantId = b.edgeVariantId != null ? b.edgeVariantId : edgeVariantId;
        edgeType = b.edgeType || edgeType;
      }
    }
  }

  return {
    decorId: key || null,
    materialType: String(materialType || 'material_2'),
    materialId: matNum != null && Number.isFinite(matNum) ? matNum : null,
    edgeType,
    edgeId: edgeId != null && Number.isFinite(edgeId) ? edgeId : null,
    edgeVariantId: edgeVariantId != null && Number.isFinite(edgeVariantId) ? edgeVariantId : null,
    decorName: wheel?.name || saved?.decorName || key || '',
  };
}

/** @deprecated use resolveSectionTrimBinding */
export function resolveSectionTrimEdgeBinding(decorId, options) {
  const b = resolveSectionTrimBinding(decorId, options);
  if (!b?.edgeId) return null;
  return { edgeType: b.edgeType, edgeId: b.edgeId };
}

export function isSectionTrimFacadeMesh(obj) {
  const ud = obj?.userData || {};
  return !!(
    obj?.isMesh &&
    ud.sectionTrimUsesOutsideDecor === true &&
    (ud.isTopPlank ||
      ud.isBottomPlank ||
      ud.isSidePlank ||
      ud.isSideOverlay ||
      ud.isSectionFacadeTrim ||
      ud.isTransitionHeightMismatch ||
      ud.isTransitionAutoTopCap ||
      ud.isSectionTransitionPart)
  );
}

function buildUniformEdgesObject(meta) {
  const base = {
    enabled: true,
    edge_id: meta.id,
    edge_name: meta.name,
    decor_id: meta.id,
    decor_name: meta.name,
    color: meta.color,
    thickness: meta.thicknessMm,
    roughness: meta.roughness,
    metalness: meta.metalness,
    texture: meta.texture || '',
    icon: meta.texture || '',
    type: meta.edgeType || 'butt_butts',
    variant_id: meta.variantId,
    realTextureWidth: meta.realTextureWidth,
    realTextureHeight: meta.realTextureHeight,
    stretchWidth: meta.stretchWidth,
    stretchHeight: meta.stretchHeight,
    normalMap: meta.normalMap || '',
    roughnessMap: meta.roughnessMap || '',
    oneSided: meta.oneSided,
  };
  return {
    1: { ...base },
    2: { ...base },
    3: { ...base },
    4: { ...base },
  };
}

/** Красные полоски на торцах без кромки (отладка в комнате). */
const TRIM_UNCUT_EDGE_COLOR = 0xff2222;
const TRIM_UNCUT_EDGE_THICKNESS_MM = 2.5;
let __trimUncutEdgeMaterial = null;

function getTrimUncutEdgeMaterial() {
  if (!__trimUncutEdgeMaterial) {
    __trimUncutEdgeMaterial = new THREE.MeshStandardMaterial({
      color: TRIM_UNCUT_EDGE_COLOR,
      emissive: TRIM_UNCUT_EDGE_COLOR,
      emissiveIntensity: 0.75,
      roughness: 0.35,
      metalness: 0,
      depthTest: true,
      depthWrite: false,
      transparent: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
  }
  return __trimUncutEdgeMaterial;
}

function isPartSideEdged(partEdges, edgeNum) {
  const side = partEdges?.[edgeNum] || partEdges?.[String(edgeNum)];
  return !!(side && side.enabled === true);
}

function nudgeTrimEdgeStripOutward(edgeNum, orientation, pos, amount) {
  const o = normalizeTrimEdgeOrientation(orientation);
  const a = amount || 0.35;
  if (o === 'v') {
    if (edgeNum === 1) pos.y -= a;
    else if (edgeNum === 2) pos.y += a;
    else if (edgeNum === 3) pos.z -= a;
    else if (edgeNum === 4) pos.z += a;
  } else if (o === 'h') {
    if (edgeNum === 1) pos.z -= a;
    else if (edgeNum === 2) pos.z += a;
    else if (edgeNum === 3) pos.x -= a;
    else if (edgeNum === 4) pos.x += a;
  } else {
    if (edgeNum === 1) pos.y -= a;
    else if (edgeNum === 2) pos.y += a;
    else if (edgeNum === 3) pos.x -= a;
    else if (edgeNum === 4) pos.x += a;
  }
}

function buildPartEdgesShell(partEdges) {
  const out = {};
  for (let i = 1; i <= 4; i++) {
    const side = partEdges?.[i] || partEdges?.[String(i)];
    out[i] = side ? { ...side, enabled: side.enabled === true } : { enabled: false };
  }
  return out;
}

function normalizeTrimEdgeOrientation(orientation) {
  if (orientation === 'v' || orientation === 'h') return orientation;
  return 'f';
}

/**
 * Геометрия и позиция полоски кромки на номере стороны 1–4 (мм, локальные оси планки).
 */
function resolveTrimEdgeStripLayout(edgeNum, orientation, w, h, d, edgeGeomThickness, makeEdgeGeom) {
  const o = normalizeTrimEdgeOrientation(orientation);
  let edgeGeom = null;
  let edgePos = null;

  if (o === 'v') {
    if (edgeNum === 1) {
      edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d);
      edgePos = new THREE.Vector3(0, -h / 2 + edgeGeomThickness / 2, 0);
    } else if (edgeNum === 2) {
      edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d);
      edgePos = new THREE.Vector3(0, h / 2 - edgeGeomThickness / 2, 0);
    } else if (edgeNum === 3) {
      edgeGeom = makeEdgeGeom(w, h, edgeGeomThickness);
      edgePos = new THREE.Vector3(0, 0, -d / 2 + edgeGeomThickness / 2);
    } else if (edgeNum === 4) {
      edgeGeom = makeEdgeGeom(w, h, edgeGeomThickness);
      edgePos = new THREE.Vector3(0, 0, d / 2 - edgeGeomThickness / 2);
    }
  } else if (o === 'h') {
    if (edgeNum === 1) {
      edgeGeom = makeEdgeGeom(w, h, edgeGeomThickness);
      edgePos = new THREE.Vector3(0, 0, -d / 2 + edgeGeomThickness / 2);
    } else if (edgeNum === 2) {
      edgeGeom = makeEdgeGeom(w, h, edgeGeomThickness);
      edgePos = new THREE.Vector3(0, 0, d / 2 - edgeGeomThickness / 2);
    } else if (edgeNum === 3) {
      edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d);
      edgePos = new THREE.Vector3(-w / 2 + edgeGeomThickness / 2, 0, 0);
    } else if (edgeNum === 4) {
      edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d);
      edgePos = new THREE.Vector3(w / 2 - edgeGeomThickness / 2, 0, 0);
    }
  } else {
    if (edgeNum === 1) {
      edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d);
      edgePos = new THREE.Vector3(0, -h / 2 + edgeGeomThickness / 2, 0);
    } else if (edgeNum === 2) {
      edgeGeom = makeEdgeGeom(w, edgeGeomThickness, d);
      edgePos = new THREE.Vector3(0, h / 2 - edgeGeomThickness / 2, 0);
    } else if (edgeNum === 3) {
      edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d);
      edgePos = new THREE.Vector3(-w / 2 + edgeGeomThickness / 2, 0, 0);
    } else if (edgeNum === 4) {
      edgeGeom = makeEdgeGeom(edgeGeomThickness, h, d);
      edgePos = new THREE.Vector3(w / 2 - edgeGeomThickness / 2, 0, 0);
    }
  }

  return edgeGeom && edgePos ? { edgeGeom, edgePos } : null;
}

function removeTrimEdgeChildren(mesh) {
  if (!mesh?.children?.length) return;
  const toRemove = [];
  for (const ch of mesh.children) {
    if (ch?.userData?.isEdge || ch?.userData?.isUncutEdge) toRemove.push(ch);
  }
  for (const ch of toRemove) {
    mesh.remove(ch);
    ch.geometry?.dispose?.();
    if (ch.userData?.isUncutEdge) continue;
    const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
    mats.forEach((m) => m?.dispose?.());
  }
}

function trimUncutStripThicknessMm(outerSize) {
  const w = outerSize?.w || 100;
  const h = outerSize?.h || 16;
  const d = outerSize?.d || 16;
  return Math.max(TRIM_UNCUT_EDGE_THICKNESS_MM, Math.min(w, h, d) * 0.1);
}

function applyTrimUncutEdgeIndicators(mesh, edges, orientation, outerSize, partEdges, trimKey, options = {}) {
  if (!mesh || !outerSize) return;
  const fromObklad = options.fromObkladConfig === true && ROOM_TRIM_UNCUT_INDICATORS_ENABLED;
  const debugUncut =
    typeof globalThis !== 'undefined' && globalThis.__cldShowTrimUncutDebug === true;
  if (!fromObklad && !debugUncut) return;
  if (fromObklad && !partEdges) return;
  const getEdgeData = (i) => edges?.[i] || edges?.[String(i)] || {};
  const hasSelectedDecor = (ed) => !!(ed?.decor_id || ed?.decor_name || ed?.edge_id || ed?.edge_name);
  const isMergedEdgeApplied = (ed) => !!ed?.enabled && hasSelectedDecor(ed);

  const w = outerSize.w;
  const h = outerSize.h;
  const d = outerSize.d;
  const edgeGeomThickness = trimUncutStripThicknessMm(outerSize);
  const makeEdgeGeom = (tw, th, td) => new THREE.BoxGeometry(tw, th, td);
  const uncutMat = getTrimUncutEdgeMaterial();

  for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
    const showUncut = partEdges
      ? !isPartSideEdged(partEdges, edgeNum)
      : !isMergedEdgeApplied(getEdgeData(edgeNum));
    if (!showUncut) continue;
    const phys = trimKey
      ? getTrimPartEdgeStripPhysics(trimKey, edgeNum, outerSize)
      : { orientation: normalizeTrimEdgeOrientation(orientation), edgeNum };
    const layout = resolveTrimEdgeStripLayout(
      phys.edgeNum,
      phys.orientation,
      w,
      h,
      d,
      edgeGeomThickness,
      makeEdgeGeom,
    );
    if (!layout) continue;

    nudgeTrimEdgeStripOutward(
      phys.edgeNum,
      phys.orientation,
      layout.edgePos,
      Math.max(0.25, edgeGeomThickness * 0.15),
    );
    const uncutMesh = new THREE.Mesh(layout.edgeGeom, uncutMat);
    uncutMesh.position.copy(layout.edgePos);
    uncutMesh.renderOrder = 50;
    uncutMesh.userData.isUncutEdge = true;
    uncutMesh.userData.edgeNumber = edgeNum;
    uncutMesh.userData.cldSectionTrimUncut = true;
    mesh.add(uncutMesh);
  }
}

function captureTrimBaseSize(mesh) {
  const geom = mesh.geometry;
  const params = geom?.parameters;
  if (params && (geom.type === 'BoxGeometry' || geom.type === 'BoxBufferGeometry')) {
    mesh.userData.cldTrimBaseSize = { w: params.width, h: params.height, d: params.depth };
    return mesh.userData.cldTrimBaseSize;
  }
  if (mesh.userData.cldTrimBaseSize) return mesh.userData.cldTrimBaseSize;
  mesh.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  if (size.x > 0.001 && size.y > 0.001 && size.z > 0.001) {
    mesh.userData.cldTrimBaseSize = { w: size.x, h: size.y, d: size.z };
    return mesh.userData.cldTrimBaseSize;
  }
  return null;
}

function applyTrimEdgesToPlank(mesh, edges, edgeMeta, orientation, partEdgesForUncut) {
  removeTrimEdgeChildren(mesh);

  const baseSize = captureTrimBaseSize(mesh);
  if (!baseSize) return;
  if (!mesh.userData.cldTrimBasePosition) {
    mesh.userData.cldTrimBasePosition = mesh.position.clone();
  }

  const trimKey = mesh.userData?.trimPartKey || null;
  const o = normalizeTrimEdgeOrientation(
    trimKey
      ? getTrimPartEdgeOrientation(trimKey, baseSize)
      : inferTrimEdgeOrientationFromBox(baseSize.w, baseSize.h, baseSize.d) || orientation,
  );
  const getEdgeData = (i) => edges[i] || edges[String(i)] || {};
  const hasSelectedDecor = (ed) => !!(ed?.decor_id || ed?.decor_name || ed?.edge_id || ed?.edge_name);
  const parseEdgeThicknessMm = (ed) => {
    if (!ed) return 0;
    if (typeof ed.thickness === 'number' && Number.isFinite(ed.thickness)) return ed.thickness;
    const n = parseFloat(ed.thickness || '0.8');
    return Number.isFinite(n) ? n : 0.8;
  };

  const RoundedBoxGeometryGlobal =
    typeof window !== 'undefined' && window.RoundedBoxGeometry ? window.RoundedBoxGeometry : null;

  const wOuter = baseSize.w;
  const hOuter = baseSize.h;
  const dOuter = baseSize.d;

  let inset1 = 0;
  let inset2 = 0;
  let inset3 = 0;
  let inset4 = 0;
  const axisInsets =
    trimKey && trimPartUsesAxisEdgeInsets(trimKey)
      ? collectTrimEdgeInsetsFromConfig(trimKey, edges, (_i, ed) => !!(ed?.enabled && hasSelectedDecor(ed)))
      : null;
  if (!axisInsets) {
    for (let i = 1; i <= 4; i++) {
      const ed = getEdgeData(i);
      if (ed?.enabled && hasSelectedDecor(ed)) {
        const t = parseEdgeThicknessMm(ed);
        if (i === 1) inset1 = t;
        else if (i === 2) inset2 = t;
        else if (i === 3) inset3 = t;
        else if (i === 4) inset4 = t;
      }
    }
  }
  const hasAnyInset = axisInsets
    ? axisInsets.xLo > 0 ||
      axisInsets.xHi > 0 ||
      axisInsets.yLo > 0 ||
      axisInsets.yHi > 0 ||
      axisInsets.zLo > 0 ||
      axisInsets.zHi > 0
    : inset1 > 0 || inset2 > 0 || inset3 > 0 || inset4 > 0;

  let coreW = wOuter;
  let coreH = hOuter;
  let coreD = dOuter;
  let ox = 0;
  let oy = 0;
  let oz = 0;
  if (hasAnyInset && axisInsets) {
    const shrunk = shrinkTrimCoreFromAxisInsets(wOuter, hOuter, dOuter, axisInsets);
    coreW = shrunk.coreW;
    coreH = shrunk.coreH;
    coreD = shrunk.coreD;
    ox = shrunk.ox;
    oy = shrunk.oy;
    oz = shrunk.oz;
  } else if (hasAnyInset) {
    if (o === 'v') {
      coreW = wOuter;
      coreH = Math.max(0.001, hOuter - inset1 - inset2);
      coreD = Math.max(0.001, dOuter - inset3 - inset4);
      oy = (inset1 - inset2) / 2;
      oz = (inset3 - inset4) / 2;
    } else if (o === 'h') {
      coreW = Math.max(0.001, wOuter - inset3 - inset4);
      coreH = hOuter;
      coreD = Math.max(0.001, dOuter - inset1 - inset2);
      ox = (inset3 - inset4) / 2;
      oz = (inset1 - inset2) / 2;
    } else {
      coreW = Math.max(0.001, wOuter - inset3 - inset4);
      coreH = Math.max(0.001, hOuter - inset1 - inset2);
      coreD = dOuter;
      ox = (inset3 - inset4) / 2;
      oy = (inset1 - inset2) / 2;
    }
  }

  mesh.userData.cldTrimNominalSizeMm = { w: wOuter, h: hOuter, d: dOuter };
  mesh.userData.__cldCfrnSizeMm = { x: wOuter, y: hOuter, z: dOuter };
  mesh.userData.__cldPanelOrientation = o;

  if (mesh.geometry) mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(coreW, coreH, coreD);
  mesh.position.copy(mesh.userData.cldTrimBasePosition);
  if (hasAnyInset) {
    mesh.position.x += ox;
    mesh.position.y += oy;
    mesh.position.z += oz;
  }

  const butts = [];
  const edgeToElem = { 1: 0, 2: 2, 3: 3, 4: 1 };
  for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
    const ed = getEdgeData(edgeNum);
    const enabled = !!ed?.enabled;
    if (!enabled || !hasSelectedDecor(ed)) continue;
    const t = parseEdgeThicknessMm(ed);
    const edgeId = ed?.edge_id ?? ed?.decor_id ?? edgeNum;
    const edgeName = ed?.edge_name || ed?.decor_name || `Кромка ${edgeId}`;
    const edgeWidth = Number(ed?.width ?? ed?.height ?? 0) || 0;
    const thickMm = Number.isFinite(t) ? t : 0.5;
    const tKey = String(thickMm).replace('.', '_');
    butts.push({
      elemIndex: edgeToElem[edgeNum] ?? edgeNum - 1,
      thickness: thickMm,
      width: edgeWidth,
      buttType: 0,
      overhang: 0,
      allowance: 0,
      cutIndex: -1,
      clip: false,
      materialArt: `EDGE_${edgeId}_t${tKey}`,
      materialName: edgeName,
    });
  }
  if (butts.length) {
    mesh.userData.__cldButts = butts;
  } else {
    delete mesh.userData.__cldButts;
  }

  if (edgeMeta) {
    mesh.userData.sectionTrimEdgeId = edgeMeta.id;
    mesh.userData.sectionTrimEdgeType = edgeMeta.edgeType;
    mesh.userData.sectionTrimEdgeVariantId = edgeMeta.variantId;
    mesh.userData.sectionTrimEdgeName = edgeMeta.name;
  }

  const makeEdgeGeom = (tw, th, td, edgeMm) => {
    const useRounded = !!RoundedBoxGeometryGlobal && edgeMm > 0 && edgeMm <= 2;
    if (useRounded) {
      try {
        const r = edgeMm;
        return new RoundedBoxGeometryGlobal(tw, th, td, 2, Math.max(r, 0.0001));
      } catch {
        return new THREE.BoxGeometry(tw, th, td);
      }
    }
    return new THREE.BoxGeometry(tw, th, td);
  };

  const w = wOuter;
  const h = hOuter;
  const d = dOuter;

  for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
    const ed = getEdgeData(edgeNum);
    const enabled = !!ed?.enabled;
    if (!enabled || !hasSelectedDecor(ed)) continue;

    const edgeMm = parseEdgeThicknessMm(ed);
    const edgeThickness = Math.max(edgeMm, 0.0001);
    const useRounded = !!RoundedBoxGeometryGlobal && edgeMm > 0 && edgeMm <= 2;
    const edgeGeomThickness = useRounded ? edgeThickness * 2 : edgeThickness;

    const phys = trimKey
      ? getTrimPartEdgeStripPhysics(trimKey, edgeNum, { w, h, d })
      : { orientation: o, edgeNum };
    const layout = resolveTrimEdgeStripLayout(
      phys.edgeNum,
      phys.orientation,
      w,
      h,
      d,
      edgeGeomThickness,
      (tw, th, td) => makeEdgeGeom(tw, th, td, edgeMm),
    );
    if (!layout) continue;
    const edgeGeom = layout.edgeGeom;
    const edgePos = layout.edgePos;

    const seamOverlap = 0.06;
    const po = phys.orientation;
    const pn = phys.edgeNum;
    if (pn === 1) {
      if (po === 'v' || po === 'f') edgePos.y += seamOverlap / 2;
      else edgePos.z += seamOverlap / 2;
    } else if (pn === 2) {
      if (po === 'v' || po === 'f') edgePos.y -= seamOverlap / 2;
      else edgePos.z -= seamOverlap / 2;
    } else if (pn === 3) {
      if (po === 'v') edgePos.z += seamOverlap / 2;
      else edgePos.x += seamOverlap / 2;
    } else if (pn === 4) {
      if (po === 'v') edgePos.z -= seamOverlap / 2;
      else edgePos.x -= seamOverlap / 2;
    }

    const edgeMat = buildRoomEdgeStripMaterial(ed, w, h);

    const edgeMesh = new THREE.Mesh(edgeGeom, edgeMat);
    edgeMesh.position.copy(edgePos);
    edgeMesh.renderOrder = 10;
    edgeMesh.userData.isEdge = true;
    edgeMesh.userData.edgeNumber = edgeNum;
    edgeMesh.userData.cldSectionTrimEdge = true;
    mesh.add(edgeMesh);
  }

  applyTrimUncutEdgeIndicators(
    mesh,
    edges,
    o,
    { w: wOuter, h: hOuter, d: dOuter },
    partEdgesForUncut,
    trimKey,
    { fromObkladConfig: ROOM_TRIM_UNCUT_INDICATORS_ENABLED },
  );
}

/** Красные торцы по схеме обклада (стороны с enabled !== true). */
function applyObkladUncutIndicatorsToMesh(mesh) {
  const trimKey = mesh.userData?.trimPartKey || resolveTrimPartKeyFromMesh(mesh);
  if (!trimKey) return 0;
  if (!mesh.userData.trimPartKey) mesh.userData.trimPartKey = trimKey;
  const partConfig = getTrimPartConfig(trimKey);
  const partEdges = partConfig?.edges;
  if (!partEdges) return 0;
  const baseSize = mesh.userData.cldTrimBaseSize || captureTrimBaseSize(mesh);
  if (!baseSize) return 0;
  if (!mesh.userData.cldTrimBasePosition) {
    mesh.userData.cldTrimBasePosition = mesh.position.clone();
  }
  const edgeOri = getTrimPartEdgeOrientation(trimKey, baseSize);
  applyTrimUncutEdgeIndicators(
    mesh,
    buildPartEdgesShell(partEdges),
    edgeOri,
    baseSize,
    partEdges,
    trimKey,
    { fromObkladConfig: true },
  );
  let added = 0;
  for (const ch of mesh.children || []) {
    if (ch?.userData?.isUncutEdge) added++;
  }
  return added;
}

/** Декор «снаружи» из room_steps_config, если в комнате ещё не открывали шаг 5. */
function pickStep5OutsideDecorFromConfig() {
  const step5 = getStep5ConfigStep();
  if (!step5) return null;
  const outer = Array.isArray(step5.step5WheelOuter) ? step5.step5WheelOuter : [];
  const inner = Array.isArray(step5.step5WheelInner) ? step5.step5WheelInner : [];
  const all = outer.concat(inner);
  const def = step5.step5Defaults || {};
  const pick = (id) => {
    if (id == null || id === '') return null;
    const sid = String(id);
    let found = outer.find((c) => c && String(c.id) === sid) || all.find((c) => c && String(c.id) === sid);
    if (!found) {
      const m = sid.match(/^m-(\d+)$/);
      if (m) {
        const mid = Number(m[1]);
        found = all.find((c) => c && Number(c.material_id ?? c.materialId) === mid);
      }
    }
    return found || null;
  };
  return pick(def.outsideId) || pick(def.defaultId) || outer[0] || all[0] || null;
}

function getStep5OutsideFallback(explicit) {
  if (explicit) return explicit;
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.getStep5DecorSelection === 'function') {
      const live = globalThis.getStep5DecorSelection()?.outside || null;
      if (live) return live;
    }
  } catch (_) {}
  return pickStep5OutsideDecorFromConfig();
}

async function ensureTrimEdgeCatalogPreloaded() {
  const ext = typeof globalThis !== 'undefined' ? globalThis.__cldStep5Edge : null;
  if (ext && typeof ext.preloadCatalog === 'function') {
    try {
      await ext.preloadCatalog();
    } catch (_) {}
  }
}

/** material_id / декор шага 5 / fallback «снаружи» → edgeId для визуала кромки в комнате. */
function resolveTrimBindingForMesh(mesh, fallbackOutside) {
  const ext = typeof globalThis !== 'undefined' ? globalThis.__cldStep5Edge : null;
  const outside = getStep5OutsideFallback(fallbackOutside);
  let decorId = mesh?.userData?.step5TrimDecorId || null;
  let full = resolveSectionTrimBinding(decorId, { fallbackOutside: outside });

  const meshMatId = mesh?.userData?.step5TrimMaterialId;
  if ((!full?.edgeId || !Number.isFinite(full.edgeId)) && meshMatId != null && ext?.resolveBindingForMaterial) {
    const b = ext.resolveBindingForMaterial(Number(meshMatId), null, { panelThicknessMm: 16 });
    if (b?.edgeId) {
      full = { ...full, ...b, decorId: full?.decorId || b.decorId || decorId };
      if (!decorId && b.decorId) decorId = b.decorId;
    }
  }

  if ((!full?.edgeId || !Number.isFinite(full.edgeId)) && outside) {
    if (ext?.resolveBindingForDecor) {
      const b = ext.resolveBindingForDecor(outside, { fallbackOutside: outside });
      if (b?.edgeId) {
        if (!mesh.userData.step5TrimDecorId && b.decorId) {
          mesh.userData.step5TrimDecorId = String(b.decorId);
        }
        if (b.materialId != null) mesh.userData.step5TrimMaterialId = Number(b.materialId);
        decorId = mesh.userData.step5TrimDecorId || decorId;
        full = resolveSectionTrimBinding(decorId, { fallbackOutside: outside });
        if (!full?.edgeId) {
          full = {
            ...full,
            decorId: decorId || full?.decorId || b.decorId,
            materialType: b.materialType || full?.materialType,
            materialId: b.materialId ?? full?.materialId,
            edgeType: b.edgeType || full?.edgeType,
            edgeId: b.edgeId,
            edgeVariantId: b.edgeVariantId ?? full?.edgeVariantId,
          };
        }
      }
    } else if (!decorId) {
      full = resolveSectionTrimBinding(null, { fallbackOutside: outside });
    }
  }

  if ((!full?.edgeId || !Number.isFinite(full.edgeId)) && !decorId && outside?.material_id != null) {
    const mid = outside.material_id ?? outside.materialId;
    if (ext?.resolveBindingForMaterial && mid != null) {
      const b = ext.resolveBindingForMaterial(Number(mid), outside, { panelThicknessMm: 16 });
      if (b?.edgeId) {
        if (!mesh.userData.step5TrimDecorId && b.decorId) {
          mesh.userData.step5TrimDecorId = String(b.decorId);
        }
        if (b.materialId != null) mesh.userData.step5TrimMaterialId = Number(b.materialId);
        full = { ...full, ...b };
      }
    }
  }

  return full;
}

/** Первая включённая сторона с явным edge_id из сохранённого обклада (админка). */
function resolvePartEdgeBindingFromTrimConfig(trimPartKey) {
  const cfg = trimPartKey ? getTrimPartConfig(trimPartKey) : null;
  const partEdges = cfg?.edges;
  if (!partEdges) return null;
  for (let i = 1; i <= 4; i++) {
    const s = partEdges[i] || partEdges[String(i)];
    if (s?.enabled !== true) continue;
    const raw = s.edge_id ?? s.decor_id;
    if (raw == null || raw === '') continue;
    const eid = Number(raw);
    if (!Number.isFinite(eid) || eid <= 0) continue;
    const ev = s.variant_id ?? s.edge_variant_id;
    return {
      edgeType: String(s.type || 'butt_butts'),
      edgeId: eid,
      edgeVariantId: ev != null && ev !== '' ? Number(ev) : null,
    };
  }
  return null;
}

async function applyEdgesToTrimMesh(mesh, passId, fallbackOutside) {
  const trimKeyEarly = mesh.userData?.trimPartKey || resolveTrimPartKeyFromMesh(mesh);
  if (trimKeyEarly && !mesh.userData.trimPartKey) mesh.userData.trimPartKey = trimKeyEarly;
  const partConfig = trimKeyEarly ? getTrimPartConfig(trimKeyEarly) : null;
  const partEdgesRaw = partConfig?.edges || null;

  if (!partConfigHasEnabledEdgeSide(partConfig)) {
    resetTrimMeshPlain(mesh);
    return;
  }

  const partBind = trimKeyEarly ? resolvePartEdgeBindingFromTrimConfig(trimKeyEarly) : null;
  const binding = partBind?.edgeId
    ? { edgeType: partBind.edgeType || 'butt_butts', edgeId: partBind.edgeId }
    : null;

  if (!binding?.edgeId) {
    resetTrimMeshPlain(mesh);
    return;
  }

  const meta = await fetchEdgeCatalogMeta(binding.edgeId, binding.edgeType, {
    variantId: partBind?.edgeVariantId,
  });
  if (passId !== __trimEdgeApplyPass) return;
  if (!meta) {
    resetTrimMeshPlain(mesh);
    return;
  }

  const trimKey = trimKeyEarly || mesh.userData?.trimPartKey || resolveTrimPartKeyFromMesh(mesh);
  let edges = partConfig ? mergeTrimPartEdgesWithBinding(partConfig, meta) : null;
  if (!mergedEdgesHaveAppliedStrip(edges)) {
    resetTrimMeshPlain(mesh);
    return;
  }

  const baseForOri = captureTrimBaseSize(mesh);
  const edgeOri = trimKey
    ? getTrimPartEdgeOrientation(trimKey, baseForOri)
    : baseForOri
      ? inferTrimEdgeOrientationFromBox(baseForOri.w, baseForOri.h, baseForOri.d) || 'f'
      : 'f';
  applyTrimEdgesToPlank(mesh, edges, meta, edgeOri, partEdgesRaw);
}

/**
 * Обновить кромки на всех планках/накладках обклада в сцене.
 * @param {THREE.Scene} scene
 */
export async function refreshSectionTrimEdges(scene, options = {}) {
  if (!scene || typeof THREE === 'undefined') return;
  let n = 0;
  scene.traverse((obj) => {
    if (!isSectionTrimFacadeMesh(obj) || obj.userData?.isEdge) return;
    prepareTrimMeshObkladVisual(obj);
    n++;
  });
  if (n > 0) {
    console.log('[TRIM-EDGE] Room trim meshes prepared:', n);
  }

  if (ROOM_TRIM_UNCUT_INDICATORS_ENABLED) {
    let uncutMeshes = 0;
    let uncutStrips = 0;
    scene.traverse((obj) => {
      if (!isSectionTrimFacadeMesh(obj) || obj.userData?.isEdge) return;
      const added = applyObkladUncutIndicatorsToMesh(obj);
      if (added > 0) {
        uncutMeshes++;
        uncutStrips += added;
      }
    });
    if (uncutMeshes > 0) {
      console.log('[TRIM-EDGE] Room uncut indicators (obklad):', uncutMeshes, 'meshes,', uncutStrips, 'sides');
    }
  }

  if (!ROOM_TRIM_EDGE_VISUAL_ENABLED) {
    refreshTrimPartNumberLabels(scene);
    return;
  }

  const passId = ++__trimEdgeApplyPass;
  const fallbackOutside = getStep5OutsideFallback(options.fallbackOutside);
  await ensureTrimEdgeCatalogPreloaded();
  const meshes = [];
  scene.traverse((obj) => {
    if (isSectionTrimFacadeMesh(obj) && !obj.userData?.isEdge) meshes.push(obj);
  });
  if (!meshes.length) {
    refreshTrimPartNumberLabels(scene);
    return;
  }
  await Promise.all(meshes.map((m) => applyEdgesToTrimMesh(m, passId, fallbackOutside)));
  refreshTrimPartNumberLabels(scene);
}

/** Убрать синие бейджи № обклада с оверлея. */
export function clearTrimPartNumberLabels() {
  if (!window.trimPartNumberLabels) window.trimPartNumberLabels = [];
  window.trimPartNumberLabels.forEach((label) => {
    if (label?.parentNode) label.parentNode.removeChild(label);
  });
  window.trimPartNumberLabels = [];
}

export function refreshTrimPartNumberLabels(scene) {
  clearTrimPartNumberLabels();
  if (!isTrimPartNumberLabelsVisible() || !scene) return;
  if (!window.sceneIconsContainer) {
    console.warn('[TRIM-LABEL] нет sceneIconsContainer — метки обклада не созданы');
    return;
  }

  let count = 0;
  scene.traverse((obj) => {
    if (!isSectionTrimFacadeMesh(obj) || obj.userData?.isEdge || obj.userData?.isUncutEdge) return;
    const key =
      obj.userData?.trimPartKey ||
      resolveTrimPartKeyFromMesh(obj, obj.userData?.trimWallName || obj.userData?.wallName);
    if (key && !obj.userData.trimPartKey) obj.userData.trimPartKey = key;
    const no = obj.userData?.trimPartNo ?? getTrimPartNumber(key);
    if (no != null && !obj.userData.trimPartNo) obj.userData.trimPartNo = no;
    if (!no || !key) return;

    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const pos = new THREE.Vector3(center.x, box.max.y + 55, center.z);
    const row = getTrimPartRowByKey(key);
    const label = createDimensionLabel(String(no), pos, 'trim-part-number-label', {
      fontSize: '20px',
      fontWeight: '800',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 100, 180, 0.94)',
      border: '2px solid #ffffff',
      padding: '5px 11px',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
      zIndex: '1300',
    });
    if (!label) return;
    label.title = row?.label ? `${no}. ${row.label}` : `${no}. ${key}`;
    label.userData.trimPartKey = key;
    label.userData.trimPartNo = no;
    label.userData.trimMeshUuid = obj.uuid;
    if (!window.trimPartNumberLabels) window.trimPartNumberLabels = [];
    window.trimPartNumberLabels.push(label);
    count++;
  });
  if (count > 0) {
    console.log('[TRIM-LABEL] метки обклада:', count);
  }
}
