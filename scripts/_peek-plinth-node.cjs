const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../catalog_items/catalog_46.json'), 'utf8'));
const item = data.find((x) => String(x.id) === '3') || data[0];
let tree = item.clodisJSON;
if (typeof tree === 'string') tree = JSON.parse(tree);

function find(nodes, pred, out = []) {
  for (const n of nodes || []) {
    if (pred(n)) out.push(n);
    if (n.children) find(n.children, pred, out);
  }
  return out;
}

const plinth = find(Array.isArray(tree) ? tree : [tree], (n) => String(n.layout_role || '') === 'plinth');
const p = plinth[0];
console.log('plinth keys', Object.keys(p || {}));
console.log(JSON.stringify({
  type: p.type,
  name: p.name,
  layout_role: p.layout_role,
  size: p.size,
  pos: p.pos,
  pivot: p.pivot,
  active: p.active,
  condition: p.condition,
  spec: p.spec,
  module_id: p.module_id,
  catalog_id: p.catalog_id,
  id: p.id,
  children_count: (p.children || []).length,
  firstChild: p.children?.[0] ? { type: p.children[0].type, name: p.children[0].name, size: p.children[0].size } : null,
}, null, 2));

// sample wall under corpus
const walls = find(Array.isArray(tree) ? tree : [tree], (n) => n.type === 'wall');
console.log('\nwall sample', JSON.stringify({
  type: walls[0]?.type,
  name: walls[0]?.name,
  size: walls[0]?.size,
  pos: walls[0]?.pos,
  pivot: walls[0]?.pivot,
  active: walls[0]?.active,
}, null, 2));
