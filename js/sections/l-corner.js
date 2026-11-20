import { state } from '../utils/state.js';
import { resolveCornerGapCm } from './corner-joint.js?v=20261028-ugrid1';

let isLegacyBackCornerSyncInProgress = false;

/** Шкаф 5 см / кухня 0 — один источник (corner-joint). */
function wardrobeOrKitchenCornerGapCm() {
  try {
    return resolveCornerGapCm();
  } catch (_) {
    return 0;
  }
}

/**
 * Соседняя стена для углового шкафа.
 * ВАЖНО: в проекте "правый/левый" угол задаётся как соседняя стена
 * по часовой / против часовой стрелки при виде сверху.
 *
 * Комната по часовой: back → right → front → left → back.
 *
 * - right corner (по часовой): back→right, right→front, front→left, left→back
 * - left  corner (против):    back→left,  left→front, front→right, right→back
 */
export function getAttachedWallForCorner(primaryWall, cornerType) {
  const rightCorner = {
    back: 'right',
    right: 'front',
    front: 'left',
    left: 'back',
  };
  const leftCorner = {
    back: 'left',
    left: 'front',
    front: 'right',
    right: 'back',
  };
  const map = cornerType === 'right' ? rightCorner : leftCorner;
  return map[primaryWall] || null;
}

export function isCornerLayoutKey(layoutKey) {
  return (
    layoutKey === 'corner-wardrobe' ||
    layoutKey === 'top-right' ||
    layoutKey === 'corner-wardrobe-left' ||
    layoutKey === 'top-left'
  );
}

/** П-образная раскладка (задняя + левая + правая). */
export function isUShapeLayoutKey(layoutKey) {
  return layoutKey === 'top-right-bottom-partition';
}

/** Задняя секция П-сборки (две L-пары). */
export function isUShapeBackSection(sectionData) {
  if (!sectionData?.lShape || sectionData.lShape.type !== 'u-wardrobe') return false;
  const role = sectionData.lShape.role;
  const wall = sectionData.wallName || role;
  return role === wall;
}

/** 'left' | 'right' | null — сторона угловой раскладки. */
export function cornerLayoutSide(layoutKey) {
  if (layoutKey === 'corner-wardrobe-left' || layoutKey === 'top-left') return 'left';
  if (layoutKey === 'corner-wardrobe' || layoutKey === 'top-right') return 'right';
  return null;
}

/** Ключ раскладки для стороны у двери. */
export function cornerLayoutKeyForSide(side) {
  if (side === 'left') return 'corner-wardrobe-left';
  if (side === 'right') return 'corner-wardrobe';
  return 'top-wall';
}

/**
 * Сторона пролёта у двери/окна: крайний левый / крайний правый.
 * @returns {'left'|'right'|null}
 */
export function spanDoorSide(span, allSpans) {
  if (!span || !Array.isArray(allSpans) || allSpans.length < 2) return null;
  const ordered = [...allSpans]
    .filter((s) => s && Number.isFinite(Number(s.alongA)))
    .sort((a, b) => Number(a.alongA) - Number(b.alongA));
  if (ordered.length < 2) return null;
  const idx = ordered.findIndex((s) => s && s.id === span.id);
  if (idx === 0) return 'left';
  if (idx === ordered.length - 1) return 'right';
  return null;
}

/** Подсветка карточки раскладки на шаге 2. */
export function highlightRoomLayoutCard(layoutKey) {
  if (!layoutKey || typeof document === 'undefined') return;
  const items = document.querySelectorAll('.room-type-item.room-layout-card');
  if (!items.length) return;
  items.forEach((el) => {
    const key = el.dataset?.layoutType || '';
    el.classList.toggle('selected', key === layoutKey);
  });
}

/**
 * У двери: подогнать раскладку под сторону пролёта (левый↔лево, правый↔право).
 * Меняет pending + каталог, чтобы призрак сразу строился правильным типом.
 */
export function applyCornerLayoutForDoorSide(side) {
  const key = cornerLayoutKeyForSide(side);
  if (!key || key === 'top-wall') return null;
  state.pendingLayoutKey = key;
  if (typeof window !== 'undefined') {
    const prev = window.selectedRoomLayout || {};
    window.selectedRoomLayout = { ...prev, key, name: prev.name || key };
  }
  highlightRoomLayoutCard(key);
  return key;
}

// Оранжевый маркер для отладки: правый‑передний‑нижний угол секции на задней стене
// Только для углового шкафа (corner-wardrobe / top-right, роль back).
export function addBackSectionCornerMarker(sectionGroup, width, height, depth, wallName, sectionData = null) {
  if (wallName !== 'back') return;

  // Удаляем старый маркер, чтобы не копились при updateSectionSize
  const old = sectionGroup.getObjectByName('BackSectionCornerMarker');
  if (old) sectionGroup.remove(old);

  let isCornerSection = false;

  const activeLayoutKey =
    state.pendingLayoutKey ||
    (window.selectedRoomLayout && window.selectedRoomLayout.key) ||
    null;

  if (
    sectionData &&
    sectionData.lShape &&
    sectionData.lShape.role === 'back' &&
    (sectionData.lShape.type === 'corner-wardrobe' ||
      sectionData.lShape.type === 'top-right' ||
      sectionData.lShape.type === 'corner-right-back' ||
      sectionData.lShape.type === 'u-wardrobe')
  ) {
    isCornerSection = true;
  } else if (
    !sectionData?.lShape &&
    (activeLayoutKey === 'corner-wardrobe' ||
      activeLayoutKey === 'top-right' ||
      isUShapeLayoutKey(activeLayoutKey))
  ) {
    // Только пока lShape ещё не выставлен (момент create). Не трогать чужие секции.
    isCornerSection = true;
  }

  if (!isCornerSection) return;

  const markerGeom = new THREE.SphereGeometry(40, 12, 8);
  const markerMat = new THREE.MeshBasicMaterial({
    color: 0xff8800,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  const marker = new THREE.Mesh(markerGeom, markerMat);
  marker.name = 'BackSectionCornerMarker';
  marker.userData.isBackCornerMarker = true;

  // Для задней стены локальные границы секции:
  // X: [0, width], Z: [0, depth], пивот в левом‑заднем‑нижнем углу.
  // Правый‑передний‑нижний угол = (width, 0, depth).
  marker.position.set(width, 0, depth);
  marker.renderOrder = 130;

  sectionGroup.add(marker);
}

// Оранжевый маркер на задней секции для corner-wardrobe-left: левый‑передний‑нижний угол (0, 0, depth).
export function addBackSectionCornerMarkerLeft(sectionGroup, width, height, depth, wallName, sectionData = null) {
  if (wallName !== 'back') return;

  // Удаляем старый маркер, чтобы не копились при updateSectionSize
  const old = sectionGroup.getObjectByName('BackSectionCornerMarkerLeft');
  if (old) sectionGroup.remove(old);

  const isCornerBackLeft =
    sectionData &&
    sectionData.lShape &&
    (sectionData.lShape.type === 'corner-wardrobe-left' ||
      sectionData.lShape.type === 'top-left' ||
      sectionData.lShape.type === 'corner-left-back' ||
      sectionData.lShape.type === 'u-wardrobe') &&
    sectionData.lShape.role === 'back';

  const activeLayoutKey =
    state.pendingLayoutKey ||
    (window.selectedRoomLayout && window.selectedRoomLayout.key) ||
    null;
  const isCornerLayoutBackLeft =
    !sectionData?.lShape &&
    wallName === 'back' &&
    (activeLayoutKey === 'corner-wardrobe-left' ||
      activeLayoutKey === 'top-left' ||
      isUShapeLayoutKey(activeLayoutKey));

  if (!isCornerBackLeft && !isCornerLayoutBackLeft) return;

  const markerGeom = new THREE.SphereGeometry(40, 12, 8);
  const markerMat = new THREE.MeshBasicMaterial({
    color: 0xff8800,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  const marker = new THREE.Mesh(markerGeom, markerMat);
  marker.name = 'BackSectionCornerMarkerLeft';
  marker.userData.isBackCornerMarkerLeft = true;

  // Для задней стены: пивот в левом‑заднем‑нижнем углу.
  // Левый‑передний‑нижний угол (стык с приставной левой) = (0, 0, depth).
  marker.position.set(0, 0, depth);
  marker.renderOrder = 130;

  sectionGroup.add(marker);
}

export function getBackSectionCornerMarkerWorldPos(backSectionData) {
  if (!backSectionData || !backSectionData.group) return null;

  let marker = null;
  backSectionData.group.traverse((child) => {
    if (child.userData && child.userData.isBackCornerMarker) {
      marker = child;
    }
  });

  if (!marker) return null;

  const worldPos = new THREE.Vector3();
  marker.getWorldPosition(worldPos);
  return worldPos;
}

export function getBackSectionCornerMarkerLeftWorldPos(backSectionData) {
  if (!backSectionData || !backSectionData.group) return null;

  let marker = null;
  backSectionData.group.traverse((child) => {
    if (child.userData && child.userData.isBackCornerMarkerLeft) {
      marker = child;
    }
  });

  if (!marker) return null;

  const worldPos = new THREE.Vector3();
  marker.getWorldPosition(worldPos);
  return worldPos;
}

function isLegacyBackRight(sectionData) {
  return (
    !!sectionData?.lShape &&
    (sectionData.lShape.type === 'corner-wardrobe' || sectionData.lShape.type === 'top-right')
  );
}

function isLegacyBackLeft(sectionData) {
  return (
    !!sectionData?.lShape &&
    (sectionData.lShape.type === 'corner-wardrobe-left' || sectionData.lShape.type === 'top-left')
  );
}

function resolveUShapeArmIds(backSectionData) {
  const ls = backSectionData?.lShape || {};
  return {
    leftId: ls.pairIdLeft || null,
    rightId: ls.pairIdRight || null,
  };
}

/**
 * Рендер HTML для legacy back-углов (как в резервной копии), строго по секциям:
 * - back секция right-угла: редактируем только left
 * - back секция left-угла:  редактируем только right
 * - right приставная: редактируем только back
 * - left  приставная: редактируем только back (показывается как "Отступ слева")
 */
export function getLegacyBackCornerModalHtml({
  sectionData,
  wallName,
  currentOffsets,
  currentSize,
  leftVal,
  rightVal,
} = {}) {
  if (!sectionData || !sectionData.lShape) return null;

  const role = sectionData.lShape.role;

  if (wallName === 'back' && isLegacyBackRight(sectionData) && role === 'back') {
    return `
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ слева (см):</label>
        <input type="number" id="section-offset-left" value="${leftVal}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ снизу (см):</label>
        <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
        <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Глубина (см):</label>
        <input type="number" id="section-depth" value="${currentSize.z / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
    `;
  }

  if (wallName === 'back' && isLegacyBackLeft(sectionData) && role === 'back') {
    return `
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ справа (см):</label>
        <input type="number" id="section-offset-right" value="${rightVal}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ снизу (см):</label>
        <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
        <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Глубина (см):</label>
        <input type="number" id="section-depth" value="${currentSize.z / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
    `;
  }

  if (wallName === 'right' && isLegacyBackRight(sectionData) && role === 'right') {
    return `
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ справа (см):</label>
        <input type="number" id="section-offset-back" value="${rightVal}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ снизу (см):</label>
        <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
        <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Глубина (см):</label>
        <input type="number" id="section-depth" value="${currentSize.x / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
    `;
  }

  if (wallName === 'left' && isLegacyBackLeft(sectionData) && role === 'left') {
    return `
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ слева (см):</label>
        <input type="number" id="section-offset-back" value="${leftVal}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ снизу (см):</label>
        <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
        <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Глубина (см):</label>
        <input type="number" id="section-depth" value="${currentSize.x / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
    `;
  }

  return null;
}

/**
 * L‑sync для legacy back-углов (как в резервной копии).
 * Вызывается из updateSectionSize после обновления текущей секции.
 */
export function syncLegacyBackCornerIfNeeded(sectionData, extent, deps) {
  const { updateSectionSize, getSectionOffsetsMm } = deps || {};
  if (!updateSectionSize || !getSectionOffsetsMm) return;
  if (isLegacyBackCornerSyncInProgress) return;

  // П-сборка: у задней две приставки — синхронизируем обе.
  if (isUShapeBackSection(sectionData)) {
    const { leftId, rightId } = resolveUShapeArmIds(sectionData);
    if (!leftId && !rightId) return;
    try {
      isLegacyBackCornerSyncInProgress = true;
      const list = state.customSections || [];
      const syncArm = (armId, side) => {
        if (!armId) return;
        const arm = list.find((s) => s && s.id === armId);
        if (!arm?.lShape || arm.lShape.role !== side) return;
        const roomWorldPos2 = new THREE.Vector3();
        state.room.group.getWorldPosition(roomWorldPos2);
        const markerWorldPos =
          side === 'right'
            ? getBackSectionCornerMarkerWorldPos(sectionData)
            : getBackSectionCornerMarkerLeftWorldPos(sectionData);
        if (!markerWorldPos) return;
        const gapMm =
          (sectionData.position?.z ?? sectionData.group.position.z) - roomWorldPos2.z;
        const jointMm = markerWorldPos.z - roomWorldPos2.z - gapMm;
        const thicknessMm = Number(arm.size?.x);
        if (!(thicknessMm > 0)) return;
        const otherOffsetsMm = getSectionOffsetsMm(arm);
        updateSectionSize(
          arm,
          {
            front: jointMm / 10,
            back: (otherOffsetsMm.backMm || 0) / 10,
            bottom: (otherOffsetsMm.bottomMm || 0) / 10,
            top: (otherOffsetsMm.topMm || 0) / 10,
          },
          thicknessMm / 10
        );
      };
      syncArm(rightId, 'right');
      syncArm(leftId, 'left');
    } catch (e) {
      console.warn('⚠️ L‑sync error (U-shape back):', e);
    } finally {
      isLegacyBackCornerSyncInProgress = false;
    }
    return;
  }

  if (!sectionData?.lShape?.pairId) return;

  const isRight = isLegacyBackRight(sectionData);
  const isLeft = isLegacyBackLeft(sectionData);
  if (!isRight && !isLeft) return;

  const role = sectionData.lShape.role;
  const other = (state.customSections || []).find((s) => s && s.id === sectionData.lShape.pairId);
  if (!other?.lShape) return;
  // Не трогать чужую пару (иначе постановка правого «чинит» левую не тем other).
  if (isRight && other.lShape.role !== 'right' && role === 'back') return;
  if (isLeft && other.lShape.role !== 'left' && role === 'back') return;
  if (isRight && role === 'right' && other.lShape.role !== 'back') return;
  if (isLeft && role === 'left' && other.lShape.role !== 'back') return;

  try {
    isLegacyBackCornerSyncInProgress = true;
    if (isRight) {
      if (role === 'back') {
        const roomWorldPos2 = new THREE.Vector3();
        state.room.group.getWorldPosition(roomWorldPos2);
        const markerWorldPos = getBackSectionCornerMarkerWorldPos(sectionData);
        if (markerWorldPos) {
          const gapMm = (sectionData.position?.z ?? sectionData.group.position.z) - roomWorldPos2.z;
          const jointMm = markerWorldPos.z - roomWorldPos2.z - gapMm;
          const thicknessMm = Number(other.size?.x);
          if (!(thicknessMm > 0)) return;
          const otherOffsetsMm = getSectionOffsetsMm(other);
          updateSectionSize(
            other,
            {
              front: jointMm / 10,
              back: (otherOffsetsMm.backMm || 0) / 10,
              bottom: (otherOffsetsMm.bottomMm || 0) / 10,
              top: (otherOffsetsMm.topMm || 0) / 10,
            },
            thicknessMm / 10
          );
        }
      } else if (role === 'right') {
        if (other.wallName === 'back') {
          const otherOffsetsMm = getSectionOffsetsMm(other);
          const depthMm = Number(other.size?.z);
          if (!(depthMm > 0)) return;
          updateSectionSize(
            other,
            {
              left: (otherOffsetsMm.leftMm || 0) / 10,
              right: (otherOffsetsMm.rightMm || 0) / 10,
              bottom: (otherOffsetsMm.bottomMm || 0) / 10,
              top: (otherOffsetsMm.topMm || 0) / 10,
            },
            depthMm / 10
          );
        }
      }
    } else if (isLeft) {
      if (role === 'back') {
        const roomWorldPos2 = new THREE.Vector3();
        state.room.group.getWorldPosition(roomWorldPos2);
        const markerWorldPos = getBackSectionCornerMarkerLeftWorldPos(sectionData);
        if (markerWorldPos) {
          // Как у правого: стык = маркер − gap задней, не сырой world Z.
          const gapMm = (sectionData.position?.z ?? sectionData.group.position.z) - roomWorldPos2.z;
          const jointMm = markerWorldPos.z - roomWorldPos2.z - gapMm;
          const thicknessMm = Number(other.size?.x);
          if (!(thicknessMm > 0)) return;
          const otherOffsetsMm = getSectionOffsetsMm(other);
          updateSectionSize(
            other,
            {
              front: jointMm / 10,
              back: (otherOffsetsMm.backMm || 0) / 10,
              bottom: (otherOffsetsMm.bottomMm || 0) / 10,
              top: (otherOffsetsMm.topMm || 0) / 10,
            },
            thicknessMm / 10
          );
        }
      } else if (role === 'left') {
        if (other.wallName === 'back') {
          const otherOffsetsMm = getSectionOffsetsMm(other);
          const depthMm = Number(other.size?.z);
          if (!(depthMm > 0)) return;
          updateSectionSize(
            other,
            {
              left: (otherOffsetsMm.leftMm || 0) / 10,
              right: (otherOffsetsMm.rightMm || 0) / 10,
              bottom: (otherOffsetsMm.bottomMm || 0) / 10,
              top: (otherOffsetsMm.topMm || 0) / 10,
            },
            depthMm / 10
          );
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ L‑sync error (legacy back corner):', e);
  } finally {
    isLegacyBackCornerSyncInProgress = false;
  }
}

/** После постановки нового угла — аккуратно подтянуть стыки уже стоящих пар. */
export function healAllLegacyBackCornerJoints(deps) {
  const list = (state.customSections || []).filter(
    (s) =>
      s &&
      s.lShape &&
      s.lShape.role === 'back' &&
      (s.lShape.pairId || s.lShape.pairIdLeft || s.lShape.pairIdRight) &&
      (isLegacyBackLeft(s) || isLegacyBackRight(s) || isUShapeBackSection(s))
  );
  list.forEach((s) => {
    try {
      syncLegacyBackCornerIfNeeded(s, s.size, deps);
    } catch (_) {}
  });
}

export function ensureLegacyBackLeftSpecialZone(sectionData, size, wallName, sectionGroup) {
  if (wallName !== 'back' || !sectionData?.lShape) return;
  const isU = isUShapeBackSection(sectionData);
  if ((!isLegacyBackLeft(sectionData) && !isU) || sectionData.lShape.role !== 'back') return;
  if (!sectionGroup) return;

  try {
    // Толщина приставной левой секции внутрь комнаты (ось X).
    let thicknessLeftMm = size.z; // fallback
    try {
      const pairIdLeft = sectionData.lShape.pairIdLeft || sectionData.lShape.pairId || null;
      if (pairIdLeft && Array.isArray(state.customSections)) {
        const leftSection = state.customSections.find(
          (s) =>
            s.id === pairIdLeft &&
            s.lShape &&
            isLegacyBackLeft(s) &&
            s.lShape.role === 'left'
        );
        if (leftSection && leftSection.size && Number.isFinite(leftSection.size.x)) {
          thicknessLeftMm = leftSection.size.x;
        }
      }
    } catch {}

    const cornerWidthLeft = Math.max(0, thicknessLeftMm);
    if (cornerWidthLeft <= 0) return;
    const cornerDepthLeft = size.z;

    const cornerGroupLeft = new THREE.Group();
    cornerGroupLeft.name = `SectionZoneSingleCornerLeft_${sectionData.id}`;

    const cornerGeomLeft = new THREE.BoxGeometry(cornerWidthLeft, size.y, cornerDepthLeft);
    const cornerEdgesLeft = new THREE.EdgesGeometry(cornerGeomLeft);
    const cornerLineMatLeft = new THREE.LineBasicMaterial({
      color: 0xffb74d,
      linewidth: 1,
      transparent: true,
      opacity: 0.45,
      depthTest: false,
    });
    const cornerWireLeft = new THREE.LineSegments(cornerEdgesLeft, cornerLineMatLeft);
    cornerWireLeft.position.set(cornerWidthLeft / 2, size.y / 2, cornerDepthLeft / 2);
    cornerWireLeft.renderOrder = 100;

    const cornerFillMatLeft = new THREE.MeshBasicMaterial({
      color: 0xffb74d,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const cornerFillLeft = new THREE.Mesh(cornerGeomLeft, cornerFillMatLeft);
    cornerFillLeft.position.copy(cornerWireLeft.position);

    const pivotMarkerCornerLeft = new THREE.Mesh(
      new THREE.SphereGeometry(25, 8, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffb74d,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      })
    );
    pivotMarkerCornerLeft.position.set(cornerWidthLeft / 2, 60, cornerDepthLeft / 2);
    cornerGroupLeft.add(cornerWireLeft);
    cornerGroupLeft.add(cornerFillLeft);
    cornerGroupLeft.add(pivotMarkerCornerLeft);

    // У левого угла зона начинается от левого края задней секции.
    cornerGroupLeft.position.set(0, 0, 0);
    sectionGroup.add(cornerGroupLeft);

    if (!state.sectionZones) state.sectionZones = {};
    if (!Array.isArray(state.sectionZones[sectionData.id])) state.sectionZones[sectionData.id] = [];
    state.sectionZones[sectionData.id].push(cornerGroupLeft);
  } catch (e) {
    console.warn('⚠️ Не удалось создать угловую одинарную зону L‑шкафа (левый угол):', e);
  }
}

/**
 * Правый угловой шкаф back+right (эталон из резервной копии).
 *
 * deps: { createCustomSection, updateSectionSize, updateCabinetMarkersForSection, createSectionZones }
 */
export function createLinkedRightSectionForBack(backSectionData, deps) {
  const {
    createCustomSection,
    updateSectionSize,
    updateCabinetMarkersForSection,
    createSectionZones,
    getSectionOffsetsMm,
  } = deps || {};
  if (!createCustomSection || !updateSectionSize) return;
  if (!state.room || !backSectionData || backSectionData.wallName !== 'back') return;

  const W_room = state.room.depth;
  const H_room = state.room.height;
  const D_back = backSectionData.size.z;
  const height = backSectionData.size.y || H_room;

  if (!Number.isFinite(D_back) || D_back <= 0 || !Number.isFinite(height) || height <= 0) return;

  const rightThickness = D_back;
  const rightLength = W_room - D_back;
  if (!Number.isFinite(rightLength) || rightLength <= 0) return;

  // Сначала зазор на стыке (right): шкаф 5 см / кухня 0, потом приставка.
  backSectionData.lShape = {
    type: 'corner-wardrobe',
    role: 'back',
    pairId: null,
  };
  try {
    if (getSectionOffsetsMm) {
      const backOffsetsMm = getSectionOffsetsMm(backSectionData);
      const backOffsetsCm = {
        left: (backOffsetsMm.leftMm || 0) / 10,
        right: wardrobeOrKitchenCornerGapCm(),
        bottom: (backOffsetsMm.bottomMm || 0) / 10,
        top: (backOffsetsMm.topMm || 0) / 10,
      };
      const backDepthCm =
        (backSectionData.size && backSectionData.size.z ? backSectionData.size.z : D_back) / 10;
      updateSectionSize(backSectionData, backOffsetsCm, backDepthCm);
    }
  } catch (_) {}

  try {
    if (updateCabinetMarkersForSection && backSectionData.id) {
      updateCabinetMarkersForSection(backSectionData.id);
    }
  } catch (_) {}

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const backRightCornerWorld = new THREE.Vector3(
    roomWorldPos.x + state.room.width,
    roomWorldPos.y,
    roomWorldPos.z + state.room.depth
  );

  const markerWorldPos = getBackSectionCornerMarkerWorldPos(backSectionData);

  const rightSection = createCustomSection(
    rightThickness,
    height,
    rightLength,
    backRightCornerWorld,
    'right'
  );
  if (!rightSection) return;

  rightSection.lShape = {
    type: 'corner-wardrobe',
    role: 'right',
    pairId: backSectionData.id,
  };
  backSectionData.lShape = {
    type: 'corner-wardrobe',
    role: 'back',
    pairId: rightSection.id,
  };
  rightSection.lShape.pairId = backSectionData.id;

  try {
    const newDepthMmLinked = D_back;
    const newDepthCmLinked = newDepthMmLinked / 10;
    let frontOffsetCm;
    if (markerWorldPos) {
      const gapMm = backSectionData.position.z - roomWorldPos.z;
      const jointMm = markerWorldPos.z - roomWorldPos.z - gapMm;
      frontOffsetCm = jointMm / 10;
    } else {
      frontOffsetCm = newDepthMmLinked / 10;
    }

    const rightOffsets = {
      front: frontOffsetCm,
      back: 0,
      bottom: (rightSection.offsets.bottomMm || 0) / 10,
      top: (rightSection.offsets.topMm || 0) / 10,
    };
    updateSectionSize(rightSection, rightOffsets, newDepthCmLinked);
  } catch {}

  try {
    if (updateCabinetMarkersForSection && backSectionData.id) {
      updateCabinetMarkersForSection(backSectionData.id);
      if (backSectionData.division && createSectionZones) createSectionZones(backSectionData);
    }
  } catch {}

  return rightSection;
}

/**
 * Левый угловой шкаф back+left (эталон из резервной копии).
 *
 * deps: { createCustomSection, updateSectionSize, updateCabinetMarkersForSection, createSectionZones, getSectionOffsetsMm }
 */
export function createLinkedLeftSectionForBack(backSectionData, deps) {
  const {
    createCustomSection,
    updateSectionSize,
    updateCabinetMarkersForSection,
    createSectionZones,
    getSectionOffsetsMm,
  } = deps || {};
  if (!createCustomSection || !updateSectionSize || !getSectionOffsetsMm) return;
  if (!state.room || !backSectionData || backSectionData.wallName !== 'back') return;

  const W_room = state.room.depth;
  const H_room = state.room.height;
  const D_back = backSectionData.size.z;
  const height = backSectionData.size.y || H_room;

  if (!Number.isFinite(D_back) || D_back <= 0 || !Number.isFinite(height) || height <= 0) return;

  const leftThickness = D_back;
  const leftLength = W_room - D_back;
  if (!Number.isFinite(leftLength) || leftLength <= 0) return;

  // Сначала зазор/позиция задней (как у правого угла стык стабилен), потом приставка.
  backSectionData.lShape = {
    type: 'corner-wardrobe-left',
    role: 'back',
    pairId: null,
  };
  try {
    const backOffsetsMm = getSectionOffsetsMm(backSectionData);
    const FIXED_LEFT_GAP_CM = wardrobeOrKitchenCornerGapCm();
    const backOffsetsCm = {
      left: FIXED_LEFT_GAP_CM,
      right: (backOffsetsMm.rightMm || 0) / 10,
      bottom: (backOffsetsMm.bottomMm || 0) / 10,
      top: (backOffsetsMm.topMm || 0) / 10,
    };
    const backDepthCm =
      (backSectionData.size && backSectionData.size.z ? backSectionData.size.z : D_back) / 10;
    updateSectionSize(backSectionData, backOffsetsCm, backDepthCm);
  } catch (_) {}

  try {
    if (updateCabinetMarkersForSection && backSectionData.id) {
      updateCabinetMarkersForSection(backSectionData.id);
    }
  } catch (_) {}

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const backLeftCornerWorld = new THREE.Vector3(
    roomWorldPos.x,
    roomWorldPos.y,
    roomWorldPos.z + state.room.depth
  );

  const leftSection = createCustomSection(
    leftThickness,
    height,
    leftLength,
    backLeftCornerWorld,
    'left'
  );
  if (!leftSection) return;

  leftSection.lShape = {
    type: 'corner-wardrobe-left',
    role: 'left',
    pairId: backSectionData.id,
  };
  backSectionData.lShape = {
    type: 'corner-wardrobe-left',
    role: 'back',
    pairId: leftSection.id,
  };

  try {
    const newDepthMmLinked = D_back;
    const newDepthCmLinked = newDepthMmLinked / 10;
    const roomWorldPos2 = new THREE.Vector3();
    state.room.group.getWorldPosition(roomWorldPos2);
    const markerWorldPosLeft = getBackSectionCornerMarkerLeftWorldPos(backSectionData);

    let frontOffsetCm;
    if (markerWorldPosLeft) {
      const gapMm = (backSectionData.position?.z ?? backSectionData.group.position.z) - roomWorldPos2.z;
      const jointMm = markerWorldPosLeft.z - roomWorldPos2.z - gapMm;
      frontOffsetCm = jointMm / 10;
    } else {
      // Как у правого угла: без маркера — глубина задней секции, не 0.
      frontOffsetCm = newDepthMmLinked / 10;
    }

    const leftOffsets = {
      front: frontOffsetCm,
      back: 0,
      bottom: (leftSection.offsets.bottomMm || 0) / 10,
      top: (leftSection.offsets.topMm || 0) / 10,
    };
    updateSectionSize(leftSection, leftOffsets, newDepthCmLinked);
  } catch (_) {}

  try {
    if (updateCabinetMarkersForSection) {
      if (backSectionData.id) {
        updateCabinetMarkersForSection(backSectionData.id);
        if (backSectionData.division && createSectionZones) createSectionZones(backSectionData);
      }
      if (leftSection.id) {
        updateCabinetMarkersForSection(leftSection.id);
        if (leftSection.division && createSectionZones) createSectionZones(leftSection);
      }
    }
  } catch (_) {}

  return leftSection;
}

/**
 * П-образная сборка: две L-пары от одной задней (left + right).
 * deps: как у createLinkedLeft/RightSectionForBack.
 * @returns {{ left: object|null, right: object|null }|null}
 */
export function createUShapeArmsForBack(backSectionData, deps) {
  const {
    createCustomSection,
    updateSectionSize,
    updateCabinetMarkersForSection,
    createSectionZones,
    getSectionOffsetsMm,
  } = deps || {};
  if (!createCustomSection || !updateSectionSize || !getSectionOffsetsMm) return null;
  if (!state.room || !backSectionData || backSectionData.wallName !== 'back') return null;

  const W_room = state.room.depth;
  const H_room = state.room.height;
  const D_back = backSectionData.size.z;
  const height = backSectionData.size.y || H_room;
  if (!Number.isFinite(D_back) || D_back <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  const armThickness = D_back;
  const armLength = W_room - D_back;
  if (!Number.isFinite(armLength) || armLength <= 0) return null;

  const FIXED_GAP_CM = wardrobeOrKitchenCornerGapCm();
  backSectionData.lShape = {
    type: 'u-wardrobe',
    role: 'back',
    pairId: null,
    pairIdLeft: null,
    pairIdRight: null,
  };
  try {
    const backOffsetsMm = getSectionOffsetsMm(backSectionData);
    updateSectionSize(
      backSectionData,
      {
        left: FIXED_GAP_CM,
        right: FIXED_GAP_CM,
        bottom: (backOffsetsMm.bottomMm || 0) / 10,
        top: (backOffsetsMm.topMm || 0) / 10,
      },
      ((backSectionData.size && backSectionData.size.z ? backSectionData.size.z : D_back) / 10)
    );
  } catch (_) {}

  try {
    if (updateCabinetMarkersForSection && backSectionData.id) {
      updateCabinetMarkersForSection(backSectionData.id);
    }
  } catch (_) {}

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);

  const leftSection = createCustomSection(
    armThickness,
    height,
    armLength,
    new THREE.Vector3(roomWorldPos.x, roomWorldPos.y, roomWorldPos.z + state.room.depth),
    'left'
  );
  const rightSection = createCustomSection(
    armThickness,
    height,
    armLength,
    new THREE.Vector3(
      roomWorldPos.x + state.room.width,
      roomWorldPos.y,
      roomWorldPos.z + state.room.depth
    ),
    'right'
  );

  if (leftSection) {
    leftSection.lShape = {
      type: 'corner-wardrobe-left',
      role: 'left',
      pairId: backSectionData.id,
    };
  }
  if (rightSection) {
    rightSection.lShape = {
      type: 'corner-wardrobe',
      role: 'right',
      pairId: backSectionData.id,
    };
  }

  backSectionData.lShape = {
    type: 'u-wardrobe',
    role: 'back',
    pairId: leftSection?.id || rightSection?.id || null,
    pairIdLeft: leftSection?.id || null,
    pairIdRight: rightSection?.id || null,
  };
  if (backSectionData.division) {
    backSectionData.division.uShape = true;
    backSectionData.division.isLShapeBack = true;
  }

  const depthCm = D_back / 10;
  try {
    if (leftSection) {
      const markerLeft = getBackSectionCornerMarkerLeftWorldPos(backSectionData);
      let frontOffsetCm;
      if (markerLeft) {
        const gapMm = backSectionData.position.z - roomWorldPos.z;
        frontOffsetCm = (markerLeft.z - roomWorldPos.z - gapMm) / 10;
      } else {
        frontOffsetCm = depthCm;
      }
      updateSectionSize(
        leftSection,
        {
          front: frontOffsetCm,
          back: 0,
          bottom: (leftSection.offsets.bottomMm || 0) / 10,
          top: (leftSection.offsets.topMm || 0) / 10,
        },
        depthCm
      );
    }
  } catch (_) {}

  try {
    if (rightSection) {
      const markerRight = getBackSectionCornerMarkerWorldPos(backSectionData);
      let frontOffsetCm;
      if (markerRight) {
        const gapMm = backSectionData.position.z - roomWorldPos.z;
        frontOffsetCm = (markerRight.z - roomWorldPos.z - gapMm) / 10;
      } else {
        frontOffsetCm = depthCm;
      }
      updateSectionSize(
        rightSection,
        {
          front: frontOffsetCm,
          back: 0,
          bottom: (rightSection.offsets.bottomMm || 0) / 10,
          top: (rightSection.offsets.topMm || 0) / 10,
        },
        depthCm
      );
    }
  } catch (_) {}

  try {
    if (updateCabinetMarkersForSection) {
      if (backSectionData.id) {
        updateCabinetMarkersForSection(backSectionData.id);
        if (backSectionData.division && createSectionZones) createSectionZones(backSectionData);
      }
      if (leftSection?.id) {
        updateCabinetMarkersForSection(leftSection.id);
        if (leftSection.division && createSectionZones) createSectionZones(leftSection);
      }
      if (rightSection?.id) {
        updateCabinetMarkersForSection(rightSection.id);
        if (rightSection.division && createSectionZones) createSectionZones(rightSection);
      }
    }
  } catch (_) {}

  return { left: leftSection || null, right: rightSection || null };
}

/**
 * Правый угловой шкаф right+front:
 * основная секция на правой стене, приставная на передней.
 *
 * По размерам и зазорам повторяет back+right, но в системе координат правой стены:
 * - толщина приставной = глубина основной (size.x основной секции),
 * - длина вдоль стены = ширина комнаты минус глубина основной,
 * - фиксированный угловой зазор 5 см на основной секции со стороны стыка.
 *
 * deps: { createCustomSection, updateSectionSize, updateCabinetMarkersForSection, createSectionZones, getSectionOffsetsMm }
 */
export function createLinkedRightSectionForRight(rightSectionData, deps) {
  const {
    createCustomSection,
    updateSectionSize,
    updateCabinetMarkersForSection,
    createSectionZones,
    getSectionOffsetsMm,
  } = deps || {};

  if (
    !createCustomSection ||
    !updateSectionSize ||
    !getSectionOffsetsMm ||
    !state.room ||
    !rightSectionData ||
    rightSectionData.wallName !== 'right'
  ) {
    return;
  }

  const W_room = state.room.width;
  const H_room = state.room.height;
  // Толщина основной секции внутрь комнаты на правой стене.
  // По аналогии с универсальным createLinkedAttachedSection: для right/left берём size.x,
  // но если он ещё не проставлен, используем size.z как fallback.
  let D_right = (rightSectionData.size && rightSectionData.size.x) || 0;
  if (!Number.isFinite(D_right) || D_right <= 0) {
    D_right = (rightSectionData.size && rightSectionData.size.z) || 0;
  }
  const height = rightSectionData.size.y || H_room;

  if (!Number.isFinite(D_right) || D_right <= 0 || !Number.isFinite(height) || height <= 0) return;

  const frontThickness = D_right;
  const frontLength = W_room - D_right;
  if (!Number.isFinite(frontLength) || frontLength <= 0) return;

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  // Пересечение правой и передней стен: X = room.width, Z = 0.
  const rightFrontCornerWorld = new THREE.Vector3(
    roomWorldPos.x + state.room.width,
    roomWorldPos.y,
    roomWorldPos.z
  );

  const frontSection = createCustomSection(
    frontLength,
    height,
    frontThickness,
    rightFrontCornerWorld,
    'front'
  );
  if (!frontSection) return;

  // Тип для универсальной логики L‑углов: primary=right, attached=front.
  frontSection.lShape = {
    type: 'corner-right-front',
    role: 'front',
    pairId: rightSectionData.id,
  };

  rightSectionData.lShape = {
    type: 'corner-right-front',
    role: 'right',
    pairId: frontSection.id,
  };

  // Обрезаем приставную секцию у стыка и задаём глубину = толщине основной.
  try {
    const Dcm = D_right / 10;
    const frontOffsets = {
      left: 0,
      right: Dcm,
      bottom: (frontSection.offsets.bottomMm || 0) / 10,
      top: (frontSection.offsets.topMm || 0) / 10,
    };
    updateSectionSize(frontSection, frontOffsets, Dcm);
  } catch {}

  // Фиксированный угловой зазор 5 см на основной секции в плоскости Z (между правой и передней).
  try {
    const primOffsMm = getSectionOffsetsMm(rightSectionData);
    const primDepthCm = D_right / 10;
    const CORNER_GAP_CM = wardrobeOrKitchenCornerGapCm();
    const bot = (primOffsMm.bottomMm || 0) / 10;
    const top = (primOffsMm.topMm || 0) / 10;

    const primOffsets = {
      front: 0,
      back: CORNER_GAP_CM,
      bottom: bot,
      top,
    };

    updateSectionSize(rightSectionData, primOffsets, primDepthCm);
  } catch {}

  // Обновляем маркеры и зоны для обеих секций.
  try {
    if (updateCabinetMarkersForSection) {
      if (rightSectionData.id) {
        updateCabinetMarkersForSection(rightSectionData.id);
        if (rightSectionData.division && createSectionZones) createSectionZones(rightSectionData);
      }
      if (frontSection.id) {
        updateCabinetMarkersForSection(frontSection.id);
        if (frontSection.division && createSectionZones) createSectionZones(frontSection);
      }
    }
  } catch {}

  return frontSection;
}

/**
 * Правый угловой шкаф left+back:
 * основная секция на левой стене, приставная на задней.
 *
 * По размерам и зазорам повторяет back+right, но в системе координат левой стены.
 *
 * deps: { createCustomSection, updateSectionSize, updateCabinetMarkersForSection, createSectionZones, getSectionOffsetsMm }
 */
export function createLinkedRightSectionForLeft(leftSectionData, deps) {
  const {
    createCustomSection,
    updateSectionSize,
    updateCabinetMarkersForSection,
    createSectionZones,
    getSectionOffsetsMm,
  } = deps || {};
  if (!createCustomSection || !updateSectionSize || !getSectionOffsetsMm) return;
  if (!state.room || !leftSectionData || leftSectionData.wallName !== 'left') return;

  // Приставная задняя секция идёт вдоль задней стены (ось X) → берём ширину комнаты.
  const W_room = state.room.width;
  const H_room = state.room.height;

  let D_left = (leftSectionData.size && leftSectionData.size.x) || 0;
  if (!Number.isFinite(D_left) || D_left <= 0) {
    D_left = (leftSectionData.size && leftSectionData.size.z) || 0;
  }
  const height = leftSectionData.size.y || H_room;
  if (!Number.isFinite(D_left) || D_left <= 0 || !Number.isFinite(height) || height <= 0) return;

  const backThickness = D_left;
  const backLength = W_room - D_left;
  if (!Number.isFinite(backLength) || backLength <= 0) return;

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const leftBackCornerWorld = new THREE.Vector3(
    roomWorldPos.x,
    roomWorldPos.y,
    roomWorldPos.z + state.room.depth
  );

  const backSection = createCustomSection(
    backLength,
    height,
    backThickness,
    leftBackCornerWorld,
    'back'
  );
  if (!backSection) return;

  backSection.lShape = {
    type: 'corner-left-back',
    role: 'back',
    pairId: leftSectionData.id,
  };

  leftSectionData.lShape = {
    type: 'corner-left-back',
    role: 'left',
    pairId: backSection.id,
  };

  try {
    const Dcm = D_left / 10;
    const backOffsets = {
      left: Dcm,
      right: 0,
      bottom: (backSection.offsets.bottomMm || 0) / 10,
      top: (backSection.offsets.topMm || 0) / 10,
    };
    updateSectionSize(backSection, backOffsets, Dcm);
  } catch {}

  try {
    const primOffsMm = getSectionOffsetsMm(leftSectionData);
    const primDepthCm = D_left / 10;
    const CORNER_GAP_CM = wardrobeOrKitchenCornerGapCm();
    const bot = (primOffsMm.bottomMm || 0) / 10;
    const top = (primOffsMm.topMm || 0) / 10;
    const primOffsets = {
      // Шкаф 5 см / кухня 0 на стыке с задней стеной.
      back: CORNER_GAP_CM,
      front: (primOffsMm.frontMm || 0) / 10,
      bottom: bot,
      top,
    };
    updateSectionSize(leftSectionData, primOffsets, primDepthCm);
  } catch {}

  try {
    if (updateCabinetMarkersForSection) {
      if (leftSectionData.id) {
        updateCabinetMarkersForSection(leftSectionData.id);
        if (leftSectionData.division && createSectionZones) createSectionZones(leftSectionData);
      }
      if (backSection.id) {
        updateCabinetMarkersForSection(backSection.id);
        if (backSection.division && createSectionZones) createSectionZones(backSection);
      }
    }
  } catch {}

  return backSection;
}

/**
 * Правый угловой шкаф front+left:
 * основная секция на передней стене, приставная на левой.
 *
 * По размерам и зазорам повторяет back+right, но в системе координат передней стены.
 *
 * deps: { createCustomSection, updateSectionSize, updateCabinetMarkersForSection, createSectionZones, getSectionOffsetsMm }
 */
export function createLinkedRightSectionForFront(frontSectionData, deps) {
  const {
    createCustomSection,
    updateSectionSize,
    updateCabinetMarkersForSection,
    createSectionZones,
    getSectionOffsetsMm,
  } = deps || {};
  if (!createCustomSection || !updateSectionSize || !getSectionOffsetsMm) return;
  if (!state.room || !frontSectionData || frontSectionData.wallName !== 'front') return;

  // Приставная левая секция идёт вдоль левой стены (ось Z) → берём глубину комнаты.
  const W_room = state.room.depth;
  const H_room = state.room.height;
  const D_front = (frontSectionData.size && frontSectionData.size.z) || 0;
  const height = frontSectionData.size.y || H_room;
  if (!Number.isFinite(D_front) || D_front <= 0 || !Number.isFinite(height) || height <= 0) return;

  const leftThickness = D_front;
  const leftLength = W_room - D_front;
  if (!Number.isFinite(leftLength) || leftLength <= 0) return;

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const frontLeftCornerWorld = new THREE.Vector3(
    roomWorldPos.x,
    roomWorldPos.y,
    roomWorldPos.z
  );

  const leftSection = createCustomSection(
    leftLength,
    height,
    leftThickness,
    frontLeftCornerWorld,
    'left'
  );
  if (!leftSection) return;

  leftSection.lShape = {
    type: 'corner-front-left',
    role: 'left',
    pairId: frontSectionData.id,
  };

  frontSectionData.lShape = {
    type: 'corner-front-left',
    role: 'front',
    pairId: leftSection.id,
  };

  try {
    const Dcm = D_front / 10;
    const leftOffsets = {
      // Отрезаем передний торец приставной левой секции — там сидит основная фронтальная.
      front: Dcm,
      back: 0,
      bottom: (leftSection.offsets.bottomMm || 0) / 10,
      top: (leftSection.offsets.topMm || 0) / 10,
    };
    updateSectionSize(leftSection, leftOffsets, Dcm);
  } catch {}

  try {
    const primOffsMm = getSectionOffsetsMm(frontSectionData);
    const primDepthCm = D_front / 10;
    const CORNER_GAP_CM = wardrobeOrKitchenCornerGapCm();
    const bot = (primOffsMm.bottomMm || 0) / 10;
    const top = (primOffsMm.topMm || 0) / 10;
    const primOffsets = {
      // Угол на левом торце фронтальной → шкаф 5 см / кухня 0 слева.
      left: CORNER_GAP_CM,
      right: (primOffsMm.rightMm || 0) / 10,
      bottom: bot,
      top,
    };
    updateSectionSize(frontSectionData, primOffsets, primDepthCm);
  } catch {}

  try {
    if (updateCabinetMarkersForSection) {
      if (frontSectionData.id) {
        updateCabinetMarkersForSection(frontSectionData.id);
        if (frontSectionData.division && createSectionZones) createSectionZones(frontSectionData);
      }
      if (leftSection.id) {
        updateCabinetMarkersForSection(leftSection.id);
        if (leftSection.division && createSectionZones) createSectionZones(leftSection);
      }
    }
  } catch {}

  return leftSection;
}

