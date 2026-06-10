// Page « Sources et vérification » — rubrique à part regroupant l'origine de
// TOUS les chiffres affichés dans RADAR : indicateurs du bilan et montants /
// plafonds des dispositifs (avec leur source officielle et leur date de
// référence). Objectif : permettre de vérifier chaque donnée à la source.

import { DISPOSITIFS } from '@/domain/catalogue';
import { BILAN_BI1 } from '@/domain/bilan';

function montantLisible(m: unknown): string {
  if (typeof m === 'string') return m;
  if (typeof m === 'function') return 'variable selon le profil';
  return '—';
}

export function Sources() {
  const dateFr = new Date(BILAN_BI1.arrete_au).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Sources et vérification</h1>
      <p className="mb-6 max-w-3xl text-marine/70">
        Tous les chiffres affichés dans RADAR sont sourcés et datés. Chaque montant ou plafond
        renvoie à une source officielle et à une date de référence. Le référentiel fait l’objet
        d’une <strong>revue annuelle obligatoire</strong> avant mise en production.
      </p>

      {/* Chiffres du bilan */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Chiffres du bilan d’impact</h2>
        <div className="rounded-xl border border-marine/15 bg-white p-4">
          <p className="mb-2">
            Les indicateurs de la rubrique « Bilan terrain » du tableau de bord Impact
            (diagnostics réalisés, droits repérés, profil du public) proviennent de :
          </p>
          <p className="mb-3 font-semibold">{BILAN_BI1.source}</p>
          <ul className="space-y-1 text-marine/80">
            <li>Données d’activité arrêtées au <strong>{dateFr}</strong>.</li>
            <li>
              Résultats d’impact (81 % de diagnostics avec au moins un droit, 1,7 droit par
              diagnostic) issus du rapport du cabinet d’évaluation indépendant Improve, mai 2026.
            </li>
            <li>
              Référence externe citée : étude du Secours Catholique (2021) et Observatoire des
              non-recours (Odenore) — 30 à 50 % de non-recours selon les prestations.
            </li>
          </ul>
        </div>
      </section>

      {/* Montants et plafonds des dispositifs */}
      <section>
        <h2 className="mb-2 text-xl font-bold">Montants et plafonds des dispositifs</h2>
        <p className="mb-3 text-sm text-marine/60">
          {DISPOSITIFS.length} dispositifs référencés. La mention « à vérifier avant production »
          signale les valeurs à reconfirmer à la source avant tout usage opérationnel.
        </p>
        <div className="overflow-x-auto rounded-xl border border-marine/15 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-marine/15 text-left">
                <th className="p-3 font-semibold">Dispositif</th>
                <th className="p-3 font-semibold">Montant / plafond</th>
                <th className="p-3 font-semibold">Source</th>
                <th className="p-3 font-semibold">Date de référence</th>
              </tr>
            </thead>
            <tbody>
              {DISPOSITIFS.map((d) => (
                <tr key={d.id} className="border-b border-marine/10 align-top">
                  <td className="p-3">
                    <div className="font-semibold">{d.nom}</div>
                    <div className="text-xs text-marine/50">{d.organisme}</div>
                  </td>
                  <td className="p-3">{montantLisible(d.montant)}</td>
                  <td className="p-3">{d.regle?.source ?? '—'}</td>
                  <td className="p-3 whitespace-nowrap">
                    {d.regle?.date_source ?? '—'}
                    {d.regle?.a_verifier_avant_prod && (
                      <span className="ml-1 inline-block rounded bg-lave-dore px-1.5 py-0.5 text-[11px] text-marine/70">
                        à vérifier
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
