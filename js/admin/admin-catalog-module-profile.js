/**
 * Фаза A — авто-профиль модуля по типу размещения + ролям.
 * Менеджер не правит h_bottom / стеки вручную для тумбы и навеса.
 *
 * Правила:
 * - есть цоколь (role plinth) → h_bottom = высота цоколя или 100
 * - навес без цоколя → h_bottom = 0
 * - тумба / навес → drawerStack.enabled = true (пресет 120–200)
 * - при смене типа на тумбу/навес → shelfStack.enabled = false (полки — фаза B/зоны)
 */
(function () {
  'use strict';

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function isHangPlacement(pk) {
    const s = String(pk || '').trim();
    return s === 'wall_hung' || s === 'wall_hung_low' || s === 'wall_hung_high';
  }

  function isDrawerFamilyPlacement(pk) {
    const s = String(pk || '').trim();
    return s === 'standalone_floor' || isHangPlacement(s);
  }

  function walkNodes(nodes, fn) {
    const stack = Array.isArray(nodes) ? nodes.slice() : nodes ? [nodes] : [];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      fn(n);
      if (Array.isArray(n.children)) {
        for (let i = 0; i < n.children.length; i += 1) stack.push(n.children[i]);
      }
    }
  }

  function hasLayoutRole(nodes, roleKey) {
    const want = String(roleKey || '')
      .trim()
      .toLowerCase();
    if (!want) return false;
    let found = false;
    walkNodes(nodes, (n) => {
      if (found) return;
      const r = String(n.layout_role ?? n.sectionLayoutRole ?? '')
        .trim()
        .toLowerCase();
      if (r === want) found = true;
    });
    return found;
  }

  function inferPlinthHeightMm(nodes) {
    let h = NaN;
    walkNodes(nodes, (n) => {
      if (Number.isFinite(h)) return;
      const r = String(n.layout_role ?? n.sectionLayoutRole ?? '')
        .trim()
        .toLowerCase();
      if (r !== 'plinth') return;
      const y = n.size && n.size.y;
      if (typeof y === 'number' && y > 0) {
        h = Math.round(y);
        return;
      }
      const s = String(y || '').trim();
      if (/^\d+(?:\.\d+)?$/.test(s)) h = Math.round(Number(s));
    });
    return Number.isFinite(h) && h > 0 ? h : 100;
  }

  function readConstructorTree() {
    try {
      if (typeof window.getConstructorStructure === 'function') {
        const t = window.getConstructorStructure();
        if (t) return Array.isArray(t) ? t : [t];
      }
    } catch (_) {}
    try {
      const root = document.getElementById('constructor-root-module');
      if (root && root.nodeData) return [root.nodeData];
    } catch (_) {}
    return [];
  }

  function ensureClodisVariables(vueItem) {
    if (!vueItem.clodisVariables || typeof vueItem.clodisVariables !== 'object') {
      vueItem.clodisVariables = {};
    }
    return vueItem.clodisVariables;
  }

  function setHBottomOnVueAndDom(vueItem, hBottomMm) {
    const hb = Math.max(0, Math.round(num(hBottomMm, 0)));
    const vars = ensureClodisVariables(vueItem);
    const prev = num(vars.h_bottom, NaN);
    vars.h_bottom = hb;
    if (!Number.isFinite(num(vars.h_top, NaN))) vars.h_top = 0;
    if (!Number.isFinite(num(vars.tech_zone_mm, NaN))) vars.tech_zone_mm = 0;

    try {
      const root = document.getElementById('constructor-root-module');
      if (root) {
        root.nodeData = root.nodeData || {};
        root.nodeData.variables = root.nodeData.variables || {};
        root.nodeData.variables.main = root.nodeData.variables.main || {};
        root.nodeData.variables.main.h_bottom = hb;
        if (root.nodeData.variables.main.h_top == null) root.nodeData.variables.main.h_top = 0;
      }
    } catch (_) {}

    return prev !== hb;
  }

  function ensureDrawerStackEnabled(vueItem) {
    const api = window.__cldCatalogDrawerStack;
    let policy =
      vueItem.drawerStack && typeof vueItem.drawerStack === 'object' ? vueItem.drawerStack : null;
    if (!policy) {
      policy =
        typeof api?.defaultDrawerStackPolicy === 'function'
          ? api.defaultDrawerStackPolicy()
          : {
              enabled: true,
              minHeightMm: 120,
              maxHeightMm: 200,
              gapMm: 5,
              facadeOverhangMm: 14.5,
              bottomOffsetMm: 0,
              topOffsetMm: 0,
              mode: 'max_count',
              maxCount: 8,
              depthModelRules: [],
            };
    }
    if (typeof api?.normalizeDrawerStackPolicy === 'function') {
      policy = api.normalizeDrawerStackPolicy(policy);
    }
    policy.enabled = true;
    vueItem.drawerStack = policy;
  }

  function disableShelfStack(vueItem) {
    const api = window.__cldCatalogShelfStack;
    if (vueItem.shelfStack && typeof vueItem.shelfStack === 'object') {
      vueItem.shelfStack.enabled = false;
      return;
    }
    if (typeof api?.defaultShelfStackPolicy === 'function') {
      const p = api.defaultShelfStackPolicy();
      p.enabled = false;
      vueItem.shelfStack = p;
    }
  }

  function isDrawerModuleNode(n) {
    if (!n || typeof n !== 'object') return false;
    if (String(n.type || '').toLowerCase() !== 'module') return false;
    const role = String(n.layout_role ?? n.sectionLayoutRole ?? '')
      .trim()
      .toLowerCase();
    if (role === 'drawer') return true;
    return String(n.spec?.element_type || '').trim() === 'catalog_33';
  }

  /**
   * Слот ящика как у комода: иначе drawer_locked / pos шкафа → направляющие и крепёж «слетают» с корпуса.
   */
  function rewriteDrawerSlotsLikeTumba(nodes, hasPlinth) {
    let nChanged = 0;
    walkNodes(nodes, (n) => {
      if (!isDrawerModuleNode(n)) return;
      n.size = n.size && typeof n.size === 'object' ? n.size : {};
      n.pos = n.pos && typeof n.pos === 'object' ? n.pos : {};
      n.spec = n.spec && typeof n.spec === 'object' ? n.spec : {};
      n.layout_role = 'drawer';
      n.size.x = 's:x';
      if (n.size.y == null || n.size.y === '' || String(n.size.y).trim() === 's:y') {
        n.size.y = 135;
      }
      n.size.z = 's:z - 34';
      n.pos.x = 0;
      const py = String(n.pos.y ?? '');
      if (
        !py ||
        /drawer_locked|h_bottom/i.test(py) ||
        py === '0' ||
        py === 's:y'
      ) {
        n.pos.y = hasPlinth ? 116 : 16;
      }
      n.pos.z = 50;
      delete n.spec.drawer_pos_z_manual;
      delete n.spec.manual_layout;
      delete n.spec.keep_manual_layout;
      delete n.spec.depth_locked_mm;
      if (!n.spec.element_type) n.spec.element_type = 'catalog_33';
      if (!n.spec.ref_size_mm || typeof n.spec.ref_size_mm !== 'object') {
        n.spec.ref_size_mm = { x: 568, y: 162, z: 550 };
      }
      nChanged += 1;
    });
    return nChanged;
  }

  function rewriteDrawerSlotsInConstructorDom(hasPlinth) {
    try {
      const nodes = document.querySelectorAll('.constructor-tree-node');
      nodes.forEach((el) => {
        const nd = el.nodeData;
        if (!isDrawerModuleNode(nd)) return;
        rewriteDrawerSlotsLikeTumba([nd], hasPlinth);
        if (typeof window.saveConstructorNodeData === 'function') {
          try {
            window.saveConstructorNodeData(el);
          } catch (_) {}
        }
      });
    } catch (_) {}
  }

  /**
   * @param {object} vueItem
   * @param {{ tree?: any, mode?: 'full'|'h_bottom_only', reason?: string }} [opts]
   * @returns {{ changed: boolean, h_bottom: number|null, placementKind: string }}
   */
  function applyModuleProfileToVueItem(vueItem, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const mode = o.mode === 'h_bottom_only' ? 'h_bottom_only' : 'full';
    const result = { changed: false, h_bottom: null, placementKind: '' };
    if (!vueItem || typeof vueItem !== 'object') return result;

    const pk = String(vueItem.placementKind || '').trim();
    result.placementKind = pk;
    const tree = o.tree != null ? o.tree : readConstructorTree();
    const hasPlinth = hasLayoutRole(tree, 'plinth');
    const isHang = isHangPlacement(pk);
    const isTumba = pk === 'standalone_floor';
    const isFamily = isHang || isTumba;

    if (hasPlinth) {
      result.changed = setHBottomOnVueAndDom(vueItem, inferPlinthHeightMm(tree)) || result.changed;
      result.h_bottom = num(vueItem.clodisVariables?.h_bottom, 100);
    } else if (isHang) {
      result.changed = setHBottomOnVueAndDom(vueItem, 0) || result.changed;
      result.h_bottom = 0;
    } else if (isTumba) {
      result.changed = setHBottomOnVueAndDom(vueItem, 0) || result.changed;
      result.h_bottom = 0;
    }

    if (mode === 'full' && isFamily) {
      ensureDrawerStackEnabled(vueItem);
      disableShelfStack(vueItem);
      const rewritten = rewriteDrawerSlotsLikeTumba(tree, hasPlinth);
      if (rewritten > 0) {
        rewriteDrawerSlotsInConstructorDom(hasPlinth);
        result.changed = true;
      } else {
        // Даже без совпадений в tree — поправить DOM (актуальный конструктор).
        rewriteDrawerSlotsInConstructorDom(hasPlinth);
      }
      result.changed = true;
    }

    return result;
  }

  function applyModuleProfileFromUi(reason) {
    const vue = window.catalogItemVueApp;
    if (!vue || !vue.item) return null;
    const res = applyModuleProfileToVueItem(vue.item, { mode: 'full', reason: reason || '' });
    if (typeof window.__cldUpdateDrawerStackTabVisibility === 'function') {
      window.__cldUpdateDrawerStackTabVisibility();
    }
    if (typeof window.__cldUpdateInteriorFillTabVisibility === 'function') {
      try {
        window.__cldUpdateInteriorFillTabVisibility();
      } catch (_) {}
    }
    try {
      if (vue.$forceUpdate) vue.$forceUpdate();
    } catch (_) {}
    return res;
  }

  window.__cldCatalogModuleProfile = {
    applyModuleProfileToVueItem,
    applyModuleProfileFromUi,
    isHangPlacement,
    isDrawerFamilyPlacement,
    hasLayoutRole,
  };
})();
