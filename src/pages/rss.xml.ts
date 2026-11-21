import type { APIRoute } from 'astro';
import { allNews, newsUrl, ogUrl } from '../lib/news';
import { SITE, abs, catBySlug } from '../lib/site';

const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async () => {
  const items = (await allNews()).slice(0, 50);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>${x(SITE.fullName)}</title>
<link>${SITE.url}/</link>
<description>${x(SITE.description)}</description>
<language>fa-IR</language>
<atom:link href="${abs('/rss.xml')}" rel="self" type="application/rss+xml"/>
${items[0] ? `<lastBuildDate>${items[0].data.pubDate.toUTCString()}</lastBuildDate>` : ''}
${items
  .map(
    (n) => `<item>
<title>${x(n.data.title)}</title>
<link>${abs(newsUrl(n))}</link>
<guid isPermaLink="true">${abs(newsUrl(n))}</guid>
<pubDate>${n.data.pubDate.toUTCString()}</pubDate>
<category>${x(catBySlug(n.data.category).name)}</category>
<description>${x(n.data.description)}</description>
<media:content url="${abs(ogUrl(n))}" medium="image" width="1200" height="630"/>
</item>`,
  )
  .join('\n')}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
