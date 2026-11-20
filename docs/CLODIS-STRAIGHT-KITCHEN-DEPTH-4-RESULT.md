# CLODIS — прямая кухня. DEPTH-4 результат (НШ1 / НШ2)

**Дата:** 2026-10-30  
**Bust:** `?v=20261030-depth4`  
**Опора:** DEPTH-3b (`rearOffsetMm` + flush `targetBack`) + `rebuildWallMid*` / `rebuildWallTop*`

---

## 1. Что уже работало

| Механизм | Статус |
|----------|--------|
| `rebuildWallMidForCellDepthMm` | parametric D 200…450, `alignBackToWall` |
| `rebuildWallTopForCellDepthMm` | parametric D 200…700; shallow/deep/custom |
| TOP pencil → `custom` + `userLocked: true` | есть (walldepth1) |
| `syncKitchenWallTopDepthFromTallInZone` | пропускает `userLocked` / `custom` |
| `rearOffsetMm` + `__cldSetKitchenModuleOffsetsMm` | есть |
| Flush enforce: `targetBack = wall + rearOffsetMm` | DEPTH-3b — **уже для пенала и НШ** |
| НШ1 не следует за Dwt / пеналом | да (отдельный rebuild) |

Не хватало: полей «Отступ от стены» в карандаше НШ1/НШ2 и общего apply для flush (был только пенал).

---

## 2. Что исправлено / добавлено

1. Карандаш **НШ1** и **НШ2**: «Глубина корпуса» + «Отступ от стены» (тот же `rearOffsetMm`).
2. `applyFlushModuleWallOffsetMm` — rigid сдвиг для пенал/НШ1/НШ2; **не** ставит `userLocked` на TOP.
3. Смена только отступа не блокирует auto deep от пенала.
4. Смена глубины НШ2 по-прежнему → `custom` + `userLocked`.
5. Mid/top rebuild логируют `rearOffsetMm` (сохраняется через `alignBackToWall` → enforce).
6. DEPTH-3 пеналы / низы / auto-Dwt — не ломались.

Живая сцена в этом запуске **не** гонялась (как DEPTH-2/3).

---

## 3. Файлы

| Файл | Зачем |
|------|--------|
| `js/ui/scene-icons.js` | UI mid/top + `applyFlushModuleWallOffsetMm` |
| `js/kitchen/kitchen-base-engine.js` | log rearOffset mid/top; build `depth4` |
| `js/kitchen/kitchen-depth-stack.js` | комментарий flush DEPTH-4 |
| `js/main-refactored.js`, `js/core/init.js`, `js/furniture/furniture-manager.js`, `js/sections/section-manager.js`, `js/kitchen/kitchen-section-engine.js` | bust `depth4` |
| `scripts/check-straight-kitchen-depth4.mjs` | чекер |
| `docs/CLODIS-STRAIGHT-KITCHEN-DEPTH-4-RESULT.md` | отчёт |

---

## 4. Проверки

```
node scripts/check-straight-kitchen-depth4.mjs → PASS
node scripts/check-straight-kitchen-depth3.mjs → PASS (обновлён под shared field)
```

| Сценарий | Как |
|----------|-----|
| НШ1 350→300, offset 0→50 | static формулы + pins UI/API |
| НШ2 350→460, offset 0→100 | static |
| Независимость D / offset | pins: offset apply ≠ userLocked; depth TOP = lock |
| userLocked TOP | static: pencil depth sets lock; sync skips lock |
| Регресс DEPTH-3 | static: no tall auto from Dwt; flush targetBack |
| Live bbox / scale | **не выполнено** |

---

## 5. Приёмка в браузере

Hard reload: `http://localhost:8100/?v=20261030-depth4`

1. `__cldKitchenBaseEngineBuild === '20261030-depth4'`
2. НШ1: D 35→30 см; отступ 0→50 → щель ~50 мм; scale≈1; W/H без изменений.
3. НШ2: D 35→46 см → `userLocked`; отступ 100 мм → сдвиг без сброса lock/mode.
4. Отступ НШ2 при unlocked deep: смена D пенала всё ещё может sync TOP depth; offset НШ2 сохраняется.
5. Пенал DEPTH-3: отступ 100 при D=460 → перед ≈560 — без регресса.

---

## Вывод

Отступ НШ1/НШ2 — тот же `rearOffsetMm` / flush enforce. Добавлен только карандаш + общий apply. Auto sync TOP←tall и userLocked сохранены.

**СТОП.**
