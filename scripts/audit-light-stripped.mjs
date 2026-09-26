import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const badPatterns = [
  { name: 'ikea-room-light-v0', re: /ikea-room-light-v0/ },
  { name: 'ikea-v0-manifest import', re: /ikea-v0-manifest/ },
  { name: 'ikea-light-gate', re: /ikea-light-gate/ },
  { name: 'v0 runtime calls', re: /loadIkeaRoomEnvV0|installIkeaRoomLightV0|syncIkeaRoomLightV0/ },
  { name: 'betrakta env helpers', re: /betrakta-env-sh|betrakta-babylon-env/ },
  { name: 'frozen room light modules', re: /room-betrakta|room-soft-shadow|room-ao\.js|room-cabinet-shadow/ },
  { name: 'v0check cache bust', re: /20260828-v0check/ },
  { name: 'betrakta-sot import', re: /from ['"].*betrakta-sot/ },
  { name: 'ikea preset id', re: /id:\s*['"]ikea['"]/ },
  { name: 'HemisphereLight in core', re: /new THREE\.HemisphereLight/, scope: 'js/core' },
  { name: 'AmbientLight in core', re: /new THREE\.AmbientLight/, scope: 'js/core' },
  { name: 'SpotLight in core', re: /new THREE\.SpotLight/, scope: 'js/core' },
  { name: 'EffectComposer in core', re: /new THREE\.EffectComposer|EffectComposer\(/, scope: 'js/core' },
];

const skipDir = /^(docs|node_modules|\.git|scripts)/;
const exts = new Set(['.js', '.html', '.mjs', '.ts']);
const hits = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.relative(root, path.join(dir, ent.name)).replace(/\\/g, '/');
    if (skipDir.test(rel)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (exts.has(path.extname(ent.name))) {
      const txt = fs.readFileSync(p, 'utf8');
      for (const pat of badPatterns) {
        if (pat.scope && !rel.startsWith(pat.scope.replace(/\\/g, '/'))) continue;
        if (pat.re.test(txt)) hits.push({ file: rel, pattern: pat.name });
      }
    }
  }
}

const missing = [
  'js/furniture/ikea-room-light-v0.js',
  'js/furniture/ikea-v0-manifest.js',
  'js/furniture/ikea-light-gate.js',
  'js/furniture/betrakta-env-sh.js',
  'js/core/betrakta-babylon-env.js',
].map((f) => ({ file: f, exists: fs.existsSync(path.join(root, f)) }));

walk(root);

console.log('=== LIGHT STRIPPED AUDIT ===');
console.log('Bad pattern hits:', hits.length);
for (const h of hits) console.log('  FAIL', h.file, '->', h.pattern);
console.log('Deleted engine files (must be absent):');
for (const m of missing) console.log(' ', m.exists ? 'FAIL still exists' : 'OK absent', m.file);

const required = [
  'js/core/room-lighting-presets.js',
  'js/furniture/room-cabinet-studio.js',
  'js/furniture/betrakta-sot.js',
];
console.log('Required reference/stub files:');
for (const f of required) {
  const ok = fs.existsSync(path.join(root, f));
  console.log(' ', ok ? 'OK' : 'MISSING', f);
}

process.exit(hits.length || missing.some((m) => m.exists) ? 1 : 0);
