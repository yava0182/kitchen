# CLODIS — этап 9. Безопасное сохранение пустой кухни

**Дата:** 2026-10-30  
**Bust:** `20261030-empty9`  
**Режим:** аудит → минимальный патч (безопасность подтверждена по коду)

---

## 1. Причина проблемы

`saveRoomDraft` блокирует запись, если:

- incoming fixture **структурно пуст** (`sections.length === 0` && `furniture.length === 0`);
- в LS уже лежит **непустой** draft;
- нет `forceEmpty`.

После `furniture_delete` / `sections_clear` сцена может стать пустой → dirty ставится → flush получает `empty_overwrite_blocked` → dirty сбрасывается **без** «Проект сохранён» → F5 поднимает **старую** кухню.

`phase === editing` **нельзя** считать доказательством намерения: во время editing возможен и сбой collect / краткий пустой кадр.

---

## 2. Механизм различения (безопасный)

| Сигнал | Смысл |
|--------|--------|
| Dirty reason ∈ `{ furniture_delete, sections_clear }` | Пользователь завершил удаление структуры |
| Session-флаг `allowEmptyOverwrite` | Выставляется **только** этими reason при `canAutosave()` |
| `saveRoomDraft({ allowEmpty: true })` | Единственный путь обойти guard (кроме `forceEmpty`) |
| Поле fixture `intentionallyEmpty: true` | Пишется при пустом save с allow / force / если уже было в existing |
| `isContinuableRoomDraft` | `intentionallyEmpty` → Continue без мебели |
| Restore `ok` | пустой continuable draft ≠ ошибка |

**Не** ослабляется:

- boot / awaiting_choice / restoring — `canAutosave()` false → флаг не ставится, autosave не пишет;
- ошибочный пустой collect без allow → по-прежнему `empty_overwrite_blocked`;
- `collect_threw` → save не пишет, toast ошибки, draft не трогаем;
- «Начать новый» — backup через `isContinuableRoomDraft` (включая intentional empty) → prev key.

---

## 3. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `js/room/room-draft-autosave.js` | allowlist reason → `allowEmptyOverwrite`; flush передаёт `allowEmpty`; сброс флага после ok / New / Continue |
| `js/furniture/ikea-room-fixture.js` | `saveRoomDraft` allowEmpty + `intentionallyEmpty`; continuable; restore ok для пустого continuable; collect throw → не пишем |
| `js/main-refactored.js` | bust |
| `index.html` | bust `20261030-empty9` |
| `docs/CLODIS-EMPTY-PROJECT-AUTOSAVE-STAGE9.md` | отчёт |

Ядро / Rhythm / Brain / WallRun / depth / CFRN / свет — **не трогались**.

---

## 4. Тесты

| Проверка | Результат |
|----------|-----------|
| Node: block without allow / allow with flag / intentional continuable | PASS |
| Код: dirty reasons только delete/clear | PASS |
| Live: последний шкаф → save toast → F5 → Continue пусто | **ручной** |
| Live: clear all sections → save → F5 → Continue | **ручной** |
| Live: пусто → опоры 120 → save → Continue 120 | **ручной** |
| Boot не затирает non-empty draft | **код** (phase) + **ручной** smoke |
| «Начать новый» → prev backup | **ручной** |

---

## 5. Оставшиеся риски

| Риск | Комментарий |
|------|-------------|
| Orphan furniture после `sections_clear` | Секции пусты, мебель на сцене → fixture не empty; guard не нужен |
| Только пустые секции, 0 мебели | Не empty по guard (есть sections) — save и так шёл |
| Чужой код вызовет `saveRoomDraft({ allowEmpty: true })` | API внутренний; риск низкий |
| Нет dirty на «удалить одну секцию» (если появится UI) | Пока clear — `sections_clear`; точечный delete — проверить отдельно |

---

## 6. Чеклист приёмки

- [ ] Bust `20261030-empty9`  
- [ ] Удалить всё → «Проект сохранён» → F5 → Continue → без модулей/секций  
- [ ] После очистки сменить опоры → save → Continue с настройками  
- [ ] Обычная кухня с модулями по-прежнему Continue ок  
