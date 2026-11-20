# CLODIS — результат: глубина НШ1 / НШ2 (этап 2)

**Дата:** 2026-10-30  
**Опора:** `docs/CLODIS-KITCHEN-WALL-MODULES-AUDIT.md`  
**Открыть комнату с bust:** `?v=20261030-walldepth1` (или жёсткий reload после pull).

---

## Часть А — проверка до изменения (подтверждено кодом)

| Вопрос | Факт |
|--------|------|
| Путь НШ1/НШ2 в карточке | `applyModuleDepthCm` (`scene-icons.js`) после веток пенал/НМ → **не** попадали в dedicated rebuild |
| Scale? | **Да** — хвост «Шкаф в нише: uniform-scale» (~4272+) |
| API TOP | **Есть** `rebuildWallTopForCellDepthMm` / `applyKitchenWallTopDepthForGroup` |
| API MID | **Не было** отдельного rebuild до этого этапа |
| ВМУ | Исключён из фикса (не трогали) |
| shallow/deep | Формулы `resolveKitchenWallTopDepthMm` не менялись; ручная глубина из карточки пишет `custom` + `userLocked` + `anchor: 'back'` |

Расхождений с аудитом по scale-пути **не обнаружено**.

---

## Часть Б — что изменено

### Файлы

| Файл | Изменение |
|------|-----------|
| `js/kitchen/kitchen-base-engine.js` | `rebuildWallMidForCellDepthMm`; joint reposition после TOP rebuild; export mid/top detectors; build `20261030-walldepth1` |
| `js/ui/scene-icons.js` | В `applyModuleDepthCm`: ветки НШ2 → `rebuildWallTopForCellDepthMm` (custom, back, locked); НШ1 → `rebuildWallMidForCellDepthMm`; ВМУ не входит |
| `js/main-refactored.js`, `js/core/init.js`, `js/furniture/furniture-manager.js`, `js/sections/section-manager.js`, `js/kitchen/kitchen-section-engine.js` | bust `?v=20261030-walldepth1` на импортах engine/icons |

### Поведение после

1. НШ1: карандаш глубины → parametric Z (200…450), зад к стене (`alignBackToWall`), без `group.scale`.  
2. НШ2: то же через существующий TOP rebuild; stamps `custom` + lock, чтобы place не откатил shallow/deep default.  
3. Якорь **back** (стена), не front — согласовано с «привязка к стене».  
4. После rebuild: `__cldRepositionJointSchemeFurniture` (как у НМ).  
5. Нижние / НМУ / столешка / пенал / шкафной scale-хвост — **не** в новых ветках (гарды mid/top/corner).

### Не менялось

UI карточки, shallow/deep resolve, ВМУ, крепёж/петли алгоритмы, формулы НМ, глобальные константы 40/10.

---

## Часть В — тесты

### Реально выполнено

| Тест | Результат |
|------|-----------|
| Static: путь scale до фикса | Подтверждён чтением `applyModuleDepthCm` |
| После reload: `window.__cldKitchenBaseEngineBuild === '20261030-walldepth1'` | **Да** (Runtime.evaluate) |
| `typeof rebuildWallMidForCellDepthMm` / `rebuildWallTopForCellDepthMm` | **`function`** |
| Place НШ1 350→300→350 на сцене | **Не выполнено** (комната без секций/модулей; размещение меняло бы проект) |
| НШ2 shallow / deep над пеналом | **Не выполнено** (нет живого пирога) |
| Scale=1 после карандаша | **Не выполнено** |
| Детали / фасады / joint / hinge визуально | **Не выполнено** |
| Save/load / CFRN | **Не выполнено** |
| Регрессия НМ / НМУ / столешка | **Не выполнено** на сцене (код-гарды только) |

### Чеклист для приёмки пользователем

1. Hard reload `?v=20261030-walldepth1`.  
2. Консоль: `__cldKitchenBaseEngineBuild` → `20261030-walldepth1`, есть `rebuildWallMidForCellDepthMm`.  
3. НШ1: карандаш D 350→300→350; `group.scale` ≈ (1,1,1); зад у стены; детали пересобраны.  
4. НШ2 shallow: смена D; `ud.__kitchenTopDepthMode === 'custom'`, `userLocked`; зад у стены.  
5. НШ2 deep над пеналом: без карандаша — deep как раньше; после карандаша — custom lock.  
6. НМ карандаш глубины / столешка — без регрессии.  
7. Save → reload: D и TOP custom stamps.  
8. CFRN: размеры панелей = новая D.

---

## Риски

1. Ручная D на TOP переводит модуль в **custom+lock** — auto-sync deep от пенала больше не перезапишет, пока lock не снять (отдельный этап).  
2. MID диапазон жёстко 200…450 — вне диапазона карточка получит fail (как place).  
3. E2E / CFRN / регрессия низа **не прогнаны агентом** — приёмка только после ручных пунктов выше.  
4. Несколько entry `?v=` на base-engine в репо ещё со старыми метками (depth-stack и др.) — критичный путь main/init/furniture обновлён; при странном кэше — hard reload.

---

## Вердикт этапа

| | |
|--|--|
| Можно принимать код как кандидат | **Да**, после ручного чеклиста |
| Автоматически «готово в проде» | **Нет** — нет живых тестов модулей |
| Откат к копии | Если после reload карандаш НШ всё ещё scale или ломает НМ — вернуть копию и сообщить |

**Минимальный критерий зелёной приёмки:** пункты 1–3 и 6 чеклиста = да.
