import { CycleSchema } from "@/lib/schemas";
import { seance14 } from "@/data/sessions/seance-14";

/** Cycle de démonstration : 4 semaines sur le jeu de transition (U15). */
export const cycleTransition = CycleSchema.parse({
  id: "cycle-transition",
  title: "Jeu de transition",
  category: "U15",
  team: "U15 Garçons",
  startDate: "2026-11-02",
  objective: "Gagner du temps sur le repli adverse : relancer vite, remplir les couloirs et finir en supériorité.",
  weeks: [
    { theme: "Relance et premier couloir", goal: "Passe de relance dans les 2 secondes après le rebond.", sessionIds: [] },
    { theme: "Supériorité numérique 3c2", goal: "Fixer avant de passer ; 3 passes avant le tir.", sessionIds: [seance14.id] },
    { theme: "Transition contre repli organisé", goal: "Enchaîner sur un jeu placé si le décalage n'existe pas.", sessionIds: [] },
    { theme: "Évaluation en match", goal: "Mesurer les paniers marqués en moins de 8 secondes.", sessionIds: [] },
  ],
  successCriteria: [
    "Au moins 6 paniers de contre-attaque par match",
    "Relance en moins de 2 secondes sur 80 % des rebonds défensifs",
    "Moins de 3 pertes de balle en transition par match",
  ],
});
