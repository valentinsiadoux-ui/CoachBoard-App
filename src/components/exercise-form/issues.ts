import type { ZodIssue } from "zod";

export type FormIssue = { path: string; label: string; message: string };

export const EXERCISE_SECTIONS: Record<string, string> = {
  title: "Titre",
  titleAccent: "Mise en valeur du titre",
  kicker: "Surtitre",
  slug: "Adresse (slug)",
  themes: "Thèmes",
  ageRange: "Catégories",
  difficulty: "Niveau",
  params: "01 · Paramètres",
  challenge: "02 · Le défi",
  steps: "03 · Déroulé",
  technicalPoints: "04 · Consignes techniques",
  variants: "04 · Variantes",
  coachTips: "05 · Conseils du coach",
  diagram: "06 · Le film",
};

export const SESSION_SECTIONS: Record<string, string> = {
  number: "Numéro",
  title: "Titre",
  category: "Catégorie",
  team: "Équipe",
  playersCount: "Joueurs",
  plannedDurationMin: "Durée prévue",
  keyInfo: "Bandeau",
  blocks: "01 · Déroulement › phase",
  globalTip: "Conseil global",
  flagship: "02 · Situation phare",
};

const FIELDS: Record<string, string> = {
  exerciseId: "exercice",
  content: "contenu",
  goal: "objectif",
  phase: "phase",
  mainObjective: "objectif principal",
  technicalFocus: "focus technique",
  spaceEquipment: "espace & matériel",
  assistance: "assistance",
  titleAccent: "partie en couleur",
  challengeStatement: "énoncé du défi",
  technicalPoints: "consigne",
  rotations: "rotation",
  accompanimentTip: "conseil d’accompagnement",
  durationMin: "durée",
  players: "joueurs",
  space: "espace",
  equipment: "matériel",
  metrics: "chiffres",
  statement: "énoncé",
  min: "min",
  max: "max",
  from: "de",
  to: "à",
  title: "titre",
  description: "description",
  name: "nom",
  quantity: "quantité",
  value: "valeur",
  label: "libellé",
  situation: "situation",
  tips: "conseils",
  simplify: "simplifier",
  complicate: "complexifier",
  court: "terrain",
  frames: "vignette",
};

/** Chemin Zod → libellé lisible, ex. ["steps", 1, "title"] → « 03 · Déroulé › n°2 › titre ». */
export function labelForPath(path: (string | number)[], sections: Record<string, string> = EXERCISE_SECTIONS): string {
  const [head, ...rest] = path;
  const parts = [sections[String(head)] ?? String(head)];
  for (const p of rest) parts.push(typeof p === "number" ? `n°${p + 1}` : FIELDS[p] ?? p);
  return parts.join(" › ");
}

export const toFormIssues = (issues: ZodIssue[], sections: Record<string, string> = EXERCISE_SECTIONS): FormIssue[] =>
  issues.map((i) => ({ path: i.path.join("."), label: labelForPath(i.path, sections), message: i.message }));
