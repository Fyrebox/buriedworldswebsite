// The public blog: /blog, /blog/:slug, /blog/feed.xml — and the sitemap,
// which now has to know about posts and so is built here rather than served
// as a file.
//
// A draft is invisible: 404 publicly, absent from the feed and the sitemap,
// readable only with a signed preview token from the editor. A published post
// carries everything a search engine asks of an article — canonical, share
// card at the hero's real size, BlogPosting structured data with a word
// count, breadcrumbs — all generated from the post's own data.

import express from 'express';

import { previewTokenValid, readingMinutes } from './blog-store.mjs';
import { destinations } from './data/destinations.mjs';
import { pages as guidePages } from './data/pages.mjs';

const PAGE_SIZE = 12;

/** Where a hero image lives: a site path as-is, otherwise a key under /media. */
export function heroUrl(key) {
  if (!key) return '';
  return key.startsWith('/') ? key : `/media/${key}`;
}

function escapeXml(value) {
  return String(value ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

export function postJsonLd(post, { siteUrl, product, author }) {
  const url = `${siteUrl}/blog/${post.slug}`;
  const image = post.heroKey ? `${siteUrl}${heroUrl(post.heroKey)}` : `${siteUrl}/images/og-cover.jpg`;
  return {
    '@context': 'https://schema.org',
    '@graph': [{
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: product.name, item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url }
      ]
    }, {
      '@type': 'BlogPosting',
      '@id': url,
      mainEntityOfPage: url,
      url,
      headline: post.title,
      description: post.description,
      image: post.heroWidth && post.heroHeight
        ? { '@type': 'ImageObject', url: image, width: post.heroWidth, height: post.heroHeight }
        : image,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      wordCount: post.wordCount,
      inLanguage: 'en-AU',
      author: { '@type': 'Organization', name: author, url: siteUrl },
      publisher: { '@type': 'Organization', name: author, url: siteUrl, logo: { '@type': 'ImageObject', url: `${siteUrl}/images/favicon-512.png` } },
      about: { '@type': 'VideoGame', name: product.name, url: siteUrl },
      isPartOf: { '@type': 'Blog', name: `${product.name} blog`, url: `${siteUrl}/blog` }
    }]
  };
}

/** Everything that belongs in the sitemap: the fixed pages plus every published post. */
export async function sitemapEntries({ siteUrl, store, today = new Date().toISOString().slice(0, 10) }) {
  const entries = [
    { loc: `${siteUrl}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    ...destinations.map((d) => ({ loc: `${siteUrl}/destinations/${d.slug}`, lastmod: '2026-09-15', changefreq: 'monthly', priority: '0.8' })),
    ...guidePages.map((p) => ({ loc: `${siteUrl}/${p.slug}`, lastmod: '2026-09-15', changefreq: p.slug === 'updates' ? 'weekly' : 'monthly', priority: p.slug === 'vr-metal-detecting-game' ? '0.8' : '0.7' })),
    { loc: `${siteUrl}/blog`, lastmod: today, changefreq: 'weekly', priority: '0.7' },
    { loc: `${siteUrl}/press`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${siteUrl}/privacy`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${siteUrl}/terms`, changefreq: 'yearly', priority: '0.3' }
  ];
  const posts = store ? await store.listPublished({ limit: 1000 }) : [];
  for (const post of posts) {
    entries.push({ loc: `${siteUrl}/blog/${post.slug}`, lastmod: (post.updatedAt ?? post.publishedAt).slice(0, 10), changefreq: 'monthly', priority: '0.7' });
  }
  return entries;
}

export function renderSitemap(entries) {
  const urls = entries.map((e) => [
    '  <url>',
    `    <loc>${escapeXml(e.loc)}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    `    <changefreq>${e.changefreq}</changefreq>`,
    `    <priority>${e.priority}</priority>`,
    '  </url>'
  ].filter(Boolean).join('\n')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderFeed(posts, { siteUrl, product, author }) {
  const items = posts.map((post) => [
    '    <item>',
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${siteUrl}/blog/${post.slug}</link>`,
    `      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>`,
    `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
    `      <description>${escapeXml(post.description)}</description>`,
    post.heroKey ? `      <enclosure url="${siteUrl}${heroUrl(post.heroKey)}" type="image/webp" length="0"/>` : null,
    '    </item>'
  ].filter(Boolean).join('\n')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(product.name)} blog</title>
    <link>${siteUrl}/blog</link>
    <atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Notes from the making of ${escapeXml(product.name)}, by ${escapeXml(author)}.</description>
    <language>en-au</language>
${items}
  </channel>
</rss>
`;
}

export function createBlogRouter({ store, siteUrl, product, author = 'Bellare Studios', previewSecret = '', media = null }) {
  if (!store || !siteUrl || !product) throw new Error('createBlogRouter requires store, siteUrl and product');
  const router = express.Router();

  router.get('/blog', async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1);
    const [posts, total] = await Promise.all([
      store.listPublished({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
      store.countPublished()
    ]);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > pages) return res.redirect(302, '/blog');
    return res.render('blog-index', {
      pageTitle: page > 1 ? `Blog, page ${page} — ${product.name}` : `Blog — ${product.name}`,
      pageDescription: `Notes from the making of ${product.name}: the places, the finds, and what changed in the game and why.`,
      pagePath: page > 1 ? `/blog?page=${page}` : '/blog',
      posts: posts.map((post) => ({ ...post, heroUrl: heroUrl(post.heroKey), minutes: readingMinutes(post.wordCount) })),
      page, pages, total, author
    });
  });

  router.get('/blog/feed.xml', async (req, res) => {
    const posts = await store.listPublished({ limit: 50 });
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.send(renderFeed(posts, { siteUrl, product, author }));
  });

  router.get('/blog/:slug', async (req, res, next) => {
    const post = await store.getBySlug(req.params.slug);
    if (!post) return next();
    const preview = post.status !== 'published';
    if (preview && !previewTokenValid(previewSecret, post.id, req.query.preview)) return next();
    if (preview) res.set('Cache-Control', 'no-store');
    const share = post.heroKey && post.heroWidth >= 600 ? {
      pageImage: heroUrl(post.heroKey),
      pageImageWidth: post.heroWidth,
      pageImageHeight: post.heroHeight,
      pageImageAlt: post.heroAlt
    } : {};
    const related = destinations.filter((d) => post.bodyHtml.includes(`/destinations/${d.slug}`)).slice(0, 3);
    return res.render('blog-post', {
      pageTitle: post.title,
      pageDescription: post.description,
      pagePath: `/blog/${post.slug}`,
      noIndex: preview,
      ...share,
      ogType: 'article',
      post: { ...post, heroUrl: heroUrl(post.heroKey), minutes: readingMinutes(post.wordCount) },
      preview,
      related,
      author,
      jsonLd: preview ? undefined : postJsonLd(post, { siteUrl, product, author })
    });
  });

  // Blog images, streamed from R2 with the year-long immutable cache. The key
  // is content-hashed, so caching forever is safe; Cloudflare's edge then
  // holds it and R2 is read about once per image. A key must stay within blog/.
  if (media) {
    router.get('/media/:key(*)', async (req, res, next) => {
      const key = String(req.params.key ?? '');
      if (!/^blog\/[A-Za-z0-9._-]+$/.test(key)) return next();
      try {
        const object = await media.get(key);
        res.set('Content-Type', object.contentType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(object.body);
      } catch {
        return next();
      }
    });
  }

  router.get('/sitemap.xml', async (req, res) => {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(renderSitemap(await sitemapEntries({ siteUrl, store })));
  });

  return router;
}
