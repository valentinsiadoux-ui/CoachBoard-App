import { ExerciseSchema, SessionSchema, type Exercise, type Session } from "@/lib/schemas";

/**
 * Conversion document Zod ↔ ligne SQL.
 * L'identifiant vit dans la colonne `id` ; le reste dans `content` (jsonb).
 * Toute lecture repasse par Zod : une ligne invalide lève une erreur explicite.
 */
export type ExerciseContent = Omit<Exercise, "id">;
export type SessionContent = Omit<Session, "id">;

export type ContentRow<T> = { id: string; content: T };

export function exerciseToContent(ex: Exercise): ExerciseContent {
  const { id: _id, ...content } = ExerciseSchema.parse(ex);
  return content;
}

export function rowToExercise(row: ContentRow<unknown>): Exercise {
  return ExerciseSchema.parse({ ...(row.content as object), id: row.id });
}

export function sessionToContent(s: Session): SessionContent {
  const { id: _id, ...content } = SessionSchema.parse(s);
  return content;
}

export function rowToSession(row: ContentRow<unknown>): Session {
  return SessionSchema.parse({ ...(row.content as object), id: row.id });
}
