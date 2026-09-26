import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '..', 'admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove catalogGroupsPagination + loadCatalogGroups + renderCatalogGroupsTable + renderCatalogGroupsPagination
//    (before materials_keys section)
const block1Start = '    // Функции для работы с группами (modules_groups)';
const block1End = '    // Функции для работы с материалами (materials_keys)';
const idx1 = content.indexOf(block1Start);
const idx2 = content.indexOf(block1End);
if (idx1 >= 0 && idx2 > idx1) {
  const before = content.substring(0, idx1);
  const after = content.substring(idx2);
  content = before + '    // catalog groups - admin-catalog-groups.js\n\n    ' + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed block 1:', idx2 - idx1, 'chars');
}

// 2. Remove openCatalogGroupEdit through performDeleteCatalogGroup (before performDeleteCatalogType)
content = fs.readFileSync(filePath, 'utf8');
const block2Start = 'window.openCatalogGroupEdit = function openCatalogGroupEdit';
const block2End = 'async function performDeleteCatalogType(itemId)';
const idx3 = content.indexOf(block2Start);
const idx4 = content.indexOf(block2End);
if (idx3 >= 0 && idx4 > idx3) {
  const lineStart = content.lastIndexOf('\n', idx3) + 1;
  const before = content.substring(0, lineStart);
  const after = content.substring(idx4);
  const replacement = '      // openCatalogGroupEdit, loadCatalogGroupEdit, saveCatalogGroup, deleteCatalogGroup - admin-catalog-groups.js\n\n      ';
  content = before + replacement + after;
  fs.writeFileSync(filePath, content);
  console.log('Removed block 2:', idx4 - lineStart, 'chars');
}

// 3. Remove groupsPerPageSelect handler (now in module)
content = fs.readFileSync(filePath, 'utf8');
const handlerStart = 'groups-per-page-select';
const idx5 = content.indexOf(handlerStart);
if (idx5 >= 0) {
  const blockStart = content.lastIndexOf('      //', idx5);
  const blockEnd = content.indexOf('      // Обработчик кнопки "Добавить" для групп материалов', idx5);
  if (blockEnd > blockStart) {
    const before = content.substring(0, blockStart);
    const after = content.substring(blockEnd);
    content = before + '      // groupsPerPageSelect - admin-catalog-groups.js\n      \n      ' + after;
    fs.writeFileSync(filePath, content);
    console.log('Removed groupsPerPageSelect handler');
  }
}

console.log('Done');
