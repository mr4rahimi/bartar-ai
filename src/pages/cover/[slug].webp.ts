import type { APIRoute } from 'astro';
import { allNews, type News } from '../../lib/news';
import { catBySlug } from '../../lib/site';
import { coverSvg, render } from '../../lib/cover';

export async function getStaticPaths() {
  return (await allNews()).map((n) => ({ params: { slug: n.id }, props: { n } }));
}
export const GET: APIRoute = async ({ props }) => {
  const n = props.n as News;
  const c = catBySlug(n.data.category);
  const svg = coverSvg({ seed: n.id, hue: c.hue, label: c.name, text: n.data.coverText ?? n.data.tags[0] ?? 'AI' });
  return new Response(new Uint8Array(await render(svg, 'webp', 960)), { headers: { 'Content-Type': 'image/webp' } });
};
