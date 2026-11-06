import Link from "next/link";
import { AGE_CATEGORIES } from "@/lib/schemas";
import { DIFFICULTY_LABELS, hasActiveFilters, type ExerciseFilters } from "@/lib/filters";

const field = "w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-ink";
const label = "mb-1 block text-xs font-medium uppercase tracking-widest text-muted";

/** Filtres en simple formulaire GET : fonctionne sans JavaScript, URL partageable. */
export function FiltersForm({ filters: f, themes }: { filters: ExerciseFilters; themes: string[] }) {
  return (
    <form method="get" className="space-y-4" role="search" aria-label="Filtrer les exercices">
      <div>
        <label htmlFor="q" className={label}>Recherche</label>
        <input id="q" name="q" type="search" defaultValue={f.q} placeholder="ex. contre-attaque" className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="age" className={label}>Catégorie</label>
          <select id="age" name="age" defaultValue={f.age ?? ""} className={field}>
            <option value="">Toutes</option>
            {AGE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="space" className={label}>Espace</label>
          <select id="space" name="space" defaultValue={f.space ?? ""} className={field}>
            <option value="">Tous</option>
            <option value="demi-terrain">Demi-terrain</option>
            <option value="tout-terrain">Tout terrain</option>
          </select>
        </div>
        <div>
          <label htmlFor="maxDuration" className={label}>Durée max (min)</label>
          <input id="maxDuration" name="maxDuration" type="number" min={1} max={180} defaultValue={f.maxDuration} className={field} />
        </div>
        <div>
          <label htmlFor="players" className={label}>Joueurs</label>
          <input id="players" name="players" type="number" min={1} max={40} defaultValue={f.players} className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="difficulty" className={label}>Niveau</label>
        <select id="difficulty" name="difficulty" defaultValue={f.difficulty ?? ""} className={field}>
          <option value="">Tous</option>
          {Object.entries(DIFFICULTY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {themes.length > 0 && (
        <fieldset>
          <legend className={label}>Thèmes</legend>
          <div className="flex flex-wrap gap-2">
            {themes.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
                <input type="checkbox" name="theme" value={t} defaultChecked={f.themes.includes(t)} className="sr-only" />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex items-center gap-3">
        <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/85">Filtrer</button>
        {hasActiveFilters(f) && <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">Réinitialiser</Link>}
      </div>
    </form>
  );
}
