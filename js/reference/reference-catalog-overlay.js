/**
 * Dev-only: эталонные модули из reference_b3d/ → window.__CLD_CATALOGS_DATA.
 * Только localhost + ?refCatalog=1 / localStorage.__CLD_REF_CATALOG=1 (см. index.html).
 */
(function () {
  const REF_BASE = '/reference_b3d/';
  let _manifest = null;
  let _loaded = false;

  function refCatalogEnabled() {
    try {
      if (typeof window === 'undefined') return false;
      if (window.__CLD_FORCE_REFERENCE_CATALOG) return true;
      if (localStorage.getItem('__CLD_REF_CATALOG') === '1') return true;
      const q = new URLSearchParams(window.location.search);
      return q.get('refCatalog') === '1' || q.get('refCabinet') === '1';
    } catch (_) {
      return false;
    }
  }

  function catalogItemFromRefTree(id, label, elementType, planTree) {
    const tree = Array.isArray(planTree) ? planTree : [planTree];
    const name = label || `reference-${id}`;
    const item = {
      id: String(id),
      name,
      element_type: elementType,
      clodisJSON: tree,
      params: { clodisJSON: tree },
      data: { clodisJSON: tree },
    };
    try {
      item.data = JSON.stringify(item.data);
    } catch (_) {}
    return item;
  }

  function mergeCatalogItem(elementType, catalogItem) {
    if (!elementType || !catalogItem) return;
    window.__CLD_CATALOGS_DATA = window.__CLD_CATALOGS_DATA || {};
    const key = String(elementType).trim();
    if (!window.__CLD_CATALOGS_DATA[key]) {
      window.__CLD_CATALOGS_DATA[key] = { items: {} };
    }
    const bucket = window.__CLD_CATALOGS_DATA[key];
    if (!bucket.items || typeof bucket.items !== 'object' || Array.isArray(bucket.items)) {
      bucket.items = {};
    }
    const id = String(catalogItem.id);
    bucket.items[id] = catalogItem;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res.json();
  }

  async function loadManifest() {
    if (_manifest) return _manifest;
    _manifest = await fetchJson(REF_BASE + 'REFERENCE_MANIFEST.json');
    return _manifest;
  }

  async function loadReferenceCatalog(opts = {}) {
    const force = !!opts.force;
    if (_loaded && !force) {
      return { ok: true, cached: true, hydrated: 0 };
    }

    const manifest = await loadManifest();
    const entries = Array.isArray(manifest.items) ? manifest.items : [];
    let hydrated = 0;
    const errors = [];

    for (const entry of entries) {
      const id = String(entry.catalogId || '').trim();
      const et = String(entry.elementType || '').trim();
      const file = String(entry.file || '').trim();
      if (!id || !et || !file) continue;
      try {
        const planTree = await fetchJson(REF_BASE + file);
        const item = catalogItemFromRefTree(id, entry.label, et, planTree);
        mergeCatalogItem(et, item);
        hydrated++;
      } catch (e) {
        errors.push({ id, file, message: e?.message || String(e) });
      }
    }

    _loaded = errors.length === 0;
    const result = { ok: errors.length === 0, hydrated, errors, manifest };
    console.log('[REF-CATALOG]', result);
    return result;
  }

  async function getReferenceCabinetPlan() {
    const manifest = await loadManifest();
    const file =
      manifest?.cabinet?.file || 'cabinet-antresol-dver-v-pol.json';
    const plan = await fetchJson(REF_BASE + file);
    const sizeMm = manifest?.cabinet?.sizeMm || { x: 400, y: 2600, z: 400 };
    return { plan, sizeMm, label: manifest?.cabinet?.label || 'reference cabinet' };
  }

  function referenceCabinetVariables(sizeMm) {
    const y = Number(sizeMm?.y) || 2600;
    return {
      vysota_dobora: 50,
      h_bottom: 0,
      h_top: 0,
      tech_zone_mm: 0,
      corpus_antresol_mm: Math.max(0, y - 2100),
    };
  }

  async function previewReferenceCabinet(opts = {}) {
    await loadReferenceCatalog();
    const { plan, sizeMm, label } = await getReferenceCabinetPlan();
    const BuilderClass = window.ClodisBuilder || window.ClodisBuilder;
    if (!BuilderClass) {
      throw new Error('ClodisBuilder не загружен');
    }
    const scene =
      opts.scene ||
      (typeof window !== 'undefined' ? window.__cldRoomScene : null);
    if (!scene) {
      throw new Error('Нет сцены: дождитесь загрузки комнаты (__cldRoomScene)');
    }

    const root = Array.isArray(plan) ? plan[0] : plan;
    const builder = new BuilderClass();
    const built = builder.buildFromJSON(root, {
      sectionSize: { x: sizeMm.x, y: sizeMm.y, z: sizeMm.z },
      variables: referenceCabinetVariables(sizeMm),
      groups: { g0: { thickness: 16 } },
      wallThicknessMm: 16,
    });

    built.name = 'ReferenceCabinet_' + (label || 'preview');
    built.userData = built.userData || {};
    built.userData.isReferencePreview = true;
    built.position.set(
      Number(opts.x) || 0,
      Number(opts.y) || 0,
      Number(opts.z) || 0
    );

    const prev = scene.getObjectByName(built.name);
    if (prev) scene.remove(prev);
    scene.add(built);

    console.log('[REF-CABINET] preview', {
      name: built.name,
      sizeMm,
      children: built.children?.length,
    });
    return { group: built, sizeMm, plan: root };
  }

  function makeReferenceWardrobeCatalogItem() {
    return {
      id: 'ref-antresol-dver-v-pol',
      name: 'REF: Шкаф антресоль дверь в пол 400×2600×400',
      width: 400,
      height: 2600,
      depth: 400,
      placementKind: 'floor_in_niche',
      categoryIds: [],
      clodisJSON: null,
      _refCabinet: true,
    };
  }

  async function hydrateReferenceWardrobeItem(item) {
    if (!item?._refCabinet && !item?.refCabinet) return item;
    await loadReferenceCatalog();
    const { plan, sizeMm } = await getReferenceCabinetPlan();
    return Object.assign({}, item, {
      clodisJSON: plan,
      width: sizeMm.x,
      height: sizeMm.y,
      depth: sizeMm.z,
      params: Object.assign({}, item.params, {
        sectionSize: sizeMm,
        clodisVariables: referenceCabinetVariables(sizeMm),
      }),
    });
  }

  window.__cldRefCatalogEnabled = refCatalogEnabled;
  window.__cldLoadReferenceCatalog = loadReferenceCatalog;
  window.__cldGetReferenceCabinetPlan = getReferenceCabinetPlan;
  window.__cldPreviewReferenceCabinet = previewReferenceCabinet;
  window.__cldMakeReferenceWardrobeCatalogItem = makeReferenceWardrobeCatalogItem;
  window.__cldHydrateReferenceWardrobeItem = hydrateReferenceWardrobeItem;

  if (refCatalogEnabled()) {
    loadReferenceCatalog().catch((e) =>
      console.warn('[REF-CATALOG] auto-load failed:', e)
    );
  }
})();
