/**
 * Kitchen side-panels — live scene adapter (STEP 2G).
 * Read-only: собирает U/Y/Z snapshot из существующих bbox/trim API и зовёт clearance.
 * Не меняет scene, W/H/D, balancer, place, draft, UI.
 */

import { state } from '../utils/state.js';
import {
  isKitchenBaseGroup,
  isKitchenTallGroup,
} from './kitchen-base-engine.js?v=20261031-side3a';
import {
  computeFurnitureCorpusLayoutWorldBBoxNoAo,
  withFurnitureDoorSwingsClosedForMeasure,
} from '../furniture/furniture-bbox.js?v=20261011-bbox-fix2';
import {
  computeSectionInnerBoundsU,
  getSectionEdgeTrimInsets,
  predictSectionEdgeTrimInsets,
  SIDE_OVERLAY_INSET_MM,
} from '../sections/section-edge-trim-insets.js?v=20260917-endcab-nobridge';
import {
  evaluateKitchenSidePanelClearance,
  KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM,
  buildKitchenModuleCorpusBoxMm,
} from './kitchen-side-panels-clearance.js?v=20261031-side2v';

/**
 * Канон ряда (как Maatkasten UI / getSectionFillerUiMm):
 * left = min U, right = max U — независимо от wallName.
 * @param {'left'|'right'|string} side
 * @returns {'minU'|'maxU'|null}
 */
export function mapKitchenSidePanelSideToFace(side) {
  const s = String(side || '')
    .trim()
    .toLowerCase();
  if (s === 'left') return 'minU';
  if (s === 'right') return 'maxU';
  return null;
}

/**
 * @param {string} wallName
 * @returns {{ u: 'x'|'z', d: 'x'|'z', useZ: boolean }}
 */
export function kitchenSectionWallAxes(wallName) {
  const w = String(wallName || 'back')
    .trim()
    .toLowerCase();
  if (w === 'left' || w === 'right') return { u: 'z', d: 'x', useZ: true };
  return { u: 'x', d: 'z', useZ: false };
}

/**
 * @param {object|null|undefined} sectionData
 * @returns {object|null}
 */
export function findKitchenSectionDataForModule(group) {
  const sid = group?.userData?.sectionId;
  if (sid == null) return null;
  const list = state?.customSections;
  if (!Array.isArray(list)) return null;
  return list.find((s) => s && String(s.id) === String(sid)) || null;
}

/**
 * Ширина ячейки из штампов place (как kitchen-run-overlays.moduleCellWidthMm).
 * @param {object} group
 * @returns {number}
 */
function _moduleCellWidthMm(group) {
  const ud = group?.userData || {};
  const candidates = [
    ud.customWidthMm,
    ud.__kitchenCellWidthMm,
    ud.__zoneWidthMm,
    ud.zoneWidthMm,
    ud.__initialSectionSizeMm?.x,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (n > 50 && n < 5000) return Math.round(n);
  }
  return 0;
}

/**
 * Корпусный world bbox — существующий furniture-bbox (без декора/AO).
 * @param {object} group
 * @returns {object|null} THREE.Box3
 */
export function measureKitchenModuleCorpusWorldBBox(group) {
  if (!group) return null;
  try {
    if (typeof group.updateMatrixWorld === 'function') group.updateMatrixWorld(true);
    const corpus = withFurnitureDoorSwingsClosedForMeasure(group, () =>
      computeFurnitureCorpusLayoutWorldBBoxNoAo(group)
    );
    if (corpus && !corpus.isEmpty?.()) return corpus;
  } catch (_) {
    return null;
  }
  return null;
}

/**
 * U/Y/D box модуля в мировых мм вдоль осей стены (канон run-overlays).
 * @param {object} group
 * @param {string} wallName
 * @returns {{ id: string, kind: string, u0: number, u1: number, y0: number, y1: number, z0: number, z1: number }|null}
 */
export function buildKitchenModuleClearanceBoxFromScene(group, wallName) {
  if (!isKitchenBaseGroup(group)) return null;
  const axes = kitchenSectionWallAxes(wallName);
  const bb = measureKitchenModuleCorpusWorldBBox(group);
  if (!bb) return null;
  let gMinU = axes.useZ ? bb.min.z : bb.min.x;
  let gMaxU = axes.useZ ? bb.max.z : bb.max.x;
  let corpusW = gMaxU - gMinU;
  const cellW = _moduleCellWidthMm(group);
  const mid =
    Number.isFinite(gMinU) && Number.isFinite(gMaxU) ? (gMinU + gMaxU) / 2 : NaN;
  const ud = group.userData || {};
  const isCorner =
    ud.__kitchenCornerSideAtMinU != null ||
    String(ud.__placementKindProfileId || ud.productKind || '').includes('corner') ||
    /(^|_)44$/.test(String(ud.catalogType || ud.__catalogType || ''));
  // Как kitchen-run-overlays.moduleWallSpanU: ячейка — истина по W при раздутом bbox.
  if (cellW > 50 && (isCorner || !(corpusW > 50) || corpusW > cellW + 8)) {
    if (isCorner && ud.__kitchenCornerSideAtMinU === true) {
      const anchorMax = Number.isFinite(gMaxU) ? gMaxU : mid + cellW / 2;
      gMaxU = anchorMax;
      gMinU = anchorMax - cellW;
    } else if (isCorner && ud.__kitchenCornerSideAtMinU === false) {
      const anchorMin = Number.isFinite(gMinU) ? gMinU : mid - cellW / 2;
      gMinU = anchorMin;
      gMaxU = anchorMin + cellW;
    } else {
      gMinU = mid - cellW / 2;
      gMaxU = mid + cellW / 2;
    }
  }
  if (!(gMaxU > gMinU)) return null;
  const y0 = Number(bb.min.y);
  const y1 = Number(bb.max.y);
  const z0 = axes.useZ ? Number(bb.min.x) : Number(bb.min.z);
  const z1 = axes.useZ ? Number(bb.max.x) : Number(bb.max.z);
  if (![y0, y1, z0, z1].every((n) => Number.isFinite(n)) || !(y1 > y0) || !(z1 > z0)) {
    return null;
  }
  return {
    id: String(group.uuid || ud.uuid || ''),
    kind: isKitchenTallGroup(group) ? 'tall' : 'module',
    u0: gMinU,
    u1: gMaxU,
    y0,
    y1,
    z0,
    z1,
  };
}

/**
 * Trim-боксы по inset API (не mesh size).
 * detect↔predict расходятся → торец помечаем unconfirmed, бокс не выдумываем.
 * @param {object} sectionData
 * @param {{ y0: number, y1: number, z0: number, z1: number }} spanYZ
 */
function _collectSectionTrimOccupiers(sectionData, spanYZ) {
  const bounds = computeSectionInnerBoundsU(sectionData);
  const wallName = sectionData.wallName || sectionData.division?.wallName || 'back';
  /** @type {object[]} */
  const occupiers = [];
  /** @type {Array<'min'|'max'>} */
  const unconfirmedEdges = [];

  for (const edge of /** @type {const} */ (['min', 'max'])) {
    const detected = getSectionEdgeTrimInsets(sectionData, edge);
    const predicted = predictSectionEdgeTrimInsets(sectionData, edge);
    if (
      sectionData.group &&
      detected.kind === 'none' &&
      predicted.kind !== 'none' &&
      Number(predicted.insetMm) > 0
    ) {
      unconfirmedEdges.push(edge);
      continue;
    }
    const inset = Math.round(Number(detected.insetMm) || 0);
    const kind = String(detected.kind || 'none');
    if (!(inset > 0) || kind === 'none' || kind === 'end_cabinet_flush') continue;
    const isMin = edge === 'min';
    const u0 = isMin ? bounds.outerMinU : bounds.outerMaxU - inset;
    const u1 = isMin ? bounds.outerMinU + inset : bounds.outerMaxU;
    if (!(u1 > u0)) {
      unconfirmedEdges.push(edge);
      continue;
    }
    const boxKind =
      kind === 'plank' ? 'section_side_plank' : 'section_side_overlay';
    occupiers.push({
      id: `section_trim_${edge}_${kind}`,
      kind: boxKind,
      u0,
      u1,
      y0: spanYZ.y0,
      y1: spanYZ.y1,
      z0: spanYZ.z0,
      z1: spanYZ.z1,
      _insetMm: inset,
      _edge: edge,
      _trimKind: kind,
      _wallName: wallName,
    });
  }

  return {
    occupiers,
    unconfirmedEdges,
    bounds,
    overlayThicknessCanon: SIDE_OVERLAY_INSET_MM,
  };
}

/**
 * Read-only snapshot для clearance. Не вызывает setZoneCustomWidthMm / rebuild / layout mutate.
 *
 * @param {object} group — furniture root
 * @param {'left'|'right'} side
 * @returns {{ ok: true, snapshot: object } | { ok: false, reasonCode: string, message: string }}
 */
export function collectKitchenSidePanelClearanceSnapshot(group, side) {
  const face = mapKitchenSidePanelSideToFace(side);
  if (!face) {
    return {
      ok: false,
      reasonCode: 'invalid_side',
      message: 'Сторона должна быть left или right.',
    };
  }
  if (!group?.userData?.isFurniture) {
    return {
      ok: false,
      reasonCode: 'not_furniture',
      message: 'Объект не является экземпляром мебели.',
    };
  }
  if (!isKitchenBaseGroup(group)) {
    return {
      ok: false,
      reasonCode: 'not_kitchen_module',
      message: 'Объект не распознан как кухонный модуль.',
    };
  }

  const section = findKitchenSectionDataForModule(group);
  if (!section) {
    return {
      ok: false,
      reasonCode: 'missing_section',
      message: 'Не найдена секция экземпляра.',
    };
  }
  const wallName = String(section.wallName || section.division?.wallName || group.userData.wallName || '')
    .trim()
    .toLowerCase();
  if (!wallName) {
    return {
      ok: false,
      reasonCode: 'missing_wall',
      message: 'Не задана ориентация секции относительно стены.',
    };
  }

  const subject = buildKitchenModuleClearanceBoxFromScene(group, wallName);
  if (!subject) {
    return {
      ok: false,
      reasonCode: 'missing_corpus_bbox',
      message: 'Нет достоверного корпусного bbox модуля.',
    };
  }

  let bounds;
  try {
    bounds = computeSectionInnerBoundsU(section);
  } catch (e) {
    return {
      ok: false,
      reasonCode: 'section_bounds_failed',
      message: String(e?.message || e),
    };
  }
  if (
    !Number.isFinite(bounds?.outerMinU) ||
    !Number.isFinite(bounds?.outerMaxU) ||
    !(bounds.outerMaxU > bounds.outerMinU)
  ) {
    return {
      ok: false,
      reasonCode: 'invalid_section_bounds',
      message: 'Границы секции по U недостоверны.',
    };
  }

  const scene = state.scene;
  if (!scene || typeof scene.traverse !== 'function') {
    return {
      ok: false,
      reasonCode: 'missing_scene',
      message: 'Сцена недоступна.',
    };
  }

  const sectionId = String(section.id);
  /** @type {object[]} */
  const neighbors = [];
  scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sectionId) return;
    if (obj === group) return;
    if (obj.userData.isEndCabinet || obj.userData.isEndCabinetSlot) return;
    if (!isKitchenBaseGroup(obj)) return;
    const box = buildKitchenModuleClearanceBoxFromScene(obj, wallName);
    if (box) neighbors.push(box);
  });

  // YZ для trim: объединение subject + соседей (иначе trim без пересечения YZ игнорируется).
  let y0 = subject.y0;
  let y1 = subject.y1;
  let z0 = subject.z0;
  let z1 = subject.z1;
  for (const n of neighbors) {
    y0 = Math.min(y0, n.y0);
    y1 = Math.max(y1, n.y1);
    z0 = Math.min(z0, n.z0);
    z1 = Math.max(z1, n.z1);
  }
  // Чуть расширяем по Y, чтобы секционный trim (на всю высоту ряда) гарантированно пересекался.
  const secH = Number(section.size?.y);
  if (Number.isFinite(secH) && secH > y1 - y0) {
    y0 = Math.min(y0, 0);
    y1 = Math.max(y1, secH);
  }

  const trim = _collectSectionTrimOccupiers(section, { y0, y1, z0, z1 });

  return {
    ok: true,
    snapshot: {
      side: String(side).toLowerCase(),
      face,
      wallName,
      requiredMm: KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM,
      subject,
      occupiers: [...neighbors, ...trim.occupiers],
      section: { u0: bounds.outerMinU, u1: bounds.outerMaxU },
      sectionId,
      zoneIndex: group.userData.zoneIndex,
      unconfirmedTrimEdges: trim.unconfirmedEdges.slice(),
      trim: {
        min: bounds.minEdge,
        max: bounds.maxEdge,
        overlayCanonMm: trim.overlayThicknessCanon,
      },
    },
  };
}

/**
 * Публичная read-only проверка стороны модуля → clearance.
 * @param {object} group
 * @param {'left'|'right'} side
 * @returns {import('./kitchen-side-panels-clearance.js').KitchenSidePanelClearanceResult & { adapterReasonCode?: string, snapshot?: object }}
 */
export function evaluateKitchenModuleSidePanelClearanceLive(group, side) {
  const collected = collectKitchenSidePanelClearanceSnapshot(group, side);
  if (!collected.ok) {
    return {
      status: 'unknown',
      availableMm: null,
      requiredMm: KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM,
      reasonCode: collected.reasonCode,
      blockerId: null,
      adapterReasonCode: collected.reasonCode,
      message: collected.message,
    };
  }
  const snap = collected.snapshot;
  const result = evaluateKitchenSidePanelClearance({
    face: snap.face,
    requiredMm: snap.requiredMm,
    subject: snap.subject,
    occupiers: snap.occupiers,
    section: snap.section,
  });

  // Если ответ опирается на торец секции с неподтверждённым trim — не выдаём clear/blocked.
  // Внутренний зазор до соседа (available << до конца секции) trim не затрагивает.
  const faceEdge = snap.face === 'minU' ? 'min' : 'max';
  const trimUnconfirmed = (snap.unconfirmedTrimEdges || []).includes(faceEdge);
  if (trimUnconfirmed) {
    const spanToSectionEnd =
      snap.face === 'minU'
        ? Number(snap.subject?.u0) - Number(snap.section?.u0)
        : Number(snap.section?.u1) - Number(snap.subject?.u1);
    const clearsToSectionEnd =
      result.status === 'clear' &&
      result.availableMm != null &&
      Number.isFinite(spanToSectionEnd) &&
      Math.abs(spanToSectionEnd - Number(result.availableMm)) <= 1.5;
    const dependsOnSectionEnd =
      result.blockerId === `section_${faceEdge === 'min' ? 'minU' : 'maxU'}` ||
      String(result.blockerId || '').startsWith('section_trim_') ||
      clearsToSectionEnd;
    // blocked соседом (модуль/пенал) — trim не нужен.
    const blockedByNeighbor =
      result.status === 'blocked' &&
      result.blockerId &&
      !String(result.blockerId).startsWith('section_');
    if (!blockedByNeighbor && dependsOnSectionEnd) {
      return {
        status: 'unknown',
        availableMm: null,
        requiredMm: result.requiredMm,
        reasonCode: 'trim_state_unconfirmed',
        blockerId: null,
        adapterReasonCode: 'trim_state_unconfirmed',
        message:
          'Секционный trim на проверяемом торце: mesh-detect и predict расходятся.',
        snapshot: snap,
        underlying: result,
      };
    }
  }

  return {
    ...result,
    snapshot: snap,
  };
}

/** Для тестов без THREE: прогон clearance из готового snapshot. */
export function evaluateKitchenSidePanelClearanceFromSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return evaluateKitchenSidePanelClearance(null);
  }
  return evaluateKitchenSidePanelClearance({
    face: snapshot.face,
    requiredMm: snapshot.requiredMm ?? KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM,
    subject: snapshot.subject,
    occupiers: snapshot.occupiers || [],
    section: snapshot.section,
  });
}

export { buildKitchenModuleCorpusBoxMm };

if (typeof window !== 'undefined') {
  window.__cldEvaluateKitchenSidePanelClearanceLive =
    evaluateKitchenModuleSidePanelClearanceLive;
  window.__cldCollectKitchenSidePanelClearanceSnapshot =
    collectKitchenSidePanelClearanceSnapshot;
  window.__cldMapKitchenSidePanelSideToFace = mapKitchenSidePanelSideToFace;
}
