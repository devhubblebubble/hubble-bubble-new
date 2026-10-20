"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { GalleryItem } from "@/lib/sanity/types";
import Face, { tone } from "./Face";
import { BUBBLE, COL, SPACING, cellCenter, cellTransform, nearestCell, visibleCells } from "./field";
import type { Point } from "./field";
import styles from "./GallerySection.module.scss";

// The endless honeycomb of bubbles, like the app grid on an Apple Watch. Drag
// it in any direction; it glides on when you let go and settles with a bubble
// in the middle. Tap (or press Enter on) a bubble that has a story to open it.
//
// `offset` is the point of the flat honeycomb that sits in the middle of the
// ring. Every frame, each bubble on screen gets its place and size from
// field.ts and is moved with a transform, without going through React. React
// only steps in when a bubble enters or leaves the ring.

type Props = {
  items: GalleryItem[];
  onOpen: (item: GalleryItem, opener: HTMLElement | null) => void;
  /**
   * "page": the field is its own screen and takes every drag.
   * "section": on touch screens, swiping up and down scrolls the page and
   * swiping sideways moves the bubbles, so the field never traps the page.
   */
  mode: "section" | "page";
};

/** Time for the glide to slow to a third (ms). */
const FRICTION = 320;
/** Time for the settle to close two thirds of the remaining distance (ms). */
const EASE = 110;
/** A pointer that moves less than this (px) is a tap, not a drag. */
const TAP = 8;
/** Fastest fling, in pixels per millisecond. */
const MAX_SPEED = 2.4;
/** The small to-and-fro when the field first comes into view. */
const NUDGE: Point = { x: 0.34, y: -0.2 };
const NUDGE_MS = 1500;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Bubbles fade out just before they vanish at the rim. */
const fade = (scale: number) => Math.min(1, Math.max(0, (scale - 0.03) / 0.1));

type Drag = {
  id: number;
  R: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  moved: boolean;
  samples: { t: number; x: number; y: number }[];
};

type Anim =
  | { kind: "glide"; v: Point; R: number; last: number; raf: number }
  | { kind: "ease"; target: Point; last: number; raf: number }
  | { kind: "nudge"; from: Point; t0: number; raf: number };

export default function BubbleField({ items, onOpen, mode }: Props) {
  const count = items.length;
  const clusterRef = useRef<HTMLDivElement>(null);
  const [nodes] = useState(() => new Map<string, HTMLElement>());
  const [cells, setCells] = useState(() => visibleCells({ x: 0, y: 0 }, count));
  const offset = useRef<Point>({ x: 0, y: 0 });
  const drag = useRef<Drag | null>(null);
  const anim = useRef<Anim | null>(null);
  const touched = useRef(false);
  const lastPointerAt = useRef(0);

  // Move every bubble on screen to where `offset` puts it. React re-renders
  // only when the set of bubbles inside the ring changes.
  const paint = () => {
    const live = visibleCells(offset.current, count);
    let changed = live.length !== nodes.size;
    for (const c of live) {
      const el = nodes.get(c.key);
      if (!el) {
        changed = true;
        continue;
      }
      el.style.transform = cellTransform(c);
      el.style.zIndex = String(Math.round(c.scale * 100));
      el.style.opacity = String(fade(c.scale));
    }
    if (changed) setCells(live);
  };

  const stop = () => {
    if (anim.current) cancelAnimationFrame(anim.current.raf);
    anim.current = null;
  };

  const tick = (now: number) => {
    const a = anim.current;
    if (!a) return;
    const o = offset.current;

    if (a.kind === "nudge") {
      const t = Math.min(1, (now - a.t0) / NUDGE_MS);
      // Out and back, starting and ending at rest.
      const s = Math.sin(Math.PI * t) ** 2;
      o.x = a.from.x + NUDGE.x * s;
      o.y = a.from.y + NUDGE.y * s;
      paint();
      if (t >= 1) {
        anim.current = null;
        return;
      }
    } else {
      // Capped so a tab that was hidden does not jump when it comes back.
      const dt = Math.min(200, now - a.last);
      a.last = now;
      if (a.kind === "glide") {
        const decay = Math.exp(-dt / FRICTION);
        o.x += a.v.x * FRICTION * (1 - decay);
        o.y += a.v.y * FRICTION * (1 - decay);
        a.v.x *= decay;
        a.v.y *= decay;
        paint();
        if (Math.hypot(a.v.x, a.v.y) * a.R < 0.02) {
          settle();
          return;
        }
      } else {
        const k = 1 - Math.exp(-dt / EASE);
        o.x += (a.target.x - o.x) * k;
        o.y += (a.target.y - o.y) * k;
        if (Math.hypot(a.target.x - o.x, a.target.y - o.y) < 0.0008) {
          o.x = a.target.x;
          o.y = a.target.y;
          paint();
          anim.current = null;
          return;
        }
        paint();
      }
    }
    a.raf = requestAnimationFrame(tick);
  };

  /** Slide to a point of the honeycomb (or jump there for people who ask for less motion). */
  const easeTo = (target: Point) => {
    stop();
    if (reducedMotion()) {
      offset.current = { ...target };
      paint();
      return;
    }
    anim.current = { kind: "ease", target, last: performance.now(), raf: 0 };
    anim.current.raf = requestAnimationFrame(tick);
  };

  /** Settle with the nearest bubble in the middle. */
  const settle = () => {
    const c = nearestCell(offset.current);
    easeTo(cellCenter(c.q, c.r));
  };

  // Pointer: drag to move, let go to glide, tap to open.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (drag.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    touched.current = true;
    lastPointerAt.current = e.timeStamp;
    stop();
    drag.current = {
      id: e.pointerId,
      R: rect.width / 2,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
      samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }],
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.dragging = "";
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    offset.current.x -= (e.clientX - d.lastX) / d.R;
    offset.current.y -= (e.clientY - d.lastY) / d.R;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > TAP) d.moved = true;
    d.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    while (d.samples.length > 1 && e.timeStamp - d.samples[0].t > 120) d.samples.shift();
    paint();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return null;
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    return d;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = endDrag(e);
    if (!d) return;

    if (!d.moved) {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-cell]");
      const item = el ? items[Number(el.dataset.item)] : undefined;
      if (item?.description) onOpen(item, el ?? null);
      return;
    }

    // Speed from the last moments of the drag, in ring radii per millisecond.
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const dt = last.t - first.t;
    let vx = 0;
    let vy = 0;
    if (dt > 0 && e.timeStamp - last.t < 80) {
      vx = -(last.x - first.x) / dt;
      vy = -(last.y - first.y) / dt;
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_SPEED) {
        vx *= MAX_SPEED / speed;
        vy *= MAX_SPEED / speed;
      }
    }
    if (Math.hypot(vx, vy) < 0.05 || reducedMotion()) {
      settle();
      return;
    }
    stop();
    anim.current = { kind: "glide", v: { x: vx / d.R, y: vy / d.R }, R: d.R, last: performance.now(), raf: 0 };
    anim.current.raf = requestAnimationFrame(tick);
  };

  // The browser took the touch for scrolling the page: just settle.
  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = endDrag(e);
    if (d?.moved) settle();
  };

  // Keyboard: arrows move one bubble at a time.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, Point> = {
      ArrowLeft: { x: -COL, y: 0 },
      ArrowRight: { x: COL, y: 0 },
      ArrowUp: { x: 0, y: -SPACING },
      ArrowDown: { x: 0, y: SPACING },
    };
    const s = step[e.key];
    if (!s) return;
    e.preventDefault();
    touched.current = true;
    const c = nearestCell({ x: offset.current.x + s.x, y: offset.current.y + s.y });
    easeTo(cellCenter(c.q, c.r));
  };

  // A bubble reached by keyboard slides to the middle.
  const onFocusCell = (q: number, r: number) => {
    if (drag.current || performance.now() - lastPointerAt.current < 600) return;
    easeTo(cellCenter(q, r));
  };

  // A small to-and-fro the first time the field comes into view, to show it moves.
  useEffect(() => {
    const el = clusterRef.current;
    if (!el || reducedMotion()) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        if (touched.current || anim.current) return;
        anim.current = { kind: "nudge", from: { ...offset.current }, t0: performance.now(), raf: 0 };
        anim.current.raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The biggest bubble of each item with a story is the one keyboards stop on.
  const primary = new Map<number, string>();
  for (const c of cells) if (!primary.has(c.item)) primary.set(c.item, c.key);

  return (
    <div
      ref={clusterRef}
      className={`${styles.cluster} ${mode === "page" ? styles.clusterPage : styles.clusterSection}`}
      style={{ "--k": BUBBLE / 2 } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    >
      <div className={styles.ring} aria-hidden="true" />
      {cells.map((c) => {
        const item = items[c.item];
        const style: CSSProperties = {
          transform: cellTransform(c),
          zIndex: Math.round(c.scale * 100),
          opacity: fade(c.scale),
        };
        const face = (
          <span className={styles.drift}>
            <span className={`${styles.face} ${tone(item.color)}`}>
              <Face item={item} />
            </span>
          </span>
        );
        const register = (el: HTMLElement | null) => {
          if (el) nodes.set(c.key, el);
          return () => {
            nodes.delete(c.key);
          };
        };

        if (item.description) {
          return (
            <button
              key={c.key}
              ref={register}
              type="button"
              data-cell={c.key}
              data-item={c.item}
              className={`${styles.bubble} ${styles.clickable}`}
              style={style}
              tabIndex={primary.get(c.item) === c.key ? 0 : -1}
              aria-label={`${item.name}, read more`}
              aria-haspopup="dialog"
              // Pointer taps are handled on pointerup; this is for Enter and Space.
              onClick={(e) => {
                if (e.detail === 0) onOpen(item, e.currentTarget);
              }}
              onFocus={() => onFocusCell(c.q, c.r)}
            >
              {face}
            </button>
          );
        }
        return (
          <span
            key={c.key}
            ref={register}
            data-cell={c.key}
            data-item={c.item}
            className={styles.bubble}
            style={style}
            aria-hidden="true"
          >
            {face}
          </span>
        );
      })}
    </div>
  );
}
