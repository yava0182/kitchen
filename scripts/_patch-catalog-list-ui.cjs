const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'admin-new.html');
let h = fs.readFileSync(htmlPath, 'utf8');

const ids = [
  'catalog-types',
  'catalog-groups',
  'catalog-items',
  'materials-keys',
  'materials-groups',
  'materials-items',
  'edges-keys',
  'edges-items',
  'plinth-models',
  'tabletop-models',
  'facades-items',
  'models3d-materials',
  'models3d-list',
  'handles-list',
  'handles-collection',
  'accessories-library',
  'drilling-templates',
  'drilling-schemes'
];

let n = 0;
for (const id of ids) {
  const re = new RegExp('<div id="' + id + '" class="admin-page([^"]*)"', 'g');
  h = h.replace(re, (m, rest) => {
    if (String(rest).includes('admin-catalog-list')) return m;
    n += 1;
    return '<div id="' + id + '" class="admin-page admin-catalog-list' + rest + '"';
  });
}

h = h.replace(/html v=20261022-list-ui1/g, 'html v=20261022-list-ui2');
h = h.replace(/html loaded v=20261022-list-ui1/g, 'html loaded v=20261022-list-ui2');
h = h.replace(/\?v=20261022-list-ui1/g, '?v=20261022-list-ui2');

const oldCssStart = '    /* =========================================================================\n       Списки каталога';
const oldCssEnd = '    .ibox-content .table th[style*="width: 90px"],\n    .ibox-content .table th[style*="width:90px"] {\n      width: 80px !important;\n    }\n';

const newCss = `    /* =========================================================================
       Каталог элементов и всё ниже — один стиль списков (как ПП ЛДСП)
       ========================================================================= */
    .input-group {
      display: flex !important;
      flex-wrap: nowrap !important;
      align-items: stretch;
      width: 100%;
      gap: 0 !important;
    }
    .input-group > .form-control {
      flex: 1 1 auto;
      width: 1% !important;
      min-width: 0;
      height: 32px !important;
      padding: 4px 10px !important;
      font-size: 13px;
      margin-right: 0 !important;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    .input-group > .input-group-addon {
      display: flex !important;
      align-items: center;
      flex: 0 0 auto;
      height: 32px;
      padding: 0 10px;
      border: 1px solid #e7eaec;
      border-right: 0;
      background: #fff;
      border-radius: 4px 0 0 4px;
      color: #6b7280;
    }
    .input-group-append,
    .input-group-btn {
      display: flex !important;
      flex: 0 0 auto;
      margin-left: 0 !important;
    }
    .input-group-append .btn,
    .input-group-btn .btn {
      height: 32px;
      padding: 0 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      margin-left: 0 !important;
    }

    .admin-catalog-list .ibox-content > .row.align-items-center {
      margin-bottom: 12px !important;
    }
    .admin-catalog-list .ibox-content > .row.pt-3 {
      margin-bottom: 12px !important;
      align-items: flex-end;
    }
    .admin-catalog-list .ibox-content > .row.pt-3 .form-group {
      margin-bottom: 0;
    }
    .admin-catalog-list .ibox-content > .row.pt-3 label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 4px;
    }
    .admin-catalog-list .ibox-content > .row.pt-3 .form-control {
      height: 32px;
      padding: 4px 10px;
      font-size: 13px;
    }
    .admin-catalog-list .ibox-content > .row.pt-3 > .col-sm-4,
    .admin-catalog-list .ibox-content > .row.pt-3 > .col-sm-6 {
      flex: 0 0 26%;
      max-width: 26%;
    }
    .admin-catalog-list .ibox-content > .row.pt-3 > .col-sm-5 {
      flex: 0 0 26%;
      max-width: 26%;
    }
    .admin-catalog-list .ibox-content > .row.pt-3 > .col-sm-3 {
      flex: 0 0 16%;
      max-width: 16%;
    }
    @media (max-width: 992px) {
      .admin-catalog-list .ibox-content > .row.pt-3 > [class*="col-sm-"] {
        flex: 0 0 100%;
        max-width: 100%;
        margin-bottom: 8px;
      }
    }

    .admin-catalog-list .table {
      table-layout: fixed !important;
      width: 100% !important;
      font-size: 13px;
    }
    .admin-catalog-list .table th,
    .admin-catalog-list .table td {
      padding: 6px 8px !important;
      vertical-align: middle !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .admin-catalog-list .table th.col-actions,
    .admin-catalog-list .table td.col-actions,
    .admin-catalog-list .table th[class*="col-actions"],
    .admin-catalog-list .table td[class*="col-actions"] {
      width: 118px !important;
      white-space: nowrap !important;
      text-align: center;
    }
    .admin-catalog-list .table td.col-actions .btn,
    .admin-catalog-list .table .col-actions .btn {
      padding: 2px 6px;
      margin: 0 1px;
      line-height: 1.2;
    }
    .admin-catalog-list .admin-list-thumb,
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
    }
`;

const startIdx = h.indexOf(oldCssStart);
if (startIdx < 0) {
  console.error('CSS start not found');
  process.exit(1);
}
const endMarker = '    /* Стили для триггеров меню (три точки) - всегда видимы */';
const endIdx = h.indexOf(endMarker, startIdx);
if (endIdx < 0) {
  console.error('CSS end not found');
  process.exit(1);
}
h = h.slice(0, startIdx) + newCss + '\n' + h.slice(endIdx);

fs.writeFileSync(htmlPath, h);
console.log('OK pages=', n, 'bytes=', h.length);

const pub = path.join(root, 'public', 'admin-new.html');
fs.copyFileSync(htmlPath, pub);
console.log('synced public/admin-new.html');
