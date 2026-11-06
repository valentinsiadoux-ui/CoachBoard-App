import { expect, it } from "vitest";
import { missingSupabaseConfig, supabaseConfig } from "@/lib/supabase/config";

const URL = "https://xyz.supabase.co";

it("accepte les différents noms de clé", () => {
  expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: "a" })?.anonKey).toBe("a");
  expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "p" })?.anonKey).toBe("p");
  expect(supabaseConfig({ SUPABASE_URL: URL, SUPABASE_ANON_KEY: "s" })).toEqual({ url: URL, anonKey: "s" });
});

it("préfère la clé publishable et ignore les valeurs vides", () => {
  expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "  ", NEXT_PUBLIC_SUPABASE_ANON_KEY: "a" })?.anonKey).toBe("a");
});

it("mode démonstration : liste les variables manquantes", () => {
  expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL })).toBeNull();
  expect(missingSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: URL })).toEqual([
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  ]);
  expect(missingSupabaseConfig({})).toHaveLength(2);
});
