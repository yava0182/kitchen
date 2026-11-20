/**
 * Посадка cabinet_model в комнату — порядок PlanPlace CabinetModel._load_model
 * (vendor/main_core_v2_part18.js ~2997–3084) + _build_rot (~2669–2677).
 *
 * Реф на own_object (part18 _build + _load_model):
 *   1) scale (файл → мм + params.scale % админки: 100 → ×1)
 *   2) size по meshes.s / align по meshes.t (s=0 → без stretch)
 *   3) tree rot: rotateX/Y/Z(−deg)   ← _build_rot
 *   4) pivot: translate(conv_pivot)   ← после tree rot, локально
 *   5) card pos: translate(pos)
 *   6) card rot: rotateX/Y/Z(+deg)    ← с карточки models3d
 *
 * Один путь для любого spec.id (опоры тоже).
 */
(function (global) {
  'use strict';

  function getThree() {
    return global.THREE || null;
  }

  function deg2rad(d) {
    const THREE = getThree();
    return THREE.MathUtils.degToRad(Number(d) || 0);
  }

  function catalogScalePercent(entry) {
    const sc = entry?.params && typeof entry.params === 'object' ? entry.params.scale : null;
    if (!sc || typeof sc !== 'object') return { x: 1, y: 1, z: 1 };
    const sx = Number(sc.x);
    const sy = Number(sc.y);
    const sz = Number(sc.z);
    if (!(sx > 0) || !(sy > 0) || !(sz > 0)) return { x: 1, y: 1, z: 1 };
    // Админка: поле «1» хранит 100. Реф в units множит литералом; у нас мм → /100.
    return { x: sx / 100, y: sy / 100, z: sz / 100 };
  }

  function inferFileToMm(root) {
    const THREE = getThree();
    if (!THREE || !root) return 1;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return 1;
    const s = box.getSize(new THREE.Vector3());
    const M = Math.max(s.x, s.y, s.z);
    if (M <= 3.5) return 1000;
    return 1;
  }

  function centerKeepScale(root) {
    const THREE = getThree();
    if (!THREE || !root) return;
    root.position.set(0, 0, 0);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3());
    root.position.set(-c.x, -c.y, -c.z);
  }

  function axisFlags(v) {
    if (!v || typeof v !== 'object') return { x: 0, y: 0, z: 0 };
    return { x: Number(v.x) ? 1 : 0, y: Number(v.y) ? 1 : 0, z: Number(v.z) ? 1 : 0 };
  }

  /**
   * Реф Model_utils.set_size: тянем ось только при s[axis]=1.
   * У опор #79/#80 s={0,0,0} → модель остаётся нативной (79×150×58),
   * любой «подгон в слот 70» её сжимал и опора не доставала до пола.
   */
  function resolveStretchFlags(entry, fitToSize) {
    if (fitToSize) return { x: 1, y: 1, z: 1 };
    const p = entry?.params && typeof entry.params === 'object' ? entry.params : {};
    const out = { x: 0, y: 0, z: 0 };
    const sf = p.slot_fit;
    if (sf && typeof sf === 'object' && (sf.enabled === 1 || sf.enabled === true)) {
      const s = axisFlags(sf.s);
      out.x |= s.x;
      out.y |= s.y;
      out.z |= s.z;
    }
    const meshes = p.meshes;
    if (meshes && typeof meshes === 'object') {
      Object.keys(meshes).forEach((k) => {
        const s = axisFlags(meshes[k] && meshes[k].s);
        out.x |= s.x;
        out.y |= s.y;
        out.z |= s.z;
      });
    }
    return out;
  }

  /** Реф _t(...): ось с t=1 прижимается к нижней грани слота, а не центрируется. */
  function resolveAlignFlags(entry) {
    const p = entry?.params && typeof entry.params === 'object' ? entry.params : {};
    const out = { x: 0, y: 0, z: 0 };
    const sf = p.slot_fit;
    if (sf && typeof sf === 'object' && (sf.enabled === 1 || sf.enabled === true)) {
      const t = axisFlags(sf.t);
      out.x |= t.x;
      out.y |= t.y;
      out.z |= t.z;
    }
    const meshes = p.meshes;
    if (meshes && typeof meshes === 'object') {
      Object.keys(meshes).forEach((k) => {
        const t = axisFlags(meshes[k] && meshes[k].t);
        out.x |= t.x;
        out.y |= t.y;
        out.z |= t.z;
      });
    }
    return out;
  }

  /** Прижимает центрированную модель к нижней грани слота по осям с t=1. */
  function alignToSlot(root, sizeMm, align) {
    const THREE = getThree();
    if (!THREE || !root || (!align.x && !align.y && !align.z)) return;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    if (align.x) root.position.x += -(Number(sizeMm.x) || 0) / 2 - box.min.x;
    if (align.y) root.position.y += -(Number(sizeMm.y) || 0) / 2 - box.min.y;
    if (align.z) root.position.z += -(Number(sizeMm.z) || 0) / 2 - box.min.z;
    root.updateMatrixWorld(true);
  }

  /** _set_model3d_size: scale по s-флагам при rot=0, затем центр. */
  function applySizeRules(root, sizeMm, stretch, uniform) {
    const THREE = getThree();
    if (!THREE || !root || !sizeMm) return;
    root.rotation.set(0, 0, 0);
    root.position.set(0, 0, 0);
    root.updateMatrixWorld(true);
    if (!stretch.x && !stretch.y && !stretch.z) {
      centerKeepScale(root);
      return;
    }
    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const cur = box.getSize(new THREE.Vector3());
    const tx = Math.max(Number(sizeMm.x) || 0, 1e-6);
    const ty = Math.max(Number(sizeMm.y) || 0, 1e-6);
    const tz = Math.max(Number(sizeMm.z) || 0, 1e-6);
    const sx = Math.max(cur.x, 1e-8);
    const sy = Math.max(cur.y, 1e-8);
    const sz = Math.max(cur.z, 1e-8);
    if (uniform) {
      const s = Math.min(tx / sx, ty / sy, tz / sz);
      if (Number.isFinite(s) && s > 0) root.scale.multiplyScalar(s);
    } else {
      if (stretch.x) root.scale.x *= tx / sx;
      if (stretch.y) root.scale.y *= ty / sy;
      if (stretch.z) root.scale.z *= tz / sz;
    }
    root.updateMatrixWorld(true);
    centerKeepScale(root);
  }

  /**
   * @param {object} opts
   * @param {THREE.Object3D} opts.tpl — загруженный GLB/FBX root
   * @param {object} opts.entry — models[] variant (params.rot/scale/pos)
   * @param {{x:number,y:number,z:number}} opts.sizeMm — слот узла
   * @param {{x?:number,y?:number,z?:number}} [opts.treeRotDeg] — rot из дерева JSON
   * @param {{x?:number,y?:number,z?:number}} [opts.pivot] — pivot −1..1
   * @returns {THREE.Group} own_object (pivot + tree−rot + card pos/rot + mesh)
   */
  function buildPlanPlaceOwnObject(opts) {
    const THREE = getThree();
    if (!THREE || !opts?.tpl) return null;

    const entry = opts.entry && typeof opts.entry === 'object' ? opts.entry : {};
    const params = entry.params && typeof entry.params === 'object' ? entry.params : {};
    const sizeMm = opts.sizeMm || { x: 70, y: 100, z: 70 };
    const treeRot = opts.treeRotDeg || {};
    const pivot = opts.pivot || {};
    const specEarly = opts.spec && typeof opts.spec === 'object' ? opts.spec : {};
    const supportLeg =
      opts.supportLeg === true ||
      specEarly.cldSupportLeg === true ||
      /опора|support.?leg|opora/i.test(String(specEarly.key || specEarly.name || '')) ||
      String(specEarly.id ?? '') === '2' ||
      String(specEarly.id ?? '') === '79' ||
      String(specEarly.id ?? '') === '80';

    const own = new THREE.Group();
    own.name = 'PlanPlaceOwnObject';

    const meshRoot = opts.tpl.clone(true);
    meshRoot.scale.set(1, 1, 1);
    meshRoot.position.set(0, 0, 0);
    meshRoot.rotation.set(0, 0, 0);
    meshRoot.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData = o.userData || {};
        o.userData.isAccessory = true;
      }
    });

    // 1) scale: file→mm + catalog %
    const imp = inferFileToMm(meshRoot);
    meshRoot.scale.setScalar(imp);
    meshRoot.updateMatrixWorld(true);
    const cat = catalogScalePercent(entry);
    meshRoot.scale.multiply(new THREE.Vector3(cat.x, cat.y, cat.z));
    meshRoot.updateMatrixWorld(true);

    // 2) size по s-флагам карточки (rot=0)
    const spec = specEarly;
    const fitToSize =
      spec.fitToSize === true ||
      spec.fit_to_size === 1 ||
      (spec.resizable && Number(spec.resizable.enabled) === 1);
    const stretch = resolveStretchFlags(entry, fitToSize);
    applySizeRules(meshRoot, sizeMm, stretch, !!fitToSize);
    const align = resolveAlignFlags(entry);
    alignToSlot(meshRoot, sizeMm, align);
    own.add(meshRoot);

    const slotW = Math.max(Number(sizeMm.x) || 0, 1);
    const slotH = Math.max(Number(sizeMm.y) || 0, 1);
    const slotD = Math.max(Number(sizeMm.z) || 0, 1);
    const pvX = Number(pivot.x) || 0;
    const pvY = Number(pivot.y) || 0;
    const pvZ = Number(pivot.z) || 0;
    // conv_pivot(p, size) = -p * size / 2
    const pivTx = (-pvX * slotW) / 2;
    const pivTy = (-pvY * slotH) / 2;
    const pivTz = (-pvZ * slotD) / 2;

    // 3) tree rot — МИНУС, как _build_rot (до pivot translate)
    own.position.set(0, 0, 0);
    own.rotation.set(0, 0, 0);
    const trx = Number(treeRot.x) || 0;
    const try_ = Number(treeRot.y) || 0;
    const trz = Number(treeRot.z) || 0;
    if (trx) own.rotateX(-deg2rad(trx));
    if (try_) own.rotateY(-deg2rad(try_));
    if (trz) own.rotateZ(-deg2rad(trz));

    // 4) pivot — локальный translate после tree rot (как _build_pivot)
    if (pivTx || pivTy || pivTz) {
      own.translateX(pivTx);
      own.translateY(pivTy);
      own.translateZ(pivTz);
    }

    // 5) card pos (мм; реф делит на units, у нас сцена уже в мм)
    const pos = params.pos && typeof params.pos === 'object' ? params.pos : {};
    const px = Number(pos.x) || 0;
    const py = Number(pos.y) || 0;
    const pz = Number(pos.z) || 0;
    if (px || py || pz) {
      own.translateX(px);
      own.translateY(py);
      own.translateZ(pz);
    }

    // Низ слота до card rot. Reseat/fitHeight — только опоры (остальная фурнитура не трогаем).
    let seatMinY = null;
    if (supportLeg && align.y) {
      own.updateMatrixWorld(true);
      const seatBox = new THREE.Box3().setFromObject(own);
      if (!seatBox.isEmpty()) seatMinY = seatBox.min.y;
    }

    // 6) card rot — ПЛЮС, как _load_model rotateX/Y/Z
    const rot = params.rot && typeof params.rot === 'object' ? params.rot : {};
    const crx = Number(rot.x) || 0;
    const cry = Number(rot.y) || 0;
    const crz = Number(rot.z) || 0;
    if (crx) own.rotateX(deg2rad(crx));
    if (cry) own.rotateY(deg2rad(cry));
    if (crz) own.rotateZ(deg2rad(crz));

    // Опоры: после 180/−90 высота AABB часто 79 вместо 100 — дотянуть до слота и низ на пол.
    let fitH = null;
    if (supportLeg && align.y) {
      own.updateMatrixWorld(true);
      let box = new THREE.Box3().setFromObject(own);
      if (!box.isEmpty()) {
        if (seatMinY != null && (crx || cry || crz)) {
          own.position.y += seatMinY - box.min.y;
          own.updateMatrixWorld(true);
          box = new THREE.Box3().setFromObject(own);
        }
        const curH = box.max.y - box.min.y;
        if (curH > 1e-6 && Math.abs(curH - slotH) > 0.5) {
          fitH = slotH / curH;
          meshRoot.scale.multiplyScalar(fitH);
          meshRoot.updateMatrixWorld(true);
          own.updateMatrixWorld(true);
          box = new THREE.Box3().setFromObject(own);
          const targetMin = seatMinY != null ? seatMinY : box.min.y;
          own.position.y += targetMin - box.min.y;
          own.updateMatrixWorld(true);
        }
      }
    }

    own.userData = own.userData || {};
    own.userData._cldPlanPlaceOwn = true;
    own.userData._cldCatalogRotApplied = true;
    if (supportLeg) own.userData.cldSupportLeg = true;
    own.userData._cldPlanPlaceDebug = {
      imp,
      cat,
      stretch,
      align,
      supportLeg: !!supportLeg,
      fitToSize: !!fitToSize,
      sizeMm: { x: slotW, y: slotH, z: slotD },
      pivot: { x: pvX, y: pvY, z: pvZ },
      treeRot: { x: trx, y: try_, z: trz },
      treeRotSign: -1,
      cardRot: { x: crx, y: cry, z: crz },
      cardPos: { x: px, y: py, z: pz },
      reseatY: seatMinY != null,
      fitHeight: fitH,
      model: entry.model || null,
    };
    try {
      global.__cldLastPlanPlaceOwn = own.userData._cldPlanPlaceDebug;
    } catch (_) {}

    return own;
  }

  global.__cldPlanPlaceLoadModel = {
    buildPlanPlaceOwnObject,
  };
})(typeof window !== 'undefined' ? window : globalThis);
