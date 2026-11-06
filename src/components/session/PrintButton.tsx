"use client";

/** Impression navigateur (A4 portrait). L'export PDF dédié arrive à l'étape 4. */
export function PrintButton({ className }: { className?: string }) {
  return <button type="button" onClick={() => window.print()} className={className}>Imprimer</button>;
}
