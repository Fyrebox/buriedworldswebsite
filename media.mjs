// Blog images: processed with sharp, stored in Cloudflare R2, served back from
// the site at /media/:key.
//
// A hero is stored twice from one source: a 1600×900 WebP for the page and a
// 1200×630 WebP for the share card, both under a content-hashed key so a
// replaced image gets a new URL and the year-long cache never serves a stale
// one. The site streams them from R2 with that long cache; Cloudflare's edge
// then holds them, so R2 is read about once per image.

import crypto from 'node:crypto';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

export const HERO = { width: 1600, height: 900 };
export const SHARE = { width: 1200, height: 630 };

export function createMediaStore({ accountId, bucket, accessKeyId, secretAccessKey, client } = {}) {
  if (!client && !(accountId && bucket && accessKeyId && secretAccessKey)) return null;
  const s3 = client ?? new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });

  async function putHero(sourceBuffer) {
    const hash = crypto.createHash('sha256').update(sourceBuffer).digest('hex').slice(0, 16);
    const base = `blog/${hash}`;
    const hero = await sharp(sourceBuffer).resize(HERO.width, HERO.height, { fit: 'cover', position: 'attention' }).webp({ quality: 80 }).toBuffer();
    const share = await sharp(sourceBuffer).resize(SHARE.width, SHARE.height, { fit: 'cover', position: 'attention' }).webp({ quality: 80 }).toBuffer();
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${base}.webp`, Body: hero, ContentType: 'image/webp' }));
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${base}-share.webp`, Body: share, ContentType: 'image/webp' }));
    return { key: `${base}.webp`, width: HERO.width, height: HERO.height };
  }

  /** Fetch one object as { body: Buffer, contentType } for the /media route. */
  async function get(key) {
    const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return { body: Buffer.from(await out.Body.transformToByteArray()), contentType: out.ContentType ?? 'application/octet-stream' };
  }

  return { putHero, get };
}
