/**
 * حافظه‌ی ایجنت:
 *  - seen.json: نشانی‌هایی که قبلاً بررسی شده‌اند (۴۵ روز نگه‌داری) — تا خبر رد‌شده دوباره هزینه نکند
 *  - خبرهای منتشرشده مستقیم از فایل‌های src/content/news خوانده می‌شوند (منبع حقیقت = گیت)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, openSync, closeSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { CONFIG } from './config.mjs';

const seenFile = join(CONFIG.stateDir, 'seen.json');

export function loadSeen() {
  try { return JSON.parse(readFileSync(seenFile, 'utf8')); } catch { return {}; }
}
export function saveSeen(seen) {
  const cutoff = Date.now() - 45 * 864e5;
  for (const [k, v] of Object.entries(seen)) if (v.at < cutoff) delete seen[k];
  mkdirSync(CONFIG.stateDir, { recursive: true });
  writeFileSync(seenFile, JSON.stringify(seen));
}

export function readFrontmatter(file) {
  const s = readFileSync(file, 'utf8');
  const m = s.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  return { data: yaml.load(m[1]), body: m[2] };
}

export function publishedNews() {
  if (!existsSync(CONFIG.newsDir)) return [];
  return readdirSync(CONFIG.newsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const fm = readFrontmatter(join(CONFIG.newsDir, f));
      return fm ? { slug: f.replace(/\.md$/, ''), ...fm.data, body: fm.body } : null;
    })
    .filter(Boolean)
    .map((n) => ({ ...n, pubDate: new Date(n.pubDate) }))
    .sort((a, b) => b.pubDate - a.pubDate);
}

export function writeMarkdown(dir, slug, data, body) {
  mkdirSync(dir, { recursive: true });
  const fm = yaml.dump(data, { lineWidth: -1, quotingType: '"', noRefs: true });
  const file = join(dir, `${slug}.md`);
  writeFileSync(file, `---\n${fm}---\n\n${body.trim()}\n`);
  return file;
}

/** قفل ساده تا دو اجرا هم‌زمان نشوند (قفل کهنه‌تر از ۱ ساعت شکسته می‌شود) */
export function lock(name = 'run') {
  const f = join(CONFIG.stateDir, `${name}.lock`);
  mkdirSync(CONFIG.stateDir, { recursive: true });
  try {
    if (existsSync(f) && Date.now() - statSync(f).mtimeMs > 3.6e6) unlinkSync(f);
    closeSync(openSync(f, 'wx'));
  } catch {
    return null;
  }
  return () => { try { unlinkSync(f); } catch {} };
}
