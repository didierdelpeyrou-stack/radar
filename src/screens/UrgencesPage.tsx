import { URGENCES } from '@/wizard/store';
import { ContactReferent } from '@/ui/ContactReferent';

const NUMEROS = [
  ['115', 'Hébergement d’urgence'], ['119', 'Enfance en danger'], ['3919', 'Violences faites aux femmes'],
  ['116 006', 'France Victimes'], ['3114', 'Prévention du suicide'], ['15', 'SAMU'], ['17', 'Police-secours'],
];

export function UrgencesPage() {
  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Urgences</h1>
      <p className="mb-5 text-marine/70">
        Traiter l’urgence d’abord. Ne jamais laisser une situation à risque sans solution — et ne
        jamais rester seul·e face à une situation difficile.
      </p>

      <ContactReferent />

      <h2 className="mb-2 mt-8 text-xl font-bold">Numéros essentiels</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NUMEROS.map(([n, l]) => (
          <div key={n} className="rounded-xl border border-marine/15 bg-white p-4">
            <div className="text-3xl font-extrabold text-marine">{n}</div>
            <div className="text-marine/70">{l}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-xl font-bold">Conduites à tenir</h2>
      <ul className="space-y-2">
        {URGENCES.map((u) => (
          <li key={u.id} className="rounded-xl border border-marine/15 bg-white p-3">
            <strong>{u.label}</strong> — {u.conduite}
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border-l-4 border-teal bg-lave-bleu p-4">
        <strong>Détresse psychique — protocole 3114 :</strong> AÉRER (Accueillir, Écouter, Rassurer,
        Encourager, Recommander). Ne jamais laisser repartir une personne suicidaire sans solution
        concrète pour les prochaines heures.
      </div>
    </div>
  );
}
