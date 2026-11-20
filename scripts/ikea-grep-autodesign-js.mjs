/**
 * Grep локальных дампов IKEA JS на AutoDesign / solutions / water / linear.
 *
 *   node scripts/ikea-grep-autodesign-js.mjs
 *
 * Читает docs/ikea-kitchen-slope-dump/*.js и пишет
 * docs/ikea-kitchen-autodesign-dump/grep-hits.json
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, '../docs/ikea-kitchen-slope-dump');
const OUT = join(__dir, '../docs/ikea-kitchen-autodesign-dump');
mkdirSync(OUT, { recursive: true });

const RE =
  /AutoDesign|SolutionInfo|linearManager|updateLinears|best_solutions|water_inlet|water.?suppl|no_solution|templateFurniture|popin_templatecomputing|generateSolution|solutions\s*:/gi;

const files = readdirSync(SRC).filter((f) => /\.(js|json)$/i.test(f));
const hits = [];

for (const f of files) {
  const path = join(SRC, f);
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (_) {
    continue;
  }
  let m;
  const re = new RegExp(RE.source, 'gi');
  let n = 0;
  while ((m = re.exec(text)) && n < 25) {
    const a = Math.max(0, m.index - 100);
    const b = Math.min(text.length, m.index + 160);
    hits.push({
      file: f,
      match: m[0],
      ctx: text
        .slice(a, b)
        .replace(/\s+/g, ' ')
        .slice(0, 280),
    });
    n++;
  }
}

writeFileSync(join(OUT, 'grep-hits.json'), JSON.stringify({ count: hits.length, hits }, null, 2));
console.log('wrote', join(OUT, 'grep-hits.json'), 'hits=', hits.length);
hits.slice(0, 15).forEach((h, i) => {
  console.log(String(i + 1).padStart(2), h.file, '→', h.match);
  console.log('   ', h.ctx.slice(0, 160));
});
