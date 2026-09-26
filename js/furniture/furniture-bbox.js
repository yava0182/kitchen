// Единый расчёт bbox мебели без служебных мешей (WallContactAO, контактная тень, маркеры,
// превью присадки, отладка петель). Иначе setFromObject(group) раздувает габариты и шкаф
// «улетает» из ниши при updateFurnitureInSection / выравнивании по полу.
//
// Важно (пол / 1.321): placeholder и GLB опор (не петли) должны попадать в bbox —
// иначе низ берётся по logical pivot цоколя и шкаф парит. Не выкидывать ModelPlaceholder_*
// оптом вместе с петлями.

/**
 * @param {THREE.Object3D} obj
 * @returns {boolean}
 */
export function shouldExcludeMeshFromFurnitureBBox(obj) {
  if (!obj || !obj.isMesh) return true;
  const ud = obj.userData || {};
  if (ud.isWallAo || ud.isContactShadow || ud.isCabinetWallHalo || ud.isShelfContactAo) return true;
  const nm = String(obj.name || '');
  if (
    nm === '__cld_cab_wall_halo' ||
    nm === '__cld_cab_foot_contact' ||
    nm === '__cld_cab_soft_shadow' ||
    nm === '__cld_room_soft_shadow_plane' ||
    nm === '__cld_shelf_contact_ao' ||
    nm.startsWith('__cld_shelf_ao_')
  )
    return true;
  if (ud.isHingeDebugVolume || ud.isSectionVolume) return true;
  if (ud.isHole || ud.furniDrillHole || ud.holeSpec) return true;
  if (ud.isEdge || ud.isUncutEdge || ud.cldSectionTrimUncut) return true;
  if (ud.previewOnly || ud.isRodCompanion || ud.isShelfProp || ud.isVisualOnly) return true;
  // Петлевой GLB / металл / присадка — не опоры корпуса
  if (
    ud.isHingeCabinetModelMetal ||
    ud.isHingeBazisExport ||
    ud.fromDrillTemplateModel ||
    ud.cldHingeCatalogModel ||
    ud.isCatalogHingeModule ||
    ud.cldGuideCabinetModel
  ) {
    return true;
  }
  if (
    ud.isAccessory &&
    (ud.fromDrillTemplateModel ||
      ud.isHingeBazisExport ||
      ud.isHingeCabinetModelMetal ||
      ud.cldGuideCabinetModel)
  ) {
    return true;
  }
  if (nm.includes('PivotMarker') || nm.includes('BBox')) return true;
  if (/^Hole_/i.test(nm) || /^furni_hole_/i.test(nm)) return true;
  if (/^furni_hinge_/i.test(nm)) return true;
  if (/^rod_companion_/i.test(nm)) return true;
  if (/^shelf_prop_/i.test(nm)) return true;
  // Непомеченный GLB петли/присадки (до флагов) — иначе setFromObject/mesh попадает в ширину.
  if (/петл|hinge|присад/i.test(nm)) return true;
  // Направляющие (корпус/подвижная) — не раздувают ширину ящика/шкафа.
  if (/^Model_.*направл/i.test(nm) || /^ModelPlaceholder_.*направл/i.test(nm)) return true;
  const guideSpecId = String(ud.modelSpecId || '').trim();
  if (
    guideSpecId === '5' ||
    guideSpecId === '6' ||
    guideSpecId === '7' ||
    guideSpecId === '8' ||
    guideSpecId === '9' ||
    guideSpecId === '10'
  ) {
    return true;
  }
  // ModelPlaceholder_*: исключать только петлевые (серый бокс до GLB петли).
  // Опоры (spec.id=2 и др.) оставляем — слот = контакт с полом до/вместо GLB.
  if (/^ModelPlaceholder_/i.test(nm)) {
    let p = obj.parent;
    for (let i = 0; i < 16 && p; i++) {
      const pud = p.userData || {};
      if (
        pud.cldHingeCatalogModel ||
        pud.isCatalogHingeModule ||
        pud.isHingeBazisExport ||
        pud.fromDrillTemplateModel ||
        pud.cldGuideCabinetModel
      ) {
        return true;
      }
      p = p.parent;
    }
    // не петля — считаем в bbox
  }
  let p = obj.parent;
  for (let i = 0; i < 16 && p; i++) {
    const pn = String(p.name || '');
    const pud = p.userData || {};
    if (pud.previewOnly || pud.isRodCompanion || pud.isShelfProp || pud.isVisualOnly) return true;
    if (
      pud.cldHingeCatalogModel ||
      pud.isCatalogHingeModule ||
      pud.isHingeBazisExport ||
      pud.fromDrillTemplateModel ||
      pud.cldGuideCabinetModel
    ) {
      return true;
    }
    if (
      pn === '__furni_drill_holes' ||
      pn === '__furniture_own' ||
      pn === '__hinge_debug_vols' ||
      pn === '__hinge_debug_vols_door' ||
      pn === 'hinge_hole_debug'
    ) {
      return true;
    }
    if (/^Model_.*направл/i.test(pn)) return true;
    if (/петл|hinge|присад|furni_hinge|направл/i.test(pn)) return true;
    const pSpec = String(pud.modelSpecId || '').trim();
    if (
      pSpec === '5' ||
      pSpec === '6' ||
      pSpec === '7' ||
      pSpec === '8' ||
      pSpec === '9' ||
      pSpec === '10'
    ) {
      return true;
    }
    p = p.parent;
  }
  return false;
}

/** Ручки на фасаде не входят в габарит посадки в зону (как measureEndCabinetBBox). */
function isFacadeHandleObject(obj) {
  let p = obj;
  for (let i = 0; i < 16 && p; i++) {
    if (p.userData?.isFacadeHandle === true || p.name === '__cld_facade_handle') return true;
    p = p.parent;
  }
  return false;
}

/**
 * Посадка в зону: петли/фурнитура не в bbox даже до флагов на GLB.
 * Иначе snap по ещё не помеченным петлям, потом они выкидываются → корпус +7 мм.
 */
export function shouldExcludeMeshFromZoneFitBBox(obj) {
  if (shouldExcludeMeshFromFurnitureBBox(obj)) return true;
  if (isFacadeHandleObject(obj)) return true;
  let p = obj;
  for (let i = 0; i < 16 && p; i++) {
    const ud = p.userData || {};
    const nm = String(p.name || '');
    const spec = String(ud.modelSpecId || '').trim();
    if (spec === '2') {
      p = p.parent;
      continue;
    }
    // Не выкидывать любой isAccessory — у одной руки двери боковина/фасад
    // иногда помечен accessory и пропадал из bbox → SHIFT +7 мм.
    if (
      ud.isAccessory &&
      (ud.isHingeCabinetModelMetal ||
        ud.cldHingeCatalogModel ||
        ud.isHingeBazisExport ||
        ud.fromDrillTemplateModel ||
        ud.cldGuideCabinetModel ||
        /петл|hinge|присад|furni_hinge|направл/i.test(nm))
    ) {
      return true;
    }
    if (/петл|hinge|присад|furni_hinge|направл/i.test(nm)) return true;
    if (spec === '5' || spec === '6' || spec === '7' || spec === '8' || spec === '9' || spec === '10') {
      return true;
    }
    p = p.parent;
  }
  return false;
}

const _zoneFitCorner = new THREE.Vector3();

/** Только геометрия этого mesh, без потомков (петля GLB часто висит на боковине). */
function expandWorldBoxByMeshSelf(out, mesh) {
  const geom = mesh?.geometry;
  if (!geom) return false;
  if (!geom.boundingBox) geom.computeBoundingBox();
  const bb = geom.boundingBox;
  if (!bb || bb.isEmpty()) return false;
  const min = bb.min;
  const max = bb.max;
  const wp = mesh.matrixWorld;
  for (let ix = 0; ix <= 1; ix++) {
    for (let iy = 0; iy <= 1; iy++) {
      for (let iz = 0; iz <= 1; iz++) {
        _zoneFitCorner
          .set(ix ? max.x : min.x, iy ? max.y : min.y, iz ? max.z : min.z)
          .applyMatrix4(wp);
        out.expandByPoint(_zoneFitCorner);
      }
    }
  }
  return true;
}

/**
 * Bbox посадки ниши = корпус+фасад без петель/ручек (в т.ч. до тегов на GLB).
 */
export function computeFurnitureZoneFitWorldBBox(root) {
  const out = new THREE.Box3();
  let has = false;
  if (!root) return out;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (shouldExcludeMeshFromZoneFitBBox(obj)) return;
    try {
      const b = new THREE.Box3();
      if (!expandWorldBoxByMeshSelf(b, obj) || b.isEmpty()) return;
      if (!has) {
        out.copy(b);
        has = true;
      } else {
        out.union(b);
      }
    } catch (_) {}
  });
  if (!has) return computeFurnitureLayoutWorldBBoxNoAo(root);
  return out;
}

function isFacadeLayoutBranch(obj) {
  let p = obj;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    const lr = String(pud.layoutRole || '').toLowerCase();
    if (/^facades/.test(lr) || lr === 'facades') return true;
    if (pud.isFacade && !pud.isBody) return true;
    p = p.parent;
  }
  return false;
}

/**
 * Корпус (боковины/цоколь/полки), без facades_* и без крышки s:x шире корпуса.
 * Для тумбы fit по полному bbox давал +8 мм «свес топа» и зазор у накладки.
 */
function resolveMeshDetailTypeId(obj) {
  let p = obj;
  for (let i = 0; i < 12 && p; i++) {
    const dt = String(p.userData?.detailTypeId || '').trim().toLowerCase();
    if (dt) return dt;
    p = p.parent;
  }
  return '';
}

function isCorpusShellMeshForLayout(obj) {
  if (!obj?.isMesh || shouldExcludeMeshFromFurnitureBBox(obj)) return false;
  if (isFacadeHandleObject(obj)) return false;
  if (isFacadeLayoutBranch(obj)) return false;
  const dt = resolveMeshDetailTypeId(obj);
  if (dt === 'horizontal_top' || dt === 'horizontal_bottom') return false;
  const ud = obj.userData || {};
  if (ud.isFacade && !ud.isBody) return false;
  if (ud.isBody === true || ud.isDetail === true) return true;
  let p = obj.parent;
  for (let i = 0; i < 24 && p; i++) {
    const lr = String(p.userData?.layoutRole || '').toLowerCase();
    if (lr === 'top') return false;
    if (['plinth', 'corpus', 'corpus_antresol', 'service'].includes(lr)) return true;
    p = p.parent;
  }
  return false;
}

/**
 * Bbox корпуса для посадки тумбы в зону (без facades и без верхней крышки s:x).
 * @param {THREE.Object3D} root
 * @returns {THREE.Box3}
 */
export function computeFurnitureCorpusLayoutWorldBBoxNoAo(root) {
  const out = new THREE.Box3();
  let has = false;
  if (!root) return out;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!isCorpusShellMeshForLayout(obj)) return;
    try {
      const b = new THREE.Box3();
      if (!expandWorldBoxByMeshSelf(b, obj) || b.isEmpty()) return;
      if (!has) {
        out.copy(b);
        has = true;
      } else {
        out.union(b);
      }
    } catch (_) {}
  });
  if (!has) return computeFurnitureLayoutWorldBBoxNoAo(root);
  return out;
}

/**
 * Bbox для посадки в зону: без AO/ручек/служебных мешей.
 * Только geometry mesh (без потомков) — иначе петля на боковине раздувает U на ~7 мм.
 * @param {THREE.Object3D} root
 * @returns {THREE.Box3}
 */
export function computeFurnitureLayoutWorldBBoxNoAo(root) {
  const out = new THREE.Box3();
  let has = false;
  if (!root) return out;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (shouldExcludeMeshFromFurnitureBBox(obj)) return;
    if (isFacadeHandleObject(obj)) return;
    try {
      const b = new THREE.Box3();
      if (!expandWorldBoxByMeshSelf(b, obj) || b.isEmpty()) return;
      if (!has) {
        out.copy(b);
        has = true;
      } else {
        out.union(b);
      }
    } catch (_) {}
  });
  if (!has) return computeFurnitureWorldBBoxNoAo(root);
  return out;
}

/**
 * @param {THREE.Object3D} root
 * @returns {THREE.Box3}
 */
export function computeFurnitureWorldBBoxNoAo(root) {
  const out = new THREE.Box3();
  let has = false;
  if (!root) return out;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (shouldExcludeMeshFromFurnitureBBox(obj)) return;
    try {
      const b = new THREE.Box3();
      if (!expandWorldBoxByMeshSelf(b, obj) || b.isEmpty()) return;
      if (!has) {
        out.copy(b);
        has = true;
      } else {
        out.union(b);
      }
    } catch (_) {}
  });
  return out;
}

/**
 * Каталожная крышка тумбы (horizontal_top) — не transition_top_cap.
 * @param {THREE.Object3D} root
 * @returns {THREE.Object3D|null}
 */
export function findCatalogHorizontalTopWallGroup(root) {
  let found = null;
  if (!root) return null;
  root.traverse((o) => {
    if (found || o?.userData?.type !== 'wall') return;
    if (String(o.userData.detailTypeId || '').toLowerCase() === 'horizontal_top') found = o;
  });
  return found;
}

/**
 * Скрыть/показать каталожную крышку (не TransitionTopCap / AutoTopCap).
 * В комнате крыша админки всегда видна; Transition №15 садится сверху (§6.4).
 * @param {THREE.Object3D} furnitureRoot
 * @param {boolean} visible
 * @returns {boolean}
 */
export function setCatalogHorizontalTopVisible(furnitureRoot, visible) {
  if (!furnitureRoot) return false;
  let changed = false;
  furnitureRoot.traverse((o) => {
    if (o?.userData?.type !== 'wall') return;
    if (String(o.userData.detailTypeId || '').toLowerCase() !== 'horizontal_top') return;
    const setVis = (node) => {
      if (!node || node.visible === visible) return;
      node.visible = visible;
      changed = true;
    };
    setVis(o);
    o.traverse((ch) => setVis(ch));
  });
  if (changed) {
    furnitureRoot.userData.__cldCatalogTopHiddenByTransition = !visible;
  }
  return changed;
}

if (typeof globalThis !== 'undefined') {
  globalThis.__cldComputeFurnitureCorpusLayoutWorldBBoxNoAo =
    computeFurnitureCorpusLayoutWorldBBoxNoAo;
  globalThis.__cldComputeFurnitureLayoutWorldBBoxNoAo = computeFurnitureLayoutWorldBBoxNoAo;
  globalThis.__cldComputeFurnitureZoneFitWorldBBox = computeFurnitureZoneFitWorldBBox;
  globalThis.__cldSetCatalogHorizontalTopVisible = setCatalogHorizontalTopVisible;
}

export function withFurnitureDoorSwingsClosedForMeasure(root, fn) {
  if (!root || typeof fn !== 'function') return fn?.();
  const swingSaved = [];
  root.traverse((o) => {
    if (
      o &&
      (o.name === '__door_swing' || o.userData?.cldDoorSwing) &&
      o.rotation &&
      (o.rotation.x || o.rotation.y || o.rotation.z)
    ) {
      swingSaved.push({ obj: o, euler: o.rotation.clone() });
      o.rotation.set(0, 0, 0);
    }
  });
  if (swingSaved.length) root.updateMatrixWorld(true);
  try {
    return fn();
  } finally {
    for (const s of swingSaved) s.obj.rotation.copy(s.euler);
    if (swingSaved.length) root.updateMatrixWorld(true);
  }
}
