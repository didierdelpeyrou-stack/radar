export function Mentions() {
  return (
    <div className="prose max-w-3xl">
      <h1 className="text-2xl font-bold">Mentions & registre</h1>
      <h2 className="mt-4 font-bold text-teal">Finalités</h2>
      <p>Structurer et tracer l’accompagnement à l’accès aux droits ; détecter les situations
        de non-recours (dispositifs nationaux et locaux) ; mesurer l’impact du projet de manière anonymisée.</p>
      <h2 className="mt-4 font-bold text-teal">Base légale</h2>
      <p>Consentement de la personne (deux cases distinctes : accompagnement / mesure d’impact),
        recueilli et tracé à l’étape 1. Refus de la case 1 → mode session éphémère, aucune persistance.</p>
      <h2 className="mt-4 font-bold text-teal">Données & minimisation</h2>
      <p>Aucun NIR, aucun numéro de titre de séjour, <strong>aucun identifiant ou mot de passe
        FranceConnect / CAF / Ameli</strong> n’est stocké ni saisi. Données de santé et de situation
        administrative traitées comme catégories particulières, avec RLS stricte.</p>
      <h2 className="mt-4 font-bold text-teal">Durées</h2>
      <p>Durée de l’accompagnement + 24 mois maximum après la dernière intervention, puis
        anonymisation automatique. Indicateurs transmis à la FSU / im-prove / Optimy : strictement anonymisés.</p>
      <h2 className="mt-4 font-bold text-teal">Hébergement</h2>
      <p>Infrastructure H/IA (serveurs UE exclusivement), chiffrement at rest + TLS. Responsable de
        traitement : Solidarité Roquette. Sous-traitant : H/IA (DPA article 28). DPO / référent RGPD
        de l’association : à compléter.</p>
      <h2 className="mt-4 font-bold text-teal">Vos droits</h2>
      <p>Accès, rectification, effacement, opposition exerçables depuis l’app (boutons « Exporter »
        et « Supprimer » sur chaque dossier).</p>
    </div>
  );
}
