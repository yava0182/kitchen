/**
 * Размерные метки петель в комнате (сверка с админкой «петли по ролям», measure: module).
 * Y — мм от нижнего края фасадной оболочки; цепочка — отступы между петлями и краями.
 */
import * as THREE from 'three';
import { state } from '../utils/state.js';
import { createDimensionLabel } from '../ui/scene-icons.js';

const HINGE_LABEL_CLASS = 'hinge-role-marker-label';
const CHAIN_LABEL_CLASS = 'hinge-role-chain-label';

function isMarkersEnabled() {
  if (typeof window === 'undefined') return false;
  return window.DEBUG_HINGE_ROLE_MARKERS === true || window.DEBUG_HINGE_ROLE_MARKERS === 1;
}

function isGuideLinesEnabled() {
  if (typeof window === 'undefined') return false;
  if (!isMarkersEnabled()) return false;
  return window.DEBUG_HINGE_ROLE_GUIDE_LINES === true || window.DEBUG_HINGE_ROLE_GUIDE_LINES === 1;
}

function isHingeVerifyEnabled() {
  if (typeof window === 'undefined') return false;
  return window.DEBUG_HINGE_ROLE_VERIFY === true || window.DEBUG_HINGE_ROOM === true;
}

function resolveSwingForHinge(hingeGroup, facadeGroup) {
  let swing = null;
  for (let p = hingeGroup?.parent; p && !swing; p = p.parent) {
    if (p.name === '__door_swing' || p.userData?.cldDoorSwing) swing = p;
  }
  if (!swing && facadeGroup) {
    const ownerUuid = String(hingeGroup?.uuid || '');
    facadeGroup.traverse((o) => {
      if (swing) return;
      if (o?.name !== '__door_swing') return;
      if (!ownerUuid) {
        swing = o;
        return;
      }
      let owned = false;
      o.traverse((c) => {
        if (owned) return;
        if (String(c.userData?._cldHingeOwnerUuid || '') === ownerUuid) owned = true;
      });
      if (owned) swing = o;
    });
  }
  return swing;
}

function findFacadePanelMeshInSwing(swing, facadeGroup) {
  if (!swing && !facadeGroup) return null;
  let best = null;
  let bestScore = -1;
  const consider = (m) => {
    if (!m?.isMesh) return;
    const nm = String(m.name || '').toLowerCase();
    const ud = m.userData || {};
    if (ud.isCabinetModel && /петл|hinge|накладн/.test(nm)) return;
    if (/furni_hinge|model_.*петл|model_.*hinge/.test(nm)) return;
    const hint =
      (ud.isFacade ? 5 : 0) +
      (ud.isFacadePanel ? 5 : 0) +
      (/facade|фасад/.test(nm) ? 3 : 0) +
      (/ldsp|panel|door/.test(nm) ? 1 : 0);
    const box = new THREE.Box3().setFromObject(m);
    if (box.isEmpty()) return;
    const s = box.getSize(new THREE.Vector3());
    const area = Math.max(0, s.x) * Math.max(0, s.y);
    const score = hint * 1e9 + area;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  };
  const pickFrom = (root) => {
    if (!root?.traverse) return;
    root.traverse((o) => consider(o));
  };
  if (swing) pickFrom(swing);
  if (!best && facadeGroup) pickFrom(facadeGroup);
  return best;
}

function resolvePanelMinYForHinge(hingeGroup, facadeGroup, facadeBoxFallback) {
  const swing = resolveSwingForHinge(hingeGroup, facadeGroup);
  const panel = findFacadePanelMeshInSwing(swing, facadeGroup);
  if (panel) {
    try {
      const b = new THREE.Box3().setFromObject(panel);
      if (!b.isEmpty()) return b.min.y;
    } catch (_) {}
  }
  return facadeBoxFallback?.min?.y ?? null;
}

function resolveHingeAnimatorWorldPos(hingeGroup, facadeGroup, out) {
  const v = out || new THREE.Vector3();
  let anim = null;
  hingeGroup?.traverse?.((o) => {
    if (anim) return;
    if (!o?.userData?.isAnimator) return;
    if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
    anim = o;
  });
  if (!anim && facadeGroup) {
    let swing = null;
    facadeGroup.traverse((o) => {
      if (o?.name === '__door_swing') swing = o;
    });
    const ownerUuid = String(hingeGroup?.uuid || '');
    if (swing && ownerUuid) {
      swing.traverse((o) => {
        if (anim) return;
        if (!o?.userData?.isAnimator) return;
        if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
        const tag = String(o.userData._cldHingeOwnerUuid || '');
        if (tag && tag !== ownerUuid) return;
        anim = o;
      });
    }
  }
  if (anim) {
    anim.updateMatrixWorld(true);
    return anim.getWorldPosition(v);
  }
  hingeGroup.updateMatrixWorld(true);
  return hingeGroup.getWorldPosition(v);
}

function logHingeRoleMarkersVerify(
  furnitureGroup,
  facadeGroup,
  layoutRole,
  positions,
  shellSize,
  facadeBox
) {
  if (!isHingeVerifyEnabled()) return;
  const layoutVerify = facadeGroup?.userData?.hingeRoleLayoutVerify || null;
  const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
  let expectedFromLayout = layoutVerify?.expectedYs || null;
  if (!expectedFromLayout?.length && gen?.calcIntegerRoleHingeYs && layoutVerify?.dimensionMm) {
    try {
      expectedFromLayout = gen.calcIntegerRoleHingeYs(
        {
          hinges: positions.map((_, i) => ({ pos: '0', from: -1 })),
          hingeInsetTopMm: layoutVerify.insetTopMm,
          hingeInsetBottomMm: layoutVerify.insetBottomMm,
          __hingeRoleLayout: true,
        },
        layoutVerify.dimensionMm
      );
    } catch (_) {}
  }

  const wpAnim = new THREE.Vector3();
  const rows = positions.map((p, i) => {
    resolveHingeAnimatorWorldPos(p.hinge, facadeGroup, wpAnim);
    const expected =
      p.hinge.userData?.hingeRoleExpectedYMm ??
      (Array.isArray(expectedFromLayout) ? expectedFromLayout[i] : null);
    const treePos = p.hinge.userData?.hingeRoleTreePosYMm;
    return {
      slot: p.hinge.userData?.hingeLayoutSlotIndex ?? i,
      name: p.hinge.name,
      expectedYMm: Number.isFinite(Number(expected)) ? Number(expected) : null,
      treePosYMm: Number.isFinite(Number(treePos)) ? Number(treePos) : null,
      groupPosY: p.modulePosY,
      labelYFromFacadeBottom: Math.round(p.yMmFromBottom),
      animatorYFromFacadeBottom: Math.round(wpAnim.y - facadeBox.min.y),
      deltaLabelVsExpected: Number.isFinite(Number(expected))
        ? Math.round(p.yMmFromBottom - Number(expected))
        : null,
      deltaGroupPosVsExpected: Number.isFinite(Number(expected))
        ? Math.round(p.modulePosY - Number(expected))
        : null,
      deltaAnimVsExpected: Number.isFinite(Number(expected))
        ? Math.round(wpAnim.y - facadeBox.min.y - Number(expected))
        : null,
    };
  });
  rows.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

  console.warn('[CLD][HINGE-VERIFY][room/markers]', {
    furniture: furnitureGroup.name,
    layoutRole,
    facade: facadeGroup?.name,
    shellSizeOriginal: facadeGroup?.userData?.originalSize,
    shellSizeUsed: shellSize,
    facadeBox: {
      min: facadeBox.min.toArray(),
      max: facadeBox.max.toArray(),
      h: facadeBox.max.y - facadeBox.min.y,
    },
    layoutVerify,
    markerChainYs: positions.map((p) => Math.round(p.yMmFromBottom)),
    hinges: rows,
    hint:
      'delta≠0: метка (label) считает от bbox фасада; expected — из «петли по ролям»; groupPos — position.y модуля; animator — ось hinge_animator.',
  });
}

function collectCatalogHingeGroups(root) {
  const out = [];
  if (!root) return out;
  root.traverse((o) => {
    if (!o || !o.isGroup) return;
    if (o.userData?.isCatalogHingeModule) out.push(o);
  });
  return out;
}

const FACADE_LAYOUT_ROLES = ['facades', 'facades_main', 'facades_top'];

/** Найти ближайшую вверх по дереву фасадную group (по userData.layoutRole). */
function findOwningFacadeShell(node) {
  let p = node?.parent || null;
  while (p) {
    const lr = String(p.userData?.layoutRole || '').trim();
    if (FACADE_LAYOUT_ROLES.includes(lr)) return { group: p, layoutRole: lr };
    p = p.parent;
  }
  return null;
}

/**
 * Диагностический дамп: какие фасадные модули собраны и куда реально
 * легли петли. Виден layoutRole каждой петли (фактический parent) — отличается
 * ли он от того, к которому привязана раскладка.
 */
export function dumpFurnitureHingeStructure(furnitureGroup) {
  if (!isHingeVerifyEnabled() || !furnitureGroup) return;

  const shells = [];
  furnitureGroup.traverse((o) => {
    if (!o?.isGroup) return;
    const lr = String(o.userData?.layoutRole || '').trim();
    if (!FACADE_LAYOUT_ROLES.includes(lr)) return;
    const box = new THREE.Box3();
    try {
      box.setFromObject(o);
    } catch (_) {}
    const size = new THREE.Vector3();
    if (!box.isEmpty()) box.getSize(size);
    shells.push({
      name: o.name,
      layoutRole: lr,
      originalSize: o.userData?.originalSize || null,
      bboxMin: box.isEmpty() ? null : box.min.toArray(),
      bboxMax: box.isEmpty() ? null : box.max.toArray(),
      bboxSize: { x: size.x, y: size.y, z: size.z },
      position: o.position.toArray(),
      hingeRoleLayoutVerify: o.userData?.hingeRoleLayoutVerify || null,
    });
  });

  const hinges = collectCatalogHingeGroups(furnitureGroup);
  const hingeRows = hinges.map((h) => {
    const owner = findOwningFacadeShell(h);
    return {
      name: h.name,
      slot: h.userData?.hingeLayoutSlotIndex ?? null,
      ownerFacadeName: owner?.group?.name || null,
      ownerLayoutRole: owner?.layoutRole || null,
      hingeFacadeLayoutRole: h.userData?.hingeFacadeLayoutRole || null,
      groupPosY: Number(h.position?.y) || 0,
      expectedYMm: h.userData?.hingeRoleExpectedYMm ?? null,
      treePosYMm: h.userData?.hingeRoleTreePosYMm ?? null,
    };
  });

  console.warn('[CLD][HINGE-VERIFY][structure]', {
    furniture: furnitureGroup.name,
    facadeShellCount: shells.length,
    facadeShells: shells,
    hingeCount: hinges.length,
    hinges: hingeRows,
    hint:
      'Если facadeShellCount=1 — раскладка одна на всё. Если petли по ownerLayoutRole не делятся (все в одном facade), значит в шаблоне шкафа фасады не разнесены на отдельные module:hinges по ролям.',
  });
}

function findAllFacadeShellGroups(furnitureGroup) {
  const out = [];
  if (!furnitureGroup) return out;
  furnitureGroup.traverse((o) => {
    if (!o?.isGroup) return;
    const lr = String(o.userData?.layoutRole || '').trim();
    if (FACADE_LAYOUT_ROLES.includes(lr)) {
      out.push({ group: o, layoutRole: lr });
    }
  });
  const order = { facades: 0, facades_main: 1, facades_top: 2 };
  out.sort((a, b) => (order[a.layoutRole] ?? 9) - (order[b.layoutRole] ?? 9));
  return out;
}

function resolveFacadeShellSizeMm(facadeGroup, furnitureGroup) {
  const os = facadeGroup?.userData?.originalSize;
  if (os && Number(os.y) > 0) {
    return {
      w: Math.max(1, Number(os.x) || 1),
      h: Math.max(1, Number(os.y) || 1),
      d: Math.max(1, Number(os.z) || 1),
    };
  }
  const box = new THREE.Box3();
  let has = false;
  const root = facadeGroup || furnitureGroup;
  root.traverse((o) => {
    if (!o?.isMesh) return;
    if (o.userData?.isCatalogHingeModule) return;
    let p = o.parent;
    while (p) {
      if (p.userData?.isCatalogHingeModule) return;
      p = p.parent;
    }
    try {
      const b = new THREE.Box3().setFromObject(o);
      if (!has) {
        box.copy(b);
        has = true;
      } else {
        box.union(b);
      }
    } catch (_) {}
  });
  if (!has) return { w: 1, h: 1, d: 1 };
  const size = new THREE.Vector3();
  box.getSize(size);
  return {
    w: Math.max(1, size.x),
    h: Math.max(1, size.y),
    d: Math.max(1, size.z),
  };
}

function getFacadeShellWorldBox(facadeGroup, furnitureGroup) {
  const box = new THREE.Box3();
  let has = false;
  const root = facadeGroup || furnitureGroup;
  root.traverse((o) => {
    if (!o?.isMesh) return;
    if (o.userData?.isCatalogHingeModule) return;
    let p = o.parent;
    while (p) {
      if (p.userData?.isCatalogHingeModule) return;
      p = p.parent;
    }
    try {
      const b = new THREE.Box3().setFromObject(o);
      if (!has) {
        box.copy(b);
        has = true;
      } else {
        box.union(b);
      }
    } catch (_) {}
  });
  if (!has && facadeGroup) {
    try {
      box.setFromObject(facadeGroup);
      has = true;
    } catch (_) {}
  }
  return has ? box : null;
}

function removeLabelEl(label) {
  if (label?.parentNode) label.parentNode.removeChild(label);
}

function disposeGuideLineGroup(group) {
  if (!group) return;
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material.dispose();
    }
  });
}

export function clearHingeRoleGuideLines(root) {
  const roots = [];
  const collect = (node) => {
    node?.traverse?.((o) => {
      if (o?.name === '__hinge_role_guide_lines') roots.push(o);
    });
  };
  if (root) {
    collect(root);
  } else if (typeof state !== 'undefined' && state?.scene) {
    collect(state.scene);
  }
  for (const g of roots) {
    g.parent?.remove(g);
    disposeGuideLineGroup(g);
  }
  window.hingeRoleGuideLineRoots = [];
}

function makeWorldGuideLine(a, b, color, opts = {}) {
  const geom = new THREE.BufferGeometry().setFromPoints([a, b]);
  const mat = new THREE.LineBasicMaterial({
    color,
    depthTest: false,
    transparent: true,
    opacity: opts.opacity ?? 0.95,
  });
  const line = new THREE.Line(geom, mat);
  line.renderOrder = opts.renderOrder ?? 1000;
  line.userData.isHingeRoleGuideLine = true;
  return line;
}

/** Одна группа линий на шкаф; facades_main + facades_top дописывают сегменты, не затирая друг друга. */
function getOrCreateHingeRoleGuideLinesRoot(furnitureGroup) {
  let root = null;
  furnitureGroup?.traverse?.((o) => {
    if (o?.name === '__hinge_role_guide_lines') root = o;
  });
  if (root) return root;
  root = new THREE.Group();
  root.name = '__hinge_role_guide_lines';
  furnitureGroup.add(root);
  if (!window.hingeRoleGuideLineRoots) window.hingeRoleGuideLineRoots = [];
  window.hingeRoleGuideLineRoots.push(root);
  return root;
}

/**
 * Горизонтальные линии в 3D: зелёные — expected («петли по ролям»),
 * пурпурные — центр чашки GLB. Линия должна проходить через середину петли.
 */
function mountHingeRoleGuideLines(
  furnitureGroup,
  facadeGroup,
  facadeBox,
  positions,
  shellSize,
  axis,
  dimLineX,
  chainLineX,
  hingeColumnX,
  frontZ
) {
  if (!isGuideLinesEnabled() || !furnitureGroup || !facadeBox) return;

  furnitureGroup.updateMatrixWorld(true);
  const toLocal = (wx, wy, wz) => {
    const v = new THREE.Vector3(wx, wy, wz);
    furnitureGroup.worldToLocal(v);
    return v;
  };

  const root = getOrCreateHingeRoleGuideLinesRoot(furnitureGroup);

  const panelMinY = facadeBox.min.y;
  const panelMinX = facadeBox.min.x;
  const xLeft = chainLineX - 25;
  const xThrough = hingeColumnX + 55;
  const z = frontZ;

  const addHorizontalAtMm = (mmFromEdge, color, opacity) => {
    if (!Number.isFinite(mmFromEdge)) return;
    if (axis === 'Y') {
      const y = panelMinY + mmFromEdge;
      root.add(
        makeWorldGuideLine(
          toLocal(xLeft, y, z),
          toLocal(xThrough, y, z),
          color,
          { opacity }
        )
      );
      root.add(
        makeWorldGuideLine(
          toLocal(hingeColumnX - 8, y - 12, z),
          toLocal(hingeColumnX - 8, y + 12, z),
          color,
          { opacity: 0.85 }
        )
      );
    } else {
      const x = panelMinX + mmFromEdge;
      const y = panelMinY + shellSize.h * 0.12;
      root.add(
        makeWorldGuideLine(
          toLocal(x, y, z),
          toLocal(x, y + shellSize.h * 0.5, z),
          color,
          { opacity }
        )
      );
    }
  };

  addHorizontalAtMm(0, 0x888888, 0.45);
  addHorizontalAtMm(axis === 'Y' ? shellSize.h : shellSize.w, 0x888888, 0.45);

  for (const p of positions) {
    const exp = p.expectedY ?? (axis === 'Y' ? p.yMmFromBottom : p.xMmFromLeft);
    const refMinY = p.panelMinY ?? panelMinY;
    if (Number.isFinite(exp)) {
      addHorizontalAtMm(exp, 0x00cc44, 0.95);
    }
    const cupMm = measureHingeFacadeCupCenterY(p.hinge, facadeGroup, refMinY);
    if (cupMm != null && Number.isFinite(exp) && Math.abs(cupMm - exp) > 0.5) {
      addHorizontalAtMm(cupMm, 0xff00cc, 0.75);
    }
  }
}

export function clearHingeRoleMarkers() {
  const list = window.hingeRoleMarkersLabels;
  if (!Array.isArray(list)) {
    window.hingeRoleMarkersLabels = [];
  } else {
    list.forEach(removeLabelEl);
    window.hingeRoleMarkersLabels = [];
  }
  clearHingeRoleGuideLines();
}

function pushLabel(label) {
  if (!label) return;
  if (!window.hingeRoleMarkersLabels) window.hingeRoleMarkersLabels = [];
  window.hingeRoleMarkersLabels.push(label);
}

const ORANGE_LABEL_STYLE = {
  color: '#c44b00',
  backgroundColor: 'rgba(255, 245, 235, 0.95)',
  border: '1px solid #ff7a00',
  fontSize: '13px',
  fontWeight: '600',
  zIndex: '120',
};

const CHAIN_LABEL_STYLE = {
  color: '#fff',
  backgroundColor: 'rgba(255, 122, 0, 0.92)',
  border: 'none',
  fontSize: '12px',
  fontWeight: '700',
  padding: '2px 6px',
  zIndex: '119',
};

/**
 * @param {THREE.Group} furnitureGroup
 * @param {{ axis?: 'X'|'Y' }} [opts]
 */
export function mountHingeRoleMarkersOnFurniture(furnitureGroup, opts = {}) {
  if (!isMarkersEnabled() || !furnitureGroup) return;
  if (!window.sceneIconsContainer || !state?.camera) return;

  const shells = findAllFacadeShellGroups(furnitureGroup);
  if (!shells.length) return;

  if (isGuideLinesEnabled()) {
    clearHingeRoleGuideLines(furnitureGroup);
  }

  for (const { group: facadeGroup, layoutRole } of shells) {
    mountHingeRoleMarkersOnFacadeShell(furnitureGroup, facadeGroup, layoutRole, opts);
  }
}

/**
 * Метки только для одного фасадного модуля (шкаф / антресоль / верх — отдельно).
 */
function mountHingeRoleMarkersOnFacadeShell(furnitureGroup, facadeGroup, layoutRole, opts = {}) {
  const layoutVerify = facadeGroup?.userData?.hingeRoleLayoutVerify;
  const axis = String(
    opts.axis ||
      layoutVerify?.axis ||
      window.DEBUG_HINGE_ROLE_MARKERS_AXIS ||
      (layoutRole === 'facades_top' ? 'X' : 'Y')
  ).toUpperCase();

  const hinges = collectCatalogHingeGroups(facadeGroup);
  if (!hinges.length) return;

  let shellSize = resolveFacadeShellSizeMm(facadeGroup, furnitureGroup);
  const layoutDim = Number(layoutVerify?.dimensionMm);
  if (layoutDim > 0) {
    if (axis === 'X') shellSize = { ...shellSize, w: layoutDim };
    else shellSize = { ...shellSize, h: layoutDim };
  }
  const facadeBox = getFacadeShellWorldBox(facadeGroup, furnitureGroup);
  if (!facadeBox) return;

  furnitureGroup.updateMatrixWorld(true);
  const wp = new THREE.Vector3();
  const positions = [];

  for (const hinge of hinges) {
    resolveHingeAnimatorWorldPos(hinge, facadeGroup, wp);
    const expectedY = Number(hinge.userData?.hingeRoleExpectedYMm);
    const panelMinY = resolvePanelMinYForHinge(hinge, facadeGroup, facadeBox);
    const refMinY = Number.isFinite(panelMinY) ? panelMinY : facadeBox.min.y;
    const yAnim = wp.y - refMinY;
    const yMmFromBottom = yAnim;
    const xMmFromLeft = wp.x - facadeBox.min.x;
    const modulePosY = Number(hinge.position?.y) || 0;
    const modulePosX = Number(hinge.position?.x) || 0;
    positions.push({
      hinge,
      wp: wp.clone(),
      yMmFromBottom,
      yAnimFromBottom: yAnim,
      xMmFromLeft,
      modulePosY,
      modulePosX,
      panelMinY: refMinY,
      expectedY: Number.isFinite(expectedY) ? expectedY : null,
    });
  }

  const sortKey = axis === 'X' ? 'xMmFromLeft' : 'yMmFromBottom';
  positions.sort((a, b) => a[sortKey] - b[sortKey]);

  // Как «петли по ролям»: выноска слева от столбца петель (−X), цепочка ещё левее.
  const labelOffsetMm = 55;
  const chainOffsetMm = 110;
  const roleSideShift = Math.max(0, FACADE_LAYOUT_ROLES.indexOf(layoutRole)) * 70;
  const frontZ = facadeBox.max.z + 25;
  const hingeColumnX = Math.min(...positions.map((p) => p.wp.x));
  const dimLineX = hingeColumnX - labelOffsetMm - roleSideShift;
  const chainLineX = hingeColumnX - chainOffsetMm - roleSideShift;

  const labelAnchorStyle = {
    transform: 'translate(-100%, -50%)',
    textAlign: 'right',
  };

  for (const p of positions) {
    const planRound =
      p.expectedY != null ? Math.round(p.expectedY) : Math.round(p.yMmFromBottom);
    const cupRound = measureHingeFacadeCupCenterY(
      p.hinge,
      facadeGroup,
      p.panelMinY ?? facadeBox.min.y
    );
    const modRound = Math.round(axis === 'X' ? p.modulePosX : p.modulePosY);
    const text =
      axis === 'X'
        ? `X ${planRound} (pos ${modRound})`
        : cupRound != null
          ? `план ${planRound} · чашка ${cupRound}`
          : `план ${planRound}`;
    const labelWorldY =
      axis === 'Y'
        ? (p.panelMinY ?? facadeBox.min.y) + (cupRound != null ? cupRound : planRound)
        : p.wp.y;
    const labelPos = new THREE.Vector3(
      dimLineX,
      axis === 'Y' ? labelWorldY : p.wp.y,
      frontZ
    );
    const lbl = createDimensionLabel(text, labelPos, HINGE_LABEL_CLASS, {
      ...ORANGE_LABEL_STYLE,
      ...labelAnchorStyle,
    });
    if (lbl) {
      lbl.userData.isHingeRoleMarker = true;
      lbl.userData.furnitureGroup = furnitureGroup;
      pushLabel(lbl);
    }
  }

  const dimEnd = axis === 'X' ? shellSize.w : shellSize.h;
  const chain = [
    0,
    ...positions.map((p) => {
      if (axis === 'X') return p.xMmFromLeft;
      const cup = measureHingeFacadeCupCenterY(
        p.hinge,
        facadeGroup,
        p.panelMinY ?? facadeBox.min.y
      );
      return cup != null ? cup : p.yMmFromBottom;
    }),
    dimEnd,
  ];

  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    const segMm = b - a;
    if (!Number.isFinite(segMm) || segMm <= 0.5) continue;
    const midMm = a + segMm / 2;
    const midWorldY = facadeBox.min.y + (axis === 'Y' ? midMm : 0);
    const midWorldX = facadeBox.min.x + (axis === 'X' ? midMm : facadeBox.min.x);
    const chainPos = new THREE.Vector3(
      chainLineX,
      axis === 'Y' ? midWorldY : facadeBox.min.y + shellSize.h * 0.15,
      frontZ
    );
    if (axis === 'X') chainPos.x = midWorldX;
    const segLbl = createDimensionLabel(
      `${Math.round(segMm)}`,
      chainPos,
      CHAIN_LABEL_CLASS,
      { ...CHAIN_LABEL_STYLE, ...labelAnchorStyle }
    );
    if (segLbl) {
      segLbl.userData.isHingeRoleMarker = true;
      segLbl.userData.furnitureGroup = furnitureGroup;
      pushLabel(segLbl);
    }
  }

  const totalLbl = createDimensionLabel(
    `H ${Math.round(shellSize.h)}`,
    new THREE.Vector3(chainLineX, facadeBox.min.y + shellSize.h + 40, frontZ),
    CHAIN_LABEL_CLASS,
    {
      ...CHAIN_LABEL_STYLE,
      backgroundColor: 'rgba(80, 80, 80, 0.9)',
      ...labelAnchorStyle,
    }
  );
  if (totalLbl) {
    totalLbl.userData.isHingeRoleMarker = true;
    pushLabel(totalLbl);
  }

  mountHingeRoleGuideLines(
    furnitureGroup,
    facadeGroup,
    facadeBox,
    positions,
    shellSize,
    axis,
    dimLineX,
    chainLineX,
    hingeColumnX,
    frontZ
  );

  logHingeRoleMarkersVerify(furnitureGroup, facadeGroup, layoutRole, positions, shellSize, facadeBox);
}

/** Центр Y видимой «фасадной» части петли (GLB чашки), мм от низа полотна. */
function measureHingeFacadeCupCenterY(hingeGroup, facadeGroup, panelMinY, out) {
  const v = out || new THREE.Vector3();
  let anim = null;
  hingeGroup?.traverse?.((o) => {
    if (anim) return;
    if (!o?.userData?.isAnimator) return;
    if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
    anim = o;
  });
  if (!anim && facadeGroup) {
    let swing = null;
    facadeGroup.traverse((o) => {
      if (o?.name === '__door_swing') swing = o;
    });
    const ownerUuid = String(hingeGroup?.uuid || '');
    if (swing && ownerUuid) {
      swing.traverse((o) => {
        if (anim) return;
        if (!o?.userData?.isAnimator) return;
        if (String(o.userData.animatorId || '').toLowerCase() !== 'hinge_animator') return;
        const tag = String(o.userData._cldHingeOwnerUuid || '');
        if (tag && tag !== ownerUuid) return;
        anim = o;
      });
    }
  }
  if (!anim) return null;
  const box = new THREE.Box3();
  let hit = false;
  anim.traverse((o) => {
    if (!o?.isMesh) return;
    if (o.userData?.isHole) return;
    const nm = String(o.name || '').toLowerCase();
    if (/корпус|corpus|присад/.test(nm) && !/фасад|facade/.test(nm)) return;
    try {
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) return;
      if (!hit) {
        box.copy(b);
        hit = true;
      } else {
        box.union(b);
      }
    } catch (_) {}
  });
  if (!hit) {
    anim.updateMatrixWorld(true);
    anim.getWorldPosition(v);
    return Math.round(v.y - panelMinY);
  }
  box.getCenter(v);
  return Math.round(v.y - panelMinY);
}

/**
 * Сводка реальных Y петель в комнате vs «петли по ролям».
 * В консоли: __cldMeasureRoomHinges()  или  __cldMeasureRoomHinges(furnitureGroup)
 * @returns {Array<object>}
 */
export function measureRoomHingePositions(sceneOrFurniture) {
  const root =
    sceneOrFurniture ||
    (typeof window !== 'undefined' ? window.__cldRoomScene : null) ||
    (typeof state !== 'undefined' ? state?.scene : null);
  if (!root) {
    console.warn('[CLD][HINGE-MEASURE] нет сцены — поставьте шкаф или передайте group');
    return [];
  }

  const furnitureList = [];
  if (sceneOrFurniture?.userData?.isFurniture) {
    furnitureList.push(sceneOrFurniture);
  } else {
    root.traverse((o) => {
      if (o?.isGroup && o.userData?.isFurniture && collectCatalogHingeGroups(o).length) {
        furnitureList.push(o);
      }
    });
  }

  const allRows = [];
  const wpMod = new THREE.Vector3();
  const wpAnim = new THREE.Vector3();

  for (const furniture of furnitureList) {
    const shells = findAllFacadeShellGroups(furniture);
    for (const { group: facadeGroup, layoutRole } of shells) {
      const hinges = collectCatalogHingeGroups(facadeGroup);
      if (!hinges.length) continue;

      const shellSize = resolveFacadeShellSizeMm(facadeGroup, furniture);
      const facadeBox = getFacadeShellWorldBox(facadeGroup, furniture);
      if (!facadeBox) continue;

      const panelMinY = facadeBox.min.y;
      const layoutVerify = facadeGroup.userData?.hingeRoleLayoutVerify || null;
      const expectedYs = Array.isArray(layoutVerify?.expectedYs) ? layoutVerify.expectedYs : [];

      furniture.updateMatrixWorld(true);
      facadeGroup.updateMatrixWorld(true);

      const slotRows = [];
      for (const hinge of hinges) {
        hinge.updateMatrixWorld(true);
        hinge.getWorldPosition(wpMod);
        resolveHingeAnimatorWorldPos(hinge, facadeGroup, wpAnim);
        const slot = Number(hinge.userData?.hingeLayoutSlotIndex ?? slotRows.length);
        const expected = Number(hinge.userData?.hingeRoleExpectedYMm);
        const expectedFromLayout = Number.isFinite(expected)
          ? expected
          : Number.isFinite(Number(expectedYs[slot]))
            ? Number(expectedYs[slot])
            : null;
        const modFromBottom = Math.round(wpMod.y - panelMinY);
        const animFromBottom = Math.round(wpAnim.y - panelMinY);
        const cupFromBottom = measureHingeFacadeCupCenterY(hinge, facadeGroup, panelMinY, wpAnim);

        slotRows.push({
          furniture: furniture.name,
          facadeRole: layoutRole,
          facade: facadeGroup.name,
          slot,
          expected: expectedFromLayout,
          modulePosY: Math.round(Number(hinge.position?.y) || 0),
          moduleWorld: modFromBottom,
          animatorWorld: animFromBottom,
          cupCenterWorld: cupFromBottom,
          dModVsExpected:
            expectedFromLayout != null ? modFromBottom - expectedFromLayout : null,
          dAnimVsExpected:
            expectedFromLayout != null ? animFromBottom - expectedFromLayout : null,
          dCupVsExpected:
            expectedFromLayout != null && cupFromBottom != null
              ? cupFromBottom - expectedFromLayout
              : null,
        });
      }

      slotRows.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
      for (let i = 0; i < slotRows.length - 1; i++) {
        const a = slotRows[i];
        const b = slotRows[i + 1];
        a.gapToNextExpected =
          a.expected != null && b.expected != null ? b.expected - a.expected : null;
        a.gapToNextAnimator =
          b.animatorWorld != null ? b.animatorWorld - a.animatorWorld : null;
        a.gapToNextCup =
          a.cupCenterWorld != null && b.cupCenterWorld != null
            ? b.cupCenterWorld - a.cupCenterWorld
            : null;
      }

      console.warn('[CLD][HINGE-MEASURE]', {
        furniture: furniture.name,
        layoutRole,
        facade: facadeGroup.name,
        panelHeightMm: Math.round(shellSize.h),
        panelBBoxH: Math.round(facadeBox.max.y - facadeBox.min.y),
        originalSize: facadeGroup.userData?.originalSize,
        layoutVerify,
        hint:
          'expected — «петли по ролям»; animatorWorld — ось hinge_animator; cupCenterWorld — центр GLB чашки; moduleWorld — origin модуля петли.',
      });
      console.table(slotRows);
      allRows.push(...slotRows);
    }
  }

  if (!allRows.length) {
    console.warn('[CLD][HINGE-MEASURE] петли не найдены (шкаф с catalog hinges в сцене?)');
  }
  return allRows;
}

/**
 * Откуда в комнате берётся высота для петель vs каталог/превью.
 * Консоль: __cldDumpHingeHeightContext()
 */
export function dumpHingeHeightContext(sceneOrFurniture) {
  const gen = typeof window !== 'undefined' ? window.__cldHingeLayout : null;
  const root =
    sceneOrFurniture ||
    (typeof state !== 'undefined' ? state?.scene : null) ||
    (typeof window !== 'undefined' ? window.__cldRoomScene : null);
  if (!root) {
    console.warn('[CLD][HINGE-HEIGHT] нет сцены');
    return null;
  }

  const furnitureList = [];
  if (sceneOrFurniture?.userData?.isFurniture) {
    furnitureList.push(sceneOrFurniture);
  } else {
    root.traverse((o) => {
      if (o?.isGroup && o.userData?.isFurniture) furnitureList.push(o);
    });
  }
  if (!furnitureList.length) {
    console.warn('[CLD][HINGE-HEIGHT] мебель в сцене не найдена');
    return null;
  }

  const out = { furniture: [], facades: [] };

  for (const furniture of furnitureList) {
    const ud = furniture.userData || {};
    const sectionBuild = ud.__initialSectionSizeMm || null;
    const zones = ud.__layoutZones?.zones || null;
    const placementKind = ud.__placementKind || null;
    const catalogFromUd = ud.__catalogSizeMm || null;

    const block = {
      name: furniture.name,
      placementKind,
      sectionSizeAtBuild: sectionBuild,
      layoutZones: zones,
      catalogSizeMm: catalogFromUd,
    };
    out.furniture.push(block);

    console.warn('[CLD][HINGE-HEIGHT] шкаф в комнате', block);

    const shells = findAllFacadeShellGroups(furniture);
    for (const { group: facadeGroup, layoutRole } of shells) {
      const lv = facadeGroup.userData?.hingeRoleLayoutVerify || null;
      const dimUsed = Number(lv?.dimensionMm) || Number(facadeGroup.userData?.originalSize?.y) || 0;
      const productKind =
        gen?.placementKindToProductKind?.(placementKind) || 'wardrobe';
      const roleParams = gen?.resolveHingeRoleLayoutParams
        ? gen.resolveHingeRoleLayoutParams({
            productKind,
            placementKind,
            facadeLayoutRole: layoutRole,
          })
        : null;

      const catalogH = Number(catalogFromUd?.y) || Number(sectionBuild?.y) || 0;
      const nicheH = Number(sectionBuild?.y) || 0;
      const simulate = (label, D) => {
        if (!gen?.roleLayoutParamsToHingeAccessory || !roleParams || !(D > 0)) return null;
        const acc = gen.roleLayoutParamsToHingeAccessory(roleParams, D, layoutRole);
        const ys = gen.calcIntegerRoleHingeYs?.(acc, D) || [];
        const gaps = [];
        for (let i = 0; i < ys.length - 1; i++) gaps.push(ys[i + 1] - ys[i]);
        return { D: Math.round(D), ys, gaps, topOffset: roleParams.topOffset, bottomOffset: roleParams.bottomOffset };
      };

      const row = {
        layoutRole,
        facade: facadeGroup.name,
        doorHUsedInRoom: Math.round(dimUsed),
        expectedYsInRoom: lv?.expectedYs || [],
        originalSizeY: facadeGroup.userData?.originalSize?.y,
        zoneMainMm: zones?.carcassMainMm,
        zoneAntMm: zones?.carcassAntresolMm,
        zoneCarcassMm: zones?.carcassMm,
        ifDoorHWasCatalog: simulate('каталог Y', catalogH),
        ifDoorHWasNiche: simulate('ниша sectionSize.y', nicheH),
        ifDoorHWas2700: simulate('гипотеза 2700', 2700),
        ifDoorHWas2500: simulate('гипотеза 2500', 2500),
      };
      out.facades.push(row);
      console.warn(`[CLD][HINGE-HEIGHT] ${layoutRole}`, row);
      console.table([
        { source: 'комната (факт)', ...row, ys: (lv?.expectedYs || []).join(', ') },
        row.ifDoorHWasCatalog && {
          source: 'пересчёт на каталог H',
          D: row.ifDoorHWasCatalog.D,
          ys: row.ifDoorHWasCatalog.ys.join(', '),
          gaps: row.ifDoorHWasCatalog.gaps.join(', '),
        },
        row.ifDoorHWasNiche && {
          source: 'пересчёт на нишу Y',
          D: row.ifDoorHWasNiche.D,
          ys: row.ifDoorHWasNiche.ys.join(', '),
          gaps: row.ifDoorHWasNiche.gaps.join(', '),
        },
        row.ifDoorHWas2700 && {
          source: 'если бы D=2700',
          D: 2700,
          ys: row.ifDoorHWas2700.ys.join(', '),
          gaps: row.ifDoorHWas2700.gaps.join(', '),
        },
      ].filter(Boolean));
    }
  }

  console.warn(
    '[CLD][HINGE-HEIGHT] вывод: петли считаются от doorH фасадной полосы (facades_main / facades_top), ' +
      'не от полной высоты каталога. Зазор 583 → D≈1950. При D=2700 первый зазор был бы ~866.'
  );
  return out;
}

if (typeof window !== 'undefined') {
  window.__cldMeasureRoomHinges = measureRoomHingePositions;
  window.__cldDumpHingeHeightContext = dumpHingeHeightContext;
}

/** Пересобрать метки для всей мебели в сцене (после размещения / перераскладки). */
export function refreshAllHingeRoleMarkersInRoom() {
  clearHingeRoleMarkers();
  if (!isMarkersEnabled() || !state?.scene) return;

  const groups = [];
  state.scene.traverse((o) => {
    if (!o?.isGroup) return;
    if (o.userData?.isFurniture && collectCatalogHingeGroups(o).length) {
      groups.push(o);
    }
  });

  for (const grp of groups) {
    dumpFurnitureHingeStructure(grp);
    mountHingeRoleMarkersOnFurniture(grp);
  }
}

export function updateHingeRoleMarkerScreenPositions() {
  const list = window.hingeRoleMarkersLabels;
  if (!list?.length || !state?.camera || !window.sceneIconsContainer) return;

  const show = isMarkersEnabled();

  const container = window.sceneIconsContainer;
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;

  for (const label of list) {
    if (!label?.userData?.position3D) continue;
    const vector = label.userData.position3D.clone();
    vector.project(state.camera);
    const x = vector.x * widthHalf + widthHalf;
    const y = -vector.y * heightHalf + heightHalf;
    label.style.left = x + 'px';
    label.style.top = y + 'px';
    label.style.display = show && vector.z <= 1 ? 'block' : 'none';
  }
}

if (typeof window !== 'undefined') {
  window.refreshAllHingeRoleMarkersInRoom = refreshAllHingeRoleMarkersInRoom;
  window.clearHingeRoleMarkers = clearHingeRoleMarkers;
}
