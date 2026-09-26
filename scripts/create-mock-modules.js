/**
 * Создает мок-данные модулей для тестирования
 * Эти модули можно сохранить в db.json или localStorage
 */

const mockModules = [
  {
    id: "89",
    name: "секция 1950",
    type: "section",
    elementType: "section",
    metadata: {
      name: "секция 1950",
      type: "section",
      size: { width: 600, height: 1950, depth: 400 },
      createdAt: new Date().toISOString(),
      element_type: "shablony_korpusov"
    },
    clodisJSON: [
      {
        type: "section",
        name: "Секция",
        size: { x: "s:x", y: "s:y", z: "s:z" },
        pos: { x: 0, y: 0, z: 0 },
        pivot: { x: -1, y: -1, z: -1 },
        children: [
          {
            type: "wall",
            name: "вертикаль левая",
            spec: {
              orientation: "v",
              group: "wall",
              type: "common",
              material: { group: "g0", key: "ldsp", thickness_lock: 0 }
            },
            size: { x: "s:x", y: "s:y-32", z: "s:z" },
            pos: { x: 0, y: "16", z: 0 },
            pivot: { x: -1, y: -1, z: -1 }
          },
          {
            type: "wall",
            name: "вертикаль правая",
            spec: {
              orientation: "v",
              group: "wall",
              type: "common",
              material: { group: "g0", key: "ldsp", thickness_lock: 0 }
            },
            size: { x: "s:x", y: "s:y-32", z: "s:z" },
            pos: { x: "s:x", y: "16", z: 0 },
            pivot: { x: 1, y: -1, z: -1 }
          },
          {
            type: "wall",
            name: "Горизонт низ",
            spec: {
              orientation: "h",
              group: "wall",
              type: "common",
              material: { group: "g0", key: "ldsp", thickness_lock: 0 }
            },
            size: { x: "s:x-32", y: "s:y", z: "s:z" },
            pos: { x: "16", y: "50", z: 0 },
            pivot: { x: -1, y: -1, z: -1 }
          },
          {
            type: "wall",
            name: "горизонт верх",
            spec: {
              orientation: "h",
              group: "wall",
              type: "common",
              material: { group: "g0", key: "ldsp", thickness_lock: 0 }
            },
            size: { x: "s:x-32", y: "s:y", z: "s:z" },
            pos: { x: "16", y: "s:y", z: 0 },
            pivot: { x: -1, y: 1, z: -1 }
          },
          {
            type: "wall",
            name: "задняя стенка",
            spec: {
              orientation: "f",
              group: "wall",
              type: "common",
              material: { group: "g1", key: "hdf", thickness_lock: 0 }
            },
            size: { x: "s:x", y: "s:y-50", z: "s:z" },
            pos: { x: 0, y: "50", z: "-3" },
            pivot: { x: -1, y: -1, z: -1 }
          }
        ]
      }
    ]
  },
  {
    id: "88",
    name: "антресоль",
    type: "section",
    elementType: "section",
    metadata: {
      name: "антресоль",
      type: "section",
      size: { width: 600, height: 400, depth: 400 },
      createdAt: new Date().toISOString(),
      element_type: "shablony_korpusov"
    },
    clodisJSON: [
      {
        type: "section",
        name: "Антресоль",
        size: { x: "s:x", y: "s:y", z: "s:z" },
        pos: { x: 0, y: 0, z: 0 },
        pivot: { x: -1, y: -1, z: -1 },
        children: [
          {
            type: "wall",
            name: "вертикаль левая",
            spec: {
              orientation: "v",
              group: "wall",
              type: "common",
              material: { group: "g0", key: "ldsp", thickness_lock: 0 }
            },
            size: { x: "s:x", y: "s:y-32", z: "s:z" },
            pos: { x: 0, y: "16", z: 0 },
            pivot: { x: -1, y: -1, z: -1 }
          },
          {
            type: "wall",
            name: "вертикаль правая",
            spec: {
              orientation: "v",
              group: "wall",
              type: "common",
              material: { group: "g0", key: "ldsp", thickness_lock: 0 }
            },
            size: { x: "s:x", y: "s:y-32", z: "s:z" },
            pos: { x: "s:x", y: "16", z: 0 },
            pivot: { x: 1, y: -1, z: -1 }
          },
          {
            type: "wall",
            name: "Горизонт низ",
            spec: {
              orientation: "h",
              group: "wall",
              type: "common",
              material: { group: "g0", key: "ldsp", thickness_lock: 0 }
            },
            size: { x: "s:x-32", y: "s:y", z: "s:z" },
            pos: { x: "16", y: 0, z: 0 },
            pivot: { x: -1, y: -1, z: -1 }
          },
          {
            type: "wall",
            name: "задняя стенка",
            spec: {
              orientation: "f",
              group: "wall",
              type: "common",
              material: { group: "g1", key: "hdf", thickness_lock: 0 }
            },
            size: { x: "s:x", y: "s:y", z: "s:z" },
            pos: { x: 0, y: 0, z: "-3" },
            pivot: { x: -1, y: -1, z: -1 }
          }
        ]
      }
    ]
  },
  {
    id: "9",
    name: "Фасад",
    type: "facade",
    elementType: "facade",
    metadata: {
      name: "Фасад",
      type: "facade",
      size: { width: 600, height: 2350, depth: 16 },
      createdAt: new Date().toISOString(),
      element_type: "dveri_shkaf"
    },
    clodisJSON: [
      {
        type: "facade",
        name: "Фасад",
        spec: {
          orientation: "f",
          group: "facade",
          type: "common",
          material: { group: "g0", key: "ldsp", thickness_lock: 0 }
        },
        size: { x: "s:x", y: "s:y", z: "16" },
        pos: { x: 0, y: 0, z: "s:z" },
        pivot: { x: -1, y: -1, z: 1 }
      }
    ]
  }
];

// Экспорт для использования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = mockModules;
}

// Для использования в браузере
if (typeof window !== 'undefined') {
  window.mockModules = mockModules;
  console.log('✅ Мок-модули загружены! Используйте window.mockModules');
  console.log('📋 Модули:', mockModules);
}


