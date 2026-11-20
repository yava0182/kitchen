const fs = require('fs');
const path = 'js/sections/section-manager.js';
let s = fs.readFileSync(path, 'utf8');

const engImport = "} from '../kitchen/kitchen-base-engine.js?v=20261008-kitchen-engine1';";
const layoutImport =
  "} from '../kitchen/kitchen-base-engine.js?v=20261008-kitchen-engine1';\n" +
  "import {\n" +
  "  buildKitchenEqualCellLayout,\n" +
  "  assignKitchenZonesSimple,\n" +
  "} from '../kitchen/kitchen-section-layout.js?v=20261008-kitchen-engine2';";

if (!s.includes('kitchen-section-layout.js')) {
  if (!s.includes(engImport)) {
    console.error('engine import not found');
    process.exit(1);
  }
  s = s.replace(engImport, layoutImport);
}

const startMarker = 'function computeSectionLayout(sectionData) {';
const start = s.indexOf(startMarker);
if (start < 0) {
  console.error('computeSectionLayout not found');
  process.exit(1);
}
const endMarker =
  '  } finally {\n    sectionData._layoutComputing = false;\n  }\n}';
const end = s.indexOf(endMarker, start);
if (end < 0) {
  console.error('end not found');
  process.exit(1);
}
const endExclusive = end + endMarker.length;

const replacement = `function computeSectionLayout(sectionData) {
  // KITCHEN-ONLY: шкафной section/cell engine вычищен.
  // Ячейки = равные parts или customZoneWidthsMm; без 16mm caps / U-fit / parts-shrink / corner-wardrobe.
  const division = sectionData?.division;
  if (!division || !sectionData?.group || !state.scene) {
    return { partSize: 0, capCount: 0, sectionStart: 0, segments: [] };
  }
  if (sectionData._layoutComputing) {
    return (
      sectionData._layoutCache || {
        partSize: Number(division.partSize || 0),
        capCount: 0,
        sectionStart: Number(division.sectionStart ?? 0),
        segments: [],
      }
    );
  }
  sectionData._layoutComputing = true;
  try {
    const wallName = sectionData.wallName || division.wallName || 'back';
    const axis = wallName === 'left' || wallName === 'right' ? 'z' : 'x';
    const inner = computeSectionInnerBoundsU(sectionData);
    const sectionWidth = inner.innerWidthU;
    const sectionStart = inner.innerStartU;
    division.sectionStart = sectionStart;
    division.sectionEnd = sectionStart + sectionWidth;

    let parts = Math.max(0, Math.floor(Number(division.parts) || 0));
    if (parts === 0 || sectionWidth <= 0) {
      sectionData._layoutCache = {
        partSize: 0,
        capCount: 0,
        sectionStart,
        segments: [],
        moduleWidthsMm: [],
        innerWidthMm: sectionWidth,
      };
      return sectionData._layoutCache;
    }

    const furniture = [];
    state.scene.traverse((obj) => {
      if (!obj?.userData?.isFurniture || obj.userData.sectionId !== sectionData.id) return;
      if (obj.userData.isEndCabinet) return;
      if (_isGhostFurnitureOverlay(obj)) return;
      furniture.push(obj);
    });

    const minModuleW =
      Number.isFinite(Number(division.minModuleWidthMm)) && Number(division.minModuleWidthMm) > 0
        ? Number(division.minModuleWidthMm)
        : _DEFAULT_MIN_MODULE_WIDTH_MM;

    const assignedZoneByUuid = assignKitchenZonesSimple(furniture, parts, axis);
    for (const f of furniture) {
      const z = assignedZoneByUuid.get(f.uuid);
      if (typeof z === 'number') f.userData.zoneIndex = z;
    }

    const built = buildKitchenEqualCellLayout({
      sectionStart,
      sectionWidth,
      parts,
      customZoneWidthsMm: division.customZoneWidthsMm,
      minModuleW,
    });

    const segments = built.segments.map((seg) => ({ ...seg }));
    for (const f of furniture) {
      const z = assignedZoneByUuid.get(f.uuid);
      if (typeof z !== 'number') continue;
      const seg = segments.find(
        (s) => s.type === 'module' && s.zoneIndex === z && !s.furnitureUuid
      );
      if (seg) seg.furnitureUuid = f.uuid;
    }

    division.partSize = built.partSize;
    division.sectionStart = sectionStart;
    division.sectionEnd = sectionStart + sectionWidth;

    const result = {
      partSize: built.partSize,
      capCount: 0,
      sectionStart,
      segments,
      moduleWidthsMm: built.moduleWidthsMm,
      innerWidthMm: sectionWidth,
    };
    sectionData._layoutCache = result;

    state.scene.traverse((obj) => {
      if (!obj?.userData?.isFurniture || obj.userData.sectionId !== sectionData.id) return;
      if (obj.userData.isEndCabinet) return;
      if (_isGhostFurnitureOverlay(obj)) return;
      try {
        _shiftFurnitureToSectionInnerBounds(obj, sectionData);
      } catch (_) {}
      try {
        if (isKitchenBaseGroup(obj)) {
          alignSectionStandaloneFurnitureFront(obj, sectionData);
        }
      } catch (_) {}
    });

    if (typeof window !== 'undefined' && window.DEBUG_LAYOUT_RECALC === true) {
      console.log('[KITCHEN-LAYOUT]', {
        sectionId: sectionData.id,
        wallName,
        parts,
        sectionWidthMm: sectionWidth,
        moduleWidthsMm: built.moduleWidthsMm,
      });
    }
    return result;
  } finally {
    sectionData._layoutComputing = false;
  }
}`;

s = s.slice(0, start) + replacement + s.slice(endExclusive);
fs.writeFileSync(path, s);
console.log('OK replaced computeSectionLayout, bytes', s.length);
