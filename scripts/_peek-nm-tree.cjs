const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../catalog_items/catalog_46.json'), 'utf8'));
const items = Array.isArray(data) ? data : [data];

function walk(nodes, depth = 0) {
  if (!Array.isArray(nodes)) return;
  for (const n of nodes) {
    const pad = '  '.repeat(depth);
    console.log(pad + (n.type || '?') + ' | ' + (n.name || '') + (n.layout_role ? ' [' + n.layout_role + ']' : ''));
    if (depth <= 2) {
      if (n.size) console.log(pad + '  size ' + JSON.stringify(n.size));
      if (n.pos) console.log(pad + '  pos ' + JSON.stringify(n.pos));
      if (n.pivot) console.log(pad + '  pivot ' + JSON.stringify(n.pivot));
    }
    if (n.children) walk(n.children, depth + 1);
  }
}

for (const item of items) {
  console.log('\n===', item.id, item.name, '===');
  let tree = item.clodisJSON;
  if (typeof tree === 'string') tree = JSON.parse(tree);
  if (!tree && item.data) {
    const d = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    tree = d.clodisJSON || d.constructor_json;
    if (typeof tree === 'string') tree = JSON.parse(tree);
  }
  if (Array.isArray(tree)) walk(tree);
  else if (tree) walk([tree]);
  else console.log('no tree, keys', Object.keys(item));
}
