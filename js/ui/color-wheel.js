// Простая версия цветового круга для шага 5.
// Строит только SVG‑круг с сегментами без правой панели и слотов.
//
// Правило визуала: если есть текстура декора — только она; hex — только если текстуры нет.

// Хранилище выбранных декоров: outside = канал «снаружи» (фасады и т.д.), inside = «внутри» (корпус).
// Оба кольца колеса — две палитры материалов; активный канал переключают кнопки, не кольцо (applyToActiveTarget).
const STEP5_DECOR_STORAGE_KEY = 'room_step5_decor_selection';
const STEP5_WHEEL_PLACEHOLDER_HEX = new Set(['#cccccc', '#ccc']);

/** URL текстуры декора (единственный приоритет для 3D, если загружен). */
export function getStep5DecorTextureUrl(decor) {
  if (!decor) return '';
  return String(decor.texture || decor.icon || '').trim();
}

/** Цвет только если нет текстуры декора. */
export function getStep5DecorHexFallback(decor) {
  if (!decor) return null;
  if (getStep5DecorTextureUrl(decor)) return null;
  const h = String(decor.hex || '').trim();
  if (!h || STEP5_WHEEL_PLACEHOLDER_HEX.has(h.toLowerCase())) return null;
  return h;
}

/** Цвет-плейсхолдер, пока грузится текстура (чтобы не мигал белый корпус). */
export function getStep5DecorPreviewColor(decor) {
  const hex = getStep5DecorHexFallback(decor);
  if (hex) return hex;
  const direct = String(decor?.color || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(direct)) return direct;
  const mid = Number(decor?.material_id ?? decor?.materialId);
  if (Number.isFinite(mid) && mid > 0) {
    const list = typeof window !== 'undefined' ? window.__cldMaterialsLib?.itemsByKey?.material_2 : null;
    const item = Array.isArray(list) ? list.find((x) => Number(x?.id) === mid) : null;
    const fromCard = String(item?.color || '').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(fromCard)) return fromCard;
  }
  return null;
}

function __preloadStep5DecorTexture(decor) {
  const url = getStep5DecorTextureUrl(decor);
  if (!url || typeof window.__cldLoadDecorTexture !== 'function') return;
  window.__cldLoadDecorTexture(url, () => {});
}

export function hasStep5DecorVisual(decor) {
  return !!(getStep5DecorTextureUrl(decor) || getStep5DecorHexFallback(decor));
}

function __decorateStep5FromMaterialCard(decor) {
  const ext = typeof window !== 'undefined' ? window.__cldStep5Edge : null;
  if (ext && typeof ext.decorateFromMaterialCard === 'function') {
    return ext.decorateFromMaterialCard(decor);
  }
  return decor;
}

export function getStep5DecorSelection() {
  try {
    const raw = localStorage.getItem(STEP5_DECOR_STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        outside: __decorateStep5FromMaterialCard(s.outside || null),
        inside: __decorateStep5FromMaterialCard(s.inside || null),
      };
    }
  } catch (e) {}
  return { outside: null, inside: null };
}

/** Декор пригоден для 3D/выбора: текстура, hex или привязка к материалу ЛДСП. */
export function mergeStep5DecorWithWheelEntry(decor, wheelList) {
  if (!decor || !Array.isArray(wheelList)) return decor;
  const decorMid =
    decor.material_id != null
      ? Number(decor.material_id)
      : decor.materialId != null
        ? Number(decor.materialId)
        : null;
  let full = decor.id
    ? wheelList.find((c) => c && String(c.id) === String(decor.id))
    : null;
  if (!full && Number.isFinite(decorMid) && decorMid > 0) {
    const mk = `m-${decorMid}`;
    full =
      wheelList.find((c) => c && String(c.id) === mk) ||
      wheelList.find((c) => c && Number(c.material_id ?? c.materialId) === decorMid);
  }
  if (!full) return decor;
  const texDecor = decor.texture && String(decor.texture).trim();
  const texFull = full.texture && String(full.texture).trim();
  const merged = {
    ...full,
    ...decor,
    texture: texDecor || texFull || '',
    name: decor.name || full.name,
    material_type: decor.material_type || decor.materialType || full.material_type || full.materialType || null,
    material_id:
      decor.material_id != null
        ? decor.material_id
        : decor.materialId != null
          ? decor.materialId
          : full.material_id != null
            ? full.material_id
            : full.materialId,
  };
  return __decorateStep5FromMaterialCard(merged);
}

export function isStep5DecorUsable(c) {
  if (!c || !c.id) return false;
  const hasMat =
    (c.material_id != null || c.materialId != null) &&
    !!(c.material_type || c.materialType);
  if (hasMat) return true;
  return hasStep5DecorVisual(c);
}

function __normalizeStep5DecorPayload(c) {
  if (!c) return null;
  const d = __decorateStep5FromMaterialCard({
    id: c.id,
    name: c.name,
    texture: c.texture,
    hex: c.hex,
    material_type: c.material_type || c.materialType || null,
    material_id:
      c.material_id != null
        ? c.material_id
        : c.materialId != null
          ? c.materialId
          : null,
    material_key: c.material_key || c.materialKey || null,
  });
  const texture = getStep5DecorTextureUrl(d);
  const out = {
    id: d.id,
    name: d.name,
    texture,
    material_type: d.material_type || d.materialType || null,
    material_id: d.material_id != null ? d.material_id : d.materialId,
    material_key: d.material_key || d.materialKey || null,
  };
  const hex = getStep5DecorHexFallback(d);
  if (hex) out.hex = hex;
  return out;
}

export function setStep5DecorSelection(ring, color) {
  const sel = getStep5DecorSelection();
  if (ring === 'outside') sel.outside = __normalizeStep5DecorPayload(color);
  if (ring === 'inside') sel.inside = __normalizeStep5DecorPayload(color);
  try {
    localStorage.setItem(STEP5_DECOR_STORAGE_KEY, JSON.stringify(sel));
  } catch (e) {}
  __preloadStep5DecorTexture(sel.outside);
  __preloadStep5DecorTexture(sel.inside);
}

// Дефолтный набор декоров на случай, если админка шага 5 ещё не заполнена.
const DEFAULT_COLORS = [
  // Внешний круг (16 цветов)
  { id: 'cold-gray', hex: '#E0E0E0', name: 'Холодный серый' },
  { id: 'white-snow', hex: '#FFFFFF', name: 'Белый снег' },
  { id: 'clay-gray', hex: '#B8B5B0', name: 'Глиняный серый' },
  { id: 'oak-hudson', hex: '#8B7355', name: 'Дуб Гудзон' },
  { id: 'kashmir', hex: '#E8E4D9', name: 'Кашемир' },
  { id: 'powder', hex: '#E8D7D7', name: 'Пудровый' },
  { id: 'silent-desert', hex: '#D6C4B7', name: 'Безмолвная пустыня' },
  { id: 'graphite', hex: '#474A51', name: 'Серый графит' },
  { id: 'mint', hex: '#98FF98', name: 'Мята' },
  { id: 'midnight-blue', hex: '#191970', name: 'Полуночно‑синий' },
  { id: 'champagne', hex: '#F7E7CE', name: 'Шампань' },
  { id: 'light-gray-2', hex: '#D8D8D8', name: 'MDF 2' },
  { id: 'beige-2', hex: '#C4B4A7', name: 'Бежевый 2' },
  { id: 'dark-gray-2', hex: '#3A3A3A', name: 'Тёмно‑серый 2' },
  { id: 'cream-1', hex: '#FFFDD0', name: 'Кремовый 1' },
  { id: 'black-1', hex: '#000000', name: 'Чёрный 1' },
  // Внутренний круг (6 цветов)
  { id: 'walnut', hex: '#6E4C1E', name: 'Орех' },
  { id: 'mahogany', hex: '#C04000', name: 'Махагон' },
  { id: 'oak', hex: '#806517', name: 'Дуб' },
  { id: 'pine', hex: '#DEB887', name: 'Сосна' },
  { id: 'cherry', hex: '#922724', name: 'Вишня' },
  { id: 'wenge', hex: '#4A3004', name: 'Венге' },
];

function polarToCartesian(cx, cy, r, angleRad) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function createSegmentPath(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);

  const largeArc = endAngle - startAngle <= Math.PI ? '0' : '1';

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

export function initColorWheel(hostElement) {
  if (!hostElement) return;

  // Читаем конфиг room_steps_config из localStorage (как в других модулях)
  function getRoomStepsConfigLocal() {
    try {
      const raw = localStorage.getItem('room_steps_config');
      if (raw) {
        const c = JSON.parse(raw);
        if (c && c.steps && c.steps.length) return c;
      }
    } catch (e) {}
    return null;
  }

  const config = getRoomStepsConfigLocal();
  let outerColors = [];
  let innerColors = [];
  let step5Defaults = null;
  if (config && config.steps) {
    const step5 = config.steps.find((s) => s.stepId === 5);
    if (step5) {
      if (Array.isArray(step5.step5WheelOuter)) outerColors = step5.step5WheelOuter.slice();
      if (Array.isArray(step5.step5WheelInner)) innerColors = step5.step5WheelInner.slice();
      if (step5.step5Defaults && typeof step5.step5Defaults === 'object') {
        step5Defaults = step5.step5Defaults;
      }
    }
  }
  console.log('[STEP5][WHEEL] initColorWheel: config step5Defaults =', step5Defaults, 'outer len=', outerColors.length, 'inner len=', innerColors.length);
  // Если админка вообще не настроена — используем полностью дефолтное кольцо.
  // Кольца равнозначны (разная вёрстка). Если один пуст — подставляем заглушки для отрисовки.
  if (!outerColors.length && !innerColors.length) {
    outerColors = DEFAULT_COLORS.slice(0, 16);
    innerColors = DEFAULT_COLORS.slice(16);
  } else {
    if (!outerColors.length) outerColors = DEFAULT_COLORS.slice(0, 16);
    if (!innerColors.length) innerColors = DEFAULT_COLORS.slice(16);
  }

  // --- Дефолтные декоры шага 5 ---
  // ВАЖНО: если пользователь ещё ничего не выбирал, берём дефолт из самого круга (админка)
  // и/или настроек step5Defaults, чтобы сразу был реальный материал и его кромка.
  try {
    const sel0 = getStep5DecorSelection();
    const all = []
      .concat(Array.isArray(outerColors) ? outerColors : [])
      .concat(Array.isArray(innerColors) ? innerColors : []);
    const findById = (id) => {
      if (!id) return null;
      const sid = String(id);
      let found = all.find((c) => c && String(c.id) === sid);
      if (!found) {
        const m = sid.match(/^m-(\d+)$/);
        if (m) {
          const mid = Number(m[1]);
          found = all.find((c) => c && Number(c.material_id ?? c.materialId) === mid);
        }
      }
      return found || null;
    };
    let defOutside = null;
    let defInside = null;

    if (step5Defaults) {
      const pickFromWheel = (id) => {
        if (!id) return null;
        return findById(id);
      };
      if (step5Defaults.outsideId) {
        defOutside = pickFromWheel(step5Defaults.outsideId);
      } else if (step5Defaults.defaultId) {
        defOutside = pickFromWheel(step5Defaults.defaultId);
      }
      if (step5Defaults.insideId) {
        defInside = pickFromWheel(step5Defaults.insideId);
      } else if (step5Defaults.defaultId) {
        defInside = pickFromWheel(step5Defaults.defaultId);
      }
    }

    // Фоллбек: старая эвристика "Белый фасадный" / "Белый" / первый с материалом.
    const norm = (s) => String(s || '').trim().toLowerCase();
    const pickHeuristic = (wheel) => {
      const list = Array.isArray(wheel) && wheel.length ? wheel : all;
      const facadeWhite = list.find(
        (c) => isStep5DecorUsable(c) && norm(c.name).includes('белый') && norm(c.name).includes('фасад'),
      );
      const anyWhite = list.find((c) => isStep5DecorUsable(c) && norm(c.name).includes('белый'));
      const anyVisual = list.find((c) => isStep5DecorUsable(c));
      return facadeWhite || anyWhite || anyVisual || null;
    };

    if (!defOutside || !isStep5DecorUsable(defOutside)) defOutside = null;
    if (!defInside || !isStep5DecorUsable(defInside)) defInside = null;

    if (!defOutside) defOutside = pickHeuristic(all);
    if (!defInside) defInside = pickHeuristic(all);

    console.log('[STEP5][WHEEL] Default decor resolve:', {
      fromDefaults: step5Defaults,
      sel0,
      defOutside,
      defInside,
    });

    if (defOutside && !sel0.outside) {
      console.log('[STEP5][WHEEL] Applying DEFAULT outside from config:', defOutside);
      setStep5DecorSelection('outside', defOutside);
    }
    if (defInside && !sel0.inside) {
      console.log('[STEP5][WHEEL] Applying DEFAULT inside from config:', defInside);
      setStep5DecorSelection('inside', defInside);
    }
  } catch (e) {}

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 568 568');
  svg.style.width = '100%';
  svg.style.height = '100%';

  const CENTER = 284;

  // Defs в начале: фильтр мягкой тени снизу + градиент ободка
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const dropShadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  dropShadowFilter.setAttribute('id', 'cw-soft-shadow');
  dropShadowFilter.setAttribute('filterUnits', 'objectBoundingBox');
  dropShadowFilter.setAttribute('x', '-0.15');
  dropShadowFilter.setAttribute('y', '-0.1');
  dropShadowFilter.setAttribute('width', '1.3');
  dropShadowFilter.setAttribute('height', '1.35');
  const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
  feDropShadow.setAttribute('dx', '0');
  feDropShadow.setAttribute('dy', '12');
  feDropShadow.setAttribute('stdDeviation', '20');
  feDropShadow.setAttribute('flood-color', '#000000');
  feDropShadow.setAttribute('flood-opacity', '0.18');
  dropShadowFilter.appendChild(feDropShadow);
  defs.appendChild(dropShadowFilter);

  const outerShadowGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  outerShadowGrad.setAttribute('id', 'cw-outer-shadow');
  outerShadowGrad.setAttribute('x1', '0%');
  outerShadowGrad.setAttribute('y1', '0%');
  outerShadowGrad.setAttribute('x2', '0%');
  outerShadowGrad.setAttribute('y2', '100%');
  let stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stopEl.setAttribute('offset', '0%');
  stopEl.setAttribute('stop-color', '#000000');
  stopEl.setAttribute('stop-opacity', '0');
  outerShadowGrad.appendChild(stopEl);
  stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stopEl.setAttribute('offset', '55%');
  stopEl.setAttribute('stop-color', '#000000');
  stopEl.setAttribute('stop-opacity', '0.04');
  outerShadowGrad.appendChild(stopEl);
  stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stopEl.setAttribute('offset', '100%');
  stopEl.setAttribute('stop-color', '#000000');
  stopEl.setAttribute('stop-opacity', '0.16');
  outerShadowGrad.appendChild(stopEl);
  defs.appendChild(outerShadowGrad);
  svg.appendChild(defs);

  const wheelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  wheelGroup.setAttribute('filter', 'url(#cw-soft-shadow)');

  const R_OUTER = 280;
  const R_SEP = 180;
  const W_SEP = 18;
  const R_INNER = 95;

  // Разделительное кольцо между кругами
  const separatorCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  separatorCircle.setAttribute('cx', CENTER);
  separatorCircle.setAttribute('cy', CENTER);
  separatorCircle.setAttribute('r', R_SEP);
  separatorCircle.setAttribute('fill', 'none');
  separatorCircle.setAttribute('stroke', '#f7f6f2');
  separatorCircle.setAttribute('stroke-width', String(W_SEP));
  wheelGroup.appendChild(separatorCircle);

  // Тонкий внешний ободок с лёгкой тенью снизу по контуру круга
  const outerShadowRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  outerShadowRing.setAttribute('cx', CENTER);
  outerShadowRing.setAttribute('cy', CENTER);
  outerShadowRing.setAttribute('r', String(R_OUTER - 4));
  outerShadowRing.setAttribute('fill', 'none');
  outerShadowRing.setAttribute('stroke', 'url(#cw-outer-shadow)');
  outerShadowRing.setAttribute('stroke-width', '8');
  wheelGroup.appendChild(outerShadowRing);

  // Центральный текст (две строки) как в исходном круге
  const centerTextLine1 = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'text',
  );
  centerTextLine1.setAttribute('x', CENTER);
  centerTextLine1.setAttribute('y', CENTER - 10);
  centerTextLine1.setAttribute('font-size', '16');
  centerTextLine1.setAttribute('text-anchor', 'middle');
  centerTextLine1.setAttribute('font-family', 'inherit');
  centerTextLine1.setAttribute('font-weight', 'bold');
  centerTextLine1.setAttribute('fill', '#333');
  centerTextLine1.textContent = '';

  const centerTextLine2 = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'text',
  );
  centerTextLine2.setAttribute('x', CENTER);
  centerTextLine2.setAttribute('y', CENTER + 14);
  centerTextLine2.setAttribute('font-size', '16');
  centerTextLine2.setAttribute('text-anchor', 'middle');
  centerTextLine2.setAttribute('font-family', 'inherit');
  centerTextLine2.setAttribute('font-weight', 'normal');
  centerTextLine2.setAttribute('fill', '#333');
  centerTextLine2.textContent = '';

  /**
   * Полные JPG в SVG pattern (даже 40×40) декодируются целиком → на шаге 5
   * Chrome даёт ERR_INSUFFICIENT_RESOURCES + WebGL OOM при уже стоящих шкафах.
   * Сначала hex/preview; миниатюра ≤64px — очередь max 2.
   */
  const WHEEL_THUMB_MAX_PX = 64;
  const WHEEL_THUMB_CONCURRENCY = 2;
  const createdPatterns = new Set();
  const thumbJobs = [];
  let thumbActive = 0;
  const thumbCache = new Map();

  function downscaleTextureToDataUrl(url) {
    if (thumbCache.has(url)) return Promise.resolve(thumbCache.get(url));
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        try {
          const scale = Math.min(
            1,
            WHEEL_THUMB_MAX_PX / Math.max(1, img.naturalWidth || img.width, img.naturalHeight || img.height)
          );
          const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
          const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          thumbCache.set(url, dataUrl);
          resolve(dataUrl);
        } catch (_) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function pumpWheelThumbs() {
    while (thumbActive < WHEEL_THUMB_CONCURRENCY && thumbJobs.length) {
      const job = thumbJobs.shift();
      thumbActive += 1;
      downscaleTextureToDataUrl(job.url)
        .then((dataUrl) => {
          if (dataUrl && job.imageEl?.isConnected) {
            job.imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
            if (typeof job.onReady === 'function') job.onReady(job.patternId);
          }
        })
        .finally(() => {
          thumbActive -= 1;
          pumpWheelThumbs();
        });
    }
  }

  function ensureTexturePattern(color, onReady) {
    if (!color || !color.texture) return null;
    const idSafe = String(color.id || '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'tex';
    const patternId = `cwtex-${idSafe}`;
    if (createdPatterns.has(patternId)) {
      if (typeof onReady === 'function' && thumbCache.has(String(color.texture))) onReady(patternId);
      return patternId;
    }
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '40');
    pattern.setAttribute('height', '40');
    pattern.setAttribute('patternTransform', 'rotate(45)');
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('width', '40');
    image.setAttribute('height', '40');
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    pattern.appendChild(image);
    defs.appendChild(pattern);
    createdPatterns.add(patternId);
    thumbJobs.push({
      url: String(color.texture),
      imageEl: image,
      patternId,
      onReady,
    });
    pumpWheelThumbs();
    return patternId;
  }

  function segmentPreviewFill(color) {
    return (
      getStep5DecorPreviewColor(color) ||
      getStep5DecorHexFallback(color) ||
      color.hex ||
      '#cccccc'
    );
  }

  function bindSegmentTextureFill(path, color) {
    path.setAttribute('fill', segmentPreviewFill(color));
    if (!color?.texture) return;
    ensureTexturePattern(color, (patternId) => {
      if (path.isConnected && patternId) path.setAttribute('fill', `url(#${patternId})`);
    });
  }

  /** Клик по любому сегменту (внешнее или внутреннее кольцо) пишет выбранный декор в активный канал (кнопки снаружи/внутри). */
  const applyToActiveTarget = (color) => {
    const activeTarget =
      typeof window !== 'undefined' ? window.step5DecorTarget : null;
    const target =
      activeTarget === 'inside' ||
      activeTarget === 'outside' ||
      activeTarget === 'endOverlay'
        ? activeTarget
        : 'outside';
    console.log('[STEP5] applyToActiveTarget:', { target, color: color?.id || color?.name || '—' });
    // Режим «иконка шкафа»: красим только выбранный модуль, без записи в глобальный room_step5_decor_selection.
    if (
      typeof window !== 'undefined' &&
      window.step5EditingFurnitureGroup &&
      typeof window.applyStep5ModuleDecorToFurnitureGroup === 'function'
    ) {
      window.applyStep5ModuleDecorToFurnitureGroup(window.step5EditingFurnitureGroup, target, color);
      hostElement.dispatchEvent(new CustomEvent('step5-decor-selected', { detail: { ring: target, color, moduleOnly: true } }));
      return;
    }
    setStep5DecorSelection(target, color);
    hostElement.dispatchEvent(new CustomEvent('step5-decor-selected', { detail: { ring: target, color } }));
  };

  // Внешние сегменты
  outerColors.forEach((color, index) => {
    const startAngle =
      (index / outerColors.length) * Math.PI * 2 - Math.PI / 2;
    const endAngle =
      ((index + 1) / outerColors.length) * Math.PI * 2 - Math.PI / 2;

    const makePath = (outerRadius) =>
      createSegmentPath(
        CENTER,
        CENTER,
        R_SEP + W_SEP / 2,
        outerRadius,
        startAngle,
        endAngle,
      );

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', makePath(R_OUTER));
    bindSegmentTextureFill(path, color);
    path.style.cursor = 'pointer';

    path.addEventListener('mouseenter', () => {
      path.setAttribute('d', makePath(R_OUTER + 10));
      const name = color.name || '';
      const words = name.split(' ');
      if (words.length > 1) {
        centerTextLine1.textContent = words[0];
        centerTextLine2.textContent = words.slice(1).join(' ');
      } else {
        centerTextLine1.textContent = name;
        centerTextLine2.textContent = '';
      }
    });

    path.addEventListener('mouseleave', () => {
      path.setAttribute('d', makePath(R_OUTER));
      centerTextLine1.textContent = '';
      centerTextLine2.textContent = '';
    });

    path.addEventListener('click', () => {
      console.log('[STEP5] Клик по сегменту круга:', color?.name || color?.id, color);
      applyToActiveTarget(color);
    });

    wheelGroup.appendChild(path);
  });

  // Внутренние сегменты (если заданы отдельным списком)
  innerColors.forEach((color, index) => {
    const startAngle =
      (index / innerColors.length) * Math.PI * 2 - Math.PI / 2;
    const endAngle =
      ((index + 1) / innerColors.length) * Math.PI * 2 - Math.PI / 2;

    const makePath = (outerRadius) =>
      createSegmentPath(
        CENTER,
        CENTER,
        R_INNER,
        outerRadius,
        startAngle,
        endAngle,
      );

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', makePath(R_SEP - W_SEP / 2));
    bindSegmentTextureFill(path, color);
    path.style.cursor = 'pointer';

    path.addEventListener('mouseenter', () => {
      path.setAttribute('d', makePath(R_SEP - W_SEP / 2 + 10));
      const name = color.name || '';
      const words = name.split(' ');
      if (words.length > 1) {
        centerTextLine1.textContent = words[0];
        centerTextLine2.textContent = words.slice(1).join(' ');
      } else {
        centerTextLine1.textContent = name;
        centerTextLine2.textContent = '';
      }
    });

    path.addEventListener('mouseleave', () => {
      path.setAttribute('d', makePath(R_SEP - W_SEP / 2));
      centerTextLine1.textContent = '';
      centerTextLine2.textContent = '';
    });

    path.addEventListener('click', () => {
      console.log('[STEP5] Клик по сегменту круга:', color?.name || color?.id, color);
      applyToActiveTarget(color);
    });

    wheelGroup.appendChild(path);
  });

  // Внутренний круг (центр — белый, под подписи/кнопки в будущем)
  const innerCircle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle',
  );
  innerCircle.setAttribute('cx', CENTER);
  innerCircle.setAttribute('cy', CENTER);
  innerCircle.setAttribute('r', R_INNER);
  innerCircle.setAttribute('fill', '#ffffff');
  wheelGroup.appendChild(innerCircle);

  // Текстовые подписи должны быть поверх центрального круга
  wheelGroup.appendChild(centerTextLine1);
  wheelGroup.appendChild(centerTextLine2);

  svg.appendChild(wheelGroup);

  hostElement.innerHTML = '';
  hostElement.appendChild(svg);
}

// Для доступа из furniture-manager и ClodisBuilder (без импорта)
if (typeof window !== 'undefined') {
  window.getStep5DecorSelection = getStep5DecorSelection;
  window.setStep5DecorSelection = setStep5DecorSelection;
  window.__cldStep5Decor = {
    getTextureUrl: getStep5DecorTextureUrl,
    getHexFallback: getStep5DecorHexFallback,
    getPreviewColor: getStep5DecorPreviewColor,
    hasVisual: hasStep5DecorVisual,
  };
  window.getStep5DecorPreviewColor = getStep5DecorPreviewColor;
}
