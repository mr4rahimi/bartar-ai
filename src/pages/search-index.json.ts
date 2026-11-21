import type { APIRoute } from 'astro';
import { allNews, newsUrl } from '../lib/news';

/** نمایه‌ی سبک جست‌وجو؛ فقط وقتی کاربر به /search/ می‌رود بارگذاری می‌شود */
export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify(
      (await allNews()).map((n) => [newsUrl(n), n.data.title, n.data.description, n.data.tags.join(' '), n.data.category, n.data.pubDate.getTime()]),
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
