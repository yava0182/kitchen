/**
 * Three.js-сцена для assembly-player (MVP).
 * 1 unit = 1 mm. Не зависит от комнаты/ClodisBuilder.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const PANEL_COLOR = 0xc4a574;
const PANEL_EDGE = 0x8a6b3d;
const HIGHLIGHT = 0x3b82f6;
const GHOST = 0x94a3b8;
const WALL_COLOR = 0xe8e4df;
const FLOOR_COLOR = 0xd6d0c8;

function buildPanelMeshFromRecord(rec, edgeMat) {
  const [w, h, d] = rec.sizeMm || [1, 1, 1];
  const geo = new THREE.BoxGeometry(w, h, d);
  const color = typeof rec.color === 'number' ? rec.color : PANEL_COLOR;
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.02,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...(rec.positionMm || [0, 0, 0]));
  if (Array.isArray(rec.quaternion) && rec.quaternion.length === 4) {
    mesh.quaternion.set(rec.quaternion[0], rec.quaternion[1], rec.quaternion[2], rec.quaternion[3]);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.segment = rec.segment || 'corpus';
  mesh.userData.panelName = rec.name || '';
  if (edgeMat) {
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
  }
  return mesh;
}

function buildModuleVisualGroup(mod, edgeMat) {
  const panels = mod.visualMeshes?.panels;
  if (!panels?.length) return null;

  const group = new THREE.Group();
  group.name = `module_${mod.id}`;

  const corpusMeshes = [];
  const antresolMeshes = [];
  const facadeMeshes = [];

  for (const rec of panels) {
    const mesh = buildPanelMeshFromRecord(rec, edgeMat);
    group.add(mesh);
    if (mesh.userData.segment === 'antresol') antresolMeshes.push(mesh);
    else if (mesh.userData.segment === 'facade') facadeMeshes.push(mesh);
    else corpusMeshes.push(mesh);
  }

  return { group, corpusMeshes, antresolMeshes, facadeMeshes };
}

function tagModulePickTarget(root, moduleId, label) {
  if (!root) return;
  root.userData.moduleId = moduleId;
  root.userData.pickType = 'module';
  root.userData.label = label || 'Шкаф';
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.userData.moduleId = moduleId;
      obj.userData.pickType = 'module';
    }
  });
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function panelCenterMm(sizeMm, posMm, pivot) {
  const [wx, hy, dz] = sizeMm;
  const [px, py, pz] = posMm;
  const pv = pivot || [-1, -1, -1];
  const cx = pv[0] === 1 ? px - wx / 2 : pv[0] === 0 ? px : px + wx / 2;
  const cy = pv[1] === 1 ? py - hy / 2 : pv[1] === 0 ? py : py + hy / 2;
  const cz = pv[2] === 1 ? pz - dz / 2 : pv[2] === 0 ? pz : pz + dz / 2;
  return [cx, cy, cz];
}

function resolvePartCenterMm(part) {
  if (Array.isArray(part?.centerMm) && part.centerMm.length === 3) {
    return part.centerMm;
  }
  const size = part.sizeMm || [1, 1, 1];
  const pos = part.slotMm?.pos || [0, 0, 0];
  const pivot = part.slotMm?.pivot || [-1, -1, -1];
  if (pivot[0] === 0 && pivot[1] === 0 && pivot[2] === 0) {
    return pos;
  }
  return panelCenterMm(size, pos, pivot);
}

/** Габариты модуля для расчёта камеры (мм). */
function readModuleMetrics(mod, niche) {
  const full = mod?.fullDimensionsMm || mod?.exportMeta?.worldSizeMm || mod?.dimensionsMm || {};
  const w = Number(full.w) || 800;
  const h = Number(mod?.__sceneTotalHmm || full.h) || 2200;
  const d = Number(full.d || mod?.dimensionsMm?.d) || 600;
  const pos = mod?.positionMm || [0, 0, 0];
  const nicheDepth = Number(niche?.depthMm) || 600;
  const span = Math.max(w, h, d, nicheDepth, 400);
  return { w, h, d, pos, span, nicheDepth };
}

/** Смещение: ниша из экспорта (0…W, 0…D) → центр сцены (0, 0). */
function nicheSceneOrigin(niche) {
  const w = Number(niche?.widthMm) || 2400;
  const d = Number(niche?.depthMm) || 600;
  const h = Number(niche?.heightMm) || 2700;
  return { ox: w / 2, oz: d / 2, w, d, h };
}

/** Дистанция камеры (мм), чтобы объект w×h влез по высоте и ширине кадра. */
function cameraDistanceToFit(camera, widthMm, heightMm, padding = 1.05) {
  const vFov = THREE.MathUtils.degToRad(camera.fov || 45);
  const aspect = camera.aspect > 0 ? camera.aspect : 1;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const distH = (heightMm * padding) / (2 * Math.tan(vFov / 2));
  const distW = (widthMm * padding) / (2 * Math.tan(hFov / 2));
  return Math.max(distH, distW, 120);
}

/**
 * Камера «весь шкаф в нише» — центр секции, фронтально, по высоте на весь экран.
 */
function cameraFrameModuleFar(mod, niche, camera) {
  const { h } = readModuleMetrics(mod, niche);
  const n = nicheSceneOrigin(niche);
  const fitH = Math.max(n.h, h);
  const fitW = n.w;
  const cy = fitH / 2;
  const dist = cameraDistanceToFit(camera, fitW, fitH, 1.04);
  return {
    target: new THREE.Vector3(0, cy, 0),
    position: new THREE.Vector3(0, cy, n.d / 2 + dist),
  };
}

function computeAssemblyBoundsLocal(parts) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const part of parts) {
    const [cx, cy, cz] = resolvePartCenterMm(part);
    const [w, h, d] = part.sizeMm || [1, 1, 1];
    minX = Math.min(minX, cx - w / 2);
    maxX = Math.max(maxX, cx + w / 2);
    minY = Math.min(minY, cy - h / 2);
    maxY = Math.max(maxY, cy + h / 2);
    minZ = Math.min(minZ, cz - d / 2);
    maxZ = Math.max(maxZ, cz + d / 2);
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, minZ: 0, maxX: 400, maxY: 300, maxZ: 300, w: 400, h: 300, d: 300, cx: 200, cy: 150, cz: 150 };
  }
  return {
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
    w: maxX - minX,
    h: maxY - minY,
    d: maxZ - minZ,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    cz: (minZ + maxZ) / 2,
  };
}

/** Точка привязки (BLB) первой детали — обычно дно. */
function resolveAssemblyAnchorMm(parts) {
  const bottom =
    parts.find((p) => p.detailTypeId === 'horizontal_bottom') ||
    parts.find((p) => /дно|bottom/i.test(String(p.label || ''))) ||
    parts[0];
  if (!bottom?.slotMm?.pos) return [0, 0, 0];
  return [...bottom.slotMm.pos];
}

/**
 * Сборка: точка привязки дна в (0,0,0), камера фронтально, блок по высоте в кадр.
 */
function cameraFrameAssemblyAnchored(bounds, anchor, camera) {
  const ay = anchor[1] || 0;
  const az = anchor[2] || 0;
  const w = Math.max(bounds.w, 120);
  const h = Math.max(bounds.h, 120);
  const dist = cameraDistanceToFit(camera, w, h, 1.08);
  const cy = (bounds.minY + bounds.maxY) / 2 - ay;
  const frontZ = bounds.maxZ - az + Math.max(bounds.d * 0.12, 30);
  return {
    target: new THREE.Vector3(0, 0, 0),
    position: new THREE.Vector3(0, cy, frontZ + dist),
  };
}

function applyCameraFrame(camera, controls, frame) {
  controls.target.copy(frame.target);
  camera.position.copy(frame.position);
  const dist = camera.position.distanceTo(controls.target);
  controls.minDistance = Math.max(80, dist * 0.15);
  controls.maxDistance = Math.max(dist * 4, 12000);
  controls.update();
}

function makePanelMaterial() {
  return new THREE.MeshStandardMaterial({
    color: PANEL_COLOR,
    roughness: 0.85,
    metalness: 0.02,
  });
}

export class AssemblyScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf3f4f6);

    this.camera = new THREE.PerspectiveCamera(45, 1, 10, 50000);
    this.camera.position.set(1200, 900, 1400);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(400, 200, 300);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x9ca3af, 0.95);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.65);
    dir.position.set(800, 1200, 600);
    dir.castShadow = true;
    this.scene.add(dir);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.roomGroup = new THREE.Group();
    this.moduleGroup = new THREE.Group();
    this.assemblyGroup = new THREE.Group();
    this.root.add(this.roomGroup, this.moduleGroup, this.assemblyGroup);

    const grid = new THREE.GridHelper(4000, 40, 0x64748b, 0xcbd5e1);
    grid.position.set(0, 0, 0);
    this.roomGroup.add(grid);

    this.panelMeshes = new Map();
    this.modulePickables = [];
    this.moduleVisuals = new Map();
    this._lastAssemblyDims = null;
    this._assemblyAnchor = null;
    this._assemblyBounds = null;
    this._partsFocusModule = null;
    this.animations = [];
    this.mode = 'room';
    this.roomSnapshot = null;
    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    this._clock = new THREE.Clock();
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);

    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      this._resizeObserver = new ResizeObserver(() => this.resize());
      this._resizeObserver.observe(canvas.parentElement);
    }
    requestAnimationFrame(() => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w < 1 || h < 1) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this._refocusCamera();
  }

  _refocusCamera() {
    if (!this.roomSnapshot) return;
    if (this.mode === 'assembly' && this._assemblyBounds && this._assemblyAnchor) {
      const frame = cameraFrameAssemblyAnchored(
        this._assemblyBounds,
        this._assemblyAnchor,
        this.camera
      );
      applyCameraFrame(this.camera, this.controls, frame);
      return;
    }
    if (this.mode === 'parts' && this._partsFocusModule) {
      const frame = cameraFrameModuleFar(
        this._partsFocusModule,
        this.roomSnapshot.niche,
        this.camera
      );
      applyCameraFrame(this.camera, this.controls, frame);
      return;
    }
    if (this.mode === 'room' || this.mode === 'parts' || this.mode === 'install') {
      this.focusRoom();
    }
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }

  _tick() {
    requestAnimationFrame(this._tick);
    const dt = this._clock.getDelta();
    this._updateAnimations(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _updateAnimations(dt) {
    if (!this.animations.length) return;
    const done = [];
    for (const anim of this.animations) {
      anim.elapsed += dt;
      const t = Math.min(1, anim.elapsed / anim.duration);
      const e = easeOutCubic(t);
      anim.mesh.position.lerpVectors(anim.from, anim.to, e);
      if (t >= 1) done.push(anim);
    }
    this.animations = this.animations.filter((a) => !done.includes(a));
  }

  setRoomSnapshot(snapshot) {
    this.roomSnapshot = snapshot;
    this._clearGroup(this.roomGroup);
    this._clearGroup(this.moduleGroup);
    this.modulePickables = [];
    this.moduleVisuals.clear();

    const niche = snapshot.niche || { widthMm: 2400, heightMm: 2700, depthMm: 600 };
    const n0 = nicheSceneOrigin(niche);
    this.nicheOrigin = n0;

    const floorGeo = new THREE.PlaneGeometry(n0.w, n0.d);
    const floor = new THREE.Mesh(
      floorGeo,
      new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(n0.w, n0.h), wallMat);
    backWall.position.set(0, n0.h / 2, -n0.oz);
    this.roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(n0.d, n0.h), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-n0.ox, n0.h / 2, 0);
    this.roomGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(n0.d, n0.h), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(n0.ox, n0.h / 2, 0);
    this.roomGroup.add(rightWall);

    const edgeMat = new THREE.LineBasicMaterial({ color: 0x6b7280, transparent: true, opacity: 0.35 });

    for (const mod of snapshot.modules || []) {
      const full = mod.fullDimensionsMm || mod.exportMeta?.worldSizeMm || mod.dimensionsMm;
      const dims = mod.dimensionsMm || full || { w: 800, h: 2200, d: 600 };
      const pos = mod.positionMm || [0, 0, 0];
      const ad = mod.antresolDimensionsMm;
      const hasAntresol = ad && ad.h > 0;
      const corpusH = dims.h;
      const antH = hasAntresol ? ad.h : 0;
      const totalH = full?.h ?? corpusH + antH;
      const zFront = Math.max(pos[2] + 40, 40);
      const sceneX = pos[0] - n0.ox;
      const sceneZ = zFront - n0.oz;

      const visual = buildModuleVisualGroup(mod, edgeMat);
      if (visual) {
        const { group, corpusMeshes, antresolMeshes } = visual;
        tagModulePickTarget(group, mod.id, mod.label);
        group.position.set(sceneX, pos[1], sceneZ);
        this.moduleGroup.add(group);

        const pickGeo = new THREE.BoxGeometry(dims.w, totalH, dims.d);
        const pick = new THREE.Mesh(
          pickGeo,
          new THREE.MeshBasicMaterial({ visible: false, depthWrite: false, depthTest: false })
        );
        pick.position.set(sceneX + dims.w / 2, totalH / 2, sceneZ + dims.d / 2);
        tagModulePickTarget(pick, mod.id, mod.label);
        this.moduleGroup.add(pick);
        this.modulePickables.push(pick);

        this.moduleVisuals.set(mod.id, {
          group,
          pick,
          corpusMeshes,
          antresolMeshes,
          dims,
          pos,
          zFront,
          sceneX,
          sceneZ,
        });
        mod.__sceneTotalHmm = totalH;
        mod.__hasRealMesh = true;
        continue;
      }

      const corpusGeo = new THREE.BoxGeometry(dims.w, corpusH, dims.d);
      const corpusMat = new THREE.MeshBasicMaterial({
        color: 0x2563eb,
        transparent: true,
        opacity: 0.88,
      });
      const corpus = new THREE.Mesh(corpusGeo, corpusMat);
      corpus.position.set(sceneX + dims.w / 2, corpusH / 2, sceneZ + dims.d / 2);
      corpus.userData.moduleId = mod.id;
      corpus.userData.pickType = 'module';
      corpus.userData.label = mod.label || 'Шкаф';
      corpus.userData.segment = 'corpus';
      corpus.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(corpusGeo),
          new THREE.LineBasicMaterial({ color: 0x93c5fd })
        )
      );
      this.moduleGroup.add(corpus);
      this.modulePickables.push(corpus);

      if (hasAntresol) {
        const antGeo = new THREE.BoxGeometry(ad.w || dims.w, antH, ad.d || dims.d);
        const ant = new THREE.Mesh(
          antGeo,
          new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.82 })
        );
        ant.position.set(
          sceneX + (ad.w || dims.w) / 2,
          corpusH + antH / 2,
          sceneZ + (ad.d || dims.d) / 2
        );
        ant.userData.moduleId = mod.id;
        ant.userData.pickType = 'module';
        ant.userData.segment = 'antresol';
        ant.add(
          new THREE.LineSegments(
            new THREE.EdgesGeometry(antGeo),
            new THREE.LineBasicMaterial({ color: 0xfde68a })
          )
        );
        this.moduleGroup.add(ant);
      }

      mod.__sceneTotalHmm = totalH;
      mod.__hasRealMesh = false;
    }

    this.setMode('room');
    this.focusRoom();
  }

  setMode(mode) {
    this.mode = mode;
    const showRoom = mode === 'room' || mode === 'parts' || mode === 'install';
    this.roomGroup.visible = showRoom;
    this.moduleGroup.visible = showRoom;
    this.assemblyGroup.visible = mode === 'assembly';
  }

  /** Экран «состав шкафа» — шкаф в нише, без плоскости сборки. */
  showPartsPreview(module) {
    this.setMode('parts');
    this._partsFocusModule = module;
    this.focusModule(module);
  }

  focusModule(module) {
    const niche = this.roomSnapshot?.niche || { widthMm: 2400, depthMm: 600 };
    const mod = module || this.roomSnapshot?.modules?.[0];
    const frame = cameraFrameModuleFar(mod, niche, this.camera);
    applyCameraFrame(this.camera, this.controls, frame);
  }

  focusRoom() {
    const niche = this.roomSnapshot?.niche || { widthMm: 2400, depthMm: 600 };
    const mod = this.roomSnapshot?.modules?.[0];
    const frame = cameraFrameModuleFar(mod, niche, this.camera);
    applyCameraFrame(this.camera, this.controls, frame);
  }

  focusAssembly(bounds, anchor) {
    if (bounds && anchor) {
      this._assemblyBounds = bounds;
      this._assemblyAnchor = anchor;
      const frame = cameraFrameAssemblyAnchored(bounds, anchor, this.camera);
      applyCameraFrame(this.camera, this.controls, frame);
    }
  }

  _clearGroup(group) {
    while (group.children.length) {
      const ch = group.children[0];
      group.remove(ch);
      ch.traverse?.((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
  }

  clearAssembly() {
    this._clearGroup(this.assemblyGroup);
    this.panelMeshes.clear();
    this.animations = [];
    this.assemblyGroup.position.set(0, 0, 0);
    this._assemblyAnchor = null;
    this._assemblyBounds = null;
  }

  /**
   * @param {object} scenario
   * @param {number} stepIndex 0-based index of completed steps (panels already placed)
   */
  loadAssemblyScenario(scenario, stepIndex = 0) {
    this.clearAssembly();
    this.setMode('assembly');

    const parts = scenario.parts || [];
    if (!parts.length) {
      const dims = scenario.dimensionsMm || { w: 400, h: 200, d: 200 };
      const geo = new THREE.BoxGeometry(dims.w, dims.h, dims.d);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35 })
      );
      mesh.position.set(dims.w / 2, dims.h / 2, dims.d / 2);
      this.assemblyGroup.add(mesh);
      const bounds = computeAssemblyBoundsLocal([
        { sizeMm: [dims.w, dims.h, dims.d], centerMm: [dims.w / 2, dims.h / 2, dims.d / 2] },
      ]);
      const anchor = [0, 0, 0];
      this.assemblyGroup.position.set(-anchor[0], -anchor[1], -anchor[2]);
      this.focusAssembly(bounds, anchor);
      return;
    }

    const anchor = resolveAssemblyAnchorMm(parts);
    const bounds = computeAssemblyBoundsLocal(parts);
    this.assemblyGroup.position.set(-anchor[0], -anchor[1], -anchor[2]);
    this.assemblyGroup.userData.anchorMm = anchor;

    const edgeMat = new THREE.LineBasicMaterial({ color: PANEL_EDGE });
    const steps = scenario.steps || [];

    for (const part of parts) {
      const size = part.sizeMm;
      const center = resolvePartCenterMm(part);

      const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
      const mesh = new THREE.Mesh(geo, makePanelMaterial());
      mesh.position.set(center[0], center[1], center[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.partKey = part.partKey;

      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      mesh.add(edges);

      this.assemblyGroup.add(mesh);
      this.panelMeshes.set(part.partKey, mesh);
    }

    for (let idx = 0; idx < steps.length; idx++) {
      const key = steps[idx].pickPart?.partKey;
      const mesh = key ? this.panelMeshes.get(key) : null;
      if (!mesh) continue;
      mesh.visible = idx < stepIndex;
    }

    this.focusAssembly(bounds, anchor);
  }

  /**
   * Animate current step panel into place.
   * @returns {Promise<void>}
   */
  playStepAnimation(scenario, stepIndex) {
    const step = scenario.steps?.[stepIndex];
    if (!step) return Promise.resolve();

    const partKey = step.pickPart?.partKey;
    const mesh = partKey ? this.panelMeshes.get(partKey) : null;
    if (!mesh) return Promise.resolve();

    const part = (scenario.parts || []).find((p) => p.partKey === partKey);
    if (!part) return Promise.resolve();

    const target = new THREE.Vector3(...resolvePartCenterMm(part));

    const spawn = step.spawnFromMm || [target.x, target.y + 200, target.z + 200];
    const from = new THREE.Vector3(spawn[0], spawn[1], spawn[2]);

    mesh.visible = true;
    mesh.position.copy(from);

    this._highlightPart(partKey, true);
    if (step.mateWith?.partKey) {
      this._highlightPart(step.mateWith.partKey, true, 0x22c55e);
    }

    return new Promise((resolve) => {
      const duration = 1.15;
      const anim = { mesh, from: from.clone(), to: target.clone(), elapsed: 0, duration };
      this.animations.push(anim);
      const check = () => {
        if (!this.animations.includes(anim)) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      setTimeout(() => {
        this.animations = this.animations.filter((a) => a !== anim);
        mesh.position.copy(target);
        resolve();
      }, duration * 1000 + 50);
    });
  }

  _highlightPart(partKey, on, color = HIGHLIGHT) {
    const mesh = this.panelMeshes.get(partKey);
    if (!mesh || !mesh.material) return;
    if (on) {
      mesh.material.emissive = new THREE.Color(color);
      mesh.material.emissiveIntensity = 0.35;
    } else {
      mesh.material.emissive = new THREE.Color(0x000000);
      mesh.material.emissiveIntensity = 0;
    }
  }

  clearHighlights(scenario) {
    for (const p of scenario?.parts || []) {
      this._highlightPart(p.partKey, false);
    }
  }

  showInstallPreview(installId, module) {
    this.setMode('install');
    const dims = module?.dimensionsMm || { w: 800, h: 2200, d: 600 };
    const vis = module?.id ? this.moduleVisuals.get(module.id) : null;

    const highlightMeshes = (meshes, color, emissive) => {
      for (const ch of meshes || []) {
        if (!ch?.material) continue;
        ch.material.emissive = new THREE.Color(emissive);
        ch.material.emissiveIntensity = 0.22;
        if (color) ch.material.color = new THREE.Color(color);
      }
    };

    if (installId === 'place_niche') {
      if (vis) {
        highlightMeshes(vis.corpusMeshes, null, 0x2563eb);
      } else {
        for (const ch of this.moduleGroup.children) {
          if (ch.userData.pickType === 'module' && ch.userData.segment !== 'antresol') {
            if (ch.material) {
              ch.material.opacity = 0.85;
              ch.material.color = new THREE.Color(0x60a5fa);
            }
          }
        }
      }
    }
    if (installId === 'stack_antresol') {
      if (vis) {
        highlightMeshes(vis.antresolMeshes, null, 0xd97706);
      } else {
        for (const ch of this.moduleGroup.children) {
          if (ch.userData.segment === 'antresol' || ch.geometry?.parameters?.height < 500) {
            if (ch.material) {
              ch.material.opacity = 0.9;
              ch.material.color = new THREE.Color(0xfbbf24);
            }
          }
        }
      }
    }
    const mod = module || this.roomSnapshot?.modules?.[0];
    const frame = cameraFrameModuleFar(mod, this.roomSnapshot?.niche, this.camera);
    applyCameraFrame(this.camera, this.controls, frame);
    const targetY =
      installId === 'stack_antresol'
        ? dims.h + (module?.antresolDimensionsMm?.h || 360) / 2
        : dims.h / 2;
    this.controls.target.set(0, targetY, 0);
    this.controls.update();
  }

  /**
   * @param {number} clientX
   * @param {number} clientY
   * @returns {string|null} moduleId
   */
  pickModuleAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;
    this._pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._pointer, this.camera);

    const hits = this._raycaster.intersectObjects(this.moduleGroup.children, true);
    for (const hit of hits) {
      let o = hit.object;
      while (o && o !== this.moduleGroup) {
        if (o.userData?.moduleId) return o.userData.moduleId;
        o = o.parent;
      }
    }

    const pickHits = this._raycaster.intersectObjects(this.modulePickables, false);
    if (pickHits.length) return pickHits[0].object.userData.moduleId || null;
    return null;
  }
}
