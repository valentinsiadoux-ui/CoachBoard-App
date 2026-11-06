import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { AI_MODEL } from "./config";
import { repairPrompt } from "./prompts";
import type { ModelTurn } from "./repair";

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic({ timeout: 240_000, maxRetries: 1 }));

/**
 * Crée une conversation de génération : premier message, puis messages de correction.
 * - Sortie structurée : le JSON produit suit le schéma Zod (contraintes fines revalidées ensuite).
 * - Consigne système mise en cache (identique d'une génération à l'autre).
 * - Repli automatique côté serveur si le modèle décline la demande (fallbacks "default").
 */
export function createConversation(opts: { system: string; firstMessage: string; schema: z.ZodType }) {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.firstMessage }];
  const format = zodOutputFormat(opts.schema);

  return async (feedback: string[] | null): Promise<ModelTurn> => {
    if (feedback) messages.push({ role: "user", content: repairPrompt(feedback) });
    const response = await anthropic().beta.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "high", format },
      messages,
    });
    // L'historique garde la réponse complète (blocs de réflexion compris) pour le tour suivant.
    messages.push({ role: "assistant", content: response.content });
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return {
      text: text.trim() ? text : null,
      stopReason: response.stop_reason,
      inputTokens: response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0),
      outputTokens: response.usage.output_tokens,
    };
  };
}

/** Message lisible pour les erreurs d'API (types d'erreur du SDK, du plus précis au plus général). */
export function describeAiError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return "Clé API Anthropic invalide : vérifiez ANTHROPIC_API_KEY.";
  if (e instanceof Anthropic.RateLimitError) return "Trop de demandes en cours : réessayez dans une minute.";
  if (e instanceof Anthropic.BadRequestError) return `Requête refusée par l'API : ${e.message}`;
  if (e instanceof Anthropic.APIConnectionTimeoutError) return "La génération a pris trop de temps : réessayez avec une demande plus courte.";
  if (e instanceof Anthropic.APIConnectionError) return "Impossible de joindre l'API Anthropic.";
  if (e instanceof Anthropic.APIError) return `Erreur de l'API Anthropic (${e.status ?? "?"}).`;
  return "Erreur inattendue pendant la génération.";
}
