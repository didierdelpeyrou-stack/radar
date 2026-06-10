// ─────────────────────────────────────────────────────────────────────────
// Critères d'acceptation §9 — les 4 personas. Tout changement de règle relance
// cette suite (protocole §3.4). Les verdicts asservis sont ceux qui sont
// déterministes et non ambigus ; les notes « à la saison / à simuler » du
// protocole sont des libellés, pas des verdicts.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import type { Diagnostic } from '@/domain/types';
import { construireProfil, type ContexteEval } from './profil';
import { detecter } from './engine';
import { DISPOSITIFS } from '@/domain/catalogue';
import type { ResultatDetection, Verdict } from './model';

const ASOF = '2026-06-10';

function run(d: Diagnostic, ctx: Partial<ContexteEval> = {}) {
  const profil = construireProfil(d, { asOf: ASOF, ...ctx });
  const res = detecter(DISPOSITIFS, profil);
  const byId = new Map(res.map((x) => [x.dispositif_id, x]));
  return {
    res,
    verdict: (id: string): Verdict | undefined => byId.get(id)?.verdict,
    item: (id: string): ResultatDetection | undefined => byId.get(id),
  };
}

// Squelette de diagnostic neutre, surchargé par persona.
function diag(over: Partial<Diagnostic>): Diagnostic {
  return {
    bloc1: { vie: 'seul', matrimonial: 'celibataire', enfants: [] },
    bloc2: {
      nationalite: 'fr',
      en_france_depuis: '2000-01-01',
      a_paris_depuis: '2000-01-01',
      paris_3ans_sur_5: true,
    },
    bloc3: { statut: 'inactif' },
    bloc4: {
      statut: 'locataire_prive',
      suroccupation: false,
      insalubrite: false,
      expulsion_en_cours: false,
      dette_locative: false,
      loyer: 0,
      charges: 0,
    },
    bloc5: { salaire_net: 0, percues: [], cheque_energie_recu: false },
    bloc6: {
      avis_dispo: false,
      rfr: 0,
      parts: 1,
      verifs: {
        enfants_presents_scolarises: true,
        regime_matrimonial_ok: true,
        demi_part_parent_isole_ok: true,
      },
      anomalie_orientation_sip: false,
    },
    bloc7: { couverture: 'puma', complementaire: 'aucune', ald: false, aidant: false },
    ...over,
  };
}

describe('P1 — mère isolée, 2 enfants (7 et 12), française, Paris 6 ans, temps partiel 1 100 €', () => {
  const { verdict, item } = run(
    diag({
      bloc1: {
        vie: 'seul',
        matrimonial: 'divorce',
        enfants: [
          { age: 7, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false },
          { age: 12, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false },
        ],
      },
      bloc3: { statut: 'salarie', contrat: 'cdi', temps: 'partiel', quotite_pct: 50 },
      bloc4: {
        statut: 'locataire_prive',
        suroccupation: false, insalubrite: false, expulsion_en_cours: false, dette_locative: false,
        loyer: 950, charges: 80,
      },
      bloc5: { salaire_net: 1100, percues: [], cheque_energie_recu: false },
    }),
    { ageDemandeur: 38 },
  );

  it('APL/ALF éligible (porte d’entrée)', () => expect(verdict('apl_alf_als')).toBe('eligible_probable'));
  it('Prime d’activité éligible', () => expect(verdict('prime_activite')).toBe('eligible_probable'));
  it('ASF éligible (pension non payée)', () => expect(verdict('asf')).toBe('eligible_probable'));
  it('PLFM éligible à 150 €/mois', () => {
    expect(verdict('plfm')).toBe('eligible_probable');
    expect(item('plfm')?.montant_estime).toContain('150');
  });
  it('Paris Énergie Familles éligible à 138 €/an', () => {
    expect(verdict('pef')).toBe('eligible_probable');
    expect(item('pef')?.montant_estime).toContain('138');
  });
  it('Paris Logement NON éligible (composition / non-cumul)', () => expect(verdict('paris_logement')).toBe('non_eligible'));
  it('Paris Forfait Familles NON éligible (< 3 enfants)', () => expect(verdict('paris_forfait_familles')).toBe('non_eligible'));
  it('Solidarité Transport NON éligible (aucun déclencheur)', () => expect(verdict('solidarite_transport')).toBe('non_eligible'));
  it('Paris Solidarité NON éligible (foyer avec enfants)', () => expect(verdict('paris_solidarite')).toBe('non_eligible'));
});

describe('P2 — homme seul, 72 ans, retraite 900 €, HLM, Paris 20 ans, français', () => {
  const { verdict, item } = run(
    diag({
      bloc1: { vie: 'seul', matrimonial: 'veuf', enfants: [] },
      bloc3: { statut: 'retraite' },
      bloc4: {
        statut: 'locataire_social',
        suroccupation: false, insalubrite: false, expulsion_en_cours: false, dette_locative: false,
        loyer: 400, charges: 60,
      },
      bloc5: { salaire_net: 0, retraites_total: 900, percues: [], cheque_energie_recu: false },
      bloc6: {
        avis_dispo: true, rfr: 9000, parts: 1,
        verifs: { enfants_presents_scolarises: true, regime_matrimonial_ok: true, demi_part_parent_isole_ok: true },
        anomalie_orientation_sip: false,
      },
    }),
    { ageDemandeur: 72 },
  );

  it('ASPA éligible (différentiel, récupérable sur succession)', () => {
    expect(verdict('aspa')).toBe('eligible_probable');
    expect(item('aspa')?.montant_estime).toContain('SUCCESSION');
  });
  it('CSS éligible sans participation (effet d’entraînement ASPA)', () => {
    expect(verdict('css')).toBe('eligible_probable');
    expect(item('css')?.montant_estime?.toLowerCase()).toContain('sans participation');
  });
  it('Solidarité Transport éligible (via CSS sans participation)', () => expect(verdict('solidarite_transport')).toBe('eligible_probable'));
  it('Paris Solidarité éligible (≤ 1 152 €)', () => expect(verdict('paris_solidarite')).toBe('eligible_probable'));
  it('FSL Énergie Préventive éligible à 244 € (> 65 ans)', () => {
    expect(verdict('fsl_energie_prev')).toBe('eligible_probable');
    expect(item('fsl_energie_prev')?.montant_estime).toContain('244');
  });
  it('PEF NON éligible (pas d’enfant)', () => expect(verdict('pef')).toBe('non_eligible'));
  it('Complément Santé Paris NON éligible (non-cumul CSS)', () => {
    expect(verdict('complement_sante_paris')).toBe('non_eligible');
    expect(item('complement_sante_paris')?.raison).toContain('non-cumulable');
  });
});

describe('P3 — couple primo-arrivant régularisé (titre VPF 1 an), 3 enfants, hôtel social, Paris 14 mois', () => {
  const { verdict, item } = run(
    diag({
      bloc1: {
        vie: 'couple',
        matrimonial: 'marie',
        enfants: [
          { age: 4, scolarise_france: false, garde_alternee: false, reste_au_pays: false, handicap: false },
          { age: 9, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false },
          { age: 15, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false },
        ],
      },
      bloc2: {
        nationalite: 'hors_ue',
        titre: { type: 'Vie privée et familiale', expiration: '2027-04-01' },
        en_france_depuis: '2025-04-01',
        a_paris_depuis: '2025-04-01',
        paris_3ans_sur_5: false,
        anciennete_titre_annees: 0.2,
      },
      bloc4: {
        statut: 'heberge', hebergement: 'hotel_social',
        suroccupation: true, insalubrite: false, expulsion_en_cours: false, dette_locative: false,
        loyer: 0, charges: 0,
      },
      bloc7: { couverture: 'aucune', complementaire: 'aucune', ald: false, aidant: false },
    }),
    { ageDemandeur: 35 },
  );

  it('PUMA éligible (couverture à ouvrir)', () => expect(verdict('puma')).toBe('eligible_probable'));
  it('Allocations familiales éligibles (3 enfants)', () => expect(verdict('af')).toBe('eligible_probable'));
  it('RSA à vérifier (titre < 5 ans — le moteur pose la question)', () => {
    expect(verdict('rsa')).toBe('a_verifier');
    expect(item('rsa')?.question).toBeTruthy();
  });
  for (const id of ['paris_logement', 'plf', 'plfm', 'pef', 'paris_solidarite', 'paris_forfait_familles', 'complement_sante_paris']) {
    it(`${id} NON éligible (ancienneté Paris < 3 ans sur 5)`, () => expect(verdict(id)).toBe('non_eligible'));
  }
  it('Au moins une aide CASVP refusée explicite l’ancienneté Paris', () => {
    const raisons = ['paris_logement', 'plf', 'pef', 'paris_forfait_familles']
      .map((id) => item(id)?.raison ?? '')
      .join(' | ');
    expect(raisons).toMatch(/Paris/i);
  });
});
