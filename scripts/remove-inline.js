import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '..', 'admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

// Remove materialsKeysPagination
let start = content.indexOf('    // Состояние пагинации для материалов');
let end = content.indexOf('    // ============================================\n    // Список элементов материала (materials-items)');
if (start >= 0 && end > start) {
  const before = content.substring(0, start);
  const after = content.substring(end);
  content = before + '    // materialsKeysPagination - admin-materials-keys.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed materialsKeysPagination');
}

// Remove loadMaterialsKeys through saveMaterialKey
content = fs.readFileSync(filePath, 'utf8');
start = content.indexOf('    // Загрузка материалов для таблицы "Список материалов"');
end = content.indexOf('    // ============================================\n    // Функции для работы с наборами кромок (edges_keys)');
if (start >= 0 && end > start) {
  const lineStart = content.lastIndexOf('\n', start) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(end);
  content = before + '    // materials_keys functions - admin-materials-keys.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed materials-keys functions');
}

// Remove materials-items block
content = fs.readFileSync(filePath, 'utf8');
start = content.indexOf('// Список элементов материала (materials-items)');
if (start >= 0) {
  const lineStart = content.lastIndexOf('\n', start - 1) + 1;
  const prevLine = content.lastIndexOf('\n', Math.max(0, lineStart - 2)) + 1;
  if (prevLine >= 0 && content.substring(prevLine, prevLine + 50).includes('// ===')) start = prevLine;
  else start = lineStart;
}
end = content.indexOf('    // materials_keys functions - admin-materials-keys.js');
if (start >= 0 && end > start) {
  const lineStart = content.lastIndexOf('\n', start) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(end);
  content = before + '    // materials-items functions - admin-materials-items.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed materials-items functions');
}

// Remove edges_keys block (edgesKeysPagination through updateEdgesSubmenu, openEdgeKeyEdit, loadEdgesKeys)
content = fs.readFileSync(filePath, 'utf8');
start = content.indexOf('    // ============================================\n    // Функции для работы с наборами кромок (edges_keys)');
end = content.indexOf('    // Категории (дерево) — общий компонент для разных типов (по умолчанию: кромки butts_keys)');
if (start >= 0 && end > start) {
  const lineStart = content.lastIndexOf('\n', start) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(end);
  content = before + '    // edges_keys functions - admin-edges-keys.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed edges_keys functions');
}

// Remove edges-items block
content = fs.readFileSync(filePath, 'utf8');
start = content.indexOf('    // ============================================\n    // Список кромок в наборе (edges-items) — по референсу butt_butts');
end = content.indexOf('    // ============================================\n    // Каталог 3D моделей: Список 3D Моделей (cabinet_model)');
if (start >= 0 && end > start) {
  const lineStart = content.lastIndexOf('\n', start) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(end);
  content = before + '    // edges-items functions - admin-edges-items.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed edges-items functions');
}

// Remove global-vars block
content = fs.readFileSync(filePath, 'utf8');
start = content.indexOf('    // ============================================\n    // Функции для работы с глобальными переменными');
end = content.indexOf('    // renderCatalogTypesTable, renderCatalogTypesPagination, updateCatalogSubmenu — в admin-catalog-types.js');
if (start >= 0 && end > start) {
  const lineStart = content.lastIndexOf('\n', start) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(end);
  content = before + '    // global-vars functions - admin-global-vars.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed global-vars functions');
}

// Remove loadCatalogItems block
content = fs.readFileSync(filePath, 'utf8');
start = content.indexOf('    // Загрузка элементов каталога для таблицы (по референсу: /catalog/items/{controller_name})');
end = content.indexOf('    // Загрузка заявок для таблицы "Заявки на расчет"');
if (start >= 0 && end > start) {
  const lineStart = content.lastIndexOf('\n', start) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(end);
  content = before + '    // loadCatalogItems - admin-catalog-items.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed loadCatalogItems');
}

// Remove loadClientsOrders block
content = fs.readFileSync(filePath, 'utf8');
start = content.indexOf('    // Загрузка заявок для таблицы "Заявки на расчет"');
end = content.indexOf('    // Текущее состояние меню (для сохранения)');
if (start >= 0 && end > start) {
  const lineStart = content.lastIndexOf('\n', start) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(end);
  content = before + '    // loadClientsOrders - admin-orders.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed loadClientsOrders');
}

// Remove menu block (loadMenuSettings, renderMenuItem, removeMenuItem, saveMenuSettings)
content = fs.readFileSync(filePath, 'utf8');
start = content.indexOf('    // Текущее состояние меню (для сохранения)');
end = content.indexOf('    // Простая логика переключения страниц (без старого кода)');
if (start >= 0 && end > start) {
  const lineStart = content.lastIndexOf('\n', start) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(end);
  content = before + '    // loadMenuSettings, saveMenuSettings - admin-menu.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed menu functions');
}
