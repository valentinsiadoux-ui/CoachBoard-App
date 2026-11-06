import Link from "next/link";
import type { ExerciseEntry, Viewer } from "@/lib/repo";
import { deleteExercise, duplicateExercise } from "@/app/exercices/actions";
import { ExportPdfButton } from "@/components/print/ExportPdfButton";
import { pdfFileName } from "@/lib/pdf-filename";

const btn = "rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-medium hover:border-ink";

/** Barre d'actions d'une fiche : modifier, dupliquer dans un club, supprimer (avec confirmation). */
export function ExerciseActions({ entry, viewer }: { entry: ExerciseEntry; viewer: Viewer }) {
  const { id, slug, title, params } = entry.exercise;
  const exportButton = (
    <ExportPdfButton className={btn} fileName={pdfFileName("Fiche exercice", title, params.space === "demi-terrain" ? "Demi-terrain" : "Tout-terrain")} />
  );
  if (viewer.mode !== "supabase") return exportButton;
  const clubs = viewer.memberships;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {exportButton}
      {entry.canEdit && <Link href={`/exercices/${slug}/modifier`} className={btn}>Modifier</Link>}
      {clubs.length > 0 && (
        <form action={duplicateExercise} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          {clubs.length === 1 ? (
            <input type="hidden" name="clubId" value={clubs[0]!.clubId} />
          ) : (
            <select name="clubId" aria-label="Club de destination" className="rounded-lg border border-ink/20 px-2 py-1.5 text-sm">
              {clubs.map((c) => <option key={c.clubId} value={c.clubId}>{c.clubName}</option>)}
            </select>
          )}
          <button className={btn}>Dupliquer{entry.scope === "bibliotheque" ? " dans mon club" : ""}</button>
        </form>
      )}
      {entry.canEdit && (
        <details className="relative">
          <summary className={`${btn} cursor-pointer list-none text-warn`}>Supprimer</summary>
          <form action={deleteExercise} className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-ink/15 bg-paper p-3 text-sm shadow-lg">
            <input type="hidden" name="id" value={id} />
            <p className="mb-2">Supprimer définitivement cet exercice pour tout le club ?</p>
            <button className="rounded-md bg-warn px-3 py-1.5 font-semibold text-white">Confirmer la suppression</button>
          </form>
        </details>
      )}
    </div>
  );
}
