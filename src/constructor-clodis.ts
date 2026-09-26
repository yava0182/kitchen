import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

type SizeMm = { w: number; h: number; d: number };

const app = document.getElementById('app');
if (!(app instanceof HTMLElement)) {
  throw new Error('#app not found');
}

// Embedded mode (для iframe в админке): скрываем правый UI если он есть (страница с sidebar).
try {
  const params = new URLSearchParams(window.location.search);
  const embedded = params.get('embedded') === '1';
  if (embedded) {
    const ui = document.getElementById('ui');
    if (ui) ui.style.display = 'none';
    const layout = document.querySelector('.layout') as HTMLElement | null;
    if (layout) {
      layout.style.gridTemplateColumns = '1fr';
    }
    document.body.style.overflow = 'hidden';
  }
} catch {}

// ---------- Scene core (meters) ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);

const camera = new THREE.PerspectiveCamera(
  55,
  app.clientWidth / app.clientHeight,
  0.01,
  200
);
camera.position.set(3, 2, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// ВРЕМЕННО: сильно затемняем сцену, чтобы точно увидеть применение настроек
(renderer as any).toneMappingExposure = 0.3;
renderer.setSize(app.clientWidth, app.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(app.clientWidth, app.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '10';
app.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
controls.enablePan = true;
controls.panSpeed = 0.5;

// Освещение: слабый фон + один ключевой источник, как в рефе
// ВРЕМЕННО: ambient делаем очень слабым
const ambient = new THREE.AmbientLight(0xffffff, 0.08);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1.25);
// сверху-слева-спереди относительно модуля
dir.position.set(-3, 5, 4);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
// Направляем ключевой свет в центр корневой секции (0.8м, 1.2м, 0)
dir.target.position.set(0.8, 1.2, 0);
scene.add(dir.target);
scene.add(dir);

const lightingInfo = {
  exposure: (renderer as any).toneMappingExposure,
  ambientIntensity: ambient.intensity,
  directional: {
    intensity: dir.intensity,
    position: dir.position.toArray(),
  },
};

console.log('[Clodis][constructor-clodis] lighting setup', lightingInfo);

// Дублируем краткий лог в родительский фрейм, чтобы его было видно из admin-new.html
try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'cld:previewLog',
        source: 'constructor-clodis',
        payload: lightingInfo,
      },
      '*'
    );
  }
} catch {
  // ignore cross-origin / security errors
}

const grid = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
grid.position.y = 0.0005;
scene.add(grid);

function render() {
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function onResize() {
  const { clientWidth, clientHeight } = app;
  if (clientWidth <= 0 || clientHeight <= 0) return;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
  labelRenderer.setSize(clientWidth, clientHeight);
  render();
}
window.addEventListener('resize', onResize);

// ---------- Helpers / disposal ----------
function disposeObject(root: THREE.Object3D) {
  root.traverse(obj => {
    if (obj instanceof CSS2DObject) {
      const el = obj.element;
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    const anyObj = obj as any;
    if (anyObj.geometry?.dispose) anyObj.geometry.dispose();
    if (anyObj.material) {
      const mats = Array.isArray(anyObj.material) ? anyObj.material : [anyObj.material];
      mats.forEach((m: any) => m?.dispose?.());
    }
  });
}

function mm(n: number) {
  return Math.max(0, Number.isFinite(n) ? n : 0);
}

// ---------- Root section (origin = back-left-bottom corner) ----------
let rootGroup: THREE.Group | null = null;
let dimsGroup: THREE.Group | null = null;

function createRootSection(size: SizeMm): THREE.Group {
  const g = new THREE.Group();
  g.name = '__clodis_root_section';

  const w = size.w / 1000;
  const h = size.h / 1000;
  const d = size.d / 1000;

  // Mesh centered so that corner is at (0,0,0)
  const geom = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.9,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(w / 2, h / 2, d / 2);
  mesh.name = 'SectionBody';
  g.add(mesh);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.85 })
  );
  edges.position.copy(mesh.position);
  edges.name = 'SectionEdges';
  g.add(edges);

  // Red origin marker at (0,0,0)
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 18, 18),
    new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false })
  );
  marker.name = 'OriginMarker';
  marker.renderOrder = 1000;
  g.add(marker);

  // Store in userData for debug
  g.userData.sizeMm = { ...size };
  g.userData.sizeM = { w, h, d };
  return g;
}

// ---------- Dimension arrows (own implementation) ----------
function makeLabel(text: string): CSS2DObject {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.fontSize = '13px';
  div.style.color = '#111';
  div.style.background = 'rgba(255,255,255,0.9)';
  div.style.border = '1px solid rgba(0,0,0,0.12)';
  div.style.borderRadius = '8px';
  div.style.padding = '4px 8px';
  div.style.whiteSpace = 'nowrap';
  div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.10)';
  return new CSS2DObject(div);
}

function addArrow(
  group: THREE.Group,
  from: THREE.Vector3,
  to: THREE.Vector3,
  label: string,
  labelPos: THREE.Vector3
) {
  const lineMat = new THREE.LineBasicMaterial({ color: 0x111111, depthTest: false });
  const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(geom, lineMat);
  line.renderOrder = 900;
  group.add(line);

  const dir = new THREE.Vector3().subVectors(to, from).normalize();
  const len = from.distanceTo(to);
  const head = Math.min(0.08, Math.max(0.03, len * 0.06));

  // Create 2 small ticks for arrow head using a perpendicular vector
  const up = new THREE.Vector3(0, 1, 0);
  let side = new THREE.Vector3().crossVectors(dir, up);
  if (side.lengthSq() < 1e-6) {
    side = new THREE.Vector3(1, 0, 0); // fallback if arrow is vertical
  }
  side.normalize();

  const tip = to.clone();
  const base = to.clone().addScaledVector(dir, -head);
  const wing = Math.min(0.05, head * 0.6);

  const p1 = base.clone().addScaledVector(side, wing);
  const p2 = base.clone().addScaledVector(side, -wing);

  const head1 = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([tip, p1]),
    lineMat
  );
  const head2 = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([tip, p2]),
    lineMat
  );
  head1.renderOrder = 901;
  head2.renderOrder = 901;
  group.add(head1, head2);

  const lbl = makeLabel(label);
  lbl.position.copy(labelPos);
  group.add(lbl);
}

function createDimensions(size: SizeMm): THREE.Group {
  const g = new THREE.Group();
  g.name = '__clodis_dimensions';
  g.userData.isDimensions = true;

  const w = size.w / 1000;
  const h = size.h / 1000;
  const d = size.d / 1000;

  // Offset so arrows are readable (outside the box)
  const pad = 0.12;
  const ox = 0;
  const oy = 0;
  const oz = 0;

  // X (width)
  addArrow(
    g,
    new THREE.Vector3(ox, oy + 0.02, oz - pad),
    new THREE.Vector3(ox + w, oy + 0.02, oz - pad),
    `${Math.round(size.w)} мм`,
    new THREE.Vector3(ox + w / 2, oy + 0.06, oz - pad)
  );

  // Y (height)
  addArrow(
    g,
    new THREE.Vector3(ox - pad, oy, oz),
    new THREE.Vector3(ox - pad, oy + h, oz),
    `${Math.round(size.h)} мм`,
    new THREE.Vector3(ox - pad, oy + h / 2, oz)
  );

  // Z (depth)
  addArrow(
    g,
    new THREE.Vector3(ox - pad, oy + 0.02, oz),
    new THREE.Vector3(ox - pad, oy + 0.02, oz + d),
    `${Math.round(size.d)} мм`,
    new THREE.Vector3(ox - pad, oy + 0.06, oz + d / 2)
  );

  return g;
}

function frameCameraToRoot() {
  if (!rootGroup) return;
  const bbox = new THREE.Box3().setFromObject(rootGroup);
  if (bbox.isEmpty()) return;
  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const dist = Math.max(1.2, maxDim * 2.2);
  controls.target.copy(center);
  camera.position.set(center.x + dist * 0.75, center.y + dist * 0.55, center.z + dist * 0.75);
  controls.update();
}

// ---------- UI / state ----------
let state: SizeMm = { w: 600, h: 2400, d: 600 };
let showDims = true;

function rebuild() {
  if (dimsGroup) {
    scene.remove(dimsGroup);
    disposeObject(dimsGroup);
    dimsGroup = null;
  }
  if (rootGroup) {
    scene.remove(rootGroup);
    disposeObject(rootGroup);
    rootGroup = null;
  }

  rootGroup = createRootSection(state);
  scene.add(rootGroup);

  if (showDims) {
    dimsGroup = createDimensions(state);
    scene.add(dimsGroup);
  }

  frameCameraToRoot();
  render();
}

function setSize(wMm: number, hMm: number, dMm: number) {
  state = { w: mm(wMm), h: mm(hMm), d: mm(dMm) };
  rebuild();
}

function toggleDims(on: boolean) {
  showDims = !!on;
  rebuild();
}

// ---------- DevTools API ----------
const CLDDBG = {
  status() {
    return {
      sizeMm: { ...state },
      hasRoot: !!rootGroup,
      hasDims: !!dimsGroup,
      sceneChildren: scene.children.map(o => o.name || o.type),
    };
  },
  setSize(w: number, h: number, d: number) {
    setSize(w, h, d);
  },
  toggleDims(on: boolean) {
    toggleDims(on);
  },
  rebuild() {
    rebuild();
  },
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).CLDDBG = CLDDBG;

// ---------- iframe bridge (admin -> preview) ----------
window.addEventListener('message', (ev: MessageEvent) => {
  const data: any = ev?.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'cld:setSize' && data.sizeMm) {
    const s = data.sizeMm;
    setSize(Number(s.w), Number(s.h), Number(s.d));
    return;
  }

  if (data.type === 'cld:toggleDims') {
    toggleDims(!!data.on);
    return;
  }

  // Обработка выбора узла для управления видимостью объектов в 3D
  if (data.type === 'cld:selectNode') {
    // Вызываем selectNode из глобального объекта window (должна быть определена в constructor.ts)
    if ((window as any).selectNode && (window as any).sceneNodes) {
      const nodeId = data.nodeId;
      if (nodeId) {
        const node = Array.from((window as any).sceneNodes).find((n: any) => n.id === nodeId);
        if (node) {
          (window as any).selectNode(node);
        }
      } else {
        // Если nodeId === null, выбираем корневой узел
        const rootNode = Array.from((window as any).sceneNodes).find((n: any) => 
          n.type === 'section' && !n.parent
        );
        if (rootNode) {
          (window as any).selectNode(rootNode);
        }
      }
    }
    return;
  }

  if (data.type === 'cld:selectNodeByPath') {
    // Поиск узла по пути (fallback метод)
    if ((window as any).selectNode && (window as any).sceneNodes && data.path) {
      // Здесь нужно реализовать поиск узла по пути
      // Пока что просто логируем
      console.log('[CLD][preview] selectNodeByPath:', data.path, data.nodeType);
    }
    return;
  }
});

// Сообщаем родителю, что превью готово
try {
  window.parent?.postMessage({ type: 'cld:iframeReady', version: 'clodis-preview-v1' }, '*');
} catch {}

// ---------- Wire DOM controls ----------
const wEl = document.getElementById('w') as HTMLInputElement | null;
const hEl = document.getElementById('h') as HTMLInputElement | null;
const dEl = document.getElementById('d') as HTMLInputElement | null;
const showEl = document.getElementById('showDims') as HTMLInputElement | null;
const applyEl = document.getElementById('apply') as HTMLButtonElement | null;
const resetEl = document.getElementById('reset') as HTMLButtonElement | null;

function readInputs(): SizeMm {
  return {
    w: mm(wEl ? parseFloat(wEl.value) : state.w),
    h: mm(hEl ? parseFloat(hEl.value) : state.h),
    d: mm(dEl ? parseFloat(dEl.value) : state.d),
  };
}

applyEl?.addEventListener('click', () => {
  const s = readInputs();
  showDims = !!showEl?.checked;
  setSize(s.w, s.h, s.d);
});

resetEl?.addEventListener('click', () => {
  state = { w: 600, h: 2400, d: 600 };
  showDims = true;
  if (wEl) wEl.value = String(state.w);
  if (hEl) hEl.value = String(state.h);
  if (dEl) dEl.value = String(state.d);
  if (showEl) showEl.checked = true;
  rebuild();
});

showEl?.addEventListener('change', () => {
  toggleDims(!!showEl.checked);
});

// ---------- Loop ----------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
}

rebuild();
animate();

