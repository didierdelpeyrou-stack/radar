import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession, ROLES, type Role } from '@/lib/session';

export function Login() {
  const { connecter } = useSession();
  const nav = useNavigate();
  const [nom, setNom] = useState('');
  const [role, setRole] = useState<Role>('cad');

  return (
    <div className="flex min-h-screen items-center justify-center bg-marine p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-marine">RADAR</h1>
        <p className="mb-5 text-sm text-teal">
          Repérage des Aides et Droits A activer en non-Recours · Solidarité Roquette
        </p>
        <label className="mb-1 block font-semibold">Votre nom</label>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Prénom Nom"
          className="mb-4 w-full rounded-lg border border-marine/30 px-3 py-2"
        />
        <div className="mb-1 font-semibold">Votre rôle</div>
        <div className="mb-5 space-y-2">
          {ROLES.map((r) => (
            <label key={r.value} className={`block cursor-pointer rounded-lg border p-3 ${role === r.value ? 'border-teal bg-lave-bleu' : 'border-marine/20'}`}>
              <input type="radio" name="role" className="mr-2 accent-teal" checked={role === r.value} onChange={() => setRole(r.value)} />
              <span className="font-semibold">{r.label}</span>
              <div className="ml-6 text-sm text-marine/70">{r.desc}</div>
            </label>
          ))}
        </div>
        <button
          disabled={!nom.trim()}
          onClick={() => {
            connecter({ nom: nom.trim(), role });
            nav('/');
          }}
          className="w-full rounded-lg bg-teal px-4 py-3 font-semibold text-white disabled:opacity-40"
        >
          Se connecter
        </button>
        <p className="mt-4 text-xs text-marine/50">
          Mode local-first (pilote). En production : Supabase Auth + MFA pour les administrateurs.
          Aucune donnée ne quitte ce poste tant que la synchronisation H/IA n’est pas activée.
        </p>
      </div>
    </div>
  );
}
