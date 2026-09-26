// @ts-nocheck
// Упрощённый ClodisBuilder, который понимает базовый Clodis JSON
// и умеет вычислять выражения (s:x, g:g0.thickness, v:var и т.п.).

import * as THREE from 'three';
import { evaluateExpression } from './clodisLibs';

export class EmbeddedClodisBuilder {
  constructor() {
    this.variables = {}; // v:variable_name
    this.groups = {}; // g:group_name (materials, thicknesses)
    this.sectionStack = []; // Stack for nested sections
    this.catalogLoader = null; // Функция для загрузки модулей из каталога
  }
  
  // Устанавливаем функцию для загрузки модулей из каталога
  setCatalogLoader(loader: ((id: string, elementType?: string) => Promise<any>) | null) {
    this.catalogLoader = loader;
  }

  // Build furniture from Clodis JSON structure
  buildFromJSON(jsonData, params = {}) {
    console.log('🚀🚀🚀 [EmbeddedClodisBuilder] buildFromJSON НАЧАЛО 🚀🚀🚀');
    
    // ⭐ ВАЖНО: Логируем ПОЛНУЮ структуру JSON для отладки
    console.log('📦 ПОЛНЫЙ JSON (для анализа структуры):', JSON.stringify(jsonData, null, 2));
    
    console.log('📦 JSON данные:', {
      type: jsonData?.type,
      name: jsonData?.name,
      hasChildren: !!jsonData?.children,
      childrenCount: jsonData?.children?.length || 0,
      children: jsonData?.children?.map(c => ({ 
        type: c.type, 
        name: c.name,
        hasChildren: !!c.children,
        childrenCount: c.children?.length || 0
      })) || []
    });
    console.log('📦 Параметры:', params);
    
    // Initialize variables and groups
    this.variables = params.variables || {};
    this.groups = params.groups || {
      g0: { thickness: 16 }, // Default thickness 16mm (ЛДСП)
      g1: { thickness: 3 }, // HDF для задней стенки
    };

    // Get root section size from params (these become s:x, s:y, s:z)
    // sectionSize should be in MILLIMETERS (Clodis units)
    const sectionSizeMM = params.sectionSize || {
      x: 600,
      y: 2400,
      z: 600,
    };

    // ⭐ ВАЖНО: rootSectionContext.size должен быть в МЕТРАХ для evaluateSize
    const rootSectionContext = {
      size: {
        x: sectionSizeMM.x / 1000, // Конвертируем мм в метры
        y: sectionSizeMM.y / 1000,
        z: sectionSizeMM.z / 1000,
      },
      position: { x: 0, y: 0, z: 0 },
      pivot: { x: 0, y: 0, z: 0 },
      parent: null,
      name: 'root',
    };

    this.rootSectionContext = rootSectionContext;

    const rootGroup = new THREE.Group();
    this.sectionStack = [];

    // Process root level (array of sections)
    if (Array.isArray(jsonData)) {
      jsonData.forEach(item => {
        const built = this.buildItem(item, rootSectionContext);
        if (built) {
          rootGroup.add(built);
        }
      });
    } else {
      const built = this.buildItem(jsonData, rootSectionContext);
      if (built) {
        rootGroup.add(built);
      }
    }

    console.log('✅ [EmbeddedClodisBuilder] buildFromJSON ЗАВЕРШЕНО, children:', rootGroup.children.length);
    return rootGroup;
  }

  // Build single item (section or detail)
  buildItem(item, context) {
    if (!item || typeof item !== 'object') {
      console.warn('[EmbeddedClodisBuilder] Пустой или некорректный item:', item);
      return null;
    }

    // ⭐ ВАЖНО: В Clodis wall/facade - это ДЕТАЛИ (Mesh), а не контейнеры!
    // Они строят геометрию по размерам и spec, а не просто группируют детей
    if (item.type === 'wall') {
      return this.buildWall(item, context);
    }
    
    if (item.type === 'facade') {
      return this.buildFacade(item, context);
    }

    // section и box - это контейнеры с children
    if (item.type === 'section' || item.type === 'box') {
      return this.buildSection(item, context);
    }

    // module в Clodis – это готовый элемент (дверь, опоры и т.п.).
    // ⭐ ВАЖНО: Если у module есть children, обрабатываем как секцию (вложенный модуль)
    if (item.type === 'module') {
      // Если у модуля есть children, это вложенный модуль/секция
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        console.log('🔄 [buildItem] module с children обрабатывается как section:', item.name);
        return this.buildSection(item, context);
      }
      
      // ⭐ ВАЖНО: Если у модуля есть spec.element_type (например, "shablony_korpusov"),
      // это ссылка на шаблон корпуса из каталога. Пока строим как простой куб,
      // но в будущем здесь должна быть загрузка JSON из каталога
      if (item.spec && item.spec.element_type) {
        console.log('ℹ️ [buildItem] module с spec.element_type:', item.spec.element_type, '- строим как простой куб (загрузка из каталога пока не реализована)');
      }
      
      // Иначе это простой модуль (дверь, опоры и т.п.)
      return this.buildModule(item, context);
    }

    if (item.type === 'detail') {
      return this.buildDetail(item, context);
    }

    console.warn('[EmbeddedClodisBuilder] Неизвестный тип элемента:', item.type);
    return null;
  }

  // Section / wall / module builder
  buildSection(section, parentContext) {
    const group = new THREE.Group();
    group.userData.isSection = true;
    group.userData.sectionName = section.name || '';

    // ⭐ ВАЖНО: evaluateSize возвращает размеры в МЕТРАХ
    const size = this.evaluateSize(section.size || {}, parentContext);

    // ⭐ ВАЖНО: Вычисляем pivot секции (начало координат секции)
    // Pivot секции определяет, где находится начало координат (back-left-bottom)
    // evaluatePivot возвращает миллиметры
    const sectionPivotMM = this.evaluatePivot(section.pivot || { x: -1, y: -1, z: -1 }, size);
    
    console.log('📦 [buildSection] Секция:', section.name, {
      размеры_метры: size,
      размеры_мм: { x: size.x * 1000, y: size.y * 1000, z: size.z * 1000 },
      pivot_секции_мм: sectionPivotMM,
      начало_координат: 'back-left-bottom (задний-левый-нижний угол)',
      детей: section.children?.length || 0
    });

    // ⭐ ВАЖНО: Для корневой секции НЕ применяем transform (как в оригинале)
    // Позиция остается (0,0,0), детали позиционируются относительно начала координат секции
    const isRootSection = !parentContext;
    if (!isRootSection) {
      // Для вложенных секций применяем transform
      const sectionPosMM = this.evaluatePosition(section.pos || {}, parentContext, size);
      this.applyTransform(group, sectionPosMM, sectionPivotMM, section.rot || {});
    } else {
      console.log('📐 [buildSection] Корневая секция: НЕ применяем transform, позиция (0,0,0)');
    }

    // ⭐ ВАЖНО: Для выражений s:x, s:y, s:z детали должны ссылаться на КОРНЕВУЮ секцию (rootSection),
    // а не на текущую секцию. Текущая секция используется только для позиционирования.
    // ВСЕГДА используем rootSectionContext для выражений s:x, s:y, s:z
    const sectionContextForExpressions = this.rootSectionContext || {
      size: { ...size },
      position: { x: 0, y: 0, z: 0 },
      pivot: sectionPivotMM,
      parent: null,
      name: section.name || '',
    };
    
    const sectionContext = {
      size: { ...size },
      position: { x: 0, y: 0, z: 0 },
      pivot: sectionPivotMM, // Сохраняем pivot секции для контекста
      parent: parentContext,
      name: section.name || '',
    };

    // Обрабатываем детей
    if (Array.isArray(section.children)) {
      console.log('📦 [buildSection] Обрабатываем', section.children.length, 'детей секции:', section.name);
      console.log('📍 Начало координат секции: back-left-bottom (задний-левый-нижний угол)');
      section.children.forEach((child, index) => {
        console.log(`  [${index + 1}] Ребёнок:`, child.type, child.name, {
          pos_из_JSON: child.pos,
          pivot_из_JSON: child.pivot,
          size_из_JSON: child.size
        });
        // ⭐ ВАЖНО: Для деталей используем rootSection для выражений s:x, s:y, s:z
        // Для вложенных секций используем текущую секцию
        const contextForChild = child.type === 'section' ? sectionContext : sectionContextForExpressions;
        const built = this.buildItem(child, contextForChild);
        if (built) {
          group.add(built);
          // Логируем финальную позицию детали относительно секции
          const childPos = built.position;
          console.log(`  ✅ Ребёнок [${index + 1}] добавлен в группу, позиция относительно секции (м):`, {
            x: childPos.x,
            y: childPos.y,
            z: childPos.z
          }, `(${childPos.x * 1000}мм, ${childPos.y * 1000}мм, ${childPos.z * 1000}мм)`);
        } else {
          console.warn(`  ⚠️ Ребёнок [${index + 1}] не был построен`);
        }
      });
    } else {
      console.warn('⚠️ [buildSection] У секции нет массива children:', section.name);
    }

    console.log('✅ [buildSection] Секция построена:', section.name, 'детей в группе:', group.children.length);
    return group;
  }

  // Wall builder: строит Mesh из wall элемента (как в оригинальном ClodisBuilder)
  buildWall(wall, context) {
    const wallName = wall.name || 'wall';
    console.log('🧱 [buildWall] Создаём стену:', wallName);

    if (!wall.spec) {
      console.warn('⚠️ [buildWall] У стены нет spec:', wallName);
      return null;
    }

    // ⭐ ВАЖНО: evaluateSize возвращает размеры в МЕТРАХ (как в оригинале, несмотря на комментарии)
    const size = this.evaluateSize(wall.size || {}, context);
    
    // ⭐ ВАЖНО: evaluatePosition возвращает размеры в МИЛЛИМЕТРАХ
    const posMM = this.evaluatePosition(wall.pos || {}, context, size);

    // Получаем толщину материала из spec (в миллиметрах)
    const materialThicknessMM = this.getMaterialThickness(wall.spec?.material);
    const materialThickness = materialThicknessMM / 1000; // Конвертируем в метры
    const orientation = wall.spec?.orientation || 'h'; // 'v' vertical, 'h' horizontal, 'f' front

    // ⭐ ВАЖНО: Создаем геометрию на основе size (в метрах) и thickness (в метрах)
    // Для разных ориентаций используем разные размеры (как в оригинале)
    let geometry;
    if (orientation === 'v') {
      // Вертикальная стена: size.x = толщина материала (в метрах), size.y = высота, size.z = глубина
      // В оригинале для вертикальной стены size.x уже содержит толщину, но в JSON это s:x
      // Поэтому используем thickness для x, size.y для высоты, size.z для глубины
      geometry = new THREE.BoxGeometry(materialThickness, size.y, size.z);
    } else if (orientation === 'h') {
      // Горизонтальная стена: size.x = ширина, size.z = глубина, thickness = высота
      geometry = new THREE.BoxGeometry(size.x, materialThickness, size.z);
    } else if (orientation === 'f') {
      // Фасадная стена: size.x = ширина, size.y = высота, thickness = глубина
      geometry = new THREE.BoxGeometry(size.x, size.y, materialThickness);
    } else {
      // По умолчанию используем вычисленные размеры
      geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      metalness: 0.1,
      roughness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // ⭐ ВАЖНО: Pivot должен вычисляться на основе размеров ГЕОМЕТРИИ, а не size из JSON!
    // Для разных ориентаций геометрия имеет разные размеры
    const geometrySizeForPivot = {
      x: geometry.parameters.width,
      y: geometry.parameters.height,
      z: geometry.parameters.depth
    };
    const pivotMM = this.evaluatePivot(wall.pivot || {}, geometrySizeForPivot);
    
    console.log('🔍 [buildWall] Позиционирование:', wallName, {
      size_из_JSON_метры: size,
      size_из_JSON_мм: { x: size.x * 1000, y: size.y * 1000, z: size.z * 1000 },
      geometrySize_метры: geometrySizeForPivot,
      geometrySize_мм: {
        width: geometrySizeForPivot.x * 1000,
        height: geometrySizeForPivot.y * 1000,
        depth: geometrySizeForPivot.z * 1000
      },
      posMM: posMM,
      pivotMM: pivotMM,
      orientation: orientation,
      thickness_мм: materialThicknessMM
    });
    
    this.applyTransform(mesh, posMM, pivotMM, wall.rot || {});
    
    mesh.userData.isWall = true;
    mesh.userData.wallName = wallName;
    mesh.userData.orientation = orientation;

    console.log('✅ [buildWall] Стенa создана:', wallName, {
      finalPosition: {
        x: mesh.position.x * 1000, // в мм
        y: mesh.position.y * 1000, // в мм
        z: mesh.position.z * 1000 // в мм
      }
    });

    // Обрабатываем детей стены (если есть)
    if (Array.isArray(wall.children)) {
      wall.children.forEach(child => {
        const built = this.buildItem(child, context);
        if (built) {
          mesh.add(built);
        }
      });
    }

    return mesh;
  }

  // Facade builder: строит Mesh из facade элемента
  buildFacade(facade, context) {
    const facadeName = facade.name || 'facade';
    console.log('🚪 [buildFacade] Создаём фасад:', facadeName);

    // ⭐ ВАЖНО: evaluateSize возвращает размеры в МЕТРАХ
    const size = this.evaluateSize(facade.size || {}, context);
    
    // Проверяем поворот фасада
    const rotX = parseFloat(facade.rot?.x || '0');
    const rotY = parseFloat(facade.rot?.y || '0');
    const rotZ = parseFloat(facade.rot?.z || '0');
    const hasRotation = rotX !== 0 || rotY !== 0 || rotZ !== 0;
    
    // Определяем толщину (для логирования и вертикальных фасадов)
    let thickness = 0.016; // По умолчанию 16мм для фасадов
    
    // Определяем размеры геометрии в зависимости от поворота
    let geometry;
    if (hasRotation && rotX === 90) {
      // ⭐ ТОП (поворот на 90° вокруг X): фасад лежит горизонтально на верхней грани
      // 
      // В JSON топа:
      // - size.x = "s:x" - ширина секции (вдоль X)
      // - size.y = "s:z+16" - глубина панели (глубина секции + выступ 16мм) = ГЛУБИНА топа после поворота
      // - size.z = "s:z" - глубина секции (это НЕ толщина! Это высота топа после поворота)
      //
      // ⚠️ ПРОБЛЕМА: size.y и size.z почти одинаковые (разница 16мм), но они имеют РАЗНОЕ значение:
      //   - size.y = s:z+16 - это ГЛУБИНА панели (вперед/назад)
      //   - size.z = s:z - это ВЫСОТА панели (вверх/вниз после поворота)
      //
      // Для топа ПОСЛЕ поворота на 90° вокруг X:
      // - Ширина (X): size.x (ширина секции) - НЕ меняется
      // - Высота (Y): size.z (s:z - глубина секции) - была ось Z до поворота
      // - Глубина (Z): size.y (s:z+16 - глубина секции + выступ) - была ось Y до поворота
      // - Толщина панели: стандартная 16мм
      //
      // Но мы создаем геометрию ДО поворота:
      // BoxGeometry(width, height, depth) где:
      // - width (X): size.x - НЕ меняется при повороте
      // - height (Y ДО поворота): толщина панели (16мм)
      // - depth (Z ДО поворота): size.y (s:z+16) - становится height ПОСЛЕ поворота
      //
      // НО! После поворота на 90° вокруг X:
      // - height (Y) становится depth (Z)
      // - depth (Z) становится height (Y) с инверсией
      //
      // Правильная геометрия ДО поворота:
      // BoxGeometry(size.x, size.y, thickness) где:
      // - width = size.x (ширина)
      // - height = size.y = s:z+16 (глубина панели - станет depth после поворота)
      // - depth = thickness = 16мм (толщина - станет height после поворота)
      //
      // НЕТ! Это неправильно. Нужно подумать по-другому.
      //
      // Правильная геометрия: BoxGeometry(ширина, ТОЛЩИНА, глубина)
      // ДО поворота: BoxGeometry(size.x, толщина=16мм, size.y=s:z+16)
      // После поворота на 90° вокруг X: height и depth меняются местами
      //   - width остается size.x
      //   - height становится size.y (s:z+16)
      //   - depth становится толщина (16мм)
      //
      // Но это дает неправильную ориентацию! Нужно:
      // BoxGeometry(size.x, size.z, size.y) - где size.z это высота, size.y это глубина
      // После поворота: height и depth меняются местами
      
      const topThickness = 0.016; // Стандартная толщина верхней панели 16мм
      
      // ⭐ ТОП после поворота на 90° вокруг X должен иметь:
      // - Ширина (X): size.x (ширина секции) - НЕ меняется
      // - Высота (Y): topThickness (16мм - толщина панели)
      // - Глубина (Z): size.y = s:z+16 (глубина секции + выступ 16мм)
      //
      // ⚠️ ВАЖНО: В JSON топа size.y = "s:z+16" - это глубина панели ПОСЛЕ поворота
      //            size.z = "s:z" - это высота панели ПОСЛЕ поворота (но мы не используем её, используем topThickness)
      //
      // Геометрия ДО поворота: BoxGeometry(width, height, depth)
      // После поворота на 90° вокруг X: 
      //   - width (X) остается width (X)
      //   - height (Y) становится -depth (Z) 
      //   - depth (Z) становится height (Y)
      //
      // Чтобы ПОСЛЕ поворота получить:
      //   - height (Y) = topThickness
      //   - depth (Z) = size.y (s:z+16)
      // Нужно ДО поворота создать:
      //   - height = size.y (s:z+16) - станет depth после поворота
      //   - depth = topThickness - станет height после поворота (но с инверсией знака)
      //
      // ⚠️ НО! Three.js поворачивает вокруг локальной оси, поэтому нужно учесть знак
      // После поворота на 90° вокруг X: height → -depth, depth → height
      // Поэтому: height ДО = depth ПОСЛЕ = size.y, depth ДО = height ПОСЛЕ = topThickness
      //
      geometry = new THREE.BoxGeometry(size.x, size.y, topThickness);
      thickness = topThickness; // Для логирования
      
      console.log('🔧 [buildFacade] Топ: геометрия с поворотом 90° вокруг X', {
        size_из_JSON_мм: {
          x: size.x * 1000,
          y: size.y * 1000,
          z: size.z * 1000
        },
        размеры_геометрии_ДО_поворота_мм: {
          width: size.x * 1000,
          height: size.y * 1000,  // s:z+16 (глубина панели)
          depth: topThickness * 1000  // 16мм (толщина)
        },
        размеры_геометрии_ПОСЛЕ_поворота_90_X_мм: {
          width: size.x * 1000,  // X остается X
          height: topThickness * 1000,  // depth (толщина) → height
          depth: size.y * 1000   // height (s:z+16) → depth
        },
        примечание: 'size.z (s:z) НЕ используется в геометрии, только size.y (s:z+16)'
      });
    } else {
      // ⭐ ВЕРТИКАЛЬНЫЙ ФАСАД (цоколь, дверь и т.д.): без поворота или другой поворот
      // size.x = ширина, size.y = высота, size.z не используется (используем стандартную толщину)
      // Но проверяем: если size.z задан и это небольшое значение (< 0.1м), это может быть толщина
      if (size.z > 0 && size.z < 0.1) {
        thickness = size.z;
      }
      geometry = new THREE.BoxGeometry(size.x, size.y, thickness);
      console.log('🔧 [buildFacade] Вертикальный фасад', {
        размеры: { width: size.x, height: size.y, depth: thickness },
        размеры_в_мм: {
          width: size.x * 1000,
          height: size.y * 1000,
          depth: thickness * 1000
        }
      });
    }
    const material = new THREE.MeshStandardMaterial({
      color: 0x654321,
      metalness: 0.2,
      roughness: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // ⭐ ВАЖНО: evaluatePosition и evaluatePivot возвращают миллиметры
    // В оригинальном ClodisBuilder позиция и pivot указаны для состояния ДО поворота!
    // applyTransform сначала применяет позицию и pivot, а потом поворачивает объект
    
    // Размеры геометрии для вычисления pivot (в метрах, как создана геометрия)
    const geometrySizeForPivot = {
      x: geometry.parameters.width,
      y: geometry.parameters.height,
      z: geometry.parameters.depth
    };
    
    // Позиция вычисляется для состояния ДО поворота (как в оригинале)
    const posMM = this.evaluatePosition(facade.pos || {}, context, size);
    
    // ⭐ ВАЖНО: ЛОГИКА ДЛЯ ФРОНТАЛЬНЫХ ФАСАДОВ:
    // 1. Фронтальный фасад привязывается к нижнему ближнему левому углу СЕКЦИИ (front-left-bottom)
    // 2. Pivot фасада указывает на ближний левый нижний угол ФАСАДА (front-left-bottom фасада)
    // 3. После поворота на 90°: толщина становится глубиной, и наоборот
    //
    // Для фронтальных фасадов (без поворота): pivot.z = 1 (ближний угол)
    // Для топа (с поворотом 90° вокруг X): pivot тоже должен быть для ближнего угла ДО поворота
    
    let facadePivot = facade.pivot || {};
    
    if (hasRotation && rotX === 90) {
      // ⭐ ТОП с поворотом на 90° вокруг X:
      // Фронтальный фасад привязывается к нижнему ближнему левому углу секции
      // Pivot указывает на ближний левый нижний угол фасада ДО поворота
      // После поворота: толщина (depth) становится высотой (height), глубина (height) становится глубиной (depth)
      // Для топа pivot должен быть: x=-1 (левый), y=-1 (нижний), z=1 (ближний ДО поворота, который станет верхним ПОСЛЕ поворота)
      facadePivot = { x: -1, y: -1, z: 1 };
      console.log('🔄 [buildFacade] Топ: устанавливаем pivot для поворота 90° вокруг X:', {
        facadeName,
        pivot: facadePivot,
        примечание: 'x=-1 (левый), y=-1 (нижний), z=1 (ближний ДО поворота)'
      });
    } else {
      // ⭐ ВЕРТИКАЛЬНЫЙ ФРОНТАЛЬНЫЙ ФАСАД (цоколь, дверь):
      // Определяем, является ли фасад фронтальным (стоит спереди секции)
      const sectionZ = context?.size?.z ? context.size.z * 1000 : 0; // в мм
      const facadeZ = posMM.z;
      // ⭐ ВАЖНО: Для цоколя pos.z = "s:z-16" означает позицию на передней грани (s:z - 16мм)
      // Если sectionZ = 400мм, то facadeZ = 384мм, что близко к передней грани (400мм)
      const isFrontal = facadeZ > sectionZ * 0.7; // Если фасад стоит в передней трети секции
      
      if (isFrontal) {
        // Для фронтальных фасадов pivot.z должен быть 1 (ближний угол)
        // Это означает, что фасад привязывается к передней грани секции
        facadePivot = { x: -1, y: -1, z: 1 }; // front-left-bottom
        console.log('🔄 [buildFacade] Фронтальный фасад обнаружен, устанавливаем pivot:', {
          facadeName,
          facadeZ_мм: facadeZ,
          sectionZ_мм: sectionZ,
          isFrontal,
          pivot: facadePivot,
          примечание: 'pivot.z = 1 означает привязку к передней грани (ближний угол)'
        });
      } else {
        // Для не-фронтальных фасадов используем pivot из JSON или дефолтный
        facadePivot = facadePivot.z !== undefined ? facadePivot : { x: -1, y: -1, z: -1 };
        console.log('🔄 [buildFacade] Не-фронтальный фасад:', {
          facadeName,
          facadeZ_мм: facadeZ,
          sectionZ_мм: sectionZ,
          isFrontal,
          pivot: facadePivot
        });
      }
    }
    
    // Pivot вычисляется на основе размеров геометрии ДО поворота
    const pivotMM = this.evaluatePivot(facadePivot, geometrySizeForPivot);
    
    console.log('🔧 [buildFacade] Позиционирование фасада:', facadeName, {
      размеры_геометрии_м: geometrySizeForPivot,
      pos_из_JSON_мм: posMM,
      pivot_из_JSON: facade.pivot,
      pivot_скорректированный: facadePivot,
      pivot_мм: pivotMM,
      rotation: facade.rot,
      примечание: 'Для фронтальных фасадов pivot.z = 1 (ближний угол)'
    });
    
    // ⭐ ВАЖНО: Используем applyTransform для правильного позиционирования с pivot и rotation
    // applyTransform сначала применяет позицию и pivot, а потом поворачивает
    this.applyTransform(mesh, posMM, pivotMM, facade.rot || {});
    
    mesh.userData.isFacade = true;
    mesh.userData.facadeName = facadeName;

    // Конвертируем size в миллиметры для логирования
    const sizeMM = {
      x: size.x * 1000,
      y: size.y * 1000,
      z: size.z * 1000
    };

    console.log('✅ [buildFacade] Фасад создан:', facadeName, {
      sizeMM,
      posMM,
      pivotMM,
      rotation: facade.rot,
      thickness_м: thickness,
      thickness_мм: thickness * 1000,
      geometrySize: {
        width: geometry.parameters.width,
        height: geometry.parameters.height,
        depth: geometry.parameters.depth
      },
      finalPosition: {
        x: mesh.position.x * 1000,
        y: mesh.position.y * 1000,
        z: mesh.position.z * 1000
      }
    });

    return mesh;
  }

  // Module builder: упрощённая поддержка модулей (двери, опоры и т.п.)
  // В Clodis module часто используется как «вложенный элемент каталога».
  // ⭐ ВАЖНО: Если у модуля есть spec.id или spec.element_type, пытаемся загрузить его JSON из каталога
  buildModule(module, context) {
    const moduleName = module.name || 'module';
    console.log('📦 [buildModule] Создаём модуль:', moduleName, {
      size: module.size,
      pos: module.pos,
      pivot: module.pivot,
      spec: module.spec,
    });

    // ⭐ ВАЖНО: Если у модуля есть spec.id или spec.element_type, пытаемся загрузить его JSON из каталога
    // и обработать его как секцию с деталями
    if (this.catalogLoader && module.spec) {
      const moduleId = module.spec.id;
      const elementType = module.spec.element_type;
      
      if (moduleId || elementType) {
        try {
          console.log('🔄 [buildModule] Пытаемся загрузить JSON модуля из каталога:', { moduleId, elementType });
          const moduleDataPromise = this.catalogLoader(moduleId || '', elementType);
          
          // ⚠️ ВАЖНО: catalogLoader теперь может быть асинхронным, но buildItem синхронный
          // Поэтому мы не можем await здесь. Вместо этого строим как простой куб сейчас,
          // а загрузку модулей нужно делать заранее перед вызовом buildFromJSON
          if (moduleDataPromise && typeof moduleDataPromise.then === 'function') {
            // Это Promise - мы не можем его await здесь, строим как простой куб
            console.warn('⚠️ [buildModule] catalogLoader возвращает Promise, но buildItem синхронный.');
            console.warn('⚠️ [buildModule] Модули должны быть загружены заранее перед вызовом buildFromJSON.');
            console.warn('⚠️ [buildModule] Строим модуль как простой куб. Загрузите модули заранее или используйте синхронный catalogLoader.');
          } else {
            // Это синхронный результат
            const moduleData = moduleDataPromise;
            const moduleTree =
              (moduleData?.clodisJSON && Array.isArray(moduleData.clodisJSON) && moduleData.clodisJSON.length > 0
                ? moduleData.clodisJSON
                : null);
            if (moduleTree) {
              console.log('✅ [buildModule] JSON модуля загружен из каталога, обрабатываем как секцию:', moduleName);
              // Обрабатываем первый элемент из clodisJSON как секцию
              const moduleJSON = moduleTree[0];
              if (moduleJSON.type === 'section' || (moduleJSON.children && moduleJSON.children.length > 0)) {
                // Объединяем размеры и позицию из текущего модуля с деталями из загруженного JSON
                const mergedJSON = {
                  ...moduleJSON,
                  size: module.size || moduleJSON.size,
                  pos: module.pos || moduleJSON.pos,
                  pivot: module.pivot || moduleJSON.pivot,
                  rot: module.rot || moduleJSON.rot,
                };
                return this.buildSection(mergedJSON, context);
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ [buildModule] Не удалось загрузить JSON модуля из каталога, строим как простой куб:', error);
        }
      }
    }

    // Размеры в метрах
    const size = this.evaluateSize(module.size || {}, context);
    if (!size || !isFinite(size.x) || !isFinite(size.y) || !isFinite(size.z)) {
      console.warn('⚠️ [buildModule] Некорректные размеры модуля, пропускаем:', moduleName, size);
      return null;
    }

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);

    // Цвет: отличаем модули (двери/опоры) от стен
    const material = new THREE.MeshStandardMaterial({
      color: 0xa67c52, // немного другой оттенок дерева
      metalness: 0.15,
      roughness: 0.75,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Позиция и pivot
    const posMM = this.evaluatePosition(module.pos || {}, context, size);
    const pivotMM = this.evaluatePivot(module.pivot || {}, {
      x: geometry.parameters.width,
      y: geometry.parameters.height,
      z: geometry.parameters.depth,
    });

    console.log('📍 [buildModule] Позиционирование модуля:', moduleName, {
      size_m: size,
      size_mm: { x: size.x * 1000, y: size.y * 1000, z: size.z * 1000 },
      posMM,
      pivotMM,
    });

    this.applyTransform(mesh, posMM, pivotMM, module.rot || {});

    mesh.userData.isModule = true;
    mesh.userData.moduleName = moduleName;
    mesh.userData.elementType = module.spec?.element_type || null;

    console.log('✅ [buildModule] Модуль создан:', moduleName, {
      finalPosition: {
        x: mesh.position.x * 1000,
        y: mesh.position.y * 1000,
        z: mesh.position.z * 1000,
      },
    });

    return mesh;
  }

  // Detail builder: прямоугольный параллелепипед по size & pos с поддержкой выражений
  buildDetail(detail, context) {
    // ⭐ ВАЖНО: evaluateSize возвращает размеры в МЕТРАХ
    const size = this.evaluateSize(detail.size || {}, context);
    
    // ⭐ ВАЖНО: evaluatePosition и evaluatePivot возвращают миллиметры
    const posMM = this.evaluatePosition(detail.pos || {}, context, size);
    const pivotMM = this.evaluatePivot(detail.pivot || {}, size);

    console.log('🔧 [buildDetail] Деталь:', detail.name, {
      size_метры: size,
      size_мм: { x: size.x * 1000, y: size.y * 1000, z: size.z * 1000 },
      posMM: posMM,
      pivotMM: pivotMM
    });

    // Проверяем, что размеры не нулевые
    if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
      console.warn('⚠️ [buildDetail] Нулевые или отрицательные размеры детали:', detail.name, size);
    }

    // Создаем геометрию (размеры уже в метрах)
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.1,
      roughness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // ⭐ ВАЖНО: Используем applyTransform для правильного позиционирования с pivot и rotation
    this.applyTransform(mesh, posMM, pivotMM, detail.rot || {});
    
    mesh.userData.isDetail = true;
    mesh.userData.detailName = detail.name || '';

    console.log('✅ [buildDetail] Деталь создана:', detail.name, 'размеры (м):', size);

    return mesh;
  }

  // ⭐ ВАЖНО: Методы позиционирования как в оригинальном ClodisBuilder
  
  // Evaluate size expressions (s:x, v:variable, numeric values)
  // ⭐ ВАЖНО: Возвращает размеры в МЕТРАХ (как в оригинале, несмотря на комментарии о миллиметрах)
  evaluateSize(sizeObj, context) {
    const result = { x: 0, y: 0, z: 0 };
    
    // ⭐ ВАЖНО: evaluateExpression ожидает миллиметры в контексте
    // context.size в метрах, конвертируем в миллиметры для evaluateExpression
    const ctx = {
      sectionX: context?.size?.x ? (context.size.x * 1000).toString() : '0',
      sectionY: context?.size?.y ? (context.size.y * 1000).toString() : '0',
      sectionZ: context?.size?.z ? (context.size.z * 1000).toString() : '0',
    };

    ['x', 'y', 'z'].forEach(axis => {
      const value = sizeObj?.[axis];
      if (value === undefined) {
        // Если значение не указано, используем размер из контекста (уже в метрах)
        result[axis] = context?.size?.[axis] || 0;
      } else if (typeof value === 'number') {
        // Число в миллиметрах, конвертируем в метры
        result[axis] = value / 1000;
      } else if (typeof value === 'string') {
        // Выражение возвращает миллиметры, конвертируем в метры
        const evaluatedMM = evaluateExpression(value, ctx);
        result[axis] = evaluatedMM / 1000;
      }
    });

    return result;
  }
  
  // Evaluate position (returns in millimeters)
  evaluatePosition(posObj, context, size) {
    const result = { x: 0, y: 0, z: 0 };
    
    // ⭐ ВАЖНО: evaluateExpression ожидает миллиметры в контексте
    // context.size в метрах, конвертируем в миллиметры для evaluateExpression
    const ctx = {
      sectionX: context?.size?.x ? (context.size.x * 1000).toString() : '0',
      sectionY: context?.size?.y ? (context.size.y * 1000).toString() : '0',
      sectionZ: context?.size?.z ? (context.size.z * 1000).toString() : '0',
    };

    ['x', 'y', 'z'].forEach(axis => {
      const value = posObj?.[axis];
      if (value === undefined) {
        result[axis] = 0;
      } else if (typeof value === 'number') {
        result[axis] = value; // Keep in millimeters
      } else if (typeof value === 'string') {
        result[axis] = evaluateExpression(value, ctx); // Returns value in mm
      }
    });

    return result;
  }

  // Evaluate pivot (-1 = min, 0 = center, 1 = max)
  // ⭐ ВАЖНО: size в МЕТРАХ, возвращает offset в МИЛЛИМЕТРАХ
  evaluatePivot(pivotObj, size) {
    const result = { x: 0, y: 0, z: 0 };

    ['x', 'y', 'z'].forEach(axis => {
      const value = pivotObj?.[axis];
      if (value === -1) {
        // size в метрах, конвертируем в миллиметры для результата
        result[axis] = -(size[axis] * 1000) / 2; // Back/left/bottom
      } else if (value === 1) {
        result[axis] = (size[axis] * 1000) / 2; // Front/right/top
      } else {
        result[axis] = 0; // Center
      }
    });

    return result;
  }

  // Apply transform (position, pivot, rotation)
  // position and pivot are in millimeters, convert to meters for Three.js
  // ⭐ ВАЖНО: Позиция и pivot в JSON указаны для ФИНАЛЬНОГО состояния (после поворота)
  // Поэтому применяем их напрямую, как в оригинальном ClodisBuilder
  applyTransform(object, positionMM, pivotMM, rotation) {
    // Convert to meters
    const positionM = {
      x: positionMM.x / 1000,
      y: positionMM.y / 1000,
      z: positionMM.z / 1000,
    };
    const pivotM = {
      x: pivotMM.x / 1000,
      y: pivotMM.y / 1000,
      z: pivotMM.z / 1000,
    };

    // Apply pivot offset: position - pivot
    // ⭐ ВАЖНО: Позиция уже указана для финального состояния, pivot тоже
    // Никаких трансформаций не нужно - просто вычитаем pivot из позиции
    object.position.set(
      positionM.x - pivotM.x,
      positionM.y - pivotM.y,
      positionM.z - pivotM.z
    );

    // Apply rotation (convert degrees to radians)
    // ⭐ РЕФЕРЕНС: main_core_v2_part18.js:2674-2677 — rotateX(-deg2rad(rotX)), т.е. ОТРИЦАТЕЛЬНЫЙ знак
    // Референс: h['rotateX'](-deg2rad(k)), h['rotateY'](-deg2rad(l)), h['rotateZ'](-deg2rad(m))
    if (rotation) {
      const degToRad = (v: number | string | undefined): number => {
        if (v === undefined) return 0;
        const n = typeof v === 'number' ? v : (typeof v === 'string' && v !== '' ? parseFloat(v) : 0);
        return THREE.MathUtils.degToRad(-n); // минус как в референсе
      };
      object.rotation.set(
        degToRad(rotation.x),
        degToRad(rotation.y),
        degToRad(rotation.z)
      );
    }
  }

  // Get material thickness from material spec (returns in millimeters)
  getMaterialThickness(material) {
    if (!material) return 16; // Default 16mm

    // Check if thickness is locked
    if (material.thickness_lock) {
      return material.thickness_lock; // Already in millimeters
    }

    // Get from group
    if (material.group && this.groups[material.group]) {
      return this.groups[material.group].thickness || 16; // Already in millimeters
    }

    return 16; // Default 16mm
  }
}


