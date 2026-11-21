// پاکسازی دوباره‌ی همه‌ی خبرها با cleanFa (مثلاً بعد از تغییر قاعده‌ی نیم‌فاصله).
// YAML خوانده و دوباره نوشته می‌شود تا تورفتگی‌ها دست نخورند.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG } from './lib/config.mjs';
import { cleanFa } from './lib/text.mjs';
import { readFrontmatter, writeMarkdown } from './lib/store.mjs';

const KEEP = new Set(['sources', 'pubDate', 'updatedDate', 'model', 'originalTitle', 'coverText']);
const deep = (v) => (typeof v === 'string' ? cleanFa(v).trim() : Array.isArray(v) ? v.map(deep) : v && typeof v === 'object' && !(v instanceof Date) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) : v);
let n = 0;
for (const f of readdirSync(CONFIG.newsDir).filter((f) => f.endsWith('.md'))) {
  const fm = readFrontmatter(join(CONFIG.newsDir, f));
  const data = Object.fromEntries(Object.entries(fm.data).map(([k, v]) => [k, KEEP.has(k) ? v : deep(v)]));
  if (data.pubDate instanceof Date) data.pubDate = data.pubDate.toISOString();
  writeMarkdown(CONFIG.newsDir, f.replace(/\.md$/, ''), data, cleanFa(fm.body));
  n++;
}
console.log(`${n} فایل پاکسازی شد`);
