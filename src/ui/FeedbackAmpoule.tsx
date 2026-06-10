// Ampoule de retour (phase alpha) — bouton flottant en bas à droite.
// Permet de laisser un commentaire ou de « proposer une modification » sur
// l'écran en cours, avec un alias facultatif. Les retours sont enregistrés
// localement (localStorage) tant que la synchronisation H/IA n'est pas câblée.

import { useEffect, useRef, useState } from 'react';

type Retour = {
  date: string;
  page: string;
  type: 'commentaire' | 'modification';
  alias: string;
  message: string;
};

const CLE = 'radar:feedback';

function enregistrer(r: Retour) {
  try {
    const liste: Retour[] = JSON.parse(localStorage.getItem(CLE) || '[]');
    liste.push(r);
    localStorage.setItem(CLE, JSON.stringify(liste));
  } catch {
    /* stockage indisponible — on ignore silencieusement */
  }
}

export function FeedbackAmpoule() {
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<'commentaire' | 'modification'>('commentaire');
  const [alias, setAlias] = useState('');
  const [message, setMessage] = useState('');
  const [envoye, setEnvoye] = useState(false);
  // Masquée près du bas de page pour ne pas recouvrir la navigation du wizard
  // (boutons Précédent / Suivant, situés en bas du contenu).
  const [enBas, setEnBas] = useState(false);
  const champRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ouvert) champRef.current?.focus();
  }, [ouvert]);

  useEffect(() => {
    const onScroll = () => {
      const reste =
        document.documentElement.scrollHeight - (window.innerHeight + window.scrollY);
      setEnBas(reste < 150);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  function envoyer() {
    if (!message.trim()) return;
    enregistrer({
      date: new Date().toISOString(),
      page: window.location.hash || '/',
      type,
      alias: alias.trim(),
      message: message.trim(),
    });
    setEnvoye(true);
    setMessage('');
    setTimeout(() => {
      setEnvoye(false);
      setOuvert(false);
    }, 2200);
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end print:hidden">
      {ouvert && (
        <div
          role="dialog"
          aria-label="Laisser un retour"
          className="mb-3 w-[min(92vw,22rem)] rounded-2xl border border-marine/15 bg-white p-4 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-bold">Votre avis · phase alpha</h2>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setOuvert(false)}
              className="h-8 w-8 rounded-full text-marine/60 hover:bg-lave-bleu"
            >
              ✕
            </button>
          </div>

          {envoye ? (
            <p className="rounded-lg bg-lave-bleu p-3 text-sm">
              Merci ! Votre retour est enregistré. Il aide à améliorer l’outil pendant le test.
            </p>
          ) : (
            <>
              <div className="mb-3 flex gap-2" role="radiogroup" aria-label="Type de retour">
                {([
                  ['commentaire', 'Commentaire'],
                  ['modification', 'Proposer une modification'],
                ] as const).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={type === v}
                    onClick={() => setType(v)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      type === v ? 'border-teal bg-teal text-white' : 'border-marine/20 bg-white text-marine'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <label className="mb-1 block text-sm font-semibold" htmlFor="fb-alias">
                Votre nom ou un alias <span className="font-normal text-marine/50">(facultatif)</span>
              </label>
              <input
                id="fb-alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="ex. Bénévole du mardi"
                className="mb-3 w-full rounded-lg border border-marine/30 px-3 py-2 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40"
              />

              <label className="mb-1 block text-sm font-semibold" htmlFor="fb-msg">
                {type === 'modification' ? 'Que faudrait-il changer ?' : 'Votre commentaire'}
              </label>
              <textarea
                id="fb-msg"
                ref={champRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={
                  type === 'modification'
                    ? 'Décrivez la modification proposée sur cet écran…'
                    : 'Ce qui va, ce qui coince, une idée…'
                }
                className="mb-3 w-full rounded-lg border border-marine/30 px-3 py-2 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40"
              />

              <p className="mb-3 text-xs text-marine/50">
                Écran concerné : <code>{window.location.hash || '/'}</code> — enregistré localement
                pour cette phase de test.
              </p>

              <button
                type="button"
                onClick={envoyer}
                disabled={!message.trim()}
                className="w-full rounded-lg bg-teal px-4 py-3 text-base font-semibold text-white disabled:opacity-40"
              >
                Envoyer mon retour
              </button>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-label="Donner un avis ou proposer une modification"
        aria-expanded={ouvert}
        className={`ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal text-lg text-white shadow-lg transition hover:scale-105 hover:opacity-100 focus-visible:opacity-100 ${
          ouvert ? 'opacity-100' : enBas ? 'pointer-events-none opacity-0' : 'opacity-50'
        }`}
      >
        <span aria-hidden>💡</span>
      </button>
    </div>
  );
}
