import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
  ogImage?: string;
  ogType?: string;
}

export default function SEO({
  title,
  description,
  canonicalPath,
  noIndex = false,
  jsonLd,
  ogImage,
  ogType = 'website',
}: SEOProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = canonicalPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '');
  const canonicalUrl = origin + path;

  const siteName = 'Innoflow';

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLd && (
        <script type="application/ld+json">
          {Array.isArray(jsonLd)
            ? JSON.stringify(jsonLd)
            : JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
