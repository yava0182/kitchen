import fs from 'fs';

const files = [
  'D:/Clodis-Kitchen/.tmp-ikea-chunks/common.js',
  'D:/Clodis-Kitchen/.tmp-ikea-chunks/commonTE.js',
];

for (const file of files) {
  const s = fs.readFileSync(file, 'utf8');
  console.log('\n########', file.split('/').pop(), s.length);

  const strs = [...s.matchAll(/"([^"]{4,160})"/g)]
    .map((m) => m[1])
    .filter((t) => /corner|orient|rotat|flip|mirror|blind|hand|yaw|angle/i.test(t));
  const uniq = [...new Set(strs)];
  console.log('interesting strings', uniq.length);
  for (const t of uniq.slice(0, 100)) console.log('-', t);

  function dumpAll(label, re, limit = 10) {
    console.log('\n====', label, '====');
    let from = 0;
    let n = 0;
    while (n < limit) {
      const idx = s.indexOf(re, from);
      // re as string needle
      const pos = typeof re === 'string' ? s.indexOf(re, from) : (() => {
        const m = s.slice(from).match(re);
        return m ? from + m.index : -1;
      })();
      if (pos < 0) break;
      const snippet = s.slice(Math.max(0, pos - 100), pos + 200).replace(/\s+/g, ' ');
      console.log('\n@' + pos, snippet);
      from = pos + (typeof re === 'string' ? re.length : 4);
      n++;
    }
  }

  dumpAll('rotate(', 'rotate(', 8);
  dumpAll('.rotate', '.rotate', 8);
  dumpAll('orientation', 'orientation', 10);
  dumpAll('Corner', 'Corner', 10);
  dumpAll('blind', 'blind', 6);
  dumpAll('flip', 'flip', 6);
}
