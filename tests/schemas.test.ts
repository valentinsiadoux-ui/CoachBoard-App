import { describe, expect, it } from "vitest";
import { DiagramFrameSchema, ExerciseSchema } from "@/lib/schemas";
import { exercises } from "@/data/exercises";

describe("exercices de démonstration", () => {
  it.each(exercises.map((e) => [e.slug, e] as const))("%s est valide", (_slug, ex) => {
    expect(ExerciseSchema.safeParse(ex).success).toBe(true);
  });

  it("les slugs sont uniques", () => {
    expect(new Set(exercises.map((e) => e.slug)).size).toBe(exercises.length);
  });

  it("le type de terrain du schéma correspond à l'espace", () => {
    for (const e of exercises) {
      expect(e.diagram.court).toBe(e.params.space === "demi-terrain" ? "half" : "full");
    }
  });
});

describe("règles de validation", () => {
  const base = { title: "T", caption: "C", elements: [] };

  it("refuse deux porteurs de balle", () => {
    const r = DiagramFrameSchema.safeParse({
      ...base,
      elements: [
        { id: "a", kind: "attacker", at: { x: 0.1, y: 0.1 }, hasBall: true },
        { id: "b", kind: "attacker", at: { x: 0.2, y: 0.2 }, hasBall: true },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("refuse les identifiants en double", () => {
    const el = { id: "a", kind: "defender", at: { x: 0.1, y: 0.1 } };
    expect(DiagramFrameSchema.safeParse({ ...base, elements: [el, el] }).success).toBe(false);
  });

  it("refuse des coordonnées hors terrain", () => {
    const r = DiagramFrameSchema.safeParse({ ...base, elements: [{ id: "a", kind: "cone", at: { x: 3, y: 0 } }] });
    expect(r.success).toBe(false);
  });

  it("refuse une plage de catégories inversée", () => {
    const bad = { ...exercises[0]!, ageRange: { from: "Seniors", to: "U13" } };
    expect(ExerciseSchema.safeParse(bad).success).toBe(false);
  });
});
