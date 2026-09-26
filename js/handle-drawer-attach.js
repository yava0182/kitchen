/**
 * Ручки на лицевых панелях ящиков (catalog_34 / __slide_own).
 * Правила — handle-runtime.resolveForFacade с layoutRole: drawer.
 */
(function (global) {
  'use strict';

  const HANDLE_NAME = '__cld_drawer_handle';
  let __pendingDrawerHandleLoads = 0;
  let __drawerHandleAttachGeneration = 0;
  const __drawerHandleLoadWaiters = [];

  function notifyDrawerHandleLoadsIdle() {
    if (__pendingDrawerHandleLoads > 0) return;
    const waiters = __drawerHandleLoadWaiters.splice(0);
    waiters.forEach((fn) => {
      try { fn(); } catch (_) {}
    });
  }

  function beginDrawerHandleLoad() {
    __pendingDrawerHandleLoads += 1;
  }

  function endDrawerHandleLoad() {
    __pendingDrawerHandleLoads = Math.max(0, __pendingDrawerHandleLoads - 1);
    notifyDrawerHandleLoadsIdle();
  }

  function awaitDrawerHandleLoads(timeoutMs) {
    const ms = Math.max(200, Number(timeoutMs) || 3500);
    if (__pendingDrawerHandleLoads <= 0) return Promise.resolve();
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      __drawerHandleLoadWaiters.push(() => {
        clearTimeout(t);
        resolve();
      });
    });
  }

  function log(step, data) {
    if (typeof global === 'undefined' || global.DEBUG_HANDLE_ROOM !== true) return;
    try {
      const msg = '[CLD][HANDLE][drawer] ' + String(step || '');
      if (data == null) console.log(msg);
      else console.log(msg, data);
    } catch (_) {}
  }

  function normalizeDrawerProductKind(raw) {
    const rt = global.__cldHandleRuntime;
    if (rt?.normalizeProductKindForPlacementRules) {
      return rt.normalizeProductKindForPlacementRules(raw);
    }
    const pk = String(raw || 'pedestal').toLowerCase().trim();
    if (pk === 'standalone_floor') return 'pedestal';
    return pk || 'pedestal';
  }

  function resolveProductKind(opts) {
    if (opts?.productKind) return normalizeDrawerProductKind(opts.productKind);
    const gen = global.__cldHingeLayout;
    const pk = gen?.placementKindToProductKind?.(opts?.placementKind);
    if (pk) return normalizeDrawerProductKind(pk);
    return 'pedestal';
  }

  /** Превью: геометрия на own_object (BLB); комната — на facadeGroup с _cldBlbContentOffset. */
  function resolveDrawerHandleAttachParent(panel) {
    if (!panel) return panel;
    const own = panel.userData?.own_object;
    if (own && panel.userData.own_object === own && typeof own.add === 'function') {
      return own;
    }
    return panel;
  }

  /** Превью iframe: 1 unit = UNITS_MM (10) мм; комната — 1 unit = 1 мм. */
  function sceneMmPerUnit(opts) {
    if (typeof opts?.toSceneUnits !== 'function') return 1;
    const u = Number(opts.toSceneUnits(10));
    if (!Number.isFinite(u) || u <= 1e-8) return 1;
    return 10 / u;
  }

  /**
   * Превью: mesh в own_object с центром в (0,0,0); runtime отдаёт BLB [0,w] как в комнате.
   * Комната (без previewMode) — без пересчёта.
   */
  function handlePositionForAttachParent(pos, panelSize, attachParent, panel, opts) {
    const toU =
      typeof opts?.toSceneUnits === 'function'
        ? opts.toSceneUnits
        : (v) => v;
    const own = panel?.userData?.own_object;
    if (opts?.previewMode && own && attachParent === own) {
      const w = Number(panelSize.w) || 0;
      const h = Number(panelSize.h) || 0;
      const d = Number(panelSize.d) || 0;
      return {
        x: toU(pos.x) - toU(w) / 2,
        y: toU(pos.y) - toU(h) / 2,
        z: toU(pos.z) - toU(d) / 2,
      };
    }
    return { x: toU(pos.x), y: toU(pos.y), z: toU(pos.z) };
  }

  function mmSizeToSceneUnits(sizeMm, opts) {
    const mmPerU = sceneMmPerUnit(opts);
    if (mmPerU <= 1.001) return sizeMm;
    return {
      x: (Number(sizeMm?.x) || 0) / mmPerU,
      y: (Number(sizeMm?.y) || 0) / mmPerU,
      z: (Number(sizeMm?.z) || 0) / mmPerU,
    };
  }

  function resolveDrawerThicknessMm(size) {
    const w = Number(size?.w) || 0;
    const h = Number(size?.h) || 0;
    const d = Number(size?.d) || 0;
    const vals = [w, h, d].filter((v) => v > 0);
    if (!vals.length) return 16;
    const min = Math.min(...vals);
    if (min <= 40) return min;
    return 16;
  }

  /** Превью: не используется — фасад ящика имеет ту же local-систему, что и дверь (pos.z = d + hd/2). */
  function measureDrawerFrontAtPanel() {
    return null;
  }

  function nodeBuildSpec(o) {
    return (
      o?.userData?.cldBuildItem ||
      (o?.config && typeof o.config === 'object' ? o.config : null) ||
      o?.userData?.params ||
      null
    );
  }

  function elementTypeOfNode(o) {
    const spec = nodeBuildSpec(o)?.spec || {};
    return String(spec.element_type || '').toLowerCase();
  }

  function configTypeOf(o) {
    return String(o?.config?.type || '').toLowerCase();
  }

  function layoutRoleOfNode(n) {
    const item = nodeBuildSpec(n);
    return String(
      item?.layout_role ||
        item?.layoutRole ||
        item?.sectionLayoutRole ||
        n?.userData?.layoutRole ||
        ''
    )
      .trim()
      .toLowerCase();
  }

  function isDescendantOf(root, node) {
    if (!root || !node) return false;
    let p = node;
    while (p) {
      if (p === root) return true;
      p = p.parent;
    }
    return false;
  }

  /** Ящик в комнате: __slide_own, аниматор slide или модуль catalog_33 / layoutRole drawer. */
  function isInsideDrawerContext(o) {
    let n = o;
    while (n) {
      if (n.name === '__own_object' || n.name === '__slide_own' || n.userData?.cldSlide) return true;
      if (n.userData?.cldSlideAnimator) return true;
      if (layoutRoleOfNode(n) === 'drawer') return true;
      if (elementTypeOfNode(n) === 'catalog_33') return true;
      n = n.parent;
    }
    return false;
  }

  function isInsideSlideAssembly(o) {
    return isInsideDrawerContext(o);
  }

  function isDrawerFrontTreeItem(item) {
    if (!item || typeof item !== 'object') return false;
    if (String(item.type || '').toLowerCase() !== 'facade') return false;
    const spec = item.spec && typeof item.spec === 'object' ? item.spec : {};
    if (String(spec.orientation || '').toLowerCase() === 'f') return true;
    const nm = String(item.name || '').toLowerCase();
    return /фасад|facade/.test(nm);
  }

  function isCatalog34DrawerGuides(o) {
    const et = elementTypeOfNode(o);
    if (et !== 'catalog_34') return false;
    const name = String((nodeBuildSpec(o) || {}).name || o?.name || '');
    if (/направляющ/i.test(name)) return true;
    const calc = o?.calculated?.size;
    const w = Number(calc?.x) || 0;
    const d = Number(calc?.z) || 0;
    return w > 80 && d > w * 0.45;
  }

  function isDrawerFrontFacade(o) {
    if (!o) return false;
    if (isCatalog34DrawerGuides(o)) return false;
    const buildItem = o.userData?._cldFacadeBuildItem;
    const isFacadeNode =
      o.userData?.isFacade === true ||
      configTypeOf(o) === 'facade' ||
      isDrawerFrontTreeItem(buildItem) ||
      isDrawerFrontTreeItem(nodeBuildSpec(o));
    if (!isFacadeNode) return false;
    if (!isInsideDrawerContext(o)) return false;
    return true;
  }

  /** Устаревший alias — не путать с направляющими catalog_34. */
  function isDrawerFrontCatalog34(o) {
    return isDrawerFrontFacade(o);
  }

  function collectSlideOwnGroups(rootGroup) {
    const out = [];
    const seen = new Set();
    const add = (o) => {
      if (!o?.userData?.cldSlide || seen.has(o.uuid)) return;
      seen.add(o.uuid);
      out.push(o);
    };

    const iframeSlides = global._cldIframeSlideGroups;
    if (Array.isArray(iframeSlides)) {
      for (const o of iframeSlides) add(o);
    }

    if (rootGroup?.traverse) {
      rootGroup.traverse((o) => {
        if (o?.name === '__slide_own' && o.userData?.cldSlide) {
          add(o);
          return;
        }
        // Превью iframe: cldSlide на own_object аниматора (без обёртки __slide_own).
        if (o.userData?.cldSlide?.axis) add(o);
      });
    }

    const reg = global.ClodisBuilder?._slideGroups;
    if (Array.isArray(reg)) {
      for (const o of reg) {
        if (!o?.userData?.cldSlide) continue;
        if (rootGroup && !isDescendantOf(rootGroup, o)) continue;
        add(o);
      }
    }
    return out;
  }

  function collectDrawerFacadePanelsDirect(rootGroup) {
    const out = [];
    const seen = new Set();
    if (!rootGroup?.traverse) return out;
    rootGroup.traverse((o) => {
      if (!isDrawerFrontFacade(o) || seen.has(o.uuid)) return;
      seen.add(o.uuid);
      out.push(o);
    });
    return out;
  }

  function collectDrawerFrontPanels(rootGroup) {
    const out = [];
    const seen = new Set();
    if (!rootGroup?.traverse) return out;
    rootGroup.traverse((o) => {
      if (!isDrawerFrontCatalog34(o) || seen.has(o.uuid)) return;
      seen.add(o.uuid);
      out.push(o);
    });
    return out;
  }

  function findDrawerFrontPanel(slideOwn) {
    let panel = null;
    slideOwn.traverse((o) => {
      if (panel) return;
      if (configTypeOf(o) === 'facade') panel = o;
    });
    if (panel) return panel;
    slideOwn.traverse((o) => {
      if (panel) return;
      if (o.userData?.isFacade === true) panel = o;
    });
    if (panel) return panel;
    slideOwn.traverse((o) => {
      if (panel) return;
      if (isDrawerFrontFacade(o)) panel = o;
    });
    if (panel) return panel;
    const THREE = global.THREE;
    if (!THREE) return null;
    let bestArea = -1;
    slideOwn.traverse((o) => {
      if (!o.isMesh || o.userData?.isFacadeHandle) return;
      const box = new THREE.Box3().setFromObject(o);
      if (box.isEmpty()) return;
      const sz = box.getSize(new THREE.Vector3());
      const thin = Math.min(sz.x, sz.y, sz.z);
      if (thin > 3) return;
      const area = Math.max(sz.x, sz.y) * Math.min(sz.x, sz.y);
      if (area > bestArea) {
        bestArea = area;
        panel = o.parent || o;
      }
    });
    return panel;
  }

  function panelSizeMm(panel) {
    const os = panel?.userData?.originalSize;
    if (os) {
      const w = Number(os.x);
      const h = Number(os.y);
      const d = Number(os.z);
      if (w > 0 && h > 0) {
        return {
          w,
          h,
          d: resolveDrawerThicknessMm({ w, h, d }),
        };
      }
    }
    const calc = panel?.calculated?.size;
    if (calc) {
      const w = Number(calc.x);
      const h = Number(calc.y);
      const d = Number(calc.z);
      if (w > 0 && h > 0) {
        return {
          w,
          h,
          d: resolveDrawerThicknessMm({ w, h, d }),
        };
      }
    }
    const THREE = global.THREE;
    if (!THREE || !panel) return null;
    panel.updateWorldMatrix?.(true, true);
    const box = new THREE.Box3().setFromObject(panel);
    if (box.isEmpty()) return null;
    const s = box.getSize(new THREE.Vector3());
    const toMm = typeof global.__cldDrawerHandleSceneToMm === 'function'
      ? global.__cldDrawerHandleSceneToMm
      : (v) => v;
    return {
      w: Math.max(1, toMm(s.x)),
      h: Math.max(1, toMm(s.y)),
      d: Math.max(1, toMm(s.z)),
    };
  }

  function bumpDrawerHandleAttachGeneration() {
    __drawerHandleAttachGeneration += 1;
  }

  function isTruthyDrawerNoHandle(v) {
    return v === true || v === 1 || v === '1';
  }

  function isPreviewDrawerNoHandle(opts) {
    if (isTruthyDrawerNoHandle(opts?.drawerNoHandle)) return true;
    if (opts?.previewMode === true && isTruthyDrawerNoHandle(global.__cldPreviewDrawerNoHandle)) {
      return true;
    }
    return false;
  }

  function stripAllDrawerHandlesFromRoot(rootGroup) {
    if (!rootGroup?.traverse) return;
    const toRemove = [];
    rootGroup.traverse((o) => {
      if (!o?.children?.length) return;
      for (const ch of o.children) {
        const nm = String(ch?.name || '');
        if (
          nm === HANDLE_NAME ||
          nm === '__cld_facade_handle' ||
          nm.startsWith('__cld_facade_handle_')
        ) {
          toRemove.push(ch);
        }
      }
    });
    for (const prev of toRemove) {
      prev.parent?.remove(prev);
      disposeHandleGroup(prev);
    }
  }

  function disposeHandleGroup(prev) {
    if (!prev) return;
    prev.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m?.dispose?.());
      }
    });
  }

  function removePreviousHandle(attachParent) {
    if (!attachParent?.children?.length) return;
    const toRemove = [];
    for (const ch of attachParent.children) {
      const nm = String(ch?.name || '');
      if (
        nm === HANDLE_NAME ||
        nm === '__cld_facade_handle' ||
        nm.startsWith('__cld_facade_handle_')
      ) {
        toRemove.push(ch);
      }
    }
    for (const prev of toRemove) {
      attachParent.remove(prev);
      disposeHandleGroup(prev);
    }
  }

  function removeStrayHandlesOnDrawerGuides(rootGroup) {
    if (!rootGroup?.traverse) return;
    rootGroup.traverse((o) => {
      if (!isCatalog34DrawerGuides(o)) return;
      const prev = o.getObjectByName?.(HANDLE_NAME);
      if (!prev) return;
      o.remove(prev);
      disposeHandleGroup(prev);
    });
  }

  function attachResolvedOnPanel(panel, resolved, sel, panelSize, opts, passGen) {
    const rt = global.__cldHandleRuntime;
    const loader = global.__cldRoomCabinetModels;
    const THREE = global.THREE;
    const attachParent = resolveDrawerHandleAttachParent(panel);
    if (!rt || !loader || !THREE || !attachParent || !resolved || resolved.skip) return;
    if (isPreviewDrawerNoHandle(opts)) return;

    const toU =
      typeof opts.toSceneUnits === 'function'
        ? opts.toSceneUnits
        : (v) => v;

    const w = panelSize.w;
    const h = panelSize.h;
    const d = panelSize.d;
    const vertical = !!resolved.vertical;
    const isKnob =
      !!(rt.isKnobHandleSeries && rt.isKnobHandleSeries(resolved.series)) ||
      String(resolved.kind || resolved.series?.kind || '').toLowerCase() === 'knob';
    const handleOffsetMm =
      resolved.positionOffsetMm != null && Number.isFinite(Number(resolved.positionOffsetMm))
        ? Number(resolved.positionOffsetMm)
        : rt.DEFAULT_HANDLE_OFFSET_MM || 30;
    const edgeOffsetMm =
      resolved.positionEdgeOffsetMm != null && Number.isFinite(Number(resolved.positionEdgeOffsetMm))
        ? Number(resolved.positionEdgeOffsetMm)
        : null;
    const cmId = Number(resolved.cabinetModelId) || 0;
    if (!cmId) return;

    removePreviousHandle(attachParent);

    const handleGroup = new THREE.Group();
    handleGroup.name = HANDLE_NAME;
    handleGroup.userData.isFacadeHandle = true;
    handleGroup.userData.isDrawerHandle = true;
    handleGroup.userData.handleSeriesId = sel.seriesId;
    handleGroup.userData.cabinetModelId = cmId;
    handleGroup.userData.handleLayoutRole = 'drawer';
    attachParent.add(handleGroup);

    beginDrawerHandleLoad();
    const loadWithDims = (cmPl) => {
      const pl = cmPl || rt.cabinetModelSizeToHandlePlacement({ x: 14, y: 960, z: 22 }, h);
      const knobScaleMode = !!pl.knob;
      const logicalSizeMm = pl.sizeMm || { x: 14, y: 960, z: 22 };
      const refSizeScene = mmSizeToSceneUnits(logicalSizeMm, opts);
      const spec = { fitToSize: true, roomHandle: true, id: String(cmId) };
      if (resolved.modelPath) spec.modelUrl = resolved.modelPath;

      loader
        .resolveCabinetModel({ spec, sizeMm: refSizeScene })
        .then((root) => {
          if (passGen !== __drawerHandleAttachGeneration || isPreviewDrawerNoHandle(opts)) {
            if (handleGroup.parent) handleGroup.parent.remove(handleGroup);
            disposeHandleGroup(handleGroup);
            endDrawerHandleLoad();
            return;
          }
          if (!root || !handleGroup.parent) {
            if (handleGroup.parent) handleGroup.parent.remove(handleGroup);
            endDrawerHandleLoad();
            return;
          }

          let meshCount = 0;
          root.traverse((o) => {
            if (o.isMesh) meshCount += 1;
          });
          if (meshCount === 0) {
            handleGroup.parent.remove(handleGroup);
            endDrawerHandleLoad();
            return;
          }

          let handleSize = rt.bboxSizeMm(root);
          if (knobScaleMode && rt.scaleKnobToCabinetMm) {
            handleSize = rt.scaleKnobToCabinetMm(root, refSizeScene);
            if (typeof loader.applyStoredCatalogRotation === 'function') {
              loader.applyStoredCatalogRotation(root);
              root.userData._cldCatalogRotApplied = true;
              rt.centerObjectAtOrigin(root);
              handleSize = rt.bboxSizeMm(root);
            }
          } else if (!knobScaleMode && rt.scaleHandleToCatalogMm) {
            const barLen = Math.max(Number(pl.barLengthMm) || Number(logicalSizeMm.y) || 0, 1);
            const ph = Math.max(Number(pl.profileHeightMm) || 14, 1);
            const pd = Math.max(Number(pl.profileDepthMm) || 22, 1);
            handleSize = rt.scaleHandleToCatalogMm(root, barLen, ph, pd);
            if (typeof loader.applyStoredCatalogRotation === 'function') {
              loader.applyStoredCatalogRotation(root);
              root.userData._cldCatalogRotApplied = true;
              rt.centerObjectAtOrigin(root);
              handleSize = rt.bboxSizeMm(root);
            }
          } else if (sceneMmPerUnit(opts) > 1.001) {
            const mmPerU = sceneMmPerUnit(opts);
            root.scale.multiplyScalar(1 / mmPerU);
            root.updateMatrixWorld?.(true);
            rt.centerObjectAtOrigin?.(root);
            handleSize = rt.bboxSizeMm(root);
          }

          if (!vertical && rt.applyRoomHandleOrientationFromVerticalCatalog) {
            handleSize = rt.applyRoomHandleOrientationFromVerticalCatalog(root, false);
          }

          if (sceneMmPerUnit(opts) > 1.001) {
            const mmPerU = sceneMmPerUnit(opts);
            handleSize = {
              x: handleSize.x * mmPerU,
              y: handleSize.y * mmPerU,
              z: handleSize.z * mmPerU,
            };
          }

          const productKind = resolveProductKind(opts);
          const posOpts = {
            facadeWidthMm: w,
            facadeHeightMm: h,
            thicknessMm: d,
            handleOffsetMm,
            edgeOffsetMm,
            handleSizeMm: handleSize,
            doorDirection: 'left',
            vertical,
            productKind,
            positionAnchor: resolved.positionAnchor || null,
          };
          const pos = rt.computeHandlePositionMm
            ? rt.computeHandlePositionMm(posOpts)
            : rt.computeHorizontalBarPositionMm(posOpts, 'top');

          root.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
              o.userData.isFacadeHandle = true;
              o.userData.isDrawerHandle = true;
              o.userData.cldSkipStep5FacadeDecor = true;
            }
          });
          handleGroup.add(root);
          const localPos = handlePositionForAttachParent(
            pos,
            panelSize,
            attachParent,
            panel,
            opts
          );
          handleGroup.position.set(localPos.x, localPos.y, localPos.z);
          if (!vertical && pos.rotationZ) handleGroup.rotation.z = pos.rotationZ;

          log('drawer attached', {
            panel: panel.name,
            attachParent: attachParent.name,
            seriesId: sel.seriesId,
            cabinetModelId: cmId,
            size: { w, h, d },
            pos,
            productKind,
            vertical,
            positionAnchor: resolved.positionAnchor || null,
          });
          endDrawerHandleLoad();
        })
        .catch((e) => {
          log('drawer load error', { error: String(e?.message || e) });
          if (handleGroup.parent) handleGroup.parent.remove(handleGroup);
          endDrawerHandleLoad();
        });
    };

    const warm = rt.resolveHandleCabinetModelDims
      ? rt.resolveHandleCabinetModelDims(cmId, h)
      : Promise.resolve(null);
    warm
      .then(loadWithDims)
      .catch(() => {
        try {
          loadWithDims(null);
        } catch (_) {
          endDrawerHandleLoad();
        }
      });
  }

  /** Превью админки: серия из room_steps_config (шаг 6), не из localStorage комнаты. */
  async function resolvePreviewHandleSelection(rt) {
    try {
      const r = await fetch('/api/room_steps_config', { cache: 'no-store' });
      if (r.ok) {
        const cfg = await r.json();
        const step6 = Array.isArray(cfg?.steps)
          ? cfg.steps.find((s) => Number(s.stepId) === 6)
          : null;
        const defId = step6?.handleDefaults?.seriesId || step6?.defaultHandleSeriesId;
        if (defId) {
          const hd = step6?.handleDefaults || {};
          return {
            seriesId: String(defId),
            finishId: hd.finishId || null,
            modelId: hd.modelId != null ? String(hd.modelId).trim() : null,
            handleItemId: Number(hd.handleItemId) > 0 ? Number(hd.handleItemId) : null,
            roleSlots: {},
          };
        }
      }
    } catch (_) {}
    log('preview series fallback', { reason: 'no_step6_defaults_from_api' });
    return rt.readSelection?.() || { seriesId: '', finishId: null, modelId: null, handleItemId: null, roleSlots: {} };
  }

  function normalizeDrawerCatalogId(raw) {
    const id = String(raw ?? '').trim();
    return id && id !== '0' ? id : '';
  }

  /** Без ручки — только карточка catalog_33 с drawerNoHandle в админке (Основные). */
  function resolveDrawerCatalogIdFromPanel(panel) {
    let n = panel;
    while (n) {
      const udId = normalizeDrawerCatalogId(n.userData?.cldDrawerCatalogId);
      if (udId) return udId;
      const item = nodeBuildSpec(n);
      const et = String(item?.spec?.element_type || '').toLowerCase();
      if (et === 'catalog_33') {
        const cid = normalizeDrawerCatalogId(item?.spec?.id ?? item?.spec?.linked_item_id);
        if (cid) return cid;
      }
      n = n.parent;
    }
    return '';
  }

  function isDrawerNoHandleFromModuleSpec(panel) {
    let n = panel;
    while (n) {
      if (n.userData?.cldDrawerNoHandle === true) return true;
      const item = nodeBuildSpec(n);
      const et = String(item?.spec?.element_type || '').toLowerCase();
      if (et === 'catalog_33') {
        const nh = item?.spec?.drawer_no_handle ?? item?.spec?.drawerNoHandle;
        if (nh === 1 || nh === true || nh === '1') return true;
        const cid = normalizeDrawerCatalogId(item?.spec?.id);
        const linkedId = normalizeDrawerCatalogId(item?.spec?.linked_item_id);
        if (cid && readDrawerNoHandleByCatalogId(cid)) return true;
        if (linkedId && readDrawerNoHandleByCatalogId(linkedId)) return true;
      }
      n = n.parent;
    }
    return false;
  }

  function readDrawerNoHandleByCatalogId(catalogId) {
    if (typeof global.__cldReadDrawerNoHandleByCatalogId === 'function') {
      return !!global.__cldReadDrawerNoHandleByCatalogId(catalogId);
    }
    const id = String(catalogId || '').trim();
    if (!id) return false;
    const readHit = (hit) => {
      if (!hit || typeof hit !== 'object') return false;
      const d = hit.data && typeof hit.data === 'object' ? hit.data : hit;
      const p = hit.params && typeof hit.params === 'object' ? hit.params : {};
      const vals = [d?.drawerNoHandle, p?.drawerNoHandle, hit.drawerNoHandle];
      return vals.some((v) => v === true || v === 1 || v === '1');
    };
    try {
      const maps = [];
      try {
        if (global.parent && global.parent !== global && global.parent.__CLD_CATALOGS_DATA) {
          maps.push(global.parent.__CLD_CATALOGS_DATA?.catalog_33?.items);
        }
      } catch (_) {}
      maps.push(global.__CLD_CATALOGS_DATA?.catalog_33?.items);
      for (const map of maps) {
        if (map && typeof map === 'object' && readHit(map[id])) return true;
      }
    } catch (_) {}
    try {
      const raw = global.localStorage?.getItem('catalog_33');
      const arr = raw ? JSON.parse(raw) : [];
      const hit = Array.isArray(arr) ? arr.find((it) => String(it?.id ?? '').trim() === id) : null;
      if (readHit(hit)) return true;
    } catch (_) {}
    return false;
  }

  function shouldSkipDrawerHandleAttach(panel, opts) {
    if (isPreviewDrawerNoHandle(opts)) return true;
    if (panel?.userData?.cldDrawerNoHandle === true) return true;
    if (isDrawerNoHandleFromModuleSpec(panel)) return true;
    const catalogId = normalizeDrawerCatalogId(resolveDrawerCatalogIdFromPanel(panel));
    if (catalogId && readDrawerNoHandleByCatalogId(catalogId)) return true;
    let n = panel;
    while (n) {
      const item = nodeBuildSpec(n);
      const linkedId = normalizeDrawerCatalogId(item?.spec?.linked_item_id);
      if (linkedId && readDrawerNoHandleByCatalogId(linkedId)) return true;
      n = n.parent;
    }
    return false;
  }

  function drawerAssemblyKey(panel) {
    let n = panel;
    while (n) {
      const item = nodeBuildSpec(n);
      const et = String(item?.spec?.element_type || '').toLowerCase();
      const lr = String(item?.layout_role || item?.sectionLayoutRole || n.userData?.layoutRole || '')
        .trim()
        .toLowerCase();
      if (lr === 'drawer' || et === 'catalog_33') return n.uuid;
      n = n.parent;
    }
    return panel?.uuid || '';
  }

  function panelPickScore(panel) {
    if (configTypeOf(panel) === 'facade') return 55;
    if (panel?.userData?.isFacade === true) return 50;
    if (isDrawerFrontFacade(panel)) return 40;
    if (isCatalog34DrawerGuides(panel)) return 0;
    if (elementTypeOfNode(panel) === 'catalog_34') return 5;
    if (panel?.config?.spec || panel?.userData?.cldBuildItem?.spec) return 10;
    return 0;
  }

  function collectDrawerFrontPanelsForAttach(rootGroup) {
    const slides = collectSlideOwnGroups(rootGroup);
    const byAssembly = new Map();

    const add = (panel) => {
      if (!panel) return;
      const key = drawerAssemblyKey(panel);
      if (!key) return;
      const prev = byAssembly.get(key);
      if (!prev || panelPickScore(panel) > panelPickScore(prev)) {
        byAssembly.set(key, panel);
      }
    };

    for (const slideOwn of slides) {
      add(findDrawerFrontPanel(slideOwn));
    }
    for (const panel of collectDrawerFrontPanels(rootGroup)) {
      add(panel);
    }
    for (const panel of collectDrawerFacadePanelsDirect(rootGroup)) {
      add(panel);
    }

    return [...byAssembly.values()];
  }

  function attachDrawerHandlesPass(rootGroup, opts, sel) {
    const rt = global.__cldHandleRuntime;
    if (!rt || !rootGroup || !sel?.seriesId) {
      return { slides: 0, attached: 0, panels: 0 };
    }

    const productKind = resolveProductKind(opts);
    const passGen = __drawerHandleAttachGeneration;
    if (isPreviewDrawerNoHandle(opts)) {
      stripAllDrawerHandlesFromRoot(rootGroup);
      removeStrayHandlesOnDrawerGuides(rootGroup);
      log('preview drawerNoHandle — strip all', { passGen });
      return { slides: 0, attached: 0, panels: 0 };
    }
    removeStrayHandlesOnDrawerGuides(rootGroup);
    const panels = collectDrawerFrontPanelsForAttach(rootGroup);
    let attached = 0;

    log('pass start', {
      seriesId: sel.seriesId,
      productKind,
      slides: collectSlideOwnGroups(rootGroup).length,
      panels: panels.length,
    });

    if (!panels.length) {
      log('no panels', {
        slides: collectSlideOwnGroups(rootGroup).length,
        rootName: rootGroup.name || '',
      });
    }

    for (const panel of panels) {
      if (shouldSkipDrawerHandleAttach(panel, opts)) {
        removePreviousHandle(resolveDrawerHandleAttachParent(panel));
        log('skip interior drawer', { panel: panel.name, productKind });
        continue;
      }

      const size = panelSizeMm(panel);
      if (!size) continue;

      const resolved = rt.resolveForFacade(sel.seriesId, {
        layoutRole: 'drawer',
        productKind,
        doorKind: 'slide',
        facadeWidthMm: size.w,
        facadeHeightMm: size.h,
      });
      if (!resolved || resolved.skip) {
        log('resolve skip', { reason: resolved?.reason, panel: panel.name });
        continue;
      }

      attachResolvedOnPanel(panel, resolved, sel, size, opts, passGen);
      attached += 1;
    }

    log('pass done', {
      slides: collectSlideOwnGroups(rootGroup).length,
      panels: panels.length,
      attached,
      seriesId: sel.seriesId,
      productKind,
    });
    return { slides: collectSlideOwnGroups(rootGroup).length, panels: panels.length, attached };
  }

  function stripDrawerNoHandleFromRoot(rootGroup, opts) {
    if (!rootGroup) return 0;
    const panels = collectDrawerFrontPanelsForAttach(rootGroup);
    let stripped = 0;
    for (const panel of panels) {
      if (!shouldSkipDrawerHandleAttach(panel, opts)) continue;
      removePreviousHandle(resolveDrawerHandleAttachParent(panel));
      stripped += 1;
    }
    if (stripped > 0) {
      log('strip drawerNoHandle panels', { stripped });
    }
    return stripped;
  }

  async function attachDrawerHandlesToRoot(rootGroup, opts = {}) {
    const rt = global.__cldHandleRuntime;
    if (!rt || !rootGroup) return { slides: 0, attached: 0, panels: 0 };

    bumpDrawerHandleAttachGeneration();
    const previewMode = opts.previewMode === true;
    if (previewMode && isPreviewDrawerNoHandle(opts)) {
      stripAllDrawerHandlesFromRoot(rootGroup);
      removeStrayHandlesOnDrawerGuides(rootGroup);
      log('attach aborted — preview drawerNoHandle', {});
      return { slides: 0, attached: 0, panels: 0 };
    }
    if (!previewMode && !opts.force) {
      if (rt.shouldAttachHandlesInRoom && !rt.shouldAttachHandlesInRoom()) {
        log('skip', { reason: 'room_step_before_6' });
        return { slides: 0, attached: 0, panels: 0 };
      }
    }

    if (rt.loadHandlesCatalog) await rt.loadHandlesCatalog().catch(() => {});

    if (
      !previewMode &&
      typeof global.__cldEnsureDrawerCatalog33FreshFromApi === 'function'
    ) {
      await global.__cldEnsureDrawerCatalog33FreshFromApi().catch(() => {});
    }

    let sel = rt.readSelection?.() || {};
    if (previewMode) {
      sel = await resolvePreviewHandleSelection(rt);
    }
    if (!sel.seriesId) {
      log('skip', { reason: 'no_series_selection' });
      return { slides: 0, attached: 0, panels: 0 };
    }

    log('attach start', {
      previewMode,
      force: !!opts.force,
      step: Number(global.currentRoomStep) || 0,
      seriesId: sel.seriesId,
    });

    const result = attachDrawerHandlesPass(rootGroup, opts, sel);
    stripDrawerNoHandleFromRoot(rootGroup, opts);
    if (result.attached > 0 && global.__cldAwaitDrawerHandleLoads) {
      await global.__cldAwaitDrawerHandleLoads(8000);
      log('loads idle', { attached: result.attached, panels: result.panels });
    }
    return result;
  }

  function diagnoseDrawerHandles(rootGroup) {
    const slides = collectSlideOwnGroups(rootGroup);
    const panels = collectDrawerFrontPanelsForAttach(rootGroup);
    const out = {
      slides: slides.length,
      panels: panels.length,
      panelNames: panels.map((p) => p.name),
      registrySlides: Array.isArray(global.ClodisBuilder?._slideGroups)
        ? global.ClodisBuilder._slideGroups.length
        : 0,
    };
    log('diagnose', out);
    return out;
  }

  global.__cldAttachDrawerHandlesToRoot = attachDrawerHandlesToRoot;
  global.__cldAwaitDrawerHandleLoads = awaitDrawerHandleLoads;
  global.__cldDiagnoseDrawerHandles = diagnoseDrawerHandles;
  global.__cldStripDrawerHandlesFromRoot = stripAllDrawerHandlesFromRoot;
  global.__cldStripDrawerNoHandleFromRoot = stripDrawerNoHandleFromRoot;
  global.__cldBumpDrawerHandleAttachGeneration = bumpDrawerHandleAttachGeneration;
})(typeof window !== 'undefined' ? window : global);
