/** Пропорции иконки каталога: tall (шкаф 1:2) | low (тумба/комод, высота 1/3). */

export const CATALOG_ICON_ASPECT_TALL = 'tall';
export const CATALOG_ICON_ASPECT_LOW = 'low';

export function normalizeCatalogIconAspect(value) {
  const s = String(value == null ? '' : value).trim().toLowerCase();
  if (s === 'low' || s === 'short' || s === 'compact' || s === 'низкий' || s === 'низкая') {
    return CATALOG_ICON_ASPECT_LOW;
  }
  return CATALOG_ICON_ASPECT_TALL;
}

export function loadCatalogCategoriesArray(catalogType) {
  const ct = String(catalogType || '').trim();
  if (!ct) return [];
  const keys = ct.startsWith('catalog_')
    ? [`catalogCategories_${ct}`]
    : [`catalogCategories_catalog_${ct}`, `catalogCategories_${ct}`];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch (_) {}
  }
  return [];
}

/** iconAspect первой подходящей категории элемента. */
export function resolveIconAspectFromCategories(catalogType, categoryIds) {
  const cats = loadCatalogCategoriesArray(catalogType);
  if (!cats.length || !Array.isArray(categoryIds) || !categoryIds.length) {
    return CATALOG_ICON_ASPECT_TALL;
  }
  const idSet = new Set(categoryIds.map((id) => Number(id)).filter(Number.isFinite));
  for (const cat of cats) {
    const cid = Number(cat?.id ?? cat?.category_id);
    if (!Number.isFinite(cid) || !idSet.has(cid)) continue;
    if (cat.iconAspect != null && String(cat.iconAspect).trim() !== '') {
      return normalizeCatalogIconAspect(cat.iconAspect);
    }
  }
  return CATALOG_ICON_ASPECT_TALL;
}

/** Распарсить item.data (объект или JSON-строка из legacy-выгрузки). */
export function parseCatalogItemDataField(item) {
  let d = item?.data;
  if (typeof d === 'string') {
    try {
      d = JSON.parse(d);
    } catch (_) {
      d = {};
    }
  }
  return d && typeof d === 'object' && !Array.isArray(d) ? d : {};
}

export function resolveCatalogItemIconAspect(item, catalogType) {
  if (!item) return CATALOG_ICON_ASPECT_TALL;
  const parsed = parseCatalogItemDataField(item);
  const direct = item.iconAspect ?? parsed.iconAspect;
  if (direct != null && String(direct).trim() !== '') {
    return normalizeCatalogIconAspect(direct);
  }
  const placementKind = item.placementKind ?? parsed.placementKind;
  if (placementKind === 'standalone_floor') {
    const h = Number(item.height ?? parsed.height ?? 0);
    if (h > 0 && h <= 1200) {
      return CATALOG_ICON_ASPECT_LOW;
    }
  }
  const ids = [];
  const pushIds = (raw) => {
    if (raw == null) return;
    if (Array.isArray(raw)) {
      raw.forEach((c) => {
        if (typeof c === 'number' || (typeof c === 'string' && c.trim() !== '')) {
          ids.push(Number(c));
        } else if (c && c.id != null) ids.push(Number(c.id));
      });
      return;
    }
    if (typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '')) {
      ids.push(Number(raw));
    }
  };
  pushIds(item.category);
  pushIds(item.categories);
  pushIds(parsed.category);
  return resolveIconAspectFromCategories(catalogType, ids);
}

export function resolveCatalogItemIcon(item) {
  if (!item) return '';
  const parsed = parseCatalogItemDataField(item);
  const candidates = [
    parsed.icon,
    parsed.icon_url,
    item.icon,
    item.icon_url,
  ];
  for (const c of candidates) {
    const s = String(c ?? '').trim();
    if (s) return s;
  }
  return '';
}

/** Экспорт скрина: tall 300×600, low 300×200 (1/3 высоты). */
export function catalogScreenshotExportSize(aspect) {
  const a = normalizeCatalogIconAspect(aspect);
  if (a === CATALOG_ICON_ASPECT_LOW) return { w: 300, h: 200 };
  return { w: 300, h: 600 };
}

/** Единый масштаб в иконке (не зависит от открытых дверей / padding камеры). */
export const CATALOG_ICON_TALL_CONTENT_FILL = 1.07;
export const CATALOG_ICON_LOW_CONTENT_FILL = 1.1;

/** Обрезка белых полей каталожной иконки → PNG только с модулем (для drag-превью). */
export function cropCatalogIconImageToContentDataUrl(img) {
  if (!img || !img.naturalWidth || !img.naturalHeight) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const sw = Math.max(1, img.naturalWidth);
      const sh = Math.max(1, img.naturalHeight);
      const probe = document.createElement('canvas');
      probe.width = sw;
      probe.height = sh;
      const pctx = probe.getContext('2d');
      if (!pctx) {
        resolve(null);
        return;
      }
      pctx.drawImage(img, 0, 0);
      const data = pctx.getImageData(0, 0, sw, sh).data;
      let minX = sw;
      let minY = sh;
      let maxX = 0;
      let maxY = 0;
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const i = (y * sw + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 248 && g > 248 && b > 248) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      if (maxX <= minX || maxY <= minY) {
        resolve(null);
        return;
      }
      const cx0 = minX;
      let cy0 = minY;
      const cx1 = maxX + 1;
      const cy1 = maxY + 1;
      cy0 = trimProbeTopHairlines(data, sw, sh, cx0, cy0, cx1, cy1);
      const cw = Math.max(1, cx1 - cx0);
      const ch = Math.max(1, cy1 - cy0);
      const out = document.createElement('canvas');
      out.width = cw;
      out.height = ch;
      const ctx = out.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, cx0, cy0, cw, ch, 0, 0, cw, ch);
      resolve(out.toDataURL('image/png'));
    } catch (_) {
      resolve(null);
    }
  });
}

/** Убрать из bbox тонкие артефактные строки в верхних ~8% кадра (тень/линия над корпусом). */
function trimProbeTopHairlines(data, sw, sh, minX, minY, maxX, maxY) {
  const rowW = Math.max(1, maxX - minX);
  const topLimit = Math.min(maxY, Math.floor(sh * 0.08));
  let y = minY;
  while (y < topLimit) {
    let dark = 0;
    let span = 0;
    let xmin = sw;
    let xmax = 0;
    for (let x = minX; x < maxX; x++) {
      const i = (y * sw + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 248 && g > 248 && b > 248) continue;
      dark++;
      if (x < xmin) xmin = x;
      if (x > xmax) xmax = x;
    }
    span = xmax >= xmin ? xmax - xmin + 1 : 0;
    if (dark < rowW * 0.025 || span < rowW * 0.3) {
      y++;
      continue;
    }
    break;
  }
  return Math.min(maxY, Math.max(minY, y));
}

/** Лёгкий unsharp после downscale — локальный контраст на миниатюре ~300px. */
export function applyCatalogIconThumbnailClarity(ctx, w, h, amount = 0.22) {
  const strength = Number(amount);
  if (!ctx || !Number.isFinite(strength) || strength <= 0.001) return;
  const src = ctx.getImageData(0, 0, w, h);
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = w;
  blurCanvas.height = h;
  const bctx = blurCanvas.getContext('2d');
  if (!bctx) return;
  const blurPx = Math.max(0.8, Math.min(2.2, w / 150));
  bctx.filter = `blur(${blurPx}px)`;
  bctx.drawImage(ctx.canvas, 0, 0, w, h);
  bctx.filter = 'none';
  const blurred = bctx.getImageData(0, 0, w, h);
  const out = src.data;
  const bl = blurred.data;
  const amt = Math.min(0.55, strength);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i] > 252 && out[i + 1] > 252 && out[i + 2] > 252) continue;
    for (let c = 0; c < 3; c++) {
      const o = out[i + c];
      const b = bl[i + c];
      out[i + c] = Math.max(0, Math.min(255, Math.round(o + (o - b) * amt)));
    }
  }
  ctx.putImageData(src, 0, 0);
}

export function cropDataUrlToCatalogIconAspect(srcDataUrl, aspect, options = {}) {
  const target = catalogScreenshotExportSize(aspect);
  return new Promise((resolve, reject) => {
    if (!srcDataUrl || typeof srcDataUrl !== 'string') {
      reject(new Error('empty dataUrl'));
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = target.w;
        c.height = target.h;
        const ctx = c.getContext('2d');
        if (!ctx) {
          resolve(srcDataUrl);
          return;
        }
        const sw = Math.max(1, img.width);
        const sh = Math.max(1, img.height);
        const probe = document.createElement('canvas');
        probe.width = sw;
        probe.height = sh;
        const pctx = probe.getContext('2d');
        let cx0 = 0;
        let cy0 = 0;
        let cx1 = sw;
        let cy1 = sh;
        if (pctx) {
          pctx.drawImage(img, 0, 0);
          const data = pctx.getImageData(0, 0, sw, sh).data;
          let minX = sw;
          let minY = sh;
          let maxX = 0;
          let maxY = 0;
          for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
              const i = (y * sw + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              if (r > 248 && g > 248 && b > 248) continue;
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
          if (maxX > minX && maxY > minY) {
            cx0 = minX;
            cy0 = minY;
            cx1 = maxX + 1;
            cy1 = maxY + 1;
            cy0 = trimProbeTopHairlines(data, sw, sh, cx0, cy0, cx1, cy1);
          }
        }
        let cw = Math.max(1, cx1 - cx0);
        let ch = Math.max(1, cy1 - cy0);
        // Засвеченная дверь → #fff → probe её «не видит», остаётся узкая полоска.
        if (cw < sw * 0.14 || ch < sh * 0.14 || cw / ch < 0.07) {
          cx0 = 0;
          cy0 = 0;
          cx1 = sw;
          cy1 = sh;
          cw = sw;
          ch = sh;
        }
        const margin = 0.04;
        const aspectNorm = normalizeCatalogIconAspect(aspect);
        const fillOverride = Number(options?.contentFill);
        const contentFill =
          fillOverride > 0
            ? fillOverride
            : aspectNorm === CATALOG_ICON_ASPECT_LOW
              ? CATALOG_ICON_LOW_CONTENT_FILL
              : CATALOG_ICON_TALL_CONTENT_FILL;
        const maxH = target.h * (1 - margin * 2) * contentFill;
        const maxW = target.w * (1 - margin * 2) * contentFill;
        let destH = maxH;
        let destW = (cw / ch) * destH;
        if (destW > maxW) {
          destW = maxW;
          destH = (ch / cw) * destW;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, target.w, target.h);
        let destX = (target.w - destW) / 2;
        const bottomMargin = target.h * margin;
        const topMargin = target.h * margin;
        let destY;
        if (aspectNorm === CATALOG_ICON_ASPECT_LOW) {
          const maxDestH = target.h - topMargin - bottomMargin;
          if (destH > maxDestH) {
            destH = maxDestH;
            destW = (cw / ch) * destH;
            if (destW > maxW) {
              destW = maxW;
              destH = (ch / cw) * destW;
            }
            destX = (target.w - destW) / 2;
          }
          destY = target.h - destH - bottomMargin;
        } else {
          destY = (target.h - destH) / 2;
        }
        ctx.drawImage(img, cx0, cy0, cw, ch, destX, destY, destW, destH);
        const clarity = Number(options?.thumbnailClarity);
        if (clarity > 0.001) {
          applyCatalogIconThumbnailClarity(ctx, target.w, target.h, clarity);
        }
        const lift = Number(options?.shadowLift);
        if (lift > 0.001) {
          const imgData = ctx.getImageData(0, 0, target.w, target.h);
          const px = imgData.data;
          const amt = Math.min(0.35, lift);
          for (let i = 0; i < px.length; i += 4) {
            const r = px[i];
            const g = px[i + 1];
            const b = px[i + 2];
            if (r > 248 && g > 248 && b > 248) continue;
            const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
            const blend = (1 - lum) * amt;
            px[i] = Math.round(r + (255 - r) * blend);
            px[i + 1] = Math.round(g + (255 - g) * blend);
            px[i + 2] = Math.round(b + (255 - b) * blend);
          }
          ctx.putImageData(imgData, 0, 0);
        }
        resolve(c.toDataURL('image/png'));
      } catch (e) {
        resolve(srcDataUrl);
      }
    };
    img.onerror = () => resolve(srcDataUrl);
    img.src = srcDataUrl;
  });
}
