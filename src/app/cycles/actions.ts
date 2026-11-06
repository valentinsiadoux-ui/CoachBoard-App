"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CycleSchema } from "@/lib/schemas";
import { getSessionReader, getWritableCycles } from "@/lib/repo";
import { DbError } from "@/lib/repo/errors";
import { toFormIssues, type FormIssue } from "@/components/exercise-form/issues";

export type SaveCycleState = { issues: FormIssue[]; error?: string };

const Uuid = z.string().uuid();
const CYCLE_SECTIONS: Record<string, string> = {
  title: "Titre",
  category: "Catégorie",
  team: "Équipe",
  startDate: "Date de début",
  objective: "Objectif du cycle",
  weeks: "Semaine",
  successCriteria: "Critère de réussite",
};

export async function saveCycle(_prev: SaveCycleState, form: FormData): Promise<SaveCycleState> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return { issues: [], error: "Formulaire illisible, rechargez la page." };
  }
  const id = form.get("id") ? Uuid.safeParse(form.get("id")) : null;
  if (id && !id.success) return { issues: [], error: "Identifiant de cycle invalide." };
  const parsed = CycleSchema.safeParse({ ...(raw as object), id: id?.data ?? "nouveau" });
  if (!parsed.success) return { issues: toFormIssues(parsed.error.issues, CYCLE_SECTIONS) };

  const { repo, viewer } = await getWritableCycles();
  const clubId = id ? (await repo.getById(id.data))?.clubId : String(form.get("clubId") ?? "");
  if (!clubId || !viewer.memberships.some((m) => m.clubId === clubId)) return { issues: [], error: "Choisissez un de vos clubs." };

  // Les séances prévues doivent appartenir au club du cycle.
  const clubSessions = new Set((await (await getSessionReader()).list()).filter((e) => e.clubId === clubId).map((e) => e.session.id));
  const unknown = parsed.data.weeks.flatMap((w, i) =>
    w.sessionIds.filter((s) => !clubSessions.has(s)).map(() => ({ path: `weeks.${i}`, label: `Semaine n°${i + 1}`, message: "Séance introuvable dans ce club" })),
  );
  if (unknown.length) return { issues: unknown };

  let cycleId: string;
  try {
    if (id) {
      await repo.update(id.data, parsed.data);
      cycleId = id.data;
    } else {
      cycleId = await repo.create(clubId, parsed.data);
    }
  } catch (e) {
    if (e instanceof DbError) return { issues: [], error: e.message };
    throw e;
  }
  revalidatePath("/cycles");
  redirect(`/cycles/${cycleId}`);
}

export async function deleteCycle(form: FormData) {
  const { repo } = await getWritableCycles();
  await repo.remove(Uuid.parse(form.get("id")));
  revalidatePath("/cycles");
  redirect("/cycles");
}
