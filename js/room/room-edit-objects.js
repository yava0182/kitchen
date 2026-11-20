/**
 * IKEA-like «Объекты»: каталог в правой панели, постановка, drag в 2D,
 * синяя рамка / ручки / размеры на плане.
 */
import { state } from '../utils/state.js';
import { updateMousePosition } from '../events/mouse-handler.js';
/** 0 — вплотную к стенам/углу, как IKEA */
const FLOOR_MARGIN_MM = 0;
const MIN_SIZE_MM = 100;
const MAX_SIZE_MM = 5000;
const DEFAULT_COL_MM = 300;

const CATEGORIES = [
  { id: 'structural', label: 'Структурные объекты', enabled: true },
  { id: 'electric', label: 'Электричество', enabled: true },
  { id: 'heating', label: 'Отопление', enabled: true },
  { id: 'ventilation', label: 'Вентиляция', enabled: true },
  { id: 'pipes', label: 'Трубы', enabled: true },
];

/** IKEA: трубы (заглушки — свои модели позже). */
const PIPES_CATALOG = [
  {
    id: 'pipe-vert-water',
    category: 'pipes',
    mount: 'floor',
    kind: 'pipe_vert_water',
    name: 'Вертикальная водопроводная труба',
    desc: 'Регулируемое крепление',
    defaultDiameterMm: 33,
    defaultHeightMm: 500, // 50 см
    pipeGapMm: 100, // 10 см между трубами (просвет)
    defaultDepthMm: 33,
    thumb: '/images/objects/pipe-vert-water.svg',
  },
  {
    id: 'pipe-vert-gas',
    category: 'pipes',
    mount: 'floor',
    kind: 'pipe_vert_gas',
    name: 'Вертикальная газовая труба',
    desc: 'Регулируемое крепление',
    defaultDiameterMm: 33,
    defaultHeightMm: 500,
    thumb: '/images/objects/pipe-vert-gas.svg',
  },
  {
    id: 'pipe-vert',
    category: 'pipes',
    mount: 'floor',
    kind: 'pipe_vert',
    name: 'Вертикальная труба',
    desc: 'Регулируемое крепление',
    defaultDiameterMm: 40,
    defaultHeightMm: 500,
    thumb: '/images/objects/pipe-vert.svg',
  },
  {
    id: 'pipe-horiz-water',
    category: 'pipes',
    mount: 'wall',
    kind: 'pipe_horiz_water',
    name: 'Горизонтальная водопроводная труба',
    desc: 'Регулируемое крепление',
    defaultWidthMm: 120,
    defaultHeightMm: 45,
    defaultDepthMm: 55,
    defaultElevMm: 550,
    thumb: '/images/objects/pipe-horiz-water.svg',
  },
  {
    id: 'pipe-horiz-gas',
    category: 'pipes',
    mount: 'wall',
    kind: 'pipe_horiz_gas',
    name: 'Горизонтальная газовая труба',
    desc: 'Регулируемое крепление',
    defaultWidthMm: 80,
    defaultHeightMm: 40,
    defaultDepthMm: 55,
    defaultElevMm: 550,
    thumb: '/images/objects/pipe-horiz-gas.svg',
  },
  {
    id: 'pipe-horiz',
    category: 'pipes',
    mount: 'wall',
    kind: 'pipe_horiz',
    name: 'Горизонтальная труба',
    desc: 'Регулируемое крепление',
    defaultWidthMm: 80,
    defaultHeightMm: 40,
    defaultDepthMm: 55,
    defaultElevMm: 550,
    thumb: '/images/objects/pipe-horiz.svg',
  },
  {
    id: 'pipe-floor-drain',
    category: 'pipes',
    mount: 'floor',
    kind: 'pipe_floor_drain',
    name: 'Слив в полу',
    desc: 'Регулируемое крепление',
    defaultDiameterMm: 100,
    defaultHeightMm: 20,
    thumb: '/images/objects/pipe-floor-drain.svg',
  },
  {
    id: 'pipe-trap',
    category: 'pipes',
    mount: 'floor',
    kind: 'pipe_trap',
    name: 'Стакан / фильтр',
    desc: 'Без регулируемых креплений',
    defaultWidthMm: 120,
    defaultDepthMm: 80,
    defaultHeightMm: 180,
    thumb: '/images/objects/pipe-trap.svg',
  },
  {
    id: 'pipe-wall-hot',
    category: 'pipes',
    mount: 'wall',
    kind: 'pipe_wall_hot',
    name: 'Стена с трубой для горячей воды',
    desc: 'Регулируемое крепление',
    defaultWidthMm: 45,
    defaultHeightMm: 45,
    defaultDepthMm: 50,
    defaultElevMm: 550,
    thumb: '/images/objects/pipe-wall-hot.svg',
  },
  {
    id: 'pipe-wall-cold',
    category: 'pipes',
    mount: 'wall',
    kind: 'pipe_wall_cold',
    name: 'Стена с трубой холодной воды',
    desc: 'Регулируемое крепление',
    defaultWidthMm: 45,
    defaultHeightMm: 45,
    defaultDepthMm: 50,
    defaultElevMm: 550,
    thumb: '/images/objects/pipe-wall-cold.svg',
  },
  {
    id: 'pipe-floor-hot',
    category: 'pipes',
    mount: 'floor',
    kind: 'pipe_floor_hot',
    name: 'Труба для горячей воды на полу',
    desc: 'Регулируемое крепление',
    defaultDiameterMm: 28,
    fullHeight: true,
    thumb: '/images/objects/pipe-floor-hot.svg',
  },
  {
    id: 'pipe-floor-cold',
    category: 'pipes',
    mount: 'floor',
    kind: 'pipe_floor_cold',
    name: 'Трубопровод холодной воды на полу',
    desc: 'Регулируемое крепление',
    defaultDiameterMm: 28,
    fullHeight: true,
    thumb: '/images/objects/pipe-floor-cold.svg',
  },
];


/** IKEA placeholders: потом заменим своими моделями. */
const HEATING_CATALOG = [
  {
    id: 'heat-cyl-boiler',
    category: 'heating',
    mount: 'floor',
    kind: 'heater_cyl',
    name: 'Бойлер цилиндрический',
    desc: 'Регулируемый элемент',
    defaultDiameterCm: 55,
    defaultHeightCm: 180,
    thumb: '/images/objects/heater-cyl.svg',
  },
  {
    id: 'heat-rect-boiler',
    category: 'heating',
    mount: 'floor',
    kind: 'heater_rect',
    name: 'Бойлер прямоугольный',
    desc: 'Регулируемый элемент',
    defaultWidthCm: 50,
    defaultDepthCm: 40,
    defaultHeightCm: 180,
    thumb: '/images/objects/heater-rect.svg',
  },
  {
    id: 'heat-fireplace',
    category: 'heating',
    mount: 'floor',
    kind: 'fireplace',
    name: 'Камин с дымоходом',
    desc: 'Регулируемый элемент',
    defaultWidthCm: 80,
    defaultDepthCm: 60,
    defaultHeightCm: 220,
    thumb: '/images/objects/fireplace.svg',
  },
  {
    id: 'heat-radiator',
    category: 'heating',
    mount: 'wall',
    kind: 'radiator',
    name: 'Радиатор',
    desc: 'Регулируемый элемент',
    defaultWidthMm: 800,
    defaultHeightMm: 600,
    defaultDepthMm: 80,
    defaultElevMm: 200,
    thumb: '/images/objects/radiator.svg',
  },
  {
    id: 'heat-pump',
    category: 'heating',
    mount: 'wall',
    kind: 'heat_pump',
    name: 'Тепловой насос',
    desc: 'Регулируемый элемент',
    defaultWidthMm: 900,
    defaultHeightMm: 300,
    defaultDepthMm: 220,
    defaultElevMm: 1800,
    thumb: '/images/objects/heat-pump.svg',
  },
];

/** IKEA: вентиляция (пока заглушка — свои модели позже). */
const VENTILATION_CATALOG = [
  {
    id: 'vent-exhaust',
    category: 'ventilation',
    mount: 'wall',
    kind: 'exhaust_box',
    name: 'Вентиляция',
    desc: 'Регулируемый вытяжной короб',
    defaultWidthMm: 299,
    defaultHeightMm: 299,
    defaultDepthMm: 45,
    defaultElevMm: 2200,
    thumb: '/images/objects/vent-exhaust.svg',
  },
];

/** IKEA: 4 позиции электрики (выключатели + розетки). */
const ELECTRIC_CATALOG = [
  {
    id: 'el-switch',
    category: 'electric',
    mount: 'wall',
    kind: 'switch',
    name: 'Выключатель',
    desc: 'Без регулируемых элементов',
    defaultWidthMm: 81,
    defaultHeightMm: 81,
    defaultDepthMm: 14,
    defaultElevMm: 1100,
    thumb: '/images/objects/switch.svg',
  },
  {
    id: 'el-switch-double',
    category: 'electric',
    mount: 'wall',
    kind: 'switch_double',
    name: 'Двойной выключатель',
    desc: 'Без регулируемых элементов',
    defaultWidthMm: 81,
    defaultHeightMm: 81,
    defaultDepthMm: 14,
    defaultElevMm: 1100,
    thumb: '/images/objects/switch-double.svg',
  },
  {
    id: 'el-socket',
    category: 'electric',
    mount: 'wall',
    kind: 'socket',
    name: 'Розетка',
    desc: 'Без регулируемых элементов',
    defaultWidthMm: 81,
    defaultHeightMm: 81,
    defaultDepthMm: 14,
    defaultElevMm: 300,
    thumb: '/images/objects/socket.svg',
  },
  {
    id: 'el-socket-double',
    category: 'electric',
    mount: 'wall',
    kind: 'socket_double',
    name: 'Двойная розетка',
    desc: 'Без регулируемых элементов',
    defaultWidthMm: 81,
    defaultHeightMm: 150,
    defaultDepthMm: 14,
    defaultElevMm: 300,
    thumb: '/images/objects/socket-double.svg',
  },
];

const STRUCTURAL_CATALOG = [
  {
    id: 'col-square',
    category: 'structural',
    kind: 'column_square',
    name: 'Колонна квадратная',
    desc: 'Регулируемый конструктивный элемент',
    defaultWidthCm: 30,
    defaultDepthCm: 30,
    defaultHeightCm: 250,
    thumb: '/images/objects/column-square.svg',
  },
  {
    id: 'rect-block',
    category: 'structural',
    kind: 'rect',
    name: 'Прямоугольный объект',
    desc: 'Регулируемый конструктивный элемент',
    defaultWidthCm: 80,
    defaultDepthCm: 80,
    defaultHeightCm: 250,
    thumb: '/images/objects/rect-block.svg',
  },
  {
    id: 'partition-horiz',
    category: 'structural',
    kind: 'partition_horiz',
    name: 'Горизонтальная перегородка',
    desc: 'Регулируемый конструктивный элемент',
    defaultWidthCm: 100,
    defaultDepthCm: 30,
    defaultHeightCm: 250,
    thumb: '/images/objects/partition-horiz.svg',
  },
];

let canvasBound = false;
let selectedCatalog = null;
let selectedObjectId = null;
let catalogBrowse = false;
let dragObjectId = null;
let dragMoved = false;
let dragOffset = { x: 0, z: 0 };
let resizeCorner = null; // 'nw'|'ne'|'sw'|'se'
let resizeStart = null;
let activeCategory = 'structural';
let controlsWasEnabled = true;
let gizmoRaf = 0;
/** Редактирование размера на плане: 'w' | 'd' | 'offL'|'offR'|'offT'|'offB' | null */
let dimEditing = null;
/** Режим панели после выбора: null | 'edit' | 'position' */
let panelMode = null;

function objects() {
  if (!Array.isArray(state.roomEditObjects)) state.roomEditObjects = [];
  return state.roomEditObjects;
}

function isTopView2d() {
  return window.__cldRoomEditView !== '3d';
}

function isObjectsMode() {
  return (
    window.__cldKitchenRoomMode === 'objects' ||
    (window.__cldRoomEditOpen && window.__cldRoomEditPanel === 'objects')
  );
}

function makeId() {
  return 'obj-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e4).toString(36);
}

function catalogFor(category) {
  if (category === 'electric') return ELECTRIC_CATALOG;
  if (category === 'ventilation') return VENTILATION_CATALOG;
  if (category === 'heating') return HEATING_CATALOG;
  if (category === 'pipes') return PIPES_CATALOG;
  if (category === 'structural') return STRUCTURAL_CATALOG;
  return [];
}

function findCatalogItem(id) {
  return (
    STRUCTURAL_CATALOG.find((x) => x.id === id) ||
    ELECTRIC_CATALOG.find((x) => x.id === id) ||
    VENTILATION_CATALOG.find((x) => x.id === id) ||
    HEATING_CATALOG.find((x) => x.id === id) ||
    PIPES_CATALOG.find((x) => x.id === id) ||
    null
  );
}

function isWallMount(objOrItem) {
  return !!(objOrItem && objOrItem.mount === 'wall');
}

function isRoundKind(kind) {
  // column_round removed — square/rect only for structural
  return (
    kind === 'heater_cyl' ||
    kind === 'pipe_vert' ||
    kind === 'pipe_vert_gas' ||
    kind === 'pipe_floor_hot' ||
    kind === 'pipe_floor_cold' ||
    kind === 'pipe_floor_drain'
  );
}

function isPipeDoubleVert(kind) {
  return kind === 'pipe_vert_water';
}

/** Просвет между двумя вертикальными трубами (мм) → расстояние центров. */
function pipeDoubleCenterGapMm(objOrItem) {
  const dia = Math.max(
    12,
    Number(objOrItem?.depthMm) ||
      Number(objOrItem?.defaultDiameterMm) ||
      Number(objOrItem?.defaultDepthMm) ||
      33
  );
  const clear =
    Number(objOrItem?.pipeGapMm) ||
    Number(objOrItem?.defaultPipeGapMm) ||
    100;
  return dia + Math.max(0, clear);
}

function isHeatingObj(objOrItem) {
  return !!(objOrItem && objOrItem.category === 'heating');
}

function isVentilationObj(objOrItem) {
  return !!(objOrItem && objOrItem.category === 'ventilation');
}

function isElectricObj(objOrItem) {
  return !!(objOrItem && objOrItem.category === 'electric');
}

function isPipesObj(objOrItem) {
  return !!(objOrItem && objOrItem.category === 'pipes');
}

function isFullHeightPipe(item) {
  return !!(item && item.category === 'pipes' && item.fullHeight);
}

function pipeColorForKind(kind) {
  if (kind === 'pipe_floor_hot' || kind === 'pipe_wall_hot') return 0xc62828;
  if (kind === 'pipe_floor_cold' || kind === 'pipe_wall_cold') return 0x1565c0;
  if (kind === 'pipe_horiz_water' || kind === 'pipe_vert_water') return 0xb87333;
  if (kind === 'pipe_horiz_gas' || kind === 'pipe_vert_gas') return 0xffc107;
  return 0x9a9a9a;
}

function isFullHeightStructural(item) {
  if (!item) return false;
  if (item.category === 'heating') return false;
  if (isFullHeightPipe(item)) return true;
  if (item.category === 'pipes') return false;
  return (
    item.category === 'structural' ||
    item.kind === 'column_square' ||
    item.kind === 'partition_horiz' ||
    item.kind === 'rect'
  );
}

function catalogDefaults(item) {
  const roomH = (state.room && state.room.height) || 2500;
  if (isWallMount(item)) {
    const w = Number(item.defaultWidthMm);
    const h = Number(item.defaultHeightMm);
    const d = Number(item.defaultDepthMm);
    const elev = Number(item.defaultElevMm);
    return {
      mount: 'wall',
      category: item?.category || 'electric',
      kind: item?.kind || 'switch',
      catalogId: item?.id || '',
      name: item?.name || 'Объект',
      desc:
        item?.desc ||
        (item?.category === 'ventilation'
          ? 'Регулируемый вытяжной короб'
          : 'Без регулируемых элементов'),
      thumb: item?.thumb || '',
      widthMm: Number.isFinite(w) ? w : 81,
      heightMm: Number.isFinite(h) ? h : 81,
      depthMm: Number.isFinite(d) ? d : 14,
      elevMm: Number.isFinite(elev) ? elev : 1100,
      wallName: null,
      alongMm: 0,
      rotationDeg: 0,
    };
  }
  // трубы: размеры в mm (тонкие стояки ~28–40 mm)
  if (item && item.category === 'pipes') {
    const diaMm = Number(item.defaultDiameterMm);
    const wMm = Number(item.defaultWidthMm);
    const dMm = Number(item.defaultDepthMm);
    const hMm = Number(item.defaultHeightMm);
    const isRound = isRoundKind(item.kind);
    const dia =
      Number.isFinite(diaMm) && diaMm >= 12
        ? diaMm
        : Number.isFinite(wMm) && wMm >= 12
          ? wMm
          : 33;
    const full = isFullHeightPipe(item);
    const gapClear = Number(item.pipeGapMm);
    const pipeGapMm = Number.isFinite(gapClear) && gapClear >= 0 ? gapClear : 100;
    const doubleW = isPipeDoubleVert(item.kind)
      ? dia + pipeDoubleCenterGapMm({ ...item, depthMm: dia, pipeGapMm })
      : 0;
    return {
      mount: 'floor',
      category: 'pipes',
      kind: item.kind || 'pipe_vert',
      catalogId: item.id || '',
      name: item.name || 'Труба',
      desc: item.desc || 'Регулируемое крепление',
      thumb: item.thumb || '',
      widthMm: isPipeDoubleVert(item.kind)
        ? doubleW
        : isRound
          ? dia
          : Number.isFinite(wMm) && wMm >= 12
            ? wMm
            : 120,
      depthMm: isPipeDoubleVert(item.kind)
        ? Number.isFinite(dMm) && dMm >= 12
          ? dMm
          : dia
        : isRound
          ? dia
          : Number.isFinite(dMm) && dMm >= 12
            ? dMm
            : 80,
      heightMm: full
        ? roomH
        : Number.isFinite(hMm) && hMm >= 10
          ? Math.min(hMm, roomH)
          : 180,
      rotationDeg: 0,
      fullHeight: full,
      pipeGapMm: isPipeDoubleVert(item.kind) ? pipeGapMm : undefined,
    };
  }
  const isRound = item && isRoundKind(item.kind);
  const w = Number(item && item.defaultWidthCm) * 10;
  const d = Number(item && item.defaultDepthCm) * 10;
  const dia = Number(item && item.defaultDiameterCm) * 10;
  const h = Number(item && item.defaultHeightCm) * 10;
  const defH =
    Number.isFinite(h) && h >= MIN_SIZE_MM
      ? Math.min(h, roomH)
      : isFullHeightStructural(item)
        ? roomH
        : 1800;
  return {
    mount: 'floor',
    category: item?.category || 'structural',
    kind: item?.kind || 'column_square',
    catalogId: item?.id || '',
    name: item?.name || 'Объект',
    desc: item?.desc || '',
    thumb: item?.thumb || '',
    widthMm: isRound
      ? Number.isFinite(dia) && dia >= MIN_SIZE_MM
        ? dia
        : DEFAULT_COL_MM
      : Number.isFinite(w) && w >= MIN_SIZE_MM
        ? w
        : item?.kind === 'rect'
          ? 800
          : DEFAULT_COL_MM,
    depthMm: isRound
      ? Number.isFinite(dia) && dia >= MIN_SIZE_MM
        ? dia
        : DEFAULT_COL_MM
      : Number.isFinite(d) && d >= MIN_SIZE_MM
        ? d
        : item?.kind === 'rect'
          ? 800
          : DEFAULT_COL_MM,
    heightMm: defH,
    rotationDeg: 0,
  };
}

function halfFootprint(obj) {
  return { hx: obj.widthMm / 2, hz: obj.depthMm / 2 };
}

function clampInRoom(room, xMm, zMm, obj) {
  if (!room) return { x: xMm, z: zMm };
  const { hx, hz } = halfFootprint(obj);
  const minX = FLOOR_MARGIN_MM + hx;
  const maxX = Math.max(minX, room.width - FLOOR_MARGIN_MM - hx);
  const minZ = FLOOR_MARGIN_MM + hz;
  const maxZ = Math.max(minZ, room.depth - FLOOR_MARGIN_MM - hz);
  return {
    x: Math.max(minX, Math.min(maxX, Number(xMm) || room.width / 2)),
    z: Math.max(minZ, Math.min(maxZ, Number(zMm) || room.depth / 2)),
  };
}

function clampSize(mm) {
  return Math.max(MIN_SIZE_MM, Math.min(MAX_SIZE_MM, Math.round(mm)));
}

function roomLocalFromEvent(event) {
  if (!state.room || !state.raycaster || !state.camera) return null;
  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const floor = state.room.floorCoating || state.room.floor;
  if (!floor) return null;
  const hits = state.raycaster.intersectObject(floor, true);
  if (!hits.length) {
    // fallback: plane y=0 in room local
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const roomWorld = new THREE.Vector3();
    state.room.group.getWorldPosition(roomWorld);
    plane.constant = -roomWorld.y;
    const pt = new THREE.Vector3();
    if (!state.raycaster.ray.intersectPlane(plane, pt)) return null;
    const local = pt.clone().sub(roomWorld);
    return { xMm: local.x, zMm: local.z };
  }
  const roomWorld = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorld);
  const local = hits[0].point.clone().sub(roomWorld);
  return { xMm: local.x, zMm: local.z };
}

/** Хит: пол (колонны) или mesh (электрика на стене). */
function hitRoomObject(event) {
  // сначала mesh — стены/электрика
  const group = state.room && state.room._cldObjectsGroup;
  if (group && state.raycaster && state.camera) {
    updateMousePosition(event);
    state.raycaster.setFromCamera(state.mouse, state.camera);
    const pick = [];
    group.traverse((o) => {
      if (o.isMesh && o.userData && o.userData.roomObjectId && o.visible !== false) pick.push(o);
    });
    if (pick.length) {
      const hits = state.raycaster.intersectObjects(pick, true);
      if (hits.length) return hits[0].object.userData.roomObjectId;
    }
  }
  const pt = roomLocalFromEvent(event);
  if (!pt) return null;
  let best = null;
  let bestArea = Infinity;
  objects().forEach((obj) => {
    if (!obj) return;
    if (isWallMount(obj)) {
      if (!isTopView2d() || !state.room) return;
      const planPose = wallMountPose(state.room, obj, 46);
      const side = planPose.side;
      const alongHalf = Math.max(50, (obj.widthMm || 81) / 2);
      const outHalf = 40;
      let ok = false;
      if (side === 'back' || side === 'front') {
        ok =
          Math.abs(pt.xMm - planPose.x) <= alongHalf + 8 &&
          Math.abs(pt.zMm - planPose.z) <= outHalf + 8;
      } else {
        ok =
          Math.abs(pt.zMm - planPose.z) <= alongHalf + 8 &&
          Math.abs(pt.xMm - planPose.x) <= outHalf + 8;
      }
      if (ok) {
        const area = alongHalf * outHalf;
        if (area < bestArea) {
          bestArea = area;
          best = obj.id;
        }
      }
      return;
    }
    const { hx, hz } = halfFootprint(obj);
    if (Math.abs(pt.xMm - obj.xMm) <= hx + 4 && Math.abs(pt.zMm - obj.zMm) <= hz + 4) {
      const area = obj.widthMm * obj.depthMm;
      if (area < bestArea) {
        bestArea = area;
        best = obj.id;
      }
    }
  });
  return best;
}

function ensureObjectsGroup(room) {
  if (!room || !room.group) return null;
  if (!room._cldObjectsGroup) {
    room._cldObjectsGroup = new THREE.Group();
    room._cldObjectsGroup.name = 'cldRoomObjects';
    room.group.add(room._cldObjectsGroup);
  }
  return room._cldObjectsGroup;
}

function syncMeshVisibility(mesh) {
  if (!mesh || !mesh.userData) return;
  const view2d = isTopView2d();
  if (mesh.userData.hideInTopView) mesh.visible = !view2d;
  else if (mesh.userData.hideIn3dView) mesh.visible = view2d;
}

function applyObjectViewVisibility() {
  const group = state.room && state.room._cldObjectsGroup;
  if (!group) return;
  group.traverse((o) => {
    if (!o.userData) return;
    if (o.isMesh || o.isLineSegments || o.isGroup) syncMeshVisibility(o);
  });
}

function disposeMesh(m) {
  if (!m) return;
  try {
    while (m.children && m.children.length) disposeMesh(m.children[0]);
    m.parent?.remove(m);
    m.geometry?.dispose?.();
    if (Array.isArray(m.material)) m.material.forEach((mat) => mat?.dispose?.());
    else m.material?.dispose?.();
  } catch (_) {}
}

/** Штукатурка как у стен (клон wallInner / IKEA v0 wall shader). */
function applyObjectWallMaterial(mesh) {
  if (!mesh || !mesh.isMesh) return;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  // Свет v0 wiped — только клон обычного материала стены.
  try {
    const inn = Object.values((state.room && state.room.wallInners) || {})[0];
    if (inn && inn.material) {
      const old = mesh.material;
      mesh.material = inn.material.clone();
      mesh.material.side = THREE.DoubleSide;
      if (old && old !== mesh.material) old.dispose?.();
      return;
    }
  } catch (_) {}
  if (mesh.material) mesh.material.dispose?.();
  mesh.material = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.85,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
}

function wallCardinal(room, wallName) {
  if (room && typeof room.wallCardinalSide === 'function') {
    return room.wallCardinalSide(wallName) || wallName;
  }
  return wallName;
}

function wallAlongAbs(room, wallName, alongMm) {
  const origin = room.wallAlongOrigin ? room.wallAlongOrigin(wallName) : 0;
  return origin + (Number(alongMm) || 0);
}

function pickDefaultWall(room) {
  if (!room) return 'back';
  // IKEA: центр дальней (верхней на 2D) стены — сразу видно
  const order = ['back', 'right', 'left', 'front'];
  for (let i = 0; i < order.length; i++) {
    const n = order[i];
    if (room.walls && room.walls[n]) return n;
  }
  const keys = Object.keys(room.walls || {}).filter((k) => k && k !== 'ceiling');
  return keys[0] || 'back';
}

/** Надёжная длина стены (мм); не даём 0 → иначе along уезжает в угол. */
function wallLengthMm(room, wallName) {
  if (!room) return 4000;
  let len = room.wallLengthOf ? Number(room.wallLengthOf(wallName)) : NaN;
  if (!Number.isFinite(len) || len < 200) {
    const side = wallCardinal(room, wallName);
    if (side === 'left' || side === 'right') len = Number(room.depth) || 4000;
    else len = Number(room.width) || 5000;
  }
  return len;
}

/** Поза на внутренней грани стены (электрика). insetExtra — доп. сдвиг в комнату (мм). */
function wallMountPose(room, obj, insetExtra) {
  const wallName = obj.wallName || 'back';
  const side = wallCardinal(room, wallName);
  const along = wallAlongAbs(room, wallName, obj.alongMm);
  const inset =
    Math.max(2, (Number(obj.depthMm) || 14) / 2 + 1) + (Number(insetExtra) || 0);
  let x = 0;
  let z = 0;
  let rotY = 0;
  if (side === 'back') {
    x = along;
    z = inset;
    rotY = 0;
  } else if (side === 'front') {
    x = along;
    z = room.depth - inset;
    rotY = Math.PI;
  } else if (side === 'left') {
    x = inset;
    z = along;
    rotY = Math.PI / 2;
  } else {
    x = room.width - inset;
    z = along;
    rotY = -Math.PI / 2;
  }
  const y = (Number(obj.elevMm) || 0) + (Number(obj.heightMm) || 81) / 2;
  // rotationDeg — поворот В плоскости стены (как IKEA), не yaw от стены
  const roll = ((Number(obj.rotationDeg) || 0) * Math.PI) / 180;
  return { x, y, z, rotY, roll, side, wallName };
}

/** Проекция луча на плоскость стены (работает даже если mesh стены скрыт). */
function projectRayToWall(wallName, event) {
  const room = state.room;
  if (!room || !state.raycaster || !state.camera || !wallName) return null;
  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);

  const roomWorld = new THREE.Vector3();
  room.group.getWorldPosition(roomWorld);
  const side = wallCardinal(room, wallName);

  // 1) невидимые wallPlanes — лучший хит
  const planes = (room.wallPlanes || []).filter(
    (p) => p && (p.userData.wallName === wallName || wallCardinal(room, p.userData.wallName) === side)
  );
  if (planes.length) {
    const hits = state.raycaster.intersectObjects(planes, false);
    if (hits.length) {
      const local = hits[0].point.clone().sub(roomWorld);
      const axis = room.wallAlongAxis ? room.wallAlongAxis(wallName) : side === 'left' || side === 'right' ? 'z' : 'x';
      const origin = room.wallAlongOrigin ? room.wallAlongOrigin(wallName) : 0;
      const along = (axis === 'x' ? local.x : local.z) - origin;
      return { wallName, alongMm: along, elevMm: local.y, local, point: hits[0].point };
    }
  }

  // 2) математическая плоскость внутренней грани
  let normal = new THREE.Vector3(0, 0, 1);
  let pointOn = new THREE.Vector3(room.width / 2, room.height / 2, 0);
  if (side === 'front') {
    normal.set(0, 0, -1);
    pointOn.set(room.width / 2, room.height / 2, room.depth);
  } else if (side === 'left') {
    normal.set(1, 0, 0);
    pointOn.set(0, room.height / 2, room.depth / 2);
  } else if (side === 'right') {
    normal.set(-1, 0, 0);
    pointOn.set(room.width, room.height / 2, room.depth / 2);
  }
  const worldPointOn = pointOn.clone();
  const worldNormal = normal.clone();
  room.group.localToWorld(worldPointOn);
  // normal: transform direction
  const nEnd = pointOn.clone().add(normal);
  room.group.localToWorld(nEnd);
  worldNormal.copy(nEnd.sub(worldPointOn)).normalize();

  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(worldNormal, worldPointOn);
  const hitPt = new THREE.Vector3();
  if (!state.raycaster.ray.intersectPlane(plane, hitPt)) return null;
  const local = hitPt.clone().sub(roomWorld);
  // undo rotation of room.group if any — use worldToLocal
  const local2 = hitPt.clone();
  room.group.worldToLocal(local2);
  const axis = side === 'left' || side === 'right' ? 'z' : 'x';
  const origin = room.wallAlongOrigin ? room.wallAlongOrigin(wallName) : 0;
  const along = (axis === 'x' ? local2.x : local2.z) - origin;
  return { wallName, alongMm: along, elevMm: local2.y, local: local2, point: hitPt };
}

function hitWallForObject(event, preferWallName) {
  const room = state.room;
  if (!room || !state.raycaster || !state.camera) return null;
  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const roomWorld = new THREE.Vector3();
  room.group.getWorldPosition(roomWorld);

  const pick = [];
  if (room.wallPlanes && room.wallPlanes.length) {
    room.wallPlanes.forEach((p) => {
      if (p) pick.push(p);
    });
  }
  if (room.walls) {
    Object.keys(room.walls).forEach((k) => {
      if (k === 'ceiling') return;
      const m = room.walls[k];
      if (m) pick.push(m);
    });
  }
  if (room.wallInners) {
    Object.keys(room.wallInners).forEach((k) => {
      const m = room.wallInners[k];
      if (m) pick.push(m);
    });
  }

  let best = null;
  if (pick.length) {
    // временно включить visible для рейкаста скрытых стен
    const restored = [];
    pick.forEach((m) => {
      if (m.visible === false) {
        restored.push(m);
        m.visible = true;
      }
    });
    const hits = state.raycaster.intersectObjects(pick, true);
    restored.forEach((m) => {
      m.visible = false;
    });
    if (hits.length) {
      for (let i = 0; i < hits.length; i++) {
        let o = hits[i].object;
        let wallName = null;
        while (o) {
          if (o.userData && o.userData.wallName && o.userData.wallName !== 'ceiling') {
            wallName = o.userData.wallName;
            break;
          }
          o = o.parent;
        }
        if (!wallName) continue;
        const local = hits[i].point.clone();
        room.group.worldToLocal(local);
        const axis = room.wallAlongAxis ? room.wallAlongAxis(wallName) : 'x';
        const origin = room.wallAlongOrigin ? room.wallAlongOrigin(wallName) : 0;
        const along = (axis === 'x' ? local.x : local.z) - origin;
        best = { wallName, alongMm: along, elevMm: local.y, local, point: hits[i].point };
        break;
      }
    }
  }

  if (preferWallName) {
    const locked = projectRayToWall(preferWallName, event);
    if (locked) return locked;
  }
  if (best) return best;
  if (preferWallName) return projectRayToWall(preferWallName, event);
  return projectRayToWall(pickDefaultWall(room), event);
}

function buildElectricMeshes(obj) {
  const out = [];
  const room = state.room;
  if (!room) return out;
  if (!obj.wallName) obj.wallName = pickDefaultWall(room);
  const pose = wallMountPose(room, obj);
  const w = Math.max(20, Number(obj.widthMm) || 81);
  const h = Math.max(20, Number(obj.heightMm) || 81);
  const d = Math.max(4, Number(obj.depthMm) || 14);
  const heatWall = isHeatingObj(obj);
  const ventWall = isVentilationObj(obj);
  const pipeWall = isPipesObj(obj);
  const electricOnly = isElectricObj(obj);
  // BasicMaterial — иначе без света объект чёрный
  const bodyColor = heatWall
    ? 0x8e8e8e
    : ventWall
      ? 0xb8b8b8
      : pipeWall
        ? 0xc0c0c0
        : 0xf4f4f4;
  const mat = new THREE.MeshBasicMaterial({
    color: bodyColor,
    transparent: pipeWall,
    opacity: pipeWall ? 0.01 : 1,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  body.position.set(pose.x, pose.y, pose.z);
  body.rotation.order = 'YXZ';
  body.rotation.y = pose.rotY;
  body.rotation.z = pose.roll || 0;
  body.userData.roomObjectId = obj.id;
  body.userData.isRoomObjectBody = true;
  body.userData.isRoomObject = true;
  body.userData.isElectric = electricOnly;
  body.userData.isHeating = heatWall;
  body.userData.isVentilation = ventWall;
  body.userData.isPipes = pipeWall;
  body.castShadow = false;
  if (pipeWall) {
    const kind = obj.kind || '';
    const pipeCol = pipeColorForKind(kind);
    const n = kind === 'pipe_horiz_water' ? 2 : 1;
    const flangeR = Math.min(w, h) * 0.42;
    const tubeR = Math.min(w, h) * 0.18;
    const stick = Math.max(28, d * 0.85);
    for (let i = 0; i < n; i++) {
      const ox = n === 1 ? 0 : i === 0 ? -w * 0.28 : w * 0.28;
      const flange = new THREE.Mesh(
        new THREE.CircleGeometry(flangeR, 24),
        new THREE.MeshBasicMaterial({ color: 0xd0d0d0 })
      );
      flange.position.set(ox, 0, d / 2 + 0.5);
      flange.userData.roomObjectId = obj.id;
      body.add(flange);
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeR, tubeR, stick, 16),
        new THREE.MeshBasicMaterial({ color: pipeCol })
      );
      tube.rotation.x = Math.PI / 2;
      tube.position.set(ox, 0, d / 2 + stick / 2);
      tube.userData.roomObjectId = obj.id;
      body.add(tube);
    }
  } else if (ventWall) {
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.92, h * 0.92),
      new THREE.MeshBasicMaterial({ color: 0xd8d8d8 })
    );
    frame.position.set(0, 0, d / 2 + 0.5);
    body.add(frame);
    const slats = 5;
    for (let i = 0; i < slats; i++) {
      const oy = (i - (slats - 1) / 2) * (h * 0.14);
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.78, h * 0.06, 2),
        new THREE.MeshBasicMaterial({ color: 0x9a9a9a })
      );
      slat.position.set(0, oy, d / 2 + 1.2);
      slat.userData.roomObjectId = obj.id;
      body.add(slat);
    }
  } else if (electricOnly) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.72, h * 0.72),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    face.position.set(0, 0, d / 2 + 0.4);
    face.userData.roomObjectId = obj.id;
    body.add(face);
    if (obj.kind === 'switch' || obj.kind === 'switch_double') {
      const n = obj.kind === 'switch_double' ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const key = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.18, h * 0.42, 2),
          new THREE.MeshBasicMaterial({ color: 0xe4e4e4 })
        );
        const ox = n === 1 ? 0 : i === 0 ? -w * 0.16 : w * 0.16;
        key.position.set(ox, 0, d / 2 + 1.2);
        key.userData.roomObjectId = obj.id;
        body.add(key);
      }
    } else if (obj.kind === 'socket' || obj.kind === 'socket_double') {
      const n = obj.kind === 'socket_double' ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const oy = n === 1 ? 0 : i === 0 ? h * 0.18 : -h * 0.18;
        const ring = new THREE.Mesh(
          new THREE.CircleGeometry(Math.min(w, h) * 0.22, 24),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        ring.position.set(0, oy, d / 2 + 0.6);
        ring.userData.roomObjectId = obj.id;
        body.add(ring);
      }
    }
  }
  body.userData.hideInTopView = true;
  syncMeshVisibility(body);
  out.push(body);

  // 2D: белый прямоугольник на внутренней грани стены (центр стены при постановке)
  const planAlong = Math.max(90, w);
  const planOut = Math.max(28, d + 12);
  const planPose = wallMountPose(room, obj, planOut / 2 + 2);
  const selected = obj.id === selectedObjectId;
  const planMat = new THREE.MeshBasicMaterial({
    color: selected ? 0xffffff : 0xf2f2f2,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });
  const plan = new THREE.Mesh(new THREE.PlaneGeometry(planAlong, planOut), planMat);
  plan.rotation.x = -Math.PI / 2;
  if (pose.side === 'left' || pose.side === 'right') plan.rotation.z = Math.PI / 2;
  plan.position.set(planPose.x, 12, planPose.z);
  plan.renderOrder = 20;
  plan.userData.roomObjectId = obj.id;
  plan.userData.isRoomObjectPlan = true;
  plan.userData.isElectricPlan = true;
  plan.userData.hideIn3dView = true;
  syncMeshVisibility(plan);
  out.push(plan);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(planAlong, planOut)),
    new THREE.LineBasicMaterial({
      color: selected ? 0x4a90d9 : 0xb0b0b0,
      depthTest: false,
      depthWrite: false,
    })
  );
  edge.rotation.x = -Math.PI / 2;
  if (pose.side === 'left' || pose.side === 'right') edge.rotation.z = Math.PI / 2;
  edge.position.set(planPose.x, 13, planPose.z);
  edge.renderOrder = 21;
  edge.userData.roomObjectId = obj.id;
  edge.userData.hideIn3dView = true;
  syncMeshVisibility(edge);
  out.push(edge);
  return out;
}

function buildColumnMeshes(obj) {
  if (isWallMount(obj)) return buildElectricMeshes(obj);
  if (isPipesObj(obj)) return buildFloorPipeMeshes(obj);
  const out = [];
  const h = obj.heightMm;
  const y = h / 2;
  const round = isRoundKind(obj.kind);

  let body;
  if (round) {
    const r = obj.widthMm / 2;
    body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32));
  } else {
    body = new THREE.Mesh(new THREE.BoxGeometry(obj.widthMm, h, obj.depthMm));
  }
  body.rotation.y = (Number(obj.rotationDeg) || 0) * (Math.PI / 180);
  body.position.set(obj.xMm, y, obj.zMm);
  body.userData.roomObjectId = obj.id;
  body.userData.isRoomObjectBody = true;
  body.userData.isRoomObject = true;
  body.userData.hideInTopView = true;
  if (isHeatingObj(obj)) {
    body.material = new THREE.MeshBasicMaterial({ color: 0x8e8e8e });
    body.castShadow = false;
  } else {
    applyObjectWallMaterial(body);
  }
  syncMeshVisibility(body);
  out.push(body);

  // 2D: белый след + тонкая обводка (как IKEA)
  const planMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  let plan;
  if (round) {
    const r = obj.widthMm / 2;
    plan = new THREE.Mesh(new THREE.CircleGeometry(r, 32), planMat);
    plan.rotation.x = -Math.PI / 2;
  } else {
    plan = new THREE.Mesh(new THREE.PlaneGeometry(obj.widthMm, obj.depthMm), planMat);
    plan.rotation.x = -Math.PI / 2;
    plan.rotation.z = (Number(obj.rotationDeg) || 0) * (Math.PI / 180);
  }
  plan.position.set(obj.xMm, 6, obj.zMm);
  plan.renderOrder = 4;
  plan.userData.roomObjectId = obj.id;
  plan.userData.isRoomObjectPlan = true;
  plan.userData.hideIn3dView = true;
  syncMeshVisibility(plan);
  out.push(plan);

  if (!round) {
    const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(obj.widthMm, obj.depthMm));
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xb0b0b0, depthTest: false })
    );
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = (Number(obj.rotationDeg) || 0) * (Math.PI / 180);
    line.position.set(obj.xMm, 7, obj.zMm);
    line.renderOrder = 5;
    line.userData.roomObjectId = obj.id;
    line.userData.isRoomObjectEdge = true;
    line.userData.hideIn3dView = true;
    syncMeshVisibility(line);
    out.push(line);
  }
  return out;
}

function buildFloorPipeMeshes(obj) {
  const out = [];
  const h = Math.max(10, Number(obj.heightMm) || 100);
  const y = h / 2;
  const rotY = (Number(obj.rotationDeg) || 0) * (Math.PI / 180);
  const col = pipeColorForKind(obj.kind);
  const mat = new THREE.MeshBasicMaterial({ color: col });
  const root = new THREE.Group();
  root.position.set(obj.xMm, 0, obj.zMm);
  root.rotation.y = rotY;
  root.userData.roomObjectId = obj.id;
  root.userData.isRoomObject = true;
  root.userData.isRoomObjectBody = true;
  root.userData.isPipes = true;
  root.userData.hideInTopView = true;

  if (obj.kind === 'pipe_floor_drain') {
    const r = Math.max(20, obj.widthMm / 2);
    const grate = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, Math.max(8, h), 32),
      new THREE.MeshBasicMaterial({ color: 0x757575 })
    );
    grate.position.y = Math.max(4, h / 2);
    grate.userData.roomObjectId = obj.id;
    root.add(grate);
    for (let i = -2; i <= 2; i++) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(r * 1.6, 1, Math.max(2, r * 0.12)),
        new THREE.MeshBasicMaterial({ color: 0x9e9e9e })
      );
      slat.position.set(0, h + 1, i * r * 0.28);
      slat.userData.roomObjectId = obj.id;
      root.add(slat);
    }
  } else if (obj.kind === 'pipe_trap') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(obj.widthMm, h * 0.45, obj.depthMm),
      new THREE.MeshBasicMaterial({ color: 0x9e9e9e })
    );
    body.position.y = h * 0.25;
    body.userData.roomObjectId = obj.id;
    root.add(body);
    const bend = new THREE.Mesh(
      new THREE.TorusGeometry(Math.min(obj.widthMm, obj.depthMm) * 0.28, 12, 10, 16, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xbdbdbd })
    );
    bend.rotation.z = Math.PI / 2;
    bend.position.set(0, h * 0.55, 0);
    bend.userData.roomObjectId = obj.id;
    root.add(bend);
  } else if (isPipeDoubleVert(obj.kind)) {
    const r = Math.max(8, (Number(obj.depthMm) || 33) / 2);
    const gap = pipeDoubleCenterGapMm(obj);
    [-gap / 2, gap / 2].forEach((ox) => {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat);
      tube.position.set(ox, y, 0);
      tube.userData.roomObjectId = obj.id;
      root.add(tube);
    });
  } else {
    const r = Math.max(8, obj.widthMm / 2);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), mat);
    tube.position.y = y;
    tube.userData.roomObjectId = obj.id;
    root.add(tube);
    if (obj.kind === 'pipe_floor_hot' || obj.kind === 'pipe_floor_cold') {
      const valve = new THREE.Mesh(
        new THREE.BoxGeometry(r * 2.4, r * 1.2, r * 2.4),
        new THREE.MeshBasicMaterial({ color: 0xcfd8dc })
      );
      valve.position.y = h - r;
      valve.userData.roomObjectId = obj.id;
      root.add(valve);
    }
  }
  syncMeshVisibility(root);
  out.push(root);

  // 2D план: круг(и) как у IKEA
  const planMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const planGroup = new THREE.Group();
  planGroup.position.set(obj.xMm, 6, obj.zMm);
  planGroup.rotation.y = rotY;
  planGroup.userData.roomObjectId = obj.id;
  planGroup.userData.isRoomObjectPlan = true;
  planGroup.userData.hideIn3dView = true;
  if (isPipeDoubleVert(obj.kind)) {
    const r = Math.max(8, (Number(obj.depthMm) || 33) / 2);
    const gap = pipeDoubleCenterGapMm(obj);
    [-gap / 2, gap / 2].forEach((ox) => {
      const c = new THREE.Mesh(new THREE.CircleGeometry(r, 20), planMat.clone());
      c.rotation.x = -Math.PI / 2;
      c.position.set(ox, 0, 0);
      c.userData.roomObjectId = obj.id;
      planGroup.add(c);
    });
  } else if (obj.kind === 'pipe_trap') {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(obj.widthMm, obj.depthMm),
      planMat
    );
    p.rotation.x = -Math.PI / 2;
    p.userData.roomObjectId = obj.id;
    planGroup.add(p);
  } else {
    const r = Math.max(10, obj.widthMm / 2);
    const c = new THREE.Mesh(new THREE.CircleGeometry(r, 24), planMat);
    c.rotation.x = -Math.PI / 2;
    c.userData.roomObjectId = obj.id;
    planGroup.add(c);
  }
  syncMeshVisibility(planGroup);
  out.push(planGroup);
  return out;
}

function updateMeshesPosition(obj) {
  const group = state.room && state.room._cldObjectsGroup;
  if (!group || !obj) return;
  if (isWallMount(obj)) {
    applyToRoom();
    return;
  }
  group.traverse((o) => {
    if (!o.userData || o.userData.roomObjectId !== obj.id) return;
    if (o.userData.isRoomObjectBody) {
      const y = isPipesObj(obj) ? 0 : obj.heightMm / 2;
      o.position.set(obj.xMm, y, obj.zMm);
    } else if (o.parent === group || o.userData.isRoomObjectPlan) {
      o.position.x = obj.xMm;
      o.position.z = obj.zMm;
    }
  });
}

function applyToRoom() {
  const room = state.room;
  if (!room) return;
  const group = ensureObjectsGroup(room);
  if (!group) return;
  while (group.children.length) disposeMesh(group.children[0]);
  objects().forEach((obj) => {
    if (!obj) return;
    buildColumnMeshes(obj).forEach((m) => group.add(m));
  });
  applyObjectViewVisibility();
  if (typeof room.updateWallVisibility === 'function' && state.camera) {
    room.updateWallVisibility(state.camera);
  }
  refreshObjectGizmo();
}

function selectedObject() {
  return objects().find((o) => o && o.id === selectedObjectId) || null;
}

function placeOnWall(item, wallHit) {
  const room = state.room;
  if (!room || !item || !wallHit) return false;
  const def = catalogDefaults(item);
  const elev = Math.max(
    40,
    Math.min(
      room.height - def.heightMm - 40,
      wallHit.elevMm != null ? wallHit.elevMm - def.heightMm / 2 : def.elevMm
    )
  );
  const len = wallLengthMm(room, wallHit.wallName);
  const half = Math.max(10, def.widthMm / 2);
  let along = Number(wallHit.alongMm);
  if (!Number.isFinite(along)) along = len / 2;
  along = Math.max(half, Math.min(len - half, along));
  const obj = {
    id: makeId(),
    ...def,
    wallName: wallHit.wallName,
    alongMm: along,
    elevMm: elev,
    rotationDeg: 0,
  };
  objects().push(obj);
  selectedObjectId = obj.id;
  selectedCatalog = null;
  catalogBrowse = false;
  panelMode = null;
  applyToRoom();
  syncObjectEditor();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('room_object_place');
    }
  } catch (_) {}
  return true;
}

/**
 * IKEA: стояки всегда у стены у угла (на плане ~33 mm от стены, ~148 mm от угла).
 * Угол: левый-передний (низ слева на 2D).
 */
function defaultPipeFloorCorner(room, def) {
  const { hx, hz } = halfFootprint(def);
  const fromWall = Math.max(hx, 33); // от левой стены до центра
  const fromCorner = Math.max(hz, 148); // от передней стены вдоль
  return clampInRoom(room, fromWall, fromCorner, def);
}

/** Стеновые выводы труб — ближе к углу стены, не в центр. */
function defaultPipeWallAlong(room, wallName, widthMm) {
  const len = wallLengthMm(room, wallName);
  const half = Math.max(10, (Number(widthMm) || 45) / 2);
  const fromCorner = Math.max(half + 20, 200);
  return Math.max(half, Math.min(len - half, fromCorner));
}

function placeAtCenter(item) {
  const room = state.room;
  if (!room || !item) return false;
  if (isWallMount(item)) {
    const wallName = pickDefaultWall(room);
    const def = catalogDefaults(item);
    const along = isPipesObj(item)
      ? defaultPipeWallAlong(room, wallName, def.widthMm)
      : wallLengthMm(room, wallName) / 2;
    return placeOnWall(item, {
      wallName,
      alongMm: along,
    });
  }
  const def = catalogDefaults(item);
  if (isFullHeightStructural(item) || isFullHeightPipe(item)) {
    def.heightMm = room.height || def.heightMm;
  }
  // трубы на полу — у стены у угла; остальное — центр комнаты
  const raw = isPipesObj(item)
    ? defaultPipeFloorCorner(room, def)
    : clampInRoom(room, room.width / 2, room.depth / 2, def);
  const pos = raw;
  const obj = {
    id: makeId(),
    ...def,
    xMm: pos.x,
    zMm: pos.z,
    rotationDeg: 0,
  };
  objects().push(obj);
  selectedObjectId = obj.id;
  selectedCatalog = null;
  catalogBrowse = false;
  panelMode = null;
  applyToRoom();
  syncObjectEditor();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('room_object_place');
    }
  } catch (_) {}
  return true;
}

function placeAtPoint(item, xMm, zMm) {
  const room = state.room;
  if (!room || !item) return false;
  const def = catalogDefaults(item);
  if (isFullHeightStructural(item)) {
    def.heightMm = room.height || def.heightMm;
  }
  const pos = clampInRoom(room, xMm, zMm, def);
  const obj = {
    id: makeId(),
    ...def,
    xMm: pos.x,
    zMm: pos.z,
    rotationDeg: 0,
  };
  objects().push(obj);
  selectedObjectId = obj.id;
  selectedCatalog = null;
  catalogBrowse = false;
  panelMode = null;
  applyToRoom();
  syncObjectEditor();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('room_object_place');
    }
  } catch (_) {}
  return true;
}

function setControlsEnabled(on) {
  if (!state.controls) return;
  state.controls.enabled = !!on;
}

function projectToScreen(pos) {
  if (!pos || !state.camera || !window.sceneIconsContainer) return null;
  const container = window.sceneIconsContainer;
  const v = pos.clone().project(state.camera);
  if (v.z > 1) return null;
  return {
    x: v.x * (container.clientWidth / 2) + container.clientWidth / 2,
    y: -v.y * (container.clientHeight / 2) + container.clientHeight / 2,
  };
}

function worldPoint(xMm, zMm, yMm) {
  const room = state.room;
  if (!room || !room.group) return new THREE.Vector3(xMm, yMm || 8, zMm);
  const v = new THREE.Vector3(xMm, yMm || 8, zMm);
  room.group.localToWorld(v);
  return v;
}

function clearObjectGizmo() {
  const g = document.getElementById('cld-object-gizmo');
  if (g) g.style.display = 'none';
  clearPositionOffsetLines();
  syncPositionTip(false);
  const bar = document.getElementById('cld-electric-arrows');
  if (bar) bar.style.display = 'none';
  const eg = document.getElementById('cld-electric-gizmo');
  if (eg && (!selectedObject() || !isWallMount(selectedObject()))) {
    eg.style.display = 'none';
  }
  ['cld-electric-dim-w', 'cld-electric-dim-d'].forEach((id) => {
    const el = document.getElementById(id);
    if (el && (!selectedObject() || !isWallMount(selectedObject()) || !isTopView2d())) {
      el.style.display = 'none';
    }
  });
  if (!selectedObject() || !isWallMount(selectedObject()) || panelMode !== 'position') {
    clearWallPosLabels();
  }
  const layer = document.getElementById('cld-electric-plan-layer');
  if (layer && (!isObjectsMode() || !isTopView2d())) {
    layer.style.display = 'none';
  }
}

function ensureObjectGizmo() {
  const box = window.sceneIconsContainer;
  if (!box) return null;
  let g = document.getElementById('cld-object-gizmo');
  if (g) return g;
  g = document.createElement('div');
  g.id = 'cld-object-gizmo';
  g.className = 'cld-object-gizmo';
  g.innerHTML =
    '<div class="cld-object-gizmo__frame" aria-hidden="true"></div>' +
    '<button type="button" class="cld-object-gizmo__move" data-obj-gizmo="move" title="Переместить" aria-label="Переместить">' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>' +
    '</svg></button>' +
    '<button type="button" class="cld-object-gizmo__corner" data-corner="nw" aria-label="Размер"></button>' +
    '<button type="button" class="cld-object-gizmo__corner" data-corner="ne" aria-label="Размер"></button>' +
    '<button type="button" class="cld-object-gizmo__corner" data-corner="sw" aria-label="Размер"></button>' +
    '<button type="button" class="cld-object-gizmo__corner" data-corner="se" aria-label="Размер"></button>' +
    '<div class="cld-object-gizmo__dim is-editable" data-dim="w" tabindex="0" role="button" aria-label="Ширина"></div>' +
    '<div class="cld-object-gizmo__dim is-editable is-vertical" data-dim="d" tabindex="0" role="button" aria-label="Глубина"></div>';
  g.addEventListener('mousedown', (e) => {
    if (e.target.closest('.cld-object-gizmo__dim')) {
      e.stopPropagation();
      return;
    }
    const corner = e.target.closest('[data-corner]');
    const move = e.target.closest('[data-obj-gizmo="move"]');
    if (!corner && !move) return;
    e.preventDefault();
    e.stopPropagation();
    const op = selectedObject();
    if (!op || !isTopView2d()) return;
    const pt = roomLocalFromEvent(e);
    if (!pt) return;
    selectedObjectId = op.id;
    dragMoved = false;
    controlsWasEnabled = state.controls ? state.controls.enabled !== false : true;
    setControlsEnabled(false);
    document.body.classList.add('cld-room-edit-dragging-object');
    if (corner) {
      resizeCorner = corner.getAttribute('data-corner');
      resizeStart = {
        x: op.xMm,
        z: op.zMm,
        w: op.widthMm,
        d: op.depthMm,
        mx: pt.xMm,
        mz: pt.zMm,
      };
      dragObjectId = null;
    } else {
      resizeCorner = null;
      resizeStart = null;
      dragObjectId = op.id;
      dragOffset.x = op.xMm - pt.xMm;
      dragOffset.z = op.zMm - pt.zMm;
    }
  });
  g.addEventListener('click', (e) => {
    const dim = e.target.closest('[data-dim]');
    if (!dim || e.target.tagName === 'INPUT') return;
    e.preventDefault();
    e.stopPropagation();
    startDimEdit(dim.getAttribute('data-dim'));
  });
  box.appendChild(g);
  return g;
}

function applyDimEdit(axis, mmVal) {
  const op = selectedObject();
  if (!op || !state.room) return false;
  const room = state.room;
  const { hx, hz } = halfFootprint(op);

  // стена: положение вдоль / высота
  if (isWallMount(op) && String(axis).indexOf('wall_') === 0) {
    const halfW = Math.max(1, (Number(op.widthMm) || 81) / 2);
    const len = wallLengthMm(room, op.wallName || pickDefaultWall(room));
    const h = Number(op.heightMm) || 81;
    const v = Math.max(0, Math.round(mmVal));
    if (axis === 'wall_alongL') {
      op.alongMm = Math.max(halfW, Math.min(len - halfW, v + halfW));
    } else if (axis === 'wall_alongR') {
      op.alongMm = Math.max(halfW, Math.min(len - halfW, len - v - halfW));
    } else if (axis === 'wall_floor') {
      op.elevMm = Math.max(20, Math.min(room.height - h - 20, v));
    } else if (axis === 'wall_ceil') {
      op.elevMm = Math.max(20, Math.min(room.height - h - 20, room.height - h - v));
    } else if (axis === 'wall_opp') {
      // расстояние до противоположной стены — индикатор
      return false;
    } else {
      return false;
    }
    applyToRoom();
    syncObjectEditor();
    return true;
  }

  if (axis === 'w') {
    const mm = clampSize(mmVal);
    op.widthMm = mm;
    if (isRoundKind(op.kind)) op.depthMm = mm;
  } else if (axis === 'd') {
    const mm = clampSize(mmVal);
    op.depthMm = mm;
    if (isRoundKind(op.kind)) op.widthMm = mm;
  } else if (axis === 'offL') {
    const left = Math.max(0, Math.round(mmVal));
    op.xMm = left + hx;
  } else if (axis === 'offR') {
    const right = Math.max(0, Math.round(mmVal));
    op.xMm = room.width - right - hx;
  } else if (axis === 'offT') {
    const top = Math.max(0, Math.round(mmVal));
    op.zMm = top + hz;
  } else if (axis === 'offB') {
    const bot = Math.max(0, Math.round(mmVal));
    op.zMm = room.depth - bot - hz;
  } else {
    return false;
  }
  const pos = clampInRoom(room, op.xMm, op.zMm, op);
  op.xMm = pos.x;
  op.zMm = pos.z;
  applyToRoom();
  syncObjectEditor();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('room_object_dim');
    }
  } catch (_) {}
  return true;
}

function stopDimEdit(commitEl) {
  if (!dimEditing) return;
  const axis = dimEditing;
  dimEditing = null;
  if (commitEl && commitEl.tagName === 'INPUT') {
    const raw = String(commitEl.value || '').replace(',', '.').replace(/[^\d.]/g, '');
    const n = parseFloat(raw);
    if (Number.isFinite(n)) {
      // поле в mm как у IKEA
      applyDimEdit(axis, n);
      return;
    }
  }
  refreshObjectGizmo();
}

function startDimEdit(axis) {
  const op = selectedObject();
  const ok =
    axis === 'w' ||
    axis === 'd' ||
    axis === 'offL' ||
    axis === 'offR' ||
    axis === 'offT' ||
    axis === 'offB' ||
    axis === 'wall_alongL' ||
    axis === 'wall_alongR' ||
    axis === 'wall_floor' ||
    axis === 'wall_ceil';
  if (!op || !ok) return;
  if (axis === 'wall_opp') return;
  dimEditing = axis;
  refreshObjectGizmo();
  requestAnimationFrame(() => {
    const g = document.getElementById('cld-object-gizmo');
    const wallBox = document.getElementById('cld-wall-pos-labels');
    const input =
      (g && g.querySelector('[data-dim="' + axis + '"] input')) ||
      (wallBox && wallBox.querySelector('[data-dim="' + axis + '"] input'));
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function formatMmLabel(mm) {
  return String(Math.round(mm)) + ' mm';
}

function electricPlanScreenPos(obj) {
  const room = state.room;
  if (!room || !obj) return null;
  const pose = wallMountPose(room, obj, 10);
  return projectToScreen(worldPoint(pose.x, 12, pose.z));
}

function alongFromPlanPoint(room, wallName, xMm, zMm) {
  if (!room) return 0;
  const axis = room.wallAlongAxis ? room.wallAlongAxis(wallName) : 'x';
  const origin = room.wallAlongOrigin ? room.wallAlongOrigin(wallName) : 0;
  return (axis === 'x' ? xMm : zMm) - origin;
}

function startElectricWallDrag(e, op) {
  if (!op || !isWallMount(op)) return;
  selectedObjectId = op.id;
  selectedCatalog = null;
  catalogBrowse = false;
  dragObjectId = op.id;
  dragMoved = false;
  resizeCorner = null;
  resizeStart = null;
  controlsWasEnabled = state.controls ? state.controls.enabled !== false : true;
  setControlsEnabled(false);
  document.body.classList.add('cld-room-edit-dragging-object');
  if (isTopView2d()) {
    const pt = roomLocalFromEvent(e);
    const along = pt ? alongFromPlanPoint(state.room, op.wallName, pt.xMm, pt.zMm) : op.alongMm;
    dragOffset.x = along - op.alongMm;
    dragOffset.z = 0;
  } else {
    const wh = hitWallForObject(e, op.wallName);
    dragOffset.x = wh ? wh.alongMm - op.alongMm : 0;
    dragOffset.z = wh ? wh.elevMm - (op.elevMm + op.heightMm / 2) : 0;
  }
}

function refreshElectricPlanMarkers() {
  const box = window.sceneIconsContainer;
  if (!box) return;
  let layer = document.getElementById('cld-electric-plan-layer');
  const show = isObjectsMode() && isTopView2d();
  if (!show) {
    if (layer) layer.style.display = 'none';
    return;
  }
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'cld-electric-plan-layer';
    layer.className = 'cld-electric-plan-layer';
    layer.addEventListener('mousedown', (e) => {
      const mark = e.target.closest('[data-el-id]');
      if (!mark) return;
      e.preventDefault();
      e.stopPropagation();
      const op = objects().find((o) => o.id === mark.getAttribute('data-el-id'));
      if (!op) return;
      startElectricWallDrag(e, op);
      applyToRoom();
      syncObjectEditor();
    });
    box.appendChild(layer);
  }
  layer.style.display = 'block';
  const list = objects().filter((o) => o && isWallMount(o));
  const keep = new Set();
  list.forEach((obj) => {
    keep.add(obj.id);
    let el = layer.querySelector('[data-el-id="' + obj.id + '"]');
    if (!el) {
      el = document.createElement('button');
      el.type = 'button';
      el.className = 'cld-electric-plan-mark';
      el.setAttribute('data-el-id', obj.id);
      el.title = obj.name || 'Электрика';
      layer.appendChild(el);
    }
    const scr = electricPlanScreenPos(obj);
    if (!scr) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    el.classList.toggle('is-selected', obj.id === selectedObjectId);
    el.style.left = scr.x + 'px';
    el.style.top = scr.y + 'px';
  });
  layer.querySelectorAll('[data-el-id]').forEach((el) => {
    if (!keep.has(el.getAttribute('data-el-id'))) el.remove();
  });
}

function ensureElectricDim(id, cls) {
  const box = window.sceneIconsContainer;
  if (!box) return null;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = cls;
    box.appendChild(el);
  }
  return el;
}

function placeScreenLabel(el, scr, rotDeg) {
  if (!el || !scr) {
    if (el) el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  el.style.left = Math.round(scr.x) + 'px';
  el.style.top = Math.round(scr.y) + 'px';
  el.style.transform =
    'translate(-50%, -50%)' + (rotDeg ? ' rotate(' + rotDeg + 'deg)' : '');
}

/** Нормали стены в мм комнаты: out — наружу, in — в комнату, along — вдоль стены. */
function wallAxesMm(side) {
  if (side === 'back') return { ox: 0, oz: -1, ix: 0, iz: 1, ax: 1, az: 0 };
  if (side === 'front') return { ox: 0, oz: 1, ix: 0, iz: -1, ax: 1, az: 0 };
  if (side === 'left') return { ox: -1, oz: 0, ix: 1, iz: 0, ax: 0, az: 1 };
  return { ox: 1, oz: 0, ix: -1, iz: 0, ax: 0, az: 1 };
}

/** «Влево» на экране вдоль стены — выбираем знак along по screen X. */
function alongLeftSign(pose, y, ax, az) {
  const p0 = projectToScreen(worldPoint(pose.x, y, pose.z));
  const p1 = projectToScreen(worldPoint(pose.x + ax * 80, y, pose.z + az * 80));
  if (!p0 || !p1) return -1;
  return p1.x < p0.x ? 1 : -1;
}

/**
 * IKEA 2D — все оффсеты в мм мира (не px), иначе при зуме «плывёт».
 * move на внутренней грани; 81 снаружи || стене; 14 внутри ⊥ + влево от круга.
 */
function refreshElectricArrows() {
  let bar = document.getElementById('cld-electric-arrows');
  if (bar) bar.style.display = 'none';

  const op = selectedObject();
  const show = op && isWallMount(op) && isObjectsMode();
  const dimW = ensureElectricDim('cld-electric-dim-w', 'cld-electric-dim');
  const dimD = ensureElectricDim('cld-electric-dim-d', 'cld-electric-dim');
  let giz = document.getElementById('cld-electric-gizmo');

  if (!show) {
    if (dimW) dimW.style.display = 'none';
    if (dimD) dimD.style.display = 'none';
    if (giz) giz.style.display = 'none';
    return;
  }

  const box = window.sceneIconsContainer;
  if (!box) return;
  if (!giz) {
    giz = document.createElement('div');
    giz.id = 'cld-electric-gizmo';
    giz.className = 'cld-electric-gizmo';
    giz.innerHTML =
      '<button type="button" class="cld-electric-gizmo__btn cld-electric-gizmo__btn--move" data-el-gizmo="move" title="Переместить" aria-label="Переместить">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" stroke="#222" stroke-width="2" stroke-linecap="round"/>' +
      '</svg></button>' +
      '<button type="button" class="cld-electric-gizmo__btn" data-el-gizmo="rotate" title="Повернуть" aria-label="Повернуть">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M4 12a8 8 0 0 1 13.5-5.7M20 12a8 8 0 0 1-13.5 5.7" stroke="#222" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M17 3v4h4M7 21v-4H3" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></button>';
    giz.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('[data-el-gizmo]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const cur = selectedObject();
      if (!cur || !isWallMount(cur)) return;
      const act = btn.getAttribute('data-el-gizmo');
      if (act === 'move') {
        startElectricWallDrag(e, cur);
        return;
      }
      if (act === 'rotate') {
        cur.rotationDeg = ((Number(cur.rotationDeg) || 0) + 90) % 360;
        applyToRoom();
        syncObjectEditor();
      }
    });
    box.appendChild(giz);
  }

  const room = state.room;
  const side = wallCardinal(room, op.wallName);
  const pose = wallMountPose(room, op, 4);
  const y = isTopView2d() ? 12 : pose.y;
  const axes = wallAxesMm(side);
  const left = alongLeftSign(pose, y, axes.ax, axes.az);
  const verticalWall = side === 'left' || side === 'right';
  const wRot = side === 'left' ? -90 : side === 'right' ? 90 : 0;
  const dRot = verticalWall ? 0 : -90;

  // мир (мм) + минимальный зазор на экране (px) — иначе на малом зуме мм «схлопываются» в круг
  const OUT_MM = 100;
  const IN_MOVE_MM = 4;
  const CLEAR_14_PX = 58;
  const CLEAR_81_PX = 36;

  const moveX = pose.x + axes.ix * IN_MOVE_MM;
  const moveZ = pose.z + axes.iz * IN_MOVE_MM;
  const scrMove = projectToScreen(worldPoint(moveX, y, moveZ));
  if (!scrMove) {
    if (dimW) dimW.style.display = 'none';
    if (dimD) dimD.style.display = 'none';
    giz.style.display = 'none';
    return;
  }

  const scrLeftProbe = projectToScreen(
    worldPoint(moveX + axes.ax * left * 80, y, moveZ + axes.az * left * 80)
  );
  const scrOutProbe = projectToScreen(
    worldPoint(pose.x + axes.ox * 80, y, pose.z + axes.oz * 80)
  );
  function dirFrom(from, to, fallback) {
    if (!to) return fallback;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.01) return fallback;
    return { x: dx / len, y: dy / len };
  }
  const leftDir = dirFrom(scrMove, scrLeftProbe, { x: -1, y: 0 });
  const outDir = dirFrom(scrMove, scrOutProbe, { x: 0, y: -1 });

  const scrRotDir = projectToScreen(
    worldPoint(moveX - axes.ax * left * 40, y, moveZ - axes.az * left * 40)
  );
  const rotRight = !scrRotDir || scrRotDir.x >= scrMove.x;
  // центр белого круга move (40px), не край flex-группы
  const moveCx = scrMove.x;
  const moveCy = scrMove.y;
  giz.style.display = 'flex';
  giz.style.flexDirection = rotRight ? 'row' : 'row-reverse';
  giz.style.left = Math.round(moveCx) + 'px';
  giz.style.top = Math.round(moveCy) + 'px';
  // якорь = центр первой кнопки (move 40px)
  giz.style.transform = rotRight
    ? 'translate(-20px, -50%)'
    : 'translate(calc(-100% + 20px), -50%)';

  // в режиме «Положение» — только линии положения (как IKEA), не 14/81
  if (isTopView2d() && panelMode !== 'position') {
    if (dimW) {
      dimW.textContent = formatMmLabel(op.widthMm || 81);
      let wScr = projectToScreen(
        worldPoint(pose.x + axes.ox * OUT_MM, y, pose.z + axes.oz * OUT_MM)
      );
      if (!wScr) {
        wScr = {
          x: moveCx + outDir.x * CLEAR_81_PX,
          y: moveCy + outDir.y * CLEAR_81_PX,
        };
      } else {
        const d = Math.hypot(wScr.x - moveCx, wScr.y - moveCy);
        if (d < CLEAR_81_PX) {
          wScr = {
            x: moveCx + outDir.x * CLEAR_81_PX,
            y: moveCy + outDir.y * CLEAR_81_PX,
          };
        }
      }
      placeScreenLabel(dimW, wScr, wRot);
    }
    if (dimD) {
      dimD.textContent = formatMmLabel(op.depthMm || 14);
      placeScreenLabel(
        dimD,
        {
          x: moveCx + leftDir.x * CLEAR_14_PX,
          y: moveCy + leftDir.y * CLEAR_14_PX,
        },
        dRot
      );
    }
  } else {
    if (dimW) dimW.style.display = 'none';
    if (dimD) dimD.style.display = 'none';
  }
}

function refreshObjectGizmo() {
  const op = selectedObject();
  refreshElectricPlanMarkers();
  refreshElectricArrows();

  // Стена (электрика/радиатор): «Положение» — линии в 2D и 3D как IKEA
  if (op && isWallMount(op) && isObjectsMode()) {
    const g = document.getElementById('cld-object-gizmo');
    if (g) g.style.display = 'none';
    if (panelMode === 'position') {
      drawWallMountPositionLines(op, state.room);
      syncPositionTip(true);
    } else {
      clearPositionOffsetLines();
      clearWallPosLabels();
      syncPositionTip(false);
    }
    return;
  }

  // 2D-gizmo рамка только для напольных объектов
  if (!op || !isObjectsMode() || !isTopView2d()) {
    const g = document.getElementById('cld-object-gizmo');
    if (g) g.style.display = 'none';
    clearPositionOffsetLines();
    clearWallPosLabels();
    syncPositionTip(false);
    return;
  }
  const g = ensureObjectGizmo();
  if (!g) return;
  const { hx, hz } = halfFootprint(op);
  const y = 10;
  const corners = {
    nw: projectToScreen(worldPoint(op.xMm - hx, op.zMm - hz, y)),
    ne: projectToScreen(worldPoint(op.xMm + hx, op.zMm - hz, y)),
    sw: projectToScreen(worldPoint(op.xMm - hx, op.zMm + hz, y)),
    se: projectToScreen(worldPoint(op.xMm + hx, op.zMm + hz, y)),
  };
  const c = projectToScreen(worldPoint(op.xMm, op.zMm, y));
  const top = projectToScreen(worldPoint(op.xMm, op.zMm - hz, y));
  const right = projectToScreen(worldPoint(op.xMm + hx, op.zMm, y));
  if (!c || !corners.nw || !corners.se) {
    g.style.display = 'none';
    return;
  }
  const left = Math.min(corners.nw.x, corners.ne.x, corners.sw.x, corners.se.x);
  const rightX = Math.max(corners.nw.x, corners.ne.x, corners.sw.x, corners.se.x);
  const topY = Math.min(corners.nw.y, corners.ne.y, corners.sw.y, corners.se.y);
  const botY = Math.max(corners.nw.y, corners.ne.y, corners.sw.y, corners.se.y);
  const frame = g.querySelector('.cld-object-gizmo__frame');
  if (frame) {
    frame.style.left = left + 'px';
    frame.style.top = topY + 'px';
    frame.style.width = Math.max(8, rightX - left) + 'px';
    frame.style.height = Math.max(8, botY - topY) + 'px';
  }
  const move = g.querySelector('.cld-object-gizmo__move');
  if (move) {
    move.style.left = c.x + 'px';
    move.style.top = c.y + 'px';
  }
  g.querySelectorAll('[data-corner]').forEach((btn) => {
    const k = btn.getAttribute('data-corner');
    const p = corners[k];
    if (!p) return;
    btn.style.left = p.x + 'px';
    btn.style.top = p.y + 'px';
  });
  const dimW = g.querySelector('[data-dim="w"]');
  const dimD = g.querySelector('[data-dim="d"]');
  fillDimLabel(dimW, 'w', op.widthMm, top ? top.x : 0, top ? top.y - 20 : 0);
  fillDimLabel(dimD, 'd', op.depthMm, right ? right.x + 24 : 0, right ? right.y : 0);

  // IKEA «Положение»: линии от граней объекта до стен + плашки mm
  const room = state.room;
  const showOff = panelMode === 'position' && room;
  drawPositionOffsetLines(g, op, room, showOff, y);
  syncPositionTip(showOff);
  g.style.display = 'block';
}

const OBJ_SVG_NS = 'http://www.w3.org/2000/svg';

function ensureObjectDimSvg() {
  const box = window.sceneIconsContainer;
  if (!box) return null;
  let svg = document.getElementById('cld-object-dim-svg');
  if (!svg) {
    svg = document.createElementNS(OBJ_SVG_NS, 'svg');
    svg.id = 'cld-object-dim-svg';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:31;overflow:hidden';
    const layer = document.createElementNS(OBJ_SVG_NS, 'g');
    layer.id = 'cld-object-dim-lines';
    svg.appendChild(layer);
    box.appendChild(svg);
  }
  return svg;
}

function clearPositionOffsetLines() {
  const layer = document.getElementById('cld-object-dim-lines');
  if (layer) layer.replaceChildren();
  const svg = document.getElementById('cld-object-dim-svg');
  if (svg) svg.style.display = 'none';
}

function clearWallPosLabels() {
  const box = document.getElementById('cld-wall-pos-labels');
  if (box) box.style.display = 'none';
}

function ensureWallPosLabels() {
  const box = window.sceneIconsContainer;
  if (!box) return null;
  let wrap = document.getElementById('cld-wall-pos-labels');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'cld-wall-pos-labels';
    wrap.className = 'cld-wall-pos-labels';
    ;['alongL', 'alongR', 'floor', 'ceil', 'opp'].forEach((k) => {
      const el = document.createElement('div');
      el.className = 'cld-object-gizmo__dim is-editable';
      el.setAttribute('data-wall-off', k);
      el.setAttribute('data-dim', 'wall_' + k);
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      wrap.appendChild(el);
    });
    wrap.addEventListener('click', (e) => {
      const el = e.target.closest('[data-wall-off]');
      if (!el || e.target.tagName === 'INPUT') return;
      e.preventDefault();
      e.stopPropagation();
      startDimEdit('wall_' + el.getAttribute('data-wall-off'));
    });
    box.appendChild(wrap);
  }
  wrap.style.display = 'block';
  return wrap;
}

/**
 * IKEA «Положение» для стены: до пола, потолка, влево/вправо вдоль стены,
 * диагональ до дальнего угла на полу + mm-плашки.
 */
function drawWallMountPositionLines(op, room) {
  if (!op || !room || !isWallMount(op)) {
    clearPositionOffsetLines();
    clearWallPosLabels();
    return;
  }
  if (!op.wallName) op.wallName = pickDefaultWall(room);
  const svg = ensureObjectDimSvg();
  const layer = document.getElementById('cld-object-dim-lines');
  const labels = ensureWallPosLabels();
  if (!svg || !layer || !labels) return;
  svg.style.display = 'block';
  layer.replaceChildren();

  const pose = wallMountPose(room, op);
  const side = pose.side || wallCardinal(room, op.wallName);
  const len = wallLengthMm(room, op.wallName);
  const origin = room.wallAlongOrigin ? room.wallAlongOrigin(op.wallName) : 0;
  const halfW = Math.max(1, (Number(op.widthMm) || 81) / 2);
  const elev = Number(op.elevMm) || 0;
  const h = Number(op.heightMm) || 81;
  const alongL = Math.max(0, Math.round(op.alongMm - halfW));
  const alongR = Math.max(0, Math.round(len - op.alongMm - halfW));
  const toFloor = Math.max(0, Math.round(elev));
  const toCeil = Math.max(0, Math.round(room.height - elev - h));

  const cx = pose.x;
  const cy = elev + h / 2;
  const cz = pose.z;
  const yBot = elev;
  const yTop = elev + h;

  let objL;
  let objR;
  let wallL;
  let wallR;
  if (side === 'back' || side === 'front') {
    objL = { x: origin + op.alongMm - halfW, y: cy, z: cz };
    objR = { x: origin + op.alongMm + halfW, y: cy, z: cz };
    wallL = { x: origin, y: cy, z: cz };
    wallR = { x: origin + len, y: cy, z: cz };
  } else {
    objL = { x: cx, y: cy, z: origin + op.alongMm - halfW };
    objR = { x: cx, y: cy, z: origin + op.alongMm + halfW };
    wallL = { x: cx, y: cy, z: origin };
    wallR = { x: cx, y: cy, z: origin + len };
  }

  const bot = { x: cx, y: yBot, z: cz };
  const top = { x: cx, y: yTop, z: cz };
  const floorPt = { x: cx, y: 0, z: cz };
  const ceilPt = { x: cx, y: room.height, z: cz };

  // до противоположной стены (нормаль внутрь комнаты)
  let opp;
  let oppMm;
  if (side === 'back') {
    opp = { x: cx, y: cy, z: room.depth };
    oppMm = Math.max(0, Math.round(room.depth - cz));
  } else if (side === 'front') {
    opp = { x: cx, y: cy, z: 0 };
    oppMm = Math.max(0, Math.round(cz));
  } else if (side === 'left') {
    opp = { x: room.width, y: cy, z: cz };
    oppMm = Math.max(0, Math.round(room.width - cx));
  } else {
    opp = { x: 0, y: cy, z: cz };
    oppMm = Math.max(0, Math.round(cx));
  }
  const wallFace = { x: cx, y: cy, z: cz };

  function wp(p) {
    return projectToScreen(worldPoint(p.x, p.z, p.y));
  }

  const segs = [
    { key: 'alongL', mm: alongL, a: wp(wallL), b: wp(objL), mid: null },
    { key: 'alongR', mm: alongR, a: wp(objR), b: wp(wallR), mid: null },
    { key: 'floor', mm: toFloor, a: wp(floorPt), b: wp(bot), mid: null },
    { key: 'ceil', mm: toCeil, a: wp(top), b: wp(ceilPt), mid: null },
    { key: 'opp', mm: oppMm, a: wp(wallFace), b: wp(opp), mid: null },
  ];
  segs.forEach((s) => {
    if (s.a && s.b) {
      s.mid = { x: (s.a.x + s.b.x) / 2, y: (s.a.y + s.b.y) / 2 };
      if (s.mm > 0.5) addOffsetLineSeg(layer, s.a, s.b, dimEditing === 'wall_' + s.key);
    }
    const el = labels.querySelector('[data-wall-off="' + s.key + '"]');
    if (!el || !s.mid) {
      if (el) el.style.display = 'none';
      return;
    }
    el.style.display = '';
    fillDimLabel(el, 'wall_' + s.key, s.mm, s.mid.x, s.mid.y);
  });
}

function addOffsetLineSeg(layer, a, b, active) {
  if (!a || !b) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const stroke = active ? '#111' : '#222';
  const sw = active ? '2' : '1.5';
  const g = document.createElementNS(OBJ_SVG_NS, 'g');
  const main = document.createElementNS(OBJ_SVG_NS, 'line');
  main.setAttribute('x1', String(a.x));
  main.setAttribute('y1', String(a.y));
  main.setAttribute('x2', String(b.x));
  main.setAttribute('y2', String(b.y));
  main.setAttribute('stroke', stroke);
  main.setAttribute('stroke-width', sw);
  g.appendChild(main);
  // кружки на концах как у IKEA
  [a, b].forEach((p) => {
    const c = document.createElementNS(OBJ_SVG_NS, 'circle');
    c.setAttribute('cx', String(p.x));
    c.setAttribute('cy', String(p.y));
    c.setAttribute('r', '4');
    c.setAttribute('fill', '#fff');
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', '1.5');
    g.appendChild(c);
  });
  layer.appendChild(g);
}

function drawPositionOffsetLines(gizmo, op, room, show, y) {
  ensureOffsetDims(gizmo);
  gizmo.querySelectorAll('[data-off]').forEach((el) => {
    el.style.display = show ? '' : 'none';
  });
  if (!show || !room || !op) {
    clearPositionOffsetLines();
    return;
  }
  const svg = ensureObjectDimSvg();
  const layer = document.getElementById('cld-object-dim-lines');
  if (!svg || !layer) return;
  svg.style.display = 'block';
  layer.replaceChildren();

  const { hx, hz } = halfFootprint(op);
  const offL = Math.max(0, Math.round(op.xMm - hx));
  const offR = Math.max(0, Math.round(room.width - (op.xMm + hx)));
  const offT = Math.max(0, Math.round(op.zMm - hz));
  const offB = Math.max(0, Math.round(room.depth - (op.zMm + hz)));

  // линии: стена → грань объекта
  const segs = [
    {
      key: 'L',
      axis: 'offL',
      mm: offL,
      vertical: true,
      a: projectToScreen(worldPoint(0, op.zMm, y)),
      b: projectToScreen(worldPoint(op.xMm - hx, op.zMm, y)),
      mid: projectToScreen(worldPoint((op.xMm - hx) / 2, op.zMm, y)),
    },
    {
      key: 'R',
      axis: 'offR',
      mm: offR,
      vertical: true,
      a: projectToScreen(worldPoint(op.xMm + hx, op.zMm, y)),
      b: projectToScreen(worldPoint(room.width, op.zMm, y)),
      mid: projectToScreen(worldPoint(op.xMm + hx + offR / 2, op.zMm, y)),
    },
    {
      key: 'T',
      axis: 'offT',
      mm: offT,
      vertical: false,
      a: projectToScreen(worldPoint(op.xMm, 0, y)),
      b: projectToScreen(worldPoint(op.xMm, op.zMm - hz, y)),
      mid: projectToScreen(worldPoint(op.xMm, (op.zMm - hz) / 2, y)),
    },
    {
      key: 'B',
      axis: 'offB',
      mm: offB,
      vertical: false,
      a: projectToScreen(worldPoint(op.xMm, op.zMm + hz, y)),
      b: projectToScreen(worldPoint(op.xMm, room.depth, y)),
      mid: projectToScreen(worldPoint(op.xMm, op.zMm + hz + offB / 2, y)),
    },
  ];

  segs.forEach((s) => {
    const active = dimEditing === s.axis;
    if (s.mm > 0.5) addOffsetLineSeg(layer, s.a, s.b, active);
    const el = gizmo.querySelector('[data-off="' + s.key + '"]');
    if (!el || !s.mid) return;
    el.classList.toggle('is-vertical', s.vertical && dimEditing !== s.axis);
    fillDimLabel(el, s.axis, s.mm, s.mid.x, s.mid.y);
  });
}

function ensureOffsetDims(g) {
  if (g.querySelector('[data-off="L"]')) return;
  ['L', 'R', 'T', 'B'].forEach((k) => {
    const el = document.createElement('div');
    el.className =
      'cld-object-gizmo__dim is-editable' + (k === 'L' || k === 'R' ? ' is-vertical' : '');
    el.setAttribute('data-off', k);
    el.setAttribute('data-dim', 'off' + k);
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    g.appendChild(el);
  });
}

function syncPositionTip(show) {
  let tip = document.getElementById('cld-object-position-tip');
  if (!show) {
    if (tip) tip.hidden = true;
    return;
  }
  const box = window.sceneIconsContainer;
  if (!box) return;
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'cld-object-position-tip';
    tip.className = 'cld-object-position-tip';
    tip.innerHTML =
      '<strong>Изменить положение</strong>' +
      '<p><b>Влево / вправо</b> — клик по числу на горизонтальной линии вдоль стены и введите расстояние от края (mm). ' +
      'Или перетащите объект по стене (в 3D — за крестик «Переместить» или за сам объект).</p>' +
      '<p><b>Вверх / вниз</b> — клик по числу на вертикальной линии (до пола или до потолка). ' +
      'В 3D можно тянуть объект вверх-вниз тем же перетаскиванием.</p>' +
      '<button type="button" class="cld-object-position-tip__hide">Скрыть</button>';
    tip.querySelector('.cld-object-position-tip__hide').addEventListener('click', (e) => {
      e.stopPropagation();
      tip.hidden = true;
    });
    box.appendChild(tip);
  }
  tip.hidden = false;
}

function fillDimLabel(el, axis, mm, x, y) {
  if (!el) return;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  const editing = dimEditing === axis;
  el.classList.toggle('is-editing', editing);
  el.classList.toggle('is-active', editing);
  // IKEA: при клике вертикальная плашка ложится горизонтально для ввода
  const wasVertical = el.classList.contains('is-vertical') || axis === 'd' || axis === 'offL' || axis === 'offR';
  if (wasVertical || axis === 'd' || axis === 'offL' || axis === 'offR') {
    el.classList.toggle('is-vertical', !editing && (axis === 'd' || axis === 'offL' || axis === 'offR'));
    el.classList.toggle('is-edit-flat', editing);
  }
  if (editing) {
    if (!el.querySelector('input')) {
      el.textContent = '';
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.className = 'cld-object-gizmo__dim-input';
      input.value = String(Math.round(mm));
      input.setAttribute('aria-label', axis === 'w' ? 'Ширина, mm' : 'Глубина, mm');
      input.addEventListener('mousedown', (e) => e.stopPropagation());
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          stopDimEdit(input);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          dimEditing = null;
          refreshObjectGizmo();
        }
      });
      input.addEventListener('blur', () => {
        if (dimEditing === axis) stopDimEdit(input);
      });
      el.appendChild(input);
    }
  } else if (!el.querySelector('input')) {
    el.textContent = formatMmLabel(mm);
  } else if (dimEditing !== axis) {
    el.textContent = formatMmLabel(mm);
  }
}

function startGizmoLoop() {
  if (gizmoRaf) return;
  const tick = () => {
    gizmoRaf = 0;
    if (!isObjectsMode()) {
      clearObjectGizmo();
      return;
    }
    refreshObjectGizmo();
    gizmoRaf = requestAnimationFrame(tick);
  };
  gizmoRaf = requestAnimationFrame(tick);
}

function stopGizmoLoop() {
  if (gizmoRaf) cancelAnimationFrame(gizmoRaf);
  gizmoRaf = 0;
  clearObjectGizmo();
}

function renderCategories() {
  const el = document.getElementById('cld-room-edit-object-categories');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(
    (c) =>
      '<button type="button" class="cld-object-cat' +
      (c.id === activeCategory ? ' is-active' : '') +
      (!c.enabled ? ' is-disabled' : '') +
      '" data-cat="' +
      c.id +
      '" ' +
      (!c.enabled ? 'disabled' : '') +
      '>' +
      c.label +
      '</button>'
  ).join('');
  el.querySelectorAll('[data-cat]').forEach((btn) => {
    if (btn._objBound) return;
    btn._objBound = true;
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cat');
      const cat = CATEGORIES.find((x) => x.id === id);
      if (!cat || !cat.enabled) return;
      activeCategory = id;
      renderCategories();
      renderCatalog();
    });
  });
}

function renderCatalog() {
  const el = document.getElementById('cld-room-edit-catalog-objects');
  if (!el) return;
  const items = catalogFor(activeCategory);
  if (!items.length) {
    el.innerHTML = '<p class="cld-room-edit-note">Раздел в разработке.</p>';
    return;
  }
  el.innerHTML = items
    .map((item) => {
      const sel = selectedCatalog && selectedCatalog.id === item.id;
      return (
        '<button type="button" class="cld-room-edit-card cld-object-card' +
        (sel ? ' is-selected' : '') +
        '" data-id="' +
        item.id +
        '">' +
        '<span class="cld-object-card__thumb">' +
        (item.thumb
          ? '<img src="' + item.thumb + '" alt="" loading="lazy">'
          : '<span class="cld-object-card__ph"></span>') +
        '</span>' +
        '<span class="cld-object-card__text">' +
        '<span class="cld-object-card__name">' +
        item.name +
        '</span>' +
        '<span class="cld-object-card__desc">' +
        item.desc +
        '</span>' +
        '</span></button>'
      );
    })
    .join('');
  el.querySelectorAll('.cld-object-card').forEach((card) => {
    if (card._objBound) return;
    card._objBound = true;
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const item = findCatalogItem(id);
      if (!item) return;
      setSelectedObjectCatalog(item);
      el.querySelectorAll('.cld-object-card').forEach((c) => {
        c.classList.toggle('is-selected', c === card);
      });
    });
  });
}

function syncObjectEditor() {
  const editor = document.getElementById('cld-room-edit-object-editor');
  const catalog = document.getElementById('cld-room-edit-catalog-objects');
  const cats = document.getElementById('cld-room-edit-object-categories');
  const hint = document.getElementById('cld-room-edit-objects-hint');
  const titleMain = document.getElementById('cld-room-edit-objects-title');
  const sizeFields = document.getElementById('cld-object-size-fields');
  const op = selectedObject();
  if (op && state.room && !isWallMount(op)) {
    const roomH = state.room.height || 2500;
    if (op.heightMm === roomH - 20) {
      op.heightMm = roomH;
      applyToRoom();
    }
  }
  // стена: поднять на типовую высоту (электрика / вентиляция — разные)
  if (op && state.room && isWallMount(op) && !isHeatingObj(op)) {
    let fixed = false;
    let defElev = 1100;
    if (isVentilationObj(op)) defElev = 2200;
    else if (isPipesObj(op)) defElev = 550;
    else if (op.kind && String(op.kind).indexOf('socket') >= 0) defElev = 300;
    else if (!isElectricObj(op)) defElev = op.elevMm || 1100;
    if (!Number.isFinite(op.elevMm) || op.elevMm < 80) {
      op.elevMm = defElev;
      fixed = true;
    }
    const len = wallLengthMm(state.room, op.wallName || pickDefaultWall(state.room));
    if (!op.wallName) {
      op.wallName = pickDefaultWall(state.room);
      fixed = true;
    }
    if (!Number.isFinite(op.alongMm) || op.alongMm < 0 || op.alongMm > len) {
      op.alongMm = len / 2;
      fixed = true;
    }
    if (fixed) applyToRoom();
  }
  const showEditor = !!op && !catalogBrowse;

  if (editor) editor.hidden = !showEditor;
  if (catalog) catalog.hidden = showEditor;
  if (cats) cats.hidden = showEditor;
  if (titleMain) titleMain.hidden = showEditor;
  if (hint) {
    hint.hidden = showEditor;
    if (!showEditor) {
      hint.textContent = 'Выберите объект в каталоге — он появится в комнате. Потом можно двигать.';
    }
  }

  document.body.classList.remove('cld-room-edit-placing-object');

  if (!op) {
    panelMode = null;
    syncPositionTip(false);
    renderCatalog();
    refreshObjectGizmo();
    return;
  }

  const title = document.getElementById('cld-room-edit-object-editor-title');
  const desc = document.getElementById('cld-room-edit-object-editor-desc');
  const wEl = document.getElementById('cld-room-edit-object-w');
  const dEl = document.getElementById('cld-room-edit-object-d');
  const hEl = document.getElementById('cld-room-edit-object-h');
  const dWrap = document.getElementById('cld-room-edit-object-d-wrap');
  const wLabel = document.getElementById('cld-room-edit-object-w-label');

  if (title) title.textContent = op.name || 'Объект';
  if (desc) desc.textContent = op.desc || 'Регулируемый конструктивный элемент';

  document.querySelectorAll('.cld-object-action').forEach((btn) => {
    const act = btn.getAttribute('data-obj-action');
    btn.classList.toggle('is-active', act === panelMode);
  });

  if (sizeFields) sizeFields.hidden = panelMode !== 'edit';
  const isRound = isRoundKind(op.kind);
  const wallEl = isWallMount(op);
  if (dWrap) {
    dWrap.hidden = isRound;
    const dLab = dWrap.querySelector('label');
    if (dLab) dLab.textContent = wallEl ? 'Глубина' : 'Глубина';
  }
  if (wLabel) wLabel.textContent = isRound ? 'Диаметр' : 'Ширина';
  const hLab = document.querySelector('label[for="cld-room-edit-object-h"]');
  if (hLab) hLab.textContent = 'Высота';
  // IKEA: размеры в mm
  if (wEl) wEl.value = String(Math.round(op.widthMm));
  if (dEl && !isRound) dEl.value = String(Math.round(op.depthMm));
  if (hEl) hEl.value = String(Math.round(op.heightMm));

  refreshObjectGizmo();
  refreshElectricArrows();
}

function parseMmInput(v) {
  const n = Number(String(v).replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function onEditorInput() {
  const op = selectedObject();
  if (!op || !state.room) return;
  const wEl = document.getElementById('cld-room-edit-object-w');
  const dEl = document.getElementById('cld-room-edit-object-d');
  const hEl = document.getElementById('cld-room-edit-object-h');
  const w = parseMmInput(wEl && wEl.value);
  const d = parseMmInput(dEl && dEl.value);
  const h = parseMmInput(hEl && hEl.value);
  const roomH = state.room.height || 2500;
  if (isWallMount(op)) {
    const maxW = isHeatingObj(op) ? 2500 : isPipesObj(op) ? 400 : 600;
    const maxD = isHeatingObj(op) ? 400 : isPipesObj(op) ? 200 : 80;
    const maxH = isHeatingObj(op) ? 2000 : isPipesObj(op) ? 200 : 600;
    if (w != null) op.widthMm = Math.max(20, Math.min(maxW, w));
    if (d != null) op.depthMm = Math.max(4, Math.min(maxD, d));
    if (h != null) op.heightMm = Math.max(20, Math.min(maxH, h));
    op.elevMm = Math.max(20, Math.min(roomH - op.heightMm - 20, op.elevMm || 0));
  } else {
    const pipeFloor = isPipesObj(op);
    const minFoot = pipeFloor ? 12 : MIN_SIZE_MM;
    if (w != null) {
      op.widthMm = Math.max(minFoot, Math.min(MAX_SIZE_MM, Math.round(w)));
      if (isRoundKind(op.kind)) op.depthMm = op.widthMm;
    }
    if (d != null && !isRoundKind(op.kind)) {
      op.depthMm = Math.max(minFoot, Math.min(MAX_SIZE_MM, Math.round(d)));
    }
    if (h != null) {
      op.heightMm = Math.max(pipeFloor ? 10 : MIN_SIZE_MM, Math.min(roomH, h));
    }
    const pos = clampInRoom(state.room, op.xMm, op.zMm, op);
    op.xMm = pos.x;
    op.zMm = pos.z;
  }
  applyToRoom();
  syncObjectEditor();
}

function onEditorDelete() {
  if (!selectedObjectId) return;
  state.roomEditObjects = objects().filter((o) => o.id !== selectedObjectId);
  selectedObjectId = null;
  catalogBrowse = false;
  panelMode = null;
  applyToRoom();
  syncObjectEditor();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('room_object_delete');
    }
  } catch (_) {}
}

function onObjectCopy() {
  const op = selectedObject();
  if (!op || !state.room) return;
  const copy = {
    ...op,
    id: makeId(),
    xMm: op.xMm + Math.max(40, op.widthMm * 0.15),
    zMm: op.zMm + Math.max(40, op.depthMm * 0.15),
  };
  const pos = clampInRoom(state.room, copy.xMm, copy.zMm, copy);
  copy.xMm = pos.x;
  copy.zMm = pos.z;
  objects().push(copy);
  selectedObjectId = copy.id;
  panelMode = null;
  applyToRoom();
  syncObjectEditor();
}

function onObjectAction(act) {
  if (act === 'edit') {
    panelMode = panelMode === 'edit' ? null : 'edit';
    syncObjectEditor();
    return;
  }
  if (act === 'position') {
    panelMode = panelMode === 'position' ? null : 'position';
    syncObjectEditor();
    return;
  }
  if (act === 'copy') {
    onObjectCopy();
    return;
  }
  if (act === 'delete') {
    onEditorDelete();
  }
}

function setSelectedObjectCatalog(item) {
  selectedCatalog = item ? { ...item } : null;
  if (!item) {
    syncObjectEditor();
    return;
  }
  const op = selectedObject();
  if (op && isWallMount(op) === isWallMount(item)) {
    const def = catalogDefaults(item);
    if (isWallMount(op)) {
      Object.assign(op, def, {
        id: op.id,
        wallName: op.wallName,
        alongMm: op.alongMm,
        elevMm: op.elevMm,
        rotationDeg: op.rotationDeg || 0,
      });
    } else {
      Object.assign(op, def, {
        id: op.id,
        xMm: op.xMm,
        zMm: op.zMm,
        rotationDeg: op.rotationDeg || 0,
      });
    }
    catalogBrowse = false;
    selectedCatalog = null;
    applyToRoom();
    syncObjectEditor();
    return;
  }
  // IKEA: клик ЛКМ по карточке сразу ставит объект в комнату (не drag, не второй клик)
  selectedObjectId = null;
  catalogBrowse = false;
  if (placeAtCenter(item)) return;
  selectedCatalog = null;
  syncObjectEditor();
}

function applyResizeFromPointer(pt) {
  const op = selectedObject();
  if (!op || !resizeCorner || !resizeStart || !pt) return;
  const dx = pt.xMm - resizeStart.mx;
  const dz = pt.zMm - resizeStart.mz;
  let w = resizeStart.w;
  let d = resizeStart.d;
  let x = resizeStart.x;
  let z = resizeStart.z;
  // opposite corner fixed
  if (resizeCorner === 'se') {
    w = clampSize(resizeStart.w + dx * 2);
    d = clampSize(resizeStart.d + dz * 2);
  } else if (resizeCorner === 'sw') {
    w = clampSize(resizeStart.w - dx * 2);
    d = clampSize(resizeStart.d + dz * 2);
  } else if (resizeCorner === 'ne') {
    w = clampSize(resizeStart.w + dx * 2);
    d = clampSize(resizeStart.d - dz * 2);
  } else if (resizeCorner === 'nw') {
    w = clampSize(resizeStart.w - dx * 2);
    d = clampSize(resizeStart.d - dz * 2);
  }
  if (isRoundKind(op.kind)) {
    const s = Math.round((w + d) / 2);
    w = s;
    d = s;
  }
  op.widthMm = w;
  op.depthMm = d;
  const pos = clampInRoom(state.room, x, z, op);
  op.xMm = pos.x;
  op.zMm = pos.z;
  dragMoved = true;
  applyToRoom();
}

function onCanvasMouseDown(e) {
  if (!isObjectsMode()) return;
  if (e.button !== 0) return;
  const hitId = hitRoomObject(e);
  if (!hitId) return;
  const op = objects().find((o) => o.id === hitId);
  if (!op) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  selectedObjectId = hitId;
  selectedCatalog = null;
  catalogBrowse = false;
  if (panelMode !== 'edit' && panelMode !== 'position') panelMode = null;
  dragObjectId = hitId;
  dragMoved = false;
  resizeCorner = null;
  resizeStart = null;
  controlsWasEnabled = state.controls ? state.controls.enabled !== false : true;
  setControlsEnabled(false);
  document.body.classList.add('cld-room-edit-dragging-object');
  if (isWallMount(op)) {
    const wh = hitWallForObject(e, op.wallName);
    dragOffset.x = wh ? wh.alongMm - op.alongMm : 0;
    dragOffset.z = wh ? wh.elevMm - (op.elevMm + op.heightMm / 2) : 0;
  } else {
    if (!isTopView2d()) {
      dragObjectId = null;
      setControlsEnabled(controlsWasEnabled);
      document.body.classList.remove('cld-room-edit-dragging-object');
      applyToRoom();
      syncObjectEditor();
      return;
    }
    const pt = roomLocalFromEvent(e);
    if (!pt) return;
    dragOffset.x = op.xMm - pt.xMm;
    dragOffset.z = op.zMm - pt.zMm;
  }
  applyToRoom();
  syncObjectEditor();
}

function onCanvasMouseMove(e) {
  if (!isObjectsMode()) return;
  if (!dragObjectId && !resizeCorner) return;
  e.stopImmediatePropagation();
  const op = objects().find((o) => o.id === dragObjectId);
  if (!op) return;
  if (isWallMount(op)) {
    const room = state.room;
    dragMoved = true;
    if (isTopView2d()) {
      const pt = roomLocalFromEvent(e);
      if (!pt) return;
      const len = wallLengthMm(room, op.wallName);
      const half = Math.max(10, op.widthMm / 2);
      const along = alongFromPlanPoint(room, op.wallName, pt.xMm, pt.zMm) - dragOffset.x;
      op.alongMm = Math.max(half, Math.min(len - half, along));
      applyToRoom();
      refreshObjectGizmo();
      return;
    }
    // 3D: всегда проектируем на текущую стену — иначе при скрытой стене «нихера не меняется»
    const wh = hitWallForObject(e, op.wallName);
    if (!wh) return;
    const len = wallLengthMm(room, op.wallName);
    const half = Math.max(10, op.widthMm / 2);
    op.alongMm = Math.max(half, Math.min(len - half, wh.alongMm - dragOffset.x));
    op.elevMm = Math.max(
      40,
      Math.min(room.height - op.heightMm - 40, wh.elevMm - op.heightMm / 2 - dragOffset.z)
    );
    applyToRoom();
    refreshObjectGizmo();
    return;
  }
  if (!isTopView2d()) return;
  const pt = roomLocalFromEvent(e);
  if (!pt) return;
  if (resizeCorner) {
    applyResizeFromPointer(pt);
    return;
  }
  dragMoved = true;
  const pos = clampInRoom(state.room, pt.xMm + dragOffset.x, pt.zMm + dragOffset.z, op);
  op.xMm = pos.x;
  op.zMm = pos.z;
  updateMeshesPosition(op);
  refreshObjectGizmo();
}

function onCanvasMouseUp(e) {
  if (!dragObjectId && !resizeCorner) return;
  if (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
  const wasResize = !!resizeCorner;
  const moved = dragMoved === true;
  dragObjectId = null;
  resizeCorner = null;
  resizeStart = null;
  document.body.classList.remove('cld-room-edit-dragging-object');
  setControlsEnabled(controlsWasEnabled);
  if (wasResize) applyToRoom();
  syncObjectEditor();
  // Stage5: dirty после отпускания drag/resize, не на каждом pointermove.
  if (moved || wasResize) {
    try {
      if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
        window.__cldMarkRoomDraftDirty(wasResize ? 'room_object_resize' : 'room_object_move');
      }
    } catch (_) {}
  }
}

function onCanvasClick(e) {
  if (!isObjectsMode()) return;
  if (e.button !== 0) return;
  if (dragMoved) {
    dragMoved = false;
    e.stopImmediatePropagation();
    e.preventDefault();
    return;
  }
  if (dragObjectId || resizeCorner) return;
  const hitId = hitRoomObject(e);
  if (hitId) {
    e.stopImmediatePropagation();
    e.preventDefault();
    selectedObjectId = hitId;
    selectedCatalog = null;
    catalogBrowse = false;
    applyToRoom();
    syncObjectEditor();
    return;
  }
  if (selectedCatalog) {
    if (isWallMount(selectedCatalog)) {
      const wh = hitWallForObject(e);
      if (wh && placeOnWall(selectedCatalog, wh)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
    } else {
      const pt = roomLocalFromEvent(e);
      if (pt && placeAtPoint(selectedCatalog, pt.xMm, pt.zMm)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
    }
  }
  if (selectedObjectId) {
    e.stopImmediatePropagation();
    e.preventDefault();
    selectedObjectId = null;
    selectedCatalog = null;
    catalogBrowse = false;
    applyToRoom();
    syncObjectEditor();
  }
}

function bindCanvas() {
  const el = state.renderer && state.renderer.domElement;
  if (!el || canvasBound) return;
  el.addEventListener('mousedown', onCanvasMouseDown, true);
  el.addEventListener('mousemove', onCanvasMouseMove, true);
  el.addEventListener('mouseup', onCanvasMouseUp, true);
  el.addEventListener('click', onCanvasClick, true);
  window.addEventListener('mouseup', onCanvasMouseUp, true);
  canvasBound = true;
}

function unbindCanvas() {
  const el = state.renderer && state.renderer.domElement;
  if (!el || !canvasBound) return;
  el.removeEventListener('mousedown', onCanvasMouseDown, true);
  el.removeEventListener('mousemove', onCanvasMouseMove, true);
  el.removeEventListener('mouseup', onCanvasMouseUp, true);
  el.removeEventListener('click', onCanvasClick, true);
  window.removeEventListener('mouseup', onCanvasMouseUp, true);
  canvasBound = false;
  onCanvasMouseUp();
}

function bindEditorOnce() {
  const wEl = document.getElementById('cld-room-edit-object-w');
  const dEl = document.getElementById('cld-room-edit-object-d');
  const hEl = document.getElementById('cld-room-edit-object-h');
  [wEl, dEl, hEl].forEach((el) => {
    if (el && !el._objBound) {
      el._objBound = true;
      el.addEventListener('change', onEditorInput);
    }
  });
  document.querySelectorAll('[data-obj-action]').forEach((btn) => {
    if (btn._objBound) return;
    btn._objBound = true;
    btn.addEventListener('click', () => onObjectAction(btn.getAttribute('data-obj-action')));
  });
}

export function mountRoomEditObjects() {
  bindCanvas();
  bindEditorOnce();
  renderCategories();
  renderCatalog();
  selectedCatalog = null;
  catalogBrowse = false;
  document.body.classList.remove('cld-room-edit-placing-object');
  document.body.classList.remove('cld-room-edit-dragging-object');
  applyToRoom();
  syncObjectEditor();
  startGizmoLoop();
}

export function unmountRoomEditObjects() {
  unbindCanvas();
  stopGizmoLoop();
  selectedCatalog = null;
  catalogBrowse = false;
  document.body.classList.remove('cld-room-edit-placing-object');
  document.body.classList.remove('cld-room-edit-dragging-object');
  selectedObjectId = null;
  applyToRoom();
  syncObjectEditor();
}

export function reapplyRoomEditObjects() {
  applyToRoom();
  applyObjectViewVisibility();
  refreshObjectGizmo();
}

export function onRoomEditObjectsPanelChanged() {
  if (!isObjectsMode()) {
    document.body.classList.remove('cld-room-edit-placing-object');
    document.body.classList.remove('cld-room-edit-dragging-object');
    onCanvasMouseUp();
    stopGizmoLoop();
  } else {
    startGizmoLoop();
  }
  syncObjectEditor();
}

if (typeof window !== 'undefined') {
  window.__cldReapplyRoomEditObjects = reapplyRoomEditObjects;
}
