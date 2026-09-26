/**
 * Массовая замена PlanPlace → Clodis (кроме папок рефа).
 * Запуск: node tools/migrate-planplace-to-clodis.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'constructor_code_reference',
  'planplace_refs',
  'reference_b3d',
  '.git',
]);

const SKIP_DIR_PREFIXES = ['_safe_backup', 'catalog_items_backup'];

const SKIP_FILE_PATTERNS = [
  /migrate-planplace-to-clodis\.cjs$/,
  /main_core_v2_part\d+_deobfuscated\.js$/,
  /planplace_refs_planplace/,
  /planplace_catalog_item/,
  /REFERENCE_/,
  /reference_/,
];

/** Порядок важен: длинные совпадения первыми */
const REPLACEMENTS = [
  ['planPlaceVariables', 'clodisVariables'],
  ['planPlaceJSON', 'clodisJSON'],
  ['__planPlaceVariables', '__clodisVariables'],
  ['__planPlaceRootsForBuild', '__clodisRootsForBuild'],
  ['__planPlaceDataForBuild', '__clodisDataForBuild'],
  ['planplace_structure', 'clodis_structure'],
  ['normalizePlanPlaceRootArray', 'normalizeClodisRootArray'],
  ['normalizePlanPlaceRoots', 'normalizeClodisRoots'],
  ['getPlanPlaceDataForBuild', 'getClodisDataForBuild'],
  ['resolvePlanPlaceJSONForCatalogGridItem', 'resolveClodisJSONForCatalogGridItem'],
  ['buildMinimalCatalogPlanPlaceJSON', 'buildMinimalCatalogClodisJSON'],
  ['preparePlanPlaceForRoomBuild', 'prepareClodisForRoomBuild'],
  ['filterPlanPlaceTreeByDoorLayout', 'filterClodisTreeByDoorLayout'],
  ['remapFacadeCatalogModulesInPlanPlace', 'remapFacadeCatalogModulesInClodis'],
  ['applyZoneHandToPlanPlaceTree', 'applyZoneHandToClodisTree'],
  ['ensurePlanPlacePreviewMounted', 'ensureClodisPreviewMounted'],
  ['buildPlanPlaceTemplateTreeFromDom', 'buildClodisTemplateTreeFromDom'],
  ['buildPlanPlaceModuleParamsFromUI', 'buildClodisModuleParamsFromUI'],
  ['onPlanPlaceJSONReady', 'onClodisJSONReady'],
  ['planPlaceJSONReady', 'clodisJSONReady'],
  ['__finalizePlanPlaceForBuild', '__finalizeClodisForBuild'],
  ['__clonePlanRootsForSafeOverlay', '__cloneClodisRootsForSafeOverlay'],
  ['__applyJointSchemesOverlayToPlanRoots', '__applyJointSchemesOverlayToClodisRoots'],
  ['__walkPlanPlaceNodes', '__walkClodisNodes'],
  ['__applyFacadeBottomOffsetToPlanPlace', '__applyFacadeBottomOffsetToClodis'],
  ['__applyFacadeDefaultGaps15ToPlanPlace', '__applyFacadeDefaultGaps15ToClodis'],
  ['__computeEdgeLengthFromPlanPlace', '__computeEdgeLengthFromClodis'],
  ['__planPlaceHasPlinth', '__clodisHasPlinth'],
  ['_buildHolePositionRefPlanPlace', '_buildHolePositionRefClodis'],
  ['planPlaceHasConstructorMarkers', 'clodisHasConstructorMarkers'],
  ['isConstructorPlanPlaceJson', 'isConstructorClodisJson'],
  ['planPlaceLooksEmpty', 'clodisLooksEmpty'],
  ['planPlaceForBuild', 'clodisForBuild'],
  ['planPlaceData', 'clodisData'],
  ['planPlaceArr', 'clodisArr'],
  ['planPlaceRoots', 'clodisRoots'],
  ['initPlanPlaceLibs', 'initClodisLibs'],
  ['EmbeddedPlanPlaceBuilder', 'EmbeddedClodisBuilder'],
  ['PlanPlaceBuilder', 'ClodisBuilder'],
  ['LEGACY_PLANPLACE_VARS_KEY', 'EXPORT_VARS_KEY_V1'],
  ['LEGACY_PLANPLACE_JSON_KEY', 'EXPORT_JSON_KEY_V1'],
  ['furniture-planplace.js', 'furniture-clodis.js'],
  ['admin-planplace-preview-mount.js', 'admin-clodis-preview-mount.js'],
  ['planplaceExpressions', 'clodisExpressions'],
  ['planplaceLibs', 'clodisLibs'],
  ['PlanPlace', 'Clodis'],
  ['planPlace', 'clodis'],
];

const EXT = new Set([
  '.js', '.ts', '.tsx', '.html', '.json', '.md', '.cjs', '.mjs', '.css', '.txt', '.ps1', '.d.ts',
]);

function shouldSkipDir(name) {
  if (SKIP_DIR_NAMES.has(name)) return true;
  return SKIP_DIR_PREFIXES.some((p) => name.startsWith(p));
}

function shouldSkipFile(rel) {
  return SKIP_FILE_PATTERNS.some((re) => re.test(rel));
}

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (ent.isDirectory()) {
      if (shouldSkipDir(ent.name)) continue;
      walk(full, files);
    } else if (EXT.has(path.extname(ent.name).toLowerCase())) {
      if (!shouldSkipFile(rel)) files.push(full);
    }
  }
  return files;
}

function applyReplacements(text) {
  const guards = [];
  let out = text;
  const protect = (re, token) => {
    out = out.replace(re, (m) => {
      const id = `__GUARD_${guards.length}__`;
      guards.push({ id, value: m });
      return id;
    });
  };
  protect(/\/planplace_refs\//g, 'path');
  protect(/planplace_refs/g, 'path2');
  protect(/https?:\/\/[^\s"']*planplace[^\s"']*/gi, 'url');
  protect(/planplace\.ru/gi, 'domain');

  for (const [from, to] of REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  out = out.replace(/\bplanplace\b/gi, (m) => (m === 'planplace' ? 'clodis' : 'Clodis'));

  for (const { id, value } of guards) {
    out = out.split(id).join(value);
  }
  return out;
}

function migrateFile(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.includes(0)) return false;
  const text = buf.toString('utf8');
  const next = applyReplacements(text);
  if (next === text) return false;
  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

const renames = [
  ['js/furniture/furniture-planplace.js', null],
  ['js/admin/admin-planplace-preview-mount.js', 'js/admin/admin-clodis-preview-mount.js'],
  ['src/lib/planplaceLibs.ts', null],
  ['src/lib/planplaceExpressions.ts', null],
  ['src/lib/EmbeddedPlanPlaceBuilder.ts', null],
  ['search-planplace.js', null],
  ['scripts/load-modules-from-planplace.js', 'scripts/load-modules-from-legacy-export.js'],
  ['scripts/check-planplace-items.js', 'scripts/check-clodis-catalog-items.js'],
  ['scripts/check-planplace-access.js', 'scripts/check-legacy-export-access.js'],
  ['scripts/extract-from-planplace-api.js', 'scripts/extract-from-legacy-export-api.js'],
  ['scripts/export-cabinets-from-planplace.js', 'scripts/export-cabinets-from-legacy-export.js'],
  ['scripts/export-all-catalog-from-planplace.js', 'scripts/export-all-catalog-from-legacy-export.js'],
  ['scripts/export-from-planplace-console.js', 'scripts/export-from-legacy-export-console.js'],
  ['tools/import-reference-planplace-json.mjs', 'tools/import-reference-clodis-json.mjs'],
  ['planplace-items.json', 'clodis-catalog-items-export.json'],
];

let changed = 0;
for (const f of walk(ROOT)) {
  if (migrateFile(f)) {
    changed += 1;
    console.log('updated', path.relative(ROOT, f));
  }
}

for (const [from, to] of renames) {
  const src = path.join(ROOT, from);
  if (!fs.existsSync(src)) continue;
  if (to === null) {
    fs.unlinkSync(src);
    console.log('deleted', from);
  } else {
    const dst = path.join(ROOT, to);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    if (fs.existsSync(dst)) fs.unlinkSync(dst);
    fs.renameSync(src, dst);
    console.log('renamed', from, '->', to);
  }
}

console.log('\nDone. Files changed:', changed);
