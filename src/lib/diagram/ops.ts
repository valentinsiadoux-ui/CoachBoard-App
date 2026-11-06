/**
 * Opérations d'édition d'un schéma tactique : fonctions pures, sans état ni DOM,
 * utilisées par l'éditeur visuel et testées unitairement.
 */
import { z } from "zod";
import {
  CourtTypeSchema, DiagramActionSchema, DiagramElementSchema, PointSchema,
  type CourtType, type DiagramAction, type DiagramElement, type ElementKind, type Point,
} from "@/lib/schemas";
import { BASKET, MARKER_RADIUS } from "@/lib/court/geometry";
import { svgDistance } from "./lint";

/** Vignette en cours d'édition : titre et légende peuvent être vides le temps de la saisie. */
export const EditorFrameSchema = z.object({
  title: z.string().catch(""),
  caption: z.string().catch(""),
  tag: z.string().optional().catch(undefined),
  elements: z.array(DiagramElementSchema).catch([]),
  actions: z.array(DiagramActionSchema).catch([]),
  ghosts: z.array(PointSchema).catch([]),
});
export type EditorFrame = z.infer<typeof EditorFrameSchema>;

export const EditorDiagramSchema = z.object({ court: CourtTypeSchema, frames: z.array(EditorFrameSchema).min(1) });
export type EditorDiagram = z.infer<typeof EditorDiagramSchema>;

/** Lecture tolérante d'un schéma (JSON saisi, exercice existant, sortie d'IA). */
export function parseEditorDiagram(raw: unknown): EditorDiagram | null {
  const r = EditorDiagramSchema.safeParse(raw);
  return r.success ? r.data : null;
}

const round = (v: number) => Math.round(v * 1000) / 1000;
export const clampPoint = (p: Point): Point => ({ x: round(Math.min(1, Math.max(0, p.x))), y: round(Math.min(1, Math.max(0, p.y))) });

const PREFIX: Record<ElementKind, string> = { attacker: "a", defender: "d", plus_one: "p", cone: "c" };

export function nextId(elements: DiagramElement[], kind: ElementKind): string {
  const used = new Set(elements.map((e) => e.id));
  let n = 1;
  while (used.has(`${PREFIX[kind]}${n}`)) n++;
  return `${PREFIX[kind]}${n}`;
}

/** Les attaquants sont numérotés 1, 2, 3… ; les autres prennent le libellé par défaut du rendu. */
function defaultLabel(elements: DiagramElement[], kind: ElementKind): string | undefined {
  if (kind !== "attacker") return undefined;
  const used = new Set(elements.filter((e) => e.kind === "attacker").map((e) => e.label));
  let n = 1;
  while (used.has(String(n))) n++;
  return String(n);
}

export function addElement(frame: EditorFrame, kind: ElementKind, at: Point): { frame: EditorFrame; id: string } {
  const id = nextId(frame.elements, kind);
  const el: DiagramElement = { id, kind, at: clampPoint(at), hasBall: false, label: defaultLabel(frame.elements, kind) };
  return { frame: { ...frame, elements: [...frame.elements, el] }, id };
}

/** Met à jour un pion ; donner la balle à un joueur la retire aux autres (un seul porteur). */
export function updateElement(frame: EditorFrame, id: string, patch: Partial<Omit<DiagramElement, "id">>): EditorFrame {
  return {
    ...frame,
    elements: frame.elements.map((e) => {
      if (e.id === id) return { ...e, ...patch, at: patch.at ? clampPoint(patch.at) : e.at };
      return patch.hasBall ? { ...e, hasBall: false } : e;
    }),
  };
}

export const removeElement = (frame: EditorFrame, id: string): EditorFrame => ({ ...frame, elements: frame.elements.filter((e) => e.id !== id) });

export const addAction = (frame: EditorFrame, action: DiagramAction): EditorFrame => ({
  ...frame,
  actions: [...frame.actions, { ...action, points: action.points.map(clampPoint) }],
});

export const removeAction = (frame: EditorFrame, index: number): EditorFrame => ({ ...frame, actions: frame.actions.filter((_, i) => i !== index) });

export const addGhost = (frame: EditorFrame, at: Point): EditorFrame => ({ ...frame, ghosts: [...frame.ghosts, clampPoint(at)] });
export const removeGhost = (frame: EditorFrame, index: number): EditorFrame => ({ ...frame, ghosts: frame.ghosts.filter((_, i) => i !== index) });

/** Tir : du tireur jusqu'au panier (règle vérifiée par le contrôle de lisibilité). */
export const shotFrom = (court: CourtType, from: Point, actor: DiagramAction["actor"] = "attacker"): DiagramAction => ({
  type: "shot",
  actor,
  points: [clampPoint(from), BASKET[court]],
});

/** Pion le plus proche d'un point, s'il est à portée d'aimantation. */
export function snapToElement(court: CourtType, frame: EditorFrame, p: Point, factor = 1.6): DiagramElement | null {
  const reach = MARKER_RADIUS[court] * factor;
  let best: DiagramElement | null = null;
  let bestD = Infinity;
  for (const e of frame.elements) {
    const d = svgDistance(court, e.at, p);
    if (d <= reach && d < bestD) {
      best = e;
      bestD = d;
    }
  }
  return best;
}

export const emptyFrame = (title: string): EditorFrame => ({ title, caption: "", elements: [], actions: [], ghosts: [] });

/** Vignette suivante : reprend les positions de la vignette donnée, sans ses actions. */
export const continueFrame = (frame: EditorFrame, n: number): EditorFrame => ({
  title: `Vignette ${n}`,
  caption: "",
  elements: frame.elements.map((e) => ({ ...e })),
  actions: [],
  ghosts: [],
});

export function insertFrame(d: EditorDiagram, after: number, frame: EditorFrame): EditorDiagram {
  const frames = [...d.frames];
  frames.splice(after + 1, 0, frame);
  return { ...d, frames };
}

export function moveFrame(d: EditorDiagram, index: number, dir: -1 | 1): EditorDiagram {
  const to = index + dir;
  if (to < 0 || to >= d.frames.length) return d;
  const frames = [...d.frames];
  const [f] = frames.splice(index, 1);
  frames.splice(to, 0, f!);
  return { ...d, frames };
}

export const removeFrame = (d: EditorDiagram, index: number): EditorDiagram =>
  d.frames.length <= 1 ? d : { ...d, frames: d.frames.filter((_, i) => i !== index) };

export const replaceFrame = (d: EditorDiagram, index: number, frame: EditorFrame): EditorDiagram => ({
  ...d,
  frames: d.frames.map((f, i) => (i === index ? frame : f)),
});
