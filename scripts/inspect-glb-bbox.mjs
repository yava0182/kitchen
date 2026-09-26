/**
 * One-off: load a .glb from disk and print AABB + glTF asset metadata.
 * Usage: node scripts/inspect-glb-bbox.mjs "D:/path/to/file.glb"
 * Or:    node scripts/inspect-glb-bbox.mjs   (uses first .glb in repo root parent)
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findDefaultGlb() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const entries = fs.readdirSync(repoRoot).filter((f) => f.toLowerCase().endsWith('.glb'));
  if (!entries.length) return null;
  return path.join(repoRoot, entries[0]);
}

const argPath = process.argv[2];
const glbPath = argPath ? path.resolve(argPath) : findDefaultGlb();

if (!glbPath || !fs.existsSync(glbPath)) {
  console.error('No .glb found. Pass path: node scripts/inspect-glb-bbox.mjs <file.glb>');
  process.exit(1);
}

const buf = fs.readFileSync(glbPath);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(
  ab,
  path.dirname(glbPath) + path.sep,
  (gltf) => {
    const scene = gltf.scene;
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    console.log('Path:', glbPath);
    console.log('glTF asset:', JSON.stringify(gltf.asset || {}, null, 2));
    console.log('Scene bbox min:', box.min.toArray().map((n) => +n.toFixed(6)));
    console.log('Scene bbox max:', box.max.toArray().map((n) => +n.toFixed(6)));
    console.log('Scene size (x,y,z) in file units:', 
      [size.x, size.y, size.z].map((n) => +n.toFixed(6)).join(', '));
    console.log('Scene center:', center.toArray().map((n) => +n.toFixed(6)).join(', '));
    console.log('');
    console.log('Interpretation for Clodis preview (if 1 Three unit = 10 mm):');
    console.log('  Approx physical size (mm):',
      [size.x * 10, size.y * 10, size.z * 10].map((n) => +n.toFixed(2)).join(' × '));
  },
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
