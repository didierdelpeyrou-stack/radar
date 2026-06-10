# Concertation Argus × Studio Cybernétique — RADAR

Projet : RADAR (export-hermes, commit 039ad22) · Date : 11 juin 2026

## Casting

- **Argus**, inspecteur général — compare le promis au réel, simule les scénarios d'attaque et de dérive RGPD.
- **Studio Cybernétique**, studio systémique — boucles d'engagement, UX d'entretien, éthique d'usage terrain.

Chacun a produit son rapport en aveugle, indépendamment, avant cette concertation.

---

## 1. Points de consensus

**C1. Le cœur métier est exemplaire — et ne doit pas bouger.**
Argus : « moteur déterministe, point fixe borné à 6 itérations, non-cumuls symétriques testés, verdicts tracés. Cœur sain. Zéro any, zéro TODO, secrets propres. »
Studio Cyber : « la doctrine éthique est réellement encodée dans le code, pas seulement affichée : rien de pré-coché, pas de scoring, session éphémère effective. »
→ ARBITRAGE COMMUN : sanctuariser le moteur. Ajouter des tests qui verrouillent les garde-fous éthiques (souhaite_engager=false par défaut, no-op éphémère).

**C2. Le local-first actuel est un pilote, pas un produit déployable.**
Argus : « Login.tsx : on tape un nom et on coche son propre rôle, sans mot de passe. Zéro createClient Supabase dans src/. RLS, anonymisation pg_cron : jamais câblés. Cloisonnement cosmétique. »
Studio Cyber : « dossiers nominatifs en localStorage non chiffré sur postes potentiellement partagés. Acceptable en pilote fermé, à dire explicitement dans Mentions ; bloquant sinon. »
→ ARBITRAGE COMMUN : GO pilote mono-poste maîtrisé, NO-GO ferme sur toute mise en ligne avant câblage Supabase Auth + RLS testée.

**C3. Les dates codées en dur '2026-06-10/11' sont une bombe à retardement.**
Argus : « âges et alertes titre de séjour se figent à juin 2026 — faux négatifs silencieux dès que le temps passe » (8 fichiers).
Studio Cyber : « bombe à retardement au 1er janvier. »
→ ARBITRAGE COMMUN : date du jour centralisée, fix trivial, immédiat.

**C4. Le chiffre €/an surestime — la pire chose pour un public en précarité.**
Argus : « nudges.ts multiplie ×12 des plafonds différentiels (RSA/ASPA). »
Studio Cyber : « parseMontantAnnuel prend le premier nombre des libellés "jusqu'à X €" → promesse déçue, destructrice de confiance. »
→ ARBITRAGE COMMUN : étiqueter le total « au maximum » immédiatement, pondérer les différentiels.

**C5. Incohérences documentaires.** HERMES.md dit 30 dispositifs et 4 personas ; le réel est 35 et 3. DEPLOIEMENT_VPS contredit HERMES §7 sur la visibilité des dossiers cad. À trancher.

---

## 2. Désaccords fertiles

**D1. Quel est LE bug P0 ?**
Argus : la persistance sans consentement (creerDossier écrit AVANT l'étape 1, ephemere:false par défaut, SimulationFlash écrit un dossier nominatif santé+admin sans écran de consentement). Verrou juridique.
Studio Cyber : la boucle de suivi morte (engages en useState local jamais écrit dans state.plan, statuts EC/OK/REF/RC/ATT inutilisés → choix de la personne perdu, impact FSU improuvable). Verrou existentiel : le financement repose sur la preuve d'impact.
→ Arbitrage : les deux sont P0 mais pas pour le même horizon. Le consentement bloque tout usage avec données réelles, même en pilote — il passe devant. La boucle de suivi bloque le go-live et l'évaluation FSU. Studio Cyber concède l'ordre ; Argus concède que sans suivi son GO conditionnel ne mène nulle part.

**D2. Angles morts croisés.**
Studio Cyber avait vu le consentement mesure_impact non filtré dans DashboardImpact ; Argus est passé à côté. Argus a débusqué l'enum role_app sans 'accueil' (rôle 'invite' fantôme, 0001_init.sql:12) que Studio Cyber n'a pas regardé. Les deux trous se complètent — valeur du double regard.

**D3. Étendre le catalogue ?**
Argus : hors périmètre tant que les P0 tiennent.
Studio Cyber : « l'exhaustivité sans suivi ne ferait qu'allonger la colonne "détecté jamais activé" » — fiabiliser CASVP/FSL avant d'ajouter.
→ Arbitrage : gel du catalogue à 35 jusqu'à boucle de suivi vivante.

---

## 3. Verdict signé à deux

**GO CONDITIONNEL** — pilote local-first sur poste maîtrisé uniquement, sous 7 conditions mesurables.

### J+2 (verrous techniques, Argus pilote)

1. ephemere:true par défaut ; aucun dossier persisté avant recueil du consentement ; SimulationFlash passe par un écran de recueil. Test : refus case 1 → localStorage inchangé.
2. Persister le plan d'action : engages → state.plan (souhaite_engager, statut EC, qui_fait_quoi, echeance) + « prochain RDV » à l'étape 5 + reflet dans le PDF.
3. Dates du jour centralisées (new Date()), plus aucun '2026-06-1x' en dur dans src/.
4. DashboardImpact filtré sur consentement.mesure_impact.
5. Total €/an étiqueté « au maximum » + correction nudges.ts sur les différentiels.

### J+30 (verrous organisationnels et déploiement, Studio Cyber pilote)

6. Branchement Supabase réel : Auth (rôle dérivé du serveur, jamais choisi), enum role_app corrigée (accueil), suite de tests RLS verte sur base déployée, anonymisation pg_cron effective.
7. Écran Suivi des démarches (EC/OK/REF/RC/ATT) avec indicateur Dashboard qui descend quand les démarches aboutissent ; injection des résultats MDS au plan ; état « non renseigné » ≠ 0 dans le moteur ; section « non éligible » du PDF débrayable au choix de la personne.

### Backlog 4-12 semaines (ni bloquant ni urgent)

- Vue restitution « côté personne », conditions remplies/manquantes (« 3/4, manque X »), FALC des sélecteurs, bouton copier étape 3, file d'affectation des dossiers flash, PDF multilingue (avant toute i18n d'interface), audit log alimenté, Playwright, corrections doc (35 dispositifs, 3 personas, DEPLOIEMENT_VPS).

---

## 4. Signatures

> « Le cœur est sain ; la cuirasse est en papier. On ne met pas en ligne des données de santé derrière un login qui se coche soi-même. GO pilote, NO-GO réseau. » — Argus, 11/06/2026

> « RADAR a réussi le plus difficile — un moteur honnête et une posture juste — et différé le plus simple : sauvegarder ce que la personne a décidé. Corriger ce paradoxe est la seule urgence véritable. » — Studio Cybernétique, 11/06/2026
