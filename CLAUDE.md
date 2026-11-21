# برتر AI — ai.bartar-repairer.com

سایت خبری هوش مصنوعی (Astro 7 استاتیک) + ایجنت خودکار خبر (Node، GapGPT). **اول `docs/00-START-HERE.md` را بخوان.**

- هر تغییر مهم یا تصمیم: یک بند در `docs/06-dev-log.md` و به‌روزرسانی سند مربوط در `docs/`.
- `secret/` و `.env` کلید API دارند؛ هرگز کامیت یا چاپ نشوند.
- پرامپت‌ها در `agent/prompts/*.md`؛ دسته‌ها در `src/data/categories.json` (مشترک سایت و ایجنت).
- نام فایل خبر = آدرس عمومی؛ بعد از انتشار عوض نشود.
- متن سایت بدون نیم‌فاصله (`NO_ZWNJ=true`، قاعده‌ی کارفرما).
- قبل از تحویل: `npm run build` (گارد سئو) و برای تغییر ظاهر `node scripts/shot.mjs <dir> /`.
- آزمون ایجنت بدون انتشار: `node agent/run.mjs --dry` یا `--limit=1 --no-build`.
