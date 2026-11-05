import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseSheet } from "@/components/exercise/ExerciseSheet";
import { exercises, getExerciseBySlug } from "@/data/exercises";

export function generateStaticParams() {
  return exercises.map((e) => ({ slug: e.slug }));
}

export default async function ExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = getExerciseBySlug(slug);
  if (!exercise) notFound();
  return (
    <>
      <nav className="no-print mx-auto max-w-[1600px] px-6 pt-4 text-sm">
        <Link href="/" className="text-muted underline-offset-4 hover:underline">Retour à la banque</Link>
      </nav>
      <ExerciseSheet exercise={exercise} />
    </>
  );
}
