import type { CourtType, DiagramFrame, Point } from "@/lib/schemas";
import { BASKET, COURT, MARKER_RADIUS } from "@/lib/court/geometry";

export type LintWarning = { frame: number; message: string; elementIds?: string[] };

/** Distance en unités SVG entre deux points normalisés. */
export const svgDistance = (court: CourtType, a: Point, b: Point) => {
  const { width, height } = COURT[court];
  return Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
};

/** Règles de lisibilité : pions qui se chevauchent, tirs qui ne visent pas le panier. */
export function lintFrame(court: CourtType, frame: Pick<DiagramFrame, "elements" | "actions">, index = 0): LintWarning[] {
  const out: LintWarning[] = [];
  const r = MARKER_RADIUS[court];
  frame.elements.forEach((a, i) =>
    frame.elements.slice(i + 1).forEach((b) => {
      if (svgDistance(court, a.at, b.at) < 2 * r) {
        out.push({ frame: index, message: `Pions qui se chevauchent (${a.label ?? a.id} / ${b.label ?? b.id})`, elementIds: [a.id, b.id] });
      }
    }),
  );
  const basket = BASKET[court];
  frame.actions.forEach((a) => {
    if (a.type !== "shot") return;
    const end = a.points[a.points.length - 1]!;
    if (Math.abs(end.x - basket.x) >= 0.01 || Math.abs(end.y - basket.y) >= 0.01) {
      out.push({ frame: index, message: "Un tir ne vise pas le panier" });
    }
  });
  return out;
}

export const lintDiagram = (d: { court: CourtType; frames: Pick<DiagramFrame, "elements" | "actions">[] }) =>
  d.frames.flatMap((f, i) => lintFrame(d.court, f, i));
