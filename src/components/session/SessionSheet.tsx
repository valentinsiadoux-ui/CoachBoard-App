import Link from "next/link";
import type { ReactNode } from "react";
import {
  SESSION_PHASE_LABELS,
  flagshipIndex,
  flagshipSheetNumber,
  sessionDurationMin,
  timelineShares,
  type Exercise,
  type Session,
  type SessionBlock,
} from "@/lib/schemas";
import { CourtDiagram } from "@/components/court/CourtDiagram";
import { AccentTitle, Logo, Pill, SectionTitle, SparkIcon } from "@/components/exercise/parts";

type Props = {
  session: Session;
  /** Exercices référencés par la séance, indexés par id (absents = indisponibles). */
  exercises: Record<string, Exercise>;
  /** Liens vers les fiches d'exercice (désactivés dans l'aperçu du formulaire). */
  linkExercises?: boolean;
};

const fmtRange = (r: { min: number; max: number }) => (r.min === r.max ? `${r.min}` : `${r.min} à ${r.max}`);

/** Libellé d'une phase dans le tableau : contenu saisi, sinon titre de l'exercice lié. */
export function blockLabel(b: SessionBlock, ex: Exercise | undefined): string {
  if (b.content) return b.content;
  if (b.exerciseId && ex) return `${ex.title} · ${ex.params.space === "demi-terrain" ? "demi-terrain" : "tout-terrain"}`;
  return b.exerciseId ? "Exercice indisponible" : "";
}

function TipBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm">
      <span className="font-display font-bold uppercase tracking-wide text-brand-deep"><SparkIcon /> {title} —</span>{" "}
      {children}
    </p>
  );
}

/** Fiche de séance au format A4 portrait, d'après la fiche de référence. */
export function SessionSheet({ session: s, exercises, linkExercises = true }: Props) {
  const total = sessionDurationMin(s);
  const shares = timelineShares(s);
  const fi = flagshipIndex(s);
  const flagBlock = fi >= 0 ? s.blocks[fi] : undefined;
  const flagEx = flagBlock?.exerciseId ? exercises[flagBlock.exerciseId] : undefined;
  const keyInfo = [
    ["Objectif principal", s.keyInfo.mainObjective],
    ["Focus technique", s.keyInfo.technicalFocus],
    ["Espace & matériel", s.keyInfo.spaceEquipment],
    ["Assistance", s.keyInfo.assistance],
  ].filter(([, v]) => v);

  return (
    <article className="session-sheet mx-auto max-w-[860px] space-y-5 bg-paper px-8 py-8 text-ink">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-muted">Fiche de séance</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill active>{s.team || s.category}</Pill>
            <Pill>{total} min</Pill>
            <Pill>{s.playersCount} joueurs</Pill>
          </div>
        </div>
        <h1 className="border-b-2 border-ink pb-2 font-display text-4xl font-bold uppercase leading-tight">
          Séance #{s.number} <span className="text-brand">·</span> {s.title}
        </h1>
        {keyInfo.length > 0 && (
          <dl className="grid grid-cols-2 gap-y-3 border-b border-ink/10 pb-3 sm:grid-cols-4 sm:divide-x sm:divide-ink/10">
            {keyInfo.map(([label, value]) => (
              <div key={label} className="sm:px-4 sm:first:pl-0">
                <dt className="text-xs font-medium uppercase tracking-widest text-muted">{label}</dt>
                <dd className="font-semibold leading-snug">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <SectionTitle n="01" className="mb-0">Déroulement de la séance</SectionTitle>
          <span className="whitespace-nowrap text-sm font-semibold text-muted">{s.blocks.length} phase{s.blocks.length > 1 ? "s" : ""} · {total} min</span>
        </div>
        <ol className="flex gap-0.5 overflow-hidden rounded-md text-xs font-semibold" aria-label="Frise des phases">
          {s.blocks.map((b, i) => (
            <li key={i} style={{ width: `${shares[i]}%` }}
              className={`truncate px-1 py-1 text-center ${b.isFlagship ? "bg-brand text-white" : "bg-ink/10"}`}
              title={`${SESSION_PHASE_LABELS[b.phase]} · ${b.durationMin} min`}>
              {b.durationMin} min
            </li>
          ))}
        </ol>
        <table className="w-full text-sm">
          <thead className="border-b-2 border-ink text-left text-xs uppercase tracking-widest">
            <tr>
              <th className="w-20 py-2 pr-3 text-right">Durée</th>
              <th className="w-40 py-2 pr-3">Phase</th>
              <th className="py-2 pr-3">Exercice / contenu</th>
              <th className="py-2">Objectif & consignes clés</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {s.blocks.map((b, i) => {
              const ex = b.exerciseId ? exercises[b.exerciseId] : undefined;
              const label = blockLabel(b, ex);
              return (
                <tr key={i} className={b.isFlagship ? "bg-brand-soft" : undefined}>
                  <td className="py-2 pr-3 text-right align-top font-semibold whitespace-nowrap">{b.durationMin} min</td>
                  <td className="py-2 pr-3 align-top font-semibold">
                    {SESSION_PHASE_LABELS[b.phase]}
                    {b.isFlagship && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white">Phare</span>}
                  </td>
                  <td className="py-2 pr-3 align-top">
                    {ex && linkExercises ? <Link href={`/exercices/${ex.slug}`} className="underline-offset-4 hover:underline">{label}</Link> : label}
                  </td>
                  <td className="py-2 align-top text-muted">{b.goal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {s.globalTip && <TipBox title="Assistance · conseil global">{s.globalTip}</TipBox>}
      </section>

      {flagBlock && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <SectionTitle n="02" className="mb-0">Fiche d’exercice · Phase {fi + 1} (situation phare)</SectionTitle>
            {flagEx && (
              <span className="text-sm text-muted">
                <strong className="text-ink">{flagBlock.durationMin} min</strong> · terrain{" "}
                <strong className="text-ink">{flagEx.params.space === "demi-terrain" ? "demi" : "complet"}</strong> ·{" "}
                <strong className="text-ink">{fmtRange(flagEx.params.players)}</strong> joueurs
              </span>
            )}
          </div>
          {flagEx ? <FlagshipSheet session={s} exercise={flagEx} /> : <p className="text-muted">L’exercice de la situation phare n’est plus disponible.</p>}
        </section>
      )}
    </article>
  );
}

function FlagshipSheet({ session: s, exercise: ex }: { session: Session; exercise: Exercise }) {
  const f = s.flagship;
  const title = f.title || ex.title;
  const accent = f.title ? f.titleAccent : ex.titleAccent;
  const points = f.technicalPoints?.length ? f.technicalPoints : ex.technicalPoints;
  return (
    <>
      <h2 className="font-display text-3xl font-bold leading-tight">
        Fiche #{flagshipSheetNumber(s)} · <AccentTitle title={title} accent={accent} />
      </h2>
      <div className="flex flex-wrap items-center gap-6 rounded-xl bg-ink px-6 py-4 text-white">
        <ul className="flex gap-6">
          {ex.challenge.metrics.map((m) => (
            <li key={m.label} className="text-center">
              <div className="font-display text-4xl font-bold leading-none text-white/55">{m.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-widest text-white/55">{m.label}</div>
            </li>
          ))}
        </ul>
        <div className="min-w-[14rem] flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest">Le défi</p>
          <p className="text-sm">{f.challengeStatement || ex.challenge.statement}</p>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 font-display text-lg font-bold uppercase tracking-wide">Consignes techniques clés</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {points.map((p) => <li key={p.title}><strong>{p.title}</strong> — {p.description}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-display text-lg font-bold uppercase tracking-wide">Déroulé des rotations</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {f.rotations?.length
              ? f.rotations.map((r) => <li key={r}>{r}</li>)
              : ex.steps.map((st) => <li key={st.title}><strong>{st.title}</strong> — {st.description}</li>)}
          </ol>
        </div>
      </div>
      {f.accompanimentTip && <TipBox title="Assistance · conseil d’accompagnement">{f.accompanimentTip}</TipBox>}
      <div className="grid grid-cols-2 gap-3 border-t border-ink/10 pt-3 sm:grid-cols-4">
        {ex.diagram.frames.map((fr, i) => (
          <figure key={fr.title}>
            <figcaption className="mb-1 flex items-center gap-1.5 font-display text-base font-bold uppercase">
              <span className="grid size-5 shrink-0 place-items-center rounded bg-brand text-xs text-white">{i + 1}</span>
              <span className="truncate">{fr.title}</span>
              {fr.tag && <span className="ml-auto font-sans text-xs font-medium normal-case text-muted">{fr.tag}</span>}
            </figcaption>
            <CourtDiagram court={ex.diagram.court} frame={fr} className="w-full" />
            <p className="mt-1 text-xs text-muted">{fr.caption}</p>
          </figure>
        ))}
      </div>
    </>
  );
}
