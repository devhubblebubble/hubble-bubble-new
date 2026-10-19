"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { StyledText } from "@/components/RichText/StyledText";
import type { Styled, TimelineItem } from "@/lib/sanity/types";
import styles from "./StoryTimeline.module.scss";

type Props = { heading?: Styled; buttonLabel?: string; items: TimelineItem[] };

export default function StoryTimeline({ heading, buttonLabel, items: timelineItems }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const prevIdx = useRef(0);

  const [idx, setIdx] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [animKey, setAnimKey] = useState(0);
  const rafRef = useRef<number | null>(null);

  const total = timelineItems.length;
  const item = timelineItems[Math.min(idx, Math.max(total - 1, 0))];
  /* Rocket / fill follow scroll continuously so motion doesn’t “step” at each year */
  const progressVisual = scrollPct;

  /* ── Scroll → progress + discrete item index ── */
  useEffect(() => {
    const tick = () => {
      rafRef.current = null;
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const scrolled = -rect.top;
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const pct = Math.max(0, Math.min(1, scrolled / scrollable));
      setScrollPct(pct);

      const next =
        total <= 1 ? 0 : Math.min(total - 1, Math.round(pct * (total - 1)));

      if (next !== prevIdx.current) {
        setDirection(next > prevIdx.current ? "up" : "down");
        setIdx(next);
        setAnimKey((k) => k + 1);
        prevIdx.current = next;
      }
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [total]);

  if (!item) return null;

  return (
    /* Scroll length per step — lower multiplier = less empty scroll after the block */
    <section
      ref={sectionRef}
      className={styles.section}
      style={{ height: `${total * 100}vh` }}
    >
      {/* Sticky frame — stays in view while the section scrolls past */}
      <div className={styles.sticky}>
        <div className={styles.layout}>

          {/* ── Left — heading ──────────────────────────────────── */}
          <div className={styles.left}>
            <StyledText as="h2" className={styles.heading} value={heading} marks={{ mint: styles.mint }} />
            {buttonLabel && (
              <Link href="/about" className={styles.btn}>
                {buttonLabel}
              </Link>
            )}
          </div>

          {/* ── Right — slide content + rocket ──────────────────── */}
          <div className={styles.right}>

            {/* Vertical slide viewport */}
            <div className={styles.sliderWrap}>
              {/* Re-keyed on every change so CSS animation replays */}
              <div
                key={animKey}
                className={`${styles.slide} ${
                  direction === "up" ? styles.slideFromBottom : styles.slideFromTop
                }`}
              >
                {/* Year pill */}
                <div className={styles.yearPill}>{item.year}</div>

                {/* Connector */}
                <div className={styles.connector} />

                {/* Crosshair node */}
                <div className={styles.node}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="#78E1C5" strokeWidth="1.5" />
                    <line x1="9" y1="2" x2="9" y2="16" stroke="#78E1C5" strokeWidth="1" />
                    <line x1="2" y1="9" x2="16" y2="9" stroke="#78E1C5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Connector */}
                <div className={styles.connector} />

                {/* Text */}
                <h3 className={styles.title}>{item.title}</h3>
                <p className={styles.desc}>{item.description}</p>
              </div>
            </div>

            {/* ── Rocket progress bar ──────────────────────────── */}
            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                {/* Dim full track is the progressBar background itself */}

                {/* Bright fill — grows upward from bottom */}
                <div
                  className={styles.progressLine}
                  style={{ height: `${progressVisual * 100}%` }}
                />

                {/* Rocket — climbs from bottom (0%) to top (100%) */}
                <div
                  className={styles.rocketContainer}
                  style={{ bottom: `calc(${progressVisual * 100}% - 24px)` }}
                >
                  <div className={styles.rocketIcon}>
                    <Image
                      src="/images/journey/rocket.png"
                      alt="Rocket"
                      width={36}
                      height={48}
                      className={styles.rocketImg}
                      priority
                    />
                    <div className={styles.rocketFlame} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
