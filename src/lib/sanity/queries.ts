// GROQ queries. Every field the site uses is listed explicitly so the shape
// matches src/lib/sanity/types.ts.

// Image with the original URL and size resolved.
const img = /* groq */ `{
  ...,
  "url": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height
}`;

const logoItem = /* groq */ `{ _key, name, "logo": logo ${img} }`;

const storyFields = /* groq */ `
  _id, name, headline, summary, "photo": photo ${img}, linkLabel, linkHref, order, hidden
`;

const teamMemberFields = /* groq */ `
  _id, name, title, aka, "photo": photo ${img}, "photoAlt": photoAlt ${img}, order
`;

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
  *[_type == "siteSettings"][0] {
    siteName, legalName, tagline,
    contactEmail, phone, whatsappNumber, bookingUrl, address,
    instagram, linkedin, facebook, youtube, tiktok, x,
    googlePlayUrl, appStoreUrl
  }
`;

export const storiesQuery = /* groq */ `
  *[_type == "story" && hidden != true] | order(order asc, _createdAt asc) { ${storyFields} }
`;

export const teamMembersQuery = /* groq */ `
  *[_type == "teamMember"] | order(order asc, _createdAt asc) { ${teamMemberFields} }
`;

export const homePageQuery = /* groq */ `
  *[_type == "homePage"][0] {
    ...,
    "accreditations": accreditations[] ${logoItem},
    "heroStudents": heroStudents[] {
      _key, name, course, flag, "photo": photo ${img},
      "admits": admits[] {
        _key, label, "logo": logo ${img},
        "university": university->{ name, shortName, "logo": logo ${img} }
      }
    },
    "backingLogo": backingLogo ${img},
    "certifiedLogos": certifiedLogos[] ${logoItem},
    "networkItems": networkItems[] ${logoItem},
    "featuredStories": featuredStories[]->{ ${storyFields} },
    "testimonials": testimonials[] {
      _key, quote, name, course, university, large, "photo": photo ${img}
    }
  }
`;

export const aboutPageQuery = /* groq */ `
  *[_type == "aboutPage"][0] {
    ...,
    "team": team[]->{ ${teamMemberFields} }
  }
`;

export const servicesPageQuery = /* groq */ `*[_type == "servicesPage"][0]`;
export const storiesPageQuery = /* groq */ `*[_type == "storiesPage"][0]`;
export const privacyPageQuery = /* groq */ `*[_type == "privacyPage"][0]`;
