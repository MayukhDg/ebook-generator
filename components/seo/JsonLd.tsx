import React from 'react';

/**
 * Safely serializes schema objects to JSON string, escaping '<' to prevent XSS / script injection.
 */
function safeJsonLdReplacer(data: any): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Global JSON-LD Schema: Organization and SoftwareApplication
 * Injected in app/layout.tsx for site-wide entity recognition and AEO discovery.
 */
export function GlobalJsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://opuscraft.studio/#organization',
    name: 'OpusCraft',
    alternateName: 'OpusCraft — The Executive Publishing Studio',
    url: 'https://opuscraft.studio',
    logo: 'https://opuscraft.studio/og-image.png',
    description:
      'The AI Authority Engine for founders, consultants, and operators to synthesize notes, voice transcripts, and frameworks into Amazon KDP-grade books with zero context drift.',
    sameAs: [
      'https://twitter.com/OpusCraftAI',
      'https://www.linkedin.com/company/opuscraft',
      'https://github.com/MayukhDg/ebook-generator',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: 'https://opuscraft.studio',
    },
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': 'https://opuscraft.studio/#software',
    name: 'OpusCraft',
    alternateName: 'OpusCraft Publishing Studio',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All Web Browsers (Cloud-native)',
    url: 'https://opuscraft.studio',
    description:
      'Executive book authoring platform featuring Global Context Memory, OpenAI Whisper voice-to-book transcription, decoupled 2-layer vector cover design, and Amazon KDP interior print typesetting.',
    creator: {
      '@id': 'https://opuscraft.studio/#organization',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter Plan',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free trial with 20 complimentary credits for testing the Blueprint Studio and Chapter 1 co-authoring.',
      },
      {
        '@type': 'Offer',
        name: 'Creator Plan',
        price: '29',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '29',
          priceCurrency: 'USD',
          unitCode: 'MON',
        },
        description: '100 credits/mo, full KDP PDF & EPUB exports, Whisper voice memo ingestion.',
      },
      {
        '@type': 'Offer',
        name: 'Agency / Authority Plan',
        price: '79',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '79',
          priceCurrency: 'USD',
          unitCode: 'MON',
        },
        description: '300 credits/mo, simultaneous multi-book projects, vector cover studio, priority GPU inference queue.',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(softwareApplicationSchema) }}
      />
    </>
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export interface ArticleJsonLdProps {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
  faqItems?: FaqItem[];
  howToSteps?: HowToStep[];
}

/**
 * Article JSON-LD Component
 * Renders Article, FAQPage, and HowTo structured schemas for rich search results and LLM answer engines.
 */
export function ArticleJsonLd({
  title,
  description,
  slug,
  datePublished,
  dateModified,
  authorName = 'OpusCraft Editorial Team',
  imageUrl,
  faqItems = [],
  howToSteps = [],
}: ArticleJsonLdProps) {
  const articleUrl = `https://opuscraft.studio/blog/${slug}`;

  const articleSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${articleUrl}#article`,
    headline: title,
    description: description,
    url: articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
      url: 'https://opuscraft.studio',
    },
    publisher: {
      '@type': 'Organization',
      name: 'OpusCraft',
      url: 'https://opuscraft.studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://opuscraft.studio/og-image.png',
      },
    },
  };

  if (imageUrl) {
    articleSchema.image = [imageUrl];
  }

  const faqSchema =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          '@id': `${articleUrl}#faq`,
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null;

  const howToSchema =
    howToSteps.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          '@id': `${articleUrl}#howto`,
          name: title,
          description: description,
          step: howToSteps.map((step, idx) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            name: step.name,
            text: step.text,
            url: step.url || `${articleUrl}#step-${idx + 1}`,
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(faqSchema) }}
        />
      )}
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(howToSchema) }}
        />
      )}
    </>
  );
}
