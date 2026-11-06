import Link from "next/link";
import type { SessionEntry, Viewer } from "@/lib/repo";
import { deleteSession, duplicateSession } from "@/app/seances/actions";
import { PrintButton } from "./PrintButton";

const btn = "rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-medium hover:border-ink";

export function SessionActions({ entry, viewer }: { entry: SessionEntry; viewer: Viewer }) {
  const { id } = entry.session;
  const member = viewer.mode === "supabase" && entry.clubId && viewer.memberships.some((m) => m.clubId === entry.clubId);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PrintButton className={btn} />
      {entry.canEdit && <Link href={`/seances/${id}/modifier`} className={btn}>Modifier</Link>}
      {member && (
        <form action={duplicateSession}>
          <input type="hidden" name="id" value={id} />
          <button className={btn}>Dupliquer</button>
        </form>
      )}
      {entry.canEdit && (
        <details className="relative">
          <summary className={`${btn} cursor-pointer list-none text-warn`}>Supprimer</summary>
          <form action={deleteSession} className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-ink/15 bg-paper p-3 text-sm shadow-lg">
            <input type="hidden" name="id" value={id} />
            <p className="mb-2">Supprimer définitivement cette séance pour tout le club ?</p>
            <button className="rounded-md bg-warn px-3 py-1.5 font-semibold text-white">Confirmer la suppression</button>
          </form>
        </details>
      )}
    </div>
  );
}
