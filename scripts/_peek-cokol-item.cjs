const fs = require('fs');
const data = JSON.parse(fs.readFileSync('catalog_items/catalog_32.json', 'utf8'));
const items = Array.isArray(data) ? data : [data];
const it = items.find((x) => /цоколь|100/i.test(x.name || '')) || items[0];
console.log('count', items.length, 'pick', it.id, it.name, it.catalog_type);
const keys = Object.keys(it);
console.log('keys', keys);
let tree = it.clodisJSON;
if (typeof tree === 'string') tree = JSON.parse(tree);
function walk(nodes, d = 0) {
  for (const n of nodes || []) {
    console.log('  '.repeat(d) + (n.type || '?') + ' | ' + (n.name || '') + (n.layout_role ? ' [' + n.layout_role + ']' : ''));
    if (d < 2 && n.size) console.log('  '.repeat(d) + '  size', JSON.stringify(n.size));
    if (d < 2 && n.pos) console.log('  '.repeat(d) + '  pos', JSON.stringify(n.pos));
    if (d < 2 && n.pivot) console.log('  '.repeat(d) + '  pivot', JSON.stringify(n.pivot));
    if (n.children) walk(n.children, d + 1);
  }
}
walk(Array.isArray(tree) ? tree : tree ? [tree] : []);
// data snippet
if (it.data) {
  console.log('data.width/height/depth', it.data.width, it.data.height, it.data.depth);
  console.log('data.catalog_type', it.data.catalog_type);
}
