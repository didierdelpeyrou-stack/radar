import { useState } from 'react';
import { useWizard, URGENCES } from './store';
import { ACCOMPAGNEMENTS } from '@/domain/accompagnements';
import { ContactReferent } from '@/ui/ContactReferent';
import { Champ, Selecteur, TexteInput, NombreInput, Bascule, EncadreBleu, EncadreVigilance } from '@/ui/fields';

const NUMEROS = [
  ['115', 'hébergement'], ['119', 'enfance en danger'], ['3919', 'violences femmes'],
  ['116 006', 'France Victimes'], ['3114', 'prévention suicide'], ['15', 'SAMU'], ['17', 'police'],
];

export function Step1Accueil() {
  const { state, set } = useWizard();
  const urgenceActive = Object.values(state.urgences).some(Boolean);
  const [urgOuvert, setUrgOuvert] = useState<boolean>(() => urgenceActive);

  return (
    <div>
      <h2 className="mb-3 text-xl font-bold">Étape 1 — Accueil, urgences, consentement</h2>

      <section className="mb-6 overflow-hidden rounded-xl border border-marine/15">
        <button
          type="button"
          onClick={() => setUrgOuvert((v) => !v)}
          aria-expanded={urgOuvert}
          className="flex w-full items-center gap-3 bg-white px-4 py-4 text-left hover:bg-lave-bleu"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lave-dore text-xl"
          >
            🛟
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold">Y a-t-il une urgence à traiter ?</span>
            <span className="block text-sm text-marine/60">
              À repérer en premier — cliquer pour ouvrir
            </span>
          </span>
          {urgenceActive && (
            <span className="rounded-full bg-lave-dore px-3 py-1 text-sm font-semibold text-marine">
              Urgence repérée
            </span>
          )}
          <span aria-hidden className={`text-xl transition-transform ${urgOuvert ? 'rotate-180' : ''}`}>⌄</span>
        </button>

        {urgOuvert && (
          <div className="space-y-3 border-t border-marine/10 bg-white p-4">
            <ContactReferent />

            <div className="flex flex-wrap gap-2 text-sm">
              {NUMEROS.map(([n, l]) => (
                <span key={n} className="rounded border border-marine/15 bg-lave-bleu px-2 py-1">
                  <strong>{n}</strong> · {l}
                </span>
              ))}
            </div>

            <div>
              <div className="mb-1 font-semibold">Cocher si la situation est présente :</div>
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
            </div>

            {urgenceActive && (
              <EncadreBleu>
                Traiter l’urgence d’abord. Le diagnostic peut se poursuivre en mode « urgence traitée ».
              </EncadreBleu>
            )}
          </div>
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
        <Champ
          label="Niveau d’accompagnement"
          pourquoi="Palette des accompagnements (scénario 2 — accueil transversal). Orienter selon le niveau requis protège aussi l’écrivain public, dont le rôle n’est pas de se substituer à un travailleur social."
        >
          {() => {
            const a = ACCOMPAGNEMENTS.find((x) => x.value === state.mode_contact);
            return (
              <>
                <Selecteur
                  value={state.mode_contact}
                  onChange={(mode_contact) => set({ mode_contact })}
                  options={ACCOMPAGNEMENTS.map((x) => ({ value: x.value, label: x.label }))}
                />
                {a && (
                  <div className="mt-2 rounded-lg border-l-4 border-teal bg-lave-bleu p-3 text-sm">
                    <div>{a.ce_que_cest}</div>
                    <div className="mt-1 text-marine/60">
                      <strong>Qui :</strong> {a.qui}
                    </div>
                  </div>
                )}
              </>
            );
          }}
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
