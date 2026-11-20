/**
 * UI грузит constructor_structure, не clodisJSON.
 * Синхронизируем столешку + vars в CS (и data.CS) для catalog_46 id=3;
 * у catalog_53 выставляем constructor_structure как у цоколя.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const uid = () => 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

function findTabletopLink(children) {
  return (children || []).find(
    (c) =>
      c &&
      (c.layout_role === 'countertop' ||
        /столеш/i.test(c.name || '') ||
        (c.spec && String(c.spec.element_type) === 'catalog_53'))
  );
}

function ensureVars(vars) {
  vars = vars && typeof vars === 'object' ? vars : { main: {}, groups: [] };
  vars.main = vars.main && typeof vars.main === 'object' && !Array.isArray(vars.main) ? vars.main : {};
  if (!Array.isArray(vars.groups)) vars.groups = [];
  vars.main.depth_tabletop = 600;
  vars.main.front_countertop_overhang = 40;
  return vars;
}

// --- catalog_53: CS = дерево модуля (как catalog_32) ---
const c53path = path.join(root, 'catalog_items', 'catalog_53.json');
const c53 = JSON.parse(fs.readFileSync(c53path, 'utf8'));
const flat = c53[0];
let flatTree = flat.clodisJSON;
if (typeof flatTree === 'string') flatTree = JSON.parse(flatTree);
if (!Array.isArray(flatTree) || !flatTree.length) {
  throw new Error('catalog_53 clodisJSON empty');
}
// чиним layout_role на детали если вдруг plinth
(function fixRole(n) {
  if (!n) return;
  if (Array.isArray(n)) return n.forEach(fixRole);
  if (n.type === 'countertop' || n.type === 'tabletop') n.layout_role = 'countertop';
  if (n.layout_role === 'plinth' && /столеш/i.test(n.name || '')) n.layout_role = 'countertop';
  (n.children || []).forEach(fixRole);
})(flatTree);

const flatCS = {
  type: 'module',
  name: flat.name || 'Столешница НМ',
  children: deepClone(flatTree),
  variables: { main: {}, groups: [] },
  template: null,
  materials_overrides: {},
  spec: flat.spec || {},
};
flat.constructor_structure = flatCS;
flat.clodisJSON = flatTree;
if (flat.data && typeof flat.data === 'object') {
  flat.data.clodisJSON = flatTree;
  flat.data.constructor_structure = flatCS;
}
fs.writeFileSync(c53path, JSON.stringify(c53, null, 2));

// --- catalog_46 id=3: CS children = CJ children (с столешкой) + vars ---
const c46path = path.join(root, 'catalog_items', 'catalog_46.json');
const c46 = JSON.parse(fs.readFileSync(c46path, 'utf8'));
const nm = c46.find((x) => String(x.id) === '3');
if (!nm) throw new Error('no id=3');

let cj = nm.clodisJSON;
if (typeof cj === 'string') cj = JSON.parse(cj);
const cjRoot = Array.isArray(cj) ? cj[0] : cj;
if (!cjRoot || !Array.isArray(cjRoot.children)) throw new Error('bad clodisJSON root');

let tt = findTabletopLink(cjRoot.children);
if (!tt) {
  tt = {
    type: 'module',
    id: uid(),
    name: 'Столешница НМ',
    active: 1,
    size: { x: 's:x', y: 40, z: 'v:depth_tabletop' },
    pos: { x: 0, y: 's:y', z: 's:z + v:front_countertop_overhang' },
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
  };
  cjRoot.children.push(tt);
}

const cs = nm.constructor_structure;
if (!cs || !Array.isArray(cs.children) || !cs.children[0]) {
  throw new Error('bad constructor_structure');
}
const sec = cs.children[0];
sec.children = Array.isArray(sec.children) ? sec.children : [];
sec.children = sec.children.filter(
  (c) =>
    !(
      c.layout_role === 'countertop' ||
      /столеш/i.test(c.name || '') ||
      (c.spec && String(c.spec.element_type) === 'catalog_53')
    )
);
sec.children.push(deepClone(tt));

cs.variables = ensureVars(cs.variables);
// loadCatalogItemData берёт template.structure РАНЬШЕ children — без синка UI старый.
cs.template = cs.template && typeof cs.template === 'object' ? cs.template : {};
cs.template.structure = deepClone(cs.children);
if (cs.spec && cs.spec.template) {
  cs.spec.template.tree = deepClone(cs.children);
  if (Array.isArray(cs.spec.template.structure)) {
    cs.spec.template.structure = deepClone(cs.children);
  }
}
nm.constructor_structure = cs;

// data mirrors
if (!nm.data || typeof nm.data !== 'object') nm.data = {};
nm.data.constructor_structure = deepClone(cs);
nm.clodisJSON = Array.isArray(cj) ? cj : [cjRoot];
nm.data.clodisJSON = deepClone(nm.clodisJSON);

fs.writeFileSync(c46path, JSON.stringify(c46, null, 2));

const pub = path.join(root, 'public', 'catalog_items');
fs.mkdirSync(pub, { recursive: true });
fs.copyFileSync(c53path, path.join(pub, 'catalog_53.json'));
fs.copyFileSync(c46path, path.join(pub, 'catalog_46.json'));

console.log(
  'CS section kids:',
  sec.children.map((c) => c.type + ':' + c.name).join(' | ')
);
console.log('vars', {
  depth_tabletop: cs.variables.main.depth_tabletop,
  front_countertop_overhang: cs.variables.main.front_countertop_overhang,
});
console.log('c53 CS children:', flatCS.children.map((c) => c.type + ':' + c.name).join(' | '));
