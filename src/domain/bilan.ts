// ─────────────────────────────────────────────────────────────────────────
// Indicateurs clés du projet 2024N0043 « Agir contre le non-recours aux droits
// pour améliorer le pouvoir d'achat ».
// Sources :
//  • Rapport d'évaluation d'impact — cabinet Improve, mai 2026 (échantillon de
//    suivi N=21 diagnostics réalisés avant le 15/04, entretiens N=14).
//  • Bilan intermédiaire n°1 — données d'activité cumulées arrêtées au 09/06/2026.
// La finalité du projet est le POUVOIR D'ACHAT : tout se lit comme une chaîne
// droits repérés → démarches → aides → pouvoir d'achat. À actualiser au prochain
// bilan (NE PAS recalculer côté outil).
// ─────────────────────────────────────────────────────────────────────────

export const BILAN_BI1 = {
  arrete_au: '2026-06-09',
  source:
    'Rapport d’impact Improve (mai 2026, N=21) — bilan intermédiaire n°1 (données au 09/06/2026)',

  // Activité (bilan intermédiaire, cumul au 9 juin)
  diagnostics_complets: 25,
  diagnostics_evalues: 21, // échantillon du rapport d'impact
  droits_reperes: 44,

  // Efficacité (rapport d'impact, N=21)
  part_avec_droit_pct: 81, // % de diagnostics ouvrant au moins un droit
  droits_moyen_par_diag: 1.7,
  suivi_demarches_pct: 43, // 9 diagnostics sur 21 suivis d'un RDV de démarches

  // Profil des bénéficiaires (rapport d'impact, N=21)
  public: [
    { label: 'de femmes', valeur: '57 %' },
    { label: 'd’âge moyen (38 % ont plus de 60 ans)', valeur: '54 ans' },
    { label: 'familles monoparentales', valeur: '48 %' },
    { label: 'sans hébergement durable', valeur: '43 %' },
    { label: 'habitent le 11ᵉ', valeur: '70 %' },
  ],

  droits_par_categorie: [
    { categorie: 'Logement', mentions: 16 },
    { categorie: 'Solidarité', mentions: 11 },
    { categorie: 'Énergie', mentions: 9 },
    { categorie: 'Personnes âgées', mentions: 3 },
    { categorie: 'Transport', mentions: 3 },
    { categorie: 'Santé', mentions: 2 },
  ],

  // POUVOIR D'ACHAT — la finalité (rapport d'impact, pp. 62-63)
  pouvoir_achat: {
    intro:
      'Tous les droits repérés sont à effet budgétaire direct : aides au logement, RSA, prime d’activité, chèque énergie, aides municipales, complémentaire santé solidaire, tarification solidaire des transports.',
    aides_obtenues: 2, // bénéficiaires déjà aidés au moment de l'évaluation (délais)
    moins_stresses: '4 sur 11', // se sentent moins stressés à l'idée de recevoir l'aide
    effets_projetes: [
      'Acheter des meubles ou augmenter le chauffage',
      'S’occuper de ses enfants',
      'Se désendetter',
      'Soulager les proches aidants',
    ],
  },
} as const;
