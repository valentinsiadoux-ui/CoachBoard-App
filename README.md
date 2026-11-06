# CoachBoard

Assistant IA pour entraîneurs de basket : banque d'exercices, concepteur de séances, co-pilote Claude.

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # schémas Zod, filtres, utilitaires
npm run typecheck
npm run build
```

Sans configuration Supabase, l'application démarre en **mode démonstration** : la banque affiche
les exercices de démo, en lecture seule, sans connexion.

## Brancher Supabase (étape 2)

1. Créer un projet sur supabase.com.
2. Appliquer le schéma : coller les fichiers de `supabase/migrations/`, dans l'ordre de leur nom,
   dans l'éditeur SQL du projet (ou `supabase db push` avec la CLI reliée au projet).
3. Charger la bibliothèque CoachBoard : coller `supabase/seed.sql` dans l'éditeur SQL.
   Ce fichier est généré depuis `src/data/exercises` par `npm run db:seed`.
4. Authentication › URL Configuration : renseigner la *Site URL* et ajouter
   `http://localhost:3000/auth/callback` (et l'URL de production) aux *Redirect URLs*.
5. Copier `.env.example` en `.env.local` et renseigner `NEXT_PUBLIC_SUPABASE_URL` et
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings › API).

### Modèle de données

- **Clubs** : chaque exercice appartient à un club ; tous ses membres le lisent, son auteur et
  les admins du club le modifient. On crée un club (on en devient admin) ou on le rejoint avec
  un code d'invitation.
- **Bibliothèque CoachBoard** (`club_id` nul) : lisible par tous, modifiable par personne
  (alimentée par le seed). On peut la dupliquer dans son club.
- **Documents JSON** : un exercice est stocké tel que décrit par `ExerciseSchema` (Zod) dans
  la colonne `content`. Les colonnes de filtre sont générées par la base depuis ce JSON.
- **Séances** : partagées avec le club comme les exercices. Chaque phase reprend un exercice
  de la banque ou un contenu libre ; la durée totale est calculée. La situation phare est
  détaillée en seconde partie de fiche, avec des adaptations propres à la séance.

### Tests de la base

Les règles d'accès (RLS) sont testées sur un vrai PostgreSQL ≥ 15, avec une simulation
minimale de l'authentification Supabase (`tests/db/supabase-stub.sql`) :

```bash
TEST_DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db
```

Une base temporaire est créée puis supprimée. Sans `TEST_DATABASE_URL`, ces tests sont ignorés.

## Éditeur de schémas

Dans le formulaire d'exercice, section 06 : palette d'outils (joueurs, cône, course, dribble,
passe, tir, position de départ), placement au clic, déplacement par glisser-déposer (souris ou
doigt), tracés aimantés sur les joueurs, tir dirigé automatiquement vers le panier, vignettes
(« Vignette suivante » reprend les positions), annuler / rétablir, alertes de lisibilité
(pions qui se chevauchent, tir hors panier). Le JSON reste accessible en mode avancé.

## Co-pilote IA (Claude)

Sur « Nouvel exercice » et « Nouvelle séance », le co-pilote propose une fiche complète à partir
d'une demande en langage courant (schéma tactique compris ; pour une séance, il réutilise les
exercices de la banque). La proposition est chargée dans le formulaire : rien n'est enregistré
sans validation du coach.

- Modèle : Claude Opus 5.5 (`claude-opus-5-5`), sortie JSON structurée, validée par les mêmes
  schémas Zod que l'application + contrôles de lisibilité ; en cas d'écart, l'IA corrige
  (2 corrections au plus). Repli automatique côté serveur si le modèle décline une demande.
- Mise en service : ajouter `ANTHROPIC_API_KEY` (console.anthropic.com) dans les variables
  d'environnement Vercel, puis exécuter `supabase/migrations/20261107000000_journal_ia.sql`.
- Coût : facturé à l'usage par Anthropic ; chaque génération est journalisée (table
  `ai_generations`) et limitée par coach (`AI_DAILY_LIMIT`, 20 par 24 h par défaut).
- Durée : 30 s à 2 min ; les pages concernées autorisent 300 s d'exécution sur Vercel.

## Export PDF

« Exporter en PDF » ouvre la fenêtre d'impression du navigateur : choisir « Enregistrer au
format PDF ». Chaque fiche tient sur une page (exercice : A4 paysage ; séance : A4 portrait) et
le fichier est nommé d'après la fiche. « Dossier complet » réunit la fiche de séance et les
fiches de tous ses exercices dans un seul PDF. Mise en page vérifiée avec Chromium (Chrome, Edge).

## Structure

- `src/lib/schemas/` : schémas Zod, source unique de vérité (UI, base, sorties de Claude)
- `src/lib/court/` : cotes FIBA, géométrie du terrain et helpers de tracé SVG
- `src/lib/filters.ts` : filtres de la banque (URL ↔ Zod ↔ SQL / mémoire)
- `src/lib/repo/` : accès aux données (démo en mémoire ou Supabase)
- `src/lib/supabase/` : clients Supabase et types de la base
- `src/components/` : terrain SVG, fiche d'exercice, fiche de séance (A4), banque, formulaires
- `src/data/` : exercices et séance de démonstration (typés et validés)

Après une mise à jour des exercices de démonstration, régénérer et réappliquer `supabase/seed.sql`
(sans risque : il met à jour les exercices de la bibliothèque existants).
- `supabase/` : migration SQL et seed

## Feuille de route

0. Fondations · 1. Fiche d'exercice · 2. Banque (Supabase) · 3. Concepteur de séance
4. Export PDF · 5. Co-pilote Claude · 6. Cycles · 7. V2+
