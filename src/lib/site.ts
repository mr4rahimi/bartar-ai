import categories from '../data/categories.json';

export const SITE = {
  url: 'https://ai.bartar-repairer.com',
  name: 'برتر AI',
  fullName: 'اخبار هوش مصنوعی برتر',
  tagline: 'تازه ترین اخبار هوش مصنوعی جهان، به فارسی',
  description:
    'جدیدترین اخبار هوش مصنوعی از OpenAI، Google، Anthropic، Meta و منابع معتبر جهانی، دسته بندی شده و به زبان فارسی؛ هر روز به روز.',
  locale: 'fa_IR',
  lang: 'fa',
  parent: { name: 'مرکز تخصصی تعمیرات برتر', url: 'https://bartar-repairer.com/' },
  logo: '/logo.png',
  twitter: '',
  telegram: '',
  pageSize: 18,
};

export type Category = (typeof categories)[number];
export const CATEGORIES: Category[] = categories;
export const catBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug)!;

export const abs = (path: string) => new URL(path, SITE.url).href;
