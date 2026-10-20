"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./ContactPage.module.scss";

type FormType = "student" | "collab" | "general";

const VALID_TYPES: FormType[] = ["student", "collab", "general"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Failure = "send" | "too_fast" | null;

type Props = {
  /** Shown if sending fails, so nobody loses their message */
  contactEmail: string;
};

/**
 * The enquiry form. It is the only part of the contact page that runs in the
 * browser (it reads ?type= from the address and holds the typed answers), so
 * everything else on the page stays plain HTML that search engines and AI
 * tools can read.
 *
 * Sending goes to /api/contact, handled by worker/index.ts, which emails the
 * team through Resend.
 */
export default function ContactForm({ contactEmail }: Props) {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as FormType | null;
  const initialType: FormType =
    typeParam && VALID_TYPES.includes(typeParam) ? typeParam : "student";

  const [formType, setFormType] = useState<FormType>(initialType);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<Failure>(null);

  // When the form appeared. Real people take a few seconds to fill it in; the
  // server uses this to spot scripts that post instantly.
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();

    const found: Record<string, string> = {};
    if (!field("name")) found.name = "Please enter your name.";
    if (!field("email")) found.email = "Please enter your email address.";
    else if (!EMAIL_PATTERN.test(field("email"))) found.email = "That email address does not look right.";
    if (!field("message")) found.message = "Please write a message.";

    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length > 0) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          name: field("name"),
          email: field("email"),
          message: field("message"),
          destination: field("destination"),
          level: field("level"),
          organisation: field("organisation"),
          _gotcha: field("_gotcha"),
          elapsedMs: Date.now() - shownAt.current,
        }),
      });
      const body: { ok?: boolean; error?: string; fields?: Record<string, string> } | null =
        await res.json().catch(() => null);

      if (res.ok && body?.ok) {
        setSubmitted(true);
      } else if (res.status === 400 && body?.fields) {
        setErrors(body.fields);
      } else if (body?.error === "too_fast") {
        setFailure("too_fast");
      } else {
        setFailure("send");
      }
    } catch {
      setFailure("send");
    } finally {
      setSending(false);
    }
  }

  const fieldProps = (name: string) => ({
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });

  const fieldError = (name: string) =>
    errors[name] ? (
      <span id={`contact-${name}-error`} className={styles.fieldError} role="alert">
        {errors[name]}
      </span>
    ) : null;

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
                  autoComplete="name"
                  maxLength={120}
                  placeholder="Your name"
                  className={styles.input}
                  {...fieldProps("name")}
                />
                {fieldError("name")}
              </label>
              <label className={styles.fieldWrap}>
                <span className={styles.label}>Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@email.com"
                  className={styles.input}
                  {...fieldProps("email")}
                />
                {fieldError("email")}
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
                  maxLength={200}
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
                maxLength={5000}
                placeholder={
                  formType === "student"
                    ? "What's on your mind? Tell us about your goals, worries, or just where you're at right now."
                    : formType === "collab"
                    ? "Tell us about your idea. What are you working on and how do you think we could work together?"
                    : "How can we help?"
                }
                className={`${styles.input} ${styles.textarea}`}
                {...fieldProps("message")}
              />
              {fieldError("message")}
            </label>

            {/* Hidden from people. Scripts that fill in every field give themselves away. */}
            <div className={styles.hp} aria-hidden="true">
              <label>
                Leave this field empty
                <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {failure === "send" && (
              <p className={styles.formError} role="alert">
                Sorry, your message did not send. Please try again, or email us at{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
              </p>
            )}
            {failure === "too_fast" && (
              <p className={styles.formError} role="alert">
                That was very quick. Please check your details and press Send again.
              </p>
            )}

            <button type="submit" className={styles.submit} disabled={sending}>
              {sending ? "Sending..." : "Send message"}
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
