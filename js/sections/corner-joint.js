/**
 * §6.8.3 A3: стык угла в осях стен (не «back+right» как отдельный мир).
 *
 * L = две прямые секции + один joint.
 * П = одна прямая + два joint (left и right hand).
 */

const CLOCKWISE = { back: 'right', right: 'front', front: 'left', left: 'back' };
const CCW = { back: 'left', left: 'front', front: 'right', right: 'back' };

function attachedWallForHand(primaryWall, hand) {
  const map = hand === 'right' ? CLOCKWISE : CCW;
  return map[primaryWall] || null;
}

export const CORNER_GAP_CM = 5;

const WALLS = new Set(['front', 'back', 'left', 'right']);

function normWall(name) {
  const w = String(name || '').trim().toLowerCase();
  return WALLS.has(w) ? w : null;
}

/** Глубина секции внутрь комнаты (W), мм. */
export function sectionDepthWmm(section) {
  const wall = normWall(section?.wallName) || 'back';
  const size = section?.size;
  if (!size) return 0;
  const w =
    wall === 'left' || wall === 'right' ? Number(size.x) : Number(size.z);
  return Number.isFinite(w) && w > 0 ? w : 0;
}

/**
 * Поле offsets на секции стены `onWall`, которым секция отодвигается от стены `towardWall`.
 * left/right: front → к back (z≈0), back → к front (z≈depth). См. SPEC §6.8.3.
 * @returns {'left'|'right'|'front'|'back'|null}
 */
export function offsetSideTowardWall(onWall, towardWall) {
  const a = normWall(onWall);
  const b = normWall(towardWall);
  if (!a || !b || a === b) return null;
  if (a === 'back' || a === 'front') {
    return b === 'left' || b === 'right' ? b : null;
  }
  if (b === 'back') return 'front';
  if (b === 'front') return 'back';
  return null;
}

/** Локальный угол комнаты (пересечение плоскостей двух стен). */
export function roomCornerLocal(wallA, wallB, room) {
  const a = normWall(wallA);
  const b = normWall(wallB);
  if (!a || !b || !room) return null;
  const x = a === 'right' || b === 'right' ? Number(room.width) || 0 : 0;
  const z = a === 'front' || b === 'front' ? Number(room.depth) || 0 : 0;
  return { x, z };
}

/**
 * @param {'front'|'back'|'left'|'right'} primaryWall
 * @param {'left'|'right'} hand
 * @returns {{
 *   hand: 'left'|'right',
 *   primary: string,
 *   attached: string,
 *   cornerAtStart: boolean,
 *   typeKey: string,
 *   primaryGapSide: string,
 *   attachedTrimSide: string,
 * }|null}
 */
export function resolveCornerJoint(primaryWall, hand) {
  const primary = normWall(primaryWall);
  const h = hand === 'left' ? 'left' : hand === 'right' ? 'right' : null;
  if (!primary || !h) return null;
  const attached = attachedWallForHand(primary, h);
  if (!attached) return null;
  const primaryGapSide = offsetSideTowardWall(primary, attached);
  const attachedTrimSide = offsetSideTowardWall(attached, primary);
  if (!primaryGapSide || !attachedTrimSide) return null;
  return {
    hand: h,
    primary,
    attached,
    cornerAtStart: h === 'left',
    typeKey: `corner-${primary}-${attached}`,
    primaryGapSide,
    attachedTrimSide,
  };
}

function emptyAlongOffsets(wallName) {
  const w = normWall(wallName);
  if (w === 'left' || w === 'right') {
    return { front: 0, back: 0, bottom: 0, top: 0 };
  }
  return { left: 0, right: 0, bottom: 0, top: 0 };
}

function withBottomTop(base, section, getSectionOffsetsMm) {
  const out = { ...base };
  try {
    const mm = getSectionOffsetsMm?.(section) || {};
    if ('left' in out) out.left = (Number(mm.leftMm) || 0) / 10;
    if ('right' in out) out.right = (Number(mm.rightMm) || 0) / 10;
    if ('front' in out) out.front = (Number(mm.frontMm) || 0) / 10;
    if ('back' in out) out.back = (Number(mm.backMm) || 0) / 10;
    out.bottom = (Number(mm.bottomMm) || 0) / 10;
    out.top = (Number(mm.topMm) || 0) / 10;
  } catch (_) {}
  return out;
}

/**
 * Создать приставную прямую на attached и связать pair.
 * Одно правило для любой пары стен.
 *
 * @returns {object|null} attached section
 */
export function createLinkedSectionFromJoint(primarySection, hand, deps, opts = {}) {
  const {
    createCustomSection,
    updateSectionSize,
    updateCabinetMarkersForSection,
    createSectionZones,
    getSectionOffsetsMm,
    room,
    roomWorldPos,
  } = deps || {};
  if (!createCustomSection || !updateSectionSize || !room || !primarySection) {
    return null;
  }

  const joint = resolveCornerJoint(primarySection.wallName, hand);
  if (!joint) return null;
  const skipPrimaryResize = opts.skipPrimaryResize === true;
  const skipPrimaryLShape = opts.skipPrimaryLShape === true;

  const D = sectionDepthWmm(primarySection);
  const height = Number(primarySection.size?.y) || Number(room.height) || 0;
  if (!(D > 0) || !(height > 0)) return null;

  const Dcm = D / 10;
  const corner = roomCornerLocal(joint.primary, joint.attached, room);
  if (!corner || !roomWorldPos) return null;

  const attachedIsLR = joint.attached === 'left' || joint.attached === 'right';
  const initW = attachedIsLR ? D : Number(room.width) || D;
  const initD = attachedIsLR ? Number(room.depth) || D : D;
  const seed = roomWorldPos.clone();
  seed.x += corner.x;
  seed.z += corner.z;

  const attached = createCustomSection(initW, height, initD, seed, joint.attached);
  if (!attached) return null;

  attached.lShape = {
    type: joint.typeKey,
    role: joint.attached,
    pairId: primarySection.id,
    hand: joint.hand,
    cornerAtStart: joint.cornerAtStart,
  };
  if (!skipPrimaryLShape) {
    primarySection.lShape = {
      type: joint.typeKey,
      role: joint.primary,
      pairId: attached.id,
      hand: joint.hand,
      cornerAtStart: joint.cornerAtStart,
    };
  }
  if (primarySection.group?.userData) primarySection.group.userData.isCornerSection = true;
  if (attached.group?.userData) attached.group.userData.isCornerSection = true;

  const attOff = withBottomTop(emptyAlongOffsets(joint.attached), attached, getSectionOffsetsMm);
  attOff[joint.attachedTrimSide] = Dcm;
  try {
    updateSectionSize(attached, attOff, Dcm);
  } catch (e) {
    console.warn('[CORNER-JOINT] attached updateSectionSize', e);
  }

  if (!skipPrimaryResize) {
    const primOff = withBottomTop(emptyAlongOffsets(joint.primary), primarySection, getSectionOffsetsMm);
    primOff[joint.primaryGapSide] = CORNER_GAP_CM;
    try {
      updateSectionSize(primarySection, primOff, Dcm);
    } catch (e) {
      console.warn('[CORNER-JOINT] primary updateSectionSize', e);
    }
  }

  try {
    if (updateCabinetMarkersForSection) {
      if (primarySection.id) {
        updateCabinetMarkersForSection(primarySection.id);
        if (primarySection.division && createSectionZones) createSectionZones(primarySection);
      }
      if (attached.id) {
        updateCabinetMarkersForSection(attached.id);
        if (attached.division && createSectionZones) createSectionZones(attached);
      }
    }
  } catch (e) {
    console.warn('[CORNER-JOINT] markers/zones', e);
  }

  console.log('[CORNER-JOINT] pair', {
    hand: joint.hand,
    primary: joint.primary,
    attached: joint.attached,
    typeKey: joint.typeKey,
    D,
    primaryId: primarySection.id,
    attachedId: attached.id,
  });
  return attached;
}

/**
 * П: два стыка от одной primary (обе руки).
 * @returns {{ left: object|null, right: object|null }|null}
 */
function inferJointFromTypeKey(type) {
  const t = String(type || '');
  const mapped =
    t === 'corner-wardrobe' || t === 'top-right'
      ? 'corner-back-right'
      : t === 'corner-wardrobe-left' || t === 'top-left'
        ? 'corner-back-left'
        : t;
  const m = mapped.match(/^corner-(front|back|left|right)-(front|back|left|right)$/);
  if (!m) return null;
  const jL = resolveCornerJoint(m[1], 'left');
  if (jL && jL.attached === m[2]) return jL;
  const jR = resolveCornerJoint(m[1], 'right');
  if (jR && jR.attached === m[2]) return jR;
  return null;
}

/**
 * Один joint пары — из typeKey / hand primary, не «hand этой стены».
 * Иначе attached.hand=left на left даёт другой угол (left→front).
 */
export function resolveSectionCornerJoint(section) {
  const ls = section?.lShape;
  if (!ls) return null;
  const fromType = inferJointFromTypeKey(ls.type);
  if (fromType) return fromType;
  const wall = normWall(section.wallName);
  const hand = ls.hand === 'left' || ls.hand === 'right' ? ls.hand : null;
  if (wall && hand) return resolveCornerJoint(wall, hand);
  return null;
}

/**
 * Обклад стыка из joint (§6.8.3). Не typeKey×стена.
 * Primary: 50 мм + скрыть торец к attached.
 * Attached: планка на стыке, без накладки; торец не глушить.
 */
export function getCornerJointTrimPlan(section, findPair) {
  const wall = normWall(section?.wallName);
  const ls = section?.lShape;
  if (!wall || !ls) return null;

  const isUSpine =
    ls.type === 'u-wardrobe' ||
    (!!ls.pairIdLeft && !!ls.pairIdRight && ls.role === wall && !ls.hand);

  const joints = [];
  if (isUSpine) {
    const jL = resolveCornerJoint(wall, 'left');
    const jR = resolveCornerJoint(wall, 'right');
    if (jL) joints.push(jL);
    if (jR) joints.push(jR);
  } else {
    const j = resolveSectionCornerJoint(section);
    if (j) joints.push(j);
  }
  if (!joints.length) return null;

  const role = isUSpine || joints.some((j) => j.primary === wall) ? 'primary' : 'attached';
  const jointSides = [];
  const gapFields = [];
  for (const j of joints) {
    if (role === 'primary') {
      if (j.primaryGapSide) {
        jointSides.push(j.primaryGapSide);
        gapFields.push(j.primaryGapSide);
      }
    } else if (j.attachedTrimSide) {
      jointSides.push(j.attachedTrimSide);
    }
  }

  let overlapMm = 0;
  if (role === 'primary' && typeof findPair === 'function') {
    for (const j of joints) {
      const pair = findPair(section, j);
      if (!pair) continue;
      const attW = sectionDepthWmm(pair);
      overlapMm = Math.max(overlapMm, Math.max(0, attW - CORNER_GAP_CM * 10));
    }
  }

  const cornerAtStart =
    typeof ls.cornerAtStart === 'boolean'
      ? ls.cornerAtStart
      : isUSpine
        ? null
        : joints[0]?.cornerAtStart ?? null;

  return {
    role,
    uShape: isUSpine,
    joints,
    jointSides: [...new Set(jointSides)],
    gapFields: [...new Set(gapFields)],
    gapMm: CORNER_GAP_CM * 10,
    suppressJoint: role === 'primary',
    noOverlayJoint: true,
    overlapMm,
    cornerAtStart,
  };
}

export function createUShapeArmsFromJoints(primarySection, deps) {
  if (!primarySection || !deps?.updateSectionSize || !deps.room) return null;
  const jR = resolveCornerJoint(primarySection.wallName, 'right');
  const jL = resolveCornerJoint(primarySection.wallName, 'left');
  if (!jR || !jL) return null;
  const D = sectionDepthWmm(primarySection);
  if (!(D > 0)) return null;
  const Dcm = D / 10;
  const primOff = withBottomTop(
    emptyAlongOffsets(primarySection.wallName),
    primarySection,
    deps.getSectionOffsetsMm
  );
  primOff[jR.primaryGapSide] = CORNER_GAP_CM;
  primOff[jL.primaryGapSide] = CORNER_GAP_CM;
  try {
    deps.updateSectionSize(primarySection, primOff, Dcm);
  } catch (e) {
    console.warn('[CORNER-JOINT] U primary updateSectionSize', e);
  }

  const right = createLinkedSectionFromJoint(primarySection, 'right', deps, {
    skipPrimaryResize: true,
    skipPrimaryLShape: true,
  });
  const left = createLinkedSectionFromJoint(primarySection, 'left', deps, {
    skipPrimaryResize: true,
    skipPrimaryLShape: true,
  });
  const pairRight = right?.id || null;
  const pairLeft = left?.id || null;
  primarySection.lShape = {
    type: 'u-wardrobe',
    role: primarySection.wallName,
    pairId: pairRight || pairLeft,
    pairIdRight: pairRight,
    pairIdLeft: pairLeft,
    hand: null,
  };
  if (right?.lShape) right.lShape.uSpineId = primarySection.id;
  if (left?.lShape) left.lShape.uSpineId = primarySection.id;
  return { left: left || null, right: right || null };
}
