import { DISPOSITIFS } from '@/domain/catalogue';
import { aujourdHui } from '@/lib/dates';

const ASOF = new Date(aujourdHui());

function moisDepuis(dateIso?: string): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  return (ASOF.getFullYear() - d.getFullYear()) * 12 + (ASOF.getMonth() - d.getMonth());
}

export function AdminReferentiels() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Référentiels — catalogue & règles</h1>
      <p className="mb-4 text-sm text-marine/60">
        Tout paramètre dont la source remonte à plus de 12 mois s’affiche <span className="font-semibold text-corail">en rouge</span> :
        revue annuelle obligatoire (protocole §3). Édition sans redéploiement une fois la base connectée.
      </p>
      <div className="overflow-x-auto rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead className="bg-lave-bleu text-left">
            <tr>
              <th className="p-2">Dispositif</th><th className="p-2">Organisme</th>
              <th className="p-2">Niveau</th><th className="p-2">MDS</th>
              <th className="p-2">Source</th><th className="p-2">Fraîcheur</th>
            </tr>
          </thead>
          <tbody>
            {DISPOSITIFS.map((d) => {
              const m = moisDepuis(d.regle?.date_source);
              const perime = m !== null && m > 12;
              return (
                <tr key={d.id} className="border-t border-marine/10">
                  <td className="p-2 font-semibold">{d.nom}</td>
                  <td className="p-2">{d.organisme}</td>
                  <td className="p-2">{d.niveau}</td>
                  <td className="p-2">{d.couvert_par_mds ? 'oui' : '—'}</td>
                  <td className="p-2 text-marine/70">{d.regle?.source ?? '—'}</td>
                  <td className={`p-2 ${perime ? 'font-bold text-corail' : 'text-marine/60'}`}>
                    {d.regle?.date_source ?? '—'}{perime ? ` · ${m} mois ⚠️` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-marine/50">
        {DISPOSITIFS.length} dispositifs chargés. Mise à jour : éditer <code>src/domain/catalogue.ts</code>,
        relancer <code>npm test</code>, puis <code>npm run seed:sql</code> (voir <code>docs/MAJ_PLAFONDS.md</code>).
      </p>
    </div>
  );
}
