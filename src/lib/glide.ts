// Moves a glass highlight (the tab bar's drop, the menu bar's hover pill)
// from one place to another like a drop of liquid: it stretches along the way
// and settles with a little bounce. The element is placed with
// transform: translateX(x) and its width; only the move is animated.

export type Spot = { x: number; w: number };

// A spring (overshoots a little, then settles). Browsers without linear()
// easing get the plain curve.
const SPRING =
  "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)";
const SETTLE = "cubic-bezier(0.34, 1.4, 0.64, 1)";

export function glide(el: HTMLElement, from: Spot | null, to: Spot) {
  el.style.width = `${to.w}px`;
  el.style.transform = `translateX(${to.x}px)`;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still || !from || (from.x === to.x && from.w === to.w)) return;
  const stretch = 1 + Math.min(0.55, Math.abs(to.x - from.x) / (to.w * 3));
  const frames: Keyframe[] = [
    { transform: `translateX(${from.x}px) scale(1, 1)`, width: `${from.w}px` },
    {
      transform: `translateX(${(from.x + to.x) / 2}px) scale(${stretch}, ${1 / Math.sqrt(stretch)})`,
      offset: 0.4,
    },
    { transform: `translateX(${to.x}px) scale(1, 1)`, width: `${to.w}px` },
  ];
  try {
    el.animate(frames, { duration: 620, easing: SPRING });
  } catch {
    el.animate(frames, { duration: 520, easing: SETTLE });
  }
}
