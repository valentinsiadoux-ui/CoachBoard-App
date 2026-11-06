import "server-only";
import { ageRank, type ExerciseFilters } from "@/lib/filters";
import { exerciseToContent, rowToExercise } from "@/lib/db/mapping";
import { nextSlug } from "@/lib/slug";
import type { Exercise } from "@/lib/schemas";
import type { Json } from "@/lib/supabase/database.types";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { ExerciseEntry, ExerciseReader, Membership } from "./types";
import { DbError, fail, isUuid } from "./errors";

export { DbError };

const COLUMNS = "id, club_id, author_id, content";
const LIST_LIMIT = 200;

type Row = { id: string; club_id: string | null; author_id: string | null; content: unknown };


/** Banque d'exercices sur Supabase ; les droits réels sont garantis par la RLS. */
export class SupabaseExerciseRepository implements ExerciseReader {
  private readonly roles: Map<string, Membership>;

  constructor(
    private readonly sb: SupabaseServer,
    private readonly userId: string,
    memberships: Membership[],
  ) {
    this.roles = new Map(memberships.map((m) => [m.clubId, m]));
  }

  private toEntry(row: Row): ExerciseEntry {
    const club = row.club_id ? this.roles.get(row.club_id) : undefined;
    return {
      exercise: rowToExercise(row),
      scope: row.club_id ? "club" : "bibliotheque",
      clubId: row.club_id,
      clubName: club?.clubName ?? null,
      canEdit: Boolean(row.club_id && (row.author_id === this.userId || club?.role === "admin")),
    };
  }

  async list(f: ExerciseFilters): Promise<ExerciseEntry[]> {
    let q = this.sb.from("exercises").select(COLUMNS).order("updated_at", { ascending: false }).limit(LIST_LIMIT);
    if (f.q) q = q.textSearch("search", f.q, { config: "french", type: "websearch" });
    if (f.age) q = q.lte("age_from", ageRank(f.age)).gte("age_to", ageRank(f.age));
    if (f.themes.length) q = q.overlaps("themes", f.themes);
    if (f.space) q = q.eq("space", f.space);
    if (f.difficulty) q = q.eq("difficulty", f.difficulty);
    if (f.maxDuration) q = q.lte("duration_min", f.maxDuration);
    if (f.players) q = q.lte("players_min", f.players).gte("players_max", f.players);
    const { data, error } = await q;
    if (error) fail("Lecture de la banque", error);
    return (data as Row[]).map((r) => this.toEntry(r));
  }

  /** Un slug est unique par club : on privilégie l'exercice du club sur celui de la bibliothèque. */
  async getBySlug(slug: string): Promise<ExerciseEntry | null> {
    const { data, error } = await this.sb.from("exercises").select(COLUMNS).eq("slug", slug);
    if (error) fail("Lecture de l'exercice", error);
    const rows = (data as Row[]).sort((a, b) => Number(a.club_id === null) - Number(b.club_id === null));
    return rows[0] ? this.toEntry(rows[0]) : null;
  }

  async themes(): Promise<string[]> {
    const { data, error } = await this.sb.from("exercises").select("themes").limit(1000);
    if (error) fail("Lecture des thèmes", error);
    const all = (data as unknown as { themes: string[] }[]).flatMap((r) => r.themes);
    return [...new Set(all)].sort((a, b) => a.localeCompare(b, "fr"));
  }

  async getByIds(ids: string[]): Promise<ExerciseEntry[]> {
    const valid = [...new Set(ids)].filter(isUuid);
    if (!valid.length) return [];
    const { data, error } = await this.sb.from("exercises").select(COLUMNS).in("id", valid);
    if (error) fail("Lecture des exercices", error);
    return (data as Row[]).map((r) => this.toEntry(r));
  }

  async getById(id: string): Promise<ExerciseEntry | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await this.sb.from("exercises").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) fail("Lecture de l'exercice", error);
    return data ? this.toEntry(data as Row) : null;
  }

  /** Crée l'exercice ; en cas de slug déjà pris dans le club, essaie « -2 », « -3 »… */
  async create(clubId: string, ex: Exercise): Promise<{ id: string; slug: string }> {
    let content = exerciseToContent(ex);
    for (let attempt = 0; attempt < 20; attempt++) {
      const { data, error } = await this.sb
        .from("exercises")
        .insert({ club_id: clubId, content: content as unknown as Json })
        .select("id")
        .single();
      if (!error) return { id: data.id, slug: content.slug };
      if (error.code !== "23505") fail("Création de l'exercice", error);
      content = { ...content, slug: nextSlug(content.slug) };
    }
    throw new DbError("Impossible de trouver un identifiant d'URL libre pour cet exercice.");
  }

  async update(id: string, ex: Exercise): Promise<void> {
    const { data, error } = await this.sb
      .from("exercises")
      .update({ content: exerciseToContent(ex) as unknown as Json })
      .eq("id", id)
      .select("id");
    if (error) {
      if (error.code === "23505") throw new DbError("Cette adresse (slug) est déjà utilisée par un autre exercice du club.");
      fail("Enregistrement de l'exercice", error);
    }
    if (!data?.length) throw new DbError("Vous n'avez pas le droit de modifier cet exercice.");
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.sb.from("exercises").delete().eq("id", id).select("id");
    if (error) fail("Suppression de l'exercice", error);
    if (!data?.length) throw new DbError("Vous n'avez pas le droit de supprimer cet exercice.");
  }
}
