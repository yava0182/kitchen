/**
 * Авто-вешалки на штанге: расчёт позиций по ширине слота и шагу.
 * Превью конструктора / иконка каталога + комната (после load GLB штанги).
 */
(function initClodisRodCompanions(global) {
  'use strict';

  function isTruthyFlag(v) {
    return v === true || v === 1 || v === '1';
  }

  function isFalsyFlag(v) {
    return v === false || v === 0 || v === '0';
  }

  function parseRodCompanionsConfig(mergedSpec, entryParams) {
    const raw =
      (entryParams && entryParams.companions) ||
      (mergedSpec && mergedSpec.companions) ||
      null;
    if (!raw || typeof raw !== 'object') return null;
    if (isFalsyFlag(raw.enabled)) return null;
    const stepMm = Number(raw.step_mm != null ? raw.step_mm : raw.step);
    const marginMm = Number(raw.margin_mm != null ? raw.margin_mm : raw.margin);
    const idsRaw = raw.model_ids != null ? raw.model_ids : raw.modelIds;
    let modelIds = [];
    if (Array.isArray(idsRaw)) {
      modelIds = idsRaw.map((x) => String(x || '').trim()).filter(Boolean);
    }
    const single = String(raw.model_id != null ? raw.model_id : raw.modelId || '').trim();
    if (!modelIds.length && single) modelIds = [single];
    if (!modelIds.length || !Number.isFinite(stepMm) || stepMm <= 0) return null;
    const off = raw.offset && typeof raw.offset === 'object' ? raw.offset : {};
    const rot = raw.rot && typeof raw.rot === 'object' ? raw.rot : {};
    const size = raw.size && typeof raw.size === 'object' ? raw.size : {};
    const readOff = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const readRot = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
    const poRaw = raw.preview_only != null ? raw.preview_only : raw.previewOnly;
    // preview_only=1 → только превью; 0/false → ещё и комната. По умолчанию (нет поля) — как раньше true.
    const previewOnly = poRaw == null ? true : isTruthyFlag(poRaw);
    return {
      enabled: true,
      modelId: modelIds[0],
      modelIds,
      stepMm,
      marginMm: Number.isFinite(marginMm) && marginMm >= 0 ? marginMm : 150,
      offset: {
        x: readOff(off.x),
        y: readOff(off.y),
        z: readOff(off.z),
      },
      rot: {
        x: readRot(rot.x, 0),
        y: readRot(rot.y, 60),
        z: readRot(rot.z, 0),
      },
      size: {
        x: Number(size.x) || 0,
        y: Number(size.y) || 0,
        z: Number(size.z) || 0,
      },
      previewOnly,
      rodHangStrip: !!(raw.rodHangStrip || raw.rod_hang_strip),
    };
  }

  /** Позиции по X от левого края слота штанги (мм). */
  function computeRodCompanionXPositionsMm(rodWidthMm, config) {
    const W = Math.max(0, Number(rodWidthMm) || 0);
    if (W <= 0) return [];
    const margin = Math.max(0, Number(config?.marginMm) || 0);
    // Одна полоса lifestyle — центр штанги.
    if (config?.rodHangStrip) {
      return [W / 2];
    }
    const step = Math.max(1, Number(config?.stepMm) || 400);
    const usable = Math.max(0, W - 2 * margin);
    if (usable <= 0) return [W / 2];
    const n = Math.max(1, Math.floor(usable / step) + 1);
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = margin + i * step;
      if (x > W - margin + 0.5) break;
      out.push(x);
    }
    return out.length ? out : [W / 2];
  }

  function defaultRodCompanionsParams() {
    return {
      enabled: 0,
      model_id: '23',
      model_ids: [],
      step_mm: 400,
      margin_mm: 150,
      preview_only: 0,
      offset: { x: 0, y: 0, z: 0 },
      rot: { x: 0, y: 60, z: 0 },
      size: { x: 430, y: 200, z: 30 },
    };
  }

  function resolveCompanionTargetSizeMm(config, variant) {
    // Сначала размер карточки (одежда+плечик разной высоты), иначе общий size из companions.
    const vp = variant?.params;
    if (vp?.preview_ref_mm && typeof vp.preview_ref_mm === 'object') {
      const rx = Number(vp.preview_ref_mm.x);
      const ry = Number(vp.preview_ref_mm.y);
      const rz = Number(vp.preview_ref_mm.z);
      if (rx > 0 && ry > 0 && rz > 0) return { x: rx, y: ry, z: rz };
    }
    const cs = config?.size || {};
    const x = Number(cs.x);
    const y = Number(cs.y);
    const z = Number(cs.z);
    if (x > 0 && y > 0 && z > 0) return { x, y, z };
    return { x: 420, y: 900, z: 280 };
  }

  function pickRodCompanionModelId(config, index, usedIds) {
    const ids = Array.isArray(config?.modelIds) && config.modelIds.length
      ? config.modelIds
      : config?.modelId
        ? [config.modelId]
        : [];
    if (!ids.length) return '';
    const used = usedIds instanceof Set ? usedIds : null;
    // сначала неиспользованные, потом least — по кругу с offset
    const fresh = used ? ids.filter((id) => !used.has(String(id))) : ids;
    const pool = fresh.length ? fresh : ids;
    const id = String(pool[index % pool.length] || pool[0] || '');
    if (used && id) used.add(id);
    return id;
  }

  function readRodCompanionsFromParamsObj(paramsObj) {
    const raw = paramsObj?.models?.[0]?.params?.companions;
    if (!raw || typeof raw !== 'object') return defaultRodCompanionsParams();
    const d = defaultRodCompanionsParams();
    const idsRaw = raw.model_ids != null ? raw.model_ids : raw.modelIds;
    const model_ids = Array.isArray(idsRaw)
      ? idsRaw.map((x) => String(x || '').trim()).filter(Boolean)
      : [];
    return {
      enabled: raw.enabled ? 1 : 0,
      model_id: String(raw.model_id != null ? raw.model_id : raw.modelId || d.model_id),
      model_ids,
      step_mm: Number(raw.step_mm != null ? raw.step_mm : raw.step) || d.step_mm,
      margin_mm:
        Number(raw.margin_mm != null ? raw.margin_mm : raw.margin) >= 0
          ? Number(raw.margin_mm != null ? raw.margin_mm : raw.margin)
          : d.margin_mm,
      preview_only: raw.preview_only === false || raw.previewOnly === false || raw.preview_only === 0 || raw.previewOnly === 0 ? 0 : 1,
      offset: {
        x: Number(raw.offset?.x) || 0,
        y: Number(raw.offset?.y ?? d.offset.y),
        z: Number(raw.offset?.z ?? d.offset.z),
      },
      rot: {
        x: Number(raw.rot?.x) || 0,
        y: Number(raw.rot?.y ?? d.rot.y),
        z: Number(raw.rot?.z) || 0,
      },
      size: {
        x: Number(raw.size?.x) || d.size.x,
        y: Number(raw.size?.y) || d.size.y,
        z: Number(raw.size?.z) || d.size.z,
      },
    };
  }

  function resolveRodBarAnchorMm(rodMesh, rodGroup, rodWidthMmFallback, THREE, unitsMm) {
    const u = Math.max(1, Number(unitsMm) || 10);
    const fallbackW = Math.max(1, Number(rodWidthMmFallback) || 1);
    const fb = {
      minXMm: -fallbackW / 2,
      spanMm: fallbackW,
      barYMm: 0,
      barZMm: 0,
    };
    if (!rodMesh || !THREE || !rodGroup) return fb;

    rodGroup.updateMatrixWorld(true);
    // Не включать уже навешанные companions в bbox штанги.
    let worldBox = new THREE.Box3();
    let hasBox = false;
    rodMesh.updateMatrixWorld(true);
    rodMesh.traverse((o) => {
      if (!o?.isMesh) return;
      if (o.userData?.isRodCompanion || o.userData?.isShelfProp) return;
      if (/rod_companion_/i.test(String(o.name || ''))) return;
      const b = new THREE.Box3().setFromObject(o);
      if (b.isEmpty()) return;
      if (!hasBox) {
        worldBox.copy(b);
        hasBox = true;
      } else {
        worldBox.union(b);
      }
    });
    if (!hasBox) {
      worldBox = new THREE.Box3().setFromObject(rodMesh);
    }
    if (worldBox.isEmpty()) return fb;

    const inv = new THREE.Matrix4().copy(rodGroup.matrixWorld).invert();
    const localBox = new THREE.Box3();
    const corners = [
      new THREE.Vector3(worldBox.min.x, worldBox.min.y, worldBox.min.z),
      new THREE.Vector3(worldBox.max.x, worldBox.min.y, worldBox.min.z),
      new THREE.Vector3(worldBox.min.x, worldBox.max.y, worldBox.min.z),
      new THREE.Vector3(worldBox.max.x, worldBox.max.y, worldBox.min.z),
      new THREE.Vector3(worldBox.min.x, worldBox.min.y, worldBox.max.z),
      new THREE.Vector3(worldBox.max.x, worldBox.min.y, worldBox.max.z),
      new THREE.Vector3(worldBox.min.x, worldBox.max.y, worldBox.max.z),
      new THREE.Vector3(worldBox.max.x, worldBox.max.y, worldBox.max.z),
    ];
    corners.forEach((c) => {
      c.applyMatrix4(inv);
      localBox.expandByPoint(c);
    });

    const sx = Math.abs(rodGroup.scale?.x) || 1;
    const localToMm = sx < 0.25 ? 1 : u;
    const spanLocal = Math.max(1e-6, localBox.max.x - localBox.min.x);
    let spanMm = Math.max(1, spanLocal * localToMm);
    // Слот из buildModel (мм) — жёсткий потолок, если bbox раздулся.
    if (fallbackW > 1 && Number.isFinite(fallbackW)) {
      spanMm = Math.min(spanMm, fallbackW);
    }

    return {
      minXMm: localBox.min.x * localToMm,
      spanMm,
      barYMm: ((localBox.min.y + localBox.max.y) * 0.5) * localToMm,
      barZMm: ((localBox.min.z + localBox.max.z) * 0.5) * localToMm,
    };
  }

  function parseRodCompanionsPayload(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return parseRodCompanionsConfig({ companions: raw }, { companions: raw });
  }

  /**
   * @param {object} opts
   * @param {THREE.Group} opts.rodGroup — обёртка штанги (sibling вешалок = дети этой группы)
   * @param {THREE.Object3D} [opts.rodMesh] — GLB штанги для bbox (ось и ширина)
   * @param {number} opts.rodWidthMm — fallback ширины слота
   * @param {object} opts.config from parseRodCompanionsConfig
   * @param {object} opts.catalogMap
   * @param {function} opts.loadAsset (url) => Promise<Object3D>
   * @param {function} opts.prepareRoot (tpl, mergedSpec, entry, sizeMm) => Object3D
   * @param {function} [opts.applyMaterials]
   * @param {number} opts.unitsMm — 10 в превью конструктора; 1 в комнате (мм = unit)
   * @param {boolean} [opts.markPreviewOnly] — userData.previewOnly на обёртках (комната: false)
   * @param {number} opts.epoch
   * @param {function} opts.isEpochStale () => boolean
   */
  async function spawnRodCompanionsIntoOwnObject(opts) {
    const rodGroup = opts?.rodGroup || opts?.ownObject;
    const config = opts?.config;
    const THREE = opts?.THREE;
    const unitsMm = Math.max(1, Number(opts?.unitsMm) || 10);
    const markPreviewOnly = opts?.markPreviewOnly !== false;
    if (!rodGroup || !config?.enabled || !THREE) return 0;

    const rodMesh =
      opts.rodMesh ||
      (rodGroup.children && rodGroup.children.length
        ? rodGroup.children.find((c) => !String(c.name || '').startsWith('rod_companion_')) ||
          rodGroup.children[0]
        : null);
    const anchor = resolveRodBarAnchorMm(rodMesh, rodGroup, opts.rodWidthMm, THREE, unitsMm);
    const positions = computeRodCompanionXPositionsMm(anchor.spanMm, config);
    if (!positions.length) return 0;

    const map = opts.catalogMap || {};
    const usedIds = new Set();
    let spawned = 0;

    for (let i = 0; i < positions.length; i++) {
      if (opts.isEpochStale && opts.isEpochStale()) return spawned;
      const id = pickRodCompanionModelId(config, i, usedIds);
      const libEntry = map[id];
      const paramsRoot =
        (libEntry && libEntry.params && typeof libEntry.params === 'object' ? libEntry.params : null) ||
        (libEntry && typeof libEntry === 'object' ? libEntry : null);
      const models = paramsRoot?.models;
      const variant = Array.isArray(models) && models.length ? models[0] : null;
      const url = String(variant?.model || '').trim();
      if (!url || typeof opts.loadAsset !== 'function' || typeof opts.prepareRoot !== 'function') {
        continue;
      }

      const variantParams =
        variant?.params && typeof variant.params === 'object' ? variant.params : {};
      const hangFromTop = !config.emptyHangerMode && String(id) !== '23';
      const strip = !!config.rodHangStrip;
      const margin = Number(config.marginMm) || 0;
      const liveSpan = Math.max(80, Number(anchor.spanMm) || 0);
      const slotW = Math.max(0, Number(opts.rodWidthMm) || 0);
      // После расширения корпуса якорь штанги — источник правды; slotW только как доп. потолок, если задан.
      const baseW = slotW > 80 ? Math.min(liveSpan, slotW) : liveSpan;
      const stripW = Math.max(80, baseW - 2 * margin);
      // Полоса: реальный размер (mm из GLB), без fit по ширине штанги.
      const targetMm = strip
        ? {
            x: Math.max(200, Number(variantParams?.preview_ref_mm?.x) || Number(config.size?.x) || 1800),
            y: Math.max(200, Number(variantParams?.preview_ref_mm?.y) || Number(config.size?.y) || 1050),
            z: Math.max(80, Number(variantParams?.preview_ref_mm?.z) || Number(config.size?.z) || 380),
          }
        : resolveCompanionTargetSizeMm(config, variant);
      const mergedSpec = {
        id,
        ...variantParams,
        rot: { x: 0, y: 0, z: 0, order: 'XYZ' },
        preview_ref_mm: targetMm,
        fitToSize: !strip,
        fit_to_size: strip ? 0 : 1,
        isRodCompanion: true,
        rodHangFromTop: hangFromTop,
        rodHangStrip: strip,
        rodHangStripUsableMm: strip ? stripW : 0,
        // 0 = без потолка по числу, только clip по ширине штанги.
        rodHangStripMaxHang: strip ? Math.max(0, Number(config.rodHangStripMaxHang) || 0) : 0,
      };
      const szMm = mergedSpec.preview_ref_mm;

      const xFromLeft = positions[i];
      const posXMm = anchor.minXMm + xFromLeft + (config.offset.x || 0);
      const posYMm = anchor.barYMm + (config.offset.y || 0);
      const posZMm = anchor.barZMm + (config.offset.z || 0);

      let tpl;
      try {
        tpl = await opts.loadAsset(url);
      } catch (_) {
        continue;
      }
      if (opts.isEpochStale && opts.isEpochStale()) return spawned;
      // Кеш loadAssetRootOnce шарит один Object3D — клонируем.
      // Полоса одежды (10–16 МБ): НЕ клонировать материалы — иначе N× GPU maps = Crashpad.
      const shareMats = !!config.rodHangStrip;
      if (tpl && typeof tpl.clone === 'function') {
        tpl = tpl.clone(true);
        if (!shareMats) {
          tpl.traverse((o) => {
            if (!o?.isMesh || !o.material) return;
            if (Array.isArray(o.material)) {
              o.material = o.material.map((m) => (m && m.clone ? m.clone() : m));
            } else if (o.material.clone) {
              o.material = o.material.clone();
            }
          });
        }
      }

      const prepared = opts.prepareRoot(tpl, mergedSpec, variant, szMm);
      if (!prepared) continue;

      const wrapper = new THREE.Group();
      wrapper.name = `rod_companion_${id}_${i}`;
      wrapper.userData.isRodCompanion = true;
      wrapper.userData.previewOnly = markPreviewOnly;
      if (shareMats) wrapper.userData.__cldShareMaterials = true;
      const parentScaleX = Math.abs(rodGroup.scale?.x) || 1;
      // Превью карточки #models3d: штанга в юнитах сцены (scale≈1). Шаблон шкафа: обёртка 1/UNITS_MM, локальные мм.
      const parentUsesMmLocal = parentScaleX > 0 && parentScaleX < 0.5;
      if (!parentUsesMmLocal) {
        wrapper.scale.setScalar(1 / unitsMm);
      }
      const posDiv = parentUsesMmLocal ? 1 : unitsMm;
      wrapper.position.set(posXMm / posDiv, posYMm / posDiv, posZMm / posDiv);
      wrapper.rotation.set(0, 0, 0);
      if (config.rot.x) wrapper.rotateX(-THREE.MathUtils.degToRad(config.rot.x));
      if (config.rot.y) wrapper.rotateY(-THREE.MathUtils.degToRad(config.rot.y));
      if (config.rot.z) wrapper.rotateZ(-THREE.MathUtils.degToRad(config.rot.z));
      wrapper.add(prepared);
      rodGroup.add(wrapper);
      spawned++;
      // В комнате плечики всегда видны (пустые на 4–6, с одеждой на 7 — разный пул при спавне).
      if (markPreviewOnly === false) {
        wrapper.visible = true;
      }

      if (typeof opts.applyMaterials === 'function') {
        try {
          await opts.applyMaterials(prepared, mergedSpec, variant);
        } catch (_) {}
      }
    }
    return spawned;
  }

  const api = {
    parseRodCompanionsConfig,
    parseRodCompanionsPayload,
    computeRodCompanionXPositionsMm,
    resolveRodBarAnchorMm,
    defaultRodCompanionsParams,
    readRodCompanionsFromParamsObj,
    spawnRodCompanionsIntoOwnObject,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (global) {
    global.__cldRodCompanions = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
