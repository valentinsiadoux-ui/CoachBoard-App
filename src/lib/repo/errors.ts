/** Erreur métier affichable telle quelle à l'utilisateur. */
export class DbError extends Error {}

export function fail(context: string, error: { message: string; code?: string } | null): never {
  throw new DbError(`${context} : ${error?.message ?? "erreur inconnue"}`);
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
