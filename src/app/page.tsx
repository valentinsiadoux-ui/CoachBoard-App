import Link from "next/link";
import { exercises } from "@/data/exercises";
import { Logo } from "@/components/exercise/parts";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Logo />
      <h1 className="mt-8 font-display text-4xl font-bold uppercase">Banque d’exercices</h1>
      <p className="mt-1 text-muted">Exercices de démonstration. La banque complète arrive à l’étape 2.</p>
      <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
        {exercises.map((e) => (
          <li key={e.id}>
            <Link href={`/exercices/${e.slug}`} className="flex items-center justify-between py-4 hover:bg-panel">
              <span>
                <span className="block font-display text-2xl font-semibold uppercase">{e.title}</span>
                <span className="text-sm text-muted">
                  {e.params.space === "demi-terrain" ? "Demi-terrain" : "Tout terrain"} · {e.ageRange.from} → {e.ageRange.to} · {e.params.durationMin.min}–{e.params.durationMin.max} min
                </span>
              </span>
              <span aria-hidden="true" className="text-brand">Ouvrir</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
