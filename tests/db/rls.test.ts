/**
 * Tests de la migration et des règles d'accès (RLS) sur un vrai PostgreSQL.
 * Ignorés si TEST_DATABASE_URL n'est pas défini. Exemple :
 *   TEST_DATABASE_URL=postgres://postgres@localhost:54329/postgres npm run test:db
 * Une base temporaire est créée puis supprimée à chaque exécution.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { exercises } from "@/data/exercises";
import { seance14 } from "@/data/sessions/seance-14";
import { cycleToContent, exerciseToContent, sessionToContent } from "@/lib/db/mapping";
import { cycleTransition } from "@/data/cycles/cycle-transition";

const ADMIN_URL = process.env.TEST_DATABASE_URL;
const root = new URL("../../", import.meta.url);
const sql = (path: string) => readFileSync(new URL(path, root), "utf8");

const USERS = {
  alice: "a0000000-0000-4000-8000-00000000000a", // admin du club A
  bob: "b0000000-0000-4000-8000-00000000000b", // coach du club A
  eve: "e0000000-0000-4000-8000-00000000000e", // coach du club A
  carol: "c0000000-0000-4000-8000-00000000000c", // admin du club B
  dave: "d0000000-0000-4000-8000-00000000000d", // sans club
} as const;
type User = keyof typeof USERS;

const content = (slug: string, overrides: Record<string, unknown> = {}) => ({
  ...exerciseToContent(exercises[0]!),
  slug,
  ...overrides,
});

describe.skipIf(!ADMIN_URL)("base de données · migration et RLS", () => {
  const dbName = `cb_test_${Date.now()}`;
  let admin: Client;
  let db: Client;
  let clubA = "";
  let clubB = "";
  let codeA = "";

  /** Exécute `fn` en tant qu'utilisateur connecté (ou anonyme), dans une transaction. */
  async function as<T>(user: User | "anon", fn: (q: Client["query"]) => Promise<T>): Promise<T> {
    await db.query("begin");
    try {
      if (user === "anon") {
        await db.query("set local role anon");
      } else {
        await db.query("set local role authenticated");
        await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: USERS[user], role: "authenticated" })]);
      }
      const out = await fn(db.query.bind(db) as Client["query"]);
      await db.query("commit");
      return out;
    } catch (e) {
      await db.query("rollback");
      throw e;
    }
  }

  const insertExercise = (user: User, clubId: string | null, slug: string) =>
    as(user, (q) =>
      q("insert into exercises (club_id, content) values ($1, $2) returning id, author_id", [clubId, content(slug)]),
    ).then((r) => r.rows[0] as { id: string; author_id: string });

  const insertCycle = (user: User, clubId: string, content: unknown) =>
    as(user, (q) => q("insert into cycles (club_id, content) values ($1, $2)", [clubId, content]));

  beforeAll(async () => {
    admin = new Client({ connectionString: ADMIN_URL });
    await admin.connect();
    await admin.query(`create database ${dbName}`);
    const url = new URL(ADMIN_URL!);
    url.pathname = `/${dbName}`;
    db = new Client({ connectionString: url.toString() });
    await db.connect();
    await db.query(sql("tests/db/supabase-stub.sql"));
    await db.query(sql("supabase/migrations/20261106000000_banque_exercices.sql"));
    await db.query(sql("supabase/migrations/20261107000000_journal_ia.sql"));
    await db.query(sql("supabase/migrations/20261108000000_cycles.sql"));
    await db.query(sql("supabase/seed.sql"));
    for (const [name, id] of Object.entries(USERS)) {
      await db.query("insert into auth.users (id, email) values ($1, $2)", [id, `${name}@club.test`]);
    }
    clubA = (await as("alice", (q) => q("select * from create_club('BC Exemple')"))).rows[0].id;
    codeA = (await as("alice", (q) => q("select invite_code from clubs where id = $1", [clubA]))).rows[0].invite_code;
    await as("bob", (q) => q("select join_club($1)", [codeA]));
    await as("eve", (q) => q("select join_club($1)", [` ${codeA.toUpperCase()} `]));
    clubB = (await as("carol", (q) => q("select * from create_club('Autre club')"))).rows[0].id;
  }, 30_000);

  afterAll(async () => {
    await db?.end();
    if (admin) {
      await admin.query(`drop database if exists ${dbName} with (force)`);
      await admin.end();
    }
  });

  describe("profils et clubs", () => {
    it("crée un profil à l'inscription", async () => {
      const r = await as("dave", (q) => q("select display_name from profiles where id = $1", [USERS.dave]));
      expect(r.rows[0].display_name).toBe("dave");
    });

    it("le créateur est admin, les invités sont coachs", async () => {
      const r = await as("bob", (q) => q("select user_id, role from club_members where club_id = $1 order by role, user_id", [clubA]));
      expect(r.rows).toEqual([
        { user_id: USERS.alice, role: "admin" },
        { user_id: USERS.bob, role: "coach" },
        { user_id: USERS.eve, role: "coach" },
      ]);
    });

    it("refuse un code d'invitation invalide", async () => {
      await expect(as("dave", (q) => q("select join_club('nimporte')"))).rejects.toThrow(/invalide/);
    });

    it("un club n'est visible que de ses membres", async () => {
      const r = await as("carol", (q) => q("select id from clubs"));
      expect(r.rows.map((x) => x.id)).toEqual([clubB]);
    });

    it("les profils sont visibles entre membres d'un même club seulement", async () => {
      const bob = await as("bob", (q) => q("select id from profiles where id = $1", [USERS.alice]));
      const carol = await as("carol", (q) => q("select id from profiles where id = $1", [USERS.alice]));
      expect(bob.rowCount).toBe(1);
      expect(carol.rowCount).toBe(0);
    });

    it("un coach ne peut pas changer les rôles", async () => {
      const r = await as("bob", (q) => q("update club_members set role = 'admin' where club_id = $1 and user_id = $2", [clubA, USERS.bob]));
      expect(r.rowCount).toBe(0);
    });

    it("le dernier admin ne peut pas quitter le club", async () => {
      await expect(as("carol", (q) => q("delete from club_members where user_id = $1", [USERS.carol]))).rejects.toThrow(/au moins un administrateur/);
    });

    it("un coach peut quitter le club", async () => {
      await as("eve", (q) => q("delete from club_members where user_id = $1", [USERS.eve]));
      await as("eve", (q) => q("select join_club($1)", [codeA]));
    });
  });

  describe("exercices", () => {
    it("un anonyme n'a aucun accès", async () => {
      await expect(as("anon", (q) => q("select 1 from exercises"))).rejects.toThrow(/permission denied/);
    });

    it("la bibliothèque est lisible par tout utilisateur connecté", async () => {
      const r = await as("dave", (q) => q("select slug from exercises order by slug"));
      expect(r.rows.map((x) => x.slug)).toEqual(exercises.map((e) => e.slug).sort());
    });

    it("un exercice du club est partagé avec le club, pas au-delà", async () => {
      const { id, author_id } = await insertExercise("bob", clubA, "partage-club");
      expect(author_id).toBe(USERS.bob);
      const alice = await as("alice", (q) => q("select 1 from exercises where id = $1", [id]));
      const carol = await as("carol", (q) => q("select 1 from exercises where id = $1", [id]));
      expect(alice.rowCount).toBe(1);
      expect(carol.rowCount).toBe(0);
    });

    it("refuse d'écrire dans un autre club ou dans la bibliothèque", async () => {
      await expect(insertExercise("bob", clubB, "intrus")).rejects.toThrow(/row-level security/);
      await expect(insertExercise("bob", null, "intrus")).rejects.toThrow(/row-level security/);
      await expect(insertExercise("dave", clubA, "intrus")).rejects.toThrow(/row-level security/);
    });

    it("on ne peut pas usurper l'auteur", async () => {
      await expect(
        as("bob", (q) => q("insert into exercises (club_id, author_id, content) values ($1, $2, $3)", [clubA, USERS.alice, content("usurpe")])),
      ).rejects.toThrow(/permission denied/);
    });

    it("modification : l'auteur et les admins oui, les autres coachs non", async () => {
      const { id } = await insertExercise("bob", clubA, "droits-modif");
      const upd = (u: User, title: string) =>
        as(u, (q) => q("update exercises set content = jsonb_set(content, '{title}', to_jsonb($2::text)) where id = $1", [id, title]));
      expect((await upd("eve", "Eve")).rowCount).toBe(0);
      expect((await upd("carol", "Carol")).rowCount).toBe(0);
      expect((await upd("bob", "Bob")).rowCount).toBe(1);
      expect((await upd("alice", "Alice")).rowCount).toBe(1);
      const r = await as("bob", (q) => q("select title from exercises where id = $1", [id]));
      expect(r.rows[0].title).toBe("Alice");
    });

    it("suppression : la bibliothèque est intouchable", async () => {
      const r = await as("alice", (q) => q("delete from exercises where club_id is null"));
      expect(r.rowCount).toBe(0);
    });

    it("slug unique par club", async () => {
      await insertExercise("bob", clubA, "doublon");
      await expect(insertExercise("alice", clubA, "doublon")).rejects.toThrow(/exercises_slug_unique/);
      await insertExercise("carol", clubB, "doublon");
    });

    it("refuse un document incohérent (espace ≠ terrain du schéma)", async () => {
      const bad = content("incoherent", { params: { ...exerciseToContent(exercises[0]!).params, space: "tout-terrain" } });
      await expect(as("bob", (q) => q("insert into exercises (club_id, content) values ($1, $2)", [clubA, bad]))).rejects.toThrow(/exercises_space_court/);
    });

    it("refuse une plage de catégories inversée", async () => {
      const bad = content("inverse", { ageRange: { from: "Seniors", to: "U9" } });
      await expect(as("bob", (q) => q("insert into exercises (club_id, content) values ($1, $2)", [clubA, bad]))).rejects.toThrow(/exercises_age_range/);
    });

    it("filtres : catégorie, thème et recherche plein texte", async () => {
      const r = await as("dave", (q) =>
        q(
          `select slug from exercises
           where age_from <= age_rank('U15') and age_to >= age_rank('U15')
             and themes && array['Contre-attaque']
             and search @@ websearch_to_tsquery('french', 'contre')
           order by slug`,
        ),
      );
      expect(r.rowCount).toBe(2);
    });
  });

  describe("séances", () => {
    const sessionContent = () => sessionToContent(seance14);

    it("durée totale calculée et numéro unique par club", async () => {
      const r = await as("bob", (q) => q("insert into sessions (club_id, content) values ($1, $2) returning duration_min", [clubA, sessionContent()]));
      expect(r.rows[0].duration_min).toBe(90);
      await expect(as("alice", (q) => q("insert into sessions (club_id, content) values ($1, $2)", [clubA, sessionContent()]))).rejects.toThrow(/sessions_number_unique/);
    });

    it("les séances restent dans le club", async () => {
      const carol = await as("carol", (q) => q("select 1 from sessions"));
      const eve = await as("eve", (q) => q("select 1 from sessions"));
      expect(carol.rowCount).toBe(0);
      expect(eve.rowCount).toBe(1);
    });

    it("retrouve les séances qui utilisent un exercice", async () => {
      const r = await as("alice", (q) =>
        q("select number from sessions where content @> $1", [JSON.stringify({ blocks: [{ exerciseId: seance14.blocks[2]!.exerciseId }] })]),
      );
      expect(r.rows).toEqual([{ number: 14 }]);
    });
  });

  describe("cycles", () => {
    it("partagés avec le club, modifiables par l'auteur ou un admin, retrouvables par séance", async () => {
      const sessionId = (await as("bob", (q) => q("select id from sessions where club_id = $1", [clubA]))).rows[0].id;
      const content = cycleToContent({ ...cycleTransition, weeks: [{ theme: "S1", goal: "", sessionIds: [sessionId] }] });
      const id = (await as("bob", (q) => q("insert into cycles (club_id, content) values ($1, $2) returning id, weeks", [clubA, content]))).rows[0];
      expect(id.weeks).toBe(1);
      expect((await as("carol", (q) => q("select 1 from cycles"))).rowCount).toBe(0);
      expect((await as("eve", (q) => q("update cycles set content = content where id = $1", [id.id]))).rowCount).toBe(0);
      expect((await as("alice", (q) => q("update cycles set content = content where id = $1", [id.id]))).rowCount).toBe(1);
      const found = await as("eve", (q) => q("select id from cycles where content @> $1", [JSON.stringify({ weeks: [{ sessionIds: [sessionId] }] })]));
      expect(found.rows).toEqual([{ id: id.id }]);
      await expect(insertCycle("carol", clubA, content)).rejects.toThrow(/row-level security/);
    });

    it("refuse une date de début mal formée", async () => {
      const bad = { ...cycleToContent(cycleTransition), startDate: "02/11/2026" };
      await expect(insertCycle("bob", clubA, bad)).rejects.toThrow(/cycles_start_date/);
    });
  });

  describe("journal du co-pilote IA", () => {
    const log = (u: User) =>
      as(u, (q) => q("insert into ai_generations (kind, status, model, input_tokens, output_tokens) values ('exercise', 'ok', 'm', 10, 20)"));

    it("chacun ne voit que ses propres générations", async () => {
      await log("bob");
      await log("bob");
      await log("alice");
      const bob = await as("bob", (q) => q("select count(*)::int as n from ai_generations"));
      const alice = await as("alice", (q) => q("select count(*)::int as n from ai_generations"));
      expect([bob.rows[0].n, alice.rows[0].n]).toEqual([2, 1]);
    });

    it("le journal ne peut être ni modifié ni effacé (quota non contournable)", async () => {
      await expect(as("bob", (q) => q("delete from ai_generations"))).rejects.toThrow(/permission denied/);
      await expect(as("bob", (q) => q("update ai_generations set status = 'error'"))).rejects.toThrow(/permission denied/);
      await expect(
        as("bob", (q) => q("insert into ai_generations (user_id, kind, status, model) values ($1, 'exercise', 'ok', 'm')", [USERS.alice])),
      ).rejects.toThrow(/permission denied/);
    });
  });

  it("supprimer un club supprime ses exercices et séances", async () => {
    await as("alice", (q) => q("delete from clubs where id = $1", [clubA]));
    const r = await db.query("select count(*)::int as n from exercises where club_id = $1 union all select count(*)::int from sessions where club_id = $1", [clubA]);
    expect(r.rows.map((x) => x.n)).toEqual([0, 0]);
  });
});
