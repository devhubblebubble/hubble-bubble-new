// GROQ queries. Every field the site uses is listed explicitly so the shape
// matches src/lib/sanity/types.ts.

const roleFields = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  status,
  reference,
  employer,
  country,
  city,
  sector,
  visaSponsorship,
  summary,
  employmentType,
  contractDetails,
  salaryText,
  salaryCurrency,
  salaryMin,
  salaryMax,
  salaryPeriod,
  processingTime,
  about,
  responsibilities,
  requirements,
  desirable,
  benefits,
  datePosted,
  closingDate,
  applyUrl,
  seoTitle,
  seoDescription
`;

// Open roles whose closing date (if any) has not passed. $today is YYYY-MM-DD.
export const openRolesQuery = /* groq */ `
  *[_type == "jobRole" && status == "open" && defined(slug.current)
    && (!defined(closingDate) || closingDate >= $today)]
  | order(country asc, datePosted desc) { ${roleFields} }
`;

export const siteSettingsQuery = /* groq */ `
  *[_type == "siteSettings"][0] { siteName, contactEmail, whatsappNumber }
`;
