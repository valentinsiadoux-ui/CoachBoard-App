import Link from "next/link";
import type { ExerciseEntry } from "@/lib/repo";
import { CourtDiagram } from "@/components/court/CourtDiagram";
import { DIFFICULTY_LABELS } from "@/lib/filters";

export function ExerciseCard({ entry }: { entry: ExerciseEntry }) {
  const ex = entry.exercise;
  const frame = ex.diagram.frames[ex.diagram.frames.length - 1]!;
  return (
    <li className="group overflow-hidden rounded-xl border border-ink/10 bg-paper transition hover:border-ink/40 hover:shadow-sm">
      <Link href={`/exercices/${ex.slug}`} className="flex h-full flex-col">
        <div className="bg-panel p-3">
          <CourtDiagram court={ex.diagram.court} frame={frame} className={`mx-auto ${ex.diagram.court === "full" ? "w-full" : "h-40"}`} />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          {ex.kicker && <p className="text-xs uppercase tracking-widest text-muted">{ex.kicker}</p>}
          <h2 className="font-display text-2xl font-bold uppercase leading-tight">
            {ex.title} <span className="text-base text-ink/60">· {ex.params.space === "demi-terrain" ? "Demi-terrain" : "Tout terrain"}</span>
          </h2>
          <p className="text-sm text-muted">
            {ex.ageRange.from} → {ex.ageRange.to} · {ex.params.durationMin.min}–{ex.params.durationMin.max} min · {ex.params.players.min}–{ex.params.players.max} joueurs · {DIFFICULTY_LABELS[ex.difficulty]}
          </p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${entry.scope === "club" ? "bg-brand-soft text-brand-deep" : "bg-panel text-muted"}`}>
              {entry.scope === "club" ? entry.clubName ?? "Club" : "Bibliothèque CoachBoard"}
            </span>
            {ex.themes.map((t) => <span key={t} className="rounded-full border border-ink/15 px-2.5 py-0.5 text-xs">{t}</span>)}
          </div>
        </div>
      </Link>
    </li>
  );
}
