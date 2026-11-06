import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViewer, getWritableCycles } from "@/lib/repo";
import { sessionSummaries } from "@/lib/repo/session-summaries";
import { CycleForm } from "@/components/cycle-form/CycleForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditCyclePage({ params }: Props) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "supabase") redirect(`/cycles/${id}`);
  const { repo } = await getWritableCycles();
  const entry = await repo.getById(id);
  if (!entry) notFound();
  if (!entry.canEdit) redirect(`/cycles/${id}`);
  const sessions = (await sessionSummaries()).filter((s) => s.clubId === entry.clubId);
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href={`/cycles/${id}`} className="text-sm text-muted underline-offset-4 hover:underline">Retour au cycle</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-bold uppercase">Modifier · {entry.cycle.title}</h1>
      <CycleForm initial={entry.cycle} clubs={viewer.memberships} sessions={sessions} />
    </main>
  );
}
