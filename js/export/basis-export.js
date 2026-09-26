import { state } from '../utils/state.js';

import { OBJExporter } from '/node_modules/three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from '/node_modules/three/examples/jsm/exporters/STLExporter.js';

function safeNowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadBinary(filename, arrayBuffer, mime = 'application/octet-stream') {
  const blob = new Blob([arrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isFurnitureRoot(obj) {
  return !!(obj && obj.userData && obj.userData.isFurniture);
}

function shouldSkipMesh(obj) {
  if (!obj || !obj.isMesh) return true;
  const ud = obj.userData || {};
  if (ud.isWallAo || ud.isContactShadow) return true;
  if (ud.isWallPlane) return true;
  if (ud.isCeiling) return true;
  if (obj.visible === false) return true;
  return false;
}

function isSectionPlankMesh(obj) {
  if (!obj || !obj.isMesh) return false;
  const ud = obj.userData || {};
  return !!(
    ud.isTopPlank ||
    ud.isBottomPlank ||
    ud.isSidePlank ||
    ud.isSideOverlay
  );
}

function collectFurnitureAsGroup() {
  const root = new THREE.Group();
  root.name = 'BASIS_EXPORT_ROOT';

  if (!state?.scene) return root;

  const exportRoots = [];
  const seen = new Set();

  // 1) Модули (мебель)
  state.scene.traverse((obj) => {
    if (isFurnitureRoot(obj) && !seen.has(obj)) {
      seen.add(obj);
      exportRoots.push(obj);
    }
  });

  // 2) Секции с планками: берём группы из state.customSections, если есть.
  if (Array.isArray(state.customSections)) {
    state.customSections.forEach((sec) => {
      if (!sec || !sec.group) return;
      const g = sec.group;
      // Не добавляем всю секцию целиком (там зоны/маркеры/внутренние объекты).
      // Вместо этого добавляем только планки секции (meshes with isTopPlank/isBottomPlank/...).
      g.traverse((obj) => {
        if (isSectionPlankMesh(obj) && !seen.has(obj)) {
          seen.add(obj);
          exportRoots.push(obj);
        }
      });
    });
  }

  if (!exportRoots.length) return root;

  // Clone roots to avoid mutating scene.
  exportRoots.forEach((src, idx) => {
    const clone = src.clone(true);
    clone.name = src.name || `Node_${idx + 1}`;
    root.add(clone);
  });

  // Remove meshes we don't want exported (AO helpers etc).
  const toRemove = [];
  root.traverse((obj) => {
    if (obj && obj.isMesh && shouldSkipMesh(obj)) toRemove.push(obj);
  });
  toRemove.forEach((m) => {
    if (m.parent) m.parent.remove(m);
  });

  // Bake world transforms into cloned hierarchy so exporter sees final positions.
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!obj) return;
    if (obj.parent) {
      obj.updateMatrixWorld(true);
    }
  });

  return root;
}

export function exportFurnitureForBasisOBJ() {
  try {
    const group = collectFurnitureAsGroup();
    if (!group.children.length) {
      alert('Нет мебели для экспорта. Сначала разместите модули в секции.');
      return;
    }

    const exporter = new OBJExporter();
    const objText = exporter.parse(group);
    downloadText(`basis-export_${safeNowStamp()}.obj`, objText);
  } catch (e) {
    console.error('OBJ export failed', e);
    alert('Не удалось экспортировать OBJ. Подробности в консоли.');
  }
}

export function exportFurnitureForBasisSTL() {
  try {
    const group = collectFurnitureAsGroup();
    if (!group.children.length) {
      alert('Нет мебели для экспорта. Сначала разместите модули в секции.');
      return;
    }

    const exporter = new STLExporter();
    const stl = exporter.parse(group, { binary: true });
    // STLExporter may return string for ASCII or ArrayBuffer for binary.
    if (typeof stl === 'string') {
      downloadText(`basis-export_${safeNowStamp()}.stl`, stl);
    } else {
      downloadBinary(`basis-export_${safeNowStamp()}.stl`, stl, 'model/stl');
    }
  } catch (e) {
    console.error('STL export failed', e);
    alert('Не удалось экспортировать STL. Подробности в консоли.');
  }
}

