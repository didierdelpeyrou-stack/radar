# RADAR — Repérage des Aides et Droits A activer en non-Recours

Outil de travail des Chargé·e·s d'Accès aux Droits (CAD) et écrivains publics du
**Centre Social et Culturel Solidarité Roquette** (75011 Paris), dans le cadre du
projet « Agir contre le non-recours aux droits » (Fondation des Solidarités Urbaines).

RADAR digitalise le **Protocole de détection des droits sociaux** (mai 2026). Il ne
remplace ni l'entretien ni `mesdroitssociaux.gouv.fr` : il **structure, complète et
trace**, et automatise la **détection locale complémentaire** (CASVP, Île-de-France
Mobilités, FSL parisien) que le simulateur national ne couvre pas.

> ⚠️ Estimation indicative — les démarches restent à faire et seules les
> administrations ouvrent les droits. On fait **avec** la personne, jamais à sa place.

## Stack

React 18 + Vite + TypeScript + Tailwind · Supabase (Postgres 16 + Auth + Storage +
pg_cron, self-hosted H/IA) · `@react-pdf/renderer` · Vitest + Playwright.

## Démarrage

```bash
npm install
cp .env.example .env      # renseigner VITE_SUPABASE_URL / ANON_KEY
npm run dev               # app de démonstration (vue détection — étape 4)
npm test                  # moteur de règles : les 4 personas (§9)
npm run build             # build de production
npm run seed:sql          # régénère supabase/seed.sql depuis le catalogue TS
```

## Le moteur d'éligibilité (cœur de RADAR)

- **Déterministe et explicable. Aucune IA ne décide d'une éligibilité** (protocole §3).
  Chaque verdict porte sa raison (`non_eligible`) ou sa question (`a_verifier`).
- Source de vérité : [`src/domain/catalogue.ts`](src/domain/catalogue.ts) (dispositifs +
  règles structurées, Annexe A) — re-sérialisée vers la table `regles` pour l'édition
  admin sans redéploiement (§3.2).
- Effets d'entraînement (RSA → CSS sans participation → Solidarité Transport) résolus
  par **point fixe** ; non-cumuls appliqués ensuite ([`src/engine/engine.ts`](src/engine/engine.ts)).
- Tous les montants/plafonds portent `a_verifier_avant_prod: true` + `date_source` +
  `source` : **revue annuelle obligatoire** (voir `docs/MAJ_PLAFONDS.md`).
- Tests d'acceptation : [`src/engine/personas.test.ts`](src/engine/personas.test.ts)
  (27 assertions sur P1/P2/P3, verts).

## Base de données & RGPD

- Schéma + **Row Level Security stricte** : [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
  Un dossier n'est visible que par son accompagnant référent + `admin`.
- **Anonymisation J+24 mois** automatique (pg_cron) ; indicateurs FSU strictement anonymisés.
- Données particulières (santé, situation administrative) : minimisation (pas de NIR,
  pas de n° de titre, **aucun identifiant FranceConnect/CAF/Ameli stocké ni saisi**).

## Déploiement sur l'infrastructure H/IA

Voir [`docs/DEPLOIEMENT_HIA.md`](docs/DEPLOIEMENT_HIA.md) : Docker Compose (Supabase
self-hosted + reverse proxy TLS Let's Encrypt sur `radar.h-ia.fr`), sauvegardes
chiffrées hors site, supervision Prometheus/Grafana. Variante pilote : Supabase Cloud
région UE (code identique, seules les variables d'env changent).

## État d'avancement

Voir [`ROADMAP.md`](ROADMAP.md). Le socle livré (sprint 1, vérifiable) : schéma SQL +
RLS, catalogue + règles (30 dispositifs dont les 18 prioritaires MVP), moteur
déterministe + tests des 4 personas, génération du seed, app shell + vue détection.
Restent à construire : wizard 5 étapes complet, PDF fiche récapitulative, suivi /
relances, mode tiers-lieu, dashboard impact, écran admin référentiels, PWA offline.
