/**
 * HTML-шаблоны для разделов админ-панели
 */

console.log('📦 Загрузка admin-sections.js...');

const AdminSections = {
  // Базовый шаблон таблицы
  createTableSection(config) {
    const {
      title,
      columns,
      items = [],
      addButtonText = 'Добавить',
      onAdd,
      onEdit,
      onDelete,
      onView
    } = config;

    const tableHtml = `
      <div class="admin-section" style="display:flex; flex-direction:column; height:100%; padding:20px; background:#fff;">
        <!-- Шапка -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
          <h1 style="font-size:24px; font-weight:700; color:#111;">${title}</h1>
          <button class="admin-add-btn" style="padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">
            ${addButtonText}
          </button>
        </div>

        <!-- Фильтры -->
        <div style="display:flex; gap:12px; margin-bottom:20px;">
          <input type="text" class="admin-search" placeholder="Поиск..." 
            style="flex:1; padding:8px 12px; border:1px solid #d0d7e2; border-radius:4px; font-size:13px;">
          <select class="admin-category-filter" style="padding:8px 12px; border:1px solid #d0d7e2; border-radius:4px; font-size:13px;">
            <option value="">Все категории</option>
          </select>
          <input type="number" class="admin-per-page" placeholder="20" value="20"
            style="width:80px; padding:8px 12px; border:1px solid #d0d7e2; border-radius:4px; font-size:13px;">
        </div>

        <!-- Таблица -->
        <div style="flex:1; overflow:auto; border:1px solid #e5e7eb; border-radius:6px;">
          <table style="width:100%; border-collapse:collapse; background:#fff;">
            <thead style="position:sticky; top:0; background:#f9fafb; border-bottom:2px solid #e5e7eb;">
              <tr>
                <th style="padding:12px; text-align:left; font-size:13px; font-weight:600; color:#374151; width:40px;">
                  <input type="checkbox" class="admin-select-all">
                </th>
                ${columns.map(col => `
                  <th style="padding:12px; text-align:left; font-size:13px; font-weight:600; color:#374151; ${col.width ? 'width:' + col.width : ''}">
                    ${col.label}
                  </th>
                `).join('')}
                <th style="padding:12px; text-align:center; font-size:13px; font-weight:600; color:#374151; width:150px;">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody class="admin-table-body">
              <!-- Строки будут добавлены через JS -->
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div class="admin-pagination" style="display:flex; align-items:center; justify-content:space-between; margin-top:16px; padding-top:16px; border-top:1px solid #e5e7eb;">
          <div style="font-size:13px; color:#6b7280;">
            Показано <span class="items-from">1</span>-<span class="items-to">20</span> из <span class="items-total">0</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="page-btn page-prev" style="padding:6px 12px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-size:13px;">
              Назад
            </button>
            <div class="page-numbers" style="display:flex; gap:4px;"></div>
            <button class="page-btn page-next" style="padding:6px 12px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-size:13px;">
              Вперед
            </button>
          </div>
        </div>
      </div>
    `;

    return tableHtml;
  },

  // Заявки на расчет
  requests: {
    title: 'Заявки на расчет',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Дата', key: 'date', width: '120px' },
      { label: 'Клиент', key: 'client', width: '200px' },
      { label: 'Телефон', key: 'phone', width: '140px' },
      { label: 'Email', key: 'email', width: '180px' },
      { label: 'Статус', key: 'status', width: '120px' },
      { label: 'Сумма', key: 'amount', width: '120px' },
      { label: 'Комментарий', key: 'comment', width: '200px' }
    ],
    storageKey: 'clodis_requests',
    subTypes: [],
    statuses: [
      { value: 'new', label: 'Новая', color: '#3b82f6' },
      { value: 'processing', label: 'В обработке', color: '#f59e0b' },
      { value: 'completed', label: 'Выполнена', color: '#10b981' },
      { value: 'cancelled', label: 'Отменена', color: '#ef4444' }
    ]
  },

  // Основные параметры
  constructor_code: {
    title: 'Основные параметры',
    storageKey: 'clodis_constructor_settings'
  },

  // Настройки конструктора
  constructor_settings: {
    title: 'Настройки конструктора',
    storageKey: 'clodis_constructor_settings'
  },

  // Расчет цен
  pricing: {
    title: 'Расчет цен',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Название', key: 'name' },
      { label: 'Тип элемента', key: 'elementType', width: '150px' },
      { label: 'Формула', key: 'formula', width: '200px' },
      { label: 'Базовая цена', key: 'basePrice', width: '120px' },
      { label: 'Коэффициент', key: 'coefficient', width: '120px' },
      { label: 'Итоговая цена', key: 'finalPrice', width: '120px' }
    ],
    storageKey: 'clodis_pricing',
    subTypes: []
  },

  // Настройка меню
  menu_settings: {
    title: 'Настройка меню',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Название', key: 'name' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'visible', width: '100px' },
      { label: 'Иконка', key: 'icon', width: '100px' }
    ],
    storageKey: 'clodis_menu_settings',
    subTypes: []
  },

  // Пользователи
  users: {
    title: 'Пользователи',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Имя', key: 'name' },
      { label: 'Email', key: 'email', width: '200px' },
      { label: 'Роль', key: 'role', width: '120px' },
      { label: 'Статус', key: 'status', width: '100px' },
      { label: 'Последний вход', key: 'lastLogin', width: '150px' }
    ],
    storageKey: 'clodis_users',
    subTypes: []
  },

  // Глобальные переменные
  global_vars: {
    title: 'Глобальные переменные',
    columns: [
      { label: 'Ключ', key: 'key', width: '200px' },
      { label: 'Название', key: 'name' },
      { label: 'Значение', key: 'value', width: '150px' },
      { label: 'Тип', key: 'type', width: '100px' },
      { label: 'Единица', key: 'unit', width: '100px' }
    ],
    storageKey: 'clodis_global_vars',
    subTypes: []
  },

  // Плитные материалы (ЛДСП, ХДФ и т.д.)
  materials: {
    title: 'Плитные материалы',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Иконка', key: 'icon', width: '80px' },
      { label: 'Название', key: 'name' },
      { label: 'Артикул', key: 'code', width: '120px' },
      { label: 'Категория', key: 'category', width: '150px' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_materials',
    subTypes: ['ЛДСП', 'ХДФ', 'МДФ', 'Массив']
  },

  // Кромки
  edges: {
    title: 'Кромки',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Иконка', key: 'icon', width: '80px' },
      { label: 'Название', key: 'name' },
      { label: 'Артикул', key: 'code', width: '120px' },
      { label: 'Толщина', key: 'thickness', width: '100px' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_edges',
    subTypes: []
  },

  // Шаблоны присадки
  drilling_templates: {
    title: 'Шаблоны присадки',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Название', key: 'name' },
      { label: 'Описание', key: 'description' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_drilling_templates',
    subTypes: []
  },

  // Каталог 3D моделей
  models: {
    title: 'Каталог 3D моделей',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Превью', key: 'preview', width: '80px' },
      { label: 'Название', key: 'name' },
      { label: 'Файл', key: 'file', width: '200px' },
      { label: 'Категория', key: 'category', width: '150px' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_models',
    subTypes: ['Ручки', 'Петли', 'Опоры', 'Прочее']
  },

  // Фасады
  facades: {
    title: 'Фасады',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Иконка', key: 'icon', width: '80px' },
      { label: 'Название', key: 'name' },
      { label: 'Артикул', key: 'code', width: '120px' },
      { label: 'Материал', key: 'material', width: '150px' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_facades',
    subTypes: []
  },

  // Карниз
  cornice: {
    title: 'Карниз',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Иконка', key: 'icon', width: '80px' },
      { label: 'Название', key: 'name' },
      { label: 'Артикул', key: 'code', width: '120px' },
      { label: 'Высота', key: 'height', width: '100px' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_cornice',
    subTypes: []
  },

  // Столешница
  tabletop: {
    title: 'Столешница',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Иконка', key: 'icon', width: '80px' },
      { label: 'Название', key: 'name' },
      { label: 'Артикул', key: 'code', width: '120px' },
      { label: 'Толщина', key: 'thickness', width: '100px' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_tabletop',
    subTypes: []
  },

  // Цоколь
  plinth: {
    title: 'Цоколь',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Иконка', key: 'icon', width: '80px' },
      { label: 'Название', key: 'name' },
      { label: 'Артикул', key: 'code', width: '120px' },
      { label: 'Высота', key: 'height', width: '100px' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_plinth',
    subTypes: []
  },

  // Ручки
  handles: {
    title: 'Ручки',
    columns: [
      { label: 'ID', key: 'id', width: '60px' },
      { label: 'Превью', key: 'preview', width: '80px' },
      { label: 'Название', key: 'name' },
      { label: 'Артикул', key: 'code', width: '120px' },
      { label: 'Тип', key: 'type', width: '120px' },
      { label: 'Порядок', key: 'order', width: '80px' },
      { label: 'Видимость', key: 'active', width: '100px' }
    ],
    storageKey: 'clodis_handles',
    subTypes: ['Кнопка', 'Скоба', 'Рейлинг']
  },

  // Типы элементов каталога (как в референсе Clodis)
  element_types: {
    title: 'Типы элементов',
    columns: [
      { label: 'ID', key: 'id', width: '50px' },
      { label: 'Название', key: 'name' }
    ],
    storageKey: 'catalogTypes',
  },

  catalog_groups: {
    title: 'Группы',
    columns: [
      { label: 'ID', key: 'id', width: '50px' },
      { label: 'Название', key: 'name' }
    ],
    storageKey: 'catalogGroups',
    subTypes: []
  }
};

// Генератор тестовых данных
const SampleDataGenerator = {
  materials: [
    { id: 1, name: 'Дуб Гудзон бискотти', code: 'K527', category: 'ЛДСП', order: 1, active: true },
    { id: 2, name: 'Белый Премиум', code: 'W1000', category: 'ЛДСП', order: 2, active: true },
    { id: 3, name: 'Альби голубой', code: 'U522', category: 'ЛДСП', order: 3, active: true },
    { id: 4, name: 'Безмолвная пустыня', code: 'H1176', category: 'ЛДСП', order: 4, active: true }
  ],
  edges: [
    { id: 1, name: 'ПВХ 2мм Дуб Гудзон', code: 'E527', thickness: '2мм', order: 1, active: true },
    { id: 2, name: 'ПВХ 2мм Белый', code: 'E1000', thickness: '2мм', order: 2, active: true }
  ],
  drilling_templates: [
    { id: 1, name: 'Петли стандарт', description: 'Стандартное расположение петель', order: 1, active: true },
    { id: 2, name: 'Полкодержатели', description: 'Отверстия под полкодержатели', order: 2, active: true }
  ],
  models: [
    { id: 1, name: 'Петля Blum', file: 'hinge_blum.glb', category: 'Петли', order: 1, active: true },
    { id: 2, name: 'Опора 100мм', file: 'leg_100mm.glb', category: 'Опоры', order: 2, active: true }
  ],
  facades: [
    { id: 1, name: 'Фасад МДФ Белый', code: 'F001', material: 'МДФ', order: 1, active: true },
    { id: 2, name: 'Фасад МДФ Серый', code: 'F002', material: 'МДФ', order: 2, active: true }
  ],
  cornice: [
    { id: 1, name: 'Карниз прямой 100мм', code: 'C001', height: '100мм', order: 1, active: true }
  ],
  tabletop: [
    { id: 1, name: 'Столешница 38мм Дуб', code: 'T001', thickness: '38мм', order: 1, active: true }
  ],
  plinth: [
    { id: 1, name: 'Цоколь 100мм Белый', code: 'P001', height: '100мм', order: 1, active: true }
  ],
  handles: [
    { id: 1, name: 'Ручка-кнопка хром', code: 'H001', type: 'Кнопка', order: 1, active: true },
    { id: 2, name: 'Ручка-скоба 128мм', code: 'H002', type: 'Скоба', order: 2, active: true }
  ],
  requests: [
    {
      id: 1,
      date: new Date('2025-01-06').toLocaleDateString('ru-RU'),
      client: 'Иванов Иван Иванович',
      phone: '+7 (999) 123-45-67',
      email: 'ivanov@example.com',
      status: 'new',
      amount: 125000,
      comment: 'Кухня 3 метра, белый цвет',
      configData: null,
      createdAt: new Date('2025-01-06').toISOString()
    },
    {
      id: 2,
      date: new Date('2025-01-05').toLocaleDateString('ru-RU'),
      client: 'Петрова Мария Сергеевна',
      phone: '+7 (999) 234-56-78',
      email: 'petrova@example.com',
      status: 'processing',
      amount: 89000,
      comment: 'Шкаф-купе в спальню',
      configData: null,
      createdAt: new Date('2025-01-05').toISOString()
    },
    {
      id: 3,
      date: new Date('2025-01-04').toLocaleDateString('ru-RU'),
      client: 'Сидоров Петр Александрович',
      phone: '+7 (999) 345-67-89',
      email: 'sidorov@example.com',
      status: 'completed',
      amount: 156000,
      comment: 'Гардеробная комната',
      configData: null,
      createdAt: new Date('2025-01-04').toISOString()
    }
  ]
};

// Инициализация тестовых данных
function initSampleData() {
  Object.keys(SampleDataGenerator).forEach(key => {
    const storageKey = `clodis_${key}`;
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(SampleDataGenerator[key]));
      console.log(`✅ Тестовые данные для ${key} инициализированы`);
    }
  });
  
  console.log('✅ Тестовые данные инициализированы');
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
  window.AdminSections = AdminSections;
  window.SampleDataGenerator = SampleDataGenerator;
  window.initSampleData = initSampleData;
  
  console.log('✅ admin-sections.js загружен');
  console.log('  - Экспортированные ключи AdminSections:', Object.keys(AdminSections));
  console.log('  - window.AdminSections установлен:', typeof window.AdminSections !== 'undefined');
  
  // Автоматически инициализируем тестовые данные при загрузке
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSampleData);
  } else {
    initSampleData();
  }
}


