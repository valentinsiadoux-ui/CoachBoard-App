import Link from "next/link";
import { Logo } from "@/components/exercise/parts";
import { getViewer } from "@/lib/repo";
import { missingSupabaseConfig } from "@/lib/supabase/config";

/** Barre de navigation (masquée à l'impression). */
export async function AppHeader() {
  const viewer = await getViewer();
  return (
    <header className="no-print border-b border-ink/10">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <Link href="/" aria-label="Accueil CoachBoard"><Logo /></Link>
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/" className="hover:text-brand-deep">Banque d’exercices</Link>
          <Link href="/seances" className="hover:text-brand-deep">Séances</Link>
          {viewer?.mode === "supabase" && <Link href="/club" className="hover:text-brand-deep">Mon club</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {viewer?.mode === "demo" && (
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-deep">
                Mode démonstration
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-ink/15 bg-paper p-3 text-xs shadow-lg">
                <p className="mb-1 font-semibold">Supabase n’est pas configuré : données de démonstration en lecture seule.</p>
                <p className="mb-1">Variable(s) manquante(s) sur le serveur :</p>
                <ul className="list-disc pl-4 font-mono">{missingSupabaseConfig().map((v) => <li key={v}>{v}</li>)}</ul>
                <p className="mt-2 text-muted">Après les avoir ajoutées sur Vercel, relancez un déploiement.</p>
              </div>
            </details>
          )}
          {viewer?.mode === "supabase" && (
            <>
              <span className="text-muted">{viewer.email}</span>
              <form action="/auth/deconnexion" method="post">
                <button className="underline-offset-4 hover:underline">Se déconnecter</button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
