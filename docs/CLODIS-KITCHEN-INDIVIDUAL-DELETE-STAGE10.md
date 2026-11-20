# CLODIS — этап 10. Индивидуальное удаление кухонных модулей

**Дата:** 2026-10-30  
**Bust:** `20261030-indivdel10`  
**Режим:** минимальный патч по аудиту `CLODIS-KITCHEN-MODULE-EDIT-DELETE-AUDIT.md`  
**Принцип:** один модуль — один объект редактирования — один объект удаления.

---

## 1. Что сделано

1. **`deleteSelectedFurniture(explicitGroup?)`** (`js/furniture/furniture-manager.js`)
   - Явная группа с карандаша / иначе selection.
   - `removeSectionZoneEditIcon(sectionId, zoneIndex, deletedUuid)` — не сносит все карандаши зоны.
   - После remove: `rebuildSectionZoneEditIconsForSection(sectionId)` для оставшихся модулей.
   - Dirty: `__cldMarkRoomDraftDirty('furniture_delete')` только после успешного удаления.
   - Возвращает `boolean`.

2. **Popup «Настройка модуля»** (`js/ui/scene-icons.js`)
   - Больше не делает свой `scene.remove` / wipe карандашей зоны.
   - `findFurnitureInZone` (uuid карандаша) → `window.__clodisDeleteSelectedFurniture(targetFurniture)`.

3. Cache bust на цепочке delete / icons: `indivdel10`.

---

## 2. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `js/furniture/furniture-manager.js` | единый delete + uuid + rebuild + dirty |
| `js/ui/scene-icons.js` | popup → `__clodisDeleteSelectedFurniture(group)` |
| `js/furniture/furniture-actions.js` | import bust |
| `js/main-refactored.js` | bust icons / actions |
| `js/core/init.js` | bust scene-icons |
| `js/ui/room-steps.js` | bust furniture-manager |
| `index.html` / `public/index.html` | `20261030-indivdel10` |

**Не трогали:** Kitchen Brain, WallRun, ClodisBuilder, rhythm, геометрию, высоты/глубины, CFRN, place, структуру fixture.

---

## 3. Проверки (приёмка в браузере)

Открыть: `http://localhost:8100/?v=20261030-indivdel10` (Ctrl+F5).

| # | Сценарий | Ожидание | Статус |
|---|----------|----------|--------|
| A | Ячейка НМ+НШ1+НШ2 → удалить НМ | НШ1/НШ2 + оба карандаша | **ручная** |
| B | Удалить НШ1 | НМ+НШ2 + карандаши | **ручная** |
| C | Удалить все три через карандаши | по одному; dirty/`furniture_delete` каждый раз | **ручная** |
| D | F5 → Продолжить | удалённые не вернулись | **ручная** |
| E | Delete в другой ячейке | соседи не затронуты | **ручная** |

Код-проверка: `node --check` на patched JS — OK. Логи: `[DELETE] deleteSelectedFurniture called` с `explicit: true` из попапа.

---

## 4. Риски

- Двойные instance ES-module по разным `?v=` у старых импортов — карандаши живут на `window.sectionZoneEditIcons`, delete ходит через `window.__clodisDeleteSelectedFurniture`; критичные busts выровнены.
- `rebuild` после uuid-remove может кратко мигать иконками — без дублей (rebuild сначала чистит секцию).
- Если `__clodisDeleteSelectedFurniture` ещё не навешан (очень ранний клик) — popup abort + warn, без silent half-delete.

---

## 5. Связь с этапом 9

Любой UI-delete идёт в `deleteSelectedFurniture` → dirty `furniture_delete` → allow empty overwrite при намеренно пустой кухне.
