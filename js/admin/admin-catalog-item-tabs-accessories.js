/**
 * admin-catalog-item-tabs-accessories.js — Вкладка "Комплектующие" в редакторе элемента каталога
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function initAccessoriesTab() {
    if (window.__CLD_ACCESSORIES_TAB_INITIALIZED) {
      try { window.__CLD_ACCESSORIES_RENDER && window.__CLD_ACCESSORIES_RENDER(); } catch {}
      return;
    }
    window.__CLD_ACCESSORIES_TAB_INITIALIZED = true;

    const host = document.getElementById('cld-accessories-container');
    if (!host) return;

    let accessoriesLib = window.__cldAccessoriesLib || null;
    const ensureLib = async () => {
      if (accessoriesLib) return accessoriesLib;
      try {
        const r = await fetch('/data/accessories.json', { cache: 'no-store' });
        if (r.ok) {
          accessoriesLib = await r.json();
          window.__cldAccessoriesLib = accessoriesLib;
          return accessoriesLib;
        }
      } catch (e) {
        console.warn('[CLD][accessories] Не удалось загрузить библиотеку из /data/accessories.json:', e);
      }
      accessoriesLib = {
        types: [],
        items: {}
      };
      window.__cldAccessoriesLib = accessoriesLib;
      return accessoriesLib;
    };

    const esc = (s) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const render = async () => {
      const lib = await ensureLib();
      const types = Array.isArray(lib.types) ? lib.types : [];
      const items = lib.items && typeof lib.items === 'object' ? lib.items : {};

      host.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px;">
          <div style="font-size:18px; font-weight:700;">Библиотека комплектующих</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" id="cld-acc-add-type">Добавить тип</button>
            <button type="button" class="btn btn-primary" id="cld-acc-add-item">Добавить комплектующее</button>
            <button type="button" class="btn btn-white" id="cld-acc-export">Экспорт JSON</button>
            <button type="button" class="btn btn-white" id="cld-acc-import">Импорт JSON</button>
            <input id="cld-acc-import-file" type="file" accept=".json,application/json" style="display:none;" />
          </div>
        </div>

        <div style="margin-bottom:20px; padding:12px; background:#f9fafb; border-radius:6px; font-size:13px; color:#6b7280;">
          <strong>Примечание:</strong> Библиотека комплектующих хранится в <code>/data/accessories.json</code>.
          ${!lib || !lib.types || !lib.types.length ? '<br><span style="color:#dc2626;">⚠️ Файл не найден или пуст. Создайте JSON библиотеки (см. ниже).</span>' : ''}
        </div>

        ${types.length ? `
          <div style="margin-bottom:20px;">
            <div style="font-size:14px; font-weight:600; margin-bottom:10px;">Типы комплектующих (${types.length})</div>
            <table class="table table-bordered table-sm" style="margin:0;">
              <thead>
                <tr>
                  <td style="width:60px;">ID</td>
                  <td>Название</td>
                  <td style="width:200px;">Ключ</td>
                  <td style="width:100px;">Элементов</td>
                  <td style="width:140px;"></td>
                </tr>
              </thead>
              <tbody>
                ${types.map((t) => {
                  const typeItems = Array.isArray(items[t.key]) ? items[t.key] : [];
                  return `
                    <tr data-type-key="${esc(t.key)}">
                      <td>${esc(t.id || '')}</td>
                      <td><strong>${esc(t.name || t.key || '')}</strong></td>
                      <td><code>${esc(t.key || '')}</code></td>
                      <td>${typeItems.length}</td>
                      <td style="text-align:right;">
                        <button type="button" class="btn btn-white btn-sm cld-acc-edit-type">Редактировать</button>
                        <button type="button" class="btn btn-white btn-sm cld-acc-del-type">Удалить</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${Object.keys(items).length ? `
          <div>
            <div style="font-size:14px; font-weight:600; margin-bottom:10px;">Все комплектующие</div>
            <div style="overflow:auto; max-height:500px;">
              <table class="table table-bordered table-sm" style="margin:0; min-width:800px;">
                <thead>
                  <tr>
                    <td style="width:80px;">ID</td>
                    <td>Название</td>
                    <td>Артикул</td>
                    <td>Тип</td>
                    <td style="width:100px;">Цена</td>
                    <td style="width:140px;"></td>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(items).flatMap(([typeKey, typeItems]) => {
                    if (!Array.isArray(typeItems)) return [];
                    return typeItems.map((item) => `
                      <tr data-item-id="${esc(item.id)}" data-item-type="${esc(typeKey)}">
                        <td>${esc(item.id || '')}</td>
                        <td><strong>${esc(item.name || '')}</strong></td>
                        <td><code>${esc(item.sku || item.code || '')}</code></td>
                        <td>${esc(typeKey)}</td>
                        <td>${item.price ? esc(Number(item.price).toFixed(2)) : '—'}</td>
                        <td style="text-align:right;">
                          <button type="button" class="btn btn-white btn-sm cld-acc-edit-item">Редактировать</button>
                          <button type="button" class="btn btn-white btn-sm cld-acc-del-item">Удалить</button>
                        </td>
                      </tr>
                    `);
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : '<div style="padding:40px; text-align:center; color:#6b7280;">Нет комплектующих. Добавьте первый элемент.</div>'}

        <div style="margin-top:30px; padding:16px; background:#f9fafb; border-radius:6px; font-size:12px; color:#374151;">
          <strong>Формат JSON библиотеки:</strong>
          <pre style="margin:8px 0 0; padding:12px; background:#fff; border:1px solid #e5e7eb; border-radius:4px; overflow:auto; font-size:11px; line-height:1.4;">{
  "types": [
    { "id": 1, "key": "handles", "name": "Ручки" },
    { "id": 2, "key": "hinges", "name": "Петли" }
  ],
  "items": {
    "handles": [
      { "id": 1, "name": "Ручка круглая", "sku": "H001", "price": 150 },
      { "id": 2, "name": "Ручка квадратная", "sku": "H002", "price": 180 }
    ],
    "hinges": [
      { "id": 1, "name": "Петля стандартная", "sku": "P001", "price": 50 }
    ]
  }
}</pre>
        </div>
      `;

      host.querySelector('#cld-acc-export')?.addEventListener('click', () => {
        const json = JSON.stringify(accessoriesLib, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'accessories.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (typeof toastr !== 'undefined') toastr.success('JSON экспортирован');
      });

      host.querySelector('#cld-acc-import')?.addEventListener('click', () => {
        document.getElementById('cld-acc-import-file')?.click();
      });

      const importFile = document.getElementById('cld-acc-import-file');
      if (importFile && !importFile.__cldBound) {
        importFile.addEventListener('change', async (e) => {
          const f = e.target?.files?.[0];
          if (!f) return;
          try {
            const text = await f.text();
            const parsed = JSON.parse(text);
            if (parsed && (Array.isArray(parsed.types) || parsed.items)) {
              accessoriesLib = parsed;
              window.__cldAccessoriesLib = accessoriesLib;
              if (typeof toastr !== 'undefined') toastr.success('JSON импортирован (в память)');
              render();
            } else {
              alert('Неверный формат JSON');
            }
          } catch (err) {
            alert('Ошибка парсинга JSON: ' + (err?.message || err));
          }
        });
        importFile.__cldBound = true;
      }

      host.querySelector('#cld-acc-add-type')?.addEventListener('click', () => {
        alert('Добавление типа: будет реализовано позже');
      });
      host.querySelector('#cld-acc-add-item')?.addEventListener('click', () => {
        alert('Добавление комплектующего: будет реализовано позже');
      });
    };

    window.__CLD_ACCESSORIES_RENDER = render;
    render();
  }

  window.initAccessoriesTab = initAccessoriesTab;

})();
