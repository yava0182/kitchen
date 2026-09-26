/**
 * admin-catalog-item-tabs-events-params.js — Вкладки "События" и "Параметры" в редакторе элемента каталога
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function initEventsTab() {
    if (window.__CLD_EVENTS_TAB_INITIALIZED) {
      try { window.__CLD_EVENTS_RENDER && window.__CLD_EVENTS_RENDER(); } catch {}
      return;
    }
    window.__CLD_EVENTS_TAB_INITIALIZED = true;

    const host = document.getElementById('cld-events-container');
    if (!host) return;

    const esc = (s) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const collectAllNodes = () => {
      const nodes = [];
      const root = document.getElementById('constructor-root-module');
      if (!root) return nodes;

      const walk = (el, path = '') => {
        if (!el || !el.nodeData) return;
        const name = el.nodeData.name || el.querySelector('.tree-node-name')?.textContent?.trim() || 'Без названия';
        const type = el.getAttribute('data-node-type') || 'unknown';
        const nodeId = el.getAttribute('data-node-id') || '';
        const currentPath = path ? `${path} > ${name}` : name;

        const events = el.nodeData.events || {
          on_before_params: '',
          on_before_build: '',
          on_after_build: '',
          on_drag_end: ''
        };

        nodes.push({
          element: el,
          nodeId,
          type,
          name,
          path: currentPath,
          events: { ...events }
        });

        const children = el.querySelector('.tree-node-children');
        if (children) {
          const childNodes = children.querySelectorAll('.constructor-tree-node');
          childNodes.forEach(child => walk(child, currentPath));
        }
      };

      walk(root, 'Корневой модуль');
      return nodes;
    };

    const render = () => {
      const nodes = collectAllNodes();

      host.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px;">
          <div style="font-size:18px; font-weight:700;">События узлов конструктора</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn btn-white" id="cld-events-refresh">Обновить</button>
            <button type="button" class="btn btn-primary" id="cld-events-apply">Применить изменения</button>
          </div>
        </div>

        <div style="margin-bottom:12px; padding:10px; background:#f0f9ff; border-radius:4px; font-size:12px; color:#1e40af;">
          <strong>События:</strong> JavaScript-код, выполняемый на разных этапах работы с узлом.
          <ul style="margin:6px 0 0 20px; padding:0;">
            <li><code>on_before_params</code> — перед вычислением параметров</li>
            <li><code>on_before_build</code> — перед построением геометрии</li>
            <li><code>on_after_build</code> — после построения геометрии</li>
            <li><code>on_drag_end</code> — после завершения перетаскивания</li>
          </ul>
        </div>

        ${nodes.length ? `
          <div style="overflow:auto; max-height:600px;">
            <table class="table table-bordered table-sm" style="margin:0; min-width:1000px;">
              <thead style="position:sticky; top:0; background:#fff; z-index:10;">
                <tr>
                  <td style="width:200px; font-weight:600;">Узел</td>
                  <td style="width:120px; font-weight:600;">Тип</td>
                  <td style="width:200px; font-weight:600;">on_before_params</td>
                  <td style="width:200px; font-weight:600;">on_before_build</td>
                  <td style="width:200px; font-weight:600;">on_after_build</td>
                  <td style="width:200px; font-weight:600;">on_drag_end</td>
                </tr>
              </thead>
              <tbody>
                ${nodes.map((node, idx) => `
                  <tr data-node-id="${esc(node.nodeId)}" data-node-idx="${idx}">
                    <td>
                      <div style="font-weight:600; font-size:13px;">${esc(node.name)}</div>
                      <div style="font-size:11px; color:#6b7280; margin-top:2px;">${esc(node.path)}</div>
                    </td>
                    <td><code style="font-size:11px;">${esc(node.type)}</code></td>
                    <td>
                      <input
                        type="text"
                        class="form-control form-control-sm cld-event-input"
                        data-event="on_before_params"
                        value="${esc(node.events.on_before_params || '')}"
                        placeholder="код..."
                        style="font-size:11px; font-family:ui-monospace, monospace;"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        class="form-control form-control-sm cld-event-input"
                        data-event="on_before_build"
                        value="${esc(node.events.on_before_build || '')}"
                        placeholder="код..."
                        style="font-size:11px; font-family:ui-monospace, monospace;"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        class="form-control form-control-sm cld-event-input"
                        data-event="on_after_build"
                        value="${esc(node.events.on_after_build || '')}"
                        placeholder="код..."
                        style="font-size:11px; font-family:ui-monospace, monospace;"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        class="form-control form-control-sm cld-event-input"
                        data-event="on_drag_end"
                        value="${esc(node.events.on_drag_end || '')}"
                        placeholder="код..."
                        style="font-size:11px; font-family:ui-monospace, monospace;"
                      />
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div style="padding:40px; text-align:center; color:#6b7280;">Нет узлов в конструкторе. Добавьте элементы во вкладке "Конструктор".</div>'}
      `;

      host.querySelectorAll('.cld-event-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const tr = e.target?.closest?.('tr[data-node-id]');
          if (!tr) return;
          const nodeId = tr.getAttribute('data-node-id');
          const eventName = e.target?.getAttribute('data-event');
          const value = String(e.target?.value || '').trim();

          const nodeEl = nodeId ? document.querySelector(`[data-node-id="${nodeId}"]`) : null;
          if (nodeEl && nodeEl.nodeData && eventName) {
            if (!nodeEl.nodeData.events) nodeEl.nodeData.events = {};
            nodeEl.nodeData.events[eventName] = value;
          }
        });
      });

      host.querySelector('#cld-events-refresh')?.addEventListener('click', () => {
        render();
        if (typeof toastr !== 'undefined') toastr.info('Список обновлён');
      });

      host.querySelector('#cld-events-apply')?.addEventListener('click', () => {
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe();
        }
        if (typeof toastr !== 'undefined') toastr.success('События применены');
      });
    };

    window.__CLD_EVENTS_RENDER = render;
    render();
  }

  function initParamsTab() {
    if (window.__CLD_PARAMS_TAB_INITIALIZED) {
      try { window.__CLD_PARAMS_RENDER && window.__CLD_PARAMS_RENDER(); } catch {}
      return;
    }
    window.__CLD_PARAMS_TAB_INITIALIZED = true;

    const host = document.getElementById('cld-params-container');
    if (!host) return;

    const esc = (s) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const collectAllNodes = () => {
      const nodes = [];
      const root = document.getElementById('constructor-root-module');
      if (!root) return nodes;

      const walk = (el, path = '') => {
        if (!el || !el.nodeData) return;
        const name = el.nodeData.name || el.querySelector('.tree-node-name')?.textContent?.trim() || 'Без названия';
        const type = el.getAttribute('data-node-type') || 'unknown';
        const nodeId = el.getAttribute('data-node-id') || '';
        const currentPath = path ? `${path} > ${name}` : name;

        nodes.push({
          element: el,
          nodeId,
          type,
          name,
          path: currentPath,
          hide_when_filled: el.nodeData.hide_when_filled || false,
          active: el.nodeData.active !== undefined ? el.nodeData.active : true,
          visible: el.nodeData.visible !== undefined ? el.nodeData.visible : true,
          consider_size: el.nodeData.consider_size || false,
          consider_cuts: el.nodeData.consider_cuts || false,
          consider_intersections: el.nodeData.consider_intersections || false,
        });

        const children = el.querySelector('.tree-node-children');
        if (children) {
          const childNodes = children.querySelectorAll('.constructor-tree-node');
          childNodes.forEach(child => walk(child, currentPath));
        }
      };

      walk(root, 'Корневой модуль');
      return nodes;
    };

    const render = () => {
      const nodes = collectAllNodes();

      host.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px;">
          <div style="font-size:18px; font-weight:700;">Параметры узлов конструктора</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn btn-white" id="cld-params-refresh">Обновить</button>
            <button type="button" class="btn btn-primary" id="cld-params-apply">Применить изменения</button>
          </div>
        </div>

        <div style="margin-bottom:12px; padding:10px; background:#f0f9ff; border-radius:4px; font-size:12px; color:#1e40af;">
          <strong>Параметры поведения узлов:</strong>
          <ul style="margin:6px 0 0 20px; padding:0;">
            <li><code>active</code> — узел активен (участвует в построении)</li>
            <li><code>visible</code> — узел видим в 3D</li>
            <li><code>hide_when_filled</code> — скрывать при заполнении</li>
            <li><code>consider_size</code> — учитывать размер при расчётах</li>
            <li><code>consider_cuts</code> — учитывать разрезы</li>
            <li><code>consider_intersections</code> — учитывать пересечения</li>
          </ul>
        </div>

        ${nodes.length ? `
          <div style="overflow:auto; max-height:600px;">
            <table class="table table-bordered table-sm" style="margin:0; min-width:900px;">
              <thead style="position:sticky; top:0; background:#fff; z-index:10;">
                <tr>
                  <td style="width:200px; font-weight:600;">Узел</td>
                  <td style="width:100px; font-weight:600;">Тип</td>
                  <td style="width:100px; font-weight:600; text-align:center;">active</td>
                  <td style="width:100px; font-weight:600; text-align:center;">visible</td>
                  <td style="width:120px; font-weight:600; text-align:center;">hide_when_filled</td>
                  <td style="width:120px; font-weight:600; text-align:center;">consider_size</td>
                  <td style="width:120px; font-weight:600; text-align:center;">consider_cuts</td>
                  <td style="width:140px; font-weight:600; text-align:center;">consider_intersections</td>
                </tr>
              </thead>
              <tbody>
                ${nodes.map((node, idx) => `
                  <tr data-node-id="${esc(node.nodeId)}" data-node-idx="${idx}">
                    <td>
                      <div style="font-weight:600; font-size:13px;">${esc(node.name)}</div>
                      <div style="font-size:11px; color:#6b7280; margin-top:2px;">${esc(node.path)}</div>
                    </td>
                    <td><code style="font-size:11px;">${esc(node.type)}</code></td>
                    <td style="text-align:center;">
                      <input
                        type="checkbox"
                        class="cld-param-checkbox"
                        data-param="active"
                        ${node.active ? 'checked' : ''}
                      />
                    </td>
                    <td style="text-align:center;">
                      <input
                        type="checkbox"
                        class="cld-param-checkbox"
                        data-param="visible"
                        ${node.visible ? 'checked' : ''}
                      />
                    </td>
                    <td style="text-align:center;">
                      <input
                        type="checkbox"
                        class="cld-param-checkbox"
                        data-param="hide_when_filled"
                        ${node.hide_when_filled ? 'checked' : ''}
                      />
                    </td>
                    <td style="text-align:center;">
                      <input
                        type="checkbox"
                        class="cld-param-checkbox"
                        data-param="consider_size"
                        ${node.consider_size ? 'checked' : ''}
                      />
                    </td>
                    <td style="text-align:center;">
                      <input
                        type="checkbox"
                        class="cld-param-checkbox"
                        data-param="consider_cuts"
                        ${node.consider_cuts ? 'checked' : ''}
                      />
                    </td>
                    <td style="text-align:center;">
                      <input
                        type="checkbox"
                        class="cld-param-checkbox"
                        data-param="consider_intersections"
                        ${node.consider_intersections ? 'checked' : ''}
                      />
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div style="padding:40px; text-align:center; color:#6b7280;">Нет узлов в конструкторе. Добавьте элементы во вкладке "Конструктор".</div>'}
      `;

      host.querySelectorAll('.cld-param-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const tr = e.target?.closest?.('tr[data-node-id]');
          if (!tr) return;
          const nodeId = tr.getAttribute('data-node-id');
          const paramName = e.target?.getAttribute('data-param');
          const value = e.target?.checked;

          const nodeEl = nodeId ? document.querySelector(`[data-node-id="${nodeId}"]`) : null;
          if (nodeEl && nodeEl.nodeData && paramName) {
            nodeEl.nodeData[paramName] = value;
          }
        });
      });

      host.querySelector('#cld-params-refresh')?.addEventListener('click', () => {
        render();
        if (typeof toastr !== 'undefined') toastr.info('Список обновлён');
      });

      host.querySelector('#cld-params-apply')?.addEventListener('click', () => {
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe();
        }
        if (typeof toastr !== 'undefined') toastr.success('Параметры применены');
      });
    };

    window.__CLD_PARAMS_RENDER = render;
    render();
  }

  window.initEventsTab = initEventsTab;
  window.initParamsTab = initParamsTab;

})();
