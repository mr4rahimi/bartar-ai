import type { APIRoute } from 'astro';
import { abs } from '../lib/site';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\n# خزنده‌های هوش مصنوعی مجازند (دیده شدن در ChatGPT/Perplexity/AI Overviews)\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\nSitemap: ${abs('/news-sitemap.xml')}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
