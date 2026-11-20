/**
 * Загрузка type:model (cabinet_model) в комнате — тот же каталог и GLB, что в constructor-clodis.
 * Требует window.THREE и window.GLTFLoader (подключается из index.html).
 */
(function (global) {
  'use strict';

  function getThree() {
    return global.THREE || null;
  }
  function getGLTFLoader() {
    return global.GLTFLoader || (global.THREE && global.THREE.GLTFLoader) || null;
  }
  function getFBXLoader() {
    return global.FBXLoader || (global.THREE && global.THREE.FBXLoader) || null;
  }

  let __libCache = null;
  let __libPromise = null;
  const __assetPromises = new Map();

  function resolveAssetUrl(path) {
    const s = String(path || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    try {
      const u = new URL(s.startsWith('/') ? s : `/${s}`, global.location.origin);
      // Иначе браузер кеширует старый GLB при смене только ?v= у JS.
      const bust =
        (typeof global.__CLD_BUILD === 'string' && global.__CLD_BUILD) ||
        (typeof global.location?.search === 'string' &&
          new URLSearchParams(global.location.search).get('v')) ||
        '';
      if (bust && !u.searchParams.has('v')) u.searchParams.set('v', bust);
      return u.href;
    } catch (_) {
      return s;
    }
  }

  function shallowMergeParams(base, overlay) {
    const out = { ...(base && typeof base === 'object' ? base : {}) };
    if (overlay && typeof overlay === 'object') {
      Object.keys(overlay).forEach((k) => {
        out[k] = overlay[k];
      });
    }
    return out;
  }

  function mergeModelVariantParams(base, overlay) {
    if (!overlay || typeof overlay !== 'object') return base;
    if (!base || typeof base !== 'object') return overlay;
    const out = { ...base, ...overlay };
    if (base.params || overlay.params) {
      out.params = { ...(base.params || {}), ...(overlay.params || {}) };
      const bsf = base.params?.slot_fit;
      const osf = overlay.params?.slot_fit;
      if (osf && !slotFitHasRules(readSlotFit(bsf))) {
        out.params.slot_fit = osf;
      }
      const bc = base.params?.companions;
      const oc = overlay.params?.companions;
      if (oc && typeof oc === 'object') {
        out.params.companions = { ...(bc && typeof bc === 'object' ? bc : {}), ...oc };
      }
    }
    return out;
  }

  function mergeCabinetModelLibraryEntry(baseEntry, overlayEntry) {
    if (!overlayEntry?.params || typeof overlayEntry.params !== 'object') return baseEntry;
    if (!baseEntry?.params || typeof baseEntry.params !== 'object') return overlayEntry;
    const baseParams = baseEntry.params;
    const overlayParams = overlayEntry.params;
    const merged = { params: { ...baseParams, ...overlayParams } };
    const overlayModels = Array.isArray(overlayParams.models) ? overlayParams.models : null;
    if (overlayModels && overlayModels.length) {
      const baseModels = Array.isArray(baseParams.models) ? baseParams.models : [];
      merged.params.models = overlayModels.map((om, i) => mergeModelVariantParams(baseModels[i], om));
      if (baseModels.length > overlayModels.length) {
        merged.params.models.push(...baseModels.slice(overlayModels.length));
      }
    }
    return merged;
  }

  function ingestCabinetModelItemsIntoMap(map, items, mergeExisting) {
    if (!map || !Array.isArray(items)) return;
    for (const it of items) {
      const id = String(it?.id ?? '').trim();
      if (!id) continue;
      let params = it.params;
      if (!params && it.data != null) {
        try {
          const d = typeof it.data === 'string' ? JSON.parse(it.data) : it.data;
          params = d?.params || d;
        } catch (_) {
          params = {};
        }
      }
      const modelsArr = Array.isArray(params?.models) ? params.models : [];
      const m0 = modelsArr[0] || null;
      const next = {
        params: params && typeof params === 'object' ? params : {},
        name: String(it.name || m0?.name || ''),
        category: String(it.category || ''),
        width: Number(it.width) || 0,
        height: Number(it.height) || 0,
        depth: Number(it.depth) || 0,
        price: Number(m0?.price) || 0,
        count: Math.max(1, Number(m0?.count) || 1),
        price_type: String(m0?.price_type || params?.price_type || 'p'),
        show_in_spec: Number(params?.show_in_spec ?? it.spec ?? 0) ? 1 : 0,
      };
      if (mergeExisting && map[id]) {
        const merged = mergeCabinetModelLibraryEntry(map[id], next);
        merged.name = next.name || map[id].name;
        merged.category = next.category || map[id].category;
        merged.width = next.width || map[id].width;
        merged.height = next.height || map[id].height;
        merged.depth = next.depth || map[id].depth;
        merged.price = next.price;
        merged.count = next.count;
        merged.price_type = next.price_type;
        merged.show_in_spec = next.show_in_spec;
        map[id] = merged;
      } else {
        map[id] = next;
      }
    }
  }

  function cabinetModelEntryHasUrl(map, id) {
    const models = map?.[id]?.params?.models;
    if (!Array.isArray(models) || !models.length) return false;
    return models.some((m) => String(m?.model || '').trim());
  }

  function ensureCabinetModelLibraryMap() {
    if (__libCache) return Promise.resolve(__libCache);
    if (__libPromise) return __libPromise;
    __libPromise = fetch('/api/catalog/items_get/cabinet_model', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(async (payload) => {
        const map = Object.create(null);
        // API может вернуть {items:[]} или плоский массив (локальный json-файл)
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        ingestCabinetModelItemsIntoMap(map, items);
        try {
          const r = await fetch('/catalog_items/cabinet_model.json', { cache: 'no-store' });
          if (r.ok) {
            const local = await r.json();
            const localItems = Array.isArray(local)
              ? local
              : Array.isArray(local?.items)
                ? local.items
                : [];
            ingestCabinetModelItemsIntoMap(map, localItems, true);
          }
        } catch (_) {}
        __libCache = map;
        __libPromise = null;
        return map;
      })
      .catch(() => {
        __libPromise = null;
        __libCache = Object.create(null);
        return __libCache;
      });
    return __libPromise;
  }

  function hideHingeCatalogPlaceholder(placeholderMesh, parentGroup) {
    if (!placeholderMesh) return;
    let p = parentGroup;
    for (let i = 0; i < 32 && p; i++) {
      if (p.userData?.isCatalogHingeModule || p.userData?.cldHingeCatalogModel) {
        placeholderMesh.visible = false;
        return;
      }
      p = p.parent;
    }
  }

  function pickCabinetModelVariant(spec, sizeMm) {
    const models = spec?.models;
    if (!Array.isArray(models) || !models.length) return null;
    const hx = Number(sizeMm?.x) || 0;
    const hy = Number(sizeMm?.y) || 0;
    const hz = Number(sizeMm?.z) || 0;
    const okLo = (m, v) => !Number.isFinite(m) || m === 0 || m <= -1e8 || v >= m;
    const okHi = (m, v) => !Number.isFinite(m) || m === 0 || m >= 1e8 || v <= m;
    for (const j of models) {
      if (!j || typeof j !== 'object') continue;
      if (
        okLo(Number(j.min_x), hx) &&
        okHi(Number(j.max_x), hx) &&
        okLo(Number(j.min_y), hy) &&
        okHi(Number(j.max_y), hy) &&
        okLo(Number(j.min_z), hz) &&
        okHi(Number(j.max_z), hz)
      ) {
        return j;
      }
    }
    return models[0];
  }

  /** FBX often embeds absolute Windows paths (D:\\texture\\Wood_oak02.jpg) → 404 storm. */
  function makeCabinetAssetLoadingManager(assetUrl) {
    const THREE = getThree();
    if (!THREE?.LoadingManager) return undefined;
    const manager = new THREE.LoadingManager();
    let baseHref = '';
    try {
      const u = new URL(assetUrl, global.location?.origin || 'http://localhost');
      baseHref = u.href.replace(/[^/]+$/, '');
    } catch (_) {
      baseHref = '';
    }
    manager.setURLModifier((raw) => {
      const s = String(raw || '');
      const norm = s.replace(/\\/g, '/');
      const file = (norm.split('/').pop() || '').split('?')[0];
      const isAbsWin = /^[a-zA-Z]:\//.test(norm) || /^file:/i.test(norm);
      const isBareTex = !!file && /\.(jpe?g|png|webp|gif)$/i.test(file) && !/^https?:\/\//i.test(s);
      if ((isAbsWin || isBareTex) && file) {
        try {
          if (baseHref) return new URL(file, baseHref).href;
          return new URL(`/models/${file}`, global.location.origin).href;
        } catch (_) {
          return `/models/${file}`;
        }
      }
      return s;
    });
    manager.onError = (errUrl) => {
      console.warn('[CLD][room-model] texture skip:', errUrl);
    };
    return manager;
  }

  function loadAssetRootOnce(url) {
    if (!url) return Promise.resolve(null);
    if (__assetPromises.has(url)) return __assetPromises.get(url);
    const lower = url.toLowerCase();
    const manager = makeCabinetAssetLoadingManager(url);
    let p;
    if (lower.endsWith('.fbx') || lower.includes('.fbx?')) {
      const FBXLoader = getFBXLoader();
      if (!FBXLoader) {
        console.warn('[CLD][room-model] FBXLoader не загружен:', url);
        return Promise.resolve(null);
      }
      p = new Promise((resolve) => {
        const loader = manager ? new FBXLoader(manager) : new FBXLoader();
        loader.load(url, resolve, undefined, () => resolve(null));
      });
    } else {
      const GLTFLoader = getGLTFLoader();
      if (!GLTFLoader) {
        console.warn('[CLD][room-model] GLTFLoader не загружен:', url);
        return Promise.resolve(null);
      }
      p = new Promise((resolve) => {
        const loader = manager ? new GLTFLoader(manager) : new GLTFLoader();
        loader.load(
          url,
          (gltf) => {
            const scene = gltf?.scene || null;
            if (scene) {
              scene.userData = scene.userData || {};
              scene.userData.__cldGltfAsset = gltf.asset || null;
            }
            resolve(scene);
          },
          undefined,
          () => resolve(null)
        );
      });
    }
    __assetPromises.set(url, p);
    return p;
  }

  function clearAssetRootCache() {
    __assetPromises.clear();
  }

  function readPositiveRefMm(v) {
    if (!v || typeof v !== 'object') return null;
    const x = Number(v.x);
    const y = Number(v.y);
    const z = Number(v.z);
    if (Number.isFinite(x) && x > 0 && Number.isFinite(y) && y > 0 && Number.isFinite(z) && z > 0) {
      return { x, y, z };
    }
    return null;
  }

  function meshUnionBox3(root) {
    const THREE = getThree();
    if (!THREE || !root) return null;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    let has = false;
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const geo = o.geometry;
      if (!geo.boundingBox) geo.computeBoundingBox();
      if (!geo.boundingBox || geo.boundingBox.isEmpty()) return;
      const wb = geo.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (!has) {
        box.copy(wb);
        has = true;
      } else {
        box.union(wb);
      }
    });
    return has && !box.isEmpty() ? box : null;
  }

  /** FBX volna: у Mesh2 «хвост» по одной оси (~1e5) — fit по перцентилям вершин, не geometry.boundingBox. */
  function geometryBoxFromVertices(geometry, loPct, hiPct) {
    const THREE = getThree();
    if (!geometry?.attributes?.position || !THREE) return null;
    const pos = geometry.attributes.position;
    const xs = [];
    const ys = [];
    const zs = [];
    for (let i = 0; i < pos.count; i++) {
      xs.push(pos.getX(i));
      ys.push(pos.getY(i));
      zs.push(pos.getZ(i));
    }
    if (!xs.length) return null;
    xs.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    zs.sort((a, b) => a - b);
    const lo = Number.isFinite(loPct) ? loPct : 0.02;
    const hi = Number.isFinite(hiPct) ? hiPct : 0.98;
    const pick = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * p)))];
    const min = new THREE.Vector3(pick(xs, lo), pick(ys, lo), pick(zs, lo));
    const max = new THREE.Vector3(pick(xs, hi), pick(ys, hi), pick(zs, hi));
    return new THREE.Box3(min, max);
  }

  function meshWorldBox3Sanitized(mesh) {
    const THREE = getThree();
    if (!mesh?.isMesh || !mesh.geometry || !THREE) return null;
    const geo = mesh.geometry;
    let localBox = geometryBoxFromVertices(geo, 0.02, 0.98);
    if (!localBox || localBox.isEmpty()) {
      if (!geo.boundingBox) geo.computeBoundingBox();
      if (!geo.boundingBox || geo.boundingBox.isEmpty()) return null;
      localBox = geo.boundingBox.clone();
      const s = localBox.getSize(new THREE.Vector3());
      const sorted = [s.x, s.y, s.z].sort((a, b) => a - b);
      if (sorted[2] > 40 * sorted[1] && sorted[1] > 1e-6) {
        const cap = sorted[1];
        const c = localBox.getCenter(new THREE.Vector3());
        let sx = s.x;
        let sy = s.y;
        let sz = s.z;
        if (sx >= sorted[2] * 0.999) sx = cap;
        if (sy >= sorted[2] * 0.999) sy = cap;
        if (sz >= sorted[2] * 0.999) sz = cap;
        localBox.setFromCenterAndSize(c, new THREE.Vector3(sx, sy, sz));
      }
    }
    return localBox.applyMatrix4(mesh.matrixWorld);
  }

  function robustMeshUnionBox3(root) {
    const THREE = getThree();
    if (!THREE || !root) return null;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    let has = false;
    root.traverse((o) => {
      if (!o.isMesh) return;
      const wb = meshWorldBox3Sanitized(o);
      if (!wb || wb.isEmpty()) return;
      if (!has) {
        box.copy(wb);
        has = true;
      } else {
        box.union(wb);
      }
    });
    return has && !box.isEmpty() ? box : null;
  }

  function vertexAxisSpan(geometry, axis, loPct, hiPct) {
    const pos = geometry?.attributes?.position;
    if (!pos || pos.count < 1) return 0;
    const arr = [];
    for (let i = 0; i < pos.count; i++) {
      if (axis === 'x') arr.push(pos.getX(i));
      else if (axis === 'y') arr.push(pos.getY(i));
      else arr.push(pos.getZ(i));
    }
    arr.sort((a, b) => a - b);
    const lo = Number.isFinite(loPct) ? loPct : 0.02;
    const hi = Number.isFinite(hiPct) ? hiPct : 0.98;
    const pick = (p) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * p)))];
    return Math.max(0, pick(hi) - pick(lo));
  }

  function pickHandleBarMesh(root) {
    let best = null;
    let bestLen = 0;
    root?.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const sy = vertexAxisSpan(o.geometry, 'y');
      const sz = vertexAxisSpan(o.geometry, 'z');
      const sx = vertexAxisSpan(o.geometry, 'x');
      const sane = [sx, sy, sz].filter((v) => v > 0 && v < 50000);
      const L = sane.length ? Math.max(...sane) : 0;
      if (L > bestLen) {
        bestLen = L;
        best = o;
      }
    });
    return best;
  }

  /** volna Mesh2: control points по X — схлопываем к медиане сечения. */
  function trimVolnaBarOutlierVertices(mesh) {
    const pos = mesh?.geometry?.attributes?.position;
    if (!pos || pos.count < 8) return;
    const ys = [];
    const zs = [];
    for (let i = 0; i < pos.count; i++) {
      ys.push(pos.getY(i));
      zs.push(pos.getZ(i));
    }
    ys.sort((a, b) => a - b);
    zs.sort((a, b) => a - b);
    const pick = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * p)))];
    const yLo = pick(ys, 0.35);
    const yHi = pick(ys, 0.65);
    const zLo = pick(zs, 0.05);
    const zHi = pick(zs, 0.95);
    const xsCore = [];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (y >= yLo && y <= yHi && z >= zLo && z <= zHi) xsCore.push(pos.getX(i));
    }
    if (!xsCore.length) return;
    xsCore.sort((a, b) => a - b);
    const xMed = pick(xsCore, 0.5);
    const xClip = 8000;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getX(i) - xMed) > xClip) pos.setX(i, xMed);
    }
    pos.needsUpdate = true;
    mesh.geometry.boundingBox = null;
    mesh.geometry.boundingSphere = null;
  }

  /**
   * volna (id=3): fit к sizeMm из cabinet_model + rotateX(-90) для вертикали на фасаде.
   */
  function scaleHandleVolnaToPrepMm(root, prepSizeMm) {
    const tx = Math.max(Number(prepSizeMm?.x) || 0, 1e-6);
    const ty = Math.max(Number(prepSizeMm?.y) || 0, 1e-6);
    const tz = Math.max(Number(prepSizeMm?.z) || 0, 1e-6);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);

    const bar = pickHandleBarMesh(root);
    if (!bar?.geometry) {
      scaleHandleCabinetCardMm(root, prepSizeMm);
      return;
    }

    trimVolnaBarOutlierVertices(bar);

    const ySpan = Math.max(vertexAxisSpan(bar.geometry, 'y', 0.35, 0.65), 1e-6);
    const zSpan = Math.max(vertexAxisSpan(bar.geometry, 'z'), 1e-6);

    bar.scale.x *= tz / ySpan;
    bar.scale.y *= ty / ySpan;
    bar.scale.z *= tx / zSpan;
    root.updateMatrixWorld(true);
    centerOnlyKeepScale(root);
    root.rotation.x = -Math.PI / 2;
    root.updateMatrixWorld(true);
  }

  function inferFileToMmScaleFromMeshes(root, spec) {
    const sp = spec && typeof spec === 'object' ? spec : {};
    const raw =
      sp.import_linear_unit ??
      sp.importLinearUnit ??
      sp.linear_unit ??
      sp.asset_linear_unit;
    const u = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (u === 'mm' || u === 'millimeter' || u === 'millimeters') return 1;
    if (u === 'm' || u === 'meter' || u === 'meters' || u === 'metre') return 1000;
    if (u === 'cm' || u === 'centimeter' || u === 'centimeters') return 10;
    if (u === 'scene' || u === 'native' || u === 'unit' || u === 'units') return 1;
    const box = meshUnionBox3(root);
    if (!box) return inferFileToMmScale(root, spec);
    const size = box.getSize(new THREE.Vector3());
    const M = Math.max(size.x, size.y, size.z);
    if (M <= 3.5) return 1000;
    return 1;
  }

  function inferFileToMmScale(root, spec) {
    const THREE = getThree();
    const sp = spec && typeof spec === 'object' ? spec : {};
    const raw =
      sp.import_linear_unit ??
      sp.importLinearUnit ??
      sp.linear_unit ??
      sp.asset_linear_unit;
    const u = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (u === 'mm' || u === 'millimeter' || u === 'millimeters') return 1;
    if (u === 'm' || u === 'meter' || u === 'meters' || u === 'metre') return 1000;
    if (u === 'cm' || u === 'centimeter' || u === 'centimeters') return 10;
    if (u === 'scene' || u === 'native' || u === 'unit' || u === 'units') return 1;
    if (!THREE) return 1;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return 1;
    const size = box.getSize(new THREE.Vector3());
    const M = Math.max(size.x, size.y, size.z);
    if (M <= 3.5) return 1000;
    return 1;
  }

  function scaleAndCenterToRefMm(root, refSizeMm) {
    const THREE = getThree();
    if (!root || !refSizeMm || !THREE) return;
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const sx = Math.max(size.x, 1e-8);
    const sy = Math.max(size.y, 1e-8);
    const sz = Math.max(size.z, 1e-8);
    const rx = Math.max(Number(refSizeMm.x) || 0, 1e-6);
    const ry = Math.max(Number(refSizeMm.y) || 0, 1e-6);
    const rz = Math.max(Number(refSizeMm.z) || 0, 1e-6);
    const s = Math.min(rx / sx, ry / sy, rz / sz);
    if (!Number.isFinite(s) || s <= 0) return;
    root.scale.multiplyScalar(s);
    root.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(root);
    if (box2.isEmpty()) return;
    const c = box2.getCenter(new THREE.Vector3());
    root.position.set(-c.x, -c.y, -c.z);
  }

  /** Реф Handle/gola: длина и сечение независимо → неравномерный scale в слот Size. */
  function scaleNonUniformToSizeMm(root, sizeMm) {
    const THREE = getThree();
    if (!root || !sizeMm || !THREE) return;
    root.position.set(0, 0, 0);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const sx = Math.max(size.x, 1e-8);
    const sy = Math.max(size.y, 1e-8);
    const sz = Math.max(size.z, 1e-8);
    const tx = Math.max(Number(sizeMm.x) || 0, 1e-6);
    const ty = Math.max(Number(sizeMm.y) || 0, 1e-6);
    const tz = Math.max(Number(sizeMm.z) || 0, 1e-6);
    root.scale.multiply(new THREE.Vector3(tx / sx, ty / sy, tz / sz));
    root.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(root);
    if (box2.isEmpty()) return;
    const c = box2.getCenter(new THREE.Vector3());
    root.position.set(-c.x, -c.y, -c.z);
  }

  function wantsNonUniformSlotFit(mergedSpec, sizeMm) {
    if (!mergedSpec || !sizeMm) return false;
    if (
      mergedSpec.stretchToSize === true ||
      mergedSpec.stretch_to_size === 1 ||
      mergedSpec.nonUniformFit === true ||
      mergedSpec.non_uniform_fit === 1
    ) {
      return true;
    }
    const label = `${mergedSpec.name || ''} ${mergedSpec.key || ''} ${mergedSpec.type || ''}`;
    if (/gola|профиль|profile|facade_profile|overhead_profile/i.test(label)) return true;
    const tx = Number(sizeMm.x) || 0;
    const ty = Number(sizeMm.y) || 0;
    const tz = Number(sizeMm.z) || 0;
    // Длинный слот (пог. профиль): одна ось ≥150, две другие ≤120.
    const dims = [tx, ty, tz].filter((n) => n > 0).sort((a, b) => b - a);
    return dims.length === 3 && dims[0] >= 150 && dims[1] <= 120 && dims[2] <= 120;
  }

  function centerOnlyKeepScale(root) {
    const THREE = getThree();
    if (!root || !THREE) return;
    root.position.set(0, 0, 0);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3());
    root.position.set(-c.x, -c.y, -c.z);
  }

  /**
   * Одежда+плечик на штанге: масштаб по ширине/высоте (Z не жмём — иначе min(x,y,z) давит вдвое).
   * Pivot Y = верх крючка (меш hanger*).
   * Pack-сплит иногда кладёт вещь РЯДОМ с плечиком (не на нём) — выравниваем перед посадкой.
   * Полоса сцены (rodHangStrip): без сжатия под ширину штанги — только pivot; обрезка снаружи.
   */
  function scaleAndHangFromTopMm(root, refSizeMm) {
    const THREE = getThree();
    if (!root || !refSizeMm || !THREE) return;
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);
    // Полоса: файл может быть в метрах (collection) или уже в мм (wardrobe-5).
    // prepareCabinetModelRoot уже ставит inferFileToMm; здесь только страховка.
    const isStrip = root.userData?.rodHangStrip === true;
    if (isStrip) {
      const box0 = new THREE.Box3().setFromObject(root);
      if (!box0.isEmpty()) {
        const M0 = Math.max(
          box0.max.x - box0.min.x,
          box0.max.y - box0.min.y,
          box0.max.z - box0.min.z,
        );
        if (M0 > 0 && M0 <= 3.5) {
          root.scale.multiplyScalar(1000);
          root.updateMatrixWorld(true);
        }
      }
    }
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const sx = Math.max(size.x, 1e-8);
    const sy = Math.max(size.y, 1e-8);
    const rx = Math.max(Number(refSizeMm.x) || 0, 1e-6);
    const ry = Math.max(Number(refSizeMm.y) || 0, 1e-6);
    if (!isStrip) {
      const s = Math.min(rx / sx, ry / sy);
      if (!Number.isFinite(s) || s <= 0) return;
      root.scale.multiplyScalar(s);
      root.updateMatrixWorld(true);
      alignHangGarmentOntoHanger(root, THREE);
    }

    let hookY = null;
    const hangerBox = new THREE.Box3();
    let hasHanger = false;
    // GLTF multi-material: Group «Hanger_*» + Mesh без hanger в имени (как в clipHangStrip).
    root.traverse((o) => {
      if (!o?.isMesh) return;
      const nm = String(o.name || '');
      const named =
        /hanger/i.test(nm) ||
        (o.parent && /hanger/i.test(String(o.parent.name || '')));
      if (!named) return;
      const wb = new THREE.Box3().setFromObject(o);
      if (wb.isEmpty()) return;
      if (!hasHanger) {
        hangerBox.copy(wb);
        hasHanger = true;
      } else {
        hangerBox.union(wb);
      }
    });
    if (hasHanger && !hangerBox.isEmpty()) {
      // Изгиб крючка чуть ниже tip → труба в крючке; плюс offset.y > 0 поднимает над осью.
      hookY = hangerBox.max.y - 8;
    } else {
      const box2 = new THREE.Box3().setFromObject(root);
      if (box2.isEmpty()) return;
      hookY = box2.max.y - 8;
    }
    const boxAll = new THREE.Box3().setFromObject(root);
    if (boxAll.isEmpty()) return;
    const c = boxAll.getCenter(new THREE.Vector3());
    // Центр по XZ — плечико (после align), не середина «вещь+плечик рядом».
    let cx = c.x;
    let cz = c.z;
    if (hasHanger && !hangerBox.isEmpty()) {
      const hc = hangerBox.getCenter(new THREE.Vector3());
      cx = hc.x;
      cz = hc.z;
    }
    root.position.set(-cx, -hookY, -cz);
  }

  /**
   * Полоса FBX: оставить только плечики+вещи, что влезают в usableWidthMm.
   * Окно от центра (после hang-pivot). Лишние меши снимаем с дерева — не visible=false
   * (иначе легко «всплывают» снова).
   * Local→мм: |scale.x|, а если весь ряд < 50 «мм» — считаем метры ×1000.
   */
  function clipHangStripToRodRealSizeMm(root, usableWidthMm, THREE, maxHangers) {
    if (!root || !THREE) return;
    const usable = Math.max(80, Number(usableWidthMm) || 0);
    const maxRaw = Math.floor(Number(maxHangers) || 0);
    root.updateMatrixWorld(true);
    const sx = Math.max(Math.abs(Number(root.scale?.x) || 1), 1e-8);
    const wCenter = new THREE.Vector3();
    const local = new THREE.Vector3();
    const hangers = [];
    root.traverse((o) => {
      if (!o?.isMesh) return;
      const nm = String(o.name || '');
      // Имя может быть на родителе-Group, а не на Mesh.
      const named =
        /hanger/i.test(nm) ||
        (o.parent && /hanger/i.test(String(o.parent.name || '')));
      if (!named) return;
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) return;
      b.getCenter(wCenter);
      local.copy(wCenter);
      root.worldToLocal(local);
      hangers.push({ mesh: o, x: local.x });
    });
    if (!hangers.length) return;
    hangers.sort((a, b) => a.x - b.x);
    const fullLocal = hangers[hangers.length - 1].x - hangers[0].x;
    let toMm = sx;
    if (hangers.length > 1 && Math.abs(fullLocal) * sx < 50) toMm = sx * 1000;

    const midAll = (hangers[0].x + hangers[hangers.length - 1].x) * 0.5;
    const maxN = maxRaw > 0 ? Math.min(maxRaw, hangers.length) : hangers.length;
    // От центра полосы наружу, пока span ≤ usable и count ≤ maxN.
    const byAbs = hangers
      .map((h, i) => ({ i, x: h.x, ax: Math.abs((h.x - midAll) * toMm) }))
      .sort((a, b) => a.ax - b.ax || a.x - b.x);
    const keepIdx = new Set();
    let xMinK = Infinity;
    let xMaxK = -Infinity;
    for (let k = 0; k < byAbs.length; k++) {
      const h = hangers[byAbs[k].i];
      const nextMin = Math.min(xMinK, h.x);
      const nextMax = Math.max(xMaxK, h.x);
      const spanMm =
        keepIdx.size === 0 ? 0 : (nextMax - nextMin) * toMm;
      if (keepIdx.size > 0 && spanMm > usable) break;
      if (keepIdx.size >= maxN) break;
      keepIdx.add(byAbs[k].i);
      xMinK = nextMin;
      xMaxK = nextMax;
    }
    if (!keepIdx.size) keepIdx.add(byAbs[0].i);

    const keptHang = hangers.filter((_, i) => keepIdx.has(i));
    const xMin = Math.min(...keptHang.map((h) => h.x));
    const xMax = Math.max(...keptHang.map((h) => h.x));
    const midLocal = (xMin + xMax) * 0.5;
    const padLocal = 30 / toMm;
    const keepMin = xMin - padLocal;
    const keepMax = xMax + padLocal;
    // Сначала вырезать лишнее в текущих local, потом центрировать (иначе после сдвига local «поедет»).
    const remove = [];
    root.traverse((o) => {
      if (!o?.isMesh) return;
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) {
        remove.push(o);
        return;
      }
      b.getCenter(wCenter);
      local.copy(wCenter);
      root.worldToLocal(local);
      if (local.x < keepMin || local.x > keepMax) remove.push(o);
    });
    for (let i = 0; i < remove.length; i++) {
      const o = remove[i];
      if (o.parent) o.parent.remove(o);
      o.visible = false;
    }
    // World mid kept hangers → 0. Было «position -= midLocal» — при scale=1000 сдвиг ≈0, полоса оставалась сбоку.
    const worldMidX =
      midLocal * (Number(root.scale?.x) || 1) + (Number(root.position.x) || 0);
    root.position.x -= worldMidX;
    root.updateMatrixWorld(true);
    root.userData = root.userData || {};
    root.userData.rodHangStripClipped = true;
    root.userData.rodHangStripKeep = keepIdx.size;
    root.userData.rodHangStripUsableMm = usable;
  }

  /**
   * Если garment и hanger в GLB разъехались по XZ (ошибка closest-pair в pack),
   * сдвигаем ноды одежды в world-space (у GLB children scale≈0.001 — нельзя += в local).
   */
  function alignHangGarmentOntoHanger(root, THREE) {
    if (!root || !THREE) return;
    root.updateMatrixWorld(true);
    const hangerMeshes = [];
    const garmentMeshes = [];
    root.traverse((o) => {
      if (!o?.isMesh) return;
      const nm = String(o.name || '');
      if (/hanger/i.test(nm)) hangerMeshes.push(o);
      else garmentMeshes.push(o);
    });
    if (!hangerMeshes.length || !garmentMeshes.length) return;

    const hangerBox = new THREE.Box3();
    hangerMeshes.forEach((m, i) => {
      const b = new THREE.Box3().setFromObject(m);
      if (b.isEmpty()) return;
      if (i === 0) hangerBox.copy(b);
      else hangerBox.union(b);
    });
    const garmentBox = new THREE.Box3();
    let gHas = false;
    garmentMeshes.forEach((m) => {
      const b = new THREE.Box3().setFromObject(m);
      if (b.isEmpty()) return;
      if (!gHas) {
        garmentBox.copy(b);
        gHas = true;
      } else garmentBox.union(b);
    });
    if (!gHas || hangerBox.isEmpty()) return;

    const hc = hangerBox.getCenter(new THREE.Vector3());
    const gc = garmentBox.getCenter(new THREE.Vector3());
    const dx = hc.x - gc.x;
    const dz = hc.z - gc.z;
    const hH = Math.max(1e-6, hangerBox.max.y - hangerBox.min.y);
    // Перекладина ниже крючка.
    const barY = hangerBox.max.y - Math.min(90, hH * 0.38);
    const dy = barY - garmentBox.max.y;
    const sep = Math.sqrt(dx * dx + dz * dz);
    if (sep < 8 && Math.abs(dy) < 8) return;

    const worldDelta = new THREE.Vector3(dx, dy, dz);
    // Двигаем прямых детей root (gltf node), не mesh.position при parent.scale=0.001.
    const garmentNodes = new Set();
    garmentMeshes.forEach((mesh) => {
      let n = mesh;
      while (n.parent && n.parent !== root) n = n.parent;
      if (n && n !== root) garmentNodes.add(n);
      else garmentNodes.add(mesh);
    });

    const w0 = new THREE.Vector3();
    const w1 = new THREE.Vector3();
    garmentNodes.forEach((node) => {
      node.updateMatrixWorld(true);
      const parent = node.parent;
      if (!parent) {
        node.position.add(worldDelta);
        return;
      }
      node.getWorldPosition(w0);
      w1.copy(w0).add(worldDelta);
      parent.worldToLocal(w0);
      parent.worldToLocal(w1);
      node.position.add(w1.sub(w0));
    });
    root.updateMatrixWorld(true);
  }

  /**
   * После center: (alignRootToSizePivotFaceX удалён — ломал CAD-посадку направляющих).
   */

  /** Длинная ось FBX → local X (реф Handle: stretch по params.width = X). */
  function alignHandleLongAxisToX(root) {
    const THREE = getThree();
    if (!root || !THREE) return;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const s = box.getSize(new THREE.Vector3());
    if (s.y >= s.x * 0.9 && s.y >= s.z) {
      root.rotation.z = -Math.PI / 2;
    } else if (s.z >= s.x * 0.9 && s.z >= s.y) {
      root.rotation.y = Math.PI / 2;
    }
    root.updateMatrixWorld(true);
  }

  /**
   * Карточка cabinet_model (width×height×depth) → local mm до catalog rot.
   * rot z=90: local +X → world +Y (скoba), local +Y → world −X (профиль).
   */
  function cardSizeMmForHandlePrep(entry, cardSizeMm) {
    const rot = entry?.params && typeof entry.params === 'object' ? entry.params.rot : null;
    const rz = Math.abs(Math.round(Number(rot?.z) || 0)) % 360;
    const x = Math.max(Number(cardSizeMm?.x) || 0, 1e-6);
    const y = Math.max(Number(cardSizeMm?.y) || 0, 1e-6);
    const z = Math.max(Number(cardSizeMm?.z) || 0, 1e-6);
    if (rz === 90 || rz === 270) return { x: y, y: x, z };
    return { x, y, z };
  }

  /** Ручка id=3: fit по local X/Y/Z до catalog rot; bbox — robust mesh union (без FBX-хвостов). */
  function scaleHandleCabinetCardMm(root, cardSizeMm) {
    const THREE = getThree();
    if (!root || !THREE) return;
    const wMm = Math.max(Number(cardSizeMm?.x) || 0, 1e-6);
    const hMm = Math.max(Number(cardSizeMm?.y) || 0, 1e-6);
    const dMm = Math.max(Number(cardSizeMm?.z) || 0, 1e-6);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);

    const measure = () => {
      const box = robustMeshUnionBox3(root);
      if (!box || box.isEmpty()) return null;
      return box.getSize(new THREE.Vector3());
    };

    let size = measure();
    if (!size) return;
    if (size.x > 1e-8) root.scale.x *= wMm / size.x;
    root.updateMatrixWorld(true);
    size = measure();
    if (!size) return;
    if (size.y > 1e-8) root.scale.y *= hMm / size.y;
    root.updateMatrixWorld(true);
    size = measure();
    if (!size) return;
    if (size.z > 1e-8) root.scale.z *= dMm / size.z;
    root.updateMatrixWorld(true);
    centerOnlyKeepScale(root);
  }

  /** Ручка: не uniform min-scale — каждая ось отдельно (реф set_size_buff без сплющивания Y/Z). */
  function scaleRootToRefMmPerAxis(root, refSizeMm) {
    const THREE = getThree();
    if (!root || !refSizeMm || !THREE) return;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const rx = Math.max(Number(refSizeMm.x) || 0, 1e-6);
    const ry = Math.max(Number(refSizeMm.y) || 0, 1e-6);
    const rz = Math.max(Number(refSizeMm.z) || 0, 1e-6);
    if (size.x > 1e-8) root.scale.x *= rx / size.x;
    if (size.y > 1e-8) root.scale.y *= ry / size.y;
    if (size.z > 1e-8) root.scale.z *= rz / size.z;
    root.updateMatrixWorld(true);
    centerOnlyKeepScale(root);
  }

  function catalogScaleVec(entry) {
    const sc = entry?.params && typeof entry.params === 'object' ? entry.params.scale : null;
    if (!sc || typeof sc !== 'object') return null;
    const sx = Number(sc.x);
    const sy = Number(sc.y);
    const sz = Number(sc.z);
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(sz)) return null;
    if (sx <= 0 || sy <= 0 || sz <= 0) return null;
    return { x: sx / 100, y: sy / 100, z: sz / 100 };
  }

  /** Реф Model_utils.parse_mesh_name — fallback, если в params.meshes нет s/t. */
  function parseMeshName(meshName) {
    const raw = String(meshName || '');
    const out = { v: 1, m: '', t: '', s: '' };
    if (/v\([^)]*\)/.test(raw) || raw.includes('(')) {
      for (const part of raw.split('_')) {
        const m = part.match(/([a-zA-Z]+)\(([^)]*)\)/);
        if (!m) continue;
        const key = m[1];
        const q = m[2];
        const num = Number(q);
        out[key] = Number.isNaN(num) || q === '' ? q : num;
      }
    } else {
      const parts = raw.split('_');
      const mats = ['gen', 'glass', 'mirror', 'back', 'black', 'al'];
      const axisRe = /^[xyz]+$/;
      for (const part of parts) {
        if (mats.includes(part)) out.m = part;
        else if (axisRe.test(part) && !out.t) out.t = part;
      }
      const filtered = parts.filter((p) => String(p || '').trim() !== '');
      if (!out.m && filtered.length >= 2) {
        out.m = filtered[0];
        out.t = filtered[1];
      }
    }
    const t = { x: 0, y: 0, z: 0 };
    const s = { x: 0, y: 0, z: 0 };
    const tStr = String(out.t || '');
    const sStr = String(out.s || '');
    for (let i = 0; i < tStr.length; i++) {
      if (t[tStr[i]] != null) t[tStr[i]] = 1;
    }
    for (let i = 0; i < sStr.length; i++) {
      if (s[sStr[i]] != null) s[sStr[i]] = 1;
    }
    out.t = t;
    out.s = s;
    out.tax = { x: 'x', y: 'y' };
    return out;
  }

  function normalizeMeshAxisFlags(v) {
    if (!v || typeof v !== 'object') return { x: 0, y: 0, z: 0 };
    return {
      x: Number(v.x) ? 1 : 0,
      y: Number(v.y) ? 1 : 0,
      z: Number(v.z) ? 1 : 0,
    };
  }

  /** Дефолт админки (t.y=1 без s) — UV/адаптация, не растягивание под слот. */
  function meshConfigHasEffectiveSizeRules(cfg) {
    if (!cfg || typeof cfg !== 'object') return false;
    const s = normalizeMeshAxisFlags(cfg.s);
    const t = normalizeMeshAxisFlags(cfg.t);
    if (s.x || s.y || s.z) return true;
    if (t.x || t.z) return true;
    return false;
  }

  function meshMapHasSizeRules(meshMap) {
    if (!meshMap || typeof meshMap !== 'object') return false;
    for (const key of Object.keys(meshMap)) {
      const cfg = meshMap[key];
      if (meshConfigHasEffectiveSizeRules(cfg)) return true;
    }
    return false;
  }

  function readSlotFit(entryParams) {
    const sf = entryParams?.slot_fit;
    if (!sf || typeof sf !== 'object') return null;
    if (sf.enabled === false || sf.enabled === 0) return null;
    return sf;
  }

  function slotFitHasRules(slotFit) {
    if (!slotFit) return false;
    const s = normalizeMeshAxisFlags(slotFit.s);
    const t = normalizeMeshAxisFlags(slotFit.t);
    return !!(s.x || s.y || s.z || t.x || t.y || t.z);
  }

  function scaleRootBySlotFitStretch(root, targetMm, s) {
    const THREE = getThree();
    if (!root || !THREE) return;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const cur = box.getSize(new THREE.Vector3());
    if (s.x && cur.x > 1e-8) root.scale.x *= targetMm.x / cur.x;
    if (s.y && cur.y > 1e-8) root.scale.y *= targetMm.y / cur.y;
    if (s.z && cur.z > 1e-8) root.scale.z *= targetMm.z / cur.z;
    root.updateMatrixWorld(true);
    centerOnlyKeepScale(root);
  }

  /** params.slot_fit из админки — модель целиком (без per-mesh). */
  function applyWholeObjectSlotFit(root, entryParams, targetMm) {
    const slotFit = readSlotFit(entryParams);
    if (!slotFit || !slotFitHasRules(slotFit)) return false;
    const s = normalizeMeshAxisFlags(slotFit.s);
    const t = normalizeMeshAxisFlags(slotFit.t);
    const hasT = !!(t.x || t.y || t.z);
    const hasS = !!(s.x || s.y || s.z);

    if (hasT) {
      bakeMeshesToRootLocal(root);
      root.scale.set(1, 1, 1);
      root.position.set(0, 0, 0);
      root.updateMatrixWorld(true);
      const boxSize = unionMeshBoxSize(root);
      if (!boxSize) return false;
      const axisParams = { s, t };
      collectRootMeshes(root).forEach((mesh) => {
        modelUtilsSetSize(mesh, axisParams, boxSize, targetMm);
      });
      centerOnlyKeepScale(root);
      return true;
    }
    if (hasS) {
      scaleRootBySlotFitStretch(root, targetMm, s);
      return true;
    }
    return false;
  }

  function resolveMeshSizeAxisParams(meshMap, meshName) {
    const cfg = meshMap ? findMeshMaterialConfig(meshMap, meshName) : null;
    const parsed = parseMeshName(meshName);
    const hasExplicitS =
      cfg &&
      cfg.s &&
      typeof cfg.s === 'object' &&
      (cfg.s.x != null || cfg.s.y != null || cfg.s.z != null);
    const hasExplicitT =
      cfg &&
      cfg.t &&
      typeof cfg.t === 'object' &&
      (cfg.t.x != null || cfg.t.y != null || cfg.t.z != null);
    return {
      s: normalizeMeshAxisFlags(hasExplicitS ? cfg.s : parsed.s),
      t: normalizeMeshAxisFlags(hasExplicitT ? cfg.t : parsed.t),
    };
  }

  /** Реф Model_utils.set_scale — scale в params (%) → вершины. */
  function modelUtilsSetScale(mesh, scaleVec) {
    const pos = mesh?.geometry?.attributes?.position;
    if (!pos || !scaleVec) return;
    const axes = ['x', 'y', 'z'];
    for (let i = 0; i < pos.count; i++) {
      const u = { x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) };
      axes.forEach((ax) => {
        const f = Number(scaleVec[ax]);
        if (Number.isFinite(f) && f !== 1) u[ax] *= f;
      });
      pos.setXYZ(i, u.x, u.y, u.z);
    }
    pos.needsUpdate = true;
    mesh.geometry.boundingBox = null;
    mesh.geometry.boundingSphere = null;
  }

  /**
   * Реф Model_utils.set_size (part15) — растягивание s / адаптация t по осям.
   * boxSize — union bbox до правки; targetSize — целевой габарит (мм).
   */
  function modelUtilsSetSize(mesh, axisParams, boxSize, targetSize) {
    const THREE = getThree();
    const pos = mesh?.geometry?.attributes?.position;
    if (!pos || !THREE || !axisParams || !boxSize || !targetSize) return;
    const k = new THREE.Vector3(
      Number(targetSize.x) - Number(boxSize.x),
      Number(targetSize.y) - Number(boxSize.y),
      Number(targetSize.z) - Number(boxSize.z)
    ).divideScalar(2);
    const axes = ['x', 'y', 'z'];
    const div = { x: 1, y: 1, z: 1 };
    const thresh = { x: [0, 0], y: [0, 0], z: [0, 0] };
    for (let i = 0; i < pos.count; i++) {
      const u = { x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) };
      axes.forEach((ax) => {
        if (axisParams.t[ax]) {
          if (u[ax] < thresh[ax][0]) u[ax] -= k[ax] / div[ax];
          if (u[ax] > thresh[ax][1]) u[ax] += k[ax] / div[ax];
        }
        if (axisParams.s[ax]) {
          const b = Number(boxSize[ax]);
          const t = Number(targetSize[ax]);
          if (b > 1e-8 && t > 0) u[ax] *= t / b;
        }
      });
      pos.setXYZ(i, u.x, u.y, u.z);
    }
    pos.needsUpdate = true;
    mesh.geometry.boundingBox = null;
    mesh.geometry.boundingSphere = null;
  }

  function collectRootMeshes(root) {
    const meshes = [];
    if (!root) return meshes;
    root.traverse((o) => {
      if (o.isMesh && o.geometry?.attributes?.position) meshes.push(o);
    });
    return meshes;
  }

  /** GLB-иерархия → все меши в local root (мм), transform в геометрию. */
  function bakeMeshesToRootLocal(root) {
    const THREE = getThree();
    if (!root || !THREE) return;
    root.updateMatrixWorld(true);
    const invRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const meshes = collectRootMeshes(root);
    for (const mesh of meshes) {
      const geo = mesh.geometry.clone();
      const wm = new THREE.Matrix4().multiplyMatrices(invRoot, mesh.matrixWorld);
      geo.applyMatrix4(wm);
      if (mesh.geometry) mesh.geometry.dispose();
      mesh.geometry = geo;
      root.add(mesh);
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
    }
    root.updateMatrixWorld(true);
  }

  function unionMeshBoxSize(root) {
    const THREE = getThree();
    if (!root || !THREE) return null;
    root.updateMatrixWorld(true);
    const box = meshUnionBox3(root);
    if (!box || box.isEmpty()) return null;
    return box.getSize(new THREE.Vector3());
  }

  /**
   * Реф _set_model3d_size: params.meshes[].s / .t → вершины под targetSizeMm.
   * @returns {boolean} true если применено
   */
  function applyCabinetModelMeshVertexSizing(root, entryParams, targetSizeMm) {
    const THREE = getThree();
    const meshMap = entryParams?.meshes;
    if (!root || !THREE || !meshMapHasSizeRules(meshMap)) return false;

    const savedRot = root.rotation.clone();
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);

    const catSc = catalogScaleVec({ params: entryParams });
    if (catSc && (catSc.x !== 1 || catSc.y !== 1 || catSc.z !== 1)) {
      collectRootMeshes(root).forEach((mesh) => modelUtilsSetScale(mesh, catSc));
      root.updateMatrixWorld(true);
    }

    const target = {
      x: Math.max(Number(targetSizeMm?.x) || 0, 1e-6),
      y: Math.max(Number(targetSizeMm?.y) || 0, 1e-6),
      z: Math.max(Number(targetSizeMm?.z) || 0, 1e-6),
    };
    const boxSize = unionMeshBoxSize(root);
    if (!boxSize) return false;

    const meshes = collectRootMeshes(root);
    for (const mesh of meshes) {
      const axisParams = resolveMeshSizeAxisParams(meshMap, mesh.name || '');
      modelUtilsSetSize(mesh, axisParams, boxSize, target);
    }

    root.rotation.copy(savedRot);
    root.updateMatrixWorld(true);
    centerOnlyKeepScale(root);
    return true;
  }

  function findMeshMaterialConfig(meshMap, meshName) {
    if (!meshMap || typeof meshMap !== 'object') return null;
    const n = String(meshName || '').toLowerCase();
    if (!n) return null;
    for (const k of Object.keys(meshMap)) {
      const kl = String(k || '').toLowerCase();
      if (!kl) continue;
      if (kl === n || kl.includes(n) || n.includes(kl)) return meshMap[k];
    }
    return null;
  }

  function meshMaterialTokenFromCfg(cfg) {
    if (!cfg || typeof cfg !== 'object') return '';
    const token =
      cfg.material_id ??
      cfg.mat_id ??
      cfg.selected ??
      cfg.material_key ??
      cfg.material ??
      cfg.m;
    return token != null ? String(token).trim() : '';
  }

  function extractMaterialParamsFromCatalogItem(item) {
    if (!item || typeof item !== 'object') return null;
    let d = {};
    try {
      if (item.data) d = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    } catch (_) {
      d = {};
    }
    const p = d?.params?.params || d?.params || d || {};
    return {
      color: p?.color ?? d?.color ?? item?.color ?? item?.hex ?? null,
      metalness: p?.metalness ?? d?.metalness ?? null,
      roughness: p?.roughness ?? d?.roughness ?? null,
      transparent: p?.transparent ?? d?.transparent ?? null,
      opacity: p?.opacity ?? d?.opacity ?? null,
      map: p?.map || d?.map || item?.texture || item?.texture_url || item?.image || item?.icon || '',
      normalMap: p?.normalMap || d?.normalMap || '',
      roughnessMap: p?.roughnessMap || d?.roughnessMap || '',
    };
  }

  function copyCatalogMaterialParams(params) {
    if (!params || typeof params !== 'object') return null;
    return {
      color: params.color ?? null,
      metalness: params.metalness ?? null,
      roughness: params.roughness ?? null,
      transparent: params.transparent ?? null,
      opacity: params.opacity ?? null,
      map: params.map ? String(params.map) : '',
    };
  }

  function catalogParamsByToken(catalog, token) {
    if (!catalog || token == null || token === '') return null;
    const t = String(token).trim();
    if (!t) return null;
    return catalog[t] || catalog[t.toLowerCase()] || null;
  }

  function stampCatalogMaterialOnNode(node, token, params) {
    if (!node || !params) return;
    node.userData = node.userData || {};
    if (token) node.userData.cldCabinetMaterialToken = String(token);
    node.userData.cldCabinetMaterialParams = copyCatalogMaterialParams(params);
  }

  /** Петли 5/6: одна карточка на все меши (имена GLB корпуса часто не совпадают с meshMap). */
  function resolveHingeChromeFromCatalog(catalog, meshMap) {
    const tokens = [];
    if (meshMap && typeof meshMap === 'object') {
      Object.keys(meshMap).forEach((k) => {
        const t = meshMaterialTokenFromCfg(meshMap[k]);
        if (t) tokens.push(t);
      });
    }
    tokens.push('7', 'Хром для петель', 'хром для петель', 'хром', 'chrome', 'chrom');
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const p = catalogParamsByToken(catalog, t);
      if (p && (p.color || p.metalness != null)) {
        return { token: String(t), params: copyCatalogMaterialParams(p) };
      }
    }
    return { token: '', params: null };
  }

  function fetchHingeChromeCatalogItem() {
    return fetch('/api/catalog/item_get/model_key_material/7?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        const item = payload?.item || payload?.data?.item || payload;
        if (!item || typeof item !== 'object') return null;
        if (!item.id && !item.data && !item.name) return null;
        return extractMaterialParamsFromCatalogItem(item);
      })
      .catch(() => null);
  }

  let __materialByTokenCache = null;
  let __materialCatalogPromise = null;
  const __texturePromises = new Map();

  function ensureModelKeyMaterialCatalog() {
    if (__materialByTokenCache) return Promise.resolve(__materialByTokenCache);
    if (__materialCatalogPromise) return __materialCatalogPromise;
    __materialCatalogPromise = (async () => {
      const byToken = Object.create(null);
      const ingest = (items) => {
        if (!Array.isArray(items)) return;
        for (const it of items) {
          const params = extractMaterialParamsFromCatalogItem(it);
          if (!params) continue;
          const id = String(it?.id ?? '').trim();
          const key = String(it?.key ?? it?.data?.key ?? '').trim();
          let dataKey = '';
          try {
            const d =
              typeof it?.data === 'string'
                ? JSON.parse(it.data)
                : it?.data && typeof it.data === 'object'
                  ? it.data
                  : null;
            dataKey = String(d?.key || '').trim();
          } catch (_) {}
          const name = String(it?.name ?? it?.title ?? '').trim();
          if (id) byToken[id] = params;
          if (key) byToken[key] = params;
          if (dataKey) byToken[dataKey] = params;
          if (name) byToken[name] = params;
        }
      };
      try {
        const r = await fetch('/api/catalog/items_get/model_key_material?per_page=500', {
          cache: 'no-store',
        });
        const data = r.ok ? await r.json() : [];
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        ingest(items);
      } catch (_) {}
      if (!Object.keys(byToken).length) {
        try {
          const r2 = await fetch('/catalog_items/model_key_material.json?ts=' + Date.now(), {
            cache: 'no-store',
          });
          if (r2.ok) {
            const data2 = await r2.json();
            ingest(Array.isArray(data2) ? data2 : data2?.items || []);
          }
        } catch (_) {}
      }
      __materialByTokenCache = byToken;
      __materialCatalogPromise = null;
      return byToken;
    })();
    return __materialCatalogPromise;
  }

  function loadTextureOnce(url) {
    const THREE = getThree();
    const u = resolveAssetUrl(String(url || '').trim());
    if (!u || !THREE) return Promise.resolve(null);
    if (__texturePromises.has(u)) return __texturePromises.get(u);
    const p = new Promise((resolve) => {
      new THREE.TextureLoader().load(
        u,
        (tex) => {
          if (tex.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
            tex.colorSpace = THREE.SRGBColorSpace;
          }
          tex.needsUpdate = true;
          resolve(tex);
        },
        undefined,
        () => resolve(null)
      );
    });
    __texturePromises.set(u, p);
    return p;
  }

  function applyMaterialParamsToMeshMaterial(mat, params, hingeLikeFallback) {
    const THREE = getThree();
    if (!mat || !THREE) return;
    const p = params || (hingeLikeFallback ? { color: '#8b8b8b', metalness: 1, roughness: 0.35 } : null);
    if (!p) return;
    if (p.map) {
      return loadTextureOnce(p.map).then((tex) => {
        if (tex) {
          mat.map = tex.clone();
          mat.map.needsUpdate = true;
          mat.color = new THREE.Color(0xffffff);
        } else if (p.color) {
          try {
            mat.color = new THREE.Color(p.color);
          } catch (_) {}
        }
        if (p.metalness != null && Number.isFinite(Number(p.metalness))) {
          mat.metalness = Math.max(0, Math.min(1, Number(p.metalness)));
        } else if (hingeLikeFallback) {
          mat.metalness = 0.75;
        }
        if (p.roughness != null && Number.isFinite(Number(p.roughness))) {
          mat.roughness = Math.max(0, Math.min(1, Number(p.roughness)));
        } else if (hingeLikeFallback) {
          mat.roughness = 0.32;
        }
        if (p.transparent != null) mat.transparent = !!p.transparent;
        if (p.opacity != null && Number.isFinite(Number(p.opacity))) {
          mat.opacity = Math.max(0, Math.min(1, Number(p.opacity)));
        }
        mat.needsUpdate = true;
      });
    }
    // Card without map: drop GLB albedo (hinge GLB is copper/brown). Catalog color is the look.
    mat.map = null;
    if (p.normalMap == null || p.normalMap === '') mat.normalMap = null;
    if (p.roughnessMap == null || p.roughnessMap === '') mat.roughnessMap = null;
    if (p.color) {
      try {
        mat.color = new THREE.Color(p.color);
      } catch (_) {}
    }
    if (p.metalness != null && Number.isFinite(Number(p.metalness))) {
      mat.metalness = Math.max(0, Math.min(1, Number(p.metalness)));
    } else if (hingeLikeFallback) {
      mat.metalness = 0.75;
    }
    if (p.roughness != null && Number.isFinite(Number(p.roughness))) {
      mat.roughness = Math.max(0, Math.min(1, Number(p.roughness)));
    } else if (hingeLikeFallback) {
      mat.roughness = 0.32;
    }
    if (p.transparent != null) mat.transparent = !!p.transparent;
    if (p.opacity != null && Number.isFinite(Number(p.opacity))) {
      mat.opacity = Math.max(0, Math.min(1, Number(p.opacity)));
    }
    mat.needsUpdate = true;
    return Promise.resolve();
  }

  /**
   * GLTF default metallicFactor=1 → чёрный без env. Тканевые пропы — диэлектрик.
   */
  function finishShelfPropMeshMaterial(mat, THREE, meshName) {
    if (!mat || !THREE) return;
    if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
      mat.metalness = 0;
      mat.roughness = Math.max(Number(mat.roughness) || 0, 0.88);
    }
    mat.side = THREE.DoubleSide;
    const c = mat.color;
    if (c?.isColor && c.r + c.g + c.b < 0.05 && !mat.map) {
      const nm = String(meshName || '').toLowerCase();
      const hex = /grey|gray|middle/.test(nm)
        ? 0x9e9e9c
        : /beige|bottom/.test(nm)
          ? 0xbfaa8f
          : /bag|handle/.test(nm)
            ? 0xc9b89e
            : /collar_seam/.test(nm)
              ? 0xd7d4cc
              : /milk|top|collar/.test(nm)
                ? 0xeeebe2
                : 0xbfaa8f;
      mat.color = new THREE.Color(hex);
    }
    mat.needsUpdate = true;
  }

  /**
   * Как constructor-clodis __cldApplyCabinetModelMeshMaterials: meshes[].material_id → model_key_material.
   */
  function applyRoomCabinetModelMaterials(root, mergedSpec, entry) {
    const THREE = getThree();
    if (!root || !THREE) return Promise.resolve();
    // Как constructor __cldApplyCabinetModelMeshMaterials: meshes на variant и на params.
    const meshMap =
      entry?.params?.meshes ||
      entry?.meshes ||
      mergedSpec?.params?.meshes ||
      mergedSpec?.meshes ||
      null;
    const modelId = String(mergedSpec?.id ?? mergedSpec?.key ?? nodeSpecIdFromRoot(root) ?? '').trim();
    const hingeLike = modelId === '5' || modelId === '6';
    const guideLike =
      modelId === '7' ||
      modelId === '8' ||
      modelId === '9' ||
      modelId === '10' ||
      /направляющ|направл|guide|runner|telescop/i.test(
        String(mergedSpec?.key || mergedSpec?.name || ''),
      );
    const hardwareLike = hingeLike || guideLike;
    const roomHandle =
      mergedSpec.roomHandle === true ||
      mergedSpec.room_handle === true;

    const supportLegLike =
      mergedSpec?.cldSupportLeg === true ||
      /опора|support.?leg|opora/i.test(String(mergedSpec?.key || mergedSpec?.name || '')) ||
      modelId === '2' ||
      modelId === '79' ||
      modelId === '80';

    root.traverse((o) => {
      if (!o.isMesh) return;
      o.userData.isAccessory = true;
      // Каталожный цвет — не затирать шагом 5 (Gola / фурнитура / опоры).
      o.userData.cldSkipStep5FacadeDecor = true;
      if (mergedSpec?.isRodCompanion === true) o.userData.isRodCompanion = true;
      if (mergedSpec?.isShelfProp === true) o.userData.isShelfProp = true;
      if (supportLegLike) {
        o.userData.cldSupportLeg = true;
        // IKEA_PORT: не whiteCorpus корпуса — цвет из model_key_material / GLB.
        o.userData.ikeaPortMatRole = 'none';
      }
      if (hingeLike) {
        o.userData.isHingeCabinetModelMetal = true;
        o.userData.isHingeBazisExport = true;
        o.userData.cldHingeCatalogModel = true;
      }
      if (guideLike) o.userData.cldGuideCabinetModel = true;
      if (
        Number(mergedSpec?.from_drill_template) === 1 ||
        Number(mergedSpec?.joint_template_model) === 1
      ) {
        o.userData.fromDrillTemplateModel = true;
        o.userData.isHingeBazisExport = true;
      }
    });

    return ensureModelKeyMaterialCatalog().then((catalog) => {
      const fallbackToken =
        meshMap && typeof meshMap === 'object'
          ? meshMaterialTokenFromCfg(meshMap[Object.keys(meshMap)[0]])
          : '';

      const resolveChrome = () => {
        if (!hingeLike) return Promise.resolve({ token: '', params: null });
        const hit = resolveHingeChromeFromCatalog(catalog, meshMap);
        if (hit.params) return Promise.resolve(hit);
        return fetchHingeChromeCatalogItem().then((p) => {
          if (!p) return hit;
          if (catalog) {
            catalog['7'] = p;
            catalog['Хром для петель'] = p;
            catalog['хром для петель'] = p;
          }
          return { token: '7', params: copyCatalogMaterialParams(p) };
        });
      };

      return resolveChrome().then((hingeChrome) => {
        const tasks = [];
        const supportMatFallback = () => {
          if (!supportLegLike) return { token: '', params: null };
          if (catalog) {
            const keys = ['2', 'Opora', 'opora', 'Опора', 'опора'];
            for (let i = 0; i < keys.length; i++) {
              const p = catalogParamsByToken(catalog, keys[i]);
              if (p && (p.color || p.map)) return { token: keys[i], params: copyCatalogMaterialParams(p) };
            }
          }
          // Кухонные ножки: чёрный металл (IKEA), если в каталоге нет карточки.
          return {
            token: 'opora-black',
            params: { color: '#1a1a1a', metalness: 0.85, roughness: 0.38 },
          };
        };
        const supportFb = supportMatFallback();
        let effectiveFallback = fallbackToken;
        if (!effectiveFallback && supportFb.token) effectiveFallback = supportFb.token;
        const rootParams = hingeLike && hingeChrome.params
          ? hingeChrome.params
          : effectiveFallback && catalog
            ? catalogParamsByToken(catalog, effectiveFallback) || supportFb.params
            : supportFb.params;
        const rootToken =
          hingeLike && hingeChrome.token
            ? hingeChrome.token
            : effectiveFallback || supportFb.token;
        if (rootParams) {
          stampCatalogMaterialOnNode(root, rootToken, rootParams);
          if (hingeLike) {
            try {
              global.__cldHingeHardwareMaterialParams = copyCatalogMaterialParams(rootParams);
              global.__cldHingeHardwareMaterialToken = rootToken;
            } catch (_) {}
          }
        }

        root.traverse((o) => {
          if (!o.isMesh) return;
          const cfg = meshMap ? findMeshMaterialConfig(meshMap, o.name || '') : null;
          let token = meshMaterialTokenFromCfg(cfg);
          if (!token && effectiveFallback) token = effectiveFallback;
          let params = token && catalog ? catalogParamsByToken(catalog, token) : null;
          if (!params && supportFb.params) {
            token = token || supportFb.token;
            params = supportFb.params;
          }
          if (hingeLike && hingeChrome.params) {
            token = hingeChrome.token || token || effectiveFallback;
            params = hingeChrome.params;
          }
          if (token) o.userData.cldCabinetMaterialToken = token;
          if (params) stampCatalogMaterialOnNode(o, token, params);
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m, idx) => {
            if (!m) return;
            const THREE = getThree();
            let mat;
            if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
              mat = m.clone();
            } else if (THREE && (params || hardwareLike || roomHandle)) {
              // FBX (вешалка и др.) приходит Lambert/Phong — карточка model_key_material
              // иначе не применяется, меш остаётся белым из файла.
              let initHex = hingeLike ? 0x8b8b8b : 0xffffff;
              if (params?.color && !String(params.map || '').trim()) {
                try {
                  initHex = new THREE.Color(params.color).getHex();
                } catch (_) {}
              }
              mat = new THREE.MeshStandardMaterial({
                color: initHex,
                metalness:
                  params?.metalness != null && Number.isFinite(Number(params.metalness))
                    ? Number(params.metalness)
                    : hingeLike
                      ? 1
                      : 0.1,
                roughness:
                  params?.roughness != null && Number.isFinite(Number(params.roughness))
                    ? Number(params.roughness)
                    : hingeLike
                      ? 0.35
                      : 0.5,
              });
              if (m.name) mat.name = m.name;
              if (m.side != null) mat.side = m.side;
            } else {
              return;
            }
            if (Array.isArray(o.material)) o.material[idx] = mat;
            else o.material = mat;
            tasks.push(
              Promise.resolve(
                applyMaterialParamsToMeshMaterial(mat, params, hingeLike && !params),
              ).then(() => {
                if (mergedSpec?.isShelfProp === true || mergedSpec?.isRodCompanion === true) {
                  finishShelfPropMeshMaterial(mat, THREE, o.name);
                }
                // Кухонные опоры: всегда тёмный металл (не белый корпус).
                if (supportLegLike && mat?.color && THREE) {
                  try {
                    const c = mat.color;
                    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
                    if (lum > 0.45 || !params?.color) {
                      mat.color.set('#1a1a1a');
                      if (mat.metalness != null) mat.metalness = Math.max(Number(mat.metalness) || 0, 0.75);
                      if (mat.roughness != null) mat.roughness = Math.min(Number(mat.roughness) || 1, 0.4);
                      mat.needsUpdate = true;
                    }
                  } catch (_) {}
                }
              }),
            );
          });
        });
        return Promise.all(tasks).then(() => {
          try {
            const rebindRoot = (function findFurnitureRoot(obj) {
              let p = root;
              for (let i = 0; i < 32 && p; i++) {
                if (p.isGroup && p.userData?.isFurniture) return p;
                p = p.parent;
              }
              return root;
            })();
            if (typeof window.__cldRefreshCabinetStudioAfterDecor === 'function') {
              window.__cldRefreshCabinetStudioAfterDecor(rebindRoot);
            }
          } catch (_) {}
        });
      });
    });
  }

  function nodeSpecIdFromRoot(root) {
    let id = '';
    root.traverse((o) => {
      if (id) return;
      const sid = String(o.userData?.modelSpecId || '').trim();
      if (sid) id = sid;
    });
    return id;
  }

  function storeCatalogEntryRotation(root, entry) {
    const rot = entry?.params && typeof entry.params === 'object' ? entry.params.rot : null;
    if (!root || !rot) return;
    root.userData = root.userData || {};
    root.userData._cldCatalogRot = {
      x: rot.x,
      y: rot.y,
      z: rot.z,
      order: rot.order || 'XYZ',
    };
  }

  function resolveSlotTargetSizeMm(sizeMm, refMm) {
    return {
      x: Math.max(Number(sizeMm?.x) || Number(refMm?.x) || 0, 1e-6),
      y: Math.max(Number(sizeMm?.y) || Number(refMm?.y) || 0, 1e-6),
      z: Math.max(Number(sizeMm?.z) || Number(refMm?.z) || 0, 1e-6),
    };
  }

  function applyStoredCatalogRotation(root) {
    const THREE = getThree();
    const rot = root?.userData?._cldCatalogRot;
    if (!root || !rot || !THREE) return;
    const order = String(rot.order || 'XYZ').toUpperCase();
    const rx = THREE.MathUtils.degToRad(Number(rot.x) || 0);
    const ry = THREE.MathUtils.degToRad(Number(rot.y) || 0);
    const rz = THREE.MathUtils.degToRad(Number(rot.z) || 0);
    if (order === 'YXZ') root.rotation.set(ry, rx, rz, 'YXZ');
    else if (order === 'ZXY') root.rotation.set(rz, rx, ry, 'ZXY');
    else root.rotation.set(rx, ry, rz, 'XYZ');
    root.updateMatrixWorld(true);
  }

  function isKitchenSupportLegSpec(mergedSpec) {
    const id = String(mergedSpec?.id || '').trim();
    if (mergedSpec?.cldSupportLeg === true) return true;
    if (id === '2' || id === '79' || id === '80') return true;
    return /опора|support.?leg|opora/i.test(
      String(mergedSpec?.key || mergedSpec?.name || ''),
    );
  }

  /** Mesh/slot_fit s-флаги карточки (реф set_size). fitToSize у опоры НЕ форсим. */
  function resolveSupportLegStretchFlags(entry) {
    const p = entry?.params && typeof entry.params === 'object' ? entry.params : {};
    const out = { x: 0, y: 0, z: 0 };
    const axis = (v) => ({
      x: Number(v?.x) ? 1 : 0,
      y: Number(v?.y) ? 1 : 0,
      z: Number(v?.z) ? 1 : 0,
    });
    const sf = p.slot_fit;
    if (sf && typeof sf === 'object' && (sf.enabled === 1 || sf.enabled === true)) {
      const s = axis(sf.s);
      out.x |= s.x;
      out.y |= s.y;
      out.z |= s.z;
    }
    const meshes = p.meshes;
    if (meshes && typeof meshes === 'object') {
      Object.keys(meshes).forEach((k) => {
        const s = axis(meshes[k] && meshes[k].s);
        out.x |= s.x;
        out.y |= s.y;
        out.z |= s.z;
      });
    }
    return out;
  }

  /**
   * Реф _load_model: pos+rot с карточки после sizing.
   * Опоры: не вызывается (prepare помечает _cldCatalogRotApplied, finish пропускает support).
   */
  function applyCatalogCardOrientAfterPrepare(root, entry, mergedSpec, opts) {
    if (!root) return;
    const force = !!(opts && opts.force);
    if (!force && root.userData?._cldCatalogRotApplied) return;
    root.userData = root.userData || {};
    storeCatalogEntryRotation(root, entry);
    applyStoredCatalogRotation(root);
    const pos = entry?.params && typeof entry.params === 'object' ? entry.params.pos : null;
    if (pos && typeof pos === 'object') {
      const dx = Number(pos.x) || 0;
      const dy = Number(pos.y) || 0;
      const dz = Number(pos.z) || 0;
      if (dx || dy || dz) {
        root.position.x += dx;
        root.position.y += dy;
        root.position.z += dz;
        root.updateMatrixWorld(true);
      }
    }
    root.userData._cldCatalogRotApplied = true;
  }

  /**
   * Fallback опоры, если PlanPlace API нет.
   * Основной путь: buildPlanPlaceOwnObject (−tree + pivot + card).
   */
  function prepareKitchenSupportLegRoot(root, mergedSpec, entry, sizeMm) {
    const THREE = getThree();
    if (!root || !THREE) return root;
    root.scale.set(1, 1, 1);
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);

    const imp = inferFileToMmScale(root, mergedSpec);
    if (imp !== 1) {
      root.scale.setScalar(imp);
      root.updateMatrixWorld(true);
    }
    const catSc = catalogScaleVec(entry);
    if (catSc && (catSc.x !== 1 || catSc.y !== 1 || catSc.z !== 1)) {
      root.scale.multiply(new THREE.Vector3(catSc.x, catSc.y, catSc.z));
      root.updateMatrixWorld(true);
    }

    const params = entry?.params && typeof entry.params === 'object' ? entry.params : {};
    const pos = params.pos && typeof params.pos === 'object' ? params.pos : {};
    const px = Number(pos.x) || 0;
    const py = Number(pos.y) || 0;
    const pz = Number(pos.z) || 0;
    if (px || py || pz) {
      root.position.x += px;
      root.position.y += py;
      root.position.z += pz;
    }

    const rot = params.rot && typeof params.rot === 'object' ? params.rot : {};
    const rx = Number(rot.x) || 0;
    const ry = Number(rot.y) || 0;
    const rz = Number(rot.z) || 0;
    if (rx) root.rotateX(THREE.MathUtils.degToRad(rx));
    if (ry) root.rotateY(THREE.MathUtils.degToRad(ry));
    if (rz) root.rotateZ(THREE.MathUtils.degToRad(rz));
    root.updateMatrixWorld(true);

    // Низ на низ слота после card rot (AABB уезжает).
    const box = new THREE.Box3().setFromObject(root);
    if (!box.isEmpty()) {
      const slotH = Math.max(Number(sizeMm?.y) || 0, 1);
      const c = box.getCenter(new THREE.Vector3());
      root.position.x -= c.x;
      root.position.z -= c.z;
      root.position.y += -slotH / 2 - box.min.y;
      root.updateMatrixWorld(true);
    }

    const mid = String(mergedSpec?.id ?? '').trim();
    root.userData = root.userData || {};
    root.userData.cldSupportLeg = true;
    root.userData.modelSpecId = mid;
    root.userData._cldCatalogRotApplied = true;
    root.userData._cldSupportLegPrepared = true;
    root.userData._cldSupportLegDebug = {
      id: mid,
      imp,
      cat: catSc,
      cardPos: { x: px, y: py, z: pz },
      cardRot: { x: rx, y: ry, z: rz },
      url: entry?.model || null,
    };
    if (typeof global !== 'undefined') {
      try {
        global.__cldLastSupportLegPrepare = root.userData._cldSupportLegDebug;
      } catch (_) {}
    }
    return root;
  }

  function finishPrepareWithCatalogCardTransform(root, entry, mergedSpec, flags) {
    const f = flags || {};
    if (f.jointHardware || f.jointTemplateModel || f.roomHandle) return;
    if (f.supportLegLike) return;
    applyCatalogCardOrientAfterPrepare(root, entry, mergedSpec, { force: true });
  }

  /** Реф CabinetModel._load_model: variant.params задаёт transform самой модели. */
  function applyCatalogEntryTransform(root, entry) {
    const THREE = getThree();
    if (!root || !THREE) return;
    const params = entry?.params && typeof entry.params === 'object' ? entry.params : {};
    const sc = catalogScaleVec(entry);
    if (sc && (sc.x !== 1 || sc.y !== 1 || sc.z !== 1)) {
      root.scale.multiply(new THREE.Vector3(sc.x, sc.y, sc.z));
    }
    const rot = params.rot && typeof params.rot === 'object' ? params.rot : {};
    const order = String(rot.order || 'XYZ').toUpperCase();
    root.rotation.set(
      THREE.MathUtils.degToRad(Number(rot.x) || 0),
      THREE.MathUtils.degToRad(Number(rot.y) || 0),
      THREE.MathUtils.degToRad(Number(rot.z) || 0),
      ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'].includes(order) ? order : 'XYZ',
    );
    const pos = params.pos && typeof params.pos === 'object' ? params.pos : {};
    root.position.set(
      Number(pos.x) || 0,
      Number(pos.y) || 0,
      Number(pos.z) || 0,
    );
    root.updateMatrixWorld(true);
  }

  function isEccentricJointTemplateModel(modelId, entry, mergedSpec) {
    const mid = String(modelId || mergedSpec?.id || '').trim();
    if (mid === '26') return true;
    const name = String(
      mergedSpec?.name || entry?.name || mergedSpec?.title || mergedSpec?.key || '',
    ).toLowerCase();
    const url = String(entry?.model || mergedSpec?.model || mergedSpec?.modelUrl || '').toLowerCase();
    if (name.includes('эксцентр') || name.includes('eccentric') || name.includes('eks')) return true;
    if (url.includes('excenric') || url.includes('excenter') || url.includes('eccentric')) return true;
    return false;
  }

  function recenterRootAtOrigin(root) {
    const THREE = getThree();
    if (!root || !THREE) return false;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return false;
    const c = box.getCenter(new THREE.Vector3());
    root.position.x -= c.x;
    root.position.y -= c.y;
    root.position.z -= c.z;
    root.updateMatrixWorld(true);
    return true;
  }

  /**
   * Крепёж в frame шаблона.
   * Конфирмат (origin на конце): min.x → 0, якорь furniture = наружная пласть O.
   * Эксцентрик (центрированный GLB / бочонок): центр бочонка в 0, затем развороты —
   * якорь furniture = отверстие в пласти (см. _pickJointTemplateFurnitureWorldOrigin).
   */
  function alignEccentricOriginToStudFaceEntry(root) {
    const THREE = getThree();
    if (!root || !THREE) return false;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return false;
    const cx = (box.min.x + box.max.x) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    const entryY = box.max.y;
    root.position.x -= cx;
    root.position.y -= entryY;
    root.position.z -= cz;
    root.updateMatrixWorld(true);
    root.userData._cldJointTemplateOriginMode = 'stud_face_entry';
    return true;
  }

  function alignJointTemplateModelOriginToMinX(root, options = {}) {
    const THREE = getThree();
    if (!root || !THREE) return;
    root.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;

    const sizeX = box.max.x - box.min.x;
    const centerX = (box.min.x + box.max.x) * 0.5;
    const wasCentered =
      box.min.x < -0.5 &&
      box.max.x > 0.5 &&
      Number.isFinite(sizeX) &&
      sizeX > 1 &&
      Math.abs(centerX) <= Math.max(1, sizeX * 0.15);

    root.userData = root.userData || {};

    if (wasCentered) {
      const isEccentric = !!options.isEccentric;
      if (isEccentric) {
        recenterRootAtOrigin(root);
        root.rotateX(Math.PI);
        root.rotateY(Math.PI);
        root.updateMatrixWorld(true);
        alignEccentricOriginToStudFaceEntry(root);
        root.userData._cldEccentricFlipped = 1;
        return;
      }
      // Прочий центрированный GLB (legacy).
      root.rotateY(Math.PI);
      root.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(root);
      const c = box.getCenter(new THREE.Vector3());
      root.position.x -= c.x;
      root.position.y -= c.y;
      root.position.z -= c.z;
      root.updateMatrixWorld(true);
      root.userData._cldJointTemplateFlipY180 = 1;
      root.userData._cldJointTemplateOriginMode = 'center_cam';
      return;
    }

    const minX = box.min.x;
    if (!Number.isFinite(minX) || Math.abs(minX) < 1e-4) {
      root.userData._cldJointTemplateOriginMode = 'end_minx';
      return;
    }
    root.position.x -= minX;
    root.updateMatrixWorld(true);
    root.userData._cldJointTemplateOriginShiftX = minX;
    root.userData._cldJointTemplateOriginMode = 'end_minx';
  }

  function prepareCabinetModelRoot(tpl, mergedSpec, entry, sizeMm, prepOpts) {
    const THREE = getThree();
    if (!THREE) return tpl;
    const root = tpl.clone(true);
    const modelId = String(mergedSpec?.id ?? mergedSpec?.key ?? '').trim();
    const hingeLike = modelId === '5' || modelId === '6';
    const guideLike =
      modelId === '7' ||
      modelId === '8' ||
      modelId === '9' ||
      modelId === '10' ||
      /направляющ|направл|guide|runner|telescop/i.test(
        String(mergedSpec?.key || mergedSpec?.name || ''),
      );
    const handleLike = modelId === '3';
    const supportLegLike =
      mergedSpec?.cldSupportLeg === true ||
      /опора|support.?leg|opora/i.test(String(mergedSpec?.key || mergedSpec?.name || '')) ||
      modelId === '2' ||
      modelId === '79' ||
      modelId === '80';
    const jointHardware =
      Number(mergedSpec?.joint_hardware) === 1 ||
      mergedSpec?.jointHardware === true ||
      mergedSpec?.skipCatalogRotation === true ||
      Number(mergedSpec?.fromJointScheme) === 1 ||
      mergedSpec?.fromJointScheme === true;
    const jointTemplateModel =
      Number(mergedSpec?.joint_template_model) === 1 ||
      mergedSpec?.jointTemplateModel === true;
    const sizeMmLooksEmpty =
      !(Number(sizeMm?.x) > 0.5) &&
      !(Number(sizeMm?.y) > 0.5) &&
      !(Number(sizeMm?.z) > 0.5);
    const keepNativeJointScale =
      jointTemplateModel || jointHardware || (mergedSpec?.fitToSize === false && sizeMmLooksEmpty);
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData.isAccessory = true;
        if (jointTemplateModel || jointHardware) {
          o.userData.fromJointScheme = 1;
          o.userData.jointHardwareMesh = true;
          o.userData.joint_hardware = 1;
          // IKEA_PORT: не whiteCorpus — цвет из GLB / model_key_material.
          o.userData.ikeaPortMatRole = 'none';
          o.userData.cldSkipStep5FacadeDecor = true;
          if (jointTemplateModel) o.userData.jointTemplateModel = 1;
        }
        if (hingeLike) {
          o.userData.cldSkipStep5FacadeDecor = true;
          o.userData.isHingeCabinetModelMetal = true;
          o.userData.cldHingeCatalogModel = true;
        }
        if (guideLike) o.userData.cldGuideCabinetModel = true;
      }
      if (o.isMesh || o.isGroup) {
        if (hingeLike) o.userData.cldSkipStep5FacadeDecor = true;
        if (guideLike) o.userData.cldGuideCabinetModel = true;
      }
    });
    root.userData = root.userData || {};
    if (modelId) root.userData.modelSpecId = modelId;
    if (jointTemplateModel || jointHardware) {
      root.userData.fromJointScheme = 1;
      root.userData.jointHardwareMesh = true;
      root.userData.isAccessory = true;
    }
    if (hingeLike) root.userData.cldSkipStep5FacadeDecor = true;
    if (guideLike) root.userData.cldGuideCabinetModel = true;
    const refMm =
      readPositiveRefMm(mergedSpec.preview_ref_mm) ||
      readPositiveRefMm(mergedSpec.ref_size_mm) ||
      readPositiveRefMm(entry?.preview_ref_mm) ||
      null;
    const fitToSize =
      mergedSpec.fitToSize === true ||
      mergedSpec.fit_to_size === 1 ||
      (mergedSpec.resizable && Number(mergedSpec.resizable.enabled) === 1);
    const roomHandle =
      mergedSpec.roomHandle === true ||
      mergedSpec.room_handle === true;
    root.scale.set(1, 1, 1);
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);

    // Контракт: опора XOR стык. Опора — PlanPlace/fallback. Стык не входит сюда.
    if (supportLegLike && !jointHardware && !jointTemplateModel) {
      const ppApi = global.__cldPlanPlaceLoadModel;
      if (ppApi && typeof ppApi.buildPlanPlaceOwnObject === 'function') {
        const own = ppApi.buildPlanPlaceOwnObject({
          tpl,
          entry,
          spec: mergedSpec,
          sizeMm,
          treeRotDeg: prepOpts?.treeRotDeg || prepOpts?.treeRot || {},
          pivot: prepOpts?.pivot || {},
          supportLeg: true,
        });
        if (own) {
          own.userData = own.userData || {};
          own.userData.cldSupportLeg = true;
          if (modelId) own.userData.modelSpecId = modelId;
          own.userData._cldSupportLegPrepared = true;
          return own;
        }
      }
      return prepareKitchenSupportLegRoot(root, mergedSpec, entry, sizeMm);
    }

    // Тело «1.9 крепеж ок» — порядок scale → jointTemplate → keepNative обязателен.
    if (handleLike && fitToSize && !roomHandle) {
      const impH = inferFileToMmScaleFromMeshes(root, mergedSpec);
      root.scale.setScalar(impH);
      root.updateMatrixWorld(true);
      storeCatalogEntryRotation(root, entry);
      scaleHandleVolnaToPrepMm(root, cardSizeMmForHandlePrep(entry, sizeMm));
      root.userData._cldHandleScalePrepared = true;
      root.userData._cldCatalogRotApplied = true;
      return root;
    }

    const entryParams = entry?.params && typeof entry.params === 'object' ? entry.params : {};
    const meshMap = entryParams.meshes || null;
    const useWholeSlotFit = slotFitHasRules(readSlotFit(entryParams));
    const useMeshVertexSizing = !useWholeSlotFit && meshMapHasSizeRules(meshMap);

    const imp = inferFileToMmScale(root, mergedSpec);
    root.scale.setScalar(imp);
    root.updateMatrixWorld(true);

    if (jointTemplateModel) {
      applyCatalogEntryTransform(root, entry);
      const isHingeHalf = modelId === '5' || modelId === '6';
      if (!isHingeHalf) {
        alignJointTemplateModelOriginToMinX(root, {
          isEccentric: isEccentricJointTemplateModel(modelId, entry, mergedSpec),
        });
      } else {
        root.userData = root.userData || {};
        root.userData._cldJointTemplateOriginMode = 'catalog_card';
      }
      return root;
    }

    if (keepNativeJointScale) {
      centerOnlyKeepScale(root);
      return root;
    }

    if (useMeshVertexSizing) {
      bakeMeshesToRootLocal(root);
      root.scale.set(1, 1, 1);
      root.position.set(0, 0, 0);
      root.updateMatrixWorld(true);
      const slotMm = resolveSlotTargetSizeMm(sizeMm, refMm);
      applyCabinetModelMeshVertexSizing(root, entryParams, slotMm);
      // Как админка (CabinetModelNode): после mesh s/t — ещё NonUniformFit в слот Size.
      // Иначе Gola (s.x=1, y/z=0) остаётся с нативным Z ≈ 0 и в комнате не видна.
      if (
        fitToSize &&
        !roomHandle &&
        !jointHardware &&
        wantsNonUniformSlotFit(mergedSpec, slotMm || sizeMm)
      ) {
        scaleNonUniformToSizeMm(root, slotMm || sizeMm);
      }
      if (!roomHandle && !jointHardware) {
        storeCatalogEntryRotation(root, entry);
      }
      return root;
    }

    if (useWholeSlotFit) {
      if (!roomHandle) {
        const catSc = catalogScaleVec(entry);
        if (catSc && (catSc.x !== 1 || catSc.y !== 1 || catSc.z !== 1)) {
          root.scale.multiply(new THREE.Vector3(catSc.x, catSc.y, catSc.z));
          root.updateMatrixWorld(true);
        }
      }
      applyWholeObjectSlotFit(root, entryParams, resolveSlotTargetSizeMm(sizeMm, refMm));
      if (!roomHandle && !jointHardware) {
        storeCatalogEntryRotation(root, entry);
      }
      return root;
    }

    if (jointHardware) {
      centerOnlyKeepScale(root);
      return root;
    }

    const hangFromTop =
      mergedSpec?.isRodCompanion === true && mergedSpec?.rodHangFromTop === true;
    if (mergedSpec?.rodHangStrip === true) root.userData.rodHangStrip = true;
    if (refMm) {
      if (hangFromTop) scaleAndHangFromTopMm(root, refMm);
      else scaleAndCenterToRefMm(root, refMm);
    } else if (fitToSize && roomHandle) {
      const imp2 = inferFileToMmScale(root, mergedSpec);
      if (imp2 !== 1) {
        root.scale.multiplyScalar(imp2);
        root.updateMatrixWorld(true);
      }
      centerOnlyKeepScale(root);
    } else if (fitToSize) {
      if (hangFromTop) scaleAndHangFromTopMm(root, sizeMm);
      else if (wantsNonUniformSlotFit(mergedSpec, sizeMm)) scaleNonUniformToSizeMm(root, sizeMm);
      else scaleAndCenterToRefMm(root, sizeMm);
    } else if (hangFromTop) {
      root.updateMatrixWorld(true);
      const boxHang = new THREE.Box3().setFromObject(root);
      if (!boxHang.isEmpty()) {
        const cHang = boxHang.getCenter(new THREE.Vector3());
        root.position.set(-cHang.x, -boxHang.max.y, -cHang.z);
      }
    } else {
      centerOnlyKeepScale(root);
    }
    if (mergedSpec?.rodHangStrip === true) {
      const usable = Number(mergedSpec.rodHangStripUsableMm) || 0;
      const maxH = Number(mergedSpec.rodHangStripMaxHang) || 0;
      if (usable > 0) clipHangStripToRodRealSizeMm(root, usable, THREE, maxH);
    }
    if (!roomHandle) {
      const catSc = catalogScaleVec(entry);
      if (catSc && (catSc.x !== 1 || catSc.y !== 1 || catSc.z !== 1)) {
        root.scale.multiply(new THREE.Vector3(catSc.x, catSc.y, catSc.z));
        root.updateMatrixWorld(true);
        centerOnlyKeepScale(root);
      }
      storeCatalogEntryRotation(root, entry);
    }
    return root;
  }


  /**
   * Универсальный мост: для любого узла type:'model' с spec.id из каталога cabinet_model
   * пытается загрузить GLB/FBX и подменить плейсхолдер. Используется и в комнате,
   * и в админ-превью, и под фурнитуру (петли/направляющие/ручки) — у них тот же контракт:
   * spec.id → запись в cabinet_model → models[].model (URL) + ref/fitToSize.
   */

  function clearRodCompanionsUnder(group) {
    if (!group?.children?.length) return;
    const remove = [];
    for (let i = 0; i < group.children.length; i++) {
      const ch = group.children[i];
      if (!ch) continue;
      if (ch.userData?.isRodCompanion || String(ch.name || '').startsWith('rod_companion_')) {
        remove.push(ch);
      }
    }
    for (const ch of remove) {
      group.remove(ch);
      // Полоса одежды шарит материалы с кешем GLB — dispose только geometry.
      const sharedMats = ch.userData?.__cldShareMaterials === true;
      ch.traverse?.((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (sharedMats) return;
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => m?.dispose?.());
      });
    }
  }

  /**
   * Пустые плечики #23 — как в рабочем cabinet_model до пула одежды
   * (1.50/1.51: step 70, margin 140, offset.y -84, size 430×200×30).
   */
  const EMPTY_ROD_HANGER_COMPANIONS = Object.freeze({
    modelId: '23',
    modelIds: Object.freeze(['23']),
    stepMm: 70,
    marginMm: 140,
    size: Object.freeze({ x: 430, y: 200, z: 30 }),
    offset: Object.freeze({ x: 0, y: -84, z: 3 }),
    rot: Object.freeze({ x: 0, y: 70, z: 0 }),
  });

  /**
   * Плечики на штанге в комнате — тот же __cldRodCompanions, что в превью админки.
   * unitsMm=1: ClodisBuilder уже в мм.
   * Шаг 7: wardrobe-5 short (#77) / long (#78), как collection: strip + rot.y=0.
   */
  function adaptCompanionsCfgForRoomStep(cfg, hangKind) {
    if (!cfg || !cfg.enabled) return cfg;
    const step =
      typeof global !== 'undefined' && global.currentRoomStep != null
        ? Number(global.currentRoomStep)
        : 0;
    let step7Clothing = true;
    try {
      if (typeof global.__cldRoomStep7RodClothingEnabled === 'function') {
        step7Clothing = global.__cldRoomStep7RodClothingEnabled() === true;
      }
    } catch (_) {
      step7Clothing = true;
    }
    if (step === 7 && step7Clothing) {
      const kind = String(hangKind || '').toLowerCase() === 'long' ? 'long' : 'short';
      const modelId = kind === 'long' ? '78' : '77';
      const sizeY = kind === 'long' ? 1400 : 1050;
      return {
        ...cfg,
        modelId,
        modelIds: [modelId],
        stepMm: 100000,
        marginMm: 40,
        rot: { x: 0, y: 0, z: 0 },
        offset: {
          x: 0,
          y: 11,
          z: 3,
        },
        size: { x: 0, y: sizeY, z: 380 },
        rodHangStrip: true,
        rodHangStripMaxHang: 0,
      };
    }
    const e = EMPTY_ROD_HANGER_COMPANIONS;
    return {
      ...cfg,
      modelId: e.modelId,
      modelIds: [...e.modelIds],
      stepMm: e.stepMm,
      marginMm: e.marginMm,
      size: { x: e.size.x, y: e.size.y, z: e.size.z },
      offset: { x: e.offset.x, y: e.offset.y, z: e.offset.z },
      rot: { x: e.rot.x, y: e.rot.y, z: e.rot.z },
      /** Центр bbox + offset.y=-84, не hang-from-top (тот для одежды на шаге 7). */
      emptyHangerMode: true,
    };
  }

  function spawnRodCompanionsForRoomAttach(opts) {
    const rodApi = global.__cldRodCompanions;
    const THREE = getThree();
    if (!rodApi?.parseRodCompanionsConfig || !rodApi.spawnRodCompanionsIntoOwnObject || !THREE) {
      return Promise.resolve(0);
    }
    const contentGroup = opts?.contentGroup;
    const root = opts?.root;
    const mergedSpec = opts?.mergedSpec || {};
    const entry = opts?.entry || null;
    const sizeMm = opts?.sizeMm || {};
    const isStale = typeof opts?.isStale === 'function' ? opts.isStale : () => false;
    if (!contentGroup || !root || isStale()) return Promise.resolve(0);

    const entryParams =
      entry?.params && typeof entry.params === 'object' ? entry.params : null;
    let companionsCfg = rodApi.parseRodCompanionsConfig(mergedSpec, entryParams);
    if (!companionsCfg?.enabled) return Promise.resolve(0);

    contentGroup.userData = contentGroup.userData || {};
    contentGroup.userData.cldRodCompanionAttach = {
      mergedSpec,
      entry,
      sizeMm: {
        x: Number(sizeMm.x) || 0,
        y: Number(sizeMm.y) || 0,
        z: Number(sizeMm.z) || 0,
      },
      buildEpoch: Number(opts?.buildEpoch) || 0,
    };

    companionsCfg = adaptCompanionsCfgForRoomStep(
      companionsCfg,
      mergedSpec?.rodHangStripKind || mergedSpec?.rod_hang_strip_kind || contentGroup?.userData?.rodHangStripKind,
    );
    clearRodCompanionsUnder(contentGroup);

    return ensureCabinetModelLibraryMap().then((libMap) => {
      if (isStale()) return 0;
      return rodApi.spawnRodCompanionsIntoOwnObject({
        rodGroup: contentGroup,
        rodMesh: root,
        rodWidthMm: Number(sizeMm.x) || 0,
        config: companionsCfg,
        catalogMap: libMap,
        THREE,
        unitsMm: 1,
        markPreviewOnly: false,
        epoch: Number(opts?.buildEpoch) || 0,
        isEpochStale: isStale,
        loadAsset: (url) => loadAssetRootOnce(resolveAssetUrl(String(url || '').trim())),
        prepareRoot: (tpl, ms, ent, sm) => prepareCabinetModelRoot(tpl, ms, ent, sm),
        applyMaterials: async (prepared, ms, ent) => {
          const THREE = getThree();
          if (!prepared || !THREE) return;
          prepared.traverse((o) => {
            if (!o?.isMesh) return;
            o.userData = o.userData || {};
            o.userData.isRodCompanion = true;
            o.userData.isAccessory = true;
          });
          const id = String(ms?.id || '').trim();
          // Пустая вешалка #23: Derevo + MeshBasic (unlit). MeshStandard без IKEA-шейдера → чёрный.
          if (id === '23') {
            const patched = patchEmptyHangerMaterialEntry(ent);
            await applyRoomCabinetModelMaterials(prepared, ms, patched);
            const shelfApi = global.__cldShelfProps;
            if (shelfApi?.waitForTextureMaps && shelfApi.applyShelfPropFabricLook) {
              await shelfApi.waitForTextureMaps(prepared, 8000);
              shelfApi.applyShelfPropFabricLook(prepared, THREE, null, 'rod');
            }
            // Запасной цвет дерева, если карта/каталог не подтянулись.
            prepared.traverse((o) => {
              if (!o?.isMesh || !o.material) return;
              const mats = Array.isArray(o.material) ? o.material : [o.material];
              mats.forEach((m) => {
                if (!m) return;
                if (m.map) return;
                const c = m.color;
                const dark = !c || c.r + c.g + c.b < 0.08;
                if (dark) m.color = new THREE.Color(0xb08968);
                m.needsUpdate = true;
              });
            });
            return;
          }
          const shelfApi = global.__cldShelfProps;
          if (shelfApi?.waitForTextureMaps && shelfApi.applyShelfPropFabricLook) {
            await shelfApi.waitForTextureMaps(prepared, 8000);
            shelfApi.applyShelfPropFabricLook(
              prepared,
              THREE,
              ms?.fabric_tint || ms?.fabricTint,
              'rod',
            );
            return;
          }
          return applyRoomCabinetModelMaterials(prepared, ms, null);
        },
      });
    });
  }

  /** #23: meshes.Veshalka.material_id=5 конфликтует с петлёй — токен = material_key/m. */
  function patchEmptyHangerMaterialEntry(entry) {
    const params = entry?.params;
    const meshes = params?.meshes;
    if (!meshes || typeof meshes !== 'object') return entry;
    const outMeshes = {};
    let changed = false;
    Object.keys(meshes).forEach((k) => {
      const cfg = meshes[k];
      if (!cfg || typeof cfg !== 'object') {
        outMeshes[k] = cfg;
        return;
      }
      const key = String(cfg.material_key || cfg.material || cfg.m || '').trim();
      const mid = String(cfg.material_id ?? cfg.selected ?? '').trim();
      if (key && (mid === '5' || mid === '6' || mid === '7')) {
        outMeshes[k] = { ...cfg, material_id: key, selected: key };
        changed = true;
      } else {
        outMeshes[k] = cfg;
      }
    });
    if (!changed) return entry;
    return {
      ...entry,
      params: {
        ...params,
        meshes: outMeshes,
      },
    };
  }

  function resyncAllRoomRodCompanions(scene) {
    const root =
      scene ||
      (typeof global !== 'undefined' ? global.__cldRoomScene : null) ||
      null;
    if (!root || typeof root.traverse !== 'function') return Promise.resolve(0);
    const rodApi = global.__cldRodCompanions;
    const THREE = getThree();
    const hosts = [];
    root.traverse((o) => {
      if (!o?.userData?.cldRodCompanionAttach) return;
      hosts.push(o);
    });
    if (!hosts.length) return Promise.resolve(0);

    /** Одна штанга за раз + пауза Soft: иначе Crashpad на шаге 7. */
    const ROD_RESYNC_GAP_MS = 280;
    try {
      if (global.state) global.state._cldPauseLifestyleGpu = true;
    } catch (_) {}
    let total = 0;
    let chain = Promise.resolve();
    hosts.forEach((contentGroup) => {
      chain = chain.then(() => {
        if (!contentGroup?.parent) return 0;
        const stash = contentGroup.userData.cldRodCompanionAttach;
        const rodMesh =
          contentGroup.children &&
          contentGroup.children.find(
            (c) => c && !String(c.name || '').startsWith('rod_companion_'),
          );
        if (!rodMesh || !stash) return 0;
        let sizeMm = {
          x: Number(stash.sizeMm?.x) || 0,
          y: Number(stash.sizeMm?.y) || 0,
          z: Number(stash.sizeMm?.z) || 0,
        };
        if (rodApi?.resolveRodBarAnchorMm && THREE) {
          try {
            const live = rodApi.resolveRodBarAnchorMm(
              rodMesh,
              contentGroup,
              sizeMm.x,
              THREE,
              1,
            );
            const liveW = Number(live?.spanMm) || 0;
            if (liveW > 80) sizeMm = { ...sizeMm, x: liveW };
          } catch (_) {}
        }
        return spawnRodCompanionsForRoomAttach({
          contentGroup,
          root: rodMesh,
          mergedSpec: stash.mergedSpec || {},
          entry: stash.entry || null,
          sizeMm,
          buildEpoch: Number(stash.buildEpoch) || 0,
          isStale: () => !contentGroup.parent,
        }).then((n) => {
          total += Number(n) || 0;
          return new Promise((r) => setTimeout(r, ROD_RESYNC_GAP_MS));
        });
      });
    });
    return chain
      .finally(() => {
        try {
          if (global.state) global.state._cldPauseLifestyleGpu = false;
        } catch (_) {}
      })
      .then(() => total);
  }

  /**
   * @param {object} opts
   * @param {THREE.Group} opts.contentGroup — узел с conv_pivot (дочерний group)
   * @param {THREE.Mesh} [opts.placeholderMesh]
   * @param {object} opts.spec — item.spec (id, key, …)
   * @param {{x:number,y:number,z:number}} opts.sizeMm
   * @param {number} opts.buildEpoch — отмена устаревших загрузок
   */
  function attachCabinetModelToGroup(opts) {
    const contentGroup = opts?.contentGroup;
    const placeholderMesh = opts?.placeholderMesh;
    const nodeSpec = opts?.spec && typeof opts.spec === 'object' ? opts.spec : {};
    const sizeMm = opts?.sizeMm || { x: 70, y: 100, z: 70 };
    const buildEpoch = Number(opts?.buildEpoch) || 0;
    const parentGroup = opts?.parentGroup;

    if (!contentGroup) return;

    const isStale = () =>
      !contentGroup.parent ||
      (parentGroup && parentGroup.userData && Number(parentGroup.userData._cldModelEpoch) !== buildEpoch);

    ensureCabinetModelLibraryMap().then((map) => {
      if (isStale()) return;
      const id = nodeSpec.id != null ? String(nodeSpec.id).trim() : '';
      let mergedSpec = { ...nodeSpec };
      if (id && map && map[id] && map[id].params) {
        mergedSpec = shallowMergeParams(map[id].params, nodeSpec);
        mergedSpec.id = id;
      }
      if (!mergedSpec.name && nodeSpec.name) mergedSpec.name = nodeSpec.name;
      if (!mergedSpec.name && parentGroup?.name) {
        const pn = String(parentGroup.name || '').replace(/^Model_/i, '');
        if (pn) mergedSpec.name = pn;
      }
      const entry = pickCabinetModelVariant(mergedSpec, sizeMm);
      const urlRaw = entry?.model || mergedSpec.modelUrl || mergedSpec.model || '';
      const url = resolveAssetUrl(String(urlRaw || '').trim());
      const supportLegLike =
        isKitchenSupportLegSpec(mergedSpec) ||
        !!parentGroup?.userData?.cldSupportLeg ||
        mergedSpec?.cldSupportLeg === true;
      const hidePlaceholder = () => {
        hideHingeCatalogPlaceholder(placeholderMesh, parentGroup);
        if (placeholderMesh && supportLegLike) {
          try {
            placeholderMesh.visible = false;
            if (placeholderMesh.parent) placeholderMesh.parent.remove(placeholderMesh);
          } catch (_) {}
        }
      };
      if (!url) {
        hidePlaceholder();
        return;
      }

      loadAssetRootOnce(url).then((tpl) => {
        if (isStale()) return;
        if (!tpl) {
          hidePlaceholder();
          try {
            console.warn('[CLD] cabinet model GLB failed', url, mergedSpec?.id);
          } catch (_) {}
          return;
        }

        // Один вход. PlanPlace только внутри prepare для опор.
        // Стык = тело 1.9. Без applyCatalogCardOrientAfterPrepare снаружи.
        const root = prepareCabinetModelRoot(tpl, mergedSpec, entry, sizeMm, {
          pivot: opts?.pivot || null,
          treeRot: opts?.treeRot || null,
        });
        if (!root) {
          hidePlaceholder();
          return;
        }
        return applyRoomCabinetModelMaterials(root, mergedSpec, entry)
          .catch((err) => {
            try {
              console.warn('[CLD] cabinet model materials failed', err);
            } catch (_) {}
          })
          .then(() => {
            if (isStale()) return;
            if (parentGroup && root.userData?.cldCabinetMaterialParams) {
              stampCatalogMaterialOnNode(
                parentGroup,
                root.userData.cldCabinetMaterialToken,
                root.userData.cldCabinetMaterialParams,
              );
              const mid = String(mergedSpec?.id ?? parentGroup.userData?.modelSpecId ?? '').trim();
              if (mid === '5' || mid === '6') {
                parentGroup.userData.cldHingeCatalogModel = true;
                parentGroup.userData.isHingeCabinetModelMetal = true;
                try {
                  root.traverse((o) => {
                    if (!o) return;
                    o.userData = o.userData || {};
                    o.userData.cldHingeCatalogModel = true;
                    o.userData.isHingeCabinetModelMetal = true;
                    if (mid) o.userData.modelSpecId = mid;
                  });
                } catch (_) {}
              }
            }
            if (placeholderMesh && placeholderMesh.parent) {
              placeholderMesh.parent.remove(placeholderMesh);
              if (placeholderMesh.geometry) placeholderMesh.geometry.dispose();
              if (placeholderMesh.material) placeholderMesh.material.dispose();
            }
            contentGroup.add(root);
            try {
              if (supportLegLike || root.userData?.cldSupportLeg) {
                root.userData = root.userData || {};
                root.userData.cldSupportLeg = true;
                if (parentGroup) parentGroup.userData.cldSupportLeg = true;
                root.traverse((o) => {
                  if (!o) return;
                  o.userData = o.userData || {};
                  o.userData.cldSupportLeg = true;
                  o.userData.cldSkipStep5FacadeDecor = true;
                  if (parentGroup?.userData?.modelSpecId) {
                    o.userData.modelSpecId = String(parentGroup.userData.modelSpecId);
                  }
                });
              }
            } catch (_) {}
            try {
              const pud = parentGroup?.userData || {};
              if (
                pud.fromJointScheme ||
                Number(pud.jointTemplateModel) === 1 ||
                Number(pud.joint_hardware) === 1 ||
                Number(mergedSpec?.joint_template_model) === 1 ||
                Number(mergedSpec?.joint_hardware) === 1
              ) {
                root.userData = root.userData || {};
                root.userData.fromJointScheme = 1;
                root.userData.jointHardwareMesh = true;
                root.userData.isAccessory = true;
                root.traverse((o) => {
                  if (!o?.userData) return;
                  o.userData.fromJointScheme = 1;
                  o.userData.jointHardwareMesh = true;
                  o.userData.isAccessory = true;
                  o.userData.ikeaPortMatRole = 'none';
                  o.userData.cldSkipStep5FacadeDecor = true;
                });
                if (
                  typeof window !== 'undefined' &&
                  typeof window.__cldRefreshRoomFurnitureXray === 'function'
                ) {
                  window.__cldRefreshRoomFurnitureXray();
                }
              }
            } catch (_) {}
            return spawnRodCompanionsForRoomAttach({
              contentGroup,
              root,
              mergedSpec,
              entry,
              sizeMm,
              buildEpoch,
              isStale,
            }).then((spawned) => {
              if (isStale()) return;
              if (spawned > 0 && typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
                console.warn('[CLD][ROD] плечики в комнате', { modelId: id, spawned });
              }
              const rebindRoot = (function findFurnitureRoot() {
                let p = parentGroup || contentGroup;
                for (let i = 0; i < 32 && p; i++) {
                  if (p.isGroup && p.userData?.isFurniture) return p;
                  p = p.parent;
                }
                return parentGroup || contentGroup;
              })();
              try {
                if (typeof window.__cldSnapNicheFurnitureRoot === 'function') {
                  window.__cldSnapNicheFurnitureRoot(rebindRoot);
                }
              } catch (_) {}
              if (
                supportLegLike ||
                root.userData?.cldSupportLeg ||
                rebindRoot?.userData?.cldSupportLeg
              ) {
                try {
                  if (typeof window.__cldSnapFurnitureFloorY === 'function') {
                    window.__cldSnapFurnitureFloorY(rebindRoot);
                  } else if (typeof window.__cldSnapFurniturePlacementY === 'function') {
                    const secId = rebindRoot?.userData?.sectionId;
                    const sec = (window.state?.customSections || []).find(
                      (s) => s && s.id === secId,
                    );
                    window.__cldSnapFurniturePlacementY(rebindRoot, sec || null);
                  }
                } catch (_) {}
              }
              try {
                if (typeof window.__cldScheduleCabinetStudioRebind === 'function') {
                  window.__cldScheduleCabinetStudioRebind(rebindRoot);
                } else if (typeof window.__cldApplyRoomCabinetStudioLook === 'function') {
                  window.__cldApplyRoomCabinetStudioLook(rebindRoot);
                }
              } catch (_) {}
              if (
                parentGroup?.userData?.cldHingeCatalogModel &&
                (String(parentGroup.userData.modelSpecId || '').trim() === '5' ||
                  String(parentGroup.userData.modelSpecId || '').trim() === '6') &&
                typeof global.ClodisBuilder?.refinalizeHingeAfterCatalogModelLoaded === 'function'
              ) {
                const pg = parentGroup;
                requestAnimationFrame(() => {
                  if (!pg.parent) return;
                  global.ClodisBuilder.refinalizeHingeAfterCatalogModelLoaded(pg);
                  try {
                    if (typeof window.__cldSnapNicheFurnitureRoot === 'function') {
                      window.__cldSnapNicheFurnitureRoot(pg);
                    }
                  } catch (_) {}
                  try {
                    if (typeof window.__cldScheduleCabinetStudioRebind === 'function') {
                      window.__cldScheduleCabinetStudioRebind(pg);
                    } else if (typeof window.__cldApplyRoomCabinetStudioLook === 'function') {
                      window.__cldApplyRoomCabinetStudioLook(pg);
                    }
                  } catch (_) {}
                });
              }
            });
          });
      });
    });
  }


  /**
   * Высокоуровневый API для произвольной фурнитуры (петли, направляющие, ручки):
   * по spec.id из каталога cabinet_model возвращает готовый clone(true) корня модели,
   * уже промасштабированный под sizeMm. Возвращает null, если в каталоге нет URL.
   * Подходит для legacy-Furniture/Accessory модулей, которые сами добавляют меш в свою группу.
   *
   * @param {{ spec: object, sizeMm: {x:number,y:number,z:number} }} opts
   * @returns {Promise<THREE.Object3D|null>}
   */
  function resolveCabinetModel(opts) {
    const nodeSpec = opts?.spec && typeof opts.spec === 'object' ? opts.spec : {};
    const sizeMm = opts?.sizeMm || { x: 100, y: 100, z: 100 };
    return ensureCabinetModelLibraryMap().then((map) => {
      const id = nodeSpec.id != null ? String(nodeSpec.id).trim() : '';
      let mergedSpec = { ...nodeSpec };
      if (id && map && map[id] && map[id].params) {
        mergedSpec = shallowMergeParams(map[id].params, nodeSpec);
        mergedSpec.id = id;
      }
      const entry = pickCabinetModelVariant(mergedSpec, sizeMm);
      const urlRaw = entry?.model || mergedSpec.modelUrl || mergedSpec.model || '';
      const url = resolveAssetUrl(String(urlRaw || '').trim());
      if (!url) return null;
      return loadAssetRootOnce(url).then((tpl) => {
        if (!tpl) return null;
        const root = prepareCabinetModelRoot(tpl, mergedSpec, entry, sizeMm);
        return applyRoomCabinetModelMaterials(root, mergedSpec, entry).then(() => root);
      });
    });
  }

  /**
   * Адаптер для legacy-аксессуаров (петли/направляющие/ручки), где id модели лежит,
   * например, в `accessory.modelId` или `accessory.cabinet_model_id`.
   * Универсально пробует все поля; вернёт null, если ничего не найдено.
   */
  function resolveAccessoryModel(accessory, sizeMm) {
    if (!accessory || typeof accessory !== 'object') return Promise.resolve(null);
    const candidates = [
      accessory.cabinet_model_id,
      accessory.cabinetModelId,
      accessory.modelId,
      accessory.model_id,
      accessory.spec?.id,
      accessory.spec?.cabinet_model_id,
      accessory.spec?.cabinetModelId,
      accessory.spec?.modelId,
    ];
    const id = candidates.find((v) => v != null && String(v).trim() !== '');
    if (id == null) return Promise.resolve(null);
    return resolveCabinetModel({
      spec: { ...(accessory.spec || {}), id: String(id) },
      sizeMm,
    });
  }

  function getCabinetModelPriceMeta(modelId) {
    const id = String(modelId ?? '').trim();
    if (!id || !__libCache) return null;
    const e = __libCache[id];
    if (!e) return null;
    return {
      id,
      name: e.name || '',
      price: Number(e.price) || 0,
      count: Math.max(1, Number(e.count) || 1),
      show_in_spec: Number(e.show_in_spec) ? 1 : 0,
      price_type: e.price_type || 'p',
      category: e.category || '',
    };
  }

  function invalidateLibraryCache() {
    __libCache = null;
    __libPromise = null;
    try {
      clearAssetRootCache();
    } catch (_) {}
  }

  // Админка после save зовёт __cldInvalidateCabinetModelLibraryCache.
  global.__cldInvalidateCabinetModelLibraryCache = invalidateLibraryCache;

  /**
   * Админ-форма models3d: scale в UI = 1 → в каталоге 100 (%).
   * Собирает entry.params как для реф _load_model / prepareCabinetModelRoot.
   */
  function buildCatalogEntryFromAdminTransform(userTransform, modelParams) {
    const tr = userTransform && typeof userTransform === 'object' ? userTransform : {};
    const mp = modelParams && typeof modelParams === 'object' ? { ...modelParams } : {};
    const sc = tr.scale && typeof tr.scale === 'object' ? tr.scale : {};
    const pos = tr.position && typeof tr.position === 'object' ? tr.position : {};
    const rot = tr.rotation && typeof tr.rotation === 'object' ? tr.rotation : {};
    const sx = Number(sc.x);
    const sy = Number(sc.y);
    const sz = Number(sc.z);
    mp.scale = {
      x: (Number.isFinite(sx) && sx > 0 ? sx : 1) * 100,
      y: (Number.isFinite(sy) && sy > 0 ? sy : 1) * 100,
      z: (Number.isFinite(sz) && sz > 0 ? sz : 1) * 100,
    };
    mp.pos = {
      x: Number(pos.x) || 0,
      y: Number(pos.y) || 0,
      z: Number(pos.z) || 0,
    };
    mp.rot = {
      x: Number(rot.x) || 0,
      y: Number(rot.y) || 0,
      z: Number(rot.z) || 0,
      order: String(rot.order || mp.rot?.order || 'XYZ'),
    };
    return { params: mp, model: mp.model || null };
  }

  /**
   * Стыковой крепёж: если после place остался ModelPlaceholder — GLB не доехал (stale epoch).
   * Перезапускаем attach. Возвращает число перезапусков.
   */
  function ensureJointHardwareGlbsAttached(furnitureRoot) {
    if (!furnitureRoot || typeof furnitureRoot.traverse !== 'function') return 0;
    let n = 0;
    const groups = [];
    furnitureRoot.traverse((o) => {
      if (!o?.isGroup || !o.userData) return;
      const ud = o.userData;
      if (!ud.isCabinetModel) return;
      if (
        !(
          ud.fromJointScheme ||
          Number(ud.jointTemplateModel) === 1 ||
          Number(ud.joint_hardware) === 1
        )
      ) {
        return;
      }
      groups.push(o);
    });
    for (const group of groups) {
      let placeholder = null;
      let hasGlb = false;
      for (let i = 0; i < (group.children || []).length; i++) {
        const ch = group.children[i];
        if (!ch) continue;
        if (/^ModelContent_/i.test(String(ch.name || ''))) {
          ch.traverse((m) => {
            if (!m?.isMesh) return;
            if (/^ModelPlaceholder_/i.test(String(m.name || ''))) placeholder = m;
            else if (m.userData?.jointHardwareMesh || m.userData?.fromJointScheme) {
              if (!/^ModelPlaceholder_/i.test(String(m.name || ''))) hasGlb = true;
            }
          });
        }
      }
      if (hasGlb || !placeholder) continue;
      const content =
        placeholder.parent ||
        group.children.find((c) => /^ModelContent_/i.test(String(c?.name || '')));
      if (!content) continue;
      const specId = String(group.userData.modelSpecId || group.userData.spec?.id || '').trim();
      if (!specId) continue;
      group.userData._cldModelEpoch = (Number(group.userData._cldModelEpoch) || 0) + 1;
      const epoch = group.userData._cldModelEpoch;
      console.warn('[CLD][PARITY] re-attach joint GLB', {
        name: group.name,
        id: specId,
        epoch,
      });
      attachCabinetModelToGroup({
        contentGroup: content,
        placeholderMesh: placeholder,
        parentGroup: group,
        spec: {
          id: specId,
          fitToSize: false,
          fromJointScheme: 1,
          joint_hardware: 1,
          joint_template_model: 1,
        },
        sizeMm: { x: 0, y: 0, z: 0 },
        pivot: {},
        treeRot: {},
        usePlanPlace: false,
        buildEpoch: epoch,
      });
      n += 1;
    }
    return n;
  }

  global.__cldRoomCabinetModels = {
    attachCabinetModelToGroup,
    ensureCabinetModelLibraryMap,
    ensureJointHardwareGlbsAttached,
    prepareCabinetModelRoot,
    buildCatalogEntryFromAdminTransform,
    resolveCabinetModel,
    resolveAccessoryModel,
    applyStoredCatalogRotation,
    loadAssetRootOnce,
    resolveAssetUrl,
    clearAssetRootCache,
    applyRoomCabinetModelMaterials,
    spawnRodCompanionsForRoomAttach,
    resyncAllRoomRodCompanions,
    clearRodCompanionsUnder,
    getCabinetModelPriceMeta,
    invalidateLibraryCache,
  };
  if (typeof window !== 'undefined') {
    window.__cldEnsureJointHardwareGlbs = (root) => {
      const api = global.__cldRoomCabinetModels;
      return api && typeof api.ensureJointHardwareGlbsAttached === 'function'
        ? api.ensureJointHardwareGlbsAttached(root)
        : 0;
    };
  }
})(typeof window !== 'undefined' ? window : global);
