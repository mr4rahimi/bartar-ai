import type { APIRoute } from 'astro';
import { allNews, newsUrl } from '../lib/news';
import { SITE, abs } from '../lib/site';

const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Google News sitemap — فقط خبرهای ۴۸ ساعت اخیر (قاعده‌ی گوگل) */
export const GET: APIRoute = async () => {
  const cutoff = Date.now() - 48 * 3.6e6;
  const news = (await allNews()).filter((n) => !n.data.noindex && n.data.pubDate.getTime() >= cutoff).slice(0, 1000);
  const body = news
    .map(
      (n) => `<url><loc>${abs(newsUrl(n))}</loc><news:news><news:publication><news:name>${x(SITE.fullName)}</news:name><news:language>fa</news:language></news:publication><news:publication_date>${n.data.pubDate.toISOString()}</news:publication_date><news:title>${x(n.data.title)}</news:title></news:news></url>`,
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${body}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
