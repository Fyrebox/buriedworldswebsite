// One page per destination, /destinations/:slug, linked from the homepage cards.
//
// Each page carries its own title, description and share image, a breadcrumb
// trail for search engines, and — where a page has one — a VideoObject so the
// teaser can be indexed as a video rather than as an anonymous iframe. The copy
// itself lives in data/destinations.mjs; this file only decides what a crawler
// is told about it.

import express from 'express';

import { destinations, findDestination } from './data/destinations.mjs';

export { destinations, findDestination };

export function destinationJsonLd(d, { siteUrl, product }) {
  const url = `${siteUrl}/destinations/${d.slug}`;
  const graph = [{
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: product.name, item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${siteUrl}/#destinations` },
      { '@type': 'ListItem', position: 3, name: d.name, item: url }
    ]
  }, {
    '@type': 'WebPage',
    '@id': url,
    url,
    name: d.title,
    description: d.description,
    isPartOf: { '@type': 'WebSite', name: product.name, url: siteUrl },
    about: { '@type': 'VideoGame', name: product.name, url: siteUrl },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${siteUrl}${d.hero.src}`,
      width: d.hero.width,
      height: d.hero.height
    }
  }];
  if (d.video) {
    graph.push({
      '@type': 'VideoObject',
      name: d.video.name,
      description: d.video.description,
      thumbnailUrl: `${siteUrl}${d.video.poster.src}`,
      uploadDate: d.video.uploadDate,
      duration: d.video.duration,
      embedUrl: `https://www.youtube-nocookie.com/embed/${d.video.youtubeId}`,
      contentUrl: `https://www.youtube.com/watch?v=${d.video.youtubeId}`,
      publisher: { '@type': 'Organization', name: product.publisher }
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function createDestinationsRouter({ siteUrl, product }) {
  if (!siteUrl || !product) throw new Error('createDestinationsRouter requires siteUrl and product');
  const router = express.Router();

  router.get('/destinations/:slug', (req, res, next) => {
    const d = findDestination(req.params.slug);
    if (!d) return next();
    const index = destinations.indexOf(d);
    // Share cards need at least 600 px across; a page whose only image is the
    // 384 px card thumbnail keeps the site cover rather than shipping a blur.
    const share = d.hero.width >= 600 ? {
      pageImage: d.hero.src,
      pageImageWidth: d.hero.width,
      pageImageHeight: d.hero.height,
      pageImageAlt: d.hero.alt
    } : {};
    return res.render('destination', {
      d,
      total: destinations.length,
      previous: destinations[index - 1] ?? null,
      next: destinations[index + 1] ?? null,
      pagePath: `/destinations/${d.slug}`,
      pageTitle: d.title,
      pageDescription: d.description,
      ...share,
      jsonLd: destinationJsonLd(d, { siteUrl, product })
    });
  });

  // The bare /destinations is the homepage section, not a page of its own.
  router.get('/destinations', (req, res) => res.redirect(301, '/#destinations'));

  return router;
}
