/**
 * STEP 2A: нормализация / независимость сторон / round-trip save-restore контракта.
 * node scripts/test-kitchen-side-panels-contract.mjs
 */
import {
  createDefaultKitchenSidePanels,
  normalizeKitchenSidePanels,
  normalizeKitchenSidePanelSide,
  ensureKitchenSidePanelsOnUserData,
  serializeKitchenSidePanelsFromUserData,
  applyKitchenSidePanelsToUserData,
  userDataLooksLikeKitchenModule,
  KITCHEN_SIDE_PANEL_MODES,
} from '../js/kitchen/kitchen-side-panels-contract.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('[FAIL]', msg);
  } else {
    console.log('[OK]', msg);
  }
}

// defaults
{
  const d = createDefaultKitchenSidePanels();
  assert(d.version === 1, 'default version 1');
  assert(d.left.mode === 'standard' && d.right.mode === 'standard', 'default modes standard');
  assert(d.left !== d.right, 'default left !== right ref');
}

// normalize invalid / missing
{
  const n = normalizeKitchenSidePanels(null);
  assert(n.left.mode === 'standard' && n.right.mode === 'standard', 'null → defaults');
  const bad = normalizeKitchenSidePanels({
    version: 1,
    left: { mode: 'nope' },
    right: { mode: 'OVERLAY' },
  });
  assert(bad.left.mode === 'standard', 'invalid mode → standard');
  assert(bad.right.mode === 'overlay', 'OVERLAY → overlay');
}

// independence: mutating left does not change right / sibling defaults
{
  const a = normalizeKitchenSidePanels({
    left: { mode: 'overlay', params: { note: 'A' } },
    right: { mode: 'filler' },
  });
  const b = normalizeKitchenSidePanels({
    left: { mode: 'replacement' },
    right: { mode: 'standard' },
  });
  a.left.mode = 'filler';
  if (a.left.params) a.left.params.note = 'MUT';
  assert(b.left.mode === 'replacement', 'neighbor module left not shared');
  assert(a.right.mode === 'filler', 'own right intact');
  const side1 = normalizeKitchenSidePanelSide({ mode: 'overlay' });
  const side2 = normalizeKitchenSidePanelSide({ mode: 'overlay' });
  side1.mode = 'standard';
  assert(side2.mode === 'overlay', 'side normalize returns fresh objects');
}

// modes whitelist
{
  for (const m of KITCHEN_SIDE_PANEL_MODES) {
    const s = normalizeKitchenSidePanelSide({ mode: m });
    assert(s.mode === m, `mode accepted: ${m}`);
  }
}

// kitchen heuristic + ensure
{
  const wardrobe = { isFurniture: true, productKind: 'wardrobe' };
  assert(!userDataLooksLikeKitchenModule(wardrobe), 'wardrobe not kitchen');
  assert(ensureKitchenSidePanelsOnUserData(wardrobe) == null, 'ensure skips non-kitchen');
  assert(wardrobe.sidePanels == null, 'non-kitchen ud not stamped');

  const nm = {
    isFurniture: true,
    __placementKindProfileId: 'kitchen_base',
    productKind: 'kitchen_base',
  };
  const sp = ensureKitchenSidePanelsOnUserData(nm);
  assert(sp && sp.left.mode === 'standard', 'ensure stamps kitchen default');
  assert(nm.sidePanels === sp, 'ensure writes ud.sidePanels');
}

// serialize / restore round-trip (fixture-shaped)
{
  const udSave = {
    isFurniture: true,
    __placementKindProfileId: 'kitchen_base',
    sidePanels: {
      version: 1,
      left: { mode: 'overlay', params: { future: 1 } },
      right: { mode: 'replacement' },
    },
  };
  const snap = serializeKitchenSidePanelsFromUserData(udSave);
  assert(snap && snap.left.mode === 'overlay' && snap.right.mode === 'replacement', 'serialize');
  assert(snap.left !== udSave.sidePanels.left, 'serialize clones sides');

  const udLoad = {
    isFurniture: true,
    productKind: 'kitchen_base',
    __placementKindProfileId: 'kitchen_base',
  };
  applyKitchenSidePanelsToUserData(udLoad, snap);
  assert(udLoad.sidePanels.left.mode === 'overlay', 'restore left');
  assert(udLoad.sidePanels.right.mode === 'replacement', 'restore right');
  udLoad.sidePanels.left.mode = 'standard';
  assert(snap.left.mode === 'overlay', 'restore not aliased to snap');

  // old scene without sidePanels
  const udOld = {
    isFurniture: true,
    __placementKindProfileId: 'kitchen_wall_mid',
  };
  ensureKitchenSidePanelsOnUserData(udOld);
  assert(
    udOld.sidePanels.left.mode === 'standard' && udOld.sidePanels.right.mode === 'standard',
    'old kitchen → default standard/standard'
  );
}

// upper vs lower independence
{
  const base = { isFurniture: true, productKind: 'kitchen_base', __placementKindProfileId: 'kitchen_base' };
  const top = { isFurniture: true, productKind: 'kitchen_wall_top', __placementKindProfileId: 'kitchen_wall_top' };
  ensureKitchenSidePanelsOnUserData(base);
  ensureKitchenSidePanelsOnUserData(top);
  base.sidePanels.left.mode = 'overlay';
  assert(top.sidePanels.left.mode === 'standard', 'top does not inherit base sidePanels');
}

if (failed) {
  console.error(`[kitchen-side-panels-contract] FAIL ${failed}`);
  process.exit(1);
}
console.log('[kitchen-side-panels-contract] PASS');
process.exit(0);
