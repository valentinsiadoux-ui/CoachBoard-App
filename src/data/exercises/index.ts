import type { Exercise } from "@/lib/schemas";
import { exercice3c2p1Demi } from "./3c2p1-demi-terrain";
import { exercice3c2p1Tout } from "./3c2p1-tout-terrain";

/** Données de démonstration (remplacées par Supabase à l'étape 2). */
export const exercises: Exercise[] = [exercice3c2p1Demi, exercice3c2p1Tout];

export const getExerciseBySlug = (slug: string) => exercises.find((e) => e.slug === slug);
