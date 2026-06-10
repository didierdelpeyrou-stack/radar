// Génère supabase/seed.sql à partir du catalogue TS (source de vérité) + PJ.
//   npm run seed:sql
// Le moteur utilise le catalogue TS ; la base reçoit les mêmes données pour
// l'écran admin (édition des règles/plafonds sans redéploiement, §3.2).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DISPOSITIFS } from '../src/domain/catalogue';
import { PIECES_JUSTIFICATIVES } from '../src/domain/pieces';

const q = (s: string | undefined) => (s == null ? 'null' : `'${s.replace(/'/g, "''")}'`);
const jsonb = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const arr = (a: string[] | undefined) =>
  a && a.length ? `array[${a.map((x) => q(x)).join(',')}]` : "'{}'";

const lines: string[] = [
  '-- ⚠️ Fichier généré par scripts/generate-seed.ts — NE PAS éditer à la main.',
  '-- Source de vérité : src/domain/catalogue.ts + src/domain/pieces.ts',
  'begin;',
  '',
];

for (const d of DISPOSITIFS) {
  lines.push(
    `insert into dispositifs (id, nom, organisme, niveau, couvert_par_mds, determinant, description, actif) values (` +
      `${q(d.id)}, ${q(d.nom)}, ${q(d.organisme)}, ${q(d.niveau)}, ${d.couvert_par_mds}, ${q(d.determinant)}, ${q(d.description)}, ${d.actif}) ` +
      `on conflict (id) do update set nom = excluded.nom, description = excluded.description;`,
  );
  if (d.regle) {
    const montants =
      typeof d.montant === 'function'
        ? { note: 'montant calculé par le moteur (paliers) — voir catalogue.ts' }
        : { libelle: d.montant ?? null };
    lines.push(
      `insert into regles (dispositif_id, version, conditions, montants, non_cumuls, declencheurs, date_source, source, a_verifier) values (` +
        `${q(d.id)}, ${q(d.regle.version)}, ${jsonb(d.regle.conditions)}, ${jsonb(montants)}, ${arr(d.regle.non_cumuls)}, ${arr(d.regle.declencheurs)}, ${q(d.regle.date_source)}, ${q(d.regle.source)}, ${d.regle.a_verifier_avant_prod}) ` +
        `on conflict (dispositif_id, version) do update set conditions = excluded.conditions, date_source = excluded.date_source;`,
    );
  }
}

lines.push('');
for (const [demarche, items] of Object.entries(PIECES_JUSTIFICATIVES)) {
  lines.push(
    `insert into pieces_justificatives (demarche_id, items) values (${q(demarche)}, ${jsonb(items)}) ` +
      `on conflict (demarche_id) do update set items = excluded.items;`,
  );
}

lines.push('', 'commit;', '');

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../supabase/seed.sql');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join('\n'));
console.log(`seed.sql écrit : ${out} (${DISPOSITIFS.length} dispositifs, ${Object.keys(PIECES_JUSTIFICATIVES).length} jeux de PJ)`);
