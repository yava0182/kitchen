/**
 * Связь однодверная ↔ двустворчатая карточка каталога (вкладка «Основные»).
 * Сохраняет pairedCatalogItemIds в data элемента; при сохранении синхронизирует обратную ссылку.
 */
(function () {
  'use strict';

  const DEFAULT_SINGLE_CAT = 9;
  const DEFAULT_DOUBLE_CAT = 10;

  function getDoorCategoryIdsFromRoomSteps() {
    try {
      let cfg = null;
      if (typeof window.getRoomStepsConfig === 'function') {
        cfg = window.getRoomStepsConfig();
      }
      if (!cfg || !Array.isArray(cfg.steps)) {
        const raw = localStorage.getItem('room_steps_config');
        if (raw) cfg = JSON.parse(raw);
      }
      const s4 = cfg?.steps?.find((s) => s.stepId === 4);
      const cf = s4?.catalog_filter;
      const single = Number(cf?.single_door_category_id);
      const double = Number(cf?.double_facade_category_id);
      return {
        single: Number.isFinite(single) && single > 0 ? single : DEFAULT_SINGLE_CAT,
        double: Number.isFinite(double) && double > 0 ? double : DEFAULT_DOUBLE_CAT,
      };
    } catch (_) {
      return { single: DEFAULT_SINGLE_CAT, double: DEFAULT_DOUBLE_CAT };
    }
  }

  /** id категорий «Однодверные» / «Двухдверные» в текущем каталоге (у тумб catalog_25 это 5 и 6, не 9/10). */
  function resolveDoorCategoryIdsFromFlatCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) return null;
    let singleId = null;
    let doubleId = null;
    for (const c of categories) {
      const name = String(c.name || c.label || c.title || '').toLowerCase();
      const id = Number(c.id != null ? c.id : c.category_id);
      if (!Number.isFinite(id)) continue;
      if (/однодвер|одноствор/.test(name)) singleId = id;
      if (/двухдвер|двуствор/.test(name)) doubleId = id;
    }
    if (singleId != null && doubleId != null) {
      return { single: singleId, double: doubleId };
    }
    return null;
  }

  function getDoorCategoryIds(doorIdsOverride) {
    if (
      doorIdsOverride &&
      Number(doorIdsOverride.single) > 0 &&
      Number(doorIdsOverride.double) > 0
    ) {
      return {
        single: Number(doorIdsOverride.single),
        double: Number(doorIdsOverride.double),
      };
    }
    return getDoorCategoryIdsFromRoomSteps();
  }

  function normalizeCatIds(category) {
    if (!category) return [];
    const toNum = (x) => {
      if (x == null || x === '') return null;
      if (typeof x === 'number' && Number.isFinite(x)) return x;
      if (typeof x === 'string' && String(x).trim() !== '') {
        const n = Number(String(x).trim());
        return Number.isFinite(n) ? n : null;
      }
      if (typeof x === 'object' && x.id != null) {
        const n = Number(x.id);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };
    if (Array.isArray(category)) {
      return category.map(toNum).filter((id) => id != null);
    }
    const one = toNum(category);
    return one != null ? [one] : [];
  }

  function inferDoorKindFromCategoryIds(categoryIds, doorIdsOverride) {
    const { single, double } = getDoorCategoryIds(doorIdsOverride);
    const has = (id) => categoryIds.indexOf(Number(id)) >= 0 || categoryIds.indexOf(id) >= 0;
    if (has(double)) return 'double';
    if (has(single)) return 'single';
    return null;
  }

  function parseItemData(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }

  function parsePairedIds(d) {
    const data = parseItemData(d);
    const raw = data.pairedCatalogItemIds;
    if (!raw || typeof raw !== 'object') {
      return { single: 0, double: 0 };
    }
    return {
      single: Number(raw.single) || 0,
      double: Number(raw.double) || 0,
    };
  }

  function doorKindLabel(kind) {
    if (kind === 'single') return 'однодверная';
    if (kind === 'double') return 'двустворчатая';
    return 'не задан';
  }

  function itemDisplayName(item) {
    const d = parseItemData(item?.data);
    return (
      (d.name && String(d.name).trim()) ||
      (item?.name && String(item.name).trim()) ||
      `id ${item?.id ?? '?'}`
    );
  }

  function resolveDoorKindForVueItem(vueItem) {
    const dk = vueItem?.doorKind;
    if (dk === 'single' || dk === 'double') return dk;
    return inferDoorKindFromCategoryIds(
      normalizeCatIds(vueItem?.category),
      vueItem?.doorCategoryIds
    );
  }

  /** Синхронизация тегов «Однодверные»/«Двухдверные» с меткой doorKind (для фильтра в комнате). */
  function syncCategoryTagsForDoorKind(category, doorKind, doorCategoryIds) {
    const cats = normalizeCatIds(category);
    const { single, double } = getDoorCategoryIds(doorCategoryIds);
    const rest = cats.filter((id) => id !== single && id !== double);
    if (doorKind === 'single') return [...rest, single];
    if (doorKind === 'double') return [...rest, double];
    return rest;
  }

  function mergePairedIntoDataPayload(dataToSave, vueItem, currentItemId) {
    const ids = vueItem.pairedCatalogItemIds || { single: 0, double: 0 };
    const cid = Number(currentItemId) || 0;
    const single = Number(ids.single) || 0;
    const double = Number(ids.double) || 0;
    const kind = resolveDoorKindForVueItem(vueItem);
    if (cid > 0) {
      if (kind === 'single') dataToSave.pairedCatalogItemIds = { single: cid, double: double || 0 };
      else if (kind === 'double') dataToSave.pairedCatalogItemIds = { single: single || 0, double: cid };
      else dataToSave.pairedCatalogItemIds = { single, double };
    } else {
      dataToSave.pairedCatalogItemIds = { single, double };
    }
    const g = String(vueItem.doorVariantGroup || '').trim();
    if (g) dataToSave.doorVariantGroup = g;
    if (kind) dataToSave.doorKind = kind;
    return dataToSave;
  }

  function readPairedFromApiData(_d, itemId, doorCategoryIds) {
    const data = parseItemData(_d);
    const paired = parsePairedIds(data);
    const cid = Number(itemId) || 0;
    const dk = data.doorKind;
    const kind =
      dk === 'single' || dk === 'double'
        ? dk
        : inferDoorKindFromCategoryIds(
            normalizeCatIds(data.category ?? _d?.category),
            doorCategoryIds
          );
    if (cid > 0 && kind === 'single' && !paired.single) paired.single = cid;
    if (cid > 0 && kind === 'double' && !paired.double) paired.double = cid;
    return {
      pairedCatalogItemIds: paired,
      doorVariantGroup: String(data.doorVariantGroup || '').trim(),
      doorKind: kind || null,
    };
  }

  function getCatalogItemDoorKindFromRaw(item, doorIdsOverride) {
    const d = parseItemData(item?.data ?? item);
    const dk = d.doorKind || item?.doorKind;
    if (dk === 'single' || dk === 'double') return dk;
    const doorIds =
      doorIdsOverride || pickerState.doorCategoryIds || null;
    return inferDoorKindFromCategoryIds(
      normalizeCatIds(item?.category ?? d.category),
      doorIds
    );
  }

  function normalizeCatalogItemsResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }

  function loadCatalogItemsFromLocalStorage(catalogType) {
    const ct = String(catalogType || '').trim();
    if (!ct) return [];
    const keys = ct.startsWith('catalog_') ? [ct] : [`catalog_${ct}`, ct];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (_) {}
    }
    return [];
  }

  async function fetchCatalogItemsList(catalogType) {
    const ct = String(catalogType || '').trim();
    const cached = window.__cldLastCatalogItemsForPicker;
    if (
      cached &&
      cached.type === ct &&
      Array.isArray(cached.items) &&
      cached.items.length
    ) {
      return cached.items.slice();
    }

    const local = loadCatalogItemsFromLocalStorage(ct);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const resp = await fetch(
        `/api/catalog/items_get/${encodeURIComponent(ct)}?t=${Date.now()}`,
        { cache: 'no-cache', signal: controller.signal }
      );
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items = normalizeCatalogItemsResponse(data);
      if (items.length) {
        window.__cldLastCatalogItemsForPicker = { type: ct, items, loadedAt: Date.now() };
        return items;
      }
      if (local.length) return local;
      return items;
    } catch (e) {
      clearTimeout(timer);
      if (local.length) {
        console.warn('[door-pair] API failed, using localStorage cache', e);
        return local;
      }
      throw e;
    }
  }

  async function fetchCatalogItem(catalogType, itemId) {
    const resp = await fetch(`/api/catalog/item/${encodeURIComponent(catalogType)}/${itemId}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  async function patchItemPairedIds(catalogType, itemId, pairedCatalogItemIds, doorVariantGroup) {
    const id = Number(itemId) || 0;
    if (id <= 0) return;
    const existing = await fetchCatalogItem(catalogType, id);
    const d = parseItemData(existing?.data ?? existing);
    const next = {
      ...d,
      pairedCatalogItemIds: {
        single: Number(pairedCatalogItemIds.single) || 0,
        double: Number(pairedCatalogItemIds.double) || 0,
      },
    };
    if (doorVariantGroup) next.doorVariantGroup = doorVariantGroup;
    const formData = new FormData();
    formData.append('data', JSON.stringify(next));
    if (existing?.name) formData.append('name', String(existing.name));
    await fetch(`/api/catalog/item_edit/${encodeURIComponent(catalogType)}/${id}`, {
      method: 'POST',
      body: formData,
    });
  }

  async function syncReversePairs(catalogType, currentId, paired, doorVariantGroup) {
    const cid = Number(currentId) || 0;
    if (cid <= 0) return;
    const single = Number(paired.single) || 0;
    const double = Number(paired.double) || 0;
    const group = String(doorVariantGroup || '').trim() || `pair-${Math.min(single, double) || cid}`;
    const tasks = [];
    if (single > 0 && single !== cid) {
      tasks.push(patchItemPairedIds(catalogType, single, { single, double }, group));
    }
    if (double > 0 && double !== cid) {
      tasks.push(patchItemPairedIds(catalogType, double, { single, double }, group));
    }
    await Promise.all(tasks);
  }

  let pickerState = {
    targetKind: null,
    catalogType: '',
    items: [],
    onPick: null,
    doorCategoryIds: null,
    preferOppositeKind: true,
  };

  function hidePickerModal() {
    const modal = document.getElementById('catalog-door-pair-modal');
    if (!modal) return;
    try {
      if (window.jQuery && typeof window.jQuery.fn.modal === 'function') {
        window.jQuery(modal).modal('hide');
      }
    } catch (_) {}
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
  }

  function bindPickerModalDismiss() {
    const modal = document.getElementById('catalog-door-pair-modal');
    if (!modal || modal.dataset.dismissBound === '1') return;
    modal.dataset.dismissBound = '1';
    modal.querySelectorAll('[data-dismiss="modal"], .close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        hidePickerModal();
      });
    });
    document.addEventListener('keydown', function onEsc(ev) {
      if (ev.key !== 'Escape') return;
      const m = document.getElementById('catalog-door-pair-modal');
      if (m && m.classList.contains('show')) hidePickerModal();
    });
  }

  function ensureModal() {
    if (document.getElementById('catalog-door-pair-modal')) {
      bindPickerModalDismiss();
      return;
    }
    const wrap = document.createElement('div');
    wrap.innerHTML = `
<div class="modal fade" id="catalog-door-pair-modal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="catalog-door-pair-modal-title">Выбор связанной модели</h5>
        <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
      </div>
      <div class="modal-body">
        <p class="text-muted small" id="catalog-door-pair-modal-hint"></p>
        <div class="form-group">
          <input type="text" class="form-control form-control-sm" id="catalog-door-pair-search" placeholder="Поиск по названию…">
        </div>
        <div style="max-height: 55vh; overflow: auto;">
          <table class="table table-hover table-sm">
            <thead><tr><th>ID</th><th>Название</th><th>Тип</th></tr></thead>
            <tbody id="catalog-door-pair-tbody"></tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-white" data-dismiss="modal">Отмена</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(wrap.firstElementChild);
    bindPickerModalDismiss();
    const search = document.getElementById('catalog-door-pair-search');
    if (search) {
      search.addEventListener('input', () => renderPickerRows());
    }
  }

  function renderPickerRows() {
    const tbody = document.getElementById('catalog-door-pair-tbody');
    if (!tbody) return;
    const q = String(document.getElementById('catalog-door-pair-search')?.value || '')
      .trim()
      .toLowerCase();
    const currentId = Number(document.getElementById('item_id')?.value) || 0;
    const items = Array.isArray(pickerState.items) ? pickerState.items : [];
    let rows = items.filter((item) => {
      const id = Number(item.id) || 0;
      if (id <= 0 || id === currentId) return false;
      if (!q) return true;
      const name = itemDisplayName(item).toLowerCase();
      return name.includes(q) || String(id).includes(q);
    });
    const tk = pickerState.targetKind;
    if (tk && pickerState.preferOppositeKind) {
      rows = rows.slice().sort((a, b) => {
        const ka = getCatalogItemDoorKindFromRaw(a);
        const kb = getCatalogItemDoorKindFromRaw(b);
        const score = (k) => (k === tk ? 0 : k ? 2 : 1);
        return score(ka) - score(kb);
      });
    }
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="text-center text-muted">' +
        (items.length
          ? 'Нет элементов (кроме текущей карточки)'
          : 'Каталог пуст — откройте список «Тумбы» в меню или сохраните элементы') +
        '</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map((item) => {
        const id = Number(item.id);
        const d = parseItemData(item.data);
        const kind = getCatalogItemDoorKindFromRaw(item);
        const name = itemDisplayName(item);
        return `<tr style="cursor:pointer" data-pick-id="${id}">
          <td>${id}</td>
          <td>${name.replace(/</g, '&lt;')}</td>
          <td>${doorKindLabel(kind)}</td>
        </tr>`;
      })
      .join('');
    tbody.querySelectorAll('tr[data-pick-id]').forEach((tr) => {
      tr.addEventListener('click', () => {
        const id = Number(tr.getAttribute('data-pick-id')) || 0;
        const item = pickerState.items.find((x) => Number(x.id) === id);
        if (item && typeof pickerState.onPick === 'function') {
          pickerState.onPick(item);
        }
        hidePickerModal();
      });
    });
  }

  function showPickerModal() {
    const modal = document.getElementById('catalog-door-pair-modal');
    if (!modal) return;
    try {
      if (window.jQuery && typeof window.jQuery.fn.modal === 'function') {
        window.jQuery(modal).modal({ backdrop: true, keyboard: true, show: true });
        return;
      }
    } catch (_) {}
    modal.classList.add('show');
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (!document.querySelector('.modal-backdrop')) {
      const bd = document.createElement('div');
      bd.className = 'modal-backdrop fade show';
      document.body.appendChild(bd);
      bd.addEventListener('click', () => hidePickerModal());
    }
  }

  async function openPicker(targetKind, onPick) {
    ensureModal();
    const catalogType =
      document.getElementById('controller_name')?.value ||
      window.catalogItemVueApp?.catalogType ||
      '';
    if (!catalogType) {
      alert('Не задан тип каталога (controller_name)');
      return;
    }
    pickerState.targetKind = targetKind;
    pickerState.catalogType = catalogType;
    pickerState.onPick = onPick;
    pickerState.doorCategoryIds =
      window.catalogItemVueApp?.doorCategoryIds || null;
    const searchEl = document.getElementById('catalog-door-pair-search');
    if (searchEl) searchEl.value = '';
    const title = document.getElementById('catalog-door-pair-modal-title');
    const hint = document.getElementById('catalog-door-pair-modal-hint');
    if (title) {
      title.textContent = `Каталог: ${catalogType}`;
    }
    if (hint) {
      hint.textContent =
        'Весь список элементов этого каталога. Для замены в комнате лучше выбрать карточку с меткой «' +
        (targetKind === 'single' ? 'Однодверный' : 'Двустворчатый') +
        '» (такие строки вверху).';
    }
    const tbody = document.getElementById('catalog-door-pair-tbody');
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="text-center">Загрузка…</td></tr>';
    }
    showPickerModal();
    try {
      pickerState.items = await fetchCatalogItemsList(catalogType);
      try {
        renderPickerRows();
      } catch (renderErr) {
        console.warn('[door-pair] renderPickerRows', renderErr);
        if (tbody) {
          tbody.innerHTML =
            '<tr><td colspan="3" class="text-danger text-center">Ошибка отображения списка</td></tr>';
        }
      }
    } catch (e) {
      console.warn('[door-pair] load catalog', e);
      if (tbody) {
        const msg =
          e && e.name === 'AbortError'
            ? 'Таймаут загрузки. Откройте список каталога в меню слева и повторите.'
            : 'Ошибка загрузки: ' + (e?.message || e);
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-danger text-center">' +
          msg.replace(/</g, '&lt;') +
          '</td></tr>';
      }
    }
  }

  function getVueDoorPairOptions() {
    return {
      computed: {
        currentDoorKind() {
          return resolveDoorKindForVueItem(this.item);
        },
        oppositeDoorKind() {
          const k = this.currentDoorKind;
          if (k === 'single') return 'double';
          if (k === 'double') return 'single';
          return null;
        },
        oppositePairLabel() {
          const ok = this.oppositeDoorKind;
          if (!ok) return '';
          const id = Number(this.item.pairedCatalogItemIds?.[ok]) || 0;
          if (!id) return '';
          const lbl = this.item.pairedCatalogLabels?.[ok];
          return lbl ? `${lbl} (id ${id})` : `id ${id}`;
        },
      },
      methods: {
        refreshDoorCategoryIdsFromCatalog(flatCategories) {
          const resolved = resolveDoorCategoryIdsFromFlatCategories(flatCategories);
          if (resolved) {
            this.$set(this, 'doorCategoryIds', resolved);
          } else {
            this.$set(this, 'doorCategoryIds', getDoorCategoryIdsFromRoomSteps());
          }
        },
        onDoorKindChange() {
          const dk = this.item.doorKind;
          if (dk !== 'single' && dk !== 'double' && dk !== '') {
            this.$set(this.item, 'doorKind', '');
            return;
          }
          if (dk === 'single' || dk === 'double') {
            const next = syncCategoryTagsForDoorKind(
              this.item.category,
              dk,
              this.doorCategoryIds
            );
            this.$set(this.item, 'category', next);
          }
        },
        openDoorPairPicker() {
          const ok = this.oppositeDoorKind;
          if (!ok) {
            alert('Выберите метку «Однодверный» или «Двустворчатый» в поле выше.');
            return;
          }
          pickerState.doorCategoryIds = this.doorCategoryIds || null;
          const self = this;
          openPicker(ok, (picked) => {
            const id = Number(picked.id) || 0;
            const name = itemDisplayName(picked);
            const currentId = Number(document.getElementById('item_id')?.value) || 0;
            const ck = self.currentDoorKind;
            const pair = { single: 0, double: 0 };
            const labels = { single: '', double: '' };
            if (ck === 'single' && currentId > 0) {
              pair.single = currentId;
              labels.single = self.item.name || `id ${currentId}`;
            } else if (ck === 'double' && currentId > 0) {
              pair.double = currentId;
              labels.double = self.item.name || `id ${currentId}`;
            }
            pair[ok] = id;
            labels[ok] = name;
            if (!self.item.doorVariantGroup) {
              self.item.doorVariantGroup = `pair-${currentId || id}`;
            }
            self.$set(self.item, 'pairedCatalogItemIds', pair);
            self.$set(self.item, 'pairedCatalogLabels', labels);
          });
        },
        clearOppositePair() {
          const ok = this.oppositeDoorKind;
          if (!ok) return;
          const pair = { ...(this.item.pairedCatalogItemIds || {}) };
          const labels = { ...(this.item.pairedCatalogLabels || {}) };
          pair[ok] = 0;
          labels[ok] = '';
          this.$set(this.item, 'pairedCatalogItemIds', pair);
          this.$set(this.item, 'pairedCatalogLabels', labels);
        },
        applyDoorPairFromLoadedData(meta) {
          if (!meta) return;
          const pair = meta.pairedCatalogItemIds || { single: 0, double: 0 };
          const labels = { single: '', double: '' };
          const catalogType =
            document.getElementById('controller_name')?.value || this.catalogType;
          const fillLabel = async (kind, id) => {
            if (!id) return;
            try {
              const it = await fetchCatalogItem(catalogType, id);
              labels[kind] = itemDisplayName(it);
            } catch (_) {
              labels[kind] = `id ${id}`;
            }
          };
          this.$set(this.item, 'pairedCatalogItemIds', pair);
          this.$set(this.item, 'doorVariantGroup', meta.doorVariantGroup || '');
          if (meta.doorKind) this.$set(this.item, 'doorKind', meta.doorKind);
          const self = this;
          Promise.all([
            fillLabel('single', pair.single),
            fillLabel('double', pair.double),
          ]).then(() => {
            self.$set(self.item, 'pairedCatalogLabels', { ...labels });
          });
        },
      },
    };
  }

  window.__cldCatalogDoorPair = {
    getVueDoorPairOptions,
    mergePairedIntoDataPayload,
    readPairedFromApiData,
    syncReversePairs,
    inferDoorKindFromCategoryIds,
    parsePairedIds,
    resolveDoorCategoryIdsFromFlatCategories,
    getDoorCategoryIdsFromRoomSteps,
    getDoorCategoryIds,
    getCatalogItemDoorKindFromRaw,
    syncCategoryTagsForDoorKind,
  };
})();
