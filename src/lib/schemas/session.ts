import { z } from "zod";
import { AgeCategorySchema } from "./exercise";

export const SESSION_PHASES = ["echauffement", "technique", "situation", "jeu", "retour-calme"] as const;
export const SessionPhaseSchema = z.enum(SESSION_PHASES);
export type SessionPhase = z.infer<typeof SessionPhaseSchema>;

export const SESSION_PHASE_LABELS: Record<SessionPhase, string> = {
  echauffement: "Échauffement",
  technique: "Technique",
  situation: "Situation",
  jeu: "Jeu & match",
  "retour-calme": "Retour au calme",
};

/**
 * Une phase de séance. Elle RÉFÉRENCE un exercice de la banque (par id) ou décrit
 * un contenu libre (`content`), par ex. « Lancers francs & débriefing ».
 */
export const SessionBlockSchema = z
  .object({
    phase: SessionPhaseSchema,
    durationMin: z.number().int().min(1).max(120),
    exerciseId: z.string().min(1).optional(),
    content: z.string().max(160).optional(),
    /** « Objectif & consignes clés » */
    goal: z.string().max(240).optional(),
    /** « Situation phare » : détaillée en seconde partie de la fiche. */
    isFlagship: z.boolean().default(false),
  })
  .refine((b) => b.exerciseId || b.content, {
    message: "Une phase doit référencer un exercice ou décrire un contenu",
    path: ["content"],
  });
export type SessionBlock = z.infer<typeof SessionBlockSchema>;

export const SessionSchema = z
  .object({
    id: z.string().min(1),
    /** « Séance #14 » */
    number: z.number().int().min(1),
    title: z.string().min(1).max(80),
    category: AgeCategorySchema,
    /** Libellé d'équipe affiché, ex. « U15 Garçons ». */
    team: z.string().max(40).optional(),
    playersCount: z.number().int().min(1).max(40),

    /** Bandeau d'informations clés. */
    keyInfo: z.object({
      mainObjective: z.string().max(80).default(""),
      technicalFocus: z.string().max(80).default(""),
      spaceEquipment: z.string().max(80).default(""),
      assistance: z.string().max(80).default(""),
    }),

    /** 01 · Déroulement */
    blocks: z.array(SessionBlockSchema).min(1).max(10),
    /** « Assistance · conseil global » */
    globalTip: z.string().max(400).optional(),

    /** 02 · Fiche d'exercice de la situation phare (surcharges facultatives). */
    flagship: z
      .object({
        /** ex. « 3 contre 2 + 1 de transition en flux tendu » */
        title: z.string().max(80).optional(),
        /** « Assistance · conseil d'accompagnement » */
        accompanimentTip: z.string().max(400).optional(),
      })
      .default({}),
  })
  .superRefine((s, ctx) => {
    if (s.blocks.filter((b) => b.isFlagship).length > 1) {
      ctx.addIssue({ code: "custom", path: ["blocks"], message: "Une seule situation phare par séance." });
    }
  });
export type Session = z.infer<typeof SessionSchema>;
export type SessionInput = z.input<typeof SessionSchema>;

/** Durée totale : toujours calculée, jamais saisie. */
export const sessionDurationMin = (s: Pick<Session, "blocks">) => s.blocks.reduce((t, b) => t + b.durationMin, 0);
