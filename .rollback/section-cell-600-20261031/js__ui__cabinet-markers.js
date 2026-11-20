// Cabinet markers module - manages cabinet placement guide markers on sections
// Handles visual markers showing optimal cabinet placement divisions

import { state } from '../utils/state.js';
import { getWallAxes, getAxisCoord, makeWorldPointFromWallAxes } from '../utils/wall-coords.js';
import {
  computeFurnitureWorldBBoxNoAo,
  withFurnitureDoorSwingsClosedForMeasure,
} from '../furniture/furniture-bbox.js?v=20261011-bbox-fix2';
import { getLShapeMeta, getBackAttachedCornerBase } from '../sections/section-manager.js?v=20261031-secfix1';
import {
  getPhysicalSideTrimInsetMm,
  SIDE_OVERLAY_INSET_MM,
  SIDE_PLANK_INSET_MM,
} from '../sections/section-edge-trim-insets.js?v=20260921-trim-edge1';
import {
  getSectionZoneTransitionGaps,
  cumulativeTransitionGapMm,
} from '../sections/section-transition-manager.js?v=20261027-nmu142g';

// Cabinet size constants (in mm)
const TWO_DOOR_CABINET_MIN = 800; // 80 cm minimum
const TWO_DOOR_CABINET_MAX = 1200; // 120 cm maximum
const ONE_DOOR_CABINET_MIN = 400; // 40 cm minimum
const ONE_DOOR_CABINET_MAX = 600; // 60 cm maximum
const MARKER_EXTENSION = 1000; // 1 meter extension from section
/** Чуть выше верха покрытия пола (Room.js: coatingThickness = 10 мм). */
const MARKER_FLOOR_Y_OFFSET_MM = 12;

/** Линии разметки: depthTest выкл. — иначе уходят под пол (y+5 < верх пола 10 мм); под мебелью режем по footprint. */
function cabinetMarkerLineMaterial(overrides = {}) {
  return new THREE.LineBasicMaterial({
    depthTest: false,
    depthWrite: false,
    ...overrides,
  });
}

function cabinetMarkerDashedLineMaterial(overrides = {}) {
  return new THREE.LineDashedMaterial({
    depthTest: false,
    depthWrite: false,
    ...overrides,
  });
}

/** Вычесть блоки [c,d] из интервала [a,b] по оси глубины (W). */
function subtractWIntervals(wLo, wHi, blocks) {
  let segments = [[wLo, wHi]];
  for (const [c, d] of blocks) {
    const blockLo = Math.min(c, d);
    const blockHi = Math.max(c, d);
    const next = [];
    for (const [a, b] of segments) {
      if (blockHi <= a || blockLo >= b) {
        next.push([a, b]);
        continue;
      }
      if (a < blockLo) next.push([a, Math.min(b, blockLo)]);
      if (blockHi < b) next.push([Math.max(a, blockHi), b]);
    }
    segments = next;
  }
  return segments.filter(([a, b]) => b - a > 0.5);
}

function bboxToFootprintOnWallAxes(wallName, bbox) {
  const axes = getWallAxes(wallName);
  const uA = getAxisCoord(bbox.min, axes.u.axis);
  const uB = getAxisCoord(bbox.max, axes.u.axis);
  const wA = getAxisCoord(bbox.min, axes.w.axis);
  const wB = getAxisCoord(bbox.max, axes.w.axis);
  return {
    uMin: Math.min(uA, uB),
    uMax: Math.max(uA, uB),
    wMin: Math.min(wA, wB),
    wMax: Math.max(wA, wB),
  };
}

function collectFurnitureFootprintsForSection(sectionId, wallName) {
  const footprints = [];
  if (!state.scene || !sectionId || sectionId === 'ghost') return footprints;
  const seen = new Set();
  state.scene.traverse((obj) => {
    const ud = obj.userData || {};
    if (!ud.isFurniture) return;
    if (String(ud.sectionId) !== String(sectionId)) return;
    if (seen.has(obj.uuid)) return;
    seen.add(obj.uuid);
    const bbox = withFurnitureDoorSwingsClosedForMeasure(obj, () =>
      computeFurnitureWorldBBoxNoAo(obj)
    );
    if (!bbox || bbox.isEmpty()) return;
    footprints.push(bboxToFootprintOnWallAxes(wallName, bbox));
  });
  return footprints;
}

function clipMarkerSegmentsAlongW(wNear, wFar, uAxisCoord, footprints) {
  const wLo = Math.min(wNear, wFar);
  const wHi = Math.max(wNear, wFar);
  if (!footprints.length) return [[wLo, wHi]];
  const blocks = [];
  for (const fp of footprints) {
    if (uAxisCoord < fp.uMin - 0.5 || uAxisCoord > fp.uMax + 0.5) continue;
    blocks.push([fp.wMin - 2, fp.wMax + 2]);
  }
  if (!blocks.length) return [[wLo, wHi]];
  return subtractWIntervals(wLo, wHi, blocks);
}

function addClippedCabinetMarkerLine({
  markers,
  sectionId,
  sectionGroup,
  sectionPos,
  wallName,
  uAxisCoord,
  wNear,
  wFar,
  markerY,
  footprints,
  material,
  dashed = false,
}) {
  const segments = clipMarkerSegmentsAlongW(wNear, wFar, uAxisCoord, footprints);
  for (const [w0, w1] of segments) {
    const lineStart = makeWorldPointFromWallAxes(wallName, {
      uAxisCoord,
      wAxisCoord: w0,
      vY: markerY,
    });
    const lineEnd = makeWorldPointFromWallAxes(wallName, {
      uAxisCoord,
      wAxisCoord: w1,
      vY: markerY,
    });
    const p1 = sectionId === 'ghost' ? lineStart.clone().sub(sectionPos) : lineStart;
    const p2 = sectionId === 'ghost' ? lineEnd.clone().sub(sectionPos) : lineEnd;
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const line = new THREE.Line(lineGeometry, material);
    if (dashed) line.computeLineDistances();
    line.userData.isCabinetMarker = true;
    line.userData.sectionId = sectionId;
    (sectionId === 'ghost' ? sectionGroup : state.scene).add(line);
    markers.push(line);
  }
}

/** Шкаф 50 / кухня 0 — тот же источник, что corner-joint.resolveCornerGapMm. */
function resolveFixedLShapeCornerGapMm() {
  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.__cldResolveCornerGapMm === 'function'
    ) {
      return Math.round(Number(window.__cldResolveCornerGapMm()) || 0);
    }
  } catch (_) {}
  return 0;
}

// Section facade elements (дублируем значения из section-manager, чтобы избежать циклического импорта)
const SIDE_PLANK_WIDTH_MM = SIDE_PLANK_INSET_MM;
const SIDE_OVERLAY_THICKNESS_MM = SIDE_OVERLAY_INSET_MM;

// Локальная ось U вдоль стены и вспомогательные функции для построения линий
// разметки по одной и той же оси независимо от того, задняя это стена, передняя
// или боковая. В качестве координаты вдоль стены мы всегда используем U:
//  - для задней/передней стены U совпадает с мировой осью X;
//  - для левой/правой стены U совпадает с мировой осью Z.
// Это первый шаг к тому, чтобы одна и та же логика деления/маркеров работала
// для любой стены, а не только для "back".
function buildMarkerLineEndpointsAlongWall(
  wallName,
  sectionPos,
  depth,
  markerExtension,
  wallZ,
  uCoord,
  markerY
) {
  const axes = getWallAxes(wallName);
  // Абсолютные мировые координаты вдоль U (ось деления):
  // - front/back: uCoord = world X
  // - left/right: uCoord = world Z
  const uAxisCoord = uCoord;

  // Абсолютная мировая координата на плоскости стены вдоль W:
  // - front/back: W = Z, берём wallZ (как и раньше)
  // - left/right: W = X, берём sectionPos.x (как и раньше)
  const wAxisCoord = axes.w.axis === 'z' ? wallZ : sectionPos.x;

  // Сохраняем legacy-длину "внутрь": для front/back как раньше depth+extension, для боковых — только extension.
  const extendW =
    axes.w.axis === 'z' ? depth + markerExtension : markerExtension;
  const innerWAxisCoord = wAxisCoord + axes.w.sign * extendW;

  const lineStart = makeWorldPointFromWallAxes(wallName, {
    uAxisCoord,
    wAxisCoord,
    vY: markerY,
  });
  const lineEnd = makeWorldPointFromWallAxes(wallName, {
    uAxisCoord,
    wAxisCoord: innerWAxisCoord,
    vY: markerY,
  });

  return { lineStart, lineEnd, wNear: wAxisCoord, wFar: innerWAxisCoord };
}

/**
 * Find optimal division of section for cabinet placement
 * (портировано из legacy main.js, чтобы разметка совпадала)
 * @param {number} size - Section size in mm
 * @returns {{ parts: number, partSize: number, type: string }} Division data
 */
function findOptimalDivision(size) {
  let bestDivision = null;
  let bestScore = -Infinity;

  // Пробуем деления от 2 до 20 частей
  for (let parts = 2; parts <= 20; parts++) {
    const partSize = size / parts;

    // Диапазон для двухдверных шкафов
    if (partSize >= TWO_DOOR_CABINET_MIN && partSize <= TWO_DOOR_CABINET_MAX) {
      const score = 1000 - Math.abs(partSize - 1000); // идеал 1000 мм
      if (score > bestScore) {
        bestScore = score;
        bestDivision = { parts, partSize, type: 'twoDoor' };
      }
    } else if (partSize >= ONE_DOOR_CABINET_MIN && partSize <= ONE_DOOR_CABINET_MAX) {
      // Диапазон для однодверных шкафов
      const score = 500 - Math.abs(partSize - 500); // идеал 500 мм
      if (score > bestScore) {
        bestScore = score;
        bestDivision = { parts, partSize, type: 'oneDoor' };
      }
    }
  }

  // Fallback: деление по ~1000мм или 500мм
  if (!bestDivision) {
    const twoDoorParts = Math.floor(size / 1000);
    if (twoDoorParts > 0) {
      bestDivision = {
        parts: twoDoorParts,
        partSize: size / twoDoorParts,
        type: 'twoDoor'
      };
    } else {
      const oneDoorParts = Math.floor(size / 500);
      if (oneDoorParts > 0) {
        bestDivision = {
          parts: oneDoorParts,
          partSize: size / oneDoorParts,
          type: 'oneDoor'
        };
      } else {
        bestDivision = { parts: 2, partSize: size / 2, type: 'oneDoor' };
      }
    }
  }

  return bestDivision;
}

/**
 * Специализированный подбор деления для задней части L‑углового шкафа.
 *
 * Требования ТЗ (обновлённые):
 *  - во "свободной" части W_free имеется N одинарных зон шириной S;
 *  - S в диапазоне [400; 600] мм;
 *  - обычная двойная зона = 2S в диапазоне [800; 1200] мм;
 *  - если в конце не помещается ещё одна полная двойная 2S, допускаем одну
 *    лишнюю одинарную зону S в дальнем конце (extraSingleLeft).
 *
 * Возвращаем структуру, совместимую с findOptimalDivision, но дополняем:
 *  { parts, partSize, type, singleWidthMm, extraSingleLeft }
 *    parts           — количество ДВОЙНЫХ зон (2S);
 *    partSize        — ширина обычной двойной зоны = 2S;
 *    singleWidthMm   — ширина одинарной зоны S;
 *    extraSingleLeft — true, если есть лишняя одинарная слева (в начале W_free).
 *
 * @param {number} freeSizeMm - W_free, свободная ширина задней секции (без угла и зазора)
 * @returns {{ parts: number, partSize: number, type: string, singleWidthMm: number, extraSingleLeft: boolean } | null}
 */
function findOptimalLShapeBackDivision(freeSizeMm) {
  if (!Number.isFinite(freeSizeMm) || freeSizeMm <= 0) return null;

  // Ограничим разумное количество одинарных зон в свободной части.
  const MAX_SINGLE_ZONES = 20;
  const idealSingle = 500;

  let best = null;
  let bestScore = -Infinity;

  // N_singles = 2 * parts (+1, если есть лишняя одинарная).
  for (let nSingles = 2; nSingles <= MAX_SINGLE_ZONES; nSingles++) {
    const singleWidth = freeSizeMm / nSingles; // S

    if (
      singleWidth < ONE_DOOR_CABINET_MIN ||
      singleWidth > ONE_DOOR_CABINET_MAX
    ) {
      continue;
    }

    const doubleWidth = singleWidth * 2;
    if (
      doubleWidth < TWO_DOOR_CABINET_MIN ||
      doubleWidth > TWO_DOOR_CABINET_MAX
    ) {
      continue;
    }

    // В freeSizeMm умещается nSingles единиц S.
    // Одна S уходит в левую часть спец-зоны, остаётся (nSingles-1) регулярных слотов.
    // Из них floor((nSingles-1)/2) — двойные (2S), и есть лишняя одинарная если (nSingles-1) нечётно.
    // parts = количество мебельных зон = kDoubles (двойные) + 1 (специальная).
    const kDoubles = Math.floor((nSingles - 1) / 2);
    const parts = kDoubles + 1; // итого мебельных зон
    if (parts <= 0) continue;

    const extraSingleLeft = (nSingles - 1) % 2 === 1; // лишняя одинарная слева, если (nSingles-1) нечётно

    // Оценка: чем ближе S к 500 и чем больше двойных зон, тем лучше.
    let score = 1000 - Math.abs(singleWidth - idealSingle) + parts * 10;
    // Лёгкий приоритет схемы с лишней одинарной слева, когда она возможна.
    if (extraSingleLeft) score += 20;

    if (score > bestScore) {
      bestScore = score;
      best = {
        parts,
        partSize: doubleWidth,
        type: 'twoDoor',
        singleWidthMm: singleWidth,
        extraSingleLeft,
      };
    }
  }

  return best;
}

/**
 * Add cabinet placement markers to section
 * @param {string} sectionId - Section ID
 * @param {THREE.Group} sectionGroup - Section group (или призрак для sectionId === 'ghost')
 * @param {number} width - Section width in mm
 * @param {number} height - Section height in mm
 * @param {number} depth - Section depth in mm
 * @param {string} wallName - Wall name ('front', 'back', 'left', 'right')
 */
export function addCabinetMarkers(sectionId, sectionGroup, width, height, depth, wallName) {
  if (!sectionGroup || !state.scene) {
    console.warn('⚠️ addCabinetMarkers: нет sectionGroup или scene');
    return;
  }
  
  console.log('🔧 addCabinetMarkers вызвана:', { sectionId, width, height, depth, wallName });
  
  // Remove old markers
  removeCabinetMarkers(sectionId);
  
  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const sectionPos = sectionGroup.position.clone();

  // Пытаемся найти sectionData для доступа к логическим offsets
  const sectionData =
    sectionId === 'ghost'
      ? null
      : (state.customSections || []).find((s) => s.id === sectionId) || null;
  const authoritativeDivision =
    sectionId !== 'ghost' && sectionData && sectionData.division
      ? sectionData.division
      : null;

  const offsets = sectionData && sectionData.offsets ? sectionData.offsets : null;
  const wallFromData = sectionData && sectionData.wallName ? sectionData.wallName : wallName;
  
  // Determine wall position and section size for marking
  let sectionSize;
  let sectionStart, sectionEnd;
  
  if (wallName === 'front' || wallName === 'back') {
    const innerLeftOffset = sectionData
      ? getPhysicalSideTrimInsetMm(sectionData, wallName, 'left')
      : 0;
    const innerRightOffset = sectionData
      ? getPhysicalSideTrimInsetMm(sectionData, wallName, 'right')
      : 0;

    const rawInnerSize = width - innerLeftOffset - innerRightOffset;
    sectionSize = rawInnerSize > 0 ? rawInnerSize : width;
    sectionStart =
      wallName === 'front'
        ? sectionPos.x - width + innerLeftOffset
        : sectionPos.x + innerLeftOffset;
    sectionEnd = sectionStart + sectionSize;

    if (wallName === 'back') {
      console.log('[SECT-MARKERS back] division frame:', {
        width,
        innerLeftOffset,
        innerRightOffset,
        sectionSize,
        sectionStart,
        sectionEnd,
        sectionPos: { x: sectionPos.x, y: sectionPos.y, z: sectionPos.z },
      });
    }
  } else if (wallName === 'left' || wallName === 'right') {
    const innerFrontOffset = sectionData
      ? getPhysicalSideTrimInsetMm(sectionData, wallName, 'front')
      : 0;
    const innerBackOffset = sectionData
      ? getPhysicalSideTrimInsetMm(sectionData, wallName, 'back')
      : 0;

    const rawInnerSize = depth - innerFrontOffset - innerBackOffset;
    sectionSize = rawInnerSize > 0 ? rawInnerSize : depth;
    // Right: пивот у фасада, секция в Z от sectionPos.z до sectionPos.z + depth → sectionStart = sectionPos.z + ...
    // Left: пивот сзади, секция в Z от sectionPos.z - depth до sectionPos.z → sectionStart от переднего края.
    if (wallName === 'right') {
      sectionStart = sectionPos.z + innerFrontOffset;
    } else {
      sectionStart = sectionPos.z - depth + innerFrontOffset;
    }
    sectionEnd = sectionStart + sectionSize;

    if (wallName === 'right') {
      console.log('[SECT-MARKERS right] inner space:', {
        wallName,
        rawDepth: depth,
        innerFrontOffset,
        innerBackOffset,
        sectionSize,
        sectionStart,
        sectionEnd,
        sectionPos: { x: sectionPos.x, y: sectionPos.y, z: sectionPos.z },
      });
    }
  }
  
  // Для универсальных L‑углов, где ПРИСТАВНАЯ секция стоит на задней стене
  // (corner-left-back / corner-right-back), считаем, что "0" по оси деления
  // для этой секции проходит по фасадной плоскости основной секции.
  // Поэтому перед расчётом деления сдвигаем рамку sectionStart/sectionEnd так,
  // чтобы она начиналась от стыка, а не от стены.
  if (sectionData && wallName === 'back' && sectionData.lShape) {
    const backBase = getBackAttachedCornerBase(sectionData);
    if (backBase && typeof backBase.baseCm === 'number' && backBase.baseCm > 0) {
      const baseMm = backBase.baseCm * 10;
      if (backBase.sideKey === 'left') {
        sectionStart += baseMm;
      } else if (backBase.sideKey === 'right') {
        sectionEnd -= baseMm;
      }
      sectionSize = sectionEnd - sectionStart;
    }
  }

  // For real sections (non-ghost), division from section-manager is authoritative.
  // Marker geometry must follow the same section frame as furniture placement.
  if (
    authoritativeDivision &&
    Number.isFinite(authoritativeDivision.sectionStart) &&
    Number.isFinite(authoritativeDivision.sectionEnd)
  ) {
    sectionStart = Number(authoritativeDivision.sectionStart);
    sectionEnd = Number(authoritativeDivision.sectionEnd);
    sectionSize = sectionEnd - sectionStart;
  }
  
  // Универсальный режим L‑углов через getLShapeMeta.
  let meta = null;
  let cornerSingleWidthMm = null;
  let freeSizeMm = null;
  let lShapeSingleWidthMm = null;
  if (sectionData && sectionData.lShape) {
    meta = getLShapeMeta({ lShape: sectionData.lShape, wallName: wallFromData });
    if (meta) {
      let thicknessAttachedMm = 0;
      try {
        const pairId = sectionData.lShape.pairId || null;
        if (pairId && Array.isArray(state.customSections)) {
          const attachedSection = state.customSections.find(
            (s) =>
              s &&
              s.id === pairId &&
              s.lShape &&
              s.lShape.type === sectionData.lShape.type &&
              s.lShape.role === meta.attached
          );
          if (attachedSection && attachedSection.size) {
            // Толщина приставной секции = размер "внутрь комнаты":
            // - attached на front/back → это Z
            // - attached на left/right → это X
            const isFB = meta.attached === 'front' || meta.attached === 'back';
            thicknessAttachedMm = isFB
              ? (Number.isFinite(attachedSection.size.z) ? attachedSection.size.z : 0)
              : (Number.isFinite(attachedSection.size.x) ? attachedSection.size.x : 0);
          }
        }
      } catch (e) {
        console.warn('⚠️ addCabinetMarkers: не удалось получить толщину приставной секции для L‑угла:', e);
      }
      cornerSingleWidthMm = Math.max(0, thicknessAttachedMm);
      // 5 см углового зазора уже в offsets (left/right) → в размере секции.
      // Не вычитаем FIXED ещё раз только у правого (иначе 197.5 vs 202.5).
      const rawFree = sectionSize - cornerSingleWidthMm;
      freeSizeMm = rawFree > 0 ? rawFree : null;

    }
  }

  // Если freeSizeMm задана (задняя секция L‑угла) — делим только свободное пространство,
  // без угловой зоны и правого зазора. Для остальных секций делим всю внутреннюю ширину.
  const sizeForDivision = freeSizeMm != null ? freeSizeMm : sectionSize;

  let division;
  let segmentsLShapeBack = null;
  let segmentsLShape = null;
  if (
    authoritativeDivision &&
    Number.isFinite(authoritativeDivision.partSize) &&
    Number.isFinite(authoritativeDivision.parts)
  ) {
    division = {
      parts: Number(authoritativeDivision.parts),
      partSize: Number(authoritativeDivision.partSize),
      type: 'authoritative',
    };
    segmentsLShapeBack = Array.isArray(authoritativeDivision.segmentsLShapeBack)
      ? authoritativeDivision.segmentsLShapeBack
      : null;
    segmentsLShape = Array.isArray(authoritativeDivision.segmentsLShape)
      ? authoritativeDivision.segmentsLShape
      : null;
  } else if (meta && freeSizeMm != null && cornerSingleWidthMm != null) {
    const lShapeDivision = findOptimalLShapeBackDivision(freeSizeMm);
    if (lShapeDivision) {
      division = lShapeDivision;
      lShapeSingleWidthMm = lShapeDivision.singleWidthMm || lShapeDivision.partSize / 2;
      const S = lShapeSingleWidthMm;
      const D = cornerSingleWidthMm;
      const nSingles = Math.round(freeSizeMm / S);
      const nRegularSlots = Math.max(0, nSingles - 1);
      const kDoubles = Math.floor(nRegularSlots / 2);
      const hasExtraSingle = nRegularSlots % 2 === 1;
      const cornerStartU = sectionStart + freeSizeMm;
      const freeStartU = sectionStart + D;
      let u = sectionStart;

      const addSeg = (type, widthMm, startU, zoneIndex) => {
        const seg = { type, widthMm, startWorldU: startU, zoneIndex };
        if (meta.primary === 'back') seg.startWorldX = startU;
        segmentsLShape.push(seg);
      };

      segmentsLShape = [];
      if (meta.cornerAtStart) {
        addSeg('special', S + D, sectionStart, 0);
        u = freeStartU + S;
        for (let j = 0; j < kDoubles; j++) {
          addSeg('double', 2 * S, u, j + 1);
          u += 2 * S;
        }
        if (hasExtraSingle) {
          addSeg('single', S, u, -1);
        }
      } else {
        if (hasExtraSingle) {
          addSeg('single', S, u, -1);
          u += S;
        }
        for (let j = 0; j < kDoubles; j++) {
          addSeg('double', 2 * S, u, j);
          u += 2 * S;
        }
        addSeg('special', S + D, cornerStartU - S, division.parts - 1);
      }

      if (meta.primary === 'back') {
        segmentsLShapeBack = segmentsLShape.map((s) => ({ ...s, startWorldX: s.startWorldU }));
      }
    } else {
      division = findOptimalDivision(sizeForDivision);
    }
  } else if (meta && freeSizeMm != null) {
    const lShapeDivision = findOptimalLShapeBackDivision(freeSizeMm);
    if (lShapeDivision) {
      division = lShapeDivision;
      lShapeSingleWidthMm = lShapeDivision.singleWidthMm || lShapeDivision.partSize / 2;
    } else {
      division = findOptimalDivision(sizeForDivision);
    }
  } else {
    division = findOptimalDivision(sizeForDivision);
  }

  const markers = [];
  
  // Высота маркеров (горизонтальные линии на уровне пола)
  const markerY = sectionPos.y + MARKER_FLOOR_Y_OFFSET_MM;
  const markerExtension = MARKER_EXTENSION;

  // Z стены (стык пол–стена): back секция — пивот у стены (Z=0), facade=Z+depth; front — наоборот
  const wallZ = (wallName === 'back') ? sectionPos.z : (wallName === 'front' ? sectionPos.z - depth : 0);

  const furnitureFootprints =
    sectionId !== 'ghost' ? collectFurnitureFootprintsForSection(sectionId, wallName) : [];

  // Зелёный маркер начала секции (у стены)
  try {
    let originPos;
    if (wallName === 'front' || wallName === 'back') {
      originPos = new THREE.Vector3(sectionStart, sectionPos.y, wallZ);
    } else {
      const backX = sectionPos.x;
      originPos = new THREE.Vector3(backX, sectionPos.y, sectionStart);
    }

    const localOriginPos = sectionId === 'ghost'
      ? originPos.clone().sub(sectionPos)
      : originPos.clone();

    const originGeometry = new THREE.BufferGeometry().setFromPoints([
      localOriginPos,
      localOriginPos.clone().add(new THREE.Vector3(0, 0, markerExtension / 2)),
    ]);
    const originMaterial = cabinetMarkerLineMaterial({ color: 0x00ff00 });
    const originMarker = new THREE.Line(originGeometry, originMaterial);
    (sectionId === 'ghost' ? sectionGroup : state.scene).add(originMarker);
    markers.push(originMarker);
  } catch (e) {
    console.warn('⚠️ Не удалось создать зелёный маркер начала секции:', e);
  }

  // Создаем сплошные маркеры (двухдверные шкафы).
  const activeSegments =
    (segmentsLShapeBack != null && segmentsLShapeBack.length > 0)
      ? segmentsLShapeBack
      : (segmentsLShape != null && segmentsLShape.length > 0)
      ? segmentsLShape
      : null;
  const useSegments = activeSegments != null;

  if (useSegments) {
    // L‑задняя: строим линии строго по сегментам (от спец‑зоны влево).
    const boundaries = [];
    for (const seg of activeSegments) {
      const startU = typeof seg.startWorldU === 'number' ? seg.startWorldU : seg.startWorldX;
      boundaries.push(startU);
      boundaries.push(startU + seg.widthMm);
    }
    const uniqueBounds = [...new Set(boundaries)].sort((a, b) => a - b);
    for (const markerPosition of uniqueBounds) {
      const { wNear, wFar } = buildMarkerLineEndpointsAlongWall(
        wallName,
        sectionPos,
        depth,
        markerExtension,
        wallZ,
        markerPosition,
        markerY
      );
      addClippedCabinetMarkerLine({
        markers,
        sectionId,
        sectionGroup,
        sectionPos,
        wallName,
        uAxisCoord: markerPosition,
        wNear,
        wFar,
        markerY,
        footprints: furnitureFootprints,
        material: cabinetMarkerLineMaterial({ color: 0x0066ff }),
      });
    }
  } else {
    // Обычная логика (не L‑задняя)
    // Prefer authoritative layout segments (modules + 16mm cap sections).
    const layoutSegs = sectionData?._layoutCache?.segments || null;
    let solidPositions = [];
    if (Array.isArray(layoutSegs) && layoutSegs.length > 0) {
      for (const seg of layoutSegs) {
        solidPositions.push(seg.startU, seg.endU);
      }
    } else {
      const transitionGapArr =
        sectionId && sectionId !== 'ghost' && division?.parts > 0
          ? getSectionZoneTransitionGaps(sectionId, wallName, division.parts)
          : null;
      for (let i = 0; i <= division.parts; i++) {
        solidPositions.push(
          sectionStart +
          i * division.partSize +
          (transitionGapArr ? cumulativeTransitionGapMm(transitionGapArr, i) : 0)
        );
      }
    }
    const uniquePositions = [];
    { const seen = new Set();
      for (const p of solidPositions) {
        const k = Math.round(Number(p) * 10);
        if (seen.has(k)) continue;
        seen.add(k);
        uniquePositions.push(p);
      }
      uniquePositions.sort((a, b) => a - b);
    }
    for (const markerPosition of uniquePositions) {
      const maxX =
        Array.isArray(layoutSegs) && layoutSegs.length > 0
          ? Math.max(...layoutSegs.map((s) => s.endU))
          : (freeSizeMm != null ? sectionStart + sizeForDivision : sectionEnd);
      // With authoritative layout segments, render ALL boundaries exactly as-is
      // (including the right edge and both 16mm cap edges), no maxX clipping.
      const shouldRender =
        Array.isArray(layoutSegs) && layoutSegs.length > 0
          ? true
          : markerPosition <= maxX;
      if (shouldRender) {
        const { wNear, wFar } = buildMarkerLineEndpointsAlongWall(
          wallName,
          sectionPos,
          depth,
          markerExtension,
          wallZ,
          markerPosition,
          markerY
        );
        addClippedCabinetMarkerLine({
          markers,
          sectionId,
          sectionGroup,
          sectionPos,
          wallName,
          uAxisCoord: markerPosition,
          wNear,
          wFar,
          markerY,
          footprints: furnitureFootprints,
          material: cabinetMarkerLineMaterial({ color: 0x0066ff }),
        });
      }
    }
  }

  // Пунктир по середине = double (две ячейки). Одинарные — только сплошные по краям.
  const dashedPositions = [];
  if (useSegments) {
    const S =
      (typeof lShapeSingleWidthMm === 'number' && lShapeSingleWidthMm > 0) ||
      (typeof division.singleWidthMm === 'number' && division.singleWidthMm > 0)
        ? (lShapeSingleWidthMm ?? division.singleWidthMm)
        : division.partSize / 2;
    const D = cornerSingleWidthMm != null && cornerSingleWidthMm > 0 ? cornerSingleWidthMm : null;

    for (const seg of activeSegments) {
      if (seg.type === 'double') {
        const startU = typeof seg.startWorldU === 'number' ? seg.startWorldU : seg.startWorldX;
        dashedPositions.push(startU + S);
      } else if (seg.type === 'special') {
        const startU = typeof seg.startWorldU === 'number' ? seg.startWorldU : seg.startWorldX;
        // cornerAtStart: слева D, справа S → линия на D. Иначе: слева S, справа D → линия на S.
        dashedPositions.push(meta && meta.cornerAtStart && D != null ? startU + D : startU + S);
      }
    }
  } else {
    const layoutSegs = sectionData?._layoutCache?.segments || null;
    if (Array.isArray(layoutSegs) && layoutSegs.length > 0) {
      for (const seg of layoutSegs) {
        if (seg.type !== 'module') continue;
        const moduleWidthMm = seg.endU - seg.startU;
        // Узкая зона &lt;60 см — без пунктира (одинарная ячейка).
        if (moduleWidthMm < ONE_DOOR_CABINET_MAX) continue;
        // doorKind:single и ширина &lt;80 см — одинарная, только сплошные.
        // ≥80 см (или doorKind:double) — пунктир по середине double.
        if (seg.doorKind === 'single' && moduleWidthMm < TWO_DOOR_CABINET_MIN) continue;
        dashedPositions.push((seg.startU + seg.endU) / 2);
      }
    } else if (division.layoutKind !== 'allSingles') {
      // Fallback без layoutCache: mid только если деление не «все одн.».
      const transitionGapArr =
        sectionId && sectionId !== 'ghost' && division?.parts > 0
          ? getSectionZoneTransitionGaps(sectionId, wallName, division.parts)
          : null;
      for (let i = 0; i < division.parts; i++) {
        dashedPositions.push(
          sectionStart +
            i * division.partSize +
            (transitionGapArr ? cumulativeTransitionGapMm(transitionGapArr, i) : 0) +
            division.partSize / 2
        );
      }
    }
  }

  const maxX = useSegments
    ? sectionStart + freeSizeMm + cornerSingleWidthMm
    : (freeSizeMm != null ? sectionStart + sizeForDivision : sectionEnd);

  for (const markerPosition of dashedPositions) {
    if (markerPosition < maxX) {
      const { wNear, wFar } = buildMarkerLineEndpointsAlongWall(
        wallName,
        sectionPos,
        depth,
        markerExtension * 0.8,
        wallZ,
        markerPosition,
        markerY
      );

      addClippedCabinetMarkerLine({
        markers,
        sectionId,
        sectionGroup,
        sectionPos,
        wallName,
        uAxisCoord: markerPosition,
        wNear,
        wFar,
        markerY,
        footprints: furnitureFootprints,
        material: cabinetMarkerDashedLineMaterial({
          color: 0x0066ff,
          dashSize: 40,
          gapSize: 60,
        }),
        dashed: true,
      });
    }
  }

  // Store markers and division info
  state.sectionCabinetMarkers[sectionId] = markers;

  // Видимость маркеров = кнопка «Ячейки» (default выкл.); шаг 5+ всегда гасим.
  try {
    const step = typeof window !== 'undefined' ? Number(window.currentRoomStep) : 0;
    const cellsOff = state.kitchenCellsUiEnabled === false;
    const layerOn =
      !cellsOff && !!(state.showSingleZones || state.showDoubleZones);
    if (!layerOn || step >= 5) {
      for (const m of markers) {
        if (m) m.visible = false;
      }
    }
    if (!layerOn && typeof window.__cldSyncCellVolumeMeshes === 'function') {
      try {
        window.__cldSyncCellVolumeMeshes();
      } catch (_) {}
    }
  } catch (_) {}

  const computedDivisionEnd =
    freeSizeMm != null && cornerSingleWidthMm != null
      ? sectionStart + freeSizeMm + cornerSingleWidthMm
      : freeSizeMm != null
      ? sectionStart + sizeForDivision
      : sectionEnd;

  const divisionData = {
    partSize: division.partSize,
    sectionStart,
    sectionEnd: computedDivisionEnd,
    wallName,
    parts: division.parts,
  };

  if (meta && freeSizeMm != null && cornerSingleWidthMm != null) {
    divisionData.typeKey = meta.typeKey;
    divisionData.freeSizeMm = freeSizeMm;
    divisionData.cornerWidthMm = cornerSingleWidthMm;
    divisionData.isLShapePrimary = true;
    if (meta.primary === 'back') {
      divisionData.isLShapeBack = true;
      divisionData.fixedRightGapMm = resolveFixedLShapeCornerGapMm();
      if (segmentsLShapeBack != null) divisionData.segmentsLShapeBack = segmentsLShapeBack;
    }
    if (meta.primary === 'right') divisionData.isLShapeRightFront = true;
    if (meta.primary === 'left') divisionData.isLShapeLeftFront = true;
    if (meta.primary === 'front') divisionData.isLShapeFrontPrimary = true;
    if (lShapeSingleWidthMm != null) {
      divisionData.singleWidthMm = lShapeSingleWidthMm;
    } else if (!(Number(divisionData.singleWidthMm) > 0) && division.parts >= 1) {
      // Authoritative path без findOptimal — восстановить S как в section-manager.
      const denom = division.extraSingleLeft
        ? 2 * division.parts
        : Math.max(1, 2 * division.parts - 1);
      const inferred = freeSizeMm / denom;
      if (inferred > 0) divisionData.singleWidthMm = inferred;
    }
    if (division.extraSingleLeft) divisionData.extraSingleLeft = true;
    if (segmentsLShape != null) divisionData.segmentsLShape = segmentsLShape;
  }

  if (sectionId === 'ghost') {
    state.sectionGhostDivision = divisionData;
  } else {
    const sec = state.customSections.find(s => s.id === sectionId);
    if (sec) {
      if (!sec.division) {
        sec.division = divisionData;
      } else if (meta && freeSizeMm != null && cornerSingleWidthMm != null) {
        // Не затирать variant/parts — только L free/corner для любой primary-стены.
        sec.division.typeKey = meta.typeKey;
        sec.division.freeSizeMm = freeSizeMm;
        sec.division.cornerWidthMm = cornerSingleWidthMm;
        sec.division.isLShapePrimary = true;
        if (meta.primary === 'back') sec.division.isLShapeBack = true;
        if (meta.primary === 'right') sec.division.isLShapeRightFront = true;
        if (meta.primary === 'left') sec.division.isLShapeLeftFront = true;
        if (meta.primary === 'front') sec.division.isLShapeFrontPrimary = true;
        if (lShapeSingleWidthMm != null) {
          sec.division.singleWidthMm = lShapeSingleWidthMm;
        } else if (!(Number(sec.division.singleWidthMm) > 0) && sec.division.parts >= 1) {
          const denom = sec.division.extraSingleLeft
            ? 2 * sec.division.parts
            : Math.max(1, 2 * sec.division.parts - 1);
          const inferred = freeSizeMm / denom;
          if (inferred > 0) sec.division.singleWidthMm = inferred;
        }
        if (segmentsLShape != null) sec.division.segmentsLShape = segmentsLShape;
        if (segmentsLShapeBack != null) sec.division.segmentsLShapeBack = segmentsLShapeBack;
      }
    }
  }

  // Детальный лог создания маркеров отключён, чтобы не засорять консоль.
}

/**
 * Remove cabinet markers for section
 * @param {string} sectionId - Section ID
 */
export function removeCabinetMarkers(sectionId) {
  if (!state.sectionCabinetMarkers[sectionId]) return;
  
  state.sectionCabinetMarkers[sectionId].forEach(marker => {
    if (marker.parent) {
      marker.parent.remove(marker);
    } else {
      state.scene.remove(marker);
    }
    if (marker.geometry) marker.geometry.dispose();
    if (marker.material) marker.material.dispose();
  });
  
  delete state.sectionCabinetMarkers[sectionId];
}

/**
 * Update cabinet markers for section (called on resize)
 * @param {string} sectionId - Section ID
 */
export function updateCabinetMarkersForSection(sectionId) {
  // Find section in customSections array
  const sectionData = state.customSections.find(s => s.id === sectionId);
  if (!sectionData) {
    console.warn('⚠️ Секция не найдена:', sectionId);
    return;
  }
  
  // Recreate markers with new dimensions
  addCabinetMarkers(
    sectionId,
    sectionData.group,
    sectionData.size.x,
    sectionData.size.y,
    sectionData.size.z,
    sectionData.wallName || 'back'
  );
}

// Make functions available globally for backward compatibility
window.addCabinetMarkers = addCabinetMarkers;
window.removeCabinetMarkers = removeCabinetMarkers;
window.updateCabinetMarkersForSection = updateCabinetMarkersForSection;
