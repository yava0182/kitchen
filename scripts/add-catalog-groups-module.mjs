import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '..', 'admin-new.html');
let content = fs.readFileSync(filePath, 'utf8');

const oldTag = '<script src="/js/admin/admin-catalog-types.js"></script>\n</body>';
const newTag = '<script src="/js/admin/admin-catalog-types.js"></script>\n  <script src="/js/admin/admin-catalog-groups.js"></script>\n</body>';

if (content.includes(oldTag)) {
  content = content.replace(oldTag, newTag);
  fs.writeFileSync(filePath, content);
  console.log('Added admin-catalog-groups.js script tag');
} else {
  console.log('Pattern not found, trying alternative');
  const alt = '</body>';
  if (content.includes('admin-catalog-types.js') && content.includes(alt)) {
    content = content.replace(
      /<script src="\/js\/admin\/admin-catalog-types\.js"><\/script>\s*<\/body>/,
      '<script src="/js/admin/admin-catalog-types.js"></script>\n  <script src="/js/admin/admin-catalog-groups.js"></script>\n</body>'
    );
    fs.writeFileSync(filePath, content);
    console.log('Added via regex');
  }
}
