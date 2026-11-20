#!/usr/bin/env node
/**
 * Freeze накладок (L footprint + user widths): npm run freeze:overlays
 * Чужой слой не должен ломать эти критерии. Доработка накладок =
 * открыть слой явно и обновить этот скрипт в той же сессии.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function md5_8(rel) {
  return crypto
    .createHash('md5')
    .update(fs.readFileSync(path.join(root, rel)))
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
}

let failed = 0;
function fail(msg) {
  failed += 1;
  console.error('[OVERLAYS-FREEZE]', msg);
}

const layout = read('js/kitchen/kitchen-section-layout.js');
const api = read('js/kitchen/kitchen-side-panels-overlay-api.js');

// 1) Footprint = прямая ИЛИ L/U parts≥2
if (!/export function isKitchenSidePanelFootprintSection\(/.test(layout)) {
  fail('missing isKitchenSidePanelFootprintSection');
}
if (!/return parts >= 2/.test(layout)) {
  fail('footprint must allow L/U with parts >= 2');
}

// 2) columnOverlayCase через footprint, не только straight
if (!/_columnOverlayCase\(/.test(api)) {
  fail('missing _columnOverlayCase');
}
if (!/isKitchenSidePanelFootprintSection\(section\)/.test(api)) {
  fail('overlay-api must gate column case via isKitchenSidePanelFootprintSection');
}
if (
  /function _columnOverlayCase[\s\S]{0,220}isKitchenStraightBaseBandSection\(section\)/.test(
    api
  )
) {
  fail('_columnOverlayCase must not use only isKitchenStraightBaseBandSection');
}

// 3) L free-arm: user-ширины не затирать basePlan (наклейка 616→600)
if (
  !/User-ширины \(карандаш \/ накладки footprint\): BASE не пересобирать/.test(
    layout
  )
) {
  fail('missing user-widths preserve comment in L free-arm (canon pin)');
}
if (
  !/User BASE \(карандаш \/ накладки колонки\): не затирать MID\/TOP/.test(
    layout
  )
) {
  fail('missing MID/TOP preserve when userWidths in L free-arm');
}
if (!/tallColumnPay/.test(api)) {
  fail('missing tallColumnPay: MID/TOP write when parts ≠ BASE');
}
const preserveIdx = layout.indexOf(
  'User-ширины (карандаш / накладки footprint): BASE не пересобирать'
);
const preserveSlice = layout.slice(preserveIdx, preserveIdx + 700);
if (/\{\s*\.\.\.basePlan\.widthsMap\s*\}/.test(preserveSlice)) {
  fail(
    'applyKitchenLFreeArm user-branch must not write customZoneWidthsMm from basePlan'
  );
}
if (
  /User уже правил спец: пересобрать плечо 600\+жертва под текущий W спец/.test(
    layout
  )
) {
  fail('old user-branch rebuild comment still present (wipes overlay pads)');
}

// 4) Канон: не выравнивать MID parts к BASE (пин в комментарии overlay-api)
if (!/align MID→BASE ломал комнату/.test(api)) {
  fail('missing MID→BASE align forbid pin in overlay-api');
}
if (/division\.parts\s*=\s*baseP\b|mid\.parts\s*=\s*baseP\b/.test(api)) {
  fail('forbidden rewrite of band parts to baseP in overlay-api');
}

const pins = {
  'js/kitchen/kitchen-section-layout.js': md5_8(
    'js/kitchen/kitchen-section-layout.js'
  ),
  'js/kitchen/kitchen-side-panels-overlay-api.js': md5_8(
    'js/kitchen/kitchen-side-panels-overlay-api.js'
  ),
};
console.log('[OVERLAYS-FREEZE] pins', pins);
if (failed) {
  console.error('[OVERLAYS-FREEZE] FAIL ' + failed);
  process.exit(1);
}
console.log('[OVERLAYS-FREEZE] PASS L-footprint + user-widths preserve');
