/**
 * Визуал полосок кромки в комнате — паритет с constructor-clodis.js _build_edges.
 */
import * as THREE from 'three';

const __edgeCatalogCache = new Map();

export function cldNum01(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : def;
}

export function cldParseHexColor(c, fallback = 0xffffff) {
  if (typeof c !== 'string') return fallback;
  const m = /^#([0-9a-fA-F]{6})$/.exec(c.trim());
  if (!m) return fallback;
  return parseInt(m[1], 16);
}

function normalizeTexUrl(u) {
  if (!u) return '';
  return String(u).split('?')[0].trim();
}

function urlsMatch(a, b) {
  const na = normalizeTexUrl(a);
  const nb = normalizeTexUrl(b);
  return !!(na && nb && na === nb);
}

/** Карта roughness/normal из того же JPG, что и color — не PBR; даёт «выбеленную» кромку. */
function resolveEdgeMapUrls(edgeData) {
  const ed = edgeData || {};
  const textureUrl = (ed.texture || ed.icon || '').toString().trim();
  let normalUrl = (ed.normalMap || '').toString().trim();
  let roughUrl = (ed.roughnessMap || '').toString().trim();
  if (textureUrl && urlsMatch(normalUrl, textureUrl)) normalUrl = '';
  if (textureUrl && urlsMatch(roughUrl, textureUrl)) roughUrl = '';
  return { textureUrl, normalUrl, roughUrl };
}

function syncEdgeDataWithFacadeDecor(edgeData, options = {}) {
  const decorFallback = options.decorFallback;
  if (!decorFallback || typeof decorFallback !== 'object') return edgeData || {};
  const ed = { ...(edgeData || {}) };
  const edgeTex = (ed.texture || ed.icon || '').toString().trim();
  const decorTex = (decorFallback.texture || '').toString().trim();
  if (!decorTex) return ed;
  if (!edgeTex || urlsMatch(edgeTex, decorTex)) {
    ed.texture = decorTex;
    ed.icon = decorTex;
    ed.normalMap = '';
    ed.roughnessMap = '';
    ed.roughness = options.facadeRoughness ?? decorFallback.roughness ?? 0.7;
    ed.metalness = options.facadeMetalness ?? decorFallback.metalness ?? 0.2;
  }
  return ed;
}

/** Корпус шага 5: шаблон часто хранит color:#fff и текстуру белой кромки — подменяем декором плиты. */
function syncEdgeDataWithBodyDecor(edgeData, options = {}) {
  const decor = options.bodyDecorFallback || options.decorFallback;
  if (!decor || typeof decor !== 'object') return edgeData || {};
  const ed = { ...(edgeData || {}) };
  const decorTex = (decor.texture || '').toString().trim();
  const edgeTex = (ed.texture || ed.icon || '').toString().trim();
  const edgeColor = String(ed.color || '').trim().toLowerCase();
  const templateWhite = !edgeColor || edgeColor === '#ffffff' || edgeColor === '#fff';
  const decorHexRaw = (decor.color || decor.hex || '').toString().trim();
  const decorHex = /^#([0-9a-fA-F]{6})$/.test(decorHexRaw) ? decorHexRaw : '';

  if (!decorTex) {
    if (templateWhite && decorHex) {
      ed.color = decorHex;
      ed.texture = '';
      ed.icon = '';
      ed.normalMap = '';
      ed.roughnessMap = '';
      ed.roughness = decor.roughness ?? ed.roughness ?? 0.4;
      ed.metalness = decor.metalness ?? ed.metalness ?? 0;
      ed.__cldUseBodyDecorUv = true;
    }
    return ed;
  }

  const useBodyTex =
    options.bodyDecorSync === true ||
    !edgeTex ||
    urlsMatch(edgeTex, decorTex) ||
    templateWhite;
  if (!useBodyTex) return ed;
  ed.texture = decorTex;
  ed.icon = decorTex;
  ed.normalMap = '';
  ed.roughnessMap = '';
  ed.roughness = decor.roughness ?? ed.roughness ?? 0.4;
  ed.metalness = decor.metalness ?? ed.metalness ?? 0;
  ed.__cldUseBodyDecorUv = true;
  return ed;
}

export function applyEdgeTextureRepeat(tex, edgeData, modelWMm, modelHMm) {
  if (!tex || !edgeData) return;
  tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
  const realW = Math.max(1, Number(edgeData.realTextureWidth || edgeData.real_texture_width || 256));
  const realH = Math.max(1, Number(edgeData.realTextureHeight || edgeData.real_texture_height || 256));
  const stretchW = !!(edgeData.stretchWidth || edgeData.stretch_width);
  const stretchH = !!(edgeData.stretchHeight || edgeData.stretch_height);
  tex.repeat.set(
    stretchW ? 1 : Math.max(1, modelWMm / realW),
    stretchH ? 1 : Math.max(1, modelHMm / realH),
  );
  tex.needsUpdate = true;
}

function loadRoomTexture(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        if (tex.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
          tex.colorSpace = THREE.SRGBColorSpace;
        } else if (tex.encoding !== undefined && THREE.sRGBEncoding !== undefined) {
          tex.encoding = THREE.sRGBEncoding;
        }
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      () => resolve(null),
    );
  });
}

export function applyEdgeDecorVisuals(edgeMat, edgeData, repeatW, repeatH) {
  const ed = edgeData || {};
  const { textureUrl, normalUrl, roughUrl } = resolveEdgeMapUrls(ed);
  if (!textureUrl && !normalUrl && !roughUrl) return;

  const applyMaps = (tex, normalTex, roughTex) => {
    if (!edgeMat) return;
    if (tex) {
      const localTex = tex.clone();
      applyEdgeTextureRepeat(localTex, ed, repeatW, repeatH);
      edgeMat.map = localTex;
      edgeMat.color.set(0xffffff);
    }
    if (normalTex) {
      const n = normalTex.clone();
      n.needsUpdate = true;
      edgeMat.normalMap = n;
    }
    if (roughTex) {
      const r = roughTex.clone();
      r.needsUpdate = true;
      edgeMat.roughnessMap = r;
    }
    edgeMat.needsUpdate = true;
  };

  Promise.all([
    textureUrl ? loadRoomTexture(textureUrl) : null,
    normalUrl ? loadRoomTexture(normalUrl) : null,
    roughUrl ? loadRoomTexture(roughUrl) : null,
  ]).then(([tex, normalTex, roughTex]) => {
    applyMaps(tex, normalTex, roughTex);
  }).catch(() => {});
}

export function createRoomEdgeStripMaterial(edgeData, repeatW, repeatH) {
  const ed = edgeData || {};
  const deferBodyDecor = ed.__cldUseBodyDecorUv === true;
  const edgeMat = new THREE.MeshStandardMaterial({
    color: deferBodyDecor ? 0xffffff : cldParseHexColor(ed.color, 0xffffff),
    roughness: cldNum01(ed.roughness, deferBodyDecor ? 0.4 : 0.8),
    metalness: cldNum01(ed.metalness, 0),
    transparent: !!(ed.transparent || ed.transparency),
    opacity:
      ed.opacity != null && Number.isFinite(Number(ed.opacity))
        ? Math.max(0, Math.min(1, Number(ed.opacity)))
        : 1,
    side: ed.oneSided || ed.one_side ? THREE.FrontSide : THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
  });
  // Корпус шаг 5: текстура с root-space UV на refreshFurnitureDecors; здесь не грузим edge-repeat (иначе «выбеливание»).
  if (!deferBodyDecor) {
    applyEdgeDecorVisuals(edgeMat, ed, repeatW, repeatH);
  } else if (!ed.texture && !ed.icon && typeof ed.color === 'string') {
    edgeMat.color.setHex(cldParseHexColor(ed.color, 0xffffff));
  }
  if (deferBodyDecor) {
    edgeMat.userData = edgeMat.userData || {};
    edgeMat.userData.__cldDeferBodyDecor = true;
  }
  return edgeMat;
}

export async function resolveEdgeDataVisuals(edgeData) {
  const ed = edgeData && typeof edgeData === 'object' ? { ...edgeData } : {};
  const textureUrl = (ed.texture || ed.icon || '').toString().trim();
  const edgeId = Number(ed.decor_id ?? ed.edge_id ?? 0) || 0;
  if (textureUrl || !edgeId) return ed;

  const type = String(ed.type || 'butt_butts').trim() || 'butt_butts';
  const variantId = ed.variant_id != null ? ed.variant_id : '';
  const cacheKey = `${type}:${edgeId}:${variantId}`;
  if (__edgeCatalogCache.has(cacheKey)) {
    const cached = __edgeCatalogCache.get(cacheKey);
    return cached ? { ...ed, ...cached } : ed;
  }

  try {
    const resp = await fetch(
      `/api/catalog/item/${encodeURIComponent(type)}/${encodeURIComponent(String(edgeId))}?t=${Date.now()}`,
      { cache: 'no-store' },
    );
    if (!resp.ok) {
      __edgeCatalogCache.set(cacheKey, null);
      return ed;
    }
    const item = await resp.json();
    const enriched = {
      color: ed.color || item?.color || '#ffffff',
      texture: ed.texture || item?.texture || item?.icon || '',
      icon: ed.icon || item?.icon || '',
      roughness: ed.roughness ?? item?.roughness,
      metalness: ed.metalness ?? item?.metalness,
      transparent: ed.transparent ?? item?.transparent ?? item?.transparency,
      opacity: ed.opacity ?? item?.opacity,
      normalMap: ed.normalMap || item?.normalMap || '',
      roughnessMap: ed.roughnessMap || item?.roughnessMap || '',
      stretchWidth: ed.stretchWidth ?? item?.stretchWidth ?? item?.stretch_width,
      stretchHeight: ed.stretchHeight ?? item?.stretchHeight ?? item?.stretch_height,
      realTextureWidth: ed.realTextureWidth ?? item?.realTextureWidth ?? item?.real_texture_width,
      realTextureHeight: ed.realTextureHeight ?? item?.realTextureHeight ?? item?.real_texture_height,
      oneSided: ed.oneSided ?? item?.oneSided ?? item?.one_side,
    };
    __edgeCatalogCache.set(cacheKey, enriched);
    return { ...ed, ...enriched };
  } catch (_) {
    __edgeCatalogCache.set(cacheKey, null);
    return ed;
  }
}

/** Создать материал кромки + подгрузить каталог, если в JSON нет texture. */
export function buildRoomEdgeStripMaterial(edgeData, repeatW, repeatH, options = {}) {
  let ed = syncEdgeDataWithFacadeDecor(edgeData, options);
  ed = syncEdgeDataWithBodyDecor(ed, options);
  const edgeMat = createRoomEdgeStripMaterial(ed, repeatW, repeatH);
  const hasTexture = !!(ed.texture || ed.icon);
  const edgeId = Number(ed.decor_id ?? ed.edge_id ?? 0) || 0;
  const skipCatalogFetch = hasTexture || ed.__cldUseBodyDecorUv === true;
  if (!skipCatalogFetch && edgeId) {
    resolveEdgeDataVisuals(ed).then((enriched) => {
      enriched = syncEdgeDataWithFacadeDecor(enriched, options);
      enriched = syncEdgeDataWithBodyDecor(enriched, options);
      if (enriched.__cldUseBodyDecorUv === true) return;
      if (typeof enriched.color === 'string') {
        edgeMat.color.setHex(cldParseHexColor(enriched.color, edgeMat.color.getHex()));
      }
      if (enriched.roughness != null) edgeMat.roughness = cldNum01(enriched.roughness, edgeMat.roughness);
      if (enriched.metalness != null) edgeMat.metalness = cldNum01(enriched.metalness, edgeMat.metalness);
      applyEdgeDecorVisuals(edgeMat, enriched, repeatW, repeatH);
    }).catch(() => {});
  }
  return edgeMat;
}

if (typeof window !== 'undefined') {
  window.__cldRoomEdgeVisual = {
    cldNum01,
    cldParseHexColor,
    applyEdgeTextureRepeat,
    applyEdgeDecorVisuals,
    createRoomEdgeStripMaterial,
    resolveEdgeDataVisuals,
    buildRoomEdgeStripMaterial,
  };
}
