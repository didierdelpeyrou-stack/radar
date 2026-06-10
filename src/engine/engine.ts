// ─────────────────────────────────────────────────────────────────────────
// Moteur d'éligibilité déterministe. Évalue chaque dispositif, applique les
// effets d'entraînement (point fixe) puis les non-cumuls. Explicable : chaque
// verdict porte sa raison ou sa question. AUCUNE IA.
// ─────────────────────────────────────────────────────────────────────────

import type {
  Condition,
  CondResult,
  Declencheur,
  Dispositif,
  Profil,
  ResultatDetection,
  Verdict,
} from './model';

export const MOTEUR_VERSION = '2026.05-mvp';

const round = (n: number) => Math.round(n);

function matchComposition(
  p: Profil,
  cat: 'seul' | 'couple' | 'couple_1enf',
): boolean {
  if (cat === 'seul') return p.vie === 'seul' && p.nbEnfants === 0;
  if (cat === 'couple') return p.vie === 'couple' && p.nbEnfants === 0;
  return p.vie === 'couple' && p.nbEnfants === 1;
}

export function evalCondition(
  c: Condition,
  p: Profil,
  decl: Set<Declencheur>,
): CondResult {
  switch (c.type) {
    case 'paris_3sur5':
      return p.paris3sur5
        ? { status: 'pass' }
        : {
            status: 'fail',
            raison:
              'ancienneté à Paris < 3 ans sur les 5 dernières années (condition CASVP)',
          };
    case 'sejour_regulier':
      return p.sejourRegulier
        ? { status: 'pass' }
        : { status: 'fail', raison: 'séjour régulier requis pour cette aide' };
    case 'composition':
      return c.in.some((cat) => matchComposition(p, cat))
        ? { status: 'pass' }
        : { status: 'fail', raison: 'composition du foyer hors champ de l’aide' };
    case 'parent_isole':
      return p.parentIsole
        ? { status: 'pass' }
        : { status: 'fail', raison: 'réservé aux parents isolés' };
    case 'avec_enfants':
      return p.nbEnfants > 0
        ? { status: 'pass' }
        : { status: 'fail', raison: 'aucun enfant à charge' };
    case 'nb_enfants': {
      if (c.min !== undefined && p.nbEnfants < c.min)
        return {
          status: 'fail',
          raison: `${p.nbEnfants} enfant(s) — minimum ${c.min} requis`,
        };
      if (c.max !== undefined && p.nbEnfants > c.max)
        return {
          status: 'fail',
          raison: `${p.nbEnfants} enfant(s) — maximum ${c.max}`,
        };
      return { status: 'pass' };
    }
    case 'enfant_age': {
      const ok = p.enfants.some(
        (e) =>
          (c.min === undefined || e.age >= c.min) &&
          (c.max === undefined || e.age <= c.max),
      );
      return ok
        ? { status: 'pass' }
        : {
            status: 'fail',
            raison: `aucun enfant dans la tranche ${c.min ?? 0}-${c.max ?? '∞'} ans`,
          };
    }
    case 'age_demandeur': {
      if (p.ageDemandeur === undefined)
        return { status: 'unknown', question: 'préciser l’âge du demandeur' };
      if (c.min !== undefined && p.ageDemandeur < c.min)
        return {
          status: 'fail',
          raison: `âge ${p.ageDemandeur} ans < ${c.min} ans requis`,
        };
      if (c.max !== undefined && p.ageDemandeur > c.max)
        return {
          status: 'fail',
          raison: `âge ${p.ageDemandeur} ans > ${c.max} ans`,
        };
      return { status: 'pass' };
    }
    case 'plafond_ressources_mensuel':
      return p.ressourcesMensuelles <= c.max
        ? { status: 'pass' }
        : {
            status: 'fail',
            raison: `ressources ${round(p.ressourcesMensuelles)} € > plafond ${c.max} €/mois`,
          };
    case 'taux_effort_min':
      return p.tauxEffort >= c.min
        ? { status: 'pass' }
        : {
            status: 'fail',
            raison: `taux d’effort ${round(p.tauxEffort)} % < ${c.min} % requis`,
          };
    case 'qf_max':
      if (p.qf <= 0)
        return { status: 'unknown', question: 'calculer le quotient familial' };
      return p.qf <= c.max
        ? { status: 'pass' }
        : { status: 'fail', raison: `QF ${round(p.qf)} € > plafond ${c.max} €` };
    case 'rfr_uc_max':
      if (p.rfrParUC <= 0)
        return {
          status: 'unknown',
          question: 'récupérer le RFR (N-2) sur l’avis d’imposition',
        };
      return p.rfrParUC <= c.max
        ? { status: 'pass' }
        : {
            status: 'fail',
            raison: `RFR/UC ${round(p.rfrParUC)} € > plafond ${c.max} €`,
          };
    case 'impot_ligne_max':
      if (p.imposLigne === undefined)
        return {
          status: 'unknown',
          question: `vérifier la ligne d’imposition (seuil ${c.max} €)`,
        };
      return p.imposLigne <= c.max
        ? { status: 'pass' }
        : {
            status: 'fail',
            raison: `ligne d’imposition ${p.imposLigne} € > ${c.max} €`,
          };
    case 'declencheur':
      return c.any.some((d) => decl.has(d))
        ? { status: 'pass' }
        : {
            status: 'fail',
            raison: `aucun droit déclencheur actif (${c.any.join(' / ')})`,
          };
    case 'facture_energie_au_nom':
      if (p.factureEnergieAuNom === true) return { status: 'pass' };
      return {
        status: 'fail',
        raison: 'facture d’énergie pas au nom du demandeur (hébergé / hôtel)',
      };
    case 'logement_statut':
      return c.in.includes(p.statutLogement)
        ? { status: 'pass' }
        : { status: 'fail', raison: 'statut de logement hors champ' };
  }
}

interface Evaluation {
  verdict: Verdict;
  raison?: string;
  question?: string;
  montant?: string;
  emet: Declencheur[];
}

function montantOf(disp: Dispositif, p: Profil): string | undefined {
  if (typeof disp.montant === 'function') return disp.montant(p);
  return disp.montant;
}

/** Évalue un dispositif isolément (avant non-cumuls). */
function evaluerDispositif(
  disp: Dispositif,
  p: Profil,
  decl: Set<Declencheur>,
): Evaluation | null {
  // Déjà perçu : prioritaire, court-circuite.
  if (p.percues.has(disp.id))
    return { verdict: 'deja_percu', emet: disp.regle?.declencheurs ?? disp.emet ?? [] };

  if (disp.evaluer) {
    const r = disp.evaluer(p, decl);
    return {
      verdict: r.verdict,
      raison: r.raison,
      question: r.question,
      montant: r.montant ?? montantOf(disp, p),
      emet:
        r.verdict === 'eligible_probable' || r.verdict === 'deja_percu'
          ? r.emet ?? disp.regle?.declencheurs ?? disp.emet ?? []
          : [],
    };
  }

  if (!disp.regle) return null; // mode checklist : non auto-détecté

  const results = disp.regle.conditions.map((c) => evalCondition(c, p, decl));
  const fail = results.find((r) => r.status === 'fail');
  if (fail) return { verdict: 'non_eligible', raison: fail.raison, emet: [] };
  const unknown = results.find((r) => r.status === 'unknown');
  if (unknown)
    return { verdict: 'a_verifier', question: unknown.question, emet: [] };
  return {
    verdict: 'eligible_probable',
    montant: montantOf(disp, p),
    emet: disp.regle.declencheurs ?? disp.emet ?? [],
  };
}

/** Déclencheurs actifs déduits directement du profil (état initial). */
function declencheursInitiaux(p: Profil): Set<Declencheur> {
  const s = new Set<Declencheur>();
  if (p.percues.has('rsa')) s.add('rsa');
  if (p.percues.has('aspa')) s.add('aspa');
  if (p.percues.has('ass')) s.add('ass');
  if (p.couverture === 'ame') s.add('ame');
  if (p.complementaire === 'css_sans') s.add('css_sans_participation');
  if (p.mdphDroits.has('aah') || p.percues.has('aah')) s.add('aah');
  if (p.mdphDroits.has('aeeh')) s.add('aeeh');
  if (p.mdphDroits.has('cmi')) s.add('cmi');
  return s;
}

/**
 * Détection complète. Itère sur les effets d'entraînement jusqu'au point fixe,
 * puis applique les non-cumuls (le dispositif tombe si un de ses non-cumuls est
 * retenu). Retourne un résultat trié et stable.
 */
export function detecter(
  dispositifs: Dispositif[],
  p: Profil,
): ResultatDetection[] {
  const actifs = dispositifs.filter((d) => d.actif);
  const decl = declencheursInitiaux(p);

  let evals = new Map<string, Evaluation>();
  for (let iter = 0; iter < 6; iter++) {
    evals = new Map();
    let nouveau = false;
    for (const disp of actifs) {
      const e = evaluerDispositif(disp, p, decl);
      if (!e) continue;
      evals.set(disp.id, e);
      for (const d of e.emet) {
        if (!decl.has(d)) {
          decl.add(d);
          nouveau = true;
        }
      }
    }
    if (!nouveau) break;
  }

  // Ensemble retenu (pour les non-cumuls).
  const retenus = new Set<string>();
  for (const [id, e] of evals)
    if (e.verdict === 'eligible_probable' || e.verdict === 'deja_percu')
      retenus.add(id);

  const out: ResultatDetection[] = [];
  for (const disp of actifs) {
    const e = evals.get(disp.id);
    if (!e) continue;
    let { verdict, raison, question, montant } = e;

    // Non-cumuls : si un partenaire prioritaire est retenu, ce dispositif tombe.
    if (
      (verdict === 'eligible_probable' || verdict === 'a_verifier') &&
      disp.regle?.non_cumuls?.length
    ) {
      const bloquant = disp.regle.non_cumuls.find((nc) => retenus.has(nc));
      if (bloquant) {
        const nom =
          dispositifs.find((d) => d.id === bloquant)?.nom ?? bloquant;
        verdict = 'non_eligible';
        raison = `non-cumulable avec « ${nom} » (retenu)`;
        question = undefined;
        montant = undefined;
        retenus.delete(disp.id);
      }
    }

    out.push({
      dispositif_id: disp.id,
      nom: disp.nom,
      organisme: disp.organisme,
      determinant: disp.determinant,
      verdict,
      raison,
      question,
      montant_estime: montant,
      couvert_par_mds: disp.couvert_par_mds,
    });
  }

  const ordre: Record<Verdict, number> = {
    eligible_probable: 0,
    deja_percu: 1,
    a_verifier: 2,
    non_eligible: 3,
  };
  out.sort(
    (a, b) =>
      ordre[a.verdict] - ordre[b.verdict] ||
      a.nom.localeCompare(b.nom, 'fr'),
  );
  return out;
}
