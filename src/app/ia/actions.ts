"use server";

import { z } from "zod";
import { AgeCategorySchema, ExerciseSchema, SessionSchema, SpaceSchema, type Exercise, type Session } from "@/lib/schemas";
import { ageRank } from "@/lib/filters";
import { getReader, getWritableSessions } from "@/lib/repo";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AI_MAX_REPAIRS, AI_MODEL, aiDailyLimit, isAiConfigured } from "@/lib/ai/config";
import { createConversation, describeAiError } from "@/lib/ai/claude";
import { exerciseSystemPrompt, exerciseUserPrompt, sessionSystemPrompt, sessionUserPrompt } from "@/lib/ai/prompts";
import { generateValidated, type GenerationResult } from "@/lib/ai/repair";
import { validateGeneratedExercise, validateGeneratedSession } from "@/lib/ai/validate";

export type AiState<T> =
  | { status: "idle"; remaining?: number }
  | { status: "ok"; draft: T; remaining: number; version: number }
  | { status: "error"; message: string; problems?: string[]; remaining?: number };

const optionalNumber = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().int().min(min).max(max).optional());
const optionalEnum = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === "" || v === null ? undefined : v), schema.optional());

const ExerciseBriefSchema = z.object({
  brief: z.string().trim().min(10, "Décrivez l’exercice en une phrase au moins (10 caractères).").max(1000),
  category: optionalEnum(AgeCategorySchema),
  space: optionalEnum(SpaceSchema),
  players: optionalNumber(1, 40),
  durationMin: optionalNumber(3, 90),
});

const SessionBriefSchema = z.object({
  brief: z.string().trim().min(10, "Décrivez l’objectif de la séance (10 caractères minimum).").max(1000),
  clubId: z.string().uuid("Choisissez un club."),
  category: AgeCategorySchema,
  team: z.string().trim().max(40).optional(),
  players: z.coerce.number().int().min(1).max(40),
  plannedDurationMin: z.coerce.number().int().min(20).max(240),
});

type Sb = Awaited<ReturnType<typeof createSupabaseServer>>;

/** Générations restantes sur 24 h glissantes (RLS : seules les lignes du coach sont visibles). */
async function remainingQuota(sb: Sb): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count, error } = await sb.from("ai_generations").select("id", { count: "exact", head: true }).gte("created_at", since);
  if (error) throw new Error(`Lecture du quota IA : ${error.message}`);
  return Math.max(0, aiDailyLimit() - (count ?? 0));
}

async function logGeneration(sb: Sb, kind: "exercise" | "session", r: Pick<GenerationResult<unknown>, "attempts" | "inputTokens" | "outputTokens"> & { status: "ok" | "invalid" | "refused" | "error" }) {
  await sb.from("ai_generations").insert({
    kind,
    status: r.status,
    model: AI_MODEL,
    attempts: Math.min(10, Math.max(1, r.attempts)),
    input_tokens: r.inputTokens,
    output_tokens: r.outputTokens,
  });
}

/** Contrôles communs : co-pilote configuré, coach connecté et membre d'un club, quota disponible. */
async function prepare(): Promise<{ sb: Sb; remaining: number } | { error: string; remaining?: number }> {
  if (!isAiConfigured()) return { error: "Le co-pilote IA n’est pas configuré (variable ANTHROPIC_API_KEY absente sur le serveur)." };
  const { viewer } = await getWritableSessions();
  if (!viewer.memberships.length) return { error: "Rejoignez un club pour utiliser le co-pilote." };
  const sb = await createSupabaseServer();
  const remaining = await remainingQuota(sb);
  if (remaining <= 0) return { error: `Quota atteint : ${aiDailyLimit()} générations par 24 h. Réessayez plus tard.`, remaining: 0 };
  return { sb, remaining };
}

async function run<T>(sb: Sb, kind: "exercise" | "session", remaining: number, generate: () => Promise<GenerationResult<T>>): Promise<AiState<T>> {
  let result: GenerationResult<T>;
  try {
    result = await generate();
  } catch (e) {
    await logGeneration(sb, kind, { status: "error", attempts: 1, inputTokens: 0, outputTokens: 0 });
    return { status: "error", message: describeAiError(e), remaining: remaining - 1 };
  }
  await logGeneration(sb, kind, result);
  if (result.status === "ok") return { status: "ok", draft: result.data, remaining: remaining - 1, version: Date.now() };
  return {
    status: "error",
    message: result.status === "refused" ? result.problems[0]! : "La proposition de l’IA n’a pas pu être validée malgré les corrections. Reformulez ou précisez la demande.",
    problems: result.status === "invalid" ? result.problems : undefined,
    remaining: remaining - 1,
  };
}

/** Génère un brouillon d'exercice : rien n'est enregistré, le coach relit et valide. */
export async function generateExerciseDraft(_prev: AiState<Exercise>, form: FormData): Promise<AiState<Exercise>> {
  const input = ExerciseBriefSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return { status: "error", message: input.error.issues[0]!.message };
  const ready = await prepare();
  if ("error" in ready) return { status: "error", message: ready.error, remaining: ready.remaining };
  return run(ready.sb, "exercise", ready.remaining, () =>
    generateValidated({
      call: createConversation({ system: exerciseSystemPrompt(), firstMessage: exerciseUserPrompt(input.data), schema: ExerciseSchema }),
      validate: validateGeneratedExercise,
      maxRepairs: AI_MAX_REPAIRS,
    }),
  );
}

/** Génère un brouillon de séance à partir des exercices visibles par le coach. */
export async function generateSessionDraft(_prev: AiState<Session>, form: FormData): Promise<AiState<Session>> {
  const input = SessionBriefSchema.safeParse({ ...Object.fromEntries(form), team: form.get("team") || undefined });
  if (!input.success) return { status: "error", message: input.error.issues[0]!.message };
  const ready = await prepare();
  if ("error" in ready) return { status: "error", message: ready.error, remaining: ready.remaining };
  const { repo, viewer } = await getWritableSessions();
  if (!viewer.memberships.some((m) => m.clubId === input.data.clubId)) return { status: "error", message: "Choisissez un de vos clubs." };

  // Exercices adaptés à la catégorie d'abord ; toute la banque si elle en compte trop peu.
  const all = (await (await getReader()).list({ themes: [] })).map((e) => e.exercise);
  const rank = ageRank(input.data.category);
  const fitting = all.filter((e) => ageRank(e.ageRange.from) <= rank && ageRank(e.ageRange.to) >= rank);
  const bank = (fitting.length >= 5 ? fitting : all).slice(0, 120);
  const number = await repo.nextNumber(input.data.clubId);

  return run(ready.sb, "session", ready.remaining, () =>
    generateValidated({
      call: createConversation({ system: sessionSystemPrompt(), firstMessage: sessionUserPrompt(input.data, bank), schema: SessionSchema }),
      validate: (raw) =>
        validateGeneratedSession(raw, { number, allowedExerciseIds: new Set(bank.map((e) => e.id)), plannedDurationMin: input.data.plannedDurationMin }),
      maxRepairs: AI_MAX_REPAIRS,
    }),
  );
}

