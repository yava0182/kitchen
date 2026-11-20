#!/usr/bin/env node
/**
 * Снимок / откат узкого слоя (копии файлов в .rollback/<tag>/).
 *
 *   node scripts/layer-checkpoint.mjs save <tag> [file...]
 *   node scripts/layer-checkpoint.mjs restore <tag>
 *   node scripts/layer-checkpoint.mjs list
 *   node scripts/layer-checkpoint.mjs show <tag>
 *
 * Без списка файлов на save — пресет overlays (см. PRESETS).
 * Пути относительно корня репо. Не коммитит. Не трогает git.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ROLLBACK_DIR = path.join(ROOT, '.rollback');

/** Именованные наборы — что копировать «на всякий случай» перед рискованным слоем. */
const PRESETS = {
  overlays: [
    'js/kitchen/kitchen-side-panels-overlay-api.js',
    'js/kitchen/kitchen-side-panels-scene-adapter.js',
    'js/kitchen/kitchen-side-panels-clearance.js',
    'js/kitchen/kitchen-section-layout.js',
    'js/kitchen/kitchen-base-engine.js',
    'js/kitchen/kitchen-run-overlays.js',
    'js/main-refactored.js',
    'js/kitchen/kitchen-section-engine.js',
    'js/ui/scene-icons.js',
    'index.html',
    'docs/KITCHEN-RULES.md',
    '.cursor/rules/side-panels-column-pad.mdc',
  ],
  plinth: [
    'js/kitchen/kitchen-run-overlays.js',
    'js/kitchen/kitchen-section-engine.js',
    'js/main-refactored.js',
    'index.html',
    'docs/KITCHEN-RULES.md',
    '.cursor/rules/plinth-run-front.mdc',
  ],
};

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  node scripts/layer-checkpoint.mjs save <tag> [--preset=overlays|plinth] [file...]
  node scripts/layer-checkpoint.mjs restore <tag>
  node scripts/layer-checkpoint.mjs list
  node scripts/layer-checkpoint.mjs show <tag>`);
}

function safeTag(tag) {
  const t = String(tag || '').trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,80}$/.test(t)) {
    die(`Bad tag: ${tag} (letters/digits/._- only)`);
  }
  return t;
}

function relKey(filePath) {
  return String(filePath)
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
}

function destFor(tag, rel) {
  // js/kitchen/foo.js → js__kitchen__foo.js (как старые .rollback)
  const flat = relKey(rel).replace(/\//g, '__');
  return path.join(ROLLBACK_DIR, tag, flat);
}

function parseSaveArgs(argv) {
  let preset = 'overlays';
  const files = [];
  for (const a of argv) {
    if (a.startsWith('--preset=')) {
      preset = a.slice('--preset='.length);
      continue;
    }
    if (a === '--preset') continue;
    files.push(a);
  }
  return { preset, files };
}

function save(tag, presetName, extraFiles) {
  const preset = presetName ? PRESETS[presetName] : null;
  if (presetName && !preset) {
    die(`Unknown preset "${presetName}". Known: ${Object.keys(PRESETS).join(', ')}`);
  }
  if (!preset && !(extraFiles && extraFiles.length)) {
    die('Nothing to save: pass --preset=… or file paths');
  }
  const list = [...(preset || []), ...(extraFiles || [])].map(relKey);
  const uniq = [...new Set(list)];
  const dir = path.join(ROLLBACK_DIR, tag);
  fs.mkdirSync(dir, { recursive: true });

  const manifest = {
    tag,
    savedAt: new Date().toISOString(),
    preset: presetName || null,
    files: [],
  };

  for (const rel of uniq) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src) || !fs.statSync(src).isFile()) {
      console.warn(`skip missing: ${rel}`);
      continue;
    }
    const dest = destFor(tag, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    manifest.files.push({ rel, flat: path.basename(dest) });
    console.log(`saved  ${rel}`);
  }

  fs.writeFileSync(
    path.join(dir, 'MANIFEST.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );
  console.log(`\nOK checkpoint → .rollback/${tag}/ (${manifest.files.length} files)`);
  console.log(`Restore: npm run layer:restore -- ${tag}`);
}

function restore(tag) {
  const dir = path.join(ROLLBACK_DIR, tag);
  const manPath = path.join(dir, 'MANIFEST.json');
  if (!fs.existsSync(manPath)) {
    // Legacy flat folders without MANIFEST: restore *.js by __ → /
    if (!fs.existsSync(dir)) die(`No checkpoint: .rollback/${tag}`);
    const flats = fs.readdirSync(dir).filter((f) => f.includes('__') || f.endsWith('.js'));
    if (!flats.length) die(`No MANIFEST.json and no flat files in .rollback/${tag}`);
    console.warn('Legacy restore (no MANIFEST) — best-effort from flat names');
    for (const flat of flats) {
      const rel = flat.replace(/__/g, '/');
      const dest = path.join(ROOT, rel);
      const src = path.join(dir, flat);
      if (!fs.existsSync(src)) continue;
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`restored ${rel}`);
    }
    console.log(`\nOK restore (legacy) from .rollback/${tag}/`);
    console.log('Bump bust in index.html / imports manually if needed.');
    return;
  }

  const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
  for (const entry of man.files || []) {
    const rel = entry.rel;
    const flat = entry.flat || path.basename(destFor(tag, rel));
    const src = path.join(dir, flat);
    const dest = path.join(ROOT, rel);
    if (!fs.existsSync(src)) {
      console.warn(`missing in checkpoint: ${flat}`);
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`restored ${rel}`);
  }
  console.log(`\nOK restore from .rollback/${tag}/ (${(man.files || []).length} files)`);
  console.log('Open with a NEW bust (or the tag bust) after restore.');
}

function list() {
  if (!fs.existsSync(ROLLBACK_DIR)) {
    console.log('(no .rollback yet)');
    return;
  }
  const tags = fs
    .readdirSync(ROLLBACK_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const t of tags) {
    const manPath = path.join(ROLLBACK_DIR, t, 'MANIFEST.json');
    if (fs.existsSync(manPath)) {
      const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
      console.log(`${t}\t${man.savedAt || '?'}\t${(man.files || []).length} files`);
    } else {
      console.log(`${t}\t(legacy, no MANIFEST)`);
    }
  }
}

function show(tag) {
  const manPath = path.join(ROLLBACK_DIR, tag, 'MANIFEST.json');
  if (!fs.existsSync(manPath)) die(`No MANIFEST for .rollback/${tag}`);
  console.log(fs.readFileSync(manPath, 'utf8'));
}

const [cmd, tagArg, ...rest] = process.argv.slice(2);
if (!cmd || cmd === '-h' || cmd === '--help') {
  usage();
  process.exit(0);
}

if (cmd === 'list') {
  list();
} else if (cmd === 'show') {
  show(safeTag(tagArg));
} else if (cmd === 'save') {
  const tag = safeTag(tagArg);
  const { preset, files } = parseSaveArgs(rest);
  // If user passed only files and no --preset, still use overlays unless files alone?
  // Convention: explicit files REPLACE preset only if --preset=none
  let presetName = preset;
  if (rest.includes('--preset=none') || preset === 'none') {
    presetName = null;
    save(tag, null, files);
  } else {
    save(tag, presetName, files);
  }
} else if (cmd === 'restore') {
  restore(safeTag(tagArg));
} else {
  usage();
  die(`Unknown command: ${cmd}`);
}
