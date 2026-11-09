"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AGE_CATEGORIES, type Exercise, type Session } from "@/lib/schemas";
import type { Membership } from "@/lib/repo/types";
import { generateSessionDraft } from "@/app/ia/actions";
import { manualSessionPrompt } from "@/lib/ai/manual";
import { validateGeneratedSession } from "@/lib/ai/validate";
import { ageRank } from "@/lib/filters";
import { SessionForm } from "@/components/session-form/SessionForm";
import { AiPanel } from "./AiPanel";
import { ManualAiPanel } from "./ManualAiPanel";

const sel = "w-full rounded-lg border border-ink/20 bg-paper px-2 py-2 text-sm";
const PLACEHOLDER = "ex. Séance sur la relance rapide et le jeu en transition, en réutilisant nos exercices de contre-attaque.";

function SessionConstraints({ clubs, withClub, defaults }: { clubs: Membership[]; withClub: boolean; defaults?: Session }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {withClub && clubs.length > 1 ? (
        <label className="text-xs font-medium uppercase tracking-widest text-muted">Club
          <select name="clubId" className={sel}>{clubs.map((c) => <option key={c.clubId} value={c.clubId}>{c.clubName}</option>)}</select>
        </label>
      ) : (
        <input type="hidden" name="clubId" value={clubs[0]?.clubId ?? ""} />
      )}
      <label className="text-xs font-medium uppercase tracking-widest text-muted">Catégorie
        <select name="category" className={sel} defaultValue={defaults?.category ?? "U15"}>{AGE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </label>
      <label className="text-xs font-medium uppercase tracking-widest text-muted">Équipe
        <input name="team" maxLength={40} placeholder="ex. U15 Garçons" defaultValue={defaults?.team} className={sel} />
      </label>
      <label className="text-xs font-medium uppercase tracking-widest text-muted">Joueurs
        <input name="players" type="number" min={1} max={40} defaultValue={defaults?.playersCount ?? 12} required className={sel} />
      </label>
      <label className="text-xs font-medium uppercase tracking-widest text-muted">Durée (min)
        <input name="plannedDurationMin" type="number" min={20} max={240} defaultValue={defaults?.plannedDurationMin ?? 90} required className={sel} />
      </label>
    </div>
  );
}

/**
 * Création ou modification d'une séance avec l'aide de l'IA (appel direct si une clé API
 * est configurée, sinon copier-coller gratuit) ; la proposition remplit le concepteur.
 */
export function SessionWorkspace({ clubs, nextNumbers, exercises, aiEnabled, initial }: {
  clubs: Membership[]; nextNumbers: Record<string, number>; exercises: Exercise[]; aiEnabled: boolean; initial?: Session;
}) {
  const [seed, setSeed] = useState<{ draft: Session; key: number } | null>(null);
  const current = useRef<Record<string, unknown> | null>(null);
  const onPayloadChange = useCallback((p: Record<string, unknown>) => { current.current = p; }, []);
  // En modification, le numéro de séance est conservé.
  const onDraft = useCallback((draft: Session) => setSeed({ draft: initial ? { ...draft, number: initial.number } : draft, key: Date.now() }), [initial]);
  const allowed = useMemo(() => new Set(exercises.map((e) => e.id)), [exercises]);
  const ctx = useRef<{ number: number; planned?: number }>({ number: 1 });

  const buildPrompt = (form: FormData, completing: boolean) => {
    const brief = String(form.get("brief") ?? "").trim();
    if (!completing && brief.length < 10) return { error: "Décrivez l’objectif de la séance (10 caractères minimum), ou cochez « Compléter la séance en cours »." };
    const category = AGE_CATEGORIES.find((c) => c === form.get("category")) ?? "U15";
    const players = Number(form.get("players")) || 12;
    const planned = Number(form.get("plannedDurationMin")) || 90;
    const clubId = String(form.get("clubId") ?? clubs[0]?.clubId ?? "");
    ctx.current = { number: initial?.number ?? nextNumbers[clubId] ?? 1, planned };
    // Exercices adaptés à la catégorie d'abord (toute la banque s'il y en a trop peu).
    const rank = ageRank(category);
    const fitting = exercises.filter((e) => ageRank(e.ageRange.from) <= rank && ageRank(e.ageRange.to) >= rank);
    const bank = (fitting.length >= 5 ? fitting : exercises).slice(0, 120);
    return {
      prompt: manualSessionPrompt(
        { brief: brief || "Compléter la séance en cours.", category, team: String(form.get("team") ?? "").trim() || undefined, players, plannedDurationMin: planned },
        bank,
        completing ? current.current ?? undefined : undefined,
      ),
    };
  };

  const validate = (raw: unknown) =>
    validateGeneratedSession(raw, { number: ctx.current.number, allowedExerciseIds: allowed, plannedDurationMin: ctx.current.planned });

  const formProps = seed
    ? initial ? { initial: { ...seed.draft, id: initial.id } } : { seed: seed.draft }
    : initial ? { initial } : {};

  return (
    <div className="space-y-6">
      {aiEnabled && !initial && (
        <AiPanel title="Générer avec le co-pilote" action={generateSessionDraft} onDraft={onDraft} placeholder={PLACEHOLDER}>
          <SessionConstraints clubs={clubs} withClub />
        </AiPanel>
      )}
      <ManualAiPanel buildPrompt={buildPrompt} validate={validate} onDraft={onDraft}
        canComplete completeLabel="la séance en cours" defaultOpen={!aiEnabled && !initial} placeholder={PLACEHOLDER}>
        <SessionConstraints clubs={clubs} withClub={!initial} defaults={initial} />
      </ManualAiPanel>
      <SessionForm key={seed?.key ?? "depart"} {...formProps} clubs={clubs} nextNumbers={nextNumbers} exercises={exercises} onPayloadChange={onPayloadChange} />
    </div>
  );
}
