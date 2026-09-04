// Print-ready QR assets for campaign links. Images are generated on demand so
// PostgreSQL only stores the campaign, never duplicate binary files.

import QRCode from 'qrcode';

const QR_OPTIONS = {
  errorCorrectionLevel: 'H',
  margin: 4,
  color: {
    dark: '#1F211FFF',
    light: '#FFFFFFFF'
  }
};

export function buildQrUrl(siteUrl, slug) {
  const url = new URL(`/go/${slug}`, siteUrl);
  url.searchParams.set('placement', 'qr');
  return url.toString();
}

export function createQrSvg(url) {
  return QRCode.toString(url, {
    ...QR_OPTIONS,
    type: 'svg'
  });
}

export function createQrPng(url) {
  return QRCode.toBuffer(url, {
    ...QR_OPTIONS,
    type: 'png',
    width: 2048
  });
}
