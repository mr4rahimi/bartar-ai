import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { allNews, newsUrl, ogUrl, coverUrl } from '../../lib/news';
import { abs } from '../../lib/site';

/**
 * داده‌ی ماشینی جمع‌بندی هفتگی — برای برنامه‌ی ساخت ویدیو.
 * /weekly/<id>.json و /weekly/latest.json (همان آخرین هفته)
 */
export async function getStaticPaths() {
  const ws = (await getCollection('weekly', (w) => !w.data.draft)).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return [...ws.map((w) => ({ params: { id: w.id }, props: { w } })), ...(ws[0] ? [{ params: { id: 'latest' }, props: { w: ws[0] } }] : [])];
}

export const GET: APIRoute = async ({ props }) => {
  const w = props.w as CollectionEntry<'weekly'>;
  const all = await allNews();
  const items = w.data.items
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((it) => {
      const n = all.find((x) => x.id === it.slug);
      if (!n) return null;
      return {
        rank: it.rank, note: it.note, slug: n.id, url: abs(newsUrl(n)), title: n.data.title, description: n.data.description,
        category: n.data.category, tags: n.data.tags, keyPoints: n.data.keyPoints, importance: n.data.importance,
        pubDate: n.data.pubDate.toISOString(), sources: n.data.sources, cover: abs(coverUrl(n)), og: abs(ogUrl(n)), body: n.body,
      };
    })
    .filter(Boolean);
  const body = {
    id: w.id, url: abs(`/weekly/${w.id}/`), title: w.data.title, description: w.data.description, weekLabel: w.data.weekLabel,
    weekStart: w.data.weekStart.toISOString(), weekEnd: w.data.weekEnd.toISOString(), pubDate: w.data.pubDate.toISOString(),
    intro: w.body, videoScript: w.data.videoScript, items,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
