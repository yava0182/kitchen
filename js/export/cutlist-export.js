import { state } from '../utils/state.js';

function safeNowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadJson(filename, obj) {
  downloadText(filename, JSON.stringify(obj, null, 2));
}

function safeEvalArithmetic(s) {
  if (typeof s !== 'string') return NaN;
  const t = s.trim();
  if (!t) return NaN;
  if (!/^[0-9+\-*/().\s]+$/.test(t)) return NaN;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${t});`);
    const v = Number(fn());
    return Number.isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}

function resolveSizeComponentMm(v, sectionSizeMm) {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  const s0 = String(v).trim();
  if (!s0) return NaN;
  const s = s0
    .replace(/@section\.width/g, String(Number(sectionSizeMm?.x || 0)))
    .replace(/@section\.height/g, String(Number(sectionSizeMm?.y || 0)))
    .replace(/@section\.depth/g, String(Number(sectionSizeMm?.z || 0)));
  const num = Number(s);
  if (Number.isFinite(num)) return num;
  const evaled = safeEvalArithmetic(s);
  return Number.isFinite(evaled) ? evaled : NaN;
}

function walkNodes(node, cb) {
  if (!node || typeof node !== 'object') return;
  cb(node);
  const kids = node.children;
  if (Array.isArray(kids)) kids.forEach((k) => walkNodes(k, cb));
}

function computeGroupSizeMmNoAo(group) {
  const bb = new THREE.Box3();
  let has = false;
  try {
    group.traverse((obj) => {
      if (!obj || !obj.isMesh) return;
      const ud = obj.userData || {};
      if (ud.isWallAo || ud.isContactShadow) return;
      const b = new THREE.Box3().setFromObject(obj);
      if (!has) {
        bb.copy(b);
        has = true;
      } else {
        bb.union(b);
      }
    });
  } catch {}
  if (!has) {
    try {
      bb.setFromObject(group);
      has = true;
    } catch {}
  }
  const size = bb.getSize(new THREE.Vector3());
  return {
    x: Math.abs(Number(size.x) || 0),
    y: Math.abs(Number(size.y) || 0),
    z: Math.abs(Number(size.z) || 0),
  };
}

function dimsForCutMm(sx, sy, sz) {
  const dims = [sx, sy, sz].filter((x) => Number.isFinite(x) && x > 0);
  if (dims.length < 3) return null;
  dims.sort((a, b) => a - b);
  const thicknessMm = dims[0];
  const widthMm = dims[1];
  const lengthMm = dims[2];
  return { lengthMm, widthMm, thicknessMm };
}

function getWorldDimsMmFromBoxMesh(mesh) {
  if (!mesh || !mesh.isMesh) return null;
  const geom = mesh.geometry;
  if (!geom) return null;
  const t = geom.type;
  if (t !== 'BoxGeometry' && t !== 'BoxBufferGeometry') return null;
  const p = geom.parameters || {};
  const base = {
    x: Number(p.width || 0) || 0,
    y: Number(p.height || 0) || 0,
    z: Number(p.depth || 0) || 0,
  };
  if (!base.x || !base.y || !base.z) return null;
  const s = new THREE.Vector3(1, 1, 1);
  try {
    mesh.getWorldScale(s);
  } catch {}
  const sx = Math.abs(base.x * (Number(s.x) || 1));
  const sy = Math.abs(base.y * (Number(s.y) || 1));
  const sz = Math.abs(base.z * (Number(s.z) || 1));
  return { x: sx, y: sy, z: sz };
}

function isSectionPlankMesh(obj) {
  if (!obj || !obj.isMesh) return false;
  const ud = obj.userData || {};
  return !!(ud.isTopPlank || ud.isBottomPlank || ud.isSidePlank || ud.isSideOverlay);
}

function escapeCsv(v) {
  const s = (v == null ? '' : String(v));
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, headers) {
  const h = headers || (rows.length ? Object.keys(rows[0]) : []);
  const lines = [];
  lines.push(h.map(escapeCsv).join(';'));
  rows.forEach((r) => {
    lines.push(h.map((k) => escapeCsv(r[k])).join(';'));
  });
  return lines.join('\n');
}

function dxfHeaderR12() {
  // Minimal R12 header, units are "unitless" but we treat as millimeters.
  return [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1009',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'TABLE',
    '2', 'LAYER',
    '70', '2',
    // Layer CUT
    '0', 'LAYER',
    '2', 'CUT',
    '70', '0',
    '62', '7',
    '6', 'CONTINUOUS',
    // Layer TEXT
    '0', 'LAYER',
    '2', 'TEXT',
    '70', '0',
    '62', '2',
    '6', 'CONTINUOUS',
    '0', 'ENDTAB',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES',
  ].join('\n') + '\n';
}

function dxfFooter() {
  return ['0', 'ENDSEC', '0', 'EOF'].join('\n') + '\n';
}

function dxfLine(x1, y1, x2, y2, layer = 'CUT') {
  const f = (n) => (Number(n) || 0).toFixed(3);
  return [
    '0', 'LINE',
    '8', layer,
    '10', f(x1),
    '20', f(y1),
    '30', '0.0',
    '11', f(x2),
    '21', f(y2),
    '31', '0.0',
  ].join('\n') + '\n';
}

function dxfText(x, y, text, height = 40, layer = 'TEXT') {
  const f = (n) => (Number(n) || 0).toFixed(3);
  const t = String(text ?? '').replace(/\r?\n/g, ' ');
  return [
    '0', 'TEXT',
    '8', layer,
    '10', f(x),
    '20', f(y),
    '30', '0.0',
    '40', f(height),
    '1', t,
    '50', '0.0',
  ].join('\n') + '\n';
}

function edgeSummaryStr(p) {
  const s = (v) => (Number(v) || 0) ? String(Number(v) || 0) : '-';
  return `E(s:${s(p.edgeShort1)}/${s(p.edgeShort2)} l:${s(p.edgeLong1)}/${s(p.edgeLong2)})`;
}

function layoutPartsOnSheet(parts, opts = {}) {
  const sheetW = Number(opts.sheetWidthMm || 2800);
  const sheetH = Number(opts.sheetHeightMm || 2070);
  const gap = Number(opts.gapMm || 20);
  const margin = Number(opts.marginMm || 20);

  const placed = [];
  let x = margin;
  let y = margin;
  let rowH = 0;

  // DXF Y-axis is up; we'll lay out increasing Y.
  for (const p of parts) {
    const w = Number(p.lengthMm || 0) || 0;
    const h = Number(p.widthMm || 0) || 0;
    if (w <= 0 || h <= 0) continue;

    // New row if doesn't fit.
    if (x + w > sheetW - margin) {
      x = margin;
      y += rowH + gap;
      rowH = 0;
    }

    placed.push({ ...p, x, y, w, h });
    x += w + gap;
    rowH = Math.max(rowH, h);

    // If exceeds sheet height, we still place (user can scale/merge later),
    // but we keep coordinates - some importers allow.
    if (y + rowH > sheetH - margin) {
      // no-op
    }
  }

  return { placed, sheetW, sheetH, gap, margin };
}

function buildSingleSheetDxfFromRows(rows) {
  const header = dxfHeaderR12();
  const footer = dxfFooter();

  // Expand by qty so placement is explicit.
  const expanded = [];
  rows.forEach((r) => {
    const q = Math.max(1, Number(r.qty) || 1);
    for (let i = 0; i < q; i++) expanded.push({ ...r, qty: 1 });
  });

  // Prefer placing larger parts first.
  expanded.sort((a, b) => {
    const aa = (Number(a.lengthMm) || 0) * (Number(a.widthMm) || 0);
    const bb = (Number(b.lengthMm) || 0) * (Number(b.widthMm) || 0);
    return bb - aa;
  });

  const { placed, sheetW, sheetH } = layoutPartsOnSheet(expanded);

  let out = header;

  // Draw sheet border for reference.
  out += dxfLine(0, 0, sheetW, 0);
  out += dxfLine(sheetW, 0, sheetW, sheetH);
  out += dxfLine(sheetW, sheetH, 0, sheetH);
  out += dxfLine(0, sheetH, 0, 0);
  out += dxfText(10, sheetH + 30, `CUTLIST ${safeNowStamp()} (mm)`, 30);

  placed.forEach((p) => {
    const x = p.x;
    const y = p.y;
    const w = p.w;
    const h = p.h;
    // Rectangle
    out += dxfLine(x, y, x + w, y);
    out += dxfLine(x + w, y, x + w, y + h);
    out += dxfLine(x + w, y + h, x, y + h);
    out += dxfLine(x, y + h, x, y);

    const label1 = `${p.partName || 'Part'} ${p.thicknessMm || ''}mm`;
    const label2 = `${Math.round(w)}x${Math.round(h)} ${edgeSummaryStr(p)}`;
    out += dxfText(x + 10, y + h - 45, label1, 30);
    out += dxfText(x + 10, y + h - 85, label2, 25);
  });

  out += footer;
  return out;
}

function collectFurnitureGroups() {
  const out = [];
  if (!state?.scene) return out;
  state.scene.traverse((obj) => {
    if (obj && obj.isGroup && obj.userData?.isFurniture) out.push(obj);
  });
  return out;
}

function collectSectionPlankMeshes() {
  const out = [];
  if (!Array.isArray(state?.customSections)) return out;
  state.customSections.forEach((sec) => {
    const g = sec?.group;
    if (!g) return;
    g.traverse((obj) => {
      if (isSectionPlankMesh(obj)) out.push(obj);
    });
  });
  return out;
}

function extractCutPartsFromFurnitureGroup(group) {
  const ud = group?.userData || {};
  const root = ud.__clodisDataForBuild;
  const sectionSizeMm = computeGroupSizeMmNoAo(group);

  const parts = [];
  if (root && typeof root === 'object') {
    walkNodes(root, (nd) => {
      const type = String(nd.type || '').toLowerCase();
      if (type !== 'wall') return; // корпусные панели

      const sz = nd.size || {};
      const sx = resolveSizeComponentMm(sz.x ?? sz.width, sectionSizeMm);
      const sy = resolveSizeComponentMm(sz.y ?? sz.height, sectionSizeMm);
      const szv = resolveSizeComponentMm(sz.z ?? sz.depth, sectionSizeMm);
      if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(szv)) return;

      const cut = dimsForCutMm(sx, sy, szv);
      if (!cut) return;

      const edges = nd.edges && typeof nd.edges === 'object' ? nd.edges : null;
      const edgeShort1 = edges?.[1]?.enabled ? (Number(edges[1].edge_id ?? edges[1].decor_id ?? 0) || 1) : 0;
      const edgeShort2 = edges?.[2]?.enabled ? (Number(edges[2].edge_id ?? edges[2].decor_id ?? 0) || 1) : 0;
      const edgeLong1 = edges?.[3]?.enabled ? (Number(edges[3].edge_id ?? edges[3].decor_id ?? 0) || 1) : 0;
      const edgeLong2 = edges?.[4]?.enabled ? (Number(edges[4].edge_id ?? edges[4].decor_id ?? 0) || 1) : 0;

      parts.push({
        partName: nd.name || nd.spec?.name || 'Деталь',
        partType: 'LDSP',
        lengthMm: Math.round(cut.lengthMm),
        widthMm: Math.round(cut.widthMm),
        thicknessMm: Math.round(cut.thicknessMm),
        qty: 1,
        edgeShort1,
        edgeShort2,
        edgeLong1,
        edgeLong2,
        source: 'clodis',
      });
    });
  } else {
    // Fallback: если JSON нет, берём геометрию деталей корпуса из мешей (BoxGeometry) и считаем их площадными.
    group.traverse((obj) => {
      if (!obj || !obj.isMesh) return;
      const ud2 = obj.userData || {};
      if (ud2.isWallAo || ud2.isContactShadow) return;
      if (ud2.isFacade) return; // фасады можно добавить позже отдельной настройкой
      if (!ud2.isDetail && !ud2.isBody) return;
      const dims = getWorldDimsMmFromBoxMesh(obj);
      if (!dims) return;
      const cut = dimsForCutMm(dims.x, dims.y, dims.z);
      if (!cut) return;
      parts.push({
        partName: ud2.detailName || obj.name || 'Деталь',
        partType: 'LDSP',
        lengthMm: Math.round(cut.lengthMm),
        widthMm: Math.round(cut.widthMm),
        thicknessMm: Math.round(cut.thicknessMm),
        qty: 1,
        edgeShort1: 0,
        edgeShort2: 0,
        edgeLong1: 0,
        edgeLong2: 0,
        source: 'mesh_fallback',
      });
    });
  }

  return parts;
}

function extractCutPartsFromSectionPlankMesh(mesh) {
  const dims = getWorldDimsMmFromBoxMesh(mesh);
  if (!dims) return null;
  const cut = dimsForCutMm(dims.x, dims.y, dims.z);
  if (!cut) return null;
  const ud = mesh.userData || {};
  return {
    partName: mesh.name || (ud.isTopPlank ? 'TopPlank' : ud.isBottomPlank ? 'BottomPlank' : ud.isSideOverlay ? 'SideOverlay' : 'SidePlank'),
    partType: 'LDSP',
    lengthMm: Math.round(cut.lengthMm),
    widthMm: Math.round(cut.widthMm),
    thicknessMm: Math.round(cut.thicknessMm),
    qty: 1,
    // Кромку для планок не гадаем: оставляем 0 и позже добавим правила, если нужно.
    edgeShort1: 0,
    edgeShort2: 0,
    edgeLong1: 0,
    edgeLong2: 0,
    source: 'section_plank',
  };
}

function aggregateRows(rows) {
  const m = new Map();
  const keyOf = (r) =>
    [
      r.partType,
      r.partName,
      r.lengthMm,
      r.widthMm,
      r.thicknessMm,
      r.edgeShort1,
      r.edgeShort2,
      r.edgeLong1,
      r.edgeLong2,
      r.source,
      r.sectionId ?? '',
      r.zoneIndex ?? '',
    ].join('|');
  rows.forEach((r) => {
    const k = keyOf(r);
    const prev = m.get(k);
    if (!prev) m.set(k, { ...r, qty: Number(r.qty) || 1 });
    else prev.qty = (Number(prev.qty) || 0) + (Number(r.qty) || 1);
  });
  return Array.from(m.values());
}

export function exportCutlistAndEdges() {
  try {
    const furniture = collectFurnitureGroups();
    if (!furniture.length) {
      alert('Нет мебели для экспорта. Сначала разместите модули в секции.');
      return;
    }

    let rows = [];
    furniture.forEach((grp) => {
      const sid = grp.userData?.sectionId ?? '';
      const zi = grp.userData?.zoneIndex ?? '';
      const parts = extractCutPartsFromFurnitureGroup(grp);
      parts.forEach((p) => {
        rows.push({
          sectionId: sid,
          zoneIndex: zi,
          ...p,
        });
      });
    });

    // Добавляем планки секций (площадной материал секции)
    const planks = collectSectionPlankMeshes();
    planks.forEach((mesh) => {
      const p = extractCutPartsFromSectionPlankMesh(mesh);
      if (!p) return;
      // Секции: sectionId лежит на группе секции, но планка — дочерний меш.
      // Пробуем пройти вверх и найти sectionId.
      let sid = '';
      let cur = mesh;
      for (let i = 0; i < 6 && cur; i++) {
        const ud = cur.userData || {};
        if (ud.sectionId != null) { sid = ud.sectionId; break; }
        cur = cur.parent;
      }
      rows.push({ sectionId: sid, zoneIndex: '', ...p });
    });

    rows = aggregateRows(rows);

    if (!rows.length) {
      alert('Не удалось найти детали для раскроя. Возможно, у модулей нет Clodis JSON.');
      return;
    }

    const stamp = safeNowStamp();
    const headers = [
      'sectionId',
      'zoneIndex',
      'partName',
      'partType',
      'lengthMm',
      'widthMm',
      'thicknessMm',
      'qty',
      'edgeShort1',
      'edgeShort2',
      'edgeLong1',
      'edgeLong2',
      'source',
    ];

    downloadText(`cutlist_${stamp}.csv`, toCsv(rows, headers));
    downloadJson(`cutlist_${stamp}.json`, { generatedAt: new Date().toISOString(), rows });
  } catch (e) {
    console.error('Cutlist export failed', e);
    alert('Не удалось экспортировать раскрой/кромку. Подробности в консоли.');
  }
}

export function exportCutlistSingleSheetDxf() {
  try {
    const furniture = collectFurnitureGroups();
    if (!furniture.length) {
      alert('Нет мебели для экспорта. Сначала разместите модули в секции.');
      return;
    }

    let rows = [];
    furniture.forEach((grp) => {
      const sid = grp.userData?.sectionId ?? '';
      const zi = grp.userData?.zoneIndex ?? '';
      const parts = extractCutPartsFromFurnitureGroup(grp);
      parts.forEach((p) => rows.push({ sectionId: sid, zoneIndex: zi, ...p }));
    });

    const planks = collectSectionPlankMeshes();
    planks.forEach((mesh) => {
      const p = extractCutPartsFromSectionPlankMesh(mesh);
      if (!p) return;
      let sid = '';
      let cur = mesh;
      for (let i = 0; i < 6 && cur; i++) {
        const ud = cur.userData || {};
        if (ud.sectionId != null) { sid = ud.sectionId; break; }
        cur = cur.parent;
      }
      rows.push({ sectionId: sid, zoneIndex: '', ...p });
    });

    rows = aggregateRows(rows);
    if (!rows.length) {
      alert('Не удалось собрать детали для DXF.');
      return;
    }

    const dxf = buildSingleSheetDxfFromRows(rows);
    downloadText(`cutlist_${safeNowStamp()}.dxf`, dxf);
  } catch (e) {
    console.error('Cutlist DXF export failed', e);
    alert('Не удалось экспортировать DXF. Подробности в консоли.');
  }
}

