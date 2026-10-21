"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import styles from "./TeamCard.module.css";

export interface TeamCardProps {
  /** URL/path of the default ("top") portrait shown before the trail. */
  topImage: string;
  /** URL/path of the portrait revealed by the trail. */
  bottomImage: string;
  /** Member name displayed in orange. */
  name: string;
  /** Member role/title. Accepts a string or any ReactNode (e.g. with <em>). */
  role?: ReactNode;
  /** Optional class applied to the outermost <article>. */
  className?: string;
  /** Aspect ratio of the card. Defaults to "4 / 5". */
  aspectRatio?: string;
}

// How the reveal trail behaves. These are the numbers of the shader this
// replaces. Every frame the pointer lays "paint" along the line it moved
// (PEAK on the line itself, fading to nothing REACH away, measured in card
// widths and heights). All paint fades by 3% a frame, at 60 frames a second.
// The second portrait shows wherever there is more than THRESHOLD of paint.
const FRAME_MS = 1000 / 60;
const DECAY = 0.97;
const PEAK = 0.3;
const REACH = 0.09;
const THRESHOLD = 0.02;
const EDGE = 0.004; // the edge of the trail fades in over this much paint (less on sharper screens)
const HOLD_MS = 50; // the last move keeps painting this long after the pointer stops
const MIN_MOVE = 0.001; // a shorter move paints nothing
const CELL = 4; // the paint is worked out at the corners of squares this many pixels wide
const TOUCH_SLOP = 8; // a finger must go this far sideways before it paints, so scrolling never does

type Point = { u: number; v: number };

/**
 * Team member card. Moving a mouse or finger across it reveals the second
 * portrait along a fading trail. The first portrait is a normal image (so
 * search engines and screen readers see it). The trail is a small 2D canvas
 * that only does any work while a trail is on screen.
 */
export default function TeamCard({
  topImage,
  bottomImage,
  name,
  role,
  className,
  aspectRatio = "4 / 5",
}: TeamCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Without a second portrait there is nothing to reveal.
  const still = bottomImage === topImage;

  useEffect(() => {
    const card = cardRef.current;
    const canvas = canvasRef.current;
    if (!card || !canvas || still) return;
    const ctx = canvas.getContext("2d");
    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    let photo: HTMLImageElement | null = null;
    let photoReady = false;

    // The size the paint was set up for, in CSS pixels.
    let width = 0;
    let height = 0;
    let cols = 0; // squares across and down; the paint lives at their corners
    let rows = 0;
    let paint = new Float32Array(0);
    let mask: ImageData | null = null;
    let maskBox: [number, number, number, number] | null = null; // pixels of the mask that may not be empty: x0, y0, x1, y1
    let box: [number, number, number, number] | null = null; // corners with paint worth drawing: i0, j0, i1, j1
    let peak = 0;
    let sharp = 1; // device pixels per CSS pixel

    // The pointer since the last frame, as fractions of the card.
    let pending: Point[] = [];
    let last: Point | null = null;
    let hold: Point[] | null = null;
    let lastMoveAt = 0;
    let lastFrameAt = 0;
    let raf = 0;
    // A finger paints only after it has gone sideways (see TOUCH_SLOP).
    let armed = true;
    let downX = 0;
    let downY = 0;

    const setUp = () => {
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      if (w < 1 || h < 1) return false;
      if (w === width && h === height && mask) return true;
      width = w;
      height = h;
      sharp = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * sharp);
      canvas.height = Math.round(h * sharp);
      maskCanvas.width = w;
      maskCanvas.height = h;
      mask = maskCtx.createImageData(w, h);
      maskBox = null;
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      paint = new Float32Array((cols + 1) * (rows + 1));
      box = null;
      peak = 0;
      return true;
    };

    const loadPhoto = () => {
      if (photo) return;
      photo = new window.Image();
      photo.decoding = "async";
      photo.onload = () => {
        photoReady = true;
      };
      photo.src = bottomImage;
    };

    /** One frame of paint: everything fades, then the path walked since the last frame is painted over. */
    const simulate = (steps: number, path: Point[] | null) => {
      const stride = cols + 1;
      const keep = steps === 1 ? DECAY : Math.pow(DECAY, steps);
      const worth = THRESHOLD / 4;
      let i0 = cols + 1;
      let j0 = rows + 1;
      let i1 = -1;
      let j1 = -1;
      peak = 0;
      for (let j = 0, n = 0; j <= rows; j++) {
        for (let i = 0; i <= cols; i++, n++) {
          const value = paint[n] * keep;
          paint[n] = value;
          if (value >= worth) {
            if (value > peak) peak = value;
            if (i < i0) i0 = i;
            if (i > i1) i1 = i;
            if (j < j0) j0 = j;
            if (j > j1) j1 = j;
          }
        }
      }

      if (path && path.length > 1) {
        let length = 0;
        let uMin = path[0].u;
        let uMax = uMin;
        let vMin = path[0].v;
        let vMax = vMin;
        for (let s = 1; s < path.length; s++) {
          length += Math.hypot(path[s].u - path[s - 1].u, path[s].v - path[s - 1].v);
          uMin = Math.min(uMin, path[s].u);
          uMax = Math.max(uMax, path[s].u);
          vMin = Math.min(vMin, path[s].v);
          vMax = Math.max(vMax, path[s].v);
        }
        if (length >= MIN_MOVE) {
          const iFrom = Math.max(0, Math.floor(((uMin - REACH) * width) / CELL));
          const iTo = Math.min(cols, Math.ceil(((uMax + REACH) * width) / CELL));
          const jFrom = Math.max(0, Math.floor(((vMin - REACH) * height) / CELL));
          const jTo = Math.min(rows, Math.ceil(((vMax + REACH) * height) / CELL));
          for (let j = jFrom; j <= jTo; j++) {
            const v = (j * CELL) / height;
            for (let i = iFrom; i <= iTo; i++) {
              const u = (i * CELL) / width;
              // Distance to the nearest part of the path.
              let nearest = Infinity;
              for (let s = 1; s < path.length; s++) {
                const ax = path[s - 1].u;
                const ay = path[s - 1].v;
                const dx = path[s].u - ax;
                const dy = path[s].v - ay;
                const along = dx * dx + dy * dy;
                const t = along > 0 ? Math.min(1, Math.max(0, ((u - ax) * dx + (v - ay) * dy) / along)) : 0;
                const d = Math.hypot(u - (ax + t * dx), v - (ay + t * dy));
                if (d < nearest) nearest = d;
              }
              if (nearest >= REACH) continue;
              const near = 1 - nearest / REACH;
              const n = j * stride + i;
              const value = paint[n] + PEAK * steps * near * near * (3 - 2 * near);
              paint[n] = value;
              if (value >= worth) {
                if (value > peak) peak = value;
                if (i < i0) i0 = i;
                if (i > i1) i1 = i;
                if (j < j0) j0 = j;
                if (j > j1) j1 = j;
              }
            }
          }
        }
      }
      box = i1 >= 0 ? [i0, j0, i1, j1] : null;
    };

    /** Turns the paint into a mask: opaque where the second portrait shows. */
    const drawMask = () => {
      if (!mask) return;
      const data = mask.data;
      // Wipe what the last frame drew.
      if (maskBox) {
        const [x0, y0, x1, y1] = maskBox;
        for (let y = y0; y < y1; y++) data.fill(0, (y * width + x0) * 4, (y * width + x1) * 4);
      }
      let next: [number, number, number, number] | null = null;
      if (box) {
        const stride = cols + 1;
        const soft = EDGE / (window.devicePixelRatio || 1);
        const ciFrom = Math.max(0, box[0] - 1);
        const ciTo = Math.min(cols - 1, box[2]);
        const cjFrom = Math.max(0, box[1] - 1);
        const cjTo = Math.min(rows - 1, box[3]);
        for (let cj = cjFrom; cj <= cjTo; cj++) {
          for (let ci = ciFrom; ci <= ciTo; ci++) {
            const n = cj * stride + ci;
            const a = paint[n];
            const b = paint[n + 1];
            const c = paint[n + stride];
            const d = paint[n + stride + 1];
            const high = Math.max(a, b, c, d);
            if (high < THRESHOLD) continue;
            const low = Math.min(a, b, c, d);
            const px0 = ci * CELL;
            const py0 = cj * CELL;
            const px1 = Math.min(width, px0 + CELL);
            const py1 = Math.min(height, py0 + CELL);
            // Well inside the trail every pixel is opaque; only the squares the edge passes through need working out.
            const solid = low - THRESHOLD >= Math.max(soft, (high - low) * 0.36);
            for (let py = py0; py < py1; py++) {
              const fy = (py + 0.5 - py0) / CELL;
              const left = a + (c - a) * fy;
              const right = b + (d - b) * fy;
              let at = (py * width + px0) * 4 + 3;
              for (let px = px0; px < px1; px++, at += 4) {
                if (solid) {
                  data[at] = 255;
                  continue;
                }
                const fx = (px + 0.5 - px0) / CELL;
                const value = left + (right - left) * fx;
                // The edge is where the paint is THRESHOLD. It fades in over EDGE of paint, or over a whole
                // pixel where the paint changes faster than that, so a sharp edge is not jagged.
                const gx = ((b - a) * (1 - fy) + (d - c) * fy) / CELL;
                const gy = ((c - a) * (1 - fx) + (d - b) * fx) / CELL;
                const span = Math.max(soft, Math.sqrt(gx * gx + gy * gy));
                const t = Math.min(1, Math.max(0, (value - THRESHOLD) / span));
                data[at] = t * t * (3 - 2 * t) * 255;
              }
            }
            if (!next) next = [px0, py0, px1, py1];
            else {
              next[0] = Math.min(next[0], px0);
              next[1] = Math.min(next[1], py0);
              next[2] = Math.max(next[2], px1);
              next[3] = Math.max(next[3], py1);
            }
          }
        }
      }
      const dirty = maskBox && next
        ? [Math.min(maskBox[0], next[0]), Math.min(maskBox[1], next[1]), Math.max(maskBox[2], next[2]), Math.max(maskBox[3], next[3])]
        : maskBox ?? next;
      if (dirty) maskCtx.putImageData(mask, 0, 0, dirty[0], dirty[1], dirty[2] - dirty[0], dirty[3] - dirty[1]);
      maskBox = next;
    };

    /** The second portrait (cropped to fill, like the first), kept only where the mask is opaque. */
    const drawTrail = () => {
      if (!photo || !photoReady) return;
      drawMask();
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.max(canvas.width / photo.naturalWidth, canvas.height / photo.naturalHeight);
      const w = photo.naturalWidth * scale;
      const h = photo.naturalHeight * scale;
      ctx.drawImage(photo, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    };

    const clearTrail = () => {
      paint.fill(0);
      box = null;
      peak = 0;
      drawMask();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const frame = (now: number) => {
      raf = 0;
      const steps = lastFrameAt ? Math.min(4, Math.max(0.25, (now - lastFrameAt) / FRAME_MS)) : 1;
      lastFrameAt = now;

      // Walked since the last frame, or (for a moment after the last move) the same path again.
      let path: Point[] | null = null;
      if (pending.length > 0) {
        path = last ? [last, ...pending] : pending;
        last = pending[pending.length - 1];
        pending = [];
        hold = path;
      } else if (hold && now - lastMoveAt <= HOLD_MS) {
        path = hold;
      } else {
        hold = null;
      }

      simulate(steps, path);
      if (peak >= THRESHOLD || path) {
        drawTrail();
        raf = requestAnimationFrame(frame);
      } else {
        clearTrail();
        lastFrameAt = 0;
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      last = null;
      pending = [];
      hold = null;
    };

    const onMove = (event: PointerEvent) => {
      if (!photoReady) {
        loadPhoto();
        return;
      }
      if (!armed) {
        const across = event.clientX - downX;
        if (Math.abs(across) < TOUCH_SLOP || Math.abs(across) < Math.abs(event.clientY - downY)) return;
        armed = true;
        last = null;
      }
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const u = (event.clientX - rect.left) / rect.width;
      const v = (event.clientY - rect.top) / rect.height;
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        stop();
        return;
      }
      if (!setUp()) return;
      pending.push({ u, v });
      lastMoveAt = performance.now();
      start();
    };
    const onDown = (event: PointerEvent) => {
      last = null;
      armed = event.pointerType !== "touch";
      downX = event.clientX;
      downY = event.clientY;
    };
    const onEnd = () => {
      last = null;
      armed = true;
    };

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointerleave", stop);
    card.addEventListener("pointerup", onEnd);
    card.addEventListener("pointercancel", onEnd);

    // Fetch the second portrait shortly before the card is reached, so the first touch already has it.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadPhoto();
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(card);

    // A card that changes size starts its trail afresh.
    const ro = new ResizeObserver(() => {
      if (card.offsetWidth !== width || card.offsetHeight !== height) {
        mask = null;
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
          stop();
          lastFrameAt = 0;
          if (setUp()) clearTrail();
        }
      }
    });
    ro.observe(card);

    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointerleave", stop);
      card.removeEventListener("pointerup", onEnd);
      card.removeEventListener("pointercancel", onEnd);
      io.disconnect();
      ro.disconnect();
      if (photo) photo.onload = null;
    };
  }, [bottomImage, still]);

  return (
    <article
      ref={cardRef}
      className={[styles.card, className].filter(Boolean).join(" ")}
      style={{ aspectRatio }}
      data-still={still ? "" : undefined}
    >
      <div className={styles.canvasWrap}>
        <Image className={styles.photo} src={topImage} alt={name} fill sizes="(max-width: 640px) 92vw, 480px" />
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{name}</h3>
        {role && <p className={styles.role}>{role}</p>}
      </div>
    </article>
  );
}
