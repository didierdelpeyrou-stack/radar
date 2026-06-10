// Date de référence unique de l'application.
// Verrou J+2 n°3 (concertation Argus × Studio Cyber, 11/06/2026) : les dates
// codées en dur '2026-06-10/11' figeaient les âges et alertes titre de séjour
// à juin 2026 (faux négatifs silencieux dès que le temps passe).
// Les tests (personas.test.ts) gardent leur propre date FIXE : c'est voulu,
// un test d'acceptation doit être reproductible.

/** Date du jour au format ISO court (YYYY-MM-DD), fuseau local. */
export function aujourdHui(): string {
  const d = new Date();
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}
