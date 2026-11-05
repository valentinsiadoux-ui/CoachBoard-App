import type { ReactNode } from "react";

export function SectionTitle({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-baseline gap-2 font-display text-xl font-bold uppercase tracking-wide">
      <span className="text-brand">{n}</span>
      {children}
    </h2>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle cx="13" cy="13" r="11" fill="none" stroke="#FFB800" strokeWidth="2" />
        <path d="M13 2v22M2 13h22M5 5c5 5 11 11 16 16M21 5C16 10 10 16 5 21" fill="none" stroke="#FFB800" strokeWidth="1.5" />
      </svg>
      <span>Coach<span className="text-brand">Board</span></span>
    </div>
  );
}

export function Pill({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-medium ${active ? "border-ink bg-ink text-white" : "border-ink/70"}`}>
      {children}
    </span>
  );
}
