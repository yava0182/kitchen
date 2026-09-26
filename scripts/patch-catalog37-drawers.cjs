const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../catalog_items/catalog_37.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let n = 0;

function walkDeep(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(walkDeep);
    return;
  }
  if (
    node.type === 'module' &&
    node.name === 'Ящик выдвижной' &&
    String(node.spec?.element_type) === 'catalog_33'
  ) {
    node.layout_role = 'drawer';
    node.size = { x: 's:x - 32', y: 162, z: 's:z - 50' };
    node.pos = { x: 16, y: '(v:h_bottom) + 18', z: 50 };
    node.spec = node.spec || {};
    node.spec.ref_size_mm = { x: 568, y: 162, z: 550 };
    n += 1;
  }
  for (const v of Object.values(node)) walkDeep(v);
}

walkDeep(data);
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('patched drawers:', n);
