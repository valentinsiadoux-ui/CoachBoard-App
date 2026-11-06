"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ExerciseSchema } from "@/lib/schemas";
import { getWritableRepository } from "@/lib/repo";
import { DbError } from "@/lib/repo/supabase";
import { nextSlug, slugify } from "@/lib/slug";
import { toFormIssues, type FormIssue } from "@/components/exercise-form/issues";

export type SaveState = { issues: FormIssue[]; error?: string };

const Uuid = z.string().uuid();

/** Création (sans id) ou modification (avec id). Le document est revalidé par Zod côté serveur. */
export async function saveExercise(_prev: SaveState, form: FormData): Promise<SaveState> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return { issues: [], error: "Formulaire illisible, rechargez la page." };
  }
  const id = form.get("id") ? Uuid.safeParse(form.get("id")) : null;
  if (id && !id.success) return { issues: [], error: "Identifiant d'exercice invalide." };

  const draft = raw as Record<string, unknown> & { title?: string; slug?: string; params?: { space?: string } };
  if (!draft.slug && draft.title) {
    draft.slug = slugify(`${draft.title} ${draft.params?.space ?? ""}`);
  }
  // « /exercices/nouveau » est une page : ce slug est réservé.
  if (draft.slug === "nouveau") draft.slug = nextSlug(draft.slug);
  const parsed = ExerciseSchema.safeParse({ ...draft, id: id?.data ?? "nouveau" });
  if (!parsed.success) return { issues: toFormIssues(parsed.error.issues) };

  const { repo, viewer } = await getWritableRepository();
  let slug = parsed.data.slug;
  try {
    if (id) {
      await repo.update(id.data, parsed.data);
    } else {
      const clubId = String(form.get("clubId") ?? "");
      if (!viewer.memberships.some((m) => m.clubId === clubId)) return { issues: [], error: "Choisissez un de vos clubs." };
      slug = (await repo.create(clubId, parsed.data)).slug;
    }
  } catch (e) {
    if (e instanceof DbError) return { issues: [], error: e.message };
    throw e;
  }
  revalidatePath("/");
  redirect(`/exercices/${slug}`);
}

export async function deleteExercise(form: FormData) {
  const { repo } = await getWritableRepository();
  await repo.remove(Uuid.parse(form.get("id")));
  revalidatePath("/");
  redirect("/");
}

/** Copie un exercice (y compris de la bibliothèque) dans un de ses clubs, puis ouvre l'édition. */
export async function duplicateExercise(form: FormData) {
  const { repo, viewer } = await getWritableRepository();
  const source = await repo.getById(Uuid.parse(form.get("id")));
  const clubId = String(form.get("clubId") ?? "");
  if (!source || !viewer.memberships.some((m) => m.clubId === clubId)) redirect("/");
  const ex = source.exercise;
  const title = `${ex.title} (copie)`.slice(0, 80);
  const { slug } = await repo.create(clubId, { ...ex, title, slug: nextSlug(ex.slug) });
  revalidatePath("/");
  redirect(`/exercices/${slug}/modifier`);
}
