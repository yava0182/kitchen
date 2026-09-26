/**
 * Только классификация «полка 16 мм» (fill_module), не «разворачивать ли в дереве админки».
 * Вставка catalog_29 в дерево — как PlanPlace: плоский module + live_catalog / template_tree
 * (см. __cldShouldInsertAsFlatCatalogModule). Планки/ящик/заглушка — тоже плоский лист;
 * полка — отдельный путь size.y=16 + role shelf.
 */
export function isFlatCatalogShelfModule(n) {
  if (!n || typeof n !== 'object') return false;
  const type = String(n.type || '').toLowerCase();
  if (type !== 'module' && type !== 'model') return false;
  const et = String(n.spec?.element_type || '').trim().toLowerCase();
  if (et !== 'catalog_29' && et !== '29') return false;

  const name = String(n.name || n.spec?.key || '').trim().toLowerCase();
  const id = String(n.spec?.id ?? '').trim();
  const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();

  if (/планк|крепеж|крепёж|ящик|drawer|направ|guide|rail|mount|strip|slider|slide|выдвиж/i.test(name)) {
    return false;
  }
  if (role === 'drawer' || role === 'rod' || role === 'facade' || role === 'hinge') return false;

  if (role === 'shelf' || role === 'zone_divider') return true;
  if (id === '6') return true;
  if (/полк|shelf/i.test(name) && !/ящик|планк/i.test(name)) return true;

  return false;
}

export function isFlatCatalogShelfSpec(spec, cfg) {
  return isFlatCatalogShelfModule({
    type: 'module',
    spec,
    name: cfg?.name,
    layout_role: cfg?.layout_role ?? cfg?.sectionLayoutRole,
    sectionLayoutRole: cfg?.sectionLayoutRole,
  });
}

if (typeof globalThis !== 'undefined') {
  globalThis.__cldIsFlatCatalogShelfModule = isFlatCatalogShelfModule;
  globalThis.__cldIsFlatCatalogShelfSpec = isFlatCatalogShelfSpec;
}
