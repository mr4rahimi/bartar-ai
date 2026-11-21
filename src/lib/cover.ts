/**
 * کاور و تصویر OG خودکار هر خبر — هنگام بیلد با sharp از SVG ساخته می‌شود.
 * بدون عکس منبع (بدون ریسک کپی‌رایت)، یکدست، سبک و قطعی (برای هر خبر همیشه یک تصویر).
 * فونت: assets/og-fonts (FONTCONFIG_FILE در astro.config.mjs تنظیم می‌شود).
 * خروجی در node_modules/.cache/bartar-media کش می‌شود تا بیلدهای بعدی سریع باشند.
 */
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CACHE = join(process.cwd(), 'node_modules/.cache/bartar-media');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function rng(seed: string) {
  let h = createHash('md5').update(seed).digest().readUInt32LE(0);
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    return h / 4294967296;
  };
}

function background(w: number, h: number, hue: number, seed: string) {
  const r = rng(seed);
  const nodes = Array.from({ length: 16 }, () => [r() * w, r() * h, 2 + r() * 4] as const);
  const lines: string[] = [];
  nodes.forEach(([x, y], i) => {
    nodes.forEach(([x2, y2], j) => {
      if (j > i && Math.hypot(x - x2, y - y2) < w * 0.24)
        lines.push(`<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}"/>`);
    });
  });
  const h2 = (hue + 45) % 360;
  return `
  <defs>
    <radialGradient id="g1" cx="${(0.7 + r() * 0.25).toFixed(2)}" cy="${(0.1 + r() * 0.3).toFixed(2)}" r="0.75">
      <stop offset="0" stop-color="hsl(${hue},85%,55%)" stop-opacity=".85"/>
      <stop offset="1" stop-color="hsl(${hue},85%,55%)" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="${(0.05 + r() * 0.3).toFixed(2)}" cy="${(0.7 + r() * 0.3).toFixed(2)}" r="0.7">
      <stop offset="0" stop-color="hsl(${h2},80%,50%)" stop-opacity=".55"/>
      <stop offset="1" stop-color="hsl(${h2},80%,50%)" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#fff" stroke-opacity=".06"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="#0a1020"/>
  <rect width="${w}" height="${h}" fill="url(#g1)"/>
  <rect width="${w}" height="${h}" fill="url(#g2)"/>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>
  <g stroke="#fff" stroke-opacity=".14" stroke-width="1.2">${lines.join('')}</g>
  <g fill="#fff">${nodes.map(([x, y, s]) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(1)}" fill-opacity=".55"/>`).join('')}</g>`;
}

function wrap(text: string, max: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + ' …';
  }
  return lines;
}

const pill = (xRight: number, y: number, label: string, hue: number) => {
  const w = label.length * 17 + 44;
  return `<rect x="${xRight - w}" y="${y}" width="${w}" height="50" rx="25" fill="hsl(${hue},85%,55%)" fill-opacity=".9"/>
  <text x="${xRight - 22}" y="${y + 34}" font-family="Vazirmatn" font-weight="700" font-size="25" fill="#fff" direction="rtl" text-anchor="start">${esc(label)}</text>`;
};

const brand = (x: number, y: number) =>
  `<text x="${x}" y="${y}" font-family="Vazirmatn" font-weight="900" font-size="30" fill="#fff" fill-opacity=".92">BARTAR<tspan fill="#ff4d5e"> AI</tspan></text>`;

export function coverSvg(o: { seed: string; hue: number; label: string; text: string }) {
  const W = 1200, H = 675;
  const t = (o.text || 'AI').slice(0, 24);
  const size = t.length <= 6 ? 190 : t.length <= 10 ? 140 : t.length <= 16 ? 100 : 76;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${background(W, H, o.hue, o.seed)}
  ${pill(W - 60, 56, o.label, o.hue)}
  <text x="${W - 60}" y="${H / 2 + size * 0.38}" font-family="Vazirmatn" font-weight="900" font-size="${size}" fill="#fff" text-anchor="end" letter-spacing="-2">${esc(t)}</text>
  ${brand(60, H - 56)}
</svg>`;
}

export function ogSvg(o: { seed: string; hue: number; label: string; title: string; date: string; host: string }) {
  const W = 1200, H = 630;
  const lines = wrap(o.title, 30, 3);
  const fs = lines.length >= 3 ? 56 : 62;
  const startY = 250 - (lines.length - 1) * 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${background(W, H, o.hue, o.seed)}
  <rect width="${W}" height="${H}" fill="#0a1020" fill-opacity=".45"/>
  ${pill(W - 64, 60, o.label, o.hue)}
  ${lines
    .map((l, i) => `<text x="${W - 64}" y="${startY + i * fs * 1.55}" font-family="Vazirmatn" font-weight="900" font-size="${fs}" fill="#fff" direction="rtl" text-anchor="start">${esc(l)}</text>`)
    .join('')}
  <rect x="64" y="${H - 104}" width="${W - 128}" height="1" fill="#fff" fill-opacity=".25"/>
  ${brand(64, H - 50)}
  <text x="${W - 64}" y="${H - 50}" font-family="Vazirmatn" font-weight="500" font-size="26" fill="#fff" fill-opacity=".8" direction="rtl" text-anchor="start">${esc(o.date)} · ${esc(o.host)}</text>
</svg>`;
}

export async function render(svg: string, format: 'webp' | 'png', width?: number) {
  const key = createHash('sha1').update(svg + format + (width ?? '')).digest('hex');
  const file = join(CACHE, `${key}.${format}`);
  try {
    return await readFile(file);
  } catch {}
  let img = sharp(Buffer.from(svg));
  if (width) img = img.resize({ width });
  const buf = format === 'webp' ? await img.webp({ quality: 74 }).toBuffer() : await img.png({ compressionLevel: 9, palette: true }).toBuffer();
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, buf);
  return buf;
}
