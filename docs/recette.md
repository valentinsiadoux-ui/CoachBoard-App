# Recette globale · CoachBoard (étapes 0 à 6)

Objectif : vérifier toute l'application en conditions réelles (Vercel + Supabase).
Cocher chaque ligne ; noter tout écart avec la page, l'action et le message affiché.

## A. Préparation (une seule fois)

1. **Code** : la branche `main` doit contenir le dernier commit (voir le message de livraison).
2. **Supabase → SQL Editor**, exécuter dans cet ordre (la 1re migration est déjà appliquée) :
   - [ ] `supabase/migrations/20261107000000_journal_ia.sql`
   - [ ] `supabase/migrations/20261108000000_cycles.sql`
   - [ ] `supabase/seed.sql` (met à jour la bibliothèque : étiquettes des vignettes)
3. **Vercel → Settings → Environment Variables** (Production) :
   - [ ] `ANTHROPIC_API_KEY` = clé créée sur console.anthropic.com
   - [ ] `AI_DAILY_LIMIT` (facultatif, 20 par défaut)
4. **Vercel → Deployments → Redeploy** du dernier déploiement.

## B. Compte et club

- [ ] Connexion par lien e-mail → arrivée sur la banque, adresse affichée en haut à droite.
- [ ] Mon club : le club existe, code d'invitation visible (admin).
- [ ] (Avec un 2e compte) rejoindre par code → rôle Coach ; l'admin peut le passer Admin puis Coach.

## C. Banque d'exercices

- [ ] La banque affiche les 2 exercices « Bibliothèque CoachBoard » et ceux du club.
- [ ] Filtres : catégorie U15 → 2 résultats ; U13 → aucun (bibliothèque) ; « superiorite » sans accent → trouvé ; URL partageable (copier/coller l'adresse dans un autre onglet).
- [ ] Dupliquer un exercice de la bibliothèque dans le club → ouverture de la modification.

## D. Exercice : création manuelle et éditeur de schémas

- [ ] Nouvel exercice : remplir titre, paramètres, défi, déroulé.
- [ ] Section 06 : placer 3 attaquants, 2 défenseurs ; glisser un joueur ; tracer une course (double-clic pour finir), une passe vers un partenaire, un tir (la flèche va au panier).
- [ ] Mettre un pion sur un autre → alerte « Pions qui se chevauchent ».
- [ ] « + Vignette suivante » reprend les positions ; Ctrl+Z / Ctrl+Maj+Z.
- [ ] Changer l'espace en Tout terrain → le terrain bascule.
- [ ] Enregistrer → la fiche s'affiche comme les fiches de référence ; « Modifier » retrouve tout.

## E. Co-pilote IA

- [ ] Nouvel exercice → « Générer avec le co-pilote » : décrire un exercice (ex. « 2 contre 1 en sortie de dribble, U13, 8 joueurs ») → proposition chargée dans le formulaire en 30 s à 2 min, schéma lisible.
- [ ] Relire, corriger au besoin, enregistrer.
- [ ] Nouvelle séance → générer une séance de 90 min → phases dont la somme fait 90 min, situation phare liée à un exercice de la banque.
- [ ] Le compteur « génération(s) restante(s) » diminue.
- [ ] Sans clé (facultatif) : message « Co-pilote IA désactivé ».

## F. Séances

- [ ] Nouvelle séance : numéro proposé, phases réordonnées au glisser-déposer (aussi au doigt sur tablette), exercice choisi dans la banque, durée totale et écart à la durée prévue en direct.
- [ ] Situation phare : « Reprendre le contenu de l'exercice » puis adapter.
- [ ] Fiche de séance conforme à la fiche A4 de référence ; « Dupliquer » ; « Supprimer » (confirmation).
- [ ] Sur la fiche d'exercice utilisé : « Séances qui utilisent cet exercice ».

## G. Export PDF (Chrome ou Edge)

- [ ] Fiche d'exercice → Exporter en PDF → 1 page A4 paysage, fichier nommé « Fiche exercice - … ».
- [ ] Fiche de séance → 1 page A4 portrait.
- [ ] Dossier complet → séance (portrait) + une page paysage par exercice.
- [ ] Cycle → 1 page A4 paysage.

## H. Cycles de progression

- [ ] Nouveau cycle : 4 semaines, thèmes, séances ajoutées par semaine (une séance prévue ne se propose plus ailleurs), critères de réussite.
- [ ] Fiche du cycle : dates des semaines, charge en minutes, critères à cocher.
- [ ] Sur une séance du cycle : « Cycles qui contiennent cette séance ».

## I. Droits (avec 2 comptes du même club, et 1 compte d'un autre club)

- [ ] Un coach voit les exercices / séances / cycles de son club, pas ceux d'un autre club.
- [ ] Un coach ne peut pas modifier ce qu'un autre coach a créé ; un admin le peut.
- [ ] La bibliothèque CoachBoard n'est modifiable par personne (seulement duplicable).

## Vérifié automatiquement à chaque étape (rien à faire)

`npm run typecheck`, `npm test` (56 tests), `npm run build`, `npm run test:db` (27 tests SQL
sur PostgreSQL : droits, contraintes, journal IA, cycles), contrôle visuel et PDF dans Chromium.
