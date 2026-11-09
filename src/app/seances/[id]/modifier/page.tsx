import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViewer, getWritableSessions } from "@/lib/repo";
import { sessionFormData } from "@/lib/repo/session-form-data";
import { SessionWorkspace } from "@/components/ai/SessionWorkspace";
import { isAiConfigured } from "@/lib/ai/config";

type Props = { params: Promise<{ id: string }> };

export default async function EditSessionPage({ params }: Props) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "supabase") redirect(`/seances/${id}`);
  const { repo } = await getWritableSessions();
  const entry = await repo.getById(id);
  if (!entry) notFound();
  if (!entry.canEdit) redirect(`/seances/${id}`);
  const { exercises, nextNumbers } = await sessionFormData(repo, viewer);
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href={`/seances/${id}`} className="text-sm text-muted underline-offset-4 hover:underline">Retour à la fiche</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-bold uppercase">Modifier · Séance #{entry.session.number}</h1>
      <SessionWorkspace initial={entry.session} clubs={viewer.memberships} nextNumbers={nextNumbers} exercises={exercises} aiEnabled={isAiConfigured()} />
    </main>
  );
}
