import { ExerciseSchema } from "@/lib/schemas";
import { challenge, coachTips, equipment, technicalPoints, variants } from "./shared";

export const exercice3c2p1Demi = ExerciseSchema.parse({
  id: "ex-3c2p1-demi",
  slug: "3-contre-2-plus-1-demi-terrain",
  title: "3 contre 2 + 1",
  kicker: "Transition · Supériorité numérique",
  themes: ["Contre-attaque"],
  ageRange: { from: "U15", to: "Seniors" },
  difficulty: "intermediaire",
  params: {
    durationMin: { min: 12, max: 15 },
    players: { min: 8, max: 12 },
    space: "demi-terrain",
    equipment,
  },
  challenge,
  steps: [
    { title: "Mise en place", description: "3 attaquants sur la ligne médiane, 2 défenseurs en tandem dans la raquette, le +1 en retard sur la touche." },
    { title: "Attaque", description: "Départ des 3 attaquants dans leurs couloirs vers le panier." },
    { title: "Retour du +1", description: "Le +1 entre dès que le porteur franchit la ligne à 3 points." },
    { title: "Rotation", description: "Les 3 attaquants restent en défense, les défenseurs sortent, un nouveau trio part de la médiane." },
  ],
  technicalPoints,
  variants,
  coachTips,
  diagram: {
    court: "half",
    frames: [
      {
        title: "Départ",
        caption: "3 attaquants à la médiane, tandem défensif, le +1 en retard.",
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.12, y: 0.93 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.5, y: 0.93 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.88, y: 0.93 } },
          { id: "d1", kind: "defender", at: { x: 0.5, y: 0.2 } },
          { id: "d2", kind: "defender", at: { x: 0.5, y: 0.4 } },
          { id: "p1", kind: "plus_one", at: { x: 0.96, y: 0.96 } },
        ],
      },
      {
        title: "Projection",
        caption: "Les ailes filent dans leurs couloirs, le porteur remonte le centre.",
        ghosts: [{ x: 0.12, y: 0.93 }, { x: 0.5, y: 0.93 }, { x: 0.88, y: 0.93 }],
        actions: [
          { type: "run", points: [{ x: 0.12, y: 0.9 }, { x: 0.12, y: 0.55 }] },
          { type: "run", points: [{ x: 0.88, y: 0.9 }, { x: 0.88, y: 0.55 }] },
          { type: "dribble", points: [{ x: 0.5, y: 0.9 }, { x: 0.5, y: 0.62 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.12, y: 0.52 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.5, y: 0.58 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.88, y: 0.52 } },
          { id: "d1", kind: "defender", at: { x: 0.5, y: 0.2 } },
          { id: "d2", kind: "defender", at: { x: 0.5, y: 0.4 } },
          { id: "p1", kind: "plus_one", at: { x: 0.96, y: 0.96 } },
        ],
      },
      {
        title: "Fixation & +1",
        caption: "Le porteur attaque le défenseur haut ; le +1 rentre dès la ligne à 3 points.",
        ghosts: [{ x: 0.5, y: 0.78 }],
        actions: [
          { type: "dribble", points: [{ x: 0.5, y: 0.78 }, { x: 0.5, y: 0.52 }] },
          { type: "run", actor: "plus_one", points: [{ x: 0.96, y: 0.95 }, { x: 0.9, y: 0.75 }, { x: 0.74, y: 0.6 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.12, y: 0.5 } },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.5, y: 0.5 }, hasBall: true },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.88, y: 0.5 } },
          { id: "d1", kind: "defender", at: { x: 0.5, y: 0.2 } },
          { id: "d2", kind: "defender", at: { x: 0.5, y: 0.4 } },
          { id: "p1", kind: "plus_one", at: { x: 0.72, y: 0.62 } },
        ],
      },
      {
        title: "Passe & finition",
        caption: "Décalage vers l’aile opposée au +1 et tir en supériorité.",
        actions: [
          { type: "pass", points: [{ x: 0.5, y: 0.55 }, { x: 0.14, y: 0.5 }] },
          { type: "shot", points: [{ x: 0.12, y: 0.5 }, { x: 0.5, y: 0.1125 }] },
        ],
        elements: [
          { id: "a1", kind: "attacker", label: "1", at: { x: 0.1, y: 0.5 }, hasBall: true },
          { id: "a2", kind: "attacker", label: "2", at: { x: 0.5, y: 0.6 } },
          { id: "a3", kind: "attacker", label: "3", at: { x: 0.9, y: 0.48 } },
          { id: "d1", kind: "defender", at: { x: 0.34, y: 0.2 } },
          { id: "d2", kind: "defender", at: { x: 0.5, y: 0.42 } },
          { id: "p1", kind: "plus_one", at: { x: 0.8, y: 0.58 } },
        ],
      },
    ],
  },
});
