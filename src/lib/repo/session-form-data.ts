import "server-only";
import { getReader } from "./index";
import type { Viewer } from "./types";
import { SupabaseSessionRepository } from "./sessions";

/** Données du formulaire de séance : exercices visibles et prochains numéros par club. */
export async function sessionFormData(repo: SupabaseSessionRepository, viewer: Extract<Viewer, { mode: "supabase" }>) {
  const [entries, numbers] = await Promise.all([
    (await getReader()).list({ themes: [] }),
    Promise.all(viewer.memberships.map(async (m) => [m.clubId, await repo.nextNumber(m.clubId)] as const)),
  ]);
  return { exercises: entries.map((e) => e.exercise), nextNumbers: Object.fromEntries(numbers) };
}
