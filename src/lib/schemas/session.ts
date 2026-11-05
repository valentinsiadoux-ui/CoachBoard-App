import { z } from "zod";
import { AgeCategorySchema } from "./exercise";

export const SESSION_PHASES = ["echauffement", "technique", "situation", "jeu", "retour-calme"] as const;
export const SessionPhaseSchema = z.enum(SESSION_PHASES);

/** Une séance RÉFÉRENCE un exercice (par id) et peut surcharger des paramètres. Utilisée à partir de l'étape 3. */
export const SessionBlockSchema = z.object({
  phase: SessionPhaseSchema,
  durationMin: z.number().int().min(1),
  exerciseId: z.string().optional(),
  label: z.string().optional(), // contenu libre si pas d'exercice lié
  goal: z.string().optional(),
  isFlagship: z.boolean().default(false), // « Situation phare »
});

export const SessionSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1),
  title: z.string().min(1),
  category: AgeCategorySchema,
  playersCount: z.number().int().min(1),
  totalDurationMin: z.number().int().min(1),
  blocks: z.array(SessionBlockSchema).min(1),
});
export type Session = z.infer<typeof SessionSchema>;
