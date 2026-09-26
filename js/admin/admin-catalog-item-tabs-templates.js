/**
 * admin-catalog-item-tabs-templates.js — Вкладка "Шаблоны" в редакторе элемента каталога
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function initTemplatesTab() {
    if (window.__CLD_TEMPLATES_TAB_INITIALIZED) {
      try { window.__CLD_TEMPLATES_RENDER && window.__CLD_TEMPLATES_RENDER(); } catch {}
      return;
    }
    window.__CLD_TEMPLATES_TAB_INITIALIZED = true;

    const host = document.getElementById('cld-templates-container');
    const btnAddBottom = document.getElementById('cld-templates-add-bottom');
    const activeSelect = document.getElementById('catalog-item-edit-active-template');
    if (!host || !btnAddBottom) return;

    const esc = (s) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const getRoot = () => document.getElementById('constructor-root-module');
    const snapshotFromConstructor = () => {
      if (typeof window.getConstructorTreeJSON !== 'function') return {};
      try { return JSON.parse(JSON.stringify(window.getConstructorTreeJSON() || {})); } catch { return {}; }
    };

    const ensureState = () => {
      const root = getRoot();
      if (!root) return null;
      root.nodeData = root.nodeData || { name: '(модуль без названия)' };
      root.nodeData.templates = Array.isArray(root.nodeData.templates) ? root.nodeData.templates : [];
      if (!root.nodeData.selectedTemplateId) root.nodeData.selectedTemplateId = null;

      if (!root.nodeData.templates.length) {
        const tpl = {
          id: 'tpl_' + Math.random().toString(36).slice(2),
          name: '',
          article: '',
          min: { w: 0, h: 0, d: 0 },
          max: { w: 0, h: 0, d: 0 },
          accessories: [],
          constructor_structure: snapshotFromConstructor(),
        };
        root.nodeData.templates.push(tpl);
        root.nodeData.selectedTemplateId = tpl.id;
      }
      if (!root.nodeData.selectedTemplateId) root.nodeData.selectedTemplateId = root.nodeData.templates[0]?.id || null;
      return root.nodeData;
    };

    const setSelected = (id) => {
      const st = ensureState();
      if (!st) return;
      st.selectedTemplateId = id;
    };

    const getSelectedId = () => {
      const st = ensureState();
      return st?.selectedTemplateId || st?.templates?.[0]?.id || null;
    };

    const syncActiveSelect = () => {
      if (!activeSelect) return;
      const st = ensureState();
      if (!st) return;
      const tpls = st.templates || [];
      const cur = getSelectedId();
      const prev = String(activeSelect.value || '');
      activeSelect.innerHTML = '';
      const optAuto = document.createElement('option');
      optAuto.value = 'auto';
      optAuto.textContent = 'Авто';
      activeSelect.appendChild(optAuto);
      for (const t of tpls) {
        const opt = document.createElement('option');
        opt.value = String(t.id);
        opt.textContent = String(t.name || 'Шаблон');
        activeSelect.appendChild(opt);
      }
      activeSelect.value = (cur && tpls.some(t => String(t.id) === String(cur))) ? String(cur) : 'auto';
      if (prev && prev !== 'auto' && tpls.some(t => String(t.id) === prev)) activeSelect.value = prev;
    };

    const loadTemplateIntoConstructor = (tplId) => {
      const st = ensureState();
      if (!st) return;
      const t = (st.templates || []).find(x => String(x.id) === String(tplId));
      if (!t) return;
      if (typeof window.loadConstructorTreeFromJSON === 'function') {
        window.loadConstructorTreeFromJSON(t.constructor_structure || {});
      }
      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
    };

    const render = () => {
      const st = ensureState();
      if (!st) return;
      const tpls = st.templates || [];
      const selectedId = getSelectedId();

      host.innerHTML = tpls.map((t) => {
        const sel = String(t.id) === String(selectedId);
        const min = t.min || {};
        const max = t.max || {};
        return `
          <div data-tpl-id="${esc(t.id)}" style="border:1px solid #e5e7eb; border-radius:6px; padding:16px; background:#fff; margin-bottom:16px; ${sel ? 'box-shadow: 0 0 0 2px rgba(0,123,255,0.25);' : ''}">
            <div class="row" style="margin-bottom:12px;">
              <div class="col-sm-6">
                <label style="font-weight:600; font-size:13px;">Название</label>
                <input type="text" class="form-control cld-tpl-name" value="${esc(t.name || '')}">
              </div>
              <div class="col-sm-6">
                <label style="font-weight:600; font-size:13px;">Артикул</label>
                <input type="text" class="form-control cld-tpl-article" value="${esc(t.article || '')}">
              </div>
            </div>

            <div class="row" style="margin-bottom:12px;">
              <div class="col-sm-6">
                <div class="row" style="margin-bottom:8px;">
                  <div class="col-sm-6" style="padding-right:8px;">
                    <label style="font-size:13px;">Минимальная ширина</label>
                  </div>
                  <div class="col-sm-6" style="padding-left:8px;">
                    <input type="number" class="form-control cld-tpl-min-w" value="${esc(min.w ?? 0)}">
                  </div>
                </div>
                <div class="row" style="margin-bottom:8px;">
                  <div class="col-sm-6" style="padding-right:8px;">
                    <label style="font-size:13px;">Минимальная высота</label>
                  </div>
                  <div class="col-sm-6" style="padding-left:8px;">
                    <input type="number" class="form-control cld-tpl-min-h" value="${esc(min.h ?? 0)}">
                  </div>
                </div>
                <div class="row">
                  <div class="col-sm-6" style="padding-right:8px;">
                    <label style="font-size:13px;">Минимальная глубина</label>
                  </div>
                  <div class="col-sm-6" style="padding-left:8px;">
                    <input type="number" class="form-control cld-tpl-min-d" value="${esc(min.d ?? 0)}">
                  </div>
                </div>
              </div>
              <div class="col-sm-6">
                <div class="row" style="margin-bottom:8px;">
                  <div class="col-sm-6" style="padding-right:8px;">
                    <label style="font-size:13px;">Максимальная ширина</label>
                  </div>
                  <div class="col-sm-6" style="padding-left:8px;">
                    <input type="number" class="form-control cld-tpl-max-w" value="${esc(max.w ?? 0)}">
                  </div>
                </div>
                <div class="row" style="margin-bottom:8px;">
                  <div class="col-sm-6" style="padding-right:8px;">
                    <label style="font-size:13px;">Максимальная высота</label>
                  </div>
                  <div class="col-sm-6" style="padding-left:8px;">
                    <input type="number" class="form-control cld-tpl-max-h" value="${esc(max.h ?? 0)}">
                  </div>
                </div>
                <div class="row">
                  <div class="col-sm-6" style="padding-right:8px;">
                    <label style="font-size:13px;">Максимальная глубина</label>
                  </div>
                  <div class="col-sm-6" style="padding-left:8px;">
                    <input type="number" class="form-control cld-tpl-max-d" value="${esc(max.d ?? 0)}">
                  </div>
                </div>
              </div>
            </div>

            <div style="margin-top:14px;">
              <div style="font-size:13px; font-weight:600; margin-bottom:8px;">Комплектующие</div>
              <button type="button" class="btn btn-primary btn-sm cld-tpl-acc-add">Добавить</button>
              <div class="cld-tpl-acc-list" style="margin-top:10px;">
                ${Array.isArray(t.accessories) && t.accessories.length ? `
                  <table class="table table-bordered table-sm" style="margin:0;">
                    <thead>
                      <tr>
                        <td class="col-6">Название</td>
                        <td class="col-3">Артикул</td>
                        <td class="col-2">Кол-во</td>
                        <td class="col-1"></td>
                      </tr>
                    </thead>
                    <tbody>
                      ${t.accessories.map((a) => `
                        <tr data-acc-id="${esc(a?.id)}">
                          <td>${esc(a?.name || '')}</td>
                          <td>${esc(a?.sku || '')}</td>
                          <td>
                            <input type="number" min="1" class="form-control form-control-sm cld-tpl-acc-count" value="${esc(a?.count ?? 1)}" style="width:80px;">
                          </td>
                          <td>
                            <button type="button" class="btn btn-white btn-sm cld-tpl-acc-del" title="Удалить">×</button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : `<div style="font-size:12px; color:#6b7280;">Нет добавленных комплектующих</div>`}
              </div>
            </div>

            <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn btn-primary cld-tpl-edit">Редактировать шаблон</button>
              <button type="button" class="btn btn-white cld-tpl-delete">Удалить</button>
            </div>
          </div>
        `;
      }).join('');

      syncActiveSelect();
    };

    host.addEventListener('click', (e) => {
      const card = e.target?.closest?.('[data-tpl-id]');
      const id = card?.getAttribute?.('data-tpl-id');
      if (!id) return;

      setSelected(id);
      render();

      if (e.target?.closest?.('.cld-tpl-edit')) {
        loadTemplateIntoConstructor(id);
        const btn = document.querySelector('#catalog-item-edit .tab_menu_h li[data-tab="constructor"]');
        btn && btn.click();
        return;
      }

      if (e.target?.closest?.('.cld-tpl-acc-add')) {
        if (typeof window.openAccessoriesModalForTemplate === 'function') {
          window.openAccessoriesModalForTemplate(id);
        } else {
          alert('Модалка комплектующих ещё не инициализирована (открой вкладку "Конструктор" один раз).');
        }
        return;
      }

      if (e.target?.closest?.('.cld-tpl-delete')) {
        const st = ensureState();
        if (!st) return;
        st.templates = (st.templates || []).filter(t => String(t.id) !== String(id));
        if (!st.templates.length) {
          const tpl = {
            id: 'tpl_' + Math.random().toString(36).slice(2),
            name: '',
            article: '',
            min: { w: 0, h: 0, d: 0 },
            max: { w: 0, h: 0, d: 0 },
            accessories: [],
            constructor_structure: snapshotFromConstructor(),
          };
          st.templates = [tpl];
          st.selectedTemplateId = tpl.id;
        } else {
          st.selectedTemplateId = st.templates[0].id;
        }
        render();
      }
    });

    host.addEventListener('click', (e) => {
      const card = e.target?.closest?.('[data-tpl-id]');
      const id = card?.getAttribute?.('data-tpl-id');
      if (!id) return;
      const delBtn = e.target?.closest?.('.cld-tpl-acc-del');
      if (!delBtn) return;
      const row = delBtn.closest?.('tr[data-acc-id]');
      const aid = row?.getAttribute?.('data-acc-id');
      if (!aid) return;
      const st = ensureState();
      const t = (st?.templates || []).find(x => String(x.id) === String(id));
      if (!t) return;
      t.accessories = (t.accessories || []).filter(a => String(a?.id) !== String(aid));
      render();
    });

    host.addEventListener('input', (e) => {
      const card = e.target?.closest?.('[data-tpl-id]');
      const id = card?.getAttribute?.('data-tpl-id');
      if (!id) return;
      const st = ensureState();
      if (!st) return;
      const t = (st.templates || []).find(x => String(x.id) === String(id));
      if (!t) return;
      t.min = t.min || { w: 0, h: 0, d: 0 };
      t.max = t.max || { w: 0, h: 0, d: 0 };

      if (e.target?.classList?.contains('cld-tpl-name')) t.name = String(e.target.value || '');
      if (e.target?.classList?.contains('cld-tpl-article')) t.article = String(e.target.value || '');

      const n = Number(e.target.value);
      const nn = Number.isFinite(n) ? n : 0;
      if (e.target?.classList?.contains('cld-tpl-min-w')) t.min.w = nn;
      if (e.target?.classList?.contains('cld-tpl-min-h')) t.min.h = nn;
      if (e.target?.classList?.contains('cld-tpl-min-d')) t.min.d = nn;
      if (e.target?.classList?.contains('cld-tpl-max-w')) t.max.w = nn;
      if (e.target?.classList?.contains('cld-tpl-max-h')) t.max.h = nn;
      if (e.target?.classList?.contains('cld-tpl-max-d')) t.max.d = nn;

      if (e.target?.classList?.contains('cld-tpl-name')) syncActiveSelect();

      if (e.target?.classList?.contains('cld-tpl-acc-count')) {
        const row = e.target.closest?.('tr[data-acc-id]');
        const aid = row?.getAttribute?.('data-acc-id');
        if (!aid) return;
        t.accessories = Array.isArray(t.accessories) ? t.accessories : [];
        const a = t.accessories.find(x => x && String(x.id) === String(aid));
        if (!a) return;
        const n2 = Number(e.target.value);
        a.count = (Number.isFinite(n2) && n2 > 0) ? n2 : 1;
      }

      if (
        e.target?.classList?.contains('cld-tpl-min-w') ||
        e.target?.classList?.contains('cld-tpl-min-h') ||
        e.target?.classList?.contains('cld-tpl-min-d') ||
        e.target?.classList?.contains('cld-tpl-max-w') ||
        e.target?.classList?.contains('cld-tpl-max-h') ||
        e.target?.classList?.contains('cld-tpl-max-d')
      ) {
        try { window.__cldClampMainSizeInputs && window.__cldClampMainSizeInputs(); } catch {}
        try { window.__cldFilterVariantsByLimits && window.__cldFilterVariantsByLimits(); } catch {}
      }
    });

    btnAddBottom.addEventListener('click', () => {
      const st = ensureState();
      if (!st) return;
      const tpl = {
        id: 'tpl_' + Math.random().toString(36).slice(2),
        name: '',
        article: '',
        min: { w: 0, h: 0, d: 0 },
        max: { w: 0, h: 0, d: 0 },
        accessories: [],
        constructor_structure: snapshotFromConstructor(),
      };
      st.templates.push(tpl);
      st.selectedTemplateId = tpl.id;
      render();
    });

    if (activeSelect && !activeSelect.__cldBoundTemplates) {
      activeSelect.addEventListener('change', () => {
        const v = String(activeSelect.value || 'auto');
        if (v === 'auto') return;
        setSelected(v);
        loadTemplateIntoConstructor(v);
      });
      activeSelect.__cldBoundTemplates = true;
    }

    window.__CLD_TEMPLATES_RENDER = render;
    render();
  }

  window.initTemplatesTab = initTemplatesTab;

})();
