"use client";

import type { ReactNode } from "react";

export const inputCls = "w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-ink";
export const labelCls = "mb-1 block text-xs font-medium uppercase tracking-widest text-muted";

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextInput({ id, label, value, onChange, hint, required, maxLength, placeholder }: {
  id: string; label: string; value: string | undefined; onChange: (v: string) => void;
  hint?: string; required?: boolean; maxLength?: number; placeholder?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint}>
      <input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required}
        maxLength={maxLength} placeholder={placeholder} className={inputCls} />
    </Field>
  );
}

export function TextArea({ id, label, value, onChange, hint, rows = 3 }: {
  id: string; label: string; value: string | undefined; onChange: (v: string) => void; hint?: string; rows?: number;
}) {
  return (
    <Field id={id} label={label} hint={hint}>
      <textarea id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} className={inputCls} />
    </Field>
  );
}

/** Champ numérique : une saisie vide donne NaN, que Zod signale comme « Nombre attendu ». */
export function NumberInput({ id, label, value, onChange, min, max }: {
  id: string; label: string; value: number | undefined; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <Field id={id} label={label}>
      <input id={id} type="number" inputMode="numeric" min={min} max={max}
        value={value === undefined || Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))} className={inputCls} />
    </Field>
  );
}

export function Select<T extends string>({ id, label, value, onChange, options }: {
  id: string; label: string; value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[];
}) {
  return (
    <Field id={id} label={label}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={inputCls}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

/** Liste de chaînes saisie « une par ligne ». */
export function LinesInput({ id, label, value, onChange, hint, rows = 3 }: {
  id: string; label: string; value: string[]; onChange: (v: string[]) => void; hint?: string; rows?: number;
}) {
  return (
    <TextArea id={id} label={label} rows={rows} hint={hint ?? "Une entrée par ligne."}
      value={value.join("\n")} onChange={(v) => onChange(v.split("\n").map((s) => s.trimStart()).filter((s, i, a) => s !== "" || i === a.length - 1))} />
  );
}

/** Liste éditable d'éléments structurés : ajout, suppression, réordonnancement. */
export function ListEditor<T>({ legend, items, onChange, render, create, max, addLabel = "Ajouter" }: {
  legend: string; items: T[]; onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  create: () => T; max?: number; addLabel?: string;
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    const [it] = next.splice(i, 1);
    next.splice(i + d, 0, it!);
    onChange(next);
  };
  return (
    <fieldset className="space-y-3">
      <legend className={labelCls}>{legend}</legend>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-lg border border-ink/10 p-3">
          <span className="w-6 pt-6 font-display text-xl font-bold text-brand" aria-hidden="true">{i + 1}</span>
          <div className="flex-1 space-y-2">
            {render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
          </div>
          <div className="flex flex-col gap-1 pt-5 text-xs">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Monter l'élément ${i + 1}`} className="rounded border border-ink/15 px-2 disabled:opacity-30">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Descendre l'élément ${i + 1}`} className="rounded border border-ink/15 px-2 disabled:opacity-30">↓</button>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Supprimer l'élément ${i + 1}`} className="rounded border border-ink/15 px-2 text-warn">✕</button>
          </div>
        </div>
      ))}
      {(max === undefined || items.length < max) && (
        <button type="button" onClick={() => onChange([...items, create()])} className="rounded-lg border border-dashed border-ink/30 px-3 py-1.5 text-sm hover:border-ink">
          + {addLabel}
        </button>
      )}
    </fieldset>
  );
}
