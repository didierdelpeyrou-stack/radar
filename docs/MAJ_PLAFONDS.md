# Mise à jour annuelle des plafonds et montants

Le protocole fait l'objet d'une **revue annuelle**. Tous les montants/plafonds de
RADAR portent `a_verifier_avant_prod: true` + une `date_source` ; l'écran admin
affiche en rouge tout paramètre dont `date_source` remonte à plus de 12 mois.

## Procédure

1. **Source de vérité** : `src/domain/catalogue.ts`. Mettre à jour `montant`,
   les valeurs dans `conditions` (plafonds, QF, RFR/UC, âges), `date_source` et
   `source` pour chaque dispositif modifié.
2. **Relancer la suite de tests** — obligatoire après tout changement de règle
   (protocole §3.4) : `npm test`. Les 4 personas (§9) doivent rester verts ; ajuster
   les attendus seulement si le barème officiel l'impose réellement.
3. **Régénérer le seed** : `npm run seed:sql` → met à jour `supabase/seed.sql`.
4. **Appliquer en base** : rejouer le seed (les `insert … on conflict do update`
   mettent à jour `conditions` et `date_source` sans dupliquer). Bumper la `version`
   de la règle si la logique change (le diff de versions est conservé côté admin).

## Sources de référence par niveau

- **National** (RSA, PA, AF, ARS, ASF, AAH, ASPA, CSS, chèque énergie) :
  `service-public.fr`, circulaires CNAV, `chequeenergie.gouv.fr`.
- **CASVP / Ville de Paris** (Paris Logement ×3, Paris Solidarité, PEF, FSL…) :
  mémo CASVP annuel (référence interne : « mémo CASVP 01/02/AAAA »), `paris.fr`.
- **Île-de-France Mobilités** (Solidarité Transport, Imagine R) :
  `iledefrance-mobilites.fr`.

## Points connus à fiabiliser (cf. ROADMAP « Dette »)

- Plafonds CASVP différenciés couple/seul et coefficients FSL : remplacer les
  plafonds uniques conservateurs du MVP par les barèmes exacts par composition.
- Allocation frais de santé (CASVP, délibération du 14/10/2025) : extraire les
  conditions de la délibération et l'articulation avec Complément Santé Paris / CSS.
