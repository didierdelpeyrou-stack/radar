import { useState } from 'react';
import { useDetection } from './useDetection';
import type { Determinant, ResultatDetection, Verdict } from '@/engine/model';

const DETERMINANTS: { id: Determinant | 'tous'; label: string }[] = [
  { id: 'tous', label: 'Tous' }, { id: 'sante', label: 'Santé' }, { id: 'logement', label: 'Logement' },
  { id: 'energie', label: 'Énergie' }, { id: 'solidarite', label: 'Solidarité-ressources' },
  { id: 'vie_sociale', label: 'Vie sociale' }, { id: 'transport', label: 'Transport' }, { id: 'handicap', label: 'Handicap' },
];

const COLONNES: { titre: string; verdicts: Verdict[]; classe: string; emoji: string }[] = [
  { titre: 'Éligible probable', verdicts: ['eligible_probable'], classe: 'border-teal', emoji: '✅' },
  { titre: 'À vérifier / déjà en place', verdicts: ['a_verifier', 'deja_percu'], classe: 'border-dore', emoji: '🟡' },
  { titre: 'Non éligible (et pourquoi)', verdicts: ['non_eligible'], classe: 'border-marine', emoji: '❌' },
];

function Carte({ r }: { r: ResultatDetection }) {
  return (
    <li className="mb-2 rounded-lg border bg-white p-3 text-sm shadow-sm">
      <div className="flex justify-between gap-2">
        <span className="font-semibold">{r.nom}</span>
        <span className="shrink-0 text-teal">{r.organisme}</span>
      </div>
      {r.montant_estime && <div className="mt-1 text-marine/80">{r.montant_estime}</div>}
      {r.raison && <div className="mt-1 italic text-marine/60">{r.raison}</div>}
      {r.question && <div className="mt-1 text-corail">❓ {r.question}</div>}
    </li>
  );
}

export function Step4Detection() {
  const res = useDetection();
  const [filtre, setFiltre] = useState<Determinant | 'tous'>('tous');
  const filtres = filtre === 'tous' ? res : res.filter((r) => r.determinant === filtre);

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold">Étape 4 — Détection locale automatique</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {DETERMINANTS.map((dd) => (
          <button key={dd.id} onClick={() => setFiltre(dd.id)}
            className={`rounded-full border px-3 py-1 text-sm ${filtre === dd.id ? 'border-teal bg-teal text-white' : 'border-marine/20 bg-white'}`}>
            {dd.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {COLONNES.map((col) => {
          const items = filtres.filter((r) => col.verdicts.includes(r.verdict));
          return (
            <section key={col.titre} className={`rounded-xl border-t-4 bg-lave-bleu p-3 ${col.classe}`}>
              <h3 className="mb-3 font-semibold">{col.emoji} {col.titre} <span className="text-marine/50">({items.length})</span></h3>
              <ul>{items.map((r) => <Carte key={r.dispositif_id} r={r} />)}</ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
