const fs = require('fs');
const data = JSON.parse(fs.readFileSync('catalog_items/catalog_46.json', 'utf8'));
const item = data.find((x) => String(x.id) === '3');
let tree = item.clodisJSON;
if (typeof tree === 'string') tree = JSON.parse(tree);
const root = Array.isArray(tree) ? tree[0] : tree;
for (const c of root.children || []) {
  console.log('---', c.type, c.name, c.layout_role);
  if (c.type === 'module' || /столеш|цоколь/i.test(c.name || '')) {
    console.log(JSON.stringify({
      type: c.type,
      name: c.name,
      layout_role: c.layout_role,
      size: c.size,
      pos: c.pos,
      pivot: c.pivot,
      spec: c.spec,
      condition: c.condition,
      children: (c.children || []).map((x) => x.type + ':' + x.name),
    }, null, 2));
  }
}
