/**
 * IKEA empty-room v0 ? manifest: ????, SoT, audit.
 * ????? dump ? betrakta-sot.js + docs/IKEA-*.json|md.
 */

export const IKEA_V0_MANIFEST_SCHEMA = 'ikea-v0-manifest';
export const IKEA_V0_CACHE_BUST = '20260907-nospeed1';

export const CLD_IKEA_LIGHT_FROZEN = true;

/**
 * Dump order (?? ??????): C Spot ? A soft plane ? B soft AO on IBL ? spec ? exposure ? shadow.
 * @type {0|1|2|3|4|5|6|7}
 */
export const IKEA_V0_ACTIVE_PHASE = 7;

/** ????????? runbook ? ?????? ? dump, ?? spot-wash. */
export const IKEA_V0_RUNBOOK = Object.freeze([
  { id: 0, key: 'canvas', dump: 'scene.background=null, surround #F2F2F0', gate: 'clear RRT' },
  { id: 1, key: 'ibl', dump: 'SH?albedo?env 0.6, spot off', gate: 'spotEnabled=0' },
  { id: 2, key: 'spot', dump: 'UBO colorLineAndRange, 1/ld?, cone', gate: 'C ? disk = Spot+IBL' },
  { id: 3, key: 'softPlane', dump: '1-exp(-dh?int), empty nz=0', gate: 'A after C' },
  { id: 4, key: 'softAo', dump: 'ao on IBL only, not Spot', gate: 'B after A' },
  { id: 5, key: 'iblSpec', dump: 'env cube + horizon', gate: 'metal lit' },
  { id: 6, key: 'exposure', dump: 'exposure?2, screenCal=1', gate: 'betraktaOutput' },
  { id: 7, key: 'spotShadow', dump: 'getShadow atlas', gate: 'walls/corpus' },
]);

export const IKEA_V0_PHASES = Object.freeze([
  { id: 0, key: 'canvas', label: 'Canvas surround #F2F2F0' },
  { id: 1, key: 'ibl', label: 'IBL SH ? albedo ? 0.6' },
  { id: 2, key: 'spot', label: 'Spot UBO (C)' },
  { id: 3, key: 'softPlane', label: 'Soft plane floor (A)' },
  { id: 4, key: 'softAo', label: 'Soft AO on IBL walls (B)' },
  { id: 5, key: 'iblSpec', label: 'IBL specular' },
  { id: 6, key: 'exposure', label: 'HDR exposure ?2 + screenCal' },
  { id: 7, key: 'spotShadow', label: 'Spot shadow atlas getShadow (IKEA)' },
]);

export const IKEA_V0_ALLOWED_EDIT = Object.freeze([
  'js/furniture/ikea-room-light-v0.js',
  'js/furniture/ikea-light-gate.js',
  'js/furniture/ikea-v0-manifest.js',
  'js/furniture/room-cabinet-studio.js',
]);

export const IKEA_V0_SOT_READ = Object.freeze([
  'js/furniture/betrakta-sot.js',
  'docs/IKEA-betrakta-pbr-soft-spot-sot-20260826.md',
  'docs/IKEA-v0-extract-gl-live-20260828.json',
  'docs/IKEA-v0-extract-SH-live-20260828.json',
]);

/** ????? ?????????? ?? dump (?? ????). */
export const IKEA_V0_DEVIATIONS = Object.freeze([
  {
    id: 'ikea-r3j90-place-defer-light',
    note:
      'r3j90: place still slow after r3j89 — defer Soft/Spot/cavity via scheduleIkeaRoomLightSync (160ms sliding); coalesce with hanger/hinge rebind; Soft footprint via furniture-root AABB not per-mesh expandByObject; hinge markers mount only new cabinet.',
  },
  {
    id: 'ikea-r3j89-place-studio-rebind',
    note:
      'r3j89: place lag — scheduleCabinetStudioRebind coalesce; no SyncAll after each GLB; bindCabinetRoot no nested syncIkeaRoomLightV0 (one sync per apply/flush). Soft/Spot/cavity numbers unchanged.',
  },
  {
    id: 'ikea-r3j88-room-rod-hangers',
    note:
      'r3j88: rod companions (плечики) spawn in room after GLB load — clodis-rod-companions + attachCabinetModelToGroup. cabinet_model#22 preview_only=0. Not lighting.',
  },
  {
    id: 'ikea-panel-edge-ao-p1',
    note:
      'panel-edge AO (7 Sep 2026, согласовано пользователем по гейту). ПРИЧИНА: у нас стык створок ' +
      'читался пятном, а не линией. Пипетка двух кадров одним методом: IKEA — провал 9-19 ед. при ' +
      'ширине 2-3 px, РОВНЫЙ по всей высоте полотна; наш — 2.6-4.0 ед. Вертикальный градиент полотна: ' +
      'IKEA 226→186 и 218→175 (~40 ед.), наш 235→221 и 239→222 (14-17 ед.). Уровень: IKEA 174-226, ' +
      'наш 219-239. cabinetGain 1.49→0.85 стык НЕ проявил — значит это не тонемап и не свет. ' +
      'DUMP (docs/IKEA-dump-door-gap-20260907.js): дверь PAX 495x2294x16 мм при 1156 вершинах ' +
      '(простая плита = 24) → профиль кромки смоделирован; occlusion_sampler + occlusion_strength 1; ' +
      'каркас 500 → щель между створками ~5 мм, субпиксельная на их кадре. Итог: их линия = фаска + ' +
      'бейк, а не тень. Постоянство глубины по высоте при перепаде освещённости 40 ед. это и доказывает. ' +
      'ИЗЪЯН ДАМПА: gapToPrevMm непригоден — Babylon отдал ЛОКАЛЬНЫЕ границы (все двери с центром в ' +
      'нуле), нужен computeWorldMatrix(true) перед minimumWorld; щель 5 мм выведена из ширины полотна ' +
      '495 при каркасе 500, а не измерена. ОТКЛОНЕНИЕ: бейк под параметрическую панель невозможен, ' +
      'поэтому величину считаем аналитически по расстоянию до собственной кромки — та же подстановка, ' +
      'что уже принята для полости корпуса (ikea-r3j71: их image0 запечён под модель). ' +
      'КАК: varying vObjPos/vObjNormal (object space, матрицы в фрагмент не идут), uniform panelBoxMin/Max ' +
      'из geometry.boundingBox, ширина полосы из мм делится на мировой масштаб оси. Грань = доминирующая ' +
      'ось нормали, расстояние по двум осям В грани (ось нормали исключена, иначе полоса залила бы плиту ' +
      'по половине толщины). Идёт в тот же канал ao, что Soft AO и полость — у IKEA это один ' +
      'occlusion_sampler, не второй свет. Uniform пишутся в onBeforeRender: материал может быть общим ' +
      'на несколько плит, и одна запись за кадр дала бы всем bbox последней. ' +
      'KINDS: facade / door / trim. Обклад включён намеренно — закрывает старый gap «рамка 211 при ' +
      'стене 210 сливается» (r3j76), причём БЕЗ возврата в soft heightmap, который откатывали по p8z44. ' +
      'СТАРТ: edgeMin 0.72, side 8 мм, top 8 мм (8+8 = 16 мм полосы на стык ~2.7 px при нашем масштабе). ' +
      'Ручки: __cldIkeaV0SetPanelEdgeAo(min, sideMm, topMm) + панель Cavity. Цель подбора — провал 9-19. ' +
      'РИСК: полоса идёт по всему периметру, включая верх полотна; у нас шкаф в потолок, у них там ' +
      'зазор, поэтому верх/низ вынесен в отдельный ползунок. shaderRev 54. ' +
      'НЕ ТРОГАЛ: Spot UBO, exposure, _roomDimScale, полость корпуса, цвет фасада, soft-слои, ?v= (см. ниже).',
  },
  {
    id: 'ikea-room-dim-080',
    note:
      'room-dim: user asked for the room darker (7 Sep 2026, explicit request; first 10%, then deeper). Dump has ' +
      'surfaceLinearScale = 1 on every surface, so betrakta-sot.js stays dump-true and the screen-side ' +
      'adjustment lives in ikea-room-light-v0.js as _roomDimScale = 0.8, folded into surfaceLinearScaleForKind. ' +
      'Applies pre-ODT (shader: linear *= surfaceLinearScale, after ibl + spot) and ONLY to room kinds ' +
      'wall / frame / ceiling / floor / floorSlab. Cabinet kinds (corpus, facade, back, trim, door) are ' +
      'excluded on purpose — the user complained about the cabinet darkening; it keeps its own white / gain. ' +
      'Live knob: __cldIkeaV0SetRoomDim(x), 1 = dump. Baseline before dim, canonical camera: wall 228, ' +
      'ceiling 192, floor 211, floorCorner 207 vs SoT 209 / 179 / 185 / 165. This is a deviation, not a fix: ' +
      'the real gap is still the Spot wash (wallSideDelta 6 vs 28) — see ikea-ibl-pi-lambert-REJECTED.',
  },
  {
    id: 'ikea-ibl-pi-lambert-REJECTED',
    note:
      'REJECTED — do not retry. Hypothesis: iblDiffuse lacked Lambert 1/PI while the Spot path had it ' +
      '(spotLin = color x att x albedo/PI). Added IBL_DIFFUSE_INV_PI to computeIblCore, shaderRev 51->52. ' +
      'Measured on canonical camera, empty room. Before: wall 228, wallSide 222, ceiling 192, floor 211, ' +
      'floorCorner 207 (SoT 209/179/185/165); wallSideDelta 6, floorCornerDelta 4, wallCeilDelta 36. ' +
      'After 1/PI: wall 214 (ok), floor 195 (ok), but ceiling 114 vs SoT 179 and wallCeilDelta 100; cabinet ' +
      'visibly darker (same IBL path). Conclusion: the ceiling is the clean IBL probe (Spot points down, ' +
      'dir 0,-1,0), and at 192 vs 179 it was already inside tolerance 15 — shCoeffs are dump preScaled SH, ' +
      'i.e. already radiance, not irradiance, so 1/PI double-corrects. Reverted, shaderRev 53. ' +
      'Remaining real gap is on Spot-lit surfaces only: wall +19, floor +26, floorCorner +42 over SoT with ' +
      'gradients too weak (wallSideDelta 6 vs 28, floorCornerDelta 4 vs 26). Next lead is the Spot wash on ' +
      'walls/floor (see wall-cone-stripe-p8z33, spotWallScale / spotWallMinDist2, p8z10 reverted these to 1 / 0), ' +
      'NOT candela 115 or the UBO, which need a fresh IKEA dump before any change.',
  },
  {
    id: 'ikea-nospeed1-single-module-instance',
    note:
      'nospeed1: ikea-room-light-v0.js and ikea-light-gate.js were imported under 3 different ?v= strings ' +
      '(r3j90 in renderer/init/room-manager/furniture-manager/studio, r3j80 in both room-edit-*). ' +
      'Different URL = separate ES module instance, each with its own _hdrState / _shUniform / state copy — the p8x trap. ' +
      'Effects: room-edit called installIkeaRoomLightV0 on an instance whose HDR/soft/SH were never initialized, so it ' +
      'bound room materials without them; and window.__cldIkeaV0* audits were registered by whichever instance loaded ' +
      'last, so PipetteCompare saw isIkeaHdrDisplayActive()=false, fell back to plain renderer.render (LDR) and read ' +
      'wall 255 / floor 250 with wallSideDelta=0 — a measurement artifact, not the settled frame. ' +
      'All import sites aligned to IKEA_V0_CACHE_BUST. No light math: phase, Spot 115/UBO, env 0.6, exposure 2, SH, ' +
      'soft plane, soft AO and the r3j86 cavity bake are untouched.',
  },
  {
    id: 'ikea-r3j87-cavity-tune-save-console',
    note:
      'r3j87: Cavity panel «Сохранить» → console.warn [CLD][CAVITY-TUNE] + window.__cldIkeaV0CavityTuneSaved. No light math change.',
  },
  {
    id: 'ikea-r3j86-cavity-tune-bake',
    note:
      'r3j86: bake cavity UI 2026-09-05 — level=1, levelUp=1, creaseMin=0.6, creaseWidthMm=121, white=1, gain=1.49. gain is dump deviation (ярче чистого белого). User may still tweak via panel.',
  },
  {
    id: 'ikea-r3j85-orbit-ikea-lo',
    note:
      'r3j85: IKEA orbit = same ODT, lights not dirty, no TAA while moving. We: canvas-res HDR rtOrbitLo + ODT blit to canvas (no MSAA/SS/FXAA); skip entire syncIkeaRoomLightV0 mid-drag; skip wall/icons. No LDR shortcut (r3j83 zasvet).',
  },
  {
    id: 'ikea-r3j84-orbit-same-odt',
    note:
      'r3j84: orbit zasvet — r3j83 canvas LDR (hdrFbWrite=0) used different tonemap than settled HDR→RRT→ODT blit. IKEA keeps same output path while moving, only resets TAA. Orbit again: rtOrbit HDR write + same blit/FXAA; no DPR drop on drag.',
  },
  {
    id: 'ikea-r3j83-orbit-canvas-ldr',
    note:
      'r3j83: r3j82 still lagged — orbit still rendered full HDR RT (heavy shaders). During rotate/pan: single canvas LDR render (hdrFbWrite=0, tonemap in shader), DPR×1 resize, coalesce pointer deltas per rAF. Spot/Soft textures unchanged. Settled view full HDR MSAA+TAA. Superseded by r3j84 (zasvet).',
  },
  {
    id: 'ikea-r3j82-orbit-hdr-fast',
    note:
      'r3j82: orbit lag after r3j81 JS skip — remaining cost was HDR MSAA×4 + resolve + TAA + FXAA every drag frame. During isRotating/isPanning: render to non-MSAA rtOrbit → tonemap blit → FXAA (same materials/Spot/Soft textures). Settled view keeps full MSAA+TAA. Light/shadow not removed. Superseded by r3j83 canvas path.',
  },
  {
    id: 'ikea-r3j81-orbit-skip-heavy-sync',
    note:
      'r3j81: cabinet-room orbit stutter — syncIkeaRoomLightV0 did Spot/Soft/cavity + full traverses every rAF; HDR render also syncSpotUniforms mid-drag. During isRotating/isPanning: only camera uniforms; cache IKEA mats for cam/hdrFbWrite; skip icons; Spot atlas early-out. Soft/Spot numbers unchanged.',
  },
  {
    id: 'ikea-r3j80-orbit-rad-per-px',
    note:
      'r3j80: OrbitPlannerCamera live drag measure — delta_x=dx/width, delta_y=dy/height; pitch+=-dy*2π, yaw+=dx*2π*aspect → rad/px=2π/clientHeight (~7× faster than r3j79 sens 1000). Babylon Camera.inertia 0.9 unused by orbit — remove release coast. Snap during LMB kept. Zoom damp unchanged.',
  },
  {
    id: 'ikea-r3j79-orbit-ikea-inertia',
    note:
      'r3j79: cabinet orbit felt laggy/jerky — cameraRig damping 0.1–0.12 lagged behind LMB + Soft capture mid-drag. During rotate/pan snap eye to desired; release inertia 0.9 (dump BabylonEngineCamera.inertia); angularSens 1000 (Babylon default); Soft skip while isRotating/isPanning. Zoom damp unchanged. Start pose still dump (0,1,5.3)m. Superseded by r3j80 sens.',
  },
  {
    id: 'ikea-r3j79-cabinet-gain-above-dump',
    note:
      'r3j79: пользователь — «уперся в 100, хочу еще белее, дай диапазон до 200». ПОЧЕМУ УПЁРСЯ: level/' +
      'levelUp/creaseMin выше 1 не действуют — occ режется в clamp(0,1), при level 1 затенения нет вовсе; ' +
      'white выше 1 не действует — albedo режется в clampScalar(0,1), а 010_White и так ~0.996 линейного. ' +
      'То есть шкаф стоял на физическом потолке пайплайна, расширение этих ползунков дало бы мёртвый ход. ' +
      'ДОБАВЛЕНО (ОТКЛОНЕНИЕ ОТ ДАМПА, у IKEA такой ручки НЕТ): uniform cabinetGain, множитель линейного HDR ' +
      'перед betraktaOutputColor — то есть до тонмапа, поэтому пересвет уходит в roll-off, а не в жёсткий клип. ' +
      'Ставится ТОЛЬКО на материалы с __cldIkeaV0Cabinet, у комнаты остаётся 1, дефолт 1 = уровень IKEA. ' +
      'Юниформ идёт через единую фабрику материалов (cavityOcclusionUniforms в общем спреде), поэтому ' +
      'отсутствующего значения и чёрных поверхностей быть не может. Диапазон слайдера 1..2. ' +
      'ЧЕСТНО ПРО ЦЕНУ: gain > 1 делает шкаф ярче стены (пипетка стены 218), это уже не IKEA — при возврате ' +
      'к сверке с дампом ставить 1. Также levelUp max в UI опущен 1.2 → 1, а creaseWidthMm max поднят 120 → 300: ' +
      'первый был мёртвым ходом, второй реально работает. ' +
      'ИЗМЕРЕНО на момент правки: наш задник 188 против IKEA 175, бок 178 против 174, то есть интерьер УЖЕ ' +
      'светлее эталона на 22% в линейном, и угловых складок (у IKEA 150..156) на нашем скане не было — ' +
      'пользователь вёл crease к 1. Дальнейшее осветление — его продуктовое решение, не сходимость с дампом. ' +
      'shaderRev 51.',
  },
  {
    id: 'ikea-r3j78-back-panel-was-out-of-cavity',
    note:
      'r3j78: пользователь — «вертикальная тень на боку есть, на заднике нет». ПРИЧИНА: ранний выход ' +
      'cabinetCavityOcclusion отбраковывал точку по одному расстоянию до грани AABB (margin 8 мм под плиту 16). ' +
      'Задник — HDF тоньше margin, поэтому под порог попадала и его ВНУТРЕННЯЯ грань: весь задник выходил из ' +
      'слоя с occlusion 1. Диагноз подтверждён ручкой: при creaseMin 0.3 и creaseWidthMm 300 задник остался ' +
      'идеально ровным, а бок потемнел — значит дело не в весах осей (axis из аудита = 2, глубина, верно). ' +
      'Пипетка сходится: задник 188 против бока 165 — разрыв больше, чем даёт разница нормалей при равном occ. ' +
      'СТАЛО: (1) вне бокса → occlusion 1 (сохраняет поведение r3j73 для выехавших ящиков); (2) грань считается ' +
      'внешней только если лежит у грани бокса И нормаль смотрит наружу через ЭТУ ЖЕ грань — толщина плиты в ' +
      'критерии больше не участвует, margin остаётся только допуском «лежит на AABB». ' +
      'ДОБАВЛЕНО: setIkeaV0CabinetWhite(k) — множитель на linear albedo dump-материалов корпуса, база ' +
      'запоминается на материале. Ручка ПОДБОРА: сойдётся число — переносим в SOT/каталог. ' +
      'ИЗМЕРЕНО, РАБОТЫ НЕ ТРЕБУЕТ: асимметрии стен нет — левая 210, правая 209, низ 204/204, рамка 211/211. '
      + 'ПОДТВЕРЖДЕНО 2026-09-07 дважды, вопрос закрыт: (1) зеркальное сравнение кадра пустой комнаты — '
      + 'боковые стены в зеркальных точках расходятся на 0.0–1.2 ед., потолок 0.0, пол 0.0–0.2, задняя стена ≤1.5; '
      + '(2) пипетка пользователя по центрам стен — левая RGB 220,217,212 против правой 218,217,212, '
      + 'т.е. дельта только в R и только 2 ед., в яркости 217.3 vs 216.9 = 0.4 ед. из 255 (0.2%, ниже порога глаза ~2-3 ед.). '
      + 'Смещение Spot по X исключено: оно проявилось бы на полу и потолке, там ровные нули. '
      + 'Для сравнения кадр IKEA: левая 205.5, правая 207.7 — у эталона разброс БОЛЬШЕ нашего. '
      + 'Причина ощущения — подсветка матрицы / одновременный контраст с UI по краям канваса, не рендер. '
      + 'НЕ «исправлять» симметрию стен: она уже симметрична. Открытым остаётся другая ось — Spot z=0 против дампа (0,5,2). ' +
      'ОТКРЫТО: рамка обклада 211 при стене 210 — сливается, разница в 1 единицу. Отделить её тенью нельзя ' +
      'через Spot: по дампу layerMask 3 = каркас + модули, trim в атласе теней НЕТ, и receive у trim выключен ' +
      'осознанно. Их отделение даёт soft-слой, а обклад из wall-heightmap исключён по p8z44 (планка во всю стену ' +
      'раздувала footprint блюра). Возврат туда — отдельная задача с риском регрессии. shaderRev 50.',
  },
  {
    id: 'ikea-r3j77-cavity-tune-top-chip',
    note:
      'r3j77: cavity tune UI — collapsed 40px chip in top-right scene icon row (fa-adjust); click expands sliders. Auto-mount; ?cavityTune=1 opens.',
  },
  {
    id: 'ikea-r3j76-cavity-tune-ui',
    note:
      'r3j76: temporary on-screen sliders __cldIkeaV0CavityTuneUI() / ?cavityTune=1 for level/levelUp/crease/width — no build while calibrating.',
  },
  {
    id: 'ikea-r3j75-cavity-flat-level-plus-crease',
    note:
      'r3j75: пользователь — «шкаф светло серый, в тени серый; у них почти белый слегка бежевый». ' +
      'ПИПЕТКА скрина сравнения (оба рендера приведены к общей опоре — стена: IKEA 211, у нас 218, мы на 7.7% ' +
      'ярче в линейном): у IKEA внутренний бок и задник = 175 РОВНО по всей глубине, верх полки 216..229, ' +
      'полоса стыка ~18 px до 154, warmth R/B 1.023..1.029. У нас: бок 207→126 длинным скатом, задник 188 ровно, ' +
      'верх полки 226..234, warmth 1.021..1.028. Вывод: ЦВЕТ И ТЕПЛОТА У НАС УЖЕ СОВПАЛИ (задник 010 из r3j74 ' +
      'верен, ±2%), «серость» — это скат по глубине на боках, а не тон. ' +
      'ОШИБКА МОДЕЛИ: form factor к проёму по построению даёт монотонный скат и у переднего торца всегда выходит ' +
      'на полную яркость. Проверено численно: при rho 0.99 получается 192→234, ровных 175 не даёт НИ ПРИ КАКОМ ' +
      'rho — то есть настройкой cavityInterreflectMax задача не решается в принципе. У IKEA occlusion — ' +
      'запечённая карта при strength 1: внутри каркаса почти постоянная, тёмные только складки в стыках плит. ' +
      'СТАЛО: occ = level(нормаль) × складки. Складка = расстояние до ближайшей плиты отсека по каждой из трёх ' +
      'осей, своя плоскость исключается весом 1-|dot(n, axis)| — точка на боку лежит НА плите своей оси и от неё ' +
      'не темнеет, а вертикальная полоса в углу бок↔задник (её пользователь отмечал красным с r3j73) берётся из ' +
      'складки по оси проёма. Уровень зависит от нормали: у них верх полки ярче вертикали в 1.87 раза, наш IBL ' +
      'сам даёт лишь 1.11, поэтому CAVITY_INTERIOR_LEVEL 0.54 / _UP 0.9 (цель по нашей шкале: вертикаль 178, ' +
      'верх полки 234). Складка CREASE_MIN 0.77 (175→154 = linear 0.415→0.319), ширина 45 мм (~18 px). ' +
      'cavityApertureFormFactor и cavityInterreflectMax оставлены в файле как готовая реализация однократного ' +
      'отражения, но НЕ вызываются. ' +
      'ОТКРЫТО: уровень выведен из JPEG (тонмап + сжатие = запас ±8 уровней яркости), поэтому добавлен ' +
      '__cldIkeaV0SetCavityLevel(level, levelUp, creaseMin, creaseWidthMm) — сойдётся на числе, переносим его ' +
      'в константы и в эту запись. Дамп средней по 003_Backside #image2 по-прежнему не снят. shaderRev 49.',
  },
  {
    id: 'ikea-r3j74-occlusion-finish-independent',
    note:
      'r3j74: пользователь — «на цветном у нас темно, а в IKEA светло»; их тёмно-серый шкаф внутри светлый. ' +
      'ОШИБКА ПРОТИВ ДАМПА: rho в сумме переотражений брался как luma(albedo) панели. У оранжевого корпуса ' +
      'luma≈0.25 → occ = ff/(1-0.25(1-ff)) ≈ 0.25 при ff 0.2, то есть тёмный ящик. Но у IKEA occlusion — ' +
      'ЗАПЕЧЁННАЯ occlusionTexture с фиксированными значениями при occlusion_strength 1, одна и та же для любой ' +
      'отделки (image0 общий для 010_White и 003_Backside). Затенение не имеет права зависеть от цвета отделки. ' +
      'rho теперь константа cavityInterreflectMax = 0.95; белый шкаф без изменений (luma 0.988 всё равно резался ' +
      'потолком 0.95), цветной сравнялся с белым. Аргумент albedoLin из cabinetCavityOcclusion убран. ' +
      'ЗАДНИК: dump 003 = base_linear [1,1,1] × diffuseTexture #image2; текстуры у нас нет, и [1,1,1] без неё ' +
      'значит «текстура чисто белая» — HDF таким не бывает, задник выходил нейтральным пятном ХОЛОДНЕЕ тёплого ' +
      'каркаса. Граница по дампу: задник не светлее каркаса → linearAlbedoFromSot(back) отдаёт 010_White до дампа ' +
      'image2. betrakta-sot.js НЕ правился (он SOT_READ), только маппинг в ikea-room-light-v0.js. Roughness 0.6 цел. ' +
      'ОТКРЫТО: «весь шкаф серее и холоднее IKEA» — уровень/тон корпуса, нужен JSON uniforms живого шкафа ' +
      '(warmth = R/B, дамп 1.032); и «тень в углу плохо видно» — у них узкая контрастная полоса у угла (near-field ' +
      'в их бейке), у нас широкий плавный градиент от проёма. Ни то, ни другое не трогал без данных. shaderRev 48.',
  },
  {
    id: 'ikea-r3j73-cavity-compartment-and-drawers',
    note:
      'r3j73: пользователь — «нет вертикальных теней в углах бок↔задник», «выдвинутые ящики тёмные». ' +
      'ПРИЧИНА УГЛОВ: полость была весь шкаф целиком, проём во всю высоту → градиент почти плоский ' +
      '(бок у задника 0.806 против 0.947 у проёма). Полка и стойка свет не пропускают, значит проём для точки ' +
      'ограничен её ОТСЕКОМ. Добавлены перекрывающие плиты: определяются геометрически (тонкая по своей оси и ' +
      'перекрывает полость по второй оси проёма и по глубине ≥50%), без имён и ролей — задняя стенка тонкая по оси ' +
      'проёма и блокировщиком не становится. Проём обрезается до ближайших плит с двух сторон точки по каждой оси. ' +
      'Стало: бок у задника 0.665 vs 0.944 у проёма, зад у бока 0.840 vs 0.886 центр, полка сверху у зада 0.684. ' +
      'ПРИЧИНА ЯЩИКОВ: выдвинутый ящик — kind corpus, он раздувал AABB полости вперёд, проём уезжал за корпус и ' +
      'интерьер темнел. Ящики (meshSpotShadowIsDrawerLike) исключены из бокса и из блокировщиков; выехавший ящик ' +
      'выходит за бокс и по margin-маске получает occlusion 1. Приёмниками occlusion ящики остаются. ' +
      'ОТКРЫТО, НЕ КОСТЫЛИТЬ: (1) задник — dump 003_Backside base_linear [1,1,1] + diffuseTexture #image2, у нас ' +
      'SOT.back.srgb [1,1,1] без текстуры → чистый белый вместо их HDF. Нужен дамп средней по image2, не выдумка. ' +
      '(2) «холодный корпус» — SOT.corpus.srgb [0.998,0.998,0.967] тёплый по дампу, значит либо albedo не доходит ' +
      '(step-5 каталог, история r3j47..r3j49), либо холод от SH/IBL. Нужны uniforms живого шкафа. shaderRev 47.',
  },
  {
    id: 'ikea-r3j72-cavity-horizon-clip-and-interreflection',
    note:
      'r3j72: скрин пользователя — верх и низ полок ЧЁРНЫЕ, у IKEA интерьер почти как фасад. Две причины, обе мои. ' +
      '(1) БАГ: формула Lambert form factor по рёбрам верна только для полигона целиком над касательной ' +
      'плоскостью. Проём — высокий прямоугольник, у горизонтальной полки он пересекает горизонт, и часть ниже ' +
      'горизонта ВЫЧИТАЛА часть выше: ff ровно 0 при n=(0,±1,0), проверено численно (зад 0.504 и бок 0.296 были ' +
      'нормальные — дело было не в знаке обхода). Добавлена обрезка по dot(n,r)>=0 (Sutherland–Hodgman, 4 → до 5 ' +
      'вершин), после неё полка сверху 0.257 вместо 0. abs(f) оставлен как защита от обхода. ' +
      '(2) ФИЗИКА: даже с верным ff одна видимость проёма (одно отражение) для белой полости даёт чёрный ящик — ' +
      'белый шкаф светлый именно из-за переотражений. Добавлена замкнутая сумма ряда в ламбертовой полости ' +
      'occ = ff / (1 - rho*(1-ff)); rho = luma(albedo) с потолком CAVITY_INTERREFLECT_MAX = 0.95. ' +
      'Это ровно то, что IKEA несёт запечённым в occlusionTexture: у них интерьер мягкий, а контактные тени полок ' +
      'даёт Spot-атлас, не AO. Диапазон затенения стал 0.787 (полка сверху у зада) .. 0.953 (центр зада) вместо 0..0.5. ' +
      'CAVITY_INTERREFLECT_MAX — единственная ручка яркости интерьера: ниже темнее, 0.99 почти плоско. ' +
      'strength остаётся дамповая 1, формула :1179 и применение только к ibl :1080 не менялись. shaderRev 46.',
  },
  {
    id: 'ikea-r3j71-cavity-occlusion-channel',
    note:
      'r3j71: дамп 2026-09-04 — 010_White и 003_Backside_Furniture несут occlusionTexture из PAX GLB ' +
      '(po07vcxhiaxd#image0) при occlusion_strength 1; у стены occlusionTexture null. GLSL ikea-v1631-DEy_Xiep.js:1179 ' +
      'occlusion = 1 + strength*(occTex.r - 1), применяется только к ibl (:1080). Слот occlusion у нас отсутствовал, ' +
      'поэтому интерьер шкафа = ровный IBL. Тот же дамп закрывает путь r3j52..r3j66: blurred_heightmap.max 0.28 — ' +
      'Soft AO не может затемнить зад выше 0.28 м, это предел слоя, а не настройка. ' +
      'ОТКЛОНЕНИЕ: их image0 запечён под модель каркаса (одна карта на корпус и зад, от наполнения не зависит); ' +
      'у параметрического корпуса такой карты нет, поэтому occTex.r заменён аналитическим Lambert form factor ' +
      'проёма полости — та же величина, что хранит бейк, без пайплайна бейка. strength остаётся дамповой 1. ' +
      'Полость: AABB каркаса (kinds corpus+back) в системе корня шкафа; открытая сторона от задней стенки ' +
      '(тонкая ось = глубина, знак от зада к корпусу); без задней стенки слой выключен, а не угадан. ' +
      'Маска полости — margin 8 мм внутрь AABB, чтобы внешние грани оболочки не темнели. ' +
      'Фасад/дверь/обклад вне слоя: у плоскости проёма form factor вырожден. ' +
      'Пересчёт бокса throttle 200 мс (как Soft r3j64). ' +
      'ОТКЛОНЕНИЕ ГЕОМЕТРИИ (принято пользователем 2026-09-04): у IKEA над шкафом зазор, у нас шкаф в потолок, ' +
      'поэтому Spot y=5 внутрь практически не заходит и верх корпуса остаётся тёмным. Светом не компенсируем. ' +
      'Не тронуто: Spot UBO 115 / атлас 1024 / bias 3-8000, Soft plane, Soft AO, SH r3j42, env 0.6, exposure 2, ' +
      'стены, пол, потолок. shaderRev 45.',
  },
  {
    id: 'ikea-r3j70-no-hardware-spot-cast',
    note:
      'r3j70: hinge GLB isCabinetModel + Mesh1 leaves entered Spot depth hide/show → only 1 hinge left visible. metal/plastic out of CAST_KINDS; dedicated non-shelf modules do not cast; meshIsHingeOrHardwareRoot guard. SPOT 36.',
  },
  {
    id: 'ikea-r3j69-corpus-back-doubleside',
    note:
      'r3j69: open cabinet — Бок/Задняя FrontSide + outward normals → inner plast culled (shelves/facade Double still visible). corpus+back DoubleSide like facade/trim. shaderRev 44.',
  },
  {
    id: 'ikea-r3j68-spot-depth-visibility-restore',
    note:
      'r3j68: Spot atlas depth pass set caster.visible=false without try/finally — exception/reentry left frame (sides/back) invisible while shelves/doors stayed. Restore in finally + reentrancy guard + __cldIkeaV0RestoreCabinetVisibility. SPOT 35.',
  },
  {
    id: 'ikea-r3j67-shelf-layoutrole-casters',
    note:
      'r3j67: back pipette 188 (no bands) — casterNames had frame only, no shelves. Geom3D/Mesh1 under layoutRole shelf were blocked as frame lids (shelf-like checked only mesh/parent). Walk ancestors for shelf/drawer role; castModule without Module_ prefix. SPOT 34.',
  },
  {
    id: 'ikea-r3j66-spot-casters-no-stamp',
    note:
      'r3j66: remove Soft roof stamp code entirely. Spot atlas 1024 (live PAX tile). Shelf boards cast without requiring _core name (IKEA model87–91). Soft AO probe: h<=pos.y on mid back = expected. SOFT 33 / SPOT 33 / shaderRev 42.',
  },
  {
    id: 'ikea-r3j65-soft-ao-no-roof-stamp',
    note:
      'r3j65: Soft AO roof stamp darkened shelf tops (n.y≈1 → k≈2.5), not backs. Dump Soft blur max~0.28 → shelves h<y. Remove Soft AO stamp; keep Soft plane GPU + Soft throttle. Back~170 → Spot getShadow. SOFT 32.',
  },
  {
    id: 'ikea-r3j64-soft-capture-throttle',
    note:
      'r3j64: page hang — Soft capture+stamp every rAF (150+ Mesh/setFromObject ×2). Throttle Soft rebuild ≥150ms; drop per-frame PlaneGeometry top quads (CPU stamp remains for Soft AO). SOFT 31.',
  },
  {
    id: 'ikea-r3j63-soft-plane-no-roof-stamp',
    note:
      'r3j63: r3j62 roof stamp after blur made Soft plane floor black (1-exp(-2.45)). Soft plane = dump generate only (no Soft AO roof stamp). Soft AO stamp only on wall/AO capture. SOFT 30. Spot untouched.',
  },
  {
    id: 'ikea-r3j62-soft-stamp-after-blur',
    note:
      'r3j62: r3j61 still heightmapYm~0.65 < posYm — dump blur (±15) crushed pre-blur stamps. ' +
      'Stamp furniture roof into rtBlurV AFTER blur via texSubImage2D FLOAT. Soft AO reads post-stamp. SOFT 29. Spot untouched.',
  },
  {
    id: 'ikea-r3j61-soft-stamp-flip-footprint',
    note:
      'r3j61: SoftAoScale FAIL again — stampTexels=191 but heightmapYm@back=0.45 < posYm. ' +
      'DataTexture flipY=false (GL buffer already bottom-up); stamp isFurniture bbox XZ @ max.y so back XZ covered. SOFT 28. Spot untouched.',
  },
  {
    id: 'ikea-r3j60-soft-height-top-stamp',
    note:
      'r3j60: SoftAoScale FAIL h<=pos.y after dump Soft cam (r3j59). Soft AO input = world Y at XZ — MAX-merge soft-caster top footprints into rtHeight before blur (same meaning as filled Soft tops). GPU depth+transfer kept. SOFT 27. Spot untouched.',
  },
  {
    id: 'ikea-r3j59-soft-camera-dump',
    note:
      'r3j59: Soft AO scale check — blurMax~0.34 < back pos.y → ao=1. Root Soft cam was high lookAt (silhouette only). ' +
      'Dump SoftShadowRenderer: cam @ soft center, basis X/Y/Z=(1,0,0)/(0,0,-1)/(0,-1,0), ortho near/far=±size.y/2; depth→transfer_depth→blur. SOFT 26. Spot untouched.',
  },
  {
    id: 'ikea-r3j58-soft-height-opaque-depth',
    note:
      'r3j58: r3j57 built proxies=152 quads=74 but raw nz still 28 — quads never landed in rtHeight. Root: transparent+MaxEquation on float RT, not missing shelves. ' +
      'Soft height capture: opaque NoBlending + depthTest (camera above → nearest = max Y, dump-equivalent) + normal updateMatrixWorld for top quads. SOFT_PIPELINE_VER 25. Spot untouched.',
  },
  {
    id: 'ikea-r3j57-soft-height-top-quads',
    note:
      'r3j57: r3j56 still raw nz=28. Mesh proxy + MAX blend insufficient — thin shelf tris not filling top-down Soft RT. ' +
      'Stamp world XZ top-face PlaneGeometry at bbox.max.y per soft caster (IKEA Soft footprint of mask-3 horizontals). transparent MAX blend kept. Spot untouched.',
  },
  {
    id: 'ikea-r3j56-soft-height-max-blend-proxy',
    note:
      'r3j56: IKEA CDP Soft — blurred nz≈1190 max≈0.28 (same ballpark as Clodis blur); pre-blur backbuffer nz≈170 max≈0.73. Clodis raw nz=28 is the real gap. ' +
      'Proxy capture: stamp matrixWorld AFTER add(); height shader MAX-blend + no depth (highest Y wins = dump top-down). Spot/candela untouched.',
  },
  {
    id: 'ikea-r3j55-soft-height-proxy-capture',
    note:
      'r3j55: Soft height still raw nz=28 after frustumCulled fixes (Three Groups do not skip children; mesh cull alone insufficient). ' +
      'Root: main-scene Soft-layer ortho draw never fills horizontals. Capture now proxies soft casters into isolated scene (shared geometry + matrixWorld, frustumCulled false, cam layers all) — same Y-metre shader. Spot/blur/candela untouched.',
  },
  {
    id: 'ikea-r3j54-soft-height-group-frustum',
    note:
      'r3j54: r3j53 mesh-only frustumCulled=false left raw nz=28. Three projectObject skips children when a parent Group is culled — shelf Module_ groups culled before Полка meshes. ' +
      'Now mark soft meshes + ancestor chain. Spot/blur/candela untouched.',
  },
  {
    id: 'ikea-r3j53-soft-height-ortho-frustum',
    note:
      'r3j53: Soft height raw nz≈28 with shelves already on soft layer (softOnShelves=4, horizOnSoft=13). ' +
      'Probe clodis-soft-frustum: culledHoriz=13 culledShelves=4 — top-down ortho Soft cam (up −Z) frustum-culls horizontals. ' +
      'captureSoftHeightmap temporarily frustumCulled=false on soft/floor layer meshes, restore after. Dump-faithful: IKEA Soft draws mask-3 shelves; no blur/candela/Spot change.',
  },
  {
    id: 'ikea-r3j52-soft-height-shelves-mask3',
    note:
      'r3j52: Soft height dump layerMask 3 includes shelves. catalog_29 Полка spec.id «6» was mis-tagged as hinge metal → softCaster=false → raw Soft height ~28 px (vertical edges only), Soft AO dead on back. ' +
      'Fix: interior fill (shelf/drawer) never hardware; softCaster on; meshContributesSoftHeightCapture includes shelf modules. Spot UBO/candela/blur untouched.',
  },
  {
    id: 'ikea-r3j51-revert-spot-xz-follow',
    note:
      'r3j51: REVERT r3j50 Spot.xz furniture-bbox follow. User: worse picture; must stay dump-faithful one Spot. ' +
      'Spot again fixed dump (0,5,2) room-local via resolveSpotPositionWorldMm. No second lamp was added in r3j50 — only XZ move of the same UBO Spot; that move is withdrawn until live IKEA mainLightCenterPosition dump, not bbox guess. Soft/SH/albedo/candela untouched.',
  },
  {
    id: 'ikea-r3j50-spot-xz-follow-solution',
    note:
      'REVERTED r3j51. Was: Spot.xz + Soft viewport xz follow furniture bbox center. Wrong without dump of IKEA updateMainLightPosition anchor.',
  },
  {
    id: 'ikea-r3j49-near-white-hex-as-dump',
    note: 'r3j49: isBuilderFlatWhite used THREE.Color + r>=0.999. ColorManagement stores linear, so catalog preview #f5f5f5 / #fefefe missed the dump-albedo branch and stayed cold (1,1,1) until the async map arrived. Hex is now parsed as sRGB bytes (min>=240, chroma<=16); RGB path uses min>=0.88 chroma<=0.09. Else-branch of applyIkeaV0MeshDecorFromStep5 also writes linearAlbedoFromSot for dump panels. r3j48 map-branch kept. Spot/SH/env/exposure untouched.',
  },
  {
    id: 'ikea-r3j48-white-tint-keeps-dump-albedo',
    note: 'r3j48: r3j47 skipped builder #fff only when opts.map was empty. Step 5 white finish always calls applyIkeaV0MeshDecorFromStep5 with colorHex=#ffffff AND a catalog map (furniture-manager). That path still wrote linear (1,1,1); console table showed step5=true BR=1.000 and hasAlbedoMap=1 while uniforms.map was empty (shader uses albedoMap). Map-branch now uses linearAlbedoFromSot(kind) for dump panel kinds; skipBuilderWhiteOnDumpPanel no longer bails on map so rebind cannot restore (1,1,1). Textured / non-white step-5 finish unchanged. Spot/SH/env/exposure untouched.',
  },
  {
    id: 'ikea-r3j47-dump-albedo-all-panels',
    note: 'r3j47: r3j46 skipped builder #fff only on kind=corpus, so step-5 trim/facade/back/door still got (1,1,1). Console table: every step5=true mesh (SidePlankLeft/Right, TopPlank, BottomPlank, Dno shkafa_core) had BR=1.000 while step5=false corpus had BR=0.9309 = dump 010_White. Screen B/R was 1.000 across the cabinet vs IKEA 0.972 -> cabinet read neutral grey. Now BUILDER_WHITE_DUMP_PANEL_KINDS = corpus/facade/back/trim/door in both skipBuilderWhiteOnDumpPanel and applyIkeaV0MeshDecorFromStep5, and step-5 white uses linearAlbedoFromSot(kind) so back keeps 003_Backside. Textured or non-white step-5 finish untouched. Only ikea-room-light-v0.js; SH r3j42, spot, env 0.6, exposure, ceiling spec r3j43 untouched.',
  },
  {
    id: 'ikea-r3j46-corpus-010-skip-builder-fff',
    note: 'r3j46: parametric *_core corpus was (1,1,1) from step-5 inside #fff / builder; IKEA 010_White is cream sRGB 0.998/0.967. Bind + step5 hex without map on kind=corpus write dump 010. Facade and textured inside finish unchanged.',
  },
  {
    id: 'ikea-r3j43-ceiling-ibl-diffuse-only',
    note: 'r3j43: iblSpecEnabledForKind — ceiling (and floor/slab) diffuse SH only, walls keep env spec. Phase 7 had iblSpec on ceiling roughness 0.4 which drew env-cube streaks (right side ~242 vs left ~174 on look-up view); IKEA empty room has no glossy ceiling. Only ikea-room-light-v0.js; SH r3j42, spot, env 0.6, exposure untouched. Audit: ceilingIblEnabled=0, wallIblEnabled=1.',
  },
  {
    id: 'ikea-r3j42-diffuse-sh-from-live-ubo',
    note:
      'r3j42: SH_PRESCALED was never a dump. IKEA-dump-SH-empty.js read sphericalPolynomial, computed sh9_raw itself, applied its own toIkeaPrescaled constants, then named the result diffuseSH_ubo. Read the real LightUniformBuffer binding 0 floats 36..71 on 2026-09-02: our L00 was 2.66x too bright and our L20 had the opposite sign, likely from the zz to (3z2-1) basis conversion. All nine vec3 replaced with live UBO values.' +
      ' Untouched: colorLineAndRange 39.92/38.55/36.53, envMapIntensity 0.6, exposure 2, cone, soft layer, roughness early-out, floor albedo. Predicted by docs/tmp-balance-solve.mjs over the full ACES chain: side wall 234.0 to 210.2 against the 209 pipette, unfitted; floor centre-minus-corner 10.4 to 21.0 against target 26.2; floor spot share 39.1 to 61.1 percent against the 67 the target needs.' +
      ' Env checked separately: fitting it to hit the wall exactly asks for scale 0.946, intensity 0.568 vs SoT 0.6, so 0.6 is confirmed and stays. Two residuals are open and are NOT this fix: floor centre 168.3 vs 187.6 because the IKEA parquet is absent from the repo (only public/images/textures/ikea/README.md, SoT falls back to a foreign herringbone) and needs albedo luminance 0.467 vs our measured 0.337; and delta 21.0 vs 26.2, inside the error of treating the parquet as grey while ACES works per channel.',
  },
  {
    id: 'ikea-r3j41-env-cube-rgbd-not-rgbe',
    note: 'r3j41: parseBabylonEnvSpecCubeFromBuffer decoded RGBD PNG faces as RGBE (2^(a-128)). Comment and Babylon .env format are RGBD: fromRGBD = rgb/alpha. After r3j37 TDZ fix the cube actually uploaded, so walls ODT-clipped white. Floor disk unchanged (roughness 1 skips spec). Dump-faithful decode only.',
  },
  {
    id: 'ikea-r3j38-radial-profile-reaches-corners',
    note: 'r3j38..r3j40 instrument only, no light touched. Three faults kept the radial profile blind to the disk. (1) It sampled normR 0..0.9 of _floorDiskMaxRadiusMm, the inradius x 0.92 = 1840 mm at 5000x4000, so the outermost ring sat at 1656 mm and never left the flat middle while the half-diagonal is 3202 mm; rings now step to _floorDiskProfileMaxRadiusMm with 64 angles plus the four corner azimuths. (2) applyIkeaFloorDiskAuditCamera pinned y to 5500 mm, which does not frame a 5000x4000 floor, and _worldMmToCanvasUv clamps off-frustum points to the screen edge, so outer rings silently reported the surround (242) and UI (255) as floor; height is now solved from fov and aspect with 1.12 margin and off-frustum samples are dropped. (3) Ring points past the inradius leave the floor rectangle and the pipette caught the white wall, so points outside room bounds inset by FLOOR_DISK_EDGE_INSET_MM are skipped. Rings also report displayRgbMedian for the chromaticity comparison. After the fixes our empty floor reads 198 at centre and 194.5 at 2911 mm, delta 3.5 on 12 valid corner samples; IKEA over the same span falls about 45.',
  },
  {
    id: 'ikea-r3j37-env-cube-face-tdz',
    note: 'r3j37: regression from r3j33. parseBabylonEnvSpecCubeFromBuffer declared "const face" for the decoded image inside a "for (let face = 0; ...)" block, so spec.mipmaps[face] hit the temporal dead zone and every parse threw "Cannot access face before initialization". The env specular cube never built - __cldIkeaV0AuditLight reported iblSpecReady false since r3j33 - so IBL specular has been absent from every surface. Inner binding renamed to faceData.',
  },
  {
    id: 'ikea-r3j36-output-gamma-22',
    note: 'r3j36: display encode is plain pow(1/2.2), not the piecewise sRGB curve r3j34 introduced. Dump betrakta_common (IKEA-v0-extract-gl-live-20260828.json) ends BETRAKTA_ENABLE_FORWARD_TONEMAPPING with sRGBtoRRT -> tonemapRRTtoODT -> ODTtoSRGB -> clamp -> pow(1.0/2.2); hdrRrtToAccumGamma already matched, only the display blit diverged. GLSL linearToSrgbTransfer dropped, JS _srgbTransferEncode01/_srgbTransferDecode01 replaced by _displayGammaEncode01/_displayGammaDecode01, surround solver target decoded with the same curve. Shifts display lum 1-2 units at midtones.',
  },
  {
    id: 'ikea-r3j36-soft-heightmap-empty-confirmed',
    note: 'r3j36 dump (empty room, live IKEA): blurred heightmap 512x512 Float32 is all zeros - min 0, max 0, nonzero 0%. _render_layer_mask.bitmap=2 but no enabled mesh carries bit 1 (floor layerMask 1, walls and ceiling 33, plan overlay 4), and walls sit in _block_layer_mask.bitmap=32. So soft ao = (0.4+0.6*exp(0))^2 = 1 across the whole floor and soft shadow cannot be the source of the IKEA floor disk. Also corrects SoT: _tracked_size is 64 x 2.77 x 64 at center (0, 1.285, 0), not 10 x 2.74 x 10 at (0, 1.3, 2).',
  },
  {
    id: 'ikea-r3j36-floor-disk-measured-from-screen',
    note: 'r3j36: first validated measurement of the IKEA floor disk, sampled from a PAX top-down screenshot (surround reads 242,242,240 = #F2F2F0, so the capture is faithful). Peak 200 sits at the room centre under the spot axis; symmetry-averaged profile along x is 200, 197, 190, 180, 173 at r = 0, 0.52, 1.03, 1.55, 2.07 m, reaching 160-166 at r ~ 2.6 m. Room 5.0 x 4.0 m per the on-screen dimension labels. Frame is cut by the bottom toolbar so the true corner at r 3.20 m is not in shot.',
  },
  {
    id: 'ikea-r3j36-surround-solver-residual',
    note: 'r3j36: surround clear solver decodes the #F2F2F0 target once and iterates in ODT space to a residual (was 48 fixed steps compared after the encode). The clear sits on the ACES shoulder where d(odt)/d(rrt) is about 0.02, so 48 steps left the background at #EEEEED and 64 at #F1F1F0; residual exit converges in ~303 steps, exact #F2F2F0.',
  },
  {
    id: 'ikea-r3j34-srgb-encode-and-plan-view-probe',
    note: 'r3j34: three real bugs. (1) blit lost the sRGB transfer - ODTtoSRGB is a gamut matrix, not an encode - so linear ODT went to the framebuffer and the whole room read ~50 lum dark (floor center 147 vs measured-match 186,145,84); surround clear solver now compares after the same encode or the background would jump. (2) JS _acesInputRgb/_acesOutputRgb were transposed, row sums 0.70/1.40/0.90 and 1.58/0.32/1.10 instead of 1/1/1, so jsDisplayLum and inverseOdtLinearTarget (the IKEA target itself) were wrong. (3) top-down disk probe hid nothing, so from camera y5500 it measured the DoubleSide ceiling slab at y2550 - every floor number was the ceiling (244/237 vs real floor 147/145). Disk itself still absent by geometry: cosInner 0.8434 = 32.5deg at 5m gives 3.19m radius vs room half-diagonal 3.20m, so smoothstep=1 over the whole floor and only 1/d^2 remains. Needs IKEA dump of room size + spot cone, not a candela tweak.',
  },
  {
    id: 'ikea-r3j33-envcube-datatexture-faces',
    note: 'r3j33: env spec cube faces = DataTexture (three r160 image[0].isDataTexture) ? fixes texSubImage2D Overload ?6; module ?v= unified',
  },
  {
    id: 'ikea-r3j32-readback-spot-center',
    note: 'r3j32: floor readback under Spot XZ (not room center); RRT?linear inverse ACES; linear frame from rtResolved; probe canvas gl.finish',
  },
  {
    id: 'ikea-r3j31-texsubimage-final',
    note: 'r3j31: promoteMapImageToRgbaCanvas all JPG; wall normal dummy until RGBA; floorTexture only on onLoad; needsUpdate=false before convert',
  },
  {
    id: 'ikea-r3j30-texsubimage-rgb-jpg',
    note: 'r3j30: no needsUpdate on RGB JPG until RGBA canvas; Room floor no map until resync; upload guard',
  },
  {
    id: 'ikea-r3j29-floor-resync-cycle',
    note: 'r3j29: break ensureFloor?resync?syncOne recursion; resync no syncOne',
  },
  {
    id: 'ikea-r3j26-floor-upload-guard',
    note: 'r3j26: floorMapGpuUploadReady ? no texSubImage2D on RGB JPG; resync waits for onLoad',
  },
  {
    id: 'ikea-r3j25-floor-rgba-guard',
    note: 'r3j25: ensureFloorMapRgbaImage ? only drawable Image/Canvas; skip DataTexture + loading JPG (fix drawImage crash)',
  },
  {
    id: 'ikea-r3j24-probe-canvas-readback',
    note: 'r3j24: _forceCanvasPipette ? albedo/spot probe read canvas not hdrDownRt',
  },
  {
    id: 'ikea-r3j23-floor-albedomap-uniform',
    note: 'r3j23: rename map?albedoMap; floor always samples (no hasMap gate); white 1?1 fallback',
  },
  {
    id: 'ikea-r3j22-floor-map-gpu-upload',
    note: 'r3j22: floor JPG?RGBA canvas + repeat=1 + flipY=0 + initTexture; shader fract/flip UV; mat.map sync',
  },
  {
    id: 'ikea-r3j21-floor-map-bind',
    note: 'r3j21: ensureFloorIkeaMapBound ? hasMap+map GPU sync; JS softAO emptyHeightTex h=0',
  },
  {
    id: 'ikea-r3j20-softao-empty-heightmap',
    note: 'r3j20: JS soft AO mirror uses emptyHeightTex h=0 (not stale rtBlurV); floor map heal on sync',
  },
  {
    id: 'ikea-r3j19-floor-linear-readback',
    note: 'r3j19: __cldIkeaV0FloorRrtReadback ? GPU linear?exposure readback vs JS split; gl.finish; disk center fix; floor uniforms audit',
  },
  {
    id: 'ikea-r3j18-floor-rrt-readback',
    note: 'r3j18: __cldIkeaV0FloorRrtReadback ? JS linear?RRT vs GPU rtResolved/accum/pipette at floor center',
  },
  {
    id: 'ikea-r3j17-linear-level-audit',
    note: 'r3j17: probe linear split at top-down (was eye camera); linearLevelAudit vs inverse ODT IKEA 187/161',
  },
  {
    id: 'ikea-r3j16-probe-odt-mirror',
    note: 'r3j16: _probeAfterOutputLum / _jsOdtLumFromRrtTriplet = hdrRrtToDisplaySrgb (no pow 1/2.2); jsMirror matches GPU blit',
  },
  {
    id: 'ikea-r3j7-radial-rrt-disk-probe',
    note: 'r3j7: __cldIkeaV0RadialDiskProfile (median rings) + __cldIkeaV0RrtDiskProbe (RRT readback chain A?E)',
  },
  {
    id: 'ikea-p8z31-hdr-blit-display-srgb',
    note: 'p8z31: HDR blit RRT?ODT?sRGB without pow(1/2.2); legacy gamma pow kept only for pre-RRT TAA fallback',
  },
  {
    id: 'ikea-r3j5-floor-map-resync',
    note: 'r3j5: resync passes loaded Texture to applyMapToIkeaV0Material; room.floorTexture ref; hasMap was stuck 0 ? albedo 1 ? ODT clip',
  },
  {
    id: 'ikea-r3j4-floor-herringbone-jpg',
    note: 'r3j4: bundled IKEA new_wooden_floor.glb diffuse.jpg; Room.js no needsUpdate before onLoad; top-down disk = max grid under Spot',
  },
  {
    id: 'ikea-r3j-ibl-spec-albedo',
    note: 'r3j: IBL dielectric mix uses iblSpecular?diffuseAlbedo; rough?1 floor = diffuse IBL only; disk corner = darkest parquet + 4-corner pipette',
  },
  {
    id: 'ikea-r3h-probe-ibl-spec',
    note: 'r3h: radiance probe mirrors shader (floor map albedo + IBL spec); surfaceLinearScale=1; Soft AO on floor per dump',
  },
  {
    id: 'ikea-r3-spot-disk-debug',
    note: 'ikea-r3b: spotDiskDebug = floor atten cone 0?1; walls dim gray; no gain clip',
  },
  {
    id: 'ikea-r2-full-dump-phase7',
    note: 'ikea-r2: ACTIVE_PHASE=7 full dump stack; emptyRoom scales=1; order C?A?B per manifest runbook',
  },
  {
    id: 'ikea-reset-r1-20260901',
    note: 'RESET r1: removed spot-wash scales p8z142?p8z156; baseline dump=1',
  },
  {
    id: 'dump-screencal-1-p8z141',
    note: 'p8z141: screenCal UBO=1 all kinds; floor albedoSat 1 + tint 1,1,1 ? drop pipette cal',
  },
  {
    id: 'cabinet-hardware-catalog-color',
    note: 'Hinges/guides: ikea v0 + model_key_material ? uniforms; refreshAfterDecor = hardware only',
  },
  {
    id: 'trim-no-soft-caster',
    note: 'Section trim: visible as cabinet; soft floor layer5 only; Soft AO walls without trim',
  },
  {
    id: 'soft-composite-off',
    note: 'Section trim excluded from Soft AO walls; corpus/back/facade follow room phase 4 like walls',
  },
  {
    id: 'soft-plane-spot-only',
    note: 'REVERTED p8z64: was spot?(1-alpha); now full linear ? (1-alpha) dump',
  },
  {
    id: 'cab-interior-pipette-t1-p8z89',
    note: 'p8z89 Task 1: __cldIkeaV0CabinetInteriorPipette ? back 170?8 shelf 177?8 corner 198?12',
  },
  {
    id: 'cab-both-shadow-layers-p8z92',
    note: 'p8z92: enabled both layers; superseded by p8z93 unified room path',
  },
  {
    id: 'cab-shadow-unified-room-p8z93',
    note: 'p8z93: removed cab capture-fit/interior gates/2nd RT ? corpus/back = walls dump 10?10 Soft AO + phase7 getShadow; 003 albedo white',
  },
  {
    id: 'cab-shadow-unified-room-p8z94',
    note: 'p8z94: removed IKEA_V0_CABINET_SHADOW_PHASE* ? cabinet = room phase only; facade 011 getShadow+Soft AO at phase 7/4',
  },
  {
    id: 'spot-shadow-shelf-cast-p8z95',
    note: 'p8z95: horizontal shelf SceneAssetInstance buckets used module pick ? frame-shell filter dropped all shelf casters ? flat interior',
  },
  {
    id: 'cab-pipette-dump-uv-p8z96',
    note: 'p8z96: pipetteCabinetAuto at dump UV [0.58,0.42]/[0.55,0.48]/[0.48,0.5] ? was min-pxn side pick (dark interior)',
  },
  {
    id: 'spot-shadow-shelf-bias-p8z97',
    note: 'REVERTED p8z98: shelf bias 1/0.5? crushed corner 119 ? back/shelf ok but not differential',
  },
  {
    id: 'spot-shadow-shelf-bias-revert-p8z98',
    note: 'p8z98: atlas back to dump 3/8000 all casters ? corner recover; back/shelf tune next (atlas contact)',
  },
  {
    id: 'cab-pipette-corner-shelf-lip-p8z99',
    note: 'REVERTED p8z100: shelf-lip pick does not change lum (read at dump UV) ? corner 119 is real atlas umbra',
  },
  {
    id: 'spot-shadow-side-contact-p8z100',
    note: 'p8z100: min getShadow on corpus side vertical only (0.78) ? corner 119 unchanged (stale mat + AO)',
  },
  {
    id: 'spot-shadow-side-contact-ao-p8z101',
    note: 'p8z101: side contact on vertical corpus getShadow+Soft AO; shaderRev rebind',
  },
  {
    id: 'spot-shadow-shelf-band-contact-p8z102',
    note: 'p8z102: shelf-band down-facing deep umbra ? corner moved to vertical side (184)',
  },
  {
    id: 'spot-shadow-contact-balance-p8z103',
    note: 'p8z103: side 0.86 + back 0.66 + shelf-band 0.84 ? back/shelf pass; corner orbit-dependent',
  },
  {
    id: 'spot-shadow-shelf-band-or-deep-p8z104',
    note: 'p8z104: OR deep still blocked corner when spotSh+ao both >0.42',
  },
  {
    id: 'spot-shadow-shelf-band-no-gate-p8z105',
    note: 'p8z105: down-facing corpus always max(ao,spotSh) to 0.88 ? corner mid ao path',
  },
  {
    id: 'pipette-camera-lock-p8z106',
    note: 'p8z106: probe applies dump-aligned interior camera on ?ikeaFixture=1; restores after read',
  },
  {
    id: 'pipette-camera-grid-p8z107',
    note: 'p8z107: pipette camera = fixture + grid delta (48) ? back+shelf+corner one dump view',
  },
  {
    id: 'pipette-camera-frozen-p8z108',
    note: 'p8z108: frozen delta ey0.32 tx-0.16 ? T1 PASS back172 shelf174 corner194; no grid',
  },
  {
    id: 'fixture-comparison-view-p8z109',
    note: 'REVERTED p8z110: fixture camera/lines ? scope light+shadow only',
  },
  {
    id: 'pipette-read-dump-uv-p8z109',
    note: 'p8z109: pipette lum always at ref.dumpUv (not hit.pxn)',
  },
  {
    id: 'shelf-band-contact-p8z111',
    note: 'REVERTED p8z112: 0.92 washed back pipette 207 ? stripe is atlas not shelf-band floor',
  },
  {
    id: 'front-rim-p8z116',
    note: 'REVERTED p8z117: front edge contact floor ? not in dump',
  },
  {
    id: 'cab-dump-path-p8z117',
    note: 'p8z117: removed contact floors (not in dump); screenCalCabinet=screenCalWall 1.21 (same ODT as walls)',
  },
  {
    id: 'cab-dump-albedo-010-003-p8z118',
    note: 'p8z118: corpus/facade/trim=010_White, back=003; builder #fff skipped; step5 catalog still writes same shader',
  },
  {
    id: 'soft-ao-raw-height-p8z119',
    note: 'p8z121: heightmap .r = (mm?0.001)/2.74 like dump 0.806; PBR .r ? y_m as IKEA ? umbra IBL white; p8z120 metres crush',
  },
  {
    id: 'spot-shadow-frame-sides-p8z122',
    note: 'p8z122: frame atlas casters = vertical sides like IKEA 90458221; corpus lid/bottom out of depth (filled XZ was getShadow=0 on facades)',
  },
  {
    id: 'soft-height-capture-tops-p8z123',
    note: 'p8z123: height capture DoubleSide + layer5-only block; back kind before isBody ? REVERTED sync in soft pass (recursion hang)',
  },
  {
    id: 'soft-height-no-recurse-p8z124',
    note: 'p8z124: removed ensureCabinetStudioSyncedForSoft from updateSoftPlanePipeline ? syncAllRoomCabinetStudio?syncIkeaRoomLightV0 loop hung WebGL',
  },
  {
    id: 'soft-height-dilate-p8z125',
    note: 'p8z125: 16-tap max-dilate (same offsets as blur) before Gaussian ? sparse raw tops nzMax 0.89?blur 0.10; interior softAo still 1',
  },
  {
    id: 'soft-height-dilate-tight-p8z126',
    note: 'p8z126: dilate r=3 (7-tap) not 16-tap ? p8z125 nzMean 0.16 crushed corpus IBL?AO (warm white?gray); pipette softAoComputed',
  },
  {
    id: 'spot-shadow-casters-dump-p8z127',
    note: 'p8z127: atlas casters = IKEA layerMask 3 dump ? 010/003 horizontal frame + hardware; revert p8z122 lid exclusion',
  },
  {
    id: 'spot-shadow-atlas-cache-p8z127a',
    note: 'p8z127a: skip 4096 atlas rebuild when caster signature unchanged ? console probes / rAF no longer freeze',
  },
  {
    id: 'spot-shadow-casters-consolidate-p8z127b',
    note: 'p8z127b: exclude parametric isBody horizontal lid; shelf?Module_; frame hardware merges into isFurniture (46?~IKEA instances)',
  },
  {
    id: 'camera-near-zoom-p8z127c',
    note: 'p8z127c: min zoom 2 mm ? close-up facades; not IKEA dump',
  },
  {
    id: 'camera-dynamic-near-p8z127cn',
    note: 'p8z127cn: near 0.5?10 mm from dist?0.0025 ? fixes z-fight on isEdge at far view (static near=0.5 crushed depth)',
  },
  {
    id: 'camera-zoom-cursor-p8z127d',
    note: 'p8z127d: wheel zoom to raycast hit (cabinet/wall/floor); target pull 0.88; min 0.5 mm ? not IKEA dump',
  },
  {
    id: 'soft-transfer-depth-p8z128',
    note: 'p8z128: IKEA transfer_depth (depth RGBA + invVP) replaces p8z126 max-dilate; SOFT_PIPELINE_VER 13',
  },
  {
    id: 'soft-capture-normY-p8z128b',
    note: 'p8z128b: normY ortho capture + transfer pass-through ? fixes invVP nzMax 0.29 + dark floor stripe from empty depth blur',
  },
  {
    id: 'soft-transfer-depth-p8z129',
    note: 'p8z129: IKEA transfer_depth (DepthTexture + invVP + depth>=1?0) replaces p8z128b pass-through; SOFT_PIPELINE_VER 15',
  },
  {
    id: 'soft-blur-pingpong-p8z129b',
    note: 'p8z129b: blur H?rtBlurH, V rtBlurH?rtBlurV (was in-place V on rtBlurV ? zero alpha); SOFT_PIPELINE_VER 16',
  },
  {
    id: 'soft-contact-x2-p8z129c',
    note: 'REVERTED p8z140: SOFT_PLANE_CONTACT_STRENGTH was 2; dump generate intensity 1 only',
  },
  {
    id: 'pipette-camera-always-p8z130',
    note: 'p8z130: T1 probe always applies canonical pipette camera + sideCorner prefers vertical side (+Y shelf fallback only)',
  },
  {
    id: 'pipette-camera-fixture-base-p8z131',
    note: 'p8z131: pipette base y=920 + front gap like ikea_light_fixture (p8z130 was too close ? flat lum ~185)',
  },
  {
    id: 'spot-casters-parametric-shelf-p8z132',
    note: 'p8z132: parametric ?????_core (isBody+h+shelf) in spot atlas ? back too bright without shelf getShadow; SPOT_PIPELINE_VER 28',
  },
  {
    id: 'spot-casters-shelf-core-only-p8z133',
    note: 'p8z133: shelf casters = _core only (no isEdge / !isBody catch-all / frame-shell leak); 26 meshes were k?????+????? ? opaque bands; SPOT_PIPELINE_VER 29',
  },
  {
    id: 'soft-plane-strength-dump-p8z140',
    note: 'p8z140: SOFT_PLANE_CONTACT_STRENGTH 2?1 dump; clamp alpha?1 ? metres heightmap + ?2 made floor black under cabinet',
  },
  {
    id: 'dump-align-no-kostyl-p8z139',
    note: 'p8z139: removed Soft AO n.y-skip, AO bias, CPU height stamp, getShadow n.y-skip ? back to dump formulas; Soft height still GPU-only; root gap = soft height not filling (blur?raw)',
  },
  {
    id: 'soft-height-shelf-fill-spot-p8z138',
    note: 'p8z138: shelves in spot (tnparn); Soft height still sparse blur~0.3 ? Soft AO dead; back bands were getShadow only',
  },
  {
    id: 'soft-height-direct-y-p8z137',
    note: 'p8z137: Soft height direct world-Y ? insufficient alone (blur still 0.29; shelves not in pass)',
  },
  {
    id: 'spot-casters-module-bypass-p8z136',
    note: 'p8z136: Module_ path returned true and kept parametric ?????_core casting ? p8z134 filter never applied; block parametric horizontal before Module_ pass; SPOT 31',
  },
  {
    id: 'soft-ao-skip-upward-p8z135',
    note: 'p8z135: Soft AO skip n.y>0.65 ? kept (harmless); hard pads were spot atlas, not Soft AO',
  },
  {
    id: 'soft-ao-metres-p8z134',
    note: 'p8z134: transfer_depth = reprojected.y metres (dump, no /normY); Soft AO alive; parametric ????? out of spot atlas (hard top umbra was substitute); SOFT 17 SPOT 30',
  },
  {
    id: 'side-contact-p8z115',
    note: 'REVERTED p8z116: side 0.94 flattened interior; back to 0.86',
  },
  {
    id: 'shelf-top-contact-p8z113',
    note: 'REVERTED p8z114: shelfTop contact not in IKEA dump ? stripe = atlas caster geometry',
  },
  {
    id: 'spot-shadow-room-no-receive',
    note: 'p8z51: getShadow on walls/frame + corpus/back/facade (IKEA); wallCone off; trim no receive',
  },
  {
    id: 'soft-height-norm',
    note: 'Capture (mm?0.001)/size.y dump 0.8; PBR texture.r ? posM.y metres',
  },
  {
    id: 'spot-shadow-gated',
    note: 'Atlas pass only when cabinet casters exist; empty room = spot without getShadow',
  },
  {
    id: 'spot-shadow-trim-no-cast',
    note: 'Section trim lit as cabinet but not spot shadow caster (frame ? PAX body silhouette)',
  },
  {
    id: 'spot-shadow-facade-no-receive',
    note: 'REVERTED p8z94: IKEA live 011 has ACTIVE_SHADOW+ENABLE_SOFT ? facade receive at room phase 7; door still off',
  },
  {
    id: 'wall-cone-bbox',
    note: 'Side trapezoid on inner walls from corpus/back AABB; atlas for cabinet interior only',
  },
  {
    id: 'wall-cone-ibl-mix',
    note: 'Wall paint: ibl*=mix(1,wallConeLit,0.36) in umbra ? cone readable at grazing angles',
  },
  {
    id: 'spot-shadow-spot-floor',
    note: 'p8z55: corpus/back umbra spotFloor 0.32?0.08 ? dump getShadow?0 + IBL; was washing shelves',
  },
  {
    id: 'spot-shadow-pcf-fixed',
    note: 'p8z55: PCF scale 3.2?1.25 (closer dump 1-texel + HW Linear); interior umbra readable',
  },
  {
    id: 'wall-plaster-normal-map',
    note: 'paint_30x30 normal from IKEA new_wall_1.glb ? 300mm world UV, scale 2',
  },
  {
    id: 'floor-map-world-uv',
    note: 'Floor herringbone world XZ / 640mm ? ShaderMaterial ignores texture.repeat',
  },
  {
    id: 'wall-screen-linear',
    note: 'REVERTED p8j ? dump linear; B-boost did not fix olive; tune after map sRGB',
  },
  {
    id: 'room-spot-wall-scale',
    note: 'REVERTED p8g ? spot?0.72 removed; cal only',
  },
  {
    id: 'ceiling-light-flip',
    note: 'REVERTED p8g ? ceiling flip caused spot patch; cal only',
  },
  {
    id: 'screen-cal-6h',
    note: 'screenCalEmpty 0.43 ? ceiling?1.45 ? floor?1.55 + floor screenTint',
  },
  {
    id: 'floor-screen-tint',
    note: 'REVERTED p8q ? dump tint 1,1,1; orange floor was warm screenTint deviation',
  },
  {
    id: 'floor-albedo-sat-p8m',
    note: 'REVERTED p8q ? albedoSat 1; desat was masking mapSampleLinear',
  },
  {
    id: 'betrakta-dither-rrt',
    note: 'p8q: ditherR11G11B10F in betraktaOutput #else (was missing vs dump)',
  },
  {
    id: 'scene-background-null',
    note: 'p8q: scene.background=null; surround=renderer clear #F2F2F0 (dump)',
  },
  {
    id: 'map-srgb-to-linear',
    note: 'NoColorSpace map + mapSampleLinear GLSL (JPG=RGB, no GPU sRGB on RGBA8)',
  },
  {
    id: 'floor-tex-onload-resync',
    note: 'Room.js onLoad ????????? SRGB ? ????? mapSampleLinear; resync ????? JPG',
  },
  {
    id: 'soft-ao-walls-on',
    note: 'Phase 4 B enabled on wall/frame/ceiling ? was hardcoded 0',
  },
  {
    id: 'env-v1-babylon-magic-png',
    note: 'p8t: .env v1 = magic 8B + null JSON + PNG RGBD mipmaps (not uint32 JSON len)',
  },
  {
    id: 'ldr-linear-no-rrt',
    note: 'p8v: betraktaOutput LDR = linear?screenCal?exposure; no sRGBtoRRT/RRTtoSRGB (hue fix)',
  },
  {
    id: 'room-manager-module-dedupe-p8x',
    note: 'p8x: room-manager ikea imports must use IKEA_V0_CACHE_BUST ? duplicate ES module zeroed floor iblSpec',
  },
  {
    id: 'floor-herringbone-ldr-cal-p8y',
    note: 'p8y: floor?2.0 ? ceil?1.38 ? albedoSat 0.72 ? tint 0.92/1.12/1.38 ? IKEA #c9b089 pipette; empty 0.40',
  },
  {
    id: 'wall-spot-dump-p8z10',
    note: 'p8z10: REVERT p8z9 ? wallScale=1 minDist?=0 calWall=1; dump Spot on walls for corner gradient',
  },
  {
    id: 'spot-bsdf-p8z11',
    note: 'p8z11: Spot via evaluateSpotBsdf (GGX) ? getLightData intensity ? IKEA evaluateLight, not albedo/?',
  },
  {
    id: 'per-pixel-wo-p8z13',
    note: 'p8z13: IKEA renderMaterial ? inverseViewProjection?gl_FragCoord ? per-pixel Wo (not uniform cameraPosM)',
  },
  {
    id: 'radiance-split-probe-p8z14',
    note: 'p8z14: __cldIkeaV0RadianceSplit() ? read-only IBL vs Spot at pipette ray hits (JS mirror)',
  },
  {
    id: 'deferred-odt-display-p8z15',
    note: 'p8z15: HDR display = tonemapRRTtoODT + ODTtoSRGB + clamp + pow(1/2.2) ? IKEA deferredTonemap blit',
  },
  {
    id: 'odt-cal-retune-p8z16',
    note: 'p8z16: surround discard+canvas clear #F2F2F0; screenCalWall 1.21 post-ODT',
  },
  {
    id: 'floor-cal-post-odt-p8z17',
    note: 'p8z17: screenCalFloor 1.72 ? ??? ???? ?????? vs IKEA pipette (post-ODT)',
  },
  {
    id: 'floor-warmth-post-odt-p8z18',
    note: 'p8z18: floor albedoSat 0.88 + warm tint 1.06/1/0.86 ? ?????? ????? ??? post-ODT',
  },
  {
    id: 'sharpness-dpr-display-p8z19',
    note: 'p8z19: ikea pixelRatio min 2? + HDR display opaque (discard surround, no blend haze)',
  },
  {
    id: 'hdr-msaa-p8z20',
    note: 'p8z20: HDR float RT samples=4 (canvas MSAA ?? ????????? offscreen pass ? ????? ?? ??????)',
  },
  {
    id: 'hdr-ssaa-p8z21',
    note: 'p8z21: HDR RT MSAA?8 + SS?1.5 ? OOM WebGL context loss (reverted p8z22)',
  },
  {
    id: 'hdr-gpu-safe-p8z22',
    note: 'p8z22: revert MSAA?8??4, SS?1.25, HalfFloat, ikea pr min 1.5 ? fix WebGL context loss',
  },
  {
    id: 'temporal-accum-p8z23',
    note: 'p8z23: IKEA AccumulationBuffer?16 Halton jitter + MSAA?4 resolve ? edge AA (not FXAA/blur)',
  },
  {
    id: 'fxaa-accum-fix-p8z25',
    note: 'p8z25: FXAA at HDR RT + threshold 0.08 + camAnchor after accum?16 (TAA no reset)',
  },
  {
    id: 'taa-motion-gate-p8z26',
    note: 'p8z26: while camera moves (zoom/orbit/damp) ? no Halton jitter, blend=1 current pose only; TAA after settle',
  },
  {
    id: 'msaa-surround-clear-p8z27',
    note: 'p8z27: HDR clear = surround RRT + remove depth hard-cut ? MSAA silhouette AA vs #F2F2F0',
  },
  {
    id: 'fxaa-canvas-p8z28',
    note: 'p8z28: downscale HDR?canvas then FXAA@canvas (threshold 0.05) ? stop re-alias after blit',
  },
  {
    id: 'taa-scene-interaction-p8z29',
    note: 'p8z29: pause TAA during furniture/trim drag+ghost (isDraggingFurniture/isPlacingFurniture/?) ? no ghost trail',
  },
  {
    id: 'cabinet-cal-soft-contact-p8z30',
    note: 'p8z30 REVERTED p8z62: screenCalCabinet 2.35?1 (dump); soft contact note obsolete',
  },
  {
    id: 'taa-door-animation-p8z31',
    note: 'p8z31: pause TAA while door/slide anim (ClodisBuilder.isDoorAnimationActive) ? no door ghost',
  },
  {
    id: 'corpus-umbra-floor-p8z32',
    note: 'p8z32: SPOT_SHADOW_SPOT_FLOOR 0.48?0.32 ? darker shelf/drawer umbra vs washout',
  },
  {
    id: 'wall-cone-stripe-p8z33',
    note: 'REVERTED p8z34 ? was wallCabinetCone/spot?ao hack; not in IKEA dump',
  },
  {
    id: 'ikea-dump-wall-ao-p8z34',
    note: 'p8z34: wall stripe = soft heightmap AO on IBL only; trim layer-4 silhouette; wallCone off',
  },
  {
    id: 'soft-viewport-capture-fit-p8z36',
    note: 'p8z36?p8z45 REVERTED p8z63: capture-fit removed ? Soft viewport = dump 10?10 @ Spot.xz',
  },
  {
    id: 'webgl-crash-guard-p8z37',
    note: 'p8z37: skip incomplete/404 maps (texSubImage2D); NaN soft viewport ? dump 10?10; stop render on context lost',
  },
  {
    id: 'console-spam-p8z38',
    note: 'p8z38: SHELF_COUNT_DEBUG off; DRAWER-W/REBUILD gated; safe clone RT uniforms (UniformsUtils spam)',
  },
  {
    id: 'soft-viewport-capture-cap-p8z39',
    note: 'p8z39: capture-fit max 5 m (not dump 10 m) ? wide cabinet blur was killing nzMax ~0.09',
  },
  {
    id: 'trim-layer2-like-cab-p8z40',
    note: 'p8z40?p8z42: trim soft back to layer4; capture-fit bbox = furniture only (full-wall trim killed nzMax)',
  },
  {
    id: 'soft-viewport-furniture-fit-p8z42',
    note: 'p8z42: soft viewport extent from furniture layer2 (not 5 m trim span); mode capture-fit-furniture',
  },
  {
    id: 'soft-ao-height-denorm-p8z43',
    note: 'p8z43: Soft AO denorm heightmap ? soft.size_y (RT is y/2.74; AO needs metres vs posM.y)',
  },
  {
    id: 'height-capture-furniture-only-p8z44',
    note: 'p8z44: heightmap ortho layer2 only (no trim layer4) ? full-wall plank was inflating nzPixels',
  },
  {
    id: 'soft-viewport-denser-fill-p8z45',
    note: 'p8z45: fill 0.4 ? nzMax~0.82; p8z46: fill 0.3 / min 1.5 m ? balance nzMax vs nzPixels',
  },
  {
    id: 'soft-ao-no-uv-clamp-p8z47',
    note: 'p8z47 REVERTED p8z64: Soft AO clamp + border ao=0 as dump GLSL',
  },
  {
    id: 'ikea-fixture-no-trim-corner-p8z48',
    note: 'p8z48 REVERTED intent: user wanted trim kept; soft on frame=layer4 not delete meshes. p8z49 restore trim+pos',
  },
  {
    id: 'trim-no-soft-cast-p8z50',
    note: 'p8z50: trim softAoSilhouette=false ? frame out of cabinet soft cast; heightmap/stripe from furniture only',
  },
  {
    id: 'wall-getshadow-p8z51',
    note: 'p8z51: wall/frame spotShadowReceive=1 ? IKEA wall stripe via Spot atlas (Soft AO stays IBL-only)',
  },
  {
    id: 'spot-shadow-fov-106-p8z52',
    note: 'p8z52: Spot shadow FOV 170?106 (dump outer aperture) ? 170 crushed wall into map center, no umbra',
  },
  {
    id: 'soft-plane-denorm-p8z53',
    note: 'p8z53: soft plane generate denorm ?size_y (RT is y/2.74); dump 1-exp(-h_m); cabinet floor only',
  },
  {
    id: 'trim-floor-layer5-p8z54',
    note: 'p8z54: trim softFloorCaster layer5; dual soft capture ? floor 2+5, Soft AO walls layer2 only',
  },
  {
    id: 'interior-umbra-p8z55',
    note: 'p8z55: interior getShadow closer IKEA ? spotFloor 0.08, PCF 1.25; wall FOV 106 kept',
  },
  {
    id: 'cabinet-soft-ao-p8z56',
    note: 'p8z56 REVERTED p8z59: Soft AO on corpus made oval shelf-top blobs; cubby = Spot getShadow',
  },
  {
    id: 'revert-cabinet-soft-ao-p8z59',
    note: 'p8z59: Soft AO off corpus (blobs); p8z60: Soft AO back + horiz gate + Spot bias 1/1',
  },
  {
    id: 'interior-soft-horiz-gate-p8z60',
    note: 'p8z60 REVERTED p8z61: Soft AO horiz-gate removed ? dump formula only',
  },
  {
    id: 'clean-soft-ao-horiz-gate-p8z61',
    note: 'p8z61 clean: Soft AO = dump (no |n.y| gate); corpus/back Soft AO kept',
  },
  {
    id: 'clean-screen-cal-cabinet-p8z62',
    note: 'p8z62 clean: screenCalCabinet=1 (dump UBO); empty/wall/floor cal still pipette deviations',
  },
  {
    id: 'clean-soft-viewport-dump-p8z63',
    note: 'p8z63 clean: Soft viewport always dump 10?10 @ Spot.xz ? capture-fit removed',
  },
  {
    id: 'clean-soft-plane-linear-p8z64',
    note: 'p8z64 clean: soft plane ? full linear; contactStrength 1; Soft AO UV clamp+border ao=0 (dump)',
  },
  {
    id: 'corpus-kromka-no-atlas-p8z65',
    note: 'REVERTED p8z66: facing-cam gate failed ? horizontal shelf stripes remain',
  },
  {
    id: 'cabinet-shadow-reset-p8z66',
    note: 'p8z66: cabinet shadow phase 0 ? no getShadow/Soft AO on corpus/back/facade; room layers unchanged',
  },
  {
    id: 'cabinet-shadow-phase1-p8z67',
    note: 'REVERTED p8z68: cab phase 1 getShadow ? PCF stripes on shelf tops; fix atlas before re-enable',
  },
  {
    id: 'cabinet-shadow-rollback-p8z68',
    note: 'p8z68: cab phase back to 0 ? IBL+Spot direct; room phase 7 unchanged',
  },
  {
    id: 'atlas-bias-casters-p8z69',
    note: 'REVERTED p8z71: thin-horiz cast filter removed; instance casters (isCabinetModel|isFurniture)',
  },
  {
    id: 'instance-casters-p8z71',
    note: 'p8z71: cast keyed to catalog GLB root (IKEA SceneAssetInstance); cab phase 0; bias 3/8000 live dump',
  },
  {
    id: 'cab-phase1-getshadow-glsl-p8z72',
    note: 'p8z72 cab phase 1: getShadow 3-tap+rotation (DEy_Xiep); receive corpus/back; ACTIVE_SHADOW_LIGHTS',
  },
  {
    id: 'cab-phase2-soft-ao-p8z73',
    note: 'p8z73 cab phase 2: Soft AO IBL corpus/back ? dump ENABLE_SOFT 010/003; shelf-side contact stripe',
  },
  {
    id: 'spot-shadow-instance-pass-p8z74',
    note: 'p8z74: depth atlas per SceneAssetInstance ? frame shell vs 1-mesh shelf; Module/shelf/drawer boundary',
  },
  {
    id: 'spot-shadow-cull-upward-p8z75',
    note: 'REVERTED p8z76: normal cull broke depth atlas ? getShadow=1; no upward cull in dump',
  },
  {
    id: 'cab-phase2-hold-p8z76',
    note: 'p8z76: cab shadow phase back to 1 (getShadow only) until IKEA interior dump separates atlas vs Soft AO',
  },
  {
    id: 'cab-interior-spot-p8z88',
    note: 'p8z88: phase 1 getShadow; height capture filtered for future phase 2; probe nzPixels 1200?1850',
  },
  {
    id: 'spot-casters-ikea-v4-p8z77',
    note: 'p8z77: atlas casters ? frame _core corpus/back only; 1 mesh/shelf instance; target spotCastInstances ? 9?15 (IKEA v4 dump)',
  },
  {
    id: 'interior-umbra-dump-p8z57',
    note: 'p8z57?p8z58: spotFloor 0; PCF 1; depth bias (mm) ? open after clean',
  },
  {
    id: 'spot-shadow-compare-tex',
    note: 'DepthTexture LEQUAL + sampler2DShadow + dump 3-tap rotation PCF (not 9-tap Poisson)',
  },
]);

export function getIkeaV0CurrentPhase() {
  return IKEA_V0_ACTIVE_PHASE;
}

export function auditIkeaV0Manifest() {
  const phase = IKEA_V0_PHASES.find((p) => p.id === IKEA_V0_ACTIVE_PHASE);
  return {
    ok: true,
    schema: IKEA_V0_MANIFEST_SCHEMA,
    cacheBust: IKEA_V0_CACHE_BUST,
    activePhase: IKEA_V0_ACTIVE_PHASE,
    phaseLabel: phase?.label ?? null,
    phases: IKEA_V0_PHASES,
    runbook: IKEA_V0_RUNBOOK,
    dumpOrder: 'C?A?B (Spot ? soft plane ? soft AO on IBL)',
    deviations: IKEA_V0_DEVIATIONS,
    cabinetLight: 'ikea-r2-phase7-full-dump',
  };
}
