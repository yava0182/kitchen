/**
 * SIDE PANELS S2A — накладная боковина модуля (overlay).
 * Только инстанс: userData.sidePanels. Без UI админки, без structural, без присадки.
 *
 * depthMode to_wall: size.z = carcassD + rearOffsetMm; якорь переда = перед корпуса;
 * pos.z = −rearOffsetMm (локально к стене). Не трогает D корпуса и не делает второй shift.
 */

import { state } from '../utils/state.js';

export const SIDE_OVERLAY_LAYOUT_ROLE = 'side_overlay';
export const SIDE_OVERLAY_ID_PREFIX = 'cld_side_overlay_';

/** Корпус пенала в catalog_48: высота без цоколя/топа/техзоны. */
const CORPUS_HEIGHT_EXPR = 's:y - v:h_bottom - v:h_top - v:tech_zone_mm';
const CORPUS_POS_Y_EXPR = 'v:h_bottom';

/**
 * @param {unknown} raw
 * @returns {{ left: object, right: object }|null}
 */
export function normalizeSidePanels(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = { left: null, right: null };
  for (const side of ['left', 'right']) {
    const s = raw[side];
    if (!s || typeof s !== 'object') {
      out[side] = { mode: 'normal', depthMode: 'carcass', jointPolicy: 'inherit' };
      continue;
    }
    const mode = String(s.mode || 'normal').trim().toLowerCase();
    const depthMode = String(s.depthMode || 'carcass').trim().toLowerCase();
    let jointPolicy = s.jointPolicy;
    if (jointPolicy == null) {
      jointPolicy = mode === 'overlay' ? 'none' : 'inherit';
    }
    out[side] = {
      mode: mode === 'overlay' || mode === 'structural' ? mode : 'normal',
      depthMode:
        depthMode === 'to_wall' || depthMode === 'custom' ? depthMode : 'carcass',
      depthMm: Number(s.depthMm) > 0 ? Math.round(Number(s.depthMm)) : undefined,
      material:
        s.material && typeof s.material === 'object'
          ? { group: s.material.group, key: s.material.key }
          : null,
      jointPolicy,
    };
  }
  return out;
}

/**
 * Глубина накладки по Z (мм). Не использует scale.
 * to_wall → carcassD + rearOffsetMm (зазор уже в мм панели, не второй shift группы).
 */
export function resolveSideOverlayDepthMm(sideCfg, ctx = {}) {
  const s = sideCfg && typeof sideCfg === 'object' ? sideCfg : {};
  const carcass = Math.max(0, Math.round(Number(ctx.carcassDepthMm) || 0));
  const rear = Math.max(0, Math.round(Number(ctx.rearOffsetMm) || 0));
  const mode = String(s.depthMode || 'carcass').toLowerCase();
  if (mode === 'custom' && Number(s.depthMm) > 0) {
    return Math.round(Number(s.depthMm));
  }
  if (mode === 'to_wall') {
    return carcass + rear;
  }
  return carcass;
}

function _isOverlayNode(n) {
  if (!n || typeof n !== 'object') return false;
  const role = String(n.layout_role || n.sectionLayoutRole || '')
    .trim()
    .toLowerCase();
  if (role === SIDE_OVERLAY_LAYOUT_ROLE) return true;
  const id = String(n.id || '');
  return id.startsWith(SIDE_OVERLAY_ID_PREFIX);
}

/** Убрать предыдущие S2A-накладки (идемпотентный inject). */
export function stripSideOverlayNodes(roots) {
  let removed = 0;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.children)) {
      const next = [];
      for (const ch of node.children) {
        if (_isOverlayNode(ch)) {
          removed += 1;
          continue;
        }
        next.push(ch);
        walk(ch);
      }
      node.children = next;
    }
    if (Array.isArray(node.spec?.template_tree)) {
      node.spec.template_tree.forEach(walk);
    }
  };
  const list = Array.isArray(roots) ? roots : roots ? [roots] : [];
  list.forEach(walk);
  return removed;
}

/**
 * Отдельная производственная деталь wall без jointSchemes / furniture.
 * Снаружи левого бока: pivot.x=+1 при pos.x=0 → −thickness…0 (риск X за ячейку — см. отчёт).
 */
export function buildSideOverlayWallNode({ side, depthMm, rearOffsetMm, material }) {
  const sideKey = side === 'right' ? 'right' : 'left';
  const depth = Math.max(1, Math.round(Number(depthMm) || 0));
  const rear = Math.max(0, Math.round(Number(rearOffsetMm) || 0));
  const mat =
    material && material.group
      ? {
          group: String(material.group),
          key: String(material.key || 'material_2'),
          rotated: false,
          fixed: false,
        }
      : {
          group: 'g0',
          key: 'material_2',
          rotated: false,
          fixed: false,
        };

  const isLeft = sideKey === 'left';
  return {
    type: 'wall',
    id: `${SIDE_OVERLAY_ID_PREFIX}${sideKey}`,
    name: isLeft ? 'Боковая накладка левая' : 'Боковая накладка правая',
    active: 1,
    layout_role: SIDE_OVERLAY_LAYOUT_ROLE,
    size: {
      x: 's:x',
      y: CORPUS_HEIGHT_EXPR,
      z: depth,
    },
    pos: {
      x: isLeft ? 0 : 's:x',
      y: CORPUS_POS_Y_EXPR,
      // К стене: локальный зад = −rearOffset; перед = depth − rear = carcassD.
      z: -rear,
    },
    pivot: {
      x: isLeft ? 1 : -1,
      y: -1,
      z: -1,
    },
    scale: { x: 1, y: 1, z: 1 },
    rot: { x: 0, y: 0, z: 0 },
    spec: {
      orientation: 'v',
      direction: 'z',
      side: sideKey,
      detailTypeId: isLeft ? 'vertical_left' : 'vertical_right',
      material: mat,
      show_index: 0,
    },
    children: [],
    // Явно без корпусного крепежа (S2A).
    // jointSchemes отсутствует.
    custom: {
      sidePanelsS2A: true,
      sideOverlay: true,
      jointPolicy: 'none',
    },
    visible: 1,
    helpers_visible: 1,
  };
}

function _rootSections(roots) {
  return Array.isArray(roots) ? roots : roots ? [roots] : [];
}

/**
 * Вставляет overlay-стенки как детей корневой секции модуля (рядом с «Корпус пенала»).
 * Не меняет штатные бока catalog_47.
 *
 * @returns {{ injected: number, removed: number, depths: object }}
 */
export function injectSidePanelOverlaysIntoRoots(roots, sidePanelsRaw, ctx = {}) {
  const cfg = normalizeSidePanels(sidePanelsRaw);
  const depths = { left: null, right: null };
  if (!cfg) {
    return { injected: 0, removed: stripSideOverlayNodes(roots), depths };
  }
  const needOverlay =
    cfg.left?.mode === 'overlay' || cfg.right?.mode === 'overlay';
  const removed = stripSideOverlayNodes(roots);
  if (!needOverlay) {
    return { injected: 0, removed, depths };
  }

  const carcassDepthMm = Math.max(0, Math.round(Number(ctx.carcassDepthMm) || 0));
  const rearOffsetMm = Math.max(0, Math.round(Number(ctx.rearOffsetMm) || 0));
  let injected = 0;

  for (const root of _rootSections(roots)) {
    if (!root || typeof root !== 'object') continue;
    if (!Array.isArray(root.children)) root.children = [];
    for (const side of ['left', 'right']) {
      const s = cfg[side];
      if (!s || s.mode !== 'overlay') continue;
      // Overlay: крепёж запрещён (jointPolicy none).
      const depthMm = resolveSideOverlayDepthMm(s, { carcassDepthMm, rearOffsetMm });
      depths[side] = depthMm;
      const node = buildSideOverlayWallNode({
        side,
        depthMm,
        rearOffsetMm,
        material: s.material,
      });
      root.children.push(node);
      injected += 1;
    }
  }

  return { injected, removed, depths, carcassDepthMm, rearOffsetMm };
}

export function readSidePanelsFromUserData(udOrGroup) {
  const ud = udOrGroup?.userData || udOrGroup || {};
  return normalizeSidePanels(ud.sidePanels);
}

/**
 * S2A auto: пенал с rearOffsetMm>0 → left overlay to_wall.
 * Выключить на инстансе: userData.__cldSidePanelsS2AOff = true
 * Или глобально: window.__CLD_S2A_AUTO_OVERLAY = false
 */
export function ensureTallAutoSideOverlayS2A(groupOrUd) {
  const ud = groupOrUd?.userData || groupOrUd || {};
  if (ud.__cldSidePanelsS2AOff === true) return { applied: false, reason: 'off_instance' };
  try {
    if (typeof window !== 'undefined' && window.__CLD_S2A_AUTO_OVERLAY === false) {
      return { applied: false, reason: 'off_global' };
    }
  } catch (_) {}

  const pk = String(
    ud.productKind || ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || ''
  ).trim();
  const tall =
    pk === 'kitchen_tall' ||
    !!(ud.__kitchenTall && typeof ud.__kitchenTall === 'object') ||
    String(ud.catalogType || '').toLowerCase() === 'catalog_48';
  if (!tall) return { applied: false, reason: 'not_tall' };

  const rear = Math.max(0, Math.round(Number(ud.rearOffsetMm) || 0));
  if (!(rear > 0)) return { applied: false, reason: 'no_rear_offset' };

  const cur = normalizeSidePanels(ud.sidePanels);
  if (cur?.left?.mode === 'overlay' && cur?.left?.depthMode === 'to_wall') {
    return { applied: false, reason: 'already', sidePanels: cur };
  }

  ud.sidePanels = {
    left: { mode: 'overlay', depthMode: 'to_wall', jointPolicy: 'none' },
    right: { mode: 'normal' },
  };
  return { applied: true, sidePanels: ud.sidePanels, rearOffsetMm: rear };
}

/** Розовая подсветка накладок после studio/step5 (иначе белое на белом). */
export function tintSideOverlaysInGroupS2A(group) {
  if (!group?.traverse) return { count: 0 };
  let count = 0;
  group.traverse((o) => {
    const nm = String(o.name || '');
    const hit =
      /боковая накладка/i.test(nm) ||
      nm.includes(SIDE_OVERLAY_ID_PREFIX) ||
      o.userData?.sideOverlay === true ||
      o.userData?.sidePanelsS2A === true ||
      String(o.userData?.layout_role || '') === SIDE_OVERLAY_LAYOUT_ROLE;
    if (!hit) return;
    if (o.userData) {
      o.userData.sideOverlay = true;
      o.userData.sidePanelsS2A = true;
    }
    if (!o.isMesh || !o.material) return;
    count += 1;
    try {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m?.color) return;
        if (!m.userData) m.userData = {};
        if (m.userData.__cldS2ATintBackup == null) {
          m.userData.__cldS2ATintBackup = m.color.getHex();
        }
        m.color.setHex(0xe11d48);
        m.needsUpdate = true;
      });
    } catch (_) {}
  });
  return { count };
}

/**
 * Применить sidePanels на prepare-корне. Вызывается из prepareKitchenModuleForBuild.
 *
 * Канон как в 1.79: геометрию накладки строит
 * `applyKitchenSidePanelOverlayToClodisRoots` (kitchen-base-engine), НЕ S2A-inject.
 * Inject «Боковая накладка» давал второй меш с inside-каналом и перекрывал
 * окрашенный SidePanelOverlay → «накладки не закрашиваются».
 */
export function applySidePanelsToPreparedRoots(roots, _args = {}) {
  const removed = stripSideOverlayNodes(roots);
  return {
    roots,
    meta: {
      applied: false,
      injected: 0,
      removed,
      skippedInject: 'canon_overlay_geometry',
    },
  };
}

function _findSectionForGroup(group) {
  const sid = group?.userData?.sectionId;
  if (sid == null || !Array.isArray(state.customSections)) return null;
  return state.customSections.find((s) => s && String(s.id) === String(sid)) || null;
}

function _resolveTargetGroup(groupOrNull) {
  if (groupOrNull?.userData?.isFurniture) return groupOrNull;
  try {
    const sel = state.selectedFurniture?.group;
    if (sel?.userData?.isFurniture) return sel;
  } catch (_) {}
  return null;
}

/**
 * Тестовый вкл/выкл левой накладки на ОДНОМ пенале (без глобального авто).
 * Предпочтительно: уже D=460 и rearOffsetMm=100 на инстансе.
 * group можно не передавать — берётся state.selectedFurniture.group.
 */
export function setKitchenModuleSidePanels(group, sidePanels, opts = {}) {
  group = _resolveTargetGroup(group);
  if (!group?.userData?.isFurniture) {
    return {
      ok: false,
      reason: 'not_furniture',
      hint: 'Выберите пенал в комнате, затем __cldEnableTallLeftOverlayS2A()',
    };
  }
  const ud = group.userData;
  if (sidePanels == null) {
    delete ud.sidePanels;
  } else {
    ud.sidePanels = normalizeSidePanels(sidePanels);
  }

  const rebuild = opts.rebuild !== false;
  if (!rebuild) {
    return { ok: true, sidePanels: ud.sidePanels || null, rebuilt: false };
  }

  const sec = _findSectionForGroup(group);
  if (!sec) {
    return { ok: false, reason: 'no_section', sidePanels: ud.sidePanels || null };
  }

  const eng =
    typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
  const carcass =
    Math.round(Number(opts.carcassDepthMm)) ||
    Math.round(Number(ud.__kitchenCarcassDepthMm)) ||
    Math.round(Number(ud.customDepthMm)) ||
    0;

  function _findOverlayInGroup(g, { tint = false } = {}) {
    const names = [];
    let count = 0;
    let maxDepthZ = 0;
    try {
      g.traverse((o) => {
        const nm = String(o.name || '');
        const role = String(o.userData?.layoutRole || o.userData?.layout_role || '');
        const hit =
          role === SIDE_OVERLAY_LAYOUT_ROLE ||
          /боковая накладка/i.test(nm) ||
          nm.includes(SIDE_OVERLAY_ID_PREFIX) ||
          o.userData?.sideOverlay === true ||
          o.userData?.sidePanelsS2A === true;
        if (!hit) return;
        count += 1;
        names.push(nm || o.type || 'obj');
        if (o.userData) {
          o.userData.sideOverlay = true;
          o.userData.sidePanelsS2A = true;
          o.userData.layout_role = SIDE_OVERLAY_LAYOUT_ROLE;
        }
        const sz = o.userData?.originalSize || o.userData?.__cldCfrnSizeMm;
        if (sz && Number(sz.z) > maxDepthZ) maxDepthZ = Number(sz.z);
        // S2A: временный контрастный tint, иначе белая накладка сливается с корпусом.
        if (tint && o.isMesh && o.material) {
          try {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => {
              if (!m || !m.color) return;
              if (!m.userData) m.userData = {};
              if (!m.userData.__cldS2ATintBackup) {
                m.userData.__cldS2ATintBackup = m.color.getHex();
              }
              m.color.setHex(0xe11d48);
              m.needsUpdate = true;
            });
          } catch (_) {}
        }
      });
    } catch (_) {}
    return { count, names, maxDepthZ };
  }

  try {
    let r = null;
    if (eng && typeof eng.rebuildTallForCellDepthMm === 'function') {
      r = eng.rebuildTallForCellDepthMm(group, sec, carcass > 0 ? carcass : undefined, {});
    } else if (typeof window !== 'undefined' && typeof window.__cldRebuildFurnitureGroup === 'function') {
      window.__cldRebuildFurnitureGroup(group, sec);
      r = { ok: true };
    } else {
      return {
        ok: false,
        reason: 'no_rebuild',
        sidePanels: ud.sidePanels || null,
        hint: 'stamp sidePanels set; call rebuildTall manually',
      };
    }

    const wantOverlay =
      ud.sidePanels &&
      (ud.sidePanels.left?.mode === 'overlay' || ud.sidePanels.right?.mode === 'overlay');
    const found = _findOverlayInGroup(group, { tint: !!wantOverlay });
    const prep = ud.__cldSidePanelsPrepareMeta || null;
    if (wantOverlay && found.count === 0) {
      console.warn(
        '[S2A] rebuild ok, но накладка в сцене не найдена. Сделайте Ctrl+F5 (bust S2A) и повторите. prepare meta:',
        prep
      );
    } else if (wantOverlay) {
      console.info(
        '[S2A] overlay in scene (розовая временная подсветка). Смотрите СЛЕВА сбоку: панель глубже корпуса к стене.',
        found
      );
    }

    return {
      ok: !!(r && r.ok !== false) && (!wantOverlay || found.count > 0),
      sidePanels: ud.sidePanels || null,
      rebuilt: true,
      rebuild: r,
      carcassDepthMm: Number(r?.carcassDepthMm) || carcass,
      rearOffsetMm: Math.max(0, Math.round(Number(ud.rearOffsetMm) || 0)),
      prepareMeta: prep,
      overlayInScene: found,
      hint:
        wantOverlay && found.count === 0
          ? 'Ctrl+F5 → бейдж build 20261031-s2a1 → снова __cldEnableTallLeftOverlayS2A()'
          : undefined,
    };
  } catch (e) {
    return { ok: false, reason: 'rebuild_failed', error: String(e) };
  }
}

/** S2A сценарий: left overlay to_wall, right normal. Без аргумента — выбранный модуль. */
export function enableTallLeftOverlayS2A(group = null, opts = {}) {
  return setKitchenModuleSidePanels(
    group,
    {
      left: { mode: 'overlay', depthMode: 'to_wall', jointPolicy: 'none' },
      right: { mode: 'normal' },
    },
    opts
  );
}

export function disableTallSidePanelsS2A(group = null, opts = {}) {
  return setKitchenModuleSidePanels(group, null, opts);
}

/** Пройти все пеналы в сцене: auto overlay + rebuild. */
export function applyS2AOverlaysToAllTallsInScene() {
  const st =
    typeof window !== 'undefined'
      ? window.__CLD_STATE_SINGLETON__ || state
      : state;
  const scene = st?.scene;
  if (!scene?.traverse) return { ok: false, reason: 'no_scene', results: [] };
  const eng =
    typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
  const results = [];
  const talls = [];
  scene.traverse((o) => {
    if (!o?.isGroup || !o.userData?.isFurniture) return;
    const ud = o.userData;
    const pk = String(
      ud.productKind || ud.__placementKindProfileId || ud.placementKind || ''
    );
    const tall =
      pk === 'kitchen_tall' ||
      !!(ud.__kitchenTall && typeof ud.__kitchenTall === 'object') ||
      String(ud.catalogType || '').toLowerCase() === 'catalog_48';
    if (tall) talls.push(o);
  });
  for (const g of talls) {
    const auto = ensureTallAutoSideOverlayS2A(g);
    const r = setKitchenModuleSidePanels(g, g.userData.sidePanels, {
      rebuild: true,
      carcassDepthMm:
        Math.round(Number(g.userData.__kitchenCarcassDepthMm)) ||
        Math.round(Number(g.userData.customDepthMm)) ||
        undefined,
    });
    results.push({
      uuid: g.uuid,
      name: g.userData.catalogName || g.name,
      auto,
      result: r,
    });
  }
  return { ok: true, count: talls.length, results, eng: !!eng };
}

if (typeof window !== 'undefined') {
  window.__cldKitchenSidePanels = {
    normalizeSidePanels,
    resolveSideOverlayDepthMm,
    buildSideOverlayWallNode,
    injectSidePanelOverlaysIntoRoots,
    stripSideOverlayNodes,
    applySidePanelsToPreparedRoots,
    readSidePanelsFromUserData,
    ensureTallAutoSideOverlayS2A,
    tintSideOverlaysInGroupS2A,
    setKitchenModuleSidePanels,
    enableTallLeftOverlayS2A,
    disableTallSidePanelsS2A,
    applyS2AOverlaysToAllTallsInScene,
    SIDE_OVERLAY_LAYOUT_ROLE,
    SIDE_OVERLAY_ID_PREFIX,
  };
  window.__cldEnableTallLeftOverlayS2A = enableTallLeftOverlayS2A;
  window.__cldDisableTallSidePanelsS2A = disableTallSidePanelsS2A;
  window.__cldApplyS2AOverlaysToAllTalls = applyS2AOverlaysToAllTallsInScene;
}
