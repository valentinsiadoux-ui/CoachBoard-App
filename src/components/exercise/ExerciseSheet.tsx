import type { Exercise } from "@/lib/schemas";
import { CourtDiagram } from "@/components/court/CourtDiagram";
import { AccentTitle, BulbIcon, Logo, Pill, SectionTitle } from "./parts";

/**
 * Part de la surface de la fiche occupée par le film (« volume spatial »).
 * Propriété de la mise en page, pas de l'exercice : à recalculer si la grille change.
 */
const FILM_VOLUME_PCT = { half: 34, full: 40 } as const;

const fmtRange = (r: { min: number; max: number }, unit = "") =>
  r.min === r.max ? `${r.min}${unit}` : `${r.min} – ${r.max}${unit}`;

export function ExerciseSheet({ exercise: ex }: { exercise: Exercise }) {
  const full = ex.diagram.court === "full";
  const spaceLabel = full ? "Plein terrain" : "Demi-terrain";
  const equipment = ex.params.equipment.map((e) => (e.quantity ? `${e.quantity} ${e.name}` : e.name)).join(" · ");

  const params = (
    <section>
      <SectionTitle n="01">Paramètres</SectionTitle>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Param label="Durée" value={`${fmtRange(ex.params.durationMin)} min`} />
        <Param label="Joueurs" value={`${fmtRange(ex.params.players)}`} />
        <Param label="Espace" value={ex.params.space === "demi-terrain" ? "Demi-terrain" : "Tout terrain"} />
        <Param label="Matériel" value={equipment || "—"} />
      </dl>
    </section>
  );

  const challenge = (
    <section>
      <SectionTitle n="02">Le défi</SectionTitle>
      <div className="rounded-xl bg-ink px-6 py-5 text-white">
        <ul className="flex divide-x divide-white/20">
          {ex.challenge.metrics.map((m) => (
            <li key={m.label} className="flex-1 px-3 text-center first:pl-0 last:pr-0">
              <div className="font-display text-5xl font-bold leading-none text-white/55">{m.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-widest text-white/55">{m.label}</div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-sm">{ex.challenge.statement}</p>
      </div>
    </section>
  );

  const steps = (
    <section>
      <SectionTitle n="03">Déroulé de l’exercice</SectionTitle>
      <ol className="divide-y divide-ink/10">
        {ex.steps.map((s, i) => (
          <li key={i} className="flex gap-4 py-3 first:pt-0">
            <span className="w-6 font-display text-4xl font-bold leading-none text-brand">{i + 1}</span>
            <div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted">{s.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );

  const technique = (
    <section>
      <SectionTitle n="04">Consignes techniques</SectionTitle>
      <ul className="space-y-2 text-sm">
        {ex.technicalPoints.map((p) => (
          <li key={p.title}>
            <strong>{p.title}</strong> — {p.description}
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Variant tone="good" title="▼ Simplifier" items={ex.variants.simplify} />
        <Variant tone="warn" title="▲ Complexifier" items={ex.variants.complicate} />
      </div>
    </section>
  );

  const tips = ex.coachTips.length > 0 && (
    <section className="rounded-xl bg-brand-soft p-5 text-brand-deep">
      <SectionTitle n="05" icon={<BulbIcon />}>Conseils du coach</SectionTitle>
      {ex.coachTips.map((g) => (
        <div key={g.situation} className="mb-2 last:mb-0">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest">{g.situation}</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm marker:text-brand">
            {g.tips.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      ))}
    </section>
  );

  const film = (
    <section className="rounded-xl bg-panel p-5">
      <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${full ? "justify-between" : ""}`}>
        <div className="flex flex-1 items-center justify-between gap-3">
          <SectionTitle n="06" className="mb-0">{full ? "Le film de l’exercice" : "Le film"} · {spaceLabel}</SectionTitle>
          {!full && <VolumeBadge pct={FILM_VOLUME_PCT.half} />}
        </div>
        <div className={`flex items-center gap-4 ${full ? "" : "w-full"}`}>
          <Legend />
          {full && <VolumeBadge pct={FILM_VOLUME_PCT.full} />}
        </div>
      </div>
      <div className={`mt-3 grid gap-3 ${full ? "sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4" : "sm:grid-cols-2 print:grid-cols-2"}`}>
        {ex.diagram.frames.map((f, i) => (
          <figure key={f.title} className="rounded-lg bg-paper p-3">
            <figcaption className="mb-2 flex items-center gap-2 font-display text-lg font-bold uppercase">
              <span className="grid size-6 place-items-center rounded bg-brand text-sm text-white">{i + 1}</span>
              {f.title}
            </figcaption>
            <CourtDiagram court={ex.diagram.court} frame={f} className={full ? "w-full" : "mx-auto w-4/5"} />
            <p className="mt-2 text-xs text-muted">{f.caption}</p>
          </figure>
        ))}
      </div>
    </section>
  );

  return (
    <article className="exercise-sheet mx-auto max-w-[1600px] px-6 py-6">
      <header className="mb-6 border-b-2 border-ink pb-4">
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr] print:grid-cols-[1fr_auto_1fr]">
          <Logo />
          <div className="text-center">
            {ex.kicker && <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{ex.kicker}</p>}
            <h1 className="font-display text-4xl font-bold uppercase md:text-5xl print:text-5xl">
              <AccentTitle title={ex.title} accent={ex.titleAccent} />{" "}
              <span className="text-[0.6em] font-semibold text-ink/70">· {full ? "Tout-terrain" : "Demi-terrain"}</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end print:justify-end">
            <Pill active>{ex.ageRange.from} → {ex.ageRange.to}</Pill>
            {ex.themes.map((t) => <Pill key={t}>{t}</Pill>)}
            <Pill>{spaceLabel}</Pill>
          </div>
        </div>
      </header>

      {full ? (
        <div className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-3 print:grid-cols-3 lg:divide-x print:divide-x lg:divide-ink/10 print:divide-ink/10 lg:[&>*:not(:first-child)]:pl-8 print:[&>*:not(:first-child)]:pl-8">
            <div className="space-y-6">{params}{challenge}</div>
            {steps}
            <div className="space-y-6">{technique}{tips}</div>
          </div>
          {film}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr_1.5fr] print:grid-cols-[1fr_1fr_1.5fr]">
          <div className="space-y-6">{params}{challenge}{tips}</div>
          <div className="space-y-6 lg:border-l print:border-l lg:border-ink/10 print:border-ink/10 lg:pl-8 print:pl-8">{steps}{technique}</div>
          {film}
        </div>
      )}
    </article>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-widest text-muted">{label}</dt>
      <dd className="font-display text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function Variant({ tone, title, items }: { tone: "good" | "warn"; title: string; items: string[] }) {
  if (items.length === 0) return <div />;
  return (
    <div className="rounded-lg border border-ink/15 px-3 py-2">
      <h3 className={`text-xs font-semibold uppercase tracking-wider ${tone === "good" ? "text-good" : "text-warn"}`}>{title}</h3>
      {items.map((i) => <p key={i} className="text-sm">{i}</p>)}
    </div>
  );
}

function VolumeBadge({ pct }: { pct: number }) {
  return <span className="whitespace-nowrap rounded-full bg-paper px-3 py-1 text-xs font-semibold">≈ {pct} % du volume</span>;
}

function Legend() {
  const dot = (c: string, border = false) => (
    <span className="inline-block size-3 rounded-full" style={{ background: c, border: border ? "1px solid #16161A" : undefined }} />
  );
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <li className="flex items-center gap-1.5">{dot("#FFB800")} Attaquant</li>
      <li className="flex items-center gap-1.5">{dot("#16161A")} Défenseur</li>
      <li className="flex items-center gap-1.5">{dot("#9A9A9A", true)} +1</li>
      <li className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-ink" /> Course</li>
      <li className="flex items-center gap-1.5">
        <svg width="20" height="8" viewBox="0 0 20 8" aria-hidden="true"><polyline points="0,4 2.5,1 5,7 7.5,1 10,7 12.5,1 15,7 17.5,1 20,4" fill="none" stroke="#16161A" strokeWidth="1.5" /></svg>
        Dribble
      </li>
      <li className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed border-ink" /> Passe</li>
      <li className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dotted" style={{ borderColor: "#E4572E" }} /> Tir</li>
    </ul>
  );
}
