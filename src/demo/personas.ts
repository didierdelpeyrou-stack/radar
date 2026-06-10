// Personas de démonstration (= critères d'acceptation §9). Sert l'écran de
// démonstration du moteur. Les tests automatisés vivent dans engine/personas.test.ts.

import type { Diagnostic } from '@/domain/types';

const base = (over: Partial<Diagnostic>): Diagnostic => ({
  bloc1: { vie: 'seul', matrimonial: 'celibataire', enfants: [] },
  bloc2: { nationalite: 'fr', en_france_depuis: '2000-01-01', a_paris_depuis: '2000-01-01', paris_3ans_sur_5: true },
  bloc3: { statut: 'inactif' },
  bloc4: { statut: 'locataire_prive', suroccupation: false, insalubrite: false, expulsion_en_cours: false, dette_locative: false, loyer: 0, charges: 0 },
  bloc5: { salaire_net: 0, percues: [], cheque_energie_recu: false },
  bloc6: { avis_dispo: false, rfr: 0, parts: 1, verifs: { enfants_presents_scolarises: true, regime_matrimonial_ok: true, demi_part_parent_isole_ok: true }, anomalie_orientation_sip: false },
  bloc7: { couverture: 'puma', complementaire: 'aucune', ald: false, aidant: false },
  ...over,
});

export const PERSONAS: { nom: string; age: number; diagnostic: Diagnostic }[] = [
  {
    nom: 'P1 · Mère isolée, 2 enfants',
    age: 38,
    diagnostic: base({
      bloc1: {
        vie: 'seul', matrimonial: 'divorce',
        enfants: [
          { age: 7, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false },
          { age: 12, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false },
        ],
      },
      bloc3: { statut: 'salarie', contrat: 'cdi', temps: 'partiel', quotite_pct: 50 },
      bloc4: { statut: 'locataire_prive', suroccupation: false, insalubrite: false, expulsion_en_cours: false, dette_locative: false, loyer: 950, charges: 80 },
      bloc5: { salaire_net: 1100, percues: [], cheque_energie_recu: false },
    }),
  },
  {
    nom: 'P2 · Homme seul, 72 ans, retraite 900 €',
    age: 72,
    diagnostic: base({
      bloc1: { vie: 'seul', matrimonial: 'veuf', enfants: [] },
      bloc3: { statut: 'retraite' },
      bloc4: { statut: 'locataire_social', suroccupation: false, insalubrite: false, expulsion_en_cours: false, dette_locative: false, loyer: 400, charges: 60 },
      bloc5: { salaire_net: 0, retraites_total: 900, percues: [], cheque_energie_recu: false },
      bloc6: { avis_dispo: true, rfr: 9000, parts: 1, verifs: { enfants_presents_scolarises: true, regime_matrimonial_ok: true, demi_part_parent_isole_ok: true }, anomalie_orientation_sip: false },
    }),
  },
  {
    nom: 'P3 · Couple primo-arrivant, 3 enfants, hôtel social',
    age: 35,
    diagnostic: base({
      bloc1: {
        vie: 'couple', matrimonial: 'marie',
        enfants: [
          { age: 4, scolarise_france: false, garde_alternee: false, reste_au_pays: false, handicap: false },
          { age: 9, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false },
          { age: 15, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false },
        ],
      },
      bloc2: { nationalite: 'hors_ue', titre: { type: 'Vie privée et familiale', expiration: '2027-04-01' }, en_france_depuis: '2025-04-01', a_paris_depuis: '2025-04-01', paris_3ans_sur_5: false, anciennete_titre_annees: 0.2 },
      bloc4: { statut: 'heberge', hebergement: 'hotel_social', suroccupation: true, insalubrite: false, expulsion_en_cours: false, dette_locative: false, loyer: 0, charges: 0 },
      bloc7: { couverture: 'aucune', complementaire: 'aucune', ald: false, aidant: false },
    }),
  },
];
