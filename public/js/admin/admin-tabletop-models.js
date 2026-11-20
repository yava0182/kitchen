/**
 * Админка: Столешница → Модели.
 * Схема PlanPlace catalog/item/tabletop (tabletop_items.js):
 *   name/code/has_trap/icon/category[]/active/order
 *   params.mat_mode 0|1, variants[], trap_variants[], sections (EURO_CUT…), accessories
 */
(function () {
  const TYPE = 'tabletop_items';
  const CAT_TYPE = 'tabletop_categories';

  const SECTION_TYPES = [
    { key: 'PROFILE_STRIP', name: 'Соединение через планку', has_bar: true },
    { key: 'EURO_CUT', name: 'Еврозапил (евростык)', has_bar: false },
    { key: 'ANGLE_CUT', name: 'Запил под 45° / прямой', has_bar: false },
    { key: 'SEAMLESS', name: 'Бесшовное соединение', has_bar: false },
  ];

  const state = {
    all: [],
    categories: [],
    search: '',
    category: '',
    perPage: 20,
    page: 1,
    editId: 0,
    editItem: null,
    variants: [],
  };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
    );
  }

  function asList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  }

  function onlyType(list, type) {
    return (list || []).filter((it) => String(it?.catalog_type || '') === type);
  }

  function newVariantId() {
    return 'tt-var-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
  }

  function emptySectionType(extra) {
    return Object.assign(
      {
        enabled: 0,
        price: 0,
        price_mode: 'm',
        price_acc_id: 0,
        price_code: '',
        show_coupler: 0,
      },
      extra || {}
    );
  }

  function emptyVariant(preset) {
    return Object.assign(
      {
        id: newVariantId(),
        name: '',
        code: '',
        width: 0,
        height: 0,
        thickness: 38,
        price: 0,
        price_mode: 'm',
        price_type: 'p',
        price_acc_id: 0,
        params: {},
      },
      preset || {}
    );
  }

  function defaultMatParams() {
    return {
      type: 'Standard',
      params: {
        color: '#ffffff',
        roughness: 1,
        metalness: 0,
        transparent: 0,
        opacity: 1,
        map: '',
        normalMap: '',
        roughnessMap: '',
        alphaMap: '',
      },
      add_params: {
        wrapping: 'mirror',
        normal_wrapping: 'mirror',
        roughness_wrapping: 'mirror',
        rotation: 'normal',
        stretch_width: 0,
        stretch_height: 0,
        real_width: 256,
        real_height: 256,
        one_sided: 0,
      },
    };
  }

  function defaultParams() {
    const types = {};
    SECTION_TYPES.forEach((t) => {
      types[t.key] = emptySectionType(t.has_bar ? { plank_model_id: 0 } : {});
    });
    return {
      mat_mode: 0,
      material: 0,
      mat_params: defaultMatParams(),
      auto_variant: 0,
      butt: { id: 0, key: '' },
      variants: [emptyVariant({ id: 'tt-var-0', thickness: 38, width: 600, height: 3050 })],
      trap_variants: [],
      preview_w: 450,
      preview_h: 720,
      spec: { hide_sizes_catalog: 0 },
      sections: {
        types,
        offsets: { min: 0 },
        coupler: {
          model_id: 0,
          base_count: '',
          min_offset: '',
          gen_mode: 'count',
          gen_value: '',
          end_hole_diameter: 8,
          bottom_hole_diameter: 35,
          bottom_hole_depth: 20,
          joint_to_center: 32,
          end_hole_depth: 20,
        },
      },
    };
  }

  function mergeVariant(src) {
    const b = emptyVariant();
    const s = src && typeof src === 'object' ? src : {};
    return {
      id: s.id != null && s.id !== '' ? String(s.id) : newVariantId(),
      name: String(s.name || ''),
      code: String(s.code || ''),
      width: Number(s.width) || 0,
      height: Number(s.height) || 0,
      thickness: Number(s.thickness) || 0,
      price: Number(s.price) || 0,
      price_mode: String(s.price_mode || b.price_mode),
      price_type: String(s.price_type || b.price_type),
      price_acc_id: Number(s.price_acc_id) || 0,
      params: s.params && typeof s.params === 'object' ? s.params : {},
    };
  }

  function mergeSectionType(src, hasBar) {
    const b = emptySectionType(hasBar ? { plank_model_id: 0 } : {});
    const s = src && typeof src === 'object' ? src : {};
    const out = {
      enabled: s.enabled ? 1 : 0,
      price: Number(s.price) || 0,
      price_mode: String(s.price_mode || b.price_mode),
      price_acc_id: Number(s.price_acc_id) || 0,
      price_code: String(s.price_code || ''),
      show_coupler: s.show_coupler ? 1 : 0,
    };
    if (hasBar) out.plank_model_id = Number(s.plank_model_id) || 0;
    return out;
  }

  function categoryToString(cat) {
    if (Array.isArray(cat)) {
      const names = cat.map((c) => String(c || '').trim()).filter(Boolean);
      return names[0] || '';
    }
    return String(cat || '').trim();
  }

  function normalizeItem(raw) {
    const it = raw && typeof raw === 'object' ? { ...raw } : {};
    const srcParams =
      it.params && typeof it.params === 'object'
        ? it.params
        : it.data && typeof it.data === 'object' && it.data.params
          ? it.data.params
          : {};

    const p = defaultParams();
    Object.assign(p, srcParams);

    const mp = defaultMatParams();
    if (srcParams.mat_params && typeof srcParams.mat_params === 'object') {
      mp.type = srcParams.mat_params.type || mp.type;
      mp.params = Object.assign({}, mp.params, srcParams.mat_params.params || {});
      mp.add_params = Object.assign({}, mp.add_params, srcParams.mat_params.add_params || {});
    }
    p.mat_params = mp;

    p.butt = {
      id: Number(srcParams.butt?.id) || 0,
      key: String(srcParams.butt?.key || ''),
    };

    let variants = Array.isArray(srcParams.variants)
      ? srcParams.variants.map(mergeVariant)
      : Array.isArray(it.variants)
        ? it.variants.map(mergeVariant)
        : [];
    if (!variants.length) {
      variants = [
        emptyVariant({
          id: 'tt-var-0',
          width: Number(srcParams.width) || 600,
          height: Number(srcParams.depth || srcParams.height) || 3050,
          thickness: Number(srcParams.height || srcParams.thickness) || 38,
          price: Number(it.prices?.common) || 0,
        }),
      ];
    }
    p.variants = variants;
    p.trap_variants = Array.isArray(srcParams.trap_variants) ? srcParams.trap_variants : [];
    p.auto_variant = srcParams.auto_variant ? 1 : 0;
    p.spec = {
      hide_sizes_catalog: srcParams.spec?.hide_sizes_catalog ? 1 : 0,
    };

    const types = {};
    SECTION_TYPES.forEach((t) => {
      types[t.key] = mergeSectionType(srcParams.sections?.types?.[t.key], t.has_bar);
    });
    const couplerSrc = srcParams.sections?.coupler || {};
    p.sections = {
      types,
      offsets: { min: Number(srcParams.sections?.offsets?.min) || 0 },
      coupler: {
        model_id: Number(couplerSrc.model_id) || 0,
        base_count: couplerSrc.base_count != null ? String(couplerSrc.base_count) : '',
        min_offset: couplerSrc.min_offset != null ? String(couplerSrc.min_offset) : '',
        gen_mode: String(couplerSrc.gen_mode || 'count'),
        gen_value: couplerSrc.gen_value != null ? String(couplerSrc.gen_value) : '',
        end_hole_diameter: Number(couplerSrc.end_hole_diameter) || 8,
        bottom_hole_diameter: Number(couplerSrc.bottom_hole_diameter) || 35,
        bottom_hole_depth: Number(couplerSrc.bottom_hole_depth) || 20,
        joint_to_center: Number(couplerSrc.joint_to_center) || 32,
        end_hole_depth: Number(couplerSrc.end_hole_depth) || 20,
      },
    };

    p.mat_mode = Number(srcParams.mat_mode) === 1 ? 1 : 0;
    p.material = Number(srcParams.material) || 0;
    p.preview_w = Number(srcParams.preview_w) || 600;
    p.preview_h = Number(srcParams.preview_h) || 400;

    const accessories = {
      conn: Number(it.accessories?.conn ?? srcParams.accessories?.conn) || 0,
      end: Number(it.accessories?.end ?? srcParams.accessories?.end) || 0,
    };

    return {
      ...it,
      catalog_type: TYPE,
      name: String(it.name || ''),
      code: String(it.code || ''),
      has_trap: it.has_trap ? 1 : 0,
      icon: String(it.icon || ''),
      category: categoryToString(it.category),
      active: (it.active ?? 1) == 1 || it.active === true ? 1 : 0,
      order: Number(it.order) || 10000,
      accessories,
      params: p,
    };
  }

  /** Как в PP: колонка «Артикул», не размеры листа */
  function articleLabel(item) {
    const n = normalizeItem(item);
    const fromItem = String(n.code || item.code || '').trim();
    if (fromItem) return fromItem;
    const v = n.params.variants[0];
    const fromVar = v ? String(v.code || v.article || '').trim() : '';
    return fromVar || '—';
  }

  function hashBase() {
    return (window.location.hash || '').replace(/^#/, '').split('?')[0];
  }

  function hashParams() {
    return new URLSearchParams((window.location.hash || '').split('?')[1] || '');
  }

  function showPage(id) {
    document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
    const page = document.getElementById(id);
    if (page) page.classList.add('active');
  }

  async function fetchList(type) {
    const resp = await fetch('/api/catalog/items_get/' + encodeURIComponent(type) + '?t=' + Date.now(), {
      cache: 'no-store',
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return onlyType(asList(await resp.json()), type).map(normalizeItem);
  }

  function filtered() {
    const q = state.search.trim().toLowerCase();
    return state.all.filter((item) => {
      if (state.category && String(item.category || '') !== state.category) return false;
      if (!q) return true;
      const name = String(item.name || '').toLowerCase();
      const code = String(item.code || '').toLowerCase();
      const id = String(item.id ?? '');
      return name.includes(q) || code.includes(q) || id.includes(q);
    });
  }

  function fillCategorySelects() {
    const names = [];
    state.categories.forEach((c) => {
      const n = String(c.name || '').trim();
      if (n && !names.includes(n)) names.push(n);
    });
    state.all.forEach((it) => {
      const n = String(it.category || '').trim();
      if (n && !names.includes(n)) names.push(n);
    });
    const filter = document.getElementById('tt-models-category-filter');
    if (filter) {
      const cur = filter.value;
      filter.innerHTML =
        '<option value="">Все</option>' + names.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('');
      filter.value = cur;
    }
    const edit = document.getElementById('tt-model-category');
    if (edit) {
      const cur = edit.value;
      edit.innerHTML =
        '<option value="">—</option>' + names.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('');
      if (cur) edit.value = cur;
    }
  }

  function renderPager(id, pages) {
    const el = document.getElementById(id);
    if (!el) return;
    if (pages <= 1) {
      el.innerHTML = '';
      return;
    }
    let html = '';
    for (let i = 1; i <= pages; i++) {
      html +=
        '<li class="' +
        (i === state.page ? 'active' : '') +
        '"><a href="#" data-tt-page="' +
        i +
        '">' +
        i +
        '</a></li>';
    }
    el.innerHTML = html;
    el.querySelectorAll('[data-tt-page]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        state.page = parseInt(a.getAttribute('data-tt-page'), 10) || 1;
        renderTable();
      });
    });
  }

  function renderTable() {
    const rows = filtered();
    const pages = Math.max(1, Math.ceil(rows.length / state.perPage));
    if (state.page > pages) state.page = pages;
    const from = (state.page - 1) * state.perPage;
    const slice = rows.slice(from, from + state.perPage);
    const tbody = document.getElementById('tt-models-table-body');
    if (!tbody) return;
    if (!slice.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Нет записей — нажмите «Добавить»</td></tr>';
    } else {
      tbody.innerHTML = slice
        .map((item) => {
          const active = (item.active ?? 1) == 1;
          const eye = active
            ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим" data-tt-action="eye" data-id="' +
              item.id +
              '"><i class="fa fa-eye"></i></button>'
            : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт" data-tt-action="eye" data-id="' +
              item.id +
              '"><i class="fa fa-eye-slash"></i></button>';
          return (
            '<tr>' +
            '<td>' +
            esc(item.id) +
            '</td>' +
            '<td class="col-icon">' +
            (item.icon
              ? '<img class="admin-list-thumb" src="' + esc(item.icon) + '" alt="">'
              : '<div class="admin-list-thumb-empty"></div>') +
            '</td>' +
            '<td>' +
            esc(item.name || '') +
            '</td>' +
            '<td>' +
            esc(articleLabel(item)) +
            '</td>' +
            '<td>' +
            esc(item.category || '—') +
            '</td>' +
            '<td class="col-order">' +
            esc(item.order) +
            '</td>' +
            '<td class="col-vis">' +
            eye +
            '</td>' +
            '<td class="col-actions"><div class="cld-row-actions">' +
            '<button type="button" class="btn btn-xs btn-outline btn-primary" title="Редактировать" data-tt-action="edit" data-id="' +
            item.id +
            '"><i class="fa fa-pencil"></i></button>' +
            '<button type="button" class="btn btn-xs btn-outline btn-info" title="Копировать" data-tt-action="copy" data-id="' +
            item.id +
            '"><i class="fa fa-link"></i></button>' +
            '<button type="button" class="btn btn-xs btn-outline btn-danger" title="Удалить" data-tt-action="delete" data-id="' +
            item.id +
            '" data-name="' +
            esc(item.name || '') +
            '"><i class="fa fa-trash"></i></button>' +
            '</div></td>' +
            '</tr>'
          );
        })
        .join('');
    }
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v);
    };
    const to = rows.length ? Math.min(from + state.perPage, rows.length) : 0;
    set('tt-models-from', rows.length ? from + 1 : 0);
    set('tt-models-to', to);
    set('tt-models-total', rows.length);
    renderPager('tt-models-pagination-top', pages);
    renderPager('tt-models-pagination-bottom', pages);
  }

  async function loadList() {
    try {
      state.categories = await fetchList(CAT_TYPE);
      state.all = await fetchList(TYPE);
      fillCategorySelects();
      renderTable();
    } catch (e) {
      console.error('[tabletop] load', e);
      const tbody = document.getElementById('tt-models-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="color:#c00; padding:16px;">Ошибка загрузки</td></tr>';
    }
  }

  function openList() {
    showPage('tabletop-models');
    if (window.location.hash.split('?')[0] !== '#tabletop-models') {
      window.history.pushState({ page: 'tabletop-models' }, '', '#tabletop-models');
    }
    loadList();
  }

  function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v == null ? '' : String(v);
  }

  function setChk(id, on) {
    const el = document.getElementById(id);
    if (el) el.checked = !!on;
  }

  function activateTab(href) {
    const tabs = document.querySelectorAll('#tt-model-tabs li');
    const panes = document.querySelectorAll('#tabletop-model-edit .tab-pane');
    tabs.forEach((li) => {
      const a = li.querySelector('a');
      const match = a && a.getAttribute('href') === href;
      li.classList.toggle('active', !!match);
    });
    panes.forEach((pane) => {
      pane.classList.toggle('active', '#' + pane.id === href);
    });
  }

  function syncMatModeFields() {
    const mode = String(document.getElementById('tt-model-mat-mode')?.value || '0');
    const own = document.getElementById('tt-mat-own-block');
    const decor = document.getElementById('tt-mat-decor-block');
    if (own) own.style.display = mode === '0' ? 'flex' : 'none';
    if (decor) decor.style.display = mode === '1' ? '' : 'none';
    const tr = !!document.getElementById('tt-mat-transparent')?.checked;
    const opRow = document.getElementById('tt-mat-opacity-row');
    if (opRow) opRow.style.display = tr ? 'flex' : 'none';
    updateDisplayPreview();
  }

  function setThumb(previewId, url, emptyLabel) {
    const box = document.getElementById(previewId);
    if (!box) return;
    const u = String(url || '').trim();
    if (u) {
      box.innerHTML =
        '<img src="' +
        esc(u) +
        '" alt="" style="width:100%;height:100%;object-fit:cover;">' +
        '<i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; font-size:16px;"></i>';
    } else {
      box.innerHTML =
        '<span style="color:#ccc; font-size:12px;">' +
        esc(emptyLabel || 'нет') +
        '</span>' +
        '<i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; font-size:16px;"></i>';
    }
  }

  function setIconUi(url) {
    const u = String(url || '').trim();
    const ph = document.getElementById('tt-model-icon-placeholder');
    const wrap = document.getElementById('tt-model-icon-preview-wrapper');
    const img = document.getElementById('tt-model-icon-preview');
    setVal('tt-model-icon', u);
    if (u && wrap && img && ph) {
      img.src = u;
      wrap.style.display = '';
      ph.style.display = 'none';
    } else if (ph && wrap) {
      wrap.style.display = 'none';
      ph.style.display = 'flex';
    }
  }

  function updateDisplayPreview() {
    if (typeof window.__cldUpdateTabletopDecorPreview === 'function') {
      window.__cldUpdateTabletopDecorPreview();
      return;
    }
    if (typeof window.__cldInitTabletopDecorPreview === 'function') {
      window.__cldInitTabletopDecorPreview();
    }
  }

  function openProjectFileManager(hiddenId, previewId, emptyLabel) {
    if (typeof window.openFileManager !== 'function') {
      if (typeof toastr !== 'undefined') toastr.warning('Файловый менеджер не загружен');
      else alert('Файловый менеджер недоступен');
      return;
    }
    window.openFileManager({
      allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
      initialPath: 'files',
      onSelect: function (r) {
        const url = r && r.url ? String(r.url) : '';
        if (!url) return;
        setVal(hiddenId, url);
        setThumb(previewId, url, emptyLabel);
        updateDisplayPreview();
      },
    });
  }

  function wireFilePick(btnId, _fileId, hiddenId, previewId, emptyLabel) {
    const open = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      openProjectFileManager(hiddenId, previewId, emptyLabel);
    };
    document.getElementById(btnId)?.addEventListener('click', open);
    document.getElementById(previewId)?.addEventListener('click', open);
  }

  function syncTrapTab() {
    const on = !!document.getElementById('tt-model-has-trap')?.checked;
    const li = document.getElementById('tt-tab-trap-li');
    if (li) li.style.display = on ? '' : 'none';
  }

  function priceTypeOptions(selected) {
    const opts = [
      ['p', 'р/шт.'],
      ['m', 'р/п.м.'],
      ['hl', 'р/хлыст'],
      ['hlm', 'р/хлыст (п.м.)'],
      ['m2', 'р/м2'],
      ['m3', 'р/м3'],
    ];
    return opts
      .map(
        ([v, label]) =>
          '<option value="' + v + '"' + (selected === v ? ' selected' : '') + '>' + label + '</option>'
      )
      .join('');
  }

  function priceModeOptions(selected) {
    const opts = [
      ['m', 'Ручной ввод'],
      ['a', 'По ID из прайс-листа'],
      ['c', 'По артикулу из прайс-листа'],
    ];
    return opts
      .map(
        ([v, label]) =>
          '<option value="' + v + '"' + (selected === v ? ' selected' : '') + '>' + label + '</option>'
      )
      .join('');
  }

  function renderVariantsList() {
    const host = document.getElementById('tt-variants-list');
    if (!host) return;
    if (!state.variants.length) state.variants = [emptyVariant({ id: 'tt-var-0' })];
    host.innerHTML = state.variants
      .map((row, idx) => {
        const delBtn =
          state.variants.length > 1
            ? '<button title="Удалить" type="button" class="v_del btn btn-sm btn-outline btn-danger" data-tt-var-remove="' +
              idx +
              '"><i class="fa fa-trash"></i></button>'
            : '<button title="Удалить" type="button" class="v_del btn btn-sm btn-outline btn-danger" style="display:none;"><i class="fa fa-trash"></i></button>';
        return (
          '<div class="tt-variant-card" data-var-idx="' +
          idx +
          '">' +
          '<div class="form-group row size_row">' +
          '<div class="col-sm-4 mb-2"><label class="mb-0">Название</label> <input type="text" class="form-control tt-var-name" value="' +
          esc(row.name) +
          '"></div>' +
          '<div class="col-sm-4 mb-2"><label class="mb-0">Артикул</label> <input type="text" class="form-control tt-var-code" value="' +
          esc(row.code) +
          '"></div>' +
          '<div class="col-sm-4 mb-2"></div>' +
          '<div class="col-sm-4 mb-2"><label class="mb-0">Ширина, мм</label> <input type="number" min="0" step="1" class="form-control tt-var-width" value="' +
          esc(row.width) +
          '"></div>' +
          '<div class="col-sm-4 mb-2"><label class="mb-0">Высота, мм</label> <input type="number" min="0" step="1" class="form-control tt-var-height" value="' +
          esc(row.height) +
          '"></div>' +
          '<div class="col-sm-4 mb-2"><label class="mb-0">Толщина, мм</label> <input type="number" min="0" step="1" class="form-control tt-var-thickness" value="' +
          esc(row.thickness) +
          '"></div>' +
          '<div class="col-sm-4 mb-2"><label class="mb-0">Тип расчета</label> <div><select class="form-control tt-var-price-type">' +
          priceTypeOptions(row.price_type || 'p') +
          '</select></div></div>' +
          '<div class="col-sm-4 mb-2"><label class="mb-0">Ввод цен</label> <div><select class="form-control tt-var-price-mode">' +
          priceModeOptions(row.price_mode || 'm') +
          '</select></div></div>' +
          '<div class="col-sm-4 mb-2"><div><label class="mb-0">Цена</label> <input type="number" min="0" step="0.01" class="form-control tt-var-price" value="' +
          esc(row.price) +
          '"></div></div>' +
          '<div class="variant_controls">' +
          delBtn +
          '</div>' +
          '</div></div>'
        );
      })
      .join('');
  }

  function collectVariantsFromDom() {
    const cards = document.querySelectorAll('#tt-variants-list .tt-variant-card');
    if (!cards.length) return state.variants.slice();
    const out = [];
    cards.forEach((card, idx) => {
      const prev = state.variants[idx] || emptyVariant();
      out.push({
        id: prev.id || newVariantId(),
        name: String(card.querySelector('.tt-var-name')?.value || '').trim(),
        code: String(card.querySelector('.tt-var-code')?.value || '').trim(),
        width: Number(card.querySelector('.tt-var-width')?.value) || 0,
        height: Number(card.querySelector('.tt-var-height')?.value) || 0,
        thickness: Number(card.querySelector('.tt-var-thickness')?.value) || 0,
        price_type: card.querySelector('.tt-var-price-type')?.value || 'p',
        price_mode: card.querySelector('.tt-var-price-mode')?.value || 'm',
        price: Number(card.querySelector('.tt-var-price')?.value) || 0,
        price_acc_id: Number(prev.price_acc_id) || 0,
        params: prev.params || {},
      });
    });
    return out;
  }

  function fillSections(n) {
    SECTION_TYPES.forEach((t) => {
      const st = n.params.sections.types[t.key] || emptySectionType();
      setChk('tt-sec-' + t.key + '-enabled', !!st.enabled);
      setVal('tt-sec-' + t.key + '-price', st.price);
      setVal('tt-sec-' + t.key + '-price-mode', st.price_mode || 'm');
      setChk('tt-sec-' + t.key + '-show-coupler', !!st.show_coupler);
      if (t.has_bar) setVal('tt-sec-' + t.key + '-plank', st.plank_model_id || 0);
      syncSectionCard(t.key);
    });
    const c = n.params.sections.coupler;
    setVal('tt-coupler-model-id', c.model_id || 0);
    setVal('tt-coupler-base-count', c.base_count);
    setVal('tt-coupler-min-offset', c.min_offset);
    setVal('tt-coupler-end-d', c.end_hole_diameter);
    setVal('tt-coupler-bottom-d', c.bottom_hole_diameter);
    setVal('tt-coupler-bottom-depth', c.bottom_hole_depth);
    setVal('tt-coupler-end-depth', c.end_hole_depth);
    setVal('tt-coupler-joint', c.joint_to_center);
  }

  function syncSectionCard(key) {
    const on = !!document.getElementById('tt-sec-' + key + '-enabled')?.checked;
    const body = document.getElementById('tt-sec-' + key + '-body');
    if (body) body.style.display = on ? '' : 'none';
  }

  function fillEdit(item) {
    const n = normalizeItem(item || {});
    state.editId = Number(n.id) || 0;
    state.editItem = n;
    state.variants = (n.params.variants || []).map(mergeVariant);
    if (!state.variants.length) state.variants = [emptyVariant({ id: 'tt-var-0' })];

    const title = document.getElementById('tt-model-edit-title');
    if (title) {
      title.innerHTML = state.editId
        ? 'Редактировать модель столешницы <span>' + esc(n.name || '') + '</span>'
        : 'Редактировать модель столешницы';
    }

    setVal('tt-model-name', n.name || '');
    setVal('tt-model-code', n.code || '');
    setChk('tt-model-has-trap', !!n.has_trap);
    fillCategorySelects();
    setVal('tt-model-category', n.category || '');
    setChk('tt-model-active', n.active == 1);
    setVal('tt-model-order', n.order != null ? n.order : 10000);
    setVal('tt-model-icon', n.icon || '');

    setVal('tt-model-mat-mode', String(n.params.mat_mode === 1 ? 1 : 0));
    const mp = n.params.mat_params || defaultMatParams();
    const color = mp.params?.color || '#ffffff';
    setVal('tt-mat-color', color);
    setVal('tt-mat-color-hex', color);
    setVal('tt-mat-roughness', mp.params?.roughness ?? 1);
    setVal('tt-mat-metalness', mp.params?.metalness ?? 0);
    setChk('tt-mat-transparent', !!mp.params?.transparent);
    setVal('tt-mat-opacity', mp.params?.opacity ?? 1);
    setVal('tt-mat-map', mp.params?.map || '');
    setVal('tt-mat-normal', mp.params?.normalMap || '');
    setVal('tt-mat-rough-map', mp.params?.roughnessMap || '');
    setThumb('tt-mat-map-preview', mp.params?.map || '', 'нет');
    setThumb('tt-mat-normal-preview', mp.params?.normalMap || '', '256x256');
    setThumb('tt-mat-rough-preview', mp.params?.roughnessMap || '', '256x256');
    setVal('tt-mat-wrapping', mp.add_params?.wrapping || 'mirror');
    setVal('tt-mat-rotation', mp.add_params?.rotation || 'normal');
    setChk('tt-mat-stretch-w', !!mp.add_params?.stretch_width);
    setChk('tt-mat-stretch-h', !!mp.add_params?.stretch_height);
    setVal('tt-mat-real-w', mp.add_params?.real_width || 256);
    setVal('tt-mat-real-h', mp.add_params?.real_height || 256);
    setChk('tt-mat-one-sided', !!mp.add_params?.one_sided);
    setVal('tt-mat-decor-id', n.params.material || 0);
    setVal('tt-preview-w', n.params.preview_w || 450);
    setVal('tt-preview-h', n.params.preview_h || 720);
    setIconUi(n.icon || '');

    setChk('tt-hide-sizes', !!n.params.spec.hide_sizes_catalog);
    setVal('tt-butt-key', n.params.butt?.key || '');
    setChk('tt-auto-variant', !!n.params.auto_variant);

    setVal('tt-acc-conn', n.accessories?.conn || 0);
    setVal('tt-acc-end', n.accessories?.end || 0);

    fillSections(n);
    renderVariantsList();
    syncMatModeFields();
    syncTrapTab();
    activateTab('#tt-tab-basic');
  }

  function openEdit(id) {
    const item = id ? state.all.find((x) => Number(x.id) === Number(id)) : null;
    fillEdit(
      item || {
        id: 0,
        name: '',
        category: '',
        order: 10000,
        active: 1,
        has_trap: 0,
        params: defaultParams(),
        accessories: { conn: 0, end: 0 },
      }
    );
    showPage('tabletop-model-edit');
    const hash = '#tabletop-model-edit?id=' + (id || 0);
    if (window.location.hash !== hash) window.history.pushState({ page: 'tabletop-model-edit' }, '', hash);
  }

  function readSections() {
    const types = {};
    SECTION_TYPES.forEach((t) => {
      const st = emptySectionType(t.has_bar ? { plank_model_id: 0 } : {});
      st.enabled = document.getElementById('tt-sec-' + t.key + '-enabled')?.checked ? 1 : 0;
      st.price = Number(document.getElementById('tt-sec-' + t.key + '-price')?.value) || 0;
      st.price_mode = document.getElementById('tt-sec-' + t.key + '-price-mode')?.value || 'm';
      st.show_coupler = document.getElementById('tt-sec-' + t.key + '-show-coupler')?.checked ? 1 : 0;
      if (t.has_bar) {
        st.plank_model_id = Number(document.getElementById('tt-sec-' + t.key + '-plank')?.value) || 0;
      }
      types[t.key] = st;
    });
    return {
      types,
      offsets: { min: Number(state.editItem?.params?.sections?.offsets?.min) || 0 },
      coupler: {
        model_id: Number(document.getElementById('tt-coupler-model-id')?.value) || 0,
        base_count: String(document.getElementById('tt-coupler-base-count')?.value || ''),
        min_offset: String(document.getElementById('tt-coupler-min-offset')?.value || ''),
        gen_mode: state.editItem?.params?.sections?.coupler?.gen_mode || 'count',
        gen_value: state.editItem?.params?.sections?.coupler?.gen_value || '',
        end_hole_diameter: Number(document.getElementById('tt-coupler-end-d')?.value) || 8,
        bottom_hole_diameter: Number(document.getElementById('tt-coupler-bottom-d')?.value) || 35,
        bottom_hole_depth: Number(document.getElementById('tt-coupler-bottom-depth')?.value) || 20,
        end_hole_depth: Number(document.getElementById('tt-coupler-end-depth')?.value) || 20,
        joint_to_center: Number(document.getElementById('tt-coupler-joint')?.value) || 32,
      },
    };
  }

  function readForm() {
    const num = (id, fallback) => {
      const n = Number(document.getElementById(id)?.value);
      return isFinite(n) ? n : fallback;
    };
    const matMode = Number(document.getElementById('tt-model-mat-mode')?.value) === 1 ? 1 : 0;
    const variants = collectVariantsFromDom();
    state.variants = variants;

    const prevMp = state.editItem?.params?.mat_params || defaultMatParams();
    const mat_params = defaultMatParams();
    mat_params.type = prevMp.type || 'Standard';
    const colorRaw =
      String(document.getElementById('tt-mat-color-hex')?.value || '').trim() ||
      document.getElementById('tt-mat-color')?.value ||
      '#ffffff';
    mat_params.params = Object.assign({}, mat_params.params, prevMp.params || {}, {
      color: colorRaw,
      roughness: num('tt-mat-roughness', 1),
      metalness: num('tt-mat-metalness', 0),
      transparent: document.getElementById('tt-mat-transparent')?.checked ? 1 : 0,
      opacity: num('tt-mat-opacity', 1),
      map: String(document.getElementById('tt-mat-map')?.value || '').trim(),
      normalMap: String(document.getElementById('tt-mat-normal')?.value || '').trim(),
      roughnessMap: String(document.getElementById('tt-mat-rough-map')?.value || '').trim(),
    });
    mat_params.add_params = Object.assign({}, mat_params.add_params, prevMp.add_params || {}, {
      wrapping: document.getElementById('tt-mat-wrapping')?.value || 'mirror',
      rotation: document.getElementById('tt-mat-rotation')?.value || 'normal',
      stretch_width: document.getElementById('tt-mat-stretch-w')?.checked ? 1 : 0,
      stretch_height: document.getElementById('tt-mat-stretch-h')?.checked ? 1 : 0,
      real_width: num('tt-mat-real-w', 256),
      real_height: num('tt-mat-real-h', 256),
      one_sided: document.getElementById('tt-mat-one-sided')?.checked ? 1 : 0,
    });

    const params = defaultParams();
    params.mat_mode = matMode;
    params.material = matMode === 1 ? num('tt-mat-decor-id', 0) : 0;
    params.mat_params = mat_params;
    params.auto_variant = document.getElementById('tt-auto-variant')?.checked ? 1 : 0;
    params.butt = {
      id: 0,
      key: String(document.getElementById('tt-butt-key')?.value || ''),
    };
    params.variants = variants.map((v) => {
      const { id, ...rest } = v;
      return rest;
    });
    params.trap_variants = Array.isArray(state.editItem?.params?.trap_variants)
      ? state.editItem.params.trap_variants
      : [];
    params.spec = {
      hide_sizes_catalog: document.getElementById('tt-hide-sizes')?.checked ? 1 : 0,
    };
    params.sections = readSections();
    params.preview_w = num('tt-preview-w', 450);
    params.preview_h = num('tt-preview-h', 720);

    return normalizeItem({
      name: (document.getElementById('tt-model-name')?.value || '').trim(),
      code: (document.getElementById('tt-model-code')?.value || '').trim(),
      has_trap: document.getElementById('tt-model-has-trap')?.checked ? 1 : 0,
      category: document.getElementById('tt-model-category')?.value || '',
      order: num('tt-model-order', 10000),
      active: document.getElementById('tt-model-active')?.checked ? 1 : 0,
      icon: (document.getElementById('tt-model-icon')?.value || '').trim(),
      accessories: {
        conn: num('tt-acc-conn', 0),
        end: num('tt-acc-end', 0),
      },
      params,
    });
  }

  async function saveEdit(exitAfter) {
    const payload = readForm();
    if (!payload.name) {
      alert('Введите название');
      return;
    }
    const id = state.editId;
    const url = id
      ? '/api/catalog/item_edit/' + TYPE + '/' + id
      : '/api/catalog/item_add/' + TYPE + '/';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      if (typeof toastr !== 'undefined') toastr.success('Сохранено');
      state.all = await fetchList(TYPE);
      if (exitAfter) openList();
      else {
        const savedId = data.item?.id || id;
        const saved = state.all.find((x) => Number(x.id) === Number(savedId));
        fillEdit(saved || { ...payload, id: savedId });
      }
    } catch (e) {
      alert('Ошибка сохранения: ' + e.message);
    }
  }

  async function copyItem(id) {
    const item = state.all.find((x) => Number(x.id) === Number(id));
    if (!item) return;
    const copy = { ...normalizeItem(item), name: (item.name || 'Столешница') + ' (копия)' };
    delete copy.id;
    const res = await fetch('/api/catalog/item_add/' + TYPE + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(copy),
    });
    if (!res.ok) {
      alert('Не удалось скопировать');
      return;
    }
    if (typeof toastr !== 'undefined') toastr.success('Скопировано');
    await loadList();
  }

  async function deleteItem(id, name) {
    if (!confirm('Удалить «' + (name || id) + '»?')) return;
    const res = await fetch('/api/catalog/item_delete/' + TYPE + '/' + id, { method: 'DELETE' });
    if (!res.ok) {
      alert('Не удалось удалить');
      return;
    }
    if (typeof toastr !== 'undefined') toastr.success('Удалено');
    await loadList();
  }

  async function toggleActive(id) {
    const item = state.all.find((x) => Number(x.id) === Number(id));
    if (!item) return;
    const active = (item.active ?? 1) == 1;
    const res = await fetch('/api/catalog/item_edit/' + TYPE + '/' + id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...normalizeItem(item), active: active ? 0 : 1 }),
    });
    if (!res.ok) return;
    await loadList();
  }

  function renderCategoriesModal() {
    const host = document.getElementById('tt-categories-list');
    if (!host) return;
    const rows = state.categories.slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    if (!rows.length) {
      host.innerHTML = '<div style="color:#999; padding:8px 0;">Категорий нет</div>';
      return;
    }
    host.innerHTML = rows
      .map(
        (c) =>
          '<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #eee;">' +
          '<span style="flex:1;">' +
          esc(c.name || '—') +
          '</span>' +
          '<button type="button" class="btn btn-xs btn-outline btn-danger" data-tt-cat-delete="' +
          c.id +
          '" data-name="' +
          esc(c.name || '') +
          '">Удалить</button>' +
          '</div>'
      )
      .join('');
  }

  function openCategories() {
    const modal = document.getElementById('tt-categories-modal');
    if (!modal) return;
    renderCategoriesModal();
    modal.style.display = 'block';
    modal.classList.add('in');
  }

  function closeCategories() {
    const modal = document.getElementById('tt-categories-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('in');
  }

  async function addCategory() {
    const input = document.getElementById('tt-category-name');
    const name = (input?.value || '').trim();
    if (!name) return;
    const res = await fetch('/api/catalog/item_add/' + CAT_TYPE + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parent: 0, order: state.categories.length + 1, active: 1 }),
    });
    if (!res.ok) {
      alert('Не удалось добавить категорию');
      return;
    }
    if (input) input.value = '';
    state.categories = await fetchList(CAT_TYPE);
    fillCategorySelects();
    renderCategoriesModal();
  }

  async function deleteCategory(id, name) {
    if (!confirm('Удалить категорию «' + (name || '') + '»?')) return;
    const res = await fetch('/api/catalog/item_delete/' + CAT_TYPE + '/' + id, { method: 'DELETE' });
    if (!res.ok) return;
    state.categories = await fetchList(CAT_TYPE);
    fillCategorySelects();
    renderCategoriesModal();
  }

  function onHash() {
    const base = hashBase();
    if (base === 'tabletop-models') {
      showPage('tabletop-models');
      loadList();
    } else if (base === 'tabletop-model-edit') {
      const id = parseInt(hashParams().get('id') || '0', 10);
      showPage('tabletop-model-edit');
      if (!state.all.length) {
        loadList().then(() => openEdit(id));
      } else {
        openEdit(id);
      }
    }
  }

  function bind() {
    document.getElementById('tt-models-add-btn')?.addEventListener('click', () => openEdit(0));
    document.getElementById('tt-models-categories-btn')?.addEventListener('click', openCategories);
    document.getElementById('tt-models-search-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.search = document.getElementById('tt-models-search-input')?.value || '';
      state.page = 1;
      renderTable();
    });
    document.getElementById('tt-models-category-filter')?.addEventListener('change', (e) => {
      state.category = e.target.value || '';
      state.page = 1;
      renderTable();
    });
    document.getElementById('tt-models-per-page')?.addEventListener('change', (e) => {
      state.perPage = parseInt(e.target.value || '20', 10) || 20;
      state.page = 1;
      renderTable();
    });
    document.getElementById('tt-models-table-body')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tt-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-tt-action');
      if (action === 'edit') openEdit(id);
      else if (action === 'copy') copyItem(id);
      else if (action === 'delete') deleteItem(id, btn.getAttribute('data-name'));
      else if (action === 'eye') toggleActive(id);
    });

    document.getElementById('tt-model-mat-mode')?.addEventListener('change', syncMatModeFields);
    document.getElementById('tt-mat-transparent')?.addEventListener('change', syncMatModeFields);
    document.getElementById('tt-mat-color')?.addEventListener('input', () => {
      const v = document.getElementById('tt-mat-color')?.value || '#ffffff';
      setVal('tt-mat-color-hex', v);
      updateDisplayPreview();
    });
    document.getElementById('tt-mat-color-hex')?.addEventListener('change', () => {
      let v = String(document.getElementById('tt-mat-color-hex')?.value || '').trim();
      if (v && v[0] !== '#') v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) setVal('tt-mat-color', v);
      updateDisplayPreview();
    });
    document.getElementById('tt-preview-w')?.addEventListener('change', updateDisplayPreview);
    document.getElementById('tt-preview-h')?.addEventListener('change', updateDisplayPreview);
    document.getElementById('tt-mat-rotation')?.addEventListener('change', updateDisplayPreview);
    // При открытии вкладки «Параметры отображения» — превью как в PP
    document.querySelectorAll('a[href="#tt-tab-display"]').forEach((a) => {
      a.addEventListener('shown.bs.tab', () => updateDisplayPreview());
      a.addEventListener('click', () => setTimeout(updateDisplayPreview, 50));
    });
    wireFilePick('tt-mat-map-btn', 'tt-mat-map-file', 'tt-mat-map', 'tt-mat-map-preview', 'нет');
    wireFilePick('tt-mat-normal-btn', 'tt-mat-normal-file', 'tt-mat-normal', 'tt-mat-normal-preview', '256x256');
    wireFilePick('tt-mat-rough-btn', 'tt-mat-rough-file', 'tt-mat-rough-map', 'tt-mat-rough-preview', '256x256');
    const openIconFm = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof window.openFileManager !== 'function') {
        if (typeof toastr !== 'undefined') toastr.warning('Файловый менеджер не загружен');
        else alert('Файловый менеджер недоступен');
        return;
      }
      window.openFileManager({
        allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        initialPath: 'files',
        onSelect: function (r) {
          if (r && r.url) setIconUi(String(r.url));
        },
      });
    };
    document.getElementById('tt-model-icon-placeholder')?.addEventListener('click', openIconFm);
    document.getElementById('tt-model-icon-preview-wrapper')?.addEventListener('click', openIconFm);
    document.querySelectorAll('#tt-model-icon-block .open_file').forEach((el) => {
      el.addEventListener('click', openIconFm);
    });
    document.getElementById('tt-model-has-trap')?.addEventListener('change', syncTrapTab);
    document.getElementById('tt-variants-add-btn')?.addEventListener('click', () => {
      state.variants = collectVariantsFromDom();
      state.variants.push(emptyVariant());
      renderVariantsList();
    });
    document.getElementById('tt-variants-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tt-var-remove]');
      if (!btn) return;
      state.variants = collectVariantsFromDom();
      const idx = parseInt(btn.getAttribute('data-tt-var-remove'), 10) || 0;
      if (state.variants.length <= 1) return;
      state.variants.splice(idx, 1);
      renderVariantsList();
    });

    SECTION_TYPES.forEach((t) => {
      document.getElementById('tt-sec-' + t.key + '-enabled')?.addEventListener('change', () => syncSectionCard(t.key));
    });

    document.getElementById('tt-model-save')?.addEventListener('click', () => saveEdit(false));
    document.getElementById('tt-model-cancel')?.addEventListener('click', (e) => {
      e.preventDefault();
      openList();
    });
    document.getElementById('tt-model-tabs')?.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#tt-tab-"]');
      if (!a) return;
      e.preventDefault();
      if (a.getAttribute('href') === '#tt-tab-params') {
        state.variants = collectVariantsFromDom();
        renderVariantsList();
      }
      activateTab(a.getAttribute('href'));
    });

    document.getElementById('tt-categories-add-btn')?.addEventListener('click', addCategory);
    document.getElementById('tt-categories-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tt-cat-delete]');
      if (!btn) return;
      deleteCategory(btn.getAttribute('data-tt-cat-delete'), btn.getAttribute('data-name'));
    });
    document.querySelectorAll('[data-tt-modal-close]').forEach((el) => {
      el.addEventListener('click', closeCategories);
    });

    document.getElementById('side-menu')?.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-page="tabletop-models"]');
      if (!link) return;
      setTimeout(() => loadList(), 0);
    });
    window.addEventListener('hashchange', onHash);
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.__cldUpdateTabletopDisplayPreview = updateDisplayPreview;
    bind();
    onHash();
  });
})();
