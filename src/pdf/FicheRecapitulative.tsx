// PDF « Fiche récapitulative » (terminologie exacte — JAMAIS « fiche navette »).
// Reprend la structure du document officiel : consentement tracé, synthèse des
// 7 blocs, synthèse mesdroitssociaux, dispositifs locaux, plan d'action priorisé.
// Remise systématique à la personne (« c'est votre fil rouge »).

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { WizardState } from '@/wizard/store';
import type { ResultatDetection } from '@/engine/model';
import { trierPlan } from '@/wizard/priorite';
import { ressourcesMensuelles } from '@/wizard/calculs';

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: '#1B2443', fontFamily: 'Helvetica' },
  h1: { fontSize: 16, marginBottom: 2, color: '#1B2443' },
  sub: { fontSize: 9, color: '#105363', marginBottom: 10 },
  h2: { fontSize: 12, marginTop: 12, marginBottom: 4, color: '#105363' },
  row: { marginBottom: 2 },
  li: { marginBottom: 2 },
  note: { fontSize: 8, color: '#666', marginTop: 4 },
  banner: { backgroundColor: '#FCEBEA', padding: 6, marginVertical: 6, fontSize: 9 },
});

interface FicheProps {
  state: WizardState;
  res: ResultatDetection[];
  prochainRdv?: string;
  /** Résumé FALC rédigé par l'IA souveraine (Gemma, H/IA) et RELU par l'accompagnant.
   *  Optionnel : la fiche se génère aussi bien sans IA. */
  resumeFalc?: string;
}

function Fiche({ state, res, prochainRdv, resumeFalc }: FicheProps) {
  const d = state.diagnostic;
  const elig = trierPlan(res.filter((r) => r.verdict === 'eligible_probable'));
  const ordre = res.filter((r) => r.verdict === 'deja_percu');
  const non = res.filter((r) => r.verdict === 'non_eligible');
  // Verrou J+2 n°2 : le PDF reflète les CHOIX de la personne (state.plan),
  // pas seulement la liste brute des éligibilités.
  const engages = state.plan.filter((p) => p.souhaite_engager);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Fiche récapitulative</Text>
        <Text style={s.sub}>RADAR · Centre Social et Culturel Solidarité Roquette · {state.draftId}</Text>

        <View style={s.banner}>
          <Text>Estimation indicative — les démarches restent à faire et seules les
            administrations ouvrent les droits. C’est votre fil rouge : gardez ce document.</Text>
        </View>

        {resumeFalc && (
          <>
            <Text style={s.h2}>En résumé, avec des mots simples</Text>
            <Text style={s.row}>{resumeFalc}</Text>
            <Text style={s.note}>
              Résumé rédigé avec l’aide d’une IA locale souveraine (serveur H/IA, France) et relu
              par votre accompagnant·e. L’IA reformule : elle ne décide d’aucun droit.
            </Text>
          </>
        )}

        <Text style={s.h2}>Consentement</Text>
        <Text style={s.row}>Accompagnement : {state.consentement.accompagnement ? 'oui' : 'non'} · Mesure d’impact : {state.consentement.mesure_impact ? 'oui' : 'non'} · Mode : {state.consentement.mode}</Text>

        <Text style={s.h2}>Synthèse de la situation</Text>
        <Text style={s.row}>Foyer : {d.bloc1.vie}, {d.bloc1.enfants.length} enfant(s) · Nationalité : {d.bloc2.nationalite} · Paris 3/5 : {d.bloc2.paris_3ans_sur_5 ? 'oui' : 'non'}</Text>
        <Text style={s.row}>Logement : {d.bloc4.statut} — loyer {d.bloc4.loyer} € + {d.bloc4.charges} € charges</Text>
        <Text style={s.row}>Ressources : {ressourcesMensuelles(d)} €/mois · RFR {d.bloc6.rfr} € / {d.bloc6.parts} part(s)</Text>
        <Text style={s.row}>Santé : {d.bloc7.couverture} / {d.bloc7.complementaire}</Text>

        <Text style={s.h2}>Plan d’action — ce qu’on peut demander</Text>
        {elig.map((r, i) => (
          <Text key={r.dispositif_id} style={s.li}>
            {i + 1}. {r.nom} ({r.organisme}){r.montant_estime ? ` — ${r.montant_estime}` : ''}
          </Text>
        ))}

        <Text style={s.h2}>Ce que vous avez choisi d’engager</Text>
        {engages.length ? (
          engages.map((p, i) => (
            <Text key={p.dispositif_id} style={s.li}>
              {i + 1}. {p.nom}
              {p.qui_fait_quoi ? ` — ${p.qui_fait_quoi}` : ''}
              {p.echeance ? ` (échéance : ${p.echeance})` : ''}
            </Text>
          ))
        ) : (
          <Text style={s.row}>Aucune démarche engagée pour l’instant — à décider ensemble au prochain rendez-vous.</Text>
        )}
        {prochainRdv && (
          <Text style={s.row}>
            Prochain rendez-vous de suivi : {new Date(prochainRdv).toLocaleString('fr-FR')}
          </Text>
        )}

        <Text style={s.h2}>Déjà en place</Text>
        {ordre.length ? ordre.map((r) => <Text key={r.dispositif_id} style={s.li}>• {r.nom}</Text>) : <Text style={s.row}>—</Text>}

        <Text style={s.h2}>Ce qui ne vous concerne pas (et pourquoi)</Text>
        {non.map((r) => <Text key={r.dispositif_id} style={s.li}>• {r.nom} — {r.raison}</Text>)}

        <Text style={s.note}>
          Document remis dans le cadre du Protocole de détection des droits sociaux (mai 2026).
          Ne jamais laisser une situation ouverte sans rendez-vous de suivi.
        </Text>
      </Page>
    </Document>
  );
}

/** Génère le PDF et déclenche le téléchargement (côté navigateur). */
export async function genererFichePdf(
  state: WizardState,
  res: ResultatDetection[],
  prochainRdv?: string,
  resumeFalc?: string,
) {
  const blob = await pdf(<Fiche state={state} res={res} prochainRdv={prochainRdv} resumeFalc={resumeFalc} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fiche-recapitulative-${state.draftId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
