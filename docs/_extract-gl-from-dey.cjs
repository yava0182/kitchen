/**
 * Offline: extract IncludesShadersStore snippets from ikea-v1631-DEy_Xiep.js
 * → IKEA-v0-extract-gl-live-20260828.json (full snippets, same keys as IKEA-dump-GLSL-full.js)
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'ikea-v1631-DEy_Xiep.js');
const OUT = path.join(__dirname, 'IKEA-v0-extract-gl-live-20260828.json');

const PICK = [
  'betrakta_material_renderer_decl',
  'betrakta_material_renderer',
  'betrakta_output',
  'betrakta_environment_map_decl',
  'betrakta_brdf_ggx',
  'betrakta_brdf_decl',
  'betrakta_common',
  'shadowMapFragmentSoftTransparentShadow',
];

function extractTemplateLiteral(s, backtickIdx) {
  let i = backtickIdx + 1;
  let out = '';
  while (i < s.length) {
    const ch = s[i];
    if (ch === '\\') {
      out += ch + (s[i + 1] || '');
      i += 2;
      continue;
    }
    if (ch === '`') return { text: out, end: i };
    out += ch;
    i++;
  }
  return null;
}

function extractKeysFromSource(sourceText, keysWanted) {
  const found = {};
  const re = /(?:var )?name\$[0-9]+=`([^`]+)`,shader\$[0-9]+=`/g;
  let m;
  while ((m = re.exec(sourceText)) !== null) {
    const key = m[1];
    if (!keysWanted.includes(key)) continue;
    const backtickIdx = m.index + m[0].length - 1;
    const lit = extractTemplateLiteral(sourceText, backtickIdx);
    if (lit) found[key] = lit.text;
  }
  return found;
}

async function fetchShadowChunk(srcFile) {
  const m = srcFile.match(
    /planner-3d~shadowMapFragmentSoftTransparentShadow-([A-Za-z0-9_-]+)\.js/
  );
  if (!m) return null;
  const chunk = `planner-3d~shadowMapFragmentSoftTransparentShadow-${m[1]}.js`;
  const url = `https://www.ikea.com/addon-app/storageone/assets/static/js/${chunk}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const js = await res.text();
  const found = extractKeysFromSource(js, ['shadowMapFragmentSoftTransparentShadow']);
  return {
    chunk,
    url,
    text: found.shadowMapFragmentSoftTransparentShadow || null,
  };
}

async function main() {
  const src = fs.readFileSync(SRC, 'utf8');
  const snippets = extractKeysFromSource(src, PICK);
  const storeKeyCount = (src.match(/IncludesShadersStore\[name\$/g) || []).length;

  if (!snippets.shadowMapFragmentSoftTransparentShadow) {
    try {
      const shadow = await fetchShadowChunk(src);
      if (shadow?.text) {
        snippets.shadowMapFragmentSoftTransparentShadow = shadow.text;
        console.log('Fetched shadow chunk:', shadow.chunk, shadow.text.length, 'chars');
      }
    } catch (e) {
      console.warn('shadow chunk fetch failed:', e.message);
    }
  }

  const stillMissing = PICK.filter(
    (k) => !snippets[k] && k !== 'shadowMapFragmentSoftTransparentShadow'
  );
  if (stillMissing.length) {
    console.error('MISSING keys:', stillMissing.join(', '));
    process.exit(1);
  }
  if (!snippets.shadowMapFragmentSoftTransparentShadow) {
    console.warn(
      'WARN: shadowMapFragmentSoftTransparentShadow not in DEy bundle (lazy chunk); v0 empty room uses Soft AO not Spot SM on walls'
    );
  }

  const out = {
    ok: true,
    purpose: 'GLSL-full',
    when: new Date().toISOString(),
    source:
      'offline extract: docs/ikea-v1631-DEy_Xiep.js + ikea.com shadow lazy-chunk if needed',
    engineFile: 'docs/ikea-v1631-DEy_Xiep.js',
    storeKeyCount,
    pickedKeys: PICK.filter((k) => snippets[k]),
    missingOptional: PICK.filter((k) => !snippets[k]),
    snippetLengths: Object.fromEntries(
      Object.entries(snippets).map(([k, v]) => [k, v.length])
    ),
    note:
      'Same keys as IKEA-dump-GLSL-full.js; no live Console paste required when DEy bundle is present.',
    snippets,
  };

  const json = JSON.stringify(out, null, 2);
  fs.writeFileSync(OUT, json, 'utf8');
  console.log('Wrote', OUT);
  console.log('Keys:', out.pickedKeys.join(', '));
  console.log('Chars:', json.length);
  for (const k of PICK) {
    console.log(`  ${k}: ${snippets[k]?.length ?? 'MISSING'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
