# ۵. جمع‌بندی هفتگی و ویدیو

> **تصمیم کاربر (۲۰۲۶-۱۱-۲۱):** ویدیو با هوش مصنوعی ساخته **نمی‌شود**. کاربر از صفحه‌ی هفتگی سایت اسکرین می‌گیرد و خودش ضبط می‌کند.
> `videoScript` فقط یادداشت کمکی برای مجری است (روی سایت دیده نمی‌شود). **کار بعدی (بعد از اولین ویدیو):** جایی برای آپلود ویدیوها —
> فعلاً راه ساده: آپلود در آپارات/یوتیوب و پر کردن `videoUrl` و `videoEmbed` (§۵.۳).

## ۵.۱ زمان‌بندی

`agent/weekly.mjs` — **جمعه‌ها ۱۹:۰۰ تهران** (`deploy/bartar-ai-weekly.timer`). هفته = **شنبه ۰۰:۰۰ تا جمعه ۲۳:۵۹ تهران**.
شناسه = تاریخ شمسی جمعه، مثلاً `1405-09-06` → `/weekly/1405-09-06/`. اگر فایل هفته هست، دوباره ساخته نمی‌شود (`--force` برای بازنویسی). کمتر از ۳ خبر = ساخته نمی‌شود.

خروجی (`src/content/weekly/<id>.md`): تیتر، توضیح، بازه‌ی شمسی، ۸ تا ۱۰ خبر رتبه‌بندی‌شده با یادداشت «چرا مهم بود»، مقدمه (بدنه‌ی md) و
**`videoScript`**: متن گفتاری ۵ تا ۷ دقیقه برای مجری با علامت‌های `[خبر ۱]`، `[خبر ۲]`، … (روی صفحه نمایش داده نمی‌شود).

## ۵.۲ API برای برنامه‌ی شما

```
GET https://ai.bartar-repairer.com/weekly/latest.json     ← آخرین هفته
GET https://ai.bartar-repairer.com/weekly/<id>.json
GET https://ai.bartar-repairer.com/feed.json              ← ۱۰۰ خبر آخر (JSON Feed 1.1 + _bartar: importance، keyPoints، sources)
```

ساختار `weekly/*.json`:

```jsonc
{
  "id": "1405-08-29", "url": "…/weekly/1405-08-29/", "title": "…", "description": "…",
  "weekLabel": "۲۳ آبان ۱۴۰۵ تا ۲۹ آبان ۱۴۰۵", "weekStart": "ISO", "weekEnd": "ISO", "pubDate": "ISO",
  "intro": "markdown",
  "videoScript": "متن گفتاری با [خبر ۱] …",
  "items": [{
    "rank": 1, "note": "…", "slug": "…", "url": "…", "title": "…", "description": "…",
    "category": "llm", "tags": [], "keyPoints": [], "importance": 9, "pubDate": "ISO",
    "sources": [{ "name": "…", "url": "…", "title": "…" }],
    "cover": "…/cover/<slug>.webp",   // 1200×675 برای پس‌زمینه‌ی ویدیو
    "og":    "…/og/<slug>.png",       // 1200×630 با تیتر فارسی
    "body": "متن کامل markdown"
  }]
}
```

## ۵.۳ بعد از ساخت ویدیو

در `src/content/weekly/<id>.md` اضافه کنید و بیلد/پوش:

```yaml
videoUrl: https://www.aparat.com/v/xxxx          # یا یوتیوب
videoEmbed: https://www.aparat.com/video/video/embed/videohash/xxxx/vt/frame
```

صفحه‌ی هفتگی ویدیو را نشان می‌دهد و `VideoObject` به JSON-LD اضافه می‌شود (شانس نمایش در نتایج ویدیویی گوگل).

## ۵.۴ نمونه

`src/content/weekly/1405-08-29.md` با ۵ خبر ساخته شد — **`draft: true`**، چون پیش از اصلاح باگ بازه (خبرهای شنبه ۳۰ آبان را هم گرفته بود). برای دیدن: `draft: false` و `npm run dev`.
