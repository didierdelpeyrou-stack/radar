import { URGENCES } from '@/wizard/store';

const NUMEROS = [
  ['115', 'Hébergement d’urgence'], ['119', 'Enfance en danger'], ['3919', 'Violences faites aux femmes'],
  ['116 006', 'France Victimes'], ['3114', 'Prévention du suicide'], ['15', 'SAMU'], ['17', 'Police-secours'],
];

export function UrgencesPage() {
  return (
    <div className="rounded-2xl bg-corail p-6 text-white">
      <h1 className="text-3xl font-bold">Urgences</h1>
      <p className="mb-4 text-white/90">Traiter l’urgence d’abord. Ne jamais laisser une situation à risque sans solution.</p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NUMEROS.map(([n, l]) => (
          <div key={n} className="rounded-xl bg-white/15 p-4">
            <div className="text-3xl font-extrabold">{n}</div>
            <div className="text-white/90">{l}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-xl font-bold">Conduites à tenir</h2>
      <ul className="space-y-2">
        {URGENCES.map((u) => (
          <li key={u.id} className="rounded-xl bg-white/10 p-3">
            <strong>{u.label}</strong> — {u.conduite}
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl bg-marine p-4">
        <strong>Détresse psychique — protocole 3114 :</strong> AÉRER (Accueillir, Écouter, Rassurer,
        Encourager, Recommander). Ne jamais laisser repartir une personne suicidaire sans solution
        concrète pour les prochaines heures.
      </div>
    </div>
  );
}
