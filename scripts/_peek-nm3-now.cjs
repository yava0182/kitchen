const fs = require('fs');
const c46 = JSON.parse(fs.readFileSync('catalog_items/catalog_46.json', 'utf8'));
const nm = c46.find((x) => String(x.id) === '3');
console.log('name', nm?.name);
let t = nm.clodisJSON;
if (typeof t === 'string') t = JSON.parse(t);
const root = Array.isArray(t) ? t[0] : t;
console.log((root.children || []).map((c) => c.type + ':' + c.name + '[' + (c.layout_role || '') + ']').join(' | '));
const c53 = JSON.parse(fs.readFileSync('catalog_items/catalog_53.json', 'utf8'));
const flat = c53[0];
let ft = flat.clodisJSON;
if (typeof ft === 'string') ft = JSON.parse(ft);
function walk(nodes, d = 0) {
  for (const n of nodes || []) {
    console.log('  '.repeat(d) + n.type + ' | ' + n.name);
    if (n.children) walk(n.children, d + 1);
  }
}
walk(Array.isArray(ft) ? ft : [ft]);
