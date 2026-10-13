import {
  NORMAL_AMOUNT_KRW,
  NORMAL_AMOUNT_USD,
} from "@/libs/services/payment/first-payment-event";
import type { Locale } from "@/i18n/config";

import {
  LANGUAGE_TAG,
  ORGANIZATION,
  SITE_NAME,
  SITE_URL,
  buildLocalizedUrl,
} from "./site";

const SCHEMA_CONTEXT = "https://schema.org";

/** 사이트 전체에서 같은 엔티티를 가리키도록 고정한 @id */
export const ENTITY_ID = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
  lifeSpoilerService: `${SITE_URL}/#service`,
  faceSpoilerService: `${SITE_URL}/face-spoiler#service`,
} as const;

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export const buildOrganizationSchema = (locale: Locale) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "Organization",
  "@id": ENTITY_ID.organization,
  name: SITE_NAME[locale],
  alternateName: Object.values(SITE_NAME).filter(
    (name) => name !== SITE_NAME[locale]
  ),
  legalName: ORGANIZATION.legalName,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/life-spoiler-logo.png`,
  },
  email: ORGANIZATION.email,
  telephone: ORGANIZATION.telephone,
  address: {
    "@type": "PostalAddress",
    ...ORGANIZATION.address,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: ORGANIZATION.email,
    telephone: ORGANIZATION.telephone,
    availableLanguage: ["Korean", "English", "Japanese"],
  },
  sameAs: [...ORGANIZATION.sameAs],
});

export const buildWebSiteSchema = (locale: Locale) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "WebSite",
  "@id": ENTITY_ID.website,
  name: SITE_NAME[locale],
  alternateName: Object.values(SITE_NAME).filter(
    (name) => name !== SITE_NAME[locale]
  ),
  url: SITE_URL,
  inLanguage: Object.values(LANGUAGE_TAG),
  publisher: { "@id": ENTITY_ID.organization },
});

interface ServiceSchemaInput {
  id: string;
  path: string;
  locale: Locale;
  name: string;
  description: string;
  serviceType: string;
}

/**
 * 유료 디지털 리포트 서비스. 배송·반품 정보가 필요한 Product(머천트 리스팅) 대신
 * Service + Offer로 표현한다. 국내 결제(KRW)와 해외 결제(USD) 정상가를 모두 싣는다.
 */
export const buildServiceSchema = ({
  id,
  path,
  locale,
  name,
  description,
  serviceType,
}: ServiceSchemaInput) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "Service",
  "@id": id,
  name,
  description,
  serviceType,
  url: buildLocalizedUrl(path, locale),
  inLanguage: LANGUAGE_TAG[locale],
  provider: { "@id": ENTITY_ID.organization },
  areaServed: "Worldwide",
  availableChannel: {
    "@type": "ServiceChannel",
    serviceUrl: buildLocalizedUrl(path, locale),
  },
  offers: [
    { price: NORMAL_AMOUNT_KRW, priceCurrency: "KRW" },
    { price: NORMAL_AMOUNT_USD, priceCurrency: "USD" },
  ].map((offer) => ({
    "@type": "Offer",
    ...offer,
    availability: "https://schema.org/InStock",
    url: buildLocalizedUrl(path, locale),
  })),
});

export const buildFaqPageSchema = (
  path: string,
  locale: Locale,
  entries: FaqEntry[]
) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "FAQPage",
  "@id": `${buildLocalizedUrl(path, locale)}#faq`,
  inLanguage: LANGUAGE_TAG[locale],
  mainEntity: entries.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
});

export const buildBreadcrumbSchema = (
  locale: Locale,
  entries: BreadcrumbEntry[]
) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "BreadcrumbList",
  itemListElement: entries.map(({ name, path }, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: buildLocalizedUrl(path, locale),
  })),
});

interface ArticleSchemaInput {
  path: string;
  locale: Locale;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  image: string;
  about: string[];
}

export const buildArticleSchema = ({
  path,
  locale,
  headline,
  description,
  datePublished,
  dateModified,
  image,
  about,
}: ArticleSchemaInput) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "Article",
  "@id": `${buildLocalizedUrl(path, locale)}#article`,
  mainEntityOfPage: buildLocalizedUrl(path, locale),
  headline,
  description,
  inLanguage: LANGUAGE_TAG[locale],
  datePublished,
  dateModified,
  image: new URL(image, SITE_URL).toString(),
  author: { "@id": ENTITY_ID.organization },
  publisher: { "@id": ENTITY_ID.organization },
  isPartOf: { "@id": ENTITY_ID.website },
  about: about.map((name) => ({ "@type": "Thing", name })),
});
