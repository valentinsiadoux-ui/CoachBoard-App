import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/repo";
import { ExerciseForm } from "@/components/exercise-form/ExerciseForm";

/** Dépend de la session : jamais pré-rendue. */
export const dynamic = "force-dynamic";

export const metadata = { title: "Nouvel exercice · CoachBoard" };

export default async function NewExercisePage() {
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "supabase") redirect("/");
  if (viewer.memberships.length === 0) redirect("/club");
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">Retour à la banque</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-bold uppercase">Nouvel exercice</h1>
      <ExerciseForm clubs={viewer.memberships} />
    </main>
  );
}
