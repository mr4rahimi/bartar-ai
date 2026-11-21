# ۳. سئو

## ۳.۱ چه چیزهایی در کد هست

**هر صفحه** (`Base.astro`): title یکتا با پسوند «| برتر AI»، description، canonical مطلق با اسلش پایانی،
`robots: max-image-preview:large` (لازم برای Discover)، Open Graph و Twitter Card با تصویر ۱۲۰۰×۶۳۰، `lang="fa" dir="rtl"`،
فاوآیکن ۴۸/۹۶/۱۹۲ + manifest، RSS و JSON Feed در head، پیش‌بارگذاری فونت.

**JSON-LD** (یک `@graph`):
- همه‌جا: `NewsMediaOrganization` (با `parentOrganization` = مرکز تعمیرات برتر و `publishingPrinciples` = /about/)
- خانه: `WebSite` + `SearchAction`، `ItemList` خبرهای اصلی
- خبر: `NewsArticle` (headline، image ×۲، datePublished/Modified، articleSection، keywords، wordCount، author = تحریریه، `isBasedOn` و `citation` = منابع اصلی) + `BreadcrumbList`
- دسته: `CollectionPage` + `ItemList` + `BreadcrumbList`
- هفتگی: `NewsArticle` + `ItemList` (+ `VideoObject` وقتی `videoUrl` پر شد)

**سایت‌مپ‌ها:** `/sitemap.xml` (با image:image، فقط صفحه‌های index) و `/news-sitemap.xml` (Google News، ۴۸ ساعت).
**robots.txt:** همه مجاز + GPTBot، OAI-SearchBot، PerplexityBot، ClaudeBot، Google-Extended صریحاً مجاز (دیده شدن در پاسخ‌های هوش مصنوعی).
**llms.txt:** معرفی، دسته‌ها، خوراک‌ها، ۶۰ خبر آخر.
**IndexNow:** بعد از هر انتشار (Bing/Yandex/…؛ Copilot از ایندکس Bing می‌خواند).

**کیفیت محتوا (مهم‌ترین بخش سئوی سایت خبری خودکار):**
- بازنویسی با ساختار خبری، نه ترجمه‌ی ماشینی؛ بخش «چرا این خبر مهم است؟» ارزش افزوده است.
- لینک منبع اصلی زیر هر خبر + متن شفاف درباره‌ی نقش هوش مصنوعی + صفحه‌ی /about/ با روش کار.
- ضد کم‌محتوا: رد خودکار منبع کوتاه، برچسب‌های کمتر از ۳ خبر noindex، سقف ۱۵ خبر در روز (کیفیت > کمیت).
- لینک داخلی: دسته، برچسب، خبرهای مرتبط، «مهم‌ترین‌های هفته»، جمع‌بندی هفتگی.

**گارد بیلد** (`scripts/postbuild.mjs`): هر صفحه باید title (≤ ۹۵)، description، canonical، دقیقاً یک h1 و JSON-LD معتبر داشته باشد و
`undefined` در HTML نباشد؛ وگرنه بیلد شکست می‌خورد و ایجنت منتشر نمی‌کند.

**سرعت:** HTML استاتیک، CSS inline، بدون فریم‌ورک کلاینت، تصویرها webp با ابعاد مشخص (بدون CLS)، اولین کاور `fetchpriority=high`، بقیه lazy.

## ۳.۲ کارهای بیرونی (بعد از انتشار)

1. Search Console: پراپرتی `https://ai.bartar-repairer.com` (یا Domain property کل bartar-repairer.com اگر نیست) → Sitemaps: `sitemap.xml` و `news-sitemap.xml`.
2. Bing Webmaster Tools: افزودن سایت (IndexNow کلید را دارد).
3. **Google News / Publisher Center:** ثبت نشریه (اختیاری؛ ورود به Top Stories بدون آن هم ممکن است ولی کمک می‌کند).
4. لینک از سایت اصلی bartar-repairer.com به زیردامنه (مثلاً «اخبار هوش مصنوعی» در فوتر/منو) — مهم‌ترین سیگنال اولیه برای زیردامنه‌ی تازه.
5. کانال تلگرام: انتشار خودکار از `/feed.json` یا `/rss.xml` (پیشنهاد فاز بعد).
6. بعد از ۴ هفته: داده‌ی GSC را بخوانید — کدام دسته‌ها کلیک می‌گیرند → وزن منابع و `MIN_IMPORTANCE` تنظیم شود.

## ۳.۳ ریسک‌ها

- **Scaled content abuse:** اگر کیفیت افت کند (ترجمه‌ی تحت‌اللفظی، خبر بی‌ارزش)، گوگل کل زیردامنه را پایین می‌آورد. هفته‌ای چند خبر را بخوانید.
- **زیردامنه و سایت اصلی:** محتوای خبری با موضوع تعمیرات فرق دارد؛ گوگل زیردامنه را تقریباً جدا ارزیابی می‌کند. لینک‌دادن از سایت اصلی ضرری برای سایت اصلی ندارد.
- **آدرس‌ها دائمی‌اند:** نام فایل خبر را بعد از انتشار عوض نکنید (۴۰۴). اگر لازم شد، ریدایرکت ۳۰۱ در وب‌سرور.
