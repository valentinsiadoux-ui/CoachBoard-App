import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/repo";
import { sessionSummaries } from "@/lib/repo/session-summaries";
import { CycleForm } from "@/components/cycle-form/CycleForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nouveau cycle · CoachBoard" };

export default async function NewCyclePage() {
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "supabase") redirect("/cycles");
  if (viewer.memberships.length === 0) redirect("/club");
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/cycles" className="text-sm text-muted underline-offset-4 hover:underline">Retour aux cycles</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-bold uppercase">Nouveau cycle</h1>
      <CycleForm clubs={viewer.memberships} sessions={await sessionSummaries()} />
    </main>
  );
}
