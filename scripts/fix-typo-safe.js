/**
 * Fix room2-step-4 typo without changing file encoding.
 * Pure ASCII replacement - preserves all other bytes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../admin-new.html');
const buf = fs.readFileSync(filePath);
const content = buf.toString('binary'); // preserve all bytes
const oldStr = '<div id="room2-step-4" class="admin-page"> class="admin-page">';
const newStr = '<div id="room2-step-4" class="admin-page">';

if (content.includes(oldStr)) {
  const fixed = content.split(oldStr).join(newStr);
  fs.writeFileSync(filePath, Buffer.from(fixed, 'binary'));
  console.log('Typo fixed.');
} else {
  console.log('Typo not found (already fixed?)');
}
