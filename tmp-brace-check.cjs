const fs = require('fs');
const lines = fs
  .readFileSync(
    'D:/Configurator-Clodis-ThreeJS-24/Configurator-Clodis-ThreeJS-7/js/sections/section-manager.js',
    'utf8'
  )
  .split(/\n/);
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const prev = depth;
  const line = lines[i];
  let inS = false;
  let inD = false;
  let inT = false;
  let esc = false;
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
  if (n >= 9380 && n <= 9520 && (depth !== prev || /clodisRebuild|fallbackTarget|Position furniture|else \{|^\s*\}\s*$/.test(line))) {
    console.log(n + ' d=' + depth + ' | ' + line.slice(0, 110));
  }
}
console.log('final', depth);
