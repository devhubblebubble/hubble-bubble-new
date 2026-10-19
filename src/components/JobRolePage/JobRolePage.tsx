import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import {
  applyHref,
  employerLabel,
  employmentLabel,
  formatDate,
  isExternalApply,
  locationLabel,
} from "@/lib/jobs/format";
import { jobPostingJsonLd, jsonLdString } from "@/lib/jobs/jsonld";
import type { JobRole, SiteSettings } from "@/lib/sanity/types";
import styles from "./JobRolePage.module.scss";

type Props = {
  role: JobRole;
  settings: SiteSettings;
};

const richText: PortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href: string = value?.href ?? "#";
      const external = /^https?:/i.test(href);
      return (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
  },
};

function ListSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className={`${styles.section} reveal`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function JobRolePage({ role, settings }: Props) {
  const href = applyHref(role, settings);
  const external = isExternalApply(role);
  const applyLabel = external ? "Apply now" : "Apply by email";
  const contract = [employmentLabel(role), role.contractDetails]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jobPostingJsonLd(role)) }}
      />

      <div className={styles.inner}>
        <Breadcrumb
          current={role.title}
          parent={{ href: "/recruitment/", label: "Jobs" }}
          inset
        />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className={`${styles.header} reveal`}>
          <p className={styles.eyebrow}>
            {role.country} · {role.sector}
          </p>
          <h1 className={styles.title}>{role.title}</h1>
          <p className={styles.meta}>
            {employerLabel(role)} · {locationLabel(role)}
            {role.reference && (
              <span className={styles.ref}> · Ref {role.reference}</span>
            )}
          </p>
          <p className={styles.summary}>{role.summary}</p>

          <div className={styles.actions}>
            <a
              href={href}
              className={styles.apply}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {applyLabel}
            </a>
            <Link href="/recruitment/" className={styles.back}>
              All roles
            </Link>
          </div>
        </header>

        {/* ── Key facts ──────────────────────────────────────────────── */}
        <dl className={`${styles.facts} reveal`} aria-label="Key facts">
          <div>
            <dt>Contract</dt>
            <dd>{contract}</dd>
          </div>
          <div>
            <dt>Salary</dt>
            <dd>{role.salaryText || "Ask us"}</dd>
          </div>
          <div>
            <dt>Visa sponsorship</dt>
            <dd>{role.visaSponsorship ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Processing time</dt>
            <dd>{role.processingTime || "Ask us"}</dd>
          </div>
          <div>
            <dt>Posted</dt>
            <dd>{formatDate(role.datePosted)}</dd>
          </div>
          {role.closingDate && (
            <div>
              <dt>Apply by</dt>
              <dd>{formatDate(role.closingDate)}</dd>
            </div>
          )}
        </dl>

        {/* ── Description ────────────────────────────────────────────── */}
        <div className={styles.sections}>
          {role.about && role.about.length > 0 && (
            <section className={`${styles.section} reveal`}>
              <h2 className={styles.sectionTitle}>About the role</h2>
              <div className={styles.richText}>
                <PortableText value={role.about} components={richText} />
              </div>
            </section>
          )}
          <ListSection title="What you will do" items={role.responsibilities} />
          <ListSection title="What you need" items={role.requirements} />
          <ListSection title="Good to have" items={role.desirable} />
          <ListSection title="What you get" items={role.benefits} />
        </div>

        {/* ── Apply ──────────────────────────────────────────────────── */}
        <section className={`${styles.applyBox} reveal`} aria-labelledby="apply-title">
          <h2 id="apply-title">Ready to apply?</h2>
          <p>
            {external
              ? "The application form opens in a new tab. Have your CV ready."
              : `Email us your CV and tell us where you are based now. We reply from ${settings.contactEmail}.`}
          </p>
          <div className={styles.actions}>
            <a
              href={href}
              className={styles.apply}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {applyLabel}
            </a>
            <Link href="/recruitment/#contact" className={styles.back}>
              Not sure you qualify? Ask us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
