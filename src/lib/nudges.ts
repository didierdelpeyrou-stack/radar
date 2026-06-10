// Nudges éthiques contre le non-recours (paternalisme libéral — Thaler/Sunstein),
// strictement dans le cadre des garde-fous §10 :
//  • RENDRE VISIBLE L'INVISIBLE : chiffrer le montant annuel potentiellement non
//    perçu (le levier #1 du non-recours : on ne réclame pas ce qu'on ne voit pas).
//  • SALIENCE & DÉFAUTS : trier par impact, déplier les 3 premières démarches.
//  • RÉDUCTION DE FRICTION : pièces justificatives pré-listées, RDV pré-rempli.
//  • NORME FACTUELLE : repère Odenore (sans jamais culpabiliser).
//  • JAMAIS de case pré-cochée, jamais de scoring de la personne, jamais de
//    décision automatique opposable : la personne décide.

import type { ResultatDetection } from '@/engine/model';

/** Détecte un montant « différentiel » ou « jusqu'à » : c'est un PLAFOND, pas un
 *  montant acquis (RSA, ASPA, ASF…). Le total qui l'inclut est donc un MAXIMUM.
 *  Verrou J+2 n°5 (concertation 11/06/2026) : ne jamais présenter un plafond
 *  différentiel ×12 comme un gain certain à un public en précarité. */
export function estMontantPlafond(montant?: string): boolean {
  if (!montant) return false;
  return /jusqu|différentiel|plafond/i.test(montant);
}

/** Extrait un montant ANNUEL en euros à partir d'un libellé (« 150 €/mois », « 138 €/an »). */
export function parseMontantAnnuel(montant?: string): number | null {
  if (!montant) return null;
  const m = montant.match(/(\d[\d  ]*(?:,\d+)?)/);
  if (!m) return null;
  const val = parseFloat(m[1].replace(/[  ]/g, '').replace(',', '.'));
  if (!Number.isFinite(val)) return null;
  if (/mois/i.test(montant)) return val * 12;
  if (/an\b|\/an/i.test(montant)) return val;
  return null; // unité inconnue (ex. « CSS sans participation ») → non chiffré
}

export interface SyntheseNonRecours {
  totalAnnuel: number; // € chiffrables — MAXIMUM si estMaximum est vrai
  estMaximum: boolean; // au moins un montant est un plafond différentiel (« jusqu'à »)
  nbEligibles: number;
  nbChiffres: number;
  nbAVerifier: number;
}

export function syntheseNonRecours(res: ResultatDetection[]): SyntheseNonRecours {
  const elig = res.filter((r) => r.verdict === 'eligible_probable');
  let total = 0;
  let chiffres = 0;
  let estMaximum = false;
  for (const r of elig) {
    const v = parseMontantAnnuel(r.montant_estime);
    if (v !== null) {
      total += v;
      chiffres++;
      if (estMontantPlafond(r.montant_estime)) estMaximum = true;
    }
  }
  return {
    totalAnnuel: Math.round(total),
    estMaximum,
    nbEligibles: elig.length,
    nbChiffres: chiffres,
    nbAVerifier: res.filter((r) => r.verdict === 'a_verifier').length,
  };
}

export const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export const REPERE_ODENORE =
  'Selon l’Odenore, 30 à 50 % des personnes éligibles à une prestation n’en font pas la demande.';
