import { jsonLdString } from "@/lib/jobs/jsonld";
import { getSiteSettings } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

// Organization structured data for the home page.
// Reference: https://developers.google.com/search/docs/appearance/structured-data/organization
export default async function OrganizationJsonLd() {
  const s = await getSiteSettings();
  const addressLines = (s.address ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const sameAs = [s.instagram, s.linkedin, s.facebook, s.youtube, s.tiktok, s.x].filter(
    Boolean,
  );

  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: s.siteName,
    ...(s.legalName ? { legalName: s.legalName } : {}),
    url: `${siteUrl}/`,
    logo: `${siteUrl}/images/logos/footer-hubblebubble.png`,
    ...(s.tagline ? { description: s.tagline } : {}),
    email: s.contactEmail,
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(addressLines.length
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: addressLines[0],
            ...(addressLines[1] ? { addressLocality: addressLines[1] } : {}),
            ...(addressLines[2] ? { postalCode: addressLines[2].split(",")[0].trim() } : {}),
            addressCountry: "GB",
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
    />
  );
}
