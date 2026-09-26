/**
 * Админка: «Петли по ролям» — список вариантов фасадов (productKind × variant × opens)
 * с привязкой к catalog_28. Клик по строке → модалка с настройкой:
 *   - выбор элемента catalog_28 (+ ссылка на каталог и на редактирование);
 *   - отступы петель (от начала / от конца);
 *   - количество петель (2–7) + отступы снизу/сверху;
 *   - превью в iframe constructor-clodis.
 */
(function () {
  'use strict';

  const CATALOG_TYPE = 'catalog_28';
  const PREVIEW_CACHE_BUST = '20260923-hinge-prev2';
  const PICK_KEY = 'clodis_hinge_facade_pick_v1';
  const PICK_RESULT_KEY = 'clodis_hinge_facade_pick_result_v1';
  /** Толщина вирт. бока (мм). Шов = внутренняя пласть (x=wallT). */
  const VIRTUAL_SIDEWALL_T_MM = 16;
  /** Глубина вирт. бока (≥ толщина фасада), чтобы был объём под корпусную половину L. */
  const VIRTUAL_SIDEWALL_DEPTH_MIN_MM = 100;

  let __previewIframe = null;
  let __previewReady = false;
  let __pendingPreview = null;
  let __previewIframeBust = '';
  let __facadeCatalogItems = null;
  let __previewItemCache = Object.create(null);
  let __modalContext = null;

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function extractCatalogItemPayload(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    const _d = data.data && typeof data.data === 'object' ? data.data : data;
    let constructorStructure = _d.constructor_structure ?? data.constructor_structure ?? null;
    if (typeof constructorStructure === 'string') {
      try {
        constructorStructure = JSON.parse(constructorStructure);
      } catch (_) {
        constructorStructure = null;
      }
    }
    let tree = null;
    if (constructorStructure && typeof constructorStructure === 'object') {
      tree =
        constructorStructure.template?.structure ??
        constructorStructure.spec?.template?.tree ??
        (Array.isArray(constructorStructure) ? constructorStructure : null);
      if (
        (!Array.isArray(tree) || !tree.length) &&
        Array.isArray(constructorStructure.children) &&
        constructorStructure.children.length
      ) {
        tree = constructorStructure.children;
      }
    }
    const readJson =
      typeof globalThis !== 'undefined' && typeof globalThis.__cldReadClodisJSON === 'function'
        ? globalThis.__cldReadClodisJSON
        : (o) => (o && Array.isArray(o.clodisJSON) ? o.clodisJSON : null);
    const clodisLegacy = readJson(_d) || readJson(data);
    if ((!Array.isArray(tree) || !tree.length) && Array.isArray(clodisLegacy) && clodisLegacy.length) {
      tree = clodisLegacy;
    }
    if (!Array.isArray(tree)) tree = [];

    const toNum = (v, fb) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fb;
    };
    const w = toNum(_d.width ?? data.width, 300);
    const h = toNum(_d.height ?? data.height, 400);
    const d = toNum(_d.depth ?? data.depth, 16);

    let vars = {};
    const pv = _d.clodisVariables ?? data.clodisVariables;
    if (pv && typeof pv === 'object') vars = { ...pv };

    let materials = {};
    const mat = _d.materials ?? data.materials ?? _d.clodisMaterials ?? data.clodisMaterials;
    if (mat && typeof mat === 'object') materials = { ...mat };

    return {
      id: Number(_d.id ?? data.id) || 0,
      name: String(_d.name ?? data.name ?? ''),
      tree,
      sizeMm: { w, h, d },
      vars,
      materials,
    };
  }

  /** Имя карточки из строки items_get (name часто лежит в data.name). */
  function catalogListItemName(it) {
    if (!it || typeof it !== 'object') return '';
    let nm = String(it.name || it.title || '').trim();
    const nid = Number(it.id) || 0;
    if (nm && nid && nm !== `#${nid}` && nm !== String(nid)) return nm;
    let data = it.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {
        data = null;
      }
    }
    if (data && typeof data === 'object') {
      nm = String(data.name || '').trim();
    }
    return nm;
  }

  async function fetchFacadeCatalogList(force) {
    if (!force && Array.isArray(__facadeCatalogItems)) return __facadeCatalogItems;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(CATALOG_TYPE)}?t=${Date.now()}`, {
        cache: 'no-cache',
        signal: ctrl.signal,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
      __facadeCatalogItems = list
        .map((it) => {
          const id = Number(it.id) || 0;
          const name = catalogListItemName(it);
          return {
            id,
            name: name || (id ? `#${id}` : ''),
          };
        })
        .filter((it) => it.id > 0)
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'));
      return __facadeCatalogItems;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchCatalogItemById(id) {
    const nid = Number(id) || 0;
    if (!nid) return null;
    if (__previewItemCache[nid]) return __previewItemCache[nid];
    const resp = await fetch(
      `/api/catalog/item/${encodeURIComponent(CATALOG_TYPE)}/${encodeURIComponent(String(nid))}?t=${Date.now()}`,
      { cache: 'no-cache' }
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const raw = await resp.json();
    const payload = extractCatalogItemPayload(raw);
    __previewItemCache[nid] = payload;
    return payload;
  }

  function ensurePreviewMounted(viewportId) {
    const viewport = document.getElementById(viewportId);
    if (!viewport) return;
    const needSrc = `/constructor-clodis.html?embedded=1&v=${PREVIEW_CACHE_BUST}`;
    // Важно: при смене ?v= iframe надо пересоздать — иначе правки геометрии «не видны».
    if (
      __previewIframe &&
      __previewIframe.parentElement === viewport &&
      __previewIframeBust === PREVIEW_CACHE_BUST
    ) {
      return;
    }

    viewport.innerHTML = '';
    __previewReady = false;
    __pendingPreview = null;
    const iframe = document.createElement('iframe');
    iframe.title = 'Превью фасада';
    iframe.loading = 'eager';
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;';
    iframe.src = needSrc;
    __previewIframe = iframe;
    __previewIframeBust = PREVIEW_CACHE_BUST;
    viewport.appendChild(iframe);

    const onMsg = (ev) => {
      if (ev?.data?.type !== 'cld:iframeReady') return;
      if (ev.source !== iframe.contentWindow) return;
      __previewReady = true;
      window.removeEventListener('message', onMsg);
      if (__pendingPreview) {
        const p = __pendingPreview;
        __pendingPreview = null;
        postTreeToPreview(p);
      }
    };
    window.addEventListener('message', onMsg);

    iframe.addEventListener('load', () => {
      setTimeout(() => {
        if (!__previewReady && __pendingPreview) {
          const p = __pendingPreview;
          __pendingPreview = null;
          postTreeToPreview(p);
        }
      }, 800);
    });
  }

  function isHingeAccessory(acc) {
    if (!acc || typeof acc !== 'object') return false;
    const id = String(acc.id || '').toLowerCase();
    const name = String(acc.name || '').toLowerCase();
    return id.includes('hinge') || name.includes('петл');
  }

  function syncAccessoryLayoutMeta(acc, layoutAcc, opens, preferCatalogModule) {
    if (!acc || !layoutAcc) return;
    Object.assign(acc, {
      count: layoutAcc.count,
      hinges: layoutAcc.hinges,
      hingeInsetTopMm: layoutAcc.hingeInsetTopMm,
      hingeInsetBottomMm: layoutAcc.hingeInsetBottomMm,
      hingesOffset: layoutAcc.hingesOffset,
      hingeAxis: layoutAcc.hingeAxis,
      opening: acc.opening || (opens === 'swing' ? 'left' : acc.opening),
    });
    if (preferCatalogModule) {
      acc.__cldPreferCatalogHingeModule = true;
      delete acc.modelUrl;
      delete acc.modelUrlFacade;
      delete acc.glbUrl;
      delete acc.glbUrlFacade;
    }
  }

  function collectCatalogKeysFromTree(nodes, keys) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const et = String(node.spec?.element_type || node.element_type || '').trim();
      if (et) {
        keys.add(et);
        if (et === 'hinges') {
          keys.add('catalog_31');
          keys.add('hinges');
          const hk = String(node.spec?.hingeCatalogTypeKey || '').trim();
          if (hk) keys.add(hk);
        }
      }
      if (Array.isArray(node.accessories)) {
        for (const acc of node.accessories) {
          const hk = String(acc?.hingeCatalogTypeKey || '').trim();
          if (hk) keys.add(hk);
        }
      }
      if (Array.isArray(node.children)) collectCatalogKeysFromTree(node.children, keys);
      if (Array.isArray(node.spec?.template_tree)) {
        collectCatalogKeysFromTree(node.spec.template_tree, keys);
      }
    }
  }

  function resolveModuleTreeFromAdminCatalogs(catalogs, elementType, elementId) {
    const et = String(elementType || '').trim();
    const id = String(elementId ?? '').trim();
    if (!et || !id || !catalogs || typeof catalogs !== 'object') return null;
    const bucket = catalogs[et]?.items?.[id];
    if (!bucket) return null;
    let cs = bucket.params?.constructor_structure ?? bucket.data?.constructor_structure;
    if (typeof cs === 'string') {
      try {
        cs = JSON.parse(cs);
      } catch (_) {
        cs = null;
      }
    }
    if (!cs || typeof cs !== 'object') return null;
    let tree =
      cs.template?.structure ??
      cs.spec?.template?.tree ??
      (Array.isArray(cs) ? cs : null);
    if ((!Array.isArray(tree) || !tree.length) && Array.isArray(cs.children) && cs.children.length) {
      tree = cs.children;
    }
    return Array.isArray(tree) && tree.length ? tree : null;
  }

  /** Раскрыть вложенные catalog_28 (#14 → #7+#12) перед раскладкой петель в превью ролей. */
  function hydrateNestedCatalogModulesForHingePreview(tree) {
    const catalogs = typeof window !== 'undefined' ? window.__CLD_CATALOGS_DATA : null;
    if (!Array.isArray(tree) || !tree.length || !catalogs) return tree;
    let current;
    try {
      current = JSON.parse(JSON.stringify(tree));
    } catch (_) {
      return tree;
    }
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      const t = String(node.type || '').toLowerCase();
      if (t === 'module') {
        const ch = node.children;
        const emptyCh = !Array.isArray(ch) || ch.length === 0;
        const et = String(node.spec?.element_type || '').trim();
        const id = String(node.spec?.id ?? '').trim();
        const hasTpl =
          (Array.isArray(node.spec?.template_tree) && node.spec.template_tree.length > 0) ||
          (Array.isArray(node.spec?.templates?.[0]?.template?.tree) &&
            node.spec.templates[0].template.tree.length > 0);
        if (emptyCh && et && id && !hasTpl) {
          let tpl = resolveModuleTreeFromAdminCatalogs(catalogs, et, id);
          // Петли: карточка в catalog_31 (hingeCatalogTypeKey), не в buckets['hinges'].
          if ((!tpl || !tpl.length) && String(et).toLowerCase() === 'hinges') {
            const hk = String(node.spec?.hingeCatalogTypeKey || 'catalog_31').trim() || 'catalog_31';
            tpl = resolveModuleTreeFromAdminCatalogs(catalogs, hk, id);
          }
          if (Array.isArray(tpl) && tpl.length) {
            node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
            try {
              node.spec.template_tree = JSON.parse(JSON.stringify(tpl));
            } catch (_) {
              node.spec.template_tree = tpl;
            }
          }
        }
        if (Array.isArray(node.spec?.template_tree)) {
          node.spec.template_tree.forEach(walk);
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    for (let pass = 0; pass < 6; pass++) {
      const before = JSON.stringify(current);
      if (Array.isArray(current)) current.forEach(walk);
      else walk(current);
      try {
        if (JSON.stringify(current) === before) break;
      } catch (_) {
        break;
      }
    }
    return current;
  }

  async function ensureCatalogsForPreview(tree) {
    const keys = new Set(['catalog_28', 'catalog_31', 'hinges', 'cabinet_model']);
    collectCatalogKeysFromTree(tree, keys);
    window.__CLD_CATALOGS_DATA = window.__CLD_CATALOGS_DATA || {};
    const loads = [];
    for (const key of keys) {
      if (window.__CLD_CATALOGS_DATA[key]?.items) continue;
      loads.push(
        (async () => {
          try {
            const res = await fetch(
              `/api/catalog/items_get/${encodeURIComponent(key)}?t=${Date.now()}`,
              { cache: 'no-cache' }
            );
            if (!res.ok) return;
            const apiData = await res.json();
            const items = Array.isArray(apiData?.items)
              ? apiData.items
              : Array.isArray(apiData)
                ? apiData
                : [];
            const map = {};
            for (const it of items) {
              if (!it) continue;
              let data = it.data;
              if (typeof data === 'string') {
                try {
                  data = JSON.parse(data);
                } catch (_) {
                  data = {};
                }
              }
              const id = String(it.id ?? data?.id ?? '').trim();
              if (!id) continue;
              map[id] = {
                id,
                name: it.name || data?.name || '',
                element_type: key,
                params: it.params || data?.params || data || {},
                data: data || {},
              };
            }
            window.__CLD_CATALOGS_DATA[key] = { items: map };
          } catch (e) {
            console.warn('[hinge-role-preview] catalog load', key, e);
          }
        })()
      );
    }
    await Promise.all(loads);
  }

  async function syncPreviewInfrastructure(tree) {
    await ensureCatalogsForPreview(tree);
    if (__previewIframe && typeof window.__cldSyncPreviewCabinetModelLibraryToIframe === 'function') {
      window.__cldSyncPreviewCabinetModelLibraryToIframe(__previewIframe);
    }
  }

  /**
   * Виртуальный бок + фасад как L-шаблон (стык без щели и без corpusMount offset):
   *   бок: x=0..wallT, z=0..sideDepth — торец спереди на z=sideDepth;
   *   фасад: x=wallT.., z=sideDepth..sideDepth+facadeD — тыл на торце бока (вплотную);
   *   шов = (wallT, y, sideDepth); петли z=0 в хосте фасада.
   * Сдвиг бока по X: целиком слева от фасада (без перекрытия по X).
   */
  /**
   * Накладной фасад + вирт. бок (без магических сдвигов петель):
   *   бок:   x=0..wallT — внутренняя пласть x=wallT, торец z=sideDepth;
   *   дверь: x=0..facadeW, z=sideDepth.. — накрывает торец бока (overlay);
   *   петли: pos.x=wallT в хосте (= внутренняя пласть), Y из ролей, R_place из L.
   */
  function wrapHingeRolePreviewWithVirtualSidewall(tree, sizeMm, opens) {
    const facadeW = Math.max(1, Number(sizeMm?.w) || 300);
    const facadeH = Math.max(1, Number(sizeMm?.h) || 400);
    const facadeD = Math.max(1, Number(sizeMm?.d) || 16);
    const wallT = VIRTUAL_SIDEWALL_T_MM;
    const sideDepth = Math.max(facadeD, VIRTUAL_SIDEWALL_DEPTH_MIN_MM);
    void opens;

    const doorChildren = Array.isArray(tree) ? JSON.parse(JSON.stringify(tree)) : [];
    // Дверь закрыта; аниматор на тыле хоста (z=0), чтобы полотно прилегало к торцу бока
    // (в card JSON часто pos.z=s:z → уезжает на лицо и даёт щель = толщине фасада).
    const normalizeDoorForSeam = (nodes) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n || typeof n !== 'object') continue;
        if (String(n.type || '').toLowerCase() === 'animator') {
          n.spec = n.spec && typeof n.spec === 'object' ? { ...n.spec } : {};
          n.spec.is_open = 0;
          if (n.interaction && typeof n.interaction === 'object') {
            n.interaction = { ...n.interaction, auto_rotation: 0 };
          }
          n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos, z: 0 } : { x: 0, y: 0, z: 0 };
        }
        if (Array.isArray(n.children)) normalizeDoorForSeam(n.children);
        if (Array.isArray(n.spec?.template_tree)) normalizeDoorForSeam(n.spec.template_tree);
      }
    };
    normalizeDoorForSeam(doorChildren);

    const doorZ = sideDepth;

    const wall = {
      type: 'section',
      id: 'cld_virtual_sidewall',
      name: 'Бок (вирт.)',
      active: 1,
      helpers_visible: 0,
      visible: 1,
      size: { x: wallT, y: 's:y', z: sideDepth },
      pos: { x: 0, y: 0, z: 0 },
      pivot: { x: -1, y: -1, z: -1 },
      rot: { x: 0, y: 0, z: 0 },
      spec: { cldVirtualSidewall: 1 },
      children: [],
      section_key: '',
    };

    const doorHost = {
      type: 'section',
      id: 'cld_virtual_door_host',
      name: 'Фасад (хост)',
      active: 1,
      helpers_visible: 0,
      visible: 1,
      size: { x: facadeW, y: 's:y', z: facadeD },
      // Накладной: левый край двери = внешняя пласть бока (x=0), не внутренняя.
      pos: { x: 0, y: 0, z: doorZ },
      pivot: { x: -1, y: -1, z: -1 },
      rot: { x: 0, y: 0, z: 0 },
      spec: { cldVirtualDoorHost: 1, cldOverlayDoor: 1 },
      children: doorChildren,
      section_key: '',
    };

    const root = {
      type: 'section',
      id: 'cld_hinge_role_preview_root',
      name: 'Превью ролей (фасад+бок)',
      active: 1,
      helpers_visible: 0,
      visible: 1,
      size: { x: 's:x', y: 's:y', z: 's:z' },
      pos: { x: 0, y: 0, z: 0 },
      pivot: { x: -1, y: -1, z: -1 },
      rot: { x: 0, y: 0, z: 0 },
      spec: { cldHingeRoleVirtualSide: 1 },
      children: [wall, doorHost],
      section_key: '',
    };

    return {
      tree: [root],
      sizeMm: {
        // Дверь накрывает бок по X — ширина превью = ширина фасада.
        w: facadeW,
        h: facadeH,
        d: sideDepth + facadeD,
      },
      wallTMm: wallT,
      facadeSizeMm: { w: facadeW, h: facadeH, d: facadeD },
      sideDepthMm: sideDepth,
      facadeSeamZMm: 0,
      /** Шов по X в СК двери (= толщина бока при накладном). */
      overlaySideThicknessMm: wallT,
    };
  }

  async function postTreeToPreview(payload) {
    if (!payload || !Array.isArray(payload.tree)) return;
    await syncPreviewInfrastructure(payload.tree);
    if (!__previewIframe || !__previewIframe.contentWindow || !__previewReady) {
      __pendingPreview = payload;
      return;
    }
    const win = __previewIframe.contentWindow;
    const { tree, sizeMm, vars, materials, hingeAxis } = payload;
    const virtualSide = payload.hingeRoleVirtualSide === true;
    try {
      win.postMessage({ type: 'cld:setVars', vars: vars || {} }, '*');
      win.postMessage({ type: 'cld:setMaterials', materials: materials || {} }, '*');
      // hingeRolePreview: не снимать модули и не перераскладывать Y в iframe (уже сделано здесь).
      win.postMessage(
        {
          type: 'cld:setTemplateTree',
          tree,
          structure: tree,
          sizeMm: sizeMm || { w: 300, h: 400, d: 16 },
          hingeRolePreview: true,
          hingeRoleVirtualSide: virtualSide,
        },
        '*'
      );
      // Включаем размерные метки реальных позиций петель (для сверки с topOffset/bottomOffset).
      win.postMessage(
        {
          type: 'cld:setHingeRoleMarkers',
          on: hingeAxis === 'X' || hingeAxis === 'Y',
          axis: hingeAxis || 'Y',
          measure: 'module',
        },
        '*'
      );
    } catch (e) {
      console.warn('[hinge-role-preview] postMessage failed', e);
    }
  }

  function applyLayoutParamsToTree(tree, gen, params, sizeMm, opens) {
    if (!Array.isArray(tree) || !gen || typeof gen.roleLayoutParamsToHingeAccessory !== 'function') {
      return null;
    }

    const axis = axisForOpens(gen, opens);
    const isSolid = axis === null;
    const dim = isSolid
      ? 0
      : axis === 'X'
        ? Math.max(1, Number(sizeMm?.w) || 400)
        : Math.max(1, Number(sizeMm?.h) || 400);
    const layoutAcc = gen.roleLayoutParamsToHingeAccessory(params, dim, opens);

    let catalogHingeModules = false;
    if (isSolid) {
      if (typeof gen.stripHingeModuleNodesInTree === 'function') gen.stripHingeModuleNodesInTree(tree);
    } else if (
      layoutAcc &&
      typeof gen.applyRoleLayoutCatalogHingeModulesInTree === 'function'
    ) {
      // Накладной: шов на внутренней пласти бока (x=wallT), не на кромке двери.
      catalogHingeModules = !!gen.applyRoleLayoutCatalogHingeModulesInTree(tree, layoutAcc, {
        axis: axis || 'Y',
        dimensionMm: dim,
        facadeShellDepthMm: Math.max(1, Number(sizeMm?.d) || 16),
        facadeWidthMm: Math.max(1, Number(sizeMm?.w) || 0),
        facadeSeamZMm: 0,
        doorDirection: 'ly',
        useAnchorOffset: false,
        overlaySideThicknessMm: VIRTUAL_SIDEWALL_T_MM,
      });
      if (!catalogHingeModules) {
        console.warn('[hinge-role-preview] no catalog hinge modules in facade tree (layout skipped)');
      }
    }

    let hingeAccPatched = false;
    let hingeAccTemplate = null;

    const walk = (nodes) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node.accessories)) {
          if (isSolid) {
            node.accessories = node.accessories.filter((acc) => !isHingeAccessory(acc));
          } else if (layoutAcc) {
            for (const acc of node.accessories) {
              if (!isHingeAccessory(acc)) continue;
              if (!hingeAccTemplate) hingeAccTemplate = JSON.parse(JSON.stringify(acc));
              syncAccessoryLayoutMeta(acc, layoutAcc, opens, catalogHingeModules);
              hingeAccPatched = true;
            }
          }
        }
        if (Array.isArray(node.children)) walk(node.children);
      }
    };
    walk(tree);

    if (!isSolid && layoutAcc && !hingeAccPatched) {
      const host =
        tree.find((n) => n && (n.type === 'section' || n.type === 'fill_section')) || tree[0];
      if (host) {
        if (!Array.isArray(host.accessories)) host.accessories = [];
        const acc = {
          ...(hingeAccTemplate || { id: 'hinge', name: 'Петли' }),
        };
        syncAccessoryLayoutMeta(acc, layoutAcc, opens, catalogHingeModules);
        host.accessories.push(acc);
      }
    }

    if (typeof gen.applyDoorPivotOffsetToRotateAnimatorsInTree === 'function') {
      gen.applyDoorPivotOffsetToRotateAnimatorsInTree(tree, {
        x: Number(params?.doorPivotOffsetX) || 0,
        y: Number(params?.doorPivotOffsetY) || 0,
        z: Number(params?.doorPivotOffsetZ) || 0,
      });
    }

    return layoutAcc;
  }

  function layoutDefaults(gen, hit) {
    if (gen && typeof gen.ensureHingeRoleLayoutParams === 'function') {
      return gen.ensureHingeRoleLayoutParams(hit || {});
    }
    return {
      topOffset: 100,
      bottomOffset: 100,
      hingeCount: 2,
      hasMiddle: false,
      middleMode: 'center',
      middleDistance: 0,
      middleDistanceKind: 'mm',
      facadeEdgeOffset: 1.5,
    };
  }

  function axisForOpens(gen, opens) {
    if (gen && typeof gen.hingeAxisForOpens === 'function') return gen.hingeAxisForOpens(opens);
    if (opens === 'lift') return 'X';
    if (opens === 'swing') return 'Y';
    return null;
  }

  function axisBadge(axis) {
    if (axis === 'X') {
      return '<span style="background:#fff4d6; color:#a76b00; border:1px solid #f0d18a; padding:2px 8px; border-radius:10px; font-family:monospace; font-size:11px;">X</span>';
    }
    if (axis === 'Y') {
      return '<span style="background:#e3f1ff; color:#1f6cb0; border:1px solid #b5d8f5; padding:2px 8px; border-radius:10px; font-family:monospace; font-size:11px;">Y</span>';
    }
    return '<span style="color:#bbb; font-size:11px;">—</span>';
  }

  function opensBadge(opens, gen) {
    const label = (gen?.OPENS_LABEL && gen.OPENS_LABEL[opens]) || opens;
    if (opens === 'swing') {
      return `<span style="display:inline-block; padding:2px 8px; border-radius:10px; background:#eaf6ee; color:#2c7a3d; border:1px solid #bcdfc3; font-size:11px;">${esc(label)}</span>`;
    }
    if (opens === 'lift') {
      return `<span style="display:inline-block; padding:2px 8px; border-radius:10px; background:#fff1e6; color:#b15a17; border:1px solid #f4caa6; font-size:11px;">${esc(label)}</span>`;
    }
    if (opens === 'solid') {
      return `<span style="display:inline-block; padding:2px 8px; border-radius:10px; background:#f1f1f1; color:#777; border:1px solid #d8d8d8; font-size:11px;">${esc(label)}</span>`;
    }
    return esc(label);
  }

  function rowSummary(row, opens) {
    if (opens === 'solid') return '<span style="color:#999;">без петель</span>';
    let count = Math.round(Number(row?.hingeCount));
    if (!Number.isFinite(count) || count < 2) count = row?.hasMiddle ? 3 : 2;
    count = Math.max(2, Math.min(7, count));
    let extra = '';
    if (count === 3 || count === 4) {
      const mode = row?.middleMode || (count === 4 ? 'even' : 'center');
      const dist = Math.round(Number(row?.middleDistance) || 0);
      const kind = row?.middleDistanceKind === 'percent' ? 'percent' : 'mm';
      const unit = kind === 'percent' ? '% зазора' : ' мм';
      if (count === 3) {
        if (mode === 'fromBottom' && dist > 0) extra = `, средняя ${dist}${unit} от низа`;
        else if (mode === 'fromTop' && dist > 0) extra = `, средняя ${dist}${unit} от верха`;
        else extra = ', средняя по центру';
      } else if (mode === 'fromBottom' && dist > 0) {
        extra = `, шаг ${dist}${unit} от низа`;
      } else if (mode === 'fromTop' && dist > 0) {
        extra = `, шаг ${dist}${unit} от верха`;
      } else {
        extra = ', равномерно';
      }
    } else if (count >= 5) {
      const slots = Array.isArray(row?.middleSlots) ? row.middleSlots : [];
      const fixed = slots.filter((s) => s && s.mode && s.mode !== 'auto').length;
      extra = fixed
        ? `, ${fixed} из ${slots.length} с заданным шагом`
        : ', промежуточные равномерно';
    }
    return `${count} шт. <span style="color:#888;">(${row.topOffset}/${row.bottomOffset}${extra})</span>` +
      (() => {
        const px = Number(row?.doorPivotOffsetX) || 0;
        const py = Number(row?.doorPivotOffsetY) || 0;
        const pz = Number(row?.doorPivotOffsetZ) || 0;
        const cx = Number(row?.corpusMountOffsetX) || 0;
        const cy = Number(row?.corpusMountOffsetY) || 0;
        const cz = Number(row?.corpusMountOffsetZ) || 0;
        let html = '';
        if (cx || cy || cz) {
          html += `<br><span style="color:#888; font-size:11px;">корпус на боке ${cx}/${cy}/${cz}</span>`;
        }
        if (px || py || pz) {
          html += `<br><span style="color:#888; font-size:11px;">ось комнаты ${px}/${py}/${pz}</span>`;
        }
        return html;
      })();
  }

  function getHingeCount() {
    const n = Number(document.getElementById('hinge-role-modal-count')?.value);
    if (Number.isFinite(n) && n >= 2 && n <= 7) return Math.round(n);
    return 2;
  }

  function setHingeCount(count) {
    const el = document.getElementById('hinge-role-modal-count');
    if (!el) return;
    const n = Math.max(2, Math.min(7, Math.round(Number(count) || 2)));
    el.value = String(n);
  }

  function syncMiddleModeSelectOptions(count) {
    const sel = document.getElementById('hinge-role-modal-middle-mode');
    if (!sel) return;
    const prev = sel.value;
    if (count === 4) {
      sel.innerHTML =
        '<option value="even">Равномерно</option>' +
        '<option value="fromBottom">От нижней к следующей</option>' +
        '<option value="fromTop">От верхней к следующей</option>';
      if (prev === 'fromBottom' || prev === 'fromTop' || prev === 'even') sel.value = prev;
      else if (prev === 'center') sel.value = 'even';
      else sel.value = 'even';
    } else {
      sel.innerHTML =
        '<option value="center">По центру</option>' +
        '<option value="fromBottom">От нижней</option>' +
        '<option value="fromTop">От верхней</option>';
      if (prev === 'fromBottom' || prev === 'fromTop' || prev === 'center') sel.value = prev;
      else if (prev === 'even') sel.value = 'center';
      else sel.value = 'center';
    }
  }

  function getMiddleMode() {
    const count = getHingeCount();
    const v = document.getElementById('hinge-role-modal-middle-mode')?.value || '';
    if (count === 4) {
      if (v === 'fromBottom' || v === 'fromTop' || v === 'even') return v;
      return 'even';
    }
    if (v === 'fromBottom' || v === 'fromTop' || v === 'center') return v;
    return 'center';
  }

  function setMiddleMode(mode, countHint) {
    const count = countHint ?? getHingeCount();
    syncMiddleModeSelectOptions(count);
    const el = document.getElementById('hinge-role-modal-middle-mode');
    if (!el) return;
    let m = String(mode || '').trim();
    if (count === 4) {
      if (m === 'center') m = 'even';
      el.value = m === 'fromBottom' || m === 'fromTop' ? m : 'even';
    } else {
      if (m === 'even') m = 'center';
      el.value = m === 'fromBottom' || m === 'fromTop' ? m : 'center';
    }
  }

  function middleModeNeedsDistance(count, mode) {
    if (count === 3) return mode !== 'center';
    if (count === 4) return mode === 'fromBottom' || mode === 'fromTop';
    return false;
  }

  function getMiddleDistanceKind() {
    const v = document.getElementById('hinge-role-modal-middle-distance-kind')?.value || 'mm';
    return v === 'percent' ? 'percent' : 'mm';
  }

  function setMiddleDistanceKind(kind) {
    const el = document.getElementById('hinge-role-modal-middle-distance-kind');
    if (!el) return;
    el.value = kind === 'percent' ? 'percent' : 'mm';
  }

  function getMiddleDistance() {
    const n = Number(document.getElementById('hinge-role-modal-middle-distance')?.value);
    if (!Number.isFinite(n) || n < 0) return 0;
    if (getMiddleDistanceKind() === 'percent') {
      return Math.max(0, Math.min(100, Math.round(n)));
    }
    return Math.round(n);
  }

  function setMiddleDistance(val) {
    const el = document.getElementById('hinge-role-modal-middle-distance');
    if (!el) return;
    const kind = getMiddleDistanceKind();
    let n = Math.max(0, Number(val) || 0);
    if (kind === 'percent') n = Math.min(100, Math.round(n));
    else n = Math.round(n);
    el.value = String(n);
  }

  /* ===== Слоты для каждой промежуточной петли (count >= 5) ===== */

  /** Текущее состояние (внутри модалки) — массив слотов длины count-2. */
  let __slotsState = [];

  function clampSlotValue(kind, raw) {
    let n = Math.max(0, Number(raw) || 0);
    if (kind === 'percent') n = Math.min(100, n);
    return Math.round(n);
  }

  function defaultSlot() {
    return { mode: 'auto', value: 0, kind: 'mm' };
  }

  /** Подгоняет длину __slotsState под count-2 промежуточных, сохраняя то, что есть. */
  function resizeSlotsState(count) {
    const want = Math.max(0, count - 2);
    while (__slotsState.length < want) __slotsState.push(defaultSlot());
    if (__slotsState.length > want) __slotsState.length = want;
  }

  function renderSlotsList() {
    const list = document.getElementById('hinge-role-modal-slots-list');
    if (!list) return;
    if (!__slotsState.length) {
      list.innerHTML = '';
      return;
    }
    const total = __slotsState.length + 2;
    let html = '';
    __slotsState.forEach((slot, i) => {
      const idx = i + 2;
      const showVal = slot.mode !== 'auto';
      const unitMm = `<option value="mm"${slot.kind === 'mm' ? ' selected' : ''}>мм</option>`;
      const unitPct = `<option value="percent"${slot.kind === 'percent' ? ' selected' : ''}>% зазора</option>`;
      const modeAuto = `<option value="auto"${slot.mode === 'auto' ? ' selected' : ''}>Авто (равномерно)</option>`;
      const modeFromB = `<option value="fromBottom"${slot.mode === 'fromBottom' ? ' selected' : ''}>От нижней крайней</option>`;
      const modeFromT = `<option value="fromTop"${slot.mode === 'fromTop' ? ' selected' : ''}>От верхней крайней</option>`;
      const max = slot.kind === 'percent' ? ' max="100"' : '';
      const valStr = String(clampSlotValue(slot.kind, slot.value));
      html += `
        <div class="hinge-role-slot-row" data-slot-index="${i}" style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <div style="flex:0 0 90px; font-size:11px; color:#666; font-weight:600;">Петля ${idx}/${total}</div>
          <select data-slot-mode class="form-control input-sm" style="flex:1; min-width:160px;">
            ${modeAuto}${modeFromB}${modeFromT}
          </select>
          <div data-slot-value-wrap style="flex:1; min-width:140px; display:${showVal ? 'flex' : 'none'}; gap:4px;">
            <input data-slot-value type="number" class="form-control input-sm" min="0"${max} step="1" value="${valStr}" style="flex:1; min-width:70px;">
            <select data-slot-kind class="form-control input-sm" style="flex:0 0 110px;">
              ${unitMm}${unitPct}
            </select>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
  }

  function readSlotsFromUI() {
    const list = document.getElementById('hinge-role-modal-slots-list');
    if (!list) return __slotsState.slice();
    const rows = list.querySelectorAll('.hinge-role-slot-row');
    const out = [];
    rows.forEach((row) => {
      const mode = row.querySelector('[data-slot-mode]')?.value || 'auto';
      const kind = row.querySelector('[data-slot-kind]')?.value || 'mm';
      const valRaw = row.querySelector('[data-slot-value]')?.value;
      out.push({
        mode: mode === 'fromBottom' || mode === 'fromTop' ? mode : 'auto',
        kind: kind === 'percent' ? 'percent' : 'mm',
        value: clampSlotValue(kind, valRaw),
      });
    });
    return out;
  }

  function setSlots(slots, count) {
    const want = Math.max(0, count - 2);
    __slotsState = [];
    for (let i = 0; i < want; i++) {
      const s = (Array.isArray(slots) && slots[i]) || defaultSlot();
      __slotsState.push({
        mode: s.mode === 'fromBottom' || s.mode === 'fromTop' ? s.mode : 'auto',
        kind: s.kind === 'percent' ? 'percent' : 'mm',
        value: clampSlotValue(s.kind, s.value),
      });
    }
    renderSlotsList();
  }

  /** Показать/скрыть блок расстановки для 3–4 петель. */
  function syncMiddleControls() {
    const count = getHingeCount();
    const block = document.getElementById('hinge-role-modal-middle-block');
    const blockLbl = document.getElementById('hinge-role-modal-middle-block-label');
    const kindWrap = document.getElementById('hinge-role-modal-middle-distance-kind-wrap');
    const wrap = document.getElementById('hinge-role-modal-middle-distance-wrap');
    const lbl = document.getElementById('hinge-role-modal-middle-distance-label');
    const distInp = document.getElementById('hinge-role-modal-middle-distance');
    const hint = document.getElementById('hinge-role-modal-count-hint');
    const slotsBlock = document.getElementById('hinge-role-modal-slots-block');
    const showBlock = count === 3 || count === 4;
    const showSlots = count >= 5;
    if (block) block.style.display = showBlock ? '' : 'none';
    if (slotsBlock) slotsBlock.style.display = showSlots ? '' : 'none';
    if (showBlock) syncMiddleModeSelectOptions(count);
    if (showSlots) {
      resizeSlotsState(count);
      renderSlotsList();
    }
    if (count === 3 || count === 4) {
      if (blockLbl) {
        blockLbl.textContent = count === 3 ? 'Средняя петля' : 'Расстановка (4 петли)';
      }
      const mode = getMiddleMode();
      const showDist = middleModeNeedsDistance(count, mode);
      if (kindWrap) kindWrap.style.display = showDist ? '' : 'none';
      if (wrap) wrap.style.display = showDist ? '' : 'none';
      const kind = getMiddleDistanceKind();
      if (lbl) {
        const unit = kind === 'percent' ? '%' : 'мм';
        if (count === 3) {
          lbl.textContent =
            mode === 'fromBottom' ? `От нижней, ${unit}` : `От верхней, ${unit}`;
        } else {
          lbl.textContent =
            mode === 'fromBottom' ? `До 2-й петли, ${unit}` : `До 3-й петли, ${unit}`;
        }
      }
      if (distInp) {
        if (kind === 'percent') {
          distInp.max = '100';
          distInp.step = '1';
        } else {
          distInp.removeAttribute('max');
          distInp.step = '1';
        }
      }
      if (hint) {
        hint.textContent =
          count === 3
            ? 'Крайние по отступам, средняя — по выбранному правилу.'
            : 'Крайние по отступам: равномерно или заданный шаг от низа/верха, остальная пара — посередине зазора.';
      }
    } else if (showSlots) {
      if (hint) {
        hint.textContent =
          'Крайние по отступам. Каждой промежуточной петле задайте режим: «Авто» (равномерно) или фикс. расстояние от нижней/верхней крайней.';
      }
    } else if (hint) {
      hint.textContent = 'Две петли по отступам сверху и снизу.';
    }
  }

  /** Подпись фасада: «#6 · Фасад5» (номер + название, без дубля #id). */
  function formatFacadeItemLabel(id, name) {
    const nid = Number(id) || 0;
    if (!nid) return { html: '', plain: '' };
    let nm = String(name || '').trim();
    if (nm === `#${nid}` || nm === String(nid)) nm = '';
    const plain = nm ? `#${nid} · ${nm}` : `#${nid}`;
    const html = nm
      ? `<span style="color:#1f6cb0;font-weight:600;">#${nid}</span> <span style="color:#333;">· ${esc(nm)}</span>`
      : `<span style="color:#1f6cb0;font-weight:600;">#${nid}</span>`;
    return { html, plain };
  }

  function setFacadeDisplay(id, name) {
    const nid = Number(id) || 0;
    const nm = String(name || '').trim();
    if (__modalContext) {
      __modalContext.catalogItemId = nid;
      __modalContext.catalogItemName = nm;
    }
    const disp = document.getElementById('hinge-role-modal-facade-display');
    const link = document.getElementById('hinge-role-modal-open-facade');
    if (disp) {
      disp.innerHTML = nid
        ? formatFacadeItemLabel(nid, nm).html
        : '<span style="color:#bbb;font-style:italic;">не выбран</span>';
    }
    if (link) {
      if (nid) {
        link.href = `#catalog-item-edit?type=${encodeURIComponent(CATALOG_TYPE)}&id=${nid}`;
        link.style.opacity = '1';
        link.style.pointerEvents = '';
      } else {
        link.href = '#';
        link.style.opacity = '.55';
        link.style.pointerEvents = 'none';
      }
    }
  }

  function startFacadePick() {
    if (!__modalContext) return;
    sessionStorage.setItem(
      PICK_KEY,
      JSON.stringify({
        productKind: __modalContext.productKind,
        variant: __modalContext.variant,
        opens: __modalContext.opens,
        selectedId: __modalContext.catalogItemId || 0,
        selectedName: __modalContext.catalogItemName || '',
      })
    );
    const modal = document.getElementById('hinge-role-modal');
    if (modal) modal.style.display = 'none';
    window.location.hash = '#catalog-items?type=catalog_28&pick=hinge-role';
  }

  function readPickSession() {
    try {
      return JSON.parse(sessionStorage.getItem(PICK_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function isFacadePickMode() {
    const h = window.location.hash || '';
    if (!h.startsWith('#catalog-items')) return false;
    const q = h.split('?')[1] || '';
    return new URLSearchParams(q).get('pick') === 'hinge-role' && !!readPickSession();
  }

  function ensurePickBar() {
    let bar = document.getElementById('catalog-hinge-pick-bar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'catalog-hinge-pick-bar';
    bar.style.cssText =
      'display:none; position:fixed; bottom:0; left:250px; right:0; z-index:10040; ' +
      'background:#fff; border-top:2px solid #1f6cb0; padding:12px 20px; box-shadow:0 -4px 12px rgba(0,0,0,.12);';
    bar.innerHTML =
      '<div style="display:flex; align-items:center; justify-content:space-between; max-width:1200px; margin:0 auto;">' +
      '<div><div style="font-size:14px; font-weight:600; color:#333;">Выбор фасада для роли</div>' +
      '<div id="catalog-hinge-pick-label" style="font-size:12px; color:#888; margin-top:2px;">Кликните по строке в списке</div></div>' +
      '<div style="display:flex; gap:8px;">' +
      '<button type="button" id="catalog-hinge-pick-cancel" class="btn btn-white btn-sm">Отмена</button>' +
      '<button type="button" id="catalog-hinge-pick-ok" class="btn btn-primary btn-sm" disabled>ОК</button>' +
      '</div></div>';
    document.body.appendChild(bar);
    return bar;
  }

  function readCatalogRowId(tr) {
    if (!tr) return 0;
    const fromCb = Number(tr.querySelector('input[type="checkbox"]')?.value);
    if (Number.isFinite(fromCb) && fromCb > 0) return fromCb;
    const fromCell = Number(String(tr.querySelector('td:nth-child(2)')?.textContent || '').trim());
    return Number.isFinite(fromCell) && fromCell > 0 ? fromCell : 0;
  }

  function highlightPickRow(tbody, selId) {
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach((tr) => {
      const id = readCatalogRowId(tr);
      tr.style.cursor = id ? 'pointer' : '';
      if (id && id === selId) {
        tr.style.background = '#e8f4ff';
        tr.style.outline = '2px solid #1f6cb0';
      } else {
        tr.style.background = '';
        tr.style.outline = '';
      }
    });
  }

  function refreshFacadePickCatalogUI() {
    try {
    const bar = ensurePickBar();
    const label = document.getElementById('catalog-hinge-pick-label');
    const okBtn = document.getElementById('catalog-hinge-pick-ok');
    const pick = readPickSession();
    const active = isFacadePickMode();

    bar.style.display = active ? 'block' : 'none';
    if (!active || !pick) return;

    const tbody = document.getElementById('catalog-items-table-body');
    if (!tbody) return;

    const selId = Number(pick.selectedId) || 0;
    if (label) {
      label.textContent = selId
        ? `Выбран: ${formatFacadeItemLabel(selId, pick.selectedName).plain}`
        : 'Кликните по строке в списке';
    }
    if (okBtn) okBtn.disabled = !selId;
    highlightPickRow(tbody, selId);

    if (!tbody.__hingePickRowBound) {
      tbody.__hingePickRowBound = true;
      tbody.addEventListener('click', (e) => {
        if (!isFacadePickMode()) return;
        const tr = e.target.closest('tr');
        if (!tr || !tbody.contains(tr)) return;
        if (e.target.closest('a, button, input, i.btn, .col-actions')) return;
        const id = readCatalogRowId(tr);
        if (!id) return;
        const p = readPickSession();
        if (!p) return;
        p.selectedId = id;
        const nameCell = tr.querySelector('td:nth-child(4)');
        p.selectedName = nameCell?.textContent?.trim() || `#${id}`;
        sessionStorage.setItem(PICK_KEY, JSON.stringify(p));
        highlightPickRow(tbody, id);
        const lbl = document.getElementById('catalog-hinge-pick-label');
        const ok = document.getElementById('catalog-hinge-pick-ok');
        if (lbl) lbl.textContent = `Выбран: ${formatFacadeItemLabel(id, p.selectedName).plain}`;
        if (ok) ok.disabled = false;
      });
    }

    if (bar && !bar.__pickBound) {
      bar.__pickBound = true;
      document.getElementById('catalog-hinge-pick-ok')?.addEventListener('click', () => {
        const p = readPickSession();
        const sel = Number(p?.selectedId) || 0;
        if (!sel) return;
        sessionStorage.removeItem(PICK_KEY);
        hidePickBar();
        sessionStorage.setItem(
          PICK_RESULT_KEY,
          JSON.stringify({
            productKind: p.productKind,
            variant: p.variant,
            opens: p.opens,
            catalogItemId: sel,
            catalogItemName: p.selectedName,
          })
        );
        window.location.hash =
          `#hinge-role-defaults?open=${encodeURIComponent(p.productKind)}` +
          `&variant=${encodeURIComponent(p.variant)}` +
          `&opens=${encodeURIComponent(p.opens)}` +
          `&facadeId=${encodeURIComponent(String(sel))}`;
      });
      document.getElementById('catalog-hinge-pick-cancel')?.addEventListener('click', () => {
        sessionStorage.removeItem(PICK_KEY);
        window.location.hash = '#hinge-role-defaults';
      });
    }
    } catch (e) {
      console.warn('[hinge-role-pick]', e);
    }
  }

  function hidePickBar() {
    const bar = document.getElementById('catalog-hinge-pick-bar');
    if (bar) bar.style.display = 'none';
  }

  function handleReturnFromPick(gen) {
    const raw = sessionStorage.getItem(PICK_RESULT_KEY);
    if (!raw) return false;
    sessionStorage.removeItem(PICK_RESULT_KEY);
    hidePickBar();
    let r;
    try {
      r = JSON.parse(raw);
    } catch {
      return false;
    }
    const tr = document.querySelector(
      `tr.hinge-role-row[data-product-kind="${CSS.escape(r.productKind)}"][data-variant="${CSS.escape(r.variant)}"][data-opens="${CSS.escape(r.opens)}"]`
    );
    if (tr) {
      openModalForRow(gen, tr, r.catalogItemId, r.catalogItemName);
      return true;
    }
    return false;
  }

  function tryOpenFromHash(gen) {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#hinge-role-defaults')) return;
    const q = hash.split('?')[1] || '';
    const params = new URLSearchParams(q);
    const pk = params.get('open');
    const variant = params.get('variant');
    const opens = params.get('opens');
    if (!pk || !variant || !opens) return;
    const facadeId = Number(params.get('facadeId')) || 0;
    const tr = document.querySelector(
      `tr.hinge-role-row[data-product-kind="${CSS.escape(pk)}"][data-variant="${CSS.escape(variant)}"][data-opens="${CSS.escape(opens)}"]`
    );
    if (tr) {
      setTimeout(() => openModalForRow(gen, tr, facadeId || undefined, undefined), 80);
    }
  }

  function findFacadeName(items, id) {
    const nid = Number(id) || 0;
    if (!nid) return '';
    const it = items.find((x) => Number(x.id) === nid);
    const nm = String(it?.name || '').trim();
    if (!nm || nm === `#${nid}` || nm === String(nid)) return '';
    return nm;
  }

  async function resolveFacadeDisplayName(cid, facadeItems, hints) {
    const nid = Number(cid) || 0;
    if (!nid) return '';
    let nm = String(hints || '').trim();
    if (nm && nm !== `#${nid}` && nm !== String(nid)) return nm;
    nm = findFacadeName(facadeItems, nid);
    if (nm) return nm;
    try {
      const payload = await fetchCatalogItemById(nid);
      nm = String(payload?.name || '').trim();
      if (nm && nm !== `#${nid}` && nm !== String(nid)) return nm;
    } catch (_) {
      /* ignore */
    }
    return '';
  }

  /* ============================ Список ============================ */

  async function loadHingeRoleDefaultsPage() {
    const gen = window.__cldHingeLayout;
    const tbody = document.getElementById('hinge-role-defaults-tbody');
    const info = document.getElementById('hinge-role-defaults-save-info');
    if (!gen) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="color:#c00;">Не загружен js/hinge-layout-generator.js</td></tr>';
      }
      if (info) info.textContent = 'Подключите hinge-layout-generator.js перед этим скриптом.';
      return;
    }
    if (!tbody) {
      if (info) info.textContent = 'Нет разметки страницы. Обновите admin-new.html.';
      return;
    }

    let facadeItems = [];
    try {
      facadeItems = await fetchFacadeCatalogList(true);
    } catch (e) {
      tbody.innerHTML =
        `<tr><td colspan="7" style="color:#c00;">Не удалось загрузить каталог фасадов: ${esc(e.message || e)}</td></tr>`;
      return;
    }

    renderRows(gen, facadeItems);
    bindModal(gen);
    hidePickBar();
    const openedFromPick = handleReturnFromPick(gen);
    if (!openedFromPick) tryOpenFromHash(gen);

    if (info) {
      info.textContent =
        facadeItems.length === 0
          ? 'Каталог фасадов (catalog_28) пуст — создайте элементы в каталоге.'
          : `Загружено элементов catalog_28: ${facadeItems.length}.`;
    }
  }

  function renderRows(gen, facadeItems) {
    const tbody = document.getElementById('hinge-role-defaults-tbody');
    if (!tbody) return;

    const savedVariants =
      typeof gen.readFacadeVariantDefaults === 'function' ? gen.readFacadeVariantDefaults() : [];
    const findSaved = (pk, variant, opens) =>
      savedVariants.find((r) => r.productKind === pk && r.variant === variant && r.opens === opens) || null;

    const productKinds = gen.PRODUCT_KINDS || [];
    const variants =
      typeof gen.facadeVariantsForAdminUI === 'function'
        ? gen.facadeVariantsForAdminUI()
        : gen.PRODUCT_FACADE_VARIANTS || [];
    const productLabel = (key) => productKinds.find((p) => p.key === key)?.label || key;

    const grouped = new Map();
    for (const v of variants) {
      if (!grouped.has(v.product)) grouped.set(v.product, []);
      grouped.get(v.product).push(v);
    }

    let html = '';
    for (const [productKey, list] of grouped) {
      list.forEach((meta, idx) => {
        const hit = findSaved(productKey, meta.variant, meta.opens);
        const params = layoutDefaults(gen, hit);
        const cid = hit?.catalogItemId || 0;
        const axis = axisForOpens(gen, meta.opens);
        const facadeName = findFacadeName(facadeItems, cid) || hit?.catalogItemName || '';
        const facadeCell = cid
          ? formatFacadeItemLabel(cid, facadeName).html
          : '<span style="color:#bbb; font-style:italic;">не задано</span>';

        const productCell =
          idx === 0
            ? `<td rowspan="${list.length}" style="vertical-align:middle; background:#fafbfd; font-weight:600; border-left:3px solid #d6dde7;">${esc(productLabel(productKey))}</td>`
            : '';

        html += `<tr class="hinge-role-row" data-product-kind="${esc(productKey)}" data-variant="${esc(meta.variant)}" data-opens="${esc(meta.opens)}" style="cursor:pointer;">
          ${productCell}
          <td>${esc(meta.variantLabel)}</td>
          <td>${opensBadge(meta.opens, gen)}</td>
          <td style="text-align:center;">${axisBadge(axis)}</td>
          <td>${facadeCell}</td>
          <td style="text-align:center; font-size:12px;">${rowSummary(params, meta.opens)}</td>
          <td style="text-align:center;"><i class="fa fa-pencil" style="color:#888;"></i></td>
        </tr>`;
      });
    }
    tbody.innerHTML = html;

    tbody.querySelectorAll('tr.hinge-role-row').forEach((tr) => {
      if (tr.__bound) return;
      tr.__bound = true;
      tr.addEventListener('mouseenter', () => (tr.style.background = '#f6f9fc'));
      tr.addEventListener('mouseleave', () => (tr.style.background = ''));
      tr.addEventListener('click', () => openModalForRow(gen, tr));
    });
  }

  /* ============================ Модалка ============================ */

  function bindModal(gen) {
    const modal = document.getElementById('hinge-role-modal');
    if (!modal || modal.__bound) return;
    modal.__bound = true;

    const closeBtn = document.getElementById('hinge-role-modal-close-x');
    const cancelBtn = document.getElementById('hinge-role-modal-cancel-btn');
    const saveBtn = document.getElementById('hinge-role-modal-save-btn');
    const clearBtn = document.getElementById('hinge-role-modal-clear-btn');
    const pickBtn = document.getElementById('hinge-role-modal-pick-btn');
    const topInp = document.getElementById('hinge-role-modal-top');
    const bottomInp = document.getElementById('hinge-role-modal-bottom');

    const close = () => {
      modal.style.display = 'none';
      __modalContext = null;
    };

    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') close();
    });

    const onChange = () => {
      if (!__modalContext) return;
      refreshPreview(gen).catch((err) => console.warn(err));
    };

    pickBtn?.addEventListener('click', () => startFacadePick());
    document.getElementById('hinge-role-modal-count')?.addEventListener('change', () => {
      syncMiddleControls();
      onChange();
    });
    document.getElementById('hinge-role-modal-middle-mode')?.addEventListener('change', () => {
      syncMiddleControls();
      onChange();
    });
    document.getElementById('hinge-role-modal-middle-distance-kind')?.addEventListener('change', () => {
      syncMiddleControls();
      onChange();
    });
    const distInp = document.getElementById('hinge-role-modal-middle-distance');
    const pivotXInp = document.getElementById('hinge-role-modal-door-pivot-x');
    const pivotYInp = document.getElementById('hinge-role-modal-door-pivot-y');
    const pivotZInp = document.getElementById('hinge-role-modal-door-pivot-z');
    const mountXInp = document.getElementById('hinge-role-modal-corpus-mount-x');
    const mountYInp = document.getElementById('hinge-role-modal-corpus-mount-y');
    const mountZInp = document.getElementById('hinge-role-modal-corpus-mount-z');
    [topInp, bottomInp, distInp, pivotXInp, pivotYInp, pivotZInp, mountXInp, mountYInp, mountZInp].forEach((el) =>
      el?.addEventListener('input', () => {
        clearTimeout(modal.__previewT);
        modal.__previewT = setTimeout(onChange, 250);
      })
    );

    const slotsList = document.getElementById('hinge-role-modal-slots-list');
    if (slotsList) {
      slotsList.addEventListener('change', (e) => {
        const target = e.target;
        if (!target) return;
        const row = target.closest('.hinge-role-slot-row');
        if (!row) return;
        const i = Number(row.getAttribute('data-slot-index'));
        if (!Number.isFinite(i) || !__slotsState[i]) return;
        if (target.matches('[data-slot-mode]')) {
          __slotsState[i].mode =
            target.value === 'fromBottom' || target.value === 'fromTop' ? target.value : 'auto';
          renderSlotsList();
          onChange();
          return;
        }
        if (target.matches('[data-slot-kind]')) {
          __slotsState[i].kind = target.value === 'percent' ? 'percent' : 'mm';
          __slotsState[i].value = clampSlotValue(__slotsState[i].kind, __slotsState[i].value);
          renderSlotsList();
          onChange();
          return;
        }
      });
      slotsList.addEventListener('input', (e) => {
        const target = e.target;
        if (!target || !target.matches('[data-slot-value]')) return;
        const row = target.closest('.hinge-role-slot-row');
        if (!row) return;
        const i = Number(row.getAttribute('data-slot-index'));
        if (!Number.isFinite(i) || !__slotsState[i]) return;
        __slotsState[i].value = clampSlotValue(__slotsState[i].kind, target.value);
        clearTimeout(modal.__previewT);
        modal.__previewT = setTimeout(onChange, 250);
      });
    }
    document.getElementById('hinge-role-modal-slots-reset')?.addEventListener('click', () => {
      __slotsState = __slotsState.map(() => defaultSlot());
      renderSlotsList();
      onChange();
    });

    saveBtn?.addEventListener('click', () => {
      const ctx = __modalContext;
      if (!ctx) return;
      const row = collectModalRow(ctx);
      const all = typeof gen.readFacadeVariantDefaults === 'function' ? gen.readFacadeVariantDefaults() : [];
      const next = all.filter(
        (r) => !(r.productKind === row.productKind && r.variant === row.variant && r.opens === row.opens)
      );
      next.push(row);
      if (typeof gen.saveFacadeVariantDefaults === 'function') {
        gen.saveFacadeVariantDefaults(next);
      }
      const info = document.getElementById('hinge-role-defaults-save-info');
      if (info) info.textContent = 'Сохранено.';
      if (window.toastr) window.toastr.success('Сохранено');
      close();
      fetchFacadeCatalogList()
        .then((items) => renderRows(gen, items))
        .catch(() => {});
    });

    clearBtn?.addEventListener('click', () => {
      const ctx = __modalContext;
      if (!ctx) return;
      if (!confirm('Сбросить привязку и параметры петель для этой строки?')) return;
      const all = typeof gen.readFacadeVariantDefaults === 'function' ? gen.readFacadeVariantDefaults() : [];
      const next = all.filter(
        (r) => !(r.productKind === ctx.productKind && r.variant === ctx.variant && r.opens === ctx.opens)
      );
      if (typeof gen.saveFacadeVariantDefaults === 'function') {
        gen.saveFacadeVariantDefaults(next);
      }
      close();
      fetchFacadeCatalogList()
        .then((items) => renderRows(gen, items))
        .catch(() => {});
    });
  }

  function collectModalRow(ctx) {
    const gen = window.__cldHingeLayout;
    const d = layoutDefaults(gen, null);
    const num = (id, fb) => {
      const n = Number(document.getElementById(id)?.value);
      return Number.isFinite(n) ? n : fb;
    };
    const isSolid = ctx.opens === 'solid';
    const count = isSolid ? 0 : getHingeCount();
    const mode = count === 3 || count === 4 ? getMiddleMode() : 'center';
    const needsDist = middleModeNeedsDistance(count, mode);
    const dist = needsDist ? getMiddleDistance() : 0;
    const distKind = needsDist ? getMiddleDistanceKind() : 'mm';
    const slots = count >= 5 ? readSlotsFromUI() : [];
    return {
      productKind: ctx.productKind,
      variant: ctx.variant,
      opens: ctx.opens,
      catalogItemId: __modalContext?.catalogItemId || 0,
      catalogItemName: String(__modalContext?.catalogItemName || '').trim(),
      topOffset: isSolid ? d.topOffset : num('hinge-role-modal-top', d.topOffset),
      bottomOffset: isSolid ? d.bottomOffset : num('hinge-role-modal-bottom', d.bottomOffset),
      hingeCount: count,
      hasMiddle: count >= 3,
      middleMode: mode,
      middleDistance: dist,
      middleDistanceKind: distKind,
      middleSlots: slots,
      facadeEdgeOffset: d.facadeEdgeOffset,
      doorPivotOffsetX: num('hinge-role-modal-door-pivot-x', d.doorPivotOffsetX ?? 0),
      doorPivotOffsetY: num('hinge-role-modal-door-pivot-y', d.doorPivotOffsetY ?? 0),
      doorPivotOffsetZ: num('hinge-role-modal-door-pivot-z', d.doorPivotOffsetZ ?? 0),
      corpusMountOffsetX: num('hinge-role-modal-corpus-mount-x', d.corpusMountOffsetX ?? 0),
      corpusMountOffsetY: num('hinge-role-modal-corpus-mount-y', d.corpusMountOffsetY ?? 0),
      corpusMountOffsetZ: num('hinge-role-modal-corpus-mount-z', d.corpusMountOffsetZ ?? 0),
    };
  }

  async function openModalForRow(gen, tr, presetCatalogId, presetCatalogName) {
    const productKind = tr.getAttribute('data-product-kind') || '';
    const variant = tr.getAttribute('data-variant') || '';
    const opens = tr.getAttribute('data-opens') || '';
    const meta = (gen.PRODUCT_FACADE_VARIANTS || []).find(
      (v) => v.product === productKind && v.variant === variant && v.opens === opens
    );
    if (!meta) return;
    const productLabel = (gen.PRODUCT_KINDS || []).find((p) => p.key === productKind)?.label || productKind;
    const opensLabel = (gen.OPENS_LABEL && gen.OPENS_LABEL[opens]) || opens;
    const axis = axisForOpens(gen, opens);

    const modal = document.getElementById('hinge-role-modal');
    const title = document.getElementById('hinge-role-modal-title');
    const subtitle = document.getElementById('hinge-role-modal-subtitle');
    if (title) title.innerHTML = `${esc(productLabel)} — ${esc(meta.variantLabel)}`;
    if (subtitle) {
      const axisInfo = axis ? `ось <b>${axis}</b>` : 'без петель';
      subtitle.innerHTML = `${opensBadge(opens, gen)} · ${axisInfo}`;
    }

    const facadeItems = await fetchFacadeCatalogList().catch(() => []);
    const saved =
      (typeof gen.readFacadeVariantDefaults === 'function'
        ? gen.readFacadeVariantDefaults()
        : []
      ).find((r) => r.productKind === productKind && r.variant === variant && r.opens === opens) || null;
    const params = layoutDefaults(gen, saved);

    const presetCid = Number(presetCatalogId);
    const cid =
      Number.isFinite(presetCid) && presetCid > 0
        ? presetCid
        : Number(saved?.catalogItemId) || 0;
    let cname =
      presetCatalogName ||
      saved?.catalogItemName ||
      findFacadeName(facadeItems, cid) ||
      '';

    __modalContext = {
      productKind,
      variant,
      opens,
      meta,
      catalogItemId: cid,
      catalogItemName: cname,
    };

    setFacadeDisplay(cid, cname);
    if (cid) {
      resolveFacadeDisplayName(cid, facadeItems, cname).then((nm) => {
        if (!__modalContext || Number(__modalContext.catalogItemId) !== cid) return;
        if (nm && nm !== __modalContext.catalogItemName) {
          setFacadeDisplay(cid, nm);
        }
      });
    }

    const topInp = document.getElementById('hinge-role-modal-top');
    const bottomInp = document.getElementById('hinge-role-modal-bottom');
    const topLbl = document.getElementById('hinge-role-modal-top-label');
    const bottomLbl = document.getElementById('hinge-role-modal-bottom-label');
    const offsetsBlock = document.getElementById('hinge-role-modal-offsets-block');
    const doorPivotBlock = document.getElementById('hinge-role-modal-door-pivot-block');
    const corpusMountBlock = document.getElementById('hinge-role-modal-corpus-mount-block');
    const solidNote = document.getElementById('hinge-role-modal-solid-note');

    if (axis === 'X') {
      if (topLbl) topLbl.textContent = 'Слева, мм';
      if (bottomLbl) bottomLbl.textContent = 'Справа, мм';
    } else {
      if (topLbl) topLbl.textContent = 'Сверху, мм';
      if (bottomLbl) bottomLbl.textContent = 'Снизу, мм';
    }

    if (topInp) topInp.value = params.topOffset;
    if (bottomInp) bottomInp.value = params.bottomOffset;
    const hc =
      Number(params.hingeCount) ||
      (params.hasMiddle ? 3 : 2);
    setHingeCount(hc);
    setMiddleMode(params.middleMode || (hc === 4 ? 'even' : 'center'), hc);
    setMiddleDistanceKind(params.middleDistanceKind || 'mm');
    setMiddleDistance(params.middleDistance || 0);
    setSlots(params.middleSlots || [], hc);
    syncMiddleControls();

    const pivotXInp = document.getElementById('hinge-role-modal-door-pivot-x');
    const pivotYInp = document.getElementById('hinge-role-modal-door-pivot-y');
    const pivotZInp = document.getElementById('hinge-role-modal-door-pivot-z');
    if (pivotXInp) pivotXInp.value = Number(params.doorPivotOffsetX) || 0;
    if (pivotYInp) pivotYInp.value = Number(params.doorPivotOffsetY) || 0;
    if (pivotZInp) pivotZInp.value = Number(params.doorPivotOffsetZ) || 0;

    const mountXInp = document.getElementById('hinge-role-modal-corpus-mount-x');
    const mountYInp = document.getElementById('hinge-role-modal-corpus-mount-y');
    const mountZInp = document.getElementById('hinge-role-modal-corpus-mount-z');
    if (mountXInp) mountXInp.value = Number(params.corpusMountOffsetX) || 0;
    if (mountYInp) mountYInp.value = Number(params.corpusMountOffsetY) || 0;
    if (mountZInp) mountZInp.value = Number(params.corpusMountOffsetZ) || 0;

    const isSolid = opens === 'solid';
    if (offsetsBlock) offsetsBlock.style.display = isSolid ? 'none' : '';
    if (corpusMountBlock) corpusMountBlock.style.display = isSolid ? 'none' : '';
    if (doorPivotBlock) doorPivotBlock.style.display = isSolid ? 'none' : '';
    if (solidNote) solidNote.style.display = isSolid ? '' : 'none';

    if (modal) {
      modal.style.display = 'flex';
    }

    setTimeout(() => {
      ensurePreviewMounted('hinge-role-modal-preview-viewport');
      refreshPreview(gen).catch((err) => console.warn(err));
    }, 50);
  }

  async function refreshPreview(gen) {
    const ctx = __modalContext;
    if (!ctx) return;
    const info = document.getElementById('hinge-role-modal-preview-info');
    const row = collectModalRow(ctx);
    const nid = row.catalogItemId;
    // Не держим устаревшее дерево фасада из кэша после правок wrap.
    if (nid) delete __previewItemCache[Number(nid) || 0];
    if (!nid) {
      if (info) info.textContent = 'Выберите элемент catalog_28.';
      postTreeToPreview({ tree: [], sizeMm: { w: 300, h: 400, d: 16 }, vars: {}, materials: {} });
      return;
    }
    try {
      if (info) info.textContent = 'Загрузка…';
      const payload = await fetchCatalogItemById(nid);
      if (!payload || !payload.tree.length) {
        if (info) {
          info.textContent =
            'У элемента нет дерева конструктора. Откройте его в каталоге и соберите фасад.';
        }
        postTreeToPreview({ tree: [], sizeMm: payload?.sizeMm, vars: {}, materials: {} });
        return;
      }
      const tree = JSON.parse(JSON.stringify(payload.tree));
      await ensureCatalogsForPreview(tree);
      const hydratedTree = hydrateNestedCatalogModulesForHingePreview(tree);
      // Раскладка Y/X по размеру ФАСАДА (до обёртки боком).
      const layoutAcc = applyLayoutParamsToTree(hydratedTree, gen, row, payload.sizeMm, row.opens);
      const hingeAxis = layoutAcc && !layoutAcc.__solid
        ? String(layoutAcc.hingeAxis || axisForOpens(gen, row.opens) || 'Y').toUpperCase()
        : null;
      const wrapped = wrapHingeRolePreviewWithVirtualSidewall(
        hydratedTree,
        payload.sizeMm,
        row.opens
      );
      console.warn('[hinge-role-preview] overlay seam', {
        bust: PREVIEW_CACHE_BUST,
        wallTMm: wrapped.wallTMm,
        overlaySideThicknessMm: wrapped.overlaySideThicknessMm,
        facadeSeamZMm: wrapped.facadeSeamZMm,
        note: 'накладной: дверь x=0, шов x=wallT, без +16 shift',
      });
      await postTreeToPreview({
        tree: wrapped.tree,
        sizeMm: wrapped.sizeMm,
        vars: payload.vars,
        materials: payload.materials,
        hingeAxis,
        hingeRoleVirtualSide: true,
      });
      if (info) {
        const axis = axisForOpens(gen, row.opens);
        if (axis === null) {
          info.textContent =
            `${payload.name || 'Фасад'} — ${Math.round(payload.sizeMm.w)}×${Math.round(payload.sizeMm.h)}×${Math.round(payload.sizeMm.d)} мм · цельный фасад`;
        } else {
          const topLbl = axis === 'X' ? 'слева' : 'сверху';
          const botLbl = axis === 'X' ? 'справа' : 'снизу';
          info.textContent =
            `${payload.name || 'Фасад'} — ${Math.round(payload.sizeMm.w)}×${Math.round(payload.sizeMm.h)}×${Math.round(payload.sizeMm.d)} мм · ` +
            `ось ${axis}, петель ${layoutAcc?.count || 0} (${topLbl} ${row.topOffset}, ${botLbl} ${row.bottomOffset}) · вирт. бок ${wrapped.wallTMm} мм`;
        }
      }
    } catch (e) {
      if (info) info.textContent = 'Ошибка загрузки: ' + (e.message || e);
    }
  }

  window.loadHingeRoleDefaultsPage = loadHingeRoleDefaultsPage;
  window.refreshHingeFacadePickCatalogUI = refreshFacadePickCatalogUI;
  window.hideHingeFacadePickBar = hidePickBar;

  function isHingeRoleDefaultsRoute() {
    const base = (window.location.hash || '').replace(/^#/, '').split('?')[0];
    return base === 'hinge-role-defaults';
  }

  function bootstrapHingeRoleDefaultsPageIfActive() {
    if (!isHingeRoleDefaultsRoute()) return;
    setTimeout(() => {
      loadHingeRoleDefaultsPage().catch((e) => console.warn('[hinge-role-defaults]', e));
    }, 0);
  }

  window.addEventListener('hashchange', () => {
    const h = window.location.hash || '';
    if (!h.startsWith('#hinge-role-defaults')) return;
    hidePickBar();
    bootstrapHingeRoleDefaultsPageIfActive();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapHingeRoleDefaultsPageIfActive);
  } else {
    bootstrapHingeRoleDefaultsPageIfActive();
  }
})();
