import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { WizardProvider } from '@/wizard/store';
import { Wizard } from '@/wizard/Wizard';
import { getDossier, majDossier, supprimerDossier } from '@/lib/dossiers';
import { useSession } from '@/lib/session';
import { EncadreBleu } from '@/ui/fields';

const MOTIFS = [
  ['sortie_autonomie', 'Sortie vers autonomie'],
  ['reorientation', 'Réorientation'],
  ['injoignable', 'Injoignable'],
  ['demenagement', 'Déménagement'],
  ['autre', 'Autre'],
];

export function DossierScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const { session } = useSession();
  const dossier = id ? getDossier(id) : undefined;
  const [ouvertCloture, setOuvertCloture] = useState(false);
  const [motif, setMotif] = useState('sortie_autonomie');
  const [synthese, setSynthese] = useState('');

  if (!dossier) return <Navigate to="/" replace />;

  function exporter() {
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dossier!.ref}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function supprimer() {
    if (session?.role !== 'admin') {
      alert('Seul un administrateur peut supprimer un dossier.');
      return;
    }
    if (!confirm(`Supprimer définitivement ${dossier!.ref} ?`)) return;
    if (!confirm('Cette action est irréversible. Confirmer la suppression ?')) return;
    supprimerDossier(dossier!.id);
    nav('/');
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <button onClick={() => nav('/')} className="text-sm text-teal underline">← Tableau de bord</button>
          <h1 className="text-xl font-bold">{dossier.ref}{dossier.statut === 'clos' && ' · clos'}</h1>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={exporter} className="rounded-lg border border-marine/30 px-3 py-1">Exporter (JSON)</button>
          <button onClick={() => setOuvertCloture((v) => !v)} className="rounded-lg border border-marine/30 px-3 py-1">Clôturer</button>
          <button onClick={supprimer} className="rounded-lg border border-corail px-3 py-1 text-corail">Supprimer</button>
        </div>
      </div>

      {ouvertCloture && (
        <div className="mb-4 rounded-xl border border-marine/15 bg-white p-4">
          <h2 className="mb-2 font-bold">Clôture du dossier</h2>
          <select value={motif} onChange={(e) => setMotif(e.target.value)} className="mb-2 w-full rounded-lg border border-marine/30 px-3 py-2">
            {MOTIFS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <textarea value={synthese} onChange={(e) => setSynthese(e.target.value)} placeholder="Synthèse de clôture…" className="mb-2 w-full rounded-lg border border-marine/30 px-3 py-2" rows={3} />
          <EncadreBleu>À J+24 mois après la dernière intervention, les identifiants seront anonymisés automatiquement (cron Supabase).</EncadreBleu>
          <button
            onClick={() => { majDossier(dossier.id, { statut: 'clos', motif_cloture: motif, synthese_cloture: synthese }); setOuvertCloture(false); }}
            className="rounded-lg bg-marine px-4 py-2 text-white">
            Confirmer la clôture
          </button>
        </div>
      )}

      <WizardProvider dossierId={dossier.id}>
        <Wizard />
      </WizardProvider>
    </div>
  );
}
