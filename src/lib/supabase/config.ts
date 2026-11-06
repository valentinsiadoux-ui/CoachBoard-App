/** Supabase est actif seulement si les deux variables publiques sont renseignées. */
export function supabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export const isSupabaseConfigured = () => supabaseConfig() !== null;
