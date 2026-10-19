"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import type { SiteSettings } from "@/lib/sanity/types";
import styles from "./ContactPage.module.scss";

type FormType = "student" | "collab" | "general";

const VALID_TYPES: FormType[] = ["student", "collab", "general"];

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
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as FormType | null;
  const initialType: FormType =
    typeParam && VALID_TYPES.includes(typeParam) ? typeParam : "student";

  const [formType, setFormType] = useState<FormType>(initialType);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: wire up to API / email service
    setSubmitted(true);
  }

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
            <Link href="/contact" className={styles.eligBtn}>
              Take the eligibility Test →
            </Link>
          </div>
        </div>

        {/* Right — form */}
        <div className={`${styles.formWrap} reveal`}>
          {submitted ? (
            <div className={styles.success}>
              <p className={styles.successIcon}>🚀</p>
              <h2 className={styles.successTitle}>Message received!</h2>
              <p className={styles.successText}>
                We&apos;ll get back to you within 48 hours. In the meantime, feel
                free to explore our student stories or check out the eligibility
                test.
              </p>
              <Link href="/stories" className={styles.successLink}>
                Read student stories →
              </Link>
            </div>
          ) : (
            <>
              {/* Type tabs */}
              <div className={styles.tabs}>
                {(["student", "collab", "general"] as FormType[]).map((t) => (
                  <button
                    key={t}
                    className={`${styles.tab} ${formType === t ? styles.tabActive : ""}`}
                    onClick={() => setFormType(t)}
                    type="button"
                  >
                    {t === "student"
                      ? "I'm a student"
                      : t === "collab"
                      ? "Collaboration"
                      : "General"}
                  </button>
                ))}
              </div>

              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.row}>
                  <label className={styles.fieldWrap}>
                    <span className={styles.label}>Full name</span>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Your name"
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.fieldWrap}>
                    <span className={styles.label}>Email</span>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="you@email.com"
                      className={styles.input}
                    />
                  </label>
                </div>

                {formType === "student" && (
                  <div className={styles.row}>
                    <label className={styles.fieldWrap}>
                      <span className={styles.label}>Interested in studying</span>
                      <select name="destination" className={styles.input}>
                        <option value="">Select a country</option>
                        <option>United Kingdom</option>
                        <option>Canada</option>
                        <option>Australia</option>
                        <option>USA</option>
                        <option>Europe</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <label className={styles.fieldWrap}>
                      <span className={styles.label}>Study level</span>
                      <select name="level" className={styles.input}>
                        <option value="">Select level</option>
                        <option>Undergraduate</option>
                        <option>Postgraduate</option>
                        <option>PhD</option>
                        <option>Foundation</option>
                      </select>
                    </label>
                  </div>
                )}

                {formType === "collab" && (
                  <label className={styles.fieldWrap}>
                    <span className={styles.label}>Organisation / Project</span>
                    <input
                      type="text"
                      name="organisation"
                      placeholder="Tell us about your organisation"
                      className={styles.input}
                    />
                  </label>
                )}

                <label className={styles.fieldWrap}>
                  <span className={styles.label}>Message</span>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    placeholder={
                      formType === "student"
                        ? "What's on your mind? Tell us about your goals, worries, or just where you're at right now."
                        : formType === "collab"
                        ? "Tell us about your idea. What are you working on and how do you think we could work together?"
                        : "How can we help?"
                    }
                    className={`${styles.input} ${styles.textarea}`}
                  />
                </label>

                <button type="submit" className={styles.submit}>
                  Send message
                </button>

                <p className={styles.privacy}>
                  We respect your privacy. Your details are never shared or sold.{" "}
                  <Link href="/privacy" className={styles.privacyLink}>
                    Privacy policy
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
