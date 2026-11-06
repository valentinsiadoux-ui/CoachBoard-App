import { expect, it } from "vitest";
import { nextSlug, slugify } from "@/lib/slug";

it("génère des slugs lisibles", () => {
  expect(slugify("3 contre 2 + 1 · Demi-terrain")).toBe("3-contre-2-plus-1-demi-terrain");
  expect(slugify("Relance rapide & transition")).toBe("relance-rapide-et-transition");
  expect(slugify("Défense « tout-terrain » !")).toBe("defense-tout-terrain");
  expect(slugify("!!!")).toBe("exercice");
});

it("incrémente un slug déjà pris", () => {
  expect(nextSlug("tir")).toBe("tir-2");
  expect(nextSlug("tir-2")).toBe("tir-3");
});
