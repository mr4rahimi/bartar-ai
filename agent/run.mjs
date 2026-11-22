#!/usr/bin/env node
/**
 * ایجنت خبر برتر AI — هر ۴ ساعت (cron/systemd روی سرور فرانکفورت).
 *
 *   ۱. خواندن همه‌ی منابع (agent/sources.json)
 *   ۲. حذف دیده‌شده‌ها و قدیمی‌ها
 *   ۳. غربال با مدل ارزان: مرتبط بودن، اهمیت، دسته، یکی کردن رویدادهای تکراری
 *   ۴. خواندن متن کامل منبع و نوشتن خبر فارسی با مدل قوی
 *   ۵. بررسی کیفیت ← فایل .md ← گیت ← بیلد ← دیپلوی ← IndexNow
 *
 * گزینه‌ها:
 *   --dry        فقط غربال و گزارش؛ هیچ خبری نوشته نمی‌شود (بدون مدل نویسنده)
 *   --limit=N    حداکثر N خبر در این اجرا
 *   --no-build   فایل‌ها نوشته شوند ولی بیلد/دیپلوی نشود
 *   --url=URL    فقط همین یک نشانی را بنویس (برای آزمایش)
 */
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG, ROOT } from './lib/config.mjs';
import { log } from './lib/log.mjs';
import { chatJson, usage } from './lib/llm.mjs';
import { fetchAll, canonicalUrl } from './lib/feeds.mjs';
import { extract } from './lib/extract.mjs';
import { loadSeen, saveSeen, publishedNews, writeMarkdown, lock } from './lib/store.mjs';
import { cleanFa, persianRatio, wordCount, slugify, similarity, tehranDay } from './lib/text.mjs';
import { gitPull, gitCommit, gitPush, build, deploy, indexNow } from './lib/publish.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const DRY = !!args.dry;
const sources = JSON.parse(readFileSync(join(ROOT, 'agent/sources.json'), 'utf8'));
const srcById = Object.fromEntries(sources.map((s) => [s.id, s]));
const categories = JSON.parse(readFileSync(join(ROOT, 'src/data/categories.json'), 'utf8'));
const catIds = categories.map((c) => c.slug);
const catList = categories.map((c) => `${c.slug} (${c.name})`).join('، ');
const prompt = (name) => readFileSync(join(ROOT, `agent/prompts/${name}.md`), 'utf8').replaceAll('{{CATEGORIES}}', catList);

const unlock = lock();
if (!unlock) { log('اجرای دیگری در جریان است؛ خروج'); process.exit(0); }
const started = Date.now();
const report = { at: new Date().toISOString(), dry: DRY, fetched: 0, fresh: 0, picked: [], published: [], rejected: [], errors: [] };

try {
  gitPull();
  const seen = loadSeen();
  const published = publishedNews();
  const today = tehranDay();
  const todayCount = published.filter((n) => tehranDay(n.pubDate) === today).length;
  const budget = Math.min(Number(args.limit ?? CONFIG.perRun), CONFIG.perDay - todayCount);
  log(`شروع — امروز ${todayCount} خبر منتشر شده، سهمیه‌ی این اجرا ${budget}`);
  if (budget <= 0 && !args.url) { log('سهمیه‌ی روز پر است'); throw 'done'; }

  // ── ۱–۲. جمع‌آوری ─────────────────────────────
  let candidates;
  if (args.url) {
    candidates = [{ title: '', url: canonicalUrl(args.url), summary: '', source: sources.find((s) => args.url.includes(new URL(s.url).hostname.replace(/^www\./, '')))?.id ?? 'other', publishedAt: new Date() }];
  } else {
    const { items, stats } = await fetchAll(sources);
    report.fetched = items.length;
    log('منابع:', stats);
    const publishedUrls = new Set(published.flatMap((n) => n.sources?.map((s) => canonicalUrl(s.url)) ?? []));
    const cutoff = Date.now() - CONFIG.maxAgeHours * 3.6e6;
    const uniq = new Map();
    for (const it of items) {
      if (seen[it.url] || publishedUrls.has(it.url) || uniq.has(it.url)) continue;
      if (it.publishedAt && !isNaN(it.publishedAt) && it.publishedAt.getTime() < cutoff) continue;
      uniq.set(it.url, it);
    }
    candidates = [...uniq.values()];
    // صفحه‌های HTML بی‌تاریخ: اولین بار که دیده می‌شوند فقط ثبت شوند، مگر واقعاً تازه باشند (تاریخ از خود مقاله)
    for (const c of candidates.filter((c) => c.needsDate)) {
      try {
        const a = await extract(c.url, 4000);
        c.publishedAt = a.publishedAt; c.summary = a.text.slice(0, 500); c.prefetched = a;
      } catch { c.publishedAt = null; }
    }
    candidates = candidates.filter((c) => !c.needsDate || (c.publishedAt && c.publishedAt.getTime() >= cutoff));
    for (const c of uniq.values()) if (c.needsDate && !candidates.includes(c)) seen[c.url] = { at: Date.now(), r: 'old' };
    report.fresh = candidates.length;
    log(`${items.length} مورد خوانده شد، ${candidates.length} مورد تازه`);
  }
  if (!candidates.length) throw 'done';

  // ── ۳. غربال ─────────────────────────────────
  const recentPublished = published.filter((n) => Date.now() - n.pubDate < 5 * 864e5).slice(0, 60);
  let picks;
  if (args.url) {
    picks = [{ items: candidates, importance: 10, category: null }];
  } else {
    // روز کم‌خبر (آخر هفته، تعطیلات): آستانه یک پله پایین‌تر تا سایت خالی نماند
    const last24 = published.filter((n) => Date.now() - n.pubDate < 864e5).length;
    const minImp = last24 < CONFIG.quietBelow ? CONFIG.minImportanceQuiet : CONFIG.minImportance;
    log(`${last24} خبر در ۲۴ ساعت اخیر → آستانه‌ی اهمیت ${minImp}`);
    const triaged = [];
    // مدل ارزان گاهی بخشی از موارد را جا می‌اندازد (۲۰۲۶-۱۱-۲۲: ۱۲ پاسخ برای ۳۶ مورد)؛
    // دسته‌های کوچک‌تر و پرسیدن دوباره‌ی جاافتاده‌ها، حداکثر دو دور
    let pending = candidates.slice();
    for (let round = 0; round < 3 && pending.length; round++) {
      const missing = [];
      for (let off = 0; off < pending.length; off += 25) {
        const batch = pending.slice(off, off + 25);
        const user = JSON.stringify({
          published: recentPublished.map((n, i) => ({ i, title: n.originalTitle ?? n.title })),
          count: batch.length,
          items: batch.map((c, i) => ({ i, source: srcById[c.source]?.name, title: c.title, summary: c.summary.slice(0, 280) })),
        });
        let rows = [];
        try {
          const { data } = await chatJson({ model: CONFIG.triageModel, system: prompt('triage'), user, temperature: 0, maxTokens: 6000 });
          rows = data.items ?? [];
        } catch (e) { log('غربال خطا:', String(e.message).slice(0, 200)); }
        const got = new Set();
        for (const r of rows) if (batch[r.i] && !got.has(r.i)) { got.add(r.i); triaged.push({ ...r, c: batch[r.i] }); }
        batch.forEach((c, i) => { if (!got.has(i)) missing.push(c); });
      }
      if (missing.length) log(`غربال: ${missing.length} مورد بی‌پاسخ ماند${round < 2 ? '، دوباره پرسیده می‌شود' : ''}`);
      pending = missing;
    }
    // موارد ردشده «دیده» ثبت می‌شوند تا دوباره هزینه نکنند. خبرهای بالای آستانه که در این اجرا
    // به سهمیه نرسیدند ثبت نمی‌شوند تا اجرای بعد دوباره شانس داشته باشند.
    const rejectSeen = (t, r) => { seen[t.c.url] = { at: Date.now(), r }; };

    const events = new Map();
    for (const t of triaged) {
      if (!t.ai) { rejectSeen(t, 'non-ai'); continue; }
      if (t.dup != null) { rejectSeen(t, 'dup'); continue; }
      if (!catIds.includes(t.category)) { rejectSeen(t, 'bad-cat'); continue; }
      if (t.importance < minImp) { rejectSeen(t, `low:${t.importance}`); continue; }
      // تکراری با خبرهای منتشرشده بر اساس شباهت عنوان (کمربند ایمنی کنار نظر مدل)
      if (recentPublished.some((n) => similarity(n.originalTitle ?? '', t.c.title) > 0.6)) { rejectSeen(t, 'dup-sim'); continue; }
      const key = t.event || t.c.url;
      const e = events.get(key) ?? { items: [], importance: 0, category: t.category, event: key };
      e.items.push(t.c);
      e.importance = Math.max(e.importance, t.importance);
      events.set(key, e);
    }
    const score = (e) => e.importance + Math.min(e.items.length - 1, 3) * 0.5 + Math.max(...e.items.map((c) => srcById[c.source]?.weight ?? 5)) / 10;
    picks = [...events.values()].filter((e) => e.importance >= minImp).sort((a, b) => score(b) - score(a));
    log(`غربال: ${triaged.length} بررسی، ${events.size} رویداد، ${picks.length} بالای آستانه`);
    for (const p of picks.slice(0, 12)) log(`  [${p.importance}] ${p.category} ${p.event} (${p.items.length} منبع)`);
    picks = picks.slice(0, budget);
  }
  report.picked = picks.map((p) => ({ event: p.event, importance: p.importance, urls: p.items.map((i) => i.url) }));
  if (DRY) throw 'done'; // اجرای آزمایشی چیزی را «دیده‌شده» ثبت نمی‌کند
  saveSeen(seen);

  // ── ۴. نوشتن ─────────────────────────────────
  const written = [];
  for (const p of picks) {
    try {
      // منبع اصلی: رسمی‌ترین/معتبرترین
      const items = p.items.slice().sort((a, b) => (srcById[b.source]?.official ? 1 : 0) - (srcById[a.source]?.official ? 1 : 0) || (srcById[b.source]?.weight ?? 0) - (srcById[a.source]?.weight ?? 0));
      const texts = [];
      for (const it of items.slice(0, 3)) {
        const a = await getText(it);
        if (a) texts.push({ it, a });
      }
      if (!texts.length) { for (const it of p.items) seen[it.url] = { at: Date.now(), r: 'no-text' }; report.rejected.push({ event: p.event, why: 'no-text' }); continue; }

      // کمربند دوم ضد تکرار: نویسنده متن کامل را می‌بیند و با تیترهای اخیر مقایسه می‌کند
      const recentTitles = published.filter((n) => Date.now() - n.pubDate < 3 * 864e5).slice(0, 40).map((n) => `- ${n.title}`).join('\n');
      const user = (recentTitles ? `## خبرهایی که قبلاً منتشر کرده‌ایم (اگر همین رویداد است و چیز مهم تازه‌ای ندارد، skip با reason «تکراری»)\n${recentTitles}\n\n` : '') + texts
        .map(({ it, a }, i) => `### منبع ${i + 1}: ${srcById[it.source]?.name ?? new URL(it.url).hostname}\nعنوان: ${a.title || it.title}\nنشانی: ${a.url}\n\n${a.text.slice(0, i === 0 ? 12000 : 5000)}`)
        .join('\n\n---\n\n');

      let out, model, problems = [];
      for (let attempt = 0; attempt < 2; attempt++) {
        const feedback = problems.length ? `\n\n---\nنسخه‌ی قبلی این مشکل‌ها را داشت، اصلاح کن: ${problems.join('؛ ')}` : '';
        ({ data: out, model } = await chatJson({ model: CONFIG.writerModel, system: prompt('writer'), user: user + feedback, temperature: 0.4, maxTokens: 6000 }));
        if (out?.skip) break;
        problems = validate(out);
        if (!problems.length) break;
        log(`ردّ کیفیت (${attempt + 1}):`, problems);
      }
      const markAll = (r) => { for (const it of p.items) seen[it.url] = { at: Date.now(), r }; };
      if (out?.skip) { log(`مدل نویسنده رد کرد: ${out.reason}`); markAll('writer-skip'); report.rejected.push({ event: p.event, why: `skip: ${out.reason}` }); continue; }
      if (problems.length) { markAll('quality'); report.rejected.push({ event: p.event, why: problems }); continue; }

      let slug = slugify(out.slug || out.coverText || p.event);
      if (published.some((n) => n.slug === slug) || written.some((w) => w.slug === slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      const pubDate = new Date();
      const primary = texts[0];
      const data = {
        title: cleanFa(out.title).trim(),
        description: cleanFa(out.description).trim(),
        category: catIds.includes(out.category) ? out.category : p.category,
        tags: [...new Set((out.tags ?? []).map((t) => cleanFa(String(t)).trim()).filter(Boolean))].slice(0, 6),
        pubDate: pubDate.toISOString(),
        importance: Math.max(1, Math.min(10, Math.round(Number(out.importance) || p.importance))),
        keyPoints: (out.keyPoints ?? []).map((k) => cleanFa(String(k)).trim()).filter(Boolean).slice(0, 5),
        coverText: String(out.coverText ?? '').slice(0, 24) || undefined,
        sources: texts.map(({ it, a }) => ({ name: srcById[it.source]?.name ?? new URL(it.url).hostname.replace(/^www\./, ''), url: it.url, title: (a.title || it.title).slice(0, 160) })),
        originalTitle: primary.a.title || primary.it.title,
        model,
      };
      if (!data.coverText) delete data.coverText;
      const file = writeMarkdown(CONFIG.newsDir, slug, data, cleanFa(out.body).replace(/^#\s.*\n/m, ''));
      written.push({ slug, file, title: data.title });
      published.unshift({ slug, ...data, pubDate });
      for (const { it } of texts) seen[it.url] = { at: Date.now(), r: 'published', slug };
      log(`✓ نوشته شد: ${slug} — ${data.title}`);
    } catch (e) {
      report.errors.push(String(e.message ?? e));
      log('خطا در نوشتن:', String(e.message ?? e));
    }
  }
  saveSeen(seen);
  report.published = written.map((w) => w.slug);

  // ── ۵. انتشار ────────────────────────────────
  if (written.length && !args['no-build']) {
    build(); // اگر گارد postbuild بشکند، همین‌جا خطا می‌دهد و چیزی منتشر/پوش نمی‌شود
    deploy();
    await indexNow(written.map((w) => `/news/${w.slug}/`));
    gitCommit(`news: ${written.length} خبر تازه\n\n${written.map((w) => `- ${w.title}`).join('\n')}`, written.map((w) => w.file));
  }
} catch (e) {
  if (e !== 'done') { report.errors.push(String(e?.stack ?? e)); log('خطای کلی:', String(e?.stack ?? e)); process.exitCode = 1; }
} finally {
  // بدون خبر تازه هم بیلد تازه: «۲ ساعت پیش»ها و پنجره‌ی ۴۸ ساعته‌ی news-sitemap به‌روز بمانند
  if (!DRY && !args['no-build'] && report.published.length === 0) {
    try { build(); deploy(); } catch (e) { report.errors.push(`refresh: ${e.message}`); log('بیلد تازه‌سازی خطا:', String(e.message).slice(0, 300)); }
  }
  gitPush(); // اگر کامیتی از اجرای قبل پوش نشده بود
  report.seconds = Math.round((Date.now() - started) / 1000);
  report.usage = usage;
  try { appendFileSync(join(CONFIG.stateDir, 'runs.jsonl'), JSON.stringify(report) + '\n'); } catch {}
  log(`پایان — ${report.published.length} خبر، ${report.seconds} ثانیه، توکن: ${usage.prompt}+${usage.completion}`);
  unlock();
}

function validate(o) {
  const p = [];
  if (!o || typeof o !== 'object') return ['خروجی JSON نیست'];
  const title = String(o.title ?? ''), desc = String(o.description ?? ''), body = String(o.body ?? '');
  if ([...title].length < 20 || [...title].length > 90) p.push(`طول title ${[...title].length} (باید ۲۰ تا ۷۰)`);
  if ([...desc].length < 90 || [...desc].length > 200) p.push(`طول description ${[...desc].length} (باید ۱۳۰ تا ۱۶۰)`);
  if (wordCount(body) < 220) p.push(`body کوتاه است (${wordCount(body)} کلمه)`);
  if (persianRatio(body) < 0.6) p.push('body به اندازه‌ی کافی فارسی نیست');
  if (persianRatio(title) < 0.4) p.push('title فارسی نیست');
  if (!/^##\s/m.test(body)) p.push('body بخش‌بندی ## ندارد');
  if (!/چرا/.test(body)) p.push('بخش «چرا این خبر مهم است؟» نیست');
  if (!Array.isArray(o.keyPoints) || o.keyPoints.length < 2) p.push('keyPoints کم است');
  if (!/^[a-z0-9-]{8,90}$/.test(slugify(o.slug))) p.push('slug نامعتبر');
  return p;
}

/**
 * متن کامل منبع: اول صفحه‌ی خود مقاله (Readability)؛ اگر سایت ربات را رد کرد یا متن کوتاه بود،
 * متن کاملی که خود ناشر در فید RSS (content:encoded) گذاشته. کمتر از ۴۰۰ کاراکتر = بی‌متن.
 */
async function getText(it) {
  if (it.prefetched?.text?.length >= 400) return it.prefetched;
  try {
    const a = await extract(it.url);
    if (a.text.length >= 400) return a;
    log(`متن کوتاه از ${it.url}`);
  } catch (e) { log(`استخراج ناموفق ${it.url}: ${e.message}`); }
  if ((it.content ?? '').length >= 600) {
    log(`متن از خود فید: ${it.url}`);
    return { url: it.url, title: it.title, text: it.content, publishedAt: it.publishedAt };
  }
  return null;
}
