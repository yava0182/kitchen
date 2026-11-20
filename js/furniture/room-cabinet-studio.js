/**
 * C1 — шкаф + обклад в ikea v0. Phase 7c — фурнитура: цвет с model_key_material (как v0p7o).
 */
import * as THREE from 'three';
import { state } from '../utils/state.js';
import {
  bindMeshToIkeaV0,
  ikeaV0BindOptsFromMaterial,
  ikeaV0BindOptsFromCatalogParams,
  applyIkeaV0CatalogMaterialToMesh,
  syncIkeaRoomLightV0,
  syncIkeaV0MaterialsUnderRoot,
  IKEA_V0_SOFT_LAYER,
} from './ikea-room-light-v0.js?v=20261117-studioRestore1';
import { shouldExcludeMeshFromFurnitureBBox } from './furniture-bbox.js?v=20261117-studioRestore1';
import { isSectionTrimFacadeMesh } from '../sections/section-trim-edges.js?v=20261117-studioRestore1';

export const CABINET_FILL_LAYER = IKEA_V0_SOFT_LAYER;

const IKEA_V0_HARDWARE_KINDS = new Set(['metal', 'plastic', 'rubber']);

function isFacadeEdgeStrip(mesh) {
  if (!mesh?.userData?.isEdge) return false;
  let p = mesh.parent;
  for (let i = 0; i < 16 && p; i++) {
    const pud = p.userData || {};
    if (pud.isFacade === true || pud.sectionTrimUsesOutsideDecor === true) return true;
    p = p.parent;
  }
  return false;
}

function isLitCabinetEdge(ud) {
  return ud?.isEdge === true && !ud?.isUncutEdge && !ud?.cldSectionTrimUncut;
}

function resolveModelSpecId(mesh) {
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const id = String(p.userData?.modelSpecId || '').trim();
    if (id) return id;
    p = p.parent;
  }
  return '';
}

function hardwareKindFromMaterialToken(token) {
  const t = String(token || '').trim().toLowerCase();
  if (!t) return null;
  if (
    t === '6' ||
    t === '7' ||
    t === 'metall' ||
    t === 'metal' ||
    t === '004' ||
    t === '004_galvanized' ||
    t === '004_galvanized_metal' ||
    t === 'galvanized' ||
    t === 'chrom' ||
    t === '4' ||
    /хром|chrom|chrome/.test(t)
  ) {
    return 'metal';
  }
  if (
    t === '2' ||
    t === 'opora' ||
    t === '8' ||
    t === '011' ||
    t === '011_white_plastic' ||
    t === 'white_plastic' ||
    t === 'plastic'
  ) {
    return 'plastic';
  }
  return null;
}

/**
 * IKEA Soft dump layerMask 3: shelves/drawers fill heightmap.
 * catalog_29 «Полка» uses spec.id «6» — same digit as hinge models 5/6.
 * Must not classify fill boards as hardware (else softCaster=false → Soft height empty).
 */
/**
 * Lifestyle GLB (полка / штанга): не фурнитура шкафа.
 * Иначе chrome с карточки штанги #22 по предку → metal bind → серый без текстур одежды.
 */
function isLifestylePropMesh(mesh) {
  let p = mesh;
  for (let i = 0; i < 16 && p; i++) {
    const ud = p.userData || {};
    const nm = String(p.name || '');
    if (ud.isShelfProp || ud.isRodCompanion) return true;
    if (/^shelf_prop_/i.test(nm) || /^rod_companion_/i.test(nm)) return true;
    p = p.parent;
  }
  return false;
}

function isShelfPropMesh(mesh) {
  return isLifestylePropMesh(mesh);
}

function shelfPropFabricHex(meshName) {
  const nm = String(meshName || '').toLowerCase();
  if (/grey|gray|middle/.test(nm)) return 0x9e9e9c;
  if (/beige|bottom/.test(nm)) return 0xbfaa8f;
  if (/bag|handle/.test(nm)) return 0xc9b89e;
  if (/collar_seam/.test(nm)) return 0xd7d4cc;
  if (/milk|top|collar/.test(nm)) return 0xeeebe2;
  return 0xbfaa8f;
}

function isInteriorFillSoftCasterMesh(mesh) {
  if (!mesh?.isMesh) return false;
  if (isShelfPropMesh(mesh)) return false;
  const ud = mesh.userData || {};
  if (ud.isFlatCatalogShelf) return true;
  const lr = String(ud.layoutRole || mesh.parent?.userData?.layoutRole || '').toLowerCase();
  if (lr === 'shelf' || lr === 'zone_divider' || lr === 'drawer' || lr === 'drawer_internal') {
    return true;
  }
  const nm = String(ud.detailName || mesh.name || '').toLowerCase();
  if (/полкодерж|shelf.?pin|планк|кромк|edge/.test(nm)) return false;
  if (/полк|shelf/.test(nm)) return true;
  let p = mesh.parent;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    if (pud.isFlatCatalogShelf) return true;
    const plr = String(pud.layoutRole || '').toLowerCase();
    if (plr === 'shelf' || plr === 'zone_divider' || plr === 'drawer' || plr === 'drawer_internal') {
      return true;
    }
    p = p.parent;
  }
  return false;
}

function isHingeCabinetModelSpecId(id) {
  const sid = String(id || '').trim();
  return sid === '5' || sid === '6';
}

function isHingePartToken(part) {
  const p = String(part || '').toLowerCase();
  return p === 'corpus' || p === 'facade' || p === 'door';
}

function meshIsCatalogHinge(mesh) {
  if (!mesh) return false;
  const ud = mesh.userData || {};
  if (ud.isHingeCabinetModelMetal || ud.cldHingeCatalogModel) return true;
  if (isHingePartToken(ud.hingePart)) return true;
  if (/^furni_hinge_/i.test(String(mesh.name || ''))) return true;
  const nm = String(mesh.name || '').toLowerCase();
  if (/петл|hinge/.test(nm)) return true;
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    const pn = String(p.name || '').toLowerCase();
    if (pud.isHingeCabinetModelMetal || pud.cldHingeCatalogModel || pud.isCatalogHingeModule) {
      return true;
    }
    if (isHingePartToken(pud.hingePart)) return true;
    const sid = String(pud.modelSpecId || '').trim();
    // cabinet_model #5/#6 only (type:model). catalog_29 shelf also uses id «6» but is a module, not isCabinetModel.
    if (isHingeCabinetModelSpecId(sid) && pud.isCabinetModel) return true;
    if (isHingeCabinetModelSpecId(sid) && (pud.isHingeBazisExport || /петл|hinge|clodis/.test(pn + nm))) {
      return true;
    }
    if (/петл|hinge/.test(pn) && (pud.isCabinetModel || pud.isAccessory || pud.isCatalogHingeModule)) {
      return true;
    }
    p = p.parent;
  }
  return false;
}

/** Кухонные опоры (cabinet_model) — не corpus плаinth-секции. */
function meshIsKitchenSupportLeg(mesh) {
  if (!mesh) return false;
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    if (pud.cldSupportLeg === true) return true;
    const pn = String(p.name || '');
    if (/Model_Опора|Опора кухонная|Опора\s+\d|support.?leg|opora/i.test(pn)) return true;
    const sid = String(pud.modelSpecId || '').trim();
    // SKU опор: #2 / #79 / #80 (не путать с другими catalog id).
    if (
      (sid === '2' || sid === '79' || sid === '80') &&
      (pud.isCabinetModel || pud.isAccessory || /опор/i.test(pn))
    ) {
      return true;
    }
    p = p.parent;
  }
  return false;
}

/**
 * type:model уже покрашен applyRoomCabinetModelMaterials (model_key_material).
 * Ikea plastic/corpus bind сбрасывает цвет на GLB — Gola остаётся оранжевой,
 * хотя в админке MeshStandard с карточкой ок. Петли (#5/#6) оставляем на metal bind.
 */
function meshIsCatalogPaintedCabinetModel(mesh) {
  if (!mesh) return false;
  if (meshIsCatalogHinge(mesh)) return false;
  const ud = mesh.userData || {};
  if (ud.cldCabinetMaterialParams && (ud.isAccessory === true || ud.cldSupportLeg === true)) {
    return true;
  }
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    if (pud.isFurniture && p !== mesh) break;
    if (pud.isCabinetModel === true && pud.cldCabinetMaterialParams) return true;
    if (pud.cldCabinetMaterialParams && pud.isAccessory === true) return true;
    p = p.parent;
  }
  return false;
}

function detectCabinetHardwareKind(mesh) {
  const ud = mesh.userData || {};
  const nm = String(mesh.name || '').toLowerCase();
  const fullName = String(mesh.name || '');

  // Не metal/plastic: иначе Contours → studio rebind съедает крепёж стыка.
  if (meshIsJointSchemeHardwareStudio(mesh)) return null;

  /** Одежда/вешалка на штанге и пропы полки — не chrome предка штанги. */
  if (isLifestylePropMesh(mesh)) return null;

  /** Hinge GLB first. catalog_29 shelf also uses spec.id «6» — fill check must not steal hinges. */
  if (meshIsCatalogHinge(mesh)) return 'metal';

  /** Dump Soft: shelf boards ≠ hinge GLB even when catalog id digit collides. */
  if (isInteriorFillSoftCasterMesh(mesh)) return null;

  /** Опоры живут в plinth — иначе detectCabinetMeshKind → corpus и затирает Opora. */
  if (meshIsKitchenSupportLeg(mesh)) {
    const tok =
      hardwareKindFromMaterialToken(ud.cldCabinetMaterialToken) ||
      hardwareKindFromMaterialToken(
        (function ancestorTok() {
          let p = mesh.parent;
          for (let i = 0; i < 16 && p; i++) {
            const t = p.userData?.cldCabinetMaterialToken;
            if (t) return t;
            p = p.parent;
          }
          return '';
        })(),
      );
    return tok || 'plastic';
  }

  const fromToken = hardwareKindFromMaterialToken(ud.cldCabinetMaterialToken);
  if (fromToken) return fromToken;

  if (/^furni_hinge_/i.test(fullName)) return 'metal';

  const specId = resolveModelSpecId(mesh);
  if (specId === '5' || specId === '6') return 'metal';
  if (specId === '7' || specId === '8' || specId === '9' || specId === '10') return 'plastic';

  let p = mesh.parent;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    const pn = String(p.name || '').toLowerCase();
    const ancestorToken = hardwareKindFromMaterialToken(pud.cldCabinetMaterialToken);
    if (ancestorToken) return ancestorToken;
    if (pud.isHingeCabinetModelMetal || pud.cldHingeCatalogModel || pud.isCatalogHingeModule) {
      return 'metal';
    }
    if (pud.cldGuideCabinetModel) return 'plastic';
    const buildItem = pud.cldBuildItem;
    const et = String(buildItem?.spec?.element_type || '').toLowerCase();
    if (et === 'catalog_31' || et === 'hinges') return 'metal';
    if (et === 'catalog_34') return 'plastic';
    const ancestorSpec = String(pud.modelSpecId || '').trim();
    if (ancestorSpec === '5' || ancestorSpec === '6') return 'metal';
    if (ancestorSpec === '7' || ancestorSpec === '8' || ancestorSpec === '9' || ancestorSpec === '10') {
      return 'plastic';
    }
    if (/петл|hinge/i.test(pn) && (pud.isCabinetModel || pud.isAccessory || pud.isCatalogHingeModule)) {
      return 'metal';
    }
    p = p.parent;
  }

  if (/направл|guide|runner|telescop|011_plastic|white_plastic|model_.*направл|modelplaceholder_.*направл/.test(nm)) {
    return 'plastic';
  }
  if (/galvanized|004_galvan|оцинков|015_screw|петл|hinge/.test(nm)) return 'metal';
  if (/rubber|006_black|резин/.test(nm)) return 'rubber';

  if (ud.isAccessory && !shouldExcludeMeshFromFurnitureBBox(mesh)) {
    if (/metal|металл|hinge|петл/.test(nm)) return 'metal';
    if (/направл|guide|runner|telescop/.test(nm)) return 'plastic';
  }

  return null;
}

function isServiceMeshForCabinetLighting(mesh) {
  if (!mesh?.isMesh) return true;
  const ud = mesh.userData || {};
  const nm = String(mesh.name || '');

  if (detectCabinetHardwareKind(mesh)) return false;

  if (ud.isWallAo || ud.isContactShadow || ud.isCabinetWallHalo || ud.isShelfContactAo) return true;
  if (ud.isHole || ud.furniDrillHole || ud.holeSpec) return true;
  if (ud.fromDrillTemplateModel) return true;
  if (ud.previewOnly || ud.isRodCompanion || ud.isShelfProp || ud.isVisualOnly) return true;
  if (ud.isHingeDebugVolume || ud.isSectionVolume) return true;
  if (nm.startsWith('__cld_')) return true;
  if (/^Hole_/i.test(nm) || /^furni_hole_/i.test(nm)) return true;
  if (/^rod_companion_/i.test(nm)) return true;
  if (/^shelf_prop_/i.test(nm)) return true;

  let p = mesh.parent;
  for (let i = 0; i < 16 && p; i++) {
    const pn = String(p.name || '');
    const pud = p.userData || {};
    if (pud.isShelfProp || pud.isRodCompanion) return true;
    if (/^shelf_prop_/i.test(pn) || /^rod_companion_/i.test(pn)) return true;
    if (
      pn === '__furni_drill_holes' ||
      pn === '__furniture_own' ||
      pn === '__hinge_debug_vols' ||
      pn === '__hinge_debug_vols_door' ||
      pn === 'hinge_hole_debug'
    ) {
      return true;
    }
    p = p.parent;
  }
  return false;
}

function meshIsJointSchemeHardwareStudio(mesh) {
  if (!mesh) return false;
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const pud = p.userData || {};
    if (
      pud.fromJointScheme ||
      pud.jointHardwareMesh ||
      Number(pud.joint_hardware) === 1 ||
      Number(pud.jointTemplateFrame) === 1 ||
      Number(pud.jointTemplateModel) === 1 ||
      Number(pud.spec?.joint_template_frame) === 1 ||
      Number(pud.spec?.joint_template_model) === 1 ||
      Number(pud.spec?.joint_hardware) === 1
    ) {
      return true;
    }
    if (/Эксцентр|Конфирм|Крепёж|Крепеж/i.test(String(p.name || ''))) return true;
    p = p.parent;
  }
  return false;
}

/** Доска столешницы в дереве модуля (type:countertop / «Столешница*»). */
function meshIsKitchenCountertopBoard(mesh) {
  if (!mesh?.isMesh) return false;
  let p = mesh;
  for (let i = 0; i < 10 && p; i++) {
    const ud = p.userData || {};
    const t = String(ud.type || ud.originalType || ud.detailType || '').toLowerCase();
    if (t === 'countertop' || t === 'tabletop') return true;
    const nm = String(p.name || '');
    if (/столеш/i.test(nm)) return true;
    p = p.parent;
  }
  return false;
}

function shouldSkipCabinetLighting(mesh) {
  if (!mesh?.isMesh) return true;
  const ud = mesh.userData || {};
  const nm = String(mesh.name || '');

  // Стык: IKEA-шейдер затирает Contours (оранжевый/aluminium) → «в логе есть, глазу нет».
  if (meshIsJointSchemeHardwareStudio(mesh)) return true;

  /**
   * Опоры: оставляем MeshStandard с model_key_material (как карточка 3D).
   * Ikea plastic bind сбрасывал цвет на GLB/дефолт — «оранжевые ножки».
   */
  if (meshIsKitchenSupportLeg(mesh)) return true;

  /**
   * Столешница модуля: не в dump corpus (010 white / чёрный шейдер без map).
   * Текстура — из tabletop_items / ClodisBuilder, как в админ-превью.
   */
  if (meshIsKitchenCountertopBoard(mesh)) return true;

  /**
   * Gola / прочие cabinet_model с карточкой: тот же MeshStandard, что в админке.
   * material_id=2 (Opora) → plastic bind → снова оранжевый GLB.
   */
  if (meshIsCatalogPaintedCabinetModel(mesh)) return true;

  /** До hardware: иначе chrome штанги ловит вешалки как metal. */
  if (isLifestylePropMesh(mesh)) return true;
  if (ud.isRodCompanion || ud.isShelfProp || ud.isVisualOnly || ud.previewOnly) return true;

  if (detectCabinetHardwareKind(mesh)) return false;

  if (isSectionTrimFacadeMesh(mesh)) return false;
  if (isLitCabinetEdge(ud)) return false;

  if (isServiceMeshForCabinetLighting(mesh)) return true;
  if (shouldExcludeMeshFromFurnitureBBox(mesh)) return true;

  if (ud.isHandle || ud.isFacadeHandle) return true;
  if (nm === '__cld_facade_handle' || /handle/i.test(nm)) return true;

  return false;
}

/** Обклад = шкаф (trim), не стена (wall). */
function detectCabinetMeshKind(mesh) {
  if (isLifestylePropMesh(mesh)) return null;
  const hw = detectCabinetHardwareKind(mesh);
  if (hw) return hw;

  const ud = mesh.userData || {};
  const nm = String(mesh.name || '');

  if (isSectionTrimFacadeMesh(mesh)) return 'trim';

  if (isLitCabinetEdge(ud)) {
    if (isFacadeEdgeStrip(mesh)) return ud.sectionTrimUsesOutsideDecor ? 'trim' : 'facade';
    return 'corpus';
  }

  if (ud.isFacade === true || ud.isFacadeShell === true) return 'facade';
  /** Back before isBody — Задняя стенка_core had isBody and was mis-tagged corpus (003 albedo). */
  if (/задн|зад_|backside|003_back|back_/i.test(nm) && !ud.isFacade) return 'back';
  if (ud.isBody === true) return 'corpus';

  let p = mesh;
  for (let i = 0; i < 20 && p; i++) {
    const pud = p.userData || {};
    const pn = String(p.name || '');
    if (pud.isHandle || /ручк/i.test(pn)) return null;
    if (pud.sectionTrimUsesOutsideDecor === true) return 'trim';
    if (pud.isFacade || pud.isFacadeShell || /^facades_/i.test(pn)) return 'facade';
    if (pud.layoutRole === 'corpus' || pud.isBody) return 'corpus';
    // «Петля накладная корпус» contains «корпус» — that is the hinge GLB, not a panel.
    if (/корпус/i.test(pn) && !/петл|hinge/i.test(pn)) return 'corpus';
    if (pud.layoutRole === 'plinth' || /цокол/i.test(pn)) return 'corpus';
    if (pud.layoutRole === 'top' || /крыш|антресол/i.test(pn)) return 'corpus';
    p = p.parent;
  }

  if (ud.isDetail === true) return 'corpus';
  if (mesh.geometry && mesh.visible !== false) return 'corpus';
  return null;
}

/** Dump PAX white: GLB slot 010/003 — not ClodisBuilder #ffffff. Step 5 keeps catalog. */
const IKEA_V0_DUMP_PANEL_KINDS = new Set(['corpus', 'back', 'facade', 'trim']);

function catalogParamsFromMeshOrAncestors(mesh) {
  const hinge = meshIsCatalogHinge(mesh);
  let p = mesh;
  for (let i = 0; i < 24 && p; i++) {
    const params = p.userData?.cldCabinetMaterialParams;
    if (params && typeof params === 'object') {
      const pud = p.userData || {};
      const skipPanelAncestor =
        hinge &&
        p !== mesh &&
        !pud.cldHingeCatalogModel &&
        !pud.isHingeCabinetModelMetal &&
        !isHingePartToken(pud.hingePart) &&
        !isHingeCabinetModelSpecId(pud.modelSpecId);
      if (skipPanelAncestor) {
        p = p.parent;
        continue;
      }
      return params;
    }
    p = p.parent;
  }
  if (hinge && typeof window !== 'undefined' && window.__cldHingeHardwareMaterialParams) {
    return window.__cldHingeHardwareMaterialParams;
  }
  return null;
}

function extractBindOptsFromMaterial(mesh, kind) {
  const old = mesh.material;
  const mats = Array.isArray(old) ? old : [old];
  const m = mats[0];
  if (!m) return {};
  const catalogParams = catalogParamsFromMeshOrAncestors(mesh);
  const fromCatalog = catalogParams ? ikeaV0BindOptsFromCatalogParams(catalogParams) : {};
  const fromMaterial = ikeaV0BindOptsFromMaterial(m, kind);
  if (kind === 'metal' || kind === 'rubber' || kind === 'plastic') {
    const opts = { ...fromMaterial, ...fromCatalog };
    /** Иначе dump-bind оставляет diffuseLinear и перебивает hex карточки. */
    if (fromCatalog.color) delete opts.diffuseLinear;
    if (catalogParams && String(catalogParams.map || '').trim()) {
      opts.color = new THREE.Color(0xffffff);
      delete opts.diffuseLinear;
    } else if (catalogParams && !String(catalogParams.map || '').trim()) {
      opts.map = null;
    }
    opts.side = THREE.DoubleSide;
    opts.cabinetHardware = true;
    if (kind === 'plastic' && opts.roughness == null) opts.roughness = 0.6;
    if (isShelfPropMesh(mesh)) {
      /** Карточка шкафа (#fff) на предках не должна перебивать цвет GLB. */
      const own = ikeaV0BindOptsFromMaterial(m, kind);
      opts.color = own.color;
      opts.map = own.map || null;
      delete opts.diffuseLinear;
      opts.metalness = 0;
      opts.roughness = 0.9;
      opts.cabinetHardware = true;
      const c = opts.color;
      const tooDark = !opts.map && (!c?.isColor || c.r + c.g + c.b < 0.08);
      const tooWhite = c?.isColor && c.r > 0.92 && c.g > 0.92 && c.b > 0.88 && !opts.map;
      if (tooDark || tooWhite) {
        opts.color = new THREE.Color(shelfPropFabricHex(mesh.name));
      }
    }
    return opts;
  }
  const opts = {};
  if (kind === 'facade' || kind === 'trim' || isLitCabinetEdge(mesh.userData || {})) {
    opts.side = THREE.DoubleSide;
  }
  /** Step 5 finish already on ikea v0 — keep catalog hex/map. */
  if (IKEA_V0_DUMP_PANEL_KINDS.has(kind) && m.userData?.__cldIkeaV0Step5Decor) {
    return { ...fromMaterial, ...opts };
  }
  /**
   * White fixture = dump slot (010_White corpus/facade/trim, 003_Backside back).
   * Do not copy MeshStandard color/roughness/map from ClodisBuilder.
   */
  if (IKEA_V0_DUMP_PANEL_KINDS.has(kind)) {
    return opts;
  }
  return { ...fromMaterial, ...fromCatalog, ...opts };
}

function applyCatalogMaterialToHardwareMesh(mesh) {
  if (isShelfPropMesh(mesh)) return false;
  const params = catalogParamsFromMeshOrAncestors(mesh);
  if (!params) return false;
  const kind = detectCabinetHardwareKind(mesh);
  if (!kind) return false;
  const catalogMap = String(params.map || '').trim();
  if (!catalogMap) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (m && !m.userData?.__cldIkeaV0) m.map = null;
    }
  }
  return applyIkeaV0CatalogMaterialToMesh(
    mesh,
    catalogMap ? { ...params, map: catalogMap, color: '#ffffff' } : { ...params, map: '' },
    kind,
  );
}

function meshHasIkeaV0Material(mesh) {
  const m = mesh?.material;
  if (!m) return false;
  if (Array.isArray(m)) {
    if (!m.length) return false;
    return m.every((x) => x?.userData?.__cldIkeaV0);
  }
  return !!m.userData?.__cldIkeaV0;
}

function meshIkeaV0Kind(mesh) {
  const m = mesh?.material;
  const m0 = Array.isArray(m) ? m[0] : m;
  return m0?.userData?.__cldIkeaV0Kind || '';
}

function bindCabinetMesh(mesh) {
  if (shouldSkipCabinetLighting(mesh)) return false;
  const kind = detectCabinetMeshKind(mesh);
  if (!kind) return false;
  /** Уже на IKEA-шейдере — не пересобирать (relayout соседей в нише). */
  if (meshHasIkeaV0Material(mesh)) {
    const cur = meshIkeaV0Kind(mesh);
    // Было corpus из-за plinth → нужен plastic/metal с model_key_material (Opora).
    const upgradeToHw =
      IKEA_V0_HARDWARE_KINDS.has(kind) && cur && !IKEA_V0_HARDWARE_KINDS.has(cur);
    if (!upgradeToHw) {
      // Опоры/фурнитура: params могли прийти после первого bind — дожать цвет с карточки.
      if (IKEA_V0_HARDWARE_KINDS.has(kind)) applyCatalogMaterialToHardwareMesh(mesh);
      return false;
    }
  }
  const opts = extractBindOptsFromMaterial(mesh, kind);
  /** Обклад: контакт на полу (layer5), не в Soft AO стены (не layer2). */
  if (kind === 'trim') {
    opts.softCaster = false;
    opts.softAoSilhouette = false;
    opts.softFloorCaster = true;
  }
  /**
   * Фурнитура не в Soft height. Полки/ящики — dump layerMask 3, softCaster on
   * (catalog_29 id «6» must not inherit hinge softCaster=false).
   */
  if (IKEA_V0_HARDWARE_KINDS.has(kind) && !isInteriorFillSoftCasterMesh(mesh)) {
    opts.softCaster = false;
  }
  if (isShelfPropMesh(mesh)) {
    opts.softCaster = false;
    opts.softAoSilhouette = false;
    opts.softFloorCaster = false;
  }
  const ok = bindMeshToIkeaV0(mesh, kind, opts);
  if (!ok) return false;
  if (IKEA_V0_HARDWARE_KINDS.has(kind)) {
    applyCatalogMaterialToHardwareMesh(mesh);
  }
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return true;
}

function bindCabinetRoot(root) {
  if (!root) return 0;
  let n = 0;
  let meshCandidates = 0;
  let alreadyBound = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.material || shouldSkipCabinetLighting(o)) return;
    if (!detectCabinetMeshKind(o)) return;
    meshCandidates += 1;
    if (meshHasIkeaV0Material(o)) {
      alreadyBound += 1;
      if (detectCabinetHardwareKind(o)) applyCatalogMaterialToHardwareMesh(o);
      return;
    }
    if (bindCabinetMesh(o)) n += 1;
  });
  if (n > 0) {
    syncIkeaV0MaterialsUnderRoot(root);
  } else if (meshCandidates > 0 && alreadyBound === 0) {
    console.warn(`[IKEA v0] C1 bind skipped · meshes=${meshCandidates} · bound=0`);
  }
  return n;
}

function bindHardwareMeshesUnder(root) {
  if (!root) return 0;
  let n = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!detectCabinetHardwareKind(o)) return;
    if (bindCabinetMesh(o)) n += 1;
  });
  return n;
}

function meshSectionId(mesh) {
  const sid = mesh?.userData?.sectionId;
  if (sid != null && sid !== '') return String(sid);
  let p = mesh?.parent;
  for (let i = 0; i < 16 && p; i++) {
    if (p.userData?.sectionId != null && p.userData.sectionId !== '') {
      return String(p.userData.sectionId);
    }
    p = p.parent;
  }
  return '';
}

function bindSectionTrimMeshesUnder(root) {
  if (!root) return 0;
  let n = 0;
  root.traverse((o) => {
    if (!o.isMesh || !isSectionTrimFacadeMesh(o)) return;
    if (bindCabinetMesh(o)) n += 1;
  });
  return n;
}

export function refreshCabinetEdgeIkeaV0(edgeMesh) {
  return bindCabinetMesh(edgeMesh);
}

/**
 * @param {THREE.Object3D} root
 * @param {{ syncLight?: boolean }} [_options] syncLight default true — один Soft/Spot/cavity после bind
 */
export function applyRoomCabinetStudioLook(root, _options = {}) {
  const nCab = bindCabinetRoot(root);
  const sid = root?.userData?.sectionId;
  const nTrim =
    sid != null ? applySectionTrimStudioLookForSectionId(sid, { syncLight: false }) : bindSectionTrimMeshesUnder(state.scene);
  const n = nCab + nTrim;
  if (n > 0 && typeof window !== 'undefined' && window.__CLD_DEBUG_IKEA_BIND === true) {
    console.warn(`[IKEA v0] C1 bind · cabinet=${nCab} · trim=${nTrim}`);
  }
  if (n > 0 && _options.syncLight !== false) {
    syncIkeaRoomLightV0();
  }
  return n;
}

/** После step5 — только фурнитура; декор корпуса/фасада не затираем. */
export function refreshCabinetStudioAfterDecor(root, _options = {}) {
  const n = bindHardwareMeshesUnder(root);
  if (n > 0 && _options.syncLight !== false) {
    syncIkeaRoomLightV0();
  }
  return n;
}

export function syncAllRoomCabinetStudio(scene, _doorsOpen) {
  const sc = scene || state.scene;
  if (!sc) return 0;
  let n = 0;
  sc.traverse((o) => {
    if (o?.userData?.isFurniture) n += bindCabinetRoot(o);
  });
  n += bindSectionTrimMeshesUnder(sc);
  if (n > 0) syncIkeaRoomLightV0();
  return n;
}

/**
 * Синк света после точечных bind'ов схлопывается в один вызов на кадр: одно изменение
 * мебели дёргает updateFurnitureInSection несколько раз (второй проход раскладки +
 * доводка после async GLB петель), и каждый прогон запускал полный Soft/Spot/cavity.
 */
let _scopedLightSyncRaf = 0;
function scheduleScopedIkeaLightSync() {
  if (_scopedLightSyncRaf) return;
  if (typeof requestAnimationFrame !== 'function') {
    syncIkeaRoomLightV0();
    return;
  }
  _scopedLightSyncRaf = requestAnimationFrame(() => {
    _scopedLightSyncRaf = 0;
    syncIkeaRoomLightV0();
  });
}

/**
 * Точечная версия syncAllRoomCabinetStudio — только мебель и обклад ОДНОЙ секции.
 * Глобальный вариант обходил всю сцену на каждое изменение мебели и заново подвязывал
 * все уже стоящие шкафы, из-за чего расстановка стоила O(n²): девятый шкаф ставился
 * примерно в девять раз дольше первого. Здесь работа зависит только от размера секции.
 * @param {string|number} sectionId
 * @param {THREE.Object3D} [scene]
 */
export function syncRoomCabinetStudioForSectionId(sectionId, scene) {
  const sc = scene || state.scene;
  if (!sc || sectionId == null || sectionId === '') return 0;
  const sid = String(sectionId);
  const roots = [];
  sc.traverse((o) => {
    if (!o?.userData?.isFurniture) return;
    if (meshSectionId(o) !== sid) return;
    roots.push(o);
  });
  return syncRoomCabinetStudioForRoots(roots, { sectionId: sid });
}

/**
 * Bind только переданных корней + обклад секции. Уже подвязанные меши пропускаются
 * (см. bindCabinetRoot), поэтому постановка N-го шкафа в нише не пересобирает соседей.
 * Свет всегда планируется один раз на кадр — Soft должен увидеть новый caster.
 * @param {THREE.Object3D[]} roots
 * @param {{ sectionId?: string|number, syncLight?: boolean }} [opts]
 */
export function syncRoomCabinetStudioForRoots(roots, opts = {}) {
  const list = Array.isArray(roots) ? roots : [];
  let n = 0;
  let sectionId = opts.sectionId;
  for (let i = 0; i < list.length; i++) {
    const root = list[i];
    if (!root) continue;
    n += bindCabinetRoot(root);
    if (sectionId == null || sectionId === '') {
      const sid = root.userData?.sectionId;
      if (sid != null && sid !== '') sectionId = sid;
    }
  }
  if (sectionId != null && sectionId !== '') {
    n += applySectionTrimStudioLookForSectionId(sectionId, { syncLight: false });
  }
  if (opts.syncLight !== false) scheduleScopedIkeaLightSync();
  return n;
}

export function syncAllSectionTrimStudio(scene) {
  const sc = scene || state.scene;
  if (!sc) return 0;
  const n = bindSectionTrimMeshesUnder(sc);
  if (n > 0) syncIkeaRoomLightV0();
  return n;
}

/** Обклад только на одной стене — без Soft (syncLight:false). Для place у окна. */
export function syncSectionTrimStudioForWall(wallName, options = {}) {
  const sc = state.scene;
  if (!sc || !Array.isArray(state.customSections)) return 0;
  const norm = String(wallName || '').trim().toLowerCase();
  if (!norm) return syncAllSectionTrimStudio(sc);
  let n = 0;
  const sectionIds = new Set();
  for (const sec of state.customSections) {
    if (!sec || (sec.wallName || '').toLowerCase() !== norm) continue;
    if (sec.id != null) sectionIds.add(String(sec.id));
    n += applySectionTrimStudioLookForSectionId(sec.id, { syncLight: false });
  }
  // TransitionAutoTopCap / HeightMismatch на scene с wallName.
  sc.traverse((o) => {
    if (!o?.isMesh || !o.material) return;
    if (!isSectionTrimFacadeMesh(o) && !o.userData?.isSectionTransitionPart) return;
    if (String(o.userData?.wallName || '').toLowerCase() !== norm) return;
    const sid = o.userData?.sectionId != null ? String(o.userData.sectionId) : '';
    if (sid && sectionIds.has(sid)) return; // уже через sectionId
    if (bindCabinetMesh(o)) n += 1;
  });
  if (n > 0 && options.syncLight !== false) syncIkeaRoomLightV0();
  return n;
}

export function applySectionTrimStudioLookForSectionId(sectionId, _options = {}) {
  const sc = state.scene;
  if (!sc || sectionId == null) return 0;
  const sid = String(sectionId);
  let n = 0;
  sc.traverse((o) => {
    if (!o.isMesh || !isSectionTrimFacadeMesh(o)) return;
    if (meshSectionId(o) !== sid) return;
    if (bindCabinetMesh(o)) n += 1;
  });
  if (n > 0 && _options.syncLight !== false) {
    syncIkeaRoomLightV0();
  }
  return n;
}

/** Обклад после rebuild — снять layer-2 (contact только под корпусом шкафа). */
export function stripSectionTrimSoftHeightForSectionId(sectionId) {
  const sc = state.scene;
  if (!sc || sectionId == null) return 0;
  const sid = String(sectionId);
  let n = 0;
  sc.traverse((o) => {
    if (!o.isMesh || !isSectionTrimFacadeMesh(o)) return;
    if (meshSectionId(o) !== sid) return;
    o.layers.disable(IKEA_V0_SOFT_LAYER);
    n += 1;
  });
  if (n > 0) {
    applySectionTrimStudioLookForSectionId(sectionId);
  }
  return n;
}

/** Coalesce rebind + Soft/Spot/cavity после place / async GLB — один flush. */
const _pendingStudioRebindRoots = new Set();
let _studioRebindTimer = null;
let _needIkeaLightSync = false;
/** Скользящий debounce: после place Soft не бьёт GPU в тот же тик, что сборка шкафа. */
const STUDIO_REBIND_DEBOUNCE_MS = 280;

function resolveFurnitureRootForRebind(obj) {
  let p = obj;
  for (let i = 0; i < 32 && p; i++) {
    if (p.isGroup && p.userData?.isFurniture) return p;
    p = p.parent;
  }
  return obj;
}

function bumpStudioRebindTimer() {
  if (_studioRebindTimer != null) clearTimeout(_studioRebindTimer);
  _studioRebindTimer = setTimeout(() => {
    _studioRebindTimer = null;
    flushPendingCabinetStudioRebinds();
  }, STUDIO_REBIND_DEBOUNCE_MS);
}

export function scheduleCabinetStudioRebind(root) {
  if (root) _pendingStudioRebindRoots.add(resolveFurnitureRootForRebind(root));
  _needIkeaLightSync = true;
  bumpStudioRebindTimer();
}

/** Только Soft/Spot/cavity (без повторного bind) — после place. */
export function scheduleIkeaRoomLightSync() {
  _needIkeaLightSync = true;
  bumpStudioRebindTimer();
}

export function flushPendingCabinetStudioRebinds() {
  if (_studioRebindTimer != null) {
    clearTimeout(_studioRebindTimer);
    _studioRebindTimer = null;
  }
  if (state._webglContextLost) {
    _pendingStudioRebindRoots.clear();
    _needIkeaLightSync = false;
    return 0;
  }
  const roots = [..._pendingStudioRebindRoots];
  _pendingStudioRebindRoots.clear();
  const needLight = _needIkeaLightSync || roots.length > 0;
  _needIkeaLightSync = false;
  let n = 0;
  for (const root of roots) {
    if (!root) continue;
    const furnitureRoot = resolveFurnitureRootForRebind(root);
    if (!furnitureRoot.parent && furnitureRoot.userData?.isFurniture !== true) continue;
    try {
      n += applyRoomCabinetStudioLook(furnitureRoot, { syncLight: false });
    } catch (_) {}
  }
  if (needLight && !state._webglContextLost) {
    const t0 = performance.now();
    try {
      syncIkeaRoomLightV0();
      const ms = Math.round(performance.now() - t0);
      if (typeof console !== 'undefined' && ms >= 16) {
        console.log('[PLACE-POST] softSpotSync', { ms, studioRebinds: n });
      }
    } catch (e) {
      try {
        const gl = state.renderer?.getContext?.();
        if (gl && typeof gl.isContextLost === 'function' && gl.isContextLost()) {
          state._webglContextLost = true;
        }
      } catch (_) {}
      console.warn('[CLD] Soft/Spot sync aborted (GPU)', e?.message || e);
    }
  }
  return n;
}

export function installCabinetLookTuner() {}

if (typeof window !== 'undefined') {
  window.__cldSyncAllRoomCabinetStudio = syncAllRoomCabinetStudio;
  window.__cldSyncRoomCabinetStudioForSection = syncRoomCabinetStudioForSectionId;
  window.__cldSyncRoomCabinetStudioForRoots = syncRoomCabinetStudioForRoots;
  window.__cldSyncAllSectionTrimStudio = syncAllSectionTrimStudio;
  window.__cldSyncSectionTrimStudioForWall = syncSectionTrimStudioForWall;
  window.__cldApplyRoomCabinetStudioLook = applyRoomCabinetStudioLook;
  window.__cldRefreshCabinetStudioAfterDecor = refreshCabinetStudioAfterDecor;
  window.__cldRefreshCabinetEdgeIkeaV0 = refreshCabinetEdgeIkeaV0;
  window.__cldScheduleCabinetStudioRebind = scheduleCabinetStudioRebind;
  window.__cldQueueCabinetStudioRebind = scheduleCabinetStudioRebind;
  window.__cldScheduleIkeaRoomLightSync = scheduleIkeaRoomLightSync;
  window.__cldFlushPendingCabinetStudioRebinds = flushPendingCabinetStudioRebinds;
  /** Room openings (windows): same IKEA v0 shader as furniture, Soft/Spot cast off via opts. */
  window.__cldBindMeshToIkeaV0 = bindMeshToIkeaV0;
  try {
    window.__cldFlushPendingCabinetStudioRebinds?.();
  } catch (_) {}
}
