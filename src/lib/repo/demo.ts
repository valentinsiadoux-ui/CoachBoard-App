import { exercises } from "@/data/exercises";
import { matchesFilters } from "@/lib/filters";
import { seance14 } from "@/data/sessions/seance-14";
import { cycleTransition } from "@/data/cycles/cycle-transition";
import type { CycleEntry, CycleReader, ExerciseEntry, ExerciseReader, SessionEntry, SessionReader } from "./types";

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
  async getByIds(ids) {
    return exercises.filter((e) => ids.includes(e.id)).map(entry);
  },
  async themes() {
    return [...new Set(exercises.flatMap((e) => e.themes))].sort((a, b) => a.localeCompare(b, "fr"));
  },
};

const sessions = [seance14];
const sessionEntry = (session: (typeof sessions)[number]): SessionEntry => ({ session, clubId: null, clubName: null, canEdit: false });

/** Mode démonstration : la séance #14 de la fiche de référence, en lecture seule. */
export const demoSessionReader: SessionReader = {
  async list() {
    return sessions.map(sessionEntry);
  },
  async getById(id) {
    const s = sessions.find((x) => x.id === id);
    return s ? sessionEntry(s) : null;
  },
  async usingExercise(exerciseId) {
    return sessions
      .filter((s) => s.blocks.some((b) => b.exerciseId === exerciseId))
      .map((s) => ({ id: s.id, number: s.number, title: s.title }));
  },
};

const cycleEntry = (cycle: typeof cycleTransition): CycleEntry => ({ cycle, clubId: null, clubName: null, canEdit: false });

/** Mode démonstration : un cycle de 4 semaines contenant la séance #14. */
export const demoCycleReader: CycleReader = {
  async list() {
    return [cycleEntry(cycleTransition)];
  },
  async getById(id) {
    return id === cycleTransition.id ? cycleEntry(cycleTransition) : null;
  },
  async containingSession(sessionId) {
    return cycleTransition.weeks.some((w) => w.sessionIds.includes(sessionId))
      ? [{ id: cycleTransition.id, title: cycleTransition.title, startDate: cycleTransition.startDate }]
      : [];
  },
};
