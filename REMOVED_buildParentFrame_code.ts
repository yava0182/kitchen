// ⚠️ УДАЛЕННЫЙ КОД - НЕ ИСПОЛЬЗУЕТСЯ В ПРОЕКТЕ
// Этот файл содержит код, который был удален из constructor.ts
// Функция buildParentFrame и все её вызовы

// ============================================
// ФУНКЦИИ make_cube и make_edges
// ============================================
// Функции make_cube и make_edges из референса Clodis (main_core_v2_part16.js)
// В референсе используется BoxBufferGeometry, но в Three.js 0.160.0 нужно использовать BoxGeometry
function make_cube(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  // В Three.js 0.160.0 BoxGeometry работает для всех случаев
  // BoxBufferGeometry был объединен с BoxGeometry
  const geometry = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(geometry, material);
}

function make_edges(w: number, h: number, d: number, material?: THREE.LineBasicMaterial): THREE.LineSegments {
  const edgeMaterial = material || new THREE.LineBasicMaterial({
    color: 0xff0000
  });
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    edgeMaterial
  );
  edges.computeLineDistances();
  return edges;
}

// ============================================
// ФУНКЦИЯ buildParentFrame
// ============================================
// Создает зелёный hull (0x96c296) и чёрные edges (0x000000)
function buildParentFrame(w: number, h: number, d: number) {
  // w, h, d уже в метрах (приходят из addBox, где делятся на 1000)
  const group = new THREE.Group();
  group.name = '__helpers'; // как в Clodis

  // Используем визуальные размеры (минимум для Three.js)
  // getVisualSize ожидает размеры в миллиметрах, поэтому конвертируем
  const units = 1000; // миллиметры в метры
  const w_mm = w * units; // конвертируем в мм для getVisualSize
  const h_mm = h * units;
  const d_mm = d * units;
  const visual = getVisualSize(w_mm, h_mm, d_mm);
  // Обратно в метры для создания геометрии (как в Clodis)
  const w_m = visual.w / units;
  const h_m = visual.h / units;
  const d_m = visual.d / units;
  
  console.log('🔷 [buildParentFrame] Размеры:', { w, h, d, w_m, h_m, d_m });

  // Проверяем, что размеры не нулевые
  if (w_m <= 0 || h_m <= 0 || d_m <= 0) {
    console.error('❌ [buildParentFrame] Нулевые или отрицательные размеры!', { w_m, h_m, d_m });
    return group; // Возвращаем пустую группу
  }

  // Semi-transparent hull - как в Clodis _build_helpers (part18.js, строка 2865)
  // Используем make_cube из референса (создает BoxGeometry, который центрирован)
  // Цвет и поведение как в референсе:
  // - базовый вариант Section: #96c296, прозрачный, без depthTest/write
  // - в CabinetSection используется материал helper_cube, визуально очень похожий
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0x96c296,          // мягкий зеленоватый, как в Clodis
    transparent: true,
    opacity: 0.15,            // лёгкая заливка (в референсе helpers почти прозрачные)
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
  });
  const hull = make_cube(w_m, h_m, d_m, hullMaterial);
  
  // Устанавливаем свойства как в референсе (part18.js, строки 2866-2871)
  (hull.userData as any).is_helper = true;
  (hull.userData as any).no_edges = true;
  hull.renderOrder = 10; // как в референсе (строка 2869)
  // НЕ используем layers.set(1) - это может скрыть объект, если камера не на layer 1
  // hull.layers.set(1); // Закомментировано - может скрывать объект
  
  // В Clodis геометрия центрирована (BoxGeometry создается от центра)
  // Но позиционирование происходит через own_object.position
  // У нас система координат back-left-bottom, поэтому смещаем mesh
  // чтобы нижний левый дальний угол был в (0,0,0)
  // Смещение = половина размера в метрах
  hull.position.set(w_m / 2, h_m / 2, d_m / 2);
  hull.visible = true; // Явно делаем видимым
  group.add(hull);
  // В spirit Clodis: сохраняем ссылку на объемный helper
  (group.userData as any).size_volume = hull;
  console.log('✅ [buildParentFrame] Hull создан:', { position: hull.position, visible: hull.visible, material: hullMaterial });

  // Edges - как в Clodis _build_helpers (part18.js, строка 2873)
  // Используем make_edges из референса (создает EdgesGeometry от BoxGeometry, который центрирован)
  // Рамка как в базовом build_helpers: чёрная линия, без depthTest
  const edgesMaterial = new THREE.LineBasicMaterial({ 
    color: 0x000000,
    linewidth: 1,
    depthTest: false,
  });
  const edges = make_edges(w_m, h_m, d_m, edgesMaterial);
  
  // Устанавливаем свойства как в референсе (part18.js, строки 2874-2878)
  (edges.userData as any).is_helper = true;
  (edges.userData as any).no_edges = true;
  edges.renderOrder = 11; // как в референсе (строка 2877)
  // НЕ используем layers.set(1) - это может скрыть объект, если камера не на layer 1
  // edges.layers.set(1); // Закомментировано - может скрывать объект
  
  // Смещаем edges так же, как hull (в метрах)
  edges.position.set(w_m / 2, h_m / 2, d_m / 2);
  edges.visible = true; // Явно делаем видимым
  group.add(edges);
  // Сохраняем ссылку на рамку
  (group.userData as any).edges = edges;
  console.log('✅ [buildParentFrame] Edges созданы:', { position: edges.position, visible: edges.visible });

  // Origin axes marker - в начале координат (0,0,0) = нижний левый дальний угол
  // Размер в метрах для согласованности
  const axisSize_m = Math.min(w_m, h_m, d_m) * 0.4 || 0.0004; // минимум 0.4 мм = 0.0004 м
  const axisHelper = new THREE.AxesHelper(axisSize_m);
  axisHelper.position.set(0, 0, 0);
  axisHelper.visible = true;
  group.add(axisHelper);
  (group.userData as any).axes = axisHelper;

  group.visible = true; // Явно делаем группу видимой
  console.log('✅ [buildParentFrame] Frame создан:', { 
    children: group.children.length, 
    visible: group.visible,
    hullVisible: hull.visible,
    edgesVisible: edges.visible
  });

  return group;
}

// ============================================
// ВЫЗОВЫ buildParentFrame (удалены из кода)
// ============================================

// 1. Строка 941 - в addBox() - создание секции
//   const frame = buildParentFrame(w, h, d);
//   parent.add(frame);

// 2. Строка 1112 - обновление рамки секции
//   const newFrame = buildParentFrame(newWidth, newHeight, newDepth);
//   rootSection.group.add(newFrame);

// 3. Строка 1170 - в addShelf() - создание полки
//   const frame = buildParentFrame(w, h, d);
//   parent.add(frame);

// 4. Строка 1884 - создание дочерней секции
//   const frame = buildParentFrame(parentSize.x, parentSize.y, parentSize.z);
//   sectionGroup.add(frame);

// 5. Строка 3349 - createSection() - создание секции
//   const frame = buildParentFrame(parentSize.x, parentSize.y, parentSize.z);
//   sectionGroup.add(frame);

// 6. Строка 5498 - applySectionProperties() - обновление секции
//   const newFrame = buildParentFrame(newWidth, newHeight, newDepth);
//   frameGroup.add(...newFrame.children);

// 7. Строка 5503 - applySectionProperties() - создание новой рамки
//   const newFrame = buildParentFrame(newWidth, newHeight, newDepth);
//   currentSelectedNode.group.add(newFrame);
