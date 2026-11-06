"use client";

import { useCallback, useState } from "react";
import { AGE_CATEGORIES, type Exercise } from "@/lib/schemas";
import type { Membership } from "@/lib/repo/types";
import { generateExerciseDraft } from "@/app/ia/actions";
import { ExerciseForm } from "@/components/exercise-form/ExerciseForm";
import { AiPanel } from "./AiPanel";

const sel = "w-full rounded-lg border border-ink/20 bg-paper px-2 py-2 text-sm";

/** Création d'exercice : co-pilote IA (facultatif) + formulaire, qui reçoit la proposition. */
export function NewExerciseWorkspace({ clubs, aiEnabled }: { clubs: Membership[]; aiEnabled: boolean }) {
  const [seed, setSeed] = useState<{ draft: Exercise; key: number } | null>(null);
  const onDraft = useCallback((draft: Exercise) => setSeed({ draft, key: Date.now() }), []);
  return (
    <div className="space-y-6">
      {aiEnabled ? (
        <AiPanel title="Générer avec le co-pilote" action={generateExerciseDraft} onDraft={onDraft}
          placeholder="ex. Un exercice de 2 contre 1 en sortie de dribble pour travailler la fixation, avec un défi chronométré.">
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
        </AiPanel>
      ) : (
        <p className="rounded-xl border border-dashed border-ink/20 p-4 text-sm text-muted">
          Co-pilote IA désactivé : ajoutez la variable <code>ANTHROPIC_API_KEY</code> sur le serveur pour générer des exercices.
        </p>
      )}
      <ExerciseForm key={seed?.key ?? "vide"} seed={seed?.draft} clubs={clubs} />
    </div>
  );
}
