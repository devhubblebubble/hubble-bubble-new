"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { icons } from "@/components/MobileTabBar/icons";
import { imageDims, imageUrl } from "@/lib/sanity/image";
import type { GalleryColor, GalleryItem } from "@/lib/sanity/types";
import styles from "./GallerySection.module.scss";

type Props = { title?: string; lead?: string; hint?: string; items?: GalleryItem[] };

/**
 * The designer's bubble cluster (HBWebsite/Mobile/Gallery in the Figma),
 * measured from the frame: x and y are the bubble's centre, d its diameter,
 * all in pixels on the Figma's 342px circle. `rank` is which item from the
 * list the designer put there (0 = the first item, the big one in the middle).
 * When the list is long enough, the slots with an `alt` show the extra items
 * instead, so every item appears at least once.
 */
type Slot = { x: number; y: number; d: number; rank: number; alt?: number };

const CIRCLE = 342;

const SLOTS: Slot[] = [
  { x: 0, y: 0, d: 102, rank: 0 },
  { x: -1.5, y: -96, d: 84, rank: 1 },
  { x: 89, y: -54.5, d: 80, rank: 3 },
  { x: -91.5, y: -48.5, d: 80, rank: 2 },
  { x: -91, y: 50, d: 82, rank: 4 },
  { x: 89.5, y: 51, d: 80, rank: 4 },
  { x: -0.5, y: 95.5, d: 85, rank: 5 },
  { x: -66.5, y: -123.5, d: 47, rank: 4, alt: 6 },
  { x: 63, y: -128, d: 48, rank: 5, alt: 7 },
  { x: 0, y: -153, d: 25, rank: 4 },
  { x: 133, y: -93, d: 24, rank: 2 },
  { x: 137.5, y: -0.5, d: 43, rank: 1, alt: 8 },
  { x: -138.5, y: -10.5, d: 40, rank: 4, alt: 9 },
  { x: -71, y: 121, d: 42, rank: 2 },
  { x: 69.5, y: 115.5, d: 40, rank: 3 },
  { x: 133.5, y: 82.5, d: 20, rank: 5 },
  { x: -138.5, y: 85, d: 21, rank: 1 },
  { x: -1.5, y: 153, d: 20, rank: 3 },
];

const pct = (n: number) => `${((n / CIRCLE) * 100).toFixed(3)}%`;

type Placed = {
  slot: Slot;
  item: GalleryItem;
  itemIndex: number;
  /** The first (biggest) bubble of an item is the one keyboards and screen readers get. */
  primary: boolean;
};

function place(items: GalleryItem[]): Placed[] {
  const n = items.length;
  const seen = new Set<number>();
  return SLOTS.map((slot) => {
    const itemIndex = slot.alt !== undefined && slot.alt < n ? slot.alt : slot.rank % n;
    const primary = !seen.has(itemIndex);
    seen.add(itemIndex);
    return { slot, item: items[itemIndex], itemIndex, primary };
  });
}

const tone = (color?: GalleryColor) => styles[`tone_${color ?? "navy"}`];

/** Short text ("in") is drawn big, a long name smaller, so it always fits the circle. */
const textSize = (text: string) => (text.length <= 2 ? "xl" : text.length <= 5 ? "l" : text.length <= 10 ? "m" : "s");

/** Long stories get a slightly smaller type so they stay inside the round card. */
const storySize = (text: string) => (text.length <= 120 ? "s" : text.length <= 170 ? "m" : text.length <= 220 ? "l" : "xl");

function Trophy() {
  return (
    <svg className={styles.icon} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M18 8h28v14c0 9-6 16-14 16s-14-7-14-16V8z" fill="currentColor" />
      <path
        d="M18 13H9v4c0 7 4 11 10 12M46 13h9v4c0 7-4 11-10 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="29" y="37" width="6" height="11" fill="currentColor" />
      <rect x="20" y="48" width="24" height="7" rx="2" fill="currentColor" />
    </svg>
  );
}

function Handshake() {
  const { d, w, h } = icons.services;
  return (
    <svg className={styles.icon} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <path d={d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** The picture standing in for a photo that has not been uploaded yet. */
const Stand = ({ icon }: { icon?: GalleryItem["icon"] }) => (icon === "handshake" ? <Handshake /> : <Trophy />);

/** What fills a bubble: a photo, a logo, short text, or a picture while a photo is missing. */
function Face({ item }: { item: GalleryItem }) {
  const src = imageUrl(item.image, { width: 480 });

  if (item.style === "photo") {
    if (src) {
      return <Image className={styles.photo} src={src} alt="" fill sizes="(max-width: 640px) 120px, 240px" />;
    }
    return <Stand icon={item.icon} />;
  }
  if (src) {
    const dims = imageDims(item.image, { width: 360, height: 200 });
    return <Image className={styles.logo} src={src} alt="" width={dims.width} height={dims.height} />;
  }
  const text = item.bubbleText?.trim() || item.name || "";
  return (
    <span className={styles.bubbleText} data-size={textSize(text)}>
      {text}
    </span>
  );
}

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

export default function GallerySection({ title, lead, hint, items = [] }: Props) {
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const list = items.filter((item) => item?.name);
  if (list.length === 0) return null;

  const placed = place(list);
  const stories = list.filter((item) => item.description);

  const show = (item: GalleryItem, opener: HTMLElement | null) => {
    openerRef.current = opener;
    setOpen(item);
  };
  const close = () => {
    setOpen(null);
    openerRef.current?.focus();
  };

  return (
    <section id="gallery" className={styles.section} aria-labelledby="gallery-title">
      <div className={`${styles.header} reveal`}>
        <h2 id="gallery-title" className={styles.title}>
          {title ?? "Look Who've Noticed Us!"}
        </h2>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>

      <div className={`${styles.cluster} reveal`}>
        <div className={styles.ring} aria-hidden="true" />
        {placed.map(({ slot, item, itemIndex, primary }, i) => {
          const canOpen = Boolean(item.description);
          const style = {
            "--x": pct(CIRCLE / 2 + slot.x),
            "--y": pct(CIRCLE / 2 + slot.y),
            "--k": (slot.d / CIRCLE).toFixed(4),
            "--i": i,
          } as CSSProperties;
          const face = (
            <span className={styles.drift}>
              <span className={`${styles.face} ${tone(item.color)}`}>
                <Face item={item} />
              </span>
            </span>
          );

          if (canOpen && primary) {
            return (
              <button
                key={i}
                type="button"
                className={`${styles.bubble} ${styles.clickable}`}
                style={style}
                aria-label={`${item.name}, read more`}
                aria-haspopup="dialog"
                onClick={(event: MouseEvent<HTMLButtonElement>) => show(item, event.currentTarget)}
              >
                {face}
              </button>
            );
          }
          // Repeats of an item and bubbles without a story are not buttons:
          // the first bubble of each item is the one to tab to.
          return (
            <span
              key={`${itemIndex}-${i}`}
              className={`${styles.bubble} ${canOpen ? styles.clickable : ""}`}
              style={style}
              aria-hidden="true"
              onClick={canOpen ? () => show(item, null) : undefined}
            >
              {face}
            </span>
          );
        })}
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
