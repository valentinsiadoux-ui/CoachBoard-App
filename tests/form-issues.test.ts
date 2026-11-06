import { expect, it } from "vitest";
import { labelForPath } from "@/components/exercise-form/issues";

it("traduit les chemins d'erreur en libellés lisibles", () => {
  expect(labelForPath(["steps", 1, "title"])).toBe("03 · Déroulé › n°2 › titre");
  expect(labelForPath(["params", "durationMin", "max"])).toBe("01 · Paramètres › durée › max");
  expect(labelForPath(["diagram", "court"])).toBe("06 · Le film › terrain");
});

it("utilise le vocabulaire de la séance", async () => {
  const { SESSION_SECTIONS } = await import("@/components/exercise-form/issues");
  expect(labelForPath(["blocks", 2, "exerciseId"], SESSION_SECTIONS)).toBe("01 · Déroulement › phase › n°3 › exercice");
});
