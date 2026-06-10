import type { ResultatDetection } from '@/engine/model';
import { syntheseNonRecours, euros, REPERE_ODENORE } from '@/lib/nudges';

/** Le nudge central : chiffrer ce que le foyer laisse potentiellement sur la table. */
export function NonRecoursBanner({ res }: { res: ResultatDetection[] }) {
  const s = syntheseNonRecours(res);
  if (s.nbEligibles === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-teal bg-gradient-to-br from-teal to-marine text-white shadow-md">
      <div className="flex flex-wrap items-center gap-6 p-5">
        <div>
          <div className="text-sm uppercase tracking-wide text-white/70">
            Droits détectés, non encore demandés
          </div>
          <div className="text-4xl font-bold leading-tight">
            {s.totalAnnuel > 0
              ? `${s.estMaximum ? 'jusqu’à ' : '≈ '}${euros(s.totalAnnuel)}/an`
              : `${s.nbEligibles} droit(s)`}
          </div>
          <div className="mt-1 text-sm text-white/80">
            {s.estMaximum ? 'Montant au maximum — certains droits sont des compléments calculés selon les ressources. ' : ''}
            {s.nbEligibles} aide(s) éligible(s){s.nbChiffres < s.nbEligibles ? ` · ${s.nbEligibles - s.nbChiffres} non chiffrable(s) ici` : ''}
            {s.nbAVerifier > 0 ? ` · ${s.nbAVerifier} à vérifier` : ''}
          </div>
        </div>
        <p className="max-w-md text-sm text-white/75">
          {REPERE_ODENORE} Estimation indicative — seules les administrations ouvrent les droits.
        </p>
      </div>
    </div>
  );
}
