// Google JobPosting structured data for a role page.
// Reference: https://developers.google.com/search/docs/appearance/structured-data/job-posting
import { toHTML } from "@portabletext/to-html";
import { siteUrl } from "@/lib/site";
import type { JobRole } from "@/lib/sanity/types";
import { employerLabel } from "./format";

const SCHEMA_EMPLOYMENT: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  "fixed-term": "TEMPORARY",
  internship: "INTERN",
};

// ISO 3166-1 alpha-2 codes for the countries offered in the Studio.
const COUNTRY_CODES: Record<string, string> = {
  Ireland: "IE",
  Germany: "DE",
  "United Kingdom": "GB",
  Netherlands: "NL",
  Belgium: "BE",
  Luxembourg: "LU",
  France: "FR",
  Austria: "AT",
  Switzerland: "CH",
  Denmark: "DK",
  Sweden: "SE",
  Norway: "NO",
  Finland: "FI",
  Iceland: "IS",
  Italy: "IT",
  Spain: "ES",
  Portugal: "PT",
  Malta: "MT",
  Cyprus: "CY",
  Poland: "PL",
  Czechia: "CZ",
  Slovakia: "SK",
  Hungary: "HU",
  Croatia: "HR",
  Slovenia: "SI",
  Lithuania: "LT",
  Latvia: "LV",
  Estonia: "EE",
  Australia: "AU",
  "New Zealand": "NZ",
  Canada: "CA",
  "United States": "US",
  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  Qatar: "QA",
  Singapore: "SG",
  Japan: "JP",
  "South Korea": "KR",
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const listHtml = (title: string, items?: string[]) =>
  items && items.length
    ? `<h3>${title}</h3><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
    : "";

/** Full job description as HTML, which Google requires for `description`. */
export function roleDescriptionHtml(role: JobRole): string {
  const about = role.about?.length ? toHTML(role.about) : "";
  return (
    `<p>${escapeHtml(role.summary)}</p>` +
    about +
    listHtml("What you will do", role.responsibilities) +
    listHtml("What you need", role.requirements) +
    listHtml("Good to have", role.desirable) +
    listHtml("What you get", role.benefits)
  );
}

/** "Berlin, Munich, Frankfurt or Hamburg" -> ["Berlin", "Munich", "Frankfurt", "Hamburg"] */
const splitCities = (city?: string) =>
  (city ?? "")
    .split(/,|\bor\b|\band\b|\//)
    .map((c) => c.trim())
    .filter(Boolean);

export function jobPostingJsonLd(role: JobRole) {
  const countryCode = COUNTRY_CODES[role.country] ?? role.country;
  const cities = splitCities(role.city);
  const places = (cities.length ? cities : [undefined]).map((city) => ({
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      ...(city ? { addressLocality: city } : {}),
      addressCountry: countryCode,
    },
  }));

  const hasSalary =
    role.salaryCurrency &&
    role.salaryPeriod &&
    (role.salaryMin != null || role.salaryMax != null);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: role.title,
    description: roleDescriptionHtml(role),
    datePosted: role.datePosted,
    ...(role.closingDate ? { validThrough: `${role.closingDate}T23:59:59` } : {}),
    employmentType: (role.employmentType ?? []).map(
      (t) => SCHEMA_EMPLOYMENT[t] ?? "OTHER",
    ),
    hiringOrganization: {
      "@type": "Organization",
      name: employerLabel(role),
    },
    jobLocation: places.length === 1 ? places[0] : places,
    url: `${siteUrl}/recruitment/${role.slug}/`,
    ...(role.reference
      ? {
          identifier: {
            "@type": "PropertyValue",
            name: "Hubble Bubble",
            value: role.reference,
          },
        }
      : {}),
    ...(hasSalary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: role.salaryCurrency,
            value: {
              "@type": "QuantitativeValue",
              ...(role.salaryMin != null ? { minValue: role.salaryMin } : {}),
              ...(role.salaryMax != null ? { maxValue: role.salaryMax } : {}),
              unitText: role.salaryPeriod,
            },
          },
        }
      : {}),
  };

  return data;
}

/** Serialise for a <script type="application/ld+json"> without breaking out of the tag. */
export const jsonLdString = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
