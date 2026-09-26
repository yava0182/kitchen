import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '..', 'admin-new.html');
const content = fs.readFileSync(filePath, 'utf8');

// Find materials keys block - search for key patterns
const patterns = [
  { name: 'materialsKeysPagination', search: 'materialsKeysPagination = {' },
  { name: 'loadMaterialsKeys', search: 'loadMaterialsKeys' },
  { name: 'renderMaterialsKeysTable', search: 'renderMaterialsKeysTable' },
  { name: 'openMaterialKeyEdit', search: 'openMaterialKeyEdit' },
  { name: 'loadMaterialKeyEdit', search: 'loadMaterialKeyEdit' },
  { name: 'saveMaterialKey', search: 'saveMaterialKey' },
  { name: 'materials-keys-per-page', search: 'materials-keys-per-page' },
  { name: 'material-key-checkbox', search: 'material-key-checkbox' },
];

console.log('Pattern positions:');
patterns.forEach(p => {
  const i = content.indexOf(p.search);
  console.log(p.name + ': ' + (i >= 0 ? i : 'NOT FOUND'));
});

// Find block: from "materials_keys" or "materials keys" comment to next section
const blockStarts = [
  content.indexOf('// Функции для работы с материалами'),
  content.indexOf('materials_keys)'),
  content.indexOf('materialsKeysPagination'),
];
const blockStart = blockStarts.find(i => i >= 0) || 0;
console.log('\nBlock start candidates:', blockStarts);

// Find items_get/materials_keys - used in load function
const apiIdx = content.indexOf('items_get/materials_keys');
console.log('\nitems_get/materials_keys at:', apiIdx);
if (apiIdx >= 0) {
  const start = Math.max(0, apiIdx - 500);
  console.log('\n=== 2500 chars around API call ===');
  console.log(content.substring(start, start + 2500));
}

// Find materials-keys page HTML - search for materials-keys
const pageIdx = content.indexOf('materials-keys');
console.log('\nFirst "materials-keys" at:', pageIdx);
const pageIdx2 = content.indexOf('materials-keys-table');
console.log('materials-keys-table at:', pageIdx2);
if (pageIdx >= 0) {
  console.log('\n=== HTML around materials-keys page (1500 chars) ===');
  console.log(content.substring(pageIdx, pageIdx + 1500));
}

// Find materials-keys-table-body
const tbodyIdx = content.indexOf('materials-keys-table-body');
console.log('\nmaterials-keys-table-body at:', tbodyIdx);

// Find all material-related IDs
const idRe = /id=["']([^"']*material[^"']*)["']/g;
const ids = new Set();
let idM;
while ((idM = idRe.exec(content)) !== null) ids.add(idM[1]);
console.log('\nMaterial-related IDs:', [...ids].sort().join(', '));
