"use client";

import { useActionState, useMemo, useState, type FormEvent } from "react";
import { AGE_CATEGORIES, CycleSchema, type CycleInput } from "@/lib/schemas";
import type { Membership } from "@/lib/repo/types";
import { saveCycle, type SaveCycleState } from "@/app/cycles/actions";
import { CycleSheet, type SessionSummary } from "@/components/cycle/CycleSheet";
import { toFormIssues, type FormIssue } from "@/components/exercise-form/issues";
import { Field, LinesInput, ListEditor, Select, TextArea, TextInput, inputCls, labelCls } from "@/components/exercise-form/fields";

export type ClubSession = SessionSummary & { clubId: string };

type Draft = Omit<CycleInput, "id" | "weeks" | "successCriteria"> & {
  weeks: { theme: string; goal: string; sessionIds: string[] }[];
  successCriteria: string[];
};

const CYCLE_SECTIONS: Record<string, string> = {
  title: "Titre", category: "Catégorie", team: "Équipe", startDate: "Date de début",
  objective: "Objectif du cycle", weeks: "Semaine", successCriteria: "Critère de réussite",
};

/** Lundi de la semaine en cours, au format AAAA-MM-JJ. */
function nextMonday(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + (day === 0 ? 0 : 7));
  return d.toISOString().slice(0, 10);
}

const newWeek = (n: number) => ({ theme: `Semaine ${n}`, goal: "", sessionIds: [] as string[] });

export function CycleForm({ initial, clubs, sessions }: { initial?: CycleInput & { id: string }; clubs: Membership[]; sessions: ClubSession[] }) {
  const [d, setD] = useState<Draft>(() =>
    initial
      ? { ...initial, weeks: initial.weeks.map((w) => ({ theme: w.theme, goal: w.goal ?? "", sessionIds: w.sessionIds ?? [] })), successCriteria: initial.successCriteria ?? [] }
      : { title: "", category: "U15", team: "", startDate: nextMonday(), objective: "", weeks: [1, 2, 3, 4].map(newWeek), successCriteria: [] },
  );
  const [clubId, setClubId] = useState(clubs[0]?.clubId ?? "");
  const [attempted, setAttempted] = useState(false);
  const [state, formAction, pending] = useActionState<SaveCycleState, FormData>(saveCycle, { issues: [] });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  // En modification, le club est celui du cycle : on propose les séances de tous ses clubs.
  const available = useMemo(() => (initial ? sessions : sessions.filter((s) => s.clubId === clubId)), [initial, sessions, clubId]);
  const byId = useMemo(() => Object.fromEntries(sessions.map((s) => [s.id, s])), [sessions]);
  const used = new Set(d.weeks.flatMap((w) => w.sessionIds));

  const payload = { ...d, team: d.team?.trim() || undefined, successCriteria: d.successCriteria.map((s) => s.trim()).filter(Boolean) };
  const preview = CycleSchema.safeParse({ ...payload, id: "apercu" });
  const issues: FormIssue[] = preview.success ? [] : toFormIssues(preview.error.issues, CYCLE_SECTIONS);
  const shown = attempted && issues.length ? issues : state.issues;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    setAttempted(true);
    if (issues.length) e.preventDefault();
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-6" noValidate>
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : <input type="hidden" name="clubId" value={clubId} />}

      {(shown.length > 0 || state.error) && (
        <div role="alert" className="rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm">
          {state.error && <p className="font-semibold text-warn">{state.error}</p>}
          {shown.length > 0 && (
            <ul className="list-disc space-y-1 pl-5">{shown.map((i, k) => <li key={k}><strong>{i.label}</strong> — {i.message}</li>)}</ul>
          )}
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-ink/10 p-5">
        {!initial && clubs.length > 1 && (
          <div>
            <label htmlFor="club" className={labelCls}>Club</label>
            <select id="club" value={clubId} onChange={(e) => { setClubId(e.target.value); set("weeks", d.weeks.map((w) => ({ ...w, sessionIds: [] }))); }} className={inputCls}>
              {clubs.map((c) => <option key={c.clubId} value={c.clubId}>{c.clubName}</option>)}
            </select>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-[1fr_140px_180px_170px]">
          <TextInput id="title" label="Titre du cycle" maxLength={80} value={d.title} onChange={(v) => set("title", v)} placeholder="ex. Jeu de transition" />
          <Select id="category" label="Catégorie" value={d.category} options={AGE_CATEGORIES.map((c) => ({ value: c, label: c }))} onChange={(v) => set("category", v)} />
          <TextInput id="team" label="Équipe (facultatif)" maxLength={40} value={d.team} onChange={(v) => set("team", v)} />
          <Field id="startDate" label="Début (semaine 1)">
            <input id="startDate" type="date" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} />
          </Field>
        </div>
        <TextArea id="objective" label="Objectif du cycle" rows={2} value={d.objective} onChange={(v) => set("objective", v)} />
      </section>

      <section className="space-y-4 rounded-xl border border-ink/10 p-5">
        <h2 className="font-display text-xl font-bold uppercase"><span className="text-brand">01</span> Semaines</h2>
        <ListEditor legend={`${d.weeks.length} semaine(s)`} addLabel="Ajouter une semaine" max={20} items={d.weeks}
          onChange={(weeks) => set("weeks", weeks)} create={() => newWeek(d.weeks.length + 1)}
          render={(w, up, i) => (
            <>
              <div className="grid gap-2 md:grid-cols-2">
                <TextInput id={`wt-${i}`} label="Thème" maxLength={80} value={w.theme} onChange={(theme) => up({ theme })} />
                <TextInput id={`wg-${i}`} label="Objectif de progression" maxLength={240} value={w.goal} onChange={(goal) => up({ goal })} />
              </div>
              <div>
                <span className={labelCls}>Séances</span>
                <div className="flex flex-wrap items-center gap-2">
                  {w.sessionIds.map((id) => (
                    <span key={id} className="flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-1 text-xs">
                      {byId[id] ? <><strong>#{byId[id]!.number}</strong> {byId[id]!.title}</> : "Séance indisponible"}
                      <button type="button" aria-label="Retirer la séance" onClick={() => up({ sessionIds: w.sessionIds.filter((x) => x !== id) })} className="ml-1 text-warn">✕</button>
                    </span>
                  ))}
                  {w.sessionIds.length < 5 && (
                    <select aria-label={`Ajouter une séance en semaine ${i + 1}`} value="" className="rounded-lg border border-ink/20 px-2 py-1 text-xs"
                      onChange={(e) => e.target.value && up({ sessionIds: [...w.sessionIds, e.target.value] })}>
                      <option value="">+ Ajouter une séance…</option>
                      {available.filter((s) => !used.has(s.id)).map((s) => <option key={s.id} value={s.id}>#{s.number} · {s.title} ({s.durationMin} min)</option>)}
                    </select>
                  )}
                </div>
              </div>
            </>
          )} />
        <LinesInput id="criteria" label="Critères de réussite (fin de cycle)" value={d.successCriteria} onChange={(v) => set("successCriteria", v)} />
      </section>

      <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-ink/10 bg-paper/95 py-4 backdrop-blur">
        <button disabled={pending} className="rounded-lg bg-brand px-5 py-2 font-semibold text-ink disabled:opacity-60">
          {pending ? "Enregistrement…" : initial ? "Enregistrer" : "Créer le cycle"}
        </button>
        <span className="text-sm text-muted" aria-live="polite">{preview.success ? "Cycle valide." : `${issues.length} point(s) à corriger.`}</span>
      </div>

      {preview.success && (
        <section aria-label="Aperçu du cycle" className="rounded-xl border border-ink/10">
          <h2 className="border-b border-ink/10 px-6 py-3 font-display text-xl font-bold uppercase">Aperçu</h2>
          <CycleSheet cycle={preview.data} sessions={byId} linkSessions={false} />
        </section>
      )}
    </form>
  );
}
