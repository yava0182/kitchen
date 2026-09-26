/**
 * Админка: «Управление комнатой 2 → Обклад» — кромкование по ролям деталей.
 */
(function () {
  'use strict';

  const ROOM_STEPS_CONFIG_KEY = 'room_steps_config';
  let activePartKey = null;

  function getPartDisplayLabel(row, partCfg) {
    const reg = getRegistry();
    const n =
      reg && typeof reg.getTrimPartNumber === 'function'
        ? reg.getTrimPartNumber(row.key)
        : null;
    const prefix = n != null ? n + '. ' : '';
    if (partCfg && partCfg.label && String(partCfg.label).trim()) {
      const raw = String(partCfg.label).trim().replace(/^(\d+\.\s*)+/, '');
      return prefix + (raw || row.label || row.key);
    }
    return prefix + (row.label || row.key);
  }

  function getRegistry() {
    return window.__cldTrimPartRegistry || null;
  }

  function getRoomStepsConfig() {
    try {
      const raw = localStorage.getItem(ROOM_STEPS_CONFIG_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (c && typeof c === 'object') return c;
      }
    } catch (e) { /* ignore */ }
    return { steps: [] };
  }

  function saveRoomStepsConfig(config) {
    const reg = getRegistry();
    if (reg && typeof reg.writeRoomStepsConfig === 'function') {
      return reg.writeRoomStepsConfig(config);
    }
    try {
      localStorage.setItem(ROOM_STEPS_CONFIG_KEY, JSON.stringify(config));
      try {
        fetch('/api/room_steps_config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        }).catch(function () {});
      } catch (_) {}
      return true;
    } catch (e) {
      return false;
    }
  }

  function ensureSectionTrimParts(config) {
    const reg = getRegistry();
    if (!config.sectionTrimParts || typeof config.sectionTrimParts !== 'object') {
      config.sectionTrimParts = reg ? reg.getDefaultSectionTrimParts() : {};
    }
    return config;
  }

  function getPartsConfig() {
    const reg = getRegistry();
    if (reg && typeof reg.getSectionTrimPartsConfig === 'function') {
      return reg.getSectionTrimPartsConfig();
    }
    const cfg = ensureSectionTrimParts(getRoomStepsConfig());
    return cfg.sectionTrimParts;
  }

  function setPartsConfig(parts) {
    const cfg = getRoomStepsConfig();
    cfg.sectionTrimParts = parts;
    saveRoomStepsConfig(cfg);
  }

  function getPartRow(key) {
    const parts = getPartsConfig();
    return parts[key] || null;
  }

  function edgesWithAllSides(edges) {
    const reg = getRegistry();
    if (reg && typeof reg.expandTrimPartEdgesAllSides === 'function') {
      return reg.expandTrimPartEdgesAllSides(edges || {});
    }
    const out = {};
    for (let i = 1; i <= 4; i++) {
      const s = edges?.[i] || edges?.[String(i)] || {};
      const th = s.thickness != null && s.thickness !== '' ? s.thickness : 0.8;
      out[i] = { ...s, enabled: true, thickness: th };
    }
    return out;
  }

  function getEffectiveEdges(part) {
    if (!part) return {};
    return part.edgeAllSides === true ? edgesWithAllSides(part.edges) : part.edges || {};
  }

  function setPartRowDone(partKey, done) {
    if (!partKey) return;
    const parts = getPartsConfig();
    const base = parts[partKey] || {};
    parts[partKey] = { ...base, rowDone: !!done };
    setPartsConfig(parts);
  }

  function setPartEdgeAllSides(partKey, on) {
    if (!partKey) return;
    const parts = getPartsConfig();
    const base = parts[partKey] || {};
    parts[partKey] = { ...base, edgeAllSides: !!on };
    setPartsConfig(parts);
    if (partKey === activePartKey) renderEdgeEditor();
    renderPartList();
    if (typeof window.refreshSectionTrimEdges === 'function') {
      try {
        window.refreshSectionTrimEdges();
      } catch (_) {}
    }
  }

  function renderPartList() {
    const list = document.getElementById('room2-obklad-part-list');
    const reg = getRegistry();
    if (!list || !reg) {
      if (list) list.innerHTML = '<p class="text-muted">Загрузка реестра…</p>';
      return;
    }
    const parts = getPartsConfig();
    const rows = reg.TRIM_PART_LIST || [];
    if (!activePartKey && rows.length) activePartKey = rows[0].key;
    window.__room2ObkladActivePartKey = activePartKey;
    list.innerHTML = rows
      .map(function (row) {
        const active = row.key === activePartKey ? ' active' : '';
        const p = parts[row.key];
        const done = !!(p && p.rowDone === true);
        const allSides = !!(p && p.edgeAllSides === true);
        const displayLabel = getPartDisplayLabel(row, p);
        const en = p && p.edges ? countEnabledSides(getEffectiveEdges(p)) : 0;
        return (
          '<div class="room2-obklad-part-row'
          + active
          + (done ? ' is-done' : '')
          + (allSides ? ' is-edge-all' : '')
          + '" data-part-key="'
          + row.key
          + '">'
          + '<label class="room2-obklad-part-edge-all-wrap" title="Со всех сторон кромим (все 4 торца в превью и комнате)">'
          + '<input type="checkbox" class="room2-obklad-part-edge-all" data-part-key="'
          + row.key
          + '"'
          + (allSides ? ' checked' : '')
          + ' aria-label="Со всех сторон: '
          + escapeHtml(displayLabel)
          + '" />'
          + '</label>'
          + '<label class="room2-obklad-part-done-wrap" title="Проверили в комнате — деталь определена">'
          + '<input type="checkbox" class="room2-obklad-part-done" data-part-key="'
          + row.key
          + '"'
          + (done ? ' checked' : '')
          + ' aria-label="Проверено в комнате: '
          + escapeHtml(displayLabel)
          + '" />'
          + '</label>'
          + '<button type="button" class="room2-obklad-part-item" data-part-key="'
          + row.key
          + '"><span class="part-label">'
          + escapeHtml(displayLabel)
          + '</span><span class="part-meta">'
          + (allSides ? '4*' : String(en))
          + '</span></button>'
          + '</div>'
        );
      })
      .join('');
  }

  function countEnabledSides(edges) {
    let n = 0;
    for (let i = 1; i <= 4; i++) {
      const s = edges[i] || edges[String(i)];
      if (s && s.enabled === true) n++;
    }
    return n;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getPreviewProfile(partKey) {
    const reg = getRegistry();
    if (reg && typeof reg.getTrimPartPreviewProfile === 'function') {
      return reg.getTrimPartPreviewProfile(partKey || activePartKey || 'top_plank');
    }
    return null;
  }

  function isSideTrimKey(key) {
    return !!(key && (key.startsWith('side_plank_') || key.startsWith('side_overlay_')));
  }

  function syncGapRow(partKey, preview) {
    const row = document.getElementById('room2-obklad-gap-row');
    const gapInp = document.getElementById('room2-obklad-wall-gap');
    const gapNote = document.getElementById('room2-obklad-gap-note');
    if (!row) return;
    const show = isSideTrimKey(partKey);
    row.style.display = show ? 'flex' : 'none';
    if (!show) return;
    const reg = getRegistry();
    const gap = preview && preview.wallGapMm != null ? preview.wallGapMm : isSideTrimKey(partKey) && partKey.startsWith('side_overlay') ? 50 : 0;
    if (gapInp) gapInp.value = String(gap);
    if (gapNote && reg) {
      const renderKey =
        typeof reg.resolveTrimRoomPartKeyForGap === 'function'
          ? reg.resolveTrimRoomPartKeyForGap(partKey, gap)
          : partKey;
      const overlay = typeof reg.trimNeedsOverlayForGapMm === 'function' && reg.trimNeedsOverlayForGapMm(gap);
      gapNote.textContent = overlay
        ? 'В комнате: накладка «' + renderKey + '» (отступ > ' + (reg.TRIM_ROOM_GAP_THRESHOLD_MM || 5) + ' мм).'
        : 'В комнате: планка «' + renderKey + '» (примыкание ≤ ' + (reg.TRIM_ROOM_GAP_THRESHOLD_MM || 5) + ' мм).';
    }
  }

  function syncPreviewToolbar(partKey) {
    const prof = getPreviewProfile(partKey);
    const hint = document.getElementById('room2-obklad-preview-hint');
    const lw = document.getElementById('room2-obklad-prev-label-w');
    const lh = document.getElementById('room2-obklad-prev-label-h');
    const ld = document.getElementById('room2-obklad-prev-label-d');
    const wInp = document.getElementById('room2-obklad-prev-w');
    const hInp = document.getElementById('room2-obklad-prev-h');
    const dInp = document.getElementById('room2-obklad-prev-d');
    if (prof) {
      if (hint && !hint.dataset.obkladDynamic) {
        hint.textContent = prof.hint || '';
        hint.style.display = prof.hint ? 'block' : 'none';
      }
      if (lw && prof.labels) lw.textContent = prof.labels[0] || 'Размер 1';
      if (lh && prof.labels) lh.textContent = prof.labels[1] || 'Размер 2';
      if (ld && prof.labels) ld.textContent = prof.labels[2] || 'Размер 3';
      const lock = prof.lock || {};
      if (wInp) {
        wInp.readOnly = lock.width != null;
        wInp.title = lock.width != null ? 'Фиксировано в комнате: ' + lock.width + ' мм' : '';
        if (lock.width != null) wInp.value = String(lock.width);
      }
      if (hInp) {
        hInp.readOnly = lock.height != null;
        hInp.title = lock.height != null ? 'Фиксировано: ' + lock.height + ' мм' : '';
        if (lock.height != null) hInp.value = String(lock.height);
      }
      if (dInp) {
        dInp.readOnly = lock.depth != null;
        dInp.title = lock.depth != null ? 'Фиксировано: ' + lock.depth + ' мм' : '';
        if (lock.depth != null) dInp.value = String(lock.depth);
      }
    } else {
      if (wInp) wInp.readOnly = false;
      if (hInp) hInp.readOnly = false;
      if (dInp) dInp.readOnly = false;
    }
  }

  function syncDimInputsFromPart(part, partKey) {
    const reg = getRegistry();
    const pk = partKey || activePartKey;
    let prev = part?.preview || null;
    if (!prev && reg && typeof reg.getTrimPartPreviewProfile === 'function') {
      const prof = reg.getTrimPartPreviewProfile(pk);
      prev = prof.defaults ? { ...prof.defaults } : null;
    }
    if (!prev) prev = { width: 800, height: 16, depth: 600 };
    if (reg && typeof reg.applyPreviewLocks === 'function') {
      prev = reg.applyPreviewLocks(pk, prev);
    }
    const prof = getPreviewProfile(pk);
    const mode = prof && prof.previewToolbarMode;
    const sec = prev.section || {};
    const w = document.getElementById('room2-obklad-prev-w');
    const h = document.getElementById('room2-obklad-prev-h');
    const d = document.getElementById('room2-obklad-prev-d');
    if (mode === 'section') {
      if (w && !w.readOnly) w.value = String(sec.width ?? prev.width ?? 1000);
      if (h && !h.readOnly) h.value = String(sec.height ?? prev.height ?? 2200);
      if (d && !d.readOnly) d.value = String(sec.depth ?? prev.depth ?? 600);
    } else {
      if (w && !w.readOnly) w.value = String(prev.width ?? 800);
      if (h && !h.readOnly) h.value = String(prev.height ?? 16);
      if (d && !d.readOnly) d.value = String(prev.depth ?? 600);
    }
    syncPreviewToolbar(pk);
    syncGapRow(pk, prev);
    const hint = document.getElementById('room2-obklad-preview-hint');
    if (hint && prof && pk && pk.startsWith('side_plank_')) {
      hint.dataset.obkladDynamic = '1';
      hint.textContent =
        (prof.hint || '') +
        ' Превью детали: ' +
        (prev.partWidth ?? 50) +
        ' × ' +
        (prev.partHeight ?? 2200) +
        ' × ' +
        (prev.partDepth ?? 16) +
        ' мм.';
      hint.style.display = 'block';
    } else if (hint) {
      delete hint.dataset.obkladDynamic;
    }
  }

  function readDimsFromToolbar() {
    const w = document.getElementById('room2-obklad-prev-w');
    const h = document.getElementById('room2-obklad-prev-h');
    const d = document.getElementById('room2-obklad-prev-d');
    const gapEl = document.getElementById('room2-obklad-wall-gap');
    const raw = {
      width: w ? Number(w.value) || 800 : 800,
      height: h ? Number(h.value) || 16 : 16,
      depth: d ? Number(d.value) || 600 : 600,
      wallGapMm: gapEl ? Number(gapEl.value) : 0,
    };
    const reg = getRegistry();
    if (reg && typeof reg.buildTrimPreviewState === 'function' && activePartKey) {
      return reg.buildTrimPreviewState(activePartKey, raw);
    }
    if (reg && typeof reg.applyPreviewLocks === 'function' && activePartKey) {
      return reg.applyPreviewLocks(activePartKey, raw);
    }
    return raw;
  }

  function renderEdgeRowHtml(n, edges, lockAllSides) {
    const ed = edges[n] || edges[String(n)] || {};
    const checked = lockAllSides || ed.enabled === true;
    const th = ed.thickness != null ? ed.thickness : 0.8;
    const eid = ed.edge_id != null ? ed.edge_id : '';
    const ename = ed.edge_name || ed.decor_name || '';
    const reg = getRegistry();
    const sideLbl =
      reg && typeof reg.getTrimPartEdgeSideLabel === 'function' && activePartKey
        ? reg.getTrimPartEdgeSideLabel(activePartKey, n)
        : String(n);
    let html = '';
    html += '<div style="margin-bottom:12px; padding:8px; background:#f8f9fa; border-radius:4px;" class="room2-obklad-edge-row" data-edge-num="' + n + '">';
    html += '<div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">';
    html += '<input type="checkbox" class="room2-obklad-edge-enabled" data-edge="' + n + '" id="room2-obklad-edge-' + n + '"'
      + (checked ? ' checked' : '')
      + (lockAllSides ? ' disabled' : '')
      + ' />';
    html += '<label style="font-size:13px; color:#444; cursor:pointer; margin:0; font-weight:500;" for="room2-obklad-edge-' + n + '">'
      + n + ' <span style="font-weight:400;color:#888;">(' + escapeHtml(sideLbl) + ')</span></label>';
    html += '</div>';
    html += '<div class="room2-obklad-edge-details" style="' + (checked ? '' : 'display:none;') + '">';
    html += '<div style="margin-bottom:6px;"><label style="font-size:12px; color:#666; display:block; margin-bottom:4px;">Толщина</label>';
    html += '<input type="number" class="form-control room2-obklad-edge-thickness" data-edge="' + n + '" step="0.1" min="0.2" value="' + th + '" style="width:100%; padding:6px 8px; border-radius:4px; border:1px solid #d0d7e2; font-size:12px; box-sizing:border-box;" /></div>';
    html += '<div style="margin-bottom:6px;"><label style="font-size:12px; color:#666; display:block; margin-bottom:4px;">ID кромки (пусто = шаг 5)</label>';
    html += '<input type="text" class="form-control room2-obklad-edge-id" data-edge="' + n + '" value="' + escapeHtml(String(eid)) + '" style="width:100%; padding:6px 8px; border-radius:4px; border:1px solid #d0d7e2; font-size:12px; box-sizing:border-box;" /></div>';
    html += '<div style="font-size:12px; color:#666; margin-bottom:6px;" class="room2-obklad-edge-name" data-edge="' + n + '">' + (ename ? escapeHtml(ename) : '') + '</div>';
    html += '<button type="button" class="btn btn-sm btn-primary btn-outline room2-obklad-pick-edge" data-edge="' + n + '" style="padding:6px 8px; font-size:12px;">Выбрать</button>';
    html += '</div></div>';
    return html;
  }

  function renderEdgeEditor() {
    const wrap = document.getElementById('room2-obklad-edge-editor');
    if (!wrap || !activePartKey) {
      if (wrap) wrap.innerHTML = '<p class="text-muted" style="font-size:13px;">Выберите деталь слева.</p>';
      return;
    }
    const part = getPartRow(activePartKey) || {};
    const reg = getRegistry();
    const rowDef =
      reg && reg.TRIM_PART_LIST.find(function (r) { return r.key === activePartKey; });
    const label = getPartDisplayLabel(rowDef || { key: activePartKey, label: activePartKey }, part);
    const edgeAllSides = part.edgeAllSides === true;
    const edges = edgeAllSides ? edgesWithAllSides(part.edges) : (part.edges || {});
    syncPreviewToolbar(activePartKey);
    syncDimInputsFromPart(part, activePartKey);

    let html = '';
    html += '<div class="properties-heading">Свойства</div>';
    html += '<div style="margin-bottom:12px;"><label style="font-size:13px; margin-bottom:4px; display:block; color:#666;">Тип</label>';
    html += '<input type="text" class="form-control" readonly value="Деталь обклада" style="width:100%; padding:8px 10px; border-radius:4px; border:1px solid #d0d7e2; font-size:13px; box-sizing:border-box; background:#f9fafb;" /></div>';
    html += '<div style="margin-bottom:12px;"><label style="font-size:13px; margin-bottom:4px; display:block; color:#666;">Название</label>';
    html += '<input type="text" id="room2-obklad-part-label" class="form-control room2-obklad-part-label" value="'
      + escapeHtml(label)
      + '" style="width:100%; padding:8px 10px; border-radius:4px; border:1px solid #d0d7e2; font-size:13px; box-sizing:border-box;" /></div>';
    html += '<div style="margin-bottom:12px;"><label style="font-size:13px; margin-bottom:4px; display:block; color:#666;">Идентификатор</label>';
    html += '<input type="text" class="form-control" readonly value="' + escapeHtml(activePartKey) + '" style="width:100%; padding:8px 10px; border-radius:4px; border:1px solid #d0d7e2; font-size:13px; box-sizing:border-box; font-family:ui-monospace,monospace;" /></div>';

    html += '<div id="catalog-constructor-edges-section" style="margin-bottom:16px; padding-top:16px; border-top:1px solid #e5e7eb;">';
    html += '<div style="margin-bottom:12px;"><label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#444; cursor:pointer;">';
    html += '<input type="checkbox" id="room2-obklad-edge-numbering" ' + (part.edgeNumbering !== false ? 'checked' : '') + ' />';
    html += '<span>Нумерация сторон кромкования</span></label></div>';
    html += '<div id="room2-obklad-edges-list" style="' + (part.edgeNumbering !== false ? '' : 'display:none;') + '">';
    html += '<div style="font-size:13px; font-weight:600; margin-bottom:8px; color:#333;">Кромки</div>';
    for (let n = 1; n <= 4; n++) html += renderEdgeRowHtml(n, edges, edgeAllSides);
    html += '</div></div>';

    wrap.innerHTML = html;
    push3dPreview(readDimsFromToolbar(), edges);
    bindEdgeEditorEvents();
  }

  function push3dPreview(prev, edges) {
    if (typeof window.updateRoom2Obklad3dPreview !== 'function') return;
    const numEl = document.getElementById('room2-obklad-edge-numbering');
    const prof = getPreviewProfile(activePartKey);
    const reg = getRegistry();
    const roomRenderKey = prev.renderPartKey || activePartKey;
    let edgeOri = prof && prof.edgeOrientation ? prof.edgeOrientation : 'f';
    if (reg && typeof reg.getTrimPartEdgeOrientation === 'function') {
      edgeOri = reg.getTrimPartEdgeOrientation(activePartKey);
    }
    syncGapRow(activePartKey, prev);
    window.updateRoom2Obklad3dPreview({
      width: prev.width,
      height: prev.height,
      depth: prev.depth,
      section: prev.section,
      wallGapMm: prev.wallGapMm,
      renderPartKey: roomRenderKey,
      edges: edges,
      edgeNumbering: numEl ? numEl.checked : true,
      partKey: activePartKey,
      previewView: prof ? prof.view : 'front',
      edgeOrientation: edgeOri,
      orientation: edgeOri,
    });
  }

  function collectEditorToPart() {
    const part = getPartRow(activePartKey) || {};
    const stored = getPartRow(activePartKey) || {};
    const reg = getRegistry();
    const row = reg && reg.TRIM_PART_LIST.find(function (r) { return r.key === activePartKey; });
    const labelInp = document.getElementById('room2-obklad-part-label');
    const customLabel = labelInp && labelInp.value.trim();
    part.label = customLabel || (row ? row.label : part.label || activePartKey);
    part.edgeNumbering = !!document.getElementById('room2-obklad-edge-numbering')?.checked;
    part.edges = {};
    for (let n = 1; n <= 4; n++) {
      const en = document.querySelector('.room2-obklad-edge-enabled[data-edge="' + n + '"]');
      const th = document.querySelector('.room2-obklad-edge-thickness[data-edge="' + n + '"]');
      const id = document.querySelector('.room2-obklad-edge-id[data-edge="' + n + '"]');
      const nameEl = document.querySelector('.room2-obklad-edge-name[data-edge="' + n + '"]');
      const side = {
        enabled: !!(en && en.checked),
        thickness: th && th.value !== '' ? Number(th.value) : 0.8,
      };
      if (id && id.value.trim()) {
        side.edge_id = id.value.trim();
        const nm = nameEl && nameEl.textContent ? nameEl.textContent.trim() : '';
        if (nm) {
          side.edge_name = nm;
          side.decor_name = nm;
        }
      }
      part.edges[n] = side;
    }
    part.preview = readDimsFromToolbar();
    const storedFlags = getPartRow(activePartKey) || {};
    if (storedFlags.edgeAllSides === true) part.edgeAllSides = true;
    if (storedFlags.rowDone === true) part.rowDone = true;
    return part;
  }

  function saveActivePart() {
    if (!activePartKey) return;
    const parts = getPartsConfig();
    const prev = parts[activePartKey] || {};
    const next = collectEditorToPart();
    if (prev.edgeAllSides === true) next.edgeAllSides = true;
    if (prev.rowDone === true) next.rowDone = true;
    parts[activePartKey] = next;
    setPartsConfig(parts);
    renderPartList();
    if (typeof window.refreshSectionTrimEdges === 'function') {
      try {
        window.refreshSectionTrimEdges();
      } catch (_) {}
    }
    if (typeof toastr !== 'undefined') toastr.success('Сохранено: ' + activePartKey);
    else alert('Сохранено');
  }

  function bindEdgeEditorEvents() {
    const num = document.getElementById('room2-obklad-edge-numbering');
    if (num && !num._obkladBound) {
      num._obkladBound = true;
      num.addEventListener('change', function () {
        const list = document.getElementById('room2-obklad-edges-list');
        if (list) list.style.display = num.checked ? 'block' : 'none';
        refreshPreviewFromForm();
      });
    }

    document.querySelectorAll('.room2-obklad-edge-enabled').forEach(function (cb) {
      if (cb._obkladBound) return;
      cb._obkladBound = true;
      cb.addEventListener('change', function () {
        const row = cb.closest('.room2-obklad-edge-row');
        const det = row && row.querySelector('.room2-obklad-edge-details');
        if (det) det.style.display = cb.checked ? 'block' : 'none';
        refreshPreviewFromForm();
      });
    });

    document.querySelectorAll('.room2-obklad-edge-thickness').forEach(function (inp) {
      if (inp._obkladBound) return;
      inp._obkladBound = true;
      inp.addEventListener('input', refreshPreviewFromForm);
    });

    const labelInp = document.getElementById('room2-obklad-part-label');
    if (labelInp && !labelInp._obkladBound) {
      labelInp._obkladBound = true;
      labelInp.addEventListener('input', function () {
        renderPartList();
        refreshPreviewFromForm();
      });
    }

    document.querySelectorAll('.room2-obklad-dim').forEach(function (inp) {
      if (inp._obkladBound) return;
      inp._obkladBound = true;
      inp.addEventListener('input', refreshPreviewFromForm);
    });

    const gapInp = document.getElementById('room2-obklad-wall-gap');
    if (gapInp && !gapInp._obkladBound) {
      gapInp._obkladBound = true;
      gapInp.addEventListener('input', refreshPreviewFromForm);
    }

    document.querySelectorAll('.room2-obklad-pick-edge').forEach(function (btn) {
      if (btn._obkladBound) return;
      btn._obkladBound = true;
      btn.addEventListener('click', function () {
        const edgeNum = Number(btn.getAttribute('data-edge')) || 1;
        openEdgePicker(edgeNum);
      });
    });

  }

  function refreshPreviewFromForm() {
    const prev = readDimsFromToolbar();
    const part = collectEditorToPart();
    push3dPreview(prev, getEffectiveEdges(part));
  }

  function openEdgePicker(edgeNum) {
    const modal = document.getElementById('edges-decors-select-modal');
    if (!modal || typeof window.loadEdgesDecors !== 'function') {
      alert('Модальное окно выбора кромки недоступно (откройте админку admin-new.html).');
      return;
    }
    window.__cldEdgesDecorContext = {
      mode: 'room2_obklad',
      partKey: activePartKey,
      edgeNumber: edgeNum,
      catalogType: 'butt_butts',
    };
    window.__room2ObkladOnEdgePicked = function (decorId, variantIndex) {
      const vi = variantIndex != null && Number.isFinite(Number(variantIndex)) ? Number(variantIndex) : 0;
      fetch(
        '/api/catalog/item/butt_butts/' + encodeURIComponent(String(decorId)) + '?t=' + Date.now(),
        { cache: 'no-store' }
      )
        .then(function (r) { return r.json(); })
        .then(function (decor) {
          const id = decor?.id ?? decorId;
          const variants = decor?.edge_variants || decor?.variants || [];
          const v = variants[vi] || variants[0] || null;
          const name = (v?.name || decor?.name || 'Кромка ' + id).toString();
          const th = v?.thickness != null ? v.thickness : parseFloat(decor?.thickness || '0.8') || 0.8;
          const idInp = document.querySelector('.room2-obklad-edge-id[data-edge="' + edgeNum + '"]');
          const thInp = document.querySelector('.room2-obklad-edge-thickness[data-edge="' + edgeNum + '"]');
          const en = document.querySelector('.room2-obklad-edge-enabled[data-edge="' + edgeNum + '"]');
          if (idInp) idInp.value = String(id);
          if (thInp) thInp.value = String(th);
          if (en) en.checked = true;
          const nameEl2 = document.querySelector('.room2-obklad-edge-name[data-edge="' + edgeNum + '"]');
          if (nameEl2) nameEl2.textContent = name;
          const det = document.querySelector('.room2-obklad-edge-row[data-edge-num="' + edgeNum + '"] .room2-obklad-edge-details');
          if (det) det.style.display = 'block';
          refreshPreviewFromForm();
        })
        .catch(function (e) {
          alert('Ошибка загрузки кромки: ' + (e?.message || e));
        });
    };
    if (typeof window.openEdgesDecorsSelectModal === 'function') {
      window.openEdgesDecorsSelectModal();
    } else {
      modal.style.display = 'flex';
      window.loadEdgesDecors();
    }
  }

  function bindPartList() {
    const list = document.getElementById('room2-obklad-part-list');
    if (!list || list._obkladBound) return;
    list._obkladBound = true;
    list.addEventListener('change', function (e) {
      const allCb = e.target.closest('.room2-obklad-part-edge-all');
      if (allCb) {
        e.stopPropagation();
        setPartEdgeAllSides(allCb.getAttribute('data-part-key'), allCb.checked);
        return;
      }
      const doneCb = e.target.closest('.room2-obklad-part-done');
      if (doneCb) {
        e.stopPropagation();
        const key = doneCb.getAttribute('data-part-key');
        setPartRowDone(key, doneCb.checked);
        const row = doneCb.closest('.room2-obklad-part-row');
        if (row) row.classList.toggle('is-done', doneCb.checked);
        return;
      }
    });
    list.addEventListener('click', function (e) {
      if (e.target.closest('.room2-obklad-part-edge-all-wrap, .room2-obklad-part-done-wrap')) return;
      const btn = e.target.closest('.room2-obklad-part-item');
      if (!btn) return;
      const nextKey = btn.getAttribute('data-part-key');
      if (nextKey === activePartKey) return;
      if (activePartKey) saveActivePart();
      activePartKey = nextKey;
      window.__room2ObkladActivePartKey = nextKey;
      renderPartList();
      renderEdgeEditor();
      if (typeof window.initRoom2Obklad3dPreview === 'function') {
        window.initRoom2Obklad3dPreview();
      }
    });
  }

  function saveAllDefaults() {
    const reg = getRegistry();
    if (!reg) return;
    const cfg = getRoomStepsConfig();
    cfg.sectionTrimParts = reg.getDefaultSectionTrimParts();
    saveRoomStepsConfig(cfg);
    renderPartList();
    renderEdgeEditor();
    if (typeof toastr !== 'undefined') toastr.info('Восстановлены заводские схемы обклада');
  }

  function normalizeEndCabinetRule(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const minGapMm = Math.max(6, Math.round(Number(src.minGapMm) || 100));
    let maxGapMm = Math.round(Number(src.maxGapMm) || 1500);
    if (maxGapMm === 600) maxGapMm = 1500;
    if (!(maxGapMm >= minGapMm)) maxGapMm = minGapMm;
    const catIdRaw =
      src.catalogCategoryId != null && String(src.catalogCategoryId).trim() !== ''
        ? src.catalogCategoryId
        : src.defaultItemId;
    return {
      enabled: src.enabled !== false,
      minGapMm: minGapMm,
      maxGapMm: maxGapMm,
      catalogType: String(src.catalogType || '').trim(),
      catalogCategoryId:
        catIdRaw != null && String(catIdRaw).trim() !== '' ? String(catIdRaw).trim() : '',
      catalogFilterTag: String(src.catalogFilterTag || '').trim(),
      label: String(src.label || 'Торцевой шкаф').trim() || 'Торцевой шкаф',
    };
  }

  function loadEndCabinetForm() {
    const rule = normalizeEndCabinetRule(getRoomStepsConfig().endCabinet);
    const en = document.getElementById('room2-endcab-enabled');
    const min = document.getElementById('room2-endcab-min');
    const max = document.getElementById('room2-endcab-max');
    const label = document.getElementById('room2-endcab-label');
    if (en) en.checked = !!rule.enabled;
    if (min) min.value = String(rule.minGapMm);
    if (max) max.value = String(rule.maxGapMm);
    if (label) label.value = rule.label;
  }

  function saveEndCabinetForm() {
    const status = document.getElementById('room2-endcab-status');
    const cfg = getRoomStepsConfig();
    const prev = normalizeEndCabinetRule(cfg.endCabinet);
    const rule = normalizeEndCabinetRule({
      enabled: !!(document.getElementById('room2-endcab-enabled') || {}).checked,
      minGapMm: (document.getElementById('room2-endcab-min') || {}).value,
      maxGapMm: (document.getElementById('room2-endcab-max') || {}).value,
      catalogType: prev.catalogType || 'catalog_41',
      catalogCategoryId: prev.catalogCategoryId,
      catalogFilterTag: prev.catalogFilterTag,
      label: (document.getElementById('room2-endcab-label') || {}).value,
    });
    cfg.endCabinet = rule;
    if (saveRoomStepsConfig(cfg)) {
      if (status) {
        status.textContent = 'Сохранено';
        status.style.color = '#16a34a';
      }
      if (typeof toastr !== 'undefined') toastr.success('Правило торцевого шкафа сохранено');
      return true;
    }
    if (status) {
      status.textContent = 'Ошибка сохранения';
      status.style.color = '#d32f2f';
    }
    return false;
  }

  function bindEndCabinetForm() {
    const btn = document.getElementById('room2-endcab-save');
    if (btn && !btn._endCabBound) {
      btn._endCabBound = true;
      btn.addEventListener('click', function () {
        saveEndCabinetForm();
      });
    }
    loadEndCabinetForm();
  }

  function bindObkladToolbar() {
    var resetCam = document.getElementById('room2-obklad-btn-reset-camera');
    if (resetCam && !resetCam._obkladBound) {
      resetCam._obkladBound = true;
      resetCam.addEventListener('click', function () {
        if (typeof window.resetRoom2Obklad3dPreview === 'function') {
          window.resetRoom2Obklad3dPreview();
        }
      });
    }
  }

  function initRoom2ObkladPanel() {
    if (!getRegistry()) {
      setTimeout(initRoom2ObkladPanel, 80);
      return;
    }
    bindObkladToolbar();
    if (typeof window.initRoom2Obklad3dPreview === 'function') {
      window.initRoom2Obklad3dPreview();
    }
    const cfg = getRoomStepsConfig();
    ensureSectionTrimParts(cfg);
    if (!cfg.endCabinet || typeof cfg.endCabinet !== 'object') {
      cfg.endCabinet = normalizeEndCabinetRule({});
    }
    saveRoomStepsConfig(cfg);
    bindEndCabinetForm();
    bindPartList();
    renderPartList();
    renderEdgeEditor();

    const resetBtn = document.getElementById('room2-obklad-reset-all');
    if (resetBtn && !resetBtn._obkladBound) {
      resetBtn._obkladBound = true;
      resetBtn.addEventListener('click', function () {
        if (confirm('Сбросить все схемы обклада к заводским?')) saveAllDefaults();
      });
    }
    const saveAllBtn = document.getElementById('room2-obklad-save-all');
    if (saveAllBtn && !saveAllBtn._obkladBound) {
      saveAllBtn._obkladBound = true;
      saveAllBtn.addEventListener('click', function () {
        saveActivePart();
        if (typeof toastr !== 'undefined') toastr.success('Настройки обклада сохранены в room_steps_config');
      });
    }
  }

  window.initRoom2ObkladPanel = initRoom2ObkladPanel;

  window.__room2ObkladApplyPickedEdge = function (decorId, partKey, edgeNumber, variantIndex) {
    if (partKey && partKey !== activePartKey) activePartKey = partKey;
    if (typeof window.__room2ObkladOnEdgePicked === 'function') {
      window.__room2ObkladOnEdgePicked(decorId, variantIndex);
    }
    if (typeof window.closeEdgesDecorsSelectModal === 'function') {
      window.closeEdgesDecorsSelectModal();
    }
  };
})();
