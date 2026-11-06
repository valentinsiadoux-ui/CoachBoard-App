"use client";

import { useCallback, useState } from "react";
import { AGE_CATEGORIES, type Exercise, type Session } from "@/lib/schemas";
import type { Membership } from "@/lib/repo/types";
import { generateSessionDraft } from "@/app/ia/actions";
import { SessionForm } from "@/components/session-form/SessionForm";
import { AiPanel } from "./AiPanel";

const sel = "w-full rounded-lg border border-ink/20 bg-paper px-2 py-2 text-sm";

/** Création de séance : co-pilote IA (facultatif) + concepteur, qui reçoit la proposition. */
export function NewSessionWorkspace({ clubs, nextNumbers, exercises, aiEnabled }: {
  clubs: Membership[]; nextNumbers: Record<string, number>; exercises: Exercise[]; aiEnabled: boolean;
}) {
  const [seed, setSeed] = useState<{ draft: Session; key: number } | null>(null);
  const onDraft = useCallback((draft: Session) => setSeed({ draft, key: Date.now() }), []);
  return (
    <div className="space-y-6">
      {aiEnabled ? (
        <AiPanel title="Générer avec le co-pilote" action={generateSessionDraft} onDraft={onDraft}
          placeholder="ex. Séance sur la relance rapide et le jeu en transition, en réutilisant nos exercices de contre-attaque.">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {clubs.length > 1 ? (
              <label className="text-xs font-medium uppercase tracking-widest text-muted">Club
                <select name="clubId" className={sel}>{clubs.map((c) => <option key={c.clubId} value={c.clubId}>{c.clubName}</option>)}</select>
              </label>
            ) : (
              <input type="hidden" name="clubId" value={clubs[0]?.clubId ?? ""} />
            )}
            <label className="text-xs font-medium uppercase tracking-widest text-muted">Catégorie
              <select name="category" className={sel} defaultValue="U15">{AGE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="text-xs font-medium uppercase tracking-widest text-muted">Équipe
              <input name="team" maxLength={40} placeholder="ex. U15 Garçons" className={sel} />
            </label>
            <label className="text-xs font-medium uppercase tracking-widest text-muted">Joueurs
              <input name="players" type="number" min={1} max={40} defaultValue={12} required className={sel} />
            </label>
            <label className="text-xs font-medium uppercase tracking-widest text-muted">Durée (min)
              <input name="plannedDurationMin" type="number" min={20} max={240} defaultValue={90} required className={sel} />
            </label>
          </div>
        </AiPanel>
      ) : (
        <p className="rounded-xl border border-dashed border-ink/20 p-4 text-sm text-muted">
          Co-pilote IA désactivé : ajoutez la variable <code>ANTHROPIC_API_KEY</code> sur le serveur pour générer des séances.
        </p>
      )}
      <SessionForm key={seed?.key ?? "vide"} seed={seed?.draft} clubs={clubs} nextNumbers={nextNumbers} exercises={exercises} />
    </div>
  );
}
