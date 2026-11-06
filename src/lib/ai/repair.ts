/**
 * Boucle « générer → valider → faire corriger », indépendante du fournisseur :
 * l'appel au modèle est injecté, ce qui permet de la tester sans réseau.
 */
export type Validation<T> = { ok: true; data: T } | { ok: false; problems: string[] };

export type ModelTurn = {
  /** Texte JSON produit par le modèle (null si refus ou réponse vide). */
  text: string | null;
  stopReason: string | null;
  inputTokens: number;
  outputTokens: number;
};

export type GenerationResult<T> =
  | { status: "ok"; data: T; attempts: number; inputTokens: number; outputTokens: number }
  | { status: "invalid" | "refused"; problems: string[]; attempts: number; inputTokens: number; outputTokens: number };

/**
 * @param call  premier appel (feedback null) puis appels de correction (feedback = problèmes)
 * @param validate  validation complète (Zod + règles métier), après corrections automatiques
 */
export async function generateValidated<T>(opts: {
  call: (feedback: string[] | null) => Promise<ModelTurn>;
  validate: (raw: unknown) => Validation<T>;
  maxRepairs: number;
}): Promise<GenerationResult<T>> {
  let inputTokens = 0;
  let outputTokens = 0;
  let feedback: string[] | null = null;
  let problems: string[] = [];
  for (let attempt = 1; attempt <= opts.maxRepairs + 1; attempt++) {
    const turn = await opts.call(feedback);
    inputTokens += turn.inputTokens;
    outputTokens += turn.outputTokens;
    const totals = { attempts: attempt, inputTokens, outputTokens };
    if (turn.stopReason === "refusal") {
      return { status: "refused", problems: ["Le modèle a décliné cette demande. Reformulez-la."], ...totals };
    }
    if (turn.text === null) {
      problems = ["Réponse vide."];
    } else {
      let raw: unknown;
      try {
        raw = JSON.parse(turn.text);
      } catch {
        problems = [
          turn.stopReason === "max_tokens"
            ? "Réponse tronquée (trop longue) : produis une fiche plus concise."
            : "La réponse n'est pas un JSON valide.",
        ];
        feedback = problems;
        continue;
      }
      const v = opts.validate(raw);
      if (v.ok) return { status: "ok", data: v.data, ...totals };
      problems = v.problems;
    }
    feedback = problems;
  }
  return { status: "invalid", problems, attempts: opts.maxRepairs + 1, inputTokens, outputTokens };
}
