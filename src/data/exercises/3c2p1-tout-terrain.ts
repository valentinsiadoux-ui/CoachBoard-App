import { ExerciseSchema } from "@/lib/schemas";
import { challenge, coachTips, equipment, technicalPoints, variants } from "./shared";

export const exercice3c2p1Tout = ExerciseSchema.parse({
  id: "00000000-0000-4000-8000-000000000002",
  slug: "3-contre-2-plus-1-tout-terrain",
  title: "3 contre 2 + 1",
  titleAccent: "+ 1",
  kicker: "Transition · Supériorité numérique",
  themes: ["Contre-attaque"],
  ageRange: { from: "U15", to: "Seniors" },
  difficulty: "intermediaire",
  params: {
    durationMin: { min: 12, max: 15 },
    players: { min: 8, max: 12 },
    space: "tout-terrain",
    equipment,
  },
  challenge,
  steps: [
    { title: "Mise en place", description: "3 attaquants en fond de court, 2 défenseurs en face, 1 défenseur en retard au milieu." },
    { title: "Attaque", description: "Départ des 3 attaquants dans les couloirs vers le panier opposé." },
    { title: "Retour du +1", description: "Le défenseur du milieu entre dès que l’attaque franchit la ligne à 3 points." },
    { title: "Rotation", description: "Les 3 attaquants passent en défense sur le retour, les défenseurs sortent." },
  ],
  technicalPoints,
  variants,
  coachTips,
  diagram: {
    court: "full",
    frames: [
      {
        title: "Départ",
        caption: "3 attaquants en fond de court, 2 défenseurs en repli, le +1 attend au milieu.",
        actions: [],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.04, y: 0.19 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.1, y: 0.5 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.04, y: 0.81 } },
          { id: "d1", kind: "defender", at: { x: 0.81, y: 0.39 } },
          { id: "d2", kind: "defender", at: { x: 0.81, y: 0.6 } },
          { id: "p1", kind: "plus_one", at: { x: 0.5, y: 0.94 } },
        ],
      },
      {
        title: "Contre-attaque",
        caption: "Projection immédiate dans les 3 couloirs, le porteur remonte le centre.",
        ghosts: [{ x: 0.04, y: 0.19 }, { x: 0.04, y: 0.81 }],
        actions: [
          { type: "run", points: [{ x: 0.07, y: 0.18 }, { x: 0.66, y: 0.15 }] },
          { type: "run", points: [{ x: 0.07, y: 0.82 }, { x: 0.66, y: 0.85 }] },
          { type: "dribble", points: [{ x: 0.13, y: 0.5 }, { x: 0.66, y: 0.5 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.69, y: 0.15 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.69, y: 0.5 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.69, y: 0.85 } },
          { id: "d1", kind: "defender", at: { x: 0.81, y: 0.39 } },
          { id: "d2", kind: "defender", at: { x: 0.81, y: 0.6 } },
          { id: "p1", kind: "plus_one", at: { x: 0.5, y: 0.94 } },
        ],
      },
      {
        title: "Fixation & +1",
        caption: "Le porteur attaque le cercle pour fixer ; le +1 rentre dès la ligne à 3 points.",
        actions: [
          { type: "dribble", points: [{ x: 0.65, y: 0.5 }, { x: 0.75, y: 0.5 }] },
          { type: "run", points: [{ x: 0.66, y: 0.15 }, { x: 0.81, y: 0.14 }] },
          { type: "run", points: [{ x: 0.66, y: 0.85 }, { x: 0.81, y: 0.86 }] },
          { type: "run", actor: "plus_one", points: [{ x: 0.52, y: 0.93 }, { x: 0.71, y: 0.72 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.83, y: 0.14 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.77, y: 0.5 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.83, y: 0.86 } },
          { id: "d1", kind: "defender", at: { x: 0.82, y: 0.46 } },
          { id: "d2", kind: "defender", at: { x: 0.86, y: 0.66 } },
          { id: "p1", kind: "plus_one", at: { x: 0.73, y: 0.7 } },
        ],
      },
      {
        title: "Passe & finition",
        caption: "Décalage vers l’ailier libre et tir en supériorité avant le repli du +1.",
        actions: [
          { type: "pass", points: [{ x: 0.78, y: 0.44 }, { x: 0.84, y: 0.25 }] },
          { type: "shot", points: [{ x: 0.87, y: 0.24 }, { x: 0.944, y: 0.5 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.86, y: 0.2 }, hasBall: true },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.76, y: 0.5 } },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.85, y: 0.87 } },
          { id: "d1", kind: "defender", at: { x: 0.82, y: 0.55 } },
          { id: "d2", kind: "defender", at: { x: 0.88, y: 0.66 } },
          { id: "p1", kind: "plus_one", at: { x: 0.79, y: 0.77 } },
        ],
      },
    ],
  },
});
