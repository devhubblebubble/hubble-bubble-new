"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./PartnerCardsSection.module.scss";

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

const CARD_Y_OFFSET = 5;     // % each waiting card sits lower than the one in front
const CARD_SCALE_STEP = 0.075; // how much smaller each waiting card is

/**
 * Where a card is for a given scroll position. `flipped` is how many cards have
 * already flipped away (a fraction while one is mid-flip): a card in front of
 * that flips up and tips back, the ones behind it drift forward.
 */
function cardTransform(index: number, count: number, flipped: number) {
  const done = Math.min(Math.floor(flipped), count - 1);
  const part = flipped - done;
  if (index < done) return `translate(-50%, -250%) rotateX(35deg)`;
  if (index === done && index < count - 1) {
    const y = -50 - 150 * part;
    return part === 0 ? `translate(-50%, ${y}%)` : `translate(-50%, ${y}%) rotateX(${35 * part}deg)`;
  }
  if (index === count - 1 && done >= count - 1) return `translate(-50%, -50%)`;
  const behind = index - done - part;
  const y = -50 + behind * CARD_Y_OFFSET;
  const scale = 1 - behind * CARD_SCALE_STEP;
  return scale === 1 ? `translate(-50%, ${y}%)` : `translate(-50%, ${y}%) scale(${scale})`;
}

export default function PartnerCardsSection({ data }: Props) {
  const pinRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const collabs = data.networkItems ?? [];
  const backingLogo = imageUrl(data.backingLogo, { width: 1100 });
  const backingDims = imageDims(data.backingLogo, { width: 543, height: 198 });

  // The section stays on screen (CSS sticky) while the page scrolls through a
  // taller wrapper; the scroll position through that wrapper moves the cards.
  useEffect(() => {
    const pin = pinRef.current;
    const section = sectionRef.current;
    if (!pin || !section) return;
    const cards = Array.from(section.querySelectorAll<HTMLElement>("article"));
    const flips = cards.length - 1;
    if (flips < 1) return;

    // How much of the wrapper's scroll one flip takes, from the same numbers the stylesheet sizes it with.
    let flipShare = 1 / cards.length;
    const readShare = () => {
      const style = getComputedStyle(pin);
      const flip = parseFloat(style.getPropertyValue("--flip"));
      const hold = parseFloat(style.getPropertyValue("--hold"));
      if (flip > 0 && hold >= 0) flipShare = flip / (flips * flip + hold);
    };
    readShare();

    let raf = 0;
    let shown = -1;
    const update = () => {
      raf = 0;
      const range = pin.offsetHeight - section.offsetHeight;
      if (range <= 0) return;
      const progress = Math.min(1, Math.max(0, -pin.getBoundingClientRect().top / range));
      const flipped = Math.min(flips, progress / flipShare);
      if (Math.abs(flipped - shown) < 0.0005) return;
      shown = flipped;
      cards.forEach((card, i) => {
        card.style.transform = cardTransform(i, cards.length, flipped);
      });
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      readShare();
      shown = -1;
      request();
    };

    // Only follow the scroll while the section is (nearly) on screen.
    let listening = false;
    const io = new IntersectionObserver(
      (entries) => {
        const on = entries[entries.length - 1].isIntersecting;
        if (on && !listening) {
          window.addEventListener("scroll", request, { passive: true });
          listening = true;
          request();
        } else if (!on && listening) {
          window.removeEventListener("scroll", request);
          listening = false;
          request();
        }
      },
      { rootMargin: "100px 0px" },
    );
    io.observe(pin);
    window.addEventListener("resize", onResize, { passive: true });
    request();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const count = 3;
  const rest = (i: number) => ({ transform: cardTransform(i, count, 0) });

  return (
    <div ref={pinRef} className={styles.pin}>
    <section ref={sectionRef} id="about" className={styles.section}>

      {/* ── Card 1 — Scottish EDGE / government backing ───── */}
      <article className={`${styles.card} ${styles.cardEdge}`} style={rest(0)}>
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
      <article className={`${styles.card} ${styles.cardBos}`} style={rest(1)}>
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
      <article className={`${styles.card} ${styles.cardCollab}`} style={rest(2)}>
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
    </div>
  );
}
