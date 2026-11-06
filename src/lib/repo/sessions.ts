import "server-only";
import { rowToSession, sessionToContent } from "@/lib/db/mapping";
import type { Session } from "@/lib/schemas";
import type { Json } from "@/lib/supabase/database.types";
import type { SupabaseServer } from "@/lib/supabase/server";
import { DbError, fail, isUuid } from "./errors";
import type { Membership, SessionEntry, SessionReader, SessionRef } from "./types";

const COLUMNS = "id, club_id, author_id, content";
type Row = { id: string; club_id: string | null; author_id: string | null; content: unknown };

/** Séances sur Supabase : visibles par le club, modifiables par l'auteur ou un admin (RLS). */
export class SupabaseSessionRepository implements SessionReader {
  private readonly roles: Map<string, Membership>;

  constructor(
    private readonly sb: SupabaseServer,
    private readonly userId: string,
    memberships: Membership[],
  ) {
    this.roles = new Map(memberships.map((m) => [m.clubId, m]));
  }

  private toEntry(row: Row): SessionEntry {
    const club = row.club_id ? this.roles.get(row.club_id) : undefined;
    return {
      session: rowToSession(row),
      clubId: row.club_id,
      clubName: club?.clubName ?? null,
      canEdit: Boolean(row.club_id && (row.author_id === this.userId || club?.role === "admin")),
    };
  }

  async list(): Promise<SessionEntry[]> {
    const { data, error } = await this.sb.from("sessions").select(COLUMNS).order("number", { ascending: false }).limit(200);
    if (error) fail("Lecture des séances", error);
    return (data as Row[]).map((r) => this.toEntry(r));
  }

  async getById(id: string): Promise<SessionEntry | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await this.sb.from("sessions").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) fail("Lecture de la séance", error);
    return data ? this.toEntry(data as Row) : null;
  }

  async usingExercise(exerciseId: string): Promise<SessionRef[]> {
    const { data, error } = await this.sb
      .from("sessions")
      .select("id, number, title")
      .contains("content", { blocks: [{ exerciseId }] })
      .order("number", { ascending: false });
    if (error) fail("Lecture des séances", error);
    return data;
  }

  /** Numéro proposé pour une nouvelle séance du club : le plus grand + 1. */
  async nextNumber(clubId: string): Promise<number> {
    const { data, error } = await this.sb.from("sessions").select("number").eq("club_id", clubId).order("number", { ascending: false }).limit(1);
    if (error) fail("Lecture des séances", error);
    return (data[0]?.number ?? 0) + 1;
  }

  async create(clubId: string, s: Session): Promise<string> {
    const { data, error } = await this.sb
      .from("sessions")
      .insert({ club_id: clubId, content: sessionToContent(s) as unknown as Json })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new DbError(`La séance #${s.number} existe déjà dans ce club : choisissez un autre numéro.`);
      fail("Création de la séance", error);
    }
    return data.id;
  }

  async update(id: string, s: Session): Promise<void> {
    const { data, error } = await this.sb
      .from("sessions")
      .update({ content: sessionToContent(s) as unknown as Json })
      .eq("id", id)
      .select("id");
    if (error) {
      if (error.code === "23505") throw new DbError(`La séance #${s.number} existe déjà dans ce club : choisissez un autre numéro.`);
      fail("Enregistrement de la séance", error);
    }
    if (!data?.length) throw new DbError("Vous n'avez pas le droit de modifier cette séance.");
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.sb.from("sessions").delete().eq("id", id).select("id");
    if (error) fail("Suppression de la séance", error);
    if (!data?.length) throw new DbError("Vous n'avez pas le droit de supprimer cette séance.");
  }
}
