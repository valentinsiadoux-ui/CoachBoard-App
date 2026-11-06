import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseSheet } from "@/components/exercise/ExerciseSheet";
import { ExerciseActions } from "@/components/exercise/ExerciseActions";
import { getReader, getViewer } from "@/lib/repo";

type Props = { params: Promise<{ slug: string }> };

export default async function ExercisePage({ params }: Props) {
  const { slug } = await params;
  const [reader, viewer] = await Promise.all([getReader(), getViewer()]);
  const entry = await reader.getBySlug(slug);
  if (!entry) notFound();
  return (
    <>
      <nav className="no-print mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 pt-4 text-sm">
        <Link href="/" className="text-muted underline-offset-4 hover:underline">Retour à la banque</Link>
        {viewer && <ExerciseActions entry={entry} viewer={viewer} />}
      </nav>
      <ExerciseSheet exercise={entry.exercise} />
    </>
  );
}
