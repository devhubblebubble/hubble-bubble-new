"use client";

import { useEffect, useRef } from "react";

// The universe behind every page: a cloud of stars in 3D with the camera
// inside it, like the old site's home page (300 glowing dots orbiting on a
// canvas, the view following the finger). Near stars are big and bright, far
// ones small and faint. The whole field swings round with the finger or the
// mouse (an orbit of up to about 45 degrees across the screen), stars near a
// touch are nudged aside and spring back, scrolling turns the field slowly,
// the cloud itself keeps turning and every star drifts a little on its own.
//
// Kept light: a plain 2D canvas, each star is one copy of a pre-drawn glow,
// about 400 stars on a phone and 650 on a desktop (fewer on weak devices,
// and fewer still if drawing stays slow), no touch handling on the canvas
// itself (the page scrolls and taps as before; the universe only listens),
// nothing moves for people who ask for reduced motion, and the loop stops
// while the tab is hidden.

/** The cloud's radius. */
const CLOUD = 1.6;
/** The camera sits this far from the cloud's middle, inside it. */
const CAMERA = 0.6;
/** Nothing nearer than this (in front of the camera) is drawn. */
const NEAR = 0.1;
/** How far a finger at the screen edge swings the view, in radians. */
const SWING_X = 0.8;
const SWING_Y = 0.55;
/** The cloud's own slow turn, radians a second. */
const SPIN = 0.045;
/** Radians of turn per scrolled pixel. */
const SCROLL_TURN = 0.00035;

const TINTS = ["255,255,255", "190,240,225", "255,205,170"];

function makeGlow(tint: string): HTMLCanvasElement {
  const s = 64;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const g = cv.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  // A solid bright core with a soft halo, so even a 4px star reads as a dot.
  grad.addColorStop(0, `rgba(${tint},1)`);
  grad.addColorStop(0.36, `rgba(${tint},0.96)`);
  grad.addColorStop(0.52, `rgba(${tint},0.45)`);
  grad.addColorStop(0.74, `rgba(${tint},0.12)`);
  grad.addColorStop(1, `rgba(${tint},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return cv;
}

/** How many stars this screen gets: by area, fewer on weak devices. */
function budget(w: number, h: number) {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return Math.round(Math.min(650, Math.max(380, (w * h) / 800)) * (weak ? 0.7 : 1));
}

export default function Universe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const glows = TINTS.map(makeGlow);

    let w = 0;
    let h = 0;
    let focal = 1;
    let sizeScale = 1;
    let count = 0;

    // Per star: resting place in the cloud, the small path it drifts on
    // (amplitude, three speeds, three phases), size, tint, twinkle phase, and
    // the nudge it has taken on screen with its speed.
    let PX: Float32Array, PY: Float32Array, PZ: Float32Array;
    let AMP: Float32Array, F1: Float32Array, F2: Float32Array, F3: Float32Array;
    let PH1: Float32Array, PH2: Float32Array, PH3: Float32Array;
    let SIZE: Float32Array, TINT: Uint8Array, TW: Float32Array;
    let OX: Float32Array, OY: Float32Array, VX: Float32Array, VY: Float32Array;

    const allocate = (n: number) => {
      count = n;
      canvas.dataset.particles = String(n);
      PX = new Float32Array(n);
      PY = new Float32Array(n);
      PZ = new Float32Array(n);
      AMP = new Float32Array(n);
      F1 = new Float32Array(n);
      F2 = new Float32Array(n);
      F3 = new Float32Array(n);
      PH1 = new Float32Array(n);
      PH2 = new Float32Array(n);
      PH3 = new Float32Array(n);
      SIZE = new Float32Array(n);
      TINT = new Uint8Array(n);
      TW = new Float32Array(n);
      OX = new Float32Array(n);
      OY = new Float32Array(n);
      VX = new Float32Array(n);
      VY = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        // Evenly through the ball.
        const u = Math.random() * 2 - 1;
        const t = Math.random() * Math.PI * 2;
        const r = CLOUD * Math.cbrt(Math.random());
        const s = Math.sqrt(1 - u * u);
        PX[i] = r * s * Math.cos(t);
        PY[i] = r * s * Math.sin(t);
        PZ[i] = r * u;
        AMP[i] = (0.02 + Math.random() * 0.05) * CLOUD;
        F1[i] = 0.05 + Math.random() * 0.15;
        F2[i] = 0.05 + Math.random() * 0.15;
        F3[i] = 0.05 + Math.random() * 0.15;
        PH1[i] = Math.random() * 6.283;
        PH2[i] = Math.random() * 6.283;
        PH3[i] = Math.random() * 6.283;
        // Radius in pixels when the star is as far away as the cloud's middle:
        // mostly small stars, a few bright ones.
        const k = Math.random();
        SIZE[i] = k < 0.7 ? 1.5 + Math.random() * 1 : k < 0.94 ? 2.5 + Math.random() * 1.5 : 4 + Math.random() * 3;
        const c = Math.random();
        TINT[i] = c < 0.86 ? 0 : c < 0.95 ? 1 : 2;
        TW[i] = Math.random() * 6.283;
        OX[i] = OY[i] = VX[i] = VY[i] = 0;
      }
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // A wide view: the far side of the cloud just fills the screen's width.
      focal = w * 0.55;
      sizeScale = Math.min(1.6, Math.max(0.8, Math.min(w, h) / 500));
      // Only a real change of screen (not a phone toolbar sliding away) refills the field.
      const n = budget(w, h);
      if (!count || Math.abs(n - count) / count > 0.2) allocate(n);
    };
    resize();

    // Where the view is turned to, and where the finger, mouse, tilt or scroll want it.
    const view = { yaw: 0, pitch: 0, yawT: 0, pitchT: 0, spin: 0 };
    const touch = { x: -1e4, y: -1e4, strength: 0, lastAt: -1e4 };
    let scrollLast = window.scrollY;
    let scrollTurn = 0;
    let hidden = document.visibilityState === "hidden";
    let raf = 0;
    let last = performance.now();
    let frameMs = 4;
    let slowSince = 0;
    let statsAt = 0;
    let streak: { x: number; y: number; vx: number; vy: number; t: number } | null = null;
    let nextStreak = 5 + Math.random() * 8;

    const aim = (px: number, py: number) => {
      view.yawT = -((px - w / 2) / (w / 2)) * SWING_X;
      view.pitchT = ((py - h / 2) / (h / 2)) * SWING_Y;
    };
    const poke = (e: PointerEvent, strength: number) => {
      touch.x = e.clientX;
      touch.y = e.clientY;
      touch.strength = strength;
      touch.lastAt = performance.now();
      aim(e.clientX, e.clientY);
    };
    const onPointerMove = (e: PointerEvent) => {
      // A finger only counts while it is down; the mouse always does.
      if (e.pointerType === "touch" && e.buttons === 0) return;
      poke(e, 1);
    };
    const onPointerDown = (e: PointerEvent) => poke(e, 1.8);
    const onPointerEnd = () => {
      touch.strength = 0;
    };
    // Tilting the phone turns the view, where the browser allows it without a prompt.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      if (performance.now() - touch.lastAt < 1500) return;
      const gx = Math.max(-30, Math.min(30, e.gamma)) / 30;
      const gy = Math.max(-30, Math.min(30, e.beta - 40)) / 30;
      view.yawT = -gx * SWING_X * 0.6;
      view.pitchT = gy * SWING_Y * 0.6;
    };
    const onVisibility = () => {
      hidden = document.visibilityState === "hidden";
      if (!hidden && !raf && !reduceMotion.matches) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const drawStreak = (dt: number) => {
      if (!streak) return;
      streak.t += dt;
      const life = 0.7;
      if (streak.t > life) {
        streak = null;
        return;
      }
      const k = streak.t / life;
      const x = streak.x + streak.vx * streak.t;
      const y = streak.y + streak.vy * streak.t;
      const len = 110;
      const n = Math.hypot(streak.vx, streak.vy);
      const nx = streak.vx / n;
      const ny = streak.vy / n;
      const grad = ctx.createLinearGradient(x - nx * len, y - ny * len, x, y);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(1, `rgba(255,255,255,${0.9 * Math.sin(Math.PI * k)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - nx * len, y - ny * len);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const render = (dt: number, still: boolean) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);

      // The view eases towards where it is wanted.
      const ease = 1 - Math.exp(-dt * 7);
      view.yaw += (view.yawT - view.yaw) * ease;
      view.pitch += (view.pitchT - view.pitch) * ease;
      if (!still) view.spin += SPIN * dt;

      // Scrolling turns the field.
      const sy = window.scrollY;
      scrollTurn += (sy - scrollLast) * SCROLL_TURN;
      scrollLast = sy;

      const yaw = view.yaw + view.spin;
      const pitch = view.pitch + scrollTurn;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const time = performance.now() * 0.001;
      const cx = w / 2;
      const cy = h / 2;
      const pushR = Math.min(w, h) * 0.3;
      const touching = touch.strength > 0.01;
      if (touching) touch.strength *= 1 - Math.min(1, dt * 1.6);
      const damp = Math.exp(-dt * 3.4);

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < count; i++) {
        // Where the star is right now: its resting place plus its own slow drift.
        const a = AMP[i];
        const x0 = PX[i] + a * Math.sin(time * F1[i] + PH1[i]);
        const y0 = PY[i] + a * Math.sin(time * F2[i] + PH2[i]);
        const z0 = PZ[i] + a * Math.cos(time * F3[i] + PH3[i]);
        // Turn the cloud (yaw about the vertical axis, then pitch), then look from the camera.
        const x1 = x0 * cosY + z0 * sinY;
        const z1 = -x0 * sinY + z0 * cosY;
        const y2 = y0 * cosP - z1 * sinP;
        const z2 = y0 * sinP + z1 * cosP;
        const depth = z2 + CAMERA;
        if (depth < NEAR) continue;

        const scale = focal / depth;
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        // A finger or the mouse nudges nearby stars aside; nearer ones more.
        if (touching) {
          const dx = px + OX[i] - touch.x;
          const dy = py + OY[i] - touch.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < pushR) {
            const f = ((1 - d / pushR) * touch.strength * 700 * dt) / (0.4 + depth);
            VX[i] += (dx / d) * f;
            VY[i] += (dy / d) * f;
          }
        }
        VX[i] = (VX[i] - OX[i] * 7 * dt) * damp;
        VY[i] = (VY[i] - OY[i] * 7 * dt) * damp;
        OX[i] += VX[i] * dt;
        OY[i] += VY[i] * dt;

        const sx = px + OX[i];
        const syy = py + OY[i];
        const r = (SIZE[i] * sizeScale * CAMERA) / depth;
        if (sx < -r * 3 || sx > w + r * 3 || syy < -r * 3 || syy > h + r * 3) continue;

        // Bright when near, faint when far; a gentle twinkle; fade just before the camera.
        const nearness = Math.min(1, CAMERA / depth);
        let alpha = 0.55 + 0.45 * nearness * nearness;
        alpha *= 0.82 + 0.18 * Math.sin(time * 1.7 + TW[i]);
        if (depth < NEAR + 0.15) alpha *= (depth - NEAR) / 0.15;
        ctx.globalAlpha = Math.min(1, alpha);

        // Never smaller than 4px: a 1px dot drawn between pixels all but vanishes.
        const d = Math.max(4, Math.min(48, r * 2.4));
        ctx.drawImage(glows[TINT[i]], sx - d / 2, syy - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // Now and then a shooting star.
      if (!still) {
        nextStreak -= dt;
        if (nextStreak <= 0 && !streak) {
          const angle = Math.PI * (0.12 + Math.random() * 0.3);
          const speed = 1000 + Math.random() * 600;
          streak = {
            x: Math.random() * w * 0.8,
            y: Math.random() * h * 0.45,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            t: 0,
          };
          nextStreak = 7 + Math.random() * 10;
        }
        drawStreak(dt);
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t0 = performance.now();
      render(dt, false);
      // If drawing stays slow for two seconds, draw fewer stars.
      frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
      if (now - statsAt > 1000) {
        statsAt = now;
        canvas.dataset.ms = frameMs.toFixed(1);
      }
      if (frameMs > 9) {
        if (!slowSince) slowSince = now;
        else if (now - slowSince > 2000 && count > 90) {
          allocate(Math.round(count * 0.75));
          slowSince = 0;
          frameMs = 4;
        }
      } else {
        slowSince = 0;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion.matches) {
        render(0, true);
        return;
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const onMotionPreference = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      start();
    };
    const onResize = () => {
      resize();
      if (reduceMotion.matches) render(0, true);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerEnd, { passive: true });
    window.addEventListener("pointercancel", onPointerEnd, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    reduceMotion.addEventListener("change", onMotionPreference);
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: unknown } | undefined;
    const needsTiltPermission = typeof DOE?.requestPermission === "function";
    if (!needsTiltPermission) window.addEventListener("deviceorientation", onTilt, { passive: true });
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMotion.removeEventListener("change", onMotionPreference);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
