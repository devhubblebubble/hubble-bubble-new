// The maths behind the bubble field: an endless honeycomb of bubbles seen as if
// wrapped over a ball, like the app grid on an Apple Watch. Bubbles near the
// middle are big, bubbles near the rim shrink away.
//
// Lengths are in units of the ring's radius R (the big circle is 2R wide), so
// nothing here depends on the size on screen. The spacing comes from the
// designer's Figma frame: bubbles 100px apart on a 342px circle.

/** Distance between neighbouring bubbles. */
export const SPACING = 100 / 171;
/** A bubble's diameter in the middle of the ring (the neighbours just clear it). */
export const BUBBLE = SPACING;

/** Distance between neighbouring columns. */
export const COL = (SPACING * Math.sqrt(3)) / 2;
/** How fast bubbles shrink towards the rim (1 = the ball's own foreshortening). */
const SHRINK = 1.35;
const RIM = Math.PI / 2;
/** Bubbles smaller than this fraction of full size are not drawn. */
const MIN_SCALE = 0.03;

export type Cell = { q: number; r: number };
export type Point = { x: number; y: number };

/** Where a cell sits on the flat honeycomb. Columns are offset by half a bubble. */
export function cellCenter(q: number, r: number): Point {
  return { x: COL * q, y: SPACING * (r + q / 2) };
}

/** The cell nearest a point on the flat honeycomb. */
export function nearestCell(p: Point): Cell {
  const q = p.x / COL;
  const r = p.y / SPACING - q / 2;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

export type Projected = Point & { scale: number };

/**
 * Wrap a point of the flat honeycomb (relative to the middle of the view)
 * over the ball: where it shows up inside the ring, and how big.
 * Returns null past the rim.
 */
export function project(p: Point): Projected | null {
  const l = Math.hypot(p.x, p.y);
  if (l >= RIM) return null;
  const scale = Math.pow(Math.cos(l), SHRINK);
  if (scale < MIN_SCALE) return null;
  const k = l === 0 ? 1 : Math.sin(l) / l;
  return { x: p.x * k, y: p.y * k, scale };
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

// The honeycomb is "coloured" so that no bubble touches another showing the
// same item (for three items or more; with two it cannot be avoided). The
// middle cell always shows the first item.
/** Which item (by position in the list) a cell shows. */
export function itemAt(q: number, r: number, count: number): number {
  if (count <= 1) return 0;
  return mod(q + (count === 3 ? 2 : 3) * r, count);
}

export type VisibleCell = Cell & Projected & { key: string; item: number };

/**
 * Every cell that shows inside the ring when `offset` (a point of the flat
 * honeycomb) is in the middle of the view, nearest the middle first.
 */
export function visibleCells(offset: Point, count: number): VisibleCell[] {
  const cells: VisibleCell[] = [];
  const qc = Math.round(offset.x / COL);
  const rc = Math.round(offset.y / SPACING - qc / 2);
  for (let q = qc - 4; q <= qc + 4; q++) {
    for (let r = rc - 6; r <= rc + 6; r++) {
      const c = cellCenter(q, r);
      const p = project({ x: c.x - offset.x, y: c.y - offset.y });
      if (p) cells.push({ q, r, ...p, key: `${q},${r}`, item: itemAt(q, r, count) });
    }
  }
  return cells.sort((a, b) => b.scale - a.scale);
}

/** CSS for a projected cell: `--cluster` is the ring's width, so R is half of it. */
export function cellTransform(p: Projected): string {
  const tx = (p.x / 2).toFixed(4);
  const ty = (p.y / 2).toFixed(4);
  return `translate3d(calc(var(--cluster) * ${tx}), calc(var(--cluster) * ${ty}), 0) scale(${p.scale.toFixed(4)})`;
}
