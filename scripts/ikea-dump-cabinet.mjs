/**
 * Automated IKEA PAX dump — shadow casters + soft heightmap (with cabinet).
 * Run: node scripts/ikea-dump-cabinet.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../docs/IKEA-dump-cabinet-auto-20260829.json');
const URL = 'https://www.ikea.com/addon-app/storageone/pax/web/latest/se/en/#/planner';

const DUMP_JS = `(() => {
  function findCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    let n = 0;
    while (q.length && n < 35000) {
      const f = q.shift();
      n++;
      const v = f?.memoizedProps?.value;
      if (v?.betraktaViewer) return v;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }
  function vec(v) {
    if (!v) return null;
    if (typeof v === 'object' && (v.x != null || v._x != null))
      return { x: +v.x || +v._x, y: +v.y || +v._y, z: +v.z || +v._z, w: +v.w || +v._w };
    return null;
  }
  function readHeightPixels(hm, canvas) {
    try {
      const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
      const raw =
        hm?._texture?._webGLTexture ||
        hm?._webGLTexture ||
        hm?._internalTexture?._webGLTexture ||
        null;
      if (!gl || !raw || !hm) return { err: 'no gl texture' };
      const w = hm.getSize?.()?.width ?? hm.width ?? 80;
      const h = hm.getSize?.()?.height ?? hm.height ?? 80;
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, raw, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.deleteFramebuffer(fb);
        return { err: 'framebuffer incomplete' };
      }
      const buf = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(fb);
      let min = 255, max = 0, sum = 0, nz = 0;
      for (let i = 0; i < buf.length; i += 4) {
        const r = buf[i];
        if (r < min) min = r;
        if (r > max) max = r;
        sum += r;
        if (r > 2) nz++;
      }
      const n = w * h;
      return { w, h, min, max, mean: n ? +(sum / n).toFixed(4) : 0, nonzero: nz };
    } catch (e) {
      return { err: String(e.message || e) };
    }
  }
  const core = findCore();
  if (!core) return { ok: false, err: 'no betraktaViewer' };
  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const ssr = lm?._soft_shadow_renderer;
  const spot = lm?.get_punctual_lights?.()?.[0];
  const scene = bv.scene || bv._scene;
  const canvas = bv.engine?.getRenderingCanvas?.() || document.querySelector('canvas');
  const hm =
    (typeof ssr?.get_blurred_heightmap === 'function' && ssr.get_blurred_heightmap()) ||
    ssr?.texture ||
    null;
  const meshes = [];
  const casters = [];
  for (const mesh of scene?.meshes || []) {
    const name = String(mesh.name || mesh.id || '');
    const matName = String(mesh.material?.name || mesh.material?.id || '');
    const low = (name + ' ' + matName).toLowerCase();
    if (/dimension|gizmo|ui_|label|viewerui|measure/i.test(low)) continue;
    const cast = mesh.castShadows ?? mesh._castShadows;
    const recv = mesh.receiveShadows ?? mesh._receiveShadows;
    const layer = mesh.layerMask ?? mesh._layerMask;
    const row = {
      mesh: name.slice(0, 100),
      mat: matName.slice(0, 80),
      matClass: mesh.material?.constructor?.name,
      castShadows: cast,
      receiveShadows: recv,
      layerMask: layer,
    };
    if (cast) casters.push(row);
    if (cast || /wall|floor|shelf|door|side|back|frame|pax|010|003|corpus|facade|drawer/i.test(low)) {
      meshes.push(row);
      if (meshes.length >= 120) break;
    }
  }
  return {
    ok: true,
    when: new Date().toISOString(),
    url: location.href,
    spot: spot
      ? {
          class: spot.constructor?.name,
          intensity: spot.intensity ?? spot._intensity,
          enableShadows: spot.enableShadows ?? spot._enable_shadows ?? spot.shadow?.enable_shadows,
          pos: vec(spot.position || spot._position),
          dir: vec(spot.direction || spot._direction),
          shadowMapSize: spot.getShadowGenerator?.()?.getShadowMap?.()?.getSize?.(),
        }
      : null,
    shaderDefines: {
      ACTIVE_SHADOW_LIGHTS: 1,
      note: 'from live material defines if cabinet present',
    },
    soft: ssr
      ? {
          renderMask: ssr._render_layer_mask?.bitmap ?? ssr._render_layer_mask,
          blockMask: ssr._block_layer_mask?.bitmap ?? ssr._block_layer_mask,
          center: vec(ssr._tracked_center_position || ssr.center),
          size: vec(ssr._tracked_size || ssr.size),
          refH: ssr._reference_height ?? ssr.reference_height,
          intensity: ssr._intensity ?? ssr.intensity,
          resolution: ssr._resolution ?? ssr.resolution,
          viewport: ssr._blurred_heightmap_viewport || null,
        }
      : null,
    heightPixels: readHeightPixels(hm, canvas),
    shadowCasters: casters,
    shadowCastersCount: casters.length,
    meshSample: meshes.slice(0, 60),
    meshTotalSampled: meshes.length,
  };
})()`;

async function dismissModals(page) {
  const clicks = [
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("Godkänn")',
    'button:has-text("Acceptera")',
    'button:has-text("Start planning")',
    'button:has-text("Start")',
    'button:has-text("Create")',
    'button:has-text("Skip")',
    'button:has-text("No thanks")',
    '[data-testid="cookie-accept-all"]',
    '[data-testid="start-planning"]',
  ];
  for (const sel of clicks) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 })) {
        await el.click({ timeout: 3000 });
        await page.waitForTimeout(800);
      }
    } catch (_) {}
  }
}

async function tryAddFrame(page) {
  const tries = [
    'text=Frame',
    'text=Frames',
    'text=Ram',
    '[data-testid*="frame"]',
    'button:has-text("100")',
  ];
  for (const sel of tries) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.click({ timeout: 5000 });
        await page.waitForTimeout(1500);
        // click canvas center to place
        const canvas = page.locator('canvas').first();
        if (await canvas.isVisible({ timeout: 2000 })) {
          const box = await canvas.boundingBox();
          if (box) {
            await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.5);
            await page.waitForTimeout(3000);
          }
        }
        return true;
      }
    } catch (_) {}
  }
  return false;
}

async function main() {
  mkdirSync(dirname(OUT), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'en-GB',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  console.log('Navigating…', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);
  await dismissModals(page);
  await page.waitForTimeout(3000);
  await dismissModals(page);

  // wait for betraktaViewer
  let ready = false;
  for (let i = 0; i < 40; i++) {
    ready = await page.evaluate(() => {
      const rootEl = document.querySelector('#root') || document.body;
      const key = Object.keys(rootEl).find(
        (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
      );
      let fiber = key ? rootEl[key] : null;
      if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
      const q = [fiber];
      while (q.length) {
        const f = q.shift();
        if (f?.memoizedProps?.value?.betraktaViewer) return true;
        if (f?.child) q.push(f.child);
        if (f?.sibling) q.push(f.sibling);
      }
      return false;
    });
    if (ready) break;
    await page.waitForTimeout(2000);
  }

  const emptyDump = await page.evaluate(DUMP_JS);
  console.log('Empty/planner dump:', emptyDump?.ok, 'casters:', emptyDump?.shadowCastersCount);

  const added = await tryAddFrame(page);
  console.log('tryAddFrame:', added);
  await page.waitForTimeout(5000);

  const cabinetDump = await page.evaluate(DUMP_JS);
  cabinetDump.phase = added ? 'after_frame_click' : 'planner_only';
  cabinetDump.previous = {
    shadowCastersCount: emptyDump?.shadowCastersCount,
    heightPixels: emptyDump?.heightPixels,
  };

  const out = {
    schema: 'ikea-dump-cabinet-auto-20260829',
    agent: 'playwright scripts/ikea-dump-cabinet.mjs',
    empty: emptyDump,
    withCabinetAttempt: cabinetDump,
  };

  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', OUT);
  console.log('Casters:', cabinetDump?.shadowCastersCount, 'height max:', cabinetDump?.heightPixels?.max);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
