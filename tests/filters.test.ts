import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AGE_CATEGORIES } from "@/lib/schemas";
import { matchesFilters, parseFilters } from "@/lib/filters";
import { exercises } from "@/data/exercises";

const [demi, tout] = exercises as [(typeof exercises)[0], (typeof exercises)[0]];
const match = (params: Record<string, string | string[]>) =>
  exercises.filter((e) => matchesFilters(e, parseFilters(params))).map((e) => e.slug);

describe("lecture des filtres depuis l'URL", () => {
  it("ignore les valeurs invalides sans planter", () => {
    expect(parseFilters({ age: "U99", maxDuration: "abc", space: "lune", players: "-3" })).toEqual({
      q: undefined, age: undefined, themes: [], space: undefined, difficulty: undefined, maxDuration: undefined, players: undefined,
    });
  });

  it("accepte plusieurs thèmes", () => {
    expect(parseFilters({ theme: ["Contre-attaque", " Défense "] }).themes).toEqual(["Contre-attaque", "Défense"]);
  });
});

describe("filtrage en mémoire", () => {
  it("catégorie : recouvrement de la plage", () => {
    expect(match({ age: "U15" })).toHaveLength(2);
    expect(match({ age: "U13" })).toHaveLength(0);
  });

  it("espace, durée, joueurs", () => {
    expect(match({ space: "tout-terrain" })).toEqual([tout.slug]);
    expect(match({ maxDuration: "10" })).toEqual([]);
    expect(match({ maxDuration: "12" })).toHaveLength(2);
    expect(match({ players: "6" })).toEqual([]);
    expect(match({ players: "10", space: "demi-terrain" })).toEqual([demi.slug]);
  });

  it("recherche texte insensible aux accents et à la casse", () => {
    expect(match({ q: "SUPERIORITE contre" })).toHaveLength(2);
    expect(match({ q: "zone press" })).toHaveLength(0);
  });
});

it("l'ordre des catégories est identique en TypeScript et en SQL", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261106000000_banque_exercices.sql", import.meta.url), "utf8");
  const arr = sql.match(/array\[('U7'[^\]]*)\]/)?.[1];
  expect(arr?.split(",").map((s) => s.trim().replace(/'/g, ""))).toEqual([...AGE_CATEGORIES]);
});
