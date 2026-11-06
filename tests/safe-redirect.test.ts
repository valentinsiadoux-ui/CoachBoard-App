import { expect, it } from "vitest";
import { safeNext } from "@/lib/safe-redirect";

it("n'autorise que les chemins internes", () => {
  expect(safeNext("/exercices/x?age=U15")).toBe("/exercices/x?age=U15");
  expect(safeNext("https://evil.example")).toBe("/");
  expect(safeNext("//evil.example")).toBe("/");
  expect(safeNext("/\\evil.example")).toBe("/");
  expect(safeNext(undefined)).toBe("/");
});
