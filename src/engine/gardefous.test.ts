// Tests des garde-fous éthiques (§10) et des verrous J+2 de la concertation
// Argus × Studio Cybernétique (11/06/2026). Ces tests protègent l'identité du
// produit : si l'un d'eux casse, c'est qu'une évolution a érodé un garde-fou.

import { describe, it, expect } from 'vitest';
import { etatInitialWizard } from '@/wizard/store';
import { syntheseNonRecours, estMontantPlafond, parseMontantAnnuel } from '@/lib/nudges';
import type { ResultatDetection } from '@/engine/model';

describe('Garde-fous éthiques (§10 + concertation 11/06/2026)', () => {
  it('rien n’est pré-coché : consentements à false par défaut', () => {
    const w = etatInitialWizard();
    expect(w.consentement.accompagnement).toBe(false);
    expect(w.consentement.mesure_impact).toBe(false);
  });

  it('verrou n°1 : éphémère PAR DÉFAUT — pas de persistance avant consentement', () => {
    const w = etatInitialWizard();
    expect(w.ephemere).toBe(true);
  });

  it('verrou n°2 : le plan d’action démarre vide, rien n’est engagé d’office', () => {
    const w = etatInitialWizard();
    expect(w.plan).toEqual([]);
  });

  it('verrou n°5 : un montant « jusqu’à / différentiel » est reconnu comme plafond', () => {
    expect(estMontantPlafond('complément différentiel jusqu’à 646 €/mois')).toBe(true);
    expect(estMontantPlafond('jusqu’à 350 €/an')).toBe(true);
    expect(estMontantPlafond('150 €/mois')).toBe(false);
    expect(estMontantPlafond(undefined)).toBe(false);
  });

  it('verrou n°5 : la synthèse marque le total comme MAXIMUM si un plafond y entre', () => {
    const res: ResultatDetection[] = [
      { dispositif_id: 'a', nom: 'A', organisme: 'X', verdict: 'eligible_probable', montant_estime: 'complément différentiel jusqu’à 600 €/mois' },
      { dispositif_id: 'b', nom: 'B', organisme: 'X', verdict: 'eligible_probable', montant_estime: '100 €/mois' },
    ] as ResultatDetection[];
    const s = syntheseNonRecours(res);
    expect(s.estMaximum).toBe(true);
    expect(s.totalAnnuel).toBe(600 * 12 + 100 * 12);
  });

  it('verrou n°5 : sans plafond, le total n’est pas marqué maximum', () => {
    const res: ResultatDetection[] = [
      { dispositif_id: 'b', nom: 'B', organisme: 'X', verdict: 'eligible_probable', montant_estime: '100 €/mois' },
    ] as ResultatDetection[];
    expect(syntheseNonRecours(res).estMaximum).toBe(false);
  });

  it('parseMontantAnnuel : mensuel ×12, annuel tel quel, unité inconnue non chiffrée', () => {
    expect(parseMontantAnnuel('150 €/mois')).toBe(1800);
    expect(parseMontantAnnuel('138 €/an')).toBe(138);
    expect(parseMontantAnnuel('CSS sans participation')).toBeNull();
  });
});
