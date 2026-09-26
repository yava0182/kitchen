# IKEA → Clodis: один мир (план порта)

Источник фактов: `IKEA-Betrakta-lighting-SoT.md` (live console, 2026-08-24/25).  
Не факты — помечены **ПРОБЕЛ** / **калибровка**.

Цель: картинка как PAX (ровные кромки, мягкий контакт, белый корпус на серой стене) в **нашем Three.js**, без двух миров layer0/layer1.

---

## 1. Архитектура IKEA (факт)

```
Один scene / один PBR pipeline
  ├─ комната: GLB + Betrakta ShaderMaterial + тот же env
  ├─ мебель: тот же ShaderMaterial + тот же env
  ├─ punctual day: Spot MAIN (тени) [+ Dir в settings, live часто только Spot]
  ├─ SoftShadowRenderer: heightmap 80², size ~10×2.74×10 м, center = решение
  ├─ Spot.xz ≡ SoftShadow.center.xz (Δ=0), follow через updateMainLightPosition
  ├─ SSAO day screen: OFF
  └─ post: HDR framebuffer, exposure 2, deferred tonemap + LUT
```

**Нет:** lightmaps на корпусе/стенах; MeshBasic-комнаты; отдельного «studio слоя» для шкафа.

---

## 2. Сопоставление: IKEA ↔ сейчас ↔ цель

| Слой | IKEA (факт) | Сейчас у нас | Цель порта |
|------|-------------|--------------|------------|
| Миры | 1 | 2 (room Basic L0 + cabinet studio L1) | **1** |
| Комната | PBR + env 0.6 | MeshBasic + corner shader | lit (Standard/Physical) + **тот же** env/Spot |
| Мебель | PBR + env | Physical + studio lights L1 | тот же Spot/env, без отдельного L1 |
| Контакт пол/стены | SoftShadow heightmap | bbox-полоски + soft plane | **один** SoftShadow-pass |
| Глубина внутри шкафа | Spot shadow 4K | Spot shadow L1 | Spot shadow в общем мире |
| Зубцы на фасадах | нет (другой shadow/AA pipeline) | shadow map / post без MSAA | Soft contact + MSAA; фасады не «режутся» PCF |
| Env | `.env` lowsat, rot 80°, local box 7.5³ | zenith PMREM / старый HDR | клон/тот же env + intensity ~0.6 |
| Follow света | `updateMainLightPosition` | `syncCabinetMainLightFollow` (есть) | оставить, якорь = решение |

---

## 3. Что уже снято (достаточно для старта)

- Spot: 115 (Betrakta lumen-scale), CCT 6300, pos (0,5,2) м, dir down, 65°/106°, shadow 4096, near 0.5 far 6
- SoftShadow: res 80, intensity 1, center (0,1.3,2), size (10,2.74,10)
- Env URL + intensity 0.6 + rotation 80° + localMode
- Ambient live intensity 0; Dir в settings 3 @ (1,6,3); Point off
- Day SSAO screen = false
- Room materials = GLB urls (не hex Basic)
- Lightmaps = 0

---

## 4. ПРОБЕЛЫ (без них — «будем думать», не угадывать)

**Снято 2026-08-25 (скрин пользователя):** SoftShadow = depth → blur → shadow-plane texture; res 80; size 10×2.74×10; center≡Spot.xz; day SSAO/TAA screen off; Spot 115 / (0,5,z) down.

| # | Статус | Что ещё нужно | Зачем |
|---|--------|---------------|--------|
| P1 | частично | как plane текстура модулирует **стену** (не только пол) | трапеция L+R |
| P2b | открыт | blur kernel / radius у `_blur_effect` | сила мягкости |
| P3 | открыт | стены: Spot SM или только SoftShadow | не вернуть зубцы |
| P4–P5 | **закрыт** | стена paint 0.75 / корпус 010_White 0.35 | в SoT + v70 |
| P6 | частично | MSAA samples (TAA=false) | кромки |
| P7–P8 | открыт | LUT; единицы Spot 115 | финальный тон |

**Можно стартовать в код без P2b/P4:** Phase 1 (один Spot+env) + каркас SoftShadow-pass (ortho depth 80, blur, plane на пол).  
**Нельзя закрывать «как IKEA» без P1/P3** для стены.

---

## 5. Рефакторинг (граммотный, fix-forward)

Не «с нуля Room», а смена архитектуры света/материалов по фазам. Бизнес-логику секций/петель **не трогаем**.

### Phase 0 — SoT gaps
Снято 2026-08-25 (свет + SoftShadow + PBR стены/корпус). LUT url / blur scale — калибровка.

### Phase 1 — DONE 2026-08-25 (`?v=20260824-volume70`)
- SoftShadow floor: silhouette 80² → blur → plane (`room-soft-shadow.js`)
- Spot follow + lights layer 0+1; corpusRough 0.35; env 0.6 (`ikea-v70`)
- Стены paint `#f0efe4` (`ikea-sot2`); MeshBasic пока (lit walls = Phase 2)

### Phase 1b / 2 — комната lit (след.)
- Spot MAIN + follow на **все** lit-материалы (комната + мебель).
- Env PMREM общий (скачать/кэшировать IKEA `.env` или эквивалент lowsat).
- Выключить отдельный layer-1 studio как источник «второго мира» (оставить временно только если нужно для A/B).
- **Не** включать shadow map шкафа→MeshBasic стены.

### Phase 2 — комната lit
- Стены/пол: Standard/Physical (или близкий unlit→lit), `receiveShadow` **только** по факту P3.
- Убрать конкурирующие corner-only костыли, которые дублируют SoftShadow.

### Phase 3 — SoftShadow pass (ядро контакта)
- Ortho top-down heightmap ~80–128, volume size как SoT (масштаб мм).
- Blur → modulate floor + **inner walls** (трапеция L+R).
- Удалить bbox-strip / foot-plane как основной контакт (оставить fallback до паритета).

### Phase 4 — анти-зубцы
- MSAA×4 на сцене; фасады: не receive coarse shadow в щелях (или bias/normalBias по SoT).
- Spot shadow только для глубины **внутри** корпуса, не как «полоса на стене».

### Phase 5 — тон / LUT / exposure
- Exposure + опционально LUT; калибровка Spot intensity по кадру, не копировать 115 1:1.

---

## 6. Риски (обязательный блок)

**Задача:** один мир света как Betrakta в Three.js.

**Затрагиваем:** `Room.js` материалы, `room-cabinet-studio.js`, wall/floor shadow modules, `renderer.js` / composer, presets.

**Может измениться:** яркость пустой комнаты, тени у шкафа, выглядеть «серее/белее» до калибровки Phase 5.

**Не трогаем:** размещение секций, ClodisBuilder, петли, Open/Close, каталог JSON, админку.

**Проверить после каждой фазы:** Ctrl+F5 → пустая комната → шкаф у стены без двери → контакт L+R + пол; кромки фасадов без зубцов.

---

## 7. Сниппет съёма пробелов (вставить в консоль PAX)

```js
(() => {
  const find = (o, pred, d=0) => {
    if (!o || d>12) return null;
    try { if (pred(o)) return o; } catch {}
    if (typeof o !== 'object') return null;
    for (const k of Object.keys(o)) {
      try {
        const v = o[k];
        if (v && typeof v === 'object') {
          const r = find(v, pred, d+1);
          if (r) return r;
        }
      } catch {}
    }
    return null;
  };
  // подставьте viewer из React fiber / window как раньше
  const v = window.__betraktaViewer || window.betraktaViewer;
  const lm = v?.light_manager || v?.lights;
  const soft = lm?.soft_shadows || lm?.softShadow || find(lm, x => x?.get_blurred_heightmap || x?.constructor?.name === 'SoftShadowRenderer');
  const spot = (lm?.get_punctual_lights?.() || [])[0];
  const out = {
    soft: soft && {
      name: soft.constructor?.name,
      keys: Object.keys(soft).slice(0, 80),
      intensity: soft.intensity ?? soft._intensity,
      resolution: soft.resolution ?? soft._resolution,
      center: soft.center || soft._center,
      size: soft.size || soft._size,
      blur: soft.blur ?? soft._blur ?? soft.blur_radius,
    },
    spotShadows: spot && {
      enableShadows: spot.enableShadows ?? spot._enable_shadows,
      shadowMapSize: spot.shadowResolution || spot._shadow_resolution,
    },
    renderSettings: lm?.renderSettings || v?.lights?.renderSettings || null,
  };
  console.log(JSON.stringify(out, null, 2));
  copy?.(JSON.stringify(out));
  return out;
})();
```

Дополнительно вручную: любой белый mesh шкафа → `material` baseColor/roughness; стена → то же; `engine.getCaps` / samples если есть.

---

## 8. Правило

Нет факта в SoT → не кодируем «похоже».  
Пишем **ПРОБЕЛ**, снимаем, потом порт.
