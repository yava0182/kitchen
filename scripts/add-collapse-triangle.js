import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace fa-chevron with explicit triangle in room2-price-subline-ibox blocks
content = content.replace(
  /<a class="collapse-link" href="#"><i class="fa fa-chevron-up"><\/i><\/a>/g,
  '<a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Collapse triangle added');
