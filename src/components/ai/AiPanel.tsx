"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import type { AiState } from "@/app/ia/actions";

type Props<T> = {
  title: string;
  action: (prev: AiState<T>, form: FormData) => Promise<AiState<T>>;
  onDraft: (draft: T) => void;
  /** Champs propres à la demande (catégorie, durée…), en plus de la description. */
  children?: ReactNode;
  placeholder: string;
};

/** Panneau de génération : description libre + contraintes, brouillon transmis au formulaire. */
export function AiPanel<T>({ title, action, onDraft, children, placeholder }: Props<T>) {
  const [state, formAction, pending] = useActionState<AiState<T>, FormData>(action, { status: "idle" });
  const lastVersion = useRef<number | null>(null);

  useEffect(() => {
    if (state.status === "ok" && state.version !== lastVersion.current) {
      lastVersion.current = state.version;
      onDraft(state.draft);
    }
  }, [state, onDraft]);

  // Envoi manuel : React ne vide pas le formulaire, la demande reste modifiable après une erreur.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  return (
    <details className="group rounded-xl border border-brand/60 bg-brand-soft/40 p-5" open>
      <summary className="cursor-pointer list-none font-display text-xl font-bold uppercase">
        <span aria-hidden="true">✦ </span>{title}
        <span className="ml-2 font-sans text-xs font-normal normal-case text-muted group-open:hidden">(cliquer pour ouvrir)</span>
      </summary>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm font-medium" htmlFor="ai-brief">Votre demande</label>
        <textarea id="ai-brief" name="brief" rows={3} required minLength={10} maxLength={1000} placeholder={placeholder}
          className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm" />
        {children}
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Génération en cours…" : "Générer une proposition"}
          </button>
          <span className="text-xs text-muted" aria-live="polite">
            {pending
              ? "Comptez 30 secondes à 2 minutes : l’IA rédige puis vérifie la fiche."
              : state.status === "ok"
                ? `Proposition chargée dans le formulaire ci-dessous : relisez-la avant d’enregistrer.${state.remaining !== undefined ? ` (${state.remaining} génération(s) restante(s) aujourd’hui)` : ""}`
                : "Rien n’est enregistré automatiquement."}
          </span>
        </div>
        {state.status === "error" && (
          <div role="alert" className="rounded-lg bg-warn/10 p-3 text-sm text-warn">
            <p className="font-semibold">{state.message}</p>
            {state.problems && (
              <ul className="mt-1 list-disc pl-5 text-xs">{state.problems.slice(0, 6).map((p, i) => <li key={i}>{p}</li>)}</ul>
            )}
            {state.remaining !== undefined && <p className="mt-1 text-xs">{state.remaining} génération(s) restante(s) aujourd’hui.</p>}
          </div>
        )}
      </form>
    </details>
  );
}
