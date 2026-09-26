const fs = require('fs');
const lines = fs
  .readFileSync(
    'D:/Configurator-Clodis-ThreeJS-24/Configurator-Clodis-ThreeJS-7/js/sections/section-manager.js',
    'utf8'
  )
  .split(/\n/);
let depth = 0;
const marks = new Set([9106, 9117, 9203, 9220, 9235, 9259, 9264, 9400, 9430, 9511, 9514, 9787, 9788, 9925, 10314]);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inS = false,
    inD = false,
    inT = false,
    esc = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === '\\' && (inS || inD || inT)) {
      esc = true;
      continue;
    }
    if (!inD && !inT && ch === "'") {
      inS = !inS;
      continue;
    }
    if (!inS && !inT && ch === '"') {
      inD = !inD;
      continue;
    }
    if (!inS && !inD && ch === '`') {
      inT = !inT;
      continue;
    }
    if (inS || inD || inT) continue;
    if (ch === '{') depth++;
    if (ch === '}') depth--;
  }
  const n = i + 1;
  if (marks.has(n) || (n >= 9195 && n <= 9240)) {
    console.log(n + ' d=' + depth + ' | ' + line.slice(0, 100));
  }
}
console.log('final', depth);
