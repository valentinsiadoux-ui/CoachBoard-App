import { SessionSchema } from "@/lib/schemas";
import { exercice3c2p1Tout } from "@/data/exercises/3c2p1-tout-terrain";

/** Séance #14 de la fiche de référence A4 (données de démonstration). */
export const seance14 = SessionSchema.parse({
  id: "seance-14",
  number: 14,
  title: "Relance rapide & transition",
  category: "U15",
  team: "U15 Garçons",
  playersCount: 12,
  keyInfo: {
    mainObjective: "Exploiter la supériorité",
    technicalFocus: "Passe dans la course & fixation",
    spaceEquipment: "1 terrain · 8 ballons · cônes",
    assistance: "Variantes & rotations fluides",
  },
  blocks: [
    { phase: "echauffement", durationMin: 15, content: "Passes en dynamique & lignes de course", goal: "Activer le cardio, orienter les épaules vers l’avant." },
    { phase: "technique", durationMin: 20, content: "Fixation du défenseur & relance (2 contre 1)", goal: "Obligation d’attaquer le défenseur direct pour créer le décalage." },
    { phase: "situation", durationMin: 20, exerciseId: exercice3c2p1Tout.id, isFlagship: true, goal: "Défi : 10 paniers en 4 min avec 3 passes min. par possession." },
    { phase: "jeu", durationMin: 25, content: "5 contre 5 · contre-attaque dirigée", goal: "Règle bonus : +3 pts pour tout panier inscrit en moins de 8 secondes." },
    { phase: "retour-calme", durationMin: 10, content: "Lancers francs & débriefing", goal: "Faire baisser le rythme cardiaque, auto-évaluation du groupe." },
  ],
  globalTip: "Les U15 ont tendance à précipiter le dribble après la passe de relance. Insistez pour qu’ils attrapent la balle en course et lèvent les yeux avant de poser le moindre dribble.",
  flagship: {
    title: "3 contre 2 + 1 de transition en flux tendu",
    accompanimentTip: "Si les joueurs perdent le ballon, imposer 2 dribbles maximum par porteur pour forcer le jeu de passe.",
  },
});
