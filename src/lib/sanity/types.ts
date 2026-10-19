import type { PortableTextBlock } from "@portabletext/types";

export type EmploymentType =
  | "full-time"
  | "part-time"
  | "fixed-term"
  | "internship";

export type SalaryPeriod = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";

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
  contactEmail: string;
  whatsappNumber?: string;
};
