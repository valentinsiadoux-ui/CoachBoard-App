export const challenge = {
  metrics: [
    { value: "10", label: "Paniers" },
    { value: "4:00", label: "Chrono" },
    { value: "3+", label: "Passes / tir" },
  ],
  statement: "Marquer 10 paniers en 4 minutes, avec au moins 3 passes réussies avant chaque tir.",
};

export const technicalPoints = [
  { title: "Projection rapide", description: "remplir immédiatement les 3 couloirs (centre + ailes)." },
  { title: "Fixer pour décaler", description: "attaquer le défenseur direct avant de donner la balle." },
];

export const variants = {
  simplify: ["Sans interception"],
  complicate: ["1 dribble max par joueur"],
};

export const coachTips = [
  {
    situation: "Joueur en difficulté",
    tips: [
      "Ralentir le dribble, pivoter pour protéger la balle.",
      "Privilégier la passe poitrine à 2 mains.",
      "Faire tourner l’action au ralenti, en « fantôme », sans bloquer le groupe.",
    ],
  },
];

export const equipment = [
  { name: "ballons", quantity: 6 },
  { name: "cônes", quantity: 4 },
];
