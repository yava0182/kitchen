const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'admin-new.html');
let h = fs.readFileSync(htmlPath, 'utf8');
h = h.replace(/html v=20261022-list-ui\d+/g, 'html v=20261022-list-ui12');
h = h.replace(/html loaded v=20261022-list-ui\d+/g, 'html loaded v=20261022-list-ui12');
h = h.replace(/\?v=20261022-list-ui\d+/g, '?v=20261022-list-ui12');
// Normalize checkbox th width:10px → class col-check (keep id attrs)
h = h.replace(/<th style="width:\s*10px;"([^>]*)>/g, '<th class="col-check"$1>');
h = h.replace(/<th style="width:\s*30px;"([^>]*>\s*<input type="checkbox")/g, '<th class="col-check"$1');
fs.writeFileSync(htmlPath, h);
fs.copyFileSync(htmlPath, path.join(root, 'public', 'admin-new.html'));
fs.copyFileSync(
  path.join(root, 'js', 'admin', 'admin-catalog-items.js'),
  path.join(root, 'public', 'js', 'admin', 'admin-catalog-items.js')
);
console.log('ok', (h.match(/html v=20261022-list-ui\d+/) || [])[0], 'col-check', (h.match(/col-check/g) || []).length);
