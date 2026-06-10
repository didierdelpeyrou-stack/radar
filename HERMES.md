# HERMES — RADAR

Documentation principale du projet. Lecture obligatoire pour tout développeur successeur.
Point d'entrée unique. Tout le reste découle d'ici (voir section « Documents liés »).

Dernière mise à jour : 2026-06-10.

---

## 1. Vision projet

**RADAR** (« Repérage des Aides et Droits A activer en non-Recours ») est l'outil de
travail des accompagnant·e·s du **Centre Social et Culturel Solidarité Roquette**
(47 rue de la Roquette, 75011 Paris), dans le cadre du projet **2024N0043 « Agir contre
le non-recours aux droits pour améliorer le pouvoir d'achat »** (financement Fondation
des Solidarités Urbaines ; évaluation d'impact externe : cabinet Improve ; reporting Optimy).

RADAR digitalise le **Protocole de détection des droits sociaux** (mai 2026). Il
n'est **ni** un simulateur **ni** un substitut à l'entretien : il **structure, complète
et trace** l'accompagnement, et automatise la **détection locale complémentaire** que
`mesdroitssociaux.gouv.fr` ne couvre pas (CASVP — Paris Logement, Paris Énergie
Familles… —, Île-de-France Mobilités, FSL parisien).

**Finalité = pouvoir d'achat.** Tout se lit comme une chaîne : *droits repérés →
démarches → aides → pouvoir d'achat*. Le levier produit central est de **rendre visible
l'invisible** : chiffrer le montant annuel détecté mais non perçu.

**Garde-fous non négociables (protocole §10) :** inconditionnalité de l'accueil (aucun
champ bloquant lié à la nationalité/au statut) ; non-substitution (« avec la personne »,
jamais « à sa place ») ; **la personne décide** (aucune case pré-cochée) ; aucune
décision automatique opposable (« estimation indicative ») ; **pas de scoring** de la
personne ; posture non-jugeante partout.

---

## 2. Stack technique

- **Frontend** : React 18 + Vite 5 + TypeScript strict + Tailwind CSS. **PWA**
  (installable, offline — `vite-plugin-pwa`), pour le wifi instable des permanences.
- **Routage** : `react-router-dom` en **HashRouter** (hébergement statique simple).
- **Persistance** : **local-first** (localStorage, store réactif maison) en attendant
  le branchement Supabase. Aucune donnée ne quitte le poste tant que la synchro H/IA
  n'est pas câblée.
- **Backend cible** : Supabase self-hosted H/IA (Postgres 16 + Auth + PostgREST +
  Storage + pg_cron). Schéma + RLS + seed déjà écrits (`supabase/`).
- **PDF** : `@react-pdf/renderer` (fiche récapitulative), chargé à la demande (code-split).
- **Tests** : Vitest (moteur de règles + 4 personas). Playwright prévu (parcours).
- **Accessibilité** : RGAA 4 / WCAG AA — base 18px, contrastes forts, libellés FALC,
  navigation clavier (co-regardé à l'écran avec des personnes en illectronisme).

**Charte** (Solidarité Roquette) : marine `#1B2443`, teal `#105363`, corail `#E94C47`,
doré `#FAB826`, fonds lavés `#FCEBEA / #FEF4DC / #EDF0F5`. Titres DM Sans, corps system-ui.
Encadrés bleus = éléments-clés, encadrés jaunes = vigilance. **Pas de Google Fonts en
runtime** (polices auto-hébergées), pas de tracking tiers.

---

## 3. Architecture des dossiers

```
src/
  domain/
    types.ts             # Schéma des 7 blocs du diagnostic (Annexe C)
    catalogue.ts         # ★ Dispositifs + règles structurées (Annexe A) — source de vérité du moteur
    pieces.ts            # Base des pièces justificatives (Annexe B)
    bilan.ts             # Indicateurs d'impact figés (rapport Improve mai 2026) — NE PAS recalculer
  engine/                # ★ Moteur d'éligibilité déterministe (aucune IA)
    model.ts             # Types : Verdict, Condition, Dispositif, Profil…
    profil.ts            # construireProfil() : 7 blocs → profil normalisé
    engine.ts            # detecter() : évaluation + effets d'entraînement (point fixe) + non-cumuls
    personas.test.ts     # ★ Critères d'acceptation §9 — 4 personas (27 assertions)
  lib/
    session.tsx          # Session + 3 rôles (admin/cad/ep), droits dérivés (peut())
    dossiers.ts          # Store des dossiers (local-first, pub/sub) — CRUD + autosave
    useDossiers.ts       # Hook réactif (useSyncExternalStore)
    nudges.ts            # ★ Nudges éthiques : chiffrage € annuel non perçu (parseMontantAnnuel)
  wizard/                # Parcours diagnostic = 5 étapes du protocole
    store.tsx            # État du wizard pour UN dossier + mode session éphémère
    Step1Accueil…Step5PlanAction.tsx
    Wizard.tsx           # Coquille (barre de progression, navigation)
    calculs.ts           # Taux d'effort, QF, alerte titre < 4 mois
    priorite.ts          # Tri du plan (urgence > impact mensuel > effet d'entraînement)
    pjMap.ts             # dispositif → jeu de PJ
    useDetection.ts      # Hook : diagnostic → résultats du moteur
  screens/               # Écrans (§7)
    Login, Dashboard, DossierScreen, DashboardImpact, AdminReferentiels,
    UrgencesPage, Mentions, Sources, SimulationFlash (accueil), Demo
  ui/
    fields.tsx           # Primitives accessibles (Champ, Selecteur, Bascule, Pourquoi, encadrés)
    Accordeon.tsx        # Accordéon « un bloc à la fois » (étape 2)
    ContactReferent.tsx  # Carte « ne restez pas seul·e » (urgences/accueil)
    NonRecoursBanner.tsx # Bannière nudge : montant annuel détecté non perçu
    FeedbackAmpoule.tsx  # 💡 Widget de retour (phase alpha, localStorage)
  pdf/FicheRecapitulative.tsx   # PDF « fiche récapitulative » (terminologie exacte)
supabase/
  migrations/0001_init.sql   # Schéma + RLS stricte + anonymisation J+24 mois + vue indicateurs
  seed.sql                   # Généré depuis catalogue.ts + pieces.ts (npm run seed:sql)
scripts/generate-seed.ts
Dockerfile · Caddyfile · docker-compose.yml   # Déploiement radar.h-ia.fr
```

---

## 4. Conventions

- **Le moteur ne décide jamais par IA.** Tout verdict est la trace d'une règle versionnée,
  avec les valeurs comparées (raison si `non_eligible`, question si `a_verifier`). Une IA
  ne peut qu'éventuellement reformuler en langage clair — jamais produire le verdict.
- **Source de vérité = `src/domain/catalogue.ts`.** Le SQL (`seed.sql`) en est dérivé
  (`npm run seed:sql`). Ne pas diverger : éditer le TS, régénérer le seed.
- **Tout montant/plafond porte `a_verifier_avant_prod: true` + `date_source` + `source`.**
  Revue annuelle obligatoire (cf. `docs/MAJ_PLAFONDS.md`). L'écran admin et la page
  Sources affichent en rouge / « à vérifier » tout paramètre de plus de 12 mois.
- **Tout changement de règle relance la suite de tests** (`npm test`) : les 4 personas
  (§9) doivent rester verts.
- **`bilan.ts` ne se recalcule pas côté outil** : ce sont les chiffres figés du rapport
  d'impact / bilan intermédiaire. À actualiser à la main au prochain bilan, avec la source.
- **Aucune case pré-cochée** (`souhaite_engager` toujours `false` par défaut). **Pas de
  scoring** de la personne. Estimation toujours « indicative ».
- **Minimisation RGPD** : pas de NIR, pas de n° de titre de séjour, **aucun identifiant /
  mot de passe FranceConnect/CAF/Ameli** stocké ni saisi.
- **Mode session éphémère** : si le consentement case 1 est refusé, `ephemere = true` et
  rien n'est persisté (`majWizard` no-op) — seul un PDF peut être remis.

---

## 5. Le moteur d'éligibilité (cœur de RADAR)

`construireProfil(diagnostic, ctx)` normalise les 7 blocs en un `Profil` (seule entrée des
règles). `detecter(DISPOSITIFS, profil)` :

1. Calcule les **déclencheurs initiaux** (RSA/ASPA/AAH/AME/CSS-sans-participation perçus).
2. Évalue chaque dispositif (conditions structurées ET, ou évaluateur spécifique pour
   CSS sans/avec participation, ASPA différentielle, RSA selon statut…).
3. Propage les **effets d'entraînement** par **point fixe** (RSA → CSS sans participation
   → Solidarité Transport).
4. Applique les **non-cumuls** (un dispositif tombe si un de ses non-cumuls est retenu).

Verdicts : `eligible_probable` / `a_verifier` (avec question) / `non_eligible` (avec
raison) / `deja_percu`. 30 dispositifs chargés, dont les 18 prioritaires MVP.

**Personas (§9)** — `src/engine/personas.test.ts`, 27 assertions vertes : P1 (mère isolée
→ PLFM 150 €, PEF 138 €, non-cumuls), P2 (senior → ASPA → CSS sans participation →
Solidarité Transport, Complément Santé Paris exclu), P3 (primo-arrivant → toutes les aides
CASVP refusées avec la raison « ancienneté Paris < 3 ans/5 », RSA en `a_verifier`).

---

## 6. Modèle de données & RGPD

Schéma Postgres complet dans `supabase/migrations/0001_init.sql` : `profiles`, `dossiers`,
`personnes` (séparée pour purge), `consentements`, `diagnostics` (7 blocs JSONB),
`simulations_mds`, `detections`, `plans_action`, `rdv`, `dispositifs`, `regles`,
`pieces_justificatives`, `audit_log`, + vue matérialisée `indicateurs_mensuels` (anonyme).

**RLS stricte** : un dossier n'est visible que par son accompagnant référent + `admin`.
**Anonymisation J+24 mois** automatique (pg_cron). Indicateurs FSU strictement anonymisés.
Page « Mentions & registre » en ligne. Hébergement H/IA (UE exclusivement, DPA art. 28).

Côté client tant que Supabase n'est pas câblé : `lib/dossiers.ts` (localStorage). La
bascule ne touchera que `lib/session.tsx` + `lib/dossiers.ts` (mêmes types, mêmes rôles).

---

## 7. Rôles & écrans

4 rôles (`lib/session.tsx`) : **admin** (tout + impact + référentiels), **cad** (tous les
dossiers), **ep** (ses dossiers), **accueil** (première ligne : simulation flash 10 min +
prise de RDV avec un CAD, **sans accès aux dossiers nominatifs** — routes /dossier, /impact,
/admin bloquées par `SansAccueil`). Le rôle accueil entre directement sur `/flash`
(`SimulationFlash`) : repérage express → création d'un **dossier flash** (origine `flash`)
pré-rempli + un **RDV** transmis au CAD qui reprend le diagnostic complet.
Écrans : Login, Dashboard (alertes titre < 4 mois +
rappels saisonniers ARS/bourses), wizard 5 étapes par dossier, Détection (3 colonnes +
filtre déterminant), Plan d'action (tri, PJ, anti-surcharge), Dossier (clôture / export
JSON / suppression admin), **Impact** (indicateurs du `bilan.ts` + agrégats anonymisés),
**Référentiels** (catalogue + fraîcheur), **Urgences** (numéros + conduites + `ContactReferent`),
**Sources** (origine et date de chaque chiffre), **Mentions**, **Démo** (4 personas).

L'étape 2 (les 7 blocs) utilise l'**accordéon « un bloc à la fois »** (`ui/Accordeon`) pour
ne pas noyer la personne. Le widget **💡 FeedbackAmpoule** (phase alpha) capte les retours.

---

## 8. Commandes

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # moteur + 4 personas (27 assertions)
npm run typecheck
npm run build        # tsc -b && vite build (PWA incluse)
npm run preview      # sert dist/ — http://localhost:4173
npm run seed:sql     # régénère supabase/seed.sql depuis le catalogue TS
```

---

## 9. Déploiement (radar.h-ia.fr)

Hébergé et exploité par **H/IA** (h-ia.fr), serveurs UE, convention de mutualisation
(art. 261 B du CGI) + sous-traitance RGPD art. 28. Mise en ligne **par H/IA** en une
commande (`docker compose up -d --build` → Caddy + TLS Let's Encrypt sur
`radar.h-ia.fr`). Détails : `docs/DEPLOIEMENT_HIA.md`. **Le repo Git ne se déploie pas
tout seul** : il faut les accès infra H/IA (que l'assistant n'a pas).

Repo : `github.com/didierdelpeyrou-stack/radar` (privé).

---

## 10. État au 2026-06-10

Application **complète et fonctionnelle en local-first**, build + 27 tests verts.
Tout le parcours (5 étapes, détection, plan, PDF), tous les écrans, la PWA, les nudges
et les artefacts de déploiement sont livrés. Bilan d'impact réel intégré (rapport Improve,
N=21 : 81 % de diagnostics avec au moins un droit, 1,7 droit/diagnostic).

**Reste pour le go-live réel** (cf. `ROADMAP.md`) :
- Brancher Supabase self-hosted H/IA (remplacer le store local-first par PostgREST/Auth —
  migration transparente, tables + RLS + seed déjà prêts).
- Tests Playwright du parcours 5 étapes.
- Fiabiliser les plafonds CASVP différenciés couple/seul et coefficients FSL (modélisés
  par un plafond unique conservateur en MVP, marqués dans `source`).

---

## 11. Documents liés

- `README.md` — démarrage et survol.
- `ROADMAP.md` — phasage MVP / V1 / V2 et dette.
- `docs/DEPLOIEMENT_HIA.md` — déploiement Docker/Caddy/Supabase sur l'infra H/IA.
- `docs/MAJ_PLAFONDS.md` — procédure de revue annuelle des plafonds.
- `supabase/migrations/0001_init.sql` — schéma + RLS + anonymisation.
