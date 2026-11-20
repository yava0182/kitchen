/**
 * Каталог ролей подсекции шкафа (машинные ключи для движка и комнаты).
 *
 * Вы назначаете роль в админке у каждой дочерней секции; название в дереве может быть любым.
 * Чтобы добавить роль — допишите объект в ROLES и перезагрузите страницу.
 * Ключ: латиница snake_case, без пробелов.
 *
 * При добавлении ключа продублируйте его в fallback-списке ClodisBuilder.js (normalize без каталога).
 */
(function (global) {
  const ROLES = [
    { key: '', label: '(не задано)' },
    { key: 'cabinet_root', label: 'Корень шкафа (вся геометрия модуля)' },
    { key: 'plinth', label: 'Цокольная зона' },
    { key: 'corpus', label: 'Корпус (основной объём)' },
    { key: 'corpus_antresol', label: 'Корпус — антресоль' },
    { key: 'facades', label: 'Фасады (передняя зона, на всю высоту)' },
    { key: 'facades_main', label: 'Фасад — корпус (основная полоса)' },
    { key: 'facades_top', label: 'Фасад — антресоль / верх' },
    { key: 'service', label: 'Сервис / техзона' },
    { key: 'top', label: 'Верх / антресоль' },
    { key: 'wall_hung_body', label: 'Навесной корпус' },
    { key: 'drawer', label: 'Ящик / выдвижной блок' },
    { key: 'tall_band_low', label: 'Пенал — датам низ (как НМ)' },
    { key: 'tall_band_mid', label: 'Пенал — датам середина (столешка+зазор)' },
    { key: 'tall_band_high', label: 'Пенал — датам верх (НШ1)' },
    {
      key: 'corner_return',
      label: 'Приставка углового (панель корпуса + уголок фасада, d≈50)',
    },
    {
      key: 'corner_g_return',
      label: 'Г-рукав навеса (второе крыло Угловой Г, не NMU-планка 40)',
    },
    {
      key: 'corner_post',
      label: 'Угловая планка / нащельник (legacy; уголок уже в Приставном)',
    },
  ];

  const keys = new Set(ROLES.map((r) => r.key).filter(Boolean));

  function normalizeSectionLayoutRole(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return '';
    return keys.has(s) ? s : '';
  }

  /**
   * Слой пирога (module shell) уже имеет pos/size от стека соседей.
   * Внутренний корень каталога (catalog_27/30) не должен снова сдвигаться на v:h_bottom.
   */
  /** В тонкой оболочке facades_* (depth ≈ 16–18 мм): сброс preview-смещений по Z. */
  function isFacadeShellPreviewPosZ(pz) {
    if (pz === 's:z') return true;
    if (typeof pz === 'string') {
      const s = String(pz).trim();
      if (/^\s*s\s*:\s*z\s*$/i.test(s)) return true;
      if (/s\s*:\s*z\s*-\s*v\s*:\s*facade_thickness/i.test(s)) return true;
      if (/s\s*:\s*z\s*\+/i.test(s)) return true;
    }
    if (typeof pz === 'number' && pz > 2) return true;
    if (typeof pz === 'number' && pz < 0) return true;
    return false;
  }

  /**
   * Реф Locker_new.build_facade: накладной фасад, задняя грань = передний торец корпуса.
   * В catalog_28 для карточки превью (полная глубина) часто pos.z = 16 / «s:z» / -22 —
   * в комнате оболочка = толщина плиты (BLB), всё это → z: 0.
   */
  function fixFacadeInnerPanelPosZ(nodes) {
    const walk = (n) => {
      if (!n || typeof n !== 'object') return;
      const t = String(n.type || '').trim().toLowerCase();
      if (t === 'facade' || t === 'facades') {
        if (n.pos && typeof n.pos === 'object' && isFacadeShellPreviewPosZ(n.pos.z)) {
          n.pos = { ...n.pos, z: 0 };
        }
      }
      if (t === 'animator') {
        const id = String(n.id || '').trim().toLowerCase();
        const fn = String(n.spec?.fn || '').toLowerCase();
        const isHingeAnim = id === 'hinge_animator';
        const isDoorRotate =
          fn === 'rotate' &&
          !isHingeAnim &&
          Array.isArray(n.children) &&
          n.children.some((c) => String(c?.type || '').toLowerCase() === 'facade');
        if (isHingeAnim || isDoorRotate) {
          if (n.pos && typeof n.pos === 'object' && isFacadeShellPreviewPosZ(n.pos.z)) {
            n.pos = { ...n.pos, z: 0 };
          }
          // Комната: door_offset только из «Петли по ролям» (_trySetupAnimatorRotate), не из catalog_28.
          if (n.spec && typeof n.spec === 'object' && n.spec.door_offset) {
            const nextSpec = { ...n.spec };
            delete nextSpec.door_offset;
            n.spec = nextSpec;
          }
        }
      }
      if (t === 'module') {
        const et = String(n.spec?.element_type || '').toLowerCase();
        if (et === 'hinges' && n.pos && typeof n.pos === 'object') {
          const pz = n.pos.z;
          if (isFacadeShellPreviewPosZ(pz) || (typeof pz === 'number' && pz !== 0)) {
            n.pos = { ...n.pos, z: 0 };
          }
        }
      }
      if (Array.isArray(n.children)) n.children.forEach(walk);
    };
    if (Array.isArray(nodes)) nodes.forEach(walk);
    else walk(nodes);
  }

  function normalizeCatalogTemplateForPyramidShell(childrenClone, outerRole) {
    if (!Array.isArray(childrenClone) || !outerRole) return;
    const role = normalizeSectionLayoutRole(outerRole);
    if (!role) return;

    if (role === 'facades' || role === 'facades_main' || role === 'facades_top') {
      fixFacadeInnerPanelPosZ(childrenClone);
      return;
    }

    if (!['plinth', 'corpus_antresol', 'top'].includes(role)) return;

    const isPyramidOffsetExpr = (v) => {
      if (v === undefined || v === null) return false;
      const s = String(v).trim();
      if (!s || s === '0') return false;
      return /v:\s*h_bottom|v:\s*corpus_antresol|corpus_antresol_mm|v:\s*h_top|v:\s*tech_zone/i.test(s)
        || /h_bottom\s*\+|corpus_antresol/i.test(s);
    };

    for (const node of childrenClone) {
      if (!node || typeof node !== 'object') continue;
      const t = String(node.type || '').toLowerCase();
      if (t !== 'section' && t !== 'fill_section') continue;

      node.pos = node.pos && typeof node.pos === 'object' ? { ...node.pos } : { x: 0, y: 0, z: 0 };
      node.size = node.size && typeof node.size === 'object' ? { ...node.size } : {};

      if (isPyramidOffsetExpr(node.pos.y)) node.pos.y = 0;

      if (role === 'top') {
        node.pos.y = 0;
        if (isPyramidOffsetExpr(node.size.y)) node.size.y = 's:y';
      } else if (role === 'corpus_antresol') {
        node.pos.y = 0;
        if (isPyramidOffsetExpr(node.size.y)) node.size.y = 's:y';
      } else if (role === 'plinth') {
        node.pos.y = 0;
        fixPlinthLegDepthExprs(node);
      }
      break;
    }
  }

  /** catalog_32: legacy pos + высота опоры = v:h_bottom (не литерал 100). */
  function fixPlinthLegDepthExprs(rootNode) {
    const models = [];
    const walk = (n) => {
      if (!n || typeof n !== 'object') return;
      if (String(n.type || '').toLowerCase() === 'model') models.push(n);
      if (Array.isArray(n.children)) n.children.forEach(walk);
    };
    if (Array.isArray(rootNode)) rootNode.forEach(walk);
    else walk(rootNode);

    for (const m of models) {
      m.pos = m.pos && typeof m.pos === 'object' ? { ...m.pos } : {};
      const pz = m.pos.z;

      if (pz === 396 || String(pz).trim() === '396') {
        m.pos.z = '0+s:z-20';
      } else if (
        typeof pz === 'string' &&
        /\bs\.?x\b/i.test(String(pz)) &&
        !/\bs\.?z\b/i.test(String(pz))
      ) {
        m.pos.z = String(pz).replace(/\bs\.x\b/gi, 's:z').replace(/\bs:x\b/gi, 's:z');
      }

      // Кухня: одна GLB-опора на 100/120/150 — высота только из v:h_bottom.
      // pos/size.xz/pivot — как в JSON (1:1 админ ↔ комната).
      const name = String(m.name || m.spec?.key || '');
      const isLeg =
        m.cldSupportLeg === true || /опора/i.test(name) || /support.?leg/i.test(name);
      if (!isLeg) continue;
      m.size = m.size && typeof m.size === 'object' ? { ...m.size } : {};
      const sy = m.size.y;
      const num = Number(sy);
      const litFixed =
        sy === 100 ||
        sy === '100' ||
        sy === 120 ||
        sy === '120' ||
        sy === 150 ||
        sy === '150' ||
        (Number.isFinite(num) && num >= 80 && num <= 200);
      if (litFixed || !/\bv\s*:\s*h_bottom\b/i.test(String(sy || ''))) {
        m.size.y = 'v:h_bottom';
      }
    }
  }

  global.__CLD_SECTION_LAYOUT_ROLES = ROLES;
  global.__CLD_SECTION_LAYOUT_ROLE_KEYS = keys;
  global.__cldNormalizeSectionLayoutRole = normalizeSectionLayoutRole;
  global.__cldNormalizeCatalogTemplateForPyramidShell = normalizeCatalogTemplateForPyramidShell;
  global.__cldFixPlinthLegDepthExprs = fixPlinthLegDepthExprs;
})(typeof window !== 'undefined' ? window : globalThis);
