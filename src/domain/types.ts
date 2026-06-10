// ─────────────────────────────────────────────────────────────────────────
// RADAR — Schéma de données du diagnostic (Annexe C) + types du moteur.
// Aucune décision n'est prise ici : ces types décrivent la saisie de
// l'accompagnant. Le verdict est produit par le moteur déterministe (engine).
// ─────────────────────────────────────────────────────────────────────────

export type Nationalite = 'fr' | 'ue' | 'hors_ue';
export type StatutSejour =
  | 'refugie'
  | 'protection_subsidiaire'
  | 'apatride'
  | 'procedure_en_cours'
  | 'sans_titre';

export interface Enfant {
  age: number;
  scolarise_france: boolean;
  garde_alternee: boolean;
  reste_au_pays: boolean;
  handicap: boolean;
}

export interface Bloc1Foyer {
  vie: 'seul' | 'couple';
  matrimonial:
    | 'celibataire'
    | 'marie'
    | 'pacse'
    | 'concubin'
    | 'separe'
    | 'divorce'
    | 'veuf';
  enfants: Enfant[];
  precisions?: string;
}

export interface Bloc2Admin {
  nationalite: Nationalite;
  titre?: { type: string; expiration: string }; // ISO date ; alerte si < +4 mois
  statut?: StatutSejour;
  en_france_depuis: string; // ISO date
  a_paris_depuis: string; // ISO date
  paris_3ans_sur_5: boolean;
  anciennete_titre_annees?: number; // pour le test « titre ≥ 5 ans » (RSA)
}

export interface Bloc3Pro {
  statut: 'inactif' | 'salarie' | 'independant' | 'chomage' | 'invalidite' | 'retraite';
  contrat?: 'cdd' | 'cdi' | 'alternance' | 'interim';
  temps?: 'plein' | 'partiel';
  quotite_pct?: number;
  chomage?: { indemnise: boolean; type?: 'are' | 'ass'; suivi_ft: boolean };
}

export interface Bloc4Logement {
  statut: 'locataire_prive' | 'locataire_social' | 'proprietaire' | 'heberge';
  hebergement?: 'hotel_social' | 'chu_chrs' | 'tiers' | 'sans_domicile';
  suroccupation: boolean;
  insalubrite: boolean;
  expulsion_en_cours: boolean;
  dette_locative: boolean;
  loyer: number; // €/mois hors charges
  charges: number; // €/mois
  dls?: { existe: boolean; ine?: string; actualisee: boolean };
}

export interface Bloc5Ressources {
  salaire_net: number; // €/mois (foyer)
  percues: string[]; // ids du catalogue déjà perçus
  retraites_total?: number; // €/mois
  pensions_total?: number; // €/mois (invalidité, réversion, alimentaire reçue…)
  cheque_energie_recu: boolean;
  autres?: string;
}

export interface Bloc6Impots {
  avis_dispo: boolean;
  rfr: number; // revenu fiscal de référence (annuel)
  parts: number;
  qf_calcule?: number; // calculé par l'app
  verifs: {
    enfants_presents_scolarises: boolean;
    regime_matrimonial_ok: boolean;
    demi_part_parent_isole_ok: boolean;
  };
  anomalie_orientation_sip: boolean;
}

export interface Bloc7Sante {
  couverture: 'puma' | 'ame' | 'aucune';
  complementaire: 'css_sans' | 'css_avec' | 'mutuelle' | 'csp' | 'aucune';
  ald: boolean;
  mdph?: { statut: 'en_cours' | 'obtenue'; droits: ('aah' | 'aeeh' | 'pch' | 'cmi' | 'rqth')[] };
  aidant: boolean;
}

export interface Diagnostic {
  bloc1: Bloc1Foyer;
  bloc2: Bloc2Admin;
  bloc3: Bloc3Pro;
  bloc4: Bloc4Logement;
  bloc5: Bloc5Ressources;
  bloc6: Bloc6Impots;
  bloc7: Bloc7Sante;
}

// ─── Référence : date du jour passée au moteur pour les calculs d'âge/anciennté.
//     Injectée explicitement (jamais Date.now() implicite) pour des tests stables.
export type AsOf = string; // ISO date
