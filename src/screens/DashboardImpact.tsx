import { useDossiers } from '@/lib/useDossiers';
import { construireProfil } from '@/engine/profil';
import { detecter } from '@/engine/engine';
import { DISPOSITIFS } from '@/domain/catalogue';
import { syntheseNonRecours, euros } from '@/lib/nudges';

function Stat({ label, valeur, accent }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? 'bg-teal text-white' : 'bg-white'}`}>
      <div className="text-3xl font-bold">{valeur}</div>
      <div className={`text-sm ${accent ? 'text-white/80' : 'text-marine/60'}`}>{label}</div>
    </div>
  );
}

export function DashboardImpact() {
  const dossiers = useDossiers();
  const actifs = dossiers.filter((d) => d.statut === 'actif');

  let totalNonRecours = 0;
  let eligibles = 0;
  const parProfil: Record<string, number> = {};
  for (const d of actifs) {
    parProfil[d.profil_type || 'non_renseigné'] = (parProfil[d.profil_type || 'non_renseigné'] || 0) + 1;
    try {
      const res = detecter(DISPOSITIFS, construireProfil(d.wizard.diagnostic, { asOf: '2026-06-10', ageDemandeur: d.wizard.ageDemandeur || undefined }));
      const s = syntheseNonRecours(res);
      totalNonRecours += s.totalAnnuel;
      eligibles += s.nbEligibles;
    } catch { /* */ }
  }
  const flash = dossiers.filter((d) => d.origine === 'flash').length;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Dashboard impact</h1>
      <p className="mb-5 text-sm text-marine/60">
        Indicateurs <strong>anonymisés</strong> (aucun identifiant) — compatibles reporting FSU / im-prove / Optimy.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="File active (dossiers ouverts)" valeur={String(actifs.length)} />
        <Stat label="Droits détectés à activer" valeur={String(eligibles)} />
        <Stat label="Montant annualisé détecté" valeur={euros(totalNonRecours)} accent />
        <Stat label="Détections flash (tiers-lieu)" valeur={String(flash)} />
      </div>

      <h2 className="mb-2 mt-6 font-bold">Profils-type</h2>
      <ul className="space-y-1">
        {Object.entries(parProfil).map(([k, v]) => (
          <li key={k} className="flex justify-between rounded-lg bg-white px-3 py-2">
            <span>{k}</span><span className="font-semibold">{v}</span>
          </li>
        ))}
        {actifs.length === 0 && <li className="text-marine/60">Aucun dossier — créez-en pour alimenter les indicateurs.</li>}
      </ul>

      <p className="mt-6 text-xs text-marine/50">
        Export CSV anonymisé et vue matérialisée <code>indicateurs_mensuels</code> côté Postgres
        (voir <code>supabase/migrations/0001_init.sql</code>) une fois la base H/IA connectée.
      </p>
    </div>
  );
}
