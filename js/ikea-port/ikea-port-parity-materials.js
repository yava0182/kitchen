/**
 * IKEA_PORT — dump MATERIAL-UBO presets (live kitchen capture).
 * Sources:
 *   docs/.../final-closure/MATERIAL-UBO-LIVE.json
 *   docs/.../IKEA-TOTAL-RENDER-EXTRACTION.json (phongMap live64 / spector64 wood)
 * Apply only on Phong proxies — does not mutate CLODIS source mats.
 */

/** @typedef {'floor'|'wall'|'ceiling'|'whiteCorpus'|'wood'|'none'} IkeaPortMatRole */

/**
 * White LDSP corpus — TOTAL live64 phongMap
 * diffuse≈0.949, specular≈0.0667, linearShininess≈0.498
 */
export const IKEA_PORT_MAT_WHITE_CORPUS = Object.freeze({
  id: 'whiteCorpus',
  diffuse: Object.freeze([0.9490196108818054, 0.9490196108818054, 0.9490196108818054]),
  specular: Object.freeze([0.06666667014360428, 0.06666667014360428, 0.06666667014360428]),
  linearShininess: 0.49803921580314636,
  keepMap: false,
  source: 'MATERIAL-UBO / TOTAL live64 phongMap',
});

/**
 * Soft white (non-wall) — dump specular+shininess from MATERIAL-UBO soft-white.
 */
export const IKEA_PORT_MAT_SOFT_WHITE = Object.freeze({
  id: 'softWhite',
  diffuse: Object.freeze([0.9570000171661377, 0.968999981880188, 0.9490000009536743]),
  specular: Object.freeze([0.06499999761581421, 0.06499999761581421, 0.06499999761581421]),
  linearShininess: 0.49803921580314636,
  keepMap: false,
  keepSourceDiffuseIfPresent: true,
  source: 'MATERIAL-UBO-LIVE soft-white',
});

/**
 * Wall plaster — SOT / Exp14 Step8A: rough 0.75 → linearShininess 0.25.
 * softWhite shininess≈0.5 on flat walls = specular glare band.
 */
export const IKEA_PORT_MAT_WALL = Object.freeze({
  id: 'wall',
  diffuse: Object.freeze([0.877005339, 0.874226034, 0.77851814]),
  specular: Object.freeze([0.06499999761581421, 0.06499999761581421, 0.06499999761581421]),
  linearShininess: 0.25,
  keepMap: false,
  keepSourceDiffuseIfPresent: true,
  source: 'SOT wall rough 0.75 + soft-white specular; albedo from Room when set',
});

/**
 * Warm wood — live BM3MAT lOakHV (session 2026-11-09) + TOTAL color match.
 * World UV scale 0.0005 (= 1/2000 mm) from BM3MAT uv0Transform.
 */
export const IKEA_PORT_MAT_WOOD = Object.freeze({
  id: 'wood',
  diffuse: Object.freeze([0.8745098039215686, 0.7529411764705882, 0.596078431372549]),
  specular: Object.freeze([0.39215686274509803, 0.39215686274509803, 0.39215686274509803]),
  linearShininess: 0.49803921580314636,
  keepMap: true,
  /** Prefer live IKEA oak albedo over CLODIS LDSP decor. */
  preferLiveOakMap: true,
  useWorldUv: true,
  worldUvScale: Object.freeze([0.0005, 0.0005]),
  source: 'live BM3MAT lOakHV + TOTAL wood color',
});

/** Floor herringbone tile — Room.js / IKEA GLB 640 mm (world XZ UV). */
export const IKEA_PORT_FLOOR_TILE_MM = 640;

/**
 * Floor — IKEA herringbone map kept; dump floor rough=1 → linearShininess floor.
 */
export const IKEA_PORT_MAT_FLOOR = Object.freeze({
  id: 'floor',
  diffuse: Object.freeze([1, 1, 1]),
  specular: Object.freeze([0.06666667014360428, 0.06666667014360428, 0.06666667014360428]),
  linearShininess: 0.01,
  keepMap: true,
  useWorldUv: true,
  worldUvScale: Object.freeze([1 / IKEA_PORT_FLOOR_TILE_MM, 1 / IKEA_PORT_FLOOR_TILE_MM]),
  source: 'floor extract rough=1 + world XZ / 640mm',
});

const LIVE_OAK_DIFFUSE_URL = '/images/textures/ikea/worktop/loak_hv_diffuse.jpg';

/** @type {import('three').Texture|null} */
let _liveOakMap = null;
/** @type {Promise<import('three').Texture>|null} */
let _liveOakMapPromise = null;

function ensureLiveOakMap() {
  if (_liveOakMap) return _liveOakMap;
  if (typeof window === 'undefined') return null;
  // Lazy sync stub: kick async load once; until ready fall back to source.map.
  if (!_liveOakMapPromise) {
    _liveOakMapPromise = import('three').then((THREE) => {
      const loader = new THREE.TextureLoader();
      return new Promise((resolve, reject) => {
        loader.load(
          LIVE_OAK_DIFFUSE_URL,
          (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            // Dump GAMMA_INPUT path: raw sRGB bytes → Phong inputToLinear.
            if ('colorSpace' in tex && THREE.NoColorSpace !== undefined) {
              tex.colorSpace = THREE.NoColorSpace;
            } else if ('encoding' in tex && THREE.LinearEncoding !== undefined) {
              tex.encoding = THREE.LinearEncoding;
            }
            tex.needsUpdate = true;
            _liveOakMap = tex;
            resolve(tex);
          },
          undefined,
          reject,
        );
      });
    }).catch(() => null);
  }
  return _liveOakMap;
}

/** Kick async load of live oak albedo (call from IKEA_PORT boot). */
export function preloadIkeaPortLiveOakMap() {
  ensureLiveOakMap();
  return _liveOakMapPromise;
}

/**
 * Ceiling — SOT rough 0.4 → linearShininess 0.6; near-white dump.
 */
export const IKEA_PORT_MAT_CEILING = Object.freeze({
  id: 'ceiling',
  diffuse: Object.freeze([0.991, 0.991, 0.991]),
  specular: Object.freeze([0.06666667014360428, 0.06666667014360428, 0.06666667014360428]),
  linearShininess: 0.6,
  keepMap: false,
  source: 'SOT ceiling rough 0.4 + dump specular',
});

const PRESETS = Object.freeze({
  whiteCorpus: IKEA_PORT_MAT_WHITE_CORPUS,
  softWhite: IKEA_PORT_MAT_SOFT_WHITE,
  wall: IKEA_PORT_MAT_WALL,
  wood: IKEA_PORT_MAT_WOOD,
  floor: IKEA_PORT_MAT_FLOOR,
  ceiling: IKEA_PORT_MAT_CEILING,
});

/**
 * @param {THREE.Object3D|null|undefined} mesh
 * @param {THREE.Material|null|undefined} source
 * @returns {IkeaPortMatRole}
 */
function mapUrlHint(source) {
  const map = source?.map;
  if (!map) return '';
  const img = map.image;
  const src =
    (typeof map.userData?.url === 'string' && map.userData.url) ||
    (img && (img.currentSrc || img.src)) ||
    (map.source?.data && (map.source.data.currentSrc || map.source.data.src)) ||
    '';
  return String(src);
}

export function classifyIkeaPortMatRole(mesh, source) {
  // 1) Explicit dump role tags (mesh or ancestors).
  let o = mesh;
  while (o) {
    const ud = o.userData || {};
    const role = ud.ikeaPortMatRole || ud.ikeaPortRole;
    if (role && PRESETS[role]) return /** @type {IkeaPortMatRole} */ (role);
    o = o.parent;
  }

  // 2) Mesh-local signals. Kitchen modules hang under wall placement groups
  //    (userData.wallName on ancestor) — must NOT inherit wall from that.
  const ud0 = mesh?.userData || {};
  const nm = `${mesh?.name || ''} ${source?.name || ''}`;
  // Опоры: исходный металл/чёрный из GLB+model_key_material, не whiteCorpus корпуса.
  if (
    ud0.cldSupportLeg === true ||
    /Model_Опора|Опора кухонная|support.?leg|cldSupportLeg/i.test(nm)
  ) {
    return 'none';
  }
  // Конфирматы / стыковой крепёж: цвет из GLB+model_key_material, не whiteCorpus.
  if (
    ud0.fromJointScheme === true ||
    ud0.joint_hardware === 1 ||
    ud0.jointHardware === 1 ||
    ud0.jointTemplateModel === 1 ||
    Number(ud0.joint_template_model) === 1 ||
    /confirmat|конфирмат|эксцентрик|minifix|рафикс|стяжк/i.test(nm)
  ) {
    return 'none';
  }
  if (ud0.isKitchenWorktop || ud0.__cldTabletopAdmin) return 'wood';
  if (/KitchenWorktop|Столешниц|столешн|countertop|tabletop|worktop/i.test(nm)) return 'wood';
  if (ud0.isCeiling || /ceiling/i.test(nm)) return 'ceiling';
  if (ud0.isFloor || ud0.isFloorCoating || ud0.isFloorBase || /floor|Floor|herringbone|parquet|паркет/i.test(nm)) {
    return 'floor';
  }
  if (ud0.wallName || ud0.isWall || ud0.isWallInner || /wall|Wall|paint_30/i.test(nm)) return 'wall';
  if (ud0.isFacade || ud0.isBody || ud0.isDetail) return 'whiteCorpus';

  // 3) Ancestor floor / ceiling / worktop / corpus — still skip wallName.
  //    Name-based wood already handled above so Столешница ≠ whiteCorpus via isBody parent.
  o = mesh?.parent;
  while (o) {
    const ud = o.userData || {};
    if (
      ud.cldSupportLeg === true ||
      /Model_Опора|Опора кухонная|support.?leg/i.test(String(o.name || ''))
    ) {
      return 'none';
    }
    if (
      ud.fromJointScheme === true ||
      ud.joint_hardware === 1 ||
      ud.jointTemplateModel === 1 ||
      Number(ud.joint_template_model) === 1
    ) {
      return 'none';
    }
    if (ud.isKitchenWorktop || ud.__cldTabletopAdmin) return 'wood';
    if (ud.isCeiling) return 'ceiling';
    if (ud.isFloor || ud.isFloorCoating || ud.isFloorBase) return 'floor';
    if (ud.isFacade || ud.isBody || ud.isDetail) return 'whiteCorpus';
    o = o.parent;
  }

  // Live room without ikeaPortMatRole tags (Room.js script bust lag):
  // IKEA parquet = PlaneGeometry @ y≈0 with ikea/floor map.
  const mapHint = mapUrlHint(source);
  if (/ikea\/floor|herringbone|diffuse\.jpg|ee604ccf/i.test(mapHint)) return 'floor';
  if (
    mesh?.isMesh &&
    mesh.geometry?.type === 'PlaneGeometry' &&
    Math.abs(Number(mesh.position?.y) || 0) < 1 &&
    source?.map &&
    source?.receiveShadow !== false
  ) {
    return 'floor';
  }

  // Textured wood-ish CLODIS mats → wood; else white kitchen default.
  const map = source?.map;
  if (map && source?.color) {
    const c = source.color;
    const max = Math.max(c.r, c.g, c.b);
    const min = Math.min(c.r, c.g, c.b);
    if (max > 0.15 && (max - min) > 0.08 && c.r > c.b) return 'wood';
  }
  // Decor worktop maps under /files/decor/ without warm tint still count as wood.
  if (map && /files\/decor|столеш|worktop|tabletop/i.test(mapHint + nm)) return 'wood';
  return 'whiteCorpus';
}

function isClodisStep5DecorSource(source) {
  if (!source) return false;
  const ud = source.userData || {};
  if (ud.step5DecorApplied === true || ud.__cldStep5DecorMap === true) return true;
  return source.map?.userData?.__cldStep5Decor === true;
}

/**
 * Своя столешка из админки (tabletop_items / ClodisBuilder):
 * не подменять на IKEA loak_hv и не world-UV — оставить map + repeat/rotation «вдоль».
 * @param {THREE.Material|null|undefined} source
 * @param {THREE.Object3D|null|undefined} mesh
 */
function isClodisAdminTabletop(source, mesh) {
  if (source?.userData?.__cldTabletopAdmin) return true;
  let o = mesh;
  for (let i = 0; i < 12 && o; i++) {
    const ud = o.userData || {};
    if (ud.__cldTabletopAdmin || ud.isKitchenWorktop || ud.cldKitchenCountertop === true) {
      return true;
    }
    const t = String(ud.type || ud.originalType || ud.detailType || '').toLowerCase();
    if (t === 'countertop' || t === 'tabletop') return true;
    if (/столеш|KitchenWorktop|countertop|tabletop/i.test(String(o.name || ''))) return true;
    o = o.parent;
  }
  return false;
}

/**
 * Apply dump preset onto Phong proxy uniforms (after sync from source).
 * @param {THREE.ShaderMaterial} proxy
 * @param {IkeaPortMatRole|string} role
 * @param {THREE.Material} [source]
 * @param {THREE.Object3D} [mesh]
 */
export function applyIkeaPortParityPreset(proxy, role, source, mesh) {
  const preset = PRESETS[role];
  if (!proxy?.uniforms || !preset) return { ok: false, role };

  const u = proxy.uniforms;
  const adminWt = isClodisAdminTabletop(source, mesh);

  // Шаг 5 (колесо декоров): всегда показывать выбор CLODIS.
  // Иначе whiteCorpus форсит dump-белый без map, а wood+preferLiveOakMap
  // подменяет ЛДСП на IKEA oak — «свет/цвет на 5 шаге не меняется».
  if (isClodisStep5DecorSource(source)) {
    if (source.color?.isColor) {
      u.diffuseColorRGB.value.copy(source.color);
    } else {
      u.diffuseColorRGB.value.setRGB(preset.diffuse[0], preset.diffuse[1], preset.diffuse[2]);
    }
    u.specularColorRGB.value.setRGB(preset.specular[0], preset.specular[1], preset.specular[2]);
    u.linearShininess.value = preset.linearShininess;
    if (source.map) {
      u.map.value = source.map;
      u.useMap.value = 1;
    } else {
      u.map.value = null;
      u.useMap.value = 0;
    }
    if (u.useWorldUv) u.useWorldUv.value = 0;
    proxy.userData.ikeaPortMatRole = 'step5Decor';
    proxy.userData.ikeaPortMatSource = 'CLODIS step5 wheel';
    return { ok: true, role: 'step5Decor', source: 'CLODIS step5' };
  }

  // Админ-столешка: цвет/карта/UV из ClodisBuilder, свет Ikea не затирает декор.
  if (adminWt) {
    if (source?.color?.isColor) {
      u.diffuseColorRGB.value.copy(source.color);
    } else {
      u.diffuseColorRGB.value.setRGB(1, 1, 1);
    }
    u.specularColorRGB.value.setRGB(preset.specular[0], preset.specular[1], preset.specular[2]);
    u.linearShininess.value = preset.linearShininess;
    if (source?.map) {
      u.map.value = source.map;
      u.useMap.value = 1;
      if (u.mapTransform && typeof source.map.updateMatrix === 'function') {
        source.map.updateMatrix();
        u.mapTransform.value.copy(source.map.matrix);
      }
      if (u.mapIsLinear) {
        const cs = source.map.colorSpace != null ? String(source.map.colorSpace) : '';
        const managed =
          cs === 'srgb' ||
          cs === 'srgb-linear' ||
          cs === 'SRGBColorSpace' ||
          cs === 'LinearSRGBColorSpace';
        u.mapIsLinear.value = managed ? 1 : 0;
      }
    } else {
      u.map.value = null;
      u.useMap.value = 0;
    }
    if (u.useWorldUv) u.useWorldUv.value = 0;
    proxy.userData.ikeaPortMatRole = preset.id;
    proxy.userData.ikeaPortMatSource = 'CLODIS admin tabletop';
    return { ok: true, role: preset.id, source: 'CLODIS admin tabletop' };
  }

  if (
    preset.keepSourceDiffuseIfPresent &&
    source?.color?.isColor &&
    (source.color.r + source.color.g + source.color.b) > 0.05
  ) {
    u.diffuseColorRGB.value.copy(source.color);
  } else {
    u.diffuseColorRGB.value.setRGB(preset.diffuse[0], preset.diffuse[1], preset.diffuse[2]);
  }
  u.specularColorRGB.value.setRGB(preset.specular[0], preset.specular[1], preset.specular[2]);
  u.linearShininess.value = preset.linearShininess;

  if (preset.keepMap && source?.map) {
    u.map.value = source.map;
    u.useMap.value = 1;
  } else if (!preset.keepMap) {
    // Never strip IKEA floor albedo if misclassified as solid white.
    // CLODIS step5 / ЛДСП на корпусе и фасаде — тоже не сдирать (иначе «плоский
    // пластик» вместо нашего икеевского белого с текстурой с колеса).
    const hint = mapUrlHint(source);
    const keepDecorMap =
      !!source?.map &&
      (/ikea\/floor|herringbone|diffuse\.jpg|ee604ccf/i.test(hint) ||
        /files\/decor|\/decor\/|material_2|ldsp|step5|фасад|белый/i.test(hint) ||
        source.userData?.__cldStep5DecorMap === true ||
        source.userData?.step5DecorApplied === true ||
        source.map?.userData?.__cldStep5Decor === true);
    if (keepDecorMap) {
      u.map.value = source.map;
      u.useMap.value = 1;
      // Под текстурой — цвет превью/источника, не форс dump albedo.
      if (source.color?.isColor) {
        u.diffuseColorRGB.value.copy(source.color);
      }
    } else {
      u.map.value = null;
      u.useMap.value = 0;
    }
  }

  // Live oak worktop albedo (BM3MAT session) when available.
  // Не для админ-столешки (ветка adminWt выше) — иначе затирает tabletop_items.
  if (preset.preferLiveOakMap) {
    const oak = ensureLiveOakMap();
    if (oak) {
      u.map.value = oak;
      u.useMap.value = 1;
      if (u.mapIsLinear) u.mapIsLinear.value = 0;
    }
  }

  // Dump / BM3MAT UV: world XZ scale, else Three map.matrix (repeat/rotation).
  if (u.useWorldUv && u.worldUvScale) {
    if (preset.useWorldUv && preset.worldUvScale) {
      u.useWorldUv.value = 1;
      u.worldUvScale.value.set(preset.worldUvScale[0], preset.worldUvScale[1]);
    } else {
      u.useWorldUv.value = 0;
    }
  }

  proxy.userData.ikeaPortMatRole = preset.id;
  proxy.userData.ikeaPortMatSource = preset.source;
  return { ok: true, role: preset.id, source: preset.source };
}

export function describeIkeaPortParityMaterials() {
  return {
    presets: Object.keys(PRESETS),
    whiteCorpus: IKEA_PORT_MAT_WHITE_CORPUS,
    softWhite: IKEA_PORT_MAT_SOFT_WHITE,
    wall: IKEA_PORT_MAT_WALL,
    wood: IKEA_PORT_MAT_WOOD,
    floor: IKEA_PORT_MAT_FLOOR,
    ceiling: IKEA_PORT_MAT_CEILING,
  };
}

if (typeof window !== 'undefined') {
  window.__cldIkeaPortParityMats = describeIkeaPortParityMaterials;
}
