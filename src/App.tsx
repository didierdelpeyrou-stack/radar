import { HashRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { SessionProvider, useSession, peut } from '@/lib/session';
import { MOTEUR_VERSION } from '@/engine/engine';
import { Login } from '@/screens/Login';
import { Dashboard } from '@/screens/Dashboard';
import { DossierScreen } from '@/screens/DossierScreen';
import { DashboardImpact } from '@/screens/DashboardImpact';
import { AdminReferentiels } from '@/screens/AdminReferentiels';
import { UrgencesPage } from '@/screens/UrgencesPage';
import { Mentions } from '@/screens/Mentions';
import { Demo } from '@/screens/Demo';
import { Sources } from '@/screens/Sources';
import { SimulationFlash } from '@/screens/SimulationFlash';
import { FeedbackAmpoule } from '@/ui/FeedbackAmpoule';

function Layout({ children }: { children: React.ReactNode }) {
  const { session, deconnecter } = useSession();
  const nav = useNavigate();
  const d = peut(session?.role);
  const lien = 'rounded-lg px-3 py-1 text-sm';
  const actif = ({ isActive }: { isActive: boolean }) =>
    `${lien} ${isActive ? 'bg-white text-marine' : 'bg-white/15 text-white'}`;

  return (
    <div className="min-h-screen">
      <header className="bg-marine text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 p-4">
          <div className="mr-auto">
            <div className="text-lg font-bold">RADAR</div>
            <div className="text-xs text-white/60">Solidarité Roquette · {MOTEUR_VERSION}</div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {d.voirDossiers && <NavLink to="/" end className={actif}>Dossiers</NavLink>}
            {d.simulationFlash && <NavLink to="/flash" className={actif}>Simulation 10 min</NavLink>}
            {d.voirImpact && <NavLink to="/impact" className={actif}>Impact</NavLink>}
            {d.editerReferentiels && <NavLink to="/admin" className={actif}>Référentiels</NavLink>}
            <NavLink to="/demo" className={actif}>Démo</NavLink>
            <NavLink to="/sources" className={actif}>Sources</NavLink>
            <NavLink to="/mentions" className={actif}>Mentions</NavLink>
            <button onClick={() => nav('/urgences')} className={`${lien} border border-white/40 bg-white/10 font-semibold`}>Urgences</button>
            <button onClick={() => { deconnecter(); nav('/login'); }} className={`${lien} bg-white/15`}>
              {session?.nom} ✕
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
      <FeedbackAmpoule />
    </div>
  );
}

function Protege({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  if (!session) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

/** Réserve une route aux rôles ayant accès aux dossiers nominatifs (exclut accueil). */
function SansAccueil({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role === 'accueil') return <Navigate to="/flash" replace />;
  return <Layout>{children}</Layout>;
}

function Accueil() {
  const { session } = useSession();
  // Le rôle « accueil » (première ligne) entre directement sur la simulation flash.
  if (session?.role === 'accueil') return <Navigate to="/flash" replace />;
  return <Dashboard />;
}

export function App() {
  return (
    <SessionProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protege><Accueil /></Protege>} />
          <Route path="/dossier/:id" element={<SansAccueil><DossierScreen /></SansAccueil>} />
          <Route path="/impact" element={<SansAccueil><DashboardImpact /></SansAccueil>} />
          <Route path="/admin" element={<SansAccueil><AdminReferentiels /></SansAccueil>} />
          <Route path="/urgences" element={<Protege><UrgencesPage /></Protege>} />
          <Route path="/mentions" element={<Protege><Mentions /></Protege>} />
          <Route path="/sources" element={<Protege><Sources /></Protege>} />
          <Route path="/flash" element={<Protege><SimulationFlash /></Protege>} />
          <Route path="/demo" element={<Protege><Demo /></Protege>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </SessionProvider>
  );
}
