import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { resolveDocumentMetadata } from '../../utils/documentMetadata.js';

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export default function DocumentHead() {
  const { pathname } = useLocation();
  const { lang } = useLanguage();

  useEffect(() => {
    const metadata = resolveDocumentMetadata({
      pathname,
      lang,
      origin: window.location.origin
    });

    document.title = metadata.title;
    upsertCanonical(metadata.canonicalUrl);
    upsertMeta('name', 'description', metadata.description);

    const openGraph = {
      'og:title': metadata.title,
      'og:description': metadata.description,
      'og:type': metadata.type,
      'og:url': metadata.canonicalUrl,
      'og:site_name': metadata.siteName,
      'og:locale': metadata.locale,
      'og:locale:alternate': metadata.alternateLocale,
      'og:image': metadata.imageUrl,
      'og:image:type': 'image/png',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': metadata.imageAlt
    };
    for (const [property, content] of Object.entries(openGraph)) {
      upsertMeta('property', property, content);
    }

    const twitter = {
      'twitter:card': 'summary_large_image',
      'twitter:title': metadata.title,
      'twitter:description': metadata.description,
      'twitter:image': metadata.imageUrl,
      'twitter:image:alt': metadata.imageAlt
    };
    for (const [name, content] of Object.entries(twitter)) {
      upsertMeta('name', name, content);
    }

    let structuredData = document.getElementById('volta-structured-data');
    if (metadata.structuredData.length) {
      if (!structuredData) {
        structuredData = document.createElement('script');
        structuredData.id = 'volta-structured-data';
        structuredData.type = 'application/ld+json';
        document.head.appendChild(structuredData);
      }
      structuredData.textContent = JSON.stringify(metadata.structuredData);
    } else {
      structuredData?.remove();
    }
  }, [lang, pathname]);

  return null;
}
