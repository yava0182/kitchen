# Патч: доработка вкладки «Параметры» в редакторе материала

По референсу Clodis вкладка «Параметры» содержит полную структуру: Толщина, Группа, Описание, **Кромка**, **Варианты**.

**Применить патч:** `node scripts/patch-material-params-full.mjs`

## Расположение

Найдите в admin-new.html блок:

```html
<textarea class="form-control" id="material-item-description" ...></textarea>
```

И вставьте **сразу после** закрывающего `</div>` родительского `form-group row` (т.е. после блока с Описание) следующий код:

---

## Блок для вставки

```html
<!-- Раздел: Варианты (расчёт цены) — по рефу Clodis -->
<div class="form-group row" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
  <label class="col-sm-2 col-form-label">Варианты / Цена</label>
  <div class="col-sm-10">
    <div class="row" style="margin-bottom: 12px;">
      <div class="col-sm-3">
        <label class="col-form-label" style="font-size: 12px; color: #666;">Тип расчёта</label>
        <select id="material-calculation-type" class="form-control form-control-sm">
          <option value="per_m2">р/м²</option>
          <option value="per_mp">р/м.п</option>
        </select>
      </div>
      <div class="col-sm-3">
        <label class="col-form-label" style="font-size: 12px; color: #666;">Ввод цен</label>
        <select id="material-price-input-type" class="form-control form-control-sm">
          <option value="manual">Ручной ввод</option>
          <option value="import">Импорт</option>
        </select>
      </div>
      <div class="col-sm-3">
        <label class="col-form-label" style="font-size: 12px; color: #666;">Цена (руб)</label>
        <input type="number" id="material-price-per-m2" class="form-control form-control-sm" placeholder="3500" min="0" step="0.01" value="">
      </div>
    </div>
  </div>
</div>
```

---

## Раздел «Кромка» (опционально)

Если нужен блок «Кромка» как в референсе, добавьте его **перед** блоком «Толщина»:

```html
<!-- Раздел: Кромка -->
<div class="form-group row">
  <label class="col-sm-2 col-form-label">Кромка</label>
  <div class="col-sm-10">
    <div class="row">
      <div class="col-sm-6">
        <label class="col-form-label" style="font-size: 12px; color: #666;">Набор кромок</label>
        <select class="form-control form-control-sm" disabled style="background: #f9fafb; color: #6b7280;">
          <option value="">Набор по умолчанию</option>
        </select>
      </div>
      <div class="col-sm-6">
        <label class="col-form-label" style="font-size: 12px; color: #666;">Материал кромки</label>
        <input type="text" class="form-control form-control-sm" placeholder="Выбрать" readonly>
      </div>
    </div>
  </div>
</div>
```

---

## Итоговая структура вкладки «Параметры»

1. Толщина (мм)
2. Группа материала
3. Описание
4. **Варианты / Цена** — Тип расчёта, Ввод цен, Цена (руб)
5. (опц.) Кромка
