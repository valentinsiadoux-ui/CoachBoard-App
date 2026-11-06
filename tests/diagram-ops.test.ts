import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { BASKET } from "@/lib/court/geometry";
import { DiagramSchema } from "@/lib/schemas";
import {
  type EditorDiagram, addAction, addElement, clampPoint, continueFrame, emptyFrame, insertFrame, moveFrame, parseEditorDiagram,
  removeElement, removeFrame, shotFrom, snapToElement, updateElement,
} from "@/lib/diagram/ops";

describe("opérations de l'éditeur de schéma", () => {
  it("numérote les attaquants et attribue des identifiants uniques", () => {
    let f = emptyFrame("Départ");
    for (const k of ["attacker", "attacker", "defender", "attacker"] as const) f = addElement(f, k, { x: 0.5, y: 0.5 }).frame;
    expect(f.elements.map((e) => [e.id, e.label])).toEqual([["a1", "1"], ["a2", "2"], ["d1", undefined], ["a3", "3"]]);
    f = removeElement(f, "a2");
    f = addElement(f, "attacker", { x: 0.1, y: 0.1 }).frame;
    expect(f.elements.at(-1)).toMatchObject({ id: "a2", label: "2" });
  });

  it("borne les positions au terrain", () => {
    expect(clampPoint({ x: -0.2, y: 1.37777 })).toEqual({ x: 0, y: 1 });
    expect(clampPoint({ x: 0.123456, y: 0.5 })).toEqual({ x: 0.123, y: 0.5 });
  });

  it("un seul porteur de balle", () => {
    let f = emptyFrame("x");
    f = addElement(f, "attacker", { x: 0.2, y: 0.2 }).frame;
    f = addElement(f, "attacker", { x: 0.8, y: 0.8 }).frame;
    f = updateElement(f, "a1", { hasBall: true });
    f = updateElement(f, "a2", { hasBall: true });
    expect(f.elements.map((e) => e.hasBall)).toEqual([false, true]);
  });

  it("le tir part du joueur et finit au panier", () => {
    expect(shotFrom("full", { x: 0.8, y: 0.2 }).points.at(-1)).toEqual(BASKET.full);
  });

  it("aimante un tracé sur le pion le plus proche", () => {
    let f = emptyFrame("x");
    f = addElement(f, "attacker", { x: 0.3, y: 0.3 }).frame;
    expect(snapToElement("half", f, { x: 0.31, y: 0.31 })?.id).toBe("a1");
    expect(snapToElement("half", f, { x: 0.6, y: 0.6 })).toBeNull();
  });

  it("vignette suivante : mêmes positions, sans actions", () => {
    let f = addElement(emptyFrame("Départ"), "attacker", { x: 0.3, y: 0.3 }).frame;
    f = addAction(f, { type: "run", actor: "attacker", points: [{ x: 0.3, y: 0.3 }, { x: 0.3, y: 0.6 }] });
    const next = continueFrame(f, 2);
    expect(next.elements).toEqual(f.elements);
    expect(next.actions).toEqual([]);
    expect(next.elements[0]).not.toBe(f.elements[0]);
  });

  it("gère l'ordre et la suppression des vignettes (au moins une)", () => {
    let d: EditorDiagram = { court: "half", frames: [emptyFrame("A")] };
    d = insertFrame(d, 0, emptyFrame("B"));
    d = moveFrame(d, 1, -1);
    expect(d.frames.map((f) => f.title)).toEqual(["B", "A"]);
    d = removeFrame(removeFrame(d, 0), 0);
    expect(d.frames).toHaveLength(1);
  });

  it("relit les schémas existants sans perte", () => {
    for (const ex of exercises) {
      const parsed = parseEditorDiagram(JSON.parse(JSON.stringify(ex.diagram)));
      expect(DiagramSchema.parse(parsed)).toEqual(ex.diagram);
    }
    expect(parseEditorDiagram({ court: "lune", frames: [] })).toBeNull();
  });
});
