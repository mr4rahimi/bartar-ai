import type { APIRoute } from 'astro';
import { ogSvg, render } from '../lib/cover';
import { SITE } from '../lib/site';

export const GET: APIRoute = async () => {
  const svg = ogSvg({ seed: 'home', hue: 352, label: 'اخبار هوش مصنوعی', title: SITE.tagline, date: SITE.name, host: 'ai.bartar-repairer.com' });
  return new Response(new Uint8Array(await render(svg, 'png')), { headers: { 'Content-Type': 'image/png' } });
};
