import { describe, expect, it } from "vitest";
import { DiagramFrameSchema, ExerciseSchema } from "@/lib/schemas";
import { lintDiagram, lintFrame } from "@/lib/diagram/lint";
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

describe("lisibilité des schémas", () => {
  it("les exercices de démonstration respectent les règles de lisibilité", () => {
    for (const ex of exercises) expect(lintDiagram(ex.diagram), ex.slug).toEqual([]);
  });

  it("détecte chevauchements et tirs mal orientés", () => {
    const frame = {
      elements: [
        { id: "a", kind: "attacker" as const, at: { x: 0.5, y: 0.5 }, hasBall: false },
        { id: "b", kind: "defender" as const, at: { x: 0.51, y: 0.5 }, hasBall: false },
      ],
      actions: [{ type: "shot" as const, actor: "attacker" as const, points: [{ x: 0.5, y: 0.5 }, { x: 0.2, y: 0.2 }] }],
    };
    expect(lintFrame("half", frame).map((w) => w.message)).toEqual(["Pions qui se chevauchent (a / b)", "Un tir ne vise pas le panier"]);
  });
});

describe("mise en valeur du titre", () => {
  it("refuse une mise en valeur absente du titre", () => {
    const bad = { ...exercises[0]!, titleAccent: "+ 9" };
    expect(ExerciseSchema.safeParse(bad).success).toBe(false);
  });
});

describe("cohérence et messages", () => {
  it("refuse un schéma plein terrain pour un exercice en demi-terrain", () => {
    const ex = exercises[0]!;
    const r = ExerciseSchema.safeParse({ ...ex, params: { ...ex.params, space: "tout-terrain" } });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["diagram", "court"]);
  });

  it("les messages d'erreur sont en français", () => {
    const r = ExerciseSchema.safeParse({ ...exercises[0]!, title: "" });
    expect(r.error?.issues[0]?.message).toBe("Champ obligatoire");
  });
});
