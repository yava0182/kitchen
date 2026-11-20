import { state } from '../utils/state.js';

function formatRub(amount) {
  const n = Number(amount) || 0;
  const s = n.toFixed(2);
  const parts = s.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return intPart + ',' + parts[1] + ' руб';
}

function formatNum(n, digits) {
  const v = Number(n) || 0;
  return v.toFixed(typeof digits === 'number' ? digits : 2);
}

function computeRoomPriceReport() {
  const out = {
    totalRub: 0,
    furnitureTotalRub: 0,
    sectionTrimRubShown: 0,
    sectionTrimRubAll: 0,
    ldsp: { areaM2: 0, rub: 0 },
    edge: { lengthMp: 0, rub: 0 },
    items: [],
    sectionTrim: null,
  };
  if (!state?.scene) return out;

  state.scene.traverse((obj) => {
    if (!obj || !obj.isGroup || !obj.userData?.isFurniture) return;
    const ud = obj.userData || {};
    const areaM2 = Number(ud.ldspAreaM2 || 0) || 0;
    const pM2 = Number(ud.priceLdspPerM2 || 0) || 0;
    const ldspRub = areaM2 * pM2;

    const lenMp = Number(ud.edgeLengthMp || 0) || 0;
    // Если есть несколько кромок — суммируем по строкам
    const edgeRows = Array.isArray(ud.edgePricingRows) ? ud.edgePricingRows : null;
    const edgeRub = edgeRows
      ? edgeRows.reduce((acc, r) => acc + (Number(r.lengthMp) || 0) * (Number(r.pricePerMp) || 0), 0)
      : lenMp * (Number(ud.edgePricePerMp || 0) || 0);
    const pMp = edgeRows ? 0 : (Number(ud.edgePricePerMp || 0) || 0);

    const hwRub = Number(ud.priceHardwareRub || 0) || 0;
    const hwRows = Array.isArray(ud.hardwarePricingRows) ? ud.hardwarePricingRows : null;
    const totalRub = Number(ud.priceRubTotal ?? (ldspRub + edgeRub + hwRub) ?? 0) || 0;

    out.furnitureTotalRub += totalRub;
    out.ldsp.areaM2 += areaM2;
    out.ldsp.rub += ldspRub;
    out.edge.lengthMp += lenMp;
    out.edge.rub += edgeRub;
    out.hardware = out.hardware || { rub: 0, rows: [] };
    out.hardware.rub += hwRub;
    if (hwRows) out.hardware.rows.push(...hwRows);

    out.items.push({
      id: obj.uuid,
      sectionId: ud.sectionId,
      zoneIndex: ud.zoneIndex,
      areaM2,
      pricePerM2: pM2,
      ldspRub,
      lengthMp: lenMp,
      pricePerMp: pMp,
      edgeRub,
      hardwareRub: hwRub,
      totalRub,
      edgeRows: edgeRows || undefined,
      hardwareRows: hwRows || undefined,
    });
  });

  // Section planks/overlays (facade trim) pricing is computed in furniture-manager and stored in last event detail.
  try {
    const trim = state.__lastSectionTrimPricing || null;
    out.sectionTrim = trim;
    out.sectionTrimRubShown = trim ? (Number(trim.totalRubShown || 0) || 0) : 0;
    out.sectionTrimRubAll = trim ? (Number(trim.totalRubAll || 0) || 0) : 0;
  } catch (_) {}

  out.totalRub = out.furnitureTotalRub + out.sectionTrimRubShown;

  // Стабильный порядок: по sectionId, zoneIndex
  out.items.sort((a, b) => {
    const sa = (a.sectionId ?? '').toString();
    const sb = (b.sectionId ?? '').toString();
    if (sa !== sb) return sa.localeCompare(sb, 'ru');
    return (Number(a.zoneIndex) || 0) - (Number(b.zoneIndex) || 0);
  });

  return out;
}

function ensureStylesOnce() {
  if (document.getElementById('cld-price-report-styles')) return;
  const style = document.createElement('style');
  style.id = 'cld-price-report-styles';
  style.textContent = `
    .cld-price-report-btn{
      position: fixed;
      left: 16px;
      top: 16px;
      z-index: 12000;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.10);
      background: rgba(255,255,255,0.92);
      box-shadow: 0 6px 18px rgba(0,0,0,0.14);
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      backdrop-filter: blur(6px);
    }
    .cld-price-report-btn i{ font-size: 18px; color:#1c84c6; }
    .cld-price-report-overlay{
      position: fixed;
      inset: 0;
      z-index: 20000;
      background: rgba(0,0,0,0.35);
      display:none;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 40px 36px 40px 40px;
    }
    .cld-price-report-card{
      width: 440px;
      max-width: 440px;
      max-height: 80vh;
      overflow: auto;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 10px 36px rgba(0,0,0,0.22);
      padding: 18px 18px 14px;
      border: 1px solid rgba(0,0,0,0.08);
      font-family: 'Cera Pro', Arial, sans-serif;
    }
    .cld-price-report-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .cld-price-report-title{
      font-size: 16px;
      font-weight: 700;
      color:#111;
    }
    .cld-price-report-close{
      border:none;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      color:#111;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      cursor:pointer;
      font-weight: 800;
      line-height: 1;
    }
    .cld-price-report-kpis{
      display:grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .cld-price-report-kpi{
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 12px;
      background: #fafafa;
    }
    .cld-price-report-kpi .kpi-label{ font-size: 12px; color:#6b7280; margin-bottom: 6px;}
    .cld-price-report-kpi .kpi-value{ font-size: 16px; font-weight: 800; color:#111;}
    .cld-price-report-kpi .kpi-sub{ font-size: 12px; color:#374151; margin-top: 4px;}
    .cld-price-report-table{
      width:100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .cld-price-report-table th, .cld-price-report-table td{
      border-bottom: 1px solid #eef2f7;
      padding: 8px 6px;
      text-align:left;
      vertical-align: top;
    }
    .cld-price-report-table th{ color:#6b7280; font-weight: 700; }
    .cld-price-report-mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  `;
  document.head.appendChild(style);
}

function ensureDomOnce() {
  ensureStylesOnce();
  let btn = document.getElementById('cld-price-report-btn');
  let overlay = document.getElementById('cld-price-report-overlay');

  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'cld-price-report-btn';
    btn.type = 'button';
    btn.className = 'cld-price-report-btn';
    btn.title = 'Отчёт по цене';
    btn.innerHTML = '<i class="fas fa-receipt"></i>';
    document.body.appendChild(btn);
  }

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cld-price-report-overlay';
    overlay.className = 'cld-price-report-overlay';
    overlay.innerHTML = `
      <div class="cld-price-report-card" role="dialog" aria-modal="true">
        <div class="cld-price-report-header">
          <div class="cld-price-report-title">Отчёт по материалам</div>
          <button type="button" class="cld-price-report-close" id="cld-price-report-close">×</button>
        </div>
        <div class="cld-price-report-kpis" id="cld-price-report-kpis"></div>
        <div style="margin-top: 10px;">
          <div style="font-size:12px;color:#6b7280;font-weight:700;margin-bottom:6px;">Секции (планки/накладки)</div>
          <div id="cld-price-report-sections"></div>
        </div>
        <div style="margin-top: 10px;">
          <div style="font-size:12px;color:#6b7280;font-weight:700;margin-bottom:6px;">Шкафы</div>
          <div id="cld-price-report-items"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function close() {
    overlay.style.display = 'none';
  }
  function open() {
    overlay.style.display = 'flex';
    render();
  }

  btn.onclick = () => {
    if (overlay.style.display === 'flex') close();
    else open();
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  const closeBtn = document.getElementById('cld-price-report-close');
  if (closeBtn) closeBtn.onclick = close;

  return { btn, overlay, render };
}

function render() {
  const report = computeRoomPriceReport();
  const kpis = document.getElementById('cld-price-report-kpis');
  const sectionsHost = document.getElementById('cld-price-report-sections');
  const itemsHost = document.getElementById('cld-price-report-items');
  if (!kpis || !itemsHost || !sectionsHost) return;

  kpis.innerHTML = `
    <div class="cld-price-report-kpi">
      <div class="kpi-label">Итого по комнате</div>
      <div class="kpi-value">${formatRub(report.totalRub)}</div>
    </div>
    <div class="cld-price-report-kpi">
      <div class="kpi-label">Шкафы</div>
      <div class="kpi-value">${formatRub(report.furnitureTotalRub)}</div>
      <div class="kpi-sub">ЛДСП ${formatNum(report.ldsp.areaM2, 3)} м² · кромка ${formatNum(report.edge.lengthMp, 3)} п.м</div>
    </div>
    <div class="cld-price-report-kpi">
      <div class="kpi-label">Секции (учтено / расчёт)</div>
      <div class="kpi-value">${formatRub(report.sectionTrimRubShown)}</div>
      <div class="kpi-sub">${formatRub(report.sectionTrimRubAll)}</div>
    </div>
  `;

  const trim = report.sectionTrim;
  const shown = Number(report.sectionTrimRubShown || 0) || 0;
  const all = Number(report.sectionTrimRubAll || 0) || 0;
  if (!trim || (!shown && !all)) {
    sectionsHost.innerHTML = '<div style="color:#6b7280;font-size:12px;">Нет секций или нет планок/накладок.</div>';
  } else {
    const pM2 = Number(trim.pricePerM2 || 0) || 0;
    const pMp = Number(trim.edgePricePerMp || 0) || 0;

    const areaAll = Number(trim.areaM2All || 0) || 0;
    const edgeAll = Number(trim.edgeLengthMpAll || 0) || 0;
    const ldspRubAll = areaAll * pM2;
    const edgeRubAll = edgeAll * pMp;

    const areaShown = Number(trim.areaM2Shown || 0) || 0;
    const edgeShown = Number(trim.edgeLengthMpShown || 0) || 0;
    const ldspRubShown = areaShown * pM2;
    const edgeRubShown = edgeShown * pMp;

    sectionsHost.innerHTML = `
      <table class="cld-price-report-table">
        <thead>
          <tr>
            <th>Секции</th>
            <th>ЛДСП (м²×₽/м²)</th>
            <th>Кромка (п.м×₽/п.м)</th>
            <th>Итого</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Учтено сейчас</td>
            <td>${formatNum(areaShown, 3)}<br><span style="color:#6b7280;">× ${formatNum(pM2, 2)} = ${formatRub(ldspRubShown)}</span></td>
            <td>${formatNum(edgeShown, 3)}<br><span style="color:#6b7280;">× ${formatNum(pMp, 2)} = ${formatRub(edgeRubShown)}</span></td>
            <td><b>${formatRub(shown)}</b></td>
          </tr>
          <tr>
            <td>Расчёт (все секции)</td>
            <td>${formatNum(areaAll, 3)}<br><span style="color:#6b7280;">× ${formatNum(pM2, 2)} = ${formatRub(ldspRubAll)}</span></td>
            <td>${formatNum(edgeAll, 3)}<br><span style="color:#6b7280;">× ${formatNum(pMp, 2)} = ${formatRub(edgeRubAll)}</span></td>
            <td><b>${formatRub(all)}</b></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  if (!report.items.length) {
    itemsHost.innerHTML = '<div style="color:#6b7280;font-size:12px;">Нет мебели в комнате.</div>';
    return;
  }

  const rows = report.items.map((it) => {
    const label = `секция ${it.sectionId ?? '-'} / зона ${it.zoneIndex ?? '-'}`;
    const edgeCell = it.edgeRows && it.edgeRows.length
      ? `${formatNum(it.lengthMp, 3)}<br><span style="color:#6b7280;">${it.edgeRows.map(r => `${formatNum(r.lengthMp, 3)}×${formatNum(r.pricePerMp, 2)}`).join('<br>')}</span>`
      : `${formatNum(it.lengthMp, 3)}<br><span style="color:#6b7280;">× ${formatNum(it.pricePerMp, 2)}</span>`;
    return `
      <tr>
        <td>${label}</td>
        <td>${formatNum(it.areaM2, 3)}<br><span style="color:#6b7280;">× ${formatNum(it.pricePerM2, 2)}</span></td>
        <td>${edgeCell}</td>
        <td><b>${formatRub(it.totalRub)}</b></td>
      </tr>
    `;
  }).join('');

  itemsHost.innerHTML = `
    <table class="cld-price-report-table">
      <thead>
        <tr>
          <th>Модуль</th>
          <th>ЛДСП (м²×₽/м²)</th>
          <th>Кромка (п.м×₽/п.м)</th>
          <th>Итого</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function initPriceReportPanel() {
  const dom = ensureDomOnce();

  // Обновляем при каждом пересчёте цены
  try {
    window.addEventListener('cld:priceUpdated', (e) => {
      try {
        const detail = e && e.detail ? e.detail : null;
        if (detail && detail.sectionTrim) {
          state.__lastSectionTrimPricing = detail.sectionTrim;
        }
      } catch (_) {}
      if (dom?.overlay && dom.overlay.style.display === 'flex') {
        render();
      }
    });
  } catch (_) {}

  // Дадим ручной хук для отладки
  if (typeof window !== 'undefined') {
    window.__cldRenderPriceReport = render;
  }
}

