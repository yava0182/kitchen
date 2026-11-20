// Global application state
// All shared variables between modules.
//
// ВАЖНО: Vite + разные ?v= на импортах могут выполнить этот файл дважды.
// Без singleton получаются два state → canvas/room в одном, place/клики в пустом.
const __cldStateRoot =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : {};

function createInitialState() {
  return {
    // Three.js core objects
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    cameraFillLight: null,
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
    isDraggingFromCatalog: false,
    isPlacingFurniture: false,
    furnitureGhost: null,
    pendingFurnitureData: null,
    ghostWall: null,
    ghostPosition: null,
    lastValidGhostPosition: null,
    lastValidGhostWall: null,

    // Section placement state
    isPlacingSection: false,
    pendingSectionData: null,
    sectionGhost: null,
    sectionGhostWall: null,
    sectionGhostPosition: null,
    sectionPlacementSpans: null,
    sectionPlacementWall: null,
    sectionPlacementSelectedIds: [],
    sectionPlacementSelectionLocked: false,
    sectionPlacementPlaceAll: false,
    sectionPlacementAllowBoth: true,
    sectionPlacementBridgeSpan: null,
    sectionPlacementPlaceBridge: false,
    pendingLayoutKey: null,

    // Furniture dragging state
    isDraggingFurniture: false,
    draggedFurniture: null,
    dragStartMousePos: null,
    dragStartFurniturePos: null,
    dragWall: null,
    suppressNextCanvasClick: false,

    // Furniture selection state
    selectedFurniture: null,
    furniturePerimeterMarker: null,
    selectedSections: [],
    sectionMarkers: {},

    customSections: [],

    /** Кухня: система (ordinary/gola) + высота опор проекта. */
    kitchenProject: null,

    sectionDimensionLabels: {},
    sectionZones: {},
    /** Слой контуров ячеек (SectionZone*) — по умолчанию выкл.; вкл. кнопкой «Ячейки». */
    showDoubleZones: false,
    showSingleZones: false,

    /**
     * UI ячеек доступен (кнопка «Ячейки»). Видимость слоя — showSingle/DoubleZones.
     * Выкл. фичи целиком: __cldSetKitchenCellsUiEnabled(false).
     */
    kitchenCellsUiEnabled: true,

    /** Просмотр сеток BASE/MID/TOP (кнопка «Ячейки» поясов). Общий state — один на все импорты. */
    kitchenBandGridsView: { enabled: false, band: 'base' },

    /**
     * Построение секций (прямая / позже угол).
     * true = можно ставить секцию и править сетку. Выкл: __cldSetKitchenSectionsEnabled(false).
     */
    kitchenSectionsEnabled: true,

    sectionOffsetLabels: [],

    sectionOffsetLines: [],
    sectionOffsetSprites: [],

    sectionCabinetMarkers: {},

    capBoundaries: new Map(),
    sectionGhostDivision: null,

    furnitureAnimationMixer: null,
    furnitureAnimations: {},

    sceneIconsContainer: null,

    initialCameraPosition: null,
    initialCameraTarget: null,

    isRotating: false,
    isPanning: false,
    previousMousePosition: { x: 0, y: 0 },
  };
}

if (!__cldStateRoot.__CLD_STATE_SINGLETON__) {
  __cldStateRoot.__CLD_STATE_SINGLETON__ = createInitialState();
}

export const state = __cldStateRoot.__CLD_STATE_SINGLETON__;

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
