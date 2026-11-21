// یک بار اجرا شود: آیکون‌های PNG/ICO از public/favicon.svg
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
const svg = await readFile('public/favicon.svg');
for (const [name, size] of [['icon-48.png', 48], ['icon-96.png', 96], ['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(svg, { density: 600 }).resize(size, size).png().toFile(`public/${name}`);
}
// favicon.ico = PNG ۴۸×۴۸ داخل کانتینر ICO — گوگل فقط مضرب‌های ۴۸ پیکسل را در نتایج جست‌وجو نشان می‌دهد
const png = await sharp(svg, { density: 300 }).resize(48, 48).png().toBuffer();
const h = Buffer.alloc(22);
h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
h.writeUInt8(48, 6); h.writeUInt8(48, 7); h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12);
h.writeUInt32LE(png.length, 14); h.writeUInt32LE(22, 18);
await writeFile('public/favicon.ico', Buffer.concat([h, png]));
console.log('icons ok');
