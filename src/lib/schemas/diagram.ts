import { z } from "zod";

/**
 * Schéma tactique.
 * Coordonnées NORMALISÉES (0..1), indépendantes de la taille de rendu.
 *  - Demi-terrain : x = largeur (0 gauche → 1 droite), y = 0 sur la ligne de fond (panier) → 1 sur la ligne médiane.
 *  - Plein terrain : x = longueur (0 fond gauche → 1 fond droit), y = largeur (0 haut → 1 bas).
 * Une légère sortie du terrain est tolérée (ex. remplaçant sur la touche).
 */
export const CourtTypeSchema = z.enum(["half", "full"]);
export type CourtType = z.infer<typeof CourtTypeSchema>;

export const PointSchema = z.object({
  x: z.number().min(-0.1).max(1.1),
  y: z.number().min(-0.1).max(1.1),
});
export type Point = z.infer<typeof PointSchema>;

export const ElementKindSchema = z.enum(["attacker", "defender", "plus_one", "cone"]);
export type ElementKind = z.infer<typeof ElementKindSchema>;

export const DiagramElementSchema = z.object({
  id: z.string().min(1),
  kind: ElementKindSchema,
  /** Texte affiché (ex. "1", "X", "+1"). Par défaut dérivé du kind. */
  label: z.string().max(3).optional(),
  at: PointSchema,
  hasBall: z.boolean().default(false),
});
export type DiagramElement = z.infer<typeof DiagramElementSchema>;

export const ActionTypeSchema = z.enum(["run", "dribble", "pass", "shot"]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const DiagramActionSchema = z.object({
  type: ActionTypeSchema,
  /** Qui agit : détermine la couleur des courses et dribbles. */
  actor: z.enum(["attacker", "defender", "plus_one"]).default("attacker"),
  /** Tracé : au moins un départ et une arrivée. */
  points: z.array(PointSchema).min(2).max(12),
});
export type DiagramAction = z.infer<typeof DiagramActionSchema>;

export const DiagramFrameSchema = z
  .object({
    title: z.string().min(1).max(40),
    caption: z.string().min(1).max(200),
    /** Étiquette courte affichée à droite du titre de vignette (fiche de séance), ex. « 3c2 », « Passe ». */
    tag: z.string().min(1).max(10).optional(),
    elements: z.array(DiagramElementSchema).max(20),
    actions: z.array(DiagramActionSchema).max(20).default([]),
    /** Positions de départ en pointillés. */
    ghosts: z.array(PointSchema).max(20).default([]),
  })
  .superRefine((frame, ctx) => {
    const ids = new Set<string>();
    frame.elements.forEach((el, i) => {
      if (ids.has(el.id)) {
        ctx.addIssue({ code: "custom", path: ["elements", i, "id"], message: `Identifiant en double : ${el.id}` });
      }
      ids.add(el.id);
    });
    if (frame.elements.filter((e) => e.hasBall).length > 1) {
      ctx.addIssue({ code: "custom", path: ["elements"], message: "Un seul porteur de balle par vignette." });
    }
  });
export type DiagramFrame = z.infer<typeof DiagramFrameSchema>;

export const DiagramSchema = z.object({
  court: CourtTypeSchema,
  frames: z.array(DiagramFrameSchema).min(1).max(6),
});
export type Diagram = z.infer<typeof DiagramSchema>;
