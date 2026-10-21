"use client";

import { useEffect } from "react";

// Makes the glass (the glass mixins in _mixins.scss) feel alive:
//
// Every glass element is marked data-glass: "" (bars, buttons: lens),
// "top" (a bar along the bottom of the screen: lens on its top edge only),
// "frost" (big panels such as the menu drawer and the pop-up: no lens, so
// their own text reads easily) or "flat" (cards without blur: no lens).
//
// 1. Light. On a computer the bright highlight on every glass edge turns
//    towards the mouse (--lg-ox and --lg-oy), eased so it glides. They are
//    set on the glass elements themselves, not the page root: changing them
//    on the root would make the browser restyle the whole page every frame.
// 2. Touch. Pressing an element marked data-glass lights it up from the point
//    that was pressed (--lg-px and --lg-py on the element; the mixins draw it).
// 3. Lens. In Chrome and Edge the page behind an element marked data-glass is
//    bent near its edges, like the rim of a lens, with an SVG displacement map
//    made for that element's size and corners. Safari and Firefox would drop
//    the whole backdrop blur if given one, so they keep the blur only. People
//    who ask for less transparency, and small devices, keep the blur only.
//    Only for data-glass "" and "top".

// How far in from the edge the bending reaches: a third of the element's
// smaller side, between these limits (px).
const BEZEL_MIN = 12;
const BEZEL_MAX = 30;
const STRENGTH = 64; // displacement scale: the furthest bend (at the rim) is half of this, in px
// With the lens the glass is clearer, as on iOS: the blur drops to a third
// (at most this much), so the bending can be seen. Without the lens the
// stronger frost stays.
const LENS_BLUR_MAX = 7;

type Lens = { id: string; base: string; key: string };

function radiusOf(el: HTMLElement, w: number, h: number) {
  const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return Math.min(r, w / 2, h / 2);
}

/** A displacement map: red and green say how far to shift sideways and up/down (128 is no shift). */
function makeMap(w: number, h: number, r: number, topOnly: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const bezel = Math.min(Math.max(BEZEL_MIN, Math.min(w, h) / 3), BEZEL_MAX, h / 2, w / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let d: number;
      let nx = 0;
      let ny = 0;
      if (topOnly) {
        d = py;
        ny = -1;
      } else {
        // Distance to the rounded edge, and the direction out of the shape.
        const cx = Math.min(Math.max(px, r), w - r);
        const cy = Math.min(Math.max(py, r), h - r);
        const dx = px - cx;
        const dy = py - cy;
        const out = Math.hypot(dx, dy);
        if (out > 0) {
          d = r - out;
          nx = dx / out;
          ny = dy / out;
        } else {
          const left = px;
          const right = w - px;
          const top = py;
          const bottom = h - py;
          d = Math.min(left, right, top, bottom);
          if (d === left) nx = -1;
          else if (d === right) nx = 1;
          else if (d === top) ny = -1;
          else ny = 1;
        }
      }
      const i = (y * w + x) * 4;
      let m = 0;
      if (d < bezel && d >= 0) {
        const t = 1 - d / bezel;
        m = t * t;
      }
      // Sample from further inside: the edge shows what is just within it, bent.
      data[i] = 128 - Math.round(127 * nx * m);
      data[i + 1] = 128 - Math.round(127 * ny * m);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function LiquidGlass() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    // The glass elements on the page (refreshed when the page changes).
    let glassEls: HTMLElement[] = [];
    let listRaf = 0;
    const refreshList = () => {
      listRaf = 0;
      glassEls = Array.from(document.querySelectorAll<HTMLElement>("[data-glass]"));
    };
    refreshList();
    const listObserver = new MutationObserver(() => {
      if (!listRaf) listRaf = requestAnimationFrame(refreshList);
    });
    listObserver.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      listObserver.disconnect();
      cancelAnimationFrame(listRaf);
    });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // 1. Light that follows the mouse: --lg-ox and --lg-oy say which way the
    // highlight sits on every glass edge (the side facing the mouse).
    if (window.matchMedia("(pointer: fine)").matches && !reduceMotion.matches) {
      let x = -0.45;
      let y = -0.9;
      let tx = x;
      let ty = y;
      let raf = 0;
      const step = () => {
        raf = 0;
        x += (tx - x) * 0.16;
        y += (ty - y) * 0.16;
        const len = Math.hypot(x, y) || 1;
        const ox = (-x / len).toFixed(3);
        const oy = (-y / len).toFixed(3);
        for (const el of glassEls) {
          el.style.setProperty("--lg-ox", ox);
          el.style.setProperty("--lg-oy", oy);
        }
        if (Math.abs(tx - x) + Math.abs(ty - y) > 0.004) raf = requestAnimationFrame(step);
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const dx = e.clientX - window.innerWidth / 2;
        const dy = e.clientY - window.innerHeight / 2;
        const len = Math.hypot(dx, dy);
        if (len < 8) return;
        tx = dx / len;
        ty = dy / len;
        if (!raf) raf = requestAnimationFrame(step);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => {
        window.removeEventListener("pointermove", onMove);
        cancelAnimationFrame(raf);
        for (const el of glassEls) {
          el.style.removeProperty("--lg-ox");
          el.style.removeProperty("--lg-oy");
        }
      });
    }

    // 2. Light from the point that was pressed.
    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-glass]");
      if (!el) return;
      const box = el.getBoundingClientRect();
      el.style.setProperty("--lg-px", `${(e.clientX - box.left).toFixed(0)}px`);
      el.style.setProperty("--lg-py", `${(e.clientY - box.top).toFixed(0)}px`);
    };
    document.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    cleanups.push(() => document.removeEventListener("pointerdown", onDown, { capture: true }));

    // 3. The lens, in Chromium browsers only (see the note at the top).
    const nav = navigator as Navigator & { userAgentData?: unknown; deviceMemory?: number };
    const chromium = "userAgentData" in nav;
    const lessGlass = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
    const small = (nav.hardwareConcurrency || 8) < 4 || (nav.deviceMemory || 8) < 4;
    if (chromium && !lessGlass && !small) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.style.position = "absolute";
      svg.style.pointerEvents = "none";
      document.body.appendChild(svg);

      const lenses = new Map<HTMLElement, Lens>();
      let count = 0;
      const update = (el: HTMLElement) => {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w < 8 || h < 8) return;
        const kind = el.dataset.glass;
        if (kind !== "" && kind !== "top") return; // frosted panels and flat cards: no lens
        const topOnly = kind === "top";
        const r = topOnly ? 0 : radiusOf(el, w, h);
        const key = `${w}x${h}x${Math.round(r)}${topOnly ? "t" : ""}`;
        const lens = lenses.get(el);
        if (lens && lens.key === key) return;
        const base =
          lens?.base ?? (getComputedStyle(el).backdropFilter || "none");
        if (base === "none") return; // no blur here (for example a card): nothing to bend
        const map = makeMap(w, h, r, topOnly);
        if (!map) return;
        const id = lens?.id ?? `lg-lens-${++count}`;
        let filter = svg.querySelector<SVGFilterElement>(`#${id}`);
        if (!filter) {
          filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
          filter.id = id;
          filter.setAttribute("x", "0");
          filter.setAttribute("y", "0");
          filter.setAttribute("width", "100%");
          filter.setAttribute("height", "100%");
          filter.setAttribute("color-interpolation-filters", "sRGB");
          svg.appendChild(filter);
        }
        filter.innerHTML =
          `<feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="map" scale="${STRENGTH}" xChannelSelector="R" yChannelSelector="G"/>`;
        const clearer = base.replace(/blur\(([\d.]+)px\)/, (_, px: string) =>
          `blur(${Math.min(LENS_BLUR_MAX, Math.max(3, Math.round(parseFloat(px) / 3)))}px)`,
        );
        el.style.setProperty("backdrop-filter", `url(#${id}) ${clearer}`);
        el.dataset.lens = "";
        lenses.set(el, { id, base, key });
      };

      let timer = 0;
      const pending = new Set<HTMLElement>();
      const later = (el: HTMLElement) => {
        pending.add(el);
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          pending.forEach(update);
          pending.clear();
        }, 120);
      };
      const ro = new ResizeObserver((entries) => entries.forEach((e) => later(e.target as HTMLElement)));
      const watch = () => {
        document.querySelectorAll<HTMLElement>("[data-glass]").forEach((el) => {
          if (el.dataset.glassWatched) return;
          el.dataset.glassWatched = "";
          ro.observe(el);
          later(el);
        });
      };
      watch();
      const mo = new MutationObserver(watch);
      mo.observe(document.body, { childList: true, subtree: true });
      cleanups.push(() => {
        mo.disconnect();
        ro.disconnect();
        window.clearTimeout(timer);
        lenses.forEach((_, el) => {
          el.style.removeProperty("backdrop-filter");
          delete el.dataset.glassWatched;
          delete el.dataset.lens;
        });
        svg.remove();
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
