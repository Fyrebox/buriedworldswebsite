import test from 'node:test';
import assert from 'node:assert/strict';

import jsQR from 'jsqr';
import { PNG } from 'pngjs';

import { buildQrUrl, createQrPng, createQrSvg } from './qr-code.mjs';

test('QR URLs use the permanent short link and identify scans', () => {
  assert.equal(
    buildQrUrl('https://www.buriedworlds.com/', 'convention-flyer'),
    'https://www.buriedworlds.com/go/convention-flyer?placement=qr'
  );
});

test('QR generator returns scalable SVG and high-resolution PNG assets', async () => {
  const url = buildQrUrl('https://www.buriedworlds.com', 'convention-flyer');
  const [svg, png] = await Promise.all([createQrSvg(url), createQrPng(url)]);

  assert.match(svg, /^<svg/);
  assert.match(svg, /viewBox=/);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.length > 5000);

  const image = PNG.sync.read(png);
  const decoded = jsQR(
    new Uint8ClampedArray(image.data.buffer, image.data.byteOffset, image.data.byteLength),
    image.width,
    image.height
  );
  assert.equal(decoded?.data, url);
});
