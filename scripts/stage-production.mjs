#!/usr/bin/env node
/**
 * Сборка папки для хостинга: копирует проект без путей из .deployignore.
 * Запуск: node scripts/stage-production.mjs [outDir]
 * По умолчанию: dist-production/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.resolve(ROOT, process.argv[2] || 'dist-production');
const IGNORE_FILE = path.join(ROOT, '.deployignore');

function loadIgnorePatterns() {
  if (!fs.existsSync(IGNORE_FILE)) return [];
  return fs
    .readFileSync(IGNORE_FILE, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

function relPosix(p) {
  return p.split(path.sep).join('/');
}

function shouldIgnore(rel, patterns) {
  const r = relPosix(rel).toLowerCase();
  for (const pat of patterns) {
    const p = pat.toLowerCase().replace(/\\/g, '/');
    if (!p) continue;
    if (p.endsWith('/')) {
      if (r.startsWith(p) || r.includes('/' + p)) return true;
      continue;
    }
    if (p.includes('*')) {
      const re = new RegExp(
        '^' +
          p
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '§§')
            .replace(/\*/g, '[^/]*')
            .replace(/§§/g, '.*') +
          '$',
        'i'
      );
      if (re.test(r) || r.split('/').some((seg) => re.test(seg))) return true;
      continue;
    }
    if (r === p || r.startsWith(p + '/') || r.endsWith('/' + p) || r.includes('/' + p + '/')) {
      return true;
    }
  }
  return false;
}

const OUT_BASENAME = path.basename(OUT);
const HARD_SKIP_DIRS = new Set(['node_modules', '.git', 'dist-production', OUT_BASENAME]);

function copyRecursive(srcDir, destDir, baseRel, patterns) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    if (HARD_SKIP_DIRS.has(ent.name)) continue;
    const rel = path.join(baseRel, ent.name);
    if (shouldIgnore(rel, patterns)) continue;
    const src = path.join(srcDir, ent.name);
    const dest = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyRecursive(src, dest, rel, patterns);
    } else if (ent.isFile()) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

const patterns = loadIgnorePatterns();
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
}
fs.mkdirSync(OUT, { recursive: true });
copyRecursive(ROOT, OUT, '', patterns);

const readme = `# Production staging

Собрано scripts/stage-production.mjs — без dev-рефа (.deployignore).

Запуск на сервере:
  cd dist-production
  npm ci --omit=dev
  NODE_ENV=production PORT=8000 node server.js
`;
fs.writeFileSync(path.join(OUT, 'STAGING_README.txt'), readme, 'utf8');

console.log(`✅ Staged production tree → ${OUT}`);
console.log(`   Ignored patterns: ${patterns.length}`);
