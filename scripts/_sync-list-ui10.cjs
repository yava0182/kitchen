const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const pairs = [
  ['admin-new.html', 'public/admin-new.html'],
  ['js/admin/admin-new-bundle.js', 'public/js/admin/admin-new-bundle.js'],
  ['js/admin/admin-catalog-items.js', 'public/js/admin/admin-catalog-items.js'],
  ['js/admin/admin-facades.js', 'public/js/admin/admin-facades.js'],
  ['js/admin/admin-plinth-models.js', 'public/js/admin/admin-plinth-models.js'],
  ['js/admin/admin-tabletop-models.js', 'public/js/admin/admin-tabletop-models.js'],
  ['admin-handles-list.js', 'public/admin-handles-list.js'],
  ['admin-models3d-materials.js', 'public/admin-models3d-materials.js'],
  ['admin-models3d-list.js', 'public/admin-models3d-list.js'],
];

let h = fs.readFileSync(path.join(root, 'admin-new.html'), 'utf8');
if (!h.includes('html v=20261022-list-ui10')) {
  h = h.replace(/html v=20261022-list-ui\d+/g, 'html v=20261022-list-ui10');
  h = h.replace(/html loaded v=20261022-list-ui\d+/g, 'html loaded v=20261022-list-ui10');
  h = h.replace(/\?v=20261022-list-ui\d+/g, '?v=20261022-list-ui10');
  fs.writeFileSync(path.join(root, 'admin-new.html'), h);
}

for (const [src, dst] of pairs) {
  fs.copyFileSync(path.join(root, src), path.join(root, dst));
}
console.log('synced', (h.match(/html v=20261022-list-ui\d+/) || [])[0]);
