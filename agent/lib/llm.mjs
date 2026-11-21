/** کلاینت GapGPT (سازگار با OpenAI) با تکرار، مهلت و شمارش توکن */
import { CONFIG } from './config.mjs';
import { log } from './log.mjs';

export const usage = { calls: 0, prompt: 0, completion: 0, byModel: {} };

export async function chat({ model, system, user, temperature = 0.3, maxTokens = 4000, timeoutMs = 180_000, retries = 2 }) {
  if (!CONFIG.apiKey) throw new Error('GAPGPT_API_KEY تنظیم نشده (فایل .env)');
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CONFIG.apiKey}` },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
        signal: ctrl.signal,
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${text.slice(0, 300)}`);
      const data = JSON.parse(text);
      const u = data.usage ?? {};
      usage.calls++; usage.prompt += u.prompt_tokens ?? 0; usage.completion += u.completion_tokens ?? 0;
      const m = (usage.byModel[model] ??= { calls: 0, prompt: 0, completion: 0 });
      m.calls++; m.prompt += u.prompt_tokens ?? 0; m.completion += u.completion_tokens ?? 0;
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error(`${model}: پاسخ خالی`);
      return content;
    } catch (e) {
      lastErr = e;
      log(`LLM خطا (تلاش ${attempt + 1}):`, String(e.message ?? e).slice(0, 300));
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1) ** 2));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

/** JSON را از پاسخ مدل بیرون می‌کشد (حتی اگر داخل ```json باشد) */
export function parseJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  if (start < 0 || end < start) throw new Error('JSON در پاسخ مدل نیست');
  return JSON.parse(raw.slice(start, end + 1));
}

export async function chatJson(opts) {
  const models = [opts.model, CONFIG.fallbackModel].filter((m, i, a) => m && a.indexOf(m) === i);
  let lastErr;
  for (const model of models) {
    for (let i = 0; i < 2; i++) {
      try {
        return { data: parseJson(await chat({ ...opts, model })), model };
      } catch (e) {
        lastErr = e;
        log(`JSON ناموفق از ${model}:`, String(e.message).slice(0, 200));
      }
    }
  }
  throw lastErr;
}
