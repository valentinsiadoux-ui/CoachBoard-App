import Link from "next/link";
import { FiltersForm } from "@/components/bank/FiltersForm";
import { ExerciseCard } from "@/components/bank/ExerciseCard";
import { parseFilters, hasActiveFilters } from "@/lib/filters";
import { getReader, getViewer } from "@/lib/repo";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BankPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const [reader, viewer] = await Promise.all([getReader(), getViewer()]);
  const [entries, themes] = await Promise.all([reader.list(filters), reader.themes()]);
  const canCreate = viewer?.mode === "supabase" && viewer.memberships.length > 0;
  const needsClub = viewer?.mode === "supabase" && viewer.memberships.length === 0;

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Banque d’exercices</h1>
          <p className="text-muted" aria-live="polite">
            {entries.length} exercice{entries.length > 1 ? "s" : ""}{hasActiveFilters(filters) ? " correspondant aux filtres" : ""}
          </p>
        </div>
        {canCreate && (
          <Link href="/exercices/nouveau" className="rounded-lg bg-brand px-4 py-2 font-semibold text-ink hover:bg-brand/85">
            + Nouvel exercice
          </Link>
        )}
      </div>

      {needsClub && (
        <p className="mb-6 rounded-xl bg-brand-soft p-4 text-sm text-brand-deep">
          Créez ou rejoignez un club pour ajouter vos propres exercices et les partager avec vos coachs.{" "}
          <Link href="/club" className="font-semibold underline">Mon club</Link>
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <FiltersForm filters={filters} themes={themes} />
        </aside>
        {entries.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map((e) => <ExerciseCard key={e.exercise.id} entry={e} />)}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-ink/20 p-10 text-center text-muted">
            Aucun exercice ne correspond à ces filtres.
          </p>
        )}
      </div>
    </main>
  );
}
