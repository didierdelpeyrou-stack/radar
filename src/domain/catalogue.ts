// ─────────────────────────────────────────────────────────────────────────
// Catalogue des dispositifs + règles (Annexe A). Source de vérité du moteur.
// TOUTES les valeurs portent `a_verifier_avant_prod: true` et une date_source :
// revue annuelle obligatoire (protocole §3). Les montants/plafonds datent de
// 2024-2026 selon les référentiels internes Solidarité Roquette.
//
// Ce module sert le moteur ET la génération du seed SQL (scripts/generate-seed.ts).
// ─────────────────────────────────────────────────────────────────────────

import type { Dispositif, Profil } from '@/engine/model';

const r = (n: number) => Math.round(n);

/** Plafond RSA mensuel par taille de foyer (barème 2025). */
function rsaPlafond(p: Profil): number {
  const personnes = (p.vie === 'couple' ? 2 : 1) + p.nbEnfants;
  if (personnes <= 1) return 646.52;
  if (personnes === 2) return 969.78;
  if (personnes === 3) return 1163.74;
  if (personnes === 4) return 1357.7;
  return 1357.7 + 258.61 * (personnes - 4);
}

const SRC = (date: string, source: string) =>
  ({ date_source: date, source, a_verifier_avant_prod: true }) as const;

export const DISPOSITIFS: Dispositif[] = [
  // ─── NATIONAL / CAF ────────────────────────────────────────────────────
  {
    id: 'rsa',
    nom: 'RSA (revenu de solidarité active)',
    organisme: 'CAF',
    niveau: 'national',
    determinant: 'solidarite',
    couvert_par_mds: true,
    description:
      'Revenu minimum. ≥18 ans, France ≥9 mois/an, FR/UE ou titre ≥5 ans, ressources < plafond. Déclaration trimestrielle.',
    actif: true,
    montant: (p) => `plafond foyer ≈ ${r(rsaPlafond(p))} €/mois (différentiel)`,
    regle: {
      version: '1',
      conditions: [],
      declencheurs: ['rsa', 'css_sans_participation'],
      ...SRC('2025-01-01', 'service-public.fr / CAF'),
    },
    evaluer: (p) => {
      const regulier =
        p.nationalite !== 'hors_ue' || p.ancienneteTitreAnnees >= 5;
      if (!regulier)
        return {
          verdict: 'a_verifier',
          question:
            'vérifier le statut de séjour exact — certaines catégories (réfugié, etc.) ouvrent le RSA sans 5 ans de titre',
        };
      const plafond = rsaPlafond(p);
      if (p.ressourcesMensuelles >= plafond)
        return {
          verdict: 'non_eligible',
          raison: `ressources ${r(p.ressourcesMensuelles)} € ≥ plafond RSA ${r(plafond)} €`,
        };
      // Proche du plafond ou activité salariée : arbitrage RSA / Prime d'activité
      // à confirmer sur mesdroitssociaux.gouv.fr.
      if (p.ressourcesMensuelles >= plafond * 0.85 || p.salaireNet > 0)
        return {
          verdict: 'a_verifier',
          question:
            'ressources proches du plafond / activité salariée — simuler RSA vs Prime d’activité sur mesdroitssociaux.gouv.fr',
        };
      return {
        verdict: 'eligible_probable',
        montant: `complément différentiel jusqu’à ${r(plafond)} €/mois`,
        emet: ['rsa', 'css_sans_participation'],
      };
    },
  },
  {
    id: 'prime_activite',
    nom: 'Prime d’activité',
    organisme: 'CAF',
    niveau: 'national',
    determinant: 'solidarite',
    couvert_par_mds: true,
    description:
      'Complément de revenus du travail. Non-recours massif — à simuler systématiquement. Déclaration trimestrielle.',
    actif: true,
    montant: 'selon foyer et ressources (à simuler)',
    regle: {
      version: '1',
      conditions: [],
      ...SRC('2025-01-01', 'service-public.fr / CAF'),
    },
    evaluer: (p) => {
      if (p.salaireNet <= 0)
        return {
          verdict: 'non_eligible',
          raison: 'aucun revenu d’activité (ni salaire ni chômage partiel)',
        };
      if (p.nationalite === 'hors_ue' && p.ancienneteTitreAnnees < 5)
        return {
          verdict: 'a_verifier',
          question: 'titre de séjour < 5 ans — vérifier l’éligibilité Prime d’activité',
        };
      return {
        verdict: 'eligible_probable',
        montant: 'à simuler (non-recours fréquent)',
      };
    },
  },
  {
    id: 'apl_alf_als',
    nom: 'Aide au logement (APL / ALF / ALS)',
    organisme: 'CAF',
    niveau: 'national',
    determinant: 'logement',
    couvert_par_mds: true,
    description:
      'PORTE D’ENTRÉE : prérequis des aides logement CASVP — toujours activer en premier. Locataire de la résidence principale.',
    actif: true,
    montant: 'selon barème CAF',
    regle: {
      version: '1',
      conditions: [
        { type: 'logement_statut', in: ['locataire_prive', 'locataire_social'] },
      ],
      ...SRC('2025-01-01', 'service-public.fr / CAF'),
    },
  },
  {
    id: 'af',
    nom: 'Allocations familiales',
    organisme: 'CAF',
    niveau: 'national',
    determinant: 'solidarite',
    couvert_par_mds: true,
    description: '≥2 enfants à charge de moins de 20 ans.',
    actif: true,
    montant:
      'selon ressources (2 enf : 37,77–151,05 € ; 3 enf : 86,14–344,56 €/mois)',
    regle: {
      version: '1',
      conditions: [
        { type: 'nb_enfants', min: 2 },
        { type: 'sejour_regulier' },
      ],
      ...SRC('2025-01-01', 'service-public.fr / CAF'),
    },
  },
  {
    id: 'ars',
    nom: 'Allocation de rentrée scolaire (ARS)',
    organisme: 'CAF',
    niveau: 'national',
    determinant: 'solidarite',
    couvert_par_mds: true,
    description: 'Enfants 6-18 ans scolarisés, sous condition de ressources. Saison : rentrée.',
    actif: true,
    montant: '423,48 € (6-10) / 446,85 € (11-14) / 462,33 € (15-18) — par enfant',
    regle: {
      version: '1',
      conditions: [{ type: 'enfant_age', min: 6, max: 18 }],
      ...SRC('2024-08-01', 'service-public.fr / CAF'),
    },
  },
  {
    id: 'asf',
    nom: 'Allocation de soutien familial (ASF)',
    organisme: 'CAF',
    niveau: 'national',
    determinant: 'solidarite',
    couvert_par_mds: true,
    description:
      'Parent isolé : autre parent décédé / non reconnu / pension non payée ou < 199,18 € / non fixée. Engager en parallèle fixation-recouvrement.',
    actif: true,
    montant: '199,18 €/mois par enfant (parent isolé)',
    regle: {
      version: '1',
      conditions: [{ type: 'parent_isole' }],
      ...SRC('2025-04-01', 'service-public.fr / CAF'),
    },
  },
  {
    id: 'paje_base',
    nom: 'Allocation de base (PAJE)',
    organisme: 'CAF',
    niveau: 'national',
    determinant: 'solidarite',
    couvert_par_mds: true,
    description:
      'Enfant de moins de 3 ans, sous condition de ressources. Non-recours fréquent autour de la naissance.',
    actif: true,
    montant: 'selon ressources (≈ 92–184 €/mois)',
    regle: {
      version: '1',
      conditions: [
        { type: 'enfant_age', min: 0, max: 2 },
        { type: 'sejour_regulier' },
      ],
      ...SRC('2025-04-01', 'service-public.fr / CAF'),
    },
  },
  {
    id: 'aah',
    nom: 'AAH (allocation aux adultes handicapés)',
    organisme: 'CAF / MDPH',
    niveau: 'national',
    determinant: 'handicap',
    couvert_par_mds: true,
    description: 'Incapacité ≥80 % ou 50-79 % avec RSDAE (CDAPH).',
    actif: true,
    montant: '1 033,32 €/mois max',
    regle: {
      version: '1',
      conditions: [],
      declencheurs: ['aah', 'css_sans_participation'],
      ...SRC('2025-04-01', 'service-public.fr / CAF'),
    },
    evaluer: (p) => {
      if (p.mdphDroits.has('aah'))
        return {
          verdict: 'eligible_probable',
          emet: ['aah', 'css_sans_participation'],
        };
      return {
        verdict: 'non_eligible',
        raison: 'pas de reconnaissance MDPH ouvrant l’AAH',
      };
    },
  },
  {
    id: 'aspa',
    nom: 'ASPA (minimum vieillesse)',
    organisme: 'CARSAT / CNAV',
    niveau: 'national',
    determinant: 'solidarite',
    couvert_par_mds: true,
    description:
      '≥65 ans (ou ≥62 inapte). Toutes retraites demandées. RÉCUPÉRABLE SUR SUCCESSION — toujours l’expliquer.',
    actif: true,
    regle: {
      version: '1',
      conditions: [],
      declencheurs: ['aspa', 'css_sans_participation'],
      ...SRC('2025-01-01', 'circ. CNAV 2024/39'),
    },
    evaluer: (p) => {
      if (p.ageDemandeur === undefined)
        return {
          verdict: 'a_verifier',
          question: 'préciser l’âge (≥ 65 ans, ou ≥ 62 si inapte)',
        };
      if (p.ageDemandeur < 65)
        return {
          verdict: 'non_eligible',
          raison: `âge ${p.ageDemandeur} ans < 65 ans (ASPA)`,
        };
      const plafond = p.vie === 'couple' ? 1605.73 : 1034.28;
      if (p.ressourcesMensuelles >= plafond)
        return {
          verdict: 'non_eligible',
          raison: `ressources ${r(p.ressourcesMensuelles)} € ≥ plafond ASPA ${plafond} €/mois`,
        };
      return {
        verdict: 'eligible_probable',
        montant: `complément différentiel jusqu’à ${plafond} €/mois — RÉCUPÉRABLE SUR SUCCESSION`,
        emet: ['aspa', 'css_sans_participation'],
      };
    },
  },
  {
    id: 'css',
    nom: 'Complémentaire Santé Solidaire (CSS)',
    organisme: 'CPAM',
    niveau: 'national',
    determinant: 'sante',
    couvert_par_mds: true,
    description:
      'Sans participation pour RSA / ASPA / AAH. Sinon selon ressources (seul : 10 339 € sans / 13 957 € avec).',
    actif: true,
    regle: {
      version: '1',
      conditions: [],
      declencheurs: ['css_sans_participation'],
      ...SRC('2025-04-01', 'service-public.fr / CPAM'),
    },
    evaluer: (p, decl) => {
      if (p.complementaire === 'css_sans' || p.complementaire === 'css_avec')
        return { verdict: 'deja_percu' };
      const trig =
        decl.has('css_sans_participation') ||
        decl.has('rsa') ||
        decl.has('aspa') ||
        decl.has('aah') ||
        decl.has('ass');
      if (trig)
        return {
          verdict: 'eligible_probable',
          montant: 'CSS sans participation (gratuite)',
          emet: ['css_sans_participation'],
        };
      const annuel = p.ressourcesMensuelles * 12;
      const couple = p.vie === 'couple';
      const sans = couple ? 15508 : 10339;
      const avec = couple ? 20936 : 13957;
      if (annuel <= sans)
        return {
          verdict: 'eligible_probable',
          montant: 'CSS sans participation',
          emet: ['css_sans_participation'],
        };
      if (annuel <= avec)
        return {
          verdict: 'eligible_probable',
          montant: 'CSS avec participation (à simuler)',
          emet: [],
        };
      return {
        verdict: 'non_eligible',
        raison: `ressources ${r(annuel)} €/an > plafond CSS ${avec} €`,
      };
    },
  },
  {
    id: 'ame',
    nom: 'Aide Médicale d’État (AME)',
    organisme: 'CPAM',
    niveau: 'national',
    determinant: 'sante',
    couvert_par_mds: false,
    description:
      'Situation irrégulière, résidence France ininterrompue > 3 mois, ressources < plafond CSS.',
    actif: true,
    montant: 'couverture des soins',
    regle: { version: '1', conditions: [], declencheurs: ['ame'], ...SRC('2025-01-01', 'service-public.fr / CPAM') },
    evaluer: (p) => {
      if (p.couverture === 'ame')
        return { verdict: 'deja_percu', emet: ['ame'] };
      if (!p.sejourRegulier)
        return {
          verdict: 'eligible_probable',
          montant: 'couverture des soins (situation irrégulière)',
          emet: ['ame'],
        };
      return {
        verdict: 'non_eligible',
        raison: 'séjour régulier — relève de la PUMA, pas de l’AME',
      };
    },
  },
  {
    id: 'puma',
    nom: 'PUMA — ouverture de droits maladie',
    organisme: 'CPAM',
    niveau: 'national',
    determinant: 'sante',
    couvert_par_mds: false,
    description:
      'Résidence stable et régulière ≥3 mois. Formulaire S1106 (dépôt possible depotdoc.fr).',
    actif: true,
    montant: 'ouverture de droits (formulaire S1106)',
    regle: { version: '1', conditions: [], ...SRC('2025-01-01', 'service-public.fr / CPAM') },
    evaluer: (p) => {
      if (p.couverture === 'puma') return { verdict: 'deja_percu' };
      if (p.couverture === 'ame')
        return {
          verdict: 'non_eligible',
          raison: 'couvert par l’AME — PUMA après régularisation',
        };
      if (!p.sejourRegulier)
        return {
          verdict: 'a_verifier',
          question:
            'PUMA exige une résidence stable ET régulière ≥3 mois — vérifier le séjour (sinon AME)',
        };
      return { verdict: 'eligible_probable' };
    },
  },
  {
    id: 'rattachement_enfants',
    nom: 'Rattachement des enfants à l’Assurance Maladie',
    organisme: 'CPAM',
    niveau: 'national',
    determinant: 'sante',
    couvert_par_mds: false,
    description:
      'Ne jamais supposer que c’est fait. Formulaire S3705. Foyer avec enfants.',
    actif: true,
    montant: 'formulaire S3705',
    regle: {
      version: '1',
      conditions: [{ type: 'avec_enfants' }],
      ...SRC('2025-01-01', 'service-public.fr / CPAM'),
    },
  },
  {
    id: 'cheque_energie',
    nom: 'Chèque énergie',
    organisme: 'État',
    niveau: 'national',
    determinant: 'energie',
    couvert_par_mds: true,
    description:
      'RFR(N-2)/UC < 11 000 €. Versé automatiquement MAIS vérifier l’adresse fiscale (cause fréquente de non-versement).',
    actif: true,
    montant: '48–277 € TTC/an',
    regle: {
      version: '1',
      conditions: [{ type: 'rfr_uc_max', max: 11000 }],
      ...SRC('2024-01-01', 'chequeenergie.gouv.fr'),
    },
  },
  {
    id: 'dls',
    nom: 'Demande de logement social (DLS)',
    organisme: 'État / bailleurs',
    niveau: 'national',
    determinant: 'logement',
    couvert_par_mds: false,
    description:
      'Toujours vérifier le n° INE et l’actualisation ANNUELLE. Sans DLS active, pas de DALO possible.',
    actif: true,
    montant: 'demande / actualisation',
    regle: { version: '1', conditions: [], ...SRC('2025-01-01', 'service-public.fr') },
  },
  {
    id: 'dalo',
    nom: 'Droit au logement opposable (DALO)',
    organisme: 'Préfecture — commission de médiation',
    niveau: 'national',
    determinant: 'logement',
    couvert_par_mds: false,
    description:
      'Recours amiable des personnes mal logées ou sans logement (hébergement précaire, hôtel social, sans domicile, insalubrité, suroccupation, expulsion sans relogement). Exige une demande de logement social active.',
    actif: true,
    montant: 'recours (reconnaissance prioritaire au relogement)',
    regle: { version: '1', conditions: [], ...SRC('2025-01-01', 'service-public.fr / DALO') },
    evaluer: (p) => {
      const precaire =
        p.statutLogement === 'heberge' ||
        p.hebergement === 'hotel_social' ||
        p.hebergement === 'chu_chrs' ||
        p.hebergement === 'sans_domicile';
      if (precaire)
        return {
          verdict: 'a_verifier',
          question:
            'mal-logement / hébergement précaire — engager un recours DALO (vérifier d’abord une demande de logement social active)',
        };
      return {
        verdict: 'non_eligible',
        raison:
          'logement stable — DALO sans objet (sauf insalubrité, suroccupation ou expulsion sans relogement à confirmer)',
      };
    },
  },
  {
    id: 'bourse_college_lycee',
    nom: 'Bourses de collège et de lycée',
    organisme: 'Éducation nationale',
    niveau: 'national',
    determinant: 'vie_sociale',
    couvert_par_mds: false,
    description:
      'Enfants scolarisés, plafonds selon foyer. Saison : 1er sept. – mi-octobre. Non-recours fréquent.',
    actif: true,
    montant: 'selon barème',
    regle: {
      version: '1',
      conditions: [{ type: 'enfant_age', min: 11, max: 18 }],
      ...SRC('2024-09-01', 'education.gouv.fr'),
    },
  },

  // ─── ÎLE-DE-FRANCE MOBILITÉS ─────────────────────────────────────────────
  {
    id: 'solidarite_transport',
    nom: 'Solidarité Transport (réduction Navigo)',
    organisme: 'Île-de-France Mobilités',
    niveau: 'idf',
    determinant: 'transport',
    couvert_par_mds: false,
    description:
      'CSS sans participation OU RSA OU AME OU ASS OU carte d’invalidité. À déclencher dès l’ouverture du RSA (effet d’entraînement).',
    actif: true,
    montant: 'réduction Navigo significative',
    regle: {
      version: '1',
      conditions: [
        {
          type: 'declencheur',
          any: ['css_sans_participation', 'rsa', 'ame', 'ass', 'cmi', 'aah'],
        },
      ],
      ...SRC('2025-01-01', 'iledefrance-mobilites.fr'),
    },
  },
  {
    id: 'imagine_r',
    nom: 'Imagine R (Junior / Scolaire)',
    organisme: 'Île-de-France Mobilités',
    niveau: 'idf',
    determinant: 'transport',
    couvert_par_mds: false,
    description: 'Junior 4-11 ans (24,80 €) / Scolaire 11-17 ans (392,30 €).',
    actif: true,
    montant: 'Junior 24,80 € / Scolaire 392,30 € (an)',
    regle: {
      version: '1',
      conditions: [{ type: 'enfant_age', min: 4, max: 17 }],
      ...SRC('2025-01-01', 'iledefrance-mobilites.fr'),
    },
  },

  // ─── CASVP / VILLE DE PARIS (détection locale — cœur de RADAR) ────────────
  {
    id: 'paris_logement',
    nom: 'Paris Logement',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'logement',
    couvert_par_mds: false,
    description:
      'Seul / couple sans enfant / couple + 1 enfant. Taux d’effort ≥30 %. AL sollicitée. Paris 3 ans/5.',
    actif: true,
    montant: (p) =>
      p.vie === 'couple' && p.nbEnfants === 1
        ? '116 €/mois'
        : p.vie === 'couple'
          ? '95 €/mois'
          : '84 €/mois',
    regle: {
      version: '1',
      conditions: [
        { type: 'composition', in: ['seul', 'couple', 'couple_1enf'] },
        { type: 'taux_effort_min', min: 30 },
        { type: 'paris_3sur5' },
        { type: 'sejour_regulier' },
        { type: 'plafond_ressources_mensuel', max: 1600 },
      ],
      non_cumuls: ['plf', 'plfm'],
      ...SRC('2026-02-01', 'mémo CASVP 01/02/2026'),
    },
  },
  {
    id: 'plf',
    nom: 'Paris Logement Familles',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'logement',
    couvert_par_mds: false,
    description: '≥2 enfants à charge fiscale. AL sollicitée. Paris 3/5.',
    actif: true,
    montant: '116 € (2 enf) à 128 €+41 €/enfant (3 enf+) par mois',
    regle: {
      version: '1',
      conditions: [
        { type: 'nb_enfants', min: 2 },
        { type: 'paris_3sur5' },
        { type: 'sejour_regulier' },
      ],
      non_cumuls: ['plfm', 'paris_logement'],
      ...SRC('2026-02-01', 'mémo CASVP 01/02/2026'),
    },
  },
  {
    id: 'plfm',
    nom: 'Paris Logement Familles Monoparentales',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'logement',
    couvert_par_mds: false,
    description: 'Parent isolé ≥1 enfant à charge fiscale. AL sollicitée. Paris 3/5.',
    actif: true,
    montant: (p) => (p.ressourcesMensuelles <= 1450 ? '150 €/mois' : '128 €/mois'),
    regle: {
      version: '1',
      conditions: [
        { type: 'parent_isole' },
        { type: 'paris_3sur5' },
        { type: 'sejour_regulier' },
        { type: 'plafond_ressources_mensuel', max: 1600 },
      ],
      non_cumuls: ['paris_logement'],
      ...SRC('2026-02-01', 'mémo CASVP 01/02/2026'),
    },
  },
  {
    id: 'paris_solidarite',
    nom: 'Paris Solidarité',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'solidarite',
    couvert_par_mds: false,
    description:
      'Personne isolée ou couple en grande précarité (sans enfant à charge). Paris 3/5. RÉCUPÉRABLE SUR SUCCESSION.',
    actif: true,
    montant: 'complément jusqu’au minimum vieillesse — RÉCUPÉRABLE SUR SUCCESSION',
    regle: {
      version: '1',
      conditions: [
        { type: 'composition', in: ['seul', 'couple'] },
        { type: 'paris_3sur5' },
        { type: 'sejour_regulier' },
        { type: 'plafond_ressources_mensuel', max: 1152 },
      ],
      non_cumuls: ['alloc_parents_enfant_handicape'],
      ...SRC('2025-02-01', 'CASVP 01/02/2025 — plafond couple : 1 821 € (à paramétrer)'),
    },
  },
  {
    id: 'complement_sante_paris',
    nom: 'Complément Santé Paris',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'sante',
    couvert_par_mds: false,
    description: 'Participation mutuelle 468 €/an. CSS prime si éligible (non-cumul).',
    actif: true,
    montant: '468 €/an',
    regle: {
      version: '1',
      conditions: [
        { type: 'paris_3sur5' },
        { type: 'sejour_regulier' },
        { type: 'plafond_ressources_mensuel', max: 1152 },
      ],
      non_cumuls: ['css'],
      ...SRC('2025-02-01', 'CASVP 01/02/2025'),
    },
  },
  {
    id: 'paris_forfait_familles',
    nom: 'Paris Forfait Familles',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'solidarite',
    couvert_par_mds: false,
    description: '≥3 enfants à charge fiscale. Paris 3/5. Revenus ≤5 000 €/mois.',
    actif: true,
    montant: '305 €/an (≤3000 €/mois) / 200 €/an (3000–5000 €/mois)',
    regle: {
      version: '1',
      conditions: [
        { type: 'nb_enfants', min: 3 },
        { type: 'paris_3sur5' },
        { type: 'sejour_regulier' },
        { type: 'plafond_ressources_mensuel', max: 5000 },
      ],
      ...SRC('2026-02-01', 'mémo CASVP 01/02/2026'),
    },
  },
  {
    id: 'pef',
    nom: 'Paris Énergie Familles',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'energie',
    couvert_par_mds: false,
    description:
      'Enfant(s) à charge fiscale, facture élec/gaz au nom du demandeur. Paris 3/5.',
    actif: true,
    montant: (p) => (p.nbEnfants >= 3 ? '275 €/an' : '138 €/an'),
    regle: {
      version: '1',
      conditions: [
        { type: 'avec_enfants' },
        { type: 'paris_3sur5' },
        { type: 'sejour_regulier' },
        { type: 'facture_energie_au_nom' },
        { type: 'plafond_ressources_mensuel', max: 5000 },
      ],
      ...SRC('2026-02-01', 'mémo CASVP — plafond fin : 2 500 € (2 enf) à paramétrer'),
    },
  },
  {
    id: 'fsl_energie_prev',
    nom: 'FSL Énergie Préventive',
    organisme: 'Ville de Paris',
    niveau: 'paris',
    determinant: 'energie',
    couvert_par_mds: false,
    description:
      'Titre d’occupation régulier, contrat énergie au nom du demandeur. 12 mois entre 2 demandes.',
    actif: true,
    montant: (p) =>
      (p.ageDemandeur && p.ageDemandeur > 65) ||
      p.mdphDroits.size > 0 ||
      p.enfants.some((e) => e.age < 3)
        ? '244 €/an'
        : '122 €/an',
    regle: {
      version: '1',
      conditions: [
        { type: 'facture_energie_au_nom' },
        { type: 'sejour_regulier' },
        { type: 'plafond_ressources_mensuel', max: 1400 },
      ],
      non_cumuls: ['pef'],
      ...SRC('2025-01-01', 'paris.fr — coefficient ressources à paramétrer (≤7 800 €/an isolé)'),
    },
  },
  {
    id: 'fsl_energie_cur',
    nom: 'FSL Énergie Curative',
    organisme: 'Ville de Paris',
    niveau: 'paris',
    determinant: 'energie',
    couvert_par_mds: false,
    description: 'Impayés élec/gaz sans solution amiable. À DÉCLENCHER EN URGENCE si risque de coupure.',
    actif: true,
    montant: '≤500 €, validité 1 an',
    regle: { version: '1', conditions: [], ...SRC('2025-01-01', 'paris.fr') },
    evaluer: () => ({
      verdict: 'a_verifier',
      question:
        'impayés d’énergie sans solution amiable ? Si oui, activer EN URGENCE (risque de coupure)',
    }),
  },
  {
    id: 'pass_paris_senior',
    nom: 'Pass Paris Senior (Navigo gratuit)',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'transport',
    couvert_par_mds: false,
    description: 'Senior, ligne d’imposition ≤2 028 € (1re demande). Navigo gratuit.',
    actif: true,
    montant: 'Navigo gratuit + équipements municipaux',
    regle: {
      version: '1',
      conditions: [
        { type: 'age_demandeur', min: 65 },
        { type: 'paris_3sur5' },
        { type: 'impot_ligne_max', max: 2028 },
      ],
      ...SRC('2025-02-01', 'CASVP 01/02/2025'),
    },
  },
  {
    id: 'restaurants_emeraude',
    nom: 'Restaurants Émeraude',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'vie_sociale',
    couvert_par_mds: false,
    description: 'Personnes âgées. Participation selon tranche d’imposition (3,43–14,53 €).',
    actif: true,
    montant: 'déjeuner 3,43–14,53 €',
    regle: {
      version: '1',
      conditions: [{ type: 'age_demandeur', min: 65 }, { type: 'paris_3sur5' }],
      ...SRC('2025-01-01', 'CASVP'),
    },
  },
  {
    id: 'apa',
    nom: 'Allocation personnalisée d’autonomie (APA)',
    organisme: 'Département de Paris',
    niveau: 'paris',
    determinant: 'solidarite',
    couvert_par_mds: false,
    description:
      'Personnes de 60 ans et plus en perte d’autonomie (groupes GIR 1 à 4). À domicile (plan d’aide) ou en établissement.',
    actif: true,
    montant: 'selon le plan d’aide et le degré de perte d’autonomie',
    regle: { version: '1', conditions: [], ...SRC('2025-01-01', 'service-public.fr / paris.fr') },
    evaluer: (p) => {
      if (p.ageDemandeur === undefined)
        return {
          verdict: 'a_verifier',
          question: 'préciser l’âge — l’APA est ouverte dès 60 ans en cas de perte d’autonomie',
        };
      if (p.ageDemandeur < 60)
        return { verdict: 'non_eligible', raison: `âge ${p.ageDemandeur} ans < 60 ans (APA)` };
      return {
        verdict: 'a_verifier',
        question:
          'perte d’autonomie (difficultés pour les actes du quotidien) ? Évaluer via la grille AGGIR — APA à domicile possible',
      };
    },
  },
  {
    id: 'pedicure_domicile',
    nom: 'Pédicure à domicile (Ville de Paris)',
    organisme: 'CASVP',
    niveau: 'paris',
    determinant: 'sante',
    couvert_par_mds: false,
    description:
      'Senior parisien à mobilité réduite : soins de pédicurie réalisés à domicile. Participation selon les ressources.',
    actif: true,
    montant: 'soins à domicile (participation selon ressources)',
    regle: {
      version: '1',
      conditions: [{ type: 'age_demandeur', min: 65 }, { type: 'paris_3sur5' }],
      ...SRC('2025-01-01', 'paris.fr / CASVP'),
    },
  },
  {
    id: 'fsl_equipement',
    nom: 'Aide à l’équipement du logement (FSL)',
    organisme: 'Ville de Paris — Fonds de solidarité pour le logement',
    niveau: 'paris',
    determinant: 'logement',
    couvert_par_mds: false,
    description:
      'Entrée ou relogement récent : aide à l’équipement de première nécessité du logement (Fonds de solidarité pour le logement).',
    actif: true,
    montant: 'aide à l’équipement (selon barème FSL)',
    regle: { version: '1', conditions: [], ...SRC('2025-01-01', 'paris.fr') },
    evaluer: () => ({
      verdict: 'a_verifier',
      question:
        'relogement ou entrée récente dans un logement ? Une aide FSL à l’équipement peut être demandée',
    }),
  },
  {
    id: 'ticket_loisirs',
    nom: 'Ticket Loisirs CAF',
    organisme: 'CAF de Paris',
    niveau: 'paris',
    determinant: 'vie_sociale',
    couvert_par_mds: false,
    description: 'Allocataire, QF < 700 €, enfants 11-15 ans.',
    actif: true,
    montant: '60–170 €',
    regle: {
      version: '1',
      conditions: [
        { type: 'enfant_age', min: 11, max: 15 },
        { type: 'qf_max', max: 700 },
      ],
      ...SRC('2025-01-01', 'CAF de Paris'),
    },
  },
  {
    id: 'vacaf_avf',
    nom: 'VACAF — Aide aux Vacances Familles',
    organisme: 'CAF de Paris',
    niveau: 'paris',
    determinant: 'vie_sociale',
    couvert_par_mds: false,
    description: 'Allocataire CAF Paris, QF ≤700 €.',
    actif: true,
    montant: 'séjour en structure labellisée',
    regle: {
      version: '1',
      conditions: [{ type: 'avec_enfants' }, { type: 'qf_max', max: 700 }],
      ...SRC('2025-01-01', 'CAF de Paris'),
    },
  },
];

export const DISPOSITIFS_PAR_ID = new Map(DISPOSITIFS.map((d) => [d.id, d]));
