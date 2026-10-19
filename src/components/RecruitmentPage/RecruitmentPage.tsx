import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import {
  employerLabel,
  employmentLabel,
  formatDate,
  groupByCountry,
  locationLabel,
} from "@/lib/jobs/format";
import type { JobRole, SiteSettings } from "@/lib/sanity/types";
import styles from "./RecruitmentPage.module.scss";
import { recruitmentPageCopy as copy } from "./recruitmentPage.data";

type Props = {
  roles: JobRole[];
  settings: SiteSettings;
};

const countryId = (country: string) =>
  country.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function RecruitmentPage({ roles, settings }: Props) {
  const groups = groupByCountry(roles);
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}`
    : null;

  return (
    <div className={styles.page}>
      <Breadcrumb current="Jobs" />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="reveal">
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p className={styles.heroSub}>{copy.heroSubtitle}</p>
          {groups.length > 0 && (
            <nav className={styles.chips} aria-label={copy.byCountryLabel}>
              <span className={styles.chipsLabel}>{copy.byCountryLabel}</span>
              {groups.map(([country, list]) => (
                <a key={country} href={`#${countryId(country)}`} className={styles.chip}>
                  {country} <span className={styles.chipCount}>{list.length}</span>
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>

      {/* ── Roles ──────────────────────────────────────────────────────── */}
      <section className={styles.content} aria-label="Current roles">
        {groups.length === 0 && (
          <div className={styles.empty}>
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyText}</p>
          </div>
        )}

        {groups.map(([country, list]) => (
          <div key={country} id={countryId(country)} className={styles.group}>
            <h2 className={styles.groupTitle}>
              {country}
              <span className={styles.groupCount}>
                {list.length} {list.length === 1 ? "role" : "roles"}
              </span>
            </h2>

            <ul className={styles.cardGrid}>
              {list.map((role) => (
                <li key={role._id} className={`${styles.card} reveal`}>
                  <article aria-labelledby={`role-${role.slug}`}>
                    <h3 id={`role-${role.slug}`} className={styles.cardTitle}>
                      <Link href={`/recruitment/${role.slug}/`}>{role.title}</Link>
                    </h3>
                    <p className={styles.cardSub}>
                      {employerLabel(role)} · {locationLabel(role)}
                    </p>
                    <p className={styles.cardSummary}>{role.summary}</p>

                    <ul className={styles.tags} aria-label="Role details">
                      <li>{role.sector}</li>
                      <li>{employmentLabel(role)}</li>
                      {role.visaSponsorship && (
                        <li className={styles.tagVisa}>Visa sponsorship</li>
                      )}
                    </ul>

                    <dl className={styles.facts}>
                      <div>
                        <dt>Processing time</dt>
                        <dd>{role.processingTime || "Ask us"}</dd>
                      </div>
                      {role.salaryText && (
                        <div>
                          <dt>Salary</dt>
                          <dd>{role.salaryText}</dd>
                        </div>
                      )}
                      {role.closingDate && (
                        <div>
                          <dt>Apply by</dt>
                          <dd>{formatDate(role.closingDate)}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Posted</dt>
                        <dd>{formatDate(role.datePosted)}</dd>
                      </div>
                    </dl>

                    <Link
                      href={`/recruitment/${role.slug}/`}
                      className={styles.cardLink}
                      aria-label={`View role: ${role.title}`}
                    >
                      View role <span aria-hidden="true">›</span>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className={styles.how} aria-labelledby="how-title">
        <h2 id="how-title">{copy.howTitle}</h2>
        <p className={styles.howIntro}>{copy.howIntro}</p>
        <ol className={styles.steps}>
          {copy.steps.map((step, i) => (
            <li key={step.title} className="reveal">
              <span className={styles.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Contact ────────────────────────────────────────────────────── */}
      <section className={styles.cta} id="contact" aria-labelledby="contact-title">
        <h2 id="contact-title" className={styles.ctaTitle}>
          {copy.contactTitle}
        </h2>
        <p className={styles.ctaText}>{copy.contactText}</p>
        <div className={styles.ctaRow}>
          <a href={`mailto:${settings.contactEmail}`} className={styles.ctaPrimary}>
            {copy.emailButton}
          </a>
          {whatsappHref && (
            <a
              href={whatsappHref}
              className={styles.ctaGhost}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.whatsappButton}
            </a>
          )}
        </div>
        <p className={styles.ctaPlain}>
          Or write to{" "}
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        </p>
      </section>
    </div>
  );
}
