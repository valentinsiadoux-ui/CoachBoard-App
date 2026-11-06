import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { seance14 } from "@/data/sessions/seance-14";
import { exerciseToContent, sessionToContent } from "@/lib/db/mapping";
import { BASKET } from "@/lib/court/geometry";
import { generateValidated, type ModelTurn } from "@/lib/ai/repair";
import { autofixExercise, validateGeneratedExercise, validateGeneratedSession } from "@/lib/ai/validate";
import { exerciseSystemPrompt, exerciseUserPrompt, sessionUserPrompt } from "@/lib/ai/prompts";

const turn = (value: unknown, stopReason = "end_turn"): ModelTurn => ({
  text: typeof value === "string" ? value : JSON.stringify(value),
  stopReason,
  inputTokens: 100,
  outputTokens: 50,
});
const good = { ...exerciseToContent(exercises[0]!), id: "ia" };

describe("boucle générer → valider → corriger", () => {
  it("accepte une réponse valide du premier coup", async () => {
    const r = await generateValidated({ call: async () => turn(good), validate: validateGeneratedExercise, maxRepairs: 2 });
    expect(r).toMatchObject({ status: "ok", attempts: 1, inputTokens: 100, outputTokens: 50 });
  });

  it("renvoie les problèmes au modèle puis accepte la correction", async () => {
    const feedbacks: (string[] | null)[] = [];
    const answers = [turn({ ...good, title: "" }), turn(good)];
    const r = await generateValidated({
      call: async (fb) => { feedbacks.push(fb); return answers.shift()!; },
      validate: validateGeneratedExercise,
      maxRepairs: 2,
    });
    expect(r.status).toBe("ok");
    expect(feedbacks[0]).toBeNull();
    expect(feedbacks[1]?.[0]).toMatch(/^title : /);
    expect(r).toMatchObject({ attempts: 2, inputTokens: 200, outputTokens: 100 });
  });

  it("abandonne après le nombre maximal de corrections", async () => {
    let calls = 0;
    const r = await generateValidated({ call: async () => { calls++; return turn("pas du json"); }, validate: validateGeneratedExercise, maxRepairs: 2 });
    expect(calls).toBe(3);
    expect(r).toMatchObject({ status: "invalid", problems: ["La réponse n'est pas un JSON valide."] });
  });

  it("signale un refus sans relancer", async () => {
    let calls = 0;
    const r = await generateValidated({ call: async () => { calls++; return { ...turn(""), text: null, stopReason: "refusal" }; }, validate: validateGeneratedExercise, maxRepairs: 2 });
    expect([r.status, calls]).toEqual(["refused", 1]);
  });

  it("demande une réponse plus concise si elle est tronquée", async () => {
    const fb: (string[] | null)[] = [];
    await generateValidated({ call: async (f) => { fb.push(f); return turn('{"title": "coup', "max_tokens"); }, validate: validateGeneratedExercise, maxRepairs: 1 });
    expect(fb[1]?.[0]).toMatch(/tronquée/);
  });
});

describe("corrections automatiques et validation", () => {
  it("ramène les tirs sur le panier, borne les coordonnées et recalcule le slug", () => {
    const raw = structuredClone(good) as typeof good;
    raw.slug = "MAUVAIS slug";
    const shot = raw.diagram.frames[3]!.actions.find((a) => a.type === "shot")!;
    shot.points[shot.points.length - 1] = { x: 0.48, y: 0.15 };
    raw.diagram.frames[0]!.elements[0]!.at = { x: -0.3, y: 1.4 };
    const fixed = autofixExercise(raw) as typeof good;
    expect(fixed.slug).toBe("3-contre-2-plus-1-demi-terrain");
    expect(fixed.diagram.frames[3]!.actions.find((a) => a.type === "shot")!.points.at(-1)).toEqual(BASKET.half);
    expect(fixed.diagram.frames[0]!.elements[0]!.at).toEqual({ x: 0, y: 1 });
  });

  it("refuse des pions qui se chevauchent", () => {
    const raw = structuredClone(good) as typeof good;
    raw.diagram.frames[0]!.elements[1]!.at = { ...raw.diagram.frames[0]!.elements[0]!.at };
    const v = validateGeneratedExercise(raw);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.problems[0]).toMatch(/chevauchent/);
  });

  it("séance : exercices limités à la banque fournie et durée exacte", () => {
    const raw = { ...sessionToContent(seance14), number: 99 };
    const ids = new Set(exercises.map((e) => e.id));
    const ok = validateGeneratedSession(raw, { number: 15, allowedExerciseIds: ids, plannedDurationMin: 90 });
    expect(ok.ok && ok.data.number).toBe(15);
    const wrongDuration = validateGeneratedSession(raw, { number: 15, allowedExerciseIds: ids, plannedDurationMin: 75 });
    expect(!wrongDuration.ok && wrongDuration.problems[0]).toMatch(/90 min\) doit être exactement 75/);
    const unknown = validateGeneratedSession(raw, { number: 15, allowedExerciseIds: new Set(["autre"]), plannedDurationMin: 90 });
    expect(!unknown.ok && unknown.problems[0]).toMatch(/n'est pas dans la liste/);
  });
});

describe("consignes envoyées au modèle", () => {
  it("la consigne système est stable (mise en cache) et contient les repères du terrain", () => {
    expect(exerciseSystemPrompt()).toBe(exerciseSystemPrompt());
    expect(exerciseSystemPrompt()).toContain("Panier : (0.5, 0.113)");
  });

  it("la demande reprend les contraintes et la banque d'exercices", () => {
    expect(exerciseUserPrompt({ brief: "2c1", category: "U13", space: "demi-terrain", players: 8 })).toContain("Catégorie visée : U13");
    const p = sessionUserPrompt({ brief: "transition", category: "U15", players: 12, plannedDurationMin: 90 }, exercises);
    expect(p).toContain(exercises[0]!.id);
    expect(p).toContain("EXACTEMENT 90 minutes");
  });
});
