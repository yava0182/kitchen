const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'admin-new.html');
let h = fs.readFileSync(htmlPath, 'utf8');
h = h.replace(/admin-tabletop-models\.js\?v=[^"']+/g, 'admin-tabletop-models.js?v=20261022-tt-stand4');
h = h.replace(/admin-material-3d-preview\.js\?v=[^"']+/g, 'admin-material-3d-preview.js?v=20261022-tt-stand4');
h = h.replace(/html v=20261022-[a-z0-9-]+/g, 'html v=20261022-tt-stand4');
h = h.replace(/html loaded v=20261022-[a-z0-9-]+/g, 'html loaded v=20261022-tt-stand4');
fs.writeFileSync(htmlPath, h);
fs.copyFileSync(htmlPath, path.join(root, 'public', 'admin-new.html'));
fs.copyFileSync(
  path.join(root, 'js', 'admin', 'admin-material-3d-preview.js'),
  path.join(root, 'public', 'js', 'admin', 'admin-material-3d-preview.js')
);
fs.copyFileSync(
  path.join(root, 'js', 'admin', 'admin-tabletop-models.js'),
  path.join(root, 'public', 'js', 'admin', 'admin-tabletop-models.js')
);
console.log('ok', (h.match(/tt-stand4/g) || []).length);
