"use client";

import Link from "next/link";
import StoryRow from "@/components/StoryRow/StoryRow";
import { useCarousel } from "@/hooks/useCarousel";
import Dots from "@/components/Dots/Dots";
import type { Story } from "@/lib/sanity/types";
import styles from "./StoriesSection.module.scss";

type Props = {
  title?: string;
  viewAllLabel?: string;
  stories: Story[];
};

export default function StoriesSection({ title, viewAllLabel, stories }: Props) {
  const { idx, go, setPaused } = useCarousel(Math.max(stories.length, 1), 8000);

  if (stories.length === 0) return null;

  return (
    <section className={styles.section} id="stories">
      <div className={styles.header}>
        <div className="reveal">
          <h2>{title ?? "Student Stories"}</h2>
        </div>
        <Link href="/stories" className={styles.viewAll}>
          {viewAllLabel ?? "View all stories"}
        </Link>
      </div>

      {/* Carousel wrapper */}
      <div
        className={styles.trackWrap}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className={styles.track}
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {stories.map((s) => (
            <div className={styles.slide} key={s._id}>
              <StoryRow story={s} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className={styles.dotsWrap}>
        <Dots
          count={stories.length}
          idx={idx}
          onPrev={() => go(idx - 1)}
          onNext={() => go(idx + 1)}
          onDot={go}
          noMargin
        />
      </div>
    </section>
  );
}
