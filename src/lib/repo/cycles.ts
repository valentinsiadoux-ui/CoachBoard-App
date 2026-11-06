import "server-only";
import { cycleToContent, rowToCycle } from "@/lib/db/mapping";
import type { Cycle } from "@/lib/schemas";
import type { Json } from "@/lib/supabase/database.types";
import type { SupabaseServer } from "@/lib/supabase/server";
import { DbError, fail, isUuid } from "./errors";
import type { CycleEntry, CycleReader, CycleRef, Membership } from "./types";

const COLUMNS = "id, club_id, author_id, content";
type Row = { id: string; club_id: string | null; author_id: string | null; content: unknown };

/** Cycles sur Supabase : visibles par le club, modifiables par l'auteur ou un admin (RLS). */
export class SupabaseCycleRepository implements CycleReader {
  private readonly roles: Map<string, Membership>;

  constructor(
    private readonly sb: SupabaseServer,
    private readonly userId: string,
    memberships: Membership[],
  ) {
    this.roles = new Map(memberships.map((m) => [m.clubId, m]));
  }

  private toEntry(row: Row): CycleEntry {
    const club = row.club_id ? this.roles.get(row.club_id) : undefined;
    return {
      cycle: rowToCycle(row),
      clubId: row.club_id,
      clubName: club?.clubName ?? null,
      canEdit: Boolean(row.club_id && (row.author_id === this.userId || club?.role === "admin")),
    };
  }

  async list(): Promise<CycleEntry[]> {
    const { data, error } = await this.sb.from("cycles").select(COLUMNS).order("start_date", { ascending: false }).limit(200);
    if (error) fail("Lecture des cycles", error);
    return (data as Row[]).map((r) => this.toEntry(r));
  }

  async getById(id: string): Promise<CycleEntry | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await this.sb.from("cycles").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) fail("Lecture du cycle", error);
    return data ? this.toEntry(data as Row) : null;
  }

  async containingSession(sessionId: string): Promise<CycleRef[]> {
    const { data, error } = await this.sb
      .from("cycles")
      .select("id, title, start_date")
      .contains("content", { weeks: [{ sessionIds: [sessionId] }] })
      .order("start_date", { ascending: false });
    if (error) fail("Lecture des cycles", error);
    return data.map((c) => ({ id: c.id, title: c.title, startDate: c.start_date }));
  }

  async create(clubId: string, c: Cycle): Promise<string> {
    const { data, error } = await this.sb.from("cycles").insert({ club_id: clubId, content: cycleToContent(c) as unknown as Json }).select("id").single();
    if (error) fail("Création du cycle", error);
    return data.id;
  }

  async update(id: string, c: Cycle): Promise<void> {
    const { data, error } = await this.sb.from("cycles").update({ content: cycleToContent(c) as unknown as Json }).eq("id", id).select("id");
    if (error) fail("Enregistrement du cycle", error);
    if (!data?.length) throw new DbError("Vous n'avez pas le droit de modifier ce cycle.");
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.sb.from("cycles").delete().eq("id", id).select("id");
    if (error) fail("Suppression du cycle", error);
    if (!data?.length) throw new DbError("Vous n'avez pas le droit de supprimer ce cycle.");
  }
}
