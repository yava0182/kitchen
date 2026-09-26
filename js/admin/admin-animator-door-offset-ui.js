/**
 * Поля door_offset аниматора (X/Y/Z). Вставляются в DOM, если в admin-new.html их нет
 * (разметка периодически откатывается при правках большого HTML).
 */
(function () {
  'use strict';

  const D = 'di' + 'v';

  function mkAxisInput(id, label) {
    const col = document.createElement(D);
    col.style.flex = '1';
    const lab = document.createElement('label');
    lab.style.fontSize = '11px';
    lab.style.color = '#888';
    lab.textContent = label;
    const inp = document.createElement('input');
    inp.id = id;
    inp.type = 'number';
    inp.step = '1';
    inp.value = '0';
    inp.className = 'form-control input-sm';
    inp.style.marginTop = '2px';
    col.appendChild(lab);
    col.appendChild(inp);
    return col;
  }

  function ensureAnimatorDoorOffsetFields() {
    if (document.getElementById('catalog-constructor-property-animator-door-offset-x')) return true;

    const rotatePanel = document.getElementById('catalog-constructor-animator-rotate-props');
    if (!rotatePanel) return false;

    const dirSelect = document.getElementById('catalog-constructor-property-animator-rotate-direction');
    const dirRow = dirSelect && dirSelect.parentElement;
    if (!dirRow) return false;

    const outer = document.createElement(D);
    outer.style.marginBottom = '8px';
    outer.style.marginTop = '4px';

    const title = document.createElement('label');
    title.style.fontSize = '13px';
    title.style.marginBottom = '6px';
    title.style.display = 'block';
    title.style.color = '#666';
    title.textContent = 'Смещение оси поворота, мм';

    const flex = document.createElement(D);
    flex.style.display = 'flex';
    flex.style.gap = '8px';
    flex.appendChild(mkAxisInput('catalog-constructor-property-animator-door-offset-x', 'X'));
    flex.appendChild(mkAxisInput('catalog-constructor-property-animator-door-offset-y', 'Y'));
    flex.appendChild(mkAxisInput('catalog-constructor-property-animator-door-offset-z', 'Z'));

    outer.appendChild(title);
    outer.appendChild(flex);
    dirRow.insertAdjacentElement('afterend', outer);
    return true;
  }

  function boot() {
    if (ensureAnimatorDoorOffsetFields()) return;
    const obs = new MutationObserver(function () {
      if (ensureAnimatorDoorOffsetFields()) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () {
      ensureAnimatorDoorOffsetFields();
      obs.disconnect();
    }, 5000);
  }

  window.__cldEnsureAnimatorDoorOffsetFields = ensureAnimatorDoorOffsetFields;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
