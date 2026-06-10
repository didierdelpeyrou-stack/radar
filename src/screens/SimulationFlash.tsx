// Simulation flash 10 minutes — écran d'entrée du rôle « accueil » (première ligne).
// Repérage rapide à la volée, puis PRISE DE RDV avec un CAD : le dossier pré-rempli
// (origine « flash ») est remis au CAD qui reprend la main pour le diagnostic complet.
// Mêmes garde-fous (§10) : estimation indicative, la personne décide, pas de scoring.

import { useMemo, useState } from 'react';
import { useSession, listeCad } from '@/lib/session';
import { creerDossier, ajouterRdv } from '@/lib/dossiers';
import { etatInitialWizard, diagnosticVide } from '@/wizard/store';
import { construireProfil } from '@/engine/profil';
import { detecter } from '@/engine/engine';
import { DISPOSITIFS } from '@/domain/catalogue';
import { NonRecoursBanner } from '@/ui/NonRecoursBanner';
import { Champ, Selecteur, NombreInput, Bascule, EncadreBleu, EncadreVigilance } from '@/ui/fields';
import { aujourdHui } from '@/lib/dates';
import type { Diagnostic } from '@/domain/types';

const PERCUES = [
  ['rsa', 'RSA'], ['apl_alf_als', 'Aide au logement'], ['af', 'Allocations familiales'],
  ['aah', 'AAH'], ['aspa', 'ASPA'],
];

export function SimulationFlash() {
  const { session } = useSession();

  const [age, setAge] = useState(0);
  const [diag, setDiag] = useState<Diagnostic>(() => diagnosticVide());
  const [ages, setAges] = useState<number[]>([]);
  const [revenu, setRevenu] = useState(0);
  const [statutRevenu, setStatutRevenu] = useState<'salarie' | 'retraite' | 'autre'>('salarie');
  const [cree, setCree] = useState<{ ref: string; id: string } | null>(null);

  // RDV
  const [quand, setQuand] = useState('');
  const [cad, setCad] = useState('');
  // Verrou J+2 n°1 (concertation 11/06/2026) : AUCUN dossier nominatif n'est créé
  // sans recueil explicite du consentement, même à l'accueil. Recueil oral confirmé.
  const [consentement, setConsentement] = useState(false);
  const cads = listeCad();

  const set = (patch: Partial<Diagnostic>) => setDiag((d) => ({ ...d, ...patch }));

  // Synchronise les âges enfants → bloc1.enfants (scolarisés par défaut).
  const diagAvecEnfants: Diagnostic = useMemo(
    () => ({
      ...diag,
      bloc1: {
        ...diag.bloc1,
        enfants: ages.map((a) => ({ age: a, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false })),
      },
      // Le revenu est routé selon son type : seul un salaire d'activité ouvre la
      // Prime d'activité. Une retraite/pension compte dans les ressources sans la
      // déclencher (évite un faux positif pour les personnes âgées).
      bloc5: {
        ...diag.bloc5,
        salaire_net: statutRevenu === 'salarie' ? revenu : 0,
        retraites_total: statutRevenu === 'retraite' ? revenu : 0,
        pensions_total: statutRevenu === 'autre' ? revenu : 0,
      },
    }),
    [diag, ages, revenu, statutRevenu],
  );

  const res = useMemo(
    () => detecter(DISPOSITIFS, construireProfil(diagAvecEnfants, { asOf: aujourdHui(), ageDemandeur: age || undefined })),
    [diagAvecEnfants, age],
  );
  const eligibles = res.filter((r) => r.verdict === 'eligible_probable');
  const aVerifier = res.filter((r) => r.verdict === 'a_verifier');

  function prendreRdv() {
    if (!consentement) return;
    const w = etatInitialWizard();
    // Le consentement vient d'être recueilli oralement : le dossier peut être
    // persisté (ephemere=false) et transmis au CAD.
    w.consentement = { ...w.consentement, accompagnement: true, mode: 'oral_confirme' };
    w.ephemere = false;
    w.diagnostic = diagAvecEnfants;
    w.ageDemandeur = age;
    w.mode_contact = 'accueil';
    w.demande = 'Simulation flash accueil — à reprendre en RDV CAD. Droits repérés : ' + eligibles.map((e) => e.nom).join(', ');
    const refCad = cad.trim() || 'À affecter';
    const dossier = creerDossier(refCad, { origine: 'flash', wizard: w });
    if (quand) {
      ajouterRdv(dossier.id, {
        date: new Date(quand).toISOString(),
        duree_min: 45,
        contenu: `RDV CAD pris à l’accueil par ${session?.nom ?? '—'} suite à une simulation flash.`,
        prochaine_etape: 'Diagnostic complet (5 étapes) par le CAD.',
      });
    }
    setCree({ ref: dossier.ref, id: dossier.id });
  }

  function recommencer() {
    setAge(0); setDiag(diagnosticVide()); setAges([]); setQuand(''); setCad(''); setCree(null); setConsentement(false);
  }

  if (cree) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow">
        <div className="text-5xl">✅</div>
        <h1 className="mt-2 text-2xl font-bold">RDV CAD créé</h1>
        <p className="mt-2 text-marine/70">
          Le dossier <strong>{cree.ref}</strong> a été pré-rempli et transmis
          {cad.trim() ? <> à <strong>{cad.trim()}</strong></> : ' (à affecter à un CAD)'}.
          {quand && <> RDV le <strong>{new Date(quand).toLocaleString('fr-FR')}</strong>.</>}
        </p>
        <EncadreBleu>
          Remettez à la personne le repère des droits détectés et la date du RDV. Le CAD reprendra
          le diagnostic complet.
        </EncadreBleu>
        <button onClick={recommencer} className="mt-2 rounded-lg bg-teal px-5 py-2 font-semibold text-white">
          Nouvelle simulation
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <span className="text-3xl">⏱️</span>
        <h1 className="text-2xl font-bold">Simulation flash — 10 minutes</h1>
      </div>
      <p className="mb-4 text-marine/70">
        Repérage rapide à l’accueil, puis prise de RDV avec un CAD pour le diagnostic complet.
        Estimation indicative — on fait <em>avec</em> la personne.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Formulaire express */}
        <div className="space-y-5 rounded-xl bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Âge de la personne">{() => <NombreInput value={age} onChange={setAge} suffix="ans" />}</Champ>
            <Champ label="Vie">
              {() => (
                <Selecteur value={diag.bloc1.vie} onChange={(vie) => set({ bloc1: { ...diag.bloc1, vie } })}
                  options={[{ value: 'seul', label: 'Seul·e' }, { value: 'couple', label: 'En couple' }]} />
              )}
            </Champ>
          </div>

          <div>
            <div className="mb-1 font-semibold">Enfants à charge (âges)</div>
            <div className="flex flex-wrap items-center gap-2">
              {ages.map((a, i) => (
                <span key={i} className="flex items-center gap-1 rounded-lg border border-marine/20 px-2 py-1">
                  <input type="number" value={a} onChange={(e) => setAges(ages.map((x, j) => (j === i ? Number(e.target.value) : x)))}
                    className="w-16 rounded border border-marine/20 px-1" /> ans
                  <button onClick={() => setAges(ages.filter((_, j) => j !== i))} className="text-corail">✕</button>
                </span>
              ))}
              <button onClick={() => setAges([...ages, 8])} className="rounded-lg border border-teal px-3 py-1 text-teal">+ enfant</button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nationalité">
              {() => (
                <Selecteur value={diag.bloc2.nationalite} onChange={(nationalite) => set({ bloc2: { ...diag.bloc2, nationalite } })}
                  options={[{ value: 'fr', label: 'Française' }, { value: 'ue', label: 'UE' }, { value: 'hors_ue', label: 'Hors UE' }]} />
              )}
            </Champ>
            <Champ label="" pourquoi="Conditionne la quasi-totalité des aides CASVP (Paris).">
              {() => (
                <Bascule label="À Paris depuis 3 ans sur 5" checked={diag.bloc2.paris_3ans_sur_5}
                  onChange={(paris_3ans_sur_5) => set({ bloc2: { ...diag.bloc2, paris_3ans_sur_5 } })} />
              )}
            </Champ>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Logement">
              {() => (
                <Selecteur value={diag.bloc4.statut} onChange={(statut) => set({ bloc4: { ...diag.bloc4, statut } })}
                  options={[{ value: 'locataire_prive', label: 'Locataire privé' }, { value: 'locataire_social', label: 'Locataire HLM' }, { value: 'proprietaire', label: 'Propriétaire' }, { value: 'heberge', label: 'Hébergé' }]} />
              )}
            </Champ>
            <Champ label="Loyer + charges">
              {() => <NombreInput value={diag.bloc4.loyer} onChange={(loyer) => set({ bloc4: { ...diag.bloc4, loyer } })} suffix="€/mois" />}
            </Champ>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Ressources du foyer (par mois)">
              {() => (
                <div className="flex flex-col gap-2">
                  <Selecteur
                    value={statutRevenu}
                    onChange={setStatutRevenu}
                    options={[
                      { value: 'salarie', label: 'Salaire (activité)' },
                      { value: 'retraite', label: 'Retraite / pension' },
                      { value: 'autre', label: 'Autre (RSA, allocations…)' },
                    ]}
                  />
                  <NombreInput value={revenu} onChange={setRevenu} suffix="€/mois" />
                </div>
              )}
            </Champ>
            <Champ label="Couverture maladie">
              {() => (
                <Selecteur value={diag.bloc7.couverture} onChange={(couverture) => set({ bloc7: { ...diag.bloc7, couverture } })}
                  options={[{ value: 'puma', label: 'PUMA' }, { value: 'ame', label: 'AME' }, { value: 'aucune', label: 'Aucune' }]} />
              )}
            </Champ>
          </div>

          <div>
            <div className="mb-1 font-semibold">Déjà perçu</div>
            <div className="flex flex-wrap gap-3">
              {PERCUES.map(([id, label]) => (
                <Bascule key={id} label={label} checked={diag.bloc5.percues.includes(id)}
                  onChange={(v) => set({ bloc5: { ...diag.bloc5, percues: v ? [...diag.bloc5.percues, id] : diag.bloc5.percues.filter((x) => x !== id) } })} />
              ))}
            </div>
          </div>
        </div>

        {/* Résultats + RDV */}
        <div className="space-y-4">
          <NonRecoursBanner res={res} />
          <div className="rounded-xl bg-lave-bleu p-4">
            <h2 className="mb-2 font-bold text-teal">Droits repérés ({eligibles.length})</h2>
            <ul className="space-y-1 text-sm">
              {eligibles.map((r) => (
                <li key={r.dispositif_id}><strong>{r.nom}</strong>{r.montant_estime ? ` — ${r.montant_estime}` : ''}</li>
              ))}
              {eligibles.length === 0 && <li className="text-marine/60">Remplissez le formulaire pour voir les droits.</li>}
            </ul>
            {aVerifier.length > 0 && <p className="mt-2 text-sm text-marine/60">+ {aVerifier.length} à vérifier en RDV.</p>}
          </div>

          <div className="rounded-xl border border-teal bg-white p-4">
            <h2 className="mb-2 font-bold">Prendre RDV avec un CAD</h2>
            <Champ label="Date et heure">
              {(id) => (
                <input id={id} type="datetime-local" value={quand} onChange={(e) => setQuand(e.target.value)}
                  className="w-full rounded-lg border border-marine/30 px-3 py-2" />
              )}
            </Champ>
            <Champ label="CAD (facultatif)">
              {() => (
                <div className="flex flex-col gap-2">
                  {cads.length > 0 && (
                    <Selecteur value={cad} onChange={setCad}
                      options={[{ value: '', label: 'À affecter' }, ...cads.map((c) => ({ value: c, label: c }))]} />
                  )}
                  <input value={cad} onChange={(e) => setCad(e.target.value)} placeholder="ou saisir un nom de CAD"
                    className="w-full rounded-lg border border-marine/30 px-3 py-2" />
                </div>
              )}
            </Champ>
            <Bascule
              label="La personne accepte (à l’oral) que ses informations soient enregistrées et transmises au CAD pour son accompagnement."
              checked={consentement} onChange={setConsentement} />
            {!quand && <EncadreVigilance>Choisir une date de RDV avant de transmettre au CAD.</EncadreVigilance>}
            {quand && !consentement && (
              <EncadreVigilance>Recueillir le consentement de la personne avant de créer le dossier.</EncadreVigilance>
            )}
            <button onClick={prendreRdv} disabled={!quand || !consentement}
              className="mt-2 w-full rounded-lg bg-corail px-4 py-3 font-semibold text-white disabled:opacity-40">
              Créer le dossier flash et le RDV CAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
