/**
 * Админка: правила ручки по ролям фасада (placementRules, models, defaults).
 */
(function (global) {
  'use strict';

  const LAYOUT_ROLES = [
    { key: '', label: '— любая роль —' },
    { key: 'drawer', label: 'Фасад ящика (drawer)' },
    { key: 'facades_main', label: 'Основная дверь (facades_main)' },
    { key: 'facades_top', label: 'Антресоль / верх (facades_top)' },
    { key: 'facades', label: 'Фасад общий (facades)' },
  ];

  const PRODUCT_KINDS = [
    { key: '', label: '— любой тип —' },
    { key: 'wardrobe', label: 'Шкаф в нише' },
    { key: 'pedestal', label: 'Тумба' },
    { key: 'wall_hung', label: 'Шкаф навесной' },
    { key: 'console', label: 'Консоль' },
  ];

  const DOOR_KINDS = [
    { key: '', label: '— любая дверь —' },
    { key: 'rotate', label: 'Распашная' },
    { key: 'slide', label: 'Ящик / сдвижная' },
  ];

  const ORIENTATIONS = [
    { key: '', label: 'Как по умолчанию' },
    { key: 'vertical', label: 'Вертикально' },
    { key: 'horizontal', label: 'Горизонтально' },
  ];

  const ANCHORS = [
    { key: 'free_edge_height_center', label: 'Вертикальная: свободный край, по высоте центр' },
    { key: 'bottom_free_edge', label: 'Вертикальная: свободный край, отступ от низа' },
    { key: 'top_free_edge', label: 'Вертикальная: свободный край, отступ от верха' },
    { key: 'bottom_center', label: 'Горизонтальная: по центру ширины, отступ от низа' },
    { key: 'top_center', label: 'Горизонтальная: по центру ширины, отступ от верха' },
  ];

  function anchorForSelect(storedAnchor, orientation) {
    const a = String(storedAnchor || '').toLowerCase().trim();
    if (a === 'center' || a === 'free_edge_vertical_center') {
      return String(orientation || '').toLowerCase() === 'horizontal' ? 'top_center' : 'free_edge_height_center';
    }
    if (!a) return 'free_edge_height_center';
    if (
      a === 'free_edge_height_center' ||
      a === 'bottom_free_edge' ||
      a === 'top_free_edge' ||
      a === 'bottom_center' ||
      a === 'top_center'
    ) {
      return a;
    }
    return a;
  }

  const SIZE_PICK = [
    { key: '', label: 'Фиксированный размер' },
    { key: 'fit_height', label: 'Подобрать по высоте фасада' },
    { key: 'fit_width', label: 'Подобрать по ширине фасада' },
  ];

  let __cabinetModels = [];
  let __lastCollectionItem = null;

  function renderCollectionModelsList(models) {
    const modelsHost = document.getElementById('handles-coll-models-list');
    if (!modelsHost) return;
    const arr = Array.isArray(models) ? models : [];
    modelsHost.innerHTML = arr.length ? arr.map((m, i) => collectionModelRowHtml(m, i)).join('') : '';
    bindCollectionModelRows(modelsHost);
  }

  function renderPlacementRulesList(item) {
    const models = Array.isArray(item?.models) ? item.models : collectCollectionModels();
    const rules = Array.isArray(item?.placementRules) ? item.placementRules : [];
    const rulesHost = document.getElementById('handles-placement-rules-list');
    if (rulesHost) {
      rulesHost.innerHTML = rules.length ? rules.map((r, i) => placementRuleRowHtml(r, i, models)).join('') : '';
      bindPlacementRuleRows(rulesHost);
    }
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function mkSelect(name, options, value, cls) {
    const v = String(value ?? '');
    const opts = options
      .map((o) => `<option value="${esc(o.key)}"${String(o.key) === v ? ' selected' : ''}>${esc(o.label)}</option>`)
      .join('');
    return `<select class="form-control form-control-sm ${cls || ''}" data-field="${esc(name)}">${opts}</select>`;
  }

  function cabinetModelOptions(selectedId) {
    const sel = Number(selectedId) || 0;
    let html = '<option value="">— выберите 3D модель —</option>';
    for (const it of __cabinetModels) {
      const id = Number(it?.id) || 0;
      if (!id) continue;
      const name = String(it?.name || 'id=' + id);
      const w = Number(it?.width) || 0;
      const h = Number(it?.height) || 0;
      const d = Number(it?.depth) || 0;
      const sz = w || h || d ? ` (${w}×${h}×${d})` : '';
      html += `<option value="${id}"${id === sel ? ' selected' : ''}>#${id} ${esc(name)}${esc(sz)}</option>`;
    }
    return html;
  }

  function modelIdOptions(models, selectedId, withDefault) {
    const sel = String(selectedId ?? '');
    let html = withDefault ? '<option value="">— как по умолчанию —</option>' : '<option value="">— не выбран —</option>';
    for (const m of models || []) {
      const id = String(m?.id ?? '').trim();
      if (!id) continue;
      const label = String(m?.label || id);
      html += `<option value="${esc(id)}"${id === sel ? ' selected' : ''}>${esc(label)}</option>`;
    }
    return html;
  }

  function modelIdsCheckboxes(models, selectedIds) {
    const set = new Set((selectedIds || []).map((x) => String(x)));
    if (!models?.length) {
      return '<span class="text-muted" style="font-size:12px;">Сначала добавьте размеры в коллекции выше</span>';
    }
    return models
      .map((m) => {
        const id = String(m?.id ?? '').trim();
        if (!id) return '';
        const label = String(m?.label || id);
        const chk = set.has(id) ? ' checked' : '';
        return `<label style="display:inline-block;margin-right:12px;font-size:12px;font-weight:normal;">
          <input type="checkbox" class="handles-pr-model-id-chk" value="${esc(id)}"${chk}> ${esc(label)}
        </label>`;
      })
      .join('');
  }

  function collectionModelRowHtml(row, idx) {
    row = row || {};
    const cmId = Number(row.cabinetModelId) || 0;
    return (
      '<div class="handles-coll-model-row" data-idx="' +
      idx +
      '" style="margin-bottom:10px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:4px;background:#fafafa;position:relative;">' +
      '<button type="button" class="btn btn-outline-danger btn-xs handles-coll-model-del" title="Удалить" style="position:absolute;top:8px;right:8px;"><i class="fa fa-trash"></i></button>' +
      '<div class="row">' +
      '<div class="col-sm-3"><label style="font-size:12px;color:#6b7280;">Код размера</label>' +
      '<input type="text" class="form-control form-control-sm handles-coll-model-id" value="' +
      esc(row.id || '') +
      '" placeholder="192"></div>' +
      '<div class="col-sm-4"><label style="font-size:12px;color:#6b7280;">Название</label>' +
      '<input type="text" class="form-control form-control-sm handles-coll-model-label" value="' +
      esc(row.label || '') +
      '" placeholder="192 мм"></div>' +
      '<div class="col-sm-2"><label style="font-size:12px;color:#6b7280;">Длина (мм)</label>' +
      '<input type="number" class="form-control form-control-sm handles-coll-model-bar" value="' +
      esc(row.barLengthMm != null ? row.barLengthMm : '') +
      '"></div>' +
      '<div class="col-sm-3"><label style="font-size:12px;color:#6b7280;">3D модель</label>' +
      '<select class="form-control form-control-sm handles-coll-model-cm">' +
      cabinetModelOptions(cmId) +
      '</select></div>' +
      '</div></div>'
    );
  }

  function placementRuleRowHtml(rule, idx, models) {
    rule = rule || {};
    const m = rule.match && typeof rule.match === 'object' ? rule.match : rule;
    const pos = rule.position && typeof rule.position === 'object' ? rule.position : {};
    const noHandle = !!rule.noHandle;
    const sizePick = String(rule.sizePick || '');
    const modelIds = Array.isArray(rule.modelIds) ? rule.modelIds : [];

    return (
      '<div class="handles-pr-row" data-idx="' +
      idx +
      '" style="margin-bottom:12px;padding:12px;border:1px solid #e5e7eb;border-radius:4px;background:#fff;position:relative;">' +
      '<button type="button" class="btn btn-outline-danger btn-xs handles-pr-del" style="position:absolute;top:8px;right:8px;"><i class="fa fa-trash"></i></button>' +
      '<div class="row" style="margin-bottom:8px;">' +
      '<div class="col-sm-4"><label style="font-size:12px;color:#6b7280;">Роль фасада</label>' +
      mkSelect('layoutRole', LAYOUT_ROLES, Array.isArray(m.layoutRole) ? m.layoutRole[0] : m.layoutRole, 'handles-pr-layout-role') +
      '</div>' +
      '<div class="col-sm-4"><label style="font-size:12px;color:#6b7280;">Тип изделия</label>' +
      mkSelect('productKind', PRODUCT_KINDS, Array.isArray(m.productKind) ? m.productKind[0] : m.productKind, 'handles-pr-product-kind') +
      '</div>' +
      '<div class="col-sm-4"><label style="font-size:12px;color:#6b7280;">Тип двери</label>' +
      mkSelect('doorKind', DOOR_KINDS, Array.isArray(m.doorKind) ? m.doorKind[0] : m.doorKind, 'handles-pr-door-kind') +
      '</div></div>' +
      '<div class="row" style="margin-bottom:8px;">' +
      '<div class="col-sm-12"><label style="font-size:12px;color:#6b7280;">' +
      '<input type="checkbox" class="handles-pr-no-handle"' +
      (noHandle ? ' checked' : '') +
      '> Без ручки на этом фасаде</label></div></div>' +
      '<div class="handles-pr-fields"' +
      (noHandle ? ' style="display:none;opacity:0.5;"' : '') +
      '>' +
      '<div class="row" style="margin-bottom:8px;">' +
      '<div class="col-sm-4"><label style="font-size:12px;color:#6b7280;">Размер</label>' +
      '<select class="form-control form-control-sm handles-pr-model-id">' +
      modelIdOptions(models, rule.modelId, false) +
      '</select></div>' +
      '<div class="col-sm-4"><label style="font-size:12px;color:#6b7280;">Подбор размера</label>' +
      mkSelect('sizePick', SIZE_PICK, sizePick, 'handles-pr-size-pick') +
      '</div>' +
      '<div class="col-sm-4"><label style="font-size:12px;color:#6b7280;">Ориентация</label>' +
      mkSelect('orientation', ORIENTATIONS, rule.orientation, 'handles-pr-orientation') +
      '</div></div>' +
      '<div class="row handles-pr-pick-ids" style="margin-bottom:8px;' +
      (sizePick ? '' : 'display:none;') +
      '"><div class="col-sm-12"><label style="font-size:12px;color:#6b7280;">Кандидаты для подбора</label><div class="handles-pr-model-ids">' +
      modelIdsCheckboxes(models, modelIds) +
      '</div></div></div>' +
      '<div class="row">' +
      '<div class="col-sm-4"><label style="font-size:12px;color:#6b7280;">Позиция</label>' +
      mkSelect('anchor', ANCHORS, anchorForSelect(pos.anchor, rule.orientation), 'handles-pr-anchor') +
      '</div>' +
      '<div class="col-sm-3"><label style="font-size:12px;color:#6b7280;" title="До центра ручки от низа или верха">Отступ ↑↓ (мм)</label>' +
      '<input type="number" class="form-control form-control-sm handles-pr-offset" value="' +
      esc(pos.offsetMm != null ? pos.offsetMm : '') +
      '" placeholder="30"></div>' +
      '<div class="col-sm-3"><label style="font-size:12px;color:#6b7280;" title="До центра ручки от свободного края (вертикальная)">Отступ от края (мм)</label>' +
      '<input type="number" class="form-control form-control-sm handles-pr-edge-offset" value="' +
      esc(pos.edgeOffsetMm != null ? pos.edgeOffsetMm : '') +
      '" placeholder="30"></div></div></div></div>'
    );
  }

  function bindCollectionModelRows(host) {
    if (!host) return;
    host.querySelectorAll('.handles-coll-model-del').forEach((btn) => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', () => btn.closest('.handles-coll-model-row')?.remove());
    });
    host.querySelectorAll('.handles-coll-model-cm').forEach((sel) => {
      if (sel._bound) return;
      sel._bound = true;
      sel.addEventListener('change', () => {
        const row = sel.closest('.handles-coll-model-row');
        const bar = row?.querySelector('.handles-coll-model-bar');
        const cmId = Number(sel.value) || 0;
        const item = __cabinetModels.find((it) => Number(it?.id) === cmId);
        if (bar && item) {
          const h = Number(item.height) || Number(item.width) || 0;
          if (h > 0 && !bar.value) bar.value = String(h);
        }
      });
    });
  }

  function bindPlacementRuleRows(host) {
    if (!host) return;
    host.querySelectorAll('.handles-pr-del').forEach((btn) => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', () => btn.closest('.handles-pr-row')?.remove());
    });
    host.querySelectorAll('.handles-pr-no-handle').forEach((chk) => {
      if (chk._bound) return;
      chk._bound = true;
      chk.addEventListener('change', () => {
        const fields = chk.closest('.handles-pr-row')?.querySelector('.handles-pr-fields');
        if (fields) {
          fields.style.display = chk.checked ? 'none' : '';
          fields.style.opacity = chk.checked ? '0.5' : '1';
        }
      });
    });
    host.querySelectorAll('.handles-pr-size-pick').forEach((sel) => {
      if (sel._bound) return;
      sel._bound = true;
      sel.addEventListener('change', () => {
        const pick = sel.closest('.handles-pr-row')?.querySelector('.handles-pr-pick-ids');
        if (pick) pick.style.display = sel.value ? '' : 'none';
      });
    });
  }

  function collectCollectionModels() {
    const host = document.getElementById('handles-coll-models-list');
    if (!host) return [];
    const out = [];
    host.querySelectorAll('.handles-coll-model-row').forEach((row) => {
      const id = (row.querySelector('.handles-coll-model-id')?.value || '').trim();
      const label = (row.querySelector('.handles-coll-model-label')?.value || '').trim();
      const cabinetModelId = Number(row.querySelector('.handles-coll-model-cm')?.value || 0) || 0;
      const barLengthMm = Number(row.querySelector('.handles-coll-model-bar')?.value || 0) || 0;
      if (!id && !cabinetModelId) return;
      out.push({
        id: id || 'm' + cabinetModelId,
        label: label || id || 'Размер',
        cabinetModelId,
        barLengthMm: barLengthMm || undefined,
      });
    });
    return out;
  }

  function collectPlacementPayload() {
    return {
      models: collectCollectionModels(),
      defaults: null,
      placementRules: collectPlacementRules(),
    };
  }

  function resolvePrimaryCabinetModelId(payload, fallbackId) {
    const fb = Number(fallbackId) || 0;
    if (payload?.models?.length) {
      for (const rule of payload.placementRules || []) {
        if (!rule?.modelId) continue;
        const m = payload.models.find((x) => String(x.id) === String(rule.modelId));
        if (m?.cabinetModelId > 0) return Number(m.cabinetModelId);
      }
      const first = payload.models.find((m) => Number(m.cabinetModelId) > 0);
      if (first) return Number(first.cabinetModelId);
    }
    return fb;
  }

  function normalizeAnchorForSave(anchor, orientation) {
    const o = String(orientation || '').toLowerCase();
    const a = String(anchor || '').toLowerCase();
    if (o === 'horizontal') {
      if (
        a === 'free_edge_height_center' ||
        a === 'bottom_free_edge' ||
        a === 'top_free_edge' ||
        a === 'center'
      ) {
        return 'top_center';
      }
      return a || 'top_center';
    }
    if (a === 'top_center' || a === 'bottom_center' || a === 'center') {
      return 'free_edge_height_center';
    }
    return a || 'free_edge_height_center';
  }

  function collectPlacementRules() {
    const host = document.getElementById('handles-placement-rules-list');
    if (!host) return [];
    const models = collectCollectionModels();
    const out = [];
    host.querySelectorAll('.handles-pr-row').forEach((row) => {
      const layoutRole = (row.querySelector('.handles-pr-layout-role')?.value || '').trim();
      const productKind = (row.querySelector('.handles-pr-product-kind')?.value || '').trim();
      const doorKind = (row.querySelector('.handles-pr-door-kind')?.value || '').trim();
      const noHandle = !!row.querySelector('.handles-pr-no-handle')?.checked;
      const rule = {};
      const match = {};
      if (layoutRole) match.layoutRole = [layoutRole];
      if (productKind) match.productKind = [productKind];
      if (doorKind) match.doorKind = [doorKind];
      if (Object.keys(match).length) rule.match = match;
      if (noHandle) {
        rule.noHandle = true;
        out.push(rule);
        return;
      }
      const modelId = (row.querySelector('.handles-pr-model-id')?.value || '').trim();
      const sizePick = (row.querySelector('.handles-pr-size-pick')?.value || '').trim();
      const orientation = (row.querySelector('.handles-pr-orientation')?.value || '').trim();
      const anchorRaw = (row.querySelector('.handles-pr-anchor')?.value || '').trim();
      const anchor = normalizeAnchorForSave(anchorRaw, orientation);
      const offsetRaw = row.querySelector('.handles-pr-offset')?.value;
      const edgeOffsetRaw = row.querySelector('.handles-pr-edge-offset')?.value;
      if (modelId) rule.modelId = modelId;
      if (sizePick) {
        rule.sizePick = sizePick;
        const modelIds = [];
        row.querySelectorAll('.handles-pr-model-id-chk:checked').forEach((c) => {
          const v = (c.value || '').trim();
          if (v) modelIds.push(v);
        });
        if (modelIds.length) rule.modelIds = modelIds;
      }
      if (orientation) rule.orientation = orientation;
      if (anchor || (offsetRaw !== '' && offsetRaw != null) || (edgeOffsetRaw !== '' && edgeOffsetRaw != null)) {
        rule.position = {};
        if (anchor) rule.position.anchor = anchor;
        const om = Number(offsetRaw);
        if (offsetRaw !== '' && Number.isFinite(om)) rule.position.offsetMm = om;
        const eom = Number(edgeOffsetRaw);
        if (edgeOffsetRaw !== '' && Number.isFinite(eom)) rule.position.edgeOffsetMm = eom;
      }
      out.push(rule);
    });
    return out;
  }

  function refreshModelSelectsInRules() {
    const models = collectCollectionModels();
    document.querySelectorAll('.handles-pr-model-id').forEach((sel) => {
      const cur = sel.value;
      sel.innerHTML = modelIdOptions(models, cur, false);
    });
    document.querySelectorAll('.handles-pr-model-ids').forEach((host) => {
      const row = host.closest('.handles-pr-row');
      const checked = [];
      host.querySelectorAll('.handles-pr-model-id-chk:checked').forEach((c) => checked.push(c.value));
      host.innerHTML = modelIdsCheckboxes(models, checked);
    });
  }

  async function loadCabinetModels() {
    try {
      const resp = await fetch('/api/catalog/items_get/cabinet_model?t=' + Date.now(), { cache: 'no-cache' });
      if (resp.ok) {
        const data = await resp.json();
        __cabinetModels = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      }
    } catch (e) {
      console.warn('[HandlePlacementRules] cabinet_model:', e);
      __cabinetModels = [];
    }
    return __cabinetModels;
  }

  async function loadPlacementUi(item) {
    __lastCollectionItem = item && typeof item === 'object' ? item : null;
    await loadCabinetModels();
    renderCollectionModelsList(item?.models);
    renderPlacementRulesList(item);
  }

  async function loadCollectionSizesUi() {
    await loadCabinetModels();
    renderCollectionModelsList(__lastCollectionItem?.models || collectCollectionModels());
  }

  function loadPlacementRulesUi() {
    const item = {
      ...(__lastCollectionItem || {}),
      models: collectCollectionModels(),
    };
    renderPlacementRulesList(item);
  }

  function addCollectionModelRow() {
    const host = document.getElementById('handles-coll-models-list');
    if (!host) return;
    const idx = host.querySelectorAll('.handles-coll-model-row').length;
    host.insertAdjacentHTML('beforeend', collectionModelRowHtml({}, idx));
    bindCollectionModelRows(host);
    refreshModelSelectsInRules();
  }

  function addPlacementRuleRow() {
    const host = document.getElementById('handles-placement-rules-list');
    if (!host) return;
    const models = collectCollectionModels();
    const idx = host.querySelectorAll('.handles-pr-row').length;
    host.insertAdjacentHTML('beforeend', placementRuleRowHtml({}, idx, models));
    bindPlacementRuleRows(host);
  }

  function initHandlers() {
    const addModelBtn = document.getElementById('handles-coll-models-add-btn');
    const addRuleBtn = document.getElementById('handles-placement-rules-add-btn');
    if (addModelBtn && !addModelBtn._bound) {
      addModelBtn._bound = true;
      addModelBtn.addEventListener('click', addCollectionModelRow);
    }
    if (addRuleBtn && !addRuleBtn._bound) {
      addRuleBtn._bound = true;
      addRuleBtn.addEventListener('click', addPlacementRuleRow);
    }
    const modelsHost = document.getElementById('handles-coll-models-list');
    if (modelsHost && !modelsHost._refreshBound) {
      modelsHost._refreshBound = true;
      modelsHost.addEventListener('change', (e) => {
        if (e.target?.classList?.contains('handles-coll-model-id') || e.target?.classList?.contains('handles-coll-model-label')) {
          refreshModelSelectsInRules();
        }
      });
    }
  }

  initHandlers();

  global.__cldHandlePlacementRulesAdmin = {
    loadPlacementUi,
    loadCollectionSizesUi,
    loadPlacementRulesUi,
    collectPlacementPayload,
    resolvePrimaryCabinetModelId,
    refreshModelSelectsInRules,
  };
})(typeof window !== 'undefined' ? window : global);
