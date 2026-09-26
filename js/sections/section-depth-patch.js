/**
 * Полупрозрачный зелёный короб секции (0x00aa00) не должен писать depth buffer —
 * иначе мебель внутри ниши не видна (в логах есть меши, на экране — только маркер).
 * Дублирует depthWrite:false на случай кэша старого section-manager.js.
 *
 * @param {THREE.Object3D | null | undefined} root
 */
export function patchSectionNicheDepthWrite(root) {
  if (!root) return;
  const tryPatch = (m) => {
    if (!m || !m.transparent) return;
    try {
      if (m.color && typeof m.color.getHex === 'function' && m.color.getHex() === 0x00aa00) {
        if (m.depthWrite !== false) {
          m.depthWrite = false;
          m.needsUpdate = true;
        }
      }
    } catch (_) {
      /* ignore */
    }
  };
  root.traverse((obj) => {
    const mat = obj.material;
    if (!mat) return;
    if (Array.isArray(mat)) mat.forEach(tryPatch);
    else tryPatch(mat);
  });
}

if (typeof window !== 'undefined') {
  window.__cldPatchSectionNicheDepth = patchSectionNicheDepthWrite;
}
