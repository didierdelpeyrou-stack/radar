import { useWizard } from './store';
import { Champ, Selecteur, NombreInput, Bascule, TexteInput, EncadreVigilance, EncadreBleu } from '@/ui/fields';
import { tauxEffort, quotientFamilial, moisAvantExpirationTitre } from './calculs';
import type { Enfant } from '@/domain/types';

const PERCUES_OPTS = [
  ['rsa', 'RSA'], ['prime_activite', 'Prime d’activité'], ['apl_alf_als', 'Aide au logement (APL/ALF/ALS)'],
  ['af', 'Allocations familiales'], ['ars', 'ARS'], ['asf', 'ASF'], ['aah', 'AAH'], ['aspa', 'ASPA'],
];

export function Step2Diagnostic() {
  const { state, setBloc } = useWizard();
  const d = state.diagnostic;
  const te = tauxEffort(d);
  const qf = quotientFamilial(d);
  const moisTitre = moisAvantExpirationTitre(d, '2026-06-10');

  const enfants = d.bloc1.enfants;
  const setEnfant = (i: number, patch: Partial<Enfant>) =>
    setBloc('bloc1', { ...d.bloc1, enfants: enfants.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Étape 2 — Diagnostic structuré (7 blocs)</h2>

      {/* BLOC 1 */}
      <section>
        <h3 className="mb-2 font-bold text-teal">1 · Composition du foyer</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Champ label="Vie">
            {() => (
              <Selecteur value={d.bloc1.vie} onChange={(vie) => setBloc('bloc1', { ...d.bloc1, vie })}
                options={[{ value: 'seul', label: 'Seul·e' }, { value: 'couple', label: 'En couple' }]} />
            )}
          </Champ>
          <Champ label="Situation matrimoniale">
            {() => (
              <Selecteur value={d.bloc1.matrimonial} onChange={(matrimonial) => setBloc('bloc1', { ...d.bloc1, matrimonial })}
                options={['celibataire', 'marie', 'pacse', 'concubin', 'separe', 'divorce', 'veuf'].map((v) => ({ value: v as never, label: v }))} />
            )}
          </Champ>
        </div>
        <div className="mt-2">
          <div className="mb-1 font-semibold">Enfants à charge</div>
          {enfants.map((e, i) => (
            <div key={i} className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-marine/15 p-2">
              <NombreInput value={e.age} onChange={(age) => setEnfant(i, { age })} suffix="ans" />
              <Bascule label="Scolarisé en France" checked={e.scolarise_france} onChange={(v) => setEnfant(i, { scolarise_france: v })} />
              <Bascule label="Garde alternée" checked={e.garde_alternee} onChange={(v) => setEnfant(i, { garde_alternee: v })} />
              <Bascule label="Handicap" checked={e.handicap} onChange={(v) => setEnfant(i, { handicap: v })} />
              <Bascule label="Resté au pays" checked={e.reste_au_pays} onChange={(v) => setEnfant(i, { reste_au_pays: v })} />
              <button className="text-corail" onClick={() => setBloc('bloc1', { ...d.bloc1, enfants: enfants.filter((_, j) => j !== i) })}>Retirer</button>
            </div>
          ))}
          <button className="rounded-lg border border-teal px-3 py-1 text-teal"
            onClick={() => setBloc('bloc1', { ...d.bloc1, enfants: [...enfants, { age: 0, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false }] })}>
            + Ajouter un enfant
          </button>
        </div>
      </section>

      {/* BLOC 2 */}
      <section>
        <h3 className="mb-2 font-bold text-teal">2 · Situation administrative</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Champ label="Nationalité">
            {() => (
              <Selecteur value={d.bloc2.nationalite} onChange={(nationalite) => setBloc('bloc2', { ...d.bloc2, nationalite })}
                options={[{ value: 'fr', label: 'Française' }, { value: 'ue', label: 'UE' }, { value: 'hors_ue', label: 'Hors UE' }]} />
            )}
          </Champ>
          <Champ label="Expiration du titre de séjour" pourquoi="La rupture de droit au séjour entraîne la perte d’AME, des droits CAF et CASVP.">
            {(id) => (
              <TexteInput id={id} type="date" value={d.bloc2.titre?.expiration ?? ''}
                onChange={(e) => setBloc('bloc2', { ...d.bloc2, titre: { type: d.bloc2.titre?.type ?? '', expiration: e.target.value } })} />
            )}
          </Champ>
          <Champ label="Ancienneté du titre (années)" pourquoi="Le RSA exige en règle générale un titre ≥ 5 ans (hors statuts protégés).">
            {() => <NombreInput value={d.bloc2.anciennete_titre_annees ?? 0} onChange={(anciennete_titre_annees) => setBloc('bloc2', { ...d.bloc2, anciennete_titre_annees })} suffix="ans" />}
          </Champ>
          <Champ label="" pourquoi="Conditionne la quasi-totalité des aides CASVP.">
            {() => (
              <Bascule label="À Paris 3 ans sur les 5 dernières années" checked={d.bloc2.paris_3ans_sur_5}
                onChange={(paris_3ans_sur_5) => setBloc('bloc2', { ...d.bloc2, paris_3ans_sur_5 })} />
            )}
          </Champ>
        </div>
        {moisTitre !== null && moisTitre < 4 && (
          <EncadreVigilance>
            Titre de séjour expirant dans {moisTitre} mois — <strong>préparer le renouvellement immédiatement</strong>.
          </EncadreVigilance>
        )}
      </section>

      {/* BLOC 3 */}
      <section>
        <h3 className="mb-2 font-bold text-teal">3 · Situation professionnelle</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Champ label="Statut">
            {() => (
              <Selecteur value={d.bloc3.statut} onChange={(statut) => setBloc('bloc3', { ...d.bloc3, statut })}
                options={['inactif', 'salarie', 'independant', 'chomage', 'invalidite', 'retraite'].map((v) => ({ value: v as never, label: v }))} />
            )}
          </Champ>
        </div>
      </section>

      {/* BLOC 4 */}
      <section>
        <h3 className="mb-2 font-bold text-teal">4 · Logement</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Champ label="Statut">
            {() => (
              <Selecteur value={d.bloc4.statut} onChange={(statut) => setBloc('bloc4', { ...d.bloc4, statut })}
                options={[{ value: 'locataire_prive', label: 'Locataire privé' }, { value: 'locataire_social', label: 'Locataire social (HLM)' }, { value: 'proprietaire', label: 'Propriétaire' }, { value: 'heberge', label: 'Hébergé' }]} />
            )}
          </Champ>
          {d.bloc4.statut === 'heberge' && (
            <Champ label="Type d’hébergement">
              {() => (
                <Selecteur value={d.bloc4.hebergement ?? 'tiers'} onChange={(hebergement) => setBloc('bloc4', { ...d.bloc4, hebergement })}
                  options={[{ value: 'hotel_social', label: 'Hôtel social' }, { value: 'chu_chrs', label: 'CHU/CHRS' }, { value: 'tiers', label: 'Chez un tiers' }, { value: 'sans_domicile', label: 'Sans domicile' }]} />
              )}
            </Champ>
          )}
          <Champ label="Loyer (hors charges)">{() => <NombreInput value={d.bloc4.loyer} onChange={(loyer) => setBloc('bloc4', { ...d.bloc4, loyer })} suffix="€/mois" />}</Champ>
          <Champ label="Charges">{() => <NombreInput value={d.bloc4.charges} onChange={(charges) => setBloc('bloc4', { ...d.bloc4, charges })} suffix="€/mois" />}</Champ>
        </div>
        <div className="flex flex-wrap gap-4">
          <Bascule label="Suroccupation" checked={d.bloc4.suroccupation} onChange={(v) => setBloc('bloc4', { ...d.bloc4, suroccupation: v })} />
          <Bascule label="Insalubrité" checked={d.bloc4.insalubrite} onChange={(v) => setBloc('bloc4', { ...d.bloc4, insalubrite: v })} />
          <Bascule label="Expulsion en cours" checked={d.bloc4.expulsion_en_cours} onChange={(v) => setBloc('bloc4', { ...d.bloc4, expulsion_en_cours: v })} />
          <Bascule label="Dette locative" checked={d.bloc4.dette_locative} onChange={(v) => setBloc('bloc4', { ...d.bloc4, dette_locative: v })} />
        </div>
        {te !== null && (
          <EncadreBleu>
            Taux d’effort : <strong>{Math.round(te)} %</strong> (seuil de référence : 30 % — prérequis Paris Logement).
          </EncadreBleu>
        )}
      </section>

      {/* BLOC 5 */}
      <section>
        <h3 className="mb-2 font-bold text-teal">5 · Ressources mensuelles nettes</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Champ label="Salaires">{() => <NombreInput value={d.bloc5.salaire_net} onChange={(salaire_net) => setBloc('bloc5', { ...d.bloc5, salaire_net })} suffix="€" />}</Champ>
          <Champ label="Retraites">{() => <NombreInput value={d.bloc5.retraites_total ?? 0} onChange={(retraites_total) => setBloc('bloc5', { ...d.bloc5, retraites_total })} suffix="€" />}</Champ>
          <Champ label="Pensions">{() => <NombreInput value={d.bloc5.pensions_total ?? 0} onChange={(pensions_total) => setBloc('bloc5', { ...d.bloc5, pensions_total })} suffix="€" />}</Champ>
        </div>
        <div className="mb-1 font-semibold">Déjà perçu</div>
        <div className="flex flex-wrap gap-3">
          {PERCUES_OPTS.map(([id, label]) => (
            <Bascule key={id} label={label} checked={d.bloc5.percues.includes(id)}
              onChange={(v) => setBloc('bloc5', { ...d.bloc5, percues: v ? [...d.bloc5.percues, id] : d.bloc5.percues.filter((x) => x !== id) })} />
          ))}
        </div>
        <Bascule label="Chèque énergie reçu" checked={d.bloc5.cheque_energie_recu} onChange={(v) => setBloc('bloc5', { ...d.bloc5, cheque_energie_recu: v })} />
      </section>

      {/* BLOC 6 */}
      <section>
        <h3 className="mb-2 font-bold text-teal">6 · Avis d’imposition</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Champ label="Revenu fiscal de référence (annuel)">{() => <NombreInput value={d.bloc6.rfr} onChange={(rfr) => setBloc('bloc6', { ...d.bloc6, rfr })} suffix="€" />}</Champ>
          <Champ label="Nombre de parts">{() => <NombreInput value={d.bloc6.parts} onChange={(parts) => setBloc('bloc6', { ...d.bloc6, parts })} step="0.5" />}</Champ>
        </div>
        {qf !== null && <EncadreBleu>Quotient familial estimé : <strong>{Math.round(qf)} €</strong>.</EncadreBleu>}
        <Bascule label="Anomalie détectée (enfants, régime matrimonial, demi-part) → orienter Service des Impôts"
          checked={d.bloc6.anomalie_orientation_sip} onChange={(v) => setBloc('bloc6', { ...d.bloc6, anomalie_orientation_sip: v })} />
        {d.bloc6.anomalie_orientation_sip && <EncadreVigilance>Une rectification peut ouvrir rétroactivement plusieurs centaines d’euros par mois.</EncadreVigilance>}
      </section>

      {/* BLOC 7 */}
      <section>
        <h3 className="mb-2 font-bold text-teal">7 · Santé</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Champ label="Couverture maladie">
            {() => (
              <Selecteur value={d.bloc7.couverture} onChange={(couverture) => setBloc('bloc7', { ...d.bloc7, couverture })}
                options={[{ value: 'puma', label: 'PUMA' }, { value: 'ame', label: 'AME' }, { value: 'aucune', label: 'Aucune' }]} />
            )}
          </Champ>
          <Champ label="Complémentaire">
            {() => (
              <Selecteur value={d.bloc7.complementaire} onChange={(complementaire) => setBloc('bloc7', { ...d.bloc7, complementaire })}
                options={[{ value: 'css_sans', label: 'CSS sans participation' }, { value: 'css_avec', label: 'CSS avec participation' }, { value: 'mutuelle', label: 'Mutuelle privée' }, { value: 'csp', label: 'Complément Santé Paris' }, { value: 'aucune', label: 'Aucune' }]} />
            )}
          </Champ>
        </div>
        <div className="flex flex-wrap gap-4">
          <Bascule label="ALD" checked={d.bloc7.ald} onChange={(v) => setBloc('bloc7', { ...d.bloc7, ald: v })} />
          <Bascule label="Aidant familial" checked={d.bloc7.aidant} onChange={(v) => setBloc('bloc7', { ...d.bloc7, aidant: v })} />
        </div>
      </section>
    </div>
  );
}
