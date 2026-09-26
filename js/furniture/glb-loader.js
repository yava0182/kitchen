// GLB Loader module - handles loading and placement of GLB/GLTF furniture models
// Main module for GLB file operations

import { state } from '../utils/state.js';
import { createFurnitureGhost, removeFurnitureGhost } from './furniture-ghost.js?v=20260925-corner44y';

/**
 * Load and place a saved model at the specified position
 * @param {string} url - Blob URL of the GLB file
 * @param {Object} modelData - Model metadata
 * @param {THREE.Vector3} position - World position
 * @param {number} rotationY - Rotation around Y axis in radians
 * @param {string} wall - Wall name ('front', 'back', 'left', 'right')
 */
export function loadSavedModelForPlacement(url, modelData, position, rotationY, wall) {
  const GLTFLoaderClass = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
  if (!GLTFLoaderClass) {
    alert('GLTFLoader не загружен. Обновите страницу и попробуйте снова.');
    return;
  }
  
  console.log('рџ“¦ Р—Р°РіСЂСѓР·РєР° СЃРѕС…СЂР°РЅРµРЅРЅРѕР№ РјРѕРґРµР»Рё РґР»СЏ СЂР°Р·РјРµС‰РµРЅРёСЏ:', modelData.metadata.name);
  console.log('  РџРѕР·РёС†РёСЏ:', position);
  console.log('  РџРѕРІРѕСЂРѕС‚:', rotationY);
  console.log('  РЎС‚РµРЅР°:', wall);
  
  const loader = new GLTFLoaderClass();
  
  loader.load(url, (gltf) => {
    console.log('рџ“¦ РЎРѕС…СЂР°РЅРµРЅРЅР°СЏ РјРѕРґРµР»СЊ Р·Р°РіСЂСѓР¶РµРЅР°:', modelData.metadata.name);
    
    // Remove existing furniture
    if (state.furniture && state.furniture.group) {
      state.scene.remove(state.furniture.group);
      state.furniture.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      state.furniture = null;
    }

    // Create Furniture from GLB
    const gltfScene = gltf.scene.clone();
    state.furniture = new Furniture(null, { skipPlaceholder: true, skipDebugHelpers: true });
    state.furniture.group.add(gltfScene);
    state.furniture.group.userData.isFurniture = true;
    state.furniture.group.userData.sourceFile = modelData.metadata.name;
    state.furniture.group.userData.attachedWall = wall;
    state.furniture.group.userData.isGLB = true;
    state.furniture.group.userData.isSavedModel = true;
    state.furniture.group.userData.modelMetadata = modelData.metadata;
    state.furniture.group.userData.originalScale = { x: 1, y: 1, z: 1 };
    
    // Initialize animations if present
    if (gltf.animations && gltf.animations.length > 0) {
      state.furnitureAnimationMixer = new THREE.AnimationMixer(gltfScene);
      state.furnitureAnimations = {};
      
      gltf.animations.forEach((clip, index) => {
        const action = state.furnitureAnimationMixer.clipAction(clip);
        state.furnitureAnimations[clip.name || `animation_${index}`] = action;
      });
      
      state.furniture.group.userData.animations = Object.keys(state.furnitureAnimations);
    }
    
    // Setup pivot (back-left-bottom)
    state.furniture.setupPivot();
    
    // Set position and rotation
    const roomWorldPos = new THREE.Vector3();
    state.room.group.getWorldPosition(roomWorldPos);
    
    // Recalculate bbox after setupPivot
    state.furniture.bbox.setFromObject(state.furniture.group);
    const localBbox = state.furniture.bbox;
    
    const adjustedPosition = position.clone();
    
    // If bbox.min.y is not 0, pivot is not at floor - correct it
    if (Math.abs(localBbox.min.y) > 0.001) {
      adjustedPosition.y = roomWorldPos.y - localBbox.min.y;
      console.log('вљ пёЏ bbox.min.y != 0, adjusting Y position by:', localBbox.min.y);
    } else {
      adjustedPosition.y = roomWorldPos.y; // Floor level
      console.log('вњ… bbox.min.y is 0, pivot is at floor level');
    }
    
    state.furniture.group.position.copy(adjustedPosition);
    state.furniture.group.rotation.y = rotationY;
    
    // Check final position
    const finalBbox = new THREE.Box3().setFromObject(state.furniture.group);
    console.log('Furniture final bbox.min.y (should be at floor):', finalBbox.min.y);
    
    // Save original size
    state.furniture.group.userData.originalSize = state.furniture.bbox.max.clone().sub(state.furniture.bbox.min);
    
    state.scene.add(state.furniture.group);
    
    // Revoke URL after successful load
    URL.revokeObjectURL(url);
    
    // Reset wall highlight
    if (state.room && state.room.resetWallHighlight) {
      state.room.resetWallHighlight();
    }
    
    console.log('вњ… РЎРѕС…СЂР°РЅРµРЅРЅР°СЏ РјРѕРґРµР»СЊ СЂР°Р·РјРµС‰РµРЅР°:', modelData.metadata.name);
    console.log('  РџРѕР·РёС†РёСЏ:', state.furniture.group.position);
    console.log('  РџРѕРІРѕСЂРѕС‚:', state.furniture.group.rotation.y);
  }, undefined, (error) => {
    console.error('❌ Ошибка загрузки сохраненной модели:', error);
    alert('Ошибка загрузки модели: ' + error.message);
    URL.revokeObjectURL(url);
  });
}

/**
 * Load and place a GLB file at the specified position
 * @param {string} glbPath - Path to GLB file
 * @param {THREE.Vector3} position - World position
 * @param {number} rotationY - Rotation around Y axis in radians
 * @param {string} wall - Wall name ('front', 'back', 'left', 'right')
 */
export function loadGLBFileForPlacement(glbPath, position, rotationY, wall) {
  const GLTFLoaderClass = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
  if (!GLTFLoaderClass) {
    alert('GLTFLoader не загружен. Обновите страницу и попробуйте снова.');
    return;
  }
  
  console.log('рџ“¦ Р—Р°РіСЂСѓР·РєР° GLB РґР»СЏ СЂР°Р·РјРµС‰РµРЅРёСЏ:', glbPath);
  console.log('  РџРѕР·РёС†РёСЏ:', position);
  console.log('  РџРѕРІРѕСЂРѕС‚:', rotationY);
  console.log('  РЎС‚РµРЅР°:', wall);
  
  const loader = new GLTFLoaderClass();
  
  loader.load(glbPath, (gltf) => {
    console.log('рџ“¦ GLB Р·Р°РіСЂСѓР¶РµРЅ:', glbPath);
    
    // Remove existing furniture
    if (state.furniture && state.furniture.group) {
      state.scene.remove(state.furniture.group);
      state.furniture.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      state.furniture = null;
    }

    // Create Furniture from GLB
    const gltfScene = gltf.scene.clone();
    state.furniture = new Furniture(null, { skipPlaceholder: true, skipDebugHelpers: true });
    state.furniture.group.add(gltfScene);
    state.furniture.group.userData.isFurniture = true;
    state.furniture.group.userData.sourceFile = glbPath;
    state.furniture.group.userData.attachedWall = wall;
    
    // Setup pivot (back-left-bottom)
    state.furniture.setupPivot();
    
    // Set position and rotation
    const roomWorldPos = new THREE.Vector3();
    state.room.group.getWorldPosition(roomWorldPos);
    
    // Recalculate bbox after setupPivot
    state.furniture.bbox.setFromObject(state.furniture.group);
    const localBbox = state.furniture.bbox;
    
    const adjustedPosition = position.clone();
    
    // If bbox.min.y is not 0, pivot is not at floor - correct it
    if (Math.abs(localBbox.min.y) > 0.001) {
      adjustedPosition.y = roomWorldPos.y - localBbox.min.y;
      console.log('вљ пёЏ bbox.min.y != 0, adjusting Y position by:', localBbox.min.y);
    } else {
      adjustedPosition.y = roomWorldPos.y; // Floor level
      console.log('вњ… bbox.min.y is 0, pivot is at floor level');
    }
    
    state.furniture.group.position.copy(adjustedPosition);
    state.furniture.group.rotation.y = rotationY;
    
    // Check final position
    const finalBbox = new THREE.Box3().setFromObject(state.furniture.group);
    console.log('Furniture final bbox.min.y (should be at floor):', finalBbox.min.y);
    
    state.scene.add(state.furniture.group);
    
    // Reset wall highlight
    if (state.room && state.room.resetWallHighlight) {
      state.room.resetWallHighlight();
    }
    
    console.log('вњ… GLB СЂР°Р·РјРµС‰РµРЅ:', glbPath);
    console.log('  РџРѕР·РёС†РёСЏ:', state.furniture.group.position);
    console.log('  РџРѕРІРѕСЂРѕС‚:', state.furniture.group.rotation.y);
  }, undefined, (error) => {
    console.error('вќЊ РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё GLB:', error);
    alert('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё GLB С„Р°Р№Р»Р°: ' + error.message);
  });
}

/**
 * Load GLB from path (for preview/catalog)
 * @param {string} glbPath - Path to GLB file
 */
export function loadGLBFromPath(glbPath) {
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

  console.log('рџ“¦ Р—Р°РіСЂСѓР·РєР° GLB РёР· РєР°С‚Р°Р»РѕРіР° РґР»СЏ СЂР°Р·РјРµС‰РµРЅРёСЏ:', glbPath);

  const loader = new GLTFLoaderClass();

  // Загружаем GLB только для получения размеров и создания ghost
  loader.load(
    glbPath,
    (gltf) => {
      console.log('рџ“¦ GLB Р·Р°РіСЂСѓР¶РµРЅ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РїСЂРёР·СЂР°РєР°:', glbPath);

      // РЎРѕР·РґР°РµРј РІСЂРµРјРµРЅРЅСѓСЋ РјРµР±РµР»СЊ РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ bbox (skip placeholder)
      const gltfScene = gltf.scene.clone();
      // eslint-disable-next-line no-undef
      const tempFurniture = new window.Furniture(null, {
        skipPlaceholder: true,
        skipDebugHelpers: true,
      });
      tempFurniture.group.add(gltfScene);
      tempFurniture.setupPivot();

      // РџРѕР»СѓС‡Р°РµРј bbox Рё СЂР°Р·РјРµСЂС‹
      const bbox = tempFurniture.bbox.clone();
      const size = bbox.max.clone().sub(bbox.min);

      console.log('рџ“ђ Р Р°Р·РјРµСЂС‹ GLB:', size);
      console.log('  BBox min:', bbox.min);
      console.log('  BBox max:', bbox.max);

      // РћС‡РёС‰Р°РµРј РІСЂРµРјРµРЅРЅСѓСЋ РјРµР±РµР»СЊ
      tempFurniture.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      // РЎРѕР·РґР°РµРј ghost РґР»СЏ GLB С‡РµСЂРµР· РјРѕРґСѓР»СЊ furniture-ghost
      if (state.furnitureGhost) {
        removeFurnitureGhost();
      }

      const sectionSize = { x: size.x, y: size.y, z: size.z };

      // РЎРѕС…СЂР°РЅСЏРµРј РґР°РЅРЅС‹Рµ GLB РІ pendingFurnitureData,
      // С‡С‚РѕР±С‹ placePendingFurniture СЃРјРѕРі РІС‹Р·РІР°С‚СЊ loadGLBFileForPlacement
      state.pendingFurnitureData = {
        type: 'glb',
        path: glbPath,
        size: size.clone(),
        bbox: bbox.clone(),
      };

      // Используем generic-призрак мебели с переопределением размеров
      createFurnitureGhost(
        {
          size: sectionSize,
        },
        sectionSize
      );

      state.isPlacingFurniture = true;

      console.log('✅ Режим размещения GLB активирован');
    },
    undefined,
    (error) => {
      console.error('❌ Ошибка загрузки GLB из каталога:', error);
      alert('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё GLB С„Р°Р№Р»Р°: ' + error.message);
    }
  );
}

/**
 * Load GLB file from file input
 * @param {File} file - File object from input
 */
export function loadGLBFile(file) {
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
  const GLTFLoaderClass = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
  if (!GLTFLoaderClass) {
    alert('GLTFLoader не загружен. Обновите страницу и попробуйте снова.');
    return;
  }

  console.log(
    'рџ“¦ Р—Р°РіСЂСѓР·РєР° GLB С„Р°Р№Р»Р°:',
    file.name,
    'СЂР°Р·РјРµСЂ:',
    (file.size / 1024).toFixed(2),
    'KB'
  );

  const loader = new GLTFLoaderClass();
  const reader = new FileReader();

  reader.onload = (event) => {
    const arrayBuffer = event.target.result;
    const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);

    loader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url);

        console.log('рџ“¦ GLB СЂР°СЃРїР°СЂСЃРµРЅ:', {
          scene: gltf.scene,
          scenes: gltf.scenes,
          animations: gltf.animations?.length || 0,
          cameras: gltf.cameras?.length || 0,
        });

        // Remove existing furniture
        if (state.furniture && state.furniture.group) {
          state.scene.remove(state.furniture.group);
          state.furniture.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          state.furniture = null;
        }

        // Create Furniture from GLB
        const gltfScene = gltf.scene.clone();
        // eslint-disable-next-line no-undef
        state.furniture = new window.Furniture(null, {
          skipPlaceholder: true,
          skipDebugHelpers: true,
        });
        console.log('рџ“ђ Р Р°Р·РјРµСЂС‹ GLB СЃС†РµРЅС‹ РґРѕ РѕР±СЂР°Р±РѕС‚РєРё:');
        const tempBox = new window.THREE.Box3().setFromObject(gltfScene);
        console.log('  BBox min:', tempBox.min);
        console.log('  BBox max:', tempBox.max);
        console.log('  Р Р°Р·РјРµСЂ:', tempBox.max.clone().sub(tempBox.min));

        state.furniture.group.add(gltfScene);
        state.furniture.group.userData.isFurniture = true;
        state.furniture.group.userData.sourceFile = file.name;
        state.furniture.group.userData.isGLB = true;
        state.furniture.group.userData.originalScale = { x: 1, y: 1, z: 1 };

        // Инициализация анимаций GLB
        if (gltf.animations && gltf.animations.length > 0) {
          state.furnitureAnimationMixer = new window.THREE.AnimationMixer(gltfScene);
          state.furnitureAnimations = {};

          gltf.animations.forEach((clip, index) => {
            const action = state.furnitureAnimationMixer.clipAction(clip);
            state.furnitureAnimations[clip.name || `animation_${index}`] = action;
            console.log(
              'рџЋ¬ РќР°Р№РґРµРЅР° Р°РЅРёРјР°С†РёСЏ:',
              clip.name || `animation_${index}`,
              'РґР»РёС‚РµР»СЊРЅРѕСЃС‚СЊ:',
              clip.duration,
              'СЃРµРє'
            );
          });

          state.furniture.group.userData.animations = Object.keys(state.furnitureAnimations);
          console.log('✅ Анимации GLB инициализированы:', Object.keys(state.furnitureAnimations));
        } else {
          state.furnitureAnimationMixer = null;
          state.furnitureAnimations = {};
          console.log('ℹ️ Анимации в GLB не найдены');
        }

        // РќР°СЃС‚СЂРѕР№РєР° pivot (back-left-bottom)
        state.furniture.setupPivot();
        state.furniture.bbox.setFromObject(state.furniture.group);

        // Сохраняем оригинальные размеры для параметрического изменения
        state.furniture.group.userData.originalSize = state.furniture.bbox.max
          .clone()
          .sub(state.furniture.bbox.min);

        state.scene.add(state.furniture.group);
        console.log('вњ… GLB Р·Р°РіСЂСѓР¶РµРЅ Рё СЂР°Р·РјРµС‰РµРЅ:', file.name);
      },
      undefined,
      (error) => {
        console.error('вќЊ РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё GLB:', error);
        alert('РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё GLB С„Р°Р№Р»Р°: ' + error.message);
      }
    );
  };

  reader.readAsArrayBuffer(file);
}

// Make functions available globally for backward compatibility
window.loadGLBFileForPlacement = loadGLBFileForPlacement;
window.loadSavedModelForPlacement = loadSavedModelForPlacement;
window.loadGLBFromPath = loadGLBFromPath;
window.loadGLBFile = loadGLBFile;
