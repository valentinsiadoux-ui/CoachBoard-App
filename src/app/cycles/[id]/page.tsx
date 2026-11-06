import Link from "next/link";
import { notFound } from "next/navigation";
import { CycleSheet } from "@/components/cycle/CycleSheet";
import { ExportPdfButton } from "@/components/print/ExportPdfButton";
import { getCycleReader } from "@/lib/repo";
import { sessionSummaries } from "@/lib/repo/session-summaries";
import { pdfFileName } from "@/lib/pdf-filename";
import { deleteCycle } from "../actions";

type Props = { params: Promise<{ id: string }> };
const btn = "rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-medium hover:border-ink";

export default async function CyclePage({ params }: Props) {
  const { id } = await params;
  const entry = await (await getCycleReader()).getById(id);
  if (!entry) notFound();
  const sessions = Object.fromEntries((await sessionSummaries()).map((s) => [s.id, s]));
  const c = entry.cycle;
  return (
    <>
      <nav className="no-print mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 pt-4 text-sm">
        <Link href="/cycles" className="text-muted underline-offset-4 hover:underline">Retour aux cycles</Link>
        <div className="flex flex-wrap items-center gap-2">
          <ExportPdfButton className={btn} fileName={pdfFileName("Cycle", c.title, c.team || c.category)} />
          {entry.canEdit && <Link href={`/cycles/${id}/modifier`} className={btn}>Modifier</Link>}
          {entry.canEdit && (
            <details className="relative">
              <summary className={`${btn} cursor-pointer list-none text-warn`}>Supprimer</summary>
              <form action={deleteCycle} className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-ink/15 bg-paper p-3 text-sm shadow-lg">
                <input type="hidden" name="id" value={id} />
                <p className="mb-2">Supprimer ce cycle ? Les séances ne sont pas supprimées.</p>
                <button className="rounded-md bg-warn px-3 py-1.5 font-semibold text-white">Confirmer la suppression</button>
              </form>
            </details>
          )}
        </div>
      </nav>
      <CycleSheet cycle={c} sessions={sessions} />
    </>
  );
}
