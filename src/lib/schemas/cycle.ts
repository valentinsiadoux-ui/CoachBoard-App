import { z } from "zod";
import { AgeCategorySchema } from "./exercise";

/** Date du calendrier au format AAAA-MM-JJ. */
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), "Date invalide");

/** Une semaine du cycle : thème, objectif de progression et séances prévues. */
export const CycleWeekSchema = z.object({
  theme: z.string().min(1).max(80),
  goal: z.string().max(240).default(""),
  /** Séances du club (par id), dans l'ordre de la semaine. */
  sessionIds: z.array(z.string().min(1)).max(5).default([]),
});
export type CycleWeek = z.infer<typeof CycleWeekSchema>;

export const CycleSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(80),
    category: AgeCategorySchema,
    team: z.string().max(40).optional(),
    /** Lundi (ou premier jour) de la semaine 1. */
    startDate: IsoDateSchema,
    /** Objectif général du cycle. */
    objective: z.string().min(1).max(240),
    weeks: z.array(CycleWeekSchema).min(1).max(20),
    /** Critères de réussite évalués en fin de cycle. */
    successCriteria: z.array(z.string().min(1).max(160)).max(8).default([]),
  })
  .superRefine((c, ctx) => {
    const seen = new Map<string, number>();
    c.weeks.forEach((w, i) =>
      w.sessionIds.forEach((id, j) => {
        if (seen.has(id)) {
          ctx.addIssue({ code: "custom", path: ["weeks", i, "sessionIds", j], message: `Séance déjà prévue en semaine ${seen.get(id)! + 1}` });
        } else seen.set(id, i);
      }),
    );
  });
export type Cycle = z.infer<typeof CycleSchema>;
export type CycleInput = z.input<typeof CycleSchema>;

const DAY = 24 * 3600 * 1000;

/** Premier jour de la semaine n (0-based). */
export function weekStartDate(startDate: string, index: number): Date {
  return new Date(Date.parse(`${startDate}T00:00:00Z`) + index * 7 * DAY);
}

/** « 03/11 » */
export const shortDate = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/** Dernier jour du cycle (veille de la semaine suivant la dernière). */
export const cycleEndDate = (c: Pick<Cycle, "startDate" | "weeks">) => new Date(weekStartDate(c.startDate, c.weeks.length).getTime() - DAY);

/** Charge d'entraînement par semaine (minutes), d'après la durée des séances connues. */
export function weeklyLoad(c: Pick<Cycle, "weeks">, minutesBySession: Record<string, number>): number[] {
  return c.weeks.map((w) => w.sessionIds.reduce((t, id) => t + (minutesBySession[id] ?? 0), 0));
}
