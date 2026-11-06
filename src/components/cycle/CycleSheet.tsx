import Link from "next/link";
import { cycleEndDate, shortDate, weekStartDate, weeklyLoad, type Cycle } from "@/lib/schemas";
import { Logo, Pill, SectionTitle } from "@/components/exercise/parts";

export type SessionSummary = { id: string; number: number; title: string; durationMin: number };

type Props = { cycle: Cycle; sessions: Record<string, SessionSummary>; linkSessions?: boolean };

/** Fiche de cycle : frise des semaines (thème, objectif, séances, charge) et critères de réussite. */
export function CycleSheet({ cycle: c, sessions, linkSessions = true }: Props) {
  const minutes = Object.fromEntries(Object.values(sessions).map((s) => [s.id, s.durationMin]));
  const load = weeklyLoad(c, minutes);
  const maxLoad = Math.max(1, ...load);
  const planned = c.weeks.reduce((t, w) => t + w.sessionIds.length, 0);
  const totalMin = load.reduce((a, b) => a + b, 0);
  return (
    <article className="cycle-sheet mx-auto max-w-[1600px] space-y-5 px-6 py-6">
      <header className="space-y-3 border-b-2 border-ink pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Cycle de progression</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill active>{c.team || c.category}</Pill>
            <Pill>{c.weeks.length} semaine{c.weeks.length > 1 ? "s" : ""}</Pill>
            <Pill>du {shortDate(weekStartDate(c.startDate, 0))} au {shortDate(cycleEndDate(c))}</Pill>
            <Pill>{planned} séance{planned > 1 ? "s" : ""} · {totalMin} min</Pill>
          </div>
        </div>
        <h1 className="font-display text-4xl font-bold uppercase">{c.title}</h1>
        <p className="rounded-xl bg-brand-soft px-4 py-3 text-brand-deep">
          <span className="font-display font-bold uppercase tracking-wide">Objectif du cycle — </span>{c.objective}
        </p>
      </header>

      <section>
        <SectionTitle n="01">Progression semaine par semaine</SectionTitle>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {c.weeks.map((w, i) => (
            <li key={i} className="flex flex-col rounded-xl border border-ink/10 bg-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                <span className="mr-1 rounded bg-brand px-1.5 py-0.5 text-white">S{i + 1}</span> {shortDate(weekStartDate(c.startDate, i))}
              </p>
              <h3 className="mt-2 font-display text-xl font-bold uppercase leading-tight">{w.theme}</h3>
              {w.goal && <p className="mt-1 text-sm text-muted">{w.goal}</p>}
              <ul className="mt-3 space-y-1 text-sm">
                {w.sessionIds.length === 0 && <li className="text-muted italic">Aucune séance prévue</li>}
                {w.sessionIds.map((id) => {
                  const s = sessions[id];
                  if (!s) return <li key={id} className="text-muted">Séance indisponible</li>;
                  const label = <><strong>#{s.number}</strong> {s.title} <span className="text-muted">· {s.durationMin} min</span></>;
                  return <li key={id}>{linkSessions ? <Link href={`/seances/${s.id}`} className="underline-offset-4 hover:underline">{label}</Link> : label}</li>;
                })}
              </ul>
              <div className="mt-auto pt-3" aria-label={`Charge : ${load[i]} minutes`}>
                <div className="h-1.5 overflow-hidden rounded bg-ink/10">
                  <div className="h-full bg-brand" style={{ width: `${(load[i]! / maxLoad) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted">{load[i]} min</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {c.successCriteria.length > 0 && (
        <section>
          <SectionTitle n="02">Critères de réussite</SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2 print:grid-cols-2">
            {c.successCriteria.map((k) => (
              <li key={k} className="flex items-start gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm">
                <span aria-hidden="true" className="mt-0.5 inline-block size-4 shrink-0 rounded border-2 border-ink/40" />
                {k}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
