"use client";

import { useCallback, useRef, useState } from "react";
import { AGE_CATEGORIES, SpaceSchema, type Exercise } from "@/lib/schemas";
import type { Membership } from "@/lib/repo/types";
import { generateExerciseDraft } from "@/app/ia/actions";
import { manualExercisePrompt } from "@/lib/ai/manual";
import { validateGeneratedExercise } from "@/lib/ai/validate";
import type { ExerciseBrief } from "@/lib/ai/prompts";
import { ExerciseForm } from "@/components/exercise-form/ExerciseForm";
import { AiPanel } from "./AiPanel";
import { ManualAiPanel } from "./ManualAiPanel";

const sel = "w-full rounded-lg border border-ink/20 bg-paper px-2 py-2 text-sm";
const PLACEHOLDER = "ex. Un exercice de 2 contre 1 en sortie de dribble pour travailler la fixation, avec un défi chronométré.";

/** Contraintes facultatives, communes aux deux modes d'IA. */
function ExerciseConstraints() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <label className="text-xs font-medium uppercase tracking-widest text-muted">Catégorie
        <select name="category" className={sel} defaultValue=""><option value="">Indifférent</option>{AGE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </label>
      <label className="text-xs font-medium uppercase tracking-widest text-muted">Espace
        <select name="space" className={sel} defaultValue=""><option value="">Indifférent</option><option value="demi-terrain">Demi-terrain</option><option value="tout-terrain">Tout terrain</option></select>
      </label>
      <label className="text-xs font-medium uppercase tracking-widest text-muted">Joueurs
        <input name="players" type="number" min={1} max={40} className={sel} />
      </label>
      <label className="text-xs font-medium uppercase tracking-widest text-muted">Durée (min)
        <input name="durationMin" type="number" min={3} max={90} className={sel} />
      </label>
    </div>
  );
}

function briefFrom(form: FormData): ExerciseBrief | null {
  const brief = String(form.get("brief") ?? "").trim();
  if (!brief) return null;
  const num = (k: string) => (form.get(k) ? Number(form.get(k)) : undefined);
  const category = AGE_CATEGORIES.find((c) => c === form.get("category"));
  const space = SpaceSchema.safeParse(form.get("space"));
  return { brief, category, space: space.success ? space.data : undefined, players: num("players"), durationMin: num("durationMin") };
}

/**
 * Création ou modification d'un exercice avec l'aide de l'IA : appel direct (si une clé
 * API est configurée) ou copier-coller gratuit ; la proposition remplit le formulaire.
 */
export function ExerciseWorkspace({ clubs, aiEnabled, initial }: { clubs: Membership[]; aiEnabled: boolean; initial?: Exercise }) {
  const [seed, setSeed] = useState<{ draft: Exercise; key: number } | null>(null);
  const current = useRef<Record<string, unknown> | null>(null);
  const onPayloadChange = useCallback((p: Record<string, unknown> | null) => { current.current = p; }, []);
  // En modification, l'adresse (slug) de la fiche ne change pas.
  const onDraft = useCallback((draft: Exercise) => setSeed({ draft: initial ? { ...draft, slug: initial.slug } : draft, key: Date.now() }), [initial]);

  const buildPrompt = (form: FormData, completing: boolean) => {
    const brief = briefFrom(form);
    if (!completing && (!brief || brief.brief.length < 10)) return { error: "Décrivez l’exercice en une phrase (10 caractères minimum), ou cochez « Compléter la fiche en cours »." };
    return { prompt: manualExercisePrompt(brief, completing ? current.current ?? undefined : undefined) };
  };

  const formProps = seed
    ? initial ? { initial: { ...seed.draft, id: initial.id } } : { seed: seed.draft }
    : initial ? { initial } : {};

  return (
    <div className="space-y-6">
      {aiEnabled && (
        <AiPanel title="Générer avec le co-pilote" action={generateExerciseDraft} onDraft={onDraft} placeholder={PLACEHOLDER}>
          <ExerciseConstraints />
        </AiPanel>
      )}
      <ManualAiPanel buildPrompt={buildPrompt} validate={validateGeneratedExercise} onDraft={onDraft}
        canComplete defaultOpen={!aiEnabled && !initial} placeholder={PLACEHOLDER}>
        <ExerciseConstraints />
      </ManualAiPanel>
      <ExerciseForm key={seed?.key ?? "depart"} {...formProps} clubs={clubs} onPayloadChange={onPayloadChange} />
    </div>
  );
}
