// Furniture class - represents furniture with pivot at back-left-bottom (CAD axiom)
// After loading/creating mesh: compute Box3, shift children by -bbox.min
// Pivot group = back-left-bottom, y rests on floor: pos.y = -bbox.min.y

class Furniture {
  constructor(clodisData = null, params = {}) {
    this.group = new THREE.Group();
    // Помечаем корневую группу как мебель, чтобы отличать её от стен/комнаты.
    this.group.userData.isFurniture = true;
    this.bbox = new THREE.Box3();
    this.meshes = [];

    // Флаг для отката: если true, используем старую логику setupPivot
    // Если false (по умолчанию для Clodis), пропускаем setupPivot
    this.useLegacySetupPivot = params.useLegacySetupPivot !== undefined ? params.useLegacySetupPivot : false;
    this.isClodisFurniture = clodisData !== null;
    this.placementKind = params.placementKind || null;
    this.productKind = params.productKind || null;

    if (clodisData) {
      // Build from Clodis JSON structure
      this.buildFromClodis(clodisData, params);
    } else if (!params.skipPlaceholder) {
      // Create placeholder box only if not skipped (for GLB loading)
      this.createPlaceholder();
    }

    // Setup pivot to back-left-bottom
    // ВАЖНО: Для Clodis-секций детали уже позиционированы правильно относительно начала координат секции (back-left-bottom = 0,0,0)
    // Поэтому setupPivot не нужен - он только сломает правильное позиционирование
    // Для GLB и других источников setupPivot нужен
    if (this.useLegacySetupPivot || !this.isClodisFurniture) {
      console.log('🔧 Используем setupPivot (legacy или не Clodis)');
    this.setupPivot();
    } else {
      console.log('✅ Пропускаем setupPivot для Clodis-секции (детали уже позиционированы правильно)');
      // Вычисляем bbox только по реальным мешам (без debug-маркеров pivot/bbox).
      // Box3.setFromObject в Three.js r160 обходит ВСЕ объекты включая invisible,
      // поэтому фильтруем вручную.
      this.group.position.set(0, 0, 0);
      this.group.rotation.set(0, 0, 0);
      this.group.scale.set(1, 1, 1);
      this.group.updateMatrixWorld(true);
      this.bbox.makeEmpty();
      this.group.traverse((child) => {
        const ud = child.userData || {};
        if (
          child.isMesh &&
          !child.isBoxHelper &&
          !child.name.includes('PivotMarker') &&
          !child.name.includes('BBox') &&
          !ud.__cldDbgPivotKind &&
          !ud.isWallAo &&
          !ud.isContactShadow &&
          !ud.isHole &&
          !ud.furniDrillHole &&
          !ud.isHingeDebugVolume &&
          child.name !== 'WallContactAO'
        ) {
          const b = new THREE.Box3().setFromObject(child);
          this.bbox.union(b);
        }
      });
      if (this.bbox.isEmpty()) {
        // Нет реальных мешей — fallback к setFromObject
        this.bbox.setFromObject(this.group);
      }
      console.log('📐 BBox Clodis-секции (без debug-маркеров):', {
        min: this.bbox.min.clone(),
        max: this.bbox.max.clone(),
        size: this.bbox.max.clone().sub(this.bbox.min)
      });
    }

    // Position on floor
    this.group.position.y = 0;

    // Add debug helper only if not loading from saved model
    // (saved models should not have debug markers)
    // В проде скрываем отладочные маркеры (pivot/bbox),
    // поэтому addDebugHelper не вызываем.
  }

  buildFromClodis(jsonData, params = {}) {
    // Use ClodisBuilder to construct geometry (with fallback to ClodisBuilder for compatibility)
    const BuilderClass = window.ClodisBuilder || window.ClodisBuilder;
    if (typeof BuilderClass === 'undefined') {
      console.error('ClodisBuilder/ClodisBuilder is not loaded');
      this.createPlaceholder();
      return;
    }

    console.log('🏗️ Furniture.buildFromClodis: начало построения мебели');
    console.log('  📋 JSON данные:', {
      type: jsonData.type,
      name: jsonData.name,
      hasChildren: !!jsonData.children,
      childrenCount: jsonData.children?.length || 0,
      children: jsonData.children?.map(c => ({ type: c.type, name: c.name })) || []
    });
    console.log('  📋 Параметры:', params);

    const builder = new BuilderClass();
    const builtGroup = builder.buildFromJSON(jsonData, params);

    if (
      typeof window !== 'undefined' &&
      window.DEBUG_FACADE_DOOR &&
      typeof BuilderClass.logFacadeDoorDiagnostics === 'function'
    ) {
      BuilderClass.logFacadeDoorDiagnostics(builtGroup);
    }
    
    console.log('🏗️ builtGroup создан:', {
      childrenCount: builtGroup.children.length,
      position: { x: builtGroup.position.x + 'мм', y: builtGroup.position.y + 'мм', z: builtGroup.position.z + 'мм' },
      children: builtGroup.children.map(c => ({ 
        type: c.type, 
        name: c.name,
        isMesh: c.isMesh,
        isGroup: c instanceof THREE.Group,
        isSection: c.userData?.isSection,
        sectionName: c.userData?.sectionName,
        position: c.position ? { x: c.position.x + 'мм', y: c.position.y + 'мм', z: c.position.z + 'мм' } : null
      }))
    });
    
    // ВАЖНО: Для корневой секции ClodisBuilder (референс: ClodisBuilder) НЕ применяет applyTransform
    // Корневая секция остается в (0,0,0), детали позиционируются относительно начала координат секции (back-left-bottom)
    // Поэтому builtGroup.position уже должен быть (0,0,0)
    console.log('📐 Позиция builtGroup (должна быть 0,0,0 для корневой секции):', builtGroup.position);
    if (builtGroup.position.x !== 0 || builtGroup.position.y !== 0 || builtGroup.position.z !== 0) {
      console.warn('⚠️ builtGroup.position не (0,0,0)! Сбрасываем в (0,0,0)');
      builtGroup.position.set(0, 0, 0);
      builtGroup.updateMatrixWorld(true);
    }
    
    // Проверяем секции в builtGroup
    console.log('🔍 Поиск секций в builtGroup...');
    let sectionCount = 0;
    builtGroup.traverse(child => {
      if (child.userData && child.userData.isSection) {
        sectionCount++;
        console.log(`  ✅ Найдена секция [${sectionCount}]: "${child.userData.sectionName}"`, {
        type: child.type,
        name: child.name,
        childrenCount: child.children.length,
        position: child.position ? { x: child.position.x + 'мм', y: child.position.y + 'мм', z: child.position.z + 'мм' } : null,
          children: child.children.map(c => ({
            type: c.type,
            name: c.name,
            isMesh: c.isMesh
          }))
        });
      }
    });
    
    if (sectionCount === 0) {
      console.error('❌❌❌ В builtGroup НЕТ СЕКЦИЙ! ❌❌❌');
      console.error('  Это означает, что buildSection не был вызван или секции не были добавлены в группу!');
    } else {
      console.log(`✅ Найдено секций в builtGroup: ${sectionCount}`);
    }

    // Add all meshes from built group
    console.log('🔍 Поиск мешей в builtGroup...');
    let meshCount = 0;
    builtGroup.traverse(child => {
      if (child.isMesh) {
        // Включаем нормальное взаимодействие с освещением
        child.castShadow = true;
        child.receiveShadow = true;

        // Лёгкий визуальный акцент: корпус/внутренние детали делаем
        // немного темнее и матовее, чем фасады, чтобы добавить глубины.
        const ud = child.userData || {};
        const isBodyLike = ud.isBody || ud.isDetail;
        const isFacade = ud.isFacade;
        if (isBodyLike && !isFacade && child.material &&
            (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial)) {
          const mat = child.material.clone();
          if (mat.color && mat.color.isColor) {
            mat.color.multiplyScalar(0.92);
          }
          if (typeof mat.roughness === 'number') {
            mat.roughness = Math.min(1, mat.roughness + 0.05);
          }
          child.material = mat;
        }

        this.meshes.push(child);
        meshCount++;
        console.log(`  ✅ Найден mesh [${meshCount}]: "${child.name}"`, {
          position: { x: child.position.x + 'мм', y: child.position.y + 'мм', z: child.position.z + 'мм' },
          geometry: child.geometry.type,
          vertices: child.geometry.attributes?.position?.count || 0
        });
      }
    });

    // Add built group to furniture group
    // ВАЖНО: builtGroup.position уже сброшен в (0,0,0), поэтому меши внутри находятся в локальных координатах
    this.group.add(builtGroup);

    // Log for debugging
    console.log('✅ Clodis furniture built:', {
      meshesCount: this.meshes.length,
      groupChildren: this.group.children.length,
      builtGroupChildren: builtGroup.children.length,
      builtGroupPosition: builtGroup.position.clone() // Должно быть (0,0,0)
    });
    
    if (this.meshes.length === 0) {
      console.warn('⚠️ НЕТ МЕШЕЙ в Clodis furniture (пустой children?). Создаём fallback-бокс по размерам секции.');
      let sectionSize = params.sectionSize;
      if (!sectionSize || typeof sectionSize.x !== 'number') {
        const firstSection = builtGroup.children.find(c => c.userData?.isSection);
        sectionSize = firstSection?.userData?.originalSize;
      }
      if (sectionSize && typeof sectionSize.x === 'number' && sectionSize.x > 0) {
        this.createPlaceholderFromSize(sectionSize);
      } else {
        console.error('❌ sectionSize не задан — создаём дефолтный placeholder');
        this.createPlaceholder();
      }
    } else {
      console.log(`✅ Найдено ${this.meshes.length} мешей в мебели`);
    }

    // Добавляем мягкую "AO"‑подсветку на стену позади шкафа
    this.addWallContactAo();
  }

  /** Создаёт коробку по размерам (мм) — для clodisJSON с пустым children */
  createPlaceholderFromSize(sizeInMm) {
    const w = sizeInMm.x || 600;
    const h = sizeInMm.y || 2400;
    const d = sizeInMm.z || 600;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshStandardMaterial({
      // Корпус чуть теплее и контрастнее стен, чтобы не сливаться.
      color: 0xf5f2ec,
      metalness: 0.0,
      roughness: 0.32,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'PlaceholderFromSize';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isBody = true;   // для refreshFurnitureDecors (корпус)
    mesh.userData.originalSize = { x: w, y: h, z: d };
    // BoxGeometry центр в (0,0,0), pivot = back-left-bottom — смещаем на half по осям
    mesh.position.set(w / 2, h / 2, d / 2);
    this.meshes.push(mesh);
    this.group.add(mesh);
    console.log(`✅ Fallback-бокс создан: ${w}×${h}×${d} мм`);

    // Добавляем AO‑подсветку и для placeholder‑шкафов
    this.bbox.setFromObject(this.group);
    this.addWallContactAo();
  }

  createPlaceholder() {
    // Create a simple box as placeholder
    // Dimensions: 0.5m x 0.8m x 0.4m (width x height x depth)
    const geometry = new THREE.BoxGeometry(0.5, 0.8, 0.4);
    const material = new THREE.MeshStandardMaterial({
      // Универсальный placeholder в тех же тонах, что и корпус выше.
      color: 0xf5f2ec,
      metalness: 0.0,
      roughness: 0.32,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isBody = true;

    this.meshes.push(mesh);
    this.group.add(mesh);
  }

  setupPivot() {
    // Флаг и через URL (?dbgPivot=1): setupPivot работает во время загрузки страницы,
    // выставить window.__CLD_DEBUG_PIVOT из консоли к этому моменту уже поздно.
    let __dbgPivot = false;
    try {
      __dbgPivot = !!(
        typeof window !== 'undefined' &&
        (window.__CLD_DEBUG_PIVOT || /[?&]dbgPivot=1/.test(window.location.search))
      );
    } catch (_) {}

    // Collect all meshes from the group hierarchy
    const allMeshes = [];
    this.group.traverse(child => {
      const ud = child.userData || {};
      if (
        child.isMesh &&
        !child.isBoxHelper &&
        !child.name.includes('PivotMarker') &&
        !child.name.includes('BBox') &&
        // Не учитываем служебные меши (AO/тени/маркеры) в bbox для pivot,
        // иначе pivot будет "плыть" и шкаф уедет от стены.
        // Список ТОТ ЖЕ, что в ветке без setupPivot (см. фильтр bbox выше в конструкторе):
        // расхождение давало зазор между шкафами. Цилиндры присадки специально выпускают
        // за плоскость панели для чистого булева вычитания и после операции убирают, но
        // setupPivot успевал их посчитать: у петель слева min.x уходил в -7.14, пивот
        // съезжал, и вся начинка компенсировалась вправо на те же 7.14 мм — через одну
        // зону, по руке двери. Placeholder'ы под флаг НЕ добавлены намеренно: опоры без
        // isVisualOnly должны остаться в floor-contact bbox (регрессия «шкаф парит»).
        !ud.__cldDbgPivotKind &&
        !ud.isWallAo &&
        !ud.isContactShadow &&
        !ud.isHole &&
        !ud.furniDrillHole &&
        !ud.isHingeDebugVolume &&
        child.name !== 'WallContactAO'
      ) {
        allMeshes.push(child);
      }
    });

    if (allMeshes.length === 0) {
      console.warn('No meshes found for pivot setup');
      return;
    }

    // Save current group transform
    const savedPosition = this.group.position.clone();
    const savedRotation = this.group.rotation.clone();
    const savedScale = this.group.scale.clone();

    // Make pivot setup idempotent: if мы уже сдвигали builtGroup раньше,
    // сначала откатываем тот сдвиг, чтобы не накапливать offset при пересборках/повторных вызовах.
    const __builtGroupForOffsetReset = this.group.children.find(child =>
      child instanceof THREE.Group &&
      !child.isMesh &&
      (() => {
        let hasMeshes = false;
        child.traverse(descendant => {
          const ud = descendant.userData || {};
          if (
            descendant.isMesh &&
            !descendant.isBoxHelper &&
            !descendant.name.includes('PivotMarker') &&
            !descendant.name.includes('BBox') &&
            !ud.isWallAo &&
            !ud.isContactShadow &&
            descendant.name !== 'WallContactAO'
          ) {
            hasMeshes = true;
          }
        });
        return hasMeshes;
      })()
    );
    const __prevAppliedOffset =
      __builtGroupForOffsetReset?.userData?.__cldPivotAppliedOffset || null;
    try {
      const prev = __builtGroupForOffsetReset?.userData?.__cldPivotAppliedOffset;
      if (prev && typeof prev.x === 'number' && typeof prev.y === 'number' && typeof prev.z === 'number') {
        __builtGroupForOffsetReset.position.sub(prev);
      }
    } catch (_) {}

    // Temporarily reset group transform to compute local bbox
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
    this.group.updateMatrixWorld(true);

    // Compute bbox of мебельных мешей (только geometry mesh, без потомков-петель)
    this.bbox.makeEmpty();
    const _pivC = new THREE.Vector3();
    // Под __CLD_DEBUG_PIVOT собираем, кто именно формирует bbox.min.x: без имени
    // детали источник смещения пивота приходится угадывать.
    const __contrib = __dbgPivot ? [] : null;
    for (const m of allMeshes) {
      const udm = m.userData || {};
      const nm = String(m.name || '');
      if (
        udm.isHingeCabinetModelMetal ||
        udm.cldHingeCatalogModel ||
        udm.isHingeBazisExport ||
        udm.fromDrillTemplateModel ||
        /^furni_hinge_/i.test(nm) ||
        /петл|hinge|присад/i.test(nm)
      ) {
        continue;
      }
      const spec = String(udm.modelSpecId || '').trim();
      if (spec === '5' || spec === '6' || spec === '7' || spec === '8' || spec === '9' || spec === '10') {
        continue;
      }
      let skipByParent = false;
      let pp = m.parent;
      for (let i = 0; i < 12 && pp; i++) {
        const pud = pp.userData || {};
        if (
          pud.cldHingeCatalogModel ||
          pud.isCatalogHingeModule ||
          pud.isHingeBazisExport ||
          pud.fromDrillTemplateModel
        ) {
          skipByParent = true;
          break;
        }
        pp = pp.parent;
      }
      if (skipByParent) continue;
      const geom = m.geometry;
      if (!geom) continue;
      if (!geom.boundingBox) geom.computeBoundingBox();
      const bb = geom.boundingBox;
      if (!bb || bb.isEmpty()) continue;
      const wp = m.matrixWorld;
      let __mMinX = Infinity;
      for (let ix = 0; ix <= 1; ix++) {
        for (let iy = 0; iy <= 1; iy++) {
          for (let iz = 0; iz <= 1; iz++) {
            _pivC
              .set(ix ? bb.max.x : bb.min.x, iy ? bb.max.y : bb.min.y, iz ? bb.max.z : bb.min.z)
              .applyMatrix4(wp);
            this.bbox.expandByPoint(_pivC);
            if (__mMinX > _pivC.x) __mMinX = _pivC.x;
          }
        }
      }
      if (__contrib) {
        __contrib.push({
          minX: Math.round(__mMinX * 100) / 100,
          name: nm || '(no name)',
          parent: String(m.parent?.name || ''),
          specId: spec || '',
          visible: m.visible,
          flags: Object.keys(udm).filter((k) => udm[k] === true).join(',')
        });
      }
    }
    if (__contrib) {
      __contrib.sort((a, b) => a.minX - b.minX);
      console.log('[CLD][pivot] bbox.min.x contributors (5 самых левых):', __contrib.slice(0, 5));
    }

    const pk = String(this.productKind || '').trim().toLowerCase();
    const placement = String(this.placementKind || '').trim();
    // Цоколь/корпус, не свес фасада: иначе setupPivot сажает низ двери в y=0,
    // floor-snap по цоколю уводит полотно к полу (~0–25 мм вместо 70 мм).
    // Тумба уже так; шкаф в нише — тот же пол + overhang 30 мм.
    const useCorpusPivotMin =
      placement === 'standalone_floor' ||
      placement === 'floor_in_niche' ||
      pk === 'pedestal' ||
      pk === 'standalone_floor' ||
      pk === 'wardrobe';
    let pivotMin = this.bbox.min.clone();
    if (
      useCorpusPivotMin &&
      typeof globalThis !== 'undefined' &&
      typeof globalThis.__cldComputeFurnitureCorpusLayoutWorldBBoxNoAo === 'function'
    ) {
      try {
        this.group.updateMatrixWorld(true);
        const corpusBox = globalThis.__cldComputeFurnitureCorpusLayoutWorldBBoxNoAo(this.group);
        if (corpusBox && !corpusBox.isEmpty()) {
          pivotMin = corpusBox.min.clone();
        }
      } catch (_) {}
    }

    console.log('Initial bbox (before shift):', {
      min: this.bbox.min.clone(),
      max: this.bbox.max.clone(),
      size: this.bbox.max.clone().sub(this.bbox.min),
      pivotMin: pivotMin.clone(),
      useCorpusPivotMin,
    });

    // Тумба: pivot по corpus (боковины), не по крышке s:x — иначе zone-fit и свес расходятся.
    const offset = pivotMin.clone().negate();

    console.log('Offset to apply:', offset);
    console.log('🔧 ИСПРАВЛЕННАЯ ЛОГИКА: Смещаем builtGroup (корневая группа с мешами)');

    // ПРОСТОЙ И ПРАВИЛЬНЫЙ ПОДХОД:
    // В Clodis все меши находятся внутри builtGroup, который является прямым child'ом furniture.group
    // Смещаем builtGroup на offset - это сместит всю иерархию мешей правильно
    
    // Находим builtGroup (первая группа-ребенок furniture.group, которая содержит меши)
    const builtGroup = this.group.children.find(child => 
      child instanceof THREE.Group && 
      !child.isMesh &&
      // Проверяем, содержит ли эта группа меши
      (() => {
        let hasMeshes = false;
        child.traverse(descendant => {
          if (descendant.isMesh && 
              !descendant.isBoxHelper &&
              !descendant.name.includes('PivotMarker') &&
              !descendant.name.includes('BBox')) {
            hasMeshes = true;
          }
        });
        return hasMeshes;
      })()
    );
    
    if (builtGroup) {
      // Смещаем builtGroup на offset
      builtGroup.position.add(offset);
      // Запоминаем применённый offset, чтобы следующий setupPivot мог откатить его
      try {
        builtGroup.userData = builtGroup.userData || {};
        builtGroup.userData.__cldPivotAppliedOffset = offset.clone();
      } catch (_) {}
      console.log(`✅ Смещена группа "${builtGroup.name || 'builtGroup'}":`, builtGroup.position.clone());
      console.log(`  Offset применен:`, offset);
    } else {
      // Если builtGroup не найден, смещаем все прямые группы-дети
      const directChildren = this.group.children.filter(child => 
        child instanceof THREE.Group && !child.isMesh
      );
      
      if (directChildren.length > 0) {
        console.log(`⚠️ builtGroup не найден, смещаем ${directChildren.length} прямых групп-детей`);
        directChildren.forEach(group => {
          group.position.add(offset);
          console.log(`  ✅ Смещена группа "${group.name || 'unnamed'}":`, group.position.clone());
        });
      } else {
        // Если нет групп-детей, смещаем меши напрямую
        console.log('⚠️ Нет групп-детей, смещаем меши напрямую');
        allMeshes.forEach(mesh => {
          mesh.position.add(offset);
        });
        console.log(`  ✅ Смещено ${allMeshes.length} мешей`);
      }
    }

    // Обновляем матрицы всех объектов в группе
    this.group.updateMatrixWorld(true);

    // Recompute bbox after shift (should now have min at origin).
    // ВАЖНО: использовать отфильтрованный обход, а НЕ setFromObject(this.group):
    // setFromObject включает все объекты включая невидимые PivotMarker-сферы,
    // которые после фикса section-позиций стоят на {-sx/2,-sy/2,-sz/2} (за мебелью)
    // и раздувают bbox на ~1.5× → призрак первого шкафа выглядит «пол размера больше».
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
    this.group.updateMatrixWorld(true);
    this.bbox.makeEmpty();
    this.group.traverse((child) => {
      const ud = child.userData || {};
      if (
        child.isMesh &&
        !child.isBoxHelper &&
        !child.name.includes('PivotMarker') &&
        !child.name.includes('BBox') &&
        !ud.__cldDbgPivotKind &&
        !ud.isWallAo &&
        !ud.isContactShadow &&
        child.name !== 'WallContactAO'
      ) {
        const b = new THREE.Box3().setFromObject(child);
        this.bbox.union(b);
      }
    });
    if (this.bbox.isEmpty()) {
      // Fallback если нет реальных мешей (не должно случаться)
      this.bbox.setFromObject(this.group);
    }
    
    console.log('BBox after shift:', {
      min: this.bbox.min.clone(),
      max: this.bbox.max.clone(),
      size: this.bbox.max.clone().sub(this.bbox.min),
    });

    // Restore group transform
    this.group.position.copy(savedPosition);
    this.group.rotation.copy(savedRotation);
    this.group.scale.copy(savedScale);
    this.group.updateMatrixWorld(true);

    if (__dbgPivot) {
      try {
        const ud = this.group.userData || (this.group.userData = {});
        ud.__cldPivotCallCount = Number(ud.__cldPivotCallCount || 0) + 1;
        const builtGroupNow = this.group.children.find(
          (c) =>
            c instanceof THREE.Group &&
            !c.isMesh &&
            (c.userData?.__cldPivotAppliedOffset != null)
        );
        console.log('[CLD][pivot]', {
          callCount: ud.__cldPivotCallCount,
          meshesCount: allMeshes.length,
          bboxMin: { x: this.bbox.min.x, y: this.bbox.min.y, z: this.bbox.min.z },
          bboxMax: { x: this.bbox.max.x, y: this.bbox.max.y, z: this.bbox.max.z },
          offsetApplied: { x: offset.x, y: offset.y, z: offset.z },
          prevOffset: (__prevAppliedOffset && typeof __prevAppliedOffset === 'object')
            ? { x: __prevAppliedOffset.x, y: __prevAppliedOffset.y, z: __prevAppliedOffset.z }
            : null,
          builtGroupFound: !!builtGroup,
          builtGroupName: builtGroup?.name || null,
          builtGroupPosAfter: builtGroup ? { x: builtGroup.position.x, y: builtGroup.position.y, z: builtGroup.position.z } : null,
          builtGroupHasAppliedOffset: !!(builtGroupNow && builtGroupNow.userData?.__cldPivotAppliedOffset),
        });
      } catch (e) {
        console.warn('[CLD][pivot] dbg failed', e);
      }
    }

    // Now bbox.min should be at (0, 0, 0) relative to group
    // bbox.max contains the size (width, height, depth)
    // Convention: width = x, height = y, depth = z

    console.log('Furniture pivot set to back-left-bottom');
    console.log('BBox min:', this.bbox.min);
    console.log('BBox max:', this.bbox.max);
    console.log('Size (w x h x d):', this.bbox.max.clone().sub(this.bbox.min));

    // Verify that bbox.min is approximately (0, 0, 0)
    // ПРИМЕЧАНИЕ: Если bbox.min.y != 0, это не критично - коррекция в placePendingFurniture исправит это
    if (
      Math.abs(this.bbox.min.x) > 0.001 ||
      Math.abs(this.bbox.min.y) > 0.001 ||
      Math.abs(this.bbox.min.z) > 0.001
    ) {
      console.warn('⚠️ BBox min is NOT at origin:', this.bbox.min);
      console.warn('Expected (0, 0, 0), got:', this.bbox.min);
      console.warn('Это нормально - коррекция позиции в placePendingFurniture исправит это');
      console.warn('  bbox.min.y будет скорректирован при размещении мебели');
    } else {
      console.log('✅✅✅ BBox min is at origin (0, 0, 0) - pivot is correct');
    }
  }

  // Get furniture dimensions (width, height, depth)
  getSize() {
    return this.bbox.max.clone().sub(this.bbox.min);
  }

  // Soft AO plane on the wall behind the furniture – Ikea‑like лёгкое затемнение вокруг корпуса
  addWallContactAo() {
    const size = this.getSize();
    // NaN <= 0 === false — без проверки isFinite получаем PlaneGeometry(NaN,NaN) и весь кадр падает с
    // "Computed radius is NaN" в renderer (см. консоль при пустой мебели / битом bbox).
    if (
      !size ||
      !Number.isFinite(size.x) ||
      !Number.isFinite(size.y) ||
      !Number.isFinite(size.z) ||
      size.x <= 0 ||
      size.y <= 0
    ) {
      return;
    }

    // Не дублируем AO, если оно уже есть
    const existing = this.group.children.find((c) => c.userData && c.userData.isWallAo);
    if (existing) return;

    const width = size.x * 1.08;
    const height = size.y * 1.02;

    const geom = new THREE.PlaneGeometry(width, height);
    const mat = getWallAoMaterial();

    const aoPlane = new THREE.Mesh(geom, mat);
    aoPlane.name = 'WallContactAO';
    aoPlane.userData.isWallAo = true;
    aoPlane.castShadow = false;
    aoPlane.receiveShadow = false;

    // Пивот мебели — back‑left‑bottom. Вешаем плоскость чуть за шкафом, на уровне его корпуса.
    aoPlane.position.set(size.x * 0.5, size.y * 0.5, -1);
    aoPlane.renderOrder = 0.5;

    this.group.add(aoPlane);
  }

  addDebugHelper() {
    // BoxHelper removed - using perimeter marker on selection instead
    
    // Add red sphere at pivot point (origin of furniture group)
    // Pivot is at (0, 0, 0) in local coordinates after setupPivot
    const pivotGeometry = new THREE.SphereGeometry(0.05, 16, 16); // 5cm radius
    const pivotMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000, // Red color
      transparent: true,
      opacity: 0.9,
    });
    const pivotMarker = new THREE.Mesh(pivotGeometry, pivotMaterial);
    pivotMarker.position.set(0, 0, 0); // Pivot is at origin
    pivotMarker.name = 'PivotMarker';
    this.group.add(pivotMarker);

    // Add green sphere at bbox.min to see where it actually is
    const bboxMinGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const bboxMinMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00, // Green color
      transparent: true,
      opacity: 0.9,
    });
    const bboxMinMarker = new THREE.Mesh(bboxMinGeometry, bboxMinMaterial);
    bboxMinMarker.position.copy(this.bbox.min);
    bboxMinMarker.name = 'BBoxMinMarker';
    this.group.add(bboxMinMarker);

    // Add blue sphere at bbox center to see center
    const bboxCenter = this.bbox.getCenter(new THREE.Vector3());
    const bboxCenterGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const bboxCenterMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff, // Blue color
      transparent: true,
      opacity: 0.9,
    });
    const bboxCenterMarker = new THREE.Mesh(bboxCenterGeometry, bboxCenterMaterial);
    bboxCenterMarker.position.copy(bboxCenter);
    bboxCenterMarker.name = 'BBoxCenterMarker';
    this.group.add(bboxCenterMarker);

    console.log('🔴 Красная точка pivot добавлена в позиции (0, 0, 0)');
    console.log('🟢 Зеленая точка bbox.min в позиции:', this.bbox.min);
    console.log('🔵 Синяя точка bbox.center в позиции:', bboxCenter);
  }

  // Method to load furniture from external model (future)
  loadModel(url) {
    // TODO: Implement model loading
    // After loading, call setupPivot() again
  }
}

if (typeof window !== 'undefined') {
  window.Furniture = Furniture;
}
