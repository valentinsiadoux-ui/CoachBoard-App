/**
 * Lecture de la configuration Supabase.
 * Les noms varient selon l'origine des variables (saisie manuelle, intégration
 * Vercel ↔ Supabase, nouvelles clés « publishable ») : on accepte chacun d'eux.
 * Chaque nom est écrit en entier (`process.env.NOM`) pour que Next.js puisse
 * injecter les variables NEXT_PUBLIC_* au moment du build.
 */
export const SUPABASE_URL_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
export const SUPABASE_KEY_VARS = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
] as const;

type Env = Partial<Record<(typeof SUPABASE_URL_VARS)[number] | (typeof SUPABASE_KEY_VARS)[number], string>>;

const processEnv = (): Env => ({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
});

const first = (env: Env, names: readonly (keyof Env)[]) => names.map((n) => env[n]?.trim()).find(Boolean);

/** Supabase est actif seulement si une URL et une clé publique sont trouvées. */
export function supabaseConfig(env: Env = processEnv()): { url: string; anonKey: string } | null {
  const url = first(env, SUPABASE_URL_VARS);
  const anonKey = first(env, SUPABASE_KEY_VARS);
  return url && anonKey ? { url, anonKey } : null;
}

export const isSupabaseConfigured = () => supabaseConfig() !== null;

/** Diagnostic affiché en mode démonstration : NOMS des variables manquantes, jamais leurs valeurs. */
export function missingSupabaseConfig(env: Env = processEnv()): string[] {
  const missing: string[] = [];
  if (!first(env, SUPABASE_URL_VARS)) missing.push(SUPABASE_URL_VARS[0]);
  if (!first(env, SUPABASE_KEY_VARS)) missing.push(`${SUPABASE_KEY_VARS[0]} (ou ${SUPABASE_KEY_VARS[1]})`);
  return missing;
}
