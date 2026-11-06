import { ExerciseSchema, SessionSchema, type Exercise, type Session } from "@/lib/schemas";
import { BASKET } from "@/lib/court/geometry";
import { lintDiagram } from "@/lib/diagram/lint";
import { clampPoint } from "@/lib/diagram/ops";
import { slugify } from "@/lib/slug";
import { labelForPath, SESSION_SECTIONS } from "@/components/exercise-form/issues";
import type { Validation } from "./repair";

const asRecord = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/**
 * Corrections automatiques sans risque avant validation : coordonnées bornées au
 * terrain, tirs ramenés exactement sur le panier, slug dérivé du titre.
 */
export function autofixExercise(raw: unknown): unknown {
  const ex = asRecord(raw);
  if (!ex) return raw;
  const out: Record<string, unknown> = { ...ex, id: "ia" };
  const params = asRecord(ex.params);
  if (typeof ex.title === "string") out.slug = slugify(`${ex.title} ${typeof params?.space === "string" ? params.space : ""}`);
  const diagram = asRecord(ex.diagram);
  const court = diagram?.court === "full" ? "full" : "half";
  if (diagram && Array.isArray(diagram.frames)) {
    out.diagram = {
      ...diagram,
      frames: diagram.frames.map((f) => {
        const frame = asRecord(f);
        if (!frame) return f;
        const fixPoint = (p: unknown) => {
          const pt = asRecord(p);
          return pt && typeof pt.x === "number" && typeof pt.y === "number" ? clampPoint({ x: pt.x, y: pt.y }) : p;
        };
        return {
          ...frame,
          elements: Array.isArray(frame.elements)
            ? frame.elements.map((e) => { const el = asRecord(e); return el ? { ...el, at: fixPoint(el.at) } : e; })
            : frame.elements,
          ghosts: Array.isArray(frame.ghosts) ? frame.ghosts.map(fixPoint) : frame.ghosts,
          actions: Array.isArray(frame.actions)
            ? frame.actions.map((a) => {
                const act = asRecord(a);
                if (!act || !Array.isArray(act.points)) return a;
                const points = act.points.map(fixPoint);
                if (act.type === "shot" && points.length >= 2) points[points.length - 1] = BASKET[court];
                return { ...act, points };
              })
            : frame.actions,
        };
      }),
    };
  }
  return out;
}

/** Validation complète d'un exercice généré : schéma Zod + règles de lisibilité. */
export function validateGeneratedExercise(raw: unknown): Validation<Exercise> {
  const parsed = ExerciseSchema.safeParse(autofixExercise(raw));
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues.slice(0, 15).map((i) => `${i.path.join(".") || "(racine)"} : ${i.message}`) };
  }
  const warnings = lintDiagram(parsed.data.diagram);
  if (warnings.length) {
    return { ok: false, problems: warnings.map((w) => `diagram.frames.${w.frame} : ${w.message} (respecte l’espacement minimal entre pions)`) };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Validation d'une séance générée : schéma Zod, exercices limités à ceux fournis,
 * durée totale égale à la durée prévue si elle est demandée.
 */
export function validateGeneratedSession(raw: unknown, ctx: { number: number; allowedExerciseIds: Set<string>; plannedDurationMin?: number }): Validation<Session> {
  const rec = asRecord(raw);
  const parsed = SessionSchema.safeParse(rec ? { ...rec, id: "ia", number: ctx.number } : raw);
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues.slice(0, 15).map((i) => `${labelForPath(i.path.filter((p): p is string | number => typeof p !== "symbol"), SESSION_SECTIONS)} : ${i.message}`) };
  }
  const s = parsed.data;
  const problems: string[] = [];
  s.blocks.forEach((b, i) => {
    if (b.exerciseId && !ctx.allowedExerciseIds.has(b.exerciseId)) {
      problems.push(`blocks.${i}.exerciseId : « ${b.exerciseId} » n'est pas dans la liste des exercices disponibles (utilise un id de la liste ou un contenu libre)`);
    }
  });
  const total = s.blocks.reduce((t, b) => t + b.durationMin, 0);
  if (ctx.plannedDurationMin && total !== ctx.plannedDurationMin) {
    problems.push(`La somme des durées des phases (${total} min) doit être exactement ${ctx.plannedDurationMin} min.`);
  }
  return problems.length ? { ok: false, problems } : { ok: true, data: s };
}
