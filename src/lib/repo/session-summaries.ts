import "server-only";
import { sessionDurationMin } from "@/lib/schemas";
import { getSessionReader } from "./index";

/** Séances visibles résumées (numéro, titre, durée) pour les cycles. */
export async function sessionSummaries() {
  const entries = await (await getSessionReader()).list();
  return entries.map((e) => ({
    id: e.session.id,
    number: e.session.number,
    title: e.session.title,
    durationMin: sessionDurationMin(e.session),
    clubId: e.clubId ?? "",
  }));
}
