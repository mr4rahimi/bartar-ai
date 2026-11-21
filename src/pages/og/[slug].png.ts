import type { APIRoute } from 'astro';
import { allNews, type News } from '../../lib/news';
import { catBySlug } from '../../lib/site';
import { jDate } from '../../lib/format';
import { ogSvg, render } from '../../lib/cover';

export async function getStaticPaths() {
  return (await allNews()).map((n) => ({ params: { slug: n.id }, props: { n } }));
}
export const GET: APIRoute = async ({ props }) => {
  const n = props.n as News;
  const c = catBySlug(n.data.category);
  const svg = ogSvg({ seed: n.id, hue: c.hue, label: c.name, title: n.data.title, date: jDate(n.data.pubDate), host: 'ai.bartar-repairer.com' });
  return new Response(new Uint8Array(await render(svg, 'png')), { headers: { 'Content-Type': 'image/png' } });
};
