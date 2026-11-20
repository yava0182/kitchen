# CLODIS — прямая кухня. DEPTH-3 результат

**Дата:** 2026-10-30  
**Bust:** `?v=20261030-depth3b`  
**Опора:** DEPTH-2 + существующие `rearOffsetMm` / `__cldSetKitchenModuleOffsetsMm`

### Fix depth3b (приёмка)

Поле «Отступ от стены» было, но пенал не уезжал: stamp мог писаться без гарантированного enforce, а для flush-группы сдвиг шёл вторым шагом.

- Пенал: `targetBack = wall + rearOffsetMm` в `enforceKitchenDepthStackOnModule` (без двойного сдвига).
- Карандаш: stamp + `__cldSetKitchenModuleOffsetsMm` + проверка `wallGapMm ≈ offset`.
- Bust depth-stack / scene-icons → `depth3b`.

---

## 1. Что сделано

### 1.1 Откат ошибочной зависимости DEPTH-2

Удалены `syncTallDepthAfterWorktopOnWall` и его вызов из `applyWorktopDepthOnWall`.

Смена глубины столешницы (Dwt) **больше не меняет** глубину пенала.  
Сохранены: parametric rebuild пенала по карандашу, sync TOP←tall при смене глубины пенала (`syncKitchenWallTopDepthFromTallInZone`, с учётом `userLocked`).

### 1.2 Два независимых параметра пенала

| Параметр (логика) | Stamp / API | Поведение |
|-------------------|-------------|-----------|
| `depthMm` | `__kitchenCarcassDepthMm` / `customDepthMm` | `rebuildTallForCellDepthMm` — геометрия Z; **не** трогает offset |
| `wallOffsetMm` | существующий **`rearOffsetMm`** | `__cldSetKitchenModuleOffsetsMm` → enforce: flush к стене, затем rigid shift; **без** rebuild / scale |

Новый stamp `wallOffsetMm` **не** вводился — использован канон depth-stack.

Формула передней плоскости: **перед = wallOffset + depth** (от стены).

| Пример | Перед |
|--------|-------|
| D=460, offset=0 | 460 |
| D=460, offset=100 | 560 (= перед НМ при Dwt=600) |
| D=560, offset=0 | 560 |

Для всех прямых стен: `kitchenIntoRoomSign` + `shiftGroupAlongDepth` (как раньше).

### 1.3 Карандаш

В том же модале пенала:

- «Глубина корпуса» (см) — бывшая «Глубина пенала»
- «Отступ от стены» (мм) — `rearOffsetMm`, default **0** для существующих

---

## 2. Изменённые файлы

| Файл | Зачем |
|------|--------|
| `js/kitchen/kitchen-base-engine.js` | убран auto tall sync от Dwt; build `depth3`; log `rearOffsetMm` после tall rebuild |
| `js/ui/scene-icons.js` | UI + `applyTallWallOffsetMm` через `__cldSetKitchenModuleOffsetsMm` |
| `js/main-refactored.js`, `js/core/init.js`, `js/furniture/furniture-manager.js`, `js/sections/section-manager.js`, `js/kitchen/kitchen-section-engine.js` | bust `depth3` |
| `scripts/check-straight-kitchen-depth3.mjs` | чекер |
| `scripts/check-straight-kitchen-depth2.mjs` | обновлён под DEPTH-3 |
| `docs/CLODIS-STRAIGHT-KITCHEN-DEPTH-3-RESULT.md` | отчёт |

Не трогались: L/U, Joint, Brain, WallRun, НШ1/НШ2 правила глубины, низы 460/510/550, autosave, свет/материалы.

---

## 3. Проверки

```
node scripts/check-straight-kitchen-depth3.mjs → PASS
node scripts/check-straight-kitchen-depth2.mjs → PASS
```

Live e2e на сцене в этом запуске **не** выполнялся (как в DEPTH-2: без загруженной кухни).

---

## 4. Приёмка в браузере

Hard reload: `http://localhost:8100/?v=20261030-depth3`

1. `__cldKitchenBaseEngineBuild === '20261030-depth3'`
2. Пенал карандаш: два поля — глубина корпуса и отступ от стены (0 по умолчанию).
3. D=46 см, отступ=0 → перед ближе к стене, чем у НМ (560).
4. Отступ=100 мм при D=460 → перед ≈ 560, стык с НМ; `group.scale ≈ (1,1,1)`; W/H без изменений.
5. Смена только глубины корпуса → отступ тот же; только отступа → D без rebuild (позиция).
6. Смена столешницы Dwt → глубина пенала **не** прыгает.
7. Смена глубины пенала → deep TOP без lock по-прежнему может наследовать D (как раньше).

---

## Вывод

DEPTH-2 auto-sync пенала от Dwt снят. Глубина и отступ пенала независимы через уже существующий `rearOffsetMm`.  

**СТОП.**
