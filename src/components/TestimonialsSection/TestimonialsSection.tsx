"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import Dots from "@/components/Dots/Dots";
import CardStack, { type CardStackHandle } from "./CardStack";
import styles from "./TestimonialsSection.module.scss";

import { imageUrl } from "@/lib/sanity/image";
import type { Testimonial } from "@/lib/sanity/types";

type Props = { title?: string; lead?: string; testimonials?: Testimonial[] };

export default function TestimonialsSection({ title, lead, testimonials = [] }: Props) {
  const [idx, setIdx] = useState(0);
  const stackRef = useRef<CardStackHandle | null>(null);

  const go = (i: number) => {
    const count = testimonials.length;
    stackRef.current?.slideTo(((i % count) + count) % count);
  };

  const t = testimonials[Math.min(idx, testimonials.length - 1)];
  if (!t) return null;

  return (
    <section className={styles.section}>
      <div className="reveal">
        <h2>{title ?? "They Made It. So Can You!"}</h2>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>

      <div className={styles.grid}>
        <div className={styles.cardsWrapper}>
          <div className={styles.cardsContainer}>
            <CardStack
              ref={stackRef}
              onChange={setIdx}
              cardClassName={styles.card}
              cards={testimonials.map((tm) => {
                const src = imageUrl(tm.photo, { width: 900 });
                return src ? (
                  <Image
                    src={src}
                    alt={tm.photo?.alt ?? tm.name ?? ""}
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 82vw, (max-width: 1100px) 76vw, min(440px, 48vw)"
                    style={{ objectFit: "cover" }}
                  />
                ) : null;
              })}
            />
          </div>
        </div>

        <div className={styles.quote}>
          <p className={`${styles.quoteText} ${t.large ? styles.quoteLarge : ""}`}>
            {t.quote}
          </p>
          <div className={styles.name}>{t.name}</div>
          <div className={styles.course}>{t.course}</div>
          <div className={styles.uni}>{t.university}</div>
        </div>
      </div>

      <div className={styles.footer}>
        <Dots
          count={testimonials.length}
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
