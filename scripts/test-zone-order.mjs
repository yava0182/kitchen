import { resolveInteriorZoneSpansMm } from '../js/furniture/furniture-interior-layout.js';

const layout = {
  zones: [
    { name: 'Верх', position: 'top', heightPercent: 50, content: 'rod' },
    { name: 'Низ', position: 'bottom', heightPercent: 50, content: 'shelves' },
  ],
};
const spans = resolveInteriorZoneSpansMm(1950, layout);
const out = spans.map((s) => ({
  name: s.name,
  content: s.content,
  bottomMm: s.bottomMm,
  heightMm: s.heightMm,
}));
console.log(JSON.stringify(out, null, 2));
const ok = spans[0]?.content === 'shelves' && spans[1]?.content === 'rod';
process.exit(ok ? 0 : 1);
