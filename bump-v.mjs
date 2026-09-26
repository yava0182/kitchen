import { readFileSync, writeFileSync } from 'node:fs';

const from = process.argv[2];
const to = process.argv[3];
const files = [
  'js/sections/section-manager.js',
  'js/core/camera.js',
  'js/core/init.js',
  'js/furniture/furniture-actions.js',
  'js/furniture/furniture-ghost.js',
  'js/furniture/furniture-manager.js',
  'js/furniture/glb-loader.js',
  'js/sections/section-ghost.js',
  'js/sections/section-transition-manager.js',
  'js/sections/section-trim-edges.js',
  'js/ui/cabinet-markers.js',
  'js/ui/room-steps.js',
  'js/ui/scene-icons.js',
  'js/main-refactored.js',
  'js/ui/section-debug-panel.js',
  'public/admin-new.html',
  'admin-new.html',
  'index.html',
];

let total = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const parts = src.split(from);
  if (parts.length === 1) continue;
  writeFileSync(f, parts.join(to), 'utf8');
  total += parts.length - 1;
  console.log(f, parts.length - 1);
}
console.log('replaced', total);
