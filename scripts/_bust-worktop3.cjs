const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const replaceIn = (rel, from, to) => {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, 'utf8');
  const n = (s.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  s = s.split(from).join(to);
  fs.writeFileSync(p, s);
  return n;
};

replaceIn('index.html', '20261022-worktop2', '20261022-worktop3');
replaceIn('js/main-refactored.js', '20261022-worktop2', '20261022-worktop3');
replaceIn('js/kitchen/kitchen-depth-stack.js', '20261022-worktop2', '20261022-worktop3');
replaceIn('js/kitchen/kitchen-section-engine.js', '20261022-worktop2', '20261022-worktop3');
replaceIn('js/main-refactored.js', 'kitchen-base-engine.js?v=20261022-bust1', 'kitchen-base-engine.js?v=20261022-worktop3');
replaceIn(
  'js/furniture/furniture-manager.js',
  'kitchen-base-engine.js?v=20261022-bust1',
  'kitchen-base-engine.js?v=20261022-worktop3'
);

const pub = path.join(root, 'public');
const copyList = [
  'index.html',
  'js/main-refactored.js',
  'js/furniture/furniture-manager.js',
  'js/kitchen/kitchen-run-overlays.js',
  'js/kitchen/kitchen-base-engine.js',
  'js/kitchen/kitchen-depth-stack.js',
  'js/kitchen/kitchen-section-engine.js',
];
for (const rel of copyList) {
  const src = path.join(root, rel);
  const dst = path.join(pub, rel);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}
console.log('ok worktop3');
