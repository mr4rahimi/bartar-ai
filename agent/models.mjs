// فهرست مدل‌های در دسترس حساب GapGPT
import { CONFIG } from './lib/config.mjs';
const res = await fetch(`${CONFIG.baseUrl}/models`, { headers: { Authorization: `Bearer ${CONFIG.apiKey}` } });
const ids = ((await res.json()).data ?? []).map((m) => m.id).sort();
console.log(`${res.status} — ${ids.length} مدل\n${ids.join('\n')}`);
console.log(`\nفعلی: triage=${CONFIG.triageModel} writer=${CONFIG.writerModel} fallback=${CONFIG.fallbackModel}`);
