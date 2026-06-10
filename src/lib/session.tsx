// Session courante (rôle + nom). En l'absence d'auth Supabase câblée, on travaille
// en mode local-first : la session est choisie à la connexion et persistée. Le
// passage à Supabase Auth ne changera que cette couche (mêmes rôles, §1).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Role = 'admin' | 'cad' | 'ep' | 'accueil';

export interface Session {
  nom: string;
  role: Role;
}

export const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'admin', label: 'Coordination / direction', desc: 'Tout : dossiers, impact, référentiels, utilisateurs' },
  { value: 'cad', label: 'Chargé·e d’accès aux droits', desc: 'Tous les dossiers, diagnostics, plans, clôture' },
  { value: 'ep', label: 'Écrivain·e public', desc: 'Dossiers affectés + diagnostics' },
  { value: 'accueil', label: 'Accueil — première ligne', desc: 'Simulation flash 10 min + prise de RDV avec un CAD' },
];

const CLE = 'radar:session';

interface Ctx {
  session: Session | null;
  connecter: (s: Session) => void;
  deconnecter: () => void;
}
const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem(CLE);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (session) localStorage.setItem(CLE, JSON.stringify(session));
      else localStorage.removeItem(CLE);
    } catch {
      /* ignore */
    }
  }, [session]);

  return (
    <SessionContext.Provider
      value={{ session, connecter: setSession, deconnecter: () => setSession(null) }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession hors SessionProvider');
  return ctx;
}

/** Droits dérivés du rôle (cf. tableau §1). */
export function peut(role: Role | undefined) {
  return {
    voirDossiers: role === 'admin' || role === 'cad' || role === 'ep',
    voirImpact: role === 'admin',
    editerReferentiels: role === 'admin',
    // Accueil (première ligne) : simulation flash + prise de RDV CAD, sans accès
    // aux dossiers nominatifs. Les CAD/admin peuvent aussi lancer une simulation flash.
    simulationFlash: role === 'accueil' || role === 'cad' || role === 'admin',
    accueilSeul: role === 'accueil',
  };
}

/** Liste des CAD connus (pour la prise de RDV). En attendant l'annuaire Supabase,
 *  on agrège les noms vus comme référents + quelques entrées par défaut. */
export function listeCad(): string[] {
  try {
    const dossiers = JSON.parse(localStorage.getItem('radar:dossiers') || '[]') as { accompagnant?: string }[];
    const noms = new Set<string>(dossiers.map((d) => d.accompagnant || '').filter(Boolean));
    return [...noms].sort();
  } catch {
    return [];
  }
}
