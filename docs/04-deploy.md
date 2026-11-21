# ۴. نصب و دیپلوی

## ۴.۰ وضعیت (۲۰۲۶-۱۱-۲۱)

| بخش | وضعیت |
|---|---|
| ریپو | ✅ `git@github.com:mr4rahimi/bartar-ai.git` شاخه‌ی `main` |
| سرو سایت | ✅ **گزینه‌ی A تأیید کاربر**: سرور اصلی `185.164.73.224`، `/var/www/bartar-ai/dist`، vhost `/etc/nginx/sites-available/ai.bartar-repairer.com` (= `deploy/nginx-ai.bartar-repairer.com.conf`)، لاگ `/var/log/nginx/bartar-ai.*.log` |
| فایل تأیید سرچ کنسول | ✅ `public/googleaef0f4305b5b80a0.html` (در هر بیلد همراه است؛ **حذف نشود**) |
| DNS | ✅ پارس‌پک: `A ai → 185.164.73.224`، فقط DNS (پراکسی خاموش) — ۲۰۲۶-۱۱-۲۱. رکورد wildcard `*` همچنان به هاست است |
| HTTPS | ✅ Let's Encrypt با `certbot --nginx --redirect` (تمدید خودکار)؛ http → https با ۳۰۱. پشتیبان vhost پیش از certbot: `/root/ai.bartar-repairer.com.vhost.bak`. آزمون از فرانکفورت: ۲۰۰ در ۰٫۲ ثانیه |
| ایجنت روی فرانکفورت | ✅ نصب و آزموده (۲۰۲۶-۱۱-۲۱): `/opt/bartar-ai/app`، کاربر `bartar-ai`، تایمرهای `bartar-ai-news` و `bartar-ai-weekly` |
| کشیدن از ایران | ✅ `bartar-ai-pull.timer` روی سرور ایران، هر ۲ دقیقه |
| پوش گیت از فرانکفورت | ✅ Deploy key «bartar-ai agen» (Read/write) = `/opt/bartar-ai/.ssh/github`؛ هویت گیت در `.git/config` ریپوی سرور (`Bartar AI Agent`) — بدونش rebase شکست می‌خورد |

## ۴.۰.۱ معماری نهایی انتشار

```
فرانکفورت 193.36.84.146                                 سرور اصلی ایران 185.164.73.224
/opt/bartar-ai/app  (کاربر bartar-ai)                    
  agent/run.mjs ── build ── DEPLOY_CMD ─► /srv/bartar-ai-www/ ◄── rsync هر ۲ دقیقه (bartar-ai-pull.timer)
                 └ IndexNow                    ▲ rrsync -ro      └─► /var/www/bartar-ai/dist ─► nginx + HTTPS
                 └ git commit/push ─► GitHub   │ (authorized_keys کاربر bartar-ai: فقط خواندن همین پوشه)
```

- **چرا کشیدن؟** فرانکفورت به پورت ۲۲ سرور ایران دسترسی ندارد (فیلتر)، برعکسش دارد. مزیت: فرانکفورت هیچ دسترسی‌ای به سرور ایران
  ندارد، و هنگام قطعی اینترنت بین‌الملل، سایت ایران آخرین نسخه را نگه می‌دارد.
- **امنیت آزموده:** با کلید `/root/.ssh/bartar-ai-pull` نوشتن رد می‌شود («sending to read-only server is not allowed») و اجرای دستور هم.
- `DEPLOY_CMD=rsync -a --delete dist/ /srv/bartar-ai-www/` (محلی روی فرانکفورت). پوشه‌ی جدا تا ایران وسط بیلد (که `dist` را پاک می‌کند) چیز نیمه‌کاره نکشد.
- هر اجرای ایجنت، حتی بدون خبر تازه، بیلد و انتشار می‌کند تا «… پیش»ها و پنجره‌ی ۴۸ ساعته‌ی `news-sitemap.xml` تازه بمانند.
- ترتیب: بیلد (گارد سئو) ← انتشار ← IndexNow ← کامیت/پوش. **شکست پوش انتشار را متوقف نمی‌کند**؛ کامیت محلی می‌ماند و اجرای بعد پوش می‌شود.

**دستورهای روزمره:**
```bash
# فرانکفورت
systemctl list-timers | grep bartar-ai
journalctl -u bartar-ai-news -n 80 --no-pager            # لاگ آخرین اجرا
systemctl start bartar-ai-news                            # اجرای فوری (۱ تا ۳ دقیقه)
tail -1 /opt/bartar-ai/app/agent/state/runs.jsonl         # گزارش ماشینی (توکن، ردها)
# ایران
systemctl start bartar-ai-pull; journalctl -u bartar-ai-pull -n 5
```

**تغییر کد:** روی لپ‌تاپ تغییر ← `npm run build` ← push ← روی فرانکفورت: `sudo -u bartar-ai git -C /opt/bartar-ai/app pull --rebase`
(ایجنت هم اول هر اجرا `git pull --rebase --autostash` می‌کند). **خبرها روی فرانکفورت نوشته می‌شوند؛ پیش از ویرایش خبر روی لپ‌تاپ `git pull`.**
ویرایش فوری یک خبر: روی فرانکفورت فایل را ویرایش، `systemctl start bartar-ai-news` (بیلد تازه)، سپس کامیت دستی.

**فایل‌های systemd در ریپو:** `deploy/bartar-ai-news.*`، `deploy/bartar-ai-weekly.*` (فرانکفورت)، `deploy/iran-bartar-ai-pull.*` (ایران، نام نصب‌شده بدون پیشوند `iran-`).
`--delete` فقط داخل همین پوشه اثر دارد. هرگز vhost یا پوشه‌ی سایت‌های دیگر را لمس نکنید؛ پیش از reload همیشه `nginx -t`
(هشدارهای «protocol options redefined» مال vhostهای قدیمی‌اند و بی‌ضررند).


## ۴.۱ تصمیم باز: سایت کجا سرو شود؟

ایجنت روی **فرانکفورت** اجرا می‌شود (تصمیم‌گرفته). خروجی استاتیک (`dist/`) باید جایی سرو شود:

| گزینه | چطور | مزیت | عیب |
|---|---|---|---|
| **A. سرور اصلی ایران** (`185.164.73.224`، nginx) — پیشنهادی | `DEPLOY_CMD="rsync -az --delete dist/ root@185.164.73.224:/var/www/bartar-ai/dist/"` + vhost نمونه‌ی `deploy/nginx-ai.bartar-repairer.com.conf` | سریع برای کاربر ایرانی، کنار بقیه‌ی سایت‌ها، certbot موجود | نیاز به کلید SSH محدود از فرانکفورت به ایران؛ هنگام قطعی اینترنت ربات گوگل نمی‌رسد (همان مشکل سایت‌های دیگر → آینه، docs/13 workspace) |
| B. همان هاست bartar-repairer.com (FTPS) | FTPS افزایشی مثل بقیه | هزینه‌ی صفر | زیردامنه روی هاست اشتراکی باید ساخته شود؛ FTPS از فرانکفورت |
| C. خود فرانکفورت (Caddy) | Caddy موجود، یک بلوک تازه | ساده‌ترین؛ بدون انتقال | کاربر ایرانی از سرور خارج می‌گیرد (کندتر، ریسک فیلتر/اختلال) |

ترکیب پیشنهادی: **A برای سرو + فرانکفورت به‌عنوان آینه** (همان الگوی Custom PopSite پارس‌پک).

## ۴.۲ نصب روی فرانکفورت (`root@193.36.84.146`) — ✅ انجام شد؛ برای نصب دوباره

> مسیر واقعی: کد در `/opt/bartar-ai/app` (خانه‌ی کاربر `/opt/bartar-ai`، کلیدها در `/opt/bartar-ai/.ssh`).

> قواعد workspace (`astro-sites/docs/00-START-HERE.md`): به `ig-gateway.caddy` و سرویس‌های دیگر دست نزنید؛ پیش از هر ویرایش Caddy/nginx پشتیبان و `validate`/`-t`.

```bash
# ۱. کاربر جدا و کد
useradd -r -m -d /opt/bartar-ai -s /bin/bash bartar-ai
sudo -u bartar-ai git clone git@github.com:mr4rahimi/bartar-ai.git /opt/bartar-ai   # deploy key با write
cd /opt/bartar-ai && sudo -u bartar-ai npm ci
# ۲. تنظیمات
sudo -u bartar-ai cp .env.example .env && chmod 600 .env   # GAPGPT_API_KEY، GIT_PUSH=true، DEPLOY_CMD، INDEXNOW_KEY (همان کلید فایل public/*.txt)
# ۳. آزمون
sudo -u bartar-ai node agent/run.mjs --dry
sudo -u bartar-ai npm run build
# ۴. تایمرها
cp deploy/bartar-ai-*.service deploy/bartar-ai-*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now bartar-ai-news.timer bartar-ai-weekly.timer
systemctl list-timers | grep bartar-ai
journalctl -u bartar-ai-news -n 50
```

نیازها: Node ≥ 22، git، کتابخانه‌ی librsvg داخل sharp (همراه بسته‌ی npm است) — فونت از `assets/og-fonts` می‌آید، نصب فونت سیستمی لازم نیست.

## ۴.۳ DNS

رکورد `A` برای `ai.bartar-repairer.com` به IP سرور انتخابی (DNS فعلی bartar-repairer.com: آروان، بدون پراکسی — اگر به پارس‌پک منتقل شده، همان‌جا).
بعد: `certbot --nginx -d ai.bartar-repairer.com` (گزینه A).

## ۴.۴ پس از اولین انتشار

- `curl -sI https://ai.bartar-repairer.com/` → ۲۰۰؛ `/news/<slug>/`، `/sitemap.xml`، `/<indexnow-key>.txt`.
- Rich Results Test روی یک خبر (NewsArticle بدون خطا).
- [`03-seo.md`](03-seo.md) §۳.۲.
