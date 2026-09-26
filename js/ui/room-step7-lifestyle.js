/**
 * Шаг 7 комнаты: lifestyle.
 * Штанга: wardrobe-5 short/long. Полки: стопки / сумки / обувь (пул каталог + collection-clothing).
 * Шаги 4–6: на штанге обычные пустые плечики (#23).
 */

/** Вещи на полках на шаге 7. */
export const ROOM_SHELF_LIFESTYLE_ENABLED = true;

/**
 * Одежда-полоса на штанге (GLB 10–16 МБ × N шкафов) на многих Windows GPU
 * валит WebGL (context lost / Crashpad) вместе с Soft+Spot.
 * false = на шаге 7 оставляем пустые #23; полки lifestyle работают.
 * Включить обратно только с лёгкими ассетами / инстансингом.
 */
export const ROOM_STEP7_ROD_CLOTHING_ENABLED = true;

export function buildLifestyleStep(container) {
  if (!container) return;
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'step7-lifestyle-panel';
  const rodNote = ROOM_STEP7_ROD_CLOTHING_ENABLED
    ? 'одежда на штанге (короткие / длинные) и вещи на полках'
    : 'вещи на полках (стопки / сумки / обувь). Одежда на штанге временно отключена — стабильность GPU';
  wrap.innerHTML =
    '<p class="step7-lifestyle-hint" style="margin:0;color:#666;font-size:14px;line-height:1.45;">' +
    'Наполнение: ' +
    rodNote +
    ' (в т.ч. wardrobe-5).' +
    '</p>';
  container.appendChild(wrap);
}

function isLifestyleStepNum(step) {
  return Number(step) === 7;
}

function isShelfLifestyleEnabled() {
  return ROOM_SHELF_LIFESTYLE_ENABLED === true;
}

/**
 * Вещи на полках — только когда ROOM_SHELF_LIFESTYLE_ENABLED и шаг 7.
 * Плечики на штанге не трогаем здесь (их состав меняет resync rods).
 */
export function syncRoomLifestyleVisibility(scene) {
  const step =
    typeof window !== 'undefined' ? Number(window.currentRoomStep) || 0 : 0;
  const showShelf = isShelfLifestyleEnabled() && isLifestyleStepNum(step);
  const root =
    scene ||
    (typeof window !== 'undefined' ? window.__cldRoomScene : null) ||
    null;
  if (!root || typeof root.traverse !== 'function') return showShelf;
  root.traverse((o) => {
    if (!o) return;
    const ud = o.userData || {};
    const nm = String(o.name || '');
    const isShelf =
      ud.isShelfProp === true || /^shelf_prop_/i.test(nm);
    if (!isShelf) return;
    o.visible = showShelf;
  });
  return showShelf;
}

/** Пересобрать плечики: #23 на шагах 1–6, одежда из catalog companions на шаге 7. */
export function syncRoomRodCompanionsForStep(scene) {
  if (
    Number(typeof window !== 'undefined' ? window.currentRoomStep : 0) === 7 &&
    ROOM_STEP7_ROD_CLOTHING_ENABLED !== true
  ) {
    // Не трогаем штанги: пустые #23 уже стоят с шагов 4–6.
    return Promise.resolve(0);
  }
  const api =
    typeof window !== 'undefined' ? window.__cldRoomCabinetModels : null;
  if (api && typeof api.resyncAllRoomRodCompanions === 'function') {
    return Promise.resolve(api.resyncAllRoomRodCompanions(scene)).catch((err) => {
      console.warn('[STEP7] rod companions resync:', err);
      return 0;
    });
  }
  return Promise.resolve(0);
}

/**
 * Вещи на полках: только дозаполнить пустые хосты.
 * Не force-resync — иначе при каждом входе на шаг 7 раскладка прыгает.
 */
export function syncRoomShelfPropsForStep(scene) {
  const api = typeof window !== 'undefined' ? window.__cldShelfProps : null;
  if (api && typeof api.resyncAllRoomShelfProps === 'function') {
    try {
      if (window.state) window.state._cldPauseLifestyleGpu = true;
    } catch (_) {}
    return Promise.resolve(api.resyncAllRoomShelfProps(scene, { force: false }))
      .catch((err) => {
        console.warn('[STEP7] shelf props ensure:', err);
        return 0;
      })
      .finally(() => {
        try {
          if (window.state) window.state._cldPauseLifestyleGpu = false;
        } catch (_) {}
      });
  }
  return Promise.resolve(0);
}

export function syncRoomLifestyleForStep(stepNumber, scene) {
  const step = Number(stepNumber) || 0;
  const onLifestyle = isLifestyleStepNum(step);
  syncRoomLifestyleVisibility(scene);
  // Штанги → потом полки (не параллельно): меньше пик RAM на входе в шаг 7.
  return syncRoomRodCompanionsForStep(scene)
    .then(() => (onLifestyle ? syncRoomShelfPropsForStep(scene) : 0))
    .then(() => {
      syncRoomLifestyleVisibility(scene);
      return onLifestyle;
    });
}

export function installRoomLifestyleStepApi(globalObj) {
  const g = globalObj || (typeof window !== 'undefined' ? window : null);
  if (!g) return;
  g.__cldIsRoomLifestyleStep = () => isLifestyleStepNum(g.currentRoomStep);
  g.__cldRoomShelfLifestyleEnabled = () => isShelfLifestyleEnabled();
  g.__cldRoomStep7RodClothingEnabled = () => ROOM_STEP7_ROD_CLOTHING_ENABLED === true;
  g.__cldSyncRoomLifestyleVisibility = () =>
    syncRoomLifestyleVisibility(g.__cldRoomScene);
  g.__cldSyncRoomLifestyleForStep = (step) =>
    syncRoomLifestyleForStep(step != null ? step : g.currentRoomStep, g.__cldRoomScene);
  g.__cldSyncRoomRodCompanionsForStep = () =>
    syncRoomRodCompanionsForStep(g.__cldRoomScene);
  g.__cldSyncRoomShelfPropsForStep = () =>
    syncRoomShelfPropsForStep(g.__cldRoomScene);
}
