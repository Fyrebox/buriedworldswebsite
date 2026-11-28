import sharp from 'sharp';

// The press-kit wordmark is a 2.1 MB PNG with a wide transparent border.
// Trim it to the art, then ship two WebPs: 560 CSS px is the widest the hero
// ever draws it, so 1120 covers retina. New filenames rather than a rewrite —
// public/ is cached immutable for a year (README § Static assets).
const trimmed = await sharp('public/press/art/wordmark.png')
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
  .toBuffer();

for (const [width, quality] of [[1120, 75], [560, 82]]) {
  const out = `public/images/wordmark-${width}.webp`;
  const info = await sharp(trimmed)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, alphaQuality: 90, effort: 6 })
    .toFile(out);
  console.log(out, `${info.width}x${info.height}`, Math.round(info.size / 1024) + ' KB');
}
