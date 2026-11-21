import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { allNews, newsUrl, coverUrl, tagIndex } from '../lib/news';
import { SITE, CATEGORIES, abs } from '../lib/site';

/** سایت‌مپ کامل (فقط صفحه‌های ایندکس‌شدنی). سایت‌مپ خبری جدا: /news-sitemap.xml */
export const GET: APIRoute = async () => {
  const news = (await allNews()).filter((n) => !n.data.noindex);
  const last = news[0]?.data.pubDate.toISOString();
  const urls: string[] = [];
  const u = (loc: string, lastmod?: string, extra = '') =>
    urls.push(`<url><loc>${abs(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${extra}</url>`);

  u('/', last);
  u('/latest/', last);
  u('/weekly/');
  u('/about/');
  for (const c of CATEGORIES) {
    const l = news.find((n) => n.data.category === c.slug);
    if (l) u(`/category/${c.slug}/`, l.data.pubDate.toISOString());
  }
  for (const t of (await tagIndex()).values()) if (t.items.length >= 3) u(`/tag/${t.slug}/`, t.items[0].data.pubDate.toISOString());
  for (const w of await getCollection('weekly', (w) => !w.data.draft)) u(`/weekly/${w.id}/`, w.data.pubDate.toISOString());
  for (const n of news)
    u(newsUrl(n), (n.data.updatedDate ?? n.data.pubDate).toISOString(),
      `<image:image><image:loc>${abs(coverUrl(n))}</image:loc></image:image>`);

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
