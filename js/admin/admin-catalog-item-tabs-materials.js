/**
 * admin-catalog-item-tabs-materials.js — Вкладка "Материалы" в редакторе элемента каталога
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function initMaterialsTab() {
    if (window.__CLD_MATERIALS_TAB_INITIALIZED) {
      try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
      return;
    }
    window.__CLD_MATERIALS_TAB_INITIALIZED = true;

    const host = document.getElementById('cld-materials-container');
    const btnReset = document.getElementById('cld-materials-reset');
    const btnApply = document.getElementById('cld-materials-apply');
    if (!host || !btnReset || !btnApply) return;

    // гарантируем, что материалы-утилиты существуют даже если вкладку "Конструктор" ещё не открывали
    window.__cldMaterialsLib = window.__cldMaterialsLib || null;
    window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
    window.__cldMaterialsLoading = window.__cldMaterialsLoading || null;

    async function __cldFetchJson(url) {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
      return await r.json();
    }
    if (typeof window.__cldNormalizeMaterialKey !== 'function') {
      window.__cldNormalizeMaterialKey = function(key) {
        const legacy = { ldsp: 'material_2', hdf: 'material_3' };
        return (key && legacy[key]) ? legacy[key] : key;
      };
    }
    if (typeof window.__cldEnsureMaterialsLoaded !== 'function') {
      window.__cldEnsureMaterialsLoaded = async function __cldEnsureMaterialsLoaded() {
        if (window.__cldMaterialsLib) return window.__cldMaterialsLib;
        if (window.__cldMaterialsLoading) return window.__cldMaterialsLoading;
        window.__cldMaterialsLoading = (async () => {
          const [groups, apiKeysRaw] = await Promise.all([
            __cldFetchJson('/data/materials_groups.json'),
            fetch('/api/catalog/items_get/materials_keys', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
          ]);
          const apiKeys = Array.isArray(apiKeysRaw) ? apiKeysRaw : (apiKeysRaw?.items || []);
          const keys = [];
          const itemsByKey = {};
          for (const m of apiKeys) {
            const id = m?.id;
            const name = (m?.name || '').toString().trim();
            if (!id) continue;
            const typeKey = `material_${id}`;
            keys.push({ key: typeKey, name: name || typeKey });
            try {
              const resp = await fetch(`/api/catalog/items_get/${typeKey}`, { cache: 'no-store' });
              const data = resp.ok ? await resp.json() : [];
              itemsByKey[typeKey] = Array.isArray(data) ? data : (data?.items || []);
            } catch { itemsByKey[typeKey] = []; }
          }
          window.__cldMaterialsLib = { groups: groups || [], keys, itemsByKey };
          return window.__cldMaterialsLib;
        })();
        try { return await window.__cldMaterialsLoading; }
        finally { window.__cldMaterialsLoading = null; }
      };
    }
    if (typeof window.__cldBuildMaterialsPayload !== 'function') {
      const _norm = (k) => (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(k) : k) || 'material_2';
      const _def = () => (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
      window.__cldBuildMaterialsPayload = function __cldBuildMaterialsPayload() {
        const lib = window.__cldMaterialsLib;
        const out = {};
        const st = window.__cldMaterialsState || { groupOverrides: {} };
        const defaultWt = 16;
        if (!lib) return { vars: { _wt: defaultWt }, materials: { g0: { thickness: defaultWt, material: { key: 'material_2', id: 0, variant_id: 0 } } } };
        for (const g of (lib.groups || [])) {
          const key = g?.key;
          if (!key) continue;
          const ov = st.groupOverrides?.[key] || {};
          const thickness = Number(ov.thickness ?? g.thickness ?? (key === 'g0' ? defaultWt : 16));
          out[key] = {
            thickness,
            material: { key: _norm(ov.material_key || g.material) || _def(), id: ov.material_id || 0, variant_id: 0 },
          };
        }
        if (!out.g0) out.g0 = { thickness: defaultWt, material: { key: _def(), id: 0, variant_id: 0 } };
        return { vars: { _wt: Number(out.g0.thickness) || defaultWt }, materials: out };
      };
    }

    const getRoot = () => document.getElementById('constructor-root-module');
    const persistToRoot = () => {
      const root = getRoot();
      if (!root) return;
      root.nodeData = root.nodeData || {};
      root.nodeData.materials_overrides = JSON.parse(JSON.stringify(window.__cldMaterialsState?.groupOverrides || {}));
    };
    const restoreFromRoot = () => {
      const root = getRoot();
      const ov = root?.nodeData?.materials_overrides;
      if (ov && typeof ov === 'object') {
        window.__cldMaterialsState.groupOverrides = { ...(ov || {}) };
      }
    };

    const esc = (s) => String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

    const getMatName = (lib, matKey, matId) => {
      const items = Array.isArray(lib?.itemsByKey?.[matKey]) ? lib.itemsByKey[matKey] : [];
      const it = items.find(x => String(x?.id) === String(matId));
      return it?.name || '';
    };

    // Модель как в рефе: список групп материалов в модуле (можно добавлять/удалять), а значения (толщина/материал)
    // лежат в overrides по ключу группы.
    const ensureModuleGroups = async () => {
      const root = getRoot();
      if (!root) return null;
      root.nodeData = root.nodeData || {};
      const lib = await window.__cldEnsureMaterialsLoaded();
      const globalGroups = Array.isArray(lib?.groups) ? lib.groups : [];
      const keys = Array.isArray(lib?.keys) ? lib.keys : [];
      const defaultsKey = keys?.[0]?.key || 'material_2';

      if (!Array.isArray(root.nodeData.material_groups)) {
        // инициализируем из global groups (как минимум g0)
        const base = globalGroups.length ? globalGroups : [{ key: 'g0', name: 'Корпус', thickness: 16, material: defaultsKey }];
        root.nodeData.material_groups = base.map((g, idx) => ({
          name: g.name || g.key || 'Группа',
          key: g.key || ('g' + idx),
          local: 0,
          locked: 0,
          is_default: (g.key === 'g0') ? 1 : 0,
          allowed_keys: [g.material || defaultsKey],
        }));
      }
      return root.nodeData.material_groups;
    };

    const openAddGroupModal = () => {
      const m = document.getElementById('cld-mat-group-modal');
      if (!m) return;
      const n = document.getElementById('cld-mat-group-name');
      const k = document.getElementById('cld-mat-group-key');
      if (n) n.value = 'Корпус';
      if (k) k.value = 'g' + Math.floor(Math.random() * 100);
      m.style.display = 'flex';
    };
    const closeAddGroupModal = () => {
      const m = document.getElementById('cld-mat-group-modal');
      if (m) m.style.display = 'none';
    };
    const openAddFromGlobalModal = async () => {
      const m = document.getElementById('cld-mat-group-global-modal');
      const body = document.getElementById('cld-mat-group-global-body');
      if (!m || !body) return;
      const lib = await window.__cldEnsureMaterialsLoaded();
      const groups = Array.isArray(lib?.groups) ? lib.groups : [];
      body.innerHTML = groups.map((g) => `
        <tr>
          <td style="padding:8px; border:1px solid #e5e7eb;">${esc(g.name || g.key || '')}</td>
          <td style="padding:8px; border:1px solid #e5e7eb; width:140px;">${esc(g.key || '')}</td>
          <td style="padding:8px; border:1px solid #e5e7eb; width:140px; text-align:right;">
            <button type="button" class="btn btn-primary btn-sm cld-mat-global-add" data-gk="${esc(g.key)}">Добавить</button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="3" style="padding:12px; text-align:center; color:#6b7280;">Нет групп</td></tr>`;
      m.style.display = 'flex';
    };
    const closeAddFromGlobalModal = () => {
      const m = document.getElementById('cld-mat-group-global-modal');
      if (m) m.style.display = 'none';
    };

    const getItemName = (lib, matKey, matId) => {
      const items = Array.isArray(lib?.itemsByKey?.[matKey]) ? lib.itemsByKey[matKey] : [];
      const it = items.find(x => String(x?.id) === String(matId));
      return it?.name || '';
    };

    const render = async () => {
      restoreFromRoot();
      const lib = await window.__cldEnsureMaterialsLoaded();
      const keys = Array.isArray(lib?.keys) ? lib.keys : [];
      const st = window.__cldMaterialsState || { groupOverrides: {} };
      const groups = await ensureModuleGroups();
      if (!groups) return;

      host.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px;">
          <div style="font-size:18px; font-weight:700;">Группы материалов</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" id="cld-mat-add">Добавить</button>
            <button type="button" class="btn btn-primary" id="cld-mat-add-global">Добавить из глобальных групп</button>
          </div>
        </div>

        ${groups.map((g) => {
          const gk = String(g.key || '').trim();
          const ov = st.groupOverrides?.[gk] || {};
          const defaultsKey = (lib?.keys?.[0]?.key) || 'material_2';
          const allowedKey = (Array.isArray(g.allowed_keys) && g.allowed_keys[0]) ? window.__cldNormalizeMaterialKey(g.allowed_keys[0]) : (window.__cldNormalizeMaterialKey(ov.material_key) || defaultsKey);
          const matKey = window.__cldNormalizeMaterialKey(ov.material_key) || allowedKey || defaultsKey;
          const matId = ov.material_id || 0;
          const thickness = Number(ov.thickness ?? 0);
          const matTypeName = keys.find(k => String(k.key) === String(matKey))?.name || matKey;
          const matName = matId ? (getItemName(lib, matKey, matId) || String(matId)) : 'не задан';
          const isDefault = !!g.is_default;
          const locked = !!g.locked;
          const local = !!g.local;

          return `
            <div data-gk="${esc(gk)}" style="border-top:1px solid #e5e7eb; padding-top:14px; margin-top:14px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div class="row" style="flex:1; margin:0;">
                  <div class="col-sm-6">
                    <label style="font-weight:600; font-size:13px;">Название</label>
                    <input type="text" class="form-control form-control-sm cld-mg-name" value="${esc(g.name || '')}">
                  </div>
                  <div class="col-sm-4">
                    <label style="font-weight:600; font-size:13px;">Ключ</label>
                    <input type="text" class="form-control form-control-sm cld-mg-key" value="${esc(gk)}" ${gk === 'g0' ? 'readonly' : ''}>
                  </div>
                </div>
                <button type="button" class="btn btn-white btn-sm cld-mg-del" title="Удалить" ${gk === 'g0' ? 'disabled' : ''}>🗑</button>
              </div>

              <div style="margin-top:12px;">
                <div style="font-size:13px; font-weight:600; margin-bottom:8px;">Доступные материалы:</div>
                <table class="table table-bordered table-sm" style="margin:0; max-width:560px;">
                  <thead>
                    <tr>
                      <td class="col-6">Материал</td>
                      <td class="col-3">Толщина</td>
                      <td class="col-3">Категория</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${esc(matTypeName)}</td>
                      <td>${Number.isFinite(thickness) && thickness > 0 ? esc(thickness) : '(не задана)'}</td>
                      <td>(не задана)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="margin-top:12px; display:flex; gap:16px; flex-wrap:wrap; align-items:center;">
                <div style="min-width:320px;">
                  <div style="font-size:13px; font-weight:600; margin-bottom:6px;">Материал по умолчанию:</div>
                  <div style="font-size:12px; color:#111;">
                    ${esc(matTypeName)} / ${esc(matName)}
                  </div>
                  <div style="margin-top:8px;">
                    <button type="button" class="btn btn-primary btn-sm cld-mg-pick">Изменить</button>
                  </div>
                </div>

                <div style="display:flex; gap:22px; flex-wrap:wrap;">
                  <div>
                    <div style="font-size:12px; color:#111; margin-bottom:6px;">Локальная группа:</div>
                    <label class="switch">
                      <input type="checkbox" class="cld-mg-local" ${local ? 'checked' : ''}>
                      <span class="slider round"></span>
                    </label>
                  </div>
                  <div>
                    <div style="font-size:12px; color:#111; margin-bottom:6px;">Забл. изменение:</div>
                    <label class="switch">
                      <input type="checkbox" class="cld-mg-locked" ${locked ? 'checked' : ''}>
                      <span class="slider round"></span>
                    </label>
                  </div>
                  <div>
                    <div style="font-size:12px; color:#111; margin-bottom:6px;">По умолчанию:</div>
                    <label class="switch">
                      <input type="checkbox" class="cld-mg-default" ${isDefault ? 'checked' : ''}>
                      <span class="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}

        <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" id="cld-mat-add-bottom">Добавить</button>
          <button type="button" class="btn btn-primary" id="cld-mat-add-global-bottom">Добавить из глобальных групп</button>
        </div>
      `;

      // wire buttons
      host.querySelector('#cld-mat-add')?.addEventListener('click', openAddGroupModal);
      host.querySelector('#cld-mat-add-bottom')?.addEventListener('click', openAddGroupModal);
      host.querySelector('#cld-mat-add-global')?.addEventListener('click', openAddFromGlobalModal);
      host.querySelector('#cld-mat-add-global-bottom')?.addEventListener('click', openAddFromGlobalModal);
    };

    // debounce apply to preview
    let t = null;
    const schedulePreview = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        persistToRoot();
        if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
      }, 250);
    };

    host.addEventListener('input', (e) => {
      const wrap = e.target?.closest?.('[data-gk]');
      const gk = wrap?.getAttribute?.('data-gk');
      if (!gk) return;
      const root = getRoot();
      const groups = root?.nodeData?.material_groups;
      const g = Array.isArray(groups) ? groups.find(x => String(x?.key) === String(gk)) : null;
      if (!g) return;

      if (e.target?.classList?.contains('cld-mg-name')) {
        g.name = String(e.target.value || '');
        persistToRoot();
        return;
      }
      if (e.target?.classList?.contains('cld-mg-key')) {
        if (String(gk) === 'g0') return;
        const newKey = String(e.target.value || '').trim();
        if (!newKey) return;
        // перенос overrides на новый ключ
        const st = window.__cldMaterialsState || (window.__cldMaterialsState = { groupOverrides: {} });
        if (st.groupOverrides[gk] && newKey !== gk) {
          st.groupOverrides[newKey] = { ...(st.groupOverrides[gk] || {}) };
          delete st.groupOverrides[gk];
        }
        g.key = newKey;
        persistToRoot();
        schedulePreview();
        return;
      }
    });

    host.addEventListener('change', (e) => {
      const wrap = e.target?.closest?.('[data-gk]');
      const gk = wrap?.getAttribute?.('data-gk');
      if (!gk) return;
      const root = getRoot();
      const groups = root?.nodeData?.material_groups;
      const g = Array.isArray(groups) ? groups.find(x => String(x?.key) === String(gk)) : null;
      if (!g) return;

      if (e.target?.classList?.contains('cld-mg-local')) {
        g.local = e.target.checked ? 1 : 0;
        persistToRoot();
        return;
      }
      if (e.target?.classList?.contains('cld-mg-locked')) {
        g.locked = e.target.checked ? 1 : 0;
        persistToRoot();
        return;
      }
      if (e.target?.classList?.contains('cld-mg-default')) {
        // только одна группа default
        if (Array.isArray(groups)) {
          for (const gg of groups) gg.is_default = 0;
        }
        g.is_default = e.target.checked ? 1 : 0;
        if (!g.is_default) g.is_default = 1; // как в рефе: всегда есть default
        persistToRoot();
        return;
      }
    });

    host.addEventListener('click', (e) => {
      const wrap = e.target?.closest?.('[data-gk]');
      const gk = wrap?.getAttribute?.('data-gk');
      if (!gk) return;
      const root = getRoot();
      const groups = root?.nodeData?.material_groups;
      const g = Array.isArray(groups) ? groups.find(x => String(x?.key) === String(gk)) : null;
      if (!g) return;

      if (e.target?.closest?.('.cld-mg-del')) {
        e.preventDefault();
        if (String(gk) === 'g0') return;
        root.nodeData.material_groups = (root.nodeData.material_groups || []).filter(x => String(x?.key) !== String(gk));
        const st = window.__cldMaterialsState || (window.__cldMaterialsState = { groupOverrides: {} });
        delete st.groupOverrides[gk];
        persistToRoot();
        schedulePreview();
        try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
        return;
      }

      if (e.target?.closest?.('.cld-mg-pick')) {
        e.preventDefault();
        const st = window.__cldMaterialsState || (window.__cldMaterialsState = { groupOverrides: {} });
        const ov = st.groupOverrides[gk] || {};
        const mk = window.__cldNormalizeMaterialKey(ov.material_key) || (Array.isArray(g.allowed_keys) ? window.__cldNormalizeMaterialKey(g.allowed_keys[0]) : null) || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
        // контекст для модалки
        window.__CLD_MATERIAL_MODAL_CONTEXT = { kind: 'groupDefault', groupKey: String(gk), materialKey: String(mk) };
        window.__CLD_MATERIAL_TARGET = { kind: 'groupDefault', groupKey: String(gk), materialKey: String(mk) };
        if (typeof window.openMaterialSelectModal === 'function') window.openMaterialSelectModal();
        return;
      }

      // add from global groups modal
      const addBtn = e.target?.closest?.('.cld-mat-global-add');
      if (addBtn) {
        e.preventDefault();
        const gk2 = addBtn.getAttribute('data-gk');
        if (!gk2) return;
        (async () => {
          const lib = await window.__cldEnsureMaterialsLoaded();
          const gg = (lib.groups || []).find(x => String(x?.key) === String(gk2));
          if (!gg) return;
          const list = await ensureModuleGroups();
          if (!list) return;
          if (list.some(x => String(x?.key) === String(gk2))) return;
          list.push({
            name: gg.name || gk2,
            key: gk2,
            local: 0,
            locked: 0,
            is_default: 0,
            allowed_keys: [window.__cldNormalizeMaterialKey(gg.material) || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2'],
          });
          persistToRoot();
          closeAddFromGlobalModal();
          try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
        })();
        return;
      }
    });

    // перехват выбора материала из модалки: если target=groupDefault — пишем в overrides, иначе оставляем поведение конструктора
    if (!window.__CLD_MATERIALS_PATCHED_SELECT && typeof window.selectMaterialForNode === 'function') {
      const orig = window.selectMaterialForNode;
      window.selectMaterialForNode = function(materialId, materialName) {
        const target = window.__CLD_MATERIAL_TARGET;
        if ((target?.kind === 'groupDefault') && target.groupKey) {
          const gk = String(target.groupKey);
          const st = window.__cldMaterialsState || (window.__cldMaterialsState = { groupOverrides: {} });
          st.groupOverrides[gk] = st.groupOverrides[gk] || {};
          const materialKey = String(window.__cldNormalizeMaterialKey(target.materialKey || st.groupOverrides[gk].material_key) || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2');
          st.groupOverrides[gk].material_key = materialKey;
          st.groupOverrides[gk].material_id = materialId;
          persistToRoot();
          try { window.closeMaterialSelectModal && window.closeMaterialSelectModal(); } catch {}
          window.__CLD_MATERIAL_MODAL_CONTEXT = null;
          window.__CLD_MATERIAL_TARGET = null;
          schedulePreview();
          try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
          return;
        }
        return orig(materialId, materialName);
      };
      window.__CLD_MATERIALS_PATCHED_SELECT = true;
    }

    btnReset.addEventListener('click', () => {
      window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
      window.__cldMaterialsState.groupOverrides = {};
      persistToRoot();
      try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
    });

    btnApply.addEventListener('click', () => {
      persistToRoot();
      if (typeof toastr !== 'undefined') toastr.success('Материалы применены');
      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
    });

    // save new material group from modal
    const mgSave = document.getElementById('cld-mat-group-save');
    if (mgSave && !mgSave.__cldBound) {
      mgSave.addEventListener('click', async () => {
        const root = getRoot();
        if (!root) return;
        const nameEl = document.getElementById('cld-mat-group-name');
        const keyEl = document.getElementById('cld-mat-group-key');
        const name = String(nameEl?.value || '').trim() || 'Группа';
        const key = String(keyEl?.value || '').trim() || ('g' + Math.floor(Math.random() * 100));
        const list = await ensureModuleGroups();
        if (!list) return;
        if (list.some(x => String(x?.key) === String(key))) {
          alert('Группа с таким ключом уже существует');
          return;
        }
        list.push({ name, key, local: 1, locked: 0, is_default: 0, allowed_keys: [(window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2'] });
        persistToRoot();
        document.getElementById('cld-mat-group-modal').style.display = 'none';
        try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
      });
      mgSave.__cldBound = true;
    }

    window.__CLD_MATERIALS_RENDER = render;
    render();
  }

  window.initMaterialsTab = initMaterialsTab;
})();
