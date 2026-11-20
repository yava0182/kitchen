/**
 * Паритет админ Contours ↔ комната: счётчики стыкового крепежа и опор.
 * Консоль: __cldParityProbe() | __cldParityProbe(root)
 *
 * Вердикт:
 *  NO_FURNITURE — нет шкафа на сцене
 *  MISSING_TREE — frames=0 (hydrate/дерево не пришло)
 *  FRAMES_NO_MESH — кадры есть, мешей нет (GLB/placeholder)
 *  MESH_INVISIBLE — меши есть, Contours/материал не подхватил
 *  OK — frames≥8, meshes≥8, legs≥4
 */
function countParity(root) {
  const stats = {
    frames: 0,
    meshes: 0,
    legs: 0,
    jointGroups: 0,
    placeholders: 0,
    alumMeshes: 0,
    visibleJointMeshes: 0,
    jointNames: [],
    ok: false,
    verdict: 'NO_ROOT',
  };
  if (!root || typeof root.traverse !== 'function') {
    stats.error = 'no-root';
    return stats;
  }
  root.traverse((o) => {
    if (!o) return;
    const ud = o.userData || {};
    const name = String(o.name || '');
    if (ud.cldSupportLeg) stats.legs += 1;
    if (ud.fromJointScheme) stats.jointGroups += 1;
    const isFrame =
      !!ud.fromJointScheme &&
      (Number(ud.jointTemplateFrame) === 1 ||
        Number(ud.spec?.joint_template_frame) === 1 ||
        (Number(ud.schemeId) > 0 &&
          (Number.isFinite(Number(ud.jointIdx)) || ud.contactId != null)));
    if (isFrame && !ud.jointTemplateModel && Number(ud.spec?.joint_template_model) !== 1) {
      stats.frames += 1;
      if (stats.jointNames.length < 24) stats.jointNames.push(name || 'frame');
    }
    if (/ModelPlaceholder_/i.test(name)) stats.placeholders += 1;
    if (o.isMesh) {
      let parentJoint = !!(
        ud.jointHardwareMesh ||
        ud.fromJointScheme ||
        Number(ud.joint_hardware) === 1 ||
        /Эксцентр|Конфирм|Крепёж|Крепеж/i.test(name)
      );
      if (!parentJoint) {
        let p = o.parent;
        for (let i = 0; i < 24 && p; i++) {
          const pud = p.userData || {};
          if (pud.fromJointScheme || pud.jointHardwareMesh || Number(pud.joint_hardware) === 1) {
            parentJoint = true;
            break;
          }
          p = p.parent;
        }
      }
      if (parentJoint) {
        stats.meshes += 1;
        if (o.visible) stats.visibleJointMeshes += 1;
        const mat = o.material;
        if (mat?.userData?.__cldJointAluminium) stats.alumMeshes += 1;
      }
    }
  });
  if (stats.frames <= 0 && stats.meshes <= 0) stats.verdict = 'MISSING_TREE';
  else if (stats.frames > 0 && stats.meshes <= 0) stats.verdict = 'FRAMES_NO_MESH';
  else if (stats.meshes > 0 && stats.visibleJointMeshes <= 0) stats.verdict = 'MESH_INVISIBLE';
  else if (stats.meshes > 0 && stats.alumMeshes <= 0 && typeof window !== 'undefined' && window.__cldGetRoomFurnitureXray?.())
    stats.verdict = 'MESH_NOT_IN_CONTOURS';
  else if (stats.frames >= 8 && stats.meshes >= 8 && stats.legs >= 4) stats.verdict = 'OK';
  else stats.verdict = 'PARTIAL';
  // Позиции мешей относительно bbox шкафа (без joint — иначе раздувает).
  try {
    if (typeof THREE !== 'undefined' && root.updateMatrixWorld) {
      root.updateMatrixWorld(true);
      const box = new THREE.Box3();
      root.traverse((o) => {
        if (!o?.isMesh || !o.geometry) return;
        const ud = o.userData || {};
        if (ud.fromJointScheme || ud.jointHardwareMesh || ud.cldSupportLeg) return;
        if (ud.isEdgesHelper || ud.isRoomFurnitureXrayEdges) return;
        box.expandByObject(o);
      });
      if (!box.isEmpty()) {
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const diag = size.length() || 1;
        let outside = 0;
        let maxDist = 0;
        const centers = [];
        root.traverse((o) => {
          if (!o?.isMesh) return;
          const ud = o.userData || {};
          let pj = !!(ud.jointHardwareMesh || ud.fromJointScheme);
          if (!pj) {
            let p = o.parent;
            for (let i = 0; i < 16 && p; i++) {
              if (p.userData?.fromJointScheme) {
                pj = true;
                break;
              }
              p = p.parent;
            }
          }
          if (!pj) return;
          const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
          const d = c.distanceTo(center);
          if (d > maxDist) maxDist = d;
          if (!box.containsPoint(c) && d > diag * 0.55) outside += 1;
          if (centers.length < 8) {
            centers.push({
              n: o.name,
              d: Math.round(d),
              c: [Math.round(c.x), Math.round(c.y), Math.round(c.z)],
            });
          }
        });
        stats.corpusSize = [Math.round(size.x), Math.round(size.y), Math.round(size.z)];
        stats.jointOutsideCorpus = outside;
        stats.jointMaxDist = Math.round(maxDist);
        stats.jointCenters = centers;
        if (
          (stats.verdict === 'OK' || stats.verdict === 'PARTIAL') &&
          outside >= Math.max(4, (stats.meshes || 0) * 0.5)
        ) {
          stats.verdict = 'POSITION_OUTSIDE';
        }
      }
    }
  } catch (_) {}
  stats.ok = stats.verdict === 'OK';
  return stats;
}

function findDefaultRoomRoot() {
  if (typeof window === 'undefined') return null;
  const scene = window.__cldRoomScene || window.state?.scene;
  if (!scene || typeof scene.traverse !== 'function') return null;
  let found = null;
  scene.traverse((o) => {
    if (found || !o?.userData?.isFurniture) return;
    found = o;
  });
  return found || null;
}

function findAdminRoot() {
  if (typeof window === 'undefined') return null;
  try {
    if (window.rootGroup) return window.rootGroup;
    if (window.CLDDBG?.engine?.root) return window.CLDDBG.engine.root;
  } catch (_) {}
  return null;
}

/**
 * @param {THREE.Object3D} [root]
 * @returns {{ frames:number, meshes:number, legs:number, ok:boolean, verdict:string, source:string }}
 */
export function parityProbe(root) {
  let target = root;
  let source = 'arg';
  if (!target) {
    target = findAdminRoot();
    source = target ? 'admin-iframe' : 'none';
  }
  if (!target) {
    target = findDefaultRoomRoot();
    source = target ? 'room' : 'none';
  }
  if (!target) {
    const empty = {
      frames: 0,
      meshes: 0,
      legs: 0,
      ok: false,
      verdict: 'NO_FURNITURE',
      source,
      hint: 'Поставь модуль (catalog_46 «без дв»), затем снова __cldParityProbe()',
    };
    console.warn('[CLD][PARITY]', empty);
    return empty;
  }
  const stats = countParity(target);
  stats.source = source;
  stats.rootName = target?.name || '';
  stats.xrayOn =
    typeof window !== 'undefined' && typeof window.__cldGetRoomFurnitureXray === 'function'
      ? !!window.__cldGetRoomFurnitureXray()
      : null;
  stats.build = typeof window !== 'undefined' ? window.__CLD_BUILD || null : null;
  try {
    const tag =
      stats.verdict === 'OK'
        ? 'OK'
        : stats.verdict === 'MISSING_TREE'
          ? 'НЕТ В ДЕРЕВЕ'
          : stats.verdict === 'FRAMES_NO_MESH'
            ? 'КАДРЫ ЕСТЬ, МЕШЕЙ НЕТ'
            : stats.verdict === 'MESH_INVISIBLE'
              ? 'МЕШИ ЕСТЬ, НЕ ВИДНЫ'
              : stats.verdict === 'MESH_NOT_IN_CONTOURS'
                ? 'ЕСТЬ, НО CONTOURS НЕ ПОКРАСИЛ'
                : stats.verdict;
    console.warn('[CLD][PARITY]', tag, stats);
    if (stats.verdict === 'MISSING_TREE') {
      console.error(
        '[CLD][PARITY] Крепёж НЕ попал в сцену (hydrate/live_catalog). Ищи выше лог hydrate failed / frames=0.',
      );
    } else if (stats.verdict === 'FRAMES_NO_MESH' || stats.verdict === 'MESH_NOT_IN_CONTOURS') {
      console.error(
        '[CLD][PARITY] Крепёж в графе есть, Contours/GLB не подхватил. Жми Контуры снова или __cldRefreshRoomFurnitureXray().',
      );
    } else if (stats.verdict === 'POSITION_OUTSIDE') {
      console.error(
        '[CLD][PARITY] Крепёж ЕСТЬ, но СМЕЩЁН вне корпуса (jointOutsideCorpus). Смотри jointCenters.',
        stats.jointCenters,
      );
    } else if (stats.ok) {
      console.warn(
        '[CLD][PARITY] Крепёж в сцене OK. Contours: оранжевый поверх панелей. Нет оранжевого → жми Контуры ещё раз.',
      );
    }
  } catch (_) {}
  return stats;
}

/** Вызов после place/rebuild — один раз с задержкой под async GLB. */
export function parityProbeAfterBuild(root, label) {
  const run = () => {
    const s = parityProbe(root);
    s.label = label || 'after-build';
    if (typeof window !== 'undefined') window.__cldParityLast = s;
    return s;
  };
  run();
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        if (typeof window.__cldRefreshRoomFurnitureXray === 'function') {
          window.__cldRefreshRoomFurnitureXray();
        }
      } catch (_) {}
      run();
    }, 600);
  }
  return true;
}

if (typeof window !== 'undefined') {
  window.__cldParityProbe = parityProbe;
  window.__cldParityCount = countParity;
  window.__cldParityProbeAfterBuild = parityProbeAfterBuild;
}
