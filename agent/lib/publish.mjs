/** گام‌های بعد از نوشتن خبر: گیت ← بیلد ← دیپلوی ← IndexNow */
import { execSync, execFileSync } from 'node:child_process';
import { CONFIG, ROOT } from './config.mjs';
import { log } from './log.mjs';

const sh = (cmd, opts = {}) => execSync(cmd, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8', timeout: 15 * 60_000, ...opts });

export function gitPull() {
  if (!CONFIG.gitPush) return;
  try { sh('git pull --rebase --autostash'); } catch (e) { log('git pull خطا:', e.stderr || e.message); }
}

/** کامیت محلی همیشه؛ شکست پوش فقط هشدار (کامیت می‌ماند و اجرای بعد پوش می‌شود) — نباید جلوی انتشار را بگیرد */
export function gitCommit(message, paths) {
  if (!CONFIG.gitPush) return;
  try {
    // execFileSync بدون شل: پیام چندخطی و نام فایل‌ها بی‌نیاز از نقل‌قول
    const git = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    git('add', '--', ...paths);
    git('-c', 'user.name=Bartar AI Agent', '-c', 'user.email=agent@ai.bartar-repairer.com', 'commit', '-q', '-m', message);
  } catch (e) { log('git commit خطا:', (e.stderr || e.message).slice(0, 300)); return; }
  gitPush();
}

export function gitPush() {
  if (!CONFIG.gitPush) return;
  try {
    try { sh('git push -q'); } catch { sh('git pull --rebase -q'); sh('git push -q'); }
    log('گیت: پوش شد');
  } catch (e) { log('⚠ git push ناموفق (کامیت محلی ماند):', (e.stderr || e.message).slice(0, 300)); }
}

export function build() {
  log('بیلد…');
  const out = sh('npm run build');
  log(out.split('\n').filter((l) => /postbuild|page\(s\) built|error/i.test(l)).join(' | '));
}

export function deploy() {
  if (!CONFIG.deployCmd) { log('DEPLOY_CMD خالی است؛ دیپلوی رد شد'); return; }
  log('دیپلوی…');
  sh(CONFIG.deployCmd, { stdio: 'inherit' });
}

/** IndexNow: Bing، Yandex، Seznam و … را فوری خبر می‌کند (گوگل از سایت‌مپ خبری می‌خواند) */
export async function indexNow(paths) {
  if (!CONFIG.indexNowKey || !paths.length) return;
  const host = new URL(CONFIG.siteUrl).host;
  const body = {
    host, key: CONFIG.indexNowKey, keyLocation: `${CONFIG.siteUrl}/${CONFIG.indexNowKey}.txt`,
    urlList: [...paths.map((p) => CONFIG.siteUrl + p), `${CONFIG.siteUrl}/`, `${CONFIG.siteUrl}/news-sitemap.xml`],
  };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
    log(`IndexNow → ${res.status}`);
  } catch (e) { log('IndexNow خطا:', e.message); }
}
