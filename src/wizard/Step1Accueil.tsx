import { useWizard, URGENCES } from './store';
import { Champ, Selecteur, TexteInput, NombreInput, Bascule, EncadreBleu, EncadreVigilance } from '@/ui/fields';

const NUMEROS = [
  ['115', 'hébergement'], ['119', 'enfance en danger'], ['3919', 'violences femmes'],
  ['116 006', 'France Victimes'], ['3114', 'prévention suicide'], ['15', 'SAMU'], ['17', 'police'],
];

export function Step1Accueil() {
  const { state, set } = useWizard();
  const urgenceActive = Object.values(state.urgences).some(Boolean);

  return (
    <div>
      <h2 className="mb-3 text-xl font-bold">Étape 1 — Accueil, urgences, consentement</h2>

      <section className="mb-6 rounded-xl border border-corail bg-lave-corail p-4">
        <h3 className="mb-2 font-bold text-corail">Urgences — à repérer en premier</h3>
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          {NUMEROS.map(([n, l]) => (
            <span key={n} className="rounded bg-white px-2 py-1">
              <strong>{n}</strong> · {l}
            </span>
          ))}
        </div>
        {URGENCES.map((u) => (
          <div key={u.id}>
            <Bascule
              label={u.label}
              checked={!!state.urgences[u.id]}
              onChange={(v) => set({ urgences: { ...state.urgences, [u.id]: v } })}
            />
            {state.urgences[u.id] && (
              <EncadreVigilance>
                <strong>Conduite à tenir :</strong> {u.conduite}
              </EncadreVigilance>
            )}
          </div>
        ))}
        {urgenceActive && (
          <EncadreBleu>
            Traiter l’urgence d’abord. Le diagnostic peut se poursuivre en mode « urgence traitée ».
          </EncadreBleu>
        )}
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-bold">Consentement (RGPD)</h3>
        <Bascule
          label="(1) J’accepte le recueil et l’utilisation de mes informations pour mon accompagnement."
          checked={state.consentement.accompagnement}
          onChange={(v) =>
            set({
              consentement: { ...state.consentement, accompagnement: v },
              ephemere: !v,
            })
          }
        />
        <Bascule
          label="(2) J’accepte l’utilisation de données anonymisées pour la mesure d’impact du projet (FSU)."
          checked={state.consentement.mesure_impact}
          onChange={(v) => set({ consentement: { ...state.consentement, mesure_impact: v } })}
        />
        <Champ label="Mode de recueil">
          {() => (
            <Selecteur
              value={state.consentement.mode}
              onChange={(mode) => set({ consentement: { ...state.consentement, mode } })}
              options={[
                { value: 'oral_confirme', label: 'Oral confirmé' },
                { value: 'signe_ecran', label: 'Signé sur écran' },
              ]}
            />
          )}
        </Champ>
        {state.ephemere && (
          <EncadreVigilance>
            <strong>Mode session éphémère activé</strong> : sans la case (1), rien n’est enregistré
            en base. Un PDF pourra être remis, puis la session sera purgée.
          </EncadreVigilance>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Champ label="Mode de contact">
          {() => (
            <Selecteur
              value={state.mode_contact}
              onChange={(mode_contact) => set({ mode_contact })}
              options={[
                { value: 'permanence', label: 'Permanence' },
                { value: 'rdv', label: 'RDV' },
                { value: 'orientation', label: 'Orientation' },
                { value: 'reorientation', label: 'Réorientation interne' },
                { value: 'tiers_lieu', label: 'Tiers-lieu' },
              ]}
            />
          )}
        </Champ>
        <Champ
          label="Besoin linguistique"
          pourquoi="Ne JAMAIS utiliser un enfant comme interprète. Mobiliser un interprète professionnel si besoin."
        >
          {() => (
            <Selecteur
              value={state.besoin_linguistique}
              onChange={(besoin_linguistique) => set({ besoin_linguistique })}
              options={[
                { value: 'autonome', label: 'Français autonome' },
                { value: 'avec_appui', label: 'Français avec appui' },
                { value: 'interprete', label: 'Interprète mobilisé' },
              ]}
            />
          )}
        </Champ>
        <Champ label="Âge de la personne" pourquoi="Conditionne ASPA, Pass Paris Senior, certaines aides FSL.">
          {() => <NombreInput value={state.ageDemandeur} onChange={(ageDemandeur) => set({ ageDemandeur })} suffix="ans" />}
        </Champ>
        <Champ label="Demande explicite de la personne">
          {(id) => (
            <TexteInput
              id={id}
              value={state.demande}
              onChange={(e) => set({ demande: e.target.value })}
              placeholder="Dans ses mots…"
            />
          )}
        </Champ>
      </section>
    </div>
  );
}
