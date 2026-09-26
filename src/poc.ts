import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const appElement = document.getElementById('app');
if (!(appElement instanceof HTMLElement)) {
  throw new Error('App container not found');
}
const app = appElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);

const camera = new THREE.PerspectiveCamera(
  55,
  app.clientWidth / app.clientHeight,
  0.1,
  200
);
camera.position.set(5, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
// Используем outputColorSpace вместо устаревшего outputEncoding
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(app.clientWidth, app.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
controls.enablePan = true;
controls.panSpeed = 0.5;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(3, 6, 2);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// Room (simple box with open front)
function buildRoom(width = 5, depth = 4, height = 2.6) {
  const wallThickness = 0.1;
  const room = new THREE.Group();

  const floorMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8 });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf1efe9,
    transparent: true,
    opacity: 0.92,
  });

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(width, wallThickness, depth),
    floorMat
  );
  floor.position.set(0, -wallThickness / 2, 0);
  floor.receiveShadow = true;
  room.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(width, wallThickness, depth),
    wallMat.clone()
  );
  ceiling.position.set(0, height + wallThickness / 2, 0);
  room.add(ceiling);

  const left = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, height, depth),
    wallMat.clone()
  );
  left.position.set(-width / 2 - wallThickness / 2, height / 2, 0);
  room.add(left);

  const right = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, height, depth),
    wallMat.clone()
  );
  right.position.set(width / 2 + wallThickness / 2, height / 2, 0);
  room.add(right);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(width + wallThickness * 2, height, wallThickness),
    wallMat.clone()
  );
  back.position.set(0, height / 2, -depth / 2 - wallThickness / 2);
  room.add(back);

  const grid = new THREE.GridHelper(Math.max(width, depth) * 2, 20, 0x888888, 0xcccccc);
  grid.position.y = 0.001;
  room.add(grid);

  room.position.set(0, 0, depth / 2); // open side faces +Z
  scene.add(room);
}

buildRoom();

// HDRI for reflections
const hdriUrl =
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_08_2k.hdr';

new RGBELoader()
  .setDataType(THREE.HalfFloatType)
  .load(hdriUrl, texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = new THREE.Color(0xf4f4f4);
  });

// Placeholder furniture block (will be replaced by parametric module later)
function addPlaceholderBox() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    metalness: 0.05,
    roughness: 0.65,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.6), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(0, 1, 0);
  scene.add(mesh);
}

addPlaceholderBox();

// Resize handling
function onResize() {
  const { clientWidth, clientHeight } = app;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

window.addEventListener('resize', onResize);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

