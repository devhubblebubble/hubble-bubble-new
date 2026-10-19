"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-cards";

import Dots from "@/components/Dots/Dots";
import styles from "./TestimonialsSection.module.scss";

import { imageUrl } from "@/lib/sanity/image";
import type { Testimonial } from "@/lib/sanity/types";

type Props = { title?: string; lead?: string; testimonials?: Testimonial[] };

export default function TestimonialsSection({ title, lead, testimonials = [] }: Props) {
  const [idx, setIdx] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const go = (i: number) => {
    if (!swiperRef.current) return;
    const count = testimonials.length;
    const next = ((i % count) + count) % count;
    swiperRef.current.slideTo(next);
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
            <Swiper
              effect="cards"
              grabCursor
              modules={[EffectCards]}
              onSwiper={(s) => (swiperRef.current = s)}
              onSlideChange={(s) => setIdx(s.activeIndex)}
              className={styles.swiper}
            >
              {testimonials.map((tm, i) => {
                const src = imageUrl(tm.photo, { width: 900 });
                return (
                  <SwiperSlide key={tm._key ?? i} className={styles.card}>
                    {src && (
                      <Image
                        src={src}
                        alt={tm.photo?.alt ?? tm.name ?? ""}
                        fill
                        sizes="(max-width: 640px) 82vw, (max-width: 1100px) 76vw, min(440px, 48vw)"
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>
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
