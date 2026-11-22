# ۲. ایجنت خبر

## ۲.۱ فایل‌ها

```
agent/run.mjs            ارکستراتور (هر ۴ ساعت)
agent/weekly.mjs         جمع‌بندی هفتگی (جمعه‌ها)
agent/reclean.mjs        پاکسازی دوباره‌ی همه‌ی خبرها با cleanFa (YAML را درست می‌خواند/می‌نویسد)
agent/models.mjs         فهرست مدل‌های GapGPT
agent/sources.json       منابع (id، نوع rss/html، وزن ۱–۱۰، official)
agent/prompts/triage.md  پرامپت غربال (معیار اهمیت ۱–۱۰)
agent/prompts/writer.md  پرامپت نویسنده (قاعده‌های قطعی ضد جعل، ساختار، فیلدها)
agent/prompts/weekly.md  پرامپت جمع‌بندی و متن ویدیو
agent/lib/config.mjs     تنظیمات (.env)
agent/lib/llm.mjs        کلاینت GapGPT: تکرار، مهلت، شمارش توکن، استخراج JSON، مدل جایگزین
agent/lib/feeds.mjs      RSS/Atom/HTML، یکدست‌سازی URL، فیلتر پادکست/ویدیو/رپورتاژ
agent/lib/extract.mjs    متن کامل با @mozilla/readability + تاریخ انتشار
agent/lib/store.mjs      seen.json، خواندن خبرهای منتشرشده از فایل‌ها، نوشتن md، قفل
agent/lib/text.mjs       cleanFa (ی/ک عربی، نیم‌فاصله)، نسبت فارسی، slugify، شباهت عنوان
agent/lib/publish.mjs    git pull/commit/push، build، DEPLOY_CMD، IndexNow
agent/state/             (در گیت نیست) seen.json، runs.jsonl، agent.log، *.lock
```

**پرامپت‌ها را بدون دست زدن به کد ویرایش کنید.** `{{CATEGORIES}}` خودکار با فهرست دسته‌ها پر می‌شود.

## ۲.۲ مراحل `run.mjs`

1. **قفل** (`state/run.lock`، کهنه‌تر از ۱ ساعت شکسته می‌شود) و `git pull` (اگر `GIT_PUSH=true`).
2. **سهمیه:** `min(PER_RUN, PER_DAY − خبرهای امروز تهران)`.
3. **جمع‌آوری** هم‌زمان از همه‌ی منابع؛ حذف: دیده‌شده در `seen.json`، منتشرشده (URL منبع)، قدیمی‌تر از `MAX_AGE_HOURS`، و نشانی‌های `/podcast/`، `/video/`، `/events/`، `/sponsored/`، …
   منبع `html` (Anthropic): لینک‌ها با `linkPattern` از صفحه‌ی فهرست؛ تاریخ از خود مقاله.
4. **غربال** (`TRIAGE_MODEL`، دسته‌های ۲۵تایی): `ai`، `importance`، `category`، `event` (کلید رویداد)، `dup` (تکرار یک خبر منتشرشده).
   مدل ارزان گاهی بخشی از موارد را جا می‌اندازد → موارد بی‌پاسخ تا دو دور دوباره پرسیده می‌شوند. آستانه در روز کم‌خبر ۵ است (`QUIET_BELOW`).
   مورد ردشده (غیر AI، تکراری، اهمیت زیر `MIN_IMPORTANCE`) در `seen` ثبت می‌شود. **خبر خوبی که فقط به سهمیه نرسید ثبت نمی‌شود** تا اجرای بعد دوباره شانس داشته باشد.
   کمربند دوم: شباهت ژاکارد عنوان با `originalTitle` خبرهای ۵ روز اخیر > ۰٫۶ = تکراری.
5. **رتبه:** `اهمیت + ۰٫۵ × (تعداد منابع اضافه، حداکثر ۳) + وزن منبع / ۱۰`.
6. **نوشتن** (`WRITER_MODEL`): تا `PER_RUN` خبر، با ۳ گزینه‌ی ذخیره (اگر نویسنده یکی را رد کرد، بعدی جایش را می‌گیرد). متن کامل تا ۳ منبع (اولی رسمی‌ترین؛ ۱۲هزار + ۵هزار کاراکتر) + فهرست تیترهای ۳ روز اخیر (کمربند سوم ضد تکرار).
   مدل می‌تواند `{"skip": true, "reason": …}` بدهد (منبع کم‌محتوا/تکراری) — این را خودش واقعاً انجام می‌دهد.
7. **کنترل کیفیت** (`validate`): طول تیتر و توضیح، ≥ ۲۲۰ کلمه، ≥ ۶۰٪ حروف فارسی، بخش `##`، بخش «چرا…»، keyPoints، slug. در صورت شکست یک بار با بازخورد دوباره؛ بعد رد.
8. **نوشتن فایل** با `cleanFa` و فرانت‌متر YAML.
9. **انتشار:** `npm run build` (اگر گارد سئو بشکند، چیزی پوش/دیپلوی نمی‌شود) → کامیت فقط همان فایل‌ها → `DEPLOY_CMD` → IndexNow.
10. گزارش اجرا در `state/runs.jsonl` (تعداد، رد‌شده‌ها با دلیل، خطاها، توکن هر مدل).

## ۲.۳ تنظیمات (`.env`)

| متغیر | پیش‌فرض | توضیح |
|---|---|---|
| `GAPGPT_API_KEY` | — | از `secret/key.md` |
| `TRIAGE_MODEL` | `gpt-5.4-mini` | ارزان؛ فقط سرتیتر و خلاصه |
| `WRITER_MODEL` | `claude-opus-5-5` | از ۲۰۲۶-۱۱-۲۲ (قبلاً sonnet-5-5 — §۲.۴) |
| `FALLBACK_MODEL` | `gpt-5.4` | اگر مدل اصلی ۲ بار JSON معتبر نداد |
| `PER_RUN` / `PER_DAY` | ۴ / ۱۵ | |
| `MIN_IMPORTANCE` | ۶ | |
| `QUIET_BELOW` / `MIN_IMPORTANCE_QUIET` | ۸ / ۵ | اگر در ۲۴ ساعت اخیر کمتر از ۸ خبر منتشر شده، آستانه ۵ (آخر هفته‌ها) |
| `MAX_AGE_HOURS` | ۳۶ | |
| `NO_ZWNJ` | `true` | قاعده‌ی کارفرما |
| `GIT_PUSH` | `false` | روی سرور `true` |
| `DEPLOY_CMD` | خالی | مثلاً `rsync -az --delete dist/ user@host:/var/www/bartar-ai/dist/` |
| `INDEXNOW_KEY` | (ساخته شد) | فایل `public/<key>.txt` همراه سایت منتشر می‌شود |
| `PUBLIC_UMAMI_ID` | خالی | در بیلد |

## ۲.۴ هزینه

> ⚠️ **۲۰۲۶-۱۱-۲۲ — توکن‌شماری غیرعادی GapGPT برای `claude-sonnet-5-5`:** هر ورودی متوسط (۳ تا ۸ هزار کاراکتر) را **~۲۷ تا ۲۸ هزار توکن**
> حساب می‌کند (در `billing_usage.claude_usage.input_tokens` هم همین)، در حالی که همان متن با `claude-opus-5-5` ~۲٫۱ تا ۲٫۹ هزار و با `gpt-5.4` ~۱٫۱ هزار است
> («hi» فقط ۳۵). اجرای واقعی: ۶ تماس Sonnet = ۱۲۸هزار توکن؛ ۵ تماس Opus = ۲۳٫۶هزار. نویسنده به Opus تغییر کرد (کیفیت هم بهتر، بدون خطای JSON).
> **قیمت هر توکن Opus/Sonnet را در پنل GapGPT ببینید**؛ برای آزمون دوباره‌ی شمارش: اسکریپت کوتاه در `06-dev-log.md`.

### اندازه‌گیری ۲۰۲۶-۱۱-۲۲ (Opus)
| مرحله | توکن تقریبی |
|---|---|
| غربال هر اجرا | ۲ تا ۴ هزار ورودی (`gpt-5.4-mini`) |
| هر خبر | ~۴٫۷ هزار ورودی + ~۳ هزار خروجی (`claude-opus-5-5`)؛ ~۳۰ ثانیه |

### اندازه‌گیری اولیه ۲۰۲۶-۱۱-۲۱ (Sonnet، روی لپ‌تاپ — اعداد بالا را ببینید)

| مرحله | توکن تقریبی |
|---|---|
| غربال هر اجرا (~۴۵ سرتیتر) | ۴٬۰۰۰ ورودی + ۱٬۴۰۰ خروجی (`gpt-5.4-mini`) |
| هر خبر | ۷٬۰۰۰ ورودی + ۳٬۵۰۰ خروجی (`claude-sonnet-5-5`)؛ ~۳۰ ثانیه |
| جمع‌بندی هفتگی | ۳٬۰۰۰ + ۶٬۰۰۰ |

روزانه با ۱۵ خبر: حدود **۱۳۰ هزار توکن ورودی + ۶۰ هزار خروجی** از مدل نویسنده. قیمت را از پنل GapGPT ببینید. برای ارزان‌تر کردن: `WRITER_MODEL=gpt-5.4` یا `gemini-3.8-flash` (کیفیت فارسی را اول با `--limit=2 --no-build` بسنجید).

## ۲.۵ منابع (`agent/sources.json`)

**متن منبع:** اول صفحه‌ی خود مقاله با شناسه‌ی واقعی ربات؛ اگر سایت ربات را رد کرد (مثلاً MarkTechPost با ۴۰۳) یا متن کوتاه بود،
متن کاملی که خود ناشر در فید RSS (`content:encoded`) گذاشته. **شناسه‌ی مرورگر جعل نمی‌شود** — مسدودسازی ربات توسط سایت محترم است.
`"disabled": true` یک منبع را بدون حذف خاموش می‌کند (VentureBeat: همیشه ۴۲۹).

اضافه‌شده ۲۰۲۶-۱۱-۲۲: Google Research (رسمی)، The Register AI، SiliconANGLE AI، ZDNET AI، 9to5Mac (Apple Intelligence)، Tom's Hardware AI.

رسمی: OpenAI، Anthropic (HTML)، Google DeepMind، Google AI Blog، Mistral، Hugging Face، NVIDIA، AWS ML.
رسانه: TechCrunch، The Verge، Ars Technica، MIT Technology Review، VentureBeat، WIRED، The Decoder، MIT News، MarkTechPost.

- از لپ‌تاپ (VPN): VentureBeat ۴۲۹ و MIT TR/Verge گاهی تایم‌اوت — از فرانکفورت دوباره بسنجید.
- Microsoft AI blog فید ندارد (۴۱۰). Meta AI فید ندارد (می‌شود مثل Anthropic `html` اضافه کرد).
- افزودن منبع: یک خط در `sources.json`؛ برای `html` الگوی `linkPattern` روی pathname.

## ۲.۶ عیب‌یابی

| نشانه | کار |
|---|---|
| «اجرای دیگری در جریان است» | `agent/state/run.lock` را بعد از اطمینان پاک کنید |
| هیچ خبر تازه‌ای نیست | `seen.json` همه را دیده؛ برای آزمون: `rm agent/state/seen.json` و `--dry` |
| خبر تکراری منتشر شد | `draft: true` + بررسی `event` در لاگ؛ در صورت تکرار، آستانه‌ی شباهت در `run.mjs` |
| خبر اشتباه | فایل را اصلاح و `updatedDate` بگذارید، یا `draft: true` |
| بیلد با postbuild شکست | پیام خطا صفحه و دلیل را می‌گوید (title، description، canonical، h1، JSON-LD) |
| مدل خطای ۴۰۱ | کلید GapGPT در `.env`؛ `npm run agent:models` |
