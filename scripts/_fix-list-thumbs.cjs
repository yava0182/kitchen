const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'admin-new.html');
let h = fs.readFileSync(htmlPath, 'utf8');

const oldBlock = `    .admin-catalog-list .admin-list-thumb,
    .admin-catalog-list .table img.admin-list-thumb {
      width: 64px !important;
      height: 64px !important;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
      display: block;
      background: #f8fafc;
    }
    .admin-catalog-list .admin-list-thumb-empty {
      width: 64px;
      height: 64px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: #f3f4f6;
      display: block;
      box-sizing: border-box;
    }
    .admin-catalog-list .admin-list-thumb.admin-list-thumb--edge,
    .admin-catalog-list .admin-list-thumb-empty.admin-list-thumb--edge {
      width: 110px !important;
      height: 56px !important;
    }
    /* Любые старые инлайн-иконки в списках → один размер */
    .admin-catalog-list .table td img[style*="width:40px"],
    .admin-catalog-list .table td img[style*="width:46px"],
    .admin-catalog-list .table td img[style*="width:60px"],
    .admin-catalog-list .table td img[style*="width:70px"],
    .admin-catalog-list .table td img[style*="width: 40px"],
    .admin-catalog-list .table td img[style*="width: 60px"],
    .admin-catalog-list .table td img[style*="width: 70px"] {
      width: 64px !important;
      height: 64px !important;
      object-fit: cover !important;
      border-radius: 4px !important;
    }
    .admin-catalog-list .table td > div[style*="width:40px"],
    .admin-catalog-list .table td > div[style*="width:46px"],
    .admin-catalog-list .table td > div[style*="width:60px"],
    .admin-catalog-list .table td > div[style*="width:70px"] {
      width: 64px !important;
      height: 64px !important;
      border-radius: 4px !important;
      box-sizing: border-box;
    }
    .admin-catalog-list .table th[style*="width: 90px"],
    .admin-catalog-list .table th[style*="width:90px"],
    .admin-catalog-list .table th[style*="width: 100px"],
    .admin-catalog-list .table th[style*="width:100px"] {
      width: 80px !important;
    }`;

const newBlock = `    /* Превью в списках: 40×40 компактно */
    .admin-catalog-list .admin-list-thumb,
    .admin-catalog-list .table img.admin-list-thumb {
      width: 40px !important;
      height: 40px !important;
      max-width: 40px !important;
      max-height: 40px !important;
      object-fit: cover;
      border-radius: 3px;
      border: 1px solid #e5e7eb;
      display: block;
      background: #f8fafc;
    }
    .admin-catalog-list .admin-list-thumb-empty {
      width: 40px !important;
      height: 40px !important;
      max-width: 40px !important;
      max-height: 40px !important;
      border: 1px solid #e5e7eb;
      border-radius: 3px;
      background: #f3f4f6;
      display: block;
      box-sizing: border-box;
    }
    .admin-catalog-list .admin-list-thumb.admin-list-thumb--edge,
    .admin-catalog-list .admin-list-thumb-empty.admin-list-thumb--edge {
      width: 72px !important;
      height: 28px !important;
      max-width: 72px !important;
      max-height: 28px !important;
    }
    .admin-catalog-list .table td img[style*="width:"],
    .admin-catalog-list .table td > div[style*="width:"] {
      width: 40px !important;
      height: 40px !important;
      max-width: 40px !important;
      max-height: 40px !important;
      object-fit: cover !important;
      border-radius: 3px !important;
      box-sizing: border-box;
    }
    .admin-catalog-list .table td img.admin-list-thumb--edge,
    .admin-catalog-list .table td > div.admin-list-thumb--edge {
      width: 72px !important;
      height: 28px !important;
    }
    .admin-catalog-list .table th[style*="width: 90px"],
    .admin-catalog-list .table th[style*="width:90px"],
    .admin-catalog-list .table th[style*="width: 100px"],
    .admin-catalog-list .table th[style*="width:100px"] {
      width: 56px !important;
    }`;

if (!h.includes(oldBlock)) {
  console.error('old block not found');
  process.exit(1);
}
h = h.replace(oldBlock, newBlock);
h = h.replace(/html v=20261022-list-ui\d+/g, 'html v=20261022-list-ui7');
h = h.replace(/html loaded v=20261022-list-ui\d+/g, 'html loaded v=20261022-list-ui7');
h = h.replace(/\?v=20261022-list-ui\d+/g, '?v=20261022-list-ui7');
fs.writeFileSync(htmlPath, h);
fs.copyFileSync(htmlPath, path.join(root, 'public', 'admin-new.html'));
fs.copyFileSync(path.join(root, 'admin-handles-list.js'), path.join(root, 'public', 'admin-handles-list.js'));
console.log('ok', (h.match(/html v=20261022-list-ui\d+/) || [])[0], h.includes('40px !important'));
