import { Link } from 'react-router-dom';
import { useDossiers } from '@/lib/useDossiers';
import { construireProfil } from '@/engine/profil';
import { detecter } from '@/engine/engine';
import { DISPOSITIFS } from '@/domain/catalogue';
import { BILAN_BI1 } from '@/domain/bilan';
import { syntheseNonRecours, euros } from '@/lib/nudges';

function Stat({ label, valeur, accent }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? 'bg-teal text-white' : 'bg-white'}`}>
      <div className="text-3xl font-bold">{valeur}</div>
      <div className={`text-sm ${accent ? 'text-white/80' : 'text-marine/60'}`}>{label}</div>
    </div>
  );
}

function BilanTerrain() {
  const b = BILAN_BI1;
  const maxMentions = Math.max(...b.droits_par_categorie.map((c) => c.mentions));
  const dateFr = new Date(b.arrete_au).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <section className="mt-8 rounded-xl border border-marine/15 bg-lave-bleu p-4">
      <h2 className="text-xl font-bold">Bilan terrain — cumul du dispositif</h2>
      <p className="mb-4 text-sm text-marine/60">
        Données arrêtées au {dateFr}. Source : {b.source}.{' '}
        <Link to="/sources" className="font-semibold text-teal underline">
          Vérifier les sources →
        </Link>
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Diagnostics complets réalisés" valeur={String(b.diagnostics_complets)} />
        <Stat label="Droits repérés à vérifier ou ouvrir" valeur={String(b.droits_reperes)} />
        <Stat label="Diagnostics faisant apparaître ≥ 1 droit" valeur={`${b.part_avec_droit_pct} %`} accent />
        <Stat label="Droits par diagnostic (moyenne)" valeur={b.droits_moyen_par_diag.toLocaleString('fr-FR')} />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-bold text-teal">Droits repérés par domaine</h3>
          <ul className="space-y-2">
            {b.droits_par_categorie.map((c) => (
              <li key={c.categorie} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm">{c.categorie}</span>
                <span className="h-4 flex-1 overflow-hidden rounded-full bg-white">
                  <span
                    className="block h-full rounded-full bg-teal"
                    style={{ width: `${Math.round((c.mentions / maxMentions) * 100)}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right font-semibold">{c.mentions}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 font-bold text-teal">Profil des personnes reçues</h3>
          <ul className="space-y-2">
            {b.public.map((p) => (
              <li key={p.label} className="flex items-baseline gap-3 rounded-lg bg-white px-3 py-2">
                <span className="text-xl font-bold text-teal">{p.valeur}</span>
                <span className="text-sm text-marine/70">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border-l-4 border-dore bg-lave-dore p-4">
        <h3 className="text-lg font-bold">Pouvoir d’achat — la finalité du projet</h3>
        <p className="mt-1 text-marine/80">{b.pouvoir_achat.intro}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-3">
            <div className="text-sm font-semibold text-marine">Ce que les bénéficiaires en attendent</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-marine/80">
              {b.pouvoir_achat.effets_projetes.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-white p-3">
              <span className="text-2xl font-bold text-teal">{b.pouvoir_achat.moins_stresses}</span>
              <span className="ml-2 text-sm text-marine/70">
                bénéficiaires se sentent moins stressés à l’idée de recevoir l’aide identifiée
              </span>
            </div>
            <p className="text-xs text-marine/60">
              Au moment de l’évaluation, {b.pouvoir_achat.aides_obtenues} bénéficiaires avaient déjà
              obtenu une aide : l’effet pouvoir d’achat est surtout <strong>en cours</strong>, du fait
              des délais de traitement des demandes.
            </p>
          </div>
        </div>
      </div>
    </section>
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
  const clos = dossiers.filter((d) => d.statut === 'clos').length;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Dashboard impact</h1>
      <p className="mb-5 text-sm text-marine/60">
        Indicateurs <strong>anonymisés</strong> (aucun identifiant) — compatibles reporting FSU / im-prove / Optimy.
      </p>

      <h2 className="mb-2 font-bold">Indicateurs en temps réel — cet outil</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="File active (dossiers ouverts)" valeur={String(actifs.length)} />
        <Stat label="Droits détectés à activer" valeur={String(eligibles)} />
        <Stat label="Montant annualisé détecté" valeur={euros(totalNonRecours)} accent />
        <Stat label="Dossiers clôturés" valeur={String(clos)} />
      </div>

      <BilanTerrain />

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
