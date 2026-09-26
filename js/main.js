// Main application entry point
// Creates Three.js scene, camera, renderer, lights
// Initializes Room and Furniture systems

let scene, camera, renderer;
let room, furniture;
let raycaster, mouse;
let wallPlanes = [];
let roomBounds = null;
let controls; // OrbitControls for camera

// Drag and drop state
let isPlacingFurniture = false;
let furnitureGhost = null;
let pendingFurnitureData = null;
let ghostWall = null;
let ghostPosition = null;

// Section placement state
let isPlacingSection = false;
let pendingSectionData = null; // { width, height, depth }
let sectionGhost = null; // Призрак секции при размещении
let sectionGhostWall = null; // Стена, на которую наведен призрак
let sectionGhostPosition = null; // Позиция призрака

// Furniture dragging state
let isDraggingFurniture = false;
let draggedFurniture = null;
let dragStartMousePos = null;
let dragStartFurniturePos = null;
let dragWall = null;

// Furniture selection state
let selectedFurniture = null;
let furniturePerimeterMarker = null;
let selectedSections = []; // Array of selected sections with their markers
let sectionMarkers = {}; // Map: sectionGroup -> marker object

// Custom sections array - хранит созданные пользователем секции
let customSections = []; // Array of { id, name, size: {x,y,z}, position: {x,y,z}, group: THREE.Group }
// Хранилище меток размеров для секций
let sectionDimensionLabels = {}; // Map: sectionId -> Array of label elements
// Хранилище меток отступов для редактируемой секции
let sectionOffsetLabels = []; // Array of label elements for offset dimensions
// Хранилище линий и меток отступов на стене (Three.js объекты)
let sectionOffsetLines = []; // Array of THREE.Line objects for offset lines on walls
let sectionOffsetSprites = []; // Array of THREE.Sprite objects for offset labels on walls
// Хранилище маркеров расстановки шкафов для секций
let sectionCabinetMarkers = {}; // Map: sectionId -> Array of marker lines
// Разбиение призрака секции (для привязки модулей к зонам)
let sectionGhostDivision = null; // { partSize, sectionStart, sectionEnd, wallName, parts }

// GLB animation and parameters
let furnitureAnimationMixer = null; // AnimationMixer for GLB animations
let furnitureAnimations = {}; // Map: animationName -> AnimationAction
let clock = new THREE.Clock(); // Clock for animation updates

// Room dimensions in millimeters (no conversion needed)
const ROOM_WIDTH = 5000; // 5000mm = 5m
const ROOM_DEPTH = 4000; // 4000mm = 4m
const ROOM_HEIGHT = 2500; // 2500mm = 2.5m

/** При виде камеры спереди луч пересекает front, потом back. Берём самое ДАЛЬНЕЕ пересечение — стену, которую пользователь видит (заднюю). */
function getClosestFacingWallIntersection(raycaster, intersects) {
  if (!intersects.length) return null;
  let best = intersects[0];
  for (let i = 1; i < intersects.length; i++) {
    if (intersects[i].distance > best.distance) best = intersects[i];
  }
  return best;
}

function init() {
  console.log('🚀 Инициализация приложения...');
  console.log('  THREE:', typeof THREE);
  console.log('  Room:', typeof Room);
  console.log('  Furniture:', typeof Furniture);
  
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);
  console.log('✅ Сцена создана');

  // Create camera (adjusted for millimeters: near/far planes)
  const container = document.getElementById('canvas-container');
  const aspect = container.clientWidth / container.clientHeight;
  // near = 1mm (очень близко, чтобы не обрезать объекты), far = 100000mm (100m, чтобы видеть далеко)
  camera = new THREE.PerspectiveCamera(50, aspect, 1, 100000);

  // Position camera to view room from above and slightly from front-right
  // Room dimensions: 5000mm x 4000mm x 2500mm
  // After room offset, center is at (0, height/2, 0) = (0, 1250, 0)
  // Camera positioned to show room from isometric-like view (slightly above, front-right)
  camera.position.set(0, 1000, 4000); // In millimeters
  camera.lookAt(0, 1250, 0); // Center of room in world space (in millimeters)
  
  // Сохраняем исходную позицию камеры для восстановления после редактирования
  window.initialCameraPosition = camera.position.clone();
  window.initialCameraTarget = new THREE.Vector3(0, 1250, 0);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });

  // Post-processing: SSAO для мягких теней в углах (объёмный вид, референс legacy)
  let composer;
  function updateRendererSize() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    if (composer) composer.setSize(width, height);
    if (window.sceneIconsContainer) {
      window.sceneIconsContainer.style.width = width + 'px';
      window.sceneIconsContainer.style.height = height + 'px';
    }
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  updateRendererSize();
  window.addEventListener('resize', updateRendererSize);

  // SSAO отключён: давал пунктир на фасадах и убивал чёткость углов.
  // Для мягких теней в углах нужен другой подход (baked AO или более качественный GTAO).
  if (false && typeof THREE.EffectComposer !== 'undefined') {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const w = document.getElementById('canvas-container').clientWidth;
    const h = document.getElementById('canvas-container').clientHeight;
    const ssaoPass = new THREE.SSAOPass(scene, camera, w, h);
    ssaoPass.kernelRadius = 6;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.06;
    ssaoPass.output = THREE.SSAOPass.OUTPUT.Default;
    composer.addPass(ssaoPass);
    window.composer = composer;
    console.log('✅ SSAO post-processing включён');
  } else {
    window.composer = null;
  }

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.53;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  window.renderer = renderer;
  container.appendChild(renderer.domElement);

  // Create container for scene icons (2D overlay, fixed positions)
  const iconsContainer = document.createElement('div');
  iconsContainer.id = 'scene-icons-container';
  iconsContainer.style.position = 'absolute';
  iconsContainer.style.top = '0';
  iconsContainer.style.left = '0';
  iconsContainer.style.width = '100%';
  iconsContainer.style.height = '100%';
  iconsContainer.style.pointerEvents = 'none';
  iconsContainer.style.overflow = 'hidden';
  iconsContainer.style.zIndex = '1000';
  container.appendChild(iconsContainer);
  window.sceneIconsContainer = iconsContainer;
  console.log('✅ Контейнер для иконок создан');

  // Освещение 1:1 (REF: REFERENCE_LIGHTING_AND_CAMERA.md). Откат: main-lighting-backup.js
  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const light1 = new THREE.PointLight(0xffffff, 0.65, 20000, 2);
  light1.position.set(0, ROOM_HEIGHT + 5, 0);
  light1.castShadow = false;
  scene.add(light1);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.28);
  dirLight.position.set(0, 450, ROOM_DEPTH / 10);
  dirLight.target.position.set(0, ROOM_HEIGHT / 2, 0);
  dirLight.castShadow = false;
  scene.add(dirLight.target);
  scene.add(dirLight);

  // Initialize raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Create room (dimensions in millimeters)
  console.log('🏗️ Создание комнаты...');
  console.log('  Размеры (мм):', {
    width: ROOM_WIDTH,
    depth: ROOM_DEPTH,
    height: ROOM_HEIGHT
  });
  
  try {
    room = new Room(ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT);
    console.log('✅ Комната создана успешно');
    console.log('  Room.group:', room.group);
    console.log('  Room.group.children.length:', room.group.children.length);
  } catch (error) {
    console.error('❌ Ошибка при создании комнаты:', error);
    alert('Ошибка при создании комнаты: ' + error.message);
    throw error;
  }

  // Center room in scene - place room so its center is at world origin (0, 0, 0)
  // Room origin (front-left-bottom) should be at (-width/2, 0, -depth/2)
  const roomCenterX = room.width / 2;
  const roomCenterZ = room.depth / 2;

  // Calculate bounding box of room including walls (with 100mm thickness)
  const wallThickness = 100; // 100mm = 10cm

  // Center room in scene - move room so its center is at (0, height/2, 0)
  room.group.position.set(
    -roomCenterX, // Center room horizontally: move left by half width
    0, // Floor at y=0
    -roomCenterZ // Center room depth-wise: move back by half depth
  );

  console.log('➕ Добавление комнаты в сцену...');
  scene.add(room.group);
  wallPlanes = room.wallPlanes;
  console.log('✅ Комната добавлена в сцену');
  console.log('  wallPlanes.length:', wallPlanes.length);

  // Добавляем иконки на сцену (как на скриншоте)
  addSceneIcons();

  // Update room bounds to account for wall thickness
  roomBounds = {
    minX: -wallThickness / 2,
    maxX: room.width + wallThickness / 2,
    minZ: -wallThickness / 2,
    maxZ: room.depth + wallThickness / 2,
    minY: 0,
    maxY: room.height,
  };

  // Add camera controls: ЛКМ = rotate, ПКМ = pan, wheel = zoom
  let isRotating = false;
  let isPanning = false;
  let previousMousePosition = { x: 0, y: 0 };

  // Mouse wheel zoom (scaled for millimeters: zoomSpeed increased 1000x)
  renderer.domElement.addEventListener('wheel', event => {
    event.preventDefault();
    const zoomSpeed = 10; // 10mm per wheel step (was 0.01m = 10mm, so same sensitivity)
    const delta = event.deltaY * zoomSpeed;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    camera.position.add(direction.multiplyScalar(delta));
  });

  // Prevent context menu on right click (to allow panning)
  renderer.domElement.addEventListener('contextmenu', event => {
    event.preventDefault();
  });

  // Mouse down handlers
  renderer.domElement.addEventListener('mousedown', event => {
    if (event.button === 0) {
      // Left mouse button (ЛКМ) - rotation или размещение секции
      if (isPlacingSection) {
        // При размещении секции не вращаем камеру
        // Размещение произойдет при mouseup
      } else {
        isRotating = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    } else if (event.button === 2) {
      // Right mouse button (ПКМ) - panning
      if (!isPlacingSection) {
        isPanning = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    }
  });

  renderer.domElement.addEventListener('mousemove', event => {
    if (isDraggingFurniture && draggedFurniture) {
      // Drag furniture along wall (только для уже размещенной мебели при выделении)
      updateMousePosition(event);
      dragFurnitureAlongWall(event);
    } else if (isPlacingSection) {
      // Обновление позиции призрака секции при размещении
      updateMousePosition(event);
      updateSectionGhostPosition(event);
    } else if (isPlacingFurniture) {
      // Обновление позиции ghost при размещении мебели из каталога
      updateMousePosition(event);
      updateFurnitureGhostPosition(event);
    } else if (isRotating && !isPlacingSection) {
      // ЛКМ - вращение камеры (orbit)
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;

      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaX * 0.015; // Rotation speed
      spherical.phi += deltaY * 0.015; // Rotation speed
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      // Look at center of room (which is at world origin after offset)
      camera.lookAt(0, room.height / 2, 0);

      previousMousePosition = { x: event.clientX, y: event.clientY };
    } else if (isPanning) {
      // ПКМ - панорамирование (чистое перемещение БЕЗ вращения)
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;

      // Вычисляем направление движения в плоскости камеры
      const panSpeed = 0.02;
      
      // Вычисляем расстояние от камеры до центра комнаты для правильного масштабирования
      const distance = camera.position.distanceTo(new THREE.Vector3(0, room.height / 2, 0));
      const speed = panSpeed * (distance / 5); // Масштабируем скорость в зависимости от расстояния

      // Перемещаем камеру в локальных координатах (вправо/влево и вверх/вниз)
      // Это гарантирует, что направление взгляда не изменится
      camera.translateX(-deltaX * speed); // Отрицаем для интуитивного управления: мышь вправо = камера вправо
      camera.translateY(deltaY * speed);  // Мышь вверх = камера вверх

      previousMousePosition = { x: event.clientX, y: event.clientY };
    } else {
      // Update mouse position for raycast (when not dragging)
      updateMousePosition(event);
    }
  });

  renderer.domElement.addEventListener('mouseup', (event) => {
    if (isDraggingFurniture) {
      // End furniture dragging (только для уже размещенной мебели)
      isDraggingFurniture = false;
      draggedFurniture = null;
      dragStartMousePos = null;
      dragStartFurniturePos = null;
      dragWall = null;
      console.log('✅ Перетаскивание мебели завершено');
    } else if (isPlacingSection) {
      // Размещение секции при отпускании ЛКМ на стене
      if (sectionGhost && sectionGhost.visible && sectionGhostPosition && sectionGhostWall) {
        // Проверяем что стена видима
        if (room && room.walls && room.walls[sectionGhostWall] && room.walls[sectionGhostWall].visible === false) {
          console.warn('⚠️ Стена скрыта — размещение секции невозможно');
          return;
        }
        
        // Создаем секцию на стене
        createSectionAtPosition(sectionGhostPosition, sectionGhostWall);
        
        // Удаляем призрак
        removeSectionGhost();
        
        // Отключаем режим размещения
        isPlacingSection = false;
        pendingSectionData = null;
        sectionGhostWall = null;
        sectionGhostPosition = null;
        
        if (room && room.resetWallHighlight) {
          room.resetWallHighlight();
        }
        
        console.log('✅ Секция размещена на стене:', sectionGhostWall);
      }
    } else if (isPlacingFurniture) {
      // Размещение мебели из каталога при клике на стену
      if (furnitureGhost && furnitureGhost.visible && ghostPosition && ghostWall) {
        // Проверяем что стена видима (не скрыта)
        if (room && room.walls && room.walls[ghostWall] && room.walls[ghostWall].visible === false) {
          console.warn('⚠️ Стена скрыта — размещение мебели невозможно');
          cancelFurniturePlacement();
          return;
        }
        placePendingFurniture();
      } else {
        console.warn('⚠️ Призрак не привязан к стене - размещение отменено');
        cancelFurniturePlacement();
      }
    }
    // Сбрасываем флаги вращения и панорамирования
    isRotating = false;
    isPanning = false;
  });

  renderer.domElement.addEventListener('mouseleave', () => {
    isRotating = false;
    isPanning = false;
  });

  // Don't auto-load cabinet; user will load GLB manually
  const AUTO_LOAD_FULL_CABINET = false;
  if (AUTO_LOAD_FULL_CABINET) {
    loadFullCabinetExample();
  }

  // Add event listeners
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('click', onMouseClick);
  // Note: mousemove is already handled in camera controls above

  // Start animation loop
  animate();

  // Temporary light settings panel
  initLightSettingsPanel();
}

function initLightSettingsPanel() {
  const body = document.getElementById('light-settings-body');
  const toggle = document.getElementById('light-settings-toggle');
  if (!body || !toggle) {
    console.warn('⚠️ Панель света: элементы light-settings-body/toggle не найдены');
    return;
  }
  console.log('✅ Панель света инициализирована');

  toggle.addEventListener('click', () => {
    body.classList.toggle('collapsed');
    toggle.textContent = body.classList.contains('collapsed') ? '☀️ Свет (временно) ▸' : '☀️ Свет (временно) ▾';
  });

  function bind(id, cb) {
    const el = document.getElementById(id);
    if (!el) { console.warn('⚠️ Панель света: input не найден:', id); return; }
    el.addEventListener('input', () => {
      const val = parseFloat(el.value);
      const valSpan = document.getElementById(id + '-val');
      if (valSpan) valSpan.textContent = val.toFixed(2);
      cb(val);
    });
  }

  bind('light-exposure', v => { renderer.toneMappingExposure = v; });
}

function onWindowResize() {
  const container = document.getElementById('canvas-container');
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  if (window.composer) window.composer.setSize(width, height);
}

function onMouseClick(event) {
  // Don't handle clicks if we're placing furniture or section
  if (isPlacingFurniture || isPlacingSection) {
    return;
  }
  
  // Handle section placement
  if (isPlacingSection && pendingSectionData) {
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    // Check for wall intersection
    if (!room || !room.wallPlanes) return;
    
    const visiblePlanes = room.wallPlanes.filter(p => {
      if (p.visible === false) return false;
      const wallName = p.userData.wallName;
      if (room.walls && room.walls[wallName]) {
        return room.walls[wallName].visible !== false;
      }
      return true;
    });
    
    const intersects = raycaster.intersectObjects(visiblePlanes);
    const intersect = getClosestFacingWallIntersection(raycaster, intersects);
    if (intersect) {
      const wallPlane = intersect.object;
      const wallName = wallPlane.userData.wallName;
      
      // Проверяем, что стена видима
      if (room.walls && room.walls[wallName] && room.walls[wallName].visible === false) {
        console.warn('⚠️ Стена скрыта — размещение секции невозможно');
        return;
      }
      
      // Создаем секцию у стены
      createCustomSection(
        pendingSectionData.width,
        pendingSectionData.height,
        pendingSectionData.depth,
        intersect.point,
        wallName
      );
      
      // Отключаем режим размещения
      isPlacingSection = false;
      pendingSectionData = null;
      
      const infoDiv = document.getElementById('info');
      if (infoDiv) {
        infoDiv.innerHTML = '<div>Кликните на стену для размещения мебели</div>';
      }
      
      console.log('✅ Секция размещена у стены:', wallName);
    }
    return;
  }

  updateMousePosition(event);

  // Check if clicking on existing furniture
  raycaster.setFromCamera(mouse, camera);
  const furnitureObjects = [];
  
  if (furniture && furniture.group) {
    furniture.group.traverse(child => {
      if (child.isMesh && !child.isBoxHelper) {
        furnitureObjects.push(child);
      }
    });
  }

  const furnitureIntersects = raycaster.intersectObjects(furnitureObjects, true);
  
  // Check if clicking on custom section (wall sections created by user)
  const customSectionObjects = [];
  customSections.forEach(section => {
    if (section.group) {
      section.group.traverse(child => {
        if (child.isMesh && !child.isBoxHelper) {
          customSectionObjects.push(child);
        }
      });
    }
  });
  
  const customSectionIntersects = raycaster.intersectObjects(customSectionObjects, true);
  
  if (customSectionIntersects.length > 0) {
    const clickedMesh = customSectionIntersects[0].object;
    
    // Find the custom section that contains this mesh
    let clickedSection = null;
    let current = clickedMesh;
    
    while (current && !clickedSection) {
      if (current.userData && current.userData.isCustomSection) {
        // Find section in customSections array
        clickedSection = customSections.find(s => s.group === current);
        if (clickedSection) break;
      }
      current = current.parent;
      if (!current || current === scene) break;
    }
    
    if (clickedSection) {
      console.log('🎯 Клик на пользовательскую секцию:', clickedSection.name);
      
      // Open edit modal for this section
      showEditSectionModal(clickedSection);
      
      // Don't process further
      return;
    }
  }
  
  // Check if clicked mesh belongs to any section (find all sections in hierarchy)
  if (furnitureIntersects.length > 0) {
    const clickedMesh = furnitureIntersects[0].object;
    
    console.log('🔍 Поиск секций в иерархии...');
    console.log('   Кликнутый объект:', clickedMesh.name || clickedMesh.type || 'unnamed');
    console.log('   Тип объекта:', clickedMesh.constructor.name);
    
    // Find all parent sections by traversing up the hierarchy
    // Start from the clicked mesh itself (it might be a Group with section data)
    const foundSections = [];
    let current = clickedMesh;
    let level = 0;
    
    while (current) {
      console.log(`   Уровень ${level}:`, current.name || current.type || 'unnamed', 
                  'isGroup:', current.isGroup, 
                  'isSection:', current.userData?.isSection,
                  'sectionName:', current.userData?.sectionName);
      
      // Check if current object is a section
      if (current.userData && current.userData.isSection) {
        const sectionName = current.userData.sectionName;
        console.log(`   ✅ Найдена секция: "${sectionName}"`);
        foundSections.push({
          group: current,
          name: sectionName
        });
      }
      
      current = current.parent;
      level++;
      
      // Safety limit
      if (level > 20) {
        console.warn('   ⚠️ Превышен лимит уровней иерархии (20)');
        break;
      }
    }
    
    // If we found sections, highlight all of them with different colors
    if (foundSections.length > 0) {
      console.log(`🎯 Клик на секции - выделение всех секций в иерархии`);
      console.log(`   Найдено секций (${foundSections.length}): ${foundSections.map(s => s.name).join(' → ')}`);
      
      // Deselect furniture if selected
      // BUT: Don't hide blue marker - it should always be visible for debugging
      if (selectedFurniture) {
        // hideFurniturePerimeterMarker(); // Commented out - blue marker should always be visible
        selectedFurniture = null;
      }
      
      // Hide all previous section markers
      hideAllSectionMarkers();
      
      // Show markers for all found sections
      // Last section in array is the root (topmost parent) - make it orange
      foundSections.forEach((sectionData, index) => {
        const isRootSection = (index === foundSections.length - 1);
        showSectionPerimeterMarker(sectionData.group, sectionData.name, isRootSection);
      });
      
      selectedSections = foundSections.map(s => s.group);
      
      // Don't start dragging furniture
      return;
    } else {
      console.log('   ❌ Секции не найдены в иерархии');
    }
  }

  if (furnitureIntersects.length > 0 && furniture) {
    // Clicked on furniture - select it and show perimeter marker
    console.log('🎯 Клик на мебель - выделение');

    // Deselect sections if selected
    if (selectedSections.length > 0) {
      hideAllSectionMarkers();
      selectedSections = [];
    }

    // Select furniture
    selectedFurniture = furniture;

    // Show blue perimeter marker (always visible for debugging)
    showFurniturePerimeterMarker(furniture);
    
    // Also find and show root section with orange marker
    const foundSections = [];
    furniture.group.traverse(child => {
      if (child.userData && child.userData.isSection) {
        foundSections.push({
          group: child,
          name: child.userData.sectionName
        });
      }
    });
    
    // Find root section (the one that is parent of all others)
    // Root section is typically the one that has no parent section or is the topmost
    if (foundSections.length > 0) {
      // The last section in the traverse is typically the root
      // But let's find it by checking which one doesn't have a section parent
      let rootSection = null;
      for (const sectionData of foundSections) {
        let current = sectionData.group.parent;
        let hasSectionParent = false;
        while (current) {
          if (current.userData && current.userData.isSection) {
            hasSectionParent = true;
            break;
          }
          current = current.parent;
        }
        if (!hasSectionParent) {
          rootSection = sectionData;
          break;
        }
      }
      
      // If no root found by parent check, use the last one (topmost in hierarchy)
      if (!rootSection && foundSections.length > 0) {
        rootSection = foundSections[foundSections.length - 1];
      }
      
      if (rootSection) {
        showSectionPerimeterMarker(rootSection.group, rootSection.name, true); // true = isRootSection
      }
    }

    // Start dragging
    isDraggingFurniture = true;
    draggedFurniture = furniture;
    dragStartMousePos = { x: event.clientX, y: event.clientY };
    dragStartFurniturePos = furniture.group.position.clone();

    // Determine which wall the furniture is attached to
    // Based on rotation and position
    const rotationY = furniture.group.rotation.y;
    const pos = furniture.group.position;
    const roomWorldPos = new THREE.Vector3();
    room.group.getWorldPosition(roomWorldPos);
    const localPos = pos.clone().sub(roomWorldPos);

    // Determine wall based on rotation and position
    // If furniture is not yet attached to a wall, determine by position
    if (!dragWall) {
      // Check which wall is closest (только видимые стены)
      const wallsToCheck = [];
      if (room.walls.front && room.walls.front.visible !== false) {
        wallsToCheck.push({ name: 'front', dist: Math.abs(localPos.z - 0) });
      }
      if (room.walls.back && room.walls.back.visible !== false) {
        wallsToCheck.push({ name: 'back', dist: Math.abs(localPos.z - room.depth) });
      }
      if (room.walls.left && room.walls.left.visible !== false) {
        wallsToCheck.push({ name: 'left', dist: Math.abs(localPos.x - 0) });
      }
      if (room.walls.right && room.walls.right.visible !== false) {
        wallsToCheck.push({ name: 'right', dist: Math.abs(localPos.x - room.width) });
      }
      
      if (wallsToCheck.length > 0) {
        const closest = wallsToCheck.reduce((min, w) => w.dist < min.dist ? w : min);
        dragWall = closest.name;
      } else {
        // Если все стены скрыты, используем сохраненную стену из userData
        dragWall = furniture.group.userData.attachedWall || 'front';
      }
    } else {
      // Проверяем что текущая стена видима
      if (room.walls && room.walls[dragWall] && room.walls[dragWall].visible === false) {
        // Стена скрыта, ищем ближайшую видимую
        const wallsToCheck = [];
        if (room.walls.front && room.walls.front.visible !== false) {
          wallsToCheck.push({ name: 'front', dist: Math.abs(localPos.z - 0) });
        }
        if (room.walls.back && room.walls.back.visible !== false) {
          wallsToCheck.push({ name: 'back', dist: Math.abs(localPos.z - room.depth) });
        }
        if (room.walls.left && room.walls.left.visible !== false) {
          wallsToCheck.push({ name: 'left', dist: Math.abs(localPos.x - 0) });
        }
        if (room.walls.right && room.walls.right.visible !== false) {
          wallsToCheck.push({ name: 'right', dist: Math.abs(localPos.x - room.width) });
        }
        
        if (wallsToCheck.length > 0) {
          const closest = wallsToCheck.reduce((min, w) => w.dist < min.dist ? w : min);
          dragWall = closest.name;
        } else {
          // Если все стены скрыты, не позволяем перетаскивать
          console.warn('⚠️ Все стены скрыты — перетаскивание невозможно');
          isDraggingFurniture = false;
          draggedFurniture = null;
          dragWall = null;
          return;
        }
      }
    }

    // Финальная проверка видимости стены
    if (dragWall && room.walls && room.walls[dragWall] && room.walls[dragWall].visible === false) {
      console.warn('⚠️ Стена скрыта — перетаскивание невозможно');
      isDraggingFurniture = false;
      draggedFurniture = null;
      dragWall = null;
      return;
    }

    console.log('Мебель привязана к стене:', dragWall);
  } else {
    // Clicked outside furniture - check if clicked on wall to place/attach furniture
    if (furniture && furniture.group) {
      // Check if clicked on wall
      raycaster.setFromCamera(mouse, camera);
      const wallIntersects = raycaster.intersectObjects(wallPlanes, false);
      const intersection = getClosestFacingWallIntersection(raycaster, wallIntersects);
      if (intersection) {
        const wallPlane = intersection.object;
        const wallName = wallPlane.userData.wallName;
        
        // Проверяем что стена видима (не скрыта)
        if (!room.walls || !room.walls[wallName]) {
          console.warn('⚠️ Стена не найдена:', wallName);
          return;
        }
        
        if (room.walls[wallName].visible === false || !room.walls[wallName].visible) {
          console.warn('⚠️ Стена скрыта — привязка мебели невозможна:', wallName);
          return;
        }
        
        console.log('🎯 Клик на стену - привязка мебели к стене:', wallName);
        
        // Attach furniture to wall
        attachFurnitureToWall(intersection.point, wallName, wallPlane);
        
        // Select furniture after attaching
        selectedFurniture = furniture;
        showFurniturePerimeterMarker(furniture);
        
        // Start dragging mode
        isDraggingFurniture = true;
        draggedFurniture = furniture;
        dragStartMousePos = { x: event.clientX, y: event.clientY };
        dragStartFurniturePos = furniture.group.position.clone();
        dragWall = wallName;
        
        return;
      }
    }
    
    // Deselect furniture if clicked outside
    // BUT: Don't hide blue marker - it should always be visible for debugging
    if (selectedFurniture) {
      // hideFurniturePerimeterMarker(); // Commented out - blue marker should always be visible
      selectedFurniture = null;
    }
    if (selectedSections.length > 0) {
      hideAllSectionMarkers();
      selectedSections = [];
    }
  }
}

function onMouseMove(event) {
  updateMousePosition(event);
  // Optional: preview furniture position on hover
}

function updateMousePosition(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleRaycast() {
  // Only handle wall raycast if we have furniture to place
  if (!furniture) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(wallPlanes, false);

  if (intersects.length > 0) {
    const intersection = intersects[0];
    const wallPlane = intersection.object;
    const wallName = wallPlane.userData.wallName;

    console.log('Hit wall:', wallName);
    console.log('Intersection point:', intersection.point);

    // Attach furniture to wall
    attachFurnitureToWall(intersection.point, wallName, wallPlane);
  }
}

// Drag furniture along wall while keeping Y position fixed
function dragFurnitureAlongWall(event) {
  if (!draggedFurniture || !dragWall) return;

  // Проверяем что стена видима (не скрыта)
  if (room && room.walls && room.walls[dragWall] && room.walls[dragWall].visible === false) {
    console.warn('⚠️ Стена скрыта — перетаскивание невозможно');
    return;
  }

  updateMousePosition(event);
  raycaster.setFromCamera(mouse, camera);

  // Get wall planes from room
  if (!room || !room.wallPlanes) return;

  // Только видимые стены
  const visiblePlanes = room.wallPlanes.filter(p => {
    if (p.visible === false) return false;
    const wallName = p.userData.wallName;
    if (room.walls && room.walls[wallName]) {
      return room.walls[wallName].visible !== false;
    }
    return true;
  });
  const intersects = raycaster.intersectObjects(visiblePlanes);
  const intersect = getClosestFacingWallIntersection(raycaster, intersects);

  if (intersect) {
    const wallPlane = intersect.object;
    const wallName = wallPlane.userData.wallName;

    // Only move if still on the same wall and wall is visible
    if (wallName !== dragWall) return;
    
    // Проверяем что новая стена видима
    if (!room.walls || !room.walls[wallName] || room.walls[wallName].visible === false) {
      return; // Не перемещаем на скрытую стену
    }

    const intersectionPoint = intersect.point.clone(); // World coordinates
    const roomWorldPos = new THREE.Vector3();
    room.group.getWorldPosition(roomWorldPos);
    const localIntersectionPoint = intersectionPoint.clone().sub(roomWorldPos);

    // Get furniture bbox and size
    const bbox = draggedFurniture.bbox;
    const extent = bbox.max.clone().sub(bbox.min);

    const gap = 0.002; // 2mm gap from wall
    const inset = 0.05; // 5cm inset from room edges

    // Calculate new position along wall (keep Y fixed)
    const currentY = draggedFurniture.group.position.y; // Keep Y position fixed
    let finalX = localIntersectionPoint.x;
    let finalZ = localIntersectionPoint.z;

    switch (dragWall) {
      case 'front':
        finalX = THREE.MathUtils.clamp(
          localIntersectionPoint.x,
          inset + extent.x / 2,
          room.width - inset - extent.x / 2
        );
        finalZ = gap + extent.z / 2;
        break;
      case 'back':
        finalX = THREE.MathUtils.clamp(
          localIntersectionPoint.x,
          inset + extent.x / 2,
          room.width - inset - extent.x / 2
        );
        finalZ = room.depth - gap - extent.z / 2;
        break;
      case 'left':
        finalX = gap + extent.x / 2;
        finalZ = THREE.MathUtils.clamp(
          localIntersectionPoint.z,
          inset + extent.x / 2,
          room.depth - inset - extent.x / 2
        );
        break;
      case 'right':
        finalX = room.width - gap - extent.x / 2;
        finalZ = THREE.MathUtils.clamp(
          localIntersectionPoint.z,
          inset + extent.x / 2,
          room.depth - inset - extent.x / 2
        );
        break;
    }

  // --- Привязка к зонам (двойной модуль) при перетаскивании ---
  // Если секция размечена сплошными линиями (division), то пивот шкафа
  // должен "прилипать" к началу зоны (сплошной линии), а не свободно
  // ездить между сплошной и пунктирной.
  //
  // worldPosCandidate - текущая позиция пивота (до снапа)
  let worldPosCandidate = new THREE.Vector3(
    finalX + roomWorldPos.x,
    currentY,
    finalZ + roomWorldPos.z
  );

  // Ищем секцию под пивотом
  const sectionAtPositionForDrag = findSectionAtPosition(worldPosCandidate);
  const divisionForDrag = sectionAtPositionForDrag ? sectionAtPositionForDrag.division : null;

  if (divisionForDrag && sectionAtPositionForDrag) {
    const resolvedWallNameForDrag =
      sectionAtPositionForDrag.wallName || divisionForDrag.wallName || dragWall;

    // Координата вдоль разметки: X для front/back, Z для left/right
    const hitCoordForDrag =
      (resolvedWallNameForDrag === 'front' || resolvedWallNameForDrag === 'back')
        ? worldPosCandidate.x
        : worldPosCandidate.z;

    const snapForDrag = snapToZoneDoubleModule(
      hitCoordForDrag,
      divisionForDrag,
      resolvedWallNameForDrag
    );

    if (snapForDrag) {
      // Пересчитываем локальные координаты так, чтобы пивот встал на сплошную линию
      if (resolvedWallNameForDrag === 'front' || resolvedWallNameForDrag === 'back') {
        finalX = snapForDrag.pivotCoord - roomWorldPos.x;
      } else {
        finalZ = snapForDrag.pivotCoord - roomWorldPos.z;
      }
    }
  }

    // Calculate pivot position (back-left-bottom) first
    // Then place marker at pivot position (not at wall edge)
    let markerX, markerZ;

    switch (dragWall) {
      case 'front':
        // Pivot position: (x, 0, gap) - pivot is at gap distance from front wall
        finalX = finalX; // Already clamped
        finalZ = gap;
        // Marker should be at pivot position (lower-left-back corner of furniture)
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'back':
        // Pivot position: (x, 0, depth - gap) - pivot is at gap distance from back wall
        finalX = finalX; // Already clamped
        finalZ = room.depth - gap;
        // Marker should be at pivot position
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'left':
        // Pivot position: (gap, 0, z) - pivot is at gap distance from left wall
        finalX = gap;
        finalZ = finalZ; // Already clamped
        // Marker should be at pivot position
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'right':
        // Pivot position: (width - gap, 0, z) - pivot is at gap distance from right wall
        finalX = room.width - gap;
        finalZ = finalZ; // Already clamped
        // Marker should be at pivot position
        markerX = finalX;
        markerZ = finalZ;
        break;
    }

    // Update marker visibility and position - marker should be at pivot position
    if (room && room.updateWallMarker) {
      room.updateWallMarker(dragWall, markerX, markerZ);
      // Hide other markers
      Object.keys(room.wallMarkers || {}).forEach(key => {
        if (key !== dragWall && room.wallMarkers[key]) {
          room.wallMarkers[key].visible = false;
        }
      });
    }

    // Convert to world coordinates, keeping Y fixed
    const worldPos = new THREE.Vector3(
      finalX + roomWorldPos.x,
      currentY, // Keep Y position fixed - don't let furniture lift off floor
      finalZ + roomWorldPos.z
    );

    // Update furniture position
    draggedFurniture.group.position.copy(worldPos);
  }
}

function attachFurnitureToWall(intersectionPoint, wallName, wallPlane) {
  // Проверяем что стена видима (не скрыта)
  if (!room || !room.walls || !room.walls[wallName]) {
    console.warn('⚠️ Стена не найдена:', wallName);
    return;
  }
  
  if (room.walls[wallName].visible === false || !room.walls[wallName].visible) {
    console.warn('⚠️ Стена скрыта — привязка мебели невозможна:', wallName);
    return;
  }
  
  const gap = 2; // 2mm gap from wall (in millimeters)
  const inset = 50; // 50mm = 5cm inset from room edges (in millimeters)

  // Get furniture local bbox (after pivot shift, min should be ~(0,0,0))
  const bbox = furniture.bbox;
  const furnitureSize = bbox.max.clone().sub(bbox.min);
  // Convention: width = x, height = y, depth = z

  // Pivot is at back-left-bottom, so:
  // - For front/back walls: furniture depth extends along Z, width along X
  // - For left/right walls: after rotation, depth extends along X, width along Z

  let finalX = intersectionPoint.x;
  let finalZ = intersectionPoint.z;
  let rotationY = 0;

  switch (wallName) {
    case 'front':
      // Front wall: z = 0, normal (0,0,1)
      // Furniture back edge should be at z = gap
      // Pivot is at back-left-bottom, so position.z = gap
      rotationY = 0;
      // Width along X axis
      finalX = THREE.MathUtils.clamp(
        intersectionPoint.x,
        inset + furnitureSize.x / 2,
        roomBounds.maxX - inset - furnitureSize.x / 2
      );
      finalZ = gap; // Back edge at gap distance from wall
      break;

    case 'back':
      // Back wall: z = d, normal (0,0,-1)
      // Furniture back edge should be at z = maxZ - gap
      rotationY = Math.PI;
      // Width along X axis (but reversed)
      finalX = THREE.MathUtils.clamp(
        intersectionPoint.x,
        inset + furnitureSize.x / 2,
        roomBounds.maxX - inset - furnitureSize.x / 2
      );
      finalZ = roomBounds.maxZ - gap; // Back edge at gap distance from wall
      break;

    case 'left':
      // Left wall: x = 0, normal (1,0,0)
      // Furniture back edge should be at x = gap
      // After rotation PI/2: depth (z) extends along X, width (x) extends along Z
      rotationY = Math.PI / 2;
      finalX = gap; // Back edge at gap distance from wall
      // Width (original x) now extends along Z
      finalZ = THREE.MathUtils.clamp(
        intersectionPoint.z,
        inset + furnitureSize.x / 2, // Original width
        roomBounds.maxZ - inset - furnitureSize.x / 2
      );
      break;

    case 'right':
      // Right wall: x = w, normal (-1,0,0)
      // Furniture back edge should be at x = maxX - gap
      // After rotation -PI/2: depth (z) extends along X, width (x) extends along Z
      rotationY = -Math.PI / 2;
      finalX = roomBounds.maxX - gap; // Back edge at gap distance from wall
      // Width (original x) now extends along Z
      finalZ = THREE.MathUtils.clamp(
        intersectionPoint.z,
        inset + furnitureSize.x / 2, // Original width
        roomBounds.maxZ - inset - furnitureSize.x / 2
      );
      break;
  }

  // Convert to world coordinates (room is offset)
  const roomWorldPos = new THREE.Vector3();
  room.group.getWorldPosition(roomWorldPos);
  
  // Set furniture position in world coordinates
  // Y position: furniture should rest on floor (pivot y = 0 means bottom is at floor)
  furniture.group.position.set(
    finalX + roomWorldPos.x,
    0 + roomWorldPos.y, // Floor is at roomWorldPos.y
    finalZ + roomWorldPos.z
  );
  furniture.group.rotation.y = rotationY;
  
  // Store wall attachment info
  furniture.group.userData.attachedWall = wallName;

  // Compute world-space bbox for debugging
  const worldBbox = new THREE.Box3().setFromObject(furniture.group);

  console.log('Furniture attached to', wallName);
  console.log('Position:', furniture.group.position);
  console.log('Rotation Y:', rotationY);
  console.log('Local BBox min:', furniture.bbox.min);
  console.log('Local BBox max:', furniture.bbox.max);
  console.log('Local Size (w x h x d):', furnitureSize);
  console.log('World BBox min:', worldBbox.min);
  console.log('World BBox max:', worldBbox.max);

  // Update debug info
  updateDebugInfo(wallName, furniture.group.position, worldBbox);
}

function updateDebugInfo(wallName, position, bbox) {
  const debugDiv = document.getElementById('debug-info');
  debugDiv.innerHTML = `
        <div>Стена: ${wallName}</div>
        <div>Позиция: (${position.x.toFixed(3)}, ${position.y.toFixed(3)}, ${position.z.toFixed(3)})</div>
        <div>BBox min: (${bbox.min.x.toFixed(3)}, ${bbox.min.y.toFixed(3)}, ${bbox.min.z.toFixed(3)})</div>
        <div>BBox max: (${bbox.max.x.toFixed(3)}, ${bbox.max.y.toFixed(3)}, ${bbox.max.z.toFixed(3)})</div>
    `;
}

function animate() {
  requestAnimationFrame(animate);

  // Update wall visibility based on camera position
  if (room && typeof room.updateWallVisibility === 'function') {
    room.updateWallVisibility(camera);
  }

  // Update GLB animations
  if (furnitureAnimationMixer) {
    const delta = clock.getDelta();
    furnitureAnimationMixer.update(delta);
  }

  // Update controls (required for damping)
  if (controls && controls.update) {
    controls.update();
  }
  
  if (window.composer) {
    window.composer.render();
  } else {
    renderer.render(scene, camera);
  }
  
  // Обновляем позиции HTML иконок
  updateAllSceneIcons();
}

// Хранилище иконок на сцене
window.sceneIcons = [];

// Создать иконку на сцене (2D элемент с фиксированной позицией на экране)
function createSceneIcon(iconHtml, position, options = {}) {
  if (!window.sceneIconsContainer) {
    console.warn('⚠️ Контейнер для иконок не создан');
    return null;
  }
  
  const div = document.createElement('div');
  div.className = options.className || 'scene-icon';
  div.innerHTML = iconHtml;
  div.style.position = 'absolute';
  div.style.pointerEvents = 'auto';
  div.style.cursor = options.cursor || 'pointer';
  div.style.userSelect = 'none';
  div.style.zIndex = '1001';
  
  // Если position - объект с left/top/right/bottom, используем его напрямую
  if (position && typeof position === 'object' && (position.left !== undefined || position.top !== undefined || position.right !== undefined || position.bottom !== undefined)) {
    if (position.left !== undefined) div.style.left = position.left;
    if (position.top !== undefined) div.style.top = position.top;
    if (position.right !== undefined) div.style.right = position.right;
    if (position.bottom !== undefined) div.style.bottom = position.bottom;
    if (position.transform) div.style.transform = position.transform;
  }
  
  // Применяем дополнительные стили если переданы
  if (options.style) {
    Object.assign(div.style, options.style);
  }
  
  window.sceneIconsContainer.appendChild(div);
  window.sceneIcons.push(div);
  
  return div;
}

// Хранилище элементов размеров комнаты
window.roomDimensionLabels = [];

// Создать/обновить метки размеров на плане комнаты
function updateRoomDimensionLabels() {
  // Удаляем старые метки
  if (window.roomDimensionLabels) {
    window.roomDimensionLabels.forEach(label => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
  }
  window.roomDimensionLabels = [];
  
  if (!room || !window.sceneIconsContainer) return;
  
  const roomCenterX = room.width / 2;
  const roomCenterZ = room.depth / 2;
  
  // Мировые координаты центра комнаты (комната центрирована)
  const worldCenterX = -roomCenterX + roomCenterX; // = 0
  const worldCenterZ = -roomCenterZ + roomCenterZ; // = 0
  
  // Ширина (сверху и снизу)
  const widthTop = createDimensionLabel(
    `${room.width / 10} см`,
    new THREE.Vector3(worldCenterX, 0, worldCenterZ - room.depth / 2 - 500),
    'dimension-label dimension-width-top'
  );
  const widthBottom = createDimensionLabel(
    `${room.width / 10} см`,
    new THREE.Vector3(worldCenterX, 0, worldCenterZ + room.depth / 2 + 500),
    'dimension-label dimension-width-bottom'
  );
  
  // Глубина (слева и справа)
  const depthLeft = createDimensionLabel(
    `${room.depth / 10} см`,
    new THREE.Vector3(worldCenterX - room.width / 2 - 500, 0, worldCenterZ),
    'dimension-label dimension-depth-left',
    { transform: 'rotate(-90deg)' }
  );
  const depthRight = createDimensionLabel(
    `${room.depth / 10} см`,
    new THREE.Vector3(worldCenterX + room.width / 2 + 500, 0, worldCenterZ),
    'dimension-label dimension-depth-right',
    { transform: 'rotate(-90deg)' }
  );
  
  if (widthTop) window.roomDimensionLabels.push(widthTop);
  if (widthBottom) window.roomDimensionLabels.push(widthBottom);
  if (depthLeft) window.roomDimensionLabels.push(depthLeft);
  if (depthRight) window.roomDimensionLabels.push(depthRight);
}

// Создать метку размера
function createDimensionLabel(text, position3D, className, extraStyle = {}) {
  if (!window.sceneIconsContainer) return null;
  
  const label = document.createElement('div');
  label.className = className || 'dimension-label';
  label.textContent = text;
  label.style.position = 'absolute';
  label.style.pointerEvents = 'none';
  label.style.userSelect = 'none';
  label.style.fontSize = '14px';
  label.style.fontWeight = '500';
  label.style.color = '#333';
  label.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  label.style.padding = '4px 8px';
  label.style.borderRadius = '4px';
  label.style.whiteSpace = 'nowrap';
  
  // Применяем дополнительные стили
  Object.assign(label.style, extraStyle);
  
  // Сохраняем 3D позицию
  label.userData = {
    position3D: position3D.clone()
  };
  
  window.sceneIconsContainer.appendChild(label);
  
  // Обновляем позицию через проекцию 3D в 2D
  const vector = position3D.clone();
  vector.project(camera);
  
  const container = window.sceneIconsContainer;
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;
  
  const x = (vector.x * widthHalf) + widthHalf;
  const y = -(vector.y * heightHalf) + heightHalf;
  
  label.style.left = x + 'px';
  label.style.top = y + 'px';
  label.style.display = vector.z > 1 ? 'none' : 'block';
  
  return label;
}

// Обновить позиции всех иконок (для 2D иконок не нужно, но оставляем для совместимости)
function updateAllSceneIcons() {
  // Обновляем позиции меток размеров (они в 3D пространстве)
  if (window.roomDimensionLabels) {
    window.roomDimensionLabels.forEach(label => {
      if (label && label.userData && label.userData.position3D) {
        const vector = label.userData.position3D.clone();
        vector.project(camera);
        
        const container = window.sceneIconsContainer;
        if (!container) return;
        
        const widthHalf = container.clientWidth / 2;
        const heightHalf = container.clientHeight / 2;
        
        const x = (vector.x * widthHalf) + widthHalf;
        const y = -(vector.y * heightHalf) + heightHalf;
        
        label.style.left = x + 'px';
        label.style.top = y + 'px';
        label.style.display = vector.z > 1 ? 'none' : 'block';
      }
    });
  }
  
  // Обновляем позиции меток размеров секций
  updateSectionDimensionLabels();
}

// Удалить иконку со сцены
function removeSceneIcon(iconElement) {
  if (!iconElement || !iconElement.parentNode) return;
  
  iconElement.parentNode.removeChild(iconElement);
  
  // Удаляем из массива
  const index = window.sceneIcons.indexOf(iconElement);
  if (index > -1) {
    window.sceneIcons.splice(index, 1);
  }
}

// Добавить иконки на сцену (как на скриншоте) - 2D элементы с фиксированными позициями
function addSceneIcons() {
  if (!window.sceneIconsContainer) {
    console.warn('⚠️ Контейнер для иконок не создан');
    return;
  }

  // Иконки слева - вертикальный ряд (фиксированные позиции на экране)
  const leftIcons = [
    { icon: 'fa-moon', top: '25%' },
    { icon: 'fa-tshirt', top: '45%' },
    { icon: 'fa-window-maximize', top: '65%' },
  ];

  leftIcons.forEach((item) => {
    createSceneIcon(
      `<i class="fas ${item.icon}"></i>`,
      {
        left: '20px',
        top: item.top,
        transform: 'translateY(-50%)'
      },
      {
        className: 'scene-icon-left',
        style: {
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'white',
          border: '2px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: '#333'
        }
      }
    );
  });

  // Кнопки внизу слева (отмена/повтор)
  // Кнопка отмены
  createSceneIcon(
    `<i class="fas fa-undo"></i>`,
    {
      left: '20px',
      bottom: '100px'
    },
    {
      className: 'scene-icon-undo',
      style: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: 'white',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#333'
      }
    }
  );

  // Кнопка повтора
  createSceneIcon(
    `<i class="fas fa-redo"></i>`,
    {
      left: '70px',
      bottom: '100px'
    },
    {
      className: 'scene-icon-redo',
      style: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: 'white',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#333'
      }
    }
  );

  // Большая кнопка внизу по центру "Редактировать комнату"
  const editRoomBtn = createSceneIcon(
    `<i class="fas fa-wrench" style="margin-right: 8px;"></i><i class="fas fa-pencil-alt" style="margin-right: 8px;"></i>Редактировать комнату`,
    {
      left: '50%',
      bottom: '80px',
      transform: 'translateX(-50%)'
    },
    {
      className: 'scene-icon-edit-room',
      style: {
        padding: '12px 24px',
        borderRadius: '8px',
        background: '#000',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        border: 'none'
      }
    }
  );
  
  // Сохраняем ссылку на кнопку редактирования для замены на "Готово"
  window.editRoomButton = editRoomBtn;
  
  // Обработчик клика на кнопку "Редактировать комнату"
  if (editRoomBtn) {
    editRoomBtn.addEventListener('click', () => {
      showEditRoomModal();
    });
  }

  console.log('✅ Иконки добавлены на сцену (2D overlay)');
}

// Показать модалку редактирования комнаты
function showEditRoomModal() {
  const modal = document.getElementById('edit-room-modal');
  if (!modal) return;
  
  // Устанавливаем текущие размеры комнаты
  const widthInput = document.getElementById('room-width-input');
  const depthInput = document.getElementById('room-depth-input');
  const heightInput = document.getElementById('room-height-input');
  const heightSlider = document.getElementById('room-height-slider');
  
  if (widthInput && room) {
    widthInput.value = room.width / 10; // Конвертируем мм в см
  }
  if (depthInput && room) {
    depthInput.value = room.depth / 10;
  }
  if (heightInput && room) {
    heightInput.value = room.height / 10;
  }
  if (heightSlider && room) {
    heightSlider.value = room.height / 10;
  }
  
  // Синхронизация слайдера и поля ввода высоты
  if (heightSlider && heightInput) {
    // Удаляем старые обработчики
    const newSlider = heightSlider.cloneNode(true);
    heightSlider.parentNode.replaceChild(newSlider, heightSlider);
    const newInput = heightInput.cloneNode(true);
    heightInput.parentNode.replaceChild(newInput, heightInput);
    
    // Получаем обновленные элементы
    const updatedSlider = document.getElementById('room-height-slider');
    const updatedInput = document.getElementById('room-height-input');
    
    updatedSlider.addEventListener('input', (e) => {
      updatedInput.value = e.target.value;
      updateRoomDimensions();
    });
    
    updatedInput.addEventListener('input', (e) => {
      const value = Math.max(200, Math.min(400, parseInt(e.target.value) || 250));
      updatedSlider.value = value;
      updatedInput.value = value;
      updateRoomDimensions();
    });
  }
  
  // Обработчики изменения размеров (удаляем старые и добавляем новые)
  if (widthInput) {
    const newWidthInput = widthInput.cloneNode(true);
    widthInput.parentNode.replaceChild(newWidthInput, widthInput);
    document.getElementById('room-width-input').addEventListener('input', updateRoomDimensions);
  }
  if (depthInput) {
    const newDepthInput = depthInput.cloneNode(true);
    depthInput.parentNode.replaceChild(newDepthInput, depthInput);
    document.getElementById('room-depth-input').addEventListener('input', updateRoomDimensions);
  }
  
  // Устанавливаем камеру видом сверху
  setTopViewCamera();
  
  // Заменяем кнопку "Редактировать комнату" на "Готово"
  if (window.editRoomButton) {
    // Удаляем все обработчики событий через клонирование
    const newButton = window.editRoomButton.cloneNode(true);
    window.editRoomButton.parentNode.replaceChild(newButton, window.editRoomButton);
    window.editRoomButton = newButton;
    
    // Устанавливаем новый текст
    window.editRoomButton.innerHTML = `<i class="fas fa-check" style="margin-right: 8px;"></i>Готово`;
    
    // Добавляем новый обработчик
    window.editRoomButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeEditRoomModal();
    });
  }
  
  // Показываем модалку
  modal.style.display = 'block';
  
  // Закрытие по клику вне модального окна (для правой панели не нужно, но оставляем)
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeEditRoomModal();
    }
  };
}

// Закрыть модалку редактирования комнаты
function closeEditRoomModal() {
  const modal = document.getElementById('edit-room-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Показываем потолок обратно при закрытии модалки
  if (room && room.walls && room.walls.ceiling) {
    room.walls.ceiling.visible = true;
  }
  room.group.traverse(child => {
    if (child.userData && child.userData.isCeiling) {
      child.visible = true;
    }
  });
  
  // Удаляем метки размеров
  if (window.roomDimensionLabels) {
    window.roomDimensionLabels.forEach(label => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    window.roomDimensionLabels = [];
  }
  
  // Восстанавливаем исходную позицию камеры
  if (window.initialCameraPosition && window.initialCameraTarget) {
    camera.position.copy(window.initialCameraPosition);
    camera.lookAt(window.initialCameraTarget);
    camera.updateMatrixWorld();
    
    if (controls && controls.update) {
      controls.target.copy(window.initialCameraTarget);
      controls.update();
    }
    
    console.log('📷 Камера восстановлена в исходное положение');
  }
  
  // Возвращаем кнопку "Редактировать комнату"
  if (window.editRoomButton) {
    // Удаляем все обработчики событий через клонирование
    const newButton = window.editRoomButton.cloneNode(true);
    window.editRoomButton.parentNode.replaceChild(newButton, window.editRoomButton);
    window.editRoomButton = newButton;
    
    // Устанавливаем новый текст
    window.editRoomButton.innerHTML = `<i class="fas fa-wrench" style="margin-right: 8px;"></i><i class="fas fa-pencil-alt" style="margin-right: 8px;"></i>Редактировать комнату`;
    
    // Добавляем новый обработчик
    window.editRoomButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showEditRoomModal();
    });
  }
}

// Обновить размеры комнаты
function updateRoomDimensions() {
  const widthInput = document.getElementById('room-width-input');
  const depthInput = document.getElementById('room-depth-input');
  const heightInput = document.getElementById('room-height-input');
  
  if (!widthInput || !depthInput || !heightInput) return;
  
  const newWidth = parseFloat(widthInput.value) * 10; // Конвертируем см в мм
  const newDepth = parseFloat(depthInput.value) * 10;
  const newHeight = parseFloat(heightInput.value) * 10;
  
  if (isNaN(newWidth) || isNaN(newDepth) || isNaN(newHeight)) return;
  if (newWidth < 1000 || newDepth < 1000 || newHeight < 2000) return; // Минимальные размеры
  
  // Удаляем старую комнату
  if (room && room.group) {
    scene.remove(room.group);
    // Очищаем ресурсы
    room.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
  
  // Создаем новую комнату с новыми размерами
  try {
    room = new Room(newWidth, newDepth, newHeight);
    
    // Центрируем комнату
    const roomCenterX = room.width / 2;
    const roomCenterZ = room.depth / 2;
    room.group.position.set(-roomCenterX, 0, -roomCenterZ);
    
    scene.add(room.group);
    wallPlanes = room.wallPlanes;
    
    // Обновляем границы комнаты
    const wallThickness = 100;
    roomBounds = {
      minX: -wallThickness / 2,
      maxX: room.width + wallThickness / 2,
      minZ: -wallThickness / 2,
      maxZ: room.depth + wallThickness / 2,
      minY: 0,
      maxY: room.height,
    };
    
    // Обновляем камеру для вида сверху и размеры (если модалка открыта)
    const modal = document.getElementById('edit-room-modal');
    if (modal && modal.style.display !== 'none') {
      setTopViewCamera(); // Это также обновит размеры
    }
    
    console.log('✅ Комната обновлена с новыми размерами:', {
      width: newWidth,
      depth: newDepth,
      height: newHeight
    });
  } catch (error) {
    console.error('❌ Ошибка при обновлении комнаты:', error);
  }
}

// Установить камеру видом сверху
function setTopViewCamera() {
  if (!camera || !room) return;
  
  // Скрываем потолок при виде сверху
  if (room.walls && room.walls.ceiling) {
    room.walls.ceiling.visible = false;
  }
  // Ищем потолок в группе комнаты
  room.group.traverse(child => {
    if (child.userData && child.userData.isCeiling) {
      child.visible = false;
    }
    // Также проверяем по материалу и позиции
    if (child.material && child.material.color && child.material.color.getHex() === 0xffffff && 
        child.position.y > room.height) {
      child.visible = false;
    }
  });
  
  // Позиционируем камеру сверху комнаты
  // Комната центрирована: её центр в мировых координатах находится в (0, height/2, 0)
  // Но для вида сверху нужно смотреть на пол (y=0)
  
  // Для вида сверху камера должна быть высоко над комнатой, смотря строго вниз
  const cameraHeight = room.height * 3; // Высоко над комнатой
  
  camera.position.set(
    0, // Центр по X (центр комнаты)
    cameraHeight, // Высоко над комнатой
    0  // Центр по Z (центр комнаты)
  );
  
  // Смотрим строго вниз на центр комнаты (на уровне пола)
  camera.lookAt(0, 0, 0);
  
  // Обновляем камеру
  camera.updateMatrixWorld();
  
  // Обновляем контролы
  if (controls && controls.update) {
    controls.target.set(0, 0, 0); // Смотрим на центр комнаты на уровне пола
    controls.update();
  }
  
  console.log('📷 Камера установлена видом сверху:', {
    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    target: { x: 0, y: 0, z: 0 },
    roomSize: { width: room.width, depth: room.depth, height: room.height }
  });
  
  // Обновляем метки размеров
  updateRoomDimensionLabels();
  
  console.log('✅ Камера установлена видом сверху, потолок скрыт, размеры добавлены');
}

// Load furniture from Clodis JSON file
async function loadFurnitureFromClodis() {
  try {
    // Load simplified cabinet data
    const clodisData = await loadSimplifiedCabinetData();
    if (!clodisData) {
      throw new Error('Failed to load simplified cabinet');
    }

    // Store current cabinet data for modal
    currentCabinetData = clodisData;

    // Set default parameters for Clodis builder
    // In Clodis, section sizes (s:x, s:y, s:z) are set via params
    // Clodis uses units=10, meaning: 1 unit = 10mm
    // So if we want 600mm width, we need 600/10 = 60 Clodis units
    // But ClodisBuilder expects mm, so we pass mm directly
    const params = {
      // Root section dimensions (in mm) - these become s:x, s:y, s:z
      // For a typical cabinet: 600mm wide, 2400mm high, 600mm deep
      sectionSize: {
        x: 600, // Width 600mm = 0.6m (should be visible in 5m room)
        y: 2400, // Height 2400mm = 2.4m
        z: 600, // Depth 600mm = 0.6m
      },
      variables: {
        vysota_cokolya: 100, // Height of plinth in mm
        glubina_cokolya: 100, // Depth of plinth in mm
        otstup_paza: 0, // Gap offset
      },
      groups: {
        g0: { thickness: 16 }, // Material thickness 16mm
        hdf1: { thickness: 3 }, // HDF thickness 3mm
      },
    };

    // Create furniture from Clodis data
    furniture = new Furniture(clodisData, params);

    // Set initial position (will be positioned when attached to wall)
    furniture.group.position.set(0, 0, 0);

    scene.add(furniture.group);

    console.log('Furniture loaded from Clodis JSON');
    console.log('Furniture group children:', furniture.group.children.length);

    // Check if furniture has valid geometry
    const tempBox = new THREE.Box3().setFromObject(furniture.group);
    console.log('Furniture initial bbox:', tempBox);
    console.log('Furniture size:', {
      width: tempBox.max.x - tempBox.min.x,
      height: tempBox.max.y - tempBox.min.y,
      depth: tempBox.max.z - tempBox.min.z,
    });

    if (tempBox.isEmpty() || isNaN(tempBox.min.x)) {
      console.warn('Furniture bbox is invalid! Geometry may not be built correctly.');
    }

    // Update camera target to center of room
    if (controls && roomBounds) {
      controls.target.set(roomBounds.maxX / 2, roomBounds.maxY / 2, roomBounds.maxZ / 2);
      controls.update();
    }
  } catch (error) {
    console.error('Error loading Clodis furniture:', error);
    // Fallback to placeholder
    furniture = new Furniture();
    scene.add(furniture.group);
  }
}

// Cabinet modal management
let currentCabinetData = null; // Store current cabinet data

// Load simplified cabinet data
async function loadSimplifiedCabinetData() {
  try {
    const response = await fetch('Шкаф упрощенный.txt');
    const jsonText = await response.text();
    const clodisData = JSON.parse(jsonText);
    currentCabinetData = clodisData;
    return clodisData;
  } catch (error) {
    console.error('Error loading simplified cabinet:', error);
    return null;
  }
}

// Load full cabinet example data
async function loadFullCabinetData() {
  try {
    const response = await fetch('Шкаф пример.txt');
    const jsonText = await response.text();
    const clodisData = JSON.parse(jsonText);
    return clodisData;
  } catch (error) {
    console.error('Error loading full cabinet:', error);
    return null;
  }
}

function initCabinetModal() {
  const backToMenu = document.getElementById('back-to-menu');
  const mainMenuView = document.getElementById('main-menu-view');
  const cabinetsView = document.getElementById('cabinets-view');
  const nextBtn = document.getElementById('sidebar-next-btn');
  const backBtn = document.getElementById('sidebar-back-btn');

  // Кнопка "←" в шапке каталога: возврат к списку папок (шаг 3) или к главному меню
  if (backToMenu) {
    backToMenu.addEventListener('click', () => {
      if (cabinetsView) cabinetsView.classList.remove('active');
      if (mainMenuView) mainMenuView.classList.add('active');
      if (window.step3CatalogOpen) window.step3CatalogOpen = false;
    });
  }

  // Обработчик кнопки "Назад"
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      goToPreviousStep();
    });
  }

  // Обработчик кнопки "Следующий"
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      // Определяем текущий шаг и переходим к следующему
      const stepIndicator = document.querySelector('.step-indicator');
      const currentStep = stepIndicator ? parseInt(stepIndicator.textContent.match(/\d+/)[0]) : 1;
      
      if (currentStep === 1 && window.selectedRoomType) {
        // Переход ко второму шагу - выбор расположения
        goToStep(2, getStepTitle(2, 'РАСПОЛОЖЕНИЕ'), buildRoomLayoutStep);
      } else if (currentStep === 2 && window.selectedRoomLayout) {
        // Переход к третьему шагу - выбор папки каталога (Кухни, Шкафы и т.д.)
        goToStep(3, getStepTitle(3, 'КАТАЛОГ'), buildCatalogFoldersStep);
      } else if (currentStep === 3 && window.selectedCatalogFolder) {
        // Переход к четвертому шагу — каталог выбранной папки
        var folder = window.selectedCatalogFolder;
        goToStep(4, (folder.name || folder.id).toUpperCase(), function(container) {
          buildCatalogStep4(container, folder.id, folder.name || folder.id);
        });
      }
    });
  }

  // Меню будет заполняться динамически пользователем
  // Все предустановленные пункты меню удалены
}

function loadGLBFromPath(glbPath) {
  // Загружаем GLTFLoader динамически если не загружен
  if (typeof window.GLTFLoader === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
    script.onload = () => {
      loadGLBFromPathInternal(glbPath);
    };
    script.onerror = () => {
      alert('Не удалось загрузить GLTFLoader. Проверьте подключение к интернету.');
    };
    document.head.appendChild(script);
  } else {
    loadGLBFromPathInternal(glbPath);
  }
}

function loadGLBFromPathInternal(glbPath) {
  const GLTFLoaderClass = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
  if (!GLTFLoaderClass) {
    alert('GLTFLoader не загружен. Обновите страницу и попробуйте снова.');
    return;
  }
  
  console.log('📦 Загрузка GLB из каталога для размещения:', glbPath);
  
  const loader = new GLTFLoaderClass();
  
  // Загружаем GLB только для получения размеров и создания ghost
  loader.load(glbPath, (gltf) => {
    console.log('📦 GLB загружен для создания призрака:', glbPath);
    
    // Создаем временную мебель для получения bbox (skip placeholder)
    const gltfScene = gltf.scene.clone();
    const tempFurniture = new Furniture(null, { skipPlaceholder: true, skipDebugHelpers: true });
    tempFurniture.group.add(gltfScene);
    tempFurniture.setupPivot();
    
    // Получаем bbox и размеры
    const bbox = tempFurniture.bbox.clone(); // Клонируем bbox
    const size = bbox.max.clone().sub(bbox.min);
    
    console.log('📐 Размеры GLB:', size);
    console.log('  BBox min:', bbox.min);
    console.log('  BBox max:', bbox.max);
    
    // Очищаем временную мебель
    tempFurniture.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    // Создаем ghost для GLB (как для примерного шкафа)
    createGLBGhost(glbPath, size, bbox);
    
    // Включаем режим размещения - сохраняем размеры и bbox
    isPlacingFurniture = true;
    pendingFurnitureData = { 
      type: 'glb', 
      path: glbPath, 
      size: size.clone(), // Клонируем размеры
      bbox: bbox.clone()  // Клонируем bbox
    };
    
    console.log('✅ Режим размещения GLB активирован');
  }, undefined, (error) => {
    console.error('❌ Ошибка загрузки GLB из каталога:', error);
    alert('Ошибка загрузки GLB файла: ' + error.message);
  });
}

// Создать ghost для GLB (аналогично createFurnitureGhost)
function createGLBGhost(glbPath, size, bbox) {
  if (furnitureGhost) {
    removeFurnitureGhost();
  }

  // Create ghost as a group
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'GLBFurnitureGhost';
  ghostGroup.visible = false;
  ghostGroup.userData.isGhost = true;
  ghostGroup.userData.glbPath = glbPath;

  // Create box as ghost with correct dimensions
  const ghostGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0x00aaff, // Blue color (like IKEA)
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    emissive: 0x0066cc,
    emissiveIntensity: 0.3,
  });

  const ghostMesh = new THREE.Mesh(ghostGeometry, ghostMaterial);
  // Offset so pivot is at back-left-bottom (0, 0, 0) in group coordinates
  ghostMesh.position.set(-bbox.min.x, -bbox.min.y, -bbox.min.z);
  ghostGroup.add(ghostMesh);

  // Add red sphere at pivot point
  const pivotGeometry = new THREE.SphereGeometry(50, 16, 16); // 50mm = 5cm radius (in millimeters)
  const pivotMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, // Red color
    transparent: true,
    opacity: 0.9,
  });
  const pivotMarker = new THREE.Mesh(pivotGeometry, pivotMaterial);
  pivotMarker.position.set(0, 0, 0); // Pivot is at origin
  pivotMarker.name = 'PivotMarker';
  ghostGroup.add(pivotMarker);

  furnitureGhost = ghostGroup;
  scene.add(furnitureGhost);

  console.log('👻 Призрак GLB создан:', size);
}

// Загрузить сохраненную модель из конструктора
function loadSavedModel(modelData) {
  // Декодируем GLB из base64
  const base64 = modelData.glb;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const arrayBuffer = bytes.buffer;
  
  // Создаем Blob и загружаем через GLTFLoader
  const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  
  // Загружаем GLTFLoader динамически если не загружен
  if (typeof window.GLTFLoader === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
    script.onload = () => {
      loadSavedModelInternal(url, modelData);
    };
    script.onerror = () => {
      alert('Не удалось загрузить GLTFLoader. Проверьте подключение к интернету.');
    };
    document.head.appendChild(script);
  } else {
    loadSavedModelInternal(url, modelData);
  }
}

function loadSavedModelInternal(url, modelData) {
  const GLTFLoaderClass = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
  if (!GLTFLoaderClass) {
    alert('GLTFLoader не загружен. Обновите страницу и попробуйте снова.');
    return;
  }
  
  const loader = new GLTFLoaderClass();
  
  loader.load(url, (gltf) => {
    // НЕ отзываем URL сразу - он понадобится при размещении мебели!
    
    console.log('📦 Сохраненная модель загружена:', modelData.metadata.name);
    
    // Создаем временную мебель для получения bbox (skip placeholder)
    const gltfScene = gltf.scene.clone();
    const tempFurniture = new Furniture(null, { skipPlaceholder: true, skipDebugHelpers: true });
    tempFurniture.group.add(gltfScene);
    tempFurniture.setupPivot();
    
    // Получаем bbox и размеры
    const bbox = tempFurniture.bbox.clone();
    const size = bbox.max.clone().sub(bbox.min);
    
    // Очищаем временную мебель
    tempFurniture.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    // Создаем ghost для размещения
    createGLBGhost(url, size, bbox);
    
    // Включаем режим размещения с метаданными
    // Сохраняем оригинальный modelData для пересоздания URL при размещении
    isPlacingFurniture = true;
    pendingFurnitureData = { 
      type: 'savedModel', 
      url: url, // Сохраняем URL, но он будет пересоздан при размещении
      modelData: modelData, // Сохраняем полные данные для пересоздания Blob URL
      size: size.clone(),
      bbox: bbox.clone()
    };
    
    console.log('✅ Режим размещения сохраненной модели активирован');
    console.log('  URL сохранен для использования при размещении');
  }, undefined, (error) => {
    console.error('❌ Ошибка загрузки сохраненной модели:', error);
    alert('Ошибка загрузки модели: ' + error.message);
    // Отзываем URL только в случае ошибки
    URL.revokeObjectURL(url);
  });
}

// Загрузить и разместить сохраненную модель в указанной позиции
// targetSize: { x, y, z } — целевые размеры зоны, модель масштабируется под них
function loadSavedModelForPlacement(url, modelData, position, rotationY, wall, targetSize = null) {
  const GLTFLoaderClass = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
  if (!GLTFLoaderClass) {
    alert('GLTFLoader не загружен. Обновите страницу и попробуйте снова.');
    return;
  }
  
  console.log('📦 Загрузка сохраненной модели для размещения:', modelData.metadata.name);
  console.log('  Позиция:', position);
  console.log('  Поворот:', rotationY);
  console.log('  Стена:', wall);
  
  const loader = new GLTFLoaderClass();
  
  loader.load(url, (gltf) => {
    console.log('📦 Сохраненная модель загружена для размещения:', modelData.metadata.name);
    
    // Remove existing furniture
    if (furniture && furniture.group) {
      scene.remove(furniture.group);
      furniture.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      furniture = null;
    }

    // Create Furniture from GLB (skip placeholder and debug helpers)
    const gltfScene = gltf.scene.clone();
    furniture = new Furniture(null, { skipPlaceholder: true, skipDebugHelpers: true });
    furniture.group.add(gltfScene);
    furniture.group.userData.isFurniture = true;
    furniture.group.userData.sourceFile = modelData.metadata.name;
    furniture.group.userData.attachedWall = wall;
    furniture.group.userData.isGLB = true;
    furniture.group.userData.isSavedModel = true;
    furniture.group.userData.modelMetadata = modelData.metadata;
    furniture.group.userData.originalScale = { x: 1, y: 1, z: 1 };
    
    // Инициализация анимаций если есть
    if (gltf.animations && gltf.animations.length > 0) {
      furnitureAnimationMixer = new THREE.AnimationMixer(gltfScene);
      furnitureAnimations = {};
      
      gltf.animations.forEach((clip, index) => {
        const action = furnitureAnimationMixer.clipAction(clip);
        furnitureAnimations[clip.name || `animation_${index}`] = action;
      });
      
      furniture.group.userData.animations = Object.keys(furnitureAnimations);
    }
    
    // Настройка pivot (back-left-bottom)
    furniture.setupPivot();
    
    // Устанавливаем позицию и поворот
    const roomWorldPos = new THREE.Vector3();
    room.group.getWorldPosition(roomWorldPos);
    
    // После setupPivot, bbox.min.y должен быть 0 (pivot at back-left-bottom)
    // Пересчитываем bbox после setupPivot чтобы убедиться что он актуален
    furniture.bbox.setFromObject(furniture.group);
    const localBbox = furniture.bbox;
    
    const adjustedPosition = position.clone();
    
    // Если bbox.min.y не 0, это значит pivot не на полу - корректируем
    if (Math.abs(localBbox.min.y) > 0.001) {
      // Смещаем позицию так, чтобы bbox.min.y в мировых координатах был на уровне пола
      adjustedPosition.y = roomWorldPos.y - localBbox.min.y;
      console.log('⚠️ bbox.min.y != 0, adjusting Y position by:', localBbox.min.y);
    } else {
      // bbox.min.y = 0, значит pivot на полу - просто устанавливаем Y на уровень пола
      adjustedPosition.y = roomWorldPos.y; // Floor level (should be 0)
      console.log('✅ bbox.min.y is 0, pivot is at floor level');
    }
    
    // Масштабируем под призрак (глубина 60 см), если заданы целевые размеры
    if (targetSize && targetSize.x && targetSize.y && targetSize.z) {
      furniture.bbox.setFromObject(furniture.group);
      const size = furniture.bbox.max.clone().sub(furniture.bbox.min);
      if (size.x > 0 && size.y > 0 && size.z > 0) {
        const sx = targetSize.x / size.x;
        const sy = targetSize.y / size.y;
        const sz = targetSize.z / size.z;
        furniture.group.scale.set(sx, sy, sz);
        furniture.bbox.setFromObject(furniture.group);
      }
    }
    
    furniture.group.position.copy(adjustedPosition);
    furniture.group.rotation.y = rotationY;
    
    furniture.group.userData.originalSize = furniture.bbox.max.clone().sub(furniture.bbox.min);
    
    scene.add(furniture.group);
    
    // Отзываем URL после успешной загрузки
    URL.revokeObjectURL(url);
    
    // Reset wall highlight
    if (room && room.resetWallHighlight) {
      room.resetWallHighlight();
    }
    
    console.log('✅ Сохраненная модель размещена:', modelData.metadata.name);
    console.log('  Позиция:', furniture.group.position);
    console.log('  Поворот:', furniture.group.rotation.y);
  }, undefined, (error) => {
    console.error('❌ Ошибка загрузки сохраненной модели для размещения:', error);
    alert('Ошибка загрузки модели: ' + error.message);
    // Отзываем URL в случае ошибки
    URL.revokeObjectURL(url);
  });
}

// Загрузить и разместить GLB файл в указанной позиции
// targetSize: { x, y, z } — целевые размеры зоны (призрака), модель масштабируется под них
function loadGLBFileForPlacement(glbPath, position, rotationY, wall, targetSize = null) {
  const GLTFLoaderClass = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
  if (!GLTFLoaderClass) {
    alert('GLTFLoader не загружен. Обновите страницу и попробуйте снова.');
    return;
  }
  
  console.log('📦 Загрузка GLB для размещения:', glbPath);
  console.log('  Позиция:', position);
  console.log('  Поворот:', rotationY);
  console.log('  Стена:', wall);
  
  const loader = new GLTFLoaderClass();
  
  loader.load(glbPath, (gltf) => {
    console.log('📦 GLB загружен для размещения:', glbPath);
    
    // Remove existing furniture
    if (furniture && furniture.group) {
      scene.remove(furniture.group);
      furniture.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      furniture = null;
    }

    // Create Furniture from GLB (skip placeholder and debug helpers)
    const gltfScene = gltf.scene.clone();
    furniture = new Furniture(null, { skipPlaceholder: true, skipDebugHelpers: true });
    furniture.group.add(gltfScene);
    furniture.group.userData.isFurniture = true;
    furniture.group.userData.sourceFile = glbPath;
    furniture.group.userData.attachedWall = wall;
    
    // Настройка pivot (back-left-bottom)
    furniture.setupPivot();
    
    // Устанавливаем позицию и поворот
    const roomWorldPos = new THREE.Vector3();
    room.group.getWorldPosition(roomWorldPos);
    
    // После setupPivot, bbox.min.y должен быть 0 (pivot at back-left-bottom)
    // Позиция Y должна быть такой, чтобы bbox.min.y в мировых координатах был на уровне пола (y = 0)
    const adjustedPosition = position.clone();
    
    // Пересчитываем bbox после setupPivot чтобы убедиться что он актуален
    furniture.bbox.setFromObject(furniture.group);
    const localBbox = furniture.bbox;
    
    // Если bbox.min.y не 0, это значит pivot не на полу - корректируем
    if (Math.abs(localBbox.min.y) > 0.001) {
      // Смещаем позицию так, чтобы bbox.min.y в мировых координатах был на уровне пола
      adjustedPosition.y = roomWorldPos.y - localBbox.min.y;
      console.log('⚠️ bbox.min.y != 0, adjusting Y position by:', localBbox.min.y);
    } else {
      adjustedPosition.y = roomWorldPos.y;
      console.log('✅ bbox.min.y is 0, pivot is at floor level');
    }
    
    // Масштабируем под призрак (глубина 60 см), если заданы целевые размеры
    if (targetSize && targetSize.x && targetSize.y && targetSize.z) {
      furniture.bbox.setFromObject(furniture.group);
      const size = furniture.bbox.max.clone().sub(furniture.bbox.min);
      if (size.x > 0 && size.y > 0 && size.z > 0) {
        furniture.group.scale.set(
          targetSize.x / size.x,
          targetSize.y / size.y,
          targetSize.z / size.z
        );
        furniture.bbox.setFromObject(furniture.group);
      }
    }
    
    furniture.group.position.copy(adjustedPosition);
    furniture.group.rotation.y = rotationY;
    
    const finalBbox = new THREE.Box3().setFromObject(furniture.group);
    
    scene.add(furniture.group);
    
    // Reset wall highlight
    if (room && room.resetWallHighlight) {
      room.resetWallHighlight();
    }
    
    console.log('✅ GLB размещен:', glbPath);
    console.log('  Позиция:', furniture.group.position);
    console.log('  Поворот:', furniture.group.rotation.y);
  }, undefined, (error) => {
    console.error('❌ Ошибка загрузки GLB для размещения:', error);
    alert('Ошибка загрузки GLB файла: ' + error.message);
  });
}

function loadGLBFile(file) {
  // Загружаем GLTFLoader динамически если не загружен
  if (typeof window.GLTFLoader === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
    script.onload = () => {
      loadGLBFileInternal(file);
    };
    script.onerror = () => {
      alert('Не удалось загрузить GLTFLoader. Проверьте подключение к интернету.');
    };
    document.head.appendChild(script);
  } else {
    loadGLBFileInternal(file);
  }
}

function loadGLBFileInternal(file) {
  // Используем GLTFLoader из window или THREE
  const GLTFLoaderClass = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
  if (!GLTFLoaderClass) {
    alert('GLTFLoader не загружен. Обновите страницу и попробуйте снова.');
    return;
  }
  
  console.log('📦 Загрузка GLB файла:', file.name, 'размер:', (file.size / 1024).toFixed(2), 'KB');
  
  const loader = new GLTFLoaderClass();
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const arrayBuffer = e.target.result;
    const url = URL.createObjectURL(new Blob([arrayBuffer]));
    
    loader.load(url, (gltf) => {
      URL.revokeObjectURL(url);
      
      console.log('📦 GLB распарсен:', {
        scene: gltf.scene,
        scenes: gltf.scenes,
        animations: gltf.animations?.length || 0,
        cameras: gltf.cameras?.length || 0
      });
      
      // Remove ALL existing furniture from scene
      const furnitureToRemove = [];
      scene.traverse(child => {
        if (child.userData && child.userData.isFurniture) {
          furnitureToRemove.push(child);
        }
      });
      furnitureToRemove.forEach(item => scene.remove(item));
      
      if (furniture && furniture.group) {
        scene.remove(furniture.group);
        furniture.group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        furniture = null;
      }

      // Create Furniture from GLB
      const gltfScene = gltf.scene.clone(); // Клонируем чтобы не менять оригинал
      console.log('📐 Размеры GLB сцены до обработки:');
      const tempBox = new THREE.Box3().setFromObject(gltfScene);
      console.log('  BBox min:', tempBox.min);
      console.log('  BBox max:', tempBox.max);
      console.log('  Размер:', tempBox.max.clone().sub(tempBox.min));
      
      furniture = new Furniture(null, { skipPlaceholder: true, skipDebugHelpers: true });
      furniture.group.add(gltfScene);
      furniture.group.userData.isFurniture = true;
      furniture.group.userData.sourceFile = file.name;
      furniture.group.userData.isGLB = true; // Флаг что это GLB
      furniture.group.userData.originalScale = { x: 1, y: 1, z: 1 }; // Сохраняем оригинальный масштаб
      
      // Инициализация анимаций GLB
      if (gltf.animations && gltf.animations.length > 0) {
        furnitureAnimationMixer = new THREE.AnimationMixer(gltfScene);
        furnitureAnimations = {};
        
        gltf.animations.forEach((clip, index) => {
          const action = furnitureAnimationMixer.clipAction(clip);
          furnitureAnimations[clip.name || `animation_${index}`] = action;
          console.log('🎬 Найдена анимация:', clip.name || `animation_${index}`, 'длительность:', clip.duration, 'сек');
        });
        
        furniture.group.userData.animations = Object.keys(furnitureAnimations);
        console.log('✅ Анимации GLB инициализированы:', Object.keys(furnitureAnimations));
      } else {
        furnitureAnimationMixer = null;
        furnitureAnimations = {};
        console.log('ℹ️ Анимации в GLB не найдены');
      }
      
      // Настройка pivot (back-left-bottom)
      furniture.setupPivot();
      
      // Позиция на полу
      furniture.group.position.y = 0;
      
      // Логируем финальные размеры
      furniture.bbox.setFromObject(furniture.group);
      console.log('📐 Размеры после setupPivot:');
      console.log('  BBox min:', furniture.bbox.min);
      console.log('  BBox max:', furniture.bbox.max);
      console.log('  Размер:', furniture.bbox.max.clone().sub(furniture.bbox.min));
      console.log('  Позиция группы:', furniture.group.position);
      
      // Сохраняем оригинальные размеры для параметрического изменения
      furniture.group.userData.originalSize = furniture.bbox.max.clone().sub(furniture.bbox.min);
      
      scene.add(furniture.group);
      console.log('✅ GLB загружен и размещен:', file.name);
    }, undefined, (error) => {
      console.error('❌ Ошибка загрузки GLB:', error);
      alert('Ошибка загрузки GLB файла: ' + error.message);
    });
  };
  
  reader.readAsArrayBuffer(file);
}

async function loadCabinetsList(catalogType = null) {
  const cabinetsGrid = document.getElementById('cabinets-grid');
  if (!cabinetsGrid) return;

  // Clear existing items
  cabinetsGrid.innerHTML = '';
  
  // Загружаем сохраненные модели из localStorage
  loadSavedModels(catalogType);
  
  // Если нет сохраненных моделей, показываем сообщение
  if (cabinetsGrid.children.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.style.padding = '20px';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.color = '#666';
    emptyMessage.textContent = catalogType ? 
      `Нет элементов в категории "${catalogType}".\nСоздайте модель в конструкторе и сохраните её в эту категорию.` :
      'Нет сохраненных моделей.\nСоздайте модель в конструкторе и сохраните её.';
    emptyMessage.style.whiteSpace = 'pre-line';
    cabinetsGrid.appendChild(emptyMessage);
  }
}

// Создать динамическое меню в комнате на основе сохраненных каталогов
// Делаем функцию глобальной, чтобы её можно было вызвать из конструктора
window.buildRoomMenu = function buildRoomMenu() {
  const mainMenuView = document.getElementById('main-menu-view');
  if (!mainMenuView) return;
  
  // Очищаем все содержимое
  mainMenuView.innerHTML = '';
  
  // Скрываем кнопку "Назад" на первом шаге
  const backBtn = document.getElementById('sidebar-back-btn');
  if (backBtn) {
    backBtn.classList.add('hidden');
  }
  
  // Создаем первый шаг - выбор типа комнаты
  const stepBadge = document.querySelector('.step-badge');
  const stepTitleEl = document.querySelector('.step-title');
  if (stepBadge) stepBadge.textContent = '1';
  if (stepTitleEl) stepTitleEl.textContent = getStepTitle(1, 'ТИП КОМНАТЫ');
  buildRoomTypeStep(mainMenuView);
  
  // Ищем все каталоги в localStorage (для дальнейших шагов)
  const foundCategories = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('catalog_')) {
      const catalogType = key.replace('catalog_', '');
      foundCategories.add(catalogType);
    }
  }
  
  // Названия категорий и иконки
  // Используем стандартные Font Awesome иконки
  const categoryInfo = {
    'cabinet': { name: 'Шкафы', icon: 'fa-archive' },
    'kitchen': { name: 'Кухни', icon: 'fa-utensils' },
    'door': { name: 'Двери', icon: 'fa-door-open' },
    'shelf': { name: 'Полки', icon: 'fa-layer-group' },
    'drawer': { name: 'Ящики', icon: 'fa-inbox' },
    'module': { name: 'Кухни', icon: 'fa-utensils' }
  };
  window.__catalogCategoryInfo = categoryInfo;
  
  // Добавляем кнопку "Создать секцию" после иконок выбора типа комнаты
  const createSectionBtn = document.createElement('div');
  createSectionBtn.className = 'menu-item highlighted';
  createSectionBtn.style.marginTop = '20px';
  createSectionBtn.innerHTML = `
    <div class="menu-item-icon">
      <i class="fas fa-cube"></i>
    </div>
    <div class="menu-item-text">Создать секцию</div>
    <div class="menu-item-arrow">→</div>
  `;
  createSectionBtn.addEventListener('click', () => {
    showCreateSectionModal();
  });
  mainMenuView.appendChild(createSectionBtn);
  
  // Добавляем разделитель
  const separator = document.createElement('div');
  separator.style.height = '24px';
  mainMenuView.appendChild(separator);
  
  // Загружаем названия каталогов: сначала API (id-based, совпадает с catalog_1, catalog_26),
  // затем статичный public/data/catalogs_keys.json как fallback
  function loadCatalogNamesAndRebuild() {
    const apiUrl = (typeof window.location !== 'undefined' && window.location.origin)
      ? (window.location.origin + '/api/catalog/items_get/catalogs_keys')
      : null;
    if (apiUrl) {
      fetch(apiUrl, { cache: 'no-cache' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          if (Array.isArray(data)) {
            data.forEach(item => {
              const info = { name: item.name || 'Каталог', icon: item.icon || 'fa-folder' };
              if (item.id != null) categoryInfo[String(item.id)] = info;
              const keyPart = (item.key || '').replace(/^catalog_/, '');
              if (keyPart) categoryInfo[keyPart] = categoryInfo[keyPart] || info;
            });
          }
          window.__catalogCategoryInfo = categoryInfo;
          rebuildMenuItems();
        })
        .catch(() => {
          fetch('public/data/catalogs_keys.json')
            .then(r => r.json())
            .then(data => {
              if (Array.isArray(data)) {
                data.forEach(item => {
                  const key = (item.key || '').replace(/^catalog_/, '');
                  const idKey = item.id != null ? String(item.id) : null;
                  const info = { name: item.name || 'Каталог', icon: item.icon || 'fa-folder' };
                  if (key) categoryInfo[key] = categoryInfo[key] || info;
                  if (idKey) categoryInfo[idKey] = categoryInfo[idKey] || info;
                });
              }
              window.__catalogCategoryInfo = categoryInfo;
              rebuildMenuItems();
            })
            .catch(() => rebuildMenuItems());
        });
    } else {
      fetch('public/data/catalogs_keys.json')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            data.forEach(item => {
              const key = (item.key || '').replace(/^catalog_/, '');
              const idKey = item.id != null ? String(item.id) : null;
              const info = { name: item.name || 'Каталог', icon: item.icon || 'fa-folder' };
              if (key) categoryInfo[key] = categoryInfo[key] || info;
              if (idKey) categoryInfo[idKey] = categoryInfo[idKey] || info;
            });
          }
          window.__catalogCategoryInfo = categoryInfo;
          rebuildMenuItems();
        })
        .catch(() => rebuildMenuItems());
    }
  }
  loadCatalogNamesAndRebuild();
  
  function rebuildMenuItems() {
    // Удаляем все пункты меню категорий (оставляем только "Создать секцию")
    const categoryItems = mainMenuView.querySelectorAll('.menu-item[data-catalog-type]');
    categoryItems.forEach(item => item.remove());
    
    // Удаляем сообщение об отсутствии категорий, если оно есть
    const emptyMessage = mainMenuView.querySelector('.empty-message');
    if (emptyMessage) emptyMessage.remove();
    
    // Создаем пункты меню для найденных категорий
    const sortedCategories = Array.from(foundCategories).sort();
    
    sortedCategories.forEach(catalogType => {
      const info = categoryInfo[catalogType] || { name: catalogType, icon: 'fa-folder' };
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';
      menuItem.dataset.catalogType = catalogType;
      
      // Определяем класс иконки Font Awesome
      let iconClass = 'fa-folder';
      if (info.icon) {
        // Если иконка начинается с 'fa-', используем как есть, иначе добавляем префикс
        iconClass = info.icon.startsWith('fa-') ? info.icon : `fa-${info.icon}`;
        // Проверяем, что иконка существует, иначе используем fallback
        // Некоторые иконки из catalogs_keys.json могут не существовать в Font Awesome
        // В таком случае используем стандартные иконки
        const iconMap = {
          'fa-kitchen-set': 'fa-utensils',
          'fa-cabinet-filing': 'fa-archive',
          'fa-door-closed': 'fa-door-open'
        };
        if (iconMap[iconClass]) {
          iconClass = iconMap[iconClass];
        }
      }
      
      menuItem.innerHTML = `
        <div class="menu-item-icon">
          <i class="fas ${iconClass}"></i>
        </div>
        <div class="menu-item-text">${info.name}</div>
        <div class="menu-item-arrow"><i class="fas fa-chevron-right"></i></div>
      `;
      
      menuItem.addEventListener('click', () => {
        const mainMenuView = document.getElementById('main-menu-view');
        const cabinetsView = document.getElementById('cabinets-view');
        const cabinetsViewTitle = document.getElementById('cabinets-view-title');
        
        if (mainMenuView) mainMenuView.classList.remove('active');
        if (cabinetsView) {
          cabinetsView.classList.add('active');
          if (cabinetsViewTitle) cabinetsViewTitle.textContent = info.name;
          loadCabinetsList(catalogType);
        }
      });
      
      mainMenuView.appendChild(menuItem);
    });
    
    // Если нет категорий, показываем сообщение
    if (sortedCategories.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.style.padding = '20px';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#666';
      emptyMessage.innerHTML = '<i class="fas fa-info-circle" style="margin-right: 8px;"></i>Нет сохраненных категорий.<br>Создайте модель в конструкторе и сохраните её.';
      emptyMessage.style.whiteSpace = 'pre-line';
      mainMenuView.appendChild(emptyMessage);
    }
  }
  
  // Строим меню категорий сразу (под иконками выбора типа комнаты)
  rebuildMenuItems();
}

// Конфиг шагов комнаты из админки (localStorage room_steps_config)
function getRoomStepsConfig() {
  try {
    const raw = localStorage.getItem('room_steps_config');
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.steps && c.steps.length) return c;
    }
  } catch (e) {}
  return null;
}

// Текущий номер шага (1–6)
function getCurrentStepNumber() {
  const stepIndicator = document.querySelector('.step-indicator');
  if (!stepIndicator) return 1;
  const m = stepIndicator.textContent.match(/\d+/);
  return m ? parseInt(m[0], 10) : 1;
}

// Заголовок шага из конфига админки (room_steps_config)
function getStepTitle(stepId, fallback) {
  const config = getRoomStepsConfig();
  if (config && config.steps) {
    const step = config.steps.find(function(s) { return s.stepId === stepId; });
    const t = step && step.title ? String(step.title).trim() : '';
    if (t) return t.toUpperCase();
  }
  return fallback || ('ШАГ ' + stepId);
}

// Создать первый шаг - выбор типа комнаты (иконки из админки или по умолчанию)
function buildRoomTypeStep(container) {
  let roomTypes = [
    { name: 'Гостиная', icon: 'fa-couch', key: 'living-room' },
    { name: 'Спальня', icon: 'fa-bed', key: 'bedroom' },
    { name: 'Детская', icon: 'fa-child', key: 'nursery' },
    { name: 'Прихожая', icon: 'fa-door-open', key: 'hallway' },
    { name: 'Постирочная', icon: 'fa-tshirt', key: 'laundry' },
    { name: 'Балкон', icon: 'fa-home', key: 'balcony' }
  ];
  const config = getRoomStepsConfig();
  if (config && config.steps) {
    const step1 = config.steps.find(function(s) { return s.stepId === 1; }) || config.steps[0];
    if (step1 && step1.items && step1.items.length > 0) {
      roomTypes = step1.items
        .sort(function(a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function(it) {
          return { name: it.name || 'Пункт', icon: it.icon || 'fa-circle', key: it.key || ('item-' + it.id), categoryId: it.categoryId || null };
        });
    }
  }

  const grid = document.createElement('div');
  grid.className = 'room-types-grid';
  var columnsPerRow = 2;
  if (config && config.steps && config.steps[0] && (config.steps[0].columnsPerRow === 1 || config.steps[0].columnsPerRow === 2)) {
    columnsPerRow = config.steps[0].columnsPerRow;
  }
  grid.style.gridTemplateColumns = columnsPerRow === 1 ? '1fr' : 'repeat(2, 1fr)';
  grid.setAttribute('data-cols', String(columnsPerRow));

  roomTypes.forEach(function(roomType) {
    const item = document.createElement('div');
    item.className = 'room-type-item';
    item.dataset.roomType = roomType.key;

    var iconHtml = '';
    var iconVal = roomType.icon || '';
    var isImg = /^https?:\/\//i.test(iconVal) || (iconVal.length > 0 && iconVal.charAt(0) === '/');
    if (isImg) {
      iconHtml = '<div class="room-type-icon"><img src="' + iconVal.replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display=\'none\';var s=this.nextElementSibling;s.style.display=\'block\';"><i class="fas fa-image" style="display:none;font-size:2em;"></i></div>';
    } else {
      iconHtml = '<div class="room-type-icon"><i class="fas ' + (iconVal || 'fa-circle') + '"></i></div>';
    }
    item.innerHTML = iconHtml + '<div class="room-type-name">' + (roomType.name || '').replace(/</g, '&lt;') + '</div>';

    item.addEventListener('click', function() {
      grid.querySelectorAll('.room-type-item').forEach(function(i) { i.classList.remove('selected'); });
      item.classList.add('selected');
      window.selectedRoomType = roomType;
      var nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) nextBtn.disabled = false;
    });

    grid.appendChild(item);
  });

  container.appendChild(grid);
}

// Переход к следующему шагу
function goToStep(stepNumber, stepTitle, stepBuilder) {
  // Обновляем заголовок шага
  const stepBadge = document.querySelector('.step-badge');
  const stepTitleEl = document.querySelector('.step-title');
  if (stepBadge) stepBadge.textContent = stepNumber;
  if (stepTitleEl) stepTitleEl.textContent = stepTitle;
  
  // Обновляем индикатор шага
  const stepIndicator = document.querySelector('.step-indicator');
  if (stepIndicator) stepIndicator.textContent = `Шаг ${stepNumber}/6`;
  
  // Показываем/скрываем кнопку "Назад"
  const backBtn = document.getElementById('sidebar-back-btn');
  if (backBtn) {
    if (stepNumber === 1) {
      backBtn.classList.add('hidden');
    } else {
      backBtn.classList.remove('hidden');
    }
  }
  
  // Очищаем контент и создаем новый шаг
  const mainMenuView = document.getElementById('main-menu-view');
  if (mainMenuView && stepBuilder) {
    mainMenuView.innerHTML = '';
    stepBuilder(mainMenuView);
  }
  
  // Деактивируем кнопку "Следующий"
  const nextBtn = document.getElementById('sidebar-next-btn');
  if (nextBtn) {
    nextBtn.disabled = true;
  }

  // Обновить строку под ценой для текущего шага
  if (typeof window.updatePriceSublineForStep === 'function') {
    window.updatePriceSublineForStep(stepNumber);
  }
}

// Переход к предыдущему шагу
function goToPreviousStep() {
  const stepIndicator = document.querySelector('.step-indicator');
  const currentStep = stepIndicator ? parseInt(stepIndicator.textContent.match(/\d+/)[0]) : 1;
  
  if (currentStep === 1) {
    return; // Уже на первом шаге
  }
  
  if (currentStep === 2) {
    // Возвращаемся к первому шагу
    goToStep(1, getStepTitle(1, 'ТИП КОМНАТЫ'), buildRoomTypeStep);
    // Восстанавливаем выбор типа комнаты, если был
    if (window.selectedRoomType) {
      setTimeout(() => {
        const roomItem = document.querySelector(`[data-room-type="${window.selectedRoomType.key}"]`);
        if (roomItem) {
          roomItem.classList.add('selected');
          const nextBtn = document.getElementById('sidebar-next-btn');
          if (nextBtn) nextBtn.disabled = false;
        }
      }, 100);
    }
  } else if (currentStep === 3) {
    if (window.step3CatalogOpen) {
      // Закрываем каталог и показываем снова список папок
      window.step3CatalogOpen = false;
      const cabinetsView = document.getElementById('cabinets-view');
      const mainMenuView = document.getElementById('main-menu-view');
      if (cabinetsView) cabinetsView.classList.remove('active');
      if (mainMenuView) mainMenuView.classList.add('active');
    } else {
      // Возвращаемся ко второму шагу
      goToStep(2, getStepTitle(2, 'РАСПОЛОЖЕНИЕ'), buildRoomLayoutStep);
      if (window.selectedRoomLayout) {
        setTimeout(() => {
          const layoutItem = document.querySelector(`[data-layout-type="${window.selectedRoomLayout.key}"]`);
          if (layoutItem) {
            layoutItem.classList.add('selected');
            const nextBtn = document.getElementById('sidebar-next-btn');
            if (nextBtn) nextBtn.disabled = false;
          }
        }, 100);
      }
    }
  } else if (currentStep === 4) {
    goToStep(3, getStepTitle(3, 'КАТАЛОГ'), buildCatalogFoldersStep);
    if (window.selectedCatalogFolder) {
      setTimeout(function() {
        var item = document.querySelector('[data-catalog-folder-id="' + CSS.escape(String(window.selectedCatalogFolder.id)) + '"]');
        if (item) {
          item.parentNode.querySelectorAll('.room-type-item').forEach(function(i) { i.classList.remove('selected'); });
          item.classList.add('selected');
          var nextBtn = document.getElementById('sidebar-next-btn');
          if (nextBtn) nextBtn.disabled = false;
        }
      }, 50);
    }
  }
  // Здесь можно добавить обработку других шагов
}

// Папки каталога на шаге 3 — по умолчанию (если нет данных в room_steps_config)
var CATALOG_FOLDERS = [
  { id: '1', name: 'Кухни', icon: 'fa-utensils' },
  { id: 'korpusnaya_mebel', name: 'Корпусная мебель', icon: 'fa-couch' },
  { id: '2', name: 'Шкафы', icon: 'fa-archive' }
];

// Шаг 3: выбор папки каталога. Берёт пункты из room_steps_config (шаг 3), иначе — CATALOG_FOLDERS.
function buildCatalogFoldersStep(container) {
  container.innerHTML = '';
  window.step3CatalogOpen = false;

  var folders = [];
  var config = getRoomStepsConfig();
  if (config && config.steps) {
    var step3 = config.steps.find(function(s) { return s.stepId === 3; });
    if (step3 && step3.items && step3.items.length > 0) {
      folders = step3.items
        .sort(function(a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function(it) {
          return {
            id: (it.key && String(it.key).trim()) || it.id || ('item-' + it.id),
            name: it.name || 'Пункт',
            icon: (it.icon || '').trim() || 'fa-folder'
          };
        });
    }
  }
  if (folders.length === 0) {
    // Строим папки из реальных каталогов в localStorage (catalog_1, catalog_26 и т.д.)
    var found = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('catalog_') === 0 && k !== 'catalogs_keys') {
        var catId = k.replace('catalog_', '');
        var info = (window.__catalogCategoryInfo || {})[catId] || { name: catId, icon: 'fa-folder' };
        found.push({ id: catId, name: info.name || catId, icon: info.icon || 'fa-folder' });
      }
    }
    folders = found.length > 0 ? found.sort(function(a, b) { return String(a.id).localeCompare(String(b.id)); }) : CATALOG_FOLDERS;
  }

  var columnsPerRow = 2;
  if (config && config.steps) {
    var step3 = config.steps.find(function(s) { return s.stepId === 3; });
    if (step3 && (step3.columnsPerRow === 1 || step3.columnsPerRow === 2)) columnsPerRow = step3.columnsPerRow;
  }

  const grid = document.createElement('div');
  grid.className = 'room-types-grid';
  grid.style.gridTemplateColumns = columnsPerRow === 1 ? '1fr' : 'repeat(2, 1fr)';

  folders.forEach(function(folder) {
    const item = document.createElement('div');
    item.className = 'room-type-item';
    item.dataset.catalogFolderId = folder.id;
    item.style.cursor = 'pointer';

    var iconVal = folder.icon || 'fa-folder';
    var isImg = /^https?:\/\//i.test(iconVal) || (iconVal.length > 0 && iconVal.charAt(0) === '/');
    var iconHtml = isImg
      ? '<img src="' + iconVal.replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display=\'none\';var s=this.nextElementSibling;s&&(s.style.display=\'block\');"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:24px;color:#999;"><i class="fas fa-image"></i></div>'
      : '<i class="fas ' + (iconVal || 'fa-folder') + '" style="font-size: 32px; color: #666;"></i>';
    item.innerHTML =
      '<div class="room-type-icon" style="background: #f5f5f5;">' + iconHtml + '</div>' +
      '<div class="room-type-name">' + (folder.name || folder.id || '').replace(/</g, '&lt;') + '</div>';

    item.addEventListener('click', function() {
      grid.querySelectorAll('.room-type-item').forEach(function(i) { i.classList.remove('selected'); });
      item.classList.add('selected');
      window.selectedCatalogFolder = { id: folder.id, name: folder.name || folder.id };
      var nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) nextBtn.disabled = false;
    });

    grid.appendChild(item);
  });

  container.appendChild(grid);

  var hint = document.createElement('div');
  hint.style.marginTop = '16px';
  hint.style.fontSize = '13px';
  hint.style.color = '#666';
  hint.textContent = 'Выберите раздел каталога и нажмите «Следующий».';
  container.appendChild(hint);
}

// Шаг 4: каталог выбранной категории (шкафы, кухни и т.д.)
function buildCatalogStep4(container, folderId, folderName) {
  container.innerHTML = '';
  window.step3CatalogOpen = true;

  // Grid подготавливаем заранее, чтобы использовать в обработчиках кнопок
  var grid = document.createElement('div');
  grid.className = 'room-types-grid cabinets-grid';
  grid.id = 'step4-cabinets-grid';
  grid.style.gridTemplateColumns = 'repeat(2, 1fr)';

  // Блок 1: кнопки - / + (текст и ? задаются в управлении комнатой, price-subline-block)
  var optionsBlock = document.createElement('div');
  optionsBlock.style.marginBottom = '20px';
  optionsBlock.style.fontSize = '14px';
  optionsBlock.style.color = '#333';
  optionsBlock.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;">' +
      '<button type="button" id="step4-options-minus" style="width:32px;height:32px;border-radius:16px;border:1px solid #d0d7e2;background:#fff;font-size:18px;cursor:pointer;">-</button>' +
      '<span id="step4-options-value" style="min-width:24px;text-align:center;font-weight:600;">1</span>' +
      '<button type="button" id="step4-options-plus" style="width:32px;height:32px;border-radius:16px;border:1px solid #d0d7e2;background:#fff;font-size:18px;cursor:pointer;">+</button>' +
    '</div>';
  container.appendChild(optionsBlock);

  (function () {
    var count = 1;
    var minusBtn = document.getElementById('step4-options-minus');
    var plusBtn = document.getElementById('step4-options-plus');
    var valueEl = document.getElementById('step4-options-value');

    function renderCount() {
      if (valueEl) valueEl.textContent = String(count);
      window.step4VariantCount = count;
    }
    if (minusBtn) minusBtn.onclick = function () { if (count > 1) { count -= 1; renderCount(); } };
    if (plusBtn) plusBtn.onclick = function () { count += 1; renderCount(); };
    renderCount();
  })();

  // Блок 2: подсказка "Нажимайте и размещайте..." из конфига (price_subline_hint_text, price_subline_help_*)
  var step4PriceSubline = (function () {
    var cfg = getRoomStepsConfig();
    if (!cfg || !cfg.steps) return null;
    var s4 = cfg.steps.find(function (s) { return s.stepId === 4; });
    var ps = s4 && s4.price_subline;
    return (ps && typeof ps === 'object') ? ps : null;
  })();
  var hintText = (step4PriceSubline && typeof step4PriceSubline.price_subline_hint_text === 'string')
    ? step4PriceSubline.price_subline_hint_text.trim() : '';
  if (hintText) {
    var linkText = (step4PriceSubline && step4PriceSubline.price_subline_help_link_text) || 'Как это работает?';
    var modalTitle = (step4PriceSubline && step4PriceSubline.price_subline_help_title) || '';
    var modalContent = (step4PriceSubline && step4PriceSubline.price_subline_modal_text) || (step4PriceSubline && step4PriceSubline.price_subline_help_text) || '';
    var hint = document.createElement('div');
    hint.className = 'sidebar-info-line';
    hint.style.marginBottom = '16px';
    hint.innerHTML = hintText + ' <span id="step4-modules-help-link" class="price-subline-help-link">' + linkText + '</span>';
    container.appendChild(hint);

    var modulesHelpLink = document.getElementById('step4-modules-help-link');
    if (modulesHelpLink && typeof window.showCenteredHelpModal === 'function') {
      modulesHelpLink.onclick = function () {
        window.showCenteredHelpModal(modalTitle, modalContent);
      };
    }
  }

  // Блок 3: овальные кнопки (настраиваются из шага 4 в админке)
  var pillsWrapper = document.createElement('div');
  pillsWrapper.className = 'step4-pill-buttons';
  container.appendChild(pillsWrapper);

  var config = getRoomStepsConfig();
  var pillItems = [];
  if (config && config.steps) {
    var step4Cfg = config.steps.find(function (s) { return s.stepId === 4; });
    if (step4Cfg && Array.isArray(step4Cfg.items) && step4Cfg.items.length > 0) {
      pillItems = step4Cfg.items.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    }
  }

  var initialCategoryId = null;
  var columnsPerRow = 2;
  if (config && config.steps) {
    var step4CfgForCols = config.steps.find(function (s) { return s.stepId === 4; });
    if (step4CfgForCols && (step4CfgForCols.columnsPerRow === 1 || step4CfgForCols.columnsPerRow === 2)) {
      columnsPerRow = step4CfgForCols.columnsPerRow;
    }
  }
  pillsWrapper.style.gridTemplateColumns = columnsPerRow === 1 ? '1fr' : 'repeat(2, 1fr)';
  grid.style.gridTemplateColumns = columnsPerRow === 1 ? '1fr' : 'repeat(2, 1fr)';

  var lastPillEl = null;
  if (pillItems.length > 0) {
    pillItems.forEach(function (btn, idx) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'step4-pill-button';
      el.innerHTML = '<span>' + (btn.name || ('Кнопка ' + (idx + 1))).replace(/</g, '&lt;') + '</span>';
      var catId = btn.categoryId != null ? btn.categoryId : null;
      if (idx === 0) {
        initialCategoryId = catId;
        el.classList.add('selected');
      }
      el.dataset.categoryId = catId != null ? String(catId) : '';
      el.addEventListener('click', function () {
        pillsWrapper.querySelectorAll('.step4-pill-button').forEach(function (b) { b.classList.remove('selected'); });
        el.classList.add('selected');
        var cid = el.dataset.categoryId ? parseInt(el.dataset.categoryId, 10) : null;
        loadSavedModels(folderId, grid, cid);
      });
      pillsWrapper.appendChild(el);
      lastPillEl = el;
    });
  }

  // Если выбран режим 2 в строке и кнопок нечётное количество —
  // последнюю кнопку растягиваем на всю ширину панели.
  if (columnsPerRow === 2 && pillItems.length % 2 === 1 && lastPillEl) {
    lastPillEl.style.gridColumn = '1 / -1';
  }

  container.appendChild(grid);

  // Каталог = folderId (из шага 3), фильтр = categoryId из овальной кнопки
  loadSavedModels(folderId, grid, initialCategoryId);
}

// Создать третий шаг - выбор мебели (теперь вызывает выбор папки каталога)
function buildFurnitureStep(container) {
  buildCatalogFoldersStep(container);
}

// Создать второй шаг - выбор расположения комнаты (из конфига шагов или шаблон)
function buildRoomLayoutStep(container) {
  let layouts = [
    { name: 'Верхняя стена', key: 'top-wall', shape: 'top-wall' },
    { name: 'Верхняя и правая', key: 'top-right', shape: 'top-right' },
    { name: 'Верхняя + перегородка', key: 'top-partition', shape: 'top-partition' },
    { name: 'Левая и нижняя', key: 'left-bottom', shape: 'left-bottom' },
    { name: 'Верхняя, левая + перегородка', key: 'top-left-partition', shape: 'top-left-partition' },
    { name: 'Верхняя, правая, нижняя + перегородка', key: 'top-right-bottom-partition', shape: 'top-right-bottom-partition' }
  ];
  const config = getRoomStepsConfig();
  if (config && config.steps) {
    const step2 = config.steps.find(function(s) { return s.stepId === 2; });
    if (step2 && step2.items && step2.items.length > 0) {
      layouts = step2.items
        .sort(function(a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function(it) {
          var icon = (it.icon || '').trim();
          var shape = icon.indexOf('shape:') === 0 ? icon.slice(6) : (it.key || '');
          return { name: it.name || 'Пункт', key: it.key || ('item-' + it.id), shape: shape || 'top-wall', icon: icon };
        });
    }
  }

  const grid = document.createElement('div');
  grid.className = 'room-types-grid';

  var columnsPerRow = 2;
  if (config && config.steps) {
    var step2 = config.steps.find(function(s) { return s.stepId === 2; });
    if (step2 && (step2.columnsPerRow === 1 || step2.columnsPerRow === 2)) columnsPerRow = step2.columnsPerRow;
  }
  grid.style.gridTemplateColumns = columnsPerRow === 1 ? '1fr' : 'repeat(2, 1fr)';

  layouts.forEach(layout => {
    const item = document.createElement('div');
    item.className = 'room-type-item';
    item.dataset.layoutType = layout.key;
    var iconVal = layout.icon || '';
    var isImg = /^https?:\/\//i.test(iconVal) || (iconVal.length > 0 && iconVal.charAt(0) === '/');
    var iconHtml = isImg
      ? '<img src="' + iconVal.replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display=\'none\';var s=this.nextElementSibling;s&&(s.style.display=\'block\');"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:24px;color:#999;"><i class="fas fa-image"></i></div>'
      : createLayoutIcon(layout.shape);
    item.innerHTML = '<div class="room-type-icon">' + iconHtml + '</div><div class="room-type-name">' + (layout.name || '').replace(/</g, '&lt;') + '</div>';
    
    // Обработчик для выделения иконки (визуальное выделение)
    item.addEventListener('click', () => {
      // Убираем выделение с других элементов
      grid.querySelectorAll('.room-type-item').forEach(i => i.classList.remove('selected'));
      // Выделяем текущий элемент
      item.classList.add('selected');
      
      // Сохраняем выбранное расположение
      window.selectedRoomLayout = layout;
      
      // Активируем кнопку "Следующий"
      const nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) {
        nextBtn.disabled = false;
      }
      
      console.log('Выбрано расположение:', layout.name, layout.key);
      
      // НЕ активируем режим размещения здесь - это делается при mousedown
    });
    
    // Обработчик для активации режима размещения при зажатии ЛКМ и перетаскивании
    item.addEventListener('mousedown', (event) => {
      if (event.button === 0) { // Левая кнопка мыши
        // Если выбрана "Верхняя стена", активируем режим размещения секции
        if (layout.key === 'top-wall') {
          event.preventDefault(); // Предотвращаем выделение текста
          event.stopPropagation(); // Останавливаем всплытие события
          
          console.log('🖱️ Зажата ЛКМ на иконке "Верхняя стена"');
          startPlacingSection();
          
          // Добавляем обработчики для отслеживания перетаскивания
          const handleMouseMove = (moveEvent) => {
            // Обновляем позицию призрака при движении мыши
            if (isPlacingSection) {
              // Проверяем, что мышь находится над canvas (3D сценой)
              const canvasRect = renderer.domElement.getBoundingClientRect();
              const mouseX = moveEvent.clientX;
              const mouseY = moveEvent.clientY;
              
              // Если мышь над canvas, обновляем позицию призрака
              if (mouseX >= canvasRect.left && mouseX <= canvasRect.right &&
                  mouseY >= canvasRect.top && mouseY <= canvasRect.bottom) {
                updateSectionGhostPosition(moveEvent);
              } else {
                // Если мышь вне canvas, скрываем призрак и маркеры
                if (sectionGhost) {
                  sectionGhost.visible = false;
                  removeCabinetMarkers('ghost');
                }
              }
            }
          };
          
          const handleMouseUp = (upEvent) => {
            // Удаляем обработчики
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Проверяем, что мышь была отпущена над canvas (3D сценой)
            const canvasRect = renderer.domElement.getBoundingClientRect();
            const mouseX = upEvent.clientX;
            const mouseY = upEvent.clientY;
            
            if (mouseX >= canvasRect.left && mouseX <= canvasRect.right &&
                mouseY >= canvasRect.top && mouseY <= canvasRect.bottom) {
              
              // В резервной копии всегда делается финальный raycast с фильтрацией видимых плоскостей
              // Это гарантирует правильное определение стены под курсором
              const finalMouse = new THREE.Vector2();
              finalMouse.x = ((mouseX - canvasRect.left) / canvasRect.width) * 2 - 1;
              finalMouse.y = -((mouseY - canvasRect.top) / canvasRect.height) * 2 + 1;
              
              raycaster.setFromCamera(finalMouse, camera);
              
              // Фильтруем видимые плоскости (как в onMouseClick)
              if (!room || !room.wallPlanes) return;
              
              const visiblePlanes = room.wallPlanes.filter(p => {
                if (p.visible === false) return false;
                const wallName = p.userData.wallName;
                if (room.walls && room.walls[wallName]) {
                  return room.walls[wallName].visible !== false;
                }
                return true;
              });
              
              const finalIntersects = raycaster.intersectObjects(visiblePlanes, false);
              const finalIntersect = getClosestFacingWallIntersection(raycaster, finalIntersects);
              
              if (finalIntersect) {
                const finalWallName = finalIntersect.object.userData?.wallName;
                
                if (finalWallName && room.walls && room.walls[finalWallName] && pendingSectionData) {
                    // Вычисляем позицию секции для этой стены
                    const roomWorldPos = new THREE.Vector3();
                    room.group.getWorldPosition(roomWorldPos);
                    
                    const gap = 2;
                    const extent = {
                      x: pendingSectionData.width,
                      y: pendingSectionData.height,
                      z: pendingSectionData.depth
                    };
                    
                    let finalX, finalY, finalZ;
                    
                    switch (finalWallName) {
                      case 'front':
                        finalX = 0;
                        finalY = 0;
                        finalZ = gap;
                        break;
                      case 'back':
                        finalX = 0;
                        finalY = 0;
                        finalZ = room.depth - extent.z - gap;
                        break;
                      case 'left':
                        finalX = gap;
                        finalY = 0;
                        finalZ = 0;
                        break;
                      case 'right':
                        finalX = room.width - extent.x - gap;
                        finalY = 0;
                        finalZ = 0;
                        break;
                      default:
                        return;
                    }
                    
                    const finalWorldPos = new THREE.Vector3(
                      roomWorldPos.x + finalX,
                      roomWorldPos.y + finalY,
                      roomWorldPos.z + finalZ
                    );
                    
                  // Создаем секцию на стене
                  createSectionAtPosition(finalWorldPos, finalWallName);
                  
                  console.log('✅ Секция размещена на стене:', finalWallName, {
                    position: finalWorldPos,
                    wall: finalWallName
                  });
                }
              }
            }
            
            // Удаляем призрак
            removeSectionGhost();
            
            // Отключаем режим размещения
            isPlacingSection = false;
            pendingSectionData = null;
            sectionGhostWall = null;
            sectionGhostPosition = null;
            
            if (room && room.resetWallHighlight) {
              room.resetWallHighlight();
            }
          };
          
          // Добавляем обработчики на document, чтобы отслеживать движение мыши даже за пределами иконки
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }
      }
    });
    
    grid.appendChild(item);
  });
  
  container.appendChild(grid);
}

// Создать секцию на верхней стене (от угла до угла, от пола до потолка)
// Начать размещение секции (активировать режим размещения)
function startPlacingSection() {
  if (!room) {
    console.error('❌ Комната не создана');
    return;
  }
  
  // Размеры секции:
  // - Ширина: от угла до угла = room.width (вся ширина комнаты)
  // - Высота: от пола до потолка = room.height (вся высота комнаты)
  // - Глубина: 600 мм
  const sectionWidth = room.width;
  const sectionHeight = room.height;
  const sectionDepth = 600; // 600 мм
  
  console.log('🏗️ Начато размещение секции:', {
    width: sectionWidth,
    height: sectionHeight,
    depth: sectionDepth
  });
  
  // Сохраняем данные секции
  pendingSectionData = {
    width: sectionWidth,
    height: sectionHeight,
    depth: sectionDepth
  };
  
  // Активируем режим размещения
  isPlacingSection = true;
  
  // Создаем призрак секции
  createSectionGhost(sectionWidth, sectionHeight, sectionDepth);
  
  // Сразу обновляем позицию призрака (симулируем событие мыши)
  // Это нужно, чтобы призрак появился сразу при активации режима
  const fakeEvent = {
    clientX: renderer.domElement.clientWidth / 2,
    clientY: renderer.domElement.clientHeight / 2
  };
  updateSectionGhostPosition(fakeEvent);
  
  console.log('✅ Режим размещения секции активирован');
  console.log('👻 Призрак секции создан, режим размещения активен');
}

// Создать призрак секции
function createSectionGhost(width, height, depth) {
  if (sectionGhost) {
    removeSectionGhost();
  }
  
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'SectionGhost';
  ghostGroup.visible = true; // Делаем видимым сразу для отладки
  ghostGroup.userData.isGhost = true;
  
  // Создаем геометрию
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(geometry);
  // Делаем материал более видимым для отладки
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff0000, // Красный цвет
    linewidth: 5, // Увеличиваем толщину линий
    transparent: false, // Убираем прозрачность для лучшей видимости
    opacity: 1.0
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  wireframe.position.set(width / 2, height / 2, depth / 2);
  wireframe.visible = true;
  ghostGroup.add(wireframe);
  
  // Полупрозрачная заливка - делаем более прозрачной
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const fillMesh = new THREE.Mesh(geometry, fillMaterial);
  fillMesh.position.copy(wireframe.position);
  fillMesh.visible = true;
  ghostGroup.add(fillMesh);
  
  sectionGhost = ghostGroup;
  scene.add(sectionGhost);
  
  // Принудительно делаем все дочерние элементы видимыми
  sectionGhost.traverse(child => {
    if (child.visible !== undefined) {
      child.visible = true;
    }
  });
  
  console.log('👻 Призрак секции создан:', {
    width,
    height,
    depth,
    visible: sectionGhost.visible,
    position: sectionGhost.position,
    childrenCount: sectionGhost.children.length,
    inScene: scene.children.includes(sectionGhost)
  });
  
  // Выводим информацию о дочерних элементах
  sectionGhost.children.forEach((child, index) => {
    console.log(`  Child ${index}:`, {
      type: child.type,
      name: child.name,
      visible: child.visible,
      position: child.position
    });
  });
}

// Удалить призрак секции
function removeSectionGhost() {
  if (sectionGhost) {
    removeCabinetMarkers('ghost');
    sectionGhostDivision = null;
    scene.remove(sectionGhost);
    sectionGhost.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    sectionGhost = null;
  }
}

// Обновить позицию призрака секции при движении мыши
function updateSectionGhostPosition(event) {
  if (!sectionGhost || !room || !pendingSectionData) {
    console.warn('⚠️ updateSectionGhostPosition: отсутствуют необходимые данные', {
      hasSectionGhost: !!sectionGhost,
      hasRoom: !!room,
      hasPendingData: !!pendingSectionData,
      isPlacingSection: isPlacingSection
    });
    return;
  }
  
  // Обновляем позицию мыши
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  
  // Raycast для определения стены
  raycaster.setFromCamera(mouse, camera);
  
  // В резервной копии используется фильтрация видимых плоскостей
  // Фильтруем видимые плоскости (как в onMouseClick)
  if (!room || !room.wallPlanes) return;
  
  const visiblePlanes = room.wallPlanes.filter(p => {
    if (p.visible === false) return false;
    const wallName = p.userData.wallName;
    if (room.walls && room.walls[wallName]) {
      return room.walls[wallName].visible !== false;
    }
    return true;
  });
  
  const intersects = raycaster.intersectObjects(visiblePlanes, false);
  
  console.log('🔍 Raycast для призрака секции:', {
    mousePos: { x: mouse.x, y: mouse.y },
    intersectsCount: intersects.length,
    wallPlanesCount: wallPlanes ? wallPlanes.length : 0,
    wallPlanes: wallPlanes ? wallPlanes.map(p => ({
      name: p.name || p.userData?.wallName,
      visible: p.visible,
      wallName: p.userData?.wallName
    })) : []
  });
  
  const intersect = getClosestFacingWallIntersection(raycaster, intersects);
  if (intersect) {
    const wallName = intersect.object.userData.wallName;
    
    console.log('🔍 Intersect details:', {
      object: intersect.object.name || intersect.object.type,
      wallName: wallName,
      point: intersect.point,
      hasUserData: !!intersect.object.userData,
      userData: intersect.object.userData
    });
    
    if (wallName && room.walls && room.walls[wallName]) {
        const wall = room.walls[wallName];
        
        console.log('✅ Стена найдена:', wallName, {
          wallVisible: wall.visible,
          wallExists: !!wall
        });
        
        // ВАЖНО: Не проверяем видимость стены - показываем призрак всегда, когда стена найдена через raycast
        // Это позволяет размещать секции даже на невидимых стенах
        console.log('✅ Стена найдена через raycast:', wallName, {
          wallVisible: wall ? wall.visible : 'N/A',
          wallExists: !!wall,
          planeVisible: intersect.object.visible,
          planeInScene: scene.children.some(child => {
            if (child === room.group) {
              return room.group.children.includes(intersect.object);
            }
            return false;
          })
        });
        
        // Подсвечиваем стену
        if (room.highlightWall) {
          room.highlightWall(wallName);
        }
        
        // Вычисляем позицию секции у стены
        const roomWorldPos = new THREE.Vector3();
        room.group.getWorldPosition(roomWorldPos);
        const localPos = intersect.point.clone().sub(roomWorldPos);
        
        const gap = 2; // 2mm gap from wall
        const extent = {
          x: pendingSectionData.width,
          y: pendingSectionData.height,
          z: pendingSectionData.depth
        };
        
        let finalX, finalY, finalZ;
        
        switch (wallName) {
          case 'front':
            // Front wall: секция от угла до угла, pivot в back-left-bottom
            // Для front стены: z должен быть gap (2mm от стены)
            finalX = 0; // Левый угол (pivot в back-left-bottom)
            finalY = 0; // Пол (pivot в back-left-bottom)
            finalZ = gap; // 2mm от передней стены
            break;
          case 'back':
            // Back wall: секция от угла до угла, pivot в back-left-bottom
            // Для back стены: z должен быть room.depth - depth - gap
            finalX = 0; // Левый угол (pivot в back-left-bottom)
            finalY = 0; // Пол (pivot в back-left-bottom)
            finalZ = room.depth - extent.z - gap; // У задней стены, отступая на глубину секции
            break;
          case 'left':
            // Left wall: секция от угла до угла по высоте и глубине
            finalX = gap; // 2mm от левой стены
            finalY = 0; // Пол (pivot в back-left-bottom)
            finalZ = 0; // Передний угол (pivot в back-left-bottom)
            break;
          case 'right':
            // Right wall: секция от угла до угла по высоте и глубине
            finalX = room.width - extent.x - gap; // У правой стены, отступая на ширину секции
            finalY = 0; // Пол (pivot в back-left-bottom)
            finalZ = 0; // Передний угол (pivot в back-left-bottom)
            break;
          default:
            sectionGhost.visible = false;
            removeCabinetMarkers('ghost');
            return;
        }
        
        // Мировые координаты
        const worldPos = new THREE.Vector3(
          roomWorldPos.x + finalX,
          roomWorldPos.y + finalY,
          roomWorldPos.z + finalZ
        );
        
        // Обновляем позицию призрака
        sectionGhost.position.copy(worldPos);
        sectionGhost.visible = true;
        sectionGhostWall = wallName;
        sectionGhostPosition = worldPos.clone();
        
        // Принудительно обновляем матрицы
        sectionGhost.updateMatrixWorld(true);
        
        // Убеждаемся, что все дочерние элементы видимы
        sectionGhost.traverse(child => {
          if (child.visible !== undefined) {
            child.visible = true;
          }
        });
        
        // Маркеры расстановки шкафов: появляются при призраке
        const { width, height, depth } = pendingSectionData;
        addCabinetMarkers('ghost', sectionGhost, width, height, depth, wallName);
        
        console.log('👻 Призрак секции обновлен:', {
          wall: wallName,
          position: worldPos,
          visible: sectionGhost.visible,
          childrenCount: sectionGhost.children.length,
          inScene: scene.children.includes(sectionGhost),
          finalX: finalX,
          finalY: finalY,
          finalZ: finalZ,
          roomWidth: room.width,
          roomHeight: room.height,
          roomDepth: room.depth,
          sectionWidth: pendingSectionData.width,
          sectionHeight: pendingSectionData.height,
          sectionDepth: pendingSectionData.depth,
          roomWorldPos: roomWorldPos
        });
    } else {
      // Если wallName не найден или стена не существует
      sectionGhost.visible = false;
      sectionGhostWall = null;
      sectionGhostPosition = null;
      removeCabinetMarkers('ghost');
      if (room.resetWallHighlight) {
        room.resetWallHighlight();
      }
    }
  } else {
    // Если нет пересечений
    sectionGhost.visible = false;
    sectionGhostWall = null;
    sectionGhostPosition = null;
    removeCabinetMarkers('ghost');
    if (room.resetWallHighlight) {
      room.resetWallHighlight();
    }
  }
}

// Создать секцию в указанной позиции на стене
function createSectionAtPosition(position, wallName) {
  if (!pendingSectionData) {
    console.error('❌ Нет данных секции для размещения');
    return;
  }
  
  // Убираем маркеры призрака — на их месте появятся маркеры секции (не исчезают)
  removeCabinetMarkers('ghost');
  
  const { width, height, depth } = pendingSectionData;
  
  // Для секции от угла до угла нужно создать её напрямую, а не через createCustomSection
  // так как createCustomSection ограничивает размеры
  const sectionId = 'wall_section_' + Date.now();
  const sectionName = `Секция на стене ${wallName}`;
  
  const sectionGroup = new THREE.Group();
  sectionGroup.name = sectionName;
  sectionGroup.userData.isCustomSection = true;
  sectionGroup.userData.sectionId = sectionId;
  
  // Создаем геометрию
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff0000, // Красный цвет
    linewidth: 3,
    transparent: true,
    opacity: 0.9
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  wireframe.position.set(width / 2, height / 2, depth / 2);
  sectionGroup.add(wireframe);
  
  // Полупрозрачная заливка
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const fillMesh = new THREE.Mesh(geometry, fillMaterial);
  fillMesh.position.copy(wireframe.position);
  sectionGroup.add(fillMesh);
  
  // Позиционируем секцию: используем переданную позицию напрямую
  // position уже правильно вычислен в updateSectionGhostPosition и соответствует выбранной стене
  sectionGroup.position.copy(position);
  
  console.log('✅ Секция создана на стене:', {
    wallName: wallName,
    position: position,
    sectionPosition: sectionGroup.position,
    width: width,
    height: height,
    depth: depth
  });
  
  // Сохраняем данные секции
  const sectionData = {
    id: sectionId,
    name: sectionName,
    size: { x: width, y: height, z: depth },
    position: {
      x: sectionGroup.position.x,
      y: sectionGroup.position.y,
      z: sectionGroup.position.z
    },
    wallName: wallName, // Сохраняем информацию о стене
    group: sectionGroup
  };
  
  customSections.push(sectionData);
  scene.add(sectionGroup);
  
  // Добавляем метки размеров к секции
  addSectionDimensionLabels(sectionId, sectionGroup, width, height, depth, wallName);
  
  // Добавляем маркеры расстановки шкафов
  addCabinetMarkers(sectionId, sectionGroup, width, height, depth, wallName);
  
  console.log('✅ Секция создана на стене:', wallName, sectionData);
}

// Добавить метки размеров к секции
function addSectionDimensionLabels(sectionId, sectionGroup, width, height, depth, wallName) {
  if (!window.sceneIconsContainer) return;
  
  // Инициализируем хранилище, если его нет
  if (!sectionDimensionLabels) {
    sectionDimensionLabels = {};
  }
  
  // Удаляем старые метки, если они есть
  if (sectionDimensionLabels[sectionId]) {
    sectionDimensionLabels[sectionId].forEach(label => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
  }
  sectionDimensionLabels[sectionId] = [];
  
  // Получаем позицию секции в мировых координатах
  const sectionPos = sectionGroup.position.clone();
  
  // Вычисляем позиции для меток размеров в зависимости от стены
  // Метки размещаем на гранях секции
  let labels = [];
  
  switch (wallName) {
    case 'back':
      // Для задней стены: ширина сверху, высота слева, глубина справа
      labels.push({
        text: `${width / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height + 100, sectionPos.z + depth / 2),
        className: 'section-dimension-label section-width'
      });
      labels.push({
        text: `${height / 10} см`,
        position: new THREE.Vector3(sectionPos.x - 100, sectionPos.y + height / 2, sectionPos.z + depth / 2),
        className: 'section-dimension-label section-height',
        extraStyle: { transform: 'rotate(-90deg)' }
      });
      labels.push({
        text: `${depth / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height / 2, sectionPos.z - 100),
        className: 'section-dimension-label section-depth'
      });
      break;
    case 'front':
      // Для передней стены: ширина сверху, высота справа, глубина слева
      labels.push({
        text: `${width / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height + 100, sectionPos.z + depth / 2),
        className: 'section-dimension-label section-width'
      });
      labels.push({
        text: `${height / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width + 100, sectionPos.y + height / 2, sectionPos.z + depth / 2),
        className: 'section-dimension-label section-height',
        extraStyle: { transform: 'rotate(-90deg)' }
      });
      labels.push({
        text: `${depth / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height / 2, sectionPos.z + depth + 100),
        className: 'section-dimension-label section-depth'
      });
      break;
    case 'left':
      // Для левой стены: глубина сверху, высота справа, ширина спереди
      labels.push({
        text: `${depth / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height + 100, sectionPos.z + depth / 2),
        className: 'section-dimension-label section-depth'
      });
      labels.push({
        text: `${height / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width + 100, sectionPos.y + height / 2, sectionPos.z + depth / 2),
        className: 'section-dimension-label section-height',
        extraStyle: { transform: 'rotate(-90deg)' }
      });
      labels.push({
        text: `${width / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height / 2, sectionPos.z + depth + 100),
        className: 'section-dimension-label section-width'
      });
      break;
    case 'right':
      // Для правой стены: глубина сверху, высота слева, ширина спереди
      labels.push({
        text: `${depth / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height + 100, sectionPos.z + depth / 2),
        className: 'section-dimension-label section-depth'
      });
      labels.push({
        text: `${height / 10} см`,
        position: new THREE.Vector3(sectionPos.x - 100, sectionPos.y + height / 2, sectionPos.z + depth / 2),
        className: 'section-dimension-label section-height',
        extraStyle: { transform: 'rotate(-90deg)' }
      });
      labels.push({
        text: `${width / 10} см`,
        position: new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height / 2, sectionPos.z + depth + 100),
        className: 'section-dimension-label section-width'
      });
      break;
  }
  
  // Создаем метки
  labels.forEach(labelData => {
    const label = createDimensionLabel(
      labelData.text,
      labelData.position,
      labelData.className,
      labelData.extraStyle || {}
    );
    if (label) {
      sectionDimensionLabels[sectionId].push(label);
      // Сохраняем ссылку на секцию для обновления позиций
      label.userData.sectionId = sectionId;
      label.userData.sectionGroup = sectionGroup;
    }
  });
}

// Показать модальное окно для редактирования секции
function showEditSectionModal(sectionData) {
  if (!sectionData || !sectionData.group) {
    console.error('❌ Некорректные данные секции');
    return;
  }
  
  const modal = document.getElementById('edit-section-modal');
  const content = document.getElementById('edit-section-content');
  
  if (!modal || !content) {
    console.error('❌ Модальное окно не найдено');
    return;
  }
  
  // Сохраняем ссылку на редактируемую секцию
  window.editingSection = sectionData;
  
  const wallName = sectionData.wallName || 'back';
  const currentSize = sectionData.size;
  const roomWorldPos = new THREE.Vector3();
  room.group.getWorldPosition(roomWorldPos);
  const sectionPos = sectionData.group.position.clone();
  const localPos = sectionPos.clone().sub(roomWorldPos);
  
  // Вычисляем текущие отступы на основе позиции и размера секции
  let currentOffsets = {};
  
  // Вычисляем отступы на основе позиции и размера секции
  switch (wallName) {
    case 'front':
      // Для передней стены: секция прижата к передней стене
      // Отступ слева = localPos.x (от левой стены)
      // Отступ справа = room.width - (localPos.x + currentSize.x)
      // Отступ снизу = localPos.y (от пола)
      // Отступ сверху = room.height - (localPos.y + currentSize.y)
      currentOffsets.left = localPos.x / 10; // в см
      currentOffsets.right = (room.width - localPos.x - currentSize.x) / 10; // в см
      currentOffsets.bottom = localPos.y / 10; // в см
      currentOffsets.top = (room.height - localPos.y - currentSize.y) / 10; // в см
      break;
    case 'back':
      // Для задней стены: секция прижата к задней стене
      // Отступ слева = localPos.x
      // Отступ справа = room.width - (localPos.x + currentSize.x)
      // Отступ снизу = localPos.y
      // Отступ сверху = room.height - (localPos.y + currentSize.y)
      currentOffsets.left = localPos.x / 10; // в см
      currentOffsets.right = (room.width - localPos.x - currentSize.x) / 10; // в см
      currentOffsets.bottom = localPos.y / 10; // в см
      currentOffsets.top = (room.height - localPos.y - currentSize.y) / 10; // в см
      break;
    case 'left':
      // Для левой стены: секция прижата к левой стене
      // Отступ спереди = localPos.z (от передней стены)
      // Отступ сзади = room.depth - (localPos.z + currentSize.z)
      // Отступ снизу = localPos.y
      // Отступ сверху = room.height - (localPos.y + currentSize.y)
      currentOffsets.front = localPos.z / 10; // в см
      currentOffsets.back = (room.depth - localPos.z - currentSize.z) / 10; // в см
      currentOffsets.bottom = localPos.y / 10; // в см
      currentOffsets.top = (room.height - localPos.y - currentSize.y) / 10; // в см
      break;
    case 'right':
      // Для правой стены: секция прижата к правой стене
      // Отступ спереди = localPos.z
      // Отступ сзади = room.depth - (localPos.z + currentSize.z)
      // Отступ снизу = localPos.y
      // Отступ сверху = room.height - (localPos.y + currentSize.y)
      currentOffsets.front = localPos.z / 10; // в см
      currentOffsets.back = (room.depth - localPos.z - currentSize.z) / 10; // в см
      currentOffsets.bottom = localPos.y / 10; // в см
      currentOffsets.top = (room.height - localPos.y - currentSize.y) / 10; // в см
      break;
  }
  
  // Генерируем HTML с полями для всех отступов
  let html = '';
  
  if (wallName === 'front' || wallName === 'back') {
    // Для передней/задней стены: слева, справа, сверху, снизу
    html = `
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ слева (см):</label>
        <input type="number" id="section-offset-left" value="${currentOffsets.left}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ справа (см):</label>
        <input type="number" id="section-offset-right" value="${currentOffsets.right}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ снизу (см):</label>
        <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
        <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Глубина (см):</label>
        <input type="number" id="section-depth" value="${currentSize.z / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
    `;
  } else if (wallName === 'left' || wallName === 'right') {
    // Для боковых стен: спереди, сзади, сверху, снизу
    html = `
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ спереди (см):</label>
        <input type="number" id="section-offset-front" value="${currentOffsets.front}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сзади (см):</label>
        <input type="number" id="section-offset-back" value="${currentOffsets.back}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ снизу (см):</label>
        <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
        <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Глубина (см):</label>
        <input type="number" id="section-depth" value="${currentSize.z / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
      </div>
    `;
  }
  
  content.innerHTML = html;
  modal.style.display = 'block';
  
  // Добавляем визуальные метки отступов на секцию в 3D сцене
  addSectionOffsetLabels(sectionData, currentOffsets, wallName);
  
  // Добавляем обработчики для обновления меток при изменении значений в реальном времени
  setupOffsetLabelsUpdate(sectionData, wallName);
  
  // Убеждаемся, что маркеры расстановки шкафов отображаются
  if (sectionData.id) {
    updateCabinetMarkersForSection(sectionData.id);
  }
}

// Создать текстуру для спрайта с текстом
function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  
  // Очищаем canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Рисуем фон
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Рисуем текст
  context.fillStyle = '#333';
  context.font = 'bold 48px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1
  });
  
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(500, 250, 1); // Увеличиваем размер спрайта в мм для лучшей видимости
  
  return sprite;
}

// Добавить визуальные метки отступов на секцию (линии и метки на стене)
function addSectionOffsetLabels(sectionData, offsets, wallName) {
  if (!sectionData || !sectionData.group || !scene) {
    console.warn('⚠️ addSectionOffsetLabels: нет данных секции или сцены');
    return;
  }
  
  console.log('🎨 Добавление меток отступов:', { offsets, wallName, sectionData });
  
  // Удаляем старые метки отступов
  removeSectionOffsetLabels();
  
  const roomWorldPos = new THREE.Vector3();
  room.group.getWorldPosition(roomWorldPos);
  const sectionPos = sectionData.group.position.clone();
  const localPos = sectionPos.clone().sub(roomWorldPos);
  const currentSize = sectionData.size;
  const gap = 2; // 2mm gap from wall
  
  console.log('📍 Позиции:', {
    roomWorldPos: roomWorldPos,
    sectionPos: sectionPos,
    localPos: localPos,
    currentSize: currentSize,
    roomSize: { width: room.width, height: room.height, depth: room.depth }
  });
  
  if (wallName === 'front' || wallName === 'back') {
    // Для front стены: z = roomWorldPos.z (внутренняя поверхность стены, к которой приставлена секция)
    // Для back стены: z = roomWorldPos.z + room.depth (внутренняя поверхность стены, к которой приставлена секция)
    // Секция находится на gap (2mm) от стены, но линии должны быть на самой стене
    const wallZ = wallName === 'front' ? roomWorldPos.z : roomWorldPos.z + room.depth;
    console.log('📍 Позиция стены (Z):', wallZ, 'для стены:', wallName, 'roomWorldPos.z:', roomWorldPos.z);
    
    // Отступ слева - горизонтальная линия по середине высоты от угла стены до секции
    if (offsets.left > 0) {
      const centerY = sectionPos.y + currentSize.y / 2; // По середине высоты секции
      const lineStart = new THREE.Vector3(
        roomWorldPos.x, // От левого угла стены
        centerY, // По середине высоты
        wallZ
      );
      const lineEnd = new THREE.Vector3(
        sectionPos.x, // До левого края секции
        centerY, // Та же Y позиция
        wallZ
      );
      
      console.log('📏 Создание линии отступа слева:', { lineStart, lineEnd, offset: offsets.left });
      
      // Создаем горизонтальную линию
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 3 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sectionOffsetLines.push(line);
      
      // Создаем метку как HTML элемент (2D текст, всегда видимый)
      const labelPos = new THREE.Vector3(
        (lineStart.x + lineEnd.x) / 2, // По центру линии
        centerY + 100, // Выше линии на 100мм
        wallZ // На стене
      );
      const label = createDimensionLabel(
        `${offsets.left.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-left'
      );
      if (label) {
        sectionOffsetLabels.push(label);
      }
      
      console.log('✅ Линия и метка отступа слева созданы');
    }
    
    // Отступ справа - горизонтальная линия по середине высоты от угла стены до секции
    if (offsets.right > 0) {
      const centerY = sectionPos.y + currentSize.y / 2; // По середине высоты секции
      const lineStart = new THREE.Vector3(
        roomWorldPos.x + room.width, // От правого угла стены
        centerY, // По середине высоты
        wallZ
      );
      const lineEnd = new THREE.Vector3(
        sectionPos.x + currentSize.x, // До правого края секции
        centerY, // Та же Y позиция
        wallZ
      );
      
      // Создаем горизонтальную линию
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 3 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sectionOffsetLines.push(line);
      
      // Создаем метку как HTML элемент (2D текст, всегда видимый)
      const labelPos = new THREE.Vector3(
        (lineStart.x + lineEnd.x) / 2, // По центру линии
        centerY + 100, // Выше линии на 100мм
        wallZ // На стене
      );
      const label = createDimensionLabel(
        `${offsets.right.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-right'
      );
      if (label) {
        sectionOffsetLabels.push(label);
      }
    }
    
    // Отступ снизу - горизонтальная линия от угла стены до секции
    if (offsets.bottom > 0) {
      const lineStart = new THREE.Vector3(
        roomWorldPos.x, // От левого угла стены
        roomWorldPos.y, // От нижнего угла стены (пол)
        wallZ
      );
      const lineEnd = new THREE.Vector3(
        roomWorldPos.x + room.width, // До правого угла стены
        roomWorldPos.y, // Та же Y позиция (пол)
        wallZ
      );
      
      // Создаем горизонтальную линию
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 3 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sectionOffsetLines.push(line);
      
      // Создаем метку как HTML элемент (2D текст, всегда видимый)
      const labelPos = new THREE.Vector3(
        (lineStart.x + lineEnd.x) / 2, // По центру линии
        lineStart.y + 100, // Выше линии на 100мм
        wallZ // На стене
      );
      const label = createDimensionLabel(
        `${offsets.bottom.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-bottom'
      );
      if (label) {
        sectionOffsetLabels.push(label);
      }
    }
    
    // Отступ сверху - горизонтальная линия от секции до угла стены
    if (offsets.top > 0) {
      const lineStart = new THREE.Vector3(
        roomWorldPos.x, // От левого угла стены
        roomWorldPos.y + room.height, // От верхнего угла стены (потолок)
        wallZ
      );
      const lineEnd = new THREE.Vector3(
        roomWorldPos.x + room.width, // До правого угла стены
        roomWorldPos.y + room.height, // Та же Y позиция (потолок)
        wallZ
      );
      
      // Создаем горизонтальную линию
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 3 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sectionOffsetLines.push(line);
      
      // Создаем метку как HTML элемент (2D текст, всегда видимый)
      const labelPos = new THREE.Vector3(
        (lineStart.x + lineEnd.x) / 2, // По центру линии
        lineStart.y + 100, // Выше линии на 100мм
        wallZ // На стене
      );
      const label = createDimensionLabel(
        `${offsets.top.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-top'
      );
      if (label) {
        sectionOffsetLabels.push(label);
      }
    }
  } else if (wallName === 'left' || wallName === 'right') {
    // Для left стены: x = roomWorldPos.x (внутренняя поверхность стены, к которой приставлена секция)
    // Для right стены: x = roomWorldPos.x + room.width (внутренняя поверхность стены, к которой приставлена секция)
    // Секция находится на gap (2mm) от стены, но линии должны быть на самой стене
    const wallX = wallName === 'left' ? roomWorldPos.x : roomWorldPos.x + room.width;
    console.log('📍 Позиция стены (X):', wallX, 'для стены:', wallName, 'roomWorldPos.x:', roomWorldPos.x);
    
    // Отступ спереди - горизонтальная линия по середине высоты и метка на стене выше линии
    if (offsets.front > 0) {
      const centerY = sectionPos.y + currentSize.y / 2; // По середине высоты секции
      const lineStart = new THREE.Vector3(
        wallX, // На стене
        centerY, // По середине высоты
        sectionPos.z - offsets.front * 10 // Позиция начала линии (на стене, спереди от секции)
      );
      const lineEnd = new THREE.Vector3(
        wallX, // На стене
        centerY, // По середине высоты
        sectionPos.z // До переднего края секции
      );
      
      // Создаем горизонтальную линию
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 3 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sectionOffsetLines.push(line);
      
      // Создаем метку как HTML элемент (2D текст, всегда видимый)
      const labelPos = new THREE.Vector3(
        wallX, // На стене
        centerY + 100, // Выше линии на 100мм
        (lineStart.z + lineEnd.z) / 2 // По центру линии
      );
      const label = createDimensionLabel(
        `${offsets.front.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-front'
      );
      if (label) {
        sectionOffsetLabels.push(label);
      }
      
      console.log('✅ Линия и метка отступа спереди созданы');
    }
    
    // Отступ сзади - горизонтальная линия по середине высоты от секции до угла стены
    if (offsets.back > 0) {
      const centerY = sectionPos.y + currentSize.y / 2; // По середине высоты секции
      const lineStart = new THREE.Vector3(
        wallX, // На стене
        centerY, // По середине высоты
        sectionPos.z + currentSize.z // От заднего края секции
      );
      const lineEnd = new THREE.Vector3(
        wallX, // На стене
        centerY, // По середине высоты
        roomWorldPos.z + room.depth // До заднего угла стены
      );
      
      // Создаем горизонтальную линию
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 3 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sectionOffsetLines.push(line);
      
      // Создаем метку как HTML элемент (2D текст, всегда видимый)
      const labelPos = new THREE.Vector3(
        wallX, // На стене
        centerY + 100, // Выше линии на 100мм
        (lineStart.z + lineEnd.z) / 2 // По центру линии
      );
      const label = createDimensionLabel(
        `${offsets.back.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-back'
      );
      if (label) {
        sectionOffsetLabels.push(label);
      }
    }
    
    // Отступ снизу - горизонтальная линия и метка на стене выше линии
    if (offsets.bottom > 0) {
      const lineStart = new THREE.Vector3(
        wallX, // На стене
        roomWorldPos.y, // От нижнего угла стены (пол)
        roomWorldPos.z // От переднего угла стены
      );
      const lineEnd = new THREE.Vector3(
        wallX, // На стене
        roomWorldPos.y, // Та же Y позиция (пол)
        roomWorldPos.z + room.depth // До заднего угла стены
      );
      
      // Создаем горизонтальную линию
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 3 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sectionOffsetLines.push(line);
      
      // Создаем метку как HTML элемент (2D текст, всегда видимый)
      const labelPos = new THREE.Vector3(
        wallX, // На стене
        lineStart.y + 100, // Выше линии на 100мм
        (lineStart.z + lineEnd.z) / 2 // По центру линии
      );
      const label = createDimensionLabel(
        `${offsets.bottom.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-bottom'
      );
      if (label) {
        sectionOffsetLabels.push(label);
      }
    }
    
    // Отступ сверху - линия и метка на стене
    if (offsets.top > 0) {
      const lineStart = new THREE.Vector3(
        wallX, // На стене
        roomWorldPos.y + room.height, // От верхнего угла стены (потолок)
        roomWorldPos.z // От переднего угла стены
      );
      const lineEnd = new THREE.Vector3(
        wallX, // На стене
        roomWorldPos.y + room.height, // Та же Y позиция (потолок)
        roomWorldPos.z + room.depth // До заднего угла стены
      );
      
      // Создаем линию
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 3 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sectionOffsetLines.push(line);
      
      // Создаем метку как HTML элемент (2D текст, всегда видимый)
      const labelPos = new THREE.Vector3(
        wallX, // На стене
        lineStart.y + 100, // Выше линии на 100мм
        (lineStart.z + lineEnd.z) / 2 // По центру линии
      );
      const label = createDimensionLabel(
        `${offsets.top.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-top'
      );
      if (label) {
        sectionOffsetLabels.push(label);
      }
    }
  }
}

// Удалить метки отступов
function removeSectionOffsetLabels() {
  // Удаляем HTML метки
  sectionOffsetLabels.forEach(label => {
    if (label && label.parentNode) {
      label.parentNode.removeChild(label);
    }
  });
  sectionOffsetLabels = [];
  
  // Удаляем Three.js линии
  sectionOffsetLines.forEach(line => {
    if (line && line.parent) {
      scene.remove(line);
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
    }
  });
  sectionOffsetLines = [];
  
  // Удаляем Three.js спрайты
  sectionOffsetSprites.forEach(sprite => {
    if (sprite && sprite.parent) {
      scene.remove(sprite);
      if (sprite.material && sprite.material.map) {
        sprite.material.map.dispose();
      }
      if (sprite.material) sprite.material.dispose();
    }
  });
  sectionOffsetSprites = [];
}

// Настроить обновление меток отступов при изменении значений в модальном окне
function setupOffsetLabelsUpdate(sectionData, wallName) {
  // Удаляем старые обработчики, если есть
  if (window.offsetLabelsUpdateHandlers) {
    window.offsetLabelsUpdateHandlers.forEach(handler => {
      if (handler.element && handler.event) {
        handler.element.removeEventListener(handler.event, handler.callback);
      }
    });
  }
  window.offsetLabelsUpdateHandlers = [];
  
  // Добавляем обработчики на все поля отступов и глубины
  const inputs = [];
  if (wallName === 'front' || wallName === 'back') {
    inputs.push('section-offset-left', 'section-offset-right', 'section-offset-bottom', 'section-offset-top', 'section-depth');
  } else {
    inputs.push('section-offset-front', 'section-offset-back', 'section-offset-bottom', 'section-offset-top', 'section-depth');
  }
  
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      const handler = () => {
        // Читаем текущие значения из полей
        const offsets = {};
        let newDepth = 0;
        if (wallName === 'front' || wallName === 'back') {
          offsets.left = parseFloat(document.getElementById('section-offset-left')?.value || '0');
          offsets.right = parseFloat(document.getElementById('section-offset-right')?.value || '0');
          offsets.bottom = parseFloat(document.getElementById('section-offset-bottom')?.value || '0');
          offsets.top = parseFloat(document.getElementById('section-offset-top')?.value || '0');
          newDepth = parseFloat(document.getElementById('section-depth')?.value || '60');
        } else {
          offsets.front = parseFloat(document.getElementById('section-offset-front')?.value || '0');
          offsets.back = parseFloat(document.getElementById('section-offset-back')?.value || '0');
          offsets.bottom = parseFloat(document.getElementById('section-offset-bottom')?.value || '0');
          offsets.top = parseFloat(document.getElementById('section-offset-top')?.value || '0');
          newDepth = parseFloat(document.getElementById('section-depth')?.value || '60');
        }
        
        // Вычисляем новые размеры секции на основе отступов
        let newWidth, newHeight, newDepthMm;
        newDepthMm = newDepth * 10; // конвертируем см в мм
        
        if (wallName === 'front' || wallName === 'back') {
          newWidth = room.width - (offsets.left * 10) - (offsets.right * 10);
          newHeight = room.height - (offsets.bottom * 10) - (offsets.top * 10);
        } else if (wallName === 'left' || wallName === 'right') {
          newWidth = room.depth - (offsets.front * 10) - (offsets.back * 10);
          newHeight = room.height - (offsets.bottom * 10) - (offsets.top * 10);
        }
        
        // Проверяем, что размеры вычислены корректно
        if (isNaN(newWidth) || isNaN(newHeight) || isNaN(newDepthMm)) {
          console.warn('⚠️ Некорректные вычисленные размеры (NaN):', {
            newWidth,
            newHeight,
            newDepthMm,
            offsets,
            room: { width: room.width, height: room.height, depth: room.depth }
          });
          return;
        }
        
        // Обновляем метки отступов
        addSectionOffsetLabels(sectionData, offsets, wallName);
        
        // Пересчитываем маркеры расстановки шкафов с новыми размерами (в реальном времени)
        if (sectionData.id && newWidth > 0 && newHeight > 0 && newDepthMm > 0) {
          // Обновляем размеры в sectionData для расчета маркеров
          sectionData.size = { x: newWidth, y: newHeight, z: newDepthMm };
          console.log('🔄 Обновление маркеров в реальном времени:', {
            sectionId: sectionData.id,
            newSize: sectionData.size,
            wallName: wallName,
            newWidth,
            newHeight,
            newDepthMm
          });
          updateCabinetMarkersForSection(sectionData.id);
        } else {
          console.warn('⚠️ Некорректные размеры для маркеров в реальном времени:', {
            sectionId: sectionData.id,
            newWidth,
            newHeight,
            newDepthMm,
            isValid: newWidth > 0 && newHeight > 0 && newDepthMm > 0
          });
        }
      };
      
      input.addEventListener('input', handler);
      window.offsetLabelsUpdateHandlers.push({
        element: input,
        event: 'input',
        callback: handler
      });
    }
  });
}

// Обновить размеры секции
function updateSectionSize(sectionData, offsets, newDepth) {
  if (!sectionData || !sectionData.group || !room) {
    console.error('❌ Некорректные данные для обновления секции');
    return;
  }
  
  const wallName = sectionData.wallName || 'back';
  const gap = 2; // 2mm gap from wall
  
  // Вычисляем новые размеры на основе отступов
  let newWidth, newHeight, newDepthMm;
  
  newDepthMm = newDepth * 10; // конвертируем см в мм
  
  if (wallName === 'front' || wallName === 'back') {
    // Для передней/задней стены: ширина = room.width - отступ слева - отступ справа
    // высота = room.height - отступ снизу - отступ сверху
    newWidth = room.width - (offsets.left * 10) - (offsets.right * 10); // конвертируем см в мм
    newHeight = room.height - (offsets.bottom * 10) - (offsets.top * 10); // конвертируем см в мм
  } else if (wallName === 'left' || wallName === 'right') {
    // Для боковых стен: ширина = room.depth - отступ спереди - отступ сзади
    // высота = room.height - отступ снизу - отступ сверху
    newWidth = room.depth - (offsets.front * 10) - (offsets.back * 10); // конвертируем см в мм
    newHeight = room.height - (offsets.bottom * 10) - (offsets.top * 10); // конвертируем см в мм
  }
  
  // Проверяем валидность размеров
  if (newWidth <= 0 || newHeight <= 0 || newDepthMm <= 0) {
    alert('Некорректные размеры. Все размеры должны быть больше нуля.');
    return;
  }
  
  // Вычисляем новую позицию
  const roomWorldPos = new THREE.Vector3();
  room.group.getWorldPosition(roomWorldPos);
  
  const extent = {
    x: newWidth,
    y: newHeight,
    z: newDepthMm
  };
  
  let finalX, finalY, finalZ;
  
  switch (wallName) {
    case 'front':
      // Для передней стены: пивот слева (как back), левый край = offset.left
      // front wall at Z = room.depth
      finalX = offsets.left * 10; // конвертируем см в мм
      finalY = offsets.bottom * 10; // конвертируем см в мм
      finalZ = room.depth - gap;
      break;
    case 'back':
      // Для задней стены: позиция X = отступ слева, Y = отступ снизу, Z = room.depth - depth - gap
      finalX = offsets.left * 10; // конвертируем см в мм
      finalY = offsets.bottom * 10; // конвертируем см в мм
      finalZ = room.depth - extent.z - gap;
      break;
    case 'left':
      // Для левой стены: позиция X = gap, Y = отступ снизу, Z = отступ спереди
      finalX = gap;
      finalY = offsets.bottom * 10; // конвертируем см в мм
      finalZ = offsets.front * 10; // конвертируем см в мм
      break;
    case 'right':
      // Для правой стены: позиция X = room.width - width - gap, Y = отступ снизу, Z = отступ спереди
      finalX = room.width - extent.x - gap;
      finalY = offsets.bottom * 10; // конвертируем см в мм
      finalZ = offsets.front * 10; // конвертируем см в мм
      break;
    default:
      console.error('❌ Неизвестная стена:', wallName);
      return;
  }
  
  const newWorldPos = new THREE.Vector3(
    roomWorldPos.x + finalX,
    roomWorldPos.y + finalY,
    roomWorldPos.z + finalZ
  );
  
  // Удаляем старую геометрию
  const sectionGroup = sectionData.group;
  const childrenToRemove = [];
  sectionGroup.traverse(child => {
    if (child.isMesh || child.isLineSegments) {
      childrenToRemove.push(child);
    }
  });
  childrenToRemove.forEach(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
    sectionGroup.remove(child);
  });
  
  // Создаем новую геометрию с новыми размерами
  const geometry = new THREE.BoxGeometry(newWidth, newHeight, newDepthMm);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff0000,
    linewidth: 3,
    transparent: true,
    opacity: 0.9
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  wireframe.position.set(newWidth / 2, newHeight / 2, newDepthMm / 2);
  sectionGroup.add(wireframe);
  
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const fillMesh = new THREE.Mesh(geometry, fillMaterial);
  fillMesh.position.copy(wireframe.position);
  sectionGroup.add(fillMesh);
  
  // Обновляем позицию
  sectionGroup.position.copy(newWorldPos);
  
  // Обновляем данные секции
  sectionData.size = { x: newWidth, y: newHeight, z: newDepthMm };
  sectionData.position = {
    x: newWorldPos.x,
    y: newWorldPos.y,
    z: newWorldPos.z
  };
  
  // Обновляем метки размеров
  if (sectionDimensionLabels[sectionData.id]) {
    sectionDimensionLabels[sectionData.id].forEach(label => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    delete sectionDimensionLabels[sectionData.id];
  }
  addSectionDimensionLabels(sectionData.id, sectionGroup, newWidth, newHeight, newDepthMm, wallName);
  
  // Пересчитываем маркеры расстановки шкафов с новыми размерами
  updateCabinetMarkersForSection(sectionData.id);
  
  console.log('✅ Размеры секции обновлены:', {
    id: sectionData.id,
    newSize: sectionData.size,
    newPosition: sectionData.position
  });
}

// Обновить позиции меток размеров секций
function updateSectionDimensionLabels() {
  if (!sectionDimensionLabels) return;
  
  Object.keys(sectionDimensionLabels).forEach(sectionId => {
    const labels = sectionDimensionLabels[sectionId];
    if (!labels) return;
    
    labels.forEach(label => {
      if (label && label.userData && label.userData.position3D) {
        const vector = label.userData.position3D.clone();
        vector.project(camera);
        
        const container = window.sceneIconsContainer;
        if (!container) return;
        
        const widthHalf = container.clientWidth / 2;
        const heightHalf = container.clientHeight / 2;
        
        const x = (vector.x * widthHalf) + widthHalf;
        const y = -(vector.y * heightHalf) + heightHalf;
        
        label.style.left = x + 'px';
        label.style.top = y + 'px';
        label.style.display = vector.z > 1 ? 'none' : 'block';
      }
    });
  });
  
  // Обновляем также метки отступов
  sectionOffsetLabels.forEach(label => {
    if (label && label.userData && label.userData.position3D) {
      const vector = label.userData.position3D.clone();
      vector.project(camera);
      
      const container = window.sceneIconsContainer;
      if (!container) return;
      
      const widthHalf = container.clientWidth / 2;
      const heightHalf = container.clientHeight / 2;
      
      const x = (vector.x * widthHalf) + widthHalf;
      const y = -(vector.y * heightHalf) + heightHalf;
      
      label.style.left = x + 'px';
      label.style.top = y + 'px';
      label.style.display = vector.z > 1 ? 'none' : 'block';
    }
  });
}

// Создать SVG иконку для формы расположения
function createLayoutIcon(shapeType) {
  const size = 64;
  const strokeWidth = 2;
  const margin = 2;
  const wallThickness = 10; // Толщина заштрихованной области (стены)
  
  // Основной контур прямоугольника
  const outerRect = `M ${margin} ${margin} L ${size - margin} ${margin} L ${size - margin} ${size - margin} L ${margin} ${size - margin} Z`;
  
  let walls = '';
  let partition = '';
  
  switch(shapeType) {
    case 'top-wall':
      // Верхняя стена заштрихована
      walls = `<rect x="${margin}" y="${margin}" width="${size - margin * 2}" height="${wallThickness}" fill="#4caf50" opacity="0.4"/>`;
      break;
      
    case 'top-right':
      // Верхняя и правая стены заштрихованы
      walls = `<rect x="${margin}" y="${margin}" width="${size - margin * 2}" height="${wallThickness}" fill="#4caf50" opacity="0.4"/>
               <rect x="${size - margin - wallThickness}" y="${margin}" width="${wallThickness}" height="${size - margin * 2}" fill="#4caf50" opacity="0.4"/>`;
      break;
      
    case 'top-partition':
      // Верхняя стена + перегородка посередине
      walls = `<rect x="${margin}" y="${margin}" width="${size - margin * 2}" height="${wallThickness}" fill="#4caf50" opacity="0.4"/>`;
      const partitionMargin = (size - margin * 2) / 4;
      partition = `<rect x="${margin + partitionMargin}" y="${size / 2}" width="${size - margin * 2 - partitionMargin * 2}" height="${wallThickness}" fill="#4caf50" opacity="0.4"/>`;
      break;
      
    case 'left-bottom':
      // Левая и нижняя стены заштрихованы
      walls = `<rect x="${margin}" y="${margin}" width="${wallThickness}" height="${size - margin * 2}" fill="#4caf50" opacity="0.4"/>
               <rect x="${margin}" y="${size - margin - wallThickness}" width="${size - margin * 2}" height="${wallThickness}" fill="#4caf50" opacity="0.4"/>`;
      break;
      
    case 'top-left-partition':
      // Верхняя и левая стены + перегородка
      walls = `<rect x="${margin}" y="${margin}" width="${size - margin * 2}" height="${wallThickness}" fill="#4caf50" opacity="0.4"/>
               <rect x="${margin}" y="${margin}" width="${wallThickness}" height="${size - margin * 2}" fill="#4caf50" opacity="0.4"/>`;
      const partitionMargin2 = (size - margin * 2) / 4;
      partition = `<rect x="${margin + partitionMargin2}" y="${size / 2}" width="${size - margin * 2 - partitionMargin2 * 2}" height="${wallThickness}" fill="#4caf50" opacity="0.4"/>`;
      break;
      
    case 'top-right-bottom-partition':
      // П-образная: задняя + левая + правая (ключ исторический)
      walls = `<rect x="${margin}" y="${margin}" width="${size - margin * 2}" height="${wallThickness}" fill="#4caf50" opacity="0.4"/>
               <rect x="${margin}" y="${margin}" width="${wallThickness}" height="${size - margin * 2}" fill="#4caf50" opacity="0.4"/>
               <rect x="${size - margin - wallThickness}" y="${margin}" width="${wallThickness}" height="${size - margin * 2}" fill="#4caf50" opacity="0.4"/>`;
      break;
      
    default:
      walls = '';
  }
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="fill: none; stroke: currentColor; stroke-width: ${strokeWidth};">
      <path d="${outerRect}" />
      ${walls}
      ${partition}
    </svg>
  `;
}

// Показать модальное окно для создания секции
function showCreateSectionModal() {
  const modal = document.getElementById('create-section-modal');
  if (!modal) return;
  
  modal.style.display = 'flex';
  
  // Сброс значений
  document.getElementById('section-width').value = 600;
  document.getElementById('section-height').value = 2400;
  document.getElementById('section-depth').value = 600;
  
  // Обработчики событий
  const confirmBtn = document.getElementById('create-section-confirm');
  const cancelBtn = document.getElementById('create-section-cancel');
  
  const closeModal = () => {
    modal.style.display = 'none';
  };
  
  confirmBtn.onclick = () => {
    const width = parseFloat(document.getElementById('section-width').value);
    const height = parseFloat(document.getElementById('section-height').value);
    const depth = parseFloat(document.getElementById('section-depth').value);
    
    if (width > 0 && height > 0 && depth > 0) {
      // Вместо немедленного создания, запускаем режим размещения
      startSectionPlacement(width, height, depth);
      closeModal();
    } else {
      alert('Пожалуйста, введите корректные размеры (больше 0)');
    }
  };
  
  cancelBtn.onclick = closeModal;
  
  // Закрытие по клику вне модального окна
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };
}

// Начать размещение секции (режим выбора стены)
function startSectionPlacement(width, height, depth) {
  console.log('🏗️ Начало размещения секции:', { width, height, depth });
  
  if (!room) {
    console.error('❌ Комната не создана');
    return;
  }
  
  pendingSectionData = { width, height, depth };
  isPlacingSection = true;
  
  // Создаём призрак — тогда появятся линии
  createSectionGhost(width, height, depth);
  const fakeEvent = {
    clientX: renderer.domElement.clientWidth / 2,
    clientY: renderer.domElement.clientHeight / 2
  };
  updateSectionGhostPosition(fakeEvent);
  
  // Показываем подсказку
  const infoDiv = document.getElementById('info');
  if (infoDiv) {
    infoDiv.innerHTML = '<div>Кликните на стену для размещения секции</div>';
  }
  
  console.log('✅ Режим размещения секции активирован. Кликните на стену.');
}

// Создать пользовательскую секцию в комнате
function createCustomSection(width, height, depth, position = null, wallName = null) {
  console.log('🏗️ Создание пользовательской секции:', { width, height, depth });
  
  // Создаем уникальный ID
  const sectionId = 'custom_section_' + Date.now();
  const sectionName = `Секция ${customSections.length + 1}`;
  
  // Размеры в миллиметрах (для params.sectionSize)
  const sectionSize = {
    x: width,
    y: height,
    z: depth
  };
  
  // Размеры в миллиметрах (для Three.js, теперь работаем в мм)
  const sizeInMm = {
    x: width, // Уже в миллиметрах
    y: height, // Уже в миллиметрах
    z: depth // Уже в миллиметрах
  };
  
  // Создаем визуальное представление секции (прозрачный Box)
  const sectionGroup = new THREE.Group();
  sectionGroup.name = sectionName;
  sectionGroup.userData.isCustomSection = true;
  sectionGroup.userData.sectionId = sectionId;
  sectionGroup.userData.sectionSize = sectionSize;
  
  // Создаем прозрачный контейнер (wireframe box)
  // BoxGeometry создает геометрию с центром в (0,0,0)
  // Но нам нужен pivot в back-left-bottom, поэтому смещаем на половину размера
  const geometry = new THREE.BoxGeometry(sizeInMm.x, sizeInMm.y, sizeInMm.z);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff0000, // Красный цвет для лучшей видимости
    linewidth: 3,
    transparent: true,
    opacity: 0.9
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  
  // Позиционируем wireframe так, чтобы pivot был в back-left-bottom (0,0,0)
  // BoxGeometry имеет центр в (0,0,0), поэтому нужно сместить на половину размера
  wireframe.position.set(sizeInMm.x / 2, sizeInMm.y / 2, sizeInMm.z / 2);
  sectionGroup.add(wireframe);
  
  // Также добавляем полупрозрачную заливку для лучшей видимости
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, // Красный цвет для лучшей видимости
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const fillMesh = new THREE.Mesh(geometry, fillMaterial);
  fillMesh.position.copy(wireframe.position);
  sectionGroup.add(fillMesh);
  
  console.log('🔷 Wireframe позиция:', wireframe.position);
  console.log('🔷 Fill mesh позиция:', fillMesh.position);
  
  // Позиция секции
  if (position && wallName) {
    // Размещаем у стены (как мебель)
    const gap = 0.002; // 2mm gap from wall
    const inset = 0.05; // 5cm inset from room edges
    const roomWorldPos = new THREE.Vector3();
    if (room && room.group) {
      room.group.getWorldPosition(roomWorldPos);
    }
    
    // Конвертируем позицию в локальные координаты комнаты
    const localPos = position.clone().sub(roomWorldPos);
    
    // Размеры секции в миллиметрах
    const extent = {
      x: sizeInMm.x,
      y: sizeInMm.y,
      z: sizeInMm.z
    };
    
    let finalX, finalZ;
    
    switch (wallName) {
      case 'front':
        // Front wall: z = 0, pivot должен быть на z = gap
        finalX = THREE.MathUtils.clamp(
          localPos.x,
          inset + extent.x / 2,
          room.width - inset - extent.x / 2
        );
        finalZ = gap; // Pivot на gap от стены
        break;
      case 'back':
        // Back wall: z = depth, pivot должен быть на z = depth - gap
        finalX = THREE.MathUtils.clamp(
          localPos.x,
          inset + extent.x / 2,
          room.width - inset - extent.x / 2
        );
        finalZ = room.depth - gap;
        break;
      case 'left':
        // Left wall: x = 0, pivot должен быть на x = gap
        finalX = gap;
        finalZ = THREE.MathUtils.clamp(
          localPos.z,
          inset + extent.z / 2,
          room.depth - inset - extent.z / 2
        );
        break;
      case 'right':
        // Right wall: x = width, pivot должен быть на x = width - gap
        finalX = room.width - gap;
        finalZ = THREE.MathUtils.clamp(
          localPos.z,
          inset + extent.z / 2,
          room.depth - inset - extent.z / 2
        );
        break;
      default:
        // По умолчанию в центре комнаты
        finalX = 0;
        finalZ = 0;
    }
    
    sectionGroup.position.set(
      finalX + roomWorldPos.x,
      0, // На полу
      finalZ + roomWorldPos.z
    );
    
    console.log('📍 Секция размещена у стены:', wallName);
  } else {
    // По умолчанию в центре комнаты на полу
    // Комната смещена на (-width/2, 0, -depth/2), так что центр комнаты в мировых координатах = (0, 0, 0)
    sectionGroup.position.set(0, 0, 0);
    console.log('📍 Секция размещена в центре комнаты');
  }
  
  console.log('📍 Позиция секции:', sectionGroup.position);
  console.log('📐 Размеры секции (в мм):', sizeInMm);
  
  // Сохраняем данные секции
  const sectionData = {
    id: sectionId,
    name: sectionName,
    size: sectionSize,
    position: {
      x: sectionGroup.position.x,
      y: sectionGroup.position.y,
      z: sectionGroup.position.z
    },
    wallName: wallName || null,
    group: sectionGroup
  };
  
  customSections.push(sectionData);
  scene.add(sectionGroup);
  
  // Проверяем, что секция действительно добавлена в сцену
  console.log('✅ Пользовательская секция создана:', sectionData);
  console.log('📐 Всего секций:', customSections.length);
  console.log('🔍 Секция добавлена в сцену?', scene.children.includes(sectionGroup));
  console.log('🔍 Детей секции:', sectionGroup.children.length);
  console.log('🔍 Позиция секции в сцене:', sectionGroup.position);
  
  // Обновляем матрицы для корректного отображения
  sectionGroup.updateMatrixWorld(true);
  
  return sectionData;
}

// Вычислить привязку к зоне (двойной модуль: пивот на сплошной линии, ширина от сплошной до сплошной)
// hitCoord - координата по оси разметки (X для front/back, Z для left/right) в мировых координатах
function snapToZoneDoubleModule(hitCoord, division, wallName) {
  if (!division) return null;
  const { partSize, sectionStart, sectionEnd, parts } = division;
  // Индекс зоны: 0..parts-1
  let zoneIndex = Math.floor((hitCoord - sectionStart) / partSize);
  zoneIndex = Math.max(0, Math.min(zoneIndex, parts - 1));
  const pivotCoord = sectionStart + zoneIndex * partSize;
  return {
    pivotCoord,
    zoneIndex,
    moduleWidth: partSize,
  };
}

// Пересчитать размер зоны прямо по позиции (на случай если furnitureGhost.userData.zoneSize не успел сохраниться)
function computeZoneSizeAtPosition(worldPos) {
  // 1) Попадание в призрак секции
  const inSectionGhost = sectionGhost && sectionGhost.visible && pendingSectionData &&
    worldPos.x >= sectionGhost.position.x && worldPos.x <= sectionGhost.position.x + pendingSectionData.width &&
    worldPos.y >= sectionGhost.position.y && worldPos.y <= sectionGhost.position.y + (pendingSectionData.height ?? pendingSectionData.y ?? 0) &&
    worldPos.z >= sectionGhost.position.z && worldPos.z <= sectionGhost.position.z + pendingSectionData.depth;

  // 2) Попадание в размещённую секцию
  const sectionAtPosition = findSectionAtPosition(worldPos);

  const division = inSectionGhost ? sectionGhostDivision : (sectionAtPosition ? sectionAtPosition.division : null);
  if (!division) return null;

  const wallName = inSectionGhost
    ? sectionGhostWall
    : (sectionAtPosition.wallName || sectionAtPosition.division?.wallName || null);
  const sourceSize = inSectionGhost ? pendingSectionData : sectionAtPosition.size;
  const hitCoord = (wallName === 'front' || wallName === 'back') ? worldPos.x : worldPos.z;
  const snap = snapToZoneDoubleModule(hitCoord, division, wallName);
  if (!snap) return null;

  const srcHeight = (sourceSize && (sourceSize.y ?? sourceSize.height)) || null;
  const srcDepth = (sourceSize && (sourceSize.z ?? sourceSize.depth)) || null;
  if (!srcHeight || !srcDepth) return null;

  return { x: snap.moduleWidth, y: srcHeight, z: srcDepth };
}

// Найти секцию, которая содержит заданную позицию
function findSectionAtPosition(position) {
  console.log('🔍 Поиск секции для позиции:', position);
  console.log('📦 Всего секций:', customSections.length);
  
  for (const section of customSections) {
    const sectionPos = section.group.position;
    // Размеры уже в миллиметрах
    const size = section.size;
    
    console.log(`  Проверка секции "${section.name}":`, {
      sectionPos: sectionPos,
      size: size, // В миллиметрах
      bounds: {
        xMin: sectionPos.x,
        xMax: sectionPos.x + size.x,
        yMin: sectionPos.y,
        yMax: sectionPos.y + size.y,
        zMin: sectionPos.z,
        zMax: sectionPos.z + size.z
      }
    });
    
    // Проверяем, находится ли позиция внутри секции
    // Секция имеет pivot в back-left-bottom (0,0,0 в локальных координатах группы)
    // В мировых координатах:
    // X: от sectionPos.x до sectionPos.x + size.x
    // Y: от sectionPos.y до sectionPos.y + size.y  
    // Z: от sectionPos.z до sectionPos.z + size.z
    if (position.x >= sectionPos.x && position.x <= sectionPos.x + size.x &&
        position.y >= sectionPos.y && position.y <= sectionPos.y + size.y &&
        position.z >= sectionPos.z && position.z <= sectionPos.z + size.z) {
      console.log('✅✅✅ Позиция находится внутри секции:', section.name);
      return section;
    } else {
      console.log(`  ❌ Позиция НЕ внутри секции "${section.name}"`);
    }
  }
  
  console.log('❌ Секция не найдена для позиции:', position);
  return null;
}

// Извлечь ID категорий из элемента каталога (поддержка category как массив: [1,2,3] или [{id:1},...])
function getItemCategoryIds(item) {
  var cid = item.categoryId != null ? item.categoryId : (item.category_id != null ? item.category_id : null);
  if (cid != null) return [cid];
  var cat = item.category;
  if (cat == null) return [];
  if (typeof cat === 'number') return [cat];
  if (cat.id != null) return [cat.id];
  if (!Array.isArray(cat)) return [];
  return cat.map(function (c) {
    if (typeof c === 'number') return c;
    if (typeof c === 'string' && c.trim() !== '' && !isNaN(Number(c))) return Number(c);
    if (c && c.id != null) return c.id;
    return null;
  }).filter(function (x) { return x != null; });
}

// Проверить, входит ли filterCategoryId в категории элемента
function itemMatchesCategoryFilter(item, filterCategoryId) {
  if (filterCategoryId == null) return true;
  var ids = getItemCategoryIds(item);
  if (ids.length === 0) return false;
  return ids.indexOf(filterCategoryId) >= 0 || ids.indexOf(Number(filterCategoryId)) >= 0;
}

// Загрузить сохраненные модели из localStorage и добавить в каталог
// catalogType - тип каталога (folderId из шага 3), например "26" — должен совпадать с ключом в localStorage (catalog_26)
// targetGrid - контейнер для карточек
// filterCategoryId - подкатегория из овальной кнопки (фильтр: без дверей, с дверями и т.д.)
function loadSavedModels(catalogType = null, targetGrid = null, filterCategoryId = null) {
  const cabinetsGrid = targetGrid || document.getElementById('cabinets-grid');
  if (!cabinetsGrid) {
    console.warn('⚠️ Элемент для каталога не найден');
    return;
  }
  cabinetsGrid.innerHTML = '';
  console.log('[loadSavedModels] catalogType=' + catalogType + ', filterCategoryId=' + filterCategoryId);
  // === ДИАГНОСТИКА: какие каталоги есть в localStorage ===
  const catalogKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('catalog_') && k !== 'catalogs_keys') catalogKeys.push(k);
  }
  const diagKey = catalogType ? 'catalog_' + catalogType : null;
  const diagJson = diagKey ? localStorage.getItem(diagKey) : null;
  const diagArr = diagJson ? (() => { try { const a = JSON.parse(diagJson); return Array.isArray(a) ? a : []; } catch(e) { return []; } })() : [];
  console.log('[ШКАФ-ДИАГНОСТИКА] localStorage: ключи=' + catalogKeys.join(', ') + ' | catalogType=' + catalogType + ' | каталог ' + (diagKey || '—') + ' существует=' + !!diagJson + ' элементов=' + (diagArr.length) + ' | элементы: ' + (diagArr.slice(0, 5).map(it => (it?.name || '?') + (it?.clodisJSON ? '✓clodis' : '✗нетClodis')).join(', ')));

  let totalItems = 0;
  
  try {
    // 1. Загружаем модели из savedModels (старый формат) - только если не указана категория
    if (!catalogType) {
    const savedModelsKey = 'savedModels';
    const savedModelsJson = localStorage.getItem(savedModelsKey);
    
      if (savedModelsJson) {
        try {
    const savedModels = JSON.parse(savedModelsJson);
          if (Array.isArray(savedModels)) {
            console.log(`📦 Загружено ${savedModels.length} сохраненных моделей из savedModels`);
    
    savedModels.forEach((modelData, index) => {
      if (!modelData || !modelData.metadata) {
        console.warn(`⚠️ Модель ${index} не имеет метаданных, пропускаем`);
        return;
      }
      
      const metadata = modelData.metadata;
      const size = metadata.size || {};
      // Размеры уже в миллиметрах (после изменения на мм)
      const widthMm = size.width || 600; // Уже в мм
      const heightMm = size.height || 2400; // Уже в мм
      
      const cabinetItem = createCabinetItem({
        id: 'saved-model-' + index,
        name: metadata.name || 'Модель ' + (index + 1),
        width: widthMm + '×' + heightMm + ' мм',
        price: '0,-',
        savedModelData: modelData,
        iconOnly: cabinetsGrid.id === 'step4-cabinets-grid'
      });
      
      cabinetsGrid.appendChild(cabinetItem);
              totalItems++;
      console.log(`  ✅ Добавлена в каталог: "${metadata.name}" (${widthMm}×${heightMm} мм)`);
    });
          }
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга savedModels:', e);
        }
      }
    }
    
    // 2. Если есть moduleItems в шаге 4 — показываем их с иконками, привязывая к каталогу
    var config = typeof getRoomStepsConfig === 'function' ? getRoomStepsConfig() : null;
    var step4 = config && config.steps ? config.steps.find(function (s) { return s.stepId === 4; }) : null;
    var moduleItems = (step4 && Array.isArray(step4.moduleItems) && step4.moduleItems.length > 0)
      ? step4.moduleItems.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
      : null;
    // При выбранном catalogType (Шкафы и т.д.) используем runCatalogLoad — элементы каталога автоматически
    // попадают в шаг 4 по фильтру категории. moduleItems — только если catalogType не задан.
    if (moduleItems && !catalogType) {
      try {
        var filteredMods = filterCategoryId != null
          ? moduleItems.filter(function (m) { return m.categoryId != null && m.categoryId === filterCategoryId; })
          : moduleItems;
        var modCatalog = null;
        var catalogKey = catalogType ? 'catalog_' + catalogType : null;
        if (catalogKey) {
          var modCatalogJson = localStorage.getItem(catalogKey);
          modCatalog = modCatalogJson ? JSON.parse(modCatalogJson) : null;
        }
        // Не подставляем другой каталог — пользователь выбрал catalogType (Шкафы), показываем только его
        if (!Array.isArray(modCatalog) || modCatalog.length === 0) {
          modCatalog = [];
        }
        if (Array.isArray(modCatalog) && modCatalog.length > 0) {
          filteredMods.forEach(function (mod, midx) {
            var catId = mod.categoryId;
            var found = modCatalog.find(function (c) {
              if (catId == null) return false;
              var cids = getItemCategoryIds(c);
              return cids.indexOf(catId) >= 0 || cids.indexOf(Number(catId)) >= 0;
            });
            if (!found && !catId) found = modCatalog.find(function (c) { return getItemCategoryIds(c).length === 0; }) || modCatalog[0];
            // Элементы без категории не показываем при активном фильтре — иначе при4 (без категорий) появляется вместо шкафов
            if (filterCategoryId != null && found && getItemCategoryIds(found).length === 0) found = null;
            if (found && found.clodisJSON) {
              var modSectionSize = extractSectionSizeFromFurnitureData({ clodisJSON: found.clodisJSON, catalogItem: found });
              var cabinetItem = createCabinetItem({
                id: 'mod-' + (mod.id || midx),
                name: mod.name || 'Модуль',
                icon: mod.icon || 'fa-cube',
                price: '0,-',
                data: { clodisJSON: found.clodisJSON, catalogItem: found, sectionSize: modSectionSize },
                iconOnly: cabinetsGrid.id === 'step4-cabinets-grid'
              });
              cabinetsGrid.appendChild(cabinetItem);
              totalItems++;
            }
          });
        } else if (moduleItems.length > 0) {
          var catKeys = [];
          for (var xi = 0; xi < localStorage.length; xi++) {
            var kk = localStorage.key(xi);
            if (kk && kk.indexOf('catalog_') === 0) catKeys.push(kk);
          }
          console.warn('[Step4] Каталог не найден. catalogType:', catalogType, 'Нажмите «Выгрузить всё в конструктор»');
        }
      } catch (e) { console.warn('loadSavedModels moduleItems:', e); }
    }
    if (catalogType || !moduleItems || totalItems === 0) {
    // 3. Загружаем элементы из каталогов (catalog_*) — основной путь при выборе Шкафы/Кухни
    function runCatalogLoad(useFilter) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('catalog_')) continue;
        const keyCatalogType = key.replace('catalog_', '');
        if (catalogType && keyCatalogType !== catalogType) continue;
        try {
          const catalogJson = localStorage.getItem(key);
          if (!catalogJson) continue;
          const catalog = JSON.parse(catalogJson);
          if (!Array.isArray(catalog)) continue;
          console.log('[loadSavedModels] runCatalogLoad useFilter=' + useFilter + ' key=' + key + ' items=' + catalog.length);
          catalog.forEach((item, index) => {
            const name = item.name || 'Элемент ' + index;
            if (useFilter && filterCategoryId != null) {
              const match = itemMatchesCategoryFilter(item, filterCategoryId);
              if (!match) {
                console.log('[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' + name + '": не подходит под фильтр категории (categoryIds=' + JSON.stringify(getItemCategoryIds(item)) + ' filter=' + filterCategoryId + ')');
                return;
              }
            }
            const showInRoom = item.showInRoom === true || item.show_in_constructor === '1' || item.show_in_constructor === true;
            if (!showInRoom && (item.showInRoom !== undefined || item.show_in_constructor !== undefined)) {
              console.log('[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' + name + '": show_in_constructor=' + (item.show_in_constructor ?? item.showInRoom) + ' (нужно "1" или true)');
              return;
            }
            const readJson = window.__cldReadClodisJSON || ((o) => o?.clodisJSON);
            const itemJson = readJson(item);
            if (!itemJson || (Array.isArray(itemJson) && itemJson.length === 0)) {
              console.log('[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' + name + '": нет clodisJSON (или пустой массив). Нажмите «Выгрузить всё в конструктор» в админке.');
              return;
            }
            const clodisData = Array.isArray(itemJson) ? itemJson[0] : itemJson;
            const sectionSize = extractSectionSizeFromFurnitureData({ clodisJSON: itemJson, catalogItem: item });
            const widthStr = clodisData && clodisData.size && typeof clodisData.size.x === 'number'
              ? Math.round(clodisData.size.x) + '×' + Math.round(clodisData.size.y) + ' мм'
              : (sectionSize.x + '×' + sectionSize.y + ' мм');
            const cabinetItem = createCabinetItem({
              id: key + '-' + index,
              name: item.name || 'Элемент ' + (index + 1),
              icon: item.icon || item.icon_url || (item.data && (item.data.icon || item.data.icon_url)),
              width: widthStr,
              price: '0,-',
              data: { clodisJSON: itemJson, catalogItem: item, sectionSize: sectionSize },
              iconOnly: cabinetsGrid.id === 'step4-cabinets-grid'
            });
            cabinetsGrid.appendChild(cabinetItem);
            totalItems++;
            console.log('[ШКАФ-ДИАГНОСТИКА] ДОБАВЛЕН В КАТАЛОГ: "' + (item.name || 'Элемент ' + index) + '" clodisJSON.length=' + (Array.isArray(itemJson) ? itemJson.length : 0) + ' sectionSize=' + (sectionSize.x + '×' + sectionSize.y + '×' + sectionSize.z));
          });
        } catch (e) { console.warn('loadSavedModels catalog', key, e); }
      }
    }
    var catKey = 'catalog_' + catalogType;
    if (!localStorage.getItem(catKey) || localStorage.getItem(catKey) === '[]') {
      var available = [];
      for (var ai = 0; ai < localStorage.length; ai++) {
        var ak = localStorage.key(ai);
        if (ak && ak.indexOf('catalog_') === 0 && ak !== 'catalogs_keys') available.push(ak);
      }
      console.warn('[loadSavedModels] "' + catKey + '" пуст или нет. Доступны: ' + available.join(', ') + '. В шаге 3 для Шкафы задайте key=26. Затем «Выгрузить всё в конструктор».');
    }
    runCatalogLoad(true);
    if (totalItems === 0) {
      if (filterCategoryId != null) runCatalogLoad(false);
    }
    console.log('[ШКАФ-ДИАГНОСТИКА] ИТОГО в каталоге отображается элементов: ' + totalItems + (totalItems === 0 ? '. Проверьте: 1) «Выгрузить всё в конструктор» в админке 2) catalog_26 в localStorage 3) show_in_constructor=1, clodisJSON не пустой' : ''));
    }
    
    // Очищаем сообщение "Нет сохраненных моделей" если оно есть
    const emptyMsg = cabinetsGrid.querySelector('div[style*="text-align: center"]');
    if (emptyMsg && totalItems > 0) {
      emptyMsg.remove();
    }
    
    // Если нет элементов, показываем сообщение
    if (totalItems === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.style.padding = '20px';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#666';
      emptyMessage.textContent = 'Нет сохраненных моделей.\nСоздайте модель в конструкторе и сохраните её.';
      emptyMessage.style.whiteSpace = 'pre-line';
      cabinetsGrid.appendChild(emptyMessage);
    }
    
    console.log(`✅ Всего добавлено элементов в каталог: ${totalItems}`);
  } catch (error) {
    console.error('❌ Ошибка загрузки сохраненных моделей:', error);
    console.error('  Стек ошибки:', error.stack);
  }
}

// Global function for step-by-step building (can be called from console)
// Usage: loadStepByStep(jsonData, stepName)
window.loadStepByStep = function(jsonData, stepName = 'Шаг') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📐 ${stepName} - Пошаговое построение`);
  console.log(`${'='.repeat(60)}`);
  
  // Remove existing furniture if any
  if (furniture && furniture.group) {
    scene.remove(furniture.group);
    // Dispose geometry and materials
    furniture.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
  
  // Hide all section markers
  hideAllSectionMarkers();
  
  // Hide furniture perimeter marker
  if (furniturePerimeterMarker) {
    hideFurniturePerimeterMarker();
  }
  
  const params = {
    sectionSize: {
      x: 600,  // 600mm = 0.6m
      y: 2400, // 2400mm = 2.4m
      z: 600,  // 600mm = 0.6m
    },
    variables: {
      vysota_cokolya: 100,
      glubina_cokolya: 100,
      otstup_paza: 0,
    },
    groups: {
      g0: { thickness: 16 },
      hdf1: { thickness: 3 },
    },
  };
  
  // Create furniture from step data
  furniture = new Furniture(jsonData, params);
  
  // Position in center of room for viewing
  const roomWorldPos = new THREE.Vector3();
  room.group.getWorldPosition(roomWorldPos);
  furniture.group.position.set(
    room.width / 2,  // Center X
    0,                // On floor
    room.depth / 2   // Center Z
  );
  
  scene.add(furniture.group);
  
  // Calculate furniture bbox
  const furnitureBbox = new THREE.Box3().setFromObject(furniture.group);
  const furnitureSize = furnitureBbox.getSize(new THREE.Vector3());
  const furnitureCenter = furnitureBbox.getCenter(new THREE.Vector3());
  
  console.log(`✅ ${stepName} загружен!`);
  console.log('Размеры:', {
    width: furnitureSize.x.toFixed(3) + 'м',
    height: furnitureSize.y.toFixed(3) + 'м',
    depth: furnitureSize.z.toFixed(3) + 'м'
  });
  console.log('Центр:', furnitureCenter);
  console.log('Количество мешей:', furniture.meshes.length);
  
  // Update camera to view the furniture
  if (controls) {
    controls.target.copy(furnitureCenter);
    const maxDim = Math.max(furnitureSize.x, furnitureSize.y, furnitureSize.z);
    const distance = maxDim * 2.5;
    camera.position.set(
      furnitureCenter.x + distance * 0.7,
      furnitureCenter.y + distance * 0.5,
      furnitureCenter.z + distance * 0.7
    );
    controls.update();
  }
  
  // Log all sections found
  console.log('\n📦 Найденные секции в модели:');
  furniture.group.traverse(child => {
    if (child.userData && child.userData.isSection) {
      console.log(`   - "${child.userData.sectionName}" (Group)`);
    }
  });
  
  console.log(`${'='.repeat(60)}\n`);
  
  return furniture;
};

// Load and display full cabinet example in scene
async function loadFullCabinetExample() {
  try {
    const fullCabinetData = await loadFullCabinetData();
    if (!fullCabinetData) {
      console.warn('Full cabinet data not loaded');
      return;
    }
    
    console.log('📦 Загружаем полный шкаф "Шкаф пример.txt"');
    
    const params = {
      sectionSize: {
        x: 600,  // 600mm = 0.6m
        y: 2400, // 2400mm = 2.4m
        z: 600,  // 600mm = 0.6m
      },
      variables: {
        vysota_cokolya: 100,
        glubina_cokolya: 100,
        otstup_paza: 0,
      },
      groups: {
        g0: { thickness: 16 },
        hdf1: { thickness: 3 },
      },
    };
    
    // Remove existing furniture if any
    if (furniture && furniture.group) {
      scene.remove(furniture.group);
    }
    
    // Create furniture from full cabinet data
    furniture = new Furniture(fullCabinetData, params);
    
    // Position in center of room for viewing
    const roomWorldPos = new THREE.Vector3();
    room.group.getWorldPosition(roomWorldPos);
    furniture.group.position.set(
      room.width / 2,  // Center X
      0,                // On floor
      room.depth / 2   // Center Z
    );
    
    scene.add(furniture.group);
    
    // Calculate furniture bbox
    const furnitureBbox = new THREE.Box3().setFromObject(furniture.group);
    const furnitureSize = furnitureBbox.getSize(new THREE.Vector3());
    const furnitureCenter = furnitureBbox.getCenter(new THREE.Vector3());
    
    console.log('✅ Полный шкаф загружен!');
    console.log('Размеры шкафа:', {
      width: furnitureSize.x.toFixed(3) + 'м',
      height: furnitureSize.y.toFixed(3) + 'м',
      depth: furnitureSize.z.toFixed(3) + 'м'
    });
    console.log('Центр шкафа:', furnitureCenter);
    console.log('Количество мешей:', furniture.meshes.length);
    
    // Update camera to view the furniture
    if (controls) {
      // Set camera target to furniture center
      controls.target.copy(furnitureCenter);
      
      // Position camera to view entire furniture
      const maxDim = Math.max(furnitureSize.x, furnitureSize.y, furnitureSize.z);
      const distance = maxDim * 2.5; // Distance to view entire furniture
      
      camera.position.set(
        furnitureCenter.x + distance * 0.7,
        furnitureCenter.y + distance * 0.5,
        furnitureCenter.z + distance * 0.7
      );
      
      controls.update();
    }
    
  } catch (error) {
    console.error('❌ Ошибка загрузки полного шкафа:', error);
  }
}

function createCabinetItem(cabinet) {
  var step4Style = cabinet.iconOnly === true || cabinet.step4Style === true;
  if (step4Style) {
    var item = document.createElement('div');
    item.className = 'room-type-item';
    item.style.cursor = 'pointer';
    var iconVal = (cabinet.icon || '').trim() || 'fa-cube';
    var isImg = /^https?:\/\//i.test(iconVal) || (iconVal.length > 0 && iconVal.charAt(0) === '/');
    var iconHtml = isImg
      ? '<img src="' + iconVal.replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display=\'none\';var s=this.nextElementSibling;s&&(s.style.display=\'flex\');"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:36px;color:#999;"><i class="fas fa-cube"></i></div>'
      : '<i class="fas ' + iconVal.replace(/"/g, '') + '" style="font-size: 36px; color: #666;"></i>';
    item.innerHTML = '<div class="room-type-icon" style="background: #f5f5f5;">' + iconHtml + '</div>' +
      '<div class="room-type-name">' + (cabinet.name || '').replace(/</g, '&lt;') + '</div>';
    item.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (cabinet.glbFile) loadGLBFromPath(cabinet.glbFile);
      else if (cabinet.savedModelData) loadSavedModel(cabinet.savedModelData);
      else if (cabinet.data) startFurniturePlacement(cabinet.data);
    });
    return item;
  }
  var el = document.createElement('div');
  el.className = 'cabinet-item';
  var iconHtml = 'Шкаф';
  if (cabinet.icon) {
    var iconVal = (cabinet.icon || '').trim();
    var isShape = iconVal.indexOf('shape:') === 0;
    var isImg = !isShape && (/^https?:\/\//i.test(iconVal) || (iconVal.length > 0 && iconVal.charAt(0) === '/'));
    iconHtml = isImg
      ? '<img src="' + (iconVal || '').replace(/"/g, '&quot;') + '" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">'
      : '<i class="fas ' + (iconVal || 'fa-cube').replace(/"/g, '') + '" style="font-size:32px;color:#333;"></i>';
  }
  el.innerHTML =
    '<div class="cabinet-item-image" style="display:flex;align-items:center;justify-content:center;">' + iconHtml + '</div>' +
    '<div class="cabinet-item-name">' + (cabinet.name || '').replace(/</g, '&lt;') + '</div>' +
    '<div class="cabinet-item-price">' + (cabinet.price || '0,-') + '</div>';

  // Click handler - просто клик для размещения (без drag-and-drop)
  el.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const hasClodis = cabinet.data && (cabinet.data.clodisJSON || (Array.isArray(cabinet.data) && cabinet.data.length > 0));
    console.log('[ШКАФ-ДИАГНОСТИКА] КЛИК на "' + (cabinet.name || '?') + '" hasData=' + !!cabinet.data + ' hasClodis=' + !!hasClodis);
    console.log('🖱️🖱️🖱️ КЛИК НА ШКАФ В КАТАЛОГЕ 🖱️🖱️🖱️');
    console.log('📦 Данные шкафа:', {
      name: cabinet.name,
      hasGLB: !!cabinet.glbFile,
      hasSavedModel: !!cabinet.savedModelData,
      hasData: !!cabinet.data,
      dataType: cabinet.data ? (Array.isArray(cabinet.data) ? 'array' : typeof cabinet.data) : 'none',
      dataLength: Array.isArray(cabinet.data) ? cabinet.data.length : (cabinet.data ? 1 : 0),
      firstItem: Array.isArray(cabinet.data) ? {
        type: cabinet.data[0]?.type,
        name: cabinet.data[0]?.name,
        hasChildren: !!cabinet.data[0]?.children,
        childrenCount: cabinet.data[0]?.children?.length || 0
      } : (cabinet.data ? {
        type: cabinet.data.type,
        name: cabinet.data.name,
        hasChildren: !!cabinet.data.children,
        childrenCount: cabinet.data.children?.length || 0
      } : null)
    });
    console.log('📦 ПОЛНЫЕ ДАННЫЕ ШКАФА:', JSON.stringify(cabinet.data, null, 2));

        // Start furniture placement
    if (cabinet.glbFile) {
      console.log('  → Загрузка GLB файла:', cabinet.glbFile);
      // Load GLB file from public/models
      loadGLBFromPath(cabinet.glbFile);
    } else if (cabinet.savedModelData) {
      console.log('  → Загрузка сохраненной модели');
      // Загрузить сохраненную модель из конструктора
      loadSavedModel(cabinet.savedModelData);
    } else if (cabinet.data) {
      console.log('  → Запуск размещения мебели из Clodis JSON');
          startFurniturePlacement(cabinet.data);
    } else {
      console.error('[ШКАФ-ДИАГНОСТИКА] У шкафа "' + (cabinet.name || '?') + '" нет данных (cabinet.data пуст). Не должно быть — проверьте createCabinetItem.');
    }
  });

  return el;
}

function loadCabinetFromData(cabinetData) {
  // Remove existing furniture
  if (furniture && furniture.group) {
    scene.remove(furniture.group);
    // Clean up
    furniture.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  // Load new furniture
  const params = {
    sectionSize: {
      x: 600,
      y: 2400,
      z: 600,
    },
    variables: {
      vysota_cokolya: 100,
      glubina_cokolya: 100,
      otstup_paza: 0,
    },
    groups: {
      g0: { thickness: 16 },
      hdf1: { thickness: 3 },
    },
  };

  furniture = new Furniture(cabinetData, params);
  
  // Position in center of room for viewing
  const roomWorldPos = new THREE.Vector3();
  room.group.getWorldPosition(roomWorldPos);
  furniture.group.position.set(
    room.width / 2,  // Center X
    0,                // On floor
    room.depth / 2   // Center Z
  );
  
  scene.add(furniture.group);

  // Update camera to view the furniture
  if (controls && room) {
    // Calculate furniture center
    const furnitureBbox = new THREE.Box3().setFromObject(furniture.group);
    const furnitureCenter = furnitureBbox.getCenter(new THREE.Vector3());
    
    // Set camera target to furniture center
    controls.target.copy(furnitureCenter);
    
    // Position camera to view furniture
    const size = furnitureBbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2; // Distance to view entire furniture
    
    camera.position.set(
      furnitureCenter.x + distance * 0.7,
      furnitureCenter.y + distance * 0.5,
      furnitureCenter.z + distance * 0.7
    );
    
    controls.update();
  }

  console.log('Cabinet loaded from modal');
  console.log('Furniture bbox:', new THREE.Box3().setFromObject(furniture.group));
  console.log('Furniture position:', furniture.group.position);
}

// Извлекает sectionSize (x,y,z в мм) из данных мебели.
// Clodis JSON использует выражения "s:x","s:y","s:z" — фактические размеры могут быть в catalogItem.params
function extractSectionSizeFromFurnitureData(furnitureData) {
  const def = { x: 600, y: 2400, z: 600 };
  if (!furnitureData) return def;

  // 0. Явный sectionSize, сохранённый при загрузке каталога (кастомные размеры модуля)
  const precomputed = furnitureData.sectionSize;
  if (precomputed && typeof precomputed.x === 'number' && precomputed.x > 0) {
    return { x: precomputed.x, y: precomputed.y || def.y, z: precomputed.z || def.z };
  }

  const item = furnitureData.catalogItem || furnitureData;
  const readJson = window.__cldReadClodisJSON || ((o) => o?.clodisJSON);
  const clodis = readJson(furnitureData) || (Array.isArray(furnitureData) ? furnitureData : null);
  const root = Array.isArray(clodis) ? clodis[0] : (clodis || furnitureData);

  // 0. params.variants[0] — размеры могут быть в варианте
  const variant = item.params?.variants?.[0];
  if (variant && (typeof variant.width === 'number' || typeof variant.x === 'number')) {
    return {
      x: typeof variant.x === 'number' ? variant.x : (variant.width || def.x),
      y: typeof variant.y === 'number' ? variant.y : (variant.height || def.y),
      z: typeof variant.z === 'number' ? variant.z : (variant.depth || def.z)
    };
  }

  // 1. Явный sectionSize в catalogItem (добавляется экспортом из data.width/height/depth)
  const ps = item.params?.sectionSize || item.sectionSize;
  if (ps && (typeof ps.x === 'number' || typeof ps.width === 'number')) {
    return {
      x: typeof ps.x === 'number' ? ps.x : (ps.width || def.x),
      y: typeof ps.y === 'number' ? ps.y : (ps.height || def.y),
      z: typeof ps.z === 'number' ? ps.z : (ps.depth || def.z)
    };
  }

  // 1b. data.width/height/depth (форма конструктора — кастомные размеры модуля)
  const dw = item.data?.width ?? item.width;
  const dh = item.data?.height ?? item.height;
  const dd = item.data?.depth ?? item.depth;
  const nw = typeof dw === 'number' ? dw : parseInt(dw, 10);
  const nh = typeof dh === 'number' ? dh : parseInt(dh, 10);
  const nd = typeof dd === 'number' ? dd : parseInt(dd, 10);
  if (Number.isFinite(nw) && nw > 0 && Number.isFinite(nh) && nh > 0 && Number.isFinite(nd) && nd > 0) {
    return { x: nw, y: nh, z: nd };
  }

  // 2. item.size (width/height/depth)
  const isz = item.size;
  if (isz && (typeof isz.x === 'number' || typeof isz.width === 'number')) {
    return {
      x: typeof isz.x === 'number' ? isz.x : (isz.width || def.x),
      y: typeof isz.y === 'number' ? isz.y : (isz.height || def.y),
      z: typeof isz.z === 'number' ? isz.z : (isz.depth || def.z)
    };
  }

  // 3. item.params (width/height/depth на верхнем уровне)
  if (item.params && (typeof item.params.width === 'number' || typeof item.params.x === 'number')) {
    return {
      x: typeof item.params.x === 'number' ? item.params.x : (item.params.width ?? def.x),
      y: typeof item.params.y === 'number' ? item.params.y : (item.params.height ?? def.y),
      z: typeof item.params.z === 'number' ? item.params.z : (item.params.depth ?? def.z)
    };
  }

  // 4. item.data?.params (data может быть объектом)
  let dp = item.data;
  if (typeof dp === 'string') { try { dp = JSON.parse(dp); } catch (_) { dp = null; } }
  if (dp && typeof dp === 'object' && dp.params) {
    const p = dp.params;
    if (p.sectionSize) {
      const s = p.sectionSize;
      return { x: s.x || def.x, y: s.y || def.y, z: s.z || def.z };
    }
    if (typeof p.width === 'number' || typeof p.x === 'number') {
      return {
        x: typeof p.x === 'number' ? p.x : (p.width ?? def.x),
        y: typeof p.y === 'number' ? p.y : (p.height ?? def.y),
        z: typeof p.z === 'number' ? p.z : (p.depth ?? def.z)
      };
    }
  }

  // 5. Числовые размеры в root section (x/y/z или width/height/depth)
  if (root && root.size) {
    const s = root.size;
    const nx = typeof s.x === 'number' ? s.x : (parseFloat(s.x) || (typeof s.width === 'number' ? s.width : NaN));
    const ny = typeof s.y === 'number' ? s.y : (parseFloat(s.y) || (typeof s.height === 'number' ? s.height : NaN));
    const nz = typeof s.z === 'number' ? s.z : (parseFloat(s.z) || (typeof s.depth === 'number' ? s.depth : NaN));
    if (Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz)) {
      return { x: nx, y: ny, z: nz };
    }
  }

  return def;
}

// Нормализует furnitureData: возвращает Clodis JSON для сборки (массив секций) и исходные данные
function getClodisDataForBuild(furnitureData) {
  if (Array.isArray(furnitureData)) return furnitureData;
  let raw = furnitureData?.clodisJSON || furnitureData;
  if (!raw) return [];
  // Корень { type: "module", children: [...] } — берём children
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.type === 'module' && Array.isArray(raw.children)) {
    return raw.children;
  }
  return Array.isArray(raw) ? raw : [raw];
}

// Start furniture placement (drag and drop)
function startFurniturePlacement(furnitureData) {
  console.log('🚀🚀🚀 startFurniturePlacement ВЫЗВАН 🚀🚀🚀');
  console.log('📦 furnitureData:', {
    type: typeof furnitureData,
    isArray: Array.isArray(furnitureData),
    length: Array.isArray(furnitureData) ? furnitureData.length : 1,
    firstItem: Array.isArray(furnitureData) ? {
      type: furnitureData[0]?.type,
      name: furnitureData[0]?.name,
      hasChildren: !!furnitureData[0]?.children,
      childrenCount: furnitureData[0]?.children?.length || 0
    } : (furnitureData ? {
      type: furnitureData.type,
      name: furnitureData.name,
      hasChildren: !!furnitureData.children,
      childrenCount: furnitureData.children?.length || 0
    } : null)
  });
  
  pendingFurnitureData = furnitureData;
  isPlacingFurniture = true;

  // Create furniture ghost (без переопределения размеров, по умолчанию)
  createFurnitureGhost(furnitureData, null);

  console.log('✅ Начато размещение мебели');
}

// Create furniture ghost for preview
function createFurnitureGhost(furnitureData, sectionSizeOverride = null) {
  if (furnitureGhost) {
    removeFurnitureGhost();
  }

  // Get furniture dimensions (bbox)
  // Получаем размеры секции из JSON или catalogItem.params (Clodis использует "s:x","s:y","s:z")
  let sectionSize = sectionSizeOverride || extractSectionSizeFromFurnitureData(furnitureData);
  if (sectionSizeOverride) {
    console.log('👻 Создание призрака с размерами секции:', sectionSize);
  }
  const clodisForBuild = getClodisDataForBuild(furnitureData);
  
  const params = {
    sectionSize: sectionSize, // Размеры в миллиметрах (Clodis формат)
    variables: { vysota_cokolya: 100, glubina_cokolya: 100, otstup_paza: 0 },
    groups: { g0: { thickness: 16 }, hdf1: { thickness: 3 } },
  };

  // Передаём одну секцию (как в конструкторе) — чтобы показывать реальную модель, а не куб
  let ghostDataForBuild = clodisForBuild;
  if (Array.isArray(clodisForBuild) && clodisForBuild.length === 1 && clodisForBuild[0]?.type === 'section') {
    ghostDataForBuild = clodisForBuild[0];
  } else if (Array.isArray(clodisForBuild) && clodisForBuild.length > 0 && clodisForBuild[0]?.type === 'module' && clodisForBuild[0]?.children?.length > 0) {
    ghostDataForBuild = clodisForBuild[0].children[0];
  }

  console.log('👻 Создание призрака мебели:', {
    sectionSize: sectionSize,
    clodisLength: Array.isArray(clodisForBuild) ? clodisForBuild.length : 1,
    hasChildren: (ghostDataForBuild?.children?.length ?? 0)
  });

  // Create temporary furniture to get bbox (используем ghostDataForBuild — одна секция, как в конструкторе)
  const tempFurniture = new Furniture(ghostDataForBuild, params);
  
  // ВАЖНО: Для Clodis мебели bbox уже вычислен в конструкторе Furniture (без setupPivot)
  // Используем tempFurniture.bbox напрямую - он уже правильный
  // Для legacy мебели setupPivot был вызван, и bbox.min должен быть (0,0,0)
  const bbox = tempFurniture.bbox;
  const size = bbox.max.clone().sub(bbox.min);
  
  console.log('👻 Призрак: размеры мебели (из tempFurniture.bbox):', {
    min: bbox.min.clone(),
    max: bbox.max.clone(),
    size: size,
    'size в мм': {
      x: size.x,
      y: size.y,
      z: size.z
    },
    'sectionSize (ожидаемые размеры)': sectionSize
  });
  
  // Проверяем, что размеры соответствуют ожидаемым (sectionSize)
  const sizeMatch = Math.abs(size.x - sectionSize.x) < 10 && 
                    Math.abs(size.y - sectionSize.y) < 10 && 
                    Math.abs(size.z - sectionSize.z) < 10;
  if (!sizeMatch) {
    console.warn('⚠️ Размеры bbox не соответствуют sectionSize!', {
      bboxSize: size,
      expectedSize: sectionSize,
      difference: {
        x: size.x - sectionSize.x,
        y: size.y - sectionSize.y,
        z: size.z - sectionSize.z
      }
    });
  }

  // Clean up temp furniture
  tempFurniture.group.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });

  // Create ghost as a group so we can add pivot marker
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'FurnitureGhost';
  ghostGroup.visible = false;
  ghostGroup.userData.isGhost = true;

  // Create box as ghost with correct dimensions
  const ghostGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0x00aaff, // Blue color (like IKEA)
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    emissive: 0x0066cc,
    emissiveIntensity: 0.3,
  });

  const ghostMesh = new THREE.Mesh(ghostGeometry, ghostMaterial);
  // BoxGeometry создает меш с центром в (0,0,0)
  // Нам нужно сместить меш так, чтобы его нижний левый задний угол (bbox.min призрака) был в (0,0,0) группы ghostGroup
  // Это соответствует pivot мебели (back-left-bottom = 0,0,0)
  // BoxGeometry имеет центр в (0,0,0), поэтому чтобы нижний левый задний угол был в (0,0,0):
  // mesh.position = size/2
  // Это стандартная логика для мебели с pivot в (0,0,0)
  ghostMesh.position.set(size.x / 2, size.y / 2, size.z / 2);
  console.log('👻 Призрак: смещение меша для pivot в (0,0,0):', {
    bboxMin: bbox.min.clone(),
    bboxMax: bbox.max.clone(),
    size: size,
    meshPosition: ghostMesh.position.clone()
  });
  ghostGroup.add(ghostMesh);

  // Add red sphere at pivot point (origin of ghost group)
  // Pivot находится в (0,0,0) группы ghostGroup, что соответствует back-left-bottom мебели
  const pivotGeometry = new THREE.SphereGeometry(50, 16, 16); // 50mm = 5cm radius (in millimeters)
  const pivotMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, // Red color
    transparent: true,
    opacity: 0.9,
  });
  const pivotMarker = new THREE.Mesh(pivotGeometry, pivotMaterial);
  pivotMarker.position.set(0, 0, 0); // Pivot is at origin (back-left-bottom)
  pivotMarker.name = 'PivotMarker';
  ghostGroup.add(pivotMarker);

  furnitureGhost = ghostGroup;
  furnitureGhost.userData.currentSectionSize = sectionSize; // Сохраняем текущие размеры
  furnitureGhost.userData.originalFurnitureData = furnitureData; // Сохраняем оригинальные данные
  scene.add(furnitureGhost);

  console.log('👻 Призрак мебели создан:', size);
  console.log('🔴 Красная точка pivot добавлена в призраке');
  if (sectionSizeOverride) {
    console.log('📐 Призрак масштабирован под размеры секции:', sectionSize);
  }
}

// Remove furniture ghost
function removeFurnitureGhost() {
  if (furnitureGhost) {
    scene.remove(furnitureGhost);
    if (furnitureGhost.geometry) furnitureGhost.geometry.dispose();
    if (furnitureGhost.material) {
      if (Array.isArray(furnitureGhost.material)) {
        furnitureGhost.material.forEach(m => m.dispose());
      } else {
        furnitureGhost.material.dispose();
      }
    }
    furnitureGhost = null;
  }
}

// Update furniture ghost position
function updateFurnitureGhostPosition(event) {
  const canvas = renderer.domElement;
  const rect = canvas.getBoundingClientRect();

  // Mouse coordinates in normalized coordinates (-1 to +1)
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Raycasting
  raycaster.setFromCamera(mouse, camera);

  // Get wall planes from room
  if (!room || !room.wallPlanes) return;

  // Only check visible walls (walls that are currently visible)
  const visiblePlanes = room.wallPlanes.filter(p => {
    if (p.visible === false) return false;
    // Check if the actual wall mesh is visible
    const wallName = p.userData.wallName;
    if (room.walls && room.walls[wallName]) {
      return room.walls[wallName].visible !== false;
    }
    return true;
  });

  const intersects = raycaster.intersectObjects(visiblePlanes);
  const intersect = getClosestFacingWallIntersection(raycaster, intersects);

  if (intersect) {
    const wallPlane = intersect.object;
    const wallName = wallPlane.userData.wallName;

    // Check if wall is actually visible - строгая проверка
    if (!room.walls || !room.walls[wallName]) {
      // Стена не найдена
      if (furnitureGhost) {
        furnitureGhost.visible = false;
      }
      if (room && room.resetWallHighlight) {
        room.resetWallHighlight();
      }
      if (room && room.hideAllMarkers) {
        room.hideAllMarkers();
      }
      ghostWall = null;
      ghostPosition = null;
      return;
    }
    
    const wall = room.walls[wallName];
    if (wall.visible === false || !wall.visible) {
      // Стена скрыта - не размещаем мебель
      console.warn('⚠️ Стена скрыта:', wallName);
      if (furnitureGhost) {
        furnitureGhost.visible = false;
      }
      if (room && room.resetWallHighlight) {
        room.resetWallHighlight();
      }
      if (room && room.hideAllMarkers) {
        room.hideAllMarkers();
      }
      ghostWall = null;
      ghostPosition = null;
      return;
    }

    // Highlight the wall
    if (room && room.highlightWall) {
      room.highlightWall(wallName);
    }

    const normal = wallPlane.userData.normal
      ? wallPlane.userData.normal.clone()
      : new THREE.Vector3(0, 0, 1);

    // Get furniture bbox - для GLB и сохраненных моделей используем сохраненные размеры
    let bbox, extent;
    if (pendingFurnitureData && (pendingFurnitureData.type === 'glb' || pendingFurnitureData.type === 'savedModel')) {
      // Для GLB и сохраненных моделей используем сохраненные размеры
      bbox = pendingFurnitureData.bbox || new THREE.Box3();
      extent = pendingFurnitureData.size || new THREE.Vector3();
    } else {
      // Для обычной мебели создаем временный объект
    const params = {
      sectionSize: { x: 600, y: 2400, z: 600 },
      variables: { vysota_cokolya: 100, glubina_cokolya: 100, otstup_paza: 0 },
      groups: { g0: { thickness: 16 }, hdf1: { thickness: 3 } },
    };
    const tempFurniture = new Furniture(pendingFurnitureData, params);
      bbox = tempFurniture.bbox;
      extent = bbox.max.clone().sub(bbox.min);

    // Clean up temp furniture
    tempFurniture.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    }

    // Clodis logic according to ЛОГИКА_ПРИВЯЗКИ_К_СТЕНАМ.md
    const gap = 0.002; // 2mm gap from wall (0.002m)
    const inset = 0.05; // 5cm inset from room edges (0.05m)
    const intersectionPoint = intersect.point.clone(); // World coordinates

    // Get room world position
    const roomWorldPos = new THREE.Vector3();
    room.group.getWorldPosition(roomWorldPos);

    // Convert intersection point to room local coordinates
    const localIntersectionPoint = intersectionPoint.clone().sub(roomWorldPos);

    // Clodis formula: position = wall_position + gap + size/2
    // This places the CENTER of the object at (wall_position + gap + size/2)
    // Since pivot is at back-left-bottom, the back edge will be at (wall_position + gap)
    // Pivot is at back-left-bottom, so bbox.min should be ~(0,0,0) after setupPivot
    let finalX = localIntersectionPoint.x;
    let finalZ = localIntersectionPoint.z;
    let rotationY = 0;

    switch (wallName) {
      case 'front':
        // Front wall: local z = 0, normal (0,0,1)
        // Formula: position.z = 0 + gap + extent.z/2 = gap + extent.z/2
        // Back edge will be at: position.z - extent.z/2 = gap (correct!)
        rotationY = 0;
        finalX = THREE.MathUtils.clamp(
          localIntersectionPoint.x,
          inset + extent.x / 2,
          room.width - inset - extent.x / 2
        );
        finalZ = gap + extent.z / 2;
        break;

      case 'back':
        // Back wall: local z = depth, normal (0,0,-1)
        // Formula: position.z = room.depth - gap - extent.z/2
        // Back edge will be at: position.z - extent.z/2 = room.depth - gap (correct!)
        rotationY = Math.PI;
        finalX = THREE.MathUtils.clamp(
          localIntersectionPoint.x,
          inset + extent.x / 2,
          room.width - inset - extent.x / 2
        );
        finalZ = room.depth - gap - extent.z / 2;
        break;

      case 'left':
        // Left wall: local x = 0, normal (1,0,0)
        // After rotation PI/2: depth extends along X, width extends along Z
        // Formula: position.x = 0 + gap + extent.x/2 = gap + extent.x/2
        // Back edge will be at: position.x - extent.x/2 = gap (correct!)
        rotationY = Math.PI / 2;
        finalX = gap + extent.x / 2;
        finalZ = THREE.MathUtils.clamp(
          localIntersectionPoint.z,
          inset + extent.x / 2, // Original width (x dimension) now extends along Z
          room.depth - inset - extent.x / 2
        );
        break;

      case 'right':
        // Right wall: local x = width, normal (-1,0,0)
        // After rotation -PI/2: depth extends along X, width extends along Z
        // Formula: position.x = room.width - gap - extent.x/2
        // Back edge will be at: position.x - extent.x/2 = room.width - gap (correct!)
        rotationY = -Math.PI / 2;
        finalX = room.width - gap - extent.x / 2;
        finalZ = THREE.MathUtils.clamp(
          localIntersectionPoint.z,
          inset + extent.x / 2, // Original width (x dimension) now extends along Z
          room.depth - inset - extent.x / 2
        );
        break;
    }

    // Calculate marker position (at inner edge of wall, floor level)
    // First, calculate Y position for floor
    // After setupPivot, bbox.min.y should be 0 (pivot at back-left-bottom)
    // So furnitureY should be at floor level (roomWorldPos.y, which is 0)
    const floorWorldY = roomWorldPos.y; // Floor is at y=0 in room local, room.group.position.y = 0
    const furnitureY = floorWorldY; // Since bbox.min.y = 0 after setupPivot, pivot is at floor level

    // Calculate pivot position (back-left-bottom) first
    // Then place marker at pivot position (not at wall edge)
    let markerX, markerZ;

    switch (wallName) {
      case 'front':
        // Pivot position: (x, 0, gap) - pivot is at gap distance from front wall
        finalX = finalX; // Already clamped
        finalZ = gap;
        // Marker should be at pivot position (lower-left-back corner of furniture)
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'back':
        // Pivot position: (x, 0, depth - gap) - pivot is at gap distance from back wall
        finalX = finalX; // Already clamped
        finalZ = room.depth - gap;
        // Marker should be at pivot position
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'left':
        // Pivot position: (gap, 0, z) - pivot is at gap distance from left wall
        finalX = gap;
        finalZ = finalZ; // Already clamped
        // Marker should be at pivot position
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'right':
        // Pivot position: (width - gap, 0, z) - pivot is at gap distance from right wall
        finalX = room.width - gap;
        finalZ = finalZ; // Already clamped
        // Marker should be at pivot position
        markerX = finalX;
        markerZ = finalZ;
        break;
    }

    // Update marker visibility and position - marker should be at pivot position
    if (room && room.updateWallMarker) {
      room.updateWallMarker(wallName, markerX, markerZ);
      // Hide other markers
      Object.keys(room.wallMarkers || {}).forEach(key => {
        if (key !== wallName && room.wallMarkers[key]) {
          room.wallMarkers[key].visible = false;
        }
      });
    }

    // World position with pivot at marker position (where yellow marker is)
    let worldPos = new THREE.Vector3(
      finalX + roomWorldPos.x,
      furnitureY,
      finalZ + roomWorldPos.z
    );

    // Привязка к зоне (двойной модуль): призрак внутри секции — пивот на сплошной линии
    let zoneSize = null; // { x: partSize, y, z } для масштабирования модуля
    const inSectionGhost = sectionGhost && sectionGhost.visible && pendingSectionData &&
      worldPos.x >= sectionGhost.position.x && worldPos.x <= sectionGhost.position.x + pendingSectionData.width &&
      worldPos.y >= sectionGhost.position.y && worldPos.y <= sectionGhost.position.y + pendingSectionData.height &&
      worldPos.z >= sectionGhost.position.z && worldPos.z <= sectionGhost.position.z + pendingSectionData.depth;
    const sectionAtPosition = findSectionAtPosition(worldPos);
    const division = inSectionGhost ? sectionGhostDivision : (sectionAtPosition ? sectionAtPosition.division : null);
    if (division && (inSectionGhost || sectionAtPosition)) {
      const resolvedWallName = inSectionGhost
        ? sectionGhostWall
        : (sectionAtPosition.wallName || sectionAtPosition.division?.wallName || null);
      const source = inSectionGhost
        ? { wallName: resolvedWallName, pos: sectionGhost.position, size: pendingSectionData }
        : { wallName: resolvedWallName, pos: sectionAtPosition.group.position, size: sectionAtPosition.size };
      const hitCoord = (source.wallName === 'front' || source.wallName === 'back') ? worldPos.x : worldPos.z;
      const snap = snapToZoneDoubleModule(hitCoord, division, source.wallName);
      if (snap) {
        if (source.wallName === 'front' || source.wallName === 'back') {
          finalX = snap.pivotCoord - roomWorldPos.x;
        } else {
          finalZ = snap.pivotCoord - roomWorldPos.z;
        }
        worldPos = new THREE.Vector3(
          finalX + roomWorldPos.x, furnitureY, finalZ + roomWorldPos.z
        );
        const srcHeight = (source.size && (source.size.y ?? source.size.height)) || null;
        const srcDepth = (source.size && (source.size.z ?? source.size.depth)) || null;
        zoneSize = {
          x: snap.moduleWidth,
          y: srcHeight,
          z: srcDepth
        };

        // ⭐ КРИТИЧЕСКО: сохраняем размеры зоны в pendingFurnitureData,
        // чтобы сборка модуля из JSON (через @section.* / s:*) гарантированно получила нужные размеры.
        if (pendingFurnitureData && zoneSize.x && zoneSize.y && zoneSize.z) {
          pendingFurnitureData.sectionSize = { x: zoneSize.x, y: zoneSize.y, z: zoneSize.z };
        }
      }
    }

    console.log('👻 Обновление позиции призрака:', {
      worldPos: worldPos,
      furnitureY: furnitureY,
      roomWorldPosY: roomWorldPos.y,
      'furnitureY должен быть на уровне пола': furnitureY === roomWorldPos.y
    });

    // Update ghost (in world coordinates)
    if (furnitureGhost) {
      furnitureGhost.position.copy(worldPos);
      furnitureGhost.rotation.y = rotationY;
      furnitureGhost.visible = true;
      furnitureGhost.userData.wall = wallName;
      furnitureGhost.userData.rotation = rotationY;
      
      // Проверяем, что призрак стоит на полу
      // Позиция призрака - это позиция его pivot (0,0,0 в локальных координатах)
      // Если pivot на полу, то позиция Y должна быть на уровне пола
      console.log('👻 Призрак установлен на позицию:', furnitureGhost.position);
      console.log('👻 Позиция Y призрака (должна быть на уровне пола):', furnitureGhost.position.y);
    }

    // Save for placement (in world coordinates)
    ghostWall = wallName;
    ghostPosition = worldPos.clone();
    
    // Масштабируем призрак: зона (двойной модуль) или вся секция
    const sizeToUse = zoneSize || (sectionAtPosition ? sectionAtPosition.size : null);
    if (sizeToUse) {
      const currentSectionSize = furnitureGhost?.userData?.currentSectionSize;
      const sizeKey = `${sizeToUse.x}_${sizeToUse.y}_${sizeToUse.z}`;
      const currentSizeKey = currentSectionSize ? `${currentSectionSize.x}_${currentSectionSize.y}_${currentSectionSize.z}` : null;
      
      if (sizeKey !== currentSizeKey) {
        console.log('📦 Призрак в зоне/секции. Размер:', zoneSize ? 'зона (двойной модуль)' : 'секция', sizeToUse);
        const originalFurnitureData = furnitureGhost?.userData?.originalFurnitureData || pendingFurnitureData;
        createFurnitureGhost(originalFurnitureData, sizeToUse);
        
        if (furnitureGhost) {
          furnitureGhost.position.copy(worldPos);
          furnitureGhost.visible = true;
          furnitureGhost.userData.rotation = rotationY;
          furnitureGhost.userData.zoneSize = zoneSize;
        }
      }
    } else {
      // Призрак НЕ в секции - используем оригинальные размеры
      const currentSectionSize = furnitureGhost?.userData?.currentSectionSize;
      const originalSize = pendingFurnitureData?.size || { x: 600, y: 2400, z: 600 };
      const currentSizeKey = currentSectionSize ? `${currentSectionSize.x}_${currentSectionSize.y}_${currentSectionSize.z}` : null;
      const originalSizeKey = `${originalSize.x}_${originalSize.y}_${originalSize.z}`;
      
      if (currentSizeKey !== originalSizeKey) {
        // Призрак был масштабирован под секцию, но теперь не в секции - возвращаем оригинальные размеры
        console.log('📦 Призрак выходит из секции. Возвращаем оригинальные размеры');
        
        const originalFurnitureData = furnitureGhost?.userData?.originalFurnitureData || pendingFurnitureData;
        createFurnitureGhost(originalFurnitureData, null); // null = использовать оригинальные размеры
        
        // Восстанавливаем позицию и видимость призрака
        if (furnitureGhost) {
          furnitureGhost.position.copy(worldPos);
          furnitureGhost.visible = true;
          furnitureGhost.userData.rotation = rotationY;
        }
      }
    }
  } else {
    if (furnitureGhost) {
      furnitureGhost.visible = false;
    }
    // Reset wall highlight when not hovering over wall
    if (room && room.resetWallHighlight) {
      room.resetWallHighlight();
    }
    // Hide all markers when not hovering over wall
    if (room && room.hideAllMarkers) {
      room.hideAllMarkers();
    }
  }
}

// Place pending furniture
function placePendingFurniture() {
  console.log('🏗️ placePendingFurniture called');
  console.log('State:', {
    pendingFurnitureData: !!pendingFurnitureData,
    ghostPosition: ghostPosition,
    ghostWall: ghostWall,
    furnitureGhost: !!furnitureGhost,
  });

  if (!pendingFurnitureData) {
    console.warn('⚠️ Нет данных для размещения мебели');
    return;
  }

  if (!ghostPosition || !ghostWall) {
    console.warn('⚠️ Нет привязки к стене (призрак не активен) — размещение отменено');
    console.warn('ghostPosition:', ghostPosition, 'ghostWall:', ghostWall);
    cancelFurniturePlacement();
    return;
  }

  // Check if wall is visible (can't place furniture on hidden wall)
  if (room && room.walls && room.walls[ghostWall]) {
    if (room.walls[ghostWall].visible === false) {
      console.warn('⚠️ Стена скрыта — размещение мебели невозможно');
      cancelFurniturePlacement();
      return;
    }
  }

  // Save rotation and zone size before removing ghost
  const rotationY = furnitureGhost ? furnitureGhost.userData.rotation || 0 : 0;
  let ghostZoneSize = furnitureGhost?.userData?.zoneSize || null; // Двойной модуль: размер зоны
  console.log('Rotation Y:', rotationY, 'Zone size (from ghost):', ghostZoneSize);

  // Если зона не сохранена в userData, пытаемся пересчитать её по позиции призрака
  if (!ghostZoneSize && ghostPosition) {
    const recomputedZone = computeZoneSizeAtPosition(ghostPosition);
    if (recomputedZone) {
      ghostZoneSize = recomputedZone;
      console.log('✅ Пересчитали размер зоны по позиции призрака:', ghostZoneSize);
    } else {
      console.log('⚠️ Не удалось пересчитать размер зоны по позиции призрака');
    }
  }

  // Remove ghost
  removeFurnitureGhost();

  // Reset state
  const furnitureData = pendingFurnitureData;
  const position = ghostPosition.clone();
  const wall = ghostWall;

  pendingFurnitureData = null;
  isPlacingFurniture = false;
  ghostWall = null;
  ghostPosition = null;

  console.log('Creating furniture with position:', position, 'rotation:', rotationY);
  console.log('Wall:', wall);
  console.log('Furniture data type:', furnitureData.type);

  // Для GLB загружаем файл, для сохраненных моделей из конструктора тоже
  if (furnitureData.type === 'glb') {
    // Загружаем реальный GLB файл
    loadGLBFileForPlacement(furnitureData.path, position, rotationY, wall, ghostZoneSize);
    return;
  }

  // Для сохраненных моделей из конструктора
  if (furnitureData.type === 'savedModel') {
    console.log('📦 Размещение сохраненной модели из конструктора');
    
    // Пересоздаем Blob URL из сохраненных данных (так как оригинальный мог быть отозван)
    try {
      const base64 = furnitureData.modelData.glb;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;
      const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
      const newUrl = URL.createObjectURL(blob);
      
      // Отзываем старый URL если он был
      if (furnitureData.url) {
        URL.revokeObjectURL(furnitureData.url);
      }
      
      loadSavedModelForPlacement(newUrl, furnitureData.modelData, position, rotationY, wall, ghostZoneSize);
      return;
    } catch (error) {
      console.error('❌ Ошибка пересоздания Blob URL для сохраненной модели:', error);
      alert('Ошибка размещения модели: ' + error.message);
      return;
    }
  }

  // Create furniture from Clodis JSON data
  // Поддержка: массив clodisJSON, объект { clodisJSON, catalogItem } или одиночная секция
  const clodisData = getClodisDataForBuild(furnitureData);
  console.log('[ШКАФ-ДИАГНОСТИКА] placeFurniture: clodisData isArray=' + Array.isArray(clodisData) + ' length=' + (Array.isArray(clodisData) ? clodisData.length : 0) + ' furnitureDataKeys=' + (furnitureData ? Object.keys(furnitureData).join(',') : 'null'));
  if (!Array.isArray(clodisData) || clodisData.length === 0) {
    console.error('[ШКАФ-ДИАГНОСТИКА] clodisData пуст — JSON не дошёл. furnitureData=', furnitureData);
    return;
  }
  
  // 1) Пытаемся жёстко привязаться к ЗОНЕ (двойной модуль) по позиции пивота.
  //    Это главный случай: модуль должен точно повторять зону (ширина от сплошной до сплошной).
  let sectionSize = null;

  // Секция под точкой размещения
  const sectionAtPositionForSize = findSectionAtPosition(position);
  if (sectionAtPositionForSize && sectionAtPositionForSize.division) {
    const division = sectionAtPositionForSize.division;
    const resolvedWallNameForSize =
      sectionAtPositionForSize.wallName || division.wallName || wall;

    // Координата вдоль разметки: X для front/back, Z для left/right
    const hitCoordForSize =
      (resolvedWallNameForSize === 'front' || resolvedWallNameForSize === 'back')
        ? position.x
        : position.z;

    const snapForSize = snapToZoneDoubleModule(
      hitCoordForSize,
      division,
      resolvedWallNameForSize
    );

    if (snapForSize) {
      const srcHeight = sectionAtPositionForSize.size.y;
      const srcDepth = sectionAtPositionForSize.size.z;
      sectionSize = {
        x: snapForSize.moduleWidth,
        y: srcHeight,
        z: srcDepth
      };

      console.log('🎯 sectionSize из division секции (двойной модуль):', {
        sectionId: sectionAtPositionForSize.id,
        wallName: resolvedWallNameForSize,
        snap: snapForSize,
        sectionSize
      });
    }
  }

  // 1.1) Если division не помог (или секция не найдена), пробуем старую логику зоны по призраку
  if (!sectionSize) {
    const zoneFromPosition = computeZoneSizeAtPosition(position);
    if (zoneFromPosition) {
      sectionSize = zoneFromPosition;
      console.log('🎯 sectionSize из зоны (computeZoneSizeAtPosition):', sectionSize);
    } else if (ghostZoneSize) {
      // Fallback: зона сохранена в userData призрака мебели
      sectionSize = ghostZoneSize;
      console.log('🎯 sectionSize из ghostZoneSize:', sectionSize);
    }
  }
  
  // 1.5) Fallback: если размеры зоны уже сохранены в данных мебели (обновлялись во время drag)
  if (!sectionSize && furnitureData && furnitureData.sectionSize) {
    sectionSize = furnitureData.sectionSize;
    console.log('🎯 sectionSize из furnitureData.sectionSize:', sectionSize);
  }
  
  // 2) Если зону не нашли — используем секцию целиком или размеры из каталога
  console.log('🔍🔍🔍 ПРОВЕРКА: Мебель размещается в секции?');
  console.log('  Позиция размещения:', position);
  console.log('  Всего созданных секций:', customSections.length);
  
  const sectionAtPosition = findSectionAtPosition(position);
  if (!sectionSize && sectionAtPosition) {
    sectionSize = {
      x: sectionAtPosition.size.x,
      y: sectionAtPosition.size.y,
      z: sectionAtPosition.size.z
    };
    position.copy(sectionAtPosition.group.position);
    
    console.log('📦📦📦 МЕБЕЛЬ РАЗМЕЩАЕТСЯ В СЕКЦИИ (без зоны)! 📦📦📦');
    console.log('  Секция:', sectionAtPosition.name, sectionAtPosition.id);
    console.log('  Позиция секции (pivot):', sectionAtPosition.group.position);
    console.log('  Новая позиция мебели (pivot совпадает с pivot секции):', position);
    console.log('  Размеры секции (будут использованы для масштабирования мебели):', sectionSize);
  }
  
  if (!sectionSize) {
    console.log('  ❌ Зона и секция не найдены, извлекаем размеры из catalogItem/JSON');
    sectionSize = extractSectionSizeFromFurnitureData(furnitureData) || { x: 600, y: 2400, z: 600 };
    console.log('📐 Размеры секции (catalogItem.params / clodisData[0].size):', sectionSize);
  }
  
  // Флаг для отката: если true, используем старую логику setupPivot
  // По умолчанию false - используем новую логику (как Clodis)
  // Установите в true для отката к старой логике
  const USE_LEGACY_SETUP_PIVOT = true; // ✅ ОТКАТ К СТАРОЙ ЛОГИКЕ
  
  const params = {
    sectionSize: sectionSize, // Размеры в миллиметрах (Clodis формат)
    variables: { vysota_cokolya: 100, glubina_cokolya: 100, otstup_paza: 0 },
    groups: { g0: { thickness: 16 }, hdf1: { thickness: 3 } },
    useLegacySetupPivot: USE_LEGACY_SETUP_PIVOT, // Флаг для отката
  };
  
  console.log('🔧🔧🔧 ПАРАМЕТРЫ СОЗДАНИЯ МЕБЕЛИ 🔧🔧🔧');
  console.log('  useLegacySetupPivot:', USE_LEGACY_SETUP_PIVOT);
  console.log('  ' + (USE_LEGACY_SETUP_PIVOT ? '⚠️ ИСПОЛЬЗУЕТСЯ СТАРАЯ ЛОГИКА (setupPivot)' : '✅ ИСПОЛЬЗУЕТСЯ НОВАЯ ЛОГИКА (как Clodis, без setupPivot)'));

  console.log('📦📦📦 Создание мебели из Clodis JSON 📦📦📦');
  console.log('📐📐📐 РАЗМЕРЫ СЕКЦИИ (ВАЖНО!):', {
    sectionSize: sectionSize,
    source: sectionAtPosition ? `СЕКЦИЯ "${sectionAtPosition.name}"` : (Array.isArray(clodisData) && clodisData[0]?.size ? 'clodisData[0].size' : (furnitureData?.size ? 'furnitureData.size' : 'default')),
    clodisDataSize: Array.isArray(clodisData) ? clodisData[0]?.size : null,
    furnitureDataSize: furnitureData?.size || null,
    isScaledToSection: !!sectionAtPosition
  });
  
  if (sectionAtPosition) {
    console.log('🎯🎯🎯 МАСШТАБИРОВАНИЕ АКТИВНО! 🎯🎯🎯');
    console.log('  Все детали мебели будут использовать размеры секции:');
    console.log('    s:x =', sectionSize.x, 'мм');
    console.log('    s:y =', sectionSize.y, 'мм');
    console.log('    s:z =', sectionSize.z, 'мм');
  }
  console.log('📦 Clodis данные:', {
    isArray: Array.isArray(clodisData),
    length: Array.isArray(clodisData) ? clodisData.length : 1,
    firstItem: Array.isArray(clodisData) ? {
      type: clodisData[0]?.type,
      name: clodisData[0]?.name,
      hasChildren: !!clodisData[0]?.children,
      childrenCount: clodisData[0]?.children?.length || 0,
      children: clodisData[0]?.children?.map(c => ({ 
        type: c.type, 
        name: c.name,
        hasSize: !!c.size,
        hasPos: !!c.pos,
        hasPivot: !!c.pivot,
        orientation: c.spec?.orientation,
        hasSpec: !!c.spec,
        specGroup: c.spec?.group,
        specType: c.spec?.type,
        specKey: c.spec?.key,
        hasChildren: !!c.children,
        childrenCount: c.children?.length || 0
      })) || []
    } : null,
    sectionSize: sectionSize
  });
  console.log('📦 ПОЛНЫЙ JSON (для проверки деталей):', JSON.stringify(clodisData, null, 2));
  
  // ДЕТАЛЬНАЯ ПРОВЕРКА ДЕТАЛЕЙ
  const rootSection = Array.isArray(clodisData) ? clodisData[0] : clodisData;
  if (rootSection?.children) {
    console.log('🔍🔍🔍 ДЕТАЛЬНАЯ ПРОВЕРКА ДЕТАЛЕЙ ПЕРЕД ПОСТРОЕНИЕМ 🔍🔍🔍');
    rootSection.children.forEach((child, index) => {
      console.log(`  [${index + 1}] Деталь "${child.name}" (${child.type}):`, {
        type: child.type,
        name: child.name,
        size: child.size,
        pos: child.pos,
        pivot: child.pivot,
        spec: child.spec ? {
          orientation: child.spec.orientation,
          group: child.spec.group,
          type: child.spec.type,
          key: child.spec.key,
          material: child.spec.material ? {
            group: child.spec.material.group,
            key: child.spec.material.key,
            thickness_lock: child.spec.material.thickness_lock
          } : null
        } : 'НЕТ SPEC!'
      });
    });
  } else {
    console.error('❌❌❌ В ROOT SECTION НЕТ CHILDREN! ❌❌❌');
  }
  console.log('📦 Параметры:', params);

  // ⭐ Конструктор передаёт ОДНУ секцию (clodisJSON[0]), не массив — чтобы сборка совпадала с превью
  let dataForBuild = clodisData;
  if (Array.isArray(clodisData) && clodisData.length === 1 && clodisData[0]?.type === 'section') {
    dataForBuild = clodisData[0];
    console.log('📦 Передаём одну секцию (как в конструкторе):', dataForBuild?.name, 'children:', dataForBuild?.children?.length);
  } else if (Array.isArray(clodisData) && clodisData.length > 0 && clodisData[0]?.type === 'module' && clodisData[0]?.children?.length > 0) {
    // Корень type: "module" — берём первую секцию из children
    dataForBuild = clodisData[0].children[0];
    console.log('📦 Корень module, берём первую секцию:', dataForBuild?.name, 'children:', dataForBuild?.children?.length);
  }

  furniture = new Furniture(dataForBuild, params);

  // Проверяем, что мебель создалась правильно
  console.log('[ШКАФ-ДИАГНОСТИКА] Furniture создан: meshes=' + furniture.meshes.length + ' (0=пусто, создан fallback-бокс)');
  console.log('📦 Мебель создана:', {
    meshesCount: furniture.meshes.length,
    groupChildren: furniture.group.children.length,
    bboxBefore: new THREE.Box3().setFromObject(furniture.group)
  });

  // ВАЖНО: Для Clodis-секций (новая логика) детали уже позиционированы правильно
  // Начало координат секции = back-left-bottom, детали с y=0 находятся на полу секции
  // Для старой логики (legacy) setupPivot был вызван и сместил меши
  
  // Пересчитываем bbox в локальных координатах группы
  const savedPos = furniture.group.position.clone();
  const savedRot = furniture.group.rotation.clone();
  furniture.group.position.set(0, 0, 0);
  furniture.group.rotation.set(0, 0, 0);
  furniture.group.updateMatrixWorld(true);
  
  furniture.bbox.setFromObject(furniture.group);
  const localBbox = furniture.bbox.clone(); // Клонируем локальный bbox
  
  // Принудительно подгоняем размеры модуля под sectionSize (от призрака/секции),
  // чтобы ширина/высота/глубина совпадали с заданными размерами пользователя.
  if (sectionSize && typeof sectionSize.x === 'number' && typeof sectionSize.y === 'number' && typeof sectionSize.z === 'number') {
    const currentSize = {
      x: localBbox.max.x - localBbox.min.x,
      y: localBbox.max.y - localBbox.min.y,
      z: localBbox.max.z - localBbox.min.z
    };
    const targetSize = sectionSize;
    
    if (currentSize.x > 1 && currentSize.y > 1 && currentSize.z > 1) {
      const sx = targetSize.x / currentSize.x;
      const sy = targetSize.y / currentSize.y;
      const sz = targetSize.z / currentSize.z;
      
      // Масштабируем по всем осям так, чтобы модуль встал точно в призрак/секцию
      furniture.group.scale.set(
        furniture.group.scale.x * sx,
        furniture.group.scale.y * sy,
        furniture.group.scale.z * sz
      );
      furniture.group.updateMatrixWorld(true);
      furniture.bbox.setFromObject(furniture.group);
      
      console.log('📐 Масштабируем модуль под sectionSize:', {
        currentSize,
        targetSize,
        scale: { sx, sy, sz }
      });
    }
  }
  
  // Восстанавливаем позицию и поворот
  furniture.group.position.copy(savedPos);
  furniture.group.rotation.copy(savedRot);
  furniture.group.updateMatrixWorld(true);
  
  console.log('📐📐📐 Furniture local bbox (в локальных координатах группы):', {
    min: localBbox.min,
    max: localBbox.max,
    size: localBbox.max.clone().sub(localBbox.min),
    isClodis: furniture.isClodisFurniture,
    useLegacy: furniture.useLegacySetupPivot
  });
  console.log('  bbox.min.y:', localBbox.min.y);
  console.log('  Furniture meshes:', furniture.meshes.length);
  
  if (furniture.meshes.length === 0) {
    console.error('❌ Мебель не содержит мешей! Проверьте Clodis JSON.');
    console.error('JSON данные:', JSON.stringify(furnitureData, null, 2));
  }

  // Position is already in world coordinates from ghostPosition
  const roomWorldPos = new THREE.Vector3();
  room.group.getWorldPosition(roomWorldPos);

  // Если мебель размещается в секции, позиция уже установлена (pivot совпадает с pivot секции)
  // Если нет, устанавливаем Y позицию на пол (0)
  const adjustedPosition = position.clone();
  if (!sectionAtPosition) {
    // Только если НЕ в секции, устанавливаем Y на пол
    adjustedPosition.y = roomWorldPos.y; // Пол комнаты (y=0)
    console.log('📍 Устанавливаем позицию Y на пол:', adjustedPosition.y);
  } else {
    // В секции - позиция уже правильная (совпадает с позицией секции)
    console.log('📍 Мебель в секции - позиция уже установлена (pivot совпадает с pivot секции):', adjustedPosition);
  }
  console.log('  localBbox.min.y:', localBbox.min.y);
  console.log('  Если localBbox.min.y != 0, финальная коррекция исправит это');

  furniture.group.position.copy(adjustedPosition);
  furniture.group.rotation.y = rotationY;
  
  // ВАЖНО: Добавляем мебель в сцену ПЕРЕД вычислением bbox, чтобы матрицы были обновлены
  scene.add(furniture.group);
  console.log('[ШКАФ-ДИАГНОСТИКА] Мебель добавлена в сцену. meshes=' + furniture.meshes.length + ' pos=' + adjustedPosition.x.toFixed(0) + ',' + adjustedPosition.y.toFixed(0) + ',' + adjustedPosition.z.toFixed(0));
  
  // ВАЖНО: Обновляем матрицы перед вычислением bbox
  furniture.group.updateMatrixWorld(true);
  const finalBbox = new THREE.Box3().setFromObject(furniture.group);
  
  // Show blue perimeter marker (always visible for debugging)
  showFurniturePerimeterMarker(furniture);
  
  // Also find and show root section with orange marker
  const foundSections = [];
  furniture.group.traverse(child => {
    if (child.userData && child.userData.isSection) {
      foundSections.push({
        group: child,
        name: child.userData.sectionName
      });
    }
  });
  
  // Find root section (the one that is parent of all others)
  if (foundSections.length > 0) {
    // Find root section by checking which one doesn't have a section parent
    let rootSection = null;
    for (const sectionData of foundSections) {
      let current = sectionData.group.parent;
      let hasSectionParent = false;
      while (current) {
        if (current.userData && current.userData.isSection) {
          hasSectionParent = true;
          break;
        }
        current = current.parent;
      }
      if (!hasSectionParent) {
        rootSection = sectionData;
        break;
      }
    }
    
    // If no root found by parent check, use the last one (topmost in hierarchy)
    if (!rootSection && foundSections.length > 0) {
      rootSection = foundSections[foundSections.length - 1];
    }
    
    if (rootSection) {
      showSectionPerimeterMarker(rootSection.group, rootSection.name, true); // true = isRootSection (orange)
    }
  }
  
  console.log('📐📐📐 Финальная позиция мебели:');
  console.log('  Позиция группы (это позиция pivot, 0,0,0 в локальных координатах):', furniture.group.position);
  console.log('  Желтый маркер должен быть на этой же позиции');
  console.log('  World bbox:', finalBbox);
  console.log('  World bbox.min.y (должен быть на уровне пола, ~0):', finalBbox.min.y);
  console.log('  World bbox.min (зеленый маркер):', finalBbox.min);
  console.log('  World bbox.max:', finalBbox.max);
  console.log('  Зеленый маркер (bbox.min) должен совпадать с желтым маркером (pivot)');
  
  // КРИТИЧЕСКИ ВАЖНО: Пол комнаты находится на Y=0 в мировых координатах
  // Зеленая точка (bbox.min) ДОЛЖНА быть на полу (y=0)
  // Если нет - ПРИНУДИТЕЛЬНО корректируем позицию Y
  const floorY = 0; // Пол комнаты в мировых координатах
  const tolerance = 1; // 1mm погрешность (in millimeters)
  let bboxMinY = finalBbox.min.y;
  let distanceFromFloor = Math.abs(bboxMinY - floorY);
  
  console.log('🔍🔍🔍 КРИТИЧЕСКАЯ ПРОВЕРКА: Зеленая точка должна совпадать с желтой (пол)');
  console.log('  bbox.min.y (зеленая точка):', bboxMinY);
  console.log('  floorY (пол, желтый маркер):', floorY);
  console.log('  distanceFromFloor:', distanceFromFloor);
  console.log('  tolerance:', tolerance);
  console.log('  Нужна коррекция?', distanceFromFloor > tolerance);
  
  // ВСЕГДА корректируем, если зеленая точка не на полу
  if (distanceFromFloor > tolerance) {
    console.warn('⚠️⚠️⚠️ ЗЕЛЕНАЯ ТОЧКА НЕ НА ПОЛУ! ПРИНУДИТЕЛЬНАЯ КОРРЕКЦИЯ!');
    console.warn('  bbox.min.y =', bboxMinY, '(должно быть', floorY, ')');
    const correction = floorY - bboxMinY; // Смещаем на разницу: если bbox.min.y = -0.05, то correction = 0.05
    console.warn('  ⚠️ Корректировка Y позиции на:', correction);
    console.warn('  ⚠️ Старая позиция Y группы:', furniture.group.position.y);
    
    // ПРИМЕНЯЕМ КОРРЕКЦИЮ
    furniture.group.position.y += correction;
    
    console.warn('  ⚠️ Новая позиция Y группы:', furniture.group.position.y);
    
    // ОБЯЗАТЕЛЬНО обновляем матрицы и пересчитываем bbox после коррекции
    furniture.group.updateMatrixWorld(true);
    const correctedBbox = new THREE.Box3().setFromObject(furniture.group);
    bboxMinY = correctedBbox.min.y;
    distanceFromFloor = Math.abs(bboxMinY - floorY);
    
    console.log('  ✅✅✅ bbox.min.y ПОСЛЕ коррекции:', bboxMinY);
    console.log('  ✅✅✅ Расстояние от пола ПОСЛЕ коррекции:', distanceFromFloor);
    
    if (distanceFromFloor > tolerance) {
      console.error('❌❌❌ КРИТИЧЕСКАЯ ОШИБКА: Коррекция не помогла!');
      console.error('  bbox.min.y все еще =', bboxMinY, '(должно быть', floorY, ')');
      console.error('  Это означает серьезную проблему в структуре мебели или setupPivot');
    } else {
      console.log('✅✅✅✅✅ КОРРЕКЦИЯ УСПЕШНА! ЗЕЛЕНАЯ ТОЧКА ТЕПЕРЬ НА ПОЛУ! ✅✅✅✅✅');
      console.log('  Зеленая точка совпадает с желтым маркером (пол)');
    }
  } else {
    console.log('✅✅✅ Зеленая точка (bbox.min.y) УЖЕ на полу! (distanceFromFloor =', distanceFromFloor, '<=', tolerance, ')');
    console.log('  Зеленая точка совпадает с желтым маркером (пол)');
  }

  // Reset wall highlight after placement
  if (room && room.resetWallHighlight) {
    room.resetWallHighlight();
  }

  console.log('✅ Мебель успешно размещена');
  console.log('Furniture position:', furniture.group.position);
  console.log('Furniture rotation:', furniture.group.rotation.y);
}

// Cancel furniture placement
function cancelFurniturePlacement() {
  if (furnitureGhost) {
    removeFurnitureGhost();
  }
  // Reset wall highlight
  if (room && room.resetWallHighlight) {
    room.resetWallHighlight();
  }
  pendingFurnitureData = null;
  isPlacingFurniture = false;
  ghostWall = null;
  ghostPosition = null;
  console.log('❌ Размещение мебели отменено');
}

// Отменить размещение секции
function cancelSectionPlacement() {
  if (sectionGhost) {
    removeSectionGhost();
  }
  // Reset wall highlight
  if (room && room.resetWallHighlight) {
    room.resetWallHighlight();
  }
  pendingSectionData = null;
  isPlacingSection = false;
  sectionGhostWall = null;
  sectionGhostPosition = null;
  console.log('❌ Размещение секции отменено');
}

// Show blue perimeter marker around selected furniture
function showFurniturePerimeterMarker(furniture) {
  // В продакшене вспомогательная синяя рамка вокруг мебели не нужна
  // Поэтому просто выходим, не создавая маркер
  return;

  // Remove existing marker if any
  if (furniturePerimeterMarker) {
    hideFurniturePerimeterMarker();
  }

  if (!furniture || !furniture.group) return;

  // Get furniture bbox (computed before markers are added, so it's correct)
  const bbox = furniture.bbox;
  const size = bbox.max.clone().sub(bbox.min);
  const center = bbox.getCenter(new THREE.Vector3());
  
  console.log('🔵 Синий маркер: furniture.bbox:', {
    min: bbox.min,
    max: bbox.max,
    size: size,
    center: center,
    'size (в мм)': {
      x: size.x,
      y: size.y,
      z: size.z
    }
  });

  // Create edges geometry for perimeter using exact bbox dimensions
  const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

  // Create blue material
  const markerMaterial = new THREE.LineBasicMaterial({
    color: 0x0000ff, // Blue color
    linewidth: 3,
    transparent: true,
    opacity: 0.8,
  });

  // Create line segments
  furniturePerimeterMarker = new THREE.LineSegments(edgesGeometry, markerMaterial);
  furniturePerimeterMarker.name = 'FurniturePerimeterMarker';

  // Position marker: BoxGeometry is centered at (0,0,0), so we need to shift it
  // to match bbox: position = bbox.min + size/2 = center
  // This ensures the marker exactly matches the furniture bbox
  furniturePerimeterMarker.position.copy(center);

  // Add to furniture group so it moves with furniture
  furniture.group.add(furniturePerimeterMarker);

  // Show delete button
  showDeleteButton();

  console.log('🔵 Синий маркер по периметру добавлен');
  console.log('  BBox min:', bbox.min);
  console.log('  BBox max:', bbox.max);
  console.log('  Size:', size);
  console.log('  Center:', center);
}

// Hide furniture perimeter marker
function hideFurniturePerimeterMarker() {
  if (furniturePerimeterMarker) {
    if (furniturePerimeterMarker.parent) {
      furniturePerimeterMarker.parent.remove(furniturePerimeterMarker);
    } else {
      scene.remove(furniturePerimeterMarker);
    }
    if (furniturePerimeterMarker.geometry) furniturePerimeterMarker.geometry.dispose();
    if (furniturePerimeterMarker.material) furniturePerimeterMarker.material.dispose();
    furniturePerimeterMarker = null;
  }

  // Hide delete button
  hideDeleteButton();
}

// Get marker color for section by name
function getSectionMarkerColor(sectionName) {
  const colorMap = {
    'Секция общая': 0xff0000, // Red
    'Корпус': 0x0000ff, // Blue
    // Add more sections here as needed
  };
  
  return colorMap[sectionName] || 0x00ff00; // Default: green for unknown sections
}

// Get marker color name for logging
function getSectionColorName(sectionName) {
  const colorMap = {
    'Секция общая': 'красный',
    'Корпус': 'синий',
  };
  
  return colorMap[sectionName] || 'зеленый';
}

// Show section perimeter marker with appropriate color
function showSectionPerimeterMarker(sectionGroup, sectionName = null, isRootSection = false) {
  // Вспомогательный оранжевый периметр секции выключен для продакшена
  return;

  if (!sectionGroup) return;

  // Remove existing marker for this section if any
  if (sectionMarkers[sectionGroup]) {
    hideSectionMarker(sectionGroup);
  }

  // Get section name
  const name = sectionName || sectionGroup.userData?.sectionName || 'секция';
  
  // Root section (parent of furniture) should be orange
  let color, colorName;
  if (isRootSection) {
    color = 0xff8800; // Orange color for root section
    colorName = 'оранжевый';
  } else {
    color = getSectionMarkerColor(name);
    colorName = getSectionColorName(name);
  }

  // Use original size from userData if available, otherwise calculate from bbox
  let size;
  
  if (sectionGroup.userData.originalSize) {
    // Use original size (from Clodis params) - this is the correct size
    size = sectionGroup.userData.originalSize;
    console.log('========================================');
    console.log(`🟠 ОРАНЖЕВЫЙ МАРКЕР СЕКЦИИ "${name}" (Section Perimeter)`);
    console.log('========================================');
    console.log('originalSize (из userData):', size);
    console.log('Размеры (в мм):', {
      x: size.x,
      y: size.y,
      z: size.z
    });
    console.log('========================================');
  } else {
    // Fallback: calculate from bbox (may be larger if children extend beyond)
    const worldBbox = new THREE.Box3().setFromObject(sectionGroup);
    size = worldBbox.getSize(new THREE.Vector3());
    console.log('========================================');
    console.log(`🟠 ОРАНЖЕВЫЙ МАРКЕР СЕКЦИИ "${name}" (из bbox, fallback)`);
    console.log('========================================');
    console.log('size (из bbox):', size);
    console.log('Размеры (в мм):', {
      x: size.x,
      y: size.y,
      z: size.z
    });
    console.log('========================================');
  }

  // Calculate center from bbox (more reliable than using position+pivot)
  const worldBbox = new THREE.Box3().setFromObject(sectionGroup);
  const worldCenter = worldBbox.getCenter(new THREE.Vector3());
  const localCenter = new THREE.Vector3();
  sectionGroup.worldToLocal(localCenter.copy(worldCenter));

  console.log('  Используемый размер для периметра:', {
    x: size.x.toFixed(3) + 'м',
    y: size.y.toFixed(3) + 'м',
    z: size.z.toFixed(3) + 'м'
  });

  // Create edges geometry for perimeter
  const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

  // Create material with section-specific color
  const markerMaterial = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 3,
    transparent: true,
    opacity: 0.9,
  });

  // Create line segments
  const marker = new THREE.LineSegments(edgesGeometry, markerMaterial);
  marker.name = `SectionMarker_${name}`;

  // Position marker at section center (in section local space)
  marker.position.copy(localCenter);

  // Add to section group so it moves with section
  sectionGroup.add(marker);

  // Store marker reference
  sectionMarkers[sectionGroup] = marker;

  console.log(`🎨 ${colorName.charAt(0).toUpperCase() + colorName.slice(1)} маркер по периметру секции "${name}" добавлен`);
}

// Hide section marker for specific section
function hideSectionMarker(sectionGroup) {
  if (sectionMarkers[sectionGroup]) {
    const marker = sectionMarkers[sectionGroup];
    if (marker.parent) {
      marker.parent.remove(marker);
    } else {
      scene.remove(marker);
    }
    if (marker.geometry) marker.geometry.dispose();
    if (marker.material) marker.material.dispose();
    delete sectionMarkers[sectionGroup];
  }
}

// Hide all section markers
function hideAllSectionMarkers() {
  Object.keys(sectionMarkers).forEach(sectionGroup => {
    hideSectionMarker(sectionGroup);
  });
  sectionMarkers = {};
  selectedSections = [];
}

// Show delete button
function showDeleteButton() {
  const actionsDiv = document.getElementById('furniture-actions');
  if (actionsDiv) {
    actionsDiv.style.display = 'block';
  }
}

// Hide delete button
function hideDeleteButton() {
  const actionsDiv = document.getElementById('furniture-actions');
  if (actionsDiv) {
    actionsDiv.style.display = 'none';
  }
}

// Delete selected furniture
function deleteSelectedFurniture() {
  if (!selectedFurniture || !selectedFurniture.group) {
    console.warn('Нет выделенной мебели для удаления');
    return;
  }

  console.log('🗑️ Удаление мебели');

  // Remove from scene
  scene.remove(selectedFurniture.group);

  // Clean up geometry and materials
  selectedFurniture.group.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });

  // Hide marker and button
  hideFurniturePerimeterMarker();

  // Clear selection
  selectedFurniture = null;
  furniture = null;

  console.log('✅ Мебель удалена');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initCabinetModal();
    initFurnitureActions();
    initEditSectionModal();
    buildRoomMenu(); // Создаем динамическое меню на основе сохраненных каталогов
  });
} else {
  init();
  initCabinetModal();
  initFurnitureActions();
  initEditSectionModal();
  buildRoomMenu(); // Создаем динамическое меню на основе сохраненных каталогов
}

// Инициализация обработчиков модального окна редактирования секции
function initEditSectionModal() {
  const applyBtn = document.getElementById('edit-section-apply-btn');
  const cancelBtn = document.getElementById('edit-section-cancel-btn');
  
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const sectionData = window.editingSection;
      if (!sectionData) {
        console.error('❌ Нет данных редактируемой секции');
        return;
      }
      
      const wallName = sectionData.wallName || 'back';
      const offsets = {};
      let newDepth = 0;
      
      if (wallName === 'front' || wallName === 'back') {
        const offsetLeft = parseFloat(document.getElementById('section-offset-left')?.value || '0');
        const offsetRight = parseFloat(document.getElementById('section-offset-right')?.value || '0');
        const offsetBottom = parseFloat(document.getElementById('section-offset-bottom')?.value || '0');
        const offsetTop = parseFloat(document.getElementById('section-offset-top')?.value || '0');
        newDepth = parseFloat(document.getElementById('section-depth')?.value || '60');
        
        offsets.left = offsetLeft;
        offsets.right = offsetRight;
        offsets.bottom = offsetBottom;
        offsets.top = offsetTop;
      } else if (wallName === 'left' || wallName === 'right') {
        const offsetFront = parseFloat(document.getElementById('section-offset-front')?.value || '0');
        const offsetBack = parseFloat(document.getElementById('section-offset-back')?.value || '0');
        const offsetBottom = parseFloat(document.getElementById('section-offset-bottom')?.value || '0');
        const offsetTop = parseFloat(document.getElementById('section-offset-top')?.value || '0');
        newDepth = parseFloat(document.getElementById('section-depth')?.value || '60');
        
        offsets.front = offsetFront;
        offsets.back = offsetBack;
        offsets.bottom = offsetBottom;
        offsets.top = offsetTop;
      }
      
      // Обновляем размеры секции
      updateSectionSize(sectionData, offsets, newDepth);
      
      // Пересчитываем маркеры расстановки шкафов
      if (sectionData.id) {
        updateCabinetMarkersForSection(sectionData.id);
      }
      
      // Закрываем модальное окно
      const modal = document.getElementById('edit-section-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      
      window.editingSection = null;
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // Удаляем метки отступов
      removeSectionOffsetLabels();
      
      // Удаляем обработчики обновления меток
      if (window.offsetLabelsUpdateHandlers) {
        window.offsetLabelsUpdateHandlers.forEach(handler => {
          if (handler.element && handler.event) {
            handler.element.removeEventListener(handler.event, handler.callback);
          }
        });
        window.offsetLabelsUpdateHandlers = [];
      }
      
      // Восстанавливаем маркеры расстановки шкафов (на случай, если они были удалены)
      const sectionData = window.editingSection;
      if (sectionData && sectionData.id) {
        updateCabinetMarkersForSection(sectionData.id);
      }
      
      const modal = document.getElementById('edit-section-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      window.editingSection = null;
    });
  }
}

// Initialize furniture actions (delete button)
function initFurnitureActions() {
  const deleteBtn = document.getElementById('delete-furniture-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      deleteSelectedFurniture();
    });
  }
}

// ========== GLB Параметрическое управление и анимация ==========

// Изменить размеры GLB параметрически
function setGLBSize(width, height, depth) {
  if (!furniture || !furniture.group || !furniture.group.userData.isGLB) {
    console.warn('⚠️ Мебель не является GLB или не выбрана');
    return;
  }
  
  const originalSize = furniture.group.userData.originalSize;
  if (!originalSize) {
    console.warn('⚠️ Оригинальные размеры не найдены');
    return;
  }
  
  // Вычисляем масштаб
  const scaleX = width / originalSize.x;
  const scaleY = height / originalSize.y;
  const scaleZ = depth / originalSize.z;
  
  // Применяем масштаб к GLB сцене (первый дочерний элемент)
  const gltfScene = furniture.group.children.find(child => child.userData && child.userData.isGLB !== undefined) || furniture.group.children[0];
  if (gltfScene) {
    gltfScene.scale.set(scaleX, scaleY, scaleZ);
    furniture.group.userData.currentScale = { x: scaleX, y: scaleY, z: scaleZ };
    
    // Обновляем bbox
    furniture.bbox.setFromObject(furniture.group);
    
    console.log('📐 Размеры GLB изменены:', { width, height, depth });
    console.log('  Масштаб:', { scaleX, scaleY, scaleZ });
  }
}

// Воспроизвести анимацию GLB
function playGLBAnimation(animationName) {
  if (!furnitureAnimationMixer || !furnitureAnimations) {
    console.warn('⚠️ Анимации не инициализированы');
    return;
  }
  
  const action = furnitureAnimations[animationName];
  if (!action) {
    console.warn('⚠️ Анимация не найдена:', animationName);
    console.log('Доступные анимации:', Object.keys(furnitureAnimations));
    return;
  }
  
  // Останавливаем все анимации
  Object.values(furnitureAnimations).forEach(a => a.stop());
  
  // Воспроизводим выбранную
  action.reset().play();
  console.log('▶️ Воспроизведение анимации:', animationName);
}

// Остановить все анимации GLB
function stopGLBAnimations() {
  if (!furnitureAnimationMixer || !furnitureAnimations) return;
  
  Object.values(furnitureAnimations).forEach(action => action.stop());
  console.log('⏹️ Все анимации остановлены');
}

// Пауза/возобновление анимации
function pauseGLBAnimation(animationName, pause = true) {
  if (!furnitureAnimations) return;
  
  const action = furnitureAnimations[animationName];
  if (!action) return;
  
  if (pause) {
    action.paused = true;
    console.log('⏸️ Анимация на паузе:', animationName);
  } else {
    action.paused = false;
    console.log('▶️ Анимация возобновлена:', animationName);
  }
}

// Получить список анимаций
function getGLBAnimations() {
  if (!furniture || !furniture.group || !furniture.group.userData.animations) {
    return [];
  }
  return furniture.group.userData.animations;
}

// Получить текущие размеры GLB
function getGLBSize() {
  if (!furniture || !furniture.group || !furniture.group.userData.isGLB) {
    return null;
  }
  
  furniture.bbox.setFromObject(furniture.group);
  const size = furniture.bbox.max.clone().sub(furniture.bbox.min);
  return {
    width: size.x,
    height: size.y,
    depth: size.z
  };
}

// Экспорт функций в глобальную область для использования в консоли
window.setGLBSize = setGLBSize;
window.playGLBAnimation = playGLBAnimation;
window.stopGLBAnimations = stopGLBAnimations;
window.pauseGLBAnimation = pauseGLBAnimation;
window.getGLBAnimations = getGLBAnimations;
window.getGLBSize = getGLBSize;

// Добавить маркеры расстановки шкафов на секцию
function addCabinetMarkers(sectionId, sectionGroup, width, height, depth, wallName) {
  if (!sectionGroup || !scene) {
    console.warn('⚠️ addCabinetMarkers: нет sectionGroup или scene', { sectionGroup, scene });
    return;
  }
  
  console.log('🔧 addCabinetMarkers вызвана:', { sectionId, width, height, depth, wallName });
  
  // Удаляем старые маркеры, если есть
  removeCabinetMarkers(sectionId);
  
  // Диапазоны размеров шкафов (в мм)
  const TWO_DOOR_CABINET_MIN = 800; // 80 см - минимальный размер двухдверного шкафа
  const TWO_DOOR_CABINET_MAX = 1200; // 120 см - максимальный размер двухдверного шкафа
  const ONE_DOOR_CABINET_MIN = 400; // 40 см - минимальный размер однодверного шкафа
  const ONE_DOOR_CABINET_MAX = 600; // 60 см - максимальный размер однодверного шкафа
  
  const roomWorldPos = new THREE.Vector3();
  room.group.getWorldPosition(roomWorldPos);
  const sectionPos = sectionGroup.position.clone();
  
  // Определяем позицию стены и размер секции для разметки
  let wallZ, wallX;
  let sectionSize; // Размер секции для разметки (ширина для front/back, глубина для left/right)
  let sectionStart, sectionEnd; // Начало и конец секции по оси разметки
  
  if (wallName === 'front' || wallName === 'back') {
    wallZ = wallName === 'front' ? roomWorldPos.z : roomWorldPos.z + room.depth;
    sectionSize = width;
    sectionStart = sectionPos.x;
    sectionEnd = sectionPos.x + sectionSize;
  } else if (wallName === 'left' || wallName === 'right') {
    wallX = wallName === 'left' ? roomWorldPos.x : roomWorldPos.x + room.width;
    sectionSize = depth;
    sectionStart = wallName === 'left' ? sectionPos.z : sectionPos.z;
    sectionEnd = sectionStart + sectionSize;
  }

  // Временный ЗЕЛЁНЫЙ маркер: точка отсчёта секции (нижний левый дальний угол по оси разметки).
  // Помогает визуально увидеть, где находится начало координат секции для двойных модулей.
  try {
    const originMarkerGeometry = new THREE.SphereGeometry(40, 12, 12); // ~4см
    const originMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
    const originMarker = new THREE.Mesh(originMarkerGeometry, originMarkerMaterial);

    let originPos;
    if (wallName === 'front' || wallName === 'back') {
      // Ось разметки по X, начало в sectionStart, по Z берём "дальний" (к стене) угол секции.
      const backZ = sectionPos.z; // pivot секции (back-left-bottom) у стены
      originPos = new THREE.Vector3(sectionStart, sectionPos.y, backZ);
    } else {
      // Ось разметки по Z, начало в sectionStart, по X берём "дальний" (к стене) угол секции.
      const backX = wallName === 'left' ? sectionPos.x : sectionPos.x; // pivot у стены
      originPos = new THREE.Vector3(backX, sectionPos.y, sectionStart);
    }

    // Для призрака секции (sectionId === 'ghost') координаты локальные относительно sectionGroup.
    const localOriginPos = sectionId === 'ghost'
      ? originPos.clone().sub(sectionPos)
      : originPos.clone();

    originMarker.position.copy(localOriginPos);
    (sectionId === 'ghost' ? sectionGroup : scene).add(originMarker);
    markers.push(originMarker);
  } catch (e) {
    console.warn('⚠️ Не удалось создать зелёный маркер начала секции:', e);
  }
  
  // Функция для поиска оптимального деления секции
  function findOptimalDivision(size) {
    // Пробуем разные варианты деления
    // Предпочитаем двухдверные шкафы (80-120 см)
    
    let bestDivision = null;
    let bestScore = -1;
    
    // Пробуем от 2 до 20 частей
    for (let parts = 2; parts <= 20; parts++) {
      const partSize = size / parts;
      
      // Проверяем, попадает ли размер части в диапазон двухдверных шкафов
      if (partSize >= TWO_DOOR_CABINET_MIN && partSize <= TWO_DOOR_CABINET_MAX) {
        // Предпочитаем варианты, где размер ближе к середине диапазона (100 см)
        const score = 1000 - Math.abs(partSize - 1000); // 1000 мм = 100 см - идеальный размер
        if (score > bestScore) {
          bestScore = score;
          bestDivision = { parts, partSize, type: 'twoDoor' };
        }
      }
      // Если не подходит для двухдверных, пробуем однодверные
      else if (partSize >= ONE_DOOR_CABINET_MIN && partSize <= ONE_DOOR_CABINET_MAX) {
        const score = 500 - Math.abs(partSize - 500); // 500 мм = 50 см - идеальный размер
        if (score > bestScore) {
          bestScore = score;
          bestDivision = { parts, partSize, type: 'oneDoor' };
        }
      }
    }
    
    // Если не нашли оптимальное деление, используем деление на двухдверные шкафы по 100 см
    if (!bestDivision) {
      const twoDoorParts = Math.floor(size / 1000); // Делим на части по 100 см
      if (twoDoorParts > 0) {
        bestDivision = { 
          parts: twoDoorParts, 
          partSize: size / twoDoorParts, 
          type: 'twoDoor' 
        };
      } else {
        // Если секция меньше 100 см, делим на однодверные по 50 см
        const oneDoorParts = Math.floor(size / 500);
        if (oneDoorParts > 0) {
          bestDivision = { 
            parts: oneDoorParts, 
            partSize: size / oneDoorParts, 
            type: 'oneDoor' 
          };
        } else {
          // Минимальное деление на 2 части
          bestDivision = { parts: 2, partSize: size / 2, type: 'oneDoor' };
        }
      }
    }
    
    return bestDivision;
  }
  
  const division = findOptimalDivision(sectionSize);
  const markers = [];
  
  // Высота маркеров (горизонтальные линии на уровне пола)
  const markerY = sectionPos.y + 5; // На 5 мм выше пола
  
  // Маркеры выходят на 1 метр (1000 мм) вперед за секцию
  const markerExtension = 1000; // 1 метр = 1000 мм
  
  // Создаем сплошные маркеры для двухдверных шкафов
  for (let i = 0; i <= division.parts; i++) {
    const markerPosition = sectionStart + (i * division.partSize);
    
    if (markerPosition <= sectionEnd) {
      let lineStart, lineEnd;
      
      if (wallName === 'front' || wallName === 'back') {
        // Линия выходит из передней грани шкафа перпендикулярно в комнату
        const frontFaceZ = sectionPos.z + depth; // Передняя грань (фасад)
        const lineStartZ = frontFaceZ;
        const lineEndZ = wallName === 'front' ? frontFaceZ + markerExtension : frontFaceZ - markerExtension;
        
        lineStart = new THREE.Vector3(markerPosition, markerY, lineStartZ);
        lineEnd = new THREE.Vector3(markerPosition, markerY, lineEndZ);
      } else {
        // Линия выходит из передней грани шкафа перпендикулярно в комнату
        const frontFaceX = wallName === 'left' ? sectionPos.x + depth : sectionPos.x;
        const lineStartX = frontFaceX;
        const lineEndX = wallName === 'left' ? frontFaceX + markerExtension : frontFaceX - markerExtension;
        
        lineStart = new THREE.Vector3(lineStartX, markerY, markerPosition);
        lineEnd = new THREE.Vector3(lineEndX, markerY, markerPosition);
      }
      
      // Сплошная линия для двухдверных шкафов (яркий синий, поверх всего)
      const p1 = sectionId === 'ghost' ? lineStart.clone().sub(sectionPos) : lineStart;
      const p2 = sectionId === 'ghost' ? lineEnd.clone().sub(sectionPos) : lineEnd;
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x0066ff, depthTest: false, renderOrder: 100 
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.renderOrder = 100;
      (sectionId === 'ghost' ? sectionGroup : scene).add(line);
      markers.push(line);
    }
  }
  
  // Добавляем пунктирные линии посередине между сплошными (для однодверных шкафов)
  for (let i = 0; i < division.parts; i++) {
    // Позиция посередине между текущей и следующей сплошной линией
    const markerPosition = sectionStart + (i * division.partSize) + (division.partSize / 2);
    
    if (markerPosition < sectionEnd) {
      let lineStart, lineEnd;
      
      if (wallName === 'front' || wallName === 'back') {
        const frontFaceZ = sectionPos.z + depth;
        const lineStartZ = frontFaceZ;
        const lineEndZ = wallName === 'front' ? frontFaceZ + markerExtension : frontFaceZ - markerExtension;
        lineStart = new THREE.Vector3(markerPosition, markerY, lineStartZ);
        lineEnd = new THREE.Vector3(markerPosition, markerY, lineEndZ);
      } else {
        const frontFaceX = wallName === 'left' ? sectionPos.x + depth : sectionPos.x;
        const lineStartX = frontFaceX;
        const lineEndX = wallName === 'left' ? frontFaceX + markerExtension : frontFaceX - markerExtension;
        lineStart = new THREE.Vector3(lineStartX, markerY, markerPosition);
        lineEnd = new THREE.Vector3(lineEndX, markerY, markerPosition);
      }
      
      // Пунктирная линия для однодверных шкафов (яркий синий, поверх всего)
      const p1 = sectionId === 'ghost' ? lineStart.clone().sub(sectionPos) : lineStart;
      const p2 = sectionId === 'ghost' ? lineEnd.clone().sub(sectionPos) : lineEnd;
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMaterial = new THREE.LineDashedMaterial({ 
        color: 0x0066ff, dashSize: 40, gapSize: 60, depthTest: false, renderOrder: 100 
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.renderOrder = 100;
      line.computeLineDistances();
      (sectionId === 'ghost' ? sectionGroup : scene).add(line);
      markers.push(line);
    }
  }
  
  // Сохраняем маркеры
  sectionCabinetMarkers[sectionId] = markers;
  
  // Сохраняем разбиение для привязки модулей к зонам (двойной модуль = от сплошной до сплошной)
  const divisionData = { partSize: division.partSize, sectionStart, sectionEnd, wallName, parts: division.parts };
  if (sectionId === 'ghost') {
    sectionGhostDivision = divisionData;
  } else {
    const sec = customSections.find(s => s.id === sectionId);
    if (sec) sec.division = divisionData;
  }
  
  console.log('✅ Маркеры расстановки шкафов созданы для секции:', sectionId, {
    sectionSize: sectionSize,
    division: division,
    markersCount: markers.length
  });
}

// Удалить маркеры расстановки шкафов
function removeCabinetMarkers(sectionId) {
  if (!sectionCabinetMarkers[sectionId]) return;
  
  sectionCabinetMarkers[sectionId].forEach(marker => {
    if (marker && marker.parent) {
      marker.parent.remove(marker);
      if (marker.geometry) marker.geometry.dispose();
      if (marker.material) marker.material.dispose();
    }
  });
  
  delete sectionCabinetMarkers[sectionId];
}

// Обновить маркеры для секции (вызывается при изменении размера секции)
function updateCabinetMarkersForSection(sectionId) {
  // Находим секцию в массиве customSections
  const sectionData = customSections.find(s => s.id === sectionId);
  if (!sectionData || !sectionData.group) {
    console.warn('⚠️ Секция не найдена для обновления маркеров:', sectionId);
    return;
  }
  
  // Получаем текущие размеры секции из sectionData
  if (!sectionData.size) {
    console.warn('⚠️ sectionData.size не определен:', sectionData);
    return;
  }
  
  const { x: width, y: height, z: depth } = sectionData.size;
  const { wallName } = sectionData;
  
  // Проверяем, что размеры валидны
  if (!width || !height || !depth || width <= 0 || height <= 0 || depth <= 0) {
    console.warn('⚠️ Некорректные размеры секции для маркеров:', { 
      width, 
      height, 
      depth,
      sectionDataSize: sectionData.size 
    });
    return;
  }
  
  console.log('🔄 updateCabinetMarkersForSection:', {
    sectionId,
    width,
    height,
    depth,
    wallName,
    sectionDataSize: sectionData.size
  });
  
  // Пересчитываем маркеры с новыми размерами
  addCabinetMarkers(sectionId, sectionData.group, width, height, depth, wallName);
  
  console.log('✅ Маркеры обновлены для секции:', sectionId, {
    width, height, depth, wallName
  });
}

