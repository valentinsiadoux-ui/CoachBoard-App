"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SessionSchema } from "@/lib/schemas";
import { exercisesById, getWritableSessions } from "@/lib/repo";
import { DbError } from "@/lib/repo/errors";
import { SESSION_SECTIONS, toFormIssues, type FormIssue } from "@/components/exercise-form/issues";

export type SaveSessionState = { issues: FormIssue[]; error?: string };

const Uuid = z.string().uuid();

/** Création (sans id) ou modification (avec id), revalidée par Zod côté serveur. */
export async function saveSession(_prev: SaveSessionState, form: FormData): Promise<SaveSessionState> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return { issues: [], error: "Formulaire illisible, rechargez la page." };
  }
  const id = form.get("id") ? Uuid.safeParse(form.get("id")) : null;
  if (id && !id.success) return { issues: [], error: "Identifiant de séance invalide." };

  const parsed = SessionSchema.safeParse({ ...(raw as object), id: id?.data ?? "nouvelle" });
  if (!parsed.success) return { issues: toFormIssues(parsed.error.issues, SESSION_SECTIONS) };

  // Les exercices liés doivent exister et être visibles par l'utilisateur.
  const linked = parsed.data.blocks.map((b) => b.exerciseId).filter((x): x is string => Boolean(x));
  const found = await exercisesById(linked);
  const missing = parsed.data.blocks.flatMap((b, i) =>
    b.exerciseId && !found[b.exerciseId] ? [{ path: `blocks.${i}.exerciseId`, label: `01 · Déroulement › phase n°${i + 1} › exercice`, message: "Exercice introuvable ou non accessible" }] : [],
  );
  if (missing.length) return { issues: missing };

  const { repo, viewer } = await getWritableSessions();
  let sessionId: string;
  try {
    if (id) {
      await repo.update(id.data, parsed.data);
      sessionId = id.data;
    } else {
      const clubId = String(form.get("clubId") ?? "");
      if (!viewer.memberships.some((m) => m.clubId === clubId)) return { issues: [], error: "Choisissez un de vos clubs." };
      sessionId = await repo.create(clubId, parsed.data);
    }
  } catch (e) {
    if (e instanceof DbError) return { issues: [], error: e.message };
    throw e;
  }
  revalidatePath("/seances");
  redirect(`/seances/${sessionId}`);
}

export async function deleteSession(form: FormData) {
  const { repo } = await getWritableSessions();
  await repo.remove(Uuid.parse(form.get("id")));
  revalidatePath("/seances");
  redirect("/seances");
}

/** Copie la séance dans son club avec le prochain numéro libre, puis ouvre l'édition. */
export async function duplicateSession(form: FormData) {
  const { repo, viewer } = await getWritableSessions();
  const source = await repo.getById(Uuid.parse(form.get("id")));
  if (!source?.clubId || !viewer.memberships.some((m) => m.clubId === source.clubId)) redirect("/seances");
  const s = source.session;
  const number = await repo.nextNumber(source.clubId);
  const id = await repo.create(source.clubId, { ...s, number, title: `${s.title} (copie)`.slice(0, 80) });
  revalidatePath("/seances");
  redirect(`/seances/${id}/modifier`);
}
