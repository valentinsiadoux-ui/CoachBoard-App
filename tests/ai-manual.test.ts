import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { exerciseToContent } from "@/lib/db/mapping";
import { extractJson, manualExercisePrompt, manualRepairPrompt, manualSessionPrompt } from "@/lib/ai/manual";
import { validateGeneratedExercise } from "@/lib/ai/validate";

const fiche = exerciseToContent(exercises[0]!);

describe("extraction du JSON collé", () => {
  it("lit un JSON nu, entouré de texte ou dans un bloc ```json", () => {
    const json = JSON.stringify(fiche);
    for (const text of [json, `Voici la fiche :\n${json}\nBon entraînement !`, "```json\n" + json + "\n```", "Réponse :\n```\n" + json + "\n```"]) {
      const r = extractJson(text);
      expect(r.ok && validateGeneratedExercise(r.value).ok).toBe(true);
    }
  });

  it("tolère guillemets typographiques et virgules finales", () => {
    expect(extractJson('{“a”: [1, 2,], “b”: “x”,}')).toEqual({ ok: true, value: { a: [1, 2], b: "x" } });
  });

  it("explique quand il n'y a pas de JSON ou qu'il est tronqué", () => {
    expect(extractJson("Désolé, je ne peux pas.")).toEqual({ ok: false, error: "Aucun objet JSON trouvé dans la réponse collée." });
    const r = extractJson('{"title": "x", "steps": [ {"a": 1} }');
    expect(!r.ok && r.error).toMatch(/invalide.*copiez toute la réponse/);
  });
});

describe("demandes à copier", () => {
  it("exercice : consignes, schéma JSON, demande et format de réponse", () => {
    const p = manualExercisePrompt({ brief: "2 contre 1 en sortie de dribble", category: "U13" });
    expect(p).toContain("Panier : (0.5, 0.113)");
    expect(p).toContain('"$schema"');
    expect(p).toContain("« 2 contre 1 en sortie de dribble »");
    expect(p).toContain("Catégorie visée : U13");
    expect(p.trim().endsWith("sans commentaire dans le JSON.")).toBe(true);
  });

  it("complétion : la fiche en cours est jointe", () => {
    const partial = { ...fiche, steps: [] };
    const p = manualExercisePrompt(null, partial);
    expect(p).toContain("Complète la fiche d'exercice ci-dessous.");
    expect(p).toContain("garde tout ce qui est déjà rempli");
    expect(p).toContain(JSON.stringify(partial));
  });

  it("séance : la banque d'exercices est jointe ; correction prête à recoller", () => {
    const p = manualSessionPrompt({ brief: "transition", category: "U15", players: 12, plannedDurationMin: 90 }, exercises);
    expect(p).toContain(exercises[1]!.id);
    expect(manualRepairPrompt(["title : Champ obligatoire"])).toContain("- title : Champ obligatoire");
  });
});
