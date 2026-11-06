import { expect, it } from "vitest";
import { labelForPath } from "@/components/exercise-form/issues";

it("traduit les chemins d'erreur en libellés lisibles", () => {
  expect(labelForPath(["steps", 1, "title"])).toBe("03 · Déroulé › n°2 › titre");
  expect(labelForPath(["params", "durationMin", "max"])).toBe("01 · Paramètres › durée › max");
  expect(labelForPath(["diagram", "court"])).toBe("06 · Le film › terrain");
});
