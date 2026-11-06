import { describe, expect, it } from "vitest";
import { CycleSchema, cycleEndDate, shortDate, weekStartDate, weeklyLoad } from "@/lib/schemas";
import { cycleTransition } from "@/data/cycles/cycle-transition";
import { seance14 } from "@/data/sessions/seance-14";

describe("cycles de progression", () => {
  it("calcule les dates des semaines et la fin du cycle", () => {
    expect(shortDate(weekStartDate("2026-11-02", 0))).toBe("02/11");
    expect(shortDate(weekStartDate("2026-11-02", 3))).toBe("23/11");
    expect(shortDate(cycleEndDate(cycleTransition))).toBe("29/11");
    expect(shortDate(weekStartDate("2026-12-28", 1))).toBe("04/01");
  });

  it("calcule la charge hebdomadaire d'après la durée des séances", () => {
    expect(weeklyLoad(cycleTransition, { [seance14.id]: 90 })).toEqual([0, 90, 0, 0]);
  });

  it("refuse une séance prévue deux fois et une date invalide", () => {
    const twice = { ...cycleTransition, weeks: [{ theme: "A", sessionIds: ["s1"] }, { theme: "B", sessionIds: ["s1"] }] };
    expect(CycleSchema.safeParse(twice).error?.issues[0]?.message).toBe("Séance déjà prévue en semaine 1");
    expect(CycleSchema.safeParse({ ...cycleTransition, startDate: "2026-13-45" }).success).toBe(false);
    expect(CycleSchema.safeParse({ ...cycleTransition, startDate: "02/11/2026" }).success).toBe(false);
  });
});
