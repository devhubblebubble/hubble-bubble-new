import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import type { SiteSettings } from "@/lib/sanity/types";
import EligibilityButton from "@/components/EligibilityModal/EligibilityButton";
import ContactForm from "./ContactForm";
import styles from "./ContactPage.module.scss";

type Props = { settings: SiteSettings };

export default function ContactPage({ settings }: Props) {
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
          <p className={styles.eyebrow}>Get in touch</p>
          <h1 className={styles.heroTitle}>
            Let&apos;s find your{" "}
            <em className={styles.orange}>right direction.</em>
          </h1>
          <p className={styles.heroLead}>
            No bots. No templates. A real person reads every message and
            responds within 48 hours.
          </p>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <section className={styles.layout}>

        {/* Left — info */}
        <div className={`${styles.info} reveal`}>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>✉</span>
            <div>
              <p className={styles.infoLabel}>Email us directly</p>
              <a href={`mailto:${settings.contactEmail}`} className={styles.infoLink}>
                {settings.contactEmail}
              </a>
            </div>
          </div>

          {settings.bookingUrl && (
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>📅</span>
              <div>
                <p className={styles.infoLabel}>Book a call</p>
                <a
                  href={settings.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.infoLink}
                >
                  Schedule a call
                </a>
              </div>
            </div>
          )}

          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>📍</span>
            <div>
              <p className={styles.infoLabel}>Based in</p>
              <p className={styles.infoText}>Edinburgh, Scotland, UK</p>
            </div>
          </div>

          {socials.length > 0 && (
            <div className={styles.socialRow}>
              <p className={styles.infoLabel}>Follow us</p>
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
            <p className={styles.eligTitle}>Not sure where to start?</p>
            <p className={styles.eligText}>
              Take our free eligibility check. It takes 3 minutes and gives you
              a clear picture of your options.
            </p>
            <EligibilityButton
              className={styles.eligBtn}
              contactEmail={settings.contactEmail}
              bookingUrl={settings.bookingUrl}
            >
              Take the eligibility Test →
            </EligibilityButton>
          </div>
        </div>

        {/* Right — form */}
        <div className={`${styles.formWrap} reveal`} data-glass="flat">
          {/* The form needs the browser (it reads ?type= from the address), so it
              sits in its own Suspense boundary. The rest of the page is plain HTML. */}
          <Suspense fallback={null}>
            <ContactForm contactEmail={settings.contactEmail} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
