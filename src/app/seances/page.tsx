import Link from "next/link";
import { SESSION_PHASE_LABELS, flagshipIndex, sessionDurationMin } from "@/lib/schemas";
import { exercisesById, getSessionReader, getViewer } from "@/lib/repo";
import { blockLabel } from "@/components/session/SessionSheet";

/** Liste toujours à jour (dépend de la session). */
export const dynamic = "force-dynamic";
export const metadata = { title: "Séances · CoachBoard" };

export default async function SessionsPage() {
  const [reader, viewer] = await Promise.all([getSessionReader(), getViewer()]);
  const entries = await reader.list();
  const exs = await exercisesById(entries.flatMap((e) => e.session.blocks.map((b) => b.exerciseId).filter((x): x is string => Boolean(x))));
  const canCreate = viewer?.mode === "supabase" && viewer.memberships.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Séances</h1>
          <p className="text-muted">{entries.length} séance{entries.length > 1 ? "s" : ""}</p>
        </div>
        {canCreate && (
          <Link href="/seances/nouvelle" className="rounded-lg bg-brand px-4 py-2 font-semibold text-ink hover:bg-brand/85">+ Nouvelle séance</Link>
        )}
      </div>
      {viewer?.mode === "supabase" && viewer.memberships.length === 0 && (
        <p className="mb-6 rounded-xl bg-brand-soft p-4 text-sm text-brand-deep">
          Créez ou rejoignez un club pour préparer vos séances. <Link href="/club" className="font-semibold underline">Mon club</Link>
        </p>
      )}
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/20 p-10 text-center text-muted">Aucune séance pour l’instant.</p>
      ) : (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {entries.map(({ session: s, clubName }) => {
            const fi = flagshipIndex(s);
            const flag = fi >= 0 ? s.blocks[fi]! : undefined;
            return (
              <li key={s.id}>
                <Link href={`/seances/${s.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-4 hover:bg-panel">
                  <span className="w-20 font-display text-3xl font-bold text-brand">#{s.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-2xl font-semibold uppercase">{s.title}</span>
                    <span className="text-sm text-muted">
                      {s.team || s.category} · {sessionDurationMin(s)} min · {s.blocks.length} phases
                      {flag && <> · Phare : {blockLabel(flag, flag.exerciseId ? exs[flag.exerciseId] : undefined)}</>}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1 text-xs">
                    {s.blocks.map((b, i) => (
                      <span key={i} className={`rounded px-1.5 py-0.5 ${b.isFlagship ? "bg-brand text-white" : "bg-ink/10"}`} title={SESSION_PHASE_LABELS[b.phase]}>
                        {b.durationMin}′
                      </span>
                    ))}
                  </span>
                  {clubName && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-deep">{clubName}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
