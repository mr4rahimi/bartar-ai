# ۴. نصب و دیپلوی

## ۴.۰ وضعیت (۲۰۲۶-۱۱-۲۱)

| بخش | وضعیت |
|---|---|
| ریپو | ✅ `git@github.com:mr4rahimi/bartar-ai.git` شاخه‌ی `main` |
| سرو سایت | ✅ **گزینه‌ی A تأیید کاربر**: سرور اصلی `185.164.73.224`، `/var/www/bartar-ai/dist`، vhost `/etc/nginx/sites-available/ai.bartar-repairer.com` (= `deploy/nginx-ai.bartar-repairer.com.conf`)، لاگ `/var/log/nginx/bartar-ai.*.log` |
| فایل تأیید سرچ کنسول | ✅ `public/googleaef0f4305b5b80a0.html` (در هر بیلد همراه است؛ **حذف نشود**) |
| DNS | ⬜ رکورد `A` برای `ai` → `185.164.73.224` در پارس‌پک (الان `ai` به‌خاطر wildcard به هاست `185.73.226.44` می‌رود) |
| HTTPS | ⬜ بعد از DNS: `certbot --nginx -d ai.bartar-repairer.com` |
| ایجنت روی فرانکفورت | ⬜ عمداً هنوز نه («فعلاً فقط سایت») — §۴.۲ |

**دیپلوی دستی فعلی (از لپ‌تاپ):**
```bash
npm run build && rsync -az --delete dist/ root@185.164.73.224:/var/www/bartar-ai/dist/
```
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

## ۴.۲ نصب روی فرانکفورت (`root@193.36.84.146`)

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
