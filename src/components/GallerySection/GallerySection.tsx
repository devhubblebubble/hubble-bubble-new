"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { imageDims, imageUrl } from "@/lib/sanity/image";
import type { GalleryItem } from "@/lib/sanity/types";
import BubbleField from "./BubbleField";
import { Stand, textSize, tone } from "./Face";
import styles from "./GallerySection.module.scss";

type Props = {
  title?: string;
  lead?: string;
  hint?: string;
  items?: GalleryItem[];
  /**
   * "section": part of the home page (the default).
   * "page": the Gallery screen of its own (/gallery/), where the title is the
   * page heading and the bubbles take every drag.
   */
  variant?: "section" | "page";
};

/** Long stories get a slightly smaller type so they stay inside the round card. */
const storySize = (text: string) =>
  text.length <= 120 ? "s" : text.length <= 170 ? "m" : text.length <= 220 ? "l" : "xl";

function Card({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const src = imageUrl(item.image, { width: 800 });
  const isPhoto = item.style === "photo";
  const dims = imageDims(item.image, { width: 360, height: 200 });
  const text = item.bubbleText?.trim() || item.name || "";
  const story = item.description ?? "";

  useEffect(() => {
    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    // Hiding the page scrollbar would nudge the page sideways, so give it the space back.
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // The close button is the only thing to reach, so keep focus on it.
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={`${styles.dialog} ${tone(item.color)}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-card-title"
        aria-describedby="gallery-card-text"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.card}>
          <div className={`${styles.media} ${isPhoto ? styles.mediaPhoto : ""}`}>
            {isPhoto ? (
              src ? (
                <Image className={styles.cardPhoto} src={src} alt={item.image?.alt ?? ""} fill sizes="480px" />
              ) : (
                <Stand icon={item.icon} />
              )
            ) : src ? (
              <Image
                className={styles.cardLogo}
                src={src}
                alt={item.image?.alt ?? item.name ?? ""}
                width={dims.width}
                height={dims.height}
              />
            ) : (
              <span className={styles.cardBubbleText} data-size={textSize(text)}>
                {text}
              </span>
            )}
          </div>

          <h3 id="gallery-card-title" className={styles.cardTitle}>
            {item.name}
          </h3>
          <p id="gallery-card-text" className={styles.cardText} data-size={storySize(story)}>
            {story}
          </p>
        </div>

        <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function GallerySection({ title, lead, hint, items = [], variant = "section" }: Props) {
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const list = items.filter((item) => item?.name);
  if (list.length === 0) return null;

  const stories = list.filter((item) => item.description);
  const heading = title ?? "Look Who've Noticed Us!";
  const Heading = variant === "page" ? "h1" : "h2";

  const show = (item: GalleryItem, opener: HTMLElement | null) => {
    openerRef.current = opener;
    setOpen(item);
  };
  const close = () => {
    setOpen(null);
    openerRef.current?.focus();
  };

  return (
    <section
      id="gallery"
      className={`${styles.section} ${variant === "page" ? styles.page : ""}`}
      aria-labelledby="gallery-title"
    >
      <div className={`${styles.header} reveal`}>
        <Heading id="gallery-title" className={styles.title}>
          {heading}
        </Heading>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>

      <div className={`${styles.fieldWrap} reveal`}>
        <BubbleField items={list} onOpen={show} mode={variant} />
      </div>

      {hint && <p className={`${styles.hint} reveal`}>{hint}</p>}

      {/* The same stories as plain text, so search engines and screen readers get them directly. */}
      {stories.length > 0 && (
        <ul className={styles.stories}>
          {stories.map((item, i) => (
            <li key={item._key ?? i}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      )}

      {open && <Card item={open} onClose={close} />}
    </section>
  );
}
