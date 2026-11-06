import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { demoReader } from "./demo";
import { SupabaseExerciseRepository } from "./supabase";
import type { ExerciseReader, Membership, Viewer } from "./types";

export type { ExerciseEntry, Membership, Scope, Viewer } from "./types";

/** Utilisateur courant et ses clubs (mis en cache le temps d'une requête). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured()) return { mode: "demo" };
  const sb = await createSupabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: members, error } = await sb.from("club_members").select("club_id, role").eq("user_id", data.user.id);
  if (error) throw new Error(`Lecture des clubs : ${error.message}`);
  const ids = members.map((m) => m.club_id);
  const { data: clubs, error: e2 } = ids.length
    ? await sb.from("clubs").select("id, name").in("id", ids)
    : { data: [] as { id: string; name: string }[], error: null };
  if (e2) throw new Error(`Lecture des clubs : ${e2.message}`);
  const names = new Map(clubs.map((c) => [c.id, c.name]));
  const memberships: Membership[] = members
    .map((m) => ({ clubId: m.club_id, clubName: names.get(m.club_id) ?? "Club", role: m.role }))
    .sort((a, b) => a.clubName.localeCompare(b.clubName, "fr"));
  return { mode: "supabase", userId: data.user.id, email: data.user.email ?? null, memberships };
});

/** Accès en écriture : réservé au mode Supabase et à un utilisateur connecté. */
export async function getWritableRepository(): Promise<{ repo: SupabaseExerciseRepository; viewer: Extract<Viewer, { mode: "supabase" }> }> {
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "supabase") throw new Error("Écriture impossible : Supabase n'est pas configuré ou vous n'êtes pas connecté.");
  return { repo: new SupabaseExerciseRepository(await createSupabaseServer(), viewer.userId, viewer.memberships), viewer };
}

export async function getReader(): Promise<ExerciseReader> {
  const viewer = await getViewer();
  if (!viewer || viewer.mode === "demo") return demoReader;
  return new SupabaseExerciseRepository(await createSupabaseServer(), viewer.userId, viewer.memberships);
}
