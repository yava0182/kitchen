/**
 * Патч: добавляет params.sectionSize при сохранении каталога в localStorage.
 * Это нужно, чтобы в комнате шкафы ставились с правильными размерами (900×2500×700 вместо дефолта 600×2400×600).
 * Вызывается после admin-new-bundle.js.
 */
(function() {
  'use strict';

  function readClodisJSON(obj) {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__cldReadClodisJSON === 'function') {
      return globalThis.__cldReadClodisJSON(obj);
    }
    if (!obj || typeof obj !== 'object') return undefined;
    return obj.clodisJSON ?? undefined;
  }

  function getSectionSizeFromItem(item) {
    const def = { x: 600, y: 2400, z: 600 };
    if (!item) return null;

    // 1. params.sectionSize
    const ps = item.params?.sectionSize;
    if (ps && (typeof ps.x === 'number' || typeof ps.width === 'number')) {
      return {
        x: typeof ps.x === 'number' ? ps.x : (ps.width || def.x),
        y: typeof ps.y === 'number' ? ps.y : (ps.height || def.y),
        z: typeof ps.z === 'number' ? ps.z : (ps.depth || def.z)
      };
    }

    // 2. params.variants[0]
    const v = item.params?.variants?.[0];
    if (v && (typeof v.width === 'number' || typeof v.x === 'number')) {
      return {
        x: typeof v.x === 'number' ? v.x : (v.width || def.x),
        y: typeof v.y === 'number' ? v.y : (v.height || def.y),
        z: typeof v.z === 'number' ? v.z : (v.depth || def.z)
      };
    }

    // 3. item.data.width/height/depth (форма конструктора — кастомные размеры модуля)
    const dd = item.data;
    if (dd && typeof dd === 'object') {
      const dw = dd.width ?? item.width;
      const dh = dd.height ?? item.height;
      const dz = dd.depth ?? item.depth;
      const nw = typeof dw === 'number' ? dw : parseInt(dw, 10);
      const nh = typeof dh === 'number' ? dh : parseInt(dh, 10);
      const nd = typeof dz === 'number' ? dz : parseInt(dz, 10);
      if (Number.isFinite(nw) && nw > 0 && Number.isFinite(nh) && nh > 0 && Number.isFinite(nd) && nd > 0) {
        return { x: nw, y: nh, z: nd };
      }
    }

    // 4. item.size или item.width/height/depth
    const sz = item.size || (item.width != null ? { x: item.width, y: item.height, z: item.depth } : null);
    if (sz && (typeof sz.x === 'number' || typeof sz.width === 'number')) {
      return {
        x: typeof sz.x === 'number' ? sz.x : (sz.width ?? def.x),
        y: typeof sz.y === 'number' ? sz.y : (sz.height ?? def.y),
        z: typeof sz.z === 'number' ? sz.z : (sz.depth ?? def.z)
      };
    }

    // 5. clodisJSON [0].size с числами
    const pp = readClodisJSON(item);
    const root = Array.isArray(pp) ? pp[0] : (pp && typeof pp === 'object' ? pp : null);
    if (root && root.size) {
      const s = root.size;
      const nx = typeof s.x === 'number' ? s.x : parseFloat(s.x);
      const ny = typeof s.y === 'number' ? s.y : parseFloat(s.y);
      const nz = typeof s.z === 'number' ? s.z : parseFloat(s.z);
      if (Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz)) {
        return { x: nx, y: ny, z: nz };
      }
    }

    // 6. Форма — поля «Размеры» (Ширина, Высота, Глубина)
    const wEl = document.getElementById('catalog-item-edit-width');
    const hEl = document.getElementById('catalog-item-edit-height');
    const dEl = document.getElementById('catalog-item-edit-depth');
    if (wEl && hEl && dEl) {
      const wx = parseFloat(wEl.value);
      const hy = parseFloat(hEl.value);
      const dz = parseFloat(dEl.value);
      if (Number.isFinite(wx) && Number.isFinite(hy) && Number.isFinite(dz) && wx > 0 && hy > 0 && dz > 0) {
        return { x: wx, y: hy, z: dz };
      }
    }

    return null;
  }

  function enrichCatalogItemsWithSectionSize(list) {
    if (!Array.isArray(list)) return list;
    return list.map(function(item) {
      if (!item || !readClodisJSON(item)) return item;
      if (item.params && item.params.sectionSize) return item;
      const size = getSectionSizeFromItem(item);
      if (!size) return item;
      const clone = JSON.parse(JSON.stringify(item));
      clone.params = clone.params || {};
      clone.params.sectionSize = size;
      return clone;
    });
  }

  var _setItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (key && key.indexOf('catalog_') === 0 && typeof value === 'string') {
      try {
        var parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          value = JSON.stringify(enrichCatalogItemsWithSectionSize(parsed));
        }
      } catch (e) {}
    }
    return _setItem.call(this, key, value);
  };
})();
