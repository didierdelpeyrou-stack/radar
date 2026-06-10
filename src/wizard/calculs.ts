// Calculs affichés dans le wizard (transparents, expliqués à la personne).
import type { Diagnostic } from '@/domain/types';

export function ressourcesMensuelles(d: Diagnostic): number {
  return (d.bloc5.salaire_net || 0) + (d.bloc5.retraites_total || 0) + (d.bloc5.pensions_total || 0);
}

/** Taux d'effort = (loyer hors charges + charges) / ressources. Seuil affiché : 30 %. */
export function tauxEffort(d: Diagnostic): number | null {
  const r = ressourcesMensuelles(d);
  if (r <= 0) return null;
  return ((d.bloc4.loyer + d.bloc4.charges) / r) * 100;
}

/** Quotient familial = (RFR / parts) / 12 (approximation affichée). */
export function quotientFamilial(d: Diagnostic): number | null {
  if (d.bloc6.parts <= 0 || d.bloc6.rfr <= 0) return null;
  return d.bloc6.rfr / d.bloc6.parts / 12;
}

/** Mois restants avant expiration du titre de séjour (alerte si < 4). */
export function moisAvantExpirationTitre(d: Diagnostic, asOf: string): number | null {
  const exp = d.bloc2.titre?.expiration;
  if (!exp) return null;
  const a = new Date(asOf);
  const b = new Date(exp);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
