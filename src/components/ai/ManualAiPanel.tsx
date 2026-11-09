"use client";

import { useRef, useState, type ReactNode } from "react";
import { CHAT_URL, extractJson, manualRepairPrompt } from "@/lib/ai/manual";
import type { Validation } from "@/lib/ai/repair";

type Props<T> = {
  /** Construit la demande à copier ; `null` + message si les champs sont insuffisants. */
  buildPrompt: (form: FormData, completing: boolean) => { prompt: string } | { error: string };
  validate: (raw: unknown) => Validation<T>;
  onDraft: (draft: T) => void;
  /** Le formulaire contient déjà quelque chose à compléter. */
  canComplete: boolean;
  /** Libellé de la case « compléter » (ex. « la fiche en cours », « la séance en cours »). */
  completeLabel?: string;
  defaultOpen: boolean;
  placeholder: string;
  children?: ReactNode;
};

type Status =
  | { kind: "idle" }
  | { kind: "copied"; length: number; manual?: string }
  | { kind: "imported" }
  | { kind: "problems"; message: string; problems: string[]; repair: string };

const btn = "rounded-lg border border-ink/25 bg-paper px-3 py-2 text-sm font-semibold hover:border-ink";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * IA gratuite par copier-coller : 1. copier la demande, 2. la coller dans claude.ai
 * (ou un autre assistant), 3. recoller la réponse, validée comme en mode API.
 */
export function ManualAiPanel<T>({ buildPrompt, validate, onDraft, canComplete, completeLabel = "la fiche en cours", defaultOpen, placeholder, children }: Props<T>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** true : copié ; "manuel" : copie bloquée, texte affiché à sélectionner. */
  const [repairCopied, setRepairCopied] = useState<boolean | "manuel">(false);

  const onCopyPrompt = async () => {
    setError(null);
    const data = new FormData(formRef.current!);
    const built = buildPrompt(data, data.get("complete") === "on");
    if ("error" in built) return setError(built.error);
    const ok = await copy(built.prompt);
    setStatus({ kind: "copied", length: built.prompt.length, manual: ok ? undefined : built.prompt });
  };

  const onImport = () => {
    setError(null);
    setRepairCopied(false);
    const extracted = extractJson(answer);
    if (!extracted.ok) {
      return setStatus({ kind: "problems", message: extracted.error, problems: [], repair: manualRepairPrompt(["La réponse n'est pas un JSON valide ou elle est incomplète."]) });
    }
    const v = validate(extracted.value);
    if (v.ok) {
      onDraft(v.data);
      setAnswer("");
      return setStatus({ kind: "imported" });
    }
    setStatus({ kind: "problems", message: "La proposition ne passe pas la validation.", problems: v.problems, repair: manualRepairPrompt(v.problems) });
  };

  return (
    <details className="group rounded-xl border border-ink/15 bg-panel/60 p-5" open={defaultOpen}>
      <summary className="cursor-pointer list-none font-display text-xl font-bold uppercase">
        <span aria-hidden="true">✦ </span>IA par copier-coller
        <span className="ml-2 font-sans text-xs font-normal normal-case text-muted">gratuit, avec votre compte claude.ai ou un autre assistant</span>
      </summary>
      <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="mt-4 space-y-4">
        <ol className="space-y-4">
          <li className="space-y-3">
            <p className="text-sm font-semibold">1. Décrivez ce que vous voulez, puis copiez la demande</p>
            <textarea name="brief" rows={3} maxLength={1000} placeholder={placeholder} aria-label="Votre demande"
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm" />
            {children}
            {canComplete && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="complete" className="size-4" />
                Compléter {completeLabel} (l’IA garde ce qui est déjà rempli)
              </label>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onCopyPrompt} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">Copier la demande</button>
              <a href={CHAT_URL} target="_blank" rel="noopener noreferrer" className={btn}>Ouvrir claude.ai ↗</a>
              <span className="text-xs text-muted" aria-live="polite">
                {status.kind === "copied" && !status.manual && `Demande copiée (${status.length.toLocaleString("fr-FR")} caractères) : collez-la dans une nouvelle conversation.`}
              </span>
            </div>
            {error && <p role="alert" className="text-sm text-warn">{error}</p>}
            {status.kind === "copied" && status.manual && (
              <div>
                <p className="mb-1 text-xs text-warn">Copie automatique impossible dans ce navigateur : sélectionnez le texte ci-dessous (Ctrl+A) et copiez-le.</p>
                <textarea readOnly rows={6} value={status.manual} onFocus={(e) => e.currentTarget.select()} aria-label="Demande à copier"
                  className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 font-mono text-xs" />
              </div>
            )}
          </li>
          <li className="space-y-3">
            <p className="text-sm font-semibold">2. Collez ici la réponse de l’IA, puis importez-la</p>
            <textarea rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} aria-label="Réponse de l’IA"
              placeholder="Collez toute la réponse (le JSON est retrouvé automatiquement)."
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 font-mono text-xs" />
            <button type="button" onClick={onImport} disabled={!answer.trim()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
              Importer dans le formulaire
            </button>
            <div aria-live="polite">
              {status.kind === "imported" && (
                <p className="rounded-lg bg-good/10 p-3 text-sm text-good">Proposition chargée dans le formulaire ci-dessous : relisez-la avant d’enregistrer.</p>
              )}
              {status.kind === "problems" && (
                <div role="alert" className="space-y-2 rounded-lg bg-warn/10 p-3 text-sm text-warn">
                  <p className="font-semibold">{status.message}</p>
                  {status.problems.length > 0 && <ul className="list-disc pl-5 text-xs">{status.problems.slice(0, 8).map((p, i) => <li key={i}>{p}</li>)}</ul>}
                  <p className="text-ink">3. Copiez ce message de correction, collez-le dans <strong>la même conversation</strong>, puis recollez la nouvelle réponse ci-dessus.</p>
                  <button type="button" className={btn} onClick={async () => setRepairCopied((await copy(status.repair)) || "manuel")}>
                    {repairCopied === true ? "Message copié ✓" : "Copier le message de correction"}
                  </button>
                  {repairCopied === "manuel" && (
                    <textarea readOnly rows={4} value={status.repair} onFocus={(e) => e.currentTarget.select()} aria-label="Message de correction à copier"
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 font-mono text-xs text-ink" />
                  )}
                </div>
              )}
            </div>
          </li>
        </ol>
      </form>
    </details>
  );
}
