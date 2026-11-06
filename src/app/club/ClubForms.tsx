"use client";

import { useActionState } from "react";
import { createClub, joinClub, type ClubFormState } from "./actions";

const input = "w-full rounded-lg border border-ink/20 px-3 py-2";

function SimpleForm({ action, id, label, placeholder, button }: {
  action: (s: ClubFormState, f: FormData) => Promise<ClubFormState>;
  id: string; label: string; placeholder: string; button: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <input id={id} name={id === "club-name" ? "name" : "code"} required placeholder={placeholder} className={input}
          aria-invalid={Boolean(state.error)} aria-describedby={state.error ? `${id}-err` : undefined} />
        <button disabled={pending} className="shrink-0 rounded-lg bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60">{button}</button>
      </div>
      {state.error && <p id={`${id}-err`} className="text-sm text-warn">{state.error}</p>}
    </form>
  );
}

export function ClubForms() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-xl border border-ink/10 p-5">
        <h2 className="mb-3 font-display text-2xl font-bold uppercase">Créer un club</h2>
        <SimpleForm action={createClub} id="club-name" label="Nom du club" placeholder="ex. BC Exemple" button="Créer" />
        <p className="mt-2 text-xs text-muted">Vous en serez administrateur.</p>
      </section>
      <section className="rounded-xl border border-ink/10 p-5">
        <h2 className="mb-3 font-display text-2xl font-bold uppercase">Rejoindre un club</h2>
        <SimpleForm action={joinClub} id="club-code" label="Code d’invitation" placeholder="code fourni par un admin" button="Rejoindre" />
      </section>
    </div>
  );
}
