/**
 * STEP 2B: pure evaluateKitchenSidePanelOption rules.
 * node scripts/test-kitchen-side-panels-rules.mjs
 */
import {
  evaluateKitchenSidePanelOption,
  resolveKitchenSidePanelProfileId,
  classifyKitchenSidePanelModuleKind,
  extractKitchenSidePanelUserData,
  KITCHEN_SIDE_PANEL_SIDES,
} from '../js/kitchen/kitchen-side-panels-rules.js';
import { KITCHEN_SIDE_PANEL_MODES } from '../js/kitchen/kitchen-side-panels-contract.js';

let failed = 0;
const rows = [];

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('[FAIL]', msg);
    rows.push({ ok: false, msg });
  } else {
    console.log('[OK]', msg);
    rows.push({ ok: true, msg });
  }
}

function evalOpt(partial) {
  return evaluateKitchenSidePanelOption(partial);
}

function freezeClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// --- invalid inputs ---
{
  const a = evalOpt(null);
  assert(a.status === 'denied' && a.reasonCode === 'invalid_context', 'null context → denied');
  const b = evalOpt({ side: 'top', mode: 'standard', profileId: 'kitchen_base' });
  assert(b.status === 'denied' && b.reasonCode === 'invalid_side', 'bad side → denied');
  const c = evalOpt({ side: 'left', mode: 'magic', profileId: 'kitchen_base' });
  assert(c.status === 'denied' && c.reasonCode === 'invalid_mode', 'bad mode → denied');
}

// --- module kind from profile id only (not height/name) ---
{
  assert(classifyKitchenSidePanelModuleKind('kitchen_base') === 'base', 'base class');
  assert(classifyKitchenSidePanelModuleKind('kitchen_base_gola') === 'base', 'gola → base');
  assert(classifyKitchenSidePanelModuleKind('kitchen_base_corner') === 'base', 'corner → base');
  assert(classifyKitchenSidePanelModuleKind('kitchen_wall_mid') === 'wall', 'wall mid');
  assert(classifyKitchenSidePanelModuleKind('kitchen_wall_top') === 'wall', 'wall top');
  assert(classifyKitchenSidePanelModuleKind('kitchen_tall') === 'tall', 'tall');
  assert(classifyKitchenSidePanelModuleKind('') === 'unknown', 'empty → unknown');
  assert(
    classifyKitchenSidePanelModuleKind('kitchen_future_widget') === 'unknown',
    'unknown kitchen_* id → unknown'
  );
  // height / name must NOT classify
  const tallByHeight = {
    side: 'left',
    mode: 'standard',
    userData: {
      isFurniture: true,
      catalogName: 'Пенал А60',
      customHeightMm: 2100,
    },
  };
  const r = evalOpt(tallByHeight);
  assert(r.status === 'unknown' && r.reasonCode === 'missing_module_kind', 'no id by height/name');
  assert(resolveKitchenSidePanelProfileId(tallByHeight) === '', 'profile empty without stamp');
}

// --- base / wall / tall × sides × modes ---
const kinds = [
  { profileId: 'kitchen_base', kind: 'base', label: 'нижний' },
  { profileId: 'kitchen_wall_mid', kind: 'wall', label: 'верхний' },
  { profileId: 'kitchen_tall', kind: 'tall', label: 'пенал' },
];

for (const { profileId, kind, label } of kinds) {
  for (const side of KITCHEN_SIDE_PANEL_SIDES) {
    for (const mode of KITCHEN_SIDE_PANEL_MODES) {
      const res = evalOpt({
        side,
        mode,
        userData: {
          isFurniture: true,
          __placementKindProfileId: profileId,
          customWidthMm: 600,
          customDepthMm: 550,
        },
      });
      assert(res.moduleKind === kind, `${label} ${side} ${mode}: kind=${kind}`);
      assert(res.profileId === profileId, `${label} ${side} ${mode}: profile`);
      if (mode === 'standard') {
        assert(
          res.status === 'allowed' && res.requiresSpatialCheck === false,
          `${label} ${side} standard → allowed`
        );
      } else if (mode === 'replacement') {
        assert(
          res.status === 'unknown' &&
            res.reasonCode === 'replacement_construction_unconfirmed' &&
            res.requiresSpatialCheck === false,
          `${label} ${side} replacement → unknown/no spatial`
        );
      } else if (mode === 'overlay') {
        assert(
          res.status === 'unknown' &&
            res.reasonCode === 'overlay_construction_space_unconfirmed' &&
            res.requiresSpatialCheck === true,
          `${label} ${side} overlay → unknown+spatial`
        );
      } else if (mode === 'filler') {
        assert(
          res.status === 'unknown' &&
            res.reasonCode === 'filler_type_adjacency_unconfirmed' &&
            res.requiresSpatialCheck === true,
          `${label} ${side} filler → unknown+spatial`
        );
      }
    }
  }
}

// left/right independence of evaluation (same module, different sides)
{
  const ud = { isFurniture: true, __placementKindProfileId: 'kitchen_base' };
  const L = evalOpt({ side: 'left', mode: 'overlay', userData: ud });
  const R = evalOpt({ side: 'right', mode: 'filler', userData: ud });
  assert(L.reasonCode !== R.reasonCode, 'left overlay ≠ right filler reason');
  assert(L.status === 'unknown' && R.status === 'unknown', 'both unknown until construction');
}

// unsupported object
{
  const w = evalOpt({
    side: 'left',
    mode: 'standard',
    userData: { isFurniture: true, productKind: 'wardrobe' },
  });
  assert(w.status === 'denied' && w.reasonCode === 'unsupported_object', 'wardrobe → denied');
  const mapped = evalOpt({
    side: 'right',
    mode: 'overlay',
    profileId: 'floor_in_niche',
    userData: { isFurniture: true, productKind: 'wardrobe' },
  });
  assert(
    mapped.status === 'denied' && mapped.reasonCode === 'unsupported_object',
    'non-kitchen profile → denied'
  );
}

// unknown type: kitchen_* not in whitelist
{
  const u = evalOpt({
    side: 'left',
    mode: 'standard',
    profileId: 'kitchen_experimental_band',
  });
  assert(u.status === 'unknown' && u.reasonCode === 'unconfirmed_module_kind', 'unlisted kitchen_*');
}

// profile from module.userData
{
  const res = evalOpt({
    side: 'left',
    mode: 'standard',
    module: {
      userData: { __placementKindProfileId: 'kitchen_tall', isFurniture: true },
    },
  });
  assert(res.status === 'allowed' && res.moduleKind === 'tall', 'module.userData profile');
}

// --- no mutations ---
{
  const ud = {
    isFurniture: true,
    __placementKindProfileId: 'kitchen_base',
    sidePanels: { version: 1, left: { mode: 'overlay' }, right: { mode: 'filler' } },
    customWidthMm: 556,
    customDepthMm: 550,
    customHeightMm: 720,
  };
  const before = freezeClone(ud);
  const ctx = { side: 'left', mode: 'replacement', userData: ud, neighborZoneW: 600 };
  const beforeCtx = freezeClone(ctx);
  evalOpt(ctx);
  evalOpt({ side: 'right', mode: 'overlay', userData: ud });
  assert(JSON.stringify(ud) === JSON.stringify(before), 'userData not mutated');
  assert(JSON.stringify(ctx) === JSON.stringify(beforeCtx), 'context not mutated');
  assert(ud.customWidthMm === 556 && ud.customDepthMm === 550, 'W/D untouched');
  assert(ud.sidePanels.left.mode === 'overlay', 'sidePanels storage untouched');
}

// neighbor cell sizes not part of API / not required
{
  const cell = { widthMm: 600, zoneIndex: 2 };
  const before = freezeClone(cell);
  evalOpt({
    side: 'left',
    mode: 'filler',
    profileId: 'kitchen_base',
    neighborCell: cell,
  });
  assert(JSON.stringify(cell) === JSON.stringify(before), 'neighbor cell object untouched');
}

// extract helper
{
  const ud = { __kitchenProfileId: 'kitchen_wall_top' };
  assert(extractKitchenSidePanelUserData({ userData: ud }) === ud, 'extract userData');
  assert(
    resolveKitchenSidePanelProfileId({ userData: ud }) === 'kitchen_wall_top',
    'resolve __kitchenProfileId'
  );
}

console.log('');
console.log('--- summary ---');
console.log(`pass=${rows.filter((r) => r.ok).length} fail=${failed}`);
if (failed) {
  process.exit(1);
}
console.log('PASS');
