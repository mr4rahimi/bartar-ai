// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

// فونت فارسی برای ساخت کاور/OG با sharp (src/lib/cover.ts) — باید قبل از بارگذاری sharp تنظیم شود
process.env.FONTCONFIG_FILE ??= fileURLToPath(new URL('./assets/og-fonts/fonts.conf', import.meta.url));

/**
 * ai.bartar-repairer.com — سایت خبری هوش مصنوعی برتر.
 * کاملاً استاتیک؛ هر صفحه بدون جاوااسکریپت کار می‌کند. مستند: docs/00-START-HERE.md
 */
export default defineConfig({
  site: 'https://ai.bartar-repairer.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  output: 'static',
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  vite: { build: { cssCodeSplit: false } },
});
