import type { APIRoute } from 'astro';
import { allNews, newsUrl, ogUrl } from '../lib/news';
import { SITE, abs } from '../lib/site';

/** JSON Feed 1.1 — برای ربات تلگرام/برنامه‌ی ویدیو و هر مصرف‌کننده‌ی ماشینی */
export const GET: APIRoute = async () => {
  const items = (await allNews()).slice(0, 100);
  return new Response(
    JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: SITE.fullName, home_page_url: `${SITE.url}/`, feed_url: abs('/feed.json'), language: 'fa-IR', description: SITE.description,
      items: items.map((n) => ({
        id: n.id, url: abs(newsUrl(n)), title: n.data.title, summary: n.data.description, image: abs(ogUrl(n)),
        date_published: n.data.pubDate.toISOString(), tags: [n.data.category, ...n.data.tags],
        _bartar: { category: n.data.category, importance: n.data.importance, keyPoints: n.data.keyPoints, sources: n.data.sources },
      })),
    }),
    { headers: { 'Content-Type': 'application/feed+json; charset=utf-8' } },
  );
};
