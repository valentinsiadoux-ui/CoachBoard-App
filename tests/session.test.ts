import { describe, expect, it } from "vitest";
import { SessionSchema, sessionDurationMin } from "@/lib/schemas";
import { seance14 } from "@/data/sessions/seance-14";
import { exercises } from "@/data/exercises";

describe("séance de démonstration", () => {
  it("dure 90 minutes en 5 phases", () => {
    expect(seance14.blocks).toHaveLength(5);
    expect(sessionDurationMin(seance14)).toBe(90);
  });

  it("référence des exercices existants", () => {
    const ids = new Set(exercises.map((e) => e.id));
    for (const b of seance14.blocks) if (b.exerciseId) expect(ids.has(b.exerciseId)).toBe(true);
  });
});

describe("règles de séance", () => {
  it("refuse deux situations phares", () => {
    const blocks = seance14.blocks.map((b) => ({ ...b, isFlagship: true }));
    expect(SessionSchema.safeParse({ ...seance14, blocks }).success).toBe(false);
  });

  it("refuse une phase sans exercice ni contenu", () => {
    const blocks = [{ phase: "jeu", durationMin: 10 }];
    expect(SessionSchema.safeParse({ ...seance14, blocks }).success).toBe(false);
  });
});

describe("aides de la fiche de séance", () => {
  it("numérote la fiche phare et répartit la frise", async () => {
    const { flagshipSheetNumber, timelineShares } = await import("@/lib/schemas");
    expect(flagshipSheetNumber(seance14)).toBe("14.3");
    const shares = timelineShares(seance14);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    expect(shares[3]).toBeCloseTo((25 / 90) * 100);
  });

  it("refuse une situation phare sans exercice", () => {
    const blocks = [{ phase: "situation", durationMin: 20, content: "Libre", isFlagship: true }];
    expect(SessionSchema.safeParse({ ...seance14, blocks }).success).toBe(false);
  });
});
