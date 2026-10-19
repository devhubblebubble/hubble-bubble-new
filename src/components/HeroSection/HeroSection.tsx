"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import EligibilityModal from "@/components/EligibilityModal";
import { useCarousel } from "@/hooks/useCarousel";
import { imageDims, imageUrl } from "@/lib/sanity/image";
import type { HomePage, SanityImage } from "@/lib/sanity/types";
import styles from "./HeroSection.module.scss";

type Props = { data: HomePage };

/** Width that keeps the logo's proportions at a fixed display height. */
const widthAtHeight = (img: SanityImage | undefined, height: number, fallbackWidth: number) => {
  const d = imageDims(img, { width: fallbackWidth, height });
  return Math.round((d.width * height) / d.height);
};

export default function HeroSection({ data }: Props) {
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const students = data.heroStudents ?? [];
  const { idx, setPaused } = useCarousel(Math.max(students.length, 1), 6500);
  const headlineRest = (data.headlineRest ?? "").split("\n").filter(Boolean);

  return (
    <>
      <section className={`${styles.hero} reveal`} id="top">
        <div className={styles.grid}>
          <div className="reveal">
            <h1 className={styles.headline}>
              {data.headlineLead}
              <br />
              <span className={styles.accent}>{data.headlineAccent}</span>
              {headlineRest.map((line) => (
                <span key={line}>
                  <br />
                  {line}
                </span>
              ))}
            </h1>
            <div className={styles.rule} />
            <p className={styles.sub}>
              <span className={styles.subMuted}>{data.subLead} </span>
              <span className={styles.subHighlight}>{data.subHighlight}</span>
              <br />
              <span className={styles.subMuted}>{data.subRest}</span>
            </p>

            {(data.accreditations?.length ?? 0) > 0 && (
              <div className={styles.accred}>
                <div className={styles.accredLabel}>{data.accreditationsLabel}</div>
                <div className={styles.accredRow}>
                  {data.accreditations!.map((item) => {
                    const src = imageUrl(item.logo, { width: 360 });
                    if (!src) return null;
                    return (
                      <Image
                        key={item._key ?? item.name}
                        src={src}
                        alt={item.logo?.alt ?? item.name ?? ""}
                        width={widthAtHeight(item.logo, 34, 115)}
                        height={34}
                        className={styles.accredLogo}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            <div className={styles.ctas}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setEligibilityOpen(true)}
              >
                {data.primaryCtaLabel ?? "Take the eligibility Test"}
              </button>
              <Link href={data.secondaryCtaHref || "/contact"} className={`${styles.btn} ${styles.btnGhost}`}>
                {data.secondaryCtaLabel ?? "Book a call"}
              </Link>
            </div>
          </div>

          {students.length > 0 && (
            <div className={`${styles.right} reveal`}>
              <div
                className={styles.carousel}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <div
                  className={styles.track}
                  style={{ transform: `translateX(-${idx * 100}%)` }}
                >
                  {students.map((s) => {
                    const photo = imageUrl(s.photo, { width: 320, height: 320 });
                    return (
                      <article className={styles.card} key={s._key ?? s.name}>
                        <div className={styles.photoWrap}>
                          <div
                            className={styles.photo}
                            style={photo ? { backgroundImage: `url('${photo}')` } : undefined}
                          />
                          {s.flag && <div className={styles.flag}>{s.flag}</div>}
                        </div>
                        <div className={styles.name}>{s.name}</div>
                        <div className={styles.course}>{s.course}</div>
                        {(s.admits?.length ?? 0) > 0 && (
                          <>
                            <div className={styles.admitsLabel}>Admits:</div>
                            <div className={styles.admits}>
                              {s.admits!.map((a, i) => {
                                const src = imageUrl(a.logo, { width: 320 });
                                return src ? (
                                  <Image
                                    key={a._key ?? i}
                                    src={src}
                                    alt={a.logo?.alt ?? a.label ?? ""}
                                    width={160}
                                    height={56}
                                    className={styles.admitImg}
                                  />
                                ) : (
                                  <span key={a._key ?? i} className={styles.admitWordmark}>
                                    {a.label}
                                  </span>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {eligibilityOpen && (
        <EligibilityModal isOpen={eligibilityOpen} onClose={() => setEligibilityOpen(false)} />
      )}
    </>
  );
}
