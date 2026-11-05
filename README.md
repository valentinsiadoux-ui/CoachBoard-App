# CoachBoard

Assistant IA pour entraîneurs de basket : banque d'exercices, concepteur de séances, co-pilote Claude.

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # validation des schémas Zod
npm run typecheck
```

## Structure

- `src/lib/schemas/` : schémas Zod, source unique de vérité (UI, base, sorties de Claude)
- `src/lib/court/` : géométrie du terrain et helpers de tracé SVG
- `src/components/court/` : rendu SVG des terrains et schémas tactiques
- `src/components/exercise/` : fiche d'exercice
- `src/data/exercises/` : exercices de démonstration (typés et validés)

## Feuille de route

0. Fondations · 1. Fiche d'exercice · 2. Banque (Supabase) · 3. Concepteur de séance
4. Export PDF · 5. Co-pilote Claude · 6. Cycles · 7. V2+
