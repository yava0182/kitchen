/**
 * interiorLayout — зоны по высоте (%), тип содержимого на карточке наполнения.
 */
(function () {
  'use strict';

  const CONTENT_OPTIONS = Object.freeze([
    { id: 'shelves', label: 'Полки' },
    { id: 'drawers', label: 'Ящики' },
    { id: 'rod', label: 'Штанга' },
  ]);
  const CONTENT_OPTIONS_SPLIT_TOP = Object.freeze([
    { id: 'shelves', label: 'Полки' },
    { id: 'rod', label: 'Штанга' },
  ]);
  const CONTENT_OPTIONS_SPLIT_BOTTOM = Object.freeze([
    { id: 'shelves', label: 'Полки' },
    { id: 'drawers', label: 'Ящики' },
    { id: 'rod', label: 'Штанга' },
  ]);
  const CONTENT_OPTIONS_100 = Object.freeze([
    { id: 'shelves', label: 'Полки' },
    { id: 'rod', label: 'Штанга' },
  ]);

  const DEFAULT_ROD_RULES = Object.freeze({
    anchor: 'top',
    offsetMm: 80,
    companionMode: 'none', // none | top_shelf | bottom_shelves | top_and_bottom
    topShelfGapMm: 80,
    bottomShelvesCount: 1,
    bottomShelvesTopGapMm: 80,
    gridShiftDownSteps: 0,
  });
  const DEFAULT_DRAWER_RULES = Object.freeze({
    anchor: 'bottom',
    offsetMm: 19,
    count: 0,
    gapMm: 3,
    topShelfGapMm: 26,
    forceShelfAboveDrawers: true,
  });

  function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function newZoneId() {
    return 'zone_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function normalizeDrawerRules(raw) {
    const rr = raw && typeof raw === 'object' ? raw : {};
    const anchorRaw = String(rr.anchor || DEFAULT_DRAWER_RULES.anchor).trim().toLowerCase();
    let anchor = 'bottom';
    if (anchorRaw === 'top' || anchorRaw === 'center') anchor = anchorRaw;
    else if (
      anchorRaw === 'below_center' ||
      anchorRaw === 'below_divider' ||
      anchorRaw === 'from_divider'
    ) {
      anchor = 'below_divider';
    }
    const count = Math.max(0, Math.floor(num(rr.count, 0)));
    const gapRaw = rr.gapMm;
    const gapMm =
      gapRaw == null || gapRaw === '' || !Number.isFinite(Number(gapRaw))
        ? DEFAULT_DRAWER_RULES.gapMm
        : Math.max(0, num(gapRaw, 0));
    return {
      anchor,
      offsetMm: Math.max(0, num(rr.offsetMm, DEFAULT_DRAWER_RULES.offsetMm)),
      count,
      gapMm,
      topShelfGapMm: Math.max(0, num(rr.topShelfGapMm, DEFAULT_DRAWER_RULES.topShelfGapMm)),
      forceShelfAboveDrawers: rr.forceShelfAboveDrawers !== false,
    };
  }

  function normalizeZone(raw, idx) {
    const z = raw && typeof raw === 'object' ? { ...raw } : {};
    z.id = String(z.id || newZoneId()).trim() || newZoneId();
    z.name = String(z.name || 'Секция ' + (idx + 1)).trim();
    z.heightPercent = Math.max(1, Math.min(100, Math.round(num(z.heightPercent, 100))));
    const cRaw = String(z.content || 'shelves').trim().toLowerCase();
    let content = 'shelves';
    if (cRaw === 'rod') content = 'rod';
    else if (cRaw === 'drawers' || cRaw === 'empty') content = 'drawers';
    else if (CONTENT_OPTIONS.some((o) => o.id === cRaw)) content = cRaw;
    z.content = content;
    const rr = z.rodRules && typeof z.rodRules === 'object' ? z.rodRules : {};
    const companionRaw = String(rr.companionMode || DEFAULT_ROD_RULES.companionMode).trim().toLowerCase();
    const companionMode =
      companionRaw === 'top_shelf' ||
      companionRaw === 'bottom_shelves' ||
      companionRaw === 'top_and_bottom'
        ? companionRaw
        : 'none';
    z.rodRules = {
      anchor: rr.anchor === 'bottom' ? 'bottom' : 'top',
      offsetMm: Math.max(0, num(rr.offsetMm, DEFAULT_ROD_RULES.offsetMm)),
      companionMode,
      topShelfGapMm: Math.max(0, num(rr.topShelfGapMm, DEFAULT_ROD_RULES.topShelfGapMm)),
      bottomShelvesCount: Math.max(0, Math.min(6, Math.floor(num(rr.bottomShelvesCount, DEFAULT_ROD_RULES.bottomShelvesCount)))),
      bottomShelvesTopGapMm: Math.max(
        0,
        num(rr.bottomShelvesTopGapMm, DEFAULT_ROD_RULES.bottomShelvesTopGapMm)
      ),
      gridShiftDownSteps: Math.max(
        0,
        Math.min(12, Math.floor(num(rr.gridShiftDownSteps, DEFAULT_ROD_RULES.gridShiftDownSteps)))
      ),
    };
    z.drawerRules = normalizeDrawerRules(z.drawerRules);
    const posRaw = String(z.position || '').trim().toLowerCase();
    z.position = posRaw === 'top' || posRaw === 'bottom' ? posRaw : '';
    return z;
  }

  function normalizeInteriorLayout(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let zones = Array.isArray(src.zones) ? src.zones.map(normalizeZone) : [];
    if (!zones.length) {
      zones = [normalizeZone({ heightPercent: 100, content: 'shelves', name: 'Вся высота' }, 0)];
    }
    return { zones };
  }

  function resolveInteriorSplitMode(layout) {
    const zones = Array.isArray(layout?.zones) ? layout.zones : [];
    return zones.length === 2 ? 'split_50_50' : 'full_100';
  }

  function normalizeZoneContentForMode(content, splitMode, fallback = 'shelves') {
    const c = String(content || '').trim().toLowerCase();
    if (splitMode === 'full_100') {
      return c === 'rod' ? 'rod' : 'shelves';
    }
    if (c === 'drawers' || c === 'rod' || c === 'shelves') return c;
    return fallback;
  }

  // src может быть строкой content или объектом зоны (тогда сохраняем rodRules/drawerRules).
  function zoneFromSource(src, contentMode, name, position, heightPercent) {
    const isObj = src && typeof src === 'object';
    const content = normalizeZoneContentForMode(isObj ? src.content : src, contentMode);
    const zone = { name, position, heightPercent, content };
    if (isObj && src.rodRules && typeof src.rodRules === 'object') zone.rodRules = src.rodRules;
    if (isObj && src.drawerRules && typeof src.drawerRules === 'object') zone.drawerRules = src.drawerRules;
    return zone;
  }

  function buildInteriorLayoutByMode(splitMode, lowerContent = 'shelves', upperContent = 'shelves') {
    if (splitMode === 'split_50_50') {
      return normalizeInteriorLayout({
        zones: [
          zoneFromSource(upperContent, splitMode, 'Верх', 'top', 50),
          zoneFromSource(lowerContent, splitMode, 'Низ', 'bottom', 50),
        ],
      });
    }
    return normalizeInteriorLayout({
      zones: [zoneFromSource(lowerContent, 'full_100', 'Вся высота', 'full', 100)],
    });
  }

  function forceInteriorLayoutByMode(layout, splitMode) {
    const mode = splitMode || resolveInteriorSplitMode(layout);
    const zones = Array.isArray(layout?.zones) ? layout.zones : [];
    if (mode === 'split_50_50') {
      if (zones.length === 2) {
        // Admin UI: строка 0 = верх, строка 1 = низ (interiorContentOptionsForZone).
        return buildInteriorLayoutByMode(mode, zones[1] || zones[0], zones[0] || zones[1]);
      }
      const zLower =
        zones.find((z) => String(z?.position || '').toLowerCase() === 'bottom') ||
        zones.find((z) => /низ|lower|bottom/i.test(String(z?.name || ''))) ||
        zones[0] ||
        null;
      const zUpper =
        zones.find((z) => String(z?.position || '').toLowerCase() === 'top') ||
        zones.find((z) => /верх|upper|top/i.test(String(z?.name || ''))) ||
        zones[1] ||
        null;
      return buildInteriorLayoutByMode(mode, zLower || zones[0] || 'shelves', zUpper || zones[1] || 'shelves');
    }
    return buildInteriorLayoutByMode('full_100', zones[0] || 'shelves', 'shelves');
  }

  function defaultInteriorLayout() {
    return normalizeInteriorLayout(null);
  }

  function sumZonePercents(layout) {
    const zones = layout?.zones || [];
    return zones.reduce((s, z) => s + num(z?.heightPercent, 0), 0);
  }

  function readInteriorLayoutFromApiData(apiData) {
    if (!apiData || apiData.interiorLayout == null) return null;
    return normalizeInteriorLayout(apiData.interiorLayout);
  }

  function applyInteriorLayoutToVueItem(vueItem, apiData) {
    if (!vueItem || typeof vueItem !== 'object') return;
    const stored = readInteriorLayoutFromApiData(apiData);
    if (stored) {
      vueItem.interiorLayout = forceInteriorLayoutByMode(stored, resolveInteriorSplitMode(stored));
      markInteriorSplitModeDirty(window.catalogItemVueApp);
      return;
    }
    if (
      typeof window.__cldCatalogInteriorFill?.isFillCatalogItem === 'function' &&
      window.__cldCatalogInteriorFill.isFillCatalogItem(vueItem)
    ) {
      vueItem.interiorLayout = forceInteriorLayoutByMode(defaultInteriorLayout(), 'full_100');
    } else if (!vueItem.interiorLayout) {
      vueItem.interiorLayout = forceInteriorLayoutByMode(defaultInteriorLayout(), 'full_100');
    }
  }

  function shouldPersistInteriorLayout(vueItem) {
    if (
      typeof window.__cldCatalogInteriorFill?.isFillCatalogItem === 'function' &&
      window.__cldCatalogInteriorFill.isFillCatalogItem(vueItem)
    ) {
      return true;
    }
    const zones = vueItem?.interiorLayout?.zones;
    return Array.isArray(zones) && zones.length > 0;
  }

  function mergeInteriorLayoutIntoDataPayload(dataToSave, vueItem) {
    if (!dataToSave || !vueItem) return dataToSave;
    if (!shouldPersistInteriorLayout(vueItem)) return dataToSave;
    const normalized = normalizeInteriorLayout(vueItem.interiorLayout);
    dataToSave.interiorLayout = forceInteriorLayoutByMode(normalized, resolveInteriorSplitMode(normalized));
    return dataToSave;
  }

  function shouldShowInteriorLayoutEditor(vueItem) {
    if (
      typeof window.__cldCatalogInteriorFill?.isFillCatalogItem === 'function' &&
      window.__cldCatalogInteriorFill.isFillCatalogItem(vueItem)
    ) {
      return true;
    }
    const zones = vueItem?.interiorLayout?.zones;
    return Array.isArray(zones) && zones.length > 1;
  }

  function readVueInteriorSplitMode(vm) {
    const layout = vm && vm.item ? vm.item.interiorLayout : null;
    return resolveInteriorSplitMode(layout);
  }

  /** Vue 2: computed interiorSplitMode может остаться full_100 после $set(interiorLayout). */
  function markInteriorSplitModeDirty(vm) {
    const watcher = vm && vm._computedWatchers ? vm._computedWatchers.interiorSplitMode : null;
    if (watcher) watcher.dirty = true;
  }

  function getVueInteriorLayoutOptions() {
    return {
      computed: {
        showInteriorLayoutEditor() {
          return shouldShowInteriorLayoutEditor(this.item);
        },
        interiorLayoutPercentSum() {
          return sumZonePercents(this.item?.interiorLayout);
        },
        interiorLayoutPercentOk() {
          return Math.abs(this.interiorLayoutPercentSum - 100) < 0.5;
        },
        interiorLayoutContentOptions() {
          return readVueInteriorSplitMode(this) === 'full_100' ? CONTENT_OPTIONS_100 : CONTENT_OPTIONS;
        },
        interiorSplitMode() {
          const layout = this.item ? this.item.interiorLayout : null;
          const zones = layout && Array.isArray(layout.zones) ? layout.zones : [];
          const zoneCount = zones.length;
          return zoneCount === 2 ? 'split_50_50' : 'full_100';
        },
      },
      methods: {
        setInteriorSplitMode(mode) {
          const current = this.item?.interiorLayout || defaultInteriorLayout();
          const next = forceInteriorLayoutByMode(current, mode === 'split_50_50' ? 'split_50_50' : 'full_100');
          this.$set(this.item, 'interiorLayout', next);
          markInteriorSplitModeDirty(this);
          this.normalizeInteriorLayoutZones();
        },
        interiorContentOptionsForZone(idx) {
          const splitMode = readVueInteriorSplitMode(this);
          if (splitMode === 'full_100') return CONTENT_OPTIONS_100;
          const zones = Array.isArray(this.item?.interiorLayout?.zones) ? this.item.interiorLayout.zones : [];
          const zoneIdx = Number(idx);
          if (zones.length === 2) {
            // В UI 50/50 верх всегда первая строка, низ всегда вторая.
            return zoneIdx === 0 ? CONTENT_OPTIONS_SPLIT_TOP : CONTENT_OPTIONS_SPLIT_BOTTOM;
          }
          const pos = String(zones[zoneIdx]?.position || '').toLowerCase();
          const name = String(zones[zoneIdx]?.name || '').toLowerCase();
          if (/низ|bottom|lower/.test(name)) return CONTENT_OPTIONS_SPLIT_BOTTOM;
          if (/верх|top|upper/.test(name)) return CONTENT_OPTIONS_SPLIT_TOP;
          if (pos === 'top') return CONTENT_OPTIONS_SPLIT_TOP;
          if (pos === 'bottom') return CONTENT_OPTIONS_SPLIT_BOTTOM;
          return zoneIdx === 0 ? CONTENT_OPTIONS_SPLIT_TOP : CONTENT_OPTIONS_SPLIT_BOTTOM;
        },
        onInteriorZoneContentChanged(idx) {
          const zones = Array.isArray(this.item?.interiorLayout?.zones) ? this.item.interiorLayout.zones : [];
          const z = zones[idx];
          if (!z) return;
          z.content = normalizeZoneContentForMode(z.content, readVueInteriorSplitMode(this));
          this.normalizeInteriorLayoutZones();
        },
        onDrawerZoneSettingsChanged() {
          if (!this.item?.interiorLayout) return;
          const normalized = normalizeInteriorLayout(this.item.interiorLayout);
          if (normalized.zones.length === 2) {
            normalized.zones[0].position = 'top';
            normalized.zones[1].position = 'bottom';
          }
          this.$set(this.item, 'interiorLayout', normalized);
          markInteriorSplitModeDirty(this);
          this.scheduleInteriorLayoutPreview();
        },
        scheduleInteriorLayoutPreview() {
          if (this.__cldInteriorPreviewTimer) clearTimeout(this.__cldInteriorPreviewTimer);
          this.__cldInteriorPreviewTimer = setTimeout(() => {
            this.__cldInteriorPreviewTimer = null;
            if (typeof window.__cldOnInteriorLayoutChangedForShelves === 'function') {
              window.__cldOnInteriorLayoutChangedForShelves();
            } else if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe(true);
            }
          }, 120);
        },
        normalizeInteriorLayoutZones() {
          if (!this.item?.interiorLayout) return;
          const normalized = forceInteriorLayoutByMode(
            normalizeInteriorLayout(this.item.interiorLayout),
            resolveInteriorSplitMode(this.item.interiorLayout)
          );
          if (normalized.zones.length === 2) {
            normalized.zones[0].position = 'top';
            normalized.zones[1].position = 'bottom';
          }
          this.$set(this.item, 'interiorLayout', normalized);
          markInteriorSplitModeDirty(this);
          const zones = Array.isArray(normalized?.zones) ? normalized.zones : [];
          zones.forEach((z, idx) => {
            if (String(z?.content || '').toLowerCase() !== 'rod') return;
            const splitMode = resolveInteriorSplitMode(normalized);
            if (splitMode === 'split_50_50') {
              const cm = String(z?.rodRules?.companionMode || '').trim().toLowerCase();
              if (cm === 'bottom_shelves' || cm === 'top_and_bottom') {
                z.rodRules.companionMode = 'top_shelf';
              }
            }
            const maxSteps = typeof this.rodGridShiftMaxSteps === 'function' ? this.rodGridShiftMaxSteps(idx) : 0;
            const cur = Math.max(0, Math.floor(num(z?.rodRules?.gridShiftDownSteps, 0)));
            if (cur > maxSteps) {
              z.rodRules.gridShiftDownSteps = maxSteps;
            }
          });
          this.scheduleInteriorLayoutPreview();
        },
        rodGridShiftAutoSteps(zoneIdx) {
          return typeof this.rodGridShiftMaxSteps === 'function' ? this.rodGridShiftMaxSteps(zoneIdx) : 0;
        },
        addInteriorLayoutZone() {
          if (!this.item.interiorLayout || !Array.isArray(this.item.interiorLayout.zones)) {
            this.$set(this.item, 'interiorLayout', defaultInteriorLayout());
          }
          const zones = [...this.item.interiorLayout.zones];
          zones.push(
            normalizeZone(
              { name: 'Секция ' + (zones.length + 1), heightPercent: 50, content: 'drawers' },
              zones.length
            )
          );
          this.$set(this.item.interiorLayout, 'zones', zones);
          this.normalizeInteriorLayoutZones();
        },
        removeInteriorLayoutZone(idx) {
          const zones = Array.isArray(this.item?.interiorLayout?.zones)
            ? [...this.item.interiorLayout.zones]
            : [];
          if (zones.length <= 1 || idx < 0 || idx >= zones.length) return;
          zones.splice(idx, 1);
          this.$set(this.item.interiorLayout, 'zones', zones);
          this.normalizeInteriorLayoutZones();
        },
        rodGridShiftMaxSteps(zoneIdx) {
          const splitMode = readVueInteriorSplitMode(this);
          if (splitMode !== 'split_50_50') return 0;
          const zones = Array.isArray(this.item?.interiorLayout?.zones)
            ? this.item.interiorLayout.zones
            : [];
          const z = zones[Number(zoneIdx)];
          if (!z || String(z.content || '').toLowerCase() !== 'rod') return 0;
          const fn =
            typeof window.__cldComputeRodZoneExpansionAutoSteps === 'function'
              ? window.__cldComputeRodZoneExpansionAutoSteps
              : typeof window.__cldComputeRodContentShiftAutoSteps === 'function'
                ? window.__cldComputeRodContentShiftAutoSteps
                : typeof window.__cldComputeRodGridShiftDownMaxSteps === 'function'
                  ? window.__cldComputeRodGridShiftDownMaxSteps
                  : null;
          if (!fn) return 0;
          const rawH =
            num(this.item?.size?.y, 0) ||
            num(this.item?.constructor_structure?.size?.y, 0) ||
            num(this.item?.data?.constructor_structure?.size?.y, 0);
          const interiorH = rawH > 0 ? rawH : 1950;
          const auto = fn({
            interiorHeightMm: interiorH,
            layout: this.item.interiorLayout,
            hBottom: 0,
            shelfPolicy: this.item?.shelfStack || null,
            shelfThicknessMm: Math.max(8, num(this.item?.shelfStack?.shelfThicknessMm, 16)),
            drawerHeightMm: 162,
            drawerPolicy: this.item?.drawerStack || null,
          });
          return Math.max(0, Math.floor(num(auto, 0)));
        },
        interiorSplitMaxStepsHint(zoneIdx) {
          const auto = typeof this.rodGridShiftAutoSteps === 'function' ? this.rodGridShiftAutoSteps(zoneIdx) : 0;
          if (auto > 0) {
            return '— зона опустится до полки над ящиками; у крыши доп. полка по сетке';
          }
          return '';
        },
        applyInteriorLayoutPreset(presetId) {
          let next = null;
          if (presetId === 'full_shelves') {
            next = buildInteriorLayoutByMode('full_100', 'shelves');
          } else if (presetId === 'full_rod') {
            next = buildInteriorLayoutByMode('full_100', 'rod');
          } else if (presetId === 'split_shelves_both') {
            next = buildInteriorLayoutByMode('split_50_50', 'shelves', 'shelves');
          } else if (presetId === 'split_rod_bottom_shelves_top') {
            next = buildInteriorLayoutByMode('split_50_50', 'rod', 'shelves');
          } else if (presetId === 'split_shelves_bottom_rod_top') {
            next = buildInteriorLayoutByMode('split_50_50', 'shelves', 'rod');
          } else if (presetId === 'split_drawers_bottom_shelves_top') {
            next = buildInteriorLayoutByMode('split_50_50', 'drawers', 'shelves');
          } else {
            return;
          }
          this.$set(this.item, 'interiorLayout', next);
          markInteriorSplitModeDirty(this);
          if (typeof window.__cldOnInteriorLayoutChangedForShelves === 'function') {
            window.__cldOnInteriorLayoutChangedForShelves();
          } else if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe(true);
          }
        },
      },
    };
  }

  window.__cldCatalogInteriorLayout = {
    CONTENT_OPTIONS,
    defaultInteriorLayout,
    normalizeInteriorLayout,
    resolveInteriorSplitMode,
    buildInteriorLayoutByMode,
    sumZonePercents,
    shouldShowInteriorLayoutEditor,
    shouldPersistInteriorLayout,
    applyInteriorLayoutToVueItem,
    mergeInteriorLayoutIntoDataPayload,
    getVueInteriorLayoutOptions,
  };
})();
