import type { Metadata } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

export const SITE_NAME = "HopeBridge";

export const DEFAULT_TITLE =
  "HopeBridge | Nonprofit Management & Intelligence Platform";

export const DEFAULT_DESCRIPTION =
  "HopeBridge helps nonprofit organizations manage campaigns, programs, donors, volunteers, beneficiaries, teams, reporting, impact analytics, and organizational insights in one connected platform.";

/**
 * Social preview image requirements (do not invent a poor placeholder):
 * Add a production PNG at public/og/hopebridge-og.png — 1200×630, <300KB preferred.
 * Until that asset exists, Open Graph falls back to the brand icon only.
 */
export const OG_IMAGE_PATH = "/og/hopebridge-og.png";
export const OG_IMAGE_FALLBACK_PATH = "/icon.svg";

export function buildPageMetadata(options?: {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
}): Metadata {
  const title = options?.title ?? DEFAULT_TITLE;
  const description = options?.description ?? DEFAULT_DESCRIPTION;
  const path = options?.path ?? "/";
  const index = options?.index ?? true;
  const url = absoluteUrl(path);
  const siteUrl = getSiteUrl();

  return {
    title,
    description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: OG_IMAGE_FALLBACK_PATH,
          alt: "HopeBridge nonprofit management platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_FALLBACK_PATH],
    },
    category: "technology",
  };
}

export function buildPrivateMetadata(title: string): Metadata {
  return {
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

/** Factual JSON-LD only — no invented ratings, customers, or prices. */
export function buildHomeJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        url: siteUrl,
        logo: absoluteUrl("/icon.svg"),
        description: DEFAULT_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        url: siteUrl,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
}
