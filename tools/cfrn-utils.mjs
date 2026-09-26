/**
 * Shared helpers for CFRN (Bazis / Clodis export zip) read & transform.
 */
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

export const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function roundMm(v, digits = 3) {
  if (v == null || !Number.isFinite(v)) return null;
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

export function roundVec3(v, digits = 3) {
  if (!v) return null;
  return {
    x: roundMm(v.x, digits),
    y: roundMm(v.y, digits),
    z: roundMm(v.z, digits),
  };
}

/** column-major 4×4 (Three.js style) */
export function mat4Multiply(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[r + 4 * k] * b[k + 4 * c];
      o[r + 4 * c] = s;
    }
  }
  return o;
}

export function transformPoint(m, p) {
  const x = Number(p?.x) || 0;
  const y = Number(p?.y) || 0;
  const z = Number(p?.z) || 0;
  return {
    x: m[0] * x + m[4] * y + m[8] * z + m[12],
    y: m[1] * x + m[5] * y + m[9] * z + m[13],
    z: m[2] * x + m[6] * y + m[10] * z + m[14],
  };
}

export function transformDir(m, d) {
  const x = Number(d?.x) || 0;
  const y = Number(d?.y) || 0;
  const z = Number(d?.z) || 0;
  const vx = m[0] * x + m[4] * y + m[8] * z;
  const vy = m[1] * x + m[5] * y + m[9] * z;
  const vz = m[2] * x + m[6] * y + m[10] * z;
  const len = Math.hypot(vx, vy, vz) || 1;
  return { x: vx / len, y: vy / len, z: vz / len };
}

export async function loadCfrnFile(filePath) {
  const abs = path.resolve(filePath);
  const buf = fs.readFileSync(abs);

  if (abs.toLowerCase().endsWith('.json')) {
    return { source: abs, fileJson: JSON.parse(buf.toString('utf8')) };
  }

  const zip = await JSZip.loadAsync(buf);
  const entry = zip.file('file.json');
  if (!entry) throw new Error('В архиве нет file.json — это не CFRN?');
  const fileJson = JSON.parse(await entry.async('string'));
  return { source: abs, fileJson, zip };
}

export function resolveHoleSpec(table, infoIndex) {
  const holes = table?.holes || [];
  const idx = Number(infoIndex);
  if (!Number.isFinite(idx) || idx < 0 || idx >= holes.length) return null;
  const h = holes[idx];
  return {
    infoIndex: idx,
    diameter: h?.diameter ?? h?.d ?? null,
    depth: h?.depth ?? h?.h ?? null,
  };
}

export function resolveMaterialName(table, obj) {
  const mats = table?.materials || [];
  const mi = obj?.materialIndex;
  if (Number.isFinite(mi) && mats[mi]) {
    return mats[mi].name || mats[mi].art || `material#${mi}`;
  }
  if (obj?.materialArt) return obj.materialArt;
  return '';
}

export function panelSizeFromContour(contour) {
  if (!contour?.list?.length) return null;
  let maxX = 0;
  let maxY = 0;
  for (const seg of contour.list) {
    for (const key of ['pos1', 'pos2']) {
      const p = seg[key];
      if (!p) continue;
      if (Number(p.x) > maxX) maxX = Number(p.x);
      if (Number(p.y) > maxY) maxY = Number(p.y);
    }
  }
  if (maxX <= 0 || maxY <= 0) return null;
  return { width: roundMm(maxX), height: roundMm(maxY) };
}
