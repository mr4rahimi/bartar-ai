#!/usr/bin/env node
/**
 * جمع‌بندی هفتگی — جمعه عصر به وقت تهران (cron). هفته = شنبه تا جمعه.
 * خروجی: src/content/weekly/<YYYY-MM-DD شمسیِ جمعه>.md  →  /weekly/<id>/ و /weekly/<id>.json و /weekly/latest.json
 * متن ویدیو (videoScript) در JSON است، نه روی صفحه — برای برنامه‌ی ساخت ویدیو.
 *
 *   --no-build   فقط فایل
 *   --force      اگر فایل این هفته هست، بازنویسی شود
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG, ROOT } from './lib/config.mjs';
import { log } from './lib/log.mjs';
import { chatJson, usage } from './lib/llm.mjs';
import { publishedNews, writeMarkdown, lock } from './lib/store.mjs';
import { cleanFa } from './lib/text.mjs';
import { gitPull, gitCommit, build, deploy, indexNow } from './lib/publish.mjs';

const args = new Set(process.argv.slice(2));
const unlock = lock('weekly');
if (!unlock) process.exit(0);

const jParts = (d) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const faLong = (d) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

try {
  gitPull();
  // ساعت تهران به‌صورت «ساعت محلی جعلی» تا شنبه‌ی ۰۰:۰۰ تهران را بتوان حساب کرد
  const now = new Date();
  const tNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));
  const offset = tNow.getTime() - now.getTime();
  const daysSinceFriday = (tNow.getDay() - 5 + 7) % 7; // جمعه = 5
  const tEnd = new Date(tNow); tEnd.setDate(tNow.getDate() - daysSinceFriday); tEnd.setHours(23, 59, 59, 0);
  const tStart = new Date(tEnd); tStart.setDate(tEnd.getDate() - 6); tStart.setHours(0, 0, 0, 0);
  const end = new Date(Math.min(tEnd.getTime() - offset, now.getTime()));
  const from = new Date(tStart.getTime() - offset);
  const id = jParts(end);
  const file = join(CONFIG.weeklyDir, `${id}.md`);
  if (existsSync(file) && !args.has('--force')) { log(`جمع‌بندی ${id} از قبل هست`); throw 'done'; }

  const news = publishedNews().filter((n) => n.pubDate >= from && n.pubDate <= end && !n.draft);
  log(`هفته ${id}: ${news.length} خبر`);
  if (news.length < 3) { log('خبر کافی نیست'); throw 'done'; }

  const prompt = readFileSync(join(ROOT, 'agent/prompts/weekly.md'), 'utf8');
  const user = JSON.stringify(news.map((n) => ({ slug: n.slug, title: n.title, description: n.description, importance: n.importance, category: n.category, keyPoints: n.keyPoints })));
  const { data: out, model } = await chatJson({ model: CONFIG.writerModel, system: prompt, user, temperature: 0.5, maxTokens: 8000 });
  const valid = new Set(news.map((n) => n.slug));
  const items = (out.items ?? []).filter((i) => valid.has(i.slug)).slice(0, 10).map((i, k) => ({ slug: i.slug, rank: k + 1, note: cleanFa(String(i.note ?? '')).trim() }));
  if (items.length < 3) throw new Error('خروجی مدل فهرست معتبر ندارد');

  const label = `${faLong(from)} تا ${faLong(end)}`;
  const data = {
    title: cleanFa(out.title).trim(),
    description: cleanFa(out.description).trim(),
    weekLabel: label,
    weekStart: from.toISOString(),
    weekEnd: end.toISOString(),
    pubDate: now.toISOString(),
    items,
    videoScript: cleanFa(String(out.videoScript ?? '')).trim(),
    model,
  };
  const path = writeMarkdown(CONFIG.weeklyDir, id, data, cleanFa(String(out.intro ?? '')));
  log(`✓ جمع‌بندی هفتگی: ${id} — ${data.title}`);
  if (!args.has('--no-build')) {
    build();
    gitCommit(`weekly: ${id}`, [path]);
    deploy();
    await indexNow([`/weekly/${id}/`]);
  }
} catch (e) {
  if (e !== 'done') { log('خطا:', String(e?.stack ?? e)); process.exitCode = 1; }
} finally {
  log(`توکن: ${usage.prompt}+${usage.completion}`);
  unlock();
}
