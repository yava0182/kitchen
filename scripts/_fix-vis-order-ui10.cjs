const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'admin-new.html');
let h = fs.readFileSync(htmlPath, 'utf8');

const crush1 = `    /* Колонка превью/иконки — узкая, если задана инлайном */
    .admin-catalog-list .table th[style*="width: 90px"],
    .admin-catalog-list .table th[style*="width:90px"],
    .admin-catalog-list .table th[style*="width: 100px"],
    .admin-catalog-list .table th[style*="width:100px"],
    .admin-catalog-list .table th[style*="width: 80px"],
    .admin-catalog-list .table th[style*="width:80px"] {
      width: 48px !important;
      max-width: 48px !important;
    }`;
const crush2 = `    .admin-catalog-list .table th[style*="width: 90px"],
    .admin-catalog-list .table th[style*="width:90px"],
    .admin-catalog-list .table th[style*="width: 100px"],
    .admin-catalog-list .table th[style*="width:100px"] {
      width: 56px !important;
    }`;

if (!h.includes('width: 48px !important')) {
  console.error('crush1 missing');
  process.exit(1);
}
h = h.replace(crush1, '');
h = h.replace(crush2, '');

const visBlock = `    /* Глаз видимости — тот же размер */
    .admin-catalog-list .table td .btn.btn-xs.btn-outline {
      width: 26px !important;
      height: 26px !important;
      min-width: 26px !important;
      padding: 0 !important;
      margin: 0 !important;
      border-radius: 3px !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      box-sizing: border-box !important;
    }
    .admin-catalog-list .table td .btn.btn-xs.btn-outline > .fa {
      width: 14px !important;
      height: 14px !important;
      margin: 0 !important;
      position: relative;
      display: inline-block !important;
    }`;

const visNew = `    /* Outline+цвет = рамка как в PP, НЕ заливка */
    .admin-catalog-list .btn.btn-outline.btn-success,
    .admin-catalog-list i.btn.btn-outline.btn-success {
      background: transparent !important;
      color: #1ab394 !important;
      border-color: #1ab394 !important;
      --cld-icon-color: #1ab394;
    }
    .admin-catalog-list .btn.btn-outline.btn-primary,
    .admin-catalog-list i.btn.btn-outline.btn-primary {
      background: transparent !important;
      color: #1c84c6 !important;
      border-color: #1c84c6 !important;
      --cld-icon-color: #1c84c6;
    }
    .admin-catalog-list .btn.btn-outline.btn-info,
    .admin-catalog-list i.btn.btn-outline.btn-info {
      background: transparent !important;
      color: #23c6c8 !important;
      border-color: #23c6c8 !important;
      --cld-icon-color: #23c6c8;
    }
    .admin-catalog-list .btn.btn-outline.btn-danger,
    .admin-catalog-list i.btn.btn-outline.btn-danger {
      background: transparent !important;
      color: #ed5565 !important;
      border-color: #ed5565 !important;
      --cld-icon-color: #ed5565;
    }
    .admin-catalog-list .btn.btn-outline.btn-default,
    .admin-catalog-list i.btn.btn-outline.btn-default {
      background: transparent !important;
      color: #9ca3af !important;
      border-color: #d1d5db !important;
      --cld-icon-color: #9ca3af;
    }
    /* Порядок / Видимость / Иконка — ширины как в PP */
    .admin-catalog-list .table th.col-order,
    .admin-catalog-list .table td.col-order {
      width: 72px !important;
      min-width: 72px !important;
      max-width: 80px !important;
      text-align: center !important;
      white-space: nowrap !important;
      overflow: visible !important;
      text-overflow: clip !important;
    }
    .admin-catalog-list .table th.col-vis,
    .admin-catalog-list .table td.col-vis {
      width: 96px !important;
      min-width: 96px !important;
      max-width: 110px !important;
      text-align: center !important;
      white-space: nowrap !important;
      overflow: visible !important;
    }
    .admin-catalog-list .table th.col-icon,
    .admin-catalog-list .table td.col-icon {
      width: 56px !important;
      min-width: 56px !important;
      max-width: 72px !important;
      text-align: center !important;
    }
    /* Глаз видимости — 26×26 outline */
    .admin-catalog-list .table td.col-vis .btn,
    .admin-catalog-list .table td.col-vis i.btn,
    .admin-catalog-list .table td .btn.btn-xs.btn-outline {
      width: 26px !important;
      height: 26px !important;
      min-width: 26px !important;
      padding: 0 !important;
      margin: 0 !important;
      border-radius: 3px !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      box-sizing: border-box !important;
      background: transparent !important;
    }
    .admin-catalog-list .table td.col-vis .btn > .fa,
    .admin-catalog-list .table td .btn.btn-xs.btn-outline > .fa {
      width: 14px !important;
      height: 14px !important;
      margin: 0 !important;
      position: relative;
      display: inline-block !important;
    }
    .admin-catalog-list .table td.col-vis i.btn.fa::before {
      inset: 5px !important;
      background-color: var(--cld-icon-color, currentColor);
    }`;

if (!h.includes(visBlock)) {
  console.error('visBlock missing');
  process.exit(1);
}
h = h.replace(visBlock, visNew);

function addClassToTh(html, label, cls) {
  const re = new RegExp('<th([^>]*)>' + label + '</th>', 'g');
  return html.replace(re, (m, attrs) => {
    if (/\bclass=/.test(attrs)) {
      if (attrs.includes(cls)) return m;
      return '<th' + attrs.replace(/class="([^"]*)"/, 'class="$1 ' + cls + '"') + '>' + label + '</th>';
    }
    return '<th class="' + cls + '"' + attrs + '>' + label + '</th>';
  });
}

h = addClassToTh(h, 'Порядок', 'col-order');
h = addClassToTh(h, 'Видимость', 'col-vis');
h = addClassToTh(h, 'Иконка', 'col-icon');

h = h.replace(/html v=20261022-list-ui\d+/g, 'html v=20261022-list-ui10');
h = h.replace(/html loaded v=20261022-list-ui\d+/g, 'html loaded v=20261022-list-ui10');
h = h.replace(/\?v=20261022-list-ui\d+/g, '?v=20261022-list-ui10');

fs.writeFileSync(htmlPath, h);
fs.copyFileSync(htmlPath, path.join(root, 'public', 'admin-new.html'));
console.log(
  'ok',
  (h.match(/html v=20261022-list-ui\d+/) || [])[0],
  'order',
  (h.match(/col-order/g) || []).length,
  'vis',
  (h.match(/col-vis/g) || []).length,
  'icon',
  (h.match(/col-icon/g) || []).length
);
