import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/session';
import { creerDossier } from '@/lib/dossiers';
import { etatInitialWizard, diagnosticVide } from '@/wizard/store';
import { Bascule, Selecteur, EncadreBleu, EncadreVigilance } from '@/ui/fields';

// Détection flash : aller-vers, < 5 minutes, langage courant (§8).
export function TiersLieu() {
  const { session } = useSession();
  const nav = useNavigate();
  const [r, setR] = useState({
    couchage: 'hotel_social' as 'hotel_social' | 'chu_chrs' | 'tiers' | 'logement',
    dls: false,
    enfants: true,
    secu: false,
    caf: false,
    titre: true,
    navigo: false,
    cheque: false,
    activites: false,
    urgent: false,
  });
  const set = (p: Partial<typeof r>) => setR((s) => ({ ...s, ...p }));

  const pistes: string[] = [];
  if (r.couchage === 'hotel_social' || r.couchage === 'chu_chrs') pistes.push('DLS prioritaire (+ DALO si délai dépassé)', 'Banque Solidaire de l’Équipement (à la sortie d’hébergement)', 'Domiciliation');
  if (!r.dls) pistes.push('Créer la demande de logement social (n° INE)');
  if (!r.secu) pistes.push('Couverture maladie : PUMA ou AME selon situation');
  if (!r.caf) pistes.push('CAF : RSA / Prime d’activité / AF / APL potentiellement non perçus');
  if (r.titre) pistes.push('Vérifier l’échéance du titre de séjour (renouvellement à anticiper)');
  if (!r.navigo) pistes.push('Solidarité Transport (selon AME/RSA) + Imagine R (remboursement Ville de Paris)');
  if (r.couchage === 'logement' && !r.cheque) pistes.push('Chèque énergie (vérifier l’adresse fiscale)');
  if (r.enfants && !r.activites) pistes.push('Réduc’Sport / Pass’Sport / Ticket Loisirs');
  if (r.urgent) pistes.push('⚠️ Élément urgent cette semaine → voir page Urgences');

  function creerRdvCad() {
    const w = etatInitialWizard();
    const d = diagnosticVide();
    d.bloc4.statut = r.couchage === 'logement' ? 'locataire_prive' : 'heberge';
    if (r.couchage !== 'logement') d.bloc4.hebergement = r.couchage === 'chu_chrs' ? 'chu_chrs' : 'hotel_social';
    if (r.enfants) d.bloc1.enfants = [{ age: 8, scolarise_france: true, garde_alternee: false, reste_au_pays: false, handicap: false }];
    d.bloc7.couverture = r.secu ? 'puma' : 'aucune';
    if (r.dls) d.bloc4.dls = { existe: true, actualisee: false };
    w.diagnostic = d;
    w.mode_contact = 'tiers_lieu';
    w.demande = 'Repérage tiers-lieu — à reprendre en RDV CAD. Pistes : ' + pistes.join(' ; ');
    const dossier = creerDossier(session!.nom, { origine: 'flash', profil_type: 'primo_arrivant', wizard: w });
    nav(`/dossier/${dossier.id}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Mode tiers-lieu — détection flash</h1>
      <p className="mb-4 text-marine/70">Repérage rapide pendant les activités collectives. ~5 minutes, langage courant.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4">
          <label className="mb-1 block font-semibold">1. Où dormez-vous en ce moment ?</label>
          <Selecteur value={r.couchage} onChange={(couchage) => set({ couchage })}
            options={[{ value: 'hotel_social', label: 'Hôtel social' }, { value: 'chu_chrs', label: 'CHU / CHRS' }, { value: 'tiers', label: 'Chez quelqu’un' }, { value: 'logement', label: 'Logement à soi' }]} />
          <div className="mt-3 space-y-1">
            <Bascule label="2. Demande de logement social en cours (avec numéro) ?" checked={r.dls} onChange={(dls) => set({ dls })} />
            <Bascule label="3. Des enfants ?" checked={r.enfants} onChange={(enfants) => set({ enfants })} />
            <Bascule label="4. Sécurité sociale / mutuelle ?" checked={r.secu} onChange={(secu) => set({ secu })} />
            <Bascule label="5. De l’argent de la CAF en ce moment ?" checked={r.caf} onChange={(caf) => set({ caf })} />
            <Bascule label="6. Un titre de séjour ?" checked={r.titre} onChange={(titre) => set({ titre })} />
            <Bascule label="7. Un passe Navigo ?" checked={r.navigo} onChange={(navigo) => set({ navigo })} />
            <Bascule label="8. Vous recevez le chèque énergie ?" checked={r.cheque} onChange={(cheque) => set({ cheque })} />
            <Bascule label="9. Les enfants font du sport / des activités ?" checked={r.activites} onChange={(activites) => set({ activites })} />
            <Bascule label="10. Quelque chose d’urgent cette semaine ?" checked={r.urgent} onChange={(urgent) => set({ urgent })} />
          </div>
        </div>

        <div className="rounded-xl bg-lave-bleu p-4">
          <h2 className="mb-2 font-bold text-teal">Pistes détectées</h2>
          {r.urgent && <EncadreVigilance>Un élément urgent a été signalé — traiter en priorité.</EncadreVigilance>}
          <ul className="ml-5 list-disc text-sm">{pistes.map((p, i) => <li key={i}>{p}</li>)}</ul>
          <EncadreBleu>Préréglage « famille hôtel social » : DLS/DALO, équipement, domiciliation, AME/PUMA, scolarité.</EncadreBleu>
          <button onClick={creerRdvCad} className="mt-2 w-full rounded-lg bg-corail px-4 py-3 font-semibold text-white">
            Créer un RDV CAD pré-rempli
          </button>
        </div>
      </div>
    </div>
  );
}
