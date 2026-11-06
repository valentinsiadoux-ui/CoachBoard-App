import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionSheet } from "@/components/session/SessionSheet";
import { SessionActions } from "@/components/session/SessionActions";
import { exercisesById, getSessionReader, getViewer } from "@/lib/repo";

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const [reader, viewer] = await Promise.all([getSessionReader(), getViewer()]);
  const entry = await reader.getById(id);
  if (!entry) notFound();
  const exercises = await exercisesById(entry.session.blocks.map((b) => b.exerciseId).filter((x): x is string => Boolean(x)));
  return (
    <>
      <nav className="no-print mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-8 pt-4 text-sm">
        <Link href="/seances" className="text-muted underline-offset-4 hover:underline">Retour aux séances</Link>
        {viewer && <SessionActions entry={entry} viewer={viewer} />}
      </nav>
      <SessionSheet session={entry.session} exercises={exercises} />
    </>
  );
}
