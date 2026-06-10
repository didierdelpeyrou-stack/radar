import { useWizard } from './store';
import { Step1Accueil } from './Step1Accueil';
import { Step2Diagnostic } from './Step2Diagnostic';
import { Step3Simulation } from './Step3Simulation';
import { Step4Detection } from './Step4Detection';
import { Step5PlanAction } from './Step5PlanAction';

const ETAPES = ['Accueil', 'Diagnostic', 'Simulation', 'Détection', 'Plan d’action'];

export function Wizard() {
  const { state, set, reset } = useWizard();
  const e = state.etape;

  return (
    <div>
      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Progression">
        {ETAPES.map((label, i) => {
          const n = i + 1;
          return (
            <li key={label}>
              <button
                onClick={() => set({ etape: n })}
                aria-current={n === e ? 'step' : undefined}
                className={`rounded-full px-3 py-1 text-sm ${n === e ? 'bg-teal text-white' : n < e ? 'bg-teal/20 text-teal' : 'bg-marine/10 text-marine/60'}`}
              >
                {n}. {label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        {e === 1 && <Step1Accueil />}
        {e === 2 && <Step2Diagnostic />}
        {e === 3 && <Step3Simulation />}
        {e === 4 && <Step4Detection />}
        {e === 5 && <Step5PlanAction />}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button disabled={e === 1} onClick={() => set({ etape: e - 1 })}
          className="rounded-lg border border-marine/30 px-4 py-2 disabled:opacity-40">← Précédent</button>
        <button onClick={reset} className="text-sm text-corail underline">Nouveau dossier (effacer)</button>
        <button disabled={e === 5} onClick={() => set({ etape: e + 1 })}
          className="rounded-lg bg-teal px-4 py-2 text-white disabled:opacity-40">Suivant →</button>
      </div>
      <p className="mt-2 text-right text-xs text-marine/50">
        Sauvegarde automatique {state.ephemere ? 'désactivée (session éphémère)' : 'activée'}.
      </p>
    </div>
  );
}
