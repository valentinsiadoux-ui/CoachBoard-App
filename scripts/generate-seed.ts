/**
 * Génère supabase/seed.sql à partir des exercices de démonstration :
 * ils deviennent la « bibliothèque CoachBoard » (club_id NULL), lisible par tous.
 * Usage : npm run db:seed
 */
import { writeFileSync } from "node:fs";
import { exercises } from "@/data/exercises";
import { exerciseToContent } from "@/lib/db/mapping";

const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;

const rows = exercises.map(
  (ex) => `  (${lit(ex.id)}, null, ${lit(JSON.stringify(exerciseToContent(ex)))}::jsonb)`,
);

const sql = `-- Fichier GÉNÉRÉ par scripts/generate-seed.ts — ne pas modifier à la main.
-- Bibliothèque CoachBoard : exercices partagés avec tous les utilisateurs connectés.
insert into public.exercises (id, club_id, content) values
${rows.join(",\n")}
on conflict (id) do update set content = excluded.content;
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`supabase/seed.sql : ${rows.length} exercice(s).`);
