import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseConfig } from "./config";

export type SupabaseServer = ReturnType<typeof createServerClient<Database>>;

/** Client Supabase côté serveur, lié aux cookies de session de la requête. */
export async function createSupabaseServer(): Promise<SupabaseServer> {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error("Supabase n'est pas configuré (voir .env.example).");
  const store = await cookies();
  return createServerClient<Database>(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appel depuis un Server Component : le middleware se charge du rafraîchissement.
        }
      },
    },
  });
}
