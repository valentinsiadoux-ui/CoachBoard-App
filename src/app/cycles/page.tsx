import Link from "next/link";
import { cycleEndDate, shortDate, weekStartDate } from "@/lib/schemas";
import { getCycleReader, getViewer } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cycles · CoachBoard" };

export default async function CyclesPage() {
  const [reader, viewer] = await Promise.all([getCycleReader(), getViewer()]);
  const entries = await reader.list();
  const canCreate = viewer?.mode === "supabase" && viewer.memberships.length > 0;
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Cycles de progression</h1>
          <p className="text-muted">Planifiez vos séances sur plusieurs semaines autour d’un objectif.</p>
        </div>
        {canCreate && <Link href="/cycles/nouveau" className="rounded-lg bg-brand px-4 py-2 font-semibold text-ink hover:bg-brand/85">+ Nouveau cycle</Link>}
      </div>
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/20 p-10 text-center text-muted">Aucun cycle pour l’instant.</p>
      ) : (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {entries.map(({ cycle: c, clubName }) => (
            <li key={c.id}>
              <Link href={`/cycles/${c.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-4 hover:bg-panel">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-2xl font-semibold uppercase">{c.title}</span>
                  <span className="text-sm text-muted">
                    {c.team || c.category} · {c.weeks.length} semaines · du {shortDate(weekStartDate(c.startDate, 0))} au {shortDate(cycleEndDate(c))}
                  </span>
                </span>
                <span className="flex gap-1 text-xs">
                  {c.weeks.map((w, i) => (
                    <span key={i} title={w.theme} className={`rounded px-1.5 py-0.5 ${w.sessionIds.length ? "bg-brand text-white" : "bg-ink/10"}`}>S{i + 1}</span>
                  ))}
                </span>
                {clubName && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-deep">{clubName}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
