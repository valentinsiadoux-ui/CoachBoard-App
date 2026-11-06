import "server-only";
import type { ClubRole } from "@/lib/supabase/database.types";
import type { SupabaseServer } from "@/lib/supabase/server";

export type ClubMember = { userId: string; displayName: string; role: ClubRole };
export type ClubDetails = { id: string; name: string; inviteCode: string; members: ClubMember[] };

/** Clubs visibles (= ceux dont on est membre, par RLS) avec leurs membres. */
export async function listMyClubs(sb: SupabaseServer): Promise<ClubDetails[]> {
  const { data: clubs, error } = await sb.from("clubs").select("id, name, invite_code").order("name");
  if (error) throw new Error(`Lecture des clubs : ${error.message}`);
  if (!clubs.length) return [];
  const { data: members, error: e2 } = await sb.from("club_members").select("club_id, user_id, role").in("club_id", clubs.map((c) => c.id));
  if (e2) throw new Error(`Lecture des membres : ${e2.message}`);
  const userIds = [...new Set(members.map((m) => m.user_id))];
  const { data: profiles, error: e3 } = await sb.from("profiles").select("id, display_name").in("id", userIds);
  if (e3) throw new Error(`Lecture des profils : ${e3.message}`);
  const names = new Map(profiles.map((p) => [p.id, p.display_name]));
  return clubs.map((c) => ({
    id: c.id,
    name: c.name,
    inviteCode: c.invite_code,
    members: members
      .filter((m) => m.club_id === c.id)
      .map((m) => ({ userId: m.user_id, role: m.role, displayName: names.get(m.user_id) || "Coach" }))
      .sort((a, b) => (a.role === b.role ? a.displayName.localeCompare(b.displayName, "fr") : a.role === "admin" ? -1 : 1)),
  }));
}
