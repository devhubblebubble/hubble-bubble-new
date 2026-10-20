"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./ContactPage.module.scss";

type FormType = "student" | "collab" | "general";

const VALID_TYPES: FormType[] = ["student", "collab", "general"];

/**
 * The enquiry form. It is the only part of the contact page that runs in the
 * browser (it reads ?type= from the address and holds the typed answers), so
 * everything else on the page stays plain HTML that search engines and AI
 * tools can read.
 */
export default function ContactForm() {
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
    <>
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
    </>
  );
}
