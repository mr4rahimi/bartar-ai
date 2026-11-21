/**
 * گارد بعد از بیلد — اگر صفحه‌ای قاعده‌ی پایه‌ی سئو را بشکند، بیلد شکست می‌خورد
 * و ایجنت دیپلوی نمی‌کند. (docs/03-seo.md)
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const errors = [];
let pages = 0;

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name === 'index.html') await check(p);
  }
}
const one = (html, re) => (html.match(re) || [])[1];

async function check(file) {
  pages++;
  const html = await readFile(file, 'utf8');
  const rel = file.slice(DIST.length);
  const title = one(html, /<title>([^<]*)<\/title>/);
  const desc = one(html, /<meta name="description" content="([^"]*)"/);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (!title) errors.push(`${rel}: بدون title`);
  else if ([...title].length > 95) errors.push(`${rel}: title خیلی بلند (${[...title].length})`);
  if (!desc) errors.push(`${rel}: بدون description`);
  if (!/<link rel="canonical"/.test(html)) errors.push(`${rel}: بدون canonical`);
  if (h1 !== 1 && !rel.startsWith('/404')) errors.push(`${rel}: ${h1} تا h1`);
  if (/\bundefined\b|\[object Object\]/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) errors.push(`${rel}: undefined در خروجی`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { errors.push(`${rel}: JSON-LD نامعتبر`); }
  }
}

await walk(DIST);
for (const f of ['sitemap.xml', 'news-sitemap.xml', 'rss.xml', 'robots.txt', 'feed.json']) {
  try { await stat(join(DIST, f)); } catch { errors.push(`نبود ${f}`); }
}
if (errors.length) {
  console.error(`✗ postbuild: ${errors.length} خطا در ${pages} صفحه`);
  for (const e of errors.slice(0, 50)) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ postbuild: ${pages} صفحه سالم`);
