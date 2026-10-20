"use client";

import { useEffect, useRef } from "react";

// The universe behind every page: stars and glassy bubbles at different
// depths, slowly flying past. The view tilts with the finger or mouse, bubbles
// are pushed aside where the page is touched, and scrolling flies the camera
// forward. The old site had 300 glowing dots orbiting in 3D on a canvas; this
// keeps that idea and stays light:
//
// - plain 2D canvas, no WebGL; glows are pre-drawn sprites, not per-frame
//   gradients;
// - the number of particles follows the screen size (about 165 on a phone,
//   340 on a desktop), is lower on weak devices, and drops by itself when the
//   frames get slow;
// - the canvas never takes touches (pointer-events: none), so the page scrolls
//   and taps exactly as before; the universe only listens;
// - nothing moves for people who ask their device for reduced motion, and
//   the loop stops while the tab is hidden.

const MINT = [120, 225, 197] as const;
const ORANGE = [255, 140, 80] as const;
const WHITE = [255, 255, 255] as const;

// Depth range (the camera looks down +z from z = 0; the unit is the focal length).
const Z_NEAR = 0.4;
const Z_FAR = 3.2;
// Forward speed in depth units per second, and how far one screen of scrolling flies.
const DRIFT = 0.09;
const SCROLL_FLY = 0.00035;

type Sprites = { glow: HTMLCanvasElement[]; bubble: HTMLCanvasElement[] };

function makeSprites(): Sprites {
  const tints = [WHITE, MINT, ORANGE];
  const glow = tints.map((c) => {
    const s = 64;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d")!;
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},1)`);
    grad.addColorStop(0.25, `rgba(${c[0]},${c[1]},${c[2]},0.55)`);
    grad.addColorStop(0.6, `rgba(${c[0]},${c[1]},${c[2]},0.12)`);
    grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return cv;
  });
  // A glass bubble: faint body, brighter rim, a highlight at the top left.
  const bubble = tints.map((c) => {
    const s = 96;
    const r = s / 2;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d")!;
    const body = g.createRadialGradient(r, r, r * 0.2, r, r, r);
    body.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.05)`);
    body.addColorStop(0.72, `rgba(${c[0]},${c[1]},${c[2]},0.09)`);
    body.addColorStop(0.9, `rgba(${c[0]},${c[1]},${c[2]},0.42)`);
    body.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.fillStyle = body;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    const shine = g.createRadialGradient(r * 0.68, r * 0.62, 0, r * 0.68, r * 0.62, r * 0.5);
    shine.addColorStop(0, "rgba(255,255,255,0.75)");
    shine.addColorStop(0.35, "rgba(255,255,255,0.18)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = shine;
    g.fillRect(0, 0, s, s);
    return cv;
  });
  return { glow, bubble };
}

/** How many particles this screen gets: by area, fewer on weak devices. */
function budget(w: number, h: number) {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  const n = Math.round(Math.min(340, Math.max(110, (w * h) / 2000)) * (weak ? 0.7 : 1));
  return n;
}

export default function Universe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sprites = makeSprites();

    let w = 0;
    let h = 0;
    let dpr = 1;
    let focal = 1;
    let count = 0;

    // Per particle: world position, the push it has taken (screen px) and its
    // speed, size, kind (0 dust, 1 spark, 2 bubble), tint and age.
    let X: Float32Array, Y: Float32Array, Z: Float32Array;
    let OX: Float32Array, OY: Float32Array, VX: Float32Array, VY: Float32Array;
    let SIZE: Float32Array, KIND: Uint8Array, TINT: Uint8Array, AGE: Float32Array, SPIN: Float32Array;

    const spawn = (i: number, z: number, fresh: boolean) => {
      // Somewhere on screen at this depth (a little beyond the edges).
      const hx = ((w / 2) / focal) * z * 1.06;
      const hy = ((h / 2) / focal) * z * 1.06;
      X[i] = (Math.random() * 2 - 1) * hx;
      Y[i] = (Math.random() * 2 - 1) * hy;
      Z[i] = z;
      OX[i] = OY[i] = VX[i] = VY[i] = 0;
      AGE[i] = fresh ? 0 : 5;
      SPIN[i] = Math.random() * Math.PI * 2;
      const r = Math.random();
      if (r < 0.55) {
        KIND[i] = 0;
        SIZE[i] = 0.002 + Math.random() * 0.0025;
      } else if (r < 0.91) {
        KIND[i] = 1;
        SIZE[i] = 0.006 + Math.random() * 0.008;
      } else {
        KIND[i] = 2;
        SIZE[i] = 0.02 + Math.random() * 0.03;
      }
      const t = Math.random();
      TINT[i] = t < 0.8 ? 0 : t < 0.93 ? 1 : 2;
    };

    const allocate = (n: number) => {
      count = n;
      canvas.dataset.particles = String(n);
      X = new Float32Array(n);
      Y = new Float32Array(n);
      Z = new Float32Array(n);
      OX = new Float32Array(n);
      OY = new Float32Array(n);
      VX = new Float32Array(n);
      VY = new Float32Array(n);
      SIZE = new Float32Array(n);
      KIND = new Uint8Array(n);
      TINT = new Uint8Array(n);
      AGE = new Float32Array(n);
      SPIN = new Float32Array(n);
      for (let i = 0; i < n; i++) spawn(i, Z_NEAR + Math.random() * (Z_FAR - Z_NEAR), false);
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      focal = Math.max(w, h) * 0.6;
      // Only a real change of screen (not a phone toolbar sliding away) refills the field.
      const n = budget(w, h);
      if (!count || Math.abs(n - count) / count > 0.2) allocate(n);
    };
    resize();

    // The camera: where it is, where the pointer or tilt wants it.
    const cam = { x: 0, y: 0, tx: 0, ty: 0, z: 0 };
    // The last touch or mouse position (screen px) and how fresh it is.
    const touch = { x: -1e4, y: -1e4, strength: 0, isTouch: false, lastAt: -1e4 };
    let scrollLast = window.scrollY;
    let scrollVel = 0;
    let hidden = document.visibilityState === "hidden";
    let raf = 0;
    let last = performance.now();
    let frameMs = 16;
    let slowSince = 0;
    let statsAt = 0;
    let streak: { x: number; y: number; vx: number; vy: number; t: number } | null = null;
    let nextStreak = 6 + Math.random() * 8;

    const aim = (px: number, py: number) => {
      cam.tx = ((px - w / 2) / (w / 2)) * 0.045;
      cam.ty = ((py - h / 2) / (h / 2)) * 0.035;
    };

    const onPointerMove = (e: PointerEvent) => {
      const isTouch = e.pointerType === "touch";
      if (!isTouch || e.buttons > 0 || e.pressure > 0) {
        touch.x = e.clientX;
        touch.y = e.clientY;
        touch.strength = 1;
        touch.isTouch = isTouch;
        touch.lastAt = performance.now();
        aim(e.clientX, e.clientY);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      touch.x = e.clientX;
      touch.y = e.clientY;
      touch.strength = 1.6;
      touch.isTouch = e.pointerType === "touch";
      touch.lastAt = performance.now();
      aim(e.clientX, e.clientY);
    };
    const onPointerEnd = () => {
      touch.strength = 0;
    };
    // Tilting the phone tilts the view, where the browser allows it without a prompt.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      if (performance.now() - touch.lastAt < 1500) return;
      const gx = Math.max(-30, Math.min(30, e.gamma)) / 30;
      const gy = Math.max(-30, Math.min(30, e.beta - 40)) / 30;
      cam.tx = gx * 0.04;
      cam.ty = gy * 0.03;
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
      const len = 90;
      const nx = streak.vx / Math.hypot(streak.vx, streak.vy);
      const ny = streak.vy / Math.hypot(streak.vx, streak.vy);
      const grad = ctx.createLinearGradient(x - nx * len, y - ny * len, x, y);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(1, `rgba(255,255,255,${0.9 * Math.sin(Math.PI * k)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - nx * len, y - ny * len);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const render = (dt: number, still: boolean) => {
      ctx.clearRect(0, 0, w, h);

      // Camera follows the pointer; after a touch ends it drifts back to the middle.
      if (touch.isTouch && performance.now() - touch.lastAt > 400) {
        cam.tx *= 1 - Math.min(1, dt * 0.8);
        cam.ty *= 1 - Math.min(1, dt * 0.8);
      }
      const ease = 1 - Math.exp(-dt * 3);
      cam.x += (cam.tx - cam.x) * ease;
      cam.y += (cam.ty - cam.y) * ease;

      // Scrolling flies the camera forward (down) or back (up).
      const sy = window.scrollY;
      scrollVel = (sy - scrollLast) * SCROLL_FLY;
      scrollLast = sy;
      const advance = still ? 0 : DRIFT * dt + scrollVel;

      const time = performance.now() * 0.001;
      const cx = w / 2;
      const cy = h / 2;
      const pushR = Math.min(w, h) * 0.32;
      const touching = touch.strength > 0.01;
      if (touching) touch.strength *= 1 - Math.min(1, dt * 1.8);

      for (let i = 0; i < count; i++) {
        let z = Z[i] - advance;
        AGE[i] += dt;
        if (z < Z_NEAR) {
          spawn(i, Z_FAR, true);
          z = Z_FAR;
        } else if (z > Z_FAR) {
          spawn(i, Z_NEAR + 0.05, true);
          z = Z_NEAR + 0.05;
        }
        Z[i] = z;

        const scale = focal / z;
        // A slow personal sway so the field never looks frozen.
        const sway = KIND[i] === 0 ? 0 : 0.004 * z;
        const px = cx + (X[i] - cam.x + Math.sin(time * 0.35 + SPIN[i]) * sway) * scale;
        const py = cy + (Y[i] - cam.y + Math.cos(time * 0.29 + SPIN[i]) * sway) * scale;

        // A finger or the mouse pushes nearby particles away; nearer ones more.
        if (touching) {
          const dx = px + OX[i] - touch.x;
          const dy = py + OY[i] - touch.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < pushR) {
            const f = ((1 - d / pushR) * touch.strength * 520 * dt) / Math.sqrt(z);
            VX[i] += (dx / d) * f;
            VY[i] += (dy / d) * f;
          }
        }
        // Spring back, with damping.
        VX[i] += -OX[i] * 6 * dt;
        VY[i] += -OY[i] * 6 * dt;
        const damp = Math.exp(-dt * 3.2);
        VX[i] *= damp;
        VY[i] *= damp;
        OX[i] += VX[i] * dt;
        OY[i] += VY[i] * dt;

        const sx = px + OX[i];
        const sy2 = py + OY[i];
        const r = SIZE[i] * scale;
        if (sx < -r * 2 || sx > w + r * 2 || sy2 < -r * 2 || sy2 > h + r * 2) {
          // Off the edge: it will only come back if it respawns.
          if (z < Z_FAR * 0.6) {
            spawn(i, Z_FAR, true);
          }
          continue;
        }

        // Dim far away, fade in when new, fade out just before passing the camera.
        const depth = 1 - (z - Z_NEAR) / (Z_FAR - Z_NEAR);
        let a = 0.35 + 0.65 * depth;
        a *= Math.min(1, AGE[i] * 0.8);
        if (z < Z_NEAR + 0.35) a *= (z - Z_NEAR) / 0.35;
        const kind = KIND[i];
        if (kind === 0) {
          const tw = 0.75 + 0.25 * Math.sin(time * 2.1 + SPIN[i] * 7);
          ctx.globalAlpha = Math.min(1, a * tw);
          ctx.fillStyle = TINT[i] === 1 ? "rgb(170,235,220)" : "#fff";
          const d = Math.max(1, Math.min(3, r * 1.7));
          ctx.fillRect(sx - d / 2, sy2 - d / 2, d, d);
        } else if (kind === 1) {
          const d = Math.max(3, Math.min(26, r * 2.2));
          ctx.globalAlpha = Math.min(1, a * 0.9);
          ctx.drawImage(sprites.glow[TINT[i]], sx - d / 2, sy2 - d / 2, d, d);
        } else {
          const d = Math.max(10, Math.min(110, r * 2));
          ctx.globalAlpha = Math.min(1, a * 0.95);
          ctx.drawImage(sprites.bubble[TINT[i]], sx - d / 2, sy2 - d / 2, d, d);
        }
      }
      ctx.globalAlpha = 1;

      // Now and then a shooting star.
      if (!still) {
        nextStreak -= dt;
        if (nextStreak <= 0 && !streak) {
          const angle = Math.PI * (0.15 + Math.random() * 0.25);
          const speed = 900 + Math.random() * 500;
          streak = {
            x: Math.random() * w * 0.8,
            y: Math.random() * h * 0.4,
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
      // If frames stay slow for two seconds, draw fewer particles.
      frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
      if (now - statsAt > 1000) {
        statsAt = now;
        canvas.dataset.ms = frameMs.toFixed(1);
      }
      if (frameMs > 9) {
        if (!slowSince) slowSince = now;
        else if (now - slowSince > 2000 && count > 60) {
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 70% 55% at 20% 10%, rgba(25, 60, 75, 0.32), transparent 70%), radial-gradient(ellipse 60% 50% at 85% 90%, rgba(110, 45, 15, 0.2), transparent 70%)",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
