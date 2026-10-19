import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { RichText } from "@/components/RichText/StyledText";
import type { PrivacyPage as PrivacyPageData } from "@/lib/sanity/types";
import styles from "./PrivacyPage.module.scss";

type Props = { data: PrivacyPageData };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function PrivacyPage({ data }: Props) {
  const sections = (data.sections ?? []).map((s, i) => ({
    ...s,
    id: s.title ? slug(s.title) : `section-${i + 1}`,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Breadcrumb current={data.title ?? "Privacy Policy"} inset />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className={`${styles.header} reveal`}>
          {data.eyebrow && <p className={styles.eyebrow}>{data.eyebrow}</p>}
          <h1 className={styles.title}>{data.title ?? "Privacy Policy"}</h1>
          {data.lastUpdated && <p className={styles.updated}>Last updated: {data.lastUpdated}</p>}
          {data.intro && <p className={styles.intro}>{data.intro}</p>}
        </header>

        {/* ── Table of Contents ───────────────────────────────────────── */}
        {sections.length > 0 && (
          <nav className={`${styles.toc} reveal`} aria-label="Table of contents">
            <p className={styles.tocLabel}>Contents</p>
            <ol className={styles.tocList}>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={styles.tocLink}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* ── Sections ────────────────────────────────────────────────── */}
        <div className={styles.sections}>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className={`${styles.section} reveal`}>
              <h2 className={styles.sectionTitle}>{s.title}</h2>
              <RichText className={styles.sectionBody} value={s.bodyRich} />
            </section>
          ))}
        </div>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <div className={`${styles.footNote} reveal`}>
          <p>
            Questions?{" "}
            <Link href="/contact" className={styles.footLink}>
              Get in touch
            </Link>
            , we&apos;re happy to help.
          </p>
        </div>
      </div>
    </div>
  );
}
