import fs from 'fs';

const files = [
  'D:/Clodis-Kitchen/.tmp-ikea-chunks/common.js',
  'D:/Clodis-Kitchen/.tmp-ikea-chunks/vendors.js',
  'D:/Clodis-Kitchen/.tmp-ikea-chunks/commonTE.js',
];

const needles = [
  'FurnitureManipRotate',
  'Rotate45',
  'IsProductCornerCabinet',
  'IsProductInfoCornerCabinet',
  'InsertCornerLinearTags',
  'CornerCabinets',
  'rotateFurniture',
  'ManipRotate',
  'canRotate',
  'allowedRotations',
  'rotationStep',
  'PI_2',
  'SQPI_2',
  'handedness',
  'CornerLeft',
  'CornerRight',
  'cornerLeft',
  'cornerRight',
  'BaseCorner',
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('missing', file);
    continue;
  }
  const s = fs.readFileSync(file, 'utf8');
  console.log('\n########', file.split('/').pop(), s.length);
  for (const n of needles) {
    let from = 0;
    let count = 0;
    while (count < 3) {
      const pos = s.indexOf(n, from);
      if (pos < 0) break;
      if (count === 0) console.log('\n**', n);
      console.log('@' + pos, s.slice(Math.max(0, pos - 80), pos + 180).replace(/\s+/g, ' '));
      from = pos + n.length;
      count++;
    }
    if (count === 0) {
      /* skip */
    } else if (count === 3) {
      // count total
      let t = 0;
      let f = 0;
      while (true) {
        const p = s.indexOf(n, f);
        if (p < 0) break;
        t++;
        f = p + n.length;
      }
      if (t > 3) console.log('... total', t);
    }
  }
}
