/**
 * Добавить в первую карточку catalog_46 (id=3 «без дв и полки» — та, что в скрине)
 * секцию «Секция под столешницу» + detail type:countertop.
 * Не трогает цоколь. Не создаёт отдельный каталог-приставку.
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../catalog_items/catalog_46.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const TARGET_ID = '3'; // Рабочий стол без дв и полки
const item = data.find((x) => String(x.id) === TARGET_ID);
if (!item) {
  console.error('item not found', TARGET_ID);
  process.exit(1);
}

let tree = item.clodisJSON;
if (typeof tree === 'string') tree = JSON.parse(tree);
if (!Array.isArray(tree) || !tree[0]) {
  console.error('bad tree');
  process.exit(1);
}

const root = tree[0];
const already = (root.children || []).some(
  (c) =>
    /столеш/i.test(c.name || '') ||
    c.layout_role === 'tabletop' ||
    c.layout_role === 'countertop'
);
if (already) {
  console.log('already has tabletop section, skip');
  process.exit(0);
}

const uid = () => 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);

const tabletopDetail = {
  type: 'countertop',
  id: uid(),
  name: 'Столешница',
  active: 1,
  helpers_visible: 1,
  size: { x: 's:x', y: 's:y', z: 's:z' },
  pos: { x: 0, y: 0, z: 0 },
  pivot: { x: -1, y: -1, z: -1 },
  scale: { x: 1, y: 1, z: 1 },
  rot: { x: 0, y: 0, z: 0 },
  spec: {
    orientation: 'f',
    // материал/SKU — из tabletop_items позже (can_change); геометрия сейчас
  },
  children: [],
  // _tbl позже (как в PP); сейчас всегда видно — как остальные узлы карточки
  condition: null,
  visible: 1,
  layout_role: 'countertop',
};

const section = {
  type: 'section',
  id: uid(),
  name: 'Секция под столешницу',
  active: 1,
  helpers_visible: 1,
  size: {
    x: 's:x',
    y: 40,
    z: 'v:depth_tabletop',
  },
  pos: {
    x: 0,
    y: 's:y',
    z: 's:z + v:front_countertop_overhang',
  },
  pivot: { x: -1, y: -1, z: 1 },
  scale: { x: 1, y: 1, z: 1 },
  rot: { x: 0, y: 0, z: 0 },
  spec: { orientation: 'f' },
  children: [tabletopDetail],
  condition: null,
  visible: 1,
  layout_role: 'tabletop_slot',
};

if (!Array.isArray(root.children)) root.children = [];
root.children.push(section);

item.clodisJSON = tree;
if (item.data && typeof item.data === 'object') {
  item.data.clodisJSON = tree;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('ok: added to', item.name, 'id=', item.id);
console.log(
  'children:',
  root.children.map((c) => c.type + ':' + c.name).join(' | ')
);
