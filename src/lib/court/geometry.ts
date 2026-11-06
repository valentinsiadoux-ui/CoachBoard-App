import type { CourtType, Point } from "@/lib/schemas";
import { FIBA } from "./fiba";

/** Échelle : 30 unités SVG = 1 mètre. Cotes FIBA. */
export const COURT = {
  half: { width: FIBA.width, height: FIBA.halfLength }, // 15 m × 14 m
  full: { width: FIBA.halfLength * 2, height: FIBA.width }, // 28 m × 15 m
} as const;

/** Rayon des pions (joueurs, cônes) en unités SVG, par type de terrain. */
export const MARKER_RADIUS: Record<CourtType, number> = { half: 18, full: 20 };

/** Panier (côté droit en plein terrain) en coordonnées normalisées. */
export const BASKET: Record<CourtType, Point> = {
  half: { x: 0.5, y: FIBA.basketY / FIBA.halfLength },
  full: { x: 1 - FIBA.basketY / (FIBA.halfLength * 2), y: 0.5 },
};
export function toSvg(court: CourtType, p: Point): { x: number; y: number } {
  const { width, height } = COURT[court];
  return { x: p.x * width, y: p.y * height };
}

export function polyline(court: CourtType, pts: Point[]): string {
  return pts.map((p) => {
    const s = toSvg(court, p);
    return `${s.x.toFixed(1)},${s.y.toFixed(1)}`;
  }).join(" ");
}

/** Convertit un tracé en zigzag (symbole du dribble). */
export function zigzag(court: CourtType, pts: Point[], amplitude = 5, wavelength = 14): string {
  const s = pts.map((p) => toSvg(court, p));
  const out: string[] = [];
  let flip = 1;
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i]!;
    const b = s[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    if (i === 0) out.push(`${a.x.toFixed(1)},${a.y.toFixed(1)}`);
    const steps = Math.max(1, Math.floor(len / wavelength));
    for (let k = 1; k <= steps; k++) {
      const t = (k / steps) * len;
      const isLast = k === steps && i === s.length - 2;
      const off = isLast ? 0 : amplitude * flip;
      out.push(`${(a.x + ux * t + nx * off).toFixed(1)},${(a.y + uy * t + ny * off).toFixed(1)}`);
      flip *= -1;
    }
  }
  return out.join(" ");
}

/** Raccourcit la fin d'un tracé pour que la pointe de flèche ne recouvre pas le joueur. */
export function trimEnd(court: CourtType, pts: Point[], by: number): Point[] {
  if (pts.length < 2 || by <= 0) return pts;
  const { width, height } = COURT[court];
  const last = pts[pts.length - 1]!;
  const prev = pts[pts.length - 2]!;
  const dx = (last.x - prev.x) * width;
  const dy = (last.y - prev.y) * height;
  const len = Math.hypot(dx, dy);
  if (len <= by * 1.5) return pts;
  const k = (len - by) / len;
  const trimmed: Point = { x: prev.x + (last.x - prev.x) * k, y: prev.y + (last.y - prev.y) * k };
  return [...pts.slice(0, -1), trimmed];
}
