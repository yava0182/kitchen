/**
 * admin-catalog-item-tabs-variables.js — Вкладка "Переменные" в редакторе элемента каталога
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function initVariablesTab() {
    if (window.__CLD_VARS_TAB_INITIALIZED) {
      try { window.__CLD_VARS_SELECT_ROOT && window.__CLD_VARS_SELECT_ROOT(); } catch {}
      return;
    }
    window.__CLD_VARS_TAB_INITIALIZED = true;

    const groupsHost = document.getElementById('cld-vars-groups');
    const btnApply = document.getElementById('cld-vars-apply-btn');
    const btnReset = document.getElementById('cld-vars-reset-btn');
    const menuBtn = document.getElementById('cld-vars-tree-menu-btn');
    const menu = document.getElementById('cld-vars-context-menu');
    const mAddGroup = document.getElementById('cld-vars-menu-add-group');
    const mAddVar = document.getElementById('cld-vars-menu-add-var');
    const mAddGlobal = document.getElementById('cld-vars-menu-add-global');
    const mEnableAll = document.getElementById('cld-vars-menu-enable-all');
    const mDisableAll = document.getElementById('cld-vars-menu-disable-all');
    const mImport = document.getElementById('cld-vars-menu-import');
    const mCopy = document.getElementById('cld-vars-menu-copy');
    const mPaste = document.getElementById('cld-vars-menu-paste');
    const mDelete = document.getElementById('cld-vars-menu-delete');
    const treeRootItem = document.getElementById('cld-vars-tree-item');
    const treeGroupsHost = document.getElementById('cld-vars-tree-groups');
    const treeToggle = document.getElementById('cld-vars-tree-toggle');

    if (!groupsHost || !btnApply || !btnReset || !menuBtn || !menu) return;

    const getRootNodeData = () => {
      const root = document.getElementById('constructor-root-module');
      if (!root) return null;
      if (!root.nodeData) root.nodeData = { name: '(модуль без названия)' };
      if (!root.nodeData.variables) root.nodeData.variables = {};
      if (!Array.isArray(root.nodeData.variables.groups)) {
        const legacyMain = (root.nodeData.variables.main && typeof root.nodeData.variables.main === 'object')
          ? root.nodeData.variables.main
          : null;
        root.nodeData.variables.groups = [
          {
            id: 'grp_' + Date.now().toString(36),
            name: 'Основные',
            enabled: true,
            vars: [],
            collapsed: false,
          }
        ];
        if (legacyMain) {
          for (const [k, v] of Object.entries(legacyMain)) {
            const key = String(k || '').trim();
            const n = Number(v);
            if (!key || !Number.isFinite(n)) continue;
            root.nodeData.variables.groups[0].vars.push({
              id: 'var_' + Math.random().toString(36).slice(2),
              key,
              value: n,
              enabled: true,
              scope: 'module',
            });
          }
        }
        delete root.nodeData.variables.main;
      }
      if (!root.nodeData.variables._selectedNodeType) root.nodeData.variables._selectedNodeType = 'root';
      if (root.nodeData.variables._treeGroupsCollapsed == null) root.nodeData.variables._treeGroupsCollapsed = false;
      return root.nodeData;
    };

    const RESERVED = new Set(['_wt']);
    const CLIP_KEY = 'cld_vars_clipboard_v1';

    const readUiThickness = () => {
      const el = document.getElementById('catalog-constructor-property-material-thickness');
      const n = Number(el?.value);
      return Number.isFinite(n) ? n : 16;
    };

    const escapeHtml = (s) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const getSelectedGroupId = () => {
      const nd = getRootNodeData();
      const groups = nd?.variables?.groups || [];
      return nd?.variables?._selectedGroupId || groups?.[0]?.id || null;
    };

    const setSelectedGroupId = (id) => {
      const nd = getRootNodeData();
      if (!nd) return;
      nd.variables._selectedGroupId = id;
    };

    const setSelectedNodeType = (t) => {
      const nd = getRootNodeData();
      if (!nd) return;
      nd.variables._selectedNodeType = t;
    };

    const buildFlatEnabledMain = () => {
      const nd = getRootNodeData();
      const out = {};
      for (const g of (nd?.variables?.groups || [])) {
        if (!g || g.enabled === false) continue;
        for (const v of (g.vars || [])) {
          if (!v || v.enabled === false) continue;
          const key = String(v.key || '').trim();
          if (!key || RESERVED.has(key)) continue;
          const cur = Number(v.value);
          const def = Number(v.default);
          const n = Number.isFinite(cur) ? cur : (Number.isFinite(def) ? def : undefined);
          if (!Number.isFinite(n)) continue;
          out[key] = n;
        }
      }
      return out;
    };

    const render = () => {
      const nd = getRootNodeData();
      const groups = Array.isArray(nd?.variables?.groups) ? nd.variables.groups : [];
      const selectedGroupId = getSelectedGroupId();
      if (!selectedGroupId && groups[0]) setSelectedGroupId(groups[0].id);

      const renderValueControl = (v) => {
        const type = v.type || 'number';
        const disabled = (v.fixed === 1 || v.fixed === true);

        if (type === 'select') {
          const options = Array.isArray(v.params?.options) ? v.params.options : [];
          const cur = String(v.value ?? '');
          return `
            <select class="p_input form-control form-control-sm cld-var-control cld-var-val" data-vtype="select" ${disabled ? 'disabled' : ''}>
              ${options.map((o) => `<option value="${escapeHtml(o?.value ?? '')}" ${String(o?.value ?? '') === cur ? 'selected' : ''}>${escapeHtml(o?.name ?? o?.value ?? '')}</option>`).join('')}
            </select>
          `;
        } else if (type === 'boolean') {
          const cur = String(v.value ?? '1');
          return `
            <select class="p_input form-control form-control-sm cld-var-control cld-var-val" data-vtype="boolean" ${disabled ? 'disabled' : ''}>
              <option value="1" ${cur === '1' ? 'selected' : ''}>Да</option>
              <option value="0" ${cur === '0' ? 'selected' : ''}>Нет</option>
            </select>
          `;
        } else {
          const step = v.params?.step ?? 1;
          const min = v.params?.min ?? 1;
          const max = v.params?.max ?? '';
          const cur = (v.value ?? v.default ?? 1);
          return `
            <input type="number" step="${escapeHtml(step)}" min="${escapeHtml(min)}" ${max !== '' ? `max="${escapeHtml(max)}"` : ''} value="${escapeHtml(cur)}"
              class="p_input form-control form-control-sm cld-var-control cld-var-val" data-vtype="number" ${disabled ? 'disabled' : ''} />
          `;
        }
      };

      const renderGroupEditor = (g) => {
        if (!g) return '';
        const vars = Array.isArray(g?.vars) ? g.vars : [];
        const rows = vars.map((v) => {
          const type = v.type || 'number';
          const name = String(v.name || v.key || 'Переменная');
          const key = String(v.key || '');
          const isGlobal = (v.local === 0 || v.local === false || v.scope === 'global');
          return `
            <div class="p_input_group flex_row flex_vcenter"
                 data-group-id="${escapeHtml(g.id)}"
                 data-var-id="${escapeHtml(v.id)}"
                 style="border-bottom:1px solid #eef2f7;">
              <div class="w50" style="display:flex; align-items:center; gap:8px; min-width:0;">
                <input type="checkbox" class="cld-var-enabled" ${v.enabled === false ? '' : 'checked'} />
                <div style="min-width:0;">
                  <div style="font-size:13px; color:#111; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${escapeHtml(name)}
                    ${isGlobal ? `<span style="font-size:11px; color:#6b7280; border:1px solid #e5e7eb; border-radius:999px; padding:1px 6px; margin-left:6px;">global</span>` : ''}
                  </div>
                  <div style="font-size:11px; color:#6b7280;"><code>${escapeHtml(key)}</code></div>
                </div>
              </div>
              <div class="w50" style="display:flex; align-items:center; gap:8px;">
                <div style="flex:1; min-width:0;">${renderValueControl({ ...v, type })}</div>
                <button type="button" class="btn btn-sm btn-white" data-action="edit-var" title="Редактировать">✎</button>
                <button type="button" class="btn btn-sm btn-white" data-action="del-var" title="Удалить">×</button>
              </div>
            </div>
          `;
        }).join('');

        const emptyHint = vars.length
          ? ''
          : `<div style="padding:16px; color:#6b7280; font-size:13px;">Пока нет переменных.</div>`;

        return `
          <div data-group-id="${escapeHtml(g.id)}" style="background:#fff;">
            <div class="p_input_group flex_row flex_vcenter" style="padding:10px 12px; border-bottom:1px solid #e5e7eb;">
              <div class="w50" style="font-size:13px; color:#111; font-weight:600;">Название</div>
              <div class="w50">
                <input type="text" class="form-control form-control-sm cld-group-name" value="${escapeHtml(g.name || 'Группа')}" />
              </div>
            </div>
            <div style="padding:0;">
              ${emptyHint}
              ${rows}
            </div>
          </div>
        `;
      };

      const selected = (nd?.variables?._selectedNodeType || 'root');
      const right = document.getElementById('cld-vars-right');
      const help = document.getElementById('cld-vars-help');
      const buttons = document.getElementById('cld-vars-buttons');

      if (treeGroupsHost) {
        const curType = (nd?.variables?._selectedNodeType || 'root');
        const curGid = getSelectedGroupId();
        const collapsed = !!(nd?.variables?._treeGroupsCollapsed);
        treeGroupsHost.innerHTML = groups.map((g) => {
          const isSel = curType === 'group' && String(curGid) === String(g?.id);
          return `
            <div class="pp-tree-item ${isSel ? 'pp-tree-selected' : ''}"
                 data-vars-node="group"
                 data-group-id="${escapeHtml(g.id)}"
                 style="display:flex; align-items:center; padding-left:28px; cursor:pointer;">
              <span style="margin-left:0px;"></span>
              <span style="margin-left:8px; font-size:13px; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(g.name || 'Группа')}</span>
              <div class="pp-tree-buttons" style="margin-left:auto;">
                <button type="button" class="cld-vars-group-menu-btn" data-group-id="${escapeHtml(g.id)}"><i class="icon icon_menu"></i></button>
              </div>
            </div>
          `;
        }).join('');
        treeGroupsHost.style.display = collapsed ? 'none' : 'block';
        const tgl = document.getElementById('cld-vars-tree-toggle');
        if (tgl) tgl.textContent = collapsed ? '▸' : '▾';
      }

      if (right) right.style.display = 'block';
      if (help) help.style.display = 'none';
      if (buttons) buttons.style.display = 'none';
      if (!groupsHost) return;

      if (selected === 'group') {
        const gid = getSelectedGroupId();
        const g = (groups || []).find((x) => x && String(x.id) === String(gid)) || (groups || [])[0] || null;
        groupsHost.style.display = 'block';
        groupsHost.innerHTML = renderGroupEditor(g);
        return;
      }

      groupsHost.style.display = 'none';
      groupsHost.innerHTML = '';
    };

    const apply = () => {
      const nd = getRootNodeData();
      if (!nd) return;
      nd.variables.main = buildFlatEnabledMain();
      if (window.__CLD_DEBUG) console.log('[CLD][vars] apply', { groups: nd.variables.groups, main: nd.variables.main });
      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
      if (typeof toastr !== 'undefined') toastr.success('Переменные применены');
    };

    const reset = () => {
      const nd = getRootNodeData();
      if (!nd) return;
      nd.variables = {
        groups: [{
          id: 'grp_' + Date.now().toString(36),
          name: 'Основные',
          enabled: true,
          vars: [],
          collapsed: false,
        }],
        main: {},
      };
      render();
      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
      if (typeof toastr !== 'undefined') toastr.info('Переменные сброшены');
    };

    const hasClipboard = () => {
      try { return !!localStorage.getItem(CLIP_KEY); } catch { return false; }
    };

    const setPasteEnabled = () => {
      if (!mPaste) return;
      const ok = hasClipboard();
      if (ok) {
        mPaste.classList.remove('disabled');
        mPaste.style.cursor = 'pointer';
        mPaste.style.opacity = '1';
      } else {
        mPaste.classList.add('disabled');
        mPaste.style.cursor = 'not-allowed';
        mPaste.style.opacity = '.5';
      }
    };

    const closeMenu = () => { menu.style.display = 'none'; };
    const openMenuAt = (x, y) => {
      setPasteEnabled();
      if (mDelete) {
        const nd = getRootNodeData();
        const t = (nd?.variables?._selectedNodeType || 'root');
        mDelete.style.display = (t === 'group') ? 'block' : 'none';
      }
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      menu.style.display = 'block';
    };

    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const r = menuBtn.getBoundingClientRect();
      openMenuAt(Math.round(r.left), Math.round(r.bottom + 6));
    });
    document.addEventListener('click', () => closeMenu());
    menu.addEventListener('click', (e) => e.stopPropagation());

    treeToggle && treeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nd = getRootNodeData();
      if (!nd) return;
      nd.variables._treeGroupsCollapsed = !nd.variables._treeGroupsCollapsed;
      render();
    });

    const addGroup = (name = 'Группа') => {
      const nd = getRootNodeData();
      if (!nd) return;
      const g = {
        id: 'grp_' + Math.random().toString(36).slice(2),
        name,
        enabled: true,
        vars: [],
        collapsed: false,
      };
      nd.variables.groups.push(g);
      setSelectedGroupId(g.id);
      setSelectedNodeType('group');
      render();
    };

    const addVarToGroup = (groupId, opts = {}) => {
      const nd = getRootNodeData();
      const g = (nd?.variables?.groups || []).find((x) => x && x.id === groupId) || (nd?.variables?.groups || [])[0];
      if (!g) return;
      g.vars = Array.isArray(g.vars) ? g.vars : [];
      g.vars.push({
        id: 'var_' + Math.random().toString(36).slice(2),
        key: opts.key || '',
        value: Number.isFinite(Number(opts.value)) ? Number(opts.value) : 0,
        enabled: opts.enabled !== false,
        scope: opts.scope || 'module',
      });
      render();
    };

    const setAllEnabled = (on) => {
      const nd = getRootNodeData();
      for (const g of (nd?.variables?.groups || [])) {
        g.enabled = !!on;
        for (const v of (g.vars || [])) v.enabled = !!on;
      }
      render();
    };

    const copyToClipboard = () => {
      const nd = getRootNodeData();
      const payload = { groups: nd?.variables?.groups || [] };
      try {
        localStorage.setItem(CLIP_KEY, JSON.stringify(payload));
        if (typeof toastr !== 'undefined') toastr.success('Скопировано');
      } catch {
        if (typeof toastr !== 'undefined') toastr.error('Не удалось скопировать');
      }
    };

    const pasteFromClipboard = () => {
      const nd = getRootNodeData();
      try {
        const raw = localStorage.getItem(CLIP_KEY);
        if (!raw) {
          if (typeof toastr !== 'undefined') toastr.warning('Буфер пуст');
          return;
        }
        const parsed = JSON.parse(raw);
        const groups = Array.isArray(parsed?.groups) ? parsed.groups : [];
        nd.variables.groups = groups.map((g) => ({
          id: g.id || ('grp_' + Math.random().toString(36).slice(2)),
          name: g.name || 'Группа',
          enabled: g.enabled !== false,
          collapsed: !!g.collapsed,
          vars: Array.isArray(g.vars) ? g.vars.map((v) => ({
            id: v.id || ('var_' + Math.random().toString(36).slice(2)),
            key: String(v.key || '').trim(),
            value: Number(v.value),
            enabled: v.enabled !== false,
            scope: v.scope || 'module',
          })) : [],
        }));
        setSelectedGroupId(nd.variables.groups?.[0]?.id || null);
        render();
        if (typeof toastr !== 'undefined') toastr.success('Вставлено');
      } catch {
        if (typeof toastr !== 'undefined') toastr.error('Не удалось вставить');
      }
    };

    let __cldVarDebounce = null;
    const VAR_INPUT_DELAY = 500;
    const scheduleSync = () => {
      clearTimeout(__cldVarDebounce);
      __cldVarDebounce = setTimeout(() => {
        const nd = getRootNodeData();
        if (!nd) return;
        nd.variables.main = buildFlatEnabledMain();
        if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
      }, VAR_INPUT_DELAY);
    };

    groupsHost.addEventListener('input', (e) => {
      const gName = e.target?.closest?.('.cld-group-name');
      if (gName) {
        const groupEl = gName.closest?.('[data-group-id]');
        const gid = groupEl?.getAttribute?.('data-group-id');
        if (!gid) return;
        const nd = getRootNodeData();
        const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
        if (!g) return;
        g.name = String(gName.value || '').trim() || 'Группа';
        try {
          const node = treeGroupsHost?.querySelector?.(`[data-vars-node="group"][data-group-id="${CSS.escape(String(gid))}"]`);
          const span = node?.querySelector?.('span[style*="font-size:13px"]') || node?.querySelector?.('span:last-child');
          if (span) span.textContent = g.name;
        } catch {}
        return;
      }

      const en = e.target?.closest?.('.cld-var-enabled');
      if (en) {
        const row = en.closest('[data-var-id]');
        const gid = row?.getAttribute('data-group-id');
        const vid = row?.getAttribute('data-var-id');
        if (!gid || !vid) return;
        const nd = getRootNodeData();
        const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
        const v = g?.vars?.find((x) => x && String(x.id) === String(vid));
        if (!v) return;
        v.enabled = !!en.checked;
        scheduleSync();
        return;
      }

      const ctrl = e.target?.closest?.('.cld-var-control');
      if (!ctrl) return;
      const row = ctrl.closest('[data-var-id]');
      const gid = row?.getAttribute('data-group-id');
      const vid = row?.getAttribute('data-var-id');
      if (!gid || !vid) return;
      const nd = getRootNodeData();
      const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
      const v = g?.vars?.find((x) => x && String(x.id) === String(vid));
      if (!v) return;

      const vtype = ctrl.getAttribute('data-vtype') || v.type || 'number';
      if (vtype === 'number') {
        const min = parseFloat(v.params?.min ?? 1);
        const maxRaw = v.params?.max ?? '';
        const max = maxRaw === '' ? null : parseFloat(maxRaw);
        let val = parseFloat(ctrl.value);
        if (!Number.isFinite(val)) return;
        if (Number.isFinite(min) && val < min) val = min;
        if (Number.isFinite(max) && max != null && val > max) val = max;
        v.value = val;
        ctrl.value = String(val);
        scheduleSync();
      }
    });

    groupsHost.addEventListener('change', (e) => {
      const en = e.target?.closest?.('.cld-var-enabled');
      if (en) {
        const row = en.closest('[data-var-id]');
        const gid = row?.getAttribute('data-group-id');
        const vid = row?.getAttribute('data-var-id');
        if (!gid || !vid) return;
        const nd = getRootNodeData();
        const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
        const v = g?.vars?.find((x) => x && String(x.id) === String(vid));
        if (!v) return;
        v.enabled = !!en.checked;
        nd.variables.main = buildFlatEnabledMain();
        if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        return;
      }

      const ctrl = e.target?.closest?.('.cld-var-control');
      if (!ctrl) return;
      const row = ctrl.closest('[data-var-id]');
      const gid = row?.getAttribute('data-group-id');
      const vid = row?.getAttribute('data-var-id');
      if (!gid || !vid) return;
      const nd = getRootNodeData();
      const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
      const v = g?.vars?.find((x) => x && String(x.id) === String(vid));
      if (!v) return;

      const vtype = ctrl.getAttribute('data-vtype') || v.type || 'number';
      if (vtype === 'select') {
        v.value = String(ctrl.value ?? '');
        nd.variables.main = buildFlatEnabledMain();
        if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
      } else if (vtype === 'boolean') {
        v.value = Number(String(ctrl.value ?? '1')) ? 1 : 0;
        nd.variables.main = buildFlatEnabledMain();
        if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
      }
    });

    const groupModal = document.getElementById('cld-var-group-modal');
    const groupName = document.getElementById('cld-var-group-name');
    const groupCancel = document.getElementById('cld-var-group-cancel');
    const groupSave = document.getElementById('cld-var-group-save');
    const groupClose = document.getElementById('cld-var-group-close');

    const openGroupModal = () => {
      if (!groupModal) return;
      if (groupName) groupName.value = 'Группа';
      groupModal.style.display = 'flex';
      setTimeout(() => { try { groupName?.focus?.(); groupName?.select?.(); } catch {} }, 0);
    };
    const closeGroupModal = () => {
      if (!groupModal) return;
      groupModal.style.display = 'none';
    };
    const saveGroupFromModal = () => {
      const name = String(groupName?.value || '').trim() || 'Группа';
      addGroup(name);
      closeGroupModal();
      apply();
    };

    groupCancel && groupCancel.addEventListener('click', closeGroupModal);
    groupClose && groupClose.addEventListener('click', closeGroupModal);
    groupSave && groupSave.addEventListener('click', saveGroupFromModal);
    groupModal && groupModal.addEventListener('click', (e) => { if (e.target === groupModal) closeGroupModal(); });
    groupName && groupName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveGroupFromModal(); }
      if (e.key === 'Escape') { e.preventDefault(); closeGroupModal(); }
    });

    const varModal = document.getElementById('cld-variable-modal');
    const varMode = document.getElementById('cld-variable-modal-mode');
    const varGroupId = document.getElementById('cld-variable-modal-group-id');
    const varVarId = document.getElementById('cld-variable-modal-var-id');
    const fName = document.getElementById('cld-variable-name');
    const fKey = document.getElementById('cld-variable-key');
    const fShow = document.getElementById('cld-variable-show-in-params');
    const fLocal = document.getElementById('cld-variable-local');
    const fInSizes = document.getElementById('cld-variable-in-size-variants');
    const fLocked = document.getElementById('cld-variable-locked');
    const fType = document.getElementById('cld-variable-type');
    const fDef = document.getElementById('cld-variable-default');
    const fMin = document.getElementById('cld-variable-min');
    const fMax = document.getElementById('cld-variable-max');
    const fStep = document.getElementById('cld-variable-step');
    const fDefSelect = document.getElementById('cld-variable-default-select');
    const fDefBool = document.getElementById('cld-variable-default-boolean');
    const optHost = document.getElementById('cld-variable-options');
    const optAdd = document.getElementById('cld-variable-option-add');
    const typeNumber = document.getElementById('cld-variable-type-number');
    const typeSelect = document.getElementById('cld-variable-type-select');
    const typeBoolean = document.getElementById('cld-variable-type-boolean');
    const btnCancel = document.getElementById('cld-variable-cancel-btn');
    const btnSave = document.getElementById('cld-variable-save-btn');
    const closeX = document.getElementById('cld-variable-close');

    const VAR_PARAMS = {
      number: { min: 1, max: '', step: 1 },
      select: { options: [] },
      boolean: {},
    };

    const translitRu = (s) => {
      const map = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'
      };
      return String(s || '').toLowerCase().split('').map(ch => map[ch] ?? map[ch?.toLowerCase?.()] ?? ch).join('');
    };

    const filterKey = (s) => String(s || '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_');

    const setTypeUi = (t) => {
      const type = (t === 'select' || t === 'boolean') ? t : 'number';
      if (typeNumber) typeNumber.style.display = (type === 'number') ? 'block' : 'none';
      if (typeSelect) typeSelect.style.display = (type === 'select') ? 'block' : 'none';
      if (typeBoolean) typeBoolean.style.display = (type === 'boolean') ? 'block' : 'none';
    };

    const renderOptions = (options) => {
      if (!optHost) return;
      const opts = Array.isArray(options) ? options : [];
      optHost.innerHTML = '';
      if (!opts.length) {
        optHost.innerHTML = `<div style="color:#6b7280; font-size:12px;">Нет опций</div>`;
        return;
      }
      opts.forEach((o, idx) => {
        const row = document.createElement('div');
        row.className = 'p_input_group flex_row flex_vcenter';
        row.style.borderBottom = 'none';
        row.innerHTML = `
          <div class="w50" style="display:flex; gap:8px;">
            <input type="text" class="p_input form-control cld-opt-name" placeholder="Название" value="${escapeHtml(o?.name ?? '')}" />
          </div>
          <div class="w50" style="display:flex; gap:8px;">
            <input type="text" class="p_input form-control cld-opt-val" placeholder="Значение" value="${escapeHtml(o?.value ?? '')}" />
            <button type="button" class="btn btn-sm btn-white cld-opt-del" data-idx="${idx}">×</button>
          </div>
        `;
        optHost.appendChild(row);
      });
    };

    const readOptions = () => {
      if (!optHost) return [];
      const rows = Array.from(optHost.querySelectorAll('.p_input_group'));
      return rows.map((row) => {
        const name = row.querySelector('.cld-opt-name')?.value ?? '';
        const value = row.querySelector('.cld-opt-val')?.value ?? '';
        return { name: String(name), value: String(value) };
      }).filter((o) => String(o.name || '').trim() || String(o.value || '').trim());
    };

    const openVarModal = ({ mode, groupId, scope, varId } = {}) => {
      const nd = getRootNodeData();
      if (!nd || !varModal) return;
      const gid = groupId || getSelectedGroupId();

      varMode.value = mode || 'add';
      varGroupId.value = gid || '';
      varVarId.value = varId || '';

      fName.value = '';
      fKey.value = '';
      fShow.checked = false;
      fLocal.checked = true;
      fInSizes.checked = false;
      fLocked.checked = false;
      fType.value = 'number';
      fDef.value = '1';
      fMin.value = '1';
      fMax.value = '';
      fStep.value = '1';
      if (fDefSelect) fDefSelect.value = '';
      if (fDefBool) fDefBool.value = '1';
      renderOptions([]);
      setTypeUi('number');

      if (varMode.value === 'edit' && varId) {
        const g = (nd.variables.groups || []).find((x) => x && x.id === gid);
        const v = g?.vars?.find((x) => x && String(x.id) === String(varId));
        if (v) {
          fName.value = v.name || '';
          fKey.value = v.key || '';
          fShow.checked = !!(v.editable ?? v.show_in_params);
          fLocal.checked = (v.local === 1 || v.local === true) ? true : (v.scope !== 'global');
          fInSizes.checked = !!(v.variants ?? v.in_size_variants);
          fLocked.checked = !!(v.fixed ?? v.locked);
          fType.value = v.type || 'number';
          const params = v.params || {};
          if (fType.value === 'number') {
            fDef.value = (v.value ?? v.default ?? 1);
            fMin.value = (params.min ?? v.min ?? 1);
            fMax.value = (params.max ?? v.max ?? '');
            fStep.value = (params.step ?? v.step ?? 1);
          } else if (fType.value === 'select') {
            if (fDefSelect) fDefSelect.value = (v.value ?? '');
            renderOptions(params.options || []);
          } else if (fType.value === 'boolean') {
            if (fDefBool) fDefBool.value = String(v.value ?? 1);
          }
          setTypeUi(fType.value);
        }
        btnSave.textContent = 'Сохранить';
      } else {
        fLocal.checked = (scope !== 'global');
        btnSave.textContent = 'Добавить';
      }

      varModal.style.display = 'flex';
      setTimeout(() => fName?.focus(), 0);
    };

    const closeVarModal = () => {
      if (varModal) varModal.style.display = 'none';
    };
    window.closeCldVariableModal = closeVarModal;

    const saveVarFromModal = () => {
      const nd = getRootNodeData();
      if (!nd) return;
      const gid = String(varGroupId.value || '').trim();
      const g = (nd.variables.groups || []).find((x) => x && x.id === gid) || (nd.variables.groups || [])[0];
      if (!g) return;

      const name = String(fName.value || '').trim();
      const key = String(fKey.value || '').trim();
      if (!name) { alert('Введите "Название"'); return; }
      if (!key) { alert('Введите "Ключ"'); return; }
      if (RESERVED.has(key)) { alert('Этот ключ зарезервирован системой'); return; }

      const all = (nd.variables.groups || []).flatMap((gg) => (gg?.vars || []));
      const same = all.find((vv) => vv && String(vv.key) === key && String(vv.id) !== String(varVarId.value || ''));
      if (same) { alert('Переменная с таким ключом уже существует'); return; }

      const type = (fType.value === 'select' || fType.value === 'boolean') ? fType.value : 'number';
      const params = JSON.parse(JSON.stringify(VAR_PARAMS[type] || {}));
      if (type === 'number') {
        params.min = (fMin.value === '' ? 1 : Number(fMin.value));
        params.max = (fMax.value === '' ? '' : Number(fMax.value));
        params.step = (fStep.value === '' ? 1 : Number(fStep.value));
      }
      if (type === 'select') {
        params.options = readOptions();
      }

      const vObj = {
        id: (varMode.value === 'edit' && varVarId.value) ? String(varVarId.value) : ('var_' + Math.random().toString(36).slice(2)),
        name,
        key,
        enabled: true,
        editable: fShow.checked ? 1 : 0,
        local: fLocal.checked ? 1 : 0,
        fixed: fLocked.checked ? 1 : 0,
        variants: fInSizes.checked ? 1 : 0,
        type,
        params,
      };

      if (type === 'number') vObj.value = Number(fDef.value);
      if (type === 'select') vObj.value = String(fDefSelect?.value ?? '');
      if (type === 'boolean') vObj.value = Number(fDefBool?.value ?? 1);

      g.vars = Array.isArray(g.vars) ? g.vars : [];
      if (varMode.value === 'edit') {
        const idx = g.vars.findIndex((x) => x && String(x.id) === String(vObj.id));
        if (idx >= 0) {
          const prev = g.vars[idx] || {};
          vObj.enabled = prev.enabled !== false;
          vObj.value = (prev.value !== undefined && prev.value !== null) ? prev.value : vObj.value;
          g.vars[idx] = { ...prev, ...vObj };
        } else {
          g.vars.push(vObj);
        }
      } else {
        g.vars.push(vObj);
      }

      closeVarModal();
      render();
      apply();
    };

    btnCancel && btnCancel.addEventListener('click', closeVarModal);
    btnSave && btnSave.addEventListener('click', saveVarFromModal);
    closeX && closeX.addEventListener('click', closeVarModal);
    varModal && varModal.addEventListener('click', (e) => {
      if (e.target === varModal) closeVarModal();
    });

    fType && fType.addEventListener('change', () => {
      setTypeUi(fType.value);
      if (fType.value === 'select') renderOptions(readOptions());
    });
    fName && fName.addEventListener('input', () => {
      const cur = String(fKey?.value || '').trim();
      if (cur) return;
      const auto = filterKey(translitRu(fName.value)).toLowerCase().replaceAll(' ', '_');
      if (fKey) fKey.value = auto;
    });
    optAdd && optAdd.addEventListener('click', () => {
      const opts = readOptions();
      opts.push({ name: '', value: '' });
      renderOptions(opts);
    });
    optHost && optHost.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('.cld-opt-del');
      if (!btn) return;
      const idx = Number(btn.getAttribute('data-idx'));
      const opts = readOptions();
      if (Number.isFinite(idx)) opts.splice(idx, 1);
      renderOptions(opts);
    });

    groupsHost.addEventListener('dblclick', (e) => {
      const row = e.target?.closest?.('[data-var-id]');
      const groupEl = e.target?.closest?.('[data-group-id]');
      if (!row || !groupEl) return;
      const gid = groupEl.getAttribute('data-group-id');
      const vid = row.getAttribute('data-var-id');
      if (!gid || !vid) return;
      openVarModal({ mode: 'edit', groupId: gid, varId: vid });
    });

    groupsHost.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const groupEl = btn.closest?.('[data-group-id]');
      const gid = groupEl?.getAttribute?.('data-group-id');
      if (!gid) return;

      const nd = getRootNodeData();
      const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
      if (!g) return;

      if (action === 'select-group') {
        setSelectedGroupId(gid);
        render();
        return;
      }
      if (action === 'add-var') {
        setSelectedGroupId(gid);
        openVarModal({ mode: 'add', groupId: gid, scope: 'module' });
        return;
      }
      if (action === 'toggle-collapse') {
        g.collapsed = !g.collapsed;
        render();
        return;
      }
      if (action === 'del-group') {
        nd.variables.groups = (nd.variables.groups || []).filter((x) => String(x?.id) !== String(gid));
        if (!nd.variables.groups.length) {
          nd.variables.groups = [{
            id: 'grp_' + Date.now().toString(36),
            name: 'Основные',
            enabled: true,
            vars: [],
            collapsed: false,
          }];
        }
        setSelectedGroupId(nd.variables.groups?.[0]?.id || null);
        render();
        apply();
        return;
      }
      if (action === 'del-var') {
        const row = btn.closest?.('[data-var-id]');
        const vid = row?.getAttribute?.('data-var-id');
        if (!vid) return;
        g.vars = (g.vars || []).filter((x) => String(x?.id) !== String(vid));
        render();
        apply();
        return;
      }
      if (action === 'edit-var') {
        const row = btn.closest?.('[data-var-id]');
        const vid = row?.getAttribute?.('data-var-id');
        if (!vid) return;
        openVarModal({ mode: 'edit', groupId: gid, varId: vid });
        return;
      }
    });

    treeRootItem && treeRootItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedNodeType('root');
      render();
    });

    treeGroupsHost && treeGroupsHost.addEventListener('click', (e) => {
      const menuBtnEl = e.target?.closest?.('.cld-vars-group-menu-btn');
      if (menuBtnEl) {
        e.preventDefault();
        e.stopPropagation();
        const gid = menuBtnEl.getAttribute('data-group-id');
        if (gid) {
          setSelectedGroupId(gid);
          setSelectedNodeType('group');
          render();
        }
        const r = menuBtnEl.getBoundingClientRect();
        openMenuAt(Math.round(r.left), Math.round(r.bottom + 6));
        return;
      }
      const el = e.target?.closest?.('[data-vars-node="group"]');
      if (!el) return;
      const gid = el.getAttribute('data-group-id');
      if (!gid) return;
      setSelectedGroupId(gid);
      setSelectedNodeType('group');
      render();
    });

    mAddGroup && mAddGroup.addEventListener('click', () => { closeMenu(); openGroupModal(); });
    mAddVar && mAddVar.addEventListener('click', () => { closeMenu(); openVarModal({ mode: 'add', groupId: getSelectedGroupId(), scope: 'module' }); });
    mAddGlobal && mAddGlobal.addEventListener('click', () => { closeMenu(); openVarModal({ mode: 'add', groupId: getSelectedGroupId(), scope: 'global' }); });
    mEnableAll && mEnableAll.addEventListener('click', () => { closeMenu(); setAllEnabled(true); });
    mDisableAll && mDisableAll.addEventListener('click', () => { closeMenu(); setAllEnabled(false); });
    mImport && mImport.addEventListener('click', () => { closeMenu(); if (typeof toastr !== 'undefined') toastr.info('Импорт из вложенных модулей будет подключён на этапе "Шаблоны/Каталог модулей"'); });
    mCopy && mCopy.addEventListener('click', () => { closeMenu(); copyToClipboard(); setPasteEnabled(); });
    mPaste && mPaste.addEventListener('click', () => {
      if (mPaste.classList.contains('disabled')) return;
      closeMenu();
      pasteFromClipboard();
    });
    mDelete && mDelete.addEventListener('click', () => {
      closeMenu();
      const nd = getRootNodeData();
      if (!nd) return;
      const t = (nd?.variables?._selectedNodeType || 'root');
      if (t !== 'group') return;
      const gid = getSelectedGroupId();
      if (!gid) return;
      nd.variables.groups = (nd.variables.groups || []).filter((x) => String(x?.id) !== String(gid));
      if (!nd.variables.groups.length) {
        nd.variables.groups = [{
          id: 'grp_' + Date.now().toString(36),
          name: 'Основные',
          enabled: true,
          vars: [],
          collapsed: false,
        }];
      }
      setSelectedNodeType('root');
      setSelectedGroupId(nd.variables.groups?.[0]?.id || null);
      render();
      apply();
    });

    btnApply.addEventListener('click', apply);
    btnReset.addEventListener('click', reset);

    window.__CLD_VARS_RENDER = render;
    window.__CLD_VARS_SELECT_ROOT = () => { try { setSelectedNodeType('root'); render(); } catch {} };
    setSelectedNodeType('root');
    render();
  }

  window.initVariablesTab = initVariablesTab;
})();
