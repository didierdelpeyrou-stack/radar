// Correspondance dispositif → jeu de pièces justificatives (Annexe B).
import { PIECES_JUSTIFICATIVES } from '@/domain/pieces';

const MAP: Record<string, string> = {
  rsa: 'rsa_prime_activite',
  prime_activite: 'rsa_prime_activite',
  apl_alf_als: 'apl',
  asf: 'asf',
  aspa: 'aspa',
  css: 'css',
  ame: 'ame',
  puma: 'puma',
  rattachement_enfants: 'rattachement_enfants',
  dls: 'dls',
  pef: 'pef',
  paris_logement: 'casvp_pack_familles',
  plf: 'casvp_pack_familles',
  plfm: 'casvp_pack_familles',
  paris_solidarite: 'casvp_pack_familles',
  solidarite_transport: 'solidarite_transport',
  imagine_r: 'imagine_r_scolaire',
};

export function piecesPour(dispositifId: string): string[] {
  const cle = MAP[dispositifId];
  return cle ? (PIECES_JUSTIFICATIVES[cle] ?? []) : [];
}
