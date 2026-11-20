/**
 * Выемки Gola на боковинах НМ → __cldGrooves → CFRN → Базис-ЧПУ.
 * Не паз в пласть: отсечение торца (как «Выемка» в Базис-Мебельщик).
 * Фреза Ø6 мм → R=3 на углах. Глубина с торца 27 мм (профиль).
 *
 * Раскладка 2 ящика (корпус 780):
 *   фасад 343 + зазор C + фасад 343 + зона L сверху.
 *   Центр выемки C = 360 от низа корпуса.
 */
export const GOLA_MILL_D_MM = 6;
export const GOLA_CORNER_R_MM = GOLA_MILL_D_MM / 2;
/** Длина выборки от переднего торца (глубина профиля 27). */
export const GOLA_SLOT_LEN_MM = 27;
/** Глубина в материал (clamp к толщине боковины). */
export const GOLA_CUT_DEPTH_MM = 16;

/** L под столешницей. */
export const GOLA_L_SLOT_H_MM = 57.5;
/** @deprecated use GOLA_L_SLOT_H_MM */
export const GOLA_SLOT_H_MM = GOLA_L_SLOT_H_MM;

/** C между ящиками (Boyard RP050): высота профиля / выборки. */
export const GOLA_C_SLOT_H_MM = 73.5;
/** Центр паза C от низа корпуса, мм. */
export const GOLA_C_CENTER_Y_MM = 360;

/** Фасад одного ящика на модуле Gola с 2 ящиками. */
export const GOLA_TWO_DRAWER_FACADE_H_MM = 343;
export const GOLA_TWO_DRAWER_COUNT = 2;
/** Корпус НМ Gola (без опор), с которым согласована сетка 343/360. */
export const GOLA_TWO_DRAWER_CARCASS_H_MM = 780;

/**
 * Сетка фасадов 2×343 на корпусе Gola.
 * Y от низа корпуса: низ 0…343, верх 343+gap…343+gap+343, L сверху.
 */
export function resolveGolaTwoDrawerFacadeLayoutMm(opts) {
  const o = opts || {};
  const carcassH = Math.round(
    Number(o.carcassHeightMm) > 0 ? Number(o.carcassHeightMm) : GOLA_TWO_DRAWER_CARCASS_H_MM
  );
  const facadeH = GOLA_TWO_DRAWER_FACADE_H_MM;
  const lZone = Math.max(GOLA_MILL_D_MM, GOLA_L_SLOT_H_MM);
  const cSlotH = Math.max(GOLA_MILL_D_MM, GOLA_C_SLOT_H_MM);
  const gapBetween = Math.max(0, Math.round((carcassH - lZone - 2 * facadeH) * 10) / 10);
  const cCenterY = Math.round((facadeH + gapBetween / 2) * 10) / 10;
  const cCenterFixed = GOLA_C_CENTER_Y_MM;
  const lowerY0 = 0;
  const lowerY1 = facadeH;
  const upperY0 = facadeH + gapBetween;
  const upperY1 = upperY0 + facadeH;
  return {
    ok: carcassH >= 2 * facadeH + lZone,
    drawerCount: GOLA_TWO_DRAWER_COUNT,
    carcassHeightMm: carcassH,
    facadeHeightMm: facadeH,
    gapBetweenFacadesMm: gapBetween,
    lowerFacade: { y0Mm: lowerY0, y1Mm: lowerY1, heightMm: facadeH },
    upperFacade: { y0Mm: upperY0, y1Mm: upperY1, heightMm: facadeH },
    cGroove: {
      centerYMm: cCenterFixed,
      heightMm: cSlotH,
      derivedCenterYMm: cCenterY,
    },
    lGroove: {
      heightMm: lZone,
      y0Mm: Math.max(0, carcassH - lZone),
      y1Mm: carcassH,
    },
    rule: 'gola_two_drawer_facade_343',
  };
}

const TAG_L = 'kitchen_gola_l';
const TAG_C = 'kitchen_gola_c';
const TAG_PREFIX = 'kitchen_gola_';

function panelSizeMm(obj) {
  const ud = obj?.userData || {};
  let sz = ud.__cldCfrnSizeMm;
  if (!sz && ud.cldTrimNominalSizeMm) {
    const t = ud.cldTrimNominalSizeMm;
    sz = { x: t.w, y: t.h, z: t.d };
  }
  if (!sz && ud.originalSize) {
    sz = ud.originalSize;
  }
  if (!sz) return null;
  const x = Number(sz.x);
  const y = Number(sz.y);
  const z = Number(sz.z);
  if (!(x > 0 && y > 0 && z > 0)) return null;
  return { x, y, z };
}

function isSideWallCandidate(obj) {
  if (!obj?.userData) return false;
  const ud = obj.userData;
  const orient = ud.__cldPanelOrientation || ud.config?.spec?.orientation;
  if (orient && orient !== 'v') return false;
  const sz = panelSizeMm(obj);
  if (!sz) return false;
  // orientation v: thickness=x, height=y, depth=z
  const th = sz.x;
  const ch = sz.y;
  const cw = sz.z;
  if (!(th > 0 && th <= 40 && ch > 200 && cw > 80)) return false;
  const nm = String(obj.name || '').toLowerCase();
  if (
    /фасад|facade|двер|drawer|ящик|полк|shelf|зад|спин|back|цокол|plinth|дно|крыш|горизонт|полка|опора/.test(
      nm
    )
  ) {
    return false;
  }
  const named =
    !!ud.isSidePlank ||
    /бок|side|:left|:right|лев|прав|left_wall|right_wall|left|right|стенк/.test(nm);
  if (named) return true;
  // Безымянная тонкая вертикаль корпуса
  return th <= 22 && orient === 'v';
}

function cutDepthForThickness(thicknessMm) {
  return Math.min(
    Math.max(GOLA_MILL_D_MM, GOLA_CUT_DEPTH_MM),
    Math.max(GOLA_MILL_D_MM, Number(thicknessMm) || GOLA_CUT_DEPTH_MM)
  );
}

function frontDz(cw) {
  const slotLen = Math.max(GOLA_MILL_D_MM, GOLA_SLOT_LEN_MM);
  const depthAlong = Number(cw) || 0;
  return Math.max(0, depthAlong - slotLen);
}

/** L: центр у верха боковины. */
function buildGolaLGrooveMeta(cw, ch, thicknessMm) {
  const slotH = Math.max(GOLA_MILL_D_MM, GOLA_L_SLOT_H_MM);
  const half = slotH / 2;
  const offsetAlongMm = Math.max(half, (Number(ch) || 0) - half);
  return {
    kind: 'notch',
    tag: TAG_L,
    name: `Выемка Gola L Ø${GOLA_MILL_D_MM}`,
    widthMm: slotH,
    depthMm: cutDepthForThickness(thicknessMm),
    offsetAlongMm,
    trajOrient: 'h',
    direction: '-z',
    dz: frontDz(cw),
    dz2: 0,
    frontSide: false,
    millDiameterMm: GOLA_MILL_D_MM,
    cornerRadiusMm: GOLA_CORNER_R_MM,
    edgeDepthMm: GOLA_SLOT_LEN_MM,
    trajectory: null,
  };
}

/** C (RP050): центр на 360 (= сетка 2×фасад 343). */
function buildGolaCGrooveMeta(cw, ch, thicknessMm) {
  const layout = resolveGolaTwoDrawerFacadeLayoutMm({ carcassHeightMm: ch });
  const slotH = Math.max(GOLA_MILL_D_MM, GOLA_C_SLOT_H_MM);
  const half = slotH / 2;
  const chN = Number(ch) || 0;
  let offsetAlongMm = layout.cGroove.centerYMm;
  if (chN > 0) {
    offsetAlongMm = Math.min(Math.max(offsetAlongMm, half), chN - half);
  }
  return {
    kind: 'notch',
    tag: TAG_C,
    name: `Выемка Gola C Ø${GOLA_MILL_D_MM}`,
    widthMm: slotH,
    depthMm: cutDepthForThickness(thicknessMm),
    offsetAlongMm,
    trajOrient: 'h',
    direction: '-z',
    dz: frontDz(cw),
    dz2: 0,
    frontSide: false,
    millDiameterMm: GOLA_MILL_D_MM,
    cornerRadiusMm: GOLA_CORNER_R_MM,
    edgeDepthMm: GOLA_SLOT_LEN_MM,
    centerYMm: GOLA_C_CENTER_Y_MM,
    trajectory: null,
  };
}

function buildGolaGroovesForPanel(cw, ch, thicknessMm) {
  return [
    buildGolaLGrooveMeta(cw, ch, thicknessMm),
    buildGolaCGrooveMeta(cw, ch, thicknessMm),
  ];
}

function stampGrooveList(target, grooves) {
  if (!target?.userData) return;
  const prev = Array.isArray(target.userData.__cldGrooves)
    ? target.userData.__cldGrooves
    : [];
  const kept = prev.filter(
    (g) => !(g && typeof g.tag === 'string' && g.tag.indexOf(TAG_PREFIX) === 0)
  );
  for (let i = 0; i < grooves.length; i++) {
    kept.push({ ...grooves[i] });
  }
  target.userData.__cldGrooves = kept;
}

function stampOnPanel(panel) {
  const sz = panelSizeMm(panel);
  if (!sz) return null;
  const grooves = buildGolaGroovesForPanel(sz.z, sz.y, sz.x);
  stampGrooveList(panel, grooves);
  const kids = panel.children || [];
  for (let i = 0; i < kids.length; i++) {
    const child = kids[i];
    if (!child?.isMesh || !child.userData) continue;
    if (child.userData.isEdge || child.userData.isHole) continue;
    const nm = String(child.name || '');
    const cud = child.userData;
    if (
      cud.isBody ||
      cud.isDetail ||
      nm === '_core' ||
      /_core/i.test(nm) ||
      cud.__cldPanelOrientation === 'v'
    ) {
      stampGrooveList(child, grooves);
    }
  }
  return grooves;
}

/**
 * @param {THREE.Object3D} group мебель НМ
 * @returns {{ ok: boolean, stamped: number, reason?: string }}
 */
export function stampKitchenGolaGroovesOnGroup(group) {
  if (!group?.isObject3D) return { ok: false, stamped: 0, reason: 'no_group' };
  const panels = [];
  group.traverse((obj) => {
    if (!obj) return;
    if (!isSideWallCandidate(obj)) return;
    panels.push(obj);
  });

  const seen = new Set();
  let stamped = 0;
  for (const p of panels) {
    let ancestorSide = false;
    let par = p.parent;
    for (let i = 0; i < 6 && par; i++) {
      if (isSideWallCandidate(par)) {
        ancestorSide = true;
        break;
      }
      par = par.parent;
    }
    if (ancestorSide || seen.has(p.uuid)) continue;
    seen.add(p.uuid);
    if (stampOnPanel(p)) stamped += 1;
  }

  if (typeof console !== 'undefined' && console.log) {
    const layout = resolveGolaTwoDrawerFacadeLayoutMm({});
    console.log('[KITCHEN-GOLA] grooves stamped', {
      stamped,
      candidates: panels.length,
      millD: GOLA_MILL_D_MM,
      facade2x: layout.facadeHeightMm,
      gap: layout.gapBetweenFacadesMm,
      L: { h: GOLA_L_SLOT_H_MM, len: GOLA_SLOT_LEN_MM },
      C: {
        h: GOLA_C_SLOT_H_MM,
        centerY: GOLA_C_CENTER_Y_MM,
        len: GOLA_SLOT_LEN_MM,
      },
      name: group.userData?.catalogName || group.name || '',
    });
  }
  return { ok: stamped > 0, stamped };
}

if (typeof window !== 'undefined') {
  window.__cldStampKitchenGolaGrooves = stampKitchenGolaGroovesOnGroup;
  window.__cldResolveGolaTwoDrawerFacadeLayoutMm = resolveGolaTwoDrawerFacadeLayoutMm;
  window.__cldGolaTwoDrawerFacadeHMm = GOLA_TWO_DRAWER_FACADE_H_MM;
}
