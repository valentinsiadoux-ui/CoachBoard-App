import { redirect } from "next/navigation";
import { getViewer } from "@/lib/repo";
import { listMyClubs } from "@/lib/repo/clubs";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ClubForms } from "./ClubForms";
import { regenerateInvite, removeMember, setRole } from "./actions";

/** Dépend de la session : jamais pré-rendue. */
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ erreur?: string }> };

const btn = "rounded-md border border-ink/20 px-2 py-1 text-xs hover:border-ink";

export default async function ClubPage({ searchParams }: Props) {
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "supabase") redirect("/");
  const { erreur } = await searchParams;
  const clubs = await listMyClubs(await createSupabaseServer());

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <h1 className="font-display text-4xl font-bold uppercase">Mon club</h1>
      {erreur && <p role="alert" className="rounded-lg bg-warn/10 p-3 text-sm text-warn">{erreur}</p>}

      {clubs.map((club) => {
        const isAdmin = club.members.some((m) => m.userId === viewer.userId && m.role === "admin");
        return (
          <section key={club.id} className="rounded-xl border border-ink/10 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-3xl font-bold uppercase">{club.name}</h2>
              {isAdmin && (
                <form action={regenerateInvite} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="clubId" value={club.id} />
                  <span className="text-muted">Code d’invitation :</span>
                  <code className="rounded bg-panel px-2 py-1 font-mono">{club.inviteCode}</code>
                  <button className={btn} title="L'ancien code ne fonctionnera plus">Renouveler</button>
                </form>
              )}
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted">
                <tr><th className="py-2">Membre</th><th>Rôle</th><th className="sr-only">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {club.members.map((m) => {
                  const self = m.userId === viewer.userId;
                  return (
                    <tr key={m.userId}>
                      <td className="py-2">{m.displayName}{self && <span className="text-muted"> (vous)</span>}</td>
                      <td>{m.role === "admin" ? "Admin" : "Coach"}</td>
                      <td className="flex justify-end gap-2 py-2">
                        {isAdmin && !self && (
                          <form action={setRole}>
                            <input type="hidden" name="clubId" value={club.id} />
                            <input type="hidden" name="userId" value={m.userId} />
                            <input type="hidden" name="role" value={m.role === "admin" ? "coach" : "admin"} />
                            <button className={btn}>{m.role === "admin" ? "Passer coach" : "Passer admin"}</button>
                          </form>
                        )}
                        {(isAdmin || self) && (
                          <form action={removeMember}>
                            <input type="hidden" name="clubId" value={club.id} />
                            <input type="hidden" name="userId" value={m.userId} />
                            <button className={`${btn} text-warn`}>{self ? "Quitter le club" : "Retirer"}</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      <ClubForms />
    </main>
  );
}
