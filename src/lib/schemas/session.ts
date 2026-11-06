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
    /** Contenu libre, ou libellé affiché à la place du titre de l'exercice lié. */
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
    /** Durée prévue du créneau : sert à signaler un écart avec la somme des phases. */
    plannedDurationMin: z.number().int().min(10).max(300).optional(),

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

    /**
     * 02 · Fiche d'exercice de la situation phare. Par défaut, le contenu vient de
     * l'exercice lié ; chaque champ renseigné ici l'adapte pour cette séance.
     */
    flagship: z
      .object({
        /** ex. « 3 contre 2 + 1 de transition en flux tendu » */
        title: z.string().max(80).optional(),
        /** Mise en valeur dans le titre (ex. « + 1 »). */
        titleAccent: z.string().max(20).optional(),
        /** Énoncé du défi adapté. */
        challengeStatement: z.string().max(240).optional(),
        /** « Consignes techniques clés » */
        technicalPoints: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).max(6).optional(),
        /** « Déroulé des rotations » */
        rotations: z.array(z.string().min(1)).max(6).optional(),
        /** « Assistance · conseil d'accompagnement » */
        accompanimentTip: z.string().max(400).optional(),
      })
      .default({}),
  })
  .superRefine((s, ctx) => {
    if (s.blocks.filter((b) => b.isFlagship).length > 1) {
      ctx.addIssue({ code: "custom", path: ["blocks"], message: "Une seule situation phare par séance." });
    }
    s.blocks.forEach((b, i) => {
      if (b.isFlagship && !b.exerciseId) {
        ctx.addIssue({ code: "custom", path: ["blocks", i, "exerciseId"], message: "La situation phare doit reprendre un exercice de la banque." });
      }
    });
    if (s.flagship.title && s.flagship.titleAccent && !s.flagship.title.includes(s.flagship.titleAccent)) {
      ctx.addIssue({ code: "custom", path: ["flagship", "titleAccent"], message: "La mise en valeur doit être une partie du titre" });
    }
  });
export type Session = z.infer<typeof SessionSchema>;
export type SessionInput = z.input<typeof SessionSchema>;

/** Durée totale : toujours calculée, jamais saisie. */
export const sessionDurationMin = (s: Pick<Session, "blocks">) => s.blocks.reduce((t, b) => t + b.durationMin, 0);

/** Index (0-based) de la situation phare, ou -1. */
export const flagshipIndex = (s: Pick<Session, "blocks">) => s.blocks.findIndex((b) => b.isFlagship);

/** « Fiche #14.3 » : numéro de séance . rang de la phase phare. */
export const flagshipSheetNumber = (s: Pick<Session, "number" | "blocks">) => {
  const i = flagshipIndex(s);
  return i < 0 ? null : `${s.number}.${i + 1}`;
};

/** Part (en %) de chaque phase dans la frise du déroulement. */
export const timelineShares = (s: Pick<Session, "blocks">): number[] => {
  const total = sessionDurationMin(s);
  return s.blocks.map((b) => (total ? (b.durationMin / total) * 100 : 0));
};
