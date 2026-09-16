import type { MetadataRoute } from "next";

const routes = [
  "/",
  "/mission",
  "/what-we-do",
  "/programs",
  "/impact",
  "/stories",
  "/get-involved",
  "/get-involved/volunteer",
  "/get-involved/fundraise",
  "/get-involved/partner",
  "/get-involved/events",
  "/donate",
  "/resources",
  "/about",
  "/about/leadership",
  "/about/organization",
  "/contact",
  "/privacy",
  "/terms",
  "/accessibility",
  "/platform",
  "/auth/login",
  "/auth/signup",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://hopebridge.example";
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
