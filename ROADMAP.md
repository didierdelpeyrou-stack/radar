# RADAR — feuille de route

## ✅ Sprint 1 — socle livré (vérifiable)

- [x] Scaffold React 18 + Vite + TS + Tailwind (charte Solidarité Roquette).
- [x] Schéma SQL complet + **RLS stricte** sur toutes les tables + audit_log +
      anonymisation J+24 mois (pg_cron) + vue indicateurs anonymisés
      (`supabase/migrations/0001_init.sql`).
- [x] Types des 7 blocs du diagnostic (Annexe C) — `src/domain/types.ts`.
- [x] Catalogue + règles structurées : 30 dispositifs dont **les 18 prioritaires
      MVP** (RSA, PA, APL/ALF/ALS, CSS, ASF, AF, ARS, chèque énergie, AAH, ASPA,
      Paris Logement ×3, Paris Solidarité, PEF, FSL Énergie ×2, Solidarité Transport)
      — `src/domain/catalogue.ts`. Chaque montant porte `a_verifier_avant_prod` + `date_source`.
- [x] **Moteur déterministe et explicable** : verdicts `eligible_probable` /
      `a_verifier` (avec question) / `non_eligible` (avec raison) / `deja_percu`,
      effets d'entraînement (point fixe), non-cumuls — `src/engine/`.
- [x] **Tests d'acceptation des 4 personas (§9)** — 27 assertions vertes
      (`src/engine/personas.test.ts`).
- [x] Base PJ (Annexe B, 24 jeux) + générateur de seed SQL (`npm run seed:sql`).
- [x] App shell + vue détection 3 colonnes (✅🟡❌) avec sélecteur de personas.

## ⏳ Reste du MVP (sprint 1-2)

- [ ] Auth Supabase + 4 rôles (admin/cad/ep/invite) + garde RLS côté client.
- [ ] **Wizard diagnostic 5 étapes** : accueil/urgences/consentement (2 cases +
      mode session éphémère), 7 blocs avec info-bulles « pourquoi », simulation MDS
      (récap + grille de saisie), détection, restitution + plan d'action.
- [ ] Calculs auto exposés dans l'UI : taux d'effort (seuil 30 %), QF, alerte titre < 4 mois.
- [ ] **PDF « Fiche récapitulative »** (`@react-pdf/renderer`) — terminologie exacte.
- [ ] Export JSON / suppression dossier (double confirmation admin) ; page Mentions & registre.

## V1 (sprint 3-4)

- [ ] Catalogue complet (~55 dispositifs, Annexe A) + démarches préfecture (checklist).
- [ ] Suivi des démarches (EC/OK/REF/RC/ATT) + relances + alertes saisonnières.
- [ ] **Mode tiers-lieu** (détection flash, 10 questions, → RDV CAD pré-rempli).
- [ ] Dashboard impact + export CSV anonymisé FSU / im-prove.
- [ ] Écran admin référentiels (édition règles/plafonds, alertes fraîcheur > 12 mois,
      diff de versions) + gestion utilisateurs.
- [ ] PWA offline (IndexedDB + resynchronisation).
- [ ] Tests Playwright du parcours 5 étapes.

## V2

- [ ] OpenFisca auto-hébergé (feature flag `openfisca`, mapping isolé `src/services/openfisca/mapping.ts`).
- [ ] PDF multilingue (ar, en, ru, bm).
- [ ] Reformulation FALC optionnelle par IA — **jamais décisionnelle**.

## Dette / points de vérification métier

- Plusieurs plafonds CASVP varient selon la composition (couple vs seul) ou sont des
  *coefficients* (FSL) : modélisés en MVP par un plafond unique conservateur, marqués
  dans `source`. **À affiner avant prod** avec les barèmes exacts du mémo CASVP.
- L'arbitrage RSA / Prime d'activité près du plafond est volontairement renvoyé en
  `a_verifier` (« à simuler sur mesdroitssociaux ») plutôt que tranché par le moteur.
