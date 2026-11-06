import { z } from "zod";
import { DiagramSchema } from "./diagram";

export const AGE_CATEGORIES = ["U7", "U9", "U11", "U13", "U15", "U18", "Seniors"] as const;
export const AgeCategorySchema = z.enum(AGE_CATEGORIES);
export type AgeCategory = z.infer<typeof AgeCategorySchema>;

export const SpaceSchema = z.enum(["demi-terrain", "tout-terrain"]);
export type Space = z.infer<typeof SpaceSchema>;

const rangeOf = (min: number) =>
  z
    .object({ min: z.number().int().min(min), max: z.number().int().min(min) })
    .refine((r) => r.min <= r.max, { message: "min doit être ≤ max" });

export const ExerciseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug en minuscules, séparé par des tirets"),
  title: z.string().min(1).max(80),
  /** Partie du titre mise en valeur en couleur de marque (ex. "+ 1"). Doit figurer dans le titre. */
  titleAccent: z.string().min(1).max(20).optional(),
  kicker: z.string().max(60).optional(), // ex. "Transition · Supériorité numérique"
  themes: z.array(z.string().min(1)).max(6), // ex. ["Contre-attaque"]
  ageRange: z
    .object({ from: AgeCategorySchema, to: AgeCategorySchema })
    .refine((r) => AGE_CATEGORIES.indexOf(r.from) <= AGE_CATEGORIES.indexOf(r.to), {
      message: "La catégorie de départ doit précéder celle d'arrivée",
    }),
  difficulty: z.enum(["debutant", "intermediaire", "avance"]).default("intermediaire"),

  /** 01 · Paramètres */
  params: z.object({
    durationMin: rangeOf(1),
    players: rangeOf(1),
    space: SpaceSchema,
    equipment: z.array(z.object({ name: z.string().min(1), quantity: z.number().int().min(1).optional() })),
  }),

  /** 02 · Le défi */
  challenge: z.object({
    metrics: z.array(z.object({ value: z.string().min(1).max(8), label: z.string().min(1).max(20) })).min(1).max(4),
    statement: z.string().min(1),
  }),

  /** 03 · Déroulé (ordre = index) */
  steps: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).min(1).max(10),

  /** 04 · Consignes techniques + variantes */
  technicalPoints: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).max(8),
  variants: z.object({
    simplify: z.array(z.string().min(1)).default([]),
    complicate: z.array(z.string().min(1)).default([]),
  }),

  /** 05 · Conseils du coach, groupés par situation */
  coachTips: z.array(z.object({ situation: z.string().min(1), tips: z.array(z.string().min(1)).min(1) })).default([]),

  /** 06 · Le film (schéma tactique) */
  diagram: DiagramSchema,
  /** Badge « ≈ N % du volume » affiché à côté du film. */
  volumeSharePct: z.number().int().min(1).max(100).optional(),
}).refine((e) => !e.titleAccent || e.title.includes(e.titleAccent), {
  path: ["titleAccent"],
  message: "La mise en valeur doit être une partie du titre",
});
export type Exercise = z.infer<typeof ExerciseSchema>;
/** Données saisies/générées avant application des valeurs par défaut Zod. */
export type ExerciseInput = z.input<typeof ExerciseSchema>;
