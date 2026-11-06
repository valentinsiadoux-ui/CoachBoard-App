/** Modèle utilisé par le co-pilote (le plus récent de la gamme Opus). */
export const AI_MODEL = "claude-opus-5-5";

/** Le co-pilote n'est proposé que si une clé API est configurée côté serveur. */
export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY?.trim());

/** Générations autorisées par coach et par 24 h (variable AI_DAILY_LIMIT, 20 par défaut). */
export function aiDailyLimit(): number {
  const n = Number(process.env.AI_DAILY_LIMIT);
  return Number.isInteger(n) && n > 0 ? n : 20;
}

/** Nombre maximal d'allers-retours de correction après la première réponse. */
export const AI_MAX_REPAIRS = 2;
