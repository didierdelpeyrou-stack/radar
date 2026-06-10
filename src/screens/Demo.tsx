import { useMemo, useState } from 'react';
import type { Diagnostic } from '@/domain/types';
import { construireProfil } from '@/engine/profil';
import { detecter } from '@/engine/engine';
import { DISPOSITIFS } from '@/domain/catalogue';
import type { ResultatDetection, Verdict } from '@/engine/model';
import { PERSONAS } from '@/demo/personas';
import { NonRecoursBanner } from '@/ui/NonRecoursBanner';

const COLONNES: { titre: string; verdicts: Verdict[]; classe: string; emoji: string }[] = [
  { titre: 'Ce qu’on peut demander en plus', verdicts: ['eligible_probable'], classe: 'border-teal bg-white', emoji: '✅' },
  { titre: 'Déjà en place / à vérifier', verdicts: ['deja_percu', 'a_verifier'], classe: 'border-dore bg-lave-dore', emoji: '🟡' },
  { titre: 'Ce qui ne vous concerne pas (et pourquoi)', verdicts: ['non_eligible'], classe: 'border-marine bg-lave-bleu', emoji: '❌' },
];

function Carte({ r }: { r: ResultatDetection }) {
  return (
    <li className="mb-2 rounded-lg border bg-white p-3 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{r.nom}</span>
        <span className="shrink-0 text-sm text-teal">{r.organisme}</span>
      </div>
      {r.montant_estime && <div className="mt-1 text-sm text-marine/80">{r.montant_estime}</div>}
      {r.raison && <div className="mt-1 text-sm italic text-marine/60">{r.raison}</div>}
      {r.question && <div className="mt-1 text-sm text-corail">❓ {r.question}</div>}
    </li>
  );
}

export function Demo() {
  const [persona, setPersona] = useState(0);
  const resultats = useMemo(() => {
    const p = PERSONAS[persona];
    const profil = construireProfil(p.diagnostic as Diagnostic, { asOf: '2026-06-10', ageDemandeur: p.age });
    return detecter(DISPOSITIFS, profil);
  }, [persona]);

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Démonstration du moteur — 4 personas (§9)</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {PERSONAS.map((p, i) => (
          <button key={p.nom} onClick={() => setPersona(i)}
            className={`rounded-full border px-4 py-2 text-sm ${i === persona ? 'border-teal bg-teal text-white' : 'border-marine/20 bg-white'}`}>
            {p.nom}
          </button>
        ))}
      </div>
      <NonRecoursBanner res={resultats} />
      <div className="grid gap-4 md:grid-cols-3">
        {COLONNES.map((col) => {
          const items = resultats.filter((r) => col.verdicts.includes(r.verdict));
          return (
            <section key={col.titre} className={`rounded-xl border-t-4 p-3 ${col.classe}`}>
              <h2 className="mb-3 text-base font-semibold">{col.emoji} {col.titre}{' '}
                <span className="text-marine/50">({items.length})</span></h2>
              <ul>{items.map((r) => <Carte key={r.dispositif_id} r={r} />)}</ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
