import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getReader, getViewer } from "@/lib/repo";
import { ExerciseForm } from "@/components/exercise-form/ExerciseForm";

type Props = { params: Promise<{ slug: string }> };

export default async function EditExercisePage({ params }: Props) {
  const { slug } = await params;
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "supabase") redirect(`/exercices/${slug}`);
  const entry = await (await getReader()).getBySlug(slug);
  if (!entry) notFound();
  if (!entry.canEdit) redirect(`/exercices/${slug}`);
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href={`/exercices/${slug}`} className="text-sm text-muted underline-offset-4 hover:underline">Retour à la fiche</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-bold uppercase">Modifier · {entry.exercise.title}</h1>
      <ExerciseForm initial={entry.exercise} clubs={viewer.memberships} />
    </main>
  );
}
