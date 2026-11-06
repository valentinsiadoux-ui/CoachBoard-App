"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";

export type ClubFormState = { error?: string };

const NameSchema = z.string().trim().min(2, "2 caractères minimum").max(80);
const CodeSchema = z.string().trim().min(6, "Code trop court").max(40);
const Uuid = z.string().uuid();

/** Erreurs SQL connues → messages lisibles. */
const readable = (msg: string) =>
  /au moins un administrateur|invalide|Authentification/.test(msg) ? msg.replace(/^.*?: /, "") : `Opération impossible (${msg}).`;

export async function createClub(_prev: ClubFormState, form: FormData): Promise<ClubFormState> {
  const name = NameSchema.safeParse(form.get("name"));
  if (!name.success) return { error: name.error.issues[0]?.message };
  const sb = await createSupabaseServer();
  const { error } = await sb.rpc("create_club", { club_name: name.data });
  if (error) return { error: readable(error.message) };
  revalidatePath("/", "layout");
  return {};
}

export async function joinClub(_prev: ClubFormState, form: FormData): Promise<ClubFormState> {
  const code = CodeSchema.safeParse(form.get("code"));
  if (!code.success) return { error: code.error.issues[0]?.message };
  const sb = await createSupabaseServer();
  const { error } = await sb.rpc("join_club", { code: code.data });
  if (error) return { error: readable(error.message) };
  revalidatePath("/", "layout");
  return {};
}

async function run(op: (sb: Awaited<ReturnType<typeof createSupabaseServer>>) => PromiseLike<{ error: { message: string } | null }>) {
  const sb = await createSupabaseServer();
  const { error } = await op(sb);
  if (error) redirect(`/club?erreur=${encodeURIComponent(readable(error.message))}`);
  revalidatePath("/", "layout");
}

export async function regenerateInvite(form: FormData) {
  const clubId = Uuid.parse(form.get("clubId"));
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  await run((sb) => sb.from("clubs").update({ invite_code: code }).eq("id", clubId));
}

export async function setRole(form: FormData) {
  const clubId = Uuid.parse(form.get("clubId"));
  const userId = Uuid.parse(form.get("userId"));
  const role = z.enum(["admin", "coach"]).parse(form.get("role"));
  await run((sb) => sb.from("club_members").update({ role }).eq("club_id", clubId).eq("user_id", userId));
}

export async function removeMember(form: FormData) {
  const clubId = Uuid.parse(form.get("clubId"));
  const userId = Uuid.parse(form.get("userId"));
  await run((sb) => sb.from("club_members").delete().eq("club_id", clubId).eq("user_id", userId));
}
