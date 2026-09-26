/**
 * ⚠️  ЭТОТ СКРИПТ НЕ НУЖЕН — НЕ ЗАПУСКАТЬ.
 *
 * server.js использует `app.use(express.static(__dirname))`, поэтому
 * `/js/admin/admin-new-bundle.js` отдаётся НАПРЯМУЮ из папки `js/admin/`.
 * Папка `public/js/admin/` монтируется по URL `/public/js/admin/…` и
 * браузером не запрашивается — это мёртвая копия.
 *
 * ЕДИНСТВЕННЫЙ файл, который нужно редактировать:
 *   Configurator-Clodis-ThreeJS-7/js/admin/admin-new-bundle.js
 *
 * Копирование в public/ не нужно, не запускайте sync.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'js', 'admin');
const outDir = path.join(projectRoot, 'public', 'js', 'admin');
 
const files = [
  'admin-new-bundle.js',
  'admin-new-main.js',
  'admin-new-part1.js',
  'admin-new-part2.js',
  'admin-new-part3.js',
  'admin-debug-probe.js',
];
 
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
 
function copyFile(name) {
  const src = path.join(srcDir, name);
  const dst = path.join(outDir, name);
  if (!fs.existsSync(src)) {
    throw new Error(`Source file not found: ${src}`);
  }
  fs.copyFileSync(src, dst);
  const st = fs.statSync(dst);
  return { name, bytes: st.size };
}
 
function main() {
  ensureDir(outDir);
  const copied = files.map(copyFile);
  // eslint-disable-next-line no-console
  console.log('[sync-public-admin] copied:', copied);
}
 
main();
