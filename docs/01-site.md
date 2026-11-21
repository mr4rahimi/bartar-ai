# ۱. سایت — ساختار، صفحه‌ها، طراحی

## ۱.۱ پوشه‌ها

```
astro.config.mjs        site، trailingSlash: always، خروجی استاتیک، FONTCONFIG_FILE برای کاورها
src/content.config.ts   اسکیمای news و weekly (zod)
src/content/news/*.md   خبرها — نام فایل = آدرس (/news/<slug>/)
src/content/weekly/*.md جمع‌بندی‌های هفتگی (/weekly/<YYYY-MM-DD شمسی>/)
src/data/categories.json  ۹ دسته (slug، نام، رنگ hue، توضیح) — مشترک سایت و ایجنت
src/lib/site.ts         ثابت‌های سایت (نام، توضیح، سایت مادر)
src/lib/news.ts         allNews، hotScore، tagIndex، related
src/lib/format.ts       تاریخ شمسی (Intl، تقویم persian، منطقه‌ی تهران)، «۲ ساعت پیش»، اسلاگ برچسب
src/lib/cover.ts        کاور (1200×675 webp) و OG (1200×630 png) با sharp از SVG
src/layouts/Base.astro  head کامل سئو، هدر، فوتر، دکمه‌ی حالت تیره
src/components/         Card، Row، Cat، Crumbs، Pager، Icon (SVG لوسید، بدون کتابخانه)
src/styles/global.css   همه‌ی استایل‌ها با توکن رنگ
scripts/postbuild.mjs   گارد سئو بعد از بیلد
scripts/gen-icons.mjs   ساخت فاوآیکن‌ها از public/favicon.svg (یک بار)
scripts/shot.mjs        اسکرین‌شات برای بازبینی ظاهر
assets/og-fonts/        وزیرمتن TTF + fonts.conf برای sharp/librsvg
```

## ۱.۲ صفحه‌ها

| آدرس | فایل | توضیح |
|---|---|---|
| `/` | `pages/index.astro` | نوار «تازه‌ها»، خبر اصلی (داغ‌ترین ۳۶ ساعت = اهمیت با افت زمانی)، ۴ خبر کناری، آخرین‌ها، «مهم‌ترین‌های هفته»، موضوع‌های داغ، ردیف هر دسته |
| `/news/<slug>/` | `pages/news/[slug].astro` | خبر: مسیر صفحه، دسته، تیتر، خلاصه، کاور، «خلاصه در یک نگاه»، متن، منابع + سلب مسئولیت، برچسب‌ها، اشتراک، تبلیغ برتر سرویس، خبرهای مرتبط |
| `/category/<cat>/[page/]` | `pages/category/[cat]/[...page].astro` | ۱۸ خبر در هر صفحه، rel prev/next |
| `/tag/<tag>/` | `pages/tag/[tag]/[...page].astro` | **برچسب با کمتر از ۳ خبر = noindex** (ضد صفحه‌ی کم‌محتوا) |
| `/latest/` | `pages/latest/[...page].astro` | آرشیو کامل |
| `/weekly/`، `/weekly/<id>/` | `pages/weekly/` | جمع‌بندی هفتگی + VideoObject اگر `videoUrl` پر شود |
| `/weekly/<id>.json`، `/weekly/latest.json` | `pages/weekly/[id].json.ts` | API برنامه‌ی ویدیو ([`05`](05-weekly-video.md)) |
| `/search/` | `pages/search.astro` | جست‌وجوی سمت مرورگر روی `/search-index.json` (فقط در همین صفحه بارگذاری می‌شود)، noindex |
| `/about/` | `pages/about.astro` | روش کار، منابع، نقش هوش مصنوعی (اعتماد/E-E-A-T) |
| `/rss.xml`، `/feed.json` | | ۵۰ / ۱۰۰ خبر آخر |
| `/sitemap.xml`، `/news-sitemap.xml` | | سایت‌مپ کامل + Google News (فقط ۴۸ ساعت اخیر) |
| `/robots.txt`، `/llms.txt` | | خزنده‌های هوش مصنوعی مجازند |
| `/cover/<slug>.webp`، `/og/<slug>.png`، `/og-default.png` | | تصویرهای خودکار |

## ۱.۳ فرانت‌متر خبر

```yaml
title: …            # ≤ ۱۱۰ (ایجنت ≤ ۷۰ می‌خواهد)
description: …      # ≤ ۲۲۰ (ایجنت ۱۳۰–۱۶۰)
category: llm       # یکی از src/data/categories.json
tags: [OpenAI, …]
pubDate: "2026-…Z"
updatedDate: …      # اختیاری؛ اگر دستی اصلاح کردید پر کنید (dateModified)
importance: 7       # ۱–۱۰؛ رتبه‌ی صفحه‌ی اول و «مهم‌ترین‌ها»
keyPoints: […]
coverText: NVIDIA   # نوشته‌ی بزرگ کاور (انگلیسی، ≤ ۲۴)
sources: [{name, url, title}]
originalTitle: …    # تیتر انگلیسی منبع (برای تشخیص تکرار)
draft: false        # true = از همه‌جا پنهان
noindex: false
model: claude-sonnet-5-5
```

**اصلاح دستی یک خبر:** فایل را ویرایش، `updatedDate` را پر، بیلد. **حذف:** `draft: true` (آدرس ۴۰۴ می‌شود؛ اگر خبر ایندکس شده بود بهتر است حذف نشود).

## ۱.۴ سیستم طراحی

- خروجی ابزار ui-ux-pro-max برای «news magazine editorial»: سبک Minimal/Swiss، قرمز برای خبر فوری، تأکید بر سرعت. فونت پیشنهادی (Newsreader) لاتین بود؛ به‌جایش **وزیرمتن** خودمیزبان (۴۰۰/۵۰۰/۷۰۰، هر کدام ~۳۳KB).
- رنگ‌ها **عین برند برتر** (`bartar-astro/src/styles/site.css`): قرمز `rgb(210 20 30)`، خاکستری‌های گرم `ink`/`sand`. هر دسته یک `hue` دارد (برچسب رنگی و کاور).
- حالت تیره: `prefers-color-scheme` + دکمه (`data-theme` در localStorage). هر دو با توکن.
- دسترس‌پذیری: لینک «رفتن به محتوا»، فوکوس قرمز، دکمه‌های ۴۴px، `aria-label` برای آیکون‌ها، `prefers-reduced-motion`.
- جاوااسکریپت: فقط دکمه‌ی حالت تیره (inline)، کپی لینک (صفحه‌ی خبر)، جست‌وجو (صفحه‌ی جست‌وجو) و یک فایل کوچک prefetch آسترو.
- اندازه (۲۰۲۶-۱۱-۲۱): خانه ۳۱KB خام / **۸KB gzip**، خبر **۱۰KB gzip**، کاور ~۱۳KB، CSS inline.

## ۱.۵ کاور و OG خودکار (`src/lib/cover.ts`)

- پس‌زمینه‌ی تیره + دو گرادیان شعاعی با `hue` دسته + شبکه + «گره‌های عصبی» تصادفی **قطعی** (seed = slug؛ هر بیلد همان تصویر).
- کاور: نام دسته (فارسی) + `coverText` بزرگ + BARTAR AI. OG: تیتر فارسی سه‌خطی + تاریخ شمسی + دامنه.
- **متن فارسی:** librsvg فقط فونت‌های fontconfig را می‌بیند؛ `astro.config.mjs` متغیر `FONTCONFIG_FILE` را به `assets/og-fonts/fonts.conf` می‌دهد (پیش از بارگذاری sharp). در SVG برای راست‌چین: `direction="rtl"` + `text-anchor="start"` (نه end).
- کش: `node_modules/.cache/bartar-media/<sha1>` — بیلدهای بعدی تصویرهای قبلی را دوباره نمی‌سازند.
