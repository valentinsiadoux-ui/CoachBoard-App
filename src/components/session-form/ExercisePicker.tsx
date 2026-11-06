"use client";

import { useMemo, useRef, useState } from "react";
import type { Exercise } from "@/lib/schemas";

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Choix d'un exercice de la banque dans une fenêtre modale (recherche + espace). */
export function ExercisePicker({ id, exercises, value, onChange }: {
  id: string; exercises: Exercise[]; value: string | undefined; onChange: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [space, setSpace] = useState("");
  const selected = exercises.find((e) => e.id === value);

  const results = useMemo(() => {
    const words = normalize(q).split(/\s+/).filter(Boolean);
    return exercises.filter((e) => {
      if (space && e.params.space !== space) return false;
      const hay = normalize([e.title, e.kicker ?? "", e.params.space, ...e.themes].join(" "));
      return words.every((w) => hay.includes(w));
    });
  }, [exercises, q, space]);

  return (
    <>
      <button type="button" id={id} onClick={() => dialog.current?.showModal()}
        className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-left text-sm hover:border-ink">
        {selected ? (
          <>
            <strong>{selected.title}</strong>{" "}
            <span className="text-muted">· {selected.params.space === "demi-terrain" ? "demi-terrain" : "tout-terrain"} · {selected.params.durationMin.min}–{selected.params.durationMin.max} min</span>
          </>
        ) : (
          <span className="text-muted">Choisir un exercice de la banque…</span>
        )}
      </button>
      <dialog ref={dialog} aria-labelledby={`${id}-title`}
        className="w-[min(640px,calc(100vw-2rem))] rounded-xl p-0 backdrop:bg-ink/40"
        onClose={() => setQ("")}>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 id={`${id}-title`} className="font-display text-2xl font-bold uppercase">Choisir un exercice</h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Fermer" className="px-2 text-xl">✕</button>
          </div>
          <div className="flex gap-2">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (titre, thème…)" aria-label="Rechercher"
              className="flex-1 rounded-lg border border-ink/20 px-3 py-2 text-sm" autoFocus />
            <select value={space} onChange={(e) => setSpace(e.target.value)} aria-label="Espace" className="rounded-lg border border-ink/20 px-2 text-sm">
              <option value="">Tout espace</option>
              <option value="demi-terrain">Demi-terrain</option>
              <option value="tout-terrain">Tout terrain</option>
            </select>
          </div>
          <ul className="max-h-[50vh] divide-y divide-ink/10 overflow-y-auto">
            {results.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => { onChange(e.id); dialog.current?.close(); }}
                  className={`w-full px-2 py-2 text-left hover:bg-panel ${e.id === value ? "bg-brand-soft" : ""}`}>
                  <span className="block font-semibold">{e.title} <span className="font-normal text-muted">· {e.params.space === "demi-terrain" ? "Demi-terrain" : "Tout terrain"}</span></span>
                  <span className="text-xs text-muted">
                    {e.ageRange.from} → {e.ageRange.to} · {e.params.durationMin.min}–{e.params.durationMin.max} min · {e.params.players.min}–{e.params.players.max} joueurs{e.themes.length ? ` · ${e.themes.join(", ")}` : ""}
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="py-6 text-center text-sm text-muted">Aucun exercice trouvé.</li>}
          </ul>
        </div>
      </dialog>
    </>
  );
}
