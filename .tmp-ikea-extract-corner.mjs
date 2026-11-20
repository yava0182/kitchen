import fs from 'fs';

const vendors = fs.readFileSync('D:/Clodis-Kitchen/.tmp-ikea-chunks/vendors.js', 'utf8');
const common = fs.readFileSync('D:/Clodis-Kitchen/.tmp-ikea-chunks/common.js', 'utf8');
const te = fs.readFileSync('D:/Clodis-Kitchen/.tmp-ikea-chunks/commonTE.js', 'utf8');

function around(s, needle, before = 300, after = 500, max = 5) {
  let from = 0;
  let n = 0;
  const out = [];
  while (n < max) {
    const pos = s.indexOf(needle, from);
    if (pos < 0) break;
    out.push({ pos, text: s.slice(Math.max(0, pos - before), pos + after) });
    from = pos + needle.length;
    n++;
  }
  return out;
}

const targets = [
  [vendors, 'IsProductCornerCabinet=function'],
  [vendors, 'IsProductInfoCornerCabinet=function'],
  [vendors, 'IsProductCornerCabinet:function'],
  [vendors, 'IsProductInfoCornerCabinet'],
  [vendors, 'FurnitureManipRotate'],
  [vendors, 'makeRotationZ(a.McK.SQPI_2)'],
  [common, 'StartTransaction("Rotate45"'],
  [te, 'InsertCornerLinearTags'],
  [vendors, 'IsCornerCabinetAgainstWall'],
  [vendors, 'backLeft'],
  [vendors, 'backRight'],
  [common, 'CornerBoxes'],
];

for (const [src, needle] of targets) {
  const hits = around(src, needle, 200, 600, 3);
  console.log('\n====================', needle, 'hits', hits.length);
  for (const h of hits) {
    console.log('\n@' + h.pos);
    console.log(h.text.replace(/\s+/g, ' ').slice(0, 900));
  }
}

// Search for Left/Right corner product naming
for (const [name, s] of [['vendors', vendors], ['common', common], ['te', te]]) {
  const strs = [...s.matchAll(/"(Corner[^"]{0,80})"/g)].map((m) => m[1]);
  const uniq = [...new Set(strs)];
  console.log('\n## Corner* strings in', name, uniq.length);
  uniq.slice(0, 40).forEach((t) => console.log('-', t));
}
