import { z } from "zod";
import { AGE_CATEGORIES, AgeCategorySchema, SpaceSchema, type Exercise } from "@/lib/schemas";

export const DifficultySchema = z.enum(["debutant", "intermediaire", "avance"]);
export const DIFFICULTY_LABELS = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" } as const;

/** Filtres de la banque, lus depuis l'URL (donc partageables). */
export const ExerciseFiltersSchema = z.object({
  q: z.string().trim().max(80).optional(),
  age: AgeCategorySchema.optional(),
  themes: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  space: SpaceSchema.optional(),
  difficulty: DifficultySchema.optional(),
  /** Exercices faisables en N minutes au plus (durée minimale ≤ N). */
  maxDuration: z.coerce.number().int().min(1).max(180).optional(),
  /** Exercices jouables avec N joueurs. */
  players: z.coerce.number().int().min(1).max(40).optional(),
});
export type ExerciseFilters = z.infer<typeof ExerciseFiltersSchema>;

type RawParams = Record<string, string | string[] | undefined>;

/** Lit les paramètres d'URL ; une valeur invalide est ignorée plutôt que de casser la page. */
export function parseFilters(params: RawParams): ExerciseFilters {
  const one = (k: string) => {
    const v = params[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    return s ? s : undefined;
  };
  const many = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v : v ? [v] : []).map((s) => s.trim()).filter(Boolean);
  };
  const field = <T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> | undefined => {
    const r = schema.safeParse(value);
    return r.success ? r.data : undefined;
  };
  const shape = ExerciseFiltersSchema.shape;
  return {
    q: field(shape.q, one("q")),
    age: field(shape.age, one("age")),
    themes: field(shape.themes, many("theme")) ?? [],
    space: field(shape.space, one("space")),
    difficulty: field(shape.difficulty, one("difficulty")),
    maxDuration: field(shape.maxDuration, one("maxDuration")),
    players: field(shape.players, one("players")),
  };
}

export const hasActiveFilters = (f: ExerciseFilters) =>
  Boolean(f.q || f.age || f.themes.length || f.space || f.difficulty || f.maxDuration || f.players);

/** Rang 1-based, identique à la fonction SQL public.age_rank. */
export const ageRank = (c: (typeof AGE_CATEGORIES)[number]) => AGE_CATEGORIES.indexOf(c) + 1;

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Équivalent en mémoire des filtres SQL (mode démonstration). */
export function matchesFilters(ex: Exercise, f: ExerciseFilters): boolean {
  if (f.age) {
    const r = ageRank(f.age);
    if (ageRank(ex.ageRange.from) > r || ageRank(ex.ageRange.to) < r) return false;
  }
  if (f.themes.length && !f.themes.some((t) => ex.themes.includes(t))) return false;
  if (f.space && ex.params.space !== f.space) return false;
  if (f.difficulty && ex.difficulty !== f.difficulty) return false;
  if (f.maxDuration && ex.params.durationMin.min > f.maxDuration) return false;
  if (f.players && (ex.params.players.min > f.players || ex.params.players.max < f.players)) return false;
  if (f.q) {
    const haystack = normalize([ex.title, ex.kicker ?? "", ...ex.themes].join(" "));
    if (!normalize(f.q).split(/\s+/).filter(Boolean).every((w) => haystack.includes(w))) return false;
  }
  return true;
}
