import { exercises } from "@/data/exercises";
import { matchesFilters } from "@/lib/filters";
import type { ExerciseEntry, ExerciseReader } from "./types";

const entry = (exercise: (typeof exercises)[number]): ExerciseEntry => ({
  exercise,
  scope: "bibliotheque",
  clubId: null,
  clubName: null,
  canEdit: false,
});

/** Mode démonstration : exercices en dur, lecture seule. */
export const demoReader: ExerciseReader = {
  async list(filters) {
    return exercises.filter((e) => matchesFilters(e, filters)).map(entry);
  },
  async getBySlug(slug) {
    const ex = exercises.find((e) => e.slug === slug);
    return ex ? entry(ex) : null;
  },
  async themes() {
    return [...new Set(exercises.flatMap((e) => e.themes))].sort((a, b) => a.localeCompare(b, "fr"));
  },
};
