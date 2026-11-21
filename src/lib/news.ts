import { getCollection, type CollectionEntry } from 'astro:content';
import { tagSlug } from './format';

export type News = CollectionEntry<'news'>;

let cache: News[] | null = null;
/** همه‌ی خبرهای منتشرشده، تازه‌ترین اول */
export async function allNews(): Promise<News[]> {
  if (cache) return cache;
  const items = await getCollection('news', (e) => !e.data.draft);
  cache = items.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return cache;
}

export const newsUrl = (n: News | string) => `/news/${typeof n === 'string' ? n : n.id}/`;
export const coverUrl = (n: News) => `/cover/${n.id}.webp`;
export const ogUrl = (n: News) => `/og/${n.id}.png`;

/** امتیاز «داغ بودن»: اهمیت خبر با گذر زمان کم می‌شود */
export function hotScore(n: News, now = Date.now()) {
  const hours = (now - n.data.pubDate.getTime()) / 3.6e6;
  return n.data.importance / Math.pow(hours / 24 + 1, 1.3);
}

export async function tagIndex() {
  const map = new Map<string, { name: string; slug: string; items: News[] }>();
  for (const n of await allNews()) {
    for (const t of n.data.tags) {
      const slug = tagSlug(t);
      if (!slug) continue;
      if (!map.has(slug)) map.set(slug, { name: t, slug, items: [] });
      map.get(slug)!.items.push(n);
    }
  }
  return map;
}

/** خبرهای مرتبط: برچسب مشترک ۳ امتیاز، دسته‌ی مشترک ۱، تازگی کمی */
export async function related(n: News, count = 4) {
  const tags = new Set(n.data.tags.map(tagSlug));
  return (await allNews())
    .filter((o) => o.id !== n.id)
    .map((o) => {
      let s = o.data.tags.filter((t) => tags.has(tagSlug(t))).length * 3;
      if (o.data.category === n.data.category) s += 1;
      s -= Math.abs(o.data.pubDate.getTime() - n.data.pubDate.getTime()) / (86400000 * 30);
      return { o, s };
    })
    .filter((x) => x.s > 0.5)
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.o);
}
