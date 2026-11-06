import { ExerciseSchema } from "@/lib/schemas";
import { challenge, coachTips, equipment, technicalPoints, variants } from "./shared";

export const exercice3c2p1Tout = ExerciseSchema.parse({
  id: "ex-3c2p1-tout",
  slug: "3-contre-2-plus-1-tout-terrain",
  title: "3 contre 2 + 1",
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
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.05, y: 0.2 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.13, y: 0.5 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.05, y: 0.8 } },
          { id: "d1", kind: "defender", at: { x: 0.82, y: 0.4 } },
          { id: "d2", kind: "defender", at: { x: 0.82, y: 0.6 } },
          { id: "p1", kind: "plus_one", at: { x: 0.5, y: 0.93 } },
        ],
      },
      {
        title: "Contre-attaque",
        caption: "Projection immédiate dans les 3 couloirs, le porteur remonte le centre.",
        ghosts: [{ x: 0.05, y: 0.2 }, { x: 0.05, y: 0.8 }],
        actions: [
          { type: "run", points: [{ x: 0.08, y: 0.2 }, { x: 0.74, y: 0.2 }] },
          { type: "run", points: [{ x: 0.08, y: 0.8 }, { x: 0.74, y: 0.8 }] },
          { type: "dribble", points: [{ x: 0.13, y: 0.5 }, { x: 0.7, y: 0.5 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.78, y: 0.2 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.74, y: 0.5 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.78, y: 0.8 } },
          { id: "d1", kind: "defender", at: { x: 0.84, y: 0.4 } },
          { id: "d2", kind: "defender", at: { x: 0.84, y: 0.6 } },
          { id: "p1", kind: "plus_one", at: { x: 0.5, y: 0.93 } },
        ],
      },
      {
        title: "Fixation & +1",
        caption: "Le porteur attaque le cercle pour fixer ; le +1 rentre dès la ligne à 3 points.",
        actions: [
          { type: "dribble", points: [{ x: 0.7, y: 0.5 }, { x: 0.8, y: 0.5 }] },
          { type: "run", points: [{ x: 0.8, y: 0.2 }, { x: 0.87, y: 0.2 }] },
          { type: "run", points: [{ x: 0.8, y: 0.8 }, { x: 0.87, y: 0.8 }] },
          { type: "run", actor: "plus_one", points: [{ x: 0.5, y: 0.93 }, { x: 0.66, y: 0.78 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.9, y: 0.2 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.83, y: 0.5 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.9, y: 0.8 } },
          { id: "d1", kind: "defender", at: { x: 0.88, y: 0.44 } },
          { id: "d2", kind: "defender", at: { x: 0.92, y: 0.62 } },
          { id: "p1", kind: "plus_one", at: { x: 0.69, y: 0.76 } },
        ],
      },
      {
        title: "Passe & finition",
        caption: "Décalage vers l’ailier libre et tir en supériorité avant le repli du +1.",
        actions: [
          { type: "pass", points: [{ x: 0.83, y: 0.47 }, { x: 0.88, y: 0.26 }] },
          { type: "shot", points: [{ x: 0.89, y: 0.24 }, { x: 0.944, y: 0.5 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.9, y: 0.22 }, hasBall: true },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.82, y: 0.5 } },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.9, y: 0.82 } },
          { id: "d1", kind: "defender", at: { x: 0.9, y: 0.5 } },
          { id: "d2", kind: "defender", at: { x: 0.92, y: 0.64 } },
          { id: "p1", kind: "plus_one", at: { x: 0.78, y: 0.72 } },
        ],
      },
    ],
  },
});
