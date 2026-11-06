import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer, getWritableSessions } from "@/lib/repo";
import { sessionFormData } from "@/lib/repo/session-form-data";
import { NewSessionWorkspace } from "@/components/ai/NewSessionWorkspace";
import { isAiConfigured } from "@/lib/ai/config";

/** Dépend de la session : jamais pré-rendue. */
export const dynamic = "force-dynamic";
/** La génération par IA peut durer jusqu'à quelques minutes (corrections comprises). */
export const maxDuration = 300;
export const metadata = { title: "Nouvelle séance · CoachBoard" };

export default async function NewSessionPage() {
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "supabase") redirect("/seances");
  if (viewer.memberships.length === 0) redirect("/club");
  const { repo } = await getWritableSessions();
  const { exercises, nextNumbers } = await sessionFormData(repo, viewer);
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/seances" className="text-sm text-muted underline-offset-4 hover:underline">Retour aux séances</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-bold uppercase">Nouvelle séance</h1>
      <NewSessionWorkspace clubs={viewer.memberships} nextNumbers={nextNumbers} exercises={exercises} aiEnabled={isAiConfigured()} />
    </main>
  );
}
