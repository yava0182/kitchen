/**
 * Единые правила «пирога» шкафа/тумбы: роли, формулы фасада, авто-исправление JSON.
 * Используется в комнате (ESM) и в админке (window.__cldCabinetPyramidLayout).
 */

export const FACADE_SIZE_Z_EXPR = 'v:facade_thickness_mm';
export const FACADE_POS_Z_EXPR = 's:z - v:facade_thickness_mm';
export const CORPUS_INNER_SIZE_Y_EXPR =
  's:y - v:h_bottom - v:h_top - v:tech_zone_mm';

export function normalizeLayoutRole(v) {
  return String(v ?? '').trim().toLowerCase();
}

export function isFacadeShellLayoutRole(role) {
  const r = normalizeLayoutRole(role);
  return r === 'facades' || r === 'facades_main' || r === 'facades_top';
}

export function collectPyramidRolesFromChildren(children) {
  const roles = new Set();
  if (!Array.isArray(children)) return roles;
  for (const c of children) {
    const r = normalizeLayoutRole(c?.layout_role ?? c?.sectionLayoutRole);
    if (r) roles.add(r);
  }
  return roles;
}

export function facadesMainSizeYExpr(pyramidRoles) {
  if (pyramidRoles && pyramidRoles.has('corpus_antresol')) {
    return 'v:corpus_antresol_mm';
  }
  return CORPUS_INNER_SIZE_Y_EXPR;
}

/** Выражение size.y у соседа с ролью corpus — фасад повторяет его по высоте. */
export function corpusSiblingSizeYExpr(siblings) {
  if (!Array.isArray(siblings)) return null;
  for (const c of siblings) {
    const r = normalizeLayoutRole(c?.layout_role ?? c?.sectionLayoutRole);
    if (r !== 'corpus') continue;
    const y = c?.size?.y;
    const s = String(y == null ? '' : y).trim();
    if (s) return s;
  }
  return null;
}

export function facadesMainSizeYForCabinet(siblings, pyramidRoles) {
  if (pyramidRoles?.has('corpus_antresol')) {
    return facadesMainSizeYExpr(pyramidRoles);
  }
  return corpusSiblingSizeYExpr(siblings) || facadesMainSizeYExpr(pyramidRoles);
}

export function sizeYLooksLikeCorpusAntresolOnly(v) {
  const s = String(v == null ? '' : v).trim().replace(/\s+/g, '');
  return s === 'v:corpus_antresol_mm' || /^v:corpus_antresol_mm$/i.test(s);
}

export function layoutRoleYPresetFields(roleKey, pyramidRoles) {
  const role = normalizeLayoutRole(roleKey);
  if (role === 'cabinet_root') return { sizeY: 's:y', posY: '0' };
  if (role === 'plinth') return { sizeY: 'v:h_bottom', posY: '0' };
  if (role === 'corpus') {
    return { sizeY: CORPUS_INNER_SIZE_Y_EXPR, posY: '0' };
  }
  if (role === 'facades') {
    return {
      sizeY: CORPUS_INNER_SIZE_Y_EXPR,
      sizeZ: FACADE_SIZE_Z_EXPR,
      posY: 'v:h_bottom',
      posZ: FACADE_POS_Z_EXPR,
    };
  }
  if (role === 'facades_main') {
    return {
      sizeY: facadesMainSizeYExpr(pyramidRoles),
      sizeZ: FACADE_SIZE_Z_EXPR,
      posY: 'v:h_bottom',
      posZ: FACADE_POS_Z_EXPR,
    };
  }
  if (role === 'facades_top') {
    return {
      sizeY: 's:y - v:h_bottom - v:corpus_antresol_mm - v:tech_zone_mm',
      sizeZ: FACADE_SIZE_Z_EXPR,
      posY: 'v:h_bottom + v:corpus_antresol_mm',
      posZ: FACADE_POS_Z_EXPR,
    };
  }
  if (role === 'corpus_antresol') return { sizeY: 'v:corpus_antresol_mm', posY: '0' };
  if (role === 'top') return { sizeY: 's:y - v:tech_zone_mm', posY: '0' };
  if (role === 'service') return { sizeY: 'v:tech_zone_mm', posY: 's:y - v:tech_zone_mm' };
  if (role === 'drawer') {
    return {
      sizeY: 162,
      sizeZ: 's:z - 50',
      posY: '(v:h_bottom) + 18',
      posZ: 50,
    };
  }
  return null;
}

function isExprDefaultFacadeYSize(v) {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  return !s || s === '0' || s === 's:y';
}

function isExprDefaultFacadeYPos(v) {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  return !s || s === '0';
}

function isExprDefaultFacadeZSize(v) {
  if (v === undefined || v === null) return true;
  const s = String(v).trim().replace(/\s+/g, '');
  return !s || s === '0' || s === 's:z' || s === '16';
}

function isExprDefaultFacadeZPos(v) {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  if (!s || s === '0') return true;
  const compact = s.replace(/\s+/g, '');
  if (compact === '16' || compact === 's:z-16') return true;
  return /^s:z\s*-\s*16/i.test(s);
}

function _nodeLooksLikeLooseFacadeModule(node) {
  if (!node || typeof node !== 'object' || node.type !== 'module') return false;
  if (isFacadeShellLayoutRole(node.layout_role ?? node.sectionLayoutRole)) {
    return false;
  }
  const et = String(node.spec?.element_type || '').toLowerCase();
  if (et !== 'catalog_28' && et !== 'facades') return false;
  const name = String(node.name || node.spec?.key || '').toLowerCase();
  return /фасад|facade/.test(name);
}

export function nodeLooksLikeLooseFacadeModule(node) {
  return _nodeLooksLikeLooseFacadeModule(node);
}

function collectChildFacadeShellRoles(children) {
  const roles = new Set();
  if (!Array.isArray(children)) return roles;
  for (const c of children) {
    const r = normalizeLayoutRole(c?.layout_role ?? c?.sectionLayoutRole);
    if (isFacadeShellLayoutRole(r)) roles.add(r);
  }
  return roles;
}

function inferFacadeShellRoleForSiblings(siblingFacadeRoles) {
  if (!siblingFacadeRoles.has('facades_main')) return 'facades_main';
  if (!siblingFacadeRoles.has('facades_top')) return 'facades_top';
  return 'facades';
}

function applyFacadeShellPresetToNode(node, roleKey, pyramidChildRoles) {
  node.layout_role = roleKey;
  node.size = node.size && typeof node.size === 'object' ? node.size : {};
  node.pos = node.pos && typeof node.pos === 'object' ? node.pos : {};

  const preset = layoutRoleYPresetFields(roleKey, pyramidChildRoles);
  if (!preset) return;

  if (isExprDefaultFacadeYSize(node.size.y) && preset.sizeY) {
    node.size.y = preset.sizeY;
  }
  if (isExprDefaultFacadeYPos(node.pos.y) && preset.posY != null) {
    node.pos.y = preset.posY;
  }
  if (preset.sizeZ && isExprDefaultFacadeZSize(node.size.z)) {
    node.size.z = preset.sizeZ;
  }
  if (preset.posZ && isExprDefaultFacadeZPos(node.pos.z)) {
    node.pos.z = preset.posZ;
  }
}

function nodeHasManualLayout(node) {
  if (!node || typeof node !== 'object') return false;
  return !!(
    node.manual_layout ||
    node.keep_manual_layout ||
    node.spec?.manual_layout ||
    node.spec?.keep_manual_layout ||
    node.spec?.layoutZonesLock
  );
}

/** Тумба: facades_main по высоте = сосед «corpus» (без цоколя/опор), не s:y и не 1950. */
function enforceFacadesMainBandOnNode(node, pyramidRoles, siblings) {
  if (normalizeLayoutRole(node.layout_role ?? node.sectionLayoutRole) !== 'facades_main') {
    return false;
  }
  if (pyramidRoles.has('corpus_antresol') || nodeHasManualLayout(node)) return false;

  const preset = layoutRoleYPresetFields('facades_main', pyramidRoles);
  if (!preset?.sizeY) return false;

  const wantY = facadesMainSizeYForCabinet(siblings, pyramidRoles);

  let changed = false;
  node.size = node.size && typeof node.size === 'object' ? node.size : {};
  node.pos = node.pos && typeof node.pos === 'object' ? node.pos : {};

  if (node.size.y !== wantY) {
    node.size.y = wantY;
    changed = true;
  }
  if (preset.posY != null && node.pos.y !== preset.posY) {
    node.pos.y = preset.posY;
    changed = true;
  }
  if (preset.sizeZ && node.size.z !== preset.sizeZ) {
    node.size.z = preset.sizeZ;
    changed = true;
  }
  if (preset.posZ != null && node.pos.z !== preset.posZ) {
    node.pos.z = preset.posZ;
    changed = true;
  }
  return changed;
}

function fixFacadesMainBandOnNode(node, pyramidRoles, siblings) {
  return enforceFacadesMainBandOnNode(node, pyramidRoles, siblings);
}

export function planTreeHasLayoutRole(nodes, roleKey) {
  const want = normalizeLayoutRole(roleKey);
  if (!want) return false;
  const stack = Array.isArray(nodes) ? [...nodes] : nodes != null ? [nodes] : [];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const r = normalizeLayoutRole(n.layout_role ?? n.sectionLayoutRole);
    if (r === want) return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return false;
}

/**
 * Нормализация clodisJSON перед сохранением / сборкой в комнате.
 * @returns {number} число исправлений
 */
export function normalizeClodisRoots(roots) {
  let patched = 0;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    const role = normalizeLayoutRole(node.layout_role ?? node.sectionLayoutRole);
    if (role === 'cabinet_root' && Array.isArray(node.children)) {
      const pyramidRoles = collectPyramidRolesFromChildren(node.children);
      const existingFacadeRoles = collectChildFacadeShellRoles(node.children);
      for (const c of node.children) {
        if (enforceFacadesMainBandOnNode(c, pyramidRoles, node.children)) patched += 1;
        const lrChild = normalizeLayoutRole(c?.layout_role ?? c?.sectionLayoutRole);
        if (lrChild === 'drawer') {
          const preset = layoutRoleYPresetFields('drawer', pyramidRoles);
          if (preset) {
            c.size = c.size && typeof c.size === 'object' ? c.size : {};
            c.pos = c.pos && typeof c.pos === 'object' ? c.pos : {};
            const sy = c.size.y;
            const syDef =
              sy === undefined || sy === null || sy === 's:y' || sy === '0' || sy === 0;
            if (syDef && preset.sizeY) {
              c.size.y = preset.sizeY;
              patched += 1;
            }
            if (preset.sizeZ && isExprDefaultFacadeZSize(c.size.z)) {
              c.size.z = preset.sizeZ;
              patched += 1;
            }
            if (preset.posY && isExprDefaultFacadeYPos(c.pos.y)) {
              c.pos.y = preset.posY;
              patched += 1;
            }
            if (preset.posZ && isExprDefaultFacadeZPos(c.pos.z)) {
              c.pos.z = preset.posZ;
              patched += 1;
            }
          }
        }
        if (!_nodeLooksLikeLooseFacadeModule(c)) continue;
        const shellRole = inferFacadeShellRoleForSiblings(existingFacadeRoles);
        applyFacadeShellPresetToNode(c, shellRole, pyramidRoles);
        existingFacadeRoles.add(shellRole);
        patched += 1;
      }
      for (const c of node.children) {
        const lr = normalizeLayoutRole(c?.layout_role ?? c?.sectionLayoutRole);
        if (!isFacadeShellLayoutRole(lr)) continue;
        const preset = layoutRoleYPresetFields(lr, pyramidRoles);
        if (!preset) continue;
        c.size = c.size && typeof c.size === 'object' ? c.size : {};
        c.pos = c.pos && typeof c.pos === 'object' ? c.pos : {};
        if (lr === 'facades_main' && enforceFacadesMainBandOnNode(c, pyramidRoles, node.children)) {
          patched += 1;
        }
        if (preset.sizeZ && isExprDefaultFacadeZSize(c.size.z)) {
          c.size.z = preset.sizeZ;
          patched += 1;
        }
        if (preset.posZ && isExprDefaultFacadeZPos(c.pos.z)) {
          c.pos.z = preset.posZ;
          patched += 1;
        }
      }
    }
    if (Array.isArray(node.children)) {
      for (const ch of node.children) walk(ch);
    }
  };
  if (Array.isArray(roots)) roots.forEach(walk);
  else walk(roots);
  return patched;
}

function _nodeLooksLikeDrawerModule(n) {
  if (!n || typeof n !== 'object') return false;
  const lr = normalizeLayoutRole(n.layout_role ?? n.sectionLayoutRole);
  if (lr === 'drawer') return true;
  const spec = n.spec && typeof n.spec === 'object' ? n.spec : n;
  const et = String(spec?.element_type || '').toLowerCase();
  return et === 'catalog_33' || et.includes('yashik');
}

export function planRootsHaveFacadeShell(nodes) {
  const stack = Array.isArray(nodes) ? [...nodes] : [nodes];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (isFacadeShellLayoutRole(n.layout_role ?? n.sectionLayoutRole)) return true;
    if (_nodeLooksLikeLooseFacadeModule(n)) return true;
    if (_nodeLooksLikeDrawerModule(n)) return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return false;
}

export function roleFormulaHint(roleKey, pyramidRoles) {
  const role = normalizeLayoutRole(roleKey);
  if (role === 'plinth') return 'v:h_bottom (pos: 0)';
  if (role === 'corpus' || role === 'facades') {
    return `${CORPUS_INNER_SIZE_Y_EXPR} — полоса корпуса`;
  }
  if (role === 'facades_main') {
    const sizeY = facadesMainSizeYExpr(pyramidRoles);
    const note = pyramidRoles?.has('corpus_antresol')
      ? 'антресоль (переменная corpus_antresol_mm, часто 1950 мм)'
      : 'как у соседа «Корпус» — высота без цоколя (опор); при смене корпуса фасад подстраивается';
    return `${sizeY} — ${note}; толщина ${FACADE_SIZE_Z_EXPR}; pos Y: v:h_bottom; pos Z: ${FACADE_POS_Z_EXPR}`;
  }
  if (role === 'facades_top') {
    return `верхняя полоса / антресоль; pos Z: ${FACADE_POS_Z_EXPR}`;
  }
  if (role === 'drawer') {
    return '162 мм по Y; pos Y: (v:h_bottom) + 18; size Z: s:z − 50; pos Z: 50 — внутри корпуса';
  }
  return '';
}

if (typeof window !== 'undefined') {
  window.__cldCabinetPyramidLayout = {
    normalizeClodisRoots,
    facadesMainSizeYExpr,
    facadesMainSizeYForCabinet,
    corpusSiblingSizeYExpr,
    layoutRoleYPresetFields,
    collectPyramidRolesFromChildren,
    planTreeHasLayoutRole,
    isFacadeShellLayoutRole,
    nodeLooksLikeLooseFacadeModule,
    planRootsHaveFacadeShell,
    sizeYLooksLikeCorpusAntresolOnly,
    roleFormulaHint,
    FACADE_SIZE_Z_EXPR,
    FACADE_POS_Z_EXPR,
    CORPUS_INNER_SIZE_Y_EXPR,
  };
}
