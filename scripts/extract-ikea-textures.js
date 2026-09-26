/**
 * Распаковка текстур из IKEA GLB файлов
 *
 * Использование (после установки зависимостей):
 *   npm install @gltf-transform/core @gltf-transform/extensions --save-dev
 *   node scripts/extract-ikea-textures.js public/downloads/new_wall_1.glb public/downloads/new_wooden_floor.glb
 *
 * Или через npx gltf-transform (проще, не требует установки):
 *   npx gltf-transform extract public/downloads/new_wall_1.glb public/images/textures/ikea/wall/
 *   npx gltf-transform extract public/downloads/new_wooden_floor.glb public/images/textures/ikea/floor/
 *
 * Скачайте GLB из IKEA Planner (DevTools → Network):
 * - wall:  /addon-app/storageone/assets/generic/materials/room/wall/new_wall_1.glb
 * - floor: /addon-app/storageone/assets/generic/materials/room/floor/new_wooden_floor.glb
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_WALL = join(ROOT, 'public/images/textures/ikea/wall');
const OUTPUT_FLOOR = join(ROOT, 'public/images/textures/ikea/floor');

async function extractWithGltfTransform(glbPath, outputDir, label) {
  if (!existsSync(glbPath)) {
    console.warn(`⚠️ Файл не найден: ${glbPath}`);
    return false;
  }
  try {
    const { NodeIO } = await import('@gltf-transform/core');
    let extensions;
    try {
      const extModule = await import('@gltf-transform/extensions');
      extensions = extModule.ALL_EXTENSIONS;
    } catch (e) {
      console.warn(`  ⚠️ @gltf-transform/extensions не установлен. Установите: npm install @gltf-transform/extensions`);
      console.warn(`  Продолжаю без расширений (может не работать с KHR_texture_transform)...`);
      extensions = [];
    }
    
    const io = new NodeIO();
    if (extensions.length > 0) {
      io.registerExtensions(extensions);
    }
    
    const glb = readFileSync(glbPath);
    const doc = await io.readBinary(new Uint8Array(glb));
    
    mkdirSync(outputDir, { recursive: true });
    
    // Собираем все текстуры и их использование в материалах
    const textures = doc.getRoot().listTextures();
    const materials = doc.getRoot().listMaterials();
    
    // Маппинг текстур к их типам
    const textureMap = new Map();
    
    // Проходим по материалам и определяем типы текстур
    for (const mat of materials) {
      const baseColorTex = mat.getBaseColorTexture();
      const normalTex = mat.getNormalTexture();
      const metallicRoughnessTex = mat.getMetallicRoughnessTexture();
      
      if (baseColorTex) {
        const texIndex = textures.indexOf(baseColorTex);
        if (texIndex >= 0) textureMap.set(texIndex, 'diffuse');
      }
      if (normalTex) {
        const texIndex = textures.indexOf(normalTex.texture);
        if (texIndex >= 0) textureMap.set(texIndex, 'normal');
      }
      if (metallicRoughnessTex) {
        const texIndex = textures.indexOf(metallicRoughnessTex);
        if (texIndex >= 0) textureMap.set(texIndex, 'roughness');
      }
    }
    
    let count = 0;
    const savedTypes = new Set();
    
    for (let i = 0; i < textures.length; i++) {
      const tex = textures[i];
      const img = tex.getImage();
      if (img) {
        const ext = (tex.getMimeType() || '').includes('png') ? 'png' : 'jpg';
        let name;
        
        // Пытаемся определить тип по материалам
        const type = textureMap.get(i);
        if (type && !savedTypes.has(type)) {
          name = `${type}.${ext}`;
          savedTypes.add(type);
        } else {
          // Если тип не определён или уже сохранён, используем порядковый номер
          name = `texture_${count}.${ext}`;
        }
        
        const filePath = join(outputDir, name);
        writeFileSync(filePath, Buffer.from(img));
        console.log(`  ✅ ${label}: ${name}${type ? ` (${type})` : ''}`);
        count++;
      }
    }
    
    if (count === 0) {
      console.warn(`  ⚠️ Текстуры в ${glbPath} не найдены`);
    } else {
      console.log(`  📦 Всего извлечено: ${count} текстур`);
      if (!savedTypes.has('diffuse')) {
        console.warn(`  ⚠️ Не найдена diffuse текстура. Переименуйте texture_0 в diffuse.jpg вручную.`);
      }
      if (!savedTypes.has('normal')) {
        console.warn(`  ⚠️ Не найдена normal текстура. Переименуйте texture_1 в normal.jpg вручную.`);
      }
    }
    
    return count > 0;
  } catch (e) {
    console.error(`  ❌ Ошибка: ${e.message}`);
    console.warn(`  Альтернатива: npx gltf-transform extract ${glbPath} ${outputDir}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Использование: node scripts/extract-ikea-textures.js <wall.glb> [floor.glb]

ВАЖНО: Запускайте из папки Configurator-Clodis-ThreeJS-7!

Пример:
  cd D:\\Configurator-Clodis-ThreeJS-14\\Configurator-Clodis-ThreeJS-7
  node scripts/extract-ikea-textures.js public/downloads/new_wall_1.glb public/downloads/new_wooden_floor.glb

Или через npm (из папки Configurator-Clodis-ThreeJS-7):
  npm run extract-ikea -- public/downloads/new_wall_1.glb public/downloads/new_wooden_floor.glb
`);
    process.exit(1);
  }
  
  // Проверяем, что мы в правильной директории
  const wallPath = args[0];
  const floorPath = args[1] || args[0];
  
  if (!existsSync(wallPath)) {
    console.error(`❌ Ошибка: файл не найден: ${wallPath}`);
    console.error(`   Убедитесь, что вы запускаете скрипт из папки Configurator-Clodis-ThreeJS-7`);
    console.error(`   Текущая рабочая директория: ${process.cwd()}`);
    process.exit(1);
  }
  
  console.log('Распаковка IKEA текстур...\n');
  console.log(`  📁 Wall GLB: ${wallPath}`);
  if (floorPath !== wallPath) {
    console.log(`  📁 Floor GLB: ${floorPath}`);
  }
  console.log('');
  
  if (wallPath === floorPath) {
    await extractWithGltfTransform(wallPath, OUTPUT_WALL, 'wall');
  } else {
    await extractWithGltfTransform(wallPath, OUTPUT_WALL, 'wall');
    await extractWithGltfTransform(floorPath, OUTPUT_FLOOR, 'floor');
  }
  console.log('\n✅ Готово! Текстуры сохранены в:');
  console.log(`   - ${OUTPUT_WALL}`);
  console.log(`   - ${OUTPUT_FLOOR}`);
  console.log('\nТеперь запустите сервер и проверьте комнату в браузере.');
}

main().catch(console.error);
