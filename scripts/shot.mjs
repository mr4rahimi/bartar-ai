// اسکرین‌شات برای بازبینی ظاهر: node scripts/shot.mjs <outdir> [path ...]
// نیازمند playwright (از apple-astro قرض گرفته می‌شود) و google-chrome
import { createRequire } from 'node:module';
const require = createRequire('/home/mehdi/Projects/astro-sites/apple-astro/package.json');
const { chromium } = require('playwright');
const [out, ...paths] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [name, vp, scheme] of [['desktop', { width: 1440, height: 900 }, 'light'], ['mobile', { width: 390, height: 844 }, 'light'], ['desktop-dark', { width: 1440, height: 900 }, 'dark']]) {
  const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const p of paths.length ? paths : ['/']) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    const file = `${out}/${name}${p.replace(/[^a-z0-9]+/gi, '_')}.png`;
    await page.screenshot({ path: file, fullPage: name !== 'desktop-dark' });
    console.log(file);
  }
  await ctx.close();
}
await browser.close();
