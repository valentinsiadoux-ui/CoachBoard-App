import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionSheet } from "@/components/session/SessionSheet";
import { ExerciseSheet } from "@/components/exercise/ExerciseSheet";
import { ExportPdfButton } from "@/components/print/ExportPdfButton";
import { exercisesById, getSessionReader } from "@/lib/repo";
import { pdfFileName } from "@/lib/pdf-filename";

type Props = { params: Promise<{ id: string }> };

/** Dossier imprimable : fiche de séance (A4 portrait) puis une fiche par exercice (A4 paysage). */
export default async function SessionPackPage({ params }: Props) {
  const { id } = await params;
  const entry = await (await getSessionReader()).getById(id);
  if (!entry) notFound();
  const s = entry.session;
  const ids = [...new Set(s.blocks.map((b) => b.exerciseId).filter((x): x is string => Boolean(x)))];
  const exercises = await exercisesById(ids);
  const ordered = ids.map((x) => exercises[x]).filter((e) => e !== undefined);
  return (
    <>
      <nav className="no-print mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-8 pt-4 text-sm">
        <Link href={`/seances/${id}`} className="text-muted underline-offset-4 hover:underline">Retour à la séance</Link>
        <div className="flex items-center gap-3">
          <span className="text-muted">{1 + ordered.length} page{ordered.length ? "s" : ""} : séance + {ordered.length} fiche{ordered.length > 1 ? "s" : ""} d’exercice</span>
          <ExportPdfButton fileName={pdfFileName(`Dossier séance ${s.number}`, s.title)}
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-ink hover:bg-brand/85" />
        </div>
      </nav>
      <SessionSheet session={s} exercises={exercises} linkExercises={false} />
      {ordered.map((ex) => (
        <div key={ex.id} className="print-break border-t-8 border-panel">
          <ExerciseSheet exercise={ex} />
        </div>
      ))}
    </>
  );
}
