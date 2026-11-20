/**
 * STEP 3A: overlay inject + worktop extend (no THREE).
 * node scripts/test-kitchen-side-panels-overlay-geometry.mjs
 */
import {
  applyKitchenSidePanelOverlayToClodisRoots,
  SIDE_PANEL_OVERLAY_ID_LEFT,
  SIDE_PANEL_OVERLAY_NAME_LEFT,
} from '../js/kitchen/kitchen-side-panels-overlay-geometry.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('[FAIL]', msg);
  } else console.log('[OK]', msg);
}

function sampleRoots() {
  return [
    {
      type: 'section',
      layout_role: 'cabinet_root',
      size: { x: 's:x', y: 's:y', z: 's:z' },
      children: [
        {
          type: 'module',
          name: 'Стол рабочий',
          layout_role: 'corpus',
          size: { x: 's:x', y: 's:y-v:h_bottom', z: 's:z' },
          pos: { x: 0, y: 'v:h_bottom', z: 0 },
          children: [
            {
              type: 'wall',
              name: 'Бок левый',
              spec: {
                side: 'left',
                orientation: 'v',
                material: { group: 'g0', key: 'material_2' },
              },
            },
          ],
        },
        {
          type: 'module',
          name: 'Столешница НМ',
          spec: { element_type: 'catalog_53' },
          size: { x: 's:x', y: 38, z: 600 },
          pos: { x: 0, y: 's:y', z: 's:z+40' },
          pivot: { x: -1, y: -1, z: 1 },
        },
      ],
    },
  ];
}

{
  const roots = sampleRoots();
  const r = applyKitchenSidePanelOverlayToClodisRoots(roots, {
    sidePanels: { left: { mode: 'overlay' }, right: { mode: 'standard' } },
  });
  assert(r.left === true && r.right === false, 'left overlay on');
  const cab = roots[0];
  const ov = cab.children.find((c) => c.id === SIDE_PANEL_OVERLAY_ID_LEFT);
  assert(!!ov, 'overlay node injected');
  assert(ov.name === SIDE_PANEL_OVERLAY_NAME_LEFT, 'overlay name');
  assert(ov.size.x === 16, 'thickness 16');
  assert(ov.pos.x === -16, 'outside left');
  assert(ov.spec.orientation === 'v', 'vertical wall');
  const wt = cab.children.find((c) => /столеш/i.test(c.name));
  assert(wt.size.x === 's:x+16', 'worktop extended +16');
  assert(wt.pos.x === -16, 'worktop shifted left');
  assert(wt.pos.z === 's:z+40', 'worktop front/rear rule kept');
  assert(wt.size.z === 600, 'worktop depth kept');
}

{
  const roots = sampleRoots();
  applyKitchenSidePanelOverlayToClodisRoots(roots, {
    sidePanels: { left: { mode: 'overlay' }, right: { mode: 'standard' } },
  });
  applyKitchenSidePanelOverlayToClodisRoots(roots, {
    sidePanels: { left: { mode: 'standard' }, right: { mode: 'standard' } },
  });
  const cab = roots[0];
  assert(!cab.children.some((c) => c.id === SIDE_PANEL_OVERLAY_ID_LEFT), 'overlay removed');
  const wt = cab.children.find((c) => /столеш/i.test(c.name));
  assert(wt.size.x === 's:x' && wt.pos.x === 0, 'worktop restored');
}

{
  const roots = sampleRoots();
  const beforeW = JSON.stringify(roots[0].children.find((c) => c.layout_role === 'corpus').size);
  applyKitchenSidePanelOverlayToClodisRoots(roots, {
    sidePanels: { right: { mode: 'overlay' }, left: { mode: 'standard' } },
  });
  const afterW = JSON.stringify(roots[0].children.find((c) => c.layout_role === 'corpus').size);
  assert(beforeW === afterW, 'corpus size unchanged');
  const ov = roots[0].children.find((c) => c.id === 'cld_side_panel_overlay_right');
  assert(ov && ov.pos.x === 's:x', 'right overlay at s:x');
  const wt = roots[0].children.find((c) => /столеш/i.test(c.name));
  assert(wt.size.x === 's:x+16' && wt.pos.x === 0, 'right: worktop +16 from 0');
}

if (failed) {
  console.error('FAIL', failed);
  process.exit(1);
}
console.log('[kitchen-side-panels-overlay-geometry] PASS');
