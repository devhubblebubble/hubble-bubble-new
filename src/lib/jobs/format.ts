import type { EmploymentType, JobRole, SiteSettings } from "@/lib/sanity/types";

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "fixed-term": "Fixed-term contract",
  internship: "Internship",
};

export const employmentLabel = (role: JobRole) =>
  (role.employmentType ?? [])
    .map((t) => EMPLOYMENT_LABELS[t] ?? t)
    .join(", ");

export const employerLabel = (role: JobRole) =>
  role.employer?.trim() || "Confidential employer";

export const locationLabel = (role: JobRole) =>
  [role.city?.trim(), role.country].filter(Boolean).join(", ");

/** "18 Oct 2026" from "2026-10-18". */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** External application link, or a pre-filled email to the contact address. */
export function applyHref(role: JobRole, settings: SiteSettings): string {
  if (role.applyUrl) return role.applyUrl;
  const ref = role.reference ? ` (${role.reference})` : "";
  const where = locationLabel(role);
  const subject = `Application: ${role.title}${ref}`;
  const body =
    `Hello Hubble Bubble,\n\nI would like to apply for ${role.title}${ref}` +
    `${where ? ` in ${where}` : ""}.\n\n` +
    "Name:\nPhone or WhatsApp:\nCurrent location:\nCV attached: yes / no\n\nThank you.";
  return (
    `mailto:${settings.contactEmail}` +
    `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  );
}

export const isExternalApply = (role: JobRole) =>
  /^https?:/i.test(role.applyUrl ?? "");

/** Roles grouped by country, keeping the query's order within each country. */
export function groupByCountry(roles: JobRole[]): [string, JobRole[]][] {
  const map = new Map<string, JobRole[]>();
  for (const role of roles) {
    const list = map.get(role.country) ?? [];
    list.push(role);
    map.set(role.country, list);
  }
  return [...map.entries()];
}
