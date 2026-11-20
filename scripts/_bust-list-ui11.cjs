const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'admin-new.html');
let h = fs.readFileSync(htmlPath, 'utf8');
h = h.replace(/html v=20261022-list-ui\d+/g, 'html v=20261022-list-ui11');
h = h.replace(/html loaded v=20261022-list-ui\d+/g, 'html loaded v=20261022-list-ui11');
h = h.replace(/\?v=20261022-list-ui\d+/g, '?v=20261022-list-ui11');
fs.writeFileSync(htmlPath, h);

const pairs = [
  ['admin-new.html', 'public/admin-new.html'],
  ['js/admin/admin-catalog-items-actions.js', 'public/js/admin/admin-catalog-items-actions.js'],
  ['js/admin/admin-catalog-items.js', 'public/js/admin/admin-catalog-items.js'],
];
for (const [src, dst] of pairs) {
  fs.copyFileSync(path.join(root, src), path.join(root, dst));
}
console.log('ok', (h.match(/html v=20261022-list-ui\d+/) || [])[0]);
