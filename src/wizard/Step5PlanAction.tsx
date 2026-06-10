import { useState } from 'react';
import { useWizard } from './store';
import type { PlanItem } from './store';
import { useDetection } from './useDetection';
import { trierPlan } from './priorite';
import { piecesPour } from './pjMap';
import { ajouterRdv } from '@/lib/dossiers';
import { genererResumeFalc } from '@/lib/falc';
import { EncadreBleu, EncadreVigilance, Bascule, Champ } from '@/ui/fields';
import { NonRecoursBanner } from '@/ui/NonRecoursBanner';

export function Step5PlanAction() {
  const { state, set, dossierId } = useWizard();
  const res = useDetection();
  const enOrdre = res.filter((r) => r.verdict === 'deja_percu');
  const aDemander = trierPlan(res.filter((r) => r.verdict === 'eligible_probable'));
  const horsChamp = res.filter((r) => r.verdict === 'non_eligible');

  // Anti-surcharge : 3 premières démarches développées, le reste replié (§ étape 5).
  const [tout, setTout] = useState(false);
  const visibles = tout ? aDemander : aDemander.slice(0, 3);

  // Verrou J+2 n°2 (concertation 11/06/2026) : le choix de la personne est
  // PERSISTÉ dans state.plan (souhaite_engager, statut 'EC'), plus jamais dans
  // un useState local perdu à la fermeture de l'écran.
  const engage = (id: string) => state.plan.find((p) => p.dispositif_id === id)?.souhaite_engager ?? false;
  function basculerEngagement(dispositif_id: string, nom: string, priorite: number, v: boolean) {
    const existant = state.plan.find((p) => p.dispositif_id === dispositif_id);
    let plan: PlanItem[];
    if (existant) {
      plan = state.plan.map((p) => (p.dispositif_id === dispositif_id ? { ...p, souhaite_engager: v } : p));
    } else {
      plan = [...state.plan, { dispositif_id, nom, priorite, souhaite_engager: v, qui_fait_quoi: '', echeance: '', statut: 'EC' }];
    }
    set({ plan });
  }

  // « Ne jamais laisser une situation ouverte sans rendez-vous de suivi » :
  // le RDV se prend ici, pas sur une note volante.
  const [rdvQuand, setRdvQuand] = useState('');
  const [rdvEtat, setRdvEtat] = useState('');
  function enregistrerRdv() {
    if (!rdvQuand) return;
    ajouterRdv(dossierId, {
      date: new Date(rdvQuand).toISOString(),
      duree_min: 45,
      contenu: 'RDV de suivi du plan d’action (étape 5).',
      prochaine_etape: 'Point sur les démarches engagées.',
    });
    setRdvEtat(`RDV de suivi enregistré : ${new Date(rdvQuand).toLocaleString('fr-FR')} ✓`);
  }

  const [pdfEtat, setPdfEtat] = useState('');
  // Fiche récapitulative AVEC ou SANS résumé IA (au choix de l'accompagnant).
  // Avec IA : Gemma (serveur H/IA souverain) rédige un résumé FALC, affiché pour
  // RELECTURE OBLIGATOIRE avant d'être inclus dans le PDF. Sans IA : PDF direct.
  const [falcTexte, setFalcTexte] = useState('');
  const [falcEtat, setFalcEtat] = useState<'idle' | 'gen' | 'pret' | 'err'>('idle');
  const [falcErreur, setFalcErreur] = useState('');

  async function pdf(resumeFalc?: string) {
    setPdfEtat('génération…');
    try {
      // Chargement à la demande : @react-pdf/renderer est lourd, hors bundle initial.
      const { genererFichePdf } = await import('@/pdf/FicheRecapitulative');
      await genererFichePdf(state, res, rdvQuand || undefined, resumeFalc);
      setPdfEtat('PDF généré ✓');
    } catch (e) {
      setPdfEtat('erreur PDF : ' + (e as Error).message);
    }
  }

  async function preparerAvecIA() {
    setFalcEtat('gen');
    setFalcErreur('');
    setFalcTexte('');
    try {
      const droits = aDemander.map((r) => `${r.nom}${r.montant_estime ? ` : ${r.montant_estime}` : ''}`);
      const engages = state.plan.filter((p) => p.souhaite_engager).map((p) => p.nom);
      await genererResumeFalc(
        {
          situation: [
            state.ageDemandeur ? `${state.ageDemandeur} ans` : null,
            state.diagnostic.bloc1.vie === 'couple' ? 'en couple' : 'seul·e',
            state.diagnostic.bloc1.enfants.length ? `${state.diagnostic.bloc1.enfants.length} enfant(s)` : null,
          ].filter(Boolean).join(', '),
          droits,
          prochaines_etapes: engages.length
            ? [`Engager les démarches choisies : ${engages.join(', ')}`]
            : ['Prendre rendez-vous pour monter les dossiers avec un chargé d’accès aux droits'],
        },
        setFalcTexte,
      );
      setFalcEtat('pret');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'erreur';
      setFalcErreur(m === 'Failed to fetch' || m === 'Load failed' ? 'backend IA injoignable' : m);
      setFalcEtat('err');
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold">Étape 5 — Restitution & plan d’action</h2>
      <NonRecoursBanner res={res} />
      <EncadreVigilance>
        Estimation indicative — seules les administrations ouvrent les droits.
        <strong> C’est la personne qui choisit</strong> ce qu’elle engage (rien n’est pré-coché).
      </EncadreVigilance>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl bg-lave-bleu p-3">
          <h3 className="mb-2 font-semibold">✅ Ce qui est en ordre</h3>
          <ul className="text-sm">{enOrdre.map((r) => <li key={r.dispositif_id}>{r.nom}</li>)}</ul>
        </section>
        <section className="rounded-xl bg-lave-dore p-3">
          <h3 className="mb-2 font-semibold">➕ Ce qu’on peut demander</h3>
          <ul className="text-sm">{aDemander.map((r) => <li key={r.dispositif_id}>{r.nom}</li>)}</ul>
        </section>
        <section className="rounded-xl bg-white p-3">
          <h3 className="mb-2 font-semibold">❌ Hors champ (et pourquoi)</h3>
          <ul className="text-sm">{horsChamp.map((r) => <li key={r.dispositif_id}>{r.nom} — <span className="italic text-marine/60">{r.raison}</span></li>)}</ul>
        </section>
      </div>

      <h3 className="mb-2 mt-6 font-bold">Plan d’action priorisé</h3>
      {visibles.map((r, i) => (
        <div key={r.dispositif_id} className="mb-3 rounded-xl border border-marine/15 bg-white p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{i + 1}. {r.nom}</span>
            {r.montant_estime && <span className="text-sm text-teal">{r.montant_estime}</span>}
          </div>
          <Bascule label="La personne souhaite engager cette démarche"
            checked={engage(r.dispositif_id)} onChange={(v) => basculerEngagement(r.dispositif_id, r.nom, i + 1, v)} />
          {piecesPour(r.dispositif_id).length > 0 && (
            <details className="mt-1 text-sm">
              <summary className="cursor-pointer text-teal">Pièces justificatives à préparer</summary>
              <ul className="ml-5 list-disc">{piecesPour(r.dispositif_id).map((p, j) => <li key={j}>{p}</li>)}</ul>
            </details>
          )}
        </div>
      ))}
      {aDemander.length > 3 && (
        <button className="rounded-lg border border-teal px-3 py-1 text-teal" onClick={() => setTout((v) => !v)}>
          {tout ? 'Replier' : `À voir au prochain rendez-vous (${aDemander.length - 3})`}
        </button>
      )}

      <EncadreBleu>Ne jamais laisser une situation ouverte sans rendez-vous de suivi.</EncadreBleu>

      <div className="mt-3 rounded-xl border border-teal bg-white p-3">
        <h3 className="mb-1 font-semibold">Prochain rendez-vous de suivi</h3>
        <div className="flex flex-wrap items-end gap-3">
          <Champ label="Date et heure">
            {(id) => (
              <input id={id} type="datetime-local" value={rdvQuand} onChange={(e) => setRdvQuand(e.target.value)}
                className="rounded-lg border border-marine/30 px-3 py-2" />
            )}
          </Champ>
          <button onClick={enregistrerRdv} disabled={!rdvQuand}
            className="rounded-lg bg-teal px-4 py-2 font-semibold text-white disabled:opacity-40">
            Enregistrer le RDV
          </button>
          <span className="text-sm text-marine/70">{rdvEtat}</span>
        </div>
      </div>

      <h3 className="mb-2 mt-6 font-bold">Fiche récapitulative</h3>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => pdf()} className="rounded-lg bg-marine px-5 py-2 text-white">
          Générer le PDF (sans IA)
        </button>
        <button onClick={preparerAvecIA} disabled={falcEtat === 'gen'}
          className="rounded-lg border-2 border-teal bg-white px-5 py-2 font-semibold text-teal disabled:opacity-50">
          {falcEtat === 'gen' ? 'Rédaction IA en cours… (~30-60 s)' : 'Préparer avec résumé IA (Gemma, souverain)'}
        </button>
        <span className="text-sm text-marine/70">{pdfEtat}</span>
      </div>

      {falcEtat === 'err' && (
        <p className="mt-2 rounded-lg bg-lave-corail p-3 text-sm">
          Échec du résumé IA : {falcErreur}. Vous pouvez générer le PDF sans IA.
        </p>
      )}

      {(falcEtat === 'pret' || (falcEtat === 'gen' && falcTexte)) && (
        <div className="mt-3 rounded-xl border border-teal bg-white p-3">
          <label className="mb-1 block text-sm font-semibold" htmlFor="falc-step5">
            Résumé en langage clair — RELISEZ et corrigez avant d’inclure au PDF (l’IA reformule, elle ne décide aucun droit)
          </label>
          <textarea id="falc-step5" value={falcTexte} onChange={(e) => setFalcTexte(e.target.value)} rows={7}
            className="w-full rounded-lg border border-marine/30 px-3 py-2 text-base focus:border-teal focus:outline-none" />
          <button onClick={() => pdf(falcTexte.trim() || undefined)} disabled={falcEtat !== 'pret' || !falcTexte.trim()}
            className="mt-2 rounded-lg bg-teal px-5 py-2 font-semibold text-white disabled:opacity-40">
            Générer le PDF avec ce résumé
          </button>
        </div>
      )}
    </div>
  );
}
