/**
 * cld-ls-safe-boot.js — лёгкий boot до тяжёлых бандлов.
 * Заглушка: файл должен существовать (иначе 404 + MIME text/html ломает консоль).
 * Тяжёлую логику открытия карточки сюда не кладём.
 */
(function () {
  'use strict';
  try {
    window.__cldLsSafeBoot = { ok: true, v: '20260809-defer-ctor' };
  } catch (_) {}
})();
