// Room manager module - handles room creation, editing, and dimension updates
// Main module for room operations

import { state, WALL_THICKNESS } from '../utils/state.js';
import { applyIkeaEmptyRoomCamera } from '../core/camera.js?v=20260923-cohabit42';
import { updateRoomDimensionLabels } from '../ui/scene-icons.js?v=20260921-whh1';
import {
  mountRoomEditChrome,
  unmountRoomEditChrome,
  syncRoomEditAfterResize,
} from './room-edit-toolbar.js?v=20260923-cohabit43';
import { reapplyRoomEditOpenings } from './room-edit-openings.js?v=20260917-seamfix2';
import { startPlacingSection } from '../sections/section-ghost.js?v=20260925-corner44c';
import { cancelSectionPlacement } from '../sections/section-manager.js?v=20260923-cohabit42';
import { isIkeaRoomLightV0 } from '../furniture/ikea-light-gate.js?v=20260907-nospeed1';
import { installIkeaRoomLightV0 } from '../furniture/ikea-room-light-v0.js?v=20260913-hang-lite';

/**
 * Show edit room modal
 */
export function showEditRoomModal() {
  const modal = document.getElementById('edit-room-modal');
  if (!modal) return;
  
  // Set current room dimensions
  const widthInput = document.getElementById('room-width-input');
  const depthInput = document.getElementById('room-depth-input');
  const heightInput = document.getElementById('room-height-input');
  const heightSlider = document.getElementById('room-height-slider');
  
  if (widthInput && state.room) {
    widthInput.value = state.room.width / 10; // Convert mm to cm
  }
  if (depthInput && state.room) {
    depthInput.value = state.room.depth / 10;
  }
  if (heightInput && state.room) {
    heightInput.value = state.room.height / 10;
  }
  if (heightSlider && state.room) {
    heightSlider.value = state.room.height / 10;
  }
  
  // Sync slider and input for height
  if (heightSlider && heightInput) {
    // Remove old handlers by cloning
    const newSlider = heightSlider.cloneNode(true);
    heightSlider.parentNode.replaceChild(newSlider, heightSlider);
    const newInput = heightInput.cloneNode(true);
    heightInput.parentNode.replaceChild(newInput, heightInput);
    
    // Get updated elements
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
  
  // Dimension change handlers
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
  
  mountRoomEditChrome();
  window.__cldApplyRoomDimensions = updateRoomDimensions;
  updateRoomDimensionLabels();

  // Replace "Edit Room" button with "Done"
  if (window.editRoomButton) {
    const newButton = window.editRoomButton.cloneNode(true);
    window.editRoomButton.parentNode.replaceChild(newButton, window.editRoomButton);
    window.editRoomButton = newButton;
    
    window.editRoomButton.innerHTML = `<i class="fas fa-check" style="margin-right: 8px;"></i>Готово`;
    
    window.editRoomButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeEditRoomModal();
    });
  }
  
  modal.style.display = 'block';
  modal.classList.add('is-open');
  
  // Close on outside click
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeEditRoomModal();
    }
  };
}

/**
 * Close edit room modal
 */
export function closeEditRoomModal() {
  window.__cldRoomDimEditing = null;
  window.__cldApplyRoomDimensions = null;
  unmountRoomEditChrome();
  const modal = document.getElementById('edit-room-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('is-open');
  }
  
  // Show ceiling again
  if (state.room && state.room.walls && state.room.walls.ceiling) {
    state.room.walls.ceiling.visible = true;
  }
  state.room.group.traverse(child => {
    if (child.userData && child.userData.isCeiling) {
      child.visible = true;
    }
  });
  
  // Remove dimension labels + outer dim SVG ticks
  if (window.roomDimensionLabels) {
    window.roomDimensionLabels.forEach(label => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    window.roomDimensionLabels = [];
  }
  window.__cldRoomOuterDimSegs = [];
  const outerLayer = document.getElementById('cld-room-outer-dim-lines');
  if (outerLayer) outerLayer.replaceChildren();
  
  // Restore IKEA empty-room eye camera (not the pre-room placeholder)
  applyIkeaEmptyRoomCamera(state.room, state.camera, { intro: false });
  if (state.controls && state.controls.update && state.initialCameraTarget) {
    state.controls.target.copy(state.initialCameraTarget);
    state.controls.update();
  }
  console.log('📷 Камера восстановлена в ракурс IKEA empty');
  
  // Restore "Edit Room" button
  if (window.editRoomButton) {
    const newButton = window.editRoomButton.cloneNode(true);
    window.editRoomButton.parentNode.replaceChild(newButton, window.editRoomButton);
    window.editRoomButton = newButton;
    
    window.editRoomButton.innerHTML = `<i class="fas fa-pencil-alt" aria-hidden="true"></i>Изменить комнату`;
    
    window.editRoomButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showEditRoomModal();
    });
  }
}

/**
 * Update room dimensions based on input values
 */
export function updateRoomDimensions() {
  const widthInput = document.getElementById('room-width-input');
  const depthInput = document.getElementById('room-depth-input');
  const heightInput = document.getElementById('room-height-input');
  
  if (!widthInput || !depthInput || !heightInput) return;
  
  const newWidth = parseFloat(widthInput.value) * 10; // Convert cm to mm
  const newDepth = parseFloat(depthInput.value) * 10;
  const newHeight = parseFloat(heightInput.value) * 10;
  
  if (isNaN(newWidth) || isNaN(newDepth) || isNaN(newHeight)) return;
  if (newWidth < 1000 || newDepth < 1000 || newHeight < 2000) return; // Min dimensions
  
  // Remove old room
  if (state.room && state.room.group) {
    state.scene.remove(state.room.group);
    // Clean up resources
    state.room.group.traverse(child => {
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
  
  // Create new room with new dimensions
  try {
    state.room = new Room(newWidth, newDepth, newHeight);
    
    // Center room
    const roomCenterX = state.room.width / 2;
    const roomCenterZ = state.room.depth / 2;
    state.room.group.position.set(-roomCenterX, 0, -roomCenterZ);
    
    state.scene.add(state.room.group);
    state.wallPlanes = state.room.wallPlanes;
    if (isIkeaRoomLightV0()) {
      const installed = installIkeaRoomLightV0();
      console.warn('[IKEA v0] re-bind after room resize · meshes=', installed?.bound);
    } else {
      state.room.applyStaticRoomAoMaterials?.();
    }

    // Update room bounds
    state.roomBounds = {
      minX: -WALL_THICKNESS / 2,
      maxX: state.room.width + WALL_THICKNESS / 2,
      minZ: -WALL_THICKNESS / 2,
      maxZ: state.room.depth + WALL_THICKNESS / 2,
    };
    
    // Hide ceiling
    if (state.room.walls && state.room.walls.ceiling) {
      state.room.walls.ceiling.visible = false;
    }
    
    // Update dimension labels
    updateRoomDimensionLabels();
    syncRoomEditAfterResize();
    reapplyRoomEditOpenings();
    
    console.log('✅ Размеры комнаты обновлены:', {
      width: newWidth + 'мм',
      depth: newDepth + 'мм',
      height: newHeight + 'мм'
    });
  } catch (error) {
    console.error('❌ Ошибка обновления размеров комнаты:', error);
  }
}

/**
 * Local photo path for a room-type card (admin «Управление комнатой 2» → image).
 * Font Awesome / shape keys are not photos.
 */
function isRoomTypePhotoSrc(val) {
  const v = String(val || '').trim();
  if (!v) return false;
  if (/^fa[- ]/i.test(v) || v.indexOf('shape:') === 0) return false;
  if (/^javascript:/i.test(v)) return false;
  return v.charAt(0) === '/' || v.indexOf('./') === 0 || /^data:image\//i.test(v);
}

function roomTypePhotoGridColumns(n) {
  if (n === 1) return 'minmax(0, 1fr)';
  if (n === 3) return 'repeat(3, minmax(0, 1fr))';
  return 'repeat(2, minmax(0, 1fr))';
}

/**
 * Build room type selection step (for wizard)
 * @param {HTMLElement} container - Container element
 */
export function buildRoomTypeStep(container) {
  // Extracted from legacy main.js (buildRoomTypeStep)
  let roomTypes = [
    { name: 'Гостиная', icon: 'fa-couch', key: 'living-room', image: '' },
    { name: 'Спальня', icon: 'fa-bed', key: 'bedroom', image: '' },
    { name: 'Детская', icon: 'fa-child', key: 'nursery', image: '' },
    { name: 'Прихожая', icon: 'fa-door-open', key: 'hallway', image: '' },
    { name: 'Постирочная', icon: 'fa-tshirt', key: 'laundry', image: '' },
    { name: 'Балкон', icon: 'fa-home', key: 'balcony', image: '' }
  ];

  const config = (() => {
    try {
      const raw = localStorage.getItem('room_steps_config');
      if (raw) {
        const c = JSON.parse(raw);
        if (c && c.steps && c.steps.length) return c;
      }
    } catch (e) {}
    return null;
  })();

  let step1 = null;
  if (config && config.steps) {
    step1 = config.steps.find(function (s) {
      return s.stepId === 1;
    }) || config.steps[0];
    if (step1 && step1.items && step1.items.length > 0) {
      roomTypes = step1.items
        .sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        })
        .map(function (it) {
          return {
            name: it.name || 'Пункт',
            icon: it.icon || 'fa-circle',
            image: it.image || '',
            key: it.key || 'item-' + it.id,
            categoryId: it.categoryId || null
          };
        });
    }
  }

  const grid = document.createElement('div');
  grid.className = 'room-types-grid room-type-photos';

  let columnsPerRow = 2;
  if (step1 && (step1.columnsPerRow === 1 || step1.columnsPerRow === 2 || step1.columnsPerRow === 3)) {
    columnsPerRow = step1.columnsPerRow;
  }
  grid.style.gridTemplateColumns = roomTypePhotoGridColumns(columnsPerRow);
  grid.setAttribute('data-cols', String(columnsPerRow));

  roomTypes.forEach(function (roomType) {
    const item = document.createElement('div');
    item.className = 'room-type-item';
    item.dataset.roomType = roomType.key;
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-pressed', 'false');

    const title = (roomType.name || '').replace(/</g, '&lt;');
    const photoSrc = isRoomTypePhotoSrc(roomType.image) ? String(roomType.image).trim() : '';
    const imgHtml = photoSrc
      ? '<img src="' +
        photoSrc.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') +
        '" alt="' +
        title +
        '" onerror="this.remove()">'
      : '';

    item.innerHTML =
      '<div class="room-type-image">' +
      imgHtml +
      '<span class="room-type-selected-indicator" aria-hidden="true"><i class="fas fa-check"></i></span>' +
      '</div>' +
      '<div class="room-type-name">' +
      title +
      '</div>';

    function selectThisRoomType() {
      grid
        .querySelectorAll('.room-type-item')
        .forEach(function (i) {
          i.classList.remove('selected');
          i.setAttribute('aria-pressed', 'false');
        });
      item.classList.add('selected');
      item.setAttribute('aria-pressed', 'true');
      window.selectedRoomType = roomType;
      const nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) nextBtn.disabled = false;
    }

    item.addEventListener('click', selectThisRoomType);
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectThisRoomType();
      }
    });

    grid.appendChild(item);
  });

  container.appendChild(grid);
}

/**
 * Build room layout selection step (for wizard)
 * @param {HTMLElement} container - Container element
 */
export function buildRoomLayoutStep(container) {
  // Extracted from legacy main.js (buildRoomLayoutStep)
  // User-facing labels only — keys/shapes unchanged.
  const LAYOUT_UI_BY_KEY = {
    'top-wall': { label: 'Прямая', desc: 'Вдоль одной стены' },
    'corner-wardrobe': { label: 'Угловая справа', desc: 'По двум стенам' },
    'top-right': { label: 'Угловая справа', desc: 'По двум стенам' },
    'corner-wardrobe-left': { label: 'Угловая слева', desc: 'По двум стенам' },
    'top-left': { label: 'Угловая слева', desc: 'По двум стенам' },
    'top-right-bottom-partition': { label: 'П-образная', desc: 'По трём стенам' },
  };

  function resolveLayoutUi(layout) {
    const mapped = LAYOUT_UI_BY_KEY[layout.key] || LAYOUT_UI_BY_KEY[layout.shape];
    if (mapped) return mapped;
    return { label: layout.name || 'Раскладка', desc: '' };
  }

  let layouts = [
    { name: 'Верхняя стена', key: 'top-wall', shape: 'top-wall' },
    { name: 'Угловой шкаф (задняя+правая)', key: 'corner-wardrobe', shape: 'top-right' },
    { name: 'Угловой шкаф (задняя+левая)', key: 'corner-wardrobe-left', shape: 'top-left' },
    {
      name: 'П-образная',
      key: 'top-right-bottom-partition',
      shape: 'top-right-bottom-partition'
    }
  ];

  const config = (() => {
    try {
      const raw = localStorage.getItem('room_steps_config');
      if (raw) {
        const c = JSON.parse(raw);
        if (c && c.steps && c.steps.length) return c;
      }
    } catch (e) {}
    return null;
  })();

  if (config && config.steps) {
    const step2 = config.steps.find(function (s) {
      return s.stepId === 2;
    });
    if (step2 && step2.items && step2.items.length > 0) {
      layouts = step2.items
        .sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        })
        .map(function (it) {
          const icon = (it.icon || '').trim();
          const shape =
            icon.indexOf('shape:') === 0 ? icon.slice(6) : it.key || '';
          return {
            name: it.name || 'Пункт',
            key: it.key || 'item-' + it.id,
            shape: shape || 'top-wall',
            icon: icon
          };
        });

      // Старые конфиги шага 2 могут не содержать новый лейаут corner-wardrobe-left.
      // Аккуратно добавляем его рядом с corner-wardrobe, не меняя остальной порядок.
      if (!layouts.some(function (l) { return l.key === 'corner-wardrobe-left'; })) {
        var insertAfter = layouts.findIndex(function (l) {
          return l.key === 'corner-wardrobe' || l.key === 'top-right';
        });
        var newLayout = {
          name: 'Угловой шкаф (задняя+левая)',
          key: 'corner-wardrobe-left',
          shape: 'top-left',
          icon: 'shape:top-left'
        };
        if (insertAfter >= 0) {
          layouts.splice(insertAfter + 1, 0, newLayout);
        } else {
          layouts.unshift(newLayout);
        }
      }
      // П-образная: если в старом конфиге нет — добавляем после углов.
      if (!layouts.some(function (l) { return l.key === 'top-right-bottom-partition'; })) {
        var insertUAfter = layouts.findIndex(function (l) {
          return l.key === 'corner-wardrobe-left' || l.key === 'top-left';
        });
        if (insertUAfter < 0) {
          insertUAfter = layouts.findIndex(function (l) {
            return l.key === 'corner-wardrobe' || l.key === 'top-right';
          });
        }
        var uLayout = {
          name: 'П-образная',
          key: 'top-right-bottom-partition',
          shape: 'top-right-bottom-partition',
          icon: 'shape:top-right-bottom-partition'
        };
        if (insertUAfter >= 0) {
          layouts.splice(insertUAfter + 1, 0, uLayout);
        } else {
          layouts.push(uLayout);
        }
      }
    }
  }

  const tagsApi =
    typeof window !== 'undefined' ? window.__cldRoomFurnitureTags : null;
  const roomKeyForFilter =
    typeof window !== 'undefined' && window.selectedRoomType
      ? window.selectedRoomType.key
      : null;
  if (tagsApi && typeof tagsApi.filterStep2Layouts === 'function' && layouts.length > 0) {
    layouts = tagsApi.filterStep2Layouts(layouts, roomKeyForFilter, config);
  }

  // Временный debug-режим: оставляем только один прямой и два угловых пресета.
  const debugSimpleLayouts =
    typeof window !== 'undefined' &&
    (window.DEBUG_ONLY_BACK_STRAIGHT_SECTION === true ||
      window.DEBUG_SIMPLE_LAYOUTS === true);
  if (debugSimpleLayouts) {
    const allowedKeys = new Set([
      'top-wall',
      'corner-wardrobe',
      'top-right',
      'corner-wardrobe-left',
      'top-left',
      'top-right-bottom-partition',
    ]);
    layouts = layouts.filter((l) => allowedKeys.has(l.key));
  }

  const sectionTitle = document.createElement('h3');
  sectionTitle.className = 'room-layout-section-title';
  sectionTitle.textContent = 'Выберите расположение';
  container.appendChild(sectionTitle);

  const grid = document.createElement('div');
  grid.className = 'room-types-grid room-layout-grid';
  grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';

  function createLayoutIcon(shapeType) {
    const size = 64;
    const margin = 4;
    const wallThickness = 9;

    const outerRect = `M ${margin} ${margin} L ${size - margin} ${margin} L ${
      size - margin
    } ${size - margin} L ${margin} ${size - margin} Z`;

    let walls = '';
    let partition = '';

    switch (shapeType) {
      case 'top-wall':
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>`;
        break;
      case 'top-right':
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>
                 <rect x="${
                   size - margin - wallThickness
                 }" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>`;
        break;
      case 'top-left':
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>
                 <rect x="${margin}" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>`;
        break;
      case 'top-partition': {
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>`;
        const partitionMargin = (size - margin * 2) / 4;
        partition = `<rect x="${
          margin + partitionMargin
        }" y="${size / 2}" width="${
          size - margin * 2 - partitionMargin * 2
        }" height="${wallThickness}"/>`;
        break;
      }
      case 'left-bottom':
        walls = `<rect x="${margin}" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>
                 <rect x="${margin}" y="${
          size - margin - wallThickness
        }" width="${size - margin * 2}" height="${wallThickness}"/>`;
        break;
      case 'top-left-partition': {
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>
                 <rect x="${margin}" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>`;
        const partitionMargin2 = (size - margin * 2) / 4;
        partition = `<rect x="${
          margin + partitionMargin2
        }" y="${size / 2}" width="${
          size - margin * 2 - partitionMargin2 * 2
        }" height="${wallThickness}"/>`;
        break;
      }
      case 'top-right-bottom-partition': {
        // П-образная: задняя + левая + правая (открыта вперёд). Ключ исторический.
        walls = `<rect x="${margin}" y="${margin}" width="${
          size - margin * 2
        }" height="${wallThickness}"/>
                 <rect x="${margin}" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>
                 <rect x="${
                   size - margin - wallThickness
                 }" y="${margin}" width="${wallThickness}" height="${
          size - margin * 2
        }"/>`;
        break;
      }
      default:
        walls = '';
    }

    return `
      <svg class="room-layout-scheme" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <path class="room-layout-scheme__room" d="${outerRect}" />
        <g class="room-layout-scheme__furniture">
        ${walls}
        ${partition}
        </g>
      </svg>
    `;
  }

  layouts.forEach((layout) => {
    const item = document.createElement('div');
    item.className = 'room-type-item room-layout-card';
    item.dataset.layoutType = layout.key;
    item.setAttribute('role', 'button');
    item.tabIndex = 0;
    const ui = resolveLayoutUi(layout);
    item.setAttribute('aria-label', ui.label);
    const candidates = [layout.icon, layout.image, layout.iconUrl, layout.img];
    let imgSrc = '';
    for (let ci = 0; ci < candidates.length; ci++) {
      const v = String(candidates[ci] || '').trim();
      if (!v || v.indexOf('shape:') === 0) continue;
      if (/^https?:\/\//i.test(v) || v.charAt(0) === '/') {
        imgSrc = v;
        break;
      }
    }
    const isImg = !!imgSrc;
    /** Кириллица/пробелы в /files/... — кодируем сегменты пути. */
    function encodeFilesUrl(url) {
      if (!url || /^https?:\/\//i.test(url)) return url;
      try {
        return String(url)
          .split('/')
          .map(function (seg, i) {
            if (i === 0 && seg === '') return '';
            try {
              return encodeURIComponent(decodeURIComponent(seg));
            } catch (_) {
              return encodeURIComponent(seg);
            }
          })
          .join('/');
      } catch (_) {
        return url;
      }
    }
    const previewInner = isImg
      ? '<img src="' +
        encodeFilesUrl(imgSrc).replace(/"/g, '&quot;') +
        '" alt="" class="room-layout-preview__img" decoding="async">'
      : '<div class="room-layout-preview__scheme">' +
        createLayoutIcon(layout.shape) +
        '</div>';

    item.className =
      'room-type-item room-layout-card' +
      (isImg ? ' room-layout-card--photo' : ' room-layout-card--scheme');

    if (isImg) {
      // Есть image: вся карточка = картинка, без названия/описания и без .room-type-icon.
      item.innerHTML =
        '<img src="' +
        encodeFilesUrl(imgSrc).replace(/"/g, '&quot;') +
        '" alt="" class="room-layout-card__photo" decoding="async">' +
        '<span class="room-layout-selected-indicator" aria-hidden="true"></span>';
    } else {
      const descHtml = ui.desc
        ? '<div class="room-layout-desc">' +
          String(ui.desc).replace(/</g, '&lt;') +
          '</div>'
        : '';
      item.innerHTML =
        '<div class="room-type-icon room-layout-preview room-layout-preview--scheme">' +
        previewInner +
        '</div>' +
        '<div class="room-layout-meta">' +
        '<div class="room-type-name room-layout-name">' +
        String(ui.label).replace(/</g, '&lt;') +
        '</div>' +
        descHtml +
        '</div>' +
        '<span class="room-layout-selected-indicator" aria-hidden="true"></span>';
    }

    // Клик просто выбирает раскладку и разблокирует "Далее"
    item.addEventListener('click', () => {
      grid
        .querySelectorAll('.room-type-item')
        .forEach((i) => i.classList.remove('selected'));
      item.classList.add('selected');

      window.selectedRoomLayout = layout;
      state.pendingLayoutKey = layout.key;

      const nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) {
        nextBtn.disabled = false;
      }
    });

    // Поведение как в старом ядре:
    // зажимаем ЛКМ на иконке раскладки (например, "Верхняя стена"),
    // тащим курсор на стену, отпускаем — секция создаётся.
    item.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      // Drag‑placement сейчас поддерживаем для:
      // - одиночной секции "Верхняя стена" (top-wall)
      // - углового шкафа "задняя+правая" (corner-wardrobe)
      // - углового шкафа "задняя+левая" (corner-wardrobe-left)
      // - П-образной (top-right-bottom-partition)
      const isCornerLayout =
        layout.key === 'corner-wardrobe' ||
        layout.key === 'top-right' ||
        layout.key === 'corner-wardrobe-left' ||
        layout.key === 'top-left';
      const isULayout = layout.key === 'top-right-bottom-partition';
      if (layout.key !== 'top-wall' && !isCornerLayout && !isULayout) return;

      event.preventDefault();
      event.stopPropagation();

      console.log('🖱️ Зажата ЛКМ на иконке раскладки', layout.key, '(drag placement, modular)');

      // Иконка считается выбранной, шаг можно завершить
      grid
        .querySelectorAll('.room-type-item')
        .forEach((i) => i.classList.remove('selected'));
      item.classList.add('selected');
      window.selectedRoomLayout = layout;
      // Запоминаем активный пресет раскладки для секционного менеджера/камеры
      state.pendingLayoutKey = layout.key;
      const nextBtn = document.getElementById('sidebar-next-btn');
      if (nextBtn) {
        nextBtn.disabled = false;
      }

      const canvas = state.renderer && state.renderer.domElement;
      if (!canvas || !state.room) {
        console.warn('⚠️ Невозможно начать размещение секции: нет renderer или комнаты');
        return;
      }

      let placementStarted = false;

      const handleMouseMove = (moveEvent) => {
        if (!state.room) return;

        const rect = canvas.getBoundingClientRect();
        const x = moveEvent.clientX;
        const y = moveEvent.clientY;

        const insideCanvas =
          x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        if (insideCanvas) {
          // Впервые зашли в canvas — запускаем режим размещения и призрак
          if (!placementStarted) {
            startPlacingSection();
            placementStarted = true;
          }
          // Дальше позицию призрака обновляет обработчик mousemove в camera.js
        } else if (placementStarted && state.sectionGhost) {
          // Вышли за пределы canvas — прячем призрак, но не завершаем режим
          state.sectionGhost.visible = false;
        }
      };

      const handleMouseUp = (upEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const rect = canvas.getBoundingClientRect();
        const x = upEvent.clientX;
        const y = upEvent.clientY;

        const insideCanvas =
          x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        // Если отпустили кнопку НЕ над canvas — полностью отменяем размещение,
        // чтобы секция нигде не поставилась (как в старом ядре).
        if (!insideCanvas && state.isPlacingSection) {
          cancelSectionPlacement();
        }
        // Если отпустили над canvas и призрак уже был активирован,
        // фактическое размещение произойдёт в onMouseUp камеры (core/camera.js).
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    grid.appendChild(item);
  });

  container.appendChild(grid);
}

// Make key APIs available globally for modules that expect legacy globals
// (scene-icons.js uses global showEditRoomModal)
window.showEditRoomModal = showEditRoomModal;
