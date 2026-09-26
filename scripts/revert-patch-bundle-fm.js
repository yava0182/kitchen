#!/usr/bin/env node
/**
 * Откат патчей FM в admin-new-bundle.js: возвращаем простые .click() вместо openFileManager.
 * После отката бандл снова валидный; FM везде — через делегирование в admin-new-extra-3.js.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundlePath = path.join(__dirname, '..', 'js', 'admin', 'admin-new-bundle.js');
let content = fs.readFileSync(bundlePath, 'utf8');

// Удаляем все наши вставки openFileManager, оставляем только .click()
// Блоки заканчиваются на }else XXX.click(); — матчим до этого и заменяем на XXX.click();

content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[\s\S]*?\}else textureFileInput\.click\(\);/g,
  'textureFileInput.click();'
);
content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[\s\S]*?\}else normalMapFileInput\.click\(\);/g,
  'normalMapFileInput.click();'
);
content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[\s\S]*?\}else roughnessMapFileInput\.click\(\);/g,
  'roughnessMapFileInput.click();'
);
content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[\s\S]*?\}else edgeTextureFileInput\.click\(\);/g,
  'edgeTextureFileInput.click();'
);
content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[\s\S]*?\}else edgeNormalMapFileInput\.click\(\);/g,
  'edgeNormalMapFileInput.click();'
);
content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[\s\S]*?\}else edgeRoughnessMapFileInput\.click\(\);/g,
  'edgeRoughnessMapFileInput.click();'
);

// Edge getElementById блоки — возвращаем простой document.getElementById('...').click();
content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[^}]*getElementById\('edge-texture-url'\)[\s\S]*?\}else document\.getElementById\('edge-texture-file'\)\.click\(\); \}\);/g,
  "document.getElementById('edge-texture-file').click(); });"
);
content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[^}]*getElementById\('edge-normal-map-url'\)[\s\S]*?\}else document\.getElementById\('edge-normal-map-file'\)\.click\(\); \}\);/g,
  "document.getElementById('edge-normal-map-file').click(); });"
);
content = content.replace(
  /if\(typeof window\.openFileManager==='function'\)\{[^}]*getElementById\('edge-roughness-map-url'\)[\s\S]*?\}else document\.getElementById\('edge-roughness-map-file'\)\.click\(\); \}\);/g,
  "document.getElementById('edge-roughness-map-file').click(); });"
);

// edgeItemIconFile — возвращаем if (edgeItemIconFile) edgeItemIconFile.click(); (одна } в конце — тело стрелочной функции)
content = content.replace(
  /if\(edgeItemIconFile\)\{if\(typeof window\.openFileManager==='function'\)\{[\s\S]*?\}else edgeItemIconFile\.click\(\);\}\}/g,
  'if (edgeItemIconFile) edgeItemIconFile.click(); }'
);

fs.writeFileSync(bundlePath, content);

const publicPath = path.join(__dirname, '..', 'public', 'js', 'admin', 'admin-new-bundle.js');
if (fs.existsSync(publicPath)) {
  fs.writeFileSync(publicPath, content);
  console.log('Reverted admin-new-bundle.js (js/admin + public). Use delegation in admin-new-extra-3.js for FM.');
} else {
  console.log('Reverted admin-new-bundle.js in js/admin.');
}
