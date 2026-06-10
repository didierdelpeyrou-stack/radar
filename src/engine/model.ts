// ─────────────────────────────────────────────────────────────────────────
// Moteur d'éligibilité — modèle. Déterministe et explicable (§3 du protocole).
// AUCUNE IA ne décide ici. Chaque verdict est la trace d'une règle versionnée.
// ─────────────────────────────────────────────────────────────────────────

import type { Diagnostic, Enfant } from '@/domain/types';

export type Verdict =
  | 'eligible_probable'
  | 'a_verifier'
  | 'non_eligible'
  | 'deja_percu';

export type Determinant =
  | 'sante'
  | 'logement'
  | 'energie'
  | 'solidarite'
  | 'vie_sociale'
  | 'transport'
  | 'handicap';

export type Niveau = 'national' | 'paris' | 'idf';

/** Profil normalisé dérivé des 7 blocs : la seule entrée des règles. */
export interface Profil {
  asOf: string; // date de référence ISO
  // foyer
  vie: 'seul' | 'couple';
  parentIsole: boolean;
  nbEnfants: number; // enfants à charge présents (hors restés au pays)
  enfants: Enfant[];
  ageDemandeur?: number;
  // administratif
  nationalite: Diagnostic['bloc2']['nationalite'];
  sejourRegulier: boolean;
  ancienneteTitreAnnees: number;
  paris3sur5: boolean;
  // logement
  statutLogement: Diagnostic['bloc4']['statut'];
  hebergement?: Diagnostic['bloc4']['hebergement'];
  tauxEffort: number; // %
  factureEnergieAuNom: boolean | undefined; // inconnu → a_verifier
  // ressources
  ressourcesMensuelles: number; // total foyer net €/mois
  salaireNet: number; // €/mois (pour Prime d'activité)
  percues: Set<string>;
  chequeEnergieRecu: boolean;
  // santé
  couverture: Diagnostic['bloc7']['couverture'];
  // impôts
  qf: number;
  rfrParUC: number;
  imposLigne?: number; // pour Pass Paris Senior / Restaurants Émeraude (inconnu si undefined)
  // santé
  complementaire: Diagnostic['bloc7']['complementaire'];
  mdphDroits: Set<string>;
}

/** Statuts qui « déclenchent » d'autres droits (effets d'entraînement). */
export type Declencheur =
  | 'rsa'
  | 'css_sans_participation'
  | 'aah'
  | 'aeeh'
  | 'ame'
  | 'ass'
  | 'aspa'
  | 'cmi';

export type CondStatus = 'pass' | 'fail' | 'unknown';

export interface CondResult {
  status: CondStatus;
  raison?: string; // si fail
  question?: string; // si unknown
}

/** Conditions structurées (sérialisables → table `regles` en JSON). */
export type Condition =
  | { type: 'paris_3sur5' }
  | { type: 'sejour_regulier' }
  | { type: 'composition'; in: Array<'seul' | 'couple' | 'couple_1enf'> }
  | { type: 'parent_isole' }
  | { type: 'avec_enfants' }
  | { type: 'nb_enfants'; min?: number; max?: number }
  | { type: 'enfant_age'; min?: number; max?: number } // au moins un enfant dans la tranche
  | { type: 'age_demandeur'; min?: number; max?: number }
  | { type: 'plafond_ressources_mensuel'; max: number }
  | { type: 'taux_effort_min'; min: number }
  | { type: 'qf_max'; max: number }
  | { type: 'rfr_uc_max'; max: number }
  | { type: 'impot_ligne_max'; max: number } // inconnu → a_verifier
  | { type: 'declencheur'; any: Declencheur[] }
  | { type: 'facture_energie_au_nom' }
  | { type: 'logement_statut'; in: Array<Profil['statutLogement']> };

export interface Regle {
  version: string;
  conditions: Condition[];
  non_cumuls?: string[]; // ids prioritaires : si l'un est retenu, ce dispositif tombe
  declencheurs?: Declencheur[]; // statuts émis si ce dispositif est retenu
  date_source: string; // ISO
  source: string;
  a_verifier_avant_prod: boolean;
}

export interface Dispositif {
  id: string;
  nom: string;
  organisme: string;
  niveau: Niveau;
  determinant: Determinant;
  couvert_par_mds: boolean;
  description: string;
  /** Montant lisible (string fixe) OU résolveur déterministe selon le profil. */
  montant?: string | ((p: Profil) => string);
  /** Émet ces déclencheurs même hors règle calculée (ex. déjà perçu). */
  emet?: Declencheur[];
  regle?: Regle; // absente = dispositif en mode checklist (préfecture, etc.)
  /**
   * Évaluateur déterministe spécifique, quand un simple ET de conditions ne
   * suffit pas (ex. CSS sans/avec participation, ASPA différentielle, RSA dont
   * la régularité dépend du statut exact). Reçoit le profil + l'ensemble des
   * déclencheurs actifs. Prioritaire sur `regle.conditions`.
   */
  evaluer?: (
    p: Profil,
    declencheurs: Set<Declencheur>,
  ) => {
    verdict: Verdict;
    raison?: string;
    question?: string;
    montant?: string;
    emet?: Declencheur[];
  };
  actif: boolean;
}

export interface ResultatDetection {
  dispositif_id: string;
  nom: string;
  organisme: string;
  determinant: Determinant;
  verdict: Verdict;
  raison?: string;
  question?: string;
  montant_estime?: string;
  couvert_par_mds: boolean;
}
