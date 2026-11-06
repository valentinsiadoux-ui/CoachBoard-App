import { ExerciseSchema, type ExerciseInput } from "@/lib/schemas";

/** État du formulaire : le document d'exercice sans id, schéma tactique édité en texte JSON. */
export type Draft = Omit<ExerciseInput, "id" | "diagram"> & {
  themes: string[];
  variants: { simplify: string[]; complicate: string[] };
  coachTips: { situation: string; tips: string[] }[];
};

export const emptyFrame = (title: string) => ({ title, caption: "", elements: [], actions: [], ghosts: [] });

export const newDraft = (): { draft: Draft; diagramText: string } => ({
  draft: {
    slug: "",
    title: "",
    themes: [],
    ageRange: { from: "U13", to: "Seniors" },
    difficulty: "intermediaire",
    params: {
      durationMin: { min: 10, max: 15 },
      players: { min: 6, max: 12 },
      space: "demi-terrain",
      equipment: [{ name: "ballons", quantity: 6 }],
    },
    challenge: { metrics: [{ value: "", label: "" }], statement: "" },
    steps: [{ title: "Mise en place", description: "" }],
    technicalPoints: [],
    variants: { simplify: [], complicate: [] },
    coachTips: [],
  },
  diagramText: JSON.stringify({ court: "half", frames: [emptyFrame("Départ")] }, null, 2),
});

export function draftFromExercise(ex: ExerciseInput): { draft: Draft; diagramText: string } {
  const { id: _id, diagram, ...rest } = ex;
  return {
    draft: {
      ...rest,
      variants: { simplify: ex.variants.simplify ?? [], complicate: ex.variants.complicate ?? [] },
      coachTips: ex.coachTips ?? [],
    },
    diagramText: JSON.stringify(diagram, null, 2),
  };
}

const clean = (lines: string[]) => lines.map((s) => s.trim()).filter(Boolean);

export type BuildResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; jsonError: string };

/** Assemble le document envoyé au serveur (nettoyage des lignes vides, JSON du schéma). */
export function buildPayload(draft: Draft, diagramText: string): BuildResult {
  let diagram: unknown;
  try {
    diagram = JSON.parse(diagramText);
  } catch (e) {
    return { ok: false, jsonError: `Schéma tactique : JSON invalide (${(e as Error).message}).` };
  }
  return {
    ok: true,
    payload: {
      ...draft,
      titleAccent: draft.titleAccent?.trim() || undefined,
      kicker: draft.kicker?.trim() || undefined,
      themes: clean(draft.themes),
      variants: { simplify: clean(draft.variants.simplify), complicate: clean(draft.variants.complicate) },
      coachTips: draft.coachTips.map((g) => ({ ...g, tips: clean(g.tips) })),
      diagram,
    },
  };
}

/** Validation côté client, identique à celle du serveur (même schéma Zod). */
export const validateDraft = (payload: Record<string, unknown>) =>
  ExerciseSchema.safeParse({ ...payload, slug: payload.slug || "apercu", id: "apercu" });
