// Tri du plan d'action selon les 3 critères du protocole (§ étape 5), dans l'ordre :
// (1) urgence vitale/sécurité, (2) impact financier mensuel récurrent, (3) effet d'entraînement.
import type { ResultatDetection } from '@/engine/model';

const URGENCE = new Set(['fsl_energie_cur', 'fsl_habitat', 'dalo']);
const IMPACT_MENSUEL = new Set(['rsa', 'aah', 'apl_alf_als', 'prime_activite', 'aspa', 'plfm', 'plf', 'paris_logement', 'paris_solidarite', 'asf']);
const ENTRAINEMENT = new Set(['css', 'solidarite_transport', 'puma', 'ame']);

export function scorePriorite(id: string): number {
  if (URGENCE.has(id)) return 0;
  if (IMPACT_MENSUEL.has(id)) return 1;
  if (ENTRAINEMENT.has(id)) return 2;
  return 3;
}

export function trierPlan(items: ResultatDetection[]): ResultatDetection[] {
  return [...items].sort(
    (a, b) => scorePriorite(a.dispositif_id) - scorePriorite(b.dispositif_id) || a.nom.localeCompare(b.nom, 'fr'),
  );
}
