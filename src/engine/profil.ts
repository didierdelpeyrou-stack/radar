import type { Diagnostic } from '@/domain/types';
import type { Profil } from './model';

/** Âge en années entières à la date de référence. */
function anneesEntre(dateIso: string, asOf: string): number {
  const d = new Date(dateIso);
  const ref = new Date(asOf);
  let ans = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) ans--;
  return ans;
}

/** Unités de consommation (barème chèque énergie : 1 + 0,5 + 0,3/pers. supp.). */
function unitesConsommation(nbAdultes: number, nbEnfants: number): number {
  const personnes = nbAdultes + nbEnfants;
  if (personnes <= 0) return 1;
  if (personnes === 1) return 1;
  if (personnes === 2) return 1.5;
  return 1.5 + 0.3 * (personnes - 2);
}

export interface ContexteEval {
  asOf: string; // date de référence ISO
  ageDemandeur?: number; // sinon dérivé d'une éventuelle date de naissance fournie ailleurs
  imposLigne?: number; // ligne d'imposition (Pass Paris Senior / Émeraude)
}

/** Construit le profil normalisé — seule entrée du moteur. Pur, déterministe. */
export function construireProfil(d: Diagnostic, ctx: ContexteEval): Profil {
  const enfantsPresents = d.bloc1.enfants.filter((e) => !e.reste_au_pays);
  const nbEnfants = enfantsPresents.length;
  const nbAdultes = d.bloc1.vie === 'couple' ? 2 : 1;
  const parentIsole = d.bloc1.vie === 'seul' && nbEnfants > 0;

  // Régularité du séjour : FR/UE toujours régulier ; hors UE régulier si titre
  // présent ou statut protégé (réfugié/PS/apatride/procédure), jamais bloquant
  // pour l'accueil (garde-fou §10) — sert seulement aux conditions des aides.
  const sejourRegulier =
    d.bloc2.nationalite !== 'hors_ue' ||
    (!!d.bloc2.titre && d.bloc2.statut !== 'sans_titre') ||
    ['refugie', 'protection_subsidiaire', 'apatride', 'procedure_en_cours'].includes(
      d.bloc2.statut ?? '',
    );

  const ancienneteTitreAnnees =
    d.bloc2.anciennete_titre_annees ??
    (d.bloc2.nationalite !== 'hors_ue' ? Number.POSITIVE_INFINITY : 0);

  const salaireNet = d.bloc5.salaire_net || 0;
  const ressourcesMensuelles =
    salaireNet + (d.bloc5.retraites_total || 0) + (d.bloc5.pensions_total || 0);

  const tauxEffort =
    ressourcesMensuelles > 0
      ? ((d.bloc4.loyer + d.bloc4.charges) / ressourcesMensuelles) * 100
      : 100;

  const uc = unitesConsommation(nbAdultes, nbEnfants);
  const rfrParUC = d.bloc6.rfr > 0 ? d.bloc6.rfr / uc : 0;
  const qf =
    d.bloc6.qf_calcule ??
    (d.bloc6.parts > 0 ? d.bloc6.rfr / d.bloc6.parts / 12 : 0);

  const ageDemandeur =
    ctx.ageDemandeur ??
    (d.bloc2.en_france_depuis ? undefined : undefined); // l'âge vient de `personnes`, injecté via ctx

  return {
    asOf: ctx.asOf,
    vie: d.bloc1.vie,
    parentIsole,
    nbEnfants,
    enfants: enfantsPresents,
    ageDemandeur,
    nationalite: d.bloc2.nationalite,
    sejourRegulier,
    ancienneteTitreAnnees,
    paris3sur5: d.bloc2.paris_3ans_sur_5,
    statutLogement: d.bloc4.statut,
    hebergement: d.bloc4.hebergement,
    tauxEffort,
    factureEnergieAuNom: d.bloc4.statut !== 'heberge' ? true : false,
    ressourcesMensuelles,
    salaireNet,
    percues: new Set(d.bloc5.percues),
    chequeEnergieRecu: d.bloc5.cheque_energie_recu,
    couverture: d.bloc7.couverture,
    qf,
    rfrParUC,
    imposLigne: ctx.imposLigne,
    complementaire: d.bloc7.complementaire,
    mdphDroits: new Set(d.bloc7.mdph?.droits ?? []),
  };
}

export { anneesEntre };
