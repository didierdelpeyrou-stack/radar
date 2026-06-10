// État du wizard : consentement, urgences, diagnostic (7 blocs), simulation MDS,
// plan d'action. Autosave local (IndexedDB/localStorage — wifi instable des
// permanences, §5). Mode SESSION ÉPHÉMÈRE : si la personne refuse le recueil
// (case 1), rien n'est persisté (§ étape 1).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Diagnostic } from '@/domain/types';

export interface PlanItem {
  dispositif_id: string;
  nom: string;
  priorite: number;
  souhaite_engager: boolean; // jamais pré-coché (§10 « la personne décide »)
  qui_fait_quoi: string;
  echeance: string;
  statut: 'EC' | 'OK' | 'REF' | 'RC' | 'ATT';
}

export interface SimItem {
  prestation: string;
  statut: 'deja_percue' | 'eligible_non_percue' | 'non_eligible' | '';
  montant: string;
}

export interface WizardState {
  draftId: string;
  ephemere: boolean;
  etape: number; // 1..5
  consentement: { accompagnement: boolean; mesure_impact: boolean; mode: 'oral_confirme' | 'signe_ecran' };
  mode_contact: string;
  besoin_linguistique: 'autonome' | 'avec_appui' | 'interprete';
  demande: string;
  ageDemandeur: number;
  urgences: Record<string, boolean>;
  diagnostic: Diagnostic;
  simulation: { mode: 'franceconnect' | 'rapide'; resultats: SimItem[]; comptes: Record<string, boolean> };
  plan: PlanItem[];
}

export const URGENCES = [
  { id: 'hebergement', label: 'Rupture d’hébergement < 7 jours', conduite: 'Appeler le 115. Mettre l’abri à l’abri d’abord.' },
  { id: 'energie', label: 'Coupure d’énergie imminente', conduite: 'FSL Énergie Curative en urgence + fournisseur.' },
  { id: 'expulsion', label: 'Expulsion engagée', conduite: 'FSL Habitat + DALO + accompagnement juridique.' },
  { id: 'violences', label: 'Violences révélées', conduite: '3919 (femmes) / 116 006 (France Victimes). Ne jamais renvoyer vers le domicile dangereux.' },
  { id: 'enfance', label: 'Mineur en danger', conduite: 'Appeler le 119.' },
  { id: 'psy', label: 'Détresse psychique', conduite: '3114. AERER. Ne jamais laisser repartir une personne suicidaire sans solution pour les prochaines heures.' },
];

function diagnosticVide(): Diagnostic {
  return {
    bloc1: { vie: 'seul', matrimonial: 'celibataire', enfants: [] },
    bloc2: { nationalite: 'fr', en_france_depuis: '', a_paris_depuis: '', paris_3ans_sur_5: false },
    bloc3: { statut: 'inactif' },
    bloc4: { statut: 'locataire_prive', suroccupation: false, insalubrite: false, expulsion_en_cours: false, dette_locative: false, loyer: 0, charges: 0 },
    bloc5: { salaire_net: 0, percues: [], cheque_energie_recu: false },
    bloc6: { avis_dispo: false, rfr: 0, parts: 1, verifs: { enfants_presents_scolarises: true, regime_matrimonial_ok: true, demi_part_parent_isole_ok: true }, anomalie_orientation_sip: false },
    bloc7: { couverture: 'aucune', complementaire: 'aucune', ald: false, aidant: false },
  };
}

function etatInitial(): WizardState {
  return {
    draftId: `draft-${Math.floor(Date.now() / 1000)}`,
    ephemere: false,
    etape: 1,
    consentement: { accompagnement: false, mesure_impact: false, mode: 'oral_confirme' },
    mode_contact: 'permanence',
    besoin_linguistique: 'autonome',
    demande: '',
    ageDemandeur: 0,
    urgences: {},
    diagnostic: diagnosticVide(),
    simulation: { mode: 'rapide', resultats: [], comptes: {} },
    plan: [],
  };
}

const CLE = 'radar:draft';

interface Ctx {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
  setBloc: <K extends keyof Diagnostic>(bloc: K, value: Diagnostic[K]) => void;
  reset: () => void;
}

const WizardContext = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(() => {
    try {
      const raw = localStorage.getItem(CLE);
      if (raw) return { ...etatInitial(), ...JSON.parse(raw) };
    } catch {
      /* stockage indisponible — on continue en mémoire */
    }
    return etatInitial();
  });

  // Autosave — sauf en mode éphémère (consentement case 1 refusé).
  useEffect(() => {
    if (state.ephemere) {
      localStorage.removeItem(CLE);
      return;
    }
    try {
      localStorage.setItem(CLE, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const set = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));
  const setBloc = <K extends keyof Diagnostic>(bloc: K, value: Diagnostic[K]) =>
    setState((s) => ({ ...s, diagnostic: { ...s.diagnostic, [bloc]: value } }));
  const reset = () => {
    localStorage.removeItem(CLE);
    setState(etatInitial());
  };

  return (
    <WizardContext.Provider value={{ state, set, setBloc, reset }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard hors WizardProvider');
  return ctx;
}
