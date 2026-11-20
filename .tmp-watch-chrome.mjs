import { chromium } from 'playwright';

const CDP = 'http://127.0.0.1:9334';
const browser = await chromium.connectOverCDP(CDP);
const context = browser.contexts()[0] || (await browser.newContext());
const pages = context.pages();
let page = pages.find((p) => /localhost:8100/.test(p.url())) || pages[0];
if (!page) page = await context.newPage();
if (!/localhost:8100/.test(page.url())) {
  await page.goto('http://localhost:8100/?v=20261115-upperGLeft8', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
}

const probe = await page.evaluate(() => {
  const st = () => window.__CLD_STATE_SINGLETON__ || window.state;
  window.__cldNsh1Dump = function () {
    const s = st();
    const sections = (s?.customSections || []).map((sec) => {
      const mid = sec.kitchenBandGrids?.mid;
      return {
        id: sec.id,
        wall: sec.wallName,
        lShape: !!sec.lShape,
        mid: mid
          ? {
              parts: mid.parts,
              sp: mid.specialZoneIndex,
              seat: mid.cornerSeatZoneIndex,
              seatStart: mid.cornerSeatStartMm,
              seatMm: mid.cornerSeatMm,
              w: mid.customZoneWidthsMm,
            }
          : null,
      };
    });
    const placed = [];
    try {
      s?.scene?.traverse((o) => {
        if (!o?.isGroup || !o.userData) return;
        const ud = o.userData;
        if (
          !(
            ud.isFurniture ||
            ud.__placementKindProfileId ||
            ud.catalogItemId != null ||
            ud.__kitchenUpperGSeated
          )
        )
          return;
        placed.push({
          name: ud.catalogName || ud.name || null,
          pk: ud.__placementKindProfileId || null,
          band: ud.__kitchenWallBand || ud.__kitchenUpperGBand || null,
          seat: ud.__kitchenUpperCornerSeat || null,
          g: !!(ud.__kitchenUpperGSeated || ud.__kitchenUpperGKind === 'g_arms'),
          zi: ud.zoneIndex ?? ud.__zoneIndex ?? null,
          sec: ud.sectionId || ud.__sectionId || null,
          wall: ud.wallName || null,
          cellW: ud.__kitchenCellWidthMm || ud.customWidthMm || null,
          pos: o.position
            ? {
                x: +o.position.x.toFixed(1),
                y: +o.position.y.toFixed(1),
                z: +o.position.z.toFixed(1),
              }
            : null,
        });
      });
    } catch (e) {
      placed.push({ err: String(e) });
    }
    const out = {
      bust: location.search,
      sections,
      placed,
      pending: s?._pendingZoneInfo || null,
      pendingName:
        s?.pendingFurnitureData?.name ||
        s?.pendingFurnitureData?.catalogItem?.name ||
        null,
    };
    window.__cldNsh1Last = out;
    return out;
  };
  return {
    href: location.href,
    title: document.title,
    sections: (st()?.customSections || []).length,
    probe: typeof window.__cldNsh1Dump,
  };
});

const shot = 'D:/Clodis-Kitchen/.tmp-watch-chrome.png';
await page.screenshot({ path: shot, fullPage: false });
console.log(JSON.stringify({ connected: true, probe, shot }, null, 2));
// Не закрываем Chrome — только отключаемся.
process.exit(0);
