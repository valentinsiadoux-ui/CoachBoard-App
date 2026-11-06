import { expect, it } from "vitest";
import { pdfFileName } from "@/lib/pdf-filename";

it("compose un nom de fichier sans caractères interdits", () => {
  expect(pdfFileName("Fiche exercice", "3 contre 2 + 1", "Demi-terrain")).toBe("Fiche exercice - 3 contre 2 + 1 - Demi-terrain");
  expect(pdfFileName("Séance 14", "Attaque / défense : « zone »?")).toBe("Séance 14 - Attaque défense « zone »");
  expect(pdfFileName("A", undefined, " ", "B")).toBe("A - B");
});
