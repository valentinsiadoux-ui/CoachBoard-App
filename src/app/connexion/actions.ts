"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-redirect";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

const EmailSchema = z.string().trim().toLowerCase().email("Adresse e-mail invalide");

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? "http"}://${host}`;
}

/** Envoie un lien de connexion par e-mail (pas de mot de passe). */
export async function sendMagicLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = EmailSchema.safeParse(form.get("email"));
  if (!email.success) return { status: "error", message: email.error.issues[0]?.message };
  const next = safeNext(form.get("suite"));
  const sb = await createSupabaseServer();
  const { error } = await sb.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?suite=${encodeURIComponent(next)}` },
  });
  if (error) return { status: "error", message: `Envoi impossible : ${error.message}`, email: email.data };
  return { status: "sent", email: email.data };
}
