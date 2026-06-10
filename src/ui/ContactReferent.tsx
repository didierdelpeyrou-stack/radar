// Carte de contact « ne restez pas seul·e » — affichée dans le panneau urgence
// et l'étape d'accueil. Couleurs douces (pas de rouge agressif). Oriente vers
// le référent du pôle accès aux droits, l'accueil et la direction.

const TEL_ACCUEIL = '01 49 23 81 50';
const MAIL_ACCUEIL = 'accueil@solidariteroquette.fr';

export function ContactReferent() {
  return (
    <div className="rounded-xl border-l-4 border-teal bg-lave-bleu p-4">
      <h2 className="mb-1 text-lg font-bold">En cas d’urgence ou de doute, ne restez pas seul·e</h2>
      <p className="mb-3 text-marine/70">
        Contactez le <strong>référent du pôle accès aux droits</strong>, ou l’<strong>accueil</strong>
        {' '}et la <strong>direction</strong> du centre social.
      </p>
      <ul className="space-y-2">
        <li className="rounded-lg bg-white px-3 py-2">
          <div className="font-semibold">Référent·e du pôle accès aux droits</div>
          <div className="text-marine/70">Sur place pendant les permanences · relais des situations complexes</div>
        </li>
        <li className="rounded-lg bg-white px-3 py-2">
          <div className="font-semibold">Accueil &amp; direction</div>
          <div className="text-marine/70">
            <a href={`tel:${TEL_ACCUEIL.replace(/\s/g, '')}`} className="font-semibold text-teal underline">
              {TEL_ACCUEIL}
            </a>
            {' · '}
            <a href={`mailto:${MAIL_ACCUEIL}`} className="font-semibold text-teal underline">
              {MAIL_ACCUEIL}
            </a>
          </div>
        </li>
      </ul>
    </div>
  );
}
