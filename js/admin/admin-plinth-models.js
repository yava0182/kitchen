/**
 * Админка: Цоколь → Модели цоколя.
 * Схема PlanPlace catalog/item/cokol (из cokol_item.js):
 *   sizes[] / sizes_radius[], related_changing*,
 *   params: mat_mode 0|1|3, p_mat_variants, side_acc_*, models, conns, spec.butts
 * Плоские heightMm/thicknessMm — алиасы для picker в конструкторе.
 */
(function () {
  const TYPE = 'cokol_items';
  const CAT_TYPE = 'cokol_categories';

  const state = {
    all: [],
    categories: [],
    search: '',
    category: '',
    perPage: 20,
    page: 1,
    editId: 0,
    editItem: null,
    sizes: [],
  };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }

  function asList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  }

  function onlyType(list, type) {
    return (list || []).filter((it) => String(it?.catalog_type || '') === type);
  }

  function newSizeId() {
    return 'size-row-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
  }

  function emptySizeRow(preset) {
    return Object.assign(
      {
        id: newSizeId(),
        enabled: true,
        name: '',
        code: '',
        height: '100',
        width: '3000',
        thickness: '16',
        price_type: 'p',
        price_mode: 'm',
        price: 0,
        acc_id: 0,
        scene_hidden: false,
      },
      preset || {}
    );
  }

  function emptySideAcc() {
    return { name: '', code: '', price_type: 'p', price_mode: 'm', price: 0, acc_id: 0 };
  }

  function emptyConn() {
    return { enabled: false, model: '', code: '', price_type: 'p', price_mode: 'c', price: 0, acc_id: 0 };
  }

  /** Канонический params как в PP item_params.params */
  function defaultParams() {
    return {
      mat_mode: 3,
      material: 0,
      p_mat_key: 'ldsp',
      p_mat: 0,
      p_mat_category_ids: [],
      p_mat_variants: [{ id: 'plit-default-0', p_mat_key: 'ldsp', p_mat_category_ids: [], p_mat: 0 }],
      p_variant: 0,
      spec: { butts: [], orientation: 'f', show_index: 1, butts_flags: { left: 0, right: 0, top: 0, bottom: 0 } },
      mat_params: {},
      models: {
        common: { model: '' },
        radius: { model: '' },
      },
      accs: [],
      conns: {
        a0: emptyConn(),
        a180: emptyConn(),
        a90: emptyConn(),
        a135: emptyConn(),
      },
      height: 100,
      thickness: 16,
      width: 3000,
      side_acc_left_id: 0,
      side_acc_right_id: 0,
      side_acc_plate_joint_id: 0,
      side_acc_top: emptySideAcc(),
      side_acc_bottom: emptySideAcc(),
    };
  }

  function mergeSideAcc(src) {
    const b = emptySideAcc();
    const s = src && typeof src === 'object' ? src : {};
    return {
      name: String(s.name || ''),
      code: String(s.code || ''),
      price_type: String(s.price_type || b.price_type),
      price_mode: String(s.price_mode || b.price_mode),
      price: Number(s.price) || 0,
      acc_id: Number(s.acc_id) || 0,
    };
  }

  /** Достаёт URL модели: строка или { model: '...' }; объект целиком не stringify. */
  function modelUrlOf(entry) {
    if (entry == null || entry === '') return '';
    if (typeof entry === 'string') {
      const s = entry.trim();
      return s === '[object Object]' ? '' : s;
    }
    if (typeof entry === 'object') {
      const m = entry.model;
      if (typeof m === 'string') return m.trim() === '[object Object]' ? '' : m.trim();
      if (m != null && typeof m !== 'object') return String(m);
    }
    return '';
  }

  function mergeSizeRow(src) {
    const b = emptySizeRow();
    const s = src && typeof src === 'object' ? src : {};
    return {
      id: s.id != null && s.id !== '' ? String(s.id) : newSizeId(),
      enabled: s.enabled !== false && s.enabled !== 0 && s.enabled !== '0',
      name: String(s.name || ''),
      code: String(s.code || ''),
      height: s.height != null && s.height !== '' ? String(s.height) : b.height,
      width: s.width != null && s.width !== '' ? String(s.width) : b.width,
      thickness: s.thickness != null && s.thickness !== '' ? String(s.thickness) : b.thickness,
      price_type: String(s.price_type || b.price_type),
      price_mode: String(s.price_mode || b.price_mode),
      price: Number(s.price) || 0,
      acc_id: Number(s.acc_id) || 0,
      scene_hidden: !!s.scene_hidden,
    };
  }

  function firstEnabledSize(sizes) {
    const list = Array.isArray(sizes) ? sizes : [];
    return list.find((r) => r && r.enabled !== false && r.enabled !== 0 && r.enabled !== '0') || list[0] || null;
  }

  function buttsFlagsFromSpec(spec) {
    const flags = { left: 0, right: 0, top: 0, bottom: 0 };
    if (!spec || typeof spec !== 'object') return flags;
    if (spec.butts_flags && typeof spec.butts_flags === 'object') {
      flags.left = spec.butts_flags.left ? 1 : 0;
      flags.right = spec.butts_flags.right ? 1 : 0;
      flags.top = spec.butts_flags.top ? 1 : 0;
      flags.bottom = spec.butts_flags.bottom ? 1 : 0;
      return flags;
    }
    const butts = Array.isArray(spec.butts) ? spec.butts : [];
    const sideMap = { 1: 'left', 2: 'right', 3: 'top', 4: 'bottom', left: 'left', right: 'right', top: 'top', bottom: 'bottom' };
    butts.forEach((b) => {
      const key = sideMap[b?.side] || sideMap[b?.key];
      if (key) flags[key] = 1;
    });
    return flags;
  }

  function buttsArrayFromFlags(flags) {
    const out = [];
    const map = [
      ['left', 1],
      ['right', 2],
      ['top', 3],
      ['bottom', 4],
    ];
    map.forEach(([name, side]) => {
      if (flags && flags[name]) {
        out.push({ side: side, key: 'butts', material: 0 });
      }
    });
    return out;
  }

  /**
   * Нормализация: старый плоский формат (params.height) → sizes[] + PP params.
   */
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
    p.models = {
      common: {
        model:
          modelUrlOf(srcParams.models?.common) ||
          modelUrlOf(srcParams.models?.common?.model) ||
          modelUrlOf(it.modelUrl) ||
          '',
      },
      radius: {
        model: modelUrlOf(srcParams.models?.radius) || modelUrlOf(srcParams.models?.radius?.model) || '',
      },
    };
    p.conns = {
      a0: Object.assign(emptyConn(), srcParams.conns?.a0 || {}),
      a180: Object.assign(emptyConn(), srcParams.conns?.a180 || {}),
      a90: Object.assign(emptyConn(), srcParams.conns?.a90 || {}),
      a135: Object.assign(emptyConn(), srcParams.conns?.a135 || {}),
    };
    p.side_acc_top = mergeSideAcc(srcParams.side_acc_top);
    p.side_acc_bottom = mergeSideAcc(srcParams.side_acc_bottom);
    p.side_acc_left_id = Number(srcParams.side_acc_left_id) || 0;
    p.side_acc_right_id = Number(srcParams.side_acc_right_id) || 0;
    p.side_acc_plate_joint_id = Number(srcParams.side_acc_plate_joint_id) || 0;
    p.spec = {
      butts: Array.isArray(srcParams.spec?.butts) ? srcParams.spec.butts : [],
      orientation: srcParams.spec?.orientation || 'f',
      show_index: srcParams.spec?.show_index != null ? srcParams.spec.show_index : 1,
      butts_flags: buttsFlagsFromSpec(srcParams.spec),
    };
    if (!Array.isArray(p.p_mat_variants) || !p.p_mat_variants.length) {
      p.p_mat_variants = [
        {
          id: 'plit-default-0',
          p_mat_key: String(p.p_mat_key || 'ldsp'),
          p_mat_category_ids: Array.isArray(p.p_mat_category_ids) ? p.p_mat_category_ids : [],
          p_mat: p.p_mat || 0,
        },
      ];
    }

    let sizes = Array.isArray(it.sizes) ? it.sizes.map(mergeSizeRow) : [];
    if (!sizes.length) {
      const h = Number(srcParams.height ?? it.heightMm) || 100;
      const t = Number(srcParams.thickness ?? it.thicknessMm) || 16;
      const w = Number(srcParams.width ?? it.widthMm) || 3000;
      const legacyCommon = srcParams.models?.common && typeof srcParams.models.common === 'object' ? srcParams.models.common : {};
      sizes = [
        emptySizeRow({
          id: 'size-row-0',
          height: String(h),
          thickness: String(t),
          width: String(w),
          code: String(legacyCommon.code || it.code || ''),
          price_type: legacyCommon.price_type === 'c' ? 'c' : legacyCommon.price_type || 'p',
          price_mode: legacyCommon.price_mode || 'm',
          price: Number(legacyCommon.price) || Number(it.pricePerMp) || 0,
          acc_id: Number(legacyCommon.acc_id) || 0,
          enabled: true,
        }),
      ];
    }

    const sizes_radius = Array.isArray(it.sizes_radius) ? it.sizes_radius.map(mergeSizeRow) : [];

    const matModeRaw = p.mat_mode != null ? p.mat_mode : it.materialKind === 'custom' ? 0 : 3;
    const matModeNum = Number(matModeRaw);
    const matMode = matModeNum === 0 || matModeNum === 1 ? matModeNum : 3;
    p.mat_mode = matMode;

    if (matMode === 3) {
      if (!p.p_mat_key) p.p_mat_key = 'ldsp';
      p.p_mat_variants[0] = Object.assign({}, p.p_mat_variants[0], {
        p_mat_key: String(p.p_mat_key || p.p_mat_variants[0].p_mat_key || 'ldsp'),
        p_mat: p.p_mat || p.p_mat_variants[0].p_mat || 0,
      });
    }

    const primary = firstEnabledSize(sizes);
    const height = Number(primary?.height) || Number(p.height) || Number(it.heightMm) || 100;
    const thickness = Number(primary?.thickness) || Number(p.thickness) || Number(it.thicknessMm) || 16;
    const width = Number(primary?.width) || Number(p.width) || Number(it.widthMm) || 3000;
    p.height = height;
    p.thickness = thickness;
    p.width = width;

    const kind = matMode === 0 ? 'custom' : matMode === 1 ? 'decor' : 'board';
    const pricePerMp =
      Number(it.pricePerMp) ||
      (primary && (primary.price_type === 'c' || primary.price_type === 'm') ? Number(primary.price) : Number(primary?.price)) ||
      0;

    const related_changing = !!(it.related_changing ?? false);
    const related_changing_on_scene =
      it.related_changing_on_scene === undefined || it.related_changing_on_scene === null
        ? true
        : !!it.related_changing_on_scene;

    return {
      ...it,
      catalog_type: TYPE,
      name: String(it.name || ''),
      code: String(it.code || ''),
      icon: String(it.icon || ''),
      category: String(it.category || ''),
      active: (it.active ?? 1) == 1 || it.active === true ? 1 : 0,
      order: Number(it.order) || 10000,
      materialKind: kind === 'decor' ? 'board' : kind,
      colorMode: kind === 'board' || kind === 'decor' ? 'facade' : 'own',
      heightMm: height,
      thicknessMm: thickness,
      widthMm: width,
      pricePerMp,
      modelUrl: p.models.common.model || it.modelUrl || '',
      color: it.color || p.mat_params?.params?.color || '',
      related_changing,
      related_changing_on_scene,
      related_materials_group_id: Number(it.related_materials_group_id) || 0,
      related_materials_group_key: String(it.related_materials_group_key || ''),
      sizes,
      sizes_radius,
      params: p,
    };
  }

  function materialLabel(item) {
    const mode = Number(item?.params?.mat_mode);
    if (mode === 0) return 'Свои параметры';
    if (mode === 1) return 'Декор';
    return 'Плитный материал';
  }

  function sizeLabel(item) {
    const n = normalizeItem(item);
    const primary = firstEnabledSize(n.sizes);
    if (!primary) return '—';
    const h = Number(primary.height);
    const t = Number(primary.thickness);
    if (!isFinite(h) || !isFinite(t) || h <= 0) return '—';
    const extra = n.sizes.length > 1 ? ' (+' + (n.sizes.length - 1) + ')' : '';
    return h + '×' + t + ' мм' + extra;
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

  async function ensureSeed() {
    const items = await fetchList(TYPE);
    const cats = await fetchList(CAT_TYPE);
    if (!cats.length) {
      for (const row of [
        { name: 'лдсп', parent: 0, order: 1, active: 1 },
        { name: 'МДФ', parent: 0, order: 2, active: 1 },
        { name: 'Пластик', parent: 0, order: 3, active: 1 },
      ]) {
        await fetch('/api/catalog/item_add/' + CAT_TYPE + '/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        });
      }
    }
    if (!items.length && !localStorage.getItem('cld_cokol_seeded_v3')) {
      const seeds = [
        { name: 'Цоколь ЛДСП', height: 100, thickness: 16, width: 3000, category: 'лдсп', p_mat_key: 'ldsp' },
        { name: 'Цоколь МДФ 100×16мм', height: 100, thickness: 16, width: 3000, category: 'МДФ', p_mat_key: 'mdf' },
        { name: 'Цоколь МДФ 120×16мм', height: 120, thickness: 16, width: 3000, category: 'МДФ', p_mat_key: 'mdf' },
        { name: 'Цоколь МДФ 150×16мм', height: 150, thickness: 16, width: 3000, category: 'МДФ', p_mat_key: 'mdf' },
      ];
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        const params = defaultParams();
        params.p_mat_key = s.p_mat_key;
        params.mat_mode = 3;
        params.height = s.height;
        params.thickness = s.thickness;
        params.width = s.width;
        params.p_mat_variants = [
          { id: 'plit-default-0', p_mat_key: s.p_mat_key, p_mat_category_ids: [], p_mat: 0 },
        ];
        const row = normalizeItem({
          name: s.name,
          category: s.category,
          order: 10000 + i,
          active: 1,
          sizes: [
            emptySizeRow({
              id: 'size-row-0',
              height: String(s.height),
              thickness: String(s.thickness),
              width: String(s.width),
              price_type: 'c',
              price_mode: 'm',
            }),
          ],
          params,
        });
        await fetch('/api/catalog/item_add/' + TYPE + '/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        });
      }
      localStorage.setItem('cld_cokol_seeded_v3', '1');
    }
  }

  function filtered() {
    const q = state.search.trim().toLowerCase();
    return state.all.filter((item) => {
      if (state.category && String(item.category || '') !== state.category) return false;
      if (!q) return true;
      const name = String(item.name || '').toLowerCase();
      const id = String(item.id ?? '');
      return name.includes(q) || id.includes(q);
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
    const filter = document.getElementById('plinth-models-category-filter');
    if (filter) {
      const cur = filter.value;
      filter.innerHTML = '<option value="">Все</option>' + names.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('');
      filter.value = cur;
    }
    const edit = document.getElementById('plinth-model-category');
    if (edit) {
      const cur = edit.value;
      edit.innerHTML = names.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('');
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
        '"><a href="#" data-plinth-page="' +
        i +
        '">' +
        i +
        '</a></li>';
    }
    el.innerHTML = html;
    el.querySelectorAll('[data-plinth-page]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        state.page = parseInt(a.getAttribute('data-plinth-page'), 10) || 1;
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
    const tbody = document.getElementById('plinth-models-table-body');
    if (!tbody) return;
    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px; color:#999;">Нет записей</td></tr>';
    } else {
      tbody.innerHTML = slice
        .map((item) => {
          const active = (item.active ?? 1) == 1;
          const eye = active
            ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим" data-plinth-action="eye" data-id="' +
              item.id +
              '"><i class="fa fa-eye"></i></button>'
            : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт" data-plinth-action="eye" data-id="' +
              item.id +
              '"><i class="fa fa-eye-slash"></i></button>';
          return (
            '<tr>' +
            '<td><input type="checkbox" class="plinth-model-checkbox" value="' +
            esc(item.id) +
            '"></td>' +
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
            esc(sizeLabel(item)) +
            '</td>' +
            '<td>' +
            esc(item.category || '—') +
            '</td>' +
            '<td>' +
            esc(materialLabel(item)) +
            '</td>' +
            '<td class="col-order">' +
            esc(item.order) +
            '</td>' +
            '<td class="col-vis">' +
            eye +
            '</td>' +
            '<td class="col-actions"><div class="cld-row-actions">' +
            '<button type="button" class="btn btn-xs btn-outline btn-primary" title="Редактировать" data-plinth-action="edit" data-id="' +
            item.id +
            '"><i class="fa fa-pencil"></i></button>' +
            '<button type="button" class="btn btn-xs btn-outline btn-info" title="Копировать" data-plinth-action="copy" data-id="' +
            item.id +
            '"><i class="fa fa-link"></i></button>' +
            '<button type="button" class="btn btn-xs btn-outline btn-danger" title="Удалить" data-plinth-action="delete" data-id="' +
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
    set('plinth-models-from', rows.length ? from + 1 : 0);
    set('plinth-models-to', to);
    set('plinth-models-total', rows.length);
    renderPager('plinth-models-pagination-top', pages);
    renderPager('plinth-models-pagination-bottom', pages);
  }

  async function loadList() {
    try {
      await ensureSeed();
      state.categories = await fetchList(CAT_TYPE);
      state.all = await fetchList(TYPE);
      fillCategorySelects();
      renderTable();
    } catch (e) {
      console.error('[plinth] load', e);
      const tbody = document.getElementById('plinth-models-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="color:#c00; padding:16px;">Ошибка загрузки</td></tr>';
    }
  }

  function openList() {
    showPage('plinth-models');
    if (window.location.hash.split('?')[0] !== '#plinth-models') {
      window.history.pushState({ page: 'plinth-models' }, '', '#plinth-models');
    }
    loadList();
  }

  function isBoardMode() {
    return String(document.getElementById('plinth-model-mat-mode')?.value || '3') === '3';
  }

  function setPlinthThumb(previewId, url, emptyLabel) {
    const box = document.getElementById(previewId);
    if (!box) return;
    const u = String(url || '').trim();
    if (u) {
      box.innerHTML =
        '<img src="' +
        esc(u) +
        '" alt="" style="width:100%;height:100%;object-fit:cover;">' +
        '<i class="fa fa-folder-open" style="position:absolute;top:4px;right:4px;color:#1c84c6;"></i>';
    } else {
      box.innerHTML =
        '<span style="color:#ccc;font-size:12px;">' +
        esc(emptyLabel || 'нет') +
        '</span>' +
        '<i class="fa fa-folder-open" style="position:absolute;top:4px;right:4px;color:#1c84c6;"></i>';
    }
  }

  function fillPlinthPreviewSizeSelect(sizes) {
    const sel = document.getElementById('plinth-preview-size');
    if (!sel) return;
    const list = Array.isArray(sizes) && sizes.length ? sizes : state.sizes;
    const rows = (list || []).map(mergeSizeRow).filter((r) => r.enabled !== false);
    const cur = sel.value;
    sel.innerHTML = rows
      .map((r, i) => {
        const label = (Number(r.height) || 100) + '×' + (Number(r.thickness) || 16) + ' мм';
        const val = i + ':' + r.height + 'x' + r.width + 'x' + r.thickness;
        return '<option value="' + esc(val) + '">' + esc(label) + '</option>';
      })
      .join('');
    if (!sel.innerHTML) {
      sel.innerHTML = '<option value="0:100x800x16">100×16 мм</option>';
    }
    if (cur && [...sel.options].some((o) => o.value === cur)) sel.value = cur;
  }

  function syncMatModeFields() {
    const mode = String(document.getElementById('plinth-model-mat-mode')?.value || '3');
    const hint = document.getElementById('plinth-model-kind-hint');
    const board = document.getElementById('plinth-mat-board-block');
    const custom = document.getElementById('plinth-mat-custom-block');
    const decor = document.getElementById('plinth-mat-decor-block');
    if (hint) {
      if (mode === '0') hint.textContent = 'Свои параметры (mat_mode=0): цвет / roughness / metalness / текстуры + 3D-превью.';
      else if (mode === '1') hint.textContent = 'Декор (mat_mode=1): материал из каталога декоров.';
      else hint.textContent = 'Плитный материал (mat_mode=3): ключ ЛДСП/МДФ, кромки, синхронизация.';
    }
    if (board) board.style.display = mode === '3' ? '' : 'none';
    if (custom) custom.style.display = mode === '0' ? '' : 'none';
    if (decor) decor.style.display = mode === '1' ? '' : 'none';
    renderSizesList();
    fillPlinthPreviewSizeSelect(state.sizes);
    if (mode === '0' && typeof window.__cldUpdatePlinthDecorPreview === 'function') {
      setTimeout(window.__cldUpdatePlinthDecorPreview, 50);
    }
  }

  function openPlinthModelFm(inputId) {
    if (typeof window.openFileManager !== 'function') {
      alert('Файловый менеджер недоступен');
      return;
    }
    window.openFileManager({
      allowedExt: ['.fbx', '.glb', '.gltf', '.obj', '.dae'],
      initialPath: 'files',
      onSelect: function (r) {
        if (r && r.url) setVal(inputId, r.url);
      },
    });
  }

  function renderSizesList() {
    const host = document.getElementById('plinth-sizes-list');
    if (!host) return;
    const board = isBoardMode();
    if (!state.sizes.length) state.sizes = [emptySizeRow({ id: 'size-row-0' })];
    host.innerHTML = state.sizes
      .map((row, idx) => {
        const dimDisabled = board ? ' disabled title="Наследуется от плитного материала на сцене"' : '';
        return (
          '<div class="plinth-size-card" data-size-idx="' +
          idx +
          '" style="border:1px solid #e7eaec; border-radius:4px; padding:12px 14px; margin-bottom:12px; background:#fafafa;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">' +
          '<label style="margin:0; font-weight:600;"><input type="checkbox" class="plinth-size-enabled chkbox" ' +
          (row.enabled ? 'checked' : '') +
          '> Вариант ' +
          (idx + 1) +
          '</label>' +
          (state.sizes.length > 1
            ? '<button type="button" class="btn btn-xs btn-outline btn-danger" data-plinth-size-remove="' +
              idx +
              '">Удалить</button>'
            : '') +
          '</div>' +
          '<div class="form-group row" style="margin-bottom:8px;">' +
          '<label class="col-sm-2 col-form-label">Название</label>' +
          '<div class="col-sm-4"><input type="text" class="form-control plinth-size-name" value="' +
          esc(row.name) +
          '"></div>' +
          '<label class="col-sm-2 col-form-label">Артикул</label>' +
          '<div class="col-sm-4"><input type="text" class="form-control plinth-size-code" value="' +
          esc(row.code) +
          '"></div>' +
          '</div>' +
          '<div class="form-group row" style="margin-bottom:8px;">' +
          '<label class="col-sm-2 col-form-label">Высота, мм</label>' +
          '<div class="col-sm-2"><input type="number" class="form-control plinth-size-height" min="1" step="1" value="' +
          esc(row.height) +
          '"></div>' +
          '<label class="col-sm-2 col-form-label">Длина, мм</label>' +
          '<div class="col-sm-2"><input type="number" class="form-control plinth-size-width" min="1" step="1" value="' +
          esc(row.width) +
          '"' +
          dimDisabled +
          '></div>' +
          '<label class="col-sm-2 col-form-label">Толщина, мм</label>' +
          '<div class="col-sm-2"><input type="number" class="form-control plinth-size-thickness" min="0.1" step="0.1" value="' +
          esc(row.thickness) +
          '"' +
          dimDisabled +
          '></div>' +
          '</div>' +
          '<div class="form-group row" style="margin-bottom:0;">' +
          '<label class="col-sm-2 col-form-label">Тип цены</label>' +
          '<div class="col-sm-2"><select class="form-control plinth-size-price-type">' +
          '<option value="p"' +
          (row.price_type === 'p' ? ' selected' : '') +
          '>р/шт.</option>' +
          '<option value="c"' +
          (row.price_type === 'c' ? ' selected' : '') +
          '>р/м.п.</option>' +
          '</select></div>' +
          '<label class="col-sm-2 col-form-label">Режим</label>' +
          '<div class="col-sm-2"><select class="form-control plinth-size-price-mode">' +
          '<option value="m"' +
          (row.price_mode === 'm' ? ' selected' : '') +
          '>Ручной ввод</option>' +
          '<option value="c"' +
          (row.price_mode === 'c' ? ' selected' : '') +
          '>Из комплектующих</option>' +
          '</select></div>' +
          '<label class="col-sm-1 col-form-label">Цена</label>' +
          '<div class="col-sm-3"><input type="number" class="form-control plinth-size-price" min="0" step="0.01" value="' +
          esc(row.price) +
          '"></div>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function collectSizesFromDom() {
    const cards = document.querySelectorAll('#plinth-sizes-list .plinth-size-card');
    if (!cards.length) return state.sizes.slice();
    const out = [];
    cards.forEach((card, idx) => {
      const prev = state.sizes[idx] || emptySizeRow();
      out.push({
        id: prev.id || newSizeId(),
        enabled: !!card.querySelector('.plinth-size-enabled')?.checked,
        name: String(card.querySelector('.plinth-size-name')?.value || '').trim(),
        code: String(card.querySelector('.plinth-size-code')?.value || '').trim(),
        height: String(card.querySelector('.plinth-size-height')?.value || '100'),
        width: String(card.querySelector('.plinth-size-width')?.value || '3000'),
        thickness: String(card.querySelector('.plinth-size-thickness')?.value || '16'),
        price_type: card.querySelector('.plinth-size-price-type')?.value || 'p',
        price_mode: card.querySelector('.plinth-size-price-mode')?.value || 'm',
        price: Number(card.querySelector('.plinth-size-price')?.value) || 0,
        acc_id: Number(prev.acc_id) || 0,
        scene_hidden: !!prev.scene_hidden,
      });
    });
    return out;
  }

  function addSizeRow() {
    state.sizes = collectSizesFromDom();
    state.sizes.push(emptySizeRow());
    renderSizesList();
  }

  function removeSizeRow(idx) {
    state.sizes = collectSizesFromDom();
    if (state.sizes.length <= 1) return;
    state.sizes.splice(idx, 1);
    renderSizesList();
  }

  function activateTab(href) {
    const tabs = document.querySelectorAll('#plinth-model-tabs li');
    const panes = document.querySelectorAll('#plinth-model-edit .tab-pane');
    tabs.forEach((li) => {
      const a = li.querySelector('a');
      const match = a && a.getAttribute('href') === href;
      li.classList.toggle('active', !!match);
    });
    panes.forEach((pane) => {
      pane.classList.toggle('active', '#' + pane.id === href);
    });
  }

  function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v == null ? '' : String(v);
  }

  function setChk(id, on) {
    const el = document.getElementById(id);
    if (el) el.checked = !!on;
  }

  function fillSideAcc(prefix, block) {
    const b = mergeSideAcc(block);
    setVal('plinth-side-' + prefix + '-name', b.name);
    setVal('plinth-side-' + prefix + '-code', b.code);
    setVal('plinth-side-' + prefix + '-price-type', b.price_type || 'p');
    setVal('plinth-side-' + prefix + '-price-mode', b.price_mode || 'm');
    setVal('plinth-side-' + prefix + '-price', b.price);
    setVal('plinth-side-' + prefix + '-acc-id', b.acc_id);
  }

  function readSideAcc(prefix) {
    return {
      name: String(document.getElementById('plinth-side-' + prefix + '-name')?.value || '').trim(),
      code: String(document.getElementById('plinth-side-' + prefix + '-code')?.value || '').trim(),
      price_type: document.getElementById('plinth-side-' + prefix + '-price-type')?.value || 'p',
      price_mode: document.getElementById('plinth-side-' + prefix + '-price-mode')?.value || 'm',
      price: Number(document.getElementById('plinth-side-' + prefix + '-price')?.value) || 0,
      acc_id: Number(document.getElementById('plinth-side-' + prefix + '-acc-id')?.value) || 0,
    };
  }

  function fillEdit(item) {
    const n = normalizeItem(item || {});
    state.editId = Number(n.id) || 0;
    state.editItem = n;
    state.sizes = (n.sizes || []).map(mergeSizeRow);
    if (!state.sizes.length) state.sizes = [emptySizeRow({ id: 'size-row-0' })];

    const title = document.getElementById('plinth-model-edit-title');
    if (title) {
      title.textContent = state.editId
        ? 'Редактировать модель цоколя ' + (n.name || '')
        : 'Новая модель цоколя';
    }

    setVal('plinth-model-name', n.name || '');
    setVal('plinth-model-code', n.code || '');
    fillCategorySelects();
    setVal('plinth-model-category', n.category || '');
    setVal('plinth-model-order', n.order != null ? n.order : 10000);
    setVal('plinth-model-icon', n.icon || '');
    setChk('plinth-model-active', n.active == 1);

    const matMode = Number(n.params?.mat_mode);
    setVal('plinth-model-mat-mode', matMode === 0 || matMode === 1 ? String(matMode) : '3');
    setVal('plinth-model-p-mat-key', n.params?.p_mat_key || n.params?.p_mat_variants?.[0]?.p_mat_key || 'ldsp');
    setVal('plinth-model-p-mat', n.params?.p_mat || n.params?.p_mat_variants?.[0]?.p_mat || '');
    setVal(
      'plinth-model-url-common',
      modelUrlOf(n.params?.models?.common) || modelUrlOf(n.modelUrl) || ''
    );
    setVal('plinth-model-url-radius', modelUrlOf(n.params?.models?.radius) || '');
    const color = n.color || n.params?.mat_params?.params?.color || '#ffffff';
    setVal('plinth-model-color', color);
    setVal('plinth-model-color-hex', color);
    setVal('plinth-model-roughness', n.params?.mat_params?.params?.roughness ?? 1);
    setVal('plinth-model-metalness', n.params?.mat_params?.params?.metalness ?? 0);
    setChk('plinth-model-transparent', !!n.params?.mat_params?.params?.transparent);
    setVal('plinth-texture-url', n.params?.mat_params?.params?.map || '');
    setVal('plinth-normal-map-url', n.params?.mat_params?.params?.normalMap || '');
    setVal('plinth-roughness-map-url', n.params?.mat_params?.params?.roughnessMap || '');
    setPlinthThumb('plinth-texture-preview', n.params?.mat_params?.params?.map || '', 'нет');
    setPlinthThumb('plinth-normal-preview', n.params?.mat_params?.params?.normalMap || '', '256x256');
    setPlinthThumb('plinth-roughness-preview', n.params?.mat_params?.params?.roughnessMap || '', '256x256');
    setVal('plinth-model-decor-id', n.params?.material || 0);
    fillPlinthPreviewSizeSelect(n.sizes);

    const flags = buttsFlagsFromSpec(n.params?.spec);
    setChk('plinth-butt-left', flags.left);
    setChk('plinth-butt-right', flags.right);
    setChk('plinth-butt-top', flags.top);
    setChk('plinth-butt-bottom', flags.bottom);
    setChk('plinth-related-changing', n.related_changing);

    setVal('plinth-side-left-id', n.params?.side_acc_left_id || 0);
    setVal('plinth-side-right-id', n.params?.side_acc_right_id || 0);
    setVal('plinth-side-joint-id', n.params?.side_acc_plate_joint_id || 0);
    fillSideAcc('top', n.params?.side_acc_top);
    fillSideAcc('bottom', n.params?.side_acc_bottom);

    syncMatModeFields();
    activateTab('#plinth-tab-main');
  }

  function openEdit(id) {
    const item = id ? state.all.find((x) => Number(x.id) === Number(id)) : null;
    fillEdit(
      item || {
        id: 0,
        name: '',
        category: 'лдсп',
        order: 10000,
        active: 1,
        sizes: [emptySizeRow({ id: 'size-row-0' })],
        params: defaultParams(),
      }
    );
    showPage('plinth-model-edit');
    const hash = '#plinth-model-edit?id=' + (id || 0);
    if (window.location.hash !== hash) window.history.pushState({ page: 'plinth-model-edit' }, '', hash);
  }

  function readForm() {
    const num = (id, fallback) => {
      const n = Number(document.getElementById(id)?.value);
      return isFinite(n) ? n : fallback;
    };
    const matMode = Number(document.getElementById('plinth-model-mat-mode')?.value);
    const mode = matMode === 0 || matMode === 1 ? matMode : 3;

    const sizes = collectSizesFromDom();
    state.sizes = sizes;
    const primary = firstEnabledSize(sizes) || sizes[0] || emptySizeRow();

    const prev = state.editItem?.params || defaultParams();
    const params = defaultParams();
    Object.assign(params, {
      conns: prev.conns || params.conns,
      accs: Array.isArray(prev.accs) ? prev.accs : [],
    });
    params.mat_mode = mode;
    params.height = Number(primary.height) || 100;
    params.thickness = Number(primary.thickness) || 16;
    params.width = Number(primary.width) || 3000;
    params.models = {
      common: { model: modelUrlOf(document.getElementById('plinth-model-url-common')?.value) },
      radius: { model: modelUrlOf(document.getElementById('plinth-model-url-radius')?.value) },
    };

    const flags = {
      left: document.getElementById('plinth-butt-left')?.checked ? 1 : 0,
      right: document.getElementById('plinth-butt-right')?.checked ? 1 : 0,
      top: document.getElementById('plinth-butt-top')?.checked ? 1 : 0,
      bottom: document.getElementById('plinth-butt-bottom')?.checked ? 1 : 0,
    };
    params.spec = {
      butts: buttsArrayFromFlags(flags),
      orientation: prev.spec?.orientation || 'f',
      show_index: prev.spec?.show_index != null ? prev.spec.show_index : 1,
      butts_flags: flags,
    };

    if (mode === 3) {
      const key = String(document.getElementById('plinth-model-p-mat-key')?.value || 'ldsp');
      const pMat = String(document.getElementById('plinth-model-p-mat')?.value || '').trim();
      params.p_mat_key = key;
      params.p_mat = pMat || 0;
      params.p_mat_variants = [
        {
          id: prev.p_mat_variants?.[0]?.id || 'plit-default-0',
          p_mat_key: key,
          p_mat_category_ids: Array.isArray(prev.p_mat_variants?.[0]?.p_mat_category_ids)
            ? prev.p_mat_variants[0].p_mat_category_ids
            : [],
          p_mat: pMat || 0,
        },
      ];
    } else if (mode === 0) {
      const color =
        String(document.getElementById('plinth-model-color-hex')?.value || '').trim() ||
        document.getElementById('plinth-model-color')?.value ||
        '#ffffff';
      params.p_mat_key = '';
      params.p_mat = 0;
      params.p_mat_variants = [];
      params.mat_params = {
        type: 'Standard',
        params: {
          ...(prev.mat_params?.params || {}),
          color,
          roughness: num('plinth-model-roughness', 1),
          metalness: num('plinth-model-metalness', 0),
          transparent: document.getElementById('plinth-model-transparent')?.checked ? 1 : 0,
          map: String(document.getElementById('plinth-texture-url')?.value || '').trim(),
          normalMap: String(document.getElementById('plinth-normal-map-url')?.value || '').trim(),
          roughnessMap: String(document.getElementById('plinth-roughness-map-url')?.value || '').trim(),
        },
        add_params: prev.mat_params?.add_params || {
          real_width: 256,
          real_height: 256,
          rotation: 'normal',
          stretch_width: 0,
          stretch_height: 0,
          normal_scale: false,
          wrapping: 'mirror',
          normal_wrapping: 'mirror',
          roughness_wrapping: 'mirror',
        },
      };
    } else {
      params.material = num('plinth-model-decor-id', 0);
      params.p_mat_key = '';
      params.p_mat = 0;
      params.p_mat_variants = [];
    }

    params.side_acc_left_id = num('plinth-side-left-id', 0);
    params.side_acc_right_id = num('plinth-side-right-id', 0);
    params.side_acc_plate_joint_id = num('plinth-side-joint-id', 0);
    params.side_acc_top = readSideAcc('top');
    params.side_acc_bottom = readSideAcc('bottom');

    const pricePerMp =
      primary.price_type === 'c' || primary.price_type === 'm' ? Number(primary.price) || 0 : Number(primary.price) || 0;

    return normalizeItem({
      name: (document.getElementById('plinth-model-name')?.value || '').trim(),
      code: (document.getElementById('plinth-model-code')?.value || '').trim(),
      category: document.getElementById('plinth-model-category')?.value || '',
      order: num('plinth-model-order', 10000),
      active: document.getElementById('plinth-model-active')?.checked ? 1 : 0,
      icon: (document.getElementById('plinth-model-icon')?.value || '').trim(),
      color: mode === 0 ? document.getElementById('plinth-model-color')?.value || '' : '',
      modelUrl: params.models.common.model || '',
      pricePerMp,
      related_changing: !!document.getElementById('plinth-related-changing')?.checked,
      related_changing_on_scene: state.editItem?.related_changing_on_scene !== false,
      sizes,
      sizes_radius: Array.isArray(state.editItem?.sizes_radius) ? state.editItem.sizes_radius : [],
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
    const copy = { ...normalizeItem(item), id: undefined, name: (item.name || 'Цоколь') + ' (копия)' };
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
    const host = document.getElementById('plinth-categories-list');
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
          '<button type="button" class="btn btn-xs btn-outline btn-danger" data-plinth-cat-delete="' +
          c.id +
          '" data-name="' +
          esc(c.name || '') +
          '">Удалить</button>' +
          '</div>'
      )
      .join('');
  }

  function openCategories() {
    const modal = document.getElementById('plinth-categories-modal');
    if (!modal) return;
    renderCategoriesModal();
    modal.style.display = 'block';
    modal.classList.add('in');
  }

  function closeCategories() {
    const modal = document.getElementById('plinth-categories-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('in');
  }

  async function addCategory() {
    const input = document.getElementById('plinth-category-name');
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
    if (base === 'plinth-models') {
      showPage('plinth-models');
      loadList();
    } else if (base === 'plinth-model-edit') {
      const id = parseInt(hashParams().get('id') || '0', 10);
      showPage('plinth-model-edit');
      if (!state.all.length) {
        loadList().then(() => openEdit(id));
      } else {
        openEdit(id);
      }
    }
  }

  function bind() {
    document.getElementById('plinth-models-add-btn')?.addEventListener('click', () => openEdit(0));
    document.getElementById('plinth-models-categories-btn')?.addEventListener('click', openCategories);
    document.getElementById('plinth-models-search-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.search = document.getElementById('plinth-models-search-input')?.value || '';
      state.page = 1;
      renderTable();
    });
    document.getElementById('plinth-models-category-filter')?.addEventListener('change', (e) => {
      state.category = e.target.value || '';
      state.page = 1;
      renderTable();
    });
    document.getElementById('plinth-models-per-page')?.addEventListener('change', (e) => {
      state.perPage = parseInt(e.target.value || '20', 10) || 20;
      state.page = 1;
      renderTable();
    });
    document.getElementById('plinth-models-table-body')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plinth-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-plinth-action');
      if (action === 'edit') openEdit(id);
      else if (action === 'copy') copyItem(id);
      else if (action === 'delete') deleteItem(id, btn.getAttribute('data-name'));
      else if (action === 'eye') toggleActive(id);
    });
    document.getElementById('plinth-model-mat-mode')?.addEventListener('change', syncMatModeFields);
    document.getElementById('plinth-model-color')?.addEventListener('input', () => {
      setVal('plinth-model-color-hex', document.getElementById('plinth-model-color')?.value || '#ffffff');
      if (typeof window.__cldUpdatePlinthDecorPreview === 'function') window.__cldUpdatePlinthDecorPreview();
    });
    document.getElementById('plinth-model-color-hex')?.addEventListener('change', () => {
      let v = String(document.getElementById('plinth-model-color-hex')?.value || '').trim();
      if (v && v[0] !== '#') v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) setVal('plinth-model-color', v);
      if (typeof window.__cldUpdatePlinthDecorPreview === 'function') window.__cldUpdatePlinthDecorPreview();
    });
    document.getElementById('plinth-preview-size')?.addEventListener('change', () => {
      if (typeof window.__cldUpdatePlinthDecorPreview === 'function') window.__cldUpdatePlinthDecorPreview();
    });
    document.getElementById('plinth-model-url-common-btn')?.addEventListener('click', () =>
      openPlinthModelFm('plinth-model-url-common')
    );
    document.getElementById('plinth-model-url-radius-btn')?.addEventListener('click', () =>
      openPlinthModelFm('plinth-model-url-radius')
    );
    document.getElementById('plinth-sizes-add-btn')?.addEventListener('click', addSizeRow);
    document.getElementById('plinth-sizes-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plinth-size-remove]');
      if (!btn) return;
      removeSizeRow(parseInt(btn.getAttribute('data-plinth-size-remove'), 10) || 0);
    });
    document.getElementById('plinth-butts-all-btn')?.addEventListener('click', () => {
      setChk('plinth-butt-left', true);
      setChk('plinth-butt-right', true);
      setChk('plinth-butt-top', true);
      setChk('plinth-butt-bottom', true);
    });
    document.getElementById('plinth-model-save')?.addEventListener('click', () => saveEdit(false));
    document.getElementById('plinth-model-save-exit')?.addEventListener('click', () => saveEdit(true));
    document.getElementById('plinth-model-cancel')?.addEventListener('click', (e) => {
      e.preventDefault();
      openList();
    });
    document.getElementById('plinth-model-tabs')?.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#plinth-tab-"]');
      if (!a) return;
      e.preventDefault();
      if (a.getAttribute('href') === '#plinth-tab-sizes') {
        state.sizes = collectSizesFromDom();
        renderSizesList();
      }
      activateTab(a.getAttribute('href'));
      if (a.getAttribute('href') === '#plinth-tab-material') {
        fillPlinthPreviewSizeSelect(collectSizesFromDom());
        if (typeof window.__cldInitPlinthDecorPreview === 'function') {
          setTimeout(() => {
            window.__cldInitPlinthDecorPreview();
            if (typeof window.__cldUpdatePlinthDecorPreview === 'function') window.__cldUpdatePlinthDecorPreview();
          }, 50);
        }
      }
    });
    document.getElementById('plinth-categories-add-btn')?.addEventListener('click', addCategory);
    document.getElementById('plinth-categories-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plinth-cat-delete]');
      if (!btn) return;
      deleteCategory(btn.getAttribute('data-plinth-cat-delete'), btn.getAttribute('data-name'));
    });
    document.querySelectorAll('[data-plinth-modal-close]').forEach((el) => {
      el.addEventListener('click', closeCategories);
    });
    document.getElementById('side-menu')?.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-page="plinth-models"]');
      if (!link) return;
      setTimeout(() => loadList(), 0);
    });
    window.addEventListener('hashchange', onHash);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    onHash();
  });
})();
