/** تاریخ و عدد فارسی — همه با Intl خود Node/مرورگر (تقویم persian) */
const faDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'Asia/Tehran', day: 'numeric', month: 'long', year: 'numeric',
});
const faDateShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'Asia/Tehran', day: 'numeric', month: 'long',
});
const faTime = new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' });

export const jDate = (d: Date) => faDate.format(d);
export const jDateShort = (d: Date) => faDateShort.format(d);
export const jTime = (d: Date) => faTime.format(d);
export const faNum = (n: number) => n.toLocaleString('fa-IR');

/** «۲ ساعت پیش» — زمان بیلد مبناست؛ چون سایت هر ۴ ساعت بیلد می‌شود کافی است */
export function ago(d: Date, now = new Date()) {
  const m = Math.round((now.getTime() - d.getTime()) / 60000);
  if (m < 60) return `${faNum(Math.max(m, 1))} دقیقه پیش`;
  const h = Math.round(m / 60);
  if (h < 24) return `${faNum(h)} ساعت پیش`;
  const days = Math.round(h / 24);
  if (days < 7) return `${faNum(days)} روز پیش`;
  return jDate(d);
}

export function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** اسلاگ برچسب: حروف فارسی و لاتین می‌مانند، بقیه خط تیره */
export function tagSlug(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[\s_./]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
