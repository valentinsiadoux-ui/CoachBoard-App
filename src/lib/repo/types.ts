import type { Exercise } from "@/lib/schemas";
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
}
