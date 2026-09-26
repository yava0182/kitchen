#!/usr/bin/env node
/**
 * Заменяет textureFileInput.click() / edgeTextureFileInput.click() на openFileManager в admin-new-bundle.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundlePath = path.join(__dirname, '..', 'js', 'admin', 'admin-new-bundle.js');
let content = fs.readFileSync(bundlePath, 'utf8');

// Replace textureFileInput.click(); with openFileManager (re-attach handled by form re-render on next edit)
// Each occurrence is in different scope - textureUrlInput, texturePreview, textureFileInput exist in scope for materials.
content = content.replace(
  /(\s+)textureFileInput\.click\(\);/g,
  (m, space) => {
    return space + `if(typeof window.openFileManager==='function'){window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&textureUrlInput){textureUrlInput.value=r.url;textureUrlInput.dispatchEvent(new Event('input',{bubbles:true}));if(texturePreview)texturePreview.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"material-texture-upload-icon\"></i>';}}})}else textureFileInput.click();`;
  }
);

// normalMapFileInput.click()
content = content.replace(
  /(\s+)normalMapFileInput\.click\(\);/g,
  (m, space) => {
    return space + `if(typeof window.openFileManager==='function'){window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&normalMapUrlInput){normalMapUrlInput.value=r.url;normalMapUrlInput.dispatchEvent(new Event('input',{bubbles:true}));if(normalMapPreview)normalMapPreview.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"material-normal-map-upload-icon\"></i>';}}})}else normalMapFileInput.click();`;
  }
);

// roughnessMapFileInput.click()
content = content.replace(
  /(\s+)roughnessMapFileInput\.click\(\);/g,
  (m, space) => {
    return space + `if(typeof window.openFileManager==='function'){window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&roughnessMapUrlInput){roughnessMapUrlInput.value=r.url;roughnessMapUrlInput.dispatchEvent(new Event('input',{bubbles:true}));if(roughnessMapPreview)roughnessMapPreview.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"material-roughness-map-upload-icon\"></i>';}}})}else roughnessMapFileInput.click();`;
  }
);

// edgeTextureFileInput.click()
content = content.replace(
  /(\s+)edgeTextureFileInput\.click\(\);/g,
  (m, space) => {
    return space + `if(typeof window.openFileManager==='function'){window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&edgeTextureUrlInput){edgeTextureUrlInput.value=r.url;edgeTextureUrlInput.dispatchEvent(new Event('input',{bubbles:true}));if(edgeTexturePreview)edgeTexturePreview.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"edge-texture-upload-icon\"></i>';}}})}else edgeTextureFileInput.click();`;
  }
);

// edgeNormalMapFileInput and edgeRoughnessMapFileInput - check if they exist
content = content.replace(
  /(\s+)edgeNormalMapFileInput\.click\(\);/g,
  (m, space) => {
    return space + `if(typeof window.openFileManager==='function'){window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&edgeNormalMapUrlInput){edgeNormalMapUrlInput.value=r.url;edgeNormalMapUrlInput.dispatchEvent(new Event('input',{bubbles:true}));if(edgeNormalMapPreview)edgeNormalMapPreview.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"edge-normal-map-upload-icon\"></i>';}}})}else edgeNormalMapFileInput.click();`;
  }
);

content = content.replace(
  /(\s+)edgeRoughnessMapFileInput\.click\(\);/g,
  (m, space) => {
    return space + `if(typeof window.openFileManager==='function'){window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&edgeRoughnessMapUrlInput){edgeRoughnessMapUrlInput.value=r.url;edgeRoughnessMapUrlInput.dispatchEvent(new Event('input',{bubbles:true}));if(edgeRoughnessMapPreview)edgeRoughnessMapPreview.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"edge-roughness-map-upload-icon\"></i>';}}})}else edgeRoughnessMapFileInput.click();`;
  }
);

// Edge form: другой код (loadEdgeItemForm?) использует getElementById('edge-*-file').click() — заменить на FM
content = content.replace(
  /icon\.addEventListener\('click', \(e\) => \{ e\.preventDefault\(\); document\.getElementById\('edge-texture-file'\)\.click\(\); \}\);/,
  `icon.addEventListener('click', (e) => { e.preventDefault(); if(typeof window.openFileManager==='function'){var u=document.getElementById('edge-texture-url');var p=document.getElementById('edge-texture-preview');window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&u){u.value=r.url;u.dispatchEvent(new Event('input',{bubbles:true}));if(p)p.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"edge-texture-upload-icon\"></i>';}}});}else document.getElementById('edge-texture-file').click(); });`
);

content = content.replace(
  /icon\.addEventListener\('click', \(e\) => \{ e\.preventDefault\(\); document\.getElementById\('edge-normal-map-file'\)\.click\(\); \}\);/,
  `icon.addEventListener('click', (e) => { e.preventDefault(); if(typeof window.openFileManager==='function'){var u=document.getElementById('edge-normal-map-url');var p=document.getElementById('edge-normal-map-preview');window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&u){u.value=r.url;u.dispatchEvent(new Event('input',{bubbles:true}));if(p)p.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"edge-normal-map-upload-icon\"></i>';}}});}else document.getElementById('edge-normal-map-file').click(); });`
);

content = content.replace(
  /icon\.addEventListener\('click', \(e\) => \{ e\.preventDefault\(\); document\.getElementById\('edge-roughness-map-file'\)\.click\(\); \}\);/,
  `icon.addEventListener('click', (e) => { e.preventDefault(); if(typeof window.openFileManager==='function'){var u=document.getElementById('edge-roughness-map-url');var p=document.getElementById('edge-roughness-map-preview');window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&u){u.value=r.url;u.dispatchEvent(new Event('input',{bubbles:true}));if(p)p.innerHTML='<img src=\"'+String(r.url).replace(/"/g,'&quot;')+'\" style=\"width:100%;height:100%;object-fit:cover\"><i class=\"fa fa-folder-open\" style=\"position:absolute;top:4px;right:4px;color:#1c84c6;cursor:pointer;font-size:16px\" id=\"edge-roughness-map-upload-icon\"></i>';}}});}else document.getElementById('edge-roughness-map-file').click(); });`
);

// edgeItemIconFile.click() — иконка элемента кромки (два места: placeholder и .open_file)
content = content.replace(
  /if \(edgeItemIconFile\) edgeItemIconFile\.click\(\);/g,
  `if(edgeItemIconFile){if(typeof window.openFileManager==='function'){var u=document.getElementById('edge-item-icon');var p=document.getElementById('edge-item-icon-preview-wrapper');window.openFileManager({allowedExt:['.jpg','.jpeg','.png','.webp','.gif','.tif','.tiff'],initialPath:'files',onSelect:function(r){if(r&&r.url&&u){u.value=r.url;u.dispatchEvent(new Event('input',{bubbles:true}));if(p){var img=p.querySelector('img');if(img)img.src=r.url;}}});}else edgeItemIconFile.click();}}`
);
// Исправление уже пропатченного бандла: добавить закрывающую } для тела стрелочной функции
content = content.replace(
  /edgeItemIconFile\.click\(\);\} \}/g,
  'edgeItemIconFile.click();}} }'
);

// facade: fileInput.click() и iconFileInput/normalFileInput — оставляем как есть (3D/специфичные) или добавляем FM по желанию
// facade-size-model-file — 3D модели (.fbx,.glb) — можно оставить системный диалог или добавить FM с allowedExt
// Пока добавляем только image-related. edgeItemIcon и material-item-icon добавлены выше.

fs.writeFileSync(bundlePath, content);

// Копируем в public/, чтобы Vite отдавал бандл как статику и не парсил (иначе import-analysis падает на HTML в строках)
const publicDir = path.join(__dirname, '..', 'public', 'js', 'admin');
const publicPath = path.join(publicDir, 'admin-new-bundle.js');
try {
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(publicPath, content);
  console.log('Patched admin-new-bundle.js and copied to public/js/admin/ (Vite will serve it as static, no parse error)');
} catch (e) {
  console.log('Patched admin-new-bundle.js. Copy to public failed:', e.message);
}
