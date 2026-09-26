/**
 * Patch loadCatalogItemData to support nested data format (catalog_25)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '..', 'admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace data.X with (_d.X ?? data.X) in the loadCatalogItemData block - simple regex replacements
const replacements = [
  [/\bname: data\.name \|\| ''/g, 'name: (_d.name ?? data.name) || \'\''],
  [/category: Array\.isArray\(data\.category\) \? data\.category : \(data\.category \? \[data\.category\] : \[\]\)/g, 'category: Array.isArray(_d.category) ? _d.category : (Array.isArray(data.category) ? data.category : [])'],
  [/show_in_spec: data\.show_in_spec !== undefined \? String\(data\.show_in_spec\) : '1'/g, 'show_in_spec: (_d.show_in_spec ?? data.show_in_spec) !== undefined ? String(_d.show_in_spec ?? data.show_in_spec) : \'1\''],
  [/include_nested: data\.include_nested !== undefined \? String\(data\.include_nested\) : '1'/g, 'include_nested: (_d.include_nested ?? data.include_nested) !== undefined ? String(_d.include_nested ?? data.include_nested) : \'1\''],
  [/show_in_constructor: data\.show_in_constructor !== undefined \? String\(data\.show_in_constructor\) : '1'/g, 'show_in_constructor: (_d.show_in_constructor ?? data.show_in_constructor) !== undefined ? String(_d.show_in_constructor ?? data.show_in_constructor) : \'1\''],
  [/\border: data\.order \|\| 0\b/g, 'order: _d.order ?? data.order ?? 0'],
  [/\bicon: data\.icon \|\| ''/g, 'icon: (_d.icon ?? data.icon) || \'\''],
  [/\bmodule_group: data\.module_group \|\| 'bottom'/g, 'module_group: (_d.module_group ?? data.module_group) || \'bottom\''],
  [/\bdrag_type: data\.drag_type \|\| 'top'/g, 'drag_type: (_d.drag_type ?? data.drag_type) || \'top\''],
  [/\bstick_type: data\.stick_type \|\| 'common'/g, 'stick_type: (_d.stick_type ?? data.stick_type) || \'common\''],
  [/is_fill: data\.is_fill !== undefined \? String\(data\.is_fill\) : '0'/g, 'is_fill: (_d.is_fill ?? data.is_fill) !== undefined ? String(_d.is_fill ?? data.is_fill) : \'0\''],
  [/no_intersections: data\.no_intersections !== undefined \? String\(data\.no_intersections\) : '0'/g, 'no_intersections: (_d.no_intersections ?? data.no_intersections) !== undefined ? String(_d.no_intersections ?? data.no_intersections) : \'0\''],
  [/\bcatalog_type: data\.catalog_type \|\| ''/g, 'catalog_type: (_d.catalog_type ?? data.catalog_type) || \'\''],
  [/\bwidth: data\.width \|\| 300\b/g, 'width: _d.width ?? data.width ?? 300'],
  [/\bheight: data\.height \|\| 400\b/g, 'height: _d.height ?? data.height ?? 400'],
  [/\bdepth: data\.depth \|\| 200\b/g, 'depth: _d.depth ?? data.depth ?? 200'],
];

let changed = false;
for (const [regex, repl] of replacements) {
  if (content.match(regex)) {
    content = content.replace(regex, repl);
    changed = true;
  }
}

// Fix constructor_structure - use _d when in loadCatalogItemData context
const beforeCon = content;
// Set __CLD_IS_NEW_MODULE = false when loading existing module (so JSON tab can use draft)
if (!content.includes('__CLD_IS_NEW_MODULE = false')) {
  content = content.replace(
    /(async function loadCatalogItemData\(itemId, catalogType\) \{\s*try \{)/,
    "$1\n          if (Number(itemId) > 0) window.__CLD_IS_NEW_MODULE = false;"
  );
  if (content.includes('__CLD_IS_NEW_MODULE = false')) console.log('✅ Patched: __CLD_IS_NEW_MODULE = false when loading module');
}

// JSON таб: отключаем inline-реализацию initJsonTab в admin-new.html,
// чтобы использовать версию из js/admin/admin-catalog-item-tabs-json.js (Clodis).
// Переименовываем функцию, чтобы она не перетирала window.initJsonTab.
if (content.includes('function initJsonTab() {') && !content.includes('legacyInitJsonTab')) {
  content = content.replace('function initJsonTab() {', 'function legacyInitJsonTab() {');
  console.log('✅ Patched: renamed inline initJsonTab to legacyInitJsonTab');
}

// Подключаем наш Clodis-скрипт вкладки JSON, если он ещё не подключен
if (!content.includes('admin-catalog-item-tabs-json.js')) {
  content = content.replace(
    '<script src="/js/admin/admin-catalog-items.js"></script>',
    '<script src="/js/admin/admin-catalog-items.js"></script>\n  <script src="/js/admin/admin-catalog-item-tabs-json.js"></script>'
  );
  console.log('✅ Patched: added admin-catalog-item-tabs-json.js script include');
}

// Подключаем файлы синхронизации превью после admin-constructor.js
const previewScripts = [
  '/js/admin/admin-clodis-preview-size.js',
  '/js/admin/admin-clodis-preview-tree.js',
  '/js/admin/admin-clodis-preview-template-tree.js',
  '/js/admin/admin-clodis-preview-vars-materials.js',
  '/js/admin/admin-clodis-preview-sync-debounce.js',
  '/js/admin/admin-clodis-preview-sync.js', // Главная функция синхронизации
];
for (const scriptPath of previewScripts) {
  const scriptName = scriptPath.split('/').pop();
  if (!content.includes(scriptName)) {
    content = content.replace(
      '<script src="/js/admin/admin-constructor.js"></script>',
      `<script src="/js/admin/admin-constructor.js"></script>\n  <script src="${scriptPath}"></script>`
    );
    console.log(`✅ Patched: added ${scriptName} script include`);
  }
}

// Обновляем вызов initJsonTab при переключении вкладок:
// используем глобальную window.initJsonTab, если она определена.
if (content.includes('setTimeout(() => initJsonTab(), 0);') && !content.includes('window.initJsonTab && window.initJsonTab()')) {
  content = content.replace(
    'setTimeout(() => initJsonTab(), 0);',
    'setTimeout(() => { if (typeof window.initJsonTab === \'function\') window.initJsonTab(); }, 0);'
  );
  console.log('✅ Patched: updated initJsonTab call to use window.initJsonTab');
}

// Некоторые старые inline-скрипты ожидают функцию loadItemSettings (реферальная логика
// "Выгрузить настройки в конструктор"). В Clodis пока нет реализации, поэтому добавляем
// безопасный заглушечный handler, чтобы не было ошибок в консоли.
if (!content.includes('window.loadItemSettings')) {
  const stub = `
    <script>
      window.loadItemSettings = window.loadItemSettings || function() {
        try { console.log('[Clodis] loadItemSettings stub called'); } catch (e) {}
      };
    </script>
  </body>`;
  content = content.replace('</body>', stub);
  console.log('✅ Patched: added Clodis loadItemSettings stub');
}

// Аналогично для loadClientsOrders (реферальный список заявок на расчёт) —
// чтобы не мешал работе конструктора, добавляем безопасную заглушку.
if (!content.includes('window.loadClientsOrders')) {
  const stubOrders = `
    <script>
      window.loadClientsOrders = window.loadClientsOrders || function() {
        try { console.log('[Clodis] loadClientsOrders stub called'); } catch (e) {}
      };
    </script>
  </body>`;
  content = content.replace('</body>', stubOrders);
  console.log('✅ Patched: added Clodis loadClientsOrders stub');
}
content = content.replace('if (data.constructor_structure && typeof window.loadConstructorTreeFromJSON', 'if ((_d.constructor_structure ?? data.constructor_structure) && typeof window.loadConstructorTreeFromJSON');
content = content.replace('window.loadConstructorTreeFromJSON(data.constructor_structure);', 'window.loadConstructorTreeFromJSON(_d.constructor_structure ?? data.constructor_structure);');

// Fix: call loadCatalogItemData when Vue app is first created (itemId > 0)
// Without this, data is never loaded on first open of edit form
// Pattern: after "if (!window.catalogItemVueApp)" we have initCatalogItemVue(); } else {
// We need to add loadCatalogItemData call between initCatalogItemVue and } else {
const firstOpenPatch = /(if \(!window\.catalogItemVueApp\) \{\s*initCatalogItemVue\(catalogType, catalogName\);\s*)(\} else \{)/;
if (firstOpenPatch.test(content)) {
  // Check if we already added loadCatalogItemData right after initCatalogItemVue (in first branch)
  const alreadyPatched = /initCatalogItemVue\(catalogType, catalogName\);\s*if \(itemId > 0\)/.test(content);
  if (!alreadyPatched) {
    content = content.replace(firstOpenPatch, '$1if (itemId > 0) {\n              loadCatalogItemData(itemId, catalogType);\n            }\n          $2');
    console.log('✅ Patched: loadCatalogItemData called on first open');
  }
}

// Fix: ensure initConstructorTab runs before loadConstructorTreeFromJSON
// loadConstructorTreeFromJSON is defined inside initConstructorTab, so we must run it first
const treeLoadOld = 'if ((_d.constructor_structure ?? data.constructor_structure) && typeof window.loadConstructorTreeFromJSON === \'function\') {\n              setTimeout(() => {';
const treeLoadNew = 'if ((_d.constructor_structure ?? data.constructor_structure)) {\n              const doLoad = () => {\n                if (typeof window.__cldInitConstructorTab === \'function\') window.__cldInitConstructorTab();\n                if (typeof window.loadConstructorTreeFromJSON === \'function\') {\n                  window.loadConstructorTreeFromJSON(_d.constructor_structure ?? data.constructor_structure);\n                }\n              };\n              setTimeout(doLoad, 150);';
const treeLoadOld2 = 'if ((_d.constructor_structure ?? data.constructor_structure) && typeof window.loadConstructorTreeFromJSON === \'function\') {\n              setTimeout(() => {\n                window.loadConstructorTreeFromJSON(_d.constructor_structure ?? data.constructor_structure);\n              }, 100);';
// Ensure initConstructorTab runs before loadConstructorTreeFromJSON (tree load needs constructor tab init)
const treeBlock = 'if ((_d.constructor_structure ?? data.constructor_structure) && typeof window.loadConstructorTreeFromJSON === \'function\') {\n              setTimeout(() => {\n                window.loadConstructorTreeFromJSON(_d.constructor_structure ?? data.constructor_structure);\n              }, 100);';
const treeBlockNew = 'if ((_d.constructor_structure ?? data.constructor_structure)) {\n              const doLoad = () => {\n                if (typeof window.__cldInitConstructorTab === \'function\') window.__cldInitConstructorTab();\n                if (typeof window.loadConstructorTreeFromJSON === \'function\') window.loadConstructorTreeFromJSON(_d.constructor_structure ?? data.constructor_structure);\n              };\n              setTimeout(doLoad, 300);';
if (content.includes(treeBlock) && !content.includes('__cldInitConstructorTab')) {
  content = content.replace(treeBlock, treeBlockNew);
  console.log('✅ Patched: initConstructorTab before loadConstructorTreeFromJSON');
} else if (content.includes('window.loadConstructorTreeFromJSON(_d.constructor_structure ?? data.constructor_structure);') && !content.includes('__cldLoadTreeRetry')) {
  // Use retry: loadConstructorTreeFromJSON is created by initConstructorTab — may not exist yet
  const newCall = `              const __cldTreeData = _d.constructor_structure ?? data.constructor_structure;
              const __cldLoadTreeRetry = (n) => {
                if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
                if (typeof window.loadConstructorTreeFromJSON === 'function') {
                  window.loadConstructorTreeFromJSON(__cldTreeData);
                } else if (n < 20) { setTimeout(() => __cldLoadTreeRetry(n + 1), 80); }
              };
              setTimeout(() => __cldLoadTreeRetry(0), 150);`;
  // Match setTimeout block (with optional preceding comment)
  const regex = /(\s*\/\/[^\n]*\n)?\s*setTimeout\(\(\) => \{\s*window\.loadConstructorTreeFromJSON\(_d\.constructor_structure \?\? data\.constructor_structure\);\s*\}, \d+\);/;
  content = content.replace(regex, (_, comment) => (comment || '') + newCall);
  if (content.includes('__cldLoadTreeRetry')) console.log('✅ Patched: loadConstructorTreeFromJSON with retry');
}

// Export initConstructorTab so loadCatalogItemData can call it
// Add assignment at start of initConstructorTab - when it's first called (from tab click or our doLoad), it will be available
if (!content.includes('window.__cldInitConstructorTab')) {
  content = content.replace('function initConstructorTab() {\n        if (window.__CLD_CONSTRUCTOR_INITIALIZED) return;', 'function initConstructorTab() {\n        window.__cldInitConstructorTab = initConstructorTab;\n        if (window.__CLD_CONSTRUCTOR_INITIALIZED) return;');
  console.log('✅ Patched: export initConstructorTab');
}

// Pre-initialize constructor tab when Edit page loads (even on Основные tab) - so loadConstructorTreeFromJSON is available
if (content.includes('initConstructorTab(), 100)') && !content.includes('try { initConstructorTab(); } catch(e){}')) {
  content = content.replace('setTimeout(() => initConstructorTab(), 100);\n        }', 'setTimeout(() => initConstructorTab(), 100);\n        } else {\n          setTimeout(() => { try { initConstructorTab(); } catch(e){} }, 150);\n        }');
  console.log('✅ Patched: pre-init constructor tab');
}

// Fix: при «Добавить» (itemId=0) очищаем дерево, черновик JSON и textarea вкладки JSON
  const newItemClearBlock = `window.__CLD_IS_NEW_MODULE = true;
            if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
            if (typeof window.loadConstructorTreeFromJSON === 'function') window.loadConstructorTreeFromJSON(null);
            try { localStorage.removeItem('cld:json_tab:draft'); } catch(e){}
            var __jt = document.getElementById('catalog-item-json-textarea'); if (__jt) __jt.value = '';
            window.__CLD_JSON_TAB_INITIALIZED = false;`;
// Случай 1: Ещё не патчили — добавляем весь блок
if (!content.includes("localStorage.removeItem('cld:json_tab:draft')")) {
  const re = /(stick_type:\s*'common',\s*\n\s*is_fill:\s*'0',\s*\n\s*width:\s*300,[\s\S]*?depth:\s*200\s*\n\s*\}\s*;\s*\n)(\s*\}\s*\n\s*\})/;
  if (re.test(content)) {
    const before = content;
    content = content.replace(re, '$1' + newItemClearBlock + '\n            $2');
    if (content !== before) console.log('✅ Patched: clear tree and JSON draft when adding new module');
  }
} else if (!content.includes("__jt = document.getElementById('catalog-item-json-textarea')")) {
  // Случай 2: Уже патчили, но без очистки textarea — добавляем в блок нового модуля
  const re = /(loadConstructorTreeFromJSON\(null\);\s*\n\s*)try \{ localStorage\.removeItem\('cld:json_tab:draft'\); \} catch\(e\)\{\}/;
  if (re.test(content)) {
    content = content.replace(re, '$1try { localStorage.removeItem(\'cld:json_tab:draft\'); } catch(e){}\n            var __jt = document.getElementById(\'catalog-item-json-textarea\'); if (__jt) __jt.value = \'\';');
    console.log('✅ Patched: clear JSON textarea when adding new module');
  }
}
// Добавляем сброс __CLD_JSON_TAB_INITIALIZED если ещё нет
if (content.includes("__jt.value = ''") && !content.includes('__CLD_JSON_TAB_INITIALIZED = false')) {
  content = content.replace(
    /(var __jt = document\.getElementById\('catalog-item-json-textarea'\); if \(__jt\) __jt\.value = '';)/,
    "$1\n            window.__CLD_JSON_TAB_INITIALIZED = false;"
  );
  if (content.includes('__CLD_JSON_TAB_INITIALIZED = false')) console.log('✅ Patched: reset JSON tab init flag');
}
// Добавляем __CLD_IS_NEW_MODULE = true в блок нового модуля (если ещё нет)
if (content.includes('loadConstructorTreeFromJSON(null)') && !content.includes('__CLD_IS_NEW_MODULE = true')) {
  content = content.replace(
    /(}\s*;\s*\n)(if \(typeof window\.__cldInitConstructorTab === 'function'\) window\.__cldInitConstructorTab\(\);\s*\n\s*if \(typeof window\.loadConstructorTreeFromJSON === 'function'\) window\.loadConstructorTreeFromJSON\(null\);)/,
    "$1window.__CLD_IS_NEW_MODULE = true;\n            $2"
  );
  if (content.includes('__CLD_IS_NEW_MODULE = true')) console.log('✅ Patched: __CLD_IS_NEW_MODULE = true for new module');
}

// Remove debug log from __cldLoadTreeRetry if present
if (content.includes('loadConstructorTreeFromJSON вызван')) {
  content = content.replace(
    'window.loadConstructorTreeFromJSON(__cldTreeData);\n                  console.log(\'[CLD] loadConstructorTreeFromJSON вызван, tree:\', __cldTreeData?.type, __cldTreeData?.children?.length);\n                } else if (n < 20)',
    'window.loadConstructorTreeFromJSON(__cldTreeData);\n                } else if (n < 20)'
  );
}

// Add [Шкаф] logs for loadCatalogItemData — what appears when editing
if (!content.includes('[Шкаф] loadCatalogItemData')) {
  const logStr = `console.log('[Шкаф] loadCatalogItemData:', itemId, catalogType);
            console.log('[Шкаф] API ответ data:', data);
            if (_d) {
              console.log('[Шкаф] _d (источник):', { 
                name: _d.name, 
                width: _d.width, 
                height: _d.height, 
                depth: _d.depth, 
                hasConstructor: !!(_d.constructor_structure ?? data.constructor_structure),
                constructor_structure_type: typeof (_d.constructor_structure ?? data.constructor_structure),
                constructor_structure_isArray: Array.isArray(_d.constructor_structure ?? data.constructor_structure),
                constructor_structure_keys: _d.constructor_structure && typeof _d.constructor_structure === 'object' ? Object.keys(_d.constructor_structure).slice(0, 10) : [],
                constructor_structure_sample: JSON.stringify(_d.constructor_structure ?? data.constructor_structure).substring(0, 500),
              });
            }
            console.log('[Шкаф] Применено в форму item:', window.catalogItemVueApp?.item);
            `;
  // Match: depth line, }; optional comment, then if ((_d.constructor_structure... (Windows \r\n)
  const re = /(depth: _d\.depth \?\? data\.depth \?\? 200)\s*\}\s*;\s*(\/\/[^\r\n]*[\r\n]+\s*)?(if \(\(_d\.constructor_structure \?\? data\.constructor_structure\)\s*\) \{)/;
  const beforeReplace = content;
  content = content.replace(re, `$1\n            };\n            ${logStr}$2$3`);
  if (content !== beforeReplace) {
    console.log('✅ Patched: [Шкаф] logs for loadCatalogItemData');
  } else if (!content.includes('[Шкаф]')) {
    console.log('⚠️ [Шкаф] patch: regex did not match');
  }
}

// Strip verbose console.log (keep console.error, important console.warn)
const stripLogs = [
  [/^\s*console\.log\([^;]*\[CLD\]\[preview-sync\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[thickness-dbg\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[PREVIEW\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[LAYOUT\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[init\] [^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[tabs\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[material\] ✅[^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[material\] 🔵[^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[material\] Открываем[^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[material\] Выбираем[^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[material\] Материал выбран[^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[material\]\[dbg\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[material\]\[ui-change\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[material\]\[patch\] заполняем[^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\('\[CLD\]\[init\] Вкладка "Конструктор" инициализирована'\);\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[create\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[detail\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[admin\] update3DVisibility[^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[handlers\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[edge\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[modal\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[accessories\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[accessories-library\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[CLD\]\[export\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\([^;]*\[INIT\][^;]*;\s*\n/gm, ''],
  [/^\s*console\.log\('✅ [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('📋 [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('🖱️ [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('👁️ [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('📦 [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('📡 [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('🌐 [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('💾 [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('🔍 [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('➕ [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('🗑️ [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('📍 [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('ℹ️ [^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('=== Проверка Three[^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('========================'\);\s*\n/gm, ''],
  [/^\s*console\.log\('✅ Дерево конструктора восстановлено из JSON'\);\s*\n/gm, ''],
  [/^\s*console\.log\('📦 \\[JSON\\] Обнаружен формат[^']*'[^;]*\);\s*\n/gm, ''],
  [/^\s*console\.log\('✅ \\[PP\\] iframe preview boot'\);\s*\n/gm, ''],
];
for (const [re, repl] of stripLogs) {
  content = content.replace(re, repl);
}

// Preview sync: возвращаем исходное поведение — превью берёт дерево из DOM
// через __ppBuildClodisTemplateTreeFromDom, чтобы полностью совпадать с деревом слева.
const previewRe = /          const childrenRoot = document.getElementById\('constructor-root-module-children'\);\r?\n          let tree = \[];\r?\n          try \{\r?\n            if \(typeof window.getConstructorTreeJSON === 'function'\) \{\r?\n              const full = window.getConstructorTreeJSON\(\) \|\| \{};\r?\n              const tpl = Array\.isArray\(full.spec\?\.template\?\.tree\)\r?\n                \? full.spec.template.tree\r?\n                : \(Array.isArray\(full.template\?\.structure\) \? full.template.structure : \[]\);\r?\n              tree = Array\.isArray\(tpl\) \? tpl : \[];\r?\n            \} else \{\r?\n              tree = childrenRoot \? __ppBuildClodisTemplateTreeFromDom\(childrenRoot\) : \[];\r?\n            \}\r?\n          \} catch \(e\) \{\r?\n            console\.warn\('\[CLD\]\[preview\] Не удалось получить template.structure, fallback к DOM:', e\);\r?\n            tree = childrenRoot \? __ppBuildClodisTemplateTreeFromDom\(childrenRoot\) : \[];\r?\n          \}\r?\n          const hasTree = Array\.isArray\(tree\) && tree.length > 0;/;
if (previewRe.test(content)) {
  const previewOld = `          const childrenRoot = document.getElementById('constructor-root-module-children');
          const tree = childrenRoot ? __ppBuildClodisTemplateTreeFromDom(childrenRoot) : [];
          const hasTree = Array.isArray(tree) && tree.length > 0;`;
  content = content.replace(previewRe, previewOld);
  console.log('✅ Patched: preview back to DOM-based tree (__ppBuildClodisTemplateTreeFromDom)');
}

// Patch __ppBuildClodisTemplateTreeFromDom to handle facade and module types
const facadeModulePatch = /(if \(originalType === 'model' \|\| originalType === 'furniture'\) \{[\s\S]*?return result; \/\/ возвращаем сразу, не добавляем поля для обычных деталей\s*\})/;
if (facadeModulePatch.test(content)) {
  const facadeModuleReplacement = `$1
              
              // ⭐ ФАСАДЫ: facade в Clodis — это фасады (двери, цоколь, топ и т.п.)
              if (originalType === 'facade') {
                result.type = 'facade'; // сохраняем исходный тип
                // Фасады имеют spec.id (ID фасада из библиотеки) и spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                result.pos = nodeData.position || { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                result.size = nodeData.size || { x: '', y: '', z: '' };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // возвращаем сразу, не добавляем поля для обычных деталей
              }
              
              // ⭐ МОДУЛИ: module в Clodis — это готовые элементы (двери, опоры и т.п.)
              if (originalType === 'module') {
                result.type = 'module'; // сохраняем исходный тип
                // Модули имеют spec.id (ID модуля из библиотеки) и spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                result.pos = nodeData.position || { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                result.size = nodeData.size || { x: '', y: '', z: '' };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // возвращаем сразу, не добавляем поля для обычных деталей
              }`;
  content = content.replace(facadeModulePatch, facadeModuleReplacement);
  console.log('✅ Patched: added facade and module handling in __ppBuildClodisTemplateTreeFromDom');
  changed = true;
}

// Patch typeMapping в openAddElementModal — добавляем attachment_point
if (content.includes("'information': 'detail'") && !content.includes("'attachment_point': 'detail'")) {
  content = content.replace(
    /'information': 'detail'\s*\n\s*\}/,
    "'information': 'detail',\n              'attachment_point': 'detail'\n            }"
  );
  if (content.includes("'attachment_point': 'detail'")) console.log('✅ Patched: typeMapping + attachment_point');
}

if (changed || content !== beforeCon) {
  fs.writeFileSync(filePath, content);
  console.log('✅ Patched loadCatalogItemData');
} else {
  console.log('⚠️ No replacements made');
}
