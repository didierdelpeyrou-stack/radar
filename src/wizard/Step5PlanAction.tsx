import { useState } from 'react';
import { useWizard } from './store';
import { useDetection } from './useDetection';
import { trierPlan } from './priorite';
import { piecesPour } from './pjMap';
import { EncadreBleu, EncadreVigilance, Bascule } from '@/ui/fields';
import { NonRecoursBanner } from '@/ui/NonRecoursBanner';

export function Step5PlanAction() {
  const { state } = useWizard();
  const res = useDetection();
  const enOrdre = res.filter((r) => r.verdict === 'deja_percu');
  const aDemander = trierPlan(res.filter((r) => r.verdict === 'eligible_probable'));
  const horsChamp = res.filter((r) => r.verdict === 'non_eligible');

  // Anti-surcharge : 3 premières démarches développées, le reste replié (§ étape 5).
  const [tout, setTout] = useState(false);
  const [engages, setEngages] = useState<Record<string, boolean>>({});
  const visibles = tout ? aDemander : aDemander.slice(0, 3);

  const [pdfEtat, setPdfEtat] = useState('');
  async function pdf() {
    setPdfEtat('génération…');
    try {
      // Chargement à la demande : @react-pdf/renderer est lourd, hors bundle initial.
      const { genererFichePdf } = await import('@/pdf/FicheRecapitulative');
      await genererFichePdf(state, res);
      setPdfEtat('PDF généré ✓');
    } catch (e) {
      setPdfEtat('erreur PDF : ' + (e as Error).message);
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
            checked={!!engages[r.dispositif_id]} onChange={(v) => setEngages((s) => ({ ...s, [r.dispositif_id]: v }))} />
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

      <div className="mt-4 flex items-center gap-3">
        <button onClick={pdf} className="rounded-lg bg-marine px-5 py-2 text-white">
          Générer la fiche récapitulative (PDF)
        </button>
        <span className="text-sm text-marine/70">{pdfEtat}</span>
      </div>
    </div>
  );
}
