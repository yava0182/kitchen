/**
 * План Г: полный корпус + приставка catalog_49#2 (без левого бока).
 * node scripts/preview-g-corner-article.mjs
 */
import fs from 'fs';

const items = JSON.parse(fs.readFileSync('catalog_items/catalog_54.json', 'utf8'));
const it = items.find((x) => String(x.name || x.data?.name || '').includes('Угловой Г'));
const d = it.data || it;
const vars = { ...(d.clodisVariables || {}) };
const sx = 600;
const sy = 720;
const D = Math.round(Number(vars.corner_arm_depth_mm) || 300);

function ev(expr) {
  if (typeof expr === 'number') return expr;
  let s = String(expr).replace(/\s+/g, '');
  s = s.replace(/s:x/gi, String(sx));
  s = s.replace(/s:y/gi, String(sy));
  s = s.replace(/v:corner_arm_depth_mm/gi, String(D));
  if (!/^[-+*/().0-9]+$/.test(s)) return NaN;
  return Math.round(Function(`"use strict"; return (${s});`)());
}

const m1 = d.clodisJSON[0].children[0];
const m2 = d.clodisJSON[0].children[1];

console.log('M1', {
  name: m1.name,
  link: m1.spec?.id,
  size: m1.size,
  pos: m1.pos,
  rot: m1.rot,
});
console.log('M2', {
  name: m2.name,
  link: m2.spec?.id,
  size: m2.size,
  pos: m2.pos,
  rot: m2.rot,
  note: 'catalog_49#2 без левого бока',
});

const m1w = ev(m1.size.x);
const m1d = ev(m1.size.z);
const m2LocalX = ev(m2.size.x);
const m2LocalZ = ev(m2.size.z);
const m2PosZ = ev(m2.pos.z);
const rotY = Number(m2.rot?.y) || 0;

// Y+90: localX -> -worldZ, localZ -> +worldX; pivot at (0,0,m2PosZ)
const aabb =
  rotY === 90
    ? {
        x0: 0,
        x1: m2LocalZ,
        z0: m2PosZ - m2LocalX,
        z1: m2PosZ,
      }
    : {
        x0: ev(m2.pos.x),
        x1: ev(m2.pos.x) + m2LocalX,
        z0: ev(m2.pos.z),
        z1: ev(m2.pos.z) + m2LocalZ,
      };

console.log('M1 box', { x0: 0, x1: m1w, z0: 0, z1: m1d });
console.log('M2 AABB', aabb);

const ok =
  m1w === 600 &&
  m1d === D &&
  m2LocalX === sx - D &&
  m2LocalZ === D &&
  rotY === 90 &&
  Number(m2.spec?.id) === 2 &&
  aabb.x0 === 0 &&
  aabb.x1 === D &&
  aabb.z0 === D &&
  aabb.z1 === sx;

console.log(ok ? 'PASS приставка 300×300 у угла, link catalog_49#2' : 'FAIL');
if (!ok) process.exit(1);
