/**
 * Сохранить clodis JSON из файла или stdin в reference_b3d/.
 *
 *   node tools/import-reference-clodis-json.mjs --id 88 --name shablony_korpusov < pasted.json
 *   node tools/import-reference-clodis-json.mjs --id 89 --in path/to.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const refDir = path.join(root, 'reference_b3d');

function parseArgs(argv) {
  const out = { id: '', name: 'shablony_korpusov', in: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--id' && argv[i + 1]) out.id = String(argv[++i]).trim();
    else if (a === '--name' && argv[i + 1]) out.name = String(argv[++i]).trim();
    else if ((a === '--in' || a === '-i') && argv[i + 1]) out.in = String(argv[++i]).trim();
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

async function readInput(inPath) {
  if (inPath) return fs.readFileSync(path.resolve(inPath), 'utf8');
  return await new Promise((resolve, reject) => {
    let s = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { s += c; });
    process.stdin.on('end', () => resolve(s));
    process.stdin.on('error', reject);
  });
}

function updateManifest(entry) {
  const manifestPath = path.join(refDir, 'REFERENCE_MANIFEST.json');
  let manifest = { version: 1, items: [] };
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {}
  }
  if (!Array.isArray(manifest.items)) manifest.items = [];
  const idx = manifest.items.findIndex((x) => x.catalogId === entry.catalogId);
  if (idx >= 0) manifest.items[idx] = { ...manifest.items[idx], ...entry };
  else manifest.items.push(entry);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

const args = parseArgs(process.argv);
if (args.help || !args.id) {
  console.error('Usage: node tools/import-reference-clodis-json.mjs --id 88 [--name shablony_korpusov] [--in file.json]');
  process.exit(args.help ? 0 : 1);
}

const raw = await readInput(args.in);
const trimmed = raw.trim().replace(/^id\s+\d+\s*/i, '');
const data = JSON.parse(trimmed);
const fileName = `clodis-${args.name}-id${args.id}.json`;
const outPath = path.join(refDir, fileName);
fs.mkdirSync(refDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');

updateManifest({
  catalogId: args.id,
  elementType: args.name,
  label: data[0]?.name || `catalog ${args.id}`,
  file: fileName,
  savedAt: new Date().toISOString().slice(0, 10),
});

console.log('OK', outPath);
console.log('bytes', fs.statSync(outPath).size);
