import { describe, expect, it } from "vitest";
import { DiagramFrameSchema, ExerciseSchema } from "@/lib/schemas";
import { BASKET, COURT, MARKER_RADIUS } from "@/lib/court/geometry";
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
  it("aucun pion ne se chevauche dans une vignette", () => {
    for (const ex of exercises) {
      const court = ex.diagram.court;
      const { width, height } = COURT[court];
      const r = MARKER_RADIUS[court];
      ex.diagram.frames.forEach((f) => {
        f.elements.forEach((a, i) =>
          f.elements.slice(i + 1).forEach((b) => {
            const d = Math.hypot((a.at.x - b.at.x) * width, (a.at.y - b.at.y) * height);
            expect(d, `${ex.slug} · ${f.title} : ${a.id} / ${b.id}`).toBeGreaterThanOrEqual(2 * r);
          }),
        );
      });
    }
  });

  it("les tirs visent le panier", () => {
    for (const ex of exercises) {
      const basket = BASKET[ex.diagram.court];
      ex.diagram.frames.flatMap((f) => f.actions).filter((a) => a.type === "shot").forEach((a) => {
        const end = a.points[a.points.length - 1]!;
        expect(Math.abs(end.x - basket.x), ex.slug).toBeLessThan(0.01);
        expect(Math.abs(end.y - basket.y), ex.slug).toBeLessThan(0.01);
      });
    }
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
