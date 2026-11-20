/**
 * 1) catalog_53 — плоский модуль «Столешница НМ» (внутри type:tabletop)
 * 2) catalogs_keys — тип «Столешница (модули)»
 * 3) catalog_46 id=3 — убрать секцию-костыль, вставить module как цоколь
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const uid = () => 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);

// --- flat module tree ---
const tabletopId = uid();
const sectionId = uid();

const flatTree = [
  {
    type: 'section',
    id: sectionId,
    name: 'Столешница НМ',
    active: 1,
    helpers_visible: 1,
    size: { x: 's:x', y: 's:y', z: 's:z' },
    pos: { x: 0, y: 0, z: 0 },
    pivot: { x: -1, y: -1, z: -1 },
    scale: { x: 1, y: 1, z: 1 },
    rot: { x: 0, y: 0, z: 0 },
    spec: { orientation: 'f' },
    layout_role: 'countertop',
    children: [
      {
        type: 'tabletop',
        id: tabletopId,
        name: 'Столешница',
        active: 1,
        helpers_visible: 0,
        size: { x: 's:x', y: 's:y', z: 's:z' },
        pos: { x: 0, y: 0, z: 0 },
        pivot: { x: -1, y: -1, z: -1 },
        scale: { x: 1, y: 1, z: 1 },
        rot: { x: 0, y: 0, z: 0 },
        spec: {
          name: '',
          code: '',
          group: 'tabletop',
          type: 'common',
          can_group: 1,
          can_euro: 1,
          type_params: {
            corners_equal: 1,
            c1: { type: 'straight', val: 0 },
            c2: { type: 'straight', val: 0 },
            c3: { type: 'straight', val: 0 },
            c4: { type: 'straight', val: 0 },
          },
          cuts: { connects: [], len: 1500 },
          key: '',
          shape: null,
          material: { id: '__empty', variant_id: '__empty', rotated: 0 },
          plints: {
            enabled: '__empty',
            material: '__empty',
            back: '1',
            right: '__empty',
            left: '__empty',
          },
          can_change: { id: 1 },
        },
        children: [],
        condition: [
          [{ f: 'v:_tbl', o: '==', v: 1 }],
        ],
        visible: 1,
        layout_role: 'countertop',
        resizable: {
          enabled: 0,
          locks: 'y',
          minmax: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 },
          },
          extend_size: 1,
        },
      },
    ],
    condition: null,
    visible: 1,
  },
];

const flatItem = {
  catalog_type: 'catalog_53',
  id: 1,
  name: 'Столешница НМ',
  data: {
    name: 'Столешница НМ',
    category: [],
    show_in_spec: '1',
    include_nested: '1',
    show_in_constructor: '1',
    order: 0,
    icon: '',
    module_group: 'bottom',
    drag_type: 'top',
    stick_type: 'common',
    is_fill: '0',
    no_intersections: '0',
    catalog_type: '',
    width: '600',
    height: '40',
    depth: '600',
    placementKind: 'floor_in_niche',
    roomTags: { categories: [] },
    hingeLayoutId: null,
    clodisVariables: {},
    clodisJSON: flatTree,
  },
  constructor_structure: null,
  clodisJSON: flatTree,
};

fs.writeFileSync(
  path.join(root, 'catalog_items', 'catalog_53.json'),
  JSON.stringify([flatItem], null, 2)
);
console.log('wrote catalog_53.json');

// --- catalogs_keys ---
for (const rel of ['catalogs_keys.json', path.join('public', 'data', 'catalogs_keys.json')]) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  const keys = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!keys.some((k) => k.key === 'catalog_53')) {
    keys.push({
      id: 53,
      key: 'catalog_53',
      name: 'Столешница (модули)',
      order: 0,
      active: 1,
    });
    fs.writeFileSync(p, JSON.stringify(keys, null, 2));
    console.log('updated', rel);
  } else {
    console.log('keys already has catalog_53', rel);
  }
}

// --- patch catalog_46 id=3 ---
const c46path = path.join(root, 'catalog_items', 'catalog_46.json');
const c46 = JSON.parse(fs.readFileSync(c46path, 'utf8'));
const nm = c46.find((x) => String(x.id) === '3');
if (!nm) throw new Error('NM id=3 not found');

let tree = nm.clodisJSON;
if (typeof tree === 'string') tree = JSON.parse(tree);
const rootNode = Array.isArray(tree) ? tree[0] : tree;
if (!rootNode || !Array.isArray(rootNode.children)) throw new Error('bad NM tree');

// remove previous inline section
rootNode.children = rootNode.children.filter(
  (c) =>
    !(
      c.layout_role === 'tabletop_slot' ||
      (c.type === 'section' && /столеш/i.test(c.name || ''))
    )
);

const moduleNode = {
  type: 'module',
  id: uid(),
  name: 'Столешница НМ',
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
  spec: {
    id: '1',
    element_type: 'catalog_53',
    fill_content: {},
    linked_item_id: 0,
    live_catalog: true,
    key: 'Столешница НМ',
  },
  children: [],
  condition: null,
  visible: 1,
  layout_role: 'countertop',
  lib: '',
  tags: '',
  interactive: 0,
  custom: [],
  variables: { visible: 1, main: [] },
  section_key: '',
  params_key: '',
};

rootNode.children.push(moduleNode);
nm.clodisJSON = tree;
if (nm.data && typeof nm.data === 'object') nm.data.clodisJSON = tree;

fs.writeFileSync(c46path, JSON.stringify(c46, null, 2));
console.log(
  'NM id=3 children:',
  rootNode.children.map((c) => c.type + ':' + c.name + (c.layout_role ? '[' + c.layout_role + ']' : '')).join(' | ')
);

// sync public copies if exist
const pub53 = path.join(root, 'public', 'catalog_items', 'catalog_53.json');
const pub46 = path.join(root, 'public', 'catalog_items', 'catalog_46.json');
fs.mkdirSync(path.dirname(pub53), { recursive: true });
fs.copyFileSync(path.join(root, 'catalog_items', 'catalog_53.json'), pub53);
if (fs.existsSync(path.dirname(pub46))) {
  fs.copyFileSync(c46path, pub46);
}
console.log('ok');
