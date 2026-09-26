/**
 * interiorTemplates — выбор шаблонов полки / ящика / штанги через каталог элементов.
 */
(function () {
  'use strict';

  const SHELF_CATALOG = 'catalog_29';
  const DRAWER_CATALOG = 'catalog_33';
  const ROD_MODELS_CATALOG = 'cabinet_model';
  const PICK_KEY = 'cld_interior_template_pick';
  const PICK_RESULT_KEY = 'cld_interior_template_pick_result';
  const DRAFT_KEY = 'cld_interior_templates_draft';

  const KIND_CONFIG = Object.freeze({
    shelf: {
      catalogType: SHELF_CATALOG,
      pickTitle: 'Выбор шаблона полки',
      emptyLabel: 'не выбрана',
    },
    drawer: {
      catalogType: DRAWER_CATALOG,
      pickTitle: 'Выбор шаблона ящика',
      emptyLabel: 'не выбран',
    },
    rod: {
      catalogType: ROD_MODELS_CATALOG,
      pickTitle: 'Выбор штанги (3D)',
      emptyLabel: 'не выбрана',
      isRod: true,
    },
    shelfProp: {
      catalogType: ROD_MODELS_CATALOG,
      pickTitle: 'Вещь на полке (3D)',
      emptyLabel: 'не выбрана',
    },
  });

  function normalizeItemsResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }

  function normalizeInteriorTemplates(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    function normCat(part) {
      const p = part && typeof part === 'object' ? part : null;
      if (!p) return null;
      let ct = String(p.catalogType || p.catalog_type || '').trim();
      const id = String(p.catalogId ?? p.catalog_id ?? p.id ?? '').trim();
      if (!ct || !id) return null;
      if (!ct.startsWith('catalog_')) ct = 'catalog_' + ct;
      const label = String(p.label || p.name || '').trim();
      return label ? { catalogType: ct, catalogId: id, label } : { catalogType: ct, catalogId: id };
    }
    function normRod(part) {
      const p = part && typeof part === 'object' ? part : null;
      if (!p) return null;
      const modelId = String(p.modelId ?? p.model_id ?? p.id ?? '').trim();
      if (!modelId) return null;
      const label = String(p.label || p.name || '').trim();
      return label ? { modelId, label } : { modelId };
    }
    function defaultShelfProps() {
      return {
        enabled: 0,
        slots: [
          { model_id: '', x_mm: -20, y_mm: 0, z_mm: 0, rot_y: 0 },
          { model_id: '', x_mm: 90, y_mm: 0, z_mm: 0, rot_y: 0 },
        ],
      };
    }
    function normalizeShelfProps(raw) {
      const src = raw && typeof raw === 'object' ? raw : {};
      const enabled = src.enabled === true || src.enabled === 1 || src.enabled === '1' ? 1 : 0;
      const rawSlots = Array.isArray(src.slots) ? src.slots : defaultShelfProps().slots;
      const slots = rawSlots.map((s) => {
        const p = s && typeof s === 'object' ? s : {};
        return {
          model_id: String(p.model_id ?? p.modelId ?? '').trim(),
          label: String(p.label || '').trim(),
          x_mm: Number.isFinite(Number(p.x_mm ?? p.x)) ? Number(p.x_mm ?? p.x) : 0,
          y_mm: Number.isFinite(Number(p.y_mm ?? p.y)) ? Number(p.y_mm ?? p.y) : 0,
          z_mm: Number.isFinite(Number(p.z_mm ?? p.z)) ? Number(p.z_mm ?? p.z) : 0,
          rot_y: Number.isFinite(Number(p.rot_y ?? p.rotY)) ? Number(p.rot_y ?? p.rotY) : 0,
        };
      });
      while (slots.length < 2) {
        slots.push({ model_id: '', x_mm: slots.length ? 90 : -20, y_mm: 0, z_mm: 0, rot_y: 0 });
      }
      return { enabled, slots };
    }
    return {
      shelf: normCat(src.shelf),
      drawer: normCat(src.drawer),
      rod: normRod(src.rod) || { modelId: '22', label: 'Штанга' },
      shelfProps: normalizeShelfProps(src.shelfProps),
    };
  }

  function defaultInteriorTemplates() {
    return {
      shelf: null,
      drawer: null,
      rod: { modelId: '22', label: 'Штанга' },
      shelfProps: {
        enabled: 0,
        slots: [
          { model_id: '', x_mm: -20, y_mm: 0, z_mm: 0, rot_y: 0 },
          { model_id: '', x_mm: 90, y_mm: 0, z_mm: 0, rot_y: 0 },
        ],
      },
    };
  }

  function readInteriorTemplatesFromApiData(apiData) {
    if (!apiData || apiData.interiorTemplates == null) return null;
    return normalizeInteriorTemplates(apiData.interiorTemplates);
  }

  function isFillCatalogItem(vueItem) {
    return (
      typeof window.__cldCatalogInteriorFill?.isFillCatalogItem === 'function' &&
      window.__cldCatalogInteriorFill.isFillCatalogItem(vueItem)
    );
  }

  function formatRefLabel(ref, emptyLabel) {
    if (!ref) return emptyLabel || 'не выбрано';
    const id = String(ref.catalogId ?? ref.modelId ?? '').trim();
    const lbl = String(ref.label || '').trim();
    if (lbl && id) return `${lbl} (#${id})`;
    if (lbl) return lbl;
    if (id) return `#${id}`;
    return emptyLabel || 'не выбрано';
  }

  function catalogItemLabel(item) {
    if (!item) return '';
    const d = item.data && typeof item.data === 'object' ? item.data : item;
    const name = String(d.name || item.name || '').trim();
    const id = String(item.id ?? d.id ?? '').trim();
    return name ? `${name} (#${id})` : id ? `#${id}` : '';
  }

  function seedCatalogCache(catalogType, items) {
    if (!Array.isArray(items) || !items.length) return;
    try {
      window.__CLD_CATALOGS_DATA = window.__CLD_CATALOGS_DATA || {};
      const ct = catalogType.startsWith('catalog_') ? catalogType : 'catalog_' + catalogType;
      window.__CLD_CATALOGS_DATA[ct] = window.__CLD_CATALOGS_DATA[ct] || { items: {} };
      items.forEach((it) => {
        const id = String(it.id ?? '').trim();
        if (id) window.__CLD_CATALOGS_DATA[ct].items[id] = it;
      });
    } catch (_) {}
  }

  function draftStorageKey(catalogType, itemId) {
    const ct = String(catalogType || '').trim();
    const id = String(itemId ?? '').trim();
    if (!ct || !id) return '';
    return `${ct}#${id}`;
  }

  function saveInteriorTemplatesDraft(catalogType, itemId, templates) {
    const key = draftStorageKey(catalogType, itemId);
    if (!key) return;
    try {
      const all = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
      all[key] = normalizeInteriorTemplates(templates);
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(all));
    } catch (_) {}
  }

  function readInteriorTemplatesDraft(catalogType, itemId) {
    const key = draftStorageKey(catalogType, itemId);
    if (!key) return null;
    try {
      const all = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
      return all[key] ? normalizeInteriorTemplates(all[key]) : null;
    } catch (_) {
      return null;
    }
  }

  function mergeDraftIntoVueItem(vm, catalogType, itemId) {
    const draft = readInteriorTemplatesDraft(catalogType, itemId);
    if (!draft || !vm?.item) return false;
    const cur = normalizeInteriorTemplates(vm.item.interiorTemplates);
    const merged = normalizeInteriorTemplates({
      shelf: cur.shelf || draft.shelf,
      drawer: cur.drawer || draft.drawer,
      rod: cur.rod || draft.rod,
      shelfProps: cur.shelfProps || draft.shelfProps,
    });
    if (typeof vm.$set === 'function') {
      vm.$set(vm.item, 'interiorTemplates', merged);
    } else {
      vm.item.interiorTemplates = merged;
    }
    return true;
  }

  function isReturningFromInteriorTemplatePick(catalogType, itemId) {
    const r = peekInteriorTemplatePickResult();
    if (!r) return false;
    const h = String(r.returnHash || '');
    const q = h.includes('?') ? h.split('?')[1] : '';
    const params = new URLSearchParams(q);
    const t = params.get('type') || '';
    const id = parseInt(params.get('id') || '0', 10);
    return t === String(catalogType || '').trim() && id === Number(itemId);
  }

  function resolveCatalogEditContext(vm) {
    const catalogType =
      vm?.catalogType ||
      document.getElementById('controller_name')?.value ||
      '';
    const itemId =
      vm?.item?.id ||
      document.getElementById('item_id')?.value ||
      '';
    return { catalogType: String(catalogType).trim(), itemId: String(itemId).trim() };
  }

  function currentCatalogEditReturnHash() {
    const type =
      document.getElementById('controller_name')?.value ||
      window.catalogItemVueApp?.catalogType ||
      '';
    const id =
      document.getElementById('item_id')?.value ||
      window.catalogItemVueApp?.item?.id ||
      '';
    if (type && id) {
      return `#catalog-item-edit?type=${encodeURIComponent(type)}&id=${encodeURIComponent(String(id))}`;
    }
    return window.location.hash || '#catalog-item-edit';
  }

  function readPickSession() {
    try {
      return JSON.parse(sessionStorage.getItem(PICK_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function isInteriorTemplatePickMode() {
    const h = window.location.hash || '';
    if (!h.startsWith('#catalog-items')) return false;
    const q = h.split('?')[1] || '';
    return new URLSearchParams(q).get('pick') === 'interior-template' && !!readPickSession();
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

  function ensureInteriorTemplatePickBar() {
    let bar = document.getElementById('catalog-interior-template-pick-bar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'catalog-interior-template-pick-bar';
    bar.style.cssText =
      'display:none; position:fixed; bottom:0; left:250px; right:0; z-index:10040; ' +
      'background:#fff; border-top:2px solid #1f6cb0; padding:12px 20px; box-shadow:0 -4px 12px rgba(0,0,0,.12);';
    bar.innerHTML =
      '<div style="display:flex; align-items:center; justify-content:space-between; max-width:1200px; margin:0 auto;">' +
      '<div><div id="catalog-interior-template-pick-title" style="font-size:14px; font-weight:600; color:#333;">Выбор шаблона</div>' +
      '<div id="catalog-interior-template-pick-label" style="font-size:12px; color:#888; margin-top:2px;">Кликните по строке в списке</div></div>' +
      '<div style="display:flex; gap:8px;">' +
      '<button type="button" id="catalog-interior-template-pick-cancel" class="btn btn-white btn-sm">Отмена</button>' +
      '<button type="button" id="catalog-interior-template-pick-ok" class="btn btn-primary btn-sm" disabled>ОК</button>' +
      '</div></div>';
    document.body.appendChild(bar);

    bar.__pickBound = true;
    document.getElementById('catalog-interior-template-pick-ok')?.addEventListener('click', () => {
      const p = readPickSession();
      const sel = Number(p?.selectedId) || 0;
      if (!sel || !p?.kind) return;
      const returnHash = p.returnHash || currentCatalogEditReturnHash();
      sessionStorage.removeItem(PICK_KEY);
      hideInteriorTemplatePickBar();
      sessionStorage.setItem(
        PICK_RESULT_KEY,
        JSON.stringify({
          kind: p.kind,
          catalogType: p.catalogType,
          catalogId: String(sel),
          catalogItemName: p.selectedName || `#${sel}`,
          slotIndex: p.slotIndex,
          returnHash,
        })
      );
      window.location.hash = returnHash;
    });
    document.getElementById('catalog-interior-template-pick-cancel')?.addEventListener('click', () => {
      const p = readPickSession();
      sessionStorage.removeItem(PICK_KEY);
      hideInteriorTemplatePickBar();
      window.location.hash = p?.returnHash || currentCatalogEditReturnHash();
    });

    return bar;
  }

  function hideInteriorTemplatePickBar() {
    const bar = document.getElementById('catalog-interior-template-pick-bar');
    if (bar) bar.style.display = 'none';
  }

  function refreshInteriorTemplatePickCatalogUI() {
    try {
      const bar = ensureInteriorTemplatePickBar();
      const pick = readPickSession();
      const active = isInteriorTemplatePickMode();
      bar.style.display = active ? 'block' : 'none';
      if (!active || !pick) return;

      const title = document.getElementById('catalog-interior-template-pick-title');
      const label = document.getElementById('catalog-interior-template-pick-label');
      const okBtn = document.getElementById('catalog-interior-template-pick-ok');
      const tbody = document.getElementById('catalog-items-table-body');
      if (!tbody) return;

      if (title) title.textContent = pick.pickTitle || 'Выбор шаблона';
      const selId = Number(pick.selectedId) || 0;
      if (label) {
        label.textContent = selId
          ? `Выбран: ${pick.selectedName || '#' + selId}`
          : 'Кликните по строке в списке';
      }
      if (okBtn) okBtn.disabled = !selId;
      highlightPickRow(tbody, selId);

      if (!tbody.__interiorTemplatePickRowBound) {
        tbody.__interiorTemplatePickRowBound = true;
        tbody.addEventListener('click', (e) => {
          if (!isInteriorTemplatePickMode()) return;
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
          const lbl = document.getElementById('catalog-interior-template-pick-label');
          const ok = document.getElementById('catalog-interior-template-pick-ok');
          if (lbl) lbl.textContent = `Выбран: ${p.selectedName}`;
          if (ok) ok.disabled = false;
        });
      }
    } catch (e) {
      console.warn('[interior-template-pick]', e);
    }
  }

  function applyInteriorTemplatesToVueItem(vueItem, apiData) {
    if (!vueItem || typeof vueItem !== 'object') return;
    const stored = readInteriorTemplatesFromApiData(apiData);
    if (stored) {
      vueItem.interiorTemplates = stored;
      return;
    }
    vueItem.interiorTemplates = normalizeInteriorTemplates(vueItem.interiorTemplates);
  }

  function shouldPersistInteriorTemplates(vueItem) {
    return isFillCatalogItem(vueItem) || !!vueItem?.interiorTemplates;
  }

  function mergeInteriorTemplatesIntoDataPayload(dataToSave, vueItem) {
    if (!dataToSave || !vueItem) return dataToSave;
    if (!shouldPersistInteriorTemplates(vueItem)) return dataToSave;
    dataToSave.interiorTemplates = normalizeInteriorTemplates(vueItem.interiorTemplates);
    return dataToSave;
  }

  async function prefetchAssignedTemplateCatalogs(vueItem) {
    const t = normalizeInteriorTemplates(vueItem?.interiorTemplates);
    const jobs = [];
    if (t.shelf?.catalogId) {
      jobs.push(
        fetch(
          '/api/catalog/item/' +
            encodeURIComponent(t.shelf.catalogType) +
            '/' +
            encodeURIComponent(t.shelf.catalogId) +
            '?t=' +
            Date.now()
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
    }
    if (t.drawer?.catalogId) {
      jobs.push(
        fetch(
          '/api/catalog/item/' +
            encodeURIComponent(t.drawer.catalogType) +
            '/' +
            encodeURIComponent(t.drawer.catalogId) +
            '?t=' +
            Date.now()
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
    }
    const results = await Promise.all(jobs);
    results.filter(Boolean).forEach((item) => {
      let ct = String(item.catalog_type || item.data?.catalog_type || '').trim();
      if (!ct && t.shelf) ct = t.shelf.catalogType;
      if (!ct && t.drawer) ct = t.drawer.catalogType;
      const key = ct.startsWith('catalog_') ? ct : ct ? 'catalog_' + ct : '';
      if (key) seedCatalogCache(key, [item]);
    });
  }

  async function resolveMissingTemplateLabels(vueItem) {
    if (!vueItem?.interiorTemplates) return;
    const t = vueItem.interiorTemplates;
    const jobs = [];
    if (t.shelf?.catalogId && !t.shelf.label) {
      jobs.push(
        fetch('/api/catalog/item/' + encodeURIComponent(SHELF_CATALOG) + '/' + encodeURIComponent(t.shelf.catalogId))
          .then((r) => (r.ok ? r.json() : null))
          .then((item) => ({ kind: 'shelf', item }))
          .catch(() => null)
      );
    }
    if (t.drawer?.catalogId && !t.drawer.label) {
      jobs.push(
        fetch('/api/catalog/item/' + encodeURIComponent(DRAWER_CATALOG) + '/' + encodeURIComponent(t.drawer.catalogId))
          .then((r) => (r.ok ? r.json() : null))
          .then((item) => ({ kind: 'drawer', item }))
          .catch(() => null)
      );
    }
    const results = await Promise.all(jobs);
    if (!results.filter(Boolean).length) return;
    const next = { ...t };
    let changed = false;
    results.filter(Boolean).forEach((hit) => {
      if (!hit?.item) return;
      const lbl = catalogItemLabel(hit.item);
      const shortName = String((hit.item.data || hit.item).name || hit.item.name || lbl).trim();
      if (!shortName) return;
      if (hit.kind === 'shelf' && next.shelf) {
        next.shelf = { ...next.shelf, label: shortName };
        changed = true;
      }
      if (hit.kind === 'drawer' && next.drawer) {
        next.drawer = { ...next.drawer, label: shortName };
        changed = true;
      }
      seedCatalogCache(hit.kind === 'shelf' ? SHELF_CATALOG : DRAWER_CATALOG, [hit.item]);
    });
    if (changed && window.catalogItemVueApp?.$set) {
      window.catalogItemVueApp.$set(window.catalogItemVueApp.item, 'interiorTemplates', next);
    }
  }

  function applyPickResultToItem(vueItem, r) {
    if (!vueItem || !r?.kind) return false;
    const templates = normalizeInteriorTemplates(vueItem.interiorTemplates);
    const name = String(r.catalogItemName || '').trim();
    const shortName = name.replace(/\s*\(#\d+\)\s*$/, '').trim() || name;

    if (r.kind === 'rod') {
      templates.rod = { modelId: String(r.catalogId || '22'), label: shortName || 'Штанга' };
    } else if (r.kind === 'shelfProp') {
      if (!templates.shelfProps || typeof templates.shelfProps !== 'object') {
        templates.shelfProps = defaultInteriorTemplates().shelfProps;
      }
      const idx = Math.max(0, Number(r.slotIndex) || 0);
      while (templates.shelfProps.slots.length <= idx) {
        templates.shelfProps.slots.push({ model_id: '', x_mm: 0, y_mm: 0, z_mm: 0, rot_y: 0 });
      }
      templates.shelfProps.slots[idx].model_id = String(r.catalogId || '');
      templates.shelfProps.slots[idx].label = shortName;
    } else {
      const ct = r.catalogType || (r.kind === 'drawer' ? DRAWER_CATALOG : SHELF_CATALOG);
      templates[r.kind] = {
        catalogType: ct,
        catalogId: String(r.catalogId),
        label: shortName,
      };
    }
    vueItem.interiorTemplates = templates;
    return true;
  }

  function consumeInteriorTemplatePickResult() {
    const raw = sessionStorage.getItem(PICK_RESULT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PICK_RESULT_KEY);
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function peekInteriorTemplatePickResult() {
    const raw = sessionStorage.getItem(PICK_RESULT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function applyInteriorTemplatePickToVueApp(vm) {
    const target = vm || window.catalogItemVueApp;
    if (!target?.item) return false;
    const ctx = resolveCatalogEditContext(target);
    mergeDraftIntoVueItem(target, ctx.catalogType, ctx.itemId);

    const r = consumeInteriorTemplatePickResult();
    if (!r) return false;
    const ok = applyPickResultToItem(target.item, r);
    if (!ok) return false;
    if (typeof target.$set === 'function') {
      target.$set(target.item, 'interiorTemplates', normalizeInteriorTemplates(target.item.interiorTemplates));
    }
    saveInteriorTemplatesDraft(ctx.catalogType, ctx.itemId, target.item.interiorTemplates);
    if (typeof target.onInteriorTemplateChanged === 'function') {
      target.onInteriorTemplateChanged();
    } else {
      prefetchAssignedTemplateCatalogs(target.item);
    }
    try {
      const tab = document.querySelector('#catalog-item-edit .tab_menu_h li[data-tab="interior-fill"]');
      if (tab) tab.click();
    } catch (_) {}
    return true;
  }

  function tryApplyInteriorTemplatePickResult(vm) {
    return applyInteriorTemplatePickToVueApp(vm);
  }

  function getVueInteriorTemplatesOptions() {
    return {
      computed: {
        showInteriorTemplatesSection() {
          return (
            typeof window.__cldCatalogInteriorFill?.isFillCatalogItem === 'function' &&
            window.__cldCatalogInteriorFill.isFillCatalogItem(this.item)
          );
        },
        interiorShelfTemplateLabel() {
          return formatRefLabel(this.item?.interiorTemplates?.shelf, KIND_CONFIG.shelf.emptyLabel);
        },
        interiorDrawerTemplateLabel() {
          return formatRefLabel(this.item?.interiorTemplates?.drawer, KIND_CONFIG.drawer.emptyLabel);
        },
        interiorRodTemplateLabel() {
          return formatRefLabel(this.item?.interiorTemplates?.rod, KIND_CONFIG.rod.emptyLabel);
        },
      },
      methods: {
        ensureInteriorTemplatesObject() {
          if (!this.item.interiorTemplates || typeof this.item.interiorTemplates !== 'object') {
            this.$set(this.item, 'interiorTemplates', defaultInteriorTemplates());
          }
          const t = this.item.interiorTemplates;
          if (!t.shelfProps || typeof t.shelfProps !== 'object') {
            this.$set(t, 'shelfProps', defaultInteriorTemplates().shelfProps);
          }
          if (!Array.isArray(t.shelfProps.slots) || !t.shelfProps.slots.length) {
            this.$set(t.shelfProps, 'slots', defaultInteriorTemplates().shelfProps.slots);
          }
        },
        openInteriorTemplateCatalogPick(kind, slotIndex) {
          const cfg = KIND_CONFIG[kind];
          if (!cfg) return;
          this.ensureInteriorTemplatesObject();
          const ctx = resolveCatalogEditContext(this);
          saveInteriorTemplatesDraft(ctx.catalogType, ctx.itemId, this.item.interiorTemplates);
          const t = this.item.interiorTemplates;
          let selectedId = 0;
          let selectedName = '';
          if (kind === 'rod') {
            selectedId = Number(t?.rod?.modelId) || 0;
            selectedName = formatRefLabel(t?.rod, '');
          } else if (kind === 'shelfProp') {
            const slot = t?.shelfProps?.slots?.[Number(slotIndex) || 0];
            selectedId = Number(slot?.model_id) || 0;
            selectedName = String(slot?.label || slot?.model_id || '').trim();
          } else if (t?.[kind]?.catalogId) {
            selectedId = Number(t[kind].catalogId) || 0;
            selectedName = formatRefLabel(t[kind], '');
          }
          sessionStorage.setItem(
            PICK_KEY,
            JSON.stringify({
              kind,
              catalogType: cfg.catalogType,
              pickTitle: cfg.pickTitle,
              returnHash: currentCatalogEditReturnHash(),
              selectedId,
              selectedName,
              slotIndex: kind === 'shelfProp' ? Number(slotIndex) || 0 : undefined,
            })
          );
          window.location.hash =
            '#catalog-items?type=' + encodeURIComponent(cfg.catalogType) + '&pick=interior-template';
        },
        addInteriorShelfPropSlot() {
          this.ensureInteriorTemplatesObject();
          const slots = this.item.interiorTemplates.shelfProps.slots;
          slots.push({ model_id: '', x_mm: 0, y_mm: 0, z_mm: 0, rot_y: 0 });
          this.onInteriorTemplateChanged();
        },
        removeInteriorShelfPropSlot(idx) {
          this.ensureInteriorTemplatesObject();
          const slots = this.item.interiorTemplates.shelfProps.slots;
          if (slots.length <= 1) return;
          slots.splice(idx, 1);
          this.onInteriorTemplateChanged();
        },
        clearInteriorTemplate(kind) {
          this.ensureInteriorTemplatesObject();
          const next = { ...this.item.interiorTemplates };
          if (kind === 'rod') {
            next.rod = { modelId: '22', label: 'Штанга' };
          } else {
            next[kind] = null;
          }
          this.$set(this.item, 'interiorTemplates', next);
          this.onInteriorTemplateChanged();
        },
        onInteriorTemplateChanged() {
          prefetchAssignedTemplateCatalogs(this.item);
          if (typeof window.__cldRefreshInteriorFillFromConstructor === 'function') {
            window.__cldRefreshInteriorFillFromConstructor();
          }
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe(true);
          }
        },
      },
    };
  }

  function bindInteriorTemplatesWatch(vm) {
    if (!vm || vm.__cldInteriorTemplatesWatch) return;
    vm.__cldInteriorTemplatesWatch = true;
    if (typeof vm.ensureInteriorTemplatesObject === 'function') {
      vm.ensureInteriorTemplatesObject();
    }

    vm.$watch(
      () => vm.item && vm.item.interiorTemplates,
      () => {
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe(true);
        }
      },
      { deep: true }
    );

    vm.$watch(
      () => vm.item && vm.item.interiorTemplates,
      () => resolveMissingTemplateLabels(vm.item),
      { deep: true, immediate: true }
    );
  }

  window.__cldCatalogInteriorTemplates = {
    SHELF_CATALOG,
    DRAWER_CATALOG,
    ROD_MODELS_CATALOG,
    defaultInteriorTemplates,
    normalizeInteriorTemplates,
    readInteriorTemplatesFromApiData,
    applyInteriorTemplatesToVueItem,
    shouldPersistInteriorTemplates,
    mergeInteriorTemplatesIntoDataPayload,
    getVueInteriorTemplatesOptions,
    bindInteriorTemplatesWatch,
    prefetchAssignedTemplateCatalogs,
    tryApplyInteriorTemplatePickResult,
    applyInteriorTemplatePickToVueApp,
    consumeInteriorTemplatePickResult,
    peekInteriorTemplatePickResult,
    saveInteriorTemplatesDraft,
    mergeDraftIntoVueItem,
    isReturningFromInteriorTemplatePick,
    refreshInteriorTemplatePickCatalogUI,
    isInteriorTemplatePickMode,
  };
  window.__cldBindInteriorTemplatesWatch = bindInteriorTemplatesWatch;
  window.refreshInteriorTemplatePickCatalogUI = refreshInteriorTemplatePickCatalogUI;

  window.addEventListener('hashchange', () => {
    if (isInteriorTemplatePickMode()) {
      refreshInteriorTemplatePickCatalogUI();
      return;
    }
    hideInteriorTemplatePickBar();
  });
})();
