/** خواندن منابع: RSS/Atom و صفحه‌ی HTML (برای سایت‌های بی‌فید مثل Anthropic) */
import { XMLParser } from 'fast-xml-parser';
import { parseHTML } from 'linkedom';
import { CONFIG } from './config.mjs';
import { log } from './log.mjs';

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', textNodeName: '#text' });

export async function get(url, { timeoutMs = 25_000, accept = '*/*' } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': CONFIG.userAgent, Accept: accept, 'Accept-Language': 'en' }, signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { text: await res.text(), url: res.url };
  } finally {
    clearTimeout(t);
  }
}

const txt = (v) => (v == null ? '' : typeof v === 'string' ? v : typeof v === 'object' ? (v['#text'] ?? '') : String(v));
const strip = (html) => txt(html).replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** نشانی را یکدست می‌کند تا تکراری‌ها شناخته شوند (utm و # حذف) */
export function canonicalUrl(u) {
  try {
    const x = new URL(u);
    x.hash = '';
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|ref|source|fbclid|gclid)/i.test(k)) x.searchParams.delete(k);
    x.hostname = x.hostname.replace(/^www\./, '');
    return x.toString().replace(/\/$/, '');
  } catch {
    return u;
  }
}

function parseFeed(body, src) {
  const doc = xml.parse(body);
  const items = [];
  for (const it of arr(doc?.rss?.channel?.item)) {
    items.push({
      title: strip(it.title),
      url: txt(it.link) || txt(it.guid),
      summary: strip(it.description ?? it['content:encoded']).slice(0, 600),
      publishedAt: it.pubDate ? new Date(txt(it.pubDate)) : it['dc:date'] ? new Date(txt(it['dc:date'])) : null,
    });
  }
  for (const it of arr(doc?.feed?.entry)) {
    const links = arr(it.link);
    const link = links.find((l) => !l['@rel'] || l['@rel'] === 'alternate') ?? links[0];
    items.push({
      title: strip(it.title),
      url: link?.['@href'] ?? txt(link),
      summary: strip(it.summary ?? it.content).slice(0, 600),
      publishedAt: new Date(txt(it.published ?? it.updated)),
    });
  }
  return items.map((i) => ({ ...i, source: src.id }));
}

/** فهرست لینک‌های خبر از یک صفحه‌ی HTML؛ تاریخ بعداً از خود مقاله خوانده می‌شود */
function parseHtmlList(body, src) {
  const { document } = parseHTML(body);
  const re = new RegExp(src.linkPattern);
  const seen = new Set();
  const items = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    const path = href.startsWith('http') ? new URL(href).pathname : href.split('?')[0];
    if (!re.test(path) || src.exclude?.includes(path) || seen.has(path)) continue;
    seen.add(path);
    const title = (a.querySelector('h2,h3,h4,[class*=title]')?.textContent ?? a.textContent).replace(/\s+/g, ' ').trim();
    items.push({ title: title.slice(0, 200), url: new URL(path, src.url).toString(), summary: '', publishedAt: null, source: src.id, needsDate: true });
  }
  return items.slice(0, 15);
}

/** نشانی‌هایی که هرگز خبر نیستند */
const SKIP_URL = /\/(podcasts?|videos?|events?|webinars?|sponsored|partner-content|deals|newsletters?|jobs|careers)\//i;

export async function fetchSource(src) {
  try {
    const { text } = await get(src.url, { accept: src.type === 'rss' ? 'application/rss+xml, application/atom+xml, application/xml, text/xml' : 'text/html' });
    const items = src.type === 'rss' ? parseFeed(text, src) : parseHtmlList(text, src);
    return items.filter((i) => i.url && i.title && !SKIP_URL.test(i.url)).map((i) => ({ ...i, url: canonicalUrl(i.url) }));
  } catch (e) {
    log(`منبع ${src.id} خطا داد:`, String(e.message ?? e));
    return [];
  }
}

export async function fetchAll(sources) {
  const res = await Promise.all(sources.map(async (s) => [s.id, await fetchSource(s)]));
  const stats = Object.fromEntries(res.map(([id, items]) => [id, items.length]));
  return { items: res.flatMap(([, items]) => items), stats };
}
