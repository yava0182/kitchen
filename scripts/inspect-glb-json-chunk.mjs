/**
 * Parse GLB JSON chunk + POSITION accessor min/max (no Three.js).
 */
import fs from 'fs';

const glbPath = process.argv[2];
if (!glbPath) {
  console.error('Usage: node scripts/inspect-glb-json-chunk.mjs <file.glb>');
  process.exit(1);
}
const buf = fs.readFileSync(glbPath);
if (buf.readUInt32LE(0) !== 0x46546c67) {
  console.error('Not a valid glb');
  process.exit(1);
}
const jsonChunkLength = buf.readUInt32LE(12);
const jsonChunkType = buf.toString('ascii', 16, 20);
if (jsonChunkType !== 'JSON') {
  console.error('Expected JSON chunk');
  process.exit(1);
}
const jsonStr = buf.slice(20, 20 + jsonChunkLength).toString('utf8').replace(/\0+$/, '');
const gltf = JSON.parse(jsonStr);

function vecStr(v) {
  if (!Array.isArray(v)) return String(v);
  return v.map((x) => (+x).toPrecision(4)).join(', ');
}

console.log('File:', glbPath);
console.log('asset:', JSON.stringify(gltf.asset || {}, null, 2));
console.log('scene:', gltf.scene);

const nodes = gltf.nodes || [];
console.log('\n--- nodes (index, name, scale, translation) ---');
nodes.forEach((n, i) => {
  const sc = n.scale;
  const tr = n.translation;
  const nm = n.name || '';
  const hasScale = Array.isArray(sc) && (sc[0] !== 1 || sc[1] !== 1 || sc[2] !== 1);
  if (nm || hasScale || tr) {
    console.log(
      i,
      nm || '(noname)',
      'scale:',
      sc ? vecStr(sc) : '—',
      'trans:',
      tr ? vecStr(tr) : '—'
    );
  }
});

const accessors = gltf.accessors || [];
const meshes = gltf.meshes || [];

console.log('\n--- meshes / POSITION accessors ---');
meshes.forEach((mesh, mi) => {
  console.log(`mesh[${mi}]`, mesh.name || '');
  (mesh.primitives || []).forEach((prim, pi) => {
    const posIdx = prim.attributes && prim.attributes.POSITION;
    if (posIdx == null) return;
    const acc = accessors[posIdx];
    if (!acc) return;
    console.log(
      `  prim[${pi}] POSITION acc[${posIdx}] count=${acc.count} type=${acc.type} min=${vecStr(acc.min)} max=${vecStr(acc.max)}`
    );
  });
});

// Global max abs component across POSITION mins/maxes
let gMax = 0;
accessors.forEach((a) => {
  if (a.type === 'VEC3' && Array.isArray(a.min) && Array.isArray(a.max)) {
    ['min', 'max'].forEach((k) => {
      (a[k] || []).forEach((x) => {
        const ax = Math.abs(Number(x));
        if (ax > gMax) gMax = ax;
      });
    });
  }
});
console.log('\nMax |component| among all VEC3 accessor min/max:', gMax);
