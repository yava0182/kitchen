/**
 * Профиль высоты секции у окна (прямой шаг).
 * Не «мост»: обычная рама, верх разрезан по полосам, вертикаль на стыке как фасадная планка.
 */
import { assignTrimPartKeyToMesh } from './trim-part-registry.js?v=20260822-edge-insets';

const TOP_H_MM = 50;
const TOP_D_MM = 16;
const JUNCTION_W_MM = 16;

function plankMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.8,
  });
}

function clearHeightProfileParts(group) {
  if (!group) return;
  const kill = [];
  group.traverse((ch) => {
    if (!ch?.isMesh) return;
    if (ch.userData?.isHeightProfilePart) kill.push(ch);
    if (ch.userData?.isTopPlank && !ch.userData?.isPlankLengthSegment) kill.push(ch);
  });
  kill.forEach((ch) => {
    if (ch.parent) ch.parent.remove(ch);
    if (ch.geometry) ch.geometry.dispose();
    if (ch.material) {
      if (Array.isArray(ch.material)) ch.material.forEach((m) => m.dispose());
      else ch.material.dispose();
    }
  });
}

function localU(sectionData, alongMm) {
  const a = Number(sectionData.spanAlongA);
  if (!Number.isFinite(a) || !Number.isFinite(alongMm)) return null;
  return alongMm - a;
}

function addTopBand(group, wallName, size, localU0, localU1, heightMm) {
  const span = localU1 - localU0;
  if (!(span > 1) || !(heightMm > TOP_H_MM)) return null;
  const w = Number(size.x) || 0;
  const d = Number(size.z) || 0;
  const mid = (localU0 + localU1) / 2;
  const y = heightMm - TOP_H_MM / 2;
  const mesh = new THREE.Mesh(undefined, plankMat());
  mesh.name = 'TopPlank';
  mesh.userData.isTopPlank = true;
  mesh.userData.isHeightProfilePart = true;
  mesh.userData.isFacade = true;
  mesh.userData.isSectionFacadeTrim = true;
  mesh.userData.sectionTrimUsesOutsideDecor = true;
  mesh.userData.plankHeight = TOP_H_MM;
  assignTrimPartKeyToMesh(mesh, wallName);

  if (wallName === 'left' || wallName === 'right') {
    mesh.geometry = new THREE.BoxGeometry(TOP_D_MM, TOP_H_MM, span);
    const x = wallName === 'left' ? w - TOP_D_MM / 2 : -w + TOP_D_MM / 2;
    const z = wallName === 'left' ? mid - d : mid;
    mesh.position.set(x, y, z);
  } else {
    mesh.geometry = new THREE.BoxGeometry(span, TOP_H_MM, TOP_D_MM);
    const z = wallName === 'front' ? -d + TOP_D_MM / 2 : d - TOP_D_MM / 2;
    const x = wallName === 'front' ? mid - w : mid;
    mesh.position.set(x, y, z);
  }
  group.add(mesh);
  return mesh;
}

/** Вертикаль на стыке tall|sill — фасад 16×16, от подоконника до потолка. */
function addJunctionVert(group, wallName, size, localU, towardLow, sillMm, fullH) {
  const capH = fullH - sillMm;
  if (!(capH > 10)) return null;
  const w = Number(size.x) || 0;
  const d = Number(size.z) || 0;
  const centerU = localU + towardLow * (JUNCTION_W_MM / 2);
  const centerY = sillMm + capH / 2;
  const mesh = new THREE.Mesh(undefined, plankMat());
  mesh.name = 'HeightProfileJunction';
  mesh.userData.isHeightProfilePart = true;
  mesh.userData.isFacade = true;
  mesh.userData.isSectionFacadeTrim = true;
  mesh.userData.sectionTrimUsesOutsideDecor = true;
  assignTrimPartKeyToMesh(mesh, wallName);

  if (wallName === 'left' || wallName === 'right') {
    mesh.geometry = new THREE.BoxGeometry(TOP_D_MM, capH, JUNCTION_W_MM);
    const x = wallName === 'left' ? w - TOP_D_MM / 2 : -w + TOP_D_MM / 2;
    const z = wallName === 'left' ? centerU - d : centerU;
    mesh.position.set(x, centerY, z);
  } else {
    mesh.geometry = new THREE.BoxGeometry(JUNCTION_W_MM, capH, TOP_D_MM);
    const z = wallName === 'front' ? -d + TOP_D_MM / 2 : d - TOP_D_MM / 2;
    const x = wallName === 'front' ? centerU - w : centerU;
    mesh.position.set(x, centerY, z);
  }
  group.add(mesh);
  return mesh;
}

/**
 * @param {object} sectionData — нужна size, group, spanAlongA, heightProfile
 * @returns {boolean}
 */
export function applySectionHeightProfileTrim(sectionData) {
  const hp = sectionData?.heightProfile;
  const group = sectionData?.group;
  const size = sectionData?.size;
  if (!hp || !group || !size) return false;
  const bands = Array.isArray(hp.heightBands) ? hp.heightBands : null;
  if (!bands || bands.length < 2) return false;

  const wallName = sectionData.wallName || 'back';
  const fullH = Number(size.y) || 0;
  const sillMm = Math.max(
    0,
    Number(hp.sillMm) ||
      Number(bands.find((b) => b.role === 'under-window')?.heightMm) ||
      0
  );

  clearHeightProfileParts(group);

  bands.forEach((band) => {
    const u0 = localU(sectionData, Number(band.alongA));
    const u1 = localU(sectionData, Number(band.alongB));
    if (u0 == null || u1 == null) return;
    const h = Number(band.heightMm) > 0 ? Number(band.heightMm) : fullH;
    addTopBand(group, wallName, size, Math.min(u0, u1), Math.max(u0, u1), h);
  });

  const nA = localU(sectionData, Number(hp.notchAlongA));
  const nB = localU(sectionData, Number(hp.notchAlongB));
  if (nA != null && sillMm > 0 && fullH > sillMm) {
    addJunctionVert(group, wallName, size, nA, +1, sillMm, fullH);
  }
  if (nB != null && sillMm > 0 && fullH > sillMm) {
    addJunctionVert(group, wallName, size, nB, -1, sillMm, fullH);
  }
  return true;
}
