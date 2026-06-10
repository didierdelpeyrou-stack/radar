// Résumé en langage clair (FALC) de la fiche récapitulative, rédigé par l'IA
// SOUVERAINE (Gemma, sur le serveur H/IA en France) à partir des droits détectés
// par le moteur déterministe. L'IA REFORMULE, elle ne décide aucun droit (§3).
// Option d'envoi par SMS (fournisseur « à connecter » côté backend).
//
// Garde-fous : relecture humaine obligatoire (texte éditable), consentement
// explicite pour le SMS, et avertissement RGPD (Twilio = hors UE).

import { useMemo, useState } from 'react';
import { construireProfil } from '@/engine/profil';
import { detecter } from '@/engine/engine';
import { DISPOSITIFS } from '@/domain/catalogue';
import { aujourdHui } from '@/lib/dates';
import { genererResumeFalc } from '@/lib/falc';
import type { Dossier } from '@/lib/dossiers';

// Same-origin : Caddy (prod) ou proxy Vite (dev) routent /api/* vers le backend IA.
const BACKEND = '';

export function ResumeFALC({ dossier }: { dossier: Dossier }) {
  const diag = dossier.wizard.diagnostic;
  const age = dossier.wizard.ageDemandeur || undefined;

  const eligibles = useMemo(() => {
    try {
      return detecter(DISPOSITIFS, construireProfil(diag, { asOf: aujourdHui(), ageDemandeur: age })).filter(
        (r) => r.verdict === 'eligible_probable',
      );
    } catch {
      return [];
    }
  }, [diag, age]);

  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState('');
  const [etat, setEtat] = useState<'idle' | 'gen' | 'ok' | 'err'>('idle');
  const [erreur, setErreur] = useState('');

  const [consent, setConsent] = useState(false);
  const [tel, setTel] = useState('');
  const [sms, setSms] = useState<{ etat: 'idle' | 'send' | 'ok' | 'err'; msg: string }>({ etat: 'idle', msg: '' });

  function situation(): string {
    return [
      age ? `${age} ans` : null,
      diag.bloc1.vie === 'couple' ? 'en couple' : 'seul·e',
      diag.bloc1.enfants.length ? `${diag.bloc1.enfants.length} enfant(s)` : null,
      `logement : ${diag.bloc4.statut}`,
    ]
      .filter(Boolean)
      .join(', ');
  }

  async function generer() {
    setEtat('gen');
    setErreur('');
    setTexte('');
    try {
      // Streaming SSE via le client partagé : le texte s'affiche au fil de la génération.
      await genererResumeFalc(
        {
          situation: situation(),
          droits: eligibles.map((e) => `${e.nom}${e.montant_estime ? ` : ${e.montant_estime}` : ''}`),
          prochaines_etapes: ['Prendre rendez-vous pour monter les dossiers avec un chargé d’accès aux droits'],
        },
        setTexte,
      );
      setEtat('ok');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'erreur';
      setErreur(m === 'Failed to fetch' || m === 'Load failed' ? 'backend IA injoignable' : m);
      setEtat('err');
    }
  }

  async function envoyerSms() {
    setSms({ etat: 'send', msg: '' });
    try {
      const resp = await fetch(`${BACKEND}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone: tel.trim(), message: texte }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.detail || 'HTTP ' + resp.status);
      setSms({ etat: 'ok', msg: 'SMS envoyé.' });
    } catch (e) {
      setSms({ etat: 'err', msg: e instanceof Error ? e.message : 'échec' });
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-marine/15">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="flex w-full items-center gap-3 bg-white px-4 py-4 text-left hover:bg-lave-bleu"
      >
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lave-bleu text-xl">📝</span>
        <span className="flex-1">
          <span className="block text-lg font-bold">Résumé en langage clair (IA locale souveraine)</span>
          <span className="block text-sm text-marine/60">
            Rédigé par Gemma sur le serveur H/IA (France) — à relire avant de le remettre
          </span>
        </span>
        <span aria-hidden className={`text-xl transition-transform ${ouvert ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {ouvert && (
        <div className="space-y-3 border-t border-marine/10 bg-white p-4">
          {eligibles.length === 0 ? (
            <p className="rounded-lg bg-lave-dore p-3 text-sm">
              ⚠️ Aucun droit détecté pour le moment — renseignez le diagnostic (étape 2) avant de générer un résumé.
            </p>
          ) : (
            <button
              type="button"
              onClick={generer}
              disabled={etat === 'gen'}
              className="rounded-lg bg-teal px-5 py-3 text-base font-semibold text-white disabled:opacity-50"
            >
              {etat === 'gen' ? 'Rédaction en cours… (~30-60 s, IA locale)' : 'Générer le résumé'}
            </button>
          )}

          {etat === 'err' && <p className="rounded-lg bg-lave-corail p-3 text-sm">Échec : {erreur}.</p>}

          {(etat === 'ok' || texte) && (
            <>
              <label className="mt-2 block text-sm font-semibold" htmlFor="falc">
                Texte (modifiable — relisez avant de le remettre à la personne)
              </label>
              <textarea
                id="falc"
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-marine/30 px-3 py-2 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40"
              />

              <div className="rounded-lg border-l-4 border-dore bg-lave-dore p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                  <span>
                    La personne <strong>accepte</strong> de recevoir ce résumé par SMS.
                    <span className="mt-1 block text-xs text-marine/60">
                      ⚠️ L’envoi SMS passe aujourd’hui par <strong>Twilio (hors UE)</strong> tant qu’une passerelle
                      souveraine UE n’est pas connectée — à activer en connaissance de cause.
                    </span>
                  </span>
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="tel"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="rounded-lg border border-marine/30 px-3 py-2 text-base"
                  />
                  <button
                    type="button"
                    onClick={envoyerSms}
                    disabled={!consent || !tel.trim() || !texte.trim() || sms.etat === 'send'}
                    className="rounded-lg bg-marine px-4 py-2 font-semibold text-white disabled:opacity-40"
                  >
                    {sms.etat === 'send' ? 'Envoi…' : 'Envoyer par SMS'}
                  </button>
                  {sms.msg && (
                    <span className={`text-sm ${sms.etat === 'ok' ? 'text-green' : 'text-corail'}`}>{sms.msg}</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
