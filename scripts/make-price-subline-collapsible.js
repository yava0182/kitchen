import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

// Add collapsed class to ibox
content = content.replace(
  /<div class="ibox room2-price-subline-ibox" style="margin-bottom:20px;" data-cu-prefix="step([123])">/g,
  '<div class="ibox room2-price-subline-ibox collapsed" style="margin-bottom:20px;" data-cu-prefix="step$1">'
);

// Add collapse-link to ibox-title
content = content.replace(
  /<div class="ibox-title"><h5>Строка под ценой в конструкторе<\/h5><\/div>\s*<div class="ibox-content">/g,
  '<div class="ibox-title"><h5>Строка под ценой в конструкторе</h5><div class="ibox-tools"><a class="collapse-link" href="#"><i class="fa fa-chevron-up"></i></a></div></div>\n          <div class="ibox-content">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Price subline blocks made collapsible');
