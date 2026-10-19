"use client";

import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { StyledText } from "@/components/RichText/StyledText";
import { TeamCard } from "@/components/MeetTheTeam";
import { imageUrl } from "@/lib/sanity/image";
import type { AboutPage, SiteSettings } from "@/lib/sanity/types";
import styles from "./AboutUsPage.module.scss";
import StoryTimeline from "./StoryTimeline/StoryTimeline";

type Props = { data: AboutPage; settings: SiteSettings };

export default function AboutUsPage({ data, settings }: Props) {
  const marks = { mint: styles.mint, orange: styles.orange };

  return (
    <div className={styles.page}>

      <Breadcrumb current="About Us" />

      {/* ── Intro block 1 ───────────────────────────────────────────────── */}
      <section className={`${styles.introSection} reveal`}>
        <StyledText as="h1" className={styles.introH1} value={data.intro1HeadingStyled} marks={marks} />
        <StyledText as="p" className={styles.introBod} value={data.intro1BodyStyled} marks={marks} />
      </section>

      {/* ── Intro block 2 ───────────────────────────────────────────────── */}
      <section className={`${styles.introSection} reveal`}>
        <StyledText as="h2" className={styles.introH2} value={data.intro2HeadingStyled} marks={marks} />
        <StyledText as="p" className={styles.introBod} value={data.intro2BodyStyled} marks={marks} />
      </section>

      {/* ── Team ────────────────────────────────────────────────────────── */}
      <section className={styles.teamSection}>
        <div className="reveal">
          <StyledText as="h2" className={styles.teamHeading} value={data.teamHeadingStyled} marks={marks} />
          <StyledText as="p" className={styles.teamSub} value={data.teamSubStyled} marks={marks} />
        </div>

        <div className={styles.teamGrid}>
          {(data.team ?? []).map((member) => {
            const top = imageUrl(member.photo, { width: 900 });
            const bottom = imageUrl(member.photoAlt, { width: 900 }) ?? top;
            if (!top) return null;
            return (
              <div key={member._id} className="reveal">
                <TeamCard
                  topImage={top}
                  bottomImage={bottom ?? top}
                  name={member.name}
                  role={
                    <>
                      {member.title}
                      {member.aka && (
                        <>
                          {" "}
                          <em>a.k.a</em> {member.aka}
                        </>
                      )}
                    </>
                  }
                  aspectRatio="3 / 4"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Story / Timeline — interactive carousel with rocket ───────── */}
      <StoryTimeline
        heading={data.timelineHeadingStyled}
        buttonLabel={data.timelineButtonLabel}
        items={data.timeline ?? []}
      />

      {/* ── Mission ─────────────────────────────────────────────────────── */}
      <section className={`${styles.missionSection} ${styles.missionAfterTimeline} reveal`}>
        <StyledText as="h2" className={styles.missionLabel} value={data.missionLabelStyled} marks={marks} />
        {data.missionAlias && <p className={styles.missionAlias}>{data.missionAlias}</p>}
        <StyledText as="p" className={styles.missionBody} value={data.missionBodyStyled} marks={marks} />
      </section>

      {/* ── Vision ──────────────────────────────────────────────────────── */}
      <section className={`${styles.missionSection} reveal`}>
        <StyledText as="h2" className={styles.missionLabel} value={data.visionLabelStyled} marks={marks} />
        {data.visionAlias && <p className={styles.missionAlias}>{data.visionAlias}</p>}
        <StyledText as="p" className={styles.missionBody} value={data.visionBodyStyled} marks={marks} />
      </section>

      {/* ── Student CTA ─────────────────────────────────────────────────── */}
      <section className={`${styles.ctaSection} reveal`}>
        <StyledText as="p" className={styles.ctaEyebrow} value={data.ctaEyebrowStyled} marks={marks} />
        {data.ctaTitle && <h2 className={styles.ctaTitle}>{data.ctaTitle}</h2>}
        <StyledText as="p" className={styles.ctaSub} value={data.ctaSubStyled} marks={marks} />
        <div className={styles.ctaRow}>
          <Link href="/contact" className={styles.ctaPrimary}>
            {data.ctaPrimaryLabel ?? "Take the eligibility Test"}
          </Link>
          <Link href="/contact" className={styles.ctaGhost}>
            {data.ctaSecondaryLabel ?? "Book a call"}
          </Link>
        </div>
      </section>

      {/* ── Collab CTA ──────────────────────────────────────────────────── */}
      <section className={`${styles.collabSection} reveal`}>
        <StyledText as="h2" className={styles.ctaHeading} value={data.collabHeadingStyled} marks={marks} />
        <StyledText as="p" className={styles.ctaSub} value={data.collabSubStyled} marks={marks} />
        <div className={styles.ctaRow}>
          <Link href="/contact?type=collab" className={styles.ctaPrimary}>
            {data.collabButtonLabel ?? "Pitch your idea"}
          </Link>
        </div>
        <p className={styles.ctaEmail}>
          {data.collabEmailLabel ?? "Or write to us directly at:"}{" "}
          <a href={`mailto:${settings.contactEmail}`} className={styles.emailLink}>
            {settings.contactEmail}
          </a>
        </p>
      </section>

    </div>
  );
}
