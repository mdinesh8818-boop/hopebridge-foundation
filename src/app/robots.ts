import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * Public marketing may be crawled. Authenticated product surfaces must not.
 * Keep Allow for `/` explicit so homepage indexing is never blocked by accident.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/auth/",
          "/onboarding",
          "/onboarding/",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
