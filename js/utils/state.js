// Global application state
// All shared variables between modules

export const state = {
  // Three.js core objects
  scene: null,
  camera: null,
  renderer: null,
  composer: null,
  cameraFillLight: null,
  composer: null,
  room: null,
  furniture: null,
  raycaster: null,
  mouse: null,
  controls: null,
  clock: null,

  // Room data
  wallPlanes: [],
  roomBounds: null,

  // Drag and drop state
  isDraggingFromCatalog: false, // ЛКМ зажата на шкафе, тянем в секцию
  isPlacingFurniture: false,
  furnitureGhost: null,
  pendingFurnitureData: null,
  ghostWall: null,
  ghostPosition: null,
  lastValidGhostPosition: null, // при drag — последняя валидная позиция
  lastValidGhostWall: null,

  // Section placement state
  isPlacingSection: false,
  pendingSectionData: null, // { width, height, depth, span? }
  sectionGhost: null, // Призрак секции при размещении
  sectionGhostWall: null, // Стена, на которую наведен призрак
  sectionGhostPosition: null, // Позиция призрака
  /** Пролёты текущей стены при постановке секции (см. wall-solid-spans). */
  sectionPlacementSpans: null,
  sectionPlacementWall: null,
  sectionPlacementSelectedIds: [],
  /** true = выбор с пилюли/«оба», курсор не перебивает. */
  sectionPlacementSelectionLocked: false,
  /** true = на confirm создать все placeable-пролёты. */
  sectionPlacementPlaceAll: false,
  /** Разрешить пилюлю «Оба пролёта». */
  sectionPlacementAllowBoth: true,
  /** Кандидат «вдоль стены с окном» (U: полный | ≤sill | полный). */
  sectionPlacementBridgeSpan: null,
  /** Выбран вариант window-bridge вместо отдельных пролётов. */
  sectionPlacementPlaceBridge: false,
  // Какой пресет раскладки (layout) сейчас создаёт секцию (например, 'top-wall', 'corner-wardrobe')
  pendingLayoutKey: null,

  // Furniture dragging state
  isDraggingFurniture: false,
  draggedFurniture: null,
  dragStartMousePos: null,
  dragStartFurniturePos: null,
  dragWall: null,
  /** После drag мебели подавить следующий synthetic click на canvas (открытие модалки секции и т.п.) */
  suppressNextCanvasClick: false,

  // Furniture selection state
  selectedFurniture: null,
  furniturePerimeterMarker: null,
  selectedSections: [], // Array of selected sections with their markers
  sectionMarkers: {}, // Map: sectionGroup -> marker object

  // Custom sections array - хранит созданные пользователем секции
  customSections: [], // Array of { id, name, size: {x,y,z}, position: {x,y,z}, group: THREE.Group }
  
  // Хранилище меток размеров для секций
  sectionDimensionLabels: {}, // Map: sectionId -> Array of label elements
  // Хранилище вспомогательных "зон" внутри секций (мелкие под‑секции между сплошными линиями)
  sectionZones: {}, // Map: sectionId -> Array of THREE.Group zone helpers
  // Отладка: включить/выключить видимость зон по отдельности
  showDoubleZones: false,
  showSingleZones: false,
  
  // Хранилище меток отступов для редактируемой секции
  sectionOffsetLabels: [], // Array of label elements for offset dimensions
  
  // Хранилище линий и меток отступов на стене (Three.js объекты)
  sectionOffsetLines: [], // Array of THREE.Line objects for offset lines on walls
  sectionOffsetSprites: [], // Array of THREE.Sprite objects for offset labels on walls
  
  // Хранилище маркеров расстановки шкафов для секций
  sectionCabinetMarkers: {}, // Map: sectionId -> Array of marker lines

  // Cap-секции (накладки 16мм): граница между шкафом и тумбой.
  // Ключ = wallName, значение = массив { sectionId, capStartU, capEndU, wallName }
  // capStartU/capEndU — мировые координаты вдоль оси U стены.
  // Используется section-manager и cabinet-markers для рендера cap как отдельной зоны.
  capBoundaries: new Map(),
  // Разбиение призрака секции (для привязки модулей к зонам)
  sectionGhostDivision: null, // { partSize, sectionStart, sectionEnd, wallName, parts }

  // GLB animation and parameters
  furnitureAnimationMixer: null, // AnimationMixer for GLB animations
  furnitureAnimations: {}, // Map: animationName -> AnimationAction

  // UI containers
  sceneIconsContainer: null,

  // Camera state
  initialCameraPosition: null,
  initialCameraTarget: null,

  // Mouse control state
  isRotating: false,
  isPanning: false,
  previousMousePosition: { x: 0, y: 0 }
};

// Room dimensions in millimeters (no conversion needed)
export const ROOM_WIDTH = 5000; // 5000mm = 5m
export const ROOM_DEPTH = 4000; // 4000mm = 4m
export const ROOM_HEIGHT = 2500; // 2500mm = 2.5m

// Constants
export const WALL_THICKNESS = 100; // 100mm = 10cm

// Helper functions to access state
export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
}
