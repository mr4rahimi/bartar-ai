/**
 * تنظیمات ایجنت — همه از .env ریشه‌ی پروژه (یا متغیر محیطی) قابل تغییرند.
 * فهرست کامل و پیش‌فرض‌ها: docs/02-agent.md
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

const envFile = join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const env = (k, d) => process.env[k] ?? d;
const num = (k, d) => Number(env(k, d));

export const CONFIG = {
  apiKey: env('GAPGPT_API_KEY', ''),
  baseUrl: env('GAPGPT_BASE_URL', 'https://api.gapgpt.app/v1'),
  /** مدل ارزان برای غربال و دسته‌بندی سرتیترها */
  triageModel: env('TRIAGE_MODEL', 'gpt-5.4-mini'),
  /** مدل قوی برای نوشتن خبر فارسی */
  writerModel: env('WRITER_MODEL', 'claude-sonnet-5-5'),
  /** اگر مدل اصلی خطا داد */
  fallbackModel: env('FALLBACK_MODEL', 'gpt-5.4'),

  /** حداکثر خبر در هر اجرا (هر ۴ ساعت) و در هر روز تهران */
  perRun: num('PER_RUN', 4),
  perDay: num('PER_DAY', 15),
  /** حداقل اهمیت (۱ تا ۱۰) برای انتشار */
  minImportance: num('MIN_IMPORTANCE', 6),
  /** فقط خبرهای این چند ساعت اخیر */
  maxAgeHours: num('MAX_AGE_HOURS', 36),
  /** قاعده‌ی کارفرما: متن سایت بدون نیم‌فاصله (مثل bartar-repairer). false = نیم‌فاصله بماند */
  noZwnj: env('NO_ZWNJ', 'true') === 'true',

  /** بعد از نوشتن: کامیت و پوش گیت، بیلد، دیپلوی */
  gitPush: env('GIT_PUSH', 'false') === 'true',
  deployCmd: env('DEPLOY_CMD', ''),
  indexNowKey: env('INDEXNOW_KEY', ''),
  siteUrl: env('SITE_URL', 'https://ai.bartar-repairer.com'),

  userAgent: 'Mozilla/5.0 (compatible; BartarAI-NewsBot/1.0; +https://ai.bartar-repairer.com/about/)',
  newsDir: join(ROOT, 'src/content/news'),
  weeklyDir: join(ROOT, 'src/content/weekly'),
  stateDir: join(ROOT, 'agent/state'),
};
