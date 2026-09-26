/**
 * Овальные кнопки шага 4 — отдельный набор на каждую папку каталога из шага 3 (ключ → catalog_25).
 */
(function (root) {
  'use strict';

  function normalizeStep4FolderKey(key) {
    if (key == null) return '';
    var k = String(key).trim();
    if (k.indexOf('catalog_') === 0) k = k.replace(/^catalog_/, '');
    return k;
  }

  /** Ключи pillSets для папки шага 3 (26, catalog_26, алиасы). */
  function resolvePillSetLookupKeys(step4, folderKey, config) {
    var keys = [];
    var norm = normalizeStep4FolderKey(folderKey);
    if (norm) keys.push(norm);
    var raw = folderKey != null ? String(folderKey).trim() : '';
    if (raw && keys.indexOf(raw) < 0) keys.push(raw);
    if (step4 && step4.pillSets && typeof step4.pillSets === 'object') {
      Object.keys(step4.pillSets).forEach(function (pk) {
        if (normalizeStep4FolderKey(pk) === norm && keys.indexOf(pk) < 0) {
          keys.push(pk);
        }
      });
    }
    if (config && norm) {
      getStep3CatalogFolders(config).forEach(function (f) {
        var fk = normalizeStep4FolderKey(f.key);
        if (fk === norm) {
          if (f.key && keys.indexOf(String(f.key).trim()) < 0) {
            keys.push(String(f.key).trim());
          }
        }
      });
    }
    return keys;
  }

  /** Папки шага 3: key = поле «Ключ» (25, 26…), name = название в комнате. */
  function getStep3CatalogFolders(config) {
    if (!config || !Array.isArray(config.steps)) return [];
    var step3 = config.steps.find(function (s) {
      return s.stepId === 3;
    });
    if (!step3 || !Array.isArray(step3.items)) return [];
    return step3.items
      .slice()
      .sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      })
      .map(function (it) {
        var key =
          (it.key && String(it.key).trim()) ||
          (it.id != null ? String(it.id).trim() : '');
        return {
          key: key,
          name: (it.name || key || 'Пункт').trim(),
        };
      })
      .filter(function (f) {
        return f.key.length > 0;
      });
  }

  function isLegacyPillEntry(it) {
    if (!it || typeof it !== 'object') return false;
    if (it.icon !== undefined && String(it.icon || '').trim() !== '') return false;
    return (
      it.name != null ||
      it.categoryId != null ||
      it.cabinetDoorFilter != null ||
      it.orCategoryId != null
    );
  }

  /**
   * Типовой набор овальных кнопок для catalog_25 (тумбы).
   * Категории из categories_catalog_25.json: 4 без дверей, 7 с дверями, 5/6 одно-/двустворчатые.
   */
  var DEFAULT_PILL_SETS_BY_FOLDER = {
    '25': [
      {
        id: 'p25-doors',
        name: 'С дверями',
        categoryId: 7,
        orCategoryId: null,
        cabinetDoorFilter: null,
        pillGroup: 0,
        order: 0,
      },
      {
        id: 'p25-no-doors',
        name: 'Без дверей',
        categoryId: 4,
        orCategoryId: null,
        cabinetDoorFilter: null,
        pillGroup: 0,
        order: 1,
      },
      {
        id: 'p25-single',
        name: 'Однодверные',
        categoryId: 5,
        orCategoryId: null,
        cabinetDoorFilter: 'single',
        pillGroup: 1,
        order: 2,
      },
      {
        id: 'p25-double',
        name: 'Двустворчатые',
        categoryId: 6,
        orCategoryId: null,
        cabinetDoorFilter: 'double',
        pillGroup: 1,
        order: 3,
      },
    ],
  };

  function folderPillSetStoredLength(step4, folderKey, config) {
    if (!step4 || !step4.pillSets) return 0;
    var lookupKeys = resolvePillSetLookupKeys(step4, folderKey, config);
    for (var i = 0; i < lookupKeys.length; i++) {
      var arr = step4.pillSets[lookupKeys[i]];
      if (Array.isArray(arr) && arr.length > 0) return arr.length;
    }
    return 0;
  }

  /**
   * Подставить типовой набор только для пустых ключей (сейчас: 25 — тумбы).
   * Существующие pillSets не перезаписываются.
   * @returns {boolean} были добавлены данные
   */
  function seedDefaultStep4PillSetsIfEmpty(step4, config) {
    if (!step4 || typeof step4 !== 'object') return false;
    if (!step4.pillSets || typeof step4.pillSets !== 'object') {
      step4.pillSets = {};
    }
    var changed = false;
    Object.keys(DEFAULT_PILL_SETS_BY_FOLDER).forEach(function (folderKey) {
      if (folderPillSetStoredLength(step4, folderKey, config) > 0) return;
      var template = DEFAULT_PILL_SETS_BY_FOLDER[folderKey];
      if (!Array.isArray(template) || template.length === 0) return;
      setStep4PillsForFolder(
        step4,
        folderKey,
        template.map(function (p) {
          return Object.assign({}, p);
        })
      );
      changed = true;
    });
    return changed;
  }

  /** Перенос step.items → pillSets по папкам шага 3 (если pillSets пуст). */
  function ensureStep4PillSets(step4, config) {
    if (!step4 || typeof step4 !== 'object') return step4;
    if (!step4.pillSets || typeof step4.pillSets !== 'object') {
      step4.pillSets = {};
    }
    var legacy = Array.isArray(step4.items)
      ? step4.items.filter(isLegacyPillEntry)
      : [];
    if (legacy.length > 0) {
      var folders = getStep3CatalogFolders(config);
      var keys =
        folders.length > 0
          ? folders.map(function (f) {
              return normalizeStep4FolderKey(f.key);
            })
          : ['__default__'];

      keys.forEach(function (k) {
        if (!k) return;
        var existing = step4.pillSets[k];
        if (!Array.isArray(existing) || existing.length === 0) {
          step4.pillSets[k] = legacy.map(function (p) {
            return Object.assign({}, p);
          });
        }
      });
      step4.items = [];
    }
    seedDefaultStep4PillSetsIfEmpty(step4, config);
    return step4;
  }

  function isPlaceholderPillName(name) {
    return /^кнопка\s*\d*$/i.test(String(name || '').trim());
  }

  /** Убрать пустые «Кнопка N» и дубли по названию. */
  function dedupeStep4Pills(pills) {
    var seen = {};
    var out = [];
    (pills || [])
      .slice()
      .sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      })
      .forEach(function (p) {
        var name = (p.name || '').trim();
        if (!name || isPlaceholderPillName(name)) return;
        var key = name.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        out.push(p);
      });
    return out;
  }

  /** Ряды 0,1,… из pillGroup; если не заданы — попарно (как 2 овала в референсе). */
  function normalizePillGroupsForDisplay(pills) {
    if (!pills || !pills.length) return [];
    var sorted = pills.slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
    var maxGroup = -1;
    sorted.forEach(function (p) {
      if (p.pillGroup != null && Number.isFinite(Number(p.pillGroup))) {
        maxGroup = Math.max(maxGroup, Number(p.pillGroup));
      }
    });
    if (maxGroup > 0) {
      return sorted.map(function (p) {
        var g = p.pillGroup != null ? Number(p.pillGroup) : 0;
        if (!Number.isFinite(g) || g < 0) g = 0;
        var copy = Object.assign({}, p);
        copy.pillGroup = g;
        return copy;
      });
    }
    return sorted.map(function (p, idx) {
      var copy = Object.assign({}, p);
      copy.pillGroup = Math.floor(idx / 2);
      return copy;
    });
  }

  function readStep4PillsRawFromStorage(step4, folderKey, config) {
    if (!step4) return [];
    var lookupKeys = resolvePillSetLookupKeys(step4, folderKey, config);
    var raw = [];
    for (var i = 0; i < lookupKeys.length; i++) {
      var lk = lookupKeys[i];
      if (
        step4.pillSets &&
        typeof step4.pillSets === 'object' &&
        Array.isArray(step4.pillSets[lk]) &&
        step4.pillSets[lk].length > 0
      ) {
        raw = step4.pillSets[lk].slice();
        break;
      }
    }
    if (raw.length === 0 && step4.pillSets && typeof step4.pillSets === 'object') {
      var nonEmpty = Object.keys(step4.pillSets).filter(function (k) {
        return Array.isArray(step4.pillSets[k]) && step4.pillSets[k].length > 0;
      });
      if (nonEmpty.length === 1) {
        raw = step4.pillSets[nonEmpty[0]].slice();
      }
    }
    if (raw.length === 0 && Array.isArray(step4.items) && step4.items.length > 0) {
      raw = step4.items.filter(isLegacyPillEntry).slice();
    }
    return raw;
  }

  /** Слить pillSets под каноническим ключом (26), если данные лежат под catalog_26 и т.п. */
  function recoverStep4PillSetAliases(step4, config) {
    if (!step4 || !step4.pillSets || typeof step4.pillSets !== 'object') return false;
    var changed = false;
    var folders = getStep3CatalogFolders(config);
    folders.forEach(function (f) {
      var canon = normalizeStep4FolderKey(f.key);
      if (!canon) return;
      if (!Array.isArray(step4.pillSets[canon])) step4.pillSets[canon] = [];
      if (step4.pillSets[canon].length > 0) return;
      var lookup = resolvePillSetLookupKeys(step4, canon, config);
      for (var i = 0; i < lookup.length; i++) {
        var lk = lookup[i];
        if (lk === canon) continue;
        var arr = step4.pillSets[lk];
        if (Array.isArray(arr) && arr.length > 0) {
          step4.pillSets[canon] = arr.map(function (p) {
            return Object.assign({}, p);
          });
          changed = true;
          break;
        }
      }
    });
    Object.keys(step4.pillSets).forEach(function (k) {
      var arr = step4.pillSets[k];
      if (!Array.isArray(arr) || !arr.length) return;
      var canon = normalizeStep4FolderKey(k);
      if (!canon || canon === k) return;
      if (!Array.isArray(step4.pillSets[canon]) || step4.pillSets[canon].length === 0) {
        step4.pillSets[canon] = arr.map(function (p) {
          return Object.assign({}, p);
        });
        changed = true;
      }
    });
    return changed;
  }

  function countStep4PillsInConfig(config) {
    if (!config || !Array.isArray(config.steps)) return 0;
    var step4 = config.steps.find(function (s) {
      return s.stepId === 4;
    });
    if (!step4 || !step4.pillSets || typeof step4.pillSets !== 'object') return 0;
    var n = 0;
    Object.keys(step4.pillSets).forEach(function (k) {
      if (Array.isArray(step4.pillSets[k])) n += step4.pillSets[k].length;
    });
    return n;
  }

  function sanitizeStep4PillsForFolder(pills) {
    return normalizePillGroupsForDisplay(dedupeStep4Pills(pills));
  }

  /** Для админки: как в storage, без dedupe (не терять «Кнопка 1» и дубли). */
  function getStep4PillsRawForFolder(step4, folderKey, config) {
    return readStep4PillsRawFromStorage(step4, folderKey, config);
  }

  function getStep4PillsForFolder(step4, folderKey, config) {
    var raw = readStep4PillsRawFromStorage(step4, folderKey, config);
    return sanitizeStep4PillsForFolder(raw);
  }

  function setStep4PillsForFolder(step4, folderKey, pills) {
    if (!step4) return;
    var k = normalizeStep4FolderKey(folderKey);
    if (!k) return;
    if (!step4.pillSets || typeof step4.pillSets !== 'object') {
      step4.pillSets = {};
    }
    var list = Array.isArray(pills) ? pills.slice() : [];
    step4.pillSets[k] = normalizePillGroupsForDisplay(list);
  }

  function readPillsFromAdminContainer(pillsContainer) {
    var list = [];
    if (!pillsContainer) return list;
    pillsContainer.querySelectorAll('.room-step-pill-item').forEach(function (row, idx) {
      var name = (
        (row.querySelector('.room-step-pill-name') &&
          row.querySelector('.room-step-pill-name').value) ||
        ''
      ).trim();
      var catVal = (
        (row.querySelector('.room-step-pill-category') &&
          row.querySelector('.room-step-pill-category').value) ||
        ''
      ).trim();
      var orCatVal = (
        (row.querySelector('.room-step-pill-or-category') &&
          row.querySelector('.room-step-pill-or-category').value) ||
        ''
      ).trim();
      var doorVal = (
        (row.querySelector('.room-step-pill-door-filter') &&
          row.querySelector('.room-step-pill-door-filter').value) ||
        ''
      ).trim();
      var order = parseInt(
        (row.querySelector('.room-step-pill-order') &&
          row.querySelector('.room-step-pill-order').value) ||
          String(idx),
        10
      );
      var groupRaw = row.querySelector('.room-step-pill-group')
        ? row.querySelector('.room-step-pill-group').value
        : '0';
      var pillGroup = parseInt(groupRaw, 10);
      if (!Number.isFinite(pillGroup) || pillGroup < 0) pillGroup = 0;
      list.push({
        id: row.getAttribute('data-id') || 'p' + idx,
        name: name || 'Кнопка ' + (idx + 1),
        categoryId: catVal ? parseInt(catVal, 10) : null,
        orCategoryId: orCatVal ? parseInt(orCatVal, 10) : null,
        cabinetDoorFilter:
          doorVal === 'single' || doorVal === 'double' ? doorVal : null,
        pillGroup: pillGroup,
        order: order,
      });
    });
    return list;
  }

  var api = {
    normalizeStep4FolderKey: normalizeStep4FolderKey,
    getStep3CatalogFolders: getStep3CatalogFolders,
    ensureStep4PillSets: ensureStep4PillSets,
    seedDefaultStep4PillSetsIfEmpty: seedDefaultStep4PillSetsIfEmpty,
    folderPillSetStoredLength: folderPillSetStoredLength,
    getStep4PillsForFolder: getStep4PillsForFolder,
    getStep4PillsRawForFolder: getStep4PillsRawForFolder,
    recoverStep4PillSetAliases: recoverStep4PillSetAliases,
    countStep4PillsInConfig: countStep4PillsInConfig,
    resolvePillSetLookupKeys: resolvePillSetLookupKeys,
    setStep4PillsForFolder: setStep4PillsForFolder,
    sanitizeStep4PillsForFolder: sanitizeStep4PillsForFolder,
    readPillsFromAdminContainer: readPillsFromAdminContainer,
  };

  root.ClodisRoomStep4PillSets = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
