/**
 * Панели с материалом из шаблона каталога (ХДФ / g1 / material_3).
 * Не перекрашиваются декором шага 5 «внутри»; в Bazis — material_id из JSON детали.
 */

function isTemplateLockedMaterialFromItem(item) {
  if (!item) return false;
  const sm = item.spec?.material;
  const matKey = String(item.material_key || item.materialKey || sm?.key || '').toLowerCase();
  const matGroup = String(item.material_group || item.materialGroup || sm?.group || '').toLowerCase();
  if (matKey === 'material_3' || matKey === 'hdf') return true;
  if (matGroup === 'g1' || matGroup === 'hdf' || matGroup === 'hdf1') return true;
  return false;
}

function isTemplateLockedMaterialFromUserData(ud) {
  if (!ud) return false;
  if (ud.cldUseTemplateMaterial === true) return true;
  const matKey = String(ud.catalogMaterialKey || ud.material_key || ud.materialKey || '').toLowerCase();
  const matGroup = String(ud.material_group || ud.materialGroup || '').toLowerCase();
  if (matKey === 'material_3' || matKey === 'hdf') return true;
  if (matGroup === 'g1' || matGroup === 'hdf' || matGroup === 'hdf1') return true;
  return false;
}

if (typeof window !== 'undefined') {
  window.__cldIsTemplateMaterialPanel = isTemplateLockedMaterialFromItem;
  window.__cldIsTemplateMaterialUserData = isTemplateLockedMaterialFromUserData;
}
