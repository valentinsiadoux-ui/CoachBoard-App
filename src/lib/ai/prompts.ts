import { exercises as demoExercises } from "@/data/exercises";
import { seance14 } from "@/data/sessions/seance-14";
import { FIBA, threeCornerY } from "@/lib/court/fiba";
import { BASKET, COURT, MARKER_RADIUS } from "@/lib/court/geometry";
import { exerciseToContent, sessionToContent } from "@/lib/db/mapping";
import { AGE_CATEGORIES, SESSION_PHASES, type Exercise } from "@/lib/schemas";

const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Repères du terrain en coordonnées normalisées, calculés depuis les cotes FIBA du rendu. */
function courtReference(): string {
  const H = COURT.half;
  const F = COURT.full;
  const keyX1 = r3((FIBA.width / 2 - FIBA.keyHalfWidth) / FIBA.width);
  const keyX2 = r3(1 - keyX1);
  const keyY = r3(FIBA.keyLength / FIBA.halfLength);
  const threeTop = r3((FIBA.basketY + FIBA.threeRadius) / FIBA.halfLength);
  const corner = r3(FIBA.threeCornerX / FIBA.width);
  const cornerY = r3(threeCornerY / FIBA.halfLength);
  const fullKey = r3(1 - FIBA.keyLength / F.width);
  const fullThree = r3(1 - (FIBA.basketY + FIBA.threeRadius) / F.width);
  const gap = (court: "half" | "full") => {
    const d = 2 * MARKER_RADIUS[court] + 4;
    return `${r3(d / COURT[court].width)} en x ou ${r3(d / COURT[court].height)} en y`;
  };
  return `
DEMI-TERRAIN (court "half", ${H.width / 30} m × ${H.height / 30} m) : x = largeur (0 = touche gauche, 1 = touche droite) ; y = profondeur (0 = ligne de fond sous le panier, 1 = ligne médiane).
- Panier : (${BASKET.half.x}, ${r3(BASKET.half.y)}). Raquette : x de ${keyX1} à ${keyX2}, y de 0 à ${keyY} (ligne de lancer franc à y = ${keyY}).
- Ligne à 3 points : couloirs latéraux à x = ${corner} et x = ${r3(1 - corner)} jusqu'à y = ${cornerY}, sommet de l'arc à (0.5, ${threeTop}).
- Ligne médiane : y = 1 (les remplaçants ou le « +1 » en attente peuvent être vers y ≈ 0.93–0.96).
TOUT-TERRAIN (court "full", ${F.width / 30} m × ${F.height / 30} m) : x = longueur (0 = ligne de fond gauche, 1 = ligne de fond droite) ; y = largeur (0 = touche du haut, 1 = touche du bas).
- Paniers : gauche (${r3(1 - BASKET.full.x)}, 0.5), droit (${r3(BASKET.full.x)}, 0.5). Ligne médiane : x = 0.5.
- Raquette droite : x de ${fullKey} à 1, y de ${keyX1} à ${keyX2} (symétrique à gauche). Sommet de l'arc à 3 points droit : x = ${fullThree}.
- Convention : l'attaque se dirige vers le panier DROIT.
ESPACEMENT MINIMAL entre deux pions d'une même vignette : demi-terrain ${gap("half")} ; tout-terrain ${gap("full")}.`.trim();
}

const COMMON_RULES = `
Tu es un entraîneur de basket diplômé (méthodes FFBB) qui conçoit des fiches pour d'autres coachs. Tout le contenu est en français, concret et applicable à l'entraînement : consignes courtes, vocabulaire du basket, aucune généralité.`.trim();

/** Consigne système pour la génération d'un exercice (stable, mise en cache). */
export function exerciseSystemPrompt(): string {
  const examples = demoExercises.map((e) => JSON.stringify(exerciseToContent(e))).join("\n\n");
  return `${COMMON_RULES}

Tu produis UNE fiche d'exercice au format JSON imposé. Règles de contenu :
- "title" ≤ 80 caractères ; "titleAccent" facultatif = une partie exacte du titre à mettre en couleur (ex. "+ 1") ; "kicker" = « Thème · Sous-thème ».
- "slug" : minuscules et tirets (il sera recalculé). "id" : mets "ia".
- "ageRange" : catégories parmi ${AGE_CATEGORIES.join(", ")}, "from" ≤ "to". "difficulty" : debutant | intermediaire | avance.
- "params.space" : "demi-terrain" (alors diagram.court = "half") ou "tout-terrain" (alors diagram.court = "full").
- "challenge.metrics" : 1 à 4 chiffres clés courts (valeur ≤ 8 caractères, libellé ≤ 20), "statement" = le défi mesurable.
- "steps" : 3 à 5 étapes (mise en place, déroulement, rotation). "technicalPoints" : 2 à 4 points clés. "variants" : simplifier / complexifier. "coachTips" : conseils par situation.
- "diagram.frames" : 3 ou 4 vignettes qui racontent l'exercice comme un film (titre ≤ 40, légende ≤ 200, "tag" facultatif ≤ 10 caractères). Garde les mêmes "id" de joueurs d'une vignette à l'autre ; les positions d'une vignette reprennent l'arrivée de la précédente ; mets les positions de départ en "ghosts" quand un joueur s'est déplacé.
- Pions : "attacker" (label "1", "2"…), "defender" (pas de label), "plus_one", "cone". Un seul "hasBall": true par vignette.
- Actions : "run" (course), "dribble" (uniquement le porteur), "pass" (du passeur vers le receveur), "shot" (dernier point = panier exact). "actor" : attacker | defender | plus_one. 2 à 12 points chacune, le premier point sur le joueur.

Repères du terrain (coordonnées normalisées de 0 à 1) :
${courtReference()}

Exemples de fiches valides (même format, à ne pas recopier) :
${examples}`;
}

export type ExerciseBrief = {
  brief: string;
  category?: string;
  space?: "demi-terrain" | "tout-terrain";
  players?: number;
  durationMin?: number;
};

export function exerciseUserPrompt(b: ExerciseBrief): string {
  const constraints = [
    b.category && `Catégorie visée : ${b.category} (la plage d'âge doit l'inclure).`,
    b.space && `Espace imposé : ${b.space}.`,
    b.players && `Nombre de joueurs disponibles : ${b.players} (la plage de joueurs doit l'inclure).`,
    b.durationMin && `Durée visée : environ ${b.durationMin} minutes.`,
  ].filter(Boolean);
  return `Conçois une fiche d'exercice pour la demande suivante :\n« ${b.brief.trim()} »${constraints.length ? `\n\nContraintes :\n- ${constraints.join("\n- ")}` : ""}`;
}

/** Consigne système pour la génération d'une séance (stable, mise en cache). */
export function sessionSystemPrompt(): string {
  return `${COMMON_RULES}

Tu produis UNE séance d'entraînement au format JSON imposé. Règles :
- Phases dans l'ordre logique, types parmi ${SESSION_PHASES.join(", ")} : échauffement, technique, situation, jeu & match, retour au calme.
- Chaque phase a "durationMin" (minutes entières), un "goal" (objectif & consignes clés, ≤ 240 caractères) et SOIT "exerciseId" (identifiant EXACT d'un exercice de la liste fournie), SOIT "content" (contenu libre ≤ 160 caractères). N'invente jamais d'identifiant.
- Exactement une phase "isFlagship": true (la situation phare), et elle doit reprendre un exercice de la liste ("exerciseId").
- "keyInfo" : objectif principal, focus technique, espace & matériel, assistance (≤ 80 caractères chacun).
- "flagship" : adaptations facultatives de la fiche de la situation phare pour cette séance (titre, énoncé du défi, consignes techniques, rotations, conseil d'accompagnement).
- "globalTip" : un conseil global d'assistance adapté à la catégorie.
- "id" : mets "ia" ; "number" : mets 1 (il sera remplacé).

Exemple de séance valide (même format, à ne pas recopier) :
${JSON.stringify(sessionToContent(seance14))}`;
}

export type SessionBrief = {
  brief: string;
  category: string;
  team?: string;
  players: number;
  plannedDurationMin: number;
};

/** Résumé compact des exercices disponibles, transmis au modèle. */
export function bankSummary(list: Exercise[]): string {
  return list
    .map((e) =>
      JSON.stringify({
        id: e.id,
        titre: e.title,
        espace: e.params.space,
        themes: e.themes,
        categories: `${e.ageRange.from}-${e.ageRange.to}`,
        duree: `${e.params.durationMin.min}-${e.params.durationMin.max}`,
        joueurs: `${e.params.players.min}-${e.params.players.max}`,
        niveau: e.difficulty,
      }),
    )
    .join("\n");
}

export function sessionUserPrompt(b: SessionBrief, bank: Exercise[]): string {
  return `Construis une séance pour la demande suivante :
« ${b.brief.trim()} »

Contraintes :
- Catégorie : ${b.category}${b.team ? ` (équipe « ${b.team} »)` : ""} ; ${b.players} joueurs.
- Durée totale : EXACTEMENT ${b.plannedDurationMin} minutes (somme des phases) ; "plannedDurationMin" = ${b.plannedDurationMin}.

Exercices disponibles dans la banque du club (un par ligne) :
${bank.length ? bankSummary(bank) : "(aucun : utilise des contenus libres, sauf pour la situation phare qui est alors impossible — choisis tout de même le plus proche si la liste n'est pas vide)"}`;
}

/** Message de correction envoyé au modèle quand sa réponse ne passe pas la validation. */
export const repairPrompt = (problems: string[]) =>
  `Ta réponse ne passe pas la validation. Corrige UNIQUEMENT ces points et renvoie l'objet JSON complet :\n- ${problems.join("\n- ")}`;
