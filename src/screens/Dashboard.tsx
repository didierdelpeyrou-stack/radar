import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/session';
import { useDossiers } from '@/lib/useDossiers';
import { creerDossier } from '@/lib/dossiers';
import { construireProfil } from '@/engine/profil';
import { detecter } from '@/engine/engine';
import { DISPOSITIFS } from '@/domain/catalogue';
import { syntheseNonRecours, euros } from '@/lib/nudges';
import { moisAvantExpirationTitre } from '@/wizard/calculs';
import { EncadreVigilance, EncadreBleu } from '@/ui/fields';

const MOIS = new Date().getMonth(); // 0=jan

export function Dashboard() {
  const { session } = useSession();
  const nav = useNavigate();
  const tous = useDossiers();

  // ep ne voit que ses dossiers ; cad/admin voient tout.
  const dossiers =
    session?.role === 'ep' ? tous.filter((d) => d.accompagnant === session.nom) : tous;
  const actifs = dossiers.filter((d) => d.statut === 'actif');

  // Total non-recours détecté sur l'ensemble des dossiers ouverts (motivation collective).
  let totalNonRecours = 0;
  const alertesTitre: { ref: string; mois: number; id: string }[] = [];
  for (const d of actifs) {
    try {
      const profil = construireProfil(d.wizard.diagnostic, { asOf: '2026-06-10', ageDemandeur: d.wizard.ageDemandeur || undefined });
      const res = detecter(DISPOSITIFS, profil);
      totalNonRecours += syntheseNonRecours(res).totalAnnuel;
    } catch {
      /* dossier incomplet */
    }
    const m = moisAvantExpirationTitre(d.wizard.diagnostic, '2026-06-10');
    if (m !== null && m < 4) alertesTitre.push({ ref: d.ref, mois: m, id: d.id });
  }

  const saisonRentree = MOIS >= 8 && MOIS <= 9; // sept-oct : ARS + bourses

  function nouveau() {
    const d = creerDossier(session!.nom);
    nav(`/dossier/${d.id}`);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes dossiers</h1>
        <button onClick={nouveau} className="rounded-lg bg-corail px-5 py-2 font-semibold text-white shadow">
          + Nouveau diagnostic
        </button>
      </div>

      {totalNonRecours > 0 && (
        <EncadreBleu>
          Sur vos dossiers ouverts, <strong>≈ {euros(totalNonRecours)}/an</strong> de droits ont été
          détectés et restent à activer. Chaque démarche engagée, c’est du non-recours en moins.
        </EncadreBleu>
      )}
      {saisonRentree && (
        <EncadreVigilance>
          Saison rentrée : pensez à l’ARS et aux bourses de collège/lycée (1er sept. – mi-octobre).
        </EncadreVigilance>
      )}
      {alertesTitre.map((a) => (
        <EncadreVigilance key={a.id}>
          {a.ref} — titre de séjour expirant dans {a.mois} mois. Préparer le renouvellement.
        </EncadreVigilance>
      ))}

      {actifs.length === 0 ? (
        <p className="mt-6 text-marine/60">Aucun dossier ouvert. Cliquez sur « Nouveau diagnostic » pour commencer.</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {actifs.map((d) => {
            let total = 0;
            try {
              const profil = construireProfil(d.wizard.diagnostic, { asOf: '2026-06-10', ageDemandeur: d.wizard.ageDemandeur || undefined });
              total = syntheseNonRecours(detecter(DISPOSITIFS, profil)).totalAnnuel;
            } catch { /* */ }
            return (
              <li key={d.id}>
                <button onClick={() => nav(`/dossier/${d.id}`)} className="w-full rounded-xl border border-marine/15 bg-white p-4 text-left shadow-sm hover:border-teal">
                  <div className="flex justify-between">
                    <span className="font-bold">{d.ref}</span>
                    <span className="text-sm text-marine/50">étape {d.wizard.etape}/5</span>
                  </div>
                  <div className="text-sm text-marine/70">
                    {d.wizard.diagnostic.bloc1.vie}, {d.wizard.diagnostic.bloc1.enfants.length} enfant(s) ·{' '}
                    {d.origine === 'flash' ? 'détection flash' : 'diagnostic'}
                  </div>
                  {total > 0 && <div className="mt-1 text-sm font-semibold text-teal">≈ {euros(total)}/an à activer</div>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
