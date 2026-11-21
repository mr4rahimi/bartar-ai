/** پاکسازی و بررسی متن فارسی خروجی مدل */
import { CONFIG } from './config.mjs';

export function cleanFa(s) {
  if (typeof s !== 'string') return s;
  let t = s
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[‏‎‪-‮]/g, '')
    .replace(/[ \t]+\n/g, '\n');
  if (CONFIG.noZwnj) {
    // «تراشه‌ی جدید» ← «تراشه جدید» (یای میانجی بدون نیم‌فاصله زشت می‌شود: «تراشه ی»)
    t = t.replace(/([هة])‌ی(?=[\s،.:؛!؟)»]|$)/g, '$1').replace(/‌/g, ' ');
  }
  return t.replace(/ {2,}/g, ' ');
}

export const persianRatio = (s) => {
  const letters = s.match(/\p{L}/gu) ?? [];
  if (!letters.length) return 0;
  return letters.filter((c) => /[؀-ۿ]/.test(c)).length / letters.length;
};

export const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

export function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 8)
    .join('-')
    .slice(0, 70)
    .replace(/-+$/, '');
}

/** شباهت دو عنوان (ژاکارد روی کلمه‌ها) برای پیدا کردن خبر تکراری */
export function similarity(a, b) {
  const t = (s) => new Set(String(s).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter((w) => w.length > 2));
  const A = t(a), B = t(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

export function tehranDay(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(d);
}
