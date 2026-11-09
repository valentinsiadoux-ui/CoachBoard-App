"use client";

import { useActionState, useEffect, useMemo, useState, type FormEvent } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AGE_CATEGORIES, SESSION_PHASES, SESSION_PHASE_LABELS, sessionDurationMin, type Exercise, type SessionInput } from "@/lib/schemas";
import type { Membership } from "@/lib/repo/types";
import { SessionSheet } from "@/components/session/SessionSheet";
import { saveSession, type SaveSessionState } from "@/app/seances/actions";
import { SESSION_SECTIONS, toFormIssues, type FormIssue } from "@/components/exercise-form/issues";
import { LinesInput, ListEditor, NumberInput, Select, TextArea, TextInput, inputCls, labelCls } from "@/components/exercise-form/fields";
import { ExercisePicker } from "./ExercisePicker";
import {
  buildSessionPayload, draftFromSession, flagshipFromExercise, newBlock, newSessionDraft, validateSession,
  type DraftBlock, type SessionDraft,
} from "./draft";

type Props = {
  initial?: SessionInput & { id: string };
  /** Brouillon de départ pour une création (ex. proposé par le co-pilote IA). */
  seed?: SessionInput;
  /** Contenu courant du formulaire (JSON), transmis à chaque modification. */
  onPayloadChange?: (payload: Record<string, unknown>) => void;
  clubs: Membership[];
  /** Prochain numéro libre par club (création). */
  nextNumbers: Record<string, number>;
  /** Exercices visibles (banque du club + bibliothèque). */
  exercises: Exercise[];
};

const phaseOptions = SESSION_PHASES.map((p) => ({ value: p, label: SESSION_PHASE_LABELS[p] }));
const ageOptions = AGE_CATEGORIES.map((c) => ({ value: c, label: c }));

function Section({ n, title, aside, children }: { n: string; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-ink/10 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide"><span className="text-brand">{n}</span> {title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function SessionForm({ initial, seed, clubs, nextNumbers, exercises, onPayloadChange }: Props) {
  const firstClub = clubs[0]?.clubId ?? "";
  const start = useMemo(() => {
    if (initial) return draftFromSession(initial);
    if (seed) return draftFromSession(seed);
    return newSessionDraft(nextNumbers[firstClub] ?? 1);
  }, [initial, seed, nextNumbers, firstClub]);
  const [d, setD] = useState<SessionDraft>(start);
  const [clubId, setClubId] = useState(firstClub);
  const [attempted, setAttempted] = useState(false);
  const [state, formAction, pending] = useActionState<SaveSessionState, FormData>(saveSession, { issues: [] });
  const byId = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises]);

  const set = <K extends keyof SessionDraft>(k: K, v: SessionDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setBlocks = (fn: (b: DraftBlock[]) => DraftBlock[]) => setD((x) => ({ ...x, blocks: fn(x.blocks) }));
  const updateBlock = (key: string, patch: Partial<DraftBlock>) => setBlocks((bs) => bs.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  const setFlagshipBlock = (key: string, on: boolean) => setBlocks((bs) => bs.map((b) => ({ ...b, isFlagship: on && b.key === key })));
  const setFlag = (patch: Partial<SessionDraft["flagship"]>) => setD((x) => ({ ...x, flagship: { ...x.flagship, ...patch } }));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setBlocks((bs) => arrayMove(bs, bs.findIndex((b) => b.key === active.id), bs.findIndex((b) => b.key === over.id)));
  };

  const payload = buildSessionPayload(d);
  const payloadJson = JSON.stringify(payload);
  useEffect(() => {
    onPayloadChange?.(JSON.parse(payloadJson) as Record<string, unknown>);
  }, [payloadJson, onPayloadChange]);
  const preview = validateSession(payload);
  const issues: FormIssue[] = !preview.success ? toFormIssues(preview.error.issues, SESSION_SECTIONS) : [];
  const shown = attempted && issues.length ? issues : state.issues;

  const total = d.blocks.reduce((t, b) => t + (Number.isNaN(b.durationMin) ? 0 : b.durationMin), 0);
  const planned = d.plannedDurationMin;
  const gap = planned && !Number.isNaN(planned) ? total - planned : 0;
  const flagBlock = d.blocks.find((b) => b.isFlagship);
  const flagEx = flagBlock?.source === "exercise" && flagBlock.exerciseId ? byId[flagBlock.exerciseId] : undefined;

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
            <>
              <p className="font-semibold text-warn">À corriger avant d’enregistrer :</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">{shown.map((i, k) => <li key={k}><strong>{i.label}</strong> — {i.message}</li>)}</ul>
            </>
          )}
        </div>
      )}

      <Section n="" title="Séance">
        {!initial && clubs.length > 1 && (
          <div>
            <label htmlFor="club" className={labelCls}>Club</label>
            <select id="club" value={clubId} className={inputCls}
              onChange={(e) => { setClubId(e.target.value); set("number", nextNumbers[e.target.value] ?? 1); }}>
              {clubs.map((c) => <option key={c.clubId} value={c.clubId}>{c.clubName}</option>)}
            </select>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-[120px_1fr]">
          <NumberInput id="number" label="Numéro" min={1} value={d.number} onChange={(v) => set("number", v)} />
          <TextInput id="title" label="Titre" value={d.title} onChange={(v) => set("title", v)} maxLength={80} placeholder="ex. Relance rapide & transition" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Select id="category" label="Catégorie" value={d.category} options={ageOptions} onChange={(v) => set("category", v)} />
          <TextInput id="team" label="Équipe (facultatif)" value={d.team} onChange={(v) => set("team", v)} maxLength={40} placeholder="ex. U15 Garçons" />
          <NumberInput id="players" label="Joueurs" min={1} max={40} value={d.playersCount} onChange={(v) => set("playersCount", v)} />
          <NumberInput id="planned" label="Durée prévue (min)" min={10} max={300} value={d.plannedDurationMin}
            onChange={(v) => set("plannedDurationMin", Number.isNaN(v) ? undefined : v)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput id="obj" label="Objectif principal" maxLength={80} value={d.keyInfo.mainObjective} onChange={(v) => set("keyInfo", { ...d.keyInfo, mainObjective: v })} />
          <TextInput id="focus" label="Focus technique" maxLength={80} value={d.keyInfo.technicalFocus} onChange={(v) => set("keyInfo", { ...d.keyInfo, technicalFocus: v })} />
          <TextInput id="space" label="Espace & matériel" maxLength={80} value={d.keyInfo.spaceEquipment} onChange={(v) => set("keyInfo", { ...d.keyInfo, spaceEquipment: v })} />
          <TextInput id="assist" label="Assistance" maxLength={80} value={d.keyInfo.assistance} onChange={(v) => set("keyInfo", { ...d.keyInfo, assistance: v })} />
        </div>
      </Section>

      <Section n="01" title="Déroulement"
        aside={
          <p className="text-sm font-semibold" aria-live="polite">
            {d.blocks.length} phase{d.blocks.length > 1 ? "s" : ""} · {total} min
            {gap !== 0 && <span className="ml-2 rounded-full bg-warn/10 px-2 py-0.5 text-warn">{gap > 0 ? `+${gap}` : gap} min / prévu {planned}</span>}
            {planned && gap === 0 && <span className="ml-2 rounded-full bg-good/10 px-2 py-0.5 text-good">= durée prévue</span>}
          </p>
        }>
        <ol className="flex gap-0.5 overflow-hidden rounded-md text-xs font-semibold" aria-hidden="true">
          {d.blocks.map((b) => (
            <li key={b.key} style={{ width: `${total ? ((Number.isNaN(b.durationMin) ? 0 : b.durationMin) / total) * 100 : 0}%` }}
              className={`truncate py-1 text-center transition-all ${b.isFlagship ? "bg-brand text-white" : "bg-ink/10"}`}>
              {Number.isNaN(b.durationMin) ? "" : `${b.durationMin}′`}
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted">Glissez une phase par sa poignée ⠿ pour la déplacer (au clavier : Espace, puis flèches).</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={d.blocks.map((b) => b.key)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3">
              {d.blocks.map((b, i) => (
                <SortableBlock key={b.key} block={b} index={i} exercises={exercises}
                  onChange={(patch) => updateBlock(b.key, patch)}
                  onFlagship={(on) => setFlagshipBlock(b.key, on)}
                  onRemove={() => setBlocks((bs) => bs.filter((x) => x.key !== b.key))} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {d.blocks.length < 10 && (
          <button type="button" onClick={() => setBlocks((bs) => [...bs, newBlock("jeu", 15)])}
            className="rounded-lg border border-dashed border-ink/30 px-3 py-1.5 text-sm hover:border-ink">+ Ajouter une phase</button>
        )}
        <TextArea id="globalTip" label="Assistance · conseil global (facultatif)" value={d.globalTip} onChange={(v) => set("globalTip", v)} />
      </Section>

      <Section n="02" title="Situation phare">
        {!flagBlock && <p className="text-sm text-muted">Cochez « Situation phare » sur une phase pour détailler son exercice en seconde partie de fiche.</p>}
        {flagBlock && !flagEx && <p className="text-sm text-muted">Choisissez l’exercice de la phase phare pour l’adapter ici.</p>}
        {flagEx && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p>Par défaut, la fiche reprend <strong>{flagEx.title}</strong>. Chaque champ rempli ci-dessous l’adapte pour cette séance.</p>
              <button type="button" onClick={() => setFlag(flagshipFromExercise(flagEx))} className="rounded-lg border border-ink/20 px-3 py-1.5 hover:border-ink">
                Reprendre le contenu de l’exercice
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput id="ftitle" label="Titre de la fiche" maxLength={80} value={d.flagship.title} onChange={(v) => setFlag({ title: v })} placeholder={flagEx.title} />
              <TextInput id="faccent" label="Partie en couleur" maxLength={20} value={d.flagship.titleAccent} onChange={(v) => setFlag({ titleAccent: v })} placeholder="ex. + 1" />
            </div>
            <TextArea id="fchallenge" label="Énoncé du défi" rows={2} value={d.flagship.challengeStatement} onChange={(v) => setFlag({ challengeStatement: v })} />
            <ListEditor legend="Consignes techniques clés" addLabel="Ajouter une consigne" max={6}
              items={d.flagship.technicalPoints ?? []} onChange={(v) => setFlag({ technicalPoints: v })}
              create={() => ({ title: "", description: "" })}
              render={(p, up, i) => (
                <div className="grid gap-2 md:grid-cols-[200px_1fr]">
                  <TextInput id={`ftp-${i}`} label="Point clé" value={p.title} onChange={(title) => up({ title })} />
                  <TextInput id={`ftpd-${i}`} label="Explication" value={p.description} onChange={(description) => up({ description })} />
                </div>
              )} />
            <LinesInput id="frot" label="Déroulé des rotations" value={d.flagship.rotations ?? []} onChange={(v) => setFlag({ rotations: v })} />
            <TextArea id="ftip" label="Assistance · conseil d’accompagnement" rows={2} value={d.flagship.accompanimentTip} onChange={(v) => setFlag({ accompanimentTip: v })} />
          </>
        )}
      </Section>

      <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-ink/10 bg-paper/95 py-4 backdrop-blur">
        <button disabled={pending} className="rounded-lg bg-brand px-5 py-2 font-semibold text-ink disabled:opacity-60">
          {pending ? "Enregistrement…" : initial ? "Enregistrer" : "Créer la séance"}
        </button>
        <span className="text-sm text-muted" aria-live="polite">{preview.success ? "Séance valide." : `${issues.length} point(s) à corriger.`}</span>
      </div>

      {preview.success && (
        <section aria-label="Aperçu de la fiche de séance" className="rounded-xl border border-ink/10 bg-panel py-6">
          <h2 className="mb-3 px-6 font-display text-xl font-bold uppercase">Aperçu</h2>
          <div className="mx-auto max-w-[860px] shadow-sm"><SessionSheet session={preview.data} exercises={byId} linkExercises={false} /></div>
        </section>
      )}
    </form>
  );
}

function SortableBlock({ block: b, index, exercises, onChange, onFlagship, onRemove }: {
  block: DraftBlock; index: number; exercises: Exercise[];
  onChange: (patch: Partial<DraftBlock>) => void; onFlagship: (on: boolean) => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: b.key });
  const id = `blk-${b.key}`;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border p-3 ${b.isFlagship ? "border-brand bg-brand-soft/60" : "border-ink/10 bg-paper"} ${isDragging ? "relative z-20 shadow-lg" : ""}`}>
      <div className="flex gap-3">
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
          aria-label={`Déplacer la phase ${index + 1}`} className="cursor-grab touch-none self-start rounded px-1 pt-6 text-xl text-muted active:cursor-grabbing">⠿</button>
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_110px_1fr_auto]">
            <Select id={`${id}-phase`} label={`Phase ${index + 1}`} value={b.phase} options={phaseOptions} onChange={(phase) => onChange({ phase })} />
            <NumberInput id={`${id}-dur`} label="Durée (min)" min={1} max={120} value={b.durationMin} onChange={(durationMin) => onChange({ durationMin })} />
            <Select id={`${id}-src`} label="Contenu" value={b.source} onChange={(source) => onChange({ source })}
              options={[{ value: "exercise", label: "Exercice de la banque" }, { value: "free", label: "Contenu libre" }]} />
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
              <input type="checkbox" checked={b.isFlagship ?? false} onChange={(e) => onFlagship(e.target.checked)} className="size-4 accent-[#FFB800]" />
              Situation phare
            </label>
          </div>
          {b.source === "exercise" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor={`${id}-ex`} className={labelCls}>Exercice</label>
                <ExercisePicker id={`${id}-ex`} exercises={exercises} value={b.exerciseId} onChange={(exerciseId) => onChange({ exerciseId })} />
              </div>
              <TextInput id={`${id}-label`} label="Libellé affiché (facultatif)" maxLength={160} value={b.content} onChange={(content) => onChange({ content })}
                hint="Remplace le titre de l’exercice dans le tableau." />
            </div>
          ) : (
            <TextInput id={`${id}-content`} label="Exercice / contenu" maxLength={160} value={b.content} onChange={(content) => onChange({ content })} placeholder="ex. Lancers francs & débriefing" />
          )}
          <TextInput id={`${id}-goal`} label="Objectif & consignes clés" maxLength={240} value={b.goal} onChange={(goal) => onChange({ goal })} />
        </div>
        <button type="button" onClick={onRemove} aria-label={`Supprimer la phase ${index + 1}`} className="self-start rounded border border-ink/15 px-2 pt-0.5 text-warn">✕</button>
      </div>
    </li>
  );
}
