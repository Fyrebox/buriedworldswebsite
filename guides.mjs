// The guide pages, one route each at /:slug, from data/pages.mjs.
//
// Each carries a BreadcrumbList and a page node whose type the data chooses:
// WebPage for most, AboutPage for /about, and FAQPage for /faq with every
// question and answer inlined — that is the shape search engines read a FAQ
// in, and it costs nothing to provide even where it earns no rich result.

import express from 'express';

import { findPage, pages } from './data/pages.mjs';
import { frenchAlternateOf, frenchPages, hreflangLinks } from './data/pages-fr.mjs';

export { findPage, frenchPages, pages };

/** A guide's URL path: English guides live at /:slug, the French ones carry a full path. */
export function guidePath(page) {
  return page.path ?? `/${page.slug}`;
}

export function guideJsonLd(page, { siteUrl, product }) {
  const url = `${siteUrl}${guidePath(page)}`;
  const home = page.ui?.home ? `${siteUrl}${page.ui.home}` : siteUrl;
  const node = {
    '@type': page.kind,
    '@id': url,
    url,
    name: page.title,
    description: page.description,
    inLanguage: page.ui?.lang ?? 'en',
    isPartOf: { '@type': 'WebSite', name: product.name, url: siteUrl },
    about: { '@type': 'VideoGame', name: product.name, url: siteUrl }
  };
  if (page.hero) {
    node.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: `${siteUrl}${page.hero.src}`,
      width: page.hero.width,
      height: page.hero.height
    };
  }
  if (page.faq) {
    node.mainEntity = page.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }));
  }
  if (page.kind === 'AboutPage') {
    node.mainEntity = {
      '@type': 'Organization',
      name: product.publisher,
      legalName: product.developer,
      url: siteUrl,
      founder: { '@type': 'Person', name: 'Cyril Gaillard' },
      address: { '@type': 'PostalAddress', addressLocality: 'Melbourne', addressRegion: 'Victoria', addressCountry: 'AU' }
    };
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [{
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: product.name, item: home },
        ...(url === home ? [] : [{ '@type': 'ListItem', position: 2, name: page.h1, item: url }])
      ]
    }, node]
  };
}

export function createGuidesRouter({ siteUrl, product }) {
  if (!siteUrl || !product) throw new Error('createGuidesRouter requires siteUrl and product');
  const router = express.Router();

  for (const page of [...pages, ...frenchPages]) {
    const pagePath = guidePath(page);
    // A page with a counterpart in the other language links to it, both ways.
    const english = page.alternate ?? (frenchAlternateOf[pagePath] ? pagePath : null);
    const alternates = english ? hreflangLinks(english, frenchAlternateOf[english], siteUrl) : undefined;
    router.get(pagePath, (req, res) => {
      const share = page.hero && page.hero.width >= 600 ? {
        pageImage: page.hero.src,
        pageImageWidth: page.hero.width,
        pageImageHeight: page.hero.height,
        pageImageAlt: page.hero.alt
      } : {};
      return res.render('guide', {
        page,
        pagePath,
        pageLang: page.ui?.lang,
        ogLocale: page.ui?.ogLocale,
        alternates,
        pageTitle: page.title,
        pageDescription: page.description,
        ...share,
        jsonLd: guideJsonLd(page, { siteUrl, product })
      });
    });
  }

  return router;
}
