/** catalog_53: секция → type:countertop, size.y = толщина модели (не wall!). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const uid = () => 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

let thick = 38;
try {
  const tt = JSON.parse(fs.readFileSync(path.join(root, 'catalog_items', 'tabletop_items.json'), 'utf8'));
  const v = tt[0]?.params?.variants?.[0];
  if (v && Number(v.thickness) > 0) thick = Math.round(Number(v.thickness));
} catch (_) {}

const section = {
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
      type: 'countertop',
      id: uid(),
      name: 'Столешница',
      active: 1,
      helpers_visible: 1,
      size: { x: 's:x', y: thick, z: 's:z' },
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
          group: 'tabletop',
          key: 'tabletop',
          id: 1,
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
};

const flatTree = [section];
const flatCS = {
  type: 'module',
  name: 'Столешница НМ',
  children: JSON.parse(JSON.stringify(flatTree)),
  variables: { main: {}, groups: [] },
  template: { structure: JSON.parse(JSON.stringify(flatTree)) },
  materials_overrides: {},
  spec: {},
};

const item = {
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
    height: String(thick),
    depth: '600',
    placementKind: 'floor_in_niche',
    roomTags: { categories: [] },
    hingeLayoutId: null,
    clodisVariables: {},
    clodisJSON: flatTree,
    constructor_structure: JSON.parse(JSON.stringify(flatCS)),
  },
  constructor_structure: flatCS,
  clodisJSON: flatTree,
};

const out = path.join(root, 'catalog_items', 'catalog_53.json');
fs.writeFileSync(out, JSON.stringify([item], null, 2));
fs.mkdirSync(path.join(root, 'public', 'catalog_items'), { recursive: true });
fs.copyFileSync(out, path.join(root, 'public', 'catalog_items', 'catalog_53.json'));
console.log('OK', flatTree[0].children[0].type, 'y=', thick);
