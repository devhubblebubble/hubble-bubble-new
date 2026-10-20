"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import EligibilityModal from "@/components/EligibilityModal";
import { useCarousel } from "@/hooks/useCarousel";
import { countryCode, countryName, flagSrc } from "@/lib/flags";
import { imageDims, imageUrl } from "@/lib/sanity/image";
import type { HeroAdmit, HomePage, SanityImage, SiteSettings } from "@/lib/sanity/types";
import styles from "./HeroSection.module.scss";

type Props = { data: HomePage; settings: SiteSettings };

/** Width that keeps the logo's proportions at a fixed display height. */
const widthAtHeight = (img: SanityImage | undefined, height: number, fallbackWidth: number) => {
  const d = imageDims(img, { width: fallbackWidth, height });
  return Math.round((d.width * height) / d.height);
};

/** "Jagadesh Kaliappan" -> "JK", shown in the photo circle until a photo is uploaded. */
const initials = (name: string | undefined) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

type AdmitView = { text: string; fullName: string; src?: string; alt: string };

/**
 * What to show for one admit: the university picked from the Universities
 * list (logo, else its short name), or for a one-off the typed name and/or
 * logo. Returns null when there is nothing to show (e.g. the university was
 * deleted), so an empty slot never appears.
 */
function admitView(a: HeroAdmit): AdmitView | null {
  const u = a.university;
  const fullName = ((u ? u.name : a.label) ?? "").trim();
  const text = ((u ? u.shortName || u.name : a.label) ?? "").trim();
  const logo = u ? u.logo : a.logo;
  const src = imageUrl(logo, { width: 320 });
  if (!src && !text) return null;
  return { text, fullName: fullName || text, src, alt: logo?.alt || fullName || text };
}

export default function HeroSection({ data, settings }: Props) {
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const students = data.heroStudents ?? [];
  const { idx, setPaused } = useCarousel(Math.max(students.length, 1), 6500);
  const headlineRest = (data.headlineRest ?? "").split("\n").filter(Boolean);

  return (
    <>
      <section className={`${styles.hero} reveal`} id="top">
        <div className={styles.grid}>
          <div className={`${styles.copy} reveal`}>
            <div className={styles.intro}>
              <h1 className={styles.headline}>
                {/* The spaces matter: on phones the line breaks are hidden, and
                    without a space the words run together ("theAnti-Agent"). */}
                {data.headlineLead}{" "}
                <br />
                <span className={styles.accent}>{data.headlineAccent}</span>
                {headlineRest.map((line) => (
                  <span key={line}>
                    {" "}
                    <br />
                    {line}
                  </span>
                ))}
              </h1>
              <div className={styles.rule} />
              <p className={styles.sub}>
                <span className={styles.subMuted}>{data.subLead} </span>
                <span className={styles.subHighlight}>{data.subHighlight}</span>{" "}
                <br />
                <span className={styles.subMuted}>{data.subRest}</span>
              </p>
            </div>

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
                    const code = countryCode(s.flag);
                    const admits = (s.admits ?? []).flatMap((a, i) => {
                      const v = admitView(a);
                      return v ? [{ key: a._key ?? String(i), ...v }] : [];
                    });
                    return (
                      <article className={styles.card} key={s._key ?? s.name}>
                        <div className={styles.photoWrap}>
                          <div
                            className={styles.photo}
                            style={photo ? { backgroundImage: `url('${photo}')` } : undefined}
                            role={photo ? "img" : undefined}
                            aria-label={photo ? (s.photo?.alt ?? s.name) : undefined}
                          >
                            {!photo && <span aria-hidden="true">{initials(s.name)}</span>}
                          </div>
                          {code && (
                            <div className={styles.flag}>
                              <Image
                                src={flagSrc(code)}
                                alt={countryName(code)}
                                width={112}
                                height={112}
                                className={styles.flagImg}
                              />
                            </div>
                          )}
                        </div>
                        <div className={styles.name}>{s.name}</div>
                        <div className={styles.course}>{s.course}</div>
                        {admits.length > 0 && (
                          <>
                            <div className={styles.admitsLabel}>Admits:</div>
                            <div className={styles.admits}>
                              {admits.map((a) => (
                                <div key={a.key} className={styles.admit} title={a.fullName}>
                                  {a.src ? (
                                    <Image
                                      src={a.src}
                                      alt={a.alt}
                                      width={160}
                                      height={56}
                                      className={styles.admitImg}
                                    />
                                  ) : (
                                    <span className={styles.admitWordmark}>{a.text}</span>
                                  )}
                                </div>
                              ))}
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
