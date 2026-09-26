// @ts-nocheck
// Отключаем проверку типов для этого файла из-за сложной системы выражений Clodis
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initClodisLibs, evaluateExpression, getMaterial, getMaterialGroup, getGlobalVar } from './lib/clodisLibs';
import { comp2 } from './lib/clodisExpressions';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { materialsManager } from './lib/materialsManager';
import { EmbeddedClodisBuilder } from './lib/EmbeddedClodisBuilder';
// ⚠️ Алиас для совместимости
const EmbeddedClodisBuilder = EmbeddedClodisBuilder;
import { catalogAPI } from './api/catalogAPI';
import { API_BASE_URL } from './config/apiConfig';
import { readClodisJSON } from '../js/clodis-json-fields.js';

// ============================================================================
// Clodis JSON Format Types
// ============================================================================
// TypeScript интерфейсы для формата Clodis JSON (референс)

/** Выражение: число, строка-выражение (s:x, v:variable, g:group.property) или объект с x, y, z */
export type ClodisExpression = number | string | {
  x?: number | string;
  y?: number | string;
  z?: number | string;
};

/** Значение pivot: -1 (min), 0 (center), 1 (max) */
export type ClodisPivot = -1 | 0 | 1;

/** Материал группы (полная структура как в референсе) */
export interface ClodisMaterial {
  /** Идентификатор группы материала (например, "g0") */
  group?: string;
  /** Ключ материала (например, "ldsp") */
  key?: string;
  /** Фиксированная толщина материала в мм (переопределяет толщину группы) */
  thickness_lock?: number;
  /** ID материала */
  id?: number;
  /** ID варианта материала */
  variant_id?: number;
  /** Повернут ли материал */
  rotated?: number;
  /** Индекс доступности */
  av_index?: number;
  /** Фиксирован ли материал */
  fixed?: number;
  /** Блокировка ключа */
  key_lock?: string;
}

/** Спецификация элемента (полная структура как в референсе) */
export interface ClodisSpec {
  /** Ориентация стены: 'v' (вертикальная), 'h' (горизонтальная), 'f' (front) */
  orientation?: 'v' | 'h' | 'f';
  /** Группа элемента: 'wall', 'facade', 'module' */
  group?: string;
  /** Тип элемента: 'common' и др. */
  type?: string;
  /** Ключ позиции: 'left', 'right', 'back', 'front', 'top', 'bottom', 'middle' */
  key?: string;
  /** Материал элемента */
  material?: ClodisMaterial;
  /** Показывать индекс */
  show_index?: number;
  /** Тип элемента (для модулей: "dveri_shkaf", "shablony_korpusov") */
  element_type?: string;
  /** ID элемента (для модулей) */
  id?: string | number;
  /** Роль элемента (для фасадов: "kitchen") */
  role?: string;
  /** Дополнительные поля Clodis */
  name?: string;
  code?: string;
  type_params?: any[];
  points?: any[];
  butts?: any[];
  holes?: any[];
  shape?: any;
}

/** Базовый элемент Clodis JSON */
export interface ClodisItem {
  /** Тип элемента */
  type: 'section' | 'fill_section' | 'wall' | 'facade' | 'module' | 'furniture';
  /** Название элемента */
  name?: string;
  /** ID элемента (для каталога) */
  id?: string;
  /** Библиотека элемента */
  lib?: string;
  /** Теги элемента */
  tags?: string;
  /** Интерактивность (0 или 1) */
  interactive?: number;
  /** Размеры элемента (число в мм, строка-выражение, или объект с x, y, z) */
  size?: ClodisExpression;
  /** Позиция элемента (число в мм, строка-выражение, или объект с x, y, z) */
  pos?: ClodisExpression;
  /** Точка привязки (pivot) */
  pivot?: {
    x?: ClodisPivot;
    y?: ClodisPivot;
    z?: ClodisPivot;
  };
  /** Масштаб элемента */
  scale?: {
    x?: number;
    y?: number;
    z?: number;
  };
  /** Поворот элемента в градусах */
  rot?: {
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  /** Дополнительный поворот (c_rot) */
  c_rot?: {
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  /** Спецификация элемента (для wall, facade, module) */
  spec?: ClodisSpec;
  /** Пользовательские данные */
  custom?: Record<string, any>;
  /** Дочерние элементы */
  children?: ClodisItem[];
  /** Условие видимости */
  condition?: any;
  /** Видимость (0 или 1) */
  visible?: number;
  /** Видимость помощников (0 или 1) */
  helpers_visible?: number;
  /** Активность (0 или 1) */
  active?: number;
  /** Переменные */
  variables?: {
    visible?: number;
    main?: Record<string, any>;
  };
  /** Взаимодействие */
  interaction?: {
    auto_rotation?: number;
    check_intersection?: number;
    raycast?: number;
  };
  /** Изменение размера */
  resizable?: {
    enabled?: number;
    locks?: Record<string, any>;
    minmax?: {
      min?: { x?: number; y?: number; z?: number };
      max?: { x?: number; y?: number; z?: number };
    };
  };
  /** События */
  events?: {
    on_before_params?: string;
    on_before_build?: string;
    on_after_build?: string;
    on_drag_end?: string;
  };
  /** Аксессуары */
  accessories?: any[];
  /** Комментарии */
  comments?: string;
  /** Ключ секции */
  section_key?: string;
  /** Ключ параметров */
  params_key?: string;
}

/** Параметры для построения Clodis структуры */
export interface ClodisBuildParams {
  /** Размеры корневой секции в мм (становятся s:x, s:y, s:z) */
  sectionSize?: {
    x: number;
    y: number;
    z: number;
  };
  /** Глобальные переменные (становятся доступны через v:variable_name) */
  variables?: Record<string, number>;
  /** Группы материалов (становятся доступны через g:group_name.property) */
  groups?: Record<string, { thickness: number; [key: string]: any }>;
}

/** Тип для Clodis JSON: может быть объектом или массивом объектов */
export type ClodisJSON = ClodisItem | ClodisItem[];

// ⚠️ Алиасы для совместимости
export type ClodisExpression = ClodisExpression;
export type ClodisPivot = ClodisPivot;
export type ClodisMaterial = ClodisMaterial;
export type ClodisSpec = ClodisSpec;
export type ClodisItem = ClodisItem;
export type ClodisBuildParams = ClodisBuildParams;
export type ClodisJSON = ClodisJSON;

// =============================================================================
// Вспомогательные функции для работы с типами и выражениями
// =============================================================================

/** Преобразует значение в число (для безопасной работы с выражениями) */
function toNumber(value: string | number | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  // Если это строка-выражение, пока возвращаем 0 (позже можно добавить парсер выражений)
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/** Преобразует объект размеров в числовые значения */
function toNumberSize(size: { x: string | number; y: string | number; z: string | number } | undefined): { x: number; y: number; z: number } {
  if (!size) return { x: 0, y: 0, z: 0 };
  return {
    x: toNumber(size.x),
    y: toNumber(size.y),
    z: toNumber(size.z)
  };
}

/** Безопасное преобразование материала в строку */
function materialToString(material: any): string {
  if (typeof material === 'string') return material;
  if (material && typeof material === 'object' && material.id) return material.id;
  return '';
}

// Сначала пробуем получить новый контейнер viewport
let appElement = document.getElementById('constructor-3d-canvas-container');
if (!appElement) {
  // Если новый контейнер не найден, используем старый
  appElement = document.getElementById('catalog-item-edit-3d-container');
}
if (!appElement) {
  // Последний вариант - старый app
  appElement = document.getElementById('app');
}
if (!(appElement instanceof HTMLElement)) {
  throw new Error('App container not found');
}
const app = appElement;

// Инициализируем Clodis библиотеки
console.log('🚀 Запуск инициализации Clodis библиотек...');
initClodisLibs().then(() => {
  console.log('✅ Clodis библиотеки загружены!');
  console.log('Доступные материалы:', window.clodis?.libs?.materials || window.pp?.libs?.materials);
  console.log('Группы материалов:', window.clodis?.libs?.materials_groups || window.pp?.libs?.materials_groups);
  console.log('Глобальные переменные:', window.clodis?.variables?.global_vars || window.pp?.variables?.global_vars);
}).catch(error => {
  // ⭐ ИСПРАВЛЕНО: Используем console.debug вместо console.error - ошибки уже обработаны в initClodisLibs
  console.debug('ℹ️ [constructor] Clodis библиотеки инициализированы с fallback значениями');
});

// Запоминаем исходное положение основного конструктора для переноса в модалку
let appOriginalParent: HTMLElement | null = null;
let appOriginalNextSibling: ChildNode | null = null;

// Simple material/edge catalogs for demo
const decorCatalog = [
  { id: 'oak', name: 'Дуб', color: '#c9a86a' },
  { id: 'white', name: 'Белый', color: '#f5f5f5' },
  { id: 'graphite', name: 'Графит', color: '#4b4b4b' },
  { id: 'walnut', name: 'Орех', color: '#8b5a2b' },
];

const edgeCatalog = [
  { id: 'edge-white', name: 'Кромка белая', color: '#f5f5f5' },
  { id: 'edge-beige', name: 'Кромка бежевая', color: '#d8c9a6' },
  { id: 'edge-black', name: 'Кромка черная', color: '#222222' },
];

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f2f2);

// Camera
const camera = new THREE.PerspectiveCamera(
  55,
  app.clientWidth / app.clientHeight,
  0.1,
  500
);
camera.position.set(4, 3, 4);
// Убеждаемся, что камера видит все слои (по умолчанию layer 0, но можно добавить layer 1)
camera.layers.enableAll(); // Камера видит все слои

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
// Используем outputColorSpace вместо устаревшего outputEncoding
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(app.clientWidth, app.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

// ⭐ ВАЖНО: CSS2DRenderer для отображения номеров кромок (как в референсе)
const css2DRenderer = new CSS2DRenderer();
css2DRenderer.setSize(app.clientWidth, app.clientHeight);
css2DRenderer.domElement.style.position = 'absolute';
css2DRenderer.domElement.style.top = '0';
css2DRenderer.domElement.style.pointerEvents = 'none';
css2DRenderer.domElement.style.zIndex = '10';
app.appendChild(css2DRenderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.minDistance = 0.1; // Минимальное расстояние для приближения
controls.maxDistance = 50; // Максимальное расстояние

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
ambientLight.userData.isBaseObject = true;
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(4, 8, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.userData.isBaseObject = true;
scene.add(dirLight);

// Ground/grid
let grid = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
grid.position.y = 0.001;
grid.userData.isBaseObject = true;
scene.add(grid);

function updateGridStep(stepMm: number) {
  const stepM = Math.max(0.001, stepMm / 1000); // min 1mm
  const size = 20;
  const divisions = Math.max(2, Math.round(size / stepM));
  scene.remove(grid);
  grid.geometry.dispose();
  if (Array.isArray(grid.material)) {
    grid.material.forEach(m => m.dispose());
  } else {
    grid.material.dispose();
  }
  grid = new THREE.GridHelper(size, divisions, 0x888888, 0xcccccc);
  grid.position.y = 0.001;
  scene.add(grid);
}

// HDRI
const hdriUrl =
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_08_2k.hdr';
new RGBELoader()
  .setDataType(THREE.HalfFloatType)
  .load(hdriUrl, texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = new THREE.Color(0xf7f7f7);
  });

// State
let selectedMesh: THREE.Mesh | null = null;
let currentDecor: (typeof decorCatalog)[number] | null = decorCatalog[0] || null;
let edgeFlags = { front: false, back: false, left: false, right: false };

// Глобальная группа для стартовых размерных стрелок (до создания секции)
let initialDimensionsGroup: THREE.Group | null = null;

// ⭐ ВРЕМЕННЫЙ ФЛАГ ОТЛАДКИ: показывать ли стрелки размеров
// В референсе стрелки есть всегда, но сейчас мы хотим проверить сцену без них.
// Когда закончим отладку, нужно вернуть значение true и логику scene.add(group).
const SHOW_DIMENSIONS_HELPERS = true; // ⭐ Включено обратно

/**
 * ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ:
 * Скрывает все лишние каркасы, которые не используются в референсе:
 * - объекты с userData.isFrame === true (наследие старого buildParentFrame)
 * - любые LineSegments БЕЗ userData.is_helper и БЕЗ userData.isDimensionsHelper
 *
 * В референсе при редактировании модуля видны только:
 * - стрелки размеров
 * - helpers самих секций (cube + edges с userData.is_helper)
 */
function hideAllFramesInScene() {
  scene.traverse(obj => {
    const anyObj = obj as any;

    // Явно помеченные frame-объекты от старого buildParentFrame
    if (anyObj.userData && anyObj.userData.isFrame) {
      obj.visible = false;
      return;
    }

    // Любые LineSegments без флага is_helper и не являющиеся частью размерных стрелок
    if (
      (obj as any).isLineSegments &&
      !(anyObj.userData && anyObj.userData.is_helper) &&
      !(anyObj.userData && anyObj.userData.isDimensionsHelper)
    ) {
      obj.visible = false;
    }
  });
}

/**
 * ВСПОМОГАТЕЛЬНАЯ ОТЛАДОЧНАЯ ФУНКЦИЯ:
 * Логирует все LineSegments и helper-кубы в сцене, чтобы понять, откуда берется лишний каркас.
 */
function debugLogSceneHelpers(context: string) {
  console.log('🔍 [debugLogSceneHelpers] Контекст:', context);

  const lineSegmentsInfo: any[] = [];
  const helperMeshesInfo: any[] = [];

  scene.traverse(obj => {
    const anyObj = obj as any;

    // Логируем все LineSegments
    if (anyObj.isLineSegments) {
      lineSegmentsInfo.push({
        name: obj.name || '(no name)',
        uuid: obj.uuid,
        parent: obj.parent ? obj.parent.name : null,
        userData: {
          is_helper: !!anyObj.userData?.is_helper,
          isDimensionsHelper: !!anyObj.userData?.isDimensionsHelper,
          isFrame: !!anyObj.userData?.isFrame,
          is_root_section: !!anyObj.userData?.is_root_section,
        },
        visible: obj.visible,
        position: obj.position.clone(),
      });
    }

    // Логируем helper-кубы (Mesh с is_helper)
    if ((anyObj.isMesh || anyObj.isMesh === true) && anyObj.userData?.is_helper) {
      helperMeshesInfo.push({
        name: obj.name || '(no name)',
        uuid: obj.uuid,
        parent: obj.parent ? obj.parent.name : null,
        userData: {
          is_helper: !!anyObj.userData?.is_helper,
          is_root_section: !!anyObj.userData?.is_root_section,
        },
        visible: obj.visible,
        position: obj.position.clone(),
      });
    }
  });

  console.log('📏 [debugLogSceneHelpers] LineSegments:', lineSegmentsInfo);
  console.log('📦 [debugLogSceneHelpers] Helper meshes:', helperMeshesInfo);
}

type CreateParams = {
  name: string;
  article: string;
  type: 'box' | 'shelf' | 'panel';
  width: number; // mm
  height: number; // mm
  depth: number; // mm
  gridStep: number; // mm
};

const defaultCreateParams: CreateParams = {
  name: 'Корпус',
  article: '',
  type: 'box',
  width: 600,
  height: 2400,
  depth: 600,
  gridStep: 32,
};

type SceneNode = {
  id: string;
  name: string;
  type: string; // 'section' | 'body' | 'wall' | 'bottom' | 'top' | 'facade' | 'groove' | 'confirmat' | 'glb' | etc.
  group: THREE.Group;
  children: SceneNode[];
  parent?: SceneNode | null;
  expanded?: boolean; // Для UI - раскрыт ли узел в дереве
  orientation?: 'vertical' | 'horizontal' | 'v' | 'h' | 'f'; // ⭐ Ориентация детали: 'vertical'/'horizontal' (старый формат) или 'v'/'h'/'f' (Clodis формат)
  position?: string; // Позиция детали (left/right/top/bottom/middle/back/front и т.д.)
  metadata?: {
    originalSize?: { x: number; y: number; z: number };
    animations?: string[];
    sourceFile?: string;
    isGLB?: boolean;
    thickness?: number; // Толщина материала
    material?: string | { id: string; name: string; thickness: number; [key: string]: any }; // ID материала или объект
    edgeBanding?: { front?: boolean; back?: boolean; left?: boolean; right?: boolean };
    detailTypeId?: string; // ID типа детали (для совместимости со старым кодом)
    // Добавлено для Clodis формата:
    size?: { x: number | string; y: number | string; z: number | string }; // Размеры детали (могут быть выражениями)
    position?: { x: number | string; y: number | string; z: number | string }; // Позиция детали (могут быть выражениями)
    anchors?: { x: number | string; y: number | string; z: number | string }; // Точки привязки детали (-1, 0, 1) или якоря
    expressions?: any; // Выражения для вычисления размеров и позиций
    isFromCatalog?: boolean; // Элемент из каталога
    fileFormat?: string; // Формат файла (для 3D моделей)
    catalogId?: string; // ID элемента в каталоге
    element_type?: string; // Тип элемента (из catalogTypes, например 'kitchens', 'cabinets') - как в референсе
    cabinet_tag?: string; // Тег группы модулей (из catalogGroups, например 'bottom_modules', 'top_modules') - как в референсе
    // ⭐ Декларативный подход (как в референсе): детали хранятся в JSON структуре
    childrenData?: any[]; // СТАРАЯ структура деталей (будет заменена новой Clodis-совместимой)
    pp_children?: any[];  // НОВАЯ структура детей в формате Clodis (type/size/pos/pivot/rot/spec)
    [key: string]: any; // Дополнительные свойства
  };
};

/**
 * ⭐ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ:
 * Синхронизирует базовые поля SceneNode в userData группы Three.js.
 *
 * Цель: постепенно привести архитектуру к референсу,
 * где объект THREE.Group сам является «узлом» с данными в userData.
 */
function syncSceneNodeToUserData(node: SceneNode) {
  if (!node || !node.group) return;

  const g = node.group;
  g.userData = g.userData || {};

  // Базовая идентификация узла (как в референсе через ids/paths)
  g.userData.id = node.id;
  g.userData.name = node.name;
  g.userData.type = node.type;

  // Ориентация и позиция детали (если заданы)
  if (node.orientation) g.userData.orientation = node.orientation;
  if (node.position) g.userData.position = node.position;

  // Размеры секции/детали (size_three аналог computed.u_size в референсе)
  if (node.metadata?.size_three) {
    g.userData.size_three = { ...node.metadata.size_three };
  } else if (node.metadata?.size) {
    g.userData.size = { ...node.metadata.size };
  }

  // own_object и helpers — как в CabinetSection._build_struct()
  if (node.metadata?.own_object && node.metadata.own_object instanceof THREE.Group) {
    g.userData.own_object = node.metadata.own_object;
  }
  if (node.metadata?.helpers && node.metadata.helpers instanceof THREE.Group) {
    g.userData.helpers = node.metadata.helpers;
  }

  // Декларативные дети: childrenData / pp_children → params.children-подобная структура
  if (node.metadata?.childrenData) {
    g.userData.childrenData = node.metadata.childrenData;
    // ⭐ ЭТАП 2: Синхронизируем в params.children (формат Clodis)
    syncChildrenDataToParams(g, node.metadata.childrenData);
  }
  if (node.metadata?.pp_children) {
    g.userData.pp_children = node.metadata.pp_children;
  }
}

// ⭐ ЭТАП 2: Синхронизация childrenData → params.children (формат Clodis)
// Преобразует наш формат childrenData в формат params.children из референса
function syncChildrenDataToParams(group: THREE.Group, childrenData: any[]): void {
  if (!group.userData.params) {
    group.userData.params = {};
  }
  
  // Преобразуем childrenData в формат Clodis params.children
  // Референс: params.children[] содержит объекты с полями: type, size, pos, pivot, rot, spec, name, id и т.д.
  group.userData.params.children = childrenData.map((childData: any) => {
    // Если данные уже в формате Clodis (из params.children), возвращаем как есть
    if (childData.type && !childData.detailTypeId && !childData._detailTypeId) {
      // Это уже Clodis формат, просто возвращаем
      return childData;
    }
    
    // Определяем type на основе detailTypeId или явного type
    let childType: string = childData.type || 'wall'; // По умолчанию 'wall' для деталей (как в референсе)
    
    // Если есть detailTypeId, определяем type по нему
    if (childData.detailTypeId || childData._detailTypeId) {
      // Детали в Clodis имеют type='wall'
      childType = 'wall';
    }
    
    // Формируем Clodis-совместимый объект ребенка
    const clodisChild: any = {
      type: childType,
      name: childData.name || 'Деталь',
      id: childData.id,
      // Размеры (могут быть выражениями)
      size: childData.size || {},
      // Позиция (могут быть выражениями)
      pos: childData.pos || {},
      // Pivot (числа -1/0/1)
      pivot: childData.pivot || { x: -1, y: -1, z: -1 },
      // Поворот
      rot: childData.rot || {},
      // Спецификация (orientation, material и т.д.)
      spec: childData.spec || {},
      // Активность и видимость
      active: childData.active !== undefined ? childData.active : 1,
      visible: childData.visible !== undefined ? childData.visible : 1,
      // Сохраняем наши дополнительные поля для обратной совместимости
      _detailTypeId: childData.detailTypeId || childData._detailTypeId,
      _materialId: childData.materialId || childData._materialId,
    };
    
    // Если есть materialId, добавляем в spec.material (как в референсе)
    const materialId = childData.materialId || childData._materialId;
    if (materialId) {
      if (!clodisChild.spec) clodisChild.spec = {};
      clodisChild.spec.material = {
        key: materialId,
        group: childData.spec?.material?.group || 'g0', // Используем группу из spec или по умолчанию g0
      };
    }
    
    return clodisChild;
  });
  
  console.log('🔄 [syncChildrenDataToParams] Синхронизировано детей в params.children:', group.userData.params.children.length);
}

// ⭐ ЭТАП 2: Получить children из params.children (приоритет) или metadata.childrenData (fallback)
function getChildrenData(node: SceneNode | THREE.Group): any[] {
  let group: THREE.Group;
  let metadata: any = null;
  
  if (node instanceof THREE.Group) {
    group = node;
  } else {
    group = node.group;
    metadata = node.metadata;
  }
  
  // ⭐ ПРИОРИТЕТ 1: userData.params.children (новый формат Clodis)
  if (group.userData?.params?.children && Array.isArray(group.userData.params.children)) {
    return group.userData.params.children;
  }
  
  // ⭐ ПРИОРИТЕТ 2: userData.childrenData (промежуточный формат)
  if (group.userData?.childrenData && Array.isArray(group.userData.childrenData)) {
    return group.userData.childrenData;
  }
  
  // ⭐ FALLBACK: metadata.childrenData (старый формат)
  if (metadata?.childrenData && Array.isArray(metadata.childrenData)) {
    // Синхронизируем в params.children для будущего использования
    syncChildrenDataToParams(group, metadata.childrenData);
    return metadata.childrenData;
  }
  
  return [];
}

const sceneNodes: SceneNode[] = [];
(window as any).sceneNodes = sceneNodes; // Экспортируем для доступа из HTML
let currentSelectedNode: SceneNode | null = null;
let animationMixer: THREE.AnimationMixer | null = null;
let animationActions: { [key: string]: THREE.AnimationAction } = {};
const clock = new THREE.Clock();
let testRotationActive = false;

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// Глубина узла в иерархии (для дерева в модалке конструктора)
// Корневая секция (parent === null) имеет depth = 0,
// её дети — 1, внуки — 2 и т.д.
function getNodeDepth(node: SceneNode): number {
  let depth = 0;
  let parent = node.parent || null;
  while (parent) {
    depth += 1;
    parent = parent.parent || null;
  }
  return Math.max(0, depth);
}

// Обновить правую панель свойств во вкладке "Конструктор" (Clodis-стиль)
function updateConstructorPropertiesPanel(node: SceneNode | null) {
  const panel = document.getElementById('constructor-properties-panel') as HTMLDivElement | null;
  if (!panel) return;

  const typeInput = document.getElementById('catalog-constructor-property-type') as HTMLInputElement | null;
  const nameInput = document.getElementById('catalog-constructor-property-name') as HTMLInputElement | null;
  const idInput = document.getElementById('catalog-constructor-property-id') as HTMLInputElement | null;

  // Элементы, специфичные для деталей
  const detailSpecificSection = document.getElementById('catalog-constructor-detail-specific');
  const materialSection = document.getElementById('catalog-constructor-material-section');
  const detailCheckboxes = document.getElementById('catalog-constructor-detail-checkboxes');
  const edgesSection = document.getElementById('catalog-constructor-edges-section');
  const sizeSection = document.getElementById('catalog-constructor-size-section');
  const positionSection = document.getElementById('catalog-constructor-position-section');
  const advancedSection = document.getElementById('catalog-constructor-advanced-section');

  // ⭐ ИЗМЕНЕНО: Панель свойств всегда видима (50% ширины, как в референсе)
  // Просто очищаем поля, если ничего не выбрано
  if (!node) {
    if (typeInput) typeInput.value = '';
    if (nameInput) nameInput.value = '';
    if (idInput) idInput.value = '';
    
    // Скрываем все специфичные разделы
    if (detailSpecificSection) detailSpecificSection.style.display = 'none';
    if (materialSection) materialSection.style.display = 'none';
    if (detailCheckboxes) detailCheckboxes.style.display = 'none';
    if (edgesSection) edgesSection.style.display = 'none';
    if (sizeSection) sizeSection.style.display = 'none';
    if (positionSection) positionSection.style.display = 'none';
    if (advancedSection) advancedSection.style.display = 'none';
    return;
  }

  // Заполняем панель данными выбранного элемента

  // Заполняем базовые поля
  if (typeInput) {
    if (node.type === 'section') typeInput.value = 'Секция';
    else if (node.type === 'detail') typeInput.value = 'Деталь';
    else typeInput.value = node.type;
  }
  if (nameInput) {
    nameInput.value = node.name || '';
  }
  if (idInput) {
    idInput.value = node.id || '';
  }

  // Для деталей показываем специфичные разделы
  if (node.type === 'detail') {
    if (detailSpecificSection) detailSpecificSection.style.display = 'block';
    if (materialSection) materialSection.style.display = 'block';
    if (detailCheckboxes) detailCheckboxes.style.display = 'block';
    if (edgesSection) edgesSection.style.display = 'block';
    if (sizeSection) sizeSection.style.display = 'block';
    if (positionSection) positionSection.style.display = 'block';
    if (advancedSection) advancedSection.style.display = 'block';

    // ⭐ ИСПРАВЛЕНО ПО РЕФЕРЕНСУ: Заполняем ориентацию - конвертируем старый формат 'vertical'/'horizontal' в новый 'v'/'h'/'f'
    const orientationSelect = document.getElementById('catalog-constructor-property-orientation') as HTMLSelectElement | null;
    if (orientationSelect) {
      let orientationValue: 'v' | 'h' | 'f' = 'v'; // По умолчанию
      if (node.orientation) {
        // Проверяем, какой формат используется
        if (node.orientation === 'v' || node.orientation === 'h' || node.orientation === 'f') {
          orientationValue = node.orientation;
        } else if (node.orientation === 'vertical') {
          orientationValue = 'v';
        } else if (node.orientation === 'horizontal') {
          orientationValue = 'h';
        } else if (node.orientation === 'front') {
          orientationValue = 'f';
        }
      } else if (node.metadata?.orientation) {
        // Проверяем metadata
        const metaOrientation = node.metadata.orientation;
        if (metaOrientation === 'v' || metaOrientation === 'h' || metaOrientation === 'f') {
          orientationValue = metaOrientation;
        } else if (metaOrientation === 'vertical') {
          orientationValue = 'v';
        } else if (metaOrientation === 'horizontal') {
          orientationValue = 'h';
        } else if (metaOrientation === 'front') {
          orientationValue = 'f';
        }
      }
      orientationSelect.value = orientationValue;
      // Обновляем node.orientation для единообразия
      node.orientation = orientationValue;
      if (!node.metadata) node.metadata = {};
      node.metadata.orientation = orientationValue;
    }

    // Заполняем размеры (1-в-1 Clodis: для деталей показываем pp_size (мм/выражения), иначе size (метры))
    const sizeXInput = document.getElementById('catalog-constructor-property-size-x') as HTMLInputElement | null;
    const sizeYInput = document.getElementById('catalog-constructor-property-size-y') as HTMLInputElement | null;
    const sizeZInput = document.getElementById('catalog-constructor-property-size-z') as HTMLInputElement | null;
    
    const ppSize = node.type === 'detail' ? (node.metadata as any)?.pp_size : undefined;
    const size = ppSize || node.metadata?.size;
    const sizeIsMM = !!ppSize; // pp_size хранит мм/выражения
    if (size) {
      if (sizeXInput) sizeXInput.value = typeof size.x === 'string' ? size.x : (sizeIsMM ? String(size.x) : (size.x * 1000).toFixed(0));
      if (sizeYInput) sizeYInput.value = typeof size.y === 'string' ? size.y : (sizeIsMM ? String(size.y) : (size.y * 1000).toFixed(0));
      if (sizeZInput) sizeZInput.value = typeof size.z === 'string' ? size.z : (sizeIsMM ? String(size.z) : (size.z * 1000).toFixed(0));
    }

    // ⭐ ИСПРАВЛЕНО ПО РЕФЕРЕНСУ: main_core_v2_part13.js:1160-1174 - все три оси позиции
    // Заполняем позицию (X, Y, Z)
    const posXInput = document.getElementById('catalog-constructor-property-pos-x') as HTMLInputElement | null;
    const posYInput = document.getElementById('catalog-constructor-property-pos-y') as HTMLInputElement | null;
    const posZInput = document.getElementById('catalog-constructor-property-pos-z') as HTMLInputElement | null;
    // Позиция (Clodis): для деталей показываем pp_pos (мм/выражения), иначе старая логика
    const ppPos = node.type === 'detail' ? (node.metadata as any)?.pp_pos : undefined;
    const position = ppPos || node.metadata?.position;
    const posIsMM = node.type === 'detail'; // детали: позиция в мм/выражениях
    if (position) {
      if (posXInput) posXInput.value = typeof position.x === 'string' ? position.x : (posIsMM ? String(position.x || 0) : (position.x ? (position.x * 1000).toFixed(0) : '0'));
      if (posYInput) posYInput.value = typeof position.y === 'string' ? position.y : (posIsMM ? String(position.y || 0) : (position.y ? (position.y * 1000).toFixed(0) : '0'));
      if (posZInput) posZInput.value = typeof position.z === 'string' ? position.z : (posIsMM ? String(position.z || 0) : (position.z ? (position.z * 1000).toFixed(0) : '0'));
    }

    // ⭐ ИСПРАВЛЕНО ПО РЕФЕРЕНСУ: main_core_v2_part13.js:987-1010 - pivot хранится как числа -1, 0, 1
    // Заполняем точку отсчета (pivot) - конвертируем из старого формата 'min'/'center'/'max' в новый -1/0/1
    const anchors = node.metadata?.anchors;
    const pivot = node.metadata?.pivot; // В Clodis pivot хранится отдельно от anchors
    if (pivot || anchors) {
      // Используем pivot, если есть, иначе конвертируем anchors
      const pivotValues: { x?: ClodisPivot; y?: ClodisPivot; z?: ClodisPivot } = {};
      if (pivot) {
        pivotValues.x = pivot.x;
        pivotValues.y = pivot.y;
        pivotValues.z = pivot.z;
      } else if (anchors) {
        // Конвертируем старый формат 'min'/'center'/'max' в новый -1/0/1
        pivotValues.x = anchorToPivotNum(anchors.x as Anchor);
        pivotValues.y = anchorToPivotNum(anchors.y as Anchor);
        pivotValues.z = anchorToPivotNum(anchors.z as Anchor);
      }
      
      // Обновляем кнопки точки отсчета (data-value теперь содержит -1, 0, 1)
      ['x', 'y', 'z'].forEach(axis => {
        const pivotValue = pivotValues[axis as 'x' | 'y' | 'z'];
        if (pivotValue !== undefined) {
          const buttons = document.querySelectorAll(`.anchor-btn[data-axis="${axis}"]`) as NodeListOf<HTMLButtonElement>;
          buttons.forEach(btn => {
            const value = btn.getAttribute('data-value');
            // Конвертируем в число для сравнения
            const btnValue = value ? parseInt(value, 10) : null;
            if (btnValue === pivotValue) {
              btn.style.background = '#4a7cff';
              btn.style.color = '#fff';
              btn.style.border = 'none';
            } else {
              btn.style.background = '#f5f5f5';
              btn.style.color = '#333';
              btn.style.border = '1px solid #d0d7e2';
            }
          });
        }
      });
    }

    // Заполняем материал
    const materialGroupSelect = document.getElementById('catalog-constructor-property-material-group') as HTMLSelectElement | null;
    const materialKeySelect = document.getElementById('catalog-constructor-property-material-key') as HTMLSelectElement | null;
    if (node.metadata?.material) {
      if (materialGroupSelect) {
        materialGroupSelect.value = node.metadata.material.group || 'g0';
      }
      if (materialKeySelect) {
        materialKeySelect.value = node.metadata.material.key || 'ldsp';
      }
    }

    // ⭐ ПЕРЕПИСАНО ПО РЕФЕРЕНСУ: Заполняем кромки (чекбокс + толщина + тип)
    // В референсе каждая кромка имеет: checkbox, thickness (input), type (select), кнопка выбора
    const edges = node.metadata?.edges || [];
    const edgesData = node.metadata?.edgesData || {}; // Данные кромок: { 1: { thickness, type, key, id, variant_id }, ... }
    
    for (let i = 1; i <= 4; i++) {
      // Чекбокс кромки
      const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${i}`) as HTMLInputElement | null;
      if (edgeCheckbox) {
        edgeCheckbox.checked = edges.includes(i);
      }
      
      // Толщина кромки (как в референсе)
      const edgeThicknessInput = document.getElementById(`catalog-constructor-property-edge-${i}-thickness`) as HTMLInputElement | null;
      if (edgeThicknessInput) {
        const edgeData = edgesData[i];
        if (edgeData && typeof edgeData.thickness === 'number') {
          edgeThicknessInput.value = edgeData.thickness.toFixed(1);
        } else {
          edgeThicknessInput.value = '0.4'; // Дефолтная толщина
        }
      }
      
      // Тип кромки (как в референсе)
      const edgeTypeSelect = document.getElementById(`catalog-constructor-property-edge-${i}-type`) as HTMLSelectElement | null;
      if (edgeTypeSelect) {
        const edgeData = edgesData[i];
        if (edgeData && edgeData.type) {
          edgeTypeSelect.value = edgeData.type;
        } else {
          edgeTypeSelect.value = 'butts'; // Дефолтный тип
        }
      }
    }
    
    // Заполняем чекбокс "Нумерация сторон кромкования"
    const edgeNumberingCheckbox = document.getElementById('catalog-constructor-property-edge-numbering') as HTMLInputElement | null;
    if (edgeNumberingCheckbox) {
      edgeNumberingCheckbox.checked = node.metadata?.edgeNumbering !== false; // По умолчанию true
      
      // ⭐ ВАЖНО: Обновляем визуализацию номеров кромок при загрузке свойств детали
      if (node.type === 'detail' && node.group) {
        // Небольшая задержка, чтобы чекбоксы успели обновиться
        setTimeout(() => {
          updateEdgeNumbersVisualization(node);
          render();
        }, 10);
      }
    }

  } else if (node.type === 'section') {
    // Для секций показываем размеры (как в референсе)
    if (sizeSection) {
      sizeSection.style.display = 'block';
      
      // Заполняем размеры секции
      const sizeXInput = document.getElementById('catalog-constructor-property-size-x') as HTMLInputElement | null;
      const sizeYInput = document.getElementById('catalog-constructor-property-size-y') as HTMLInputElement | null;
      const sizeZInput = document.getElementById('catalog-constructor-property-size-z') as HTMLInputElement | null;
      
      const size = node.metadata?.size || node.metadata?.originalSize;
      if (size) {
        // Конвертируем метры в миллиметры (умножаем на 1000) для отображения
        if (sizeXInput) sizeXInput.value = typeof size.x === 'string' ? size.x : (size.x * 1000).toFixed(0);
        if (sizeYInput) sizeYInput.value = typeof size.y === 'string' ? size.y : (size.y * 1000).toFixed(0);
        if (sizeZInput) sizeZInput.value = typeof size.z === 'string' ? size.z : (size.z * 1000).toFixed(0);
      } else {
        // Если размеров нет, используем размеры из group или дефолтные
        const nodeSize = getNodeSize(node);
        if (nodeSize) {
          if (sizeXInput) sizeXInput.value = (nodeSize.x * 1000).toFixed(0);
          if (sizeYInput) sizeYInput.value = (nodeSize.y * 1000).toFixed(0);
          if (sizeZInput) sizeZInput.value = (nodeSize.z * 1000).toFixed(0);
        }
      }
    }
    
    // Заполняем чекбоксы секции
    const hideWhenFilledCheckbox = document.getElementById('catalog-constructor-property-hide-when-filled') as HTMLInputElement | null;
    const activeCheckbox = document.getElementById('catalog-constructor-property-active') as HTMLInputElement | null;
    
    if (hideWhenFilledCheckbox) {
      hideWhenFilledCheckbox.checked = node.metadata?.hideWhenFilled || false;
    }
    if (activeCheckbox) {
      activeCheckbox.checked = node.metadata?.active !== false; // По умолчанию true
    }
    
    // Заполняем артикул (если есть)
    const articleInput = document.getElementById('catalog-constructor-property-article') as HTMLInputElement | null;
    if (articleInput) {
      articleInput.value = node.metadata?.article || '';
    }
    
    // Для секций скрываем специфичные разделы деталей
    if (detailSpecificSection) detailSpecificSection.style.display = 'none';
    if (materialSection) materialSection.style.display = 'none';
    if (detailCheckboxes) detailCheckboxes.style.display = 'none';
    if (edgesSection) edgesSection.style.display = 'none';
    if (positionSection) positionSection.style.display = 'none';
    if (advancedSection) advancedSection.style.display = 'none';
  } else {
    // Для других типов скрываем все
    if (detailSpecificSection) detailSpecificSection.style.display = 'none';
    if (materialSection) materialSection.style.display = 'none';
    if (detailCheckboxes) detailCheckboxes.style.display = 'none';
    if (edgesSection) edgesSection.style.display = 'none';
    if (sizeSection) sizeSection.style.display = 'none';
    if (positionSection) positionSection.style.display = 'none';
    if (advancedSection) advancedSection.style.display = 'none';
  }
}
function createMaterial(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.08,
    roughness: 0.6,
  });
}

// Вспомогательная функция для получения визуальных размеров (минимум для Three.js)
// В CAD системах нулевые размеры допустимы, но для визуализации нужен минимум
function getVisualSize(w: number, h: number, d: number): { w: number; h: number; d: number } {
  const MIN_VISUAL_SIZE = 0.001; // 1мм для визуализации
  return {
    w: Math.max(w, MIN_VISUAL_SIZE),
    h: Math.max(h, MIN_VISUAL_SIZE),
    d: Math.max(d, MIN_VISUAL_SIZE)
  };
}

// ⭐ УДАЛЕНО: Функции make_cube, make_edges и buildParentFrame
// Код сохранен в файле REMOVED_buildParentFrame_code.ts

/**
 * ⭐ РЕФЕРЕНС: main_core_v2_part18.js:2344-2376
 * Создание корневой секции (1 В 1 С РЕФЕРЕНСОМ)
 * Референс: class CabinetSection extends THREE.Group
 * Референс: constructor() вызывает _build_struct() и _main()
 * Референс: _main() вызывает _build_params(), _build_computed(), _build_defaults(), _build_variables(), _build_comp_obj(), _build()
 * 
 * @param name - Название секции
 * @param sizeX_mm - Размер по X в миллиметрах
 * @param sizeY_mm - Размер по Y в миллиметрах
 * @param sizeZ_mm - Размер по Z в миллиметрах
 * @returns Объект с sectionGroup, ownObject, computed, params, c_object, helpersGroup
 */
function createRootSection(
  name: string,
  sizeX_mm: number,
  sizeY_mm: number,
  sizeZ_mm: number
): {
  sectionGroup: THREE.Group;
  ownObject: THREE.Group;
  computed: any;
  params: any;
  c_object: any;
  helpersGroup: THREE.Group;
} {
  const units = 1000; // Референс использует units = 1000
  
  // Размеры для Three.js геометрии (делим на units, как в референсе computed.u_size)
  const w = sizeX_mm / units;
  const h = sizeY_mm / units;
  const d = sizeZ_mm / units;
  
  // ⭐ ЭТАП 1: _build_struct() - референс строка 2576-2582
  // Референс: this['userData']['struct'] = {}
  // Референс: this['userData']['own_object'] = new THREE['Group']()
  // Референс: this['userData']['own_object']['name'] = '__own_object'
  // Референс: this['userData']['struct'][this['userData']['own_object']['name']] = this['userData']['own_object']
  // Референс: this['userData']['children'] = this['userData']['own_object']['children']
  // Референс: this['add'](this['userData']['own_object'])
  const sectionGroup = new THREE.Group();
  sectionGroup.name = name;
  sectionGroup.position.set(0, 0, 0);
  sectionGroup.visible = true;
  
  const ownObject = new THREE.Group();
  ownObject.name = '__own_object';
  ownObject.visible = true;
  sectionGroup.add(ownObject);
  
  // Инициализируем userData структуру (как в референсе)
  initUserDataStruct(sectionGroup, ownObject);
  const computed = initUserDataComputed(sectionGroup);
  const params = initUserDataParams(sectionGroup, {
    size: { x: sizeX_mm, y: sizeY_mm, z: sizeZ_mm }, // Размеры в мм
    pivot: { x: -1, y: -1, z: -1 },
    helpers_visible: 0, // ⭐ РЕФЕРЕНС: Корневая секция скрыта по умолчанию (как в референсе - первый скрин)
  });
  
  // ⭐ ЭТАП 1: Сохраняем размеры в computed (как в референсе _build_size - строка 2639-2646)
  // Референс: f['size']['x'] = comp2(g['size']['x'], h)
  // Референс: f['u_size'] = f['size']['clone']()['divideScalar'](units)
  computed.size.set(sizeX_mm, sizeY_mm, sizeZ_mm);
  computed.u_size.set(w, h, d);
  
  // ⭐ ЭТАП 2: Создаем c_object для корневой секции (референс строка 2552-2564)
  // Референс: main_core_v2_part18.js:2556-2564
  // Для root секции: parent = null, root = сама секция
  const c_object = createCObject(sectionGroup, null, null, null);
  
  // ⭐ ЭТАП 3: _build_pos() для root - вычисление позиции через comp2() (референс строка 2648-2655)
  // Референс: f['pos']['x'] = comp2(g['pos']['x'], h) где f=computed, g=params, h=c_object
  // Для root: pos по умолчанию (0,0,0)
  if (!params.pos) {
    params.pos = { x: '0', y: '0', z: '0' };
  }
  
  // Вычисляем позицию через comp2() (как в референсе)
  const posX_mm = comp2(params.pos.x, c_object);
  const posY_mm = comp2(params.pos.y, c_object);
  const posZ_mm = comp2(params.pos.z, c_object);
  
  // Сохраняем в computed.pos (как в референсе)
  computed.pos.set(posX_mm, posY_mm, posZ_mm);
  
  // Применяем позицию (референс строка 2655)
  // Для root: own_object.position.set((-size.x / 2 + pos.x) / units, pos.y / units, (-size.z / 2 + pos.z) / units)
  ownObject.position.set(
    (-sizeX_mm / 2 + posX_mm) / units,
    posY_mm / units,
    (-sizeZ_mm / 2 + posZ_mm) / units
  );
  
  // ⭐ ЭТАП 4: _build_rot() для root - вычисление поворота через comp2() (референс строка 2669-2678)
  // Референс: f['rot']['x'] = comp2(g['rot']['x'], h) где f=computed, g=params, h=c_object
  // По умолчанию rot = (0,0,0)
  if (!params.rot) {
    params.rot = { x: '0', y: '0', z: '0' };
  }
  
  // Вычисляем поворот через comp2() (как в референсе)
  const rotX = comp2(params.rot.x, c_object);
  const rotY = comp2(params.rot.y, c_object);
  const rotZ = comp2(params.rot.z, c_object);
  
  // Сохраняем в computed.rot (как в референсе)
  computed.rot.set(rotX, rotY, rotZ);
  
  // Применяем поворот (референс строка 2674-2677)
  // Референс: h['rotation']['set'](0x0, 0x0, 0x0), h['rotateX'](-deg2rad(k)), ...
  ownObject.rotation.set(0, 0, 0);
  ownObject.rotateX(-THREE.MathUtils.degToRad(rotX));
  ownObject.rotateY(-THREE.MathUtils.degToRad(rotY));
  ownObject.rotateZ(-THREE.MathUtils.degToRad(rotZ));
  
  // ⭐ ЭТАП 4: _build_scale() для root - вычисление масштаба через comp2() (референс строка 2679-2685)
  // Референс: f['scale']['x'] = comp2(g['scale']['x'], h) где f=computed, g=params, h=c_object
  // По умолчанию scale = (1,1,1)
  if (!params.scale) {
    params.scale = { x: '1', y: '1', z: '1' };
  }
  
  // Вычисляем масштаб через comp2() (как в референсе)
  const scaleX = comp2(params.scale.x, c_object);
  const scaleY = comp2(params.scale.y, c_object);
  const scaleZ = comp2(params.scale.z, c_object);
  
  // Сохраняем в computed.scale (как в референсе)
  computed.scale.set(scaleX, scaleY, scaleZ);
  
  // Применяем масштаб (референс строка 2684)
  // Референс: h['scale']['set'](k, l, g)
  ownObject.scale.set(scaleX, scaleY, scaleZ);
  
  // ⭐ ЭТАП 5: _build_pivot() для root - вычисление pivot через conv_pivot() (референс строка 2658-2667)
  // Референс: j = conv_pivot(g['pivot']['x'], f['size']['x']) где g=params, f=computed
  // Референс: h['translateX'](j / units) где h=own_object
  // По умолчанию pivot = (-1, -1, -1) для секций
  if (!params.pivot) {
    params.pivot = { x: -1, y: -1, z: -1 };
  }
  
  // Вычисляем pivot offset через conv_pivot() (как в референсе)
  const pivotX_mm = conv_pivot(params.pivot.x, computed.size.x);
  const pivotY_mm = conv_pivot(params.pivot.y, computed.size.y);
  const pivotZ_mm = conv_pivot(params.pivot.z, computed.size.z);
  
  // Применяем pivot (референс строка 2665-2667)
  // Референс: h['translateX'](j / units), h['translateY'](k / units), h['translateZ'](g / units)
  ownObject.translateX(pivotX_mm / units);
  ownObject.translateY(pivotY_mm / units);
  ownObject.translateZ(pivotZ_mm / units);
  
  // ⭐ ЭТАП 6: _build_helpers() для root (референс строка 2860-2884)
  // Референс: var f = this['userData']['computed'] (строка 2861)
  // Референс: var g = (this['userData']['helpers'] ? this['_reset'](this['userData']['helpers']) : ...)
  // Если helpers уже существуют, очищаем их (референс использует _reset())
  let helpersGroup: THREE.Group;
  if (sectionGroup.userData.helpers) {
    // Очищаем существующие helpers (аналог _reset())
    helpersGroup = sectionGroup.userData.helpers as THREE.Group;
    while (helpersGroup.children.length > 0) {
      const child = helpersGroup.children[0];
      helpersGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: THREE.Material) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
  } else {
    // Создаем новую группу helpers (референс строка 2862-2864)
    helpersGroup = new THREE.Group();
    helpersGroup.name = '__helpers';
    sectionGroup.add(helpersGroup);
    sectionGroup.userData.helpers = helpersGroup;
  }
  
  // ⭐ ЭТАП 6: make_cube() - создание куба (референс строка 2865)
  // Референс: make_cube(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['helper_cube'])
  // Используем материал из pp.three.materials.helper_cube (как в референсе)
  const rootHelperCubeMaterial = (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.helper_cube)
    ? (window as any).pp.three.materials.helper_cube
    : undefined;
  
  const helperCube = make_cube(
    computed.u_size.x, // Размеры в метрах (computed.u_size)
    computed.u_size.y,
    computed.u_size.z,
    rootHelperCubeMaterial
  );
  
  // Референс строка 2866-2872: настройка свойств куба
  helperCube.userData.is_helper = true;
  helperCube.userData.no_edges = true;
  helperCube.userData.is_root_section = true; // Помечаем как корневую секцию
  helperCube.renderOrder = 10; // Референс строка 2869
  helperCube.layers.set(1); // Референс строка 2870: layers.set(0x1) = layer 1
  helperCube.position.set(0, 0, 0);
  helperCube.visible = true;
  helpersGroup.userData.size_volume = helperCube; // Референс строка 2871
  helpersGroup.add(helperCube); // Референс строка 2872
  
  // ⭐ ЭТАП 6: make_edges() - создание ребер (референс строка 2873)
  // Референс: make_edges(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['basic_line'])
  // Получаем материал из pp.three.materials.basic_line если доступен
  const edgesMaterial = (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.basic_line) 
    ? (window as any).pp.three.materials.basic_line 
    : undefined;
  
  const edges = make_edges(
    computed.u_size.x, // Размеры в метрах (computed.u_size)
    computed.u_size.y,
    computed.u_size.z,
    edgesMaterial
  );
  
  // Референс строка 2874-2878: настройка свойств edges
  edges.userData.is_helper = true;
  edges.userData.no_edges = true;
  edges.userData.is_root_section = true; // ⭐ Помечаем edges корневой секции
  edges.renderOrder = 11; // Референс строка 2877
  edges.layers.set(1); // Референс строка 2878: layers.set(0x1) = layer 1
  edges.position.set(0, 0, 0);
  edges.visible = true; // Референс: edges.visible устанавливается через helpersGroup.visible (строка 2883)
  
  // Референс строка 2879-2880: добавляем cube еще раз и edges
  helpersGroup.add(helperCube); // Добавляем cube еще раз (как в референсе строка 2879)
  helpersGroup.add(edges); // Добавляем edges (как в референсе строка 2880)
  
  // ⭐ РЕФЕРЕНС строка 2881-2882: helpers копируют позицию от own_object ПОСЛЕ добавления
  helpersGroup.position.copy(ownObject.position);
  helpersGroup.rotation.copy(ownObject.rotation);
  
  // ⭐ ЭТАП 6: Видимость helpers (референс строка 2883)
  // Референс: this['userData']['helpers']['visible'] = 0x1 == this['userData']['params']['helpers_visible']
  // Референс: 0x1 == 1, поэтому helpersGroup.visible = (params.helpers_visible === 1)
  helpersGroup.visible = params.helpers_visible === 1; // ⭐ 1 В 1 С РЕФЕРЕНСОМ (строка 2883)
  
  // ⭐ ДОПОЛНИТЕЛЬНО: Явно скрываем edges для корневой секции (чёрная рамка не должна быть видна)
  if (params.helpers_visible === 0) {
    edges.visible = false; // ⭐ Скрываем edges для корневой секции
  }
  
  // ⭐ ВАЖНО: Убеждаемся, что секция видима (но helpers скрыты)
  sectionGroup.visible = true;
  ownObject.visible = true;
  // helpersGroup.visible = false; // Уже установлено выше
  
  return {
    sectionGroup,
    ownObject,
    computed,
    params,
    c_object,
    helpersGroup,
  };
}

function addBox(createParams?: Partial<CreateParams>) {
  if (!currentDecor) return;
  
  // ВАЖНО: Проверяем, есть ли уже корневая секция
  // Если есть - обновляем её размеры, а не создаём новую
  const existingRootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null);
  if (existingRootSection) {
    console.log('⚠️ Корневая секция уже существует, обновляем размеры вместо создания новой');
    const p = { ...defaultCreateParams, ...(createParams || {}) };
    
    // Если название не передано, пытаемся получить его из поля "Название" во вкладке "Основные"
    if (!p.name || p.name === defaultCreateParams.name) {
      const nameInput = document.getElementById('catalog-item-edit-name') as HTMLInputElement | null;
      if (nameInput && nameInput.value.trim()) {
        p.name = nameInput.value.trim();
      }
    }
    
    // Обновляем название если изменилось
    if (p.name && p.name !== existingRootSection.name) {
      existingRootSection.name = p.name;
      const rootModuleText = document.getElementById('constructor-root-module-name');
      if (rootModuleText) {
        rootModuleText.textContent = p.name;
      }
    }
    
    // Обновляем размеры через updateRootSectionSize (которая обновит секцию и пересчитает детали)
    if ((window as any).updateRootSectionSize) {
      (window as any).updateRootSectionSize(p.width, p.height, p.depth);
    }
    selectNode(existingRootSection);
    return;
  }
  
  // Секции нет - создаём новую
  const p = { ...defaultCreateParams, ...(createParams || {}) };
  
  // Если название не передано, пытаемся получить его из поля "Название" во вкладке "Основные"
  if (!p.name || p.name === defaultCreateParams.name) {
    const nameInput = document.getElementById('catalog-item-edit-name') as HTMLInputElement | null;
    if (nameInput && nameInput.value.trim()) {
      p.name = nameInput.value.trim();
    }
  }
  
  // Размеры в миллиметрах (как в референсе computed.size)
  const sizeX_mm = p.width;
  const sizeY_mm = p.height;
  const sizeZ_mm = p.depth;

  console.log('🔷 [addBox] Добавляем секцию в сцену:', { 
    name: p.name, 
    size_mm: { x: sizeX_mm, y: sizeY_mm, z: sizeZ_mm }
  });
  
  // ⭐ РЕФАКТОРИНГ: Используем createRootSection() (1 В 1 С РЕФЕРЕНСОМ)
  // Референс: main_core_v2_part18.js:2344-2376 (конструктор CabinetSection)
  const { sectionGroup: parent, ownObject, computed, params, c_object, helpersGroup } = createRootSection(
    p.name,
    sizeX_mm,
    sizeY_mm,
    sizeZ_mm
  );
  
  console.log('✅ [addBox] own_object создан по референсу:', {
    size_mm: { x: sizeX_mm, y: sizeY_mm, z: sizeZ_mm },
    positionAfterPivot: ownObject.position.clone(),
    visible: ownObject.visible,
    hasStruct: !!parent.userData.struct,
    hasChildrenRef: !!parent.userData.children
  });
  
  console.log('🔷 [addBox] Видимость перед добавлением:', { 
    parentVisible: parent.visible, 
    ownObjectVisible: ownObject.visible,
    helpersVisible: helpersGroup.visible
  });
  
  scene.add(parent);
  console.log('✅ [addBox] Секция добавлена в scene, children в scene:', scene.children.length);
  selectMesh(null);
  
  // Создаем только родительскую секцию с заданным названием
  const parentNode: SceneNode = {
    id: generateId(),
    name: p.name,
    type: 'section', // Основная родительская секция
    group: parent,
    children: [],
    parent: null,
    expanded: true,
  };
  
  // ⭐ ЭТАП 1: 1 В 1 С РЕФЕРЕНСОМ - данные только в userData, НЕ в metadata
  // Референс НЕ использует metadata, все данные в userData группы
  // Помечаем как root секцию в userData
  parent.userData.is_root = true;
  
  // ⭐ ВАЖНО: metadata оставляем минимальным только для обратной совместимости
  // (если есть старый код, который еще читает metadata)
  if (!parentNode.metadata) parentNode.metadata = {};
  parentNode.metadata.is_root = true; // Только флаг для совместимости
  
  // Обновляем отображение названия в конструкторе
  const rootModuleText = document.getElementById('constructor-root-module-name');
  if (rootModuleText) {
    rootModuleText.textContent = p.name;
  }
  
  // Визуальный каркас (buildParentFrame) добавляется в parent, но не создаем отдельный узел в дереве
  // Габаритный каркас больше не создается как отдельный элемент дерева
  registerNode(parentNode);
  console.log('✅ [addBox] Секция зарегистрирована в sceneNodes:', { id: parentNode.id, name: parentNode.name, sceneNodesCount: sceneNodes.length });
  selectNode(parentNode); // Автоматически выбираем созданную секцию
  
  // Сохраняем структуру в userData группы (референс использует userData.struct)
  parent.userData.struct = parent.userData.struct || {};
  parent.userData.children = ownObject.children;
  
  // Обновляем камеру, чтобы видеть секцию (как в референсе)
  // Вычисляем центр секции в мировых координатах и настраиваем камеру
  parent.updateMatrixWorld(true); // Обновляем мировую матрицу для правильного расчета bbox
  const bbox = new THREE.Box3().setFromObject(parent);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  const size = bbox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1; // минимум 1 метр
  
  // Позиционируем камеру так, чтобы видеть всю секцию
  const distance = maxDim * 2.5; // отступ для обзора
  camera.position.set(
    center.x + distance * 0.7,
    center.y + distance * 0.5,
    center.z + distance * 0.7
  );
  controls.target.copy(center);
  controls.update();
  
  console.log('✅ [addBox] Камера настроена на секцию:', { center: center, size: size, cameraPos: camera.position.clone(), maxDim });
}

// Глобальная функция для обновления названия корневой секции
(window as any).updateRootSectionName = (name: string) => {
  // Находим корневую секцию (parent === null, type === 'section')
  const rootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null);
  if (rootSection) {
    rootSection.name = name || 'Корпус';
    console.log('✅ Название корневой секции обновлено:', rootSection.name);
  } else {
    console.warn('⚠️ Корневая секция не найдена для обновления названия');
  }
};

// Глобальная функция для обновления размеров корневой секции с автоматическим пересчётом деталей
(window as any).updateRootSectionSize = (width: number, height: number, depth: number) => {
  // Находим корневую секцию (parent === null, type === 'section')
  const rootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null);
  if (!rootSection) {
    console.warn('⚠️ Корневая секция не найдена для обновления размеров');
    return;
  }
  
  const oldSize = rootSection.metadata?.size || { x: 0, y: 0, z: 0 };
  
  // ⭐ ПРОВЕРКА: Если oldSize слишком маленький (< 1), значит он в метрах, а не в мм
  // Нужно умножить на 1000 для получения мм
  let oldSizeInMm = { x: oldSize.x, y: oldSize.y, z: oldSize.z };
  if (oldSize.x < 1 && oldSize.x > 0) {
    console.warn('⚠️ [updateRootSectionSize] oldSize.x < 1, умножаем на 1000 (вероятно было в метрах)');
    oldSizeInMm.x = oldSize.x * 1000;
  }
  if (oldSize.y < 1 && oldSize.y > 0) {
    console.warn('⚠️ [updateRootSectionSize] oldSize.y < 1, умножаем на 1000 (вероятно было в метрах)');
    oldSizeInMm.y = oldSize.y * 1000;
  }
  if (oldSize.z < 1 && oldSize.z > 0) {
    console.warn('⚠️ [updateRootSectionSize] oldSize.z < 1, умножаем на 1000 (вероятно было в метрах)');
    oldSizeInMm.z = oldSize.z * 1000;
  }
  
  // Конвертируем мм в метры и округляем до 6 знаков после запятой
  // Это гарантирует, что при обратном умножении на 1000 получим целые миллиметры
  const newWidth = Math.round((width / 1000) * 1000000) / 1000000;
  const newHeight = Math.round((height / 1000) * 1000000) / 1000000;
  const newDepth = Math.round((depth / 1000) * 1000000) / 1000000;
  
  console.log('🔧 Обновление размеров корневой секции:', {
    oldSize_raw: { x: oldSize.x, y: oldSize.y, z: oldSize.z },
    oldSize_corrected: oldSizeInMm,
    newSize: { x: width, y: height, z: depth, unit: 'мм' },
    'проверка_единиц': {
      'oldSize.x_<1': oldSize.x < 1,
      'oldSize.y_<1': oldSize.y < 1,
      'oldSize.z_<1': oldSize.z < 1,
    }
  });
  
  // Обновляем metadata
  // ⭐ ИСПРАВЛЕНО: Сохраняем размеры в мм (как в референсе computed.size)
  // width, height, depth уже в мм, поэтому сохраняем как есть
  if (!rootSection.metadata) rootSection.metadata = {};
  rootSection.metadata.size = { x: width, y: height, z: depth }; // В мм
  rootSection.metadata.size_three = { x: newWidth, y: newHeight, z: newDepth }; // В метрах для Three.js
  rootSection.metadata.originalSize = { x: width, y: height, z: depth }; // В мм
  
  // Обновляем рамку
  // buildParentFrame возвращает Group, который добавляется напрямую в group секции через parent.add(frame)
  // Ищем все Group-ы, которые являются рамками (не детали, не оси)
  const frameGroups: THREE.Group[] = [];
  const frameElements: THREE.Object3D[] = [];
  
  // ⭐ ВАЖНО: Получаем helpersGroup, чтобы НЕ удалять его
  const helpersGroup = rootSection.metadata?.helpers as THREE.Group | undefined;
  
  rootSection.group.children.forEach(child => {
    // ⭐ ПРОПУСКАЕМ helpersGroup - его не удаляем!
    if (child === helpersGroup) {
      return;
    }
    
    if (child.type === 'Group' && !child.userData?.isDetail && !child.userData?.isAxes) {
      // Проверяем, является ли эта группа рамкой (содержит меши/линии, но не детали)
      const group = child as THREE.Group;
      const hasFrameElements = group.children.some(c => 
        ((c as THREE.Mesh).isMesh && !(c as THREE.Mesh).userData?.isPivotMarker && !(c as THREE.Mesh).userData?.isDetail) ||
        (c as THREE.LineSegments).isLineSegments ||
        c instanceof THREE.AxesHelper
      );
      const hasDetails = group.children.some(c => (c as THREE.Mesh).userData?.isDetail || (c as THREE.Group).userData?.isDetail);
      
      if (hasFrameElements && !hasDetails) {
        frameGroups.push(group);
      }
    } else if (!child.userData?.isDetail && !child.userData?.isAxes && !child.userData?.isPivotMarker) {
      // Если это не группа, а прямой элемент (меш или линия) без userData детали - это может быть рамка
      if ((child as THREE.Mesh).isMesh || (child as THREE.LineSegments).isLineSegments) {
        frameElements.push(child);
      }
    }
  });
  
  // Удаляем все найденные группы рамки
  frameGroups.forEach(frameGroup => {
    console.log('📦 Удаляем группу рамки');
    // Рекурсивно удаляем геометрию и материалы
    frameGroup.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mat = mesh.material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else mat.dispose();
        }
      }
    });
    rootSection.group.remove(frameGroup);
  });
  
  // Удаляем найденные элементы рамки (если они не в группах)
  frameElements.forEach(child => {
    console.log('📦 Удаляем элемент рамки');
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat.dispose();
      }
    }
    rootSection.group.remove(child);
  });
  
  // ⭐ УДАЛЕНО: buildParentFrame - код сохранен в REMOVED_buildParentFrame_code.ts
  
  // ⭐ ВАЖНО: Обновляем helper куб и маркеры в helpersGroup (как в updateSectionFromInputs)
  const ownObject = rootSection.metadata?.own_object as THREE.Group | undefined;
  // helpersGroup уже получен выше, используем его
  
  if (helpersGroup && ownObject) {
    console.log('🔄 [updateRootSectionSize] Обновляем helper куб и маркеры в helpersGroup');
    
    // Обновляем позицию own_object
    ownObject.position.set(-newWidth / 2, 0, -newDepth / 2);
    
    // ⭐ ВАЖНО: helpers копируют позицию от own_object (как в референсе)
    helpersGroup.position.copy(ownObject.position);
    
    // Обновляем размеры и позицию куба
    const oldCube = helpersGroup.children.find(c => 
      c.userData?.is_helper === true && c.userData?.is_root_section === true
    ) as THREE.Mesh | undefined;
    
    if (oldCube) {
      // Создаем новую геометрию и заменяем старую
      const newGeometry = new THREE.BoxGeometry(newWidth, newHeight, newDepth);
      const oldGeometry = oldCube.geometry;
      oldCube.geometry = newGeometry;
      if (oldGeometry) {
        oldGeometry.dispose();
      }
      oldCube.position.set(newWidth / 2, newHeight / 2, newDepth / 2);
      // ⭐ РЕФЕРЕНС: Используем материал из pp.three.materials.helper_cube (как в референсе)
      const helperCubeMaterial = (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.helper_cube)
        ? (window as any).pp.three.materials.helper_cube
        : undefined;
      if (helperCubeMaterial && oldCube.material !== helperCubeMaterial) {
        oldCube.material = helperCubeMaterial;
      }
      oldCube.visible = true; // Видимость контролируется через helpersGroup.visible
      
      console.log('✅ [updateRootSectionSize] Helper куб обновлен');
    }
    
    // Удаляем старые маркеры (зеленые и красный)
    const markersToRemove: THREE.Object3D[] = [];
    helpersGroup.children.forEach(child => {
      if (child.userData?.is_root_corner || child.userData?.is_root_corner_red) {
        markersToRemove.push(child);
      }
    });
    
    markersToRemove.forEach(child => {
      helpersGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material) (child.material as THREE.Material).dispose();
      }
    });
    
    // ⭐ КРАСНЫЙ маркер в нижнем левом заднем углу (back-bottom-left) - точка отсчета размеров
    const backBottomLeftCorner = { x: 0, y: 0, z: 0 }; // В локальных координатах helpersGroup
    const redCornerMarkerGeo = new THREE.SphereGeometry(0.015, 16, 16); // ⭐ УМЕНЬШЕН В 2 РАЗА (было 0.03)
    const redCornerMarkerMat = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, // КРАСНЫЙ
      depthTest: false 
    });
    const redCornerMarker = new THREE.Mesh(redCornerMarkerGeo, redCornerMarkerMat);
    redCornerMarker.position.set(backBottomLeftCorner.x, backBottomLeftCorner.y, backBottomLeftCorner.z);
    redCornerMarker.userData.is_root_corner_red = true;
    redCornerMarker.name = '__root_corner_back_bottom_left_RED';
    helpersGroup.add(redCornerMarker);
    
    // Обновляем матрицы и рендерим
    helpersGroup.updateMatrixWorld(true);
    render();
    
    console.log('✅ [updateRootSectionSize] Маркеры обновлены');
  }
  
  // ⭐ ВАЖНО: Обновляем userData.computed.size корневой секции ПЕРЕД обновлением дочерних
  // Референс: размеры хранятся в userData.computed.size (в мм), а не только в metadata
  if (!rootSection.group.userData.computed) {
    rootSection.group.userData.computed = {};
  }
  if (!rootSection.group.userData.computed.size) {
    rootSection.group.userData.computed.size = new THREE.Vector3();
  }
  rootSection.group.userData.computed.size.set(width, height, depth); // В мм
  rootSection.group.userData.computed.u_size = rootSection.group.userData.computed.u_size || new THREE.Vector3();
  rootSection.group.userData.computed.u_size.set(newWidth, newHeight, newDepth); // В метрах
  
  // Обновляем стрелки размеров
  buildInitialDimensions(width, height, rootSection);
  
  // ⭐ РЕФЕРЕНС: Вызываем rebuildSection для пересборки всех дочерних секций
  // Референс: main_core_v2_part18.js - _rebuild() → _build() → _build_size() для всех дочерних элементов
  // rebuildSection пересчитает размеры дочерних секций через _build_size() с актуальным parent_size
  console.log('🔄 [updateRootSectionSize] Вызываем rebuildSection для корневой секции (пересоберёт всех детей):', rootSection.name);
    rebuildSection(rootSection);
  
  // ⭐ Синхронизируем JSON (clodisJSON + textarea) — чтобы не терялся при сохранении
  updateClodisJSONFromScene();
  
  // Обновляем камеру
  rootSection.group.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(rootSection.group);
  if (!bbox.isEmpty()) {
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;
    
    controls.target.copy(center);
    camera.position.set(center.x, center.y, center.z + distance);
    controls.update();
    render();
  }
  
  console.log('✅ Размеры корневой секции обновлены');
};

// Глобальная функция для создания секции по умолчанию, если её нет
(window as any).ensureDefaultSection = () => {
  // Проверяем, есть ли уже корневая секция
  const rootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null);
  if (rootSection) {
    console.log('✅ Корневая секция уже существует:', rootSection.name);
    return rootSection;
  }
  console.warn('⚠️ Корневая секция отсутствует. Создайте её вручную.');
  return null;
};

function addShelf(params?: Partial<CreateParams>) {
  if (!currentDecor) return;
  const p = { ...defaultCreateParams, ...(params || {}) };
  const w = p.width / 1000;
  const h = 0.016; // default shelf thickness 16mm for placeholder
  const d = p.depth / 1000;
  const parent = new THREE.Group();
  parent.position.set(0, 0, 0);

  // ⭐ УДАЛЕНО: buildParentFrame - код сохранен в REMOVED_buildParentFrame_code.ts

  scene.add(parent);
  const targetMesh = frame.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh;
  selectMesh(targetMesh);
  const parentNode: SceneNode = {
    id: generateId(),
    name: p.name || 'Полка',
    type: 'shelf',
    group: parent,
    children: [],
  };
  // ⭐ ЭТАП 4: Синхронизируем SceneNode в userData (движемся к архитектуре референса)
  syncSceneNodeToUserData(parentNode);
  // Визуальный каркас создается через buildParentFrame, но не создаем отдельный узел в дереве
  // Габаритный каркас больше не создается как отдельный элемент дерева
  registerNode(parentNode);
}

function selectMesh(mesh: THREE.Mesh | null) {
  selectedMesh = mesh;
}

function deleteSelected() {
  if (!currentSelectedNode) {
    alert('Нет выделенного элемента для удаления');
    return;
  }

  // Нельзя удалить корневой элемент, если это единственный элемент
  if (sceneNodes.length === 1 && sceneNodes[0] === currentSelectedNode) {
    if (confirm('Это последний элемент в сцене. Удалить его?')) {
      // Удаляем последний элемент
      const node = currentSelectedNode;
      scene.remove(node.group);
      
      // Очищаем геометрию и материалы
      node.group.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach(mm => mm.dispose());
          } else {
            m.material.dispose();
          }
        }
      });
      
      const idx = sceneNodes.findIndex(n => n.id === node.id);
      if (idx >= 0) {
        sceneNodes.splice(idx, 1);
      }
      
      currentSelectedNode = null;
      renderHierarchy();
    }
    return;
  }

  const nodeToRemove = currentSelectedNode;
  
  // Удаляем узел из родительского узла
  if (nodeToRemove.parent) {
    // Удаляем из children родителя
    const parentChildren = nodeToRemove.parent.children;
    const childIndex = parentChildren.findIndex(child => child.id === nodeToRemove.id);
    if (childIndex >= 0) {
      parentChildren.splice(childIndex, 1);
    }
    
    // Удаляем группу из родительской группы
    if (nodeToRemove.parent.group.children.includes(nodeToRemove.group)) {
      nodeToRemove.parent.group.remove(nodeToRemove.group);
    }
  } else {
    // Если нет родителя, удаляем из корня сцены
    if (scene.children.includes(nodeToRemove.group)) {
      scene.remove(nodeToRemove.group);
    }
  }

  // Если удаляется деталь, нужно также удалить её оси из родительской секции
  if (nodeToRemove.type === 'detail' && nodeToRemove.parent) {
    const axesToRemove = nodeToRemove.parent.group.children.find(
      c => c.userData?.isAxes && c.userData?.detailId === nodeToRemove.id
    ) as THREE.Group | undefined;
    if (axesToRemove) {
      nodeToRemove.parent.group.remove(axesToRemove);
      // Очищаем геометрию и материалы осей
      axesToRemove.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          if (mesh.material) {
            const mat = mesh.material as THREE.Material;
            mat.dispose();
          }
        }
      });
    }
  }

  // Очищаем геометрию и материалы
  nodeToRemove.group.traverse(obj => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = obj as THREE.Mesh;
      m.geometry.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach(mm => mm.dispose());
      } else {
        m.material.dispose();
      }
    }
  });

  // Удаляем из sceneNodes (рекурсивно для всех дочерних узлов)
  function removeNodeFromSceneNodes(node: SceneNode) {
    // Сначала удаляем дочерние узлы
    node.children.forEach(child => removeNodeFromSceneNodes(child));
    
    // Затем удаляем сам узел
    const idx = sceneNodes.findIndex(n => n.id === node.id);
    if (idx >= 0) {
      sceneNodes.splice(idx, 1);
    }
  }
  
  removeNodeFromSceneNodes(nodeToRemove);

  // Сбрасываем выделение
  currentSelectedNode = null;
  selectedMesh = null;
  
  // Убираем визуальное выделение
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper.dispose();
    selectionHelper = null;
  }
  
  // Очищаем информацию
  clearDetailInfo();
  
  // Обновляем иерархию
  renderHierarchy();
  
  console.log('✅ Узел удален:', nodeToRemove.name);
}

function resetView() {
  controls.target.set(0, 1, 0);
  camera.position.set(4, 3, 4);
  controls.update();
}

// Полный сброс сцены конструктора для нового модуля каталога
function resetConstructorSceneForNewCatalogItem() {
  console.log('🧹 [resetConstructorSceneForNewCatalogItem] Сбрасываем сцену для нового модуля');

  // Удаляем все объекты из сцены, кроме базовых (свет, сетка и т.п.)
  scene.children
    .filter(obj => !obj.userData?.isBaseObject)
    .forEach(obj => {
      scene.remove(obj);
    });

  // Очищаем иерархию узлов
  sceneNodes.length = 0;
  (window as any).sceneNodes = sceneNodes;
  currentSelectedNode = null;

  // Чистим selectionHelper
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper.dispose();
    selectionHelper = null;
  }

  // Очищаем панель свойств и HUD
  clearDetailInfo();
  const hierarchyContainer = document.getElementById('constructor-hierarchy');
  if (hierarchyContainer) {
    hierarchyContainer.innerHTML = '';
  }

  // Камеру возвращаем в стандартное положение
  resetView();

  // Берём размеры корневой секции из полей ввода (как в референсе)
  const widthInputEl = document.getElementById('catalog-item-edit-width') as HTMLInputElement | null;
  const heightInputEl = document.getElementById('catalog-item-edit-height') as HTMLInputElement | null;
  const depthInputEl = document.getElementById('catalog-item-edit-depth') as HTMLInputElement | null;

  // Размеры в миллиметрах (как в референсе computed.size)
  const sizeX_mm = widthInputEl && widthInputEl.value ? parseFloat(widthInputEl.value) || 400 : 400;
  const sizeY_mm = heightInputEl && heightInputEl.value ? parseFloat(heightInputEl.value) || 400 : 400;
  const sizeZ_mm = depthInputEl && depthInputEl.value ? parseFloat(depthInputEl.value) || 200 : 200;
  // Показываем только стрелки размеров, без автосоздания секции/модуля (как на первом экране референса)
  buildInitialDimensions(sizeX_mm, sizeY_mm);
  render();
  console.log('✅ [resetConstructorSceneForNewCatalogItem] Только размерные стрелки добавлены (без секции/модуля):', {
    size_mm: { x: sizeX_mm, y: sizeY_mm, z: sizeZ_mm }
  });
}

// Рекурсивная отрисовка узла иерархии (как на скриншоте)
function renderHierarchyNode(node: SceneNode, container: HTMLElement, level: number = 0) {
  const hasChildren = node.children.length > 0;
  
  // Основной элемент иерархии
  const item = document.createElement('div');
  item.className = 'hier-item';
  item.dataset.nodeId = node.id;
  item.style.cursor = 'pointer';
  item.style.padding = '8px 10px';
  item.style.display = 'flex';
  item.style.alignItems = 'center';
  item.style.gap = '8px';
  item.style.justifyContent = 'space-between';
  
  const leftPart = document.createElement('div');
  leftPart.style.display = 'flex';
  leftPart.style.alignItems = 'center';
  leftPart.style.gap = '8px';
  leftPart.style.flex = '1';
  
  // Иконка раскрытия/сворачивания (треугольник)
  if (hasChildren) {
    const expandIcon = document.createElement('span');
    expandIcon.textContent = node.expanded ? '▼' : '▶';
    expandIcon.style.fontSize = '10px';
    expandIcon.style.color = '#666';
    expandIcon.style.cursor = 'pointer';
    expandIcon.className = 'expand-icon';
    expandIcon.onclick = (e) => {
      e.stopPropagation();
      node.expanded = !node.expanded;
      renderHierarchy();
    };
    leftPart.appendChild(expandIcon);
  }
  
  // Название узла
  const title = document.createElement('span');
  // ⭐ РЕФЕРЕНС: Корневой контейнер без имени отображается как "(модуль без названия)"
  const displayName = (node.metadata?.is_root_container && !node.name) 
    ? '(модуль без названия)' 
    : (node.name || '(без названия)');
  title.textContent = displayName;
  title.style.fontWeight = level === 0 ? '600' : '400';
  title.style.fontSize = '13px';
  leftPart.appendChild(title);
  
  item.appendChild(leftPart);
  
  // Три точки справа для меню (для всех секций)
  if (node.type === 'section') {
    const menuButton = document.createElement('button');
    menuButton.innerHTML = '⋯';
    menuButton.style.background = 'none';
    menuButton.style.border = 'none';
    menuButton.style.fontSize = '18px';
    menuButton.style.color = '#666';
    menuButton.style.cursor = 'pointer';
    menuButton.style.padding = '4px 8px';
    menuButton.style.lineHeight = '1';
    menuButton.className = 'hierarchy-menu-btn';
    menuButton.onclick = (e) => {
      e.stopPropagation();
      showHierarchyMenu(node, menuButton);
    };
    item.appendChild(menuButton);
  }
  
  // Обработчик клика по элементу
  item.onclick = (e) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (target.classList.contains('hierarchy-menu-btn') || target.classList.contains('expand-icon')) {
      return;
    }
    selectNode(node);
  };
  
  // Подсветка выбранного элемента
  if (currentSelectedNode?.id === node.id) {
    item.style.backgroundColor = '#f0f0f0';
  }
  
  container.appendChild(item);
  
  // Дочерние элементы отображаются рекурсивно (если узел раскрыт)
  // Пропускаем элементы типа 'frame' - они не должны отображаться в дереве
  if (hasChildren && node.expanded) {
    node.children.forEach(child => {
      if (child.type !== 'frame') {
        renderHierarchyNode(child, container, level + 1);
      }
    });
  }
}

// Показать меню для элемента иерархии
function showHierarchyMenu(node: SceneNode, button: HTMLElement) {
  // Удаляем старое меню если есть
  const oldMenu = document.getElementById('hierarchy-context-menu');
  if (oldMenu) {
    oldMenu.remove();
  }
  
  const menu = document.createElement('div');
  menu.id = 'hierarchy-context-menu';
  menu.style.position = 'absolute';
  menu.style.background = '#fff';
  menu.style.border = '1px solid #ddd';
  menu.style.borderRadius = '4px';
  menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  menu.style.zIndex = '1000';
  menu.style.minWidth = '150px';
  menu.style.padding = '4px 0';
  
  const rect = button.getBoundingClientRect();
  menu.style.left = `${rect.right - 150}px`;
  menu.style.top = `${rect.bottom + 4}px`;
  
  // Вспомогательный хелпер для кнопок меню
  const makeMenuButton = (label: string, onClick: () => void) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.width = '100%';
    btn.style.textAlign = 'left';
    btn.style.padding = '8px 12px';
    btn.style.border = 'none';
    btn.style.background = 'none';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '13px';
    btn.onclick = () => {
      menu.remove();
      onClick();
    };
    return btn;
  };

  // Переименовать
  const renameBtn = makeMenuButton('✏️ Переименовать', () => {
    const newName = prompt('Новое имя элемента:', node.name);
    if (!newName || !newName.trim()) return;
    node.name = newName.trim();
    renderHierarchy();
  });
  menu.appendChild(renameBtn);

  // Копировать
  const copyBtn = makeMenuButton('📄 Копировать', () => {
    (window as any).copyTreeElement(node.id);
  });
  menu.appendChild(copyBtn);

  // Вырезать
  const cutBtn = makeMenuButton('✂️ Вырезать', () => {
    (window as any).cutTreeElement(node.id);
  });
  menu.appendChild(cutBtn);

  // Вставить (если есть что вставлять)
  if (clipboardNode) {
    const pasteBtn = makeMenuButton(
      clipboardIsCut ? '📋 Вставить (вырезано)' : '📋 Вставить',
      () => {
        (window as any).pasteTreeElement(node.id);
        renderHierarchy();
      },
    );
    menu.appendChild(pasteBtn);
  }

  // Клонировать (дубликат в той же секции)
  const cloneBtn = makeMenuButton('📑 Клонировать', () => {
    (window as any).cloneTreeElement(node.id);
    renderHierarchy();
  });
  menu.appendChild(cloneBtn);

  // Удалить (без подтверждения, как в референсе)
  const deleteBtn = makeMenuButton('🗑 Удалить', () => {
    (window as any).deleteTreeElement(node.id);
    renderHierarchy();
  });
  menu.appendChild(deleteBtn);
  
  document.body.appendChild(menu);
  
  // Закрыть меню при клике вне его
  const closeMenu = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && e.target !== button) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

function renderHierarchy() {
  const list = document.getElementById('hierarchy-list');
  if (!list) return;
  list.innerHTML = '';
  if (sceneNodes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'hier-item';
    empty.textContent = 'Нет элементов';
    list.appendChild(empty);
    return;
  }
  sceneNodes.forEach(node => {
    renderHierarchyNode(node, list, 0);
  });
}

// Открыть модалку добавления элемента
function openAddModal(parentNode: SceneNode) {
  const backdrop = document.getElementById('add-modal-backdrop');
  if (!backdrop) return;
  
  backdrop.style.display = 'flex';
  
  // Сброс значений
  const typeSelect = document.getElementById('add-inp-type') as HTMLSelectElement;
  const nameInput = document.getElementById('add-inp-name') as HTMLInputElement;
  const elementTypeSelect = document.getElementById('add-inp-element-type') as HTMLSelectElement;
  const typeSelectorDiv = document.getElementById('add-type-selector');
  
  if (typeSelect) typeSelect.value = 'section';
  if (nameInput) nameInput.value = 'Секция';
  if (typeSelectorDiv) typeSelectorDiv.style.display = 'none';
  
  // Загружаем типы элементов в селектор
  const loadElementTypes = () => {
    if (!elementTypeSelect) return;
    elementTypeSelect.innerHTML = '';
    const types = getElementTypes();
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      elementTypeSelect.appendChild(option);
    });
  };
  loadElementTypes();
  
  // Обработчик изменения типа - если выбран "Деталь", показываем специальную модалку
  // Если выбран "Из каталога", показываем селектор типа
  const handleTypeChange = () => {
    if (typeSelect?.value === 'detail') {
      backdrop.style.display = 'none';
      openDetailTypeModal(parentNode);
      return;
    }
    
    if (typeSelectorDiv) {
      typeSelectorDiv.style.display = typeSelect?.value === 'from-catalog' ? 'block' : 'none';
    }
  };
  
  // Удаляем старый обработчик если есть
  typeSelect?.removeEventListener('change', handleTypeChange);
  typeSelect?.addEventListener('change', handleTypeChange);
  
  // Обработчик кнопки "Управление типами"
  const manageTypesBtn = document.getElementById('btn-manage-types');
  if (manageTypesBtn) {
    manageTypesBtn.onclick = () => {
      openTypesManagementModal();
    };
  }
  
  // Закрытие модалки
  const closeBtn = document.getElementById('add-modal-close');
  const cancelBtn = document.getElementById('add-modal-cancel');
  const confirmBtn = document.getElementById('add-modal-confirm');
  
  const handleClose = () => {
    backdrop.style.display = 'none';
    typeSelect?.removeEventListener('change', handleTypeChange);
  };
  
  // Обработчик подтверждения
  const handleConfirm = (e?: Event) => {
    if (e) e.preventDefault();
    
    const type = typeSelect?.value || 'section';
    const name = nameInput?.value?.trim() || 'Секция';
    
    // Если выбран тип "Деталь", открываем модалку выбора типа детали
    if (type === 'detail') {
      handleClose();
      openDetailTypeModal(parentNode, name);
      return;
    }
    
    // Если выбран "Из каталога", открываем каталог
    if (type === 'from-catalog') {
      const elementType = elementTypeSelect?.value || 'other';
      handleClose();
      // Показываем каталог и фильтруем по типу
      renderCatalog(elementType);
      // Прокручиваем к каталогу
      setTimeout(() => {
        const catalogList = document.getElementById('catalog-list');
        if (catalogList) {
          catalogList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }
    
    // Если выбран "GLB модель", открываем диалог загрузки
    if (type === 'glb') {
      handleClose();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.glb,.gltf';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          loadGLBFile(file, parentNode, name);
        }
      };
      input.click();
      return;
    }
    
    if (!name || name === '') {
      alert('Введите название элемента');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
      return;
    }
    
    console.log('Создание элемента:', { type, name, parent: parentNode.name });
    
    try {
      // Создаем новый узел в зависимости от типа
      if (type === 'section') {
        // Получаем размеры родителя для создания рамки того же размера
        const parentBbox = new THREE.Box3().setFromObject(parentNode.group);
        const parentSize = parentBbox.max.clone().sub(parentBbox.min);
        
        // В CAD системах нулевые размеры допустимы (плоские объекты)
        // Проверяем только, что не все размеры нулевые
        if (parentSize.x <= 0 && parentSize.y <= 0 && parentSize.z <= 0) {
          alert('Невозможно создать секцию: родитель не имеет размеров. Хотя бы один размер должен быть больше нуля.');
          return;
        }
        
        // Создаем группу для секции
        const sectionGroup = new THREE.Group();
        sectionGroup.position.set(0, 0, 0); // Начальная позиция в родителе
        
        // ⭐ УДАЛЕНО: buildParentFrame - код сохранен в REMOVED_buildParentFrame_code.ts
        
        const newNode: SceneNode = {
          id: generateId(),
          name: name,
          type: 'section',
          group: sectionGroup,
          children: [],
          parent: parentNode,
          expanded: false,
          metadata: {
            size: { x: parentSize.x, y: parentSize.y, z: parentSize.z },
            position: { x: 0, y: 0, z: 0 },
          },
        };
        // ⭐ ЭТАП 4: Синхронизируем SceneNode в userData
        syncSceneNodeToUserData(newNode);
        
        // ⭐ РЕФЕРЕНС: addChildNode() добавляет в parentOwnObject, не нужно дублировать parentNode.group.add()
        addChildNode(parentNode, newNode);
        selectNode(newNode); // Выбираем созданную секцию
        console.log('✅ Секция создана:', newNode.name);
        
        // Добавляем элемент в HTML дерево
        setTimeout(() => {
          if ((window as any).addElementToTreeFrom3D) {
            console.log('🔧 Вызываем addElementToTreeFrom3D для секции:', name);
            const depth = getNodeDepth(newNode);
            // Передаем ID узла, чтобы HTML мог правильно установить data-element-id
            (window as any).addElementToTreeFrom3D('section', name, parentNode.id, depth, newNode.id);
          }
        }, 50);
      } else if (type === 'body') {
        const newNode: SceneNode = {
          id: generateId(),
          name: name,
          type: 'body',
          group: new THREE.Group(),
          children: [],
          parent: parentNode,
          expanded: false,
        };
        // ⭐ ЭТАП 4: Синхронизируем SceneNode в userData
        syncSceneNodeToUserData(newNode);
        // ⭐ РЕФЕРЕНС: addChildNode() добавляет в parentOwnObject, не нужно дублировать parentNode.group.add()
        addChildNode(parentNode, newNode);
      } else if (['wall', 'bottom', 'top', 'back'].includes(type)) {
        createPart(parentNode, type as 'wall' | 'bottom' | 'top' | 'back', name);
      } else if (['groove', 'confirmat', 'facade'].includes(type)) {
        createSubElement(parentNode, type as 'groove' | 'confirmat' | 'facade', name);
      }
      
      handleClose();
    } catch (error) {
      console.error('Ошибка при создании элемента:', error);
      alert('Ошибка при создании элемента: ' + (error as Error).message);
    }
  };
  
  // Устанавливаем обработчики
  if (closeBtn) {
    closeBtn.onclick = handleClose;
  }
  if (cancelBtn) {
    cancelBtn.onclick = handleClose;
  }
  if (confirmBtn) {
    confirmBtn.onclick = handleConfirm;
  }
  
  // Закрытие по клику на backdrop
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      handleClose();
    }
  };
  
  // Закрытие по Enter в поле названия
  if (nameInput) {
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };
    // Фокус и выделение текста для удобства редактирования
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 100);
  }
}

// Типы деталей с их параметрами для превью
// Структура для выражений размеров и позиций (для Clodis-совместимости)
type DetailExpressions = {
  size?: { x?: string | number; y?: string | number; z?: string | number };
  pos?: { x?: string | number; y?: string | number; z?: string | number };
};

// ⭐ НОВАЯ СИСТЕМА ДЕТАЛЕЙ ПО Clodis
// Используется только createDetailClodis() - создание деталей строго по референсу

// ⭐ СТАРЫЙ СПИСОК ТИПОВ ДЕТАЛЕЙ (ВРЕМЕННО НЕ ИСПОЛЬЗУЕТСЯ)
// Оставляем как справочник, но UI и логика создания деталей будут опираться на новую реализацию.
const detailTypes = [
  { 
    id: 'back_front', 
    name: 'Задняя фронтальная', 
    orientation: 'vertical' as const, 
    position: 'back-front',
    // Выражения для Clodis-совместимости (опционально, если не заданы - используются фиксированные значения)
    expressions: {
      size: { x: 's:x', y: 's:y', z: 'g:g0.thickness' },
      pos: { x: 0, y: 0, z: 0 }
    } as DetailExpressions
  },
  { 
    id: 'vertical_left', 
    name: 'Вертикальная левая', 
    orientation: 'vertical' as const, 
    position: 'vertical-left',
    expressions: {
      // ⭐ РЕФЕРЕНС: Вертикальная левая деталь строго по референсу
      // Референс: main_core_v2_part19.js:1094-1100 - для 'l' (left):
      //   pivot.x = -1 (левый край детали)
      //   pos.x = k (толщина материала, g:g0.thickness)
      // Референс: main_core_v2_part19.js:1145-1148 - для 'z': { 'pivot': -1, 'pos': 's.z' }
      // Референс: main_core_v2_part19.js:3661 - для 'v' (vertical): f['pos']['y'] = 0x0
      // Реф.: main_core_v2_part — default pivot для деталей
      // Pivot: нижняя левая дальняя точка (x=-1, y=-1, z=-1)
      size: { x: 'g:g0.thickness', y: 's:y', z: 's:z' },
      pos: { x: 0, y: 0, z: 0 }  // ⭐ ИСПРАВЛЕНО: Если pivot в нижней левой дальней точке (x=-1, y=-1, z=-1), то pos = (0, 0, 0)
    } as DetailExpressions
  },
  { 
    id: 'vertical_right', 
    name: 'Вертикальная правая', 
    orientation: 'vertical' as const, 
    position: 'vertical-right',
    expressions: {
      // ⭐ ИСПРАВЛЕНО: Позиция строго по референсу
      // Референс: main_core_v2_part19.js:1110-1117 - для 'r' (right):
      //   pivot.x = 1 (правый край детали)
      //   pos.x = 's:x - ' + k (правый край секции минус толщина)
      //   pos.z = 's.z' (стыкуется с задней стенкой, Z=0)
      // Референс: main_core_v2_part19.js:1145-1148 - для 'z': { 'pivot': -1, 'pos': 's.z' }
      // Pivot в Clodis: { x: 1, y: -1, z: -1 } — правый нижний дальний угол детали
      size: { x: 'g:g0.thickness', y: 's:y', z: 's:z' },
      pos: { x: 's:x - g:g0.thickness', y: 0, z: 's.z' }
    } as DetailExpressions
  },
  { 
    id: 'horizontal_top', 
    name: 'Горизонтальная верхняя', 
    orientation: 'horizontal' as const, 
    position: 'horizontal-top',
    expressions: {
      // ⭐ ИСПРАВЛЕНО: Размер строго по референсу (БЕЗ вычитания толщины!)
      // Референс: main_core_v2_part19.js:418-425 - _build_size():
      //   f['size']['x'] = comp2(g['size']['x'], h)  // ← Прямо s:x, БЕЗ вычитания толщины!
      //   f['size']['z'] = comp2(g['size']['z'], h)  // ← Прямо s:z, БЕЗ изменений!
      // Референс: main_core_v2_part19.js:1093-1148 - для 'common':
      //   'x': 'l' → pos.x = k (g:g0.thickness), pivot.x = -1
      //   'y': 't' → pos.y = 's:y - ' + k, pivot.y = 1
      //   'z': pos.z = 's.z' (Z=0), pivot.z = -1
      // ⚠️ ВАЖНО: Комментарий '(Z=0)' означает что деталь на задней стенке (Z=0 относительно секции), 
      //           но pos.z = 's:z' вычисляется как центр по Z (s:z = parent_size.z = глубина секции)
      //           Для центра по Z: detailGroupPosZ = (-parentSize.z/2 + s:z) / units = (-200/2 + 200)/1000 = 0.1
      size: { x: 's:x', y: 'g:g0.thickness', z: 's:z' },  // ⚠️ ИСПРАВЛЕНО: убрали '- g:g0.thickness * 2' из x
      pos: { x: 'g:g0.thickness', y: 's:y - g:g0.thickness', z: 's:z' }  // ⚠️ ВОЗВРАЩЕНО: pos.z = 's:z' (центр по Z)
    } as DetailExpressions
  },
  { 
    id: 'horizontal_bottom', 
    name: 'Горизонтальная нижняя', 
    orientation: 'horizontal' as const, 
    position: 'horizontal-bottom',
    expressions: {
      // ⭐ ИСПРАВЛЕНО: Позиция строго по референсу
      // Референс: main_core_v2_part19.js:1093-1148 - для 'common':
      //   'x': 'l' → pos.x = k (g:g0.thickness), pivot.x = -1
      //   'y': 'b' → pos.y = k (но для дна обычно 0 или высота цоколя)
      //   'z': pos.z = 's.z' (Z=0), pivot.z = -1
      // ⭐ ИСПРАВЛЕНО: Размер строго по референсу (БЕЗ вычитания толщины!)
      // Референс: main_core_v2_part19.js:418-425 - _build_size():
      //   f['size']['x'] = comp2(g['size']['x'], h)  // ← Прямо s:x, БЕЗ вычитания толщины!
      //   f['size']['z'] = comp2(g['size']['z'], h)  // ← Прямо s:z, БЕЗ изменений!
      // ⚠️ ВАЖНО: Для дна posY обычно 0 (без цоколя) или v:vysota_cokolya (с цоколем)
      size: { x: 's:x', y: 'g:g0.thickness', z: 's:z' },  // ⚠️ ИСПРАВЛЕНО: убрали '- g:g0.thickness * 2' из x
      pos: { x: 'g:g0.thickness', y: 0, z: 's.z' }
    } as DetailExpressions
  },
  { 
    id: 'vertical_middle', 
    name: 'Вертикальная средняя', 
    orientation: 'vertical' as const, 
    position: 'vertical-middle',
    expressions: {
      // ⭐ ИСПРАВЛЕНО: Позиция по центру строго по референсу
      // Референс: main_core_v2_part19.js:1102-1109 - для 'c' (center):
      //   pivot.x = 0 (центр детали)
      //   pos.x = 's:x / 2' (центр секции)
      //   pos.z = 's.z' (стыкуется с задней стенкой, Z=0)
      // Референс: main_core_v2_part19.js:1145-1148 - для 'z': { 'pivot': -1, 'pos': 's.z' }
      // Pivot в Clodis: { x: 0, y: -1, z: -1 } — центр по X, низ, дальний угол
      size: { x: 'g:g0.thickness', y: 's:y', z: 's:z' },
      pos: { x: 's:x / 2', y: 0, z: 's.z' }
    } as DetailExpressions
  },
  { 
    id: 'horizontal_middle', 
    name: 'Горизонтальная средняя', 
    orientation: 'horizontal' as const, 
    position: 'horizontal-middle',
    expressions: {
      // ⭐ ИСПРАВЛЕНО: Позиция строго по референсу
      // Референс: main_core_v2_part19.js:1093-1148 - для 'common':
      //   'x': 'l' → pos.x = k (g:g0.thickness), pivot.x = -1
      //   'y': 'c' → pos.y = 's:y / 2', pivot.y = 0
      //   'z': pos.z = 's.z' (Z=0), pivot.z = -1
      // Размер: ширина минус толщина двух вертикалей
      size: { x: 's:x - g:g0.thickness * 2', y: 'g:g0.thickness', z: 's:z' },
      pos: { x: 'g:g0.thickness', y: 's:y / 2', z: 's.z' }
    } as DetailExpressions
  },
  { 
    id: 'front_middle', 
    name: 'Фронтальная средняя', 
    orientation: 'vertical' as const, 
    position: 'front-middle',
    expressions: {
      // front_middle - передняя стенка по центру (полные размеры, как у других фронтальных)
      // Размеры: полные размеры секции
      size: { x: 's:x', y: 's:y', z: 'g:g0.thickness' },
      // Позиция: точка отсчета (снизу слева по середине толщины) ставится в точку (0, 0, s:z/2)
      // Pivot {-1,-1,0} означает: снизу слева по середине толщины
      pos: { x: 0, y: 0, z: 's:z / 2' }
    } as DetailExpressions
  },
  { 
    id: 'front_front', 
    name: 'Фронтальная передняя', 
    orientation: 'vertical' as const, 
    position: 'front-front',
    expressions: {
      size: { x: 's:x', y: 's:y', z: 'g:g0.thickness' },
      // ⭐ РЕФЕРЕНС: front_front pivot {-1,-1,1} - левый нижний БЛИЖНИЙ угол детали
      // Ближний угол детали (pivot) ставится в передний угол секции (0, 0, s:z)
      pos: { x: 0, y: 0, z: 's:z' }
    } as DetailExpressions
  },
];

const detailMaterials = {
  ldsp16: { name: 'ЛДСП 16 мм', thickness: 0.016, color: 0xd8c7a0 },
  lhdf3: { name: 'ЛХДФ 3 мм', thickness: 0.003, color: 0xe9e9e9 },
} as const;

type DetailSize = { x: number; y: number; z: number };
type DetailTransform = { posX: number; posY: number; posZ: number };
// ⭐ ИСПРАВЛЕНО ПО РЕФЕРЕНСУ: main_core_v2_part13.js:987-1010 - pivot хранится как числа -1, 0, 1
// Старый тип Anchor = 'min' | 'center' | 'max' заменен на ClodisPivot (ClodisPivot) = -1 | 0 | 1
type Anchor = ClodisPivot | 'min' | 'center' | 'max'; // Поддержка обоих форматов для обратной совместимости
const defaultAnchors: { x: ClodisPivot; y: ClodisPivot; z: ClodisPivot } = { x: -1, y: -1, z: -1 };

// Каталог: типы и группы элементов (как в Clodis)

type CatalogType = {
  id: string;
  name: string;
  key?: string; // Ключ типа (например, 'kitchens', 'cabinets') - используется как element_type
};

// Глобальные переменные для типов и групп (как в референсе)
let catalogTypes: CatalogType[] = [];
let catalogGroups: CatalogGroup[] = [];
let catalogTypesHash: { [key: string]: CatalogType } = {};
let catalogGroupsHash: { [key: string]: CatalogGroup } = {};

function loadCatalogTypes(): CatalogType[] {
  const key = 'catalogTypes';
  const json = localStorage.getItem(key);
  if (!json) {
    // ⭐ ИСПРАВЛЕНО: Создаем дефолтный тип "Шкаф2" при первой загрузке
    const defaultTypes: CatalogType[] = [
      {
        id: 'type-1',
        name: 'Шкаф2',
        key: 'шкаф2'
      }
    ];
    saveCatalogTypes(defaultTypes);
    console.log('📋 [loadCatalogTypes] Создан дефолтный тип "Шкаф2"');
    return defaultTypes;
  }
  try {
    const types = JSON.parse(json) as CatalogType[];
    // Если у типа нет key, создаем его из id или name
    types.forEach(type => {
      if (!type.key) {
        // Создаем key из id (убираем префикс 'type-' или 'catalog-') или из name
        type.key = type.id.replace(/^(type-|catalog-)/, '').toLowerCase() || 
                   type.name.toLowerCase().replace(/\s+/g, '_');
      }
    });
    // ⭐ ИСПРАВЛЕНО: Если типа "Шкаф2" нет, добавляем его
    const hasShkaf2 = types.some(t => t.key === 'шкаф2' || t.name === 'Шкаф2');
    if (!hasShkaf2) {
      types.push({
        id: 'type-' + Date.now(),
        name: 'Шкаф2',
        key: 'шкаф2'
      });
      saveCatalogTypes(types);
      console.log('📋 [loadCatalogTypes] Добавлен тип "Шкаф2"');
    }
    return types;
  } catch {
    localStorage.removeItem(key);
    // Создаем дефолтные типы при ошибке парсинга
    const defaultTypes: CatalogType[] = [
      {
        id: 'type-1',
        name: 'Шкаф2',
        key: 'шкаф2'
      }
    ];
    saveCatalogTypes(defaultTypes);
    console.log('📋 [loadCatalogTypes] Ошибка парсинга, создан дефолтный тип "Шкаф2"');
    return defaultTypes;
  }
}

function saveCatalogTypes(list: CatalogType[]) {
  localStorage.setItem('catalogTypes', JSON.stringify(list));
}

// Группы каталога (\"Группы модулей\" как на скрине)
type CatalogGroup = {
  id: string;
  name: string;
  key?: string; // Ключ группы (например, 'bottom_modules', 'top_modules') - используется как cabinet_tag
};

// Категории внутри типа (например, категории для \"Кухни\")
type CatalogCategory = {
  id: string;
  name: string;
  parentId?: string | null;
};

function loadCatalogGroups(): CatalogGroup[] {
  const key = 'catalogGroups';
  const json = localStorage.getItem(key);
  
  if (!json) {
    // Возвращаем пустой массив, не создаем дефолтные группы автоматически
    return [];
  }
  
  try {
    const loaded = JSON.parse(json) as CatalogGroup[];
    // Фильтруем только валидные группы (с правильной структурой и не пустыми именами)
    const validGroups = loaded.filter(g => 
      g && 
      typeof g === 'object' && 
      g.id && 
      g.name && 
      typeof g.name === 'string' && 
      g.name.trim().length > 0
    );
    
    // Если у группы нет key, создаем его из id или name
    validGroups.forEach(group => {
      if (!group.key) {
        // Создаем key из name (приоритет) или из id
        if (group.name) {
          // Создаем key из name: нижний регистр, пробелы -> подчеркивания, удаляем спецсимволы
          // Для числовых имен (например, "13") key будет "13"
          group.key = group.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        }
        // Если key все еще нет, создаем из id
        if (!group.key && group.id) {
          group.key = group.id.replace(/^group-/, '').toLowerCase();
        }
        // Если key все еще нет, используем id как есть
        if (!group.key) {
          group.key = group.id || String(Date.now());
        }
      }
    });
    
    // НЕ сохраняем обратно в localStorage автоматически (чтобы не удалить только что добавленные группы)
    return validGroups;
  } catch {
    // При ошибке парсинга очищаем localStorage и возвращаем пустой массив
    localStorage.removeItem(key);
    return [];
  }
}

function saveCatalogGroups(list: CatalogGroup[]) {
  localStorage.setItem('catalogGroups', JSON.stringify(list));
  // Обновляем глобальные переменные (как в референсе pp.libs.modules_groups)
  catalogGroups = list;
  catalogGroupsHash = {};
  catalogGroups.forEach(group => {
    if (group.key) {
      catalogGroupsHash[group.key] = group;
    }
  });
  // Обновляем в window для использования в других модулях
  (window as any).catalogGroups = catalogGroups;
  (window as any).catalogGroupsHash = catalogGroupsHash;
  console.log('🔄 [saveCatalogGroups] Глобальные переменные обновлены. Групп:', catalogGroups.length);
}

// Инициализация типов и групп каталога (как в референсе)
function initCatalogTypesAndGroups() {
  // Загружаем типы элементов
  catalogTypes = loadCatalogTypes();
  catalogTypesHash = {};
  catalogTypes.forEach(type => {
    if (type.key) {
      catalogTypesHash[type.key] = type;
    }
  });
  console.log('📋 [initCatalogTypesAndGroups] Загружено типов элементов:', catalogTypes.length);
  
  // Загружаем группы модулей
  catalogGroups = loadCatalogGroups();
  catalogGroupsHash = {};
  catalogGroups.forEach(group => {
    if (group.key) {
      catalogGroupsHash[group.key] = group;
    }
  });
  console.log('📋 [initCatalogTypesAndGroups] Загружено групп модулей:', catalogGroups.length);
  
  // Экспортируем в window для использования в других модулях (как в референсе)
  (window as any).catalogTypes = catalogTypes;
  (window as any).catalogGroups = catalogGroups;
  (window as any).catalogTypesHash = catalogTypesHash;
  (window as any).catalogGroupsHash = catalogGroupsHash;
  
  // Запускаем миграцию старых элементов (один раз при инициализации)
  const migrationKey = 'catalog_migration_completed';
  if (!localStorage.getItem(migrationKey)) {
    console.log('🔄 [initCatalogTypesAndGroups] Запускаем миграцию старых элементов...');
    const migratedCount = migrateOldCatalogElements();
    if (migratedCount > 0) {
      localStorage.setItem(migrationKey, 'true');
      console.log('✅ [initCatalogTypesAndGroups] Миграция завершена, помечено как выполненная');
    }
  } else {
    console.log('ℹ️ [initCatalogTypesAndGroups] Миграция уже была выполнена ранее');
  }
}

// Функция миграции: обновляет старые элементы, добавляя им element_type и cabinet_tag
function migrateOldCatalogElements(): number {
  console.log('🔄 [migrateOldCatalogElements] Начинаем миграцию старых элементов...');
  let migratedCount = 0;
  
  // Загружаем все элементы
  const allElements = loadAllCatalogElements();
  const allTypes = loadCatalogTypes();
  const allGroups = loadCatalogGroups();
  
  // Загружаем элементы из старых форматов (catalog_*)
  const catalogKeys = ['catalog_kitchens', 'catalog_cabinets', 'catalog_doors', 'catalog_shelves', 'catalog_drawers', 'catalog_items'];
  const oldFormatElements: any[] = [];
  
  catalogKeys.forEach(catalogKey => {
    const catalogJson = localStorage.getItem(catalogKey);
    if (catalogJson) {
      try {
        const catalogItems: any[] = JSON.parse(catalogJson);
        catalogItems.forEach(item => {
          oldFormatElements.push({
            ...item,
            _sourceKey: catalogKey
          });
        });
      } catch (e) {
        console.warn(`⚠️ [migrateOldCatalogElements] Ошибка парсинга ${catalogKey}:`, e);
      }
    }
  });
  
  // Обновляем элементы без element_type
  allElements.forEach((element, index) => {
    let needsUpdate = false;
    const updatedElement = { ...element };
    
    // Если нет element_type, пытаемся восстановить
    if (!updatedElement.metadata?.element_type) {
      // Ищем в старых форматах
      const oldElement = oldFormatElements.find(old => old.id === element.id || old.name === element.name);
      
      if (oldElement) {
        // Пытаемся извлечь element_type из Clodis JSON
        const clodisJSON = oldElement.clodisJSON || (Array.isArray(oldElement) ? oldElement : [oldElement]);
        if (clodisJSON && clodisJSON.length > 0 && clodisJSON[0]) {
          const firstItem = clodisJSON[0];
          if (firstItem.spec?.element_type) {
            updatedElement.metadata = updatedElement.metadata || {};
            updatedElement.metadata.element_type = firstItem.spec.element_type;
            needsUpdate = true;
            console.log('✅ [migrateOldCatalogElements] Восстановлен element_type из Clodis JSON:', element.name, '->', firstItem.spec.element_type);
          }
        }
        
        // Если не нашли в Clodis JSON, пытаемся из catalogType
        if (!updatedElement.metadata?.element_type && oldElement.catalogType) {
          // Ищем тип по catalogType
          const matchingType = allTypes.find(t => {
            const typeKey = t.key || t.id.replace(/^(type-|catalog-)/, '').toLowerCase() || 
                           t.name.toLowerCase().replace(/\s+/g, '_');
            return typeKey === oldElement.catalogType || t.name.toLowerCase() === oldElement.catalogType.toLowerCase();
          });
          
          if (matchingType) {
            const typeKey = matchingType.key || matchingType.id.replace(/^(type-|catalog-)/, '').toLowerCase() || 
                           matchingType.name.toLowerCase().replace(/\s+/g, '_');
            updatedElement.metadata = updatedElement.metadata || {};
            updatedElement.metadata.element_type = typeKey;
            needsUpdate = true;
            console.log('✅ [migrateOldCatalogElements] Восстановлен element_type из catalogType:', element.name, '->', typeKey);
          }
        }
        
        // Восстанавливаем cabinet_tag из Clodis JSON
        if (clodisJSON && clodisJSON.length > 0 && clodisJSON[0]) {
          const firstItem = clodisJSON[0];
          if (firstItem.spec?.cabinet_tag && !updatedElement.metadata?.cabinet_tag) {
            updatedElement.metadata = updatedElement.metadata || {};
            updatedElement.metadata.cabinet_tag = firstItem.spec.cabinet_tag;
            needsUpdate = true;
            console.log('✅ [migrateOldCatalogElements] Восстановлен cabinet_tag:', element.name, '->', firstItem.spec.cabinet_tag);
          }
        }
      } else {
        // Если элемент не найден в старых форматах, но у него есть groupId, пытаемся использовать его как cabinet_tag
        if (element.groupId && !updatedElement.metadata?.cabinet_tag) {
          updatedElement.metadata = updatedElement.metadata || {};
          updatedElement.metadata.cabinet_tag = element.groupId;
          needsUpdate = true;
          console.log('✅ [migrateOldCatalogElements] Восстановлен cabinet_tag из groupId:', element.name, '->', element.groupId);
        }
      }
    }
    
    // Если элемент обновлен, сохраняем изменения
    if (needsUpdate) {
      allElements[index] = updatedElement;
      migratedCount++;
    }
  });
  
  // Сохраняем обновленные элементы
  if (migratedCount > 0) {
    saveAllCatalogElements(allElements);
    console.log(`✅ [migrateOldCatalogElements] Миграция завершена. Обновлено элементов: ${migratedCount}`);
  } else {
    console.log('ℹ️ [migrateOldCatalogElements] Миграция не требуется. Все элементы актуальны.');
  }
  
  return migratedCount;
}

// Текущая выбранная группа каталога (используется при сохранении элементов)
let currentCatalogGroupId: string | null = null;

// Вспомогательная функция: загрузить все элементы каталога из localStorage
// Синхронизирует данные из разных форматов (elementCatalog и catalog_*)
function loadAllCatalogElements(): CatalogElement[] {
  const key = 'elementCatalog';
  let elements: CatalogElement[] = [];
  
  // Загружаем из основного каталога
  const json = localStorage.getItem(key);
  if (json) {
  try {
      elements = JSON.parse(json) as CatalogElement[];
  } catch {
    console.warn('Ошибка парсинга elementCatalog, очищаем ключ');
    localStorage.removeItem(key);
    }
  }
  
  // ⭐ ВАЖНО: НЕ загружаем из старых форматов (catalog_*) при каждом вызове
  // Это может добавлять удаленные элементы обратно
  // Миграция должна выполняться только один раз при инициализации через migrateOldCatalogElements()
  // Закомментировано, чтобы избежать возврата удаленных элементов
  // Если нужно мигрировать старые данные, используйте migrateOldCatalogElements() один раз при инициализации
  
  return elements;
}

// Конвертация legacy constructor_structure (module/section/wall) в Clodis JSON
function convertConstructorStructureToClodisJSON(
  struct: any,
  size: { width: number; height: number; depth: number }
): ClodisItem[] | null {
  if (!struct || typeof struct !== 'object') return null;

  // Ожидаем корневой module с дочерней section
  const moduleNode = struct;
  const sectionNode = (Array.isArray(moduleNode.children) ? moduleNode.children : []).find(
    (ch: any) => ch && ch.type === 'section'
  );
  if (!sectionNode) {
    console.warn('⚠️ [convertConstructorStructureToClodisJSON] Секция не найдена в constructor_structure');
    return null;
  }

  function convertDetailNode(node: any): ClodisItem {
    const children: ClodisItem[] = Array.isArray(node.children)
      ? node.children
          .filter((ch: any) => ch && typeof ch === 'object')
          .map((ch: any) => convertDetailNode(ch))
      : [];

    const sizeObj = node.size || node.pp_size || null;
    const posObj = node.position || node.pos || null;
    const anchor = node.anchor || node.anchors || null;
    const rot = node.rotation || node.rot || null;

    const item: any = {
      type: node.type || 'wall',
      name: node.name || '',
      id: node.id || '',
      lib: '',
      tags: '',
      interactive: 0,
      size: sizeObj
        ? { x: sizeObj.x, y: sizeObj.y, z: sizeObj.z }
        : { x: 's:x', y: 's:y', z: 's:z' },
      pos: posObj
        ? { x: posObj.x || 0, y: posObj.y || 0, z: posObj.z || 0 }
        : { x: 0, y: 0, z: 0 },
      pivot: anchor
        ? { x: anchor.x ?? -1, y: anchor.y ?? -1, z: anchor.z ?? -1 }
        : { x: -1, y: -1, z: -1 },
      scale: { x: 1, y: 1, z: 1 },
      rot: rot ? { x: rot.x || 0, y: rot.y || 0, z: rot.z || 0 } : { x: 0, y: 0, z: 0 },
      c_rot: { x: 0, y: 0, z: 0 },
      children,
      custom: {},
      condition: null,
      visible: node.hide_when_filled ? 0 : 1,
      helpers_visible: 0,
      active: node.active === false ? 0 : 1,
      variables: { visible: 1, main: {} },
      interaction: { auto_rotation: 1, check_intersection: 0, raycast: 1 },
      resizable: {
        enabled: 0,
        locks: {},
        minmax: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } }
      },
      spec: node.spec || {},
      events: node.events || {
        on_before_params: '',
        on_before_build: '',
        on_after_build: '',
        on_drag_end: ''
      },
      accessories: node.accessories || [],
      comments: node.comments || '',
      section_key: '',
      params_key: ''
    };

    return item;
  }

  // Корневая секция Clodis
  const rootSection: ClodisItem = {
    type: 'section',
    name: sectionNode.name || 'Секция',
    id: sectionNode.id || '',
    lib: '',
    tags: '',
    interactive: 0,
    // Используем числовые размеры секции (мм) из полей width/height/depth, если есть
    size: {
      x: size.width || 600,
      y: size.height || 720,
      z: size.depth || 300
    },
    pos: { x: 0, y: 0, z: 0 },
    pivot: { x: -1, y: -1, z: -1 },
    scale: { x: 1, y: 1, z: 1 },
    rot: { x: 0, y: 0, z: 0 },
    c_rot: { x: 0, y: 0, z: 0 },
    children: Array.isArray(sectionNode.children)
      ? sectionNode.children
          .filter((ch: any) => ch && typeof ch === 'object')
          .map((ch: any) => convertDetailNode(ch))
      : [],
    custom: {},
    condition: null,
    visible: 1,
    helpers_visible: 0,
    active: 1,
    variables: { visible: 1, main: {} },
    interaction: { auto_rotation: 1, check_intersection: 0, raycast: 1 },
    resizable: {
      enabled: 0,
      locks: {},
      minmax: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } }
    },
    spec: {},
    events: { on_before_params: '', on_before_build: '', on_after_build: '', on_drag_end: '' },
    accessories: [],
    comments: '',
    section_key: '',
    params_key: ''
  };

  console.log('✅ [convertConstructorStructureToClodisJSON] Конвертирована секция:', {
    id: rootSection.id,
    name: rootSection.name,
    childrenCount: rootSection.children?.length || 0
  });

  return [rootSection];
}

// Загрузка каталога элементов с сервера и синхронизация с localStorage
async function loadCatalogFromServer(): Promise<void> {
  try {
    console.log('🔄 [loadCatalogFromServer] Попытка загрузки каталога с сервера...');
    
    // Используем AbortController для таймаута запроса
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Таймаут 3 секунды
    
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/items_list/`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Если сервер вернул ошибку, используем данные из localStorage
        // Не логируем - это нормально, если сервер не запущен
        return;
      }
      
      if (!response.ok) {
        console.log('ℹ️ [loadCatalogFromServer] Сервер вернул ошибку:', response.status, '- используем данные из localStorage');
        return;
      }
    
      const data = await response.json();
      if (data.result !== 'success' || !data.items) {
        console.log('ℹ️ [loadCatalogFromServer] Неверный формат ответа сервера - используем данные из localStorage');
        return;
      }
    
    const serverItems = data.items as any[];
    console.log(`📦 [loadCatalogFromServer] Получено ${serverItems.length} элементов с сервера`);
    
    // Преобразуем формат сервера в формат CatalogElement
    const catalogElements: CatalogElement[] = serverItems.map(item => {
      // Определяем базовый размер (мм) из полей элемента или по умолчанию
      let size = {
        width: Number(item.width) || 600,
        height: Number(item.height) || 720,
        depth: Number(item.depth) || 300
      };

      // Извлекаем clodisJSON из data.params или clodisJSON
      let clodisJSON: ClodisItem[] | null = null;
      if (item.data) {
        try {
          const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          const fromRead = readClodisJSON(parsed);
          if (Array.isArray(fromRead) && fromRead.length > 0) {
            clodisJSON = fromRead;
          } else if (parsed.params && Array.isArray(parsed.params)) {
            // Основной путь Clodis: params — это уже массив JSON элементов
            clodisJSON = parsed.params;
          } else if (Array.isArray(parsed)) {
            // На всякий случай: если data само является массивом
            clodisJSON = parsed;
          } else {
            // ⭐ ВАЖНО: В некоторых конфигурациях Clodis data хранит ОДИН объект,
            // внутри которого есть spec/templates/tree, но нет поля params.
            // В этом случае используем объект как единственный элемент массива,
            // чтобы не потерять JSON при загрузке списка элементов.
            clodisJSON = [parsed];
          }
        } catch (e) {
          console.warn('⚠️ [loadCatalogFromServer] Ошибка парсинга data для элемента:', item.id, e);
        }
      } else {
        const fromItem = readClodisJSON(item);
        if (Array.isArray(fromItem) && fromItem.length > 0) {
          clodisJSON = fromItem;
        }
      }

      // Если Clodis JSON всё ещё нет, пробуем сконвертировать legacy constructor_structure
      if (!clodisJSON && item.constructor_structure) {
        try {
          const fromStruct = convertConstructorStructureToClodisJSON(
            item.constructor_structure,
            size
          );
          if (fromStruct && fromStruct.length > 0) {
            clodisJSON = fromStruct;
            console.log('✅ [loadCatalogFromServer] Плановый JSON получен из constructor_structure для элемента:', item.id);
          }
        } catch (e) {
          console.warn('⚠️ [loadCatalogFromServer] Ошибка конвертации constructor_structure для элемента:', item.id, e);
        }
      }

      // Если размер можно уточнить из Clodis JSON — делаем это
      if (clodisJSON && clodisJSON.length > 0) {
        const rootSection = clodisJSON.find(p => p.type === 'section');
        if (rootSection && rootSection.size) {
          const s = rootSection.size;
          size = {
            width: typeof (s as any).x === 'number' ? (s as any).x : size.width,
            height: typeof (s as any).y === 'number' ? (s as any).y : size.height,
            depth: typeof (s as any).z === 'number' ? (s as any).z : size.depth
          };
        }
      }
      
      const catalogElement: CatalogElement = {
        id: String(item.id),
        name: item.name || `Элемент ${item.id}`,
        type: item.element_type || 'section',
        elementType: item.element_type || 'section',
        metadata: {
          name: item.name || `Элемент ${item.id}`,
          type: item.element_type || 'section',
          size: size,
          createdAt: item.created_at || new Date().toISOString(),
          element_type: item.element_type || 'section',
          cabinet_tag: item.cabinet_tag || '',
          catalog_type: item.catalog_type || '',
          category: Array.isArray(item.category) ? item.category : []
        },
        clodisJSON: clodisJSON
      };
      
      return catalogElement;
    });
    
    // Загружаем существующие элементы из localStorage
    const existingElements = loadAllCatalogElements();
    const existingIds = new Set(existingElements.map(el => el.id));
    
    // Объединяем: обновляем существующие и добавляем новые
    // ⭐ ВАЖНО: Не затираем локальный clodisJSON, если сервер его не прислал
    const mergedElements: CatalogElement[] = [...existingElements];
    
    catalogElements.forEach(serverElement => {
      const existingIndex = mergedElements.findIndex(el => el.id === serverElement.id);
      if (existingIndex >= 0) {
        const existing = mergedElements[existingIndex];

        // Если с сервера пришёл пустой или отсутствующий clodisJSON,
        // оставляем локальный (он уже может содержать корректный JSON из конструктора)
        const serverHasJSON =
          Array.isArray(serverElement.clodisJSON) &&
          serverElement.clodisJSON.length > 0;

        const merged: CatalogElement = {
          ...existing,
          ...serverElement,
          clodisJSON: serverHasJSON
            ? serverElement.clodisJSON
            : (existing as any).clodisJSON
        };

        mergedElements[existingIndex] = merged;
      } else {
        // Добавляем новый элемент
        mergedElements.push(serverElement);
      }
    });
    
    // Сохраняем объединенный каталог в localStorage
    const catalogKey = 'elementCatalog';
    localStorage.setItem(catalogKey, JSON.stringify(mergedElements));
    
    console.log(`✅ [loadCatalogFromServer] Каталог синхронизирован: ${mergedElements.length} элементов (${catalogElements.length} с сервера)`);
    
    // Обновляем отображение каталога
    renderCatalog();
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Обрабатываем ошибки подключения тихо (это нормально, если сервер не запущен)
      // Не логируем ошибки - это нормально, если сервер не запущен
      // Приложение работает с данными из localStorage
      // Не пробрасываем ошибку дальше - приложение должно работать без сервера
    }
  } catch (error) {
    // Дополнительная обработка на случай других ошибок
    console.log('ℹ️ [loadCatalogFromServer] Ошибка инициализации загрузки - используем данные из localStorage:', error);
  }
}

// Категории по типу: key = catalogCategories_<typeId>
function loadCatalogCategories(typeId: string): CatalogCategory[] {
  const key = `catalogCategories_${typeId}`;
  const json = localStorage.getItem(key);
  if (!json) return [];
  try {
    return JSON.parse(json) as CatalogCategory[];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function saveCatalogCategories(typeId: string, list: CatalogCategory[]) {
  const key = `catalogCategories_${typeId}`;
  localStorage.setItem(key, JSON.stringify(list));
}

// ⭐ ИСПРАВЛЕНО ПО РЕФЕРЕНСУ: main_core_v2_part13.js:563-583 - функция conv_pivot
// Конвертирует pivot значение (строка или число) в смещение от центра
function convPivot(pivot: Anchor | ClodisPivot, size: number): number {
  let pivotNum: ClodisPivot;
  
  // Конвертируем строку в число (для обратной совместимости)
  if (typeof pivot === 'string') {
    switch (pivot) {
      case 'min':
      case 'left':
      case 'bottom':
      case 'back':
        pivotNum = -1;
        break;
      case 'max':
      case 'right':
      case 'top':
      case 'front':
        pivotNum = 1;
        break;
      case 'center':
        pivotNum = 0;
        break;
      default:
        pivotNum = -1; // По умолчанию
    }
  } else {
    pivotNum = pivot;
  }
  
  // Формула из референса: -pivot * size / 2
  return -pivotNum * size / 2;
}

// Конвертирует pivot число в строку (для обратной совместимости)
function pivotToAnchor(pivot: ClodisPivot | Anchor): Anchor {
  if (typeof pivot === 'number') {
    if (pivot === -1) return 'min';
    if (pivot === 1) return 'max';
    return 'center';
  }
  return pivot;
}

// Конвертирует anchor строку в pivot число
function anchorToPivotNum(anchor: Anchor): ClodisPivot {
  if (typeof anchor === 'number') return anchor;
  if (anchor === 'min') return -1;
  if (anchor === 'max') return 1;
  return 0; // 'center'
}

function anchorToPos(anchor: Anchor, parent: number, size: number): number {
  const pivotNum = anchorToPivotNum(anchor);
  // Используем conv_pivot для вычисления смещения
  const offset = convPivot(pivotNum, size);
  // Позиция = центр родителя + смещение
  return parent / 2 + offset;
}

// Смещение точки отсчёта внутри детали относительно её угла (0,0,0)
// ⭐ ИСПРАВЛЕНО: Использует conv_pivot из референса
function anchorOffset(anchor: Anchor, size: number): number {
  const pivotNum = anchorToPivotNum(anchor);
  // Формула из референса: -pivot * size / 2 дает смещение от центра
  // Для получения смещения от угла (0,0,0): center + offset = size/2 + (-pivot * size / 2)
  const centerOffset = size / 2;
  const pivotOffset = convPivot(pivotNum, size);
  return centerOffset + pivotOffset;
}

// Конвертация anchors в pivot (как в ClodisBuilder) - ОСТАВЛЕНО ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
function anchorToPivot(anchor: Anchor, size: number): number {
  const pivotNum = anchorToPivotNum(anchor);
  return convPivot(pivotNum, size);
}

function setAnchorSelection(axis: 'x' | 'y' | 'z', value: Anchor) {
  const buttons = document.querySelectorAll<HTMLButtonElement>(`.anchor-btn[data-axis="${axis}"]`);
  buttons.forEach(btn => {
    const active = btn.dataset.anchor === value;
    if (active) {
      btn.dataset.selected = '1';
      btn.style.background = '#dceeff';
      btn.style.borderColor = '#8bb6ff';
    } else {
      btn.dataset.selected = '0';
      btn.style.background = '';
      btn.style.borderColor = '';
    }
  });
}

function getAnchorSelection(axis: 'x' | 'y' | 'z'): Anchor {
  const btn = document.querySelector<HTMLButtonElement>(`.anchor-btn[data-axis="${axis}"][data-selected="1"]`);
  return (btn?.dataset.anchor as Anchor) || defaultAnchors[axis];
}

// Открыть модалку выбора типа детали
function openDetailTypeModal(parentNode: SceneNode, defaultName?: string) {
  const backdrop = document.getElementById('detail-type-modal-backdrop');
  if (!backdrop) return;
  
  backdrop.style.display = 'flex';
  
  const nameInput = document.getElementById('detail-inp-name') as HTMLInputElement;
  const grid = document.getElementById('detail-type-grid');
  const confirmBtn = document.getElementById('detail-type-modal-confirm') as HTMLButtonElement;
  const cancelBtn = document.getElementById('detail-type-modal-cancel');
  const closeBtn = document.getElementById('detail-type-modal-close');
  const materialSelect = document.getElementById('detail-material') as HTMLSelectElement;
  
  if (!nameInput || !grid || !confirmBtn || !materialSelect) return;
  
  // Сброс значений
  nameInput.value = defaultName && defaultName.trim().length > 0 ? defaultName : 'Деталь';
  materialSelect.value = 'ldsp16';
  let selectedDetailType: string | null = null;
  const setConfirmState = () => {
    const hasName = nameInput.value.trim().length > 0;
    const enabled = hasName && !!selectedDetailType;
    confirmBtn.disabled = !enabled;
    confirmBtn.style.opacity = enabled ? '1' : '0.5';
    confirmBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  };
  setConfirmState();
  
  // Очистка сетки
  grid.innerHTML = '';
  
  // Группируем типы деталей по категориям
  const categories = {
    vertical: detailTypes.filter(dt => dt.orientation === 'vertical' && !dt.position.startsWith('front')),
    horizontal: detailTypes.filter(dt => dt.orientation === 'horizontal'),
    front: detailTypes.filter(dt => dt.position.startsWith('front') || dt.position === 'back-front')
  };
  
  // Функция для создания превью элемента
  const createPreviewItem = (detailType: typeof detailTypes[0]) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.alignItems = 'center';
    item.style.gap = '8px';
    
    const preview = document.createElement('div');
    preview.className = 'detail-type-preview';
    preview.dataset.detailType = detailType.id;
    preview.title = `${detailType.name}\nОриентация: ${detailType.orientation === 'vertical' ? 'Вертикальная' : 'Горизонтальная'}\nПозиция: ${detailType.position}`;
    
    // Пытаемся загрузить изображение, если нет - используем canvas
    const img = new Image();
    const imagePath = `/images/detail-types/${detailType.id}.png`;
    
    // Устанавливаем обработчики ДО установки src
    img.onload = () => {
      // Изображение успешно загружено - показываем его
      preview.innerHTML = '';
      img.style.display = '';
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.objectFit = 'contain';
      preview.appendChild(img);
      console.debug(`✅ [openDetailTypeModal] Изображение загружено: ${imagePath}`);
    };
    
    img.onerror = () => {
      // Если изображение не найдено, используем canvas
      preview.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      drawDetailPreview(canvas, detailType);
      preview.appendChild(canvas);
      console.debug(`ℹ️ [openDetailTypeModal] Изображение не найдено, используем canvas: ${imagePath}`);
    };
    
    // Устанавливаем src ПОСЛЕ обработчиков
    img.src = imagePath;
    
    preview.onclick = () => {
      // Снимаем выделение с других
      document.querySelectorAll('.detail-type-preview').forEach(p => {
        p.classList.remove('selected');
      });
      // Выделяем текущий
      preview.classList.add('selected');
      selectedDetailType = detailType.id;
      setConfirmState();
    };
    
    // Название типа под превью
    const label = document.createElement('div');
    label.textContent = detailType.name;
    label.style.fontSize = '11px';
    label.style.color = '#666';
    label.style.textAlign = 'center';
    label.style.maxWidth = '110px';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.whiteSpace = 'nowrap';
    
    item.appendChild(preview);
    item.appendChild(label);
    
    return item;
  };
  
  // Создаем группы с заголовками
  if (categories.vertical.length > 0) {
    const verticalSection = document.createElement('div');
    verticalSection.style.gridColumn = '1 / -1';
    verticalSection.style.marginTop = '16px';
    verticalSection.style.marginBottom = '8px';
    
    const verticalTitle = document.createElement('div');
    verticalTitle.textContent = 'Вертикальные детали';
    verticalTitle.style.fontSize = '13px';
    verticalTitle.style.fontWeight = '600';
    verticalTitle.style.color = '#333';
    verticalTitle.style.marginBottom = '12px';
    verticalSection.appendChild(verticalTitle);
    
    const verticalGrid = document.createElement('div');
    verticalGrid.style.display = 'grid';
    verticalGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    verticalGrid.style.gap = '10px';
    categories.vertical.forEach(detailType => {
      verticalGrid.appendChild(createPreviewItem(detailType));
    });
    verticalSection.appendChild(verticalGrid);
    grid.appendChild(verticalSection);
  }
  
  if (categories.horizontal.length > 0) {
    const horizontalSection = document.createElement('div');
    horizontalSection.style.gridColumn = '1 / -1';
    horizontalSection.style.marginTop = '24px';
    horizontalSection.style.marginBottom = '8px';
    
    const horizontalTitle = document.createElement('div');
    horizontalTitle.textContent = 'Горизонтальные детали';
    horizontalTitle.style.fontSize = '13px';
    horizontalTitle.style.fontWeight = '600';
    horizontalTitle.style.color = '#333';
    horizontalTitle.style.marginBottom = '12px';
    horizontalSection.appendChild(horizontalTitle);
    
    const horizontalGrid = document.createElement('div');
    horizontalGrid.style.display = 'grid';
    horizontalGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    horizontalGrid.style.gap = '10px';
    categories.horizontal.forEach(detailType => {
      horizontalGrid.appendChild(createPreviewItem(detailType));
    });
    horizontalSection.appendChild(horizontalGrid);
    grid.appendChild(horizontalSection);
  }
  
  if (categories.front.length > 0) {
    const frontSection = document.createElement('div');
    frontSection.style.gridColumn = '1 / -1';
    frontSection.style.marginTop = '24px';
    frontSection.style.marginBottom = '8px';
    
    const frontTitle = document.createElement('div');
    frontTitle.textContent = 'Фронтальные и задние детали';
    frontTitle.style.fontSize = '13px';
    frontTitle.style.fontWeight = '600';
    frontTitle.style.color = '#333';
    frontTitle.style.marginBottom = '12px';
    frontSection.appendChild(frontTitle);
    
    const frontGrid = document.createElement('div');
    frontGrid.style.display = 'grid';
    frontGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    frontGrid.style.gap = '10px';
    categories.front.forEach(detailType => {
      frontGrid.appendChild(createPreviewItem(detailType));
    });
    frontSection.appendChild(frontGrid);
    grid.appendChild(frontSection);
  }
  
  const handleClose = () => {
    backdrop.style.display = 'none';
    selectedDetailType = null;
    setConfirmState();
    // Снимаем выделение с превью
    document.querySelectorAll('.detail-type-preview').forEach(p => {
      p.classList.remove('selected');
    });
  };
  
  const handleConfirm = () => {
    if (!selectedDetailType) {
      alert('Выберите тип детали');
      return;
    }
    
    const name = nameInput.value.trim() || 'Деталь';
    const detailType = detailTypes.find(dt => dt.id === selectedDetailType);
    const materialId = (materialSelect.value as keyof typeof detailMaterials) || 'ldsp16';
    const material = detailMaterials[materialId];
    
    if (!detailType) return;
    
    console.log('🔷 [openDetailTypeModal] Создание детали через createDetailClodis:', { 
      name, 
      detailTypeId: detailType.id, 
      detailType: detailType,
      parent: parentNode.name,
      expressions: detailType.expressions
    });
    
    // ⭐ ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ createDetailClodis() вместо старой createDetail()
    const detailNode = createDetailClodis(parentNode, selectedDetailType, name, { materialId });
    
    if (detailNode) {
      console.log('✅ [openDetailTypeModal] Деталь создана через createDetailClodis:', detailNode.name);
    } else {
      console.error('❌ [openDetailTypeModal] Не удалось создать деталь');
      alert('Ошибка: не удалось создать деталь. Проверьте консоль браузера (F12).');
    }
    
    handleClose();
  };
  
  if (closeBtn) closeBtn.onclick = handleClose;
  if (cancelBtn) cancelBtn.onclick = handleClose;
  confirmBtn.onclick = handleConfirm;
  nameInput.oninput = () => setConfirmState();
  
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      handleClose();
    }
  };
  
  // Фокус на поле названия
  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 100);
}

// Глобальный хелпер для вкладки "Конструктор" в модалке каталога:
// открывает модалку выбора типа детали для текущего выбранного узла сцены.
// Используется из HTML (constructor.html), чтобы не дублировать логику
// создания превью и построения детали.
(window as any).openDetailModalForCurrentSection = (defaultName?: string) => {
  // Если секция не выбрана, используем корневую секцию по умолчанию
  let targetSection: SceneNode | null = currentSelectedNode;
  
  if (!targetSection) {
    // Ищем корневую секцию (parent === null, type === 'section')
    targetSection = sceneNodes.find(n => n.type === 'section' && n.parent === null) || null;
    
    if (!targetSection) {
      alert('Сначала создайте корневую секцию');
      return;
    }
  }
  
  // Убеждаемся, что выбранная нода - это секция
  if (targetSection.type !== 'section') {
    // Если выбрана не секция, используем её родителя (секцию)
    targetSection = targetSection.parent || null;
    
    if (!targetSection || targetSection.type !== 'section') {
      // Если родителя нет или это не секция, ищем корневую секцию
      targetSection = sceneNodes.find(n => n.type === 'section' && n.parent === null) || null;
      
      if (!targetSection) {
        alert('Секция не найдена. Убедитесь, что секция создана во вкладке "Основные".');
        return;
      }
    }
  }
  
  openDetailTypeModal(targetSection, defaultName);
};

// Глобальная функция для маленькой модалки: создаёт деталь сразу,
// без открытия второй модалки. Использует ту же логику, что и
// Глобальные переменные для буфера обмена
let clipboardNode: SceneNode | null = null;
let clipboardIsCut: boolean = false;

// Функции для работы с элементами дерева из HTML
(window as any).copyTreeElement = (elementId: string) => {
  const node = sceneNodes.find(n => n.id === elementId);
  if (!node) {
    console.error('Элемент не найден:', elementId);
    return;
  }
  clipboardNode = node;
  clipboardIsCut = false;
  console.log('✅ Элемент скопирован:', node.name);
};

(window as any).cutTreeElement = (elementId: string) => {
  const node = sceneNodes.find(n => n.id === elementId);
  if (!node) {
    console.error('Элемент не найден:', elementId);
    return;
  }
  clipboardNode = node;
  clipboardIsCut = true;
  console.log('✅ Элемент вырезан:', node.name);
};

(window as any).pasteTreeElement = (parentElementId: string) => {
  if (!clipboardNode) {
    console.warn('Буфер обмена пуст');
    return;
  }
  
  // Находим родительский узел
  let parentNode: SceneNode | null = null;
  if (parentElementId) {
    parentNode = sceneNodes.find(n => n.id === parentElementId) || null;
  }
  
  if (!parentNode) {
    // Если родитель не указан, используем корневую секцию
    parentNode = sceneNodes.find(n => n.type === 'section' && n.parent === null) || null;
    if (!parentNode) {
      alert('Родительская секция не найдена');
      return;
    }
  }
  
  // Клонируем узел
  const clonedNode = cloneNode(clipboardNode, parentNode);
  
  // Если это была операция вырезания, удаляем оригинал
  if (clipboardIsCut) {
    // Удаляем из родителя
    if (clipboardNode.parent) {
      const parentChildren = clipboardNode.parent.children;
      const childIndex = parentChildren.findIndex(child => child.id === clipboardNode!.id);
      if (childIndex >= 0) {
        parentChildren.splice(childIndex, 1);
      }
      clipboardNode.parent.group.remove(clipboardNode.group);
    } else {
      scene.remove(clipboardNode.group);
    }
    
    // Удаляем из sceneNodes
    const idx = sceneNodes.findIndex(n => n.id === clipboardNode!.id);
    if (idx >= 0) {
      sceneNodes.splice(idx, 1);
    }
    
    clipboardNode = null;
    clipboardIsCut = false;
  }
  
  // Обновляем дерево полностью
  renderHierarchy();
  
  console.log('✅ Элемент вставлен:', clonedNode.name);
};

(window as any).cloneTreeElement = (elementId: string) => {
  const node = sceneNodes.find(n => n.id === elementId);
  if (!node) {
    console.error('Элемент не найден:', elementId);
    return;
  }
  
  const parentNode = node.parent || sceneNodes.find(n => n.type === 'section' && n.parent === null);
  if (!parentNode) {
    alert('Родительская секция не найдена');
    return;
  }
  
  const clonedNode = cloneNode(node, parentNode);
  
  // Обновляем дерево полностью
  renderHierarchy();
  
  console.log('✅ Элемент клонирован:', clonedNode.name);
};

(window as any).deleteTreeElement = (elementId: string) => {
  console.log('🗑️ deleteTreeElement вызвана с elementId:', elementId);
  console.log('  Тип elementId:', typeof elementId);
  
  // Синхронизируем window.sceneNodes перед поиском (на случай если он устарел)
  (window as any).sceneNodes = sceneNodes;
  
  console.log('  Доступные sceneNodes:', sceneNodes.map(n => ({ id: n.id, name: n.name, type: n.type })));
  
  // Нормализуем ID (убираем пробелы, приводим к строке)
  const normalizedId = String(elementId).trim();
  
  // Сначала ищем точное совпадение
  let node = sceneNodes.find(n => {
    const nodeId = String(n.id).trim();
    return nodeId === normalizedId;
  });
  
  if (!node) {
    console.error('❌ Элемент не найден в sceneNodes по ID:', normalizedId);
    console.error('  Попытка найти по частичному совпадению ID...');
    
    // Попытка найти по частичному совпадению ID
    const partialMatch = sceneNodes.find(n => {
      const nodeId = String(n.id).trim();
      return nodeId.includes(normalizedId) || normalizedId.includes(nodeId);
    });
    
    if (partialMatch) {
      console.warn('  ⚠️ Найден частично совпадающий элемент по ID:', partialMatch.id, 'используем его');
      node = partialMatch;
    } else {
      // Последняя попытка: ищем по имени из HTML (если передано)
      console.error('  Попытка найти элемент другим способом...');
      // Если это не помогло, элемент действительно не существует
      console.error('  ❌ Элемент не может быть удален: не найден в sceneNodes');
      console.error('  Возможные причины:');
      console.error('    1. Элемент был удален ранее');
      console.error('    2. ID в HTML не совпадает с ID в sceneNodes');
      console.error('    3. window.sceneNodes не синхронизирован');
      return;
    }
  }
  
  console.log('✅ Элемент найден для удаления:', node.name, node.id);
  
  // Рекурсивная функция для очистки геометрии и материалов
  function disposeNode(node: SceneNode) {
    // Сначала обрабатываем дочерние элементы
    node.children.forEach(child => disposeNode(child));
    
    // Очищаем геометрию и материалы
    if (node.group) {
      node.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (mesh.material.map) mesh.material.map.dispose();
              mesh.material.dispose();
            }
          }
        }
      });
    }
  }
  
  // ⭐ РЕФЕРЕНС: Если это деталь, удаляем из metadata.childrenData и userData.params.children родителя
  if (node.type === 'detail' && node.parent && node.parent.metadata) {
    // ⭐ ЭТАП 2: Удаляем из обоих форматов
    // 1. Старый формат: metadata.childrenData
    if (!node.parent.metadata.childrenData) {
      node.parent.metadata.childrenData = [];
    }
    const index = node.parent.metadata.childrenData.findIndex((cd: any) => cd.id === node.id);
    if (index !== -1) {
      node.parent.metadata.childrenData.splice(index, 1);
      console.log('  ✅ Удален из metadata.childrenData родителя:', node.parent.name);
      
      // 2. Новый формат: синхронизируем userData.params.children
      syncChildrenDataToParams(node.parent.group, node.parent.metadata.childrenData);
      console.log('  ✅ Синхронизирован userData.params.children после удаления');
    }
    
    // ⭐ ВАЖНО: Удаляем деталь из own_object родителя ПЕРЕД вызовом _build_children
    const parentOwnObject = node.parent.metadata?.own_object as THREE.Group | undefined;
    if (parentOwnObject && node.group) {
      if (parentOwnObject.children.includes(node.group)) {
        parentOwnObject.remove(node.group);
        console.log('  ✅ Удален из parentOwnObject родителя');
      }
    }
    
    // ⭐ ВАЖНО: Удаляем из children родителя ПЕРЕД вызовом _build_children
    const parentChildren = node.parent.children;
    const childIndex = parentChildren.findIndex(child => child.id === node.id);
    if (childIndex >= 0) {
      parentChildren.splice(childIndex, 1);
      console.log('  ✅ Удален из children родителя');
    }
    
    // ⭐ ВАЖНО: Удаляем из sceneNodes ПЕРЕД вызовом _build_children
    const sceneNodeIndex = sceneNodes.findIndex(n => n.id === node.id);
    if (sceneNodeIndex >= 0) {
      sceneNodes.splice(sceneNodeIndex, 1);
      console.log('  ✅ Удален из sceneNodes');
    }
    
    // ⭐ ВАЖНО: Очищаем геометрию ПЕРЕД вызовом _build_children
    if (node.group) {
      node.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (mesh.material.map) mesh.material.map.dispose();
              mesh.material.dispose();
            }
          }
        }
      });
      console.log('  ✅ Геометрия детали очищена');
    }
    
    // ⭐ РЕФЕРЕНС: Пересобираем секцию через единый цикл rebuildSection
    rebuildSection(node.parent);
    
    // Синхронизируем window.sceneNodes после удаления
    (window as any).sceneNodes = sceneNodes;
    
    // Если это был выбранный элемент, сбрасываем выделение
    if (currentSelectedNode?.id === node.id) {
      currentSelectedNode = null;
      if (selectionHelper) {
        scene.remove(selectionHelper);
        selectionHelper.dispose();
        selectionHelper = null;
      }
      clearDetailInfo();
      updateConstructorPropertiesPanel(null);
      console.log('  ✅ Сброшено выделение');
    }
    
    // Обновляем дерево
    renderHierarchy();
    
    // ⭐ ВАЖНО: Обновляем Clodis JSON в currentEditingCatalogElement
    updateClodisJSONFromScene();
    
    // ⭐ ВАЖНО: Обновляем дерево конструктора (constructor-root-module-children)
    const rootModuleChildren = document.getElementById('constructor-root-module-children');
    if (rootModuleChildren) {
      // Очищаем контейнер
      rootModuleChildren.innerHTML = '';
      
      // ⭐ ВАЖНО: Если есть Clodis JSON, перестраиваем дерево из него
      if (currentEditingCatalogElement?.clodisJSON && Array.isArray(currentEditingCatalogElement.clodisJSON) && currentEditingCatalogElement.clodisJSON.length > 0) {
        console.log('  🔄 Перестраиваем дерево конструктора из Clodis JSON');
        if (typeof (window as any).renderConstructorTreeFromClodisJSON === 'function') {
          (window as any).renderConstructorTreeFromClodisJSON(currentEditingCatalogElement.clodisJSON);
        }
      } else {
        // Fallback: перестраиваем дерево из sceneNodes
        const rootSection = sceneNodes.find(n => n.type === 'section' && !n.parent);
        if (rootSection) {
          // Рекурсивно добавляем все дочерние элементы в правильном порядке
          function addChildrenToTree(parentNode: SceneNode) {
            parentNode.children.forEach(child => {
              // Пропускаем элементы типа 'frame' - они не должны отображаться в дереве
              if (child.type === 'frame') {
                // Рекурсивно обрабатываем дочерние элементы frame (на случай вложенности)
                addChildrenToTree(child);
                return;
              }
              
              // Добавляем элемент в дерево через addElementToTreeFrom3D
              if (typeof (window as any).addElementToTreeFrom3D === 'function') {
                const depth = getNodeDepth(child);
                (window as any).addElementToTreeFrom3D(
                  child.type,
                  child.name,
                  parentNode.id,
                  depth,
                  child.id
                );
              }
              
              // Рекурсивно обрабатываем дочерние элементы
              if (child.children.length > 0) {
                addChildrenToTree(child);
              }
            });
          }
          
          // Добавляем корневую секцию
          if (typeof (window as any).addElementToTreeFrom3D === 'function') {
            (window as any).addElementToTreeFrom3D(
              'section',
              rootSection.name,
              null,
              0,
              rootSection.id
            );
          }
          
          // Добавляем дочерние элементы
          addChildrenToTree(rootSection);
        }
      }
    }
    
    return;
  }
  
  // Очищаем ресурсы
  disposeNode(node);
  
  // Удаляем из 3D сцены
  if (node.parent) {
    // Удаляем из группы родителя
    if (node.group && node.parent.group) {
      node.parent.group.remove(node.group);
    }
    // Удаляем из массива children родителя
    const parentChildren = node.parent.children;
    const childIndex = parentChildren.findIndex(child => child.id === node.id);
    if (childIndex >= 0) {
      parentChildren.splice(childIndex, 1);
      console.log('  ✅ Удален из children родителя:', node.parent.name);
    }
  } else {
    // Удаляем из корневой сцены
    if (node.group) {
      scene.remove(node.group);
      console.log('  ✅ Удален из корневой сцены');
    }
  }
  
  // Удаляем из sceneNodes (рекурсивно для дочерних элементов)
  function removeNodeFromSceneNodes(nodeToRemove: SceneNode) {
    // Сначала удаляем дочерние элементы
    nodeToRemove.children.forEach(child => removeNodeFromSceneNodes(child));
    // Затем удаляем сам элемент
    const idx = sceneNodes.findIndex(n => n.id === nodeToRemove.id);
    if (idx >= 0) {
      sceneNodes.splice(idx, 1);
      console.log('  ✅ Удален из sceneNodes:', nodeToRemove.name);
    }
  }
  removeNodeFromSceneNodes(node);
  
  // Синхронизируем window.sceneNodes после удаления
  (window as any).sceneNodes = sceneNodes;
  
  // Если это был выбранный элемент, сбрасываем выделение
  if (currentSelectedNode?.id === node.id) {
    currentSelectedNode = null;
    if (selectionHelper) {
      scene.remove(selectionHelper);
      selectionHelper.dispose();
      selectionHelper = null;
    }
    clearDetailInfo();
    updateConstructorPropertiesPanel(null);
    console.log('  ✅ Сброшено выделение');
  }
  
  // ⭐ ВАЖНО: Обновляем Clodis JSON в currentEditingCatalogElement
  updateClodisJSONFromScene();
  
  // Обновляем дерево конструктора (перестраивает всё дерево из sceneNodes)
  // В конструкторе используется constructor-root-module-children, а не hierarchy-list
  const rootModuleChildren = document.getElementById('constructor-root-module-children');
  if (rootModuleChildren) {
    // Очищаем контейнер
    rootModuleChildren.innerHTML = '';
    
    // ⭐ ВАЖНО: Если есть Clodis JSON, перестраиваем дерево из него
    if (currentEditingCatalogElement?.clodisJSON && Array.isArray(currentEditingCatalogElement.clodisJSON) && currentEditingCatalogElement.clodisJSON.length > 0) {
      console.log('  🔄 Перестраиваем дерево из Clodis JSON');
      if (typeof (window as any).renderConstructorTreeFromClodisJSON === 'function') {
        (window as any).renderConstructorTreeFromClodisJSON(currentEditingCatalogElement.clodisJSON);
      }
    } else {
      // Fallback: перестраиваем дерево из sceneNodes
    const rootSection = sceneNodes.find(n => n.type === 'section' && !n.parent);
    if (rootSection) {
      // Рекурсивно добавляем все дочерние элементы в правильном порядке
      function addChildrenToTree(parentNode: SceneNode) {
        parentNode.children.forEach(child => {
          // Пропускаем элементы типа 'frame' - они не должны отображаться в дереве
          if (child.type === 'frame') {
            // Рекурсивно обрабатываем дочерние элементы frame (на случай вложенности)
            if (child.children.length > 0) {
              addChildrenToTree(child);
            }
            return;
          }
          
          const childDepth = getNodeDepth(child);
          if ((window as any).addElementToTreeFrom3D) {
            (window as any).addElementToTreeFrom3D(
              child.type === 'section' ? 'section' : 'detail',
              child.name,
              parentNode.id,
              childDepth,
              child.id // Передаем правильный ID узла
            );
          }
          // Рекурсивно обрабатываем дочерние элементы
          if (child.children.length > 0) {
            addChildrenToTree(child);
          }
        });
      }
      addChildrenToTree(rootSection);
      }
    }
  } else {
    // Если контейнер не найден, используем старую функцию renderHierarchy
    renderHierarchy();
  }
  
  // Перерисовываем сцену
  render();
  
  console.log('✅ Элемент полностью удален:', node.name);
};

// Функция переименования элемента дерева
(window as any).renameTreeElement = (elementId: string) => {
  const node = sceneNodes.find(n => n.id === elementId);
  if (!node) {
    console.error('Элемент не найден:', elementId);
    return;
  }
  
  const newName = prompt('Введите новое название:', node.name);
  if (newName === null || newName.trim() === '') {
    return; // Пользователь отменил или ввел пустое имя
  }
  
  node.name = newName.trim();
  
  // Если это корневая секция, обновляем название в HTML
  if (node.type === 'section' && node.parent === null) {
    const rootModuleText = document.getElementById('constructor-root-module-name');
    if (rootModuleText) {
      rootModuleText.textContent = node.name;
    }
  }
  
  // Обновляем дерево
  renderHierarchy();
  
  // Обновляем правую панель свойств, если элемент выбран
  if (currentSelectedNode?.id === node.id) {
    updateConstructorPropertiesPanel(node);
  }
  
  console.log('✅ Элемент переименован:', node.name);
};

// Вспомогательная функция для клонирования узла
function cloneNode(node: SceneNode, newParent: SceneNode): SceneNode {
  // Клонируем группу
  const clonedGroup = new THREE.Group();
  clonedGroup.position.copy(node.group.position);
  clonedGroup.rotation.copy(node.group.rotation);
  clonedGroup.scale.copy(node.group.scale);
  
  // Клонируем все дочерние объекты
  node.group.children.forEach(child => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const clonedGeometry = mesh.geometry.clone();
      const clonedMaterial = Array.isArray(mesh.material)
        ? mesh.material.map(m => m.clone())
        : (mesh.material as THREE.Material).clone();
      const clonedMesh = new THREE.Mesh(clonedGeometry, clonedMaterial);
      clonedMesh.position.copy(mesh.position);
      clonedMesh.rotation.copy(mesh.rotation);
      clonedMesh.scale.copy(mesh.scale);
      clonedGroup.add(clonedMesh);
    } else if (child instanceof THREE.Group) {
      const clonedChild = child.clone();
      clonedGroup.add(clonedChild);
    }
  });
  
  const clonedNode: SceneNode = {
    id: generateId(),
    name: node.name + ' (копия)',
    type: node.type,
    group: clonedGroup,
    children: [],
    parent: newParent,
    expanded: false,
    metadata: node.metadata ? JSON.parse(JSON.stringify(node.metadata)) : undefined,
  };
  
  newParent.group.add(clonedGroup);
  addChildNode(newParent, clonedNode);
  // ⭐ ЭТАП 4: Синхронизируем SceneNode в userData
  syncSceneNodeToUserData(clonedNode);
  
  // Рекурсивно клонируем дочерние узлы
  node.children.forEach(child => {
    cloneNode(child, clonedNode);
  });
  
  return clonedNode;
}

// Функция для создания секции из HTML модалки
// ⭐ СОЗДАНИЕ ДОЧЕРНЕЙ СЕКЦИИ ПО РЕФЕРЕНСУ Clodis
// Референс: EmbeddedClodisBuilder.buildSection() и ClodisBuilder.buildSection()
// Структура секции по референсу:
// - sectionGroup (THREE.Group) - основная группа секции
// - own_object (THREE.Group) - группа для детей секции
// - helpers (THREE.Group) - группа для визуальных помощников (опционально для дочерних)
// - Размеры: по умолчанию размеры родителя (можно использовать выражения "s:x", "s:y", "s:z")
// - Позиция: по умолчанию (0,0,0) в own_object родителя
// - Pivot: по умолчанию (-1,-1,-1) = back-left-bottom
// ⭐ ЭТАП 1: Функции инициализации userData (как в референсе Clodis)
// Референс: main_core_v2_part18.js:2576-2582

/**
 * Инициализирует userData.struct для секции/детали
 * Референс: this['userData']['struct'] = {}, this['userData']['struct'][name] = object
 */
function initUserDataStruct(group: THREE.Group, ownObject: THREE.Group): void {
  if (!group.userData.struct) {
    group.userData.struct = {};
  }
  group.userData.struct['__own_object'] = ownObject;
  // Сохраняем ссылку на children (как в референсе)
  group.userData.children = ownObject.children;
}

/**
 * ⭐ БЕЗОПАСНЫЙ ДОСТУП К ДАННЫМ: Сначала userData, потом metadata (fallback)
 * Это обеспечивает совместимость - старый код работает через metadata, новый через userData
 */

/**
 * ⭐ 1 В 1 С РЕФЕРЕНСОМ: Получить own_object из userData (как в референсе)
 * Референс использует только userData, НЕ metadata
 */
function getOwnObject(node: SceneNode): THREE.Group | undefined {
  // Референс: this['userData']['struct']['__own_object']
  if (node.group.userData?.struct?.['__own_object']) {
    return node.group.userData.struct['__own_object'] as THREE.Group;
  }
  // ⚠️ Fallback на metadata только для старых элементов (временная совместимость)
  return node.metadata?.own_object as THREE.Group | undefined;
}

/**
 * ⭐ 1 В 1 С РЕФЕРЕНСОМ: Получить размеры из userData.computed (как в референсе)
 * Референс: this['userData']['computed']['size']
 * Возвращает размеры в миллиметрах
 */
function getNodeSizeFromData(node: SceneNode): { x: number; y: number; z: number } | null {
  // Референс: f['size'] = computed.size (в мм)
  if (node.group.userData?.computed?.size) {
    const size = node.group.userData.computed.size as THREE.Vector3;
    return { x: size.x, y: size.y, z: size.z };
  }
  // ⚠️ Fallback на metadata только для старых элементов (временная совместимость)
  if (node.metadata?.size) {
    return node.metadata.size as { x: number; y: number; z: number };
  }
  return null;
}

/**
 * ⭐ 1 В 1 С РЕФЕРЕНСОМ: Получить helpers из userData (как в референсе)
 * Референс: this['userData']['helpers']
 */
function getHelpers(node: SceneNode): THREE.Group | undefined {
  // Референс: this['userData']['helpers']
  if (node.group.userData?.helpers) {
    return node.group.userData.helpers as THREE.Group;
  }
  // ⚠️ Fallback на metadata только для старых элементов (временная совместимость)
  return node.metadata?.helpers as THREE.Group | undefined;
}

/**
 * Синхронизировать userData с metadata (для обратной совместимости)
 * Вызывается после обновления userData, чтобы старый код продолжал работать
 */
function syncUserDataToMetadata(node: SceneNode): void {
  if (!node.metadata) {
    node.metadata = {};
  }
  
  // Синхронизируем own_object
  const ownObject = getOwnObject(node);
  if (ownObject) {
    node.metadata.own_object = ownObject;
  }
  
  // Синхронизируем размеры
  const size = getNodeSizeFromData(node);
  if (size) {
    node.metadata.size = size;
  }
  
  // Синхронизируем helpers
  const helpers = getHelpers(node);
  if (helpers) {
    node.metadata.helpers = helpers;
  }
}

/**
 * ⭐ ЭТАП 2: Создает c_object для выражений (1 В 1 С РЕФЕРЕНСОМ)
 * Референс: main_core_v2_part18.js:2556-2564
 * 
 * @param currentGroup - Текущая группа (секция/деталь), для которой создается c_object
 * @param parentNode - Родительская секция (может быть null для root)
 * @param rootNode - Корневая секция (может быть null, тогда используется parentNode)
 * @param localParent - Локальный родитель (опционально)
 * @returns c_object для использования в comp2()
 */
function createCObject(
  currentGroup: THREE.Group,
  parentNode: SceneNode | null,
  rootNode: SceneNode | null,
  localParent?: SceneNode | null
): any {
  const computed = currentGroup.userData.computed || {};
  
  // ⭐ РЕФЕРЕНС строка 2557: parent_size из parent.userData.computed.size
  // Референс: 'parent_size': null != f ? f['userData']['computed']['size'] : new THREE['Vector3']()
  let parentSize: THREE.Vector3;
  if (parentNode && parentNode.group.userData?.computed?.size) {
    parentSize = parentNode.group.userData.computed.size as THREE.Vector3;
  } else {
    parentSize = new THREE.Vector3(0, 0, 0);
  }
  
  // ⭐ РЕФЕРЕНС строка 2558: root_size из root.userData.computed.size
  // Референс: 'root_size': g ? g['userData']['computed']['size'] : new THREE['Vector3']()
  let rootSize: THREE.Vector3;
  if (rootNode && rootNode.group.userData?.computed?.size) {
    rootSize = rootNode.group.userData.computed.size as THREE.Vector3;
  } else if (parentNode && parentNode.group.userData?.computed?.size) {
    // Если rootNode не указан, используем parentNode как root (для root секции)
    rootSize = parentNode.group.userData.computed.size as THREE.Vector3;
  } else {
    rootSize = new THREE.Vector3(0, 0, 0);
  }
  
  // ⭐ РЕФЕРЕНС строка 2559: variables из текущего элемента
  // Референс: 'variables': this['userData']['computed']['variables']
  const variables = computed.variables || {};
  
  // ⭐ РЕФЕРЕНС строка 2560: computed из local_parent или root
  // Референс: 'computed': (h || g)?.['userData']['computed']['computed'] || {}
  const computedData = (localParent?.group.userData?.computed?.computed || 
                       rootNode?.group.userData?.computed?.computed || 
                       parentNode?.group.userData?.computed?.computed || {});
  
  // ⭐ РЕФЕРЕНС строка 2561: props из local_parent или root
  // Референс: 'props': (h || g)?.['userData']['computed']['props'] || {}
  const props = (localParent?.group.userData?.computed?.props || 
                rootNode?.group.userData?.computed?.props || 
                parentNode?.group.userData?.computed?.props || {});
  
  // ⭐ РЕФЕРЕНС строка 2562: materials из local_parent или root
  // Референс: 'materials': (h || g)?.['userData']['computed']['materials'] || {}
  const materials = (localParent?.group.userData?.computed?.materials || 
                    rootNode?.group.userData?.computed?.materials || 
                    parentNode?.group.userData?.computed?.materials || {});
  
  // ⭐ РЕФЕРЕНС строка 2563: local_parent
  // Референс: 'local_parent': null != h ? h : {}
  const localParentData = localParent ? localParent.group : {};
  
  // Создаем c_object (как в референсе)
  const c_object = {
    parent_size: parentSize,
    root_size: rootSize,
    variables: variables,
    computed: computedData,
    props: props,
    materials: materials,
    local_parent: localParentData
  };
  
  // ⭐ РЕФЕРЕНС: Сохраняем c_object в userData.computed.c_object
  // Референс: this['userData']['computed']['c_object'] = {...}
  computed.c_object = c_object;
  
  return c_object;
}

/**
 * Инициализирует userData.computed для секции/детали
 * Референс: this['userData']['computed'] = { size, u_size, pos, rot, scale, c_object }
 */
function initUserDataComputed(group: THREE.Group): {
  size: THREE.Vector3;
  u_size: THREE.Vector3;
  pos: THREE.Vector3;
  rot: THREE.Vector3;
  scale: THREE.Vector3;
  c_object?: any;
} {
  if (!group.userData.computed) {
    group.userData.computed = {
      size: new THREE.Vector3(0, 0, 0),
      u_size: new THREE.Vector3(0, 0, 0),
      pos: new THREE.Vector3(0, 0, 0),
      rot: new THREE.Vector3(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
    };
  }
  return group.userData.computed;
}

/**
 * Инициализирует userData.params для секции/детали
 * Референс: this['userData']['params'] = { size, pos, pivot, rot, scale, helpers_visible }
 */
function initUserDataParams(group: THREE.Group, defaults?: {
  size?: { x: number | string; y: number | string; z: number | string };
  pos?: { x: number | string; y: number | string; z: number | string };
  pivot?: { x: number; y: number; z: number };
  rot?: { x: number | string; y: number | string; z: number | string };
  scale?: { x: number | string; y: number | string; z: number | string };
  helpers_visible?: number;
}): any {
  if (!group.userData.params) {
    group.userData.params = {
      size: defaults?.size || { x: 0, y: 0, z: 0 },
      pos: defaults?.pos || { x: 0, y: 0, z: 0 },
      pivot: defaults?.pivot || { x: -1, y: -1, z: -1 },
      rot: defaults?.rot || { x: 0, y: 0, z: 0 },
      scale: defaults?.scale || { x: 1, y: 1, z: 1 },
      helpers_visible: defaults?.helpers_visible !== undefined ? defaults.helpers_visible : 1,
    };
  }
  return group.userData.params;
}

// ⭐ СОЗДАНИЕ ДОЧЕРНЕЙ СЕКЦИИ ПО РЕФЕРЕНСУ Clodis
// Референс: main_core_v2_part18.js
// - _build_struct() (строка 2576-2582): создание own_object
// - _build_pos() (строка 2648-2656): позиционирование (для дочерней: position секции, НЕ own_object)
// - _build_children() (строка 2744): добавление детей в own_object родителя
function createSectionFromInlineModal(name?: string) {
  console.log('🔷 [createSectionFromInlineModal] Создание дочерней секции');
  
  // Находим корневую секцию (parent === null, type === 'section')
  const rootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null);
  if (!rootSection) {
    alert('Корневая секция не найдена. Создайте корневую секцию сначала.');
      return;
  }
  
  // Получаем own_object корневой секции
  const rootOwnObject = rootSection.metadata?.own_object as THREE.Group | undefined;
  if (!rootOwnObject) {
    console.error('❌ [createSectionFromInlineModal] own_object корневой секции не найден!');
    alert('Ошибка: own_object корневой секции не найден.');
      return;
  }
  
  console.log('✅ [createSectionFromInlineModal] Корневая секция найдена:', {
    rootSectionId: rootSection.id,
    rootOwnObject: rootOwnObject ? 'НАЙДЕН' : 'НЕ НАЙДЕН',
    rootOwnObjectPosition: rootOwnObject.position.clone(),
  });
  
  // ⭐ РЕФАКТОРИНГ: Работаем в миллиметрах внутри (как в референсе Clodis)
  const units = 1000; // Референс использует units = 1000
  
  // Размеры родителя в миллиметрах (как в референсе computed.size)
  // ⭐ БЕЗОПАСНЫЙ ДОСТУП: используем функцию-геттер (сначала userData, потом metadata)
  const parentSizeFromData = getNodeSizeFromData(rootSection) || { x: 400, y: 400, z: 200 };
  const isSizeInMeters = parentSizeFromData.x < 1 && parentSizeFromData.y < 1 && parentSizeFromData.z < 1;
  
  // Размеры родителя в миллиметрах (как в референсе computed.size)
  const parentSize_mm = isSizeInMeters 
    ? { x: parentSizeFromData.x * units, y: parentSizeFromData.y * units, z: parentSizeFromData.z * units }
    : parentSizeFromData;
  
  // ⭐ РЕФЕРЕНС: Размеры дочерней секции задаются как выражения 's:x', 's:y', 's:z'
  // Референс: main_core_v2_part20.js строка 2525-2527
  // Это означает, что размеры дочерней секции всегда равны размерам родителя
  // При обновлении размеров родителя, размеры дочерней секции автоматически пересчитываются через comp2()
  
  // Сохраняем размеры как выражения (как в референсе)
  const childSizeExpressions = {
    x: 's:x', // Размер по X = размер родителя по X
    y: 's:y', // Размер по Y = размер родителя по Y
    z: 's:z'  // Размер по Z = размер родителя по Z
  };
  
  // ⭐ ЭТАП 1: Создаем sectionGroup ДО вычисления размеров (нужен для c_object)
  const sectionGroup = new THREE.Group();
  sectionGroup.name = name || 'Дочерняя секция';
  sectionGroup.visible = true;
  
  // Инициализируем userData структуру (нужно для c_object)
  const childOwnObject = new THREE.Group();
  childOwnObject.name = '__own_object';
  childOwnObject.visible = true;
  sectionGroup.add(childOwnObject);
  
  initUserDataStruct(sectionGroup, childOwnObject);
  const computed = initUserDataComputed(sectionGroup);
  const params = initUserDataParams(sectionGroup, {
    size: childSizeExpressions, // Сохраняем выражения размеров
    pivot: { x: -1, y: -1, z: -1 },
    helpers_visible: 1,
  });
  
  // ⭐ ЭТАП 2: Создаем c_object для выражений (1 В 1 С РЕФЕРЕНСОМ)
  // Референс: main_core_v2_part18.js:2556-2564
  // c_object создается ДО вычисления размеров через comp2()
  const c_object = createCObject(sectionGroup, rootSection, rootSection, null);
  
  // Вычисляем размеры через comp2() (как в референсе _build_size)
  // Референс: f['size']['x'] = comp2(g['size']['x'], h) где h = f['c_object']
  const childSize_mm = {
    x: comp2(childSizeExpressions.x, c_object),
    y: comp2(childSizeExpressions.y, c_object),
    z: comp2(childSizeExpressions.z, c_object)
  };
  
  // ⭐ ЭТАП 1: Сохраняем размеры в computed (как в референсе)
  computed.size.set(childSize_mm.x, childSize_mm.y, childSize_mm.z);
  computed.u_size.set(childSize_mm.x / units, childSize_mm.y / units, childSize_mm.z / units);
  
  // Размеры для Three.js геометрии (делим на units)
  const childSize = { 
    x: childSize_mm.x / units, 
    y: childSize_mm.y / units, 
    z: childSize_mm.z / units 
  };
  
  // ⭐ ЭТАП 3: _build_pos() - вычисление позиции через comp2() (1 В 1 С РЕФЕРЕНСОМ)
  // Референс: main_core_v2_part18.js:2648-2655
  // Референс: f['pos']['x'] = comp2(g['pos']['x'], h) где f=computed, g=params, h=c_object
  // Сохраняем выражения позиции в params (по умолчанию '0' для центрирования)
  if (!params.pos) {
    params.pos = { x: '0', y: '0', z: '0' };
  }
  
  // Вычисляем позицию через comp2() (как в референсе)
  const posX_mm = comp2(params.pos.x, c_object);
  const posY_mm = comp2(params.pos.y, c_object);
  const posZ_mm = comp2(params.pos.z, c_object);
  
  // Сохраняем в computed.pos (как в референсе)
  computed.pos.set(posX_mm, posY_mm, posZ_mm);
  
  // Применяем позицию (референс строка 2655)
  // Референс: this.position.set((-parent_size.x / 2 + pos.x) / units, (-parent_size.y / 2 + pos.y) / units, (-parent_size.z / 2 + pos.z) / units)
  // ⭐ ПРОБЛЕМА: В референсе own_object корневой секции находится в центре (после pivot),
  // поэтому дочерняя секция должна позиционироваться относительно этого центра.
  // При pos = 0 и одинаковых размерах дочерняя секция должна совпадать с корневой.
  // Формула референса работает, если own_object родителя в начале координат,
  // но у нас own_object в центре, поэтому нужно компенсировать.
  const parentSize = c_object.parent_size as THREE.Vector3;
  
  // ⭐ ИСПРАВЛЕНО: Компенсируем смещение own_object родителя (который в центре после pivot)
  // Если pos = 0, дочерняя секция должна быть в центре own_object родителя (т.е. в позиции 0)
  sectionGroup.position.set(
    posX_mm / units,  // При pos = 0 это 0, дочерняя секция в центре родителя
    posY_mm / units,
    posZ_mm / units
  );
  
  console.log('🔍 [createSectionFromInlineModal] ПРОВЕРКА РАЗМЕРОВ И ПОЗИЦИИ:', {
    parentSizeFromData,
    parentSize_mm,
    childSize_mm,
    childSize,
    pos_mm: { x: posX_mm, y: posY_mm, z: posZ_mm },
    pos_expressions: params.pos,
    units,
    c_object_parent_size: c_object.parent_size,
    c_object_root_size: c_object.root_size,
    'sectionGroup.position (метры)': sectionGroup.position.clone(),
    'formula_x (старая)': `(-${parentSize.x} / 2 + ${posX_mm}) / ${units} = ${(-parentSize.x / 2 + posX_mm) / units}`,
    'formula_x (новая)': `${posX_mm} / ${units} = ${posX_mm / units}`,
    'formula_y (старая)': `(-${parentSize.y} / 2 + ${posY_mm}) / ${units} = ${(-parentSize.y / 2 + posY_mm) / units}`,
    'formula_y (новая)': `${posY_mm} / ${units} = ${posY_mm / units}`,
    'formula_z (старая)': `(-${parentSize.z} / 2 + ${posZ_mm}) / ${units} = ${(-parentSize.z / 2 + posZ_mm) / units}`,
    'formula_z (новая)': `${posZ_mm} / ${units} = ${posZ_mm / units}`,
  });
  
  // ⭐ СОЗДАНИЕ ДОЧЕРНЕЙ СЕКЦИИ ПО РЕФЕРЕНСУ (1 В 1)
  // Референс: _build() порядок (строка 2588-2613):
  // 1. _build_struct() - создание own_object ✅ (уже сделано выше)
  // 2. _build_size() - размеры ✅ (уже сделано выше)
  // 3. _build_pos() - позиция ✅ (уже сделано выше)
  // 4. _build_rot() - поворот
  // 5. _build_scale() - масштаб
  // 6. _build_pivot() - pivot (ПОСЛЕ позиции!)
  
  // ⭐ ЭТАП 4: _build_rot() для дочерней секции - вычисление поворота через comp2() (1 В 1 С РЕФЕРЕНСОМ)
  // Референс: main_core_v2_part18.js:2669-2678
  // Референс: f['rot']['x'] = comp2(g['rot']['x'], h) где f=computed, g=params, h=c_object
  // По умолчанию rot = (0,0,0)
  if (!params.rot) {
    params.rot = { x: '0', y: '0', z: '0' };
  }
  
  // Вычисляем поворот через comp2() (как в референсе)
  const rotX = comp2(params.rot.x, c_object);
  const rotY = comp2(params.rot.y, c_object);
  const rotZ = comp2(params.rot.z, c_object);
  
  // Сохраняем в computed.rot (как в референсе)
  computed.rot.set(rotX, rotY, rotZ);
  
  // Применяем поворот (референс строка 2674-2677)
  // Референс: h['rotation']['set'](0x0, 0x0, 0x0), h['rotateX'](-deg2rad(k)), ...
  childOwnObject.rotation.set(0, 0, 0);
  childOwnObject.rotateX(-THREE.MathUtils.degToRad(rotX));
  childOwnObject.rotateY(-THREE.MathUtils.degToRad(rotY));
  childOwnObject.rotateZ(-THREE.MathUtils.degToRad(rotZ));
  
  // ⭐ ЭТАП 4: _build_scale() для дочерней секции - вычисление масштаба через comp2() (1 В 1 С РЕФЕРЕНСОМ)
  // Референс: main_core_v2_part18.js:2679-2685
  // Референс: f['scale']['x'] = comp2(g['scale']['x'], h) где f=computed, g=params, h=c_object
  // По умолчанию scale = (1,1,1)
  if (!params.scale) {
    params.scale = { x: '1', y: '1', z: '1' };
  }
  
  // Вычисляем масштаб через comp2() (как в референсе)
  const scaleX = comp2(params.scale.x, c_object);
  const scaleY = comp2(params.scale.y, c_object);
  const scaleZ = comp2(params.scale.z, c_object);
  
  // Сохраняем в computed.scale (как в референсе)
  computed.scale.set(scaleX, scaleY, scaleZ);
  
  // Применяем масштаб (референс строка 2684)
  // Референс: h['scale']['set'](k, l, g)
  childOwnObject.scale.set(scaleX, scaleY, scaleZ);
  
  // ⭐ ЭТАП 5: _build_pivot() для дочерней секции - вычисление pivot через conv_pivot() (1 В 1 С РЕФЕРЕНСОМ)
  // Референс: main_core_v2_part18.js:2658-2667
  // Референс: j = conv_pivot(g['pivot']['x'], f['size']['x']) где g=params, f=computed
  // Референс: h['translateX'](j / units) где h=own_object
  // По умолчанию pivot = (-1, -1, -1) для секций
  if (!params.pivot) {
    params.pivot = { x: -1, y: -1, z: -1 };
  }
  
  // Вычисляем pivot offset через conv_pivot() (как в референсе)
  const pivotX_mm = conv_pivot(params.pivot.x, computed.size.x);
  const pivotY_mm = conv_pivot(params.pivot.y, computed.size.y);
  const pivotZ_mm = conv_pivot(params.pivot.z, computed.size.z);
  
  // Применяем pivot (референс строка 2665-2667)
  // Референс: h['translateX'](j / units), h['translateY'](k / units), h['translateZ'](g / units)
  childOwnObject.translateX(pivotX_mm / units);
  childOwnObject.translateY(pivotY_mm / units);
  childOwnObject.translateZ(pivotZ_mm / units);
  
  // ⭐ УДАЛЕНО: Желтый маркер (временный для отладки)
  
  // ⭐ ЭТАП 6: _build_helpers() для дочерней секции (1 В 1 С РЕФЕРЕНСОМ)
  // Референс: main_core_v2_part18.js:2860-2884
  // Референс: var f = this['userData']['computed'] (строка 2861)
  // Референс: var g = (this['userData']['helpers'] ? this['_reset'](this['userData']['helpers']) : ...)
  // Если helpers уже существуют, очищаем их (референс использует _reset())
  let childHelpersGroup: THREE.Group;
  if (sectionGroup.userData.helpers) {
    // Очищаем существующие helpers (аналог _reset())
    childHelpersGroup = sectionGroup.userData.helpers as THREE.Group;
    while (childHelpersGroup.children.length > 0) {
      const child = childHelpersGroup.children[0];
      childHelpersGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: THREE.Material) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
  } else {
    // Создаем новую группу helpers (референс строка 2862-2864)
    childHelpersGroup = new THREE.Group();
  childHelpersGroup.name = '__helpers';
    sectionGroup.add(childHelpersGroup);
    sectionGroup.userData.helpers = childHelpersGroup;
  }
  
  // ⭐ ЭТАП 6: make_cube() - создание куба (референс строка 2865)
  // Референс: make_cube(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['helper_cube'])
  // Используем материал из pp.three.materials.helper_cube (как в референсе)
  const childHelperCubeMaterial = (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.helper_cube)
    ? (window as any).pp.three.materials.helper_cube
    : undefined;
  
  const helperCube = make_cube(
    computed.u_size.x, // Размеры в метрах (computed.u_size)
    computed.u_size.y,
    computed.u_size.z,
    childHelperCubeMaterial
  );
  
  console.log('✅ [createSectionFromInlineModal] Helper cube создан, проверяем материал:', {
    material: helperCube.material,
    color: (helperCube.material as THREE.MeshStandardMaterial).color,
    opacity: (helperCube.material as THREE.MeshStandardMaterial).opacity
  });
  
  // Референс строка 2866-2872: настройка свойств куба
  helperCube.userData.is_helper = true;
  helperCube.userData.no_edges = true;
  helperCube.renderOrder = 10; // Референс строка 2869
  helperCube.layers.set(1); // Референс строка 2870: layers.set(0x1) = layer 1
  helperCube.position.set(0, 0, 0);
  helperCube.visible = true;
  childHelpersGroup.userData.size_volume = helperCube; // Референс строка 2871
  childHelpersGroup.add(helperCube); // Референс строка 2872
  
  // ⭐ ЭТАП 6: make_edges() - создание ребер (референс строка 2873)
  // Референс: make_edges(f['size']['x'] / units, f['size']['y'] / units, f['size']['z'] / units, pp['three']['materials']['basic_line'])
  // Получаем материал из pp.three.materials.basic_line если доступен
  const edgesMaterial = (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.basic_line) 
    ? (window as any).pp.three.materials.basic_line 
    : undefined;
  
  const edges = make_edges(
    computed.u_size.x, // Размеры в метрах (computed.u_size)
    computed.u_size.y,
    computed.u_size.z,
    edgesMaterial
  );
  
  // Референс строка 2874-2878: настройка свойств edges
  edges.userData.is_helper = true;
  edges.userData.no_edges = true;
  edges.renderOrder = 11; // Референс строка 2877
  edges.layers.set(1); // Референс строка 2878: layers.set(0x1) = layer 1
  edges.position.set(0, 0, 0);
  edges.visible = true;
  
  // Референс строка 2879-2880: добавляем cube еще раз и edges
  childHelpersGroup.add(helperCube); // Добавляем cube еще раз (как в референсе строка 2879)
  childHelpersGroup.add(edges); // Добавляем edges (как в референсе строка 2880)
  
  // ⭐ РЕФЕРЕНС строка 2881-2882: helpers копируют позицию от own_object ПОСЛЕ добавления
  // Референс: this['userData']['helpers']['position']['copy'](this['userData']['own_object']['position'])
  childHelpersGroup.position.copy(childOwnObject.position);
  childHelpersGroup.rotation.copy(childOwnObject.rotation);
  
  // ⭐ ЭТАП 6: Видимость helpers (референс строка 2883)
  // Референс: this['userData']['helpers']['visible'] = 0x1 == this['userData']['params']['helpers_visible']
  childHelpersGroup.visible = params.helpers_visible === 1;
  
  // ⭐ РЕФЕРЕНС: Дети добавляются в own_object родителя (строка 2744 main_core_v2_part18.js)
  // this['userData']['own_object']['add'](z)
  // Дочерняя секция добавляется в own_object корневой секции
  rootOwnObject.add(sectionGroup);
  
  // ⭐ ЖЕЛТЫЙ МАРКЕР УДАЛЕН: больше не создаем маркер в дочерней секции
  
  // ⭐ ВАЖНО: Убеждаемся, что секция видима (но helpers контролируются через params.helpers_visible)
  sectionGroup.visible = true;
  childOwnObject.visible = true;

  // 🔍 Отладка: логируем helpers после создания дочерней секции
  debugLogSceneHelpers('after createSectionFromInlineModal');
  
  // ⭐ ПРОВЕРКА: Убеждаемся что rootOwnObject в сцене и видим
  const rootSectionGroup = rootSection.group;
  if (!rootSectionGroup.parent) {
    console.error('❌ [createSectionFromInlineModal] rootSectionGroup не в сцене!');
  } else {
    console.log('✅ [createSectionFromInlineModal] rootSectionGroup в сцене, parent:', rootSectionGroup.parent.name || rootSectionGroup.parent.type);
  }
  
  // Проверяем что rootOwnObject видим
  if (!rootOwnObject.visible) {
    console.warn('⚠️ [createSectionFromInlineModal] rootOwnObject не видим! Делаем видимым.');
    rootOwnObject.visible = true;
  }
  
  // Проверяем что rootSectionGroup видим
  if (!rootSectionGroup.visible) {
    console.warn('⚠️ [createSectionFromInlineModal] rootSectionGroup не видим! Делаем видимым.');
    rootSectionGroup.visible = true;
  }
  
  // Обновляем матрицы для правильного расчета мировых координат
  scene.updateMatrixWorld(true);
  
  // Получаем мировую позицию секции для проверки
  const sectionWorldPos = new THREE.Vector3();
  sectionGroup.getWorldPosition(sectionWorldPos);
  
  // Получаем мировую позицию helpers для проверки
  const helpersWorldPos = new THREE.Vector3();
  childHelpersGroup.getWorldPosition(helpersWorldPos);
  
  // ⭐ ДЕТАЛЬНАЯ ДИАГНОСТИКА: Проверяем все компоненты секции
  console.group('🔍 [createSectionFromInlineModal] ДЕТАЛЬНАЯ ДИАГНОСТИКА СЕКЦИИ');
  
  // 1. Проверка иерархии
  console.log('📋 ИЕРАРХИЯ:', {
    sceneChildren: scene.children.map(c => ({ name: c.name || c.type, visible: c.visible, type: c.type })),
    rootSectionGroupChildren: rootSectionGroup.children.map(c => ({ name: c.name || c.type, visible: c.visible, type: c.type })),
    rootOwnObjectChildren: rootOwnObject.children.map(c => ({ name: c.name || c.type, visible: c.visible, type: c.type })),
    sectionGroupChildren: sectionGroup.children.map(c => ({ name: c.name || c.type, visible: c.visible, type: c.type })),
    childOwnObjectChildren: childOwnObject.children.map(c => ({ name: c.name || c.type, visible: c.visible, type: c.type })),
    childHelpersGroupChildren: childHelpersGroup.children.map(c => ({ name: c.name || c.type, visible: c.visible, type: c.type })),
  });
  
  // 2. Проверка видимости
  console.log('👁️ ВИДИМОСТЬ:', {
    rootSectionGroup: { visible: rootSectionGroup.visible, inScene: !!rootSectionGroup.parent },
    rootOwnObject: { visible: rootOwnObject.visible, inScene: !!rootOwnObject.parent },
    sectionGroup: { visible: sectionGroup.visible, inScene: !!sectionGroup.parent },
    childOwnObject: { visible: childOwnObject.visible, inScene: !!childOwnObject.parent },
    childHelpersGroup: { visible: childHelpersGroup.visible, inScene: !!childHelpersGroup.parent },
    helperCube: (() => {
      const cube = childHelpersGroup.children.find(c => c.userData.size_volume || c.type === 'Mesh');
      return cube ? { visible: cube.visible, name: cube.name || cube.type } : 'НЕ НАЙДЕН';
    })(),
    edges: (() => {
      const edges = childHelpersGroup.children.find(c => c.type === 'LineSegments');
      return edges ? { visible: edges.visible, name: edges.name || edges.type } : 'НЕ НАЙДЕН';
    })(),
  });
  
  // 3. Проверка позиций
  const rootOwnObjectWorldPos = new THREE.Vector3();
  rootOwnObject.getWorldPosition(rootOwnObjectWorldPos);
  const childOwnObjectWorldPos = new THREE.Vector3();
  childOwnObject.getWorldPosition(childOwnObjectWorldPos);
  const childHelpersGroupWorldPos = new THREE.Vector3();
  childHelpersGroup.getWorldPosition(childHelpersGroupWorldPos);
  
  console.log('📍 ПОЗИЦИИ:', {
    rootOwnObject: {
      local: rootOwnObject.position.clone(),
      world: rootOwnObjectWorldPos.clone(),
    },
    sectionGroup: {
      local: sectionGroup.position.clone(),
      world: sectionWorldPos.clone(),
    },
    childOwnObject: {
      local: childOwnObject.position.clone(),
      world: childOwnObjectWorldPos.clone(),
    },
    childHelpersGroup: {
      local: childHelpersGroup.position.clone(),
      world: childHelpersGroupWorldPos.clone(),
    },
  });
  
  // 4. Проверка размеров
  console.log('📏 РАЗМЕРЫ:', {
    parentSize_mm: parentSize_mm,
    childSize_mm: childSize_mm,
    childSize_three: childSize,
    helperCubeSize: (() => {
      const cube = childHelpersGroup.children.find(c => c.userData.size_volume || c.type === 'Mesh');
      if (cube && cube.geometry) {
        cube.geometry.computeBoundingBox();
        const box = cube.geometry.boundingBox;
        return box ? { x: box.max.x - box.min.x, y: box.max.y - box.min.y, z: box.max.z - box.min.z } : 'НЕТ BOUNDING BOX';
      }
      return 'НЕ НАЙДЕН';
    })(),
  });
  
  // 5. Проверка материалов
  console.log('🎨 МАТЕРИАЛЫ:', {
    helperCubeMaterial: (() => {
      const cube = childHelpersGroup.children.find(c => c.type === 'Mesh');
      if (cube && cube.material) {
        return {
          color: cube.material.color?.getHex(),
          opacity: cube.material.opacity,
          transparent: cube.material.transparent,
          visible: cube.material.visible,
        };
      }
      return 'НЕ НАЙДЕН';
    })(),
    edgesMaterial: (() => {
      const edges = childHelpersGroup.children.find(c => c.type === 'LineSegments');
      if (edges && edges.material) {
        return {
          color: edges.material.color?.getHex(),
          visible: edges.material.visible,
        };
      }
      return 'НЕ НАЙДЕН';
    })(),
  });
  
  // 6. Проверка камеры (для понимания видимости)
  console.log('📷 КАМЕРА:', {
    position: camera.position.clone(),
    target: controls.target.clone(),
    near: camera.near,
    far: camera.far,
  });
  
  console.groupEnd();
  
  // ⭐ ПРОСТОЙ ЛОГ ДЛЯ БЫСТРОЙ ПРОВЕРКИ
  console.log('✅ [createSectionFromInlineModal] Дочерняя секция создана:', {
    sectionGroupName: sectionGroup.name,
    sectionGroupInRootOwnObject: rootOwnObject.children.includes(sectionGroup),
    sectionGroupVisible: sectionGroup.visible,
    helpersVisible: childHelpersGroup.visible,
    helpersChildren: childHelpersGroup.children.length,
    size_mm: childSize_mm,
    size_three: childSize,
  });
  
  // Создаем SceneNode для дочерней секции
  // ⭐ ЭТАП 1: 1 В 1 С РЕФЕРЕНСОМ - данные только в userData, НЕ в metadata
  const childSectionNode: SceneNode = {
    id: generateId(),
    name: name || 'Дочерняя секция',
    type: 'section',
    group: sectionGroup,
    children: [],
    parent: rootSection,
    expanded: true,
    metadata: {
      // ⭐ Минимальный metadata только для обратной совместимости (если есть старый код)
      is_root: false,
      // ⭐ ВАЖНО: Все данные в userData (как в референсе):
      // - sectionGroup.userData.struct['__own_object'] = own_object
      // - sectionGroup.userData.computed.size = размеры в мм
      // - sectionGroup.userData.computed.u_size = размеры в метрах
      // - sectionGroup.userData.params = параметры
      // - sectionGroup.userData.helpers = helpers
    },
  };
  
  addChildNode(rootSection, childSectionNode);
  selectNode(childSectionNode);
  
  // ⭐ ЭТАП 1: 1 В 1 С РЕФЕРЕНСОМ - данные только в userData
  // Референс НЕ синхронизирует с metadata, все данные в userData группы
  
  // ⭐ ВАЖНО: Обновляем дерево конструктора (не только renderHierarchy)
  // Референс обновляет дерево через renderConstructorTreeFromClodisJSON или через addElementToTreeFrom3D
  const rootModuleChildren = document.getElementById('constructor-root-module-children');
  if (rootModuleChildren && typeof (window as any).addElementToTreeFrom3D === 'function') {
    // Добавляем дочернюю секцию в дерево конструктора
    (window as any).addElementToTreeFrom3D(
      'section',
      childSectionNode.name,
      rootSection.id,
      1, // depth
      childSectionNode.id
    );
    console.log('✅ [createSectionFromInlineModal] Дочерняя секция добавлена в дерево конструктора');
  }
  
  render();
  
  console.log('✅ [createSectionFromInlineModal] Дочерняя секция полностью создана');
}

// Экспортируем функцию в window
(window as any).createSectionFromInlineModal = createSectionFromInlineModal;

// openDetailTypeModal/createDetail.
function createDetailFromInlineModal(detailTypeId: string, name?: string) {
  // ⭐ ИСПОЛЬЗУЕМ НОВУЮ СИСТЕМУ: createDetailClodis() для всех типов деталей
  console.log('🔷 [createDetailFromInlineModal] Вызов новой реализации через createDetailClodis:', { detailTypeId, name });
  
  // ⚠️ ИСПРАВЛЕНО: Логика выбора секции как в референсе
  // Референс: Деталь ставится в корневую секцию, если в ней нет дочерней. В дочернюю, если она есть в корневой.
  
  // 1. Находим корневую секцию
  let rootSection: SceneNode | null = null;
  if (currentSelectedNode && currentSelectedNode.type === 'section' && currentSelectedNode.parent === null) {
    rootSection = currentSelectedNode;
  } else {
    rootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null) || null;
  }
  
  if (!rootSection) {
    alert('Сначала создайте корневую секцию');
    return;
  }
  
  // 2. Проверяем, есть ли в корневой секции дочерняя секция
  // Референс: Деталь ставится в дочернюю секцию, если она есть в корневой
  let targetSection: SceneNode | null = rootSection;
  const childSections = rootSection.children.filter(n => n.type === 'section');
  
  if (childSections.length > 0) {
    // Если есть дочерняя секция, используем первую дочернюю секцию
    targetSection = childSections[0];
    console.log('✅ [createDetailFromInlineModal] Деталь будет добавлена в дочернюю секцию:', targetSection.name);
  } else {
    // Если дочерней секции нет, деталь в корневую секцию
    console.log('✅ [createDetailFromInlineModal] Деталь будет добавлена в корневую секцию:', targetSection.name);
  }
  
  // 3. Если выбрана не секция, используем её родителя (секцию)
  if (targetSection.type !== 'section') {
    targetSection = targetSection.parent || rootSection;
  }
  
  const detailType = detailTypes.find(dt => dt.id === detailTypeId);
  if (!detailType) {
    alert('Неизвестный тип детали: ' + detailTypeId);
    return;
  }
  const materialId: keyof typeof detailMaterials = 'ldsp16';
  const safeName = (name && name.trim().length > 0) ? name.trim() : 'Деталь';
  
  // ⭐ ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ createDetailClodis() вместо старой createDetail()
  const detailNode = createDetailClodis(targetSection, detailTypeId, safeName, { materialId });
  
  if (detailNode) {
    console.log('✅ [createDetailFromInlineModal] Деталь создана через createDetailClodis:', detailNode.name);
  } else {
    console.error('❌ [createDetailFromInlineModal] Не удалось создать деталь');
    alert('Ошибка: не удалось создать деталь. Проверьте консоль браузера (F12).');
  }
}

// Экспортируем функцию в window сразу после определения
(window as any).createDetailFromInlineModal = createDetailFromInlineModal;

// Нарисовать превью типа детали на canvas
function drawDetailPreview(canvas: HTMLCanvasElement, detailType: typeof detailTypes[0]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const size = canvas.width;
  const padding = 10;
  const boxSize = size - padding * 2;
  
  // Очистка
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(0, 0, size, size);
  
  // Рисуем рамку куба (wireframe) - светло-серая
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 1.5;
  
  // Передняя грань (видимая)
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding + boxSize, padding);
  ctx.lineTo(padding + boxSize, padding + boxSize);
  ctx.lineTo(padding, padding + boxSize);
  ctx.closePath();
  ctx.stroke();
  
  // Задняя грань (смещена для перспективы)
  const offset = boxSize * 0.25;
  ctx.beginPath();
  ctx.moveTo(padding + offset, padding + offset);
  ctx.lineTo(padding + boxSize + offset, padding + offset);
  ctx.lineTo(padding + boxSize + offset, padding + boxSize + offset);
  ctx.lineTo(padding + offset, padding + boxSize + offset);
  ctx.closePath();
  ctx.stroke();
  
  // Соединяющие линии (ребра куба)
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding + offset, padding + offset);
  ctx.moveTo(padding + boxSize, padding);
  ctx.lineTo(padding + boxSize + offset, padding + offset);
  ctx.moveTo(padding + boxSize, padding + boxSize);
  ctx.lineTo(padding + boxSize + offset, padding + boxSize + offset);
  ctx.moveTo(padding, padding + boxSize);
  ctx.lineTo(padding + offset, padding + boxSize + offset);
  ctx.stroke();
  
  // Рисуем деталь (золотистая плоскость)
  ctx.fillStyle = '#d4af37';
  ctx.strokeStyle = '#b8941f';
  ctx.lineWidth = 1;
  
  let detailX = padding;
  let detailY = padding;
  let detailWidth = boxSize;
  let detailHeight = boxSize;
  
  // Позиционирование и размеры детали в зависимости от типа
  switch (detailType.position) {
    case 'back-front':
      // Задняя фронтальная - вертикальная плоскость сзади (левая сторона)
      detailX = padding;
      detailY = padding;
      detailWidth = boxSize * 0.15;
      detailHeight = boxSize;
      break;
    case 'vertical-left':
      // Вертикальная левая - вертикальная плоскость слева (передняя сторона)
      detailX = padding;
      detailY = padding;
      detailWidth = boxSize * 0.15;
      detailHeight = boxSize;
      break;
    case 'vertical-right':
      // Вертикальная правая - вертикальная плоскость справа (передняя сторона)
      detailX = padding + boxSize - boxSize * 0.15;
      detailY = padding;
      detailWidth = boxSize * 0.15;
      detailHeight = boxSize;
      break;
    case 'horizontal-top':
      // Горизонтальная верхняя - горизонтальная плоскость сверху
      detailX = padding;
      detailY = padding;
      detailWidth = boxSize;
      detailHeight = boxSize * 0.15;
      break;
    case 'horizontal-bottom':
      // Горизонтальная нижняя - горизонтальная плоскость снизу
      detailX = padding;
      detailY = padding + boxSize - boxSize * 0.15;
      detailWidth = boxSize;
      detailHeight = boxSize * 0.15;
      break;
    case 'vertical-middle':
      // Вертикальная средняя - вертикальная плоскость по центру (передняя сторона)
      detailX = padding + (boxSize - boxSize * 0.15) / 2;
      detailY = padding;
      detailWidth = boxSize * 0.15;
      detailHeight = boxSize;
      break;
    case 'horizontal-middle':
      // Горизонтальная средняя - горизонтальная плоскость по центру
      detailX = padding;
      detailY = padding + (boxSize - boxSize * 0.15) / 2;
      detailWidth = boxSize;
      detailHeight = boxSize * 0.15;
      break;
    case 'front-middle':
      // Фронтальная средняя - вертикальная плоскость спереди по центру (вертикально)
      detailX = padding + boxSize - boxSize * 0.15;
      detailY = padding + (boxSize - boxSize * 0.3) / 2;
      detailWidth = boxSize * 0.15;
      detailHeight = boxSize * 0.3;
      break;
    case 'front-front':
      // Фронтальная передняя - полная передняя вертикальная плоскость
      detailX = padding + boxSize - boxSize * 0.15;
      detailY = padding;
      detailWidth = boxSize * 0.15;
      detailHeight = boxSize;
      break;
  }
  
  // Рисуем деталь
  ctx.fillRect(detailX, detailY, detailWidth, detailHeight);
  ctx.strokeRect(detailX, detailY, detailWidth, detailHeight);
}

function registerNode(node: SceneNode) {
  // Добавляем только корневые узлы (без parent)
  if (!node.parent) {
    // Проверяем, нет ли уже такого узла в sceneNodes (по ID)
    const existingIndex = sceneNodes.findIndex(n => n.id === node.id);
    if (existingIndex >= 0) {
      console.log('⚠️ Узел с таким ID уже существует в sceneNodes, обновляем вместо добавления:', node.id);
      sceneNodes[existingIndex] = node; // Заменяем существующий
    } else {
      // Проверяем для секций - не создаём дубликаты корневых секций
      if (node.type === 'section') {
        const existingSection = sceneNodes.find(n => n.type === 'section' && n.parent === null);
        if (existingSection) {
          console.warn('⚠️ Корневая секция уже существует, не добавляем дубликат. Используйте updateRootSectionSize для обновления размеров.');
          return; // Не добавляем дубликат
        }
      }
      sceneNodes.push(node);
    }
    // Синхронизируем window.sceneNodes
    (window as any).sceneNodes = sceneNodes;
  }
  renderHierarchy();
}

// Получить размеры узла (из metadata или bbox, исключая дочерние узлы)
function getNodeSize(node: SceneNode): { x: number; y: number; z: number } | null {
  // Защита от некорректных узлов (без group) — чтобы не падать на node.group.children
  if (!node || !node.group) {
    console.warn('⚠️ [getNodeSize] Узел не имеет group:', node?.name);
    return null;
  }
  // ВАЖНО: Сначала пробуем взять из metadata (предпочтительно)
  // metadata содержит реальные размеры секции без учета дочерних элементов
  // Если есть size_three (в метрах для Three.js), используем его
  // Иначе конвертируем size (в миллиметрах) в метры
  if (node.metadata?.size_three) {
    return { ...node.metadata.size_three }; // Возвращаем размеры в метрах для Three.js
  }
  if (node.metadata?.size) {
    // Конвертируем из миллиметров в метры (units = 1000)
    const units = 1000;
    return { 
      x: node.metadata.size.x / units, 
      y: node.metadata.size.y / units, 
      z: node.metadata.size.z / units 
    };
  }
  
  // Если нет metadata, вычисляем из bbox, но ИСКЛЮЧАЯ дочерние детали
  // Это критично, иначе каждая новая деталь увеличивает размеры родителя
  
  // Для секции ищем рамку (frame) - она определяет размеры секции
  if (node.type === 'section') {
    // Рамка - это Group, которая содержит BoxGeometry
    const frameGroup = node.group.children.find(child => {
      if (child.type === 'Group') {
        // Проверяем, содержит ли эта группа рамку (BoxGeometry)
        return child.children.some(grandchild => {
          if ((grandchild as THREE.Mesh).isMesh) {
            const mesh = grandchild as THREE.Mesh;
            // Ищем BoxGeometry, который не является деталью, осями или отдельной рамкой
            return mesh.geometry instanceof THREE.BoxGeometry;
          }
          return false;
        });
      }
      return false;
    }) as THREE.Group | undefined;
    
    if (frameGroup) {
      // Вычисляем bbox только рамки
      const bbox = new THREE.Box3().setFromObject(frameGroup);
      const size = bbox.max.clone().sub(bbox.min);
      if (size.x > 0 && size.y > 0 && size.z > 0) {
        console.log('📐 Размеры секции из рамки:', size);
        return { x: size.x, y: size.y, z: size.z };
      }
    }
  }
  
  // Для других типов: вычисляем bbox, исключая дочерние узлы (детали)
  const tempBox = new THREE.Box3();
  let foundGeometry = false;
  
  node.group.children.forEach(child => {
    // Исключаем дочерние узлы типа деталей
    // Детали имеют userData.isDetail или находятся в дочерних SceneNode
    const isChildNode = node.children.some(n => n.group === child);
    
    if (!isChildNode && 
        !child.userData?.isDetail && 
        !child.userData?.isAxes) {
      const childBox = new THREE.Box3().setFromObject(child);
      if (childBox.min.x !== Infinity) { // Проверка, что bbox валиден
        tempBox.union(childBox);
        foundGeometry = true;
      }
    }
  });
  
  if (foundGeometry) {
    const size = tempBox.max.clone().sub(tempBox.min);
    if (size.x > 0 && size.y > 0 && size.z > 0) {
      console.log('📐 Размеры узла из bbox (без дочерних):', size);
      return { x: size.x, y: size.y, z: size.z };
    }
  }
  
  console.warn('⚠️ Не удалось определить размеры узла:', node.name);
  return null;
}

// Получить все детали определенного типа из родительской секции
function getExistingDetails(parentNode: SceneNode, filter?: {
  type?: 'vertical' | 'horizontal' | 'back' | 'front';
  position?: string;
}): SceneNode[] {
  return parentNode.children.filter(child => {
    if (child.type !== 'detail') return false;
    if (!filter) return true;
    
    const metadata = child.metadata;
    if (!metadata) return false;
    
    // Используем новые поля orientation и position, если они есть, иначе fallback на detailTypeId
    const orientation = child.orientation;
    const position = child.position;
    const detailTypeId = metadata.detailTypeId || ''; // Для обратной совместимости
    
    if (filter.type === 'vertical') {
      return orientation === 'vertical' || detailTypeId.includes('vertical');
    }
    if (filter.type === 'horizontal') {
      return orientation === 'horizontal' || detailTypeId.includes('horizontal');
    }
    if (filter.type === 'back') {
      return (position && position.includes('back')) || detailTypeId.includes('back_front');
    }
    if (filter.type === 'front') {
      return (position && position.includes('front')) || detailTypeId.includes('front');
    }
    
    if (filter.position) {
      return position === filter.position || detailTypeId === filter.position || detailTypeId.includes(filter.position);
    }
    
    return true;
  });
}

// Глобальные переменные (аналогично Clodis)
// Будет использоваться для выражений типа g:g0.thickness
const globalGroups: { [key: string]: { [property: string]: number } } = {
  g0: { thickness: 0.016 }, // Толщина материала группы g0 (16мм = 0.016м)
};

// Глобальные переменные для выражений (аналогично Clodis v:variable)
const globalVariables: { [key: string]: number } = {
  vysota_cokolya: 0.1, // Высота цоколя (100мм = 0.1м) - используется в выражениях для горизонтальных деталей снизу
  // Будет пополняться из вкладки "Переменные"
};

// Вычислить выражение (аналогично Clodis evaluateExpression)
// Поддерживает: s:x, s:y, s:z (размеры секции), g:group.property (группы), v:variable (переменные)
// Математические операции: +, -, *, /
// Возвращает значение в МЕТРАХ (так как у нас все в метрах)
function evaluateExpression(
  expr: string | number,
  parentSection: SceneNode | null,
  context?: { [key: string]: number }
): number {
  // Если это число, возвращаем его (в метрах)
  if (typeof expr === 'number') {
    return expr;
  }
  
  // Если это не строка, возвращаем 0
  if (typeof expr !== 'string') {
    return 0;
  }
  
  const exprTrimmed = expr.trim();
  
  // Если строка пустая, возвращаем 0
  if (!exprTrimmed) {
    return 0;
  }
  
  // Размеры секции: s:x, s:y, s:z (в метрах)
  if (exprTrimmed.startsWith('s:') || exprTrimmed.startsWith('s.')) {
    const axis = exprTrimmed.substring(2).trim();
    if (parentSection) {
      const sectionSize = getNodeSize(parentSection);
      if (sectionSize && (axis === 'x' || axis === 'y' || axis === 'z')) {
        const value = sectionSize[axis];
        console.log(`  📐 s:${axis} = ${value}м (${value*1000}мм)`);
        return value; // Уже в метрах
      } else {
        console.warn(`  ⚠️ Не удалось получить размер s:${axis} для секции`, parentSection.name);
      }
    } else {
      console.warn(`  ⚠️ parentSection не передан для вычисления s:${axis}`);
    }
    return 0;
  }
  
  // Группы: g:group.property (например, g:g0.thickness)
  if (exprTrimmed.startsWith('g:')) {
    const parts = exprTrimmed.substring(2).split('.');
    const groupName = parts[0]?.trim();
    const property = parts[1]?.trim();
    if (groupName && property && globalGroups[groupName] && globalGroups[groupName][property] !== undefined) {
      const value = globalGroups[groupName][property];
      console.log(`  📐 g:${groupName}.${property} = ${value}м (${value*1000}мм)`);
      return value; // В метрах
    } else {
      console.warn(`  ⚠️ Не найдено значение g:${groupName}.${property}`);
    }
    return 0;
  }
  
  // Переменные: v:variable_name
  if (exprTrimmed.startsWith('v:')) {
    const varName = exprTrimmed.substring(2).trim();
    if (globalVariables[varName] !== undefined) {
      return globalVariables[varName]; // В метрах
    }
    // Проверяем контекст
    if (context && context[varName] !== undefined) {
      return context[varName];
    }
    return 0;
  }
  
  // Математические операции с правильным приоритетом
  // Порядок операций: * и / (высший приоритет), затем + и - (низший приоритет)
  // Поддерживаем: +, -, *, /
  
  // Сначала обрабатываем умножение и деление (высший приоритет)
  // Ищем самый правый оператор * или / (обрабатываем слева направо, но берем последний)
  let lastMulDivIndex = -1;
  let lastMulDivOp = '';
  for (let i = exprTrimmed.length - 1; i >= 0; i--) {
    const char = exprTrimmed[i];
    if ((char === '*' || char === '/') && i > 0 && exprTrimmed[i - 1] !== ':') {
      lastMulDivIndex = i;
      lastMulDivOp = char;
      break; // Берем самый правый оператор
    }
  }
  
  // Если есть умножение/деление, обрабатываем его
  if (lastMulDivIndex >= 0) {
    const left = exprTrimmed.substring(0, lastMulDivIndex).trim();
    const right = exprTrimmed.substring(lastMulDivIndex + 1).trim();
    const leftVal = evaluateExpression(left, parentSection, context);
    const rightVal = evaluateExpression(right, parentSection, context);
    const result = lastMulDivOp === '*' ? leftVal * rightVal : (rightVal === 0 ? 0 : leftVal / rightVal);
    if (rightVal === 0 && lastMulDivOp === '/') {
      console.warn('⚠️ Деление на ноль в выражении:', exprTrimmed);
    }
    return result;
  }
  
  // Затем обрабатываем сложение и вычитание (низший приоритет)
  // Ищем самый правый оператор + или - (чтобы правильно обработать левую ассоциативность)
  let lastAddSubIndex = -1;
  let lastAddSubOp = '';
  for (let i = exprTrimmed.length - 1; i >= 0; i--) {
    const char = exprTrimmed[i];
    if ((char === '+' || char === '-') && i > 0 && exprTrimmed[i - 1] !== ':') {
      lastAddSubIndex = i;
      lastAddSubOp = char;
      break; // Берем самый правый оператор
    }
  }
  
  if (lastAddSubIndex >= 0) {
    const left = exprTrimmed.substring(0, lastAddSubIndex).trim();
    const right = exprTrimmed.substring(lastAddSubIndex + 1).trim();
    const leftVal = evaluateExpression(left, parentSection, context);
    const rightVal = evaluateExpression(right, parentSection, context);
    return lastAddSubOp === '+' ? leftVal + rightVal : leftVal - rightVal;
  }
  
  // Попытка распарсить как число (если строка содержит только число)
  const num = parseFloat(exprTrimmed);
  if (!isNaN(num)) {
    // Если число большое (>= 10), считаем что это в миллиметрах, иначе в метрах
    // Это эвристика для обратной совместимости
    return num >= 10 ? num / 1000 : num;
  }
  
  // Если не удалось распарсить, возвращаем 0
  console.warn('Не удалось вычислить выражение:', exprTrimmed);
  return 0;
}

// Получить толщину детали из её метаданных
function getDetailThickness(detailNode: SceneNode): number {
  return detailNode.metadata?.material?.thickness || 0.016; // По умолчанию 16мм
}

// Заглушки для отсутствующих функций (чтобы проект запускался без ошибок)
function createPart(parentNode: SceneNode, type: 'wall' | 'bottom' | 'top' | 'back', name: string) {
  console.warn('⚠️ Функция createPart не реализована. Тип:', type, 'Имя:', name);
  alert(`Функция создания элемента "${type}" (${name}) пока не реализована`);
}

function createSubElement(parentNode: SceneNode, type: 'groove' | 'confirmat' | 'facade', name: string) {
  console.warn('⚠️ Функция createSubElement не реализована. Тип:', type, 'Имя:', name);
  alert(`Функция создания подэлемента "${type}" (${name}) пока не реализована`);
}

function loadGLBFile(file: File, parentNode: SceneNode, name: string) {
  console.warn('⚠️ Функция loadGLBFile не реализована');
  alert('Функция загрузки GLB файла пока не реализована');
}

function openHardwareModal() {
  console.warn('⚠️ Функция openHardwareModal не реализована');
  alert('Модальное окно фурнитуры пока не реализовано');
}

function openTypesManagementModal() {
  console.warn('⚠️ Функция openTypesManagementModal не реализована');
  alert('Модальное окно управления типами пока не реализовано');
}

// ⭐ РЕФЕРЕНС: _build_children() - создает детали из JSON структуры (как в Clodis)
// ⭐ ЭТАП 2: Читает из userData.params.children (приоритет) или metadata.childrenData (fallback)
function _build_children(sectionNode: SceneNode) {
  if (!sectionNode.metadata) {
    sectionNode.metadata = {};
  }
  
  // ⭐ ЭТАП 2: Используем новую функцию getChildrenData (читает из params.children или childrenData)
  const childrenData = getChildrenData(sectionNode);
  if (childrenData.length === 0) {
    console.log('🔍 [_build_children] Нет детей для создания в секции:', sectionNode.name);
    return;
  }
  
  console.log('🔨 [_build_children] Начинаем пересборку детей для секции:', sectionNode.name, 'Детей:', childrenData.length);
  console.log('  📍 Источник данных:', sectionNode.group.userData?.params?.children ? 'userData.params.children' : 'metadata.childrenData (fallback)');
  
  // ⭐ РЕФЕРЕНС: Очищаем own_object (аналог _reset в референсе)
  const parentOwnObject = sectionNode.metadata?.own_object;
  if (parentOwnObject) {
    // ⭐ ВАЖНО: Создаем список ID деталей, которые должны остаться (из childrenData)
    // ⭐ ЭТАП 2: childrenData может быть в формате Clodis (params.children) или нашем (childrenData)
    const validDetailIds = new Set(childrenData.map((cd: any) => cd.id).filter((id: any) => id != null));
    
    // ⭐ ВАЖНО: Удаляем ВСЕ детали из own_object, которые не в childrenData
    // Это гарантирует удаление деталей, даже если они уже удалены из sectionNode.children
    const childrenToRemove: SceneNode[] = [];
    
    // Сначала собираем все детали из sectionNode.children
    sectionNode.children.filter(child => child.type === 'detail').forEach(child => {
      if (!validDetailIds.has(child.id)) {
        childrenToRemove.push(child);
      }
    });
    
    // ⭐ КРИТИЧЕСКИ ВАЖНО: Также проверяем own_object напрямую - могут быть детали, 
    // которые уже удалены из children, но остались в own_object
    parentOwnObject.children.forEach((obj: THREE.Object3D) => {
      // Проверяем, является ли это группой детали (имеет userData.nodeId или является detailGroup)
      const nodeId = (obj as any).userData?.nodeId;
      if (nodeId && !validDetailIds.has(nodeId)) {
        // Находим SceneNode по ID
        const detailNode = sceneNodes.find(n => n.id === nodeId && n.type === 'detail');
        if (detailNode && !childrenToRemove.includes(detailNode)) {
          childrenToRemove.push(detailNode);
          console.log('🔍 [_build_children] Найдена деталь в own_object, которой нет в childrenData:', detailNode.name, detailNode.id);
        }
      }
    });
    
    // Удаляем найденные детали
    childrenToRemove.forEach(child => {
      // Удаляем из own_object
      if (parentOwnObject.children.includes(child.group)) {
        parentOwnObject.remove(child.group);
        console.log('  🗑️ Удалена деталь из parentOwnObject:', child.name, child.id);
      }
      // Удаляем из sceneNodes
      const index = sceneNodes.indexOf(child);
      if (index !== -1) {
        sceneNodes.splice(index, 1);
        console.log('  🗑️ Удалена деталь из sceneNodes:', child.name, child.id);
      }
      // Очищаем геометрию
      child.group.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach(mm => mm.dispose());
          } else {
            m.material.dispose();
          }
        }
      });
    });
    
    // Очищаем массив children - оставляем только те детали, которые в childrenData
    sectionNode.children = sectionNode.children.filter(child => {
      if (child.type === 'detail') {
        return validDetailIds.has(child.id);
      }
      return true; // Оставляем не-детали (секции и т.д.)
    });
    
    console.log('🧹 [_build_children] Старые детали удалены из own_object и sceneNodes. Удалено:', childrenToRemove.length);
  }
  
  // ⭐ РЕФЕРЕНС: Создаем детали из JSON через createDetailClodis (строго по референсу Clodis)
  childrenData.forEach((childData: any) => {
    try {
      // ⭐ Определяем формат данных (Clodis или наш)
      let detailTypeId: string | undefined;
      let materialId: string;
      let name: string;
      
      if (childData._detailTypeId || childData.detailTypeId) {
        // Наш формат (childrenData)
        detailTypeId = childData._detailTypeId || childData.detailTypeId;
        materialId = childData._materialId || childData.materialId || 'ldsp16';
        name = childData.name || 'Деталь';
      } else if (childData.type === 'wall' && childData.spec) {
        // Clodis формат (params.children) - детали имеют type='wall'
        detailTypeId = childData.spec.detailTypeId || 'vertical_left'; // Fallback
        materialId = childData.spec.material?.key || 'ldsp16';
        name = childData.name || 'Деталь';
      } else {
        console.error('❌ [_build_children] Неизвестный формат childData:', childData);
        return;
      }
      
      // Проверяем, что деталь еще не создана (по ID)
      const existingDetail = sceneNodes.find(n => n.id === childData.id && n.type === 'detail');
      if (existingDetail) {
        console.log('🔍 [_build_children] Деталь уже существует, пропускаем:', name, childData.id);
        return;
      }
      
      // ⭐ ИСПОЛЬЗУЕМ createDetailClodis() для создания детали строго по референсу
      // ⚠️ ВАЖНО: НЕ передаем pivot из childData - он будет установлен автоматически по detailTypeId
      
      // 🔍 КРИТИЧЕСКОЕ ЛОГИРОВАНИЕ для vertical_left
      if (detailTypeId === 'vertical_left') {
        console.log(`🔍 [_build_children] Создание vertical_left детали:`, {
          detailTypeId,
          name,
          childData_id: childData.id,
          childData_pivot: childData.pivot,
          childData_spec_pivot: childData.spec?.pivot,
          note: 'Pivot будет установлен автоматически в createDetailClodis как {x:-1, y:-1, z:-1}'
        });
      }
      
      const clodisParams: any = {
        materialId: materialId, // materialId как string
        id: childData.id, // Передаем существующий ID из JSON
      };
      
      // Передаем Clodis параметры, но ИСКЛЮЧАЕМ pivot (он будет установлен автоматически)
      if (childData.spec) {
        const { pivot, ...specWithoutPivot } = childData.spec;
        Object.assign(clodisParams, specWithoutPivot);
        
        // 🔍 ЛОГИРОВАНИЕ: проверяем, что pivot исключен
        if (detailTypeId === 'vertical_left' && childData.spec.pivot) {
          console.log(`🔍 [_build_children] vertical_left - pivot ИСКЛЮЧЕН из spec:`, {
            был_в_spec: childData.spec.pivot,
            будет_установлен_автоматически: '{x:-1, y:-1, z:-1}'
          });
        }
      }
      if (childData.expressions) {
        const { pivot, ...expressionsWithoutPivot } = childData.expressions;
        Object.assign(clodisParams, expressionsWithoutPivot);
      }
      
      // 🔍 ЛОГИРОВАНИЕ перед вызовом createDetailClodis
      if (detailTypeId === 'vertical_left') {
        console.log(`🔍 [_build_children] Вызов createDetailClodis для vertical_left:`, {
          sectionNode: sectionNode.name,
          detailTypeId,
          name,
          clodisParams: { ...clodisParams, pivot: 'БУДЕТ УСТАНОВЛЕН АВТОМАТИЧЕСКИ' }
        });
      }
      
      const detailNode = createDetailClodis(
        sectionNode,
        detailTypeId,
        name,
        clodisParams
      );
      
      if (!detailNode) {
        console.error('❌ [_build_children] Не удалось создать деталь через createDetailClodis:', detailTypeId, name);
      } else if (detailTypeId === 'vertical_left') {
        console.log(`✅ [_build_children] vertical_left деталь создана:`, {
          name: detailNode.name,
          id: detailNode.id,
          note: 'Проверьте логи createDetailClodis выше для pivot'
        });
      }
    } catch (error) {
      console.error('❌ [_build_children] Ошибка при создании детали из JSON:', error, childData);
    }
  });
  
  console.log('✅ [_build_children] Пересборка детей завершена для секции:', sectionNode.name);
  renderHierarchy();
}

/**
 * ⭐ ЭТАП 3: Единый цикл пересборки секции (упрощённый аналог CabinetSection._build/_rebuild)
 *
 * Референс: main_core_v2_part18.js
 * При изменении размеров родителя: _rebuild() → _build_children() → _build() → _build_size()
 * _build_size() вычисляет размеры через comp2() с актуальным parent_size
 *
 * Сейчас он:
 * - пересобирает детей (детали) через _build_children
 * - пересчитывает размеры дочерних секций через _build_size() (как в референсе)
 */
function rebuildSection(sectionNode: SceneNode | null | undefined) {
  if (!sectionNode) {
    console.warn('[rebuildSection] Секция не передана');
    return;
  }

  console.log('🔁 [rebuildSection] Пересборка секции:', {
    id: sectionNode.id,
    name: sectionNode.name,
    type: sectionNode.type,
  });

  // Синхронизируем базовые поля в userData перед пересборкой (движемся к архитектуре референса)
  syncSceneNodeToUserData(sectionNode);

  // ⭐ РЕФЕРЕНС: Пересчитываем размеры дочерних секций через _build_size() (как в референсе)
  // Референс: _rebuild() → _build() → _build_size() для дочерних секций
  // Это нужно делать ДО _build_children, чтобы дочерние секции имели актуальные размеры
  const childSections = sectionNode.children.filter(child => child.type === 'section');
  if (childSections.length > 0) {
    console.log('🔁 [rebuildSection] Пересчет размеров дочерних секций через _build_size():', childSections.length);
    
    childSections.forEach(childSection => {
      // ⭐ РЕФЕРЕНС: _build_size() - вычисление размеров через comp2() с актуальным parent_size
      // Референс: main_core_v2_part18.js:2639-2646
      // f['size']['x'] = comp2(g['size']['x'], h) где h = f['c_object']
      
      // Берем выражения размеров из metadata
      const childSizeExpressions = childSection.metadata?.size_expressions || {
        x: 's:x',
        y: 's:y',
        z: 's:z'
      };
      
      // ⭐ ВАЖНО: Пересоздаем c_object с актуальными размерами родителя
      const c_object = createCObject(childSection.group, sectionNode, sectionNode, null);
      
      // Вычисляем размеры через comp2() (как в референсе _build_size)
      const computedX = comp2(childSizeExpressions.x, c_object);
      const computedY = comp2(childSizeExpressions.y, c_object);
      const computedZ = comp2(childSizeExpressions.z, c_object);
      
      const newChildWidth = Math.round(computedX);
      const newChildHeight = Math.round(computedY);
      const newChildDepth = Math.round(computedZ);
      
      console.log('🔁 [rebuildSection] _build_size() для дочерней секции:', {
        name: childSection.name,
        expressions: childSizeExpressions,
        computed_size: { x: newChildWidth, y: newChildHeight, z: newChildDepth },
        parent_size: c_object.parent_size,
      });
      
      // Обновляем metadata и userData.computed.size
      if (!childSection.metadata) childSection.metadata = {};
      childSection.metadata.size = { x: newChildWidth, y: newChildHeight, z: newChildDepth }; // В мм
      childSection.metadata.size_three = { 
        x: newChildWidth / 1000, 
        y: newChildHeight / 1000, 
        z: newChildDepth / 1000 
      }; // В метрах
      
      // ⭐ ВАЖНО: Обновляем userData.computed.size (как в референсе)
      if (!childSection.group.userData.computed) {
        childSection.group.userData.computed = {};
      }
      if (!childSection.group.userData.computed.size) {
        childSection.group.userData.computed.size = new THREE.Vector3();
      }
      childSection.group.userData.computed.size.set(newChildWidth, newChildHeight, newChildDepth); // В мм
      childSection.group.userData.computed.u_size = childSection.group.userData.computed.u_size || new THREE.Vector3();
      childSection.group.userData.computed.u_size.set(newChildWidth / 1000, newChildHeight / 1000, newChildDepth / 1000); // В метрах
      
      // ⭐ РЕФЕРЕНС: Получаем own_object и helpers из userData (как в референсе)
      // Референс: main_core_v2_part18.js:2576-2582
      // this['userData']['struct']['__own_object'] = own_object
      // this['userData']['helpers'] = helpers
      const childOwnObject = getOwnObject(childSection);
      const childHelpersGroup = getHelpers(childSection);
      
      if (childOwnObject && childHelpersGroup) {
        const newChildW = newChildWidth / 1000;
        const newChildH = newChildHeight / 1000;
        const newChildD = newChildDepth / 1000;
        
        // ⭐ РЕФЕРЕНС: _build_pivot() - пересчитываем pivot с новыми размерами
        // Референс: main_core_v2_part18.js:2658-2667
        const pivotX_mm = -(-1) * newChildWidth / 2; // = newChildWidth / 2
        const pivotY_mm = -(-1) * newChildHeight / 2; // = newChildHeight / 2
        const pivotZ_mm = -(-1) * newChildDepth / 2; // = newChildDepth / 2
        
        // Сбрасываем трансформации own_object и применяем pivot заново
        childOwnObject.position.set(0, 0, 0);
        childOwnObject.rotation.set(0, 0, 0);
        childOwnObject.scale.set(1, 1, 1);
        childOwnObject.translateX(pivotX_mm / 1000);
        childOwnObject.translateY(pivotY_mm / 1000);
        childOwnObject.translateZ(pivotZ_mm / 1000);
        
        // Обновляем куб
        const childCube = childHelpersGroup.children.find(c => 
          c.userData?.is_helper === true && (c as THREE.Mesh).isMesh
        ) as THREE.Mesh | undefined;
        
        if (childCube) {
          const oldGeometry = childCube.geometry;
          childCube.geometry = new THREE.BoxGeometry(newChildW, newChildH, newChildD);
          if (oldGeometry) oldGeometry.dispose();
          childCube.position.set(0, 0, 0);
        }
        
        // Обновляем edges
        const childEdges = childHelpersGroup.children.find(c => 
          c instanceof THREE.LineSegments && c.userData?.is_helper === true
        ) as THREE.LineSegments | undefined;
        
        if (childEdges) {
          const oldEdgesGeometry = childEdges.geometry;
          childEdges.geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(newChildW, newChildH, newChildD));
          if (oldEdgesGeometry) oldEdgesGeometry.dispose();
          childEdges.position.set(0, 0, 0);
        }
        
        // ⭐ ВАЖНО: helpers копируют позицию и поворот от own_object (как в референсе строка 2881-2882)
        childHelpersGroup.position.copy(childOwnObject.position);
        childHelpersGroup.rotation.copy(childOwnObject.rotation);
        
        // ⭐ ВАЖНО: Убеждаемся, что helpers видимы (как при создании)
        const childParams = childSection.group.userData?.params;
        if (childParams) {
          childHelpersGroup.visible = childParams.helpers_visible === 1;
        } else {
          childHelpersGroup.visible = true; // По умолчанию видимы для дочерних секций
        }
        
        childOwnObject.updateMatrixWorld(true);
        childHelpersGroup.updateMatrixWorld(true);
        childSection.group.updateMatrixWorld(true);
        
        console.log('✅ [rebuildSection] Геометрия дочерней секции обновлена:', {
          name: childSection.name,
          newSize: { x: newChildWidth, y: newChildHeight, z: newChildDepth },
          helpersVisible: childHelpersGroup.visible,
          helpersPosition: childHelpersGroup.position.clone()
        });
      } else {
        console.warn('⚠️ [rebuildSection] own_object или helpers не найдены для дочерней секции:', childSection.name);
      }
      
      // ⭐ РЕФЕРЕНС: Рекурсивно вызываем rebuildSection для дочерней секции (как _rebuild() в референсе)
      // Это пересоберёт всех детей дочерней секции с новыми размерами
      rebuildSection(childSection);
    });
  }

  // Пересобираем детей (детали) через _build_children
  _build_children(sectionNode);
  
  // ⭐ КОНСИСТЕНТНОСТЬ: Вызываем render() как в других местах кода (строки 1601, 1639)
  // Цикл анимации тоже рендерит, но явный вызов гарантирует немедленное отображение изменений
  render();
}

// ⭐ ПЕРЕПИСАНО С НУЛЯ ПО РЕФЕРЕНСУ: createDetailClodis() - создание детали строго по референсу Clodis
// Референс: main_core_v2_part18.js:2588-2613 (_build метод)
// Порядок этапов (СТРОГО!): _reset → _build_size → _build_pos → _build_rot → _build_scale → _build_pivot → _build_spec
function createDetailClodis(
  parentSection: SceneNode,
  detailTypeId: string,
  name: string,
  params?: {
    size?: { x: string | number; y: string | number; z: string | number };
    pos?: { x: string | number; y: string | number; z: string | number };
    pivot?: { x: ClodisPivot; y: ClodisPivot; z: ClodisPivot };
    rot?: { x: string | number; y: string | number; z: string | number };
    scale?: { x: string | number; y: string | number; z: string | number };
    materialId?: string;
    orientation?: 'v' | 'h' | 'f';
    id?: string;
  }
): SceneNode | null {
  const units = 1000; // Референс: units = 1000
  
  // ⭐ РЕФЕРЕНС: main_core_v2_part18.js:2588-2613 (_build метод)
  // Порядок этапов (СТРОГО!): _reset → _build_size → _build_pos → _build_rot → _build_scale → _build_pivot → _build_spec
  
  // Находим тип детали
  const detailType = detailTypes.find(dt => dt.id === detailTypeId);
  if (!detailType) {
    console.error('❌ [createDetailClodis] Тип детали не найден:', detailTypeId);
    return null;
  }
  
  // Материал
  const materialId = (params?.materialId as keyof typeof detailMaterials) || 'ldsp16';
  const material = detailMaterials[materialId];
  
  // ⭐ ЭТАП 1: _build_struct() - создание структуры детали
  // Референс: main_core_v2_part18.js:2576-2583
  const detailGroup = new THREE.Group();
  detailGroup.name = name;
  detailGroup.visible = true;
  
  const detailOwnObject = new THREE.Group();
  detailOwnObject.name = '__own_object';
  detailOwnObject.visible = true;
  detailGroup.add(detailOwnObject);
  
  // ⭐ РЕФЕРЕНС: main_core_v2_part18.js:2592 - this['_reset'](h) где h = own_object
  // Референс: main_core_v2_part18.js:2973-2974 - _reset устанавливает position.set(0,0,0) и rotation.set(0,0,0)
  detailOwnObject.position.set(0, 0, 0);
  detailOwnObject.rotation.set(0, 0, 0);
  detailOwnObject.scale.set(1, 1, 1);
  
  initUserDataStruct(detailGroup, detailOwnObject);
  initUserDataComputed(detailGroup);
  initUserDataParams(detailGroup);
  
  
  // ⭐ РЕФЕРЕНС: main_core_v2_part18.js:2594-2600 - порядок вызовов _build методов
  // _build_size() → _build_pos() → _build_rot() → _build_scale() → _build_pivot() → _build_spec()
  
  // Получаем размеры родительской секции
  const parentSize = getNodeSize(parentSection);
  if (!parentSize) {
    console.error('❌ [createDetailClodis] Не удалось получить размеры родительской секции');
    return null;
  }
  
  // Находим корневую секцию
  const rootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null) || null;
  
  // Создаем c_object для вычисления выражений
  const tempGroup = new THREE.Group();
  const c_object = createCObject(tempGroup, parentSection, rootSection, null);
  
  // Добавляем материалы в c_object
  if (!c_object.materials || !c_object.materials.g0) {
    if (!c_object.materials) c_object.materials = {};
    const thickness_mm = material.thickness * 1000;
    c_object.materials.g0 = { thickness: thickness_mm };
  }
  
  // Определяем ориентацию детали
  const isFrontDetail = detailType.position === 'front-front' || detailType.position === 'front-middle' || detailType.position === 'back-front';
  let orientation: 'v' | 'h' | 'f';
  if (params?.orientation) {
    orientation = params.orientation;
  } else if (isFrontDetail) {
    orientation = 'f';
  } else if (detailType.orientation === 'vertical') {
    orientation = 'v';
  } else {
    orientation = 'h';
  }
  
  // ⭐ ЭТАП 1: _build_size() - Референс: main_core_v2_part18.js:2639-2646
  const defaultSizeParams =
    orientation === 'v' ? { x: 'g:g0.thickness', y: 's:y', z: 's:z' }
    : orientation === 'h' ? { x: 's:x', y: 'g:g0.thickness', z: 's:z' }
    : { x: 's:x', y: 's:y', z: 'g:g0.thickness' };
  
  const sizeParams = {
    x: params?.size?.x ?? detailType.expressions?.size?.x ?? defaultSizeParams.x,
    y: params?.size?.y ?? detailType.expressions?.size?.y ?? defaultSizeParams.y,
    z: params?.size?.z ?? detailType.expressions?.size?.z ?? defaultSizeParams.z
  };
  
  // Референс: f['size']['x'] = comp2(g['size']['x'], h)
  const computed = detailGroup.userData.computed;
  computed.size.set(
    comp2(sizeParams.x, c_object),
    comp2(sizeParams.y, c_object),
    comp2(sizeParams.z, c_object)
  );
  
  // Референс: f['u_size'] = f['size']['clone']()['divideScalar'](units)
  computed.u_size.set(computed.size.x / units, computed.size.y / units, computed.size.z / units);
  
  detailGroup.userData.params.size = sizeParams;
  computed.c_object = c_object;
  
  // realSize для геометрии (перестановка осей для горизонтальных)
  let realSize: { x: number; y: number; z: number };
  if (orientation === 'h') {
    realSize = { x: computed.size.x, y: computed.size.z, z: computed.size.y };
  } else {
    realSize = { x: computed.size.x, y: computed.size.y, z: computed.size.z };
  }
  
  // ⭐ ЭТАП 2: _build_pos() - Референс: main_core_v2_part18.js:2648-2655
  const defaultPosParams = { x: '0', y: '0', z: '0' };
  const posParams = {
    x: params?.pos?.x ?? detailType.expressions?.pos?.x ?? defaultPosParams.x,
    y: params?.pos?.y ?? detailType.expressions?.pos?.y ?? defaultPosParams.y,
    z: params?.pos?.z ?? detailType.expressions?.pos?.z ?? defaultPosParams.z
  };
  
  // Референс: f['pos']['x'] = comp2(g['pos']['x'], h)
  let posX_mm = comp2(posParams.x, c_object);
  let posY_mm = comp2(posParams.y, c_object);
  let posZ_mm = comp2(posParams.z, c_object);
  
  // Референс: main_core_v2_part19.js:3658 - для горизонтальных pos.x = 0
  if (orientation === 'h') {
    posX_mm = 0;
  }
  if (orientation === 'v') {
    posY_mm = 0;
  }
  
  computed.pos.set(posX_mm, posY_mm, posZ_mm);
  detailGroup.userData.params.pos = posParams;
  
  // ⭐ РЕФЕРЕНС строка 2655: Для детали (не root) используется parent_size для позиционирования
  // Референс: this['position']['set']((-h['parent_size']['x'] / 0x2 + f['pos']['x']) / units, (-h['parent_size']['y'] / 0x2 + f['pos']['y']) / units, (-h['parent_size']['z'] / 0x2 + f['pos']['z']) / units)
  // ⚠️ ВАЖНО: В референсе деталь позиционируется относительно parent_size (размер родительской секции), не root_size
  // Это означает:
  // - Деталь в корневой секции: позиция относительно размера корневой секции
  // - Деталь в дочерней секции: позиция относительно размера дочерней секции
  // Pivot всегда относительно размера самой детали (строка 2662-2664), поэтому pivot будет в одинаковом месте относительно детали в обоих случаях
  const parentSize_mm = c_object.parent_size as THREE.Vector3;
  detailGroup.position.set(
    (-parentSize_mm.x / 2 + posX_mm) / units,
    (-parentSize_mm.y / 2 + posY_mm) / units,
    (-parentSize_mm.z / 2 + posZ_mm) / units
  );
  
  // ⭐ ЭТАП 3: _build_rot() - Референс: main_core_v2_part18.js:2669-2678
  const defaultRotParams = {
    x: orientation === 'h' ? '90' : '0',
    y: '0',
    z: '0'
  };
  
  const rotParams = {
    x: params?.rot?.x ?? defaultRotParams.x,
    y: params?.rot?.y ?? defaultRotParams.y,
    z: params?.rot?.z ?? defaultRotParams.z
  };
  
  const rotX = comp2(rotParams.x, c_object);
  const rotY = comp2(rotParams.y, c_object);
  const rotZ = comp2(rotParams.z, c_object);
  
  computed.rot.set(rotX, rotY, rotZ);
  detailGroup.userData.params.rot = rotParams;
  
  // Референс: h['rotation']['set'](0x0, 0x0, 0x0), h['rotateX'](-deg2rad(k))
  detailOwnObject.rotation.set(0, 0, 0);
  detailOwnObject.rotateX(-THREE.MathUtils.degToRad(rotX));
  detailOwnObject.rotateY(-THREE.MathUtils.degToRad(rotY));
  detailOwnObject.rotateZ(-THREE.MathUtils.degToRad(rotZ));
  
  // ⭐ ЭТАП 4: _build_scale() - Референс: main_core_v2_part18.js:2679-2685
  const defaultScaleParams = { x: '1', y: '1', z: '1' };
  const scaleParams = {
    x: params?.scale?.x ?? defaultScaleParams.x,
    y: params?.scale?.y ?? defaultScaleParams.y,
    z: params?.scale?.z ?? defaultScaleParams.z
  };
  
  const scaleX = comp2(scaleParams.x, c_object);
  const scaleY = comp2(scaleParams.y, c_object);
  const scaleZ = comp2(scaleParams.z, c_object);
  
  computed.scale.set(scaleX, scaleY, scaleZ);
  detailGroup.userData.params.scale = scaleParams;
  
  // Референс: h['scale']['set'](k, l, g)
  detailOwnObject.scale.set(scaleX, scaleY, scaleZ);
  
  // ⭐ ЭТАП 5: _build_pivot() - Референс: main_core_v2_part18.js:2658-2667
  let pivotNum: { x: ClodisPivot; y: ClodisPivot; z: ClodisPivot };
  
  // ⚠️ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Игнорируем pivot из params для vertical_left - всегда используем правильный pivot
  // Референс: pivot должен быть {x:-1, y:-1, z:-1} для нижнего левого дальнего угла
  if (params?.pivot && detailTypeId !== 'vertical_left') {
    pivotNum = params.pivot;
  } else {
    if (detailType.position === 'horizontal-top') {
      pivotNum = { x: -1, y: 1, z: -1 };
    } else if (detailType.position === 'horizontal-bottom') {
      pivotNum = { x: -1, y: -1, z: -1 };
    } else if (detailType.position === 'horizontal-middle') {
      pivotNum = { x: -1, y: 0, z: -1 };
    } else if (detailType.position === 'vertical-left') {
      // ⭐ РЕФЕРЕНС: Нижняя левая дальняя точка детали (bottom-left-far)
      // Реф.: main_core_v2_part — default pivot для деталей
      // Для вертикальной левой: x=-1 (левый край), y=-1 (низ), z=-1 (дальний край)
      pivotNum = { x: -1, y: -1, z: -1 };
    } else if (detailType.position === 'vertical-right') {
      pivotNum = { x: 1, y: -1, z: -1 };
    } else if (detailType.position === 'vertical-middle') {
      pivotNum = { x: 0, y: -1, z: -1 };
    } else if (detailType.position === 'front-front') {
      pivotNum = { x: -1, y: -1, z: 1 };
    } else if (detailType.position === 'front-middle') {
      pivotNum = { x: -1, y: -1, z: 0 };
    } else {
      pivotNum = { x: -1, y: -1, z: -1 };
    }
  }
  
  detailGroup.userData.params.pivot = pivotNum;
  
  // 🔍 КРИТИЧЕСКОЕ ЛОГИРОВАНИЕ для vertical_left
  if (detailTypeId === 'vertical_left') {
    console.log(`🔍 [createDetailClodis] vertical_left - PIVOT УСТАНОВЛЕН:`, {
      pivot: pivotNum,
      pivot_x: pivotNum.x,
      pivot_y: pivotNum.y,
      pivot_z: pivotNum.z,
      detail_size_mm: {
        x: computed.size.x,
        y: computed.size.y,
        z: computed.size.z
      },
      note: 'Pivot должен быть {x:-1, y:-1, z:-1} для нижнего левого дальнего угла'
    });
  }
  
  // Референс: j = conv_pivot(g['pivot']['x'], f['size']['x'])
  const pivotX_mm = conv_pivot(pivotNum.x, computed.size.x);
  const pivotY_mm = conv_pivot(pivotNum.y, computed.size.y);
  const pivotZ_mm = conv_pivot(pivotNum.z, computed.size.z);
  
  // 🔍 ЛОГИРОВАНИЕ pivot offset для vertical_left
  if (detailTypeId === 'vertical_left') {
    console.log(`🔍 [createDetailClodis] vertical_left - PIVOT OFFSET вычислен:`, {
      pivotOffset_mm: { x: pivotX_mm, y: pivotY_mm, z: pivotZ_mm },
      pivotOffset_meters: {
        x: (pivotX_mm / units).toFixed(4),
        y: (pivotY_mm / units).toFixed(4),
        z: (pivotZ_mm / units).toFixed(4)
      },
      detail_size_mm: computed.size,
      note: 'Это смещение, которое будет применено к detailOwnObject через translateX/Y/Z'
    });
  }
  
  // Референс: h['translateX'](j / units), h['translateY'](k / units), h['translateZ'](g / units)
  detailOwnObject['translateX'](pivotX_mm / units);
  detailOwnObject['translateY'](pivotY_mm / units);
  detailOwnObject['translateZ'](pivotZ_mm / units);
  
  detailGroup.userData.pivotOffset_mm = { x: pivotX_mm, y: pivotY_mm, z: pivotZ_mm };
  
  // ⭐ ЭТАП 6: _build_spec() - Референс: main_core_v2_part18.js:2600
  const width = realSize.x / units;
  const height = realSize.y / units;
  const depth = realSize.z / units;
  
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshStandardMaterial({
    color: material.color,
    metalness: 0.1,
    roughness: 0.6,
  });
  
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  mesh.visible = true;
  mesh.position.set(0, 0, 0);
  detailOwnObject.add(mesh);

  // Добавляем тонкий контур по рёбрам детали, чтобы лучше читалась форма
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0x555555,
    linewidth: 1,
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.name = `${name}_edges`;
  edges.userData.isDetailEdges = true;
  detailOwnObject.add(edges);
  
  mesh.userData.isDetail = true;
  mesh.userData.detailType = 'detail';
  mesh.userData.detailName = name;
  mesh.userData.orientation = orientation;
  mesh.userData.materialId = materialId;
  
  detailGroup.userData.isDetail = true;
  detailGroup.userData.materialId = materialId;
  
  // Добавление в иерархию
  let parentOwnObject: THREE.Group | null = null;
  if (parentSection.group.userData?.struct?.['__own_object']) {
    parentOwnObject = parentSection.group.userData.struct['__own_object'] as THREE.Group;
  } else if (parentSection.metadata?.own_object) {
    parentOwnObject = parentSection.metadata.own_object as THREE.Group;
    } else {
    parentOwnObject = parentSection.group.getObjectByName('__own_object') as THREE.Group | null;
  }
  
  if (!parentOwnObject) {
    parentOwnObject = new THREE.Group();
    parentOwnObject.name = '__own_object';
    parentSection.group.add(parentOwnObject);
    if (!parentSection.group.userData.struct) {
      parentSection.group.userData.struct = {};
    }
    parentSection.group.userData.struct['__own_object'] = parentOwnObject;
  }
  
  const detailNode: SceneNode = {
    id: params?.id || generateId(),
    name: name,
    type: 'detail',
    group: detailGroup,
    children: [],
    parent: parentSection,
    expanded: false,
    orientation: orientation,
    position: detailType.position,
    metadata: {
      detailTypeId: detailTypeId,
      materialId: materialId,
      size: { x: width, y: height, z: depth },
      size_mm: realSize
    }
  };
  
  sceneNodes.push(detailNode);
  addChildNode(parentSection, detailNode);
  detailGroup.updateMatrixWorld(true);
  createOrUpdateDetailAxesOnSection(detailNode, parentSection, detailGroup);
  
  return detailNode;
}

/**
 * ⭐ ЭТАП 6: make_cube() - создание куба для helpers (1 В 1 С РЕФЕРЕНСОМ)
 * Референс: main_core_v2_part16.js:1231-1233
 * 
 * @param width - Ширина в метрах
 * @param height - Высота в метрах
 * @param depth - Глубина в метрах
 * @param material - Материал (опционально, используется из pp.three.materials.helper_cube если доступен)
 * @returns THREE.Mesh с BoxGeometry
 */
function make_cube(width: number, height: number, depth: number, material?: THREE.Material): THREE.Mesh {
  // Референс: new THREE['Mesh'](new THREE['BoxBufferGeometry'](f,g,h),i)
  // Используем BoxGeometry (современный аналог BoxBufferGeometry)
  const geometry = new THREE.BoxGeometry(width, height, depth);
  
  // Используем материал из pp.three.materials.helper_cube если доступен, иначе создаем дефолтный
  let cubeMaterial: THREE.Material;
  let materialSource = 'unknown';
  
  console.log('🔍 [make_cube] ВХОДНЫЕ ПАРАМЕТРЫ:', {
    width,
    height,
    depth,
    material_provided: !!material,
    material_color: material ? ((material as any).color?.getHex ? (material as any).color.getHex() : (material as any).color) : null,
    material_opacity: (material as any)?.opacity,
    pp_exists: !!(typeof window !== 'undefined' && (window as any).pp),
    pp_three_exists: !!(typeof window !== 'undefined' && (window as any).pp?.three),
    pp_three_materials_exists: !!(typeof window !== 'undefined' && (window as any).pp?.three?.materials),
    pp_three_materials_helper_cube_exists: !!(typeof window !== 'undefined' && (window as any).pp?.three?.materials?.helper_cube),
    pp_three_materials_helper_cube: (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.helper_cube) ? {
      color: ((window as any).pp.three.materials.helper_cube.color?.getHex ? (window as any).pp.three.materials.helper_cube.color.getHex() : (window as any).pp.three.materials.helper_cube.color),
      opacity: (window as any).pp.three.materials.helper_cube.opacity,
    } : null,
  });
  
  if (material) {
    cubeMaterial = material;
    materialSource = 'переданный параметр';
    console.log('🎨 [make_cube] Используем материал из параметра:', {
      material,
      color: ((material as any).color?.getHex ? (material as any).color.getHex() : (material as any).color),
      opacity: (material as any).opacity,
    });
  } else if (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.helper_cube) {
    cubeMaterial = (window as any).pp.three.materials.helper_cube;
    materialSource = 'pp.three.materials.helper_cube';
    console.log('🎨 [make_cube] Используем материал из pp.three.materials.helper_cube:', {
      material: cubeMaterial,
      color: ((cubeMaterial as any).color?.getHex ? (cubeMaterial as any).color.getHex() : (cubeMaterial as any).color),
      opacity: (cubeMaterial as any).opacity,
    });
    } else {
    // Дефолтный материал для helper cube
    cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00, // ⭐ ВРЕМЕННО: зеленый цвет для проверки (было 0x66ccff)
      transparent: true,
      opacity: 0.1, // ⭐ ИЗМЕНЕНО: очень прозрачная (было 0.6)
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
    });
    materialSource = 'дефолтный (зеленый)';
    console.log('🎨 [make_cube] Используем ДЕФОЛТНЫЙ материал (зеленый):', {
      color: (cubeMaterial as THREE.MeshStandardMaterial).color.getHex(),
      opacity: (cubeMaterial as THREE.MeshStandardMaterial).opacity,
      source: materialSource
    });
  }
  
  const finalColor = (cubeMaterial as any).color?.getHex ? (cubeMaterial as any).color.getHex() : (cubeMaterial as any).color;
  console.log('🎨 [make_cube] ИТОГОВЫЙ материал:', {
    source: materialSource,
    color_decimal: finalColor,
    color_hex: '0x' + finalColor?.toString(16),
    opacity: (cubeMaterial as THREE.MeshStandardMaterial).opacity,
    transparent: (cubeMaterial as THREE.MeshStandardMaterial).transparent,
    material_type: cubeMaterial.type,
  });
  
  return new THREE.Mesh(geometry, cubeMaterial);
}

/**
 * ⭐ ЭТАП 6: make_edges() - создание ребер для helpers (1 В 1 С РЕФЕРЕНСОМ)
 * Референс: main_core_v2_part16.js:1234-1241
 * 
 * @param width - Ширина в метрах
 * @param height - Высота в метрах
 * @param depth - Глубина в метрах
 * @param material - Материал (опционально, используется из pp.three.materials.basic_line если доступен)
 * @returns THREE.LineSegments с EdgesGeometry
 */
function make_edges(width: number, height: number, depth: number, material?: THREE.Material): THREE.LineSegments {
  // Референс: new THREE['LineSegments'](new THREE['EdgesGeometry'](new THREE['BoxGeometry'](f,g,h)),i)
  const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
  
  // Используем материал из pp.three.materials.basic_line если доступен, иначе создаем дефолтный
  let edgesMaterial: THREE.Material;
  if (material) {
    edgesMaterial = material;
  } else if (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.basic_line) {
    edgesMaterial = (window as any).pp.three.materials.basic_line;
  } else {
    // Дефолтный материал для edges
    edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000, // Черный цвет
      linewidth: 1,
      depthTest: true,
    });
  }
  
  const edges = new THREE.LineSegments(geometry, edgesMaterial);
  // Референс: f['computeLineDistances']()
  edges.computeLineDistances();
  return edges;
}

/**
 * ⭐ ЭТАП 7: buildSpecGeometry() - создание геометрии для детали через _build_spec() (1 В 1 С РЕФЕРЕНСОМ)
 * Референс: main_core_v2_part19.js:4769+
 * 
 * @param params - Параметры детали (userData.params)
 * @param computed - Вычисленные значения (userData.computed)
 * @param width - Ширина в метрах (real_size.x)
 * @param height - Высота в метрах (real_size.y)
 * @param depth - Глубина в метрах (real_size.z)
 * @returns THREE.BufferGeometry для mesh
 */
function buildSpecGeometry(
  params: any,
  computed: any,
  width: number,
  height: number,
  depth: number
): THREE.BufferGeometry {
  // Референс: let q = this['userData']['params'], B = this['userData']['computed'], C = B['c_object']
  const spec = params.spec;
  const c_object = computed.c_object;
  
  // Если spec не задан или type не задан, используем простой BoxGeometry
  if (!spec || !spec.type) {
    return new THREE.BoxGeometry(width, height, depth);
  }
  
  // Референс: this['userData']['butts_info'] = {}
  computed.butts_info = {};
  
  // Референс: var I = B['u_real_size']['z'], J, K, L, L, O, P;
  // Референс: let {cbl: Q=0x0, cbr: R=0x0, ctl: S=0x0, ctr: T=0x0, d1: U=0x0, d2: W=0x0, ...} = q['spec']['type_params'];
  const typeParams = spec.type_params || {};
  
  // Вычисляем параметры через comp2() (референс строка 4774-4785)
  const cbl = comp2(typeParams.cbl || '0', c_object);
  const cbr = comp2(typeParams.cbr || '0', c_object);
  const ctl = comp2(typeParams.ctl || '0', c_object);
  const ctr = comp2(typeParams.ctr || '0', c_object);
  const d1 = comp2(typeParams.d1 || '0', c_object);
  const d2 = comp2(typeParams.d2 || '0', c_object);
  const w1 = comp2(typeParams.w1 || '0', c_object);
  const h1 = comp2(typeParams.h1 || '0', c_object);
  const w2 = comp2(typeParams.w2 || '0', c_object);
  const h2 = comp2(typeParams.h2 || '0', c_object);
  const o = typeParams.o || '';
  const r = comp2(typeParams.r || '0', c_object);
  const r_concave = comp2(typeParams.r_concave || '0', c_object);
  
  // Конвертируем размеры в метры для точек
  const realSizeX = width; // уже в метрах
  const realSizeY = height; // уже в метрах
  const realSizeZ = depth; // уже в метрах
  
  // Конвертируем параметры из мм в метры
  const cbl_m = cbl / 1000;
  const cbr_m = cbr / 1000;
  const ctl_m = ctl / 1000;
  const ctr_m = ctr / 1000;
  const d1_m = d1 / 1000;
  const d2_m = d2 / 1000;
  const w1_m = w1 / 1000;
  const h1_m = h1 / 1000;
  const w2_m = w2 / 1000;
  const h2_m = h2 / 1000;
  const r_m = r / 1000;
  const r_concave_m = r_concave / 1000;
  
  let points: Array<{ x: number; y: number; radius?: number; dir?: boolean }> = [];
  
  // Референс: switch (q['spec']['type'])
  switch (spec.type) {
    case 'cut_corners':
      // Референс: строка 4788-4852
      // Создаем точки для cut_corners
      points = [];
      
      // Нижний левый угол (cbl)
      if (cbl_m > 0) {
        points.push({ x: 0, y: cbl_m, radius: 0 });
        points.push({ x: cbl_m, y: 0, radius: 0 });
      } else {
        points.push({ x: 0, y: 0, radius: 0 });
      }
      
      // Нижний правый угол (cbr)
      if (cbr_m > 0) {
        points.push({ x: realSizeX - cbr_m, y: 0, radius: 0 });
        points.push({ x: realSizeX, y: cbr_m, radius: 0 });
      } else {
        points.push({ x: realSizeX, y: 0, radius: 0 });
      }
      
      // Верхний правый угол (ctr)
      if (ctr_m > 0) {
        points.push({ x: realSizeX, y: realSizeY - ctr_m, radius: 0 });
        points.push({ x: realSizeX - ctr_m, y: realSizeY, radius: 0 });
      } else {
        points.push({ x: realSizeX, y: realSizeY, radius: 0 });
      }
      
      // Верхний левый угол (ctl)
      if (ctl_m > 0) {
        points.push({ x: ctl_m, y: realSizeY, radius: 0 });
        points.push({ x: 0, y: realSizeY - ctl_m, radius: 0 });
      } else {
        points.push({ x: 0, y: realSizeY, radius: 0 });
      }
      
      // Референс: B['original_points'] = B['points']['map'](...)
      computed.original_points = points.map(p => ({ ...p }));
      
      // ⭐ ЭТАП 8: _build_butts() и _get_butts_offsets() - поддержка кромок (1 В 1 С РЕФЕРЕНСОМ)
      // Референс: 0x0 < q['spec']['butts']['length'] && (this['_build_butts'](), this['_get_butts_offsets']())
      if (spec.butts && spec.butts.length > 0) {
        buildButts(params, computed, points, realSizeX, realSizeY);
        getButtsOffsets(params, computed);
      }
      
      // Референс: H = p_shapes['common'](B['points'])
      return createShapeGeometry(points, realSizeZ);
      
    case 'triangle':
      // Референс: строка 4853-4923
      points = [];
      
      // Референс: switch (q['spec']['type_params']['corner'])
      const corner = typeParams.corner || 'tr';
      
      switch (corner) {
        case 'tr': // top-right
          points = [
            { x: realSizeX, y: 0, radius: 0 },
            { x: realSizeX, y: realSizeY, radius: 0 },
            { x: 0, y: realSizeY, radius: 0 }
          ];
          break;
        case 'tl': // top-left
          points = [
            { x: 0, y: 0, radius: 0 },
            { x: realSizeX, y: realSizeY, radius: 0 },
            { x: 0, y: realSizeY, radius: 0 }
          ];
          break;
        case 'br': // bottom-right
          points = [
            { x: 0, y: 0, radius: 0 },
            { x: realSizeX, y: 0, radius: 0 },
            { x: realSizeX, y: realSizeY, radius: 0 }
          ];
          break;
        case 'bl': // bottom-left
          points = [
            { x: 0, y: 0, radius: 0 },
            { x: realSizeX, y: 0, radius: 0 },
            { x: 0, y: realSizeY, radius: 0 }
          ];
          break;
      }
      
      computed.original_points = points.map(p => ({ ...p }));
      
      // ⭐ ЭТАП 8: _build_butts() и _get_butts_offsets() - поддержка кромок (1 В 1 С РЕФЕРЕНСОМ)
      // Референс: 0x0 < q['spec']['butts']['length'] && (this['_build_butts'](), this['_get_butts_offsets']())
      if (spec.butts && spec.butts.length > 0) {
        buildButts(params, computed, points, realSizeX, realSizeY);
        getButtsOffsets(params, computed);
        // Используем обновленные points после применения offsets
        if (computed.points) {
          points = computed.points;
        }
      }
      
      return createShapeGeometry(points, realSizeZ);
      
    case 'l_shape':
    case 'c_l_shape':
      // Референс: строка 4978-5008+
      points = [];
      
      // Референс: switch (a3) где a3 = o (orientation)
      // orientation может быть: 'ctl', 'cbr', 'cbl', 'ctr' (corner-top-left, corner-bottom-right, и т.д.)
      const orientation = o || 'ctl';
      
      // Референс: W = d2 (глубина выреза), U = d1 (ширина выреза)
      // Референс: a4 = r (радиус внешнего угла), a5 = r_concave (радиус внутреннего угла)
      const d2_m = d2 / 1000; // W в метрах
      const d1_m = d1 / 1000; // U в метрах
      const r_m = r / 1000; // радиус внешнего угла
      const r_concave_m = r_concave / 1000; // радиус внутреннего угла
      
      switch (orientation) {
        case 'ctl': // corner-top-left (верхний левый угол)
          // Референс: строка 4980-5008
          points = [
            { x: 0, y: 0, radius: 0 },
            { x: realSizeX, y: 0, radius: 0 },
            { x: realSizeX, y: realSizeY, radius: 0 },
            { x: d2_m, y: realSizeY, radius: r_m, dir: true },
            { x: d2_m, y: realSizeY - d1_m, radius: r_concave_m, dir: false },
            { x: 0, y: realSizeY - d1_m, radius: r_m, dir: true }
          ];
          break;
          
        case 'cbr': // corner-bottom-right (нижний правый угол)
          points = [
            { x: 0, y: 0, radius: 0 },
            { x: realSizeX - d2_m, y: 0, radius: r_m, dir: true },
            { x: realSizeX - d2_m, y: d1_m, radius: r_concave_m, dir: false },
            { x: realSizeX, y: d1_m, radius: r_m, dir: true },
            { x: realSizeX, y: realSizeY, radius: 0 },
            { x: 0, y: realSizeY, radius: 0 }
          ];
          break;
          
        case 'cbl': // corner-bottom-left (нижний левый угол)
          points = [
            { x: d2_m, y: 0, radius: r_m, dir: true },
            { x: d2_m, y: d1_m, radius: r_concave_m, dir: false },
            { x: 0, y: d1_m, radius: r_m, dir: true },
            { x: 0, y: realSizeY, radius: 0 },
            { x: realSizeX, y: realSizeY, radius: 0 },
            { x: realSizeX, y: 0, radius: 0 }
          ];
          break;
          
        case 'ctr': // corner-top-right (верхний правый угол)
          points = [
            { x: 0, y: 0, radius: 0 },
            { x: realSizeX, y: 0, radius: 0 },
            { x: realSizeX, y: realSizeY - d1_m, radius: r_m, dir: true },
            { x: realSizeX - d2_m, y: realSizeY - d1_m, radius: r_concave_m, dir: false },
            { x: realSizeX - d2_m, y: realSizeY, radius: r_m, dir: true },
            { x: 0, y: realSizeY, radius: 0 }
          ];
          break;
          
        default:
          // Для неизвестной ориентации используем простой BoxGeometry
          console.warn(`⚠️ [buildSpecGeometry] Неизвестная ориентация для l_shape: ${orientation}, используется BoxGeometry`);
          return new THREE.BoxGeometry(width, height, depth);
      }
      
      computed.original_points = points.map(p => ({ ...p }));
      
      // ⭐ ЭТАП 8: _build_butts() и _get_butts_offsets() - поддержка кромок (1 В 1 С РЕФЕРЕНСОМ)
      // Референс: 0x0 < q['spec']['butts']['length'] && (this['_build_butts'](), this['_get_butts_offsets']())
      if (spec.butts && spec.butts.length > 0) {
        buildButts(params, computed, points, realSizeX, realSizeY);
        getButtsOffsets(params, computed);
        // Используем обновленные points после применения offsets
        if (computed.points) {
          points = computed.points;
        }
      }
      
      return createShapeGeometry(points, realSizeZ);
      
    default:
      // Для неизвестных типов используем простой BoxGeometry
      return new THREE.BoxGeometry(width, height, depth);
  }
}

/**
 * ⭐ ЭТАП 7: createShapeGeometry() - создание геометрии из точек (упрощенная версия p_shapes.common)
 * Референс: p_shapes.common() из Clodis
 * 
 * @param points - Массив точек { x, y, radius?, dir? }
 * @param depth - Глубина в метрах
 * @returns THREE.BufferGeometry
 */
function createShapeGeometry(
  points: Array<{ x: number; y: number; radius?: number; dir?: boolean }>,
  depth: number
): THREE.BufferGeometry {
  // Создаем форму (Shape) из точек
  const shape = new THREE.Shape();
  
  if (points.length === 0) {
    return new THREE.BoxGeometry(0.1, 0.1, depth);
  }
  
  // Начинаем с первой точки
  shape.moveTo(points[0].x, points[0].y);
  
  // Добавляем остальные точки
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const prevPoint = points[i - 1];
    
    if (point.radius && point.radius > 0) {
      // ⭐ ЭТАП 7: Поддержка скругленных углов (radius и dir)
      // dir: true = выпуклый угол (внешний), false = вогнутый угол (внутренний)
      // Для выпуклого угла используем quadraticCurveTo, для вогнутого - arc
      
      // Вычисляем точку изгиба (середина между prevPoint и point)
      const midX = (prevPoint.x + point.x) / 2;
      const midY = (prevPoint.y + point.y) / 2;
      
      // Вычисляем направление от prevPoint к point
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0 && point.radius > 0) {
        // Нормализуем направление
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Перпендикулярное направление (для смещения центра дуги)
        const perpX = -ny;
        const perpY = nx;
        
        if (point.dir === false) {
          // Вогнутый угол (внутренний) - смещаем центр дуги внутрь
          const centerX = midX + perpX * point.radius;
          const centerY = midY + perpY * point.radius;
          
          // Используем arc для вогнутого угла
          const startAngle = Math.atan2(prevPoint.y - centerY, prevPoint.x - centerX);
          const endAngle = Math.atan2(point.y - centerY, point.x - centerX);
          
          shape.absarc(centerX, centerY, point.radius, startAngle, endAngle, false);
        } else {
          // Выпуклый угол (внешний) - используем quadraticCurveTo
          const controlX = midX + perpX * point.radius;
          const controlY = midY + perpY * point.radius;
          
          shape.quadraticCurveTo(controlX, controlY, point.x, point.y);
        }
      } else {
        shape.lineTo(point.x, point.y);
      }
    } else {
      shape.lineTo(point.x, point.y);
    }
  }
  
  // Замыкаем форму
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  
  if (firstPoint.radius && firstPoint.radius > 0) {
    // Обрабатываем скругление между последней и первой точкой
    const midX = (lastPoint.x + firstPoint.x) / 2;
    const midY = (lastPoint.y + firstPoint.y) / 2;
    const dx = firstPoint.x - lastPoint.x;
    const dy = firstPoint.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0 && firstPoint.radius > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const perpX = -ny;
      const perpY = nx;
      
      if (firstPoint.dir === false) {
        const centerX = midX + perpX * firstPoint.radius;
        const centerY = midY + perpY * firstPoint.radius;
        const startAngle = Math.atan2(lastPoint.y - centerY, lastPoint.x - centerX);
        const endAngle = Math.atan2(firstPoint.y - centerY, firstPoint.x - centerX);
        shape.absarc(centerX, centerY, firstPoint.radius, startAngle, endAngle, false);
      } else {
        const controlX = midX + perpX * firstPoint.radius;
        const controlY = midY + perpY * firstPoint.radius;
        shape.quadraticCurveTo(controlX, controlY, firstPoint.x, firstPoint.y);
      }
    } else {
      shape.lineTo(firstPoint.x, firstPoint.y);
    }
  } else {
    shape.lineTo(firstPoint.x, firstPoint.y);
  }
  
  // Создаем экструдированную геометрию
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Вычисляет pivot offset (аналог conv_pivot из Clodis)
 * Референс: main_core_v2_part13.js строка 563-582
 * 
 * @param pivot - Значение pivot (-1, 0, 1)
 * @param size - Размер в миллиметрах
 * @returns Pivot offset в миллиметрах
 */
function conv_pivot(pivot: ClodisPivot | string, size: number): number {
  let pivotNum: number;
  
  // Если это строка, конвертируем в число
  if (typeof pivot === 'string') {
    switch (pivot) {
      case 'left':
      case 'bottom':
        pivotNum = -1;
        break;
      case 'right':
      case 'top':
        pivotNum = 1;
        break;
      case 'center':
        pivotNum = 0;
        break;
      default:
        pivotNum = parseFloat(pivot) || 0;
    }
  } else {
    pivotNum = pivot;
  }
  
  // Формула из референса: -f * g / 2
  return -pivotNum * size / 2;
}

// Создать толстые оси (в 4 раза толще стандартных)
function createThickAxesHelper(size: number): THREE.Group {
  const group = new THREE.Group();
  const radius = size * 0.02; // Толщина оси (2% от размера, что примерно в 4 раза толще стандартных)
  const length = size;
  
  // Ось X (красная)
  const xGeometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const xAxis = new THREE.Mesh(xGeometry, xMaterial);
  xAxis.rotation.z = -Math.PI / 2;
  xAxis.position.x = length / 2;
  group.add(xAxis);
  
  // Ось Y (зелёная)
  const yGeometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const yAxis = new THREE.Mesh(yGeometry, yMaterial);
  yAxis.position.y = length / 2;
  group.add(yAxis);
  
  // Ось Z (синяя)
  const zGeometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const zAxis = new THREE.Mesh(zGeometry, zMaterial);
  zAxis.rotation.x = Math.PI / 2;
  zAxis.position.z = length / 2;
  group.add(zAxis);
  
  return group;
}

/**
 * ⭐ ЭТАП 9: Создание/обновление axes helper на секции в точке привязки детали
 * Референс: Axes helper появляется на секции при добавлении/выделении детали, показывая точку привязки
 * 
 * @param detailNode - узел детали
 * @param parentSectionNode - узел родительской секции
 * @param detailGroup - группа детали (detailGroup) - для получения позиции точки привязки
 */
function createOrUpdateDetailAxesOnSection(
  detailNode: SceneNode,
  parentSectionNode: SceneNode,
  detailGroup: THREE.Group
) {
  
  if (!parentSectionNode || parentSectionNode.type !== 'section') {
    console.warn('⚠️ [createOrUpdateDetailAxesOnSection] Родительская секция не найдена:', {
      parentSectionNode: parentSectionNode,
      parentSectionNode_type: parentSectionNode?.type
    });
    return;
  }

  // Получаем own_object родительской секции (где должны быть axes)
  let parentOwnObject: THREE.Group | null = null;
  
  // ⚠️ ВАЖНО: Проверяем userData.struct (как в референсе)
  if (parentSectionNode.group.userData?.struct?.['__own_object']) {
    parentOwnObject = parentSectionNode.group.userData.struct['__own_object'] as THREE.Group;
  } else if (parentSectionNode.metadata?.own_object) {
    parentOwnObject = parentSectionNode.metadata.own_object as THREE.Group;
  } else {
    parentOwnObject = parentSectionNode.group.getObjectByName('__own_object') as THREE.Group | null;
  }

  if (!parentOwnObject) {
    console.warn('⚠️ [createOrUpdateDetailAxesOnSection] own_object родительской секции не найден:', {
      parentSectionNode_group: parentSectionNode.group,
      userData_struct: parentSectionNode.group.userData?.struct,
      metadata_own_object: parentSectionNode.metadata?.own_object,
      children_names: parentSectionNode.group.children.map(c => c.name)
    });
    return;
  }
  

  // Ищем существующий axes helper для этой детали
  const existingAxes = parentOwnObject.children.find(
    c => c.userData?.isAxes && c.userData?.detailId === detailNode.id
  ) as THREE.Group | undefined;

  // ⭐ ИСПРАВЛЕНО: Оранжевая точка должна быть на PIVOT ДЕТАЛИ в мировых координатах!
  // Референс: Оранжевая точка появляется на детали в точке pivot (после всех трансформаций)
  // Pivot детали находится в detailOwnObject после применения translateX/Y/Z
  // Нужно получить мировую позицию pivot детали и преобразовать в локальные координаты parentOwnObject
  
  const detailOwnObject = detailGroup.getObjectByName('__own_object') as THREE.Group | null;
  let attachmentPoint: THREE.Vector3;
  
  if (!detailOwnObject) {
    console.warn('⚠️ [createOrUpdateDetailAxesOnSection] detailOwnObject не найден, используем позицию detailGroup');
    attachmentPoint = detailGroup.position.clone();
  } else {
    // Обновляем матрицы для правильных трансформаций
    detailGroup.updateMatrixWorld(true);
    
    // Получаем pivot offset в миллиметрах
    const units = 1000;
    const pivotOffset_mm = detailGroup.userData.pivotOffset_mm || { x: 0, y: 0, z: 0 };
    
    // Pivot offset в локальных координатах detailOwnObject (в метрах)
    const pivotOffsetLocal = new THREE.Vector3(
      pivotOffset_mm.x / units,
      pivotOffset_mm.y / units,
      pivotOffset_mm.z / units
    );
    
    // Преобразуем pivot в мировые координаты
    const pivotWorldPos = new THREE.Vector3();
    detailOwnObject.localToWorld(pivotOffsetLocal, pivotWorldPos);
    
    // Преобразуем мировую позицию pivot в локальные координаты parentOwnObject
    parentOwnObject.updateMatrixWorld(true);
    attachmentPoint = new THREE.Vector3();
    parentOwnObject.worldToLocal(pivotWorldPos, attachmentPoint);
    
    // 🔍 ЛОГИРОВАНИЕ для отладки
    if (detailNode.metadata?.detailTypeId === 'vertical_left') {
      const parentSectionInfo = parentSectionNode ? {
        name: parentSectionNode.name,
        type: parentSectionNode.type,
        size: getNodeSize(parentSectionNode)
      } : null;
      
      console.log(`🔍 [createOrUpdateDetailAxesOnSection] vertical_left - PIVOT ДЕТАЛИ (оранжевая точка):`, {
        'parentSection': parentSectionInfo,
        'pivotOffset_mm': pivotOffset_mm,
        'pivotOffsetLocal (метры)': pivotOffsetLocal.clone(),
        'pivotWorldPos (метры)': pivotWorldPos.clone(),
        'attachmentPoint (локально в parentOwnObject, метры)': attachmentPoint.clone(),
        'attachmentPoint (мм)': {
          x: (attachmentPoint.x * units).toFixed(1),
          y: (attachmentPoint.y * units).toFixed(1),
          z: (attachmentPoint.z * units).toFixed(1)
        },
        'detailGroup.position': detailGroup.position.clone(),
        'note': 'Оранжевая точка на PIVOT детали (нижний левый дальний угол детали) в мировых координатах'
      });
    }
  }
  
  // Размер axes helper - 25% от максимального размера детали, но не меньше 0.05м (50мм)
  const detailSize = getNodeSize(detailNode) || { x: 0.2, y: 0.2, z: 0.2 };
  const maxDetailSize = Math.max(detailSize.x, detailSize.y, detailSize.z);
  const axesSize = Math.max(0.05, maxDetailSize * 0.25);

  // ⭐ СОЗДАНИЕ ОРАНЖЕВОЙ ТОЧКИ НАЧАЛА КООРДИНАТ (origin point) - как в референсе
  // Референс: Оранжевая точка появляется на детали в точке привязки (позиция detailGroup)
  // Создаем оранжевую сферу для визуализации точки начала координат детали
  const orangeOriginMarkerRadius = 0.01; // Радиус 10мм (в 2 раза меньше)
  const orangeOriginMarkerGeometry = new THREE.SphereGeometry(orangeOriginMarkerRadius, 16, 16);
  const orangeOriginMarkerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffa500, // ОРАНЖЕВЫЙ цвет (0xffa500 = orange)
    depthTest: false,
    transparent: false // Непрозрачный для лучшей видимости
  });
  const orangeOriginMarker = new THREE.Mesh(orangeOriginMarkerGeometry, orangeOriginMarkerMaterial);
  
  orangeOriginMarker.position.copy(attachmentPoint);
  orangeOriginMarker.userData.isOriginMarker = true;
  orangeOriginMarker.userData.detailId = detailNode.id;
  orangeOriginMarker.name = '__detail_origin_marker_orange';
  orangeOriginMarker.visible = true; // ⚠️ ВАЖНО: Явно устанавливаем видимость
  orangeOriginMarker.renderOrder = 100; // Высокий renderOrder для отображения поверх других объектов

  if (existingAxes) {
    // Обновляем существующий axes helper
    // Удаляем старые оси и оранжевую точку
    parentOwnObject.remove(existingAxes);
    const existingOriginMarker = parentOwnObject.children.find(
      c => c.userData?.isOriginMarker && c.userData?.detailId === detailNode.id
    );
    if (existingOriginMarker) {
      parentOwnObject.remove(existingOriginMarker);
      if ((existingOriginMarker as THREE.Mesh).geometry) {
        (existingOriginMarker as THREE.Mesh).geometry.dispose();
      }
      if ((existingOriginMarker as THREE.Mesh).material) {
        ((existingOriginMarker as THREE.Mesh).material as THREE.Material).dispose();
      }
    }
    existingAxes.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry.dispose();
        if (m.material) (m.material as THREE.Material).dispose();
      }
    });

    // Создаём новые оси с обновленным размером
    const newAxes = createThickAxesHelper(axesSize);
    newAxes.userData.isAxes = true;
    newAxes.userData.detailId = detailNode.id;
    newAxes.position.copy(attachmentPoint);
    newAxes.visible = true; // ⚠️ ВАЖНО: Явно устанавливаем видимость
    parentOwnObject.add(newAxes);
    
    // Добавляем оранжевую точку
    parentOwnObject.add(orangeOriginMarker);
    
  } else {
    // Создаём новый axes helper
    const axes = createThickAxesHelper(axesSize);
    axes.userData.isAxes = true;
    axes.userData.detailId = detailNode.id;
    axes.position.copy(attachmentPoint);
    axes.visible = true; // ⚠️ ВАЖНО: Явно устанавливаем видимость
    parentOwnObject.add(axes);
    
    // Добавляем оранжевую точку начала координат
    parentOwnObject.add(orangeOriginMarker);
    
    // ⚠️ КРИТИЧЕСКАЯ ПРОВЕРКА: Убеждаемся, что объекты добавлены и видны
    
    // ⚠️ ВАЖНО: Принудительно обновляем матрицы для правильного отображения
    parentOwnObject.updateMatrixWorld(true);
    axes.updateMatrixWorld(true);
    orangeOriginMarker.updateMatrixWorld(true);
    
    // Принудительно вызываем рендер
    if (typeof render === 'function') {
      render();
    }

  }
}

/**
 * ⭐ ЭТАП 9: Скрытие axes helper детали на секции
 * 
 * @param detailNode - узел детали
 * @param parentSectionNode - узел родительской секции
 */
function hideDetailAxesOnSection(detailNode: SceneNode, parentSectionNode: SceneNode) {
  if (!parentSectionNode || parentSectionNode.type !== 'section') return;

  let parentOwnObject: THREE.Group | null = null;
  if (parentSectionNode.metadata?.own_object) {
    parentOwnObject = parentSectionNode.metadata.own_object as THREE.Group;
  } else {
    parentOwnObject = parentSectionNode.group.getObjectByName('__own_object') as THREE.Group | null;
  }

  if (!parentOwnObject) return;

  const axes = parentOwnObject.children.find(
    c => c.userData?.isAxes && c.userData?.detailId === detailNode.id
  ) as THREE.Group | undefined;
  
  const originMarker = parentOwnObject.children.find(
    c => c.userData?.isOriginMarker && c.userData?.detailId === detailNode.id
  ) as THREE.Mesh | undefined;

  if (axes) {
    axes.visible = false;
    console.log('👁️ [hideDetailAxesOnSection] Axes helper скрыт для детали:', detailNode.id);
  }
  
  if (originMarker) {
    originMarker.visible = false;
    console.log('👁️ [hideDetailAxesOnSection] Оранжевая точка начала координат скрыта для детали:', detailNode.id);
  }
}

/**
 * ⭐ ЭТАП 9: Показ axes helper детали на секции
 * 
 * @param detailNode - узел детали
 * @param parentSectionNode - узел родительской секции
 */
function showDetailAxesOnSection(detailNode: SceneNode, parentSectionNode: SceneNode) {
  if (!parentSectionNode || parentSectionNode.type !== 'section') return;

  let parentOwnObject: THREE.Group | null = null;
  if (parentSectionNode.metadata?.own_object) {
    parentOwnObject = parentSectionNode.metadata.own_object as THREE.Group;
  } else {
    parentOwnObject = parentSectionNode.group.getObjectByName('__own_object') as THREE.Group | null;
  }

  if (!parentOwnObject) return;

  const axes = parentOwnObject.children.find(
    c => c.userData?.isAxes && c.userData?.detailId === detailNode.id
  ) as THREE.Group | undefined;
  
  const originMarker = parentOwnObject.children.find(
    c => c.userData?.isOriginMarker && c.userData?.detailId === detailNode.id
  ) as THREE.Mesh | undefined;

  if (axes) {
    axes.visible = true;
    console.log('👁️ [showDetailAxesOnSection] Axes helper показан для детали:', detailNode.id);
  }
  
  if (originMarker) {
    originMarker.visible = true;
    console.log('👁️ [showDetailAxesOnSection] Оранжевая точка начала координат показана для детали:', detailNode.id);
  }
  
  if (!axes || !originMarker) {
    // Если axes или originMarker нет, создаём их (может быть, деталь была создана до реализации этой функции)
    if (detailNode.group) {
      createOrUpdateDetailAxesOnSection(detailNode, parentSectionNode, detailNode.group);
    }
  }
}

// Создать спрайт с текстом (для размеров 300/400)
function createTextSprite(text: string, color: string = '#000000'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x000000 }));
  }

  const fontSize = 64;
  context.font = `${fontSize}px Arial`;
  const textWidth = context.measureText(text).width;
  canvas.width = textWidth + 32;
  canvas.height = fontSize + 32;

  context.font = `${fontSize}px Arial`;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  const scale = 0.4; // размер надписи в мире (метры)
  sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);
  return sprite;
}

// Стартовые размерные стрелки (до создания секции)
function buildInitialDimensions(widthMm: number, heightMm: number, rootSectionNode?: SceneNode) {
  // ⭐ ПРОВЕРКА: Логируем входные параметры
  console.log('📏 [buildInitialDimensions] ВХОДНЫЕ ПАРАМЕТРЫ:', {
    widthMm,
    heightMm,
    widthMm_тип: typeof widthMm,
    heightMm_тип: typeof heightMm,
    предположение: widthMm > 100 ? 'вероятно в мм' : 'вероятно в метрах',
  });
  
  // ⭐ ИСПРАВЛЕНИЕ: Если значения слишком маленькие (меньше 1), значит они уже в метрах
  // Нужно умножить на 1000, чтобы получить миллиметры
  let actualWidthMm = widthMm;
  let actualHeightMm = heightMm;
  
  if (widthMm < 1 && widthMm > 0) {
    console.warn('⚠️ [buildInitialDimensions] widthMm < 1, умножаем на 1000 (вероятно было в метрах)');
    actualWidthMm = widthMm * 1000;
  }
  if (heightMm < 1 && heightMm > 0) {
    console.warn('⚠️ [buildInitialDimensions] heightMm < 1, умножаем на 1000 (вероятно было в метрах)');
    actualHeightMm = heightMm * 1000;
  }
  
  // Удаляем предыдущую группу, если была
  if (initialDimensionsGroup) {
    console.log('🗑️ [buildInitialDimensions] Удаляем старые стрелки размеров...');
    
    // ⭐ ВАЖНО: Сначала удаляем все CSS2DObject из DOM, чтобы старые тексты не накладывались
    initialDimensionsGroup.traverse(obj => {
      if (obj instanceof CSS2DObject) {
        // Удаляем элемент из DOM, если он еще там
        const element = obj.element;
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
    });
    
    // Затем удаляем группу из сцены
    scene.remove(initialDimensionsGroup);
    
    // Очищаем геометрию и материалы
    initialDimensionsGroup.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
        (obj.geometry as THREE.BufferGeometry).dispose();
        if ((obj.material as any)?.dispose) (obj.material as any).dispose();
      }
      if (obj instanceof THREE.Sprite) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
      if (obj instanceof CSS2DObject) {
        // Дополнительная очистка CSS2DObject
        const element = obj.element;
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
    });
    
    initialDimensionsGroup = null;
    console.log('✅ [buildInitialDimensions] Старые стрелки удалены');
  }

  const group = new THREE.Group();
  group.name = '__dimensions';
  group.userData.isBaseObject = true;
  // ⭐ ВАЖНО: Помечаем, что это НЕ рамка секции и на неё НЕЛЬЗЯ опираться в расчётах
  // В отличие от frame.userData.isFrame, этот объект используется ТОЛЬКО для стрелок размеров.
  group.userData.isDimensionsHelper = true;

  // ⭐ ИСПРАВЛЕНО: Используем исправленные значения
  const w = actualWidthMm / 1000;
  const h = actualHeightMm / 1000;
  const depthInputEl = document.getElementById('catalog-item-edit-depth') as HTMLInputElement | null;
  let depthMm = depthInputEl ? (parseFloat(depthInputEl.value) || 200) : 200;
  
  // ⭐ ПРОВЕРКА: Если depth тоже в метрах
  if (depthMm < 1 && depthMm > 0) {
    console.warn('⚠️ [buildInitialDimensions] depthMm < 1, умножаем на 1000 (вероятно было в метрах)');
    depthMm = depthMm * 1000;
  }
  
  const d = depthMm / 1000;
  
  // ⭐ ПРОВЕРКА: Если размеры слишком маленькие, стрелки не будут видны
  if (w < 0.01 || h < 0.01 || d < 0.01) {
    console.error('❌ [buildInitialDimensions] РАЗМЕРЫ СЛИШКОМ МАЛЕНЬКИЕ! Стрелки не будут видны:', {
      w, h, d,
      actualWidthMm, actualHeightMm, depthMm,
      'проблема': 'Размеры меньше 1 см, проверьте единицы измерения',
    });
  }
  
  console.log('📐 [buildInitialDimensions] РАЗМЕРЫ ДЛЯ СТРЕЛОК:', {
    исходные: { widthMm, heightMm, depthMm: depthInputEl ? parseFloat(depthInputEl.value) : 'N/A' },
    исправленные: { actualWidthMm, actualHeightMm, depthMm },
    в_метрах_для_ThreeJS: { w, h, d },
    размеры_достаточны: w >= 0.01 && h >= 0.01 && d >= 0.01,
  });

  // ⭐ Опорная точка: центр красного маркера в нижнем левом заднем углу секции
  // Красный маркер находится в helpersGroup в позиции (0,0,0) локально
  // helpersGroup.position = own_object.position = (-sizeX/2, 0, -sizeZ/2) для root
  let offsetX = -w / 2; // Позиция красного маркера = позиция own_object для root
  let offsetY = 0;
  let offsetZ = -d / 2;

  if (rootSectionNode && rootSectionNode.metadata?.helpers) {
    const helpersGroup = rootSectionNode.metadata.helpers as THREE.Group;
    helpersGroup.updateMatrixWorld(true);
    
    // Находим красный маркер в helpersGroup
    const redMarker = helpersGroup.children.find(
      child => child.userData?.is_root_corner_red === true
    ) as THREE.Mesh | undefined;
    
    if (redMarker) {
      // Получаем мировую позицию красного маркера
      const redMarkerWorldPos = new THREE.Vector3();
      redMarker.getWorldPosition(redMarkerWorldPos);
      
      offsetX = redMarkerWorldPos.x;
      offsetY = redMarkerWorldPos.y;
      offsetZ = redMarkerWorldPos.z;
      
      console.log('📍 [buildInitialDimensions] Используем позицию красного маркера:', {
        redMarkerLocalPos: redMarker.position.clone(),
        redMarkerWorldPos: redMarkerWorldPos.clone(),
        helpersGroupPos: helpersGroup.position.clone(),
        offset: { x: offsetX, y: offsetY, z: offsetZ },
      });
    } else {
      // Если красный маркер не найден, используем позицию own_object
      const rootOwnObject = rootSectionNode.metadata?.own_object as THREE.Group | undefined;
      if (rootOwnObject) {
        rootOwnObject.updateMatrixWorld(true);
        const ownObjectWorldPos = new THREE.Vector3();
        rootOwnObject.getWorldPosition(ownObjectWorldPos);
        
        offsetX = ownObjectWorldPos.x;
        offsetY = ownObjectWorldPos.y;
        offsetZ = ownObjectWorldPos.z;
        
        console.log('📍 [buildInitialDimensions] Красный маркер не найден, используем позицию own_object:', {
          ownObjectPosition: rootOwnObject.position.clone(),
          ownObjectWorldPos: ownObjectWorldPos.clone(),
          offset: { x: offsetX, y: offsetY, z: offsetZ },
        });
      }
    }
  }

  // ⭐ МАРКЕР НА СТРЕЛКАХ УДАЛЕН: больше не создаем маркер в начале стрелок
  
  console.log('📍📍📍 [buildInitialDimensions] НАЧАЛО СТРЕЛОК:', {
    offset: { x: offsetX, y: offsetY, z: offsetZ },
    размеры_в_метрах: { w, h, d },
    размеры_мм_исправленные: { width: actualWidthMm, height: actualHeightMm, depth: depthMm },
  });

  const arrowSize = 0.02; // Размер стрелок в метрах (2 см)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 2, // ⭐ УВЕЛИЧИЛ толщину линии для лучшей видимости
    depthTest: false,
  });
  
  console.log('🎯 [buildInitialDimensions] ПАРАМЕТРЫ СТРЕЛОК:', {
    размер_стрелки_в_метрах: arrowSize,
    размер_стрелки_в_мм: arrowSize * 1000,
    толщина_линии: lineMaterial.linewidth,
    размеры_секции_в_метрах: { w, h, d },
    размеры_секции_в_мм: { 
      ширина: Math.round(w * 1000), 
      высота: Math.round(h * 1000), 
      глубина: Math.round(d * 1000) 
    },
  });

  // Вертикальная стрелка (высота)
  {
    const points = [
      new THREE.Vector3(offsetX, offsetY, offsetZ),
      new THREE.Vector3(offsetX, offsetY + h, offsetZ),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);
    group.add(line);

    const topArrowPoints = [
      new THREE.Vector3(offsetX - arrowSize, offsetY + h, offsetZ),
      new THREE.Vector3(offsetX + arrowSize, offsetY + h, offsetZ),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(topArrowPoints), lineMaterial));

    const bottomArrowPoints = [
      new THREE.Vector3(offsetX - arrowSize, offsetY, offsetZ),
      new THREE.Vector3(offsetX + arrowSize, offsetY, offsetZ),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(bottomArrowPoints), lineMaterial));

    const textDiv = document.createElement('div');
    textDiv.textContent = String(actualHeightMm);
    textDiv.style.color = '#000';
    textDiv.style.fontSize = '14px';
    textDiv.style.fontFamily = 'Arial, sans-serif';
    textDiv.style.whiteSpace = 'nowrap';
    textDiv.style.pointerEvents = 'none';
    textDiv.style.background = 'transparent';
    textDiv.style.border = 'none';
    textDiv.style.padding = '0';
    textDiv.style.margin = '0';

    const textLabel = new CSS2DObject(textDiv);
    textLabel.position.set(offsetX - 0.12, offsetY + h / 2, offsetZ);
    group.add(textLabel);
  }

  // Горизонтальная стрелка (ширина)
  {
    const points = [
      new THREE.Vector3(offsetX, offsetY, offsetZ),
      new THREE.Vector3(offsetX + w, offsetY, offsetZ),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));

    const rightArrowPoints = [
      new THREE.Vector3(offsetX + w, offsetY - arrowSize, offsetZ),
      new THREE.Vector3(offsetX + w, offsetY + arrowSize, offsetZ),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightArrowPoints), lineMaterial));

    const leftArrowPoints = [
      new THREE.Vector3(offsetX, offsetY - arrowSize, offsetZ),
      new THREE.Vector3(offsetX, offsetY + arrowSize, offsetZ),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftArrowPoints), lineMaterial));

    const textDiv = document.createElement('div');
    textDiv.textContent = String(actualWidthMm);
    textDiv.style.color = '#000';
    textDiv.style.fontSize = '14px';
    textDiv.style.fontFamily = 'Arial, sans-serif';
    textDiv.style.whiteSpace = 'nowrap';
    textDiv.style.pointerEvents = 'none';
    textDiv.style.background = 'transparent';
    textDiv.style.border = 'none';
    textDiv.style.padding = '0';
    textDiv.style.margin = '0';

    const textLabel = new CSS2DObject(textDiv);
    textLabel.position.set(offsetX + w / 2, offsetY - 0.12, offsetZ);
    group.add(textLabel);
  }

  // Стрелка глубины (по оси Z)
  {
    const points = [
      new THREE.Vector3(offsetX, offsetY, offsetZ),
      new THREE.Vector3(offsetX, offsetY, offsetZ + d),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));

    const frontArrowPoints = [
      new THREE.Vector3(offsetX - arrowSize, offsetY, offsetZ + d),
      new THREE.Vector3(offsetX + arrowSize, offsetY, offsetZ + d),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(frontArrowPoints), lineMaterial));

    const backArrowPoints = [
      new THREE.Vector3(offsetX - arrowSize, offsetY, offsetZ),
      new THREE.Vector3(offsetX + arrowSize, offsetY, offsetZ),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(backArrowPoints), lineMaterial));

    const textDiv = document.createElement('div');
    textDiv.textContent = String(depthMm);
    textDiv.style.color = '#000';
    textDiv.style.fontSize = '14px';
    textDiv.style.fontFamily = 'Arial, sans-serif';
    textDiv.style.whiteSpace = 'nowrap';
    textDiv.style.pointerEvents = 'none';
    textDiv.style.background = 'transparent';
    textDiv.style.border = 'none';
    textDiv.style.padding = '0';
    textDiv.style.margin = '0';

    const textLabel = new CSS2DObject(textDiv);
    textLabel.position.set(offsetX - 0.12, offsetY, offsetZ + d / 2);
    group.add(textLabel);
  }

  // ⭐ ВАЖНО: Убеждаемся, что группа видима
  group.visible = true;
  
  // ⭐ ВРЕМЕННО: отключаем отображение стрелок размеров для отладки сцены
  if (SHOW_DIMENSIONS_HELPERS) {
  scene.add(group);
  initialDimensionsGroup = group;
  } else {
    console.log('🧪 [buildInitialDimensions] Стрелки размеров временно отключены (SHOW_DIMENSIONS_HELPERS = false)');
  }
  
  // ⭐ ПРОВЕРКА: Убеждаемся, что группа действительно в сцене
  const isInScene = scene.children.includes(group);
  const dimensionsGroupsInScene = scene.children.filter(c => c.name === '__dimensions');
  const linesCount = group.children.filter(c => c instanceof THREE.Line).length;
  const textsCount = group.children.filter(c => c instanceof CSS2DObject).length;
  
  console.log('✅✅✅ [buildInitialDimensions] СТРЕЛКИ СОЗДАНЫ:', {
    группа_добавлена_в_сцену: isInScene,
    группа_видима: group.visible,
    количество_объектов_в_группе: group.children.length,
    количество_линий: linesCount,
    количество_текстов: textsCount,
    начальная_точка: { x: offsetX, y: offsetY, z: offsetZ },
    размеры_стрелок_в_метрах: { ширина: w, высота: h, глубина: d },
    размеры_стрелок_в_мм: { 
      ширина: Math.round(w * 1000), 
      высота: Math.round(h * 1000), 
      глубина: Math.round(d * 1000) 
    },
    размеры_исходные_в_мм: { ширина: actualWidthMm, высота: actualHeightMm, глубина: depthMm },
    группа_в_сцене: dimensionsGroupsInScene.length,
  });
  
  // ⭐ ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Выводим размеры каждой стрелки отдельно
  console.log('📏📏📏 [buildInitialDimensions] РАЗМЕРЫ КАЖДОЙ СТРЕЛКИ В ММ:', {
    вертикальная_стрелка_высота_мм: Math.round(h * 1000),
    горизонтальная_стрелка_ширина_мм: Math.round(w * 1000),
    стрелка_глубины_мм: Math.round(d * 1000),
    'проверка_видимости': {
      'вертикальная_>_10мм': h * 1000 > 10,
      'горизонтальная_>_10мм': w * 1000 > 10,
      'глубина_>_10мм': d * 1000 > 10,
    },
  });
  
  // ⭐ ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Проверяем видимость всех компонентов
  group.traverse(obj => {
    if (obj instanceof THREE.Line || obj instanceof THREE.LineSegments) {
      if (!obj.visible) {
        console.warn('⚠️ [buildInitialDimensions] Найдена невидимая линия:', obj.name || obj.type);
        obj.visible = true;
      }
      // ⭐ Убеждаемся, что материал видим
      if (obj.material) {
        (obj.material as THREE.Material).visible = true;
      }
    }
    if (obj instanceof CSS2DObject) {
      if (!obj.visible) {
        console.warn('⚠️ [buildInitialDimensions] Найден невидимый текст:', obj.element.textContent);
        obj.visible = true;
      }
    }
    if (obj instanceof THREE.Mesh) {
      if (!obj.visible) {
        console.warn('⚠️ [buildInitialDimensions] Найден невидимый mesh:', obj.name || obj.type);
        obj.visible = true;
      }
    }
  });
  
  // ⭐ ПРИНУДИТЕЛЬНЫЙ РЕНДЕР после создания стрелок
  render();

  // ⭐ ВАЖНО: Скрываем все frame-объекты (userData.isFrame), чтобы на экране были только стрелки
  hideAllFramesInScene();
  
  console.log('🎯 [buildInitialDimensions] Стрелки созданы и добавлены в сцену, принудительный рендер выполнен');
}

// Обновить оси детали с текущими якорями
function updateDetailAxes() {
  if (!currentSelectedNode || currentSelectedNode.type !== 'detail') return;
  // ⚠️ Отключаем «толстые оси» и императивное перемещение осей/пивота.
  // В Clodis оси/mesh живут внутри detailOwnObject и пересоздаются через _build_children().
  console.warn('⚠️ updateDetailAxes: отключено. Изменение якорей/пивота выполняется только через childrenData + _build_children().');
}

// Применить свойства детали
function applyDetailProperties() {
  if (!currentSelectedNode || currentSelectedNode.type !== 'detail') {
    alert('Выберите деталь для изменения свойств');
    return;
  }

  const parentSection = currentSelectedNode.parent;
  if (!parentSection || parentSection.type !== 'section') {
    alert('Не удалось определить родительскую секцию');
    return;
  }
  if (!parentSection.metadata) parentSection.metadata = {};
  if (!parentSection.metadata.childrenData) parentSection.metadata.childrenData = [];

  const mSel = document.getElementById('detail-material-select') as HTMLSelectElement | null;
  const materialId = ((mSel?.value as keyof typeof detailMaterials) || currentSelectedNode.metadata?.material?.id || 'ldsp16') as keyof typeof detailMaterials;

  // Декларативно: правим childrenData и пересобираем секцию, как в Clodis (_build_children)
  const childData = parentSection.metadata.childrenData.find((cd: any) => cd.id === currentSelectedNode!.id);
  if (!childData) {
    console.warn('⚠️ applyDetailProperties: не нашли запись в childrenData для детали', currentSelectedNode.id);
  } else {
    childData.name = currentSelectedNode.name;
    childData.materialId = materialId;
  }

  rebuildSection(parentSection);

  // Возвращаем выделение на ту же деталь (если она пересоздалась)
  const rebuilt = sceneNodes.find(n => n.type === 'detail' && n.id === currentSelectedNode!.id) || null;
  if (rebuilt) selectNode(rebuilt);

  render();
}

// Добавить дочерний узел к существующему
function addChildNode(parentNode: SceneNode, childNode: SceneNode) {

  // Проверяем, не добавлен ли уже узел в children
  if (parentNode.children.includes(childNode)) {
    console.warn('⚠️ Узел уже присутствует в children родителя, пропускаем добавление');
    return;
  }
  
  // ⭐ РЕФЕРЕНС: Дети добавляются в own_object родителя (строка 2744 main_core_v2_part18.js)
  // this['userData']['own_object']['add'](z)
  // Для секций: добавляем в own_object родителя
  // Для деталей: добавляем в own_object родителя (секции)
  
  // Ищем own_object родителя (как в getOwnObject и createDetailClodis)
  let parentOwnObject: THREE.Group | undefined;
  
  // Сначала пытаемся найти через userData (как в референсе)
  if (parentNode.group.userData?.struct?.['__own_object']) {
    parentOwnObject = parentNode.group.userData.struct['__own_object'] as THREE.Group;
  } 
  // Если не найдено, пытаемся через metadata (fallback для старых элементов)
  else if (parentNode.metadata?.own_object) {
    parentOwnObject = parentNode.metadata.own_object as THREE.Group;
  }
  // Если все еще не найдено, ищем в children секции
  else {
    parentOwnObject = parentNode.group.getObjectByName('__own_object') as THREE.Group | undefined;
  }
  
  if (parentOwnObject) {
    // Референс: дети добавляются в own_object родителя
    if (!parentOwnObject.children.includes(childNode.group)) {
      parentOwnObject.add(childNode.group);
    }
  } else {
    // Fallback: если own_object нет, добавляем в group (для совместимости)
  if (!parentNode.group.children.includes(childNode.group)) {
    parentNode.group.add(childNode.group);
    }
  }

  childNode.parent = parentNode;
  parentNode.children.push(childNode);
  parentNode.expanded = true; // Автоматически раскрываем при добавлении
  
  // Добавляем дочерний узел в sceneNodes, если его там еще нет
  if (!sceneNodes.includes(childNode)) {
    sceneNodes.push(childNode);
    // Синхронизируем window.sceneNodes
    (window as any).sceneNodes = sceneNodes;
  }
  
  
  renderHierarchy();
}

// Глобальная переменная для хранения выделения
let selectionHelper: THREE.BoxHelper | null = null;

// Обновить информацию о детали в HUD
function updateDetailInfo(name: string, size: { x: number; y: number; z: number }, pos: { x: number; y: number; z: number }) {
  let infoDiv = document.getElementById('detail-info');
  if (!infoDiv) {
    // Создаем блок информации если его нет
    infoDiv = document.createElement('div');
    infoDiv.id = 'detail-info';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '60px';
    infoDiv.style.left = '12px';
    infoDiv.style.padding = '10px 12px';
    infoDiv.style.background = 'rgba(255, 0, 0, 0.85)';
    infoDiv.style.color = '#fff';
    infoDiv.style.borderRadius = '6px';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.lineHeight = '1.6';
    infoDiv.style.zIndex = '10';
    infoDiv.style.fontFamily = 'monospace';
    infoDiv.style.minWidth = '200px';
    const app = document.getElementById('app');
    if (app) app.appendChild(infoDiv);
  }
  
  infoDiv.style.display = 'block';
  
  // Конвертируем метры в миллиметры для отображения
  const sizeMm = {
    x: (size.x * 1000).toFixed(0),
    y: (size.y * 1000).toFixed(0),
    z: (size.z * 1000).toFixed(0)
  };
  
  const posMm = {
    x: (pos.x * 1000).toFixed(0),
    y: (pos.y * 1000).toFixed(0),
    z: (pos.z * 1000).toFixed(0)
  };
  
  infoDiv.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 4px;">${name}</div>
    <div style="margin-bottom: 4px;"><strong>Размеры:</strong> ${sizeMm.x} × ${sizeMm.y} × ${sizeMm.z} мм</div>
    <div><strong>Позиция:</strong> X: ${posMm.x}, Y: ${posMm.y}, Z: ${posMm.z} мм</div>
  `;
}

// Очистить информацию о детали
function clearDetailInfo() {
  const infoDiv = document.getElementById('detail-info');
  if (infoDiv) {
    infoDiv.style.display = 'none';
  }
}

// Выбрать узел для редактирования
function selectNode(node: SceneNode) {
  // Убираем предыдущее выделение
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper.dispose();
    selectionHelper = null;
  }

  // ⭐ ВАЖНО: Сначала скрываем helpers у всех секций и деталей
  sceneNodes.forEach(n => {
    if (n.type === 'section' && n.group) {
      const helpers = n.group.children.find(
        c => c.name === '__helpers' || c.userData?.is_helperGroup
      ) as THREE.Group | undefined;
      if (helpers) {
        helpers.visible = false;
      }
    }
    // Скрываем helpers у всех деталей (показываются только у выделенной)
    if (n.type === 'detail' && n.group) {
      const helpers = n.group.children.find(
        c => c.name === '__helpers'
      ) as THREE.Group | undefined;
      if (helpers) {
        helpers.visible = false;
      }
    }
  });
  
  currentSelectedNode = node;
  
  // Обновляем иерархию для подсветки выбранного элемента
  renderHierarchy();
  
  console.log('📦 Выбран узел:', node.type, node.name);

  // Если выбранная нода — НЕ корневая секция, включаем её helpers (как в референсе)
  if (node.type === 'section' && node.group && !node.metadata?.is_root) {
    const helpers = node.group.children.find(
      c => c.name === '__helpers' || c.userData?.is_helperGroup
    ) as THREE.Group | undefined;
    if (helpers) {
      helpers.visible = true;
      console.log('✅ [selectNode] Helpers для секции включены:', {
        section: node.name,
        helpersChildren: helpers.children.length
      });
    }
  }
  
  // ⭐ ВАЖНО: Корневая секция ВСЕГДА должна быть скрыта (helpers и edges)
  const rootSection = sceneNodes.find(n => n.type === 'section' && n.metadata?.is_root);
  if (rootSection && rootSection.group) {
    const rootHelpers = rootSection.group.children.find(
      c => c.name === '__helpers' || c.userData?.is_helperGroup
    ) as THREE.Group | undefined;
    if (rootHelpers) {
      rootHelpers.visible = false; // ⭐ Корневая секция всегда скрыта
      // ⭐ Дополнительно: Явно скрываем все edges корневой секции
      rootHelpers.traverse((child) => {
        if ((child as any).isLineSegments && (child as any).userData?.is_root_section) {
          (child as any).visible = false;
        }
      });
    }
  }
  
  // Для детали показываем helpers и обновляем информацию в HUD
  if (node.type === 'detail') {
    // ⭐ ВАЖНО: Показываем helpers детали при выделении (как в референсе)
    // Референс: main_core_v2_part18.js:2885-2888 - _show_helpers() показывает helpers
    const detailHelpers = node.group.children.find(
      c => c.name === '__helpers'
    ) as THREE.Group | undefined;
    if (detailHelpers) {
      detailHelpers.visible = true;
      console.log('✅ [selectNode] Helpers для детали включены:', {
        detail: node.name,
        helpersChildren: detailHelpers.children.length
      });
    } else {
      // Если helpers еще не созданы, создаем их (референс строка 2886)
      console.warn('⚠️ [selectNode] Helpers для детали не найдены, создаем их');
      // Helpers должны быть созданы в createDetailClodis, но на всякий случай проверяем
    }
    
    // ⭐ ЭТАП 9: Показываем axes helper на секции при выделении детали (1 В 1 С РЕФЕРЕНСОМ)
    // Референс: Axes helper появляется на секции при выделении детали, показывая точку привязки
    if (node.parent && node.parent.type === 'section') {
      showDetailAxesOnSection(node, node.parent);
    }
    
    // ⭐ УДАЛЕНО: Красная сфера (PivotMarker) больше не создается
    
    // Находим меш детали (без осей и других вспомогательных элементов)
    const detailMesh = node.group.children.find(child => {
      return (child as THREE.Mesh).isMesh && 
             !child.userData?.isAxes && 
             !child.userData?.isFrame &&
             !child.userData?.isPivotMarker &&
             !child.name?.includes('PivotMarker') &&
             !child.name?.includes('BBox');
    }) as THREE.Mesh | undefined;
    
    // Получаем размеры и позицию детали
    const size = node.metadata?.size || (() => {
      // Вычисляем размеры только меша детали, без осей
      if (detailMesh) {
        const bbox = new THREE.Box3().setFromObject(detailMesh);
        return { x: bbox.max.x - bbox.min.x, y: bbox.max.y - bbox.min.y, z: bbox.max.z - bbox.min.z };
      }
      const bbox = new THREE.Box3().setFromObject(node.group);
      return { x: bbox.max.x - bbox.min.x, y: bbox.max.y - bbox.min.y, z: bbox.max.z - bbox.min.z };
    })();
    
    const pos = node.metadata?.position || {
      x: node.group.position.x,
      y: node.group.position.y,
      z: node.group.position.z
    };
    
    // Обновляем информацию в HUD для детали
    updateDetailInfo(node.name, size, pos);
    
    console.log('🔴 Деталь выделена:', {
      name: node.name,
      размеры: size,
      позиция: pos
    });
  } else {
    // ⭐ ЭТАП 9: Скрываем axes helper при снятии выделения с детали
    if (currentSelectedNode && currentSelectedNode.type === 'detail' && currentSelectedNode.parent && currentSelectedNode.parent.type === 'section') {
      hideDetailAxesOnSection(currentSelectedNode, currentSelectedNode.parent);
    }
    
    // Для всех других типов (секции, корпусы и т.д.) убираем информацию
    clearDetailInfo();
  }
  
  // ⭐ УДАЛЕНО ДУБЛИРОВАНИЕ: Старые панели section-properties и detail-properties удалены
  // Теперь используется только updateConstructorPropertiesPanel() для панели свойств Clodis
  
  // Показываем панели управления только для GLB элементов
  const sizeControls = document.getElementById('size-controls');
  const animationControls = document.getElementById('animation-controls');
  
  // Показываем кнопки для работы с GLB
  const addToSectionBtn = document.getElementById('btn-add-to-section');
  const saveAsHardwareBtn = document.getElementById('btn-save-as-hardware');
  
  if (node.type === 'glb') {
    if (addToSectionBtn) addToSectionBtn.style.display = 'block';
    if (saveAsHardwareBtn) saveAsHardwareBtn.style.display = 'block';
  } else {
    if (addToSectionBtn) addToSectionBtn.style.display = 'none';
    if (saveAsHardwareBtn) saveAsHardwareBtn.style.display = 'none';
  }
  
  // Показываем панель размеров для GLB (специфичная для GLB, не для Clodis панели свойств)
  if (sizeControls) {
    if (node.metadata?.isGLB) {
      sizeControls.style.display = 'block';
      
      // Заполняем текущие размеры
      const bbox = new THREE.Box3().setFromObject(node.group);
      const size = bbox.max.clone().sub(bbox.min);
      
      const inpWidth = document.getElementById('inp-size-width') as HTMLInputElement | null;
      const inpHeight = document.getElementById('inp-size-height') as HTMLInputElement | null;
      const inpDepth = document.getElementById('inp-size-depth') as HTMLInputElement | null;
      
      // В CAD системах нулевые размеры допустимы - сохраняем реальные значения
      if (inpWidth) inpWidth.value = (size.x || 0).toFixed(3);
      if (inpHeight) inpHeight.value = (size.y || 0).toFixed(3);
      if (inpDepth) inpDepth.value = (size.z || 0).toFixed(3);
    } else {
      sizeControls.style.display = 'none';
    }
  }
  
  // Показываем панель анимаций если есть или если это GLB (для тестирования)
  if (animationControls && node.metadata?.isGLB) {
    if (node.metadata.animations && node.metadata.animations.length > 0) {
      animationControls.style.display = 'block';
      renderAnimationControls(node);
    } else {
      // Показываем панель даже без анимаций, но с сообщением
      animationControls.style.display = 'block';
      const animationList = document.getElementById('animation-list');
      if (animationList) {
        animationList.innerHTML = '<div style="color: #666; font-size: 12px; padding: 8px;">Анимации в GLB не найдены</div>';
      }
    }
  } else if (animationControls) {
    animationControls.style.display = 'none';
  }
  
  // Восстанавливаем animationMixer из userData если есть
  if (node.group.userData.animationMixer) {
    animationMixer = node.group.userData.animationMixer;
    animationActions = node.group.userData.animationActions || {};
  }

  // ⭐ ЕДИНАЯ ТОЧКА ЗАПОЛНЕНИЯ: Обновляем правую панель свойств (Clodis UI)
  updateConstructorPropertiesPanel(node);
}

// Экспортируем currentSelectedNode для доступа из HTML
(window as any).currentSelectedNode = null;
Object.defineProperty(window, 'currentSelectedNode', {
  get: () => currentSelectedNode,
  set: (value) => { currentSelectedNode = value; }
});

// Функция для обновления узла из JSON (для вкладки JSON)
(window as any).updateNodeFromJson = (jsonData: any) => {
  if (!currentSelectedNode) {
    console.warn('Нет выбранного узла для обновления');
    return;
  }
  
  // Обновляем основные свойства
  if (jsonData.name) {
    currentSelectedNode.name = jsonData.name;
  }
  
  if (jsonData.type) {
    currentSelectedNode.type = jsonData.type;
  }
  
  // Обновляем метаданные
  if (jsonData.metadata) {
    currentSelectedNode.metadata = { ...currentSelectedNode.metadata, ...jsonData.metadata };
  }
  
  // Обновляем позицию
  if (jsonData.position) {
    currentSelectedNode.group.position.set(
      jsonData.position.x || 0,
      jsonData.position.y || 0,
      jsonData.position.z || 0
    );
  }
  
  // Обновляем дерево и панель свойств
  renderHierarchy();
  updateConstructorPropertiesPanel(currentSelectedNode);
  
  console.log('✅ Узел обновлен из JSON:', currentSelectedNode.name);
};

// Делаем функцию выбора узла доступной из HTML (дерево конструктора)
(window as any).selectNode = selectNode;

// Отрисовать панель управления анимациями
function renderAnimationControls(node: SceneNode) {
  const animationList = document.getElementById('animation-list');
  if (!animationList || !node.metadata?.animations) return;
  
  animationList.innerHTML = '';
  
  node.metadata.animations.forEach((animName) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '8px';
    div.style.alignItems = 'center';
    
    const label = document.createElement('span');
    label.textContent = animName;
    label.style.flex = '1';
    label.style.fontSize = '12px';
    
    const btnPlay = document.createElement('button');
    btnPlay.textContent = '▶';
    btnPlay.className = 'btn';
    btnPlay.style.padding = '4px 8px';
    btnPlay.onclick = () => playAnimation(animName);
    
    const btnPause = document.createElement('button');
    btnPause.textContent = '⏸';
    btnPause.className = 'btn';
    btnPause.style.padding = '4px 8px';
    btnPause.onclick = () => pauseAnimation(animName);
    
    const btnStop = document.createElement('button');
    btnStop.textContent = '⏹';
    btnStop.className = 'btn';
    btnStop.style.padding = '4px 8px';
    btnStop.onclick = () => stopAnimation(animName);
    
    div.appendChild(label);
    div.appendChild(btnPlay);
    div.appendChild(btnPause);
    div.appendChild(btnStop);
    animationList.appendChild(div);
  });
}

// Воспроизвести анимацию
function playAnimation(name: string) {
  if (!animationActions[name]) {
    console.warn('Анимация не найдена:', name);
    return;
  }
  animationActions[name].reset().play();
  console.log('▶️ Воспроизведение:', name);
}

// Пауза анимации
function pauseAnimation(name: string) {
  if (!animationActions[name]) return;
  animationActions[name].paused = !animationActions[name].paused;
  console.log(animationActions[name].paused ? '⏸️ Пауза:' : '▶️ Возобновление:', name);
}

// Остановить анимацию
function stopAnimation(name: string) {
  if (!animationActions[name]) return;
  animationActions[name].stop();
  console.log('⏹️ Остановка:', name);
}

// Остановить все анимации
function stopAllAnimations() {
  Object.values(animationActions).forEach(action => action.stop());
  console.log('⏹️ Все анимации остановлены');
}

// Применить свойства секции (размеры и позиция)
function applySectionProperties() {
  if (!currentSelectedNode || currentSelectedNode.type !== 'section') {
    alert('Выберите секцию для изменения свойств');
    return;
  }
  
  // Пробуем найти поля конструктора (catalog-constructor-property-size-*)
  let inpWidth = document.getElementById('catalog-constructor-property-size-x') as HTMLInputElement | null;
  let inpHeight = document.getElementById('catalog-constructor-property-size-y') as HTMLInputElement | null;
  let inpDepth = document.getElementById('catalog-constructor-property-size-z') as HTMLInputElement | null;
  
  // Если не найдены, пробуем старые ID (prop-size-*)
  if (!inpWidth) inpWidth = document.getElementById('prop-size-width') as HTMLInputElement | null;
  if (!inpHeight) inpHeight = document.getElementById('prop-size-height') as HTMLInputElement | null;
  if (!inpDepth) inpDepth = document.getElementById('prop-size-depth') as HTMLInputElement | null;
  
  const inpPosX = document.getElementById('prop-pos-x') as HTMLInputElement | null;
  const inpPosY = document.getElementById('prop-pos-y') as HTMLInputElement | null;
  const inpPosZ = document.getElementById('prop-pos-z') as HTMLInputElement | null;
  
  if (!inpWidth || !inpHeight || !inpDepth) {
    console.error('❌ Не найдены поля ввода размеров секции');
    return;
  }
  
  // Значения в миллиметрах, конвертируем в метры
  const newWidth = parseFloat(inpWidth.value) / 1000;
  const newHeight = parseFloat(inpHeight.value) / 1000;
  const newDepth = parseFloat(inpDepth.value) / 1000;
  const newPosX = inpPosX ? (parseFloat(inpPosX.value) || 0) / 1000 : 0;
  const newPosY = inpPosY ? (parseFloat(inpPosY.value) || 0) / 1000 : 0;
  const newPosZ = inpPosZ ? (parseFloat(inpPosZ.value) || 0) / 1000 : 0;
  
  if (isNaN(newWidth) || isNaN(newHeight) || isNaN(newDepth) || 
      newWidth < 0 || newHeight < 0 || newDepth < 0) {
    alert('Введите корректные размеры (неотрицательные значения). В CAD системах нулевые размеры допустимы для плоских объектов.');
    return;
  }
  
  // В CAD системах нулевые размеры допустимы (например, плоские панели)
  // Разрешаем 0, но предупреждаем пользователя
  if (newWidth === 0 && newHeight === 0 && newDepth === 0) {
    alert('Все размеры не могут быть нулевыми одновременно. Укажите хотя бы один ненулевой размер.');
    return;
  }
  
  console.log('🔧 Применение свойств секции:', {
    name: currentSelectedNode.name,
    oldSize: currentSelectedNode.metadata?.size,
    oldPos: currentSelectedNode.metadata?.position,
    newSize: { x: newWidth, y: newHeight, z: newDepth },
    newPos: { x: newPosX, y: newPosY, z: newPosZ }
  });
  
  // Обновляем позицию (смещение от начала координат родителя)
  currentSelectedNode.group.position.set(newPosX, newPosY, newPosZ);
  
  // Находим и обновляем рамку (рамка находится в группе секции)
  // Рамка - это первый Group в children секции
  const frameGroup = currentSelectedNode.group.children.find(
    child => child.type === 'Group'
  ) as THREE.Group | undefined;
  
  if (frameGroup) {
    console.log('📦 Найдена рамка, обновляем размеры');
    // Удаляем все старые элементы рамки
    const toRemove: THREE.Object3D[] = [];
    frameGroup.children.forEach(child => {
      if ((child as THREE.Mesh).isMesh || (child as THREE.LineSegments).isLineSegments || child instanceof THREE.AxesHelper) {
        toRemove.push(child);
      }
    });
    toRemove.forEach(child => {
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat.dispose();
      }
      frameGroup.remove(child);
    });
    
    // ⭐ УДАЛЕНО: buildParentFrame - код сохранен в REMOVED_buildParentFrame_code.ts
  } else {
    console.log('⚠️ Рамка не найдена');
    // ⭐ УДАЛЕНО: buildParentFrame - код сохранен в REMOVED_buildParentFrame_code.ts
  }
  
  // Обновляем metadata
  if (!currentSelectedNode.metadata) {
    currentSelectedNode.metadata = {};
  }
  const oldSize = currentSelectedNode.metadata.size || { x: 0, y: 0, z: 0 };
  currentSelectedNode.metadata.size = { x: newWidth, y: newHeight, z: newDepth };
  currentSelectedNode.metadata.position = { x: newPosX, y: newPosY, z: newPosZ };
  
  console.log('✅ Свойства секции обновлены:', {
    size: { width: newWidth, height: newHeight, depth: newDepth },
    position: { x: newPosX, y: newPosY, z: newPosZ }
  });
  
  // ⭐ РЕФЕРЕНС: При изменении размеров секции пересобираем детали из JSON (как _build_children в референсе)
  if (newWidth !== oldSize.x || newHeight !== oldSize.y || newDepth !== oldSize.z) {
    console.log('🔄 Размеры секции изменились, пересобираем секцию через rebuildSection...');
    rebuildSection(currentSelectedNode);
  }
}

// Функция пересчёта деталей при изменении размеров секции (Clodis-совместимость)
function recalculateChildDetails(sectionNode: SceneNode) {
  if (!sectionNode || sectionNode.type !== 'section') {
    console.warn('⚠️ recalculateChildDetails: не передана секция');
    return;
  }
  
  const sectionSize = getNodeSize(sectionNode);
  if (!sectionSize) {
    console.warn('⚠️ Не удалось получить размеры секции для пересчёта');
    return;
  }
  
  console.log('🔄 Пересчёт деталей секции:', {
    sectionName: sectionNode.name,
    sectionSize: { x: sectionSize.x * 1000, y: sectionSize.y * 1000, z: sectionSize.z * 1000, unit: 'мм' }
  });
  
  // Пересчитываем каждую дочернюю деталь, которая имеет выражения
  sectionNode.children.forEach(child => {
    if (child.type !== 'detail') return;
    
    const expressions = child.metadata?.expressions;
    if (!expressions || (!expressions.size && !expressions.pos)) {
      console.log(`  ⏭️ Деталь "${child.name}" не имеет выражений, пропускаем`);
      return;
    }
    
    console.log(`  🔄 Пересчитываем деталь "${child.name}"...`);
    
    // Вычисляем новые размеры из выражений
    let newWidth = child.metadata?.size?.x || 0;
    let newHeight = child.metadata?.size?.y || 0;
    let newDepth = child.metadata?.size?.z || 0;
    
    if (expressions.size) {
      if (expressions.size.x !== undefined) {
        const w = evaluateExpression(expressions.size.x, sectionNode);
        if (w > 0) newWidth = w;
      }
      if (expressions.size.y !== undefined) {
        const h = evaluateExpression(expressions.size.y, sectionNode);
        if (h > 0) newHeight = h;
      }
      if (expressions.size.z !== undefined) {
        const d = evaluateExpression(expressions.size.z, sectionNode);
        if (d > 0) newDepth = d;
      }
    }
    
    // Вычисляем новую позицию из выражений
    let newPosX = child.metadata?.position?.x || 0;
    let newPosY = child.metadata?.position?.y || 0;
    let newPosZ = child.metadata?.position?.z || 0;
    
    if (expressions.pos) {
      if (expressions.pos.x !== undefined) {
        const px = evaluateExpression(expressions.pos.x, sectionNode);
        newPosX = px;
      }
      if (expressions.pos.y !== undefined) {
        const py = evaluateExpression(expressions.pos.y, sectionNode);
        newPosY = py;
      }
      if (expressions.pos.z !== undefined) {
        const pz = evaluateExpression(expressions.pos.z, sectionNode);
        newPosZ = pz;
      }
    }
    
    console.log(`    Новые размеры: ${(newWidth*1000).toFixed(0)} x ${(newHeight*1000).toFixed(0)} x ${(newDepth*1000).toFixed(0)} мм`);
    console.log(`    Новая позиция: X=${(newPosX*1000).toFixed(0)}, Y=${(newPosY*1000).toFixed(0)}, Z=${(newPosZ*1000).toFixed(0)} мм`);
    
    // Обновляем metadata детали
    if (!child.metadata) child.metadata = {};
    child.metadata.size = { x: newWidth, y: newHeight, z: newDepth };
    child.metadata.position = { x: newPosX, y: newPosY, z: newPosZ };
    
    // Обновляем позицию группы детали
    child.group.position.set(newPosX, newPosY, newPosZ);
    
    // ⭐ РЕФЕРЕНС: Обновляем геометрию детали (меш находится в own_object детали)
    // Структура: child.group (detailGroup) → detailOwnObject (__own_object) → mesh
    const detailOwnObject = child.metadata?.own_object as THREE.Group | undefined;
    const mesh = detailOwnObject?.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh | undefined;
    if (mesh && mesh.geometry) {
      const oldGeo = mesh.geometry;
      const visual = getVisualSize(newWidth, newHeight, newDepth);
      mesh.geometry = new THREE.BoxGeometry(visual.w, visual.h, visual.d);
      oldGeo.dispose();
      
      // ⭐ РЕФЕРЕНС: mesh в own_object всегда в позиции (0,0,0) - pivot уже применен к own_object через translateX/Y/Z
      mesh.position.set(0, 0, 0);
      
      // ⭐ РЕФЕРЕНС: Обновляем pivot к own_object через translateX/Y/Z (как в _build_pivot)
      if (detailOwnObject) {
        // Сбрасываем предыдущий pivot
        detailOwnObject.position.set(0, 0, 0);
        detailOwnObject.rotation.set(0, 0, 0);
        detailOwnObject.scale.set(1, 1, 1);
        
        // Вычисляем новый pivot offset
      const anchors = child.metadata.anchors || { x: 'min', y: 'min', z: 'min' };
        const pivotNum = {
          x: anchorToPivotNum(anchors.x),
          y: anchorToPivotNum(anchors.y),
          z: anchorToPivotNum(anchors.z)
        };
        
        const pivotOffset_mm = {
          x: conv_pivot(pivotNum.x, newWidth * 1000),
          y: conv_pivot(pivotNum.y, newHeight * 1000),
          z: conv_pivot(pivotNum.z, newDepth * 1000)
        };
        
        const pivotOffset = {
          x: pivotOffset_mm.x / 1000,
          y: pivotOffset_mm.y / 1000,
          z: pivotOffset_mm.z / 1000
        };
        
        // Применяем pivot к own_object через translateX/Y/Z
        detailOwnObject.translateX(pivotOffset.x);
        detailOwnObject.translateY(pivotOffset.y);
        detailOwnObject.translateZ(pivotOffset.z);
      }
      
      // Обновляем маркер точки отсчёта (в начале координат группы)
      const pivotMarker = child.group.children.find(c => c.userData?.isPivotMarker) as THREE.Mesh | undefined;
      if (pivotMarker) {
        pivotMarker.position.set(0, 0, 0);
      }
      
      // Обновляем оси (в начале координат группы)
      const axes = child.group.children.find(c => c.userData?.isAxes && c.userData?.detailId === child.id) as THREE.Group | undefined;
      if (axes) {
        const axesSize = Math.max(newWidth, newHeight, newDepth) * 0.25;
        // Удаляем старые оси
        child.group.remove(axes);
        axes.traverse(obj => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry.dispose();
            if (m.material) (m.material as THREE.Material).dispose();
          }
        });
        // Создаём новые оси
        const newAxes = createThickAxesHelper(axesSize);
        newAxes.userData.isAxes = true;
        newAxes.userData.detailId = child.id;
        newAxes.position.set(0, 0, 0);
        child.group.add(newAxes);
      }
      
      console.log(`    ✅ Геометрия детали обновлена`);
    }
  });
  
  console.log('✅ Пересчёт деталей завершён');
}

// Изменить размеры выбранного узла
function applySize() {
  if (!currentSelectedNode) {
    alert('Выберите модель для изменения размеров');
    return;
  }
  
  const inpWidth = document.getElementById('inp-size-width') as HTMLInputElement;
  const inpHeight = document.getElementById('inp-size-height') as HTMLInputElement;
  const inpDepth = document.getElementById('inp-size-depth') as HTMLInputElement;
  
  if (!inpWidth || !inpHeight || !inpDepth) return;
  
  const newWidth = parseFloat(inpWidth.value);
  const newHeight = parseFloat(inpHeight.value);
  const newDepth = parseFloat(inpDepth.value);
  
  if (isNaN(newWidth) || isNaN(newHeight) || isNaN(newDepth) || 
      newWidth < 0 || newHeight < 0 || newDepth < 0) {
    alert('Введите корректные размеры (неотрицательные значения). В CAD системах нулевые размеры допустимы для плоских объектов.');
    return;
  }
  
  // В CAD системах нулевые размеры допустимы (например, плоские панели)
  // Разрешаем 0, но предупреждаем пользователя
  if (newWidth === 0 && newHeight === 0 && newDepth === 0) {
    alert('Все размеры не могут быть нулевыми одновременно. Укажите хотя бы один ненулевой размер.');
    return;
  }
  
  // Получаем оригинальные размеры
  const originalSize = currentSelectedNode.metadata?.originalSize;
  if (!originalSize) {
    alert('Оригинальные размеры не найдены');
    return;
  }
  
  // Вычисляем масштаб
  const scaleX = newWidth / originalSize.x;
  const scaleY = newHeight / originalSize.y;
  const scaleZ = newDepth / originalSize.z;
  
  // Применяем масштаб к GLB сцене (первый дочерний элемент, который не оси и не рамка)
  const gltfScene = currentSelectedNode.group.children.find(
    child => child.type === 'Group' && !child.userData.isFrame && !child.userData.isAxes
  ) as THREE.Group | undefined;
  
  if (gltfScene) {
    gltfScene.scale.set(scaleX, scaleY, scaleZ);
    
    // Обновляем рамку
    const frame = currentSelectedNode.group.children.find(
      child => child.userData.isFrame
    ) as THREE.Mesh | undefined;
    
    if (frame) {
      frame.geometry.dispose();
      // Используем визуальные размеры для Three.js
      const visual = getVisualSize(newWidth, newHeight, newDepth);
      frame.geometry = new THREE.BoxGeometry(visual.w, visual.h, visual.d);
      const bbox = new THREE.Box3().setFromObject(gltfScene);
      const pivotOffset = bbox.min.clone().negate();
      frame.position.copy(pivotOffset.clone().add(new THREE.Vector3(newWidth / 2, newHeight / 2, newDepth / 2)));
    }
    
    console.log('📐 Размеры изменены:', { width: newWidth, height: newHeight, depth: newDepth });
    console.log('  Масштаб:', { scaleX, scaleY, scaleZ });
  } else {
    alert('GLB сцена не найдена');
  }
}

/**
 * Парсит целевую высоту опоры в мм из имени файла (например "Опора 100 мм.obj", "leg_100mm.glb").
 * Возвращает число в мм или null, если не удалось распознать.
 */
function parseSupportHeightMmFromFilename(filename: string): number | null {
  const name = filename.replace(/\.[^.]+$/, '').toLowerCase();
  // "100 мм" или "100мм" или "100mm" или "leg_100mm"
  const match = name.match(/(\d+)\s*мм|(\d+)\s*mm|_(\d+)mm/i) || name.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1] || match[2] || match[3] || match[4], 10);
    if (num > 0 && num < 10000) return num; // разумный диапазон 1..9999 мм
  }
  return null;
}

// Добавить фурнитуру (GLB, OBJ, STL) в конструктор
function loadSupportIntoConstructor() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.glb,.gltf,.obj,.stl';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let loadedObject: THREE.Object3D;
      let size: THREE.Vector3;

      if (ext === 'glb' || ext === 'gltf') {
        // Загрузка GLB/glTF
        const loader = new GLTFLoader();
        const gltf = await new Promise<THREE.GLTF>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            loader.parse(arrayBuffer, '', resolve, reject);
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
        loadedObject = gltf.scene.clone();
        const bbox = new THREE.Box3().setFromObject(loadedObject);
        size = bbox.max.clone().sub(bbox.min);
      } else if (ext === 'obj') {
        // Загрузка OBJ
        const loader = new OBJLoader();
        const reader = new FileReader();
        loadedObject = await new Promise<THREE.Object3D>((resolve, reject) => {
          reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
              const obj = loader.parse(text);
              resolve(obj);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
        const bbox = new THREE.Box3().setFromObject(loadedObject);
        size = bbox.max.clone().sub(bbox.min);
      } else if (ext === 'stl') {
        // Загрузка STL
        const loader = new STLLoader();
        const reader = new FileReader();
        const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
          reader.onload = (event) => {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            try {
              const geo = loader.parse(arrayBuffer);
              resolve(geo);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
        const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        loadedObject = new THREE.Mesh(geometry, material);
        const bbox = new THREE.Box3().setFromObject(loadedObject);
        size = bbox.max.clone().sub(bbox.min);
      } else {
        alert('Неподдерживаемый формат файла. Используйте GLB, OBJ или STL.');
        return;
      }

      if (!currentSelectedNode || currentSelectedNode.type !== 'section') {
        alert('Выберите секцию для добавления фурнитуры');
        return;
      }

      // Вычисляем размеры после загрузки
      let bbox = new THREE.Box3().setFromObject(loadedObject);
      let actualSize = bbox.max.clone().sub(bbox.min);
      
      // Если размеры нулевые или очень маленькие, используем вычисленные
      if (size.x === 0 || size.y === 0 || size.z === 0) {
        size.copy(actualSize);
      }

      // Масштабируем загружаемую модель равномерно, чтобы она поместилась в секцию и сохранила пропорции
      const sectionSizeM = getNodeSize(currentSelectedNode);
      const curX = Math.max(size.x, actualSize.x, 0.001);
      const curY = Math.max(size.y, actualSize.y, 0.001);
      const curZ = Math.max(size.z, actualSize.z, 0.001);
      
      console.log('📏 [loadSupport] Размеры ДО масштабирования:', {
        modelSizeM: { x: curX.toFixed(3), y: curY.toFixed(3), z: curZ.toFixed(3) },
        modelSizeMm: { x: (curX * 1000).toFixed(0), y: (curY * 1000).toFixed(0), z: (curZ * 1000).toFixed(0) },
        sectionSizeM: sectionSizeM ? { x: sectionSizeM.x.toFixed(3), y: sectionSizeM.y.toFixed(3), z: sectionSizeM.z.toFixed(3) } : 'нет',
        sectionSizeMm: sectionSizeM ? { x: (sectionSizeM.x * 1000).toFixed(0), y: (sectionSizeM.y * 1000).toFixed(0), z: (sectionSizeM.z * 1000).toFixed(0) } : 'нет'
      });
      
      let uniformScale: number;
      if (sectionSizeM && sectionSizeM.x > 0 && sectionSizeM.y > 0 && sectionSizeM.z > 0) {
        // Берём минимальный коэффициент, чтобы модель поместилась в секцию по всем осям, не деформировавшись
        const scaleX = sectionSizeM.x / curX;
        const scaleY = sectionSizeM.y / curY;
        const scaleZ = sectionSizeM.z / curZ;
        uniformScale = Math.min(scaleX, scaleY, scaleZ);
        console.log('🔢 [loadSupport] Коэффициенты масштабирования:', {
          scaleX: scaleX.toFixed(4),
          scaleY: scaleY.toFixed(4),
          scaleZ: scaleZ.toFixed(4),
          uniformScale: uniformScale.toFixed(4),
          причина: `выбран min(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)}, ${scaleZ.toFixed(2)}) для сохранения пропорций`
        });
      } else {
        // Запасной вариант: масштабируем по высоте из имени файла
        const fallbackMm = parseSupportHeightMmFromFilename(file.name) ?? 100;
        const fallbackM = fallbackMm / 1000;
        uniformScale = fallbackM / curY;
        console.log('🔢 [loadSupport] Масштабирование (запасной вариант):', {
          fallbackMm,
          uniformScale: uniformScale.toFixed(4),
          причина: 'размеры секции недоступны, используем высоту из имени файла'
        });
      }
      loadedObject.scale.set(uniformScale, uniformScale, uniformScale);
      bbox = new THREE.Box3().setFromObject(loadedObject);
      size = bbox.max.clone().sub(bbox.min);
      actualSize = bbox.max.clone().sub(bbox.min);
      
      console.log('📏 [loadSupport] Размеры ПОСЛЕ масштабирования:', {
        finalSizeM: { x: size.x.toFixed(3), y: size.y.toFixed(3), z: size.z.toFixed(3) },
        finalSizeMm: { x: (size.x * 1000).toFixed(0), y: (size.y * 1000).toFixed(0), z: (size.z * 1000).toFixed(0) }
      });

      // ⚠️ PIVOT НЕ ЧИТАЕТСЯ ИЗ ФАЙЛА: в OBJ pivot вообще не хранится, в GLB — игнорируем.
      // При экспорте из Blender/3ds Max pivot может быть в центре, внизу по центру и т.д.
      // Мы принудительно задаём pivot = нижний левый дальний угол (back-left-bottom), сдвигая меш так,
      // чтобы bbox.min оказался в (0,0,0) группы. Если нужен "родной" pivot — экспортируйте модель с pivot внизу.
      const bboxMinAtLoad = bbox.min.clone();
      const pivotOffset = bboxMinAtLoad.clone().negate();
      loadedObject.position.copy(pivotOffset);

      // Создаем узел для фурнитуры
      const nodeId = generateId();
      const node: SceneNode = {
        id: nodeId,
        name: `Фурнитура: ${file.name.replace(/\.(glb|gltf|obj|stl)$/i, '')}`,
        type: 'support',
        group: new THREE.Group(),
        children: [],
        parent: currentSelectedNode,
        expanded: false,
        metadata: {
          originalSize: { x: size.x, y: size.y, z: size.z },
          sourceFile: file.name,
          fileFormat: ext,
          pivotOverrideApplied: true,
          bboxMinAtLoad: { x: bboxMinAtLoad.x, y: bboxMinAtLoad.y, z: bboxMinAtLoad.z },
          sectionSizeUsed: sectionSizeM ? { x: sectionSizeM.x, y: sectionSizeM.y, z: sectionSizeM.z } : undefined,
        },
      };

      node.group.add(loadedObject);
      
      // Позиция фурнитуры относительно секции (по умолчанию в начале координат секции)
      node.group.position.set(0, 0, 0);

      // Добавляем оси координат (толстые)
      const axesSize = Math.max(size.x, size.y, size.z) * 0.25;
      const axes = createThickAxesHelper(axesSize);
      axes.userData.isAxes = true;
      axes.position.set(0, 0, 0);
      node.group.add(axes);

      // Добавляем визуальную рамку для видимости (полупрозрачную)
      if (size.x > 0 && size.y > 0 && size.z > 0) {
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
          wireframe: true,
        });
        // Используем визуальные размеры для Three.js
        const visual = getVisualSize(size.x, size.y, size.z);
        const frameGeo = new THREE.BoxGeometry(visual.w, visual.h, visual.d);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.copy(pivotOffset.clone().add(size.clone().multiplyScalar(0.5)));
        frame.userData.isFrame = true;
        node.group.add(frame);
      }

      // Добавляем в группу секции
      currentSelectedNode.group.add(node.group);
      addChildNode(currentSelectedNode, node);
      selectNode(node);

      // Вычисляем мировую позицию для фокусировки камеры
      const worldPos = new THREE.Vector3();
      node.group.getWorldPosition(worldPos);
      const worldCenter = worldPos.clone().add(size.clone().multiplyScalar(0.5));
      const distance = Math.max(size.x, size.y, size.z) * 3;
      
      // Фокусируем камеру на загруженной фурнитуре
      camera.position.set(
        worldCenter.x + distance,
        worldCenter.y + distance,
        worldCenter.z + distance
      );
      controls.target.copy(worldCenter);
      controls.update();

      console.log('✅ Фурнитура загружена:', { 
        name: node.name, 
        format: ext, 
        size: { x: size.x, y: size.y, z: size.z },
        bbox: { min: bbox.min, max: bbox.max },
        localPosition: node.group.position,
        worldPosition: worldPos,
        worldCenter: worldCenter,
        cameraPos: camera.position,
        parentSection: currentSelectedNode.name
      });
    } catch (error) {
      console.error('❌ Ошибка загрузки фурнитуры:', error);
      alert('Ошибка загрузки фурнитуры: ' + (error as Error).message);
    }
  };
  input.click();
}

// Загрузить GLB в конструктор
function loadGLBIntoConstructor() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.glb,.gltf';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const loader = new GLTFLoader();
    try {
      const gltf = await new Promise<THREE.GLTF>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          loader.parse(arrayBuffer, '', resolve, reject);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const gltfScene = gltf.scene.clone();
      
      // Вычисляем размеры
      const bbox = new THREE.Box3().setFromObject(gltfScene);
      const size = bbox.max.clone().sub(bbox.min);
      
      // Создаем узел для GLB
      const nodeId = generateId();
      const node: SceneNode = {
        id: nodeId,
        name: file.name.replace(/\.(glb|gltf)$/i, ''),
        type: 'glb',
        group: new THREE.Group(),
        children: [],
        metadata: {
          originalSize: { x: size.x, y: size.y, z: size.z },
          animations: gltf.animations?.map((clip, i) => clip.name || `animation_${i}`) || [],
          sourceFile: file.name,
          isGLB: true,
        },
      };

      // Настраиваем pivot (back-left-bottom)
      const pivotOffset = bbox.min.clone().negate();
      gltfScene.position.copy(pivotOffset);
      node.group.add(gltfScene);
      node.group.position.set(0, 0, 0);

      // Добавляем оси координат (толстые)
      const axesSize = Math.max(size.x, size.y, size.z) * 0.25;
      const axes = createThickAxesHelper(axesSize);
      axes.userData.isAxes = true;
      axes.position.set(0, 0, 0);
      node.group.add(axes);

      // Добавляем полупрозрачную рамку для видимости
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        wireframe: true,
      });
      // Используем визуальные размеры для Three.js
      const visual = getVisualSize(size.x, size.y, size.z);
      const frameGeo = new THREE.BoxGeometry(visual.w, visual.h, visual.d);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.copy(pivotOffset.clone().add(size.clone().multiplyScalar(0.5)));
      frame.userData.isFrame = true;
      node.group.add(frame);

      scene.add(node.group);
      registerNode(node);
      
      // Фокусируем камеру на загруженном GLB
      const center = bbox.getCenter(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      const distance = maxSize > 0 ? maxSize * 3 : 2;
      
      // Устанавливаем позицию камеры так, чтобы объект был виден
      camera.position.set(
        center.x + distance,
        center.y + distance,
        center.z + distance
      );
      controls.target.copy(center);
      controls.update();
      
      // Инициализируем анимации если есть
      if (gltf.animations && gltf.animations.length > 0) {
        animationMixer = new THREE.AnimationMixer(gltfScene);
        animationActions = {};
        
        gltf.animations.forEach((clip, index) => {
          const action = animationMixer!.clipAction(clip);
          animationActions[clip.name || `animation_${index}`] = action;
        });
        
        node.group.userData.animationMixer = animationMixer;
        node.group.userData.animationActions = animationActions;
        
        console.log('🎬 Анимации инициализированы:', Object.keys(animationActions));
      }
      
      // Выбираем загруженный узел
      selectNode(node);
      
      // Если выбрана секция, предлагаем добавить GLB в неё как фурнитуру
      if (currentSelectedNode && currentSelectedNode.type === 'section') {
        const addToSection = confirm('Добавить загруженную модель в выбранную секцию как фурнитуру?');
        if (addToSection) {
          addGLBToSection(node, currentSelectedNode);
        }
      }
      
      console.log('✅ GLB загружен в конструктор:', file.name);
      console.log('  Размеры:', size);
      console.log('  Анимации:', node.metadata?.animations);
    } catch (error) {
      console.error('❌ Ошибка загрузки GLB:', error);
      alert('Ошибка загрузки GLB: ' + (error as Error).message);
    }
  };
  input.click();
}

// Добавить GLB в секцию как фурнитуру
function addGLBToSection(glbNode: SceneNode, sectionNode: SceneNode) {
  console.log('🔧 Начало добавления детали в секцию:', {
    glbNode: glbNode.name,
    sectionNode: sectionNode.name,
    glbNodeChildren: glbNode.group.children.length,
  });

  // Создаем копию GLB сцены
  const glbScene = glbNode.group.children.find(c => !c.userData?.isFrame && !c.userData?.isAxes)?.clone();
  if (!glbScene) {
    console.error('❌ Не удалось найти модель в GLB узле');
    console.log('   Доступные children:', glbNode.group.children.map(c => ({
      name: c.name,
      type: c.type,
      isFrame: c.userData?.isFrame,
      isAxes: c.userData?.isAxes,
      isMesh: c instanceof THREE.Mesh,
      isGroup: c instanceof THREE.Group,
    })));
    alert('Не удалось найти модель в GLB узле');
    return;
  }

  console.log('✅ GLB сцена найдена и клонирована:', {
    name: glbScene.name,
    type: glbScene.type,
    children: glbScene instanceof THREE.Group ? glbScene.children.length : 0,
  });

  // Вычисляем размеры
  const bbox = new THREE.Box3().setFromObject(glbScene);
  const size = bbox.max.clone().sub(bbox.min);
  
  console.log('📏 Размеры детали:', {
    bbox: { min: bbox.min, max: bbox.max },
    size: { x: size.x, y: size.y, z: size.z },
  });
  
  // Настраиваем pivot (back-left-bottom)
  const pivotOffset = bbox.min.clone().negate();
  glbScene.position.copy(pivotOffset);

  console.log('📍 Pivot offset:', pivotOffset);

  // Создаем узел фурнитуры
  const nodeId = generateId();
  const node: SceneNode = {
    id: nodeId,
    name: `Фурнитура: ${glbNode.name}`,
    type: 'support',
    group: new THREE.Group(),
    children: [],
    parent: sectionNode,
    expanded: false,
    metadata: {
      originalSize: { x: size.x, y: size.y, z: size.z },
      sourceFile: glbNode.metadata?.sourceFile || 'unknown',
      fileFormat: 'glb',
      isGLB: true,
    },
  };

  node.group.add(glbScene);
  node.group.position.set(0, 0, 0);

  console.log('✅ GLB сцена добавлена в узел детали, children узла:', node.group.children.length);

  // Добавляем оси координат (толстые)
  const axesSize = Math.max(size.x, size.y, size.z) * 0.25;
  const axes = createThickAxesHelper(axesSize);
  axes.userData.isAxes = true;
  axes.position.set(0, 0, 0);
  node.group.add(axes);

  // Добавляем визуальную рамку
  if (size.x > 0 && size.y > 0 && size.z > 0) {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    // Используем визуальные размеры для Three.js
    const visual = getVisualSize(size.x, size.y, size.z);
    const frameGeo = new THREE.BoxGeometry(visual.w, visual.h, visual.d);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.copy(pivotOffset.clone().add(size.clone().multiplyScalar(0.5)));
    frame.userData.isFrame = true;
    node.group.add(frame);
  }

  console.log('📦 Узел детали подготовлен:', {
    id: node.id,
    name: node.name,
    type: node.type,
    groupChildren: node.group.children.length,
    sectionNodeName: sectionNode.name,
    sectionNodeChildrenBefore: sectionNode.children.length,
    sectionNodeGroupChildrenBefore: sectionNode.group.children.length,
  });

  // Добавляем в группу секции (как в резервной версии createDetail)
  sectionNode.group.add(node.group);
  
  // Затем добавляем через addChildNode для связи в иерархии
  addChildNode(sectionNode, node);
  
  console.log('✅ addChildNode вызван, проверяем результат:', {
    sectionNodeChildrenAfter: sectionNode.children.length,
    sectionNodeGroupChildrenAfter: sectionNode.group.children.length,
    nodeInSectionChildren: sectionNode.children.includes(node),
    nodeGroupInSectionGroup: sectionNode.group.children.includes(node.group),
  });

  selectNode(node);

  console.log('✅ Фурнитура добавлена в секцию:', { 
    name: node.name, 
    section: sectionNode.name,
    size: { x: size.x, y: size.y, z: size.z },
    nodePosition: node.group.position,
    sectionPosition: sectionNode.group.position,
  });
}

// Сохранить выбранный GLB как фурнитуру
function saveGLBAsHardware() {
  if (!currentSelectedNode || currentSelectedNode.type !== 'glb') {
    alert('Выберите загруженную модель (GLB) для сохранения как фурнитура');
    return;
  }

  const exporter = new GLTFExporter();
  const glbScene = currentSelectedNode.group.children.find(c => !c.userData?.isFrame && !c.userData?.isAxes);
  
  if (!glbScene) {
    alert('Не удалось найти модель для экспорта');
    return;
  }

  exporter.parse(
    glbScene,
    (glb) => {
      let arrayBuffer: ArrayBuffer;
      if (glb instanceof ArrayBuffer) {
        arrayBuffer = glb;
      } else {
        arrayBuffer = new Uint8Array(glb as Array<number>).buffer;
      }

      // Создаем blob и скачиваем
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentSelectedNode.name}_hardware.glb`;
      link.click();
      URL.revokeObjectURL(url);

      console.log('✅ Фурнитура сохранена:', link.download);
      alert(`Фурнитура сохранена как: ${link.download}`);
    },
    (error) => {
      console.error('❌ Ошибка экспорта фурнитуры:', error);
      alert('Ошибка сохранения фурнитуры: ' + (error as Error).message);
    }
  );
}

// Сохранить модель с метаданными
function saveModelWithMetadata() {
  const node = sceneNodes[sceneNodes.length - 1];
  if (!node) {
    alert('Нет модели для сохранения');
    return;
  }

  // Экспортируем GLB (только модель, без рамок и осей)
  const exporter = new GLTFExporter();
  
  // Создаем временную группу только с мешами модели (без рамок, осей и маркеров)
  const exportGroup = new THREE.Group();
  
  // Рекурсивная функция для клонирования без рамок и осей
  const cloneWithoutHelpers = (obj: THREE.Object3D): THREE.Object3D | null => {
    // Пропускаем рамки, оси, маркеры и хелперы
    if (obj.userData?.isFrame || 
        obj.userData?.isAxes || 
        obj instanceof THREE.AxesHelper ||
        obj.name?.includes('PivotMarker') ||
        obj.name?.includes('BBox') ||
        obj.name?.includes('BBoxMinMarker') ||
        obj.name?.includes('BBoxCenterMarker') ||
        obj.name?.includes('AxisHelper') ||
        obj.name?.includes('axes') ||
        obj.name?.includes('frame')) {
      return null;
    }
    
    // Клонируем объект
    let cloned: THREE.Object3D;
    if (obj instanceof THREE.Mesh) {
      cloned = obj.clone();
    } else if (obj instanceof THREE.Group) {
      cloned = new THREE.Group();
      cloned.name = obj.name;
      cloned.position.copy(obj.position);
      cloned.rotation.copy(obj.rotation);
      cloned.scale.copy(obj.scale);
      
      // Рекурсивно клонируем детей, исключая хелперы
      obj.children.forEach(child => {
        const clonedChild = cloneWithoutHelpers(child);
        if (clonedChild) {
          cloned.add(clonedChild);
        }
      });
    } else if (obj instanceof THREE.LineSegments) {
      // Пропускаем LineSegments (это edges рамки)
      return null;
    } else if (obj instanceof THREE.AxesHelper || obj instanceof THREE.GridHelper) {
      // Пропускаем все хелперы
      return null;
    } else {
      // Для других типов объектов пробуем клонировать
      try {
        cloned = obj.clone();
      } catch (e) {
        console.warn('Не удалось клонировать объект:', obj.type, obj.name);
        return null;
      }
    }
    
    return cloned;
  };
  
  node.group.children.forEach(child => {
    const cloned = cloneWithoutHelpers(child);
    if (cloned) {
      exportGroup.add(cloned);
    }
  });
  
  exporter.parse(
    exportGroup,
    async (glb) => {
      let arrayBuffer: ArrayBuffer;
      if (glb instanceof ArrayBuffer) {
        arrayBuffer = glb;
      } else {
        arrayBuffer = new Uint8Array(glb as Array<number>).buffer;
      }

      // Создаем метаданные (размеры без рамок и осей)
      const bbox = new THREE.Box3().setFromObject(exportGroup);
      const size = bbox.max.clone().sub(bbox.min);
      
      // Очищаем временную группу
      exportGroup.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      
      // Получаем текущий масштаб если модель была изменена
      const gltfScene = node.group.children.find(
        child => child.type === 'Group' && !child.userData.isFrame && !child.userData.isAxes
      ) as THREE.Group | undefined;
      const currentScale = gltfScene ? gltfScene.scale : { x: 1, y: 1, z: 1 };
      
      const metadata = {
        name: node.name,
        type: node.type,
        size: {
          width: size.x,
          height: size.y,
          depth: size.z,
        },
        originalSize: node.metadata?.originalSize || { x: size.x, y: size.y, z: size.z },
        currentScale: { x: currentScale.x, y: currentScale.y, z: currentScale.z },
        animations: node.metadata?.animations || [],
        sourceFile: node.metadata?.sourceFile,
        isGLB: node.metadata?.isGLB || false,
        version: '1.0',
        createdAt: new Date().toISOString(),
      };

      // Конвертируем GLB в base64 для включения в JSON
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));

      const modelData = {
        metadata,
        glb: base64,
      };

      // Сохраняем в localStorage для использования в каталоге
      try {
        const savedModelsKey = 'savedModels';
        const existingModelsJson = localStorage.getItem(savedModelsKey);
        let savedModels: any[] = [];
        
        if (existingModelsJson) {
          try {
            savedModels = JSON.parse(existingModelsJson);
          } catch (e) {
            console.warn('Ошибка парсинга сохраненных моделей из localStorage:', e);
          }
        }
        
        // Проверяем, нет ли уже модели с таким именем
        const existingIndex = savedModels.findIndex(m => m.metadata.name === node.name);
        if (existingIndex >= 0) {
          const overwrite = confirm(`Модель "${node.name}" уже существует. Перезаписать?`);
          if (overwrite) {
            savedModels[existingIndex] = modelData;
          } else {
            // Добавляем с уникальным именем
            metadata.name = `${node.name} (${new Date().toLocaleString()})`;
            modelData.metadata = metadata;
            savedModels.push(modelData);
          }
        } else {
          savedModels.push(modelData);
        }
        
        localStorage.setItem(savedModelsKey, JSON.stringify(savedModels));
        console.log('✅ Модель сохранена в localStorage для каталога:', node.name);
        alert(`Модель "${metadata.name}" сохранена в каталог!\n\nТеперь вы можете:\n1. Открыть index.html\n2. Нажать "Загрузить модель из конструктора"\n3. Выбрать вашу модель из списка`);
      } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
        alert('Не удалось сохранить в localStorage: ' + (e as Error).message);
      }

      // Также сохраняем как JSON файл для резервной копии
      const jsonStr = JSON.stringify(modelData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${node.name || 'model'}.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('✅ Модель также сохранена как JSON файл:', node.name);
    },
    undefined as unknown as (error: ErrorEvent) => void,
    { binary: true } as any
  );
}

// Система управления типами модулей
const MODULE_TYPES_KEY = 'moduleTypes';
const DEFAULT_MODULE_TYPES = [
  { value: 'box', label: 'Корпус' },
  { value: 'shelf', label: 'Полка' },
  { value: 'panel', label: 'Панель' },
];

function getModuleTypes(): Array<{ value: string; label: string }> {
  const stored = localStorage.getItem(MODULE_TYPES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Ошибка загрузки типов модулей:', e);
    }
  }
  return [...DEFAULT_MODULE_TYPES];
}

function saveModuleTypes(types: Array<{ value: string; label: string }>): void {
  localStorage.setItem(MODULE_TYPES_KEY, JSON.stringify(types));
}

function addModuleType(typeName: string): boolean {
  const types = getModuleTypes();
  const normalized = typeName.trim().toLowerCase();
  const value = normalized.replace(/\s+/g, '_');
  
  if (normalized === '' || types.some(t => t.value === value || t.label.toLowerCase() === normalized)) {
    return false;
  }
  
  types.push({ value, label: typeName.trim() });
  saveModuleTypes(types);
  return true;
}

function removeModuleType(typeValue: string): boolean {
  const types = getModuleTypes();
  const index = types.findIndex(t => t.value === typeValue);
  if (index === -1) return false;
  types.splice(index, 1);
  saveModuleTypes(types);
  return true;
}

// Открыть модалку управления типами модулей
function openModuleTypesModal() {
  const backdrop = document.getElementById('module-types-modal-backdrop');
  if (!backdrop) return;
  
  backdrop.style.display = 'flex';
  
  const typesList = document.getElementById('module-types-list');
  const newTypeInput = document.getElementById('module-types-inp-new') as HTMLInputElement;
  const addTypeBtn = document.getElementById('btn-add-module-type');
  const closeBtn = document.getElementById('module-types-modal-close');
  const closeBtn2 = document.getElementById('module-types-modal-close-btn');
  
  const renderTypes = () => {
    if (!typesList) return;
    typesList.innerHTML = '';
    
    const types = getModuleTypes();
    types.forEach(type => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '8px 12px';
      item.style.border = '1px solid #e0e0e0';
      item.style.borderRadius = '4px';
      item.style.fontSize = '13px';
      
      const label = document.createElement('span');
      label.textContent = type.label;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.style.background = 'none';
      deleteBtn.style.border = 'none';
      deleteBtn.style.color = '#c00';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.fontSize = '18px';
      deleteBtn.style.padding = '0 8px';
      deleteBtn.onclick = () => {
        if (confirm(`Удалить тип "${type.label}"?`)) {
          if (removeModuleType(type.value)) {
            renderTypes();
            // Обновляем список типов в модалке создания модуля
            updateModuleTypesSelect();
          }
        }
      };
      
      item.appendChild(label);
      item.appendChild(deleteBtn);
      typesList.appendChild(item);
    });
  };
  
  renderTypes();
  
  const handleClose = () => {
    backdrop.style.display = 'none';
    if (newTypeInput) newTypeInput.value = '';
  };
  
  if (addTypeBtn) {
    addTypeBtn.onclick = () => {
      const typeName = newTypeInput?.value.trim();
      if (!typeName) {
        alert('Введите название типа');
        return;
      }
      
      if (addModuleType(typeName)) {
        renderTypes();
        if (newTypeInput) newTypeInput.value = '';
        
        // Обновляем список типов в модалке создания модуля
        updateModuleTypesSelect();
      } else {
        alert('Такой тип уже существует или название пустое');
      }
    };
  }
  
  if (closeBtn) closeBtn.onclick = handleClose;
  if (closeBtn2) closeBtn2.onclick = handleClose;
  
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      handleClose();
    }
  };
  
  if (newTypeInput) {
    newTypeInput.onkeydown = (e) => {
      if (e.key === 'Enter' && addTypeBtn) {
        addTypeBtn.click();
      }
    };
    setTimeout(() => newTypeInput.focus(), 100);
  }
}

// Обновить список типов в select модалки создания модуля
function updateModuleTypesSelect() {
  const select = document.getElementById('inp-type') as HTMLSelectElement;
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '';
  
  const types = getModuleTypes();
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type.value;
    option.textContent = type.label;
    select.appendChild(option);
  });
  
  // Восстанавливаем выбранное значение, если оно еще существует
  if (types.some(t => t.value === currentValue)) {
    select.value = currentValue;
  } else if (types.length > 0) {
    select.value = types[0].value;
  }
}

// Типы элементов для каталога
// Система управления типами элементов
const ELEMENT_TYPES_KEY = 'elementTypes';
const DEFAULT_ELEMENT_TYPES = ['facade', 'wall', 'bottom', 'top', 'shelf', 'groove', 'confirmat', 'section', 'other'];

function getElementTypes(): string[] {
  const stored = localStorage.getItem(ELEMENT_TYPES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Ошибка загрузки типов элементов:', e);
    }
  }
  return [...DEFAULT_ELEMENT_TYPES];
}

function saveElementTypes(types: string[]): void {
  localStorage.setItem(ELEMENT_TYPES_KEY, JSON.stringify(types));
}

function addElementType(typeName: string): boolean {
  const types = getElementTypes();
  const normalized = typeName.trim().toLowerCase();
  if (normalized === '' || types.includes(normalized)) {
    return false;
  }
  types.push(normalized);
  saveElementTypes(types);
  return true;
}

function removeElementType(typeName: string): boolean {
  const types = getElementTypes();
  const index = types.indexOf(typeName);
  if (index === -1) return false;
  types.splice(index, 1);
  saveElementTypes(types);
  return true;
}

type CatalogElementType = 'facade' | 'wall' | 'bottom' | 'top' | 'shelf' | 'groove' | 'confirmat' | 'section' | 'other' | string;

interface CatalogElement {
  id: string;
  name: string;
  type: CatalogElementType;
  elementType: string; // Тип элемента из node.type
  metadata: {
    name: string;
    type: string;
    size: { width: number; height: number; depth: number };
    createdAt: string;
    element_type?: string; // Тип каталога (из catalogTypes, например 'kitchens', 'cabinets') - как в референсе
    cabinet_tag?: string; // Тег группы модулей (из catalogGroups) - как в референсе
    article?: string; // Артикул элемента
  };
  glb: string; // base64 encoded GLB
  groupId?: string; // ID группы каталога (\"Группы модулей\")
  clodisJSON?: ClodisItem[]; // Clodis JSON структура модуля (как в референсе - data поле)
}

// Текущий редактируемый элемент каталога (если модалка открыта для существующего модуля)
let currentEditingCatalogElement: CatalogElement | null = null;

// Сохранить элемент в каталог
// Открыть модалку выбора типа элемента для каталога
function openSelectTypeModal(): Promise<string | null> {
  return new Promise((resolve) => {
    const backdrop = document.getElementById('select-type-modal-backdrop');
    if (!backdrop) {
      resolve(null);
      return;
    }
    
    backdrop.style.display = 'flex';
    
    const select = document.getElementById('select-type-inp') as HTMLSelectElement;
    const newTypeInput = document.getElementById('select-type-new-inp') as HTMLInputElement;
    const addTypeBtn = document.getElementById('select-type-add-btn');
    const closeBtn = document.getElementById('select-type-modal-close');
    const cancelBtn = document.getElementById('select-type-modal-cancel');
    const confirmBtn = document.getElementById('select-type-modal-confirm');
    
    const typeLabels: { [key: string]: string } = {
      'facade': 'Фасад',
      'wall': 'Стенка',
      'bottom': 'Дно',
      'top': 'Крышка',
      'shelf': 'Полка',
      'groove': 'Паз',
      'confirmat': 'Конфирмат',
      'section': 'Секция',
      'other': 'Другое',
    };
    
    // Функция для обновления списка типов
    const updateTypesList = () => {
      if (!select) return;
      select.innerHTML = '';
      const types = getElementTypes();
      
      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = typeLabels[type] || (type.charAt(0).toUpperCase() + type.slice(1));
        select.appendChild(option);
      });
      
      // Если нет выбранного значения, выбираем "other" по умолчанию
      if (!select.value) {
        select.value = 'other';
      }
    };
    
    // Загружаем типы элементов
    updateTypesList();
    
    // Обработчик добавления нового типа
    const handleAddType = () => {
      const typeName = newTypeInput?.value.trim();
      if (!typeName) {
        alert('Введите название типа');
        if (newTypeInput) newTypeInput.focus();
        return;
      }
      
      if (addElementType(typeName)) {
        // Обновляем список типов
        updateTypesList();
        
        // Выбираем только что созданный тип
        select.value = typeName.toLowerCase();
        
        // Очищаем поле ввода
        if (newTypeInput) newTypeInput.value = '';
        
        console.log('✅ Новый тип добавлен:', typeName);
      } else {
        alert('Такой тип уже существует или название пустое');
        if (newTypeInput) {
          newTypeInput.focus();
          newTypeInput.select();
        }
      }
    };
    
    if (addTypeBtn) {
      addTypeBtn.onclick = handleAddType;
    }
    
    if (newTypeInput) {
      newTypeInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddType();
        }
      };
    }
    
    const handleClose = () => {
      backdrop.style.display = 'none';
      resolve(null);
    };
    
    const handleConfirm = () => {
      const selectedType = select?.value || null;
      backdrop.style.display = 'none';
      resolve(selectedType);
    };
    
    if (closeBtn) closeBtn.onclick = handleClose;
    if (cancelBtn) cancelBtn.onclick = handleClose;
    if (confirmBtn) confirmBtn.onclick = handleConfirm;
    
    backdrop.onclick = (e) => {
      if (e.target === backdrop) {
        handleClose();
      }
    };
    
    if (select) {
      select.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        }
      };
      setTimeout(() => select.focus(), 100);
    }
  });
}

async function saveElementToCatalog(elementType?: CatalogElementType) {
  if (!currentSelectedNode) {
    alert('Выберите элемент для сохранения в каталог');
    return;
  }

  // Если тип не указан, спрашиваем у пользователя
  if (!elementType) {
    const typeMap: { [key: string]: CatalogElementType } = {
      'facade': 'facade',
      'wall': 'wall',
      'bottom': 'bottom',
      'top': 'top',
      'shelf': 'shelf',
      'groove': 'groove',
      'confirmat': 'confirmat',
      'section': 'section',
    };
    
    const nodeType = currentSelectedNode.type;
    elementType = typeMap[nodeType] || 'other';
    
    // Если тип не определен автоматически, показываем модалку выбора
    if (elementType === 'other') {
      const selectedType = await openSelectTypeModal();
      if (!selectedType) {
        return; // Пользователь отменил
      }
      elementType = selectedType as CatalogElementType;
    }
  }

  const node = currentSelectedNode;
  const exporter = new GLTFExporter();
  
  // Создаем временную группу только с мешами модели (без рамок, осей и маркеров)
  const exportGroup = new THREE.Group();
  
  // Рекурсивная функция для клонирования без рамок и осей
  const cloneWithoutHelpers = (obj: THREE.Object3D): THREE.Object3D | null => {
    if (obj.userData?.isFrame || 
        obj.userData?.isAxes || 
        obj instanceof THREE.AxesHelper ||
        obj.name?.includes('PivotMarker') ||
        obj.name?.includes('BBox') ||
        obj.name?.includes('frame')) {
      return null;
    }
    
    let cloned: THREE.Object3D;
    if (obj instanceof THREE.Mesh) {
      cloned = obj.clone();
    } else if (obj instanceof THREE.Group) {
      cloned = new THREE.Group();
      cloned.name = obj.name;
      cloned.position.copy(obj.position);
      cloned.rotation.copy(obj.rotation);
      cloned.scale.copy(obj.scale);
      
      obj.children.forEach(child => {
        const clonedChild = cloneWithoutHelpers(child);
        if (clonedChild) {
          cloned.add(clonedChild);
        }
      });
    } else if (obj instanceof THREE.LineSegments) {
      return null;
    } else {
      try {
        cloned = obj.clone();
      } catch (e) {
        return null;
      }
    }
    
    return cloned;
  };
  
  node.group.children.forEach(child => {
    const cloned = cloneWithoutHelpers(child);
    if (cloned) {
      exportGroup.add(cloned);
    }
  });
  
  exporter.parse(
    exportGroup,
    (glb) => {
      let arrayBuffer: ArrayBuffer;
      if (glb instanceof ArrayBuffer) {
        arrayBuffer = glb;
      } else {
        arrayBuffer = new Uint8Array(glb as Array<number>).buffer;
      }

      // Создаем метаданные
      const bbox = new THREE.Box3().setFromObject(exportGroup);
      const size = bbox.max.clone().sub(bbox.min);
      
      // Очищаем временную группу
      exportGroup.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      
      const metadata = {
        name: node.name,
        type: node.type,
        size: {
          width: size.x,
          height: size.y,
          depth: size.z,
        },
        createdAt: new Date().toISOString(),
      };

      // Конвертируем GLB в base64
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));

      const catalogElement: CatalogElement = {
        id: generateId(),
        name: node.name,
        type: elementType,
        elementType: node.type,
        metadata,
        glb: base64,
        groupId: currentCatalogGroupId || undefined,
      };

      // Сохраняем в localStorage
      try {
        const catalogKey = 'elementCatalog';
        const existingCatalogJson = localStorage.getItem(catalogKey);
        let catalog: CatalogElement[] = [];
        
        if (existingCatalogJson) {
          try {
            catalog = JSON.parse(existingCatalogJson);
          } catch (e) {
            console.warn('Ошибка парсинга каталога из localStorage:', e);
          }
        }
        
        // Проверяем, нет ли уже элемента с таким именем и типом
        const existingIndex = catalog.findIndex(e => e.name === node.name && e.type === elementType);
        if (existingIndex >= 0) {
          const overwrite = confirm(`Элемент "${node.name}" типа "${elementType}" уже существует в каталоге. Перезаписать?`);
          if (overwrite) {
            catalog[existingIndex] = catalogElement;
          } else {
            catalogElement.name = `${node.name} (${new Date().toLocaleString()})`;
            catalogElement.metadata.name = catalogElement.name;
            catalog.push(catalogElement);
          }
        } else {
          catalog.push(catalogElement);
        }
        
        localStorage.setItem(catalogKey, JSON.stringify(catalog));
        console.log('✅ Элемент сохранен в каталог:', node.name, 'тип:', elementType);
        alert(`Элемент "${catalogElement.name}" сохранен в каталог как "${elementType}"!`);
        
        // Обновляем отображение каталога
        renderCatalog();
      } catch (e) {
        console.error('Ошибка сохранения в каталог:', e);
        alert('Не удалось сохранить в каталог: ' + (e as Error).message);
      }
    },
    (error) => {
      console.error('❌ Ошибка экспорта элемента:', error);
      alert('Ошибка сохранения элемента: ' + (error as Error).message);
    },
    { binary: true } as any
  );
}

// Отобразить каталог элементов
function renderCatalog(filterType?: string) {
  const catalogList = document.getElementById('catalog-list');
  if (!catalogList) return;

  try {
    const catalogKey = 'elementCatalog';
    const catalogJson = localStorage.getItem(catalogKey);
    let catalog: CatalogElement[] = [];
    
    if (catalogJson) {
      try {
        catalog = JSON.parse(catalogJson);
      } catch (e) {
        console.warn('Ошибка парсинга каталога:', e);
      }
    }

    // Фильтруем по типу, если указан
    if (filterType) {
      catalog = catalog.filter(element => element.type === filterType);
    }

    // Фильтр по текущей группе (если выбрана)
    if (currentCatalogGroupId) {
      catalog = catalog.filter(el => !el.groupId || el.groupId === currentCatalogGroupId);
    }

    if (catalog.length === 0) {
      if (filterType) {
        catalogList.innerHTML = `<div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">Нет элементов типа "${filterType}"</div>`;
      } else {
        catalogList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">Каталог пуст</div>';
      }
      return;
    }

    // Группируем по типам
    const groupedByType: { [key: string]: CatalogElement[] } = {};
    const typeLabels: { [key: string]: string } = {
      'facade': 'Фасады',
      'wall': 'Стенки',
      'bottom': 'Дно',
      'top': 'Крышка',
      'shelf': 'Полки',
      'groove': 'Пазы',
      'confirmat': 'Конфирматы',
      'section': 'Секции',
      'other': 'Другое',
    };

    catalog.forEach(element => {
      if (!groupedByType[element.type]) {
        groupedByType[element.type] = [];
      }
      groupedByType[element.type].push(element);
    });
    
    // Используем динамические типы для меток
    const allTypes = getElementTypes();
    allTypes.forEach(type => {
      if (!typeLabels[type]) {
        typeLabels[type] = type.charAt(0).toUpperCase() + type.slice(1);
      }
    });

    // Создаем HTML для каталога
    let html = '';
    Object.keys(groupedByType).forEach(type => {
      const elements = groupedByType[type];
      const label = typeLabels[type] || type;
      
      html += `<div style="margin-bottom: 12px;">`;
      html += `<div style="font-weight: 600; font-size: 11px; color: #666; margin-bottom: 6px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px;">${label} (${elements.length})</div>`;
      
      elements.forEach(element => {
        const size = element.metadata.size;
        const sizeStr = `${Math.round(size.width * 1000)}×${Math.round(size.height * 1000)}×${Math.round(size.depth * 1000)} мм`;
        html += `<div class="catalog-item" data-element-id="${element.id}" style="padding: 8px; margin-bottom: 4px; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; background: #fff; transition: background 0.15s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='#fff'">`;
        html += `<div style="font-size: 12px; font-weight: 500; margin-bottom: 2px;">${element.name}</div>`;
        html += `<div style="font-size: 10px; color: #999;">${sizeStr}</div>`;
        html += `</div>`;
      });
      
      html += `</div>`;
    });

    catalogList.innerHTML = html;

    // Добавляем обработчики клика на элементы каталога
    catalogList.querySelectorAll('.catalog-item').forEach(item => {
      item.addEventListener('click', () => {
        const elementId = (item as HTMLElement).dataset.elementId;
        if (elementId) {
          addElementFromCatalog(elementId);
        }
      });
    });

    // Показываем кнопку "Добавить из каталога" если есть элементы
    const addFromCatalogBtn = document.getElementById('btn-add-from-catalog');
    if (addFromCatalogBtn) {
      addFromCatalogBtn.style.display = 'block';
    }
  } catch (error) {
    console.error('Ошибка отображения каталога:', error);
    catalogList.innerHTML = '<div style="padding: 20px; text-align: center; color: #c00; font-size: 12px;">Ошибка загрузки каталога</div>';
  }
}

// === МОДАЛЬНЫЙ СПИСОК КАТАЛОГА (ТАБЛИЦА) ===

function renderCatalogModal(filterText: string = '') {
  const tbody = document.querySelector<HTMLTableSectionElement>('#element-catalog-table tbody');
  if (!tbody) return;

  try {
    const catalogKey = 'elementCatalog';
    const catalogJson = localStorage.getItem(catalogKey);
    let catalog: CatalogElement[] = [];

    if (catalogJson) {
      try {
        catalog = JSON.parse(catalogJson);
      } catch (e) {
        console.warn('Ошибка парсинга каталога для модалки:', e);
      }
    }

    const q = filterText.trim().toLowerCase();
    if (q) {
      catalog = catalog.filter(el => {
        const name = el.name?.toLowerCase() || '';
        const type = el.type?.toLowerCase() || '';
        const article = (el.metadata as any)?.article?.toLowerCase?.() || '';
        return name.includes(q) || type.includes(q) || article.includes(q);
      });
    }

    // Фильтр по текущей группе
    if (currentCatalogGroupId) {
      catalog = catalog.filter(el => !el.groupId || el.groupId === currentCatalogGroupId);
    }

    if (catalog.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:16px; color:#999;">Каталог пуст</td></tr>`;
      return;
    }

    const rows: string[] = [];
    catalog.forEach((el, index) => {
      const size = el.metadata.size;
      const sizeStr = `${Math.round(size.width * 1000)}×${Math.round(size.height * 1000)}×${Math.round(size.depth * 1000)} мм`;
      const createdAt = (el.metadata as any)?.createdAt
        ? new Date((el.metadata as any).createdAt).toLocaleDateString()
        : '';

      rows.push(`
        <tr data-element-id="${el.id}">
          <td>${index + 1}</td>
          <td>${el.name}</td>
          <td>${el.type}</td>
          <td>${sizeStr}</td>
          <td>${createdAt}</td>
          <td>
            <button class="btn btn-primary btn-sm" data-action="add">Добавить</button>
          </td>
        </tr>
      `);
    });

    tbody.innerHTML = rows.join('');

    // Обработчики на кнопки "Добавить"
    tbody.querySelectorAll('button[data-action="add"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = (btn as HTMLElement).closest('tr');
        const id = tr?.getAttribute('data-element-id');
        if (id) {
          addElementFromCatalog(id);
        }
      });
    });
  } catch (error) {
    console.error('Ошибка отображения модального каталога:', error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:16px; color:#c00;">Ошибка загрузки каталога</td></tr>`;
  }
}

// Добавить элемент из каталога в выбранную секцию
function addElementFromCatalog(elementId: string) {
  if (!currentSelectedNode) {
    alert('Выберите секцию для добавления элемента');
    return;
  }

  // Проверяем что выбранная секция - это секция или корпус
  let targetNode = currentSelectedNode;
  while (targetNode && targetNode.type !== 'section' && targetNode.type !== 'body') {
    targetNode = targetNode.parent || null;
  }

  if (!targetNode) {
    alert('Выберите секцию или корпус для добавления элемента');
    return;
  }

  try {
    const catalogKey = 'elementCatalog';
    const catalogJson = localStorage.getItem(catalogKey);
    if (!catalogJson) {
      alert('Каталог пуст');
      return;
    }

    const catalog: CatalogElement[] = JSON.parse(catalogJson);
    const element = catalog.find(e => e.id === elementId);
    
    if (!element) {
      alert('Элемент не найден в каталоге');
      return;
    }

    // Декодируем GLB из base64
    const binaryString = atob(element.glb);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;
    
    // Создаем Blob и загружаем через GLTFLoader
    const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url);
        
        const gltfScene = gltf.scene.clone();
        
        // Вычисляем bbox для позиционирования
        const bbox = new THREE.Box3().setFromObject(gltfScene);
        const size = bbox.max.clone().sub(bbox.min);
        const pivotOffset = bbox.min.clone().negate();
        
        // Смещаем все меши так, чтобы pivot был в (0,0,0)
        gltfScene.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            child.position.add(pivotOffset);
          }
        });
        
        // Создаем узел для элемента из каталога
        const newNode: SceneNode = {
          id: generateId(),
          name: element.name,
          type: element.elementType as any,
          group: new THREE.Group(),
          children: [],
          parent: targetNode,
          metadata: {
            ...element.metadata,
            isFromCatalog: true,
            catalogId: element.id,
          },
        };
        
        newNode.group.add(gltfScene);
        
        // Позиционируем элемент в секции
        // Для фасадов и деталей - позиция по умолчанию (0,0,0) относительно секции
        // Пользователь может потом переместить через свойства
        newNode.group.position.set(0, 0, 0);
        
        // Сохраняем размеры в metadata
        newNode.metadata.size = { x: size.x, y: size.y, z: size.z };
        
        // Добавляем в секцию
        targetNode.group.add(newNode.group);
        addChildNode(targetNode, newNode);
        selectNode(newNode);
        
        // Обновляем иерархию
        renderHierarchy();
        
        console.log('✅ Элемент из каталога добавлен:', element.name);
        console.log('  Тип:', element.elementType);
        console.log('  Размеры:', size);
        console.log('  В секцию:', targetNode.name);
      },
      undefined,
      (error) => {
        console.error('❌ Ошибка загрузки элемента из каталога:', error);
        alert('Ошибка загрузки элемента: ' + (error as Error).message);
      }
    );
  } catch (error) {
    console.error('Ошибка добавления элемента из каталога:', error);
    alert('Ошибка: ' + (error as Error).message);
  }
}

function exportLastNodeGLB() {
  const node = sceneNodes[sceneNodes.length - 1];
  if (!node) return;
  const exporter = new GLTFExporter();
  exporter.parse(
    node.group,
    glb => {
      let arrayBuffer: ArrayBuffer;
      if (glb instanceof ArrayBuffer) {
        arrayBuffer = glb;
      } else {
        arrayBuffer = new Uint8Array(glb as Array<number>).buffer;
      }
      const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${node.name || 'frame'}.glb`;
      a.click();
      URL.revokeObjectURL(url);
    },
    undefined as unknown as (error: ErrorEvent) => void,
    { binary: true } as any
  );
}

function applyDecor(id: string) {
  const decor = decorCatalog.find(d => d.id === id);
  if (!decor) return;
  currentDecor = decor;
  if (selectedMesh) {
    const mat = createMaterial(decor.color);
    selectedMesh.material = mat;
    selectedMesh.userData.decor = decor.id;
  }
}

function applyEdge(id: string) {
  const edge = edgeCatalog.find(e => e.id === id);
  if (!edge) return;
  if (selectedMesh) {
    selectedMesh.userData.edgeColor = edge.color;
  }
}

function updateEdgeFlags(flags: Partial<typeof edgeFlags>) {
  edgeFlags = { ...edgeFlags, ...flags };
  if (selectedMesh) {
    selectedMesh.userData.edgeFlags = { ...edgeFlags };
  }
}

function renderDecorList() {
  const list = document.getElementById('decor-list');
  if (!list) return;
  list.innerHTML = '';
  decorCatalog.forEach(item => {
    const div = document.createElement('div');
    div.className = 'swatch';
    div.dataset.id = item.id;
    const color = document.createElement('div');
    color.className = 'swatch-color';
    color.style.background = item.color;
    const info = document.createElement('div');
    info.className = 'swatch-info';
    info.innerHTML = `<div>${item.name}</div><div style="color:#777;">${item.id}</div>`;
    div.appendChild(color);
    div.appendChild(info);
    div.onclick = () => applyDecor(item.id);
    list.appendChild(div);
  });
}

function renderEdgeList() {
  const list = document.getElementById('edge-list');
  if (!list) return;
  list.innerHTML = '';
  edgeCatalog.forEach(item => {
    const div = document.createElement('div');
    div.className = 'swatch';
    div.dataset.id = item.id;
    const color = document.createElement('div');
    color.className = 'swatch-color';
    color.style.background = item.color;
    const info = document.createElement('div');
    info.className = 'swatch-info';
    info.innerHTML = `<div>${item.name}</div><div style="color:#777;">${item.id}</div>`;
    div.appendChild(color);
    div.appendChild(info);
    div.onclick = () => applyEdge(item.id);
    list.appendChild(div);
  });
}

// ⭐ ВАЖНО: Объявляем openTypeItemsModal ДО wireUI(), чтобы экспортировать её раньше
// Объявление переменных для страницы списка элементов типа
let typeItemsContainer: HTMLDivElement | null = null;
let typeItemsTitle: HTMLDivElement | null = null;
let typeItemsSearch: HTMLInputElement | null = null;
let typeItemsTableBody: HTMLTableSectionElement | null = null;
let typeItemsBody: HTMLTableSectionElement | null = null; // ⭐ ВАЖНО: для renderTypeItemsTable
let typeItemsPagination: HTMLDivElement | null = null;
let typeItemsPaginationControls: HTMLDivElement | null = null; // ⭐ ВАЖНО: для renderTypeItemsPagination
let typeItemsCategoryFilter: HTMLSelectElement | null = null; // ⭐ ВАЖНО: для renderTypeItemsTable
let currentTypeItemsId: string | null = null;
let typeItemsAddBtn: HTMLElement | null = null;
let typeItemsAddBottomBtn: HTMLElement | null = null;
let typeItemsCategoriesBtn: HTMLElement | null = null;
let typeItemsParamsBtn: HTMLElement | null = null;
let typeItemsResetMaterialsBtn: HTMLElement | null = null;
let typeItemsChangeVarsBtn: HTMLElement | null = null;
let typeItemsCopyBtn: HTMLElement | null = null;
let typeItemsSelectAll: HTMLInputElement | null = null;
let typeItemsPerPage: HTMLSelectElement | null = null;
let catalogTypesFolders: HTMLElement | null = null;
let catalogMenuItemTypes: HTMLElement | null = null;
let catalogItemEditClose: HTMLElement | null = null;
let catalogItemEditBackdrop: HTMLDivElement | null = null;
let catalogCategoriesBackdrop: HTMLDivElement | null = null;
let catalogCategoriesClose: HTMLElement | null = null;
let catalogCategoriesAdd: HTMLElement | null = null;
let typesAdd: HTMLElement | null = null;
let typesSearch: HTMLInputElement | null = null;
let catalogGroupsFolders: HTMLElement | null = null;
let groupsAdd: HTMLElement | null = null;
let groupsSearch: HTMLInputElement | null = null;

// Состояние пагинации для таблицы элементов типа
let typeItemsCurrentPage = 1;
let typeItemsPerPageCount = 20;
let typeItemsFilteredElements: CatalogElement[] = [];

// ⭐ ВАЖНО: Объявляем функцию openTypeItemsModal ДО wireUI() и экспортируем сразу
function openTypeItemsModal(typeId: string, typeName: string) {
  console.log('📦 [openTypeItemsModal] Вызвана с параметрами:', { typeId, typeName });
  
  // Проверяем, что переменные инициализированы (инициализируем если нужно)
  if (!typeItemsContainer) {
    console.warn('⚠️ [openTypeItemsModal] typeItemsContainer не найден, инициализируем...');
    typeItemsContainer = document.getElementById('type-elements-container') as HTMLDivElement | null;
    if (!typeItemsContainer) {
      console.error('❌ [openTypeItemsModal] Не удалось найти type-elements-container в DOM');
      return;
    }
    console.log('✅ [openTypeItemsModal] typeItemsContainer инициализирован');
  }
  
  // Инициализируем остальные переменные если нужно
  if (!typeItemsTitle) {
    typeItemsTitle = document.getElementById('type-elements-title') as HTMLDivElement | null;
  }
  if (!typeItemsSearch) {
    typeItemsSearch = document.getElementById('type-elements-search') as HTMLInputElement | null;
  }
  
  // ⭐ СКРЫВАЕМ ВСЕ ДРУГИЕ КОНТЕНТЫ ПЕРЕД ОТКРЫТИЕМ СТРАНИЦЫ
  // ⚠️ ВАЖНО: НЕ скрываем type-elements-container, он нужен для отображения
  if ((window as any).AdminPanel && typeof (window as any).AdminPanel.hideAllAdminContent === 'function') {
    (window as any).AdminPanel.hideAllAdminContent();
  } else {
    // Fallback: скрываем основные контенты вручную
    const contentIds = [
      'admin-section-container',
      'materials-manager-backdrop',
      'materials-manager',
      'catalog-item-edit-backdrop', // ⭐ УСТАРЕВШЕЕ (для совместимости)
      'catalog-item-edit-container', // ⭐ НОВОЕ (по референсу - блок контента, не модалка)
      'type-elements-backdrop', // Скрываем backdrop если есть, но НЕ container
      'type-elements-backdrop-dynamic'
    ];
    contentIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });
  }
  
  // ⭐ ВАЖНО: Убеждаемся, что #app не скрыт (контейнер находится вне #app, но на всякий случай)
  const appElement = document.getElementById('app');
  if (appElement) {
    const appStyle = window.getComputedStyle(appElement);
    if (appStyle.display === 'none') {
      console.warn('⚠️ [openTypeItemsModal] #app скрыт, но type-elements-container вне #app, продолжаем');
    }
  }
  
  currentTypeItemsId = typeId;
  typeItemsCurrentPage = 1;
  console.log('📦 [openTypeItemsModal] currentTypeItemsId установлен:', currentTypeItemsId);
  
  const titleEl = typeItemsTitle || document.getElementById('type-elements-title') as HTMLDivElement | null;
  if (titleEl) {
    titleEl.textContent = `Список ${typeName}`;
    console.log('📦 [openTypeItemsModal] Заголовок установлен:', titleEl.textContent);
  } else {
    console.warn('⚠️ [openTypeItemsModal] typeItemsTitle не найден');
  }
  
  const searchEl = typeItemsSearch || document.getElementById('type-elements-search') as HTMLInputElement | null;
  if (searchEl) {
    searchEl.value = '';
    console.log('📦 [openTypeItemsModal] Поиск очищен');
  } else {
    console.warn('⚠️ [openTypeItemsModal] typeItemsSearch не найден');
  }
  
  const containerEl = typeItemsContainer || document.getElementById('type-elements-container') as HTMLDivElement | null;
  if (!containerEl) {
    console.error('❌ [openTypeItemsModal] Не удалось найти страницу type-elements-container');
    return;
  }
  
  console.log('📦 [openTypeItemsModal] Контейнер найден, открываем страницу');
  
  // ⭐ ВАЖНО: Проверяем родительские элементы и убеждаемся, что они видимы
  let parent = containerEl.parentElement;
  while (parent && parent !== document.body) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.display === 'none') {
      console.warn('⚠️ [openTypeItemsModal] Родитель скрыт, делаем видимым:', parent.tagName, parent.id);
      (parent as HTMLElement).style.display = 'block';
    }
    parent = parent.parentElement;
  }
  
  // Используем setProperty с important для гарантии применения стилей
  // ⭐ ВАЖНО: left должен быть 250px чтобы не перекрывать левый сайдбар
  containerEl.style.setProperty('display', 'block', 'important');
  containerEl.style.setProperty('position', 'fixed', 'important');
  containerEl.style.setProperty('top', '0', 'important');
  containerEl.style.setProperty('right', '0', 'important');
  containerEl.style.setProperty('bottom', '0', 'important');
  containerEl.style.setProperty('left', '250px', 'important'); // ⭐ ИСПРАВЛЕНО: было '0', должно быть '250px'
  containerEl.style.setProperty('width', 'calc(100vw - 250px)', 'important'); // ⭐ ИСПРАВЛЕНО: было '100%', должно быть 'calc(100vw - 250px)'
  containerEl.style.setProperty('height', '100vh', 'important'); // ⭐ ИСПРАВЛЕНО: было '100%', должно быть '100vh'
  containerEl.style.setProperty('z-index', '10002', 'important');
  containerEl.style.setProperty('background', '#fff', 'important');
  containerEl.style.setProperty('visibility', 'visible', 'important');
  containerEl.style.setProperty('opacity', '1', 'important');
  containerEl.style.setProperty('overflow-y', 'auto', 'important');
  containerEl.style.setProperty('overflow-x', 'hidden', 'important');
  
  // Принудительно пересчитываем layout
  void containerEl.offsetWidth; // Force reflow
  
  // Проверяем вычисленные стили после установки
  const computedStyle = window.getComputedStyle(containerEl);
  const rect = containerEl.getBoundingClientRect();
  console.log('📦 [openTypeItemsModal] Стили установлены, проверка:', {
    display: computedStyle.display,
    position: computedStyle.position,
    top: computedStyle.top,
    right: computedStyle.right,
    bottom: computedStyle.bottom,
    left: computedStyle.left,
    width: computedStyle.width,
    height: computedStyle.height,
    zIndex: computedStyle.zIndex,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    boundingRect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    }
  });
  
  // ⚠️ ВАЖНО: Проверяем, что контейнер действительно виден
  if (computedStyle.display === 'none' || rect.width === 0 || rect.height === 0) {
    console.error('❌ [openTypeItemsModal] КРИТИЧЕСКАЯ ОШИБКА: Контейнер не отображается!');
    console.error('  display:', computedStyle.display);
    console.error('  width:', computedStyle.width, 'height:', computedStyle.height);
    console.error('  rect.width:', rect.width, 'rect.height:', rect.height);
    
    // Попытка принудительного показа через прямое изменение inline-стиля
    containerEl.removeAttribute('style');
    containerEl.style.cssText = 'display:block !important; position:fixed !important; top:0 !important; right:0 !important; bottom:0 !important; left:250px !important; width:calc(100vw - 250px) !important; height:100vh !important; background:#fff !important; z-index:10002 !important; overflow-y:auto !important; overflow-x:hidden !important; visibility:visible !important; opacity:1 !important;';
    void containerEl.offsetWidth; // Force reflow again
    
    const newComputedStyle = window.getComputedStyle(containerEl);
    const newRect = containerEl.getBoundingClientRect();
    console.log('📦 [openTypeItemsModal] После принудительного показа:', {
      display: newComputedStyle.display,
      width: newComputedStyle.width,
      height: newComputedStyle.height,
      rectWidth: newRect.width,
      rectHeight: newRect.height
    });
  } else {
    console.log('✅ [openTypeItemsModal] Контейнер успешно отображается');
  }
  
  // Небольшая задержка для гарантии, что DOM обновился
  // ⭐ ВАЖНО: Функции renderTypeItemsTable и attachTypeItemsPageHandlers объявлены внутри wireUI(),
  // поэтому вызываем их через window или ждем выполнения wireUI()
  setTimeout(async () => {
    // Функция для вызова рендеринга (повторно используемая)
    const callRenderFunctions = async () => {
      // Проверяем через window (приоритет)
      if (typeof (window as any).renderTypeItemsTable === 'function') {
        console.log('✅ [openTypeItemsModal] Вызываем renderTypeItemsTable через window');
        await (window as any).renderTypeItemsTable();
      } else if (typeof renderTypeItemsTable === 'function') {
        console.log('✅ [openTypeItemsModal] Вызываем renderTypeItemsTable локально');
        await renderTypeItemsTable();
      } else {
        console.warn('⚠️ [openTypeItemsModal] renderTypeItemsTable все еще не найдена');
        return false;
      }
      
      if (typeof (window as any).renderTypeItemsPagination === 'function') {
        (window as any).renderTypeItemsPagination();
      } else if (typeof renderTypeItemsPagination === 'function') {
        renderTypeItemsPagination();
      }
      
      if (typeof (window as any).attachTypeItemsPageHandlers === 'function') {
        (window as any).attachTypeItemsPageHandlers();
      } else if (typeof attachTypeItemsPageHandlers === 'function') {
        attachTypeItemsPageHandlers();
      }
      
      return true;
    };
    
    // Пытаемся вызвать сразу
    const success = await callRenderFunctions();
    
    // Если не получилось, ждем и повторяем
    if (!success) {
      console.warn('⚠️ [openTypeItemsModal] renderTypeItemsTable не найдена, ждем wireUI()...');
      setTimeout(async () => {
        await callRenderFunctions();
        console.log('✅ [openTypeItemsModal] Страница успешно открыта и таблица отрендерена');
      }, 300);
    } else {
      console.log('✅ [openTypeItemsModal] Страница успешно открыта и таблица отрендерена');
    }
  }, 50);
}

// ⭐ ВАЖНО: Экспортируем функцию в window СРАЗУ после объявления (перед вызовом wireUI)
// Делаем это ДО всех других вызовов, чтобы admin-panel.js мог использовать функцию
(window as any).openTypeItemsModal = openTypeItemsModal;
console.log('✅ [constructor.ts] openTypeItemsModal добавлена в window ДО вызова wireUI()');

// Отправляем событие, что функция готова (для admin-panel.js)
try {
  window.dispatchEvent(new CustomEvent('openTypeItemsModalReady'));
  console.log('✅ [constructor.ts] Событие openTypeItemsModalReady отправлено');
} catch (e) {
  console.warn('⚠️ [constructor.ts] Не удалось отправить событие:', e);
}

// ⭐ ДОПОЛНИТЕЛЬНО: Экспортируем функцию также через Object.defineProperty для гарантии
try {
  Object.defineProperty(window, 'openTypeItemsModal', {
    value: openTypeItemsModal,
    writable: true,
    configurable: true,
    enumerable: true
  });
  console.log('✅ [constructor.ts] openTypeItemsModal также экспортирована через defineProperty');
} catch (e) {
  console.warn('⚠️ [constructor.ts] Не удалось экспортировать через defineProperty:', e);
}

// ⭐ ПРОВЕРКА: Убеждаемся что функция доступна в window
if (typeof (window as any).openTypeItemsModal === 'function') {
  console.log('✅ [constructor.ts] openTypeItemsModal доступна в window');
} else {
  console.error('❌ [constructor.ts] openTypeItemsModal НЕ доступна в window!');
}

function wireUI() {
  console.log('🚀 [wireUI] Начало выполнения wireUI()');
  const addBoxBtn = document.getElementById('btn-add-box');
  addBoxBtn?.addEventListener('click', () => addBox());

  const addShelfBtn = document.getElementById('btn-add-shelf');
  addShelfBtn?.addEventListener('click', () => addShelf());
  
  // Добавление деталей
  const addWallBtn = document.getElementById('btn-add-wall');
  addWallBtn?.addEventListener('click', () => {
    if (!currentSelectedNode) {
      alert('Выберите секцию или корпус для добавления стенки');
      return;
    }
    // Ищем корпус в иерархии
    let targetNode = currentSelectedNode;
    while (targetNode && targetNode.type !== 'body' && targetNode.type !== 'section') {
      targetNode = targetNode.parent || null;
    }
    if (targetNode) {
      createPart(targetNode, 'wall', 'Стенка');
    }
  });
  
  const addBottomBtn = document.getElementById('btn-add-bottom');
  addBottomBtn?.addEventListener('click', () => {
    if (!currentSelectedNode) {
      alert('Выберите корпус для добавления дна');
      return;
    }
    let targetNode = currentSelectedNode;
    while (targetNode && targetNode.type !== 'body') {
      targetNode = targetNode.parent || null;
    }
    if (targetNode) {
      createPart(targetNode, 'bottom', 'Дно');
    }
  });
  
  const addTopBtn = document.getElementById('btn-add-top');
  addTopBtn?.addEventListener('click', () => {
    if (!currentSelectedNode) {
      alert('Выберите корпус для добавления крышки');
      return;
    }
    let targetNode = currentSelectedNode;
    while (targetNode && targetNode.type !== 'body') {
      targetNode = targetNode.parent || null;
    }
    if (targetNode) {
      createPart(targetNode, 'top', 'Крышка');
    }
  });
  
  // Добавление подэлементов
  const addGrooveBtn = document.getElementById('btn-add-groove');
  addGrooveBtn?.addEventListener('click', () => {
    if (!currentSelectedNode) {
      alert('Выберите деталь для добавления паза');
      return;
    }
    createSubElement(currentSelectedNode, 'groove', 'Паз');
  });
  
  const addConfirmatBtn = document.getElementById('btn-add-confirmat');
  addConfirmatBtn?.addEventListener('click', () => {
    if (!currentSelectedNode) {
      alert('Выберите деталь для добавления конфирмата');
      return;
    }
    createSubElement(currentSelectedNode, 'confirmat', 'Конфирмат');
  });
  
  const addFacadeBtn = document.getElementById('btn-add-facade');
  addFacadeBtn?.addEventListener('click', () => {
    if (!currentSelectedNode) {
      alert('Выберите секцию для добавления фасада');
      return;
    }
    createSubElement(currentSelectedNode, 'facade', 'Фасад');
  });

  const loadGLBBtn = document.getElementById('btn-load-glb');
  loadGLBBtn?.addEventListener('click', () => loadGLBIntoConstructor());
  
  const loadSupportBtn = document.getElementById('btn-load-support');
  loadSupportBtn?.addEventListener('click', () => loadSupportIntoConstructor());
  
  const addHardwareBtn = document.getElementById('btn-add-hardware');
  addHardwareBtn?.addEventListener('click', () => openHardwareModal());
  
  const addToSectionBtn = document.getElementById('btn-add-to-section');
  addToSectionBtn?.addEventListener('click', () => {
    if (!currentSelectedNode || currentSelectedNode.type !== 'glb') {
      alert('Выберите загруженную модель (GLB)');
      return;
    }
    // Найти секцию для добавления
    let sectionNode: SceneNode | null = null;
    if (currentSelectedNode.parent && currentSelectedNode.parent.type === 'section') {
      sectionNode = currentSelectedNode.parent;
    } else {
      // Ищем первую секцию в сцене
      sectionNode = sceneNodes.find(n => n.type === 'section') || null;
    }
    if (!sectionNode) {
      alert('Выберите секцию в иерархии для добавления фурнитуры');
      return;
    }
    addGLBToSection(currentSelectedNode, sectionNode);
  });
  
  const saveAsHardwareBtn = document.getElementById('btn-save-as-hardware');
  saveAsHardwareBtn?.addEventListener('click', () => saveGLBAsHardware());

  const exportBtn = document.getElementById('btn-export');
  exportBtn?.addEventListener('click', () => exportLastNodeGLB());

  const saveModelBtn = document.getElementById('btn-save-model');
  saveModelBtn?.addEventListener('click', () => saveModelWithMetadata());
  
  // Управление размерами GLB
  const btnApplySize = document.getElementById('btn-apply-size');
  btnApplySize?.addEventListener('click', () => applySize());
  
  // Управление свойствами секции
  const btnApplyProperties = document.getElementById('btn-apply-properties');
  btnApplyProperties?.addEventListener('click', () => applySectionProperties());
  
  // Обработчики изменения размеров секции в конструкторе (автоматическое применение)
  const sizeXInput = document.getElementById('catalog-constructor-property-size-x') as HTMLInputElement | null;
  const sizeYInput = document.getElementById('catalog-constructor-property-size-y') as HTMLInputElement | null;
  const sizeZInput = document.getElementById('catalog-constructor-property-size-z') as HTMLInputElement | null;
  
  // Обработчик для корневой секции (обновление через updateRootSectionSize)
  const handleSectionSizeChange = () => {
    if (!currentSelectedNode || currentSelectedNode.type !== 'section') return;
    
    // Проверяем, является ли это корневой секцией (parent === null)
    if (currentSelectedNode.parent === null) {
      // Это корневая секция - используем updateRootSectionSize
      if (sizeXInput && sizeYInput && sizeZInput) {
        const width = parseFloat(sizeXInput.value);
        const height = parseFloat(sizeYInput.value);
        const depth = parseFloat(sizeZInput.value);
        
        if (!isNaN(width) && !isNaN(height) && !isNaN(depth) && 
            width >= 0 && height >= 0 && depth >= 0) {
          console.log('📐 [handleSectionSizeChange] Обновление размеров корневой секции:', { width, height, depth });
          if ((window as any).updateRootSectionSize) {
            (window as any).updateRootSectionSize(width, height, depth);
          }
        }
      }
    } else {
      // Это дочерняя секция - используем applySectionProperties
      applySectionProperties();
    }
  };
  
  // Добавляем обработчики на изменение (при потере фокуса или Enter)
  sizeXInput?.addEventListener('blur', handleSectionSizeChange);
  sizeYInput?.addEventListener('blur', handleSectionSizeChange);
  sizeZInput?.addEventListener('blur', handleSectionSizeChange);
  
  sizeXInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSectionSizeChange();
  });
  sizeYInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSectionSizeChange();
  });
  sizeZInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSectionSizeChange();
  });
  
  // Обработчики чекбоксов секции
  const hideWhenFilledCheckbox = document.getElementById('catalog-constructor-property-hide-when-filled') as HTMLInputElement | null;
  const activeCheckbox = document.getElementById('catalog-constructor-property-active') as HTMLInputElement | null;
  
  hideWhenFilledCheckbox?.addEventListener('change', (e) => {
    if (currentSelectedNode && currentSelectedNode.type === 'section') {
      if (!currentSelectedNode.metadata) currentSelectedNode.metadata = {};
      currentSelectedNode.metadata.hideWhenFilled = (e.target as HTMLInputElement).checked;
      console.log('✅ [hideWhenFilled] Обновлено для секции:', currentSelectedNode.name, currentSelectedNode.metadata.hideWhenFilled);
    }
  });
  
  activeCheckbox?.addEventListener('change', (e) => {
    if (currentSelectedNode && currentSelectedNode.type === 'section') {
      if (!currentSelectedNode.metadata) currentSelectedNode.metadata = {};
      currentSelectedNode.metadata.active = (e.target as HTMLInputElement).checked;
      
      // Обновляем видимость секции в сцене
      if (currentSelectedNode.group) {
        // Находим рамку секции (buildParentFrame создает Group с hull и edges)
        const frameGroup = currentSelectedNode.group.children.find(
          child => child.type === 'Group' && child.children.some(c => (c as THREE.Mesh).isMesh)
        ) as THREE.Group | undefined;
        
        if (frameGroup) {
          frameGroup.visible = currentSelectedNode.metadata.active;
          console.log('✅ [active] Видимость секции обновлена:', currentSelectedNode.name, currentSelectedNode.metadata.active);
        }
      }
    }
  });

  // Управление свойствами детали
  const btnApplyDetailProps = document.getElementById('btn-apply-detail-properties');
  btnApplyDetailProps?.addEventListener('click', () => applyDetailProperties());

  // Сохранение в каталог
  const btnSaveToCatalog = document.getElementById('btn-save-to-catalog');
  btnSaveToCatalog?.addEventListener('click', () => saveElementToCatalog());

  const btnSaveDetailToCatalog = document.getElementById('btn-save-detail-to-catalog');
  btnSaveDetailToCatalog?.addEventListener('click', () => saveElementToCatalog());

  // Меню «Каталог элементов» -> пункт «Типы элементов»
  const catalogMenuRoot = document.getElementById('catalog-menu-root');
  const catalogMenuArrow = document.getElementById('catalog-menu-arrow');
  const catalogMenuSub = document.getElementById('catalog-menu-sub');
  catalogMenuItemTypes = document.getElementById('catalog-menu-item-types');
  const catalogMenuItemGroups = document.getElementById('catalog-menu-item-groups');
  catalogTypesFolders = document.getElementById('catalog-types-folders');

  catalogMenuRoot?.addEventListener('click', () => {
    if (!catalogMenuSub || !catalogMenuArrow) return;
    const isHidden = catalogMenuSub.style.display === 'none';
    catalogMenuSub.style.display = isHidden ? 'block' : 'none';
    catalogMenuArrow.textContent = isHidden ? '▲' : '▼';
  });

  // Страница «Типы элементов» (строго по референсу)
  const elementTypesContainer = document.getElementById('element-types-container') as HTMLDivElement | null;
  const typesAdd = document.getElementById('element-types-add') || document.getElementById('btn-element-types-add');
  typesSearch = document.getElementById('element-types-search') as HTMLInputElement | null;
  const typesTableBody = document.getElementById('element-types-table-body') as HTMLTableSectionElement | null;

  // Страница \"Список элементов типа\" (как в референсе)
  // ⚠️ ВАЖНО: Эти переменные уже объявлены глобально ДО wireUI(), здесь обновляем их (без const)
  typeItemsContainer = document.getElementById('type-elements-container') as HTMLDivElement | null;
  typeItemsTitle = document.getElementById('type-elements-title') as HTMLDivElement | null;
  typeItemsBody = document.getElementById('type-elements-table-body') as HTMLTableSectionElement | null;
  typeItemsSearch = document.getElementById('type-elements-search') as HTMLInputElement | null;
  typeItemsCategoryFilter = document.getElementById('type-elements-category-filter') as HTMLSelectElement | null;
  typeItemsPerPage = document.getElementById('type-elements-per-page') as HTMLSelectElement | null;
  typeItemsPaginationControls = document.getElementById('type-elements-pagination-controls') as HTMLDivElement | null;
  typeItemsAddBtn = document.getElementById('btn-type-elements-add');
  typeItemsAddBottomBtn = document.getElementById('btn-type-elements-add-bottom');
  typeItemsCategoriesBtn = document.getElementById('btn-type-elements-categories');
  typeItemsParamsBtn = document.getElementById('btn-type-elements-params');
  typeItemsResetMaterialsBtn = document.getElementById('btn-type-elements-reset-materials');
  typeItemsChangeVarsBtn = document.getElementById('btn-type-elements-change-vars');
  typeItemsCopyBtn = document.getElementById('btn-type-elements-copy');
  typeItemsSelectAll = document.getElementById('type-elements-select-all') as HTMLInputElement | null;

  let currentTypeItemsId: string | null = null;

  // Большая модалка редактирования/создания элемента каталога
  catalogItemEditBackdrop = document.getElementById('catalog-item-edit-backdrop') as HTMLDivElement | null;
  const catalogItemEditTitle = document.getElementById('catalog-item-edit-title') as HTMLDivElement | null;
  const catalogItemEditName = document.getElementById('catalog-item-edit-name') as HTMLInputElement | null;
  catalogItemEditClose = document.getElementById('btn-catalog-item-edit-close');
  const catalogItemEditCategory = document.getElementById('catalog-item-edit-category') as HTMLElement | null;

  // Модалка категорий типа
  catalogCategoriesBackdrop = document.getElementById('catalog-categories-backdrop') as HTMLDivElement | null;
  const catalogCategoriesTitle = document.getElementById('catalog-categories-title') as HTMLDivElement | null;
  const catalogCategoriesBody = document.getElementById('catalog-categories-body') as HTMLTableSectionElement | null;
  catalogCategoriesClose = document.getElementById('btn-catalog-categories-close');
  catalogCategoriesAdd = document.getElementById('btn-catalog-categories-add');

  // 3D превью для модалки создания модуля
  let previewScene: THREE.Scene | null = null;
  let previewCamera: THREE.PerspectiveCamera | null = null;
  let previewRenderer: THREE.WebGLRenderer | null = null;
  let previewControls: OrbitControls | null = null;
  let previewFrame: THREE.Group | null = null;
  let previewAxes: THREE.AxesHelper | null = null;
  let previewAnimationId: number | null = null;
  let previewUpdateHandler: (() => void) | null = null;

  function init3DPreview(container: HTMLElement) {
    // Очищаем предыдущую сцену, если есть
    cleanup3DPreview();

    // Сцена
    previewScene = new THREE.Scene();
    previewScene.background = new THREE.Color(0xf5f5f5);

    // Получаем размеры контейнера (если 0, используем дефолтные)
    let width = container.clientWidth;
    let height = container.clientHeight;
    if (width === 0) width = 800;
    if (height === 0) height = 600;

    // Камера — чуть ближе и выше, чтобы модуль занимал больше области превью
    previewCamera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    previewCamera.position.set(1.6, 1.8, 1.8);
    previewCamera.lookAt(0, 0.8, 0);

    // Рендерер
    previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    previewRenderer.setSize(width, height);
    previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Корректное цветовое пространство и тонмаппинг
    const anyRenderer = previewRenderer as any;
    if ("outputColorSpace" in anyRenderer && (THREE as any).SRGBColorSpace) {
      anyRenderer.outputColorSpace = (THREE as any).SRGBColorSpace;
    } else if ("outputEncoding" in anyRenderer && (THREE as any).sRGBEncoding) {
      anyRenderer.outputEncoding = (THREE as any).sRGBEncoding;
    }
    previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Делаем сцену ещё темнее для наглядности
    (previewRenderer as any).toneMappingExposure = 0.4;

    console.log('[Clodis][preview] init3DPreview called', {
      size: { width, height },
      exposure: (previewRenderer as any).toneMappingExposure,
    });

    // Мягкие тени
    previewRenderer.shadowMap.enabled = true;
    previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(previewRenderer.domElement);

    // Контроллы для вращения
    previewControls = new OrbitControls(previewCamera, previewRenderer.domElement);
    previewControls.enableDamping = true;
    previewControls.dampingFactor = 0.05;
    previewControls.minDistance = 0.5;
    previewControls.maxDistance = 10;
    previewControls.target.set(0, 0.8, 0);

    // Освещение в стиле рефа: один ключевой свет + слабый фон
    // Небольшой hemisphere только как лёгкий fill
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.08);
    hemiLight.position.set(0, 3, 0);
    previewScene.add(hemiLight);

    // Очень слабый общий ambient, чтобы в тенях не было абсолютного чёрного
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.06);
    previewScene.add(ambientLight);

    // Ключевой направленный свет: сверху-слева-спереди, как в референсе
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(-2.5, 3.5, 2.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    const d = 2.0;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 10;

    // Направляем ключевой свет в центр модуля (примерно середина шкафа)
    directionalLight.target.position.set(0, 0.8, 0);
    previewScene.add(directionalLight.target);
    previewScene.add(directionalLight);

    console.log('[Clodis][preview] lights created', {
      hemi: {
        intensity: hemiLight.intensity,
        position: hemiLight.position.toArray(),
      },
      ambient: {
        intensity: ambientLight.intensity,
      },
      directional: {
        intensity: directionalLight.intensity,
        position: directionalLight.position.toArray(),
        castShadow: directionalLight.castShadow,
        shadowCamera: {
          left: directionalLight.shadow.camera.left,
          right: directionalLight.shadow.camera.right,
          top: directionalLight.shadow.camera.top,
          bottom: directionalLight.shadow.camera.bottom,
          near: directionalLight.shadow.camera.near,
          far: directionalLight.shadow.camera.far,
        },
      },
    });

    // Маркер осей в начале координат (0,0,0) - будет обновляться при изменении размеров
    previewAxes = new THREE.AxesHelper(0.1);
    previewAxes.position.set(0, 0, 0);
    previewScene.add(previewAxes);

    // Анимационный цикл
    function animate() {
      if (!previewAnimationId) return;
      previewAnimationId = requestAnimationFrame(animate);
      if (previewControls) previewControls.update();
      if (previewRenderer && previewScene && previewCamera) {
        previewRenderer.render(previewScene, previewCamera);
      }
    }
    previewAnimationId = requestAnimationFrame(animate);

    // Обработчик изменения размера
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !previewCamera || !previewRenderer) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      previewCamera.aspect = w / h;
      previewCamera.updateProjectionMatrix();
      previewRenderer.setSize(w, h);
    });
    resizeObserver.observe(container);
  }

  function update3DPreview(width: number, height: number, depth: number) {
    if (!previewScene) return;

    // Удаляем старую рамку
    if (previewFrame) {
      previewScene.remove(previewFrame);
      previewFrame.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
      previewFrame = null;
    }

    // Создаём новую габаритную рамку (как buildParentFrame)
    const visual = getVisualSize(width / 1000, height / 1000, depth / 1000);
    const visualW = visual.w;
    const visualH = visual.h;
    const visualD = visual.d;

    previewFrame = new THREE.Group();

    // Полупрозрачный корпус
    const mat = new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const hullGeo = new THREE.BoxGeometry(visualW, visualH, visualD);
    hullGeo.translate(visualW / 2, visualH / 2, visualD / 2);
    const hull = new THREE.Mesh(hullGeo, mat);
    hull.castShadow = true;
    hull.receiveShadow = true;
    previewFrame.add(hull);

    // Рёбра каркаса
    const edgesGeo = new THREE.BoxGeometry(visualW, visualH, visualD);
    edgesGeo.translate(visualW / 2, visualH / 2, visualD / 2);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(edgesGeo),
      new THREE.LineBasicMaterial({ color: 0x2a7bbf, linewidth: 2 })
    );
    previewFrame.add(edges);

    // Оси в начале координат (0,0,0)
    const axisSize = Math.min(visualW, visualH, visualD) * 0.4 || 0.4;
    const axisHelper = new THREE.AxesHelper(axisSize);
    axisHelper.position.set(0, 0, 0);
    previewFrame.add(axisHelper);

    previewScene.add(previewFrame);

    // Обновляем размер маркера осей пропорционально размерам рамки
    if (previewAxes) {
      const maxDim = Math.max(visualW, visualH, visualD);
      const axisSize = Math.max(0.1, maxDim * 0.3);
      previewScene.remove(previewAxes);
      previewAxes = new THREE.AxesHelper(axisSize);
      previewAxes.position.set(0, 0, 0);
      previewScene.add(previewAxes);
    }

    // Обновляем позицию камеры для лучшего обзора
    if (previewCamera && previewControls) {
      const maxDim = Math.max(visualW, visualH, visualD);
      // Держим камеру ближе, чтобы модуль визуально занимал почти весь прямоугольник превью
      const distance = maxDim * 1.5;
      previewCamera.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
      previewControls.target.set(visualW / 2, visualH / 2, visualD / 2);
      previewControls.update();
    }
  }

  function cleanup3DPreview() {
    if (previewAnimationId) {
      cancelAnimationFrame(previewAnimationId);
      previewAnimationId = null;
    }
    if (previewRenderer) {
      previewRenderer.dispose();
      previewRenderer.domElement.remove();
      previewRenderer = null;
    }
    if (previewFrame) {
      previewFrame = null;
    }
    previewScene = null;
    previewCamera = null;
    previewControls = null;
    previewAxes = null;
  }

  // Функция импорта модуля из сохранённого clodisJSON (как в Clodis)
  function importModuleFromClodisJSON(clodisJSON: ClodisItem[], savedSize?: { width: number; height: number; depth: number }) {
    console.log('🔄🔄🔄 [importModuleFromClodisJSON] НАЧАЛО ИМПОРТА МОДУЛЯ 🔄🔄🔄');
    console.log('  📦 clodisJSON:', clodisJSON);
    console.log('  📦 clodisJSON тип:', typeof clodisJSON);
    console.log('  📦 clodisJSON является массивом:', Array.isArray(clodisJSON));
    console.log('  📦 clodisJSON длина:', clodisJSON?.length || 0);
    console.log('  📦 clodisJSON[0]:', clodisJSON?.[0]);
    console.log('  📐 savedSize:', savedSize);

    try {
      // ⭐ ВАЖНО: Скрываем канвас во время пересборки, чтобы избежать мелькания
      const canvasContainer = document.getElementById('constructor-3d-canvas-container');
      if (canvasContainer) {
        canvasContainer.style.opacity = '0';
        canvasContainer.style.pointerEvents = 'none';
        console.log('👁️ [importModuleFromClodisJSON] Канвас скрыт для предотвращения мелькания');
      }
      // 1. Очищаем текущую сцену и sceneNodes
      console.log('🧹🧹🧹 [importModuleFromClodisJSON] НАЧАЛО ОЧИСТКИ СЦЕНЫ 🧹🧹🧹');
      console.log('  📊 До очистки:');
      console.log('    - Объектов в сцене:', scene.children.length);
      console.log('    - Узлов в sceneNodes:', sceneNodes.length);
      console.log('    - Объекты в сцене:', scene.children.map(c => ({
        type: c.type,
        name: c.name || 'unnamed',
        isGroup: c instanceof THREE.Group,
        isMesh: (c as THREE.Mesh).isMesh,
        childrenCount: c.children?.length || 0
      })));
      
      // ⭐ Удаляем ВСЕ объекты из сцены кроме камеры, освещения и сетки
      // ⭐ ВАЖНО: Удаляем ВСЕ группы, включая рамки секций (buildParentFrame создает Group с рамкой)
      const objectsToRemove: THREE.Object3D[] = [];
      const childrenToCheck = [...scene.children]; // Копируем массив, так как будем изменять scene.children
      
      console.log('  📊 [importModuleFromClodisJSON] Проверяем объекты в сцене:', childrenToCheck.length);
      
      childrenToCheck.forEach((child, index) => {
        // Не удаляем камеру, освещение, сетку, оси
        const shouldKeep = 
          (child instanceof THREE.Camera) ||
          (child instanceof THREE.Light) ||
          child.type === 'GridHelper' ||
          child.type === 'AxesHelper';
        
        if (!shouldKeep) {
          // ⭐ Удаляем ВСЕ остальные объекты, включая группы с рамками секций
          objectsToRemove.push(child);
          console.log(`  🗑️ [${index}] Объект помечен на удаление:`, {
            type: child.type,
            name: child.name || 'unnamed',
            isGroup: child instanceof THREE.Group,
            isMesh: (child as THREE.Mesh).isMesh,
            childrenCount: child.children?.length || 0,
            userData: child.userData,
            // Проверяем, есть ли внутри рамка (buildParentFrame создает Group с LineSegments и Mesh)
            hasFrame: child instanceof THREE.Group && child.children.some(c => 
              c instanceof THREE.LineSegments || 
              (c instanceof THREE.Mesh && (c as any).material?.transparent === true)
            )
          });
        } else {
          console.log(`  ✅ [${index}] Объект оставляем:`, child.type);
        }
      });
      
      console.log(`  📊 Всего объектов к удалению: ${objectsToRemove.length}`);
      
      // Удаляем объекты из сцены и очищаем ресурсы
      let disposedMeshes = 0;
      objectsToRemove.forEach((obj, index) => {
        console.log(`  🗑️ [${index + 1}/${objectsToRemove.length}] Удаляем объект:`, {
          type: obj.type,
          name: obj.name || 'unnamed',
          childrenCount: obj.children?.length || 0
        });
        
        // Сначала очищаем геометрию и материалы (до удаления из сцены)
        obj.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) {
              mesh.geometry.dispose();
              disposedMeshes++;
            }
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
        
        // Затем удаляем из сцены
        if (scene.children.includes(obj)) {
          scene.remove(obj);
          console.log(`    ✅ Объект удален из сцены`);
        } else {
          console.warn(`    ⚠️ Объект не найден в scene.children!`);
        }
      });
      
      console.log('  📊 После очистки:');
      console.log('    - Удалено объектов:', objectsToRemove.length);
      console.log('    - Очищено мешей:', disposedMeshes);
      console.log('    - Осталось объектов в сцене:', scene.children.length);
      console.log('    - Оставшиеся объекты:', scene.children.map(c => c.type));
      
      // Очищаем sceneNodes
      const oldSceneNodesCount = sceneNodes.length;
      sceneNodes.length = 0;
      console.log(`  ✅ sceneNodes очищены (было: ${oldSceneNodesCount}, стало: 0)`);
      console.log('✅✅✅ [importModuleFromClodisJSON] ОЧИСТКА ЗАВЕРШЕНА ✅✅✅');

      // 2. Берём первый элемент массива - это корневая секция
      const rootSectionJSON = clodisJSON[0];
      if (!rootSectionJSON || rootSectionJSON.type !== 'section') {
        console.error('❌ Первый элемент clodisJSON не является секцией:', {
          hasFirstElement: !!clodisJSON[0],
          firstElementType: clodisJSON[0]?.type,
          clodisJSONLength: clodisJSON.length
        });
        return;
      }
      
      console.log('✅ [importModuleFromClodisJSON] Корневая секция найдена:', {
        name: rootSectionJSON.name,
        id: rootSectionJSON.id,
        hasChildren: !!(rootSectionJSON.children && rootSectionJSON.children.length > 0),
        childrenCount: rootSectionJSON.children?.length || 0,
        children: rootSectionJSON.children?.map(c => ({ type: c.type, name: c.name })) || []
      });

      // 3. Получаем размеры секции (приоритет: JSON > savedSize > дефолты)
      // ⭐ ВАЖНО: Сначала пробуем извлечь размеры из JSON, если они там есть в виде чисел
      let sectionSize = {
        x: savedSize?.width || 600,
        y: savedSize?.height || 720,
        z: savedSize?.depth || 300,
      };
      
      console.log('📐 [importModuleFromClodisJSON] Начальные размеры (из savedSize или дефолты, мм):', sectionSize);
      console.log('📐 [importModuleFromClodisJSON] rootSectionJSON.size:', rootSectionJSON.size);
      
      // Проверяем, есть ли в JSON числовые размеры (не выражения)
      if (rootSectionJSON.size) {
        const sizeX = rootSectionJSON.size.x;
        const sizeY = rootSectionJSON.size.y;
        const sizeZ = rootSectionJSON.size.z;
        
        console.log('📐 [importModuleFromClodisJSON] Размеры из JSON:', { sizeX, sizeY, sizeZ });
        
        // Если размеры - числа (не выражения типа "s:x"), используем их
        if (typeof sizeX === 'number' && sizeX > 0) {
          sectionSize.x = sizeX;
          console.log('✅ [importModuleFromClodisJSON] Размер X из JSON (число, мм):', sizeX);
        }
        if (typeof sizeY === 'number' && sizeY > 0) {
          sectionSize.y = sizeY;
          console.log('✅ [importModuleFromClodisJSON] Размер Y из JSON (число, мм):', sizeY);
        }
        if (typeof sizeZ === 'number' && sizeZ > 0) {
          sectionSize.z = sizeZ;
          console.log('✅ [importModuleFromClodisJSON] Размер Z из JSON (число, мм):', sizeZ);
        }
        
        // Если размеры - строки-числа (без выражений), парсим их
        if (typeof sizeX === 'string' && !sizeX.includes('s:') && !sizeX.includes('g:') && !sizeX.includes('v:')) {
          const parsedX = parseFloat(sizeX);
          if (!isNaN(parsedX) && parsedX > 0) {
            sectionSize.x = parsedX;
            console.log('✅ [importModuleFromClodisJSON] Размер X из JSON (строка-число, мм):', parsedX);
          } else {
            console.log('⚠️ [importModuleFromClodisJSON] Размер X из JSON не является числом:', sizeX);
          }
        } else if (typeof sizeX === 'string') {
          console.log('ℹ️ [importModuleFromClodisJSON] Размер X из JSON - выражение (будет вычислено при построении):', sizeX);
        }
        
        if (typeof sizeY === 'string' && !sizeY.includes('s:') && !sizeY.includes('g:') && !sizeY.includes('v:')) {
          const parsedY = parseFloat(sizeY);
          if (!isNaN(parsedY) && parsedY > 0) {
            sectionSize.y = parsedY;
            console.log('✅ [importModuleFromClodisJSON] Размер Y из JSON (строка-число, мм):', parsedY);
          } else {
            console.log('⚠️ [importModuleFromClodisJSON] Размер Y из JSON не является числом:', sizeY);
          }
        } else if (typeof sizeY === 'string') {
          console.log('ℹ️ [importModuleFromClodisJSON] Размер Y из JSON - выражение (будет вычислено при построении):', sizeY);
        }
        
        if (typeof sizeZ === 'string' && !sizeZ.includes('s:') && !sizeZ.includes('g:') && !sizeZ.includes('v:')) {
          const parsedZ = parseFloat(sizeZ);
          if (!isNaN(parsedZ) && parsedZ > 0) {
            sectionSize.z = parsedZ;
            console.log('✅ [importModuleFromClodisJSON] Размер Z из JSON (строка-число, мм):', parsedZ);
          } else {
            console.log('⚠️ [importModuleFromClodisJSON] Размер Z из JSON не является числом:', sizeZ);
          }
        } else if (typeof sizeZ === 'string') {
          console.log('ℹ️ [importModuleFromClodisJSON] Размер Z из JSON - выражение (будет вычислено при построении):', sizeZ);
        }
      } else {
        console.log('⚠️ [importModuleFromClodisJSON] rootSectionJSON.size отсутствует, используем savedSize или дефолты');
      }
      
      // Если размеры не найдены в JSON (только выражения), используем savedSize или дефолты
      // ⭐ ВАЖНО: В Clodis JSON размеры корневой секции обычно заданы выражениями "s:x", "s:y", "s:z"
      // Эти выражения вычисляются относительно размеров, переданных в sectionSize параметрах
      // Поэтому если в JSON только выражения, используем размеры из savedSize (полей ввода)
      const hasOnlyExpressions = rootSectionJSON.size && 
        typeof rootSectionJSON.size.x === 'string' && rootSectionJSON.size.x.includes('s:') &&
        typeof rootSectionJSON.size.y === 'string' && rootSectionJSON.size.y.includes('s:') &&
        typeof rootSectionJSON.size.z === 'string' && rootSectionJSON.size.z.includes('s:');
      
      if (hasOnlyExpressions && savedSize) {
        console.log('📐 [importModuleFromClodisJSON] В JSON только выражения - используем размеры из savedSize (полей ввода, мм):', savedSize);
        sectionSize = {
          x: savedSize.width || 600,
          y: savedSize.height || 720,
          z: savedSize.depth || 300,
        };
      } else if (sectionSize.x === 600 && sectionSize.y === 720 && sectionSize.z === 300 && savedSize) {
        console.log('📐 [importModuleFromClodisJSON] Используем размеры из savedSize (мм):', savedSize);
        sectionSize = {
          x: savedSize.width || 600,
          y: savedSize.height || 720,
          z: savedSize.depth || 300,
        };
      }
      
      console.log('📐📐📐 [importModuleFromClodisJSON] ФИНАЛЬНЫЕ размеры секции для импорта (мм):', sectionSize);
      console.log('📐 [importModuleFromClodisJSON] Эти размеры будут использованы для вычисления выражений s:x, s:y, s:z');

      // 4. Подготавливаем параметры для ClodisBuilder (как в Furniture.js)
      const params = {
        sectionSize: sectionSize,
        variables: {},
        groups: {
          g0: { thickness: 16 }, // Толщина материала по умолчанию (ЛДСП)
          g1: { thickness: 3 }, // Толщина HDF для задней стенки
        },
      };

      // 5. Определяем, какой ClodisBuilder использовать:
      //    - сначала пробуем глобальный (как в оригинальном Clodis)
      //    - если его нет (скрипт не загрузился), используем встроенный EmbeddedClodisBuilder
      const GlobalBuilder = (window as any).ClodisBuilder;
      const BuilderCtor = GlobalBuilder || EmbeddedClodisBuilder;
      if (!BuilderCtor) {
        console.error('❌ ClodisBuilder не загружен и EmbeddedClodisBuilder недоступен');
        return;
      }
      
      // 6. Создаём билдер и строим модель
      console.log('🏗️ Строим модель через', GlobalBuilder ? 'глобальный ClodisBuilder' : 'EmbeddedClodisBuilder');
      const builder = new BuilderCtor();
      
      // ⭐ ВАЖНО: Если используем EmbeddedClodisBuilder, устанавливаем функцию загрузки модулей из каталога
      // ⚠️ ВАЖНО: Функция должна быть синхронной, так как buildItem синхронный
      if (!GlobalBuilder && builder.setCatalogLoader) {
        // Загружаем все элементы из каталога заранее (синхронно)
        const allElements = loadAllCatalogElements();
        
        builder.setCatalogLoader(async (id: string, elementType?: string) => {
          console.log('🔄 [importModuleFromClodisJSON] Поиск модуля в каталоге:', { id, elementType, totalElements: allElements.length });
          
          // Логируем первые несколько элементов для отладки
          if (allElements.length > 0) {
            console.log('📋 [importModuleFromClodisJSON] Примеры элементов в каталоге:', allElements.slice(0, 3).map(el => ({
              id: el.id,
              name: el.name,
              element_type: el.metadata?.element_type,
              hasClodisJSON: !!el.clodisJSON,
              clodisJSONLength: el.clodisJSON?.length || 0
            })));
          }
          
          try {
            // Ищем модуль по id или elementType (синхронно)
            // ⭐ ВАЖНО: В CatalogElement используется metadata.element_type (с подчеркиванием), а не elementType
            let foundElement = allElements.find(el => {
              const idMatch = id && (el.id === id || String(el.id) === String(id));
              const elementTypeMatch = elementType && (
                el.metadata?.element_type === elementType ||
                (el as any).elementType === elementType
              );
              
              if (idMatch || elementTypeMatch) {
                console.log('🔍 [importModuleFromClodisJSON] Найден потенциальный модуль:', {
                  id: el.id,
                  name: el.name,
                  metadata_element_type: el.metadata?.element_type,
                  hasClodisJSON: !!el.clodisJSON,
                  clodisJSONLength: el.clodisJSON?.length || 0,
                  idMatch,
                  elementTypeMatch
                });
              }
              
              return idMatch || elementTypeMatch;
            });
            
            // Если не найден в localStorage, пытаемся загрузить с сервера
            if (!foundElement && id) {
              console.log('🔄 [importModuleFromClodisJSON] Модуль не найден в localStorage, пытаемся загрузить с сервера:', id);
              try {
                let response: Response;
                try {
                  response = await fetch(`${API_BASE_URL}/catalog/items_get/${id}`);
                } catch (fetchError: any) {
                  // Не логируем - это нормально, если сервер не запущен
                  response = null as any;
                }
                
                if (response && response.ok) {
                  const data = await response.json();
                  const serverItem = data.item || data;
                  
                  // Конвертируем формат сервера в формат CatalogElement
                  let clodisJSON = null;
                  if (serverItem.data) {
                    try {
                      const parsed = typeof serverItem.data === 'string' ? JSON.parse(serverItem.data) : serverItem.data;
                      // В Clodis: data.params уже является массивом Clodis JSON
                      // НЕ оборачиваем в массив еще раз!
                      const fromRead = readClodisJSON(parsed);
                      if (Array.isArray(fromRead) && fromRead.length > 0) {
                        clodisJSON = fromRead;
                      } else if (parsed.params && Array.isArray(parsed.params)) {
                        clodisJSON = parsed.params; // params уже массив
                      } else if (Array.isArray(parsed)) {
                        clodisJSON = parsed; // parsed сам массив
                      } else {
                        clodisJSON = [parsed]; // оборачиваем в массив только если это объект
                      }
                      console.log('✅ [importModuleFromClodisJSON] clodisJSON извлечен с сервера:', {
                        hasParams: !!parsed.params,
                        paramsIsArray: Array.isArray(parsed.params),
                        parsedIsArray: Array.isArray(parsed),
                        clodisJSONLength: clodisJSON?.length || 0
                      });
                    } catch (e) {
                      console.warn('⚠️ Ошибка парсинга JSON с сервера:', e);
                    }
                  } else {
                    const fromItem = readClodisJSON(serverItem);
                    if (Array.isArray(fromItem) && fromItem.length > 0) {
                      clodisJSON = fromItem;
                    }
                  }
                  
                  foundElement = {
                    id: String(serverItem.id),
                    name: serverItem.name || `Модуль ${id}`,
                    type: serverItem.type || 'section',
                    elementType: 'section',
                    metadata: {
                      name: serverItem.name || `Модуль ${id}`,
                      type: serverItem.type || 'section',
                      size: { width: 600, height: 720, depth: 300 },
                      createdAt: new Date().toISOString(),
                      element_type: serverItem.element_type || null
                    },
                    clodisJSON: clodisJSON
                  };
                  
                  console.log('✅ [importModuleFromClodisJSON] Модуль загружен с сервера:', foundElement.name);
                }
              } catch (error) {
                console.warn('⚠️ [importModuleFromClodisJSON] Не удалось загрузить модуль с сервера:', error);
              }
            }
            
            if (foundElement) {
              if (foundElement.clodisJSON && Array.isArray(foundElement.clodisJSON) && foundElement.clodisJSON.length > 0) {
                console.log('✅ [importModuleFromClodisJSON] Модуль найден в каталоге:', {
                  name: foundElement.name,
                  id: foundElement.id,
                  clodisJSONLength: foundElement.clodisJSON.length,
                  firstItemType: foundElement.clodisJSON[0]?.type,
                  firstItemHasChildren: !!(foundElement.clodisJSON[0]?.children?.length)
                });
                return foundElement;
              } else {
                console.warn('⚠️ [importModuleFromClodisJSON] Модуль найден, но нет clodisJSON или он пустой:', {
                  name: foundElement.name,
                  id: foundElement.id,
                  hasClodisJSON: !!foundElement.clodisJSON
                });
              }
            } else {
              console.warn('⚠️ [importModuleFromClodisJSON] Модуль не найден в каталоге:', { 
                id, 
                elementType, 
                totalElements: allElements.length,
                availableIds: allElements.slice(0, 5).map(el => el.id),
                availableElementTypes: allElements.slice(0, 5).map(el => el.metadata?.element_type).filter(Boolean),
                hint: 'Попробуйте загрузить модули через скрипты в папке scripts/'
              });
            }
            return null;
          } catch (error) {
            console.error('❌ [importModuleFromClodisJSON] Ошибка поиска модуля в каталоге:', error);
            return null;
          }
        });
      }
      
      // ⭐ ВАЖНО: buildFromJSON может принимать как объект, так и массив
      // Если передаем объект, он обработается как один элемент
      // Но лучше передать весь массив, чтобы сохранить структуру
      console.log('🏗️ [importModuleFromClodisJSON] Вызываем buildFromJSON для корневой секции:', {
        type: rootSectionJSON.type,
        name: rootSectionJSON.name,
        hasChildren: !!(rootSectionJSON.children && rootSectionJSON.children.length > 0),
        childrenCount: rootSectionJSON.children?.length || 0
      });
      // ⭐ ВАЖНО: buildFromJSON может принимать как объект, так и массив
      // Если передаем объект секции, он вызовет buildSection, который создаст Group
      // Но для корневой секции нужно убедиться, что userData установлен правильно
      const builtGroup = builder.buildFromJSON(rootSectionJSON, params) as THREE.Group;
      
      // ⭐ ВАЖНО: Устанавливаем userData для корневой секции, если его нет
      // buildSection должен установить это, но на всякий случай проверяем
      if (!builtGroup.userData.isSection) {
        builtGroup.userData.isSection = true;
        builtGroup.userData.sectionName = rootSectionJSON.name || 'Секция';
        console.log('⚠️ [importModuleFromClodisJSON] userData.isSection не было, установили вручную');
      }
      
      console.log('✅ [importModuleFromClodisJSON] buildFromJSON завершен, builtGroup:', {
        type: builtGroup.type,
        name: builtGroup.name,
        childrenCount: builtGroup.children.length,
        userData: builtGroup.userData,
        hasIsSection: builtGroup.userData.isSection === true,
        sectionName: builtGroup.userData.sectionName,
        children: builtGroup.children.map((c, i) => ({
          index: i,
          type: c.type,
          name: c.name || 'unnamed',
          isMesh: (c as THREE.Mesh).isMesh,
          isGroup: c instanceof THREE.Group,
          userData: c.userData,
          userDataKeys: Object.keys(c.userData || {})
        }))
      });
      
      // ⭐ ВАЖНО ПО РЕФЕРЕНСУ: Сохраняем JSON в userData.params ПЕРЕД добавлением в сцену
      // В референсе: a6['template']['tree'] = copy_object(a4 || [])
      // Мы сохраняем в userData.params.spec.templates[0].template.tree
      if (!builtGroup.userData.params) {
        builtGroup.userData.params = {};
      }
      if (!builtGroup.userData.params.spec) {
        builtGroup.userData.params.spec = {};
      }
      if (!builtGroup.userData.params.spec.templates) {
        builtGroup.userData.params.spec.templates = [{}];
      }
      if (!builtGroup.userData.params.spec.templates[0]) {
        builtGroup.userData.params.spec.templates[0] = {};
      }
      if (!builtGroup.userData.params.spec.templates[0].template) {
        builtGroup.userData.params.spec.templates[0].template = {};
      }
      // ⭐ ВАЖНО: Сохраняем JSON в userData.params.spec.templates[0].template.tree (как в референсе)
      builtGroup.userData.params.spec.templates[0].template.tree = JSON.parse(JSON.stringify(clodisJSON));
      builtGroup.userData.params.templates_loaded = 0; // Как в референсе: a3['userData']['params']['templates_loaded'] = 0x0
      
      console.log('✅✅✅ [importModuleFromClodisJSON] JSON СОХРАНЕН В userData.params ✅✅✅');
      console.log('  📦 userData.params.spec.templates[0].template.tree:', {
        length: builtGroup.userData.params.spec.templates[0].template.tree?.length || 0,
        firstItemType: builtGroup.userData.params.spec.templates[0].template.tree?.[0]?.type,
        firstItemName: builtGroup.userData.params.spec.templates[0].template.tree?.[0]?.name
      });
      
      // 7. Добавляем построенную модель в сцену
      builtGroup.position.set(0, 0, 0);
      builtGroup.name = rootSectionJSON.name || 'Секция'; // Используем название из JSON
      scene.add(builtGroup);
      console.log('✅✅✅ [importModuleFromClodisJSON] МОДЕЛЬ ДОБАВЛЕНА В СЦЕНУ ✅✅✅');
      console.log('  📦 builtGroup:', {
        name: builtGroup.name,
        type: builtGroup.type,
        childrenCount: builtGroup.children.length,
        position: builtGroup.position,
        isInScene: scene.children.includes(builtGroup),
        hasUserDataParams: !!builtGroup.userData.params
      });
      console.log('  📊 Всего объектов в сцене после добавления:', scene.children.length);
      
      // Принудительно рендерим сразу после добавления
      render();
      console.log('✅ [importModuleFromClodisJSON] Первый рендер выполнен');

      // 8. Создаём SceneNode для корневой секции
      // ⭐ ВАЖНО ПО РЕФЕРЕНСУ: Теперь будем читать данные из userData.params, а не напрямую из JSON
      // ⭐ ВАЖНО: Используем ID из JSON, если он есть, или генерируем новый
      const rootNodeId = rootSectionJSON.id && rootSectionJSON.id.trim() ? rootSectionJSON.id : generateId();
      const rootNode: SceneNode = {
        id: rootNodeId,
        name: rootSectionJSON.name || 'Секция',
        type: 'section',
        group: builtGroup,
        children: [],
        parent: null,
        expanded: true,
        metadata: {
          size: {
            x: sectionSize.x / 1000, // Сохраняем в метрах для совместимости с остальным кодом
            y: sectionSize.y / 1000,
            z: sectionSize.z / 1000,
          },
          originalSize: {
            x: sectionSize.x / 1000,
            y: sectionSize.y / 1000,
            z: sectionSize.z / 1000,
          },
        },
      };
      
      // ⭐ ВАЖНО: Обновляем название корневой секции в HTML (элемент "(модуль без названия)")
      const rootModuleName = document.getElementById('constructor-root-module-name');
      const rootModuleContainer = document.getElementById('constructor-root-module');
      if (rootModuleName) {
        const oldName = rootModuleName.textContent;
        rootModuleName.textContent = rootNode.name || '(модуль без названия)';
        console.log('✅ [importModuleFromClodisJSON] Обновлено название корневой секции в HTML:', {
          oldName: oldName,
          newName: rootModuleName.textContent,
          rootNodeName: rootNode.name,
          rootNodeId: rootNode.id
        });
      } else {
        console.warn('⚠️ [importModuleFromClodisJSON] Элемент constructor-root-module-name не найден в DOM');
      }
      
      // ⭐ ВАЖНО: Убеждаемся, что контейнер секции виден
      if (rootModuleContainer) {
        const containerStyle = window.getComputedStyle(rootModuleContainer);
        console.log('🔍 [importModuleFromClodisJSON] Проверка видимости контейнера секции:', {
          display: containerStyle.display,
          visibility: containerStyle.visibility,
          opacity: containerStyle.opacity,
          inDOM: document.body.contains(rootModuleContainer)
        });
        
        // Убеждаемся, что контейнер виден
        if (containerStyle.display === 'none') {
          rootModuleContainer.style.display = 'block';
          console.log('✅ [importModuleFromClodisJSON] Контейнер секции был скрыт, сделали видимым');
        }
      } else {
        console.warn('⚠️ [importModuleFromClodisJSON] Элемент constructor-root-module не найден в DOM');
      }
      
      // 9. Регистрируем узел в sceneNodes
      registerNode(rootNode);
      selectNode(rootNode);
      console.log('✅ Корневой узел зарегистрирован:', {
        id: rootNode.id,
        name: rootNode.name,
        type: rootNode.type,
        childrenCount: rootNode.children.length
      });

      // ⭐ ВАЖНО: Обновляем размеры и JSON в currentEditingCatalogElement для отображения в модалке
      if (currentEditingCatalogElement) {
        if (!currentEditingCatalogElement.metadata) {
          currentEditingCatalogElement.metadata = {};
        }
        // Сохраняем размеры в метрах (как в rootNode.metadata.size)
        currentEditingCatalogElement.metadata.size = {
          x: sectionSize.x / 1000,
          y: sectionSize.y / 1000,
          z: sectionSize.z / 1000,
          width: sectionSize.x / 1000, // Для совместимости
          height: sectionSize.y / 1000,
          depth: sectionSize.z / 1000,
        };
        console.log('✅ [importModuleFromClodisJSON] Обновлены размеры в currentEditingCatalogElement:', currentEditingCatalogElement.metadata.size);
        
        // ⭐ ВАЖНО: Сохраняем импортированный JSON в currentEditingCatalogElement, чтобы при сохранении использовался полный JSON
        currentEditingCatalogElement.clodisJSON = clodisJSON;
        console.log('✅ [importModuleFromClodisJSON] Сохранен clodisJSON в currentEditingCatalogElement, длина:', clodisJSON.length);
        
        // ⭐ ВАЖНО: Обновляем textarea с импортированным JSON, чтобы при сохранении использовался полный JSON
        const jsonEditor = document.getElementById('catalog-json-editor') as HTMLTextAreaElement | null;
        if (jsonEditor) {
          jsonEditor.value = JSON.stringify(clodisJSON, null, 2);
          console.log('✅ [importModuleFromClodisJSON] Обновлен textarea с импортированным JSON');
        }
        
        // ⭐ ВАЖНО: Обновляем поля ввода размеров в модалке
        const widthInput = document.getElementById('catalog-item-edit-width') as HTMLInputElement | null;
        const heightInput = document.getElementById('catalog-item-edit-height') as HTMLInputElement | null;
        const depthInput = document.getElementById('catalog-item-edit-depth') as HTMLInputElement | null;
        
        if (widthInput) {
          widthInput.value = String(sectionSize.x);
          console.log('✅ [importModuleFromClodisJSON] Обновлено поле Ширина:', sectionSize.x, 'мм');
        }
        if (heightInput) {
          heightInput.value = String(sectionSize.y);
          console.log('✅ [importModuleFromClodisJSON] Обновлено поле Высота:', sectionSize.y, 'мм');
        }
        if (depthInput) {
          depthInput.value = String(sectionSize.z);
          console.log('✅ [importModuleFromClodisJSON] Обновлено поле Глубина:', sectionSize.z, 'мм');
        }
      }

      // 10. ⭐ ВАЖНО: Создаём SceneNode для всех детей секции рекурсивно
      // Дети построены в 3D (builtGroup содержит их), но нужны SceneNode для отображения в дереве
      function createSceneNodesFromClodisJSON(item: ClodisItem, parentNode: SceneNode, parentGroup: THREE.Group) {
        console.log(`🔍 [createSceneNodesFromClodisJSON] НАЧАЛО функции:`, {
          itemName: item.name,
          itemType: item.type,
          hasChildren: !!(item.children && Array.isArray(item.children)),
          childrenCount: item.children?.length || 0,
          parentNodeName: parentNode.name,
          parentNodeId: parentNode.id,
          parentGroupChildrenCount: parentGroup.children.length
        });
        
        if (!item.children || !Array.isArray(item.children)) {
          console.log(`⚠️ [createSceneNodesFromClodisJSON] У элемента "${item.name}" нет children или children не массив`);
          return;
        }
        
        console.log(`🔄 [createSceneNodesFromClodisJSON] Обрабатываем ${item.children.length} детей`);
        item.children.forEach((childJSON, index) => {
          console.log(`  🔄 [${index + 1}/${item.children.length}] Обработка child:`, {
            type: childJSON.type,
            name: childJSON.name,
            hasSpec: !!childJSON.spec,
            spec: childJSON.spec
          });
          // ⭐ ВАЖНО: Ищем объект в parentGroup по userData (ClodisBuilder сохраняет там информацию)
          // ClodisBuilder.buildSection создает Group для секции, а buildWall создает Mesh для детали
          // Дети добавляются напрямую в sectionGroup.children в том же порядке, что и в JSON
          let childObject: THREE.Object3D | null = null;
          
          // ⭐ ВАЖНО: Сначала пробуем найти в прямых children parentGroup по индексу
          // ClodisBuilder создает объекты в том же порядке, что и children в JSON
          // Для деталей (wall, facade) создается Mesh с userData.detailName или userData.detailType
          if (parentGroup.children[index]) {
            const candidate = parentGroup.children[index];
            
            // Для секций ищем Group с userData.isSection
            if ((childJSON.type === 'section' || childJSON.type === 'fill_section')) {
              if (candidate instanceof THREE.Group && (candidate.userData.isSection || candidate.userData.sectionName)) {
                const nameMatch = !childJSON.name || 
                  candidate.userData.sectionName === childJSON.name ||
                  candidate.name === childJSON.name;
                if (nameMatch) {
                  childObject = candidate;
                  console.log(`✅ [createSceneNodesFromClodisJSON] Найден объект секции по индексу ${index} для "${childJSON.name}"`);
                }
              }
            } 
            // Для деталей (wall, facade, shelf) ищем Mesh или Group с userData.detailName/detailType
            else if (childJSON.type === 'wall' || childJSON.type === 'facade' || childJSON.type === 'shelf' || childJSON.type === 'module') {
              // Mesh для детали
              if (candidate instanceof THREE.Mesh) {
                // Проверяем userData.detailName или userData.detailType
                const hasDetailData = candidate.userData.detailName || candidate.userData.detailType;
                const nameMatch = !childJSON.name || 
                  candidate.userData.detailName === childJSON.name ||
                  candidate.name === childJSON.name ||
                  // Если имя не совпадает, но это Mesh и есть userData, считаем что это наша деталь
                  (hasDetailData && !childJSON.name);
                
                if (hasDetailData || nameMatch) {
                  childObject = candidate;
                  console.log(`✅ [createSceneNodesFromClodisJSON] Найден Mesh по индексу ${index} для "${childJSON.name}" (${childJSON.type}):`, {
                    candidateName: candidate.name,
                    userDataDetailName: candidate.userData.detailName,
                    userDataDetailType: candidate.userData.detailType,
                    userDataKeys: Object.keys(candidate.userData || {})
                  });
                }
              }
              // Group для детали (если деталь обернута в Group)
              else if (candidate instanceof THREE.Group && candidate.userData.detailName) {
                const nameMatch = !childJSON.name || 
                  candidate.userData.detailName === childJSON.name ||
                  candidate.name === childJSON.name;
                if (nameMatch) {
                  childObject = candidate;
                  console.log(`✅ [createSceneNodesFromClodisJSON] Найден Group по индексу ${index} для "${childJSON.name}" (${childJSON.type})`);
                }
              }
            }
          }
          
          // ⭐ ВАЖНО: Если не нашли по индексу, но есть Mesh с правильным типом, используем его
          // Это fallback для случая, когда порядок не совпадает, но есть только один Mesh
          if (!childObject && (childJSON.type === 'wall' || childJSON.type === 'facade' || childJSON.type === 'shelf')) {
            const meshes = parentGroup.children.filter(c => c instanceof THREE.Mesh);
            if (meshes.length === 1) {
              childObject = meshes[0];
              console.log(`✅ [createSceneNodesFromClodisJSON] Используем единственный Mesh как fallback для "${childJSON.name}" (${childJSON.type})`);
            }
          }
          
          // Если не нашли по индексу, ищем через traverse по userData (более надежно)
          if (!childObject) {
            const candidates: THREE.Object3D[] = [];
            
            parentGroup.traverse((obj) => {
              // Пропускаем сам parentGroup
              if (obj === parentGroup) return;
              
              // Для секций ищем Group с userData.isSection
              if ((childJSON.type === 'section' || childJSON.type === 'fill_section') && obj instanceof THREE.Group) {
                const isSection = obj.userData.isSection === true;
                const nameMatch = !childJSON.name || obj.userData.sectionName === childJSON.name || obj.name === childJSON.name;
                if (isSection && nameMatch) {
                  candidates.push(obj);
                }
              }
              
              // Для деталей (wall, facade, shelf) ищем Mesh с userData.detailName
              if (childJSON.type === 'wall' || childJSON.type === 'facade' || childJSON.type === 'shelf' || childJSON.type === 'module') {
                const isDetail = (obj instanceof THREE.Mesh && obj.userData.detailName) || (obj instanceof THREE.Group && obj.userData.detailName);
                const nameMatch = !childJSON.name || obj.userData.detailName === childJSON.name || obj.name === childJSON.name;
                if (isDetail && nameMatch) {
                  candidates.push(obj);
                }
              }
            });
            
            if (candidates.length > 0) {
              // Берем первый найденный (или тот, который ближе к корню)
              childObject = candidates[0];
              console.log(`✅ [createSceneNodesFromClodisJSON] Найден объект через traverse для "${childJSON.name}" (${childJSON.type}), найдено кандидатов: ${candidates.length}`);
            }
          }
          
          if (!childObject) {
            console.warn(`⚠️ [createSceneNodesFromClodisJSON] Объект для child "${childJSON.name}" (${childJSON.type}) не найден в parentGroup.`);
            console.warn(`  Доступные children (${parentGroup.children.length}):`, 
              parentGroup.children.map((c, i) => ({ 
                index: i, 
                type: c.type, 
                name: c.name, 
                isMesh: (c as THREE.Mesh).isMesh,
                isGroup: c instanceof THREE.Group,
                userData: c.userData,
                userDataKeys: Object.keys(c.userData)
              }))
            );
            console.warn(`  JSON child:`, {
              type: childJSON.type,
              name: childJSON.name,
              spec: childJSON.spec
            });
            return;
          }
          
          console.log(`✅ [createSceneNodesFromClodisJSON] Объект найден для "${childJSON.name}" (${childJSON.type}):`, {
            type: childObject.type,
            name: childObject.name,
            isMesh: (childObject as THREE.Mesh).isMesh,
            isGroup: childObject instanceof THREE.Group,
            userData: childObject.userData,
            childrenCount: childObject instanceof THREE.Group ? childObject.children.length : 0,
            position: childObject.position
          });
          
          // Определяем тип узла
          let nodeType: 'section' | 'detail' | 'glb' = 'detail';
          if (childJSON.type === 'section' || childJSON.type === 'fill_section') {
            nodeType = 'section';
          } else {
            nodeType = 'detail';
          }
          
          // Получаем размеры из объекта или вычисляем
          const bbox = new THREE.Box3().setFromObject(childObject);
          const size = bbox.getSize(new THREE.Vector3());
          
          // Конвертируем pivot из JSON
          const pivot = childJSON.pivot || { x: -1, y: -1, z: -1 };
          const anchors: { x: Anchor; y: Anchor; z: Anchor } = {
            x: typeof pivot.x === 'number' ? (pivot.x === -1 ? 'min' : (pivot.x === 1 ? 'max' : 'center')) : 'min',
            y: typeof pivot.y === 'number' ? (pivot.y === -1 ? 'min' : (pivot.y === 1 ? 'max' : 'center')) : 'min',
            z: typeof pivot.z === 'number' ? (pivot.z === -1 ? 'min' : (pivot.z === 1 ? 'max' : 'center')) : 'min',
          };
          
          // Получаем ориентацию из spec
          let orientation: 'v' | 'h' | 'f' = 'v';
          if (childJSON.spec?.orientation) {
            orientation = childJSON.spec.orientation === 'h' ? 'h' : (childJSON.spec.orientation === 'f' ? 'f' : 'v');
          } else if (childJSON.type === 'wall') {
            orientation = 'v';
          } else if (childJSON.type === 'shelf' || childJSON.type === 'tabletop') {
            orientation = 'h';
          } else if (childJSON.type === 'facade') {
            orientation = 'f';
          }
          
          // Создаём дочерний узел
          const childNode: SceneNode = {
            id: childJSON.id || generateId(),
            name: childJSON.name || (nodeType === 'section' ? 'Секция' : 'Деталь'),
            type: nodeType,
            group: childObject instanceof THREE.Group ? childObject : (new THREE.Group().add(childObject)),
            children: [],
            parent: parentNode,
            expanded: nodeType === 'section',
            orientation: nodeType === 'detail' ? orientation : undefined,
            metadata: {
              size: {
                x: size.x,
                y: size.y,
                z: size.z,
              },
              position: {
                x: childObject.position.x,
                y: childObject.position.y,
                z: childObject.position.z,
              },
              pivot: {
                x: typeof pivot.x === 'number' ? pivot.x : (pivot.x === 'min' ? -1 : (pivot.x === 'max' ? 1 : 0)),
                y: typeof pivot.y === 'number' ? pivot.y : (pivot.y === 'min' ? -1 : (pivot.y === 'max' ? 1 : 0)),
                z: typeof pivot.z === 'number' ? pivot.z : (pivot.z === 'min' ? -1 : (pivot.z === 'max' ? 1 : 0)),
              },
              anchors: nodeType === 'detail' ? anchors : undefined,
              expressions: {
                size: {
                  x: typeof childJSON.size?.x === 'string' ? childJSON.size.x : undefined,
                  y: typeof childJSON.size?.y === 'string' ? childJSON.size.y : undefined,
                  z: typeof childJSON.size?.z === 'string' ? childJSON.size.z : undefined,
                },
                pos: {
                  x: typeof childJSON.pos?.x === 'string' ? childJSON.pos.x : undefined,
                  y: typeof childJSON.pos?.y === 'string' ? childJSON.pos.y : undefined,
                  z: typeof childJSON.pos?.z === 'string' ? childJSON.pos.z : undefined,
                },
              },
              material: childJSON.spec?.material ? {
                group: childJSON.spec.material.group || 'g0',
                key: childJSON.spec.material.key || 'ldsp',
              } : undefined,
              detailTypeId: childJSON.spec?.type || (childJSON.spec?.key || ''),
            },
          };
          
          // Регистрируем дочерний узел
          registerNode(childNode);
          addChildNode(parentNode, childNode);
          
          console.log(`✅ [createSceneNodesFromClodisJSON] Создан и зарегистрирован узел для "${childNode.name}" (${childNode.type}):`, {
            id: childNode.id,
            name: childNode.name,
            type: childNode.type,
            parent: parentNode.name,
            parentId: parentNode.id,
            size: childNode.metadata.size,
            orientation: childNode.orientation,
            sceneNodesCount: sceneNodes.length,
            parentChildrenCount: parentNode.children.length
          });
          
          // ⭐ ВАЖНО: Проверяем, что узел действительно добавлен в sceneNodes
          const nodeInSceneNodes = sceneNodes.find(n => n.id === childNode.id);
          if (!nodeInSceneNodes) {
            console.error(`❌❌❌ [createSceneNodesFromClodisJSON] УЗЕЛ НЕ НАЙДЕН В sceneNodes ПОСЛЕ РЕГИСТРАЦИИ! ❌❌❌`, {
              childNodeId: childNode.id,
              childNodeName: childNode.name,
              sceneNodesIds: sceneNodes.map(n => n.id),
              sceneNodesNames: sceneNodes.map(n => n.name)
            });
          } else {
            console.log(`✅ [createSceneNodesFromClodisJSON] Подтверждено: узел найден в sceneNodes после регистрации`);
          }
          
          // Рекурсивно обрабатываем детей (для вложенных секций)
          if (nodeType === 'section' && childObject instanceof THREE.Group) {
            createSceneNodesFromClodisJSON(childJSON, childNode, childObject);
          }
        });
      }
      
      // ⭐ ВАЖНО ПО РЕФЕРЕНСУ: Читаем данные из userData.params, а не напрямую из JSON
      // В референсе: get_object_hierarchy читает из userData.params.spec.template.tree
      const userDataTree = builtGroup.userData.params?.spec?.templates?.[0]?.template?.tree;
      const rootSectionFromUserData = Array.isArray(userDataTree) && userDataTree.length > 0 ? userDataTree[0] : rootSectionJSON;
      
      console.log(`🔍 [importModuleFromClodisJSON] Проверка детей корневой секции (ПО РЕФЕРЕНСУ - из userData.params):`, {
        hasUserDataParams: !!builtGroup.userData.params,
        hasUserDataTree: !!userDataTree,
        userDataTreeLength: userDataTree?.length || 0,
        rootSectionFromUserDataType: rootSectionFromUserData?.type,
        rootSectionFromUserDataName: rootSectionFromUserData?.name,
        hasChildren: !!(rootSectionFromUserData?.children && Array.isArray(rootSectionFromUserData.children)),
        childrenCount: rootSectionFromUserData?.children?.length || 0,
        builtGroupChildrenCount: builtGroup.children.length,
        builtGroupChildren: builtGroup.children.map((c, i) => ({
          index: i,
          type: c.type,
          name: c.name || 'unnamed',
          isMesh: (c as THREE.Mesh).isMesh,
          isGroup: c instanceof THREE.Group,
          userData: c.userData,
          userDataKeys: Object.keys(c.userData || {})
        }))
      });
      
      if (rootSectionFromUserData?.children && Array.isArray(rootSectionFromUserData.children) && rootSectionFromUserData.children.length > 0) {
        console.log(`🌳 [importModuleFromClodisJSON] Создаём SceneNode для ${rootSectionFromUserData.children.length} детей корневой секции (из userData.params)`);
        console.log(`  📦 Дети в userData.params:`, rootSectionFromUserData.children.map((c, i) => ({
          index: i,
          type: c.type,
          name: c.name,
          hasSpec: !!c.spec,
          spec: c.spec
        })));
        console.log(`  📦 Дети в builtGroup:`, builtGroup.children.map((c, i) => ({
          index: i,
          type: c.type,
          name: c.name || 'unnamed',
          isMesh: (c as THREE.Mesh).isMesh,
          isGroup: c instanceof THREE.Group,
          userData: c.userData,
          userDataKeys: Object.keys(c.userData || {})
        })));
        
        console.log(`🚀 [importModuleFromClodisJSON] ВЫЗЫВАЕМ createSceneNodesFromClodisJSON (из userData.params)`);
        createSceneNodesFromClodisJSON(rootSectionFromUserData, rootNode, builtGroup);
        console.log(`✅ [importModuleFromClodisJSON] createSceneNodesFromClodisJSON завершена`);
        
        console.log(`✅ [importModuleFromClodisJSON] SceneNode созданы для всех детей:`);
        console.log(`  - Всего узлов в sceneNodes: ${sceneNodes.length}`);
        console.log(`  - Корневая секция: ${rootNode.name} (${rootNode.id})`);
        console.log(`  - Детей у корневой секции: ${rootNode.children.length}`);
        rootNode.children.forEach((child, i) => {
          console.log(`    [${i + 1}] ${child.name} (${child.type}, ${child.id})`);
        });
      } else {
        console.log(`⚠️ [importModuleFromClodisJSON] У корневой секции нет children в JSON`);
      }

      // ⭐ ВАЖНО ПО РЕФЕРЕНСУ: Порядок операций как в apply_json:
      // 1. _rebuild() - уже выполнено (buildFromJSON)
      // 2. reset_tree() - строим дерево из userData.params (через SceneNodes)
      // 3. emit_update() - обновляем UI (показываем канвас)
      setTimeout(() => {
        console.log('🌳 [importModuleFromClodisJSON] reset_tree() - Начинаем построение дерева из userData.params...');
        console.log('  - sceneNodes количество:', sceneNodes.length);
        const rootSectionInSceneNodes = sceneNodes.find(n => n.type === 'section' && !n.parent);
        console.log('  - Корневая секция в sceneNodes:', rootSectionInSceneNodes ? {
          name: rootSectionInSceneNodes.name,
          id: rootSectionInSceneNodes.id,
          childrenCount: rootSectionInSceneNodes.children.length
        } : 'не найдена');
        
        // ⭐ ВАЖНО ПО РЕФЕРЕНСУ: Строим дерево из userData.params (через SceneNodes)
        // В референсе: reset_tree() вызывает get_object_hierarchy(userData.params)
        // У нас: строим дерево из SceneNodes, которые созданы из userData.params
        const userDataTree = builtGroup.userData.params?.spec?.templates?.[0]?.template?.tree;
        const treeToRender = userDataTree || clodisJSON; // Fallback на clodisJSON если userData.params нет
        
        console.log('📦 [importModuleFromClodisJSON] reset_tree() - Источник данных для дерева:', {
          hasUserDataParams: !!builtGroup.userData.params,
          hasUserDataTree: !!userDataTree,
          userDataTreeLength: userDataTree?.length || 0,
          usingUserDataParams: !!userDataTree,
          usingFallback: !userDataTree
        });
        
        if ((window as any).renderConstructorTreeFromClodisJSON && typeof (window as any).renderConstructorTreeFromClodisJSON === 'function') {
          console.log('🌳 [importModuleFromClodisJSON] reset_tree() - Строим дерево из userData.params (через renderConstructorTreeFromClodisJSON)');
          // ⭐ ВАЖНО: Передаем JSON из userData.params, а не напрямую из clodisJSON
          (window as any).renderConstructorTreeFromClodisJSON(treeToRender);
        } else if (typeof renderHierarchy === 'function') {
          console.log('🌳 [importModuleFromClodisJSON] reset_tree() - Строим дерево из sceneNodes (fallback)');
          renderHierarchy();
        } else {
          console.warn('⚠️ [importModuleFromClodisJSON] Функции построения дерева недоступны');
        }
        
        // ⭐ ВАЖНО ПО РЕФЕРЕНСУ: emit_update() - обновляем UI (показываем канвас)
        const canvasContainer = document.getElementById('constructor-3d-canvas-container');
        if (canvasContainer) {
          canvasContainer.style.opacity = '1';
          canvasContainer.style.pointerEvents = 'auto';
          console.log('👁️ [importModuleFromClodisJSON] emit_update() - Канвас показан обратно');
        }
      }, 200); // Увеличиваем задержку для гарантии готовности DOM и создания всех SceneNode

      // 12. Фокусируем камеру на импортированной модели и принудительно рендерим
      setTimeout(() => {
        // Проверяем, что в сцене есть объекты
        console.log('🔍 [importModuleFromClodisJSON] Проверка сцены после импорта:');
        console.log('  - Объектов в сцене:', scene.children.length);
        console.log('  - builtGroup.children:', builtGroup.children.length);
        
        // Обходим все объекты в builtGroup и проверяем их размеры
        builtGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const geom = obj.geometry;
            if (geom instanceof THREE.BoxGeometry) {
              const params = geom.parameters;
              console.log('  - Mesh:', obj.userData.detailName || 'unnamed', 'размеры:', params.width, params.height, params.depth, 'позиция:', obj.position);
            }
          }
        });
        
        const box = new THREE.Box3().setFromObject(builtGroup);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        console.log('  - Размеры модели (м):', size, 'maxSize:', maxSize);
        
        if (maxSize > 0) {
          const distance = maxSize * 2.5;
          
          camera.position.set(
            center.x + distance * 0.7,
            center.y + distance * 0.6,
            center.z + distance * 0.7
          );
          
          controls.target.copy(center);
          controls.update();
          
          // Принудительно рендерим несколько раз для надёжности
          for (let i = 0; i < 5; i++) {
            render();
          }
          
          console.log('✅ Камера сфокусирована на импортированной модели, позиция камеры:', camera.position);
          
          // ⭐ ВАЖНО: Проверяем видимость canvas и принудительно обновляем рендеринг
          const canvas = renderer.domElement;
          const canvasRect = canvas.getBoundingClientRect();
          const canvasStyle = window.getComputedStyle(canvas);
          console.log('🔍 [importModuleFromClodisJSON] Проверка canvas после импорта:');
          console.log('  - Canvas размеры:', { width: canvasRect.width, height: canvasRect.height });
          console.log('  - Canvas display:', canvasStyle.display);
          console.log('  - Canvas visibility:', canvasStyle.visibility);
          console.log('  - Canvas opacity:', canvasStyle.opacity);
          console.log('  - Canvas в DOM:', document.body.contains(canvas));
          console.log('  - Canvas parent:', canvas.parentElement?.id || canvas.parentElement?.className);
          
          // Принудительно обновляем controls и рендерим еще раз
          controls.update();
          render();
          console.log('✅ [importModuleFromClodisJSON] Финальный рендер выполнен');
        } else {
          console.warn('⚠️ [importModuleFromClodisJSON] Модель имеет нулевые размеры!');
        }
        
        // Проверяем видимость canvas
        const canvas = renderer.domElement;
        const canvasStyle = window.getComputedStyle(canvas);
        console.log('🔍 [importModuleFromClodisJSON] Canvas:', {
          display: canvasStyle.display,
          visibility: canvasStyle.visibility,
          width: canvasStyle.width,
          height: canvasStyle.height,
          parentElement: canvas.parentElement?.id || 'none'
        });
      }, 100);

      console.log('✅ [importModuleFromClodisJSON] Импорт завершён успешно');
    } catch (error) {
      console.error('❌ [importModuleFromClodisJSON] Ошибка при импорте:', error);
    }
  }
  
  // ⭐ ВАЖНО: Экспортируем функцию для использования из HTML (после определения)
  (window as any).importModuleFromClodisJSON = importModuleFromClodisJSON;

  // ⭐ ВАЖНО: Экспортируем функцию в window СРАЗУ после объявления
  function openCatalogItemEditModal(typeName?: string, elementData?: any) {
    console.log('📝 [openCatalogItemEditModal] ========== НАЧАЛО ФУНКЦИИ ==========');
    console.log('📝 [openCatalogItemEditModal] Вызвана с typeName:', typeName, 'elementData:', elementData);
    console.log('📝 [openCatalogItemEditModal] elementData детально:', {
      hasElementData: !!elementData,
      hasClodisJSON: elementData?.clodisJSON ? true : false,
      clodisJSONType: elementData?.clodisJSON ? typeof elementData.clodisJSON : 'undefined',
      clodisJSONIsArray: Array.isArray(elementData?.clodisJSON),
      clodisJSONLength: elementData?.clodisJSON?.length || 0,
      metadata: elementData?.metadata,
      name: elementData?.name,
      id: elementData?.id
    });
    console.log('📝 [openCatalogItemEditModal] sceneNodes состояние ДО очистки:', {
      count: sceneNodes.length,
      nodes: sceneNodes.map(n => ({ type: n.type, name: n.name, parent: n.parent?.name || 'null', id: n.id })),
      rootSection: sceneNodes.find(n => n.type === 'section' && n.parent === null)?.name || 'не найдена'
    });
    
    // ⭐ ВАЖНО: Сохраняем секцию из конструктора ПЕРЕД очисткой сцены (если она есть)
    // Это нужно для экспорта в JSON редактор
    const rootSectionBeforeReset = sceneNodes.find(n => n.type === 'section' && n.parent === null);
    console.log('📝 [openCatalogItemEditModal] Секция найдена ДО очистки:', rootSectionBeforeReset?.name || 'нет');
    
    // Если создаём НОВЫЙ элемент (elementData нет) — очищаем сцену как в референсе:
    // только оси/размеры, без секции/деталей
    // ⭐ НО: если есть секция в конструкторе, мы её сохранили выше и экспортируем в JSON
    if (!elementData) {
      resetConstructorSceneForNewCatalogItem();
    }

    // Запоминаем, редактируем ли существующий элемент каталога
    currentEditingCatalogElement = elementData || null;
    
    // ⭐ СКРЫВАЕМ ВСЕ ДРУГИЕ КОНТЕНТЫ ПЕРЕД ОТКРЫТИЕМ БЛОКА РЕДАКТИРОВАНИЯ
    // catalog-item-edit-container скрывается через hideAllAdminContent, но потом показывается отдельно
    if ((window as any).AdminPanel && typeof (window as any).AdminPanel.hideAllAdminContent === 'function') {
      (window as any).AdminPanel.hideAllAdminContent();
    }
    
    // ⭐ ВАЖНО: Скрываем страницу списка элементов типа, если она открыта
    const typeItemsContainer = document.getElementById('type-elements-container');
    if (typeItemsContainer) {
      typeItemsContainer.style.display = 'none';
      console.log('✅ [openCatalogItemEditModal] Страница списка элементов типа скрыта');
    }
    
    // ⭐ ИЗМЕНЕНО: Используем catalog-item-edit-container вместо модалки (по референсу - блок контента, не модалка)
    const containerEl = document.getElementById('catalog-item-edit-container') as HTMLDivElement | null;
    if (!containerEl) {
      console.error('❌ [openCatalogItemEditModal] Не удалось найти catalog-item-edit-container в DOM');
      return;
    }
    
    const titleEl = document.getElementById('catalog-item-edit-title') as HTMLDivElement | null;
    const nameEl = document.getElementById('catalog-item-edit-name') as HTMLInputElement | null;
    const categoryEl = document.getElementById('catalog-item-edit-category') as HTMLElement | null;
    const categoriesCheckboxContainer = document.getElementById('catalog-item-edit-categories-checkboxes') as HTMLDivElement | null;
    // "Тип каталога" в HTML соответствует element_type
    const elementTypeEl = document.getElementById('catalog-item-edit-element-type') as HTMLSelectElement | null;
    // "Группа модуля" в HTML соответствует cabinet_tag
    const cabinetTagEl = document.getElementById('catalog-item-edit-cabinet-tag') as HTMLSelectElement | null;
    // Поля размеров модуля (в мм)
    const widthInputEl = document.getElementById('catalog-item-edit-width') as HTMLInputElement | null;
    const heightInputEl = document.getElementById('catalog-item-edit-height') as HTMLInputElement | null;
    const depthInputEl = document.getElementById('catalog-item-edit-depth') as HTMLInputElement | null;
    // Чекбоксы и другие поля вкладки "Основные"
    const showSpecCheckbox = document.getElementById('catalog-item-edit-show-spec') as HTMLInputElement | null;
    const includeNestedCheckbox = document.getElementById('catalog-item-edit-include-nested') as HTMLInputElement | null;
    const showConstructorCheckbox = document.getElementById('catalog-item-edit-show-constructor') as HTMLInputElement | null;
    const orderInput = document.getElementById('catalog-item-edit-order') as HTMLInputElement | null;
    const fillingElementCheckbox = document.getElementById('catalog-item-edit-filling-element') as HTMLInputElement | null;
    const noIntersectionsCheckbox = document.getElementById('catalog-item-edit-no-intersections') as HTMLInputElement | null;
    const dragTypeSelect = document.getElementById('catalog-item-edit-drag-type') as HTMLSelectElement | null;
    const adhesionTypeSelect = document.getElementById('catalog-item-edit-adhesion-type') as HTMLSelectElement | null;
    
    const titleBase = typeName ? `Создать модуль (${typeName})` : (elementData ? 'Редактировать модуль' : 'Создать модуль');
    if (titleEl) {
      titleEl.textContent = titleBase;
    }
    if (nameEl) {
      if (elementData && elementData.name) {
        nameEl.value = elementData.name;
      } else {
        nameEl.value = '';
      }
      nameEl.placeholder = typeName ? `Например: ${typeName} Пенал` : 'Например: Пенал 2 дверцы';
    }
    
    // Заполняем все поля вкладки "Основные" при редактировании существующего элемента
    if (elementData && elementData.metadata) {
      const meta = elementData.metadata;
      
      // Категория (массив) — сохраняем в selectedCategories, чекбоксы выставятся при fillCategorySelect
      if (categoryEl && meta.category) {
        const categoriesArray = Array.isArray(meta.category) ? meta.category : [meta.category];
        selectedCategories = categoriesArray.map(id => String(id));
      }
      
      // Иконка
      // В новом проекте иконка сохраняется как item.icon (верхний уровень), а не только в metadata.icon.
      const iconUrl = (meta as any).icon || (elementData as any).icon || (elementData as any).icon_url || '';
      if (iconUrl) {
        const iconContainerEl = document.getElementById('catalog-item-edit-icon') as HTMLElement | null;
        if (iconContainerEl) {
          // В admin-new.html внутри блока уже есть скрытый <img> (placeholder),
          // поэтому не проверяем "есть/нет img", а всегда выставляем превью.
          const placeholderEl = iconContainerEl.querySelector('.pp_img_placeholder') as HTMLElement | null;
          const hiddenPreviewWrap = iconContainerEl.querySelector('div[style*="display: none"]') as HTMLElement | null;
          const existingImg = iconContainerEl.querySelector('img') as HTMLImageElement | null;

          if (existingImg) {
            existingImg.src = iconUrl;
            existingImg.style.maxWidth = '78px';
            existingImg.style.width = '78px';
            existingImg.style.height = '78px';
            existingImg.style.objectFit = 'contain';
            existingImg.style.borderRadius = '4px';
          } else {
            const img = document.createElement('img');
            img.src = iconUrl;
            img.style.width = '78px';
            img.style.height = '78px';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '4px';
            iconContainerEl.insertBefore(img, iconContainerEl.firstChild);
          }

          if (placeholderEl) placeholderEl.style.display = 'none';
          if (hiddenPreviewWrap) hiddenPreviewWrap.style.display = 'block';
        }
      }
      
      // Чекбоксы
      if (showSpecCheckbox) {
        showSpecCheckbox.checked = meta.show_in_spec !== undefined ? meta.show_in_spec : true;
      }
      if (includeNestedCheckbox) {
        includeNestedCheckbox.checked = meta.include_nested !== undefined ? meta.include_nested : true;
      }
      if (showConstructorCheckbox) {
        showConstructorCheckbox.checked = meta.show_in_constructor !== undefined ? meta.show_in_constructor : true;
      }
      if (fillingElementCheckbox) {
        fillingElementCheckbox.checked = meta.filling_element === true;
      }
      if (noIntersectionsCheckbox) {
        noIntersectionsCheckbox.checked = meta.no_intersections === true;
      }
      
      // Порядок
      if (orderInput) {
        orderInput.value = String(meta.order !== undefined ? meta.order : 0);
      }
      
      // Тип перетаскивания
      if (dragTypeSelect && meta.drag_type) {
        dragTypeSelect.value = meta.drag_type;
      }
      
      // Тип прилипания
      if (adhesionTypeSelect && meta.adhesion_type) {
        adhesionTypeSelect.value = meta.adhesion_type;
      }
    } else {
      // Новый элемент - устанавливаем значения по умолчанию
      selectedCategories = [];
      if (showSpecCheckbox) showSpecCheckbox.checked = true;
      if (includeNestedCheckbox) includeNestedCheckbox.checked = true;
      if (showConstructorCheckbox) showConstructorCheckbox.checked = true;
      if (fillingElementCheckbox) fillingElementCheckbox.checked = false;
      if (noIntersectionsCheckbox) noIntersectionsCheckbox.checked = false;
      if (orderInput) orderInput.value = '0';
      if (dragTypeSelect) dragTypeSelect.value = 'like-bottom';
      if (adhesionTypeSelect) adhesionTypeSelect.value = 'walls-floor';
    }

    // Если редактируем существующий элемент – заполняем размеры модуля
    if (elementData && widthInputEl && heightInputEl && depthInputEl) {
      let wMm = 400, hMm = 400, dMm = 200; // Дефолты
      
      // 1. Сначала пробуем взять из metadata.size
      if (elementData.metadata && elementData.metadata.size) {
        const s = elementData.metadata.size;
        // metadata.size хранится в МЕТРАХ, переводим в миллиметры
        wMm = Math.round((s.width || s.x || 0) * 1000);
        hMm = Math.round((s.height || s.y || 0) * 1000);
        dMm = Math.round((s.depth || s.z || 0) * 1000);
        console.log('📐 [openCatalogItemEditModal] Размеры из metadata.size (мм):', { wMm, hMm, dMm });
      }
      
      // 2. Если размеры не найдены или нулевые, пробуем извлечь из clodisJSON
      if ((!wMm || !hMm || !dMm) && elementData.clodisJSON && Array.isArray(elementData.clodisJSON) && elementData.clodisJSON.length > 0) {
        const rootSection = elementData.clodisJSON[0];
        if (rootSection && rootSection.type === 'section') {
          // Размеры секции могут быть в savedSize или нужно использовать дефолтные
          // Но в JSON размеры заданы выражениями "s:x", "s:y", "s:z"
          // Поэтому используем размеры из metadata, если они есть, или дефолты
          console.log('📐 [openCatalogItemEditModal] clodisJSON найден, но размеры нужно брать из metadata или использовать дефолты');
        }
      }
      
      // 3. Если все еще нулевые, используем дефолты
      if (!wMm || !hMm || !dMm) {
        wMm = 400;
        hMm = 400;
        dMm = 200;
        console.log('📐 [openCatalogItemEditModal] Используем дефолтные размеры (мм):', { wMm, hMm, dMm });
      }
      
      widthInputEl.value = String(wMm);
      heightInputEl.value = String(hMm);
      depthInputEl.value = String(dMm);
    } else if (!elementData) {
      // Новый элемент – оставляем дефолты 400×400×200 мм
      if (widthInputEl && !widthInputEl.value) widthInputEl.value = '400';
      if (heightInputEl && !heightInputEl.value) heightInputEl.value = '400';
      if (depthInputEl && !depthInputEl.value) depthInputEl.value = '200';
    }
    
    // Заполняем все поля вкладки "Основные" при редактировании существующего элемента
    if (elementData && elementData.metadata) {
      const meta = elementData.metadata;
      
      // Категория (массив) — сохраняем в selectedCategories, чекбоксы выставятся при fillCategorySelect
      if (categoryEl && meta.category) {
        const categoriesArray = Array.isArray(meta.category) ? meta.category : [meta.category];
        selectedCategories = categoriesArray.map(id => String(id));
      }
      
      // Иконка
      if (meta.icon) {
        const iconContainerEl = document.getElementById('catalog-item-edit-icon') as HTMLElement | null;
        if (iconContainerEl && !iconContainerEl.querySelector('img')) {
          // Удаляем placeholder текст
          const placeholder = iconContainerEl.querySelector('div');
          if (placeholder && placeholder.textContent?.includes('Нажмите для загрузки')) {
            placeholder.remove();
          }
          
          const img = document.createElement('img');
          img.src = meta.icon;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.style.borderRadius = '4px';
          iconContainerEl.insertBefore(img, iconContainerEl.firstChild);
        }
      }
      
      // Чекбоксы
      if (showSpecCheckbox) {
        showSpecCheckbox.checked = meta.show_in_spec !== undefined ? meta.show_in_spec : true;
      }
      if (includeNestedCheckbox) {
        includeNestedCheckbox.checked = meta.include_nested !== undefined ? meta.include_nested : true;
      }
      if (showConstructorCheckbox) {
        showConstructorCheckbox.checked = meta.show_in_constructor !== undefined ? meta.show_in_constructor : true;
      }
      if (fillingElementCheckbox) {
        fillingElementCheckbox.checked = meta.filling_element === true;
      }
      if (noIntersectionsCheckbox) {
        noIntersectionsCheckbox.checked = meta.no_intersections === true;
      }
      
      // Порядок
      if (orderInput) {
        orderInput.value = String(meta.order !== undefined ? meta.order : 0);
      }
      
      // Тип перетаскивания
      if (dragTypeSelect && meta.drag_type) {
        dragTypeSelect.value = meta.drag_type;
      }
      
      // Тип прилипания
      if (adhesionTypeSelect && meta.adhesion_type) {
        adhesionTypeSelect.value = meta.adhesion_type;
      }
    } else {
      // Новый элемент - устанавливаем значения по умолчанию
      if (showSpecCheckbox) showSpecCheckbox.checked = true;
      if (includeNestedCheckbox) includeNestedCheckbox.checked = true;
      if (showConstructorCheckbox) showConstructorCheckbox.checked = true;
      if (fillingElementCheckbox) fillingElementCheckbox.checked = false;
      if (noIntersectionsCheckbox) noIntersectionsCheckbox.checked = false;
      if (orderInput) orderInput.value = '0';
      if (dragTypeSelect) dragTypeSelect.value = 'like-bottom';
      if (adhesionTypeSelect) adhesionTypeSelect.value = 'walls-floor';
    }
    
    // Заполняем select типов элементов (как в референсе)
    // ВАЖНО: Загружаем актуальные типы из localStorage каждый раз при открытии модалки
    if (elementTypeEl) {
      // Перезагружаем типы из localStorage, чтобы получить актуальные данные
      const currentTypes = loadCatalogTypes();
      console.log('📋 [openCatalogItemEditModal] Загружено типов элементов для select:', currentTypes.length);
      
      elementTypeEl.innerHTML = '<option value="">Выберите тип каталога</option>';
      currentTypes.forEach(type => {
        // Если у типа нет key, создаем его из id или name
        const typeKey = type.key || type.id.replace(/^(type-|catalog-)/, '').toLowerCase() || 
                       type.name.toLowerCase().replace(/\s+/g, '_');
        const option = document.createElement('option');
        option.value = typeKey;
        option.textContent = type.name;
        elementTypeEl.appendChild(option);
      });
      
      // Устанавливаем значение из elementData, если есть
      if (elementData && elementData.metadata && elementData.metadata.element_type) {
        elementTypeEl.value = elementData.metadata.element_type;
      } else if (currentTypeItemsId) {
        // Если открыт конкретный тип, устанавливаем его
        const currentType = currentTypes.find(t => t.id === currentTypeItemsId);
        if (currentType) {
          const typeKey = currentType.key || currentType.id.replace(/^(type-|catalog-)/, '').toLowerCase() || 
                         currentType.name.toLowerCase().replace(/\s+/g, '_');
          elementTypeEl.value = typeKey;
        }
      }
    }
    
    // Заполняем select групп модулей (как в референсе)
    // Используем глобальные группы, как в референсе (pp.libs.modules_groups)
    if (!cabinetTagEl) {
      console.error('❌ [openCatalogItemEditModal] Не найден select catalog-item-edit-cabinet-tag в DOM');
    } else {
      // Используем глобальные группы (как в референсе pp.libs.modules_groups)
      // Обновляем их из localStorage только если они еще не загружены
      if (catalogGroups.length === 0) {
        catalogGroups = loadCatalogGroups();
        // Обновляем hash
        catalogGroupsHash = {};
        catalogGroups.forEach(group => {
          if (group.key) {
            catalogGroupsHash[group.key] = group;
          }
        });
        // Обновляем в window
        (window as any).catalogGroups = catalogGroups;
        (window as any).catalogGroupsHash = catalogGroupsHash;
        console.log('🔄 [openCatalogItemEditModal] Группы перезагружены из localStorage:', catalogGroups.length);
      }
      const currentGroups = catalogGroups;
      console.log('📋 [openCatalogItemEditModal] Используются глобальные группы модулей (как в референсе):', currentGroups.length);
      console.log('📋 [openCatalogItemEditModal] Все группы:', currentGroups);
      
      // Очищаем select
      cabinetTagEl.innerHTML = '<option value="">Выберите группу модулей</option>';
      
      if (currentGroups.length === 0) {
        console.warn('⚠️ [openCatalogItemEditModal] Нет групп модулей в localStorage');
        // Проверяем, что в localStorage действительно нет групп
        const rawJson = localStorage.getItem('catalogGroups');
        console.log('📋 [openCatalogItemEditModal] Сырые данные из localStorage:', rawJson);
      } else {
        console.log('📋 [openCatalogItemEditModal] Группы для select:', currentGroups.map(g => ({ id: g.id, name: g.name, key: g.key })));
        
        // Добавляем каждую группу в select
        currentGroups.forEach(group => {
          // Если у группы нет key, создаем его из id или name
          let groupKey = group.key;
          if (!groupKey) {
            // Создаем key из id (убираем префикс 'group-') или из name
            if (group.id) {
              groupKey = group.id.replace(/^group-/, '').toLowerCase();
            }
            if (!groupKey && group.name) {
              // Если key все еще нет, создаем из name
              groupKey = group.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            }
            // Если key все еще нет, используем id как есть
            if (!groupKey) {
              groupKey = group.id || String(Date.now());
            }
            // Сохраняем key в объекте группы
            group.key = groupKey;
          }
          
          const option = document.createElement('option');
          option.value = groupKey;
          option.textContent = group.name;
          cabinetTagEl.appendChild(option);
          console.log('  ✅ Добавлена группа в select:', group.name, 'key:', groupKey, 'id:', group.id);
        });
        
        // Сохраняем обновленные группы обратно в localStorage (с key)
        // saveCatalogGroups автоматически обновит глобальные переменные
        saveCatalogGroups(currentGroups);
      }
      
      // Устанавливаем значение из elementData, если есть
      if (elementData && elementData.metadata && elementData.metadata.cabinet_tag) {
        cabinetTagEl.value = elementData.metadata.cabinet_tag;
        console.log('📋 [openCatalogItemEditModal] Установлено значение cabinet_tag:', elementData.metadata.cabinet_tag);
      }
      
      // Проверяем, что опции действительно добавлены
      console.log('📋 [openCatalogItemEditModal] Всего опций в select после заполнения:', cabinetTagEl.options.length);
      console.log('📋 [openCatalogItemEditModal] Опции:', Array.from(cabinetTagEl.options).map(opt => ({ value: opt.value, text: opt.text })));
    }

    // Очищаем варианты размеров при открытии (если новый элемент)
    if (!elementData) {
      sizeVariants = [];
      renderSizeVariants();
    } else if (elementData.metadata && elementData.metadata.size_variants) {
      // Загружаем сохраненные варианты размеров
      sizeVariants = elementData.metadata.size_variants;
      renderSizeVariants();
    } else {
      sizeVariants = [];
      renderSizeVariants();
    }
    
    // Заполняем поля вкладки "Размеры" при редактировании существующего элемента
    if (elementData && elementData.metadata) {
      const meta = elementData.metadata;
      
      const defaultSizeSelect = document.getElementById('catalog-item-edit-default-size') as HTMLSelectElement | null;
      const hideDefaultSizesCheckbox = document.getElementById('catalog-item-edit-hide-default-sizes') as HTMLInputElement | null;
      const allowCustomSizesCheckbox = document.getElementById('catalog-item-edit-allow-custom-sizes') as HTMLInputElement | null;
      const forbidWidthCheckbox = document.getElementById('catalog-item-edit-forbid-width') as HTMLInputElement | null;
      const forbidHeightCheckbox = document.getElementById('catalog-item-edit-forbid-height') as HTMLInputElement | null;
      const forbidDepthCheckbox = document.getElementById('catalog-item-edit-forbid-depth') as HTMLInputElement | null;
      const minWidthInput = document.getElementById('catalog-item-edit-min-width') as HTMLInputElement | null;
      const maxWidthInput = document.getElementById('catalog-item-edit-max-width') as HTMLInputElement | null;
      const minHeightInput = document.getElementById('catalog-item-edit-min-height') as HTMLInputElement | null;
      const maxHeightInput = document.getElementById('catalog-item-edit-max-height') as HTMLInputElement | null;
      const minDepthInput = document.getElementById('catalog-item-edit-min-depth') as HTMLInputElement | null;
      const maxDepthInput = document.getElementById('catalog-item-edit-max-depth') as HTMLInputElement | null;
      
      if (defaultSizeSelect && meta.default_size) {
        defaultSizeSelect.value = meta.default_size;
      } else if (defaultSizeSelect) {
        // Обновляем список вариантов в select
        updateDefaultSizeSelect();
      }
      if (hideDefaultSizesCheckbox) {
        hideDefaultSizesCheckbox.checked = meta.hide_default_sizes === true;
      }
      if (allowCustomSizesCheckbox) {
        allowCustomSizesCheckbox.checked = meta.allow_custom_sizes !== undefined ? meta.allow_custom_sizes : true;
      }
      if (forbidWidthCheckbox) {
        forbidWidthCheckbox.checked = meta.forbid_width === true;
      }
      if (forbidHeightCheckbox) {
        forbidHeightCheckbox.checked = meta.forbid_height === true;
      }
      if (forbidDepthCheckbox) {
        forbidDepthCheckbox.checked = meta.forbid_depth === true;
      }
      
      // Ограничения на размеры
      if (meta.size_limits) {
        const limits = meta.size_limits;
        if (minWidthInput) minWidthInput.value = String(limits.min_width || 0);
        if (maxWidthInput) maxWidthInput.value = String(limits.max_width || 0);
        if (minHeightInput) minHeightInput.value = String(limits.min_height || 0);
        if (maxHeightInput) maxHeightInput.value = String(limits.max_height || 0);
        if (minDepthInput) minDepthInput.value = String(limits.min_depth || 0);
        if (maxDepthInput) maxDepthInput.value = String(limits.max_depth || 0);
      }
    } else {
      // Новый элемент - устанавливаем значения по умолчанию для вкладки "Размеры"
      const hideDefaultSizesCheckbox = document.getElementById('catalog-item-edit-hide-default-sizes') as HTMLInputElement | null;
      const allowCustomSizesCheckbox = document.getElementById('catalog-item-edit-allow-custom-sizes') as HTMLInputElement | null;
      const forbidWidthCheckbox = document.getElementById('catalog-item-edit-forbid-width') as HTMLInputElement | null;
      const forbidHeightCheckbox = document.getElementById('catalog-item-edit-forbid-height') as HTMLInputElement | null;
      const forbidDepthCheckbox = document.getElementById('catalog-item-edit-forbid-depth') as HTMLInputElement | null;
      if (hideDefaultSizesCheckbox) hideDefaultSizesCheckbox.checked = false;
      if (allowCustomSizesCheckbox) allowCustomSizesCheckbox.checked = true;
      if (forbidWidthCheckbox) forbidWidthCheckbox.checked = false;
      if (forbidHeightCheckbox) forbidHeightCheckbox.checked = false;
      if (forbidDepthCheckbox) forbidDepthCheckbox.checked = false;
      
      // Обновляем select размера по умолчанию
      updateDefaultSizeSelect();
    }

    // Инициализируем кнопки для полей размеров вариантов (если модалка открыта)
    setTimeout(() => {
      initVariantSizeButtons();
    }, 100);

    // Переключаемся на вкладку "Основные" через вертикальное меню
    document.querySelectorAll('.catalog-menu-item').forEach(item => {
      (item as HTMLElement).classList.remove('active');
      (item as HTMLElement).style.background = '';
      (item as HTMLElement).style.borderLeftColor = 'transparent';
    });
    const mainMenuItem = document.querySelector('.catalog-menu-item[data-tab="main"]') as HTMLElement;
    if (mainMenuItem) {
      mainMenuItem.classList.add('active');
      mainMenuItem.style.background = '#2563eb';
      mainMenuItem.style.borderLeftColor = '#60a5fa';
    }
    document.querySelectorAll('.catalog-tab-content').forEach(content => {
      (content as HTMLElement).style.display = 'none';
    });
    const mainTab = document.getElementById('catalog-tab-main');
    if (mainTab) {
      mainTab.style.display = 'flex';
    }

    // Инициализация Vue Treeselect категорий (как в референсе Clodis)
    document.dispatchEvent(new CustomEvent('catalog-item-edit-category-init', {
      detail: {
        catalogType: currentTypeItemsId || '',
        categoryIds: selectedCategories.map(id => String(id))
      }
    }));

    // ⭐ Заполняем JSON таб при редактировании существующего модуля
    // ⭐ ВАЖНО: Заполняем JSON СРАЗУ при открытии модалки, ДО того как пользователь переключится на вкладку JSON
    const jsonEditor = document.getElementById('catalog-json-editor') as HTMLTextAreaElement | null;
    console.log('🔍 [openCatalogItemEditModal] JSON редактор найден:', !!jsonEditor);
    console.log('🔍 [openCatalogItemEditModal] Условия для JSON:', {
      hasJsonEditor: !!jsonEditor,
      hasElementData: !!elementData,
      hasClodisJSON: !!(elementData?.clodisJSON),
      clodisJSONIsArray: Array.isArray(elementData?.clodisJSON),
      sceneNodesCount: sceneNodes.length,
      rootSectionExists: !!sceneNodes.find(n => n.type === 'section' && n.parent === null)
    });
    if (jsonEditor && elementData && elementData.clodisJSON && Array.isArray(elementData.clodisJSON)) {
      // Заполняем textarea сохраненным JSON
      jsonEditor.value = JSON.stringify(elementData.clodisJSON, null, 2);
      console.log('✅ [openCatalogItemEditModal] JSON таб заполнен сохраненным clodisJSON');
      console.log('  📦 Длина JSON:', elementData.clodisJSON.length, 'элементов');
      console.log('  📦 Первый элемент:', elementData.clodisJSON[0] ? {
        type: elementData.clodisJSON[0].type,
        name: elementData.clodisJSON[0].name,
        hasChildren: !!elementData.clodisJSON[0].children,
        childrenCount: elementData.clodisJSON[0].children?.length || 0
      } : 'null');
    } else if (jsonEditor && !elementData) {
      // ⭐ ВАЖНО: Используем секцию, сохраненную ДО очистки сцены (если она была)
      // Потому что resetConstructorSceneForNewCatalogItem() удаляет секцию из sceneNodes
      const rootSection = rootSectionBeforeReset || sceneNodes.find(n => n.type === 'section' && n.parent === null);
      console.log('🔍 [openCatalogItemEditModal] Проверка секции в конструкторе:', {
        hasJsonEditor: !!jsonEditor,
        hasElementData: !!elementData,
        sceneNodesCount: sceneNodes.length,
        rootSectionBeforeReset: rootSectionBeforeReset?.name || 'нет',
        rootSectionFound: !!rootSection,
        rootSectionName: rootSection?.name,
        rootSectionId: rootSection?.id
      });
      if (rootSection) {
        // Если есть секция в конструкторе, экспортируем её в Clodis формат
        try {
          const clodisItem: ClodisItem = {
            type: 'section',
            name: rootSection.name,
            id: rootSection.id || '',
            lib: '',
            tags: '',
            interactive: 0,
            size: { x: 's:x', y: 's:y', z: 's:z' },
            pos: { x: 0, y: 0, z: 0 },
            pivot: { x: -1, y: -1, z: -1 },
            scale: { x: 1, y: 1, z: 1 },
            rot: { x: 0, y: 0, z: 0 },
            c_rot: { x: 0, y: 0, z: 0 },
            children: [],
            custom: {},
            condition: null,
            visible: 1,
            helpers_visible: 0,
            active: 1,
            variables: { visible: 1, main: {} },
            interaction: { auto_rotation: 1, check_intersection: 0, raycast: 1 },
            resizable: { enabled: 0, locks: {}, minmax: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } } },
            spec: {},
            events: { on_before_params: '', on_before_build: '', on_after_build: '', on_drag_end: '' },
            accessories: [],
            comments: '',
            section_key: '',
            params_key: ''
          };
          
          // Экспортируем детей упрощенно (полный экспорт при сохранении)
          rootSection.children.forEach(child => {
            if (child.type === 'detail') {
              const childItem: ClodisItem = {
                type: child.orientation === 'v' ? 'wall' : (child.orientation === 'h' ? 'shelf' : 'facade'),
                name: child.name,
                id: child.id || '',
                lib: '',
                tags: '',
                interactive: 0,
                size: {
                  x: child.metadata?.expressions?.size?.x || 'g:g0.thickness',
                  y: child.metadata?.expressions?.size?.y || 's:y',
                  z: child.metadata?.expressions?.size?.z || 's:z'
                },
                pos: {
                  x: child.metadata?.expressions?.pos?.x || 0,
                  y: child.metadata?.expressions?.pos?.y || 0,
                  z: child.metadata?.expressions?.pos?.z || 0
                },
                pivot: child.metadata?.pivot ? {
                  x: typeof child.metadata.pivot.x === 'number' ? child.metadata.pivot.x : (child.metadata.pivot.x === 'min' ? -1 : (child.metadata.pivot.x === 'max' ? 1 : 0)),
                  y: typeof child.metadata.pivot.y === 'number' ? child.metadata.pivot.y : (child.metadata.pivot.y === 'min' ? -1 : (child.metadata.pivot.y === 'max' ? 1 : 0)),
                  z: typeof child.metadata.pivot.z === 'number' ? child.metadata.pivot.z : (child.metadata.pivot.z === 'min' ? -1 : (child.metadata.pivot.z === 'max' ? 1 : 0))
                } : { x: -1, y: -1, z: -1 },
                scale: { x: 1, y: 1, z: 1 },
                rot: { x: 0, y: 0, z: 0 },
                c_rot: { x: 0, y: 0, z: 0 },
                children: [],
                custom: {},
                condition: null,
                visible: 1,
                helpers_visible: 0,
                active: 1,
                variables: { visible: 1, main: {} },
                interaction: { auto_rotation: 1, check_intersection: 0, raycast: 1 },
                resizable: { enabled: 0, locks: {}, minmax: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } } },
                spec: {
                  type: child.metadata?.detailTypeId || '',
                  material: {
                    group: child.metadata?.material?.group || 'g0',
                    key: child.metadata?.material?.key || 'ldsp'
                  },
                  orientation: child.orientation === 'v' ? 'v' : (child.orientation === 'h' ? 'h' : 'f'),
                  key: child.metadata?.detailTypeId === 'vertical_middle' ? '' : (child.metadata?.detailTypeId || ''),
                  type_params: {}
                },
                events: { on_before_params: '', on_before_build: '', on_after_build: '', on_drag_end: '' },
                accessories: [],
                comments: '',
                section_key: '',
                params_key: ''
              };
              clodisItem.children.push(childItem);
            }
          });
          
          const clodisJSON = [clodisItem];
          jsonEditor.value = JSON.stringify(clodisJSON, null, 2);
          console.log('✅ [openCatalogItemEditModal] JSON таб заполнен экспортированной секцией из конструктора (новый модуль с секцией)');
          console.log('  📦 Экспортирована корневая секция:', rootSection.name, 'детали:', clodisItem.children.length);
        } catch (e) {
          console.error('❌ [openCatalogItemEditModal] Ошибка экспорта секции в Clodis JSON:', e);
          jsonEditor.value = '[]';
        }
      } else {
        // Если секции нет в конструкторе, показываем пустой массив [] (как в референсе для нового модуля)
        jsonEditor.value = '[]';
        console.log('✅ [openCatalogItemEditModal] JSON таб инициализирован пустым массивом [] (новый модуль без секции, как в референсе)');
      }
    } else if (jsonEditor && elementData && (!elementData.clodisJSON || !Array.isArray(elementData.clodisJSON))) {
      // ⭐ НОВАЯ ЛОГИКА:
      // 1. Сначала пробуем получить полный Clodis JSON с сервера (как в референсе).
      // 2. Если не получилось — fallback: упрощённый экспорт из текущей сцены.
      (async () => {
        try {
          console.log('🔄 [openCatalogItemEditModal] Пытаемся загрузить Clodis JSON с сервера для элемента:', elementData.id);
          let response: Response | null = null;
          try {
            response = await fetch(`${API_BASE_URL}/catalog/items_get/${elementData.id}`);
          } catch (fetchError: any) {
            console.warn('⚠️ [openCatalogItemEditModal] Не удалось обратиться к API items_get:', fetchError);
            response = null as any;
          }

          if (response && response.ok) {
            const data = await response.json();
            const serverItem = data.item || data;

            let serverClodisJSON: ClodisItem[] | null = null;
            if (serverItem.data) {
              try {
                const parsed = typeof serverItem.data === 'string'
                  ? JSON.parse(serverItem.data)
                  : serverItem.data;

                if (parsed.params && Array.isArray(parsed.params)) {
                  serverClodisJSON = parsed.params;
                } else if (Array.isArray(parsed)) {
                  serverClodisJSON = parsed;
                } else {
                  serverClodisJSON = [parsed];
                }
              } catch (e) {
                console.warn('⚠️ [openCatalogItemEditModal] Ошибка парсинга serverItem.data для элемента:', elementData.id, e);
              }
            }

            if (serverClodisJSON && serverClodisJSON.length > 0) {
              elementData.clodisJSON = serverClodisJSON;
              if (currentEditingCatalogElement && currentEditingCatalogElement.id === elementData.id) {
                currentEditingCatalogElement.clodisJSON = serverClodisJSON;
              }

              jsonEditor.value = JSON.stringify(serverClodisJSON, null, 2);
              console.log('✅ [openCatalogItemEditModal] JSON таб заполнен clodisJSON, загруженным с сервера');

              // Обновляем localStorage, чтобы дальше не терять JSON
              try {
                const allElements = loadAllCatalogElements();
                const idx = allElements.findIndex(el => String(el.id) === String(elementData.id));
                if (idx >= 0) {
                  allElements[idx].clodisJSON = serverClodisJSON;
                  saveAllCatalogElements(allElements);
                  console.log('✅ [openCatalogItemEditModal] elementCatalog обновлён полным clodisJSON из сервера');
                }
              } catch (e) {
                console.warn('⚠️ [openCatalogItemEditModal] Не удалось обновить elementCatalog:', e);
              }

              return; // успех, fallback не нужен
            }
          }
        } catch (e) {
          console.warn('⚠️ [openCatalogItemEditModal] Ошибка при попытке загрузки JSON с сервера:', e);
        }

        // --- Fallback: упрощённый экспорт из текущей сцены ---
        console.log('ℹ️ [openCatalogItemEditModal] Используем fallback: экспорт секции из конструктора в JSON');
        const rootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null);
        if (rootSection) {
          try {
            const clodisItem: ClodisItem = {
              type: 'section',
              name: rootSection.name,
              id: rootSection.id || '',
              lib: '',
              tags: '',
              interactive: 0,
              size: { x: 's:x', y: 's:y', z: 's:z' },
              pos: { x: 0, y: 0, z: 0 },
              pivot: { x: -1, y: -1, z: -1 },
              scale: { x: 1, y: 1, z: 1 },
              rot: { x: 0, y: 0, z: 0 },
              c_rot: { x: 0, y: 0, z: 0 },
              children: [],
              custom: {},
              condition: null,
              visible: 1,
              helpers_visible: 0,
              active: 1,
              variables: { visible: 1, main: {} },
              interaction: { auto_rotation: 1, check_intersection: 0, raycast: 1 },
              resizable: { enabled: 0, locks: {}, minmax: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } } },
              spec: {},
              events: { on_before_params: '', on_before_build: '', on_after_build: '', on_drag_end: '' },
              accessories: [],
              comments: '',
              section_key: '',
              params_key: ''
            };
            
            rootSection.children.forEach(child => {
              if (child.type === 'detail') {
                const childItem: ClodisItem = {
                  type: child.orientation === 'v' ? 'wall' : (child.orientation === 'h' ? 'shelf' : 'facade'),
                  name: child.name,
                  id: child.id || '',
                  lib: '',
                  tags: '',
                  interactive: 0,
                  size: {
                    x: child.metadata?.expressions?.size?.x || 'g:g0.thickness',
                    y: child.metadata?.expressions?.size?.y || 's:y',
                    z: child.metadata?.expressions?.size?.z || 's:z'
                  },
                  pos: {
                    x: child.metadata?.expressions?.pos?.x || 0,
                    y: child.metadata?.expressions?.pos?.y || 0,
                    z: child.metadata?.expressions?.pos?.z || 0
                  },
                  pivot: child.metadata?.pivot ? {
                    x: typeof child.metadata.pivot.x === 'number' ? child.metadata.pivot.x : (child.metadata.pivot.x === 'min' ? -1 : (child.metadata.pivot.x === 'max' ? 1 : 0)),
                    y: typeof child.metadata.pivot.y === 'number' ? child.metadata.pivot.y : (child.metadata.pivot.y === 'min' ? -1 : (child.metadata.pivot.y === 'max' ? 1 : 0)),
                    z: typeof child.metadata.pivot.z === 'number' ? child.metadata.pivot.z : (child.metadata.pivot.z === 'min' ? -1 : (child.metadata.pivot.z === 'max' ? 1 : 0))
                  } : { x: -1, y: -1, z: -1 },
                  scale: { x: 1, y: 1, z: 1 },
                  rot: { x: 0, y: 0, z: 0 },
                  c_rot: { x: 0, y: 0, z: 0 },
                  children: [],
                  custom: {},
                  condition: null,
                  visible: 1,
                  helpers_visible: 0,
                  active: 1,
                  variables: { visible: 1, main: {} },
                  interaction: { auto_rotation: 1, check_intersection: 0, raycast: 1 },
                  resizable: { enabled: 0, locks: {}, minmax: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } } },
                  spec: {
                    type: child.metadata?.detailTypeId || '',
                    material: {
                      group: child.metadata?.material?.group || 'g0',
                      key: child.metadata?.material?.key || 'ldsp'
                    },
                    orientation: child.orientation === 'v' ? 'v' : (child.orientation === 'h' ? 'h' : 'f'),
                    key: child.metadata?.detailTypeId === 'vertical_middle' ? '' : (child.metadata?.detailTypeId || ''),
                    type_params: {}
                  },
                  events: { on_before_params: '', on_before_build: '', on_after_build: '', on_drag_end: '' },
                  accessories: [],
                  comments: '',
                  section_key: '',
                  params_key: ''
                };
                clodisItem.children.push(childItem);
              }
            });
            
            const clodisJSON = [clodisItem];
            const jsonString = JSON.stringify(clodisJSON, null, 2);
            jsonEditor.value = jsonString;
            console.log('✅ [openCatalogItemEditModal] JSON таб заполнен экспортированной секцией из конструктора (упрощенная версия)');
            console.log('  📦 Экспортирована корневая секция:', rootSection.name, 'детали:', clodisItem.children.length);
            console.log('  📦 JSON длина:', jsonString.length, 'символов');
            console.log('  📦 JSON первые 100 символов:', jsonString.substring(0, 100));
          } catch (e) {
            console.error('❌ [openCatalogItemEditModal] Ошибка экспорта секции в Clodis JSON (fallback):', e);
            jsonEditor.value = '[]';
          }
        } else {
          jsonEditor.value = '[]';
          console.warn('⚠️ [openCatalogItemEditModal] clodisJSON отсутствует и нет секции в конструкторе (fallback)');
          console.warn('  📦 elementData:', elementData ? {
            id: elementData.id,
            name: elementData.name,
            hasClodisJSON: !!elementData.clodisJSON,
            clodisJSONIsArray: Array.isArray(elementData.clodisJSON)
          } : 'elementData отсутствует');
          console.warn('  📦 sceneNodes:', sceneNodes.map(n => ({ type: n.type, name: n.name, parent: n.parent?.name || 'null', id: n.id })));
          console.warn('  📦 Все секции в sceneNodes:', sceneNodes.filter(n => n.type === 'section').map(n => ({ name: n.name, parent: n.parent?.name || 'null' })));
        }
      })();
    } else if (jsonEditor && !elementData) {
      // ⭐ ВАЖНО: В референсе для нового модуля показывается пустой массив []
      jsonEditor.value = '[]';
      console.log('✅ [openCatalogItemEditModal] JSON таб инициализирован пустым массивом [] (новый модуль, как в референсе)');
    }

    // ⭐ ПО РЕФЕРЕНСУ: Показываем блок контента (не модалка, а часть страницы)
    containerEl.style.display = 'block';
    containerEl.style.setProperty('z-index', '10003', 'important'); // Выше страницы списка (10002)
    console.log('✅ [openCatalogItemEditModal] Блок редактирования каталога показан');

    // Упрощённо: переносим только canvas рендера в контейнер превью + импорт / пересчёт и лёгкий resize
    setTimeout(() => {
      const previewContainer =
        document.querySelector('#constructor-3d-canvas-container') as HTMLElement | null ||
        document.querySelector('#catalog-item-edit-3d-container') as HTMLElement | null;

      if (!previewContainer) {
        console.warn('⚠️ [openCatalogItemEditModal] previewContainer не найден, пропускаем работу с превью');
      } else {
        // Переносим только canvas конструктора в правую панель модалки
        const canvas = renderer?.domElement as HTMLCanvasElement | undefined;
        if (canvas) {
          if (canvas.parentElement !== previewContainer) {
            try {
              canvas.parentElement?.removeChild(canvas);
            } catch (e) {
              console.warn('⚠️ [openCatalogItemEditModal] Не удалось удалить canvas из старого контейнера:', e);
            }
            // Очищаем контейнер превью и вставляем canvas
          previewContainer.innerHTML = '';
            previewContainer.appendChild(canvas);
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            console.log('✅ [openCatalogItemEditModal] Canvas перенесён в previewContainer');
          }
        } else {
          console.warn('⚠️ [openCatalogItemEditModal] Canvas не найден!');
        }
      }

      if (elementData && Array.isArray(elementData.clodisJSON) && elementData.clodisJSON.length > 0) {
        console.log('✅ [openCatalogItemEditModal] Импортируем сохранённый модуль из clodisJSON');
        // metadata.size хранится в метрах – конвертируем в миллиметры для ClodisBuilder
        let savedSizeMM: { width: number; height: number; depth: number } | undefined;
        if (elementData.metadata && elementData.metadata.size) {
          const s = elementData.metadata.size;
          savedSizeMM = {
            width: Math.round((s.width || s.x || 0) * 1000),
            height: Math.round((s.height || s.y || 0) * 1000),
            depth: Math.round((s.depth || s.z || 0) * 1000),
          };
          console.log('📐 [openCatalogItemEditModal] savedSizeMM из metadata:', savedSizeMM);
        }
        // ⭐ ВАЖНО: При импорте JSON НЕ вызываем updateSectionFromInputs(), 
        // так как importModuleFromClodisJSON сама построит модель без рамки
        importModuleFromClodisJSON(elementData.clodisJSON, savedSizeMM);
        
        // ⭐ ВАЖНО: Загружаем шаблоны из Clodis JSON после импорта (с задержкой для надежности)
        setTimeout(() => {
          loadTemplatesFromClodisJSON(elementData.clodisJSON);
        }, 200);
      } else {
        console.log('⚠️ [openCatalogItemEditModal] clodisJSON отсутствует, вызываем updateSectionFromInputs()');
        // Только если нет clodisJSON, создаем секцию с рамкой через updateSectionFromInputs
        updateSectionFromInputs();
        
        // Очищаем селектор шаблонов для нового элемента
        const templateSelect = document.getElementById('catalog-item-edit-active-template') as HTMLSelectElement | null;
        if (templateSelect) {
          templateSelect.innerHTML = '<option value="auto">Авто</option>';
        }
      }

          setTimeout(() => {
        // Принудительно обновляем размеры canvas
            onResize();
        console.log('✅ [openCatalogItemEditModal] onResize вызван первый раз');
        
            setTimeout(() => {
              onResize();
          console.log('✅ [openCatalogItemEditModal] onResize вызван второй раз');
              
          // Проверяем размеры canvas
              const canvas = renderer.domElement;
              const canvasRect = canvas.getBoundingClientRect();
          console.log('🔍 [openCatalogItemEditModal] Canvas после onResize:', {
            width: canvasRect.width,
            height: canvasRect.height,
            display: window.getComputedStyle(canvas).display,
            visibility: window.getComputedStyle(canvas).visibility
          });
              
          // Принудительно рендерим сцену
          render();
          console.log('✅ [openCatalogItemEditModal] Принудительный рендер выполнен');
          
                const frame = scene.children.find(child => {
                  if (child instanceof THREE.Group && child.children.length > 0) {
                    return child.children.some(c => 
                      (c instanceof THREE.Mesh && (c as any).material?.transparent === true) || 
                      c instanceof THREE.LineSegments ||
                      c instanceof THREE.AxesHelper
                    );
                  }
                  return false;
                }) as THREE.Group | undefined;
                
                if (frame) {
                  const box = new THREE.Box3().setFromObject(frame);
                  const center = new THREE.Vector3();
                  box.getCenter(center);
                  const size = box.getSize(new THREE.Vector3());
                  const maxSize = Math.max(size.x, size.y, size.z);
                  const distance = maxSize * 2.5;
                  camera.position.set(
                    center.x + distance * 0.7,
                    center.y + distance * 0.6,
                    center.z + distance * 0.7
                  );
                  controls.target.copy(center);
                  controls.update();
                  render();
            console.log('✅ [openCatalogItemEditModal] Камера настроена на frame');
        } else {
            console.warn('⚠️ [openCatalogItemEditModal] Frame не найден в сцене');
          }
        }, 50);
      }, 50);
    }, 200);
  }

  function closeCatalogItemEditModal() {
    // ⭐ ИЗМЕНЕНО: Используем catalog-item-edit-container вместо модалки (по референсу)
    const containerEl = document.getElementById('catalog-item-edit-container') as HTMLDivElement | null;
    if (!containerEl) return;
    containerEl.style.display = 'none';
    
    // ⭐ ВАЖНО: Восстанавливаем страницу списка элементов типа, если она была открыта
    if (currentTypeItemsId) {
      const typeItemsContainer = document.getElementById('type-elements-container');
      if (typeItemsContainer) {
        typeItemsContainer.style.display = 'block';
        console.log('✅ [closeCatalogItemEditModal] Страница списка элементов типа восстановлена');
      }
    }
    
    // Возвращаем основной конструктор на исходное место
    const appContainer = document.getElementById('app-container') as HTMLElement | null;
    const elementToMove = appContainer || app;
    
    if (appOriginalParent && elementToMove instanceof HTMLElement) {
      // Убираем стили, которые мы добавили
      elementToMove.style.width = '';
      elementToMove.style.height = '';
      elementToMove.style.position = '';
      elementToMove.style.display = '';
      
      // Возвращаем на место
      if (appOriginalNextSibling && appOriginalNextSibling.parentNode === appOriginalParent) {
        appOriginalParent.insertBefore(elementToMove, appOriginalNextSibling);
      } else {
        appOriginalParent.appendChild(elementToMove);
      }
      
      // Обновляем размеры после возврата
      setTimeout(() => {
        onResize();
      }, 50);
      
      appOriginalParent = null;
      appOriginalNextSibling = null;
    }

    // Сбрасываем ссылку на редактируемый элемент каталога
    currentEditingCatalogElement = null;
  }

  // Функция для обновления списка групп в модальном окне каталога (если оно открыто)
  function refreshCatalogGroupsInModal() {
    const cabinetTagEl = document.getElementById('catalog-item-edit-cabinet-tag') as HTMLSelectElement | null;
    if (!cabinetTagEl) {
      // Модальное окно не открыто, ничего не делаем
      return;
    }
    
    // Сохраняем текущее выбранное значение
    const currentValue = cabinetTagEl.value;
    
    // Обновляем глобальные группы из localStorage (как в референсе)
    catalogGroups = loadCatalogGroups();
    // Обновляем hash
    catalogGroupsHash = {};
    catalogGroups.forEach(group => {
      if (group.key) {
        catalogGroupsHash[group.key] = group;
      }
    });
    // Обновляем в window
    (window as any).catalogGroups = catalogGroups;
    (window as any).catalogGroupsHash = catalogGroupsHash;
    
    const currentGroups = catalogGroups;
    console.log('🔄 [refreshCatalogGroupsInModal] Обновление списка групп в модальном окне. Загружено групп:', currentGroups.length);
    
    // Очищаем select
    cabinetTagEl.innerHTML = '<option value="">Выберите группу модулей</option>';
    
    // Добавляем каждую группу в select
    currentGroups.forEach(group => {
      // Если у группы нет key, создаем его из id или name
      let groupKey = group.key;
      if (!groupKey) {
        if (group.id) {
          groupKey = group.id.replace(/^group-/, '').toLowerCase();
        }
        if (!groupKey && group.name) {
          groupKey = group.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        }
        if (!groupKey) {
          groupKey = group.id || String(Date.now());
        }
        group.key = groupKey;
      }
      
      const option = document.createElement('option');
      option.value = groupKey;
      option.textContent = group.name;
      cabinetTagEl.appendChild(option);
    });
    
    // Сохраняем обновленные группы обратно в localStorage (с key)
    if (currentGroups.length > 0) {
      saveCatalogGroups(currentGroups);
    }
    
    // Восстанавливаем выбранное значение, если оно все еще существует
    if (currentValue && Array.from(cabinetTagEl.options).some(opt => opt.value === currentValue)) {
      cabinetTagEl.value = currentValue;
    }
    
    console.log('✅ [refreshCatalogGroupsInModal] Список групп обновлен. Всего опций:', cabinetTagEl.options.length);
  }

  // Экспортируем функции для использования в admin-panel.js и modal-manager.js
  (window as any).openCatalogItemEditModal = openCatalogItemEditModal;
  (window as any).closeCatalogItemEditModal = closeCatalogItemEditModal;
  (window as any).loadCatalogGroups = loadCatalogGroups;
  
  // ⭐ ВАЖНО: Экспортируем функции для работы со списком элементов типа (для openTypeItemsModal)
  (window as any).renderTypeItemsTable = renderTypeItemsTable;
  (window as any).renderTypeItemsPagination = renderTypeItemsPagination;
  (window as any).attachTypeItemsPageHandlers = attachTypeItemsPageHandlers;
  (window as any).saveCatalogGroups = saveCatalogGroups;
  (window as any).loadCatalogTypes = loadCatalogTypes;
  (window as any).saveCatalogTypes = saveCatalogTypes;
  (window as any).refreshCatalogGroupsInModal = refreshCatalogGroupsInModal;
  
  // Экспортируем функции создания деталей для использования в HTML
  // ⚠️ createSectionFromInlineModal удалена - код дочерней секции вычищен
  
  if (typeof createDetailFromInlineModal !== 'undefined') {
    (window as any).createDetailFromInlineModal = createDetailFromInlineModal;
  } else {
    console.error('❌ [wireUI] createDetailFromInlineModal не определена!');
  }
  
  console.log('✅ [wireUI] Все функции экспортированы в window:', {
    openCatalogItemEditModal: typeof (window as any).openCatalogItemEditModal,
    closeCatalogItemEditModal: typeof (window as any).closeCatalogItemEditModal,
    createDetailFromInlineModal: typeof (window as any).createDetailFromInlineModal
  });

  // Модалка выбора категорий для элемента каталога
  const catalogCategoriesModalBackdrop = document.getElementById('catalog-categories-backdrop') as HTMLDivElement | null;
  const catalogCategoriesModal = document.getElementById('catalog-categories-modal') as HTMLDivElement | null;
  const catalogCategoriesList = document.getElementById('catalog-categories-list') as HTMLDivElement | null;
  const catalogCategoriesSelected = document.getElementById('catalog-categories-selected') as HTMLDivElement | null;
  const catalogCategoriesNewInput = document.getElementById('catalog-categories-new-input') as HTMLInputElement | null;
  const btnCatalogCategories = document.getElementById('btn-catalog-item-edit-categories');
  const btnCatalogCategoriesClose = document.getElementById('btn-catalog-categories-close');
  const btnCatalogCategoriesCancel = document.getElementById('btn-catalog-categories-cancel');
  const btnCatalogCategoriesConfirm = document.getElementById('btn-catalog-categories-confirm');
  const btnCatalogCategoriesAdd = document.getElementById('btn-catalog-categories-add');

  // Категории каталога (Шкафы, Кухни и т.д.)
  const catalogMainCategories = [
    { id: 'catalog-kitchen', name: 'Кухни', catalogType: 'kitchen' },
    { id: 'catalog-cabinet', name: 'Шкафы', catalogType: 'cabinet' },
    { id: 'catalog-door', name: 'Двери', catalogType: 'door' },
    { id: 'catalog-shelf', name: 'Полки', catalogType: 'shelf' },
    { id: 'catalog-drawer', name: 'Ящики', catalogType: 'drawer' },
  ];

  let selectedCategories: string[] = [];

  function openCatalogCategoriesSelectionModal() {
    if (!catalogCategoriesModalBackdrop || !catalogCategoriesList || !catalogCategoriesSelected) return;
    
    // Загружаем текущие выбранные категории (из чипов или чекбоксов)
    const categoryContainer = document.getElementById('catalog-item-edit-category') as HTMLElement | null;
    const checkboxes = categoryContainer?.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-category-id]:checked');
    if (checkboxes && checkboxes.length > 0) {
      selectedCategories = [];
      checkboxes.forEach(cb => {
        const v = cb.dataset.categoryId || cb.value;
        if (v) selectedCategories.push(v);
      });
    } else {
      // При чипах selectedCategories уже актуален
      selectedCategories = [...selectedCategories];
    }
    
    // Заполняем список категорий каталога
    catalogCategoriesList.innerHTML = '';
    catalogMainCategories.forEach(cat => {
      const catDiv = document.createElement('div');
      catDiv.style.cssText = 'padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: space-between;';
      catDiv.innerHTML = `
        <span style="font-size: 13px; color: #333;">${cat.name}</span>
        <input type="checkbox" data-category-id="${cat.id}" data-catalog-type="${cat.catalogType}" style="cursor: pointer;" ${selectedCategories.map(s=>String(s)).includes(String(cat.id)) ? 'checked' : ''} />
      `;
      catDiv.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          const checkbox = catDiv.querySelector('input[type="checkbox"]') as HTMLInputElement;
          checkbox.checked = !checkbox.checked;
        }
        updateSelectedCategories();
      });
      catalogCategoriesList.appendChild(catDiv);
    });
    
    // Загружаем категории типа (если есть)
    if (currentTypeItemsId) {
      const typeCategories = loadCatalogCategories(currentTypeItemsId);
      typeCategories.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.style.cssText = 'padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: space-between;';
        catDiv.innerHTML = `
          <span style="font-size: 13px; color: #333;">${cat.name}</span>
          <input type="checkbox" data-category-id="${cat.id}" style="cursor: pointer;" ${selectedCategories.map(s=>String(s)).includes(String(cat.id)) ? 'checked' : ''} />
        `;
        catDiv.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).tagName !== 'INPUT') {
            const checkbox = catDiv.querySelector('input[type="checkbox"]') as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
          }
          updateSelectedCategories();
        });
        catalogCategoriesList.appendChild(catDiv);
      });
    }
    
    updateSelectedCategoriesDisplay();
    catalogCategoriesModalBackdrop.style.display = 'flex';
  }

  function updateSelectedCategories() {
    selectedCategories = [];
    if (catalogCategoriesList) {
      catalogCategoriesList.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox: Element) => {
        const input = checkbox as HTMLInputElement;
        selectedCategories.push(input.dataset.categoryId || '');
      });
    }
    updateSelectedCategoriesDisplay();
  }

  function updateSelectedCategoriesDisplay() {
    if (!catalogCategoriesSelected) return;
    catalogCategoriesSelected.innerHTML = '';
    
    if (selectedCategories.length === 0) {
      catalogCategoriesSelected.innerHTML = '<div style="color: #999; font-size: 12px; padding: 8px;">Категории не выбраны</div>';
      return;
    }
    
    selectedCategories.forEach(catId => {
      // Находим название категории
      let catName = '';
      const mainCat = catalogMainCategories.find(c => c.id === catId);
      if (mainCat) {
        catName = mainCat.name;
      } else if (currentTypeItemsId) {
        const typeCats = loadCatalogCategories(currentTypeItemsId);
        const typeCat = typeCats.find(c => c.id === catId);
        if (typeCat) catName = typeCat.name;
      }
      
      if (catName) {
        const tag = document.createElement('div');
        tag.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #2563eb; color: #fff; border-radius: 12px; font-size: 12px;';
        tag.innerHTML = `
          <span>${catName}</span>
          <button data-category-id="${catId}" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 14px; padding: 0; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">×</button>
        `;
        tag.querySelector('button')?.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedCategories = selectedCategories.filter(id => id !== catId);
          updateSelectedCategoriesDisplay();
          // Снимаем галочку в списке
          const checkbox = catalogCategoriesList?.querySelector(`input[data-category-id="${catId}"]`) as HTMLInputElement;
          if (checkbox) checkbox.checked = false;
        });
        catalogCategoriesSelected.appendChild(tag);
      }
    });
  }

  function closeCatalogCategoriesSelectionModal() {
    if (!catalogCategoriesModalBackdrop) return;
    catalogCategoriesModalBackdrop.style.display = 'none';
  }

  function applySelectedCategories() {
    const categoryContainer = document.getElementById('catalog-item-edit-category') as HTMLElement | null;
    if (!categoryContainer) return;
    const cats = currentTypeItemsId ? loadCatalogCategories(currentTypeItemsId) : [];
    categoryContainer.innerHTML = '';
    selectedCategories.forEach(catId => {
      const c = cats.find((x: { id: string | number }) => String(x.id) === String(catId));
      const mainCat = !c ? catalogMainCategories.find((m: { id: string | number }) => String(m.id) === String(catId)) : null;
      const typeCat = !c && currentTypeItemsId ? loadCatalogCategories(currentTypeItemsId).find((x: { id: string | number }) => String(x.id) === String(catId)) : null;
      const name = c ? c.name : (mainCat?.name || (typeCat as { name?: string })?.name || String(catId));
      const chip = document.createElement('div');
      chip.className = 'catalog-category-chip';
      chip.style.cssText = 'display:inline-flex; align-items:center; gap:6px; padding:4px 10px; background:#2563eb; color:#fff; border-radius:12px; font-size:12px;';
      chip.innerHTML = `<span>${name}</span><button type="button" data-category-id="${String(catId)}" style="background:none;border:none;color:#fff;cursor:pointer;font-size:14px;padding:0;line-height:1;">×</button>`;
      chip.querySelector('button')?.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedCategories = selectedCategories.filter(id => String(id) !== String(catId));
        applySelectedCategories();
      });
      categoryContainer.appendChild(chip);
    });
    if (selectedCategories.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'catalog-category-chips-placeholder';
      empty.style.cssText = 'color:#999; font-size:13px;';
      empty.textContent = 'Выберите категории';
      categoryContainer.appendChild(empty);
    }
    closeCatalogCategoriesSelectionModal();
  }

  // Обработчики модалки выбора категорий
  btnCatalogCategories?.addEventListener('click', () => {
    openCatalogCategoriesSelectionModal();
  });

  btnCatalogCategoriesClose?.addEventListener('click', () => {
    closeCatalogCategoriesSelectionModal();
  });

  btnCatalogCategoriesCancel?.addEventListener('click', () => {
    closeCatalogCategoriesSelectionModal();
  });

  btnCatalogCategoriesConfirm?.addEventListener('click', () => {
    applySelectedCategories();
  });

  btnCatalogCategoriesAdd?.addEventListener('click', () => {
    if (!catalogCategoriesNewInput || !currentTypeItemsId) return;
    const name = catalogCategoriesNewInput.value.trim();
    if (!name) {
      alert('Введите название категории');
      return;
    }
    
    const list = loadCatalogCategories(currentTypeItemsId);
    if (list.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Категория с таким названием уже существует');
      return;
    }
    
    const newCategory = { id: 'cat-' + generateId(), name: name, parentId: null };
    list.push(newCategory);
    saveCatalogCategories(currentTypeItemsId, list);
    
    // Добавляем в список
    const catDiv = document.createElement('div');
    catDiv.style.cssText = 'padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: space-between;';
    catDiv.innerHTML = `
      <span style="font-size: 13px; color: #333;">${name}</span>
      <input type="checkbox" data-category-id="${newCategory.id}" style="cursor: pointer;" />
    `;
    catDiv.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'INPUT') {
        const checkbox = catDiv.querySelector('input[type="checkbox"]') as HTMLInputElement;
        checkbox.checked = !checkbox.checked;
      }
      updateSelectedCategories();
    });
    if (catalogCategoriesList) {
      catalogCategoriesList.appendChild(catDiv);
    }
    
    catalogCategoriesNewInput.value = '';
  });

  catalogCategoriesModalBackdrop?.addEventListener('click', (e) => {
    if (e.target === catalogCategoriesModalBackdrop) {
      closeCatalogCategoriesSelectionModal();
    }
  });

  // Обработчик загрузки иконки
  const iconInput = document.getElementById('catalog-item-edit-icon-input') as HTMLInputElement | null;
  const iconContainer = document.getElementById('catalog-item-edit-icon') as HTMLElement | null;
  
  if (iconInput && iconContainer) {
    iconInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // Удаляем старый контент (кроме input)
          const existingImg = iconContainer.querySelector('img');
          if (existingImg) existingImg.remove();
          
          // Удаляем placeholder текст
          const placeholder = iconContainer.querySelector('div');
          if (placeholder && placeholder.textContent?.includes('Нажмите для загрузки')) {
            placeholder.remove();
          }
          
          // Создаем новое изображение
          const img = document.createElement('img');
          img.src = result;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.style.borderRadius = '4px';
          iconContainer.insertBefore(img, iconContainer.firstChild);
          
          console.log('✅ Иконка загружена:', file.name);
        }
      };
      reader.onerror = () => {
        alert('Ошибка при загрузке изображения');
      };
      reader.readAsDataURL(file);
    });
    
    // Обработчик клика по контейнеру иконки — capture-фаза, чтобы перехватить до file input
    iconContainer.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof (window as unknown as { openFileManager?: (opts: { allowedExt: string[]; initialPath: string; onSelect: (r: { url: string }) => void }) => void }).openFileManager === 'function') {
        (window as unknown as { openFileManager: (opts: { allowedExt: string[]; initialPath: string; onSelect: (r: { url: string }) => void }) => void }).openFileManager({
          allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
          initialPath: 'common_assets/images/materials',
          onSelect: (r) => {
            if (r?.url) {
              const existingImg = iconContainer.querySelector('img');
              if (existingImg) existingImg.remove();
              const placeholder = iconContainer.querySelector('.pp_img_placeholder, div');
              if (placeholder) (placeholder as HTMLElement).style.display = 'none';
              const img = document.createElement('img');
              img.src = r.url;
              img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:4px;';
              iconContainer.insertBefore(img, iconContainer.firstChild);
            }
          }
        });
      } else {
        iconInput.click();
      }
    }, true);
  }

  // ===== КАТЕГОРИИ ТИПА (как "Категории Кухни") =====

  function renderCatalogCategories() {
    if (!catalogCategoriesBody || !currentTypeItemsId) return;
    let list = loadCatalogCategories(currentTypeItemsId);

    if (!list.length) {
      catalogCategoriesBody.innerHTML =
        '<tr><td colspan="2" style="padding:12px 10px; text-align:center; color:#999;">Категорий пока нет</td></tr>';
      return;
    }

    // Пока рендерим плоский список (иерархию добавим позже)
    catalogCategoriesBody.innerHTML = list
      .map(
        c => `
        <tr data-id="${c.id}">
          <td style="padding:6px 10px; border-bottom:1px solid #eee;">${c.name}</td>
          <td style="padding:6px 10px; border-bottom:1px solid #eee;">
            <button class="btn btn-sm" data-action="edit">✏️</button>
            <button class="btn btn-sm" data-action="delete" style="margin-left:4px;">🗑</button>
          </td>
        </tr>`
      )
      .join('');

    catalogCategoriesBody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = (btn as HTMLElement).closest('tr');
        const id = tr?.getAttribute('data-id');
        if (!id || !currentTypeItemsId) return;
        const list = loadCatalogCategories(currentTypeItemsId);
        const item = list.find(c => c.id === id);
        if (!item) return;
        const name = prompt('Новое название категории:', item.name);
        if (!name || !name.trim()) return;
        item.name = name.trim();
        saveCatalogCategories(currentTypeItemsId, list);
        renderCatalogCategories();
      });
    });

    catalogCategoriesBody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = (btn as HTMLElement).closest('tr');
        const id = tr?.getAttribute('data-id');
        if (!id || !currentTypeItemsId) return;
        if (!confirm('Удалить категорию?')) return;
        let list = loadCatalogCategories(currentTypeItemsId);
        list = list.filter(c => c.id !== id);
        saveCatalogCategories(currentTypeItemsId, list);
        renderCatalogCategories();
      });
    });
  }

  function openCatalogCategoriesModal() {
    if (!catalogCategoriesBackdrop || !currentTypeItemsId) return;
    // Заголовок "Категории Кухни"
    if (catalogCategoriesTitle) {
      const typeItemsTitleEl = document.getElementById('type-elements-title') as HTMLDivElement | null;
      const txt = typeItemsTitleEl?.textContent || 'Категории';
      catalogCategoriesTitle.textContent = txt.replace('Список', 'Категории').trim();
    }
    catalogCategoriesBackdrop.style.display = 'flex';
    renderCatalogCategories();
  }

  function closeCatalogCategoriesModal() {
    if (!catalogCategoriesBackdrop) return;
    catalogCategoriesBackdrop.style.display = 'none';
  }

  // Модалка \"Элементы типа\"
  const typeElementsBackdrop = document.getElementById('type-elements-backdrop') as HTMLDivElement | null;
  const typeElementsTitle = document.getElementById('type-elements-title') as HTMLDivElement | null;
  const typeElementsSearch = document.getElementById('type-elements-search') as HTMLInputElement | null;
  const typeElementsTableBody = document.getElementById('type-elements-table-body') as HTMLTableSectionElement | null;
  const typeElementsClose = document.getElementById('btn-type-elements-close');
  const typeElementsAdd = document.getElementById('btn-type-elements-add');

  // Рендер папок типов элементов под пунктом \"Типы элементов\"
  // Учитываем настройки комнаты (room_settings): если заданы visibleCatalogTypes — показываем только их
  function renderCatalogTypeFolders() {
    if (!catalogTypesFolders) return;
    let types = loadCatalogTypes();
    try {
      const raw = localStorage.getItem('room_settings');
      if (raw) {
        const roomSettings = JSON.parse(raw) as { visibleCatalogTypes?: string[] };
        const visible = roomSettings.visibleCatalogTypes;
        if (Array.isArray(visible) && visible.length > 0) {
          types = types.filter(t => {
            const id = (t.id || '').toString();
            const key = (t.key || '').toString();
            return visible.indexOf(id) !== -1 || visible.indexOf(key) !== -1;
          });
        }
      }
    } catch (_) {}
    if (!types.length) {
      catalogTypesFolders.innerHTML =
        '<div style=\"font-size:11px; color:#999; padding:4px 0;\">Нет типов элементов</div>';
      return;
    }
    catalogTypesFolders.innerHTML = types
      .map(
        t =>
          `<div class=\"catalog-type-folder\" data-id=\"${t.id}\" data-name=\"${t.name}\"><span class=\"icon\">📁</span><span>${t.name}</span></div>`
      )
      .join('');

    // Обработчики кликов по папкам типов
    catalogTypesFolders.querySelectorAll<HTMLElement>('.catalog-type-folder').forEach(folder => {
      folder.addEventListener('click', () => {
        const id = folder.dataset.id || '';
        const name = (folder.dataset.name || folder.textContent || '').trim();
        if (!id) return;
        openTypeItemsModal(id, name);
      });
    });
  }
  
  // ⭐ ВАЖНО: Экспортируем renderCatalogTypeFolders сразу после объявления
  (window as any).renderCatalogTypeFolders = renderCatalogTypeFolders;

  // === Таблица элементов выбранного типа (как \"Список Кухни\") ===

  async function renderTypeItemsTable() {
    if (!typeItemsBody) return;
    
    console.log('🔄 [renderTypeItemsTable] Начинаем рендер таблицы элементов типа');
    
    // ⭐ ВАЖНО: Сначала загружаем каталог с сервера для синхронизации (тихо, без ошибок)
    try {
      await loadCatalogFromServer();
      // Ошибки уже обработаны внутри loadCatalogFromServer
    } catch (error) {
      // Ошибки уже обработаны внутри loadCatalogFromServer, здесь просто продолжаем работу
    }
    
    // ⭐ ВАЖНО: Загружаем элементы ЗАНОВО из localStorage (не используем кэш)
    // НЕ вызываем migrateOldCatalogElements() здесь, чтобы не добавлять удаленные элементы обратно
    const allElements = loadAllCatalogElements();
    console.log('📋 [renderTypeItemsTable] Загружено элементов из localStorage:', allElements.length);
    console.log('📋 [renderTypeItemsTable] ID элементов:', allElements.map(el => el.id));
    
    let elements = allElements.slice();

    // Фильтр по типу каталога (currentTypeItemsId через metadata.element_type)
    if (currentTypeItemsId) {
      // Перезагружаем типы, если они еще не загружены
      if (catalogTypes.length === 0) {
        catalogTypes = loadCatalogTypes();
        console.log('🔄 [renderTypeItemsTable] Типы перезагружены:', catalogTypes.length);
      }
      
      // Получаем key типа из его id
      const type = catalogTypes.find(t => t.id === currentTypeItemsId);
      console.log('📋 [renderTypeItemsTable] Поиск типа по currentTypeItemsId:', currentTypeItemsId);
      console.log('📋 [renderTypeItemsTable] Найденный тип:', type);
      
      if (type) {
        // Если у типа нет key, создаем его
        if (!type.key) {
          type.key = type.id.replace(/^(type-|catalog-)/, '').toLowerCase() || 
                     type.name.toLowerCase().replace(/\s+/g, '_');
          console.log('📋 [renderTypeItemsTable] Создан key для типа:', type.key);
        }
        
        if (type.key) {
          console.log('📋 [renderTypeItemsTable] Фильтруем элементы по element_type:', type.key);
          const beforeCount = elements.length;
          
          // Логируем значения element_type у всех элементов для отладки
          console.log('📋 [renderTypeItemsTable] Значения element_type у элементов:', 
            elements.map(el => ({
              id: el.id,
              name: el.name,
              element_type: (el.metadata as any)?.element_type,
              matches: (el.metadata as any)?.element_type === type.key
            }))
          );
          
          elements = elements.filter(el => {
            const elementType = (el.metadata as any)?.element_type;
            // Если у элемента нет element_type, пытаемся восстановить его из других источников
            if (!elementType) {
              // Пытаемся найти element_type в других местах (для совместимости)
              // Проверяем groupId или другие поля
              console.log('📋 [renderTypeItemsTable] Элемент без element_type, пытаемся восстановить:', {
                id: el.id,
                name: el.name,
                groupId: el.groupId
              });
              // Элементы без element_type не показываем (они не принадлежат этому типу)
              return false;
            }
            const matches = elementType === type.key;
            if (!matches) {
              console.log('📋 [renderTypeItemsTable] Элемент не прошел фильтр:', {
                id: el.id,
                name: el.name,
                element_type: elementType,
                expected: type.key,
                match: matches
              });
            }
            return matches;
          });
          console.log('📋 [renderTypeItemsTable] Отфильтровано элементов:', beforeCount, '->', elements.length);
        } else {
          console.warn('⚠️ [renderTypeItemsTable] У типа нет key, показываем все элементы');
        }
      } else {
        console.warn('⚠️ [renderTypeItemsTable] Тип с id', currentTypeItemsId, 'не найден в catalogTypes');
        console.warn('⚠️ [renderTypeItemsTable] Доступные типы:', catalogTypes.map(t => ({ id: t.id, name: t.name })));
      }
    } else {
      console.log('📋 [renderTypeItemsTable] currentTypeItemsId не установлен, показываем все элементы');
    }

    // Фильтр по настройкам комнаты: categoryFilter — показывать ТОЛЬКО элементы из выбранных категорий
    // Элементы без категории (безымянные) НЕ должны проходить фильтр
    // Категории в элементах могут быть как ID, так и названия — разрешаем оба варианта
    try {
      const raw = localStorage.getItem('room_settings');
      if (raw && currentTypeItemsId) {
        const roomSettings = JSON.parse(raw) as { categoryFilter?: Record<string, (number | string)[]> };
        const typeKeyForRoom = currentTypeItemsId.toString();
        const allowedRaw = roomSettings.categoryFilter?.[typeKeyForRoom];
        if (Array.isArray(allowedRaw) && allowedRaw.length > 0) {
          const allowedSet = new Set<number>(allowedRaw.map((a: any) => (typeof a === 'number' ? a : parseInt(String(a), 10))).filter((n: number) => !isNaN(n)));
          const typeCategories = loadCatalogCategories(currentTypeItemsId);
          const nameToId = new Map<string, number>();
          typeCategories.forEach((c: { id: string | number; name?: string }) => {
            const id = typeof c.id === 'number' ? c.id : parseInt(String(c.id), 10);
            if (!isNaN(id) && c.name) nameToId.set(String(c.name).toLowerCase().trim(), id);
          });
          elements = elements.filter(el => {
            const cat = (el.metadata as any)?.category ?? (el as any).category;
            const resolvedIds: number[] = [];
            const resolve = (v: any): number | null => {
              if (v === undefined || v === null || v === '') return null;
              const n = typeof v === 'number' ? v : parseInt(String(v), 10);
              if (!isNaN(n)) return n;
              const byName = nameToId.get(String(v).toLowerCase().trim());
              return byName ?? null;
            };
            if (Array.isArray(cat)) {
              cat.forEach((c: any) => {
                const id = resolve(c);
                if (id != null) resolvedIds.push(id);
              });
            } else {
              const id = resolve(cat);
              if (id != null) resolvedIds.push(id);
            }
            // Без категории — не показывать (безымянные не проходят)
            if (resolvedIds.length === 0) return false;
            return resolvedIds.some(id => allowedSet.has(id));
          });
        }
      }
    } catch (_) {}

    // Фильтр по поисковому запросу
    const q = (typeItemsSearch?.value || '').trim().toLowerCase();
    if (q) {
      elements = elements.filter(el => {
        const name = el.name?.toLowerCase() || '';
        const article = (el.metadata as any)?.article?.toLowerCase?.() || '';
        return name.includes(q) || article.includes(q);
      });
    }

    // Фильтр по категории
    const categoryFilter = typeItemsCategoryFilter?.value || '';
    if (categoryFilter) {
      // TODO: Реализовать фильтрацию по категории, когда будет поле categoryId в CatalogElement
    }

    // Сохраняем отфильтрованные элементы для пагинации
    typeItemsFilteredElements = elements;

    // Применяем пагинацию
    const startIndex = (typeItemsCurrentPage - 1) * typeItemsPerPageCount;
    const endIndex = startIndex + typeItemsPerPageCount;
    const paginatedElements = elements.slice(startIndex, endIndex);

    if (!paginatedElements.length && elements.length === 0) {
      typeItemsBody.innerHTML =
        '<tr><td colspan=\"10\" style=\"padding:16px; text-align:center; color:#999;\">Нет элементов для этого типа</td></tr>';
      renderTypeItemsPagination();
      return;
    }

    const rows: string[] = [];
    paginatedElements.forEach((el, index) => {
      const size = (el.metadata as any)?.size;
      const sizeStr =
        size && size.width && size.height && size.depth
          ? `${Math.round(size.width * 1000)}×${Math.round(size.height * 1000)}×${Math.round(
              size.depth * 1000
            )}`
          : '';
      const article = (el.metadata as any)?.article || '';
      const category = el.type || '';
      const elementId = el.id || `item-${index}`;
      const order = (el.metadata as any)?.order ?? 0;
      const active = (el.metadata as any)?.active !== undefined ? (el.metadata as any)?.active : 1;
      const isVisible = active === 1 || active === true;
      const iconUrl = (el.metadata as any)?.icon || '';

      // Форматируем размеры (может быть несколько вариантов через запятую)
      const sizesArray = sizeStr ? [sizeStr] : [];
      const sizesHtml = sizesArray.length > 0 
        ? sizesArray.map(s => `<p style="margin:2px 0;">${s}</p>`).join('')
        : '<p style="margin:2px 0;">&nbsp;</p>';
      
      // Форматируем артикул (может быть несколько вариантов)
      const articlesArray = article ? [article] : [];
      const articlesHtml = articlesArray.length > 0
        ? articlesArray.map(a => `<p style="margin:2px 0;">${a}&nbsp;</p>`).join('')
        : '<p style="margin:2px 0;">&nbsp;</p>';
      
      // Иконка элемента
      const iconHtml = iconUrl
        ? `<img src="${iconUrl}" alt="" class="img-fluid" style="max-width:100px; height:auto; border-radius:4px; background:#e5e9f0; min-height:60px; object-fit:cover; display:block;">`
        : `<div style="width:100px; height:60px; border-radius:4px; background:#e5e9f0; display:block;"></div>`;
      
      // Иконка видимости (глаз)
      const visibilityIcon = isVisible 
        ? '<i class="fa fa-eye" style="color:#28a745; font-size:16px; cursor:pointer;" title="Видимый"></i>'
        : '<i class="fa fa-eye-slash" style="color:#dc3545; font-size:16px; cursor:pointer;" title="Скрытый"></i>';
      
      rows.push(`
        <tr>
          <td style="padding:6px; border:1px solid #e0e0e0; text-align:center; width:30px;">
            <input type="checkbox" value="${elementId}" />
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:50px;">${elementId}</td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:100px;">
            ${iconHtml}
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0;">
            <p style="margin:0;">${el.name || ''}</p>
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:180px;">
            ${sizesHtml}
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:150px;">
            ${articlesHtml}
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:200px;">
            <div><div><span>${category || ''}</span></div></div>
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:80px;">
            <input type="number" class="item-order-input" data-id="${elementId}" value="${order}" style="width:100%; padding:4px; border:1px solid #d0d7e2; border-radius:4px; font-size:12px; text-align:center;" min="0" />
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:90px; text-align:center;">
            <span class="item-visibility-toggle" data-id="${elementId}" data-active="${active}">
              ${visibilityIcon}
            </span>
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:150px; text-align:center;">
            <a href="#" class="btn-edit-item" data-id="${elementId}" style="text-decoration:none; display:inline-block; margin-right:8px;" title="Редактировать">
              <i class="fa fa-edit" style="cursor:pointer; padding:6px 10px; font-size:14px; color:#28a745; border:1px solid #28a745; border-radius:4px; background:#fff; transition:all 0.2s; display:inline-block;"></i>
            </a>
            <i class="fa fa-copy btn-copy-item" data-id="${elementId}" title="Копировать" style="cursor:pointer; padding:6px 10px; font-size:14px; color:#17a2b8; border:1px solid #17a2b8; border-radius:4px; background:#fff; margin:0 8px; display:inline-block; transition:all 0.2s;"></i>
            <i class="fa fa-trash btn-delete-item" data-id="${elementId}" title="Удалить" style="cursor:pointer; padding:6px 10px; font-size:14px; color:#dc3545; border:1px solid #dc3545; border-radius:4px; background:#fff; display:inline-block; transition:all 0.2s;"></i>
          </td>
        </tr>
      `);
    });

    typeItemsBody.innerHTML = rows.join('');
    console.log('📋 [renderTypeItemsTable] Таблица заполнена, строк:', rows.length);
    console.log('📋 [renderTypeItemsTable] typeItemsBody.innerHTML длина:', typeItemsBody.innerHTML.length);
    
    // Проверяем, что таблица действительно отрендерена
    const tableRows = typeItemsBody.querySelectorAll('tr');
    console.log('📋 [renderTypeItemsTable] Найдено строк в DOM:', tableRows.length);
    
    // Добавляем обработчики событий для действий
    attachTypeItemsTableHandlers();
  }

  // Функция для отрисовки пагинации
  function renderTypeItemsPagination() {
    if (!typeItemsPaginationControls) return;
    
    const totalElements = typeItemsFilteredElements.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / typeItemsPerPageCount));
    
    if (totalPages <= 1) {
      typeItemsPaginationControls.innerHTML = '';
      return;
    }
    
    const paginationHtml: string[] = [];
    
    // Кнопка << (первая страница)
    paginationHtml.push(
      `<li><button class="btn btn-sm pagination-first" ${typeItemsCurrentPage === 1 ? 'disabled' : ''} style="padding:4px 8px;">&lt;&lt;</button></li>`
    );
    
    // Кнопка < (предыдущая страница)
    paginationHtml.push(
      `<li><button class="btn btn-sm pagination-prev" ${typeItemsCurrentPage === 1 ? 'disabled' : ''} style="padding:4px 8px;">&lt;</button></li>`
    );
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, typeItemsCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === typeItemsCurrentPage;
      paginationHtml.push(
        `<li><button class="btn btn-sm pagination-page ${isActive ? 'btn-primary' : ''}" data-page="${i}" style="padding:4px 8px;">${i}</button></li>`
      );
    }
    
    // Кнопка > (следующая страница)
    paginationHtml.push(
      `<li><button class="btn btn-sm pagination-next" ${typeItemsCurrentPage === totalPages ? 'disabled' : ''} style="padding:4px 8px;">&gt;</button></li>`
    );
    
    // Кнопка >> (последняя страница)
    paginationHtml.push(
      `<li><button class="btn btn-sm pagination-last" ${typeItemsCurrentPage === totalPages ? 'disabled' : ''} style="padding:4px 8px;">&gt;&gt;</button></li>`
    );
    
    const ul = typeItemsPaginationControls.querySelector('ul.pagination');
    if (ul) {
      ul.innerHTML = paginationHtml.join('');
      
      // Добавляем обработчики событий
      ul.querySelectorAll('.pagination-first').forEach(btn => {
        btn.addEventListener('click', () => {
          typeItemsCurrentPage = 1;
          renderTypeItemsTable();
          renderTypeItemsPagination();
        });
      });
      
      ul.querySelectorAll('.pagination-prev').forEach(btn => {
        btn.addEventListener('click', () => {
          if (typeItemsCurrentPage > 1) {
            typeItemsCurrentPage--;
            renderTypeItemsTable();
            renderTypeItemsPagination();
          }
        });
      });
      
      ul.querySelectorAll('.pagination-next').forEach(btn => {
        btn.addEventListener('click', () => {
          if (typeItemsCurrentPage < totalPages) {
            typeItemsCurrentPage++;
            renderTypeItemsTable();
            renderTypeItemsPagination();
          }
        });
      });
      
      ul.querySelectorAll('.pagination-last').forEach(btn => {
        btn.addEventListener('click', () => {
          typeItemsCurrentPage = totalPages;
          renderTypeItemsTable();
          renderTypeItemsPagination();
        });
      });
      
      ul.querySelectorAll('.pagination-page').forEach(btn => {
        btn.addEventListener('click', () => {
          const page = parseInt((btn as HTMLElement).dataset.page || '1');
          typeItemsCurrentPage = page;
          renderTypeItemsTable();
          renderTypeItemsPagination();
        });
      });
    }
  }

  // Функция для привязки обработчиков событий к таблице элементов типа
  function attachTypeItemsTableHandlers() {
    // Находим tbody заново, так как он может быть пересоздан
    const tableBody = document.getElementById('type-elements-table-body') as HTMLTableSectionElement | null;
    if (!tableBody) {
      console.warn('⚠️ [attachTypeItemsTableHandlers] Таблица type-elements-table-body не найдена');
      return;
    }
    
    console.log('🔗 [attachTypeItemsTableHandlers] Привязываем обработчики для таблицы элементов');
    
    // Обработчик редактирования
    tableBody.querySelectorAll('.btn-edit-item').forEach(link => {
      // Удаляем старые обработчики через клонирование
      const newLink = link.cloneNode(true);
      link.parentNode?.replaceChild(newLink, link);
      
      (newLink as HTMLElement).addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const elementId = (newLink as HTMLElement).dataset.id;
        if (!elementId) {
          console.warn('⚠️ [attachTypeItemsTableHandlers] elementId не найден для редактирования');
          return;
        }
        
        console.log('✅ [attachTypeItemsTableHandlers] Кнопка "Редактировать" нажата для элемента:', elementId);
        const allElements = loadAllCatalogElements();
        console.log('📦 [attachTypeItemsTableHandlers] Всего элементов в каталоге:', allElements.length);
        console.log('📦 [attachTypeItemsTableHandlers] Все элементы:', allElements.map(el => ({ 
          id: el.id, 
          name: el.name, 
          hasClodisJSON: !!el.clodisJSON,
          clodisJSONLength: el.clodisJSON?.length || 0
        })));
        
        const element = allElements.find(el => el.id === elementId);
        if (element) {
          console.log('📦 [attachTypeItemsTableHandlers] Найден элемент для редактирования:', {
            id: element.id,
            name: element.name,
            type: element.type,
            hasClodisJSON: !!element.clodisJSON,
            clodisJSONType: typeof element.clodisJSON,
            clodisJSONIsArray: Array.isArray(element.clodisJSON),
            clodisJSONLength: element.clodisJSON?.length || 0,
            clodisJSON: element.clodisJSON,
            metadata: element.metadata
          });
          openCatalogItemEditModal(undefined, element);
        } else {
          console.warn('⚠️ [attachTypeItemsTableHandlers] Элемент не найден:', elementId);
        }
      });
    });
    console.log('✅ [attachTypeItemsTableHandlers] Обработчики редактирования привязаны');
    
    // Обработчик копирования
    tableBody.querySelectorAll('.btn-copy-item').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode?.replaceChild(newBtn, btn);
      
      (newBtn as HTMLElement).addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const elementId = (newBtn as HTMLElement).dataset.id;
        if (!elementId) return;
        
        console.log('✅ [attachTypeItemsTableHandlers] Кнопка "Копировать" нажата для элемента:', elementId);
        const allElements = loadAllCatalogElements();
        const element = allElements.find(el => el.id === elementId);
        if (element) {
          // TODO: Реализовать копирование элемента
          alert('Функция "Копировать элемент" будет реализована позже');
          console.log('Копирование элемента:', elementId);
        }
      });
    });
    console.log('✅ [attachTypeItemsTableHandlers] Обработчики копирования привязаны');
    
    // Обработчик редактирования порядка
    tableBody.querySelectorAll('.item-order-input').forEach(input => {
      const newInput = input.cloneNode(true) as HTMLInputElement;
      input.parentNode?.replaceChild(newInput, input);
      
      newInput.addEventListener('change', (e) => {
        const elementId = newInput.dataset.id;
        if (!elementId) return;
        
        const newOrder = parseInt(newInput.value) || 0;
        console.log('✅ [attachTypeItemsTableHandlers] Изменен порядок элемента:', elementId, '->', newOrder);
        
        // Обновляем порядок в элементе каталога
        const allElements = loadAllCatalogElements();
        const element = allElements.find(el => el.id === elementId);
        if (element) {
          if (!element.metadata) element.metadata = {};
          (element.metadata as any).order = newOrder;
          
          // Сохраняем обратно в localStorage
          const catalogKey = 'elementCatalog';
          const updatedElements = allElements.map(el => 
            el.id === elementId ? element : el
          );
          localStorage.setItem(catalogKey, JSON.stringify(updatedElements));
          console.log('✅ [attachTypeItemsTableHandlers] Порядок сохранен');
        }
      });
    });
    console.log('✅ [attachTypeItemsTableHandlers] Обработчики порядка привязаны');
    
    // Обработчик переключения видимости
    tableBody.querySelectorAll('.item-visibility-toggle').forEach(toggle => {
      const newToggle = toggle.cloneNode(true) as HTMLElement;
      toggle.parentNode?.replaceChild(newToggle, toggle);
      
      newToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const elementId = newToggle.dataset.id;
        if (!elementId) return;
        
        const currentActive = parseInt(newToggle.dataset.active || '1');
        const newActive = currentActive === 1 ? 0 : 1;
        console.log('✅ [attachTypeItemsTableHandlers] Переключена видимость элемента:', elementId, '->', newActive);
        
        // Обновляем видимость в элементе каталога
        const allElements = loadAllCatalogElements();
        const element = allElements.find(el => el.id === elementId);
        if (element) {
          if (!element.metadata) element.metadata = {};
          (element.metadata as any).active = newActive;
          
          // Сохраняем обратно в localStorage
          const catalogKey = 'elementCatalog';
          const updatedElements = allElements.map(el => 
            el.id === elementId ? element : el
          );
          localStorage.setItem(catalogKey, JSON.stringify(updatedElements));
          
          // Обновляем иконку в UI
          const isVisible = newActive === 1;
          newToggle.innerHTML = isVisible 
            ? '<i class="fa fa-eye" style="color:#28a745; font-size:16px; cursor:pointer;" title="Видимый"></i>'
            : '<i class="fa fa-eye-slash" style="color:#dc3545; font-size:16px; cursor:pointer;" title="Скрытый"></i>';
          newToggle.dataset.active = String(newActive);
          console.log('✅ [attachTypeItemsTableHandlers] Видимость сохранена и UI обновлен');
        }
      });
    });
    console.log('✅ [attachTypeItemsTableHandlers] Обработчики видимости привязаны');
    
    // Обработчик удаления
    tableBody.querySelectorAll('.btn-delete-item').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode?.replaceChild(newBtn, btn);
      
      (newBtn as HTMLElement).addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const elementId = (newBtn as HTMLElement).dataset.id;
        if (!elementId) return;
        
        console.log('✅ [attachTypeItemsTableHandlers] Кнопка "Удалить" нажата для элемента:', elementId);
        
        // Находим название элемента для отображения в подтверждении
        const allElements = loadAllCatalogElements();
        const element = allElements.find(el => el.id === elementId);
        const elementName = element?.name || 'элемент';
        
        console.log('🗑️ [attachTypeItemsTableHandlers] Найден элемент для удаления:', {
          id: elementId,
          name: elementName,
          totalElements: allElements.length
        });
        
        // Показываем кастомную модалку подтверждения удаления (как в референсе)
        showDeleteConfirmModal(elementName, () => {
          // Пользователь подтвердил удаление - загружаем элементы заново для актуальности
          const currentElements = loadAllCatalogElements();
          console.log('🗑️ [attachTypeItemsTableHandlers] Текущее количество элементов до удаления:', currentElements.length);
          
          const filtered = currentElements.filter(el => el.id !== elementId);
          console.log('🗑️ [attachTypeItemsTableHandlers] Количество элементов после фильтрации:', filtered.length);
          
          if (filtered.length === currentElements.length) {
            console.warn('⚠️ [attachTypeItemsTableHandlers] Элемент не найден для удаления! ID:', elementId);
            console.warn('⚠️ [attachTypeItemsTableHandlers] Доступные ID:', currentElements.map(el => el.id));
            alert('Ошибка: Элемент не найден для удаления');
            return;
          }
          
          saveAllCatalogElements(filtered);
          console.log('✅ [attachTypeItemsTableHandlers] Элемент удален из localStorage, обновляем таблицу');
          
          // Проверяем, что элемент действительно удален
          const verifyElements = loadAllCatalogElements();
          console.log('🔍 [attachTypeItemsTableHandlers] Проверка после сохранения - элементов в localStorage:', verifyElements.length);
          console.log('🔍 [attachTypeItemsTableHandlers] ID элементов после удаления:', verifyElements.map(el => el.id));
          
          if (verifyElements.find(el => el.id === elementId)) {
            console.error('❌ [attachTypeItemsTableHandlers] ОШИБКА: Элемент все еще присутствует в localStorage после удаления!');
            alert('Ошибка: Не удалось удалить элемент из хранилища');
            return;
          }
          
          // Обновляем таблицу с небольшой задержкой для гарантии сохранения
          setTimeout(() => {
            console.log('🔄 [attachTypeItemsTableHandlers] Вызываем renderTypeItemsTable() для обновления таблицы');
            renderTypeItemsTable().catch(err => console.error('❌ Ошибка рендеринга таблицы:', err));
            renderTypeItemsPagination();
            console.log('✅ [attachTypeItemsTableHandlers] Таблица обновлена после удаления');
            
            // Дополнительная проверка после рендера
            setTimeout(() => {
              const finalCheck = loadAllCatalogElements();
              console.log('🔍 [attachTypeItemsTableHandlers] Финальная проверка - элементов в localStorage:', finalCheck.length);
            }, 200);
          }, 100);
        });
      });
    });
    console.log('✅ [attachTypeItemsTableHandlers] Обработчики удаления привязаны');
    console.log('✅ [attachTypeItemsTableHandlers] Все обработчики таблицы привязаны');
  }

  // Функция показа модалки подтверждения удаления (как в референсе)
  function showDeleteConfirmModal(elementName: string, onConfirm: () => void) {
    const backdrop = document.getElementById('delete-confirm-modal-backdrop');
    const titleEl = document.getElementById('delete-confirm-title');
    const textEl = document.getElementById('delete-confirm-text');
    const cancelBtn = document.getElementById('delete-confirm-cancel');
    const okBtn = document.getElementById('delete-confirm-ok');
    
    if (!backdrop || !titleEl || !textEl || !cancelBtn || !okBtn) {
      // Fallback на стандартный confirm, если модалка не найдена
      if (confirm(`Удалить элемент "${elementName}"?\n\nЭто действие нельзя отменить.`)) {
        onConfirm();
      }
      return;
    }
    
    // Устанавливаем текст
    textEl.textContent = `Данное действие отмене не подлежит! Вы точно хотите УДАЛИТЬ элемент "${elementName}"?`;
    
    // Показываем модалку
    backdrop.style.display = 'flex';
    
    // Обработчики кнопок
    const handleCancel = () => {
      backdrop.style.display = 'none';
      cancelBtn.removeEventListener('click', handleCancel);
      okBtn.removeEventListener('click', handleOk);
      backdrop.removeEventListener('click', handleBackdropClick);
    };
    
    const handleOk = () => {
      backdrop.style.display = 'none';
      cancelBtn.removeEventListener('click', handleCancel);
      okBtn.removeEventListener('click', handleOk);
      backdrop.removeEventListener('click', handleBackdropClick);
      onConfirm();
    };
    
    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === backdrop) {
        handleCancel();
      }
    };
    
    // Привязываем обработчики
    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);
    backdrop.addEventListener('click', handleBackdropClick);
  }

  // ⭐ ВАЖНО: openTypeItemsModal уже объявлена ДО wireUI(), здесь только инициализируем переменные
  // Инициализируем переменные для страницы списка элементов типа
  typeItemsContainer = document.getElementById('type-elements-container') as HTMLDivElement | null;
  typeItemsTitle = document.getElementById('type-elements-title') as HTMLDivElement | null;
  typeItemsSearch = document.getElementById('type-elements-search') as HTMLInputElement | null;
  typeItemsTableBody = document.getElementById('type-elements-table-body') as HTMLTableSectionElement | null;
  typeItemsBody = document.getElementById('type-elements-table-body') as HTMLTableSectionElement | null;
  typeItemsPagination = document.getElementById('type-elements-pagination') as HTMLDivElement | null;
  typeItemsPaginationControls = document.getElementById('type-elements-pagination-controls') as HTMLDivElement | null;
  typeItemsCategoryFilter = document.getElementById('type-elements-category-filter') as HTMLSelectElement | null;
  typeItemsAddBtn = document.getElementById('btn-type-elements-add');
  typeItemsAddBottomBtn = document.getElementById('btn-type-elements-add-bottom');
  typeItemsCategoriesBtn = document.getElementById('btn-type-elements-categories');
  typeItemsParamsBtn = document.getElementById('btn-type-elements-params');
  typeItemsResetMaterialsBtn = document.getElementById('btn-type-elements-reset-materials');
  typeItemsChangeVarsBtn = document.getElementById('btn-type-elements-change-vars');
  typeItemsCopyBtn = document.getElementById('btn-type-elements-copy');
  typeItemsSelectAll = document.getElementById('type-elements-select-all') as HTMLInputElement | null;
  typeItemsPerPage = document.getElementById('type-elements-per-page') as HTMLSelectElement | null;
  
  console.log('✅ [wireUI] Инициализированы переменные для списка элементов типа:', {
    typeItemsContainer: !!typeItemsContainer,
    typeItemsTitle: !!typeItemsTitle,
    typeItemsSearch: !!typeItemsSearch,
    typeItemsTableBody: !!typeItemsTableBody,
    typeItemsBody: !!typeItemsBody,
    typeItemsPagination: !!typeItemsPagination,
    typeItemsPaginationControls: !!typeItemsPaginationControls,
    typeItemsCategoryFilter: !!typeItemsCategoryFilter,
    typeItemsAddBtn: !!typeItemsAddBtn,
    typeItemsAddBottomBtn: !!typeItemsAddBottomBtn,
    typeItemsCategoriesBtn: !!typeItemsCategoriesBtn,
    typeItemsParamsBtn: !!typeItemsParamsBtn,
    typeItemsResetMaterialsBtn: !!typeItemsResetMaterialsBtn,
    typeItemsChangeVarsBtn: !!typeItemsChangeVarsBtn,
    typeItemsCopyBtn: !!typeItemsCopyBtn,
    typeItemsSelectAll: !!typeItemsSelectAll
  });
  
  // ⚠️ УДАЛЕНО: openTypeItemsModal объявлена ДО wireUI() на строке 6838 и экспортирована в window на строке 6974
  // Дублирующий код функции удален - функция объявлена выше, вне wireUI()

  function closeTypeItemsModal() {
    if (!typeItemsContainer) return;
    typeItemsContainer.style.display = 'none';
    
    // Восстанавливаем видимость основного контента админ-панели
    const adminContent = document.querySelector('#admin-content');
    if (adminContent) {
      (adminContent as HTMLElement).style.display = '';
      console.log('✅ [closeTypeItemsModal] Восстановлен admin-content');
    }
    
    // ⭐ ВОССТАНАВЛИВАЕМ ОСНОВНОЙ КОНТЕНТ ПРИ ЗАКРЫТИИ МОДАЛКИ
    // Восстанавливаем видимость контента в зависимости от текущего раздела
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const section = urlParams.get('section');
    
    if (section === 'materials') {
      const materialsManagerBackdrop = document.getElementById('materials-manager-backdrop');
      if (materialsManagerBackdrop) {
        materialsManagerBackdrop.style.display = 'block';
        console.log('✅ [closeTypeItemsModal] Восстановлен materials-manager-backdrop');
      }
      const materialsManagerContainer = document.getElementById('materials-manager');
      if (materialsManagerContainer) {
        materialsManagerContainer.style.display = 'block';
        console.log('✅ [closeTypeItemsModal] Восстановлен materials-manager');
      }
    } else {
      const adminSectionContainer = document.getElementById('admin-section-container');
      if (adminSectionContainer) {
        adminSectionContainer.style.display = 'block';
        console.log('✅ [closeTypeItemsModal] Восстановлен admin-section-container');
      }
    }
  }

  // Функция для сохранения всех элементов каталога
  function saveAllCatalogElements(elements: CatalogElement[]) {
    const key = 'elementCatalog';
    localStorage.setItem(key, JSON.stringify(elements));
    console.log('💾 [saveAllCatalogElements] Сохранено элементов:', elements.length);
  }

  // Функция для привязки обработчиков событий к странице списка элементов типа
  // Вызывается каждый раз при открытии страницы, так как элементы могут быть не найдены при инициализации
  function attachTypeItemsPageHandlers() {
    console.log('🔗 [attachTypeItemsPageHandlers] Привязываем обработчики событий для страницы списка элементов типа');
    
    // Находим элементы заново (они могут быть не найдены при инициализации)
    const addBtn = document.getElementById('btn-type-elements-add');
    const addBottomBtn = document.getElementById('btn-type-elements-add-bottom');
    const categoriesBtn = document.getElementById('btn-type-elements-categories');
    const paramsBtn = document.getElementById('btn-type-elements-params');
    const resetMaterialsBtn = document.getElementById('btn-type-elements-reset-materials');
    const changeVarsBtn = document.getElementById('btn-type-elements-change-vars');
    const copyBtn = document.getElementById('btn-type-elements-copy');
    const searchInput = document.getElementById('type-elements-search') as HTMLInputElement | null;
    const categoryFilter = document.getElementById('type-elements-category-filter') as HTMLSelectElement | null;
    const perPageSelect = document.getElementById('type-elements-per-page') as HTMLSelectElement | null;
    const selectAllCheckbox = document.getElementById('type-elements-select-all') as HTMLInputElement | null;
    
    // Кнопка "Добавить" (сверху)
    if (addBtn) {
      // Удаляем старые обработчики через клонирование
      const newAddBtn = addBtn.cloneNode(true);
      addBtn.parentNode?.replaceChild(newAddBtn, addBtn);
      
      (newAddBtn as HTMLButtonElement).addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ [attachTypeItemsPageHandlers] Кнопка "Добавить" нажата');
        try {
          if (currentTypeItemsId) {
            const type = catalogTypes.find(t => t.id === currentTypeItemsId);
            if (type) {
              console.log('📦 [attachTypeItemsPageHandlers] Открываем модалку с типом:', type.name);
              // Проверяем доступность функции через window
              const openModal = (window as any).openCatalogItemEditModal || openCatalogItemEditModal;
              if (typeof openModal === 'function') {
                openModal(type.name);
              } else {
                console.error('❌ [attachTypeItemsPageHandlers] openCatalogItemEditModal не является функцией!', typeof openModal);
                console.error('❌ [attachTypeItemsPageHandlers] window.openCatalogItemEditModal:', (window as any).openCatalogItemEditModal);
                alert('Ошибка: функция openCatalogItemEditModal не найдена. Проверьте консоль.');
              }
            } else {
              console.log('📦 [attachTypeItemsPageHandlers] Открываем модалку без типа');
              // Проверяем доступность функции через window
              const openModal = (window as any).openCatalogItemEditModal || openCatalogItemEditModal;
              if (typeof openModal === 'function') {
                openModal();
              } else {
                console.error('❌ [attachTypeItemsPageHandlers] openCatalogItemEditModal не является функцией!', typeof openModal);
                console.error('❌ [attachTypeItemsPageHandlers] window.openCatalogItemEditModal:', (window as any).openCatalogItemEditModal);
                alert('Ошибка: функция openCatalogItemEditModal не найдена.');
              }
            }
          } else {
            console.log('📦 [attachTypeItemsPageHandlers] Открываем модалку без типа (currentTypeItemsId не установлен)');
            if (typeof openCatalogItemEditModal === 'function') {
              openCatalogItemEditModal();
            } else {
              console.error('❌ [attachTypeItemsPageHandlers] openCatalogItemEditModal не является функцией!');
              alert('Ошибка: функция openCatalogItemEditModal не найдена.');
            }
          }
        } catch (error) {
          console.error('❌ [attachTypeItemsPageHandlers] Ошибка при открытии модалки:', error);
          alert('Ошибка при открытии модалки: ' + (error as Error).message);
        }
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для кнопки "Добавить" (сверху) привязан');
    } else {
      console.warn('⚠️ [attachTypeItemsPageHandlers] Кнопка btn-type-elements-add не найдена');
    }
    
    // Кнопка "Добавить" (снизу)
    if (addBottomBtn) {
      const newAddBottomBtn = addBottomBtn.cloneNode(true);
      addBottomBtn.parentNode?.replaceChild(newAddBottomBtn, addBottomBtn);
      
      (newAddBottomBtn as HTMLButtonElement).addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ [attachTypeItemsPageHandlers] Кнопка "Добавить" (снизу) нажата');
        try {
          if (currentTypeItemsId) {
            const type = catalogTypes.find(t => t.id === currentTypeItemsId);
            if (type) {
              if (typeof openCatalogItemEditModal === 'function') {
                openCatalogItemEditModal(type.name);
              } else {
                console.error('❌ [attachTypeItemsPageHandlers] openCatalogItemEditModal не является функцией!');
                alert('Ошибка: функция openCatalogItemEditModal не найдена.');
              }
            } else {
              // Проверяем доступность функции через window
              const openModal = (window as any).openCatalogItemEditModal || openCatalogItemEditModal;
              if (typeof openModal === 'function') {
                openModal();
              } else {
                console.error('❌ [attachTypeItemsPageHandlers] openCatalogItemEditModal не является функцией!', typeof openModal);
                console.error('❌ [attachTypeItemsPageHandlers] window.openCatalogItemEditModal:', (window as any).openCatalogItemEditModal);
                alert('Ошибка: функция openCatalogItemEditModal не найдена.');
              }
            }
          } else {
            if (typeof openCatalogItemEditModal === 'function') {
              openCatalogItemEditModal();
            } else {
              console.error('❌ [attachTypeItemsPageHandlers] openCatalogItemEditModal не является функцией!');
              alert('Ошибка: функция openCatalogItemEditModal не найдена.');
            }
          }
        } catch (error) {
          console.error('❌ [attachTypeItemsPageHandlers] Ошибка при открытии модалки:', error);
          alert('Ошибка при открытии модалки: ' + (error as Error).message);
        }
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для кнопки "Добавить" (снизу) привязан');
    } else {
      console.warn('⚠️ [attachTypeItemsPageHandlers] Кнопка btn-type-elements-add-bottom не найдена');
    }
    
    // Кнопка "Категории"
    if (categoriesBtn) {
      const newCategoriesBtn = categoriesBtn.cloneNode(true);
      categoriesBtn.parentNode?.replaceChild(newCategoriesBtn, categoriesBtn);
      
      (newCategoriesBtn as HTMLButtonElement).addEventListener('click', (e) => {
        e.preventDefault();
        console.log('✅ [attachTypeItemsPageHandlers] Кнопка "Категории" нажата');
        openCatalogCategoriesSelectionModal();
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для кнопки "Категории" привязан');
    } else {
      console.warn('⚠️ [attachTypeItemsPageHandlers] Кнопка btn-type-elements-categories не найдена');
    }
    
    // Кнопка "Параметры"
    if (paramsBtn) {
      const newParamsBtn = paramsBtn.cloneNode(true);
      paramsBtn.parentNode?.replaceChild(newParamsBtn, paramsBtn);
      
      (newParamsBtn as HTMLButtonElement).addEventListener('click', (e) => {
        e.preventDefault();
        console.log('✅ [attachTypeItemsPageHandlers] Кнопка "Параметры" нажата');
        alert('Функция "Параметры" будет реализована позже');
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для кнопки "Параметры" привязан');
    }
    
    // Кнопка "Сбросить материалы"
    if (resetMaterialsBtn) {
      const newResetMaterialsBtn = resetMaterialsBtn.cloneNode(true);
      resetMaterialsBtn.parentNode?.replaceChild(newResetMaterialsBtn, resetMaterialsBtn);
      
      (newResetMaterialsBtn as HTMLButtonElement).addEventListener('click', (e) => {
        e.preventDefault();
        console.log('✅ [attachTypeItemsPageHandlers] Кнопка "Сбросить материалы" нажата');
        alert('Функция "Сбросить материалы" будет реализована позже');
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для кнопки "Сбросить материалы" привязан');
    }
    
    // Кнопка "Изменить переменные"
    if (changeVarsBtn) {
      const newChangeVarsBtn = changeVarsBtn.cloneNode(true);
      changeVarsBtn.parentNode?.replaceChild(newChangeVarsBtn, changeVarsBtn);
      
      (newChangeVarsBtn as HTMLButtonElement).addEventListener('click', (e) => {
        e.preventDefault();
        console.log('✅ [attachTypeItemsPageHandlers] Кнопка "Изменить переменные" нажата');
        alert('Функция "Изменить переменные" будет реализована позже');
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для кнопки "Изменить переменные" привязан');
    }
    
    // Кнопка "Копировать модули"
    if (copyBtn) {
      const newCopyBtn = copyBtn.cloneNode(true);
      copyBtn.parentNode?.replaceChild(newCopyBtn, copyBtn);
      
      (newCopyBtn as HTMLButtonElement).addEventListener('click', (e) => {
        e.preventDefault();
        console.log('✅ [attachTypeItemsPageHandlers] Кнопка "Копировать модули" нажата');
        alert('Функция "Копировать модули" будет реализована позже');
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для кнопки "Копировать модули" привязан');
    }
    
    // Обработчик поиска
    if (searchInput) {
      const newSearchInput = searchInput.cloneNode(true) as HTMLInputElement;
      searchInput.parentNode?.replaceChild(newSearchInput, searchInput);
      
      newSearchInput.addEventListener('input', () => {
        typeItemsCurrentPage = 1;
        renderTypeItemsTable();
        renderTypeItemsPagination();
      });
      
      // Обработчик кнопки поиска
      const searchButton = newSearchInput.nextElementSibling as HTMLButtonElement | null;
      if (searchButton) {
        const newSearchButton = searchButton.cloneNode(true) as HTMLButtonElement;
        searchButton.parentNode?.replaceChild(newSearchButton, searchButton);
        
        newSearchButton.addEventListener('click', () => {
          typeItemsCurrentPage = 1;
          renderTypeItemsTable();
          renderTypeItemsPagination();
        });
      }
      console.log('✅ [attachTypeItemsPageHandlers] Обработчики для поиска привязаны');
    } else {
      console.warn('⚠️ [attachTypeItemsPageHandlers] Поле поиска type-elements-search не найдено');
    }
    
    // Обработчик фильтра категории
    if (categoryFilter) {
      const newCategoryFilter = categoryFilter.cloneNode(true) as HTMLSelectElement;
      categoryFilter.parentNode?.replaceChild(newCategoryFilter, categoryFilter);
      
      newCategoryFilter.addEventListener('change', () => {
        typeItemsCurrentPage = 1;
        renderTypeItemsTable();
        renderTypeItemsPagination();
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для фильтра категории привязан');
    }
    
    // Обработчик количества на странице
    if (perPageSelect) {
      const newPerPageSelect = perPageSelect.cloneNode(true) as HTMLSelectElement;
      perPageSelect.parentNode?.replaceChild(newPerPageSelect, perPageSelect);
      
      newPerPageSelect.addEventListener('change', () => {
        typeItemsPerPageCount = parseInt(newPerPageSelect.value) || 20;
        typeItemsCurrentPage = 1;
        renderTypeItemsTable();
        renderTypeItemsPagination();
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для количества на странице привязан');
    }
    
    // Обработчик "выбрать все"
    if (selectAllCheckbox) {
      const newSelectAllCheckbox = selectAllCheckbox.cloneNode(true) as HTMLInputElement;
      selectAllCheckbox.parentNode?.replaceChild(newSelectAllCheckbox, selectAllCheckbox);
      
      newSelectAllCheckbox.addEventListener('change', () => {
        const tableBody = document.getElementById('type-elements-table-body');
        const checkboxes = tableBody?.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement> | null;
        if (checkboxes) {
          checkboxes.forEach(checkbox => {
            if (checkbox !== newSelectAllCheckbox) {
              checkbox.checked = newSelectAllCheckbox.checked;
            }
          });
        }
      });
      console.log('✅ [attachTypeItemsPageHandlers] Обработчик для "выбрать все" привязан');
    }
    
    console.log('✅ [attachTypeItemsPageHandlers] Все обработчики событий привязаны');
  }
  
  // Инициализация обработчиков при первой загрузке (если элементы доступны)
  attachTypeItemsPageHandlers();
  
  // Старые обработчики (оставляем для совместимости, но они могут не работать если элементы не найдены)
  if (typeItemsAddBtn) {
    typeItemsAddBtn.addEventListener('click', () => {
      if (currentTypeItemsId) {
        const type = catalogTypes.find(t => t.id === currentTypeItemsId);
        if (type) {
          openCatalogItemEditModal(type.name);
        } else {
          openCatalogItemEditModal();
        }
      } else {
        openCatalogItemEditModal();
      }
    });
  }

  if (typeItemsAddBottomBtn) {
    typeItemsAddBottomBtn.addEventListener('click', () => {
      if (currentTypeItemsId) {
        const type = catalogTypes.find(t => t.id === currentTypeItemsId);
        if (type) {
          openCatalogItemEditModal(type.name);
        } else {
          openCatalogItemEditModal();
        }
      } else {
        openCatalogItemEditModal();
      }
    });
  }

  if (typeItemsCategoriesBtn) {
    typeItemsCategoriesBtn.addEventListener('click', () => {
      openCatalogCategoriesSelectionModal();
    });
  }

  if (typeItemsParamsBtn) {
    typeItemsParamsBtn.addEventListener('click', () => {
      // TODO: Реализовать открытие модалки параметров
      console.log('Открытие модалки параметров');
    });
  }

  if (typeItemsResetMaterialsBtn) {
    typeItemsResetMaterialsBtn.addEventListener('click', () => {
      // TODO: Реализовать сброс материалов
      console.log('Сброс материалов');
    });
  }

  if (typeItemsChangeVarsBtn) {
    typeItemsChangeVarsBtn.addEventListener('click', () => {
      // TODO: Реализовать изменение переменных
      console.log('Изменение переменных');
    });
  }

  if (typeItemsCopyBtn) {
    typeItemsCopyBtn.addEventListener('click', () => {
      // TODO: Реализовать копирование модулей
      console.log('Копирование модулей');
    });
  }

  // Обработчик поиска
  if (typeItemsSearch) {
    typeItemsSearch.addEventListener('input', () => {
      typeItemsCurrentPage = 1; // Сбрасываем на первую страницу
      renderTypeItemsTable();
      renderTypeItemsPagination();
    });
    
    // Обработчик кнопки поиска
    const searchButton = typeItemsSearch.nextElementSibling as HTMLButtonElement | null;
    if (searchButton) {
      searchButton.addEventListener('click', () => {
        typeItemsCurrentPage = 1;
        renderTypeItemsTable();
        renderTypeItemsPagination();
      });
    }
  }

  // Обработчик фильтра категории
  if (typeItemsCategoryFilter) {
    typeItemsCategoryFilter.addEventListener('change', () => {
      typeItemsCurrentPage = 1;
      renderTypeItemsTable();
      renderTypeItemsPagination();
    });
  }

  // Обработчик количества на странице
  if (typeItemsPerPage) {
    typeItemsPerPage.addEventListener('change', () => {
      typeItemsPerPageCount = parseInt(typeItemsPerPage.value) || 20;
      typeItemsCurrentPage = 1;
      renderTypeItemsTable();
      renderTypeItemsPagination();
    });
  }

  // Обработчик "выбрать все"
  if (typeItemsSelectAll) {
    typeItemsSelectAll.addEventListener('change', () => {
      const checkboxes = typeItemsBody?.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement> | null;
      if (checkboxes) {
        checkboxes.forEach(checkbox => {
          if (checkbox !== typeItemsSelectAll) {
            checkbox.checked = typeItemsSelectAll.checked;
          }
        });
      }
    });
  }

  // Страница «Группы» (строго по референсу)
  const catalogGroupsContainer = document.getElementById('catalog-groups-container') as HTMLDivElement | null;
  groupsAdd = document.getElementById('catalog-groups-add') || document.getElementById('btn-catalog-groups-add');
  groupsSearch = document.getElementById('catalog-groups-search') as HTMLInputElement | null;
  const groupsTableBody = document.getElementById('catalog-groups-table-body') as HTMLTableSectionElement | null;

  function renderElementTypes(filter: string = '') {
    // Переинициализируем ссылку на tbody, так как модалка могла быть удалена/пересоздана
    const tableBody = document.getElementById('element-types-table-body') as HTMLTableSectionElement | null;
    if (!tableBody) {
      console.warn('⚠️ [renderElementTypes] Таблица element-types-table-body не найдена в DOM');
      return;
    }
    
    const all = loadCatalogTypes();
    console.log('📋 [renderElementTypes] Загружено типов:', all.length);
    const q = filter.trim().toLowerCase();
    const list = q ? all.filter(t => t.name.toLowerCase().includes(q)) : all;
    console.log('📋 [renderElementTypes] Отфильтровано типов:', list.length);
    
    if (!list.length) {
      tableBody.innerHTML = `<tr><td colspan="3" style="padding:12px; text-align:center; color:#999;">Нет типов элементов</td></tr>`;
      return;
    }
    tableBody.innerHTML = list
      .map((t, i) => {
        return `<tr data-id="${t.id}">
          <td style="padding:6px 10px; border-bottom:1px solid #eee;">${i + 1}</td>
          <td style="padding:6px 10px; border-bottom:1px solid #eee;">${t.name}</td>
          <td style="padding:6px 10px; border-bottom:1px solid #eee;">
            <button class="btn btn-sm" data-action="edit">✏️</button>
            <button class="btn btn-sm" data-action="delete" style="margin-left:4px;">🗑</button>
          </td>
        </tr>`;
      })
      .join('');

    console.log('✅ [renderElementTypes] Таблица заполнена, строк:', list.length);

    // обработчики действий
    // НЕ создаем обработчики здесь, если используется новая страница (admin-section-container)
    // Обработчики будут созданы в admin-panel.js
    const isAdminSection = document.getElementById('admin-section-container') !== null;
    console.log('📋 [renderElementTypes] isAdminSection:', isAdminSection, 'admin-section-container:', document.getElementById('admin-section-container') ? 'найден' : 'не найден');
    if (!isAdminSection) {
      // Создаем обработчики только если это старая модалка
      tableBody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = (btn as HTMLElement).closest('tr');
        const id = tr?.getAttribute('data-id');
        if (!id) return;
        const list = loadCatalogTypes();
        const item = list.find(t => t.id === id);
        if (!item) return;
        const name = prompt('Новое название типа элемента:', item.name);
        if (!name || !name.trim()) return;
          
          // Проверка на дубликаты
          if (list.some(t => t.id !== id && t.name.toLowerCase() === name.trim().toLowerCase())) {
            alert('Тип с таким названием уже существует');
            return;
          }
          
        item.name = name.trim();
        saveCatalogTypes(list);
        renderElementTypes(typesSearch?.value || '');
        // ⚠️ ВАЖНО: Используем функцию из window, так как она объявлена внутри wireUI()
        const renderFn = (window as any).renderCatalogTypeFolders;
        if (typeof renderFn === 'function') {
          renderFn();
        }
      });
    });

      tableBody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = (btn as HTMLElement).closest('tr');
        const id = tr?.getAttribute('data-id');
        if (!id) return;
        if (!confirm('Удалить тип элемента?')) return;
        let list = loadCatalogTypes();
        list = list.filter(t => t.id !== id);
        saveCatalogTypes(list);
        renderElementTypes(typesSearch?.value || '');
        // ⚠️ ВАЖНО: Используем функцию из window, так как она объявлена внутри wireUI()
        const renderFn = (window as any).renderCatalogTypeFolders;
        if (typeof renderFn === 'function') {
          renderFn();
        }
      });
    });
    } else {
      console.log('📋 [renderElementTypes] Используется admin-section-container, обработчики будут созданы в admin-panel.js');
    }
  }

  function openElementTypesModal() {
    console.log('🚀 [openElementTypesModal] Открываем страницу типов элементов');
    
    // НЕ вызываем hideAllAdminContent здесь - он уже вызван в showCatalogModal() перед вызовом этой функции
    
    // Находим страницу вместо модалки
    const container = document.getElementById('element-types-container') as HTMLDivElement | null;
    const searchInput = document.getElementById('element-types-search') as HTMLInputElement | null;
    
    if (!container) {
      console.error('❌ [openElementTypesModal] Страница element-types-container не найдена в DOM');
      return;
    }
    
    console.log('✅ [openElementTypesModal] Страница найдена, показываем');
    
    // Показываем страницу
    container.style.display = 'block';
    
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    
    // Рендерим таблицу
    setTimeout(() => {
      console.log('📋 [openElementTypesModal] Вызываем renderElementTypes');
    renderElementTypes('');
    }, 100);
  }
  
  // Экспортируем функции в window для вызова из admin-panel.js
  (window as any).openElementTypesModal = openElementTypesModal;
  (window as any).renderElementTypes = renderElementTypes;
  // renderCatalogTypeFolders уже экспортирована выше, сразу после объявления
  (window as any).loadCatalogTypes = loadCatalogTypes;
  (window as any).saveCatalogTypes = saveCatalogTypes;
  (window as any).generateId = generateId;
  (window as any).loadCatalogGroups = loadCatalogGroups;
  (window as any).saveCatalogGroups = saveCatalogGroups;
  (window as any).renderCatalogGroups = renderCatalogGroups;


  catalogMenuItemTypes?.addEventListener('click', () => {
    openElementTypesModal();
  });

  // Страница списка элементов типа больше не закрывается через кнопку (это страница, а не модалка)
  // Обработчики кнопок, поиска и фильтров уже добавлены выше в wireUI()

  catalogItemEditClose?.addEventListener('click', () => {
    closeCatalogItemEditModal();
  });
  catalogItemEditBackdrop?.addEventListener('click', e => {
    if (e.target === catalogItemEditBackdrop) {
      closeCatalogItemEditModal();
    }
  });

  // Переключение вкладок в модалке создания модуля через вертикальное меню
  const catalogMenuItems = document.querySelectorAll('.catalog-menu-item');
  catalogMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = (item as HTMLElement).dataset.tab;
      if (!tabName) return;

      // Убираем активный класс со всех пунктов меню
      catalogMenuItems.forEach(m => {
        (m as HTMLElement).classList.remove('active');
        (m as HTMLElement).style.background = '';
        (m as HTMLElement).style.borderLeftColor = 'transparent';
      });
      // Добавляем активный класс текущему пункту
      (item as HTMLElement).classList.add('active');
      (item as HTMLElement).style.background = '#2563eb';
      (item as HTMLElement).style.borderLeftColor = '#60a5fa';

      // Скрываем все вкладки
      document.querySelectorAll('.catalog-tab-content').forEach(content => {
        (content as HTMLElement).style.display = 'none';
      });
      // Показываем выбранную вкладку
      const targetTab = document.getElementById(`catalog-tab-${tabName}`);
      if (targetTab) {
        targetTab.style.display = 'flex';
      }
    });
  });

  // Обновление секции в конструкторе при изменении размеров
  function updateSectionFromInputs() {
    console.log('🔄 [updateSectionFromInputs] ВЫЗОВ функции');
    
    const widthInput = document.getElementById('catalog-item-edit-width') as HTMLInputElement | null;
    const heightInput = document.getElementById('catalog-item-edit-height') as HTMLInputElement | null;
    const depthInput = document.getElementById('catalog-item-edit-depth') as HTMLInputElement | null;
    
    if (!widthInput || !heightInput || !depthInput) {
      console.warn('⚠️ [updateSectionFromInputs] Поля ввода не найдены');
      return;
    }
    
    const width = parseFloat(widthInput.value) || 400;
    const height = parseFloat(heightInput.value) || 400;
    const depth = parseFloat(depthInput.value) || 200;

    // ⭐ Корневая секция: parent === null (модуль из clodisJSON) или is_root (плейсхолдер)
    const rootSectionNode = sceneNodes.find(n => n.type === 'section' && (n.parent === null || n.metadata?.is_root === true));
    
    console.log('🔍 [updateSectionFromInputs] Проверка корневой секции:', {
      rootSectionNode: rootSectionNode ? 'НАЙДЕНА' : 'НЕ НАЙДЕНА',
      размеры: { width, height, depth },
    });
    
    if (rootSectionNode) {
      // ⭐ Вызываем updateRootSectionSize — немедленно обновляет 3D и синхронизирует JSON
      if ((window as any).updateRootSectionSize) {
        (window as any).updateRootSectionSize(width, height, depth);
        return;
      }
      
      // Fallback: ручное обновление (если updateRootSectionSize недоступна)
      console.log('🔄 [updateSectionFromInputs] Обновляем размеры КОРНЕВОЙ СЕКЦИИ');
      
      const w = width / 1000;
      const h = height / 1000;
      const d = depth / 1000;
      
      // Обновляем размеры в metadata
      // ⭐ ИСПРАВЛЕНО: Сохраняем размеры в мм (как в референсе), а не в метрах
      if (rootSectionNode.metadata) {
        rootSectionNode.metadata.size = { x: width, y: height, z: depth }; // В мм
        rootSectionNode.metadata.size_three = { x: w, y: h, z: d }; // В метрах для Three.js
        rootSectionNode.metadata.originalSize = { x: width, y: height, z: depth }; // В мм
      }
      
      // Обновляем позицию own_object
      const ownObject = rootSectionNode.metadata?.own_object as THREE.Group | undefined;
      if (ownObject) {
        ownObject.position.set(-w / 2, 0, -d / 2);
      }
      
      // Обновляем красный куб и угловые маркеры в helpersGroup
      const helpersGroup = rootSectionNode.metadata?.helpers as THREE.Group | undefined;
      console.log('🔍 [updateSectionFromInputs] Проверка helpersGroup:', {
        helpersGroup_найден: !!helpersGroup,
        helpersGroup_children_до: helpersGroup ? helpersGroup.children.length : 0,
        helpersGroup_children_список: helpersGroup ? helpersGroup.children.map(c => ({
          name: c.name,
          type: c.type,
          visible: c.visible,
          is_helper: c.userData?.is_helper,
          is_root_section: c.userData?.is_root_section,
          is_root_corner: c.userData?.is_root_corner,
          is_root_corner_red: c.userData?.is_root_corner_red,
        })) : [],
      });
      
      if (helpersGroup) {
        // ⭐ ВАЖНО: helpers копируют позицию от own_object (как в референсе)
        if (ownObject) {
          helpersGroup.position.copy(ownObject.position);
          console.log('📍 [updateSectionFromInputs] helpersGroup.position обновлена:', helpersGroup.position.clone());
        }
        
        // Обновляем размеры и позицию куба
        // ⭐ Ищем куб по обоим признакам: is_helper И is_root_section (как в resetConstructorSceneForNewCatalogItem)
        console.log('🔍 [updateSectionFromInputs] Поиск красного куба в helpersGroup...');
        const oldCube = helpersGroup.children.find(c => 
          c.userData?.is_helper === true && c.userData?.is_root_section === true
        ) as THREE.Mesh | undefined;
        
        console.log('🔍 [updateSectionFromInputs] Результат поиска куба:', {
          куб_найден: !!oldCube,
          куб_visible_до: oldCube ? oldCube.visible : undefined,
          куб_position_до: oldCube ? oldCube.position.clone() : undefined,
          куб_geometry_до: oldCube ? {
            type: oldCube.geometry.type,
            parameters: (oldCube.geometry as THREE.BoxGeometry).parameters,
          } : undefined,
        });
        
        if (oldCube) {
          console.log('🔄 [updateSectionFromInputs] НАЧАЛО обновления геометрии куба');
          
          // ⭐ ВАЖНО: Обновляем геометрию БЕЗ dispose, чтобы куб не исчезал
          // Создаем новую геометрию и заменяем старую только после создания
          console.log('📦 [updateSectionFromInputs] Создаем новую геометрию...', { w, h, d });
          const newGeometry = new THREE.BoxGeometry(w, h, d);
          const oldGeometry = oldCube.geometry;
          
          console.log('📦 [updateSectionFromInputs] Заменяем геометрию...', {
            старая_геометрия: {
              type: oldGeometry.type,
              parameters: (oldGeometry as THREE.BoxGeometry).parameters,
            },
            новая_геометрия: {
              type: newGeometry.type,
              parameters: newGeometry.parameters,
            },
            куб_visible_перед_заменой: oldCube.visible,
          });
          
          oldCube.geometry = newGeometry;
          
          console.log('📦 [updateSectionFromInputs] Геометрия заменена, куб после замены:', {
            куб_visible: oldCube.visible,
            куб_geometry_type: oldCube.geometry.type,
            куб_geometry_parameters: (oldCube.geometry as THREE.BoxGeometry).parameters,
          });
          
          // Удаляем старую геометрию только после замены
          if (oldGeometry) {
            console.log('🗑️ [updateSectionFromInputs] Удаляем старую геометрию...');
            oldGeometry.dispose();
            console.log('🗑️ [updateSectionFromInputs] Старая геометрия удалена, куб после dispose:', {
              куб_visible: oldCube.visible,
              куб_geometry_type: oldCube.geometry.type,
            });
          }
          
          // Обновляем позицию куба
          console.log('📍 [updateSectionFromInputs] Обновляем позицию куба...', {
            новая_позиция: { x: w / 2, y: h / 2, z: d / 2 },
            куб_visible_перед_позицией: oldCube.visible,
          });
          oldCube.position.set(w / 2, h / 2, d / 2); // Смещаем от центра к началу координат
          
          // ⭐ РЕФЕРЕНС: Используем материал из pp.three.materials.helper_cube (как в референсе)
          const helperCubeMaterial = (typeof window !== 'undefined' && (window as any).pp?.three?.materials?.helper_cube)
            ? (window as any).pp.three.materials.helper_cube
            : undefined;
          if (helperCubeMaterial && oldCube.material !== helperCubeMaterial) {
            oldCube.material = helperCubeMaterial;
          }
          oldCube.visible = true; // Видимость контролируется через helpersGroup.visible
          
          console.log('✅ [updateSectionFromInputs] Красный куб обновлен:', {
            размеры: { w, h, d },
            позиция: oldCube.position.clone(),
            видимый: oldCube.visible,
            куб_в_helpersGroup: helpersGroup.children.includes(oldCube),
            helpersGroup_children_после_обновления: helpersGroup.children.length,
          });
          } else {
          // Если куба нет, создаем новый
          console.warn('⚠️ [updateSectionFromInputs] Красный куб не найден, создаем новый');
          const redMat = new THREE.MeshStandardMaterial({
            color: 0xff0000, // Красный цвет
            transparent: true,
            opacity: 1.0,
            wireframe: true, // Только контур, без заливки
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true,
          });
          const rootCubeGeo = new THREE.BoxGeometry(w, h, d);
          const rootCube = new THREE.Mesh(rootCubeGeo, redMat);
          rootCube.position.set(w / 2, h / 2, d / 2);
          rootCube.userData.is_helper = true;
          rootCube.userData.is_root_section = true;
          rootCube.renderOrder = 10;
          rootCube.layers.set(1);
          rootCube.visible = true; // ⭐ ИЗМЕНЕНО: Красный куб видимый
          helpersGroup.add(rootCube);
          console.log('✅ [updateSectionFromInputs] Новый красный куб создан и добавлен:', {
            размеры: { w, h, d },
            позиция: rootCube.position.clone(),
            видимый: rootCube.visible,
            helpersGroup_children_после_создания: helpersGroup.children.length,
          });
        }
        
        // Удаляем старые маркеры (зеленые и красный)
        console.log('🗑️ [updateSectionFromInputs] Удаляем старые маркеры...', {
          helpersGroup_children_перед_удалением: helpersGroup.children.length,
          куб_все_еще_видим: helpersGroup.children.find(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          )?.visible,
        });
        
        const markersToRemove: THREE.Object3D[] = [];
        helpersGroup.children.forEach(child => {
          if (child.userData?.is_root_corner || child.userData?.is_root_corner_red) {
            markersToRemove.push(child);
          }
        });
        
        console.log('🗑️ [updateSectionFromInputs] Найдено маркеров для удаления:', markersToRemove.length);
        
        markersToRemove.forEach(child => {
          helpersGroup.remove(child);
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material) (child.material as THREE.Material).dispose();
          }
        });
        
        console.log('🗑️ [updateSectionFromInputs] Маркеры удалены:', {
          helpersGroup_children_после_удаления: helpersGroup.children.length,
          куб_все_еще_видим: helpersGroup.children.find(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          )?.visible,
          куб_все_еще_в_helpersGroup: helpersGroup.children.some(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          ),
        });
        
        // ⭐ КРАСНЫЙ маркер в нижнем левом заднем углу (back-bottom-left) - точка отсчета размеров
        const backBottomLeftCorner = { x: 0, y: 0, z: 0 }; // В локальных координатах helpersGroup
        const redCornerMarkerGeo = new THREE.SphereGeometry(0.015, 16, 16); // ⭐ УМЕНЬШЕН В 2 РАЗА (было 0.03)
        const redCornerMarkerMat = new THREE.MeshBasicMaterial({ 
          color: 0xff0000, // КРАСНЫЙ
          depthTest: false 
        });
        const redCornerMarker = new THREE.Mesh(redCornerMarkerGeo, redCornerMarkerMat);
        redCornerMarker.position.set(backBottomLeftCorner.x, backBottomLeftCorner.y, backBottomLeftCorner.z);
        redCornerMarker.userData.is_root_corner_red = true;
        redCornerMarker.name = '__root_corner_back_bottom_left_RED';
        helpersGroup.add(redCornerMarker);
        
        // ⭐ ВАЖНО: Обновляем матрицы и рендерим сразу после обновления куба
        // чтобы они не исчезали на секунду
        console.log('🔄 [updateSectionFromInputs] Обновляем матрицы и рендерим...', {
          helpersGroup_children_перед_рендером: helpersGroup.children.length,
          куб_видим_перед_рендером: helpersGroup.children.find(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          )?.visible,
        });
        
        helpersGroup.updateMatrixWorld(true);
        render();
        
        console.log('✅ [updateSectionFromInputs] Рендер выполнен, финальная проверка куба:', {
          helpersGroup_children_после_рендера: helpersGroup.children.length,
          куб_видим_после_рендера: helpersGroup.children.find(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          )?.visible,
          куб_позиция_после_рендера: helpersGroup.children.find(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          )?.position?.clone(),
        });
      }
      
      // Обновляем стрелки размеров
      console.log('🔄 [updateSectionFromInputs] ВЫЗОВ buildInitialDimensions, проверка куба ДО:', {
        helpersGroup_children_до: helpersGroup ? helpersGroup.children.length : 0,
        куб_видим_до: helpersGroup ? helpersGroup.children.find(c => 
          c.userData?.is_helper === true && c.userData?.is_root_section === true
        )?.visible : undefined,
        куб_в_helpersGroup_до: helpersGroup ? helpersGroup.children.some(c => 
          c.userData?.is_helper === true && c.userData?.is_root_section === true
        ) : false,
      });
      
      // ⭐ ВАЖНО: Обновляем userData.computed.size корневой секции ПЕРЕД обновлением дочерних
      // Референс: размеры хранятся в userData.computed.size (в мм), а не только в metadata
      if (!rootSectionNode.group.userData.computed) {
        rootSectionNode.group.userData.computed = {};
      }
      if (!rootSectionNode.group.userData.computed.size) {
        rootSectionNode.group.userData.computed.size = new THREE.Vector3();
      }
      rootSectionNode.group.userData.computed.size.set(width, height, depth); // В мм
      rootSectionNode.group.userData.computed.u_size = rootSectionNode.group.userData.computed.u_size || new THREE.Vector3();
      rootSectionNode.group.userData.computed.u_size.set(w, h, d); // В метрах
      
      buildInitialDimensions(width, height, rootSectionNode);
      
      // ⭐ ОБНОВЛЯЕМ РАЗМЕРЫ ДОЧЕРНИХ СЕКЦИЙ
      const oldRootSize = rootSectionNode.metadata?.size || { x: 0, y: 0, z: 0 };
      const oldRootSizeInMm = { x: oldRootSize.x, y: oldRootSize.y, z: oldRootSize.z };
      const newRootSizeInMm = { x: width, y: height, z: depth };
      
      // Вычисляем коэффициенты изменения размеров
      const scaleX = oldRootSizeInMm.x > 0 ? newRootSizeInMm.x / oldRootSizeInMm.x : 1;
      const scaleY = oldRootSizeInMm.y > 0 ? newRootSizeInMm.y / oldRootSizeInMm.y : 1;
      const scaleZ = oldRootSizeInMm.z > 0 ? newRootSizeInMm.z / oldRootSizeInMm.z : 1;
      
      console.log('📐 [updateSectionFromInputs] Коэффициенты изменения размеров:', {
        scaleX, scaleY, scaleZ,
        oldSize: oldRootSizeInMm,
        newSize: newRootSizeInMm
      });
      
      // Находим все дочерние секции
      const childSections = rootSectionNode.children.filter(child => child.type === 'section');
      console.log('🔍 [updateSectionFromInputs] Найдено дочерних секций:', childSections.length);
      
      childSections.forEach(childSection => {
        // ⭐ ИСПОЛЬЗУЕМ СИСТЕМУ ВЫРАЖЕНИЙ (как в референсе)
        // Берем выражения из metadata.size_expressions или используем 's:x', 's:y', 's:z' по умолчанию
        const childSizeExpressions = childSection.metadata?.size_expressions || {
          x: 's:x',
          y: 's:y',
          z: 's:z'
        };
        
        // ⭐ КРИТИЧЕСКИ ВАЖНО: Пересоздаем c_object с актуальными размерами родителя
        // Референс: f['size']['x'] = comp2(g['size']['x'], h) где h = f['c_object']
        // c_object должен содержать актуальные parent_size и root_size из userData.computed.size
        // ⭐ ВАЖНО: Пересоздаем c_object, чтобы он использовал обновленные размеры корневой секции
        const c_object = createCObject(childSection.group, rootSectionNode, rootSectionNode, null);
        
        // Вычисляем размеры через comp2() (как в референсе _build_size)
        const newChildWidth = Math.round(comp2(childSizeExpressions.x, c_object));
        const newChildHeight = Math.round(comp2(childSizeExpressions.y, c_object));
        const newChildDepth = Math.round(comp2(childSizeExpressions.z, c_object));
        
        const oldChildSize = childSection.metadata?.size || { x: 0, y: 0, z: 0 };
        console.log('🔄 [updateSectionFromInputs] Обновление дочерней секции:', {
          name: childSection.name,
          expressions: childSizeExpressions,
          oldSize: oldChildSize,
          newSize: { x: newChildWidth, y: newChildHeight, z: newChildDepth },
          context_parent_size: c_object.parent_size,
          context_root_size: c_object.root_size,
        });
        
        // Обновляем metadata
        if (!childSection.metadata) childSection.metadata = {};
        childSection.metadata.size = { x: newChildWidth, y: newChildHeight, z: newChildDepth }; // В мм
        childSection.metadata.size_three = { 
          x: newChildWidth / 1000, 
          y: newChildHeight / 1000, 
          z: newChildDepth / 1000 
        }; // В метрах для Three.js
        
        // ⭐ ВАЖНО: Обновляем userData.computed.size дочерней секции (как в референсе)
        // Референс: размеры хранятся в userData.computed.size (в мм), а не только в metadata
        if (!childSection.group.userData.computed) {
          childSection.group.userData.computed = {};
        }
        if (!childSection.group.userData.computed.size) {
          childSection.group.userData.computed.size = new THREE.Vector3();
        }
        childSection.group.userData.computed.size.set(newChildWidth, newChildHeight, newChildDepth); // В мм
        childSection.group.userData.computed.u_size = childSection.group.userData.computed.u_size || new THREE.Vector3();
        childSection.group.userData.computed.u_size.set(newChildWidth / 1000, newChildHeight / 1000, newChildDepth / 1000); // В метрах
        
        // ⭐ ПОЛНАЯ ПЕРЕСБОРКА ДОЧЕРНЕЙ СЕКЦИИ (как в референсе _rebuild → _build)
        const childOwnObject = childSection.metadata?.own_object as THREE.Group | undefined;
        const childHelpersGroup = childSection.metadata?.helpers as THREE.Group | undefined;
        
        if (childOwnObject && childHelpersGroup) {
          const newChildW = newChildWidth / 1000;
          const newChildH = newChildHeight / 1000;
          const newChildD = newChildDepth / 1000;
          
          // 1. _build_size() - размеры уже обновлены в metadata выше
          
          // 2. _build_pivot() - ПЕРЕСЧИТЫВАЕМ pivot для own_object с новыми размерами
          // Референс: conv_pivot(pivot, size) = -pivot * size / 2
          // Для дочерней секции pivot = {-1, -1, -1} (back-bottom-left)
          const pivotX_mm = -(-1) * newChildWidth / 2; // = newChildWidth / 2
          const pivotY_mm = -(-1) * newChildHeight / 2; // = newChildHeight / 2
          const pivotZ_mm = -(-1) * newChildDepth / 2; // = newChildDepth / 2
          
          // ⭐ ВАЖНО: Сбрасываем трансформации own_object и применяем заново
          // Сначала сбрасываем все трансформации
          childOwnObject.position.set(0, 0, 0);
          childOwnObject.rotation.set(0, 0, 0);
          childOwnObject.scale.set(1, 1, 1);
          
          // Затем применяем pivot заново
          childOwnObject.translateX(pivotX_mm / 1000);
          childOwnObject.translateY(pivotY_mm / 1000);
          childOwnObject.translateZ(pivotZ_mm / 1000);
          
          // 3. _build_helpers() - обновляем helpers с новыми размерами
          // Обновляем куб
          const childCube = childHelpersGroup.children.find(c => 
            c.userData?.is_helper === true && (c as THREE.Mesh).isMesh
          ) as THREE.Mesh | undefined;
          
          if (childCube) {
            const oldGeometry = childCube.geometry;
            childCube.geometry = new THREE.BoxGeometry(newChildW, newChildH, newChildD);
            if (oldGeometry) oldGeometry.dispose();
            // ⭐ РЕФЕРЕНС: BoxGeometry центрирован, позиция (0,0,0) в helpersGroup
            childCube.position.set(0, 0, 0);
          }
          
          // Обновляем edges
          const childEdges = childHelpersGroup.children.find(c => 
            c instanceof THREE.LineSegments && c.userData?.is_helper === true
          ) as THREE.LineSegments | undefined;
          
          if (childEdges) {
            const oldEdgesGeometry = childEdges.geometry;
            childEdges.geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(newChildW, newChildH, newChildD));
            if (oldEdgesGeometry) oldEdgesGeometry.dispose();
            // ⭐ РЕФЕРЕНС: EdgesGeometry также центрирован, позиция (0,0,0) в helpersGroup
            childEdges.position.set(0, 0, 0);
          }
          
          // ⭐ ВАЖНО: helpers копируют позицию и поворот от own_object (как в референсе строка 2881-2882)
          childHelpersGroup.position.copy(childOwnObject.position);
          childHelpersGroup.rotation.copy(childOwnObject.rotation);
          
          childOwnObject.updateMatrixWorld(true);
          childHelpersGroup.updateMatrixWorld(true);
          
          console.log('✅ [updateSectionFromInputs] Дочерняя секция полностью пересобрана:', {
            name: childSection.name,
            newSize: { x: newChildWidth, y: newChildHeight, z: newChildDepth },
            ownObjectPosition: childOwnObject.position.clone(),
            helpersPosition: childHelpersGroup.position.clone(),
          });
        }
        
        // Обновляем группу дочерней секции
        childSection.group.updateMatrixWorld(true);
      });
      
      console.log('🔄 [updateSectionFromInputs] ПОСЛЕ buildInitialDimensions, проверка куба ПОСЛЕ:', {
        helpersGroup_children_после: helpersGroup ? helpersGroup.children.length : 0,
        куб_видим_после: helpersGroup ? helpersGroup.children.find(c => 
          c.userData?.is_helper === true && c.userData?.is_root_section === true
        )?.visible : undefined,
        куб_в_helpersGroup_после: helpersGroup ? helpersGroup.children.some(c => 
          c.userData?.is_helper === true && c.userData?.is_root_section === true
        ) : false,
        куб_материал_после: helpersGroup ? (() => {
          const cube = helpersGroup.children.find(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          ) as THREE.Mesh | undefined;
          return cube ? {
            материал_тип: cube.material?.type,
            материал_visible: (cube.material as any)?.visible,
            материал_opacity: (cube.material as any)?.opacity,
            материал_color: (cube.material as any)?.color?.getHex(),
          } : null;
        })() : null,
      });
      
      // ⭐ МАРКЕР НА СТРЕЛКАХ УДАЛЕН: больше не проверяем его позицию
      
      // Обновляем камеру
      rootSectionNode.group.updateMatrixWorld(true);
      const bbox = new THREE.Box3().setFromObject(rootSectionNode.group);
      if (!bbox.isEmpty()) {
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2.5;
        
      controls.target.copy(center);
        camera.position.set(center.x, center.y, center.z + distance);
      controls.update();
      render();
        
        console.log('🔄 [updateSectionFromInputs] ПОСЛЕ обновления камеры и финального рендера, проверка куба:', {
          helpersGroup_children_после_камеры: helpersGroup ? helpersGroup.children.length : 0,
          куб_видим_после_камеры: helpersGroup ? helpersGroup.children.find(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          )?.visible : undefined,
          куб_в_helpersGroup_после_камеры: helpersGroup ? helpersGroup.children.some(c => 
            c.userData?.is_helper === true && c.userData?.is_root_section === true
          ) : false,
          куб_в_сцене: helpersGroup ? scene.children.some(obj => 
            obj === helpersGroup || (obj as THREE.Group).children.includes(helpersGroup)
          ) : false,
        });
      }
      
      console.log('✅ [updateSectionFromInputs] Корневая секция обновлена:', {
        размеры: { w, h, d },
        размеры_мм: { width, height, depth },
        количество_угловых_маркеров: helpersGroup ? helpersGroup.children.filter(c => c.userData?.is_root_corner || c.userData?.is_root_corner_red).length : 0,
      });
      
      return; // ⭐ ВАЖНО: выходим, не создаем новый frame!
    }

    // ⭐ УДАЛЕНО: Вся старая логика создания секции через buildParentFrame
    // Секции теперь создаются заново через другие функции, не здесь
    console.log('⚠️ [updateSectionFromInputs] Корневой секции нет, ничего не делаем (секция будет создана заново)');
  }

  // Обработчики для полей ввода размеров (debounce 120ms — быстрее отклик, requestAnimationFrame чтобы не блокировать UI при вводе)
  const widthInput = document.getElementById('catalog-item-edit-width') as HTMLInputElement | null;
  const heightInput = document.getElementById('catalog-item-edit-height') as HTMLInputElement | null;
  const depthInput = document.getElementById('catalog-item-edit-depth') as HTMLInputElement | null;
  let updateSectionFromInputsDebounce: ReturnType<typeof setTimeout> | null = null;
  const scheduleUpdateSectionFromInputs = () => {
    if (updateSectionFromInputsDebounce) clearTimeout(updateSectionFromInputsDebounce);
    updateSectionFromInputsDebounce = setTimeout(() => {
      updateSectionFromInputsDebounce = null;
      requestAnimationFrame(() => {
        updateSectionFromInputs();
      });
    }, 120);
  };
  widthInput?.addEventListener('input', scheduleUpdateSectionFromInputs);
  heightInput?.addEventListener('input', scheduleUpdateSectionFromInputs);
  depthInput?.addEventListener('input', scheduleUpdateSectionFromInputs);

  // --- Вкладка JSON: форматирование и применение полного JSON модуля (как в Clodis) ---
  const jsonEditor = document.getElementById('catalog-json-editor') as HTMLTextAreaElement | null;
  const jsonFormatBtnOrig = document.getElementById('json-format-btn') as HTMLButtonElement | null;
  const jsonSaveBtnOrig = document.getElementById('json-save-btn') as HTMLButtonElement | null;

  // Переинициализируем кнопки, чтобы отключить старые onClick и привязать нашу логику
  let jsonFormatBtn: HTMLButtonElement | null = null;
  let jsonSaveBtn: HTMLButtonElement | null = null;

  if (jsonFormatBtnOrig) {
    jsonFormatBtn = jsonFormatBtnOrig.cloneNode(true) as HTMLButtonElement;
    jsonFormatBtn.removeAttribute('onclick');
    jsonFormatBtnOrig.parentNode?.replaceChild(jsonFormatBtn, jsonFormatBtnOrig);
  }
  if (jsonSaveBtnOrig) {
    jsonSaveBtn = jsonSaveBtnOrig.cloneNode(true) as HTMLButtonElement;
    jsonSaveBtn.removeAttribute('onclick');
    jsonSaveBtnOrig.parentNode?.replaceChild(jsonSaveBtn, jsonSaveBtnOrig);
  }

  // Форматирование JSON
  jsonFormatBtn?.addEventListener('click', () => {
    if (!jsonEditor) return;
    try {
      const parsed = JSON.parse(jsonEditor.value);
      jsonEditor.value = JSON.stringify(parsed, null, 2);
    } catch (e) {
      alert('Ошибка форматирования JSON: ' + (e as Error).message);
    }
  });

  // Кнопка "Применить" - применяет JSON и удаляет секцию, если её нет в JSON
  const jsonApplyBtn = document.getElementById('json-apply-btn') as HTMLButtonElement | null;
  jsonApplyBtn?.addEventListener('click', () => {
    if (!jsonEditor) return;
    try {
      const jsonText = jsonEditor.value.trim();
      
      // Если JSON пустой или содержит пустой массив - удаляем секцию
      if (!jsonText || jsonText === '[]' || jsonText === '{}') {
        console.log('🗑️ [JSON Apply] JSON пустой - удаляем секцию из сцены');
        
        // Удаляем все объекты из сцены кроме камеры, освещения и сетки
        const objectsToRemove: THREE.Object3D[] = [];
        const childrenToCheck = [...scene.children];
        
        childrenToCheck.forEach(child => {
          const shouldKeep = 
            (child instanceof THREE.Camera) ||
            (child instanceof THREE.Light) ||
            child.type === 'GridHelper' ||
            child.type === 'AxesHelper';
          
          if (!shouldKeep) {
            objectsToRemove.push(child);
          }
        });
        
        // Удаляем объекты
        objectsToRemove.forEach(obj => {
          obj.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.geometry) mesh.geometry.dispose();
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(m => m.dispose());
                } else {
                  mesh.material.dispose();
                }
              }
            }
          });
          if (scene.children.includes(obj)) {
            scene.remove(obj);
          }
        });
        
        // Очищаем sceneNodes
        sceneNodes.length = 0;
        
        // Обновляем дерево
        if (typeof renderHierarchy === 'function') {
          renderHierarchy();
        }
        
        // Обновляем поля размеров
        if (widthInput) widthInput.value = '400';
        if (heightInput) heightInput.value = '400';
        if (depthInput) depthInput.value = '200';
        
        console.log('✅ [JSON Apply] Секция удалена из сцены');
        alert('Секция удалена из сцены');
        return;
      }
      
      // Парсим JSON
      const parsed = JSON.parse(jsonText) as ClodisJSON;
      const clodisArray: ClodisItem[] = Array.isArray(parsed) ? parsed : [parsed];
      
      // Проверяем, есть ли секция в JSON
      const hasSection = clodisArray.some(item => item.type === 'section');
      
      if (!hasSection) {
        console.log('🗑️ [JSON Apply] Секции нет в JSON - удаляем секцию из сцены');
        
        // Удаляем все объекты из сцены кроме камеры, освещения и сетки
        const objectsToRemove: THREE.Object3D[] = [];
        const childrenToCheck = [...scene.children];
        
        childrenToCheck.forEach(child => {
          const shouldKeep = 
            (child instanceof THREE.Camera) ||
            (child instanceof THREE.Light) ||
            child.type === 'GridHelper' ||
            child.type === 'AxesHelper';
          
          if (!shouldKeep) {
            objectsToRemove.push(child);
          }
        });
        
        // Удаляем объекты
        objectsToRemove.forEach(obj => {
          obj.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.geometry) mesh.geometry.dispose();
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(m => m.dispose());
                } else {
                  mesh.material.dispose();
                }
              }
            }
          });
          if (scene.children.includes(obj)) {
            scene.remove(obj);
          }
        });
        
        // Очищаем sceneNodes
        sceneNodes.length = 0;
        
        // Обновляем дерево
        if (typeof renderHierarchy === 'function') {
          renderHierarchy();
        }
        
        console.log('✅ [JSON Apply] Секция удалена из сцены (секции нет в JSON)');
        alert('Секция удалена из сцены (секции нет в JSON)');
        return;
      }
      
      // Если секция есть - применяем JSON (импортируем модуль)
      console.log('✅ [JSON Apply] Секция найдена в JSON - применяем импорт');
      
      // Запоминаем JSON в текущем редактируемом элементе каталога (если есть)
      if (currentEditingCatalogElement) {
        currentEditingCatalogElement.clodisJSON = clodisArray;
      }

      // Размеры секции из верхних полей (мм) – используем как savedSize
      const w = widthInput ? parseFloat(widthInput.value) || 400 : 400;
      const h = heightInput ? parseFloat(heightInput.value) || 400 : 400;
      const d = depthInput ? parseFloat(depthInput.value) || 200 : 200;

      console.log('🔁 [JSON Apply] Применяем полный Clodis JSON к модулю:', {
        items: clodisArray.length,
        first: clodisArray[0],
        sizeMM: { w, h, d }
      });

      // ⭐ ВАЖНО: При импорте JSON старая секция должна быть полностью удалена
      importModuleFromClodisJSON(clodisArray, { width: w, height: h, depth: d });
      
      console.log('✅ [JSON Apply] Импорт JSON завершен');
    } catch (e) {
      console.error('❌ [JSON Apply] Ошибка применения JSON:', e);
      alert('Ошибка применения JSON: ' + (e as Error).message);
    }
  });

  // Применение JSON ко всему модулю (секция + детали), как в Clodis
  jsonSaveBtn?.addEventListener('click', () => {
    if (!jsonEditor) return;
    try {
      const parsed = JSON.parse(jsonEditor.value) as ClodisJSON;
      const clodisArray: ClodisItem[] = Array.isArray(parsed) ? parsed : [parsed];

      // Запоминаем JSON в текущем редактируемом элементе каталога (если есть)
      if (currentEditingCatalogElement) {
        currentEditingCatalogElement.clodisJSON = clodisArray;
      }

      // Размеры секции из верхних полей (мм) – используем как savedSize
      const w = widthInput ? parseFloat(widthInput.value) || 400 : 400;
      const h = heightInput ? parseFloat(heightInput.value) || 400 : 400;
      const d = depthInput ? parseFloat(depthInput.value) || 200 : 200;

      console.log('🔁🔁🔁 [JSON Tab] КНОПКА "Сохранить" НАЖАТА 🔁🔁🔁');
      console.log('🔁 [JSON Tab] Применяем полный Clodis JSON к модулю:', {
        items: clodisArray.length,
        first: clodisArray[0],
        sizeMM: { w, h, d }
      });

      // ⭐ ВАЖНО: При импорте JSON старая секция должна быть полностью удалена
      // importModuleFromClodisJSON сама удалит все объекты из сцены, включая рамки секций
      importModuleFromClodisJSON(clodisArray, { width: w, height: h, depth: d });
      
      console.log('✅ [JSON Tab] Импорт JSON завершен');
    } catch (e) {
      console.error('❌ Ошибка применения JSON модуля:', e);
      alert('Ошибка применения JSON: ' + (e as Error).message);
    }
  });

  // Варианты размеров
  let sizeVariants: Array<{ name: string; article: string; price: number; width: number; height: number; depth: number }> = [];
  const variantAddBtn = document.getElementById('catalog-item-edit-variant-add');
  const variantNameInput = document.getElementById('catalog-item-edit-variant-name') as HTMLInputElement | null;
  const variantArticleInput = document.getElementById('catalog-item-edit-variant-article') as HTMLInputElement | null;
  const variantPriceInput = document.getElementById('catalog-item-edit-variant-price') as HTMLInputElement | null;
  const variantWidthInput = document.getElementById('catalog-item-edit-variant-width') as HTMLInputElement | null;
  const variantHeightInput = document.getElementById('catalog-item-edit-variant-height') as HTMLInputElement | null;
  const variantDepthInput = document.getElementById('catalog-item-edit-variant-depth') as HTMLInputElement | null;
  const variantsList = document.getElementById('catalog-item-edit-variants-list');

  function renderSizeVariants() {
    if (!variantsList) return;
    if (!sizeVariants.length) {
      variantsList.innerHTML = '<div style="padding:12px; text-align:center; color:#999; font-size:12px;">Вариантов размеров пока нет</div>';
      updateDefaultSizeSelect();
      return;
    }

    variantsList.innerHTML = sizeVariants
      .map(
        (v, i) => `
      <div style="padding:10px; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:8px; background:#f9fafb;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:600; font-size:13px; margin-bottom:4px;">${v.name || 'Без названия'}</div>
            <div style="font-size:12px; color:#666;">
              Артикул: ${v.article || '-'} | Цена: ${v.price} ₽ | Размеры: ${v.width}×${v.height}×${v.depth} мм
            </div>
          </div>
          <button class="btn btn-sm" data-variant-index="${i}" style="padding:4px 8px; font-size:11px; color:#dc2626;">🗑 Удалить</button>
        </div>
      </div>
    `
      )
      .join('');

    // Обработчики удаления
    variantsList.querySelectorAll('button[data-variant-index]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt((btn as HTMLElement).dataset.variantIndex || '0');
        sizeVariants.splice(index, 1);
        renderSizeVariants();
        updateDefaultSizeSelect();
      });
    });
    
    // Обновляем select размера по умолчанию после рендеринга вариантов
    updateDefaultSizeSelect();
  }

  function updateDefaultSizeSelect() {
    const defaultSizeSelect = document.getElementById('catalog-item-edit-default-size') as HTMLSelectElement | null;
    if (!defaultSizeSelect) return;
    
    const currentValue = defaultSizeSelect.value;
    defaultSizeSelect.innerHTML = '<option value="0x0x0">0x0x0</option>';
    
    // Добавляем варианты размеров в select
    sizeVariants.forEach((v, i) => {
      const sizeStr = `${v.width}x${v.height}x${v.depth}`;
      const option = document.createElement('option');
      option.value = sizeStr;
      option.textContent = `${v.name || 'Вариант ' + (i + 1)} (${sizeStr})`;
      defaultSizeSelect.appendChild(option);
    });
    
    // Восстанавливаем выбранное значение, если оно все еще существует
    if (currentValue && Array.from(defaultSizeSelect.options).some(opt => opt.value === currentValue)) {
      defaultSizeSelect.value = currentValue;
    }
  }

  // Обработчики кнопок для полей размеров вариантов
  function setupVariantSizeButtons(inputId: string, prefix: string) {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) {
      console.warn(`⚠️ [setupVariantSizeButtons] Поле ${inputId} не найдено`);
      return;
    }

    // Кнопка "× 2" (умножить на 2)
    const multiplyBtn = document.querySelector(`.${prefix}-btn-multiply`) as HTMLButtonElement | null;
    if (multiplyBtn) {
      // Удаляем старый обработчик, если есть
      const newMultiplyBtn = multiplyBtn.cloneNode(true) as HTMLButtonElement;
      multiplyBtn.parentNode?.replaceChild(newMultiplyBtn, multiplyBtn);
      newMultiplyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentValue = parseFloat(input.value) || 0;
        const newValue = currentValue * 2;
        input.value = String(newValue);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`✅ [${prefix}] Умножено на 2: ${currentValue} → ${newValue}`);
      });
    } else {
      console.warn(`⚠️ [setupVariantSizeButtons] Кнопка ${prefix}-btn-multiply не найдена`);
    }

    // Кнопка "÷ 2" (разделить на 2)
    const divideBtn = document.querySelector(`.${prefix}-btn-divide`) as HTMLButtonElement | null;
    if (divideBtn) {
      const newDivideBtn = divideBtn.cloneNode(true) as HTMLButtonElement;
      divideBtn.parentNode?.replaceChild(newDivideBtn, divideBtn);
      newDivideBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentValue = parseFloat(input.value) || 0;
        const newValue = currentValue / 2;
        input.value = String(newValue);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`✅ [${prefix}] Разделено на 2: ${currentValue} → ${newValue}`);
      });
    } else {
      console.warn(`⚠️ [setupVariantSizeButtons] Кнопка ${prefix}-btn-divide не найдена`);
    }

    // Кнопка "+{a}" (добавить переменную) - пока заглушка
    const addVarBtn = document.querySelector(`.${prefix}-btn-add-var`) as HTMLButtonElement | null;
    if (addVarBtn) {
      const newAddVarBtn = addVarBtn.cloneNode(true) as HTMLButtonElement;
      addVarBtn.parentNode?.replaceChild(newAddVarBtn, addVarBtn);
      newAddVarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Реализовать открытие списка переменных (как в Clodis)
        // Пока показываем подсказку
        console.log(`ℹ️ [${prefix}] Кнопка "Добавить переменную" - будет реализована позже`);
        // Можно добавить модалку выбора переменных из списка (s:x, s:y, s:z, g:g0.thickness и т.д.)
      });
    }

    // Кнопка "{aa}" / "a:a" (переключить режим отображения)
    // В Clodis это переключает между "pretty" (красивое отображение с {}) и "real" (реальные выражения типа s:x)
    // Для простых числовых полей это не критично, но добавим для совместимости
    const modeBtn = document.querySelector(`.${prefix}-btn-mode`) as HTMLButtonElement | null;
    if (modeBtn) {
      const newModeBtn = modeBtn.cloneNode(true) as HTMLButtonElement;
      modeBtn.parentNode?.replaceChild(newModeBtn, modeBtn);
      let isPrettyMode = newModeBtn.getAttribute('data-mode') === 'pretty';
      newModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isPrettyMode = !isPrettyMode;
        newModeBtn.textContent = isPrettyMode ? '{aa}' : 'a:a';
        newModeBtn.setAttribute('data-mode', isPrettyMode ? 'pretty' : 'real');
        // TODO: Реализовать переключение между pretty и real режимами для работы с выражениями
        console.log(`ℹ️ [${prefix}] Режим переключен: ${isPrettyMode ? 'pretty' : 'real'}`);
      });
    }
  }

  // Настраиваем кнопки для всех полей размеров (вызывается при загрузке и при открытии модалки)
  function initVariantSizeButtons() {
    setupVariantSizeButtons('catalog-item-edit-variant-width', 'variant-width');
    setupVariantSizeButtons('catalog-item-edit-variant-height', 'variant-height');
    setupVariantSizeButtons('catalog-item-edit-variant-depth', 'variant-depth');
  }

  // Инициализируем кнопки при загрузке
  initVariantSizeButtons();

  variantAddBtn?.addEventListener('click', () => {
    if (!variantNameInput || !variantArticleInput || !variantPriceInput || !variantWidthInput || !variantHeightInput || !variantDepthInput) return;

    const name = variantNameInput.value.trim();
    const article = variantArticleInput.value.trim();
    const price = parseFloat(variantPriceInput.value) || 0;
    const width = parseFloat(variantWidthInput.value) || 0;
    const height = parseFloat(variantHeightInput.value) || 0;
    const depth = parseFloat(variantDepthInput.value) || 0;

    if (!name) {
      alert('Введите название варианта');
      return;
    }

    sizeVariants.push({ name, article, price, width, height, depth });
    renderSizeVariants();
    updateDefaultSizeSelect();

    // Очищаем поля
    variantNameInput.value = '';
    variantArticleInput.value = '';
    variantPriceInput.value = '0';
    variantWidthInput.value = '0';
    variantHeightInput.value = '0';
    variantDepthInput.value = '0';
  });


  // Кнопка "Категории" в списке элементов типа
  typeItemsCategoriesBtn?.addEventListener('click', () => {
    openCatalogCategoriesModal();
  });

  catalogCategoriesClose?.addEventListener('click', () => {
    closeCatalogCategoriesModal();
  });
  catalogCategoriesBackdrop?.addEventListener('click', e => {
    if (e.target === catalogCategoriesBackdrop) {
      closeCatalogCategoriesModal();
    }
  });

  catalogCategoriesAdd?.addEventListener('click', () => {
    if (!currentTypeItemsId) return;
    const name = prompt('Название новой категории:', '');
    if (!name || !name.trim()) return;
    const list = loadCatalogCategories(currentTypeItemsId);
    if (list.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      alert('Категория с таким названием уже существует');
      return;
    }
    list.push({ id: 'cat-' + generateId(), name: name.trim(), parentId: null });
    saveCatalogCategories(currentTypeItemsId, list);
    renderCatalogCategories();
  });

  // === Группы каталога ===

  function renderCatalogGroups(filter: string = '') {
    // Переинициализируем ссылку на tbody, так как модалка могла быть удалена/пересоздана
    const tableBody = document.getElementById('catalog-groups-table-body') as HTMLTableSectionElement | null;
    if (!tableBody) {
      console.warn('⚠️ [renderCatalogGroups] Таблица catalog-groups-table-body не найдена в DOM');
      return;
    }
    
    const all = loadCatalogGroups();
    const q = filter.trim().toLowerCase();
    const list = q ? all.filter(g => g.name.toLowerCase().includes(q)) : all;

    if (!list.length) {
      tableBody.innerHTML =
        `<tr><td colspan="3" style="padding:12px; text-align:center; color:#999;">Нет групп</td></tr>`;
      return;
    }

    tableBody.innerHTML = list
      .map((g, i) => {
        return `<tr data-id="${g.id}">
          <td style="padding:6px 10px; border-bottom:1px solid #eee;">${i + 1}</td>
          <td style="padding:6px 10px; border-bottom:1px solid #eee;">${g.name}</td>
          <td style="padding:6px 10px; border-bottom:1px solid #eee;">
            <button class="btn btn-sm" data-action="edit">✏️</button>
            <button class="btn btn-sm" data-action="delete" style="margin-left:4px;">🗑</button>
          </td>
        </tr>`;
      })
      .join('');

    // обработчики действий
    // НЕ создаем обработчики здесь, если используется новая страница (admin-section-container)
    // Обработчики будут созданы в admin-panel.js
    const isAdminSection = document.getElementById('admin-section-container') !== null;
    console.log('📋 [renderCatalogGroups] isAdminSection:', isAdminSection, 'admin-section-container:', document.getElementById('admin-section-container') ? 'найден' : 'не найден');
    if (!isAdminSection) {
      // Создаем обработчики только если это старая модалка
      tableBody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = (btn as HTMLElement).closest('tr');
        const id = tr?.getAttribute('data-id');
        if (!id) return;
        const list = loadCatalogGroups();
        const item = list.find(g => g.id === id);
        if (!item) return;
        const name = prompt('Новое название группы:', item.name);
        if (!name || !name.trim()) return;
        item.name = name.trim();
        saveCatalogGroups(list);
        renderCatalogGroups(groupsSearch?.value || '');
      });
    });

      tableBody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = (btn as HTMLElement).closest('tr');
        const id = tr?.getAttribute('data-id');
        if (!id) return;
        if (!confirm('Удалить группу?')) return;
        let list = loadCatalogGroups();
        list = list.filter(g => g.id !== id);
        saveCatalogGroups(list);
        renderCatalogGroups(groupsSearch?.value || '');
      });
    });
    } else {
      console.log('📋 [renderCatalogGroups] Используется admin-section-container, обработчики будут созданы в admin-panel.js');
    }
  }

  function openCatalogGroupsModal() {
    console.log('🚀 [openCatalogGroupsModal] Открываем страницу групп');
    
    // НЕ вызываем hideAllAdminContent здесь - он уже вызван в showCatalogModal() перед вызовом этой функции
    
    // Находим страницу вместо модалки
    const container = document.getElementById('catalog-groups-container') as HTMLDivElement | null;
    const groupsSearchFixed = document.getElementById('catalog-groups-search') as HTMLInputElement | null;
    
    if (!container) {
      console.warn('⚠️ [openCatalogGroupsModal] Страница catalog-groups-container не найдена в DOM');
          return;
        }
    
    console.log('✅ [openCatalogGroupsModal] Страница найдена, показываем');
    
    // Показываем страницу
    container.style.display = 'block';
    
    if (groupsSearchFixed) {
      groupsSearchFixed.value = '';
      groupsSearchFixed.focus();
    }
    
    // Рендерим таблицу
    setTimeout(() => {
    renderCatalogGroups('');
    }, 100);
  }
  
  // Экспортируем функцию в window для вызова из admin-panel.js
  (window as any).openCatalogGroupsModal = openCatalogGroupsModal;


  // Обработчики для модалки "Группы"
  
  if (groupsAdd) {
    groupsAdd.addEventListener('click', () => {
      // Открываем модалку создания новой группы
      const nameInput = prompt('Введите название новой группы:');
      if (nameInput && nameInput.trim()) {
        const allGroups = loadCatalogGroups();
        const newId = `group-${Date.now()}`;
        const newGroup = {
          id: newId,
          name: nameInput.trim(),
          key: nameInput.trim().toLowerCase().replace(/\s+/g, '_')
        };
        allGroups.push(newGroup);
        saveCatalogGroups(allGroups);
        renderCatalogGroups(groupsSearch?.value || '');
        // Функция объявлена ниже внутри wireUI(), но доступна благодаря hoisting
        renderCatalogGroupsFolders();
        console.log('✅ Новая группа создана:', newGroup);
      }
    });
  }
  
  if (groupsSearch) {
    groupsSearch.addEventListener('input', () => {
      renderCatalogGroups(groupsSearch.value);
    });
  }

  // Обработчик для "Группы" уже добавлен выше (с переключением папок)


  typesAdd?.addEventListener('click', () => {
    const name = prompt('Название нового типа элемента:', '');
    if (!name || !name.trim()) return;
    const list = loadCatalogTypes();
    if (list.some(t => t.name.toLowerCase() === name.trim().toLowerCase())) {
      alert('Тип с таким названием уже существует');
      return;
    }
    list.push({ id: 'type-' + generateId(), name: name.trim() });
    saveCatalogTypes(list);
    renderElementTypes(typesSearch?.value || '');
    // ⚠️ ВАЖНО: Используем функцию из window, так как она объявлена внутри wireUI()
    const renderFn = (window as any).renderCatalogTypeFolders;
    if (typeof renderFn === 'function') {
      renderFn();
    }
  });

  typesSearch?.addEventListener('input', () => {
    renderElementTypes(typesSearch.value || '');
  });

  // Инициализируем список папок типов при загрузке UI
  // Функция объявлена выше внутри wireUI() и экспортирована в window на строке 9250
  const renderTypeFoldersFn = (window as any).renderCatalogTypeFolders;
  if (typeof renderTypeFoldersFn === 'function') {
    renderTypeFoldersFn();
  }
  
  // Инициализируем список папок групп
  catalogGroupsFolders = document.getElementById('catalog-groups-folders');
  
  // ⚠️ ВАЖНО: Функция объявлена внутри wireUI(), но используется вне, поэтому экспортируем
  function renderCatalogGroupsFolders() {
    if (!catalogGroupsFolders) {
      console.warn('⚠️ catalog-groups-folders не найден');
      return;
    }
    const groups = loadCatalogGroups();
    console.log('🔧 Загружено групп:', groups.length);
    if (!groups.length) {
      catalogGroupsFolders.innerHTML =
        '<div style="font-size:11px; color:#999; padding:4px 0;">Нет групп</div>';
      return;
    }
    catalogGroupsFolders.innerHTML = groups
      .map(
        g =>
          `<div class="catalog-group-folder" data-id="${g.id}" data-name="${g.name}" style="padding:4px 8px; cursor:pointer; font-size:12px; display:flex; align-items:center; gap:6px;"><span class="icon">📁</span><span>${g.name}</span></div>`
      )
      .join('');
    console.log('✅ Папки групп отрендерены:', groups.length);
  }
  
  // ⭐ ВАЖНО: Экспортируем renderCatalogGroupsFolders сразу после объявления
  (window as any).renderCatalogGroupsFolders = renderCatalogGroupsFolders;
  
  // Переключаем видимость папок типов/групп при клике на пункты меню
  if (catalogMenuItemTypes) {
    catalogMenuItemTypes.addEventListener('click', (e) => {
      e.stopPropagation();
      if (catalogTypesFolders) {
        const isHidden = catalogTypesFolders.style.display === 'none';
        catalogTypesFolders.style.display = isHidden ? 'block' : 'none';
      }
      if (catalogGroupsFolders) {
        catalogGroupsFolders.style.display = 'none';
      }
      if (catalogTypesFolders && catalogTypesFolders.style.display !== 'none') {
        // ⚠️ ВАЖНО: Используем функцию из window, так как она объявлена внутри wireUI()
        const renderFn = (window as any).renderCatalogTypeFolders;
        if (typeof renderFn === 'function') {
          renderFn();
        }
      }
    });
  }
  
  // Инициализируем папки групп при загрузке
  // Функция объявлена выше внутри wireUI(), поэтому доступна напрямую
  renderCatalogGroupsFolders();


  groupsAdd?.addEventListener('click', () => {
    const name = prompt('Название новой группы:', '');
    if (!name || !name.trim()) return;
    const list = loadCatalogGroups();
    if (list.some(g => g.name.toLowerCase() === name.trim().toLowerCase())) {
      alert('Группа с таким названием уже существует');
      return;
    }
    list.push({ id: 'group-' + generateId(), name: name.trim() });
    saveCatalogGroups(list);
    renderCatalogGroups(groupsSearch?.value || '');
  });

  groupsSearch?.addEventListener('input', () => {
    renderCatalogGroups(groupsSearch.value || '');
  });

  // Обработчики кнопок сохранения в модалке редактирования элемента каталога
  const btnCatalogItemEditSave = document.getElementById('btn-catalog-item-edit-save');
  const btnCatalogItemEditSaveExit = document.getElementById('btn-catalog-item-edit-save-exit');
  const btnCatalogItemEditCancel = document.getElementById('btn-catalog-item-edit-cancel');

  function saveCatalogItem(closeAfterSave: boolean = false) {
    // Получаем данные из формы (все поля вкладки "Основные")
    const nameInput = document.getElementById('catalog-item-edit-name') as HTMLInputElement | null;
    const categoryContainer = document.getElementById('catalog-item-edit-category') as HTMLElement | null;
    const elementTypeSelect = document.getElementById('catalog-item-edit-element-type') as HTMLSelectElement | null;
    const cabinetTagSelect = document.getElementById('catalog-item-edit-cabinet-tag') as HTMLSelectElement | null;
    const widthInput = document.getElementById('catalog-item-edit-width') as HTMLInputElement | null;
    const heightInput = document.getElementById('catalog-item-edit-height') as HTMLInputElement | null;
    const depthInput = document.getElementById('catalog-item-edit-depth') as HTMLInputElement | null;
    const showSpecCheckbox = document.getElementById('catalog-item-edit-show-spec') as HTMLInputElement | null;
    const includeNestedCheckbox = document.getElementById('catalog-item-edit-include-nested') as HTMLInputElement | null;
    const showConstructorCheckbox = document.getElementById('catalog-item-edit-show-constructor') as HTMLInputElement | null;
    const orderInput = document.getElementById('catalog-item-edit-order') as HTMLInputElement | null;
    const fillingElementCheckbox = document.getElementById('catalog-item-edit-filling-element') as HTMLInputElement | null;
    const noIntersectionsCheckbox = document.getElementById('catalog-item-edit-no-intersections') as HTMLInputElement | null;
    const dragTypeSelect = document.getElementById('catalog-item-edit-drag-type') as HTMLSelectElement | null;
    const adhesionTypeSelect = document.getElementById('catalog-item-edit-adhesion-type') as HTMLSelectElement | null;
    
    const name = nameInput?.value.trim() || 'Элемент';
    console.log('📝 [saveCatalogItem] Название из формы:', name);
    
    // Категории: сначала из Vue Treeselect (скрытый input), иначе из selectedCategories
    let selectedCategoriesArray: string[] = [];
    const categoryIdsInput = document.getElementById('catalog-item-edit-category-ids') as HTMLInputElement | null;
    if (categoryIdsInput && categoryIdsInput.value) {
      try {
        const parsed = JSON.parse(categoryIdsInput.value || '[]');
        selectedCategoriesArray = Array.isArray(parsed) ? parsed.map((v: unknown) => String(v)) : [];
      } catch { /* fallback below */ }
    }
    if (selectedCategoriesArray.length === 0 && categoryContainer) {
      const checked = categoryContainer.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-category-id]:checked');
      checked.forEach(cb => {
        const v = cb.dataset.categoryId || cb.value;
        if (v) selectedCategoriesArray.push(v);
      });
    }
    if (selectedCategoriesArray.length === 0 && selectedCategories.length > 0) {
      selectedCategoriesArray = selectedCategories.map(id => String(id));
    }
    
    const selectedElementType = elementTypeSelect?.value || '';
    const selectedCabinetTag = cabinetTagSelect?.value || '';
    const showInSpec = showSpecCheckbox?.checked ?? true;
    const includeNested = includeNestedCheckbox?.checked ?? true;
    const showInRoom = showConstructorCheckbox?.checked ?? true;
    const order = orderInput ? parseInt(orderInput.value) || 0 : 0;
    const isFillingElement = fillingElementCheckbox?.checked ?? false;
    const noIntersections = noIntersectionsCheckbox?.checked ?? false;
    const dragType = dragTypeSelect?.value || 'like-bottom';
    const adhesionType = adhesionTypeSelect?.value || 'walls-floor';
    
    // Получаем поля вкладки "Размеры"
    const defaultSizeSelect = document.getElementById('catalog-item-edit-default-size') as HTMLSelectElement | null;
    const hideDefaultSizesCheckbox = document.getElementById('catalog-item-edit-hide-default-sizes') as HTMLInputElement | null;
    const allowCustomSizesCheckbox = document.getElementById('catalog-item-edit-allow-custom-sizes') as HTMLInputElement | null;
    const forbidWidthCheckbox = document.getElementById('catalog-item-edit-forbid-width') as HTMLInputElement | null;
    const forbidHeightCheckbox = document.getElementById('catalog-item-edit-forbid-height') as HTMLInputElement | null;
    const forbidDepthCheckbox = document.getElementById('catalog-item-edit-forbid-depth') as HTMLInputElement | null;
    const minWidthInput = document.getElementById('catalog-item-edit-min-width') as HTMLInputElement | null;
    const maxWidthInput = document.getElementById('catalog-item-edit-max-width') as HTMLInputElement | null;
    const minHeightInput = document.getElementById('catalog-item-edit-min-height') as HTMLInputElement | null;
    const maxHeightInput = document.getElementById('catalog-item-edit-max-height') as HTMLInputElement | null;
    const minDepthInput = document.getElementById('catalog-item-edit-min-depth') as HTMLInputElement | null;
    const maxDepthInput = document.getElementById('catalog-item-edit-max-depth') as HTMLInputElement | null;
    
    const defaultSize = defaultSizeSelect?.value || '';
    const hideDefaultSizes = hideDefaultSizesCheckbox?.checked ?? false;
    const allowCustomSizes = allowCustomSizesCheckbox?.checked ?? true;
    const forbidWidth = forbidWidthCheckbox?.checked ?? false;
    const forbidHeight = forbidHeightCheckbox?.checked ?? false;
    const forbidDepth = forbidDepthCheckbox?.checked ?? false;
    const minWidth = minWidthInput ? parseInt(minWidthInput.value) || 0 : 0;
    const maxWidth = maxWidthInput ? parseInt(maxWidthInput.value) || 0 : 0;
    const minHeight = minHeightInput ? parseInt(minHeightInput.value) || 0 : 0;
    const maxHeight = maxHeightInput ? parseInt(maxHeightInput.value) || 0 : 0;
    const minDepth = minDepthInput ? parseInt(minDepthInput.value) || 0 : 0;
    const maxDepth = maxDepthInput ? parseInt(maxDepthInput.value) || 0 : 0;
    
    // Получаем иконку (base64 или путь)
    const iconContainer = document.getElementById('catalog-item-edit-icon') as HTMLElement | null;
    let iconData: string | undefined = undefined;
    if (iconContainer) {
      const img = iconContainer.querySelector('img') as HTMLImageElement | null;
      if (img && img.src) {
        // Если это base64, сохраняем как есть
        if (img.src.startsWith('data:')) {
          iconData = img.src;
        } else {
          // Если это путь, сохраняем путь
          iconData = img.src;
        }
      }
    }
    
    // Получаем первую категорию для определения каталога (для совместимости)
    let catalogType: string | null = null;
    if (selectedCategoriesArray.length > 0) {
      const mainCat = catalogMainCategories.find(c => c.id === selectedCategoriesArray[0]);
      if (mainCat) {
        catalogType = mainCat.catalogType;
      }
    }
    
    // Получаем ТОЛЬКО корневую секцию (родительскую, parent === null) - это и есть модуль для комнаты
    const rootSection = sceneNodes.find(n => n.type === 'section' && n.parent === null);
    if (!rootSection) {
      alert('Создайте секцию с деталями в конструкторе');
      return;
    }
    
    // Сохраняем element_type и cabinet_tag в metadata корневой секции (как в референсе)
    if (!rootSection.metadata) {
      rootSection.metadata = {};
    }
    if (selectedElementType) {
      rootSection.metadata.element_type = selectedElementType;
      console.log('📋 Сохранен element_type:', selectedElementType);
    }
    if (selectedCabinetTag) {
      rootSection.metadata.cabinet_tag = selectedCabinetTag;
      console.log('📋 Сохранен cabinet_tag:', selectedCabinetTag);
    }
    
    console.log('📦 Экспорт корневой секции (модуля):', {
      name: rootSection.name,
      id: rootSection.id,
      childrenCount: rootSection.children.length,
      isRoot: rootSection.parent === null,
      element_type: rootSection.metadata.element_type,
      cabinet_tag: rootSection.metadata.cabinet_tag
    });
    
    // Экспортируем ТОЛЬКО корневую секцию в Clodis JSON (рекурсивно со всеми вложенными секциями и деталями)
    function exportSectionToClodisJSON(sectionNode: SceneNode): ClodisItem {
      const sectionSize = getNodeSize(sectionNode);
      if (!sectionSize) {
        throw new Error('Не удалось получить размеры секции');
      }
      
      // ⭐ ВАЖНО: В референсе секция использует ВЫРАЖЕНИЯ для size, а не абсолютные значения!
      // Референс: "size": { "x": "s:x", "y": "s:y", "z": "s:z" }
      // Это позволяет секции масштабироваться в зависимости от параметров
      // ⭐ ВАЖНО: Создаем полную структуру как в референсе (со всеми полями из JSON редактора)
      const clodisItem: ClodisItem = {
        type: 'section',
        name: sectionNode.name,
        id: sectionNode.id || '',
        lib: '',
        tags: '',
        interactive: 0,
        size: {
          x: 's:x', // ⭐ ВЫРАЖЕНИЕ, а не число!
          y: 's:y',
          z: 's:z'
        },
        pos: { x: 0, y: 0, z: 0 },
        pivot: { x: -1, y: -1, z: -1 },
        scale: { x: 1, y: 1, z: 1 },
        rot: { x: 0, y: 0, z: 0 },
        c_rot: { x: 0, y: 0, z: 0 },
        children: [],
        custom: {},
        condition: null,
        visible: 1,
        helpers_visible: 0,
        active: 1,
        variables: {
          visible: 1,
          main: {}
        },
        interaction: {
          auto_rotation: 1,
          check_intersection: 0,
          raycast: 1
        },
        resizable: {
          enabled: 0,
          locks: {},
          minmax: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 }
          }
        },
        events: {
          on_before_params: '',
          on_before_build: '',
          on_after_build: '',
          on_drag_end: ''
        },
        accessories: [],
        comments: '',
        section_key: '',
        params_key: '',
        // ⭐ ВАЖНО: В референсе spec для секции - это всегда пустой объект {}
        // spec используется только для деталей (wall, facade, module)
        // element_type и cabinet_tag хранятся в metadata секции, но НЕ в spec (это подтверждает референс)
        spec: {}
      };
      
      // ⭐ РЕФЕРЕНС: Используем metadata.childrenData вместо sectionNode.children (декларативный подход)
      const childrenData = sectionNode.metadata?.childrenData || [];
      const childNodes = sectionNode.children || [];
      
      console.log('📦 Экспорт секции:', {
        name: sectionNode.name,
        childrenDataCount: childrenData.length,
        childNodesCount: childNodes.length,
        childrenData: childrenData.map((cd: any) => ({ id: cd.id, detailTypeId: cd.detailTypeId, name: cd.name }))
      });
      
      // ⭐ РЕФЕРЕНС: Экспортируем детали из metadata.childrenData (JSON структура)
      // Детали создаются из JSON, поэтому экспортируем JSON структуру
      childrenData.forEach((childData: any) => {
        // Ищем тип детали по ID
        const detailType = detailTypes.find(dt => dt.id === childData.detailTypeId);
        if (!detailType) {
          console.warn('⚠️ [exportSectionToClodisJSON] Тип детали не найден:', childData.detailTypeId);
          return;
        }
        
        // Находим соответствующий узел для получения актуальных размеров/позиции (если есть)
        const childNode = childNodes.find(c => c.id === childData.id && c.type === 'detail');
        
        // Используем данные из JSON для экспорта
        const actualDetailSize = childNode ? getNodeSize(childNode) : null;
        const actualDetailPos = childNode ? childNode.group.position : { x: 0, y: 0, z: 0 };
        const anchors = childNode?.metadata?.anchors || { x: 'min', y: 'min', z: 'min' };
        const detailSize: ClodisExpression =
          childData.size ?? detailType.expressions?.size ?? { x: 's:x', y: 's:y', z: 's:z' };
        const detailPos: ClodisExpression =
          childData.pos ?? detailType.expressions?.pos ?? { x: 0, y: 0, z: 0 };
        
        // Конвертируем размеры и позицию в миллиметры
          const detailSizeMM = {
          x: actualDetailSize ? Math.round(actualDetailSize.x * 1000) : 0,
          y: actualDetailSize ? Math.round(actualDetailSize.y * 1000) : 0,
          z: actualDetailSize ? Math.round(actualDetailSize.z * 1000) : 0
          };
          
          const detailPosMM = {
            x: Math.round(actualDetailPos.x * 1000),
            y: Math.round(actualDetailPos.y * 1000),
            z: Math.round(actualDetailPos.z * 1000)
          };
          
        // ⚠️ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Для vertical_left pivot ВСЕГДА {x:-1, y:-1, z:-1} (референс)
        // Референс: main_core_v2_part19_deobfuscated.js:3636-3640 - для ВСЕХ деталей типа 'wall' pivot = {x:-1, y:-1, z:-1}
        let pivot: { x: ClodisPivot; y: ClodisPivot; z: ClodisPivot };
        
        // Для vertical_left ВСЕГДА используем правильный pivot, игнорируя childData.pivot
        if (detailType.position === 'vertical-left') {
          pivot = { x: -1, y: -1, z: -1 };
        } else {
          // Для других типов используем из childData или fallback
          pivot = (childData.pivot && typeof childData.pivot === 'object')
            ? {
                x: (childData.pivot.x ?? -1) as ClodisPivot,
                y: (childData.pivot.y ?? -1) as ClodisPivot,
                z: (childData.pivot.z ?? -1) as ClodisPivot,
              }
            : {
            x: anchors.x === 'min' ? -1 : (anchors.x === 'max' ? 1 : 0),
            y: anchors.y === 'min' ? -1 : (anchors.y === 'max' ? 1 : 0),
                z: anchors.z === 'min' ? -1 : (anchors.z === 'center' ? 0 : 1),
              };
        }
          
        let detailTypePP: 'wall' | 'facade' | 'module' = 'wall';
        
        // Если pivot не задан в childrenData (и не vertical_left), уточняем по position как в референсе
        if (!childData.pivot && detailType.position !== 'vertical-left') {
          if (detailType.position === 'front-front') {
            pivot = { x: -1, y: -1, z: 1 };
          } else if (detailType.position === 'front-middle') {
            pivot = { x: -1, y: -1, z: 0 };
          } else if (detailType.position === 'vertical-left') {
            // ⭐ РЕФЕРЕНС: Нижняя левая дальняя точка детали (bottom-left-far)
            // Реф.: main_core_v2_part — default pivot для деталей
            // Для вертикальной левой: x=-1 (левый край), y=-1 (низ), z=-1 (дальний край)
            pivot = { x: -1, y: -1, z: -1 };
          } else if (detailType.position === 'vertical-right') {
            // vertical-right: pivot {1,-1,-1}
            pivot = { x: 1, y: -1, z: -1 };
          } else if (detailType.position === 'vertical-middle') {
            pivot = { x: 0, y: -1, z: -1 };
          } else if (detailType.position === 'horizontal-top') {
            pivot = { x: -1, y: 1, z: -1 };
          } else if (detailType.position === 'horizontal-bottom') {
            pivot = { x: -1, y: -1, z: -1 };
          } else if (detailType.position === 'horizontal-middle') {
            pivot = { x: -1, y: 0, z: -1 };
          }
        }
        
        // Материал
        const materialId = childData.materialId || 'ldsp16';
        const material = detailMaterials[materialId] || detailMaterials.ldsp16;
        
        // Создаем Clodis деталь
          const specOrientation: 'v' | 'h' | 'f' =
            (childData.spec?.orientation && ['v', 'h', 'f'].includes(childData.spec.orientation))
              ? childData.spec.orientation
              : (detailType.position === 'front-front' || detailType.position === 'front-middle')
                ? 'f'
                : (detailType.orientation === 'vertical' ? 'v' : 'h');

          const detailRot = (childData.rot && typeof childData.rot === 'object')
            ? childData.rot
            : (specOrientation === 'v' ? { z: 90 } : { x: 0, y: 0, z: 0 });

          const detailItem: ClodisItem = {
          type: detailTypePP,
          name: childData.name || detailType.name,
          id: childData.id || '',
            lib: '',
            tags: '',
            interactive: 0,
            size: detailSize,
            pos: detailPos,
            pivot: pivot,
            scale: { x: 1, y: 1, z: 1 },
            rot: detailRot,
            c_rot: { x: 0, y: 0, z: 0 },
          children: [],
            custom: {},
            condition: null,
            visible: 1,
            helpers_visible: 0,
            active: 1,
          variables: { visible: 1, main: {} },
          interaction: { auto_rotation: 1, check_intersection: 0, raycast: 1 },
          resizable: { enabled: 0, locks: {}, minmax: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } } },
          events: { on_before_params: '', on_before_build: '', on_after_build: '', on_drag_end: '' },
            accessories: [],
            comments: '',
            section_key: '',
          params_key: '',
          spec: {
            orientation: specOrientation,
            group: 'g0',
            type: 'wall',
            key: materialId === 'ldsp16' ? 'ldsp' : (materialId === 'lhdf3' ? 'lhdf' : 'ldsp'),
            material: {
              id: materialId,
              name: material.name,
              thickness: material.thickness * 1000
            }
          }
          };
          
          clodisItem.children?.push(detailItem);
        console.log('  ✅ Экспортирована деталь из JSON:', childData.name || detailType.name);
      });
      
      // ⭐ РЕФЕРЕНС: Рекурсивно экспортируем только вложенные секции из childNodes
      // Детали уже экспортированы из metadata.childrenData выше
      childNodes.forEach(child => {
        if (child.type === 'section') {
          // Экспортируем вложенную секцию рекурсивно
          console.log('  📦 Экспортируем вложенную секцию:', child.name);
          const nestedSection = exportSectionToClodisJSON(child);
          clodisItem.children?.push(nestedSection);
          console.log('    ✅ Вложенная секция экспортирована:', nestedSection.name, 'детали:', nestedSection.children?.length || 0);
        }
        // ⭐ УДАЛЕНО: Экспорт деталей из children - детали теперь экспортируются из metadata.childrenData
        // Старый код удален, так как детали создаются из JSON через _build_children()
      });
      
      console.log('📦 Экспорт секции завершен:', {
        name: clodisItem.name,
        size: clodisItem.size,
        childrenCount: clodisItem.children?.length || 0,
        childrenTypes: clodisItem.children?.map(c => c.type) || [],
        childrenDetails: clodisItem.children?.map(c => ({ 
          type: c.type, 
          name: c.name, 
          size: c.size,
          pos: c.pos,
          pivot: c.pivot,
          orientation: c.spec?.orientation
        })) || []
      });
      
      // Детальное логирование для отладки
      if (clodisItem.children && clodisItem.children.length > 0) {
        clodisItem.children.forEach((child, index) => {
          console.log(`  📋 Деталь ${index + 1}:`, {
            type: child.type,
            name: child.name,
            size: child.size,
            pos: child.pos,
            pivot: child.pivot,
            spec: child.spec
          });
        });
      }
      
      // Проверяем, что есть хотя бы одна деталь
      if (!clodisItem.children || clodisItem.children.length === 0) {
        console.warn('⚠️ ВНИМАНИЕ: Секция экспортирована БЕЗ ДЕТАЛЕЙ! Мебель будет видна только как маркер.');
        console.warn('  Проверьте, что в секции есть детали с правильными метаданными.');
      }
      
      return clodisItem;
    }
    
    // ⭐ ВАЖНО: Экспортируем функцию для использования из HTML (после определения)
    (window as any).exportSectionToClodisJSON = exportSectionToClodisJSON;
    
    try {
      // ⭐ ВАЖНО: Проверяем JSON из textarea - это источник истины при сохранении
      // Если пользователь изменил JSON в табе, используем его, а не сохраненный
      const jsonEditor = document.getElementById('catalog-json-editor') as HTMLTextAreaElement | null;
      let clodisJSONArray: ClodisItem[];
      
      // Сначала пробуем взять JSON из textarea (если он заполнен)
      if (jsonEditor && jsonEditor.value.trim()) {
        try {
          const jsonText = jsonEditor.value.trim();
          const parsed = JSON.parse(jsonText) as ClodisJSON;
          clodisJSONArray = Array.isArray(parsed) ? parsed : [parsed];
          console.log('✅ [saveCatalogItem] Используем JSON из textarea (источник истины):', {
            length: clodisJSONArray.length,
            first: clodisJSONArray[0]
          });
        } catch (e) {
          console.warn('⚠️ [saveCatalogItem] Ошибка парсинга JSON из textarea, используем сохраненный:', e);
          // Если JSON в textarea некорректный, используем сохраненный
          const isEditingExisting = !!currentEditingCatalogElement && !!currentEditingCatalogElement?.clodisJSON && Array.isArray(currentEditingCatalogElement.clodisJSON);
          if (isEditingExisting) {
            clodisJSONArray = (currentEditingCatalogElement!.clodisJSON || []) as ClodisItem[];
            console.log('🔁 [saveCatalogItem] Используем сохраненный clodisJSON (textarea некорректен):', {
              length: clodisJSONArray.length
            });
          } else {
            // Если нет сохраненного и textarea некорректен - экспортируем из сцены
            const clodisJSON = exportSectionToClodisJSON(rootSection);
            clodisJSONArray = Array.isArray(clodisJSON) ? clodisJSON : [clodisJSON];
            console.log('📦 [saveCatalogItem] Экспортируем JSON из сцены (textarea некорректен, сохраненного нет)');
          }
        }
      } else {
        // Если textarea пустой, используем сохраненный JSON (если редактируем) или экспортируем из сцены
        const isEditingExisting = !!currentEditingCatalogElement && !!currentEditingCatalogElement?.clodisJSON && Array.isArray(currentEditingCatalogElement.clodisJSON);
        
        if (isEditingExisting) {
          // ⭐ ВАЖНО: если редактируем существующий модуль с уже сохранённым планплейс‑JSON,
          // НЕ пересобираем JSON из текущей сцены (которая может быть урезанной),
          // а используем исходный полный JSON, как в Clodis.
          clodisJSONArray = (currentEditingCatalogElement!.clodisJSON || []) as ClodisItem[];
          console.log('🔁 [saveCatalogItem] Используем исходный clodisJSON из каталога (textarea пуст):', {
            length: clodisJSONArray.length,
            first: clodisJSONArray[0]
          });
        } else {
      const clodisJSON = exportSectionToClodisJSON(rootSection);
      
      // Clodis JSON должен быть массивом: [{ "type": "section", ... }]
      // Оборачиваем объект в массив если это необходимо
          clodisJSONArray = Array.isArray(clodisJSON) ? clodisJSON : [clodisJSON];
      
          // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ЭКСПОРТА (только для новых модулей)
      console.log('🔍🔍🔍 ДЕТАЛЬНЫЙ ЭКСПОРТ JSON 🔍🔍🔍');
      console.log('📦 Экспортированный JSON (массив):', clodisJSONArray);
      console.log('📦 Количество секций в массиве:', clodisJSONArray.length);
      
      if (clodisJSONArray.length > 0 && clodisJSONArray[0]) {
        const firstSection = clodisJSONArray[0];
        console.log('📦 Первая секция:', {
          type: firstSection.type,
          name: firstSection.name,
          hasChildren: !!firstSection.children,
          childrenCount: firstSection.children?.length || 0
        });
        
        if (firstSection.children && firstSection.children.length > 0) {
          console.log('📦 ДЕТАЛИ В СЕКЦИИ:');
          firstSection.children.forEach((child, index) => {
            console.log(`  [${index + 1}] ${child.type} "${child.name}":`, {
              type: child.type,
              name: child.name,
              size: child.size,
              pos: child.pos,
              pivot: child.pivot,
              hasSpec: !!child.spec,
              spec: child.spec ? {
                orientation: child.spec.orientation,
                group: child.spec.group,
                type: child.spec.type,
                key: child.spec.key,
                hasMaterial: !!child.spec.material
              } : null
            });
          });
        } else {
          console.error('❌ В СЕКЦИИ НЕТ ДЕТАЛЕЙ!');
            }
          }
        }
      }
      
      console.log('📦 ПОЛНЫЙ JSON (для копирования):', JSON.stringify(clodisJSONArray, null, 2));
      
      // Сохраняем элемент в каталог (elementCatalog) для отображения в списке модулей
      // Используем async/await для правильной последовательности
      const isEditing = !!currentEditingCatalogElement;
      const elementId = isEditing && currentEditingCatalogElement
        ? currentEditingCatalogElement.id
        : (rootSection.id || `element-${Date.now()}`);
      
      // Экспортируем GLB для каталога (как в референсе - сохраняется как base64)
      new Promise<string>((resolve, reject) => {
        const exporter = new GLTFExporter();
        exporter.parse(
          rootSection.group,
          (glb: ArrayBuffer) => {
            const blob = new Blob([glb], { type: 'application/octet-stream' });
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          },
          (error) => {
            reject(error);
          }
        );
      }).then(async (base64: string) => {
        // Создаем CatalogElement (как в референсе)
        const allCatalogElements = loadAllCatalogElements();
        const catalogElement: CatalogElement = {
          id: elementId,
          name: name,
          type: 'section',
          elementType: 'section',
          metadata: {
            name: name,
            type: 'section',
            size: {
              width: clodisJSONArray[0]?.size?.x ? clodisJSONArray[0].size.x / 1000 : 0,
              height: clodisJSONArray[0]?.size?.y ? clodisJSONArray[0].size.y / 1000 : 0,
              depth: clodisJSONArray[0]?.size?.z ? clodisJSONArray[0].size.z / 1000 : 0
            },
            createdAt: new Date().toISOString(),
            element_type: selectedElementType || undefined, // key из catalogTypes (как в референсе)
            cabinet_tag: selectedCabinetTag || undefined,    // key из catalogGroups (как в референсе)
            category: selectedCategoriesArray.length > 0 ? selectedCategoriesArray : undefined, // Массив категорий (как в референсе)
            icon: iconData || undefined,
            show_in_spec: showInSpec,
            include_nested: includeNested,
            show_in_constructor: showInRoom,
            order: order,
            filling_element: isFillingElement,
            no_intersections: noIntersections,
            drag_type: dragType,
            adhesion_type: adhesionType,
            // Поля вкладки "Размеры"
            default_size: defaultSize || undefined,
            hide_default_sizes: hideDefaultSizes,
            allow_custom_sizes: allowCustomSizes,
            forbid_width: forbidWidth,
            forbid_height: forbidHeight,
            forbid_depth: forbidDepth,
            size_limits: {
              min_width: minWidth || undefined,
              max_width: maxWidth || undefined,
              min_height: minHeight || undefined,
              max_height: maxHeight || undefined,
              min_depth: minDepth || undefined,
              max_depth: maxDepth || undefined
            },
            size_variants: sizeVariants.length > 0 ? sizeVariants : undefined
          },
          glb: base64,
          groupId: selectedCabinetTag || undefined,
          clodisJSON: clodisJSONArray // ⭐ ВАЖНО: Сохраняем Clodis JSON (как в референсе - data поле)
        };
        
        console.log('💾 [saveCatalogItem] Создан CatalogElement:', {
          id: catalogElement.id,
          name: catalogElement.name,
          element_type: catalogElement.metadata.element_type,
          cabinet_tag: catalogElement.metadata.cabinet_tag,
          hasClodisJSON: !!catalogElement.clodisJSON,
          clodisJSONLength: catalogElement.clodisJSON?.length || 0
        });
        
        // Обновляем или добавляем элемент в каталог
        const existingIndex = allCatalogElements.findIndex(el => el.id === elementId);
        if (existingIndex >= 0) {
          allCatalogElements[existingIndex] = catalogElement;
          console.log('💾 [saveCatalogItem] Обновлен элемент в каталоге:', elementId, 'element_type:', selectedElementType, 'cabinet_tag:', selectedCabinetTag);
        } else {
          allCatalogElements.push(catalogElement);
          console.log('💾 [saveCatalogItem] Добавлен элемент в каталог:', elementId, 'element_type:', selectedElementType, 'cabinet_tag:', selectedCabinetTag);
        }
        
            saveAllCatalogElements(allCatalogElements);
            console.log('✅ [saveCatalogItem] Каталог обновлен, всего элементов:', allCatalogElements.length);
            
            // ⭐ Сохраняем JSON на сервер (как в Clodis - через FormData)
            try {
              const saveResult = await catalogAPI.saveModuleJSONClodisStyle(
                name, 
                clodisJSONArray, 
                elementId,
                {
                  element_type: selectedElementType,
                  cabinet_tag: selectedCabinetTag,
                  category: selectedCategoriesArray.length > 0 ? selectedCategoriesArray : [],
                  icon: iconData || undefined,
                  size: {
                    width: clodisJSONArray[0]?.size?.x ? clodisJSONArray[0].size.x / 1000 : 0,
                    height: clodisJSONArray[0]?.size?.y ? clodisJSONArray[0].size.y / 1000 : 0,
                    depth: clodisJSONArray[0]?.size?.z ? clodisJSONArray[0].size.z / 1000 : 0
                  },
                  show_in_spec: showInSpec,
                  include_nested: includeNested,
                  show_in_constructor: showInRoom,
                  order: order,
                  filling_element: isFillingElement,
                  no_intersections: noIntersections,
                  drag_type: dragType,
                  adhesion_type: adhesionType,
                  default_size: defaultSize || undefined,
                  hide_default_sizes: hideDefaultSizes,
                  allow_custom_sizes: allowCustomSizes,
                  forbid_width: forbidWidth,
                  forbid_height: forbidHeight,
                  forbid_depth: forbidDepth,
                  size_limits: {
                    min_width: minWidth || undefined,
                    max_width: maxWidth || undefined,
                    min_height: minHeight || undefined,
                    max_height: maxHeight || undefined,
                    min_depth: minDepth || undefined,
                    max_depth: maxDepth || undefined
                  },
                  size_variants: sizeVariants.length > 0 ? sizeVariants : undefined
                }
              );
              if (saveResult.result === 'success') {
                console.log('✅ [saveCatalogItem] JSON сохранен на сервер (как в Clodis):', saveResult.filePath);
                // Обновляем elementId если это новый модуль
                if (elementId === '0' || !elementId || elementId.startsWith('element-')) {
                  const newElementId = saveResult.id;
                  catalogElement.id = newElementId;
                  // Обновляем в каталоге
                  const updatedIndex = allCatalogElements.findIndex(el => el.id === elementId);
                  if (updatedIndex >= 0) {
                    allCatalogElements[updatedIndex] = catalogElement;
                    saveAllCatalogElements(allCatalogElements);
                  }
                }
              } else {
                console.warn('⚠️ [saveCatalogItem] Не удалось сохранить JSON на сервер:', saveResult.error);
                // Если сервер недоступен, сохраняем локально
                const jsonString = JSON.stringify(clodisJSONArray, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const safeName = name.replace(/[^a-zа-яё0-9]/gi, '_').toLowerCase();
                link.download = `${safeName}_${elementId}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('✅ [saveCatalogItem] JSON сохранен локально (сервер недоступен):', link.download);
              }
            } catch (error) {
              console.warn('⚠️ [saveCatalogItem] Ошибка сохранения JSON:', error);
              // Пробуем сохранить локально как fallback
              try {
                const jsonString = JSON.stringify(clodisJSONArray, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const safeName = name.replace(/[^a-zа-яё0-9]/gi, '_').toLowerCase();
                link.download = `${safeName}_${elementId}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('✅ [saveCatalogItem] JSON сохранен локально (fallback):', link.download);
              } catch (fallbackError) {
                console.error('❌ [saveCatalogItem] Не удалось сохранить JSON даже локально:', fallbackError);
              }
            }
            
            // Обновляем список элементов типа, если он открыт
            if (currentTypeItemsId) {
              setTimeout(() => {
                console.log('🔄 [saveCatalogItem] Обновляем список элементов типа после сохранения');
                renderTypeItemsTable();
                renderTypeItemsPagination();
              }, 200); // Увеличиваем задержку для гарантии сохранения
            }
      }).catch((error) => {
        console.error('❌ Ошибка экспорта GLB для каталога:', error);
        // Продолжаем сохранение даже если GLB не экспортирован
        alert('Предупреждение: Не удалось экспортировать 3D модель, но элемент сохранен');
      });
      
      // ⭐ ВАЖНО: НЕ сохраняем в старый формат catalog_${catalogType}, чтобы избежать дубликатов
      // Все элементы теперь хранятся только в elementCatalog с правильным element_type
      
      console.log('✅ [saveCatalogItem] Элемент сохранен в каталог:', name, 'element_type:', selectedElementType);
      
      // Показываем уведомление об успешном сохранении
      alert(`Элемент "${name}" сохранен в каталог!`);
      
      // Обновляем меню в комнате, если оно открыто
      if (typeof window !== 'undefined' && (window as any).buildRoomMenu) {
        (window as any).buildRoomMenu();
      }
      
      if (closeAfterSave) {
        // Закрываем модалку
        closeCatalogItemEditModal();

        // 🔁 После сохранения и выхода возвращаемся на список элементов типа,
        // как в референсе: открываем страницу type-elements для текущего типа
        if (currentTypeItemsId && typeof (window as any).openTypeItemsModal === 'function') {
          try {
            // Пытаемся найти название типа по currentTypeItemsId
            let typeNameForList: string | undefined;
            const typeFromList = (window as any).catalogTypes?.find?.((t: any) => t.id === currentTypeItemsId);
            if (typeFromList && typeFromList.name) {
              typeNameForList = typeFromList.name;
            }

            console.log('🔄 [saveCatalogItem] Открываем список элементов типа после \"Сохранить и выйти\"', {
              currentTypeItemsId,
              typeNameForList
            });

            (window as any).openTypeItemsModal(currentTypeItemsId, typeNameForList || '');
          } catch (e) {
            console.error('❌ [saveCatalogItem] Ошибка при возврате к списку элементов типа:', e);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения элемента:', error);
      alert('Ошибка сохранения: ' + (error as Error).message);
    }
  }

  btnCatalogItemEditSave?.addEventListener('click', () => {
    saveCatalogItem(false);
  });

  btnCatalogItemEditSaveExit?.addEventListener('click', () => {
    saveCatalogItem(true);
  });

  btnCatalogItemEditCancel?.addEventListener('click', () => {
    closeCatalogItemEditModal();
  });

  // Переключатели точки отсчёта детали
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('anchor-btn')) {
      const axis = target.dataset.axis as 'x' | 'y' | 'z';
      const anchor = target.dataset.anchor as Anchor;
      if (axis && anchor && currentSelectedNode?.type === 'detail') {
        setAnchorSelection(axis, anchor);
        updateDetailAxes();
      }
    }
  });
  
  // Управление анимациями
  const btnStopAnimations = document.getElementById('btn-stop-animations');
  btnStopAnimations?.addEventListener('click', () => stopAllAnimations());
  
  // Тестовая анимация вращения
  const btnTestRotation = document.getElementById('btn-test-rotation');
  btnTestRotation?.addEventListener('click', () => {
    if (!currentSelectedNode) {
      alert('Выберите модель для тестирования анимации');
      return;
    }
    
    testRotationActive = !testRotationActive;
    const btn = btnTestRotation as HTMLButtonElement;
    if (btn) {
      btn.textContent = testRotationActive ? 'Остановить вращение' : 'Вращение модели';
    }
    
    if (testRotationActive) {
      console.log('🔄 Тестовая анимация вращения запущена');
    } else {
      console.log('⏹️ Тестовая анимация вращения остановлена');
    }
  });
  
  // Клик по иерархии для выбора узла
  const hierarchyList = document.getElementById('hierarchy-list');
  hierarchyList?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest('.hier-item');
    if (!item) return;
    
    const nodeId = item.dataset.nodeId;
    if (nodeId) {
      const node = sceneNodes.find(n => n.id === nodeId);
      if (node) {
        selectNode(node);
      }
    }
  });

  // Инициализация списка типов модулей
  updateModuleTypesSelect();
  
  // Обработчик кнопки управления типами модулей
  const btnManageModuleTypes = document.getElementById('btn-manage-module-types');
  btnManageModuleTypes?.addEventListener('click', () => {
    openModuleTypesModal();
  });

  const createBtn = document.getElementById('btn-create');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const btnConfirmModal = document.getElementById('btn-confirm-modal');

  const inpName = document.getElementById('inp-name') as HTMLInputElement | null;
  const inpArticle = document.getElementById('inp-article') as HTMLInputElement | null;
  const inpType = document.getElementById('inp-type') as HTMLSelectElement | null;
  const inpW = document.getElementById('inp-width') as HTMLInputElement | null;
  const inpH = document.getElementById('inp-height') as HTMLInputElement | null;
  const inpD = document.getElementById('inp-depth') as HTMLInputElement | null;
  const inpGrid = document.getElementById('inp-grid') as HTMLInputElement | null;

  function openModal() {
    if (modalBackdrop) {
      // Обновляем список типов при открытии модалки
      updateModuleTypesSelect();
      modalBackdrop.style.display = 'flex';
    }
  }
  function closeModal() {
    if (modalBackdrop) modalBackdrop.style.display = 'none';
  }
  function parseNumber(input: HTMLInputElement | null, fallback: number) {
    if (!input) return fallback;
    const v = Number(input.value);
    // В CAD системах нулевые размеры допустимы (плоские объекты)
    // Разрешаем неотрицательные значения (>= 0)
    if (Number.isFinite(v) && v >= 0) return v;
    return fallback;
  }
  function handleCreate() {
    const payload: Partial<CreateParams> = {
      name: inpName?.value || defaultCreateParams.name,
      article: inpArticle?.value || '',
      type: (inpType?.value as CreateParams['type']) || 'box',
      width: parseNumber(inpW, defaultCreateParams.width),
      height: parseNumber(inpH, defaultCreateParams.height),
      depth: parseNumber(inpD, defaultCreateParams.depth),
      gridStep: parseNumber(inpGrid, defaultCreateParams.gridStep),
    };
    updateGridStep(payload.gridStep || defaultCreateParams.gridStep);
    if (payload.type === 'shelf') {
      addShelf(payload);
    } else {
      addBox(payload);
    }
    closeModal();
  }

  createBtn?.addEventListener('click', openModal);
  btnCancelModal?.addEventListener('click', closeModal);
  modalBackdrop?.addEventListener('click', e => {
    if (e.target === modalBackdrop) closeModal();
  });
  btnConfirmModal?.addEventListener('click', handleCreate);

  const delBtn = document.getElementById('btn-delete');
  delBtn?.addEventListener('click', deleteSelected);

  const resetBtn = document.getElementById('btn-reset');
  resetBtn?.addEventListener('click', resetView);

  const edgeFront = document.getElementById('edge-front') as HTMLInputElement | null;
  const edgeBack = document.getElementById('edge-back') as HTMLInputElement | null;
  const edgeLeft = document.getElementById('edge-left') as HTMLInputElement | null;
  const edgeRight = document.getElementById('edge-right') as HTMLInputElement | null;

  edgeFront?.addEventListener('change', e => {
    updateEdgeFlags({ front: (e.target as HTMLInputElement).checked });
  });
  edgeBack?.addEventListener('change', e => {
    updateEdgeFlags({ back: (e.target as HTMLInputElement).checked });
  });
  edgeLeft?.addEventListener('change', e => {
    updateEdgeFlags({ left: (e.target as HTMLInputElement).checked });
  });
  edgeRight?.addEventListener('change', e => {
    updateEdgeFlags({ right: (e.target as HTMLInputElement).checked });
  });

  renderDecorList();
  renderEdgeList();
  renderHierarchy();
  renderCatalog(); // Инициализируем каталог
  updateGridStep(defaultCreateParams.gridStep);
  
  // Обработчик кнопки "Добавить" в панели свойств конструктора
  const addButton = document.getElementById('catalog-constructor-property-add');
  if (addButton) {
    addButton.addEventListener('click', () => {
      // Открываем модальное окно выбора типа детали для текущей секции
      if ((window as any).openDetailModalForCurrentSection) {
        (window as any).openDetailModalForCurrentSection();
      } else {
        console.error('openDetailModalForCurrentSection не найдена');
        alert('Функция открытия модального окна не найдена');
      }
    });
  }
  
  // ⭐ ИСПРАВЛЕНО ПО РЕФЕРЕНСУ: Обработчики кликов для кнопок "Точка отсчета" (pivot) - теперь работают с числовыми значениями -1/0/1
  // Используем делегирование событий для динамически создаваемых кнопок
  const propertiesPanel = document.getElementById('constructor-properties-panel');
  if (propertiesPanel) {
    propertiesPanel.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('anchor-btn') && target.hasAttribute('data-axis') && target.hasAttribute('data-value')) {
        const axis = target.getAttribute('data-axis') as 'x' | 'y' | 'z';
        const valueStr = target.getAttribute('data-value');
        // ⭐ ИСПРАВЛЕНО: Конвертируем строку в число для pivot (-1, 0, 1)
        const pivotValue = valueStr ? parseInt(valueStr, 10) : 0;
        
        // Проверяем, что значение валидное (-1, 0, 1)
        if (pivotValue !== -1 && pivotValue !== 0 && pivotValue !== 1) {
          console.warn('⚠️ Некорректное значение pivot:', pivotValue);
          return;
        }
        
        if (!currentSelectedNode) {
          console.warn('⚠️ Нет выбранного узла');
          return;
        }
        
        // ⭐ ИСПРАВЛЕНО: Используем updateNodePivot вместо прямого изменения anchors
        if (typeof (window as any).updateNodePivot === 'function') {
          (window as any).updateNodePivot(currentSelectedNode.id, axis, pivotValue as ClodisPivot);
        } else {
          console.error('❌ updateNodePivot не найдена');
        }
      }
    });
  }
  
  // ⭐ ДОБАВЛЕНО: Обработчик для select ориентации
  const orientationSelect = document.getElementById('catalog-constructor-property-orientation') as HTMLSelectElement | null;
  if (orientationSelect) {
    orientationSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const value = target.value as 'v' | 'h' | 'f';
      
      if (!currentSelectedNode) return;
      
      // Обновляем ориентацию через updateNodeProperty
      if (typeof (window as any).updateNodeProperty === 'function') {
        (window as any).updateNodeProperty(currentSelectedNode.id, 'orientation', value);
      }
    });
  }
  
  // ⭐ ДОБАВЛЕНО: Обработчики для input позиции (X, Y, Z)
  const posXInput = document.getElementById('catalog-constructor-property-pos-x') as HTMLInputElement | null;
  const posYInput = document.getElementById('catalog-constructor-property-pos-y') as HTMLInputElement | null;
  const posZInput = document.getElementById('catalog-constructor-property-pos-z') as HTMLInputElement | null;
  
  if (posXInput) {
    posXInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (!currentSelectedNode) return;
      if (typeof (window as any).updateNodePosition === 'function') {
        (window as any).updateNodePosition(currentSelectedNode.id, 'x', target.value);
      }
    });
  }
  
  if (posYInput) {
    posYInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (!currentSelectedNode) return;
      if (typeof (window as any).updateNodePosition === 'function') {
        (window as any).updateNodePosition(currentSelectedNode.id, 'y', target.value);
      }
    });
  }
  
  if (posZInput) {
    posZInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (!currentSelectedNode) return;
      if (typeof (window as any).updateNodePosition === 'function') {
        (window as any).updateNodePosition(currentSelectedNode.id, 'z', target.value);
      }
    });
  }
  
  // ⭐ ИСПРАВЛЕНО: sizeXInput, sizeYInput, sizeZInput уже объявлены на строках 7277-7279
  // Добавляем дополнительные обработчики для деталей (change событие работает и для деталей)
  // Основные обработчики уже добавлены выше (blur и keypress для секций)
  
} // ⚠️ ЗАКРЫТИЕ wireUI() - дальше идут функции вне wireUI()

/**
 * Обновляет свойство узла и синхронизирует с 3D моделью и Clodis JSON
 */
(window as any).updateNodeProperty = function(nodeId: string, property: string, value: any) {
  console.log('🔄 [updateNodeProperty] Обновление свойства:', { nodeId, property, value });
  
  // Находим узел
  const node = sceneNodes.find(n => n.id === nodeId);
  if (!node) {
    console.warn('⚠️ Узел не найден:', nodeId);
    return;
  }
  
  // Обновляем свойство в узле
  if (property === 'name') {
    node.name = value;
    // Обновляем в 3D объекте
    if (node.group) {
      node.group.name = value;
    }
  } else if (property === 'orientation') {
    // ⭐ ИСПРАВЛЕНО ПО РЕФЕРЕНСУ: Ориентация теперь хранится как 'v'/'h'/'f'
    if (['v', 'h', 'f'].includes(value)) {
      node.orientation = value;
      if (!node.metadata) node.metadata = {};
      node.metadata.orientation = value;
      
      // Обновляем 3D модель при изменении ориентации (если это деталь)
      if (node.type === 'detail' && node.group) {
        // ✅ Clodis 1-в-1: сохраняем orientation в childrenData.spec.orientation и пересобираем секцию
        const parentSection = node.parent;
        if (parentSection && parentSection.type === 'section') {
          if (!parentSection.metadata) parentSection.metadata = {};
          if (!parentSection.metadata.childrenData) parentSection.metadata.childrenData = [];
          const childData = parentSection.metadata.childrenData.find((cd: any) => cd.id === node.id);
          if (childData) {
            if (!childData.spec || typeof childData.spec !== 'object') childData.spec = {};
            childData.spec.orientation = value;
            rebuildSection(parentSection);
          }
        }
      }
    } else {
      console.warn('⚠️ Неизвестное значение ориентации:', value);
    }
  } else if (node.metadata) {
    node.metadata[property] = value;
  }
  
  // Обновляем Clodis JSON в currentEditingCatalogElement
  updateClodisJSONFromScene();
  
  // Перерисовываем сцену
  if (typeof (window as any).renderScene === 'function') {
    (window as any).renderScene();
  } else {
    render();
  }
  
  // Обновляем дерево
  if (typeof (window as any).renderConstructorTreeFromClodisJSON === 'function' && currentEditingCatalogElement?.clodisJSON) {
    (window as any).renderConstructorTreeFromClodisJSON(currentEditingCatalogElement.clodisJSON);
  }
  
  console.log('✅ [updateNodeProperty] Свойство обновлено');
};

/**
 * Обновляет размер узла
 */
(window as any).updateNodeSize = function(nodeId: string, axis: 'x' | 'y' | 'z', value: string | number) {
  console.log('🔄 [updateNodeSize] Обновление размера:', { nodeId, axis, value });
  
  const node = sceneNodes.find(n => n.id === nodeId);
  if (!node) {
    console.warn('⚠️ Узел не найден:', nodeId);
    return;
  }

  // ✅ Clodis 1-в-1: для деталей правим childrenData (мм/выражения) и пересобираем секцию
  if (node.type === 'detail') {
    const parentSection = node.parent;
    if (!parentSection || parentSection.type !== 'section') {
      console.warn('⚠️ [updateNodeSize] У детали нет родительской секции:', nodeId);
      return;
    }
    if (!parentSection.metadata) parentSection.metadata = {};
    if (!parentSection.metadata.childrenData) parentSection.metadata.childrenData = [];
    const childData = parentSection.metadata.childrenData.find((cd: any) => cd.id === node.id);
    if (!childData) {
      console.warn('⚠️ [updateNodeSize] Не нашли childData в childrenData для детали:', node.id);
      return;
    }

    const raw = String(value ?? '').trim();
    const isPureNumber = /^\s*-?\d+(\.\d+)?\s*$/.test(raw);
    if (!childData.size || typeof childData.size !== 'object') childData.size = {};
    (childData.size as any)[axis] = isPureNumber ? parseFloat(raw) : raw; // число = мм, строка = выражение
  
    rebuildSection(parentSection);
    updateClodisJSONFromScene();
    const rebuilt = sceneNodes.find(n => n.type === 'detail' && n.id === node.id) || null;
    if (rebuilt) selectNode(rebuilt);
    render();
    return;
  }
  
  // Парсим значение (может быть выражением или числом)
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) {
    // Если не число, сохраняем как выражение
    if (!node.metadata) node.metadata = {};
    if (!node.metadata.size) node.metadata.size = {};
    if (typeof node.metadata.size === 'object') {
      (node.metadata.size as any)[axis] = value; // Сохраняем выражение
    }
  } else {
    // Если число, обновляем в метрах
    if (!node.metadata) node.metadata = {};
    if (!node.metadata.size) node.metadata.size = { x: 0, y: 0, z: 0 };
    if (typeof node.metadata.size === 'object') {
      (node.metadata.size as any)[axis] = numValue / 1000; // Конвертируем мм в метры
    }
    
    // Обновляем 3D объект (если это деталь с геометрией)
    if (node.group && node.type === 'detail') {
      // Здесь можно обновить геометрию, но это сложно - лучше пересобрать из JSON
      // Пока просто обновляем метаданные
    }
  }
  
  // Обновляем Clodis JSON
  updateClodisJSONFromScene();
  
  // Перерисовываем
  render();
  
  // Обновляем дерево
  if (typeof (window as any).renderConstructorTreeFromClodisJSON === 'function' && currentEditingCatalogElement?.clodisJSON) {
    (window as any).renderConstructorTreeFromClodisJSON(currentEditingCatalogElement.clodisJSON);
  }
  
  console.log('✅ [updateNodeSize] Размер обновлен');
};

/**
 * Обновляет позицию узла
 */
(window as any).updateNodePosition = function(nodeId: string, axis: 'x' | 'y' | 'z', value: string | number) {
  console.log('🔄 [updateNodePosition] Обновление позиции:', { nodeId, axis, value });
  
  const node = sceneNodes.find(n => n.id === nodeId);
  if (!node || !node.group) {
    console.warn('⚠️ Узел не найден или нет group:', nodeId);
    return;
  }

  // ✅ Clodis 1-в-1: для деталей правим childrenData (мм/выражения) и пересобираем секцию
  if (node.type === 'detail') {
    const parentSection = node.parent;
    if (!parentSection || parentSection.type !== 'section') {
      console.warn('⚠️ [updateNodePosition] У детали нет родительской секции:', nodeId);
      return;
    }
    if (!parentSection.metadata) parentSection.metadata = {};
    if (!parentSection.metadata.childrenData) parentSection.metadata.childrenData = [];
    const childData = parentSection.metadata.childrenData.find((cd: any) => cd.id === node.id);
    if (!childData) {
      console.warn('⚠️ [updateNodePosition] Не нашли childData в childrenData для детали:', node.id);
      return;
    }

    const raw = String(value ?? '').trim();
    const isPureNumber = /^\s*-?\d+(\.\d+)?\s*$/.test(raw);
    if (!childData.pos || typeof childData.pos !== 'object') childData.pos = {};
    (childData.pos as any)[axis] = isPureNumber ? parseFloat(raw) : raw; // число = мм, строка = выражение
 
    rebuildSection(parentSection);
    updateClodisJSONFromScene();
    const rebuilt = sceneNodes.find(n => n.type === 'detail' && n.id === node.id) || null;
    if (rebuilt) selectNode(rebuilt);
    render();
    return;
  }
  
  // Парсим значение
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (!isNaN(numValue)) {
    // Обновляем позицию в метрах
    const pos = node.group.position;
    (pos as any)[axis] = numValue / 1000; // Конвертируем мм в метры
    
    // Обновляем метаданные
    if (!node.metadata) node.metadata = {};
    if (!node.metadata.position) node.metadata.position = { x: 0, y: 0, z: 0 };
    (node.metadata.position as any)[axis] = numValue / 1000;
  } else {
    // Если выражение, сохраняем в метаданных
    if (!node.metadata) node.metadata = {};
    if (!node.metadata.position) node.metadata.position = {};
    (node.metadata.position as any)[axis] = value;
  }
  
  // Обновляем Clodis JSON
  updateClodisJSONFromScene();
  
  // Перерисовываем
  render();
  
  console.log('✅ [updateNodePosition] Позиция обновлена');
};

/**
 * Обновляет точку отсчета (pivot) узла
 */
(window as any).updateNodePivot = function(nodeId: string, axis: 'x' | 'y' | 'z', value: ClodisPivot) {
  console.log('🔄 [updateNodePivot] Обновление точки отсчета (pivot):', { nodeId, axis, value });
  
  const node = sceneNodes.find(n => n.id === nodeId);
  if (!node) {
    console.warn('⚠️ Узел не найден:', nodeId);
    return;
  }

  // ✅ Clodis 1-в-1: для деталей правим childrenData.pivot и пересобираем секцию
  if (node.type === 'detail') {
    const parentSection = node.parent;
    if (!parentSection || parentSection.type !== 'section') {
      console.warn('⚠️ [updateNodePivot] У детали нет родительской секции:', nodeId);
      return;
    }
    if (!parentSection.metadata) parentSection.metadata = {};
    if (!parentSection.metadata.childrenData) parentSection.metadata.childrenData = [];
    const childData = parentSection.metadata.childrenData.find((cd: any) => cd.id === node.id);
    if (!childData) {
      console.warn('⚠️ [updateNodePivot] Не нашли childData в childrenData для детали:', node.id);
      return;
    }
    if (!childData.pivot || typeof childData.pivot !== 'object') childData.pivot = { x: -1, y: -1, z: -1 };
    childData.pivot[axis] = value;

    rebuildSection(parentSection);
    updateClodisJSONFromScene();
    const rebuilt = sceneNodes.find(n => n.type === 'detail' && n.id === node.id) || null;
    if (rebuilt) selectNode(rebuilt);
    render();
    return;
  }
  
  if (!node.metadata) node.metadata = {};
  if (!node.metadata.pivot) node.metadata.pivot = { x: 0, y: 0, z: 0 }; // Дефолт теперь 0 (центр)
  
  // ⭐ ИСПРАВЛЕНО: Сохраняем числовое значение pivot (-1, 0, 1)
  (node.metadata.pivot as any)[axis] = value;
  
  // ⭐ УДАЛЕНО: Красная сфера (PivotMarker) больше не создается
  
  // Обновляем Clodis JSON
  updateClodisJSONFromScene();
  
  // Перерисовываем
  render();
  
  console.log('✅ [updateNodePivot] Точка отсчета обновлена:', { axis, value, pivot: node.metadata.pivot });
};

/**
 * Обновляет материал узла
 */
(window as any).updateNodeMaterial = function(nodeId: string, property: 'group' | 'key' | 'id', value: string) {
  console.log('🔄 [updateNodeMaterial] Обновление материала:', { nodeId, property, value });
  
  const node = sceneNodes.find(n => n.id === nodeId);
  if (!node) {
    console.warn('⚠️ Узел не найден:', nodeId);
    return;
  }

  // ✅ Clodis 1-в-1: для деталей сохраняем материал в childrenData и пересобираем секцию
  if (node.type === 'detail') {
    const parentSection = node.parent;
    if (!parentSection || parentSection.type !== 'section') return;
    if (!parentSection.metadata) parentSection.metadata = {};
    if (!parentSection.metadata.childrenData) parentSection.metadata.childrenData = [];
    const childData = parentSection.metadata.childrenData.find((cd: any) => cd.id === node.id);
    if (childData) {
      // сохраняем в spec.material (как в Clodis), плюс materialId для нашего material picker
      if (!childData.spec || typeof childData.spec !== 'object') childData.spec = {};
      if (!childData.spec.material || typeof childData.spec.material !== 'object') childData.spec.material = {};
      (childData.spec.material as any)[property] = value;

      // ⭐ Clodis-логика: при смене группы материалов обновляем толщину через g:<group>.thickness
      if (property === 'group') {
        childData.spec.group = value;
        const ori: 'v' | 'h' | 'f' = (childData.spec?.orientation && ['v', 'h', 'f'].includes(childData.spec.orientation))
          ? childData.spec.orientation
          : 'h';
        if (!childData.size || typeof childData.size !== 'object') childData.size = {};
        if (ori === 'v') (childData.size as any).x = `g:${value}.thickness`;
        if (ori === 'h') (childData.size as any).y = `g:${value}.thickness`;
        if (ori === 'f') (childData.size as any).z = `g:${value}.thickness`;
      }
      if (property === 'key') {
        childData.spec.key = value;
      }
    }
    rebuildSection(parentSection);
    updateClodisJSONFromScene();
    const rebuilt = sceneNodes.find(n => n.type === 'detail' && n.id === node.id) || null;
    if (rebuilt) selectNode(rebuilt);
    render();
    return;
  }
  
  if (!node.metadata) node.metadata = {};
  if (!node.metadata.material) node.metadata.material = {};
  
  if (property === 'group') {
    node.metadata.material.group = value;
  } else if (property === 'key') {
    node.metadata.material.key = value;
  } else if (property === 'id') {
    node.metadata.material.id = parseInt(value) || 0;
  }
  
  // Обновляем Clodis JSON
  updateClodisJSONFromScene();
  
  // Перерисовываем (материал может измениться визуально)
  render();
  
  console.log('✅ [updateNodeMaterial] Материал обновлен');
};

/**
 * Обновляет кромки узла
 */
(window as any).updateNodeEdges = function(nodeId: string) {
  console.log('🔄 [updateNodeEdges] Обновление кромок:', nodeId);
  
  const node = sceneNodes.find(n => n.id === nodeId);
  if (!node) {
    console.warn('⚠️ Узел не найден:', nodeId);
    return;
  }
  
  // ⭐ ИСПРАВЛЕНО ПО РЕФЕРЕНСУ: В референсе edges хранятся как face_index (0-based индексы контура)
  // Референс: main_core_v2_part20.js:1118-1121 - P.push(Q['face_index'])
  // Но для простоты мы храним 1-based номера (1,2,3,4) в metadata.edges для совместимости с UI
  const edges: number[] = [];
  const edgesData: { [key: number]: { thickness?: number; type?: string; key?: string; id?: number; variant_id?: number } } = {};
  
  for (let i = 1; i <= 4; i++) {
    const checkbox = document.getElementById('catalog-constructor-property-edge-' + i) as HTMLInputElement | null;
    if (checkbox && checkbox.checked) {
      edges.push(i); // Сохраняем 1-based номера в metadata
      
      // Сохраняем данные кромки (толщина, тип) - как в референсе
      const thicknessInput = document.getElementById('catalog-constructor-property-edge-' + i + '-thickness') as HTMLInputElement | null;
      const typeSelect = document.getElementById('catalog-constructor-property-edge-' + i + '-type') as HTMLSelectElement | null;
      
      edgesData[i] = {
        thickness: thicknessInput ? parseFloat(thicknessInput.value) || 0.4 : 0.4,
        type: typeSelect ? typeSelect.value || 'butts' : 'butts'
      };
    }
  }
  
  if (!node.metadata) node.metadata = {};
  node.metadata.edges = edges;
  node.metadata.edgesData = edgesData; // Сохраняем данные кромок (толщина, тип)
  
  console.log('🔄 [updateNodeEdges] Кромки сохранены:', {
    edges: edges, // 1-based номера (1,2,3,4)
    edgesData: edgesData,
    nodeId: nodeId,
    nodeName: node.name
  });
  
  // ⭐ ВАЖНО: Обновляем визуализацию номеров кромок на 3D модели
  // Передаем node, чтобы функция могла получить актуальные edges из metadata
  updateEdgeNumbersVisualization(node);
  
  // Обновляем Clodis JSON
  updateClodisJSONFromScene();
  
  // Перерисовываем сцену
  render();
  
  console.log('✅ [updateNodeEdges] Кромки обновлены, визуализация обновлена:', edges);
};

/**
 * ⭐ ПЕРЕПИСАНО ПО РЕФЕРЕНСУ: Генерирует CSS2DObject с номером кромки
 * Референс: main_core_v2_part20.js:1494 - addFaceLabel
 */
/**
 * ⭐ ТОЧНО ПО РЕФЕРЕНСУ: Генерирует CSS2DObject с номером кромки
 * Референс: main_core_v2_part20.js:1494-1517 - addFaceLabel
 * @param edgeIndex - 0-based индекс в контуре (0,1,2,3...)
 * @param selectedFaceIndices - массив 0-based face_index из кромок (как P в референсе)
 */
function addFaceLabel(edgeIndex: number, selectedFaceIndices: number[]): CSS2DObject {
  const div = document.createElement('div');
  
  // Стили точно как в референсе Clodis (addFaceLabel) - main_core_v2_part20.js:1496-1510
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.width = '20px';
  div.style.height = '20px';
  // ⭐ ВАЖНО: Референс main_core_v2_part20.js:1501 - 0x0 < g['length'] && g['includes'](f) ? 'green' : 'black'
  // g (selectedFaceIndices) содержит face_index (0-based), f (edgeIndex) - тоже 0-based
  // У нас selectedEdges содержит 1-based номера (1,2,3,4), конвертируем их в 0-based индексы
  const isSelected = selectedFaceIndices.length > 0 && selectedFaceIndices.includes(edgeIndex);
  div.style.background = isSelected ? 'green' : 'black';
  div.style.color = 'white';
  div.style.borderRadius = '4px';
  div.style.fontSize = '12px';
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.fontWeight = 'bold';
  div.style.textAlign = 'center';
  div.style.lineHeight = '20px';
  div.style.boxSizing = 'border-box';
  div.style.transform = 'translate(-50%, -50%)';
  // Референс: h['textContent'] = f + 0x1 (edgeIndex + 1, так как индексы 0-based, а отображаем 1-based номера)
  div.textContent = String(edgeIndex + 1);
  
  const label = new CSS2DObject(div);
  label.userData.isEdgeNumber = true;
  label.userData.is_helper = true;
  label.layers.set(1); // Референс: g['layers']['set'](0x1)
  label.renderOrder = 20; // Референс: g['renderOrder'] = 0x14 (20 в десятичной)
  
  return label;
}

/**
 * ⭐ ПЕРЕПИСАНО ПО РЕФЕРЕНСУ: Обновляет визуализацию номеров кромок на 3D модели
 * Референс: main_core_v2_part20.js:1122-1163 - позиционирование на основе контура и ориентации
 */
function updateEdgeNumbersVisualization(node: SceneNode) {
  if (!node.group || node.type !== 'detail') {
    return;
  }

  // Проверяем, включена ли нумерация кромок
  const edgeNumberingCheckbox = document.getElementById('catalog-constructor-property-edge-numbering') as HTMLInputElement | null;
  const showNumbers = edgeNumberingCheckbox ? edgeNumberingCheckbox.checked : true;

  // Удаляем старые метки номеров кромок (CSS2DObject)
  const oldLabels: CSS2DObject[] = [];
  node.group.traverse((child: THREE.Object3D) => {
    if ((child as any).userData?.isEdgeNumber) {
      oldLabels.push(child as CSS2DObject);
    }
  });
  oldLabels.forEach((label: CSS2DObject) => {
    node.group!.remove(label);
    // Удаляем DOM элемент
    if (label.element && label.element.parentNode) {
      label.element.parentNode.removeChild(label.element);
    }
  });

  if (!showNumbers) {
    return;
  }

  // ⭐ ВАЖНО: Референс main_core_v2_part20.js:1118-1121
  // P (selectedFaceIndices) содержит face_index из H (edges), оба 0-based
  // У нас metadata.edges содержит 1-based номера (1,2,3,4), конвертируем в 0-based индексы
  const selectedEdges = node.metadata?.edges || [];
  const selectedFaceIndices: number[] = selectedEdges.map(num => num - 1); // Конвертируем 1-based номера в 0-based индексы
  
  console.log('🔍 [updateEdgeNumbersVisualization] Начало обновления:', {
    nodeName: node.name,
    nodeType: node.type,
    selectedEdges: selectedEdges, // 1-based номера (1,2,3,4)
    selectedFaceIndices: selectedFaceIndices, // 0-based индексы (0,1,2,3) - как P в референсе
    showNumbers,
    hasGroup: !!node.group
  });
  
  // ⭐ ИСПРАВЛЕНО: Получаем bounding box детали в ЛОКАЛЬНЫХ координатах группы
  // Исключаем helpers и другие вспомогательные объекты
  const tempGroup = new THREE.Group();
  node.group.children.forEach(child => {
    if (!(child as any).userData?.is_helper && 
        !(child as any).userData?.isEdgeNumber &&
        !(child as any).userData?.isAxes &&
        !(child as any).userData?.isPivotMarker) {
      tempGroup.add(child.clone());
    }
  });
  
  const bbox = new THREE.Box3().setFromObject(tempGroup);
  tempGroup.clear();
  
  if (bbox.isEmpty()) {
    // Если bbox пуст, используем размеры из metadata
    const size = node.metadata?.size || { x: 0.6, y: 2.4, z: 0.016 };
    const w = typeof size.x === 'number' ? size.x : 0.6;
    const h = typeof size.y === 'number' ? size.y : 2.4;
    const d = typeof size.z === 'number' ? size.z : 0.016;
    
    // Для прямоугольной детали с ориентацией 'v' (вертикальная):
    // Кромка 0 (нижняя, номер 1): середина нижней стороны
    // Кромка 1 (правая, номер 2): середина правой стороны
    // Кромка 2 (верхняя, номер 3): середина верхней стороны
    // Кромка 3 (левая, номер 4): середина левой стороны
    
    const edgeOffsets = [
      { x: 0, y: -h / 2, z: 0 },      // Кромка 0 (нижняя) - номер 1
      { x: w / 2, y: 0, z: 0 },       // Кромка 1 (правая) - номер 2
      { x: 0, y: h / 2, z: 0 },      // Кромка 2 (верхняя) - номер 3
      { x: -w / 2, y: 0, z: 0 }      // Кромка 3 (левая) - номер 4
    ];
    
    // Получаем ориентацию детали
    const orientation = node.orientation || node.metadata?.orientation || 'v';
    
    // ⭐ ВАЖНО: Референс main_core_v2_part20.js:1122-1163
    // Цикл по контуру G, ak (edgeIndex) - 0-based индекс контура, P (selectedFaceIndices) - массив выбранных face_index
    // Для прямоугольной детали контур G состоит из 4 точек (нижняя, правая, верхняя, левая)
    // Создаем метки для всех 4 кромок (как в референсе - всегда отображаются все)
    for (let edgeIndex = 0; edgeIndex < 4; edgeIndex++) {
      const label = addFaceLabel(edgeIndex, selectedFaceIndices); // Передаем 0-based индексы
      label.name = `EdgeNumber_${edgeIndex + 1}`;
      
      const offset = edgeOffsets[edgeIndex];
      const offsetDistance = 0.015; // 15мм отступ от грани
      
      // Позиционирование в зависимости от ориентации (как в референсе main_core_v2_part20.js:1150-1159)
      switch (orientation) {
        case 'f': // front (фронтальная)
          // aj['position']['set'](Z - al['x'], a0 - al['y'], al['z'])
          label.position.set(offset.x, offset.y, d / 2 + offsetDistance);
          break;
        case 'h': // horizontal (горизонтальная)
          // aj['position']['set'](Z - al['x'], al['y'], a0 - al['z'])
          label.position.set(offset.x, h / 2 + offsetDistance, offset.y);
          break;
        case 'v': // vertical (вертикальная) - по умолчанию
        default:
          // aj['position']['set'](al['x'], a0 - al['y'], Z - al['z'])
          // Для вертикальной: номер на грани по оси Y (высота)
          if (edgeIndex === 0) {
            // Нижняя грань (кромка 1)
            label.position.set(0, -h / 2 - offsetDistance, 0);
          } else if (edgeIndex === 1) {
            // Правая грань (кромка 2)
            label.position.set(w / 2 + offsetDistance, 0, 0);
          } else if (edgeIndex === 2) {
            // Верхняя грань (кромка 3)
            label.position.set(0, h / 2 + offsetDistance, 0);
          } else if (edgeIndex === 3) {
            // Левая грань (кромка 4)
            label.position.set(-w / 2 - offsetDistance, 0, 0);
          }
          break;
      }
      
      node.group!.add(label);
      console.log(`  ✅ Кромка ${edgeIndex + 1} (индекс ${edgeIndex}) добавлена:`, {
        position: label.position,
        isSelected: selectedFaceIndices.includes(edgeIndex), // Проверяем 0-based индекс
        color: selectedFaceIndices.includes(edgeIndex) ? 'green' : 'black'
      });
    }
    
    console.log('✅ [updateEdgeNumbersVisualization] Номера кромок обновлены (из metadata):', node.name, {
      orientation,
      selectedEdges: selectedEdges, // 1-based номера
      selectedFaceIndices: selectedFaceIndices, // 0-based индексы (как P в референсе)
      size: { w: w * 1000, h: h * 1000, d: d * 1000 },
      labelsCount: 4
    });
    render(); // ⭐ ВАЖНО: Перерисовываем сцену после добавления номеров
    return;
  }
  
  // Если bbox не пуст, используем его для позиционирования
  const size = bbox.getSize(new THREE.Vector3());
  const min = bbox.min;
  const max = bbox.max;
  
  // Получаем ориентацию детали
  const orientation = node.orientation || node.metadata?.orientation || 'v';
  
  // Координаты середин граней в локальных координатах группы:
  // Кромка 0 (нижняя, номер 1): середина нижней стороны
  // Кромка 1 (правая, номер 2): середина правой стороны
  // Кромка 2 (верхняя, номер 3): середина верхней стороны
  // Кромка 3 (левая, номер 4): середина левой стороны
  
  const edgePositions = [
    { x: (min.x + max.x) / 2, y: min.y, z: (min.z + max.z) / 2 },      // Кромка 0 (нижняя)
    { x: max.x, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 },      // Кромка 1 (правая)
    { x: (min.x + max.x) / 2, y: max.y, z: (min.z + max.z) / 2 },      // Кромка 2 (верхняя)
    { x: min.x, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 }       // Кромка 3 (левая)
  ];
  
  // ⭐ ВАЖНО: Референс main_core_v2_part20.js:1122-1163
  // Цикл по контуру G, ak (edgeIndex) - 0-based индекс контура, P (selectedFaceIndices) - массив выбранных face_index
  // Создаем метки для всех 4 кромок (как в референсе - всегда отображаются все)
  for (let edgeIndex = 0; edgeIndex < 4; edgeIndex++) {
    const label = addFaceLabel(edgeIndex, selectedFaceIndices); // Передаем 0-based индексы
    label.name = `EdgeNumber_${edgeIndex + 1}`;
    
    const edgePos = edgePositions[edgeIndex];
    const offsetDistance = 0.015; // 15мм отступ от грани
    
    // Позиционирование в зависимости от ориентации (как в референсе)
    switch (orientation) {
      case 'f': // front (фронтальная)
        label.position.set(edgePos.x, edgePos.y, edgePos.z + offsetDistance);
        break;
      case 'h': // horizontal (горизонтальная)
        label.position.set(edgePos.x, edgePos.y + offsetDistance, edgePos.z);
        break;
      case 'v': // vertical (вертикальная) - по умолчанию
      default:
        // Для вертикальной детали номера на гранях по осям X и Y
        if (edgeIndex === 0) {
          // Нижняя грань (кромка 1)
          label.position.set(edgePos.x, edgePos.y - offsetDistance, edgePos.z);
        } else if (edgeIndex === 1) {
          // Правая грань (кромка 2)
          label.position.set(edgePos.x + offsetDistance, edgePos.y, edgePos.z);
        } else if (edgeIndex === 2) {
          // Верхняя грань (кромка 3)
          label.position.set(edgePos.x, edgePos.y + offsetDistance, edgePos.z);
        } else if (edgeIndex === 3) {
          // Левая грань (кромка 4)
          label.position.set(edgePos.x - offsetDistance, edgePos.y, edgePos.z);
        }
        break;
    }
    
    node.group!.add(label);
    console.log(`  ✅ Кромка ${edgeIndex + 1} (индекс ${edgeIndex}) добавлена (из bbox):`, {
      position: label.position,
      isSelected: selectedFaceIndices.includes(edgeIndex), // Проверяем 0-based индекс
      color: selectedFaceIndices.includes(edgeIndex) ? 'green' : 'black'
    });
  }
  
  console.log('✅ [updateEdgeNumbersVisualization] Номера кромок обновлены (из bbox):', node.name, {
    orientation,
    selectedEdges: selectedEdges, // 1-based номера
    selectedFaceIndices: selectedFaceIndices, // 0-based индексы (как P в референсе)
    bboxSize: { x: size.x * 1000, y: size.y * 1000, z: size.z * 1000 },
    labelsCount: 4
  });
  render(); // ⭐ ВАЖНО: Перерисовываем сцену после добавления номеров
}

// ⭐ ВАЖНО: Экспортируем функцию в window для использования из HTML
(window as any).updateEdgeNumbersVisualization = updateEdgeNumbersVisualization;

/**
 * Обновляет Clodis JSON из текущей сцены (синхронизация)
 */
function updateClodisJSONFromScene() {
  if (!currentEditingCatalogElement) {
    return;
  }
  
  // Экспортируем JSON из сцены
  try {
    const exportedJSON = exportClodisJSONFromScene();
    if (exportedJSON && Array.isArray(exportedJSON) && exportedJSON.length > 0) {
      currentEditingCatalogElement.clodisJSON = exportedJSON;
      // ⭐ Синхронизируем textarea вкладки JSON — чтобы не терялся при сохранении
      const jsonEditorEl = document.getElementById('catalog-json-editor') as HTMLTextAreaElement | null;
      if (jsonEditorEl) {
        jsonEditorEl.value = JSON.stringify(exportedJSON, null, 2);
      }
      console.log('✅ [updateClodisJSONFromScene] Clodis JSON обновлен из сцены');
    }
  } catch (error) {
    console.error('❌ [updateClodisJSONFromScene] Ошибка обновления JSON:', error);
  }
}

/**
 * Экспортирует Clodis JSON из текущей сцены
 */
function exportClodisJSONFromScene(): ClodisItem[] | null {
  // Находим корневой узел (секция без родителя)
  const rootNode = sceneNodes.find(n => n.type === 'section' && !n.parent);
  if (!rootNode) {
    console.warn('⚠️ Корневой узел не найден для экспорта');
    return null;
  }
  
  // Рекурсивно экспортируем структуру
  function exportNode(node: SceneNode): ClodisItem {
    const item: ClodisItem = {
      type: node.type === 'section' ? 'section' : (node.type === 'detail' ? 'wall' : 'wall'),
      name: node.name || '',
    };
    
    // Размеры
    if (node.metadata?.size) {
      const size = node.metadata.size;
      if (typeof size === 'object' && size.x !== undefined) {
        item.size = {
          x: typeof size.x === 'number' ? size.x * 1000 : size.x, // Конвертируем метры в мм
          y: typeof size.y === 'number' ? size.y * 1000 : size.y,
          z: typeof size.z === 'number' ? size.z * 1000 : size.z,
        };
      }
    }
    
    // Позиция
    if (node.group && node.group.position) {
      const pos = node.group.position;
      item.pos = {
        x: pos.x * 1000, // Конвертируем метры в мм
        y: pos.y * 1000,
        z: pos.z * 1000,
      };
    }
    
    // Материал
    if (node.metadata?.material) {
      if (!item.spec) item.spec = {};
      if (!item.spec.material) item.spec.material = {};
      item.spec.material.group = node.metadata.material.group;
      item.spec.material.key = node.metadata.material.key;
      if (node.metadata.material.id) {
        item.spec.material.id = node.metadata.material.id;
      }
    }
    
    // Кромки
    if (node.metadata?.edges && Array.isArray(node.metadata.edges)) {
      if (!item.spec) item.spec = {};
      item.spec.edges = node.metadata.edges;
    }
    
    // Дочерние элементы
    const children = sceneNodes.filter(n => n.parent?.id === node.id);
    if (children.length > 0) {
      item.children = children.map(child => exportNode(child));
    }
    
    return item;
  }
  
  return [exportNode(rootNode)];
}

// ============================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ШАБЛОНАМИ
// ============================================================================

/**
 * Загружает шаблоны из Clodis JSON и заполняет селектор
 */
function loadTemplatesFromClodisJSON(clodisJSON: ClodisItem[]) {
  console.log('📋 [loadTemplatesFromClodisJSON] Загрузка шаблонов из Clodis JSON');
  
  const templateSelect = document.getElementById('catalog-item-edit-active-template') as HTMLSelectElement | null;
  if (!templateSelect) {
    console.warn('⚠️ Селектор шаблонов не найден');
    return;
  }
  
  // Очищаем селектор
  templateSelect.innerHTML = '<option value="auto">Авто</option>';
  
  // Ищем шаблоны в первом элементе (обычно это секция)
  if (!clodisJSON || clodisJSON.length === 0) {
    console.log('⚠️ Clodis JSON пуст, шаблоны не найдены');
    return;
  }
  
  const rootItem = clodisJSON[0];
  if (!rootItem || !rootItem.spec || !rootItem.spec.templates || !Array.isArray(rootItem.spec.templates)) {
    console.log('⚠️ Шаблоны не найдены в spec.templates');
    return;
  }
  
  const templates = rootItem.spec.templates;
  const selectedTemplate = rootItem.spec.selected_template !== undefined ? rootItem.spec.selected_template : -1;
  
  console.log('📋 Найдено шаблонов:', templates.length, 'Выбранный:', selectedTemplate);
  
  // Заполняем селектор шаблонами
  templates.forEach((template: any, index: number) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = template.name || `Шаблон ${index + 1}`;
    if (index === selectedTemplate) {
      option.selected = true;
    }
    templateSelect.appendChild(option);
  });
  
  // Если selected_template = -1, выбираем "Авто"
  if (selectedTemplate === -1) {
    templateSelect.value = 'auto';
  }
  
  // Устанавливаем обработчик изменения
  templateSelect.onchange = function() {
    const selectedValue = this.value;
    if (window.applySelectedTemplate) {
      (window as any).applySelectedTemplate(selectedValue);
    }
  };
  
  console.log('✅ Шаблоны загружены в селектор');
}

/**
 * Применяет выбранный шаблон (пересобирает модель)
 */
(window as any).applySelectedTemplate = function(templateIndex: string | number) {
  console.log('🔄 [applySelectedTemplate] Применение шаблона:', templateIndex);
  
  if (!currentEditingCatalogElement || !currentEditingCatalogElement.clodisJSON) {
    console.warn('⚠️ Нет редактируемого элемента или Clodis JSON');
    return;
  }
  
  const clodisJSON = currentEditingCatalogElement.clodisJSON;
  if (!clodisJSON || clodisJSON.length === 0) {
    console.warn('⚠️ Clodis JSON пуст');
    return;
  }
  
  const rootItem = clodisJSON[0];
  if (!rootItem || !rootItem.spec) {
    console.warn('⚠️ Нет spec в корневом элементе');
    return;
  }
  
  // Если "Авто", устанавливаем selected_template = -1
  if (templateIndex === 'auto' || templateIndex === '-1') {
    rootItem.spec.selected_template = -1;
  } else {
    const index = typeof templateIndex === 'string' ? parseInt(templateIndex) : templateIndex;
    if (isNaN(index) || index < 0) {
      console.warn('⚠️ Некорректный индекс шаблона:', templateIndex);
      return;
    }
    
    // Проверяем, что шаблон существует
    if (!rootItem.spec.templates || !Array.isArray(rootItem.spec.templates) || index >= rootItem.spec.templates.length) {
      console.warn('⚠️ Шаблон с индексом', index, 'не найден');
      return;
    }
    
    rootItem.spec.selected_template = index;
  }
  
  // Обновляем Clodis JSON в currentEditingCatalogElement
  currentEditingCatalogElement.clodisJSON = clodisJSON;
  
  // Пересобираем модель с новым шаблоном
  const savedSizeMM = currentEditingCatalogElement.metadata?.size ? {
    width: Math.round((currentEditingCatalogElement.metadata.size.width || currentEditingCatalogElement.metadata.size.x || 0) * 1000),
    height: Math.round((currentEditingCatalogElement.metadata.size.height || currentEditingCatalogElement.metadata.size.y || 0) * 1000),
    depth: Math.round((currentEditingCatalogElement.metadata.size.depth || currentEditingCatalogElement.metadata.size.z || 0) * 1000),
  } : undefined;
  
  console.log('🔄 Пересборка модели с новым шаблоном, размеры:', savedSizeMM);
  importModuleFromClodisJSON(clodisJSON, savedSizeMM);
  
  // Обновляем дерево
  setTimeout(() => {
    if (typeof (window as any).renderConstructorTreeFromClodisJSON === 'function') {
      (window as any).renderConstructorTreeFromClodisJSON(clodisJSON);
    }
  }, 150);
  
  console.log('✅ Шаблон применен');
};

/**
 * Переставляет элементы в дереве (Drag & Drop)
 */
(window as any).reorderTreeElements = function(draggedElementId: string, targetElementId: string) {
  console.log('🔄 [reorderTreeElements] Перестановка элементов:', { draggedElementId, targetElementId });
  
  if (!currentEditingCatalogElement || !currentEditingCatalogElement.clodisJSON) {
    console.warn('⚠️ Нет редактируемого элемента или Clodis JSON');
    return;
  }
  
  // Находим узлы в sceneNodes
  const draggedNode = sceneNodes.find(n => n.id === draggedElementId);
  const targetNode = sceneNodes.find(n => n.id === targetElementId);
  
  if (!draggedNode || !targetNode) {
    console.warn('⚠️ Узлы не найдены для перестановки');
    return;
  }
  
  // Нельзя переставить элемент на самого себя или на своего потомка
  if (draggedElementId === targetElementId) {
    return;
  }
  
  // Проверяем, что targetNode не является потомком draggedNode
  let current = targetNode.parent;
  while (current) {
    if (current.id === draggedElementId) {
      console.warn('⚠️ Нельзя переставить элемент на своего потомка');
      return;
    }
    current = current.parent;
  }
  
  // Определяем новый родитель (родитель targetNode)
  const newParent = targetNode.parent || sceneNodes.find(n => n.type === 'section' && !n.parent);
  
  if (!newParent) {
    console.warn('⚠️ Не найден родитель для перестановки');
    return;
  }
  
  // Удаляем draggedNode из старого родителя
  if (draggedNode.parent) {
    const oldParentChildren = draggedNode.parent.children;
    const oldIndex = oldParentChildren.findIndex(child => child.id === draggedElementId);
    if (oldIndex >= 0) {
      oldParentChildren.splice(oldIndex, 1);
    }
    if (draggedNode.group && draggedNode.parent.group) {
      draggedNode.parent.group.remove(draggedNode.group);
    }
  } else {
    // Если нет родителя, удаляем из корневой сцены
    if (draggedNode.group) {
      scene.remove(draggedNode.group);
    }
  }
  
  // Добавляем draggedNode к новому родителю
  draggedNode.parent = newParent;
  newParent.children.push(draggedNode);
  if (draggedNode.group && newParent.group) {
    newParent.group.add(draggedNode.group);
  }
  
  // Обновляем Clodis JSON
  updateClodisJSONFromScene();
  
  // Перерисовываем дерево
  if (typeof (window as any).renderConstructorTreeFromClodisJSON === 'function' && currentEditingCatalogElement.clodisJSON) {
    (window as any).renderConstructorTreeFromClodisJSON(currentEditingCatalogElement.clodisJSON);
  }
  
  // Перерисовываем сцену
  render();
  
  console.log('✅ Элементы переставлены');
};

// Инициализируем типы и группы каталога при загрузке
initCatalogTypesAndGroups();

// Загружаем каталог элементов с сервера при инициализации (тихо, без ошибок в консоли)
loadCatalogFromServer().then(() => {
  console.log('✅ [constructor.ts] Каталог синхронизирован с сервером (если сервер доступен)');
}).catch(err => {
  // Ошибки уже обработаны внутри loadCatalogFromServer, здесь просто логируем
  console.log('ℹ️ [constructor.ts] Используем каталог из localStorage');
});

// Вызываем wireUI() сразу при загрузке модуля
wireUI();
console.log('✅ [constructor.ts] wireUI() выполнена, openTypeItemsModal должна быть доступна');

// Resize
function onResize() {
  // Используем app-container если он есть, иначе app
  const container = document.getElementById('app-container') || app;
  const { clientWidth, clientHeight } = container;
  
  if (clientWidth > 0 && clientHeight > 0) {
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
    // ⭐ ВАЖНО: Обновляем размер CSS2DRenderer
    if (css2DRenderer) {
      css2DRenderer.setSize(clientWidth, clientHeight);
    }
  }
}
window.addEventListener('resize', onResize);

// ⭐ ВАЖНО: Функция render() для перерисовки сцены (используется в разных местах)
function render() {
  renderer.render(scene, camera);
  // ⭐ ВАЖНО: Рендерим CSS2D метки (номера кромок)
  if (css2DRenderer) {
    css2DRenderer.render(scene, camera);
  }
}
(window as any).render = render; // Экспортируем для использования из других мест

// Loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update animations
  if (animationMixer) {
    const delta = clock.getDelta();
    animationMixer.update(delta);
  }
  controls.update();
  // Grid is hidden (not needed in modal)
  grid.visible = false;
  render();
}

// Инициализация менеджера материалов
materialsManager.init().catch(err => {
  console.error('Ошибка инициализации менеджера материалов:', err);
});

animate();

