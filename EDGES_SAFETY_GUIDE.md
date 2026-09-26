# Безопасная работа с кромками в панели свойств

## Что ломалось в прошлый раз

При сворачивании кромок и добавлении информации в поля проект переставал работать. Основные причины:

1. **Полная перезапись `nodeData.edges`** в `saveConstructorNodeData` — все поля, не участвующие в цикле сохранения, терялись.
2. **Разрыв цепочки данных** — collapse-состояние или доп. поля не сохранялись и не восстанавливались.
3. **Отсутствие защитных проверок** — при чтении из DOM возможны `undefined`/`null`, которые портили структуру.

---

## Критичная структура данных

```javascript
nodeData.edges = {
  1: { enabled, thickness, type, type_name, decor_id, decor_name, color, icon },
  2: { ... },
  3: { ... },
  4: { ... }
}
```

**constructor-clodis.js** ожидает: `edges[edgeNum].enabled`, `thickness`, `decor_id`, `decor_name`, `edge_id`, `edge_name`.

---

## Правила при добавлении сворачивания и доп. полей

### 1. Сохранение — сохранять все, не затирать лишнее

```javascript
// ❌ ПЛОХО — теряем color, icon и любые новые поля
node.nodeData.edges[i] = {
  enabled: edgeCheckbox?.checked || false,
  thickness: edgeThickness?.value || '0.2',
  // ...
};

// ✅ ХОРОШО — мержим с prev, сохраняем неизвестные поля
const prev = prevEdges[i] || {};
node.nodeData.edges[i] = {
  ...prev,
  enabled: edgeCheckbox?.checked ?? prev.enabled ?? false,
  thickness: edgeThickness?.value ?? prev.thickness ?? '0.2',
  type: edgeType?.value ?? prev.type ?? 'butts',
  type_name: typeName || prev.type_name,
  decor_id: edgeDecorId?.value ?? prev.decor_id ?? '',
  decor_name: edgeDecorName?.value ?? prev.decor_name ?? ''
  // color, icon, collapsed и др. — приходят из prev
};
```

### 2. Состояние collapse — хранить отдельно от данных кромки

```javascript
// Вариант A: в nodeData, но не в edges
node.nodeData.edges_ui = node.nodeData.edges_ui || {};
node.nodeData.edges_ui[`edge_${i}_collapsed`] = ...;

// Вариант B: в data-атрибутах контейнера (не уходит в tree/JSON)
edgeDetailsDiv.dataset.collapsed = 'true';
```

Если collapse только для UI — лучше не сериализовать в `nodeData`, чтобы не трогать tree/JSON.

### 3. Добавление полей — всегда с fallback при чтении

```javascript
// ❌ ПЛОХО
const val = edgeData.myNewField;

// ✅ ХОРОШО
const val = edgeData?.myNewField ?? defaultValue;
```

### 4. Чтение из DOM — проверять наличие элементов

```javascript
const el = document.getElementById(`catalog-constructor-property-edge-${i}-x`);
if (el) el.value = edgeData?.x ?? '';
```

### 5. Консистентность ID — использовать один шаблон

- `catalog-constructor-property-edge-${i}` — чекбокс
- `catalog-constructor-property-edge-${i}-details` — блок деталей
- `catalog-constructor-property-edge-${i}-thickness`, `-type`, `-decor-id`, `-decor-name` и т.д.

---

## Чеклист перед изменением кромок

- [ ] `saveConstructorNodeData` — обновлять через `...prev`, не перезаписывать `edges[i]` целиком
- [ ] Любые новые поля — читать с `?? defaultValue`, не полагаться на `undefined`
- [ ] DOM-элементы — проверять `if (el)` перед `el.value` / `el.checked`
- [ ] collapse — решить: хранить в `nodeData` или только в UI (data-атрибуты)
- [ ] Проверить: `constructor-clodis.js` корректно читает `config.edges` из tree
- [ ] Быстрый тест: создать деталь → настроить кромки → сохранить → перезагрузить → проверить, что всё на месте

---

## Места в коде

| Файл | Что трогать | Риск |
|------|-------------|------|
| `js/admin/admin-constructor.js` | `saveConstructorNodeData` (строки ~1138–1160), заполнение полей в `updateConstructorPropertiesPanel` (~830–898) | Высокий — данные кромок |
| `admin-new.html` | HTML блок `catalog-constructor-edges-section`, `catalog-constructor-edges-list-container` | Средний — структура DOM |
| `src/constructor-clodis.js` | `_build_edges`, чтение `config.edges` | Высокий — отображение в 3D |

---

## Git перед изменениями

```bash
git add -A && git commit -m "safe checkpoint before edges collapse/info"
```

При проблемах: `git stash` или `git checkout .` для отката.
