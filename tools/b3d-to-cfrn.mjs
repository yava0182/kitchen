#!/usr/bin/env node
/**
 * b3d → cfrn через прокси Clodis-сервера (Bazis convertType=0).
 * Нужен запущенный server.js и доступ к API Bazis (ключ уже в server.js).
 *
 *   node server.js
 *   node tools/b3d-to-cfrn.mjs "Ящик высокий 600 с фасадом.b3d"
 *   node tools/b3d-to-cfrn.mjs model.b3d -o out.cfrn --parse
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_BASE = process.env.CLODIS_SERVER || 'http://localhost:3000';
const POLL_MS = 5000;
const MAX_ATTEMPTS = 60;

function usage() {
  console.log(`Usage: node tools/b3d-to-cfrn.mjs <file.b3d> [-o out.cfrn] [--server URL] [--parse]`);
  console.log('  Требуется: node server.js (прокси /api/bazis_convert_b3d)');
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (!args.length) usage();
  let input = null;
  let output = null;
  let server = DEFAULT_BASE;
  let parseAfter = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-o' || a === '--out') {
      output = args[++i];
      continue;
    }
    if (a === '--server') {
      server = args[++i];
      continue;
    }
    if (a === '--parse') {
      parseAfter = true;
      continue;
    }
    if (!a.startsWith('-') && !input) input = a;
  }
  if (!input) usage();
  if (!output) output = input.replace(/\.b3d$/i, '.cfrn');
  return { input: path.resolve(input), output: path.resolve(output), server, parseAfter };
}

function buildMultipart(boundary, fields, fileField, fileBuf, fileName) {
  const chunks = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    );
  }
  chunks.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
    )
  );
  chunks.push(fileBuf);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

async function uploadB3d(server, b3dPath) {
  const buf = fs.readFileSync(b3dPath);
  const boundary = `clodis${Date.now()}`;
  const body = buildMultipart(boundary, { convertType: '0' }, 'models', buf, path.basename(b3dPath));
  const url = `${server.replace(/\/$/, '')}/config/index.php/api/bazis_convert_b3d`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`upload ${resp.status}: ${text.slice(0, 400)}`);
  const taskId = text.replace(/["\s]/g, '');
  if (!taskId) throw new Error(`пустой taskId: ${text}`);
  return taskId;
}

async function pollCfrn(server, taskId) {
  const base = server.replace(/\/$/, '');
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const url = `${base}/config/index.php/api/bazis_check_task/${encodeURIComponent(taskId)}`;
    const resp = await fetch(url);
    if (resp.status === 200) {
      const buf = Buffer.from(await resp.arrayBuffer());
      return buf;
    }
    const body = await resp.text();
    if (resp.status !== 202 && resp.status !== 404) {
      throw new Error(`poll ${resp.status}: ${body.slice(0, 300)}`);
    }
    process.stdout.write(`  ожидание ${i + 1}/${MAX_ATTEMPTS}...\r`);
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error('таймаут ожидания CFRN от Bazis');
}

function runParse(cfrnPath) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, 'parse-cfrn.mjs');
    const child = spawn(process.execPath, [script, cfrnPath, '--compare-clodis'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`parse exit ${code}`))));
  });
}

async function main() {
  const { input, output, server, parseAfter } = parseArgs(process.argv);
  if (!fs.existsSync(input)) throw new Error(`Файл не найден: ${input}`);

  console.log(`Upload ${path.basename(input)} (${fs.statSync(input).size} B) → ${server}`);
  const taskId = await uploadB3d(server, input);
  console.log(`Task: ${taskId}`);

  const zipBuf = await pollCfrn(server, taskId);
  fs.writeFileSync(output, zipBuf);
  console.log(`\nWrote ${output} (${zipBuf.length} B)`);

  if (parseAfter) {
    console.log('Parsing CFRN...');
    await runParse(output);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
