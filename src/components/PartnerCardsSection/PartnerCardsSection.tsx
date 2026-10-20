"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./PartnerCardsSection.module.scss";

gsap.registerPlugin(ScrollTrigger);

import { imageDims, imageUrl } from "@/lib/sanity/image";
import type { HomePage, LogoItem } from "@/lib/sanity/types";

type Props = { data: HomePage };

const lines = (text?: string) => (text ?? "").split("\n").filter(Boolean);

function Lines({ text }: { text?: string }) {
  return (
    <>
      {lines(text).map((line, i) => (
        <span key={line}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </>
  );
}

function NetworkLogo({ item, hidden }: { item: LogoItem; hidden?: boolean }) {
  const src = imageUrl(item.logo, { width: 600 });
  const dims = imageDims(item.logo, { width: 270, height: 74 });
  return (
    <div className={styles.collabLogo} aria-hidden={hidden ? "true" : undefined}>
      {src ? (
        <Image
          src={src}
          alt={hidden ? "" : (item.logo?.alt ?? item.name ?? "")}
          width={dims.width}
          height={dims.height}
          className={styles.collabLogoImage}
        />
      ) : (
        <span>{item.name}</span>
      )}
    </div>
  );
}

export default function PartnerCardsSection({ data }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const collabs = data.networkItems ?? [];
  const backingLogo = imageUrl(data.backingLogo, { width: 1100 });
  const backingDims = imageDims(data.backingLogo, { width: 543, height: 198 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards      = gsap.utils.toArray<HTMLElement>(`.${styles.card}`);
      const totalCards = cards.length;           // 3
      const segmentSize   = 1 / totalCards;
      const cardYOffset   = 5;     // px% stagger between waiting cards
      const cardScaleStep = 0.075; // scale step per card behind active

      /* ── Initial stack: first card centred, rest offset + scaled ── */
      cards.forEach((card, i) => {
        gsap.set(card, {
          xPercent: -50,
          yPercent: -50 + i * cardYOffset,
          scale:     1 - i * cardScaleStep,
        });
      });

      // Only the first (totalCards-1) cards flip away.
      // The last card stays centred — it's the resting state when the section unpins.
      const flipCount = totalCards - 1; // 2 for 3 cards

      const pinScrollPx = () => {
        const h = window.innerHeight;
        const narrow = window.innerWidth <= 768;
        /* Shorter pin on small screens = less empty pin-spacer below #about */
        const scrollVhPerFlip = narrow ? 0.62 : 1.12;
        const scrollVhTail = narrow ? 0.14 : 0.28;
        return h * (flipCount * scrollVhPerFlip + scrollVhTail);
      };

      /* ── ScrollTrigger — pin section, scrub animation ── */
      ScrollTrigger.create({
        trigger:    sectionRef.current,
        start:      "top top",
        // Function + refresh on resize keeps pin length in sync with the viewport
        end:        () => `+=${pinScrollPx()}px`,
        pin:        true,
        pinSpacing: true,
        scrub:      0.45,

        onUpdate: (self) => {
          const progress    = self.progress;
          // Only count progress within the flip segments (0 → flipCount/totalCards)
          const activeIndex = Math.min(
            Math.floor(progress / segmentSize),
            flipCount, // cap at flipCount so we never "activate" beyond last flip
          );
          const segProgress =
            (progress - activeIndex * segmentSize) / segmentSize;

          cards.forEach((card, i) => {
            if (i < activeIndex) {
              // Already flipped → park above viewport
              gsap.set(card, { yPercent: -250, rotationX: 35 });

            } else if (i === activeIndex && i < flipCount) {
              // Currently flipping — animate upward
              gsap.set(card, {
                yPercent:  gsap.utils.interpolate(-50, -200, segProgress),
                rotationX: gsap.utils.interpolate(0,   35,   segProgress),
                scale: 1,
              });

            } else if (i === totalCards - 1 && activeIndex >= flipCount) {
              // Last card is now the frontmost — lock it perfectly centred, never flip
              gsap.set(card, { yPercent: -50, rotationX: 0, scale: 1 });

            } else {
              // Waiting cards — drift up and scale in as the card ahead flips
              const behind = i - activeIndex;
              gsap.set(card, {
                yPercent:  -50 + (behind - segProgress) * cardYOffset,
                rotationX: 0,
                scale:     1 - (behind - segProgress) * cardScaleStep,
              });
            }
          });
        },
      });
    }, sectionRef);

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="about" className={styles.section}>

      {/* ── Card 1 — Scottish EDGE / government backing ───── */}
      <article className={`${styles.card} ${styles.cardEdge}`}>
        <div className={styles.cardGrid}>
          <p className={styles.text}>{data.backingText}</p>
          <div className={styles.partnerBlock}>
            <h3 className={styles.heading}>
              <Lines text={data.backingHeading} />
            </h3>
            {backingLogo && (
              <Image
                src={backingLogo}
                alt={data.backingLogo?.alt ?? ""}
                width={backingDims.width}
                height={backingDims.height}
                className={styles.partnerLogo}
              />
            )}
          </div>
        </div>
      </article>

      {/* ── Card 2 — British Council & ICEF ───────────────── */}
      <article className={`${styles.card} ${styles.cardBos}`}>
        <div className={`${styles.cardGrid} ${styles.flip}`}>
          <div className={styles.partnerBlock}>
            <h3 className={styles.heading}>
              <Lines text={data.certifiedHeading} />
            </h3>
            <div className={styles.partnerLogoRow} aria-label={lines(data.certifiedHeading).join(" ")}>
              {(data.certifiedLogos ?? []).map((item) => {
                const src = imageUrl(item.logo, { width: 360 });
                if (!src) return null;
                const dims = imageDims(item.logo, { width: 118, height: 34 });
                return (
                  <Image
                    key={item._key ?? item.name}
                    src={src}
                    alt={item.logo?.alt ?? item.name ?? ""}
                    width={Math.round((dims.width * 34) / dims.height)}
                    height={34}
                    className={styles.partnerLogoDual}
                  />
                );
              })}
            </div>
          </div>
          <p className={`${styles.text} ${styles.textRight}`}>{data.certifiedText}</p>
        </div>
      </article>

      {/* ── Card 3 — UK business network marquee ───────────── */}
      <article className={`${styles.card} ${styles.cardCollab}`}>
        <div className={styles.collabInner}>
          <h3 className={styles.heading}>
            <Lines text={data.networkHeading} />
          </h3>
          <p className={styles.text}>{data.networkText}</p>
          <div
            className={styles.strip} role="region" tabIndex={0}
            aria-label="Accelerators, institutions, and enterprise partners"
          >
            <div className={styles.stripTrack}>
              {collabs.map((item, i) => (
                <NetworkLogo key={item._key ?? i} item={item} />
              ))}

              {/* Duplicate set for seamless loop (hidden from screen readers) */}
              {collabs.map((item, i) => (
                <NetworkLogo key={`${item._key ?? i}-dup`} item={item} hidden />
              ))}
            </div>
          </div>
        </div>
      </article>

    </section>
  );
}
