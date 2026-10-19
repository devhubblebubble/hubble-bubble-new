"use client";

import Link from "next/link";
import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import type { ServicesPage as ServicesPageData } from "@/lib/sanity/types";
import styles from "./ServicesPage.module.scss";

type TabId = "hubble" | "addon";

type Props = { data: ServicesPageData };

export default function ServicesPage({ data }: Props) {
  const [tab, setTab] = useState<TabId>("hubble");
  const primary = data.primaryServices ?? [];
  const addOn = data.addOnServices ?? [];
  const cards = tab === "hubble" ? primary : addOn;

  return (
    <div className={styles.page}>
      <Breadcrumb current="Services" />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="reveal">
          {data.heroEyebrow && <p className={styles.eyebrow}>{data.heroEyebrow}</p>}
          <h1>{data.heroTitle}</h1>
          {data.heroSubtitle && <p className={styles.heroSub}>{data.heroSubtitle}</p>}
        </div>
      </section>

      {/* ── Cards ──────────────────────────────────────────────────────── */}
      <section className={styles.content} aria-label="Service listings">
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Service categories"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "hubble"}
            className={tab === "hubble" ? styles.tabActive : styles.tabInactive}
            onClick={() => setTab("hubble")}
          >
            {data.tabPrimaryLabel ?? "Hubble Bubble Services"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "addon"}
            className={tab === "addon" ? styles.tabActive : styles.tabInactive}
            onClick={() => setTab("addon")}
          >
            {data.tabSecondaryLabel ?? "Add On Services"}
          </button>
        </div>

        <div className={styles.cardGrid} role="tabpanel">
          {cards.map((card, i) => (
            <article key={card._key ?? i} className={`${styles.card} reveal`}>
              <div className={styles.cardBody}>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </div>
              <Link
                href="/contact"
                className={styles.cardAction}
                aria-label={`Learn more: ${card.title}`}
              >
                <span className={styles.cardChevron} aria-hidden>
                  ›
                </span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className={`${styles.cta} reveal`}>
        <h2 className={styles.ctaTitle}>{data.ctaTitle}</h2>
        {data.ctaText && <p className={styles.ctaText}>{data.ctaText}</p>}
        <div className={styles.ctaRow}>
          <Link href="/contact" className={styles.ctaPrimary}>
            {data.ctaPrimaryLabel ?? "Book a call"}
          </Link>
          <Link href="/contact" className={styles.ctaGhost}>
            {data.ctaSecondaryLabel ?? "Take the eligibility Test"}
          </Link>
        </div>
      </section>
    </div>
  );
}
