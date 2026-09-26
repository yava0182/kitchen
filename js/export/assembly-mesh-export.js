/**
 * Сериализация видимых панелей мебели из комнаты для assembly-player.
 * Только чтение сцены — логика комнаты не меняется.
 */
import {
  computeFurnitureWorldBBoxNoAo,
  shouldExcludeMeshFromFurnitureBBox,
  withFurnitureDoorSwingsClosedForMeasure,
} from '../furniture/furniture-bbox.js';

const THREE = typeof window !== 'undefined' ? window.THREE : null;

function normalizeLayoutRole(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getWorldDimsMmFromBoxMesh(mesh) {
  if (!mesh?.isMesh || !mesh.geometry) return null;
  const t = mesh.geometry.type;
  if (t !== 'BoxGeometry' && t !== 'BoxBufferGeometry') return null;
  const p = mesh.geometry.parameters || {};
  const base = {
    x: Number(p.width || 0) || 0,
    y: Number(p.height || 0) || 0,
    z: Number(p.depth || 0) || 0,
  };
  if (!base.x || !base.y || !base.z) return null;
  const s = new THREE.Vector3(1, 1, 1);
  try {
    mesh.getWorldScale(s);
  } catch (_) {}
  return {
    x: Math.abs(base.x * (Number(s.x) || 1)),
    y: Math.abs(base.y * (Number(s.y) || 1)),
    z: Math.abs(base.z * (Number(s.z) || 1)),
  };
}

function getMeshWorldSizeMm(mesh) {
  const box = getWorldDimsMmFromBoxMesh(mesh);
  if (box) return [box.x, box.y, box.z];
  try {
    const bb = new THREE.Box3().setFromObject(mesh);
    const s = bb.getSize(new THREE.Vector3());
    return [Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)];
  } catch (_) {
    return null;
  }
}

function meshColorHex(mesh) {
  const raw = mesh?.material;
  const mat = Array.isArray(raw) ? raw[0] : raw;
  if (mat?.color?.getHex) return mat.color.getHex();
  return 0xc4a574;
}

function resolveMeshSegment(mesh, furnitureRoot, corpusSplitY, localCenterY) {
  let p = mesh;
  while (p && p !== furnitureRoot) {
    const ud = p.userData || {};
    const lr = normalizeLayoutRole(ud.layoutRole || ud.layout_role);
    if (lr === 'top') return 'antresol';
    if (ud.isFacade) return 'facade';
    p = p.parent;
  }
  const ud = mesh.userData || {};
  if (ud.isFacade) return 'facade';
  if (Number.isFinite(corpusSplitY) && corpusSplitY > 0 && Number.isFinite(localCenterY)) {
    if (localCenterY >= corpusSplitY - 40) return 'antresol';
  }
  return 'corpus';
}

function shouldIncludeAssemblyVisualMesh(obj) {
  if (!obj?.isMesh || obj.visible === false) return false;
  if (shouldExcludeMeshFromFurnitureBBox(obj)) return false;
  const ud = obj.userData || {};
  if (ud.isFacadeHandle || ud.isDrillPlaceholder || ud.previewOnly) return false;
  if (ud.isTopPlank || ud.isBottomPlank || ud.isSidePlank || ud.isSideOverlay) return false;
  if (ud.isSectionPlank || ud.isTopPlankSegment || ud.isSectionTransitionPart) return false;
  if (ud.isWallPlane || ud.isCeiling) return false;
  if (ud.isBody || ud.isDetail || ud.isFacade) return true;
  const dims = getMeshWorldSizeMm(obj);
  if (!dims) return false;
  const [sx, sy, sz] = dims;
  const minSide = Math.min(sx, sy, sz);
  const maxSide = Math.max(sx, sy, sz);
  return minSide >= 2 && maxSide >= 8 && maxSide <= 4000;
}

function roundMm(n) {
  return Math.round(Number(n) || 0);
}

function roundQ(n) {
  return Math.round((Number(n) || 0) * 10000) / 10000;
}

/**
 * @param {THREE.Group} group — корень мебели (isFurniture)
 * @param {{ corpusHeightMm?: number }} opts
 * @returns {{ version: number, panelCount: number, panels: object[] }}
 */
export function serializeFurnitureVisualMeshes(group, opts = {}) {
  if (!THREE || !group) {
    return { version: 1, panelCount: 0, panels: [] };
  }

  const corpusSplitY = Number(opts.corpusHeightMm);
  const panels = [];

  withFurnitureDoorSwingsClosedForMeasure(group, () => {
    group.updateMatrixWorld(true);
    const bb = computeFurnitureWorldBBoxNoAo(group);
    const origin = new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z);
    const toLocal = new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z);

    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    group.traverse((obj) => {
      if (!shouldIncludeAssemblyVisualMesh(obj)) return;

      const size = getMeshWorldSizeMm(obj);
      if (!size || size[0] < 1 || size[1] < 1 || size[2] < 1) return;

      obj.updateMatrixWorld(true);
      const world = obj.matrixWorld.clone();
      const local = toLocal.clone().multiply(world);
      local.decompose(pos, quat, scale);

      const sx = Math.abs(size[0] * (scale.x || 1));
      const sy = Math.abs(size[1] * (scale.y || 1));
      const sz = Math.abs(size[2] * (scale.z || 1));
      if (sx < 1 || sy < 1 || sz < 1) return;

      const ud = obj.userData || {};
      panels.push({
        sizeMm: [roundMm(sx), roundMm(sy), roundMm(sz)],
        positionMm: [roundMm(pos.x), roundMm(pos.y), roundMm(pos.z)],
        quaternion: [roundQ(quat.x), roundQ(quat.y), roundQ(quat.z), roundQ(quat.w)],
        color: meshColorHex(obj),
        segment: resolveMeshSegment(obj, group, corpusSplitY, pos.y),
        name: ud.detailName || obj.name || 'panel',
      });
    });
  });

  return {
    version: 1,
    panelCount: panels.length,
    panels,
  };
}
