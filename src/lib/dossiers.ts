// Store des dossiers — local-first (localStorage) avec abonnement réactif.
// Source de vérité côté client tant que Supabase n'est pas câblé ; l'API est
// volontairement proche d'un repository pour faciliter la bascule (insert/update/list).

import type { WizardState } from '@/wizard/store';
import { etatInitialWizard } from '@/wizard/store';

export interface Rdv {
  date: string;
  duree_min: number;
  contenu: string;
  prochaine_etape: string;
}

export type ProfilType = 'famille' | 'isole' | 'handicap' | 'primo_arrivant' | 'senior' | '';

export interface Dossier {
  id: string;
  ref: string; // SR-2026-0001
  accompagnant: string;
  profil_type: ProfilType;
  statut: 'actif' | 'clos';
  motif_cloture?: string;
  synthese_cloture?: string;
  createdAt: string;
  derniereIntervention: string;
  origine?: 'wizard' | 'flash';
  wizard: WizardState;
  rdv: Rdv[];
}

const CLE = 'radar:dossiers';
let cache: Dossier[] = charger();
const listeners = new Set<() => void>();

function charger(): Dossier[] {
  try {
    const raw = localStorage.getItem(CLE);
    return raw ? (JSON.parse(raw) as Dossier[]) : [];
  } catch {
    return [];
  }
}
function persister() {
  try {
    localStorage.setItem(CLE, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function getSnapshot() {
  return cache;
}
export function getDossier(id: string) {
  return cache.find((d) => d.id === id);
}

function nouvelleRef(): string {
  const annee = new Date().getFullYear();
  const n = cache.filter((d) => d.ref.includes(`SR-${annee}`)).length + 1;
  return `SR-${annee}-${String(n).padStart(4, '0')}`;
}

export function creerDossier(accompagnant: string, partiel?: Partial<Dossier>): Dossier {
  const id = `d-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
  const now = new Date().toISOString();
  const d: Dossier = {
    id,
    ref: nouvelleRef(),
    accompagnant,
    profil_type: '',
    statut: 'actif',
    createdAt: now,
    derniereIntervention: now,
    origine: 'wizard',
    wizard: etatInitialWizard(),
    rdv: [],
    ...partiel,
  };
  cache = [d, ...cache];
  persister();
  return d;
}

export function majDossier(id: string, patch: Partial<Dossier>) {
  cache = cache.map((d) =>
    d.id === id ? { ...d, ...patch, derniereIntervention: new Date().toISOString() } : d,
  );
  persister();
}

export function majWizard(id: string, wizard: WizardState) {
  const d = getDossier(id);
  if (!d || d.wizard.ephemere) return; // mode éphémère : pas de persistance
  majDossier(id, { wizard });
}

export function supprimerDossier(id: string) {
  cache = cache.filter((d) => d.id !== id);
  persister();
}

export function ajouterRdv(id: string, rdv: Rdv) {
  const d = getDossier(id);
  if (!d) return;
  majDossier(id, { rdv: [...d.rdv, rdv] });
}
