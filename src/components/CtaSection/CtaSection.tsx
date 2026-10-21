"use client";

import Link from "next/link";
import { useState } from "react";
import EligibilityModal, { preloadOnIntent } from "@/components/EligibilityModal";
import type { HomePage, SiteSettings } from "@/lib/sanity/types";
import styles from "./CtaSection.module.scss";

type Props = { data: HomePage; settings: SiteSettings };

export default function CtaSection({ data, settings }: Props) {
  const leadLines = (data.ctaTitleLead ?? "Still not sure\nwhere to start?").split("\n").filter(Boolean);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);

  return (
    <>
      <section className={styles.section} id="contact">
        <div className={styles.grid}>
          <div className={`${styles.figure} reveal`} />
          <div className={`${styles.text} reveal`}>
            <h2 className={styles.title}>
              <span className={styles.titleLead}>
                {leadLines.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </span>
              <span className={styles.titleAccent}>{data.ctaTitleAccent ?? "That's why we're here!"}</span>
            </h2>
            {data.ctaText && <p>{data.ctaText}</p>}
            <div className={styles.buttons}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setEligibilityOpen(true)}
                {...preloadOnIntent}
              >
                {data.ctaPrimaryLabel ?? "Take the eligibility Test"}
              </button>
              <Link href="/contact" className={`${styles.btn} ${styles.btnGhost}`}>
                {data.ctaSecondaryLabel ?? "Book a call"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {eligibilityOpen && (
        <EligibilityModal
          isOpen={eligibilityOpen}
          onClose={() => setEligibilityOpen(false)}
          contactEmail={settings.contactEmail}
          bookingUrl={settings.bookingUrl}
        />
      )}
    </>
  );
}
