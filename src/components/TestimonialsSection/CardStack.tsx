"use client";

import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import styles from "./CardStack.module.scss";

// How the cards fan out, and how a swipe feels. These are the numbers of the
// Swiper "cards" effect this replaces, so the stack looks and moves as before.
const ROTATE_PER_CARD = 2; // degrees each card further back is turned
const OFFSET_PER_CARD = 8; // percent of its width each card further back peeks out
const MOVE_MS = 300; // how long a card takes to move into place
const THRESHOLD = 5; // pixels a pointer must move before it counts as a drag
const MAX_ANGLE = 45; // a drag steeper than this (degrees) is a scroll, not a swipe
const EDGE_PULL = 0.85; // how hard the first and last card resist being pulled past the end
const QUICK_MS = 300; // a swipe this quick changes card however short it is
const HALF = 0.5; // a slower drag changes card once it is past this much of a card

type Lean = "next" | "prev" | null;

/**
 * Where card `index` sits when the stack is at `position` (in cards; 1.5 is
 * half way between the second and third card). `lean` is the way a finger is
 * currently dragging: that card is then thrown out to that side while it is
 * dragged.
 */
function poseOf(index: number, position: number, count: number, lean: Lean) {
  // Negative: cards still to come, peeking out on the right. Positive: cards already seen, on the left.
  const away = position - index;
  const progress = Math.min(Math.max(away, -4), 4);
  const depth = Math.abs(progress);

  let rotate = -ROTATE_PER_CARD * progress;
  let offset = OFFSET_PER_CARD - depth * 0.75;
  let shrink = 0;
  let lift = 0;
  const thrown = (lean === "next" && progress > 0 && progress < 1) || (lean === "prev" && progress < 0 && progress > -1);
  if (thrown) {
    const arc = (1 - Math.abs((depth - 0.5) / 0.5)) ** 0.5;
    rotate += -28 * progress * arc;
    shrink = 0.5 * arc;
    offset += 96 * arc;
    lift = -25 * arc * depth;
  }

  const x = progress < 0 ? offset * depth : -offset * depth;
  const scale = progress < 0 ? 1 - shrink * -progress : 1 - shrink * progress;
  return {
    transform: `translate3d(${x}%, ${lift}%, ${-100 * depth}px) rotateZ(${rotate}deg) scale(${scale})`,
    zIndex: count - Math.abs(Math.round(away)),
    shade: Math.min(Math.max((depth - 0.5) / 0.5, 0), 1),
  };
}

export type CardStackHandle = {
  /** Brings card `index` to the front. */
  slideTo: (index: number) => void;
};

type Props = {
  /** The cards, front one first. */
  cards: ReactNode[];
  /** Called when a different card becomes the front one (while dragging, as soon as it is past half way). */
  onChange: (index: number) => void;
  /** Look of each card: border, corners, shadow. */
  cardClassName?: string;
  ref?: Ref<CardStackHandle>;
};

/**
 * A stack of cards: the front one is in full view, the rest peek out behind
 * it. Swipe or drag sideways to bring another to the front. The cards are
 * drawn on the server already in their stacked places, and moved with plain
 * style changes afterwards, so no library is needed.
 */
export default function CardStack({ cards, onChange, cardClassName, ref }: Props) {
  const count = cards.length;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moveRef = useRef<((index: number) => void) | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useImperativeHandle(ref, () => ({ slideTo: (index: number) => moveRef.current?.(index) }), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || count === 0) return;
    const els = cardRefs.current.slice(0, count).filter((el): el is HTMLDivElement => el !== null);
    const shades = els.map((el) => el.querySelector<HTMLElement>("[data-shade]"));
    const last = count - 1;

    let position = 0; // where the stack is, in cards: 0 puts the first card in front
    let front = 0; // the card currently counted as the front one

    const draw = (lean: Lean) => {
      els.forEach((el, i) => {
        const pose = poseOf(i, position, count, lean);
        el.style.transform = pose.transform;
        el.style.zIndex = String(pose.zIndex);
        const shade = shades[i];
        if (shade) shade.style.opacity = String(pose.shade);
      });
    };
    const setSpeed = (ms: number) => {
      els.forEach((el, i) => {
        el.style.transitionDuration = `${ms}ms`;
        const shade = shades[i];
        if (shade) shade.style.transitionDuration = `${ms}ms`;
      });
    };
    const settle = () => {
      const next = Math.min(last, Math.max(0, Math.round(position)));
      if (next !== front) {
        front = next;
        onChangeRef.current(next);
      }
    };
    const slideTo = (index: number) => {
      setSpeed(MOVE_MS);
      position = Math.min(last, Math.max(0, Math.round(index)));
      draw(null);
      settle();
    };
    moveRef.current = slideTo;

    // Dragging. The order of the checks follows Swiper's, which this replaces.
    let pointer: number | null = null;
    let down = false; // a finger or the mouse is down on the stack
    let dragged = false; // ... and has started to drag it
    let scrolling: boolean | undefined; // the gesture turned out to be a scroll
    let pastThreshold = false;
    let x0 = 0; // the drag is measured from here
    let y0 = 0;
    let downAt = 0;
    let width = 1;
    let from = 0; // where the stack was, in pixels, when the drag began (0 is the first card, then -width per card)
    let to = 0;
    let pull = 0; // pixels dragged since x0
    let heading: "next" | "prev" = "next";

    const onMove = (e: PointerEvent) => {
      if (!down || e.pointerId !== pointer) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.hypot(dx, dy) < THRESHOLD) return;
      if (scrolling === undefined) {
        if (e.clientY === y0) scrolling = false;
        else if (dx * dx + dy * dy >= 25) {
          scrolling = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI > MAX_ANGLE;
        }
      }
      if (scrolling) {
        down = false;
        return;
      }

      heading = dx > 0 ? "prev" : "next";
      if (!dragged) {
        from = -position * width;
        setSpeed(0);
        root.dataset.dragging = "";
      }
      dragged = true;
      to = dx + from;
      const end = -last * width;
      if (dx > 0) {
        // Pulled past the first card: it resists.
        if (to > 0) to = -1 + (from + dx) ** EDGE_PULL;
      } else if (dx < 0) {
        // Pulled past the last card.
        if (to < end) to = end + 1 - (end - from - dx) ** EDGE_PULL;
      }
      if (Math.abs(dx) > THRESHOLD || pastThreshold) {
        if (!pastThreshold) {
          // The first few pixels do not move anything; the drag is measured from here.
          pastThreshold = true;
          x0 = e.clientX;
          y0 = e.clientY;
          to = from;
          pull = 0;
          return;
        }
      } else {
        to = from;
        return;
      }
      pull = dx;
      position = -to / width;
      settle();
      const began = -from / width;
      draw(position > began ? "next" : position < began ? "prev" : null);
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      delete root.dataset.dragging;
      const wasDown = down;
      const wasDragged = dragged;
      down = false;
      dragged = false;
      if (!wasDown || !wasDragged || pull === 0 || to === from) return;

      // Which card to settle on: a quick flick goes the way it was flicked, a slow drag only past half way.
      const stop = Math.min(last, Math.max(0, Math.floor(position)));
      const ratio = position - stop;
      let target = stop;
      if (performance.now() - downAt > QUICK_MS) {
        if (heading === "next" ? ratio >= HALF : ratio > 1 - HALF) target = stop + 1;
      } else if (heading === "next") {
        target = stop + 1;
      }
      slideTo(target);
    };

    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || (pointer !== null && pointer !== e.pointerId)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointer = e.pointerId;
      down = true;
      dragged = false;
      scrolling = undefined;
      pastThreshold = false;
      x0 = e.clientX;
      y0 = e.clientY;
      downAt = performance.now();
      width = root.offsetWidth || 1;
      pull = 0;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      // A mouse press must not start selecting text or dragging the photo.
      if (e.pointerType === "mouse") e.preventDefault();
    };
    const noNativeDrag = (e: Event) => e.preventDefault();

    if (count > 1) {
      root.addEventListener("pointerdown", onDown);
      root.addEventListener("dragstart", noNativeDrag);
    }
    return () => {
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("dragstart", noNativeDrag);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      delete root.dataset.dragging;
      moveRef.current = null;
    };
  }, [count]);

  return (
    <div ref={rootRef} className={styles.stack} data-single={count < 2 ? "" : undefined}>
      <div className={styles.track}>
        {cards.map((card, i) => {
          const pose = poseOf(i, 0, count, null);
          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={[styles.card, cardClassName].filter(Boolean).join(" ")}
              style={{ transform: pose.transform, zIndex: pose.zIndex }}
            >
              {card}
              <div className={styles.shade} data-shade="" style={{ opacity: pose.shade }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
