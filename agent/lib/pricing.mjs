/**
 * قیمت مدل‌ها و محافظ بودجه‌ی ماهانه.
 * قیمت: دلار برای هر ۱ میلیون توکن [ورودی، خروجی] — پنل GapGPT، ۲۰۲۶-۱۱-۲۲. با تغییر قیمت‌ها همین‌جا به‌روز شود.
 * مدلی که در جدول نیست، محتاطانه با گران‌ترین قیمت جدول حساب می‌شود.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG } from './config.mjs';

export const PRICE = {
  'claude-opus-5-5': [4, 20], 'claude-sonnet-5-5': [2, 10], 'claude-haiku-5-5': [0.1, 0.5],
  'gpt-6-luna': [0.1, 0.5], 'gpt-6.1-terra': [1, 5], 'gpt-6.2-sol': [2, 10],
  'gpt-5.4': [2.5, 15], 'gpt-5.4-mini': [0.75, 4.5], 'gpt-5.4-nano': [0.2, 1.25], 'gpt-5.6-luna': [0.2, 1.2],
  'deepseek-v4.1-flash': [0.15, 0.6], 'gemini-3.8-flash': [0.75, 3.75], 'gemini-4-hydrogen': [1.5, 7.5],
};
const MAX = Object.values(PRICE).reduce((m, p) => [Math.max(m[0], p[0]), Math.max(m[1], p[1])], [0, 0]);

/** هزینه‌ی دلاری یک usage.byModel */
export function costOf(byModel = {}) {
  let c = 0;
  for (const [model, u] of Object.entries(byModel)) {
    const [pi, po] = PRICE[model] ?? MAX;
    c += ((u.prompt ?? 0) * pi + (u.completion ?? 0) * po) / 1e6;
  }
  return c;
}

const runsFile = () => join(CONFIG.stateDir, 'runs.jsonl');
const readRuns = () => {
  try {
    return readFileSync(runsFile(), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  } catch { return []; }
};

/** ماه و روز به وقت تهران (میلادی؛ مرز ماه برای بودجه کافی است) */
const tehran = (d, len) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(d).slice(0, len);

/** هزینه‌ی ماه جاری (همه‌ی اجراها: خبر، هفتگی، آزمایشی) */
export function monthSpend(now = new Date()) {
  const m = tehran(now, 7);
  return readRuns().filter((r) => tehran(new Date(r.at), 7) === m).reduce((s, r) => s + (r.cost ?? costOf(r.usage?.byModel)), 0);
}

/** تعداد خبرهایی که امروز (تهران) با مدل گران نوشته شده‌اند */
export function topWrittenToday(now = new Date()) {
  const d = tehran(now, 10);
  return readRuns().filter((r) => tehran(new Date(r.at), 10) === d).reduce((s, r) => s + (r.topWritten ?? 0), 0);
}
