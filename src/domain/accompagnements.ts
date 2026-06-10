// Palette des accompagnements — les cinq niveaux d'orientation interne.
// Source : « Notre accueil, le revoir ensemble » (CA du 09/06/2026) + rapport
// d'activité 2025. Le Conseil d'administration a retenu le scénario 2 (accueil
// centre social transversal) : l'orientation se fait de façon différenciée selon
// le niveau d'accompagnement requis, sans hiérarchie de valeur. Cette palette
// protège aussi les écrivains publics, dont le rôle n'est pas de se substituer
// aux travailleurs sociaux.

export type NiveauAccompagnement =
  | 'autonomie_accompagnee'
  | 'aide_ponctuelle'
  | 'ecrivain_public'
  | 'situation_complexe'
  | 'orientation_externe';

export const ACCOMPAGNEMENTS: {
  value: NiveauAccompagnement;
  label: string;
  ce_que_cest: string;
  qui: string;
}[] = [
  {
    value: 'autonomie_accompagnee',
    label: 'Autonomie accompagnée',
    ce_que_cest: 'La personne fait seule sa démarche ; un appui ponctuel reste possible.',
    qui: 'Poste en libre accès, appui de l’accueil si besoin.',
  },
  {
    value: 'aide_ponctuelle',
    label: 'Aide administrative ponctuelle',
    ce_que_cest:
      'Un geste simple et rapide, pris en charge à l’accueil si le référent salarié est disponible et que la démarche prend moins de 10 à 15 minutes ; sinon, prise de rendez-vous avec un écrivain public.',
    qui: 'Accueil (référent salarié) ou écrivain public.',
  },
  {
    value: 'ecrivain_public',
    label: 'Accompagnement par écrivain public référent',
    ce_que_cest:
      'Suivi par un écrivain public sur une démarche à faire en plusieurs fois, si le bénévole et l’usager sont d’accord ; ou via les permanences retraite et logement.',
    qui: 'Écrivain public référent (permanences retraite, logement).',
  },
  {
    value: 'situation_complexe',
    label: 'Situation complexe — référent professionnel',
    ce_que_cest:
      'Cumul de difficultés, droits multiples, fragilités : un suivi par un professionnel est nécessaire.',
    qui: 'Coordinateur / référent de pôle, ou intervenant spécialisé.',
  },
  {
    value: 'orientation_externe',
    label: 'Orientation externe — partenaire',
    ce_que_cest: 'La demande relève d’un autre acteur du territoire, mieux placé pour y répondre.',
    qui: 'Partenaire social compétent (Maison des solidarités, services spécialisés).',
  },
];
