#!/usr/bin/env node
/**
 * مقایسه‌ی مدل‌های نویسنده روی یک منبع یکسان — چیزی منتشر نمی‌شود.
 *   node agent/compare-models.mjs <url> <outdir> model1 model2 ...
 * قیمت‌ها ($ برای هر ۱M توکن، ورودی/خروجی) از پنل GapGPT، ۲۰۲۶-۱۱-۲۲.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/config.mjs';
import { chat, parseJson, usage } from './lib/llm.mjs';
import { extract } from './lib/extract.mjs';
import { cleanFa, wordCount, persianRatio } from './lib/text.mjs';

import { PRICE } from './lib/pricing.mjs';

const [url, out, ...models] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const cats = JSON.parse(readFileSync(join(ROOT, 'src/data/categories.json'), 'utf8')).map((c) => `${c.slug} (${c.name})`).join('، ');
const system = readFileSync(join(ROOT, 'agent/prompts/writer.md'), 'utf8').replaceAll('{{CATEGORIES}}', cats);
const a = await extract(url);
const user = `### منبع 1\nعنوان: ${a.title}\nنشانی: ${a.url}\n\n${a.text.slice(0, 12000)}`;
console.log(`منبع: ${a.text.length} نویسه`);

await Promise.all(models.map(async (model) => {
  const t0 = Date.now();
  try {
    const raw = await chat({ model, system, user, temperature: 0.4, maxTokens: 6000, retries: 0 });
    const u = usage.byModel[model];
    const [ci, co] = PRICE[model] ?? [NaN, NaN];
    let o;
    try { o = parseJson(raw); } catch { o = null; }
    const body = o ? cleanFa(o.body ?? '') : '';
    writeFileSync(join(out, `${model}.md`), o
      ? `# ${cleanFa(o.title)}\n\n> ${cleanFa(o.description)}\n\n${(o.keyPoints ?? []).map((k) => '- ' + cleanFa(k)).join('\n')}\n\n${body}`
      : raw);
    console.log(`${model.padEnd(20)} ${((Date.now() - t0) / 1000).toFixed(0)}s  in=${u.prompt} out=${u.completion}  $${((u.prompt * ci + u.completion * co) / 1e6).toFixed(4)}  json=${o ? 'ok' : 'BAD'}  words=${wordCount(body)}  fa=${persianRatio(body).toFixed(2)}`);
  } catch (e) {
    console.log(`${model.padEnd(20)} خطا: ${String(e.message).slice(0, 120)}`);
  }
}));
