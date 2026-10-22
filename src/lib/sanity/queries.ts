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
    },
    "galleryItems": galleryItems[] {
      _key, name, style, color, bubbleText, icon, description, "image": image ${img}
    }
  }
`;

export const aboutPageQuery = /* groq */ `
  *[_type == "aboutPage"][0] {
    ...,
    "team": team[]->{ ${teamMemberFields} }
  }
`;

// ── Blog ───────────────────────────────────────────────────────────────────

export const blogTopicsQuery = /* groq */ `
  *[_type == "blogTopic" && defined(slug.current)] | order(order asc, title asc) {
    _id, title, "slug": slug.current, description, intro, order, seoTitle, seoDescription
  }
`;

const postPerson = /* groq */ `{ name, title, aka }`;

// Every visible post with everything its page needs (the blog is small, so
// one query serves the index, the topic pages and the post pages).
export const postsQuery = /* groq */ `
  *[_type == "post" && hidden != true && defined(slug.current)]
  | order(pillar desc, coalesce(reviewedAt, publishedAt) desc, title asc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    description,
    seoTitle,
    pillar,
    countries,
    keyPoints,
    body,
    faq[] { _key, question, answer },
    sources[] { _key, title, url },
    publishedAt,
    reviewedAt,
    "topic": topic->{ _id, title, "slug": slug.current },
    "related": related[]->{
      _id, title, "slug": slug.current, excerpt, pillar, hidden,
      "topic": topic->{ title, "slug": slug.current }
    },
    "author": author->${postPerson},
    "reviewedBy": reviewedBy->${postPerson},
    "origins": origins[]->slug.current
  }
`;

// The Study in and Students from pages. The posts themselves come from
// postsQuery; these only name them.
const hubFields = /* groq */ `
  _id, name, nameInSentence, "slug": slug.current, flag, intro, order,
  "guideSlug": guide->slug.current,
  "featuredSlugs": featured[]->slug.current
`;

export const blogDestinationsQuery = /* groq */ `
  *[_type == "blogDestination" && defined(slug.current)] | order(order asc, name asc) { ${hubFields}, isoCodes }
`;

export const blogOriginsQuery = /* groq */ `
  *[_type == "blogOrigin" && defined(slug.current)] | order(order asc, name asc) { ${hubFields}, region }
`;

export const servicesPageQuery = /* groq */ `*[_type == "servicesPage"][0]`;
export const storiesPageQuery = /* groq */ `*[_type == "storiesPage"][0]`;
export const privacyPageQuery = /* groq */ `*[_type == "privacyPage"][0]`;
export const contactPageQuery = /* groq */ `*[_type == "contactPage"][0]`;
export const recruitmentPageQuery = /* groq */ `*[_type == "recruitmentPage"][0]`;
