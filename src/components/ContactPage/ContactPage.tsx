import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import type { SiteSettings } from "@/lib/sanity/types";
import EligibilityButton from "@/components/EligibilityModal/EligibilityButton";
import ContactForm from "./ContactForm";
import type { ContactCopy } from "./contactPage.data";
import styles from "./ContactPage.module.scss";

type Props = {
  settings: SiteSettings;
  /** The page text (from the Studio, with the built-in text for empty fields). */
  copy: ContactCopy;
};

export default function ContactPage({ settings, copy }: Props) {
  const socials = [
    ["Instagram", settings.instagram],
    ["LinkedIn", settings.linkedin],
    ["Facebook", settings.facebook],
    ["YouTube", settings.youtube],
    ["TikTok", settings.tiktok],
    ["X", settings.x],
  ].filter((s): s is [string, string] => Boolean(s[1]));
  return (
    <div className={styles.page}>
      <Breadcrumb current="Contact" />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="reveal">
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.heroTitle}>
            {copy.titleLead}{" "}
            <em className={styles.orange}>{copy.titleAccent}</em>
          </h1>
          <p className={styles.heroLead}>{copy.lead}</p>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <section className={styles.layout}>

        {/* Left — info */}
        <div className={`${styles.info} reveal`}>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>✉</span>
            <div>
              <p className={styles.infoLabel}>{copy.emailLabel}</p>
              <a href={`mailto:${settings.contactEmail}`} className={styles.infoLink}>
                {settings.contactEmail}
              </a>
            </div>
          </div>

          {settings.bookingUrl && (
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>📅</span>
              <div>
                <p className={styles.infoLabel}>{copy.bookingLabel}</p>
                <a
                  href={settings.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.infoLink}
                >
                  {copy.bookingLinkText}
                </a>
              </div>
            </div>
          )}

          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>📍</span>
            <div>
              <p className={styles.infoLabel}>{copy.locationLabel}</p>
              <p className={styles.infoText}>{copy.locationText}</p>
            </div>
          </div>

          {socials.length > 0 && (
            <div className={styles.socialRow}>
              <p className={styles.infoLabel}>{copy.socialsLabel}</p>
              <div className={styles.socialLinks}>
                {socials.map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className={styles.eligBox}>
            <p className={styles.eligTitle}>{copy.eligTitle}</p>
            <p className={styles.eligText}>{copy.eligText}</p>
            <EligibilityButton
              className={styles.eligBtn}
              contactEmail={settings.contactEmail}
              bookingUrl={settings.bookingUrl}
            >
              {copy.eligButton}
            </EligibilityButton>
          </div>
        </div>

        {/* Right — form */}
        <div className={`${styles.formWrap} reveal`} data-glass="flat">
          {/* The form needs the browser (it reads ?type= from the address), so it
              sits in its own Suspense boundary. The rest of the page is plain HTML. */}
          <Suspense fallback={null}>
            <ContactForm contactEmail={settings.contactEmail} copy={copy} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
