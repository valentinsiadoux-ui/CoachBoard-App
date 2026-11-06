import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/safe-redirect";
import { LoginForm } from "./LoginForm";

/** Dépend de la session : jamais pré-rendue. */
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ suite?: string; erreur?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/");
  const { suite, erreur } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 font-display text-4xl font-bold uppercase">Connexion</h1>
      <p className="mb-6 text-muted">Recevez un lien de connexion par e-mail, sans mot de passe.</p>
      {erreur && <p role="alert" className="mb-4 rounded-lg bg-warn/10 p-3 text-sm text-warn">Le lien est invalide ou a expiré. Demandez-en un nouveau.</p>}
      <LoginForm next={safeNext(suite)} />
    </main>
  );
}
