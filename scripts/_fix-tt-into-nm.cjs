/**
 * Починить catalog_53 (деталь countertop, не пустая секция)
 * и вставить module в catalog_46 id=3 как цоколь.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const uid = () => 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

const flatTree = [
  {
    type: 'section',
    id: uid(),
    name: 'Столешница НМ',
    active: 1,
    helpers_visible: 1,
    size: { x: 's:x', y: 's:y', z: 's:z' },
    pos: { x: 0, y: 0, z: 0 },
    pivot: { x: -1, y: -1, z: -1 },
    rot: { x: 0, y: 0, z: 0 },
    spec: { orientation: 'f' },
    layout_role: 'countertop',
    section_key: '',
    children: [
      {
        // В Clodis тип детали — countertop (tabletop в UI часто схлопывается в section)
        type: 'countertop',
        id: uid(),
        name: 'Столешница',
        active: 1,
        helpers_visible: 1,
        size: { x: 's:x', y: 's:y', z: 's:z' },
        pos: { x: 0, y: 0, z: 0 },
        pivot: { x: -1, y: -1, z: -1 },
        rot: { x: 0, y: 0, z: 0 },
        spec: {
          orientation: 'h',
          group: 'tabletop',
          type: 'common',
          can_group: 1,
          can_euro: 1,
          can_change: { id: 1 },
          material: {
            group: 'g0',
            key: 'ldsp',
            id: 0,
            variant_id: 0,
            rotated: 0,
          },
        },
        children: [],
        condition: null,
        visible: 1,
        layout_role: 'countertop',
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

const c46path = path.join(root, 'catalog_items', 'catalog_46.json');
const c46 = JSON.parse(fs.readFileSync(c46path, 'utf8'));
const nm = c46.find((x) => String(x.id) === '3');
if (!nm) throw new Error('no id=3');

let tree = nm.clodisJSON;
if (typeof tree === 'string') tree = JSON.parse(tree);
const rootNode = Array.isArray(tree) ? tree[0] : tree;

rootNode.children = (rootNode.children || []).filter(
  (c) =>
    !(
      c.layout_role === 'countertop' ||
      c.layout_role === 'tabletop_slot' ||
      /столеш/i.test(c.name || '')
    )
);

rootNode.children.push({
  type: 'module',
  id: uid(),
  name: 'Столешница НМ',
  active: 1,
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
    can_change: { id: 0 },
    not_load_default: 0,
  },
  children: [],
  lib: '',
  tags: '',
  interactive: 0,
  custom: {},
  condition: null,
  visible: 1,
  helpers_visible: 1,
  variables: { visible: 1, main: {} },
  interaction: {
    auto_rotation: 1,
    check_intersection: 0,
    raycast: 1,
    rotate_free: 0,
  },
  resizable: {
    enabled: 0,
    locks: {},
    minmax: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  },
  events: {
    on_before_params: '',
    on_before_build: '',
    on_after_build: '',
    on_drag_end: '',
  },
  comments: '',
  section_key: '',
  params_key: '',
  layout_role: 'countertop',
});

nm.clodisJSON = tree;
if (nm.data && typeof nm.data === 'object') nm.data.clodisJSON = tree;
fs.writeFileSync(c46path, JSON.stringify(c46, null, 2));

const pub = path.join(root, 'public', 'catalog_items');
fs.mkdirSync(pub, { recursive: true });
fs.copyFileSync(path.join(root, 'catalog_items', 'catalog_53.json'), path.join(pub, 'catalog_53.json'));
fs.copyFileSync(c46path, path.join(pub, 'catalog_46.json'));

console.log(
  'NM children:',
  rootNode.children.map((c) => c.type + ':' + c.name).join(' | ')
);
console.log('flat child type:', flatTree[0].children[0].type);
