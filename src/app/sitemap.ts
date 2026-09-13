import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * Only genuinely public, indexable routes.
 * Product / Features / Impact / Security / Pricing currently live as
 * homepage sections (#anchors) — not separate public pages — so they are
 * not listed as distinct sitemap URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
