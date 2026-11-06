import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseSheet } from "@/components/exercise/ExerciseSheet";
import { ExerciseActions } from "@/components/exercise/ExerciseActions";
import { getReader, getSessionReader, getViewer } from "@/lib/repo";

type Props = { params: Promise<{ slug: string }> };

export default async function ExercisePage({ params }: Props) {
  const { slug } = await params;
  const [reader, viewer] = await Promise.all([getReader(), getViewer()]);
  const entry = await reader.getBySlug(slug);
  if (!entry) notFound();
  const usages = await (await getSessionReader()).usingExercise(entry.exercise.id);
  return (
    <>
      <nav className="no-print mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 pt-4 text-sm">
        <Link href="/" className="text-muted underline-offset-4 hover:underline">Retour à la banque</Link>
        {viewer && <ExerciseActions entry={entry} viewer={viewer} />}
      </nav>
      <ExerciseSheet exercise={entry.exercise} />
      {usages.length > 0 && (
        <aside className="no-print mx-auto max-w-[1600px] px-6 pb-10 text-sm">
          <h2 className="mb-2 font-display text-xl font-bold uppercase">Séances qui utilisent cet exercice</h2>
          <ul className="flex flex-wrap gap-2">
            {usages.map((u) => (
              <li key={u.id}>
                <Link href={`/seances/${u.id}`} className="inline-block rounded-full border border-ink/20 px-3 py-1 hover:border-ink">
                  <strong>#{u.number}</strong> {u.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </>
  );
}
