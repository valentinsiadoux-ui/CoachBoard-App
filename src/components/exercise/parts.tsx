import type { ReactNode } from "react";

export function SectionTitle({ n, icon, className = "mb-3", children }: { n: string; icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <h2 className={`flex items-baseline gap-2 font-display text-xl font-bold uppercase tracking-wide ${className}`}>
      {icon}
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

export function BulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="self-center">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Affiche le titre en mettant `accent` (s'il y figure) en couleur de marque. */
export function AccentTitle({ title, accent }: { title: string; accent?: string }) {
  const at = accent ? title.indexOf(accent) : -1;
  if (!accent || at < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, at)}
      <span className="text-brand">{accent}</span>
      {title.slice(at + accent.length)}
    </>
  );
}

export function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="inline-block align-[-2px]">
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
