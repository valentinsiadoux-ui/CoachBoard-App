# CoachBoard · Propositions V2+

Les étapes 0 à 6 sont livrées. Voici les évolutions proposées, classées par valeur pour un
entraîneur et par effort estimé (S : quelques heures · M : 1 à 2 jours · L : plusieurs jours).
Rien n'est engagé : à prioriser ensemble après le test global.

## Priorité 1 · Au bord du terrain

| Évolution | Pourquoi | Effort |
|---|---|---|
| **Mode terrain** (tablette/téléphone) : séance du jour en plein écran, chrono par phase, compteur du défi (paniers, passes), rotation suivante | Utiliser CoachBoard pendant l'entraînement, pas seulement pour le préparer | M |
| **Lecture animée du film** : les vignettes s'enchaînent, les joueurs glissent d'une position à l'autre | Expliquer l'exercice aux joueurs en 10 secondes | M |
| **Hors connexion (PWA)** : fiches et séance du jour disponibles sans réseau dans le gymnase | Beaucoup de salles n'ont pas de réseau fiable | M |

## Priorité 2 · Suivi des joueurs et du cycle

| Évolution | Pourquoi | Effort |
|---|---|---|
| **Effectif** : joueurs par équipe, présences par séance | Base du suivi individuel | M |
| **Bilan de séance** : ressenti (RPE), réussite du défi, notes du coach ; charge réelle vs prévue | Ajuster la séance suivante sur des faits | M |
| **Évaluation des critères de réussite** du cycle (case à cocher + mesure), historique d'un cycle à l'autre | Rendre la progression visible | S |
| **Calendrier** : séances datées, vue mois, export iCal | Planifier la saison | M |

## Priorité 3 · Co-pilote IA, plus loin

| Évolution | Pourquoi | Effort |
|---|---|---|
| **Générer un cycle complet** (thèmes, objectifs, séances existantes ou à créer) | Prolonge naturellement l'étape 6 | M |
| **« Adapter cette fiche »** : autre catégorie, moins de joueurs, demi-terrain, version simplifiée | Réutiliser au lieu de recréer | S |
| **Relecture pédagogique** : l'IA signale incohérences (durées, progression, charge) avant enregistrement | Filet de sécurité pour les jeunes coachs | S |
| **Bilan de cycle rédigé** à partir des bilans de séance | Gain de temps en fin de cycle | S |

## Priorité 4 · Partage et club

| Évolution | Pourquoi | Effort |
|---|---|---|
| **Lien de partage en lecture seule** d'une fiche (parents, assistants, autre club) | Diffusion sans compte | S |
| **Bibliothèque inter-clubs** : publier un exercice, le dupliquer chez soi | Mutualiser le travail des clubs | M |
| **Export / import** JSON (sauvegarde, migration) | Maîtrise des données | S |
| **Envoi de la fiche par e-mail** (PDF généré côté serveur) | Partage direct depuis l'application | M |

## Socle technique

| Évolution | Pourquoi | Effort |
|---|---|---|
| **Tests de bout en bout automatisés** (Playwright) et intégration continue GitHub Actions (typecheck, tests, build, tests SQL) | Détecter une régression avant le déploiement | M |
| **Types Supabase générés** (`supabase gen types`) à la place des types écrits à la main | Moins d'écarts possibles entre base et code | S |
| **Supabase CLI** : migrations appliquées automatiquement (`supabase db push`) | Plus de copier-coller dans l'éditeur SQL | S |
| **Suivi des erreurs** en production (journalisation, alertes) | Savoir quand un coach est bloqué | S |
| **Tableau de consommation IA** par club (à partir de `ai_generations`) | Maîtriser le coût | S |
