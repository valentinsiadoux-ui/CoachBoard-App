import type { Exercise, Session } from "@/lib/schemas";
import type { ExerciseFilters } from "@/lib/filters";
import type { ClubRole } from "@/lib/supabase/database.types";

/** « bibliotheque » : exercices CoachBoard partagés ; « club » : exercices d'un club. */
export type Scope = "bibliotheque" | "club";

export type ExerciseEntry = {
  exercise: Exercise;
  scope: Scope;
  clubId: string | null;
  clubName: string | null;
  canEdit: boolean;
};

export type Membership = { clubId: string; clubName: string; role: ClubRole };

export type Viewer =
  | { mode: "demo" }
  | { mode: "supabase"; userId: string; email: string | null; memberships: Membership[] };

/** Lecture de la banque : même contrat en mode démonstration et avec Supabase. */
export interface ExerciseReader {
  list(filters: ExerciseFilters): Promise<ExerciseEntry[]>;
  getBySlug(slug: string): Promise<ExerciseEntry | null>;
  themes(): Promise<string[]>;
  getByIds(ids: string[]): Promise<ExerciseEntry[]>;
}

export type SessionEntry = {
  session: Session;
  clubId: string | null;
  clubName: string | null;
  canEdit: boolean;
};

export type SessionRef = { id: string; number: number; title: string };

/** Lecture des séances : même contrat en démonstration et avec Supabase. */
export interface SessionReader {
  list(): Promise<SessionEntry[]>;
  getById(id: string): Promise<SessionEntry | null>;
  /** Séances dont une phase reprend cet exercice. */
  usingExercise(exerciseId: string): Promise<SessionRef[]>;
}
