import { buildHomeJsonLd } from "@/lib/seo";

/** Server-rendered JSON-LD for the public homepage. */
export function HomeJsonLd() {
  const data = buildHomeJsonLd();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
