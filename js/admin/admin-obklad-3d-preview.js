/**
 * 3D превью панели обклада — номера кромок и полоски как в constructor-clodis (CSS2D + ориентация h/v/f).
 */
(function () {
  'use strict';

  let renderer = null;
  let labelRenderer = null;
  let scene = null;
  let camera = null;
  let controls = null;
  let panelMesh = null;
  let outlineLines = null;
  let edgeGroup = null;
  let trimGroup = null;
  let silhouetteGroup = null;
  let labelsGroup = null;
  let animId = null;
  let inited = false;
  let lastFitKey = '';

  function getThree() {
    return typeof THREE !== 'undefined' ? THREE : null;
  }

  function disposeGroup(grp) {
    if (!grp) return;
    grp.traverse(function (o) {
      if (o.element && o.element.parentNode) {
        o.element.parentNode.removeChild(o.element);
      }
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) { if (m) m.dispose(); });
      }
    });
  }

  function getPartEdgeOrientation(partKey) {
    const reg = window.__cldTrimPartRegistry;
    if (reg && typeof reg.getTrimPartEdgeOrientation === 'function') {
      return reg.getTrimPartEdgeOrientation(partKey);
    }
    if (partKey === 'side_overlay_left' || partKey === 'side_overlay_right') return 'v';
    if (partKey === 'side_overlay_front' || partKey === 'side_overlay_back') return 'f';
    return 'f';
  }

  function sideEnabled(edges, n) {
    const s = edges[n] || edges[String(n)];
    return !!(s && s.enabled === true);
  }

  function parseTh(edges, n) {
    const s = edges[n] || edges[String(n)];
    const t = s && s.thickness != null ? Number(s.thickness) : 0.8;
    return Number.isFinite(t) ? Math.max(0.4, t) : 0.8;
  }

  function edgeGeomAndPos(T, orientation, edgeNum, w, h, d, t) {
    let geom = null;
    let pos = null;
    switch (orientation) {
      case 'h':
        if (edgeNum === 1) {
          geom = new T.BoxGeometry(w, h, t);
          pos = new T.Vector3(0, 0, -d / 2 + t / 2);
        } else if (edgeNum === 2) {
          geom = new T.BoxGeometry(w, h, t);
          pos = new T.Vector3(0, 0, d / 2 - t / 2);
        } else if (edgeNum === 3) {
          geom = new T.BoxGeometry(t, h, d);
          pos = new T.Vector3(-w / 2 + t / 2, 0, 0);
        } else if (edgeNum === 4) {
          geom = new T.BoxGeometry(t, h, d);
          pos = new T.Vector3(w / 2 - t / 2, 0, 0);
        }
        break;
      case 'v':
        if (edgeNum === 1) {
          geom = new T.BoxGeometry(w, t, d);
          pos = new T.Vector3(0, -h / 2 + t / 2, 0);
        } else if (edgeNum === 2) {
          geom = new T.BoxGeometry(w, t, d);
          pos = new T.Vector3(0, h / 2 - t / 2, 0);
        } else if (edgeNum === 3) {
          geom = new T.BoxGeometry(w, h, t);
          pos = new T.Vector3(0, 0, -d / 2 + t / 2);
        } else if (edgeNum === 4) {
          geom = new T.BoxGeometry(w, h, t);
          pos = new T.Vector3(0, 0, d / 2 - t / 2);
        }
        break;
      default:
        if (edgeNum === 1) {
          geom = new T.BoxGeometry(w, t, d);
          pos = new T.Vector3(0, -h / 2 + t / 2, 0);
        } else if (edgeNum === 2) {
          geom = new T.BoxGeometry(w, t, d);
          pos = new T.Vector3(0, h / 2 - t / 2, 0);
        } else if (edgeNum === 3) {
          geom = new T.BoxGeometry(t, h, d);
          pos = new T.Vector3(-w / 2 + t / 2, 0, 0);
        } else if (edgeNum === 4) {
          geom = new T.BoxGeometry(t, h, d);
          pos = new T.Vector3(w / 2 - t / 2, 0, 0);
        }
        break;
    }
    return { geom: geom, pos: pos };
  }

  function labelPosition(T, orientation, edgeNum, w, h, d, off) {
    if (orientation === 'h') {
      if (edgeNum === 1) return new T.Vector3(0, 0, -d / 2 - off);
      if (edgeNum === 2) return new T.Vector3(0, 0, d / 2 + off);
      if (edgeNum === 3) return new T.Vector3(-w / 2 - off, 0, 0);
      if (edgeNum === 4) return new T.Vector3(w / 2 + off, 0, 0);
    }
    if (orientation === 'v') {
      if (edgeNum === 1) return new T.Vector3(0, -h / 2 - off, 0);
      if (edgeNum === 2) return new T.Vector3(0, h / 2 + off, 0);
      if (edgeNum === 3) return new T.Vector3(0, 0, -d / 2 - off);
      if (edgeNum === 4) return new T.Vector3(0, 0, d / 2 + off);
    }
    if (edgeNum === 1) return new T.Vector3(0, -h / 2 - off, 0);
    if (edgeNum === 2) return new T.Vector3(0, h / 2 + off, 0);
    if (edgeNum === 3) return new T.Vector3(-w / 2 - off, 0, 0);
    if (edgeNum === 4) return new T.Vector3(w / 2 + off, 0, 0);
    return new T.Vector3();
  }

  function createNumberSprite(T, edgeNum, enabled, w, h, d, orientation, labelEdgeNum) {
    const faceNum = labelEdgeNum != null ? labelEdgeNum : edgeNum;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = enabled ? '#21ba45' : '#555555';
    ctx.stroke();
    ctx.fillStyle = enabled ? '#21ba45' : '#111111';
    ctx.font = 'bold 64px Arial,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(edgeNum), size / 2, size / 2 + 2);
    const tex = new T.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new T.Sprite(mat);
    const off = Math.max(14, Math.min(w, h, d) * 0.08);
    sprite.position.copy(labelPosition(T, orientation, faceNum, w, h, d, off));
    const scale = Math.max(40, Math.min(w, h, d) * 0.12);
    sprite.scale.set(scale, scale, 1);
    sprite.renderOrder = 20;
    sprite.userData.isEdgeNumber = true;
    sprite.userData.edgeNumber = edgeNum;
    return sprite;
  }

  function createEdgeLabel(T, edgeNum, enabled, w, h, d, orientation, labelEdgeNum) {
    const faceNum = labelEdgeNum != null ? labelEdgeNum : edgeNum;
    const off = Math.max(14, Math.min(w, h, d) * 0.08);
    const pos = labelPosition(T, orientation, faceNum, w, h, d, off);
    if (T.CSS2DObject) {
      const div = document.createElement('div');
      div.textContent = String(edgeNum);
      if (enabled) {
        div.style.color = '#21ba45';
        div.style.border = '2px solid #21ba45';
      } else {
        div.style.color = '#111111';
        div.style.border = '2px solid #555555';
      }
      div.style.fontSize = '16px';
      div.style.fontWeight = 'bold';
      div.style.textAlign = 'center';
      div.style.background = 'rgba(255, 255, 255, 0.9)';
      div.style.borderRadius = '50%';
      div.style.width = '24px';
      div.style.height = '24px';
      div.style.lineHeight = '24px';
      div.style.pointerEvents = 'none';
      const label = new T.CSS2DObject(div);
      label.position.copy(pos);
      label.userData.isEdgeNumber = true;
      label.userData.edgeNumber = edgeNum;
      return label;
    }
    return createNumberSprite(T, edgeNum, enabled, w, h, d, orientation, labelEdgeNum);
  }

  function previewEdgeStripThicknessMm(edges, edgeNum, w, h, d) {
    const minDim = Math.min(w, h, d);
    const baseUncut = Math.max(2.5, minDim * 0.12);
    if (!sideEnabled(edges, edgeNum)) return baseUncut;
    const t = parseTh(edges, edgeNum);
    return Math.max(t, Math.max(1.2, minDim * 0.06));
  }

  function edgeStripPhysics(partKey, configEdgeNum, fallbackOrientation, w, h, d) {
    const reg = window.__cldTrimPartRegistry;
    const box = w != null && h != null && d != null ? { w, h, d } : null;
    if (reg && typeof reg.getTrimPartPreviewEdgeStripPhysics === 'function' && partKey) {
      const previewPhys = reg.getTrimPartPreviewEdgeStripPhysics(partKey, configEdgeNum);
      if (previewPhys) return previewPhys;
    }
    if (reg && typeof reg.getTrimPartEdgeStripPhysics === 'function' && partKey) {
      return reg.getTrimPartEdgeStripPhysics(partKey, configEdgeNum, box);
    }
    return { orientation: fallbackOrientation || 'f', edgeNum: configEdgeNum };
  }

  function buildEdges(T, w, h, d, edges, orientation, edgeNumbering, partKey) {
    const g = new T.Group();
    const matOn = new T.MeshStandardMaterial({
      color: 0xc5ff5d,
      emissive: 0x3d6600,
      emissiveIntensity: 0.35,
      metalness: 0.05,
      roughness: 0.55,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const matUncut = new T.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff2222,
      emissiveIntensity: 0.65,
      metalness: 0,
      roughness: 0.4,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    for (let i = 1; i <= 4; i++) {
      const t = previewEdgeStripThicknessMm(edges, i, w, h, d);
      const phys = edgeStripPhysics(partKey, i, orientation, w, h, d);
      const ep = edgeGeomAndPos(T, phys.orientation, phys.edgeNum, w, h, d, t);
      if (!ep.geom || !ep.pos) continue;
      const on = sideEnabled(edges, i);
      const m = new T.Mesh(ep.geom, on ? matOn : matUncut);
      m.position.copy(ep.pos);
      m.renderOrder = on ? 12 : 14;
      m.userData.isEdge = on;
      m.userData.isUncutEdge = !on;
      m.userData.edgeNumber = i;
      g.add(m);
    }

    if (edgeNumbering !== false) {
      for (let i = 1; i <= 4; i++) {
        const phys = edgeStripPhysics(partKey, i, orientation, w, h, d);
        const lbl = createEdgeLabel(
          T,
          i,
          sideEnabled(edges, i),
          w,
          h,
          d,
          phys.orientation,
          phys.edgeNum,
        );
        if (lbl) g.add(lbl);
      }
    }

    return g;
  }

  function ensureInit() {
    if (inited) return true;
    const T = getThree();
    const container = document.getElementById('room2-obklad-3d-canvas');
    if (!T || !container) return false;

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 538;

    scene = new T.Scene();
    scene.background = null;

    camera = new T.PerspectiveCamera(42, w / h, 1, 50000);
    camera.position.set(1200, 900, 1400);

    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    container.innerHTML = '';
    container.style.position = 'relative';
    container.appendChild(renderer.domElement);

    if (T.CSS2DRenderer) {
      labelRenderer = new T.CSS2DRenderer();
      labelRenderer.setSize(w, h);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';
      labelRenderer.domElement.style.left = '0';
      labelRenderer.domElement.style.pointerEvents = 'none';
      labelRenderer.domElement.style.zIndex = '10';
      container.appendChild(labelRenderer.domElement);
    }

    labelsGroup = new T.Group();
    labelsGroup.name = 'obkladEdgeLabels';
    scene.add(labelsGroup);

    const amb = new T.AmbientLight(0xffffff, 0.65);
    scene.add(amb);
    const dir = new T.DirectionalLight(0xffffff, 0.85);
    dir.position.set(800, 1200, 600);
    scene.add(dir);

    edgeGroup = new T.Group();
    edgeGroup.name = 'obkladEdges';
    scene.add(edgeGroup);

    if (typeof T.OrbitControls !== 'undefined') {
      controls = new T.OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
    }

    inited = true;
    startLoop();
    return true;
  }

  function startLoop() {
    if (animId) cancelAnimationFrame(animId);
    function tick() {
      animId = requestAnimationFrame(tick);
      if (controls && controls.update) controls.update();
      if (renderer && scene && camera) renderer.render(scene, camera);
      if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
    }
    tick();
  }

  function resize() {
    if (!renderer || !camera) return;
    const container = document.getElementById('room2-obklad-3d-canvas');
    if (!container) return;
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 538;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (labelRenderer) labelRenderer.setSize(w, h);
  }

  function getPreviewLayout(partKey, preview) {
    const reg = window.__cldTrimPartRegistry;
    const partPreview =
      preview && typeof preview === 'object'
        ? preview
        : { width: preview, height: arguments[2], depth: arguments[3], wallGapMm: 0 };
    if (reg && typeof reg.getTrimPartPreviewLayout === 'function') {
      return reg.getTrimPartPreviewLayout(partKey, partPreview);
    }
    const pw = Number(partPreview.width) || 800;
    const ph = Number(partPreview.height) || 16;
    const pd = Number(partPreview.depth) || 600;
    return {
      section: { width: Math.max(pw, 800), height: 2200, depth: 600 },
      sectionCenter: { x: 0, y: 1100, z: 0 },
      partPosition: { x: 0, y: 2200 - ph / 2, z: -300 + pd / 2 },
      anchor: 'top',
    };
  }

  function buildSilhouette(T, layout) {
    const g = new T.Group();
    g.name = 'obkladSilhouette';
    const sec = layout.section;
    const c = layout.sectionCenter;
    const sw = sec.width;
    const sh = sec.height;
    const sd = sec.depth;

    const ghostMat = new T.MeshStandardMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.16,
      roughness: 0.9,
      metalness: 0,
      depthWrite: false,
    });
    const ghost = new T.Mesh(new T.BoxGeometry(sw, sh, sd), ghostMat);
    ghost.position.set(c.x, c.y, c.z);
    g.add(ghost);

    const wire = new T.LineSegments(
      new T.EdgesGeometry(ghost.geometry),
      new T.LineBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.75 })
    );
    wire.position.copy(ghost.position);
    g.add(wire);

    const floorMat = new T.LineBasicMaterial({ color: 0xb0bcc8 });
    const floorPts = [
      new T.Vector3(-sw / 2, 0, -sd / 2),
      new T.Vector3(sw / 2, 0, -sd / 2),
      new T.Vector3(sw / 2, 0, sd / 2),
      new T.Vector3(-sw / 2, 0, sd / 2),
      new T.Vector3(-sw / 2, 0, -sd / 2),
    ];
    const floor = new T.Line(new T.BufferGeometry().setFromPoints(floorPts), floorMat);
    g.add(floor);

    const wallMat = new T.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.42,
      side: T.DoubleSide,
      depthWrite: false,
    });
    const wall = new T.Mesh(new T.PlaneGeometry(sw, sh), wallMat);
    if (layout.wallPlane === 'left') {
      wall.rotation.y = Math.PI / 2;
      wall.position.set(c.x - sw / 2 - 1, c.y, c.z);
    } else {
      wall.position.set(c.x, c.y, c.z - sd / 2 - 1);
    }
    g.add(wall);

    if (T.CSS2DObject) {
      const mk = function (text, x, y, z) {
        const div = document.createElement('div');
        div.textContent = text;
        div.style.fontSize = '11px';
        div.style.color = '#6b7280';
        div.style.background = 'rgba(255,255,255,0.75)';
        div.style.padding = '2px 6px';
        div.style.borderRadius = '3px';
        div.style.pointerEvents = 'none';
        const lbl = new T.CSS2DObject(div);
        lbl.position.set(x, y, z);
        return lbl;
      };
      const lblSec = mk('Секция', c.x, c.y + sh / 2 + 24, c.z);
      lblSec.element.style.color = '#166534';
      lblSec.element.style.background = 'rgba(187,247,208,0.85)';
      g.add(lblSec);
      const lblWall =
        layout.wallPlane === 'left'
          ? mk('Стена', c.x - sw / 2 - 28, c.y, c.z)
          : mk('Стена', c.x, c.y, c.z - sd / 2 - 28);
      lblWall.element.style.color = '#854d0e';
      lblWall.element.style.background = 'rgba(254,240,138,0.9)';
      g.add(lblWall);
    }

    return g;
  }

  function fitCameraToScene(layout, viewMode) {
    if (!camera) return;
    const sec = layout.section;
    const c = layout.sectionCenter;
    const maxDim = Math.max(sec.width, sec.height, sec.depth);
    const dist = maxDim * 1.35 * (4 / 3);
    const ty = c.y;

    if (viewMode === 'front') {
      camera.position.set(0, ty + sec.height * 0.15, dist);
    } else if (viewMode === 'edge') {
      camera.position.set(dist * 0.95, ty, sec.depth * 0.5);
    } else if (viewMode === 'face') {
      camera.position.set(0, ty, dist * 0.9);
    } else {
      camera.position.set(dist * 0.85, ty * 0.9, dist * 0.75);
    }
    if (controls) {
      controls.target.set(c.x, ty, c.z);
      controls.update();
    }
  }

  function updateObklad3dPreview(payload) {
    if (!ensureInit()) return;
    const T = getThree();
    const partKey = payload?.partKey || '';
    const reg = window.__cldTrimPartRegistry;
    let previewState = {
      width: Number(payload?.width) || 800,
      height: Number(payload?.height) || 16,
      depth: Number(payload?.depth) || 600,
      wallGapMm: payload?.wallGapMm,
      section: payload?.section,
    };
    if (reg && typeof reg.buildTrimPreviewState === 'function') {
      previewState = reg.buildTrimPreviewState(partKey, previewState);
    }
    const w = Math.max(8, Number(previewState.partWidth ?? previewState.width) || 800);
    const h = Math.max(8, Number(previewState.partHeight ?? previewState.height) || 16);
    const d = Math.max(8, Number(previewState.partDepth ?? previewState.depth) || 600);
    const edges = payload?.edges || {};
    const edgeNumbering = payload?.edgeNumbering !== false;
    const renderKey = previewState.renderPartKey || payload?.renderPartKey || partKey;
    const orientation =
      payload?.edgeOrientation || payload?.orientation || getPartEdgeOrientation(renderKey);
    const previewView = payload?.previewView || 'front';
    const layout = getPreviewLayout(partKey, previewState);
    const fitKey = partKey + ':' + w + 'x' + h + 'x' + d + ':' + previewView + ':' + layout.anchor;

    if (silhouetteGroup) {
      disposeGroup(silhouetteGroup);
      scene.remove(silhouetteGroup);
      silhouetteGroup = null;
    }
    if (trimGroup) {
      disposeGroup(trimGroup);
      scene.remove(trimGroup);
      trimGroup = null;
      panelMesh = null;
      outlineLines = null;
      edgeGroup = null;
    }

    silhouetteGroup = buildSilhouette(T, layout);
    scene.add(silhouetteGroup);

    trimGroup = new T.Group();
    trimGroup.name = 'obkladTrimPart';
    const pp = layout.partPosition;
    trimGroup.position.set(pp.x, pp.y, pp.z);

    const coreMat = new T.MeshStandardMaterial({
      color: 0xe8dcc8,
      metalness: 0.05,
      roughness: 0.85,
      emissive: 0x2a2418,
      emissiveIntensity: 0.08,
    });
    panelMesh = new T.Mesh(new T.BoxGeometry(w, h, d), coreMat);
    trimGroup.add(panelMesh);

    outlineLines = new T.LineSegments(
      new T.EdgesGeometry(panelMesh.geometry),
      new T.LineBasicMaterial({ color: 0x1a5c2e, linewidth: 1 })
    );
    trimGroup.add(outlineLines);

    edgeGroup = buildEdges(T, w, h, d, edges, orientation, edgeNumbering, renderKey);
    trimGroup.add(edgeGroup);

    if (T.CSS2DObject) {
      const hint = document.createElement('div');
      hint.textContent = 'Обклад';
      hint.style.fontSize = '11px';
      hint.style.fontWeight = '600';
      hint.style.color = '#166534';
      hint.style.background = 'rgba(197,255,93,0.35)';
      hint.style.padding = '2px 8px';
      hint.style.borderRadius = '4px';
      hint.style.pointerEvents = 'none';
      const hintLbl = new T.CSS2DObject(hint);
      hintLbl.position.set(0, h / 2 + 20, 0);
      trimGroup.add(hintLbl);
    }

    scene.add(trimGroup);

    if (fitKey !== lastFitKey) {
      fitCameraToScene(layout, previewView);
      lastFitKey = fitKey;
    }
    resize();
  }

  function resetRoom2Obklad3dPreview() {
    const reg = window.__cldTrimPartRegistry;
    const partKey = window.__room2ObkladActivePartKey || 'top_plank';
    const view =
      reg && typeof reg.getTrimPartPreviewProfile === 'function'
        ? reg.getTrimPartPreviewProfile(partKey).view
        : 'front';
    if (!panelMesh) return;
    const p = panelMesh.geometry?.parameters || {};
    const layout = getPreviewLayout(partKey, p.width || 800, p.height || 16, p.depth || 600);
    fitCameraToScene(layout, view);
  }

  window.initRoom2Obklad3dPreview = function () {
    if (!ensureInit()) {
      setTimeout(window.initRoom2Obklad3dPreview, 120);
      return;
    }
    resize();
    if (!window.__room2Obklad3dResizeBound) {
      window.__room2Obklad3dResizeBound = true;
      window.addEventListener('resize', resize);
    }
  };

  window.updateRoom2Obklad3dPreview = updateObklad3dPreview;
  window.resetRoom2Obklad3dPreview = resetRoom2Obklad3dPreview;
})();
