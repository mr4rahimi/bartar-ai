/** متن کامل مقاله‌ی منبع با Readability (همان موتور حالت خواندن فایرفاکس) */
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import { get } from './feeds.mjs';

export async function extract(url, maxChars = 14000) {
  const { text: html, url: finalUrl } = await get(url, { accept: 'text/html' });
  const { document } = parseHTML(html);
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') ?? '';
  const published =
    meta('meta[property="article:published_time"]') ||
    meta('meta[name="publish-date"]') ||
    document.querySelector('time[datetime]')?.getAttribute('datetime') ||
    (html.match(/"datePublished"\s*:\s*"([^"]+)"/) ?? [])[1] ||
    '';
  const ogTitle = meta('meta[property="og:title"]');
  const article = new Readability(document, { charThreshold: 300 }).parse();
  const text = (article?.textContent ?? '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
  return {
    url: finalUrl,
    title: ogTitle || article?.title || '',
    text: text.slice(0, maxChars),
    publishedAt: published ? new Date(published) : null,
  };
}
