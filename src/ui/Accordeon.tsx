// Accordéon « un bloc à la fois » pour le diagnostic (§5 — illectronisme, RGAA).
// Un seul thème ouvert à l'écran : l'entretien reste focalisé sur les réponses
// de la personne, sans mur de champs. Gros titres, pastilles de progression,
// navigation clavier (les en-têtes sont de vrais <button> avec aria-expanded).

import { createContext, useContext, useState, type ReactNode } from 'react';

type Ctx = {
  ouvert: number;
  vus: Set<number>;
  total: number;
  ouvrir: (n: number) => void;
};
const AccordeonCtx = createContext<Ctx | null>(null);

export function Accordeon({ total, children }: { total: number; children: ReactNode }) {
  const [ouvert, setOuvert] = useState(0);
  const [vus, setVus] = useState<Set<number>>(() => new Set([0]));
  const ouvrir = (n: number) => {
    setOuvert(n);
    if (n >= 0) setVus((s) => new Set(s).add(n));
  };
  return (
    <AccordeonCtx.Provider value={{ ouvert, vus, total, ouvrir }}>
      <div className="space-y-3">{children}</div>
    </AccordeonCtx.Provider>
  );
}

export function BlocPliable({
  n,
  titre,
  children,
}: {
  n: number;
  titre: string;
  children: ReactNode;
}) {
  const ctx = useContext(AccordeonCtx);
  if (!ctx) throw new Error('BlocPliable doit être dans <Accordeon>');
  const actif = ctx.ouvert === n;
  const vu = ctx.vus.has(n) && !actif;
  const dernier = n + 1 >= ctx.total;

  return (
    <section className={`overflow-hidden rounded-xl border ${actif ? 'border-teal shadow-sm' : 'border-marine/15'}`}>
      <h3 className="m-0">
        <button
          type="button"
          onClick={() => ctx.ouvrir(actif ? -1 : n)}
          aria-expanded={actif}
          className={`flex w-full items-center gap-4 px-4 py-4 text-left transition-colors ${
            actif ? 'bg-teal text-white' : 'bg-white hover:bg-lave-bleu'
          }`}
        >
          <span
            aria-hidden
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
              actif ? 'bg-white text-teal' : vu ? 'bg-teal text-white' : 'bg-marine/10 text-marine/60'
            }`}
          >
            {vu ? '✓' : n + 1}
          </span>
          <span className="flex-1 text-lg font-bold">{titre}</span>
          <span aria-hidden className={`text-xl transition-transform ${actif ? 'rotate-180' : ''}`}>⌄</span>
        </button>
      </h3>

      {actif && (
        <div className="border-t border-marine/10 bg-white p-5">
          {children}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => ctx.ouvrir(dernier ? -1 : n + 1)}
              className="rounded-lg bg-teal px-6 py-3 text-base font-semibold text-white hover:bg-teal/90"
            >
              {dernier ? 'Terminer les blocs ✓' : 'Bloc suivant →'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
