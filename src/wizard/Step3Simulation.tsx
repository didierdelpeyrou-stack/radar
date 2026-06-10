import { useWizard, type SimItem } from './store';
import { Selecteur, EncadreBleu, EncadreVigilance } from '@/ui/fields';
import { ressourcesMensuelles } from './calculs';

const PRESTATIONS = ['RSA', 'Prime d’activité', 'APL/ALF/ALS', 'AF', 'CF', 'ARS', 'ASF', 'PAJE', 'CMG', 'AAH', 'AEEH', 'ASPA', 'CSS', 'Chèque énergie'];
const COMPTES = [
  ['caf', 'CAF — déclaration trimestrielle à jour, coordonnées'],
  ['ameli', 'Ameli — carte vitale, médecin traitant, CSS active'],
  ['impots', 'impots.gouv.fr — avis dispo, parts, adresse fiscale correcte (cause fréquente de chèque énergie non versé)'],
  ['ft', 'francetravail.fr — actualisation'],
];

export function Step3Simulation() {
  const { state, set } = useWizard();
  const d = state.diagnostic;

  const items: SimItem[] = PRESTATIONS.map(
    (p) => state.simulation.resultats.find((r) => r.prestation === p) ?? { prestation: p, statut: '', montant: '' },
  );
  const majItem = (prestation: string, patch: Partial<SimItem>) =>
    set({
      simulation: {
        ...state.simulation,
        resultats: PRESTATIONS.map((p) => {
          const cur = items.find((r) => r.prestation === p)!;
          return p === prestation ? { ...cur, ...patch } : cur;
        }),
      },
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <aside className="rounded-xl border border-marine/15 bg-white p-4 text-sm">
        <h3 className="mb-2 font-bold text-teal">Récapitulatif pour la recopie</h3>
        <ul className="space-y-1">
          <li>Foyer : {d.bloc1.vie}, {d.bloc1.enfants.length} enfant(s)</li>
          <li>Nationalité : {d.bloc2.nationalite}</li>
          <li>Logement : {d.bloc4.statut}, loyer {d.bloc4.loyer} € + {d.bloc4.charges} € charges</li>
          <li>Ressources : {ressourcesMensuelles(d)} €/mois</li>
          <li>RFR : {d.bloc6.rfr} € · {d.bloc6.parts} part(s)</li>
          <li>Santé : {d.bloc7.couverture} / {d.bloc7.complementaire}</li>
        </ul>
        <a className="mt-3 inline-block rounded-lg bg-teal px-4 py-2 text-white" href="https://mesdroitssociaux.gouv.fr" target="_blank" rel="noreferrer">
          Ouvrir mesdroitssociaux.gouv.fr ↗
        </a>
      </aside>

      <div>
        <h2 className="mb-2 text-xl font-bold">Étape 3 — Simulation officielle</h2>
        <EncadreVigilance>
          La personne tape <strong>elle-même</strong> ses identifiants. Ne jamais insister en cas de
          méfiance FranceConnect. La simulation ne vaut pas ouverture de droits. On fait <em>faire</em>.
        </EncadreVigilance>

        <label className="mb-3 block">
          <span className="font-semibold">Mode</span>
          <Selecteur value={state.simulation.mode} onChange={(mode) => set({ simulation: { ...state.simulation, mode } })}
            options={[{ value: 'franceconnect', label: 'Connecté FranceConnect' }, { value: 'rapide', label: 'Simulation rapide' }]} />
        </label>

        <h3 className="mb-2 font-bold">Résultat par prestation</h3>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.prestation} className="flex flex-wrap items-center gap-2">
              <span className="w-40 font-semibold">{it.prestation}</span>
              <Selecteur value={it.statut} onChange={(statut) => majItem(it.prestation, { statut })}
                options={[
                  { value: '', label: '—' },
                  { value: 'deja_percue', label: 'Déjà perçue' },
                  { value: 'eligible_non_percue', label: 'Éligible non perçue (non-recours)' },
                  { value: 'non_eligible', label: 'Non éligible' },
                ]} />
              <input className="w-28 rounded-lg border border-marine/30 px-2 py-1" placeholder="€ estimé"
                value={it.montant} onChange={(e) => majItem(it.prestation, { montant: e.target.value })} />
            </div>
          ))}
        </div>
        <EncadreBleu>Les « éligible non perçue » sont des situations de non-recours, à injecter dans le plan d’action.</EncadreBleu>

        <h3 className="mb-2 mt-4 font-bold">Comptes connexes à vérifier</h3>
        {COMPTES.map(([id, label]) => (
          <label key={id} className="mb-1 flex items-center gap-2">
            <input type="checkbox" className="h-5 w-5 accent-teal" checked={!!state.simulation.comptes[id]}
              onChange={(e) => set({ simulation: { ...state.simulation, comptes: { ...state.simulation.comptes, [id]: e.target.checked } } })} />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
