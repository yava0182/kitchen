# IKEA — вытащить пробелы (сейчас)

**Файл скрипта:** `docs/IKEA-dump-missing-now.js`

## Зачем

| Поле в JSON | Зачем нам |
|-------------|-----------|
| `liveLights` | Доказать: только Spot, без Hemi |
| `spotPhysical.candela` / `lumen` / `intensityMode` | Калибровка Spot в Three |
| `soft.blurHits` (особенно `scale`) | Мягкость тени на полу |
| `post.imageProcessing.exposure` / `lut` | Яркость картинки |
| `env.fromSettings` | Проверка 0.6 / 80° |
| `follow.deltaXZ` | Spot ≡ SoftShadow center |

## Как

1. Открыть [IKEA PAX planner](https://www.ikea.com/) → комната → **белый шкаф**.
2. F12 → вкладка **Console**.
3. Открыть файл `IKEA-dump-missing-now.js`, скопировать **весь** текст.
4. Вставить в Console → Enter.
5. Должно быть: `→ скопировано — вставьте JSON в чат`.
6. Прислать JSON сюда (Ctrl+V).

Если `err: no core` — подождать загрузки 3D, кликнуть по шкафу, повторить.
