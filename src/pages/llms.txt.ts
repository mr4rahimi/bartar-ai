import type { APIRoute } from 'astro';
import { allNews, newsUrl } from '../lib/news';
import { SITE, CATEGORIES, abs } from '../lib/site';

export const GET: APIRoute = async () => {
  const news = (await allNews()).slice(0, 60);
  const txt = `# ${SITE.fullName} (${SITE.name})

> ${SITE.description}

زبان: فارسی. خبرها از منابع رسمی شرکت‌ها (OpenAI، Google DeepMind، Anthropic، Meta، NVIDIA، Hugging Face) و رسانه‌های فناوری معتبر گردآوری، با کمک هوش مصنوعی بازنویسی و همیشه با لینک منبع اصلی منتشر می‌شوند.

## دسته‌ها
${CATEGORIES.map((c) => `- [${c.name}](${abs(`/category/${c.slug}/`)}): ${c.description}`).join('\n')}

## خوراک‌ها
- [RSS](${abs('/rss.xml')})
- [JSON Feed](${abs('/feed.json')})
- [جمع‌بندی هفتگی](${abs('/weekly/')}) — داده‌ی ماشینی: ${abs('/weekly/latest.json')}

## آخرین خبرها
${news.map((n) => `- [${n.data.title}](${abs(newsUrl(n))}): ${n.data.description}`).join('\n')}
`;
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
