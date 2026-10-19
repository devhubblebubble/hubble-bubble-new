import type { PortableTextBlock } from "@portabletext/types";

export type EmploymentType =
  | "full-time"
  | "part-time"
  | "fixed-term"
  | "internship";

export type SalaryPeriod = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";

/** An image as returned by our GROQ projections (or by the offline fixture). */
export type SanityImage = {
  _type?: "image";
  asset?: { _ref?: string; _type?: "reference" };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
  /** Filled by GROQ: original file URL and size. */
  url?: string;
  width?: number;
  height?: number;
  /** Offline fixture only: path under /public. */
  _localSrc?: string;
};

export type Styled = PortableTextBlock[];

export type JobRole = {
  _id: string;
  title: string;
  slug: string;
  status: "open" | "closed";
  reference?: string;
  employer?: string;
  country: string;
  city?: string;
  sector: string;
  visaSponsorship?: boolean;
  summary: string;
  employmentType: EmploymentType[];
  contractDetails?: string;
  salaryText?: string;
  salaryCurrency?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: SalaryPeriod;
  processingTime?: string;
  about?: PortableTextBlock[];
  responsibilities?: string[];
  requirements?: string[];
  desirable?: string[];
  benefits?: string[];
  datePosted: string; // YYYY-MM-DD
  closingDate?: string; // YYYY-MM-DD
  applyUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type SiteSettings = {
  siteName: string;
  legalName?: string;
  tagline?: string;
  contactEmail: string;
  phone?: string;
  whatsappNumber?: string;
  bookingUrl?: string;
  address?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  x?: string;
  googlePlayUrl?: string;
  appStoreUrl?: string;
};

export type Seo = { seoTitle?: string; seoDescription?: string };

export type LogoItem = { _key?: string; name?: string; logo?: SanityImage };

export type HeroStudent = {
  _key?: string;
  name?: string;
  course?: string;
  flag?: string;
  photo?: SanityImage;
  admits?: { _key?: string; label?: string; logo?: SanityImage }[];
};

export type JourneyStep = {
  _key?: string;
  number?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  tags?: string[];
};

export type Testimonial = {
  _key?: string;
  photo?: SanityImage;
  quote?: string;
  name?: string;
  course?: string;
  university?: string;
  large?: boolean;
};

export type Story = {
  _id: string;
  name?: string;
  headline: string;
  summary?: string;
  photo?: SanityImage;
  linkLabel?: string;
  linkHref?: string;
  order?: number;
  hidden?: boolean;
};

export type TeamMember = {
  _id: string;
  name: string;
  title?: string;
  aka?: string;
  photo?: SanityImage;
  photoAlt?: SanityImage;
  order?: number;
};

export type HomePage = Seo & {
  headlineLead?: string;
  headlineAccent?: string;
  headlineRest?: string;
  subLead?: string;
  subHighlight?: string;
  subRest?: string;
  accreditationsLabel?: string;
  accreditations?: LogoItem[];
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  heroStudents?: HeroStudent[];
  worldMapHeadline?: string;
  backingText?: string;
  backingHeading?: string;
  backingLogo?: SanityImage;
  certifiedHeading?: string;
  certifiedLogos?: LogoItem[];
  certifiedText?: string;
  networkHeading?: string;
  networkText?: string;
  networkItems?: LogoItem[];
  journeySteps?: JourneyStep[];
  journeyOutputsLabel?: string;
  storiesTitle?: string;
  storiesViewAllLabel?: string;
  featuredStories?: Story[];
  testimonialsTitle?: string;
  testimonialsLead?: string;
  testimonials?: Testimonial[];
  originTitleLead?: string;
  originTitleAccent?: string;
  originLead?: string;
  originLeadAccent?: string;
  originButtonLabel?: string;
  originButtonHref?: string;
  ctaTitleLead?: string;
  ctaTitleAccent?: string;
  ctaText?: string;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
};

export type TimelineItem = { _key?: string; year?: string; title?: string; description?: string };

export type AboutPage = Seo & {
  intro1HeadingStyled?: Styled;
  intro1BodyStyled?: Styled;
  intro2HeadingStyled?: Styled;
  intro2BodyStyled?: Styled;
  teamHeadingStyled?: Styled;
  teamSubStyled?: Styled;
  team?: TeamMember[];
  timelineHeadingStyled?: Styled;
  timelineButtonLabel?: string;
  timeline?: TimelineItem[];
  missionLabelStyled?: Styled;
  missionAlias?: string;
  missionBodyStyled?: Styled;
  visionLabelStyled?: Styled;
  visionAlias?: string;
  visionBodyStyled?: Styled;
  ctaEyebrowStyled?: Styled;
  ctaTitle?: string;
  ctaSubStyled?: Styled;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
  collabHeadingStyled?: Styled;
  collabSubStyled?: Styled;
  collabButtonLabel?: string;
  collabEmailLabel?: string;
};

export type ServiceCard = { _key?: string; title?: string; description?: string };

export type ServicesPage = Seo & {
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  tabPrimaryLabel?: string;
  primaryServices?: ServiceCard[];
  tabSecondaryLabel?: string;
  addOnServices?: ServiceCard[];
  ctaTitle?: string;
  ctaText?: string;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
};

export type StoriesPage = Seo & { title?: string };

export type PolicySection = { _key?: string; title?: string; bodyRich?: PortableTextBlock[] };

export type PrivacyPage = Seo & {
  eyebrow?: string;
  title?: string;
  lastUpdated?: string;
  intro?: string;
  sections?: PolicySection[];
};
