/**
 * Co-pilote « par copier-coller » : l'application prépare la demande, le coach la colle
 * dans l'assistant de son choix (claude.ai…), puis recolle la réponse. Mêmes consignes,
 * mêmes validations et même boucle de correction que le mode API, sans appel payant.
 * Module sans dépendance serveur : utilisable dans le navigateur.
 */
import { z } from "zod";
import { ExerciseSchema, SessionSchema, type Exercise } from "@/lib/schemas";
import {
  exerciseSystemPrompt, exerciseUserPrompt, repairPrompt, sessionSystemPrompt, sessionUserPrompt,
  type ExerciseBrief, type SessionBrief,
} from "./prompts";

/** Adresse proposée pour coller la demande. */
export const CHAT_URL = "https://claude.ai/new";

const OUTPUT_RULE =
  "FORMAT DE RÉPONSE : réponds UNIQUEMENT par l'objet JSON complet (un seul bloc), sans texte avant ni après, sans commentaire dans le JSON.";

/** Schéma JSON lisible par n'importe quel assistant, dérivé des schémas Zod de l'application. */
const jsonSchemaOf = (schema: z.ZodType) => JSON.stringify(z.toJSONSchema(schema, { io: "output", unrepresentable: "any" }));

const completionBlock = (kind: "fiche" | "séance", partial: unknown) =>
  `${kind === "fiche" ? "Fiche" : "Séance"} en cours (JSON) : garde tout ce qui est déjà rempli, complète les champs vides ou manquants${kind === "fiche" ? " (dont le schéma tactique)" : ""} et corrige seulement ce qui est incohérent :\n${JSON.stringify(partial)}`;

/** Demande complète pour un exercice : nouvelle fiche (brief) et/ou fiche à compléter (partial). */
export function manualExercisePrompt(brief: ExerciseBrief | null, partial?: unknown): string {
  const request = [
    brief ? exerciseUserPrompt(brief) : "Complète la fiche d'exercice ci-dessous.",
    partial !== undefined ? completionBlock("fiche", partial) : null,
  ].filter(Boolean).join("\n\n");
  return `${exerciseSystemPrompt()}\n\nSchéma JSON à respecter :\n${jsonSchemaOf(ExerciseSchema)}\n\n---\n\n${request}\n\n${OUTPUT_RULE}`;
}

/** Demande complète pour une séance, avec les exercices de la banque du coach. */
export function manualSessionPrompt(brief: SessionBrief, bank: Exercise[], partial?: unknown): string {
  const request = [sessionUserPrompt(brief, bank), partial !== undefined ? completionBlock("séance", partial) : null].filter(Boolean).join("\n\n");
  return `${sessionSystemPrompt()}\n\nSchéma JSON à respecter :\n${jsonSchemaOf(SessionSchema)}\n\n---\n\n${request}\n\n${OUTPUT_RULE}`;
}

/** Message à recoller dans la même conversation quand la réponse ne passe pas la validation. */
export const manualRepairPrompt = (problems: string[]) => `${repairPrompt(problems)}\n\n${OUTPUT_RULE}`;

export type Extracted = { ok: true; value: unknown } | { ok: false; error: string };

/**
 * Retrouve l'objet JSON dans une réponse collée : bloc ```json, texte autour,
 * guillemets typographiques, virgules finales.
 */
export function extractJson(text: string): Extracted {
  const fenced = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  const source = (fenced ? fenced[1]! : text).trim();
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return { ok: false, error: "Aucun objet JSON trouvé dans la réponse collée." };
  const candidate = source.slice(start, end + 1);
  const attempts = [
    candidate,
    candidate.replace(/[“”]/g, '"').replace(/,\s*([}\]])/g, "$1"),
  ];
  for (const a of attempts) {
    try {
      return { ok: true, value: JSON.parse(a) };
    } catch {
      /* essai suivant */
    }
  }
  try {
    JSON.parse(attempts[1]!);
  } catch (e) {
    return { ok: false, error: `Le JSON collé est invalide (${(e as Error).message}). Il est peut-être incomplet : copiez toute la réponse.` };
  }
  return { ok: false, error: "Le JSON collé est invalide." };
}
