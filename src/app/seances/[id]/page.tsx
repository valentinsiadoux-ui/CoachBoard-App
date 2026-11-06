import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionSheet } from "@/components/session/SessionSheet";
import { SessionActions } from "@/components/session/SessionActions";
import { exercisesById, getCycleReader, getSessionReader, getViewer } from "@/lib/repo";

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const [reader, viewer] = await Promise.all([getSessionReader(), getViewer()]);
  const entry = await reader.getById(id);
  if (!entry) notFound();
  const [exercises, cycles] = await Promise.all([
    exercisesById(entry.session.blocks.map((b) => b.exerciseId).filter((x): x is string => Boolean(x))),
    (await getCycleReader()).containingSession(entry.session.id),
  ]);
  return (
    <>
      <nav className="no-print mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-8 pt-4 text-sm">
        <Link href="/seances" className="text-muted underline-offset-4 hover:underline">Retour aux séances</Link>
        {viewer && <SessionActions entry={entry} viewer={viewer} />}
      </nav>
      <SessionSheet session={entry.session} exercises={exercises} />
      {cycles.length > 0 && (
        <aside className="no-print mx-auto max-w-[860px] px-8 pb-10 text-sm">
          <h2 className="mb-2 font-display text-xl font-bold uppercase">Cycles qui contiennent cette séance</h2>
          <ul className="flex flex-wrap gap-2">
            {cycles.map((c) => (
              <li key={c.id}><Link href={`/cycles/${c.id}`} className="inline-block rounded-full border border-ink/20 px-3 py-1 hover:border-ink">{c.title}</Link></li>
            ))}
          </ul>
        </aside>
      )}
    </>
  );
}
