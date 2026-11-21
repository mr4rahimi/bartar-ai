import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import categories from './data/categories.json';

const catSlugs = categories.map((c) => c.slug) as [string, ...string[]];

/**
 * خبرها را ایجنت (agent/run.mjs) می‌نویسد؛ هر فایل = یک خبر.
 * نام فایل = آدرس: src/content/news/<slug>.md → /news/<slug>/
 * برای پنهان کردن یک خبر بدون حذف: draft: true (از سایت‌مپ و فهرست‌ها هم خارج می‌شود).
 */
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string().max(110),
    description: z.string().max(220),
    category: z.enum(catSlugs),
    tags: z.array(z.string()).default([]),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    importance: z.number().min(1).max(10).default(5),
    keyPoints: z.array(z.string()).default([]),
    coverText: z.string().max(24).optional(),
    sources: z
      .array(z.object({ name: z.string(), url: z.string().url(), title: z.string().optional() }))
      .min(1),
    originalTitle: z.string().optional(),
    draft: z.boolean().default(false),
    noindex: z.boolean().default(false),
    model: z.string().optional(),
  }),
});

/** جمع‌بندی هفتگی (agent/weekly.mjs) — پایه‌ی ویدیوی هفتگی */
const weekly = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/weekly' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    weekLabel: z.string(),
    weekStart: z.coerce.date(),
    weekEnd: z.coerce.date(),
    pubDate: z.coerce.date(),
    items: z.array(z.object({ slug: z.string(), rank: z.number(), note: z.string().default('') })),
    videoScript: z.string().default(''),
    /** لینک ویدیوی منتشرشده (آپارات/یوتیوب) — بعد از ساخت ویدیو دستی پر شود */
    videoUrl: z.string().url().optional(),
    videoEmbed: z.string().url().optional(),
    model: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { news, weekly };
