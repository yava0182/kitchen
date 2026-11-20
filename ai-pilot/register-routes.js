/**
 * AI Pilot API — изолировано от конструктора/комнаты.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SYSTEM_PROMPT,
  INTENT_EXAMPLE,
  APPLY_CONTRACT,
  FILL_OPTIONS,
  PRESETS,
  mockParseIntent,
  intentFromWizard,
  normalizeIntent,
  finalizeIntent,
  summarizeIntent,
  mergePreferDefined,
  extractJsonObject,
} from './intent-schema.js';
import { getCatalogHints } from './catalog-hints.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_FILE = path.join(__dirname, 'ai_pilot_config.json');
const DEFAULT_CONFIG_FILE = path.join(__dirname, 'config.default.json');
const DRAFTS_DIR = path.join(__dirname, 'drafts');

function loadDotEnvOptional() {
  // AI_PILOT.env — видимый в проводнике; .env — скрытый дубликат
  const candidates = [
    path.join(ROOT_DIR, 'AI_PILOT.env'),
    path.join(ROOT_DIR, '.env'),
  ];
  for (const envPath of candidates) {
    try {
      if (!fs.existsSync(envPath)) continue;
      const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq <= 0) continue;
        const key = t.slice(0, eq).trim();
        let val = t.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined || process.env[key] === '') {
          process.env[key] = val;
        }
      }
      console.log('🔑 ai-pilot env loaded:', path.basename(envPath));
    } catch (e) {
      console.warn('⚠️ ai-pilot env:', path.basename(envPath), e?.message || e);
    }
  }
}

loadDotEnvOptional();

function ensureDraftsDir() {
  if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR, { recursive: true });
}

function readDefaultConfig() {
  try {
    return JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf8'));
  } catch {
    return { enabled: true, provider: 'mock', model: '', baseUrl: '', systemPromptExtra: '', maxHistoryMessages: 12 };
  }
}

function readConfig() {
  const def = readDefaultConfig();
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { ...def, ...raw };
    }
  } catch (e) {
    console.warn('⚠️ ai-pilot config read:', e?.message || e);
  }
  return { ...def };
}

/** Разрешённые хосты LLM (анти-SSRF: нельзя подставить свой URL и увести ключ). */
const AI_PILOT_BASEURL_ALLOW = new Set([
  'api.openai.com',
  'api.deepseek.com',
  'llm.api.cloud.yandex.net',
]);

function sanitizeAiPilotBaseUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let u;
  try {
    u = new URL(s);
  } catch {
    const err = new Error('baseUrl: невалидный URL');
    err.code = 'invalid_base_url';
    throw err;
  }
  if (u.protocol !== 'https:') {
    const err = new Error('baseUrl: только https');
    err.code = 'invalid_base_url';
    throw err;
  }
  const host = String(u.hostname || '').toLowerCase();
  if (!AI_PILOT_BASEURL_ALLOW.has(host)) {
    const err = new Error(
      `baseUrl: хост не в allowlist (${[...AI_PILOT_BASEURL_ALLOW].join(', ')})`
    );
    err.code = 'base_url_not_allowed';
    throw err;
  }
  // без query/hash — меньше сюрпризов
  return `${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, '') || `${u.protocol}//${u.host}`;
}

function atomicWriteJsonLocal(filePath, data) {
  const payload = JSON.stringify(data, null, 2);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, payload, 'utf8');
  try {
    fs.renameSync(tmp, filePath);
  } catch (_) {
    fs.copyFileSync(tmp, filePath);
    try {
      fs.unlinkSync(tmp);
    } catch (_) {}
  }
}

function writeConfig(body) {
  const def = readDefaultConfig();
  const next = {
    enabled: body.enabled !== false,
    provider: String(body.provider || def.provider || 'mock'),
    model: String(body.model || ''),
    baseUrl: sanitizeAiPilotBaseUrl(body.baseUrl != null ? body.baseUrl : def.baseUrl),
    systemPromptExtra: String(body.systemPromptExtra || ''),
    maxHistoryMessages: Math.min(40, Math.max(2, Number(body.maxHistoryMessages) || 12)),
    notes: String(body.notes || def.notes || ''),
  };
  atomicWriteJsonLocal(CONFIG_FILE, next);
  return next;
}

function publicConfig(cfg) {
  return {
    ...cfg,
    hasApiKey: Boolean(process.env.AI_PILOT_API_KEY || process.env.OPENAI_API_KEY || process.env.YANDEX_API_KEY),
    apiKeyEnv: 'AI_PILOT_API_KEY',
    intentExample: INTENT_EXAMPLE,
    fillOptions: FILL_OPTIONS,
    presets: PRESETS.map((p) => ({ id: p.id, title: p.title })),
  };
}

function resolveProviderEndpoints(cfg) {
  const provider = String(cfg.provider || 'mock').toLowerCase();
  const apiKey =
    process.env.AI_PILOT_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.YANDEX_API_KEY ||
    '';

  if (provider === 'mock') {
    return { provider: 'mock', apiKey: '', url: '', model: '' };
  }

  const safeBase = (raw, fallback) => {
    try {
      return sanitizeAiPilotBaseUrl(raw) || fallback;
    } catch {
      // старый/левый URL в конфиге — не уводим ключ, берём дефолт провайдера
      return fallback;
    }
  };

  if (provider === 'yandex') {
    const folder = process.env.AI_PILOT_FOLDER_ID || process.env.YANDEX_FOLDER_ID || '';
    const base = safeBase(cfg.baseUrl, 'https://llm.api.cloud.yandex.net/v1');
    const model = cfg.model || (folder ? `gpt://${folder}/yandexgpt-lite` : 'yandexgpt-lite');
    return {
      provider: 'yandex',
      apiKey,
      url: `${base.replace(/\/$/, '')}/chat/completions`,
      model,
      folder,
    };
  }

  const defaultOpenAi =
    provider === 'deepseek' || /deepseek/i.test(String(cfg.baseUrl || ''))
      ? 'https://api.deepseek.com/v1'
      : 'https://api.openai.com/v1';
  const base = safeBase(cfg.baseUrl, defaultOpenAi);
  const model = cfg.model || (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');
  return {
    provider,
    apiKey,
    url: `${base.replace(/\/$/, '')}/chat/completions`,
    model,
  };
}

async function callChatCompletions(endpoint, messages, systemExtra) {
  if (!endpoint.apiKey) {
    const err = new Error('Нет API-ключа. Задайте AI_PILOT_API_KEY или provider=mock.');
    err.code = 'no_api_key';
    throw err;
  }

  const systemContent = [SYSTEM_PROMPT, systemExtra].filter(Boolean).join('\n\n');
  const body = {
    model: endpoint.model,
    temperature: 0.2,
    messages: [{ role: 'system', content: systemContent }, ...messages],
  };

  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${endpoint.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(data?.error?.message || data?.message || `LLM HTTP ${res.status}`);
    err.code = 'llm_http';
    err.status = res.status;
    err.details = data;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error('Пустой ответ модели');
    err.code = 'empty_llm';
    err.details = data;
    throw err;
  }
  return String(content);
}

function listDrafts() {
  ensureDraftsDir();
  return fs
    .readdirSync(DRAFTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(DRAFTS_DIR, f), 'utf8'));
        return {
          id: raw.id || f.replace(/\.json$/, ''),
          title: raw.title || 'Без названия',
          source: raw.source || '',
          ready: !!raw.intent?.ready,
          updatedAt: raw.updatedAt || raw.createdAt || null,
          room_mm: raw.intent?.room_mm || null,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

function safeDraftId(id) {
  const s = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return s.slice(0, 64);
}

/**
 * @param {import('express').Express} app
 */
export function registerAiPilotRoutes(app) {
  ensureDraftsDir();

  app.get('/api/ai-pilot/health', (_req, res) => {
    const cfg = readConfig();
    res.json({
      ok: true,
      module: 'ai-pilot',
      constructor_touched: false,
      enabled: cfg.enabled !== false,
      provider: cfg.provider,
      hasApiKey: publicConfig(cfg).hasApiKey,
      ts: Date.now(),
    });
  });

  app.get('/api/ai-pilot/config', (_req, res) => {
    try {
      res.json(publicConfig(readConfig()));
    } catch (e) {
      res.status(500).json({ error: e?.message || 'read_error' });
    }
  });

  app.post('/api/ai-pilot/config', (req, res) => {
    try {
      const body = req.body || {};
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'invalid_body' });
      }
      if (body.apiKey || body.AI_PILOT_API_KEY) {
        return res.status(400).json({
          error: 'api_key_via_env_only',
          message: 'Ключ задавайте в AI_PILOT_API_KEY, не в JSON конфиге.',
        });
      }
      const saved = writeConfig(body);
      res.json({ result: 'success', data: publicConfig(saved) });
    } catch (e) {
      const code =
        e?.code === 'invalid_base_url' || e?.code === 'base_url_not_allowed' ? 400 : 500;
      res.status(code).json({
        result: 'error',
        error: e?.code || 'write_error',
        message: e?.message || 'write_error',
      });
    }
  });

  app.get('/api/ai-pilot/apply-contract', (_req, res) => {
    res.json(APPLY_CONTRACT);
  });

  app.get('/api/ai-pilot/catalog-hints', (_req, res) => {
    try {
      res.json(getCatalogHints());
    } catch (e) {
      res.status(500).json({ error: e?.message || 'hints_error' });
    }
  });

  app.get('/api/ai-pilot/presets', (_req, res) => {
    res.json({
      presets: PRESETS.map((p) => ({
        id: p.id,
        title: p.title,
        intent: finalizeIntent({ ...p.intent, assistant_message: '' }, { source: 'preset' }),
      })),
    });
  });

  app.post('/api/ai-pilot/summarize', (req, res) => {
    try {
      const intent = finalizeIntent(normalizeIntent(req.body?.intent || req.body || {}), {
        source: 'summarize',
      });
      res.json({
        result: 'success',
        summary: summarizeIntent(intent),
        intent,
        applyToConstructor: false,
      });
    } catch (e) {
      res.status(500).json({ error: e?.message || 'summarize_error' });
    }
  });

  app.post('/api/ai-pilot/wizard', (req, res) => {
    try {
      const intent = intentFromWizard(req.body || {});
      res.json({
        result: 'success',
        provider: 'wizard',
        reply: intent.assistant_message,
        intent,
        summary: summarizeIntent(intent),
        applyToConstructor: false,
        note: 'Мастер → JSON. Конструктор не вызывается.',
      });
    } catch (e) {
      res.status(500).json({ error: e?.message || 'wizard_error' });
    }
  });

  app.get('/api/ai-pilot/drafts', (_req, res) => {
    try {
      res.json({ drafts: listDrafts() });
    } catch (e) {
      res.status(500).json({ error: e?.message || 'list_error' });
    }
  });

  app.get('/api/ai-pilot/drafts/:id', (req, res) => {
    try {
      const id = safeDraftId(req.params.id);
      const file = path.join(DRAFTS_DIR, `${id}.json`);
      if (!id || !fs.existsSync(file)) return res.status(404).json({ error: 'not_found' });
      res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (e) {
      res.status(500).json({ error: e?.message || 'read_error' });
    }
  });

  app.post('/api/ai-pilot/drafts', (req, res) => {
    try {
      ensureDraftsDir();
      const body = req.body || {};
      const intent = finalizeIntent(normalizeIntent(body.intent || body), { source: body.source || 'draft' });
      const id = safeDraftId(body.id) || `draft_${Date.now()}`;
      const now = new Date().toISOString();
      const file = path.join(DRAFTS_DIR, `${id}.json`);
      let createdAt = now;
      if (fs.existsSync(file)) {
        try {
          createdAt = JSON.parse(fs.readFileSync(file, 'utf8')).createdAt || now;
        } catch {
          /* keep now */
        }
      }
      const doc = {
        id,
        title: String(body.title || `ТЗ ${intent.room_mm.width || '?'}×${intent.room_mm.height || '?'}`).slice(0, 120),
        source: String(body.source || intent.notes || 'manual'),
        createdAt,
        updatedAt: now,
        intent,
        applyToConstructor: false,
      };
      fs.writeFileSync(file, JSON.stringify(doc, null, 2), 'utf8');
      res.json({ result: 'success', draft: doc });
    } catch (e) {
      res.status(500).json({ error: e?.message || 'save_error' });
    }
  });

  app.delete('/api/ai-pilot/drafts/:id', (req, res) => {
    try {
      const id = safeDraftId(req.params.id);
      const file = path.join(DRAFTS_DIR, `${id}.json`);
      if (!id || !fs.existsSync(file)) return res.status(404).json({ error: 'not_found' });
      fs.unlinkSync(file);
      res.json({ result: 'success', id });
    } catch (e) {
      res.status(500).json({ error: e?.message || 'delete_error' });
    }
  });

  app.post('/api/ai-pilot/chat', async (req, res) => {
    try {
      const cfg = readConfig();
      if (cfg.enabled === false) {
        return res.status(403).json({ error: 'disabled', message: 'AI Pilot выключен в конфиге.' });
      }

      const message = String(req.body?.message || '').trim();
      if (!message) return res.status(400).json({ error: 'empty_message' });

      const historyIn = Array.isArray(req.body?.history) ? req.body.history : [];
      const maxH = cfg.maxHistoryMessages || 12;
      const history = historyIn
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
        .slice(-maxH)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

      const endpoint = resolveProviderEndpoints(cfg);
      const previousIntent = req.body?.previousIntent
        ? normalizeIntent(req.body.previousIntent)
        : null;

      let intent;
      let providerUsed = endpoint.provider;
      let rawModelText = null;

      if (endpoint.provider === 'mock') {
        intent = mockParseIntent(message, history, previousIntent);
      } else {
        try {
          const messages = [...history, { role: 'user', content: message.slice(0, 4000) }];
          rawModelText = await callChatCompletions(endpoint, messages, cfg.systemPromptExtra);
          const parsed = extractJsonObject(rawModelText);
          let parsedIntent = finalizeIntent(
            normalizeIntent(parsed || { assistant_message: rawModelText, ready: false }),
            { source: endpoint.provider }
          );
          if (previousIntent) {
            parsedIntent = finalizeIntent(mergePreferDefined(previousIntent, parsedIntent), {
              source: endpoint.provider,
            });
          }
          intent = parsedIntent;
          if (parsed?.assistant_message) intent.assistant_message = String(parsed.assistant_message);
          else if (!intent.assistant_message && rawModelText) {
            intent.assistant_message = String(rawModelText).slice(0, 2000);
          }
        } catch (e) {
          if (e?.code === 'no_api_key') {
            providerUsed = 'mock_fallback';
            intent = mockParseIntent(message, history, previousIntent);
            intent.notes = (intent.notes || '') + ' | fallback: нет API-ключа';
            intent.assistant_message = 'Ключ AI не задан — работаю в mock. ' + intent.assistant_message;
          } else {
            console.error('❌ ai-pilot LLM:', e?.message || e);
            return res.status(502).json({
              error: e?.code || 'llm_error',
              message: e?.message || 'llm_error',
              details: e?.details || undefined,
            });
          }
        }
      }

      res.json({
        result: 'success',
        provider: providerUsed,
        model: endpoint.model || null,
        reply: intent.assistant_message,
        intent,
        summary: summarizeIntent(intent),
        rawModelText: rawModelText ? String(rawModelText).slice(0, 8000) : null,
        applyToConstructor: false,
        note: 'Конструктор не вызывается. Это только ТЗ (intent JSON).',
      });
    } catch (e) {
      console.error('❌ POST /api/ai-pilot/chat:', e);
      res.status(500).json({ error: e?.message || 'chat_error' });
    }
  });

  console.log('🤖 AI Pilot routes: /api/ai-pilot/*  | UI: /ai-pilot.html');
}
