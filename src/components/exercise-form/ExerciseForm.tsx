"use client";

import { useActionState, useMemo, useState, type FormEvent } from "react";
import { AGE_CATEGORIES, type ExerciseInput } from "@/lib/schemas";
import { DIFFICULTY_LABELS } from "@/lib/filters";
import type { Membership } from "@/lib/repo/types";
import { ExerciseSheet } from "@/components/exercise/ExerciseSheet";
import { DiagramEditor } from "@/components/diagram-editor/DiagramEditor";
import { parseEditorDiagram } from "@/lib/diagram/ops";
import { saveExercise, type SaveState } from "@/app/exercices/actions";
import { buildPayload, draftFromExercise, newDraft, validateDraft, type Draft } from "./draft";
import { toFormIssues, type FormIssue } from "./issues";
import { LinesInput, ListEditor, NumberInput, Select, TextArea, TextInput, inputCls, labelCls } from "./fields";

type Props = { initial?: ExerciseInput & { id: string }; clubs: Membership[] };

const ageOptions = AGE_CATEGORIES.map((c) => ({ value: c, label: c }));
const difficultyOptions = (Object.keys(DIFFICULTY_LABELS) as (keyof typeof DIFFICULTY_LABELS)[]).map((v) => ({ value: v, label: DIFFICULTY_LABELS[v] }));

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-ink/10 p-5">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide"><span className="text-brand">{n}</span> {title}</h2>
      {children}
    </section>
  );
}

export function ExerciseForm({ initial, clubs }: Props) {
  const start = useMemo(() => (initial ? draftFromExercise(initial) : newDraft()), [initial]);
  const [draft, setDraft] = useState<Draft>(start.draft);
  const [diagramText, setDiagramText] = useState(start.diagramText);
  const [clubId, setClubId] = useState(clubs[0]?.clubId ?? "");
  /** Après une première tentative d'envoi, la liste des erreurs se met à jour en direct. */
  const [attempted, setAttempted] = useState(false);
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveExercise, { issues: [] });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setParams = (patch: Partial<Draft["params"]>) => setDraft((d) => ({ ...d, params: { ...d.params, ...patch } }));

  /** Changer d'espace bascule aussi le terrain du schéma, si son JSON est lisible. */
  const setSpace = (space: Draft["params"]["space"]) => {
    setParams({ space });
    try {
      const diagram = JSON.parse(diagramText);
      diagram.court = space === "demi-terrain" ? "half" : "full";
      setDiagramText(JSON.stringify(diagram, null, 2));
    } catch {
      /* JSON en cours d'édition : l'erreur sera signalée à la validation */
    }
  };

  const built = buildPayload(draft, diagramText);
  const editorDiagram = useMemo(() => {
    try {
      return parseEditorDiagram(JSON.parse(diagramText));
    } catch {
      return null;
    }
  }, [diagramText]);
  const preview = built.ok ? validateDraft(built.payload) : null;
  const payload = built.ok ? JSON.stringify(built.payload) : "";

  const liveIssues: FormIssue[] = !built.ok
    ? [{ path: "diagram", label: "06 · Le film", message: built.jsonError }]
    : preview && !preview.success ? toFormIssues(preview.error.issues) : [];

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    setAttempted(true);
    if (liveIssues.length > 0) e.preventDefault();
  };

  const clientIssues = attempted && liveIssues.length > 0 ? liveIssues : null;
  const issues = clientIssues ?? state.issues;

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-6" noValidate>
      <input type="hidden" name="payload" value={payload} />
      {initial && <input type="hidden" name="id" value={initial.id} />}

      {(issues.length > 0 || state.error) && (
        <div role="alert" className="rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm">
          {state.error && !clientIssues && <p className="font-semibold text-warn">{state.error}</p>}
          {issues.length > 0 && (
            <>
              <p className="font-semibold text-warn">À corriger avant d’enregistrer :</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {issues.map((i, k) => <li key={k}><strong>{i.label}</strong> — {i.message}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      <Section n="" title="Identité">
        {!initial && clubs.length > 1 && (
          <div>
            <label htmlFor="clubId" className={labelCls}>Club</label>
            <select id="clubId" name="clubId" value={clubId} onChange={(e) => setClubId(e.target.value)} className={inputCls}>
              {clubs.map((c) => <option key={c.clubId} value={c.clubId}>{c.clubName}</option>)}
            </select>
          </div>
        )}
        {!initial && clubs.length === 1 && <input type="hidden" name="clubId" value={clubId} />}
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput id="title" label="Titre" value={draft.title} onChange={(v) => set("title", v)} required maxLength={80} placeholder="ex. 3 contre 2 + 1" />
          <TextInput id="titleAccent" label="Partie en couleur (facultatif)" value={draft.titleAccent} onChange={(v) => set("titleAccent", v)} maxLength={20} placeholder="ex. + 1" hint="Doit figurer dans le titre." />
          <TextInput id="kicker" label="Surtitre (facultatif)" value={draft.kicker} onChange={(v) => set("kicker", v)} maxLength={60} placeholder="ex. Transition · Supériorité numérique" />
          <TextInput id="slug" label="Adresse (facultatif)" value={draft.slug} onChange={(v) => set("slug", v)} maxLength={80}
            hint="Générée depuis le titre si vide. Minuscules, chiffres et tirets." />
          <TextInput id="themes" label="Thèmes" value={draft.themes.join(", ")} onChange={(v) => set("themes", v.split(","))} placeholder="ex. Contre-attaque, Passe" hint="Séparés par des virgules." />
          <div className="grid grid-cols-3 gap-3">
            <Select id="ageFrom" label="De" value={draft.ageRange.from} options={ageOptions} onChange={(v) => set("ageRange", { ...draft.ageRange, from: v })} />
            <Select id="ageTo" label="À" value={draft.ageRange.to} options={ageOptions} onChange={(v) => set("ageRange", { ...draft.ageRange, to: v })} />
            <Select id="difficulty" label="Niveau" value={draft.difficulty ?? "intermediaire"} options={difficultyOptions} onChange={(v) => set("difficulty", v)} />
          </div>
        </div>
      </Section>

      <Section n="01" title="Paramètres">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <NumberInput id="dmin" label="Durée min" min={1} value={draft.params.durationMin.min} onChange={(v) => setParams({ durationMin: { ...draft.params.durationMin, min: v } })} />
          <NumberInput id="dmax" label="Durée max" min={1} value={draft.params.durationMin.max} onChange={(v) => setParams({ durationMin: { ...draft.params.durationMin, max: v } })} />
          <NumberInput id="pmin" label="Joueurs min" min={1} value={draft.params.players.min} onChange={(v) => setParams({ players: { ...draft.params.players, min: v } })} />
          <NumberInput id="pmax" label="Joueurs max" min={1} value={draft.params.players.max} onChange={(v) => setParams({ players: { ...draft.params.players, max: v } })} />
          <Select id="space" label="Espace" value={draft.params.space} onChange={setSpace}
            options={[{ value: "demi-terrain", label: "Demi-terrain" }, { value: "tout-terrain", label: "Tout terrain" }]} />
        </div>
        <ListEditor legend="Matériel" addLabel="Ajouter du matériel" items={draft.params.equipment} onChange={(equipment) => setParams({ equipment })}
          create={(): Draft["params"]["equipment"][number] => ({ name: "" })}
          render={(it, up, i) => (
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <TextInput id={`eq-${i}`} label="Nom" value={it.name} onChange={(name) => up({ name })} />
              <NumberInput id={`eqq-${i}`} label="Quantité" min={1} value={it.quantity} onChange={(q) => up({ quantity: Number.isNaN(q) ? undefined : q })} />
            </div>
          )} />
      </Section>

      <Section n="02" title="Le défi">
        <ListEditor legend="Chiffres clés" addLabel="Ajouter un chiffre" max={4} items={draft.challenge.metrics}
          onChange={(metrics) => set("challenge", { ...draft.challenge, metrics })}
          create={() => ({ value: "", label: "" })}
          render={(m, up, i) => (
            <div className="grid grid-cols-2 gap-2">
              <TextInput id={`mv-${i}`} label="Valeur" value={m.value} maxLength={8} onChange={(value) => up({ value })} placeholder="ex. 4:00" />
              <TextInput id={`ml-${i}`} label="Libellé" value={m.label} maxLength={20} onChange={(label) => up({ label })} placeholder="ex. Chrono" />
            </div>
          )} />
        <TextArea id="statement" label="Énoncé du défi" value={draft.challenge.statement} onChange={(statement) => set("challenge", { ...draft.challenge, statement })} />
      </Section>

      <Section n="03" title="Déroulé de l’exercice">
        <ListEditor legend="Étapes" addLabel="Ajouter une étape" max={10} items={draft.steps} onChange={(steps) => set("steps", steps)}
          create={() => ({ title: "", description: "" })}
          render={(s, up, i) => (
            <>
              <TextInput id={`st-${i}`} label="Titre" value={s.title} onChange={(title) => up({ title })} />
              <TextArea id={`sd-${i}`} label="Description" rows={2} value={s.description} onChange={(description) => up({ description })} />
            </>
          )} />
      </Section>

      <Section n="04" title="Consignes techniques">
        <ListEditor legend="Consignes" addLabel="Ajouter une consigne" max={8} items={draft.technicalPoints} onChange={(v) => set("technicalPoints", v)}
          create={() => ({ title: "", description: "" })}
          render={(p, up, i) => (
            <div className="grid gap-2 md:grid-cols-[200px_1fr]">
              <TextInput id={`tp-${i}`} label="Point clé" value={p.title} onChange={(title) => up({ title })} />
              <TextInput id={`tpd-${i}`} label="Explication" value={p.description} onChange={(description) => up({ description })} />
            </div>
          )} />
        <div className="grid gap-4 md:grid-cols-2">
          <LinesInput id="simplify" label="▼ Simplifier" value={draft.variants.simplify} onChange={(simplify) => set("variants", { ...draft.variants, simplify })} />
          <LinesInput id="complicate" label="▲ Complexifier" value={draft.variants.complicate} onChange={(complicate) => set("variants", { ...draft.variants, complicate })} />
        </div>
      </Section>

      <Section n="05" title="Conseils du coach">
        <ListEditor legend="Situations" addLabel="Ajouter une situation" items={draft.coachTips} onChange={(v) => set("coachTips", v)}
          create={() => ({ situation: "", tips: [] })}
          render={(g, up, i) => (
            <>
              <TextInput id={`cs-${i}`} label="Situation" value={g.situation} onChange={(situation) => up({ situation })} placeholder="ex. Joueur en difficulté" />
              <LinesInput id={`ct-${i}`} label="Conseils" value={g.tips} onChange={(tips) => up({ tips })} />
            </>
          )} />
      </Section>

      <Section n="06" title="Le film (schéma tactique)">
        {editorDiagram ? (
          <DiagramEditor value={editorDiagram} onChange={(d) => setDiagramText(JSON.stringify(d, null, 2))} />
        ) : (
          <p role="alert" className="rounded-lg bg-warn/10 p-3 text-sm text-warn">
            Le schéma ne peut pas être affiché dans l’éditeur : corrigez le JSON ci-dessous.
          </p>
        )}
        <details className="text-sm" open={!editorDiagram}>
          <summary className="cursor-pointer text-muted">Mode avancé : schéma au format JSON</summary>
          <div className="mt-2">
            <TextArea id="diagram" label="Schéma au format JSON" rows={14} value={diagramText} onChange={setDiagramText}
              hint="Coordonnées normalisées de 0 à 1 (x : largeur ; y : depuis la ligne de fond en demi-terrain)." />
          </div>
        </details>
      </Section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-ink/10 bg-paper/95 py-4 backdrop-blur">
        <button disabled={pending} className="rounded-lg bg-brand px-5 py-2 font-semibold text-ink disabled:opacity-60">
          {pending ? "Enregistrement…" : initial ? "Enregistrer" : "Créer l’exercice"}
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {preview?.success ? "Fiche valide." : built.ok ? `${preview?.error.issues.length ?? 0} point(s) à corriger.` : "JSON du schéma invalide."}
        </span>
      </div>

      {preview?.success && (
        <section aria-label="Aperçu de la fiche" className="rounded-xl border border-ink/10">
          <h2 className="border-b border-ink/10 px-6 py-3 font-display text-xl font-bold uppercase">Aperçu</h2>
          <ExerciseSheet exercise={preview.data} />
        </section>
      )}
    </form>
  );
}
